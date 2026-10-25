
/* ================= LAVORAZIONI DI TESTA: lavoro sui 4 lati del pannello (spessore Z) ================= */
// facce Task: 2 anteriore (Y=0), 3 destra (X=L), 4 posteriore (Y=W), 5 sinistra (X=0). Sui lati la macchina ha solo punte orizzontali (mandrini 58-61).
function snapZ(z) { var T = job.panel.T, d = ui.hdef || 8; if (Math.abs(z - T / 2) < Math.max(1.5, T * 0.1)) return r2(T / 2); var s = Math.round(z * 2) / 2; return r2(Math.max(d / 2, Math.min(T - d / 2, s))); }
var FACE_SHORT = { 2: 'anteriore', 3: 'destra', 4: 'posteriore', 5: 'sinistra' };
function faceBox(f) {
  var P = job.panel, st = strip();
  if (f === 2) return [-20, -st.G - st.H - 20, P.L + 20, -st.G + 20];
  if (f === 4) return [-20, P.W + st.G - 20, P.L + 20, P.W + st.G + st.H + 20];
  if (f === 5) return [-st.G - st.H - 20, -20, -st.G + 20, P.W + 20];
  return [P.L + st.G - 20, -20, P.L + st.G + st.H + 20, P.W + 20];
}
[2, 3, 4, 5].forEach(function (f) {
  cmd('face' + f, 'Lavora sulla faccia ' + FACE_SHORT[f], function () {
    setEnv('cad', true); ui.exploded = true; ui.workFace = f; pushView(); var b = faceBox(f); fitBox(b[0], b[1], b[2], b[3], 30);
    setMode('hole'); setPrompt('Faccia ' + f + ' · ' + FACE_SHORT[f] + ': clic per un foro di testa (la Z segue il cursore, si aggancia a metà spessore). Modo Barriera: due clic lungo il lato. Ø ' + (ui.hdef || 8) + ' · prof. ' + ui.def.hdepth + ' mm');
    draw();
  });
});
cmd('face1', 'Lavora sulla faccia superiore', function () { setEnv('cad', true); ui.workFace = 1; pushView(); fitPanel(); setMode('select'); });
cmd('sideDefaults', 'Fori di testa: diametro e profondità…', function () {
  var hs = job.tools.filter(function (t) { return t.kind === 'H'; }), ds = []; hs.forEach(function (t) { if (ds.indexOf(t.d) < 0) ds.push(t.d); });
  dlg('Fori di testa', '<div class="grid2">' + field('qD', 'Diametro', ui.hdef || 8, { unit: 'mm', select: (ds.length ? ds : [8]).map(function (d) { return [d, 'Ø' + d]; }) }) + field('qP', 'Profondità', ui.def.hdepth, { unit: 'mm' }) + field('qS', 'Passo barriere', ui.def.step, { unit: 'mm' }) + '</div><p class="note">Punte orizzontali in attrezzaggio: ' + (hs.length ? hs.map(function (t) { return t.code + ' faccia ' + t.face + ' Ø' + t.d + ' L.utile ' + t.lut; }).join(' · ') : 'nessuna') + '. La profondità non deve superare la lunghezza utile.</p>', 'OK', function () { ui.hdef = v('qD', 8); ui.def.hdepth = v('qP', 22); ui.def.step = v('qS', 32); });
});
// barriera di fori di testa: due clic lungo lo stesso lato
cv.addEventListener('pointerdown', function (e) {
  if (e.button !== 0 || ui.pick || ui.mode !== 'row' || ui.space) return;
  updMouse(evPos(e)); var m = ui.mouse, D = ui.draft;
  if (!(m.face >= 2) && !(D && D.kind === 'srow')) return;
  e.stopImmediatePropagation();
  if (!D || D.kind !== 'srow') { ui.draft = { kind: 'srow', face: m.face, pos: m.pos, z: m.z }; setPrompt('Barriera di testa: clic sull\'ultimo foro lungo lo stesso lato'); draw(); return; }
  var a = Math.min(D.pos, m.pos), b = Math.max(D.pos, m.pos), st = ui.def.step || 32, n = Math.max(1, Math.floor((b - a) / st + 1e-6) + 1), list = [];
  for (var i = 0; i < n; i++) list.push({ type: 'hole', face: D.face, pos: r2(a + i * st), z: r2(D.z), d: ui.hdef || 8, depth: ui.def.hdepth });
  ui.draft = null; addOps(list); toast(n + ' fori di testa sulla faccia ' + D.face + ' · passo ' + st);
}, true);
function drawSideExt() {
  var m = ui.mouse, D = ui.draft; if (ui.env !== 'cad' || !ui.exploded) return;
  ctx.save(); var css = getComputedStyle(document.documentElement), c = css.getPropertyValue('--hhole').trim() || '#7a3fa0';
  if ((ui.mode === 'hole' || ui.mode === 'row') && m.face >= 2 && m.inside) {
    var w = faceToWorld(m.face, m.pos, m.z), k = strip().H / job.panel.T, r = Math.max(3, (ui.hdef || 8) / 2 * view.s * k);
    ctx.strokeStyle = c; ctx.setLineDash([3, 2]); ctx.beginPath(); ctx.arc(sx(w.x), sy(w.y), r, 0, 7); ctx.stroke(); ctx.setLineDash([]);
    label2(sx(w.x), sy(w.y), 'Faccia ' + m.face + ' · pos ' + C.f2(m.pos) + ' · Z ' + C.f2(m.z));
  }
  if (D && D.kind === 'srow' && m.face === D.face) {
    var a = Math.min(D.pos, m.pos), b = Math.max(D.pos, m.pos), st = ui.def.step || 32, n = Math.max(1, Math.floor((b - a) / st + 1e-6) + 1);
    ctx.fillStyle = c; ctx.globalAlpha = .6; for (var i = 0; i < n; i++) { var q = faceToWorld(D.face, a + i * st, D.z); ctx.beginPath(); ctx.arc(sx(q.x), sy(q.y), 4, 0, 7); ctx.fill(); }
    ctx.globalAlpha = 1; label2(sx(m.wx), sy(m.wy), n + ' fori · passo ' + st);
  }
  if (ui.workFace >= 2) { var bb = faceBox(ui.workFace); ctx.strokeStyle = c; ctx.lineWidth = 2; ctx.strokeRect(sx(bb[0] + 15), sy(bb[3] - 15), (bb[2] - bb[0] - 30) * view.s, (bb[3] - bb[1] - 30) * view.s); }
  ctx.restore();
}
Object.assign(HELP, {
  face2: ['Lavora sul lato anteriore (Y = 0): fori di testa col mouse, Z libera nello spessore.'], face3: ['Lavora sul lato destro (X = L).'], face4: ['Lavora sul lato posteriore (Y = W).'], face5: ['Lavora sul lato sinistro (X = 0).'], face1: ['Torna alla faccia superiore.'],
  sideDefaults: ['Diametro, profondità e passo dei fori di testa (punte orizzontali).']
});
