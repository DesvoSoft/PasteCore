# PasteCore

**PasteCore** is a lightweight Chrome extension to **save, organize, and instantly paste reusable snippets** of text, code, and notes. Manage your library of snippets with folders, quick import/export, and a clean interface. Instantly paste your snippets from the popup or right-click menu anywhere you type.

---

## Features

* 🗂 **Folders**: Organize snippets into folders.
* 📋 **Context Menu Integration**: Right-click to paste or save snippets directly from web pages.
* ⬆️⬇️ **Import/Export**: Backup or migrate your snippet library with JSON files.

---

## Installation

1. **From the Chrome Web Store**
   \[Coming soon!]

2. **Manual Installation**

   1. Download or clone this repository.
   2. Go to `chrome://extensions/` in your browser.
   3. Enable **Developer Mode**.
   4. Click **Load unpacked** and select the project folder.

---

## Usage

* Click the **PasteCore** icon to open the popup and manage your snippets.
* Use the **right-click menu** in any editable or text field to quickly paste and also save texts.
* Organize snippets in folders, or edit via the popup dialog.
* Import/export your collection from the **Settings** dialog (⚙️).

---

## Permissions

PasteCore requires the following permissions:

* `contextMenus`: To show options in the right-click menu.
* `storage`: To save your snippets and preferences locally.
* `scripting` & `activeTab`: To insert snippets into input fields on web pages when requested by the user.
* `host_permissions: <all_urls>`: Only to enable the context menu and paste functionality everywhere. **No browsing data is read or collected.**
* **Privacy:** All data is stored locally in your browser. Nothing is ever sent or shared with anyone.
  
---

## Privacy

**PasteCore does not collect, store, or transmit any personal data.**
All information stays on your device and is never shared with third parties.

---

## Contributing

Pull requests, bug reports, and suggestions are welcome!
Feel free to open an issue or submit a PR.

---

## Credits

Developed by \[DesvoSoft].
Inspired by already existing productivity extensions.
