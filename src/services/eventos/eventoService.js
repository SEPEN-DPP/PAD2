/**
 * Serviço de acesso a dados de Eventos (etapas do fluxo processual do PAD).
 * Apenas leitura/listagem genéricas nesta fase — a validação de transição
 * entre etapas é regra de negócio da Fase 2 (ver ROADMAP.md).
 */
import { criarRepositorio } from '../firestoreRepository.js';
import { COLLECTIONS } from '../../config/constants.js';

const repo = criarRepositorio(COLLECTIONS.EVENTOS);

export async function listarEventosPorPad(padId) {
  return repo.listar({
    filtros: [['padId', '==', padId]],
    ordenarPor: { campo: 'data', direcao: 'asc' },
  });
}

export async function listarUltimosEventos(limite = 10) {
  return repo.listar({ ordenarPor: { campo: 'data', direcao: 'desc' }, limite });
}

export async function obterEvento(id) {
  return repo.obterPorId(id);
}

/**
 * Registra um evento (etapa do fluxo) para um PAD já existente.
 * @param {{ padId: string, tipo: string, responsavel: string, data: Date, status: string, observacoes?: string }} dados
 */
export async function criarEvento({ padId, tipo, responsavel, data, status, observacoes }) {
  return repo.criar({ padId, tipo, responsavel, data, status, observacoes: observacoes ?? '' });
}
