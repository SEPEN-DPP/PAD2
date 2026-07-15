/**
 * Aba "Oitiva de Testemunhas" — array `pad.testemunhas[]`, um documento por
 * item (padrão lista+modal já usado em src/pages/usuarios/usuariosPage.js).
 * Sem preview única (cada testemunha tem seu próprio documento) — cada linha
 * baixa o PDF/.doc daquela testemunha diretamente.
 */
import { criarElemento, carregarCssUmaVez, criarCampo, criarCampoSelect, criarBotao, criarBotaoSalvar, criarCardEditavel, salvarSecaoDoPad } from './_shared.js';
import { abrirModal } from '../../../../components/modal/modal.js';
import { renderizar as renderizarOitiva } from '../../../../templates/oitivaTestemunhaTemplate.js';
import { baixarComoPdf } from '../../../../templates/shared/pdfExporter.js';
import { baixarComoDoc } from '../../../../templates/shared/docExporter.js';
import { mostrarToast } from '../../../../utils/toast.js';

const OPCOES_QUALIDADE = [
  { valor: 'testemunha', rotulo: 'Testemunha' },
  { valor: 'informante', rotulo: 'Informante' },
];

function abrirModalTestemunha({ testemunha, onSalvar }) {
  const campoNome = criarCampo({ rotulo: 'Nome completo', valor: testemunha?.nome });
  const campoQualificacao = criarCampo({ rotulo: 'Qualificação (ex.: agente penitenciário, interno...)', valor: testemunha?.qualificacao });
  const campoQualidade = criarCampoSelect({ rotulo: 'Qualidade', valor: testemunha?.qualidade ?? 'testemunha', opcoes: OPCOES_QUALIDADE });
  const campoDepoimento = criarCampo({ rotulo: 'Depoimento', multilinha: true, valor: testemunha?.depoimento });

  const botaoSalvar = criarBotao({ texto: 'Salvar', icon: 'check' });
  const fechar = abrirModal({
    titulo: testemunha ? 'Editar testemunha' : 'Adicionar testemunha',
    conteudo: [campoNome.elemento, campoQualificacao.elemento, campoQualidade.elemento, campoDepoimento.elemento],
    rodape: [botaoSalvar],
  });

  botaoSalvar.addEventListener('click', () => {
    if (!campoNome.input.value.trim()) return mostrarToast('Informe o nome.', 'aviso');
    onSalvar({
      id: testemunha?.id ?? crypto.randomUUID(),
      nome: campoNome.input.value.trim(),
      qualificacao: campoQualificacao.input.value.trim(),
      qualidade: campoQualidade.input.value,
      depoimento: campoDepoimento.input.value.trim(),
    });
    fechar();
  });
}

export function renderTestemunhasTab(pad, configUnidade, { onAtualizar } = {}) {
  carregarCssUmaVez('src/pages/pad/detail/documentos/documentos.css');

  const testemunhas = (pad.testemunhas ?? []).map((t) => ({ ...t }));
  const listaEl = criarElemento('ul', { class: 'documentos__lista-itens' });

  async function persistir() {
    await salvarSecaoDoPad(pad, { testemunhas }, { etapa: 'OITIVA_INCIDENTADO', jaTinhaEtapa: (pad.testemunhas ?? []).length > 0 });
    onAtualizar?.();
  }

  function atualizarLista() {
    listaEl.replaceChildren(
      ...testemunhas.map((testemunha, indice) => {
        const botaoEditar = criarBotao({
          texto: 'Editar',
          icon: 'settings',
          variante: 'secondary',
          onClick: () => abrirModalTestemunha({
            testemunha,
            onSalvar: (dados) => {
              testemunhas[indice] = dados;
              atualizarLista();
            },
          }),
        });
        const botaoRemover = criarBotao({
          texto: 'Remover',
          icon: 'x',
          variante: 'danger',
          onClick: () => {
            testemunhas.splice(indice, 1);
            atualizarLista();
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
  }
  atualizarLista();

  const botaoAdicionar = criarBotao({
    texto: 'Adicionar testemunha',
    icon: 'file-plus',
    onClick: () => abrirModalTestemunha({
      onSalvar: (dados) => {
        testemunhas.push(dados);
        atualizarLista();
      },
    }),
  });

  const secao = criarCardEditavel({
    titulo: 'Oitiva de Testemunhas',
    corpo: [
      criarElemento('p', { class: 'text-muted' }, ['Cada testemunha/informante gera seu próprio Termo de Oitiva.']),
      criarElemento('div', { class: 'documentos__acoes' }, [botaoAdicionar]),
      listaEl,
    ],
  });

  const botaoSalvar = criarBotaoSalvar(persistir, { aposSalvar: secao.esconder });
  secao.areaCorpo.append(criarElemento('div', { class: 'documentos__acoes' }, [botaoSalvar]));

  return criarElemento('div', { class: 'documentos__aba' }, [secao.elemento]);
}
