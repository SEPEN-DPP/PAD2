/**
 * Instância do Firebase Storage + conexão opcional ao emulador. Regras de
 * caminho/convenção de anexos vivem em src/storage/attachmentStorage.js —
 * este arquivo só expõe a instância crua.
 */
import {
  getStorage,
  connectStorageEmulator,
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-storage.js';
import { firebaseApp } from './app.js';
import { useEmulators } from '../config/firebaseConfig.local.js';

export const storage = getStorage(firebaseApp);

if (useEmulators && !storage._pad2EmulatorConnected) {
  connectStorageEmulator(storage, 'localhost', 9199);
  storage._pad2EmulatorConnected = true;
}
