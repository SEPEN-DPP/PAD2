/**
 * Configurações gerais do sistema. Edição de parâmetros institucionais
 * (numeração de PAD, prazos padrão, modelos) é da Fase 2+ — aqui existe
 * apenas a estrutura da tela.
 */
import { carregarCssUmaVez } from '../../utils/domUtils.js';
import { criarPageHeader } from '../../components/pageHeader/pageHeader.js';
import { criarCard } from '../../components/card/card.js';
import { criarEmptyState } from '../../components/emptyState/emptyState.js';

export async function render(container) {
  carregarCssUmaVez('src/pages/configuracoes/configuracoesPage.css');

  container.append(
    criarPageHeader({
      titulo: 'Configurações',
      descricao: 'Parâmetros gerais do sistema.',
    }),
  );

  container.append(
    criarCard({
      titulo: 'Parâmetros institucionais',
      filhos: [
        criarEmptyState({
          titulo: 'Nenhum parâmetro configurável ainda',
          descricao: 'Numeração de PAD, prazos padrão e modelos serão configuráveis em fases futuras.',
          icon: 'settings',
        }),
      ],
    }),
  );
}
