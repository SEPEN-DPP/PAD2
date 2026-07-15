/**
 * Portal da Defesa (renomeado de "Portal do Advogado", 2026-07-15 — cobre
 * tanto advogado constituído quanto defensor público, já que o Termo de
 * Cientificação já distingue os dois em `defesa.tipo`) — reserva de rota e
 * navegação apenas. Implementação completa (autenticação isolada,
 * vínculo real ao PAD, memoriais, log de acesso) é da Fase 6 (ver
 * ROADMAP.md). Nada é implementado aqui além do placeholder.
 */
import { carregarCssUmaVez } from '../../utils/domUtils.js';
import { criarPageHeader } from '../../components/pageHeader/pageHeader.js';
import { criarCard } from '../../components/card/card.js';
import { criarEmptyState } from '../../components/emptyState/emptyState.js';

export async function render(container) {
  carregarCssUmaVez('src/pages/portal-advogado/portalAdvogadoPage.css');

  container.append(
    criarPageHeader({
      titulo: 'Portal da Defesa',
      descricao: 'Acompanhamento processual para advogados constituídos e defensores públicos.',
    }),
  );

  container.append(
    criarCard({
      filhos: [
        criarEmptyState({
          titulo: 'Portal da Defesa ainda não disponível',
          descricao:
            'Vínculo do defensor a um PAD específico, acesso isolado por convite, memoriais e histórico serão habilitados na Fase 6.',
          icon: 'scale',
        }),
      ],
    }),
  );
}
