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
