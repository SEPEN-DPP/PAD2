import { test } from 'node:test';
import assert from 'node:assert/strict';
import { renderizar } from '../../src/templates/declaracaoApenadoTemplate.js';

const PAD_BASE = {
  dadosGerais: { numero: '001/2026', unidade: 'Presídio Regional de Itapema' },
  incidentados: [{ nomeCompleto: 'FULANO DE TAL', ipen: '750126' }],
  infracao: { artigoLep: { codigo: 'art50_vii', rotulo: 'Art. 50, VII — LEP' } },
  portaria: { dataAssinatura: new Date(2026, 6, 14) },
};
const INCIDENTADO = { id: 'i1', nomeCompleto: 'FULANO DE TAL', ipen: '750126' };

test('silencio=true: corpo inteiro reflete a opção de ficar em silêncio, sem citar versão nenhuma', () => {
  const doc = renderizar(PAD_BASE, INCIDENTADO, { silencio: true, versaoIncidentado: 'não deveria aparecer' });
  const corpo = doc.secoes.flatMap((s) => s.conteudo).join(' ');
  assert.match(corpo, /optou por permanecer em silêncio/);
  assert.doesNotMatch(corpo, /não deveria aparecer/);
});

test('silencio=false: corpo cita a versão do incidentado entre aspas', () => {
  const doc = renderizar(PAD_BASE, INCIDENTADO, { silencio: false, versaoIncidentado: 'Eu não fiz isso.' });
  const corpo = doc.secoes.flatMap((s) => s.conteudo).join(' ');
  assert.match(corpo, /"Eu não fiz isso\."/);
});

test('assinatura do defensor aparece só quando defesa.tipo está definido', () => {
  const comDefensor = renderizar({ ...PAD_BASE, defesa: { tipo: 'defensoria' } }, INCIDENTADO, { silencio: true });
  assert.match(comDefensor.assinaturas[1].nome, /Defensor\(a\): Defensoria Pública/);

  const semDefensor = renderizar({ ...PAD_BASE, defesa: {} }, INCIDENTADO, { silencio: true });
  assert.equal(semDefensor.assinaturas[1].nome, 'Sem defensor(a)');
});

test('identifica o incidentado passado como parâmetro, não incidentados[0] do PAD', () => {
  const outroIncidentado = { id: 'i2', nomeCompleto: 'OUTRA PESSOA', ipen: '999999' };
  const doc = renderizar(PAD_BASE, outroIncidentado, { silencio: true });
  const corpo = doc.secoes[0].conteudo;
  assert.match(corpo, /OUTRA PESSOA – IPEN Nº 999999/);
  assert.equal(doc.assinaturas[0].nome, 'Incidentado(a): OUTRA PESSOA');
});
