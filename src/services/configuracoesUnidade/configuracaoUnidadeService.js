/**
 * Configuração por unidade prisional (Conselho Disciplinar e Diretor(a) da
 * Unidade) — preenchida uma vez e reaproveitada em todo PAD novo daquela
 * unidade (ver docs/firestore-schema.md, coleção `configuracoesUnidade`, e
 * src/pages/configuracoes/configuracoesPage.js). Id do documento é o nome
 * da unidade (mesma string usada em `dadosGerais.unidade`/`vinculo.valor`).
 */
import { criarRepositorio } from '../firestoreRepository.js';
import { COLLECTIONS } from '../../config/constants.js';
import { obterUnidadePorNome } from '../../config/unidadesPrisionais.js';

const repo = criarRepositorio(COLLECTIONS.CONFIGURACOES_UNIDADE);

export async function obterConfiguracaoUnidade(unidade) {
  if (!unidade) return null;
  return repo.obterPorId(unidade);
}

/**
 * @param {string} unidade
 * @param {{ diretor: { nome: string, cargo: string }, conselho: { presidente: object, membro1: object, membro2: object } }} dados
 * @param {string} autorUid
 */
export async function salvarConfiguracaoUnidade(unidade, dados, autorUid) {
  const payload = {
    unidade,
    superintendencia: obterUnidadePorNome(unidade)?.superintendencia ?? null,
    diretor: dados.diretor,
    conselho: dados.conselho,
    atualizadoPor: autorUid,
  };
  const existente = await repo.obterPorId(unidade);
  if (existente) {
    await repo.atualizar(unidade, payload);
  } else {
    await repo.criar(payload, unidade);
  }
}
