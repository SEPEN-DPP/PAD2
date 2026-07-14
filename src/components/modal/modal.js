/**
 * Modal genérico. Uso: `const fechar = abrirModal({ titulo, conteudo })`.
 * Não gerencia nenhum estado de negócio.
 */
import { criarElemento, carregarCssUmaVez } from '../../utils/domUtils.js';
import { icone } from '../icon/icon.js';

/**
 * @param {{ titulo: string, conteudo: Node|Node[], rodape?: Node[] }} params
 * @returns {() => void} função para fechar o modal
 */
export function abrirModal({ titulo, conteudo, rodape = [] }) {
  carregarCssUmaVez('src/components/modal/modal.css');

  const filhosConteudo = Array.isArray(conteudo) ? conteudo : [conteudo];

  const botaoFechar = criarElemento(
    'button',
    { class: 'modal__fechar', type: 'button', title: 'Fechar' },
    [icone('x')],
  );

  const caixa = criarElemento('div', { class: 'modal__caixa', role: 'dialog', 'aria-modal': 'true' }, [
    criarElemento('div', { class: 'modal__cabecalho' }, [
      criarElemento('h3', { class: 'modal__titulo' }, [titulo]),
      botaoFechar,
    ]),
    criarElemento('div', { class: 'modal__corpo' }, filhosConteudo),
    rodape.length ? criarElemento('div', { class: 'modal__rodape' }, rodape) : null,
  ].filter(Boolean));

  const overlay = criarElemento('div', { class: 'modal__overlay' }, [caixa]);
  document.body.append(overlay);
  document.body.classList.add('modal-aberto');

  function fechar() {
    overlay.remove();
    document.body.classList.remove('modal-aberto');
  }

  botaoFechar.addEventListener('click', fechar);
  overlay.addEventListener('click', (evento) => {
    if (evento.target === overlay) fechar();
  });

  return fechar;
}
