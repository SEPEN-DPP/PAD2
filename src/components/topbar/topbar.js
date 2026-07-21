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
 * @param {{ titulo: string, usuario: { nome: string, perfilLabel: string } | null, onSair: () => void, contadorPendencias?: number, temMensagensNaoLidas?: boolean, onClicarSino?: () => void, onClicarUsuario?: () => void, seletorUnidade?: Node, onAbrirMenuMobile?: () => void }} params
 */
export function criarTopbar({ titulo, usuario, onSair, contadorPendencias = 0, temMensagensNaoLidas = false, onClicarSino, onClicarUsuario, seletorUnidade, onAbrirMenuMobile }) {
  carregarCssUmaVez('src/components/topbar/topbar.css');

  const botaoMenuMobile = criarElemento(
    'button',
    { class: 'topbar__icone-btn app-shell__botao-menu', type: 'button', title: 'Abrir menu', onClick: onAbrirMenuMobile },
    [icone('menu')],
  );

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
        criarElemento(
          'button',
          {
            class: 'topbar__usuario-btn',
            type: 'button',
            title: 'Configurações da conta (alterar senha)',
            onClick: onClicarUsuario,
          },
          [
            criarElemento('span', { class: 'topbar__avatar' }, [iniciais(usuario.nome)]),
            criarElemento('div', { class: 'topbar__usuario-info' }, [
              criarElemento('span', { class: 'topbar__usuario-nome' }, [usuario.nome]),
              criarElemento('span', { class: 'topbar__usuario-perfil' }, [usuario.perfilLabel]),
            ]),
          ],
        ),
        criarElemento(
          'button',
          { class: 'topbar__icone-btn', type: 'button', title: 'Sair', onClick: onSair },
          [icone('log-out')],
        ),
      ])
    : criarElemento('div', {});

  const tituloEl = criarElemento('h1', { class: 'topbar__titulo' }, [titulo]);

  const botaoSino = criarElemento(
    'button',
    {
      class: 'topbar__icone-btn topbar__sino',
      type: 'button',
      title: temMensagensNaoLidas ? 'Mensagem nova do(a) defensor(a) / solicitações pendentes' : 'Solicitações pendentes',
      onClick: onClicarSino,
    },
    [
      icone('bell'),
      contadorPendencias > 0
        ? criarElemento('span', { class: 'topbar__sino-badge' }, [String(contadorPendencias)])
        : null,
    ].filter(Boolean),
  );

  const raiz = criarElemento('header', { class: 'topbar' }, [
    botaoMenuMobile,
    tituloEl,
    criarElemento('div', { class: 'topbar__acoes' }, [seletorUnidade ?? null, botaoTema, botaoSino, usuarioBloco].filter(Boolean)),
  ]);

  raiz.atualizarTitulo = (novoTitulo) => {
    tituloEl.textContent = novoTitulo;
  };

  return raiz;
}
