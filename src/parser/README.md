# src/parser

Extração de dados do PDF do Registro de Infração do i-PEN. Duas responsabilidades,
ambas **sem custo** (sem dependência de IA paga — ver [src/ai/README.md](../ai/README.md)):

1. **Leitura bruta** (`pdfParserService.js`): usa PDF.js para extrair o texto do PDF.
2. **Extração de campos** (`registroInfracaoParser.js`): aplica regras determinísticas
   (regex sobre rótulos fixos do formulário) para encontrar, no texto extraído, apenas os
   campos que alimentam o PAD:

   - Nome completo
   - IPEN
   - Data da infração
   - Infração (descrição/tipo)
   - Artigos
   - Detentos envolvidos
   - Agentes (Policiais Penais) envolvidos
   - Observações

Implementação real prevista para a Fase 3 (ver [ROADMAP.md](../../ROADMAP.md)).

## Por que regras e não IA?

O Registro de Infração é um formulário institucional de layout fixo (mesmos rótulos em
todo documento gerado pelo i-PEN) e é **confirmado como PDF gerado digitalmente** (texto
selecionável, não escaneado/fotografado). Isso significa que PDF.js consegue extrair o
texto diretamente e a extração dos 8 campos pode ser feita só com regex sobre os rótulos
fixos do formulário (`"Nome:"`, `"IPEN:"` etc.) — sem OCR e sem custo de API algum.

## Contrato esperado

```js
/**
 * @param {File} arquivoPdf
 * @returns {Promise<{ paginas: string[], textoCompleto: string }>}
 */
export async function extrairTexto(arquivoPdf) { /* ... */ }

/**
 * @param {{ paginas: string[], textoCompleto: string }} textoExtraido
 * @returns {Promise<{
 *   nomeCompleto: string, ipen: string, dataInfracao: string, infracao: string,
 *   artigos: string[], detentosEnvolvidos: string[], agentesEnvolvidos: string[],
 *   observacoes: string
 * }>}
 */
export async function extrairCamposRegistroInfracao(textoExtraido) { /* ... */ }
```

## Estado atual

Apenas as interfaces estão definidas (`pdfParserService.js`, `registroInfracaoParser.js`),
lançando erro de "não implementado". A tela "Novo PAD" (`src/pages/pad/new`) já existe, mas
não chama este módulo ainda.
