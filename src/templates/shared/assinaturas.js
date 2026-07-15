/**
 * Layout puro dos blocos de assinatura (nome/cargo/matrícula) — usado tanto
 * pela pré-visualização em tela (previewRenderer.js) quanto pela exportação
 * em PDF (pdfExporter.js), para não duplicar a regra de "até 2 por linha".
 */

/** Agrupa blocos de assinatura em linhas de até `porLinha` colunas (padrão: 2). */
export function agruparAssinaturas(assinaturas = [], porLinha = 2) {
  const linhas = [];
  for (let i = 0; i < assinaturas.length; i += porLinha) {
    linhas.push(assinaturas.slice(i, i + porLinha));
  }
  return linhas;
}
