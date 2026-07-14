/** Estado vazio padrão — usado por listas e tabelas sem dados ainda. */
import { criarElemento, carregarCssUmaVez } from '../../utils/domUtils.js';
import { icone } from '../icon/icon.js';

/** @param {{ titulo: string, descricao?: string, icon?: string, acao?: Node }} params */
export function criarEmptyState({ titulo, descricao, icon = 'file-text', acao }) {
  carregarCssUmaVez('src/components/emptyState/emptyState.css');

  return criarElemento(
    'div',
    { class: 'empty-state' },
    [
      criarElemento('div', { class: 'empty-state__icone' }, [icone(icon, { size: 28 })]),
      criarElemento('p', { class: 'empty-state__titulo' }, [titulo]),
      descricao ? criarElemento('p', { class: 'empty-state__descricao text-muted' }, [descricao]) : null,
      acao ?? null,
    ].filter(Boolean),
  );
}
