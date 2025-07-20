export const getSnippets = () => new Promise(res => {
  chrome.storage.local.get({ snippets: [] }, data => res(data.snippets));
});

export const saveSnippets = (snippets) => new Promise(res => {
  chrome.storage.local.set({ snippets }, res);
});

export const addSnippet = async ({ title, text, folder }) => {
  const snippets = await getSnippets();
  snippets.push({ title, text, folder: folder || 'General', star: false, usage: 0 });
  await saveSnippets(snippets);
};

export const incrementUsage = async (idx) => {
  const snippets = await getSnippets();
  snippets[idx].usage = (snippets[idx].usage || 0) + 1;
  await saveSnippets(snippets);
};

export const toggleStar = async (idx) => {
  const snippets = await getSnippets();
  snippets[idx].star = !snippets[idx].star;
  await saveSnippets(snippets);
};

export const exportSnippets = async () => {
  const snippets = await getSnippets();
  const blob = new Blob([JSON.stringify(snippets, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'snippets.json';
  a.click();
};

export const importSnippets = async (imported) => {
  await saveSnippets(imported);
};
