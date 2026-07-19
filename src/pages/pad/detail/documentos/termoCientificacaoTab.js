/**
 * Aba "Termo de Cientificação" — é aqui que o tipo de defesa (advogado
 * constituído ou defensoria pública) é indicado, e por isso é gravado
 * direto em `pad.defesa.{tipo,advogadoNome,advogadoOab}` — a mesma fonte
 * usada depois por Declarações do Apenado, Manifestação da Defesa e Decisão
 * (ver src/templates/shared/condicionais.js:textoDefensor). É também aqui
 * que nasce o vínculo do defensor ao Portal da Defesa (Fase 6, 2026-07-19),
 * já que é onde o e-mail dele é coletado pela primeira vez.
 */
import {
  criarElemento, carregarCssUmaVez, criarCampo, criarCampoSelect, criarAreaPreview, criarBotao, criarBotaoSalvar,
  criarCardEditavel, salvarSecaoDoPad, criarBotaoConfirmar, criarBotoesConvidarPorEmail,
} from './_shared.js';
import { renderizar as renderizarTermo } from '../../../../templates/termoCientificacaoTemplate.js';
import { vincularDefensorAoPad, desvincularDefensorDoPad, notificarDefensorPorEmail } from '../../../../services/defensores/defensorService.js';
import { usuarioAtual, obterPerfilDoUsuario } from '../../../../services/auth/authService.js';
import { mostrarToast } from '../../../../utils/toast.js';

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
      const status = criarElemento('p', { class: 'text-muted' }, [
        `Vinculado ao Portal da Defesa — ${vinculo.email}. Ele ainda não sabe disso nem tem acesso até você notificá-lo.`,
      ]);
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

      container.append(
        status,
        criarElemento('div', { class: 'documentos__acoes' }, [botaoNotificar, botaoRevogar]),
        criarElemento('p', { class: 'text-muted' }, ['Se o e-mail automático não chegar, notifique manualmente:']),
        criarBotoesConvidarPorEmail({ email: vinculo.email, padNumero: pad.dadosGerais?.numero ?? pad.id }),
      );
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

  function atualizarVisibilidade() {
    camposAdvogado.style.display = campoTipo.input.value === 'advogado' ? '' : 'none';
    campoEmailDefensor.elemento.style.display = campoTipo.input.value ? '' : 'none';
    blocoVinculo.atualizar();
  }
  atualizarVisibilidade();
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

  const secao = criarCardEditavel({
    titulo: 'Termo de Cientificação',
    corpo: [
      criarElemento('div', { class: 'documentos__campos' }, [campoTipo.elemento]),
      camposAdvogado,
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
