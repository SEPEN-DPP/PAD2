/**
 * Listagem de usuários institucionais + aprovação de solicitações de acesso
 * (Fase 1, 2026-07-14). Quem gerencia o quê (ver docs/firestore-schema.md e
 * firestore.rules):
 * - Administrador: todas as contas, qualquer perfil.
 * - Direção/CPEN de uma unidade: só os Servidores da própria unidade.
 * - Superintendência Regional: os Servidores de todas as unidades da regional.
 */
import { criarElemento, carregarCssUmaVez, limparContainer } from '../../utils/domUtils.js';
import { criarPageHeader } from '../../components/pageHeader/pageHeader.js';
import { criarCard } from '../../components/card/card.js';
import { criarDataTable } from '../../components/dataTable/dataTable.js';
import { criarBotao } from '../../components/button/button.js';
import { criarEmptyState } from '../../components/emptyState/emptyState.js';
import { abrirModal } from '../../components/modal/modal.js';
import {
  listarSolicitacoesPendentes,
  listarUsuariosGerenciaveis,
  aprovarSolicitacao,
  editarUsuario,
  excluirUsuario,
  calcularEscopoDeGestao,
  descreverEscopo,
  PERFIS_ATRIBUIVEIS_POR_GESTOR,
} from '../../services/usuarios/usuarioService.js';
import { usuarioAtual, obterPerfilDoUsuario } from '../../services/auth/authService.js';
import { ROLE_LABELS, PAINEL_INSTITUCIONAL } from '../../config/roles.js';
import { formatarCpf, ehCampoObrigatorio } from '../../utils/validationUtils.js';
import { mostrarToast } from '../../utils/toast.js';

function criarCardSolicitacoes({ solicitacoes, escopo, onAtualizar }) {
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
    ...(escopo.campo ? [] : [{ chave: 'unidadeSolicitada', rotulo: 'Unidade solicitada', render: (l) => l.unidadeSolicitada ?? '—' }]),
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

function abrirModalEdicao({ usuarioAlvo, perfisPermitidos, onSalvar }) {
  const campoNome = criarElemento('input', { class: 'campo__input', type: 'text' });
  campoNome.value = usuarioAlvo.nome ?? '';

  const campoPerfil = criarElemento(
    'select',
    { class: 'campo__input' },
    perfisPermitidos.map((perfil) => {
      const atributos = { value: perfil };
      if (perfil === usuarioAlvo.perfil) atributos.selected = 'selected';
      return criarElemento('option', atributos, [ROLE_LABELS[perfil] ?? perfil]);
    }),
  );

  const botaoSalvar = criarBotao({ texto: 'Salvar', icon: 'check' });
  const fechar = abrirModal({
    titulo: `Editar ${usuarioAlvo.nome}`,
    conteudo: [
      criarElemento('label', { class: 'campo' }, [criarElemento('span', { class: 'campo__rotulo' }, ['Nome completo']), campoNome]),
      criarElemento('label', { class: 'campo' }, [criarElemento('span', { class: 'campo__rotulo' }, ['Perfil de acesso']), campoPerfil]),
    ],
    rodape: [botaoSalvar],
  });

  botaoSalvar.addEventListener('click', async () => {
    if (!ehCampoObrigatorio(campoNome.value)) {
      mostrarToast('O nome não pode ficar vazio.', 'aviso');
      return;
    }
    botaoSalvar.disabled = true;
    try {
      await onSalvar({ nome: campoNome.value.trim(), perfil: campoPerfil.value });
      fechar();
    } catch (erro) {
      console.error('Falha ao salvar edição de usuário:', erro);
      mostrarToast('Não foi possível salvar as alterações.', 'erro');
      botaoSalvar.disabled = false;
    }
  });
}

function criarColunasUsuarios({ escopo, meuUid, onEditar, onExcluir }) {
  const perfisPermitidos = escopo.campo ? PERFIS_ATRIBUIVEIS_POR_GESTOR : PAINEL_INSTITUCIONAL;
  return [
    { chave: 'nome', rotulo: 'Nome', render: (l) => l.nome ?? '—' },
    { chave: 'email', rotulo: 'E-mail', render: (l) => l.email ?? '—' },
    { chave: 'perfil', rotulo: 'Perfil', render: (l) => ROLE_LABELS[l.perfil] ?? l.perfil ?? '—' },
    { chave: 'unidade', rotulo: 'Unidade', render: (l) => l.unidade ?? '—' },
    {
      chave: 'acoes',
      rotulo: 'Ações',
      render: (l) => {
        if (l.id === meuUid) return '—';
        const botaoEditar = criarBotao({
          texto: 'Editar',
          icon: 'settings',
          variante: 'secondary',
          onClick: () => abrirModalEdicao({ usuarioAlvo: l, perfisPermitidos, onSalvar: (dados) => onEditar(l, dados) }),
        });
        const botaoExcluir = criarBotao({
          texto: 'Excluir',
          icon: 'x',
          variante: 'danger',
          onClick: () => onExcluir(l),
        });
        return criarElemento('div', { class: 'usuarios__acoes-linha' }, [botaoEditar, botaoExcluir]);
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
    const solicitacoes = await listarSolicitacoesPendentes(escopo);
    limparContainer(areaSolicitacoes);
    areaSolicitacoes.append(
      criarCardSolicitacoes({
        solicitacoes,
        escopo,
        onAtualizar: () => {
          atualizarSolicitacoes();
          atualizarUsuarios();
        },
      }),
    );
  }

  async function atualizarUsuarios() {
    const usuarios = escopo.podeGerenciar ? await listarUsuariosGerenciaveis(escopo) : [];
    limparContainer(areaUsuarios);
    areaUsuarios.append(
      criarCard({
        titulo: `Usuários — ${descreverEscopo(escopo)}`,
        filhos: [
          criarDataTable({
            colunas: criarColunasUsuarios({
              escopo,
              meuUid,
              onEditar: async (linha, dados) => {
                await editarUsuario(linha.id, dados);
                mostrarToast(`${linha.nome} atualizado.`, 'sucesso');
                atualizarUsuarios();
              },
              onExcluir: async (linha) => {
                try {
                  await excluirUsuario(linha.id);
                  mostrarToast(`${linha.nome} removido do sistema.`, 'info');
                  atualizarUsuarios();
                } catch (erro) {
                  console.error('Falha ao excluir usuário:', erro);
                  mostrarToast('Não foi possível excluir esse usuário.', 'erro');
                }
              },
            }),
            linhas: usuarios,
            vazio: {
              titulo: 'Nenhum usuário nesta unidade ainda',
              descricao: 'Servidores aprovados aparecerão aqui.',
              icon: 'users',
            },
          }),
        ],
      }),
    );
  }

  await Promise.all([atualizarSolicitacoes(), atualizarUsuarios()]);
}
