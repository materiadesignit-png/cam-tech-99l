/* ===== SKETCH: vincoli geometrici sul disegno (idea del Draft editor di LiteCAD, fel88, licenza MIT; risolutore riscritto: Levenberg-Marquardt) =====
   Vincolo: { t, a, b, v }  a/b = { op: id, k: indice tratto }  oppure punto { op, k, pt: 0|1 } (0 = inizio del tratto, 1 = fine)
   t: 'h' orizzontale, 'v' verticale, 'par' parallele, 'perp' perpendicolari, 'eq' stessa lunghezza, 'len' lunghezza = v,
      'fix' punto fisso (v = {x,y}), 'dist' distanza punto-punto = v, 'coin' punti coincidenti */
var SKETCH = (function () {
  'use strict';
  function ptIdx(op, k, end) { var n = op.pts.length; return end ? (k + 1) % n : k; }
  function refPts(ops, r) { var op = ops[r.op]; if (!op || !op.pts) return null; var n = op.pts.length, m = op.closed ? n : n - 1; if (r.k < 0 || r.k >= m) return null; return [op.pts[ptIdx(op, r.k, 0)], op.pts[ptIdx(op, r.k, 1)]]; }
  function refPt(ops, r) { var s = refPts(ops, r); return s ? s[r.pt ? 1 : 0] : null; }
  function valid(ops, c) { if (!refPts(ops, c.a)) return false; if (c.b && !refPts(ops, c.b)) return false; return true; }
  function residuals(ops, cons) {
    var R = [];
    cons.forEach(function (c) {
      if (!valid(ops, c)) return;
      var A = refPts(ops, c.a), B = c.b ? refPts(ops, c.b) : null, dx = A[1].x - A[0].x, dy = A[1].y - A[0].y, La = Math.hypot(dx, dy) || 1e-9;
      if (c.t === 'h') R.push(dy);
      else if (c.t === 'v') R.push(dx);
      else if (c.t === 'len') R.push(La - c.v);
      else if (c.t === 'fix') { var p = refPt(ops, c.a); R.push(10 * (p.x - c.v.x), 10 * (p.y - c.v.y)); }
      else if (c.t === 'dist') { var p1 = refPt(ops, c.a), p2 = refPt(ops, c.b); R.push(Math.hypot(p2.x - p1.x, p2.y - p1.y) - c.v); }
      else if (c.t === 'coin') { var q1 = refPt(ops, c.a), q2 = refPt(ops, c.b); R.push(q2.x - q1.x, q2.y - q1.y); }
      else if (B) {
        var ex = B[1].x - B[0].x, ey = B[1].y - B[0].y, Lb = Math.hypot(ex, ey) || 1e-9, s = (La + Lb) / 2;
        if (c.t === 'par') R.push(s * (dx * ey - dy * ex) / (La * Lb));
        else if (c.t === 'perp') R.push(s * (dx * ex + dy * ey) / (La * Lb));
        else if (c.t === 'eq') R.push(La - Lb);
      }
    });
    return R;
  }
  // variabili: coordinate dei punti toccati dai vincoli, esclusi i punti bloccati (pin)
  function solve(ops, cons, pin) {
    var vars = [], seen = new Map();
    function addPt(p) { if (!p || seen.has(p) || (pin && pin.indexOf(p) >= 0)) return; seen.set(p, vars.length); vars.push(p); }
    cons.forEach(function (c) { if (!valid(ops, c)) return; refPts(ops, c.a).forEach(addPt); if (c.b) refPts(ops, c.b).forEach(addPt); });
    var n = vars.length * 2; if (!n) return { ok: true, err: 0, it: 0 };
    function get() { var x = new Float64Array(n); vars.forEach(function (p, i) { x[2 * i] = p.x; x[2 * i + 1] = p.y; }); return x; }
    function set(x) { vars.forEach(function (p, i) { p.x = x[2 * i]; p.y = x[2 * i + 1]; }); }
    function norm(r) { return r.reduce(function (a, b) { return a + b * b; }, 0); }
    var x = get(), r = residuals(ops, cons), e = norm(r), lam = 1e-3, it = 0, h = 1e-6;
    for (it = 0; it < 120 && e > 1e-14; it++) {
      var m = r.length, J = []; for (var i = 0; i < m; i++) J.push(new Float64Array(n));
      for (var j = 0; j < n; j++) { var o = x[j]; x[j] = o + h; set(x); var r2 = residuals(ops, cons); for (var q = 0; q < m; q++) J[q][j] = (r2[q] - r[q]) / h; x[j] = o; } set(x);
      // (JtJ + lam*I) dx = -Jt r   (lam*I = minima variazione dal disegno attuale)
      var A = [], g = new Float64Array(n);
      for (var a = 0; a < n; a++) { A.push(new Float64Array(n)); for (var q2 = 0; q2 < m; q2++) g[a] -= J[q2][a] * r[q2]; }
      for (var q3 = 0; q3 < m; q3++) { var row = J[q3]; for (var a2 = 0; a2 < n; a2++) { if (!row[a2]) continue; for (var b2 = 0; b2 < n; b2++) A[a2][b2] += row[a2] * row[b2]; } }
      var improved = false;
      for (var tries = 0; tries < 12; tries++) {
        var M = A.map(function (rw, ii) { var c2 = Float64Array.from(rw); c2[ii] += lam * (1 + rw[ii]); return c2; }), d = gauss(M, Float64Array.from(g)); if (!d) { lam *= 10; continue; }
        var xn = x.map(function (v, ii) { return v + d[ii]; }); set(xn); var rn = residuals(ops, cons), en = norm(rn);
        if (en < e) { x = xn; r = rn; e = en; lam = Math.max(1e-9, lam / 3); improved = true; break; } set(x); lam *= 10;
      }
      if (!improved) break;
    }
    set(x.map(function (v) { return Math.round(v * 1e4) / 1e4; }));
    var fin = norm(residuals(ops, cons));
    return { ok: fin < 1e-6, err: Math.sqrt(fin), it: it };
  }
  function gauss(M, b) {
    var n = b.length;
    for (var c = 0; c < n; c++) {
      var p = c; for (var r = c + 1; r < n; r++) if (Math.abs(M[r][c]) > Math.abs(M[p][c])) p = r;
      if (Math.abs(M[p][c]) < 1e-14) return null;
      var t = M[c]; M[c] = M[p]; M[p] = t; var tb = b[c]; b[c] = b[p]; b[p] = tb;
      for (var r2 = c + 1; r2 < n; r2++) { var f = M[r2][c] / M[c][c]; if (!f) continue; for (var k = c; k < n; k++) M[r2][k] -= f * M[c][k]; b[r2] -= f * b[c]; }
    }
    var x = new Float64Array(n); for (var i = n - 1; i >= 0; i--) { var s = b[i]; for (var j = i + 1; j < n; j++) s -= M[i][j] * x[j]; x[i] = s / M[i][i]; }
    return x;
  }
  function satisfied(ops, c, eps) { var r = residuals(ops, [c]); return r.every(function (v) { return Math.abs(v) < (eps || 1e-3); }); }
  return { solve: solve, residuals: residuals, refPts: refPts, refPt: refPt, valid: valid, satisfied: satisfied };
})();
if (typeof module !== 'undefined') module.exports = SKETCH;
