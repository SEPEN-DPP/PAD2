# src/ai

Módulo reservado para capacidades que **realmente dependem de IA generativa** —
isolado da interface, conforme exigência do projeto ("nunca misturar IA com interface").

## Restrição orçamentária

O projeto não dispõe de assinatura/orçamento para APIs de IA paga. Por isso, a extração de
dados do Registro de Infração **não é responsabilidade deste módulo** — ela é feita por
regras determinísticas (regex sobre texto extraído por PDF.js) em `src/parser`, sem custo
algum. Ver [src/parser/README.md](../parser/README.md).

Este módulo (`src/ai`) fica reservado apenas para o que genuinamente não dá para resolver
com regras (ex.: sugestão de fundamentação em linguagem natural, revisão textual de peças —
Fase 8 do [ROADMAP.md](../../ROADMAP.md)) — e só será implementado se/quando houver uma
opção viável sem custo (ex.: modelo local) ou orçamento aprovado. Até lá, nenhuma chamada a
provedor de IA existe no projeto.

## Contrato esperado (exemplo — condicional a orçamento futuro)

```js
/**
 * @param {object} _pad
 * @returns {Promise<string>} sugestão de texto para revisão humana (nunca inserida direto no documento)
 */
export async function sugerirFundamentacao(_pad) { /* ... */ }
```

## Estado atual

Apenas a interface está definida em `aiService.js`, lançando erro de "não implementado".
Nenhuma chamada a provedor de IA existe nesta fase — e pode nunca vir a existir, dependendo
de orçamento.
