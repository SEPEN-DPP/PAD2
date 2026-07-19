# Schema do Firestore

Coleções top-level (sem subcoleções nesta fase — vínculo por `padId`/`eventoId` como chave
estrangeira). Ver [ARCHITECTURE.md](../ARCHITECTURE.md) §4 para o racional.

## `pads`

```
{
  dadosGerais: { numero, unidade, dataAbertura },
  superintendencia, // SR da unidade (ex.: "SR04") — denormalizado, mesma razão que em `usuarios`
  incidentados: [{ id, nomeCompleto, ipen }], // normalmente 1, mas pode ter mais de um (mesma infração, vários envolvidos) — ver §"Múltiplos incidentados" abaixo
  infracao: { data, tipificacao, artigoLep: { codigo, rotulo } | null, detentosEnvolvidos: [], agentesEnvolvidos: [], observacoes, descricaoFatos },
  portaria: { dataAssinatura, autoridadeSignataria: { nome, cargo } },
  docInicial: { itens: [{ titulo }] }, // sem anexo — ver "Documentação Inicial" abaixo
  termoCientificacao: { observacoes },
  testemunhas: [{ id, nome, qualificacao, qualidade: 'testemunha'|'informante', depoimento }],
  declaracoesApenado: [{ incidentadoId, silencio: boolean, versaoIncidentado }], // um item por incidentado, casado por incidentadoId
  conselho: {
    integrantes: { presidente, membro1, membro2 }, // cada { nome, matricula } — designados na Portaria
    conclusao: 'procedencia'|'improcedencia'|'desclassificacao', fundamento,
    desclassGrau: 'leve'|'media', desclassIncisos: [],
    anexoPersistido: { dataUrls: [], nomeArquivo } | null, // PDF que substitui o texto gerado — ver §"Portal da Defesa"
  },
  defesa: { tipo: 'advogado'|'defensoria'|null, advogadoNome, advogadoOab, emailDefensor, texto, anexoPersistido }, // tipo/advogado*/emailDefensor vêm do Termo de Cientificação
  defesaVinculo: { uid, email, ativo } | null, // vínculo do defensor a ESTE pad — ver §"Portal da Defesa"
  decisao: {
    resultado: 'absolvicao'|'desclassificacao'|'falta_grave', fundamentacao,
    desclassGrau: 'leve'|'media', desclassIncisos: [],
    sancoes: { regressaoRegime, interrupcaoProgressao, perdaRemicao: { ativo, valor, modalidade: 'dias'|'fracao' }, revogacaoSaidaTemp, revogacaoTrabalhoExt },
    anexoPersistido: { dataUrls: [], nomeArquivo } | null,
  },
  oficioJuizo: { numero, data },
  oficioVep: { numero, data },
  confirmacoes: { // uma chave por documento gerado — ver §"Portal da Defesa"
    portaria, docInicial, termoCientificacao, testemunhas, declaracoesApenado,
    conselho, defesa, decisao, oficioJuizo, oficioVep: {
      confirmado: boolean, confirmadoEm, confirmadoPor,
    },
  },
  status: 'EM_ANDAMENTO' | 'AGUARDANDO_DEFESA' | 'AGUARDANDO_DECISAO' | 'CONCLUIDO' | 'ARQUIVADO',
  criadoEm, atualizadoEm
}
```

`status` é sempre top-level (não dentro de `dadosGerais`, apesar do nome sugerir "dados
gerais" — é assim que todo o código em `src/services/pads` e `src/pages/pad` já lê/filtra).
`incidentados[].ipen` vem do campo `Prontuário:` do Registro de Infração do i-PEN — no
próprio documento, o texto da descrição chama esse número de "MATRÍCULA IPEN" (confirmado
com o usuário; **não confundir com o campo `RG i-PEN:` do formulário, que é outro
número**). `infracao.tipificacao` vem do campo `UNIDADE / INFRAÇÃO:` do formulário (o texto
curto de enquadramento, não o campo `DESCRIÇÃO:` — o relato narrativo do incidente não faz
parte do escopo de extração atual). Ver
[src/parser/README.md](../src/parser/README.md) para o mapeamento completo de rótulos.

### Múltiplos incidentados (2026-07-15)

Um PAD normalmente tem 1 incidentado, mas pode ter mais de um (mesma infração, vários
envolvidos). A aba "Incidentados" (`src/pages/pad/detail/documentos/incidentadosTab.js`)
gerencia `incidentados[]` com o mesmo padrão lista+modal de `testemunhas[]`, com o cuidado
de nunca deixar o array vazio (mínimo 1). A aba "Depoimento Incidentado"
(`depoimentoIncidentadoTab.js`, antiga "Declarações") é array-based: uma linha e um Termo de
Declarações por incidentado, casado por `incidentadoId`. Templates que mencionam o(s)
incidentado(s) do PAD como um todo (Portaria, Termo de Cientificação, Manifestação do
Conselho, Decisão, Ofícios) continuam tratando o caso como um bloco só — juntam os nomes com
"e" (`condicionais.js: nomeIpenIncidentado`) — só "Depoimento Incidentado" e "Depoimento(s)
Testemunha(s)" são de fato array-based nesta rodada. `manifestacaoConselhoTemplate.js` e
`decisaoTemplate.js` leem apenas `declaracoesApenado[0]` (simplificação documentada: com mais
de um incidentado, essas duas peças refletem só a declaração do primeiro).

### Criação (Fase 2, 2026-07-14)

`src/pages/pad/new/padNewPage.js` grava o PAD só depois da revisão humana dos dados
extraídos (ver Fase 3) e digitação manual do **número** (não há numeração automática — quem
cadastra o PAD escolhe o número). Nasce sempre `status: 'EM_ANDAMENTO'`. A unidade é fixa
(não editável) para quem tem `vinculo.tipo === 'UNIDADE'` — sempre a própria unidade — e
selecionável (filtrada à regional, ou ao Estado inteiro para Administrador) nos demais
casos. Ver `souCriadorDoPad` em `firestore.rules`: só cria PAD dentro do próprio escopo
(mesma lógica de `escopoPad.js`, aplicada aqui à escrita), e a regra rejeita qualquer
`status` diferente de `EM_ANDAMENTO` na criação. Transições entre as demais etapas do fluxo
(Portaria, Cientificação, Oitiva...) ainda não têm regra de escrita — ver ROADMAP.md.

## `eventos`

```
{
  padId,
  tipo: 'REGISTRO_INFRACAO' | 'PORTARIA_ABERTURA' | 'TERMO_CIENTIFICACAO' | 'OITIVA_INCIDENTADO'
      | 'MANIFESTACAO_CONSELHO' | 'MANIFESTACAO_DEFESA' | 'DECISAO_FINAL' | 'OFICIO_JUIZO' | 'ARQUIVAMENTO',
  responsavel, // nome de quem registrou (texto simples, não referência a `usuarios`)
  data,
  status,
  observacoes,
  criadoEm, atualizadoEm
}
```

Ao criar um PAD, o primeiro evento (`tipo: 'REGISTRO_INFRACAO'`, `status: 'CONCLUIDO'`) é
lançado automaticamente com os mesmos dados revisados na tela "Novo PAD" — a linha do
tempo nunca começa vazia. A regra de criação (`firestore.rules`) reaplica `souCriadorDoPad`
sobre o PAD referenciado por `padId` (via `get()`), não sobre o evento em si.

### Exclusão de PAD (Fase 2, 2026-07-14)

Qualquer usuário da unidade (Administrador, Diretor, Subdiretor ou Servidor) pode **criar**
um PAD, mas só **Direção/CPEN da própria unidade ou regional** (perfil `DIRETOR` — os dois
usam o mesmo perfil) ou Administrador podem **excluir** um da relação (`souGestorDoPad` em
`firestore.rules`) — nunca um Servidor, mesmo o autor do PAD. Ver
[padListPage.js](../src/pages/pad/list/padListPage.js) (botão "Excluir" por linha, com
confirmação). A exclusão remove só o documento em `pads`; os `eventos` associados (ex.: o
"Registro de Infração" lançado na criação) não são apagados em cascata — ficam órfãos,
referenciando um `padId` que não resolve mais. Aceitável nesta fase; revisitar se a
listagem geral de Eventos passar a incomodar com registros órfãos.

### Gerador de documentos do PAD (Fase 2, 2026-07-15)

10 documentos institucionais por PAD — Portaria de Instauração, Documentação Inicial,
Termo de Cientificação, Depoimento(s) Testemunha(s), Depoimento Incidentado (antigo
"Declarações do Apenado"), Manifestação do Conselho Disciplinar, Manifestação da Defesa,
Decisão da Direção, Ofício ao Juiz e Ofício de Encaminhamento à VEP —, cada um **derivado**
dos campos acima por um template em
`src/templates/*Template.js` (nunca editado como texto solto). Conteúdo/redação portados
do PAD V1 (`github.com/SEPEN-DPP/PAD`), nunca o código — ver
[src/templates/README.md](../src/templates/README.md) para o contrato de template e a
organização de `src/templates/shared/` (cabeçalho/rodapé, exportação PDF via jsPDF,
exportação .doc, anexo embutido). UI de cada documento em
[src/pages/pad/detail/documentos/](../src/pages/pad/detail/documentos).

**Convenção de escrita**: cada aba sempre grava o objeto aninhado **inteiro** da sua seção
(nunca um sub-campo em notação de ponto) — importante porque `portaria` e `conselho`
dividem responsabilidade: a aba "Portaria" grava `portaria.*` **e** `conselho.integrantes`
juntos (é ali que o Conselho é designado), sempre preservando `conselho.conclusao`/
`fundamento` se já tiverem sido preenchidos pela aba "Conselho" depois.

**Documentação Inicial não tem upload real** — `docInicial.itens[].titulo` é o único campo
persistido. Um anexo (PDF/imagem) opcional é convertido em imagem via
`src/templates/shared/anexoEmbutido.js` (PDF.js + `<canvas>`) e fica **só na memória do
navegador durante a sessão**, usado para embutir a imagem no PDF/.doc exportado — nunca é
gravado no Firestore nem enviado a um servidor (não há Firebase Storage disponível nesta
fase — Spark/Blaze, ver ROADMAP.md). Ao recarregar a página, o anexo se perde (o título
permanece).

**`termoCientificacao` só grava observações** — o tipo de defesa (advogado/defensoria) é
gravado direto em `defesa.tipo`/`advogadoNome`/`advogadoOab` pela mesma aba, já que é ali
que o incidentado formalmente indica sua defesa; as abas "Depoimento Incidentado",
"Manifestação da Defesa" e "Decisão" só leem esse mesmo campo (ver
`src/templates/shared/condicionais.js:textoDefensor`).

Ligação com a linha do tempo: ao salvar pela primeira vez uma seção que corresponde a uma
etapa de `ETAPAS_PAD`, a aba lança automaticamente o evento correspondente (mesmo padrão do
"Registro de Infração" na criação do PAD) — `docInicial` e `oficioVep` não têm etapa
correspondente e não geram evento.

**Regra de escrita** (`firestore.rules`): `allow update` em `pads` agora aceita qualquer
gravação dentro do escopo de `souCriadorDoPad` (mesmo escopo de quem pode criar o PAD),
desde que a unidade/regional do PAD não mude (`identidadeInalterada`) e `status` continue
um valor válido do enum. Não há ainda validação formal de transição entre etapas (fica para
uma fase futura, ver ROADMAP.md) — qualquer aba pode ser preenchida fora de ordem.

## `configuracoesUnidade`

```
configuracoesUnidade/{nomeDaUnidade}
{
  unidade, superintendencia, // denormalizado, mesma razão de sempre
  diretor: { nome, cargo },
  conselho: { presidente: {nome,matricula}, membro1: {...}, membro2: {...} },
  atualizadoEm, atualizadoPor,
}
```

Conselho Disciplinar e Diretor(a) da Unidade, preenchidos **uma vez por unidade** (não a
cada PAD) em Configurações (`src/pages/configuracoes/configuracoesPage.js`, visível só para
DIRETOR/SUBDIRETOR com `vinculo.tipo === 'UNIDADE'`) e reaproveitados como valor inicial
(cópia, não referência viva) na aba "Portaria" de todo PAD novo daquela unidade — ver
`src/services/configuracoesUnidade/configuracaoUnidadeService.js`. Regra de escrita
(`souGestorDeConfigUnidade` em `firestore.rules`): DIRETOR ou SUBDIRETOR da própria
unidade/regional, ou Administrador.

## `documentos`

```
{ padId, eventoId, tipo, titulo, conteudoRenderizado, versao, criadoEm }
```

## `anexos`

```
{ padId, eventoId, tipo, nomeArquivo, caminhoStorage, tamanho, autorId, criadoEm }
```
Binário no Firebase Storage (`src/storage/attachmentStorage.js`); aqui só o metadado.

## `usuarios`

```
{
  nome, email, perfil, unidade, ativo, criadoEm,
  vinculo: { tipo, valor },
  status: 'PENDENTE' | 'ATIVO',
  superintendencia, // código da SR da unidade (ex.: "SR04") — sempre presente, PENDENTE ou ATIVO
  // presentes só durante o status PENDENTE (autocadastro, ver abaixo):
  cpf, dataNascimento, unidadeSolicitada,
}
```
Documento com o mesmo `id` do UID do Firebase Authentication.

`superintendencia` é gravado tanto no autocadastro (`unidadeSolicitada` → SR) quanto na
aprovação (`unidade` → SR), derivado de `src/config/unidadesPrisionais.js` (única fonte de
verdade unidade↔regional). Existe só para que as **regras do Firestore** — que não podem
executar essa lookup de 55 unidades em JS — consigam checar o escopo REGIONAL comparando um
campo simples, em vez de embutir o mapa inteiro no texto das regras.

`vinculo` controla o **recorte de dados** (não confundir com `perfil`, que controla quais
*páginas* o usuário acessa — ver `src/config/roles.js`). Determina o que aparece no
Dashboard e nas listagens de PAD (2026-07-14):

- `{ tipo: 'UNIDADE', valor: '<nome da unidade prisional>' }` — vê só os PADs daquela
  unidade (contas `{codigo}dir@` e `{codigo}cpen@` de cada unidade).
- `{ tipo: 'REGIONAL', valor: '<código da SR, ex.: "SR04">' }` — vê os PADs de todas as
  unidades vinculadas àquela Superintendência Regional (contas `srXX@pp.sc.gov.br`).
- Sem `vinculo` (ou perfil `ADMINISTRADOR`) — sem filtro, vê todos os PADs do Estado.

Ver [src/services/pads/padService.js](../src/services/pads/padService.js) para o filtro
aplicado nas consultas.

### Autocadastro e aprovação (Fase 1, 2026-07-14)

Qualquer pessoa pode se cadastrar em `#/cadastro` (fora do painel autenticado — ver
[src/pages/auth/registro](../src/pages/auth/registro)). O documento nasce com
`status: 'PENDENTE'`, **sem `perfil`** (as regras do Firestore rejeitam a escrita se
`perfil` vier definido nessa etapa), e com `cpf` (checksum validado, ver
`src/utils/validationUtils.js`), `dataNascimento` (sempre `dd/mm/aaaa`) e
`unidadeSolicitada`. A Direção/CPEN da unidade solicitada (ou Administrador) veem essas
solicitações em **Usuários → Solicitações pendentes** e:

- **Aprovam** → grava `perfil: 'SERVIDOR'`, `status: 'ATIVO'`,
  `vinculo: { tipo: 'UNIDADE', valor: unidadeSolicitada }`.
- **Recusam/excluem** → remove o documento. A conta de autenticação em si **não** é
  excluída (exigiria Admin SDK/Cloud Functions, que não temos sem o plano Blaze) — a
  pessoa pode enviar uma nova solicitação depois via "Completar cadastro"
  (`criarFormularioCompletarCadastro`), sem precisar criar outra conta.

Enquanto `status === 'PENDENTE'` (ou sem documento nenhum), o app mostra uma tela de
espera/recadastro em vez do painel — ver `src/app/app.js`.

### Gestão de usuários ativos: Editar/Excluir (Fase 1, 2026-07-14)

Além de aprovar solicitações, a página **Usuários** lista as contas já `ATIVO` dentro do
escopo de quem está logado (`calcularEscopoDeGestao`, em
[usuarioService.js](../src/services/usuarios/usuarioService.js)) e oferece **Editar**
(nome e perfil) e **Excluir** por linha:

- **Administrador**: vê e gerencia todas as contas, qualquer perfil.
- **Direção/CPEN de uma unidade** (`vinculo.tipo === 'UNIDADE'`): só os `perfil: 'SERVIDOR'`
  daquela unidade.
- **Superintendência Regional** (`vinculo.tipo === 'REGIONAL'`): os `perfil: 'SERVIDOR'` de
  todas as unidades da sua SR (via `superintendencia`).

Um gestor (não-Administrador) só pode atribuir os perfis em
`PERFIS_ATRIBUIVEIS_POR_GESTOR` (`SERVIDOR`, `CONSELHO_DISCIPLINAR`, `SUBDIRETOR`) — nunca
promove ninguém a `DIRETOR`/`ADMINISTRADOR` por essa tela, e nunca enxerga/edita/exclui
outro Diretor, CPEN, Regional ou Administrador (ver `souGestorDoAlvo` e
`perfilPermitidoParaGestor` em `firestore.rules`, únicas fontes de verdade da autorização —
a UI só reflete o que as regras já impõem). "Excluir" remove o documento em `usuarios`; a
conta de autenticação permanece (mesma limitação de Admin SDK/Blaze citada acima).

## `defensores` — Portal da Defesa (Fase 6, 2026-07-19)

```
defensores/{uid}   // uid = Firebase Auth do defensor
{
  nome, oab, tipo: 'advogado' | 'defensoria',
  email,
  padsVinculados: [padId, ...],  // um defensor pode acompanhar mais de um PAD
  ativo: true,                   // false = conta inteira revogada (kill-switch, só Administrador)
  criadoPor, criadoEm, atualizadoEm,
}
```

Contexto de autenticação **totalmente separado** do painel institucional — implementado sem
Cloud Functions e sem o plano Blaze, reaproveitando só recursos gratuitos do Firebase já
usados em outras partes do app (ver `src/services/defensores/defensorService.js`):

- **Vínculo**: nasce no Termo de Cientificação (campo "E-mail do defensor" + botão "Criar
  acesso ao Portal da Defesa"). Se o e-mail já existe em `defensores`, só adiciona o `padId`
  a `padsVinculados`; senão cria a conta. `pads/{padId}.defesaVinculo = { uid, email, ativo }`
  denormaliza o estado do vínculo direto no PAD.
- **Criação da conta sem derrubar a sessão institucional**: `createUserWithEmailAndPassword`
  do SDK client troca a sessão ativa para a conta recém-criada — por isso a chamada acontece
  num app Firebase **secundário e descartável** (`initializeApp(firebaseConfig, nome-único)`),
  nunca no `auth` principal.
- **Convite (2026-07-19, ação explícita da Unidade)**: `vincularDefensorAoPad` **nunca**
  dispara e-mail — o defensor fica vinculado mas sem saber e sem acesso até a Unidade clicar
  em "Notificar advogado — e-mail" (`notificarDefensorPorEmail`, dispara
  `sendPasswordResetEmail`, nativo do Firebase Auth, gratuito). Um botão manual
  (`mailto:`/Gmail) fica disponível como reforço, para quando esse e-mail não chega.
- **Confirmação de documento** (`pads/{padId}.confirmacoes`, ver acima): só documentos
  confirmados pela Unidade aparecem no Portal — granularidade por documento inteiro, não por
  item (mesmo em abas array-based como Testemunhas/Depoimento Incidentado). Qualquer novo
  "Salvar" reabre automaticamente (`confirmado: false`) até confirmar de novo. Confirmar
  dispara um evento na linha do tempo (`<CHAVE>_CONFIRMADO`).
- **Manifestação da Defesa pelo próprio Portal**: enquanto `defesa` não estiver confirmada,
  o defensor vê um formulário (texto + ditado + upload de PDF) em vez da pré-visualização —
  grava direto em `pads/{padId}.defesa`, autorizado por uma regra específica em
  `firestore.rules` (só esse campo, só enquanto não confirmado).
- **Upload de PDF persistido** (Conselho, Decisão, e a Manifestação da Defesa via Portal):
  ao contrário do anexo efêmero da Documentação Inicial, este é gravado no PAD
  (`<secao>.anexoPersistido`) — limite de ~700.000 caracteres de base64 (margem sob o limite
  de ~1MB por documento do Firestore, já que não há Storage disponível).
- **Revogar acesso**: "Revogar acesso a este PAD" (Diretor/Administrador/CPEN da unidade)
  remove só aquele `padId` de `padsVinculados` — não afeta o acesso do defensor a outros
  PADs. O `ativo:false` (kill-switch da conta inteira) é uma ação separada, só Administrador.
- **Login**: `src/app/app.js` reconhece uma conta de defensor pela simples ausência de
  documento em `usuarios` combinada com a presença de um em `defensores` — monta um shell
  minimalista (`src/layout/portalDefesaLayout.js`), nunca o painel institucional.
- **Regras do Firestore** (`firestore.rules`): `souDefensorVinculado(padId)` — defensor só
  lê PADs em que está vinculado (a regra antiga `allow read: if autenticado()` foi
  restringida para `tenhoPerfil() || souDefensorVinculado(padId)`, senão qualquer conta de
  defensor enxergaria todos os PADs do sistema).

## `logs`

```
{ usuarioId, acao, padId, detalhes, data }
```
Imutável — apenas criação (ver `firestore.rules`).

## `configuracoes`

```
{ chave, valor, descricao }
```
Parâmetros institucionais (numeração de PAD, prazos padrão etc. — Fase 2+).

## `modelos`

```
{ tipo, titulo, estrutura }
```
Modelos de documento consumidos por `src/templates` (Fase 4).
