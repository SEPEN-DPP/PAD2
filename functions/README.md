# functions/

Cloud Functions do PAD V2. Nenhuma função está ativa nesta fase — o diretório existe apenas
como esqueleto para as responsabilidades futuras (ver [ROADMAP.md](../ROADMAP.md)):

- **Fase 6**: envio de e-mail com link de primeiro acesso ao Portal do Advogado.
- Gatilhos de auditoria (ex.: gravar em `logs` em resposta a eventos do Firestore).
- Processamento assíncrono de IA (Fases 3/8), quando a análise não puder rodar no cliente.

## Convenção

Cada responsabilidade vive em seu próprio arquivo dentro de `src/`, exportado a partir de
`index.js`. Nenhuma função de negócio real está implementada nesta entrega.
