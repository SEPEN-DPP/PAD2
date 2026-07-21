/**
 * Dashboard. Cartões de indicador e listas já consultam o Firestore (via
 * services), mas apenas leitura genérica — nenhuma regra de negócio de
 * fluxo processual está implementada aqui (ver ROADMAP.md, Fase 2).
 */
import { criarElemento, carregarCssUmaVez } from '../../utils/domUtils.js';
import { criarPageHeader } from '../../components/pageHeader/pageHeader.js';
import { criarStatCard } from '../../components/statCard/statCard.js';
import { criarCard } from '../../components/card/card.js';
import { criarBotao } from '../../components/button/button.js';
import { criarDataTable } from '../../components/dataTable/dataTable.js';
import { criarStatusBadge } from '../../components/statusBadge/statusBadge.js';
import { criarEmptyState } from '../../components/emptyState/emptyState.js';
import { contarTodosPads, contarPadsPorStatus, listarPads } from '../../services/pads/padService.js';
import { calcularUnidadesVisiveis } from '../../services/pads/escopoPad.js';
import { listarLembretes, criarLembrete, marcarLembreteComoFeito, excluirLembrete } from '../../services/lembretes/lembreteService.js';
import { usuarioAtual, obterPerfilDoUsuario } from '../../services/auth/authService.js';
import { STATUS_PAD, STATUS_PAD_LABELS } from '../../config/constants.js';
import { ROLES } from '../../config/roles.js';
import { SUPERINTENDENCIAS_REGIONAIS, UNIDADES_PRISIONAIS } from '../../config/unidadesPrisionais.js';
import { obterUnidadeAtivaAdministrador } from '../../state/unidadeAtivaAdministrador.js';
import { formatarData } from '../../utils/dateUtils.js';
import { mostrarToast } from '../../utils/toast.js';

function descricaoDoRecorte(perfilUsuario) {
  if (perfilUsuario?.perfil === ROLES.ADMINISTRADOR) {
    const unidadeEscolhida = obterUnidadeAtivaAdministrador();
    return unidadeEscolhida
      ? `PADs da unidade: ${unidadeEscolhida}.`
      : 'DPP — visão geral: Processos Administrativos Disciplinares de todas as unidades do Estado.';
  }
  const vinculo = perfilUsuario?.vinculo;
  if (!vinculo) {
    return 'Visão geral dos Processos Administrativos Disciplinares de todas as unidades.';
  }
  if (vinculo.tipo === 'REGIONAL') {
    const nomeRegional = SUPERINTENDENCIAS_REGIONAIS[vinculo.valor]?.nome ?? vinculo.valor;
    return `PADs das unidades vinculadas à ${nomeRegional}.`;
  }
  return `PADs da unidade: ${vinculo.valor}.`;
}

/**
 * Campo de unidade do novo lembrete: fixo para quem tem vínculo de UNIDADE
 * (o lembrete sempre nasce na própria unidade de quem cria); select
 * filtrado à regional para vínculo REGIONAL; select com todas as unidades
 * para Administrador — mesmo padrão de src/pages/pad/new/padNewPage.js.
 */
function criarCampoUnidadeLembrete(perfilUsuario) {
  if (perfilUsuario?.vinculo?.tipo === 'UNIDADE') {
    return { fixo: perfilUsuario.vinculo.valor, elemento: null, input: null };
  }

  const unidadesDisponiveis = perfilUsuario?.vinculo?.tipo === 'REGIONAL'
    ? UNIDADES_PRISIONAIS.filter((u) => u.superintendencia === perfilUsuario.vinculo.valor)
    : UNIDADES_PRISIONAIS;

  const select = criarElemento(
    'select',
    { class: 'campo__input' },
    [criarElemento('option', { value: '' }, ['Unidade...']), ...unidadesDisponiveis.map((u) => criarElemento('option', { value: u.nome }, [u.nome]))],
  );
  return { fixo: null, elemento: select, input: select };
}

/** Card "Lembretes" (2026-07-20) — substitui a antiga Timeline de atividades por um quadro de anotações da unidade, com marcar-como-feito e excluir. */
function criarCardLembretes(perfilUsuario, unidadesVisiveis) {
  const areaLista = criarElemento('div');
  const campoUnidade = criarCampoUnidadeLembrete(perfilUsuario);
  const campoTexto = criarElemento('input', { class: 'campo__input', type: 'text', placeholder: 'Novo lembrete...' });

  async function atualizarLista() {
    const lembretes = await listarLembretes(unidadesVisiveis);
    if (!lembretes.length) {
      areaLista.replaceChildren(
        criarEmptyState({ titulo: 'Nenhum lembrete ainda', descricao: 'Adicione uma anotação abaixo.', icon: 'list-checks' }),
      );
      return;
    }

    const lista = criarElemento('ul', { class: 'dashboard__lembretes-lista' });
    lista.replaceChildren(
      ...lembretes.map((lembrete) => {
        const checkbox = criarElemento('input', { type: 'checkbox' });
        checkbox.checked = Boolean(lembrete.feito);
        checkbox.addEventListener('change', async () => {
          checkbox.disabled = true;
          try {
            await marcarLembreteComoFeito(lembrete.id, checkbox.checked);
            atualizarLista();
          } catch (erro) {
            console.error('Falha ao atualizar lembrete:', erro);
            mostrarToast('Não foi possível atualizar o lembrete.', 'erro');
            checkbox.disabled = false;
          }
        });

        const botaoExcluir = criarBotao({
          texto: 'Excluir',
          icon: 'x',
          variante: 'danger',
          onClick: async () => {
            try {
              await excluirLembrete(lembrete.id);
              atualizarLista();
            } catch (erro) {
              console.error('Falha ao excluir lembrete:', erro);
              mostrarToast('Não foi possível excluir o lembrete.', 'erro');
            }
          },
        });

        return criarElemento('li', { class: 'dashboard__lembretes-item' }, [
          criarElemento('label', { class: 'dashboard__lembretes-texto' }, [
            checkbox,
            criarElemento('span', { class: lembrete.feito ? 'dashboard__lembretes-feito' : '' }, [lembrete.texto]),
          ]),
          botaoExcluir,
        ]);
      }),
    );
    areaLista.replaceChildren(lista);
  }

  const botaoAdicionar = criarBotao({
    texto: 'Adicionar',
    icon: 'file-plus',
    variante: 'secondary',
    onClick: async () => {
      const texto = campoTexto.value.trim();
      if (!texto) return mostrarToast('Escreva o lembrete antes de adicionar.', 'aviso');
      const unidade = campoUnidade.fixo ?? campoUnidade.input?.value;
      if (!unidade) return mostrarToast('Selecione a unidade do lembrete.', 'aviso');

      botaoAdicionar.disabled = true;
      try {
        await criarLembrete({ texto, unidade, criadoPor: perfilUsuario?.nome ?? usuarioAtual()?.email ?? '—' });
        campoTexto.value = '';
        await atualizarLista();
      } catch (erro) {
        console.error('Falha ao criar lembrete:', erro);
        mostrarToast('Não foi possível adicionar o lembrete.', 'erro');
      } finally {
        botaoAdicionar.disabled = false;
      }
    },
  });

  atualizarLista();

  return criarCard({
    titulo: 'Lembretes',
    filhos: [
      areaLista,
      criarElemento('div', { class: 'dashboard__lembretes-form' }, [
        campoTexto,
        campoUnidade.elemento,
        botaoAdicionar,
      ].filter(Boolean)),
    ],
  });
}

const COLUNAS_PADS = [
  { chave: 'numero', rotulo: 'Nº', render: (linha) => linha.dadosGerais?.numero ?? linha.id },
  {
    chave: 'incidentado',
    rotulo: 'Incidentado',
    render: (linha) => linha.incidentados?.[0]?.nomeCompleto ?? '—',
  },
  { chave: 'status', rotulo: 'Status', render: (linha) => criarStatusBadge({ status: linha.status }) },
  {
    chave: 'dataAbertura',
    rotulo: 'Abertura',
    render: (linha) => formatarData(linha.dadosGerais?.dataAbertura),
  },
];

export async function render(container) {
  carregarCssUmaVez('src/pages/dashboard/dashboardPage.css');

  const perfilUsuario = await obterPerfilDoUsuario(usuarioAtual()?.uid);
  const unidadesVisiveis = calcularUnidadesVisiveis(perfilUsuario);

  container.append(
    criarPageHeader({
      titulo: 'Dashboard',
      descricao: descricaoDoRecorte(perfilUsuario),
    }),
  );

  const campoBusca = criarElemento('input', {
    type: 'search',
    class: 'campo__input dashboard__busca',
    placeholder: 'Buscar PAD por número ou incidentado…',
  });
  container.append(
    criarCard({ titulo: 'Pesquisa rápida', filhos: [campoBusca] }),
  );

  const grid = criarElemento('div', { class: 'dashboard__stats' });
  container.append(grid);

  const [totalPads, porStatus] = await Promise.all([
    contarTodosPads(unidadesVisiveis),
    contarPadsPorStatus(unidadesVisiveis),
  ]);

  grid.append(
    criarStatCard({ titulo: 'Total de PADs', valor: totalPads, icon: 'folder-search' }),
    criarStatCard({
      titulo: STATUS_PAD_LABELS.EM_ANDAMENTO,
      valor: porStatus[STATUS_PAD.EM_ANDAMENTO],
      icon: 'list-checks',
      tom: 'info',
    }),
    criarStatCard({
      titulo: STATUS_PAD_LABELS.AGUARDANDO_DEFESA,
      valor: porStatus[STATUS_PAD.AGUARDANDO_DEFESA],
      icon: 'scale',
      tom: 'aviso',
    }),
    criarStatCard({
      titulo: STATUS_PAD_LABELS.AGUARDANDO_DECISAO,
      valor: porStatus[STATUS_PAD.AGUARDANDO_DECISAO],
      icon: 'file-text',
      tom: 'aviso',
    }),
    criarStatCard({
      titulo: STATUS_PAD_LABELS.CONCLUIDO,
      valor: porStatus[STATUS_PAD.CONCLUIDO],
      icon: 'check',
      tom: 'sucesso',
    }),
    criarStatCard({
      titulo: STATUS_PAD_LABELS.ARQUIVADO,
      valor: porStatus[STATUS_PAD.ARQUIVADO],
      icon: 'file-stack',
    }),
  );

  const colunas = criarElemento('div', { class: 'dashboard__colunas' });
  container.append(colunas);

  const ultimosPads = await listarPads({ limite: 5, unidades: unidadesVisiveis });
  const containerTabela = criarElemento('div');
  const renderizarTabela = (linhas) => {
    containerTabela.replaceChildren(
      criarDataTable({
        colunas: COLUNAS_PADS,
        linhas,
        vazio: {
          titulo: 'Nenhum PAD cadastrado ainda',
          descricao: 'Os PADs aparecerão aqui assim que forem registrados pela Unidade.',
          icon: 'folder-search',
        },
      }),
    );
  };
  renderizarTabela(ultimosPads);

  campoBusca.addEventListener('input', () => {
    const termo = campoBusca.value.trim().toLowerCase();
    if (!termo) return renderizarTabela(ultimosPads);
    renderizarTabela(
      ultimosPads.filter((pad) => {
        const numero = String(pad.dadosGerais?.numero ?? '').toLowerCase();
        const incidentado = String(pad.incidentados?.[0]?.nomeCompleto ?? '').toLowerCase();
        return numero.includes(termo) || incidentado.includes(termo);
      }),
    );
  });

  const cardUltimosPads = criarCard({ titulo: 'Últimos PADs', filhos: [containerTabela] });
  const cardLembretes = criarCardLembretes(perfilUsuario, unidadesVisiveis);

  colunas.append(cardUltimosPads, cardLembretes);
}
