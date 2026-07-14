/**
 * Inicialização do Firebase App. Esta é a única camada que conhece o SDK
 * "cru" do Firebase — nenhum outro módulo deve importar diretamente de
 * `firebase/*`. Consumidores usam auth.js, firestore.js e storage.js.
 *
 * Usamos os módulos ESM servidos pelo CDN do Google (gstatic) para manter o
 * projeto livre de bundler, conforme decisão registrada em ARCHITECTURE.md.
 */
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js';
import { firebaseConfig } from '../config/firebaseConfig.local.js';

export const firebaseApp = initializeApp(firebaseConfig);
