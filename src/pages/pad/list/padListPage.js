/**
 * Listagem de PADs. Leitura genérica via padService — a busca avançada por
 * filtros (unidade, classificação, período) é da Fase 2 (ver ROADMAP.md).
 */
import { carregarCssUmaVez, criarElemento, limparContainer } from '../../../utils/domUtils.js';
import { criarPageHeader } from '../../../components/pageHeader/pageHeader.js';
import { criarCard } from '../../../components/card/card.js';
import { criarBotao } from '../../../components/button/button.js';
import { criarDataTable } from '../../../components/dataTable/dataTable.js';
import { criarStatusBadge } from '../../../components/statusBadge/statusBadge.js';
import { abrirModal } from '../../../components/modal/modal.js';
import { listarPads, excluirPad } from '../../../services/pads/padService.js';
import { calcularUnidadesVisiveis } from '../../../services/pads/escopoPad.js';
import { usuarioAtual, obterPerfilDoUsuario } from '../../../services/auth/authService.js';
import { formatarData } from '../../../utils/dateUtils.js';
import { ROLES } from '../../../config/roles.js';
import { mostrarToast } from '../../../utils/toast.js';

/** Só Direção/CPEN e Administrador podem excluir um PAD (ver firestore.rules, souGestorDoPad). */
function podeExcluirPad(perfilUsuario) {
  return perfilUsuario?.perfil === ROLES.ADMINISTRADOR || perfilUsuario?.perfil === ROLES.DIRETOR;
}

function confirmarExclusao({ numero, onConfirmar }) {
  const botaoCancelar = criarBotao({ texto: 'Cancelar', variante: 'secondary', onClick: () => fechar() });
  const botaoConfirmar = criarBotao({
    texto: 'Excluir PAD',
    variante: 'danger',
    icon: 'x',
    onClick: async () => {
      botaoConfirmar.disabled = true;
      await onConfirmar();
      fechar();
    },
  });
  const fechar = abrirModal({
    titulo: `Excluir o PAD ${numero}?`,
    conteudo: [
      criarElemento('p', {}, ['Essa ação não pode ser desfeita. O PAD será removido da relação permanentemente.']),
    ],
    rodape: [botaoCancelar, botaoConfirmar],
  });
}

function criarColunas({ podeExcluir, onExcluir }) {
  const colunas = [
    { chave: 'numero', rotulo: 'Nº do PAD', render: (linha) => linha.dadosGerais?.numero ?? linha.id },
    {
      chave: 'incidentado',
      rotulo: 'Incidentado',
      render: (linha) => linha.incidentados?.[0]?.nomeCompleto ?? '—',
    },
    { chave: 'unidade', rotulo: 'Unidade', render: (linha) => linha.dadosGerais?.unidade ?? '—' },
    { chave: 'status', rotulo: 'Status', render: (linha) => criarStatusBadge({ status: linha.status }) },
    {
      chave: 'dataAbertura',
      rotulo: 'Abertura',
      render: (linha) => formatarData(linha.dadosGerais?.dataAbertura),
    },
  ];

  if (podeExcluir) {
    colunas.push({
      chave: 'acoes',
      rotulo: 'Ações',
      render: (linha) => {
        const botaoExcluir = criarBotao({
          texto: 'Excluir',
          icon: 'x',
          variante: 'danger',
          onClick: (evento) => {
            evento.stopPropagation();
            confirmarExclusao({ numero: linha.dadosGerais?.numero ?? linha.id, onConfirmar: () => onExcluir(linha) });
          },
        });
        return botaoExcluir;
      },
    });
  }

  return colunas;
}

export async function render(container) {
  carregarCssUmaVez('src/pages/pad/list/padListPage.css');

  const botaoNovo = criarBotao({
    texto: 'Novo PAD',
    icon: 'file-plus',
    onClick: () => {
      location.hash = '/pad/novo';
    },
  });

  container.append(
    criarPageHeader({
      titulo: 'PAD',
      descricao: 'Processos Administrativos Disciplinares em tramitação e concluídos.',
      acoes: [botaoNovo],
    }),
  );

  const perfilUsuario = await obterPerfilDoUsuario(usuarioAtual()?.uid);
  const unidadesVisiveis = calcularUnidadesVisiveis(perfilUsuario);
  const podeExcluir = podeExcluirPad(perfilUsuario);

  const areaTabela = criarElemento('div');
  container.append(criarCard({ filhos: [areaTabela] }));

  async function atualizarTabela() {
    const pads = await listarPads({ limite: 50, unidades: unidadesVisiveis });
    limparContainer(areaTabela);
    areaTabela.append(
      criarDataTable({
        colunas: criarColunas({
          podeExcluir,
          onExcluir: async (linha) => {
            try {
              await excluirPad(linha.id);
              mostrarToast(`PAD ${linha.dadosGerais?.numero ?? linha.id} excluído.`, 'info');
              atualizarTabela();
            } catch (erro) {
              console.error('Falha ao excluir PAD:', erro);
              mostrarToast('Não foi possível excluir esse PAD.', 'erro');
            }
          },
        }),
        linhas: pads,
        onClickLinha: (linha) => {
          location.hash = `/pad/${linha.id}`;
        },
        vazio: {
          titulo: 'Nenhum PAD cadastrado ainda',
          descricao: 'Clique em "Novo PAD" para iniciar o registro de uma infração.',
          icon: 'folder-search',
        },
      }),
    );
  }

  await atualizarTabela();
}
