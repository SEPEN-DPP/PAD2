import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  nomeIpenIncidentado,
  artigoTextoCompleto,
  artigoRotulo,
  textoDefensor,
  textoIncisosDesclassificacao,
  listaSancoes,
  integrantesConselho,
} from '../../src/templates/shared/condicionais.js';

const PAD_BASE = {
  dadosGerais: { numero: '001/2026', unidade: 'Presídio Regional de Itapema' },
  incidentados: [{ nomeCompleto: 'CRISTIAN NELSON CONCEIÇÃO SOUZA', ipen: '750126' }],
  infracao: { artigoLep: { codigo: 'art50_vii', rotulo: 'Art. 50, VII — LEP' } },
};

test('nomeIpenIncidentado monta "NOME – IPEN Nº X"', () => {
  assert.equal(nomeIpenIncidentado(PAD_BASE), 'CRISTIAN NELSON CONCEIÇÃO SOUZA – IPEN Nº 750126');
});

test('nomeIpenIncidentado usa placeholder quando faltam dados', () => {
  const resultado = nomeIpenIncidentado({ incidentados: [] });
  assert.match(resultado, /‹NOME DO INCIDENTADO›/);
  assert.match(resultado, /‹PRONTUÁRIO›/);
});

test('nomeIpenIncidentado junta múltiplos incidentados com "e" antes do último', () => {
  const resultado = nomeIpenIncidentado({
    incidentados: [
      { nomeCompleto: 'FULANO', ipen: '1' },
      { nomeCompleto: 'BELTRANO', ipen: '2' },
      { nomeCompleto: 'CICLANO', ipen: '3' },
    ],
  });
  assert.equal(resultado, 'FULANO – IPEN Nº 1, BELTRANO – IPEN Nº 2 e CICLANO – IPEN Nº 3');
});

test('artigoTextoCompleto junta rótulo e texto legal do artigo da LEP', () => {
  assert.equal(
    artigoTextoCompleto(PAD_BASE),
    'Art. 50, VII — LEP — tiver em sua posse, utilizar ou fornecer aparelho telefônico, de rádio ou similar, que permita a comunicação com outros presos ou com o ambiente externo',
  );
});

test('artigoRotulo usa o rótulo já gravado no PAD (não recalcula)', () => {
  assert.equal(artigoRotulo(PAD_BASE), 'Art. 50, VII — LEP');
});

test('textoDefensor: defensoria pública', () => {
  assert.equal(textoDefensor({ tipo: 'defensoria' }), 'Defensoria Pública do Estado de Santa Catarina');
});

test('textoDefensor: advogado constituído com OAB', () => {
  assert.equal(textoDefensor({ tipo: 'advogado', advogadoNome: 'Dr. Fulano', advogadoOab: 'SC12345' }), 'Dr. Fulano, OAB nº SC12345');
});

test('textoDefensor: sem defesa indicada', () => {
  assert.equal(textoDefensor({}), 'sem assistência de defensor');
});

test('textoIncisosDesclassificacao: um único inciso inclui o texto', () => {
  const resultado = textoIncisosDesclassificacao('leve', ['art95_iii']);
  assert.equal(resultado, 'especificamente o inciso III (portar objeto de valor, além do regularmente permitido)');
});

test('textoIncisosDesclassificacao: múltiplos incisos, sem texto, com "e" antes do último', () => {
  const resultado = textoIncisosDesclassificacao('leve', ['art95_i', 'art95_ii', 'art95_iii']);
  assert.equal(resultado, 'especificamente os incisos I, II e III');
});

test('textoIncisosDesclassificacao: sem seleção retorna string vazia', () => {
  assert.equal(textoIncisosDesclassificacao('leve', []), '');
});

test('listaSancoes: monta cada sanção marcada com sua base legal', () => {
  const resultado = listaSancoes({
    regressaoRegime: true,
    interrupcaoProgressao: false,
    perdaRemicao: { ativo: true, valor: '1/3', modalidade: 'fracao' },
    revogacaoSaidaTemp: true,
    revogacaoTrabalhoExt: false,
  });
  assert.deepEqual(resultado, [
    'regressão do regime de execução penal, nos termos do art. 118, I, da LEP',
    'perda de 1/3 dos dias remidos, nos termos do art. 127 da LEP',
    'revogação da saída temporária, nos termos do art. 125 da LEP',
  ]);
});

test('listaSancoes: sem nenhuma marcada retorna lista vazia', () => {
  assert.deepEqual(listaSancoes({}), []);
});

test('integrantesConselho: usa os dados do PAD quando existem, senão cai para a config da unidade', () => {
  const doPad = integrantesConselho({ conselho: { integrantes: { presidente: { nome: 'A', matricula: '1' } } } }, { conselho: { presidente: { nome: 'B' } } });
  assert.equal(doPad.presidente, 'A – Mat. 1');

  const daConfig = integrantesConselho({}, { conselho: { presidente: { nome: 'B' } } });
  assert.equal(daConfig.presidente, 'B');
});
