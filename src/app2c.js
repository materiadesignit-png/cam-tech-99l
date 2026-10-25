
/* ================= comandi ================= */
var CMD = {};
function cmd(id, label, fn) { CMD[id] = { label: label, run: fn }; }
function run(id) { closeMenus(); var c = CMD[id]; if (!c) return; if (ui.pick) cancelPick(); c.run(); }
function needSel(min, types) {
  var ops = selOps().filter(function (o) { return !types || types.indexOf(o.type) >= 0; });
  if (ops.length < (min || 1)) { toast(types && types.indexOf('path') >= 0 && types.length === 1 ? 'Seleziona prima una fresatura' : 'Seleziona prima le lavorazioni (clic o finestra)'); return null; }
  return ops;
}

/* ---- ambienti ---- */
cmd('toSup', 'Supervisore', function () { setEnv('sup'); });
cmd('toCad', 'CAD', function () { setEnv('cad'); });
cmd('toCam', 'CAM', function () { setEnv('cam'); });

/* ---- File / archivio ---- */
function saveToArchive(name) {
  name = C.progName({ progName: name || job.name }); job.name = name; job.settings.progName = name;
  archive[name] = { job: clone(job), comment: job.comment || '', date: new Date().toISOString() }; saveArchive(); dirty = false; persist(); refresh(); toast('Disegno salvato in archivio: ' + name);
}
cmd('save', 'Salva', function () { saveToArchive(job.name); });
cmd('saveAs', 'Salva come…', function () {
  dlg('Salva come', field('qN', 'Nome disegno', job.name, { wide: true, text: true }) + field('qCm', 'Commento', job.comment, { wide: true, text: true }), 'Salva', function () {
    var n = C.progName({ progName: $('qN').value }); if (archive[n] && n !== job.name) { if (!$('qOw')) { $('mOk').insertAdjacentHTML('beforebegin', chk('qOw', 'Sovrascrivi il disegno esistente', false)); return false; } if (!$('qOw').checked) return false; }
    job.comment = $('qCm').value; saveToArchive(n);
  });
});
cmd('newDrawing', 'Nuovo', function () {
  dlg('Nuovo disegno', '<div class="grid2">' + field('qN', 'Nome', 'NUOVO', { wide: true, text: true }) + field('qL', 'Dimensione X', job.panel.L, { unit: 'mm' }) + field('qW', 'Dimensione Y', job.panel.W, { unit: 'mm' }) + field('qT', 'Dimensione Z', job.panel.T, { unit: 'mm' }) + field('qCm', 'Commento', '', { text: true }) + '</div>' +
    (dirty ? '<p class="note">Il disegno corrente ha modifiche non salvate in archivio: restano recuperabili con Annulla finché non chiudi il programma.</p>' : ''), 'Crea', function () {
    commit(); job = migrate(newJob($('qN').value, v('qL', 600), v('qW', 400), v('qT', 18), $('qCm').value)); ui.sel = []; ui.origin = { x: 0, y: 0 }; persist(); setEnv('cad'); fitPanel(); toast('Nuovo disegno ' + job.name);
  });
});
cmd('openDrawing', 'Apri…', function () {
  var names = Object.keys(archive).sort();
  if (!names.length) return toast('Archivio vuoto: salva un disegno o importa un progetto');
  dlg('Apri disegno', field('qN', 'Disegno', ui.archSel || names[0], { wide: true, select: names.map(function (n) { return [n, n + (archive[n].comment ? ' — ' + archive[n].comment : '')]; }) }), 'Apri', function () { openFromArchive($('qN').value); });
});
function openFromArchive(n) { var a = archive[n]; if (!a) return; commit(); job = migrate(clone(a.job)); fixIds(); ui.sel = []; dirty = false; persist(); setEnv('cad'); fitPanel(); toast('Aperto ' + n); }
cmd('exportProj', 'Esporta progetto (.json)', function () { saveFile(job.name + '_cam99l.json', JSON.stringify(job, null, 1), 'Progetto esportato'); });
cmd('importProj', 'Importa progetto (.json)…', function () { $('fProj').click(); });
cmd('importDxf', 'Import DXF…', function () { $('fDxf').click(); });
cmd('exportDxf', 'Esporta DXF', function () { saveFile(job.name + '.dxf', G.toDXF(job), 'DXF esportato'); });
cmd('ptsFile', 'Forma per punti da file…', function () { $('fPts').click(); });

/* ---- Display ---- */
cmd('zPrev', 'Zoom precedente', function () { var s = viewStack.pop(); if (s) { view.s = s.s; view.ox = s.ox; view.oy = s.oy; draw(); } });
cmd('zWin', 'Zoom finestra', function () { setMode('zoomwin'); });
cmd('zOut', 'Zoom meno', function () { pushView(); zoomAt(0.5, W / 2, H / 2); });
cmd('zIn', 'Zoom più', function () { pushView(); zoomAt(2, W / 2, H / 2); });
cmd('zFace', 'Zoom faccia', function () { pushView(); fitPanel(); });
cmd('zExt', 'Zoom estensione', function () { pushView(); fitAll(); });
cmd('pan', 'Pan', function () { setMode('pan'); });
cmd('explode', 'Esploso (mostra i fianchi)', function () { ui.exploded = !ui.exploded; fitPanel(); toast(ui.exploded ? 'Vista in esploso: fianchi visibili' : 'Solo faccia superiore'); });

/* ---- Disegna: modi col mouse ---- */
cmd('selectMode', 'Selezione', function () { setMode('select'); });
cmd('hole', 'Foro (mouse)', function () { setEnv('cad', true); setMode('hole'); });
cmd('row', 'Barriera (mouse)', function () { setEnv('cad', true); setMode('row'); });
cmd('pathMode', 'Fresatura per punti (mouse)', function () { setEnv('cad', true); setMode('path'); });
cmd('rect', 'Rettangolo (mouse)', function () { setEnv('cad', true); setMode('rect'); });
cmd('circleMode', 'Cerchio (mouse)', function () { setEnv('cad', true); setMode('circle'); });
cmd('pocketMode', 'Tasca (mouse)', function () { setEnv('cad', true); setMode('pocket'); });

/* ---- Disegna: Fori ---- */
cmd('holeNum', 'Normale…', function () {
  dlg('Fori: Normale', '<div class="grid2">' + ptField('p', 'Posizione', 50, 50) + '</div><div class="grid2">' + field('qD', 'Diametro', ui.def.d, { unit: 'mm', select: drillDiams() }) + field('qP', 'Profondità', ui.def.depth, { unit: 'mm' }) +
    field('qRx', 'Ripetizioni X', 1) + field('qSx', 'Passo X', 32, { unit: 'mm' }) + field('qRy', 'Ripetizioni Y', 1) + field('qSy', 'Passo Y', 32, { unit: 'mm' }) + '</div>' + mirrorRow(), 'OK', function () {
    var p = vpt('p'), rx = Math.max(1, Math.round(v('qRx', 1))), ry = Math.max(1, Math.round(v('qRy', 1))), list = [];
    for (var j = 0; j < ry; j++) for (var i = 0; i < rx; i++) list.push({ type: 'hole', face: 1, x: r2(p.x + i * v('qSx', 32)), y: r2(p.y + j * v('qSy', 32)), d: v('qD', ui.def.d), depth: v('qP', ui.def.depth) });
    ui.def.d = v('qD', ui.def.d); ui.def.depth = v('qP', ui.def.depth); addOps(withMirrors(list));
  });
});
cmd('holeSide', 'Orizzontale su fianco…', function () {
  dlg('Foro orizzontale', '<div class="grid2">' + field('qF', 'Faccia', 5, { wide: true, select: [2, 3, 4, 5].map(function (f) { return [f, f + ' · ' + FACE_NAMES[f]]; }) }) + field('qPos', 'Posizione lungo il fianco', 37, { unit: 'mm' }) + field('qZ', 'Altezza da sotto', r2(job.panel.T / 2), { unit: 'mm' }) +
    field('qD', 'Diametro', 8, { unit: 'mm' }) + field('qP', 'Profondità', ui.def.hdepth, { unit: 'mm' }) + field('qR', 'Ripetizioni', 1) + field('qS', 'Passo', 32, { unit: 'mm' }) + '</div>', 'OK', function () {
    var list = []; for (var i = 0; i < Math.max(1, Math.round(v('qR', 1))); i++) list.push({ type: 'hole', face: +$('qF').value, pos: r2(v('qPos', 0) + i * v('qS', 32)), z: v('qZ', 9), d: v('qD', 8), depth: v('qP', 30) });
    addOps(list);
  });
});
cmd('rowNum', 'Barriera…', function () {
  dlg('Fori: Barriera', '<div class="grid2">' + ptField('a', 'Partenza', 37, 37) + '</div><div class="grid2">' + ptField('b', 'Arrivo', 357, 37) + '</div><div class="grid2">' + field('qS', 'Passo', ui.def.step, { unit: 'mm' }) + field('qD', 'Diametro', ui.def.d, { unit: 'mm', select: drillDiams() }) + field('qP', 'Profondità', ui.def.depth, { unit: 'mm' }) + '</div>' + mirrorRow(), 'OK', function () {
    var a = vpt('a'), b = vpt('b'), stp = v('qS', 32);
    if (Math.abs(b.x - a.x) > 1e-6 && Math.abs(b.y - a.y) > 1e-6) { toast('La barriera deve essere parallela a X o a Y'); return false; }
    var dirX = Math.abs(b.x - a.x) >= Math.abs(b.y - a.y), n = Math.floor(Math.abs(dirX ? b.x - a.x : b.y - a.y) / stp + 1e-6) + 1;
    addOps(withMirrors([{ type: 'row', dir: dirX ? 'X' : 'Y', x: Math.min(a.x, b.x), y: Math.min(a.y, b.y), d: v('qD', ui.def.d), step: stp, n: n, depth: v('qP', ui.def.depth) }]));
  });
});
/* ---- Disegna: Fresature ---- */
cmd('line2', 'Retta: 2 punti…', function () {
  dlg('Retta: 2 punti', '<div class="grid2">' + ptField('a', 'Partenza', 100, 100) + '</div><div class="grid2">' + ptField('b', 'Arrivo', 300, 100) + '</div><div class="grid2">' + millFields() + field('qP2', 'Profondità arrivo', '', { unit: 'mm', ph: 'uguale' }) + corrField('C', true) + '</div>' + mirrorRow(), 'OK', function () {
    var a = vpt('a'), b = vpt('b'), pts = [{ x: a.x, y: a.y, b: 0 }, { x: b.x, y: b.y, b: 0 }]; if ($('qP2').value !== '') pts[1].p = v('qP2', 0);
    addOps(withMirrors([pathFromDialog(pts, false)]));
  });
});
cmd('lineAL', 'Retta: inizio, angolo, lunghezza…', function () {
  dlg('Retta: inizio, angolo, lunghezza', '<div class="grid2">' + ptField('a', 'Inizio', 100, 100) + '</div><div class="grid2">' + field('qA', 'Angolo', 0, { unit: '°' }) + field('qL', 'Lunghezza', 200, { unit: 'mm' }) + millFields() + corrField('C', true) + '</div>' + mirrorRow(), 'OK', function () {
    var a = vpt('a'), an = v('qA', 0) * Math.PI / 180, L = v('qL', 0);
    addOps(withMirrors([pathFromDialog([{ x: a.x, y: a.y, b: 0 }, { x: r2(a.x + L * Math.cos(an)), y: r2(a.y + L * Math.sin(an)), b: 0 }], false)]));
  });
});
function arcDialog(kind) {
  var title = { c: 'Arco: inizio, fine, centro', r: 'Arco: inizio, fine, raggio', p: 'Arco: inizio, punto, fine' }[kind];
  var body = '<div class="grid2">' + ptField('a', 'Inizio', 100, 100) + '</div><div class="grid2">' + (kind === 'p' ? ptField('m', 'Punto intermedio', 200, 50) + '</div><div class="grid2">' : '') + ptField('b', 'Fine', 300, 100) + '</div>' +
    (kind === 'c' ? '<div class="grid2">' + ptField('c', 'Centro', 200, 100) + '</div>' : '') + '<div class="grid2">' + (kind === 'r' ? field('qR', 'Raggio', 150, { unit: 'mm' }) + field('qL2', 'Arco', 'short', { select: [['short', 'Più corto'], ['long', 'Più lungo']] }) : '') +
    (kind !== 'p' ? field('qDir', 'Verso', 'CCW', { select: [['CCW', 'Antiorario'], ['CW', 'Orario']] }) : '') + millFields() + corrField('C', true) + '</div>' + mirrorRow();
  dlg(title, body, 'OK', function () {
    var a = vpt('a'), b = vpt('b'), bul;
    if (kind === 'p') { bul = G.arc3Bulge(a, vpt('m'), b); if (bul == null) { toast('I tre punti sono allineati'); return false; } }
    else {
      var ccw = $('qDir').value === 'CCW', c;
      if (kind === 'c') { c = vpt('c'); if (Math.abs(Math.hypot(a.x - c.x, a.y - c.y) - Math.hypot(b.x - c.x, b.y - c.y)) > 0.05) { toast('Inizio e fine non sono alla stessa distanza dal centro'); return false; } }
      else {
        var R = Math.abs(v('qR', 0)), ch = Math.hypot(b.x - a.x, b.y - a.y); if (R < ch / 2 - 1e-6) { toast('Raggio troppo piccolo per questi due punti'); return false; }
        var h = Math.sqrt(Math.max(0, R * R - ch * ch / 4)), nx = -(b.y - a.y) / ch, ny = (b.x - a.x) / ch, sgn = (ccw ? 1 : -1) * ($('qL2').value === 'long' ? -1 : 1);
        c = { x: (a.x + b.x) / 2 + nx * h * sgn, y: (a.y + b.y) / 2 + ny * h * sgn };
      }
      bul = C.bulgeFromArc(Math.atan2(a.y - c.y, a.x - c.x), Math.atan2(b.y - c.y, b.x - c.x), ccw);
    }
    addOps(withMirrors([pathFromDialog([{ x: a.x, y: a.y, b: bul }, { x: b.x, y: b.y, b: 0 }], false)]));
  });
}
cmd('arcC', 'Arco: inizio, fine, centro…', function () { arcDialog('c'); });
cmd('arcR', 'Arco: inizio, fine, raggio…', function () { arcDialog('r'); });
cmd('arcP', 'Arco: inizio, punto, fine…', function () { arcDialog('p'); });
cmd('circleCR', 'Cerchio: centro, raggio…', function () {
  dlg('Cerchio: centro, raggio', '<div class="grid2">' + ptField('c', 'Centro', 200, 200) + '</div><div class="grid2">' + field('qR', 'Raggio', 50, { unit: 'mm' }) + millFields() + corrField() + '</div>' + mirrorRow(), 'OK', function () {
    var c = vpt('c'); addOps(withMirrors([pathFromDialog(C.circlePath(c.x, c.y, Math.abs(v('qR', 1))), true)]));
  });
});
cmd('circle3', 'Cerchio: 3 punti…', function () {
  dlg('Cerchio: 3 punti', '<div class="grid2">' + ptField('a', 'Punto 1', 100, 200) + '</div><div class="grid2">' + ptField('b', 'Punto 2', 200, 300) + '</div><div class="grid2">' + ptField('c', 'Punto 3', 300, 200) + '</div><div class="grid2">' + millFields() + corrField() + '</div>' + mirrorRow(), 'OK', function () {
    var cc = G.circle3(vpt('a'), vpt('b'), vpt('c')); if (!cc) { toast('I tre punti sono allineati'); return false; }
    addOps(withMirrors([pathFromDialog(C.circlePath(r2(cc.x), r2(cc.y), r2(cc.r)), true)]));
  });
});
cmd('rectNum', 'Rettangolo…', function () {
  dlg('Rettangolo', '<div class="grid2">' + ptField('a', 'Partenza', 100, 100) + '</div><div class="grid2">' + ptField('b', 'Arrivo', 300, 200) + '</div><div class="grid2">' + field('qR', 'Raggio raccordo', ui.def.radius, { unit: 'mm' }) + field('qDir', 'Direzione', 'CCW', { select: [['CCW', 'Antioraria'], ['CW', 'Oraria']] }) + millFields() + corrField() + '</div>' + mirrorRow(), 'OK', function () {
    var a = vpt('a'), b = vpt('b'), pts = C.rectPath(a.x, a.y, b.x, b.y, v('qR', 0)); if ($('qDir').value === 'CW') pts = C.reversePath(pts, true);
    addOps(withMirrors([pathFromDialog(pts, true)]));
  });
});
cmd('ellipse', 'Ellisse…', function () {
  dlg('Ellisse', '<div class="grid2">' + ptField('c', 'Centro', 300, 200) + '</div><div class="grid2">' + field('qA', 'Semiasse X', 150, { unit: 'mm' }) + field('qB', 'Semiasse Y', 80, { unit: 'mm' }) + field('qRot', 'Rotazione', 0, { unit: '°' }) + '<span></span>' + millFields() + corrField() + '</div>' + mirrorRow() +
    '<p class="note">L\'ellisse viene approssimata con 36 archi tangenti (errore sotto i 0,1 mm sulle misure comuni).</p>', 'OK', function () {
    var c = vpt('c'), a = Math.abs(v('qA', 1)), b = Math.abs(v('qB', 1)); if (!a || !b) { toast('Semiassi non validi'); return false; }
    addOps(withMirrors([pathFromDialog(G.ellipsePath(c.x, c.y, a, b, v('qRot', 0), 72), true)]));
  });
});
/* ---- Segui: prosegue la fresatura aperta selezionata ---- */
function followTarget() { var o = primary(); if (!o || o.type !== 'path' || o.closed) { toast('Seleziona una fresatura aperta da proseguire'); return null; } return o; }
function followDialog(kind) {
  var o = followTarget(); if (!o) return; var e = o.pts[o.pts.length - 1], prev = o.pts[o.pts.length - 2], t = C.tangentAt(prev, e, false);
  var titles = { rt: 'Segui: retta tangente', rp: 'Segui: retta punto finale', ra: 'Segui: retta angolo, lunghezza', at: 'Segui: arco tangente', ac: 'Segui: arco fine, centro', ar: 'Segui: arco fine, raggio' };
  var body = '<p class="note">Prosegue dalla fine della fresatura #' + (opIndex(o.id) + 1) + ' (X ' + C.f2(e.x) + ', Y ' + C.f2(e.y) + ').</p><div class="grid2">';
  if (kind === 'rt') body += field('qL', 'Lunghezza', 100, { unit: 'mm' }) + '</div>';
  else if (kind === 'ra') body += field('qA', 'Angolo', 0, { unit: '°' }) + field('qL', 'Lunghezza', 100, { unit: 'mm' }) + '</div>';
  else if (kind === 'rp' || kind === 'at') body += '</div><div class="grid2">' + ptField('b', 'Punto finale', e.x + 100, e.y) + '</div>';
  else if (kind === 'ac') body += '</div><div class="grid2">' + ptField('b', 'Fine', e.x + 100, e.y) + '</div><div class="grid2">' + ptField('c', 'Centro', e.x + 50, e.y) + '</div><div class="grid2">' + field('qDir', 'Verso', 'CCW', { select: [['CCW', 'Antiorario'], ['CW', 'Orario']] }) + '</div>';
  else if (kind === 'ar') body += '</div><div class="grid2">' + ptField('b', 'Fine', e.x + 100, e.y) + '</div><div class="grid2">' + field('qR', 'Raggio', 80, { unit: 'mm' }) + field('qDir', 'Verso', 'CCW', { select: [['CCW', 'Antiorario'], ['CW', 'Orario']] }) + '</div>';
  dlg(titles[kind], body, 'OK', function () {
    var nb, nbul = 0;
    if (kind === 'rt') { var L = v('qL', 0); nb = { x: e.x + t.x * L, y: e.y + t.y * L }; }
    else if (kind === 'ra') { var an = v('qA', 0) * Math.PI / 180, L2 = v('qL', 0); nb = { x: e.x + L2 * Math.cos(an), y: e.y + L2 * Math.sin(an) }; }
    else if (kind === 'rp') nb = vpt('b');
    else if (kind === 'at') { nb = vpt('b'); var ch = { x: nb.x - e.x, y: nb.y - e.y }, al = Math.atan2(t.x * ch.y - t.y * ch.x, t.x * ch.x + t.y * ch.y); nbul = Math.tan(al / 2); }
    else {
      nb = vpt('b'); var ccw = $('qDir').value === 'CCW', c;
      if (kind === 'ac') c = vpt('c');
      else { var R = Math.abs(v('qR', 0)), chl = Math.hypot(nb.x - e.x, nb.y - e.y); if (R < chl / 2) { toast('Raggio troppo piccolo'); return false; } var h = Math.sqrt(R * R - chl * chl / 4), nx = -(nb.y - e.y) / chl, ny = (nb.x - e.x) / chl, sg = ccw ? 1 : -1; c = { x: (e.x + nb.x) / 2 + nx * h * sg, y: (e.y + nb.y) / 2 + ny * h * sg }; }
      nbul = C.bulgeFromArc(Math.atan2(e.y - c.y, e.x - c.x), Math.atan2(nb.y - c.y, nb.x - c.x), ccw);
    }
    commit(); var i = opIndex(o.id); o = job.ops[i]; o.pts[o.pts.length - 1].b = nbul; o.pts.push({ x: r2(nb.x), y: r2(nb.y), b: 0 }); changed();
  });
}
['rt', 'rp', 'ra', 'at', 'ac', 'ar'].forEach(function (k) { cmd('follow_' + k, { rt: 'Retta tangente…', rp: 'Retta punto finale…', ra: 'Retta angolo, lunghezza…', at: 'Arco tangente…', ac: 'Arco fine, centro…', ar: 'Arco fine, raggio…' }[k], function () { followDialog(k); }); });

/* ---- Oggetti ---- */
cmd('scont', 'Scontornatura…', function () {
  dlg('Oggetti: Scontornatura', '<div class="grid2">' + field('qDist', 'Distanza dal bordo', 0, { unit: 'mm' }) + field('qR', 'Raggio di raccordo', 0, { unit: 'mm' }) + millFields(r2(job.panel.T + 1)) + field('qN', 'Passate in Z', 1) + field('qLi', 'Ingresso/uscita', 'arc', { select: [['none', 'Nessuno'], ['line', 'Retta tangente'], ['arc', 'Arco']] }) + field('qLl', 'Lunghezza ingresso', 20, { unit: 'mm' }) + '</div>' +
    chk('qComp', 'Correzione utensile automatica (percorso già spostato del raggio fresa)', false) +
    '<p class="note">Squadratura dell\'intero pannello. Senza correzione automatica il percorso è sul bordo e la macchina compensa all\'esterno; con la correzione il percorso è già spostato e la macchina lavora in asse.</p>', 'OK', function () {
    var t = C.toolByCode(job.tools, $('qT').value); if (!t) { toast('Scegli una fresa'); return false; }
    var comp = $('qComp').checked, pts = G.scontornatura(job.panel, v('qDist', 0), v('qR', 0), t.d, comp);
    if (comp) pts = G.offsetPath(pts, true, t.d / 2)[0] || pts;
    var lt = $('qLi').value, ll = v('qLl', 20);
    addOps([newPath(pts, true, { tool: t.code, depth: v('qP', 19), passes: Math.max(1, Math.round(v('qN', 1))), corr: comp ? 'C' : 'OUT', leadIn: { type: lt, len: ll }, leadOut: { type: lt, len: ll }, note: 'Scontornatura' })]);
  });
});
cmd('trim', 'Rifilatura perimetro', function () {
  if (job.ops.some(function (o) { return o.type === 'trim'; })) return toast('La rifilatura è già presente');
  var ft = C.toolByCode(job.tools, '44') ? '44' : (millTools()[0] || {}).code;
  addOps([{ type: 'trim', tool: ft, depth: r2(job.panel.T + 4), lead: 20, inset: 0, side: 'L', note: 'Rifilatura' }]);
});
function pocketDialog(shape) {
  var body = shape === 'circle' ? '<div class="grid2">' + ptField('c', 'Centro', 200, 200) + '</div><div class="grid2">' + field('qR', 'Raggio della tasca', 40, { unit: 'mm' }) + '<span></span>' :
    '<div class="grid2">' + ptField('a', 'Partenza', 100, 100) + '</div><div class="grid2">' + ptField('b', 'Arrivo', 200, 160) + '</div><div class="grid2">' + field('qR', 'Raggio di raccordo', ui.def.radius, { unit: 'mm' }) + '<span></span>';
  body += millFields() + field('qN', 'Passate in Z', 1) + field('qSo', 'Passo laterale', ui.def.stepover, { unit: '% Ø' }) + field('qDir', 'Direzione', ui.def.pocketDir, { select: [['CCW', 'Antioraria'], ['CW', 'Oraria']] }) + '</div>' + mirrorRow();
  dlg(shape === 'circle' ? 'Oggetti: Tasca circolare' : 'Oggetti: Tasca rettangolare', body, 'OK', function () {
    var base = { tool: $('qT').value, depth: v('qP', 5), passes: Math.max(1, Math.round(v('qN', 1))), stepover: v('qSo', 70), dir: $('qDir').value };
    if (shape === 'circle') { var c = vpt('c'); base = newPocket(Object.assign(base, { shape: 'circle', x: c.x, y: c.y, r: Math.abs(v('qR', 1)) })); }
    else { var a = vpt('a'), b = vpt('b'); base = newPocket(Object.assign(base, { shape: 'rect', x: Math.min(a.x, b.x), y: Math.min(a.y, b.y), x2: Math.max(a.x, b.x), y2: Math.max(a.y, b.y), radius: v('qR', 0) })); }
    var t = C.toolByCode(job.tools, base.tool); if (!t || !C.pocketContours(base, t.d).length) { toast('Tasca più piccola della fresa'); return false; }
    addOps(withMirrors([base]));
  });
}
cmd('pocketRect', 'Tasca rettangolare…', function () { pocketDialog('rect'); });
cmd('pocketCirc', 'Tasca circolare…', function () { pocketDialog('circle'); });
cmd('pocketGen', 'Tasca generica (da contorno selezionato)…', function () {
  var o = primary(); if (!o || o.type !== 'path' || !o.closed) return toast('Seleziona una fresatura chiusa: diventa il bordo della tasca');
  dlg('Oggetti: Tasca generica', '<div class="grid2">' + millFields() + field('qN', 'Passate in Z', 1) + field('qSo', 'Passo laterale', ui.def.stepover, { unit: '% Ø' }) + '</div>' + chk('qKeep', 'Mantieni anche il contorno come fresatura', false), 'OK', function () {
    var p = newPocket({ shape: 'poly', pts: clone(o.pts), tool: $('qT').value, depth: v('qP', 5), passes: Math.max(1, Math.round(v('qN', 1))), stepover: v('qSo', 70) });
    var t = C.toolByCode(job.tools, p.tool); if (!t || !C.pocketContours(p, t.d).length) { toast('Contorno più piccolo della fresa'); return false; }
    commit(); var i = opIndex(o.id); p.id = nextId++;
    if ($('qKeep').checked) job.ops.splice(i + 1, 0, p); else job.ops.splice(i, 1, p);
    ui.sel = [p.id]; changed();
  });
});
cmd('canali', 'Canali…', function () {
  dlg('Oggetti: Canali', '<div class="grid2">' + field('qDir', 'Direzione canali', 'X', { select: [['X', 'Paralleli a X'], ['Y', 'Paralleli a Y']] }) + field('qN', 'Numero canali', 5) + field('qSt', 'Primo canale a', 50, { unit: 'mm' }) + field('qS', 'Passo', 50, { unit: 'mm' }) +
    field('qM1', 'Margine iniziale', 0, { unit: 'mm' }) + field('qM2', 'Margine finale', 0, { unit: 'mm' }) + millFields(3) + '</div>' + chk('qAlt', 'Direzione alternata (meno rapidi)', true), 'OK', function () {
    var list = G.canali(job.panel, { dir: $('qDir').value, n: v('qN', 1), start: v('qSt', 0), step: v('qS', 10), m1: v('qM1', 0), m2: v('qM2', 0) }).map(function (pts, i) {
      if ($('qAlt').checked && i % 2) pts = C.reversePath(pts, false);
      return newPath(pts, false, { tool: $('qT').value, depth: v('qP', 3), corr: 'C' });
    });
    addOps(list);
  });
});
cmd('antina', 'Antina…', function () {
  dlg('Oggetti: Antina', '<div class="grid2">' + field('qDx', 'Distanza dai lati X', 60, { unit: 'mm' }) + field('qDy', 'Distanza dai lati Y', 60, { unit: 'mm' }) + field('qR', 'Raggio angoli', 20, { unit: 'mm' }) + field('qG', 'Distanza seconda cornice', 15, { unit: 'mm' }) + millFields(4) + '</div>' + chk('qD2', 'Seconda cornice interna', false), 'OK', function () {
    var list = G.antina(job.panel, { dx: v('qDx', 60), dy: v('qDy', 60), r: v('qR', 0), gap: v('qG', 15), double: $('qD2').checked }).map(function (pts) { return newPath(pts, true, { tool: $('qT').value, depth: v('qP', 4), corr: 'C', note: 'Antina' }); });
    addOps(list);
  });
});
/* ---- Blocchi ---- */
cmd('blockDef', 'Definisci blocco…', function () {
  var ops = needSel(1); if (!ops) return; var b0 = opStart(ops[0]);
  dlg('Blocco: Definisci', field('qN', 'Nome blocco', 'BLOCCO' + (Object.keys(job.blocks).length + 1), { wide: true, text: true }) + '<div class="grid2">' + ptField('b', 'Punto base', b0.x, b0.y) + '</div><p class="note">' + ops.length + ' entità selezionate. Il blocco resta nel disegno e si può inserire più volte.</p>', 'Definisci', function () {
    var bp = vpt('b'), n = $('qN').value.trim() || 'BLOCCO';
    job.blocks[n] = ops.reduce(function (acc, o) { var q = o.type === 'hole' && o.face !== 1 ? clone(o) : G.transformOp(o, G.moveF(-bp.x, -bp.y), false, job.panel); if (!q) return acc; (Array.isArray(q) ? q : [q]).forEach(function (z) { delete z.id; acc.push(z); }); return acc; }, []);
    persist(); toast('Blocco ' + n + ' definito');
  });
});
cmd('blockIns', 'Inserisci blocco…', function () {
  var names = Object.keys(job.blocks || {}); if (!names.length) return toast('Nessun blocco definito in questo disegno');
  dlg('Blocco: Inserisci', field('qN', 'Blocco', names[0], { wide: true, select: names.map(function (n) { return [n, n + ' (' + job.blocks[n].length + ' entità)']; }) }) + '<div class="grid2">' + ptField('p', 'Punto di inserimento', 100, 100) + '</div><div class="grid2">' + field('qA', 'Rotazione', 0, { unit: '°' }) + field('qS', 'Scala', 1) + '</div>', 'Inserisci', function () {
    var p = vpt('p'), a = v('qA', 0), k = v('qS', 1), out = [];
    job.blocks[$('qN').value].forEach(function (o) {
      if (o.type === 'hole' && o.face !== 1) { out.push(clone(o)); return; }
      var q = G.transformOp(o, G.scaleF(k, 0, 0), false); if (Array.isArray(q)) q = q[0];
      q = G.transformOp(q, G.rotF(a, 0, 0), false); (Array.isArray(q) ? q : [q]).forEach(function (z) { var w = G.transformOp(z, G.moveF(p.x, p.y), false); out = out.concat(Array.isArray(w) ? w : [w]); });
    });
    addOps(out.filter(Boolean));
  });
});

/* ---- Imposta ---- */
cmd('setDiam', 'Diametro / utensile…', function () {
  var ops = needSel(1); if (!ops) return;
  var holes = ops.filter(function (o) { return o.type === 'hole' || o.type === 'row'; }), mills = ops.filter(function (o) { return o.type === 'path' || o.type === 'pocket' || o.type === 'trim'; });
  dlg('Imposta: Diametro', (holes.length ? field('qD', 'Diametro fori (' + holes.length + ')', holes[0].d, { unit: 'mm', select: drillDiams() }) : '') + (mills.length ? field('qT', 'Fresa per fresature (' + mills.length + ')', mills[0].tool, { select: millOpts() }) : ''), 'Applica', function () {
    commit(); holes.forEach(function (o) { getOp(o.id).d = v('qD', o.d); }); mills.forEach(function (o) { getOp(o.id).tool = $('qT').value; }); changed();
  });
});
cmd('setDepth', 'Profondità…', function () {
  var ops = needSel(1); if (!ops) return;
  dlg('Imposta: Profondità', field('qP', 'Profondità per ' + ops.length + ' entità', ops[0].depth, { unit: 'mm' }) + chk('qClr', 'Togli le profondità per punto (interpolazione Z)', true), 'Applica', function () {
    commit(); ops.forEach(function (o) { var q = getOp(o.id); q.depth = v('qP', q.depth); if ($('qClr').checked && q.pts) q.pts.forEach(function (p) { delete p.p; }); }); changed();
  });
});
cmd('setInterpZ', 'Interpolazione Z…', function () {
  var o = primary(); if (!o || o.type !== 'path') return toast('Seleziona una fresatura');
  dlg('Imposta: Interpolazione Z', '<div class="grid2">' + field('qP1', 'Profondità partenza', o.pts[0].p != null ? o.pts[0].p : o.depth, { unit: 'mm' }) + field('qP2', 'Profondità arrivo', o.pts[o.pts.length - 1].p != null ? o.pts[o.pts.length - 1].p : o.depth, { unit: 'mm' }) + '</div>' +
    field('qProf', 'Profilo', 'lin', { select: [['lin', 'Lineare'], ['circ', 'Circolare (raccordato)']] }) + '<p class="note">La profondità varia lungo il percorso in proporzione alla distanza percorsa. Ogni tratto termina alla profondità calcolata (<code>P</code> di ogni G101).</p>', 'Applica', function () {
    var p1 = v('qP1', o.depth), p2 = v('qP2', o.depth), circ = $('qProf').value === 'circ', tot = C.pathLength(o.pts, false), acc = 0;
    commit(); var q = getOp(o.id);
    q.pts.forEach(function (p, k) {
      if (k > 0) { var a = q.pts[k - 1], arc = C.arcFromBulge(a, p, a.b || 0); acc += arc ? Math.abs(4 * Math.atan(a.b)) * arc.r : Math.hypot(p.x - a.x, p.y - a.y); }
      var t = tot ? acc / tot : 0; if (circ) t = (1 - Math.cos(t * Math.PI)) / 2; p.p = r2(p1 + (p2 - p1) * t);
    });
    q.depth = Math.max(p1, p2); changed();
  });
});
cmd('setDirGlobal', 'Direzione globale…', function () {
  dlg('Imposta: Direzione globale', field('qDir', 'Verso per tutte le fresature chiuse', 'CCW', { select: [['CCW', 'Antiorario'], ['CW', 'Orario']] }), 'Applica', function () {
    var want = $('qDir').value === 'CCW', n = 0; commit();
    job.ops.forEach(function (o) { if (o.type === 'path' && o.closed && (C.signedArea(o.pts) > 0) !== want) { o.pts = C.reversePath(o.pts, true); n++; } if (o.type === 'pocket') o.dir = want ? 'CCW' : 'CW'; });
    changed(); toast('Invertite ' + n + ' fresature');
  });
});
cmd('setCorr', 'Correzione utensile…', function () {
  var ops = needSel(1, ['path']); if (!ops) return;
  dlg('Imposta: Correzione', corrField(ops[0].corr), 'Applica', function () { commit(); ops.forEach(function (o) { getOp(o.id).corr = $('qC').value; }); changed(); });
});

/* ---- Modifica ---- */
cmd('del', 'Cancella', function () { var ops = needSel(1); if (!ops) return; commit(); job.ops = job.ops.filter(function (o) { return ui.sel.indexOf(o.id) < 0; }); var n = ui.sel.length; ui.sel = []; changed(); toast('Cancellate ' + n + ' entità'); });
cmd('copy', 'Copia…', function () {
  if (!needSel(1)) return; var b0 = opStart(selOps()[0]);
  dlg('Modifica: Copia', '<div class="grid2">' + ptField('a', 'Punto base', b0.x, b0.y) + '</div><div class="grid2">' + ptField('b', 'Punto di destinazione', b0.x + 100, b0.y) + '</div>' + field('qN', 'Numero di copie', 1), 'Copia', function () {
    var a = vpt('a'), b = vpt('b'), n = Math.max(1, Math.round(v('qN', 1))), base = ui.sel.slice(), all = [];
    for (var i = 1; i <= n; i++) { ui.sel = base.slice(); transformSel(G.moveF((b.x - a.x) * i, (b.y - a.y) * i), false, true, 'move', { dx: (b.x - a.x) * i, dy: (b.y - a.y) * i }); all = all.concat(ui.sel); }
    ui.sel = all; refresh();
  });
});
cmd('move', 'Muovi…', function () {
  if (!needSel(1)) return; var b0 = opStart(selOps()[0]);
  dlg('Modifica: Muovi', '<div class="grid2">' + ptField('a', 'Punto base', b0.x, b0.y) + '</div><div class="grid2">' + ptField('b', 'Punto di destinazione', b0.x + 50, b0.y) + '</div>', 'Muovi', function () {
    var a = vpt('a'), b = vpt('b'); transformSel(G.moveF(b.x - a.x, b.y - a.y), false, false, 'move', { dx: b.x - a.x, dy: b.y - a.y });
  });
});
cmd('rotate', 'Ruota…', function () {
  if (!needSel(1)) return; var b0 = opStart(selOps()[0]);
  dlg('Modifica: Ruota', '<div class="grid2">' + ptField('c', 'Centro di rotazione', b0.x, b0.y) + '</div><div class="grid2">' + field('qA', 'Angolo', 90, { unit: '° antiorario' }) + '</div>' + chk('qCp', 'Mantieni l\'originale (copia ruotata)', false) +
    '<p class="note">I fori sui fianchi non ruotano. Una barriera ruotata fuori dai 90° diventa fori singoli; una tasca rettangolare diventa tasca generica.</p>', 'Ruota', function () {
    var c = vpt('c'); transformSel(G.rotF(v('qA', 0), c.x, c.y), false, $('qCp').checked);
  });
});
cmd('mirror', 'Specchia…', function () {
  if (!needSel(1)) return; var P = job.panel;
  dlg('Modifica: Specchia', field('qAx', 'Rispetto a', 'X', { wide: true, select: [['X', 'Asse verticale al centro del pannello (specchia in X)'], ['Y', 'Asse orizzontale al centro del pannello (specchia in Y)'], ['L', 'Retta per due punti']] }) +
    '<div class="grid2">' + ptField('a', 'Punto 1', P.L / 2, 0) + '</div><div class="grid2">' + ptField('b', 'Punto 2', P.L / 2, P.W) + '</div>' + chk('qCp', 'Mantieni l\'originale', true), 'Specchia', function () {
    var ax = $('qAx').value, cp = $('qCp').checked;
    if (ax === 'L') { var a = vpt('a'), b = vpt('b'); if (Math.hypot(b.x - a.x, b.y - a.y) < 1e-6) { toast('I due punti coincidono'); return false; } transformSel(G.mirrorLineF(a, b), true, cp); }
    else transformSel(G.mirrorF(ax, ax === 'X' ? P.L / 2 : P.W / 2), true, cp, 'mirror', { axis: ax, v: ax === 'X' ? P.L / 2 : P.W / 2 });
  });
});
cmd('oppose', 'Opponi', function () {
  if (!needSel(1)) return; var P = job.panel; transformSel(G.rotF(180, P.L / 2, P.W / 2), false, true); toast('Copia opposta rispetto al centro del pannello');
});
cmd('scale', 'Scala…', function () {
  if (!needSel(1)) return; var b0 = opStart(selOps()[0]);
  dlg('Modifica: Scala', '<div class="grid2">' + ptField('c', 'Punto base', b0.x, b0.y) + '</div>' + field('qK', 'Fattore di scala', 1) + '<p class="note">Scala le posizioni e le dimensioni dei percorsi e delle tasche; i diametri dei fori restano uguali.</p>', 'Scala', function () {
    var c = vpt('c'), k = v('qK', 1); if (!(k > 0)) { toast('Fattore non valido'); return false; }
    commit(); selOps().forEach(function (s) { var i = opIndex(s.id), o = G.transformOp(s, G.scaleF(k, c.x, c.y), false, job.panel); if (!o) return; o = Array.isArray(o) ? o[0] : o; if (o.type === 'pocket' && o.shape === 'circle') o.r = r2(o.r * k); if (o.type === 'pocket' && o.radius) o.radius = r2(o.radius * k); if (o.type === 'row') o.step = r2(o.step * k); o.id = s.id; job.ops[i] = o; }); changed();
  });
});
cmd('series', 'Serie…', function () {
  if (!needSel(1)) return;
  dlg('Modifica: Serie', '<div class="grid2">' + field('aNx', 'Copie in X', 2) + field('aSx', 'Passo X', 100, { unit: 'mm' }) + field('aNy', 'Copie in Y', 1) + field('aSy', 'Passo Y', 100, { unit: 'mm' }) + '</div><p class="note">Il numero comprende l\'originale.</p>', 'Crea', function () {
    var nx = Math.max(1, Math.round(v('aNx', 1))), ny = Math.max(1, Math.round(v('aNy', 1))), dx = v('aSx', 0), dy = v('aSy', 0), base = ui.sel.slice(), all = base.slice();
    if (nx * ny > 400) { toast('Massimo 400 copie'); return false; }
    for (var j = 0; j < ny; j++) for (var i = 0; i < nx; i++) { if (!i && !j) continue; ui.sel = base.slice(); transformSel(G.moveF(i * dx, j * dy), false, true, 'move', { dx: i * dx, dy: j * dy }); all = all.concat(ui.sel); }
    ui.sel = all; refresh();
  });
});
cmd('panelEdit', 'Pannello…', function () {
  var P = job.panel;
  dlg('Modifica: Pannello', '<div class="grid3">' + field('qL', 'Dimensione X', P.L, { unit: 'mm' }) + field('qW', 'Dimensione Y', P.W, { unit: 'mm' }) + field('qT', 'Dimensione Z', P.T, { unit: 'mm' }) + '</div>' +
    field('qAn', 'Le lavorazioni restano riferite a', 'BL', { wide: true, select: [['BL', 'Spigolo in basso a sinistra (origine)'], ['C', 'Centro del pannello'], ['TR', 'Spigolo in alto a destra']] }), 'Applica', function () {
    var L = v('qL', P.L), Wd = v('qW', P.W), dx = 0, dy = 0, an = $('qAn').value;
    if (an === 'C') { dx = (L - P.L) / 2; dy = (Wd - P.W) / 2; } else if (an === 'TR') { dx = L - P.L; dy = Wd - P.W; }
    commit(); var ids = ui.sel; ui.sel = job.ops.map(function (o) { return o.id; });
    if (dx || dy) { var save = hist.length; transformSel(G.moveF(dx, dy), false, false, 'move', { dx: dx, dy: dy }); hist.length = save; }
    ui.sel = ids; job.panel = { L: L, W: Wd, T: v('qT', P.T) }; changed(); fitPanel();
  });
});
cmd('entity', 'Entità (modifica dati)', function () { if (!needSel(1)) return; focusPane(); });

/* ---- Strumenti ---- */
cmd('origin', 'Cambio origine…', function () {
  dlg('Strumenti: Cambio origine', '<div class="grid2">' + ptField('o', 'Nuova origine', ui.origin.x, ui.origin.y) + '</div><p class="note">Le quote dei dialoghi e la riga di stato diventano relative a questo punto (assi paralleli a quelli macchina). Il programma generato resta riferito all\'origine del pannello.</p><div class="row"><button class="btn small" id="oRes">Origine pannello</button></div>', 'Imposta', function () {
    var o = { x: v('ox', 0) + ui.origin.x, y: v('oy', 0) + ui.origin.y }; ui.origin = { x: r2(o.x), y: r2(o.y) }; draw(); toast('Origine in ' + C.f2(ui.origin.x) + ', ' + C.f2(ui.origin.y));
  });
  $('oRes').onclick = function () { ui.origin = { x: 0, y: 0 }; closeModal(); draw(); toast('Origine riportata sullo spigolo del pannello'); };
});
function vertexTool(chamfer) {
  dlg(chamfer ? 'Strumenti: Smusso' : 'Strumenti: Raccordo', field('qR', chamfer ? 'Distanza smusso' : 'Raggio', 10, { unit: 'mm' }) + '<p class="note">Dopo OK clicca sui vertici da ' + (chamfer ? 'smussare' : 'raccordare') + ' (spigoli tra due tratti rettilinei). Esc per finire.</p>', 'Scegli vertici', function () {
    var R = v('qR', 0); if (!(R > 0)) { toast('Valore non valido'); return false; }
    setTimeout(function () {
      var loop = function () { pickVertex((chamfer ? 'Smusso ' : 'Raccordo R') + R + ': clic su un vertice', function (hv) { var res = G.filletAt(hv.op, hv.k, R, chamfer); if (res.err) { toast(res.err); return; } commit(); var i = opIndex(hv.op.id); res.op.id = hv.op.id; job.ops[i] = res.op; changed(); loop(); }); };
      loop();
    }, 0);
  });
}
cmd('fillet', 'Raccordo…', function () { vertexTool(false); });
cmd('chamfer', 'Smusso…', function () { vertexTool(true); });
cmd('offset', 'Offset…', function () {
  var ops = needSel(1, ['path']); if (!ops) return;
  dlg('Strumenti: Offset', field('qD', 'Distanza', 10, { unit: 'mm' }) + field('qS', 'Lato', 'out', { select: [['out', 'Esterno (o a sinistra se aperta)'], ['in', 'Interno (o a destra se aperta)'], ['both', 'Entrambi']] }) + '<p class="note">Il nuovo percorso è approssimato con tratti rettilinei fitti negli archi.</p>', 'Crea', function () {
    var d = Math.abs(v('qD', 0)), side = $('qS').value, out = [];
    ops.forEach(function (o) {
      var sides = side === 'both' ? [1, -1] : [side === 'out' ? 1 : -1];
      sides.forEach(function (sg) {
        var dd = d * sg; if (o.closed && C.signedArea(o.pts) < 0) dd = -dd;
        G.offsetPath(o.pts, o.closed, o.closed ? dd : d).forEach(function (pts) { if (!o.closed && sg < 0) return; var c = clone(o); delete c.id; c.pts = pts; c.closed = true; if (!o.closed) c.corr = 'C'; out.push(c); });
      });
    });
    if (!out.length) { toast('Offset impossibile con questa distanza'); return false; }
    addOps(out);
  });
});
cmd('gridSet', 'Griglia…', function () {
  dlg('Strumenti: Griglia', field('qG', 'Passo griglia', ui.grid, { unit: 'mm', select: [[0.5, '0,5'], [1, '1'], [2, '2'], [5, '5'], [10, '10'], [16, '16'], [32, '32'], [50, '50']] }) + chk('qSn', 'Aggancio alla griglia', ui.snap), 'OK', function () { ui.grid = v('qG', 5); ui.snap = $('qSn').checked; updToggles(); draw(); });
});
cmd('gridSnap', 'Aggancio griglia on/off', function () { ui.snap = !ui.snap; updToggles(); toast('Aggancio griglia ' + (ui.snap ? 'attivo' : 'disattivo')); });
cmd('osnap', 'Osnap on/off', function () { ui.osnap = !ui.osnap; updToggles(); toast('Osnap ' + (ui.osnap ? 'attivo' : 'disattivo')); });
cmd('distance', 'Distanza', function () {
  pickPoint('Distanza: indica il primo punto', function (a) {
    pickPoint('Distanza: indica il secondo punto', function (b) {
      var d = Math.hypot(b.x - a.x, b.y - a.y), ang = Math.atan2(b.y - a.y, b.x - a.x) * 180 / Math.PI;
      setPrompt('Distanza ' + C.f2(d) + ' mm · ΔX ' + C.f2(b.x - a.x) + ' · ΔY ' + C.f2(b.y - a.y) + ' · angolo ' + C.f2(ang) + '°'); toast('Distanza ' + C.f2(d) + ' mm');
    }, a);
  });
});
cmd('undo', 'Annulla', undo);
cmd('redo', 'Ripristina', redo);

/* ---- Percorso ---- */
cmd('cutsew', 'Taglia e cuci', function () {
  var ops = selOps().filter(function (o) { return o.type === 'path' && !o.closed; });
  if (ops.length === 2) { var r = G.joinTwo(ops[0], ops[1], 0.05); if (!r) return toast('Le due fresature non hanno estremi in comune'); commit(); var i = opIndex(ops[0].id); r.id = ops[0].id; job.ops[i] = r; job.ops = job.ops.filter(function (o) { return o.id !== ops[1].id; }); ui.sel = [r.id]; changed(); return toast('Fresature unite'); }
  pickVertex('Taglia e cuci: clic sul vertice dove tagliare la fresatura (o seleziona due fresature aperte e ripeti per unirle)', function (hv) {
    var parts = G.splitAt(hv.op, hv.k); commit(); var i = opIndex(hv.op.id); parts[0].id = hv.op.id; if (parts[1]) parts[1].id = nextId++;
    job.ops.splice.apply(job.ops, [i, 1].concat(parts)); ui.pick = null; ui.sel = parts.map(function (p) { return p.id; }); changed(); setPrompt(''); toast(parts.length > 1 ? 'Fresatura divisa in due' : 'Contorno aperto in quel punto');
  });
});
cmd('autojoin', 'Auto unisci', function () {
  var pool = (ui.sel.length ? selOps() : job.ops).filter(function (o) { return o.type === 'path' && !o.closed; });
  if (pool.length < 2) return toast('Servono almeno due fresature aperte');
  var r = G.autoJoin(pool); if (!r.joins) return toast('Nessun estremo in comune da unire');
  commit(); var ids = pool.map(function (o) { return o.id; }), at = opIndex(ids[0]);
  job.ops = job.ops.filter(function (o) { return ids.indexOf(o.id) < 0; });
  r.paths.forEach(function (p) { p.id = nextId++; }); job.ops.splice.apply(job.ops, [Math.min(at, job.ops.length), 0].concat(r.paths));
  ui.sel = r.paths.map(function (p) { return p.id; }); changed(); toast(r.joins + ' unioni, ' + r.paths.length + ' fresature risultanti');
});
cmd('round', 'Arrotonda…', function () {
  var ops = needSel(1, ['path']); if (!ops) return;
  dlg('Percorso: Arrotonda', field('qR', 'Raggio su tutti gli spigoli', 5, { unit: 'mm' }), 'Applica', function () {
    var R = v('qR', 0), tot = 0; commit(); ops.forEach(function (o) { var r = G.roundAll(o, R); tot += r.n; var i = opIndex(o.id); r.op.id = o.id; job.ops[i] = r.op; }); changed(); toast('Raccordati ' + tot + ' spigoli');
  });
});
cmd('reverse', 'Inverti direzione', function () {
  var ops = needSel(1, ['path', 'pocket']); if (!ops) return; commit();
  ops.forEach(function (o) { var q = getOp(o.id); if (q.type === 'path') q.pts = C.reversePath(q.pts, q.closed); else q.dir = q.dir === 'CW' ? 'CCW' : 'CW'; }); changed(true); toast('Direzione invertita');
});

/* ---- Informazioni ---- */
function stats() {
  var s = { holesV: 0, holesH: 0, paths: 0, pockets: 0, len: 0 };
  job.ops.forEach(function (o) { if (o.type === 'hole') { if (o.face === 1) s.holesV++; else s.holesH++; } else if (o.type === 'row') s.holesV += o.n; else if (o.type === 'path') { s.paths++; s.len += C.pathLength(o.pts, o.closed) * (o.passes || 1); } else if (o.type === 'pocket') s.pockets++; else if (o.type === 'trim') { s.paths++; s.len += 2 * (job.panel.L + job.panel.W); } });
  return s;
}
cmd('infoPanel', 'Pannello', function () {
  var P = job.panel, s = stats();
  dlg('Informazioni: Pannello', '<div class="kv"><span>Disegno</span><span>' + esc(job.name) + '</span><span>Commento</span><span>' + esc(job.comment || '—') + '</span><span>Dimensioni</span><span>' + C.f2(P.L) + ' × ' + C.f2(P.W) + ' × ' + C.f2(P.T) + '</span><span>Fori verticali</span><span>' + s.holesV + '</span><span>Fori orizzontali</span><span>' + s.holesH + '</span><span>Fresature</span><span>' + s.paths + ' (' + C.f2(s.len / 1000) + ' m)</span><span>Tasche</span><span>' + s.pockets + '</span><span>Tempo stimato</span><span>' + fmtTime(C.estimateTime(job)) + '</span></div>', 'Chiudi', function () {});
});
cmd('infoEntity', 'Entità', function () { if (!needSel(1)) return; focusPane(); });
cmd('infoState', 'Stato', function () {
  var iss = C.validate(job);
  dlg('Informazioni: Stato', '<div class="kv"><span>Semaforo</span><span>' + (job.optimized ? 'Verde: disegno ottimizzato' : 'Rosso: da ottimizzare (Elabora → Ottimizza)') + '</span><span>Controlli</span><span>' + (iss.length ? iss.length + ' segnalazioni' : 'Nessun problema') + '</span><span>Osnap</span><span>' + (ui.osnap ? 'attivo' : 'disattivo') + '</span><span>Griglia</span><span>' + ui.grid + ' mm, aggancio ' + (ui.snap ? 'attivo' : 'disattivo') + '</span><span>Origine</span><span>' + C.f2(ui.origin.x) + ', ' + C.f2(ui.origin.y) + '</span><span>Attrezzaggio</span><span>' + esc(job.settings.attrezzaggio) + ' · ' + job.tools.length + ' utensili</span></div>', 'Chiudi', function () {});
});

/* ---- CAM ---- */
cmd('optimize', 'Ottimizza', function () { commit(); job.unopt = job.ops.map(function (o) { return o.id; }); job.ops = C.autoOrder(job.ops); job.optimized = true; dirty = true; persist(); refresh(); toast('Percorsi e discese ottimizzati · tempo ' + fmtTime(C.estimateTime(job))); });
cmd('deoptimize', 'Deottimizza', function () {
  if (!job.unopt) return toast('Nessun ordine precedente da ripristinare'); commit();
  var map = {}; job.ops.forEach(function (o) { map[o.id] = o; }); var res = job.unopt.map(function (id) { return map[id]; }).filter(Boolean);
  job.ops.forEach(function (o) { if (res.indexOf(o) < 0) res.push(o); }); job.ops = res; job.optimized = false; delete job.unopt; changed(); toast('Ordine di disegno ripristinato');
});
cmd('genPP', 'Genera Part Program', function () { showCode(); });
cmd('originProg', 'Origine programma…', function () {
  var S = job.settings, bat = [['A', 'A'], ['B', 'B'], ['C', 'C'], ['D', 'D'], ['AD', 'AD (pannelli lunghi)']];
  if (!bat.some(function (b) { return b[0] === S.battuta; })) bat.push([S.battuta, S.battuta]);
  dlg('Elabora: Origine programma', '<div class="grid2">' + field('qE', 'Battuta (campo E)', S.battuta, { select: bat }) + field('qAt', 'Attrezzaggio (T)', S.attrezzaggio, { text: true }) + '</div><div class="kv"><span>Controsagome U · V · W</span><span>0.00 · 0.00 · 0.00 (si impostano a bordo macchina)</span></div>' +
    '<p class="note">Valori dell\'intestazione G200. Le controsagome (U, V, W) escono sempre a zero in ogni part-program.</p>' + supportsHtml(), 'Applica', function () {
    commit(); S.battuta = $('qE').value; S.attrezzaggio = $('qAt').value.replace(/"/g, '').trim() || 'DEF'; readSupports(); changed(true);
  }, true);
  bindSupports();
});
function supportsHtml() {
  var rows = (job.supports || []).map(function (p, i) {
    return '<tr><td><select data-s="' + i + '" data-c="p">' + [1, 2, 3, 4, 5, 6].map(function (n) { return '<option' + (n === +p.p ? ' selected' : '') + '>' + n + '</option>'; }).join('') + '</select></td>' +
      ['x', 'a', 'b', 'c'].map(function (k) { return '<td><input data-s="' + i + '" data-c="' + k + '" value="' + (p[k] == null ? '' : p[k]) + '"></td>'; }).join('') + '<td><button class="x" data-sdel="' + i + '" type="button">×</button></td></tr>';
  }).join('');
  return '<h3>Piani e ventose (G250)</h3><div class="tt-wrap"><table class="tt"><thead><tr><th>Piano</th><th>X</th><th>Vent. A</th><th>Vent. B</th><th>Vent. C</th><th></th></tr></thead><tbody id="supT">' + rows + '</tbody></table></div><div class="row"><button class="btn small" type="button" id="sAdd">Aggiungi piano</button></div><p class="note">Corse: piani 1-3 tra 15 e 1360, piani 4-6 tra 1476 e 2890; ventose da −1205 a −25.</p>';
}
var supDraft = null;
function bindSupports() {
  supDraft = clone(job.supports || []);
  function redraw() { var t = $('supT'); if (!t) return; var tmp = job.supports; job.supports = supDraft; var h = supportsHtml(); job.supports = tmp; var d = document.createElement('div'); d.innerHTML = h; t.innerHTML = d.querySelector('#supT').innerHTML; }
  $('sAdd').onclick = function () { var n = (supDraft.length % 6) + 1; supDraft.push({ p: n, x: C.SUPPORT_LIMITS[n - 1][0], a: '', b: '', c: '' }); redraw(); };
  $('supT').addEventListener('change', function (e) { var t = e.target; if (!t.dataset.c) return; var sp = supDraft[+t.dataset.s]; sp[t.dataset.c] = t.dataset.c === 'p' ? +t.value : (t.value.trim() === '' ? '' : num(t.value, sp[t.dataset.c])); });
  $('supT').addEventListener('click', function (e) { var b = e.target.closest('[data-sdel]'); if (!b) return; supDraft.splice(+b.dataset.sdel, 1); redraw(); });
}
function readSupports() { if (supDraft) job.supports = supDraft; supDraft = null; }
cmd('leadIn', 'Ingresso…', function () { leadDialog('leadIn', 'Ingresso'); });
cmd('leadOut', 'Uscita…', function () { leadDialog('leadOut', 'Uscita'); });
function leadDialog(key, name) {
  var ops = needSel(1, ['path']); if (!ops) return; var cur = ops[0][key] || {};
  dlg('Lavorazioni: ' + name, field('qT', 'Tipo', cur.type || 'none', { select: [['none', 'Nessuno'], ['line', 'Retta tangente'], ['arc', 'Quarto d\'arco tangente']] }) + field('qL', 'Lunghezza / raggio', cur.len || 15, { unit: 'mm' }) + '<p class="note">Applicato a ' + ops.length + ' fresature. L\'arco è sul lato della correzione utensile.</p>', 'Applica', function () {
    commit(); ops.forEach(function (o) { getOp(o.id)[key] = { type: $('qT').value, len: v('qL', 15) }; }); changed();
  });
}
cmd('forature', 'Forature…', function () {
  var rows = job.ops.map(function (o, i) {
    if (o.type !== 'hole' && o.type !== 'row') return '';
    var t = C.findDrill(job.tools, o.d, o.type === 'hole' ? o.face : 1);
    return '<tr><td>' + (i + 1) + '</td><td>' + (o.type === 'row' ? 'Barriera ' + o.n : o.face === 1 ? 'Verticale' : 'Fianco ' + o.face) + '</td><td>Ø' + o.d + '</td><td>' + o.depth + '</td><td>' + (t ? '<b>' + esc(t.code) + '</b>' : '<span style="color:var(--err)">nessuna punta</span>') + '</td></tr>';
  }).join('');
  dlg('Lavorazioni: Forature', rows ? '<div class="tt-wrap"><table class="tt"><thead><tr><th>#</th><th>Tipo</th><th>Diametro</th><th>Prof.</th><th>Utensile</th></tr></thead><tbody>' + rows + '</tbody></table></div><p class="note">L\'utensile si assegna in automatico per diametro (e faccia per gli orizzontali). Per cambiarlo modifica il diametro o l\'attrezzaggio.</p>' : '<p>Nessuna foratura nel disegno.</p>', 'Chiudi', function () {}, true);
});
cmd('fresature', 'Fresature…', function () {
  var ops = needSel(1, ['path', 'pocket', 'trim']); if (!ops) return; var o = ops[0], t = toolOf(o);
  dlg('Lavorazioni: Fresature', '<div class="grid2">' + field('qT', 'Utensile', o.tool, { select: millOpts() }) + field('qN', 'Passate in Z', o.passes || 1) + field('qFi', 'Velocità di entrata', o.feedIn || '', { unit: 'mm/min', ph: t ? t.feedIn || job.settings.millFeedIn : '' }) + field('qF', 'Velocità di lavoro', o.feed || '', { unit: 'mm/min', ph: t ? t.feed : '' }) + field('qS', 'Giri', o.rpm || '', { unit: 'g/min', ph: t ? t.rpm : '' }) + '</div><p class="note">Applicato a ' + ops.length + ' entità. Campi vuoti: valori della tabella utensili.</p>', 'Applica', function () {
    commit(); ops.forEach(function (q) { var x = getOp(q.id); x.tool = $('qT').value; if (x.type !== 'trim') x.passes = Math.max(1, Math.round(v('qN', 1))); ['qFi:feedIn', 'qF:feed', 'qS:rpm'].forEach(function (pq) { var a = pq.split(':'), val = $(a[0]).value.trim(); if (val === '') delete x[a[1]]; else x[a[1]] = num(val, undefined); }); }); changed();
  });
});
cmd('sequences', 'Sequenze', function () { setEnv('cam'); toast('Ordine di esecuzione nell\'area a destra: seleziona e usa Su / Giù'); });
cmd('animate', 'Animazione', function () { startAnim(); });
cmd('camView', 'Visualizzazione…', function () {
  dlg('Opzioni: Visualizzazione', chk('qW', 'Larghezza utensile sulle fresature', ui.camShow.widths) + chk('qR', 'Spostamenti tra le lavorazioni', ui.camShow.rapids) + chk('qN', 'Numero d\'ordine', ui.camShow.numbers), 'OK', function () { ui.camShow = { widths: $('qW').checked, rapids: $('qR').checked, numbers: $('qN').checked }; draw(); });
});
cmd('toolsEdit', 'Attrezzaggio: Edit…', function () { toolsDialog(); });
cmd('machImport', 'Attrezzaggio: Import dalla macchina…', function () {
  dlg('Attrezzaggio: Import', '<p>Seleziona insieme questi file della macchina (cartella <code>C:\\Dati</code> e <code>Def.TLD</code>), come chiede la procedura di import di Task:</p><p class="note"><code>Def.TLD</code>, <code>pheads.par</code>, <code>TOOLS.par</code>, <code>ExtTools.par</code></p><p class="note">Nel tuo disco clonato si trovano in <code>KWARA 95\\Dati</code> e <code>KWARA 95\\Utente</code>.</p>', 'Scegli i file', function () { $('fMach').click(); });
});
cmd('configView', 'Configurazione: Visualizza', function () {
  var S = job.settings;
  dlg('Configurazione macchina', '<div class="kv"><span>Configurazione</span><span>T99LKVA (Task 5.2, Morbidelli)</span><span>Controllo</span><span>ESA/GV Kvara, PLC 19902051</span><span>Testa verticale</span><span>10 mandrini, passo 32</span><span>Orizzontali</span><span>58-61 sulle facce 4, 5, 2, 3</span><span>Elettromandrino</span><span>44, 45 · utensili esterni 100-104</span><span>Lame</span><span>80, 81</span><span>Piani</span><span>6 piani, 3 ventose ciascuno</span><span>Battute</span><span>A (X 0), B (X 1440,4 speculare), C (X 1460,5), D (X 2902,15 speculare)</span><span>Rapidi</span><span>40 m/min</span><span>Origine programma</span><span>battuta ' + esc(S.battuta) + ' · controsagome a zero</span></div><p class="note">Dati letti dalla cartella Dati del disco clonato.</p>', 'Chiudi', function () {});
});
cmd('defaults', 'Utilità: Default…', function () {
  var S = job.settings;
  dlg('Default', '<div class="grid2">' + field('qDF', 'Velocità foratura', S.drillFeed, { unit: 'mm/min' }) + field('qDS', 'Giri foratura', S.drillRpm, { unit: 'g/min' }) + field('qMFi', 'Entrata fresa', S.millFeedIn, { unit: 'mm/min' }) + field('qMF', 'Fresatura', S.millFeed, { unit: 'mm/min' }) + field('qMS', 'Giri fresa', S.millRpm, { unit: 'g/min' }) + '</div>' +
    chk('qFlip', 'Asse Y invertito in macchina (giro antiorario + G142 = taglio esterno): da confermare con la prova in aria', S.sideFlip !== false), 'OK', function () {
    commit(); S.drillFeed = v('qDF', 2000); S.drillRpm = v('qDS', 4000); S.millFeedIn = v('qMFi', 4000); S.millFeed = v('qMF', 5000); S.millRpm = v('qMS', 18000); S.sideFlip = $('qFlip').checked; changed(true);
  });
});
cmd('about', 'Informazioni su CAM Tech 99L', function () {
  dlg('CAM Tech 99L', '<p>Programmazione della SCM Tech 99L con controllo Kvara. Ricostruisce l\'organizzazione di Task (Supervisore, CAD, CAM) e genera i file <code>.PRG</code> nello stesso formato di quelli in <code>C:\\Utente</code> della macchina.</p><p class="note">Gamma Arredi S.r.l. · versione 0.4 · bozza: ogni programma va verificato sull\'anteprima della macchina e in aria prima della produzione.</p><h3>Tasti</h3><p class="note"><code>V</code> selezione · <code>F</code> foro · <code>L</code> barriera · <code>P</code> fresatura · <code>R</code> rettangolo · <code>C</code> cerchio · <code>T</code> tasca · <code>Q</code> rifilatura · <code>W</code> zoom finestra · <code>0</code> zoom faccia · <code>E</code> estensione · <code>O</code> osnap · <code>G</code> griglia · <code>Canc</code> cancella · <code>Ctrl+A</code> seleziona tutto · <code>Ctrl+D</code> copia · <code>Ctrl+Z/Y</code> annulla/ripristina · <code>Ctrl+S</code> salva · Spazio+trascina pan</p>', 'Chiudi', function () {});
});
/* ---- archivio (Supervisore) ---- */
function archSelName() { return ui.archSel && archive[ui.archSel] ? ui.archSel : null; }
cmd('arcCopy', 'Copia disegno…', function () { var n = archSelName(); if (!n) return toast('Seleziona un disegno in archivio'); dlg('Copia disegno', field('qN', 'Nome della copia', n + '_COPIA', { wide: true, text: true }), 'Copia', function () { var m = C.progName({ progName: $('qN').value }); if (archive[m]) { toast('Esiste già'); return false; } archive[m] = clone(archive[n]); archive[m].job.name = m; archive[m].job.settings.progName = m; archive[m].date = new Date().toISOString(); saveArchive(); ui.archSel = m; refresh(); }); });
cmd('arcRename', 'Rinomina disegno…', function () { var n = archSelName(); if (!n) return toast('Seleziona un disegno in archivio'); dlg('Rinomina disegno', field('qN', 'Nuovo nome', n, { wide: true, text: true }), 'Rinomina', function () { var m = C.progName({ progName: $('qN').value }); if (m === n) return; if (archive[m]) { toast('Esiste già'); return false; } archive[m] = archive[n]; delete archive[n]; archive[m].job.name = m; archive[m].job.settings.progName = m; if (job.name === n) { job.name = m; job.settings.progName = m; persist(); } saveArchive(); ui.archSel = m; refresh(); }); });
cmd('arcDelete', 'Cancella disegno…', function () { var n = archSelName(); if (!n) return toast('Seleziona un disegno in archivio'); dlg('Cancella disegno', '<p>Cancellare <b>' + esc(n) + '</b> dall\'archivio? L\'operazione non si annulla.</p>', 'Cancella', function () { delete archive[n]; saveArchive(); ui.archSel = null; refresh(); }); });
cmd('arcComment', 'Editor commenti…', function () { var n = archSelName(); if (!n) return toast('Seleziona un disegno in archivio'); dlg('Commento', field('qC', 'Commento', archive[n].comment, { wide: true, text: true }), 'OK', function () { archive[n].comment = $('qC').value; archive[n].job.comment = $('qC').value; if (job.name === n) { job.comment = $('qC').value; persist(); } saveArchive(); refresh(); }); });
cmd('ppView', 'Part-Program: Visualizza', function () { showCode(); });

/* ================= menu ================= */
var S_ = '-';
var MENUS = {
  sup: [
    ['File', [['Nuovo…', 'newDrawing'], ['Apri…', 'openDrawing'], ['Salva', 'save', 'Ctrl+S'], ['Salva come…', 'saveAs'], S_, ['Importa DXF…', 'importDxf'], ['Importa SVG…', 'importSvg'], S_, ['Importa progetto (.json)…', 'importProj'], ['Esporta progetto (.json)', 'exportProj']]],
    ['CAD', [['Integrato', 'toCad'], ['Ferramenta (schemi di foratura)', 'toFer'], ['Mobili parametrici', 'toMob']]],
    ['Macchina', [['CAM', 'toCam'], ['Part-Program', [['Visualizza / Genera', 'ppView']]], ['Attrezzaggio', [['Edit…', 'toolsEdit'], ['Import dalla macchina…', 'machImport']]], ['Configurazione', [['Visualizza', 'configView']]], ['Utilità', [['Default…', 'defaults'], ['Velocità (tabella utensili)…', 'toolsEdit']]]]],
    ['Utilità', [['Operazioni su archivio', [['Copia disegno…', 'arcCopy'], ['Rinomina disegno…', 'arcRename'], ['Cancella disegno…', 'arcDelete'], ['Editor commenti…', 'arcComment']]]]],
    ['Opzioni', [['Import/Export', [['DXF: Importa…', 'importDxf'], ['DXF: Esporta', 'exportDxf']]], ['Icone barra strumenti…', 'iconStyle']]],
    ['Help', [['Informazioni', 'about']]]
  ],
  lc: [
    ['File', [['Salva', 'save', 'Ctrl+S'], ['Nuovo…', 'newDrawing'], ['Apri…', 'openDrawing'], S_, ['CAD', 'toCad'], ['Esci (Supervisore)', 'toSup']]],
    ['Opzioni', [['Icone barra strumenti…', 'iconStyle']]]
  ],
  mob: [
    ['File', [['Salva', 'save', 'Ctrl+S'], ['Nuovo…', 'newDrawing'], ['Apri…', 'openDrawing'], S_, ['CAD', 'toCad'], ['Esci (Supervisore)', 'toSup']]],
    ['Macchina', [['Modifica attrezzaggio…', 'toolsEdit']]],
    ['Opzioni', [['Icone barra strumenti…', 'iconStyle']]]
  ],
  fer: [
    ['File', [['Salva', 'save', 'Ctrl+S'], ['Nuovo…', 'newDrawing'], ['Apri…', 'openDrawing'], S_, ['CAD', 'toCad'], ['CAM', 'toCam'], ['Esci (Supervisore)', 'toSup']]],
    ['Macchina', [['Modifica attrezzaggio…', 'toolsEdit']]],
    ['Opzioni', [['Icone barra strumenti…', 'iconStyle']]]
  ],
  cad: [
    ['File', [['Salva', 'save', 'Ctrl+S'], ['Salva come…', 'saveAs'], ['Nuovo…', 'newDrawing'], ['Apri…', 'openDrawing'], S_, ['Importa DXF…', 'importDxf'], ['Importa SVG…', 'importSvg'], ['Esporta DXF', 'exportDxf'], S_, ['CAM', 'toCam'], ['Esci (Supervisore)', 'toSup']]],
    ['Display', [['Zoom', [['Precedente', 'zPrev'], ['Finestra', 'zWin', 'W'], ['Meno', 'zOut'], ['Più', 'zIn'], ['Faccia', 'zFace', '0'], ['Estensione', 'zExt', 'E'], ['Pan', 'pan', 'Spazio']]], ['Esploso', 'explode'], S_, ['Faccia di lavoro', [['Superiore (1)', 'face1'], ['Anteriore (2)', 'face2'], ['Destra (3)', 'face3'], ['Posteriore (4)', 'face4'], ['Sinistra (5)', 'face5']]], S_, ['Icone barra strumenti…', 'iconStyle']]],
    ['Disegna', [
      ['Fori', [['Normale…', 'holeNum'], ['Barriera…', 'rowNum'], ['Di testa (orizzontale su fianco)…', 'holeSide'], ['Di testa: diametro e profondità…', 'sideDefaults'], S_, ['Foro col mouse', 'hole', 'F'], ['Barriera col mouse', 'row', 'L']]],
      ['Fresature', [['Retta', [['2 punti…', 'line2'], ['Inizio, angolo, lunghezza…', 'lineAL']]], ['Arco', [['Inizio, fine, centro…', 'arcC'], ['Inizio, fine, raggio…', 'arcR'], ['Inizio, punto, fine…', 'arcP']]], ['Cerchio', [['Centro, raggio…', 'circleCR'], ['3 punti…', 'circle3']]], ['Rettangolo…', 'rectNum'], ['Ellisse…', 'ellipse'],
        ['Segui', [['Retta tangente…', 'follow_rt'], ['Retta punto finale…', 'follow_rp'], ['Retta angolo, lunghezza…', 'follow_ra'], ['Arco tangente…', 'follow_at'], ['Arco fine, centro…', 'follow_ac'], ['Arco fine, raggio…', 'follow_ar']]],
        ['Forma per punti', [['File…', 'ptsFile']]], S_, ['Per punti col mouse', 'pathMode', 'P'], ['Rettangolo col mouse', 'rect', 'R'], ['Cerchio col mouse', 'circleMode', 'C'], ['Linea / polilinea col mouse', 'lineMode'], ['Arco 3 punti col mouse', 'arc3Mode'], ['Arco da centro col mouse', 'arcCMode'], ['Cerchio 3 punti col mouse', 'circle3Mode']]],
      ['Oggetti', [['Scontornatura…', 'scont'], ['Rifilatura perimetro', 'trim', 'Q'], ['Tasca rettangolare…', 'pocketRect'], ['Tasca circolare…', 'pocketCirc'], ['Tasca generica…', 'pocketGen'], ['Canali…', 'canali'], ['Antina…', 'antina'], ['Tasca col mouse', 'pocketMode', 'T']]],
      ['Testo…', 'textCmd'], ['Blocco', [['Definisci…', 'blockDef'], ['Inserisci…', 'blockIns']]], S_, ['Ferramenta (schemi di foratura)…', 'toFer'], ['Mobili parametrici…', 'toMob']]],
    ['Imposta', [['Diametro…', 'setDiam'], ['Profondità…', 'setDepth'], ['Interpolazione Z…', 'setInterpZ'], ['Correzione utensile…', 'setCorr'], ['Direzione globale…', 'setDirGlobal']]],
    ['Modifica', [['Cancella', 'del', 'Canc'], ['Copia…', 'copy', 'Ctrl+D'], ['Muovi…', 'move'], ['Ruota…', 'rotate'], ['Specchia…', 'mirror'], ['Opponi', 'oppose'], ['Taglia', 'trimEnt'], ['Estendi', 'extendEnt'], ['Scala…', 'scale'], ['Serie…', 'series'], ['Pannello…', 'panelEdit'], ['Entità', 'entity']]],
    ['Strumenti', [['Cambio origine…', 'origin'], ['Raccordo…', 'fillet'], ['Smusso…', 'chamfer'], ['Offset…', 'offset'], ['Griglia…', 'gridSet'], ['Quote', [['Imposta…', 'dimAdd'], ['Quote del pannello', 'dimPanel'], ['Cancella…', 'dimDel'], ['Cancella tutte', 'dimAll0'], ['Vedi on/off', 'dimShow']]], ['Osnap on/off', 'osnap', 'O'], ['Distanza', 'distance'], S_, ['Annulla', 'undo', 'Ctrl+Z'], ['Ripristina', 'redo', 'Ctrl+Y']]],
    ['Percorso', [['Taglia e cuci', 'cutsew'], ['Auto unisci', 'autojoin'], ['Riduzione fresature…', 'reduceMill'], ['Arrotonda…', 'round'], ['Inverti direzione', 'reverse']]],
    ['Vincoli', [['Orizzontale', 'cH'], ['Verticale', 'cV'], ['Parallele', 'cPar'], ['Perpendicolari', 'cPerp'], ['Stessa lunghezza', 'cEq'], S_, ['Lunghezza (quota guidante)…', 'cLen'], ['Distanza tra punti…', 'cDist'], ['Punti coincidenti', 'cCoin'], ['Fissa punto', 'cFix'], S_, ['Risolvi', 'cSolve'], ['Mostra on/off', 'cShow'], ['Cancella vincolo…', 'cDel'], ['Cancella tutti', 'cClear'], S_, ['Approssima con cerchio', 'fitCircle'], ['Immagine di sfondo da ricalcare…', 'bgImage'], ['Togli immagine di sfondo', 'bgClear']]],
    ['Informazioni', [['Pannello', 'infoPanel'], ['Entità', 'infoEntity'], ['Tratto fresatura', 'infoSeg'], ['Fresatura intera', 'infoMill'], ['Stato', 'infoState'], S_, ['Controllo geometria', 'geoCheck']]]
  ],
  cam: [
    ['File', [['Salva', 'save', 'Ctrl+S'], ['CAD', 'toCad'], ['Esci (Supervisore)', 'toSup']]],
    ['Display', [['Zoom', [['Precedente', 'zPrev'], ['Finestra', 'zWin', 'W'], ['Meno', 'zOut'], ['Faccia', 'zFace', '0'], ['Estensione', 'zExt', 'E'], ['Pan', 'pan']]], ['Esploso', 'explode']]],
    ['Macchina', [['Configurazione', 'configView'], ['Modifica attrezzaggio…', 'toolsEdit'], ['Import attrezzaggio…', 'machImport']]],
    ['Lavorazioni', [['Forature…', 'forature'], ['Fresature…', 'fresature'], ['Ingresso…', 'leadIn'], ['Uscita…', 'leadOut'], ['Sequenze', 'sequences'], ['Inverti direzione', 'reverse']]],
    ['Elabora', [['Ottimizza', 'optimize'], ['Deottimizza', 'deoptimize'], ['Genera Part Program', 'genPP'], ['Origine programma…', 'originProg'], ['Animazione', 'animate'], ['Testa in simulazione on/off', 'headToggle']]],
    ['Opzioni', [['Visualizzazione…', 'camView'], ['Icone barra strumenti…', 'iconStyle']]],
    ['Informazioni', [['Pannello', 'infoPanel'], ['Stato', 'infoState']]]
  ]
};
function menuHtml(items) {
  return items.map(function (it) {
    if (it === S_) return '<div class="msep"></div>';
    if (Array.isArray(it[1])) return '<div class="mi"><button type="button">' + esc(it[0]) + '<span class="k">▸</span></button><div class="drop">' + menuHtml(it[1]) + '</div></div>';
    return '<div class="mi"><button type="button" data-cmd="' + it[1] + '">' + esc(it[0]) + (it[2] ? '<span class="k">' + esc(it[2]) + '</span>' : '') + '</button></div>';
  }).join('');
}
function renderMenus() { $('menubar').innerHTML = MENUS[ui.env].map(function (m, i) { return '<div class="mtop" data-i="' + i + '"><button type="button">' + esc(m[0]) + '</button><div class="drop">' + menuHtml(m[1]) + '</div></div>'; }).join(''); }
function closeMenus() { document.querySelectorAll('.mtop.open,.mi.open').forEach(function (e) { e.classList.remove('open'); }); }
$('menubar').addEventListener('click', function (e) {
  var c = e.target.closest('[data-cmd]'); if (c) { run(c.dataset.cmd); return; }
  var top = e.target.closest('.mtop>button'); if (top) { var m = top.parentNode, was = m.classList.contains('open'); closeMenus(); if (!was) m.classList.add('open'); return; }
  var sub = e.target.closest('.mi>button'); if (sub) { var mi = sub.parentNode; mi.parentNode.querySelectorAll(':scope>.mi.open').forEach(function (x) { if (x !== mi) x.classList.remove('open'); }); mi.classList.toggle('open'); }
});
$('menubar').addEventListener('mouseover', function (e) {
  var top = e.target.closest('.mtop'); if (top && document.querySelector('.mtop.open') && !top.classList.contains('open')) { closeMenus(); top.classList.add('open'); }
  var mi = e.target.closest('.mi'); if (mi && mi.querySelector(':scope>.drop')) { mi.parentNode.querySelectorAll(':scope>.mi.open').forEach(function (x) { if (x !== mi) x.classList.remove('open'); }); mi.classList.add('open'); }
});
document.addEventListener('pointerdown', function (e) { if (!e.target.closest('.menubar')) closeMenus(); });

/* ================= barre strumenti ================= */
var ICONS = {
  f1: '<rect x="6" y="6" width="12" height="12"/><rect x="8" y="8" width="8" height="8" fill="currentColor" stroke="none"/>', f2: '<rect x="6" y="6" width="12" height="12"/><rect x="6" y="18" width="12" height="3" fill="currentColor"/>', f3: '<rect x="6" y="6" width="12" height="12"/><rect x="18" y="6" width="3" height="12" fill="currentColor"/>', f4: '<rect x="6" y="6" width="12" height="12"/><rect x="6" y="3" width="12" height="3" fill="currentColor"/>', f5: '<rect x="6" y="6" width="12" height="12"/><rect x="3" y="6" width="3" height="12" fill="currentColor"/>',
  kh: '<text x="12" y="16.5" font-family="Arial,sans-serif" font-size="12" font-weight="700" text-anchor="middle" fill="currentColor" stroke="none">H</text>', kv: '<text x="12" y="16.5" font-family="Arial,sans-serif" font-size="12" font-weight="700" text-anchor="middle" fill="currentColor" stroke="none">V</text>', kperp: '<text x="12" y="16.5" font-family="Arial,sans-serif" font-size="12" font-weight="700" text-anchor="middle" fill="currentColor" stroke="none">⊥</text>', kpar: '<text x="12" y="16.5" font-family="Arial,sans-serif" font-size="12" font-weight="700" text-anchor="middle" fill="currentColor" stroke="none">∥</text>', klen: '<text x="12" y="16.5" font-family="Arial,sans-serif" font-size="12" font-weight="700" text-anchor="middle" fill="currentColor" stroke="none">L=</text>',
  cab: '<rect x="4" y="3" width="16" height="18"/><path d="M12 3v18M10 12h0M14 12h0M4 8h16"/>', arcc: '<path d="M5 17a9 9 0 0 1 14 0"/><circle cx="12" cy="17" r="1.4"/>', circ3: '<circle cx="12" cy="12" r="8"/><circle cx="12" cy="4" r="1.4"/><circle cx="5" cy="16" r="1.4"/><circle cx="19" cy="16" r="1.4"/>',
  hhole: '<rect x="3" y="8" width="18" height="8"/><path d="M3 12h9"/><circle cx="3" cy="12" r="2"/>', text: '<path d="M5 5h14M12 5v14M9 19h6"/>', imp: '<path d="M12 3v11M8 10l4 4 4-4M4 17v3h16v-3"/>', svg: '<path d="M4 17c3-8 6 2 8-4s5-6 8-2"/><circle cx="4" cy="17" r="1.4"/><circle cx="20" cy="11" r="1.4"/>',
  cut: '<path d="M4 20L20 4"/><path d="M12 3v18" stroke-dasharray="2 2"/><circle cx="6" cy="6" r="2.5"/><circle cx="6" cy="18" r="2.5"/>', ext: '<path d="M3 12h11"/><path d="M14 12h6" stroke-dasharray="2 2"/><path d="M21 4v16"/>', dim: '<path d="M3 6v6M21 6v6M3 9h18"/><path d="M7 16h10"/>',
  hinge: '<circle cx="9" cy="12" r="5"/><circle cx="17" cy="7" r="1.6"/><circle cx="17" cy="17" r="1.6"/><path d="M3 3v18"/>',
  select: '<path d="M5 3l14 8-6 2-3 6z"/>', hole: '<circle cx="12" cy="12" r="6"/><path d="M12 3v4M12 17v4M3 12h4M17 12h4"/>', row: '<circle cx="5" cy="12" r="2.4"/><circle cx="12" cy="12" r="2.4"/><circle cx="19" cy="12" r="2.4"/>',
  path: '<path d="M4 19l5-11 5 7 6-11"/><circle cx="4" cy="19" r="1.6"/>', rect: '<rect x="4" y="6" width="16" height="12" rx="2"/>', circle: '<circle cx="12" cy="12" r="7.5"/><circle cx="12" cy="12" r="1"/>',
  pocket: '<rect x="4" y="6" width="16" height="12" rx="1"/><rect x="7.5" y="9" width="9" height="6"/>', trim: '<rect x="6" y="6" width="12" height="12"/><path d="M3 3h18v18H3z" stroke-dasharray="2 2"/>',
  line: '<path d="M4 18L20 6"/><circle cx="4" cy="18" r="1.5"/><circle cx="20" cy="6" r="1.5"/>', arc: '<path d="M4 18a9 9 0 0 1 16 0"/>', move: '<path d="M12 3v18M3 12h18M12 3l-3 3M12 3l3 3M12 21l-3-3M12 21l3-3M3 12l3-3M3 12l3 3M21 12l-3-3M21 12l-3 3"/>',
  copy: '<rect x="8" y="8" width="12" height="12" rx="1"/><path d="M4 16V4h12"/>', rotate: '<path d="M20 12a8 8 0 1 1-3-6.3"/><path d="M20 4v5h-5"/>', mirror: '<path d="M12 3v18" stroke-dasharray="2 2"/><path d="M9 6L3 18h6zM15 6l6 12h-6z"/>',
  del: '<path d="M5 7h14M10 7V4h4v3M7 7l1 13h8l1-13"/>', fillet: '<path d="M4 20V10a6 6 0 0 1 6-6h10"/>', offset: '<rect x="7" y="7" width="10" height="10"/><rect x="3" y="3" width="18" height="18" rx="3" stroke-dasharray="2 2"/>',
  undo: '<path d="M9 14L4 9l5-5"/><path d="M4 9h10a6 6 0 0 1 0 12h-3"/>', redo: '<path d="M15 14l5-5-5-5"/><path d="M20 9H10a6 6 0 0 0 0 12h3"/>', save: '<path d="M5 3h11l3 3v15H5z"/><path d="M8 3v6h8V3M8 21v-7h8v7"/>',
  zwin: '<rect x="3" y="3" width="11" height="11" stroke-dasharray="2 2"/><circle cx="15" cy="15" r="4"/><path d="M18 18l3 3"/>', zext: '<path d="M3 9V3h6M21 9V3h-6M3 15v6h6M21 15v6h-6"/>', zface: '<rect x="5" y="7" width="14" height="10"/><path d="M3 3h4M17 3h4M3 21h4M17 21h4"/>',
  zprev: '<circle cx="11" cy="11" r="7"/><path d="M16 16l5 5M8 11h6"/>', pan: '<path d="M12 3v18M3 12h18"/><path d="M8 7l4-4 4 4M8 17l4 4 4-4M7 8l-4 4 4 4M17 8l4 4-4 4"/>', explode: '<rect x="8" y="8" width="8" height="8"/><path d="M8 3h8M8 21h8M3 8v8M21 8v8"/>',
  opt: '<path d="M4 12h4l3-7 3 14 3-7h3"/>', gen: '<path d="M6 3h9l4 4v14H6z"/><path d="M9 12h6M9 16h6M9 8h3"/>', anim: '<polygon points="7,4 20,12 7,20"/>', lead: '<path d="M4 20c0-8 6-10 10-10h6"/><path d="M17 7l3 3-3 3"/>',
  seq: '<path d="M4 6h10M4 12h10M4 18h10"/><path d="M18 5v14M15 16l3 3 3-3"/>', tools: '<circle cx="12" cy="12" r="3"/><path d="M12 2v4M12 18v4M2 12h4M18 12h4M5 5l3 3M16 16l3 3M5 19l3-3M16 8l3-3"/>',
  newd: '<path d="M6 3h9l4 4v14H6z"/><path d="M12 10v7M8.5 13.5h7"/>', open: '<path d="M3 7h6l2 2h10v11H3z"/>', cad: '<path d="M4 20l4-1 11-11-3-3L5 16z"/>', cam: '<path d="M8 3v8l-3 4h14l-3-4V3"/><path d="M12 15v6"/>', dist: '<path d="M3 17L17 3"/><path d="M3 13v4h4M13 3h4v4"/>'
};
/* ================= icone classiche a colori (disegno originale, stile barre Windows anni '90) ================= */
var K_ = { o: 'stroke="#1b1b1b" stroke-width="1.1" stroke-linejoin="round"', w: '#f4f1e8', p: '#e9c98b', pe: '#8a6324', b: '#1f5fbf', v: '#7a3fa0', r: '#d2471a', g: '#2e8b3a', y: '#f2c230', gr: '#9aa3a0', dk: '#3a4240' };
function kp(d, f, extra) { return '<path d="' + d + '" fill="' + (f || 'none') + '" ' + K_.o + (extra ? ' ' + extra : '') + '/>'; }
function kpanel(x, y, w, h) { return '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" fill="' + K_.p + '" stroke="' + K_.pe + '" stroke-width="1.1"/>'; }
function kc(cx, cy, r, f, extra) { return '<circle cx="' + cx + '" cy="' + cy + '" r="' + r + '" fill="' + f + '" ' + K_.o + (extra ? ' ' + extra : '') + '/>'; }
function kl(d, c, w, extra) { return '<path d="' + d + '" fill="none" stroke="' + c + '" stroke-width="' + (w || 2.2) + '" stroke-linecap="round" stroke-linejoin="round"' + (extra ? ' ' + extra : '') + '/>'; }
var ICONS_K = {
  select: kp('M6 3l12 10-5.2.6 3 6.2-2.4 1.1-3-6.3L6 18z', '#ffffff'),
  hole: kpanel(2, 5, 20, 14) + kc(12, 12, 4.6, K_.b) + kc(12, 12, 1.6, '#cfe0fb', 'stroke-width=".6"'),
  row: kpanel(2, 7, 20, 10) + kc(6, 12, 2.4, K_.b) + kc(12, 12, 2.4, K_.b) + kc(18, 12, 2.4, K_.b),
  path: kpanel(2, 4, 20, 16) + kl('M5 17l4-9 4 6 6-8', K_.r, 2.6) + kc(5, 17, 1.6, K_.y, 'stroke-width=".7"'),
  line: kpanel(2, 4, 20, 16) + kl('M5 17L19 7', K_.r, 2.6) + kc(5, 17, 1.8, K_.y, 'stroke-width=".7"') + kc(19, 7, 1.8, K_.y, 'stroke-width=".7"'),
  arc: kpanel(2, 4, 20, 16) + kl('M5 17a8 8 0 0 1 14 0', K_.r, 2.6) + kc(12, 17, 1.2, K_.dk, 'stroke-width=".5"'),
  rect: kpanel(2, 4, 20, 16) + '<rect x="6" y="8" width="12" height="8" rx="1.5" fill="none" stroke="' + K_.r + '" stroke-width="2.6"/>',
  circle: kpanel(2, 3, 20, 18) + '<circle cx="12" cy="12" r="5.5" fill="none" stroke="' + K_.r + '" stroke-width="2.6"/>' + kc(12, 12, 1, K_.dk, 'stroke-width=".5"'),
  pocket: kpanel(2, 4, 20, 16) + '<rect x="6" y="8" width="12" height="8" fill="#b55a2a" stroke="#6e2e10" stroke-width="1.1"/>' + kl('M8 10h8M8 12h8M8 14h8', '#f0b58c', 1),
  trim: '<rect x="4" y="4" width="16" height="16" fill="' + K_.p + '" stroke="' + K_.pe + '" stroke-width="1.1"/>' + '<rect x="2.5" y="2.5" width="19" height="19" fill="none" stroke="' + K_.r + '" stroke-width="1.8" stroke-dasharray="3 2"/>',
  move: kpanel(7, 7, 10, 10) + kl('M12 2.5v19M2.5 12h19', K_.g, 2) + kl('M9.5 5L12 2.5 14.5 5M9.5 19l2.5 2.5 2.5-2.5M5 9.5L2.5 12 5 14.5M19 9.5l2.5 2.5-2.5 2.5', K_.g, 2),
  copy: '<rect x="3" y="3" width="12" height="12" fill="' + K_.p + '" stroke="' + K_.pe + '" stroke-width="1.1"/><rect x="9" y="9" width="12" height="12" fill="#f3dfb4" stroke="' + K_.pe + '" stroke-width="1.1"/>' + kl('M13 15h4M15 13v4', K_.g, 2),
  rotate: kpanel(7, 8, 10, 8) + kl('M19.5 12a7.5 7.5 0 1 1-2.6-5.7', K_.b, 2.2) + kp('M20.5 3.5v5h-5z', K_.b),
  mirror: kl('M12 2v20', K_.dk, 1.4, 'stroke-dasharray="2 2"') + kp('M9.5 6L3 18h6.5z', K_.p) + kp('M14.5 6L21 18h-6.5z', '#f3dfb4'),
  del: kp('M6 7h12l-1.2 13.5H7.2z', '#c9cfcc') + kp('M4 6.5h16v2H4z', K_.gr) + kp('M9.5 6.5V4h5v2.5', 'none') + kl('M9.5 10.5l5 6.5M14.5 10.5l-5 6.5', '#cc2b2b', 2.2),
  fillet: kpanel(3, 3, 18, 18) + kl('M6 20V12a6 6 0 0 1 6-6h8', K_.r, 2.6),
  offset: kpanel(7, 7, 10, 10) + '<rect x="3" y="3" width="18" height="18" rx="3" fill="none" stroke="' + K_.r + '" stroke-width="1.9" stroke-dasharray="3 2"/>',
  undo: kp('M10 4L3.5 9.5 10 15v-3.4h4a4 4 0 0 1 0 8h-2v2.9h2a7 7 0 0 0 0-14h-4z', K_.y),
  redo: kp('M14 4l6.5 5.5L14 15v-3.4h-4a4 4 0 0 0 0 8h2v2.9h-2a7 7 0 0 1 0-14h4z', K_.y),
  save: kp('M3.5 3.5h14l3 3v14h-17z', '#2c5aa0') + '<rect x="7" y="4" width="9" height="6" fill="#e9eef7" stroke="#1b1b1b" stroke-width=".9"/><rect x="13" y="5" width="2" height="4" fill="#2c5aa0"/><rect x="6.5" y="13.5" width="11" height="6.5" fill="#f4f1e8" stroke="#1b1b1b" stroke-width=".9"/>',
  zwin: '<rect x="2.5" y="2.5" width="12" height="12" fill="#ffffff" stroke="#1b1b1b" stroke-width="1.1" stroke-dasharray="2 1.5"/>' + kc(15, 15, 4.3, '#bfe0f5') + kl('M18.2 18.2l3.3 3.3', K_.dk, 2.6),
  zprev: kc(10.5, 10.5, 6.5, '#bfe0f5') + kl('M15.3 15.3l5.7 5.7', K_.dk, 2.6) + kl('M7.5 10.5h6', K_.b, 2),
  zface: kpanel(5, 7, 14, 10) + kl('M2.5 6V2.5H6M18 2.5h3.5V6M2.5 18v3.5H6M18 21.5h3.5V18', K_.dk, 1.8),
  zext: kpanel(6, 7, 12, 10) + kl('M3 8.5V3h5.5M21 8.5V3h-5.5M3 15.5V21h5.5M21 15.5V21h-5.5', K_.g, 2.2),
  pan: kp('M8.5 21v-4L5 13.5c-.8-.8.3-2.2 1.3-1.5L8.5 14V5.5c0-1.3 2-1.3 2 0V11V4c0-1.3 2-1.3 2 0v7V5c0-1.3 2-1.3 2 0v6.5V7c0-1.3 2-1.3 2 0v8.5c0 2.5-1 4-2 5.5z', '#f6d7b0'),
  explode: kpanel(8, 8, 8, 8) + kp('M8 2.5h8l-1.5 3.5h-5z', '#f3dfb4') + kp('M8 21.5h8l-1.5-3.5h-5z', '#f3dfb4') + kp('M2.5 8v8L6 14.5v-5z', '#f3dfb4') + kp('M21.5 8v8L18 14.5v-5z', '#f3dfb4'),
  opt: kp('M3 3h18v18H3z', '#ffffff') + kl('M5 12h3l2.5-6 3 12 2.5-6h3', K_.g, 2.2),
  gen: kp('M5 2.5h10l4 4v15H5z', '#ffffff') + kp('M15 2.5v4h4', '#dcdcdc') + '<text x="12" y="17.5" font-family="Arial,sans-serif" font-size="7.5" font-weight="700" text-anchor="middle" fill="' + K_.b + '">PRG</text>',
  anim: kp('M3 4h18v16H3z', '#2a3230') + kp('M9.5 8v8l6.5-4z', K_.g),
  lead: kpanel(10, 4, 11, 16) + kl('M3 20c0-6 3.5-8 7-8h5', K_.r, 2.4) + kp('M14 9l4 3-4 3z', K_.r),
  seq: '<rect x="3" y="4" width="12" height="3" fill="' + K_.b + '"/><rect x="3" y="10.5" width="12" height="3" fill="' + K_.r + '"/><rect x="3" y="17" width="12" height="3" fill="' + K_.g + '"/>' + kl('M19 4v15', K_.dk, 2) + kp('M16 16.5h6L19 21z', K_.dk),
  tools: kp('M10 2h4v6h-4z', K_.gr) + kp('M8.5 8h7l-1 4h-5z', '#c9cfcc') + kp('M10.5 12h3v6l-1.5 3.5-1.5-3.5z', '#d9b44a') + kl('M10.6 14.5l2.8 1.4M10.6 16.8l2.8 1.4', K_.dk, 1),
  newd: kp('M5 2.5h10l4 4v15H5z', '#ffffff') + kp('M15 2.5v4h4', '#dcdcdc') + kc(16.5, 17, 4.3, K_.y) + kl('M16.5 14.8v4.4M14.3 17h4.4', K_.dk, 1.5),
  open: kp('M2.5 6h6.5l2 2h9.5v12H2.5z', '#e2b23a') + kp('M2.5 20l3-8.5h17L19.5 20z', K_.y),
  cad: kp('M3 3h18v18H3z', '#ffffff') + kp('M5.5 18.5l1-4 9.5-9.5 3 3-9.5 9.5z', K_.y) + kp('M16 5l3 3 1.3-1.3-3-3z', '#e88b8b') + kp('M5.5 18.5l1-4 3 3z', '#f6d7b0'),
  cam: kp('M9 2.5h6v6.5H9z', K_.gr) + kp('M7 9h10l-2 4H9z', '#c9cfcc') + kp('M11 13h2v5h-2z', '#d9b44a') + kpanel(2, 18, 20, 4),
  hinge: kpanel(2, 3, 20, 18) + kc(10, 12, 5, K_.b) + kc(10, 12, 1.8, '#cfe0fb', 'stroke-width=".6"') + kc(17, 7.5, 1.7, K_.b) + kc(17, 16.5, 1.7, K_.b),
  cut: kpanel(2, 3, 20, 18) + kl('M5 18L19 6', K_.r, 2.4) + kl('M12 3v18', '#8b3fd1', 2) + kl('M14 13.5L19 6', '#ffffff', 2.6),
  ext: kpanel(2, 3, 20, 18) + kl('M4 12h9', K_.r, 2.4) + kl('M13 12h5', K_.r, 2, 'stroke-dasharray="2 1.5"') + kl('M19 5v14', '#8b3fd1', 2),
  dim: '<rect x="2" y="3" width="20" height="18" fill="#ffffff" stroke="#1b1b1b" stroke-width="1.1"/>' + kl('M5 8v8M19 8v8', K_.dk, 1.2) + kl('M5 12h14', K_.b, 1.6) + kp('M5 12l3-2v4z', K_.b) + kp('M19 12l-3-2v4z', K_.b),
  cab: kp('M4 3h16v18H4z', K_.p, 'stroke="' + K_.pe + '"') + kl('M12 3v18', K_.pe, 1.2) + kl('M4 8h16', K_.pe, 1) + kc(10, 13, 0.9, K_.dk) + kc(14, 13, 0.9, K_.dk),
  arcc: kpanel(2, 4, 20, 16) + kl('M5 17a8 8 0 0 1 14 0', K_.r, 2.6) + kc(12, 17, 1.6, K_.y, 'stroke-width=".7"') + kl('M12 17L6.5 11', K_.dk, 1, 'stroke-dasharray="2 1.5"'),
  circ3: kpanel(2, 3, 20, 18) + '<circle cx="12" cy="12" r="6.5" fill="none" stroke="' + K_.r + '" stroke-width="2.4"/>' + kc(12, 5.5, 1.5, K_.y, 'stroke-width=".7"') + kc(6.4, 15.3, 1.5, K_.y, 'stroke-width=".7"') + kc(17.6, 15.3, 1.5, K_.y, 'stroke-width=".7"'),
  hhole: '<rect x="2" y="7" width="20" height="10" fill="' + K_.p + '" stroke="' + K_.pe + '" stroke-width="1.1"/>' + '<rect x="2" y="10.5" width="10" height="3" fill="' + K_.v + '"/>' + kc(2.5, 12, 2, K_.v),
  text: kpanel(2, 3, 20, 18) + '<text x="12" y="17.5" font-family="Arial,sans-serif" font-size="14" font-weight="700" text-anchor="middle" fill="' + K_.r + '">A</text>',
  imp: kp('M4 3h11l4 4v14H4z', '#ffffff') + '<text x="11.5" y="14" font-family="Arial,sans-serif" font-size="6.5" font-weight="700" text-anchor="middle" fill="' + K_.g + '">DXF</text>' + kl('M11.5 16v4M9.5 18l2 2 2-2', K_.g, 1.4),
  svg: kp('M4 3h11l4 4v14H4z', '#ffffff') + '<text x="11.5" y="14" font-family="Arial,sans-serif" font-size="6.5" font-weight="700" text-anchor="middle" fill="#c2410c">SVG</text>' + kl('M11.5 16v4M9.5 18l2 2 2-2', '#c2410c', 1.4),
  kh: '<rect x="2" y="3" width="20" height="18" fill="#ffffff" stroke="#1b1b1b" stroke-width="1.1"/><text x="12" y="16.5" font-family="Arial,sans-serif" font-size="11" font-weight="700" text-anchor="middle" fill="#2e8b3a">H</text>', kv: '<rect x="2" y="3" width="20" height="18" fill="#ffffff" stroke="#1b1b1b" stroke-width="1.1"/><text x="12" y="16.5" font-family="Arial,sans-serif" font-size="11" font-weight="700" text-anchor="middle" fill="#2e8b3a">V</text>', kperp: '<rect x="2" y="3" width="20" height="18" fill="#ffffff" stroke="#1b1b1b" stroke-width="1.1"/><text x="12" y="16.5" font-family="Arial,sans-serif" font-size="11" font-weight="700" text-anchor="middle" fill="#2e8b3a">⊥</text>', kpar: '<rect x="2" y="3" width="20" height="18" fill="#ffffff" stroke="#1b1b1b" stroke-width="1.1"/><text x="12" y="16.5" font-family="Arial,sans-serif" font-size="11" font-weight="700" text-anchor="middle" fill="#2e8b3a">∥</text>', klen: '<rect x="2" y="3" width="20" height="18" fill="#ffffff" stroke="#1b1b1b" stroke-width="1.1"/><text x="12" y="16.5" font-family="Arial,sans-serif" font-size="11" font-weight="700" text-anchor="middle" fill="#2e8b3a">L=</text>',
  f1: '<rect x="6" y="6" width="12" height="12" fill="#e9c98b" stroke="#8a6324" stroke-width="1.1"/><rect x="8" y="8" width="8" height="8" fill="#7a3fa0"/>',
  f2: '<rect x="6" y="6" width="12" height="12" fill="#e9c98b" stroke="#8a6324" stroke-width="1.1"/><rect x="6" y="18" width="12" height="3.5" fill="#7a3fa0"/>',
  f3: '<rect x="6" y="6" width="12" height="12" fill="#e9c98b" stroke="#8a6324" stroke-width="1.1"/><rect x="18" y="6" width="3.5" height="12" fill="#7a3fa0"/>',
  f4: '<rect x="6" y="6" width="12" height="12" fill="#e9c98b" stroke="#8a6324" stroke-width="1.1"/><rect x="6" y="2.5" width="12" height="3.5" fill="#7a3fa0"/>',
  f5: '<rect x="6" y="6" width="12" height="12" fill="#e9c98b" stroke="#8a6324" stroke-width="1.1"/><rect x="2.5" y="6" width="3.5" height="12" fill="#7a3fa0"/>',
  dist: kl('M4 18L18 4', K_.dk, 1.6) + kp('M3 19l1.2-5 3.8 3.8z', K_.r) + kp('M19 3l-5 1.2 3.8 3.8z', K_.r) + kl('M7 21h13M20 8v13', K_.b, 1.2, 'stroke-dasharray="2 1.5"')
};
var ICON_SHORT = { selectMode: 'Selez.', hole: 'Foro', row: 'Barriera', pathMode: 'Fresa', line2: 'Retta', arcP: 'Arco', rect: 'Rettang.', circleMode: 'Cerchio', pocketMode: 'Tasca', trim: 'Rifila', move: 'Muovi', copy: 'Copia', rotate: 'Ruota', mirror: 'Specchia', fillet: 'Raccordo', offset: 'Offset', distance: 'Distanza', del: 'Cancella', undo: 'Annulla', redo: 'Ripristina', save: 'Salva', toCam: 'CAM', toCad: 'CAD', newDrawing: 'Nuovo', openDrawing: 'Apri', ppView: 'Part-Prog.', cH: 'Orizz.', cV: 'Vert.', cPerp: 'Perpend.', cPar: 'Parall.', cLen: 'Quota', toMob: 'Mobili', lineMode: 'Linea', arc3Mode: 'Arco 3p', arcCMode: 'Arco C', circle3Mode: 'Cerchio 3p', holeSide: 'Foro testa', textCmd: 'Testo', importDxf: 'DXF', importSvg: 'SVG', trimEnt: 'Taglia', extendEnt: 'Estendi', dimAdd: 'Quote', toFer: 'Ferramenta', toolsEdit: 'Attrezz.', optimize: 'Ottimizza', sequences: 'Sequenze', leadIn: 'Ingresso', animate: 'Simula', genPP: 'Genera PP', zWin: 'Finestra', zPrev: 'Preced.', zFace: 'Faccia', zExt: 'Estens.', pan: 'Pan', explode: 'Esploso' };
var ICON_PREF_KEY = 'camtech99l.icons';
var iconPref = (function () { try { var j = JSON.parse(lsGet(ICON_PREF_KEY) || 'null'); if (j && j.style) return j; } catch (e) {} return { style: 'classico', size: 'grandi' }; })();
function applyIconPref() {
  document.body.classList.toggle('ic-k', iconPref.style !== 'moderno');
  document.body.classList.toggle('ic-lab', iconPref.style === 'etichette');
  document.body.classList.toggle('ic-sm', iconPref.size === 'piccole');
}
function iconSvg(key) { var k = iconPref.style !== 'moderno' && ICONS_K[key]; return k ? '<svg viewBox="0 0 24 24" class="k">' + k + '</svg>' : '<svg viewBox="0 0 24 24">' + ICONS[key] + '</svg>'; }
cmd('iconStyle', 'Icone barra strumenti…', function () {
  var opt = function (v, t, d) { return '<label class="chk" style="align-items:flex-start"><input type="radio" name="qIs" value="' + v + '"' + (iconPref.style === v ? ' checked' : '') + '> <span><b>' + t + '</b><br><span class="note" style="margin:0">' + d + '</span></span></label>'; };
  var demo = ['hole', 'path', 'rect', 'pocket', 'move', 'save', 'gen', 'tools'];
  var row = function (st) { var keep = iconPref.style; iconPref.style = st; var h = '<div class="row" style="gap:4px;margin:2px 0 10px 26px">' + demo.map(function (k) { var nm = { hole: 'Foro', path: 'Fresa', rect: 'Rettang.', pocket: 'Tasca', move: 'Muovi', save: 'Salva', gen: 'Genera PP', tools: 'Attrezz.' }[k]; return '<span class="tb' + (st !== 'moderno' ? ' kdemo' : '') + '" style="pointer-events:none' + (st === 'etichette' ? ';width:auto;min-width:54px;height:50px;flex-direction:column;gap:2px;padding:3px 4px' : '') + '">' + iconSvg(k) + (st === 'etichette' ? '<span style="font-size:11.5px;line-height:1.05">' + nm + '</span>' : '') + '</span>'; }).join('') + '</div>'; iconPref.style = keep; return h; };
  dlg('Opzioni: Icone barra strumenti',
    opt('classico', 'Classiche a colori', 'Pulsanti in rilievo con icone colorate, come le barre di Task.') + row('classico') +
    opt('etichette', 'Classiche con nome', 'Come le classiche, con il nome del comando sotto l\'icona.') + row('etichette') +
    opt('moderno', 'Moderne', 'Icone a linea monocromatiche, più compatte.') + row('moderno') +
    field('qIsz', 'Dimensione', iconPref.size, { select: [['grandi', 'Grandi'], ['piccole', 'Piccole']] }) +
    '<p class="note">Anche col tasto destro sulla barra degli strumenti.</p>', 'OK', function () {
      var r = document.querySelector('input[name="qIs"]:checked'); iconPref = { style: r ? r.value : 'classico', size: $('qIsz').value };
      lsSet(ICON_PREF_KEY, JSON.stringify(iconPref)); applyIconPref(); renderToolbar();
    });
});

var TOOLBARS = {
  sup: [['newd', 'newDrawing', 'Nuovo disegno'], ['open', 'openDrawing', 'Apri'], ['save', 'save', 'Salva'], 0, ['cad', 'toCad', 'CAD'], ['cam', 'toCam', 'CAM'], ['hinge', 'toFer', 'Ferramenta'], ['cab', 'toMob', 'Mobili parametrici'], ['gen', 'ppView', 'Part-Program'], 0, ['tools', 'toolsEdit', 'Attrezzaggio']],
  cad: [['select', 'selectMode', 'Selezione (V)', 'select'], 0, ['hole', 'hole', 'Foro (F)', 'hole'], ['row', 'row', 'Barriera (L)', 'row'], ['hhole', 'holeSide', 'Foro di testa (orizzontale su fianco)…'], ['path', 'pathMode', 'Fresatura per punti (P)', 'path'], ['line', 'lineMode', 'Linea / polilinea col mouse (A = tratto ad arco)', 'path'], ['arc', 'arc3Mode', 'Arco 3 punti col mouse', 'arc3m'], ['arcc', 'arcCMode', 'Arco da centro col mouse', 'arcCm'], ['circ3', 'circle3Mode', 'Cerchio 3 punti col mouse', 'circle3m'], ['rect', 'rect', 'Rettangolo (R)', 'rect'], ['circle', 'circleMode', 'Cerchio (C)', 'circle'], ['pocket', 'pocketMode', 'Tasca (T)', 'pocket'], ['trim', 'trim', 'Rifilatura (Q)'], ['text', 'textCmd', 'Testo / insegne…'], ['imp', 'importDxf', 'Importa DXF…'], ['svg', 'importSvg', 'Importa SVG…'], 0,
    ['move', 'move', 'Muovi…'], ['copy', 'copy', 'Copia…'], ['rotate', 'rotate', 'Ruota…'], ['mirror', 'mirror', 'Specchia…'], ['cut', 'trimEnt', 'Taglia (seleziona prima le lame)'], ['ext', 'extendEnt', 'Estendi (seleziona prima i bordi)'], ['fillet', 'fillet', 'Raccordo…'], ['offset', 'offset', 'Offset…'], ['dist', 'distance', 'Distanza'], ['dim', 'dimAdd', 'Quote'], 0, ['kh', 'cH', 'Vincolo orizzontale'], ['kv', 'cV', 'Vincolo verticale'], ['kperp', 'cPerp', 'Vincolo perpendicolari'], ['kpar', 'cPar', 'Vincolo parallele'], ['klen', 'cLen', 'Quota guidante (lunghezza)'], 0, ['del', 'del', 'Cancella'], 0, ['undo', 'undo', 'Annulla'], ['redo', 'redo', 'Ripristina'], ['save', 'save', 'Salva'], 0, ['hinge', 'toFer', 'Ferramenta'], ['cam', 'toCam', 'Vai al CAM']],
  lc: [['newd', 'newDrawing', 'Nuovo disegno'], ['open', 'openDrawing', 'Apri'], 0, ['cad', 'toCad', 'CAD'], ['cam', 'toCam', 'CAM']],
  mob: [['newd', 'newDrawing', 'Nuovo disegno'], ['open', 'openDrawing', 'Apri'], 0, ['cad', 'toCad', 'CAD'], ['hinge', 'toFer', 'Ferramenta'], 0, ['tools', 'toolsEdit', 'Attrezzaggio']],
  fer: [['newd', 'newDrawing', 'Nuovo disegno'], ['open', 'openDrawing', 'Apri'], ['save', 'save', 'Salva'], 0, ['cad', 'toCad', 'CAD'], ['cam', 'toCam', 'CAM'], 0, ['tools', 'toolsEdit', 'Attrezzaggio']],
  cam: [['select', 'selectMode', 'Selezione', 'select'], 0, ['opt', 'optimize', 'Ottimizza'], ['seq', 'sequences', 'Sequenze'], ['lead', 'leadIn', 'Ingresso…'], ['anim', 'animate', 'Animazione'], ['gen', 'genPP', 'Genera Part Program'], 0, ['tools', 'toolsEdit', 'Attrezzaggio'], ['save', 'save', 'Salva'], 0, ['cad', 'toCad', 'Torna al CAD']]
};
var DISP = [['f1', 'face1', 'Faccia superiore'], ['f2', 'face2', 'Lato anteriore (faccia 2)'], ['f3', 'face3', 'Lato destro (faccia 3)'], ['f4', 'face4', 'Lato posteriore (faccia 4)'], ['f5', 'face5', 'Lato sinistro (faccia 5)'], ['zwin', 'zWin', 'Zoom finestra (W)'], ['zprev', 'zPrev', 'Zoom precedente'], ['zface', 'zFace', 'Zoom faccia (0)'], ['zext', 'zExt', 'Zoom estensione (E)'], ['pan', 'pan', 'Pan'], ['explode', 'explode', 'Esploso: fianchi']];
function tbBtn(b) { return '<button class="tb' + (b[3] && ui.mode === b[3] ? ' on' : '') + '" type="button" data-cmd="' + b[1] + '" aria-label="' + esc(b[2]) + '">' + iconSvg(b[0]) + '<span class="lb">' + esc(ICON_SHORT[b[1]] || b[2].replace(/…|\s*\(.*\)/g, '')) + '</span></button>'; }
function renderToolbar() {
  $('toolbar').innerHTML = TOOLBARS[ui.env].map(function (b) { return b === 0 ? '<span class="tbsep"></span>' : tbBtn(b); }).join('') + '<span class="tbtxt" id="tbInfo"></span>';
  $('disp').innerHTML = (ui.env === 'sup' || ui.env === 'fer' || ui.env === 'mob' || ui.env === 'lc') ? '' : DISP.map(tbBtn).join('');
}
$('toolbar').addEventListener('click', function (e) { var b = e.target.closest('[data-cmd]'); if (b) run(b.dataset.cmd); });
$('toolbar').addEventListener('contextmenu', function (e) { e.preventDefault(); run('iconStyle'); });
$('disp').addEventListener('contextmenu', function (e) { e.preventDefault(); run('iconStyle'); });
$('disp').addEventListener('click', function (e) { var b = e.target.closest('[data-cmd]'); if (b) run(b.dataset.cmd); });
function updToggles() { $('tgGrid').classList.toggle('on', ui.snap); $('tgOsnap').classList.toggle('on', ui.osnap); $('sG').textContent = ui.grid; }
$('tgGrid').onclick = function () { run('gridSnap'); }; $('tgOsnap').onclick = function () { run('osnap'); };
