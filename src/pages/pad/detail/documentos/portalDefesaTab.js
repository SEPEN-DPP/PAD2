/**
 * Aba "Portal da Defesa" (2026-07-20) — mostra a qualquer usuário logado do
 * painel institucional exatamente a mesma visão que o defensor vê no Portal
 * da Defesa para este PAD: documentos já confirmados pela Unidade em modo
 * somente-leitura, mais o widget de envio da Manifestação da Defesa enquanto
 * ela ainda não estiver confirmada (ver
 * src/pages/portal-defesa/portalDefesaPage.js:montarDocumentosConfirmados,
 * única fonte de verdade dessa montagem — reaproveitada aqui, não duplicada).
 */
import { criarElemento, carregarCssUmaVez } from '../../../../utils/domUtils.js';
import { criarEmptyState } from '../../../../components/emptyState/emptyState.js';
import { montarDocumentosConfirmados } from '../../../portal-defesa/portalDefesaPage.js';

export function renderPortalDefesaTab(pad, _configUnidade, { onAtualizar } = {}) {
  carregarCssUmaVez('src/pages/portal-defesa/portalDefesaPage.css');

  const container = criarElemento('div', { class: 'documentos__aba' });

  function renderizar() {
    container.replaceChildren();
    const documentos = montarDocumentosConfirmados(pad, {
      onAtualizar: () => {
        renderizar();
        onAtualizar?.();
      },
    });
    container.append(
      documentos.length
        ? criarElemento('div', { class: 'portal-defesa__documentos' }, documentos)
        : criarEmptyState({
            titulo: 'Nenhum documento confirmado ainda',
            descricao: 'Assim que a Unidade confirmar um documento, ele aparece aqui.',
            icon: 'file-text',
          }),
    );
  }
  renderizar();

  return container;
}
