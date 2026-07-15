/**
 * Termo de Cientificação — comunica ao incidentado a instauração do PAD e
 * seu direito de indicar defesa. Sem variações de texto (os campos "(  )
 * Advogado / (  ) Defensor público" são sempre impressos em branco, para
 * assinatura manual — mesmo comportamento do PAD V1).
 */
import { dataPorExtenso } from '../utils/dateUtils.js';
import { nomeIpenIncidentado, artigoTextoCompleto, cidadeDaUnidade, placeholder } from './shared/condicionais.js';

export function renderizar(pad) {
  const numero = pad.dadosGerais?.numero || placeholder('Nº DO PAD');
  const unidade = pad.dadosGerais?.unidade || placeholder('UNIDADE');
  const dataInst = pad.portaria?.dataAssinatura ? dataPorExtenso(pad.portaria.dataAssinatura) : placeholder('DATA DE INSTAURAÇÃO');
  const cidadeData = `${cidadeDaUnidade(pad)}, ${dataInst}.`;
  const incidentado = pad.incidentados?.[0] ?? {};
  const observacoes = pad.termoCientificacao?.observacoes;

  return {
    titulo: 'TERMO DE CIENTIFICAÇÃO',
    subtitulo: `PAD Nº ${numero}`,
    secoes: [
      {
        conteudo: `Ao ${cidadeDaUnidade(pad)}, ${dataInst}, na ${unidade}, o(a) policial penal abaixo assinado(a) procedeu à cientificação do(a) interno(a) ${nomeIpenIncidentado(pad)} acerca da instauração do Procedimento Administrativo Disciplinar (PAD) nº ${numero}, pela prática, em tese, do ${artigoTextoCompleto(pad)}.`,
      },
      {
        conteudo: 'O(A) interno(a) foi formalmente cientificado(a) de que possui o direito à ampla defesa e ao contraditório, podendo constituir advogado ou requerer a nomeação de defensor público, nos termos do art. 5º, LV, da Constituição Federal e do art. 59 da Lei nº 7.210/84 (Lei de Execução Penal).',
      },
      { conteudo: 'O(A) interno(a) foi instado(a) a indicar o tipo de defesa, declarando:' },
      {
        conteudo: [
          '(   ) Advogado constituído: ___________________________________________, OAB nº ______________',
          '(   ) Defensor público nomeado',
        ],
      },
      ...(observacoes ? [{ conteudo: observacoes }] : []),
      { conteudo: 'Nada mais havendo, encerra-se o presente Termo.' },
      { conteudo: cidadeData },
    ],
    assinaturas: [
      { nome: `Interno(a): ${incidentado.nomeCompleto || placeholder('NOME')}`, cargo: `IPEN Nº ${incidentado.ipen || placeholder('PRONTUÁRIO')}` },
      { nome: 'Policial Penal', cargo: unidade },
    ],
  };
}
