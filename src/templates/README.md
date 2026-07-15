# src/templates

Motor de renderização **PAD → Documento**. Gera os 10 documentos institucionais de um PAD
(Portaria de Instauração, Documentação Inicial, Termo de Cientificação, Depoimento(s)
Testemunha(s), Depoimento Incidentado, Manifestação do Conselho Disciplinar, Manifestação
da Defesa, Decisão da Direção, Ofício ao Juiz e Ofício de Encaminhamento à VEP — Fase 2,
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
 *   semCabecalho?: boolean,      // pula cabeçalho/rodapé institucional inteiro — só Manifestação da Defesa
 *   destinatario?: { linhas: string[] },  // bloco fixo no rodapé da página 1 do PDF — só os 2 Ofícios
 *   numeroELinha?: { numero: string, data: string },  // "Nº X" à esquerda / cidade+data à direita, mesma linha
 * }}
 */
export function renderizar(pad, item) { /* ... */ }
```

Nenhum template lida com layout, paginação, cabeçalho/rodapé, jsPDF ou HTML — isso é
responsabilidade de `shared/`. Um template só monta texto e decide as variações
condicionais (ex.: testemunha vs. informante, silêncio vs. declarou).

## Modelo oficial de cabeçalho/rodapé (2026-07-15)

Layout de cabeçalho (logo + 4 linhas), número/data e rodapé seguem `ipsis literis` o modelo
fornecido pelo usuário ("MODELO COM CABEÇALHO.pdf"), com uma exceção: **Manifestação da
Defesa** nunca leva cabeçalho institucional (`semCabecalho: true`) — é uma folha em branco
com só o texto/anexo da defesa, já que pode ser substituída integralmente pela peça que o
defensor enviar. Os dois Ofícios são os únicos documentos com destinatário externo, por isso
só eles usam `destinatario` (bloco desenhado uma única vez, fixo no rodapé da página 1,
independente de quanto texto vier antes).

## Ditado por voz e upload de PDF substituto (2026-07-15)

Os módulos de UI em `src/pages/pad/detail/documentos/_shared.js` oferecem dois recursos
reaproveitados por várias abas:

- `criarBotaoDitado`/`criarCampoComDitado`: botão de microfone (Web Speech API,
  `pt-BR`, só Chrome/Edge) ao lado de qualquer campo de texto livre — usado em Depoimento(s)
  Testemunha(s), Depoimento Incidentado, Manifestação do Conselho, Manifestação da Defesa e
  Decisão. Nunca persiste áudio, só o texto transcrito.
- `criarAnexoSubstituto`/`aplicarAnexoSubstituto`: nas abas Manifestação do Conselho,
  Manifestação da Defesa e Decisão, um upload de PDF pode substituir inteiramente o texto
  gerado (reaproveita `anexoEmbutido.js` — efêmero, nunca persiste no Firestore, mesmo padrão
  da Documentação Inicial). Quando há upload, `obterDocumento()` devolve `secoes: []` e
  `anexos` com as páginas do PDF, preservando título/assinaturas/cabeçalho do template
  original.

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
