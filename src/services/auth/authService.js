/**
 * Serviço de autenticação. Wrapper fino sobre o Firebase Auth — a matriz de
 * permissões por perfil (o que cada perfil pode ver) vive em
 * src/config/roles.js e é aplicada pelo router/AppShell, não aqui.
 */
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut,
  onAuthStateChanged,
  EmailAuthProvider,
  reauthenticateWithCredential,
  updatePassword,
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';
import { auth } from '../../firebase/auth.js';
import { criarRepositorio } from '../firestoreRepository.js';
import { COLLECTIONS } from '../../config/constants.js';
import { apenasDigitos } from '../../utils/validationUtils.js';

const usuariosRepo = criarRepositorio(COLLECTIONS.USUARIOS);

export async function entrar(email, senha) {
  const credencial = await signInWithEmailAndPassword(auth, email, senha);
  return credencial.user;
}

export async function sair() {
  await signOut(auth);
}

/** Assina mudanças de estado de autenticação. Retorna a função de unsubscribe. */
export function observarSessao(callback) {
  return onAuthStateChanged(auth, callback);
}

export function usuarioAtual() {
  return auth.currentUser;
}

/**
 * Busca o perfil institucional (perfil/unidade/nome) do usuário autenticado
 * na coleção `usuarios`. Retorna null se o usuário ainda não tem um
 * documento associado (ex.: conta recém-criada aguardando vínculo manual).
 */
export async function obterPerfilDoUsuario(uid) {
  return usuariosRepo.obterPorId(uid);
}

/**
 * Troca a senha do usuário autenticado. O Firebase exige uma reautenticação
 * recente para essa operação, por isso a senha atual é pedida de novo aqui
 * (não dá pra trocar a senha só com a sessão já aberta).
 * @throws {Error} se a senha atual estiver incorreta (auth/invalid-credential)
 *   ou a nova senha não atender aos requisitos mínimos do Firebase.
 */
export async function alterarSenha(senhaAtual, novaSenha) {
  const usuario = auth.currentUser;
  if (!usuario) throw new Error('Nenhum usuário autenticado.');
  const credencial = EmailAuthProvider.credential(usuario.email, senhaAtual);
  await reauthenticateWithCredential(usuario, credencial);
  await updatePassword(usuario, novaSenha);
}

/**
 * Autocadastro (Fase 1, 2026-07-14): cria a conta de autenticação e o
 * próprio documento em `usuarios` com status "PENDENTE" — nunca com
 * `perfil` definido (isso só acontece na aprovação, ver
 * src/pages/usuarios/usuariosPage.js). As regras do Firestore rejeitam a
 * escrita se o `perfil` vier definido aqui.
 * @param {{ nome: string, email: string, senha: string, cpf: string, dataNascimento: string, unidade: string }} dados
 */
export async function registrarSolicitacaoAcesso({ nome, email, senha, cpf, dataNascimento, unidade }) {
  const credencial = await createUserWithEmailAndPassword(auth, email, senha);
  await usuariosRepo.criar(
    {
      nome,
      email,
      cpf: apenasDigitos(cpf),
      dataNascimento,
      unidadeSolicitada: unidade,
      status: 'PENDENTE',
      ativo: false,
    },
    credencial.user.uid,
  );
  return credencial.user;
}

/**
 * Recria o pedido de acesso (status "PENDENTE") para um usuário já
 * autenticado cujo documento em `usuarios` foi excluído (ex.: solicitação
 * recusada antes) — sem precisar criar uma nova conta de autenticação, já
 * que a antiga continua existindo.
 * @param {{ nome: string, cpf: string, dataNascimento: string, unidade: string }} dados
 */
export async function completarSolicitacaoAcesso({ nome, cpf, dataNascimento, unidade }) {
  const usuario = auth.currentUser;
  if (!usuario) throw new Error('Nenhum usuário autenticado.');
  await usuariosRepo.criar(
    {
      nome,
      email: usuario.email,
      cpf: apenasDigitos(cpf),
      dataNascimento,
      unidadeSolicitada: unidade,
      status: 'PENDENTE',
      ativo: false,
    },
    usuario.uid,
  );
}

/**
 * Envia o e-mail de redefinição de senha do Firebase. Usado quando uma
 * solicitação de acesso já existente (conta de autenticação já criada) foi
 * recusada/excluída e a pessoa quer solicitar de novo sem lembrar a senha —
 * ver ROADMAP.md/docs sobre o motivo de não conseguirmos excluir a conta de
 * autenticação em si a partir do app (exigiria Admin SDK/Cloud Functions).
 */
export async function solicitarRedefinicaoSenha(email) {
  await sendPasswordResetEmail(auth, email);
}
