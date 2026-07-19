/**
 * Relação de Advogados (Fase 6+, 2026-07-19) — diretório de contato
 * institucional, pré-importado de uma planilha real do i-PEN (ver
 * docs/firestore-schema.md e src/services/advogados/advogadoCadastroService.js).
 * Independente do Portal da Defesa: existe para qualquer advogado conhecido,
 * tenha ele vínculo ativo a algum PAD ou não. Também independente do fluxo
 * de vínculo de defensor no Termo de Cientificação (que continua com campos
 * digitados à parte) — integrar os dois é próximo passo natural, não feito
 * ainda.
 *
 * A busca por nome/OAB roda inteiramente no navegador sobre um arquivo
 * estático (`/public/dados/advogados-busca.json`, servido pelo Hosting) —
 * nunca lê o Firestore em massa, pra não estourar a cota diária do plano
 * gratuito. Só ao abrir um resultado é que o cadastro completo (endereço,
 * telefone, e-mail) é lido do Firestore, garantindo dado sempre atual.
 *
 * Cada resultado tem dois botões: "Visualizar" (somente leitura) e "Editar".
 * Qualquer gravação pelo modal de edição só é aceita com todos os campos
 * preenchidos (exceto complemento) e uma confirmação explícita — e sempre
 * marca `completo: true`, mesmo que o cadastro já estivesse completo antes.
 * Isso vale tanto para completar um cadastro pré-importado quanto para só
 * corrigir um dado de um cadastro que já estava completo — o objetivo é que,
 * uma vez confirmado, ninguém mais precise passar pelo aviso de novo.
 */
import { criarElemento, carregarCssUmaVez, limparContainer } from '../../utils/domUtils.js';
import { criarPageHeader } from '../../components/pageHeader/pageHeader.js';
import { criarCard } from '../../components/card/card.js';
import { criarBotao } from '../../components/button/button.js';
import { criarEmptyState } from '../../components/emptyState/emptyState.js';
import { abrirModal } from '../../components/modal/modal.js';
import { criarCampo } from '../pad/detail/documentos/_shared.js';
import { buscarPorOab, criarOuAtualizar } from '../../services/advogados/advogadoCadastroService.js';
import { usuarioAtual, obterPerfilDoUsuario } from '../../services/auth/authService.js';
import { ehCampoObrigatorio } from '../../utils/validationUtils.js';
import { mostrarToast } from '../../utils/toast.js';

const CAMINHO_INDICE_BUSCA = '/public/dados/advogados-busca.json';
const LIMITE_RESULTADOS_EXIBIDOS = 50;

function normalizarTexto(valor) {
  return (valor ?? '')
    .toString()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

const CAMPOS_ENDERECO = [
  { chave: 'rua', rotulo: 'Rua' },
  { chave: 'numero', rotulo: 'Número' },
  { chave: 'complemento', rotulo: 'Complemento' },
  { chave: 'bairro', rotulo: 'Bairro' },
  { chave: 'cidade', rotulo: 'Cidade' },
  { chave: 'estado', rotulo: 'Estado' },
];

/** Monta os campos editáveis do cadastro — reaproveitado pelo modal de edição/completude. */
function criarCamposCadastro(dados, { oabEditavel }) {
  const campoNome = criarCampo({ rotulo: 'Nome completo', valor: dados?.nome });
  const campoOab = criarCampo({ rotulo: 'OAB', valor: dados?.oab });
  if (!oabEditavel) campoOab.input.disabled = true;
  const camposEndereco = CAMPOS_ENDERECO.map((c) => ({
    ...c,
    campo: criarCampo({ rotulo: c.rotulo, valor: dados?.endereco?.[c.chave] }),
  }));
  const campoTelefone = criarCampo({ rotulo: 'Telefone', valor: dados?.telefone });
  const campoEmail = criarCampo({ rotulo: 'E-mail', valor: dados?.email, tipo: 'email' });

  const corpo = [
    campoNome.elemento,
    campoOab.elemento,
    ...camposEndereco.map((c) => c.campo.elemento),
    campoTelefone.elemento,
    campoEmail.elemento,
  ];

  function lerDados() {
    return {
      nome: campoNome.input.value.trim(),
      oab: campoOab.input.value.trim(),
      endereco: Object.fromEntries(camposEndereco.map((c) => [c.chave, c.campo.input.value.trim()])),
      telefone: campoTelefone.input.value.trim(),
      email: campoEmail.input.value.trim(),
    };
  }

  return { corpo, lerDados };
}

/** Completo = tudo preenchido, exceto complemento (muitos endereços reais legitimamente não têm). */
function estaCompleto(dados) {
  return (
    ehCampoObrigatorio(dados.nome) &&
    ehCampoObrigatorio(dados.oab) &&
    ehCampoObrigatorio(dados.telefone) &&
    ehCampoObrigatorio(dados.email) &&
    ehCampoObrigatorio(dados.endereco.rua) &&
    ehCampoObrigatorio(dados.endereco.numero) &&
    ehCampoObrigatorio(dados.endereco.bairro) &&
    ehCampoObrigatorio(dados.endereco.cidade) &&
    ehCampoObrigatorio(dados.endereco.estado)
  );
}

function criarLinhaLeitura(rotulo, valor) {
  return criarElemento('p', { class: 'advogados__linha-leitura' }, [
    criarElemento('strong', {}, [`${rotulo}: `]),
    valor || '—',
  ]);
}

/** Modal somente-leitura — nenhuma gravação acontece aqui. */
function abrirModalVisualizacao(dados) {
  abrirModal({
    titulo: `${dados?.nome || 'Advogado'} — OAB ${dados?.oab ?? '—'}`,
    conteudo: [
      criarLinhaLeitura('Nome', dados?.nome),
      criarLinhaLeitura('OAB', dados?.oab),
      criarLinhaLeitura('Rua', dados?.endereco?.rua),
      criarLinhaLeitura('Número', dados?.endereco?.numero),
      criarLinhaLeitura('Complemento', dados?.endereco?.complemento),
      criarLinhaLeitura('Bairro', dados?.endereco?.bairro),
      criarLinhaLeitura('Cidade', dados?.endereco?.cidade),
      criarLinhaLeitura('Estado', dados?.endereco?.estado),
      criarLinhaLeitura('Telefone', dados?.telefone),
      criarLinhaLeitura('E-mail', dados?.email),
      !dados?.completo
        ? criarElemento('p', { class: 'text-muted' }, ['Cadastro ainda incompleto — use "Editar" para completá-lo.'])
        : null,
    ].filter(Boolean),
  });
}

/**
 * Modal de edição — usado tanto para completar um cadastro pré-importado
 * quanto para corrigir um já completo, e para cadastrar um advogado novo
 * (`oabOriginal` nulo, OAB fica editável). Primeiro clique em "Salvar" só
 * valida; um segundo clique (com o aviso de confirmação visível) grava de
 * verdade, sempre marcando `completo: true`.
 */
function abrirModalEdicao({ oabOriginal, dadosIniciais, perfilUsuario, onSalvo }) {
  const oabEditavel = !oabOriginal;
  const { corpo, lerDados } = criarCamposCadastro(dadosIniciais ?? {}, { oabEditavel });

  const avisoConfirmacao = criarElemento('p', { class: 'advogados__aviso-confirmacao' }, [
    'Você confirma que todos os dados estão corretos? Depois de salvar, este cadastro não pede mais complementação — para ninguém.',
  ]);
  avisoConfirmacao.style.display = 'none';

  const botaoSalvar = criarBotao({ texto: 'Salvar', icon: 'check' });
  let aguardandoConfirmacao = false;

  const fechar = abrirModal({
    titulo: oabOriginal ? `Editar cadastro — ${dadosIniciais?.nome ?? oabOriginal}` : 'Adicionar advogado',
    conteudo: [
      criarElemento('p', { class: 'text-muted' }, [
        'Todos os campos são obrigatórios, exceto complemento.',
      ]),
      ...corpo,
      avisoConfirmacao,
    ],
    rodape: [botaoSalvar],
  });

  botaoSalvar.addEventListener('click', async () => {
    const dados = lerDados();
    if (!estaCompleto(dados)) {
      aguardandoConfirmacao = false;
      avisoConfirmacao.style.display = 'none';
      botaoSalvar.querySelector('span:last-child').textContent = 'Salvar';
      mostrarToast('Preencha nome, OAB, telefone, e-mail e o endereço (rua, número, bairro, cidade, estado).', 'aviso');
      return;
    }

    if (!aguardandoConfirmacao) {
      aguardandoConfirmacao = true;
      avisoConfirmacao.style.display = '';
      botaoSalvar.querySelector('span:last-child').textContent = 'Confirmar e salvar';
      return;
    }

    const oabFinal = oabEditavel ? dados.oab : oabOriginal;
    botaoSalvar.disabled = true;
    try {
      await criarOuAtualizar(oabFinal, {
        ...dados,
        completo: true,
        atualizadoPor: perfilUsuario?.nome ?? usuarioAtual()?.email ?? '—',
      });
      mostrarToast('Cadastro salvo.', 'sucesso');
      fechar();
      onSalvo?.(oabFinal);
    } catch (erro) {
      console.error('Falha ao salvar cadastro de advogado:', erro);
      mostrarToast('Não foi possível salvar o cadastro.', 'erro');
      botaoSalvar.disabled = false;
    }
  });
}

function criarResultado({ nome, oab, cidade, estado, onVisualizar, onEditar }) {
  const localizacao = [cidade, estado].filter(Boolean).join('/');
  const botaoVisualizar = criarBotao({ texto: 'Visualizar', icon: 'eye', variante: 'secondary', onClick: onVisualizar });
  const botaoEditar = criarBotao({ texto: 'Editar', icon: 'settings', variante: 'secondary', onClick: onEditar });
  return criarElemento('li', { class: 'documentos__item-lista' }, [
    criarElemento('span', {}, [`${nome} — OAB nº ${oab}${localizacao ? ` — ${localizacao}` : ''}`]),
    criarElemento('div', { class: 'advogados__acoes-linha' }, [botaoVisualizar, botaoEditar]),
  ]);
}

export async function render(container) {
  carregarCssUmaVez('src/pages/advogados/advogadosPage.css');
  carregarCssUmaVez('src/pages/pad/detail/documentos/documentos.css');

  const perfilUsuario = await obterPerfilDoUsuario(usuarioAtual()?.uid);

  const botaoAdicionar = criarBotao({
    texto: 'Adicionar advogado',
    icon: 'users',
    variante: 'secondary',
    onClick: () => {
      abrirModalEdicao({ oabOriginal: null, dadosIniciais: {}, perfilUsuario, onSalvo: () => {} });
    },
  });

  container.append(
    criarPageHeader({
      titulo: 'Relação de Advogados',
      descricao: 'Busque por nome ou número da OAB para ver ou completar o cadastro de contato.',
      acoes: [botaoAdicionar],
    }),
  );

  const campoBusca = criarElemento('input', {
    class: 'campo__input advogados__campo-busca',
    type: 'search',
    placeholder: 'Buscar por nome ou OAB…',
  });
  const areaResultados = criarElemento('div');

  container.append(criarCard({ filhos: [campoBusca, areaResultados] }));

  let indice = [];
  try {
    const resposta = await fetch(CAMINHO_INDICE_BUSCA, { cache: 'no-cache' });
    if (resposta.ok) {
      const bruto = await resposta.json();
      indice = bruto.map((item) => ({
        ...item,
        nomeNormalizado: normalizarTexto(item.nome),
        oabNormalizada: normalizarTexto(item.oab),
      }));
    }
  } catch (erro) {
    console.error('Falha ao carregar índice de busca de advogados:', erro);
  }

  async function abrirVisualizacao({ oab, nome }) {
    const dados = (await buscarPorOab(oab)) ?? { nome, oab };
    abrirModalVisualizacao(dados);
  }

  async function abrirEdicao({ oab, nome }) {
    const dados = (await buscarPorOab(oab)) ?? { nome, oab };
    abrirModalEdicao({ oabOriginal: oab, dadosIniciais: dados, perfilUsuario, onSalvo: () => {} });
  }

  function renderizarResultados(termo) {
    limparContainer(areaResultados);

    if (!termo.trim()) {
      areaResultados.append(
        criarEmptyState({ titulo: 'Digite para buscar', descricao: 'Busque por parte do nome ou pelo número da OAB.', icon: 'scale' }),
      );
      return;
    }

    const normalizado = normalizarTexto(termo);
    const encontrados = indice.filter((item) => item.nomeNormalizado.includes(normalizado) || item.oabNormalizada.includes(normalizado));

    if (!encontrados.length) {
      areaResultados.append(
        criarEmptyState({ titulo: 'Nenhum advogado encontrado', descricao: 'Confira a grafia ou use "Adicionar advogado" para cadastrar.', icon: 'scale' }),
      );
      return;
    }

    const exibidos = encontrados.slice(0, LIMITE_RESULTADOS_EXIBIDOS);
    const lista = criarElemento('ul', { class: 'documentos__lista-itens' });
    lista.replaceChildren(
      ...exibidos.map((item) =>
        criarResultado({
          nome: item.nome,
          oab: item.oab,
          cidade: item.cidade,
          estado: item.estado,
          onVisualizar: () => abrirVisualizacao({ oab: item.oab, nome: item.nome }),
          onEditar: () => abrirEdicao({ oab: item.oab, nome: item.nome }),
        }),
      ),
    );

    areaResultados.append(lista);
    if (encontrados.length > exibidos.length) {
      areaResultados.append(
        criarElemento('p', { class: 'text-muted' }, [`Mostrando ${exibidos.length} de ${encontrados.length} resultados — refine sua busca.`]),
      );
    }
  }

  campoBusca.addEventListener('input', () => renderizarResultados(campoBusca.value));
  renderizarResultados('');
}
