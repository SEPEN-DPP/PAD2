/**
 * Sidebar de navegação principal. Recolhível, com persistência da preferência
 * em localStorage. Não conhece regra de permissão — recebe a lista de rotas
 * já filtrada pelo perfil do usuário (ver src/layout/appShell.js).
 */
import { criarElemento, carregarCssUmaVez } from '../../utils/domUtils.js';
import { icone } from '../icon/icon.js';
import { APP_SHORT_NAME } from '../../config/constants.js';

const CHAVE_COLAPSADA = 'pad2:sidebar-colapsada';

/**
 * @param {{ rotas: Array, rotaAtiva: string, onNavegar: (path: string) => void }} params
 */
export function criarSidebar({ rotas, rotaAtiva, onNavegar }) {
  carregarCssUmaVez('src/components/sidebar/sidebar.css');

  const colapsada = localStorage.getItem(CHAVE_COLAPSADA) === '1';

  const marca = criarElemento('div', { class: 'sidebar__marca' }, [
    icone('building', { class: 'sidebar__marca-icone' }),
    criarElemento('span', { class: 'sidebar__marca-texto' }, [APP_SHORT_NAME]),
  ]);

  const nav = criarElemento('nav', { class: 'sidebar__nav' });
  for (const rota of rotas) {
    const ativo = rotaAtiva === rota.path || rotaAtiva.startsWith(`${rota.path}/`);
    const link = criarElemento(
      'button',
      {
        class: `sidebar__item${ativo ? ' sidebar__item--ativo' : ''}`,
        type: 'button',
        title: rota.title,
        dataset: { path: rota.path },
        onClick: () => onNavegar(rota.path),
      },
      [
        criarElemento('span', { class: 'sidebar__item-icone' }, [icone(rota.icon)]),
        criarElemento('span', { class: 'sidebar__item-texto' }, [rota.title]),
      ],
    );
    nav.append(link);
  }

  const botaoColapsar = criarElemento(
    'button',
    { class: 'sidebar__colapsar', type: 'button', title: 'Recolher menu' },
    [icone('chevron-left', { class: 'sidebar__colapsar-icone' })],
  );

  const raiz = criarElemento('aside', { class: 'sidebar' }, [marca, nav, botaoColapsar]);

  botaoColapsar.addEventListener('click', () => {
    const novoEstado = !raiz.classList.contains('sidebar--colapsada');
    raiz.classList.toggle('sidebar--colapsada', novoEstado);
    botaoColapsar.innerHTML = icone(novoEstado ? 'chevron-right' : 'chevron-left');
    localStorage.setItem(CHAVE_COLAPSADA, novoEstado ? '1' : '0');
  });

  if (colapsada) {
    raiz.classList.add('sidebar--colapsada');
    botaoColapsar.innerHTML = icone('chevron-right');
  }

  /** Atualiza qual item está marcado como ativo sem recriar a sidebar. */
  raiz.atualizarRotaAtiva = (novaRotaAtiva) => {
    for (const item of nav.querySelectorAll('.sidebar__item')) {
      const path = item.dataset.path;
      const ativo = novaRotaAtiva === path || novaRotaAtiva.startsWith(`${path}/`);
      item.classList.toggle('sidebar__item--ativo', ativo);
    }
  };

  return raiz;
}
