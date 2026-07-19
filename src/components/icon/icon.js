/**
 * Conjunto mínimo de ícones em SVG inline (sem dependência de biblioteca ou
 * CDN de ícones). Estilo consistente: grade 24x24, traço de 2px, cantos
 * arredondados. Adicionar um novo ícone é só adicionar uma entrada aqui.
 */

const ICONES = {
  'layout-dashboard': '<rect x="3" y="3" width="7" height="9" rx="1.5"/><rect x="14" y="3" width="7" height="5" rx="1.5"/><rect x="14" y="12" width="7" height="9" rx="1.5"/><rect x="3" y="16" width="7" height="5" rx="1.5"/>',
  'folder-search': '<path d="M3 6a1.5 1.5 0 0 1 1.5-1.5H9l2 2h8.5A1.5 1.5 0 0 1 21 8v10a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 18V6Z"/><circle cx="12.5" cy="13" r="2.3"/><line x1="14.3" y1="14.8" x2="16" y2="16.5"/>',
  'file-plus': '<path d="M6 3.5h8L19 8v12a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1v-16A1 1 0 0 1 6 3.5Z"/><line x1="10" y1="13" x2="16" y2="13"/><line x1="13" y1="10" x2="13" y2="16"/>',
  'file-text': '<path d="M6 3.5h8L19 8v12a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1v-16A1 1 0 0 1 6 3.5Z"/><line x1="9" y1="12" x2="15" y2="12"/><line x1="9" y1="15.5" x2="15" y2="15.5"/>',
  'file-stack': '<rect x="5" y="7" width="12" height="14" rx="1"/><path d="M8 4h9a1 1 0 0 1 1 1v11" />',
  'list-checks': '<path d="M4 6.5 5.5 8 8 5.5"/><line x1="11" y1="6.5" x2="20" y2="6.5"/><path d="M4 12.5 5.5 14 8 11.5"/><line x1="11" y1="12.5" x2="20" y2="12.5"/><path d="M4 18.5 5.5 20 8 17.5"/><line x1="11" y1="18.5" x2="20" y2="18.5"/>',
  paperclip: '<path d="M9 12.5 15 6.6a2.6 2.6 0 0 1 3.7 3.7L11 18a4.2 4.2 0 0 1-6-6l7.3-7.3"/>',
  scale: '<line x1="12" y1="3" x2="12" y2="20"/><line x1="5" y1="7" x2="19" y2="7"/><path d="M5 7 2.5 13a2.7 2.7 0 0 0 5 0Z"/><path d="M19 7l-2.5 6a2.7 2.7 0 0 0 5 0Z"/><line x1="8" y1="21" x2="16" y2="21"/>',
  users: '<circle cx="9" cy="8" r="3.2"/><path d="M3 20a6 6 0 0 1 12 0"/><path d="M16 5.5a3.2 3.2 0 0 1 0 6.2"/><path d="M15 14a6 6 0 0 1 6 6"/>',
  'bar-chart-3': '<line x1="5" y1="20" x2="5" y2="13"/><line x1="12" y1="20" x2="12" y2="7"/><line x1="19" y1="20" x2="19" y2="10"/>',
  download: '<path d="M12 4v11"/><path d="M7.5 11 12 15.5 16.5 11"/><line x1="4.5" y1="19.5" x2="19.5" y2="19.5"/>',
  sparkles: '<path d="M11 3.5 12.4 8 17 9.4 12.4 10.8 11 15.3 9.6 10.8 5 9.4 9.6 8Z"/><path d="M18 15.5 18.7 17.7 21 18.5 18.7 19.3 18 21.5 17.3 19.3 15 18.5 17.3 17.7Z"/>',
  settings: '<circle cx="12" cy="12" r="3"/><path d="M12 3v2.2M12 18.8V21M4.9 4.9l1.6 1.6M17.5 17.5l1.6 1.6M3 12h2.2M18.8 12H21M4.9 19.1l1.6-1.6M17.5 6.5l1.6-1.6"/>',
  menu: '<line x1="4" y1="6.5" x2="20" y2="6.5"/><line x1="4" y1="12" x2="20" y2="12"/><line x1="4" y1="17.5" x2="20" y2="17.5"/>',
  'chevron-left': '<path d="M14.5 5 8 12l6.5 7"/>',
  'chevron-right': '<path d="M9.5 5 16 12l-6.5 7"/>',
  x: '<line x1="6" y1="6" x2="18" y2="18"/><line x1="18" y1="6" x2="6" y2="18"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2.5v2.4M12 19v2.4M4.4 4.4l1.7 1.7M17.8 17.8l1.7 1.7M2.5 12h2.4M19 12h2.4M4.4 19.6l1.7-1.7M17.8 6.2l1.7-1.7"/>',
  moon: '<path d="M20 14.5A8.5 8.5 0 1 1 9.5 4a7 7 0 0 0 10.5 10.5Z"/>',
  upload: '<path d="M12 15V4"/><path d="M7.5 8 12 3.5 16.5 8"/><line x1="4.5" y1="17" x2="4.5" y2="19.5"/><line x1="19.5" y1="17" x2="19.5" y2="19.5"/><line x1="4.5" y1="19.5" x2="19.5" y2="19.5"/>',
  check: '<path d="M4.5 12.5 9.5 17.5 19.5 6.5"/>',
  'alert-triangle': '<path d="M12 4 21.5 20h-19Z"/><line x1="12" y1="10" x2="12" y2="14.5"/><circle cx="12" cy="17.3" r="0.6" fill="currentColor" stroke="none"/>',
  search: '<circle cx="11" cy="11" r="6.5"/><line x1="15.8" y1="15.8" x2="20.5" y2="20.5"/>',
  'log-out': '<path d="M9 4H6a1.5 1.5 0 0 0-1.5 1.5v13A1.5 1.5 0 0 0 6 20h3"/><line x1="20" y1="12" x2="10.5" y2="12"/><path d="M16 8l4 4-4 4"/>',
  bell: '<path d="M6 10a6 6 0 1 1 12 0c0 4 1.5 5.5 1.5 5.5h-15S6 14 6 10Z"/><path d="M10 19a2 2 0 0 0 4 0"/>',
  building: '<rect x="4" y="3" width="16" height="18" rx="1"/><line x1="8" y1="7" x2="8" y2="7.01"/><line x1="12" y1="7" x2="12" y2="7.01"/><line x1="16" y1="7" x2="16" y2="7.01"/><line x1="8" y1="11" x2="8" y2="11.01"/><line x1="12" y1="11" x2="12" y2="11.01"/><line x1="16" y1="11" x2="16" y2="11.01"/><path d="M9 21v-4h6v4"/>',
  copy: '<rect x="9" y="9" width="11" height="11" rx="1.5"/><path d="M5.5 15H4.5A1.5 1.5 0 0 1 3 13.5v-9A1.5 1.5 0 0 1 4.5 3h9A1.5 1.5 0 0 1 15 4.5v1"/>',
  mic: '<rect x="9" y="2.5" width="6" height="11" rx="3"/><path d="M5.5 11a6.5 6.5 0 0 0 13 0"/><line x1="12" y1="17.5" x2="12" y2="21.5"/><line x1="8" y1="21.5" x2="16" y2="21.5"/>',
  lock: '<rect x="5" y="11" width="14" height="9" rx="1.5"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>',
  'lock-open': '<rect x="5" y="11" width="14" height="9" rx="1.5"/><path d="M8 11V7a4 4 0 0 1 7.5-2"/>',
  mail: '<rect x="3" y="5" width="18" height="14" rx="1.5"/><path d="M4 6.5 12 13 20 6.5"/>',
  eye: '<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/>',
};

/**
 * @param {keyof typeof ICONES} nome
 * @param {{ size?: number, class?: string }} [opcoes]
 * @returns {string} markup SVG pronto para innerHTML
 */
export function icone(nome, opcoes = {}) {
  const conteudo = ICONES[nome];
  if (!conteudo) return '';
  const tamanho = opcoes.size ?? 20;
  const classe = opcoes.class ? ` class="${opcoes.class}"` : '';
  return `<svg${classe} width="${tamanho}" height="${tamanho}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${conteudo}</svg>`;
}
