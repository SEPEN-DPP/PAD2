/** Utilitários puros de string. Sem dependência externa. */

export function truncar(texto, tamanho = 80) {
  if (!texto) return '';
  return texto.length > tamanho ? `${texto.slice(0, tamanho - 1)}…` : texto;
}

export function iniciais(nomeCompleto) {
  if (!nomeCompleto) return '';
  return nomeCompleto
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((parte) => parte[0]?.toUpperCase())
    .join('');
}

export function capitalizar(texto) {
  if (!texto) return '';
  return texto.charAt(0).toUpperCase() + texto.slice(1).toLowerCase();
}

/** Converte um enum tipo 'EM_ANDAMENTO' em 'Em andamento'. */
export function enumParaLabel(valor) {
  if (!valor) return '';
  return capitalizar(valor.toLowerCase().replaceAll('_', ' '));
}
