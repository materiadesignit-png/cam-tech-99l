/* ===== TOPO: segmenti, intersezioni, taglia, estendi, riduzione fresature (usa CORE) =====
   Modello: fresatura = pts[] con bulge b sul punto di partenza di ogni tratto (b=0 retta, b=tan(sweep/4), >0 antiorario). */
var TOPO = (function () {
  'use strict';
  var C = typeof CORE !== 'undefined' ? CORE : require('./core.js');
  var EPS = 1e-7, TWO = 2 * Math.PI;

  // tratti di un percorso; ogni tratto: {a, b, bulge, k, arc?}
  function asPath(op) { // contorno geometrico di un'entità (fresature e tasche); null per fori
    if (!op) return null;
    if (op.type === 'path') return op;
    if (op.type === 'pocket') return { type: 'path', closed: true, pts: op.shape === 'circle' ? C.circlePath(op.x, op.y, op.r) : op.shape === 'poly' ? op.pts : C.rectPath(op.x, op.y, op.x2, op.y2, op.radius || 0) };
    return null;
  }
  function segs(op) {
    op = asPath(op); if (!op || !op.pts) return [];
    var P = op.pts, n = P.length, out = [], m = op.closed ? n : n - 1;
    for (var k = 0; k < m; k++) {
      var a = P[k], b = P[(k + 1) % n], bu = a.b || 0, s = { a: a, b: b, bulge: bu, k: k };
      if (Math.abs(bu) > EPS) { var A = C.arcFromBulge(a, b, bu); if (A) s.arc = { cx: A.cx, cy: A.cy, r: A.r, a1: A.a1, sw: 4 * Math.atan(bu) }; }
      out.push(s);
    }
    return out;
  }
  function pointAt(s, t) {
    if (!s.arc) return { x: s.a.x + (s.b.x - s.a.x) * t, y: s.a.y + (s.b.y - s.a.y) * t };
    var ang = s.arc.a1 + s.arc.sw * t; return { x: s.arc.cx + s.arc.r * Math.cos(ang), y: s.arc.cy + s.arc.r * Math.sin(ang) };
  }
  function segLen(s) { return s.arc ? Math.abs(s.arc.sw) * s.arc.r : Math.hypot(s.b.x - s.a.x, s.b.y - s.a.y); }
  // parametro angolare t di un punto che sta sulla circonferenza dell'arco (anche fuori dall'arco: t<0 o t>1)
  function arcT(arc, p) {
    var ang = Math.atan2(p.y - arc.cy, p.x - arc.cx), d = ang - arc.a1;
    if (arc.sw > 0) { while (d < -EPS) d += TWO; while (d > TWO - EPS) d -= TWO; } else { while (d > EPS) d -= TWO; while (d < -TWO + EPS) d += TWO; }
    return d / arc.sw;
  }
  // intersezioni geometriche tra supporti (retta infinita / circonferenza); restituisce punti
  function rawInter(s1, s2) {
    var pts = [];
    if (!s1.arc && !s2.arc) {
      var d1x = s1.b.x - s1.a.x, d1y = s1.b.y - s1.a.y, d2x = s2.b.x - s2.a.x, d2y = s2.b.y - s2.a.y, den = d1x * d2y - d1y * d2x;
      if (Math.abs(den) < 1e-12) return pts;
      var t = ((s2.a.x - s1.a.x) * d2y - (s2.a.y - s1.a.y) * d2x) / den; pts.push({ x: s1.a.x + d1x * t, y: s1.a.y + d1y * t });
    } else if (s1.arc && s2.arc) {
      var A = s1.arc, B = s2.arc, dx = B.cx - A.cx, dy = B.cy - A.cy, d = Math.hypot(dx, dy);
      if (d < EPS || d > A.r + B.r + 1e-9 || d < Math.abs(A.r - B.r) - 1e-9) return pts;
      var a = (A.r * A.r - B.r * B.r + d * d) / (2 * d), h2 = A.r * A.r - a * a, h = h2 > 0 ? Math.sqrt(h2) : 0, mx = A.cx + dx * a / d, my = A.cy + dy * a / d;
      pts.push({ x: mx - dy * h / d, y: my + dx * h / d }); if (h > 1e-9) pts.push({ x: mx + dy * h / d, y: my - dx * h / d });
    } else {
      var L = s1.arc ? s2 : s1, R = s1.arc ? s1.arc : s2.arc, fx = L.b.x - L.a.x, fy = L.b.y - L.a.y, gx = L.a.x - R.cx, gy = L.a.y - R.cy;
      var qa = fx * fx + fy * fy, qb = 2 * (fx * gx + fy * gy), qc = gx * gx + gy * gy - R.r * R.r, disc = qb * qb - 4 * qa * qc;
      if (qa < 1e-12 || disc < -1e-9) return pts; disc = Math.max(0, disc);
      var r1 = (-qb - Math.sqrt(disc)) / (2 * qa), r2 = (-qb + Math.sqrt(disc)) / (2 * qa);
      pts.push({ x: L.a.x + fx * r1, y: L.a.y + fy * r1 }); if (disc > 1e-12) pts.push({ x: L.a.x + fx * r2, y: L.a.y + fy * r2 });
    }
    return pts;
  }
  function tOn(s, p) { // parametro del punto p sul tratto s (supporto esteso)
    if (s.arc) return arcT(s.arc, p);
    var dx = s.b.x - s.a.x, dy = s.b.y - s.a.y, L2 = dx * dx + dy * dy; return L2 ? ((p.x - s.a.x) * dx + (p.y - s.a.y) * dy) / L2 : 0;
  }
  var TT = 1e-6;
  function inter(s1, s2) { // intersezioni reali tra due tratti: [{p, t1, t2}]
    return rawInter(s1, s2).map(function (p) { return { p: p, t1: tOn(s1, p), t2: tOn(s2, p) }; }).filter(function (q) { return q.t1 >= -TT && q.t1 <= 1 + TT && q.t2 >= -TT && q.t2 <= 1 + TT; });
  }
  // tratto più vicino a un punto: {i, t, d}
  function nearestSeg(S, p) {
    var best = null;
    S.forEach(function (s, i) {
      var t = Math.max(0, Math.min(1, tOn(s, p))); if (s.arc) { var ta = arcT(s.arc, p); t = ta >= 0 && ta <= 1 ? ta : (Math.hypot(p.x - s.a.x, p.y - s.a.y) < Math.hypot(p.x - s.b.x, p.y - s.b.y) ? 0 : 1); }
      var q = pointAt(s, t), d = Math.hypot(q.x - p.x, q.y - p.y); if (!best || d < best.d) best = { i: i, t: t, d: d };
    });
    return best;
  }
  // sotto-percorso tra i parametri globali u0 < u1 (u = indice tratto + t)
  function subPath(S, u0, u1) {
    var pts = [], i0 = Math.floor(u0), i1 = Math.floor(u1); if (i1 >= S.length) i1 = S.length - 1;
    for (var i = i0; i <= i1; i++) {
      var s = S[i], ta = i === i0 ? u0 - i0 : 0, tb = i === i1 ? Math.min(1, u1 - i) : 1; if (tb - ta < 1e-9) continue;
      var pa = pointAt(s, ta), bu = s.arc ? Math.tan(s.arc.sw * (tb - ta) / 4) : 0;
      pts.push({ x: rr(pa.x), y: rr(pa.y), b: Math.abs(bu) < 1e-9 ? 0 : bu });
      if (s.a.p != null && ta === 0) pts[pts.length - 1].p = s.a.p;
    }
    var e = pointAt(S[i1], Math.min(1, u1 - i1)); pts.push({ x: rr(e.x), y: rr(e.y), b: 0 });
    return pts;
  }
  function rr(v) { return Math.round(v * 1e4) / 1e4; }
  // parametri globali dove il percorso incontra le lame
  function cutParams(op, cutters) {
    var S = segs(op), us = [];
    cutters.forEach(function (c) { if (c === op) return; segs(c).forEach(function (cs) { S.forEach(function (s, i) { inter(s, cs).forEach(function (q) { us.push(i + Math.max(0, Math.min(1, q.t1))); }); }); }); });
    us.sort(function (a, b) { return a - b; });
    return us.filter(function (u, k) { return k === 0 || u - us[k - 1] > 1e-6; });
  }
  // TAGLIA: elimina la parte di op tra le due lame che racchiudono il punto p. Ritorna array di nuovi percorsi ([] = entità eliminata) o null se nessuna lama la incontra
  function trim(op, cutters, p) {
    if (op.type !== 'path' || op.pts.length < 2) return null;
    var S = segs(op), us = cutParams(op, cutters), N = S.length; if (!us.length) return null;
    var ns = nearestSeg(S, p), up = ns.i + ns.t;
    var base = function (pts) { var o = JSON.parse(JSON.stringify(op)); delete o.id; o.pts = pts; o.closed = false; if (o.corr === 'IN' || o.corr === 'OUT') o.corr = 'C'; delete o.leadIn; delete o.leadOut; return o; };
    if (!op.closed) {
      us = us.filter(function (u) { return u > 1e-6 && u < N - 1e-6; }); if (!us.length) return null;
      var lo = null, hi = null; us.forEach(function (u) { if (u < up) lo = u; else if (hi == null) hi = u; });
      var out = []; if (lo != null) out.push(base(subPath(S, 0, lo))); if (hi != null) out.push(base(subPath(S, hi, N)));
      return out.filter(function (o) { return o.pts.length >= 2; });
    }
    if (us.length < 2) return null; // un contorno chiuso va tagliato in almeno due punti
    var a = null, b = null; us.forEach(function (u) { if (u < up) a = u; else if (b == null) b = u; });
    if (a == null) a = us[us.length - 1]; if (b == null) b = us[0];
    // resta il tratto da b ad a girando in avanti
    var pts = b < a ? subPath(S, b, a) : subPath(S, b, N).concat(subPath(S, 0, a).slice(1));
    return [base(pts)];
  }
  // ESTENDI: allunga l'estremo di op più vicino a p fino al primo bordo incontrato
  function extend(op, borders, p) {
    if (op.type !== 'path' || op.closed || op.pts.length < 2) return null;
    var S = segs(op), N = S.length, atEnd = Math.hypot(p.x - op.pts[op.pts.length - 1].x, p.y - op.pts[op.pts.length - 1].y) < Math.hypot(p.x - op.pts[0].x, p.y - op.pts[0].y);
    var s = atEnd ? S[N - 1] : S[0], best = null;
    borders.forEach(function (c) {
      if (c === op) return;
      segs(c).forEach(function (cs) {
        rawInter(s, cs).forEach(function (q) {
          var t2 = tOn(cs, q); if (t2 < -TT || t2 > 1 + TT) return;
          var t = tOn(s, q), ext = atEnd ? t - 1 : -t; // quanto oltre l'estremo
          if (s.arc) { var at = arcT(s.arc, q), full = TWO / Math.abs(s.arc.sw); ext = at <= 1 + 1e-9 ? -1 : atEnd ? at - 1 : full - at; }
          if (ext > 1e-6 && (!best || ext < best.ext)) best = { ext: ext, q: q };
        });
      });
    });
    if (!best) return null;
    var o = JSON.parse(JSON.stringify(op)), q = { x: rr(best.q.x), y: rr(best.q.y) };
    if (atEnd) {
      var last = o.pts[o.pts.length - 1]; last.x = q.x; last.y = q.y;
      if (s.arc) o.pts[o.pts.length - 2].b = Math.tan(s.arc.sw * (1 + best.ext) / 4);
    } else {
      o.pts[0].x = q.x; o.pts[0].y = q.y;
      if (s.arc) o.pts[0].b = Math.tan(s.arc.sw * (1 + best.ext) / 4);
    }
    return o;
  }
  // RIDUZIONE FRESATURE: archi quasi piatti -> rette, tratti cortissimi tolti, rette allineate unite (entro tol)
  function reduce(op, tol) {
    tol = tol > 0 ? tol : 0.05;
    var P = op.pts.map(function (p) { return Object.assign({}, p); }), n0 = P.length, changed = true;
    P.forEach(function (p, k) { var q = P[(k + 1) % P.length]; if (!op.closed && k === P.length - 1) return; if (Math.abs(p.b || 0) > EPS) { var c = Math.hypot(q.x - p.x, q.y - p.y), sag = Math.abs(p.b) * c / 2; if (sag < tol) p.b = 0; } });
    while (changed) {
      changed = false;
      for (var k = 1; k < P.length - (op.closed ? 0 : 1); k++) {
        var a = P[k - 1], m = P[k], b = P[(k + 1) % P.length];
        if (P.length <= (op.closed ? 3 : 2)) break;
        var shortSeg = Math.hypot(m.x - a.x, m.y - a.y) < tol && !(a.b) ;
        var lineRun = !(a.b) && !(m.b) && distToLine(m, a, b) < tol && m.p == null;
        if ((shortSeg && !(m.b)) || lineRun) { P.splice(k, 1); changed = true; break; }
      }
    }
    var o = JSON.parse(JSON.stringify(op)); o.pts = P; return { op: o, removed: n0 - P.length };
  }
  function distToLine(p, a, b) { var dx = b.x - a.x, dy = b.y - a.y, L = Math.hypot(dx, dy); if (L < EPS) return Math.hypot(p.x - a.x, p.y - a.y); var t = ((p.x - a.x) * dx + (p.y - a.y) * dy) / (L * L); if (t < 0 || t > 1) return Infinity; return Math.abs((p.x - a.x) * dy - (p.y - a.y) * dx) / L; }
  // CONTROLLO INTEGRITÀ: tratti degeneri, punti doppi, autointersezioni
  function check(op) {
    var out = [], S = segs(op);
    S.forEach(function (s, i) { if (segLen(s) < 1e-3) out.push('tratto ' + (i + 1) + ' di lunghezza nulla'); });
    for (var i = 0; i < S.length; i++) for (var j = i + 2; j < S.length; j++) {
      if (op.closed && i === 0 && j === S.length - 1) continue;
      if (inter(S[i], S[j]).length) { out.push('autointersezione tra i tratti ' + (i + 1) + ' e ' + (j + 1)); if (out.length > 5) return out; }
    }
    return out;
  }
  function length(op) { return segs(op).reduce(function (a, s) { return a + segLen(s); }, 0); }
  return { segs: segs, inter: inter, pointAt: pointAt, segLen: segLen, trim: trim, extend: extend, reduce: reduce, check: check, length: length, nearestSeg: nearestSeg, subPath: subPath };
})();
if (typeof module !== 'undefined') module.exports = TOPO;
