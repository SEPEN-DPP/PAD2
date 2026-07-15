/**
 * Manifestação da Defesa — `defesa.tipo` muda só a identificação do
 * defensor (advogado constituído, defensoria pública ou nenhum).
 */
import { dataPorExtenso } from '../utils/dateUtils.js';
import { nomeIpenIncidentado, artigoRotulo, dataInfracaoFormatada, textoDefensor, cidadeDaUnidade, placeholder } from './shared/condicionais.js';

export function renderizar(pad) {
  const numero = pad.dadosGerais?.numero || placeholder('Nº DO PAD');
  const defesa = pad.defesa ?? {};
  const dataInst = pad.portaria?.dataAssinatura ? dataPorExtenso(pad.portaria.dataAssinatura) : placeholder('DATA DE INSTAURAÇÃO');
  const defensor = textoDefensor(defesa);

  return {
    titulo: 'MANIFESTAÇÃO DA DEFESA',
    subtitulo: `PAD Nº ${numero}`,
    secoes: [
      { conteudo: `Incidentado(a): ${nomeIpenIncidentado(pad)}` },
      { conteudo: `Infração: ${artigoRotulo(pad)} — Data: ${dataInfracaoFormatada(pad)}` },
      { conteudo: `${defensor}, no exercício da defesa do(a) incidentado(a), vem apresentar sua manifestação:` },
      { conteudo: defesa.texto || placeholder('MANIFESTAÇÃO DA DEFESA — preencha no formulário ou faça upload do documento') },
      { conteudo: `${cidadeDaUnidade(pad)}, ${dataInst}.` },
    ],
    assinaturas: [{ nome: defensor }],
  };
}
