/**
 * Barril de exportação da camada Firebase crua. Preferir importar deste
 * arquivo em vez de apontar diretamente para app.js/auth.js/etc., para que a
 * troca de estratégia de inicialização (ex.: lazy init) fique centralizada.
 */
export { firebaseApp } from './app.js';
export { auth } from './auth.js';
export { db } from './firestore.js';
export { storage } from './storage.js';
