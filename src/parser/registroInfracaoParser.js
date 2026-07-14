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
  { chave: 'artigos', padrao: /Artigo\(s\)\s*:/i },
  { chave: 'ingresso', padrao: /Ingresso\s*:/i },
  { chave: 'regime', padrao: /\bRegime\s*:/i },
  { chave: 'comportamento', padrao: /Comportamento\s*:/i },
  { chave: 'residencia', padrao: /Resid[eê]ncia\s*:/i },
  { chave: 'dataInfracao', padrao: /\bDATA\s*:/i },
  { chave: 'infracao', padrao: /UNIDADE\s*\/\s*INFRA[CÇ][AÃ]O\s*:/i },
  { chave: 'grau', padrao: /\bGRAU\s*:/i },
  { chave: 'situacaoInfracao', padrao: /\bSITUA[CÇ][AÃ]O\s*:/i },
  { chave: 'descricaoNarrativa', padrao: /DESCRI[CÇ][AÃ]O\s*:/i },
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

function normalizarCampoVazio(valor) {
  const semAcento = valor
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim();
  return /^nao informad[ao]$/.test(semAcento) ? null : valor;
}

function converterDataBrParaIso(dataBr) {
  const encontrado = dataBr.match(/(\d{2})\/(\d{2})\/(\d{4})/);
  if (!encontrado) return dataBr;
  const [, dia, mes, ano] = encontrado;
  return `${ano}-${mes}-${dia}`;
}

/**
 * @param {{ paginas: string[], textoCompleto: string }} textoExtraido
 * @returns {Promise<{
 *   nomeCompleto: string,
 *   ipen: string,
 *   dataInfracao: string,
 *   infracao: string,
 *   artigos: string[],
 *   detentosEnvolvidos: string[],
 *   agentesEnvolvidos: string[],
 *   observacoes: string | null,
 * }>}
 */
export async function extrairCamposRegistroInfracao(textoExtraido) {
  const texto = textoExtraido.textoCompleto;
  const ocorrencias = localizarRotulos(texto);

  const prontuarioBruto = capturarValor(ocorrencias, texto, 'prontuario');

  return {
    nomeCompleto: capturarValor(ocorrencias, texto, 'nome'),
    ipen: prontuarioBruto.match(/\d+/)?.[0] ?? prontuarioBruto,
    dataInfracao: converterDataBrParaIso(capturarValor(ocorrencias, texto, 'dataInfracao')),
    infracao: capturarValor(ocorrencias, texto, 'infracao'),
    artigos: paraListaDeNomes(capturarValor(ocorrencias, texto, 'artigos')),
    detentosEnvolvidos: paraListaDeNomes(capturarValor(ocorrencias, texto, 'detentosEnvolvidos')),
    agentesEnvolvidos: paraListaDeNomes(capturarValor(ocorrencias, texto, 'agentesEnvolvidos')),
    observacoes: normalizarCampoVazio(capturarValor(ocorrencias, texto, 'observacoes')),
  };
}
