/**
 * Abertura de um novo PAD. Nesta fase é APENAS interface: upload do PDF do
 * Registro de Infração e um botão "Analisar Registro" que ainda não chama
 * o parser (ver ARCHITECTURE.md → "Novo PAD" e ROADMAP.md → Fase 3). A
 * extração de campos será baseada em regras (regex sobre o texto do PDF),
 * sem dependência de IA paga — ver src/parser/README.md.
 * Nenhum dado é gravado no Firestore a partir desta tela nesta fase.
 */
import { criarElemento, carregarCssUmaVez } from '../../../utils/domUtils.js';
import { criarPageHeader } from '../../../components/pageHeader/pageHeader.js';
import { criarCard } from '../../../components/card/card.js';
import { criarDropzone } from '../../../components/dropzone/dropzone.js';
import { criarBotao } from '../../../components/button/button.js';
import { mostrarToast } from '../../../utils/toast.js';

export async function render(container) {
  carregarCssUmaVez('src/pages/pad/new/padNewPage.css');

  container.append(
    criarPageHeader({
      titulo: 'Novo PAD',
      descricao: 'Inicie o registro enviando o PDF do Registro de Infração do i-PEN.',
    }),
  );

  let arquivoSelecionado = null;

  const botaoAnalisar = criarBotao({
    texto: 'Analisar Registro',
    icon: 'search',
    disabled: true,
    onClick: () => {
      mostrarToast(
        `Leitura automática de "${arquivoSelecionado.name}" será habilitada na Fase 3 (extração baseada em regras, sem IA).`,
        'info',
      );
    },
  });

  const dropzone = criarDropzone({
    onArquivoSelecionado: (arquivo) => {
      arquivoSelecionado = arquivo;
      botaoAnalisar.disabled = false;
    },
  });

  container.append(
    criarCard({
      titulo: 'Registro de Infração',
      filhos: [
        dropzone,
        criarElemento('div', { class: 'pad-new__acoes' }, [botaoAnalisar]),
      ],
    }),
  );
}
