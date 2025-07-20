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
let modalFolder = document.getElementById('modalFolder');
const saveSnippet = document.getElementById('saveSnippet');
const cancelSnippet = document.getElementById('cancelSnippet');
const tooltip = document.getElementById('tooltip');
const settingsModal = document.getElementById('settingsModal');
const importFile = document.getElementById('importFile');

let editIndex = null;
let mode = 'snippet'; // 'snippet' o 'folder'

function showToast(msg = "Copied!") {
  const toast = document.getElementById('toast');
  toast.textContent = msg;
  toast.classList.add('visible');
  setTimeout(() => toast.classList.remove('visible'), 1400);
}

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
    // FOLDERS COLAPSABLES
    const wrapper = document.createElement('div');
    wrapper.className = 'snippet-folder-wrap';

    const header = document.createElement('div');
    header.className = 'snippet-folder';
    header.innerHTML = `<span class="arrow">▼</span> [ ${folder} ]`;
    wrapper.appendChild(header);

    const childrenList = document.createElement('div');
    childrenList.className = 'folder-children';

    folders[folder].forEach(({ snippet: s, index: i }) => {
      const el = createSnippetElement(s, async () => {
        await navigator.clipboard.writeText(s.text);
        showToast();
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
        showFolderDropdown(s.folder);
        showFieldsForMode();
        modal.showModal();
      });

      childrenList.appendChild(el);
    });

    wrapper.appendChild(childrenList);
    list.appendChild(wrapper);

    // Colapsar/expandir folder
    let collapsed = false;
    header.addEventListener('click', () => {
      collapsed = !collapsed;
      childrenList.style.display = collapsed ? 'none' : '';
      header.querySelector('.arrow').textContent = collapsed ? '►' : '▼';
    });
  });
}

// Convierte el input de folder en un dropdown dinámico
async function showFolderDropdown(selectedFolder = '') {
  let folderField = document.getElementById('modalFolder');
  if (folderField.tagName !== 'SELECT') {
    const select = document.createElement('select');
    select.id = 'modalFolder';
    select.className = 'form-control';

    const snippets = await getSnippets();
    const folderSet = new Set(
      snippets
        .filter(s => (s.folder && s.folder.trim()) || s.text === '')
        .map(s => s.text === '' ? s.title.replace('Folder:', '').trim() : s.folder.trim())
    );

    const noneOption = document.createElement('option');
    noneOption.value = '';
    noneOption.textContent = '';
    select.appendChild(noneOption);

    folderSet.forEach(folder => {
      const opt = document.createElement('option');
      opt.value = folder;
      opt.textContent = folder;
      select.appendChild(opt);
    });

    folderField.replaceWith(select);
    modalFolder = select;
  }

  if (selectedFolder && modalFolder) {
    modalFolder.value = selectedFolder;
  } else if (modalFolder) {
    modalFolder.value = '';
  }
}

// Muestra solo los campos relevantes en el modal según el modo
function showFieldsForMode() {
  // Muestra siempre Title y botones
  // Solo oculta los labels+campos de Content y Folder
  document.querySelector('label[for="modalText"]')?.style.setProperty('display', mode === 'folder' ? 'none' : '');
  document.getElementById('modalText').style.display = (mode === 'folder' ? 'none' : '');

  if (modalFolder) {
    document.querySelector('label[for="modalFolder"]')?.style.setProperty('display', mode === 'folder' ? 'none' : '');
    modalFolder.style.display = (mode === 'folder' ? 'none' : '');
  }
}

// --- INICIALIZACIÓN ---

document.addEventListener('DOMContentLoaded', () => {
  renderSnippets();

  document.getElementById('addBtn').onclick = async () => {
    editIndex = null;
    mode = 'snippet';
    modalTitle.value = '';
    modalText.value = '';
    await showFolderDropdown('');
    showFieldsForMode();
    modal.showModal();
  };

  document.getElementById('addGroupBtn').onclick = () => {
    editIndex = null;
    mode = 'folder';
    modalTitle.value = '';
    modalText.value = '';
    if (modalFolder) modalFolder.value = '';
    showFieldsForMode();
    modal.showModal();
  };

  saveSnippet.onclick = async (e) => {
    e.preventDefault();
    const isFolder = mode === 'folder';
    const folderVal = isFolder ? '' : (modalFolder && modalFolder.value) ? modalFolder.value.trim() : '';
    const newSnippet = {
      title: isFolder ? `Folder: ${modalTitle.value.trim()}` : modalTitle.value.trim(),
      text: isFolder ? '' : modalText.value.trim(),
      folder: folderVal,
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

  cancelSnippet.onclick = () => modal.close();

  // --- Ajustes (import/export/close) ---
  const settingsBtn = document.getElementById('settingsBtn');
  if (settingsBtn && settingsModal) {
    settingsBtn.addEventListener('click', () => settingsModal.showModal());
  }

  if (settingsModal) {
    const settingsCloseBtn = document.getElementById('settingsCloseBtn');
    if (settingsCloseBtn) {
      settingsCloseBtn.onclick = () => settingsModal.close();
    }
    const exportBtn = document.getElementById('exportBtn');
    if (exportBtn) exportBtn.onclick = async () => await exportSnippets();
    const importBtn = document.getElementById('importBtn');
    if (importBtn && importFile) {
      importBtn.onclick = () => importFile.click();
      importFile.onchange = async (e) => {
        const file = e.target.files[0];
        if (file) {
          const text = await file.text();
          await importSnippets(JSON.parse(text));
          renderSnippets();
        }
      };
    }
  }

  const themeSelect = document.getElementById('themeSelect');
  if (themeSelect) {
    // Leer preferencia de storage
    const lastTheme = localStorage.getItem('pastecore_theme');
    if (lastTheme) {
      document.body.classList.remove('theme-neutral', 'theme-light');
      if (lastTheme !== 'neon') document.body.classList.add(`theme-${lastTheme}`);
      themeSelect.value = lastTheme;
    }
    themeSelect.onchange = () => {
      document.body.classList.remove('theme-neutral', 'theme-light');
      if (themeSelect.value !== 'neon') document.body.classList.add(`theme-${themeSelect.value}`);
      else document.body.classList.remove('theme-neutral', 'theme-light');
      localStorage.setItem('pastecore_theme', themeSelect.value);
    };
  }
});
