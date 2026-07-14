/**
 * Cabeçalho padrão de página: título, descrição opcional e ações (botões)
 * alinhadas à direita. Usado por praticamente todas as pages.
 */
import { criarElemento, carregarCssUmaVez } from '../../utils/domUtils.js';

/** @param {{ titulo: string, descricao?: string, acoes?: Node[] }} params */
export function criarPageHeader({ titulo, descricao, acoes = [] }) {
  carregarCssUmaVez('src/components/pageHeader/pageHeader.css');

  return criarElemento('div', { class: 'page-header' }, [
    criarElemento('div', {}, [
      criarElemento('h2', { class: 'page-header__titulo' }, [titulo]),
      descricao ? criarElemento('p', { class: 'page-header__descricao text-muted' }, [descricao]) : null,
    ].filter(Boolean)),
    acoes.length ? criarElemento('div', { class: 'page-header__acoes' }, acoes) : null,
  ].filter(Boolean));
}
