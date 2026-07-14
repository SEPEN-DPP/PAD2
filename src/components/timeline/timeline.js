/**
 * Timeline vertical de eventos/atividades. Usada no Dashboard e no detalhe
 * do PAD. Recebe itens já formatados — não busca dados sozinha.
 */
import { criarElemento, carregarCssUmaVez } from '../../utils/domUtils.js';
import { tempoRelativo } from '../../utils/dateUtils.js';

/**
 * @param {Array<{ titulo: string, descricao?: string, data: string, status?: string }>} itens
 */
export function criarTimeline(itens) {
  carregarCssUmaVez('src/components/timeline/timeline.css');

  if (!itens.length) {
    return criarElemento('p', { class: 'timeline__vazio text-muted' }, [
      'Nenhuma atividade registrada ainda.',
    ]);
  }

  const lista = criarElemento(
    'ul',
    { class: 'timeline' },
    itens.map((item) =>
      criarElemento('li', { class: 'timeline__item' }, [
        criarElemento('span', { class: 'timeline__marcador' }),
        criarElemento('div', { class: 'timeline__conteudo' }, [
          criarElemento('div', { class: 'timeline__linha-topo' }, [
            criarElemento('span', { class: 'timeline__titulo' }, [item.titulo]),
            criarElemento('span', { class: 'timeline__data text-muted' }, [
              tempoRelativo(item.data),
            ]),
          ]),
          item.descricao
            ? criarElemento('span', { class: 'timeline__descricao text-muted' }, [item.descricao])
            : null,
        ].filter(Boolean)),
      ]),
    ),
  );

  return lista;
}
