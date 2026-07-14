/**
 * Repositório genérico do Firestore. Encapsula operações de CRUD e consulta
 * que não conhecem nada sobre o domínio (PAD, evento, usuário...). Serviços
 * de domínio (src/services/<dominio>) compõem este repositório em vez de
 * falar diretamente com o SDK do Firestore — isso mantém a troca de
 * provedor de dados isolada em um único lugar.
 *
 * Não contém regra de negócio: apenas leitura/escrita genérica.
 */
import {
  collection,
  doc,
  getDoc,
  getDocs,
  getCountFromServer,
  addDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit as limitTo,
  serverTimestamp,
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';
import { db } from '../firebase/firestore.js';

/** Cria um repositório com operações padrão para uma coleção nomeada. */
export function criarRepositorio(nomeColecao) {
  const colecaoRef = collection(db, nomeColecao);

  return {
    async obterPorId(id) {
      const snap = await getDoc(doc(colecaoRef, id));
      return snap.exists() ? { id: snap.id, ...snap.data() } : null;
    },

    async listar({ filtros = [], ordenarPor, limite } = {}) {
      const clausulas = filtros.map(([campo, op, valor]) => where(campo, op, valor));
      if (ordenarPor) clausulas.push(orderBy(ordenarPor.campo, ordenarPor.direcao ?? 'asc'));
      if (limite) clausulas.push(limitTo(limite));
      const consulta = clausulas.length ? query(colecaoRef, ...clausulas) : colecaoRef;
      const snap = await getDocs(consulta);
      return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    },

    async contar({ filtros = [] } = {}) {
      const clausulas = filtros.map(([campo, op, valor]) => where(campo, op, valor));
      const consulta = clausulas.length ? query(colecaoRef, ...clausulas) : colecaoRef;
      const snap = await getCountFromServer(consulta);
      return snap.data().count;
    },

    async criar(dados, id) {
      const payload = { ...dados, criadoEm: serverTimestamp() };
      if (id) {
        await setDoc(doc(colecaoRef, id), payload);
        return id;
      }
      const ref = await addDoc(colecaoRef, payload);
      return ref.id;
    },

    async atualizar(id, dados) {
      await updateDoc(doc(colecaoRef, id), { ...dados, atualizadoEm: serverTimestamp() });
    },

    async remover(id) {
      await deleteDoc(doc(colecaoRef, id));
    },
  };
}
