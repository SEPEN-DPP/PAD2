/** Utilitários pequenos para manipulação de DOM sem framework. */

/**
 * Converte uma string de markup (ex.: o SVG retornado por
 * src/components/icon/icon.js) em nós de DOM reais. Usa <template> porque o
 * parser HTML sabe criar elementos SVG corretamente a partir de innerHTML.
 */
function markupParaNos(markup) {
  const template = document.createElement('template');
  template.innerHTML = markup;
  return [...template.content.childNodes];
}

/**
 * Cria um elemento com atributos e filhos de forma declarativa. Strings que
 * começam com "<" (ex.: ícones SVG de src/components/icon/icon.js) são
 * tratadas como markup confiável e viram nós reais; demais strings viram
 * texto simples.
 *
 * Atenção: isso assume que nenhuma string começando com "<" chega aqui vinda
 * de dado não confiável (nesta fase, nenhuma tela grava texto de usuário no
 * Firestore ainda). Quando a Fase 2+ permitir edição de campos exibidos via
 * este helper, revisar se algum deles precisa ser sempre tratado como texto
 * (ex.: passando já como Node/TextNode em vez de string).
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
    if (filho instanceof Node) {
      el.append(filho);
    } else if (typeof filho === 'string' && filho.trimStart().startsWith('<')) {
      el.append(...markupParaNos(filho));
    } else {
      el.append(document.createTextNode(String(filho)));
    }
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
