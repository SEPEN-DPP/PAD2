/**
 * Busca de advogados no índice estático servido pelo Hosting
 * (`public/dados/advogados-busca.json`) — nunca lê o Firestore em massa (ver
 * advogadoCadastroService.js). Compartilhado por src/pages/advogados e pela
 * busca de advogado na aba "Termo de Cientificação"
 * (src/pages/pad/detail/documentos/termoCientificacaoTab.js).
 */
const CAMINHO_INDICE_BUSCA = '/public/dados/advogados-busca.json';

function normalizarTexto(valor) {
  return (valor ?? '')
    .toString()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

let indiceCache = null;

/** Carrega e normaliza o índice de busca uma única vez por sessão do navegador (cache em memória). */
export async function carregarIndiceAdvogados() {
  if (indiceCache) return indiceCache;
  try {
    const resposta = await fetch(CAMINHO_INDICE_BUSCA, { cache: 'no-cache' });
    if (!resposta.ok) return [];
    const bruto = await resposta.json();
    indiceCache = bruto.map((item) => ({
      ...item,
      nomeNormalizado: normalizarTexto(item.nome),
      oabNormalizada: normalizarTexto(item.oab),
    }));
    return indiceCache;
  } catch (erro) {
    console.error('Falha ao carregar índice de busca de advogados:', erro);
    return [];
  }
}

/** Filtra o índice já carregado por substring de nome/OAB (normalizado) — string vazia retorna nenhum resultado. */
export function filtrarIndiceAdvogados(indice, termo) {
  const normalizado = normalizarTexto(termo);
  if (!normalizado) return [];
  return indice.filter((item) => item.nomeNormalizado.includes(normalizado) || item.oabNormalizada.includes(normalizado));
}
