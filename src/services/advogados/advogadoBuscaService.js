/**
 * Busca de advogados: combina o índice estático servido pelo Hosting
 * (`public/dados/advogados-busca.json`, ~12.768 registros pré-importados —
 * nunca lê o Firestore em massa pra isso) com uma consulta ao vivo no
 * Firestore por prefixo de nome/OAB (2026-07-20) — o índice estático só é
 * gerado por um script externo rodado manualmente uma vez (ver
 * docs/firestore-schema.md), então qualquer advogado cadastrado ou editado
 * pelo próprio app (`advogadoCadastroService.js:criarOuAtualizar`, que grava
 * `nomeNormalizado`/`oabNormalizada` a cada escrita) nunca apareceria na
 * busca sem essa consulta complementar — só ficaria visível depois de
 * alguém reexportar e publicar o índice inteiro, o que nunca chegou a
 * acontecer neste projeto. A consulta ao vivo é por prefixo, não por
 * substring — mais restrita que o índice estático, mas sem precisar ler a
 * coleção inteira (custo proporcional ao resultado, não ao total de
 * registros). Compartilhado por src/pages/advogados e pela busca de
 * advogado na aba "Termo de Cientificação"
 * (src/pages/pad/detail/documentos/termoCientificacaoTab.js).
 */
import { criarRepositorio } from '../firestoreRepository.js';
import { COLLECTIONS } from '../../config/constants.js';

const repoCadastro = criarRepositorio(COLLECTIONS.ADVOGADOS_CADASTRO);

const CAMINHO_INDICE_BUSCA = '/public/dados/advogados-busca.json';

export function normalizarTexto(valor) {
  return (valor ?? '')
    .toString()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

// Maior code point do plano multilingue basico do Unicode (0xF8FF, area de
// uso privado) -- somado ao fim de um prefixo, vira um range >=/<= que
// cobre "tudo que comeca com X" numa consulta do Firestore.
const CODIGO_SENTINELA_FIM_PREFIXO = 0xf8ff;
const SENTINELA_FIM_PREFIXO = String.fromCharCode(CODIGO_SENTINELA_FIM_PREFIXO);

/** Range de prefixo pra consulta no Firestore (funciona sem índice composto — é filtro de um campo só). */
function filtroDePrefixo(campo, termoNormalizado) {
  return [
    [campo, '>=', termoNormalizado],
    [campo, '<=', termoNormalizado + SENTINELA_FIM_PREFIXO],
  ];
}

/** Consulta ao vivo por prefixo de nome OU OAB — só pega o que o índice estático (desatualizado por natureza) ainda não tem. */
async function buscarAdvogadosAoVivo(termoNormalizado) {
  const [porNome, porOab] = await Promise.all([
    repoCadastro.listar({ filtros: filtroDePrefixo('nomeNormalizado', termoNormalizado), limite: 8 }),
    repoCadastro.listar({ filtros: filtroDePrefixo('oabNormalizada', termoNormalizado), limite: 8 }),
  ]);
  const porId = new Map([...porNome, ...porOab].map((item) => [item.id, item]));
  return [...porId.values()];
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

/**
 * Busca combinada: índice estático (substring, instantâneo) + Firestore ao
 * vivo (prefixo, cobre o que foi cadastrado/editado depois da última
 * exportação do índice) — dedupe por OAB, índice estático primeiro (já
 * carregado, aparece na hora; os resultados ao vivo chegam alguns
 * milissegundos depois, ver debounce em quem chama isto).
 * @param {object[]} indiceEstatico — de carregarIndiceAdvogados()
 * @param {string} termo
 */
export async function buscarAdvogados(indiceEstatico, termo) {
  const normalizado = normalizarTexto(termo);
  if (!normalizado) return [];

  const doEstatico = filtrarIndiceAdvogados(indiceEstatico, termo);
  const aoVivo = await buscarAdvogadosAoVivo(normalizado);

  const porOab = new Map(doEstatico.map((item) => [item.oab, item]));
  for (const item of aoVivo) {
    if (!porOab.has(item.oab)) porOab.set(item.oab, item);
  }
  return [...porOab.values()];
}
