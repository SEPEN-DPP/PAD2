/**
 * Detalhe do PAD, organizado em abas por seção do objeto de domínio (ver
 * ARCHITECTURE.md §4). Cada aba lê dados reais via services, mas nenhuma
 * regra de negócio de transição de etapa está implementada aqui (Fase 2).
 */
import { criarElemento, carregarCssUmaVez } from '../../../utils/domUtils.js';
import { criarBreadcrumbs } from '../../../components/breadcrumbs/breadcrumbs.js';
import { criarTabs } from '../../../components/tabs/tabs.js';
import { criarCard } from '../../../components/card/card.js';
import { criarStatusBadge } from '../../../components/statusBadge/statusBadge.js';
import { criarEmptyState } from '../../../components/emptyState/emptyState.js';
import { obterPad } from '../../../services/pads/padService.js';
import { obterConfiguracaoUnidade } from '../../../services/configuracoesUnidade/configuracaoUnidadeService.js';
import { formatarData } from '../../../utils/dateUtils.js';
import { renderIncidentadosTab } from './documentos/incidentadosTab.js';
import { renderPortariaTab } from './documentos/portariaTab.js';
import { renderDocInicialTab } from './documentos/docInicialTab.js';
import { renderTermoCientificacaoTab } from './documentos/termoCientificacaoTab.js';
import { renderTestemunhasTab } from './documentos/testemunhasTab.js';
import { renderDepoimentoIncidentadoTab } from './documentos/depoimentoIncidentadoTab.js';
import { renderConselhoTab } from './documentos/conselhoTab.js';
import { renderDefesaTab } from './documentos/defesaTab.js';
import { renderDecisaoTab } from './documentos/decisaoTab.js';
import { renderOficiosTab } from './documentos/oficiosTab.js';

function secaoDadosGerais(pad) {
  const dados = pad.dadosGerais ?? {};
  const linhas = [
    ['Número', dados.numero],
    ['Unidade', dados.unidade],
    ['Data de abertura', formatarData(dados.dataAbertura)],
    ['Status', null],
  ];
  return criarElemento(
    'dl',
    { class: 'pad-detail__lista-dados' },
    linhas.flatMap(([rotulo, valor]) => [
      criarElemento('dt', {}, [rotulo]),
      criarElemento('dd', {}, [rotulo === 'Status' ? criarStatusBadge({ status: pad.status }) : (valor ?? '—')]),
    ]),
  );
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

  container.append(
    criarBreadcrumbs(
      [
        { texto: 'PAD', path: '/pad' },
        { texto: pad.dadosGerais?.numero ?? pad.id },
      ],
      (path) => {
        location.hash = path;
      },
    ),
  );

  const configUnidade = await obterConfiguracaoUnidade(pad.dadosGerais?.unidade);

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
    { id: 'oficios', titulo: 'Ofícios', render: () => renderOficiosTab(pad, configUnidade, { onAtualizar }) },
  ]);

  container.append(criarCard({ filhos: [tabs] }));
}
