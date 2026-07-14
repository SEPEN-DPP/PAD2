/**
 * Router SPA baseado em hash (`#/rota`), sem dependência externa. Resolve a
 * rota, verifica permissão de acesso (via callback) e monta o módulo de
 * página correspondente dentro do outlet fornecido pelo AppShell.
 */
import { ROUTES, DEFAULT_ROUTE } from '../config/routes.js';
import { criarElemento } from '../utils/domUtils.js';
import { mostrarToast } from '../utils/toast.js';

function compilarRota(path) {
  const nomesParametros = [];
  const padrao = path
    .split('/')
    .map((segmento) => {
      if (segmento.startsWith(':')) {
        nomesParametros.push(segmento.slice(1));
        return '([^/]+)';
      }
      return segmento.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    })
    .join('/');
  return { regex: new RegExp(`^${padrao}$`), nomesParametros };
}

const rotasCompiladas = ROUTES.map((rota) => ({ ...rota, ...compilarRota(rota.path) }));

function resolverCaminhoAtual() {
  return (location.hash.slice(1) || DEFAULT_ROUTE).split('?')[0] || DEFAULT_ROUTE;
}

function encontrarRota(caminho) {
  for (const rota of rotasCompiladas) {
    const match = caminho.match(rota.regex);
    if (match) {
      const params = Object.fromEntries(rota.nomesParametros.map((nome, i) => [nome, match[i + 1]]));
      return { rota, params };
    }
  }
  return null;
}

async function renderizarNaoEncontrada(outlet) {
  outlet.replaceChildren(
    criarElemento('div', { class: 'text-muted' }, ['Página não encontrada.']),
  );
}

/**
 * @param {{ outlet: HTMLElement, onRotaMudou: (path: string, titulo: string) => void, verificarPermissao: (path: string) => boolean }} params
 */
export function criarRouter({ outlet, onRotaMudou, verificarPermissao }) {
  async function despachar() {
    const caminho = resolverCaminhoAtual();
    const encontrada = encontrarRota(caminho);

    if (!encontrada) {
      await renderizarNaoEncontrada(outlet);
      return;
    }

    const { rota, params } = encontrada;

    if (!verificarPermissao(rota.path)) {
      mostrarToast('Seu perfil não tem acesso a essa área.', 'aviso');
      navegar(DEFAULT_ROUTE);
      return;
    }

    onRotaMudou(rota.path, rota.title);

    try {
      const modulo = await rota.load();
      outlet.replaceChildren();
      await modulo.render(outlet, params);
    } catch (erro) {
      console.error(`Falha ao carregar a página ${rota.path}:`, erro);
      mostrarToast('Não foi possível carregar esta página.', 'erro');
    }
  }

  function navegar(path) {
    if (location.hash.slice(1) === path) {
      despachar();
    } else {
      location.hash = path;
    }
  }

  window.addEventListener('hashchange', despachar);
  despachar();

  return { navegar };
}
