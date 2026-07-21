/**
 * Aba "Depoimento Incidentado" (renomeada de "Declarações do Apenado",
 * 2026-07-15) — um Termo de Declarações por incidentado do PAD (ver
 * incidentadosTab.js para adicionar/remover incidentados). `declaracoesApenado`
 * é um array `{ incidentadoId, silencio, versaoIncidentado }`, um item por
 * incidentado. Editar usa o mesmo padrão de painel lateral com
 * pré-visualização ao vivo das demais abas de documento único (Portaria,
 * Conselho, Decisão) — não modal (2026-07-20). A síntese que embasa o
 * Relatório da Decisão é escrita na própria aba Decisão (2026-07-21), não
 * aqui — ver decisaoTab.js.
 */
import {
  criarElemento, carregarCssUmaVez, criarCampoComDitado, criarAreaPreview, criarBotao, criarCard, salvarSecaoDoPad,
} from './_shared.js';
import { renderizar as renderizarDeclaracao } from '../../../../templates/declaracaoApenadoTemplate.js';
import { baixarComoPdf } from '../../../../templates/shared/pdfExporter.js';
import { baixarComoDoc } from '../../../../templates/shared/docExporter.js';
import { mostrarToast } from '../../../../utils/toast.js';

export function renderDepoimentoIncidentadoTab(pad, configUnidade, { onAtualizar } = {}) {
  carregarCssUmaVez('src/pages/pad/detail/documentos/documentos.css');

  const incidentados = pad.incidentados ?? [];
  const declaracoes = (pad.declaracoesApenado ?? []).map((d) => ({ ...d }));
  const raiz = criarElemento('div');

  function obterDeclaracao(incidentadoId) {
    return declaracoes.find((d) => d.incidentadoId === incidentadoId);
  }

  async function persistir() {
    await salvarSecaoDoPad(
      pad,
      { declaracoesApenado: declaracoes },
      { etapa: 'OITIVA_INCIDENTADO', jaTinhaEtapa: (pad.declaracoesApenado ?? []).length > 0, chaveConfirmacao: 'declaracoesApenado' },
    );
    onAtualizar?.();
  }

  function mostrarLista() {
    const listaEl = criarElemento('ul', { class: 'documentos__lista-itens' });
    listaEl.replaceChildren(
      ...incidentados.map((incidentado) => {
        const declaracao = obterDeclaracao(incidentado.id);
        const status = !declaracao ? 'pendente' : declaracao.silencio ? 'permaneceu em silêncio' : 'prestou declarações';
        const botaoEditar = criarBotao({
          texto: declaracao ? 'Editar' : 'Registrar depoimento',
          icon: 'settings',
          variante: 'secondary',
          onClick: () => mostrarFormulario(incidentado),
        });
        const botaoPdf = criarBotao({
          texto: 'PDF',
          icon: 'download',
          variante: 'secondary',
          onClick: () => baixarComoPdf(pad, renderizarDeclaracao(pad, incidentado, declaracao ?? {}, configUnidade)),
        });
        const botaoDoc = criarBotao({
          texto: '.doc',
          icon: 'file-text',
          variante: 'secondary',
          onClick: () => baixarComoDoc(pad, renderizarDeclaracao(pad, incidentado, declaracao ?? {}, configUnidade)),
        });
        return criarElemento('li', { class: 'documentos__item-lista' }, [
          criarElemento('span', {}, [`${incidentado.nomeCompleto} (${status})`]),
          criarElemento('div', { class: 'documentos__acoes-linha' }, [botaoEditar, botaoPdf, botaoDoc]),
        ]);
      }),
    );

    const card = criarCard({
      titulo: 'Depoimento Incidentado',
      filhos: [
        criarElemento('p', { class: 'text-muted' }, [
          incidentados.length
            ? 'Um Termo de Declarações por incidentado — para adicionar/remover incidentados, use a aba "Incidentados".'
            : 'Nenhum incidentado cadastrado ainda — adicione na aba "Incidentados".',
        ]),
        listaEl,
      ],
    });

    raiz.replaceChildren(card);
  }

  function mostrarFormulario(incidentado) {
    const declaracaoAtual = obterDeclaracao(incidentado.id);
    let silencio = declaracaoAtual?.silencio ?? false;

    const botaoDeclarou = criarBotao({ texto: 'Prestou declarações', variante: silencio ? 'secondary' : 'primary', onClick: () => alternar(false) });
    const botaoSilencio = criarBotao({ texto: 'Permaneceu em silêncio', variante: silencio ? 'primary' : 'secondary', onClick: () => alternar(true) });
    const campoVersao = criarCampoComDitado({ rotulo: 'Versão apresentada pelo incidentado', valor: declaracaoAtual?.versaoIncidentado });

    function atualizarVisibilidadeSilencio() {
      campoVersao.elemento.style.display = silencio ? 'none' : '';
    }

    function alternar(novoValor) {
      silencio = novoValor;
      botaoDeclarou.className = `btn btn--${silencio ? 'secondary' : 'primary'}`;
      botaoSilencio.className = `btn btn--${silencio ? 'primary' : 'secondary'}`;
      atualizarVisibilidadeSilencio();
      preview.atualizar();
    }

    function lerFormulario() {
      return {
        incidentadoId: incidentado.id,
        silencio,
        versaoIncidentado: campoVersao.input.value.trim(),
      };
    }

    const preview = criarAreaPreview(pad, () => renderizarDeclaracao(pad, incidentado, lerFormulario(), configUnidade));
    atualizarVisibilidadeSilencio();
    campoVersao.input.addEventListener('input', preview.atualizar);
    campoVersao.input.addEventListener('change', preview.atualizar);

    const botaoCancelar = criarBotao({ texto: 'Cancelar', icon: 'x', variante: 'secondary', onClick: mostrarLista });
    const botaoSalvar = criarBotao({
      texto: 'Salvar',
      icon: 'check',
      onClick: async () => {
        botaoSalvar.disabled = true;
        try {
          const dados = lerFormulario();
          const indiceExistente = declaracoes.findIndex((d) => d.incidentadoId === incidentado.id);
          if (indiceExistente === -1) declaracoes.push(dados);
          else declaracoes[indiceExistente] = dados;
          await persistir();
          mostrarToast('Salvo com sucesso.', 'sucesso');
          mostrarLista();
        } catch (erro) {
          console.error('Falha ao salvar depoimento do incidentado:', erro);
          mostrarToast('Não foi possível salvar.', 'erro');
        } finally {
          botaoSalvar.disabled = false;
        }
      },
    });

    const formulario = criarCard({
      titulo: `Depoimento de ${incidentado.nomeCompleto}`,
      acoes: [botaoCancelar],
      filhos: [
        criarElemento('div', { class: 'documentos__acoes' }, [botaoDeclarou, botaoSilencio]),
        campoVersao.elemento,
        criarElemento('div', { class: 'documentos__acoes' }, [botaoSalvar]),
      ],
    });

    raiz.replaceChildren(criarElemento('div', { class: 'documentos__aba' }, [formulario, preview.elemento]));
  }

  mostrarLista();
  return raiz;
}
