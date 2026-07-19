/**
 * Cadastro de advogados/defensores — diretório de contato institucional
 * (Fase 6+, 2026-07-19), pré-importado de uma planilha real do i-PEN
 * (12.768 registros — ver docs/firestore-schema.md). Independente de ter
 * ou não acesso ao Portal da Defesa (`src/services/defensores`): existe
 * pra QUALQUER advogado conhecido, sirva ele algum PAD ativo ou não.
 * Chave = número da OAB (identificador estável; e-mail nem sempre existe
 * na fonte original).
 */
import { criarRepositorio } from '../firestoreRepository.js';
import { COLLECTIONS } from '../../config/constants.js';

const repo = criarRepositorio(COLLECTIONS.ADVOGADOS_CADASTRO);

/**
 * ~0,6% das OABs da planilha original vêm com sufixo de seccional (ex.:
 * "27249/SC") — a "/" não pode fazer parte de um único segmento de ID no
 * Firestore, então o ID do documento usa uma versão sanitizada. O campo
 * `oab` gravado no documento mantém o valor original (com a barra), que é o
 * que aparece pro usuário.
 */
function idParaOab(oab) {
  return oab.toString().trim().replace(/[\\/]/g, '-');
}

export async function buscarPorOab(oab) {
  return repo.obterPorId(idParaOab(oab));
}

/**
 * Grava um registro novo ou atualiza um existente — usado tanto para
 * completar um cadastro pré-importado incompleto quanto para cadastrar um
 * advogado que não estava na lista original. `dados` deve conter o objeto
 * inteiro (nome, oab, endereco, telefone, email, completo).
 */
export async function criarOuAtualizar(oab, dados) {
  const id = idParaOab(oab);
  const existente = await repo.obterPorId(id);
  if (existente) {
    await repo.atualizar(id, dados);
  } else {
    await repo.criar({ ...dados, oab }, id);
  }
}
