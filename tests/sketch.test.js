const S = require('../src/sketch.js'); let pass = 0, fail = 0; const ok = (n, c, i) => { if (c) pass++; else { fail++; console.log('FAIL', n, i || ''); } };
const near = (a, b, e = 1e-3) => Math.abs(a - b) < e;
// quadrilatero storto -> rettangolo 200x100 con vincoli
let ops = { 1: { type: 'path', closed: true, pts: [{ x: 0, y: 0, b: 0 }, { x: 210, y: 12, b: 0 }, { x: 195, y: 108, b: 0 }, { x: -8, y: 95, b: 0 }] } };
const s = k => ({ op: 1, k }), cons = [{ t: 'fix', a: { op: 1, k: 0, pt: 0 }, v: { x: 0, y: 0 } }, { t: 'h', a: s(0) }, { t: 'v', a: s(1) }, { t: 'h', a: s(2) }, { t: 'v', a: s(3) }, { t: 'len', a: s(0), v: 200 }, { t: 'len', a: s(1), v: 100 }];
let r = S.solve(ops, cons); const P = ops[1].pts;
ok('rettangolo risolto', r.ok && near(P[1].x, 200) && near(P[1].y, 0) && near(P[2].x, 200) && near(P[2].y, 100) && near(P[3].x, 0) && near(P[3].y, 100), JSON.stringify([r, P]));
// parallele, perpendicolari, uguali
ops = { 1: { type: 'path', closed: false, pts: [{ x: 0, y: 0 }, { x: 100, y: 10 }] }, 2: { type: 'path', closed: false, pts: [{ x: 0, y: 50 }, { x: 80, y: 70 }] }, 3: { type: 'path', closed: false, pts: [{ x: 200, y: 0 }, { x: 210, y: 90 }] } };
r = S.solve(ops, [{ t: 'h', a: { op: 1, k: 0 } }, { t: 'par', a: { op: 1, k: 0 }, b: { op: 2, k: 0 } }, { t: 'perp', a: { op: 1, k: 0 }, b: { op: 3, k: 0 } }, { t: 'eq', a: { op: 2, k: 0 }, b: { op: 1, k: 0 } }]);
const d = o => [ops[o].pts[1].x - ops[o].pts[0].x, ops[o].pts[1].y - ops[o].pts[0].y];
ok('parallela', r.ok && near(d(2)[1], 0, 1e-3), JSON.stringify(ops));
ok('perpendicolare', near(d(3)[0], 0, 1e-3));
ok('uguale', near(Math.hypot(...d(2)), Math.hypot(...d(1)), 1e-3));
// distanza e coincidenza tra due entità
ops = { 1: { type: 'path', closed: false, pts: [{ x: 0, y: 0 }, { x: 50, y: 0 }] }, 2: { type: 'path', closed: false, pts: [{ x: 55, y: 3 }, { x: 80, y: 40 }] } };
r = S.solve(ops, [{ t: 'coin', a: { op: 1, k: 0, pt: 1 }, b: { op: 2, k: 0, pt: 0 } }]);
ok('coincidenti', r.ok && near(ops[1].pts[1].x, ops[2].pts[0].x) && near(ops[1].pts[1].y, ops[2].pts[0].y));
// punto bloccato durante il trascinamento: si muove solo l'altro
ops = { 1: { type: 'path', closed: false, pts: [{ x: 0, y: 0 }, { x: 120, y: 30 }] } };
r = S.solve(ops, [{ t: 'len', a: { op: 1, k: 0 }, v: 100 }], [ops[1].pts[1]]);
ok('pin', r.ok && near(ops[1].pts[1].x, 120) && near(Math.hypot(ops[1].pts[1].x - ops[1].pts[0].x, ops[1].pts[1].y - ops[1].pts[0].y), 100));
// vincoli incompatibili: segnala
ops = { 1: { type: 'path', closed: false, pts: [{ x: 0, y: 0 }, { x: 100, y: 0 }] } };
r = S.solve(ops, [{ t: 'h', a: { op: 1, k: 0 } }, { t: 'v', a: { op: 1, k: 0 } }, { t: 'len', a: { op: 1, k: 0 }, v: 100 }]);
ok('incompatibili segnalati', !r.ok, JSON.stringify(r));
console.log('sketch tests: ' + pass + ' ok, ' + fail + ' falliti'); process.exit(fail ? 1 : 0);
