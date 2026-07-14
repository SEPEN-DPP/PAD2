# Arquitetura — PAD V2 (Polícia Penal de Santa Catarina)

Este documento descreve as decisões técnicas e arquiteturais da V2 do Sistema Eletrônico
de Processo Administrativo Disciplinar (PAD). Ele é a referência viva do projeto: qualquer
mudança estrutural relevante deve ser refletida aqui.

## 1. Visão geral

O PAD V2 **não é um gerador de documentos**. É um sistema processual eletrônico, inspirado
em plataformas como eproc, e-SAJ e PJe, onde:

- O **dado** é a fonte da verdade.
- O **documento** é uma *projeção* do dado (renderizado sob demanda a partir do objeto PAD).
- Todo o sistema gira em torno de um único agregado de domínio: o objeto **PAD**.

Isso significa que nenhuma tela grava informação "dentro" de um documento — tudo é
persistido de forma estruturada no Firestore, e os documentos (portaria, termo de
cientificação, ofício etc.) serão futuramente gerados a partir desses dados via o módulo
`src/templates` + `src/parser`/`src/ai` (fases futuras, ver [ROADMAP.md](ROADMAP.md)).

## 2. Stack tecnológica

| Camada          | Tecnologia                                   |
|-----------------|-----------------------------------------------|
| Marcação/Estilo | HTML5 + CSS3 (custom properties, sem framework CSS) |
| Aplicação       | JavaScript ES2023, ES Modules nativos (sem bundler, sem React/Angular/Vue) |
| Autenticação    | Firebase Authentication |
| Banco de dados  | Firebase Firestore |
| Arquivos        | Firebase Storage |
| Hospedagem      | Firebase Hosting |
| Leitura de PDF  | PDF.js (fase futura) |
| Geração de PDF  | jsPDF (fase futura) |
| Backend leve    | Cloud Functions (`functions/`, fase futura — e-mails, gatilhos, IA) |
| Versionamento   | GitHub |

**Por que sem bundler/framework?** O requisito é JavaScript puro e organizado. ES Modules
nativos do navegador (`<script type="module">`, `import`/`export`) já resolvem
modularização e carregamento sob demanda sem precisar de Webpack/Vite/Babel. Isso reduz
superfície de build, facilita auditoria de código (requisito institucional) e mantém o
deploy trivial via `firebase deploy`.

## 3. Estrutura de pastas

```
PAD2-main/
├── ARCHITECTURE.md          ← este arquivo
├── ROADMAP.md                ← fases do projeto
├── README.md                 ← como rodar o projeto localmente
├── index.html                ← ponto de entrada da SPA (carrega src/main.js)
├── firebase.json             ← configuração de Hosting/Firestore/Storage/Functions
├── firestore.rules           ← regras de segurança do Firestore
├── firestore.indexes.json    ← índices compostos do Firestore
├── storage.rules             ← regras de segurança do Storage
├── .firebaserc.example        ← modelo de configuração de projeto Firebase
├── package.json               ← scripts de desenvolvimento (emuladores, testes)
│
├── src/                       ← todo o código-fonte da aplicação
│   ├── main.js                 ← bootstrap único da SPA
│   ├── app/                    ← composição da aplicação (router + ciclo de vida)
│   ├── config/                 ← constantes, rotas, perfis/permissões, ambiente
│   ├── firebase/                ← inicialização crua dos SDKs (app/auth/db/storage)
│   ├── storage/                 ← regras de negócio de armazenamento de anexos
│   │                              (Storage = binário, Firestore = metadado)
│   ├── services/                ← camada de acesso a dados por domínio (pads, eventos, ...)
│   ├── templates/                ← (fase futura) motor de renderização PAD → documento
│   ├── parser/                   ← (fase futura) extração de dados de PDF (PDF.js)
│   ├── ai/                       ← (fase futura) módulo de IA, isolado da UI
│   ├── utils/                    ← funções utilitárias genéricas e puras
│   ├── styles/                   ← design tokens, tema claro/escuro, reset, utilitários CSS
│   ├── components/               ← componentes de UI reutilizáveis (JS + CSS colocalizados)
│   ├── layout/                   ← esqueletos de layout (AppShell autenticado, AuthLayout)
│   └── pages/                    ← uma pasta por módulo/tela do sistema
│
├── public/                    ← ativos estáticos servidos na raiz (favicon, manifest)
├── functions/                  ← Cloud Functions (fase futura: e-mail, IA, gatilhos)
├── tests/                      ← testes automatizados (Node test runner)
└── docs/                       ← documentação complementar (schema, permissões, design)
```

### Por que essa separação?

- **`firebase/` vs `services/` vs `storage/`**: `firebase/` é a camada mais baixa (somente
  inicializa os SDKs — não sabe nada sobre "PAD", "evento" ou "advogado"). `services/` é a
  camada de domínio (sabe o que é um PAD, um evento, um usuário) e consome `firebase/`.
  `storage/` fica isolado porque anexos têm uma regra arquitetural própria e recorrente em
  todo o sistema — **binário no Storage, metadado no Firestore** — então merece um módulo
  dedicado em vez de ficar diluído dentro de `services/anexos`.
- **`templates/`, `parser/` e `ai/` isolados**: por exigência do projeto, leitura de PDF e
  (quando existir) IA nunca devem se misturar com a interface. Essas pastas hoje contêm
  apenas interfaces documentadas (contratos de função) e lançam "não implementado" — a
  implementação real é fase futura. **Sem orçamento para IA paga**, a extração de campos do
  Registro de Infração é responsabilidade de `parser/` (regras/regex sobre o texto do PDF,
  sem custo) — `ai/` fica reservado só para o que realmente exigir geração de linguagem
  natural (Fase 8), condicionado a orçamento futuro. Ver [src/ai/README.md](src/ai/README.md)
  e [src/parser/README.md](src/parser/README.md).
- **`components/` vs `pages/` vs `layout/`**: `components/` são blocos de UI sem
  conhecimento de rota (botão, card, tabela, timeline, dropzone...). `layout/` é a casca
  estrutural (sidebar + topbar + área de conteúdo) que todo módulo autenticado compartilha.
  `pages/` é onde cada módulo de negócio (Dashboard, PAD, Eventos...) compõe componentes +
  services para montar uma tela.

## 4. Objeto de domínio central: PAD

Todo o sistema opera sobre um único agregado lógico:

```text
PAD
├── dadosGerais      { numero, unidade, dataAbertura, status, ... }
├── incidentados[]   { nomeCompleto, ipen }
├── infracao         { data, tipificacao, artigoLep: { codigo, rotulo }, detentosEnvolvidos[], agentesEnvolvidos[], observacoes }
├── eventos[]        (referência para a coleção `eventos`, ordenados)
├── documentos[]      (referência para a coleção `documentos`, gerados a partir dos dados)
├── anexos[]          (referência para a coleção `anexos` — metadado; binário no Storage)
├── defesa            { advogadoId, memoriais[], prazos }
├── conselho           { manifestacao, integrantes[], data }
├── decisao             { tipo, fundamentacao, data, responsavel }
├── historico[]         (trilha de auditoria de todas as mudanças de estado)
└── status               (enum do fluxo processual — ver seção 5)
```

Este objeto **nunca é montado a partir de documentos**. Documentos são sempre a saída
(renderização), nunca a entrada. O esquema completo das coleções do Firestore está
documentado em [docs/firestore-schema.md](docs/firestore-schema.md).

## 5. Fluxo processual (máquina de estados do PAD)

1. Registro de Infração
2. Portaria de Abertura
3. Termo de Cientificação
4. Oitiva do(s) Incidentado(s)
5. Manifestação do Conselho Disciplinar
6. Manifestação da Defesa
7. Decisão Final
8. Ofício ao Juízo
9. Arquivamento

Cada etapa é modelada como um **Evento** (coleção `eventos`, com `padId`, `tipo`,
`responsavel`, `data`, `status`, `documentos[]`, `anexos[]`, `historico[]`,
`observacoes`). O motor de fluxo (validação de transições, obrigatoriedade de campos por
etapa) é regra de negócio e será implementado na fase correspondente do
[ROADMAP.md](ROADMAP.md) — nesta primeira entrega existe apenas a modelagem e a tela.

## 6. Perfis e permissões

Perfis suportados (Firebase Authentication + campo `perfil` em `usuarios`):
Administrador, Diretor, Subdiretor, Servidor, Conselho Disciplinar, Advogado, Defensor
Público. A matriz de permissões por página/ação vive em `src/config/roles.js` e está
documentada em [docs/permissions-matrix.md](docs/permissions-matrix.md). O Portal do
Advogado é tratado como um contexto de autenticação separado do painel institucional
(fase futura), mas a estrutura de rotas já reserva o espaço (`src/pages/portal-advogado`).

## 7. Padrões de código

- **Módulos pequenos, responsabilidade única.** Nenhum arquivo deve concentrar mais de uma
  preocupação (ex.: uma page nunca fala diretamente com o Firestore — sempre passa por um
  `service`).
- **Sem estado global implícito.** Estado de UI vive no componente/página que o usa; estado
  de sessão (usuário autenticado) vive em `src/services/auth` e é consumido via funções
  explícitas, nunca variáveis globais mutáveis fora de um módulo dedicado.
- **CSS colocalizado por componente**, tokens de design centralizados em
  `src/styles/tokens.css` (cores, espaçamento, tipografia, dark mode via
  `prefers-color-scheme` + atributo `data-theme` para alternância manual).
- **Sem lógica de negócio nesta entrega.** Os `services` desta fase implementam apenas
  infraestrutura genérica (CRUD, contagem, upload) — nenhuma regra de fluxo do PAD,
  geração de documento, leitura de PDF ou IA foi implementada. Ver seção "Primeira
  entrega" do ROADMAP.

## 8. Segurança

- Toda leitura/escrita passa por `firestore.rules`/`storage.rules` com **negação por
  padrão** e liberação explícita por perfil autenticado.
- Nenhuma credencial de Firebase é commitada: `src/config/firebaseConfig.local.js` é
  ignorado pelo Git; `src/config/firebaseConfig.example.js` documenta o formato esperado.
- Toda ação sensível (acesso do advogado, exportação, decisão) deve gerar entrada na
  coleção `logs` (infraestrutura já preparada em `src/services/logs`).

## 9. Estado desta entrega (V1 estrutural)

Esta primeira entrega contém **apenas arquitetura, navegação, layout e integração inicial**
com o Firebase. Não há regras de negócio, parser de PDF, IA, geração de documentos, envio
de e-mail ou Portal do Advogado funcional. Ver o detalhamento fase a fase em
[ROADMAP.md](ROADMAP.md).
