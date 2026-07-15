# src/templates

Motor de renderização **PAD → Documento**. Gera os 10 documentos institucionais de um PAD
(Portaria de Instauração, Documentação Inicial, Termo de Cientificação, Oitiva de
Testemunhas, Declarações do Apenado, Manifestação do Conselho Disciplinar, Manifestação da
Defesa, Decisão da Direção, Ofício ao Juiz e Ofício de Encaminhamento à VEP — Fase 2,
2026-07-14). Conteúdo/redação portados do PAD V1 (github.com/SEPEN-DPP/PAD), nunca o
código — ver docs/reuso-pad-v1.md.

## Princípio

Um documento nunca é editado como texto solto. Ele é sempre **derivado** do objeto PAD
armazenado no Firestore: um template recebe o PAD (e, quando aplicável, um item de um
array — ex. uma testemunha) e devolve uma estrutura de dados pronta tanto para a
pré-visualização em tela quanto para a geração de PDF/.doc.

## Contrato de um template

```js
/**
 * @param {object} pad - objeto PAD completo (ver docs/firestore-schema.md)
 * @param {object} [item] - só para templates de array (ex. oitivaTestemunhaTemplate)
 * @returns {{
 *   titulo: string,
 *   subtitulo?: string,
 *   secoes: Array<{ heading?: string, conteudo: string|string[] }>,  // string[] = lista de parágrafos condicionais
 *   assinaturas?: Array<{ nome: string, cargo?: string, matricula?: string }>,
 *   anexos?: Array<{ dataUrl: string, legenda?: string }>,           // efêmero, nunca persistido
 * }}
 */
export function renderizar(pad, item) { /* ... */ }
```

Nenhum template lida com layout, paginação, cabeçalho/rodapé, jsPDF ou HTML — isso é
responsabilidade de `shared/`. Um template só monta texto e decide as variações
condicionais (ex.: testemunha vs. informante, silêncio vs. declarou).

## `shared/`

| Arquivo | Responsabilidade |
|---|---|
| `letterhead.js` | Dados do cabeçalho/rodapé institucional (repetido em toda página) |
| `condicionais.js` | Helpers de texto reaproveitados por vários templates (`nomeIpenIncidentado`, `textoDefensor`, `listaSancoes` etc.) |
| `assinaturas.js` | Agrupa blocos de assinatura em linhas (regra: até 2 por linha) |
| `previewRenderer.js` | `{titulo,secoes,...}` → HTML para a pré-visualização em tela |
| `pdfExporter.js` | Único arquivo que importa jsPDF (CDN) — paginação real com cabeçalho/rodapé repetidos |
| `docExporter.js` | "Baixar em .doc" (HTML servido como `application/msword`) e "Copiar" |
| `anexoEmbutido.js` | PDF/imagem anexado → dataURL(s) via PDF.js/canvas — nunca persiste o binário |

## Estado atual (2026-07-14)

Os 10 templates de documento vivem diretamente em `src/templates/*Template.js`, um por
tipo de documento. A UI de cada um (formulário + preview + exportação) fica em
`src/pages/pad/detail/documentos/`.
