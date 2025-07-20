import {
  getSnippets,
  addSnippet,
  incrementUsage,
  toggleStar,
  exportSnippets,
  importSnippets,
  saveSnippets
} from '../storage/snippetsStore.js';

import { createSnippetElement } from '../utils/domUtils.js';

const list = document.getElementById('list');
const modal = document.getElementById('snippetModal');
const modalTitle = document.getElementById('modalTitle');
const modalText = document.getElementById('modalText');
const modalFolder = document.getElementById('modalFolder');
const saveSnippet = document.getElementById('saveSnippet');
const cancelSnippet = document.getElementById('cancelSnippet');
const tooltip = document.getElementById('tooltip');
const settingsModal = document.getElementById('settingsModal');
const importFile = document.getElementById('importFile');
const settingsCloseBtn = document.getElementById('settingsCloseBtn');

let editIndex = null;
let mode = 'snippet'; // 'snippet' o 'folder'

// Render snippets on load
renderSnippets();

async function renderSnippets() {
  const snippets = await getSnippets();
  list.innerHTML = '';

  const folders = {};

  snippets.forEach((s) => {
    if (s.text === '') {
      const folderName = s.title.replace('Folder:', '').trim();
      folders[folderName] = [];
    }
  });

  snippets.forEach((s, i) => {
    if (s.text === '') return;
    const folderName = s.folder || 'Ungrouped';
    if (!folders[folderName]) folders[folderName] = [];
    folders[folderName].push({ snippet: s, index: i });
  });

  Object.keys(folders).forEach(folder => {
    const header = document.createElement('div');
    header.className = 'snippet-folder';
    header.textContent = `[ ${folder} ]`;
    list.appendChild(header);

    folders[folder].forEach(({ snippet: s, index: i }) => {
      const el = createSnippetElement(s, async () => {
        await navigator.clipboard.writeText(s.text);
        await incrementUsage(i);
        renderSnippets();
      }, async () => {
        await toggleStar(i);
        renderSnippets();
      });

      el.addEventListener('mouseover', (e) => {
        tooltip.textContent = s.text;
        tooltip.style.display = 'block';
        tooltip.style.left = e.pageX + 'px';
        tooltip.style.top = e.pageY + 'px';
      });

      el.addEventListener('mouseout', () => {
        tooltip.style.display = 'none';
      });

      el.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        if (s.text === '') return;
        editIndex = i;
        mode = 'snippet';
        modalTitle.value = s.title;
        modalText.value = s.text;
        modalFolder.value = s.folder || folder;
        toggleModalFields();
        modal.showModal();
      });

      list.appendChild(el);
    });
  });
}

function toggleModalFields() {
  if (mode === 'folder') {
    modalText.parentElement.style.display = 'none';
    modalFolder.parentElement.style.display = 'none';
  } else {
    modalText.parentElement.style.display = '';
    modalFolder.parentElement.style.display = '';
  }
}

// Botón "+" para agregar snippet
document.getElementById('addBtn').onclick = () => {
  editIndex = null;
  mode = 'snippet';
  modalTitle.value = '';
  modalText.value = '';
  modalFolder.value = '';
  toggleModalFields();
  modal.showModal();
};

// Botón para agregar grupo
document.getElementById('addGroupBtn').onclick = () => {
  editIndex = null;
  mode = 'folder';
  modalTitle.value = '';
  modalText.value = '';
  modalFolder.value = '';
  toggleModalFields();
  modal.showModal();
};

// Guardar nuevo snippet o carpeta
saveSnippet.onclick = async (e) => {
  e.preventDefault();
  const isFolder = mode === 'folder';
  const newSnippet = {
    title: isFolder ? `Folder: ${modalTitle.value.trim()}` : modalTitle.value.trim(),
    text: isFolder ? '' : modalText.value.trim(),
    folder: isFolder ? '' : modalFolder.value.trim(),
    star: false,
    usage: 0
  };

  const snippets = await getSnippets();

  if (editIndex !== null) {
    snippets[editIndex] = { ...snippets[editIndex], ...newSnippet };
  } else {
    snippets.push(newSnippet);
  }

  await saveSnippets(snippets);
  modal.close();
  renderSnippets();
};

// Cancelar modal
cancelSnippet.onclick = () => {
  modal.close();
};

// Mostrar ajustes
document.getElementById('settingsBtn').onclick = () => {
  settingsModal.showModal();
};

// Cerrar ajustes
settingsCloseBtn.onclick = () => {
  settingsModal.close();
};

// Exportar snippets
document.getElementById('exportBtn').onclick = async () => {
  await exportSnippets();
};

// Importar snippets
document.getElementById('importBtn').onclick = () => {
  importFile.click();
};

importFile.onchange = async (e) => {
  const file = e.target.files[0];
  if (file) {
    const text = await file.text();
    await importSnippets(JSON.parse(text));
    renderSnippets();
  }
};

// Convertir input "folder" en dropdown si aplica
document.addEventListener('DOMContentLoaded', async () => {
  const folderField = document.getElementById('folder');
  if (folderField && folderField.tagName === 'INPUT') {
    const allSnippets = await getSnippets();
    const folders = [...new Set(allSnippets.map(s => s.folder).filter(Boolean))];

    const dropdown = document.createElement('select');
    dropdown.id = 'folder';
    dropdown.className = 'form-control';

    const noneOption = document.createElement('option');
    noneOption.value = '';
    noneOption.textContent = '-- No Folder --';
    dropdown.appendChild(noneOption);

    folders.forEach(f => {
      const opt = document.createElement('option');
      opt.value = f;
      opt.textContent = f;
      dropdown.appendChild(opt);
    });

    folderField.replaceWith(dropdown);
  }
});

document.addEventListener('DOMContentLoaded', () => {
  const settingsModal = document.getElementById('settingsModal');
  const settingsBtn = document.getElementById('settingsBtn');
  const settingsCloseBtn = document.getElementById('settingsCloseBtn');
  const exportBtn = document.getElementById('exportBtn');
  const importBtn = document.getElementById('importBtn');
  const importFile = document.getElementById('importFile');

  if (settingsBtn && settingsModal) {
    settingsBtn.addEventListener('click', () => {
      settingsModal.showModal();
    });
  }

  if (settingsCloseBtn && settingsModal) {
    settingsCloseBtn.addEventListener('click', () => {
      settingsModal.close();
    });
  }

  if (exportBtn) {
    exportBtn.addEventListener('click', async () => {
      await exportSnippets();
    });
  }

  if (importBtn && importFile) {
    importBtn.addEventListener('click', () => {
      importFile.click();
    });

    importFile.addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (file) {
        const text = await file.text();
        await importSnippets(JSON.parse(text));
        renderSnippets();
      }
    });
  }
});
