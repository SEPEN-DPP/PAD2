/**
 * Instância de Firebase Authentication + conexão opcional ao emulador.
 * Regras de negócio de autenticação (login, logout, sessão) vivem em
 * src/services/auth/authService.js — este arquivo só expõe a instância.
 */
import {
  getAuth,
  connectAuthEmulator,
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';
import { firebaseApp } from './app.js';
import { useEmulators } from '../config/firebaseConfig.local.js';

export const auth = getAuth(firebaseApp);

if (useEmulators && !auth._pad2EmulatorConnected) {
  connectAuthEmulator(auth, 'http://localhost:9099', { disableWarnings: true });
  auth._pad2EmulatorConnected = true;
}
