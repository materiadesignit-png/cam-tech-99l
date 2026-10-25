/* ===== GEOM: trasformazioni, raccordi, offset, unioni, oggetti (usa CORE e ClipperLib) ===== */
var GEOM = (function () {
  'use strict';
  var C = CORE;
  function r2(v) { return Math.round(v * 1000) / 1000; }
  function clone(o) { return JSON.parse(JSON.stringify(o)); }
  function dist(a, b) { return Math.hypot(b.x - a.x, b.y - a.y); }

  /* ---------- trasformazioni generiche di una lavorazione ---------- */
  // f: funzione punto->punto (affine), flip: true se inverte l'orientamento (specchio)
  function transformOp(op, f, flip, P) {
    var o = clone(op);
    if (o.type === 'path' || (o.type === 'pocket' && o.shape === 'poly')) {
      o.pts = o.pts.map(function (p) { var q = f(p); var n = { x: r2(q.x), y: r2(q.y), b: flip ? -(p.b || 0) : (p.b || 0) }; if (p.p != null) n.p = p.p; return n; });
    } else if (o.type === 'hole') {
      if (o.face === 1) { var q = f(o); o.x = r2(q.x); o.y = r2(q.y); }
      else return null;
    } else if (o.type === 'pocket' && o.shape === 'circle') { var c = f(o); o.x = r2(c.x); o.y = r2(c.y); }
    else if (o.type === 'pocket') {
      var a = f({ x: o.x, y: o.y }), b = f({ x: o.x2, y: o.y2 }), a2 = f({ x: o.x, y: o.y2 });
      var axisAligned = (Math.abs(a.x - a2.x) < 1e-6 || Math.abs(a.y - a2.y) < 1e-6);
      if (!axisAligned) { // ruotata: diventa tasca generica sul contorno
        o.shape = 'poly'; o.pts = C.rectPath(op.x, op.y, op.x2, op.y2, op.radius || 0).map(function (p) { var q = f(p); return { x: r2(q.x), y: r2(q.y), b: flip ? -(p.b || 0) : (p.b || 0) }; });
        delete o.x2; delete o.y2;
      } else { o.x = r2(Math.min(a.x, b.x)); o.y = r2(Math.min(a.y, b.y)); o.x2 = r2(Math.max(a.x, b.x)); o.y2 = r2(Math.max(a.y, b.y)); }
    } else if (o.type === 'row') {
      var h0 = f({ x: o.x, y: o.y }), last = { x: o.dir === 'X' ? o.x + (o.n - 1) * o.step : o.x, y: o.dir === 'Y' ? o.y + (o.n - 1) * o.step : o.y }, h1 = f(last);
      if (Math.abs(h0.x - h1.x) > 1e-6 && Math.abs(h0.y - h1.y) > 1e-6) {
        // non più parallela agli assi: fori singoli
        var out = []; for (var i = 0; i < o.n; i++) { var q2 = f({ x: o.dir === 'X' ? o.x + i * o.step : o.x, y: o.dir === 'Y' ? o.y + i * o.step : o.y }); out.push({ type: 'hole', face: 1, x: r2(q2.x), y: r2(q2.y), d: o.d, depth: o.depth }); }
        return out;
      }
      var horiz = Math.abs(h1.x - h0.x) >= Math.abs(h1.y - h0.y);
      o.dir = horiz ? 'X' : 'Y'; o.x = r2(Math.min(h0.x, h1.x)); o.y = r2(Math.min(h0.y, h1.y));
    } else if (o.type === 'trim') return null;
    return o;
  }
  function moveF(dx, dy) { return function (p) { return { x: p.x + dx, y: p.y + dy }; }; }
  function rotF(ang, cx, cy) { var a = ang * Math.PI / 180, c = Math.cos(a), s = Math.sin(a); return function (p) { var x = p.x - cx, y = p.y - cy; return { x: cx + x * c - y * s, y: cy + x * s + y * c }; }; }
  function scaleF(k, cx, cy) { return function (p) { return { x: cx + (p.x - cx) * k, y: cy + (p.y - cy) * k }; }; }
  function mirrorF(axis, v) { return axis === 'X' ? function (p) { return { x: 2 * v - p.x, y: p.y }; } : function (p) { return { x: p.x, y: 2 * v - p.y }; }; }
  // specchio rispetto a una retta per due punti
  function mirrorLineF(a, b) {
    var dx = b.x - a.x, dy = b.y - a.y, L = dx * dx + dy * dy;
    return function (p) { var t = ((p.x - a.x) * dx + (p.y - a.y) * dy) / L, fx = a.x + t * dx, fy = a.y + t * dy; return { x: 2 * fx - p.x, y: 2 * fy - p.y }; };
  }
  // trasformazione di fori orizzontali (solo specchio/sposta lungo il fianco)
  function transformSideHole(op, kind, arg, P) {
    var o = clone(op), alongX = o.face === 2 || o.face === 4;
    if (kind === 'move') { o.pos = r2(o.pos + (alongX ? arg.dx : arg.dy)); return o; }
    if (kind === 'mirror') {
      var swap = arg.axis === 'X' ? { 5: 3, 3: 5 } : { 2: 4, 4: 2 };
      if (swap[o.face]) o.face = swap[o.face]; else o.pos = r2(2 * arg.v - o.pos);
      return o;
    }
    return null;
  }

  /* ---------- raccordo e smusso su un vertice di un percorso ---------- */
  function segDir(a, b) { var L = dist(a, b); return { x: (b.x - a.x) / L, y: (b.y - a.y) / L, L: L }; }
  // vertice k tra due tratti rettilinei
  function filletAt(op, k, R, chamfer) {
    var n = op.pts.length, closed = op.closed;
    if (!closed && (k === 0 || k === n - 1)) return { err: 'Il vertice è un estremo del percorso' };
    var ip = (k - 1 + n) % n, P0 = op.pts[ip], P1 = op.pts[k], P2 = op.pts[(k + 1) % n];
    if ((P0.b || 0) !== 0 || (P1.b || 0) !== 0) return { err: 'Raccordo e smusso solo tra due tratti rettilinei' };
    var d1 = segDir(P1, P0), d2 = segDir(P1, P2);
    var cosA = d1.x * d2.x + d1.y * d2.y, ang = Math.acos(Math.max(-1, Math.min(1, cosA)));
    if (ang < 1e-6 || Math.abs(ang - Math.PI) < 1e-6) return { err: 'I due tratti sono allineati' };
    var t = chamfer ? R : R / Math.tan(ang / 2);
    if (t > d1.L - 1e-6 || t > d2.L - 1e-6) return { err: 'Raggio troppo grande per i tratti' };
    var A = { x: P1.x + d1.x * t, y: P1.y + d1.y * t }, B = { x: P1.x + d2.x * t, y: P1.y + d2.y * t };
    var bul = 0;
    if (!chamfer) { var cross = (P1.x - P0.x) * (P2.y - P1.y) - (P1.y - P0.y) * (P2.x - P1.x), sweep = Math.PI - ang; bul = (cross > 0 ? 1 : -1) * Math.tan(sweep / 4); }
    var o = clone(op), np = [];
    o.pts.forEach(function (p, i) {
      if (i === k) { np.push({ x: r2(A.x), y: r2(A.y), b: bul, p: p.p }); np.push({ x: r2(B.x), y: r2(B.y), b: 0, p: p.p }); }
      else np.push(p);
    });
    np.forEach(function (p) { if (p.p == null) delete p.p; });
    o.pts = np; return { op: o };
  }
  function roundAll(op, R) {
    var o = clone(op), changed = 0, guard = 0;
    for (var k = 0; k < o.pts.length && guard < 500; k++, guard++) {
      var r = filletAt(o, k, R, false);
      if (r.op) { o = r.op; k++; changed++; }
    }
    return { op: o, n: changed };
  }

  /* ---------- offset (Clipper) ---------- */
  var SC = 1000;
  function toClip(pts, closed) { return C.samplePath(pts, closed, 3).map(function (p) { return { X: Math.round(p.x * SC), Y: Math.round(p.y * SC) }; }); }
  function fromClip(path) { return path.map(function (p) { return { x: r2(p.X / SC), y: r2(p.Y / SC), b: 0 }; }); }
  function offsetPath(pts, closed, delta) {
    if (typeof ClipperLib === 'undefined') return [];
    var co = new ClipperLib.ClipperOffset(2, 0.01 * SC), sol = new ClipperLib.Paths();
    co.AddPath(toClip(pts, closed), ClipperLib.JoinType.jtRound, closed ? ClipperLib.EndType.etClosedPolygon : ClipperLib.EndType.etOpenRound);
    co.Execute(sol, delta * SC);
    return sol.map(function (p) { var q = fromClip(simplify(p)); return q; }).filter(function (p) { return p.length > 2; });
  }
  function simplify(path) { // toglie punti allineati
    if (path.length < 4) return path;
    var out = [];
    for (var i = 0; i < path.length; i++) {
      var a = path[(i - 1 + path.length) % path.length], b = path[i], c = path[(i + 1) % path.length];
      var cr = (b.X - a.X) * (c.Y - b.Y) - (b.Y - a.Y) * (c.X - b.X);
      if (Math.abs(cr) > 50 * SC) out.push(b); // area doppia > 0.05 mm² circa
    }
    return out.length > 2 ? out : path;
  }
  // svuotamento di un contorno generico: offset successivi verso l'interno
  function pocketPoly(pts, toolD, stepPct) {
    var r = toolD / 2, step = Math.max(0.5, toolD * (stepPct || 70) / 100), out = [], k = r, guard = 0;
    while (guard++ < 400) {
      var rings = offsetPath(pts, true, -k);
      if (!rings.length) break;
      rings.forEach(function (rg) { out.push(rg); });
      k += step;
    }
    return out.reverse(); // dal centro verso il bordo
  }

  /* ---------- unione e taglio percorsi ---------- */
  function joinTwo(a, b, tol) {
    tol = tol || 0.05;
    function near(p, q) { return dist(p, q) < tol; }
    var A = a.pts, B = b.pts, ae = A[A.length - 1], as = A[0], be = B[B.length - 1], bs = B[0], res = null;
    if (near(ae, bs)) res = A.slice(0, -1).concat([Object.assign({}, ae, { b: bs.b || 0 })]).concat(B.slice(1));
    else if (near(ae, be)) { var Br = C.reversePath(B, false); res = A.slice(0, -1).concat([Object.assign({}, ae, { b: Br[0].b || 0 })]).concat(Br.slice(1)); }
    else if (near(as, be)) res = B.slice(0, -1).concat([Object.assign({}, be, { b: as.b || 0 })]).concat(A.slice(1));
    else if (near(as, bs)) { var Ar = C.reversePath(A, false); res = Ar.slice(0, -1).concat([Object.assign({}, Ar[Ar.length - 1], { b: bs.b || 0 })]).concat(B.slice(1)); }
    if (!res) return null;
    var o = clone(a); o.pts = res.map(function (p) { return clone(p); });
    if (o.pts.length > 2 && near(o.pts[0], o.pts[o.pts.length - 1])) { o.pts[0].b = o.pts[0].b || 0; var lastB = o.pts[o.pts.length - 2].b; o.pts.pop(); o.closed = true; if (o.corr === 'C') o.corr = 'IN'; void lastB; }
    return o;
  }
  function autoJoin(paths) {
    var list = paths.map(clone), merged = true, count = 0;
    while (merged) {
      merged = false;
      for (var i = 0; i < list.length && !merged; i++) {
        if (list[i].closed) continue;
        for (var j = 0; j < list.length; j++) {
          if (i === j || list[j].closed) continue;
          var r = joinTwo(list[i], list[j]);
          if (r) { list[i] = r; list.splice(j, 1); merged = true; count++; break; }
        }
      }
    }
    return { paths: list, joins: count };
  }
  // taglia un percorso al vertice k: chiuso -> aperto che parte da k; aperto -> due percorsi
  function splitAt(op, k) {
    var o = clone(op), n = o.pts.length;
    if (o.closed) { var p = o.pts.slice(k).concat(o.pts.slice(0, k)); p.push(Object.assign({}, p[0], { b: 0 })); o.pts = p; o.closed = false; if (o.corr === 'IN' || o.corr === 'OUT') o.corr = 'C'; return [o]; }
    if (k <= 0 || k >= n - 1) return [o];
    var a = clone(o), b = clone(o); a.pts = o.pts.slice(0, k + 1); a.pts[a.pts.length - 1] = Object.assign({}, a.pts[a.pts.length - 1], { b: 0 }); b.pts = o.pts.slice(k); delete b.id;
    return [a, b];
  }

  /* ---------- costruzioni geometriche ---------- */
  function circle3(a, b, c) {
    var d = 2 * (a.x * (b.y - c.y) + b.x * (c.y - a.y) + c.x * (a.y - b.y));
    if (Math.abs(d) < 1e-9) return null;
    var ux = ((a.x * a.x + a.y * a.y) * (b.y - c.y) + (b.x * b.x + b.y * b.y) * (c.y - a.y) + (c.x * c.x + c.y * c.y) * (a.y - b.y)) / d;
    var uy = ((a.x * a.x + a.y * a.y) * (c.x - b.x) + (b.x * b.x + b.y * b.y) * (a.x - c.x) + (c.x * c.x + c.y * c.y) * (b.x - a.x)) / d;
    return { x: ux, y: uy, r: Math.hypot(a.x - ux, a.y - uy) };
  }
  // arco per inizio, punto intermedio, fine
  function arc3Bulge(a, m, b) {
    var cc = circle3(a, m, b); if (!cc) return null;
    var cross = (m.x - a.x) * (b.y - a.y) - (m.y - a.y) * (b.x - a.x); // >0: m a destra della corda -> centro a sinistra -> antiorario
    var ccw = cross > 0;
    return C.bulgeFromArc(Math.atan2(a.y - cc.y, a.x - cc.x), Math.atan2(b.y - cc.y, b.x - cc.x), ccw);
  }
  // ellisse come serie di archi tangenti (approssimazione a 4 archi per quadrante con errore < 0,05 mm tipico)
  function ellipsePath(cx, cy, a, b, rot, segs) {
    segs = segs || 72; var pts = [], ang = (rot || 0) * Math.PI / 180, ca = Math.cos(ang), sa = Math.sin(ang);
    for (var i = 0; i < segs; i++) { var t = 2 * Math.PI * i / segs, x = a * Math.cos(t), y = b * Math.sin(t); pts.push({ x: r2(cx + x * ca - y * sa), y: r2(cy + x * sa + y * ca), b: 0 }); }
    // archi per tre punti consecutivi (punti pari = estremi, dispari = intermedi)
    var out = [];
    for (var k = 0; k < segs; k += 2) { var p0 = pts[k], pm = pts[(k + 1) % segs], p1 = pts[(k + 2) % segs], bb = arc3Bulge(p0, pm, p1); out.push({ x: p0.x, y: p0.y, b: bb == null ? 0 : r2(bb * 1e6) / 1e6 }); }
    return out;
  }

  /* ---------- oggetti di Task ---------- */
  // Scontornatura: squadratura a distanza dal bordo, raccordo, compensazione automatica
  function scontornatura(P, distEdge, R, toolD, autoComp) {
    var off = autoComp ? distEdge - toolD / 2 : distEdge, r = Math.max(0, autoComp ? R - toolD / 2 : R);
    return C.rectPath(off, off, P.L - off, P.W - off, r);
  }
  // Canali: serie di fresature parallele
  function canali(P, o) {
    var out = [], n = Math.max(1, o.n | 0);
    for (var i = 0; i < n; i++) {
      if (o.dir === 'X') { var y = o.start + i * o.step; out.push([{ x: o.m1, y: y, b: 0 }, { x: P.L - o.m2, y: y, b: 0 }]); }
      else { var x = o.start + i * o.step; out.push([{ x: x, y: o.m1, b: 0 }, { x: x, y: P.W - o.m2, b: 0 }]); }
    }
    return out;
  }
  // Antina: cornice decorativa (una o due), con raccordo
  function antina(P, o) {
    var out = [C.rectPath(o.dx, o.dy, P.L - o.dx, P.W - o.dy, o.r || 0)];
    if (o.double) out.push(C.rectPath(o.dx + o.gap, o.dy + o.gap, P.L - o.dx - o.gap, P.W - o.dy - o.gap, Math.max(0, (o.r || 0) - o.gap)));
    return out;
  }

  /* ---------- ingombro ---------- */
  function opBBox(op, P) {
    if (op.type === 'path' || (op.type === 'pocket' && op.shape === 'poly')) { var s = C.samplePath(op.pts, op.closed !== false, 6); return C.pathBBox(s); }
    if (op.type === 'hole' && op.face === 1) return { x0: op.x - op.d / 2, y0: op.y - op.d / 2, x1: op.x + op.d / 2, y1: op.y + op.d / 2 };
    if (op.type === 'row') { var xe = op.dir === 'X' ? op.x + (op.n - 1) * op.step : op.x, ye = op.dir === 'Y' ? op.y + (op.n - 1) * op.step : op.y; return { x0: op.x - op.d / 2, y0: op.y - op.d / 2, x1: xe + op.d / 2, y1: ye + op.d / 2 }; }
    if (op.type === 'pocket' && op.shape === 'circle') return { x0: op.x - op.r, y0: op.y - op.r, x1: op.x + op.r, y1: op.y + op.r };
    if (op.type === 'pocket') return { x0: Math.min(op.x, op.x2), y0: Math.min(op.y, op.y2), x1: Math.max(op.x, op.x2), y1: Math.max(op.y, op.y2) };
    if (op.type === 'trim') return { x0: 0, y0: 0, x1: P.L, y1: P.W };
    return null;
  }

  /* ---------- export DXF ---------- */
  function toDXF(job) {
    var L = [], P = job.panel;
    function g(c, v) { L.push(String(c)); L.push(String(v)); }
    g(0, 'SECTION'); g(2, 'HEADER'); g(9, '$INSUNITS'); g(70, 4); g(0, 'ENDSEC');
    g(0, 'SECTION'); g(2, 'ENTITIES');
    function poly(layer, pts, closed) {
      g(0, 'LWPOLYLINE'); g(8, layer); g(90, pts.length); g(70, closed ? 1 : 0);
      pts.forEach(function (p) { g(10, p.x.toFixed(3)); g(20, p.y.toFixed(3)); if (p.b) g(42, p.b.toFixed(6)); });
    }
    poly('PANNELLO', C.rectPath(0, 0, P.L, P.W, 0), true);
    job.ops.forEach(function (op) {
      if (op.type === 'hole' && op.face === 1) { g(0, 'CIRCLE'); g(8, 'FORO_D' + op.d + '_P' + op.depth); g(10, op.x.toFixed(3)); g(20, op.y.toFixed(3)); g(40, (op.d / 2).toFixed(3)); }
      else if (op.type === 'row') for (var i = 0; i < op.n; i++) { g(0, 'CIRCLE'); g(8, 'FORO_D' + op.d + '_P' + op.depth); g(10, (op.dir === 'X' ? op.x + i * op.step : op.x).toFixed(3)); g(20, (op.dir === 'Y' ? op.y + i * op.step : op.y).toFixed(3)); g(40, (op.d / 2).toFixed(3)); }
      else if (op.type === 'path') poly('FRESA_T' + (op.tool || '') + '_P' + op.depth + (op.corr === 'OUT' ? '_EST' : op.corr === 'IN' ? '_INT' : ''), op.pts, op.closed);
      else if (op.type === 'pocket') poly('TASCA_T' + (op.tool || '') + '_P' + op.depth, op.shape === 'circle' ? C.circlePath(op.x, op.y, op.r) : op.shape === 'poly' ? op.pts : C.rectPath(op.x, op.y, op.x2, op.y2, op.radius || 0), true);
    });
    g(0, 'ENDSEC'); g(0, 'EOF');
    return L.join('\r\n') + '\r\n';
  }

  return {
    transformOp: transformOp, transformSideHole: transformSideHole, moveF: moveF, rotF: rotF, scaleF: scaleF, mirrorF: mirrorF, mirrorLineF: mirrorLineF,
    filletAt: filletAt, roundAll: roundAll, offsetPath: offsetPath, pocketPoly: pocketPoly, joinTwo: joinTwo, autoJoin: autoJoin, splitAt: splitAt,
    circle3: circle3, arc3Bulge: arc3Bulge, ellipsePath: ellipsePath, scontornatura: scontornatura, canali: canali, antina: antina, opBBox: opBBox, toDXF: toDXF
  };
})();
if (typeof module !== 'undefined') module.exports = GEOM;
