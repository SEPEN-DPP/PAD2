/**
 * Manifestação do Conselho Disciplinar — `conselho.conclusao`
 * ('procedencia'|'improcedencia'|'desclassificacao') muda o parágrafo
 * principal inteiro; a via de desclassificação ainda ramifica por
 * `desclassGrau`/`desclassIncisos`.
 */
import {
  nomeIpenIncidentado,
  artigoRotulo,
  artigoTextoCompleto,
  dataInfracaoFormatada,
  descricaoDosFatos,
  integrantesConselho,
  artigoDesclassificacao,
  textoIncisosDesclassificacao,
  cidadeDaUnidade,
  placeholder,
} from './shared/condicionais.js';
import { dataPorExtenso } from '../utils/dateUtils.js';

function paragrafosProcedencia(pad, conselho) {
  const paragrafos = [
    `Analisando os documentos que instruem o presente Procedimento Administrativo Disciplinar, em especial o registro de ocorrência e os depoimentos colhidos, o Conselho Disciplinar constata que a conduta atribuída ao(à) incidentado(a) ${nomeIpenIncidentado(pad)} encontra-se devidamente comprovada quanto à materialidade e à autoria.`,
    `A conduta descrita amolda-se ao ${artigoTextoCompleto(pad)}, configurando falta disciplinar de natureza GRAVE, nos termos da Lei de Execução Penal.`,
  ];
  const declaracao = pad.declaracoesApenado?.[0];
  const versao = declaracao?.silencio === false ? declaracao?.versaoIncidentado : null;
  if (versao) {
    paragrafos.push(`Em sua oitiva, o(a) incidentado(a) apresentou a seguinte versão: "${versao}". Tal alegação, contudo, não foi suficiente para afastar a responsabilidade disciplinar apurada.`);
  }
  if (conselho.fundamento) paragrafos.push(conselho.fundamento);
  paragrafos.push('Pelo exposto, o Conselho Disciplinar, por unanimidade, manifesta-se pela PROCEDÊNCIA do presente PAD, reconhecendo a prática de falta grave, e sugere à autoridade competente a aplicação das sanções legalmente previstas.');
  return paragrafos;
}

function paragrafosImprocedencia(pad, conselho) {
  const paragrafos = [
    `Analisando os elementos constantes nos autos, o Conselho Disciplinar verificou que as provas produzidas não foram suficientes para comprovar, de forma segura, a autoria e/ou a materialidade da infração imputada ao(à) incidentado(a) ${nomeIpenIncidentado(pad)}.`,
  ];
  const declaracao = pad.declaracoesApenado?.[0];
  const versao = declaracao?.silencio === false ? declaracao?.versaoIncidentado : null;
  if (versao) paragrafos.push(`Em sua oitiva, o(a) incidentado(a) apresentou a seguinte versão: "${versao}".`);
  if (conselho.fundamento) paragrafos.push(conselho.fundamento);
  paragrafos.push('Pelo exposto, o Conselho Disciplinar, por unanimidade, manifesta-se pela IMPROCEDÊNCIA do presente PAD, recomendando o arquivamento dos autos.');
  return paragrafos;
}

function paragrafosDesclassificacao(pad, conselho) {
  const paragrafos = [
    `Analisando os elementos constantes nos autos, o Conselho Disciplinar verificou que, embora a conduta do(a) incidentado(a) ${nomeIpenIncidentado(pad)} configure irregularidade disciplinar, os elementos probatórios não demonstram o preenchimento de todos os requisitos necessários à caracterização de falta grave.`,
  ];
  const declaracao = pad.declaracoesApenado?.[0];
  const versao = declaracao?.silencio === false ? declaracao?.versaoIncidentado : null;
  if (versao) paragrafos.push(`Em sua oitiva, o(a) incidentado(a) apresentou a seguinte versão: "${versao}".`);
  if (conselho.fundamento) paragrafos.push(conselho.fundamento);

  const grau = conselho.desclassGrau;
  const artigo = artigoDesclassificacao(grau);
  const rotuloGrau = grau === 'media' ? 'MÉDIA' : 'LEVE';
  const incisos = textoIncisosDesclassificacao(grau, conselho.desclassIncisos);
  const artigoTexto = artigo ? artigo.label.replace(' — LC 529/2011 (falta leve)', '').replace(' — LC 529/2011 (falta média)', '') : placeholder('ARTIGO');
  paragrafos.push(
    `Pelo exposto, o Conselho Disciplinar, por unanimidade, manifesta-se pela DESCLASSIFICAÇÃO da falta, por entender que os fatos apurados configuram falta de natureza ${rotuloGrau}, nos termos do ${artigoTexto} da Lei Complementar nº 529/2011 do Estado de Santa Catarina${incisos ? `, ${incisos}` : ''}.`,
  );
  return paragrafos;
}

export function renderizar(pad, configUnidade) {
  const numero = pad.dadosGerais?.numero || placeholder('Nº DO PAD');
  const conselhoDados = pad.conselho ?? {};
  const conselho = integrantesConselho(pad, configUnidade);
  const dataInst = pad.portaria?.dataAssinatura ? dataPorExtenso(pad.portaria.dataAssinatura) : placeholder('DATA DE INSTAURAÇÃO');

  let fundamentoAuto;
  if (conselhoDados.conclusao === 'procedencia') fundamentoAuto = paragrafosProcedencia(pad, conselhoDados);
  else if (conselhoDados.conclusao === 'improcedencia') fundamentoAuto = paragrafosImprocedencia(pad, conselhoDados);
  else if (conselhoDados.conclusao === 'desclassificacao') fundamentoAuto = paragrafosDesclassificacao(pad, conselhoDados);
  else fundamentoAuto = [placeholder('SELECIONE A CONCLUSÃO DO CONSELHO')];

  return {
    titulo: 'MANIFESTAÇÃO DO CONSELHO DISCIPLINAR',
    subtitulo: `PAD Nº ${numero}`,
    secoes: [
      { conteudo: `Apenado(a): ${nomeIpenIncidentado(pad)}` },
      { conteudo: `Infração: ${artigoRotulo(pad)} — Data: ${dataInfracaoFormatada(pad)}` },
      { conteudo: `Descrição dos fatos: "${descricaoDosFatos(pad)}"` },
      { conteudo: fundamentoAuto },
      { conteudo: `${cidadeDaUnidade(pad)}, ${dataInst}.` },
    ],
    assinaturas: [
      { nome: conselho.presidente.nome, matricula: conselho.presidente.matricula, cargo: 'Presidente do Conselho Disciplinar' },
      { nome: conselho.membro1.nome, matricula: conselho.membro1.matricula, cargo: 'Membro do Conselho Disciplinar' },
      { nome: conselho.membro2.nome, matricula: conselho.membro2.matricula, cargo: 'Membro do Conselho Disciplinar' },
    ],
  };
}
