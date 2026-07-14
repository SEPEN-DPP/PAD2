/**
 * Layout para telas fora do painel autenticado (login, primeiro acesso do
 * advogado). Fundo institucional + cartão central.
 */
import { criarElemento, carregarCssUmaVez } from '../utils/domUtils.js';
import { icone } from '../components/icon/icon.js';
import { APP_NAME } from '../config/constants.js';

/** @param {{ filhos: Array<Node|string> }} params */
export function montarAuthLayout({ filhos }) {
  carregarCssUmaVez('src/layout/authLayout.css');

  return criarElemento('div', { class: 'auth-layout' }, [
    criarElemento('div', { class: 'auth-layout__card' }, [
      criarElemento('div', { class: 'auth-layout__marca' }, [
        icone('building', { size: 28 }),
        criarElemento('span', {}, [APP_NAME]),
      ]),
      ...filhos,
    ]),
  ]);
}
