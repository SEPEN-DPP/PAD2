/**
 * Listagem geral de Anexos. Upload real e visualização controlada por
 * permissão chegam na Fase 5 (ver ROADMAP.md) — aqui existe apenas a
 * leitura dos metadados já persistidos (o binário vive no Storage).
 */
import { carregarCssUmaVez } from '../../utils/domUtils.js';
import { criarPageHeader } from '../../components/pageHeader/pageHeader.js';
import { criarCard } from '../../components/card/card.js';
import { criarDataTable } from '../../components/dataTable/dataTable.js';
import { listarUltimosAnexos } from '../../services/anexos/anexoService.js';
import { formatarDataHora } from '../../utils/dateUtils.js';

const COLUNAS = [
  { chave: 'nomeArquivo', rotulo: 'Arquivo', render: (l) => l.nomeArquivo ?? l.id },
  { chave: 'padId', rotulo: 'PAD', render: (l) => l.padId ?? '—' },
  { chave: 'tipo', rotulo: 'Tipo', render: (l) => l.tipo ?? '—' },
  { chave: 'criadoEm', rotulo: 'Enviado em', render: (l) => formatarDataHora(l.criadoEm) },
];

export async function render(container) {
  carregarCssUmaVez('src/pages/anexos/anexosPage.css');

  container.append(
    criarPageHeader({
      titulo: 'Anexos',
      descricao: 'Fotos, vídeos, laudos e demais anexos vinculados aos PADs.',
    }),
  );

  const anexos = await listarUltimosAnexos(50);

  container.append(
    criarCard({
      filhos: [
        criarDataTable({
          colunas: COLUNAS,
          linhas: anexos,
          vazio: {
            titulo: 'Nenhum anexo enviado ainda',
            descricao: 'O upload de anexos ao Firebase Storage chega na Fase 5.',
            icon: 'paperclip',
          },
        }),
      ],
    }),
  );
}
