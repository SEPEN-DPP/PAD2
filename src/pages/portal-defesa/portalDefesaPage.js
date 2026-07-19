/**
 * Portal da Defesa (Fase 6, 2026-07-19) — experiência de login separada do
 * painel institucional para o defensor (advogado constituído ou defensor
 * público) vinculado a um ou mais PADs. Lista os PADs vinculados; dentro de
 * cada um, mostra somente os documentos já CONFIRMADOS pela Unidade
 * (`pad.confirmacoes.<chave>.confirmado === true` — ver
 * src/pages/pad/detail/documentos/_shared.js:criarBotaoConfirmar), em modo
 * somente-leitura. Enquanto a Manifestação da Defesa ainda não estiver
 * confirmada, mostra em vez disso o formulário para o próprio defensor
 * enviá-la (texto + ditado + upload de PDF persistido).
 *
 * Sem sub-rotas via hash — troca o conteúdo do próprio outlet entre lista e
 * detalhe (sem back-button/deep-link nesta primeira versão).
 */
import { criarElemento, carregarCssUmaVez, limparContainer } from '../../utils/domUtils.js';
import { criarCard } from '../../components/card/card.js';
import { criarBotao } from '../../components/button/button.js';
import { criarEmptyState } from '../../components/emptyState/emptyState.js';
import { criarStatusBadge } from '../../components/statusBadge/statusBadge.js';
import { mostrarToast } from '../../utils/toast.js';
import { listarPadsDoDefensor } from '../../services/defensores/defensorService.js';
import { atualizarPad } from '../../services/pads/padService.js';
import { renderizarPreview } from '../../templates/shared/previewRenderer.js';
import { aplicarAnexoSubstituto, criarCampoComDitado, criarAnexoSubstitutoPersistido, criarBotaoSalvar } from '../pad/detail/documentos/_shared.js';

import { renderizar as renderizarPortaria } from '../../templates/portariaAberturaTemplate.js';
import { renderizar as renderizarDocInicial } from '../../templates/docInicialTemplate.js';
import { renderizar as renderizarTermo } from '../../templates/termoCientificacaoTemplate.js';
import { renderizar as renderizarOitiva } from '../../templates/oitivaTestemunhaTemplate.js';
import { renderizar as renderizarDeclaracao } from '../../templates/declaracaoApenadoTemplate.js';
import { renderizar as renderizarConselho } from '../../templates/manifestacaoConselhoTemplate.js';
import { renderizar as renderizarDefesa } from '../../templates/manifestacaoDefesaTemplate.js';
import { renderizar as renderizarDecisao } from '../../templates/decisaoTemplate.js';
import { renderizar as renderizarOficioJuizo } from '../../templates/oficioJuizoTemplate.js';
import { renderizar as renderizarOficioVep } from '../../templates/oficioVepTemplate.js';

function estaConfirmado(pad, chave) {
  return Boolean(pad.confirmacoes?.[chave]?.confirmado);
}

function criarPreviewSomenteLeitura(pad, titulo, documento) {
  return criarCard({ titulo, filhos: [renderizarPreview(pad, documento)] });
}

/** Widget de envio da Manifestação da Defesa pelo próprio defensor — texto/ditado + upload persistido, com aviso de tamanho. */
function criarWidgetManifestacaoDefesa(pad, { onEnviado }) {
  const campoTexto = criarCampoComDitado({ rotulo: 'Manifestação da Defesa', valor: pad.defesa?.texto });
  const anexo = criarAnexoSubstitutoPersistido({ valorInicial: pad.defesa?.anexoPersistido ?? null, onMudar: () => {} });

  const botaoEnviar = criarBotaoSalvar(async () => {
    await atualizarPad(pad.id, {
      defesa: { ...pad.defesa, texto: campoTexto.input.value.trim(), anexoPersistido: anexo.obterAnexo() },
    });
    Object.assign(pad, { defesa: { ...pad.defesa, texto: campoTexto.input.value.trim(), anexoPersistido: anexo.obterAnexo() } });
    mostrarToast('Manifestação enviada.', 'sucesso');
    onEnviado?.();
  });

  return criarCard({
    titulo: 'Manifestação da Defesa',
    filhos: [
      criarElemento('p', { class: 'text-muted' }, ['Este documento ainda não foi confirmado pela Unidade — envie sua manifestação abaixo.']),
      campoTexto.elemento,
      anexo.elemento,
      criarElemento('div', { class: 'documentos__acoes' }, [botaoEnviar]),
    ],
  });
}

function renderizarDetalhePad(container, pad, { onVoltar }) {
  limparContainer(container);

  const botaoVoltar = criarBotao({ texto: 'Voltar', icon: 'chevron-left', variante: 'secondary', onClick: onVoltar });
  const cabecalho = criarElemento('div', { class: 'documentos__acoes' }, [
    botaoVoltar,
    criarElemento('h2', {}, [`PAD ${pad.dadosGerais?.numero ?? pad.id}`]),
  ]);

  const documentos = [];

  if (estaConfirmado(pad, 'portaria')) documentos.push(criarPreviewSomenteLeitura(pad, 'Portaria de Instauração', renderizarPortaria(pad)));
  if (estaConfirmado(pad, 'docInicial')) documentos.push(criarPreviewSomenteLeitura(pad, 'Documentação Inicial', renderizarDocInicial(pad)));
  if (estaConfirmado(pad, 'termoCientificacao')) documentos.push(criarPreviewSomenteLeitura(pad, 'Termo de Cientificação', renderizarTermo(pad)));

  if (estaConfirmado(pad, 'testemunhas')) {
    for (const testemunha of pad.testemunhas ?? []) {
      documentos.push(criarPreviewSomenteLeitura(pad, `Depoimento — ${testemunha.nome}`, renderizarOitiva(pad, testemunha)));
    }
  }

  if (estaConfirmado(pad, 'declaracoesApenado')) {
    for (const incidentado of pad.incidentados ?? []) {
      const declaracao = (pad.declaracoesApenado ?? []).find((d) => d.incidentadoId === incidentado.id) ?? {};
      documentos.push(criarPreviewSomenteLeitura(pad, `Depoimento — ${incidentado.nomeCompleto}`, renderizarDeclaracao(pad, incidentado, declaracao)));
    }
  }

  if (estaConfirmado(pad, 'conselho')) {
    documentos.push(criarPreviewSomenteLeitura(
      pad,
      'Manifestação do Conselho Disciplinar',
      aplicarAnexoSubstituto(renderizarConselho(pad), pad.conselho?.anexoPersistido),
    ));
  }

  if (estaConfirmado(pad, 'defesa')) {
    documentos.push(criarPreviewSomenteLeitura(
      pad,
      'Manifestação da Defesa',
      aplicarAnexoSubstituto(renderizarDefesa(pad), pad.defesa?.anexoPersistido),
    ));
  } else {
    documentos.push(criarWidgetManifestacaoDefesa(pad, { onEnviado: () => renderizarDetalhePad(container, pad, { onVoltar }) }));
  }

  if (estaConfirmado(pad, 'decisao')) {
    documentos.push(criarPreviewSomenteLeitura(
      pad,
      'Decisão da Direção',
      aplicarAnexoSubstituto(renderizarDecisao(pad), pad.decisao?.anexoPersistido),
    ));
  }
  if (estaConfirmado(pad, 'oficioJuizo')) documentos.push(criarPreviewSomenteLeitura(pad, 'Ofício ao Juiz', renderizarOficioJuizo(pad)));
  if (estaConfirmado(pad, 'oficioVep')) documentos.push(criarPreviewSomenteLeitura(pad, 'Ofício de Encaminhamento à VEP', renderizarOficioVep(pad)));

  container.append(
    cabecalho,
    documentos.length
      ? criarElemento('div', { class: 'portal-defesa__documentos' }, documentos)
      : criarEmptyState({ titulo: 'Nenhum documento confirmado ainda', descricao: 'Assim que a Unidade confirmar um documento, ele aparece aqui.', icon: 'file-text' }),
  );
}

function renderizarListaPads(container, pads, { onAbrirPad }) {
  limparContainer(container);

  if (!pads.length) {
    container.append(criarEmptyState({ titulo: 'Nenhum PAD vinculado', descricao: 'Você ainda não está vinculado a nenhum PAD.', icon: 'scale' }));
    return;
  }

  const lista = criarElemento('ul', { class: 'documentos__lista-itens' });
  lista.replaceChildren(
    ...pads.map((pad) => {
      const botaoAbrir = criarBotao({ texto: 'Abrir', icon: 'file-text', variante: 'secondary', onClick: () => onAbrirPad(pad) });
      return criarElemento('li', { class: 'documentos__item-lista' }, [
        criarElemento('span', {}, [
          `PAD ${pad.dadosGerais?.numero ?? pad.id} — ${pad.dadosGerais?.unidade ?? '—'} `,
          criarStatusBadge({ status: pad.status }),
        ]),
        botaoAbrir,
      ]);
    }),
  );

  container.append(criarCard({ titulo: 'PADs vinculados', filhos: [lista] }));
}

/** @param {{ outlet: HTMLElement, defensor: object }} params */
export async function montarPortalDefesa({ outlet, defensor }) {
  carregarCssUmaVez('src/pages/portal-defesa/portalDefesaPage.css');

  const pads = await listarPadsDoDefensor(defensor.uid ?? defensor.id);

  function mostrarLista() {
    renderizarListaPads(outlet, pads, { onAbrirPad: (pad) => renderizarDetalhePad(outlet, pad, { onVoltar: mostrarLista }) });
  }

  mostrarLista();
}
