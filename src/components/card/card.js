/**
 * Card genérico de conteúdo — envelope visual reutilizado por praticamente
 * todas as páginas (substitui a "aparência de formulário").
 */
import { criarElemento, carregarCssUmaVez } from '../../utils/domUtils.js';

/**
 * @param {{ titulo?: string, acoes?: Node[], filhos: Array<Node|string> }} params
 */
export function criarCard({ titulo, acoes = [], filhos = [] }) {
  carregarCssUmaVez('src/components/card/card.css');

  const cabecalho = titulo
    ? criarElemento('div', { class: 'card__cabecalho' }, [
        criarElemento('h3', { class: 'card__titulo' }, [titulo]),
        criarElemento('div', { class: 'card__acoes' }, acoes),
      ])
    : null;

  return criarElemento(
    'section',
    { class: 'card' },
    [cabecalho, criarElemento('div', { class: 'card__corpo' }, filhos)].filter(Boolean),
  );
}
