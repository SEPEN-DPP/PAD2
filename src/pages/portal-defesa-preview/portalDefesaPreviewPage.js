/**
 * "Portal da Defesa" no painel institucional (2026-07-20) — item próprio do
 * menu lateral (antes era uma aba dentro do Detalhe do PAD). Lista todos os
 * PADs da(s) unidade(s) visíveis ao usuário logado; abrir um PAD mostra
 * exatamente a mesma visão somente-leitura que o(a) defensor(a) vê no
 * próprio Portal da Defesa (documentos já confirmados pela Unidade),
 * reaproveitando `montarDocumentosConfirmados` — sem o widget de envio da
 * Manifestação da Defesa, que é exclusivo do defensor logado no portal dele
 * (ver `somenteLeitura` em src/pages/portal-defesa/portalDefesaPage.js).
 * Editar qualquer documento continua exclusivo da tela do PAD (`/pad/:id`).
 */
import { carregarCssUmaVez, criarElemento, limparContainer } from '../../utils/domUtils.js';
import { criarPageHeader } from '../../components/pageHeader/pageHeader.js';
import { criarCard } from '../../components/card/card.js';
import { criarBotao } from '../../components/button/button.js';
import { criarDataTable } from '../../components/dataTable/dataTable.js';
import { criarStatusBadge } from '../../components/statusBadge/statusBadge.js';
import { criarEmptyState } from '../../components/emptyState/emptyState.js';
import { listarPads } from '../../services/pads/padService.js';
import { calcularUnidadesVisiveis } from '../../services/pads/escopoPad.js';
import { obterConfiguracaoUnidade } from '../../services/configuracoesUnidade/configuracaoUnidadeService.js';
import { usuarioAtual, obterPerfilDoUsuario } from '../../services/auth/authService.js';
import { montarDocumentosConfirmados } from '../portal-defesa/portalDefesaPage.js';
import { montarDocumentosCompletos } from '../pad/detail/padDetailPage.js';
import { baixarTodosComoPdf } from '../../templates/shared/pdfExporter.js';
import { mostrarToast } from '../../utils/toast.js';

const COLUNAS = [
  { chave: 'numero', rotulo: 'Nº do PAD', render: (linha) => linha.dadosGerais?.numero ?? linha.id },
  {
    chave: 'incidentados',
    rotulo: 'Incidentado(s)',
    render: (linha) => linha.incidentados?.map((i) => i.nomeCompleto).filter(Boolean).join(', ') || '—',
  },
  { chave: 'unidade', rotulo: 'Unidade', render: (linha) => linha.dadosGerais?.unidade ?? '—' },
  { chave: 'status', rotulo: 'Status', render: (linha) => criarStatusBadge({ status: linha.status }) },
];

export async function render(container) {
  carregarCssUmaVez('src/pages/portal-defesa/portalDefesaPage.css');

  container.append(
    criarPageHeader({
      titulo: 'Portal da Defesa',
      descricao: 'Visão somente-leitura de cada PAD — igual à que o(a) defensor(a) vê. Para editar um documento, abra o PAD na tela "PAD".',
    }),
  );

  const perfilUsuario = await obterPerfilDoUsuario(usuarioAtual()?.uid);
  const unidadesVisiveis = calcularUnidadesVisiveis(perfilUsuario);

  const outlet = criarElemento('div');
  container.append(outlet);

  async function mostrarLista() {
    limparContainer(outlet);
    const pads = await listarPads({ limite: 50, unidades: unidadesVisiveis });
    outlet.append(
      criarCard({
        filhos: [
          criarDataTable({
            colunas: COLUNAS,
            linhas: pads,
            onClickLinha: (linha) => mostrarDetalhe(linha),
            vazio: {
              titulo: 'Nenhum PAD cadastrado ainda',
              descricao: 'PADs aparecem aqui assim que forem abertos.',
              icon: 'folder-search',
            },
          }),
        ],
      }),
    );
  }

  function mostrarDetalhe(pad) {
    limparContainer(outlet);

    const botaoVoltar = criarBotao({ texto: 'Voltar', icon: 'chevron-left', variante: 'secondary', onClick: mostrarLista });
    const botaoBaixar = criarBotao({
      texto: 'Baixar PAD completo (PDF)',
      icon: 'download',
      variante: 'secondary',
      onClick: async () => {
        botaoBaixar.disabled = true;
        try {
          const configUnidade = await obterConfiguracaoUnidade(pad.dadosGerais?.unidade);
          const documentos = montarDocumentosCompletos(pad, configUnidade);
          await baixarTodosComoPdf(pad, documentos, `PAD_${pad.dadosGerais?.numero ?? pad.id}.pdf`);
        } catch (erro) {
          console.error('Falha ao gerar o PAD completo:', erro);
          mostrarToast('Não foi possível gerar o PDF do PAD.', 'erro');
        } finally {
          botaoBaixar.disabled = false;
        }
      },
    });

    outlet.append(
      criarElemento('div', { class: 'documentos__acoes' }, [
        botaoVoltar,
        criarElemento('h2', {}, [`PAD ${pad.dadosGerais?.numero ?? pad.id}`]),
        botaoBaixar,
      ]),
    );

    const documentos = montarDocumentosConfirmados(pad, { somenteLeitura: true });
    outlet.append(
      documentos.length
        ? criarElemento('div', { class: 'portal-defesa__documentos' }, documentos)
        : criarEmptyState({
            titulo: 'Nenhum documento confirmado ainda',
            descricao: 'Assim que a Unidade confirmar um documento, ele aparece aqui.',
            icon: 'file-text',
          }),
    );
  }

  await mostrarLista();
}
