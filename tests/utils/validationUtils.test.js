import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ehCpfValido, formatarCpf, ehDataBrValida } from '../../src/utils/validationUtils.js';

test('ehCpfValido aceita CPFs com dígito verificador correto', () => {
  assert.equal(ehCpfValido('111.444.777-35'), true);
  assert.equal(ehCpfValido('529.982.247-25'), true);
  assert.equal(ehCpfValido('11144477735'), true); // sem formatação também funciona
});

test('ehCpfValido rejeita dígito verificador incorreto', () => {
  assert.equal(ehCpfValido('111.444.777-36'), false);
  assert.equal(ehCpfValido('123.456.789-00'), false);
});

test('ehCpfValido rejeita sequências repetidas (falso-positivo comum)', () => {
  assert.equal(ehCpfValido('000.000.000-00'), false);
  assert.equal(ehCpfValido('111.111.111-11'), false);
});

test('ehCpfValido rejeita tamanho inválido', () => {
  assert.equal(ehCpfValido('123456789'), false);
  assert.equal(ehCpfValido(''), false);
  assert.equal(ehCpfValido(null), false);
});

test('formatarCpf formata 11 dígitos como 000.000.000-00', () => {
  assert.equal(formatarCpf('11144477735'), '111.444.777-35');
});

test('ehDataBrValida aceita datas reais no passado em dd/mm/aaaa', () => {
  assert.equal(ehDataBrValida('15/03/1990'), true);
});

test('ehDataBrValida rejeita datas inexistentes, formato errado e datas futuras', () => {
  assert.equal(ehDataBrValida('31/02/1990'), false); // fevereiro não tem dia 31
  assert.equal(ehDataBrValida('1990-03-15'), false); // formato ISO, não dd/mm/aaaa
  assert.equal(ehDataBrValida('15/03/2999'), false); // futuro
});
