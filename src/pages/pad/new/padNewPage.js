/**
 * Abertura de um novo PAD. Fluxo desta fase: upload do PDF do Registro de
 * Infração → extração de campos por regras (sem IA, ver
 * src/parser/README.md) → formulário de revisão humana antes de qualquer
 * gravação. A gravação em si (numeração do PAD, status inicial, criação do
 * evento "Registro de Infração") é regra de negócio da Fase 2 (ver
 * ROADMAP.md) e não está implementada aqui — o botão "Criar PAD" apenas
 * sinaliza isso.
 */
import { criarElemento, carregarCssUmaVez, limparContainer } from '../../../utils/domUtils.js';
import { criarPageHeader } from '../../../components/pageHeader/pageHeader.js';
import { criarCard } from '../../../components/card/card.js';
import { criarDropzone } from '../../../components/dropzone/dropzone.js';
import { criarBotao } from '../../../components/button/button.js';
import { mostrarToast } from '../../../utils/toast.js';
import { extrairTexto } from '../../../parser/pdfParserService.js';
import { extrairCamposRegistroInfracao } from '../../../parser/registroInfracaoParser.js';

function criarCampo({ rotulo, valor, multilinha = false }) {
  const input = criarElemento(multilinha ? 'textarea' : 'input', {
    class: 'campo__input',
    ...(multilinha ? { rows: '3' } : { type: 'text' }),
  });
  input.value = valor ?? '';
  return { elemento: criarElemento('label', { class: 'campo' }, [criarElemento('span', { class: 'campo__rotulo' }, [rotulo]), input]), input };
}

function criarFormularioRevisao(campos) {
  const linhas = [
    criarCampo({ rotulo: 'Nome completo', valor: campos.nomeCompleto }),
    criarCampo({ rotulo: 'IPEN (Prontuário)', valor: campos.ipen }),
    criarCampo({ rotulo: 'Data da infração', valor: campos.dataInfracao }),
    criarCampo({ rotulo: 'Infração', valor: campos.infracao, multilinha: true }),
    criarCampo({ rotulo: 'Artigos (separados por vírgula)', valor: campos.artigos.join(', ') }),
    criarCampo({ rotulo: 'Detentos envolvidos (separados por vírgula)', valor: campos.detentosEnvolvidos.join(', ') }),
    criarCampo({ rotulo: 'Agentes envolvidos (separados por vírgula)', valor: campos.agentesEnvolvidos.join(', ') }),
    criarCampo({ rotulo: 'Observações', valor: campos.observacoes, multilinha: true }),
  ];

  const botaoCriarPad = criarBotao({
    texto: 'Criar PAD',
    icon: 'file-plus',
    onClick: () => {
      mostrarToast(
        'A gravação do PAD (numeração, status inicial e evento de abertura) será implementada na Fase 2.',
        'info',
      );
    },
  });

  return criarElemento('div', { class: 'pad-new__revisao' }, [
    criarElemento('p', { class: 'text-muted' }, [
      'Confira e corrija os dados extraídos antes de criar o PAD. Nenhum dado foi gravado ainda.',
    ]),
    criarElemento('div', { class: 'pad-new__campos' }, linhas.map((l) => l.elemento)),
    criarElemento('div', { class: 'pad-new__acoes' }, [botaoCriarPad]),
  ]);
}

export async function render(container) {
  carregarCssUmaVez('src/pages/pad/new/padNewPage.css');

  container.append(
    criarPageHeader({
      titulo: 'Novo PAD',
      descricao: 'Inicie o registro enviando o PDF do Registro de Infração do i-PEN.',
    }),
  );

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
        areaRevisao.append(criarCard({ titulo: 'Dados extraídos', filhos: [criarFormularioRevisao(campos)] }));
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

  container.append(
    criarCard({
      titulo: 'Registro de Infração',
      filhos: [dropzone, criarElemento('div', { class: 'pad-new__acoes' }, [botaoAnalisar])],
    }),
    areaRevisao,
  );
}
