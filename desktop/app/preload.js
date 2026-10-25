// Ponte sicuro tra la pagina e Windows: solo le funzioni per LiteCAD (avvio, cartella di scambio DXF)
const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld('native', {
  platform: process.platform,
  litecad: {
    status: () => ipcRenderer.invoke('lc-status'),
    choose: () => ipcRenderer.invoke('lc-choose'),
    launch: () => ipcRenderer.invoke('lc-launch'),
    send: (name, text) => ipcRenderer.invoke('lc-send', name, text),
    list: () => ipcRenderer.invoke('lc-list'),
    read: (name) => ipcRenderer.invoke('lc-read', name),
    openFolder: () => ipcRenderer.invoke('lc-open-folder'),
    onNew: (cb) => ipcRenderer.on('lc-new', (e, name) => cb(name))
  }
});
