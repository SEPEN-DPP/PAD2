import { test } from 'node:test';
import assert from 'node:assert/strict';
import { renderizar } from '../../src/templates/manifestacaoDefesaTemplate.js';

test('Manifestação da Defesa nunca leva cabeçalho institucional (semCabecalho: true)', () => {
  const doc = renderizar({ defesa: { texto: 'Alego que...' } });
  assert.equal(doc.semCabecalho, true);
  assert.equal(doc.titulo, null);
});

test('Manifestação da Defesa mostra só o texto da defesa, sem identificar o defensor', () => {
  const doc = renderizar({ defesa: { tipo: 'advogado', advogadoNome: 'Dr. Fulano', texto: 'Minha manifestação.' } });
  const corpo = doc.secoes.map((s) => s.conteudo).join(' ');
  assert.match(corpo, /Minha manifestação\./);
  assert.doesNotMatch(corpo, /Dr\. Fulano/);
});

test('sem texto, mostra placeholder orientando preencher/ditar/anexar', () => {
  const doc = renderizar({ defesa: {} });
  assert.match(doc.secoes[0].conteudo, /preencha no formulário, dite por voz ou anexe o PDF/);
});
