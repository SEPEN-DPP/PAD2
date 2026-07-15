/**
 * Configurações gerais do sistema. Edição de parâmetros institucionais
 * (numeração de PAD, prazos padrão, modelos) é da Fase 2+ — mas "Alterar
 * Senha" é uma funcionalidade real (não maquete), disponível para qualquer
 * usuário autenticado.
 */
import { criarElemento, carregarCssUmaVez } from '../../utils/domUtils.js';
import { criarPageHeader } from '../../components/pageHeader/pageHeader.js';
import { criarCard } from '../../components/card/card.js';
import { criarEmptyState } from '../../components/emptyState/emptyState.js';
import { criarBotao } from '../../components/button/button.js';
import { alterarSenha, usuarioAtual, obterPerfilDoUsuario } from '../../services/auth/authService.js';
import { ehCampoObrigatorio } from '../../utils/validationUtils.js';
import { mostrarToast } from '../../utils/toast.js';
import { ROLES } from '../../config/roles.js';
import { obterConfiguracaoUnidade, salvarConfiguracaoUnidade } from '../../services/configuracoesUnidade/configuracaoUnidadeService.js';

const TAMANHO_MINIMO_SENHA = 6;

function criarCampoSenha({ rotulo, autocomplete }) {
  const input = criarElemento('input', {
    class: 'campo__input',
    type: 'password',
    autocomplete,
  });
  return {
    elemento: criarElemento('label', { class: 'campo' }, [
      criarElemento('span', { class: 'campo__rotulo' }, [rotulo]),
      input,
    ]),
    input,
  };
}

function criarFormularioAlterarSenha() {
  const senhaAtual = criarCampoSenha({ rotulo: 'Senha atual', autocomplete: 'current-password' });
  const novaSenha = criarCampoSenha({ rotulo: 'Nova senha', autocomplete: 'new-password' });
  const confirmarSenha = criarCampoSenha({ rotulo: 'Confirmar nova senha', autocomplete: 'new-password' });

  const botaoSalvar = criarBotao({ texto: 'Alterar senha', icon: 'check', type: 'submit' });

  const form = criarElemento(
    'form',
    { class: 'config-senha__form' },
    [
      senhaAtual.elemento,
      novaSenha.elemento,
      confirmarSenha.elemento,
      criarElemento('div', { class: 'config-senha__acoes' }, [botaoSalvar]),
    ],
  );

  form.addEventListener('submit', async (evento) => {
    evento.preventDefault();

    if (!ehCampoObrigatorio(senhaAtual.input.value) || !ehCampoObrigatorio(novaSenha.input.value)) {
      mostrarToast('Preencha a senha atual e a nova senha.', 'aviso');
      return;
    }
    if (novaSenha.input.value.length < TAMANHO_MINIMO_SENHA) {
      mostrarToast(`A nova senha precisa ter pelo menos ${TAMANHO_MINIMO_SENHA} caracteres.`, 'aviso');
      return;
    }
    if (novaSenha.input.value !== confirmarSenha.input.value) {
      mostrarToast('A confirmação não corresponde à nova senha.', 'aviso');
      return;
    }

    botaoSalvar.disabled = true;
    try {
      await alterarSenha(senhaAtual.input.value, novaSenha.input.value);
      mostrarToast('Senha alterada com sucesso.', 'sucesso');
      form.reset();
    } catch (erro) {
      console.error('Falha ao alterar senha:', erro);
      const mensagem = erro.code === 'auth/invalid-credential' || erro.code === 'auth/wrong-password'
        ? 'Senha atual incorreta.'
        : 'Não foi possível alterar a senha. Tente novamente.';
      mostrarToast(mensagem, 'erro');
    } finally {
      botaoSalvar.disabled = false;
    }
  });

  return form;
}

function criarCampoTexto({ rotulo, valor }) {
  const input = criarElemento('input', { class: 'campo__input', type: 'text' });
  input.value = valor ?? '';
  return { elemento: criarElemento('label', { class: 'campo' }, [criarElemento('span', { class: 'campo__rotulo' }, [rotulo]), input]), input };
}

/** Bloco "Nome completo" (+ opcionalmente Matrícula) reutilizado para Diretor(a) e cada integrante do Conselho. */
function criarBlocoPessoa(titulo, pessoa, { comMatricula = true } = {}) {
  const campoNome = criarCampoTexto({ rotulo: 'Nome completo', valor: pessoa?.nome });
  const campoMatricula = comMatricula ? criarCampoTexto({ rotulo: 'Matrícula', valor: pessoa?.matricula }) : null;
  const elemento = criarElemento(
    'fieldset',
    { class: 'campo-grupo' },
    [criarElemento('legend', {}, [titulo]), campoNome.elemento, campoMatricula?.elemento].filter(Boolean),
  );
  return { elemento, campoNome, campoMatricula };
}

/**
 * Conselho Disciplinar e Diretor(a) da Unidade (Fase 2, 2026-07-14) —
 * preenchidos uma vez por unidade e reaproveitados em todo PAD novo (ver
 * src/services/configuracoesUnidade/configuracaoUnidadeService.js e a aba
 * "Portaria" em src/pages/pad/detail/documentos/portariaTab.js). Só
 * DIRETOR/SUBDIRETOR com vínculo de UNIDADE (a própria unidade) veem este
 * card — quem tem vínculo REGIONAL ou é Administrador não tem uma única
 * unidade óbvia para configurar aqui.
 */
async function criarCardConfiguracaoUnidade(usuario) {
  const unidade = usuario.vinculo.valor;
  const configAtual = await obterConfiguracaoUnidade(unidade);

  const blocoDiretor = criarBlocoPessoa('Diretor(a) da Unidade', configAtual?.diretor, { comMatricula: false });
  const campoCargo = criarCampoTexto({ rotulo: 'Cargo', valor: configAtual?.diretor?.cargo || 'Diretor(a)' });
  blocoDiretor.elemento.append(campoCargo.elemento);

  const blocoPresidente = criarBlocoPessoa('Presidente do Conselho', configAtual?.conselho?.presidente);
  const blocoMembro1 = criarBlocoPessoa('Membro 1 do Conselho', configAtual?.conselho?.membro1);
  const blocoMembro2 = criarBlocoPessoa('Membro 2 do Conselho', configAtual?.conselho?.membro2);

  const botaoSalvar = criarBotao({
    texto: 'Salvar configuração da unidade',
    icon: 'check',
    onClick: async () => {
      if (!ehCampoObrigatorio(blocoDiretor.campoNome.input.value)) {
        mostrarToast('Informe o nome do(a) Diretor(a).', 'aviso');
        return;
      }
      botaoSalvar.disabled = true;
      try {
        await salvarConfiguracaoUnidade(
          unidade,
          {
            diretor: { nome: blocoDiretor.campoNome.input.value.trim(), cargo: campoCargo.input.value.trim() },
            conselho: {
              presidente: { nome: blocoPresidente.campoNome.input.value.trim(), matricula: blocoPresidente.campoMatricula.input.value.trim() },
              membro1: { nome: blocoMembro1.campoNome.input.value.trim(), matricula: blocoMembro1.campoMatricula.input.value.trim() },
              membro2: { nome: blocoMembro2.campoNome.input.value.trim(), matricula: blocoMembro2.campoMatricula.input.value.trim() },
            },
          },
          usuarioAtual()?.uid,
        );
        mostrarToast('Configuração da unidade salva.', 'sucesso');
      } catch (erro) {
        console.error('Falha ao salvar configuração da unidade:', erro);
        mostrarToast('Não foi possível salvar.', 'erro');
      } finally {
        botaoSalvar.disabled = false;
      }
    },
  });

  return criarCard({
    titulo: `Parâmetros institucionais — ${unidade}`,
    filhos: [
      criarElemento('p', { class: 'text-muted' }, ['Reaproveitados automaticamente em todo PAD novo desta unidade (Portaria, Conselho, Decisão).']),
      blocoDiretor.elemento,
      blocoPresidente.elemento,
      blocoMembro1.elemento,
      blocoMembro2.elemento,
      criarElemento('div', { class: 'config-senha__acoes' }, [botaoSalvar]),
    ],
  });
}

export async function render(container) {
  carregarCssUmaVez('src/pages/configuracoes/configuracoesPage.css');

  container.append(
    criarPageHeader({
      titulo: 'Configurações',
      descricao: 'Parâmetros gerais do sistema.',
    }),
  );

  container.append(criarCard({ titulo: 'Alterar Senha', filhos: [criarFormularioAlterarSenha()] }));

  const usuario = await obterPerfilDoUsuario(usuarioAtual()?.uid);
  const podeConfigurarUnidade = usuario?.vinculo?.tipo === 'UNIDADE' && [ROLES.DIRETOR, ROLES.SUBDIRETOR].includes(usuario.perfil);

  if (podeConfigurarUnidade) {
    container.append(await criarCardConfiguracaoUnidade(usuario));
  } else {
    container.append(
      criarCard({
        titulo: 'Parâmetros institucionais',
        filhos: [
          criarEmptyState({
            titulo: 'Nenhum parâmetro configurável para o seu perfil',
            descricao: 'Conselho Disciplinar e Diretor(a) da Unidade são configurados pela Direção/Subdireção de cada unidade.',
            icon: 'settings',
          }),
        ],
      }),
    );
  }
}
