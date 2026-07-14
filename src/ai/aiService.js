/**
 * Interface do módulo de IA — reservado para o que genuinamente depende de
 * geração de linguagem natural (não há orçamento para API de IA paga; ver
 * README.md deste diretório). A extração de campos do Registro de Infração
 * NÃO vive aqui — é feita por regras determinísticas em src/parser.
 *
 * Nada aqui está implementado, e pode nunca vir a ser, dependendo de
 * orçamento futuro (ver ROADMAP.md, Fase 8).
 */

/**
 * @param {object} _pad
 * @returns {Promise<string>} sugestão de texto para revisão humana (nunca inserida direto no documento)
 */
export async function sugerirFundamentacao(_pad) {
  throw new Error(
    'sugerirFundamentacao: depende de orçamento/ferramenta de IA ainda não definida (ver ROADMAP.md, Fase 8).',
  );
}
