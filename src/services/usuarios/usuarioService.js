/**
 * Serviço de acesso a dados de Usuários institucionais. Inclui o fluxo de
 * aprovação de solicitações de acesso (Fase 1, 2026-07-14) — ver
 * docs/firestore-schema.md e firestore.rules para quem pode aprovar/recusar
 * (Direção/CPEN da unidade solicitada, ou Administrador).
 */
import { criarRepositorio } from '../firestoreRepository.js';
import { COLLECTIONS } from '../../config/constants.js';
import { ROLES } from '../../config/roles.js';

const repo = criarRepositorio(COLLECTIONS.USUARIOS);

export async function listarUsuarios() {
  return repo.listar({ ordenarPor: { campo: 'nome', direcao: 'asc' } });
}

export async function obterUsuario(id) {
  return repo.obterPorId(id);
}

/**
 * Quem pode gerenciar solicitações de acesso/excluir usuários, e de qual
 * unidade (`null` = todas — só Administrador). Usado pela tela de Usuários e
 * pelo indicador de pendências na topbar.
 */
export function calcularEscopoDeGestao(perfilUsuario) {
  if (perfilUsuario?.perfil === ROLES.ADMINISTRADOR) return { podeGerenciar: true, unidade: null };
  if (perfilUsuario?.perfil === ROLES.DIRETOR && perfilUsuario?.vinculo?.tipo === 'UNIDADE') {
    return { podeGerenciar: true, unidade: perfilUsuario.vinculo.valor };
  }
  return { podeGerenciar: false, unidade: null };
}

/**
 * @param {string|null} unidade - filtra pela unidade solicitada; `null` traz
 *   todas as solicitações (uso restrito a Administrador — ver firestore.rules).
 */
export async function listarSolicitacoesPendentes(unidade) {
  const filtros = [['status', '==', 'PENDENTE']];
  if (unidade) filtros.push(['unidadeSolicitada', '==', unidade]);
  return repo.listar({ filtros, ordenarPor: { campo: 'criadoEm', direcao: 'asc' } });
}

/** Aprova uma solicitação: concede o perfil Servidor, vinculado à unidade solicitada. */
export async function aprovarSolicitacao(uid, unidadeSolicitada) {
  await repo.atualizar(uid, {
    perfil: ROLES.SERVIDOR,
    unidade: unidadeSolicitada,
    vinculo: { tipo: 'UNIDADE', valor: unidadeSolicitada },
    status: 'ATIVO',
    ativo: true,
  });
}

/**
 * Recusa uma solicitação ou remove um usuário já ativo. Remove só o
 * documento de perfil — a conta de autenticação em si continua existindo
 * (excluir de fato exigiria Admin SDK/Cloud Functions, que não temos), então
 * a pessoa pode solicitar acesso de novo depois (ver
 * src/pages/auth/registro/registroPage.js → criarFormularioCompletarCadastro).
 */
export async function excluirUsuario(uid) {
  await repo.remover(uid);
}
