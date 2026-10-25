(function () {
'use strict';
var C = CORE, G = GEOM;
var $ = function (id) { return document.getElementById(id); };
function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
function num(v, d) { var n = parseFloat(String(v).replace(',', '.')); return isFinite(n) ? n : d; }
function r2(v) { return Math.round(v * 100) / 100; }
function clone(o) { return JSON.parse(JSON.stringify(o)); }
function css(name) { return getComputedStyle(document.documentElement).getPropertyValue(name).trim(); }
function lsGet(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
function lsSet(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }

/* ================= stato ================= */
var FACE_NAMES = { 1: 'Superiore', 2: 'Fianco anteriore', 3: 'Fianco destro', 4: 'Fianco posteriore', 5: 'Fianco sinistro' };
var FACE_SHORT = { 1: '1 sup.', 2: '2 ant.', 3: '3 dx', 4: '4 post.', 5: '5 sx' };
var CORR_NAMES = { IN: 'Interno', OUT: 'Esterno', C: 'In asse', L: 'Sinistra (G142)', R: 'Destra (G141)' };
var KIND_NAMES = { V: 'Punta verticale', H: 'Punta orizzontale', F: 'Fresa', L: 'Lama' };
var nextId = 1;

// Attrezzaggio DEF della macchina: Utente\Def.TLD (mandrino -> utensile) + Dati\pheads.par (teste, facce, offset) + Dati\TOOLS.par / ExtTools.par (tipo, misure, giri).
// Campi come nella finestra "Modifica attrezzaggio" di Task. Offset Y mostrato col segno di Task (opposto a pheads.par).
var TOOLS_VER = 3;
function machineTools() {
  var t = [], VOFF = [[0, 0], [0, -32], [0, -64], [0, -96], [0, -128], [-32, -128], [-64, -128], [-96, -128], [-128, -128], [-160, -128]];
  VOFF.forEach(function (o, i) {
    t.push({ code: String(i + 1), kind: 'V', group: 'fixed', face: 1, d: 10, len: 75, lut: 30, tipo: 'Piatta', svas: 0, rot: 'CW', rpm: 2000, rpmMax: 2000, feed: 1000,
      off: { x: o[0], y: -o[1], z: 0, a: 0, alfa: 0, d: 0 }, descr: 'Mandrino ' + (i + 1) + ' testa verticale' });
  });
  t[8].d = 8; t[8].len = 73.18; // utensile 9 come nell'attrezzaggio di Task (schermata del 22/10/2026)
  [[58, 4, 32.2, -18, -65.7, 270], [59, 5, 32.2, -129, -65.7, 90], [60, 2, -173.7, -159.8, -65.9, 0], [61, 3, -62.5, -160, -65.8, 180]].forEach(function (h) {
    t.push({ code: String(h[0]), kind: 'H', group: 'fixed', face: h[1], d: 8, len: 55, lut: 25, tipo: 'Piatta', svas: 0, rot: 'CW', rpm: 2000, rpmMax: 2000, feed: 1000,
      off: { x: h[2], y: -h[3], z: h[4], a: h[5], alfa: 90, d: 0 }, descr: 'Mandrino orizzontale faccia ' + h[1] });
  });
  [[80, 'CCW', -43.2, 268.5, 0], [81, 'CW', 1.75, 223.15, 90]].forEach(function (l) {
    t.push({ code: String(l[0]), kind: 'L', group: 'fixed', face: 1, d: 240, thick: 4, len: 0, lut: 20, tipo: 'Lama', rot: l[1], rpm: 4000, rpmMax: 4000, feed: 3000,
      off: { x: l[2], y: -l[3], z: -5.05, a: l[4], alfa: 90, d: 0 }, descr: 'Lama ' + l[0] + ' (raggio 120, spessore 4)' });
  });
  ['44', '45'].forEach(function (c) {
    t.push({ code: c, kind: 'F', group: 'fixed', face: 1, d: 10, len: 163, lut: 30, tipo: 'Cilindrica', rot: 'CW', rpm: 18000, rpmMax: 18000, feed: 5000, feedIn: 4000,
      off: { x: 1.1, y: 340.7, z: 56.3, a: 0, alfa: 0, d: 0 }, descr: 'Elettromandrino ' + c + ' (12000 standard nei dati)' });
  });
  for (var e = 0; e <= 4; e++) t.push({ code: String(100 + e), kind: 'F', group: 'change', face: 1, d: 10, len: e === 4 ? 80.2 : 80, lut: e === 1 ? 20 : 30, tipo: 'Cilindrica', rot: 'CW', rpm: 18000, rpmMax: 24000, feed: 4000, feedIn: 4000,
    off: { x: 0, y: 0, z: 0, a: 0, alfa: 0, d: 0 }, descr: 'Magazzino posto ' + e });
  return t;
}
function defaultSettings() {
  return { progName: 'NUOVO', battuta: 'A', attrezzaggio: 'DEF', R: 1, offU: 0, offV: 0, offW: 0, sideFlip: true,
    drillFeed: 2000, drillRpm: 4000, millFeedIn: 4000, millFeed: 5000, millRpm: 18000 };
}
function newJob(name, L, W, T, comment) {
  var s = defaultSettings(); s.progName = C.progName({ progName: name || 'NUOVO' });
  return { version: 3, toolsVer: TOOLS_VER, name: s.progName, comment: comment || '', panel: { L: L || 600, W: W || 400, T: T || 18 }, settings: s, tools: currentTools(), supports: [], ops: [], blocks: {}, optimized: false };
}
function exampleMill() {
  // fresatura ABCDEF dell'addestramento di Task: rette 1-5, raccordi R40 in B, C, D, E
  var o = { type: 'path', pts: [{ x: -30, y: 200, b: 0 }, { x: 100, y: 200, b: 0 }, { x: 200, y: 100, b: 0 }, { x: 600, y: 100, b: 0 }, { x: 700, y: 200, b: 0 }, { x: 830, y: 200, b: 0 }], closed: false, tool: '44', depth: 10, corr: 'C', passes: 1, note: 'Fresatura ABCDEF' };
  [4, 3, 2, 1].forEach(function (k) { var r = G.filletAt(o, k, 40, false); if (r.op) o = r.op; });
  return o;
}
function exampleJob() {
  var j = newJob('ESEMPIO', 800, 600, 20, 'Esercizio del manuale di Task (cap. 19)');
  var ops = [
    exampleMill(),
    { type: 'row', dir: 'X', x: 50, y: 50, d: 10, step: 32, n: 5, depth: 5 },
    { type: 'hole', face: 1, x: 650, y: 550, d: 10, depth: 5 }, { type: 'hole', face: 1, x: 682, y: 550, d: 10, depth: 5 }, { type: 'hole', face: 1, x: 714, y: 550, d: 10, depth: 5 },
    { type: 'hole', face: 1, x: 30, y: 250, d: 10, depth: 5 }, { type: 'hole', face: 1, x: 30, y: 314, d: 10, depth: 5 }, { type: 'hole', face: 1, x: 770, y: 250, d: 10, depth: 5 }, { type: 'hole', face: 1, x: 770, y: 314, d: 10, depth: 5 },
    { type: 'pocket', shape: 'rect', x: 340, y: 380, x2: 460, y2: 460, radius: 10, tool: '44', depth: 8, passes: 1, stepover: 70, dir: 'CCW' }
  ];
  ops.forEach(function (o) { o.id = nextId++; });
  j.ops = ops; j.example = true; return j;
}
var TOOLS_KEY = 'camtech99l.tools.v3';
function currentTools() { try { var t = JSON.parse(lsGet(TOOLS_KEY)); if (t && t.length) return t; } catch (e) {} return machineTools(); }

var ARCH_KEY = 'camtech99l.archive.v1', CUR_KEY = 'camtech99l.current.v3';
var archive = {};
try { archive = JSON.parse(lsGet(ARCH_KEY)) || {}; } catch (e) { archive = {}; }
function saveArchive() { lsSet(ARCH_KEY, JSON.stringify(archive)); }

function migrate(j) {
  if (j && !Array.isArray(j.cons)) j.cons = [];
  if (j && !Array.isArray(j.dims)) j.dims = [];
  j.settings = Object.assign(defaultSettings(), j.settings || {});
  j.settings.offU = 0; j.settings.offV = 0; j.settings.offW = 0; // controsagome sempre a zero
  j.supports = j.supports || []; j.blocks = j.blocks || {}; j.ops = j.ops || [];
  if (!j.tools || !j.tools.length || (j.toolsVer || 0) < TOOLS_VER) { j.tools = currentTools(); j.toolsVer = TOOLS_VER; }
  if (!j.name) j.name = j.settings.progName || 'NUOVO';
  if (j.comment == null) j.comment = '';
  return j;
}
function fixIds() { job.ops.forEach(function (o) { if (!o.id) o.id = nextId++; nextId = Math.max(nextId, o.id + 1); }); }

var job;
(function () { var t = lsGet(CUR_KEY); try { job = t ? JSON.parse(t) : null; } catch (e) { job = null; } })();
job = migrate(job || exampleJob()); fixIds();
var hist = [], fut = [], dirty = false;

var ui = {
  env: 'cad', mode: 'select', sel: [], grid: 5, snap: true, osnap: true, exploded: true, origin: { x: 0, y: 0 },
  def: { d: 10, depth: 12, hdepth: 22, step: 32, millTool: '44', millDepth: 5, corr: 'IN', radius: 0, pocketShape: 'rect', stepover: 70, pocketDir: 'CCW' },
  draft: null, mouse: { x: 0, y: 0, wx: 0, wy: 0, face: 1 }, pick: null, archSel: null,
  camShow: { widths: true, rapids: true, numbers: true }, anim: null
};
var view = { s: 1, ox: 0, oy: 0 }, viewStack = [];

function persist() { lsSet(CUR_KEY, JSON.stringify(job)); }
function commit() { hist.push(JSON.stringify(job)); if (hist.length > 150) hist.shift(); fut = []; }
function changed(keepOpt) { if (!keepOpt) job.optimized = false; job.example = false; dirty = true; persist(); refresh(); }
function undo() { if (!hist.length) return toast('Niente da annullare'); fut.push(JSON.stringify(job)); job = migrate(JSON.parse(hist.pop())); fixIds(); ui.sel = ui.sel.filter(getOp); persist(); refresh(); toast('Annullato'); }
function redo() { if (!fut.length) return toast('Niente da ripristinare'); hist.push(JSON.stringify(job)); job = migrate(JSON.parse(fut.pop())); fixIds(); persist(); refresh(); toast('Ripristinato'); }
function getOp(id) { for (var i = 0; i < job.ops.length; i++) if (job.ops[i].id === id) return job.ops[i]; return null; }
function opIndex(id) { for (var i = 0; i < job.ops.length; i++) if (job.ops[i].id === id) return i; return -1; }
function selOps() { return ui.sel.map(getOp).filter(Boolean); }
function primary() { return getOp(ui.sel[ui.sel.length - 1]); }
function millTools() { return job.tools.filter(function (t) { return t.kind === 'F'; }); }
function millOpts() { var m = millTools().map(function (t) { return [t.code, t.code + ' · Ø' + t.d]; }); return m.length ? m : [['', 'nessuna fresa']]; }

/* ================= facce laterali (vista in esploso) ================= */
function strip() { return { G: 40, H: Math.max(job.panel.T * 3, 54) }; }
function faceToWorld(face, pos, z) {
  var P = job.panel, st = strip(), k = st.H / P.T;
  if (face === 2) return { x: pos, y: -st.G - st.H + z * k };
  if (face === 4) return { x: pos, y: P.W + st.G + st.H - z * k };
  if (face === 5) return { x: -st.G - st.H + z * k, y: pos };
  if (face === 3) return { x: P.L + st.G + st.H - z * k, y: pos };
  return { x: pos, y: z };
}
function worldToFace(wx, wy) {
  var P = job.panel, st = strip(), k = st.H / P.T;
  if (ui.exploded) {
    if (wy <= -st.G && wy >= -st.G - st.H && wx >= -1 && wx <= P.L + 1) return { face: 2, pos: wx, z: (wy + st.G + st.H) / k };
    if (wy >= P.W + st.G && wy <= P.W + st.G + st.H && wx >= -1 && wx <= P.L + 1) return { face: 4, pos: wx, z: (P.W + st.G + st.H - wy) / k };
    if (wx <= -st.G && wx >= -st.G - st.H && wy >= -1 && wy <= P.W + 1) return { face: 5, pos: wy, z: (wx + st.G + st.H) / k };
    if (wx >= P.L + st.G && wx <= P.L + st.G + st.H && wy >= -1 && wy <= P.W + 1) return { face: 3, pos: wy, z: (P.L + st.G + st.H - wx) / k };
  }
  if (wx >= -0.5 && wx <= P.L + 0.5 && wy >= -0.5 && wy <= P.W + 0.5) return { face: 1 };
  return { face: 0 };
}

/* ================= canvas ================= */
var cv = $('cv'), ctx = cv.getContext('2d'), dpr = 1, W = 0, H = 0;
function resize() { var r = cv.getBoundingClientRect(); dpr = window.devicePixelRatio || 1; W = r.width; H = r.height; cv.width = Math.max(1, Math.round(W * dpr)); cv.height = Math.max(1, Math.round(H * dpr)); draw(); }
function sx(x) { return view.ox + x * view.s; }
function sy(y) { return view.oy - y * view.s; }
function wx(px) { return (px - view.ox) / view.s; }
function wy(py) { return (view.oy - py) / view.s; }
function pushView() { viewStack.push({ s: view.s, ox: view.ox, oy: view.oy }); if (viewStack.length > 30) viewStack.shift(); }
function fitBox(x0, y0, x1, y1, pad) {
  pad = pad || 30; var bw = Math.max(1, x1 - x0), bh = Math.max(1, y1 - y0);
  view.s = Math.min((W - 2 * pad) / bw, (H - 2 * pad) / bh); if (!(view.s > 0)) view.s = 1;
  view.ox = W / 2 - ((x0 + x1) / 2) * view.s; view.oy = H / 2 + ((y0 + y1) / 2) * view.s; draw();
}
function fitPanel() { var P = job.panel, st = strip(), m = ui.exploded ? st.G + st.H + 24 : 30; fitBox(-m, -m, P.L + m, P.W + m, 20); }
function fitAll() {
  var P = job.panel, b = { x0: 0, y0: 0, x1: P.L, y1: P.W };
  job.ops.forEach(function (op) { var q = G.opBBox(op, P); if (q) { b.x0 = Math.min(b.x0, q.x0); b.y0 = Math.min(b.y0, q.y0); b.x1 = Math.max(b.x1, q.x1); b.y1 = Math.max(b.y1, q.y1); } });
  if (ui.exploded) { var st = strip(); b.x0 = Math.min(b.x0, -st.G - st.H); b.y0 = Math.min(b.y0, -st.G - st.H); b.x1 = Math.max(b.x1, P.L + st.G + st.H); b.y1 = Math.max(b.y1, P.W + st.G + st.H); }
  fitBox(b.x0 - 20, b.y0 - 20, b.x1 + 20, b.y1 + 20, 20);
}
function zoomAt(f, px, py) { var x = wx(px), y = wy(py); view.s = Math.max(0.03, Math.min(80, view.s * f)); view.ox = px - x * view.s; view.oy = py + y * view.s; draw(); }

var pending = false;
function draw() { if (pending) return; pending = true; requestAnimationFrame(function () { pending = false; paint(); }); }
function pathScreen(pts, closed) {
  var s = C.samplePath(pts, closed, 4); ctx.beginPath();
  s.forEach(function (p, i) { if (i) ctx.lineTo(sx(p.x), sy(p.y)); else ctx.moveTo(sx(p.x), sy(p.y)); });
  if (closed) ctx.closePath();
}
function badge(x, y, n, color) {
  var t = String(n); ctx.font = '600 11px ' + css('--f-mono');
  var w = Math.max(16, ctx.measureText(t).width + 8);
  ctx.fillStyle = color; ctx.beginPath(); if (ctx.roundRect) ctx.roundRect(x - w / 2, y - 8, w, 16, 8); else ctx.rect(x - w / 2, y - 8, w, 16); ctx.fill();
  ctx.fillStyle = css('--surface'); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(t, x, y + 0.5);
}
function label2(px, py, t) {
  ctx.font = '500 12px ' + css('--f-mono'); ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
  var x = px + 14, y = py + 24, w = ctx.measureText(t).width + 10;
  ctx.fillStyle = css('--surface'); ctx.fillRect(x - 5, y - 13, w, 18); ctx.fillStyle = css('--ink'); ctx.fillText(t, x, y);
}
function isSel(op) { return ui.sel.indexOf(op.id) >= 0; }
function opStart(op) {
  if (op.type === 'pocket') return op.shape === 'circle' ? { x: op.x, y: op.y } : op.shape === 'poly' ? op.pts[0] : { x: (op.x + op.x2) / 2, y: (op.y + op.y2) / 2 };
  if (op.type === 'trim') return { x: -(op.lead == null ? 20 : op.lead), y: op.inset || 0 };
  if (op.type === 'path') return op.pts[0] || { x: 0, y: 0 };
  if (op.type === 'hole' && op.face !== 1) return faceToWorld(op.face, op.pos, op.z);
  return { x: op.x, y: op.y };
}
var COL = {};
function readCols() { ['bg', 'work', 'grid', 'grid2', 'mdf', 'mdf-edge', 'ink', 'ink2', 'hole', 'hhole', 'mill', 'sel', 'rapid', 'accent', 'err', 'surface', 'ok'].forEach(function (k) { COL[k] = css('--' + k); }); }

function paint() {
  readCols(); var col = COL;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.fillStyle = col.work; ctx.fillRect(0, 0, W, H);
  if (ui.env === 'sup' || ui.env === 'fer' || ui.env === 'mob' || ui.env === 'lc') return;
  var P = job.panel, st = strip(), cam = ui.env === 'cam';
  // griglia
  var g = ui.grid; while (g * view.s < 8) g *= 2;
  var x0 = Math.floor(wx(0) / g) * g, x1 = wx(W), y0 = Math.floor(wy(H) / g) * g, y1 = wy(0);
  ctx.lineWidth = 1;
  for (var gx = x0; gx <= x1; gx += g) { ctx.strokeStyle = Math.abs(gx % (g * 10)) < 1e-6 ? col.grid2 : col.grid; ctx.beginPath(); ctx.moveTo(Math.round(sx(gx)) + .5, 0); ctx.lineTo(Math.round(sx(gx)) + .5, H); ctx.stroke(); }
  for (var gy = y0; gy <= y1; gy += g) { ctx.strokeStyle = Math.abs(gy % (g * 10)) < 1e-6 ? col.grid2 : col.grid; ctx.beginPath(); ctx.moveTo(0, Math.round(sy(gy)) + .5); ctx.lineTo(W, Math.round(sy(gy)) + .5); ctx.stroke(); }
  // fianchi in esploso
  if (ui.exploded) {
    ctx.font = '600 12px ' + css('--f-ui');
    [2, 3, 4, 5].forEach(function (f) {
      var a = faceToWorld(f, 0, 0), b = faceToWorld(f, (f === 2 || f === 4) ? P.L : P.W, P.T);
      var rx = Math.min(sx(a.x), sx(b.x)), ry = Math.min(sy(a.y), sy(b.y)), rw = Math.abs(sx(b.x) - sx(a.x)), rh = Math.abs(sy(b.y) - sy(a.y));
      ctx.fillStyle = col.mdf; ctx.globalAlpha = (ui.mouse.face === f && ui.mode === 'hole') ? 0.95 : 0.55; ctx.fillRect(rx, ry, rw, rh); ctx.globalAlpha = 1;
      ctx.strokeStyle = col['mdf-edge']; ctx.strokeRect(rx + .5, ry + .5, rw, rh);
      var m1 = faceToWorld(f, 0, P.T / 2), m2 = faceToWorld(f, (f === 2 || f === 4) ? P.L : P.W, P.T / 2);
      ctx.setLineDash([4, 4]); ctx.beginPath(); ctx.moveTo(sx(m1.x), sy(m1.y)); ctx.lineTo(sx(m2.x), sy(m2.y)); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle = col.ink2; ctx.textBaseline = 'middle';
      var lab = 'Faccia ' + f + ' · ' + FACE_NAMES[f].replace('Fianco ', '');
      if (f === 2) { ctx.textAlign = 'left'; ctx.fillText(lab, rx, ry + rh + 12); }
      if (f === 4) { ctx.textAlign = 'left'; ctx.fillText(lab, rx, ry - 12); }
      if (f === 5 || f === 3) { ctx.save(); ctx.translate(f === 5 ? rx - 12 : rx + rw + 12, ry + rh / 2); ctx.rotate(f === 5 ? -Math.PI / 2 : Math.PI / 2); ctx.textAlign = 'center'; ctx.fillText(lab, 0, 0); ctx.restore(); }
    });
  }
  // pannello
  ctx.fillStyle = col.mdf; ctx.fillRect(sx(0), sy(P.W), P.L * view.s, P.W * view.s);
  ctx.lineWidth = 1.5; ctx.strokeStyle = col['mdf-edge']; ctx.strokeRect(sx(0), sy(P.W), P.L * view.s, P.W * view.s);
  if (job.refPoly) { ctx.setLineDash([6, 4]); ctx.strokeStyle = col.ink2; ctx.lineWidth = 1; pathScreen(job.refPoly, true); ctx.stroke(); ctx.setLineDash([]); }
  drawBg();
  // origine macchina e origine locale
  ctx.strokeStyle = col.accent; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(sx(0), sy(0)); ctx.lineTo(sx(0) + 34, sy(0)); ctx.moveTo(sx(0), sy(0)); ctx.lineTo(sx(0), sy(0) - 34); ctx.stroke();
  ctx.fillStyle = col.accent; ctx.font = '700 11px ' + css('--f-mono'); ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic'; ctx.fillText('X', sx(0) + 37, sy(0) + 4); ctx.fillText('Y', sx(0) - 3, sy(0) - 38);
  if (ui.origin.x || ui.origin.y) { var ox = sx(ui.origin.x), oy = sy(ui.origin.y); ctx.strokeStyle = col.sel; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(ox, oy); ctx.lineTo(ox + 24, oy); ctx.moveTo(ox, oy); ctx.lineTo(ox, oy - 24); ctx.stroke(); ctx.beginPath(); ctx.arc(ox, oy, 4, 0, 7); ctx.stroke(); }
  ctx.fillStyle = col.ink2; ctx.font = '500 12px ' + css('--f-mono'); ctx.textAlign = 'center';
  ctx.fillText(C.f2(P.L) + ' × ' + C.f2(P.W) + ' × ' + C.f2(P.T), sx(P.L / 2), sy(P.W) - 6);
  // percorso tra lavorazioni
  var starts = job.ops.map(opStart);
  if (!cam || ui.camShow.rapids) {
    ctx.strokeStyle = col.rapid; ctx.lineWidth = 1; ctx.setLineDash([2, 4]); ctx.beginPath();
    starts.forEach(function (p, i) { if (i) ctx.lineTo(sx(p.x), sy(p.y)); else ctx.moveTo(sx(p.x), sy(p.y)); });
    ctx.stroke(); ctx.setLineDash([]);
  }
  job.ops.forEach(function (op) {
    var s = isSel(op);
    if (op.type === 'hole') drawHole(op, s); else if (op.type === 'row') drawRow(op, s);
    else if (op.type === 'path') drawPath(op, s, cam); else if (op.type === 'trim') drawTrim(op, s); else if (op.type === 'pocket') drawPocket(op, s);
  });
  if (!cam || ui.camShow.numbers) job.ops.forEach(function (op, i) {
    var p = starts[i], c = op.type === 'path' || op.type === 'pocket' || op.type === 'trim' ? col.mill : (op.type === 'hole' && op.face !== 1 ? col.hhole : col.hole);
    if (isSel(op)) c = col.sel; badge(sx(p.x) + 13, sy(p.y) - 13, i + 1, c);
  });
  if (!cam) drawDims();
  drawBlades();
  drawHover();
  drawDraftExt();
  drawCons();
  drawSideExt();
  // costruzione in corso
  var D = ui.draft, m = ui.mouse;
  if (D) {
    ctx.strokeStyle = col.sel; ctx.lineWidth = 1.5; ctx.setLineDash([5, 3]);
    if (D.kind === 'path' && D.pts.length) {
      var tmp = D.pts.concat([{ x: m.wx, y: m.wy, b: 0 }]); pathScreen(tmp, false); ctx.stroke(); ctx.setLineDash([]); ctx.fillStyle = col.sel;
      D.pts.forEach(function (p, i) { ctx.beginPath(); ctx.arc(sx(p.x), sy(p.y), i === 0 ? 5 : 3, 0, 7); ctx.fill(); });
    } else if (D.kind === 'rect') { pathScreen(C.rectPath(D.x, D.y, m.wx, m.wy, D.pocket ? 0 : ui.def.radius), true); ctx.stroke(); label2(sx(m.wx), sy(m.wy), 'L ' + C.f2(Math.abs(m.wx - D.x)) + '  H ' + C.f2(Math.abs(m.wy - D.y))); }
    else if (D.kind === 'circle') { var rr = Math.hypot(m.wx - D.x, m.wy - D.y); ctx.beginPath(); ctx.arc(sx(D.x), sy(D.y), rr * view.s, 0, 7); ctx.stroke(); label2(sx(m.wx), sy(m.wy), 'Ø ' + C.f2(2 * rr)); }
    else if (D.kind === 'row') { var rw2 = rowFromDrag(D.x, D.y, m.wx, m.wy); ctx.setLineDash([]); drawRow(rw2, true); label2(sx(m.wx), sy(m.wy), rw2.n + ' fori · passo ' + rw2.step); }
    else if (D.kind === 'line2') { ctx.beginPath(); ctx.moveTo(sx(D.x), sy(D.y)); ctx.lineTo(sx(m.wx), sy(m.wy)); ctx.stroke(); label2(sx(m.wx), sy(m.wy), 'L ' + C.f2(Math.hypot(m.wx - D.x, m.wy - D.y)) + '  ∠ ' + C.f2(Math.atan2(m.wy - D.y, m.wx - D.x) * 180 / Math.PI) + '°'); }
    ctx.setLineDash([]);
  }
  if (ui.pick && ui.pick.from) { ctx.strokeStyle = col.sel; ctx.setLineDash([5, 3]); ctx.beginPath(); ctx.moveTo(sx(ui.pick.from.x), sy(ui.pick.from.y)); ctx.lineTo(sx(m.wx), sy(m.wy)); ctx.stroke(); ctx.setLineDash([]); }
  // osnap e mirino
  var drawing = ui.mode !== 'select' || ui.pick;
  if (drawing && m.inside && m.snap) {
    ctx.strokeStyle = col.sel; ctx.lineWidth = 2; var qx = sx(m.wx), qy = sy(m.wy);
    if (m.snap.k === 'centro') { ctx.beginPath(); ctx.arc(qx, qy, 7, 0, 7); ctx.stroke(); }
    else if (m.snap.k === 'medio') { ctx.beginPath(); ctx.moveTo(qx, qy - 8); ctx.lineTo(qx + 8, qy + 6); ctx.lineTo(qx - 8, qy + 6); ctx.closePath(); ctx.stroke(); }
    else ctx.strokeRect(qx - 6, qy - 6, 12, 12);
    label2(qx, qy, m.snap.k + '  ' + C.f2(m.wx - ui.origin.x) + ', ' + C.f2(m.wy - ui.origin.y));
  }
  if (drawing && m.inside) {
    ctx.strokeStyle = col.accent; ctx.lineWidth = 1; var cx = sx(m.wx), cy = sy(m.wy);
    ctx.beginPath(); ctx.moveTo(cx - 10, cy); ctx.lineTo(cx + 10, cy); ctx.moveTo(cx, cy - 10); ctx.lineTo(cx, cy + 10); ctx.stroke();
    if (ui.mode === 'hole' && m.face === 1) { ctx.globalAlpha = .5; ctx.beginPath(); ctx.arc(cx, cy, Math.max(3, ui.def.d / 2 * view.s), 0, 7); ctx.stroke(); ctx.globalAlpha = 1; }
  }
  if (ui.pick && ui.pick.vertex) { // evidenzia i vertici selezionabili
    ctx.fillStyle = col.sel; job.ops.forEach(function (op) { if (op.type === 'path') op.pts.forEach(function (p) { ctx.beginPath(); ctx.arc(sx(p.x), sy(p.y), 3, 0, 7); ctx.fill(); }); });
  }
  if (ui.anim && ui.anim.pos && ui.showHead !== false) drawHead();
  if (ui.anim && ui.anim.pos) { ctx.fillStyle = col.accent; ctx.strokeStyle = col.surface; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(sx(ui.anim.pos.x), sy(ui.anim.pos.y), Math.max(5, (ui.anim.d || 10) / 2 * view.s), 0, 7); ctx.fill(); ctx.stroke(); }
}
function drawHole(op, sel) {
  var P = job.panel, col = COL;
  if (op.face === 1) {
    var r = Math.max(2.5, op.d / 2 * view.s), x = sx(op.x), y = sy(op.y);
    ctx.fillStyle = sel ? col.sel : col.hole; ctx.globalAlpha = op.depth >= P.T ? 0.9 : 0.55; ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fill(); ctx.globalAlpha = 1;
    ctx.strokeStyle = sel ? col.sel : col.hole; ctx.lineWidth = sel ? 2 : 1.2; ctx.stroke();
    if (r > 6) { ctx.strokeStyle = col.surface; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(x - r * .5, y); ctx.lineTo(x + r * .5, y); ctx.moveTo(x, y - r * .5); ctx.lineTo(x, y + r * .5); ctx.stroke(); }
  } else {
    var k = strip().H / P.T, hw = op.d / 2, a, b;
    if (ui.exploded) { var p = faceToWorld(op.face, op.pos, op.z), rr = Math.max(2.5, op.d / 2 * view.s * k); ctx.fillStyle = sel ? col.sel : col.hhole; ctx.globalAlpha = .7; ctx.beginPath(); ctx.arc(sx(p.x), sy(p.y), rr, 0, 7); ctx.fill(); ctx.globalAlpha = 1; ctx.strokeStyle = sel ? col.sel : col.hhole; ctx.lineWidth = sel ? 2 : 1.2; ctx.stroke(); }
    if (op.face === 2) { a = { x: op.pos - hw, y: 0 }; b = { x: op.pos + hw, y: op.depth }; }
    if (op.face === 4) { a = { x: op.pos - hw, y: P.W - op.depth }; b = { x: op.pos + hw, y: P.W }; }
    if (op.face === 5) { a = { x: 0, y: op.pos - hw }; b = { x: op.depth, y: op.pos + hw }; }
    if (op.face === 3) { a = { x: P.L - op.depth, y: op.pos - hw }; b = { x: P.L, y: op.pos + hw }; }
    ctx.setLineDash([3, 3]); ctx.strokeStyle = sel ? col.sel : col.hhole; ctx.lineWidth = 1; ctx.strokeRect(sx(a.x), sy(b.y), (b.x - a.x) * view.s, (b.y - a.y) * view.s); ctx.setLineDash([]);
  }
}
function drawRow(op, sel) {
  var col = COL;
  for (var i = 0; i < op.n; i++) {
    var x = op.dir === 'X' ? op.x + i * op.step : op.x, y = op.dir === 'Y' ? op.y + i * op.step : op.y, r = Math.max(2, op.d / 2 * view.s);
    ctx.fillStyle = sel ? col.sel : col.hole; ctx.globalAlpha = .55; ctx.beginPath(); ctx.arc(sx(x), sy(y), r, 0, 7); ctx.fill(); ctx.globalAlpha = 1; ctx.strokeStyle = sel ? col.sel : col.hole; ctx.lineWidth = 1; ctx.stroke();
  }
}
function toolOf(op) { return C.toolByCode(job.tools, op.tool); }
function drawPath(op, sel, cam) {
  if (op.pts.length < 2) return; var col = COL, t = toolOf(op), d = t ? t.d : 6;
  ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  // tratti di ingresso/uscita
  var lead = C.leadSegments(op, (C.corrCode(op, job.settings.sideFlip !== false) || 'G142') === 'G142');
  if (lead.pre || lead.post) {
    ctx.strokeStyle = sel ? col.sel : col.mill; ctx.setLineDash([4, 3]); ctx.lineWidth = 1.2;
    if (lead.pre) { pathScreen([lead.pre[0], { x: op.pts[0].x, y: op.pts[0].y, b: 0 }], false); ctx.stroke(); }
    if (lead.post) { var eb = op.closed ? op.pts[0] : op.pts[op.pts.length - 1]; pathScreen([{ x: eb.x, y: eb.y, b: lead.post.b }, { x: lead.post.end.x, y: lead.post.end.y, b: 0 }], false); ctx.stroke(); }
    ctx.setLineDash([]);
  }
  if (!cam || ui.camShow.widths) { ctx.strokeStyle = sel ? col.sel : col.mill; ctx.globalAlpha = .22; ctx.lineWidth = Math.max(2, d * view.s); pathScreen(op.pts, op.closed); ctx.stroke(); ctx.globalAlpha = 1; }
  ctx.strokeStyle = sel ? col.sel : col.mill; ctx.lineWidth = sel ? 2.2 : 1.5; pathScreen(op.pts, op.closed); ctx.stroke();
  var p0 = op.pts[0], p1 = C.samplePath(op.pts, op.closed, 4)[1] || op.pts[1], ang = Math.atan2(-(p1.y - p0.y), p1.x - p0.x), x = sx(p0.x), y = sy(p0.y);
  ctx.fillStyle = sel ? col.sel : col.mill; ctx.beginPath(); ctx.arc(x, y, 4, 0, 7); ctx.fill();
  ctx.save(); ctx.translate(x + Math.cos(ang) * 16, y + Math.sin(ang) * 16); ctx.rotate(ang); ctx.beginPath(); ctx.moveTo(6, 0); ctx.lineTo(-4, -5); ctx.lineTo(-4, 5); ctx.closePath(); ctx.fill(); ctx.restore();
  if (sel && ui.sel.length === 1) op.pts.forEach(function (p) { ctx.fillStyle = col.surface; ctx.strokeStyle = col.sel; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.rect(sx(p.x) - 3.5, sy(p.y) - 3.5, 7, 7); ctx.fill(); ctx.stroke(); });
}
function pocketOutline(op) { return op.shape === 'circle' ? C.circlePath(op.x, op.y, op.r) : op.shape === 'poly' ? op.pts : C.rectPath(op.x, op.y, op.x2, op.y2, op.radius || 0); }
function drawPocket(op, sel) {
  var col = COL, t = toolOf(op);
  ctx.fillStyle = sel ? col.sel : col.mill; ctx.globalAlpha = .28; pathScreen(pocketOutline(op), true); ctx.fill(); ctx.globalAlpha = 1;
  ctx.strokeStyle = sel ? col.sel : col.mill; ctx.lineWidth = sel ? 2 : 1.4; ctx.stroke();
  if (t) { ctx.globalAlpha = .55; ctx.lineWidth = 1; ctx.setLineDash([2, 3]); C.pocketContours(op, t.d).forEach(function (c) { pathScreen(c, !(c.length === 2 && !c[0].b)); ctx.stroke(); }); ctx.setLineDash([]); ctx.globalAlpha = 1; }
}
function trimPts(op) { var P = job.panel, ld = op.lead == null ? 20 : op.lead, o = op.inset || 0; return [{ x: -ld, y: o }, { x: P.L, y: o }, { x: P.L, y: P.W }, { x: o, y: P.W }, { x: o, y: -ld }]; }
function drawTrim(op, sel) {
  var col = COL, pts = trimPts(op);
  ctx.strokeStyle = sel ? col.sel : col.mill; ctx.setLineDash([6, 4]); ctx.lineWidth = sel ? 2.2 : 1.4; ctx.beginPath();
  pts.forEach(function (p, i) { if (i) ctx.lineTo(sx(p.x), sy(p.y)); else ctx.moveTo(sx(p.x), sy(p.y)); }); ctx.stroke(); ctx.setLineDash([]);
  ctx.fillStyle = sel ? col.sel : col.mill; ctx.beginPath(); ctx.arc(sx(pts[0].x), sy(pts[0].y), 4, 0, 7); ctx.fill();
}

/* ================= hit test e selezione ================= */
function segDist(px, py, ax, ay, bx, by) { var dx = bx - ax, dy = by - ay, L = dx * dx + dy * dy, t = L ? ((px - ax) * dx + (py - ay) * dy) / L : 0; t = Math.max(0, Math.min(1, t)); return Math.hypot(px - ax - t * dx, py - ay - t * dy); }
function polyDist(px, py, pts, closed) { var s = C.samplePath(pts, closed, 4), d = 1e9; for (var j = 0; j + 1 < s.length + (closed ? 1 : 0); j++) { var a = s[j], b = s[(j + 1) % s.length]; d = Math.min(d, segDist(px, py, sx(a.x), sy(a.y), sx(b.x), sy(b.y))); } return d; }
function hitDist(op, px, py) {
  var P = job.panel, d = 1e9;
  if (op.type === 'hole' && op.face === 1) d = Math.hypot(sx(op.x) - px, sy(op.y) - py) - Math.max(3, op.d / 2 * view.s);
  else if (op.type === 'hole') {
    if (ui.exploded) { var p = faceToWorld(op.face, op.pos, op.z); d = Math.hypot(sx(p.x) - px, sy(p.y) - py) - Math.max(3, op.d / 2 * view.s * strip().H / P.T); }
  } else if (op.type === 'row') { for (var i = 0; i < op.n; i++) { var x = op.dir === 'X' ? op.x + i * op.step : op.x, y = op.dir === 'Y' ? op.y + i * op.step : op.y; d = Math.min(d, Math.hypot(sx(x) - px, sy(y) - py) - Math.max(2, op.d / 2 * view.s)); } }
  else if (op.type === 'pocket') { var X = wx(px), Y = wy(py); if (op.shape === 'circle') d = (Math.hypot(X - op.x, Y - op.y) - op.r) * view.s; else if (op.shape === 'poly') d = polyDist(px, py, op.pts, true) - 2; else d = (X >= Math.min(op.x, op.x2) && X <= Math.max(op.x, op.x2) && Y >= Math.min(op.y, op.y2) && Y <= Math.max(op.y, op.y2)) ? -1 : 99; }
  else if (op.type === 'trim') { var tp = trimPts(op); for (var q = 0; q + 1 < tp.length; q++) d = Math.min(d, segDist(px, py, sx(tp[q].x), sy(tp[q].y), sx(tp[q + 1].x), sy(tp[q + 1].y))); d -= 2; }
  else if (op.type === 'path') d = polyDist(px, py, op.pts, op.closed) - 2;
  return d;
}
function hit(px, py) { var best = null, bd = 6; job.ops.forEach(function (op) { var d = hitDist(op, px, py); if (d < bd) { bd = d; best = op; } }); return best; }
function hitVertex(px, py) { var best = null, bd = 10; job.ops.forEach(function (op) { if (op.type !== 'path') return; op.pts.forEach(function (p, k) { var d = Math.hypot(sx(p.x) - px, sy(p.y) - py); if (d < bd) { bd = d; best = { op: op, k: k }; } }); }); return best; }
function windowSelect(x0, y0, x1, y1, crossing) {
  var a = { x: Math.min(wx(x0), wx(x1)), y: Math.min(wy(y0), wy(y1)) }, b = { x: Math.max(wx(x0), wx(x1)), y: Math.max(wy(y0), wy(y1)) }, P = job.panel, out = [];
  job.ops.forEach(function (op) {
    var bb = G.opBBox(op, P); if (!bb) { if (op.type === 'hole') { var p = opStart(op); bb = { x0: p.x, y0: p.y, x1: p.x, y1: p.y }; } else return; }
    var inside = bb.x0 >= a.x && bb.x1 <= b.x && bb.y0 >= a.y && bb.y1 <= b.y, touch = !(bb.x1 < a.x || bb.x0 > b.x || bb.y1 < a.y || bb.y0 > b.y);
    if (crossing ? touch : inside) out.push(op.id);
  });
  return out;
}

/* ================= osnap ================= */
function osnapPoints() {
  var P = job.panel, pts = [{ x: 0, y: 0, k: 'spigolo' }, { x: P.L, y: 0, k: 'spigolo' }, { x: P.L, y: P.W, k: 'spigolo' }, { x: 0, y: P.W, k: 'spigolo' },
    { x: P.L / 2, y: 0, k: 'medio' }, { x: P.L / 2, y: P.W, k: 'medio' }, { x: 0, y: P.W / 2, k: 'medio' }, { x: P.L, y: P.W / 2, k: 'medio' }, { x: P.L / 2, y: P.W / 2, k: 'centro' }];
  job.ops.forEach(function (op) {
    if (op.type === 'hole' && op.face === 1) pts.push({ x: op.x, y: op.y, k: 'centro' });
    else if (op.type === 'row') { for (var i = 0; i < op.n; i++) pts.push({ x: op.dir === 'X' ? op.x + i * op.step : op.x, y: op.dir === 'Y' ? op.y + i * op.step : op.y, k: 'centro' }); }
    else if (op.type === 'pocket') { if (op.shape === 'circle') pts.push({ x: op.x, y: op.y, k: 'centro' }); else if (op.shape === 'rect') { pts.push({ x: op.x, y: op.y, k: 'spigolo' }, { x: op.x2, y: op.y2, k: 'spigolo' }, { x: op.x, y: op.y2, k: 'spigolo' }, { x: op.x2, y: op.y, k: 'spigolo' }, { x: (op.x + op.x2) / 2, y: (op.y + op.y2) / 2, k: 'centro' }); } }
    else if (op.type === 'path') {
      var n = op.pts.length, m = op.closed ? n : n - 1;
      op.pts.forEach(function (q) { pts.push({ x: q.x, y: q.y, k: 'estremo' }); });
      for (var j = 0; j < m; j++) { var a = op.pts[j], b = op.pts[(j + 1) % n], arc = C.arcFromBulge(a, b, a.b || 0);
        if (arc) { pts.push({ x: arc.cx, y: arc.cy, k: 'centro' }); var mid = arc.a1 + 2 * Math.atan(a.b); pts.push({ x: arc.cx + arc.r * Math.cos(mid), y: arc.cy + arc.r * Math.sin(mid), k: 'medio' }); }
        else pts.push({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2, k: 'medio' }); }
    }
  });
  if (ui.draft && ui.draft.kind === 'path') ui.draft.pts.forEach(function (q) { pts.push({ x: q.x, y: q.y, k: 'estremo' }); });
  if (ui.origin.x || ui.origin.y) pts.push({ x: ui.origin.x, y: ui.origin.y, k: 'origine' });
  return pts;
}
function osnapAt(px, py) { var best = null, bd = 10; osnapPoints().forEach(function (q) { var d = Math.hypot(sx(q.x) - px, sy(q.y) - py); if (d < bd) { bd = d; best = { x: r2(q.x), y: r2(q.y), k: q.k }; } }); return best; }
function snapV(v, o) { return ui.snap ? o + Math.round((v - o) / ui.grid) * ui.grid : r2(v); }
