/**
 * Autocadastro (Fase 1). Formulário público (fora do painel autenticado):
 * a pessoa se cadastra e o pedido fica com status "PENDENTE" até a
 * Direção/CPEN da unidade solicitada aprovar ou recusar (ver
 * src/pages/usuarios/usuariosPage.js). Nenhum perfil de acesso é concedido
 * aqui — só depois da aprovação.
 */
import { criarElemento, carregarCssUmaVez } from '../../../utils/domUtils.js';
import { criarBotao } from '../../../components/button/button.js';
import { registrarSolicitacaoAcesso, completarSolicitacaoAcesso, sair } from '../../../services/auth/authService.js';
import {
  ehEmailValido,
  ehCampoObrigatorio,
  ehCpfValido,
  ehDataBrValida,
  formatarCpf,
} from '../../../utils/validationUtils.js';
import { UNIDADES_PRISIONAIS } from '../../../config/unidadesPrisionais.js';
import { mostrarToast } from '../../../utils/toast.js';

const TAMANHO_MINIMO_SENHA = 6;

function criarCampoTexto({ rotulo, placeholder, type = 'text' }) {
  const input = criarElemento('input', { class: 'campo__input', type, placeholder });
  return {
    elemento: criarElemento('label', { class: 'campo' }, [criarElemento('span', { class: 'campo__rotulo' }, [rotulo]), input]),
    input,
  };
}

function criarCampoUnidade() {
  const unidadesOrdenadas = [...UNIDADES_PRISIONAIS].sort((a, b) => a.nome.localeCompare(b.nome));
  const select = criarElemento('select', { class: 'campo__input' }, [
    criarElemento('option', { value: '' }, ['Selecione a unidade...']),
    ...unidadesOrdenadas.map((unidade) => criarElemento('option', { value: unidade.nome }, [unidade.nome])),
  ]);
  return {
    elemento: criarElemento('label', { class: 'campo' }, [criarElemento('span', { class: 'campo__rotulo' }, ['Unidade prisional']), select]),
    input: select,
  };
}

/** @param {{ onVoltarParaLogin: () => void }} params */
export function criarFormularioRegistro({ onVoltarParaLogin }) {
  carregarCssUmaVez('src/pages/auth/registro/registroPage.css');

  const nome = criarCampoTexto({ rotulo: 'Nome completo' });
  const dataNascimento = criarCampoTexto({ rotulo: 'Data de nascimento', placeholder: 'dd/mm/aaaa' });
  const cpf = criarCampoTexto({ rotulo: 'CPF', placeholder: '000.000.000-00' });
  const email = criarCampoTexto({ rotulo: 'E-mail', type: 'email', placeholder: 'nome@pp.sc.gov.br' });
  const senha = criarCampoTexto({ rotulo: 'Senha', type: 'password' });
  const confirmarSenha = criarCampoTexto({ rotulo: 'Confirmar senha', type: 'password' });
  const unidade = criarCampoUnidade();

  cpf.input.addEventListener('blur', () => {
    if (cpf.input.value.trim()) cpf.input.value = formatarCpf(cpf.input.value);
  });

  const botaoEnviar = criarBotao({ texto: 'Solicitar acesso', type: 'submit' });
  botaoEnviar.classList.add('w-full');

  const linkVoltar = criarElemento(
    'button',
    { type: 'button', class: 'registro-form__voltar' },
    ['Já tenho conta — voltar para o login'],
  );
  linkVoltar.addEventListener('click', onVoltarParaLogin);

  const form = criarElemento(
    'form',
    { class: 'registro-form' },
    [
      criarElemento('p', { class: 'text-muted' }, [
        'Preencha seus dados para solicitar acesso ao sistema. Sua solicitação será analisada pela Direção ou CPEN da unidade selecionada.',
      ]),
      nome.elemento,
      dataNascimento.elemento,
      cpf.elemento,
      email.elemento,
      senha.elemento,
      confirmarSenha.elemento,
      unidade.elemento,
      botaoEnviar,
      linkVoltar,
    ],
  );

  form.addEventListener('submit', async (evento) => {
    evento.preventDefault();

    if (
      !ehCampoObrigatorio(nome.input.value) ||
      !ehCampoObrigatorio(unidade.input.value) ||
      !ehCampoObrigatorio(senha.input.value)
    ) {
      mostrarToast('Preencha todos os campos.', 'aviso');
      return;
    }
    if (!ehDataBrValida(dataNascimento.input.value)) {
      mostrarToast('Informe a data de nascimento no formato dd/mm/aaaa.', 'aviso');
      return;
    }
    if (!ehCpfValido(cpf.input.value)) {
      mostrarToast('CPF inválido. Confira os números digitados.', 'aviso');
      return;
    }
    if (!ehEmailValido(email.input.value)) {
      mostrarToast('Informe um e-mail válido.', 'aviso');
      return;
    }
    if (senha.input.value.length < TAMANHO_MINIMO_SENHA) {
      mostrarToast(`A senha precisa ter pelo menos ${TAMANHO_MINIMO_SENHA} caracteres.`, 'aviso');
      return;
    }
    if (senha.input.value !== confirmarSenha.input.value) {
      mostrarToast('A confirmação não corresponde à senha.', 'aviso');
      return;
    }

    botaoEnviar.disabled = true;
    try {
      await registrarSolicitacaoAcesso({
        nome: nome.input.value.trim(),
        email: email.input.value.trim(),
        senha: senha.input.value,
        cpf: cpf.input.value,
        dataNascimento: dataNascimento.input.value,
        unidade: unidade.input.value,
      });
      mostrarToast('Solicitação enviada! Aguarde a aprovação da sua unidade.', 'sucesso');
    } catch (erro) {
      console.error('Falha ao registrar solicitação de acesso:', erro);
      const mensagem = erro.code === 'auth/email-already-in-use'
        ? 'Este e-mail já possui uma solicitação ou conta. Se você foi removido antes, use "Esqueci minha senha" no login.'
        : 'Não foi possível enviar sua solicitação. Tente novamente.';
      mostrarToast(mensagem, 'erro');
      botaoEnviar.disabled = false;
    }
  });

  return form;
}

/**
 * Variante para quem já tem conta de autenticação (ex.: solicitação
 * recusada/excluída antes) mas não tem mais documento em `usuarios` — só
 * pede os dados de novo, sem criar uma conta nova. Ver
 * completarSolicitacaoAcesso em src/services/auth/authService.js.
 */
export function criarFormularioCompletarCadastro() {
  carregarCssUmaVez('src/pages/auth/registro/registroPage.css');

  const nome = criarCampoTexto({ rotulo: 'Nome completo' });
  const dataNascimento = criarCampoTexto({ rotulo: 'Data de nascimento', placeholder: 'dd/mm/aaaa' });
  const cpf = criarCampoTexto({ rotulo: 'CPF', placeholder: '000.000.000-00' });
  const unidade = criarCampoUnidade();

  cpf.input.addEventListener('blur', () => {
    if (cpf.input.value.trim()) cpf.input.value = formatarCpf(cpf.input.value);
  });

  const botaoEnviar = criarBotao({ texto: 'Enviar nova solicitação', type: 'submit' });
  botaoEnviar.classList.add('w-full');

  const linkSair = criarElemento('button', { type: 'button', class: 'registro-form__voltar' }, ['Sair']);
  linkSair.addEventListener('click', () => sair());

  const form = criarElemento(
    'form',
    { class: 'registro-form' },
    [
      criarElemento('p', { class: 'text-muted' }, [
        'Não encontramos um cadastro ativo para sua conta. Preencha os dados novamente para enviar uma nova solicitação de acesso.',
      ]),
      nome.elemento,
      dataNascimento.elemento,
      cpf.elemento,
      unidade.elemento,
      botaoEnviar,
      linkSair,
    ],
  );

  form.addEventListener('submit', async (evento) => {
    evento.preventDefault();

    if (!ehCampoObrigatorio(nome.input.value) || !ehCampoObrigatorio(unidade.input.value)) {
      mostrarToast('Preencha todos os campos.', 'aviso');
      return;
    }
    if (!ehDataBrValida(dataNascimento.input.value)) {
      mostrarToast('Informe a data de nascimento no formato dd/mm/aaaa.', 'aviso');
      return;
    }
    if (!ehCpfValido(cpf.input.value)) {
      mostrarToast('CPF inválido. Confira os números digitados.', 'aviso');
      return;
    }

    botaoEnviar.disabled = true;
    try {
      await completarSolicitacaoAcesso({
        nome: nome.input.value.trim(),
        cpf: cpf.input.value,
        dataNascimento: dataNascimento.input.value,
        unidade: unidade.input.value,
      });
      mostrarToast('Solicitação enviada! Aguarde a aprovação da sua unidade.', 'sucesso');
    } catch (erro) {
      console.error('Falha ao completar solicitação de acesso:', erro);
      mostrarToast('Não foi possível enviar sua solicitação. Tente novamente.', 'erro');
      botaoEnviar.disabled = false;
    }
  });

  return form;
}
