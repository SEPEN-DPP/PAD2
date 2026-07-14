import { test } from 'node:test';
import assert from 'node:assert/strict';
import { formatarData, tempoRelativo } from '../../src/utils/dateUtils.js';

test('formatarData retorna travessão para valor vazio', () => {
  assert.equal(formatarData(null), '—');
  assert.equal(formatarData(undefined), '—');
});

test('formatarData formata uma data válida em pt-BR', () => {
  const resultado = formatarData('2026-01-15T00:00:00Z');
  assert.match(resultado, /\d{2}\/\d{2}\/\d{4}/);
});

test('tempoRelativo indica "agora mesmo" para instantes recentes', () => {
  assert.equal(tempoRelativo(new Date().toISOString()), 'agora mesmo');
});
