/**
 * Constantes globais da aplicação. Nenhuma regra de negócio aqui — apenas
 * valores fixos usados por múltiplos módulos.
 */

export const APP_NAME = 'PAD — Polícia Penal de Santa Catarina';

export const APP_SHORT_NAME = 'PAD/SC';

/** Etapas do fluxo processual, na ordem em que ocorrem (ver ARCHITECTURE.md §5). */
export const ETAPAS_PAD = Object.freeze([
  'REGISTRO_INFRACAO',
  'PORTARIA_ABERTURA',
  'TERMO_CIENTIFICACAO',
  'OITIVA_INCIDENTADO',
  'MANIFESTACAO_CONSELHO',
  'MANIFESTACAO_DEFESA',
  'DECISAO_FINAL',
  'ARQUIVAMENTO',
]);

export const ETAPA_LABELS = Object.freeze({
  REGISTRO_INFRACAO: 'Registro de Infração',
  PORTARIA_ABERTURA: 'Portaria de Abertura',
  TERMO_CIENTIFICACAO: 'Termo de Cientificação',
  OITIVA_INCIDENTADO: 'Oitiva do(s) Incidentado(s)',
  MANIFESTACAO_CONSELHO: 'Manifestação do Conselho Disciplinar',
  MANIFESTACAO_DEFESA: 'Manifestação da Defesa',
  DECISAO_FINAL: 'Decisão Final',
  OFICIO_JUIZO: 'Ofício ao Juízo',
  ARQUIVAMENTO: 'Arquivamento',
});

/**
 * Status macro de um PAD (2026-07-20) — sempre derivado de `situacaoAtual`
 * (ver `derivarStatusDaSituacao` em src/services/pads/padService.js), nunca
 * escolhido diretamente: só existe pra alimentar cartão do Dashboard/badge,
 * "onde o processo está de verdade" é `situacaoAtual`.
 */
export const STATUS_PAD = Object.freeze({
  EM_ANDAMENTO: 'EM_ANDAMENTO',
  CONCLUIDO: 'CONCLUIDO',
});

export const STATUS_PAD_LABELS = Object.freeze({
  EM_ANDAMENTO: 'Em andamento',
  CONCLUIDO: 'Concluído',
});

/**
 * Situação atual de um PAD (2026-07-20) — onde o processo está de fato,
 * escolhida manualmente na aba "Dados Gerais" por quem edita o PAD (sem
 * ordem obrigatória, mesmo espírito das abas de documento — ver
 * ARCHITECTURE.md §5). Cada mudança lança um evento em `eventos` (ver
 * `alterarSituacaoAtual` em src/services/pads/padService.js), formando o
 * histórico mostrado na própria aba.
 */
export const SITUACAO_ATUAL_PAD = Object.freeze([
  'PORTARIA',
  'CIENTIFICACAO',
  'AGUARDANDO_AUDIENCIA',
  'AGUARDANDO_MANIFESTACAO_CONSELHO',
  'AGUARDANDO_MANIFESTACAO_ADVOGADO',
  'AGUARDANDO_DECISAO_DIRETOR',
  'PENDENTE_ENVIO_JUDICIARIO',
  'AGUARDANDO_DECISAO_JUDICIAL',
  'CONCLUIDO',
]);

export const SITUACAO_ATUAL_LABELS = Object.freeze({
  PORTARIA: 'Portaria',
  CIENTIFICACAO: 'Cientificação',
  AGUARDANDO_AUDIENCIA: 'Aguardando audiência',
  AGUARDANDO_MANIFESTACAO_CONSELHO: 'Aguardando manifestação do Conselho',
  AGUARDANDO_MANIFESTACAO_ADVOGADO: 'Aguardando manifestação do advogado',
  AGUARDANDO_DECISAO_DIRETOR: 'Aguardando decisão do Diretor',
  PENDENTE_ENVIO_JUDICIARIO: 'Pendente de envio ao Judiciário',
  AGUARDANDO_DECISAO_JUDICIAL: 'Aguardando decisão judicial',
  CONCLUIDO: 'Concluído',
});

/** Nomes das coleções do Firestore, centralizados para evitar strings soltas. */
export const COLLECTIONS = Object.freeze({
  PADS: 'pads',
  USUARIOS: 'usuarios',
  DEFENSORES: 'defensores',
  EVENTOS: 'eventos',
  ADVOGADOS_CADASTRO: 'advogadosCadastro',
  LOGS: 'logs',
  CONFIGURACOES: 'configuracoes',
  CONFIGURACOES_UNIDADE: 'configuracoesUnidade',
  MODELOS: 'modelos',
  LEMBRETES: 'lembretes',
  MENSAGENS: 'mensagens',
});
