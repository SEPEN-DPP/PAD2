/**
 * Serviço de acesso a dados de Eventos (etapas do fluxo processual do PAD).
 * Apenas leitura/listagem genéricas nesta fase — a validação de transição
 * entre etapas é regra de negócio da Fase 2 (ver ROADMAP.md).
 *
 * Recorte por unidade/regional (2026-07-19, auditoria de segurança):
 * `unidade`/`superintendencia` são denormalizados no evento no momento da
 * criação (mesma convenção já usada em `pads.superintendencia`), pra que
 * `listarUltimosEventos` consiga filtrar por unidade sem precisar buscar
 * cada PAD referenciado — mesmo padrão de `padService.js:filtroDeUnidades`.
 * Antes disso, a consulta era global (sem filtro nenhum) e a regra do
 * Firestore liberava para qualquer sessão autenticada — a combinação vazava
 * o histórico de eventos de todas as unidades para qualquer conta.
 */
import { criarRepositorio } from '../firestoreRepository.js';
import { COLLECTIONS } from '../../config/constants.js';

const repo = criarRepositorio(COLLECTIONS.EVENTOS);

/** Monta o filtro de unidade a partir da lista calculada por escopoPad.js (null = sem filtro, vê tudo). */
function filtroDeUnidades(unidades) {
  return unidades ? [['unidade', 'in', unidades]] : [];
}

/**
 * `unidade`/`superintendencia` são opcionais só na assinatura — na prática,
 * qualquer chamador que não seja Administrador PRECISA passá-los, senão a
 * consulta é rejeitada pelo Firestore. Isso acontece porque a regra de
 * leitura de `eventos` depende de campos que não estão no filtro `padId`
 * sozinho — o Firestore só permite uma consulta em lista se ela for
 * "comprovadamente segura" a partir dos seus próprios filtros (não avalia
 * documento por documento como faz num `get()` de um só). Sem esse filtro
 * extra, a consulta falharia pra qualquer perfil que não seja Administrador
 * (cujo ramo da regra não depende de `resource.data`, e por isso não precisa
 * do filtro pra ser comprovado).
 */
export async function listarEventosPorPad(padId, unidade, superintendencia) {
  return repo.listar({
    filtros: [
      ['padId', '==', padId],
      ...(unidade ? [['unidade', '==', unidade]] : []),
      ...(superintendencia ? [['superintendencia', '==', superintendencia]] : []),
    ],
    ordenarPor: { campo: 'data', direcao: 'asc' },
  });
}

export async function listarUltimosEventos(limite = 10, unidades) {
  return repo.listar({
    filtros: filtroDeUnidades(unidades),
    ordenarPor: { campo: 'data', direcao: 'desc' },
    limite,
  });
}

export async function obterEvento(id) {
  return repo.obterPorId(id);
}

/**
 * Registra um evento (etapa do fluxo) para um PAD já existente.
 * @param {{ padId: string, tipo: string, responsavel: string, data: Date, status: string, observacoes?: string, unidade: string, superintendencia?: string|null }} dados
 */
export async function criarEvento({ padId, tipo, responsavel, data, status, observacoes, unidade, superintendencia }) {
  return repo.criar({
    padId, tipo, responsavel, data, status,
    observacoes: observacoes ?? '',
    unidade,
    superintendencia: superintendencia ?? null,
  });
}

/**
 * Remove todos os eventos de um PAD — chamado por `excluirPad` (ver
 * padService.js) ANTES de excluir o próprio PAD (a regra de exclusão de
 * evento precisa conseguir consultar o PAD ainda existente para autorizar).
 * `unidade`/`superintendencia` vêm do próprio PAD sendo excluído — ver
 * `listarEventosPorPad` sobre por que são necessários aqui.
 */
export async function excluirEventosPorPad(padId, unidade, superintendencia) {
  const eventos = await listarEventosPorPad(padId, unidade, superintendencia);
  await Promise.all(eventos.map((evento) => repo.remover(evento.id)));
}
