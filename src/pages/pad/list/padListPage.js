/**
 * Listagem de PADs. Leitura genérica via padService — a busca avançada por
 * filtros (unidade, classificação, período) é da Fase 2 (ver ROADMAP.md).
 */
import { carregarCssUmaVez } from '../../../utils/domUtils.js';
import { criarPageHeader } from '../../../components/pageHeader/pageHeader.js';
import { criarCard } from '../../../components/card/card.js';
import { criarBotao } from '../../../components/button/button.js';
import { criarDataTable } from '../../../components/dataTable/dataTable.js';
import { criarStatusBadge } from '../../../components/statusBadge/statusBadge.js';
import { listarPads } from '../../../services/pads/padService.js';
import { formatarData } from '../../../utils/dateUtils.js';

const COLUNAS = [
  { chave: 'numero', rotulo: 'Nº do PAD', render: (linha) => linha.dadosGerais?.numero ?? linha.id },
  {
    chave: 'incidentado',
    rotulo: 'Incidentado',
    render: (linha) => linha.incidentados?.[0]?.nomeCompleto ?? '—',
  },
  { chave: 'unidade', rotulo: 'Unidade', render: (linha) => linha.dadosGerais?.unidade ?? '—' },
  { chave: 'status', rotulo: 'Status', render: (linha) => criarStatusBadge({ status: linha.status }) },
  {
    chave: 'dataAbertura',
    rotulo: 'Abertura',
    render: (linha) => formatarData(linha.dadosGerais?.dataAbertura),
  },
];

export async function render(container) {
  carregarCssUmaVez('src/pages/pad/list/padListPage.css');

  const botaoNovo = criarBotao({
    texto: 'Novo PAD',
    icon: 'file-plus',
    onClick: () => {
      location.hash = '/pad/novo';
    },
  });

  container.append(
    criarPageHeader({
      titulo: 'PAD',
      descricao: 'Processos Administrativos Disciplinares em tramitação e concluídos.',
      acoes: [botaoNovo],
    }),
  );

  const pads = await listarPads({ limite: 50 });

  container.append(
    criarCard({
      filhos: [
        criarDataTable({
          colunas: COLUNAS,
          linhas: pads,
          onClickLinha: (linha) => {
            location.hash = `/pad/${linha.id}`;
          },
          vazio: {
            titulo: 'Nenhum PAD cadastrado ainda',
            descricao: 'Clique em "Novo PAD" para iniciar o registro de uma infração.',
            icon: 'folder-search',
          },
        }),
      ],
    }),
  );
}
