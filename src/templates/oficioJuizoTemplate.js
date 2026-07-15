/**
 * Ofício ao Juiz — comunica a instauração do PAD à Vara de Execuções
 * Penais. Sem variação de texto. Layout conforme o modelo oficial fornecido
 * pelo usuário (2026-07-15): sem título centralizado — "Ofício n.º X" à
 * esquerda / "Cidade, data" à direita, e o destinatário fixo no rodapé da
 * 1ª página (ver `destinatario`, tratado por pdfExporter.js/previewRenderer.js).
 */
import { formatarData, dataPorExtenso } from '../utils/dateUtils.js';
import { nomeIpenIncidentado, artigoTextoCompleto, dataInfracaoFormatada, diretorDaUnidade, cidadeDaUnidade, placeholder } from './shared/condicionais.js';

export function renderizar(pad) {
  const numero = pad.oficioJuizo?.numero || placeholder('Nº DO OFÍCIO');
  const numeroPad = pad.dadosGerais?.numero || placeholder('Nº DO PAD');
  const diretor = diretorDaUnidade(pad);
  const cidade = cidadeDaUnidade(pad);
  const dataOficio = pad.oficioJuizo?.data ? dataPorExtenso(pad.oficioJuizo.data) : dataPorExtenso(new Date());
  const dataInstNumerica = pad.portaria?.dataAssinatura ? formatarData(pad.portaria.dataAssinatura) : placeholder('DATA DE INSTAURAÇÃO');

  return {
    numeroELinha: { numero: `Ofício n.º ${numero}`, data: `${cidade}, ${dataOficio}.` },
    secoes: [
      { conteudo: 'Senhor(a) Juiz(a),' },
      {
        conteudo: `Cumprimentando Vossa Excelência, comunicamos que em ${dataInstNumerica} foi instaurado, nesta Unidade, o Procedimento Administrativo Disciplinar (PAD) nº ${numeroPad} em desfavor do(a) apenado(a) ${nomeIpenIncidentado(pad)}.`,
      },
      {
        conteudo: `O procedimento visa apurar a prática de falta disciplinar de natureza grave, tipificada no ${artigoTextoCompleto(pad)}, ocorrida em ${dataInfracaoFormatada(pad)}.`,
      },
      { conteudo: 'Tão logo concluído o procedimento disciplinar, os autos serão encaminhados a Vossa Excelência para as providências legais cabíveis.' },
      { conteudo: 'Atenciosamente,' },
    ],
    assinaturas: [{ nome: diretor.nome, cargo: `${diretor.cargo} — ${diretor.unidade}` }],
    destinatario: {
      linhas: [
        'Ao(à) Senhor(a)',
        'MM.(ª) JUIZ(A) DE DIREITO DA VARA DE EXECUÇÕES PENAIS',
        `Comarca de ${cidade}`,
        cidade,
      ],
    },
  };
}
