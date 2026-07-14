/**
 * Tela mostrada a um usuário autenticado cuja solicitação de acesso ainda
 * não foi aprovada (status "PENDENTE" em `usuarios`) — ver
 * src/pages/usuarios/usuariosPage.js para a aprovação/recusa.
 */
import { criarElemento, carregarCssUmaVez } from '../../../utils/domUtils.js';
import { criarBotao } from '../../../components/button/button.js';
import { icone } from '../../../components/icon/icon.js';
import { sair } from '../../../services/auth/authService.js';

/** @param {{ nome?: string, unidade?: string }} params */
export function criarTelaAguardando({ nome, unidade } = {}) {
  carregarCssUmaVez('src/pages/auth/aguardando/aguardandoPage.css');

  const botaoSair = criarBotao({ texto: 'Sair', variante: 'secondary', icon: 'log-out', onClick: () => sair() });

  return criarElemento('div', { class: 'aguardando' }, [
    criarElemento('div', { class: 'aguardando__icone' }, [icone('list-checks', { size: 28 })]),
    criarElemento('h2', {}, [nome ? `Olá, ${nome}!` : 'Solicitação em análise']),
    criarElemento('p', { class: 'text-muted' }, [
      unidade
        ? `Sua solicitação de acesso para a unidade "${unidade}" está aguardando aprovação da Direção ou do CPEN.`
        : 'Sua solicitação de acesso está aguardando aprovação da Direção ou do CPEN da unidade selecionada.',
    ]),
    criarElemento('p', { class: 'text-muted' }, ['Assim que for aprovada, você poderá entrar normalmente.']),
    botaoSair,
  ]);
}
