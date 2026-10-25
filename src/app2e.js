
/* ================= FERRAMENTA: libreria schemi di foratura ================= */
// Quote dai cataloghi tecnici pubblicati dai produttori (sistema 32, cerniere a scodellino Ø35, giunzioni).
// Sono valori di partenza modificabili: ogni schema va verificato con la dima o il catalogo del modello usato.
var FER_KEY = 'camtech99l.ferramenta.v1';
var EDGES = [['X0', 'Bordo sinistro (X = 0)'], ['XL', 'Bordo destro (X = L)'], ['Y0', 'Bordo inferiore (Y = 0)'], ['YW', 'Bordo superiore (Y = W)']];
function ferFrame(edge, P) {
  // u = distanza lungo il bordo, v = distanza dal bordo verso l'interno
  if (edge === 'X0') return { len: P.W, depth: P.L, face: 5, at: function (u, v) { return { x: v, y: u }; } };
  if (edge === 'XL') return { len: P.W, depth: P.L, face: 3, at: function (u, v) { return { x: P.L - v, y: u }; } };
  if (edge === 'Y0') return { len: P.L, depth: P.W, face: 2, at: function (u, v) { return { x: u, y: v }; } };
  return { len: P.L, depth: P.W, face: 4, at: function (u, v) { return { x: u, y: P.W - v }; } };
}
function ferList(s, len) { // "32;-32" -> posizioni (negative = dal fondo)
  return String(s || '').split(/[;\s]+/).filter(function (t) { return t !== ''; }).map(function (t) { var n = num(t, NaN); return n < 0 || Object.is(n, -0) ? len + n : n; }).filter(function (n) { return isFinite(n); });
}
function hingeCount(len) { return len <= 900 ? 2 : len <= 1600 ? 3 : len <= 2000 ? 4 : 5; }
function hingePos(p, len) {
  var lst = ferList(p.pos, len); if (lst.length) return lst;
  var n = Math.round(p.n) > 1 ? Math.round(p.n) : hingeCount(len), a = p.a, out = [];
  for (var i = 0; i < n; i++) out.push(r2(a + (len - 2 * a) * i / (n - 1)));
  return out;
}
function vHole(F, u, v, d, depth) { var q = F.at(u, v); return { type: 'hole', face: 1, x: r2(q.x), y: r2(q.y), d: d, depth: depth }; }
function hHole(F, u, z, d, depth) { return { type: 'hole', face: F.face, pos: r2(u), z: r2(z), d: d, depth: depth }; }

var FER_GEN = {
  hinge: function (p, P) {
    var F = ferFrame(p.edge, P), vc = p.K + p.dc / 2, out = [];
    hingePos(p, F.len).forEach(function (u) {
      out.push(vHole(F, u, vc, p.dc, p.pc));
      if (p.fix === 'spine') { out.push(vHole(F, u - p.i / 2, vc + p.o, p.df, p.pf)); out.push(vHole(F, u + p.i / 2, vc + p.o, p.df, p.pf)); }
    });
    return out;
  },
  plate: function (p, P) {
    var F = ferFrame(p.edge, P), out = [];
    hingePos(p, F.len).forEach(function (u) { u += p.off; out.push(vHole(F, u - p.i / 2, p.v, p.d, p.dp)); out.push(vHole(F, u + p.i / 2, p.v, p.d, p.dp)); });
    return out;
  },
  s32: function (p, P) {
    var F = ferFrame(p.edge, P), out = [], end = p.u1 > 0 ? p.u1 : F.len - p.u0;
    [p.v1, p.v2].forEach(function (v, k) {
      if (!(v > 0)) return; var vv = k === 1 && p.v2mode === 'retro' ? F.depth - v : v;
      for (var u = p.u0; u <= end + 1e-6; u += p.step) out.push(vHole(F, u, vv, p.d, p.dp));
    });
    return out;
  },
  shelf: function (p, P) {
    var F = ferFrame(p.edge, P), out = [];
    ferList(p.h, F.len).forEach(function (u) { out.push(vHole(F, u, p.vf, p.d, p.dp)); if (p.vb > 0) out.push(vHole(F, u, F.depth - p.vb, p.d, p.dp)); });
    return out;
  },
  joinFace: function (p, P) { // fori sul fianco per un pannello che lo incrocia (ripiano, cielo, fondo)
    var F = ferFrame(p.edge, P), out = [];
    ferList(p.h, F.len).forEach(function (h) { var u = h + p.tr / 2; ferList(p.v, F.depth).forEach(function (v) { out.push(vHole(F, u, v, p.d, p.dp)); }); });
    return out;
  },
  joinEdge: function (p, P) { // fori orizzontali in testa al pannello
    var F = ferFrame(p.edge, P), z = p.z > 0 ? p.z : P.T / 2;
    return ferList(p.u, F.len).map(function (u) { return hHole(F, u, z, p.d, p.dp); });
  },
  minifix: function (p, P) {
    var F = ferFrame(p.edge, P), z = p.z > 0 ? p.z : P.T / 2, out = [];
    ferList(p.u, F.len).forEach(function (u) { out.push(vHole(F, u, p.b, p.dh, p.ph)); if (p.dpb > 0) out.push(hHole(F, u, z, p.db, p.dpb)); });
    return out;
  },
  runner: function (p, P) {
    var F = ferFrame(p.edge, P), out = [];
    ferList(p.h, F.len).forEach(function (u) { ferList(p.v, F.depth).forEach(function (v) { out.push(vHole(F, u, v, p.d, p.dp)); }); });
    return out;
  },
  handle: function (p, P) {
    var F = ferFrame(p.edge, P), c = p.c > 0 ? p.c : F.len / 2, out = [], dp = p.dp > 0 ? p.dp : P.T;
    if (!(p.i > 0)) out.push(vHole(F, c, p.v, p.d, dp));
    else if (p.orient === 'par') { out.push(vHole(F, c - p.i / 2, p.v, p.d, dp)); out.push(vHole(F, c + p.i / 2, p.v, p.d, dp)); }
    else { out.push(vHole(F, c, p.v, p.d, dp)); out.push(vHole(F, c, p.v + p.i, p.d, dp)); }
    return out;
  }
};
var P_EDGE = function (def) { return { k: 'edge', l: 'Bordo di riferimento', def: def, sel: EDGES }; };
var P_HPOS = [{ k: 'a', l: 'Prima/ultima dal bordo', def: 100, u: 'mm' }, { k: 'n', l: 'Numero (0 = automatico)', def: 0 }, { k: 'pos', l: 'Posizioni fisse (es. 100;500)', def: '', txt: true }];
var FER_TYPES = {
  hinge: { name: 'Cerniera a scodellino Ø35', where: 'anta', params: [P_EDGE('X0'), { k: 'K', l: 'Distanza scodellino dal bordo K', def: 5, u: 'mm' }, { k: 'dc', l: 'Ø scodellino', def: 35, u: 'mm' }, { k: 'pc', l: 'Prof. scodellino', def: 12, u: 'mm' }, { k: 'fix', l: 'Fissaggio', def: 'spine', sel: [['spine', 'A spine (2 fori)'], ['vite', 'A vite (nessun foro)']] }, { k: 'i', l: 'Interasse fori', def: 45, u: 'mm' }, { k: 'o', l: 'Scostamento fori dal centro', def: 9.5, u: 'mm' }, { k: 'df', l: 'Ø fori spine', def: 8, u: 'mm' }, { k: 'pf', l: 'Prof. fori spine', def: 11, u: 'mm' }].concat(P_HPOS) },
  plate: { name: 'Base cerniera su fianco (2 fori sistema 32)', where: 'fianco', params: [P_EDGE('Y0'), { k: 'v', l: 'Distanza dal bordo frontale', def: 37, u: 'mm' }, { k: 'i', l: 'Interasse fori', def: 32, u: 'mm' }, { k: 'd', l: 'Ø fori', def: 5, u: 'mm' }, { k: 'dp', l: 'Profondità', def: 12, u: 'mm' }, { k: 'off', l: 'Scostamento anta rispetto al fianco', def: 0, u: 'mm' }].concat(P_HPOS) },
  s32: { name: 'Fila sistema 32', where: 'fianco', params: [P_EDGE('Y0'), { k: 'v1', l: 'Fila anteriore dal bordo', def: 37, u: 'mm' }, { k: 'v2', l: 'Seconda fila (0 = nessuna)', def: 37, u: 'mm' }, { k: 'v2mode', l: 'Seconda fila misurata', def: 'retro', sel: [['retro', 'dal bordo opposto'], ['fronte', 'dallo stesso bordo']] }, { k: 'u0', l: 'Primo foro', def: 69, u: 'mm' }, { k: 'u1', l: 'Ultimo foro (0 = simmetrico)', def: 0, u: 'mm' }, { k: 'step', l: 'Passo', def: 32, u: 'mm' }, { k: 'd', l: 'Ø', def: 5, u: 'mm' }, { k: 'dp', l: 'Profondità', def: 12, u: 'mm' }] },
  shelf: { name: 'Reggiripiano', where: 'fianco', params: [P_EDGE('Y0'), { k: 'h', l: 'Quote ripiani (es. 300;600)', def: '300;600', txt: true }, { k: 'vf', l: 'Distanza dal fronte', def: 37, u: 'mm' }, { k: 'vb', l: 'Distanza dal retro (0 = no)', def: 37, u: 'mm' }, { k: 'd', l: 'Ø', def: 5, u: 'mm' }, { k: 'dp', l: 'Profondità', def: 10, u: 'mm' }] },
  joinFace: { name: 'Giunzione su fianco (fori in faccia)', where: 'fianco', params: [P_EDGE('Y0'), { k: 'h', l: 'Quota del pannello che incrocia (faccia inferiore)', def: '0', txt: true }, { k: 'tr', l: 'Spessore pannello che incrocia', def: 18, u: 'mm' }, { k: 'v', l: 'Posizioni dal fronte (neg. = dal retro)', def: '32;-32', txt: true }, { k: 'd', l: 'Ø', def: 8, u: 'mm' }, { k: 'dp', l: 'Profondità', def: 12, u: 'mm' }] },
  joinEdge: { name: 'Giunzione in testa (fori orizzontali)', where: 'ripiano / cielo / fondo', params: [P_EDGE('X0'), { k: 'u', l: 'Posizioni lungo il bordo (neg. = dalla fine)', def: '32;-32', txt: true }, { k: 'z', l: 'Altezza da sotto (0 = metà spessore)', def: 0, u: 'mm' }, { k: 'd', l: 'Ø', def: 8, u: 'mm' }, { k: 'dp', l: 'Profondità', def: 25, u: 'mm' }] },
  minifix: { name: 'Eccentrico Ø15 (tipo Minifix)', where: 'ripiano / cielo / fondo', params: [P_EDGE('X0'), { k: 'u', l: 'Posizioni lungo il bordo (neg. = dalla fine)', def: '37;-37', txt: true }, { k: 'b', l: 'Centro eccentrico dal bordo', def: 24, u: 'mm' }, { k: 'dh', l: 'Ø eccentrico', def: 15, u: 'mm' }, { k: 'ph', l: 'Prof. eccentrico', def: 12.5, u: 'mm' }, { k: 'db', l: 'Ø foro perno in testa', def: 8, u: 'mm' }, { k: 'dpb', l: 'Prof. foro in testa (0 = no)', def: 34, u: 'mm' }, { k: 'z', l: 'Altezza da sotto (0 = metà)', def: 0, u: 'mm' }] },
  runner: { name: 'Guida cassetto (fori su fianco)', where: 'fianco', params: [P_EDGE('Y0'), { k: 'h', l: 'Quote fila fori per cassetto (es. 60;260)', def: '60', txt: true }, { k: 'v', l: 'Posizioni dal fronte', def: '37;261', txt: true }, { k: 'd', l: 'Ø', def: 5, u: 'mm' }, { k: 'dp', l: 'Profondità', def: 12, u: 'mm' }] },
  handle: { name: 'Maniglia (fori passanti)', where: 'anta / frontale', params: [P_EDGE('YW'), { k: 'orient', l: 'Orientamento', def: 'par', sel: [['par', 'Parallela al bordo'], ['perp', 'Perpendicolare al bordo']] }, { k: 'i', l: 'Interasse', def: 128, u: 'mm' }, { k: 'v', l: 'Distanza dal bordo (1° foro)', def: 40, u: 'mm' }, { k: 'c', l: 'Centro lungo il bordo (0 = centrata)', def: 0, u: 'mm' }, { k: 'd', l: 'Ø', def: 5, u: 'mm' }, { k: 'dp', l: 'Profondità (0 = spessore)', def: 0, u: 'mm' }] }
};
// Preset di libreria: schema + valori. Le note dicono da dove viene la quota.
var FER_BUILTIN = [
  { id: 'b1', g: 'Cerniere', t: 'hinge', n: 'Cerniera Ø35 a spine 45/9,5', note: 'Schema 45/9,5 delle cerniere a scodellino a spine (es. Blum CLIP top a spine). K da 3 a 6 mm secondo la sovrapposizione.', v: {} },
  { id: 'b2', g: 'Cerniere', t: 'hinge', n: 'Cerniera Ø35 a vite (solo scodellino)', note: 'Solo il foro Ø35: le viti si fissano senza preforo.', v: { fix: 'vite' } },
  { id: 'b3', g: 'Cerniere', t: 'hinge', n: 'Cerniera Ø35 schema 48/6', note: 'Schema 48/6 usato da altri produttori: verificare con la scheda del modello.', v: { i: 48, o: 6 } },
  { id: 'b4', g: 'Basi cerniera', t: 'plate', n: 'Base lineare Ø5 vite euro', note: 'Due fori sul sistema 32 a 37 mm dal fronte, centrati sull\'asse della cerniera.', v: {} },
  { id: 'b5', g: 'Basi cerniera', t: 'plate', n: 'Base con tasselli Ø10', note: 'Versione con tasselli premontati: Ø e profondità da verificare sul modello.', v: { d: 10, dp: 12 } },
  { id: 'b6', g: 'Sistema 32', t: 's32', n: 'Doppia fila Ø5 (37 fronte / 37 retro)', note: 'Sistema 32: fila a 37 mm dal fronte, passo 32.', v: {} },
  { id: 'b7', g: 'Sistema 32', t: 's32', n: 'Fila singola anteriore Ø5', note: '', v: { v2: 0 } },
  { id: 'b8', g: 'Ripiani', t: 'shelf', n: 'Reggiripiano Ø5', note: '', v: {} },
  { id: 'b9', g: 'Giunzioni', t: 'joinFace', n: 'Spine Ø8 su fianco', note: 'Spina 8×35: 12 mm in faccia, 25 mm in testa.', v: {} },
  { id: 'b10', g: 'Giunzioni', t: 'joinEdge', n: 'Spine Ø8 in testa', note: 'Prof. 25 = lunghezza utile delle punte orizzontali Ø8 della macchina.', v: {} },
  { id: 'b11', g: 'Giunzioni', t: 'minifix', n: 'Eccentrico Ø15 distanza 24', note: 'Distanza 24 dal bordo come le dime per eccentrico Ø15 (es. Häfele Minifix 15). Profondità secondo lo spessore: verificare sul catalogo.', v: {} },
  { id: 'b12', g: 'Giunzioni', t: 'joinFace', n: 'Perno eccentrico Ø5 su fianco', note: 'Foro per il perno a vite dell\'eccentrico, in asse col ripiano.', v: { v: '37;-37', d: 5, dp: 11 } },
  { id: 'b13', g: 'Giunzioni', t: 'joinFace', n: 'Confirmat Ø7 passante su fianco', note: 'Foro passante in faccia; in testa al ripiano serve un Ø5 lungo (vedi riga sotto).', v: { d: 7, dp: 18 } },
  { id: 'b14', g: 'Giunzioni', t: 'joinEdge', n: 'Confirmat Ø5 in testa', note: 'Prof. 45-50 supera la lunghezza utile delle punte orizzontali attuali (25): da fare a mano o con altro utensile.', v: { d: 5, dp: 45 } },
  { id: 'b15', g: 'Cassetti', t: 'runner', n: 'Guida cassetto su sistema 32', note: 'Posizioni di ESEMPIO: inserire quelle del modello e della lunghezza nominale della guida (catalogo del produttore).', v: {} },
  { id: 'b16', g: 'Maniglie', t: 'handle', n: 'Maniglia interasse 128', note: '', v: {} },
  { id: 'b17', g: 'Maniglie', t: 'handle', n: 'Maniglia interasse 160', note: '', v: { i: 160 } },
  { id: 'b18', g: 'Maniglie', t: 'handle', n: 'Pomolo singolo', note: '', v: { i: 0 } }
];
var ferUser = (function () { try { var j = JSON.parse(lsGet(FER_KEY) || '[]'); return Array.isArray(j) ? j : []; } catch (e) { return []; } })();
function ferAll() { return FER_BUILTIN.concat(ferUser); }
function ferGet(id) { return ferAll().filter(function (x) { return x.id === id; })[0]; }
function ferSaveUser() { lsSet(FER_KEY, JSON.stringify(ferUser)); }
ui.fer = { id: 'b1', vals: null };
function ferVals() {
  var it = ferGet(ui.fer.id) || FER_BUILTIN[0], T = FER_TYPES[it.t];
  if (!ui.fer.vals) { ui.fer.vals = {}; T.params.forEach(function (q) { ui.fer.vals[q.k] = it.v[q.k] != null ? it.v[q.k] : q.def; }); }
  return ui.fer.vals;
}
function ferOps() { var it = ferGet(ui.fer.id); if (!it) return []; try { return FER_GEN[it.t](ferVals(), job.panel).filter(function (o) { return !(o.d > 0) ? false : true; }); } catch (e) { return []; } }
function ferPick(id) { ui.fer.id = id; ui.fer.vals = null; renderFer(); refreshPane(); }

function renderFer() {
  var groups = {}; ferAll().forEach(function (x) { (groups[x.g] = groups[x.g] || []).push(x); });
  var it = ferGet(ui.fer.id) || FER_BUILTIN[0], ops = ferOps(), P = job.panel;
  var list = Object.keys(groups).map(function (g) {
    return '<h3 style="margin:10px 0 4px">' + esc(g) + '</h3>' + groups[g].map(function (x) { return '<div class="ferrow' + (x.id === it.id ? ' sel' : '') + '" data-fer="' + x.id + '"><span>' + esc(x.n) + '</span><small>' + (x.user ? 'mio schema' : esc(FER_TYPES[x.t].where)) + '</small></div>'; }).join('');
  }).join('');
  var miss = {}; ops.forEach(function (o) { if (!C.findDrill(job.tools, o.d, o.face)) miss[(o.face === 1 ? 'verticale' : 'orizzontale faccia ' + o.face) + ' Ø' + o.d] = 1; });
  $('fer').innerHTML = '<div class="card ferlist"><h2>Libreria ferramenta</h2><p class="note">Scegli lo schema, regola i valori a destra e premi <b>Inserisci nel disegno</b>: i fori vanno sul pannello corrente e passano al CAD/CAM.</p>' + list +
    '<div class="row" style="margin-top:10px"><button class="btn small" id="ferExp">Esporta libreria</button><button class="btn small" id="ferImp">Importa libreria…</button></div></div>' +
    '<div class="card"><h2>' + esc(it.n) + '</h2><canvas class="prev" id="ferPrev"></canvas>' +
    '<div class="kv"><span>Pannello corrente</span><span>' + esc(job.name) + ' · ' + C.f2(P.L) + ' × ' + C.f2(P.W) + ' × ' + C.f2(P.T) + '</span><span>Fori generati</span><span>' + ops.length + '</span><span>Va montato su</span><span>' + esc(FER_TYPES[it.t].where) + '</span></div>' +
    (it.note ? '<p class="note">' + esc(it.note) + '</p>' : '') +
    (Object.keys(miss).length ? '<div class="issue err">Nessuna punta in attrezzaggio per: ' + esc(Object.keys(miss).join(', ')) + '</div>' : '') +
    '<div class="issue warn">Valori di partenza da catalogo: prima della produzione verifica le quote con la dima o la scheda del modello e prova in aria.</div></div>';
  drawPreview($('ferPrev'), { panel: P, ops: job.ops.concat(ops.map(function (o) { return Object.assign({ fer: 1 }, o); })) });
  ferPrevOverlay($('ferPrev'), P, ops);
  $('fer').querySelectorAll('[data-fer]').forEach(function (r) { r.addEventListener('click', function () { ferPick(r.dataset.fer); }); });
  $('ferExp').onclick = function () { saveFile('libreria_ferramenta_cam99l.json', JSON.stringify(ferUser, null, 1), 'Libreria esportata'); };
  $('ferImp').onclick = function () {
    var inp = document.createElement('input'); inp.type = 'file'; inp.accept = '.json,application/json';
    inp.onchange = function () { var f = inp.files[0]; if (!f) return; f.text().then(function (t) { try { var a = JSON.parse(t); if (!Array.isArray(a)) throw 0; var n = 0; a.forEach(function (x) { if (x && FER_TYPES[x.t] && x.n) { x.id = 'u' + Date.now() + '_' + (n++); x.user = 1; x.g = x.g || 'Miei'; ferUser.push(x); } }); ferSaveUser(); renderFer(); toast(n + ' schemi importati'); } catch (e) { toast('File non valido'); } }); };
    inp.click();
  };
}
function ferPrevOverlay(c, P, ops) { // evidenzia in arancio i fori nuovi, compresi quelli orizzontali sul bordo
  var r = c.getBoundingClientRect(), g = c.getContext('2d'), s = Math.min((r.width - 20) / P.L, (r.height - 20) / P.W), ox = (r.width - P.L * s) / 2, oy = (r.height + P.W * s) / 2;
  readCols(); g.fillStyle = COL.accent || '#e5671f'; g.strokeStyle = COL.accent || '#e5671f';
  ops.forEach(function (o) {
    var x, y, rr = Math.max(2, o.d / 2 * s);
    if (o.face === 1) { x = ox + o.x * s; y = oy - o.y * s; g.beginPath(); g.arc(x, y, rr, 0, 7); g.fill(); return; }
    if (o.face === 2) { x = ox + o.pos * s; y = oy; } else if (o.face === 4) { x = ox + o.pos * s; y = oy - P.W * s; } else if (o.face === 5) { x = ox; y = oy - o.pos * s; } else { x = ox + P.L * s; y = oy - o.pos * s; }
    var L = Math.max(6, o.depth * s), dx = o.face === 5 ? 1 : o.face === 3 ? -1 : 0, dy = o.face === 2 ? -1 : o.face === 4 ? 1 : 0;
    g.lineWidth = Math.max(2, o.d * s); g.beginPath(); g.moveTo(x, y); g.lineTo(x + dx * L, y - dy * L); g.stroke();
  });
}
function paneFer() {
  var it = ferGet(ui.fer.id) || FER_BUILTIN[0], T = FER_TYPES[it.t], V = ferVals(), P = job.panel;
  var h = '<h3>Pannello</h3><div class="grid3">' + field('fL', 'X', P.L, { unit: 'mm' }) + field('fW', 'Y', P.W, { unit: 'mm' }) + field('fT', 'Z', P.T, { unit: 'mm' }) + '</div>';
  h += '<h3>' + esc(T.name) + '</h3><div class="grid2">' + T.params.map(function (q) {
    return field('fp_' + q.k, q.l, V[q.k], q.sel ? { select: q.sel, wide: q.k === 'edge' } : q.txt ? { text: true, wide: true } : { unit: q.u || '' });
  }).join('') + '</div>';
  h += '<div class="row"><button class="btn primary" id="ferIns">Inserisci nel disegno</button><button class="btn small" id="ferNew">Nuovo pannello con questa ferramenta…</button></div>' +
    '<div class="row"><button class="btn small" id="ferSave">Salva come mio schema…</button><button class="btn small" id="ferReset">Valori di libreria</button>' + (it.user ? '<button class="btn small" id="ferDel" style="color:var(--err)">Elimina schema</button>' : '') + '</div>' +
    '<p class="note">Posizioni negative = misurate dalla fine del bordo. I fori orizzontali usano le facce 2-5 come nel CAD.</p>';
  return h;
}
function bindFer() {
  var it = ferGet(ui.fer.id) || FER_BUILTIN[0], T = FER_TYPES[it.t], V = ferVals();
  T.params.forEach(function (q) { var el = $('fp_' + q.k); if (el) el.addEventListener('change', function () { V[q.k] = q.sel || q.txt ? el.value : num(el.value, q.def); renderFer(); }); });
  ['fL:L', 'fW:W', 'fT:T'].forEach(function (s) { var a = s.split(':'), el = $(a[0]); if (el) el.addEventListener('change', function () { var n = num(el.value, job.panel[a[1]]); if (n > 0) { commit(); job.panel[a[1]] = n; changed(); } }); });
  $('ferIns').onclick = function () { var ops = ferOps(); if (!ops.length) return toast('Nessun foro da inserire'); addOps(ops); toast(ops.length + ' fori inseriti: ' + it.n); setEnv('cad'); };
  $('ferNew').onclick = function () {
    dlg('Nuovo pannello con ferramenta', '<div class="grid3">' + field('qL', 'X', job.panel.L, { unit: 'mm' }) + field('qW', 'Y', job.panel.W, { unit: 'mm' }) + field('qT', 'Z', job.panel.T, { unit: 'mm' }) + '</div>' + field('qN', 'Nome disegno', it.n.replace(/[^A-Za-z0-9 ]/g, '').slice(0, 20).toUpperCase(), { text: true }) + '<p class="note">Il disegno corrente va salvato prima, se ti serve.</p>', 'Crea', function () {
      var L = v('qL', 0), W = v('qW', 0), Tt = v('qT', 0); if (!(L > 0 && W > 0 && Tt > 0)) { toast('Dimensioni non valide'); return false; }
      commit(); job.ops = []; job.panel = { L: L, W: W, T: Tt }; job.name = $('qN').value || 'NUOVO'; job.example = false; job.optimized = false;
      var ops = ferOps(); ops.forEach(function (o) { o.id = nextId++; job.ops.push(o); }); changed(); setEnv('cad'); fitPanel(); toast('Pannello creato con ' + ops.length + ' fori');
    });
  };
  $('ferSave').onclick = function () {
    dlg('Salva come mio schema', field('qN', 'Nome', it.n + ' (mio)', { text: true }) + field('qG', 'Gruppo', it.user ? it.g : 'Miei', { text: true }) + field('qNote', 'Nota', it.note || '', { text: true }), 'Salva', function () {
      var x = { id: 'u' + Date.now(), user: 1, g: $('qG').value || 'Miei', t: it.t, n: $('qN').value || it.n, note: $('qNote').value, v: Object.assign({}, V) };
      ferUser.push(x); ferSaveUser(); ui.fer.id = x.id; ui.fer.vals = null; renderFer(); refreshPane(); toast('Schema salvato');
    });
  };
  $('ferReset').onclick = function () { ui.fer.vals = null; renderFer(); refreshPane(); };
  if ($('ferDel')) $('ferDel').onclick = function () { ferUser = ferUser.filter(function (x) { return x.id !== it.id; }); ferSaveUser(); ferPick('b1'); };
}
cmd('toFer', 'Ferramenta', function () { setEnv('fer'); });
