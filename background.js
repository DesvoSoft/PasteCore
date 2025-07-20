import { getSnippets } from './storage/snippetsStore.js';

function rebuildContextMenu() {
  chrome.contextMenus.removeAll(() => {
    // Menú raíz
    chrome.contextMenus.create({
      id: 'clippingsRoot',
      title: 'PasteCore',
      contexts: ['editable']
    }, () => {
      if (chrome.runtime.lastError) {
        console.warn('Error creating clippingsRoot:', chrome.runtime.lastError.message);
      }

      // Opción para guardar selección como snippet
      chrome.contextMenus.create({
        id: 'saveSelection',
        title: 'Save selection',
        contexts: ['selection']
      }, () => {
        if (chrome.runtime.lastError) {
          console.warn('Error creating saveSelection:', chrome.runtime.lastError.message);
        }
      });

      // Obtener y procesar snippets y folders
      getSnippets().then(snippets => {
        // Mapeo de folders: nombre -> [índices de snippets]
        const folderSnippets = {};
        const folderIds = {};
        snippets.forEach((snippet, idx) => {
          // Es un folder (snippet.text === '')
          if (snippet.text === '') {
            const folderName = snippet.title.replace('Folder:', '').trim();
            folderSnippets[folderName] = [];
          }
        });
        snippets.forEach((snippet, idx) => {
          if (snippet.text === '') return; // No agregar el propio folder como hijo
          if (snippet.folder && snippet.folder.trim() && snippet.folder in folderSnippets) {
            folderSnippets[snippet.folder].push(idx);
          }
        });

        // Crear los folders como submenús SOLO si tienen hijos
        Object.entries(folderSnippets).forEach(([folderName, indices]) => {
          if (indices.length === 0) return; // No crear si está vacío
          const folderId = `folder_${folderName.replace(/\s+/g, '_')}`;
          folderIds[folderName] = folderId;
          chrome.contextMenus.create({
            id: folderId,
            parentId: 'clippingsRoot',
            // Puedes personalizar el emoji aquí
            title: `📁 ${folderName}`,
            contexts: ['editable']
          }, () => {
            if (chrome.runtime.lastError) {
              console.warn(`Menu creation failed for ${folderId}:`, chrome.runtime.lastError.message);
            }
          });
        });

        // Crear los snippets: van al folder si aplica, o a raíz si no tienen folder válido
        snippets.forEach((snippet, idx) => {
          if (snippet.text === '') return;
          let parentId = 'clippingsRoot';
          if (snippet.folder && snippet.folder.trim() && folderIds[snippet.folder]) {
            parentId = folderIds[snippet.folder];
          }
          chrome.contextMenus.create({
            id: `clip_${idx}`,
            parentId,
            title: snippet.title,
            contexts: ['editable']
          }, () => {
            if (chrome.runtime.lastError) {
              console.warn(`Menu creation failed for clip_${idx}:`, chrome.runtime.lastError.message);
            }
          });
        });
      });
    });
  });
}

// Listeners igual que antes
chrome.runtime.onInstalled.addListener(() => {
  rebuildContextMenu();
});

chrome.runtime.onStartup.addListener(() => {
  rebuildContextMenu();
});

chrome.storage.onChanged.addListener((changes, area) => {
  if (area === 'local' && changes.snippets) {
    rebuildContextMenu();
  }
});

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === 'saveSelection') {
    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => window.getSelection().toString()
    }, async (results) => {
      const selected = results[0]?.result?.trim();
      if (!selected) return;

      const snippets = await getSnippets();
      snippets.push({
        title: selected.substring(0, 30),
        text: selected,
        folder: '',
        star: false,
        usage: 0
      });
      chrome.storage.local.set({ snippets });
    });
    return;
  }

  if (info.menuItemId.startsWith('clip_')) {
    const index = parseInt(info.menuItemId.replace('clip_', ''));
    const snippets = await getSnippets();
    const snippet = snippets[index];
    if (!snippet || !snippet.text) return;

    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: (t) => {
        const el = document.activeElement;
        if (el && (el.tagName === 'TEXTAREA' || el.tagName === 'INPUT')) {
          const start = el.selectionStart;
          const end = el.selectionEnd;
          el.setRangeText(t, start, end, 'end');
          el.dispatchEvent(new Event('input', { bubbles: true }));
        }
      },
      args: [snippet.text]
    });
  }
});
