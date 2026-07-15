/**
 * Cabeçalho/rodapé institucional, repetido em toda página impressa dos 10
 * documentos do PAD (ver src/templates/README.md). Dado puro — quem desenha
 * isso na tela é previewRenderer.js, e no PDF é pdfExporter.js.
 */
import { obterUnidadePorNome } from '../../config/unidadesPrisionais.js';

/** @param {object} pad */
export function montarCabecalho(pad) {
  return {
    linhas: [
      'ESTADO DE SANTA CATARINA',
      'SECRETARIA DE ESTADO DE JUSTIÇA E REINTEGRAÇÃO SOCIAL',
      'POLÍCIA PENAL DE SANTA CATARINA',
      (pad.dadosGerais?.unidade ?? '').toUpperCase(),
    ].filter(Boolean),
  };
}

/** @param {object} pad */
export function montarRodape(pad) {
  const unidade = obterUnidadePorNome(pad.dadosGerais?.unidade);
  return {
    linhas: [
      'POLÍCIA PENAL DE SANTA CATARINA',
      (pad.dadosGerais?.unidade ?? '').toUpperCase(),
      unidade?.endereco ?? unidade?.cidade ?? 'Florianópolis',
    ].filter(Boolean),
  };
}
