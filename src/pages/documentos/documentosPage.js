/**
 * Listagem geral de Documentos gerados. Geração real via templates + jsPDF
 * é da Fase 4 (ver ROADMAP.md) — aqui existe apenas a leitura dos metadados.
 */
import { carregarCssUmaVez } from '../../utils/domUtils.js';
import { criarPageHeader } from '../../components/pageHeader/pageHeader.js';
import { criarCard } from '../../components/card/card.js';
import { criarDataTable } from '../../components/dataTable/dataTable.js';
import { listarUltimosDocumentos } from '../../services/documentos/documentoService.js';
import { formatarDataHora } from '../../utils/dateUtils.js';

const COLUNAS = [
  { chave: 'titulo', rotulo: 'Documento', render: (l) => l.titulo ?? l.id },
  { chave: 'padId', rotulo: 'PAD', render: (l) => l.padId ?? '—' },
  { chave: 'tipo', rotulo: 'Tipo', render: (l) => l.tipo ?? '—' },
  { chave: 'criadoEm', rotulo: 'Gerado em', render: (l) => formatarDataHora(l.criadoEm) },
];

export async function render(container) {
  carregarCssUmaVez('src/pages/documentos/documentosPage.css');

  container.append(
    criarPageHeader({
      titulo: 'Documentos',
      descricao: 'Documentos gerados automaticamente a partir dos dados de cada PAD.',
    }),
  );

  const documentos = await listarUltimosDocumentos(50);

  container.append(
    criarCard({
      filhos: [
        criarDataTable({
          colunas: COLUNAS,
          linhas: documentos,
          vazio: {
            titulo: 'Nenhum documento gerado ainda',
            descricao: 'A geração de documentos (Portaria, Termo, Ofício etc.) chega na Fase 4.',
            icon: 'file-stack',
          },
        }),
      ],
    }),
  );
}
