/**
 * Shell do Portal da Defesa (Fase 6, 2026-07-19) — contexto de login
 * separado do painel institucional: sem sidebar/navegação institucional, só
 * um topo com o nome do defensor e "Sair". Ver src/app/app.js para o branch
 * que decide montar este shell em vez do AppShell institucional.
 */
import { criarElemento, carregarCssUmaVez } from '../utils/domUtils.js';
import { icone } from '../components/icon/icon.js';
import { criarBotao } from '../components/button/button.js';

/** @param {{ nome: string, onSair: () => void }} params */
export function montarPortalDefesaShell({ nome, onSair }) {
  carregarCssUmaVez('src/layout/portalDefesaLayout.css');

  const botaoSair = criarBotao({ texto: 'Sair', icon: 'log-out', variante: 'secondary', onClick: onSair });

  const topo = criarElemento('header', { class: 'portal-defesa-shell__topo' }, [
    criarElemento('div', { class: 'portal-defesa-shell__marca' }, [icone('scale', { size: 24 }), 'Portal da Defesa']),
    criarElemento('div', { class: 'portal-defesa-shell__usuario' }, [criarElemento('span', {}, [nome]), botaoSair]),
  ]);

  const outlet = criarElemento('main', { class: 'portal-defesa-shell__outlet' });

  return { raiz: criarElemento('div', { class: 'portal-defesa-shell' }, [topo, outlet]), outlet };
}
