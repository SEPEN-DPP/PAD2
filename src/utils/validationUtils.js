/**
 * Validações genéricas de formato (não regras de negócio do PAD). Usadas em
 * formulários de infraestrutura como o login.
 */

export function ehEmailValido(valor) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(valor ?? '');
}

export function ehCampoObrigatorio(valor) {
  return valor !== null && valor !== undefined && String(valor).trim().length > 0;
}

export function ehPdf(arquivo) {
  return arquivo?.type === 'application/pdf';
}
