/**
 * Perfis de usuário e matriz de permissões por rota. A matriz completa de
 * ações (não só navegação) será refinada na Fase 1 — ver ROADMAP.md.
 * Documentação legível em docs/permissions-matrix.md.
 */

export const ROLES = Object.freeze({
  ADMINISTRADOR: 'ADMINISTRADOR',
  DIRETOR: 'DIRETOR',
  SUBDIRETOR: 'SUBDIRETOR',
  SERVIDOR: 'SERVIDOR',
  CONSELHO_DISCIPLINAR: 'CONSELHO_DISCIPLINAR',
  ADVOGADO: 'ADVOGADO',
  DEFENSOR_PUBLICO: 'DEFENSOR_PUBLICO',
});

export const ROLE_LABELS = Object.freeze({
  ADMINISTRADOR: 'Administrador',
  DIRETOR: 'Diretor',
  SUBDIRETOR: 'Subdiretor',
  SERVIDOR: 'Servidor',
  CONSELHO_DISCIPLINAR: 'Conselho Disciplinar',
  ADVOGADO: 'Advogado',
  DEFENSOR_PUBLICO: 'Defensor Público',
});

export const PAINEL_INSTITUCIONAL = Object.freeze([
  ROLES.ADMINISTRADOR,
  ROLES.DIRETOR,
  ROLES.SUBDIRETOR,
  ROLES.SERVIDOR,
  ROLES.CONSELHO_DISCIPLINAR,
]);

/**
 * Perfis autorizados a acessar cada rota do painel institucional. Rotas
 * ausentes deste mapa são tratadas como liberadas para qualquer perfil
 * autenticado do painel. O Portal da Defesa (Fase 6) nem passa por este
 * router — é um contexto de login separado, montado por
 * src/app/app.js:montarPortalDefesaApp para contas em `defensores`
 * (ver src/pages/portal-defesa).
 */
export const ROUTE_PERMISSIONS = Object.freeze({
  '/dashboard': PAINEL_INSTITUCIONAL,
  '/pad': PAINEL_INSTITUCIONAL,
  '/pad/novo': [ROLES.ADMINISTRADOR, ROLES.DIRETOR, ROLES.SUBDIRETOR, ROLES.SERVIDOR],
  '/portal-defesa': PAINEL_INSTITUCIONAL,
  '/usuarios': [ROLES.ADMINISTRADOR, ROLES.DIRETOR],
  // Aberta a todo o painel institucional porque "Alterar Senha" é universal
  // (ver src/pages/configuracoes/configuracoesPage.js); os parâmetros
  // institucionais em si (ainda não implementados) vão precisar de uma
  // restrição própria por ação quando existirem de verdade (Fase 2+).
  '/configuracoes': PAINEL_INSTITUCIONAL,
  '/relatorios': [ROLES.ADMINISTRADOR, ROLES.DIRETOR, ROLES.SUBDIRETOR],
  '/advogados': PAINEL_INSTITUCIONAL,
});

/** Verifica se um perfil pode acessar uma rota. */
export function podeAcessarRota(perfil, rota) {
  const permitidos = ROUTE_PERMISSIONS[rota];
  if (!permitidos) return Boolean(perfil);
  return permitidos.includes(perfil);
}
