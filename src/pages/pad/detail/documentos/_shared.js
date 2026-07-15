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
 * Envolve um card no modo "visualização por padrão, edição sob demanda":
 * o conteúdo (`corpo`) começa oculto; um botão "Editar" no cabeçalho do
 * card revela/esconde os campos. Evita deixar formulários abertos e
 * editáveis o tempo todo numa aba que já tem dados salvos.
 * @param {{ titulo: string, corpo: Node[] }} params
 * @returns {{ elemento: Node, esconder: () => void }}
 */
export function criarCardEditavel({ titulo, corpo }) {
  const areaCorpo = criarElemento('div', { class: 'documentos__corpo-editavel' }, corpo);
  areaCorpo.style.display = 'none';

  const botaoEditar = criarBotao({
    texto: 'Editar',
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
