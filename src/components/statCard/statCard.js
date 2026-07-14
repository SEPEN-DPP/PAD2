/**
 * Cartão de indicador numérico usado no Dashboard (total de PADs, em
 * andamento, concluídos etc.). Puramente apresentacional.
 */
import { criarElemento, carregarCssUmaVez } from '../../utils/domUtils.js';
import { icone } from '../icon/icon.js';

/**
 * @param {{ titulo: string, valor: number|string, icon: string, tom?: 'neutro'|'sucesso'|'aviso'|'info' }} params
 */
export function criarStatCard({ titulo, valor, icon, tom = 'neutro' }) {
  carregarCssUmaVez('src/components/statCard/statCard.css');

  return criarElemento('div', { class: `stat-card stat-card--${tom}` }, [
    criarElemento('div', { class: 'stat-card__icone' }, [icone(icon, { size: 22 })]),
    criarElemento('div', { class: 'stat-card__corpo' }, [
      criarElemento('span', { class: 'stat-card__valor' }, [String(valor)]),
      criarElemento('span', { class: 'stat-card__titulo' }, [titulo]),
    ]),
  ]);
}
