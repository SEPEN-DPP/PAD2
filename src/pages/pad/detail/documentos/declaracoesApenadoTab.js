/**
 * Aba "Declarações do Apenado" — `pad.declaracoesApenado.silencio` decide se
 * o campo de versão do incidentado é mostrado/gravado.
 */
import { criarElemento, carregarCssUmaVez, criarCampo, criarBotao, criarAreaPreview, criarBotaoSalvar, criarCardEditavel, salvarSecaoDoPad } from './_shared.js';
import { renderizar as renderizarDeclaracao } from '../../../../templates/declaracaoApenadoTemplate.js';

export function renderDeclaracoesApenadoTab(pad, configUnidade, { onAtualizar } = {}) {
  carregarCssUmaVez('src/pages/pad/detail/documentos/documentos.css');

  const atual = pad.declaracoesApenado ?? {};
  let silencio = atual.silencio ?? false;

  const botaoDeclarou = criarBotao({ texto: 'Prestou declarações', variante: silencio ? 'secondary' : 'primary', onClick: () => alternar(false) });
  const botaoSilencio = criarBotao({ texto: 'Permaneceu em silêncio', variante: silencio ? 'primary' : 'secondary', onClick: () => alternar(true) });
  const campoVersao = criarCampo({ rotulo: 'Versão apresentada pelo incidentado', multilinha: true, valor: atual.versaoIncidentado });

  function alternar(novoValor) {
    silencio = novoValor;
    botaoDeclarou.className = `btn btn--${silencio ? 'secondary' : 'primary'}`;
    botaoSilencio.className = `btn btn--${silencio ? 'primary' : 'secondary'}`;
    campoVersao.elemento.style.display = silencio ? 'none' : '';
    preview.atualizar();
  }
  campoVersao.elemento.style.display = silencio ? 'none' : '';

  function padComFormulario() {
    return { ...pad, declaracoesApenado: { silencio, versaoIncidentado: campoVersao.input.value.trim() } };
  }

  const preview = criarAreaPreview(pad, () => renderizarDeclaracao(padComFormulario(), configUnidade));
  campoVersao.input.addEventListener('input', preview.atualizar);

  const secao = criarCardEditavel({
    titulo: 'Declarações do Incidentado / Defesa',
    corpo: [
      criarElemento('div', { class: 'documentos__acoes' }, [botaoDeclarou, botaoSilencio]),
      campoVersao.elemento,
    ],
  });

  const botaoSalvar = criarBotaoSalvar(
    async () => {
      await salvarSecaoDoPad(
        pad,
        { declaracoesApenado: { silencio, versaoIncidentado: campoVersao.input.value.trim() } },
        { etapa: 'OITIVA_INCIDENTADO', jaTinhaEtapa: Boolean(pad.declaracoesApenado) },
      );
      preview.atualizar();
      onAtualizar?.();
    },
    { aposSalvar: secao.esconder },
  );
  secao.areaCorpo.append(criarElemento('div', { class: 'documentos__acoes' }, [botaoSalvar]));

  return criarElemento('div', { class: 'documentos__aba' }, [secao.elemento, preview.elemento]);
}
