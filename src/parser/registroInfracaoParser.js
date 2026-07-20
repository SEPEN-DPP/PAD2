/**
 * Extração de campos do Registro de Infração a partir do texto já extraído
 * pelo PDF.js (ver pdfParserService.js). Regras determinísticas — sem
 * dependência de IA paga (ver README.md deste diretório e
 * src/ai/README.md).
 *
 * Estratégia: o formulário do i-PEN tem rótulos fixos (`Nome:`, `DATA:`,
 * `Artigo(s):` etc.), mas o valor de um rótulo tanto pode continuar na
 * mesma linha (quando há dois campos por linha, ex. `Prontuário: 750126
 * Nome: Fulano`) quanto na linha seguinte (quando o rótulo ocupa a linha
 * inteira, ex. bloco "DADOS INFRAÇÃO"). Por isso, em vez de regex por
 * campo, localizamos TODOS os rótulos conhecidos no texto e fatiamos cada
 * valor entre o fim do seu rótulo e o início do próximo rótulo encontrado
 * — funciona nos dois casos sem depender de quebras de linha.
 *
 * Mapeamento completo e o que fica de fora do escopo: ver README.md.
 */
import { ARTIGOS_LEP } from '../config/baseLegal.js';

const ROTULOS = [
  { chave: 'prontuario', padrao: /Prontu[aá]rio\s*:/i },
  { chave: 'nome', padrao: /\bNome\s*:/i },
  { chave: 'situacaoPenal', padrao: /Situa[cç][aã]o\s+penal\s*:/i },
  { chave: 'cartaoSus', padrao: /Cart[aã]o\s+SUS\s*:/i },
  { chave: 'unidadePrisional', padrao: /Unidade\s+prisional\s*:/i },
  { chave: 'rgIpen', padrao: /RG\s*i-?PEN\s*:/i },
  { chave: 'naturalidade', padrao: /Naturalidade\s*:/i },
  { chave: 'mae', padrao: /M[aã]e\s*:/i },
  { chave: 'processos', padrao: /Processo\(s\)\s*:/i },
  { chave: 'nascimento', padrao: /Nascimento\s*:/i },
  // Artigo(s) aqui é do(s) processo(s) criminal(is) do incidentado (ex.: Lei
  // de Drogas), NÃO o artigo da falta disciplinar — não faz parte dos 8
  // campos extraídos. Mantido na lista só para delimitar corretamente os
  // campos vizinhos (Nascimento/Ingresso).
  { chave: 'artigosProcessoPenal', padrao: /Artigo\(s\)\s*:/i },
  { chave: 'ingresso', padrao: /Ingresso\s*:/i },
  { chave: 'regime', padrao: /\bRegime\s*:/i },
  { chave: 'comportamento', padrao: /Comportamento\s*:/i },
  { chave: 'residencia', padrao: /Resid[eê]ncia\s*:/i },
  { chave: 'dataInfracao', padrao: /\bDATA\s*:/i },
  { chave: 'infracao', padrao: /UNIDADE\s*\/\s*INFRA[CÇ][AÃ]O\s*:/i },
  { chave: 'grau', padrao: /\bGRAU\s*:/i },
  { chave: 'situacaoInfracao', padrao: /\bSITUA[CÇ][AÃ]O\s*:/i },
  { chave: 'descricaoNarrativa', padrao: /DESCRI[CÇ][AÃ]O\s*:/i },
  // OBSERVAÇÃO não é mais um campo extraído (substituído por `descricao`, ver
  // abaixo) — mantido na lista só para delimitar corretamente o fim do valor
  // de `descricaoNarrativa`, mesma técnica usada em `artigosProcessoPenal`.
  { chave: 'observacoes', padrao: /OBSERVA[CÇ][AÃ]O\s*:/i },
  { chave: 'detentosEnvolvidos', padrao: /DETENTOS\s+ENVOLVIDOS\s*:/i },
  { chave: 'agentesEnvolvidos', padrao: /AGENTES\s+ENVOLVIDOS\s*:/i },
  { chave: 'volumePasta', padrao: /VOLUME\s+DA\s+PASTA\s+NO\s+ARQUIVO\s*:/i },
  { chave: 'folhaInicio', padrao: /FOLHA\s+IN[IÍ]CIO\s*:/i },
  { chave: 'folhaFim', padrao: /FOLHA\s+FIM\s*:/i },
];

/** Localiza a primeira ocorrência de cada rótulo conhecido, em ordem de posição no texto. */
function localizarRotulos(texto) {
  const ocorrencias = [];
  for (const { chave, padrao } of ROTULOS) {
    const encontrado = padrao.exec(texto);
    if (encontrado) {
      ocorrencias.push({ chave, inicio: encontrado.index, fim: encontrado.index + encontrado[0].length });
    }
  }
  return ocorrencias.sort((a, b) => a.inicio - b.inicio);
}

/** Fatia o texto entre o fim do rótulo `chave` e o início do próximo rótulo encontrado. */
function capturarValor(ocorrencias, texto, chave) {
  const indice = ocorrencias.findIndex((o) => o.chave === chave);
  if (indice === -1) return '';
  const atual = ocorrencias[indice];
  const proximo = ocorrencias[indice + 1];
  const bruto = texto.slice(atual.fim, proximo ? proximo.inicio : texto.length);
  return bruto.replace(/\s+/g, ' ').trim();
}

function paraListaDeNomes(valor) {
  return valor
    .split(',')
    .map((nome) => nome.trim())
    .filter(Boolean);
}

function normalizarTexto(valor) {
  return valor
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

function normalizarCampoVazio(valor) {
  return /^nao informad[ao]$/.test(normalizarTexto(valor)) ? null : valor;
}

/**
 * O campo "UNIDADE / INFRAÇÃO:" do i-PEN vem prefixado com um número de
 * controle interno (ex.: "152 TIVER EM SUA POSSE...") que identifica a
 * unidade prisional no cadastro do próprio i-PEN — não faz parte do texto
 * da infração e nunca deve aparecer na tela nem ser gravado no PAD.
 */
function removerCodigoInterno(valor) {
  return valor.replace(/^\d+\s+/, '');
}

/**
 * Identifica a qual inciso do art. 50 da LEP (faltas graves) — ou ao art. 52
 * caput (RDD) — corresponde o texto da infração. O texto cadastrado no i-PEN
 * para cada tipo de infração já segue de perto a redação da LEP, então basta
 * verificar se o texto de um artigo do catálogo está contido no texto
 * extraído (após normalizar acentuação/caixa) — não é uma tentativa de
 * "adivinhar" por palavra-chave. Retorna `null` quando não há
 * correspondência clara, para que a etapa de revisão humana escolha
 * manualmente entre os artigos do catálogo (ver src/config/baseLegal.js).
 */
function identificarArtigoLep(textoInfracao) {
  const normalizado = normalizarTexto(textoInfracao);
  const correspondencias = ARTIGOS_LEP.filter((artigo) => normalizado.includes(normalizarTexto(artigo.texto)));
  if (!correspondencias.length) return null;
  const maisEspecifico = correspondencias.reduce((a, b) => (b.texto.length > a.texto.length ? b : a));
  return { codigo: maisEspecifico.cod, rotulo: maisEspecifico.label };
}

/**
 * @param {{ paginas: string[], textoCompleto: string }} textoExtraido
 * @returns {Promise<{
 *   nomeCompleto: string,
 *   ipen: string,
 *   dataInfracao: string,
 *   infracao: string,
 *   artigoLep: { codigo: string, rotulo: string } | null,
 *   detentosEnvolvidos: string[],
 *   agentesEnvolvidos: string[],
 *   descricao: string | null,
 * }>}
 */
export async function extrairCamposRegistroInfracao(textoExtraido) {
  const texto = textoExtraido.textoCompleto;
  const ocorrencias = localizarRotulos(texto);

  const prontuarioBruto = capturarValor(ocorrencias, texto, 'prontuario');
  const infracaoTexto = removerCodigoInterno(capturarValor(ocorrencias, texto, 'infracao'));

  return {
    nomeCompleto: capturarValor(ocorrencias, texto, 'nome'),
    ipen: prontuarioBruto.match(/\d+/)?.[0] ?? prontuarioBruto,
    // Mantido em dd/mm/aaaa (formato do próprio documento) — nunca converter
    // para "yyyy-mm-dd" e formatar com `new Date(string)`, pois isso é
    // interpretado como meia-noite UTC e mostra o dia anterior em fusos
    // negativos (ver src/utils/dateUtils.js).
    dataInfracao: capturarValor(ocorrencias, texto, 'dataInfracao'),
    infracao: infracaoTexto,
    artigoLep: identificarArtigoLep(infracaoTexto),
    detentosEnvolvidos: paraListaDeNomes(capturarValor(ocorrencias, texto, 'detentosEnvolvidos')),
    agentesEnvolvidos: paraListaDeNomes(capturarValor(ocorrencias, texto, 'agentesEnvolvidos')),
    descricao: normalizarCampoVazio(capturarValor(ocorrencias, texto, 'descricaoNarrativa')),
  };
}
