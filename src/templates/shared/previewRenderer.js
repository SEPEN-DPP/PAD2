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
import { montarCabecalho, montarRodape, LOGO_URL } from './letterhead.js';
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
  const semCabecalho = Boolean(documento.semCabecalho);

  const numeroELinha = documento.numeroELinha
    ? criarElemento('div', { class: 'documento-preview__numero-data' }, [
      linhaTexto('span', documento.numeroELinha.numero),
      linhaTexto('span', documento.numeroELinha.data),
    ])
    : null;

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

  const destinatario = documento.destinatario
    ? criarElemento('div', { class: 'documento-preview__destinatario' }, [
      linhaTexto('p', 'Destinatário (fixo no rodapé da 1ª página do PDF):', { class: 'documento-preview__destinatario-rotulo' }),
      ...documento.destinatario.linhas.map((l, i) => linhaTexto('div', l, i === 1 ? { class: 'documento-preview__destinatario-nome' } : {})),
    ])
    : null;

  return criarElemento(
    'div',
    { class: `documento-preview${semCabecalho ? ' documento-preview--sem-cabecalho' : ''}` },
    [
      semCabecalho ? null : criarElemento('div', { class: 'documento-preview__cabecalho' }, [
        criarElemento('img', { src: LOGO_URL, alt: 'Brasão', class: 'documento-preview__logo' }),
        criarElemento('div', { class: 'documento-preview__cabecalho-texto' }, cabecalho.linhas.map((l) => linhaTexto('div', l))),
      ]),
      documento.titulo ? linhaTexto('h3', documento.titulo, { class: 'documento-preview__titulo' }) : null,
      documento.subtitulo ? linhaTexto('div', documento.subtitulo, { class: 'documento-preview__subtitulo' }) : null,
      numeroELinha,
      criarElemento('div', { class: 'documento-preview__corpo' }, corpo),
      linhasAssinaturas.length ? criarElemento('div', { class: 'documento-preview__assinaturas' }, linhasAssinaturas) : null,
      anexos.length ? criarElemento('div', { class: 'documento-preview__anexos' }, anexos) : null,
      destinatario,
      semCabecalho ? null : criarElemento('div', { class: 'documento-preview__rodape' }, rodape.linhas.map((l) => linhaTexto('div', l))),
    ].filter(Boolean),
  );
}
