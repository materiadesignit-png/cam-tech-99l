
/* ================= VINCOLI GEOMETRICI e strumenti dal Draft editor di LiteCAD (fel88, MIT) ================= */
function opsMap() { var m = {}; job.ops.forEach(function (o) { if (o.type === 'path') m[o.id] = o; }); return m; }
function solveCons(pin) { if (!job.cons || !job.cons.length) return { ok: true }; var r = SKETCH.solve(opsMap(), job.cons, pin); ui.consErr = !r.ok; return r; }
function segRefAt(he) { var S = TOPO.segs(he); if (!S.length) return null; var m = ui.mouse, ns = TOPO.nearestSeg(S, { x: m.rx, y: m.ry }); return { op: he.id, k: ns.i }; }
function ptRefOf(hv) { var op = hv.op, n = op.pts.length; if (!op.closed && hv.k === n - 1) return { op: op.id, k: n - 2, pt: 1 }; return { op: op.id, k: hv.k, pt: 0 }; }
function addCons(c, msg) {
  commit(); job.cons = job.cons || []; job.cons.push(c); var r = solveCons(); changed();
  toast(r.ok ? msg + ': applicato' : msg + ': vincoli in conflitto, controlla (in rosso)');
}
function pickSeg(msg, cb) { setEnv('cad', true); pickEntity(msg, function (he) { if (he.type !== 'path') return toast('Clic su un tratto di fresatura'); var r = segRefAt(he); if (r) cb(r); }); }
function oneSeg(t, label) { return function () { pickSeg(label + ': clic sul tratto', function (a) { addCons({ t: t, a: a }, label); }); }; }
function twoSeg(t, label) { return function () { pickSeg(label + ': clic sul primo tratto', function (a) { pickSeg(label + ': clic sul secondo tratto', function (b) { if (a.op === b.op && a.k === b.k) return toast('Scegli un altro tratto'); addCons({ t: t, a: a, b: b }, label); cancelPick(); }); }); }; }
cmd('cH', 'Vincolo orizzontale', oneSeg('h', 'Orizzontale'));
cmd('cV', 'Vincolo verticale', oneSeg('v', 'Verticale'));
cmd('cPar', 'Vincolo parallele', twoSeg('par', 'Parallele'));
cmd('cPerp', 'Vincolo perpendicolari', twoSeg('perp', 'Perpendicolari'));
cmd('cEq', 'Vincolo stessa lunghezza', twoSeg('eq', 'Stessa lunghezza'));
cmd('cLen', 'Vincolo lunghezza…', function () {
  pickSeg('Lunghezza: clic sul tratto', function (a) {
    var P = SKETCH.refPts(opsMap(), a), L = Math.hypot(P[1].x - P[0].x, P[1].y - P[0].y); cancelPick();
    dlg('Vincolo lunghezza', field('qL', 'Lunghezza del tratto', r2(L), { unit: 'mm' }) + '<p class="note">La quota resta guidante: cambiandola dopo (doppio clic sul vincolo) il disegno si adatta.</p>', 'Applica', function () { addCons({ t: 'len', a: a, v: v('qL', L) }, 'Lunghezza'); });
  });
});
function pickPtRef(msg, cb) { setEnv('cad', true); pickVertex(msg, function (hv) { cb(ptRefOf(hv), hv); }); }
cmd('cFix', 'Fissa punto', function () { pickPtRef('Fissa: clic su un vertice', function (a, hv) { cancelPick(); var p = hv.op.pts[hv.k]; addCons({ t: 'fix', a: a, v: { x: p.x, y: p.y } }, 'Punto fisso'); }); });
cmd('cCoin', 'Punti coincidenti', function () { pickPtRef('Coincidenti: clic sul primo vertice', function (a) { pickPtRef('Coincidenti: clic sul secondo vertice', function (b) { cancelPick(); addCons({ t: 'coin', a: a, b: b }, 'Coincidenti'); }); }); });
cmd('cDist', 'Distanza tra punti…', function () {
  pickPtRef('Distanza: clic sul primo vertice', function (a, h1) { pickPtRef('Distanza: clic sul secondo vertice', function (b, h2) {
    cancelPick(); var p = h1.op.pts[h1.k], q = h2.op.pts[h2.k], D = Math.hypot(q.x - p.x, q.y - p.y);
    dlg('Vincolo distanza', field('qL', 'Distanza tra i due punti', r2(D), { unit: 'mm' }), 'Applica', function () { addCons({ t: 'dist', a: a, b: b, v: v('qL', D) }, 'Distanza'); });
  }); });
});
cmd('cShow', 'Mostra vincoli on/off', function () { ui.consHide = !ui.consHide; draw(); toast(ui.consHide ? 'Vincoli nascosti' : 'Vincoli visibili'); });
cmd('cSolve', 'Risolvi vincoli', function () { if (!job.cons || !job.cons.length) return toast('Nessun vincolo'); commit(); var r = solveCons(); changed(); toast(r.ok ? 'Vincoli soddisfatti' : 'Vincoli in conflitto: errore residuo ' + C.f2(r.err)); });
cmd('cDel', 'Cancella vincolo…', function () {
  if (!job.cons || !job.cons.length) return toast('Nessun vincolo');
  setEnv('cad', true); ui.pick = { cb: function (p) { var i = consNear(p); if (i < 0) return toast('Clic sul simbolo del vincolo'); commit(); job.cons.splice(i, 1); changed(); if (!job.cons.length) cancelPick(); } };
  setPrompt('Clic sui simboli dei vincoli da cancellare (Esc per finire)'); draw();
});
cmd('cClear', 'Cancella tutti i vincoli', function () { if (!job.cons || !job.cons.length) return toast('Nessun vincolo'); commit(); job.cons = []; changed(); toast('Vincoli cancellati'); });
function consAnchor(c, ops) {
  var A = SKETCH.refPts(ops, c.a); if (!A) return null;
  if (c.t === 'fix') { var p = SKETCH.refPt(ops, c.a); return { x: p.x, y: p.y, dx: 10, dy: -10 }; }
  if (c.t === 'coin' || c.t === 'dist') { var p1 = SKETCH.refPt(ops, c.a), p2 = SKETCH.refPt(ops, c.b); if (!p2) return null; return { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2, dx: 8, dy: -8 }; }
  var mx = (A[0].x + A[1].x) / 2, my = (A[0].y + A[1].y) / 2, L = Math.hypot(A[1].x - A[0].x, A[1].y - A[0].y) || 1;
  return { x: mx, y: my, dx: -(A[1].y - A[0].y) / L * 16, dy: -(A[1].x - A[0].x) / L * 16 };
}
function consLabel(c, idx) { return { h: 'H', v: 'V', par: '∥' + idx, perp: '⊥' + idx, eq: '=' + idx, len: 'L ' + C.f2(c.v), fix: '⚓', coin: '●', dist: '↔ ' + C.f2(c.v) }[c.t] || '?'; }
function consNear(p) { var best = -1, bd = 16, P = ui.consPos || {}; Object.keys(P).forEach(function (i) { var d = Math.hypot(P[i].x - sx(p.x), P[i].y - sy(p.y)); if (d < bd) { bd = d; best = +i; } }); return best; }
function drawCons() {
  ui.consPos = {};
  if (ui.consHide || !job.cons || !job.cons.length || ui.env !== 'cad') return;
  var ops = opsMap(), css = getComputedStyle(document.documentElement), okc = css.getPropertyValue('--ok').trim() || '#2f7d4f', bad = css.getPropertyValue('--err').trim() || '#c53030';
  ctx.save(); ctx.font = '600 11px ' + (css.getPropertyValue('--f-ui').trim() || 'sans-serif'); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  var stack = {};
  job.cons.forEach(function (c, i) {
    if (!SKETCH.valid(ops, c)) return; var a = consAnchor(c, ops); if (!a) return;
    var key = c.a.op + ':' + c.a.k + (c.t === 'fix' || c.t === 'coin' || c.t === 'dist' ? 'p' : ''), nth = stack[key] = (stack[key] || 0) + 1;
    if (nth > 1) { var A2 = SKETCH.refPts(ops, c.a), L2 = Math.hypot(A2[1].x - A2[0].x, A2[1].y - A2[0].y) || 1; a.dx += (A2[1].x - A2[0].x) / L2 * 34 * (nth - 1); a.dy -= (A2[1].y - A2[0].y) / L2 * 34 * (nth - 1); }
    var sat = SKETCH.satisfied(ops, c), t = consLabel(c, i + 1), X = sx(a.x) + a.dx, Y = sy(a.y) + a.dy, w = ctx.measureText(t).width + 8;
    ctx.fillStyle = css.getPropertyValue('--surface').trim() || '#fff'; ctx.globalAlpha = .92; ctx.fillRect(X - w / 2, Y - 8, w, 16); ctx.globalAlpha = 1;
    ctx.strokeStyle = sat ? okc : bad; ctx.lineWidth = 1; ctx.strokeRect(X - w / 2, Y - 8, w, 16); ui.consPos = ui.consPos || {}; ui.consPos[i] = { x: X, y: Y }; ctx.fillStyle = sat ? okc : bad; ctx.fillText(t, X, Y + 0.5);
  });
  ctx.restore();
}
// doppio clic su un vincolo di lunghezza/distanza: cambia la quota (quota guidante)
cv.addEventListener('dblclick', function (e) {
  if (ui.env !== 'cad' || !job.cons || !job.cons.length) return; var r = cv.getBoundingClientRect(), p = { x: wx(e.clientX - r.left), y: wy(e.clientY - r.top) }, i = consNear(p); if (i < 0) return;
  var c = job.cons[i]; if (c.t !== 'len' && c.t !== 'dist') return; e.stopImmediatePropagation(); ui.draft = null;
  dlg('Quota guidante', field('qL', c.t === 'len' ? 'Lunghezza' : 'Distanza', c.v, { unit: 'mm' }), 'Applica', function () { commit(); c.v = v('qL', c.v); var rs = solveCons(); changed(); if (!rs.ok) toast('Vincoli in conflitto'); });
}, true);

/* ---- trascinamento dei vertici della fresatura selezionata (i vincoli seguono) ---- */
var vdrag = null;
cv.addEventListener('pointerdown', function (e) {
  if (e.button !== 0 || ui.pick || ui.mode !== 'select' || ui.env !== 'cad' || ui.space) return;
  var r = cv.getBoundingClientRect(), hv = hitVertex(e.clientX - r.left, e.clientY - r.top);
  if (!hv || !isSel(hv.op)) return;
  e.stopImmediatePropagation(); commit(); vdrag = { op: hv.op, k: hv.k, moved: false }; try { cv.setPointerCapture(e.pointerId); } catch (er) {}
}, true);
cv.addEventListener('pointermove', function (e) {
  if (!vdrag) return; e.stopImmediatePropagation(); updMouse(evPos(e));
  var p = vdrag.op.pts[vdrag.k]; p.x = r2(ui.mouse.wx); p.y = r2(ui.mouse.wy); vdrag.moved = true; if (!solveCons([p]).ok) solveCons(); draw();
}, true);
cv.addEventListener('pointerup', function (e) { if (!vdrag) return; e.stopImmediatePropagation(); var mv = vdrag.moved; vdrag = null; if (mv) { changed(); refreshPane(); } }, true);

/* ---- Approssima con cerchio (LiteCAD: approx by circle) ---- */
cmd('fitCircle', 'Approssima con cerchio', function () {
  var ops = needSel(1, ['path']); if (!ops) return; var tot = 0; commit();
  ops.forEach(function (o) {
    var pts = C.samplePath(o.pts, o.closed, 2), n = pts.length; if (n < 3) return;
    var sx_ = 0, sy_ = 0; pts.forEach(function (p) { sx_ += p.x; sy_ += p.y; }); var mx = sx_ / n, my = sy_ / n, Suu = 0, Svv = 0, Suv = 0, Suuu = 0, Svvv = 0, Suvv = 0, Svuu = 0;
    pts.forEach(function (p) { var u = p.x - mx, w = p.y - my; Suu += u * u; Svv += w * w; Suv += u * w; Suuu += u * u * u; Svvv += w * w * w; Suvv += u * w * w; Svuu += w * u * u; });
    var det = Suu * Svv - Suv * Suv; if (Math.abs(det) < 1e-9) return;
    var b1 = (Suuu + Suvv) / 2, b2 = (Svvv + Svuu) / 2, uc = (b1 * Svv - b2 * Suv) / det, vc = (Suu * b2 - Suv * b1) / det, R = Math.sqrt(uc * uc + vc * vc + (Suu + Svv) / n);
    var q = getOp(o.id); q.pts = C.circlePath(r2(uc + mx), r2(vc + my), r2(R)); q.closed = true; tot++;
  });
  changed(); toast(tot + ' contorni sostituiti con cerchi');
});

/* ---- Immagine di sfondo per ricalcare (LiteCAD: ImageDraftHelper) ---- */
cmd('bgImage', 'Immagine di sfondo da ricalcare…', function () {
  var inp = document.createElement('input'); inp.type = 'file'; inp.accept = 'image/*';
  inp.onchange = function () {
    var f = inp.files[0]; if (!f) return; var rd = new FileReader();
    rd.onload = function () { var img = new Image(); img.onload = function () {
      setEnv('cad', true); var P = job.panel, w0 = Math.min(P.L, P.W * img.width / img.height);
      dlg('Immagine di sfondo', '<div class="grid2">' + field('qW', 'Larghezza reale', r2(w0), { unit: 'mm' }) + field('qO', 'Opacità', 50, { unit: '%' }) + '</div><div class="grid2">' + ptField('p', 'Angolo in basso a sinistra', 0, 0) + '</div><p class="note">Serve solo da guida per ricalcare con linee, archi e cerchi. Non entra nel part-program e non si salva nel disegno.</p>', 'Mostra', function () {
        var p = vpt('p'); ui.bg = { img: img, x: p.x, y: p.y, w: v('qW', w0), h: v('qW', w0) * img.height / img.width, a: Math.max(.05, Math.min(1, v('qO', 50) / 100)) }; draw();
      });
    }; img.src = rd.result; };
    rd.readAsDataURL(f);
  };
  inp.click();
});
cmd('bgClear', 'Togli immagine di sfondo', function () { ui.bg = null; draw(); });
function drawBg() { var b = ui.bg; if (!b || ui.env !== 'cad') return; ctx.save(); ctx.globalAlpha = b.a; ctx.drawImage(b.img, sx(b.x), sy(b.y + b.h), b.w * view.s, b.h * view.s); ctx.restore(); }

Object.assign(HELP, {
  cH: ['Vincolo: il tratto resta orizzontale.'], cV: ['Vincolo: il tratto resta verticale.'], cPar: ['Vincolo: due tratti paralleli.'], cPerp: ['Vincolo: due tratti perpendicolari.'], cEq: ['Vincolo: due tratti della stessa lunghezza.'],
  cLen: ['Quota guidante: il tratto ha la lunghezza data; doppio clic sul simbolo per cambiarla e il disegno si adatta.'], cDist: ['Quota guidante tra due vertici.'], cFix: ['Blocca un vertice nella sua posizione.'], cCoin: ['Unisce due vertici (anche di fresature diverse).'],
  cDel: ['Cancella i vincoli su cui clicchi.'], cClear: ['Cancella tutti i vincoli.'], cShow: ['Mostra o nasconde i simboli dei vincoli (verde = rispettato, rosso = in conflitto).'], cSolve: ['Ricalcola il disegno rispettando tutti i vincoli.'],
  fitCircle: ['Sostituisce il contorno selezionato con il cerchio che lo approssima meglio (utile dopo import DXF/SVG).'], bgImage: ['Mette sotto il disegno una foto o una scansione in scala, per ricalcarla.'], bgClear: ['Toglie l\'immagine di sfondo.']
});
