/**
 * Aba "Defesa" (Manifestação da Defesa) — o tipo de defesa (advogado/
 * defensoria) já foi indicado na aba "Termo de Cientificação"; aqui só se
 * registra o texto da manifestação em si (`defesa.texto`).
 */
import { criarElemento, carregarCssUmaVez, criarCampo, criarAreaPreview, criarBotaoSalvar, criarCardEditavel, salvarSecaoDoPad } from './_shared.js';
import { renderizar as renderizarManifDefesa } from '../../../../templates/manifestacaoDefesaTemplate.js';
import { textoDefensor } from '../../../../templates/shared/condicionais.js';

export function renderDefesaTab(pad, _configUnidade, { onAtualizar } = {}) {
  carregarCssUmaVez('src/pages/pad/detail/documentos/documentos.css');

  const defesa = pad.defesa ?? {};
  const campoTexto = criarCampo({ rotulo: 'Manifestação da Defesa', multilinha: true, valor: defesa.texto });

  const preview = criarAreaPreview(pad, () => renderizarManifDefesa({ ...pad, defesa: { ...pad.defesa, texto: campoTexto.input.value.trim() } }));
  campoTexto.input.addEventListener('input', preview.atualizar);

  const secao = criarCardEditavel({
    titulo: 'Manifestação da Defesa',
    corpo: [
      criarElemento('p', { class: 'text-muted' }, [`Defensor(a): ${textoDefensor(defesa)} (indicado no Termo de Cientificação).`]),
      campoTexto.elemento,
    ],
  });

  const botaoSalvar = criarBotaoSalvar(
    async () => {
      await salvarSecaoDoPad(
        pad,
        { defesa: { ...pad.defesa, texto: campoTexto.input.value.trim() } },
        { etapa: 'MANIFESTACAO_DEFESA', jaTinhaEtapa: Boolean(pad.defesa?.texto) },
      );
      preview.atualizar();
      onAtualizar?.();
    },
    { aposSalvar: secao.esconder },
  );
  secao.areaCorpo.append(criarElemento('div', { class: 'documentos__acoes' }, [botaoSalvar]));

  return criarElemento('div', { class: 'documentos__aba' }, [secao.elemento, preview.elemento]);
}
