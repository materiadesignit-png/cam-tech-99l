
/* ================= PRESELEZIONE: spiegazione del comando sotto il cursore (come la riga di stato di Task) + evidenza dell'entità puntata ================= */
// [descrizione, tasto rapido, cosa serve prima]
var HELP = {
  toSup: ['Torna al Supervisore: archivio disegni, macchina, part-program.'], toCad: ['Apre il disegno corrente nel CAD.'], toCam: ['Apre il disegno nel CAM: lavorazioni, ottimizzazione, part-program.'], toFer: ['Libreria di schemi di foratura per ferramenta (cerniere, sistema 32, giunzioni, maniglie).'],
  save: ['Salva il disegno nell\'archivio.', 'Ctrl+S'], saveAs: ['Salva il disegno con un altro nome.'], newDrawing: ['Nuovo disegno: chiede le dimensioni del pannello.'], openDrawing: ['Apre un disegno dall\'archivio.'],
  exportProj: ['Salva il progetto in un file .json da portare su un altro PC.'], importProj: ['Apre un progetto .json salvato con Esporta progetto.'], importDxf: ['Importa un disegno DXF: i layer diventano fori e fresature.'], exportDxf: ['Esporta il disegno in DXF.'], ptsFile: ['Crea una fresatura da un file di punti X Y.'],
  zPrev: ['Torna allo zoom precedente.'], zWin: ['Ingrandisce la finestra che trascini col mouse.', 'W'], zOut: ['Riduce la vista.', '−'], zIn: ['Ingrandisce la vista.', '+'], zFace: ['Mostra tutta la faccia superiore del pannello.', '0'], zExt: ['Mostra tutte le entità del disegno.', 'E'], pan: ['Sposta la vista trascinando. Anche tasto centrale o barra spaziatrice.', 'Spazio'], explode: ['Mostra o nasconde i fianchi del pannello attorno alla faccia superiore.'],
  selectMode: ['Selezione: clic su un\'entità; trascina per la finestra (da sinistra: solo interne, da destra: anche toccate). Maiusc aggiunge o toglie.', 'V'],
  hole: ['Foro col mouse: clic sulla faccia superiore o su un fianco dell\'esploso.', 'F'], row: ['Barriera di fori col mouse: clic sul primo foro e trascina.', 'L'], pathMode: ['Fresatura per punti: clic sui vertici, doppio clic o Invio per finire. Maiusc = orizzontale/verticale.', 'P'],
  rect: ['Rettangolo fresato col mouse: due angoli opposti.', 'R'], circleMode: ['Cerchio fresato col mouse: centro e raggio.', 'C'], pocketMode: ['Tasca (svuotamento) col mouse.', 'T'],
  holeNum: ['Foro con coordinate, diametro, profondità e ripetizioni.'], holeSide: ['Foro orizzontale su un fianco (facce 2-5).'], rowNum: ['Barriera di fori con partenza, arrivo e passo.'],
  line2: ['Fresatura retta per 2 punti.'], lineAL: ['Fresatura retta da punto iniziale, angolo e lunghezza.'], arcC: ['Arco da inizio, fine e centro.'], arcR: ['Arco da inizio, fine e raggio.'], arcP: ['Arco da inizio, punto intermedio e fine.'],
  circleCR: ['Cerchio da centro e raggio.'], circle3: ['Cerchio per 3 punti.'], rectNum: ['Rettangolo con quote e raggio di raccordo.'], ellipse: ['Ellisse da centro e semiassi.'],
  follow_rt: ['Continua la fresatura selezionata con una retta tangente.', '', 'Seleziona una fresatura aperta'], follow_rp: ['Continua la fresatura fino a un punto.', '', 'Seleziona una fresatura aperta'], follow_ra: ['Continua con una retta di angolo e lunghezza dati.', '', 'Seleziona una fresatura aperta'],
  follow_at: ['Continua con un arco tangente.', '', 'Seleziona una fresatura aperta'], follow_ac: ['Continua con un arco da fine e centro.', '', 'Seleziona una fresatura aperta'], follow_ar: ['Continua con un arco da fine e raggio.', '', 'Seleziona una fresatura aperta'],
  scont: ['Scontornatura del pannello con ingresso e uscita.'], trim: ['Rifilatura di tutto il perimetro con le variabili DX DY della macchina.', 'Q'], pocketRect: ['Tasca rettangolare con quote.'], pocketCirc: ['Tasca circolare con quote.'], pocketGen: ['Svuota l\'interno di un contorno chiuso.', '', 'Seleziona un contorno chiuso'],
  canali: ['Serie di canali paralleli.'], antina: ['Antina: cornice fresata con ingresso e raccordi.'], blockDef: ['Salva le entità selezionate come blocco riutilizzabile.', '', 'Seleziona le entità'], blockIns: ['Inserisce un blocco salvato.'],
  setDiam: ['Cambia diametro dei fori o fresa delle fresature selezionate.', '', 'Seleziona le entità'], setDepth: ['Cambia la profondità delle entità selezionate.', '', 'Seleziona le entità'], setInterpZ: ['Profondità variabile lungo la fresatura (lineare o circolare).', '', 'Seleziona una fresatura'],
  setDirGlobal: ['Stesso verso (orario o antiorario) per tutte le fresature chiuse.'], setCorr: ['Correzione utensile: interno, esterno, in asse, G141, G142.', '', 'Seleziona le fresature'],
  del: ['Cancella le entità selezionate (le quote si cancellano da Quote → Cancella).', 'Canc', 'Seleziona le entità'], copy: ['Copia le entità selezionate con spostamento.', 'Ctrl+D', 'Seleziona le entità'], move: ['Sposta le entità selezionate di dX dY o da punto a punto.', '', 'Seleziona le entità'],
  rotate: ['Ruota le entità selezionate attorno a un centro.', '', 'Seleziona le entità'], mirror: ['Specchia le entità selezionate su un asse o una linea.', '', 'Seleziona le entità'], oppose: ['Porta le entità sulla faccia opposta del pannello.', '', 'Seleziona le entità'],
  scale: ['Scala le entità selezionate.', '', 'Seleziona le entità'], series: ['Ripete le entità selezionate in serie lineare.', '', 'Seleziona le entità'], panelEdit: ['Cambia dimensioni e spessore del pannello.'], entity: ['Mostra e modifica i dati dell\'entità selezionata.', '', 'Seleziona un\'entità'],
  trimEnt: ['Taglia: le entità selezionate fanno da lame (viola); poi clic sulla parte da eliminare. Esc per finire.', '', 'Seleziona prima le lame'], extendEnt: ['Estendi: le entità selezionate fanno da bordo; poi clic vicino all\'estremo da allungare. Esc per finire.', '', 'Seleziona prima i bordi'],
  origin: ['Sposta l\'origine locale per inserire quote relative.'], fillet: ['Raccordo di raggio dato su un vertice della fresatura.'], chamfer: ['Smusso su un vertice della fresatura.'], offset: ['Fresatura parallela a distanza data.', '', 'Seleziona una fresatura'],
  gridSet: ['Passo della griglia.'], gridSnap: ['Aggancio alla griglia sì/no.', 'G'], osnap: ['Aggancio ai punti notevoli (fine, medio, centro, intersezione…) sì/no.', 'O'], distance: ['Misura la distanza tra due punti.'],
  dimAdd: ['Quote: X, Y, allineata, raggio o diametro. Non entrano nel part-program.'], dimPanel: ['Aggiunge le quote X e Y del pannello.'], dimDel: ['Cancella le quote su cui clicchi.'], dimAll0: ['Cancella tutte le quote.'], dimShow: ['Mostra o nasconde le quote.'],
  undo: ['Annulla l\'ultima modifica.', 'Ctrl+Z'], redo: ['Ripristina la modifica annullata.', 'Ctrl+Y'],
  cutsew: ['Divide una fresatura in un vertice, o unisce due fresature con un estremo in comune.'], autojoin: ['Unisce automaticamente le fresature che si toccano.'], reduceMill: ['Riduzione fresature: toglie tratti minuscoli e unisce tratti allineati entro la tolleranza.'],
  round: ['Raccorda tutti gli spigoli della fresatura con il raggio dato.', '', 'Seleziona una fresatura'], reverse: ['Inverte il verso di percorrenza.', '', 'Seleziona le fresature'],
  infoPanel: ['Dati del pannello.'], infoEntity: ['Dati dell\'entità selezionata.'], infoSeg: ['Lunghezza, raggio e angolo del tratto su cui clicchi.'], infoMill: ['Lunghezza, area, ingombro e controllo della fresatura selezionata.', '', 'Seleziona una fresatura'], infoState: ['Stato del disegno e delle impostazioni.'], geoCheck: ['Cerca tratti nulli, autointersezioni ed entità duplicate.'],
  optimize: ['Ordina le lavorazioni per ridurre cambi utensile e spostamenti (semaforo verde).'], deoptimize: ['Torna all\'ordine di disegno.'], genPP: ['Genera il part-program .PRG per la Kvara (controsagome a zero).'], originProg: ['Battuta, attrezzaggio e piani del programma.'],
  leadIn: ['Tratto di ingresso della fresa (retta o arco).', '', 'Seleziona una fresatura'], leadOut: ['Tratto di uscita della fresa.', '', 'Seleziona una fresatura'], forature: ['Tabella dei fori con la punta assegnata.'], fresature: ['Utensile, passate e velocità delle fresature selezionate.', '', 'Seleziona le fresature'],
  sequences: ['Ordine di esecuzione: seleziona e usa Su / Giù.'], animate: ['Simula il percorso dell\'utensile.'], camView: ['Cosa mostrare nel CAM.'],
  toolsEdit: ['Modifica attrezzaggio: utensili, diametri, giri, velocità.'], machImport: ['Importa Def.TLD e i file di C:\\Dati della macchina.'], configView: ['Configurazione macchina T99LKVA.'], defaults: ['Velocità e giri predefiniti.'], about: ['Versione del programma.'],
  arcCopy: ['Copia il disegno selezionato dell\'archivio.'], arcRename: ['Rinomina il disegno.'], arcDelete: ['Cancella il disegno dall\'archivio.'], arcComment: ['Commento del disegno.'], ppView: ['Visualizza, genera e salva il part-program.'], iconStyle: ['Stile e dimensione delle icone. Anche tasto destro sulla barra.']
};
var tipEl = null, tipTimer = null, tipShown = 0, promptSaved = null;
function tipNode() { if (!tipEl) { tipEl = document.createElement('div'); tipEl.className = 'ctip'; tipEl.setAttribute('role', 'tooltip'); tipEl.hidden = true; document.body.appendChild(tipEl); } return tipEl; }
function cmdHelp(id, fallback) {
  var h = HELP[id] || [], c = CMD[id];
  return { name: (fallback || (c && c.label) || id).replace(/\s*\([^)]*\)/g, '').replace(/…$/, '').trim(), desc: h[0] || '', key: h[1] || '', need: h[2] || '' };
}
function showTip(el) {
  var id = el.dataset.cmd; if (!id) return;
  var h = cmdHelp(id, el.getAttribute('aria-label') || el.textContent.replace(/[▸]/g, '').replace(/(Ctrl\+\S+|Canc|Spazio|^\s+|\s+$)/g, '')), t = tipNode();
  var needOk = h.need && /Seleziona/.test(h.need) ? (ui.sel.length ? '<span class="ok">✓ ' + ui.sel.length + ' selezionate</span>' : '<span class="need">Prima: ' + esc(h.need.replace(/^Seleziona prima /, 'seleziona ').replace(/^Seleziona/, 'seleziona')) + '</span>') : '';
  t.innerHTML = '<b>' + esc(h.name) + '</b>' + (h.key ? '<kbd>' + esc(h.key) + '</kbd>' : '') + (h.desc ? '<div>' + esc(h.desc) + '</div>' : '') + needOk;
  t.hidden = false;
  var r = el.getBoundingClientRect(), inMenu = !!el.closest('.drop'), inDisp = !!el.closest('.disp'), tw = t.offsetWidth, th = t.offsetHeight, x, y;
  if (inMenu || inDisp) { x = r.right + 8; y = r.top; } else { x = r.left; y = r.bottom + 6; }
  if (x + tw > innerWidth - 8) x = inMenu ? r.left - tw - 8 : innerWidth - tw - 8; if (y + th > innerHeight - 8) y = innerHeight - th - 8;
  t.style.left = Math.max(8, x) + 'px'; t.style.top = Math.max(8, y) + 'px';
  if (promptSaved == null) promptSaved = $('prompt').textContent; setPrompt(h.name + (h.desc ? ' — ' + h.desc : '')); tipShown = Date.now();
}
function hideTip() { clearTimeout(tipTimer); if (tipEl) tipEl.hidden = true; if (promptSaved != null) { setPrompt(promptSaved); promptSaved = null; } }
['toolbar', 'disp', 'menubar'].forEach(function (zone) {
  var z = $(zone);
  z.addEventListener('pointerover', function (e) {
    var b = e.target.closest('[data-cmd]'); if (!b) return;
    clearTimeout(tipTimer); var quick = Date.now() - tipShown < 800 || (tipEl && !tipEl.hidden);
    tipTimer = setTimeout(function () { showTip(b); }, quick ? 0 : 280);
  });
  z.addEventListener('pointerout', function (e) { var b = e.target.closest('[data-cmd]'); if (b && !b.contains(e.relatedTarget)) { clearTimeout(tipTimer); if (tipEl) tipEl.hidden = true; if (promptSaved != null) { setPrompt(promptSaved); promptSaved = null; } } });
  z.addEventListener('focusin', function (e) { var b = e.target.closest('[data-cmd]'); if (b) showTip(b); });
  z.addEventListener('focusout', hideTip);
  z.addEventListener('pointerdown', hideTip);
});
document.addEventListener('keydown', function (e) { if (e.key === 'Escape') hideTip(); });

/* ---- preselezione entità: evidenzia ciò che verrebbe selezionato col clic ---- */
cv.addEventListener('pointermove', function (e) {
  if (e.buttons) { if (ui.hoverId) { ui.hoverId = null; } return; }
  var want = ui.mode === 'select' || (ui.pick && ui.pick.entity), r = cv.getBoundingClientRect();
  var h = want ? hit(e.clientX - r.left, e.clientY - r.top) : null, id = h ? h.id : null;
  if (id !== ui.hoverId) { ui.hoverId = id; cv.style.cursor = id ? 'pointer' : ''; draw(); }
});
cv.addEventListener('pointerleave', function () { if (ui.hoverId) { ui.hoverId = null; draw(); } });
function drawHover() {
  if (!ui.hoverId || ui.env === 'sup' || ui.env === 'fer' || ui.env === 'mob' || ui.env === 'lc') return;
  var o = getOp(ui.hoverId); if (!o) return;
  var css = getComputedStyle(document.documentElement), c = css.getPropertyValue('--sel').trim() || '#0d9488';
  ctx.save(); ctx.strokeStyle = c; ctx.lineWidth = 2; ctx.setLineDash([6, 4]);
  var lab = null;
  if (o.type === 'hole' || o.type === 'row') {
    var pts = [];
    if (o.type === 'row') for (var i = 0; i < o.n; i++) pts.push({ x: o.dir === 'X' ? o.x + i * o.step : o.x, y: o.dir === 'Y' ? o.y + i * o.step : o.y });
    else if (o.face === 1) pts.push({ x: o.x, y: o.y });
    else { var w = faceToWorld(o.face, o.pos, o.z); pts.push(w); }
    pts.forEach(function (p) { ctx.beginPath(); ctx.arc(sx(p.x), sy(p.y), Math.max(7, o.d / 2 * view.s + 5), 0, 7); ctx.stroke(); });
    lab = pts[0];
  } else if (o.type === 'trim') {
    ctx.strokeRect(sx(0) - 5, sy(job.panel.W) - 5, job.panel.L * view.s + 10, job.panel.W * view.s + 10); lab = { x: 0, y: job.panel.W };
  } else {
    TOPO.segs(o).forEach(function (s) { ctx.beginPath(); for (var t = 0, n = s.arc ? 24 : 1; t <= n; t++) { var q = TOPO.pointAt(s, t / n); if (!t) ctx.moveTo(sx(q.x), sy(q.y)); else ctx.lineTo(sx(q.x), sy(q.y)); } ctx.stroke(); });
    var bb = G.opBBox(o); lab = { x: bb.x1, y: bb.y1 };
  }
  ctx.setLineDash([]);
  var m = ui.mouse, txt = '#' + (opIndex(o.id) + 1) + ' ' + opLabel(o) + (isSel(o) ? ' · selezionata' : ''), fx = (m && m.px != null ? m.px : sx(lab.x)) + 14, fy = (m && m.py != null ? m.py : sy(lab.y)) + 18;
  ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic'; ctx.font = '12px ' + (css.getPropertyValue('--f-ui').trim() || 'sans-serif'); var tw = ctx.measureText(txt).width;
  ctx.fillStyle = css.getPropertyValue('--surface').trim() || '#fff'; ctx.globalAlpha = .94; ctx.fillRect(fx - 4, fy - 13, tw + 8, 18); ctx.globalAlpha = 1;
  ctx.strokeStyle = c; ctx.lineWidth = 1; ctx.strokeRect(fx - 4, fy - 13, tw + 8, 18); ctx.fillStyle = css.getPropertyValue('--ink').trim() || '#000'; ctx.fillText(txt, fx, fy);
  ctx.restore();
}
