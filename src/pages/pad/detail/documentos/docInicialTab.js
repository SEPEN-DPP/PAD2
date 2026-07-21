/**
 * Aba "Documentação Inicial" — relação de provas/documentos juntados logo
 * após a Portaria. Cada item pode ter um anexo (PDF/imagem), sempre
 * PERSISTIDO no Firestore junto com o item (2026-07-20 — antes, só o anexo
 * do Registro de Infração auto-anexado na criação do PAD persistia; um
 * anexo adicionado depois pelo botão "Anexar arquivo" ficava só na sessão
 * do navegador e sumia ao recarregar, mesmo com "Confirmar documento"
 * clicado — confuso e silencioso). Sujeito ao mesmo limite de tamanho por
 * documento do Firestore usado em Conselho/Decisão/Defesa (ver
 * `converterParaAnexoPersistido` em _shared.js) — acima disso, o item não é
 * adicionado e um aviso pede um arquivo menor.
 */
import { criarElemento, carregarCssUmaVez, criarCard, criarCampo, criarAreaPreview, criarBotaoSalvar, salvarSecaoDoPad, criarBotao, criarBotaoConfirmar, converterParaAnexoPersistido } from './_shared.js';
import { renderizar as renderizarDocInicial } from '../../../../templates/docInicialTemplate.js';
import { mostrarToast } from '../../../../utils/toast.js';

export function renderDocInicialTab(pad, _configUnidade, { onAtualizar } = {}) {
  carregarCssUmaVez('src/pages/pad/detail/documentos/documentos.css');

  // Cópia local: cada item pode ter `anexo.dataUrls` além do `titulo`.
  const itens = (pad.docInicial?.itens ?? []).map((item) => ({ ...item }));

  const listaEl = criarElemento('ul', { class: 'documentos__lista-itens' });
  const campoTitulo = criarCampo({ rotulo: 'Título do documento' });
  const inputArquivo = criarElemento('input', { type: 'file', accept: 'application/pdf,image/*', class: 'sr-only' });
  const botaoAnexar = criarBotao({ texto: 'Anexar arquivo (opcional)', icon: 'paperclip', variante: 'secondary', onClick: () => inputArquivo.click() });
  const legendaArquivo = criarElemento('span', { class: 'text-muted' }, ['Nenhum arquivo selecionado']);

  let arquivoPendente = null;
  inputArquivo.addEventListener('change', () => {
    arquivoPendente = inputArquivo.files?.[0] ?? null;
    legendaArquivo.textContent = arquivoPendente ? arquivoPendente.name : 'Nenhum arquivo selecionado';
  });

  function padComItens() {
    return { ...pad, docInicial: { itens } };
  }

  const preview = criarAreaPreview(pad, () => renderizarDocInicial(padComItens()));

  function atualizarLista() {
    listaEl.replaceChildren(
      ...itens.map((item, indice) => {
        const botaoRemover = criarBotao({
          texto: 'Remover',
          icon: 'x',
          variante: 'danger',
          onClick: () => {
            itens.splice(indice, 1);
            atualizarLista();
            preview.atualizar();
          },
        });
        let rotulo = item.titulo;
        if (item.anexo) rotulo += ' (com anexo salvo)';
        return criarElemento('li', { class: 'documentos__item-lista' }, [
          criarElemento('span', {}, [rotulo]),
          botaoRemover,
        ]);
      }),
    );
  }
  atualizarLista();

  const botaoAdicionar = criarBotao({
    texto: 'Adicionar à relação',
    icon: 'file-plus',
    onClick: async () => {
      const titulo = campoTitulo.input.value.trim();
      if (!titulo) return mostrarToast('Informe o título do documento.', 'aviso');

      const item = { titulo };
      if (arquivoPendente) {
        try {
          const anexo = await converterParaAnexoPersistido(arquivoPendente);
          if (!anexo) {
            mostrarToast('Documento muito grande para anexar — envie um arquivo menor.', 'aviso');
            return;
          }
          item.anexo = anexo;
        } catch (erro) {
          console.error('Falha ao processar anexo:', erro);
          mostrarToast(erro.message ?? 'Não foi possível processar o anexo.', 'erro');
          return;
        }
      }
      itens.push(item);
      campoTitulo.input.value = '';
      arquivoPendente = null;
      inputArquivo.value = '';
      legendaArquivo.textContent = 'Nenhum arquivo selecionado';
      atualizarLista();
      preview.atualizar();
    },
  });

  const botaoSalvar = criarBotaoSalvar(async () => {
    await salvarSecaoDoPad(
      pad,
      { docInicial: { itens: itens.map(({ titulo, anexo }) => (anexo ? { titulo, anexo } : { titulo })) } },
      { etapa: null, jaTinhaEtapa: true, chaveConfirmacao: 'docInicial' },
    );
    onAtualizar?.();
  });

  const formulario = criarCard({
    titulo: 'Documentação Inicial',
    acoes: [criarBotaoConfirmar(pad, 'docInicial', { onAtualizar })],
    filhos: [
      criarElemento('p', { class: 'text-muted' }, ['Anexos ficam salvos junto com o PAD (sujeitos a um limite de tamanho — se um arquivo for grande demais, um aviso pede um menor).']),
      criarElemento('div', { class: 'documentos__campos' }, [campoTitulo.elemento]),
      criarElemento('div', { class: 'documentos__acoes' }, [botaoAnexar, legendaArquivo, inputArquivo]),
      criarElemento('div', { class: 'documentos__acoes' }, [botaoAdicionar]),
      listaEl,
      criarElemento('div', { class: 'documentos__acoes' }, [botaoSalvar]),
    ],
  });

  return criarElemento('div', { class: 'documentos__aba' }, [formulario, preview.elemento]);
}
