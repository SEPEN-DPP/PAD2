/**
 * Aba "Ofícios" — reúne Ofício ao Juiz e Ofício de Encaminhamento à VEP
 * (estruturalmente simétricos: só número + data). O Ofício à VEP existia no
 * código da V1 mas nunca era acessível na tela — aqui é um documento real.
 */
import { criarElemento, carregarCssUmaVez, criarCard, criarCampo, criarAreaPreview, criarBotaoSalvar, salvarSecaoDoPad, paraValorInputDate } from './_shared.js';
import { renderizar as renderizarOficioJuizo } from '../../../../templates/oficioJuizoTemplate.js';
import { renderizar as renderizarOficioVep } from '../../../../templates/oficioVepTemplate.js';

function montarSecaoOficio({ pad, titulo, chave, etapa, renderizarTemplate, onAtualizar }) {
  const atual = pad[chave] ?? {};
  const campoNumero = criarCampo({ rotulo: 'Número do ofício', valor: atual.numero });
  const campoData = criarCampo({ rotulo: 'Data', tipo: 'date', valor: paraValorInputDate(atual.data) });

  function lerFormulario() {
    return {
      numero: campoNumero.input.value.trim(),
      data: campoData.input.value ? new Date(`${campoData.input.value}T00:00:00`) : null,
    };
  }

  const preview = criarAreaPreview(pad, () => renderizarTemplate({ ...pad, [chave]: lerFormulario() }));
  [campoNumero, campoData].forEach((campo) => campo.input.addEventListener('input', preview.atualizar));

  const botaoSalvar = criarBotaoSalvar(async () => {
    await salvarSecaoDoPad(pad, { [chave]: lerFormulario() }, { etapa, jaTinhaEtapa: Boolean(pad[chave]?.numero) });
    preview.atualizar();
    onAtualizar?.();
  });

  const formulario = criarCard({
    titulo,
    filhos: [
      criarElemento('div', { class: 'documentos__campos' }, [campoNumero.elemento, campoData.elemento]),
      criarElemento('div', { class: 'documentos__acoes' }, [botaoSalvar]),
    ],
  });

  return criarElemento('div', { class: 'documentos__aba' }, [formulario, preview.elemento]);
}

export function renderOficiosTab(pad, _configUnidade, { onAtualizar } = {}) {
  carregarCssUmaVez('src/pages/pad/detail/documentos/documentos.css');

  return criarElemento('div', { class: 'documentos__oficios' }, [
    montarSecaoOficio({ pad, titulo: 'Ofício ao Juiz', chave: 'oficioJuizo', etapa: 'OFICIO_JUIZO', renderizarTemplate: renderizarOficioJuizo, onAtualizar }),
    montarSecaoOficio({ pad, titulo: 'Ofício de Encaminhamento à VEP', chave: 'oficioVep', etapa: null, renderizarTemplate: renderizarOficioVep, onAtualizar }),
  ]);
}
