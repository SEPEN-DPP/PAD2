/**
 * Tabela de rotas da SPA. Cada entrada mapeia um caminho (hash) para um
 * módulo de página carregado sob demanda (dynamic import) e metadados de
 * navegação usados pela Sidebar. Ver src/app/router.js para o mecanismo de
 * despacho.
 */

export const ROUTES = Object.freeze([
  {
    path: '/dashboard',
    title: 'Dashboard',
    icon: 'layout-dashboard',
    load: () => import('../pages/dashboard/dashboardPage.js'),
    nav: true,
  },
  {
    path: '/pad',
    title: 'PAD',
    icon: 'folder-search',
    load: () => import('../pages/pad/list/padListPage.js'),
    nav: true,
  },
  {
    path: '/pad/novo',
    title: 'Novo PAD',
    icon: 'file-plus',
    load: () => import('../pages/pad/new/padNewPage.js'),
    nav: false,
  },
  {
    path: '/pad/:id',
    title: 'Detalhe do PAD',
    icon: 'file-text',
    load: () => import('../pages/pad/detail/padDetailPage.js'),
    nav: false,
  },
  {
    path: '/usuarios',
    title: 'Usuários',
    icon: 'users',
    load: () => import('../pages/usuarios/usuariosPage.js'),
    nav: true,
  },
  {
    path: '/relatorios',
    title: 'Relatórios',
    icon: 'bar-chart-3',
    load: () => import('../pages/relatorios/relatoriosPage.js'),
    nav: true,
  },
  {
    path: '/portal-defesa',
    title: 'Portal da Defesa',
    icon: 'eye',
    load: () => import('../pages/portal-defesa-preview/portalDefesaPreviewPage.js'),
    nav: true,
  },
  {
    path: '/advogados',
    title: 'Advogados e Defensores',
    icon: 'scale',
    load: () => import('../pages/advogados/advogadosPage.js'),
    nav: true,
  },
  {
    path: '/configuracoes',
    title: 'Configurações',
    icon: 'settings',
    load: () => import('../pages/configuracoes/configuracoesPage.js'),
    nav: true,
  },
]);

export const LOGIN_ROUTE = '/login';
export const DEFAULT_ROUTE = '/dashboard';
export const NOT_FOUND_ROUTE = '/404';
