/**
 * Portaria de Instauração — primeiro documento do PAD (ver
 * src/templates/README.md). Conteúdo/redação portados do PAD V1.
 */
import { dataPorExtenso } from '../utils/dateUtils.js';
import {
  nomeIpenIncidentado,
  dataInfracaoFormatada,
  descricaoDosFatos,
  artigoTextoCompleto,
  integrantesConselho,
  nomeMatriculaTexto,
  diretorDaUnidade,
  cidadeDaUnidade,
  placeholder,
} from './shared/condicionais.js';

/**
 * @param {object} pad
 * @param {object} [configUnidade] valor inicial de Diretor/Conselho quando o PAD ainda não os tem próprios
 */
export function renderizar(pad, configUnidade) {
  const diretor = diretorDaUnidade(pad, configUnidade);
  const conselho = integrantesConselho(pad, configUnidade);
  const numero = pad.dadosGerais?.numero || placeholder('Nº DO PAD');
  const dataInst = pad.portaria?.dataAssinatura ? dataPorExtenso(pad.portaria.dataAssinatura) : placeholder('DATA DE INSTAURAÇÃO');
  const cidadeData = `${cidadeDaUnidade(pad)}, ${dataInst}.`;
  const qualificacaoDiretor = [diretor.nome, diretor.cargo, diretor.unidade].join(', ');

  return {
    titulo: `PORTARIA Nº ${numero}`,
    secoes: [
      { conteudo: cidadeData },
      {
        conteudo: `O(A) ${qualificacaoDiretor}, no uso de suas atribuições legais conferidas pela Lei Complementar nº 774/2021, em consonância com a Lei Complementar nº 529/2011, que aprova o Regimento Interno dos Estabelecimentos Penais do Estado de Santa Catarina, e em consonância com a Lei nº 7.210/84 (Lei de Execução Penal) e, considerando os documentos constantes nos autos,`,
      },
      {
        conteudo: `CONSIDERANDO que em ${dataInfracaoFormatada(pad)} o(a) interno(a) ${nomeIpenIncidentado(pad)} teve registrada a seguinte infração disciplinar:`,
      },
      { conteudo: `"${descricaoDosFatos(pad)}"` },
      {
        conteudo: `CONSIDERANDO que a conduta descrita, em tese, amolda-se ao ${artigoTextoCompleto(pad)}, configurando falta disciplinar de natureza GRAVE;`,
      },
      {
        heading: 'RESOLVE:',
        conteudo: [
          '1. Instaurar Procedimento Administrativo Disciplinar (PAD) para apurar os fatos acima descritos;',
          '2. Determinar que se procedam as diligências internas que se fizerem necessárias, visando apurar a prática de FALTA GRAVE;',
          `3. Designar o Conselho Disciplinar, composto pelos servidores abaixo indicados, para conduzir o procedimento e, ao final, emitir parecer sobre os fatos apurados, remetendo os autos para decisão administrativa desta Diretoria: Presidente: ${nomeMatriculaTexto(conselho.presidente)}, Policial Penal; Membro: ${nomeMatriculaTexto(conselho.membro1)}, Policial Penal; Membro: ${nomeMatriculaTexto(conselho.membro2)}, Policial Penal.`,
          '4. O prazo para conclusão do PAD é de 30 (trinta) dias, contados da data desta Portaria, podendo ser prorrogado por igual período, desde que devidamente justificado.',
        ],
      },
      { conteudo: 'CUMPRA-SE.' },
      { conteudo: cidadeData },
    ],
    assinaturas: [{ nome: diretor.nome, cargo: `${diretor.cargo} — ${diretor.unidade}` }],
  };
}
