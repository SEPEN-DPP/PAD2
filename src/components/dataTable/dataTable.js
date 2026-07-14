/**
 * Tabela de dados genérica. Recebe colunas (chave + rótulo + renderizador
 * opcional) e linhas já carregadas — não pagina nem consulta sozinha.
 */
import { criarElemento, carregarCssUmaVez } from '../../utils/domUtils.js';
import { criarEmptyState } from '../emptyState/emptyState.js';

/**
 * @param {{ colunas: Array<{ chave: string, rotulo: string, render?: (linha: object) => Node|string }>, linhas: object[], onClickLinha?: (linha: object) => void, vazio?: { titulo: string, descricao?: string } }} params
 */
export function criarDataTable({ colunas, linhas, onClickLinha, vazio }) {
  carregarCssUmaVez('src/components/dataTable/dataTable.css');

  if (!linhas.length) {
    return criarEmptyState(
      vazio ?? { titulo: 'Nenhum registro encontrado', icon: 'file-text' },
    );
  }

  const cabecalho = criarElemento(
    'tr',
    {},
    colunas.map((coluna) => criarElemento('th', {}, [coluna.rotulo])),
  );

  const linhasEl = linhas.map((linha) =>
    criarElemento(
      'tr',
      { class: onClickLinha ? 'data-table__linha--clicavel' : '', onClick: onClickLinha ? () => onClickLinha(linha) : undefined },
      colunas.map((coluna) =>
        criarElemento('td', {}, [coluna.render ? coluna.render(linha) : String(linha[coluna.chave] ?? '—')]),
      ),
    ),
  );

  return criarElemento('div', { class: 'data-table-wrap' }, [
    criarElemento('table', { class: 'data-table' }, [
      criarElemento('thead', {}, [cabecalho]),
      criarElemento('tbody', {}, linhasEl),
    ]),
  ]);
}
