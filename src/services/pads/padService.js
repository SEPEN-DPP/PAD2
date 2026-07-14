/**
 * Serviço de acesso a dados de PAD. Apenas leitura/listagem/contagem
 * genéricas nesta fase — a máquina de estados do fluxo processual e a
 * criação de PAD a partir do Registro de Infração chegam na Fase 2/3 (ver
 * ROADMAP.md). Nenhuma regra de negócio está implementada aqui.
 */
import { criarRepositorio } from '../firestoreRepository.js';
import { COLLECTIONS, STATUS_PAD } from '../../config/constants.js';

const repo = criarRepositorio(COLLECTIONS.PADS);

export async function listarPads({ status, limite = 20 } = {}) {
  const filtros = status ? [['status', '==', status]] : [];
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
export async function contarPadsPorStatus() {
  const statusList = Object.values(STATUS_PAD);
  const contagens = await Promise.all(
    statusList.map((status) => repo.contar({ filtros: [['status', '==', status]] })),
  );
  return Object.fromEntries(statusList.map((status, i) => [status, contagens[i]]));
}

export async function contarTodosPads() {
  return repo.contar();
}
