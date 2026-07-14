/**
 * Barra superior: título da página atual, alternância de tema e menu do
 * usuário autenticado. Não conhece rotas nem regras — recebe tudo via props.
 */
import { criarElemento, carregarCssUmaVez } from '../../utils/domUtils.js';
import { icone } from '../icon/icon.js';
import { iniciais } from '../../utils/stringUtils.js';

const CHAVE_TEMA = 'pad2:tema';

function temaAtual() {
  return document.documentElement.getAttribute('data-theme') ?? 'light';
}

function alternarTema() {
  const novo = temaAtual() === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', novo);
  localStorage.setItem(CHAVE_TEMA, novo);
  return novo;
}

/**
 * @param {{ titulo: string, usuario: { nome: string, perfilLabel: string } | null, onSair: () => void }} params
 */
export function criarTopbar({ titulo, usuario, onSair }) {
  carregarCssUmaVez('src/components/topbar/topbar.css');

  const botaoTema = criarElemento(
    'button',
    { class: 'topbar__icone-btn', type: 'button', title: 'Alternar tema' },
    [icone(temaAtual() === 'dark' ? 'sun' : 'moon')],
  );
  botaoTema.addEventListener('click', () => {
    const novo = alternarTema();
    botaoTema.innerHTML = icone(novo === 'dark' ? 'sun' : 'moon');
  });

  const usuarioBloco = usuario
    ? criarElemento('div', { class: 'topbar__usuario' }, [
        criarElemento('span', { class: 'topbar__avatar' }, [iniciais(usuario.nome)]),
        criarElemento('div', { class: 'topbar__usuario-info' }, [
          criarElemento('span', { class: 'topbar__usuario-nome' }, [usuario.nome]),
          criarElemento('span', { class: 'topbar__usuario-perfil' }, [usuario.perfilLabel]),
        ]),
        criarElemento(
          'button',
          { class: 'topbar__icone-btn', type: 'button', title: 'Sair', onClick: onSair },
          [icone('log-out')],
        ),
      ])
    : criarElemento('div', {});

  const tituloEl = criarElemento('h1', { class: 'topbar__titulo' }, [titulo]);

  const raiz = criarElemento('header', { class: 'topbar' }, [
    tituloEl,
    criarElemento('div', { class: 'topbar__acoes' }, [
      botaoTema,
      criarElemento('button', { class: 'topbar__icone-btn', type: 'button', title: 'Notificações' }, [
        icone('bell'),
      ]),
      usuarioBloco,
    ]),
  ]);

  raiz.atualizarTitulo = (novoTitulo) => {
    tituloEl.textContent = novoTitulo;
  };

  return raiz;
}
