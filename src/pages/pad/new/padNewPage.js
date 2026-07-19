/**
 * Abertura de um novo PAD. Fluxo: upload do PDF do Registro de Infração →
 * extração de campos por regras (sem IA, ver src/parser/README.md) →
 * formulário de revisão humana → "Criar PAD" grava o PAD (status inicial
 * sempre EM_ANDAMENTO, numeração digitada pelo usuário — não há numeração
 * automática) e já lança o primeiro evento da linha do tempo ("Registro de
 * Infração", já concluído, com os dados revisados aqui) — ver
 * src/services/pads/padService.js e src/services/eventos/eventoService.js.
 */
import { criarElemento, carregarCssUmaVez, limparContainer } from '../../../utils/domUtils.js';
import { criarPageHeader } from '../../../components/pageHeader/pageHeader.js';
import { criarCard } from '../../../components/card/card.js';
import { criarDropzone } from '../../../components/dropzone/dropzone.js';
import { criarBotao } from '../../../components/button/button.js';
import { mostrarToast } from '../../../utils/toast.js';
import { extrairTexto } from '../../../parser/pdfParserService.js';
import { extrairCamposRegistroInfracao } from '../../../parser/registroInfracaoParser.js';
import { ARTIGOS_LEP } from '../../../config/baseLegal.js';
import { UNIDADES_PRISIONAIS, obterUnidadePorNome } from '../../../config/unidadesPrisionais.js';
import { usuarioAtual, obterPerfilDoUsuario } from '../../../services/auth/authService.js';
import { criarPad } from '../../../services/pads/padService.js';
import { criarEvento } from '../../../services/eventos/eventoService.js';
import { dataBrParaDate } from '../../../utils/dateUtils.js';
import { ehDataBrValida } from '../../../utils/validationUtils.js';

function criarCampo({ rotulo, valor, multilinha = false }) {
  const input = criarElemento(multilinha ? 'textarea' : 'input', {
    class: 'campo__input',
    ...(multilinha ? { rows: '3' } : { type: 'text' }),
  });
  input.value = valor ?? '';
  return { elemento: criarElemento('label', { class: 'campo' }, [criarElemento('span', { class: 'campo__rotulo' }, [rotulo]), input]), input };
}

/**
 * Select do artigo da LEP (faltas graves), pré-selecionado quando o parser
 * identifica correspondência entre o texto da infração e o catálogo (ver
 * src/config/baseLegal.js) — sempre editável, nunca aplicado sem revisão.
 */
function criarCampoArtigoLep(artigoLep) {
  const opcoes = [
    criarElemento('option', { value: '' }, ['Selecione...']),
    ...ARTIGOS_LEP.map((artigo) => {
      const atributos = { value: artigo.cod };
      if (artigoLep?.codigo === artigo.cod) atributos.selected = 'selected';
      return criarElemento('option', atributos, [artigo.label]);
    }),
  ];
  const select = criarElemento('select', { class: 'campo__input' }, opcoes);
  const rotulo = artigoLep
    ? 'Artigo da LEP (identificado automaticamente — confira)'
    : 'Artigo da LEP (não identificado — selecione manualmente)';
  return {
    elemento: criarElemento('label', { class: 'campo' }, [criarElemento('span', { class: 'campo__rotulo' }, [rotulo]), select]),
    input: select,
  };
}

/**
 * Campo de unidade do PAD: fixo (não editável) para quem tem vínculo de
 * UNIDADE — o PAD sempre pertence à própria unidade de quem o cria; select
 * filtrado às unidades da regional para vínculo REGIONAL; select com todas
 * as unidades do Estado para Administrador (sem vínculo). Mesma lógica de
 * escopo de src/services/pads/escopoPad.js, aplicada aqui à escrita.
 */
function criarCampoUnidade(perfilUsuario) {
  if (perfilUsuario?.vinculo?.tipo === 'UNIDADE') {
    const input = criarElemento('input', { class: 'campo__input', type: 'text', disabled: 'disabled' });
    input.value = perfilUsuario.vinculo.valor;
    return {
      elemento: criarElemento('label', { class: 'campo' }, [criarElemento('span', { class: 'campo__rotulo' }, ['Unidade']), input]),
      input,
    };
  }

  const unidadesDisponiveis = perfilUsuario?.vinculo?.tipo === 'REGIONAL'
    ? UNIDADES_PRISIONAIS.filter((u) => u.superintendencia === perfilUsuario.vinculo.valor)
    : UNIDADES_PRISIONAIS;

  const select = criarElemento(
    'select',
    { class: 'campo__input' },
    [criarElemento('option', { value: '' }, ['Selecione...']), ...unidadesDisponiveis.map((u) => criarElemento('option', { value: u.nome }, [u.nome]))],
  );
  return {
    elemento: criarElemento('label', { class: 'campo' }, [criarElemento('span', { class: 'campo__rotulo' }, ['Unidade']), select]),
    input: select,
  };
}

function criarFormularioRevisao(campos, perfilUsuario) {
  const campoNumero = criarCampo({ rotulo: 'Número do PAD' });
  const campoUnidade = criarCampoUnidade(perfilUsuario);
  const campoNome = criarCampo({ rotulo: 'Nome completo', valor: campos.nomeCompleto });
  const campoIpen = criarCampo({ rotulo: 'IPEN (Prontuário)', valor: campos.ipen });
  const campoData = criarCampo({ rotulo: 'Data da infração', valor: campos.dataInfracao });
  const campoInfracao = criarCampo({ rotulo: 'Infração', valor: campos.infracao, multilinha: true });
  const campoArtigoLep = criarCampoArtigoLep(campos.artigoLep);
  const campoDetentos = criarCampo({ rotulo: 'Detentos envolvidos (separados por vírgula)', valor: campos.detentosEnvolvidos.join(', ') });
  const campoAgentes = criarCampo({ rotulo: 'Agentes envolvidos (separados por vírgula)', valor: campos.agentesEnvolvidos.join(', ') });
  const campoObs = criarCampo({ rotulo: 'Observações', valor: campos.observacoes, multilinha: true });

  const linhas = [
    campoNumero, campoUnidade, campoNome, campoIpen, campoData,
    campoInfracao, campoArtigoLep, campoDetentos, campoAgentes, campoObs,
  ];

  const botaoCriarPad = criarBotao({
    texto: 'Criar PAD',
    icon: 'file-plus',
    onClick: async () => {
      const numero = campoNumero.input.value.trim();
      const unidade = campoUnidade.input.value;
      const dataInfracao = campoData.input.value.trim();

      if (!numero) return mostrarToast('Informe o número do PAD.', 'aviso');
      if (!unidade) return mostrarToast('Selecione a unidade do PAD.', 'aviso');
      if (!ehDataBrValida(dataInfracao)) return mostrarToast('Informe a data da infração no formato dd/mm/aaaa.', 'aviso');

      botaoCriarPad.disabled = true;
      try {
        const artigoSelecionado = ARTIGOS_LEP.find((a) => a.cod === campoArtigoLep.input.value);
        const padId = await criarPad({
          numero,
          unidade,
          incidentados: [{ id: crypto.randomUUID(), nomeCompleto: campoNome.input.value.trim(), ipen: campoIpen.input.value.trim() }],
          infracao: {
            data: dataInfracao,
            tipificacao: campoInfracao.input.value.trim(),
            artigoLep: artigoSelecionado ? { codigo: artigoSelecionado.cod, rotulo: artigoSelecionado.label } : null,
            detentosEnvolvidos: campoDetentos.input.value.split(',').map((s) => s.trim()).filter(Boolean),
            agentesEnvolvidos: campoAgentes.input.value.split(',').map((s) => s.trim()).filter(Boolean),
            observacoes: campoObs.input.value.trim(),
          },
        });

        const nomeResponsavel = perfilUsuario?.nome ?? usuarioAtual()?.email ?? '—';
        await criarEvento({
          padId,
          tipo: 'REGISTRO_INFRACAO',
          responsavel: nomeResponsavel,
          data: dataBrParaDate(dataInfracao),
          status: 'CONCLUIDO',
          observacoes: campoObs.input.value.trim(),
          unidade,
          superintendencia: obterUnidadePorNome(unidade)?.superintendencia ?? null,
        });

        mostrarToast('PAD criado com sucesso.', 'sucesso');
        location.hash = `/pad/${padId}`;
      } catch (erro) {
        console.error('Falha ao criar PAD:', erro);
        mostrarToast('Não foi possível criar o PAD.', 'erro');
        botaoCriarPad.disabled = false;
      }
    },
  });

  return criarElemento('div', { class: 'pad-new__revisao' }, [
    criarElemento('p', { class: 'text-muted' }, [
      'Confira os dados antes de criar o PAD. Nenhum dado foi gravado ainda.',
    ]),
    criarElemento('div', { class: 'pad-new__campos' }, linhas.map((l) => l.elemento)),
    criarElemento('div', { class: 'pad-new__acoes' }, [botaoCriarPad]),
  ]);
}

/** Formulário em branco — mesma revisão do fluxo por PDF, só que sem nada pré-preenchido. */
const CAMPOS_VAZIOS = Object.freeze({
  nomeCompleto: '',
  ipen: '',
  dataInfracao: '',
  infracao: '',
  artigoLep: null,
  detentosEnvolvidos: [],
  agentesEnvolvidos: [],
  observacoes: '',
});

export async function render(container) {
  carregarCssUmaVez('src/pages/pad/new/padNewPage.css');

  container.append(
    criarPageHeader({
      titulo: 'Novo PAD',
      descricao: 'Envie o PDF do Registro de Infração do i-PEN ou preencha os dados manualmente.',
    }),
  );

  const perfilUsuario = await obterPerfilDoUsuario(usuarioAtual()?.uid);

  let arquivoSelecionado = null;
  const areaRevisao = criarElemento('div');

  const botaoAnalisar = criarBotao({
    texto: 'Analisar Registro',
    icon: 'search',
    disabled: true,
    onClick: async () => {
      botaoAnalisar.disabled = true;
      try {
        const textoExtraido = await extrairTexto(arquivoSelecionado);
        const campos = await extrairCamposRegistroInfracao(textoExtraido);
        limparContainer(areaRevisao);
        areaRevisao.append(criarCard({ titulo: 'Dados extraídos', filhos: [criarFormularioRevisao(campos, perfilUsuario)] }));
      } catch (erro) {
        console.error('Falha ao analisar o Registro de Infração:', erro);
        mostrarToast('Não foi possível ler os dados deste PDF. Tente novamente.', 'erro');
      } finally {
        botaoAnalisar.disabled = false;
      }
    },
  });

  const dropzone = criarDropzone({
    onArquivoSelecionado: (arquivo) => {
      arquivoSelecionado = arquivo;
      botaoAnalisar.disabled = false;
      limparContainer(areaRevisao);
    },
  });

  const botaoManual = criarBotao({
    texto: 'Preencher manualmente (sem PDF)',
    icon: 'file-plus',
    variante: 'secondary',
    onClick: () => {
      limparContainer(areaRevisao);
      areaRevisao.append(criarCard({ titulo: 'Dados do PAD', filhos: [criarFormularioRevisao(CAMPOS_VAZIOS, perfilUsuario)] }));
    },
  });

  container.append(
    criarCard({
      titulo: 'Registro de Infração',
      filhos: [
        dropzone,
        criarElemento('div', { class: 'pad-new__acoes' }, [botaoAnalisar]),
        criarElemento('p', { class: 'text-muted' }, ['Não tem o PDF em mãos?']),
        criarElemento('div', { class: 'pad-new__acoes' }, [botaoManual]),
      ],
    }),
    areaRevisao,
  );
}
