# Schema do Firestore

Coleções top-level (sem subcoleções nesta fase — vínculo por `padId`/`eventoId` como chave
estrangeira). Ver [ARCHITECTURE.md](../ARCHITECTURE.md) §4 para o racional.

## `pads`

```
{
  dadosGerais: { numero, unidade, dataAbertura, status },
  incidentados: [{ nomeCompleto, ipen }],
  infracao: { data, descricao, artigos: [], detentosEnvolvidos: [], agentesEnvolvidos: [], observacoes },
  defesa: { advogadoId, memoriais: [], prazos },
  conselho: { manifestacao, integrantes: [], data },
  decisao: { tipo, fundamentacao, data, responsavel },
  status: 'EM_ANDAMENTO' | 'AGUARDANDO_DEFESA' | 'AGUARDANDO_DECISAO' | 'CONCLUIDO' | 'ARQUIVADO',
  criadoEm, atualizadoEm
}
```

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
