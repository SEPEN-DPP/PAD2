/**
 * Listagem geral de Eventos (etapas do fluxo processual) através de todos os
 * PADs. Leitura genérica — motor de fluxo é da Fase 2 (ver ROADMAP.md).
 */
import { carregarCssUmaVez } from '../../utils/domUtils.js';
import { criarPageHeader } from '../../components/pageHeader/pageHeader.js';
import { criarCard } from '../../components/card/card.js';
import { criarDataTable } from '../../components/dataTable/dataTable.js';
import { criarStatusBadge } from '../../components/statusBadge/statusBadge.js';
import { listarUltimosEventos } from '../../services/eventos/eventoService.js';
import { calcularUnidadesVisiveis } from '../../services/pads/escopoPad.js';
import { usuarioAtual, obterPerfilDoUsuario } from '../../services/auth/authService.js';
import { formatarDataHora } from '../../utils/dateUtils.js';
import { ETAPA_LABELS } from '../../config/constants.js';

const COLUNAS = [
  { chave: 'tipo', rotulo: 'Etapa', render: (l) => ETAPA_LABELS[l.tipo] ?? l.tipo ?? '—' },
  { chave: 'padId', rotulo: 'PAD', render: (l) => l.padId ?? '—' },
  { chave: 'responsavel', rotulo: 'Responsável', render: (l) => l.responsavel ?? '—' },
  { chave: 'status', rotulo: 'Status', render: (l) => criarStatusBadge({ status: l.status ?? 'PENDENTE' }) },
  { chave: 'data', rotulo: 'Data', render: (l) => formatarDataHora(l.data) },
];

export async function render(container) {
  carregarCssUmaVez('src/pages/eventos/eventosPage.css');

  container.append(
    criarPageHeader({
      titulo: 'Eventos',
      descricao: 'Etapas do fluxo processual registradas em todos os PADs.',
    }),
  );

  const perfilUsuario = await obterPerfilDoUsuario(usuarioAtual()?.uid);
  const unidadesVisiveis = calcularUnidadesVisiveis(perfilUsuario);
  const eventos = await listarUltimosEventos(50, unidadesVisiveis);

  container.append(
    criarCard({
      filhos: [
        criarDataTable({
          colunas: COLUNAS,
          linhas: eventos,
          vazio: {
            titulo: 'Nenhum evento registrado ainda',
            descricao: 'Eventos aparecem conforme os PADs avançam pelo fluxo processual.',
            icon: 'list-checks',
          },
        }),
      ],
    }),
  );
}
