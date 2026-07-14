/**
 * Serviço de acesso a dados de Usuários institucionais. CRUD completo e tela
 * de gestão de perfil/unidade chegam na Fase 1 (ver ROADMAP.md) — aqui
 * existe apenas leitura/listagem genérica.
 */
import { criarRepositorio } from '../firestoreRepository.js';
import { COLLECTIONS } from '../../config/constants.js';

const repo = criarRepositorio(COLLECTIONS.USUARIOS);

export async function listarUsuarios() {
  return repo.listar({ ordenarPor: { campo: 'nome', direcao: 'asc' } });
}

export async function obterUsuario(id) {
  return repo.obterPorId(id);
}
