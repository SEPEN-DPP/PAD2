/**
 * Selo colorido de status (PAD, evento, documento). Mapeia um enum para uma
 * cor semântica — sem qualquer regra de negócio associada.
 */
import { criarElemento, carregarCssUmaVez } from '../../utils/domUtils.js';
import { enumParaLabel } from '../../utils/stringUtils.js';

const TOM_POR_STATUS = {
  EM_ANDAMENTO: 'info',
  AGUARDANDO_DEFESA: 'aviso',
  AGUARDANDO_DECISAO: 'aviso',
  CONCLUIDO: 'sucesso',
  ARQUIVADO: 'neutro',
  PENDENTE: 'aviso',
  CONCLUIDA: 'sucesso',
};

/** @param {{ status: string, label?: string }} params */
export function criarStatusBadge({ status, label }) {
  carregarCssUmaVez('src/components/statusBadge/statusBadge.css');
  const tom = TOM_POR_STATUS[status] ?? 'neutro';
  return criarElemento('span', { class: `status-badge status-badge--${tom}` }, [
    label ?? enumParaLabel(status),
  ]);
}
