# src/templates

Motor de renderização **PAD → Documento**. Implementação real prevista para a
Fase 4 (ver [ROADMAP.md](../../ROADMAP.md)).

## Princípio

Um documento (Portaria, Termo de Cientificação, Ofício etc.) nunca é editado como texto
solto. Ele é sempre **derivado** do objeto PAD armazenado no Firestore: um template recebe
o objeto PAD (ou uma fatia dele) e retorna uma estrutura pronta para impressão em tela ou
para geração de PDF via jsPDF.

## Contrato esperado de um template

```js
/**
 * @param {object} pad - objeto PAD completo (ver ARCHITECTURE.md §4)
 * @returns {{ titulo: string, secoes: Array<{ heading: string, conteudo: string }> }}
 */
export function renderizar(pad) { /* ... */ }
```

## Estado atual

Apenas um exemplo documentado (`registroInfracaoTemplate.js`) existe nesta fase, para
fixar o contrato acima. Nenhum template é funcional ainda.
