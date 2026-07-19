/**
 * Aba "Depoimento Incidentado" (renomeada de "Declarações do Apenado",
 * 2026-07-15) — um Termo de Declarações por incidentado do PAD (ver
 * incidentadosTab.js para adicionar/remover incidentados). `declaracoesApenado`
 * é um array `{ incidentadoId, silencio, versaoIncidentado }`, um item por
 * incidentado — mesmo padrão array-based de testemunhasTab.js.
 */
import { criarElemento, carregarCssUmaVez, criarCampoComDitado, criarBotao, criarBotaoSalvar, criarCardEditavel, salvarSecaoDoPad, criarBotaoConfirmar } from './_shared.js';
import { abrirModal } from '../../../../components/modal/modal.js';
import { renderizar as renderizarDeclaracao } from '../../../../templates/declaracaoApenadoTemplate.js';
import { baixarComoPdf } from '../../../../templates/shared/pdfExporter.js';
import { baixarComoDoc } from '../../../../templates/shared/docExporter.js';

function abrirModalDeclaracao({ incidentado, declaracao, onSalvar }) {
  let silencio = declaracao?.silencio ?? false;
  const botaoDeclarou = criarBotao({ texto: 'Prestou declarações', variante: silencio ? 'secondary' : 'primary', onClick: () => alternar(false) });
  const botaoSilencio = criarBotao({ texto: 'Permaneceu em silêncio', variante: silencio ? 'primary' : 'secondary', onClick: () => alternar(true) });
  const campoVersao = criarCampoComDitado({ rotulo: 'Versão apresentada pelo incidentado', valor: declaracao?.versaoIncidentado });

  function alternar(novoValor) {
    silencio = novoValor;
    botaoDeclarou.className = `btn btn--${silencio ? 'secondary' : 'primary'}`;
    botaoSilencio.className = `btn btn--${silencio ? 'primary' : 'secondary'}`;
    campoVersao.elemento.style.display = silencio ? 'none' : '';
  }
  campoVersao.elemento.style.display = silencio ? 'none' : '';

  const botaoSalvar = criarBotao({ texto: 'Salvar', icon: 'check' });
  const fechar = abrirModal({
    titulo: `Depoimento de ${incidentado.nomeCompleto}`,
    conteudo: [
      criarElemento('div', { class: 'documentos__acoes' }, [botaoDeclarou, botaoSilencio]),
      campoVersao.elemento,
    ],
    rodape: [botaoSalvar],
  });

  botaoSalvar.addEventListener('click', () => {
    onSalvar({ incidentadoId: incidentado.id, silencio, versaoIncidentado: campoVersao.input.value.trim() });
    fechar();
  });
}

export function renderDepoimentoIncidentadoTab(pad, configUnidade, { onAtualizar } = {}) {
  carregarCssUmaVez('src/pages/pad/detail/documentos/documentos.css');

  const incidentados = pad.incidentados ?? [];
  const declaracoes = (pad.declaracoesApenado ?? []).map((d) => ({ ...d }));
  const listaEl = criarElemento('ul', { class: 'documentos__lista-itens' });

  function obterDeclaracao(incidentadoId) {
    return declaracoes.find((d) => d.incidentadoId === incidentadoId);
  }

  async function persistir() {
    await salvarSecaoDoPad(
      pad,
      { declaracoesApenado: declaracoes },
      { etapa: 'OITIVA_INCIDENTADO', jaTinhaEtapa: (pad.declaracoesApenado ?? []).length > 0, chaveConfirmacao: 'declaracoesApenado' },
    );
    onAtualizar?.();
  }

  function atualizarLista() {
    listaEl.replaceChildren(
      ...incidentados.map((incidentado) => {
        const declaracao = obterDeclaracao(incidentado.id);
        const status = !declaracao ? 'pendente' : declaracao.silencio ? 'permaneceu em silêncio' : 'prestou declarações';
        const botaoEditar = criarBotao({
          texto: declaracao ? 'Editar' : 'Registrar depoimento',
          icon: 'settings',
          variante: 'secondary',
          onClick: () => abrirModalDeclaracao({
            incidentado,
            declaracao,
            onSalvar: (dados) => {
              const indice = declaracoes.findIndex((d) => d.incidentadoId === incidentado.id);
              if (indice === -1) declaracoes.push(dados);
              else declaracoes[indice] = dados;
              atualizarLista();
            },
          }),
        });
        const botaoPdf = criarBotao({
          texto: 'PDF',
          icon: 'download',
          variante: 'secondary',
          onClick: () => baixarComoPdf(pad, renderizarDeclaracao(pad, incidentado, declaracao ?? {}, configUnidade)),
        });
        const botaoDoc = criarBotao({
          texto: '.doc',
          icon: 'file-text',
          variante: 'secondary',
          onClick: () => baixarComoDoc(pad, renderizarDeclaracao(pad, incidentado, declaracao ?? {}, configUnidade)),
        });
        return criarElemento('li', { class: 'documentos__item-lista' }, [
          criarElemento('span', {}, [`${incidentado.nomeCompleto} (${status})`]),
          criarElemento('div', { class: 'documentos__acoes-linha' }, [botaoEditar, botaoPdf, botaoDoc]),
        ]);
      }),
    );
  }
  atualizarLista();

  const secao = criarCardEditavel({
    titulo: 'Depoimento Incidentado',
    corpo: [
      criarElemento('p', { class: 'text-muted' }, [
        incidentados.length
          ? 'Um Termo de Declarações por incidentado — para adicionar/remover incidentados, use a aba "Incidentados".'
          : 'Nenhum incidentado cadastrado ainda — adicione na aba "Incidentados".',
      ]),
      listaEl,
    ],
  });
  secao.elemento.querySelector('.card__acoes')?.append(criarBotaoConfirmar(pad, 'declaracoesApenado', { onAtualizar }));

  const botaoSalvar = criarBotaoSalvar(persistir, { aposSalvar: secao.esconder });
  secao.areaCorpo.append(criarElemento('div', { class: 'documentos__acoes' }, [botaoSalvar]));

  return criarElemento('div', { class: 'documentos__aba' }, [secao.elemento]);
}
