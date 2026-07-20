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
 * lança o evento correspondente na linha do tempo (ver ETAPAS_PAD). Quando
 * `chaveConfirmacao` é passada, qualquer "Salvar" reabre automaticamente o
 * documento se ele já estava confirmado (ver criarBotaoConfirmar) — evita
 * que o defensor veja, no Portal da Defesa, uma versão que está sendo
 * editada nesse momento.
 * @param {object} pad
 * @param {object} patch — objeto aninhado inteiro da seção (ex.: `{ conselho: {...} }`)
 * @param {{ etapa?: string, jaTinhaEtapa: boolean, chaveConfirmacao?: string }} opcoes
 */
export async function salvarSecaoDoPad(pad, patch, { etapa, jaTinhaEtapa, chaveConfirmacao } = {}) {
  const patchFinal = chaveConfirmacao
    ? { ...patch, confirmacoes: { ...pad.confirmacoes, [chaveConfirmacao]: { confirmado: false } } }
    : patch;
  await atualizarPad(pad.id, patchFinal);
  Object.assign(pad, patchFinal);

  if (etapa && !jaTinhaEtapa) {
    const perfil = await obterPerfilDoUsuario(usuarioAtual()?.uid);
    await criarEvento({
      padId: pad.id,
      tipo: etapa,
      responsavel: perfil?.nome ?? usuarioAtual()?.email ?? '—',
      data: new Date(),
      status: 'CONCLUIDO',
      observacoes: '',
      unidade: pad.dadosGerais?.unidade,
      superintendencia: pad.superintendencia ?? null,
    });
  }
}

/**
 * Marca um documento como confirmado/fechado — só documentos confirmados
 * aparecem no Portal da Defesa (ver src/pages/portal-defesa). Dispara um
 * evento na linha do tempo, além do evento de primeiro-preenchimento que
 * `salvarSecaoDoPad` já lança (dois marcos distintos: "começou" e "fechado").
 * @param {object} pad
 * @param {string} chaveConfirmacao — mesma chave usada em `pad.confirmacoes`
 */
export async function confirmarSecaoDoPad(pad, chaveConfirmacao) {
  const perfil = await obterPerfilDoUsuario(usuarioAtual()?.uid);
  const confirmadoPor = perfil?.nome ?? usuarioAtual()?.email ?? '—';
  const patch = {
    confirmacoes: {
      ...pad.confirmacoes,
      [chaveConfirmacao]: { confirmado: true, confirmadoEm: new Date(), confirmadoPor },
    },
  };
  await atualizarPad(pad.id, patch);
  Object.assign(pad, patch);
  await criarEvento({
    padId: pad.id,
    tipo: `${chaveConfirmacao.toUpperCase()}_CONFIRMADO`,
    responsavel: confirmadoPor,
    data: new Date(),
    status: 'CONCLUIDO',
    observacoes: '',
    unidade: pad.dadosGerais?.unidade,
    superintendencia: pad.superintendencia ?? null,
  });
}

/** Reabre um documento já confirmado (sem evento — é a instituição corrigindo algo, não um marco novo). */
export async function reabrirSecaoDoPad(pad, chaveConfirmacao) {
  const patch = { confirmacoes: { ...pad.confirmacoes, [chaveConfirmacao]: { confirmado: false } } };
  await atualizarPad(pad.id, patch);
  Object.assign(pad, patch);
}

/**
 * Botão "Confirmar documento" / "Reabrir" — alterna `pad.confirmacoes.<chave>`.
 * Qualquer usuário que já edita o PAD pode confirmar/reabrir (mesmo escopo de
 * `souCriadorDoPad` em firestore.rules — não há restrição adicional aqui).
 * @param {object} pad
 * @param {string} chaveConfirmacao
 * @param {{ onAtualizar?: () => void }} [opcoes]
 */
export function criarBotaoConfirmar(pad, chaveConfirmacao, { onAtualizar } = {}) {
  const estaConfirmado = () => Boolean(pad.confirmacoes?.[chaveConfirmacao]?.confirmado);

  const botao = criarBotao({
    texto: estaConfirmado() ? 'Reabrir' : 'Confirmar documento',
    icon: estaConfirmado() ? 'lock-open' : 'lock',
    variante: 'secondary',
    onClick: async () => {
      botao.disabled = true;
      try {
        if (estaConfirmado()) {
          await reabrirSecaoDoPad(pad, chaveConfirmacao);
          mostrarToast('Documento reaberto para edição.', 'sucesso');
        } else {
          await confirmarSecaoDoPad(pad, chaveConfirmacao);
          mostrarToast('Documento confirmado — já aparece no Portal da Defesa.', 'sucesso');
        }
        botao.querySelector('span:last-child').textContent = estaConfirmado() ? 'Reabrir' : 'Confirmar documento';
        onAtualizar?.();
      } catch (erro) {
        console.error('Falha ao confirmar/reabrir documento:', erro);
        mostrarToast('Não foi possível concluir a ação.', 'erro');
      } finally {
        botao.disabled = false;
      }
    },
  });

  return botao;
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

/** Acima disso, o base64 resultante fica perto demais do limite de ~1MB por documento do Firestore (o restante do PAD também mora no mesmo documento). */
const LIMITE_ANEXO_PERSISTIDO_CARACTERES = 700_000;

/**
 * Converte um arquivo (PDF ou imagem) em anexo persistível no PAD
 * (`{ dataUrls, nomeArquivo }`), ou `null` se o resultado ultrapassar
 * `LIMITE_ANEXO_PERSISTIDO_CARACTERES` — quem chama decide como avisar o
 * usuário nesse caso (ver uso em `criarAnexoSubstitutoPersistido` abaixo e em
 * src/pages/pad/new/padNewPage.js, que anexa automaticamente o PDF do
 * Registro de Infração à Documentação Inicial na criação do PAD).
 * @param {File} arquivo
 * @returns {Promise<{ dataUrls: string[], nomeArquivo: string } | null>}
 */
export async function converterParaAnexoPersistido(arquivo) {
  const dataUrls = await converterParaImagensEmbutidas(arquivo);
  const tamanho = dataUrls.reduce((soma, url) => soma + url.length, 0);
  if (tamanho > LIMITE_ANEXO_PERSISTIDO_CARACTERES) return null;
  return { dataUrls, nomeArquivo: arquivo.name };
}

/**
 * Igual a `criarAnexoSubstituto`, mas o anexo passa a ser PERSISTIDO no PAD
 * (via `salvarSecaoDoPad`/`atualizarPad` de quem chama este widget) em vez
 * de só durar a sessão do navegador — usado onde o anexo precisa sobreviver
 * a um recarregamento de página (Conselho, Decisão, e a Manifestação da
 * Defesa enviada pelo Portal da Defesa). Como não há Storage disponível
 * (Blaze), o limite de tamanho é o do próprio documento do Firestore.
 * @param {{ valorInicial?: { dataUrls: string[], nomeArquivo: string } | null, onMudar: () => void }} params
 */
export function criarAnexoSubstitutoPersistido({ valorInicial = null, onMudar }) {
  let anexo = valorInicial;
  const input = criarElemento('input', { type: 'file', accept: 'application/pdf,image/*', class: 'sr-only' });
  const legendaPadrao = 'Nenhum arquivo anexado — o texto acima é o que vai no documento gerado.';
  const legenda = criarElemento('span', { class: 'text-muted' }, [
    anexo ? `Anexado: ${anexo.nomeArquivo} (substitui o texto gerado nesta exportação)` : legendaPadrao,
  ]);
  const botaoRemover = criarBotao({
    texto: 'Remover anexo',
    icon: 'x',
    variante: 'danger',
    onClick: () => {
      anexo = null;
      input.value = '';
      legenda.textContent = legendaPadrao;
      botaoRemover.style.display = 'none';
      onMudar();
    },
  });
  botaoRemover.style.display = anexo ? '' : 'none';
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
      const anexoConvertido = await converterParaAnexoPersistido(arquivo);
      if (!anexoConvertido) {
        input.value = '';
        mostrarToast('Documento muito grande para anexar — cole o texto no campo acima ou envie um arquivo menor.', 'aviso');
        return;
      }
      anexo = anexoConvertido;
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
 * Dois botões de convite manual para o defensor — nenhum dos dois envia nada
 * sozinho, só preparam um rascunho de e-mail e é a própria pessoa quem
 * clica "Enviar" no cliente que abrir. Quando `jaTemAcesso` é falso (primeiro
 * vínculo do defensor, ainda sem senha), é reforço ao botão "Notificar
 * advogado — e-mail" (`defensorService.js:notificarDefensorPorEmail`), para
 * quando esse e-mail automático não chega. Quando `jaTemAcesso` é true (o
 * defensor já atende outro PAD e já tem senha — ver
 * `criarBlocoVinculoDefensor`), é o ÚNICO aviso disponível, já que reenviar
 * e-mail de redefinição de senha pra quem já tem acesso funcionando seria
 * confuso (ver §"Portal da Defesa" em docs/firestore-schema.md).
 * @param {{ email: string, padNumero: string, jaTemAcesso?: boolean }} params
 */
export function criarBotoesConvidarPorEmail({ email, padNumero, jaTemAcesso = false }) {
  const assunto = encodeURIComponent(`Acesso ao Portal da Defesa — PAD ${padNumero}`);
  const corpo = encodeURIComponent(
    jaTemAcesso
      ? `Olá,\n\nVocê agora também tem acesso ao PAD ${padNumero} no Portal da Defesa.\n\n` +
        `Acesse ${location.origin}${location.pathname} com o e-mail e a senha que você já usa.\n\nAtenciosamente.`
      : `Olá,\n\nVocê foi vinculado(a) ao PAD ${padNumero} no Portal da Defesa.\n\n` +
        `Acesse ${location.origin}${location.pathname} e clique em "Esqueci minha senha" ` +
        `usando este e-mail (${email}) para definir sua senha de acesso.\n\nAtenciosamente.`,
  );

  const botaoMailto = criarBotao({
    texto: 'Abrir e-mail',
    icon: 'mail',
    variante: 'secondary',
    onClick: () => {
      window.location.href = `mailto:${email}?subject=${assunto}&body=${corpo}`;
    },
  });

  const linkGmail = criarElemento(
    'a',
    {
      class: 'link-discreto',
      href: `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(email)}&su=${assunto}&body=${corpo}`,
      target: '_blank',
      rel: 'noopener',
    },
    ['ou abrir no Gmail'],
  );

  return criarElemento('div', { class: 'documentos__acoes' }, [botaoMailto, linkGmail]);
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
