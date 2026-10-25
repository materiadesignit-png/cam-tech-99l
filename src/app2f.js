
/* ================= CAD: Taglia, Estendi, Riduzione fresature, Quote, Informazioni (manuale Task 10.5.7, 10.5.8, 10.6.6, 10.7.3, 10.9) ================= */
var TP = TOPO;
function replaceOp(old, list) { var i = opIndex(old.id); list.forEach(function (o, k) { o.id = k === 0 ? old.id : nextId++; }); job.ops.splice.apply(job.ops, [i, 1].concat(list)); return list.map(function (o) { return o.id; }); }
function bladeLoop(kind) {
  var blades = selOps().filter(function (o) { return o.type === 'path' || o.type === 'pocket'; });
  if (!blades.length) return toast(kind === 'trim' ? 'Taglia: seleziona prima le lame (fresature o tasche), poi rilancia il comando' : 'Estendi: seleziona prima i bordi da raggiungere, poi rilancia il comando');
  ui.blades = blades.map(function (o) { return o.id; }); ui.sel = [];
  var msg = kind === 'trim' ? 'Taglia: clic sulla parte di fresatura da eliminare (lame in viola)' : 'Estendi: clic vicino all\'estremo della fresatura da allungare (bordi in viola)';
  ui.pick = {
    entity: true, blades: true, cb: function (he) {
      var bl = ui.blades.map(getOp).filter(Boolean), m = ui.mouse, p = { x: m.rx, y: m.ry };
      if (he.type !== 'path') return toast('Si possono ' + (kind === 'trim' ? 'tagliare' : 'estendere') + ' solo le fresature');
      var r = kind === 'trim' ? TP.trim(he, bl, p) : TP.extend(he, bl, p);
      if (!r) return toast(kind === 'trim' ? 'Nessuna lama incontra questa fresatura in quel tratto' : 'Nessun bordo raggiungibile da quell\'estremo');
      commit();
      if (kind === 'trim') { if (r.length) replaceOp(he, r); else job.ops = job.ops.filter(function (o) { return o.id !== he.id; }); ui.blades = ui.blades.filter(function (id) { return getOp(id); }); }
      else { var i = opIndex(he.id); r.id = he.id; job.ops[i] = r; }
      changed(); setPrompt(msg + ' (Esc per terminare)');
    }
  };
  setPrompt(msg + ' (Esc per terminare)'); draw();
}
cmd('trimEnt', 'Taglia', function () { setEnv('cad', true); bladeLoop('trim'); });
cmd('extendEnt', 'Estendi', function () { setEnv('cad', true); bladeLoop('extend'); });
cmd('reduceMill', 'Riduzione fresature…', function () {
  var pool = (ui.sel.length ? selOps() : job.ops).filter(function (o) { return o.type === 'path'; });
  if (!pool.length) return toast('Nessuna fresatura');
  dlg('Percorso: Riduzione fresature', field('qTol', 'Tolleranza', 0.05, { unit: 'mm' }) + '<p class="note">Toglie i tratti più corti della tolleranza, unisce le rette allineate e trasforma in rette gli archi quasi piatti. Applicato a ' + (ui.sel.length ? pool.length + ' fresature selezionate' : 'tutte le ' + pool.length + ' fresature') + '.</p>', 'Applica', function () {
    var tol = v('qTol', 0.05), tot = 0; commit();
    pool.forEach(function (o) { var r = TP.reduce(o, tol); if (r.removed) { var i = opIndex(o.id); r.op.id = o.id; job.ops[i] = r.op; tot += r.removed; } });
    changed(); toast(tot ? 'Tolti ' + tot + ' tratti' : 'Niente da ridurre entro la tolleranza');
  });
});

/* ---- Quote (annotazioni: non generano lavorazioni) ---- */
function dimText(d) {
  if (d.t === 'r') return 'R ' + C.f2(d.r);
  if (d.t === 'd') return 'Ø ' + C.f2(2 * d.r);
  var dx = Math.abs(d.b.x - d.a.x), dy = Math.abs(d.b.y - d.a.y);
  return C.f2(d.t === 'x' ? dx : d.t === 'y' ? dy : Math.hypot(dx, dy));
}
function dimGeom(d) { // linee della quota in coordinate mondo
  var a = d.a, b = d.b, o = d.o || 0;
  if (d.t === 'x') { var y = o; return { e1: [a, { x: a.x, y: y }], e2: [b, { x: b.x, y: y }], dl: [{ x: a.x, y: y }, { x: b.x, y: y }] }; }
  if (d.t === 'y') { var x = o; return { e1: [a, { x: x, y: a.y }], e2: [b, { x: x, y: b.y }], dl: [{ x: x, y: a.y }, { x: x, y: b.y }] }; }
  var L = Math.hypot(b.x - a.x, b.y - a.y) || 1, nx = -(b.y - a.y) / L, ny = (b.x - a.x) / L, a2 = { x: a.x + nx * o, y: a.y + ny * o }, b2 = { x: b.x + nx * o, y: b.y + ny * o };
  return { e1: [a, a2], e2: [b, b2], dl: [a2, b2] };
}
function drawDims() {
  if (!job.dims || !job.dims.length || ui.dimHide) return;
  var css = getComputedStyle(document.documentElement), ink = css.getPropertyValue('--ink').trim() || '#1b2320';
  ctx.save(); ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic'; ctx.strokeStyle = ink; ctx.fillStyle = ink; ctx.lineWidth = 1; ctx.font = '12px ' + (css.getPropertyValue('--f-mono') || 'monospace');
  job.dims.forEach(function (d) {
    var txt = dimText(d);
    if (d.t === 'r' || d.t === 'd') {
      var c = { x: d.cx, y: d.cy }, p = d.p, q = d.t === 'd' ? { x: 2 * c.x - p.x, y: 2 * c.y - p.y } : c;
      ctx.beginPath(); ctx.moveTo(sx(q.x), sy(q.y)); ctx.lineTo(sx(p.x), sy(p.y)); ctx.stroke(); arrow(q, p); if (d.t === 'd') arrow(p, q);
      ctx.fillText(txt, sx((p.x + q.x) / 2) + 4, sy((p.y + q.y) / 2) - 4); return;
    }
    var g = dimGeom(d);
    ctx.setLineDash([2, 2]); [g.e1, g.e2].forEach(function (l) { ctx.beginPath(); ctx.moveTo(sx(l[0].x), sy(l[0].y)); ctx.lineTo(sx(l[1].x), sy(l[1].y)); ctx.stroke(); }); ctx.setLineDash([]);
    ctx.beginPath(); ctx.moveTo(sx(g.dl[0].x), sy(g.dl[0].y)); ctx.lineTo(sx(g.dl[1].x), sy(g.dl[1].y)); ctx.stroke(); arrow(g.dl[0], g.dl[1]); arrow(g.dl[1], g.dl[0]);
    var mx = sx((g.dl[0].x + g.dl[1].x) / 2), my = sy((g.dl[0].y + g.dl[1].y) / 2), w = ctx.measureText(txt).width;
    ctx.save(); ctx.translate(mx, my); var ang = Math.atan2(-(g.dl[1].y - g.dl[0].y), g.dl[1].x - g.dl[0].x); if (ang > Math.PI / 2 || ang < -Math.PI / 2) ang += Math.PI; ctx.rotate(ang); ctx.fillText(txt, -w / 2, -4); ctx.restore();
  });
  ctx.restore();
  function arrow(from, to) { var x = sx(to.x), y = sy(to.y), a = Math.atan2(y - sy(from.y), x - sx(from.x)); ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - 8 * Math.cos(a - .35), y - 8 * Math.sin(a - .35)); ctx.lineTo(x - 8 * Math.cos(a + .35), y - 8 * Math.sin(a + .35)); ctx.closePath(); ctx.fill(); }
}
function drawBlades() {
  if (!ui.pick || !ui.pick.blades || !ui.blades) return;
  ctx.save(); ctx.strokeStyle = '#8b3fd1'; ctx.lineWidth = 3; ctx.globalAlpha = .8;
  ui.blades.map(getOp).filter(Boolean).forEach(function (o) { TP.segs(o).forEach(function (s) { ctx.beginPath(); for (var t = 0; t <= 1.0001; t += s.arc ? 1 / 24 : 1) { var q = TP.pointAt(s, Math.min(1, t)); if (t === 0) ctx.moveTo(sx(q.x), sy(q.y)); else ctx.lineTo(sx(q.x), sy(q.y)); } ctx.stroke(); }); });
  ctx.restore();
}
cmd('dimAdd', 'Quote: Imposta…', function () {
  setEnv('cad', true); ui.dimHide = false;
  dlg('Strumenti: Quote', field('qDt', 'Tipo di quota', ui.dimType || 'x', { select: [['x', 'X (orizzontale)'], ['y', 'Y (verticale)'], ['al', 'Allineata'], ['r', 'Raggio'], ['d', 'Diametro']] }) + '<p class="note">X, Y, allineata: clic sul primo punto, sul secondo e sulla posizione della linea di quota (osnap attivo). Raggio e diametro: clic su un arco, un cerchio o una tasca circolare. Le quote non generano lavorazioni.</p>', 'Inizia', function () {
    var t = ui.dimType = $('qDt').value;
    setTimeout(function () { dimStart(t); }, 0);
  });
});
function dimStart(t) {
  {
    if (t === 'r' || t === 'd') {
      pickEntity('Quota ' + (t === 'r' ? 'raggio' : 'diametro') + ': clic su un arco o un cerchio', function (he) {
        var m = ui.mouse, p = { x: m.rx, y: m.ry }, S = TP.segs(he), ns = S.length ? TP.nearestSeg(S, p) : null, s = ns && S[ns.i];
        if (!s || !s.arc) return toast('Clic su un tratto ad arco');
        var on = TP.pointAt(s, ns.t); commit(); job.dims = job.dims || []; job.dims.push({ t: t, cx: s.arc.cx, cy: s.arc.cy, r: s.arc.r, p: on }); changed();
      });
      return;
    }
    pickPoint('Quota: primo punto', function (a) { pickPoint('Quota: secondo punto', function (b) { pickPoint('Quota: posizione della linea di quota', function (c) {
      var o = t === 'x' ? c.y : t === 'y' ? c.x : (function () { var L = Math.hypot(b.x - a.x, b.y - a.y) || 1; return ((c.x - a.x) * -(b.y - a.y) + (c.y - a.y) * (b.x - a.x)) / L; })();
      commit(); job.dims = job.dims || []; job.dims.push({ t: t, a: { x: r2(a.x), y: r2(a.y) }, b: { x: r2(b.x), y: r2(b.y) }, o: r2(o) }); changed(); toast('Quota ' + dimText(job.dims[job.dims.length - 1]));
    }, b); }, a); });
  }
}
cmd('dimDel', 'Quote: Cancella…', function () {
  if (!job.dims || !job.dims.length) return toast('Nessuna quota nel disegno');
  ui.pick = { cb: function (p) {
    var best = -1, bd = 14 / view.s;
    job.dims.forEach(function (d, i) { var pts = d.t === 'r' || d.t === 'd' ? [d.p, { x: d.cx, y: d.cy }] : dimGeom(d).dl, m = { x: (pts[0].x + pts[1].x) / 2, y: (pts[0].y + pts[1].y) / 2 }, dd = Math.min(Math.hypot(p.x - m.x, p.y - m.y), Math.hypot(p.x - pts[0].x, p.y - pts[0].y), Math.hypot(p.x - pts[1].x, p.y - pts[1].y)); if (dd < bd) { bd = dd; best = i; } });
    if (best < 0) return toast('Clic vicino al testo o alla linea della quota');
    commit(); job.dims.splice(best, 1); changed(); if (!job.dims.length) cancelPick();
  } };
  setPrompt('Quote: clic sulle quote da cancellare (Esc per terminare)'); draw();
});
cmd('dimAll0', 'Quote: Cancella tutte', function () { if (!job.dims || !job.dims.length) return toast('Nessuna quota'); commit(); job.dims = []; changed(); toast('Quote cancellate'); });
cmd('dimShow', 'Quote: Vedi on/off', function () { ui.dimHide = !ui.dimHide; draw(); toast(ui.dimHide ? 'Quote nascoste' : 'Quote visibili'); });
cmd('dimPanel', 'Quote: pannello X e Y', function () {
  commit(); job.dims = job.dims || []; var P = job.panel;
  job.dims.push({ t: 'x', a: { x: 0, y: 0 }, b: { x: P.L, y: 0 }, o: r2(-Math.max(25, P.W * 0.06)) }); job.dims.push({ t: 'y', a: { x: 0, y: 0 }, b: { x: 0, y: P.W }, o: r2(-Math.max(25, P.L * 0.06)) });
  changed(); fitPanel(); toast('Quote del pannello aggiunte');
});

/* ---- Informazioni (10.9.2-10.9.4) e controllo geometria ---- */
cmd('infoSeg', 'Tratto fresatura', function () {
  setEnv('cad', true);
  pickEntity('Informazioni: clic su un tratto di fresatura', function (he) {
    var S = TP.segs(he); if (!S.length) return toast('Non è una fresatura');
    var m = ui.mouse, ns = TP.nearestSeg(S, { x: m.rx, y: m.ry }), s = S[ns.i]; cancelPick();
    var rows = '<span>Tratto</span><span>' + (ns.i + 1) + ' di ' + S.length + ' · ' + (s.arc ? 'arco ' + (s.arc.sw > 0 ? 'antiorario' : 'orario') : 'retta') + '</span><span>Inizio</span><span>' + C.f2(s.a.x) + ' ; ' + C.f2(s.a.y) + '</span><span>Fine</span><span>' + C.f2(s.b.x) + ' ; ' + C.f2(s.b.y) + '</span><span>Lunghezza</span><span>' + C.f2(TP.segLen(s)) + ' mm</span>';
    if (s.arc) rows += '<span>Centro</span><span>' + C.f2(s.arc.cx) + ' ; ' + C.f2(s.arc.cy) + '</span><span>Raggio</span><span>' + C.f2(s.arc.r) + ' mm</span><span>Ampiezza</span><span>' + C.f2(Math.abs(s.arc.sw) * 180 / Math.PI) + '°</span>';
    else rows += '<span>Angolo</span><span>' + C.f2(Math.atan2(s.b.y - s.a.y, s.b.x - s.a.x) * 180 / Math.PI) + '°</span>';
    dlg('Informazioni: Tratto fresatura', '<div class="kv">' + rows + '</div>', 'Chiudi', function () {});
  });
});
cmd('infoMill', 'Fresatura intera', function () {
  var o = primary(); if (!o || (o.type !== 'path' && o.type !== 'pocket')) return toast('Seleziona una fresatura o una tasca');
  var S = TP.segs(o), L = TP.length(o), bb = G.opBBox(o), iss = o.type === 'path' ? TP.check(o) : [], t = toolOf(o);
  var area = o.type === 'path' && o.closed ? Math.abs(C.signedArea(o.pts)) : null;
  dlg('Informazioni: Fresatura intera', '<div class="kv"><span>Tipo</span><span>' + (o.type === 'pocket' ? 'tasca' : o.closed ? 'percorso chiuso' : 'percorso aperto') + '</span><span>Tratti</span><span>' + S.length + ' (' + S.filter(function (s) { return s.arc; }).length + ' archi)</span><span>Lunghezza</span><span>' + C.f2(L) + ' mm</span>' + (area != null ? '<span>Area racchiusa</span><span>' + C.f2(area / 100) + ' cm²</span>' : '') +
    '<span>Ingombro</span><span>' + C.f2(bb.x0) + ' ; ' + C.f2(bb.y0) + ' → ' + C.f2(bb.x1) + ' ; ' + C.f2(bb.y1) + '</span><span>Profondità</span><span>' + C.f2(o.depth) + ' mm</span><span>Utensile</span><span>' + (t ? esc(t.code) + ' Ø' + t.d : '—') + '</span><span>Geometria</span><span>' + (iss.length ? '<span style="color:var(--err)">' + esc(iss.join('; ')) + '</span>' : 'nessun problema') + '</span></div>', 'Chiudi', function () {});
});
cmd('geoCheck', 'Controllo geometria', function () {
  var out = [];
  job.ops.forEach(function (o, i) {
    if (o.type === 'path') TP.check(o).forEach(function (m) { out.push('#' + (i + 1) + ' ' + m); });
    for (var j = i + 1; j < job.ops.length; j++) { var q = job.ops[j]; if (q.type === o.type && JSON.stringify(Object.assign({}, q, { id: 0 })) === JSON.stringify(Object.assign({}, o, { id: 0 }))) out.push('#' + (i + 1) + ' e #' + (j + 1) + ' sono duplicate'); }
  });
  dlg('Informazioni: Controllo geometria', out.length ? '<div class="issue err">' + out.length + ' problemi trovati</div><ul>' + out.slice(0, 40).map(function (m) { return '<li>' + esc(m) + '</li>'; }).join('') + '</ul>' : '<div class="issue ok">Nessun tratto nullo, autointersezione o entità duplicata.</div>', 'Chiudi', function () {});
});
