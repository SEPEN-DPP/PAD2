/**
 * Serviço de acesso a dados de Documentos gerados. A geração real (a partir
 * de src/templates + jsPDF) é da Fase 4 — aqui existe apenas a leitura dos
 * metadados já persistidos.
 */
import { criarRepositorio } from '../firestoreRepository.js';
import { COLLECTIONS } from '../../config/constants.js';

const repo = criarRepositorio(COLLECTIONS.DOCUMENTOS);

export async function listarDocumentosPorPad(padId) {
  return repo.listar({
    filtros: [['padId', '==', padId]],
    ordenarPor: { campo: 'criadoEm', direcao: 'desc' },
  });
}

export async function obterDocumento(id) {
  return repo.obterPorId(id);
}

export async function listarUltimosDocumentos(limite = 50) {
  return repo.listar({ ordenarPor: { campo: 'criadoEm', direcao: 'desc' }, limite });
}
