export function createSnippetElement(snippet, onClick, onStar) {
  const div = document.createElement('div');
  div.className = 'snippet';

  const title = document.createElement('span');
  title.className = 'snippet-title';
  title.textContent = snippet.title;
  div.appendChild(title);

  // Si es un folder, no mostrar icono ni estadísticas
  if (snippet.text.trim() !== '') {
    const meta = document.createElement('span');
    meta.className = 'snippet-meta';
    meta.textContent = snippet.star ? '★' : '';
    meta.onclick = e => {
      e.stopPropagation();
      onStar();
    };
    div.appendChild(meta);
  }

  div.onclick = () => onClick();

  return div;
}
