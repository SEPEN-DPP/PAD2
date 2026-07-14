/**
 * Notificações toast globais. Utilitário de UI genérico — qualquer page ou
 * componente pode chamar `mostrarToast` sem se preocupar com montagem do
 * container.
 */
import { criarElemento } from './domUtils.js';

let container;

function garantirContainer() {
  if (container) return container;
  container = criarElemento('div', { class: 'toast-container', 'aria-live': 'polite' });
  document.body.append(container);
  return container;
}

/**
 * @param {string} mensagem
 * @param {'info'|'sucesso'|'erro'|'aviso'} [tipo]
 */
export function mostrarToast(mensagem, tipo = 'info') {
  const raiz = garantirContainer();
  const toast = criarElemento('div', { class: `toast toast--${tipo}` }, [mensagem]);
  raiz.append(toast);
  requestAnimationFrame(() => toast.classList.add('toast--visivel'));
  setTimeout(() => {
    toast.classList.remove('toast--visivel');
    toast.addEventListener('transitionend', () => toast.remove(), { once: true });
  }, 4000);
}
