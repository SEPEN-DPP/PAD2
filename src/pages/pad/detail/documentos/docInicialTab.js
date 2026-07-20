/**
 * Aba "Documentação Inicial" — relação de provas/documentos juntados logo
 * após a Portaria. Por padrão, o anexo (PDF/imagem) de cada item é efêmero:
 * só existe em memória durante esta sessão do navegador (usado para embutir
 * a imagem no PDF/.doc exportado) e não é gravado no Firestore — só o título
 * do item é persistido. Exceção: o item do Registro de Infração, anexado
 * automaticamente na criação do PAD (ver src/pages/pad/new/padNewPage.js),
 * já chega com anexo PERSISTIDO (`item.anexo` vindo do próprio
 * `pad.docInicial.itens` do Firestore) — este continua sendo gravado a cada
 * "Salvar" (marcado via `_anexoPersistido`, ver abaixo), diferente de um
 * anexo recém-selecionado nesta sessão pelo botão "Anexar arquivo", que
 * permanece efêmero (ver docs/firestore-schema.md e
 * src/templates/shared/anexoEmbutido.js).
 */
import { criarElemento, carregarCssUmaVez, criarCard, criarCampo, criarAreaPreview, criarBotaoSalvar, salvarSecaoDoPad, criarBotao, criarBotaoConfirmar } from './_shared.js';
import { renderizar as renderizarDocInicial } from '../../../../templates/docInicialTemplate.js';
import { converterParaImagensEmbutidas } from '../../../../templates/shared/anexoEmbutido.js';
import { mostrarToast } from '../../../../utils/toast.js';

export function renderDocInicialTab(pad, _configUnidade, { onAtualizar } = {}) {
  carregarCssUmaVez('src/pages/pad/detail/documentos/documentos.css');

  // Cópia local: cada item pode ter `anexo.dataUrls` além do `titulo`.
  // `_anexoPersistido` marca os itens cujo anexo já veio gravado do
  // Firestore (ex.: o Registro de Infração anexado na criação do PAD) — só
  // esses continuam sendo gravados a cada "Salvar"; um anexo adicionado
  // nesta sessão via "Anexar arquivo" nasce sem essa marca e continua
  // efêmero, como sempre foi.
  const itens = (pad.docInicial?.itens ?? []).map((item) => ({ ...item, _anexoPersistido: Boolean(item.anexo) }));

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
        if (item.anexo) rotulo += item._anexoPersistido ? ' (com anexo salvo)' : ' (com anexo — só nesta sessão)';
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
          item.anexo = { dataUrls: await converterParaImagensEmbutidas(arquivoPendente), nomeArquivo: arquivoPendente.name };
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
    // Preserva o anexo só dos itens que já vieram persistidos do Firestore
    // (ex.: o Registro de Infração anexado automaticamente na criação do
    // PAD) — um anexo adicionado nesta sessão via "Anexar arquivo" continua
    // efêmero (ver cabeçalho deste arquivo).
    await salvarSecaoDoPad(
      pad,
      { docInicial: { itens: itens.map(({ titulo, anexo, _anexoPersistido }) => (_anexoPersistido && anexo ? { titulo, anexo } : { titulo })) } },
      { etapa: null, jaTinhaEtapa: true, chaveConfirmacao: 'docInicial' },
    );
    onAtualizar?.();
  });

  const formulario = criarCard({
    titulo: 'Documentação Inicial',
    acoes: [criarBotaoConfirmar(pad, 'docInicial', { onAtualizar })],
    filhos: [
      criarElemento('p', { class: 'text-muted' }, ['Um anexo adicionado agora pelo botão "Anexar arquivo" fica só nesta sessão do navegador — use "Baixar PDF"/"Baixar .doc" antes de sair da página para não perdê-lo. O anexo do Registro de Infração (quando vem automaticamente da criação do PAD) já fica salvo.']),
      criarElemento('div', { class: 'documentos__campos' }, [campoTitulo.elemento]),
      criarElemento('div', { class: 'documentos__acoes' }, [botaoAnexar, legendaArquivo, inputArquivo]),
      criarElemento('div', { class: 'documentos__acoes' }, [botaoAdicionar]),
      listaEl,
      criarElemento('div', { class: 'documentos__acoes' }, [botaoSalvar]),
    ],
  });

  return criarElemento('div', { class: 'documentos__aba' }, [formulario, preview.elemento]);
}
