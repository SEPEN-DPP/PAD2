/**
 * Aba "Conselho" (Manifestação do Conselho Disciplinar) — só a manifestação
 * em si (`conselho.conclusao/fundamento/desclass*`); a composição do
 * Conselho (Presidente/Membros) é designada na aba "Portaria" e só exibida
 * aqui como contexto, não editável.
 */
import { criarElemento, carregarCssUmaVez, criarCampoComDitado, criarCampoSelect, criarAreaPreview, criarBotaoSalvar, criarCardEditavel, criarAnexoSubstitutoPersistido, aplicarAnexoSubstituto, salvarSecaoDoPad, criarBotaoConfirmar } from './_shared.js';
import { renderizar as renderizarManifestacao } from '../../../../templates/manifestacaoConselhoTemplate.js';
import { integrantesConselho } from '../../../../templates/shared/condicionais.js';
import { obterIncisosDesclassificacao } from '../../../../config/baseLegal.js';

const OPCOES_CONCLUSAO = [
  { valor: '', rotulo: 'Selecione...' },
  { valor: 'procedencia', rotulo: 'Procedência (falta grave confirmada)' },
  { valor: 'improcedencia', rotulo: 'Improcedência (arquivamento)' },
  { valor: 'desclassificacao', rotulo: 'Desclassificação (falta leve/média)' },
];

const OPCOES_GRAU = [
  { valor: 'leve', rotulo: 'Falta leve — Art. 95, LC 529/2011' },
  { valor: 'media', rotulo: 'Falta média — Art. 96, LC 529/2011' },
];

export function renderConselhoTab(pad, configUnidade, { onAtualizar } = {}) {
  carregarCssUmaVez('src/pages/pad/detail/documentos/documentos.css');

  const atual = pad.conselho ?? {};
  const integrantes = integrantesConselho(pad, configUnidade);

  const campoConclusao = criarCampoSelect({ rotulo: 'Conclusão do Conselho', valor: atual.conclusao ?? '', opcoes: OPCOES_CONCLUSAO });
  const campoFundamento = criarCampoComDitado({ rotulo: 'Fundamentação complementar (opcional)', valor: atual.fundamento });
  const campoGrau = criarCampoSelect({ rotulo: 'Grau da desclassificação', valor: atual.desclassGrau ?? 'leve', opcoes: OPCOES_GRAU });

  const areaIncisos = criarElemento('div', { class: 'documentos__incisos' });
  const areaDesclassificacao = criarElemento('div', { class: 'documentos__campos' }, [campoGrau.elemento, areaIncisos]);

  const checkboxesPorGrau = {};

  function montarCheckboxesIncisos(grau) {
    if (!checkboxesPorGrau[grau]) {
      const incisos = obterIncisosDesclassificacao(grau);
      checkboxesPorGrau[grau] = incisos.map((inciso) => {
        const checkbox = criarElemento('input', { type: 'checkbox', value: inciso.cod });
        if ((atual.desclassGrau === grau ? atual.desclassIncisos : []).includes(inciso.cod)) checkbox.checked = true;
        checkbox.addEventListener('change', () => preview.atualizar());
        return {
          checkbox,
          elemento: criarElemento('label', { class: 'documentos__inciso' }, [checkbox, `${inciso.label} — ${inciso.texto}`]),
        };
      });
    }
    return checkboxesPorGrau[grau];
  }

  function atualizarIncisosVisiveis() {
    areaIncisos.replaceChildren(...montarCheckboxesIncisos(campoGrau.input.value).map((c) => c.elemento));
  }
  atualizarIncisosVisiveis();
  campoGrau.input.addEventListener('change', () => {
    atualizarIncisosVisiveis();
    preview.atualizar();
  });

  function atualizarVisibilidadeDesclassificacao() {
    areaDesclassificacao.style.display = campoConclusao.input.value === 'desclassificacao' ? '' : 'none';
  }
  atualizarVisibilidadeDesclassificacao();
  campoConclusao.input.addEventListener('change', () => {
    atualizarVisibilidadeDesclassificacao();
    preview.atualizar();
  });

  function incisosSelecionados() {
    return montarCheckboxesIncisos(campoGrau.input.value).filter((c) => c.checkbox.checked).map((c) => c.checkbox.value);
  }

  function lerFormulario() {
    return {
      ...pad.conselho,
      conclusao: campoConclusao.input.value || null,
      fundamento: campoFundamento.input.value.trim(),
      desclassGrau: campoConclusao.input.value === 'desclassificacao' ? campoGrau.input.value : null,
      desclassIncisos: campoConclusao.input.value === 'desclassificacao' ? incisosSelecionados() : [],
    };
  }

  const anexoSubstituto = criarAnexoSubstitutoPersistido({ valorInicial: pad.conselho?.anexoPersistido ?? null, onMudar: () => preview.atualizar() });

  const preview = criarAreaPreview(pad, () => aplicarAnexoSubstituto(
    renderizarManifestacao({ ...pad, conselho: lerFormulario() }, configUnidade),
    anexoSubstituto.obterAnexo(),
  ));
  campoFundamento.input.addEventListener('input', preview.atualizar);

  const secao = criarCardEditavel({
    titulo: 'Manifestação do Conselho Disciplinar',
    corpo: [
      criarElemento('p', { class: 'text-muted' }, [
        `Conselho designado na Portaria — Presidente: ${integrantes.presidente}; Membro 1: ${integrantes.membro1}; Membro 2: ${integrantes.membro2}.`,
      ]),
      criarElemento('div', { class: 'documentos__campos' }, [campoConclusao.elemento]),
      areaDesclassificacao,
      campoFundamento.elemento,
      anexoSubstituto.elemento,
    ],
  });
  secao.elemento.querySelector('.card__acoes')?.append(criarBotaoConfirmar(pad, 'conselho', { onAtualizar }));

  const botaoSalvar = criarBotaoSalvar(
    async () => {
      await salvarSecaoDoPad(
        pad,
        { conselho: { ...lerFormulario(), anexoPersistido: anexoSubstituto.obterAnexo() } },
        { etapa: 'MANIFESTACAO_CONSELHO', jaTinhaEtapa: Boolean(pad.conselho?.conclusao), chaveConfirmacao: 'conselho' },
      );
      preview.atualizar();
      onAtualizar?.();
    },
    { aposSalvar: secao.esconder },
  );
  secao.areaCorpo.append(criarElemento('div', { class: 'documentos__acoes' }, [botaoSalvar]));

  return criarElemento('div', { class: 'documentos__aba' }, [secao.elemento, preview.elemento]);
}
