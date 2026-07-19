/**
 * Serviço de acesso a dados de Defensores (advogado constituído ou defensor
 * público) — Portal da Defesa (Fase 6, 2026-07-19). Cada defensor tem uma
 * conta de Firebase Auth própria (perfil vive em `defensores/{uid}`, não em
 * `usuarios/{uid}` — é isso que faz `src/app/app.js` tratá-lo como um
 * contexto de login separado do painel institucional) e pode estar
 * vinculado a mais de um PAD (`padsVinculados`), já que na prática o mesmo
 * advogado/defensor costuma acompanhar vários processos.
 */
import { initializeApp, deleteApp } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js';
import { getAuth, createUserWithEmailAndPassword, sendPasswordResetEmail } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';
import { firebaseConfig } from '../../config/firebaseConfig.local.js';
import { auth } from '../../firebase/auth.js';
import { criarRepositorio } from '../firestoreRepository.js';
import { COLLECTIONS } from '../../config/constants.js';
import { obterPad } from '../pads/padService.js';

const repo = criarRepositorio(COLLECTIONS.DEFENSORES);

export async function obterDefensor(uid) {
  return repo.obterPorId(uid);
}

export async function buscarDefensorPorEmail(email) {
  const encontrados = await repo.listar({ filtros: [['email', '==', email]], limite: 1 });
  return encontrados[0] ?? null;
}

/**
 * Cria a conta de Firebase Auth do defensor sem afetar a sessão institucional
 * já aberta no navegador. `createUserWithEmailAndPassword` no SDK client
 * troca a sessão ativa para a conta recém-criada — por isso a chamada
 * acontece num app Firebase SECUNDÁRIO, descartável, nunca no `auth`
 * principal usado pelo resto do sistema (ver src/firebase/auth.js). Mesmo
 * projeto/config, só uma instância isolada da sessão.
 */
async function criarContaDefensorSemDeslogar(email) {
  const appSecundario = initializeApp(firebaseConfig, `defensor-${Date.now()}`);
  const authSecundario = getAuth(appSecundario);
  try {
    const senhaTemporaria = crypto.randomUUID();
    const credencial = await createUserWithEmailAndPassword(authSecundario, email, senhaTemporaria);
    return credencial.user.uid;
  } finally {
    await deleteApp(appSecundario);
  }
}

/**
 * Vincula um defensor a um PAD — se já existe uma conta com esse e-mail, só
 * adiciona o `padId` a `padsVinculados` (sem criar conta nem mandar convite
 * de novo); senão cria a conta+documento e dispara o e-mail automático de
 * redefinição de senha (gratuito, nativo do Firebase Auth — ver
 * src/services/auth/authService.js:solicitarRedefinicaoSenha).
 * @returns {Promise<{ uid: string, contaNova: boolean }>}
 */
export async function vincularDefensorAoPad({ padId, nome, oab, tipo, email, criadoPor }) {
  const existente = await buscarDefensorPorEmail(email);
  if (existente) {
    const padsVinculados = Array.from(new Set([...(existente.padsVinculados ?? []), padId]));
    await repo.atualizar(existente.id, { padsVinculados });
    return { uid: existente.id, contaNova: false };
  }

  const uid = await criarContaDefensorSemDeslogar(email);
  await repo.criar(
    { nome, oab: oab || null, tipo, email, padsVinculados: [padId], ativo: true, criadoPor },
    uid,
  );
  await sendPasswordResetEmail(auth, email).catch((erro) => {
    // Não interrompe o vínculo se o e-mail automático falhar — o botão de
    // convite manual (mailto/Gmail) continua disponível como reforço.
    console.error('Falha ao enviar e-mail de convite automático:', erro);
  });
  return { uid, contaNova: true };
}

/** Remove só ESTE PAD do defensor — não afeta o acesso dele a outros PADs. */
export async function desvincularDefensorDoPad(uid, padId) {
  const defensor = await obterDefensor(uid);
  if (!defensor) return;
  const padsVinculados = (defensor.padsVinculados ?? []).filter((id) => id !== padId);
  await repo.atualizar(uid, { padsVinculados });
}

/** Kill-switch da conta inteira (todas as PADs) — recurso mais raro, só Administrador. */
export async function revogarAcessoDefensor(uid) {
  await repo.atualizar(uid, { ativo: false });
}

export async function reativarAcessoDefensor(uid) {
  await repo.atualizar(uid, { ativo: true });
}

/** Busca os PADs vinculados ao defensor, ignorando os que não existem mais. */
export async function listarPadsDoDefensor(uid) {
  const defensor = await obterDefensor(uid);
  if (!defensor) return [];
  const pads = await Promise.all((defensor.padsVinculados ?? []).map((padId) => obterPad(padId)));
  return pads.filter(Boolean);
}
