/**
 * Ponto de entrada único da SPA, carregado por index.html como
 * `<script type="module">`. Toda a lógica de bootstrap vive em src/app/app.js
 * — este arquivo apenas dispara a inicialização.
 */
import { iniciarApp } from './app/app.js';

iniciarApp('app');
