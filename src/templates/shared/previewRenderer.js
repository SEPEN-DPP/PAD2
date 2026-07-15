/**
 * Renderiza o objeto {titulo, secoes, assinaturas, anexos} (contrato de
 * template, ver README.md) como HTML para a pré-visualização em tela.
 *
 * Todo texto dinâmico (digitado por um usuário — depoimentos, fundamentação,
 * observações etc.) é sempre anexado como Node de texto real (nunca como
 * string solta) para nunca passar pelo caminho de "markup confiável" de
 * criarElemento (ver o aviso em src/utils/domUtils.js) — evita que um texto
 * livre começando com "<" seja interpretado como HTML.
 */
import { criarElemento, carregarCssUmaVez } from '../../utils/domUtils.js';
import { montarCabecalho, montarRodape } from './letterhead.js';
import { agruparAssinaturas } from './assinaturas.js';

function texto(valor) {
  return document.createTextNode(valor ?? '');
}

function linhaTexto(tag, valor, attrs = {}) {
  return criarElemento(tag, attrs, [texto(valor)]);
}

function paragrafos(conteudo) {
  const linhas = Array.isArray(conteudo) ? conteudo : [conteudo];
  return linhas.filter(Boolean).map((linha) => linhaTexto('p', linha, { class: 'documento-preview__paragrafo' }));
}

/**
 * @param {object} pad
 * @param {{ titulo: string, subtitulo?: string, secoes: Array<{heading?:string, conteudo:string|string[]}>, assinaturas?: Array<{nome:string,cargo?:string,matricula?:string}>, anexos?: Array<{dataUrl:string, legenda?:string}> }} documento
 */
export function renderizarPreview(pad, documento) {
  carregarCssUmaVez('src/templates/shared/documentoPreview.css');

  const cabecalho = montarCabecalho(pad);
  const rodape = montarRodape(pad);

  const corpo = (documento.secoes ?? []).flatMap((secao) => [
    secao.heading ? linhaTexto('h4', secao.heading, { class: 'documento-preview__heading' }) : null,
    ...paragrafos(secao.conteudo),
  ].filter(Boolean));

  const linhasAssinaturas = agruparAssinaturas(documento.assinaturas ?? []).map((linha) =>
    criarElemento(
      'div',
      { class: 'documento-preview__assinaturas-linha' },
      linha.map((assinatura) =>
        criarElemento(
          'div',
          { class: 'documento-preview__assinatura' },
          [
            criarElemento('div', { class: 'documento-preview__assinatura-tracejado' }),
            linhaTexto('strong', assinatura.nome),
            assinatura.cargo ? linhaTexto('span', assinatura.cargo) : null,
            assinatura.matricula ? linhaTexto('span', `Mat. ${assinatura.matricula}`) : null,
          ].filter(Boolean),
        ),
      ),
    ),
  );

  const anexos = (documento.anexos ?? []).map((anexo) =>
    criarElemento('figure', { class: 'documento-preview__anexo' }, [
      criarElemento('img', { src: anexo.dataUrl, alt: anexo.legenda ?? 'Anexo' }),
      anexo.legenda ? linhaTexto('figcaption', anexo.legenda) : null,
    ].filter(Boolean)),
  );

  return criarElemento(
    'div',
    { class: 'documento-preview' },
    [
      criarElemento('div', { class: 'documento-preview__cabecalho' }, cabecalho.linhas.map((l) => linhaTexto('div', l))),
      linhaTexto('h3', documento.titulo, { class: 'documento-preview__titulo' }),
      documento.subtitulo ? linhaTexto('div', documento.subtitulo, { class: 'documento-preview__subtitulo' }) : null,
      criarElemento('div', { class: 'documento-preview__corpo' }, corpo),
      linhasAssinaturas.length ? criarElemento('div', { class: 'documento-preview__assinaturas' }, linhasAssinaturas) : null,
      anexos.length ? criarElemento('div', { class: 'documento-preview__anexos' }, anexos) : null,
      criarElemento('div', { class: 'documento-preview__rodape' }, rodape.linhas.map((l) => linhaTexto('div', l))),
    ].filter(Boolean),
  );
}
