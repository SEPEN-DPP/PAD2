/**
 * Exportação de PADs e relatórios. Implementação real é da Fase 7
 * (ver ROADMAP.md).
 */
import { carregarCssUmaVez } from '../../utils/domUtils.js';
import { criarPageHeader } from '../../components/pageHeader/pageHeader.js';
import { criarCard } from '../../components/card/card.js';
import { criarEmptyState } from '../../components/emptyState/emptyState.js';

export async function render(container) {
  carregarCssUmaVez('src/pages/exportacao/exportacaoPage.css');

  container.append(
    criarPageHeader({
      titulo: 'Exportação',
      descricao: 'Exportação de PADs individuais e relatórios gerenciais.',
    }),
  );

  container.append(
    criarCard({
      filhos: [
        criarEmptyState({
          titulo: 'Exportação ainda não disponível',
          descricao: 'A exportação em PDF/planilha será habilitada na Fase 7.',
          icon: 'download',
        }),
      ],
    }),
  );
}
