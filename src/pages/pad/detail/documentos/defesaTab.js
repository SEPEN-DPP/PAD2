/**
 * Aba "Defesa" (Manifestação da Defesa) — o tipo de defesa (advogado/
 * defensoria) já foi indicado na aba "Termo de Cientificação"; aqui só se
 * registra o texto da manifestação em si (`defesa.texto`), ditado por voz ou
 * substituído por upload de PDF (o documento exportado nunca leva
 * cabeçalho institucional — ver manifestacaoDefesaTemplate.js).
 */
import { criarElemento, carregarCssUmaVez, criarCampoComDitado, criarAreaPreview, criarBotaoSalvar, criarCardEditavel, criarAnexoSubstituto, aplicarAnexoSubstituto, salvarSecaoDoPad, criarBotaoConfirmar } from './_shared.js';
import { renderizar as renderizarManifDefesa } from '../../../../templates/manifestacaoDefesaTemplate.js';
import { textoDefensor } from '../../../../templates/shared/condicionais.js';

export function renderDefesaTab(pad, _configUnidade, { onAtualizar } = {}) {
  carregarCssUmaVez('src/pages/pad/detail/documentos/documentos.css');

  const defesa = pad.defesa ?? {};
  const campoTexto = criarCampoComDitado({ rotulo: 'Manifestação da Defesa', valor: defesa.texto });
  const anexoSubstituto = criarAnexoSubstituto({ onMudar: () => preview.atualizar() });

  const preview = criarAreaPreview(pad, () => aplicarAnexoSubstituto(
    renderizarManifDefesa({ ...pad, defesa: { ...pad.defesa, texto: campoTexto.input.value.trim() } }),
    anexoSubstituto.obterAnexo(),
  ));
  campoTexto.input.addEventListener('input', preview.atualizar);

  const secao = criarCardEditavel({
    titulo: 'Manifestação da Defesa',
    corpo: [
      criarElemento('p', { class: 'text-muted' }, [`Defensor(a): ${textoDefensor(defesa)} (indicado no Termo de Cientificação).`]),
      campoTexto.elemento,
      anexoSubstituto.elemento,
    ],
  });
  secao.elemento.querySelector('.card__acoes')?.append(criarBotaoConfirmar(pad, 'defesa', { onAtualizar }));

  const botaoSalvar = criarBotaoSalvar(
    async () => {
      await salvarSecaoDoPad(
        pad,
        { defesa: { ...pad.defesa, texto: campoTexto.input.value.trim() } },
        { etapa: 'MANIFESTACAO_DEFESA', jaTinhaEtapa: Boolean(pad.defesa?.texto), chaveConfirmacao: 'defesa' },
      );
      preview.atualizar();
      onAtualizar?.();
    },
    { aposSalvar: secao.esconder },
  );
  secao.areaCorpo.append(criarElemento('div', { class: 'documentos__acoes' }, [botaoSalvar]));

  return criarElemento('div', { class: 'documentos__aba' }, [secao.elemento, preview.elemento]);
}
