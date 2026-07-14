/**
 * Camada de armazenamento de anexos. Implementa a regra arquitetural central:
 * o BINÁRIO vive no Firebase Storage, o METADADO vive na coleção `anexos`
 * do Firestore — nunca o arquivo dentro do Firestore.
 *
 * Convenção de caminho: /pads/{padId}/eventos/{eventoId}/{anexoId}-{nomeArquivo}
 *
 * Esta é infraestrutura genérica (upload/download/exclusão de blobs). A
 * regra de negócio de "quais tipos de anexo um evento aceita" pertence à
 * Fase 5 (ver ROADMAP.md) e não está implementada aqui.
 */
import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-storage.js';
import { storage } from '../firebase/storage.js';

/** Monta o caminho canônico de um anexo dentro do bucket. */
export function caminhoDoAnexo(padId, eventoId, anexoId, nomeArquivo) {
  return `pads/${padId}/eventos/${eventoId}/${anexoId}-${nomeArquivo}`;
}

/**
 * Envia um arquivo binário para o Storage e retorna o caminho armazenado.
 * O chamador é responsável por gravar o metadado correspondente na coleção
 * `anexos` (ver src/services/anexos/anexoService.js).
 */
export async function enviarAnexo({ padId, eventoId, anexoId, arquivo }) {
  const caminho = caminhoDoAnexo(padId, eventoId, anexoId, arquivo.name);
  const referencia = ref(storage, caminho);
  await uploadBytes(referencia, arquivo);
  return caminho;
}

export async function obterUrlDoAnexo(caminho) {
  return getDownloadURL(ref(storage, caminho));
}

export async function removerAnexo(caminho) {
  await deleteObject(ref(storage, caminho));
}
