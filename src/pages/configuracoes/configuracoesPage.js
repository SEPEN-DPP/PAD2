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
import { alterarSenha } from '../../services/auth/authService.js';
import { ehCampoObrigatorio } from '../../utils/validationUtils.js';
import { mostrarToast } from '../../utils/toast.js';

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

export async function render(container) {
  carregarCssUmaVez('src/pages/configuracoes/configuracoesPage.css');

  container.append(
    criarPageHeader({
      titulo: 'Configurações',
      descricao: 'Parâmetros gerais do sistema.',
    }),
  );

  container.append(
    criarCard({ titulo: 'Alterar Senha', filhos: [criarFormularioAlterarSenha()] }),
    criarCard({
      titulo: 'Parâmetros institucionais',
      filhos: [
        criarEmptyState({
          titulo: 'Nenhum parâmetro configurável ainda',
          descricao: 'Numeração de PAD, prazos padrão e modelos serão configuráveis em fases futuras.',
          icon: 'settings',
        }),
      ],
    }),
  );
}
