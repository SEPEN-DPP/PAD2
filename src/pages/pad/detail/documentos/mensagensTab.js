/**
 * Aba "Mensagens" (2026-07-20) — thread de mensagens entre a Unidade e o(a)
 * defensor(a) vinculado a este PAD, no lugar do antigo card "Pendências" do
 * Dashboard (placeholder vazio da Fase 2). UI real em
 * src/components/mensagens/mensagensBoard.js, reaproveitada também pelo
 * Portal da Defesa do próprio defensor.
 */
import { criarQuadroMensagens } from '../../../../components/mensagens/mensagensBoard.js';
import { usuarioAtual, obterPerfilDoUsuario } from '../../../../services/auth/authService.js';
import { criarElemento } from './_shared.js';

export function renderMensagensTab(pad) {
  const container = criarElemento('div');

  obterPerfilDoUsuario(usuarioAtual()?.uid).then((perfil) => {
    const quadro = criarQuadroMensagens({
      pad,
      autor: {
        uid: usuarioAtual()?.uid,
        nome: perfil?.nome ?? usuarioAtual()?.email ?? 'Unidade',
        tipo: 'institucional',
      },
      titulo: 'Mensagens com o(a) defensor(a)',
    });
    container.append(quadro.elemento);
  });

  return container;
}
