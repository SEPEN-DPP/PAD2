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
| `/configuracoes`  | ✔ | ✔ | ✔ | ✔ | ✔ |   |   |
| Portal do Advogado | — | — | — | — | — | próprio contexto (Fase 6) | próprio contexto (Fase 6) |

O Portal do Advogado (`/portal-advogado`) usa um contexto de autenticação separado do
painel institucional e não é regido por esta matriz — ver ARCHITECTURE.md §6.

Esta matriz controla apenas **navegação** (o que aparece no menu e é acessível por rota).
Regras de permissão por **ação** (quem pode decidir, quem pode assinar, quem pode enviar
memorial) são definidas fase a fase junto com a regra de negócio correspondente.

`/configuracoes` está aberta a todo o painel institucional porque "Alterar Senha" é
universal. O card "Parâmetros institucionais" (Conselho Disciplinar/Diretor da Unidade,
2026-07-15) só aparece de verdade para DIRETOR/SUBDIRETOR com `vinculo.tipo === 'UNIDADE'`
— os demais perfis veem um estado vazio. Ver `souGestorDeConfigUnidade` em
`firestore.rules`.

**Autocadastro (2026-07-14):** qualquer pessoa pode solicitar acesso em `#/cadastro` (fora
desta matriz, tela pré-login). A solicitação nasce sem perfil (`status: 'PENDENTE'`); ao ser
aprovada pela Direção/CPEN da unidade (ou Administrador), recebe o perfil **Servidor** e só
então passa a valer esta matriz. Ver [firestore-schema.md](firestore-schema.md).

**Gestão de usuários — quem pode aprovar/editar/excluir quem (2026-07-14):** a coluna
`/usuarios` acima só controla quem *acessa a página*; dentro dela, o recorte de **quais
contas** cada um vê e gerencia é dado por `vinculo`, não por `perfil`:

| Gestor                                   | Vê/gerencia solicitações e contas de |
|-------------------------------------------|----------------------------------------|
| Administrador                              | todas as contas, qualquer perfil |
| Diretor/CPEN, `vinculo.tipo = UNIDADE`     | apenas `perfil: SERVIDOR` da própria unidade |
| Diretor/CPEN, `vinculo.tipo = REGIONAL` (SR) | apenas `perfil: SERVIDOR` de todas as unidades da regional |

Um gestor não-Administrador só pode atribuir os perfis em `PERFIS_ATRIBUIVEIS_POR_GESTOR`
(Servidor, Conselho Disciplinar, Subdiretor) e nunca enxerga outro Diretor/CPEN/Regional/
Administrador por essa tela — ver `souGestorDoAlvo`/`perfilPermitidoParaGestor` em
`firestore.rules` (fonte de verdade da autorização) e a seção "Editar/Excluir" em
[firestore-schema.md](firestore-schema.md).

**Criar/excluir PAD (2026-07-14):** dentro de `/pad/novo`, qualquer perfil da unidade
(Administrador, Diretor, Subdiretor, Servidor) pode criar um PAD — mas só Direção/CPEN da
própria unidade/regional, ou Administrador, podem excluí-lo depois (`souCriadorDoPad` e
`souGestorDoPad` em `firestore.rules`). Ver a seção "Exclusão de PAD" em
[firestore-schema.md](firestore-schema.md).

**Preencher os documentos do PAD (2026-07-15):** as 10 abas de documento em
`/pad/:id` (Portaria, Doc. Inicial, Cientificação, Testemunhas, Declarações, Conselho,
Defesa, Decisão, Ofícios) usam o **mesmo escopo de `souCriadorDoPad`** de quem pode criar o
PAD — não há restrição adicional por perfil dentro de um PAD já em andamento nesta fase.
Ver a seção "Gerador de documentos do PAD" em [firestore-schema.md](firestore-schema.md).
