/**
 * Helpers de texto condicional compartilhados pelos 10 templates de
 * documento do PAD — nenhuma lógica de fluxo/aprovação aqui, só montagem de
 * frases a partir dos dados já gravados no PAD (ver src/templates/README.md).
 */
import { obterArtigoLep, obterIncisosDesclassificacao, ARTIGOS_LC_529_2011 } from '../../config/baseLegal.js';
import { obterUnidadePorNome } from '../../config/unidadesPrisionais.js';

const ph = (rotulo) => `‹${rotulo}›`;

/**
 * "NOME – IPEN Nº X" para o único incidentado do PAD, ou "NOME1 – IPEN Nº
 * X1 e NOME2 – IPEN Nº X2" quando houver mais de um (ver
 * src/pages/pad/detail/documentos/incidentadosTab.js) — os demais
 * documentos (Portaria, Termo, Conselho, Decisão, Ofícios) tratam o PAD
 * como um todo, não incidentado a incidentado.
 */
export function nomeIpenIncidentado(pad) {
  const incidentados = pad.incidentados?.length ? pad.incidentados : [{}];
  const nomes = incidentados.map((incidentado) => {
    const nome = incidentado.nomeCompleto || ph('NOME DO INCIDENTADO');
    const ipen = incidentado.ipen || ph('PRONTUÁRIO');
    return `${nome} – IPEN Nº ${ipen}`;
  });
  if (nomes.length === 1) return nomes[0];
  const ultimo = nomes.pop();
  return `${nomes.join(', ')} e ${ultimo}`;
}

export function dataInfracaoFormatada(pad) {
  return pad.infracao?.data || ph('DATA DA INFRAÇÃO');
}

export function descricaoDosFatos(pad) {
  return pad.infracao?.descricaoFatos || ph('DESCRIÇÃO DOS FATOS');
}

export function artigoTextoCompleto(pad) {
  const artigo = obterArtigoLep(pad.infracao?.artigoLep?.codigo);
  return artigo ? `${artigo.label} — ${artigo.texto}` : ph('ARTIGO DA LEP');
}

export function artigoRotulo(pad) {
  return pad.infracao?.artigoLep?.rotulo || ph('ARTIGO');
}

export function cidadeDaUnidade(pad) {
  return obterUnidadePorNome(pad.dadosGerais?.unidade)?.cidade || 'Florianópolis';
}

function formatarPessoa(pessoa, rotulo) {
  const nome = pessoa?.nome || ph(rotulo);
  return pessoa?.matricula ? `${nome} – Mat. ${pessoa.matricula}` : nome;
}

/** Integrantes do Conselho já gravados no PAD; cai para a config da unidade se o PAD ainda não tiver. */
export function integrantesConselho(pad, configUnidade) {
  const c = pad.conselho?.integrantes ?? configUnidade?.conselho ?? {};
  return {
    presidente: formatarPessoa(c.presidente, 'PRESIDENTE'),
    membro1: formatarPessoa(c.membro1, 'MEMBRO 1'),
    membro2: formatarPessoa(c.membro2, 'MEMBRO 2'),
  };
}

/**
 * Defensor público (2026-07-20) agora também é selecionado nominalmente da
 * Relação de Advogados e Defensores Públicos (ver termoCientificacaoTab.js),
 * então mostra o nome da pessoa quando disponível — cai para o texto
 * institucional genérico só em PADs antigos, de antes dessa mudança, onde
 * só o tipo "defensoria" foi indicado, sem defensor nominal.
 * @param {{ tipo: 'advogado'|'defensoria'|null, advogadoNome?: string, advogadoOab?: string }} defesa
 */
export function textoDefensor(defesa) {
  if (defesa?.tipo === 'defensoria') {
    if (!defesa.advogadoNome) return 'Defensoria Pública do Estado de Santa Catarina';
    return defesa.advogadoOab ? `${defesa.advogadoNome}, Defensor(a) Público(a), OAB nº ${defesa.advogadoOab}` : `${defesa.advogadoNome}, Defensor(a) Público(a)`;
  }
  if (defesa?.tipo === 'advogado') {
    const nome = defesa.advogadoNome || ph('ADVOGADO');
    return defesa.advogadoOab ? `${nome}, OAB nº ${defesa.advogadoOab}` : nome;
  }
  return 'sem assistência de defensor';
}

export function diretorDaUnidade(pad, configUnidade) {
  const d = pad.portaria?.autoridadeSignataria ?? configUnidade?.diretor ?? {};
  return {
    nome: d.nome || ph('DIRETOR(A)'),
    cargo: d.cargo || 'Diretor(a)',
    unidade: pad.dadosGerais?.unidade || ph('UNIDADE'),
  };
}

/** Artigo da LC 529/2011 correspondente ao grau ('leve'|'media') de desclassificação. */
export function artigoDesclassificacao(grau) {
  return ARTIGOS_LC_529_2011.find((artigo) => artigo.grau === grau) ?? null;
}

/** Monta "especificamente o inciso X (texto)" ou "...os incisos X, Y e Z" (sem texto quando há mais de um). */
export function textoIncisosDesclassificacao(grau, codigos) {
  const incisos = obterIncisosDesclassificacao(grau);
  const selecionados = (codigos ?? []).map((cod) => incisos.find((i) => i.cod === cod)).filter(Boolean);
  if (!selecionados.length) return '';
  if (selecionados.length === 1) {
    const unico = selecionados[0];
    return `especificamente o inciso ${unico.label} (${unico.texto})`;
  }
  const rotulos = selecionados.map((i) => i.label);
  const ultimo = rotulos.pop();
  return `especificamente os incisos ${rotulos.join(', ')} e ${ultimo}`;
}

/** Monta a lista (em texto corrido) das sanções marcadas em `decisao.sancoes`. */
export function listaSancoes(sancoes) {
  if (!sancoes) return [];
  const lista = [];
  if (sancoes.regressaoRegime) lista.push('regressão do regime de execução penal, nos termos do art. 118, I, da LEP');
  if (sancoes.interrupcaoProgressao) lista.push('interrupção da contagem do prazo para progressão de regime, nos termos do art. 112, § 6º, da LEP');
  if (sancoes.perdaRemicao?.ativo) {
    const valor = sancoes.perdaRemicao.valor || ph('VALOR');
    const texto = sancoes.perdaRemicao.modalidade === 'fracao' ? `${valor} dos dias remidos` : `${valor} (dias) remidos`;
    lista.push(`perda de ${texto}, nos termos do art. 127 da LEP`);
  }
  if (sancoes.revogacaoSaidaTemp) lista.push('revogação da saída temporária, nos termos do art. 125 da LEP');
  if (sancoes.revogacaoTrabalhoExt) lista.push('revogação do trabalho externo, nos termos do art. 123 da LEP');
  return lista;
}

export { ph as placeholder };
