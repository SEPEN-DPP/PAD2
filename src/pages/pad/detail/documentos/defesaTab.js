/**
 * Aba "Defesa" (Manifestação da Defesa) — o tipo de defesa (advogado/
 * defensoria) já foi indicado na aba "Termo de Cientificação"; aqui só se
 * registra o texto da manifestação em si (`defesa.texto`).
 */
import { criarElemento, carregarCssUmaVez, criarCard, criarCampo, criarAreaPreview, criarBotaoSalvar, salvarSecaoDoPad } from './_shared.js';
import { renderizar as renderizarManifDefesa } from '../../../../templates/manifestacaoDefesaTemplate.js';
import { textoDefensor } from '../../../../templates/shared/condicionais.js';

export function renderDefesaTab(pad, _configUnidade, { onAtualizar } = {}) {
  carregarCssUmaVez('src/pages/pad/detail/documentos/documentos.css');

  const defesa = pad.defesa ?? {};
  const campoTexto = criarCampo({ rotulo: 'Manifestação da Defesa', multilinha: true, valor: defesa.texto });

  const preview = criarAreaPreview(pad, () => renderizarManifDefesa({ ...pad, defesa: { ...pad.defesa, texto: campoTexto.input.value.trim() } }));
  campoTexto.input.addEventListener('input', preview.atualizar);

  const botaoSalvar = criarBotaoSalvar(async () => {
    await salvarSecaoDoPad(
      pad,
      { defesa: { ...pad.defesa, texto: campoTexto.input.value.trim() } },
      { etapa: 'MANIFESTACAO_DEFESA', jaTinhaEtapa: Boolean(pad.defesa?.texto) },
    );
    preview.atualizar();
    onAtualizar?.();
  });

  const formulario = criarCard({
    titulo: 'Manifestação da Defesa',
    filhos: [
      criarElemento('p', { class: 'text-muted' }, [`Defensor(a): ${textoDefensor(defesa)} (indicado no Termo de Cientificação).`]),
      campoTexto.elemento,
      criarElemento('div', { class: 'documentos__acoes' }, [botaoSalvar]),
    ],
  });

  return criarElemento('div', { class: 'documentos__aba' }, [formulario, preview.elemento]);
}
