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

As colunas Advogado/Defensor Público acima são resquício do desenho anterior à Fase 6 e não
correspondem a nada usado de fato — o **Portal da Defesa** (implementado em 2026-07-19,
atende tanto advogado constituído quanto defensor público) não é uma rota do painel
institucional nem passa por esta matriz: é um contexto de autenticação inteiramente
separado, com conta própria na coleção `defensores` (não em `usuarios`) e shell próprio
(`src/layout/portalDefesaLayout.js`) montado direto por `src/app/app.js`. Ver
[firestore-schema.md](firestore-schema.md) §"Portal da Defesa" para o desenho completo
(vínculo, confirmação de documento, regras do Firestore) e ARCHITECTURE.md §6.

**Confirmar/reabrir um documento do PAD (2026-07-19):** mesmo escopo de `souCriadorDoPad` —
qualquer perfil que já edita o PAD também pode confirmar/reabrir (ver linha abaixo sobre
"Preencher os documentos"). **Revogar o acesso de um defensor a um PAD** já é mais restrito:
mesmo escopo de `souGestorDoPad` (Diretor/CPEN da unidade ou regional, ou Administrador).

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
