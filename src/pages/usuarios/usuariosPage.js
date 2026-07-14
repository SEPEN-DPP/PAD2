/**
 * Listagem de usuários institucionais. CRUD completo (criação, edição de
 * perfil/unidade) é da Fase 1 (ver ROADMAP.md) — aqui existe apenas leitura.
 */
import { carregarCssUmaVez } from '../../utils/domUtils.js';
import { criarPageHeader } from '../../components/pageHeader/pageHeader.js';
import { criarCard } from '../../components/card/card.js';
import { criarDataTable } from '../../components/dataTable/dataTable.js';
import { listarUsuarios } from '../../services/usuarios/usuarioService.js';
import { ROLE_LABELS } from '../../config/roles.js';

const COLUNAS = [
  { chave: 'nome', rotulo: 'Nome', render: (l) => l.nome ?? '—' },
  { chave: 'email', rotulo: 'E-mail', render: (l) => l.email ?? '—' },
  { chave: 'perfil', rotulo: 'Perfil', render: (l) => ROLE_LABELS[l.perfil] ?? l.perfil ?? '—' },
  { chave: 'unidade', rotulo: 'Unidade', render: (l) => l.unidade ?? '—' },
];

export async function render(container) {
  carregarCssUmaVez('src/pages/usuarios/usuariosPage.css');

  container.append(
    criarPageHeader({
      titulo: 'Usuários',
      descricao: 'Contas institucionais com acesso ao sistema.',
    }),
  );

  const usuarios = await listarUsuarios();

  container.append(
    criarCard({
      filhos: [
        criarDataTable({
          colunas: COLUNAS,
          linhas: usuarios,
          vazio: {
            titulo: 'Nenhum usuário cadastrado ainda',
            descricao: 'A gestão completa de usuários (criação e edição) chega na Fase 1.',
            icon: 'users',
          },
        }),
      ],
    }),
  );
}
