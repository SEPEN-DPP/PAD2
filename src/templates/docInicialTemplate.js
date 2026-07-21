/**
 * Documentação Inicial — não é um texto jurídico, é a relação dos
 * documentos/provas juntados logo após a Portaria (ver
 * src/pages/pad/detail/documentos/docInicialTab.js). Os anexos (PDF/imagem)
 * ficam persistidos no PAD junto com o item (2026-07-20, ver
 * `converterParaAnexoPersistido` em _shared.js) e são embutidos como imagem
 * no PDF/.doc exportado.
 */
import { placeholder } from './shared/condicionais.js';

export function renderizar(pad) {
  const itens = pad.docInicial?.itens ?? [];
  const numero = pad.dadosGerais?.numero || placeholder('Nº DO PAD');

  return {
    titulo: 'DOCUMENTAÇÃO INICIAL — JUNTADA DE PROVAS',
    subtitulo: `PAD Nº ${numero}`,
    secoes: itens.length
      ? [{ heading: 'Documentos juntados', conteudo: itens.map((item) => `• ${item.titulo}`) }]
      : [{ conteudo: 'Nenhum documento inicial juntado até o momento.' }],
    anexos: itens
      .filter((item) => item.anexo?.dataUrls?.length)
      .flatMap((item) => item.anexo.dataUrls.map((dataUrl, indice) => ({
        dataUrl,
        legenda: item.anexo.dataUrls.length > 1 ? `${item.titulo} (página ${indice + 1})` : item.titulo,
      }))),
  };
}
