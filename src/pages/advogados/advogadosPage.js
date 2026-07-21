/**
 * Relação de Advogados e Defensores Públicos (Fase 6+, 2026-07-19; passa a
 * cadastrar defensor público também em 2026-07-20, ver `categoria` em
 * advogadoCadastroModal.js) — diretório de contato institucional, com um
 * núcleo pré-importado de uma planilha real do i-PEN (ver
 * docs/firestore-schema.md e src/services/advogados/advogadoCadastroService.js).
 * Independente do Portal da Defesa: existe para qualquer defensor conhecido,
 * tenha ele vínculo ativo a algum PAD ou não.
 *
 * A busca por nome/OAB (`src/services/advogados/advogadoBuscaService.js`)
 * roda inteiramente no navegador sobre um arquivo estático
 * (`/public/dados/advogados-busca.json`, servido pelo Hosting) — nunca lê o
 * Firestore em massa, pra não estourar a cota diária do plano gratuito. Só
 * ao abrir um resultado é que o cadastro completo (endereço, telefone,
 * e-mail) é lido do Firestore, garantindo dado sempre atual. Mesmo índice e
 * mesmo modal de completude/edição (`advogadoCadastroModal.js`) reaproveitados
 * pela seleção de advogado na aba "Termo de Cientificação" (2026-07-20, ver
 * src/pages/pad/detail/documentos/termoCientificacaoTab.js).
 *
 * Cada resultado tem dois botões: "Visualizar" (somente leitura) e "Editar".
 * Qualquer gravação pelo modal de edição só é aceita com todos os campos
 * preenchidos (exceto complemento) e uma confirmação explícita — e sempre
 * marca `completo: true`, mesmo que o cadastro já estivesse completo antes.
 * Isso vale tanto para completar um cadastro pré-importado quanto para só
 * corrigir um dado de um cadastro que já estava completo — o objetivo é que,
 * uma vez confirmado, ninguém mais precise passar pelo aviso de novo.
 */
import { criarElemento, carregarCssUmaVez, limparContainer } from '../../utils/domUtils.js';
import { criarPageHeader } from '../../components/pageHeader/pageHeader.js';
import { criarCard } from '../../components/card/card.js';
import { criarBotao } from '../../components/button/button.js';
import { criarEmptyState } from '../../components/emptyState/emptyState.js';
import { abrirModal } from '../../components/modal/modal.js';
import { buscarPorOab } from '../../services/advogados/advogadoCadastroService.js';
import { carregarIndiceAdvogados, buscarAdvogados } from '../../services/advogados/advogadoBuscaService.js';
import { abrirModalEdicao } from './advogadoCadastroModal.js';
import { usuarioAtual, obterPerfilDoUsuario } from '../../services/auth/authService.js';

const LIMITE_RESULTADOS_EXIBIDOS = 50;

function criarLinhaLeitura(rotulo, valor) {
  return criarElemento('p', { class: 'advogados__linha-leitura' }, [
    criarElemento('strong', {}, [`${rotulo}: `]),
    valor || '—',
  ]);
}

/** Modal somente-leitura — nenhuma gravação acontece aqui. */
function abrirModalVisualizacao(dados) {
  abrirModal({
    titulo: `${dados?.nome || 'Advogado'} — OAB ${dados?.oab ?? '—'}`,
    conteudo: [
      criarLinhaLeitura('Categoria', dados?.categoria === 'DEFENSOR_PUBLICO' ? 'Defensor Público' : 'Advogado'),
      criarLinhaLeitura('Nome', dados?.nome),
      criarLinhaLeitura('OAB', dados?.oab),
      criarLinhaLeitura('Rua', dados?.endereco?.rua),
      criarLinhaLeitura('Número', dados?.endereco?.numero),
      criarLinhaLeitura('Complemento', dados?.endereco?.complemento),
      criarLinhaLeitura('Bairro', dados?.endereco?.bairro),
      criarLinhaLeitura('Cidade', dados?.endereco?.cidade),
      criarLinhaLeitura('Estado', dados?.endereco?.estado),
      criarLinhaLeitura('Telefone', dados?.telefone),
      criarLinhaLeitura('E-mail', dados?.email),
      !dados?.completo
        ? criarElemento('p', { class: 'text-muted' }, ['Cadastro ainda incompleto — use "Editar" para completá-lo.'])
        : null,
    ].filter(Boolean),
  });
}

const ROTULO_CATEGORIA = { DEFENSOR_PUBLICO: 'Defensor Público', ADVOGADO: 'Advogado' };

function criarResultado({ nome, oab, cidade, estado, categoria, onVisualizar, onEditar }) {
  const localizacao = [cidade, estado].filter(Boolean).join('/');
  const rotuloCategoria = ROTULO_CATEGORIA[categoria] ?? 'Advogado';
  const botaoVisualizar = criarBotao({ texto: 'Visualizar', icon: 'eye', variante: 'secondary', onClick: onVisualizar });
  const botaoEditar = criarBotao({ texto: 'Editar', icon: 'settings', variante: 'secondary', onClick: onEditar });
  return criarElemento('li', { class: 'documentos__item-lista' }, [
    criarElemento('span', {}, [`${nome} — OAB nº ${oab}${localizacao ? ` — ${localizacao}` : ''} — ${rotuloCategoria}`]),
    criarElemento('div', { class: 'advogados__acoes-linha' }, [botaoVisualizar, botaoEditar]),
  ]);
}

export async function render(container) {
  carregarCssUmaVez('src/pages/advogados/advogadosPage.css');
  carregarCssUmaVez('src/pages/pad/detail/documentos/documentos.css');

  const perfilUsuario = await obterPerfilDoUsuario(usuarioAtual()?.uid);

  const botaoAdicionar = criarBotao({
    texto: 'Adicionar advogado ou defensor público',
    icon: 'users',
    variante: 'secondary',
    onClick: () => {
      abrirModalEdicao({ oabOriginal: null, dadosIniciais: {}, perfilUsuario, onSalvo: () => {} });
    },
  });

  container.append(
    criarPageHeader({
      titulo: 'Advogados e Defensores Públicos',
      descricao: 'Busque por nome ou número da OAB para ver ou completar o cadastro de contato.',
      acoes: [botaoAdicionar],
    }),
  );

  const campoBusca = criarElemento('input', {
    class: 'campo__input advogados__campo-busca',
    type: 'search',
    placeholder: 'Buscar por nome ou OAB…',
  });
  const areaResultados = criarElemento('div');

  container.append(criarCard({ filhos: [campoBusca, areaResultados] }));

  const indice = await carregarIndiceAdvogados();

  async function abrirVisualizacao({ oab, nome }) {
    const dados = (await buscarPorOab(oab)) ?? { nome, oab };
    abrirModalVisualizacao(dados);
  }

  async function abrirEdicao({ oab, nome }) {
    const dados = (await buscarPorOab(oab)) ?? { nome, oab };
    abrirModalEdicao({ oabOriginal: oab, dadosIniciais: dados, perfilUsuario, onSalvo: () => {} });
  }

  let temporizadorBusca = null;
  function renderizarResultados(termo) {
    clearTimeout(temporizadorBusca);
    limparContainer(areaResultados);

    if (!termo.trim()) {
      areaResultados.append(
        criarEmptyState({ titulo: 'Digite para buscar', descricao: 'Busque por parte do nome ou pelo número da OAB.', icon: 'scale' }),
      );
      return;
    }

    // Debounced (2026-07-20): parte da busca agora consulta o Firestore ao
    // vivo (ver advogadoBuscaService.js:buscarAdvogados), não só o índice
    // estático — esperar uma pausa na digitação evita uma leitura por tecla.
    temporizadorBusca = setTimeout(async () => {
      const encontrados = await buscarAdvogados(indice, termo);
      if (campoBusca.value !== termo) return;
      limparContainer(areaResultados);

      if (!encontrados.length) {
        areaResultados.append(
          criarEmptyState({ titulo: 'Nenhum advogado encontrado', descricao: 'Confira a grafia ou use "Adicionar advogado ou defensor público" para cadastrar.', icon: 'scale' }),
        );
        return;
      }

      const exibidos = encontrados.slice(0, LIMITE_RESULTADOS_EXIBIDOS);
      const lista = criarElemento('ul', { class: 'documentos__lista-itens' });
      lista.replaceChildren(
        ...exibidos.map((item) =>
          criarResultado({
            nome: item.nome,
            oab: item.oab,
            cidade: item.cidade,
            estado: item.estado,
            categoria: item.categoria,
            onVisualizar: () => abrirVisualizacao({ oab: item.oab, nome: item.nome }),
            onEditar: () => abrirEdicao({ oab: item.oab, nome: item.nome }),
          }),
        ),
      );

      areaResultados.append(lista);
      if (encontrados.length > exibidos.length) {
        areaResultados.append(
          criarElemento('p', { class: 'text-muted' }, [`Mostrando ${exibidos.length} de ${encontrados.length} resultados — refine sua busca.`]),
        );
      }
    }, 350);
  }

  campoBusca.addEventListener('input', () => renderizarResultados(campoBusca.value));
  renderizarResultados('');
}
