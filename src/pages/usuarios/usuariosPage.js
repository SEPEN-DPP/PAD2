/**
 * Listagem de usuários institucionais + aprovação de solicitações de acesso
 * (Fase 1, 2026-07-14). Quem gerencia solicitações: Administrador (todas) ou
 * Direção/CPEN de uma unidade (só as da própria unidade) — ver
 * firestore.rules e docs/firestore-schema.md.
 */
import { criarElemento, carregarCssUmaVez, limparContainer } from '../../utils/domUtils.js';
import { criarPageHeader } from '../../components/pageHeader/pageHeader.js';
import { criarCard } from '../../components/card/card.js';
import { criarDataTable } from '../../components/dataTable/dataTable.js';
import { criarBotao } from '../../components/button/button.js';
import { criarEmptyState } from '../../components/emptyState/emptyState.js';
import {
  listarUsuarios,
  listarSolicitacoesPendentes,
  aprovarSolicitacao,
  excluirUsuario,
  calcularEscopoDeGestao,
} from '../../services/usuarios/usuarioService.js';
import { usuarioAtual, obterPerfilDoUsuario } from '../../services/auth/authService.js';
import { ROLE_LABELS } from '../../config/roles.js';
import { formatarCpf } from '../../utils/validationUtils.js';
import { mostrarToast } from '../../utils/toast.js';

const COLUNAS_USUARIOS = [
  { chave: 'nome', rotulo: 'Nome', render: (l) => l.nome ?? '—' },
  { chave: 'email', rotulo: 'E-mail', render: (l) => l.email ?? '—' },
  { chave: 'perfil', rotulo: 'Perfil', render: (l) => ROLE_LABELS[l.perfil] ?? l.perfil ?? '—' },
  { chave: 'unidade', rotulo: 'Unidade', render: (l) => l.unidade ?? '—' },
];

function criarCardSolicitacoes({ solicitacoes, unidadeDoGestor, onAtualizar }) {
  if (!solicitacoes.length) {
    return criarCard({
      titulo: 'Solicitações pendentes',
      filhos: [
        criarEmptyState({
          titulo: 'Nenhuma solicitação pendente',
          descricao: 'Pedidos de acesso à sua unidade aparecerão aqui para aprovação.',
          icon: 'users',
        }),
      ],
    });
  }

  const colunas = [
    { chave: 'nome', rotulo: 'Nome', render: (l) => l.nome ?? '—' },
    { chave: 'cpf', rotulo: 'CPF', render: (l) => formatarCpf(l.cpf) },
    { chave: 'dataNascimento', rotulo: 'Nascimento', render: (l) => l.dataNascimento ?? '—' },
    { chave: 'email', rotulo: 'E-mail', render: (l) => l.email ?? '—' },
    ...(unidadeDoGestor ? [] : [{ chave: 'unidadeSolicitada', rotulo: 'Unidade solicitada', render: (l) => l.unidadeSolicitada ?? '—' }]),
    {
      chave: 'acoes',
      rotulo: 'Ações',
      render: (l) => {
        const botaoAprovar = criarBotao({
          texto: 'Aprovar',
          icon: 'check',
          variante: 'primary',
          onClick: async () => {
            try {
              await aprovarSolicitacao(l.id, l.unidadeSolicitada);
              mostrarToast(`Acesso de ${l.nome} aprovado.`, 'sucesso');
              onAtualizar();
            } catch (erro) {
              console.error('Falha ao aprovar solicitação:', erro);
              mostrarToast('Não foi possível aprovar essa solicitação.', 'erro');
            }
          },
        });
        const botaoRecusar = criarBotao({
          texto: 'Recusar',
          icon: 'x',
          variante: 'danger',
          onClick: async () => {
            try {
              await excluirUsuario(l.id);
              mostrarToast(`Solicitação de ${l.nome} recusada.`, 'info');
              onAtualizar();
            } catch (erro) {
              console.error('Falha ao recusar solicitação:', erro);
              mostrarToast('Não foi possível recusar essa solicitação.', 'erro');
            }
          },
        });
        return criarElemento('div', { class: 'usuarios__acoes-linha' }, [botaoAprovar, botaoRecusar]);
      },
    },
  ];

  return criarCard({
    titulo: 'Solicitações pendentes',
    filhos: [criarDataTable({ colunas, linhas: solicitacoes })],
  });
}

function criarColunasUsuarios(escopo, meuUid, onExcluir) {
  if (!escopo.podeGerenciar) return COLUNAS_USUARIOS;
  return [
    ...COLUNAS_USUARIOS,
    {
      chave: 'acoes',
      rotulo: 'Ações',
      render: (l) => {
        const podeExcluirEssaLinha = l.id !== meuUid && (escopo.unidade === null || l.unidade === escopo.unidade);
        if (!podeExcluirEssaLinha) return '—';
        return criarBotao({
          texto: 'Excluir',
          icon: 'x',
          variante: 'danger',
          onClick: () => onExcluir(l),
        });
      },
    },
  ];
}

export async function render(container) {
  carregarCssUmaVez('src/pages/usuarios/usuariosPage.css');

  container.append(
    criarPageHeader({
      titulo: 'Usuários',
      descricao: 'Contas institucionais com acesso ao sistema.',
    }),
  );

  const meuUid = usuarioAtual()?.uid;
  const perfilUsuario = await obterPerfilDoUsuario(meuUid);
  const escopo = calcularEscopoDeGestao(perfilUsuario);

  const areaSolicitacoes = criarElemento('div');
  const areaUsuarios = criarElemento('div');
  container.append(areaSolicitacoes, areaUsuarios);

  async function atualizarSolicitacoes() {
    if (!escopo.podeGerenciar) return;
    const solicitacoes = await listarSolicitacoesPendentes(escopo.unidade);
    limparContainer(areaSolicitacoes);
    areaSolicitacoes.append(
      criarCardSolicitacoes({ solicitacoes, unidadeDoGestor: escopo.unidade, onAtualizar: () => {
        atualizarSolicitacoes();
        atualizarUsuarios();
      } }),
    );
  }

  async function atualizarUsuarios() {
    const usuarios = await listarUsuarios();
    limparContainer(areaUsuarios);
    areaUsuarios.append(
      criarCard({
        filhos: [
          criarDataTable({
            colunas: criarColunasUsuarios(escopo, meuUid, async (linha) => {
              try {
                await excluirUsuario(linha.id);
                mostrarToast(`${linha.nome} removido do sistema.`, 'info');
                atualizarUsuarios();
              } catch (erro) {
                console.error('Falha ao excluir usuário:', erro);
                mostrarToast('Não foi possível excluir esse usuário.', 'erro');
              }
            }),
            linhas: usuarios,
            vazio: {
              titulo: 'Nenhum usuário cadastrado ainda',
              descricao: 'A gestão completa de usuários chega conforme a Fase 1 avança.',
              icon: 'users',
            },
          }),
        ],
      }),
    );
  }

  await Promise.all([atualizarSolicitacoes(), atualizarUsuarios()]);
}
