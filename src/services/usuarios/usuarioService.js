/**
 * Serviço de acesso a dados de Usuários institucionais. Inclui o fluxo de
 * aprovação de solicitações de acesso e a gestão de contas Servidor
 * (Fase 1, 2026-07-14) — ver docs/firestore-schema.md e firestore.rules para
 * quem pode aprovar/editar/excluir (Direção/CPEN da unidade, Superintendência
 * Regional para as unidades da sua regional, ou Administrador para todos).
 *
 * As consultas aqui evitam `orderBy` combinado com filtros de igualdade
 * (ordenação é feita no cliente depois) para não depender de índices
 * compostos adicionais — Firestore resolve filtros só-de-igualdade
 * automaticamente, sem índice manual.
 */
import { criarRepositorio } from '../firestoreRepository.js';
import { COLLECTIONS } from '../../config/constants.js';
import { ROLES } from '../../config/roles.js';
import { UNIDADES_PRISIONAIS } from '../../config/unidadesPrisionais.js';

const repo = criarRepositorio(COLLECTIONS.USUARIOS);

/** Perfis que um gestor de unidade/regional (não-Administrador) pode atribuir a um Servidor. */
export const PERFIS_ATRIBUIVEIS_POR_GESTOR = Object.freeze([
  ROLES.SERVIDOR,
  ROLES.CONSELHO_DISCIPLINAR,
  ROLES.SUBDIRETOR,
]);

function porNome(a, b) {
  return (a.nome ?? '').localeCompare(b.nome ?? '');
}

function porCriadoEm(a, b) {
  return (a.criadoEm?.toMillis?.() ?? 0) - (b.criadoEm?.toMillis?.() ?? 0);
}

export async function listarUsuarios() {
  const usuarios = await repo.listar({ filtros: [] });
  return usuarios.sort(porNome);
}

export async function obterUsuario(id) {
  return repo.obterPorId(id);
}

/**
 * Quem pode gerenciar solicitações/usuários, e por qual campo+valor filtrar
 * (`campo: null` = Administrador, sem filtro, vê e gerencia todo mundo).
 */
export function calcularEscopoDeGestao(perfilUsuario) {
  if (perfilUsuario?.perfil === ROLES.ADMINISTRADOR) {
    return { podeGerenciar: true, campo: null, valor: null };
  }
  if (perfilUsuario?.perfil === ROLES.DIRETOR && perfilUsuario?.vinculo?.tipo === 'UNIDADE') {
    return { podeGerenciar: true, campo: 'unidade', valor: perfilUsuario.vinculo.valor };
  }
  if (perfilUsuario?.perfil === ROLES.DIRETOR && perfilUsuario?.vinculo?.tipo === 'REGIONAL') {
    return { podeGerenciar: true, campo: 'superintendencia', valor: perfilUsuario.vinculo.valor };
  }
  return { podeGerenciar: false, campo: null, valor: null };
}

/** Nome de exibição da unidade/regional gerenciada, para textos de tela. */
export function descreverEscopo(escopo) {
  if (!escopo.campo) return 'todas as unidades';
  if (escopo.campo === 'unidade') return escopo.valor;
  const unidades = UNIDADES_PRISIONAIS.filter((u) => u.superintendencia === escopo.valor);
  return `unidades da ${escopo.valor} (${unidades.length})`;
}

export async function listarSolicitacoesPendentes(escopo) {
  const filtros = [['status', '==', 'PENDENTE']];
  if (escopo.campo === 'unidade') filtros.push(['unidadeSolicitada', '==', escopo.valor]);
  else if (escopo.campo === 'superintendencia') filtros.push(['superintendencia', '==', escopo.valor]);
  const solicitacoes = await repo.listar({ filtros });
  return solicitacoes.sort(porCriadoEm);
}

/** Usuários Servidor ativos dentro do escopo (Administrador vê todos os ativos, qualquer perfil). */
export async function listarUsuariosGerenciaveis(escopo) {
  const filtros = [['status', '==', 'ATIVO']];
  if (escopo.campo) {
    filtros.push(['perfil', '==', ROLES.SERVIDOR], [escopo.campo, '==', escopo.valor]);
  }
  const usuarios = await repo.listar({ filtros });
  return usuarios.sort(porNome);
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

/** Edita nome e/ou perfil de um usuário Servidor já ativo. */
export async function editarUsuario(uid, { nome, perfil }) {
  await repo.atualizar(uid, { nome, perfil });
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
