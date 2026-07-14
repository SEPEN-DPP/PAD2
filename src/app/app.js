/**
 * Bootstrap único da aplicação. Decide entre tela de login e painel
 * institucional com base no estado de autenticação do Firebase, e monta o
 * AppShell + router quando há sessão válida.
 */
import { observarSessao, obterPerfilDoUsuario, sair } from '../services/auth/authService.js';
import { registrarLog } from '../services/logs/logService.js';
import { montarAppShell } from '../layout/appShell.js';
import { montarAuthLayout } from '../layout/authLayout.js';
import { criarRouter } from './router.js';
import { DEFAULT_ROUTE } from '../config/routes.js';
import { podeAcessarRota } from '../config/roles.js';

const CHAVE_TEMA = 'pad2:tema';

function aplicarTemaPersistido() {
  const tema = localStorage.getItem(CHAVE_TEMA);
  if (tema) document.documentElement.setAttribute('data-theme', tema);
}

function caminhoInicial() {
  return (location.hash.slice(1) || DEFAULT_ROUTE).split('?')[0] || DEFAULT_ROUTE;
}

async function montarTelaLogin(raiz) {
  const { criarFormularioLogin } = await import('../pages/auth/login/loginPage.js');
  raiz.replaceChildren(montarAuthLayout({ filhos: [criarFormularioLogin()] }));
}

async function montarPainel(raiz, usuario) {
  const shell = montarAppShell({
    usuario,
    rotaInicial: caminhoInicial(),
    onNavegar: (path) => {
      location.hash = path;
    },
    onSair: async () => {
      await registrarLog({ usuarioId: usuario.uid, acao: 'LOGOUT' });
      await sair();
    },
  });

  raiz.replaceChildren(shell.raiz);

  criarRouter({
    outlet: shell.outlet,
    onRotaMudou: (path, titulo) => shell.definirRotaAtiva(path, titulo),
    verificarPermissao: (path) => podeAcessarRota(usuario.perfil, path),
  });
}

/** @param {string} [raizId] id do elemento container no index.html */
export function iniciarApp(raizId = 'app') {
  aplicarTemaPersistido();
  const raiz = document.getElementById(raizId);

  observarSessao(async (usuarioFirebase) => {
    if (!usuarioFirebase) {
      await montarTelaLogin(raiz);
      return;
    }

    const perfilDoc = await obterPerfilDoUsuario(usuarioFirebase.uid);
    const usuario = {
      uid: usuarioFirebase.uid,
      nome: perfilDoc?.nome ?? usuarioFirebase.email ?? 'Usuário',
      perfil: perfilDoc?.perfil ?? null,
    };

    await registrarLog({ usuarioId: usuario.uid, acao: 'LOGIN' });
    await montarPainel(raiz, usuario);
  });
}
