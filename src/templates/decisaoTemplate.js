/**
 * Decisão da Direção — o mais complexo dos 10 documentos: três seções
 * formais (Relatório, Fundamentação, Dispositivo). O Dispositivo ramifica
 * por `decisao.resultado` ('absolvicao'|'desclassificacao'|'falta_grave').
 */
import { dataPorExtenso } from '../utils/dateUtils.js';
import {
  nomeIpenIncidentado,
  dataInfracaoFormatada,
  artigoTextoCompleto,
  artigoRotulo,
  textoDefensor,
  diretorDaUnidade,
  artigoDesclassificacao,
  textoIncisosDesclassificacao,
  listaSancoes,
  cidadeDaUnidade,
  placeholder,
} from './shared/condicionais.js';

const ROTULO_CONCLUSAO_CONSELHO = {
  procedencia: 'pela procedência do feito, reconhecendo a prática de falta grave',
  improcedencia: 'pela improcedência do feito, pugnando pelo arquivamento',
  desclassificacao: 'pela desclassificação da infração disciplinar',
};

function relatorioTestemunhas(pad) {
  const testemunhas = pad.testemunhas ?? [];
  if (!testemunhas.length) return 'Não foram arroladas testemunhas no presente procedimento.';
  const linhas = testemunhas.map((t) => {
    const qualidade = t.qualidade === 'informante' ? 'informante' : 'testemunha';
    const relato = t.depoimento
      ? `declarando, em síntese: "${t.depoimento}".`
      : 'cujo depoimento encontra-se registrado nos autos.';
    return `${t.nome || placeholder('NOME')}, ${t.qualificacao || placeholder('QUALIFICAÇÃO')}, na qualidade de ${qualidade}, ${relato}`;
  });
  return ['Designada audiência para oitiva de testemunha(s)/informante(s), foram ouvidos:', ...linhas];
}

function relatorioIncidentado(pad) {
  const declaracoes = pad.declaracoesApenado?.[0] ?? {};
  if (declaracoes.silencio) {
    return `Na sequência, procedeu-se à inquirição do(a) incidentado(a) ${nomeIpenIncidentado(pad)}, que, devidamente cientificado(a) do seu direito constitucional ao silêncio, optou por não prestar declarações.`;
  }
  return `Na sequência, procedeu-se à inquirição do(a) incidentado(a) ${nomeIpenIncidentado(pad)}, que, ao ser indagado(a), declarou, em síntese: "${declaracoes.versaoIncidentado || placeholder('VERSÃO DO INCIDENTADO')}".`;
}

function relatorioConselho(pad) {
  const conselho = pad.conselho ?? {};
  const rotulo = ROTULO_CONCLUSAO_CONSELHO[conselho.conclusao] || placeholder('CONCLUSÃO DO CONSELHO');
  const texto = conselho.fundamento
    ? `, tendo consignado: "${conselho.fundamento}".`
    : ', conforme parecer acostado aos autos.';
  return `O Conselho Disciplinar, ao final da instrução, manifestou-se ${rotulo}${texto}`;
}

function relatorioDefesa(pad) {
  const defesa = pad.defesa ?? {};
  const manifestacao = defesa.texto
    ? `, alegando, em síntese: "${defesa.texto}"`
    : ' conforme documentos acostados aos autos';
  return `Por sua vez, a Defesa, promovida por ${textoDefensor(defesa)}, manifestou-se${manifestacao}.`;
}

function dispositivo(pad) {
  const decisao = pad.decisao ?? {};
  const diretor = diretorDaUnidade(pad);
  const incidentado = pad.incidentados?.[0] ?? {};

  if (decisao.resultado === 'absolvicao') {
    return [
      'DECIDO:',
      `1. Acolher o parecer do Conselho Disciplinar pela IMPROCEDÊNCIA do PAD, absolvendo o(a) incidentado(a) ${incidentado.nomeCompleto || placeholder('NOME')} das imputações que lhe foram atribuídas.`,
      '2. Determinar o arquivamento dos autos.',
      '3. Remeta-se cópia ao(à) MM.(ª) Juiz(íza) de Direito da Vara de Execuções Penais.',
      '4. Registre-se no prontuário do(a) incidentado(a).',
    ];
  }

  if (decisao.resultado === 'desclassificacao') {
    const grau = decisao.desclassGrau;
    const artigo = artigoDesclassificacao(grau);
    const rotuloGrau = grau === 'media' ? 'MÉDIA' : 'LEVE';
    const artigoRotuloCurto = artigo ? artigo.label.split(' — ')[0] : placeholder('ARTIGO');
    const incisos = textoIncisosDesclassificacao(grau, decisao.desclassIncisos);
    return [
      'DECIDO:',
      `1. Acolher o parecer do Conselho Disciplinar, desclassificando a infração para falta de natureza ${rotuloGrau}, nos termos do ${artigoRotuloCurto}${incisos ? `, ${incisos}` : ''} da Lei Complementar nº 529/2011 do Estado de Santa Catarina.`,
      '2. Determinar o arquivamento dos autos.',
      '3. Remeta-se cópia ao(à) MM.(ª) Juiz(íza) de Direito da Vara de Execuções Penais.',
      '4. Registre-se no prontuário do(a) incidentado(a).',
    ];
  }

  if (decisao.resultado === 'falta_grave') {
    const sancoes = listaSancoes(decisao.sancoes);
    const letras = 'abcdefghij';
    const listaSancoesTexto = sancoes.length
      ? sancoes.map((s, i) => `${letras[i]}) ${s};`).join(' ')
      : placeholder('SANÇÕES A APLICAR');
    return [
      'DECIDO:',
      `1. Reconhecer a prática de FALTA GRAVE, tipificada no ${artigoRotulo(pad)}, pelo(a) interno(a) ${nomeIpenIncidentado(pad)}.`,
      `2. Aplicar as seguintes sanções: ${listaSancoesTexto}`,
      '3. Remeta-se cópia ao(à) MM.(ª) Juiz(íza) de Direito da Vara de Execuções Penais.',
      '4. Arquive-se e registre-se no prontuário do(a) incidentado(a).',
    ];
  }

  return [placeholder('SELECIONE O RESULTADO DA DECISÃO NO FORMULÁRIO')];
}

export function renderizar(pad) {
  const numero = pad.dadosGerais?.numero || placeholder('Nº DO PAD');
  const decisao = pad.decisao ?? {};
  const dataInst = pad.portaria?.dataAssinatura ? dataPorExtenso(pad.portaria.dataAssinatura) : placeholder('DATA DE INSTAURAÇÃO');
  const dataDecisao = decisao.data ? dataPorExtenso(decisao.data) : dataInst;
  const diretor = diretorDaUnidade(pad);

  const relatorio = [
    `Trata-se de Procedimento Administrativo Disciplinar instaurado pela Portaria nº ${numero}, em ${dataInst}, em desfavor do(a) apenado(a) ${nomeIpenIncidentado(pad)}, decorrente do suposto cometimento de infração disciplinar de natureza grave, prevista no ${artigoTextoCompleto(pad)}, cujos fatos supostamente ocorreram em ${dataInfracaoFormatada(pad)}.`,
    ...[].concat(relatorioTestemunhas(pad)),
    relatorioIncidentado(pad),
    relatorioConselho(pad),
    relatorioDefesa(pad),
  ];

  return {
    titulo: 'DECISÃO DA DIREÇÃO',
    subtitulo: `Procedimento Administrativo Disciplinar — PAD Nº ${numero}`,
    secoes: [
      { heading: 'I — RELATÓRIO', conteudo: relatorio },
      { heading: 'II — FUNDAMENTAÇÃO', conteudo: decisao.fundamentacao || placeholder('FUNDAMENTAÇÃO DA DECISÃO — preencha no formulário ou dite por voz') },
      { heading: 'III — DISPOSITIVO', conteudo: dispositivo(pad) },
      { conteudo: `${cidadeDaUnidade(pad)}, ${dataDecisao}.` },
    ],
    assinaturas: [{ nome: diretor.nome, cargo: `${diretor.cargo} — ${diretor.unidade}` }],
  };
}
