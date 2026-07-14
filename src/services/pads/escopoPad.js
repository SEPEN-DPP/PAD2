/**
 * Calcula quais unidades prisionais um usuário pode ver, a partir do campo
 * `vinculo` do seu perfil (ver docs/firestore-schema.md). Usado pelo
 * Dashboard e pela listagem de PAD para filtrar as consultas em
 * src/services/pads/padService.js — não é regra de permissão de página
 * (isso é `src/config/roles.js`), é recorte de dados.
 */
import { UNIDADES_PRISIONAIS } from '../../config/unidadesPrisionais.js';
import { ROLES } from '../../config/roles.js';

/**
 * @param {{ perfil?: string, vinculo?: { tipo: 'UNIDADE'|'REGIONAL', valor: string } }} perfilUsuario
 * @returns {string[] | null} lista de nomes de unidade para filtrar, ou `null` para não filtrar (vê tudo)
 */
export function calcularUnidadesVisiveis(perfilUsuario) {
  if (!perfilUsuario) return null;
  if (perfilUsuario.perfil === ROLES.ADMINISTRADOR) return null;

  const vinculo = perfilUsuario.vinculo;
  if (!vinculo) return null;

  if (vinculo.tipo === 'REGIONAL') {
    return UNIDADES_PRISIONAIS.filter((unidade) => unidade.superintendencia === vinculo.valor).map(
      (unidade) => unidade.nome,
    );
  }

  if (vinculo.tipo === 'UNIDADE') {
    return [vinculo.valor];
  }

  return null;
}
