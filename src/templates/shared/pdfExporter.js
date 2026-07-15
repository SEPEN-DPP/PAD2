/**
 * Geração de PDF real (jsPDF) a partir do contrato {titulo, secoes,
 * assinaturas, anexos, destinatario, semCabecalho} — único arquivo do
 * projeto que importa jsPDF (ver README.md). Nenhum template chama
 * `addPage()` diretamente: o cursor de página é todo gerenciado aqui, com
 * cabeçalho/rodapé redesenhados a cada quebra, conforme o modelo oficial
 * fornecido pelo usuário (2026-07-15, "MODELO COM CABEÇALHO.pdf").
 */
import { jsPDF } from 'https://cdn.jsdelivr.net/npm/jspdf@2.5.2/+esm';
import { montarCabecalho, montarRodape, obterLogoDataUrl } from './letterhead.js';
import { agruparAssinaturas } from './assinaturas.js';

const MARGEM = 20; // mm
const LARGURA_PAGINA = 210; // A4
const ALTURA_PAGINA = 297;
const LARGURA_UTIL = LARGURA_PAGINA - MARGEM * 2;
const ALTURA_RODAPE_RESERVADA = 18;
const LIMITE_INFERIOR_PADRAO = ALTURA_PAGINA - MARGEM - ALTURA_RODAPE_RESERVADA;
const ALTURA_LOGO = 16;
const LARGURA_LOGO = 16;
// Bloco de destinatário fixo (só quando o template devolve `destinatario`) —
// "O destinatário deve estar fixo nas últimas linhas da primeira página",
// então reservamos essa altura a menos na página 1 e desenhamos por cima
// no final, depois de todo o resto já escrito (ver `desenharDestinatario`).
const ALTURA_DESTINATARIO_RESERVADA = 32;

function desenharCabecalho(doc, cabecalho, logoDataUrl) {
  const xTexto = logoDataUrl ? MARGEM + LARGURA_LOGO + 4 : MARGEM;
  if (logoDataUrl) {
    doc.addImage(logoDataUrl, 'PNG', MARGEM, MARGEM - 2, LARGURA_LOGO, ALTURA_LOGO);
  }
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  let y = MARGEM + 2;
  for (const linha of cabecalho.linhas) {
    doc.text(linha, xTexto, y);
    y += 4.5;
  }
  const yFimLogo = MARGEM - 2 + ALTURA_LOGO;
  const yFinal = Math.max(y, yFimLogo);
  doc.setDrawColor(180);
  doc.line(MARGEM, yFinal + 3, LARGURA_PAGINA - MARGEM, yFinal + 3);
  return yFinal + 9;
}

function desenharRodape(doc, rodape) {
  const yLinha = ALTURA_PAGINA - MARGEM - ALTURA_RODAPE_RESERVADA + 4;
  doc.setDrawColor(180);
  doc.line(MARGEM, yLinha, LARGURA_PAGINA - MARGEM, yLinha);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text(rodape.linhas[0] ?? '', LARGURA_PAGINA / 2, yLinha + 5, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  let y = yLinha + 9;
  for (const linha of rodape.linhas.slice(1)) {
    doc.text(linha, LARGURA_PAGINA / 2, y, { align: 'center' });
    y += 4;
  }
}

/** Bloco fixo "Ao(à) Senhor(a) / NOME / Função / Cidade", sempre nas últimas linhas da página 1. */
function desenharDestinatario(doc, destinatario) {
  let y = ALTURA_PAGINA - MARGEM - ALTURA_RODAPE_RESERVADA - ALTURA_DESTINATARIO_RESERVADA + 6;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10.5);
  destinatario.linhas.forEach((linha, indice) => {
    doc.setFont('helvetica', indice === 1 ? 'bold' : 'normal');
    doc.text(linha, MARGEM, y);
    y += 5.5;
  });
}

/** Gerencia o cursor Y de uma página e quebra + redesenha cabeçalho/rodapé quando necessário. */
class EscritorPdf {
  constructor(doc, cabecalho, rodape, { logoDataUrl, semCabecalho = false, temDestinatario = false } = {}) {
    this.doc = doc;
    this.cabecalho = cabecalho;
    this.rodape = rodape;
    this.logoDataUrl = logoDataUrl;
    this.semCabecalho = semCabecalho;
    this.temDestinatario = temDestinatario;
    this.y = semCabecalho ? MARGEM : desenharCabecalho(doc, cabecalho, logoDataUrl);
  }

  get limiteInferior() {
    const naPaginaUm = this.doc.internal.getCurrentPageInfo().pageNumber === 1;
    if (this.semCabecalho) return ALTURA_PAGINA - MARGEM;
    return naPaginaUm && this.temDestinatario
      ? LIMITE_INFERIOR_PADRAO - ALTURA_DESTINATARIO_RESERVADA
      : LIMITE_INFERIOR_PADRAO;
  }

  quebrarSeNecessario(alturaNecessaria) {
    if (this.y + alturaNecessaria > this.limiteInferior) {
      if (!this.semCabecalho) desenharRodape(this.doc, this.rodape);
      this.doc.addPage();
      this.y = this.semCabecalho ? MARGEM : desenharCabecalho(this.doc, this.cabecalho, this.logoDataUrl);
    }
  }

  titulo(texto) {
    if (!texto) return;
    this.quebrarSeNecessario(10);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setFontSize(13);
    this.doc.text(texto, LARGURA_PAGINA / 2, this.y, { align: 'center' });
    this.y += 8;
  }

  subtitulo(texto) {
    if (!texto) return;
    this.quebrarSeNecessario(8);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setFontSize(11);
    this.doc.text(texto, LARGURA_PAGINA / 2, this.y, { align: 'center' });
    this.y += 9;
  }

  /** Linha "Ofício n.º X" (esquerda) + "Cidade, data." (direita) — convenção de ofício, ver modelo oficial. */
  linhaNumeroData(numero, dataTexto) {
    this.quebrarSeNecessario(10);
    this.doc.setFont('helvetica', 'normal');
    this.doc.setFontSize(10.5);
    this.doc.text(numero, MARGEM, this.y);
    this.doc.text(dataTexto, LARGURA_PAGINA - MARGEM, this.y, { align: 'right' });
    this.y += 10;
  }

  heading(texto) {
    this.quebrarSeNecessario(9);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setFontSize(11);
    this.doc.text(texto, MARGEM, this.y);
    this.y += 7;
  }

  paragrafo(texto) {
    if (!texto) return;
    this.doc.setFont('helvetica', 'normal');
    this.doc.setFontSize(10.5);
    const linhas = this.doc.splitTextToSize(texto, LARGURA_UTIL);
    for (const linha of linhas) {
      this.quebrarSeNecessario(6);
      this.doc.text(linha, MARGEM, this.y);
      this.y += 5.5;
    }
    this.y += 3;
  }

  espacamento(mm) {
    this.y += mm;
  }

  assinaturas(linha) {
    const alturaBloco = 22;
    this.quebrarSeNecessario(alturaBloco);
    const largura = LARGURA_UTIL / linha.length;
    linha.forEach((assinatura, indice) => {
      const x = MARGEM + indice * largura;
      const xCentro = x + largura / 2;
      this.doc.setDrawColor(80);
      this.doc.line(x + 8, this.y, x + largura - 8, this.y);
      this.doc.setFont('helvetica', 'bold');
      this.doc.setFontSize(9.5);
      this.doc.text(assinatura.nome ?? '', xCentro, this.y + 5, { align: 'center', maxWidth: largura - 10 });
      this.doc.setFont('helvetica', 'normal');
      let y = this.y + 9;
      if (assinatura.cargo) {
        this.doc.text(assinatura.cargo, xCentro, y, { align: 'center' });
        y += 4;
      }
      if (assinatura.matricula) {
        this.doc.text(`Mat. ${assinatura.matricula}`, xCentro, y, { align: 'center' });
      }
    });
    this.y += alturaBloco;
  }

  /** @param {string} dataUrl @param {string} [legenda] */
  imagem(dataUrl, legenda) {
    const alturaImg = 150;
    this.quebrarSeNecessario(alturaImg + 10);
    const formato = dataUrl.startsWith('data:image/png') ? 'PNG' : 'JPEG';
    this.doc.addImage(dataUrl, formato, MARGEM, this.y, LARGURA_UTIL, alturaImg, undefined, 'FAST');
    this.y += alturaImg + 4;
    if (legenda) {
      this.doc.setFont('helvetica', 'italic');
      this.doc.setFontSize(8);
      this.doc.text(legenda, LARGURA_PAGINA / 2, this.y, { align: 'center' });
      this.y += 6;
    }
  }
}

function escreverDocumento(escritor, documento) {
  escritor.titulo(documento.titulo);
  if (documento.subtitulo) escritor.subtitulo(documento.subtitulo);
  if (documento.numeroELinha) escritor.linhaNumeroData(documento.numeroELinha.numero, documento.numeroELinha.data);
  for (const secao of documento.secoes ?? []) {
    if (secao.heading) escritor.heading(secao.heading);
    const linhas = Array.isArray(secao.conteudo) ? secao.conteudo : [secao.conteudo];
    for (const linha of linhas.filter(Boolean)) escritor.paragrafo(linha);
  }
  if (documento.assinaturas?.length) {
    escritor.espacamento(8);
    for (const linha of agruparAssinaturas(documento.assinaturas)) escritor.assinaturas(linha);
  }
  for (const anexo of documento.anexos ?? []) escritor.imagem(anexo.dataUrl, anexo.legenda);
}

function numerarPaginas(doc) {
  const total = doc.internal.getNumberOfPages();
  for (let pagina = 1; pagina <= total; pagina += 1) {
    doc.setPage(pagina);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text(`Página ${pagina} de ${total}`, LARGURA_PAGINA - MARGEM, ALTURA_PAGINA - MARGEM + 4, { align: 'right' });
  }
}

function nomeArquivoPadrao(titulo, extensao) {
  return `${(titulo || 'documento').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^\w]+/g, '_')}.${extensao}`;
}

async function obterLogoSeNecessario(semCabecalho) {
  if (semCabecalho) return null;
  try {
    return await obterLogoDataUrl();
  } catch {
    return null; // segue sem logo em vez de quebrar a exportação
  }
}

/**
 * Gera e baixa o PDF de um único documento.
 * @param {object} pad
 * @param {object} documento — retorno de `renderizar(pad, ...)` de um template
 */
export async function baixarComoPdf(pad, documento, nomeArquivo) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const logoDataUrl = await obterLogoSeNecessario(documento.semCabecalho);
  const escritor = new EscritorPdf(doc, montarCabecalho(pad), montarRodape(pad), {
    logoDataUrl,
    semCabecalho: documento.semCabecalho,
    temDestinatario: Boolean(documento.destinatario),
  });
  escreverDocumento(escritor, documento);
  if (!documento.semCabecalho) desenharRodape(doc, montarRodape(pad));
  if (documento.destinatario) {
    doc.setPage(1);
    desenharDestinatario(doc, documento.destinatario);
  }
  numerarPaginas(doc);
  doc.save(nomeArquivo ?? nomeArquivoPadrao(documento.titulo, 'pdf'));
}

/** Concatena vários documentos (um por página inicial) num único PDF — usado por "Baixar todos". */
export async function baixarTodosComoPdf(pad, documentos, nomeArquivo) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const logoDataUrl = await obterLogoDataUrl().catch(() => null);
  const cabecalho = montarCabecalho(pad);
  const rodape = montarRodape(pad);
  let escritor = new EscritorPdf(doc, cabecalho, rodape, { logoDataUrl });
  documentos.forEach((documento, indice) => {
    if (indice > 0) {
      if (!escritor.semCabecalho) desenharRodape(doc, rodape);
      doc.addPage();
      escritor = new EscritorPdf(doc, cabecalho, rodape, {
        logoDataUrl,
        semCabecalho: documento.semCabecalho,
        temDestinatario: Boolean(documento.destinatario),
      });
    }
    escreverDocumento(escritor, documento);
  });
  if (!escritor.semCabecalho) desenharRodape(doc, rodape);
  numerarPaginas(doc);
  doc.save(nomeArquivo ?? 'PAD_documentos.pdf');
}
