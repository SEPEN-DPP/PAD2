/**
 * Portal do Advogado — reserva de rota e navegação apenas. Implementação
 * completa (autenticação isolada, memoriais, log de acesso) é da Fase 6
 * (ver ROADMAP.md). Nada é implementado aqui além do placeholder.
 */
import { carregarCssUmaVez } from '../../utils/domUtils.js';
import { criarPageHeader } from '../../components/pageHeader/pageHeader.js';
import { criarCard } from '../../components/card/card.js';
import { criarEmptyState } from '../../components/emptyState/emptyState.js';

export async function render(container) {
  carregarCssUmaVez('src/pages/portal-advogado/portalAdvogadoPage.css');

  container.append(
    criarPageHeader({
      titulo: 'Portal do Advogado',
      descricao: 'Acompanhamento processual para advogados e defensores públicos.',
    }),
  );

  container.append(
    criarCard({
      filhos: [
        criarEmptyState({
          titulo: 'Portal do Advogado ainda não disponível',
          descricao:
            'Cadastro pós-cientificação, acesso isolado por convite, memoriais e histórico serão habilitados na Fase 6.',
          icon: 'scale',
        }),
      ],
    }),
  );
}
