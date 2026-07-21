/**
 * Oitiva de Testemunha/Informante — um documento por item de `pad.testemunhas[]`
 * (ver src/pages/pad/detail/documentos/testemunhasTab.js). `qualidade`
 * ('testemunha'|'informante') muda o título, o parágrafo de advertência e o
 * rótulo de assinatura.
 */
import { dataPorExtenso } from '../utils/dateUtils.js';
import { integrantesConselho, textoDefensor, cidadeDaUnidade, placeholder } from './shared/condicionais.js';

const ADVERTENCIA_INFORMANTE =
  'O(A) depoente está sendo ouvido(a) na qualidade de INFORMANTE, em razão de ter declarado manter relação próxima com o(a) incidentado(a), não tendo, por isso, o compromisso legal de dizer a verdade.';

const ADVERTENCIA_TESTEMUNHA =
  'O(A) depoente está sendo ouvido(a) na qualidade de TESTEMUNHA, tendo sido advertido(a) do dever de dizer a verdade sobre tudo o que souber e lhe for perguntado, sob pena de responder pelo crime de falso testemunho, previsto no art. 342 do Código Penal.';

/**
 * @param {object} pad
 * @param {{ nome: string, qualificacao: string, qualidade: 'testemunha'|'informante', depoimento: string }} testemunha
 * @param {object} [configUnidade]
 */
export function renderizar(pad, testemunha, configUnidade) {
  const numero = pad.dadosGerais?.numero || placeholder('Nº DO PAD');
  const unidade = pad.dadosGerais?.unidade || placeholder('UNIDADE');
  const dataInst = pad.portaria?.dataAssinatura ? dataPorExtenso(pad.portaria.dataAssinatura) : placeholder('DATA DE INSTAURAÇÃO');
  const cidadeData = `${cidadeDaUnidade(pad)}, ${dataInst}.`;
  const ehInformante = testemunha?.qualidade === 'informante';
  const conselho = integrantesConselho(pad, configUnidade);
  const defesa = pad.defesa ?? {};
  const assinaturaDefensor = defesa.tipo
    ? { nome: `Defensor(a): ${textoDefensor(defesa)}` }
    : { nome: 'Sem defensor(a)' };

  return {
    titulo: ehInformante ? 'TERMO DE OITIVA DE INFORMANTE' : 'TERMO DE OITIVA DE TESTEMUNHA',
    subtitulo: `PAD Nº ${numero}`,
    secoes: [
      {
        conteudo: `Ao ${dataInst}, na ${unidade}, presentes os membros do Conselho Disciplinar e ${textoDefensor(defesa)}, procedeu-se à oitiva de ${testemunha?.nome || placeholder('NOME')}, ${testemunha?.qualificacao || placeholder('QUALIFICAÇÃO')}.`,
      },
      { conteudo: ehInformante ? ADVERTENCIA_INFORMANTE : ADVERTENCIA_TESTEMUNHA },
      { conteudo: `Ao ser indagado(a) sobre os fatos relacionados ao PAD nº ${numero}, declarou:` },
      { conteudo: `"${testemunha?.depoimento || placeholder('DEPOIMENTO')}"` },
      { conteudo: 'Nada mais disse nem lhe foi perguntado. Lido e achado conforme, vai o presente Termo assinado pelos presentes.' },
      { conteudo: cidadeData },
    ],
    assinaturas: [
      { nome: `${ehInformante ? 'Informante' : 'Testemunha'}: ${testemunha?.nome || placeholder('NOME')}` },
      assinaturaDefensor,
      { nome: conselho.presidente.nome, matricula: conselho.presidente.matricula, cargo: 'Presidente do Conselho Disciplinar' },
    ],
  };
}
