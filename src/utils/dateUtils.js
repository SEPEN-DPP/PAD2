/** Utilitários puros de formatação de data. Sem dependência externa. */

const FORMATADOR_DATA = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
const FORMATADOR_DATA_HORA = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});

/**
 * Converte para Date evitando o problema de fuso horário: uma string
 * "yyyy-mm-dd" pura (sem horário) é interpretada pelo construtor nativo
 * `Date` como meia-noite UTC, o que em fusos negativos (ex.: Brasil, UTC-3)
 * mostra o dia ANTERIOR ao real. Aqui, uma data assim é sempre montada no
 * fuso local em vez de UTC.
 */
function paraData(valor) {
  if (typeof valor?.toDate === 'function') {
    // Timestamp do Firestore: seu valueOf() retorna uma string de comparação
    // (segundos.nanossegundos), não epoch — passar direto para `new Date()`
    // resulta em "Invalid Date". `.toDate()` é a conversão correta.
    return valor.toDate();
  }
  if (typeof valor === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(valor)) {
    const [ano, mes, dia] = valor.split('-').map(Number);
    return new Date(ano, mes - 1, dia);
  }
  return new Date(valor);
}

/** Converte "dd/mm/aaaa" para um Date local (meio-dia meia-noite local, sem risco de fuso). */
export function dataBrParaDate(dataBr) {
  const [dia, mes, ano] = dataBr.split('/').map(Number);
  return new Date(ano, mes - 1, dia);
}

/** @param {string|number|Date} valor */
export function formatarData(valor) {
  if (!valor) return '—';
  return FORMATADOR_DATA.format(paraData(valor));
}

/** @param {string|number|Date} valor */
export function formatarDataHora(valor) {
  if (!valor) return '—';
  return FORMATADOR_DATA_HORA.format(paraData(valor));
}

const MESES_POR_EXTENSO = [
  'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
  'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro',
];

/** Formato "14 de julho de 2026" — usado nos documentos oficiais do PAD. */
export function dataPorExtenso(valor) {
  if (!valor) return '—';
  const data = paraData(valor);
  return `${data.getDate()} de ${MESES_POR_EXTENSO[data.getMonth()]} de ${data.getFullYear()}`;
}

/** Retorna algo como "há 3 dias" a partir de uma data. */
export function tempoRelativo(valor) {
  if (!valor) return '—';
  const diffMs = Date.now() - paraData(valor).getTime();
  const diffMin = Math.round(diffMs / 60000);
  if (diffMin < 1) return 'agora mesmo';
  if (diffMin < 60) return `há ${diffMin} min`;
  const diffHoras = Math.round(diffMin / 60);
  if (diffHoras < 24) return `há ${diffHoras} h`;
  const diffDias = Math.round(diffHoras / 24);
  return `há ${diffDias} dia${diffDias > 1 ? 's' : ''}`;
}
