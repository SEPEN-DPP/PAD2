# tests/

Testes automatizados, executados com o test runner nativo do Node
(`node --test`, ver script `npm test`). Sem framework externo — consistente com a decisão
de manter o projeto livre de dependências de build (ver [ARCHITECTURE.md](../ARCHITECTURE.md)).

Nesta fase existe apenas um teste de exemplo (`utils/dateUtils.test.js`) para fixar a
convenção. Cobertura de `services`, `router` e regras de negócio será adicionada conforme
cada fase do [ROADMAP.md](../ROADMAP.md) for implementada.
