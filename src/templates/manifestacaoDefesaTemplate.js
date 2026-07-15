/**
 * Manifestação da Defesa — a pedido do usuário (2026-07-15), este é o único
 * documento que NUNCA leva o cabeçalho/rodapé institucional
 * (`semCabecalho: true`): é uma folha em branco com o texto que a defesa
 * escreveu (digitado ou ditado), ou o container onde entra o PDF anexado
 * pela defesa (ver `src/pages/pad/detail/documentos/defesaTab.js` — quando
 * há anexo, a aba substitui totalmente este retorno, ver §3 do plano).
 */
import { placeholder } from './shared/condicionais.js';

export function renderizar(pad) {
  const defesa = pad.defesa ?? {};

  return {
    titulo: null,
    semCabecalho: true,
    secoes: [
      { conteudo: defesa.texto || placeholder('MANIFESTAÇÃO DA DEFESA — preencha no formulário, dite por voz ou anexe o PDF') },
    ],
  };
}
