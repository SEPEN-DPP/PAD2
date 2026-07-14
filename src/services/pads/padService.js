/**
 * Serviço de acesso a dados de PAD. Apenas leitura/listagem/contagem
 * genéricas nesta fase — a máquina de estados do fluxo processual e a
 * criação de PAD a partir do Registro de Infração chegam na Fase 2/3 (ver
 * ROADMAP.md). Nenhuma regra de negócio de fluxo está implementada aqui.
 *
 * Recorte por unidade/regional (2026-07-14): quem pode ver quais PADs é
 * decidido em src/services/pads/escopoPad.js a partir do `vinculo` do
 * usuário (ver docs/firestore-schema.md) — aqui só aplicamos o filtro de
 * unidades já calculado, via `where('dadosGerais.unidade', 'in', unidades)`.
 */
import { criarRepositorio } from '../firestoreRepository.js';
import { COLLECTIONS, STATUS_PAD } from '../../config/constants.js';

const repo = criarRepositorio(COLLECTIONS.PADS);

/** Monta o filtro de unidade a partir da lista calculada por escopoPad.js (null = sem filtro, vê tudo). */
function filtroDeUnidades(unidades) {
  return unidades ? [['dadosGerais.unidade', 'in', unidades]] : [];
}

export async function listarPads({ status, unidades, limite = 20 } = {}) {
  const filtros = [...filtroDeUnidades(unidades)];
  if (status) filtros.push(['status', '==', status]);
  return repo.listar({
    filtros,
    ordenarPor: { campo: 'criadoEm', direcao: 'desc' },
    limite,
  });
}

export async function obterPad(id) {
  return repo.obterPorId(id);
}

/** Retorna a contagem de PADs por status, usada nos cartões do Dashboard. */
export async function contarPadsPorStatus(unidades) {
  const statusList = Object.values(STATUS_PAD);
  const contagens = await Promise.all(
    statusList.map((status) =>
      repo.contar({ filtros: [...filtroDeUnidades(unidades), ['status', '==', status]] }),
    ),
  );
  return Object.fromEntries(statusList.map((status, i) => [status, contagens[i]]));
}

export async function contarTodosPads(unidades) {
  return repo.contar({ filtros: filtroDeUnidades(unidades) });
}
