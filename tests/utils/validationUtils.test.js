import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ehCpfValido, formatarCpf } from '../../src/utils/validationUtils.js';

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
