/**
 * Ofício de Encaminhamento à VEP — no PAD V1 este documento existia no
 * código mas nunca ficou acessível na tela; portado como um documento real
 * e navegável na V2, a pedido do usuário. Estruturalmente simétrico ao
 * Ofício ao Juiz, com um parágrafo extra que resume o parecer do Conselho
 * (`conselho.conclusao`).
 */
import { formatarData, dataPorExtenso } from '../utils/dateUtils.js';
import { nomeIpenIncidentado, artigoTextoCompleto, dataInfracaoFormatada, diretorDaUnidade, cidadeDaUnidade, placeholder } from './shared/condicionais.js';

export function renderizar(pad) {
  const numero = pad.oficioVep?.numero || placeholder('Nº DO OFÍCIO');
  const numeroPad = pad.dadosGerais?.numero || placeholder('Nº DO PAD');
  const diretor = diretorDaUnidade(pad);
  const dataOficio = pad.oficioVep?.data ? dataPorExtenso(pad.oficioVep.data) : dataPorExtenso(new Date());
  const dataInstNumerica = pad.portaria?.dataAssinatura ? formatarData(pad.portaria.dataAssinatura) : placeholder('DATA DE INSTAURAÇÃO');

  const paragrafoConselho = pad.conselho?.conclusao === 'procedencia'
    ? 'O Conselho Disciplinar, por unanimidade, entendeu configurada a falta grave, sugerindo a aplicação das sanções legalmente previstas. O(A) Diretor(a) desta Unidade corrobora o parecer exarado pelo Conselho Disciplinar.'
    : 'O Conselho Disciplinar manifestou-se conforme parecer em anexo.';

  return {
    titulo: `OFÍCIO Nº ${numero}`,
    secoes: [
      { conteudo: `${cidadeDaUnidade(pad)}, ${dataOficio}.` },
      { conteudo: 'Senhor(a) Juiz(a),' },
      {
        conteudo: `Cumprimentando Vossa Excelência, comunicamos que em ${dataInstNumerica} foi instaurado, nesta Unidade, o Procedimento Administrativo Disciplinar (PAD) nº ${numeroPad} em desfavor do(a) apenado(a) ${nomeIpenIncidentado(pad)}, pela prática, em tese, do ${artigoTextoCompleto(pad)}, ocorrida em ${dataInfracaoFormatada(pad)}.`,
      },
      { conteudo: paragrafoConselho },
      { conteudo: 'Encaminhamos os autos do presente procedimento para conhecimento e as providências que Vossa Excelência entender cabíveis.' },
      { conteudo: 'Atenciosamente,' },
      { conteudo: 'A Sua Excelência o(a) Senhor(a)\nMM.(ª) Juiz(íza) da Vara de Execuções Penais' },
    ],
    assinaturas: [{ nome: diretor.nome, cargo: `${diretor.cargo} — ${diretor.unidade}` }],
  };
}
