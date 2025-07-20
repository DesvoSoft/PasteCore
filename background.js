/* -------------------------- background.js ------------------------- */
import { getSnippets } from './storage/snippetsStore.js';

function rebuildContextMenu() {
  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({
      id: 'clippingsRoot',
      title: 'PasteCore Snippets',
      contexts: ['editable']
    }, () => {
      if (chrome.runtime.lastError) {
        console.warn('Error creating clippingsRoot:', chrome.runtime.lastError.message);
      }

      chrome.contextMenus.create({
        id: 'saveSelection',
        title: 'Save selection as snippet',
        contexts: ['selection']
      }, () => {
        if (chrome.runtime.lastError) {
          console.warn('Error creating saveSelection:', chrome.runtime.lastError.message);
        }
      });

      getSnippets().then(snippets => {
        snippets.forEach((snippet, idx) => {
          const title = snippet.title || `Snippet ${idx}`;
          chrome.contextMenus.create({
            id: `clip_${idx}`,
            parentId: 'clippingsRoot',
            title,
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
