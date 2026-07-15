import { test } from 'node:test';
import assert from 'node:assert/strict';
import { renderizar } from '../../src/templates/oitivaTestemunhaTemplate.js';

const PAD_BASE = {
  dadosGerais: { numero: '001/2026', unidade: 'Presídio Regional de Itapema' },
  portaria: { dataAssinatura: new Date(2026, 6, 14) },
};

test('qualidade "testemunha": título e advertência de compromisso legal', () => {
  const doc = renderizar(PAD_BASE, { nome: 'CICLANO', qualificacao: 'agente', qualidade: 'testemunha', depoimento: 'Vi tudo.' });
  assert.equal(doc.titulo, 'TERMO DE OITIVA DE TESTEMUNHA');
  const corpo = doc.secoes.map((s) => s.conteudo).join(' ');
  assert.match(corpo, /crime de falso testemunho/);
  assert.equal(doc.assinaturas[0].nome, 'Testemunha: CICLANO');
});

test('qualidade "informante": título e advertência sem compromisso legal', () => {
  const doc = renderizar(PAD_BASE, { nome: 'BELTRANO', qualificacao: 'preso', qualidade: 'informante', depoimento: 'Ouvi dizer.' });
  assert.equal(doc.titulo, 'TERMO DE OITIVA DE INFORMANTE');
  const corpo = doc.secoes.map((s) => s.conteudo).join(' ');
  assert.match(corpo, /não tendo, por isso, o compromisso legal de dizer a verdade/);
  assert.equal(doc.assinaturas[0].nome, 'Informante: BELTRANO');
});
