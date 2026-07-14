/**
 * Instância do Firestore + conexão opcional ao emulador. Nenhuma consulta de
 * domínio deve viver aqui — apenas a instância crua `db`, consumida por
 * src/services/*.
 */
import {
  getFirestore,
  connectFirestoreEmulator,
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';
import { firebaseApp } from './app.js';
import { useEmulators } from '../config/firebaseConfig.local.js';

export const db = getFirestore(firebaseApp);

if (useEmulators && !db._pad2EmulatorConnected) {
  connectFirestoreEmulator(db, 'localhost', 8080);
  db._pad2EmulatorConnected = true;
}
