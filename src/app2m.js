
/* ================= LITECAD (solo versione Windows): pagina di collegamento con il programma LiteCAD di fel88 ================= */
var LC = window.native && window.native.litecad && window.native.platform === 'win32' ? window.native.litecad : null;
ui.lc = { st: null, files: [] };
function lcRefresh() { if (!LC) return; LC.status().then(function (s) { ui.lc.st = s; return LC.list(); }).then(function (f) { ui.lc.files = f || []; if (ui.env === 'lc') { renderLc(); refreshPane(); } }); }
function renderLc() {
  if (!ui.lc.loaded && LC) { ui.lc.loaded = true; lcRefresh(); }
  var s = ui.lc.st || {}, files = ui.lc.files || [];
  $('lc').innerHTML = '<div class="card"><h2>LiteCAD</h2>' +
    (s.exe ? '<div class="issue ok">LiteCAD trovato: <code>' + esc(s.exe) + '</code></div>' : '<div class="issue err">LiteCAD.exe non trovato. Usa <b>Scegli LiteCAD.exe…</b> oppure compila LiteCAD con lo script incluso nel pacchetto (cartella LiteCAD).</div>') +
    '<div class="row"><button class="btn primary" id="lcRun"' + (s.exe ? '' : ' disabled') + '>Avvia LiteCAD</button><button class="btn small" id="lcChoose">Scegli LiteCAD.exe…</button><button class="btn small" id="lcSend">Invia il disegno corrente a LiteCAD (DXF)</button><button class="btn small" id="lcFolder">Apri cartella di scambio</button></div>' +
    '<h3>Come si lavora</h3><ol class="note" style="margin-top:4px"><li><b>Avvia LiteCAD</b> e disegna nel suo editor 2D (Draft), con i suoi vincoli.</li><li>In LiteCAD esporta il disegno in <b>DXF</b> nella cartella di scambio: <code>' + esc(s.dir || '') + '</code></li><li>CAM Tech 99L se ne accorge e propone di importarlo nel CAD; oppure usa <b>Importa nel CAD</b> qui sotto.</li><li>Per portare un pannello di CAM Tech 99L in LiteCAD: <b>Invia il disegno corrente</b>, poi in LiteCAD importa il DXF da quella cartella.</li></ol></div>' +
    '<div class="card"><h2>Cartella di scambio</h2>' + (files.length ? '<div class="tt-wrap"><table class="arch"><thead><tr><th>File DXF</th><th>Modificato</th><th></th></tr></thead><tbody>' + files.map(function (f) { return '<tr><td><b>' + esc(f.name) + '</b></td><td>' + new Date(f.mtime).toLocaleString('it-IT') + '</td><td><button class="btn small" data-lcimp="' + esc(f.name) + '">Importa nel CAD</button></td></tr>'; }).join('') + '</tbody></table></div>' : '<p class="note">Nessun DXF nella cartella di scambio.</p>') +
    '<div class="row"><button class="btn small" id="lcReload">Aggiorna elenco</button></div><p class="note">LiteCAD è un programma separato (licenza MIT, fel88) e si apre nella sua finestra; il collegamento passa dai file DXF. Disegno da verificare come ogni import.</p></div>';
  $('lcRun').onclick = function () { LC.launch().then(function (r) { toast(r.ok ? 'LiteCAD avviato' : 'Avvio non riuscito: ' + r.msg); }); };
  $('lcChoose').onclick = function () { LC.choose().then(function (p) { if (p) toast('LiteCAD: ' + p); lcRefresh(); }); };
  $('lcSend').onclick = function () { LC.send(job.name + '.dxf', G.toDXF(job)).then(function (f) { toast('Disegno inviato: ' + f); lcRefresh(); }); };
  $('lcFolder').onclick = function () { LC.openFolder(); };
  $('lcReload').onclick = lcRefresh;
  $('lc').querySelectorAll('[data-lcimp]').forEach(function (b) { b.onclick = function () { lcImport(b.dataset.lcimp); }; });
}
function lcImport(name) { LC.read(name).then(function (txt) { setEnv('cad'); readDxf(new File([txt], name)); }); }
function paneLc() { var s = ui.lc.st || {}; return '<h3>Collegamento</h3><div class="kv"><span>LiteCAD</span><span>' + (s.exe ? 'trovato' : '<span style="color:var(--err)">non trovato</span>') + '</span><span>Cartella di scambio</span><span><code>' + esc(s.dir || '…') + '</code></span><span>Disegno corrente</span><span>' + esc(job.name) + '</span></div><p class="note">Cercato in: ' + (s.candidates || []).map(esc).join('<br>') + '</p>'; }
cmd('toLc', 'LiteCAD', function () { if (!LC) return toast('LiteCAD è disponibile solo nella versione Windows'); setEnv('lc'); lcRefresh(); });
if (LC) {
  var envB = $('envLc'); if (envB) envB.hidden = false;
  LC.onNew(function (name) { if (/^CAMTECH_/i.test(name)) return; lcRefresh(); dlg('Nuovo disegno da LiteCAD', '<p>Nella cartella di scambio è stato salvato <b>' + esc(name) + '</b>. Importarlo nel CAD?</p>', 'Importa', function () { setTimeout(function () { lcImport(name); }, 0); }); });
}
Object.assign(HELP, { toLc: ['Collegamento con LiteCAD (solo Windows): avvia LiteCAD e scambia i disegni in DXF.'] });
