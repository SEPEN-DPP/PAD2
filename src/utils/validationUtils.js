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

function apenasDigitos(valor) {
  return String(valor ?? '').replace(/\D/g, '');
}

function digitoVerificadorCpf(digitos, pesoInicial) {
  const soma = digitos
    .split('')
    .reduce((total, digito, indice) => total + Number(digito) * (pesoInicial - indice), 0);
  const resto = (soma * 10) % 11;
  return resto === 10 ? 0 : resto;
}

/**
 * Valida o dígito verificador (checksum) de um CPF — formato matematicamente
 * válido, não que o número pertence à pessoa informada. Confirmar que o CPF
 * é realmente daquela pessoa exigiria consulta a um serviço pago (ex.: Receita
 * Federal), fora do escopo deste projeto (sem orçamento para APIs pagas — ver
 * docs/reuso-pad-v1.md). Isso só barra números obviamente inválidos/aleatórios.
 */
export function ehCpfValido(valor) {
  const digitos = apenasDigitos(valor);
  if (digitos.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(digitos)) return false; // ex.: 000.000.000-00, 111.111.111-11

  const primeiroDigito = digitoVerificadorCpf(digitos.slice(0, 9), 10);
  if (primeiroDigito !== Number(digitos[9])) return false;

  const segundoDigito = digitoVerificadorCpf(digitos.slice(0, 10), 11);
  return segundoDigito === Number(digitos[10]);
}

/** Formata um CPF (só dígitos) como "000.000.000-00" para exibição. */
export function formatarCpf(valor) {
  const digitos = apenasDigitos(valor);
  if (digitos.length !== 11) return valor ?? '';
  return digitos.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
}
