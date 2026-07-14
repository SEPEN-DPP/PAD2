/**
 * Área de arrastar/soltar (ou selecionar) um arquivo PDF. Componente
 * puramente de interface — não faz upload nem leitura do arquivo. Usado
 * pela tela "Novo PAD" (ver ARCHITECTURE.md, seção "Novo PAD").
 */
import { criarElemento, carregarCssUmaVez } from '../../utils/domUtils.js';
import { icone } from '../icon/icon.js';
import { ehPdf } from '../../utils/validationUtils.js';
import { mostrarToast } from '../../utils/toast.js';

/**
 * @param {{ onArquivoSelecionado: (arquivo: File) => void }} params
 */
export function criarDropzone({ onArquivoSelecionado }) {
  carregarCssUmaVez('src/components/dropzone/dropzone.css');

  const input = criarElemento('input', {
    type: 'file',
    accept: 'application/pdf',
    class: 'sr-only',
    onChange: (evento) => tratarArquivos(evento.target.files),
  });

  const legendaArquivo = criarElemento('span', { class: 'dropzone__arquivo text-muted' }, [
    'Nenhum arquivo selecionado',
  ]);

  const area = criarElemento(
    'div',
    { class: 'dropzone', role: 'button', tabindex: '0' },
    [
      criarElemento('div', { class: 'dropzone__icone' }, [icone('upload', { size: 26 })]),
      criarElemento('p', { class: 'dropzone__titulo' }, ['Arraste o PDF do Registro de Infração aqui']),
      criarElemento('p', { class: 'dropzone__subtitulo text-muted' }, ['ou clique para selecionar um arquivo']),
      legendaArquivo,
      input,
    ],
  );

  function tratarArquivos(arquivos) {
    const arquivo = arquivos?.[0];
    if (!arquivo) return;
    if (!ehPdf(arquivo)) {
      mostrarToast('Selecione um arquivo em formato PDF.', 'erro');
      return;
    }
    legendaArquivo.textContent = arquivo.name;
    legendaArquivo.classList.add('dropzone__arquivo--selecionado');
    onArquivoSelecionado(arquivo);
  }

  area.addEventListener('click', () => input.click());
  area.addEventListener('keydown', (evento) => {
    if (evento.key === 'Enter' || evento.key === ' ') input.click();
  });
  area.addEventListener('dragover', (evento) => {
    evento.preventDefault();
    area.classList.add('dropzone--arrastando');
  });
  area.addEventListener('dragleave', () => area.classList.remove('dropzone--arrastando'));
  area.addEventListener('drop', (evento) => {
    evento.preventDefault();
    area.classList.remove('dropzone--arrastando');
    tratarArquivos(evento.dataTransfer.files);
  });

  return area;
}
