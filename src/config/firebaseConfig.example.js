/**
 * Modelo de configuração do Firebase. Copie este arquivo para
 * `firebaseConfig.local.js` (ignorado pelo Git) e preencha com os valores do
 * seu projeto (Console Firebase → Configurações do projeto → SDK do
 * Firebase → Configuração).
 *
 * `firebaseConfig.local.js` é importado dinamicamente por src/firebase/app.js
 * e nunca deve ser commitado.
 */

export const firebaseConfig = {
  apiKey: 'SUBSTITUA_AQUI',
  authDomain: 'SUBSTITUA_AQUI.firebaseapp.com',
  projectId: 'SUBSTITUA_AQUI',
  storageBucket: 'SUBSTITUA_AQUI.appspot.com',
  messagingSenderId: 'SUBSTITUA_AQUI',
  appId: 'SUBSTITUA_AQUI',
};

/** Quando true, o app se conecta aos emuladores locais (ver npm run dev). */
export const useEmulators = true;
