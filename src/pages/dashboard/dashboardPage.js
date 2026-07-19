/**
 * Dashboard. Cartões de indicador e listas já consultam o Firestore (via
 * services), mas apenas leitura genérica — nenhuma regra de negócio de
 * fluxo processual está implementada aqui (ver ROADMAP.md, Fase 2).
 */
import { criarElemento, carregarCssUmaVez } from '../../utils/domUtils.js';
import { criarPageHeader } from '../../components/pageHeader/pageHeader.js';
import { criarStatCard } from '../../components/statCard/statCard.js';
import { criarCard } from '../../components/card/card.js';
import { criarDataTable } from '../../components/dataTable/dataTable.js';
import { criarTimeline } from '../../components/timeline/timeline.js';
import { criarStatusBadge } from '../../components/statusBadge/statusBadge.js';
import { criarEmptyState } from '../../components/emptyState/emptyState.js';
import { contarTodosPads, contarPadsPorStatus, listarPads } from '../../services/pads/padService.js';
import { calcularUnidadesVisiveis } from '../../services/pads/escopoPad.js';
import { listarUltimosEventos } from '../../services/eventos/eventoService.js';
import { usuarioAtual, obterPerfilDoUsuario } from '../../services/auth/authService.js';
import { STATUS_PAD, STATUS_PAD_LABELS } from '../../config/constants.js';
import { ROLES } from '../../config/roles.js';
import { SUPERINTENDENCIAS_REGIONAIS } from '../../config/unidadesPrisionais.js';
import { obterUnidadeAtivaAdministrador } from '../../state/unidadeAtivaAdministrador.js';
import { formatarData } from '../../utils/dateUtils.js';

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

  const ultimosEventos = await listarUltimosEventos(8);
  const cardTimeline = criarCard({
    titulo: 'Timeline de atividades',
    filhos: [
      criarTimeline(
        ultimosEventos.map((evento) => ({
          titulo: evento.tipo ?? 'Evento registrado',
          descricao: evento.observacoes,
          data: evento.data,
        })),
      ),
    ],
  });

  colunas.append(cardUltimosPads, cardTimeline);

  container.append(
    criarCard({
      titulo: 'Pendências',
      filhos: [
        criarEmptyState({
          titulo: 'Nenhuma pendência no momento',
          descricao: 'O painel de pendências por prazo e etapa será habilitado na Fase 2.',
          icon: 'list-checks',
        }),
      ],
    }),
  );
}
