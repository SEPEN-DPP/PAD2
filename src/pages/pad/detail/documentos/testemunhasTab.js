/**
 * Aba "Oitiva de Testemunhas" — array `pad.testemunhas[]`, um documento por
 * item. Editar/adicionar usa o mesmo padrão de painel lateral com
 * pré-visualização ao vivo das demais abas de documento único (Portaria,
 * Conselho, Decisão) — não modal (2026-07-20): a lista some e dá lugar ao
 * formulário + preview da testemunha em edição; "Cancelar"/"Salvar" volta
 * para a lista, onde "Editar" reabre a mesma testemunha a qualquer momento.
 */
import {
  criarElemento, carregarCssUmaVez, criarCampo, criarCampoComDitado, criarCampoSelect, criarAreaPreview, criarBotao,
  criarCard, salvarSecaoDoPad,
} from './_shared.js';
import { renderizar as renderizarOitiva } from '../../../../templates/oitivaTestemunhaTemplate.js';
import { baixarComoPdf } from '../../../../templates/shared/pdfExporter.js';
import { baixarComoDoc } from '../../../../templates/shared/docExporter.js';
import { mostrarToast } from '../../../../utils/toast.js';

const OPCOES_QUALIDADE = [
  { valor: 'testemunha', rotulo: 'Testemunha' },
  { valor: 'informante', rotulo: 'Informante' },
];

export function renderTestemunhasTab(pad, configUnidade, { onAtualizar } = {}) {
  carregarCssUmaVez('src/pages/pad/detail/documentos/documentos.css');

  const testemunhas = (pad.testemunhas ?? []).map((t) => ({ ...t }));
  const raiz = criarElemento('div');

  async function persistir() {
    await salvarSecaoDoPad(
      pad,
      { testemunhas },
      { etapa: 'OITIVA_INCIDENTADO', jaTinhaEtapa: (pad.testemunhas ?? []).length > 0, chaveConfirmacao: 'testemunhas' },
    );
    onAtualizar?.();
  }

  function mostrarLista() {
    const listaEl = criarElemento('ul', { class: 'documentos__lista-itens' });
    listaEl.replaceChildren(
      ...testemunhas.map((testemunha, indice) => {
        const botaoEditar = criarBotao({
          texto: 'Editar',
          icon: 'settings',
          variante: 'secondary',
          onClick: () => mostrarFormulario(indice),
        });
        const botaoRemover = criarBotao({
          texto: 'Remover',
          icon: 'x',
          variante: 'danger',
          onClick: async () => {
            testemunhas.splice(indice, 1);
            await persistir();
            mostrarToast('Testemunha removida.', 'sucesso');
            mostrarLista();
          },
        });
        const botaoPdf = criarBotao({
          texto: 'PDF',
          icon: 'download',
          variante: 'secondary',
          onClick: () => baixarComoPdf(pad, renderizarOitiva(pad, testemunha, configUnidade)),
        });
        const botaoDoc = criarBotao({
          texto: '.doc',
          icon: 'file-text',
          variante: 'secondary',
          onClick: () => baixarComoDoc(pad, renderizarOitiva(pad, testemunha, configUnidade)),
        });
        return criarElemento('li', { class: 'documentos__item-lista' }, [
          criarElemento('span', {}, [`${testemunha.nome} (${testemunha.qualidade === 'informante' ? 'informante' : 'testemunha'})`]),
          criarElemento('div', { class: 'documentos__acoes-linha' }, [botaoEditar, botaoPdf, botaoDoc, botaoRemover]),
        ]);
      }),
    );

    const botaoAdicionar = criarBotao({ texto: 'Adicionar testemunha', icon: 'file-plus', onClick: () => mostrarFormulario(-1) });

    const card = criarCard({
      titulo: 'Oitiva de Testemunhas',
      filhos: [
        criarElemento('p', { class: 'text-muted' }, ['Cada testemunha/informante gera seu próprio Termo de Oitiva.']),
        criarElemento('div', { class: 'documentos__acoes' }, [botaoAdicionar]),
        listaEl,
      ],
    });

    raiz.replaceChildren(card);
  }

  function mostrarFormulario(indice) {
    const testemunhaAtual = indice === -1 ? null : testemunhas[indice];

    const campoNome = criarCampo({ rotulo: 'Nome completo', valor: testemunhaAtual?.nome });
    const campoQualificacao = criarCampo({ rotulo: 'Qualificação (ex.: agente penitenciário, interno...)', valor: testemunhaAtual?.qualificacao });
    const campoQualidade = criarCampoSelect({ rotulo: 'Qualidade', valor: testemunhaAtual?.qualidade ?? 'testemunha', opcoes: OPCOES_QUALIDADE });
    const campoDepoimento = criarCampoComDitado({ rotulo: 'Depoimento', valor: testemunhaAtual?.depoimento });

    function lerFormulario() {
      return {
        id: testemunhaAtual?.id ?? crypto.randomUUID(),
        nome: campoNome.input.value.trim(),
        qualificacao: campoQualificacao.input.value.trim(),
        qualidade: campoQualidade.input.value,
        depoimento: campoDepoimento.input.value.trim(),
      };
    }

    const preview = criarAreaPreview(pad, () => renderizarOitiva(pad, lerFormulario(), configUnidade));
    [campoNome, campoQualificacao, campoQualidade, campoDepoimento].forEach((campo) => {
      campo.input.addEventListener('input', preview.atualizar);
      campo.input.addEventListener('change', preview.atualizar);
    });

    const botaoCancelar = criarBotao({ texto: 'Cancelar', icon: 'x', variante: 'secondary', onClick: mostrarLista });
    const botaoSalvar = criarBotao({
      texto: 'Salvar',
      icon: 'check',
      onClick: async () => {
        if (!campoNome.input.value.trim()) {
          mostrarToast('Informe o nome.', 'aviso');
          return;
        }
        botaoSalvar.disabled = true;
        try {
          const dados = lerFormulario();
          if (indice === -1) testemunhas.push(dados);
          else testemunhas[indice] = dados;
          await persistir();
          mostrarToast('Salvo com sucesso.', 'sucesso');
          mostrarLista();
        } catch (erro) {
          console.error('Falha ao salvar testemunha:', erro);
          mostrarToast('Não foi possível salvar.', 'erro');
        } finally {
          botaoSalvar.disabled = false;
        }
      },
    });

    const formulario = criarCard({
      titulo: indice === -1 ? 'Adicionar testemunha' : 'Editar testemunha',
      acoes: [botaoCancelar],
      filhos: [
        campoNome.elemento,
        campoQualificacao.elemento,
        campoQualidade.elemento,
        campoDepoimento.elemento,
        criarElemento('div', { class: 'documentos__acoes' }, [botaoSalvar]),
      ],
    });

    raiz.replaceChildren(criarElemento('div', { class: 'documentos__aba' }, [formulario, preview.elemento]));
  }

  mostrarLista();
  return raiz;
}
