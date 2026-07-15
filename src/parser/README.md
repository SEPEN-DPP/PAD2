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
   - Artigo da LEP correspondente à falta
   - Detentos envolvidos
   - Agentes (Policiais Penais) envolvidos
   - Observações

Implementado na Fase 3 (ver [ROADMAP.md](../../ROADMAP.md)).

## Mapeamento de campos (confirmado contra modelo real, 2026-07-14)

O usuário forneceu um modelo real de "Registro de Infração/Punição" gerado pelo i-PEN
(formulário de página única, layout tabular fixo). Rótulos exatos encontrados no
documento, na ordem em que aparecem:

| Campo do PAD          | Rótulo no PDF                | Exemplo no modelo |
|------------------------|-------------------------------|--------------------|
| `nomeCompleto`         | `Nome:`                       | `CRISTIAN NELSON CONCEIÇÃO SOUZA` |
| `ipen`                 | `Prontuário:` (só a parte numérica) | `750126` |
| `dataInfracao`         | `DATA:` (dentro do bloco "DADOS INFRAÇÃO") | `25/05/2026` — **mantido em dd/mm/aaaa, nunca convertido para ISO** |
| `infracao`             | `UNIDADE / INFRAÇÃO:`         | `TIVER EM SUA POSSE, UTILIZAR OU FORNECER APARELHO TELEFÔNICO...` (o "152" à frente no PDF é um número de controle interno do i-PEN referente à unidade, não parte do texto — removido por `removerCodigoInterno`) |
| `artigoLep`            | *(derivado de `infracao`, não de um rótulo)* | `{ codigo: 'art50_vii', rotulo: 'Art. 50, VII — LEP' }` |
| `detentosEnvolvidos`   | `DETENTOS ENVOLVIDOS:`        | (pode vir vazio) → `[]` |
| `agentesEnvolvidos`    | `AGENTES ENVOLVIDOS:`         | `MARCELO FAUTH PIANA, RAFAÉL COELHO, DANIEL LIMA` → array de 3 nomes |
| `observacoes`          | `OBSERVAÇÃO:`                 | `NÃO INFORMADA` → normalizado para `null` (convenção do i-PEN para campo vazio) |

**Resolvido com o usuário (2026-07-14) — "IPEN" = `Prontuário:`, não `RG i-PEN:`.** O
formulário tem duas numerações diferentes: `Prontuário:` (ex. `750126`) e `RG i-PEN:` (ex.
`12181418918 SC`, que é o registro de identificação civil). O texto da `DESCRIÇÃO:` chama o
número do Prontuário de "MATRÍCULA IPEN" — é esse (`Prontuário:`) que vira o campo `ipen`
do PAD. `RG i-PEN:` não é extraído.

**Data sempre em dd/mm/aaaa (2026-07-14).** `dataInfracao` nunca é convertido para
`yyyy-mm-dd`: uma string ISO só de data, passada por `new Date(string)`, é interpretada
como meia-noite UTC e mostra o dia **anterior** em fusos negativos (Brasil, UTC-3) — ver o
mesmo cuidado em [src/utils/dateUtils.js](../utils/dateUtils.js). O formato do próprio
documento (dd/mm/aaaa) é o formato final, sem conversão.

**`artigoLep` não vem de um rótulo do formulário — é identificado a partir de `infracao`
(2026-07-14).** O campo `Artigo(s):` do cabeçalho do formulário é sobre o(s) **processo(s)
criminal(is)** do incidentado (ex.: artigo da Lei de Drogas), **não** sobre a falta
disciplinar — não tem relação com o PAD e não é extraído. As faltas graves estão previstas
nos incisos do art. 50 da LEP e no art. 52 caput (RDD) — ver
[src/config/baseLegal.js](../config/baseLegal.js). Como o texto cadastrado no i-PEN para
cada tipo de infração já segue de perto a redação da própria LEP, `identificarArtigoLep`
apenas verifica se o texto de um artigo do catálogo está contido no texto de `infracao`
(após normalizar acentuação/caixa) — não é um palpite por palavra-chave. Quando não há
correspondência clara, retorna `null` e a tela de revisão exige seleção manual entre os
artigos do catálogo (nunca aplica uma classificação sem confirmação humana).

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
 *   artigoLep: { codigo: string, rotulo: string } | null,
 *   detentosEnvolvidos: string[], agentesEnvolvidos: string[],
 *   observacoes: string | null,
 * }>}
 */
export async function extrairCamposRegistroInfracao(textoExtraido) { /* ... */ }
```

## Estado atual

Implementado e testado (`tests/parser/registroInfracaoParser.test.js`) contra um modelo
real do formulário. A tela "Novo PAD" (`src/pages/pad/new`) já chama este módulo: o botão
"Analisar Registro" extrai os campos e mostra um formulário de revisão editável (incluindo
o select do artigo da LEP, pré-selecionado quando há correspondência) antes de qualquer
gravação — a gravação em si é Fase 2.
