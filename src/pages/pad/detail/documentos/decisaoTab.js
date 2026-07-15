/**
 * Aba "Decisão" (Decisão da Direção) — `decisao.resultado` decide qual
 * sub-formulário aparece: desclassificação (grau + incisos, como no
 * Conselho) ou falta grave (sanções a aplicar).
 */
import { criarElemento, carregarCssUmaVez, criarCard, criarCampo, criarCampoSelect, criarAreaPreview, criarBotaoSalvar, salvarSecaoDoPad } from './_shared.js';
import { renderizar as renderizarDecisao } from '../../../../templates/decisaoTemplate.js';
import { obterIncisosDesclassificacao, SANCOES_FALTA_GRAVE } from '../../../../config/baseLegal.js';

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

  const campoResultado = criarCampoSelect({ rotulo: 'Resultado da Decisão', valor: atual.resultado ?? '', opcoes: OPCOES_RESULTADO });
  const campoFundamentacao = criarCampo({ rotulo: 'Fundamentação', multilinha: true, valor: atual.fundamentacao });

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
      fundamentacao: campoFundamentacao.input.value.trim(),
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

  const preview = criarAreaPreview(pad, () => renderizarDecisao({ ...pad, decisao: lerFormulario() }));
  campoFundamentacao.input.addEventListener('input', preview.atualizar);

  const botaoSalvar = criarBotaoSalvar(async () => {
    await salvarSecaoDoPad(pad, { decisao: lerFormulario() }, { etapa: 'DECISAO_FINAL', jaTinhaEtapa: Boolean(pad.decisao?.resultado) });
    preview.atualizar();
    onAtualizar?.();
  });

  const formulario = criarCard({
    titulo: 'Decisão da Direção',
    filhos: [
      criarElemento('div', { class: 'documentos__campos' }, [campoResultado.elemento]),
      areaDesclassificacao,
      areaFaltaGrave,
      campoFundamentacao.elemento,
      criarElemento('div', { class: 'documentos__acoes' }, [botaoSalvar]),
    ],
  });

  return criarElemento('div', { class: 'documentos__aba' }, [formulario, preview.elemento]);
}
