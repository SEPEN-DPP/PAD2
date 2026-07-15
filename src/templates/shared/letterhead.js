/**
 * Cabeçalho/rodapé institucional, repetido em toda página impressa dos
 * documentos do PAD (ver src/templates/README.md) — layout conforme o
 * modelo oficial fornecido pelo usuário (2026-07-15,
 * "MODELO COM CABEÇALHO.pdf"). Dado puro — quem desenha isso na tela é
 * previewRenderer.js, no PDF é pdfExporter.js, no .doc é docExporter.js.
 */
import { obterUnidadePorNome } from '../../config/unidadesPrisionais.js';

/** Caminho do brasão institucional (conteúdo, portado do PAD V1 — ver docs/reuso-pad-v1.md). */
export const LOGO_URL = '/public/brasao.png';

let logoDataUrlPromise = null;

/**
 * Converte o logo em dataURL (base64) — necessário para embutir em PDF/.doc,
 * que não resolvem URLs relativas. Passa pelo decodificador nativo do
 * navegador (`<img>` + `<canvas>`) em vez de só ler os bytes crus do
 * arquivo: o decodificador de PNG do jsPDF é limitado e rejeita alguns PNGs
 * válidos (`Incomplete or corrupt PNG file`) que o navegador abre sem
 * problema — redesenhar num canvas e reexportar sempre produz um PNG
 * "simples" que o jsPDF aceita. Resultado cacheado entre chamadas.
 */
export function obterLogoDataUrl() {
  if (!logoDataUrlPromise) {
    logoDataUrlPromise = new Promise((resolve, reject) => {
      const imagem = new Image();
      imagem.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = imagem.naturalWidth;
        canvas.height = imagem.naturalHeight;
        canvas.getContext('2d').drawImage(imagem, 0, 0);
        resolve(canvas.toDataURL('image/png'));
      };
      imagem.onerror = () => reject(new Error(`Não foi possível carregar o logo (${LOGO_URL}).`));
      imagem.src = LOGO_URL;
    });
  }
  return logoDataUrlPromise;
}

/** @param {object} pad */
export function montarCabecalho(pad) {
  return {
    linhas: [
      'ESTADO DE SANTA CATARINA',
      'SECRETARIA DE ESTADO DE JUSTIÇA E REINTEGRAÇÃO SOCIAL',
      'DEPARTAMENTO DE POLÍCIA PENAL',
      (pad.dadosGerais?.unidade ?? '').toUpperCase(),
    ].filter(Boolean),
  };
}

/** @param {object} pad */
export function montarRodape(pad) {
  const unidade = obterUnidadePorNome(pad.dadosGerais?.unidade);
  const contato = [unidade?.telefone && `Fone: ${unidade.telefone}`, unidade?.email && `e-mail: ${unidade.email}`]
    .filter(Boolean)
    .join(' / ');
  return {
    linhas: [
      'POLÍCIA PENAL DE SANTA CATARINA',
      unidade?.endereco ?? unidade?.cidade ?? 'Florianópolis',
      contato,
    ].filter(Boolean),
  };
}
