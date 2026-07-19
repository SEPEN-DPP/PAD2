/**
 * Botão da Topbar que deixa um Administrador (FULL ACCESS) "entrar" na visão
 * de uma unidade prisional específica, em vez da visão geral DPP (todas as
 * unidades compiladas) — só um recorte de leitura (ver
 * src/state/unidadeAtivaAdministrador.js e
 * src/services/pads/escopoPad.js:calcularUnidadesVisiveis), não muda
 * nenhuma permissão do Administrador.
 */
import { criarElemento, carregarCssUmaVez } from '../../utils/domUtils.js';
import { criarBotao } from '../button/button.js';
import { abrirModal } from '../modal/modal.js';
import { UNIDADES_PRISIONAIS } from '../../config/unidadesPrisionais.js';

const RECORTE_DPP = 'DPP — visão geral';

function normalizarTexto(valor) {
  return (valor ?? '')
    .toString()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim();
}

function abrirModalEscolha({ onSelecionar }) {
  const opcoes = [
    { nome: null, rotulo: RECORTE_DPP },
    ...UNIDADES_PRISIONAIS.map((u) => ({ nome: u.nome, rotulo: `${u.nome} — ${u.cidade}` })),
  ];

  const campoBusca = criarElemento('input', {
    class: 'campo__input',
    type: 'search',
    placeholder: 'Buscar unidade por nome ou cidade…',
  });
  const lista = criarElemento('ul', { class: 'documentos__lista-itens' });

  function renderizarLista(termo) {
    const normalizado = normalizarTexto(termo);
    const filtradas = termo.trim() ? opcoes.filter((o) => normalizarTexto(o.rotulo).includes(normalizado)) : opcoes;
    lista.replaceChildren(
      ...filtradas.slice(0, 30).map((opcao) => {
        const item = criarElemento(
          'li',
          { class: 'documentos__item-lista seletor-unidade__opcao', role: 'button', tabindex: '0' },
          [criarElemento('span', {}, [opcao.rotulo])],
        );
        const selecionar = () => {
          fechar();
          onSelecionar(opcao.nome);
        };
        item.addEventListener('click', selecionar);
        item.addEventListener('keydown', (evento) => {
          if (evento.key === 'Enter') selecionar();
        });
        return item;
      }),
    );
  }

  const fechar = abrirModal({
    titulo: 'Selecionar unidade',
    conteudo: [campoBusca, lista],
  });

  campoBusca.addEventListener('input', () => renderizarLista(campoBusca.value));
  renderizarLista('');
  campoBusca.focus();
}

/** @param {{ valorInicial: string|null, onSelecionar: (nomeOuNull: string|null) => void }} params */
export function criarSeletorUnidade({ valorInicial, onSelecionar }) {
  carregarCssUmaVez('src/components/seletorUnidade/seletorUnidade.css');
  carregarCssUmaVez('src/pages/pad/detail/documentos/documentos.css');

  const botao = criarBotao({
    texto: valorInicial ?? RECORTE_DPP,
    icon: 'building',
    variante: 'secondary',
    onClick: () => {
      abrirModalEscolha({
        onSelecionar: (nome) => {
          botao.querySelector('span:last-child').textContent = nome ?? RECORTE_DPP;
          onSelecionar(nome);
        },
      });
    },
  });
  botao.classList.add('seletor-unidade__botao');

  return botao;
}
