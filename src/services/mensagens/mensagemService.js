/**
 * Mensagens entre a Unidade e o(a) defensor(a) vinculado a um PAD
 * (2026-07-20) — thread simples por PAD, sem edição/exclusão (log de
 * conversa, mesmo espírito de `eventos`). Substitui o antigo card
 * "Pendências" do Dashboard (que era um placeholder vazio da Fase 2) por
 * comunicação de verdade, sempre dentro do PAD — não um quadro único
 * misturando conversas de PADs diferentes.
 *
 * Sem listener em tempo real (`onSnapshot`) — nenhum outro lugar do projeto
 * usa isso (ver src/services/firestoreRepository.js), então a lista só
 * atualiza ao enviar uma mensagem ou reabrir a aba, mesmo padrão de leitura
 * do resto do app.
 */
import { criarRepositorio } from '../firestoreRepository.js';
import { COLLECTIONS } from '../../config/constants.js';

const repo = criarRepositorio(COLLECTIONS.MENSAGENS);

function porCriadoEmAsc(a, b) {
  const dataA = a.criadoEm?.toMillis?.() ?? 0;
  const dataB = b.criadoEm?.toMillis?.() ?? 0;
  return dataA - dataB;
}

export async function listarMensagensDoPad(padId) {
  const mensagens = await repo.listar({ filtros: [['padId', '==', padId]] });
  return mensagens.sort(porCriadoEmAsc);
}

/** @param {{ padId: string, texto: string, autorUid: string, autorNome: string, autorTipo: 'institucional'|'defensor', unidade: string, superintendencia: string|null }} dados */
export async function enviarMensagem(dados) {
  return repo.criar(dados);
}
