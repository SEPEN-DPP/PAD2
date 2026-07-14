/**
 * Formulário de login institucional. Autenticação real via Firebase Auth
 * (src/services/auth/authService.js). Recuperação de senha e cadastro são
 * geridos pelo Administrador na Fase 1 (ver ROADMAP.md) — esta tela só
 * autentica.
 */
import { criarElemento, carregarCssUmaVez } from '../../../utils/domUtils.js';
import { criarBotao } from '../../../components/button/button.js';
import { entrar } from '../../../services/auth/authService.js';
import { ehEmailValido, ehCampoObrigatorio } from '../../../utils/validationUtils.js';
import { mostrarToast } from '../../../utils/toast.js';

export function criarFormularioLogin() {
  carregarCssUmaVez('src/pages/auth/login/loginPage.css');

  const campoEmail = criarElemento('input', {
    type: 'email',
    name: 'email',
    class: 'campo__input',
    placeholder: 'nome@pps.sc.gov.br',
    autocomplete: 'username',
  });

  const campoSenha = criarElemento('input', {
    type: 'password',
    name: 'senha',
    class: 'campo__input',
    placeholder: '••••••••',
    autocomplete: 'current-password',
  });

  const botaoEntrar = criarBotao({ texto: 'Entrar', type: 'submit' });
  botaoEntrar.classList.add('w-full');

  const form = criarElemento(
    'form',
    { class: 'login-form' },
    [
      criarElemento('p', { class: 'text-muted' }, ['Acesse com sua conta institucional.']),
      criarElemento('label', { class: 'campo' }, [
        criarElemento('span', { class: 'campo__rotulo' }, ['E-mail']),
        campoEmail,
      ]),
      criarElemento('label', { class: 'campo' }, [
        criarElemento('span', { class: 'campo__rotulo' }, ['Senha']),
        campoSenha,
      ]),
      botaoEntrar,
    ],
  );

  form.addEventListener('submit', async (evento) => {
    evento.preventDefault();

    if (!ehEmailValido(campoEmail.value) || !ehCampoObrigatorio(campoSenha.value)) {
      mostrarToast('Preencha e-mail e senha válidos.', 'aviso');
      return;
    }

    botaoEntrar.disabled = true;
    try {
      await entrar(campoEmail.value.trim(), campoSenha.value);
    } catch (erro) {
      console.error('Falha no login:', erro);
      mostrarToast('E-mail ou senha inválidos.', 'erro');
    } finally {
      botaoEntrar.disabled = false;
    }
  });

  return form;
}
