# Matriz de permissões (navegação)

Fonte de verdade em código: [`src/config/roles.js`](../src/config/roles.js). Esta tabela é
a versão legível para consulta rápida — se divergir do código, o código vence.

| Rota              | Administrador | Diretor | Subdiretor | Servidor | Conselho Disciplinar | Advogado | Defensor Público |
|-------------------|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| `/dashboard`      | ✔ | ✔ | ✔ | ✔ | ✔ |   |   |
| `/pad`            | ✔ | ✔ | ✔ | ✔ | ✔ |   |   |
| `/pad/novo`       | ✔ | ✔ | ✔ | ✔ |   |   |   |
| `/eventos`        | ✔ | ✔ | ✔ | ✔ | ✔ |   |   |
| `/documentos`     | ✔ | ✔ | ✔ | ✔ | ✔ |   |   |
| `/anexos`         | ✔ | ✔ | ✔ | ✔ | ✔ |   |   |
| `/usuarios`       | ✔ | ✔ |   |   |   |   |   |
| `/relatorios`     | ✔ | ✔ | ✔ |   |   |   |   |
| `/exportacao`     | ✔ | ✔ | ✔ | ✔ | ✔ |   |   |
| `/ia`             | ✔ |   |   |   |   |   |   |
| `/configuracoes`  | ✔ |   |   |   |   |   |   |
| Portal do Advogado | — | — | — | — | — | próprio contexto (Fase 6) | próprio contexto (Fase 6) |

O Portal do Advogado (`/portal-advogado`) usa um contexto de autenticação separado do
painel institucional e não é regido por esta matriz — ver ARCHITECTURE.md §6.

Esta matriz controla apenas **navegação** (o que aparece no menu e é acessível por rota).
Regras de permissão por **ação** (quem pode decidir, quem pode assinar, quem pode enviar
memorial) são definidas fase a fase junto com a regra de negócio correspondente.
