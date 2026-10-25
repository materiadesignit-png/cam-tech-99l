/* ===== CORE: geometria, DXF, generatore programma Kvara (nessuna dipendenza DOM) ===== */
var CORE = (function () {
  'use strict';
  var EPS = 1e-6;

  function f2(v) { var n = Math.round(v * 100) / 100; if (Object.is(n, -0)) n = 0; return n.toFixed(2); }
  function fi(v) { return String(Math.round(v)); }

  /* ---------- bulge (DXF) <-> arco ---------- */
  // segmento p1->p2 con bulge b: b>0 antiorario, b<0 orario
  function arcFromBulge(p1, p2, b) {
    var dx = p2.x - p1.x, dy = p2.y - p1.y, c = Math.hypot(dx, dy);
    if (Math.abs(b) < EPS || c < EPS) return null;
    var theta = 4 * Math.atan(b);              // angolo incluso (segno = verso)
    var r = c / (2 * Math.sin(Math.abs(theta) / 2));
    var mx = (p1.x + p2.x) / 2, my = (p1.y + p2.y) / 2;
    var h = r * Math.cos(Math.abs(theta) / 2); // distanza centro-corda
    var nx = -dy / c, ny = dx / c;             // normale a sinistra della corda
    var s = b > 0 ? 1 : -1; // h diventa negativo da solo oltre 180°
    var cx = mx + nx * h * s, cy = my + ny * h * s;
    return { cx: cx, cy: cy, r: r, a1: Math.atan2(p1.y - cy, p1.x - cx), a2: Math.atan2(p2.y - cy, p2.x - cx), ccw: b > 0 };
  }
  function bulgeFromArc(a1, a2, ccw) { // angoli in radianti
    var sweep = ccw ? a2 - a1 : a1 - a2;
    while (sweep <= 0) sweep += 2 * Math.PI;
    while (sweep > 2 * Math.PI + EPS) sweep -= 2 * Math.PI;
    return (ccw ? 1 : -1) * Math.tan(sweep / 4);
  }

  function pathLength(pts, closed) {
    var L = 0, n = pts.length, m = closed ? n : n - 1;
    for (var i = 0; i < m; i++) {
      var a = pts[i], b = pts[(i + 1) % n], arc = arcFromBulge(a, b, a.b || 0);
      if (arc) L += Math.abs(4 * Math.atan(a.b)) * arc.r; else L += Math.hypot(b.x - a.x, b.y - a.y);
    }
    return L;
  }
  function samplePath(pts, closed, stepDeg) {
    var out = [], n = pts.length, m = closed ? n : n - 1;
    for (var i = 0; i < m; i++) {
      var a = pts[i], b = pts[(i + 1) % n], arc = arcFromBulge(a, b, a.b || 0);
      out.push({ x: a.x, y: a.y });
      if (arc) {
        var sw = 4 * Math.atan(a.b), k = Math.max(2, Math.ceil(Math.abs(sw) * 180 / Math.PI / (stepDeg || 6)));
        for (var j = 1; j < k; j++) { var t = arc.a1 + sw * j / k; out.push({ x: arc.cx + arc.r * Math.cos(t), y: arc.cy + arc.r * Math.sin(t) }); }
      }
    }
    if (!closed && n) out.push({ x: pts[n - 1].x, y: pts[n - 1].y });
    return out;
  }
  function signedArea(pts) {
    var s = samplePath(pts, true), A = 0;
    for (var i = 0; i < s.length; i++) { var p = s[i], q = s[(i + 1) % s.length]; A += p.x * q.y - q.x * p.y; }
    return A / 2;
  }
  // correzione semantica -> G141 (destra) / G142 (sinistra) / null
  // sideFlip: sulla Tech 99L l'asse Y risulta invertito rispetto al disegno (rifilatura reale Sconto.PRG: giro antiorario + G142 = taglio esterno)
  function corrCode(op, sideFlip) {
    var c = op.corr || 'C';
    if (c === 'R') return 'G141';
    if (c === 'L') return 'G142';
    if ((c === 'IN' || c === 'OUT') && op.closed && op.pts.length > 1) {
      var ccw = signedArea(op.pts) > 0;            // antiorario: interno a sinistra
      var left = (c === 'IN') === ccw;
      if (sideFlip) left = !left;
      return left ? 'G142' : 'G141';
    }
    return null;
  }
  function pathBBox(pts) {
    var x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
    pts.forEach(function (p) { x0 = Math.min(x0, p.x); y0 = Math.min(y0, p.y); x1 = Math.max(x1, p.x); y1 = Math.max(y1, p.y); });
    return { x0: x0, y0: y0, x1: x1, y1: y1 };
  }

  /* ---------- forme ---------- */
  function rectPath(x0, y0, x1, y1, r) {
    var xa = Math.min(x0, x1), xb = Math.max(x0, x1), ya = Math.min(y0, y1), yb = Math.max(y0, y1);
    r = Math.max(0, Math.min(r || 0, (xb - xa) / 2 - 0.01, (yb - ya) / 2 - 0.01));
    if (r <= 0.01) return [{ x: xa, y: ya, b: 0 }, { x: xb, y: ya, b: 0 }, { x: xb, y: yb, b: 0 }, { x: xa, y: yb, b: 0 }];
    var q = Math.tan(Math.PI / 8); // 90° antiorario
    return [
      { x: xa + r, y: ya, b: 0 }, { x: xb - r, y: ya, b: q },
      { x: xb, y: ya + r, b: 0 }, { x: xb, y: yb - r, b: q },
      { x: xb - r, y: yb, b: 0 }, { x: xa + r, y: yb, b: q },
      { x: xa, y: yb - r, b: 0 }, { x: xa, y: ya + r, b: q }
    ];
  }
  function circlePath(cx, cy, r) { return [{ x: cx + r, y: cy, b: 1 }, { x: cx - r, y: cy, b: 1 }]; }

  /* ---------- tasche (svuotamenti) ---------- */
  // ritorna i percorsi del centro utensile, dall'interno verso il bordo; ogni percorso è chiuso
  function pocketContours(op, toolD) {
    var r = toolD / 2, step = Math.max(0.5, toolD * (op.stepover || 70) / 100), out = [];
    if (op.shape === 'poly') return (typeof GEOM !== 'undefined') ? GEOM.pocketPoly(op.pts, toolD, op.stepover || 70) : out;
    if (op.shape === 'circle') {
      var R = op.r - r; if (R <= 0) return out;
      var radii = [], k = R; while (k > step / 2) { radii.unshift(k); k -= step; }
      if (!radii.length) radii = [R];
      radii.forEach(function (rr) { out.push(circlePath(op.x, op.y, rr)); });
      return out;
    }
    var x0 = Math.min(op.x, op.x2), x1 = Math.max(op.x, op.x2), y0 = Math.min(op.y, op.y2), y1 = Math.max(op.y, op.y2);
    var cr = Math.max(0, (op.radius || 0) - r), w = x1 - x0 - 2 * r, h = y1 - y0 - 2 * r;
    if (w <= 0 || h <= 0) return out;
    var off = 0, list = [];
    while (true) {
      var ww = w - 2 * off, hh = h - 2 * off;
      if (ww <= 0.01 || hh <= 0.01) break;
      list.unshift(rectPath(x0 + r + off, y0 + r + off, x1 - r - off, y1 - r - off, Math.max(0, cr - off)));
      off += step;
      if (Math.min(ww, hh) - 2 * step < 0) {
        // centro non ancora coperto: passata finale sulla mezzeria
        var cx = (x0 + x1) / 2, cy = (y0 + y1) / 2, rem = Math.min(w - 2 * (off - step), h - 2 * (off - step));
        if (rem > step) { var hw = Math.max(0, (w - 2 * off) / 2), hh2 = Math.max(0, (h - 2 * off) / 2); list.unshift(hw > hh2 ? [{ x: cx - hw + hh2, y: cy, b: 0 }, { x: cx + hw - hh2, y: cy, b: 0 }] : [{ x: cx, y: cy - hh2 + hw, b: 0 }, { x: cx, y: cy + hh2 - hw, b: 0 }]); }
        break;
      }
    }
    return list;
  }

  // inverte il verso di un percorso mantenendo il punto di partenza (chiuso) e gli archi
  function reversePath(pts, closed) {
    var n = pts.length, out = [];
    if (closed) {
      var order = [0]; for (var i = n - 1; i >= 1; i--) order.push(i);
      for (var k = 0; k < n; k++) { var cur = pts[order[k]], nx = order[(k + 1) % n]; out.push({ x: cur.x, y: cur.y, b: -(pts[nx].b || 0) }); }
    } else for (var j = n - 1; j >= 0; j--) out.push({ x: pts[j].x, y: pts[j].y, b: j > 0 ? -(pts[j - 1].b || 0) : 0 });
    return out;
  }

  // direzione di percorrenza all'inizio o alla fine di un tratto a->b
  function tangentAt(a, b, atStart) {
    var arc = arcFromBulge(a, b, a.b || 0);
    if (!arc) { var L = Math.hypot(b.x - a.x, b.y - a.y) || 1; return { x: (b.x - a.x) / L, y: (b.y - a.y) / L }; }
    var p = atStart ? a : b, rx = p.x - arc.cx, ry = p.y - arc.cy, L2 = Math.hypot(rx, ry) || 1;
    return arc.ccw ? { x: -ry / L2, y: rx / L2 } : { x: ry / L2, y: -rx / L2 };
  }
  // tratti di ingresso/uscita (Lavorazioni->Ingresso/Uscita): retta tangente o quarto d'arco dal lato utensile
  function leadSegments(op, sideLeft) {
    var pts = op.pts, n = pts.length, res = { pre: null, post: null };
    if (n < 2) return res;
    var li = op.leadIn || {}, lo = op.leadOut || {};
    var t0 = tangentAt(pts[0], pts[1], true), nl0 = sideLeft ? { x: -t0.y, y: t0.x } : { x: t0.y, y: -t0.x };
    if (li.type === 'line' && li.len > 0) res.pre = [{ x: pts[0].x - t0.x * li.len, y: pts[0].y - t0.y * li.len, b: 0 }];
    else if (li.type === 'arc' && li.len > 0) { var c = { x: pts[0].x + nl0.x * li.len, y: pts[0].y + nl0.y * li.len }; res.pre = [{ x: c.x - t0.x * li.len, y: c.y - t0.y * li.len, b: (sideLeft ? 1 : -1) * Math.tan(Math.PI / 8) }]; }
    var ea = op.closed ? pts[n - 1] : pts[n - 2], eb = op.closed ? pts[0] : pts[n - 1], te = tangentAt(ea, eb, false), nle = sideLeft ? { x: -te.y, y: te.x } : { x: te.y, y: -te.x };
    if (lo.type === 'line' && lo.len > 0) res.post = { b: 0, end: { x: eb.x + te.x * lo.len, y: eb.y + te.y * lo.len } };
    else if (lo.type === 'arc' && lo.len > 0) { var c2 = { x: eb.x + nle.x * lo.len, y: eb.y + nle.y * lo.len }; res.post = { b: (sideLeft ? 1 : -1) * Math.tan(Math.PI / 8), end: { x: c2.x + te.x * lo.len, y: c2.y + te.y * lo.len } }; }
    return res;
  }

  /* ---------- tempo macchina stimato ---------- */
  function estimateTime(job) {
    var S = job.settings, T = job.tools, P = job.panel, sec = 0, rapid = 40000 / 60, last = { x: 0, y: 0 }; // rapidi 40 m/min (Axis.par)
    function mv(p) { sec += Math.hypot(p.x - last.x, p.y - last.y) / rapid; last = p; }
    function drill(depth, feed) { sec += 2 * (depth + 10) / (feed / 60) + 0.6; }
    job.ops.forEach(function (op) {
      if (op.type === 'hole') { var t = findDrill(T, op.d, op.face); if (op.face === 1) mv({ x: op.x, y: op.y }); else sec += 1.5; drill(op.depth, op.feed || (t && t.feed) || S.drillFeed); }
      else if (op.type === 'row') { var t2 = findDrill(T, op.d, 1); for (var i = 0; i < op.n; i++) { mv({ x: op.dir === 'X' ? op.x + i * op.step : op.x, y: op.dir === 'Y' ? op.y + i * op.step : op.y }); drill(op.depth, op.feed || (t2 && t2.feed) || S.drillFeed); } }
      else if (op.type === 'path') { var t3 = toolByCode(T, op.tool), F = op.feed || (t3 && t3.feed) || S.millFeed; mv(op.pts[0]); sec += (op.passes || 1) * (pathLength(op.pts, op.closed) / (F / 60) + 3); }
      else if (op.type === 'trim') { var t4 = toolByCode(T, op.tool), F4 = op.feed || (t4 && t4.feed) || S.millFeed; sec += (2 * (P.L + P.W) + 40) / (F4 / 60) + 3; }
      else if (op.type === 'pocket') { var t5 = toolByCode(T, op.tool), F5 = op.feed || (t5 && t5.feed) || S.millFeed, cs = pocketContours(op, t5 ? t5.d : 10), L = 0; cs.forEach(function (c) { L += pathLength(c, c.length > 2 || (c[0] && c[0].b)); }); sec += (op.passes || 1) * (L / (F5 / 60) + 3); }
    });
    return sec + 8; // carico/scarico testa e cambi faccia
  }

  /* ---------- DXF ---------- */
  function parseDXF(text) {
    var lines = text.split(/\r?\n/), pairs = [];
    for (var i = 0; i + 1 < lines.length; i += 2) pairs.push([parseInt(lines[i].trim(), 10), lines[i + 1].replace(/\s+$/, '')]);
    var ents = [], inEnt = false, cur = null, poly = null, insunits = 4;
    for (var k = 0; k < pairs.length; k++) {
      var c = pairs[k][0], v = pairs[k][1];
      if (c === 9 && v === '$INSUNITS' && pairs[k + 1]) insunits = parseInt(pairs[k + 1][1], 10);
      if (c === 2 && (v === 'ENTITIES' || v === 'BLOCKS')) { inEnt = v === 'ENTITIES'; continue; }
      if (c === 0 && v === 'ENDSEC') { flush(); inEnt = false; continue; }
      if (!inEnt) continue;
      if (c === 0) {
        flush();
        if (v === 'VERTEX' && poly) { cur = { t: 'VERTEX', x: 0, y: 0, b: 0 }; continue; }
        if (v === 'SEQEND' && poly) { ents.push(poly); poly = null; cur = null; continue; }
        cur = { t: v, layer: '0', pts: [], flags: 0 };
        if (v === 'POLYLINE') { poly = cur; cur = null; }
        continue;
      }
      var tgt = cur || poly; if (!tgt) continue;
      var n = parseFloat(v);
      if (c === 8) tgt.layer = v;
      else if (tgt.t === 'LWPOLYLINE') {
        if (c === 10) tgt.pts.push({ x: n, y: 0, b: 0 });
        else if (c === 20 && tgt.pts.length) tgt.pts[tgt.pts.length - 1].y = n;
        else if (c === 42 && tgt.pts.length) tgt.pts[tgt.pts.length - 1].b = n;
        else if (c === 70) tgt.flags = n;
      } else if (tgt.t === 'VERTEX') {
        if (c === 10) tgt.x = n; else if (c === 20) tgt.y = n; else if (c === 42) tgt.b = n;
      } else {
        if (c === 70) tgt.flags = n;
        tgt['g' + c] = n;
      }
    }
    function flush() {
      if (!cur) return;
      if (cur.t === 'VERTEX') { if (poly) poly.pts.push({ x: cur.x, y: cur.y, b: cur.b }); }
      else if (cur !== poly) ents.push(cur);
      cur = null;
    }
    flush();
    var scale = insunits === 1 ? 25.4 : insunits === 5 ? 10 : insunits === 6 ? 1000 : 1;
    var out = [];
    ents.forEach(function (e) {
      var L = e.layer;
      if (e.t === 'LINE') out.push({ kind: 'seg', layer: L, a: { x: e.g10, y: e.g20 }, b: { x: e.g11, y: e.g21 }, bulge: 0 });
      else if (e.t === 'ARC') {
        var cx = e.g10, cy = e.g20, r = e.g40, a1 = (e.g50 || 0) * Math.PI / 180, a2 = (e.g51 || 0) * Math.PI / 180;
        out.push({ kind: 'seg', layer: L, a: { x: cx + r * Math.cos(a1), y: cy + r * Math.sin(a1) }, b: { x: cx + r * Math.cos(a2), y: cy + r * Math.sin(a2) }, bulge: bulgeFromArc(a1, a2, true) });
      } else if (e.t === 'CIRCLE') out.push({ kind: 'circle', layer: L, x: e.g10, y: e.g20, r: e.g40 });
      else if (e.t === 'POINT') out.push({ kind: 'point', layer: L, x: e.g10, y: e.g20 });
      else if ((e.t === 'LWPOLYLINE' || e.t === 'POLYLINE') && e.pts.length > 1) {
        out.push({ kind: 'poly', layer: L, pts: e.pts.map(function (p) { return { x: p.x, y: p.y, b: p.b || 0 }; }), closed: !!(e.flags & 1) });
      }
    });
    if (scale !== 1) out.forEach(function (o) {
      function S(p) { p.x *= scale; p.y *= scale; }
      if (o.kind === 'seg') { S(o.a); S(o.b); } else if (o.kind === 'poly') o.pts.forEach(S); else { o.x *= scale; o.y *= scale; if (o.r) o.r *= scale; }
    });
    return { items: out, units: insunits };
  }

  // concatena segmenti sciolti (LINE/ARC) in polilinee, per layer
  function chainSegments(segs, tol) {
    tol = tol || 0.02;
    var used = new Array(segs.length).fill(false), chains = [];
    function near(p, q) { return Math.abs(p.x - q.x) < tol && Math.abs(p.y - q.y) < tol; }
    for (var i = 0; i < segs.length; i++) {
      if (used[i]) continue; used[i] = true;
      var s = segs[i], pts = [{ x: s.a.x, y: s.a.y, b: s.bulge }, { x: s.b.x, y: s.b.y, b: 0 }], grow = true;
      while (grow) {
        grow = false;
        for (var j = 0; j < segs.length; j++) {
          if (used[j] || segs[j].layer !== s.layer) continue;
          var t = segs[j], end = pts[pts.length - 1], start = pts[0];
          if (near(end, t.a)) { end.b = t.bulge; pts.push({ x: t.b.x, y: t.b.y, b: 0 }); }
          else if (near(end, t.b)) { end.b = -t.bulge; pts.push({ x: t.a.x, y: t.a.y, b: 0 }); }
          else if (near(start, t.b)) { pts.unshift({ x: t.a.x, y: t.a.y, b: t.bulge }); }
          else if (near(start, t.a)) { pts.unshift({ x: t.b.x, y: t.b.y, b: -t.bulge }); }
          else continue;
          used[j] = true; grow = true;
        }
      }
      var closed = pts.length > 2 && near(pts[0], pts[pts.length - 1]);
      if (closed) pts.pop();
      chains.push({ kind: 'poly', layer: s.layer, pts: pts, closed: closed });
    }
    return chains;
  }

  // interpreta il nome layer: FORO_D8_P12, FRESA_T5_P18, PANNELLO...
  function layerRule(name) {
    var u = (name || '').toUpperCase(), r = { role: null };
    function num(re) { var m = u.match(re); return m ? parseFloat(m[1].replace(',', '.')) : null; }
    if (/PANNELL|PANEL|SAGOMA_?EST|GREZZO/.test(u)) r.role = 'panel';
    else if (/FOR|DRILL|BORE|HOLE/.test(u)) r.role = 'hole';
    else if (/FRES|ROUT|MILL|CONTORN|TASCA|POCKET/.test(u)) r.role = 'mill';
    r.d = num(/(?:^|[_\- ])D(\d+(?:[.,]\d+)?)/);
    r.p = num(/(?:^|[_\- ])P(\d+(?:[.,]\d+)?)/);
    var t = u.match(/(?:^|[_\- ])T([A-Z0-9]+)/); r.t = t ? t[1] : null;
    if (/(?:^|[_\- ])(DX|DESTRA|RIGHT)(?:$|[_\- ])/.test(u)) r.corr = 'R';
    else if (/(?:^|[_\- ])(SX|SINISTRA|LEFT)(?:$|[_\- ])/.test(u)) r.corr = 'L';
    else if (/(?:^|[_\- ])(EST|ESTERNO|OUT|OUTSIDE)(?:$|[_\- ])/.test(u)) r.corr = 'OUT';
    else if (/(?:^|[_\- ])(INT|INTERNO|IN|INSIDE)(?:$|[_\- ])/.test(u)) r.corr = 'IN';
    else if (/(?:^|[_\- ])(CENTRO|CENTER|ASSE)(?:$|[_\- ])/.test(u)) r.corr = 'C';
    return r;
  }

  // DXF -> lavorazioni
  function dxfToOps(parsed, opts) {
    opts = opts || {};
    var segs = [], polys = [], circles = [], points = [];
    parsed.items.forEach(function (it) {
      if (it.kind === 'seg') segs.push(it); else if (it.kind === 'poly') polys.push(it);
      else if (it.kind === 'circle') circles.push(it); else points.push(it);
    });
    polys = polys.concat(chainSegments(segs));
    // contorno pannello: layer PANNELLO o, in mancanza, il chiuso più grande
    var panelPoly = null, area = -1;
    polys.forEach(function (p) {
      if (layerRule(p.layer).role === 'panel') { panelPoly = p; area = 1e18; }
    });
    if (!panelPoly && opts.autoPanel !== false) polys.forEach(function (p) {
      if (!p.closed) return; var bb = pathBBox(p.pts), a = (bb.x1 - bb.x0) * (bb.y1 - bb.y0);
      if (a > area) { area = a; panelPoly = p; }
    });
    var ox = 0, oy = 0, panel = null;
    if (panelPoly) {
      var bb = pathBBox(panelPoly.pts); ox = bb.x0; oy = bb.y0;
      panel = { L: bb.x1 - bb.x0, W: bb.y1 - bb.y0, rect: panelPoly.pts.length === 4 && panelPoly.pts.every(function (q) { return !q.b; }) };
    }
    var ops = [], warn = [];
    circles.forEach(function (c) {
      var r = layerRule(c.layer), d = r.d || 2 * c.r;
      if (r.role === 'mill' || (!r.role && d > (opts.maxDrill || 35.5))) {
        ops.push({ type: 'path', pts: circlePath(c.x - ox, c.y - oy, c.r), closed: true, tool: r.t, depth: r.p, corr: r.corr || 'IN', layer: c.layer });
      } else ops.push({ type: 'hole', face: 1, x: c.x - ox, y: c.y - oy, d: Math.round(d * 100) / 100, depth: r.p, layer: c.layer });
    });
    points.forEach(function (p) {
      var r = layerRule(p.layer);
      if (r.role === 'hole' && r.d) ops.push({ type: 'hole', face: 1, x: p.x - ox, y: p.y - oy, d: r.d, depth: r.p, layer: p.layer });
    });
    polys.forEach(function (p) {
      if (p === panelPoly && !(opts.millPanel)) return;
      var r = layerRule(p.layer);
      ops.push({ type: 'path', pts: p.pts.map(function (q) { return { x: q.x - ox, y: q.y - oy, b: q.b || 0 }; }), closed: p.closed, tool: r.t, depth: r.p, corr: r.corr || (p.closed ? 'IN' : 'C'), layer: p.layer });
    });
    if (panelPoly && !panel.rect) warn.push('Il contorno del pannello non è un rettangolo: uso il suo ingombro come grezzo.');
    return { ops: ops, panel: panel, panelPoly: panelPoly ? panelPoly.pts.map(function (q) { return { x: q.x - ox, y: q.y - oy, b: q.b || 0 }; }) : null, warnings: warn };
  }

  /* ---------- utensili ---------- */
  function findDrill(tools, d, face) {
    var want = face === 1 ? 'V' : 'H';
    var best = null;
    tools.forEach(function (t) {
      if (t.kind !== want || Math.abs(t.d - d) > 0.051) return;
      if (want === 'H' && t.face && +t.face !== face) return;   // mandrino orizzontale legato alla sua faccia
      if (!best) best = t;
    });
    return best;
  }
  function toolByCode(tools, code) {
    for (var i = 0; i < tools.length; i++) if (String(tools[i].code) === String(code)) return tools[i];
    return null;
  }

  /* ---------- controlli ---------- */
  function validate(job) {
    var P = job.panel, out = [];
    job.ops.forEach(function (op, i) {
      var tag = '#' + (i + 1) + ' ';
      if (op.type === 'hole') {
        if (op.face === 1) {
          if (op.x < 0 || op.y < 0 || op.x > P.L || op.y > P.W) out.push({ lvl: 'err', i: i, msg: tag + 'foro fuori dal pannello' });
          if (op.depth > P.T + 0.01) out.push({ lvl: 'warn', i: i, msg: tag + 'foro più profondo dello spessore: controlla il piano martire' });
        } else {
          var len = (op.face === 2 || op.face === 4) ? P.L : P.W;
          if (op.pos < 0 || op.pos > len) out.push({ lvl: 'err', i: i, msg: tag + 'foro orizzontale fuori dal fianco' });
          if (op.z - op.d / 2 < 0 || op.z + op.d / 2 > P.T) out.push({ lvl: 'warn', i: i, msg: tag + 'foro orizzontale esce dallo spessore' });
        }
        var dr = findDrill(job.tools, op.d, op.face);
        if (!dr) out.push({ lvl: 'err', i: i, msg: tag + 'nessuna punta ' + (op.face === 1 ? 'verticale' : 'orizzontale per la faccia ' + op.face) + ' Ø' + op.d + ' in attrezzaggio' });
        else if (dr.lut && op.depth > dr.lut) out.push({ lvl: 'err', i: i, msg: tag + 'profondità ' + op.depth + ' oltre la lunghezza utile della punta ' + dr.code + ' (' + dr.lut + ' mm)' });
      } else if (op.type === 'row') {
        var dr2 = findDrill(job.tools, op.d, 1);
        if (!dr2) out.push({ lvl: 'err', i: i, msg: tag + 'nessuna punta verticale Ø' + op.d + ' per la fila' });
        else if (dr2.lut && op.depth > dr2.lut) out.push({ lvl: 'err', i: i, msg: tag + 'profondità oltre la lunghezza utile della punta ' + dr2.code + ' (' + dr2.lut + ' mm)' });
        var xe = op.dir === 'X' ? op.x + op.step * (op.n - 1) : op.x, ye = op.dir === 'Y' ? op.y + op.step * (op.n - 1) : op.y;
        if (xe > P.L || ye > P.W || op.x < 0 || op.y < 0) out.push({ lvl: 'err', i: i, msg: tag + 'la fila di fori esce dal pannello' });
      } else if (op.type === 'path') {
        var t = toolByCode(job.tools, op.tool);
        if (!t) out.push({ lvl: 'err', i: i, msg: tag + 'fresatura senza utensile valido' });
        else { var maxP = op.depth; (op.pts || []).forEach(function (q) { if (q.p != null && q.p !== '') maxP = Math.max(maxP, +q.p); }); if (t.lut && maxP > t.lut) out.push({ lvl: 'err', i: i, msg: tag + 'profondità ' + maxP + ' oltre la lunghezza utile della fresa ' + t.code + ' (' + t.lut + ' mm)' }); }
        if (op.pts.length < 2) out.push({ lvl: 'err', i: i, msg: tag + 'percorso con meno di 2 punti' });
        if (op.depth > P.T + 2) out.push({ lvl: 'warn', i: i, msg: tag + 'profondità oltre lo spessore +2 mm' });
      } else if (op.type === 'pocket') {
        var tp = toolByCode(job.tools, op.tool);
        if (!tp) out.push({ lvl: 'err', i: i, msg: tag + 'tasca senza utensile valido' });
        else if (!pocketContours(op, tp.d).length) out.push({ lvl: 'err', i: i, msg: tag + 'tasca più piccola della fresa Ø' + tp.d });
        if (tp && tp.lut && op.depth > tp.lut) out.push({ lvl: 'err', i: i, msg: tag + 'profondità oltre la lunghezza utile della fresa ' + tp.code + ' (' + tp.lut + ' mm)' });
        if (op.depth > P.T + 2) out.push({ lvl: 'warn', i: i, msg: tag + 'tasca più profonda dello spessore' });
      } else if (op.type === 'trim') {
        var tt5 = toolByCode(job.tools, op.tool);
        if (!tt5) out.push({ lvl: 'err', i: i, msg: tag + 'rifilatura senza utensile valido' });
        else if (tt5.lut && op.depth > tt5.lut) out.push({ lvl: 'err', i: i, msg: tag + 'profondità oltre la lunghezza utile della fresa ' + tt5.code + ' (' + tt5.lut + ' mm)' });
        if (op.depth > P.T + 8) out.push({ lvl: 'warn', i: i, msg: tag + 'profondità rifilatura molto oltre lo spessore' });
      }
    });
    (job.supports || []).forEach(function (sp, k) {
      var lim = SUPPORT_LIMITS[sp.p - 1], tag = 'Piano ' + sp.p + ': ';
      if (!lim) { out.push({ lvl: 'err', i: -1, msg: tag + 'numero piano non valido (1-6)' }); return; }
      if (sp.x < lim[0] || sp.x > lim[1]) out.push({ lvl: 'err', i: -1, msg: tag + 'X ' + sp.x + ' fuori corsa (' + lim[0] + '…' + lim[1] + ')' });
      ['a', 'b', 'c'].forEach(function (v) { if (sp[v] != null && sp[v] !== '' && (sp[v] < -1205 || sp[v] > -25)) out.push({ lvl: 'err', i: -1, msg: tag + 'ventosa ' + v.toUpperCase() + ' ' + sp[v] + ' fuori corsa (−1205…−25)' }); });
    });
    if (!job.ops.length) out.push({ lvl: 'warn', i: -1, msg: 'Nessuna lavorazione nel programma' });
    return out;
  }

  /* ---------- generatore programma ---------- */
  var FACE_G = { 1: 'G221', 2: 'G222', 3: 'G223', 4: 'G224', 5: 'G225' };
  // corse dei piani (Dati\Supports.par della macchina): [PQMIN, PQMAX]
  var SUPPORT_LIMITS = [[15, 1040], [175, 1200], [335, 1360], [1476, 2570], [1636, 2730], [1795, 2890]];
  function sp2(v) { var t = f2(v); return (v >= 0 && Math.abs(v) < 10 ? '  ' : ' ') + t; }

  function generate(job) {
    var P = job.panel, S = job.settings, L = [], T = job.tools;
    function add(s) { L.push(s); }
    var d = new Date(), stamp = d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2);
    // formato dei .PRG della macchina (C:\Utente\*.PRG): intestazione dell'editor Kvara, G200, lavorazioni, RET
    add('Programma in versione Iso :' + progName(S));
    add(';$$SS');
    add(';$$SE');
    add('G200 X ' + f2(P.L) + ' Y ' + f2(P.W) + ' Z ' + f2(P.T) + ' E "' + (S.battuta || 'A') + ' " T " ' + (S.attrezzaggio || 'DEF') + ' "  H 0 K 0  R ' + (S.R == null ? 1 : S.R) +
        ' U' + sp2(0) + ' V' + sp2(0) + ' W' + sp2(0) + ';'); // controsagome U V W sempre a zero: si impostano a bordo macchina
    (job.supports || []).forEach(function (sp) {
      var l = 'G250 P ' + sp.p + ' X ' + f2(sp.x);
      ['a', 'b', 'c'].forEach(function (v) { if (sp[v] != null && sp[v] !== '') l += ' ' + v.toUpperCase() + ' ' + f2(sp[v]); });
      add(l);
    });
    var face = 1;
    job.ops.forEach(function (op, i) {
      var opFace = op.type === 'hole' ? op.face : 1;
      if (opFace !== face) { add(FACE_G[opFace]); face = opFace; }
      var c = op.note ? ' ;' + op.note.replace(/[\r\n;]/g, ' ') : '';
      if (op.type === 'hole') {
        var tool = findDrill(T, op.d, op.face), tcode = tool ? tool.code : '?';
        var F = op.feed || (tool && tool.feed) || S.drillFeed, Sp = op.rpm || (tool && tool.rpm) || S.drillRpm;
        if (op.face === 1) add('G100 X' + f2(op.x) + ' Y' + f2(op.y) + ' P' + f2(op.depth) + ' F' + fi(F) + ' S' + fi(Sp) + ' T"' + tcode + '"' + c);
        else add('G100 X' + f2(op.pos) + ' Y' + f2(op.z) + ' P' + f2(op.depth) + ' F' + fi(F) + ' S' + fi(Sp) + ' T"' + tcode + '"' + c);
      } else if (op.type === 'row') {
        var tr = findDrill(T, op.d, 1), Fr = op.feed || (tr && tr.feed) || S.drillFeed, Sr = op.rpm || (tr && tr.rpm) || S.drillRpm;
        if (op.dir === 'X') add('G210 X' + f2(op.x) + ' Y' + f2(op.y) + ' D' + f2(op.d) + ' A' + f2(op.step) + ' N' + op.n + ' U' + f2(op.x + op.step * (op.n - 1)) + ' P' + f2(op.depth) + ' F' + fi(Fr) + ' S' + fi(Sr) + c);
        else add('G211 X' + f2(op.x) + ' Y' + f2(op.y) + ' D' + f2(op.d) + ' A' + f2(op.step) + ' N' + op.n + ' V' + f2(op.y + op.step * (op.n - 1)) + ' P' + f2(op.depth) + ' F' + fi(Fr) + ' S' + fi(Sr) + c);
      } else if (op.type === 'path') {
        var tm = toolByCode(T, op.tool), tc = tm ? tm.code : '?';
        var Fe = op.feedIn || (tm && tm.feedIn) || S.millFeedIn, Fw = op.feed || (tm && tm.feed) || S.millFeed, Sm = op.rpm || (tm && tm.rpm) || S.millRpm;
        var pts = op.pts.slice(), passes = Math.max(1, op.passes || 1);
        var cc = corrCode(op, S.sideFlip !== false);
        if (cc) add(cc);
        var lead = leadSegments(op, cc ? cc === 'G142' : true);
        var dAt = function (p, k) { return (p && p.p != null && p.p !== '' ? +p.p : op.depth) * k; };
        var seg = function (a, b, depth) {
          var arc = arcFromBulge(a, b, a.b || 0);
          if (!arc) { add('G101 X' + f2(b.x) + ' Y' + f2(b.y) + ' P' + f2(depth) + ' F' + fi(Fw)); return; }
          if (Math.abs(4 * Math.atan(a.b)) > Math.PI + 1e-6) { // arco > 180°: spezzalo in due
            var mid = arc.a1 + (arc.ccw ? 1 : -1) * Math.abs(4 * Math.atan(a.b)) / 2;
            add((arc.ccw ? 'G103' : 'G102') + ' X' + f2(arc.cx + arc.r * Math.cos(mid)) + ' Y' + f2(arc.cy + arc.r * Math.sin(mid)) + ' P' + f2(depth) + ' I' + f2(arc.cx) + ' J' + f2(arc.cy) + ' F' + fi(Fw));
          }
          add((arc.ccw ? 'G103' : 'G102') + ' X' + f2(b.x) + ' Y' + f2(b.y) + ' P' + f2(depth) + ' I' + f2(arc.cx) + ' J' + f2(arc.cy) + ' F' + fi(Fw));
        };
        for (var pass = 1; pass <= passes; pass++) {
          var kf = pass / passes, cm = pass === 1 ? c : ' ;passata ' + pass + '/' + passes;
          if (lead.pre) {
            var lp = lead.pre[0];
            add('G100 X' + f2(lp.x) + ' Y' + f2(lp.y) + ' P' + f2(dAt(pts[0], kf)) + ' F' + fi(Fe) + ' S' + fi(Sm) + ' T"' + tc + '"' + cm);
            seg(lp, pts[0], dAt(pts[0], kf));
          } else add('G100 X' + f2(pts[0].x) + ' Y' + f2(pts[0].y) + ' P' + f2(dAt(pts[0], kf)) + ' F' + fi(Fe) + ' S' + fi(Sm) + ' T"' + tc + '"' + cm);
          var n = pts.length, m = op.closed ? n : n - 1;
          for (var k = 0; k < m; k++) seg(pts[k], pts[(k + 1) % n], dAt(pts[(k + 1) % n], kf));
          if (lead.post) { var eb = op.closed ? pts[0] : pts[n - 1]; seg({ x: eb.x, y: eb.y, b: lead.post.b }, lead.post.end, dAt(eb, kf)); }
        }
        if (cc) add('G140');
      } else if (op.type === 'pocket') {
        var tk = toolByCode(T, op.tool), tkc = tk ? tk.code : '?', cs = tk ? pocketContours(op, tk.d) : [];
        var Fk = op.feedIn || (tk && tk.feedIn) || S.millFeedIn, Fw2 = op.feed || (tk && tk.feed) || S.millFeed, Sk = op.rpm || (tk && tk.rpm) || S.millRpm, np = Math.max(1, op.passes || 1);
        var cw = op.dir === 'CW';
        for (var ps = 1; ps <= np && cs.length; ps++) {
          var dp = f2(op.depth * ps / np);
          cs.forEach(function (ct, ci) {
            var pts2 = cw && !(ct.length === 2 && !ct[0].b) ? reversePath(ct, true) : ct;
            if (ci === 0) add('G100 X' + f2(pts2[0].x) + ' Y' + f2(pts2[0].y) + ' P' + dp + ' F' + fi(Fk) + ' S' + fi(Sk) + ' T"' + tkc + '"' + (ps === 1 ? c : ' ;passata ' + ps + '/' + np));
            else add('G101 X' + f2(pts2[0].x) + ' Y' + f2(pts2[0].y) + ' P' + dp + ' F' + fi(Fw2));
            var closed = !(ct.length === 2 && !ct[0].b), n2 = pts2.length, m2 = closed ? n2 : n2 - 1;
            for (var k2 = 0; k2 < m2; k2++) {
              var a2 = pts2[k2], b2 = pts2[(k2 + 1) % n2], arc2 = arcFromBulge(a2, b2, a2.b || 0);
              if (!arc2) add('G101 X' + f2(b2.x) + ' Y' + f2(b2.y) + ' P' + dp + ' F' + fi(Fw2));
              else add((arc2.ccw ? 'G103' : 'G102') + ' X' + f2(b2.x) + ' Y' + f2(b2.y) + ' P' + dp + ' I' + f2(arc2.cx) + ' J' + f2(arc2.cy) + ' F' + fi(Fw2));
            }
          });
        }
      } else if (op.type === 'trim') {
        // rifilatura perimetrale nello stesso schema dei programmi della macchina (Sconto.PRG, ANTA PVC2MM.PRG)
        var tt = toolByCode(T, op.tool), ttc = tt ? tt.code : '?';
        var Fi = op.feedIn || (tt && tt.feedIn) || S.millFeedIn, Fo = op.feed || (tt && tt.feed) || S.millFeed, St = op.rpm || (tt && tt.rpm) || S.millRpm;
        var ld = op.lead == null ? 20 : op.lead, o = op.inset || 0, P1 = f2(op.depth);
        add(op.side === 'R' ? 'G141' : 'G142');
        add('G100 X' + f2(-ld) + ' Y ' + f2(o) + ' P' + P1 + ' F' + fi(Fi) + ' S' + fi(St) + ' T"' + ttc + '"' + c);
        add('G101 X DX Y ' + f2(o) + ' P' + P1 + ' F' + fi(Fo));
        add('G101 X DX Y DY');
        add('G101 X ' + f2(o) + ' Y DY');
        add('G101 X ' + f2(o) + ' Y ' + f2(-ld));
        add('G140');
      }
    });
    add('RET');
    return L.join('\r\n') + '\r\n';
  }
  function progName(S) { return String(S.progName || 'PROGRAMMA').replace(/[\\\/:*?"<>|;\r\n]/g, '').trim().slice(0, 60) || 'PROGRAMMA'; }

  /* ---------- ordinamento automatico ---------- */
  function autoOrder(ops) {
    function key(op) { var f = op.type === 'hole' ? op.face : 1; var t = op.type === 'path' || op.type === 'pocket' ? 2 : op.type === 'trim' ? 9 : 0; return (op.type === 'trim' ? 9 : f) * 10 + t; }
    function start(op) { if (op.type === 'trim') return { x: 0, y: 0 }; if (op.type === 'pocket') return { x: op.x, y: op.y }; if (op.type === 'path') return op.pts[0]; if (op.type === 'hole' && op.face !== 1) return { x: op.pos, y: 0 }; return { x: op.x, y: op.y }; }
    var groups = {}, keys = [];
    ops.forEach(function (o) { var k = key(o); if (!groups[k]) { groups[k] = []; keys.push(k); } groups[k].push(o); });
    keys.sort(function (a, b) { return a - b; });
    var res = [];
    keys.forEach(function (k) {
      var g = groups[k].slice(), cur = { x: 0, y: 0 };
      // fori: raggruppa per diametro, poi percorso più vicino
      if (k % 10 === 0) g.sort(function (a, b) { return a.d - b.d; });
      while (g.length) {
        var bi = 0, bd = 1e18, dd = g[0].d;
        for (var i = 0; i < g.length; i++) {
          if (k % 10 === 0 && g[i].d !== dd) continue;
          var s = start(g[i]), dist = Math.hypot(s.x - cur.x, s.y - cur.y);
          if (dist < bd) { bd = dist; bi = i; }
        }
        var o = g.splice(bi, 1)[0]; res.push(o); cur = start(o);
      }
    });
    return res;
  }

  /* ---------- zip (solo archiviazione) per salvare il .pgm ---------- */
  var CRC = (function () { var t = new Uint32Array(256); for (var n = 0; n < 256; n++) { var c = n; for (var k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
  function crc32(u8) { var c = 0xFFFFFFFF; for (var i = 0; i < u8.length; i++) c = CRC[(c ^ u8[i]) & 255] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0; }
  function latin1(s) { var u = new Uint8Array(s.length); for (var i = 0; i < s.length; i++) { var c = s.charCodeAt(i); u[i] = c < 256 ? c : 63; } return u; }
  function zipStore(files) { // [{name, data:Uint8Array}]
    var parts = [], central = [], off = 0;
    function u16(v) { return [v & 255, (v >>> 8) & 255]; }
    function u32(v) { return [v & 255, (v >>> 8) & 255, (v >>> 16) & 255, (v >>> 24) & 255]; }
    var dt = new Date(), dosT = (dt.getHours() << 11) | (dt.getMinutes() << 5) | (dt.getSeconds() >> 1), dosD = ((dt.getFullYear() - 1980) << 9) | ((dt.getMonth() + 1) << 5) | dt.getDate();
    files.forEach(function (f) {
      var nm = latin1(f.name), crc = crc32(f.data), sz = f.data.length;
      var h = [].concat(u32(0x04034b50), u16(10), u16(0), u16(0), u16(dosT), u16(dosD), u32(crc), u32(sz), u32(sz), u16(nm.length), u16(0));
      parts.push(new Uint8Array(h), nm, f.data);
      central.push([[].concat(u32(0x02014b50), u16(20), u16(10), u16(0), u16(0), u16(dosT), u16(dosD), u32(crc), u32(sz), u32(sz), u16(nm.length), u16(0), u16(0), u16(0), u16(0), u32(0), u32(off)), nm]);
      off += h.length + nm.length + sz;
    });
    var cdStart = off, cdSize = 0;
    central.forEach(function (c) { parts.push(new Uint8Array(c[0]), c[1]); cdSize += c[0].length + c[1].length; });
    parts.push(new Uint8Array([].concat(u32(0x06054b50), u16(0), u16(0), u16(files.length), u16(files.length), u32(cdSize), u32(cdStart), u16(0))));
    var total = parts.reduce(function (a, p) { return a + p.length; }, 0), out = new Uint8Array(total), o = 0;
    parts.forEach(function (p) { out.set(p, o); o += p.length; });
    return out;
  }

  return {
    f2: f2, arcFromBulge: arcFromBulge, bulgeFromArc: bulgeFromArc, pathLength: pathLength, pathBBox: pathBBox,
    rectPath: rectPath, samplePath: samplePath, signedArea: signedArea, corrCode: corrCode, circlePath: circlePath, parseDXF: parseDXF, chainSegments: chainSegments, layerRule: layerRule,
    dxfToOps: dxfToOps, findDrill: findDrill, toolByCode: toolByCode, validate: validate, generate: generate,
    autoOrder: autoOrder, leadSegments: leadSegments, tangentAt: tangentAt, reversePath: reversePath, pocketContours: pocketContours, estimateTime: estimateTime, progName: progName, SUPPORT_LIMITS: SUPPORT_LIMITS, zipStore: zipStore, latin1: latin1, crc32: crc32
  };
})();
if (typeof module !== 'undefined') module.exports = CORE;
