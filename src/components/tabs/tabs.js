/**
 * Abas simples (client-side, sem roteamento próprio). Usado no detalhe do
 * PAD para separar Dados Gerais / Eventos / Documentos / Anexos / Defesa /
 * Conselho / Decisão / Histórico.
 */
import { criarElemento, carregarCssUmaVez, limparContainer } from '../../utils/domUtils.js';

/**
 * @param {Array<{ id: string, titulo: string, render: () => Node }>} abas
 * @param {string} [abaInicial]
 */
export function criarTabs(abas, abaInicial = abas[0]?.id) {
  carregarCssUmaVez('src/components/tabs/tabs.css');

  const nav = criarElemento('div', { class: 'tabs__nav' });
  const painel = criarElemento('div', { class: 'tabs__painel' });
  const botoes = new Map();

  function selecionar(id) {
    for (const [idBotao, botao] of botoes) {
      botao.classList.toggle('tabs__botao--ativo', idBotao === id);
    }
    limparContainer(painel);
    const aba = abas.find((a) => a.id === id);
    painel.append(aba.render());
  }

  for (const aba of abas) {
    const botao = criarElemento(
      'button',
      { class: 'tabs__botao', type: 'button', onClick: () => selecionar(aba.id) },
      [aba.titulo],
    );
    botoes.set(aba.id, botao);
    nav.append(botao);
  }

  selecionar(abaInicial);

  return criarElemento('div', { class: 'tabs' }, [nav, painel]);
}
