/**
 * Formulário de login institucional. Autenticação real via Firebase Auth
 * (src/services/auth/authService.js). Autocadastro (Fase 1) fica na tela de
 * registro (src/pages/auth/registro) — aqui só autentica, recupera senha e
 * dá acesso ao link de solicitação de acesso.
 */
import { criarElemento, carregarCssUmaVez } from '../../../utils/domUtils.js';
import { criarBotao } from '../../../components/button/button.js';
import { entrar, solicitarRedefinicaoSenha } from '../../../services/auth/authService.js';
import { ehEmailValido, ehCampoObrigatorio } from '../../../utils/validationUtils.js';
import { mostrarToast } from '../../../utils/toast.js';

/** @param {{ onSolicitarAcesso: () => void }} [params] */
export function criarFormularioLogin({ onSolicitarAcesso } = {}) {
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

  const linkEsqueciSenha = criarElemento('button', { type: 'button', class: 'login-form__link' }, [
    'Esqueci minha senha',
  ]);
  linkEsqueciSenha.addEventListener('click', async () => {
    if (!ehEmailValido(campoEmail.value)) {
      mostrarToast('Digite seu e-mail no campo acima para redefinir a senha.', 'aviso');
      return;
    }
    try {
      await solicitarRedefinicaoSenha(campoEmail.value.trim());
      mostrarToast('Enviamos um e-mail com o link para redefinir sua senha.', 'sucesso');
    } catch (erro) {
      console.error('Falha ao solicitar redefinição de senha:', erro);
      mostrarToast('Não foi possível enviar o e-mail de redefinição.', 'erro');
    }
  });

  const linkSolicitarAcesso = criarElemento('button', { type: 'button', class: 'login-form__link' }, [
    'Não tenho conta — solicitar acesso',
  ]);
  if (onSolicitarAcesso) linkSolicitarAcesso.addEventListener('click', onSolicitarAcesso);

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
      criarElemento('div', { class: 'login-form__links' }, [linkEsqueciSenha, linkSolicitarAcesso]),
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
