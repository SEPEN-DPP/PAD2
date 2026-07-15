import { test } from 'node:test';
import assert from 'node:assert/strict';
import { extrairCamposRegistroInfracao } from '../../src/parser/registroInfracaoParser.js';

/**
 * Texto reconstruído a partir de um Registro de Infração/Punição real do
 * i-PEN (modelo fornecido pelo usuário em 2026-07-14), preservando a
 * estrutura de linhas típica da extração via PDF.js (ver
 * src/parser/pdfParserService.js). Nomes e números são do exemplo original.
 */
const TEXTO_MODELO = `ESTADO DE SANTA CATARINA
Secretaria de Estado de Justiça e Reintegração Social
POLÍCIA PENAL DE SANTA CATARINA
Sistema de Identificação e Administração Penal
Unidade: 152 FLORIANÓPOLIS - PENITENCIÁRIA
INFRAÇÃO/PUNIÇÃO
Impresso em 26/05/2026 17:36:36
Prontuário: 750126 ATIVO Nome: CRISTIAN NELSON CONCEIÇÃO SOUZA
Situação penal: RECOLHIDO(A) Cartão SUS: não informado
Unidade prisional: 152 FLORIANÓPOLIS - PENITENCIÁRIA
RG i-PEN: 12181418918 SC Naturalidade: FLORIANÓPOLIS - SC FRENTE
Mãe: ANDREZA DA SILVA CONCEIÇÃO Processo(s): 2
Nascimento: 14/12/2000 - 25 anos Artigo(s): 33, 33
Ingresso: 07/06/2024 Regime: Fechado (incidente
disciplinar)
Comportamento: Bom Residência: Ala: M - Gal: I - Bloco:
D - Piso: 1 - Norte Dentro: 102
DADOS INFRAÇÃO
DATA:
25/05/2026
UNIDADE / INFRAÇÃO:
152 TIVER EM SUA POSSE, UTILIZAR OU FORNECER APARELHO TELEFÔNICO, DE
RÁDIO OU SIMILAR, QUE PERMITA A COMUNICAÇÃO COM OUTROS PRESOS OU COM
O AMBIENTE EXTERNO
GRAU: SITUAÇÃO:
GRAVE CARACTERIZADA E INCIDENTE DISCIPLINAR EM
ANDAMENTO
DESCRIÇÃO:
INFORMAMOS QUE NA PRESENTE DATA, POR VOLTA DAS 11:00 H, POR OCASIÃO DO ENCERRAMENTO DA
VISITA CONJUGAL. É O RELATO.
OBSERVAÇÃO:
NÃO INFORMADA
DETENTOS ENVOLVIDOS:
AGENTES ENVOLVIDOS:
MARCELO FAUTH PIANA, RAFAÉL COELHO, DANIEL LIMA
VOLUME DA PASTA NO
ARQUIVO: FOLHA INÍCIO: FOLHA FIM:
NÃO INFORMADO NÃO INFORMADA NÃO INFORMADA`;

test('extrai os 8 campos do Registro de Infração a partir do modelo real', async () => {
  const resultado = await extrairCamposRegistroInfracao({
    paginas: [TEXTO_MODELO],
    textoCompleto: TEXTO_MODELO,
  });

  assert.equal(resultado.nomeCompleto, 'CRISTIAN NELSON CONCEIÇÃO SOUZA');
  assert.equal(resultado.ipen, '750126'); // Prontuário — não confundir com RG i-PEN
  assert.equal(resultado.dataInfracao, '25/05/2026'); // mantido em dd/mm/aaaa, nunca convertido para ISO
  // "152" é um número de controle interno do i-PEN (referente à unidade), não
  // parte do texto da infração — nunca deve aparecer no campo extraído.
  assert.match(resultado.infracao, /^TIVER EM SUA POSSE/);
  assert.deepEqual(resultado.artigoLep, { codigo: 'art50_vii', rotulo: 'Art. 50, VII — LEP' });
  assert.deepEqual(resultado.detentosEnvolvidos, []);
  assert.deepEqual(resultado.agentesEnvolvidos, ['MARCELO FAUTH PIANA', 'RAFAÉL COELHO', 'DANIEL LIMA']);
  assert.equal(resultado.observacoes, null);
});

test('normaliza "NÃO INFORMADO" para null em observações', async () => {
  const texto = 'Nome: FULANO DE TAL\nOBSERVAÇÃO:\nNÃO INFORMADO\nDETENTOS ENVOLVIDOS:';
  const resultado = await extrairCamposRegistroInfracao({ paginas: [texto], textoCompleto: texto });
  assert.equal(resultado.observacoes, null);
});

test('divide listas de nomes separadas por vírgula e ignora campos vazios', async () => {
  const texto = 'AGENTES ENVOLVIDOS:\nFULANO DA SILVA, CICLANO PEREIRA\nDETENTOS ENVOLVIDOS:\n';
  const resultado = await extrairCamposRegistroInfracao({ paginas: [texto], textoCompleto: texto });
  assert.deepEqual(resultado.agentesEnvolvidos, ['FULANO DA SILVA', 'CICLANO PEREIRA']);
  assert.deepEqual(resultado.detentosEnvolvidos, []);
});

test('identifica o art. 52 (RDD) quando o texto da infração corresponde', async () => {
  const texto =
    'UNIDADE / INFRAÇÃO:\n120 PRATICAR FATO PREVISTO COMO CRIME DOLOSO CONSTITUINDO INFRAÇÃO DISCIPLINAR GRAVE E QUANDO OCASIONAR SUBVERSÃO DA ORDEM OU DISCIPLINA INTERNAS\nGRAU:';
  const resultado = await extrairCamposRegistroInfracao({ paginas: [texto], textoCompleto: texto });
  assert.deepEqual(resultado.artigoLep, { codigo: 'art52', rotulo: 'Art. 52 — LEP' });
});

test('retorna artigoLep nulo quando o texto da infração não corresponde a nenhum artigo conhecido', async () => {
  const texto = 'UNIDADE / INFRAÇÃO:\nALGO QUE NÃO ESTÁ NO CATÁLOGO\nGRAU:';
  const resultado = await extrairCamposRegistroInfracao({ paginas: [texto], textoCompleto: texto });
  assert.equal(resultado.artigoLep, null);
});

test('nunca converte a data da infração para ISO (evita bug de fuso horário)', async () => {
  const texto = 'DATA:\n01/01/2026\nUNIDADE / INFRAÇÃO:';
  const resultado = await extrairCamposRegistroInfracao({ paginas: [texto], textoCompleto: texto });
  assert.equal(resultado.dataInfracao, '01/01/2026');
});
