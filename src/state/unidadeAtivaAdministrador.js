/**
 * Unidade prisional que um Administrador (FULL ACCESS) escolheu "entrar" pra
 * ver, em vez da visão geral DPP (todas as unidades compiladas). Puramente em
 * memória (não usa localStorage/sessionStorage) — reinicia sozinha em `null`
 * (DPP) a cada novo carregamento da página/login, conforme decidido com o
 * usuário (2026-07-19): "sempre voltar para o DPP" ao entrar.
 *
 * Só afeta Administrador — outros perfis já têm seu recorte fixo via
 * `vinculo` (ver src/services/pads/escopoPad.js).
 */
let unidadeAtiva = null;

export function obterUnidadeAtivaAdministrador() {
  return unidadeAtiva;
}

export function definirUnidadeAtivaAdministrador(nomeOuNull) {
  unidadeAtiva = nomeOuNull || null;
}
