/**
 * Declarações do Apenado — um Termo por incidentado (PAD pode ter mais de
 * um, ver src/pages/pad/detail/documentos/depoimentoIncidentadoTab.js).
 * `declaracao.silencio` (true/false) muda o corpo inteiro do termo; o
 * bloco de assinatura do defensor depende de `defesa.tipo`.
 */
import { dataPorExtenso } from '../utils/dateUtils.js';
import { artigoRotulo, integrantesConselho, textoDefensor, cidadeDaUnidade, placeholder } from './shared/condicionais.js';

/**
 * @param {object} pad
 * @param {{ id: string, nomeCompleto: string, ipen: string }} incidentado
 * @param {{ silencio: boolean, versaoIncidentado: string }} declaracao
 * @param {object} [configUnidade]
 */
export function renderizar(pad, incidentado, declaracao, configUnidade) {
  const numero = pad.dadosGerais?.numero || placeholder('Nº DO PAD');
  const unidade = pad.dadosGerais?.unidade || placeholder('UNIDADE');
  const dataInst = pad.portaria?.dataAssinatura ? dataPorExtenso(pad.portaria.dataAssinatura) : placeholder('DATA DE INSTAURAÇÃO');
  const cidadeData = `${cidadeDaUnidade(pad)}, ${dataInst}.`;
  const defesa = pad.defesa ?? {};
  const conselho = integrantesConselho(pad, configUnidade);
  const nomeIpen = `${incidentado?.nomeCompleto || placeholder('NOME DO INCIDENTADO')} – IPEN Nº ${incidentado?.ipen || placeholder('PRONTUÁRIO')}`;

  const corpo = declaracao?.silencio
    ? [
        `Cientificado(a) dos fatos que lhe são imputados — ${artigoRotulo(pad)} —, bem como dos documentos que instruem o presente PAD, e do seu direito constitucional de permanecer em silêncio, sendo-lhe esclarecido que tal omissão não poderá ser interpretada em seu desfavor, o(a) incidentado(a) optou por permanecer em silêncio, não prestando qualquer declaração acerca dos fatos apurados.`,
        'Nada mais havendo, encerra-se o presente Termo.',
      ]
    : [
        `Cientificado(a) dos fatos que lhe são imputados — ${artigoRotulo(pad)} —, bem como dos documentos que instruem o presente PAD, e do seu direito constitucional de permanecer em silêncio, sendo-lhe esclarecido que tal omissão não poderá ser interpretada em seu desfavor, ao ser indagado(a), declarou:`,
        `"${declaracao?.versaoIncidentado || placeholder('VERSÃO DO INCIDENTADO')}"`,
        'Nada mais disse nem lhe foi perguntado. Lido e achado conforme, vai o presente Termo assinado pelos presentes.',
      ];

  const assinaturaDefensor = defesa.tipo
    ? { nome: `Defensor(a): ${textoDefensor(defesa)}` }
    : { nome: 'Sem defensor(a)' };

  return {
    titulo: 'TERMO DE DECLARAÇÕES DO INCIDENTADO',
    subtitulo: `PAD Nº ${numero}`,
    secoes: [
      {
        conteudo: `Ao ${dataInst}, na ${unidade}, presentes os membros do Conselho Disciplinar e ${textoDefensor(defesa)}, procedeu-se à oitiva do(a) incidentado(a) ${nomeIpen}.`,
      },
      { conteudo: corpo },
      { conteudo: cidadeData },
    ],
    assinaturas: [
      { nome: `Incidentado(a): ${incidentado?.nomeCompleto || placeholder('NOME')}` },
      assinaturaDefensor,
      { nome: 'Presidente do Conselho Disciplinar', cargo: conselho.presidente },
      { nome: 'Membro do Conselho Disciplinar', cargo: conselho.membro1 },
      { nome: 'Membro do Conselho Disciplinar', cargo: conselho.membro2 },
    ],
  };
}
