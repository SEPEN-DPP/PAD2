/**
 * Aba "Termo de Cientificação" — é aqui que o tipo de defesa (advogado
 * constituído ou defensoria pública) é indicado, e por isso é gravado
 * direto em `pad.defesa.{tipo,advogadoNome,advogadoOab}` — a mesma fonte
 * usada depois por Declarações do Apenado, Manifestação da Defesa e Decisão
 * (ver src/templates/shared/condicionais.js:textoDefensor).
 */
import { criarElemento, carregarCssUmaVez, criarCampo, criarCampoSelect, criarAreaPreview, criarBotaoSalvar, criarCardEditavel, salvarSecaoDoPad } from './_shared.js';
import { renderizar as renderizarTermo } from '../../../../templates/termoCientificacaoTemplate.js';

const OPCOES_DEFESA = [
  { valor: '', rotulo: 'Ainda não indicado' },
  { valor: 'advogado', rotulo: 'Advogado constituído' },
  { valor: 'defensoria', rotulo: 'Defensoria Pública' },
];

export function renderTermoCientificacaoTab(pad, _configUnidade, { onAtualizar } = {}) {
  carregarCssUmaVez('src/pages/pad/detail/documentos/documentos.css');

  const defesaAtual = pad.defesa ?? {};

  const campoTipo = criarCampoSelect({ rotulo: 'Tipo de defesa indicado', valor: defesaAtual.tipo ?? '', opcoes: OPCOES_DEFESA });
  const campoAdvogadoNome = criarCampo({ rotulo: 'Nome do advogado', valor: defesaAtual.advogadoNome });
  const campoAdvogadoOab = criarCampo({ rotulo: 'OAB', valor: defesaAtual.advogadoOab });
  const campoObservacoes = criarCampo({ rotulo: 'Observações (opcional)', multilinha: true, valor: pad.termoCientificacao?.observacoes });

  const camposAdvogado = criarElemento('div', { class: 'documentos__campos' }, [campoAdvogadoNome.elemento, campoAdvogadoOab.elemento]);

  function atualizarVisibilidadeAdvogado() {
    camposAdvogado.style.display = campoTipo.input.value === 'advogado' ? '' : 'none';
  }
  atualizarVisibilidadeAdvogado();
  campoTipo.input.addEventListener('change', atualizarVisibilidadeAdvogado);

  function lerFormulario() {
    return {
      tipo: campoTipo.input.value || null,
      advogadoNome: campoTipo.input.value === 'advogado' ? campoAdvogadoNome.input.value.trim() : '',
      advogadoOab: campoTipo.input.value === 'advogado' ? campoAdvogadoOab.input.value.trim() : '',
    };
  }

  function padComFormulario() {
    return {
      ...pad,
      defesa: { ...pad.defesa, ...lerFormulario() },
      termoCientificacao: { observacoes: campoObservacoes.input.value.trim() },
    };
  }

  const preview = criarAreaPreview(pad, () => renderizarTermo(padComFormulario()));

  [campoTipo, campoAdvogadoNome, campoAdvogadoOab, campoObservacoes].forEach((campo) => {
    campo.input.addEventListener('input', preview.atualizar);
    campo.input.addEventListener('change', preview.atualizar);
  });

  const secao = criarCardEditavel({
    titulo: 'Termo de Cientificação',
    corpo: [
      criarElemento('div', { class: 'documentos__campos' }, [campoTipo.elemento]),
      camposAdvogado,
      campoObservacoes.elemento,
    ],
  });

  const botaoSalvar = criarBotaoSalvar(
    async () => {
      await salvarSecaoDoPad(
        pad,
        { defesa: { ...pad.defesa, ...lerFormulario() }, termoCientificacao: { observacoes: campoObservacoes.input.value.trim() } },
        { etapa: 'TERMO_CIENTIFICACAO', jaTinhaEtapa: Boolean(pad.termoCientificacao) },
      );
      preview.atualizar();
      onAtualizar?.();
    },
    { aposSalvar: secao.esconder },
  );
  secao.areaCorpo.append(criarElemento('div', { class: 'documentos__acoes' }, [botaoSalvar]));

  return criarElemento('div', { class: 'documentos__aba' }, [secao.elemento, preview.elemento]);
}
