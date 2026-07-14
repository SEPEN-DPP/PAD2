# Schema do Firestore

Coleções top-level (sem subcoleções nesta fase — vínculo por `padId`/`eventoId` como chave
estrangeira). Ver [ARCHITECTURE.md](../ARCHITECTURE.md) §4 para o racional.

## `pads`

```
{
  dadosGerais: { numero, unidade, dataAbertura, status },
  incidentados: [{ nomeCompleto, ipen }],
  infracao: { data, tipificacao, artigoLep: { codigo, rotulo }, detentosEnvolvidos: [], agentesEnvolvidos: [], observacoes },
  defesa: { advogadoId, memoriais: [], prazos },
  conselho: { manifestacao, integrantes: [], data },
  decisao: { tipo, fundamentacao, data, responsavel },
  status: 'EM_ANDAMENTO' | 'AGUARDANDO_DEFESA' | 'AGUARDANDO_DECISAO' | 'CONCLUIDO' | 'ARQUIVADO',
  criadoEm, atualizadoEm
}
```

`incidentados[].ipen` vem do campo `Prontuário:` do Registro de Infração do i-PEN — no
próprio documento, o texto da descrição chama esse número de "MATRÍCULA IPEN" (confirmado
com o usuário; **não confundir com o campo `RG i-PEN:` do formulário, que é outro
número**). `infracao.tipificacao` vem do campo `UNIDADE / INFRAÇÃO:` do formulário (o texto
curto de enquadramento, não o campo `DESCRIÇÃO:` — o relato narrativo do incidente não faz
parte do escopo de extração atual). Ver
[src/parser/README.md](../src/parser/README.md) para o mapeamento completo de rótulos.

## `eventos`

```
{
  padId,
  tipo: 'REGISTRO_INFRACAO' | 'PORTARIA_ABERTURA' | 'TERMO_CIENTIFICACAO' | 'OITIVA_INCIDENTADO'
      | 'MANIFESTACAO_CONSELHO' | 'MANIFESTACAO_DEFESA' | 'DECISAO_FINAL' | 'OFICIO_JUIZO' | 'ARQUIVAMENTO',
  responsavel,
  data,
  status,
  observacoes,
  criadoEm, atualizadoEm
}
```

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
  // presentes só durante o status PENDENTE (autocadastro, ver abaixo):
  cpf, dataNascimento, unidadeSolicitada,
}
```
Documento com o mesmo `id` do UID do Firebase Authentication.

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
