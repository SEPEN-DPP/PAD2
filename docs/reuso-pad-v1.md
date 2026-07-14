# Reaproveitamento do PAD V1

Registro do que foi analisado no repositório antigo ([SEPEN-DPP/PAD](https://github.com/SEPEN-DPP/PAD))
em 2026-07-14 e o que foi efetivamente portado para a V2 — para não perder o rastro de onde
veio cada dado, e para não reavaliar o mesmo material duas vezes.

## Já portado

- **Unidades prisionais** → [`src/config/unidadesPrisionais.js`](../src/config/unidadesPrisionais.js).
  8 Superintendências Regionais + unidades prisionais do Estado (nome, cidade, diretor,
  e-mail, telefone, endereço). Origem: `data/unidades.json` do V1.
- **Base legal** → [`src/config/baseLegal.js`](../src/config/baseLegal.js). Artigos da LEP
  (faltas graves, art. 50 e 52), artigos e incisos da LC 529/2011-SC (faltas leves/médias,
  art. 95 e 96) e catálogo de sanções para falta grave. Origem: `js/dados.js` do V1.

Ambos são dado de referência estático (sem lógica de negócio), consumidos futuramente por
formulários/seletores nas Fases 2+. Nomes de diretor e contatos mudam com o tempo — avaliar
migrar para uma coleção editável do Firestore quando existir tela de gestão (Fase 1/2).

## Identificado, ainda não portado (decidir quando a fase correspondente chegar)

- **Texto dos 9 modelos de documento** (Portaria, Termo de Cientificação, Oitiva do
  Incidentado, Oitiva de Testemunha/Informante, Manifestação do Conselho — 3 variantes,
  Manifestação da Defesa, Decisão da Direção, Ofício à VEP, Ofício ao Juiz) — origem
  `js/templates.js`. Reaproveitar o **texto jurídico**, reimplementado como funções puras em
  `src/templates/` que recebem o objeto PAD (Fase 4).
- **Timbre/formatação institucional**: fonte Arial, corpo 11pt/1.15, parágrafo justificado
  com recuo de 1,25cm, cabeçalho (brasão + 4 linhas institucionais) e rodapé (unidade +
  endereço), margens `@page` em cm — origem `css/pad.css` e a string de CSS duplicada em
  `js/exportar.js`. Portar como um único CSS de impressão em `src/templates`, sem duplicar
  entre tela e exportação (motivo da duplicação ter existido no V1 — ver
  [ARCHITECTURE.md](../ARCHITECTURE.md)).
- **Dois ofícios distintos ao juízo**: um na abertura do PAD (comunicação) e outro no
  encerramento (encaminhamento à VEP) — o ROADMAP atual só previa um. Avaliar adicionar o
  ofício de abertura ao fluxo processual (Fase 2).
- **Modelo de dados do PAD mais completo**: `testemunhas[]`, `conselho` (presidente +
  2 membros com matrícula), `decisao.sancoes` detalhado por tipo, distinção
  silêncio/versão do incidentado — origem `js/estado.js`. Usar como blueprint ao desenhar o
  schema real de `pads`/`eventos` na Fase 2.
- **Portal do Advogado via link mágico** (token único, sem conta de Firebase Auth) em vez
  de conta de e-mail/senha — origem `js/pad-firestore.js` (coleções `pad_links`,
  `advogado_auth`). Reavaliar a abordagem descrita em ARCHITECTURE.md §6 para a Fase 6 à luz
  disso.
- ~~Detecção automática de artigo por palavra-chave~~ — **feito, mas melhor que o V1**
  (2026-07-14). O V1 (`js/pdf-parser.js`) adivinhava o artigo por palavras-chave soltas no
  texto (frágil). A V2 usa correspondência de texto: o texto cadastrado no i-PEN para cada
  infração já segue de perto a redação da LEP, então `identificarArtigoLep` (em
  `src/parser/registroInfracaoParser.js`) verifica se o texto de um artigo do catálogo
  (`src/config/baseLegal.js`) está contido no texto extraído — mais preciso, e sempre
  sujeito a confirmação humana (select pré-selecionado, nunca aplicado sem revisão).

## Divergência encontrada (não resolvida)

O parser do V1 extrai `ipen` do campo **`RG i-PEN:`** do formulário e mantém `prontuário`
como campo separado — o oposto do que foi confirmado com o usuário para a V2 (`ipen` =
`Prontuário:`, ver [src/parser/README.md](../src/parser/README.md)). Não sabemos se o V1
estava errado ou se houve mudança de entendimento institucional; registrado aqui para não
se perder.

## Deliberadamente não reaproveitado

Nenhum código do V1 foi copiado — só conteúdo/dado. Ver [ARCHITECTURE.md](../ARCHITECTURE.md)
para o porquê (arquivo único de 2500+ linhas, sem camada de serviço, CSS duplicado,
coleções do Firestore sobrepostas — exatamente os problemas que a V2 foi desenhada para
evitar).
