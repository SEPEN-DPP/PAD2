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

## Mapeamento de campos (confirmado contra modelo real, 2026-07-14)

O usuário forneceu um modelo real de "Registro de Infração/Punição" gerado pelo i-PEN
(formulário de página única, layout tabular fixo). Rótulos exatos encontrados no
documento, na ordem em que aparecem:

| Campo do PAD          | Rótulo no PDF                | Exemplo no modelo |
|------------------------|-------------------------------|--------------------|
| `nomeCompleto`         | `Nome:`                       | `CRISTIAN NELSON CONCEIÇÃO SOUZA` |
| `ipen`                 | `Prontuário:` (só a parte numérica) | `750126` |
| `dataInfracao`         | `DATA:` (dentro do bloco "DADOS INFRAÇÃO") | `25/05/2026` → normalizado para ISO `2026-05-25` |
| `infracao`             | `UNIDADE / INFRAÇÃO:`         | `152 TIVER EM SUA POSSE, UTILIZAR OU FORNECER APARELHO TELEFÔNICO...` |
| `artigos`              | `Artigo(s):`                  | `33, 33` → `["33", "33"]` |
| `detentosEnvolvidos`   | `DETENTOS ENVOLVIDOS:`        | (pode vir vazio) → `[]` |
| `agentesEnvolvidos`    | `AGENTES ENVOLVIDOS:`         | `MARCELO FAUTH PIANA, RAFAÉL COELHO, DANIEL LIMA` → array de 3 nomes |
| `observacoes`          | `OBSERVAÇÃO:`                 | `NÃO INFORMADA` → normalizado para `null` (convenção do i-PEN para campo vazio) |

**Resolvido com o usuário (2026-07-14) — "IPEN" = `Prontuário:`, não `RG i-PEN:`.** O
formulário tem duas numerações diferentes: `Prontuário:` (ex. `750126`) e `RG i-PEN:` (ex.
`12181418918 SC`, que é o registro de identificação civil). O texto da `DESCRIÇÃO:` chama o
número do Prontuário de "MATRÍCULA IPEN" — é esse (`Prontuário:`) que vira o campo `ipen`
do PAD. `RG i-PEN:` não é extraído.

Quando os campos extraídos são incorporados ao objeto PAD (ver
[docs/firestore-schema.md](../../docs/firestore-schema.md)), `infracao` vira
`pad.infracao.tipificacao` (nome escolhido para não colidir com o campo `DESCRIÇÃO:` do
formulário, que é o relato narrativo do incidente e **não faz parte do escopo de
extração atual** — só o texto curto de enquadramento em `UNIDADE / INFRAÇÃO:`).

Campos que existem no formulário mas **não fazem parte do escopo de extração** (por
decisão do usuário, 2026-07-14): RG i-PEN, Situação penal, Cartão SUS, Unidade prisional,
Naturalidade, Mãe, Nascimento, Processo(s), Ingresso, Regime, Comportamento, Residência
(Ala/Galeria/Bloco/Piso/Cela), GRAU, SITUAÇÃO, DESCRIÇÃO (relato narrativo), Volume da
pasta/Folha início/Folha fim.

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
