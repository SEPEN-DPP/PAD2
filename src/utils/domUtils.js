/** Utilitários pequenos para manipulação de DOM sem framework. */

/**
 * Cria um elemento com atributos e filhos de forma declarativa.
 * @param {string} tag
 * @param {object} [attrs]
 * @param {Array<Node|string>} [filhos]
 */
export function criarElemento(tag, attrs = {}, filhos = []) {
  const el = document.createElement(tag);
  for (const [chave, valor] of Object.entries(attrs)) {
    if (chave === 'class') el.className = valor;
    else if (chave === 'dataset') Object.assign(el.dataset, valor);
    else if (chave.startsWith('on') && typeof valor === 'function') {
      el.addEventListener(chave.slice(2).toLowerCase(), valor);
    } else if (valor !== undefined && valor !== null) {
      el.setAttribute(chave, valor);
    }
  }
  for (const filho of filhos) {
    el.append(filho instanceof Node ? filho : document.createTextNode(String(filho)));
  }
  return el;
}

/** Remove todos os filhos de um container antes de renderizar de novo. */
export function limparContainer(container) {
  container.replaceChildren();
}

/** Carrega um CSS colocalizado a um componente/página apenas uma vez. */
const foldersCssCarregados = new Set();
export function carregarCssUmaVez(caminhoCss) {
  if (foldersCssCarregados.has(caminhoCss)) return;
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = caminhoCss;
  document.head.append(link);
  foldersCssCarregados.add(caminhoCss);
}
