const T = require('../src/topo.js'), C = require('../src/core.js');
let pass = 0, fail = 0; const near = (a, b, e = 1e-3) => Math.abs(a - b) < e;
function ok(name, cond, info) { if (cond) pass++; else { fail++; console.log('FAIL', name, info || ''); } }
const L = (pts, closed) => ({ type: 'path', closed: !!closed, pts: pts.map(p => ({ x: p[0], y: p[1], b: p[2] || 0 })) });
// 1 intersezione retta-retta
let s = T.segs(L([[0, 0], [10, 10]]))[0], s2 = T.segs(L([[0, 10], [10, 0]]))[0], I = T.inter(s, s2);
ok('line-line', I.length === 1 && near(I[0].p.x, 5) && near(I[0].p.y, 5), JSON.stringify(I));
// 2 retta-arco: semicerchio r=10 centro (0,0) da (10,0) a (-10,0) antiorario (b=1); retta x=0
let arc = T.segs(L([[10, 0, 1], [-10, 0]]))[0], v = T.segs(L([[0, -20], [0, 20]]))[0]; I = T.inter(arc, v);
ok('line-arc', I.length === 1 && near(I[0].p.x, 0) && near(I[0].p.y, 10), JSON.stringify(I));
// 3 arco-arco
let a2 = T.segs(L([[20, 0, 1], [0, 0]]))[0]; I = T.inter(arc, a2); // cerchio centro (10,0) r10, semicerchio sopra
ok('arc-arc', I.length === 1 && near(I[0].p.x, 5) && near(I[0].p.y, Math.sqrt(75)), JSON.stringify(I));
// 4 taglia retta aperta tra due lame verticali x=3 e x=7, clic in x=5 -> due pezzi 0..3 e 7..10
let op = L([[0, 0], [10, 0]]), c1 = L([[3, -5], [3, 5]]), c2 = L([[7, -5], [7, 5]]);
let r = T.trim(op, [c1, c2], { x: 5, y: 0.2 });
ok('trim middle', r.length === 2 && near(r[0].pts[1].x, 3) && near(r[1].pts[0].x, 7) && near(r[1].pts[1].x, 10), JSON.stringify(r));
r = T.trim(op, [c1, c2], { x: 1, y: 0 }); ok('trim start', r.length === 1 && near(r[0].pts[0].x, 3) && near(r[0].pts[1].x, 10), JSON.stringify(r));
r = T.trim(op, [], { x: 1, y: 0 }); ok('trim nothing', r === null);
// 5 taglia rettangolo chiuso 0..10 con lama verticale x=5, clic a destra -> resta la metà sinistra aperta
let rect = L([[0, 0], [10, 0], [10, 10], [0, 10]], true), cut = L([[5, -5], [5, 15]]);
r = T.trim(rect, [cut], { x: 10, y: 5 });
let xs = r && r[0].pts.map(p => p.x); ok('trim closed', r && r.length === 1 && !r[0].closed && Math.max(...xs) <= 5 + 1e-6 && near(T.length(r[0]), 20), JSON.stringify(r));
// 6 taglia arco: semicerchio r=10, lama x=0, clic a destra (x=7,y=7) -> resta arco da (0,10) a (-10,0), quarto di cerchio
r = T.trim(L([[10, 0, 1], [-10, 0]]), [L([[0, -20], [0, 20]])], { x: 7, y: 7 });
ok('trim arc', r && r.length === 1 && near(r[0].pts[0].x, 0) && near(r[0].pts[0].y, 10) && near(T.length(r[0]), Math.PI * 5), JSON.stringify(r));
// 7 estendi retta 0..5 fino a x=8
r = T.extend(L([[0, 0], [5, 0]]), [L([[8, -5], [8, 5]])], { x: 5, y: 0 });
ok('extend end', r && near(r.pts[1].x, 8), JSON.stringify(r));
r = T.extend(L([[0, 0], [5, 0]]), [L([[-2, -5], [-2, 5]])], { x: 0, y: 0 });
ok('extend start', r && near(r.pts[0].x, -2), JSON.stringify(r));
// 8 estendi quarto d'arco (10,0)->(0,10) antiorario fino a retta y=0 a sinistra -> arriva a (-10,0), semicerchio
let q = L([[10, 0, Math.tan(Math.PI / 8)], [0, 10]]);
r = T.extend(q, [L([[-20, 0], [-5, 0]])], { x: 0, y: 10 });
ok('extend arc', r && near(r.pts[1].x, -10) && near(r.pts[1].y, 0) && near(r.pts[0].b, 1), JSON.stringify(r));
// 9 riduzione: punti allineati + arco quasi piatto
r = T.reduce(L([[0, 0], [5, 0.01], [10, 0], [20, 0, 0.0001], [30, 0]]), 0.05);
ok('reduce', r.op.pts.length === 2 && r.removed === 3, JSON.stringify(r));
// 10 controllo integrità: farfalla autointersecante
ok('check self', T.check(L([[0, 0], [10, 10], [10, 0], [0, 10]], true)).length > 0);
ok('check clean', T.check(L([[0, 0], [10, 0], [10, 10], [0, 10]], true)).length === 0);
console.log('topo tests: ' + pass + ' ok, ' + fail + ' falliti'); process.exit(fail ? 1 : 0);
