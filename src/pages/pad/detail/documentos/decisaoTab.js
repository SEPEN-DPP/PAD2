/**
 * Aba "Decisão" (Decisão da Direção) — `decisao.resultado` decide qual
 * sub-formulário aparece: desclassificação (grau + incisos, como no
 * Conselho) ou falta grave (sanções a aplicar).
 */
import { criarElemento, carregarCssUmaVez, criarCampo, criarCampoComDitado, criarCampoSelect, criarAreaPreview, criarBotaoSalvar, criarCardEditavel, criarSecaoRetratil, criarAnexoSubstitutoPersistido, aplicarAnexoSubstituto, salvarSecaoDoPad, paraValorInputDate } from './_shared.js';
import { renderizar as renderizarDecisao } from '../../../../templates/decisaoTemplate.js';
import { obterIncisosDesclassificacao, SANCOES_FALTA_GRAVE } from '../../../../config/baseLegal.js';
import { sintetizarTexto } from '../../../../utils/stringUtils.js';

const OPCOES_RESULTADO = [
  { valor: '', rotulo: 'Selecione...' },
  { valor: 'absolvicao', rotulo: 'Absolvição (acolhe improcedência)' },
  { valor: 'desclassificacao', rotulo: 'Desclassificação (falta leve/média)' },
  { valor: 'falta_grave', rotulo: 'Falta grave (aplicar sanções)' },
];

const OPCOES_GRAU = [
  { valor: 'leve', rotulo: 'Falta leve — Art. 95, LC 529/2011' },
  { valor: 'media', rotulo: 'Falta média — Art. 96, LC 529/2011' },
];

const OPCOES_MODALIDADE_REMICAO = [
  { valor: 'dias', rotulo: 'Quantidade de dias' },
  { valor: 'fracao', rotulo: 'Fração (ex.: 1/3)' },
];

export function renderDecisaoTab(pad, _configUnidade, { onAtualizar } = {}) {
  carregarCssUmaVez('src/pages/pad/detail/documentos/documentos.css');

  const atual = pad.decisao ?? {};
  const sancoesAtuais = atual.sancoes ?? {};

  const campoDataAudiencia = criarCampo({ rotulo: 'Data da audiência', tipo: 'date', valor: paraValorInputDate(atual.dataAudiencia) });
  const campoResultado = criarCampoSelect({ rotulo: 'Resultado da Decisão', valor: atual.resultado ?? '', opcoes: OPCOES_RESULTADO });
  const campoFundamentacao = criarCampoComDitado({ rotulo: 'Fundamentação', valor: atual.fundamentacao });

  // Síntese escrita pelo Diretor aqui na Decisão (2026-07-20/21) — não mais
  // extraída automaticamente do texto integral das abas Testemunhas,
  // Depoimento Incidentado, Conselho e Defesa. Pré-preenchida com um
  // rascunho (resumo simples do texto integral, se ainda não houver
  // síntese salva) só como ponto de partida — o texto que entra no
  // Relatório é sempre este campo, nunca o texto integral direto.
  const sintesesTestemunhasAtuais = atual.sintesesTestemunhas ?? {};
  const camposSinteseTestemunhas = (pad.testemunhas ?? []).map((t) => ({
    id: t.id,
    nome: t.nome,
    campo: criarCampoComDitado({
      rotulo: `Síntese do depoimento de ${t.nome || 'testemunha'} (embasa o Relatório da Decisão)`,
      valor: sintesesTestemunhasAtuais[t.id] || t.sintese || sintetizarTexto(t.depoimento),
    }),
  }));

  const incidentadoDecisao = pad.incidentados?.[0];
  const declaracaoIncidentado = pad.declaracoesApenado?.[0];
  const sintesesIncidentadosAtuais = atual.sintesesIncidentados ?? {};
  const campoSinteseIncidentado = incidentadoDecisao && declaracaoIncidentado && !declaracaoIncidentado.silencio
    ? criarCampoComDitado({
        rotulo: `Síntese da declaração de ${incidentadoDecisao.nomeCompleto || 'incidentado'} (embasa o Relatório da Decisão)`,
        valor: sintesesIncidentadosAtuais[incidentadoDecisao.id] || declaracaoIncidentado.sintese || sintetizarTexto(declaracaoIncidentado.versaoIncidentado),
      })
    : null;

  const campoSinteseConselho = criarCampoComDitado({
    rotulo: 'Síntese da Manifestação do Conselho (embasa o Relatório da Decisão — escreva com suas palavras)',
    valor: atual.sinteseConselho || sintetizarTexto(pad.conselho?.fundamento),
  });
  const campoSinteseDefesa = criarCampoComDitado({
    rotulo: 'Síntese da Manifestação da Defesa (embasa o Relatório da Decisão — escreva com suas palavras)',
    valor: atual.sinteseDefesa || sintetizarTexto(pad.defesa?.texto),
  });

  // Desclassificação
  const campoGrau = criarCampoSelect({ rotulo: 'Grau da desclassificação', valor: atual.desclassGrau ?? 'leve', opcoes: OPCOES_GRAU });
  const areaIncisos = criarElemento('div', { class: 'documentos__incisos' });
  const areaDesclassificacao = criarElemento('div', { class: 'documentos__campos' }, [campoGrau.elemento, areaIncisos]);
  const checkboxesPorGrau = {};
  function montarCheckboxesIncisos(grau) {
    if (!checkboxesPorGrau[grau]) {
      checkboxesPorGrau[grau] = obterIncisosDesclassificacao(grau).map((inciso) => {
        const checkbox = criarElemento('input', { type: 'checkbox', value: inciso.cod });
        if ((atual.desclassGrau === grau ? atual.desclassIncisos : []).includes(inciso.cod)) checkbox.checked = true;
        checkbox.addEventListener('change', () => preview.atualizar());
        return { checkbox, elemento: criarElemento('label', { class: 'documentos__inciso' }, [checkbox, `${inciso.label} — ${inciso.texto}`]) };
      });
    }
    return checkboxesPorGrau[grau];
  }
  function atualizarIncisosVisiveis() {
    areaIncisos.replaceChildren(...montarCheckboxesIncisos(campoGrau.input.value).map((c) => c.elemento));
  }
  atualizarIncisosVisiveis();
  campoGrau.input.addEventListener('change', () => { atualizarIncisosVisiveis(); preview.atualizar(); });

  // Falta grave — sanções
  const checkboxSancoes = {};
  const areaSancoes = criarElemento('div', { class: 'documentos__incisos' });
  for (const sancao of SANCOES_FALTA_GRAVE) {
    if (sancao.cod === 'perdaRemicao') continue; // tem sub-campos próprios, tratado à parte
    const checkbox = criarElemento('input', { type: 'checkbox' });
    checkbox.checked = Boolean(sancoesAtuais[sancao.cod]);
    checkbox.addEventListener('change', () => preview.atualizar());
    checkboxSancoes[sancao.cod] = checkbox;
    areaSancoes.append(criarElemento('label', { class: 'documentos__inciso' }, [checkbox, `${sancao.label} (${sancao.lei})`]));
  }
  const checkboxPerdaRemicao = criarElemento('input', { type: 'checkbox' });
  checkboxPerdaRemicao.checked = Boolean(sancoesAtuais.perdaRemicao?.ativo);
  const campoValorRemicao = criarCampo({ rotulo: 'Valor (ex.: 15 ou 1/3)', valor: sancoesAtuais.perdaRemicao?.valor });
  const campoModalidadeRemicao = criarCampoSelect({ rotulo: 'Modalidade', valor: sancoesAtuais.perdaRemicao?.modalidade ?? 'dias', opcoes: OPCOES_MODALIDADE_REMICAO });
  checkboxPerdaRemicao.addEventListener('change', () => preview.atualizar());
  [campoValorRemicao, campoModalidadeRemicao].forEach((c) => c.input.addEventListener('input', () => preview.atualizar()));
  areaSancoes.append(
    criarElemento('label', { class: 'documentos__inciso' }, [checkboxPerdaRemicao, 'Perda de dias remidos (art. 127 da LEP)']),
    criarElemento('div', { class: 'documentos__campos' }, [campoValorRemicao.elemento, campoModalidadeRemicao.elemento]),
  );
  const areaFaltaGrave = criarElemento('div', {}, [areaSancoes]);

  function atualizarVisibilidade() {
    areaDesclassificacao.style.display = campoResultado.input.value === 'desclassificacao' ? '' : 'none';
    areaFaltaGrave.style.display = campoResultado.input.value === 'falta_grave' ? '' : 'none';
  }
  atualizarVisibilidade();
  campoResultado.input.addEventListener('change', () => { atualizarVisibilidade(); preview.atualizar(); });

  function lerFormulario() {
    const resultado = campoResultado.input.value || null;
    return {
      ...pad.decisao,
      resultado,
      dataAudiencia: campoDataAudiencia.input.value ? new Date(`${campoDataAudiencia.input.value}T00:00:00`) : null,
      fundamentacao: campoFundamentacao.input.value.trim(),
      sinteseConselho: campoSinteseConselho.input.value.trim(),
      sinteseDefesa: campoSinteseDefesa.input.value.trim(),
      sintesesTestemunhas: Object.fromEntries(camposSinteseTestemunhas.map((c) => [c.id, c.campo.input.value.trim()])),
      sintesesIncidentados: campoSinteseIncidentado && incidentadoDecisao
        ? { ...atual.sintesesIncidentados, [incidentadoDecisao.id]: campoSinteseIncidentado.input.value.trim() }
        : (atual.sintesesIncidentados ?? {}),
      desclassGrau: resultado === 'desclassificacao' ? campoGrau.input.value : null,
      desclassIncisos: resultado === 'desclassificacao'
        ? montarCheckboxesIncisos(campoGrau.input.value).filter((c) => c.checkbox.checked).map((c) => c.checkbox.value)
        : [],
      sancoes: resultado === 'falta_grave'
        ? {
          regressaoRegime: checkboxSancoes.regressaoRegime?.checked ?? false,
          interrupcaoProgressao: checkboxSancoes.interrupcaoProgressao?.checked ?? false,
          perdaRemicao: { ativo: checkboxPerdaRemicao.checked, valor: campoValorRemicao.input.value.trim(), modalidade: campoModalidadeRemicao.input.value },
          revogacaoSaidaTemp: checkboxSancoes.revogacaoSaidaTemp?.checked ?? false,
          revogacaoTrabalhoExt: checkboxSancoes.revogacaoTrabalhoExt?.checked ?? false,
        }
        : {},
    };
  }

  const anexoSubstituto = criarAnexoSubstitutoPersistido({ valorInicial: pad.decisao?.anexoPersistido ?? null, onMudar: () => preview.atualizar() });

  const preview = criarAreaPreview(pad, () => aplicarAnexoSubstituto(
    renderizarDecisao({ ...pad, decisao: lerFormulario() }),
    anexoSubstituto.obterAnexo(),
  ));
  [
    campoDataAudiencia,
    campoFundamentacao,
    campoSinteseConselho,
    campoSinteseDefesa,
    ...camposSinteseTestemunhas.map((c) => c.campo),
    ...(campoSinteseIncidentado ? [campoSinteseIncidentado] : []),
  ].forEach((campo) => campo.input.addEventListener('input', preview.atualizar));

  // Cada síntese/fundamentação nasce recolhida ("cascata") — só o campo de
  // data da audiência e o Resultado (sempre por último, com seus
  // sub-formulários) ficam sempre visíveis (2026-07-21).
  const secao = criarCardEditavel({
    titulo: 'Decisão da Direção',
    corpo: [
      criarElemento('div', { class: 'documentos__campos' }, [campoDataAudiencia.elemento]),
      ...camposSinteseTestemunhas.map((c) => criarSecaoRetratil(`Síntese do depoimento — ${c.nome || 'testemunha'}`, [c.campo.elemento])),
      campoSinteseIncidentado ? criarSecaoRetratil('Síntese da declaração do incidentado', [campoSinteseIncidentado.elemento]) : null,
      criarSecaoRetratil('Síntese da Manifestação do Conselho', [campoSinteseConselho.elemento]),
      criarSecaoRetratil('Síntese da Manifestação da Defesa', [campoSinteseDefesa.elemento]),
      criarSecaoRetratil('Fundamentação', [campoFundamentacao.elemento]),
      criarElemento('div', { class: 'documentos__campos' }, [campoResultado.elemento]),
      areaDesclassificacao,
      areaFaltaGrave,
      anexoSubstituto.elemento,
    ].filter(Boolean),
  });

  const botaoSalvar = criarBotaoSalvar(
    async () => {
      await salvarSecaoDoPad(
        pad,
        { decisao: { ...lerFormulario(), anexoPersistido: anexoSubstituto.obterAnexo() } },
        { etapa: 'DECISAO_FINAL', jaTinhaEtapa: Boolean(pad.decisao?.resultado), chaveConfirmacao: 'decisao' },
      );
      preview.atualizar();
      onAtualizar?.();
    },
    { aposSalvar: secao.esconder },
  );
  secao.areaCorpo.append(criarElemento('div', { class: 'documentos__acoes' }, [botaoSalvar]));

  return criarElemento('div', { class: 'documentos__aba' }, [secao.elemento, preview.elemento]);
}
