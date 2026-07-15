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
    path: '/eventos',
    title: 'Eventos',
    icon: 'list-checks',
    load: () => import('../pages/eventos/eventosPage.js'),
    nav: true,
  },
  {
    path: '/documentos',
    title: 'Documentos',
    icon: 'file-stack',
    load: () => import('../pages/documentos/documentosPage.js'),
    nav: true,
  },
  {
    path: '/anexos',
    title: 'Anexos',
    icon: 'paperclip',
    load: () => import('../pages/anexos/anexosPage.js'),
    nav: true,
  },
  {
    path: '/portal-advogado',
    title: 'Portal da Defesa',
    icon: 'scale',
    load: () => import('../pages/portal-advogado/portalAdvogadoPage.js'),
    nav: true,
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
    path: '/exportacao',
    title: 'Exportação',
    icon: 'download',
    load: () => import('../pages/exportacao/exportacaoPage.js'),
    nav: true,
  },
  {
    path: '/ia',
    title: 'IA',
    icon: 'sparkles',
    load: () => import('../pages/ia/iaPage.js'),
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
