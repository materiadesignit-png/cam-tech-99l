
/* ================= mouse ================= */
var drag = null;
function evPos(e) { var r = cv.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; }
function updMouse(p) {
  var m = ui.mouse; m.px = p.x; m.py = p.y; m.inside = true;
  var X = wx(p.x), Y = wy(p.y), f = worldToFace(X, Y); m.rx = X; m.ry = Y;
  m.face = f.face; m.snap = null;
  if (f.face >= 2 && (ui.mode === 'hole' || ui.mode === 'row') && !ui.pick) { m.pos = snapV(f.pos, 0); m.z = snapZ(f.z); var w = faceToWorld(f.face, m.pos, m.z); m.wx = w.x; m.wy = w.y; }
  else {
    m.wx = snapV(X, ui.origin.x); m.wy = snapV(Y, ui.origin.y);
    if (ui.osnap && (ui.mode !== 'select' || ui.pick)) { var sp = osnapAt(p.x, p.y); if (sp) { m.wx = sp.x; m.wy = sp.y; m.snap = sp; } }
  }
  if (ui.draft && ui.draft.kind === 'path' && ui.draft.pts.length && ui.shift) { var L = ui.draft.pts[ui.draft.pts.length - 1]; if (Math.abs(m.wx - L.x) > Math.abs(m.wy - L.y)) m.wy = L.y; else m.wx = L.x; }
  $('sX').textContent = (f.face >= 2 && ui.mode === 'hole' ? m.pos : m.wx - ui.origin.x).toFixed(2);
  $('sY').textContent = (f.face >= 2 && ui.mode === 'hole' ? job.panel.T / 2 : m.wy - ui.origin.y).toFixed(2);
  $('sF').textContent = f.face ? FACE_SHORT[f.face] : '–';
}
cv.addEventListener('pointerdown', function (e) {
  cv.focus(); var p = evPos(e); updMouse(p); try { cv.setPointerCapture(e.pointerId); } catch (er) {}
  var m = ui.mouse;
  if (ui.anim) stopAnim();
  if (e.button === 1 || e.button === 2 || ui.mode === 'pan' || ui.space) { drag = { kind: 'pan', sx: p.x, sy: p.y, ox: view.ox, oy: view.oy }; return; }
  if (ui.pick) {
    var pk = ui.pick;
    if (pk.vertex) { var hv = hitVertex(p.x, p.y); if (!hv) return toast('Clic vicino a un vertice di una fresatura'); pk.cb(hv); }
    else if (pk.entity) { var he = hit(p.x, p.y); if (!he) return toast('Clic su una lavorazione'); pk.cb(he); }
    else pk.cb({ x: m.wx, y: m.wy });
    draw(); return;
  }
  if (ui.mode === 'zoomwin') { drag = { kind: 'zoomwin', sx: p.x, sy: p.y }; return; }
  if (ui.mode === 'select') {
    var h = hit(p.x, p.y);
    if (h) {
      if (e.shiftKey || e.ctrlKey) { var i = ui.sel.indexOf(h.id); if (i >= 0) ui.sel.splice(i, 1); else ui.sel.push(h.id); refreshPane(); draw(); return; }
      if (!isSel(h)) ui.sel = [h.id];
      drag = { kind: 'move', sx: m.wx, sy: m.wy, start: selOps().map(clone), moved: false };
      refreshPane(); draw();
    } else drag = { kind: 'win', sx: p.x, sy: p.y, add: e.shiftKey };
    return;
  }
  var D = ui.draft;
  if (ui.mode === 'hole') {
    if (m.face === 1) addOps([{ type: 'hole', face: 1, x: m.wx, y: m.wy, d: ui.def.d, depth: ui.def.depth }]);
    else if (m.face >= 2) addOps([{ type: 'hole', face: m.face, pos: r2(m.pos), z: r2(m.z != null ? m.z : job.panel.T / 2), d: ui.hdef || 8, depth: ui.def.hdepth }]);
    else toast('Clic sul pannello o su un fianco');
    return;
  }
  if (ui.mode === 'row') { if (!D) ui.draft = { kind: 'row', x: m.wx, y: m.wy }; else { addOps([rowFromDrag(D.x, D.y, m.wx, m.wy)]); ui.draft = null; } draw(); return; }
  if (ui.mode === 'rect') { if (!D) ui.draft = { kind: 'rect', x: m.wx, y: m.wy, down: p }; else finishRect(); draw(); return; }
  if (ui.mode === 'circle') { if (!D) ui.draft = { kind: 'circle', x: m.wx, y: m.wy }; else finishCircle(); draw(); return; }
  if (ui.mode === 'pocket') {
    if (ui.def.pocketShape === 'circle') { if (!D) ui.draft = { kind: 'circle', x: m.wx, y: m.wy, pocket: true }; else finishCircle(); }
    else { if (!D) ui.draft = { kind: 'rect', x: m.wx, y: m.wy, down: p, pocket: true }; else finishRect(); }
    draw(); return;
  }
  if (ui.mode === 'path') {
    if (!D) { ui.draft = { kind: 'path', pts: [{ x: m.wx, y: m.wy, b: 0 }] }; setPrompt('Indica il punto successivo. Clic sul primo punto per chiudere, doppio clic o Invio per finire.'); draw(); return; }
    var f0 = D.pts[0];
    if (D.pts.length > 2 && Math.hypot(sx(f0.x) - p.x, sy(f0.y) - p.y) < 9) { finishPath(true); return; }
    var last = D.pts[D.pts.length - 1];
    if (Math.hypot(last.x - m.wx, last.y - m.wy) > 1e-6) D.pts.push({ x: m.wx, y: m.wy, b: 0 });
    draw();
  }
});
cv.addEventListener('pointermove', function (e) {
  var p = evPos(e); updMouse(p);
  if (drag && drag.kind === 'pan') { view.ox = drag.ox + p.x - drag.sx; view.oy = drag.oy + p.y - drag.sy; }
  else if (drag && (drag.kind === 'win' || drag.kind === 'zoomwin')) {
    var r = $('selrect'); r.hidden = false; r.style.left = Math.min(p.x, drag.sx) + 'px'; r.style.top = Math.min(p.y, drag.sy) + 'px'; r.style.width = Math.abs(p.x - drag.sx) + 'px'; r.style.height = Math.abs(p.y - drag.sy) + 'px';
    r.style.borderStyle = drag.kind === 'win' && p.x < drag.sx ? 'dashed' : 'solid';
  } else if (drag && drag.kind === 'move') {
    var m = ui.mouse, dx = m.wx - drag.sx, dy = m.wy - drag.sy;
    if (!drag.moved && Math.hypot(dx, dy) * view.s < 3) { draw(); return; }
    if (!drag.moved) { commit(); drag.moved = true; }
    drag.start.forEach(function (s) {
      var i = opIndex(s.id); if (i < 0 || s.type === 'trim') return;
      var o = s.type === 'hole' && s.face !== 1 ? G.transformSideHole(s, 'move', { dx: dx, dy: dy }) : G.transformOp(s, G.moveF(dx, dy), false, job.panel);
      if (o && !Array.isArray(o)) { o.id = s.id; job.ops[i] = o; }
    });
  }
  draw();
});
cv.addEventListener('pointerup', function (e) {
  var p = evPos(e), r = $('selrect');
  if (drag && drag.kind === 'move' && drag.moved) changed();
  if (drag && drag.kind === 'win') {
    r.hidden = true;
    if (Math.hypot(p.x - drag.sx, p.y - drag.sy) < 4) { if (!drag.add) { ui.sel = []; } }
    else { var ids = windowSelect(drag.sx, drag.sy, p.x, p.y, p.x < drag.sx); ui.sel = drag.add ? ui.sel.concat(ids.filter(function (id) { return ui.sel.indexOf(id) < 0; })) : ids; }
    refreshPane(); draw();
  }
  if (drag && drag.kind === 'zoomwin') {
    r.hidden = true;
    if (Math.hypot(p.x - drag.sx, p.y - drag.sy) > 6) { pushView(); fitBox(Math.min(wx(drag.sx), wx(p.x)), Math.min(wy(drag.sy), wy(p.y)), Math.max(wx(drag.sx), wx(p.x)), Math.max(wy(drag.sy), wy(p.y)), 10); }
    setMode('select');
  }
  drag = null;
  var D = ui.draft;
  if (D && D.kind === 'rect' && D.down && Math.hypot(p.x - D.down.x, p.y - D.down.y) > 6) finishRect();
});
cv.addEventListener('dblclick', function () { if (ui.draft && ui.draft.kind === 'path') finishPath(false); else if (ui.mode === 'select' && ui.sel.length === 1) { focusPane(); } });
cv.addEventListener('pointerleave', function () { ui.mouse.inside = false; draw(); });
cv.addEventListener('contextmenu', function (e) { e.preventDefault(); });
cv.addEventListener('wheel', function (e) { e.preventDefault(); var p = evPos(e); zoomAt(e.deltaY < 0 ? 1.15 : 1 / 1.15, p.x, p.y); }, { passive: false });

function rowFromDrag(x0, y0, x1, y1) {
  var dx = x1 - x0, dy = y1 - y0, dir = Math.abs(dx) >= Math.abs(dy) ? 'X' : 'Y', len = dir === 'X' ? dx : dy, step = ui.def.step;
  var n = Math.max(1, Math.floor(Math.abs(len) / step + 1e-6) + 1);
  return { type: 'row', dir: dir, x: r2(dir === 'X' && len < 0 ? x0 - (n - 1) * step : x0), y: r2(dir === 'Y' && len < 0 ? y0 - (n - 1) * step : y0), d: ui.def.d, step: step, n: n, depth: ui.def.depth };
}
function newPocket(o) { var d = ui.def; return Object.assign({ type: 'pocket', tool: d.millTool, depth: d.millDepth, passes: 1, stepover: d.stepover, dir: d.pocketDir, radius: d.radius }, o); }
function newPath(pts, closed, extra) { var d = ui.def; return Object.assign({ type: 'path', pts: pts, closed: !!closed, tool: d.millTool, depth: d.millDepth, corr: closed ? d.corr : 'C', passes: 1 }, extra || {}); }
function finishRect() {
  var D = ui.draft, m = ui.mouse; ui.draft = null;
  if (Math.abs(m.wx - D.x) < 0.5 || Math.abs(m.wy - D.y) < 0.5) { draw(); return; }
  if (D.pocket) addOps([newPocket({ shape: 'rect', x: r2(Math.min(D.x, m.wx)), y: r2(Math.min(D.y, m.wy)), x2: r2(Math.max(D.x, m.wx)), y2: r2(Math.max(D.y, m.wy)) })]);
  else addOps([newPath(C.rectPath(D.x, D.y, m.wx, m.wy, ui.def.radius), true)]);
}
function finishCircle() {
  var D = ui.draft, m = ui.mouse, r = r2(Math.hypot(m.wx - D.x, m.wy - D.y)); ui.draft = null;
  if (r < 0.5) { draw(); return; }
  if (D.pocket) addOps([newPocket({ shape: 'circle', x: D.x, y: D.y, r: r })]); else addOps([newPath(C.circlePath(D.x, D.y, r), true)]);
}
function finishPath(closed) {
  var D = ui.draft; ui.draft = null;
  var pts = D.pts.filter(function (p, i) { return i === 0 || Math.hypot(p.x - D.pts[i - 1].x, p.y - D.pts[i - 1].y) > 1e-6; });
  if (pts.length < 2) { draw(); return; }
  addOps([newPath(pts, closed)]); setPrompt(PROMPTS.path);
}
function addOps(list, keepSel) {
  commit(); list.forEach(function (o) { o.id = nextId++; job.ops.push(o); });
  if (!keepSel) ui.sel = list.map(function (o) { return o.id; });
  changed();
}

/* ================= tastiera ================= */
document.addEventListener('keydown', function (e) {
  ui.shift = e.shiftKey;
  var tag = (e.target.tagName || '').toLowerCase();
  if (tag === 'input' || tag === 'textarea' || tag === 'select') { if (e.key === 'Enter' && tag === 'input' && $('mOk')) { e.preventDefault(); $('mOk').click(); } return; }
  if ($('modal').firstChild && !ui.pick) { if (e.key === 'Escape') closeModal(); if (e.key === 'Enter' && $('mOk')) $('mOk').click(); return; }
  if (e.key === ' ') { ui.space = true; e.preventDefault(); return; }
  var k = e.key.toLowerCase();
  if ((e.ctrlKey || e.metaKey) && k === 'z') { e.preventDefault(); e.shiftKey ? redo() : undo(); return; }
  if ((e.ctrlKey || e.metaKey) && k === 'y') { e.preventDefault(); redo(); return; }
  if ((e.ctrlKey || e.metaKey) && k === 's') { e.preventDefault(); run('save'); return; }
  if ((e.ctrlKey || e.metaKey) && k === 'a') { e.preventDefault(); ui.sel = job.ops.map(function (o) { return o.id; }); refreshPane(); draw(); return; }
  if ((e.ctrlKey || e.metaKey) && k === 'd') { e.preventDefault(); run('copy'); return; }
  if (e.ctrlKey || e.metaKey || e.altKey) return;
  if (e.key === 'Escape') { if (ui.anim) return stopAnim(); if (ui.pick) return cancelPick(); if (ui.draft) { ui.draft = null; draw(); } else if (ui.mode !== 'select') setMode('select'); else { ui.sel = []; refreshPane(); draw(); } return; }
  if (e.key === 'Enter' && ui.draft && ui.draft.kind === 'path') { finishPath(false); return; }
  if (e.key === 'Backspace' && ui.draft && ui.draft.kind === 'path') { e.preventDefault(); ui.draft.pts.pop(); if (!ui.draft.pts.length) ui.draft = null; draw(); return; }
  if ((e.key === 'Delete' || e.key === 'Backspace') && ui.sel.length) { e.preventDefault(); run('del'); return; }
  if (e.key.indexOf('Arrow') === 0 && ui.sel.length) { e.preventDefault(); var st = e.shiftKey ? ui.grid * 10 : ui.grid; moveSel(e.key === 'ArrowLeft' ? -st : e.key === 'ArrowRight' ? st : 0, e.key === 'ArrowDown' ? -st : e.key === 'ArrowUp' ? st : 0); return; }
  if (ui.env === 'sup' || ui.env === 'fer' || ui.env === 'mob' || ui.env === 'lc') return;
  var map = { v: 'selectMode', f: 'hole', l: 'row', p: 'pathMode', r: 'rect', c: 'circleMode', t: 'pocketMode', q: 'trim', '0': 'zFace', e: 'zExt', w: 'zWin', o: 'osnap', g: 'gridSnap' };
  if (e.key === '+') return zoomAt(1.2, W / 2, H / 2);
  if (e.key === '-') return zoomAt(1 / 1.2, W / 2, H / 2);
  if (map[k]) run(map[k]);
});
document.addEventListener('keyup', function (e) { ui.shift = e.shiftKey; if (e.key === ' ') ui.space = false; });

function moveSel(dx, dy) {
  var ops = selOps(); if (!ops.length) return; commit();
  ops.forEach(function (s) { var i = opIndex(s.id); var o = s.type === 'hole' && s.face !== 1 ? G.transformSideHole(s, 'move', { dx: dx, dy: dy }) : G.transformOp(s, G.moveF(dx, dy), false, job.panel); if (o && !Array.isArray(o)) { o.id = s.id; job.ops[i] = o; } });
  changed();
}
// applica una trasformazione alla selezione; copy=true crea copie
function transformSel(f, flip, copy, sideKind, sideArg) {
  var ops = selOps().filter(function (o) { return o.type !== 'trim'; }); if (!ops.length) { toast('Seleziona prima le lavorazioni'); return 0; }
  commit(); var newIds = [], n = 0;
  ops.forEach(function (s) {
    var o = s.type === 'hole' && s.face !== 1 ? (sideKind ? G.transformSideHole(s, sideKind, sideArg) : null) : G.transformOp(s, f, flip, job.panel);
    if (!o) return; var list = Array.isArray(o) ? o : [o]; n++;
    if (copy) list.forEach(function (q) { q.id = nextId++; job.ops.push(q); newIds.push(q.id); });
    else { var i = opIndex(s.id); list.forEach(function (q, k) { q.id = k === 0 ? s.id : nextId++; }); job.ops.splice.apply(job.ops, [i, 1].concat(list)); }
  });
  if (copy) ui.sel = newIds;
  changed(); return n;
}

/* ================= modo / prompt ================= */
var PROMPTS = {
  select: 'Selezione: clic su un\'entità (Maiusc per aggiungere), trascina per selezionare a finestra. Trascina un\'entità selezionata per spostarla.',
  hole: 'Foro: clic sul pannello per un foro verticale, sulle fasce esterne per un foro orizzontale.',
  row: 'Barriera: clic sul primo foro, poi sull\'ultimo.',
  path: 'Fresatura: clic sui punti. Clic sul primo punto chiude, doppio clic o Invio termina, Backspace toglie l\'ultimo, Maiusc blocca orizzontale/verticale.',
  rect: 'Rettangolo: trascina o clic su due angoli opposti.',
  circle: 'Cerchio: clic sul centro, poi sul bordo.',
  pocket: 'Tasca: rettangolare trascinando, circolare con centro e bordo (forma nell\'area comando).',
  zoomwin: 'Zoom finestra: trascina il rettangolo da ingrandire.',
  pan: 'Pan: trascina per spostare la vista. Esc per uscire.'
};
function setPrompt(t) { $('prompt').textContent = t || ''; }
function setMode(m) { ui.mode = m; ui.draft = null; if (m !== 'select' && ui.env === 'cad') ui.sel = []; setPrompt(PROMPTS[m] || ''); renderToolbar(); refreshPane(); draw(); }

/* ================= selezione punti/vertici durante i comandi ================= */
function pickPoint(msg, cb, from) { ui.pick = { cb: function (p) { ui.pick = null; cb(p); }, from: from }; setPrompt(msg); draw(); }
function pickVertex(msg, cb) { ui.pick = { vertex: true, cb: cb }; setPrompt(msg + ' (Esc per terminare)'); draw(); }
function pickEntity(msg, cb) { ui.pick = { entity: true, cb: cb }; setPrompt(msg + ' (Esc per terminare)'); draw(); }
function cancelPick() { ui.pick = null; ui.blades = null; var md = $('modal').querySelector('.modal'); if (md) md.classList.remove('picking'); setPrompt(PROMPTS[ui.mode] || ''); draw(); }

/* ================= dialoghi ================= */
function field(id, label, value, opts) {
  opts = opts || {};
  var unit = opts.unit ? ' <span class="unit">' + opts.unit + '</span>' : '';
  if (opts.select) return '<label class="f' + (opts.wide ? ' wide' : '') + '">' + label + unit + '<select id="' + id + '">' + opts.select.map(function (o) { return '<option value="' + esc(o[0]) + '"' + (String(o[0]) === String(value) ? ' selected' : '') + '>' + esc(o[1]) + '</option>'; }).join('') + '</select></label>';
  return '<label class="f' + (opts.wide ? ' wide' : '') + '">' + label + unit + '<input id="' + id + '" value="' + esc(value == null ? '' : value) + '"' + (opts.ph != null ? ' placeholder="' + esc(opts.ph) + '"' : '') + (opts.text ? '' : ' inputmode="decimal"') + '></label>';
}
// coppia X/Y con pulsante per indicare il punto sul disegno (coordinate rispetto all'origine corrente)
function ptField(id, label, x, y) {
  return '<div class="pick">' + field(id + 'x', label + ' X', r2(x - ui.origin.x), { unit: 'mm' }) + field(id + 'y', label + ' Y', r2(y - ui.origin.y), { unit: 'mm' }) +
    '<button class="pickb" type="button" data-pick="' + id + '" title="Indica ' + esc(label.toLowerCase()) + ' sul disegno">⌖</button></div>';
}
function chk(id, label, on) { return '<label class="chk"><input type="checkbox" id="' + id + '"' + (on ? ' checked' : '') + '> ' + label + '</label>'; }
function modal(html, wide) {
  $('modal').innerHTML = '<div class="modal' + (wide ? ' wide' : '') + '"><div class="card">' + html + '</div></div>';
  $('modal').querySelectorAll('[data-pick]').forEach(function (b) {
    b.addEventListener('click', function () {
      var id = b.dataset.pick, md = $('modal').querySelector('.modal'); md.classList.add('picking');
      pickPoint('Indica il punto sul disegno (Esc per annullare)', function (p) { $(id + 'x').value = r2(p.x - ui.origin.x); $(id + 'y').value = r2(p.y - ui.origin.y); md.classList.remove('picking'); setPrompt(''); });
    });
  });
  var first = $('modal').querySelector('input,select,button'); if (first) first.focus();
}
function closeModal() { $('modal').innerHTML = ''; if (ui.pick) cancelPick(); }
$('modal').addEventListener('click', function (e) { if (e.target.classList.contains('modal') && !e.target.classList.contains('picking')) closeModal(); });
function v(id, def) { var el = $(id); return el ? num(el.value, def) : def; }
function vpt(id) { return { x: v(id + 'x', 0) + ui.origin.x, y: v(id + 'y', 0) + ui.origin.y }; }
function dlg(title, body, okLabel, onOk, wide) {
  modal('<h2>' + title + '</h2>' + body + '<div class="row"><button class="btn primary" id="mOk">' + (okLabel || 'OK') + '</button><button class="btn" id="mNo">Annulla</button></div>', wide);
  $('mNo').onclick = closeModal; $('mOk').onclick = function () { var r = onOk(); if (r !== false) closeModal(); };
}
function mirrorRow() { return '<div class="row">' + chk('qMx', 'Specchia in X', false) + chk('qMy', 'Specchia in Y', false) + chk('qOp', 'Opponi', false) + '</div>'; }
// Specchia in X/Y e Opponi dei dialoghi di Task: copie simmetriche rispetto al centro del pannello
function withMirrors(list) {
  var P = job.panel, mx = $('qMx') && $('qMx').checked, my = $('qMy') && $('qMy').checked, op = $('qOp') && $('qOp').checked, out = [];
  function mir(o, axis) { var r = o.type === 'hole' && o.face !== 1 ? G.transformSideHole(o, 'mirror', { axis: axis, v: axis === 'X' ? P.L / 2 : P.W / 2 }) : G.transformOp(o, G.mirrorF(axis, axis === 'X' ? P.L / 2 : P.W / 2), true, P); return Array.isArray(r) ? r : [r]; }
  list.forEach(function (o) {
    var set = [o];
    if (mx) set.slice().forEach(function (q) { set = set.concat(mir(q, 'X')); });
    if (my) set.slice().forEach(function (q) { set = set.concat(mir(q, 'Y')); });
    if (op && !mx && !my) set = set.concat(mir(mir(o, 'X')[0], 'Y'));
    out = out.concat(set);
  });
  return out.filter(Boolean);
}
function drillDiams() {
  var ds = {}; job.tools.forEach(function (t) { if (t.kind === 'V' || t.kind === 'H') ds[t.d] = (ds[t.d] || '') + t.kind; });
  var arr = Object.keys(ds).map(Number).sort(function (a, b) { return a - b; }).map(function (d) { return [d, 'Ø' + d + (ds[d].indexOf('V') < 0 ? ' (solo orizz.)' : ds[d].indexOf('H') < 0 ? '' : ' (V+H)')]; });
  if (!arr.some(function (a) { return a[0] === ui.def.d; })) arr.unshift([ui.def.d, 'Ø' + ui.def.d + ' (non in attrezzaggio)']);
  return arr;
}
function millFields(depthDef) { return field('qT', 'Fresa', ui.def.millTool, { select: millOpts() }) + field('qP', 'Profondità', depthDef == null ? ui.def.millDepth : depthDef, { unit: 'mm' }); }
function corrField(def, open) { return field('qC', 'Correzione', def || (open ? 'C' : ui.def.corr), { select: open ? [['C', 'In asse'], ['L', 'Sinistra G142'], ['R', 'Destra G141']] : [['IN', 'Interno'], ['OUT', 'Esterno'], ['C', 'In asse'], ['L', 'Sinistra G142'], ['R', 'Destra G141']] }); }
function pathFromDialog(pts, closed) { return newPath(pts, closed, { tool: $('qT').value, depth: v('qP', ui.def.millDepth), corr: $('qC') ? $('qC').value : 'C' }); }

/* ================= toast ================= */
var tt = null;
function toast(msg) { var el = document.querySelector('.toast'); if (!el) { el = document.createElement('div'); el.className = 'toast'; el.setAttribute('role', 'status'); document.body.appendChild(el); } el.textContent = msg; el.hidden = false; clearTimeout(tt); tt = setTimeout(function () { el.hidden = true; }, 2800); }
