/**
 * Geração de PDF real (jsPDF) a partir do contrato {titulo, secoes,
 * assinaturas, anexos} — único arquivo do projeto que importa jsPDF (ver
 * README.md). Nenhum template chama `addPage()` diretamente: o cursor de
 * página é todo gerenciado aqui, com cabeçalho/rodapé redesenhados a cada
 * quebra.
 */
import { jsPDF } from 'https://cdn.jsdelivr.net/npm/jspdf@2.5.2/+esm';
import { montarCabecalho, montarRodape } from './letterhead.js';
import { agruparAssinaturas } from './assinaturas.js';

const MARGEM = 20; // mm
const LARGURA_PAGINA = 210; // A4
const ALTURA_PAGINA = 297;
const LARGURA_UTIL = LARGURA_PAGINA - MARGEM * 2;
const ALTURA_RODAPE_RESERVADA = 18;
const LIMITE_INFERIOR = ALTURA_PAGINA - MARGEM - ALTURA_RODAPE_RESERVADA;

function desenharCabecalho(doc, cabecalho) {
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  let y = MARGEM;
  for (const linha of cabecalho.linhas) {
    doc.text(linha, LARGURA_PAGINA / 2, y, { align: 'center' });
    y += 5;
  }
  doc.setDrawColor(180);
  doc.line(MARGEM, y + 2, LARGURA_PAGINA - MARGEM, y + 2);
  return y + 10;
}

function desenharRodape(doc, rodape) {
  const yLinha = ALTURA_PAGINA - MARGEM - ALTURA_RODAPE_RESERVADA + 4;
  doc.setDrawColor(180);
  doc.line(MARGEM, yLinha, LARGURA_PAGINA - MARGEM, yLinha);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  let y = yLinha + 5;
  for (const linha of rodape.linhas) {
    doc.text(linha, LARGURA_PAGINA / 2, y, { align: 'center' });
    y += 4;
  }
}

/** Gerencia o cursor Y de uma página e quebra + redesenha cabeçalho/rodapé quando necessário. */
class EscritorPdf {
  constructor(doc, cabecalho, rodape) {
    this.doc = doc;
    this.cabecalho = cabecalho;
    this.rodape = rodape;
    this.y = desenharCabecalho(doc, cabecalho);
  }

  quebrarSeNecessario(alturaNecessaria) {
    if (this.y + alturaNecessaria > LIMITE_INFERIOR) {
      desenharRodape(this.doc, this.rodape);
      this.doc.addPage();
      this.y = desenharCabecalho(this.doc, this.cabecalho);
    }
  }

  titulo(texto) {
    this.quebrarSeNecessario(10);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setFontSize(13);
    this.doc.text(texto, LARGURA_PAGINA / 2, this.y, { align: 'center' });
    this.y += 8;
  }

  subtitulo(texto) {
    this.quebrarSeNecessario(8);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setFontSize(11);
    this.doc.text(texto, LARGURA_PAGINA / 2, this.y, { align: 'center' });
    this.y += 9;
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
  return `${titulo.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^\w]+/g, '_')}.${extensao}`;
}

/**
 * Gera e baixa o PDF de um único documento.
 * @param {object} pad
 * @param {object} documento — retorno de `renderizar(pad, ...)` de um template
 */
export function baixarComoPdf(pad, documento, nomeArquivo) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const escritor = new EscritorPdf(doc, montarCabecalho(pad), montarRodape(pad));
  escreverDocumento(escritor, documento);
  desenharRodape(doc, montarRodape(pad));
  numerarPaginas(doc);
  doc.save(nomeArquivo ?? nomeArquivoPadrao(documento.titulo, 'pdf'));
}

/** Concatena vários documentos (um por página inicial) num único PDF — usado por "Baixar todos". */
export function baixarTodosComoPdf(pad, documentos, nomeArquivo) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const cabecalho = montarCabecalho(pad);
  const rodape = montarRodape(pad);
  let escritor = new EscritorPdf(doc, cabecalho, rodape);
  documentos.forEach((documento, indice) => {
    if (indice > 0) {
      desenharRodape(doc, rodape);
      doc.addPage();
      escritor.y = desenharCabecalho(doc, cabecalho);
    }
    escreverDocumento(escritor, documento);
  });
  desenharRodape(doc, rodape);
  numerarPaginas(doc);
  doc.save(nomeArquivo ?? 'PAD_documentos.pdf');
}
