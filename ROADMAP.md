# Roadmap — PAD V2

Este roadmap divide o desenvolvimento em fases incrementais. Cada fase só começa após a
fase anterior estar validada. As decisões de arquitetura que sustentam este roadmap estão
em [ARCHITECTURE.md](ARCHITECTURE.md).

## Fase 0 — Base estrutural (esta entrega)

Escopo: arquitetura, organização de pastas, layout, navegação, componentes, páginas,
integração inicial com Firebase (config + auth gating), tema visual (claro/escuro),
estrutura do Firestore (coleções e schema documentado), estrutura de services, e placeholders
documentados para os módulos futuros (`templates`, `parser`, `ai`).

Sem regra de negócio. Sem parser de PDF. Sem IA. Sem geração de PDF. Sem envio de e-mail.
Sem Portal do Advogado funcional.

**Critério de conclusão:** navegação completa entre todos os módulos, login funcional
contra Firebase Auth, dashboard lendo contagens reais (ainda que zeradas) do Firestore,
tela "Novo PAD" com upload de PDF apenas como interface.

## Fase 1 — Autenticação e controle de acesso

- Login/logout completo, recuperação de senha. ✅
- Alterar senha (Configurações), universal para todo o painel. ✅
- Perfis (Administrador, Diretor, Subdiretor, Servidor, Conselho Disciplinar, Servidor)
  aplicados via `src/config/roles.js` + `firestore.rules`.
- `vinculo` (unidade/regional) para recorte de dados no Dashboard/PAD — ver
  `src/services/pads/escopoPad.js`. ✅ (2026-07-14)
- Autocadastro público (`#/cadastro`) com aprovação por Direção/CPEN da unidade
  solicitada (ou Administrador), perfil Servidor concedido na aprovação — ver
  `src/pages/auth/registro`, `src/pages/usuarios/usuariosPage.js`. ✅ (2026-07-14)
- Tela de Usuários: aprovação/recusa de solicitações, edição (nome/perfil) e exclusão de
  contas ativas ✅ — escopo de gestão estendido a contas de Superintendência Regional
  (`vinculo.tipo: 'REGIONAL'`, campo `superintendencia` denormalizado em `usuarios`),
  restrito a alvos `perfil: SERVIDOR`; ver `docs/firestore-schema.md` e
  `docs/permissions-matrix.md`. ✅ (2026-07-14)
- Registro de auditoria (`logs`) para login, logout e acessos negados.

## Fase 2 — Núcleo do PAD (CRUD + fluxo processual)

- "Criar PAD" (após revisão dos dados extraídos na Fase 3): número digitado pelo próprio
  usuário (sem numeração automática), unidade fixa para vínculo UNIDADE ou selecionável
  (filtrada pela regional/Estado) para vínculo REGIONAL/Administrador, status inicial
  sempre `EM_ANDAMENTO`, e criação automática do primeiro evento da linha do tempo
  ("Registro de Infração", já `CONCLUIDO`) — ver `src/pages/pad/new/padNewPage.js`,
  `src/services/pads/padService.js`, `src/services/eventos/eventoService.js` e as regras
  `souCriadorDoPad` em `firestore.rules`. ✅ (2026-07-14)
- Modelagem completa do objeto PAD no Firestore (`pads`, `eventos`).
- Máquina de estados do fluxo processual (Registro → Portaria → Cientificação → Oitiva →
  Conselho → Defesa → Decisão → Ofício → Arquivamento), com validação de transição e
  campos obrigatórios por etapa — só a etapa inicial (criação) está implementada; as
  transições entre as demais etapas ainda não existem.
- Tela de PAD (listagem, criação manual de evento, detalhe com abas por seção do objeto).
- Timeline de eventos e histórico de auditoria por PAD.

## Fase 3 — Parser do Registro de Infração (PDF.js, extração baseada em regras)

**Sem orçamento para IA paga** — toda a extração desta fase é determinística (regex sobre
o texto extraído do PDF pelo PDF.js, em `src/parser`), sem depender de nenhuma API de IA
com custo. `src/ai` não participa desta fase (ver [src/ai/README.md](src/ai/README.md)).

- Implementação real de `src/parser/pdfParserService.js` (extração de texto via PDF.js). ✅
- Implementação real de `src/parser/registroInfracaoParser.js`, limitada aos campos:
  **nome completo, IPEN, data da infração (dd/mm/aaaa), infração, artigo da LEP
  correspondente à falta (art. 50 incisos ou art. 52 caput — identificado a partir do texto
  da infração, ver `src/config/baseLegal.js`), detentos envolvidos, agentes (Policiais
  Penais) envolvidos, observações.** ✅
- Tela "Novo PAD" passa a enviar o PDF para análise e pré-preencher o objeto PAD para
  validação humana antes da gravação. ✅ (revisão humana; gravação em si é Fase 2)

## Fase 4 — Documentos e geração de PDF

- `src/templates` ganha os modelos reais (Portaria, Termo de Cientificação, Ofício etc.),
  sempre renderizados a partir do objeto PAD (nunca editados como texto solto).
- Geração de PDF via jsPDF a partir dos templates.
- Versionamento de documentos gerados (coleção `documentos`) e vínculo com o evento que os
  originou.

## Fase 5 — Anexos

**Bloqueada por custo (2026-07-14):** o Firebase Storage passou a exigir o plano Blaze
(pago) até para o uso dentro da cota gratuita, e o usuário não pode assinar nada que gere
custo. Esta fase fica pausada até haver orçamento aprovado para o Blaze **ou** uma
alternativa de armazenamento de arquivos sem custo for definida. Até lá, Autenticação,
Firestore e Hosting seguem funcionando normalmente no plano Spark (gratuito) — só o upload
de anexos fica indisponível.

- Upload real para Firebase Storage com convenção de caminho por PAD/evento.
- Metadados em `anexos` (tipo, autor, data, tamanho, vínculo com evento).
- Visualização de fotos/vídeos/laudos e download controlado por permissão.

## Fase 6 — Portal do Advogado

- Cadastro de advogado após a Cientificação, com envio de e-mail (Cloud Functions) contendo
  link de primeiro acesso.
- Definição de senha no primeiro acesso, autenticação isolada do painel institucional.
- Acompanhamento de andamento, visualização de documentos autorizados, envio de memoriais e
  documentos, consulta de histórico e decisões.
- Log de acesso obrigatório para toda ação do advogado.

## Fase 7 — Relatórios e Exportação

- Relatórios gerenciais (por unidade, por período, por status, por classificação de
  infração).
- Exportação (PDF/planilha) dos relatórios e de PADs individuais.

## Fase 8 — Validação processual e apoio à decisão

Sem orçamento para IA paga: o que pode ser regra determinística fica em regra
determinística (sem custo); só o que exige geração de texto livre depende de IA e fica
condicionado à disponibilidade futura de orçamento/ferramenta gratuita viável.

- Identificação de inconsistências no processo (prazos vencidos, documentos obrigatórios
  ausentes, campos pendentes) — **regra determinística**, sem dependência de IA.
- Validação assistida de completude documental antes do envio ao Conselho/Defesa — **regra
  determinística**, sem dependência de IA.
- Sugestão de fundamentação e revisão textual de peças — **depende de IA generativa**;
  avaliar viabilidade (custo/hospedagem) quando houver orçamento; até lá, fica fora de
  escopo.

## Fase 9 — Hardening institucional

- Revisão completa de `firestore.rules`/`storage.rules` para produção.
- Auditoria de segurança, testes de carga, política de backup/retenção.
- Documentação de operação para as Unidades Prisionais (manual do usuário por perfil).

---

**Nota de processo:** ao final de cada fase, atualizar este arquivo (marcando a fase como
concluída) e registrar decisões relevantes em [ARCHITECTURE.md](ARCHITECTURE.md) antes de
iniciar a fase seguinte.
