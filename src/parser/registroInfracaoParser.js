/**
 * Extração de campos do Registro de Infração a partir do texto já extraído
 * pelo PDF.js (ver pdfParserService.js). Regras determinísticas (regex sobre
 * os rótulos fixos do formulário do i-PEN) — sem dependência de IA paga (ver
 * README.md deste diretório e src/ai/README.md). Não implementado nesta
 * fase — ver ROADMAP.md (Fase 3).
 */

/**
 * @param {{ paginas: string[], textoCompleto: string }} _textoExtraido
 * @returns {Promise<{
 *   nomeCompleto: string,
 *   ipen: string,
 *   dataInfracao: string,
 *   infracao: string,
 *   artigos: string[],
 *   detentosEnvolvidos: string[],
 *   agentesEnvolvidos: string[],
 *   observacoes: string,
 * }>}
 */
export async function extrairCamposRegistroInfracao(_textoExtraido) {
  throw new Error(
    'extrairCamposRegistroInfracao: implementação prevista para a Fase 3 (ver ROADMAP.md).',
  );
}
