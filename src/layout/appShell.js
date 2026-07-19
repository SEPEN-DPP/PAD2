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

  const sidebar = criarSidebar({ rotas: rotasVisiveis, rotaAtiva: rotaInicial, onNavegar });
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
  });

  const outlet = criarElemento('div', { class: 'app-shell__outlet' });
  const main = criarElemento('main', { class: 'app-shell__main' }, [topbar, outlet]);
  const raiz = criarElemento('div', { class: 'app-shell' }, [sidebar, main]);

  function definirRotaAtiva(path, titulo) {
    sidebar.atualizarRotaAtiva(path);
    topbar.atualizarTitulo(titulo);
  }

  return { raiz, outlet, definirRotaAtiva };
}
