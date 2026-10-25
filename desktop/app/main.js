const { app, BrowserWindow, Menu, shell, ipcMain, dialog } = require('electron');
const path = require('path'), fs = require('fs'), { spawn } = require('child_process');
let win = null, watcher = null, lastEmit = {};
const cfgFile = () => path.join(app.getPath('userData'), 'litecad.json');
function cfg() { try { return JSON.parse(fs.readFileSync(cfgFile(), 'utf8')); } catch (e) { return {}; } }
function saveCfg(c) { try { fs.mkdirSync(path.dirname(cfgFile()), { recursive: true }); fs.writeFileSync(cfgFile(), JSON.stringify(c, null, 1)); } catch (e) {} }
function exchangeDir() { const d = path.join(app.getPath('documents'), 'CAM Tech 99L', 'LiteCAD'); fs.mkdirSync(d, { recursive: true }); return d; }
function candidates() {
  const la = process.env.LOCALAPPDATA || path.join(app.getPath('home'), 'AppData', 'Local');
  return [cfg().exe, path.join(process.resourcesPath || '', 'litecad', 'LiteCAD.exe'), path.join(la, 'CAM Tech 99L', 'LiteCAD', 'LiteCAD.exe'),
    path.join(app.getPath('desktop'), 'LiteCAD', 'LiteCAD.exe'), path.join(app.getPath('desktop'), 'LiteCAD-main', 'LiteCAD', 'bin', 'Release', 'net8.0-windows10.0.19041.0', 'LiteCAD.exe')].filter(Boolean);
}
function findExe() { for (const c of candidates()) { try { if (fs.statSync(c).isFile()) return c; } catch (e) {} } return null; }
function watch() {
  if (watcher) return; const d = exchangeDir();
  try { watcher = fs.watch(d, (ev, name) => { if (!name || !/\.dxf$/i.test(name) || !win) return; const now = Date.now(); if (now - (lastEmit[name] || 0) < 1500) return; lastEmit[name] = now; setTimeout(() => { if (win) win.webContents.send('lc-new', name); }, 600); }); } catch (e) {}
}
ipcMain.handle('lc-status', () => ({ exe: findExe(), dir: exchangeDir(), platform: process.platform, candidates: candidates() }));
ipcMain.handle('lc-choose', async () => { const r = await dialog.showOpenDialog(win, { title: 'Scegli LiteCAD.exe', filters: [{ name: 'LiteCAD', extensions: ['exe'] }], properties: ['openFile'] }); if (r.canceled || !r.filePaths[0]) return null; const c = cfg(); c.exe = r.filePaths[0]; saveCfg(c); return c.exe; });
ipcMain.handle('lc-launch', () => { const exe = findExe(); if (!exe) return { ok: false, msg: 'LiteCAD.exe non trovato' }; try { const p = spawn(exe, [], { cwd: path.dirname(exe), detached: true, stdio: 'ignore' }); p.unref(); watch(); return { ok: true, exe }; } catch (e) { return { ok: false, msg: String(e.message || e) }; } });
ipcMain.handle('lc-send', (e, name, text) => { const safe = String(name).replace(/[\\/:*?"<>|]/g, '_'); const f = path.join(exchangeDir(), safe); fs.writeFileSync(f, text, 'latin1'); watch(); return f; });
ipcMain.handle('lc-list', () => { const d = exchangeDir(); watch(); return fs.readdirSync(d).filter(n => /\.dxf$/i.test(n)).map(n => { const s = fs.statSync(path.join(d, n)); return { name: n, size: s.size, mtime: s.mtimeMs }; }).sort((a, b) => b.mtime - a.mtime); });
ipcMain.handle('lc-read', (e, name) => fs.readFileSync(path.join(exchangeDir(), path.basename(name)), 'latin1'));
ipcMain.handle('lc-open-folder', () => shell.openPath(exchangeDir()));
function create() {
  win = new BrowserWindow({ width: 1440, height: 900, minWidth: 900, minHeight: 600, title: 'CAM Tech 99L', autoHideMenuBar: true,
    webPreferences: { contextIsolation: true, sandbox: true, preload: path.join(__dirname, 'preload.js') } });
  Menu.setApplicationMenu(null);
  win.webContents.setWindowOpenHandler(({ url }) => { shell.openExternal(url); return { action: 'deny' }; });
  win.loadFile(path.join(__dirname, 'index.html'));
  win.on('closed', () => { win = null; });
}
app.whenReady().then(create);
app.on('window-all-closed', () => { if (watcher) watcher.close(); app.quit(); });
