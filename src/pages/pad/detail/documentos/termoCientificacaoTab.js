/**
 * Aba "Termo de Cientificação" — é aqui que o tipo de defesa (advogado
 * constituído ou defensoria pública) é indicado, e por isso é gravado
 * direto em `pad.defesa.{tipo,advogadoNome,advogadoOab}` — a mesma fonte
 * usada depois por Declarações do Apenado, Manifestação da Defesa e Decisão
 * (ver src/templates/shared/condicionais.js:textoDefensor). É também aqui
 * que nasce o vínculo do defensor ao Portal da Defesa (Fase 6, 2026-07-19),
 * já que é onde o e-mail dele é coletado pela primeira vez.
 *
 * Seleção de advogado da Relação (2026-07-20) — `criarBuscaAdvogado` busca
 * no mesmo índice estático de src/pages/advogados/advogadosPage.js. Ao
 * escolher um resultado, `selecionarAdvogado` aplica os dados direto se o
 * cadastro já estiver `completo`; senão abre o mesmo modal de completude
 * (`src/pages/advogados/advogadoCadastroModal.js`, com a mesma exigência de
 * preencher tudo — inclusive e-mail — e confirmar explicitamente) antes de
 * aplicar. Continua possível digitar nome/OAB/e-mail manualmente sem passar
 * pela busca, como sempre foi.
 */
import {
  criarElemento, carregarCssUmaVez, criarCampo, criarCampoSelect, criarAreaPreview, criarBotao, criarBotaoSalvar,
  criarCardEditavel, salvarSecaoDoPad, criarBotaoConfirmar, criarBotoesConvidarPorEmail,
} from './_shared.js';
import { renderizar as renderizarTermo } from '../../../../templates/termoCientificacaoTemplate.js';
import { vincularDefensorAoPad, desvincularDefensorDoPad, notificarDefensorPorEmail, obterDefensor } from '../../../../services/defensores/defensorService.js';
import { usuarioAtual, obterPerfilDoUsuario } from '../../../../services/auth/authService.js';
import { buscarPorOab } from '../../../../services/advogados/advogadoCadastroService.js';
import { carregarIndiceAdvogados, filtrarIndiceAdvogados } from '../../../../services/advogados/advogadoBuscaService.js';
import { abrirModalEdicao } from '../../../advogados/advogadoCadastroModal.js';
import { mostrarToast } from '../../../../utils/toast.js';

const LIMITE_RESULTADOS_BUSCA_ADVOGADO = 8;

/**
 * Busca de advogado da Relação (2026-07-20) — mesmo índice estático usado em
 * src/pages/advogados/advogadosPage.js. Selecionar um resultado aplica os
 * dados direto nos campos do formulário (`onSelecionar`); quem chama decide
 * o que fazer com um cadastro ainda incompleto (ver uso abaixo).
 */
function criarBuscaAdvogado({ onSelecionar }) {
  const campoBusca = criarElemento('input', {
    class: 'campo__input',
    type: 'search',
    placeholder: 'Buscar advogado da Relação por nome ou OAB…',
  });
  const areaResultados = criarElemento('div');

  let indice = [];
  carregarIndiceAdvogados().then((carregado) => {
    indice = carregado;
  });

  function renderizarResultados(termo) {
    areaResultados.replaceChildren();
    if (!termo.trim()) return;

    const encontrados = filtrarIndiceAdvogados(indice, termo).slice(0, LIMITE_RESULTADOS_BUSCA_ADVOGADO);
    if (!encontrados.length) {
      areaResultados.append(criarElemento('p', { class: 'text-muted' }, ['Nenhum advogado encontrado na Relação — pode digitar os dados manualmente abaixo.']));
      return;
    }

    const lista = criarElemento('ul', { class: 'documentos__lista-itens' });
    lista.replaceChildren(
      ...encontrados.map((item) => {
        const localizacao = [item.cidade, item.estado].filter(Boolean).join('/');
        const botaoEscolher = criarBotao({
          texto: `${item.nome} — OAB nº ${item.oab}${localizacao ? ` — ${localizacao}` : ''}`,
          icon: 'users',
          variante: 'secondary',
          onClick: () => {
            campoBusca.value = '';
            areaResultados.replaceChildren();
            onSelecionar(item.oab);
          },
        });
        return criarElemento('li', { class: 'documentos__item-lista' }, [botaoEscolher]);
      }),
    );
    areaResultados.append(lista);
  }

  campoBusca.addEventListener('input', () => renderizarResultados(campoBusca.value));

  return criarElemento('div', { class: 'documentos__campos' }, [
    criarElemento('label', { class: 'campo' }, [
      criarElemento('span', { class: 'campo__rotulo' }, ['Buscar na Relação de Advogados (opcional)']),
      campoBusca,
    ]),
    areaResultados,
  ]);
}

const OPCOES_DEFESA = [
  { valor: '', rotulo: 'Ainda não indicado' },
  { valor: 'advogado', rotulo: 'Advogado constituído' },
  { valor: 'defensoria', rotulo: 'Defensoria Pública' },
];

/** Mesmo escopo de `souGestorDoPad` em firestore.rules — só checagem de UI, a regra real é do servidor. */
function podeRevogarAcesso(perfilUsuario, pad) {
  if (!perfilUsuario) return false;
  if (perfilUsuario.perfil === 'ADMINISTRADOR') return true;
  if (perfilUsuario.perfil !== 'DIRETOR') return false;
  const vinculo = perfilUsuario.vinculo;
  if (!vinculo) return false;
  if (vinculo.tipo === 'UNIDADE') return vinculo.valor === pad.dadosGerais?.unidade;
  if (vinculo.tipo === 'REGIONAL') return vinculo.valor === pad.superintendencia;
  return false;
}

/** Bloco de estado do vínculo do defensor ao Portal da Defesa — some se ainda não há e-mail informado. */
function criarBlocoVinculoDefensor(pad, { obterDadosAtuais, onAtualizar }) {
  const container = criarElemento('div', { class: 'documentos__campos' });

  function renderizarConteudo() {
    container.replaceChildren();
    const { email } = obterDadosAtuais();
    const vinculo = pad.defesaVinculo;

    if (vinculo?.ativo && vinculo.email === email) {
      const padNumero = pad.dadosGerais?.numero ?? pad.id;
      const botaoRevogar = criarBotao({
        texto: 'Revogar acesso a este PAD',
        icon: 'x',
        variante: 'danger',
        onClick: async () => {
          botaoRevogar.disabled = true;
          try {
            await desvincularDefensorDoPad(vinculo.uid, pad.id);
            await salvarSecaoDoPad(pad, { defesaVinculo: null });
            mostrarToast('Acesso revogado.', 'sucesso');
            renderizarConteudo();
            onAtualizar?.();
          } catch (erro) {
            console.error('Falha ao revogar acesso do defensor:', erro);
            mostrarToast('Não foi possível revogar o acesso.', 'erro');
          } finally {
            botaoRevogar.disabled = false;
          }
        },
      });
      botaoRevogar.style.display = 'none';
      obterPerfilDoUsuario(usuarioAtual()?.uid).then((perfil) => {
        if (podeRevogarAcesso(perfil, pad)) botaoRevogar.style.display = '';
      });

      const areaStatus = criarElemento('div');
      container.append(areaStatus, criarElemento('div', { class: 'documentos__acoes' }, [botaoRevogar]));

      // Um defensor já pode atender outras unidades/PADs — só o próprio
      // sistema sabe se essa conta já existia (não dá pra depender de quem
      // está vinculando "saber" disso). `padsVinculados.length > 1` indica
      // que esse defensor já tem acesso funcionando em outro PAD, então não
      // faz sentido mandar e-mail de redefinição de senha de novo — só o
      // aviso manual, com um texto diferente ("você também tem acesso a
      // este PAD" em vez de "defina sua senha").
      obterDefensor(vinculo.uid).then((defensor) => {
        const jaTemOutroPad = (defensor?.padsVinculados?.length ?? 0) > 1;

        if (jaTemOutroPad) {
          areaStatus.append(
            criarElemento('p', { class: 'text-muted' }, [
              `Este defensor já tem acesso ao Portal da Defesa por outro PAD — ${vinculo.email}. Avise sobre este PAD adicional:`,
            ]),
            criarBotoesConvidarPorEmail({ email: vinculo.email, padNumero, jaTemAcesso: true }),
          );
          return;
        }

        const botaoNotificar = criarBotao({
          texto: 'Notificar advogado — e-mail',
          icon: 'mail',
          onClick: async () => {
            botaoNotificar.disabled = true;
            try {
              await notificarDefensorPorEmail(vinculo.email);
              mostrarToast('E-mail de acesso enviado ao defensor.', 'sucesso');
            } catch (erro) {
              console.error('Falha ao notificar defensor por e-mail:', erro);
              mostrarToast('Não foi possível enviar o e-mail.', 'erro');
            } finally {
              botaoNotificar.disabled = false;
            }
          },
        });
        areaStatus.append(
          criarElemento('p', { class: 'text-muted' }, [
            `Vinculado ao Portal da Defesa — ${vinculo.email}. Ele ainda não sabe disso nem tem acesso até você notificá-lo.`,
          ]),
          criarElemento('div', { class: 'documentos__acoes' }, [botaoNotificar]),
          criarElemento('p', { class: 'text-muted' }, ['Se o e-mail automático não chegar, notifique manualmente:']),
          criarBotoesConvidarPorEmail({ email: vinculo.email, padNumero }),
        );
      });
      return;
    }

    if (!email) return;

    const botaoCriar = criarBotao({
      texto: 'Criar acesso ao Portal da Defesa',
      icon: 'lock-open',
      variante: 'secondary',
      onClick: async () => {
        botaoCriar.disabled = true;
        try {
          const dados = obterDadosAtuais();
          const perfil = await obterPerfilDoUsuario(usuarioAtual()?.uid);
          const { uid } = await vincularDefensorAoPad({
            padId: pad.id,
            nome: dados.nome,
            oab: dados.oab,
            tipo: dados.tipo,
            email: dados.email,
            criadoPor: perfil?.nome ?? usuarioAtual()?.email ?? '—',
          });
          await salvarSecaoDoPad(pad, { defesaVinculo: { uid, email, ativo: true } });
          mostrarToast('Vínculo criado — clique em "Notificar advogado" quando quiser avisá-lo.', 'sucesso');
          renderizarConteudo();
          onAtualizar?.();
        } catch (erro) {
          console.error('Falha ao criar acesso do defensor:', erro);
          mostrarToast('Não foi possível criar o acesso.', 'erro');
        } finally {
          botaoCriar.disabled = false;
        }
      },
    });
    container.append(botaoCriar);
  }

  renderizarConteudo();
  return { elemento: container, atualizar: renderizarConteudo };
}

export function renderTermoCientificacaoTab(pad, _configUnidade, { onAtualizar } = {}) {
  carregarCssUmaVez('src/pages/pad/detail/documentos/documentos.css');

  const defesaAtual = pad.defesa ?? {};

  const campoTipo = criarCampoSelect({ rotulo: 'Tipo de defesa indicado', valor: defesaAtual.tipo ?? '', opcoes: OPCOES_DEFESA });
  const campoAdvogadoNome = criarCampo({ rotulo: 'Nome do advogado', valor: defesaAtual.advogadoNome });
  const campoAdvogadoOab = criarCampo({ rotulo: 'OAB', valor: defesaAtual.advogadoOab });
  const campoEmailDefensor = criarCampo({ rotulo: 'E-mail do defensor', valor: defesaAtual.emailDefensor });
  const campoObservacoes = criarCampo({ rotulo: 'Observações (opcional)', multilinha: true, valor: pad.termoCientificacao?.observacoes });

  const camposAdvogado = criarElemento('div', { class: 'documentos__campos' }, [campoAdvogadoNome.elemento, campoAdvogadoOab.elemento]);

  function lerFormulario() {
    return {
      tipo: campoTipo.input.value || null,
      advogadoNome: campoTipo.input.value === 'advogado' ? campoAdvogadoNome.input.value.trim() : '',
      advogadoOab: campoTipo.input.value === 'advogado' ? campoAdvogadoOab.input.value.trim() : '',
      emailDefensor: campoTipo.input.value ? campoEmailDefensor.input.value.trim() : '',
    };
  }

  const blocoVinculo = criarBlocoVinculoDefensor(pad, {
    obterDadosAtuais: () => {
      const dados = lerFormulario();
      return { tipo: dados.tipo, nome: dados.advogadoNome, oab: dados.advogadoOab, email: dados.emailDefensor };
    },
    onAtualizar,
  });

  /** Aplica os dados de um advogado da Relação nos campos do formulário — usado tanto na seleção direta (cadastro já completo) quanto depois de completar o cadastro no modal. */
  function aplicarDadosAdvogado(dados) {
    campoAdvogadoNome.input.value = dados.nome ?? '';
    campoAdvogadoOab.input.value = dados.oab ?? '';
    campoEmailDefensor.input.value = dados.email ?? '';
    preview.atualizar();
    blocoVinculo.atualizar();
  }

  /**
   * Ao escolher um advogado da Relação: se o cadastro já está `completo`
   * (confirmado alguma vez, para qualquer PAD — ver
   * src/pages/advogados/advogadoCadastroModal.js), aplica os dados direto,
   * sem pedir nada de novo. Senão, exige completar todos os campos (inclusive
   * e-mail, que a planilha original de importação não tinha) com confirmação
   * explícita antes de aplicar — e só nesse primeiro acesso incompleto.
   */
  async function selecionarAdvogado(oab) {
    const dados = await buscarPorOab(oab);
    if (!dados) {
      mostrarToast('Não foi possível carregar os dados deste advogado.', 'erro');
      return;
    }
    aplicarDadosAdvogado(dados);
    if (dados.completo === true) return;

    const perfilUsuario = await obterPerfilDoUsuario(usuarioAtual()?.uid);
    abrirModalEdicao({
      oabOriginal: oab,
      dadosIniciais: dados,
      perfilUsuario,
      onSalvo: async (oabFinal) => {
        const atualizado = await buscarPorOab(oabFinal);
        if (atualizado) aplicarDadosAdvogado(atualizado);
      },
    });
  }

  const buscaAdvogado = criarBuscaAdvogado({ onSelecionar: selecionarAdvogado });
  const blocoCamposAdvogado = criarElemento('div', {}, [buscaAdvogado, camposAdvogado]);

  function atualizarVisibilidade() {
    blocoCamposAdvogado.style.display = campoTipo.input.value === 'advogado' ? '' : 'none';
    campoEmailDefensor.elemento.style.display = campoTipo.input.value ? '' : 'none';
    blocoVinculo.atualizar();
  }
  campoTipo.input.addEventListener('change', atualizarVisibilidade);
  campoEmailDefensor.input.addEventListener('change', () => blocoVinculo.atualizar());

  function padComFormulario() {
    return {
      ...pad,
      defesa: { ...pad.defesa, ...lerFormulario() },
      termoCientificacao: { observacoes: campoObservacoes.input.value.trim() },
    };
  }

  const preview = criarAreaPreview(pad, () => renderizarTermo(padComFormulario()));

  [campoTipo, campoAdvogadoNome, campoAdvogadoOab, campoEmailDefensor, campoObservacoes].forEach((campo) => {
    campo.input.addEventListener('input', preview.atualizar);
    campo.input.addEventListener('change', preview.atualizar);
  });

  atualizarVisibilidade();

  const secao = criarCardEditavel({
    titulo: 'Termo de Cientificação',
    corpo: [
      criarElemento('div', { class: 'documentos__campos' }, [campoTipo.elemento]),
      blocoCamposAdvogado,
      criarElemento('div', { class: 'documentos__campos' }, [campoEmailDefensor.elemento]),
      blocoVinculo.elemento,
      campoObservacoes.elemento,
    ],
  });
  secao.elemento.querySelector('.card__acoes')?.append(criarBotaoConfirmar(pad, 'termoCientificacao', { onAtualizar }));

  const botaoSalvar = criarBotaoSalvar(
    async () => {
      await salvarSecaoDoPad(
        pad,
        { defesa: { ...pad.defesa, ...lerFormulario() }, termoCientificacao: { observacoes: campoObservacoes.input.value.trim() } },
        { etapa: 'TERMO_CIENTIFICACAO', jaTinhaEtapa: Boolean(pad.termoCientificacao), chaveConfirmacao: 'termoCientificacao' },
      );
      preview.atualizar();
      onAtualizar?.();
    },
    { aposSalvar: secao.esconder },
  );
  secao.areaCorpo.append(criarElemento('div', { class: 'documentos__acoes' }, [botaoSalvar]));

  return criarElemento('div', { class: 'documentos__aba' }, [secao.elemento, preview.elemento]);
}
