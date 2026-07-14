/**
 * Painel do módulo de IA. Nenhuma chamada a src/ai é feita aqui nesta fase
 * — apenas a descrição do que este módulo é (e não é), ver ROADMAP.md
 * (Fase 8) e src/ai/README.md. A UI nunca deve importar provedores de IA
 * diretamente. Extração de dados do Registro de Infração NÃO é feita aqui
 * — é feita por regras determinísticas em src/parser (sem custo).
 */
import { carregarCssUmaVez } from '../../utils/domUtils.js';
import { criarPageHeader } from '../../components/pageHeader/pageHeader.js';
import { criarCard } from '../../components/card/card.js';
import { criarEmptyState } from '../../components/emptyState/emptyState.js';

export async function render(container) {
  carregarCssUmaVez('src/pages/ia/iaPage.css');

  container.append(
    criarPageHeader({
      titulo: 'IA',
      descricao: 'Capacidades que dependem de geração de linguagem natural — condicionadas a orçamento.',
    }),
  );

  container.append(
    criarCard({
      filhos: [
        criarEmptyState({
          titulo: 'Módulo de IA ainda não habilitado',
          descricao:
            'A extração de dados do Registro de Infração já é feita sem IA (regras determinísticas, ver módulo Documentos/Parser). Este painel fica reservado para sugestão de fundamentação e revisão textual (Fase 8), condicionadas a orçamento ou ferramenta gratuita viável.',
          icon: 'sparkles',
        }),
      ],
    }),
  );
}
