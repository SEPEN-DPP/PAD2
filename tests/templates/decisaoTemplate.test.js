import { test } from 'node:test';
import assert from 'node:assert/strict';
import { renderizar } from '../../src/templates/decisaoTemplate.js';

const PAD_BASE = {
  dadosGerais: { numero: '001/2026', unidade: 'Presídio Regional de Itapema' },
  incidentados: [{ nomeCompleto: 'FULANO DE TAL', ipen: '750126' }],
  infracao: { data: '25/05/2026', artigoLep: { codigo: 'art50_vii', rotulo: 'Art. 50, VII — LEP' } },
  portaria: { dataAssinatura: new Date(2026, 6, 14) },
};

function textoDispositivo(pad) {
  const documento = renderizar(pad);
  return documento.secoes.find((s) => s.heading === 'III — DISPOSITIVO').conteudo.join(' ');
}

test('decisão: absolvição', () => {
  const texto = textoDispositivo({ ...PAD_BASE, decisao: { resultado: 'absolvicao' } });
  assert.match(texto, /IMPROCEDÊNCIA do PAD, absolvendo/);
  assert.match(texto, /FULANO DE TAL/);
});

test('decisão: desclassificação para falta leve com incisos', () => {
  const texto = textoDispositivo({
    ...PAD_BASE,
    decisao: { resultado: 'desclassificacao', desclassGrau: 'leve', desclassIncisos: ['art95_i'] },
  });
  assert.match(texto, /natureza LEVE/);
  assert.match(texto, /Art\. 95/);
  assert.match(texto, /especificamente o inciso I/);
});

test('decisão: falta grave lista as sanções marcadas, lettered a\\), b\\)...', () => {
  const texto = textoDispositivo({
    ...PAD_BASE,
    decisao: {
      resultado: 'falta_grave',
      sancoes: { regressaoRegime: true, revogacaoTrabalhoExt: true },
    },
  });
  assert.match(texto, /FALTA GRAVE/);
  assert.match(texto, /a\) regressão do regime/);
  assert.match(texto, /b\) revogação do trabalho externo/);
});

test('decisão: sem resultado selecionado mostra placeholder, não quebra', () => {
  const texto = textoDispositivo({ ...PAD_BASE, decisao: {} });
  assert.match(texto, /SELECIONE O RESULTADO DA DECISÃO/);
});

test('relatório inclui testemunhas quando existem e informa ausência quando não há', () => {
  const comTestemunha = renderizar({
    ...PAD_BASE,
    decisao: {},
    testemunhas: [{ nome: 'CICLANO', qualificacao: 'agente penitenciário', qualidade: 'testemunha', depoimento: 'Vi tudo.' }],
  });
  const relatorioComTestemunha = comTestemunha.secoes.find((s) => s.heading === 'I — RELATÓRIO').conteudo.join(' ');
  assert.match(relatorioComTestemunha, /CICLANO.*testemunha.*Vi tudo\./);

  const semTestemunha = renderizar({ ...PAD_BASE, decisao: {}, testemunhas: [] });
  const relatorioSemTestemunha = semTestemunha.secoes.find((s) => s.heading === 'I — RELATÓRIO').conteudo.join(' ');
  assert.match(relatorioSemTestemunha, /Não foram arroladas testemunhas/);
});
