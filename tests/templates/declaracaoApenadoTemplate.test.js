import { test } from 'node:test';
import assert from 'node:assert/strict';
import { renderizar } from '../../src/templates/declaracaoApenadoTemplate.js';

const PAD_BASE = {
  dadosGerais: { numero: '001/2026', unidade: 'Presídio Regional de Itapema' },
  incidentados: [{ nomeCompleto: 'FULANO DE TAL', ipen: '750126' }],
  infracao: { artigoLep: { codigo: 'art50_vii', rotulo: 'Art. 50, VII — LEP' } },
  portaria: { dataAssinatura: new Date(2026, 6, 14) },
};

test('silencio=true: corpo inteiro reflete a opção de ficar em silêncio, sem citar versão nenhuma', () => {
  const doc = renderizar({ ...PAD_BASE, declaracoesApenado: { silencio: true, versaoIncidentado: 'não deveria aparecer' } });
  const corpo = doc.secoes.flatMap((s) => s.conteudo).join(' ');
  assert.match(corpo, /optou por permanecer em silêncio/);
  assert.doesNotMatch(corpo, /não deveria aparecer/);
});

test('silencio=false: corpo cita a versão do incidentado entre aspas', () => {
  const doc = renderizar({ ...PAD_BASE, declaracoesApenado: { silencio: false, versaoIncidentado: 'Eu não fiz isso.' } });
  const corpo = doc.secoes.flatMap((s) => s.conteudo).join(' ');
  assert.match(corpo, /"Eu não fiz isso\."/);
});

test('assinatura do defensor aparece só quando defesa.tipo está definido', () => {
  const comDefensor = renderizar({ ...PAD_BASE, declaracoesApenado: { silencio: true }, defesa: { tipo: 'defensoria' } });
  assert.match(comDefensor.assinaturas[1].nome, /Defensor\(a\): Defensoria Pública/);

  const semDefensor = renderizar({ ...PAD_BASE, declaracoesApenado: { silencio: true }, defesa: {} });
  assert.equal(semDefensor.assinaturas[1].nome, 'Sem defensor(a)');
});
