/** Utilitários puros de formatação de data. Sem dependência externa. */

const FORMATADOR_DATA = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short' });
const FORMATADOR_DATA_HORA = new Intl.DateTimeFormat('pt-BR', {
  dateStyle: 'short',
  timeStyle: 'short',
});

/** @param {string|number|Date} valor */
export function formatarData(valor) {
  if (!valor) return '—';
  return FORMATADOR_DATA.format(new Date(valor));
}

/** @param {string|number|Date} valor */
export function formatarDataHora(valor) {
  if (!valor) return '—';
  return FORMATADOR_DATA_HORA.format(new Date(valor));
}

/** Retorna algo como "há 3 dias" a partir de uma data. */
export function tempoRelativo(valor) {
  if (!valor) return '—';
  const diffMs = Date.now() - new Date(valor).getTime();
  const diffMin = Math.round(diffMs / 60000);
  if (diffMin < 1) return 'agora mesmo';
  if (diffMin < 60) return `há ${diffMin} min`;
  const diffHoras = Math.round(diffMin / 60);
  if (diffHoras < 24) return `há ${diffHoras} h`;
  const diffDias = Math.round(diffHoras / 24);
  return `há ${diffDias} dia${diffDias > 1 ? 's' : ''}`;
}
