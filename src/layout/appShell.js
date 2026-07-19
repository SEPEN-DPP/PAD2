/**
 * Esqueleto estrutural do painel autenticado: sidebar + topbar + área de
 * conteúdo (outlet). Montado uma única vez pelo bootstrap da aplicação; o
 * router só troca o conteúdo do outlet e atualiza título/rota ativa.
 */
import { criarSidebar } from '../components/sidebar/sidebar.js';
import { criarTopbar } from '../components/topbar/topbar.js';
import { criarSeletorUnidade } from '../components/seletorUnidade/seletorUnidade.js';
import { criarElemento, carregarCssUmaVez } from '../utils/domUtils.js';
import { ROUTES } from '../config/routes.js';
import { podeAcessarRota, ROLE_LABELS, ROLES } from '../config/roles.js';
import { calcularEscopoDeGestao, listarSolicitacoesPendentes } from '../services/usuarios/usuarioService.js';

/**
 * @param {{ usuario: { nome: string, perfil: string, vinculo?: object } | null, rotaInicial: string, onNavegar: (path: string) => void, onSair: () => void, onMudarUnidadeAtiva?: (nomeOuNull: string|null) => void }} params
 */
export async function montarAppShell({ usuario, rotaInicial, onNavegar, onSair, onMudarUnidadeAtiva }) {
  carregarCssUmaVez('src/layout/appShell.css');

  const rotasVisiveis = ROUTES.filter(
    (rota) => rota.nav && podeAcessarRota(usuario?.perfil, rota.path),
  );

  const escopoDeGestao = calcularEscopoDeGestao(usuario);
  const contadorPendencias = escopoDeGestao.podeGerenciar
    ? (await listarSolicitacoesPendentes(escopoDeGestao)).length
    : 0;

  // Em celular/tablet retrato a sidebar vira um painel escondido por padrão
  // (ver @media em sidebar.css) — este botão e o backdrop abaixo controlam a
  // classe única que decide se ela está aberta ou não. `raiz` é referenciada
  // pelas closures antes de existir, mas só é usada de fato depois de
  // montada (clique do usuário), então a atribuição tardia não é problema.
  let raiz;
  function fecharMenuMobile() {
    raiz.classList.remove('app-shell--menu-aberto');
  }
  function alternarMenuMobile() {
    raiz.classList.toggle('app-shell--menu-aberto');
  }

  const sidebar = criarSidebar({
    rotas: rotasVisiveis,
    rotaAtiva: rotaInicial,
    onNavegar: (path) => {
      fecharMenuMobile();
      onNavegar(path);
    },
  });

  const topbar = criarTopbar({
    titulo: ROUTES.find((r) => r.path === rotaInicial)?.title ?? '',
    usuario: usuario ? { nome: usuario.nome, perfilLabel: ROLE_LABELS[usuario.perfil] ?? usuario.perfil } : null,
    onSair,
    contadorPendencias,
    onClicarSino: () => onNavegar('/usuarios'),
    onClicarUsuario: () => onNavegar('/configuracoes'),
    seletorUnidade: usuario?.perfil === ROLES.ADMINISTRADOR
      ? criarSeletorUnidade({ valorInicial: null, onSelecionar: onMudarUnidadeAtiva })
      : null,
    onAbrirMenuMobile: alternarMenuMobile,
  });

  const backdrop = criarElemento('div', { class: 'app-shell__backdrop', onClick: fecharMenuMobile });

  const outlet = criarElemento('div', { class: 'app-shell__outlet' });
  const main = criarElemento('main', { class: 'app-shell__main' }, [topbar, outlet]);
  raiz = criarElemento('div', { class: 'app-shell' }, [sidebar, backdrop, main]);

  function definirRotaAtiva(path, titulo) {
    sidebar.atualizarRotaAtiva(path);
    topbar.atualizarTitulo(titulo);
    fecharMenuMobile();
  }

  return { raiz, outlet, definirRotaAtiva };
}
