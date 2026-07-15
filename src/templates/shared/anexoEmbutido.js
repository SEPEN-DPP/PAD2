/**
 * Converte um arquivo anexado (PDF ou imagem) em imagem(ns) embutíveis no
 * documento exportado — usado só pela aba "Documentação Inicial" (ver
 * src/pages/pad/detail/documentos/docInicialTab.js). O binário do arquivo
 * NUNCA é gravado no Firestore/Storage (não há Storage disponível nesta
 * fase — ver ROADMAP.md): só o dataURL resultante fica em memória, na
 * sessão do navegador, e se perde ao recarregar a página.
 */
import * as pdfjsLib from 'https://cdn.jsdelivr.net/npm/pdfjs-dist@4.7.76/build/pdf.min.mjs';

pdfjsLib.GlobalWorkerOptions.workerSrc =
  'https://cdn.jsdelivr.net/npm/pdfjs-dist@4.7.76/build/pdf.worker.min.mjs';

function lerImagemComoDataUrl(arquivo) {
  return new Promise((resolve, reject) => {
    const leitor = new FileReader();
    leitor.onload = () => resolve(leitor.result);
    leitor.onerror = () => reject(leitor.error);
    leitor.readAsDataURL(arquivo);
  });
}

async function renderizarPdfComoImagens(arquivo) {
  const bytes = await arquivo.arrayBuffer();
  const documento = await pdfjsLib.getDocument({ data: bytes }).promise;
  const imagens = [];
  for (let numeroPagina = 1; numeroPagina <= documento.numPages; numeroPagina += 1) {
    const pagina = await documento.getPage(numeroPagina);
    const viewport = pagina.getViewport({ scale: 1.5 });
    const canvas = document.createElement('canvas');
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    // eslint-disable-next-line no-await-in-loop
    await pagina.render({ canvasContext: canvas.getContext('2d'), viewport }).promise;
    imagens.push(canvas.toDataURL('image/jpeg', 0.9));
  }
  return imagens;
}

/**
 * @param {File} arquivo
 * @returns {Promise<string[]>} um dataURL por página (1 item quando for imagem)
 */
export async function converterParaImagensEmbutidas(arquivo) {
  if (arquivo.type === 'application/pdf') return renderizarPdfComoImagens(arquivo);
  if (arquivo.type.startsWith('image/')) return [await lerImagemComoDataUrl(arquivo)];
  throw new Error('Formato não suportado — envie um PDF ou uma imagem (JPG/PNG).');
}
