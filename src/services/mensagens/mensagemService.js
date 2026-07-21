/**
 * Mensagens entre a Unidade e o(a) defensor(a) vinculado a um PAD
 * (2026-07-20) — thread simples por PAD, sem edição/exclusão (log de
 * conversa, mesmo espírito de `eventos`). Substitui o antigo card
 * "Pendências" do Dashboard (que era um placeholder vazio da Fase 2) por
 * comunicação de verdade, sempre dentro do PAD — não um quadro único
 * misturando conversas de PADs diferentes.
 *
 * `lida` (2026-07-21) — só rastreada pro lado institucional perceber
 * mensagem nova do defensor (o sininho de notificação, ver
 * src/layout/appShell.js); mensagens do próprio lado institucional nascem
 * `lida: true` (não faz sentido "não lida" pra quem a escreveu). Sem
 * listener em tempo real (`onSnapshot`) — nenhum outro lugar do projeto
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
  return repo.criar({ ...dados, lida: dados.autorTipo === 'institucional' });
}

/** Marca como lidas todas as mensagens do defensor num PAD — chamado ao abrir o quadro de mensagens do lado institucional (ver mensagensBoard.js). */
export async function marcarMensagensComoLidas(padId) {
  const mensagens = await repo.listar({
    filtros: [
      ['padId', '==', padId],
      ['autorTipo', '==', 'defensor'],
      ['lida', '==', false],
    ],
  });
  await Promise.all(mensagens.map((m) => repo.atualizar(m.id, { lida: true })));
}

/**
 * Conta mensagens do defensor ainda não lidas, no escopo de unidades
 * visíveis — alimenta o sininho de notificação (ver src/layout/appShell.js,
 * chamado a cada carregamento do painel). Combinar `in` com outros filtros
 * exige índice composto no Firestore (ver firestore.indexes.json) — nunca
 * deixa uma falha aqui (índice faltando, rede) quebrar o carregamento do
 * painel inteiro.
 */
export async function contarMensagensNaoLidas(unidades) {
  try {
    const filtros = [
      ['autorTipo', '==', 'defensor'],
      ['lida', '==', false],
      ...(unidades ? [['unidade', 'in', unidades]] : []),
    ];
    return await repo.contar({ filtros });
  } catch (erro) {
    console.error('Falha ao contar mensagens não lidas:', erro);
    return 0;
  }
}
