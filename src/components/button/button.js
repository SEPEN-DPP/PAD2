/**
 * Helper para criar botões consistentes. As classes `.btn*` estão em
 * button.css e podem ser aplicadas diretamente em markup estático também.
 */
import { criarElemento, carregarCssUmaVez } from '../../utils/domUtils.js';
import { icone } from '../icon/icon.js';

/**
 * @param {{ texto: string, variante?: 'primary'|'secondary'|'ghost'|'danger', icon?: string, onClick?: () => void, type?: string, disabled?: boolean }} params
 */
export function criarBotao({ texto, variante = 'primary', icon, onClick, type = 'button', disabled = false }) {
  carregarCssUmaVez('src/components/button/button.css');

  const filhos = [];
  if (icon) filhos.push(criarElemento('span', { class: 'btn__icone' }, [icone(icon, { size: 18 })]));
  filhos.push(criarElemento('span', {}, [texto]));

  return criarElemento(
    'button',
    { class: `btn btn--${variante}`, type, onClick, disabled: disabled ? '' : undefined },
    filhos,
  );
}
