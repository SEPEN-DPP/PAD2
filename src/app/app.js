/**
 * Bootstrap único da aplicação. Decide entre tela de login, tela de
 * autocadastro, tela de "aguardando aprovação" e painel institucional, com
 * base no estado de autenticação do Firebase e no status do perfil em
 * `usuarios` (ver docs/firestore-schema.md).
 */
import { observarSessao, obterPerfilDoUsuario, usuarioAtual, sair } from '../services/auth/authService.js';
import { registrarLog } from '../services/logs/logService.js';
import { montarAppShell } from '../layout/appShell.js';
import { montarAuthLayout } from '../layout/authLayout.js';
import { montarPortalDefesaShell } from '../layout/portalDefesaLayout.js';
import { obterDefensor } from '../services/defensores/defensorService.js';
import { criarRouter } from './router.js';
import { DEFAULT_ROUTE } from '../config/routes.js';
import { podeAcessarRota } from '../config/roles.js';
import { mostrarToast } from '../utils/toast.js';
import { definirUnidadeAtivaAdministrador } from '../state/unidadeAtivaAdministrador.js';

const CHAVE_TEMA = 'pad2:tema';
const HASH_CADASTRO = '#/cadastro';

function aplicarTemaPersistido() {
  const tema = localStorage.getItem(CHAVE_TEMA);
  if (tema) document.documentElement.setAttribute('data-theme', tema);
}

function caminhoInicial() {
  return (location.hash.slice(1) || DEFAULT_ROUTE).split('?')[0] || DEFAULT_ROUTE;
}

async function montarTelaPreAuth(raiz) {
  if (location.hash === HASH_CADASTRO) {
    const { criarFormularioRegistro } = await import('../pages/auth/registro/registroPage.js');
    raiz.replaceChildren(
      montarAuthLayout({
        filhos: [
          criarFormularioRegistro({
            onVoltarParaLogin: () => {
              location.hash = '';
            },
          }),
        ],
      }),
    );
    return;
  }

  const { criarFormularioLogin } = await import('../pages/auth/login/loginPage.js');
  raiz.replaceChildren(
    montarAuthLayout({
      filhos: [
        criarFormularioLogin({
          onSolicitarAcesso: () => {
            location.hash = HASH_CADASTRO;
          },
        }),
      ],
    }),
  );
}

async function montarTelaAguardandoOuCompletarCadastro(raiz, perfilDoc) {
  if (!perfilDoc) {
    const { criarFormularioCompletarCadastro } = await import('../pages/auth/registro/registroPage.js');
    raiz.replaceChildren(montarAuthLayout({ filhos: [criarFormularioCompletarCadastro()] }));
    return;
  }
  const { criarTelaAguardando } = await import('../pages/auth/aguardando/aguardandoPage.js');
  raiz.replaceChildren(
    montarAuthLayout({ filhos: [criarTelaAguardando({ nome: perfilDoc.nome, unidade: perfilDoc.unidadeSolicitada })] }),
  );
}

/**
 * Portal da Defesa (Fase 6, 2026-07-19) — contexto de login separado do
 * painel institucional para contas de `defensores` (advogado constituído ou
 * defensor público). Nunca passa por `montarAppShell`/`criarRouter`: é um
 * shell minimalista próprio (ver src/layout/portalDefesaLayout.js), sem
 * sidebar nem rotas institucionais.
 */
async function montarPortalDefesaApp(raiz, usuarioFirebase, defensorDoc) {
  const { montarPortalDefesa } = await import('../pages/portal-defesa/portalDefesaPage.js');
  const shell = montarPortalDefesaShell({
    nome: defensorDoc.nome ?? usuarioFirebase.email ?? 'Defensor(a)',
    onSair: async () => {
      await registrarLog({ usuarioId: usuarioFirebase.uid, acao: 'LOGOUT' });
      await sair();
    },
  });
  raiz.replaceChildren(shell.raiz);
  await montarPortalDefesa({ outlet: shell.outlet, defensor: { ...defensorDoc, uid: usuarioFirebase.uid } });
}

async function montarPainel(raiz, usuario) {
  // Reinicia sempre em DPP a cada novo login (2026-07-19) — ver
  // src/state/unidadeAtivaAdministrador.js.
  definirUnidadeAtivaAdministrador(null);

  let router;

  const shell = await montarAppShell({
    usuario,
    rotaInicial: caminhoInicial(),
    onNavegar: (path) => {
      location.hash = path;
    },
    onSair: async () => {
      await registrarLog({ usuarioId: usuario.uid, acao: 'LOGOUT' });
      await sair();
    },
    onMudarUnidadeAtiva: (nomeOuNull) => {
      definirUnidadeAtivaAdministrador(nomeOuNull);
      router?.navegar(caminhoInicial());
    },
  });

  raiz.replaceChildren(shell.raiz);

  router = criarRouter({
    outlet: shell.outlet,
    onRotaMudou: (path, titulo) => shell.definirRotaAtiva(path, titulo),
    verificarPermissao: (path) => podeAcessarRota(usuario.perfil, path),
  });
}

/** @param {string} [raizId] id do elemento container no index.html */
export function iniciarApp(raizId = 'app') {
  aplicarTemaPersistido();
  const raiz = document.getElementById(raizId);

  // Navegação entre login/cadastro antes de autenticar (o router de
  // src/app/router.js só entra em ação depois do login).
  window.addEventListener('hashchange', () => {
    if (!usuarioAtual()) montarTelaPreAuth(raiz);
  });

  observarSessao(async (usuarioFirebase) => {
    try {
      if (!usuarioFirebase) {
        await montarTelaPreAuth(raiz);
        return;
      }

      const perfilDoc = await obterPerfilDoUsuario(usuarioFirebase.uid);

      if (!perfilDoc || perfilDoc.status === 'PENDENTE') {
        // Contas do Portal da Defesa nunca têm documento em `usuarios` — só
        // em `defensores` (ver src/services/defensores/defensorService.js).
        const defensorDoc = await obterDefensor(usuarioFirebase.uid);
        if (defensorDoc?.ativo) {
          await registrarLog({ usuarioId: usuarioFirebase.uid, acao: 'LOGIN' });
          await montarPortalDefesaApp(raiz, usuarioFirebase, defensorDoc);
          return;
        }
        await montarTelaAguardandoOuCompletarCadastro(raiz, perfilDoc);
        return;
      }

      const usuario = {
        uid: usuarioFirebase.uid,
        nome: perfilDoc?.nome ?? usuarioFirebase.email ?? 'Usuário',
        perfil: perfilDoc?.perfil ?? null,
        vinculo: perfilDoc?.vinculo ?? null,
      };

      await registrarLog({ usuarioId: usuario.uid, acao: 'LOGIN' });
      await montarPainel(raiz, usuario);
    } catch (erro) {
      // Sem isto, um erro em qualquer etapa acima (ex.: consulta ao Firestore
      // sem índice) trava a troca de tela silenciosamente — a pessoa fica
      // olhando pra tela anterior sem nenhuma pista do que aconteceu.
      console.error('Falha ao montar a aplicação:', erro);
      mostrarToast('Não foi possível carregar o sistema. Recarregue a página.', 'erro');
    }
  });
}
