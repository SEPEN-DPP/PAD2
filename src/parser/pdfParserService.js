/**
 * Leitura bruta de PDF via PDF.js. Reconstrói o texto em linhas (agrupando
 * itens pela posição vertical), preservando a ordem visual do formulário —
 * necessário porque registroInfracaoParser.js localiza campos por rótulo
 * dentro dessas linhas. Sem custo/IA (ver README.md deste diretório).
 */
import * as pdfjsLib from 'https://cdn.jsdelivr.net/npm/pdfjs-dist@4.7.76/build/pdf.min.mjs';

pdfjsLib.GlobalWorkerOptions.workerSrc =
  'https://cdn.jsdelivr.net/npm/pdfjs-dist@4.7.76/build/pdf.worker.min.mjs';

const TOLERANCIA_MESMA_LINHA_PX = 2;

/** Agrupa itens de texto do PDF.js em linhas, na ordem em que aparecem. */
function reconstruirLinhas(items) {
  const linhas = [];
  let linhaAtual = [];
  let yAnterior = null;

  for (const item of items) {
    const y = item.transform[5];
    if (yAnterior !== null && Math.abs(y - yAnterior) > TOLERANCIA_MESMA_LINHA_PX) {
      linhas.push(linhaAtual.join(' '));
      linhaAtual = [];
    }
    linhaAtual.push(item.str);
    yAnterior = y;
  }
  if (linhaAtual.length) linhas.push(linhaAtual.join(' '));

  return linhas.join('\n');
}

/**
 * @param {File} arquivoPdf
 * @returns {Promise<{ paginas: string[], textoCompleto: string }>}
 */
export async function extrairTexto(arquivoPdf) {
  const bytes = await arquivoPdf.arrayBuffer();
  const documento = await pdfjsLib.getDocument({ data: bytes }).promise;

  const paginas = [];
  for (let numeroPagina = 1; numeroPagina <= documento.numPages; numeroPagina += 1) {
    const pagina = await documento.getPage(numeroPagina);
    const conteudo = await pagina.getTextContent();
    paginas.push(reconstruirLinhas(conteudo.items));
  }

  return { paginas, textoCompleto: paginas.join('\n') };
}
