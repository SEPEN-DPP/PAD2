import { test } from 'node:test';
import assert from 'node:assert/strict';
import { formatarData, tempoRelativo, dataBrParaDate } from '../../src/utils/dateUtils.js';

test('formatarData retorna travessão para valor vazio', () => {
  assert.equal(formatarData(null), '—');
  assert.equal(formatarData(undefined), '—');
});

test('formatarData formata uma data válida em pt-BR', () => {
  const resultado = formatarData('2026-01-15T00:00:00Z');
  assert.match(resultado, /\d{2}\/\d{2}\/\d{4}/);
});

test('formatarData não perde um dia em datas "yyyy-mm-dd" puras (bug de fuso horário)', () => {
  // new Date('2026-05-25') é meia-noite UTC; em fusos negativos (ex.: Brasil,
  // UTC-3) isso vira 24/05 no horário local se não tratado corretamente.
  assert.equal(formatarData('2026-05-25'), '25/05/2026');
});

test('tempoRelativo indica "agora mesmo" para instantes recentes', () => {
  assert.equal(tempoRelativo(new Date().toISOString()), 'agora mesmo');
});

test('formatarData converte um Timestamp do Firestore (objeto com toDate())', () => {
  const timestampFalso = { toDate: () => new Date(2026, 4, 25) };
  assert.equal(formatarData(timestampFalso), '25/05/2026');
});

test('dataBrParaDate converte "dd/mm/aaaa" para um Date local correto', () => {
  const data = dataBrParaDate('25/05/2026');
  assert.equal(data.getFullYear(), 2026);
  assert.equal(data.getMonth(), 4);
  assert.equal(data.getDate(), 25);
});
