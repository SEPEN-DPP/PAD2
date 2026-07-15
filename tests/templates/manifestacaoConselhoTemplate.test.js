import { test } from 'node:test';
import assert from 'node:assert/strict';
import { renderizar } from '../../src/templates/manifestacaoConselhoTemplate.js';

const PAD_BASE = {
  dadosGerais: { numero: '001/2026', unidade: 'Presídio Regional de Itapema' },
  incidentados: [{ nomeCompleto: 'FULANO DE TAL', ipen: '750126' }],
  infracao: { data: '25/05/2026', artigoLep: { codigo: 'art50_vii', rotulo: 'Art. 50, VII — LEP' } },
};

function textoManifestacao(pad) {
  return renderizar(pad).secoes.find((s) => Array.isArray(s.conteudo)).conteudo.join(' ');
}

test('conclusão procedência', () => {
  const texto = textoManifestacao({ ...PAD_BASE, conselho: { conclusao: 'procedencia' } });
  assert.match(texto, /PROCEDÊNCIA do presente PAD/);
});

test('conclusão improcedência', () => {
  const texto = textoManifestacao({ ...PAD_BASE, conselho: { conclusao: 'improcedencia' } });
  assert.match(texto, /IMPROCEDÊNCIA do presente PAD/);
});

test('conclusão desclassificação para falta média com dois incisos', () => {
  const texto = textoManifestacao({
    ...PAD_BASE,
    conselho: { conclusao: 'desclassificacao', desclassGrau: 'media', desclassIncisos: ['art96_ii', 'art96_iii'] },
  });
  assert.match(texto, /DESCLASSIFICAÇÃO da falta/);
  assert.match(texto, /natureza MÉDIA/);
  assert.match(texto, /Art\. 96/);
  assert.match(texto, /incisos II e III/);
});

test('sem conclusão selecionada mostra placeholder', () => {
  const texto = textoManifestacao({ ...PAD_BASE, conselho: {} });
  assert.match(texto, /SELECIONE A CONCLUSÃO DO CONSELHO/);
});

test('inclui a versão do incidentado quando ele declarou (não ficou em silêncio)', () => {
  const texto = textoManifestacao({
    ...PAD_BASE,
    conselho: { conclusao: 'procedencia' },
    declaracoesApenado: { silencio: false, versaoIncidentado: 'Não fiz nada.' },
  });
  assert.match(texto, /Não fiz nada\./);
});

test('não inclui versão do incidentado quando ele permaneceu em silêncio', () => {
  const texto = textoManifestacao({
    ...PAD_BASE,
    conselho: { conclusao: 'procedencia' },
    declaracoesApenado: { silencio: true },
  });
  assert.doesNotMatch(texto, /apresentou a seguinte versão/);
});
