/**
 * Relatórios gerenciais. Implementação real (agregações por unidade,
 * período, classificação) é da Fase 7 (ver ROADMAP.md).
 */
import { carregarCssUmaVez } from '../../utils/domUtils.js';
import { criarPageHeader } from '../../components/pageHeader/pageHeader.js';
import { criarCard } from '../../components/card/card.js';
import { criarEmptyState } from '../../components/emptyState/emptyState.js';

export async function render(container) {
  carregarCssUmaVez('src/pages/relatorios/relatoriosPage.css');

  container.append(
    criarPageHeader({
      titulo: 'Relatórios',
      descricao: 'Relatórios gerenciais por unidade, período e classificação de infração.',
    }),
  );

  container.append(
    criarCard({
      filhos: [
        criarEmptyState({
          titulo: 'Relatórios ainda não disponíveis',
          descricao: 'Os relatórios gerenciais serão habilitados na Fase 7.',
          icon: 'bar-chart-3',
        }),
      ],
    }),
  );
}
