/**
 * Ofício ao Juiz — comunica a instauração do PAD à Vara de Execuções
 * Penais. Sem variação de texto.
 */
import { formatarData, dataPorExtenso } from '../utils/dateUtils.js';
import { nomeIpenIncidentado, artigoTextoCompleto, dataInfracaoFormatada, diretorDaUnidade, cidadeDaUnidade, placeholder } from './shared/condicionais.js';

export function renderizar(pad) {
  const numero = pad.oficioJuizo?.numero || placeholder('Nº DO OFÍCIO');
  const numeroPad = pad.dadosGerais?.numero || placeholder('Nº DO PAD');
  const diretor = diretorDaUnidade(pad);
  const dataOficio = pad.oficioJuizo?.data ? dataPorExtenso(pad.oficioJuizo.data) : dataPorExtenso(new Date());
  const dataInstNumerica = pad.portaria?.dataAssinatura ? formatarData(pad.portaria.dataAssinatura) : placeholder('DATA DE INSTAURAÇÃO');

  return {
    titulo: `OFÍCIO Nº ${numero}`,
    secoes: [
      { conteudo: `${cidadeDaUnidade(pad)}, ${dataOficio}.` },
      { conteudo: 'Senhor(a) Juiz(a),' },
      {
        conteudo: `Cumprimentando Vossa Excelência, comunicamos que em ${dataInstNumerica} foi instaurado, nesta Unidade, o Procedimento Administrativo Disciplinar (PAD) nº ${numeroPad} em desfavor do(a) apenado(a) ${nomeIpenIncidentado(pad)}.`,
      },
      {
        conteudo: `O procedimento visa apurar a prática de falta disciplinar de natureza grave, tipificada no ${artigoTextoCompleto(pad)}, ocorrida em ${dataInfracaoFormatada(pad)}.`,
      },
      { conteudo: 'Tão logo concluído o procedimento disciplinar, os autos serão encaminhados a Vossa Excelência para as providências legais cabíveis.' },
      { conteudo: 'Atenciosamente,' },
      { conteudo: 'A Sua Excelência o(a) Senhor(a)\nMM.(ª) Juiz(íza) de Direito da Vara de Execuções Penais' },
    ],
    assinaturas: [{ nome: diretor.nome, cargo: `${diretor.cargo} — ${diretor.unidade}` }],
  };
}
