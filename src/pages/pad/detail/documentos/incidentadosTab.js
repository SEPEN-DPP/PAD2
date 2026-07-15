/**
 * Aba "Incidentados" — array `pad.incidentados[]` (nome completo + IPEN).
 * Um PAD pode ter mais de um incidentado (padrão lista+modal, igual
 * Testemunhas) — cada um ganha seu próprio "Termo de Declarações" na aba
 * "Depoimento Incidentado" (ver depoimentoIncidentadoTab.js).
 */
import { criarElemento, carregarCssUmaVez, criarCampo, criarBotao, criarBotaoSalvar, criarCardEditavel, salvarSecaoDoPad } from './_shared.js';
import { abrirModal } from '../../../../components/modal/modal.js';
import { mostrarToast } from '../../../../utils/toast.js';

function abrirModalIncidentado({ incidentado, onSalvar }) {
  const campoNome = criarCampo({ rotulo: 'Nome completo', valor: incidentado?.nomeCompleto });
  const campoIpen = criarCampo({ rotulo: 'IPEN (Prontuário)', valor: incidentado?.ipen });

  const botaoSalvar = criarBotao({ texto: 'Salvar', icon: 'check' });
  const fechar = abrirModal({
    titulo: incidentado ? 'Editar incidentado' : 'Adicionar incidentado',
    conteudo: [campoNome.elemento, campoIpen.elemento],
    rodape: [botaoSalvar],
  });

  botaoSalvar.addEventListener('click', () => {
    if (!campoNome.input.value.trim()) return mostrarToast('Informe o nome.', 'aviso');
    onSalvar({
      id: incidentado?.id ?? crypto.randomUUID(),
      nomeCompleto: campoNome.input.value.trim(),
      ipen: campoIpen.input.value.trim(),
    });
    fechar();
  });
}

export function renderIncidentadosTab(pad, _configUnidade, { onAtualizar } = {}) {
  carregarCssUmaVez('src/pages/pad/detail/documentos/documentos.css');

  const incidentados = (pad.incidentados ?? []).map((i) => ({ id: i.id ?? crypto.randomUUID(), ...i }));
  const listaEl = criarElemento('ul', { class: 'documentos__lista-itens' });

  async function persistir() {
    if (!incidentados.length) return mostrarToast('O PAD precisa de pelo menos um incidentado.', 'aviso');
    await salvarSecaoDoPad(pad, { incidentados }, { etapa: null, jaTinhaEtapa: true });
    onAtualizar?.();
  }

  function atualizarLista() {
    listaEl.replaceChildren(
      ...incidentados.map((incidentado, indice) => {
        const botaoEditar = criarBotao({
          texto: 'Editar',
          icon: 'settings',
          variante: 'secondary',
          onClick: () => abrirModalIncidentado({
            incidentado,
            onSalvar: (dados) => {
              incidentados[indice] = dados;
              atualizarLista();
            },
          }),
        });
        const botaoRemover = criarBotao({
          texto: 'Remover',
          icon: 'x',
          variante: 'danger',
          onClick: () => {
            if (incidentados.length === 1) return mostrarToast('O PAD precisa de pelo menos um incidentado.', 'aviso');
            incidentados.splice(indice, 1);
            atualizarLista();
          },
        });
        return criarElemento('li', { class: 'documentos__item-lista' }, [
          criarElemento('span', {}, [`${incidentado.nomeCompleto} — IPEN ${incidentado.ipen || '—'}`]),
          criarElemento('div', { class: 'documentos__acoes-linha' }, [botaoEditar, botaoRemover]),
        ]);
      }),
    );
  }
  atualizarLista();

  const botaoAdicionar = criarBotao({
    texto: 'Adicionar incidentado',
    icon: 'file-plus',
    onClick: () => abrirModalIncidentado({
      onSalvar: (dados) => {
        incidentados.push(dados);
        atualizarLista();
      },
    }),
  });

  const secao = criarCardEditavel({
    titulo: 'Incidentados',
    corpo: [
      criarElemento('p', { class: 'text-muted' }, ['Normalmente 1, mas o PAD pode ter mais de um incidentado envolvido na mesma infração.']),
      criarElemento('div', { class: 'documentos__acoes' }, [botaoAdicionar]),
      listaEl,
    ],
  });

  const botaoSalvar = criarBotaoSalvar(persistir, { aposSalvar: secao.esconder });
  secao.areaCorpo.append(criarElemento('div', { class: 'documentos__acoes' }, [botaoSalvar]));

  return criarElemento('div', { class: 'documentos__aba' }, [secao.elemento]);
}
