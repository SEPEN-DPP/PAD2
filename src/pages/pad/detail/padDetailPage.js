/**
 * Detalhe do PAD, organizado em abas por seção do objeto de domínio (ver
 * ARCHITECTURE.md §4). Cada aba lê dados reais via services, mas nenhuma
 * regra de negócio de transição de etapa está implementada aqui (Fase 2).
 */
import { criarElemento, carregarCssUmaVez } from '../../../utils/domUtils.js';
import { criarBreadcrumbs } from '../../../components/breadcrumbs/breadcrumbs.js';
import { criarTabs } from '../../../components/tabs/tabs.js';
import { criarCard } from '../../../components/card/card.js';
import { criarBotao } from '../../../components/button/button.js';
import { criarStatusBadge } from '../../../components/statusBadge/statusBadge.js';
import { criarEmptyState } from '../../../components/emptyState/emptyState.js';
import { mostrarToast } from '../../../utils/toast.js';
import { obterPad, alterarSituacaoAtual } from '../../../services/pads/padService.js';
import { obterConfiguracaoUnidade } from '../../../services/configuracoesUnidade/configuracaoUnidadeService.js';
import { listarEventosPorPad } from '../../../services/eventos/eventoService.js';
import { usuarioAtual, obterPerfilDoUsuario } from '../../../services/auth/authService.js';
import { SITUACAO_ATUAL_PAD, SITUACAO_ATUAL_LABELS } from '../../../config/constants.js';
import { formatarData, formatarDataHora } from '../../../utils/dateUtils.js';
import { renderIncidentadosTab } from './documentos/incidentadosTab.js';
import { renderPortariaTab } from './documentos/portariaTab.js';
import { renderDocInicialTab } from './documentos/docInicialTab.js';
import { renderTermoCientificacaoTab } from './documentos/termoCientificacaoTab.js';
import { renderTestemunhasTab } from './documentos/testemunhasTab.js';
import { renderDepoimentoIncidentadoTab } from './documentos/depoimentoIncidentadoTab.js';
import { renderConselhoTab } from './documentos/conselhoTab.js';
import { renderDefesaTab } from './documentos/defesaTab.js';
import { renderDecisaoTab } from './documentos/decisaoTab.js';
import { renderMensagensTab } from './documentos/mensagensTab.js';
import { aplicarAnexoSubstituto } from './documentos/_shared.js';
import { baixarTodosComoPdf } from '../../../templates/shared/pdfExporter.js';
import { renderizar as renderizarPortaria } from '../../../templates/portariaAberturaTemplate.js';
import { renderizar as renderizarDocInicial } from '../../../templates/docInicialTemplate.js';
import { renderizar as renderizarOitiva } from '../../../templates/oitivaTestemunhaTemplate.js';
import { renderizar as renderizarDeclaracao } from '../../../templates/declaracaoApenadoTemplate.js';
import { renderizar as renderizarConselho } from '../../../templates/manifestacaoConselhoTemplate.js';
import { renderizar as renderizarDefesa } from '../../../templates/manifestacaoDefesaTemplate.js';
import { renderizar as renderizarDecisao } from '../../../templates/decisaoTemplate.js';

/**
 * Monta o PDF do PAD completo — Portaria, Documentação Inicial, Depoimento(s)
 * de Testemunha(s) (se houver), Depoimento Incidentado, Manifestação do
 * Conselho, Manifestação da Defesa e Decisão, nessa ordem. Termo de
 * Cientificação fica de fora (decisão do usuário — é
 * correspondência/formalidade à parte, não "o processo" em si). Exportada
 * para reuso pela página "Portal da Defesa" institucional (2026-07-20, ver
 * src/pages/portal-defesa-preview/portalDefesaPreviewPage.js), que também
 * oferece esse download a partir da visão somente-leitura de cada PAD.
 */
export function montarDocumentosCompletos(pad, configUnidade) {
  const documentos = [renderizarPortaria(pad, configUnidade), renderizarDocInicial(pad)];

  for (const testemunha of pad.testemunhas ?? []) {
    documentos.push(renderizarOitiva(pad, testemunha, configUnidade));
  }

  for (const incidentado of pad.incidentados ?? []) {
    const declaracao = (pad.declaracoesApenado ?? []).find((d) => d.incidentadoId === incidentado.id) ?? {};
    documentos.push(renderizarDeclaracao(pad, incidentado, declaracao, configUnidade));
  }

  documentos.push(aplicarAnexoSubstituto(renderizarConselho(pad, configUnidade), pad.conselho?.anexoPersistido));
  documentos.push(aplicarAnexoSubstituto(renderizarDefesa(pad), pad.defesa?.anexoPersistido));
  documentos.push(aplicarAnexoSubstituto(renderizarDecisao(pad), pad.decisao?.anexoPersistido));

  return documentos;
}

/**
 * Situação atual (2026-07-20) — onde o PAD está de fato, escolhida
 * livremente por quem edita o PAD (sem ordem obrigatória, ver
 * SITUACAO_ATUAL_PAD em constants.js). `status` (badge ao lado) é sempre
 * recalculado junto — nunca escolhido à parte, ver
 * padService.js:alterarSituacaoAtual. Cada mudança fica registrada no
 * histórico logo abaixo (reaproveita `eventos`, sem tela própria).
 */
function secaoDadosGerais(pad) {
  const dados = pad.dadosGerais ?? {};

  const badgeStatus = criarElemento('span');
  const atualizarBadge = () => badgeStatus.replaceChildren(criarStatusBadge({ status: pad.status }));
  atualizarBadge();

  const selectSituacao = criarElemento(
    'select',
    { class: 'campo__input' },
    SITUACAO_ATUAL_PAD.map((codigo) => {
      const atributos = { value: codigo };
      if (codigo === (pad.situacaoAtual ?? SITUACAO_ATUAL_PAD[0])) atributos.selected = 'selected';
      return criarElemento('option', atributos, [SITUACAO_ATUAL_LABELS[codigo]]);
    }),
  );

  const areaHistorico = criarElemento('div', { class: 'pad-detail__historico' });
  async function atualizarHistorico() {
    const eventos = await listarEventosPorPad(pad.id, dados.unidade, pad.superintendencia);
    if (!eventos.length) {
      areaHistorico.replaceChildren();
      return;
    }
    const lista = criarElemento('ul', { class: 'pad-detail__historico-lista' });
    lista.replaceChildren(
      ...eventos
        .slice()
        .reverse()
        .map((evento) =>
          criarElemento('li', {}, [
            criarElemento('span', {}, [SITUACAO_ATUAL_LABELS[evento.tipo] ?? evento.tipo ?? '—']),
            criarElemento('span', { class: 'text-muted' }, [` — ${evento.responsavel ?? '—'}, ${formatarDataHora(evento.data)}`]),
          ]),
        ),
    );
    areaHistorico.replaceChildren(criarElemento('h4', {}, ['Histórico']), lista);
  }
  atualizarHistorico();

  selectSituacao.addEventListener('change', async () => {
    const valorAnterior = pad.situacaoAtual ?? SITUACAO_ATUAL_PAD[0];
    selectSituacao.disabled = true;
    try {
      const perfil = await obterPerfilDoUsuario(usuarioAtual()?.uid);
      await alterarSituacaoAtual(pad, selectSituacao.value, { responsavel: perfil?.nome ?? usuarioAtual()?.email ?? '—' });
      atualizarBadge();
      await atualizarHistorico();
      mostrarToast('Situação atualizada.', 'sucesso');
    } catch (erro) {
      console.error('Falha ao atualizar situação do PAD:', erro);
      mostrarToast('Não foi possível atualizar a situação.', 'erro');
      selectSituacao.value = valorAnterior;
    } finally {
      selectSituacao.disabled = false;
    }
  });

  const linhas = [
    ['Número', dados.numero],
    ['Unidade', dados.unidade],
    ['Data de abertura', formatarData(dados.dataAbertura)],
  ];
  const listaDados = criarElemento(
    'dl',
    { class: 'pad-detail__lista-dados' },
    [
      ...linhas.flatMap(([rotulo, valor]) => [criarElemento('dt', {}, [rotulo]), criarElemento('dd', {}, [valor ?? '—'])]),
      criarElemento('dt', {}, ['Status']),
      criarElemento('dd', {}, [badgeStatus]),
      criarElemento('dt', {}, ['Situação atual']),
      criarElemento('dd', {}, [selectSituacao]),
    ],
  );

  const blocos = [listaDados, areaHistorico];

  const infracao = pad.infracao ?? {};
  const linhasInfracao = [
    ['Data da infração', infracao.data],
    ['Tipificação', infracao.tipificacao],
    ['Artigo da LEP', infracao.artigoLep?.rotulo],
    ['Detentos envolvidos', infracao.detentosEnvolvidos?.join(', ')],
    ['Agentes envolvidos', infracao.agentesEnvolvidos?.join(', ')],
    ['Descrição', infracao.descricao],
  ].filter(([, valor]) => valor);

  if (linhasInfracao.length) {
    blocos.push(
      criarCard({
        titulo: 'Registro de Infração (extraído do PDF na criação do PAD)',
        filhos: [
          criarElemento(
            'dl',
            { class: 'pad-detail__lista-dados' },
            linhasInfracao.flatMap(([rotulo, valor]) => [criarElemento('dt', {}, [rotulo]), criarElemento('dd', {}, [valor])]),
          ),
        ],
      }),
    );
  }

  return criarElemento('div', { class: 'pad-detail__dados-gerais' }, blocos);
}

export async function render(container, params) {
  carregarCssUmaVez('src/pages/pad/detail/padDetailPage.css');

  const pad = await obterPad(params.id);

  if (!pad) {
    container.append(
      criarEmptyState({
        titulo: 'PAD não encontrado',
        descricao: 'O processo solicitado não existe ou foi removido.',
        icon: 'file-text',
      }),
    );
    return;
  }

  const configUnidade = await obterConfiguracaoUnidade(pad.dadosGerais?.unidade);

  const botaoBaixarPad = criarBotao({
    texto: 'Baixar PAD completo (PDF)',
    icon: 'download',
    variante: 'secondary',
    onClick: async () => {
      botaoBaixarPad.disabled = true;
      try {
        const documentos = montarDocumentosCompletos(pad, configUnidade);
        await baixarTodosComoPdf(pad, documentos, `PAD_${pad.dadosGerais?.numero ?? pad.id}.pdf`);
      } catch (erro) {
        console.error('Falha ao gerar o PAD completo:', erro);
        mostrarToast('Não foi possível gerar o PDF do PAD.', 'erro');
      } finally {
        botaoBaixarPad.disabled = false;
      }
    },
  });

  container.append(
    criarElemento('div', { class: 'pad-detail__cabecalho' }, [
      criarBreadcrumbs(
        [
          { texto: 'PAD', path: '/pad' },
          { texto: pad.dadosGerais?.numero ?? pad.id },
        ],
        (path) => {
          location.hash = path;
        },
      ),
      botaoBaixarPad,
    ]),
  );

  const onAtualizar = () => {};

  const tabs = criarTabs([
    { id: 'dados-gerais', titulo: 'Dados Gerais', render: () => secaoDadosGerais(pad) },
    { id: 'incidentados', titulo: 'Incidentados', render: () => renderIncidentadosTab(pad, configUnidade, { onAtualizar }) },
    { id: 'portaria', titulo: 'Portaria', render: () => renderPortariaTab(pad, configUnidade, { onAtualizar }) },
    { id: 'doc-inicial', titulo: 'Doc. Inicial', render: () => renderDocInicialTab(pad, configUnidade, { onAtualizar }) },
    { id: 'termo-cientificacao', titulo: 'Cientificação', render: () => renderTermoCientificacaoTab(pad, configUnidade, { onAtualizar }) },
    { id: 'testemunhas', titulo: 'Depoimento(s) Testemunha(s)', render: () => renderTestemunhasTab(pad, configUnidade, { onAtualizar }) },
    { id: 'declaracoes-apenado', titulo: 'Depoimento Incidentado', render: () => renderDepoimentoIncidentadoTab(pad, configUnidade, { onAtualizar }) },
    { id: 'conselho', titulo: 'Manifestação do Conselho Disciplinar', render: () => renderConselhoTab(pad, configUnidade, { onAtualizar }) },
    { id: 'defesa', titulo: 'Manifestação da Defesa', render: () => renderDefesaTab(pad, configUnidade, { onAtualizar }) },
    { id: 'decisao', titulo: 'Decisão', render: () => renderDecisaoTab(pad, configUnidade, { onAtualizar }) },
    { id: 'mensagens', titulo: 'Mensagens', render: () => renderMensagensTab(pad) },
  ]);

  container.append(criarCard({ filhos: [tabs] }));
}
