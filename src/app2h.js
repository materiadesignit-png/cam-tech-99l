
/* ================= DISEGNO A MANO SUL FOGLIO QUADRETTATO: linea, polilinea con archi, arco 3 punti, arco da centro, cerchio 3 punti ================= */
PROMPTS.line = 'Linea: clic sul punto iniziale, poi sui punti successivi (griglia e osnap attivi). A = prossimo tratto ad arco, Backspace toglie l\'ultimo, Invio/doppio clic termina, clic sul primo punto chiude.';
PROMPTS.arc3m = 'Arco 3 punti: clic sull\'inizio, sulla fine, poi su un punto dell\'arco.';
PROMPTS.arcCm = 'Arco da centro: clic sul centro, sull\'inizio, poi sulla fine (antiorario; tieni Maiusc per orario).';
PROMPTS.circle3m = 'Cerchio 3 punti: clic su tre punti della circonferenza.';
cmd('lineMode', 'Linea (mouse)', function () { setEnv('cad', true); setMode('path'); ui.lineArc = false; setPrompt(PROMPTS.line); });
cmd('arc3Mode', 'Arco 3 punti (mouse)', function () { setEnv('cad', true); setMode('arc3m'); });
cmd('arcCMode', 'Arco da centro (mouse)', function () { setEnv('cad', true); setMode('arcCm'); });
cmd('circle3Mode', 'Cerchio 3 punti (mouse)', function () { setEnv('cad', true); setMode('circle3m'); });
function mpt() { return { x: ui.mouse.wx, y: ui.mouse.wy }; }
cv.addEventListener('pointerdown', function (e) {
  if (e.button !== 0 || ui.pick || ui.space || ui.anim) return;
  var md = ui.mode, D = ui.draft;
  // tratto ad arco nella polilinea (tasto A)
  if (md === 'path' && D && D.kind === 'path' && ui.lineArc) {
    e.stopImmediatePropagation(); updMouse(evPos(e));
    var p = mpt();
    if (!D.arcEnd) { D.arcEnd = p; setPrompt('Arco: clic su un punto dell\'arco (definisce la curvatura).'); draw(); return; }
    var a = D.pts[D.pts.length - 1], bu = G.arc3Bulge(a, p, D.arcEnd);
    if (bu == null) { toast('Tre punti allineati: arco non valido'); return; }
    a.b = bu; D.pts.push({ x: D.arcEnd.x, y: D.arcEnd.y, b: 0 }); D.arcEnd = null; ui.lineArc = false; setPrompt(PROMPTS.line); draw(); return;
  }
  if (md !== 'arc3m' && md !== 'arcCm' && md !== 'circle3m') return;
  e.stopImmediatePropagation(); updMouse(evPos(e)); var q = mpt();
  if (!D) { ui.draft = { kind: md, pts: [q] }; draw(); return; }
  D.pts.push(q);
  if (D.pts.length < 3) { draw(); return; }
  var P = D.pts; ui.draft = null;
  if (md === 'arc3m') { var b1 = G.arc3Bulge(P[0], P[2], P[1]); if (b1 == null) return toast('Tre punti allineati'); addOps([newPath([{ x: r2(P[0].x), y: r2(P[0].y), b: b1 }, { x: r2(P[1].x), y: r2(P[1].y), b: 0 }], false)]); }
  else if (md === 'arcCm') {
    var c = P[0], r = Math.hypot(P[1].x - c.x, P[1].y - c.y); if (r < 0.1) return toast('Raggio nullo');
    var a2 = Math.atan2(P[2].y - c.y, P[2].x - c.x), end = { x: c.x + r * Math.cos(a2), y: c.y + r * Math.sin(a2) };
    var b2 = C.bulgeFromArc(Math.atan2(P[1].y - c.y, P[1].x - c.x), a2, !e.shiftKey);
    addOps([newPath([{ x: r2(P[1].x), y: r2(P[1].y), b: b2 }, { x: r2(end.x), y: r2(end.y), b: 0 }], false)]);
  } else { var cc = G.circle3(P[0], P[1], P[2]); if (!cc) return toast('Tre punti allineati'); addOps([newPath(C.circlePath(r2(cc.x), r2(cc.y), r2(cc.r)), true)]); }
}, true);
document.addEventListener('keydown', function (e) {
  var tag = (e.target.tagName || '').toLowerCase(); if (tag === 'input' || tag === 'textarea' || tag === 'select' || $('modal').firstChild) return;
  if ((e.key === 'a' || e.key === 'A') && ui.mode === 'path' && ui.draft && ui.draft.kind === 'path') { e.preventDefault(); e.stopImmediatePropagation(); ui.lineArc = !ui.lineArc; ui.draft.arcEnd = null; setPrompt(ui.lineArc ? 'Tratto ad arco: clic sul punto finale dell\'arco, poi su un punto dell\'arco. A per tornare alle rette.' : PROMPTS.line); draw(); }
}, true);
function drawDraftExt() {
  var D = ui.draft, m = ui.mouse; if (!D) return;
  var css = getComputedStyle(document.documentElement), c = css.getPropertyValue('--sel').trim() || '#0d9488';
  ctx.save(); ctx.strokeStyle = c; ctx.fillStyle = c; ctx.lineWidth = 1.5; ctx.setLineDash([5, 3]);
  var cur = { x: m.wx, y: m.wy }, P = (D.pts || []).concat(D.kind === 'path' ? [] : [cur]);
  function dot(p) { ctx.beginPath(); ctx.arc(sx(p.x), sy(p.y), 3.5, 0, 7); ctx.fill(); }
  function arcPts(a, b, bu) { var pts = [a, b]; if (Math.abs(bu) > 1e-9) { var t = TOPO.segs({ type: 'path', closed: false, pts: [{ x: a.x, y: a.y, b: bu }, { x: b.x, y: b.y, b: 0 }] })[0]; pts = []; for (var k = 0; k <= 32; k++) pts.push(TOPO.pointAt(t, k / 32)); } ctx.beginPath(); pts.forEach(function (p, k) { if (k) ctx.lineTo(sx(p.x), sy(p.y)); else ctx.moveTo(sx(p.x), sy(p.y)); }); ctx.stroke(); }
  if (D.kind === 'path' && ui.lineArc) {
    var a = D.pts[D.pts.length - 1];
    if (D.arcEnd) { var bu = G.arc3Bulge(a, cur, D.arcEnd); if (bu != null) arcPts(a, D.arcEnd, bu); dot(D.arcEnd); }
    else { ctx.beginPath(); ctx.moveTo(sx(a.x), sy(a.y)); ctx.lineTo(sx(cur.x), sy(cur.y)); ctx.stroke(); }
  } else if (D.kind === 'arc3m') { P.forEach(dot); if (P.length === 2) arcPts(P[0], P[1], 0); if (P.length === 3) { var b3 = G.arc3Bulge(P[0], P[2], P[1]); if (b3 != null) arcPts(P[0], P[1], b3); } }
  else if (D.kind === 'arcCm') {
    P.forEach(dot); var c0 = P[0];
    if (P.length >= 2) { var rr = Math.hypot(P[1].x - c0.x, P[1].y - c0.y); ctx.beginPath(); ctx.moveTo(sx(c0.x), sy(c0.y)); ctx.lineTo(sx(P[1].x), sy(P[1].y)); ctx.stroke();
      if (P.length === 3) { var ae = Math.atan2(P[2].y - c0.y, P[2].x - c0.x), en = { x: c0.x + rr * Math.cos(ae), y: c0.y + rr * Math.sin(ae) }; arcPts(P[1], en, C.bulgeFromArc(Math.atan2(P[1].y - c0.y, P[1].x - c0.x), ae, !ui.shift)); } label2(sx(cur.x), sy(cur.y), 'R ' + C.f2(rr)); }
  } else if (D.kind === 'circle3m') { P.forEach(dot); if (P.length === 3) { var cc = G.circle3(P[0], P[1], P[2]); if (cc) { ctx.beginPath(); ctx.arc(sx(cc.x), sy(cc.y), cc.r * view.s, 0, 7); ctx.stroke(); label2(sx(cur.x), sy(cur.y), 'Ø ' + C.f2(2 * cc.r)); } } }
  ctx.restore();
}

/* ================= TESTO (insegne, scritte): contorno, svuotamento, tratto singolo ================= */
var FONT_OPTS = [['sans', 'Bastoni grassetto (DejaVu Sans Bold)'], ['sansl', 'Bastoni normale (DejaVu Sans)'], ['serif', 'Graziato grassetto (DejaVu Serif Bold)'], ['futural', 'Tratto singolo bastoni (Hershey)'], ['futuram', 'Tratto singolo doppio (Hershey)'], ['timesr', 'Tratto singolo graziato (Hershey)'], ['scripts', 'Tratto singolo corsivo (Hershey)']];
var userFonts = {};
function contoursToOps(list, closed, o) {
  var ang = (o.rot || 0) * Math.PI / 180, ca = Math.cos(ang), sa = Math.sin(ang);
  return list.filter(function (c) { return c.length > 1; }).map(function (c) {
    var pts = c.map(function (p) { var x = p.x * ca - p.y * sa + o.x, y = p.x * sa + p.y * ca + o.y; return { x: r2(x), y: r2(y), b: p.b || 0 }; });
    return newPath(pts, closed, { tool: o.tool, depth: o.depth, corr: o.corr || 'C', note: o.note });
  });
}
function textOps(o) {
  var single = /^(futural|futuram|timesr|scripts)$/.test(o.font), t = SHAPES.text(o.text, { font: o.font, height: o.h, spacing: o.sp, userFont: userFonts[o.font] }), tl = toolOf({ tool: o.tool }), D = tl ? tl.d : 10;
  var dx = o.align === 'c' ? -t.w / 2 : o.align === 'r' ? -t.w : 0, list = t.contours.map(function (c) { return c.map(function (p) { return { x: p.x + dx, y: p.y }; }); }), ops, info = '';
  if (single || o.mode === 'tratto') ops = contoursToOps(list, false, { x: o.x, y: o.y, rot: o.rot, tool: o.tool, depth: o.depth, corr: 'C', note: 'testo' });
  else if (o.mode === 'svuota') { var rings = SHAPES.pocket(list, D, o.step); ops = contoursToOps(rings, true, { x: o.x, y: o.y, rot: o.rot, tool: o.tool, depth: o.depth, corr: 'C', note: 'testo svuotato' }); info = rings.length + ' passate di svuotamento'; }
  else if (o.mode === 'fuori') ops = contoursToOps(SHAPES.offset(list, D / 2), true, { x: o.x, y: o.y, rot: o.rot, tool: o.tool, depth: o.depth, corr: 'C', note: 'testo a rilievo (contorno esterno)' });
  else ops = contoursToOps(list, true, { x: o.x, y: o.y, rot: o.rot, tool: o.tool, depth: o.depth, corr: 'C', note: 'testo' });
  return { ops: ops, w: t.w, h: t.h, info: info, single: single };
}
cmd('textCmd', 'Testo…', function () {
  setEnv('cad', true); var P = job.panel, d = ui.textDef || { text: 'GAMMA ARREDI', font: 'sans', h: 60, sp: 0, mode: 'svuota', rot: 0, align: 'c', depth: 5, step: 60 };
  var fopts = FONT_OPTS.concat(Object.keys(userFonts).map(function (k) { return [k, 'Mio font: ' + k]; }));
  dlg('Disegna: Testo', '<label class="f wide">Testo (più righe con Invio)<textarea id="qTx" rows="2" style="width:100%;font:inherit">' + esc(d.text) + '</textarea></label>' +
    '<div class="grid2">' + field('qFont', 'Carattere', d.font, { select: fopts, wide: true }) + field('qH', 'Altezza maiuscole', d.h, { unit: 'mm' }) + field('qSp', 'Spaziatura extra', d.sp, { unit: 'mm' }) +
    field('qMode', 'Lavorazione', d.mode, { select: [['svuota', 'Svuota le lettere (incavo)'], ['profilo', 'Contorno delle lettere in asse'], ['fuori', 'Contorno esterno compensato (lettere a rilievo)'], ['tratto', 'Tratto singolo (incisione)']] }) + field('qAl', 'Allineamento', d.align, { select: [['l', 'Da sinistra'], ['c', 'Centrato'], ['r', 'Da destra']] }) + '</div>' +
    '<div class="grid2">' + ptField('p', 'Posizione linea di base', d.x != null ? d.x : P.L / 2, d.y != null ? d.y : P.W / 2 - d.h / 2) + '</div>' +
    '<div class="grid2">' + field('qRot', 'Rotazione', d.rot, { unit: '°' }) + field('qT', 'Fresa', d.tool || ui.def.millTool, { select: millOpts() }) + field('qP', 'Profondità', d.depth, { unit: 'mm' }) + field('qSt', 'Passo svuotamento', d.step, { unit: '% Ø' }) + '</div>' +
    '<div class="row"><button class="btn small" id="qLoadFont" type="button">Carica un font TTF/OTF…</button></div><p class="note" id="qTxInfo">I caratteri a tratto singolo si incidono lungo la linea; gli altri si svuotano o si contornano. Le lettere più strette della fresa restano senza passata: aumenta l\'altezza o usa una fresa più piccola.</p>', 'Inserisci', function () {
      var o = { text: $('qTx').value, font: $('qFont').value, h: v('qH', 60), sp: v('qSp', 0), mode: $('qMode').value, align: $('qAl').value, rot: v('qRot', 0), tool: $('qT').value, depth: v('qP', 5), step: v('qSt', 60) }, p = vpt('p'); o.x = p.x; o.y = p.y;
      if (!o.text.trim()) { toast('Scrivi il testo'); return false; }
      var r = textOps(o); if (!r.ops.length) { toast('Nessuna passata: lettere troppo piccole per la fresa'); return false; }
      ui.textDef = o; addOps(r.ops); toast(r.ops.length + ' fresature di testo inserite' + (r.info ? ' · ' + r.info : '') + ' · ingombro ' + C.f2(r.w) + ' × ' + C.f2(r.h) + ' mm');
    }, true);
  $('qLoadFont').onclick = function () {
    var inp = document.createElement('input'); inp.type = 'file'; inp.accept = '.ttf,.otf,.woff';
    inp.onchange = function () { var f = inp.files[0]; if (!f) return; f.arrayBuffer().then(function (buf) { try { var font = opentype.parse(buf), name = (font.names.fullName && (font.names.fullName.it || font.names.fullName.en)) || f.name; var H = font.charToGlyph('H').getBoundingBox(); font.capH = H.y2 > 0 ? H.y2 : font.unitsPerEm * 0.7; userFonts[name] = font; var sel = $('qFont'); var op = document.createElement('option'); op.value = name; op.textContent = 'Mio font: ' + name; sel.appendChild(op); sel.value = name; toast('Font caricato: ' + name); } catch (err) { toast('Font non leggibile'); } }); };
    inp.click();
  };
});

/* ================= IMPORT SVG ================= */
cmd('importSvg', 'Importa SVG…', function () {
  var inp = document.createElement('input'); inp.type = 'file'; inp.accept = '.svg,image/svg+xml';
  inp.onchange = function () { var f = inp.files[0]; if (!f) return; f.text().then(function (t) { svgDialog(t, f.name); }); };
  inp.click();
});
function svgDialog(src, name) {
  var res; try { res = SHAPES.svg(src, { tol: 0.1 }); } catch (e) { return toast('SVG non leggibile: ' + e.message); }
  if (!res.shapes.length) return toast('Nessun tracciato nel file SVG (testi da convertire in tracciati prima di salvare)');
  setEnv('cad', true); var P = job.panel, nClosed = res.shapes.filter(function (s) { return s.closed; }).length;
  dlg('Importa SVG: ' + esc(name), '<div class="kv"><span>Tracciati</span><span>' + res.shapes.length + ' (' + nClosed + ' chiusi)</span><span>Dimensioni nel file</span><span>' + C.f2(res.w) + ' × ' + C.f2(res.h) + ' mm</span></div>' +
    '<div class="grid2">' + field('qW', 'Larghezza finale', r2(res.w), { unit: 'mm' }) + field('qMode', 'Lavorazione', 'profilo', { select: [['profilo', 'Fresatura sui tracciati (in asse)'], ['dentro', 'Chiusi: fresa all\'interno'], ['fuori', 'Chiusi: fresa all\'esterno (sagome)'], ['svuota', 'Chiusi: svuota (isole rispettate)']] }) + '</div>' +
    '<div class="grid2">' + ptField('p', 'Angolo in basso a sinistra', r2(Math.max(0, (P.L - res.w) / 2)), r2(Math.max(0, (P.W - res.h) / 2))) + '</div>' +
    '<div class="grid2">' + field('qT', 'Fresa', ui.def.millTool, { select: millOpts() }) + field('qP', 'Profondità', ui.def.millDepth, { unit: 'mm' }) + field('qTol', 'Riduzione tratti (tolleranza)', 0.05, { unit: 'mm' }) + field('qSt', 'Passo svuotamento', 60, { unit: '% Ø' }) + '</div>' +
    '<p class="note">Le curve vengono convertite in tratti corti e poi ridotti entro la tolleranza; i cerchi restano archi esatti. Controlla il risultato prima della produzione.</p>', 'Importa', function () {
      var k = v('qW', res.w) / (res.w || 1), p = vpt('p'), mode = $('qMode').value, tl = toolOf({ tool: $('qT').value }), D = tl ? tl.d : 10, ops = [], tol = v('qTol', 0.05);
      var sc = function (s) { return s.pts.map(function (q) { return { x: q.x * k, y: q.y * k }; }); };
      var base = { x: p.x, y: p.y, tool: $('qT').value, depth: v('qP', 5), note: name };
      if (mode === 'svuota') { var cl = res.shapes.filter(function (s) { return s.closed; }).map(sc); ops = contoursToOps(SHAPES.pocket(cl, D, v('qSt', 60)), true, base); }
      else res.shapes.forEach(function (s) {
        if (s.circle && s.closed) { var c = s.circle; ops.push(newPath(C.circlePath(r2(c.cx * k + p.x), r2(c.cy * k + p.y), r2(c.r * k)), true, { tool: base.tool, depth: base.depth, corr: mode === 'dentro' ? 'IN' : mode === 'fuori' ? 'OUT' : 'C', note: name })); return; }
        var o = contoursToOps([sc(s)], s.closed, Object.assign({}, base, { corr: s.closed && mode === 'dentro' ? 'IN' : s.closed && mode === 'fuori' ? 'OUT' : 'C' }))[0];
        if (o) { var rd = TOPO.reduce(o, tol); ops.push(rd.op); }
      });
      if (!ops.length) { toast('Nessuna lavorazione generata'); return false; }
      addOps(ops); fitPanel(); toast(ops.length + ' fresature importate da SVG');
    }, true);
}
