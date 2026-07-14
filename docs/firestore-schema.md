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
{ nome, email, perfil, unidade, ativo, criadoEm }
```
Documento com o mesmo `id` do UID do Firebase Authentication.

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
