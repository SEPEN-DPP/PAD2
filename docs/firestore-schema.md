# Schema do Firestore

Coleções top-level (sem subcoleções nesta fase — vínculo por `padId`/`eventoId` como chave
estrangeira). Ver [ARCHITECTURE.md](../ARCHITECTURE.md) §4 para o racional.

## `pads`

```
{
  dadosGerais: { numero, unidade, dataAbertura },
  superintendencia, // SR da unidade (ex.: "SR04") — denormalizado, mesma razão que em `usuarios`
  incidentados: [{ nomeCompleto, ipen }],
  infracao: { data, tipificacao, artigoLep: { codigo, rotulo } | null, detentosEnvolvidos: [], agentesEnvolvidos: [], observacoes },
  defesa: { advogadoId, memoriais: [], prazos },
  conselho: { manifestacao, integrantes: [], data },
  decisao: { tipo, fundamentacao, data, responsavel },
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

## `advogados`

```
{ nome, email, oab, padId, primeiroAcessoConcluido, criadoEm }
```
Contexto de autenticação separado (Fase 6).

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
