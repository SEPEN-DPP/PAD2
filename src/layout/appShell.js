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
import { calcularUnidadesVisiveis } from '../services/pads/escopoPad.js';
import { contarMensagensNaoLidas } from '../services/mensagens/mensagemService.js';

/**
 * @param {{ usuario: { nome: string, perfil: string, vinculo?: object } | null, rotaInicial: string, onNavegar: (path: string) => void, onSair: () => void, onMudarUnidadeAtiva?: (nomeOuNull: string|null) => void }} params
 */
export async function montarAppShell({ usuario, rotaInicial, onNavegar, onSair, onMudarUnidadeAtiva }) {
  carregarCssUmaVez('src/layout/appShell.css');

  const rotasVisiveis = ROUTES.filter(
    (rota) => rota.nav && podeAcessarRota(usuario?.perfil, rota.path),
  );

  const escopoDeGestao = calcularEscopoDeGestao(usuario);
  const contadorSolicitacoes = escopoDeGestao.podeGerenciar
    ? (await listarSolicitacoesPendentes(escopoDeGestao)).length
    : 0;
  // Mensagem nova do defensor (2026-07-21) também acende o sininho — soma
  // no mesmo contador; o clique prioriza ir pro Portal da Defesa quando há
  // mensagem não lida, senão vai pras Solicitações como sempre foi.
  const contadorMensagens = await contarMensagensNaoLidas(calcularUnidadesVisiveis(usuario));
  const contadorPendencias = contadorSolicitacoes + contadorMensagens;

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
    temMensagensNaoLidas: contadorMensagens > 0,
    onClicarSino: () => onNavegar(contadorMensagens > 0 ? '/portal-defesa' : '/usuarios'),
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
