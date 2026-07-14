# Design system — resumo

Tokens completos em [`src/styles/tokens.css`](../src/styles/tokens.css). Este documento
resume as decisões visuais para quem for construir novas telas.

## Princípios

- **Não parecer formulário.** Conteúdo vive em `card`s com sombra suave, cantos
  arredondados (`--radius-lg`) e respiro generoso (`--space-5`/`--space-6`).
- **Sidebar recolhível** (`src/components/sidebar`), persistindo a preferência do usuário em
  `localStorage`.
- **Dark mode** via `prefers-color-scheme` (automático) ou atributo `data-theme` no
  `<html>` (alternância manual pelo botão na topbar, também persistida).
- **Ícones** são SVG inline (`src/components/icon/icon.js`) — sem CDN externo, sem fonte de
  ícones.
- **Cor com significado**: azul primário para ações; verde/âmbar/vermelho/azul-claro
  (`success`/`warning`/`danger`/`info`) para status e feedback — nunca decorativos.

## Componentes de base

| Componente | Uso |
|---|---|
| `card` | Envelope padrão de qualquer bloco de conteúdo |
| `statCard` | Indicador numérico (Dashboard) |
| `statusBadge` | Selo de status (PAD, evento) |
| `dataTable` | Listagens tabulares com estado vazio embutido |
| `timeline` | Histórico/atividades em ordem cronológica |
| `tabs` | Navegação entre seções de uma mesma entidade (detalhe do PAD) |
| `dropzone` | Upload de arquivo por arrastar/soltar ou seleção |
| `modal` | Diálogos modais |
| `emptyState` | Estado vazio padronizado (dados ainda não existentes) |
| `pageHeader` | Título + descrição + ações de uma página |
| `breadcrumbs` | Trilha de navegação hierárquica |

## Convenção de nomenclatura CSS

BEM simplificado: `.componente`, `.componente__parte`, `.componente--variante`. Todo
componente carrega seu próprio CSS sob demanda via `carregarCssUmaVez` (ver
`src/utils/domUtils.js`), evitando uma folha de estilos monolítica.
