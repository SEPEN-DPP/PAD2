/**
 * Serviço de auditoria. Toda ação sensível do sistema (login, acesso do
 * advogado, exportação, decisão) deve gravar uma entrada aqui. Logs são
 * imutáveis — apenas criação, nunca atualização/remoção (ver
 * firestore.rules).
 */
import { criarRepositorio } from '../firestoreRepository.js';
import { COLLECTIONS } from '../../config/constants.js';

const repo = criarRepositorio(COLLECTIONS.LOGS);

/**
 * @param {object} entrada
 * @param {string} entrada.usuarioId
 * @param {string} entrada.acao - ex.: 'LOGIN', 'ACESSO_NEGADO', 'VISUALIZOU_PAD'
 * @param {string} [entrada.padId]
 * @param {object} [entrada.detalhes]
 */
export async function registrarLog({ usuarioId, acao, padId, detalhes }) {
  return repo.criar({
    usuarioId,
    acao,
    padId: padId ?? null,
    detalhes: detalhes ?? null,
    data: new Date().toISOString(),
  });
}

export async function listarLogsPorUsuario(usuarioId, limite = 50) {
  return repo.listar({
    filtros: [['usuarioId', '==', usuarioId]],
    ordenarPor: { campo: 'data', direcao: 'desc' },
    limite,
  });
}
