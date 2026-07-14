/**
 * Serviço de metadados de anexos. Combina o metadado (Firestore, coleção
 * `anexos`) com o binário (Firebase Storage, ver src/storage). Upload real
 * de arquivos pela UI é da Fase 5 (ver ROADMAP.md) — aqui existe apenas a
 * leitura de metadados já persistidos e o wrapper de obtenção de URL.
 */
import { criarRepositorio } from '../firestoreRepository.js';
import { COLLECTIONS } from '../../config/constants.js';
import { obterUrlDoAnexo } from '../../storage/attachmentStorage.js';

const repo = criarRepositorio(COLLECTIONS.ANEXOS);

export async function listarAnexosPorEvento(eventoId) {
  return repo.listar({ filtros: [['eventoId', '==', eventoId]] });
}

export async function listarAnexosPorPad(padId) {
  return repo.listar({ filtros: [['padId', '==', padId]] });
}

export async function listarUltimosAnexos(limite = 50) {
  return repo.listar({ ordenarPor: { campo: 'criadoEm', direcao: 'desc' }, limite });
}

export async function obterUrlParaVisualizacao(anexoId) {
  const anexo = await repo.obterPorId(anexoId);
  if (!anexo) throw new Error(`Anexo ${anexoId} não encontrado.`);
  return obterUrlDoAnexo(anexo.caminhoStorage);
}
