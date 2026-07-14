/**
 * Serviço de autenticação. Wrapper fino sobre o Firebase Auth — a matriz de
 * permissões por perfil (o que cada perfil pode ver) vive em
 * src/config/roles.js e é aplicada pelo router/AppShell, não aqui.
 */
import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  EmailAuthProvider,
  reauthenticateWithCredential,
  updatePassword,
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';
import { auth } from '../../firebase/auth.js';
import { criarRepositorio } from '../firestoreRepository.js';
import { COLLECTIONS } from '../../config/constants.js';

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
