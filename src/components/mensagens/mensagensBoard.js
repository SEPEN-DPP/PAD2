/**
 * Quadro de mensagens de um PAD (2026-07-20) — thread simples entre a
 * Unidade e o(a) defensor(a) vinculado, reaproveitado tanto pela aba
 * "Mensagens" do painel institucional (ver
 * src/pages/pad/detail/documentos/mensagensTab.js) quanto pelo Portal da
 * Defesa do próprio defensor (ver src/pages/portal-defesa/portalDefesaPage.js)
 * — só muda quem está autenticado como autor. Sem edição/exclusão (log de
 * conversa) e sem listener em tempo real — a lista atualiza ao enviar uma
 * mensagem ou reabrir a tela, mesmo padrão de leitura do resto do app.
 */
import { criarElemento, carregarCssUmaVez } from '../../utils/domUtils.js';
import { criarCard } from '../card/card.js';
import { criarBotao } from '../button/button.js';
import { listarMensagensDoPad, enviarMensagem } from '../../services/mensagens/mensagemService.js';
import { formatarDataHora } from '../../utils/dateUtils.js';
import { mostrarToast } from '../../utils/toast.js';

function criarLinhaMensagem(mensagem) {
  return criarElemento('li', { class: `mensagens__item mensagens__item--${mensagem.autorTipo}` }, [
    criarElemento('div', { class: 'mensagens__cabecalho' }, [
      criarElemento('strong', {}, [mensagem.autorNome || (mensagem.autorTipo === 'defensor' ? 'Defensor(a)' : 'Unidade')]),
      criarElemento('span', { class: 'text-muted' }, [formatarDataHora(mensagem.criadoEm)]),
    ]),
    criarElemento('p', {}, [mensagem.texto]),
  ]);
}

/**
 * @param {{ pad: object, autor: { uid: string, nome: string, tipo: 'institucional'|'defensor' }, titulo?: string }} params
 * @returns {{ elemento: Node, atualizar: () => Promise<void> }}
 */
export function criarQuadroMensagens({ pad, autor, titulo = 'Mensagens' }) {
  carregarCssUmaVez('src/components/mensagens/mensagensBoard.css');

  const areaLista = criarElemento('ul', { class: 'mensagens__lista' });
  const campoTexto = criarElemento('textarea', { class: 'campo__input', rows: '3', placeholder: 'Escreva uma mensagem...' });

  async function atualizar() {
    const mensagens = await listarMensagensDoPad(pad.id);
    const filhos = mensagens.length
      ? mensagens.map(criarLinhaMensagem)
      : [criarElemento('p', { class: 'text-muted' }, ['Nenhuma mensagem ainda.'])];
    areaLista.replaceChildren(...filhos);
  }

  const botaoEnviar = criarBotao({
    texto: 'Enviar',
    icon: 'mail',
    onClick: async () => {
      const texto = campoTexto.value.trim();
      if (!texto) {
        mostrarToast('Escreva uma mensagem antes de enviar.', 'aviso');
        return;
      }
      botaoEnviar.disabled = true;
      try {
        await enviarMensagem({
          padId: pad.id,
          texto,
          autorUid: autor.uid,
          autorNome: autor.nome,
          autorTipo: autor.tipo,
          unidade: pad.dadosGerais?.unidade,
          superintendencia: pad.superintendencia ?? null,
        });
        campoTexto.value = '';
        await atualizar();
      } catch (erro) {
        console.error('Falha ao enviar mensagem:', erro);
        mostrarToast('Não foi possível enviar a mensagem.', 'erro');
      } finally {
        botaoEnviar.disabled = false;
      }
    },
  });

  atualizar();

  return {
    elemento: criarCard({
      titulo,
      filhos: [areaLista, criarElemento('div', { class: 'mensagens__form' }, [campoTexto, botaoEnviar])],
    }),
    atualizar,
  };
}
