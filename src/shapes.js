/* ===== SHAPES: testo (contorno, svuotamento, tratto singolo), import SVG, svuotamento di più contorni con isole ===== */
var SHAPES = (function () {
  'use strict';
  var CL = typeof ClipperLib !== 'undefined' ? ClipperLib : require('../vendor/clipper.js');
  var FN = typeof FONTS !== 'undefined' ? FONTS : require('./fonts.js');
  var SC = 1000;

  /* ---------- testo ---------- */
  // ritorna { contours: [[{x,y}...]], closed: bool, w, h } in mm, origine = inizio linea di base
  function text(str, o) {
    o = o || {}; var f = o.userFont ? null : FN[o.font || 'sans']; if (!f && !o.userFont) f = FN.sans;
    var H = o.height || 50, sp = o.spacing || 0, lineH = (o.lineGap || 1.4) * H, out = [], maxW = 0, lines = String(str).split(/\r?\n/);
    lines.forEach(function (line, li) {
      var x = 0, y0 = -li * lineH, res;
      if (o.userFont) {
        var uf = o.userFont, k = H / (uf.capH || uf.unitsPerEm * 0.7), path = uf.getPath(line, 0, 0, uf.unitsPerEm, { kerning: true });
        res = flattenCmds(path.commands, 8).map(function (c) { return c.map(function (p) { return { x: p.x * k, y: -p.y * k + y0 }; }); });
        out = out.concat(res); maxW = Math.max(maxW, uf.getAdvanceWidth(line, uf.unitsPerEm) * k); return;
      }
      var k2 = H / f.cap;
      for (var i = 0; i < line.length; i++) {
        var g = f.g[line[i]] || f.g['?']; if (!g) continue;
        g.c.forEach(function (arr) { var pts = []; for (var j = 0; j < arr.length; j += 2) pts.push({ x: x + arr[j] * k2, y: y0 + (arr[j + 1] - (f.base || 0)) * k2 }); out.push(pts); });
        x += g.a * k2 + sp;
      }
      maxW = Math.max(maxW, x - sp);
    });
    var single = !o.userFont && !!f.single;
    if (!single) out = out.map(function (c) { if (c.length > 2 && Math.hypot(c[0].x - c[c.length - 1].x, c[0].y - c[c.length - 1].y) < 1e-6) c.pop(); return c; });
    return { contours: out, closed: !single, w: maxW, h: H + (lines.length - 1) * lineH };
  }
  function flattenCmds(cmds, tol) {
    var out = [], cur = null, x = 0, y = 0, sx0 = 0, sy0 = 0;
    function P(px, py) { cur.push({ x: px, y: py }); }
    cmds.forEach(function (c) {
      if (c.type === 'M') { if (cur && cur.length > 2) out.push(cur); cur = []; x = sx0 = c.x; y = sy0 = c.y; P(x, y); }
      else if (c.type === 'L') { x = c.x; y = c.y; P(x, y); }
      else if (c.type === 'Q') { var n = Math.max(3, Math.ceil(Math.hypot(c.x - x, c.y - y) / tol)); for (var i = 1; i <= n; i++) { var t = i / n, a = (1 - t) * (1 - t), b = 2 * t * (1 - t), d = t * t; P(a * x + b * c.x1 + d * c.x, a * y + b * c.y1 + d * c.y); } x = c.x; y = c.y; }
      else if (c.type === 'C') { var m = Math.max(4, Math.ceil(Math.hypot(c.x - x, c.y - y) / tol)); for (var j = 1; j <= m; j++) { var s = j / m, u = 1 - s; P(u * u * u * x + 3 * u * u * s * c.x1 + 3 * u * s * s * c.x2 + s * s * s * c.x, u * u * u * y + 3 * u * u * s * c.y1 + 3 * u * s * s * c.y2 + s * s * s * c.y); } x = c.x; y = c.y; }
      else if (c.type === 'Z') { if (cur && cur.length > 2) out.push(cur); cur = null; x = sx0; y = sy0; }
    });
    if (cur && cur.length > 2) out.push(cur);
    return out;
  }

  /* ---------- SVG ---------- */
  var UNIT = { mm: 1, cm: 10, in: 25.4, pt: 25.4 / 72, pc: 25.4 / 6, px: 25.4 / 96, '': 25.4 / 96 };
  function len(v) { var m = String(v || '').match(/^\s*([-\d.e+]+)\s*([a-z%]*)/i); return m ? { v: +m[1], u: m[2].toLowerCase() } : null; }
  function mul(a, b) { return [a[0] * b[0] + a[2] * b[1], a[1] * b[0] + a[3] * b[1], a[0] * b[2] + a[2] * b[3], a[1] * b[2] + a[3] * b[3], a[0] * b[4] + a[2] * b[5] + a[4], a[1] * b[4] + a[3] * b[5] + a[5]]; }
  function parseTf(s) {
    var M = [1, 0, 0, 1, 0, 0], re = /(matrix|translate|scale|rotate|skewX|skewY)\s*\(([^)]*)\)/g, r;
    while ((r = re.exec(s || ''))) {
      var a = r[2].split(/[\s,]+/).filter(Boolean).map(Number), T;
      if (r[1] === 'matrix') T = a; else if (r[1] === 'translate') T = [1, 0, 0, 1, a[0] || 0, a[1] || 0]; else if (r[1] === 'scale') T = [a[0], 0, 0, a[1] == null ? a[0] : a[1], 0, 0];
      else if (r[1] === 'rotate') { var t = (a[0] || 0) * Math.PI / 180, c = Math.cos(t), sn = Math.sin(t); T = [c, sn, -sn, c, 0, 0]; if (a.length > 2) T = mul(mul([1, 0, 0, 1, a[1], a[2]], T), [1, 0, 0, 1, -a[1], -a[2]]); }
      else if (r[1] === 'skewX') T = [1, 0, Math.tan(a[0] * Math.PI / 180), 1, 0, 0]; else T = [1, Math.tan(a[0] * Math.PI / 180), 0, 1, 0, 0];
      M = mul(M, T);
    }
    return M;
  }
  function ap(M, p) { return { x: M[0] * p.x + M[2] * p.y + M[4], y: M[1] * p.x + M[3] * p.y + M[5] }; }
  function pathD(d, tol) { // ritorna [{pts, closed}] in unità utente
    var tk = String(d).match(/[a-df-z]|[-+]?(?:\d*\.\d+|\d+\.?)(?:e[-+]?\d+)?/gi) || [], i = 0, cmd = '', x = 0, y = 0, sx0 = 0, sy0 = 0, cx = null, cy = null, qx = 0, qy = 0, out = [], cur = null;
    function n() { return +tk[i++]; }
    function start(px, py) { if (cur && cur.pts.length > 1) out.push(cur); cur = { pts: [{ x: px, y: py }], closed: false }; }
    function L(px, py) { if (!cur) start(x, y); cur.pts.push({ x: px, y: py }); }
    function cubic(x1, y1, x2, y2, ex, ey) { var m = Math.max(4, Math.ceil((Math.hypot(x1 - x, y1 - y) + Math.hypot(x2 - x1, y2 - y1) + Math.hypot(ex - x2, ey - y2)) / tol)); for (var k = 1; k <= m; k++) { var t = k / m, u = 1 - t; L(u * u * u * x + 3 * u * u * t * x1 + 3 * u * t * t * x2 + t * t * t * ex, u * u * u * y + 3 * u * u * t * y1 + 3 * u * t * t * y2 + t * t * t * ey); } }
    function quad(x1, y1, ex, ey) { var m = Math.max(3, Math.ceil((Math.hypot(x1 - x, y1 - y) + Math.hypot(ex - x1, ey - y1)) / tol)); for (var k = 1; k <= m; k++) { var t = k / m, u = 1 - t; L(u * u * x + 2 * u * t * x1 + t * t * ex, u * u * y + 2 * u * t * y1 + t * t * ey); } }
    function arc(rx, ry, phi, fa, fs, ex, ey) {
      if (!rx || !ry) { L(ex, ey); return; }
      rx = Math.abs(rx); ry = Math.abs(ry); var ph = phi * Math.PI / 180, cp = Math.cos(ph), sp = Math.sin(ph), dx = (x - ex) / 2, dy = (y - ey) / 2, x1 = cp * dx + sp * dy, y1 = -sp * dx + cp * dy;
      var lam = x1 * x1 / (rx * rx) + y1 * y1 / (ry * ry); if (lam > 1) { rx *= Math.sqrt(lam); ry *= Math.sqrt(lam); }
      var num = rx * rx * ry * ry - rx * rx * y1 * y1 - ry * ry * x1 * x1, den = rx * rx * y1 * y1 + ry * ry * x1 * x1, co = (fa === fs ? -1 : 1) * Math.sqrt(Math.max(0, num / den));
      var cxp = co * rx * y1 / ry, cyp = -co * ry * x1 / rx, ccx = cp * cxp - sp * cyp + (x + ex) / 2, ccy = sp * cxp + cp * cyp + (y + ey) / 2;
      var a1 = Math.atan2((y1 - cyp) / ry, (x1 - cxp) / rx), a2 = Math.atan2((-y1 - cyp) / ry, (-x1 - cxp) / rx), da = a2 - a1;
      if (fs && da < 0) da += 2 * Math.PI; if (!fs && da > 0) da -= 2 * Math.PI;
      var m = Math.max(4, Math.ceil(Math.abs(da) * Math.max(rx, ry) / tol));
      for (var k = 1; k <= m; k++) { var t = a1 + da * k / m; L(ccx + rx * Math.cos(t) * cp - ry * Math.sin(t) * sp, ccy + rx * Math.cos(t) * sp + ry * Math.sin(t) * cp); }
    }
    while (i < tk.length) {
      if (/^[a-z]$/i.test(tk[i])) cmd = tk[i++];
      var rel = cmd === cmd.toLowerCase(), C = cmd.toUpperCase(), ox = rel ? x : 0, oy = rel ? y : 0;
      if (C === 'M') { x = n() + ox; y = n() + oy; sx0 = x; sy0 = y; start(x, y); cmd = rel ? 'l' : 'L'; }
      else if (C === 'L') { x = n() + ox; y = n() + oy; L(x, y); }
      else if (C === 'H') { x = n() + ox; L(x, y); }
      else if (C === 'V') { y = n() + oy; L(x, y); }
      else if (C === 'C') { var a = n() + ox, b = n() + oy, c = n() + ox, e = n() + oy, f = n() + ox, g = n() + oy; cubic(a, b, c, e, f, g); cx = c; cy = e; x = f; y = g; }
      else if (C === 'S') { var rx2 = cx != null ? 2 * x - cx : x, ry2 = cy != null ? 2 * y - cy : y, c2 = n() + ox, e2 = n() + oy, f2 = n() + ox, g2 = n() + oy; cubic(rx2, ry2, c2, e2, f2, g2); cx = c2; cy = e2; x = f2; y = g2; }
      else if (C === 'Q') { var qa = n() + ox, qb = n() + oy, qf = n() + ox, qg = n() + oy; quad(qa, qb, qf, qg); qx = qa; qy = qb; x = qf; y = qg; }
      else if (C === 'T') { var ta = 2 * x - qx, tb = 2 * y - qy, tf = n() + ox, tg = n() + oy; quad(ta, tb, tf, tg); qx = ta; qy = tb; x = tf; y = tg; }
      else if (C === 'A') { var arx = n(), ary = n(), aph = n(), afa = n(), afs = n(), aex = n() + ox, aey = n() + oy; arc(arx, ary, aph, afa, afs, aex, aey); x = aex; y = aey; }
      else if (C === 'Z') { if (cur) { cur.closed = true; out.push(cur); cur = null; } x = sx0; y = sy0; }
      else { i++; }
      if (C !== 'C' && C !== 'S') { cx = null; cy = null; } if (C !== 'Q' && C !== 'T') { qx = x; qy = y; }
    }
    if (cur && cur.pts.length > 1) out.push(cur);
    return out;
  }
  function ellipsePts(cx, cy, rx, ry, tol) { var m = Math.max(16, Math.ceil(2 * Math.PI * Math.max(rx, ry) / tol)), p = []; for (var k = 0; k < m; k++) { var t = 2 * Math.PI * k / m; p.push({ x: cx + rx * Math.cos(t), y: cy + ry * Math.sin(t) }); } return p; }
  // svg: testo del file. Ritorna { shapes: [{pts, closed}], w, h } in mm con Y verso l'alto e origine in basso a sinistra del disegno
  function svg(src, opt) {
    opt = opt || {};
    var doc = new DOMParser().parseFromString(src, 'image/svg+xml'), root = doc.documentElement; if (!root || root.nodeName.toLowerCase() !== 'svg') throw new Error('File SVG non valido');
    var vb = (root.getAttribute('viewBox') || '').split(/[\s,]+/).map(Number), W = len(root.getAttribute('width')), H = len(root.getAttribute('height'));
    var k = UNIT[''], base = [1, 0, 0, 1, 0, 0];
    if (vb.length === 4 && vb[2] > 0) { if (W && W.u !== '%') k = W.v * (UNIT[W.u] || UNIT.px) / vb[2]; base = [1, 0, 0, 1, -vb[0], -vb[1]]; }
    else if (W && UNIT[W.u]) k = UNIT[W.u] / (W.u ? 1 : 1) * 1; // senza viewBox: unità utente = px
    if (opt.scale) k *= opt.scale;
    var tol = (opt.tol || 0.1) / k, shapes = [];
    (function walk(el, M) {
      if (el.nodeType !== 1) return; var tag = el.nodeName.toLowerCase().replace(/^svg:/, '');
      if (tag === 'defs' || tag === 'clippath' || tag === 'mask' || tag === 'symbol' || tag === 'metadata' || tag === 'title' || tag === 'style') return;
      var T = el.getAttribute('transform') ? mul(M, parseTf(el.getAttribute('transform'))) : M, g = function (a) { return +el.getAttribute(a) || 0; }, list = [];
      if (tag === 'path') list = pathD(el.getAttribute('d') || '', tol);
      else if (tag === 'rect') { var x = g('x'), y = g('y'), w = g('width'), h = g('height'); if (w > 0 && h > 0) list = [{ pts: [{ x: x, y: y }, { x: x + w, y: y }, { x: x + w, y: y + h }, { x: x, y: y + h }], closed: true }]; }
      else if (tag === 'circle') list = [{ pts: ellipsePts(g('cx'), g('cy'), g('r'), g('r'), tol), closed: true, circle: { cx: g('cx'), cy: g('cy'), r: g('r') } }];
      else if (tag === 'ellipse') list = [{ pts: ellipsePts(g('cx'), g('cy'), g('rx'), g('ry'), tol), closed: true }];
      else if (tag === 'line') list = [{ pts: [{ x: g('x1'), y: g('y1') }, { x: g('x2'), y: g('y2') }], closed: false }];
      else if (tag === 'polyline' || tag === 'polygon') { var nn = (el.getAttribute('points') || '').trim().split(/[\s,]+/).map(Number), pp = []; for (var q = 0; q + 1 < nn.length; q += 2) pp.push({ x: nn[q], y: nn[q + 1] }); if (pp.length > 1) list = [{ pts: pp, closed: tag === 'polygon' }]; }
      list.forEach(function (s) { s.pts = s.pts.map(function (p) { return ap(T, p); }); if (s.circle) { var c0 = ap(T, { x: s.circle.cx, y: s.circle.cy }), det = Math.sqrt(Math.abs(T[0] * T[3] - T[1] * T[2])); s.circle = { cx: c0.x, cy: c0.y, r: s.circle.r * det }; } shapes.push(s); });
      for (var c = el.firstChild; c; c = c.nextSibling) walk(c, T);
    })(root, base);
    // mm, Y verso l'alto, origine in basso a sinistra dell'ingombro
    var x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    shapes.forEach(function (s) { s.pts.forEach(function (p) { p.x *= k; p.y *= -k; x0 = Math.min(x0, p.x); y0 = Math.min(y0, p.y); x1 = Math.max(x1, p.x); y1 = Math.max(y1, p.y); }); if (s.circle) { s.circle.cx *= k; s.circle.cy *= -k; s.circle.r *= k; } });
    shapes.forEach(function (s) { s.pts.forEach(function (p) { p.x -= x0; p.y -= y0; }); if (s.circle) { s.circle.cx -= x0; s.circle.cy -= y0; } if (s.closed && s.pts.length > 2) { var a = s.pts[0], b = s.pts[s.pts.length - 1]; if (Math.hypot(a.x - b.x, a.y - b.y) < 1e-6) s.pts.pop(); } });
    return { shapes: shapes.filter(function (s) { return s.pts.length > 1; }), w: isFinite(x1) ? x1 - x0 : 0, h: isFinite(y1) ? y1 - y0 : 0 };
  }

  /* ---------- svuotamento con isole (lettere con buchi, insegne) ---------- */
  function toC(c) { return c.map(function (p) { return { X: Math.round(p.x * SC), Y: Math.round(p.y * SC) }; }); }
  function fromC(c) { return c.map(function (p) { return { x: p.X / SC, y: p.Y / SC, b: 0 }; }); }
  // contorni chiusi (pari-dispari: i buchi delle lettere restano vuoti). Ritorna anelli del centro utensile dall'esterno all'interno
  function pocket(contours, toolD, stepPct, finishOnly) {
    var r = toolD / 2, step = Math.max(0.3, toolD * (stepPct || 60) / 100), cpr = new CL.Clipper(), sol = new CL.Paths();
    cpr.AddPaths(contours.map(toC), CL.PolyType.ptSubject, true); cpr.Execute(CL.ClipType.ctUnion, sol, CL.PolyFillType.pftEvenOdd, CL.PolyFillType.pftEvenOdd);
    var rings = [], d = r, guard = 0;
    while (guard++ < 400) {
      var co = new CL.ClipperOffset(2, 0.05 * SC), res = new CL.Paths(); co.AddPaths(sol, CL.JoinType.jtRound, CL.EndType.etClosedPolygon); co.Execute(res, -d * SC);
      if (!res.length) break;
      res.forEach(function (p) { if (Math.abs(CL.Clipper.Area(p)) > 0.01 * SC * SC) rings.push(fromC(CL.Clipper.CleanPolygon(p, 0.01 * SC))); });
      if (finishOnly) break; d += step;
    }
    return rings;
  }
  // contorno compensato (profilo esterno delle lettere): offset +r o -r
  function offset(contours, dist) {
    var cpr = new CL.Clipper(), sol = new CL.Paths(); cpr.AddPaths(contours.map(toC), CL.PolyType.ptSubject, true); cpr.Execute(CL.ClipType.ctUnion, sol, CL.PolyFillType.pftEvenOdd, CL.PolyFillType.pftEvenOdd);
    var co = new CL.ClipperOffset(2, 0.05 * SC), res = new CL.Paths(); co.AddPaths(sol, CL.JoinType.jtRound, CL.EndType.etClosedPolygon); co.Execute(res, dist * SC); return res.map(fromC);
  }
  return { text: text, svg: svg, pocket: pocket, offset: offset, flattenCmds: flattenCmds, pathD: pathD };
})();
if (typeof module !== 'undefined') module.exports = SHAPES;
