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
import { obterUnidadePorNome } from '../../config/unidadesPrisionais.js';

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

/**
 * Cria um novo PAD a partir dos dados revisados na tela "Novo PAD" (ver
 * src/pages/pad/new/padNewPage.js). Nasce sempre como EM_ANDAMENTO — o
 * número é digitado pelo próprio usuário (não há numeração automática).
 * `superintendencia` é denormalizado a partir de `unidade` (mesma fonte
 * única de verdade usada em src/services/auth/authService.js) para que as
 * firestore.rules consigam autorizar contas de Superintendência Regional
 * sem embutir o mapa de 55 unidades no texto das regras.
 * @param {{ numero: string, unidade: string, incidentados: Array, infracao: object }} dados
 * @returns {Promise<string>} id do PAD criado
 */
/**
 * Exclui um PAD da listagem. Autorização (Direção/CPEN da unidade ou
 * regional, ou Administrador) é decidida por `souGestorDoPad` em
 * firestore.rules — esta função só encapsula a chamada, sem regra própria.
 */
export async function excluirPad(id) {
  await repo.remover(id);
}

export async function criarPad({ numero, unidade, incidentados, infracao }) {
  if (!numero?.trim()) throw new Error('O número do PAD é obrigatório.');
  if (!unidade?.trim()) throw new Error('A unidade do PAD é obrigatória.');

  return repo.criar({
    dadosGerais: {
      numero: numero.trim(),
      unidade,
      dataAbertura: new Date(),
    },
    superintendencia: obterUnidadePorNome(unidade)?.superintendencia ?? null,
    incidentados,
    infracao,
    status: STATUS_PAD.EM_ANDAMENTO,
  });
}
