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
  'OFICIO_JUIZO',
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

/** Status macro de um PAD, usados nos cartões do Dashboard. */
export const STATUS_PAD = Object.freeze({
  EM_ANDAMENTO: 'EM_ANDAMENTO',
  AGUARDANDO_DEFESA: 'AGUARDANDO_DEFESA',
  AGUARDANDO_DECISAO: 'AGUARDANDO_DECISAO',
  CONCLUIDO: 'CONCLUIDO',
  ARQUIVADO: 'ARQUIVADO',
});

export const STATUS_PAD_LABELS = Object.freeze({
  EM_ANDAMENTO: 'Em andamento',
  AGUARDANDO_DEFESA: 'Aguardando defesa',
  AGUARDANDO_DECISAO: 'Aguardando decisão',
  CONCLUIDO: 'Concluído',
  ARQUIVADO: 'Arquivado',
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
});
