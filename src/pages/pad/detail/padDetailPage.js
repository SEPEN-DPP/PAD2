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

function secaoDadosGerais(pad) {
  const dados = pad.dadosGerais ?? {};
  const linhas = [
    ['Número', dados.numero],
    ['Unidade', dados.unidade],
    ['Data de abertura', formatarData(dados.dataAbertura)],
    ['Status', null],
  ];
  const listaDados = criarElemento(
    'dl',
    { class: 'pad-detail__lista-dados' },
    linhas.flatMap(([rotulo, valor]) => [
      criarElemento('dt', {}, [rotulo]),
      criarElemento('dd', {}, [rotulo === 'Status' ? criarStatusBadge({ status: pad.status }) : (valor ?? '—')]),
    ]),
  );

  const infracao = pad.infracao ?? {};
  const linhasInfracao = [
    ['Data da infração', infracao.data],
    ['Tipificação', infracao.tipificacao],
    ['Artigo da LEP', infracao.artigoLep?.rotulo],
    ['Detentos envolvidos', infracao.detentosEnvolvidos?.join(', ')],
    ['Agentes envolvidos', infracao.agentesEnvolvidos?.join(', ')],
    ['Descrição', infracao.descricao],
  ].filter(([, valor]) => valor);

  if (!linhasInfracao.length) return listaDados;

  return criarElemento('div', { class: 'pad-detail__dados-gerais' }, [
    listaDados,
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
  ]);
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
  ]);

  container.append(criarCard({ filhos: [tabs] }));
}
