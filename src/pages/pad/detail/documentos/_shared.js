/**
 * Helpers compartilhados pelas abas de documento do PAD (Portaria, Termo de
 * Cientificação, Testemunhas, Declarações do Apenado, Conselho, Defesa,
 * Decisão, Ofícios). Cada aba tem seu próprio formulário, mas todas
 * compartilham o mesmo padrão de card de pré-visualização + exportação.
 */
import { criarElemento, carregarCssUmaVez, limparContainer } from '../../../../utils/domUtils.js';
import { criarCard } from '../../../../components/card/card.js';
import { criarBotao } from '../../../../components/button/button.js';
import { renderizarPreview } from '../../../../templates/shared/previewRenderer.js';
import { baixarComoPdf } from '../../../../templates/shared/pdfExporter.js';
import { baixarComoDoc, copiarDocumento } from '../../../../templates/shared/docExporter.js';
import { converterParaImagensEmbutidas } from '../../../../templates/shared/anexoEmbutido.js';
import { mostrarToast } from '../../../../utils/toast.js';
import { atualizarPad } from '../../../../services/pads/padService.js';
import { criarEvento } from '../../../../services/eventos/eventoService.js';
import { usuarioAtual, obterPerfilDoUsuario } from '../../../../services/auth/authService.js';

/**
 * Converte um Date/Timestamp para o valor esperado por `<input type="date">`
 * (yyyy-mm-dd) SEM passar por `toISOString()` — que converte para UTC
 * primeiro e pode mostrar o dia anterior em fusos negativos (mesma classe de
 * bug já corrigida em src/utils/dateUtils.js).
 */
export function paraValorInputDate(valor) {
  if (!valor) return '';
  const data = typeof valor?.toDate === 'function' ? valor.toDate() : new Date(valor);
  const ano = data.getFullYear();
  const mes = String(data.getMonth() + 1).padStart(2, '0');
  const dia = String(data.getDate()).padStart(2, '0');
  return `${ano}-${mes}-${dia}`;
}

export function criarCampo({ rotulo, valor, multilinha = false, tipo = 'text' }) {
  const input = criarElemento(multilinha ? 'textarea' : 'input', {
    class: 'campo__input',
    ...(multilinha ? { rows: '3' } : { type: tipo }),
  });
  input.value = valor ?? '';
  return {
    elemento: criarElemento('label', { class: 'campo' }, [criarElemento('span', { class: 'campo__rotulo' }, [rotulo]), input]),
    input,
  };
}

/** Igual a `criarCampo`, mas com um botão de ditado por voz logo abaixo do campo. */
export function criarCampoComDitado({ rotulo, valor, multilinha = true }) {
  const campo = criarCampo({ rotulo, valor, multilinha });
  campo.elemento.append(criarBotaoDitado(campo.input));
  return campo;
}

export function criarCampoSelect({ rotulo, valor, opcoes }) {
  const select = criarElemento(
    'select',
    { class: 'campo__input' },
    opcoes.map((opcao) => {
      const atributos = { value: opcao.valor };
      if (opcao.valor === valor) atributos.selected = 'selected';
      return criarElemento('option', atributos, [opcao.rotulo]);
    }),
  );
  return {
    elemento: criarElemento('label', { class: 'campo' }, [criarElemento('span', { class: 'campo__rotulo' }, [rotulo]), select]),
    input: select,
  };
}

/** Bloco "Nome completo" + "Matrícula" — usado para Diretor/Presidente/Membros do Conselho. */
export function criarBlocoPessoa(titulo, pessoa, { comMatricula = true } = {}) {
  const campoNome = criarCampo({ rotulo: 'Nome completo', valor: pessoa?.nome });
  const campoMatricula = comMatricula ? criarCampo({ rotulo: 'Matrícula', valor: pessoa?.matricula }) : null;
  const elemento = criarElemento('fieldset', { class: 'campo-grupo' }, [
    criarElemento('legend', {}, [titulo]),
    campoNome.elemento,
    campoMatricula?.elemento,
  ].filter(Boolean));
  return { elemento, campoNome, campoMatricula };
}

/**
 * Monta o card de pré-visualização + botões de exportação, comum a toda
 * aba de documento.
 * @param {object} pad
 * @param {() => object} obterDocumento — chama o template com os dados atuais do formulário
 */
export function criarAreaPreview(pad, obterDocumento) {
  const areaPreview = criarElemento('div');

  function atualizar() {
    limparContainer(areaPreview);
    areaPreview.append(renderizarPreview(pad, obterDocumento()));
  }

  const botaoCopiar = criarBotao({
    texto: 'Copiar',
    icon: 'copy',
    variante: 'secondary',
    onClick: async () => {
      const ok = await copiarDocumento(pad, obterDocumento());
      mostrarToast(ok ? 'Documento copiado para a área de transferência.' : 'Não foi possível copiar o documento.', ok ? 'sucesso' : 'erro');
    },
  });
  const botaoDoc = criarBotao({
    texto: 'Baixar .doc',
    icon: 'file-text',
    variante: 'secondary',
    onClick: () => baixarComoDoc(pad, obterDocumento()),
  });
  const botaoPdf = criarBotao({
    texto: 'Baixar PDF',
    icon: 'download',
    variante: 'secondary',
    onClick: () => baixarComoPdf(pad, obterDocumento()),
  });

  const card = criarCard({
    titulo: 'Pré-visualização',
    acoes: [botaoCopiar, botaoDoc, botaoPdf],
    filhos: [areaPreview],
  });

  atualizar();
  return { elemento: card, atualizar };
}

/**
 * Envolve um card com os campos já visíveis (nasce expandido — sem precisar
 * clicar em "Editar"); um botão no cabeçalho do card ainda permite recolher
 * a área de edição para quem quiser reduzir a poluição visual da aba.
 * @param {{ titulo: string, corpo: Node[] }} params
 * @returns {{ elemento: Node, esconder: () => void }}
 */
export function criarCardEditavel({ titulo, corpo }) {
  const areaCorpo = criarElemento('div', { class: 'documentos__corpo-editavel' }, corpo);

  const botaoEditar = criarBotao({
    texto: 'Cancelar',
    icon: 'settings',
    variante: 'secondary',
    onClick: () => {
      const vaiAbrir = areaCorpo.style.display === 'none';
      areaCorpo.style.display = vaiAbrir ? '' : 'none';
      botaoEditar.querySelector('span:last-child').textContent = vaiAbrir ? 'Cancelar' : 'Editar';
    },
  });

  function esconder() {
    areaCorpo.style.display = 'none';
    botaoEditar.querySelector('span:last-child').textContent = 'Editar';
  }

  return { elemento: criarCard({ titulo, acoes: [botaoEditar], filhos: [areaCorpo] }), areaCorpo, esconder };
}

/**
 * Salva `patch` no PAD e, na primeira vez que essa etapa é preenchida,
 * lança o evento correspondente na linha do tempo (ver ETAPAS_PAD).
 * @param {object} pad
 * @param {object} patch — objeto aninhado inteiro da seção (ex.: `{ conselho: {...} }`)
 * @param {{ etapa?: string, jaTinhaEtapa: boolean }} opcoes
 */
export async function salvarSecaoDoPad(pad, patch, { etapa, jaTinhaEtapa } = {}) {
  await atualizarPad(pad.id, patch);
  Object.assign(pad, patch);

  if (etapa && !jaTinhaEtapa) {
    const perfil = await obterPerfilDoUsuario(usuarioAtual()?.uid);
    await criarEvento({
      padId: pad.id,
      tipo: etapa,
      responsavel: perfil?.nome ?? usuarioAtual()?.email ?? '—',
      data: new Date(),
      status: 'CONCLUIDO',
      observacoes: '',
    });
  }
}

/**
 * Widget "Anexar PDF (substitui o texto gerado)" — efêmero: o binário do
 * arquivo nunca é gravado no Firestore (mesma regra da Documentação
 * Inicial, ver anexoEmbutido.js), só o(s) dataURL(s) resultante(s) ficam em
 * memória durante esta sessão do navegador.
 * @param {{ onMudar: () => void }} params
 */
export function criarAnexoSubstituto({ onMudar }) {
  let anexo = null;
  const input = criarElemento('input', { type: 'file', accept: 'application/pdf,image/*', class: 'sr-only' });
  const legenda = criarElemento('span', { class: 'text-muted' }, ['Nenhum arquivo anexado — o texto abaixo é gerado automaticamente.']);
  const botaoRemover = criarBotao({
    texto: 'Remover anexo',
    icon: 'x',
    variante: 'danger',
    onClick: () => {
      anexo = null;
      input.value = '';
      legenda.textContent = 'Nenhum arquivo anexado — o texto abaixo é gerado automaticamente.';
      botaoRemover.style.display = 'none';
      onMudar();
    },
  });
  botaoRemover.style.display = 'none';
  const botaoAnexar = criarBotao({
    texto: 'Anexar PDF (substitui o texto gerado)',
    icon: 'paperclip',
    variante: 'secondary',
    onClick: () => input.click(),
  });

  input.addEventListener('change', async () => {
    const arquivo = input.files?.[0];
    if (!arquivo) return;
    try {
      anexo = { dataUrls: await converterParaImagensEmbutidas(arquivo), nomeArquivo: arquivo.name };
      legenda.textContent = `Anexado: ${arquivo.name} (substitui o texto gerado nesta exportação)`;
      botaoRemover.style.display = '';
      onMudar();
    } catch (erro) {
      console.error('Falha ao processar anexo substituto:', erro);
      mostrarToast(erro.message ?? 'Não foi possível processar o anexo.', 'erro');
    }
  });

  return {
    elemento: criarElemento('div', { class: 'documentos__acoes' }, [botaoAnexar, legenda, botaoRemover, input]),
    obterAnexo: () => anexo,
  };
}

/** Quando há um anexo substituto, troca o corpo gerado do documento pelas páginas do anexo — mantém título/subtítulo/assinaturas do template original. */
export function aplicarAnexoSubstituto(documento, anexo) {
  if (!anexo) return documento;
  return {
    ...documento,
    secoes: [],
    anexos: anexo.dataUrls.map((dataUrl, indice) => ({
      dataUrl,
      legenda: anexo.dataUrls.length > 1 ? `${anexo.nomeArquivo} (página ${indice + 1})` : anexo.nomeArquivo,
    })),
  };
}

/**
 * Botão de ditado por voz (Web Speech API — navegador, sem custo/API paga;
 * Chrome/Edge only). Anexa o texto reconhecido ao valor atual do campo e
 * dispara `input` para a pré-visualização atualizar sozinha, igual à
 * digitação manual.
 * @param {HTMLTextAreaElement|HTMLInputElement} campoTexto
 */
export function criarBotaoDitado(campoTexto) {
  const ReconhecimentoDeVoz = window.SpeechRecognition || window.webkitSpeechRecognition;
  const botao = criarBotao({ texto: 'Ditar', icon: 'mic', variante: 'secondary', onClick: () => {} });

  if (!ReconhecimentoDeVoz) {
    botao.addEventListener('click', () => {
      mostrarToast('Ditado por voz não é suportado neste navegador (funciona no Chrome/Edge).', 'aviso');
    });
    return botao;
  }

  const reconhecimento = new ReconhecimentoDeVoz();
  reconhecimento.lang = 'pt-BR';
  reconhecimento.continuous = true;
  reconhecimento.interimResults = false;
  let gravando = false;

  function pararVisual() {
    gravando = false;
    botao.classList.remove('btn--gravando');
    botao.querySelector('span:last-child').textContent = 'Ditar';
  }

  reconhecimento.addEventListener('result', (evento) => {
    let textoNovo = '';
    for (let i = evento.resultIndex; i < evento.results.length; i += 1) {
      if (evento.results[i].isFinal) textoNovo += evento.results[i][0].transcript;
    }
    if (!textoNovo.trim()) return;
    const separador = campoTexto.value && !campoTexto.value.endsWith(' ') ? ' ' : '';
    campoTexto.value += separador + textoNovo.trim();
    campoTexto.dispatchEvent(new Event('input', { bubbles: true }));
  });
  reconhecimento.addEventListener('end', pararVisual);
  reconhecimento.addEventListener('error', (evento) => {
    console.error('Falha no ditado por voz:', evento.error);
    if (evento.error !== 'no-speech') mostrarToast('Não foi possível continuar o ditado por voz.', 'erro');
    pararVisual();
  });

  botao.addEventListener('click', () => {
    if (gravando) {
      reconhecimento.stop();
      return;
    }
    gravando = true;
    botao.classList.add('btn--gravando');
    botao.querySelector('span:last-child').textContent = 'Parar';
    reconhecimento.start();
  });

  return botao;
}

export function criarBotaoSalvar(onSalvar, { aposSalvar } = {}) {
  const botao = criarBotao({
    texto: 'Salvar',
    icon: 'check',
    onClick: async () => {
      botao.disabled = true;
      try {
        await onSalvar();
        mostrarToast('Salvo com sucesso.', 'sucesso');
        aposSalvar?.();
      } catch (erro) {
        console.error('Falha ao salvar seção do PAD:', erro);
        mostrarToast('Não foi possível salvar.', 'erro');
      } finally {
        botao.disabled = false;
      }
    },
  });
  return botao;
}

export { criarElemento, carregarCssUmaVez, limparContainer, criarCard, criarBotao };
