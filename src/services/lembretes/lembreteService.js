/**
 * Lembretes (2026-07-20) — quadro de anotações livres por unidade, no lugar
 * da antiga "Timeline de atividades" do Dashboard (que só mostrava o tipo
 * cru dos eventos, sem contexto acionável). Cada lembrete pertence a UMA
 * unidade (mesma convenção de `pads`/`eventos` — `superintendencia` é
 * derivado da unidade, não do vínculo de quem cria, ver
 * src/pages/pad/new/padNewPage.js:criarCampoUnidade), visível a qualquer
 * conta institucional no escopo dessa unidade/regional.
 *
 * Consulta evita `orderBy` combinado com filtro de igualdade (ordenação no
 * cliente) para não depender de índice composto — mesma estratégia de
 * src/services/usuarios/usuarioService.js.
 */
import { criarRepositorio } from '../firestoreRepository.js';
import { COLLECTIONS } from '../../config/constants.js';
import { obterUnidadePorNome } from '../../config/unidadesPrisionais.js';

const repo = criarRepositorio(COLLECTIONS.LEMBRETES);

function porCriadoEmDesc(a, b) {
  const dataA = a.criadoEm?.toMillis?.() ?? 0;
  const dataB = b.criadoEm?.toMillis?.() ?? 0;
  return dataB - dataA;
}

/** @param {string[] | null} unidades — de calcularUnidadesVisiveis (null = sem filtro, vê tudo) */
export async function listarLembretes(unidades) {
  const filtros = unidades ? [['unidade', 'in', unidades]] : [];
  const lembretes = await repo.listar({ filtros });
  return lembretes.sort(porCriadoEmDesc);
}

/** @param {{ texto: string, unidade: string, criadoPor: string }} dados */
export async function criarLembrete({ texto, unidade, criadoPor }) {
  return repo.criar({
    texto,
    unidade,
    superintendencia: obterUnidadePorNome(unidade)?.superintendencia ?? null,
    criadoPor,
    feito: false,
  });
}

export async function marcarLembreteComoFeito(id, feito) {
  await repo.atualizar(id, { feito });
}

export async function excluirLembrete(id) {
  await repo.remover(id);
}
