/** Trilha de navegação simples (ex.: PAD / Nº 0042/2026 / Eventos). */
import { criarElemento, carregarCssUmaVez } from '../../utils/domUtils.js';

/** @param {Array<{ texto: string, path?: string }>} itens */
export function criarBreadcrumbs(itens, onNavegar) {
  carregarCssUmaVez('src/components/breadcrumbs/breadcrumbs.css');

  const partes = itens.flatMap((item, indice) => {
    const ultimo = indice === itens.length - 1;
    const el =
      item.path && !ultimo
        ? criarElemento('button', { class: 'breadcrumbs__item', type: 'button', onClick: () => onNavegar(item.path) }, [item.texto])
        : criarElemento('span', { class: 'breadcrumbs__item breadcrumbs__item--atual' }, [item.texto]);
    return ultimo ? [el] : [el, criarElemento('span', { class: 'breadcrumbs__separador' }, ['/'])];
  });

  return criarElemento('nav', { class: 'breadcrumbs', 'aria-label': 'Trilha de navegação' }, partes);
}
