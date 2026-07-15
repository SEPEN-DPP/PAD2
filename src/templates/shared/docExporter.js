/**
 * Exportação "Baixar em .doc" e "Copiar" — reaproveita o mesmo HTML que
 * previewRenderer.js já monta para a tela, sem um segundo caminho de
 * renderização. `.doc` não é um OOXML/binário real: é HTML servido com MIME
 * `application/msword`, que o Word abre nativamente (mesma técnica já usada
 * na V1, zero dependência nova).
 */
import { renderizarPreview } from './previewRenderer.js';

const ESTILO_DOC = `
  body { font-family: 'Segoe UI', Arial, sans-serif; font-size: 11pt; color: #000; }
  .documento-preview { max-width: none; box-shadow: none; padding: 0; }
  .documento-preview__paragrafo { text-align: justify; text-indent: 2.5em; }
  .documento-preview__cabecalho, .documento-preview__titulo,
  .documento-preview__subtitulo, .documento-preview__rodape { text-align: center; }
  .documento-preview__assinaturas-linha { display: table; width: 100%; margin-bottom: 24pt; }
  .documento-preview__assinatura { display: table-cell; text-align: center; width: 50%; }
`;

function nomeArquivoPadrao(titulo, extensao) {
  return `${titulo.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^\w]+/g, '_')}.${extensao}`;
}

function montarHtmlCompleto(preview) {
  return `<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
<head><meta charset="utf-8"><style>${ESTILO_DOC}</style></head>
<body>${preview.outerHTML}</body></html>`;
}

/**
 * @param {object} pad
 * @param {object} documento — retorno de `renderizar(pad, ...)` de um template
 */
export function baixarComoDoc(pad, documento, nomeArquivo) {
  const preview = renderizarPreview(pad, documento);
  const blob = new Blob(['﻿', montarHtmlCompleto(preview)], { type: 'application/msword' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = nomeArquivo ?? nomeArquivoPadrao(documento.titulo, 'doc');
  link.click();
  URL.revokeObjectURL(url);
}

/** Copia o documento (formatado, quando o navegador suportar) para a área de transferência. */
export async function copiarDocumento(pad, documento) {
  const preview = renderizarPreview(pad, documento);
  const texto = preview.innerText;
  try {
    await navigator.clipboard.write([
      new ClipboardItem({
        'text/html': new Blob([preview.outerHTML], { type: 'text/html' }),
        'text/plain': new Blob([texto], { type: 'text/plain' }),
      }),
    ]);
    return true;
  } catch {
    try {
      await navigator.clipboard.writeText(texto);
      return true;
    } catch {
      return false;
    }
  }
}
