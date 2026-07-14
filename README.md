# PAD V2 — Polícia Penal de Santa Catarina

Sistema Eletrônico de Processo Administrativo Disciplinar. Veja
[ARCHITECTURE.md](ARCHITECTURE.md) para as decisões técnicas e [ROADMAP.md](ROADMAP.md)
para o plano de fases.

## Como rodar localmente

1. Instale as dependências de desenvolvimento (Firebase CLI):
   ```
   npm install
   ```
2. Copie `.firebaserc.example` para `.firebaserc` e ajuste os IDs de projeto Firebase.
3. Copie `src/config/firebaseConfig.example.js` para
   `src/config/firebaseConfig.local.js` e preencha com as credenciais do seu projeto
   Firebase (Console → Configurações do projeto → SDK do Firebase).
4. Suba os emuladores (Auth, Firestore, Storage, Hosting):
   ```
   npm run dev
   ```
5. Acesse `http://localhost:5000`.

Nenhum passo de build é necessário — o projeto usa ES Modules nativos do navegador.

## Deploy

O projeto está publicado em **https://pad-sepen.web.app** (site de Hosting `pad-sepen`
dentro do projeto Firebase `pad-v2-89b30`, conta institucional SEPEN — o nome do projeto em
si não pode ser alterado, mas o Hosting suporta múltiplos "sites" com nome próprio; é para
esse que o deploy aponta via `target: "principal"` no `firebase.json` e `.firebaserc`).

`.firebaserc` é local (gitignored) — em uma máquina nova, depois do passo 2 acima, rode
também:
```
firebase target:apply hosting principal pad-sepen
```
para recriar o vínculo do target `principal` com o site `pad-sepen` antes do primeiro
deploy.

**Storage está bloqueado por custo** (o Firebase exige o plano Blaze até para a cota
gratuita — ver ROADMAP.md, Fase 5). Por isso, use sempre:
```
firebase deploy --only firestore,hosting
```
Rodar `firebase deploy` sem `--only` tenta incluir o Storage e falha.
