
/* ================= MOBILI: moduli parametrici a variabili (funzione "cabinet") ================= */
// Ogni pannello è un disegno CAD con le forature di giunzione, ripiani e cerniere generate dagli schemi FERRAMENTA.
// Convenzioni: fianco X = profondità (fronte in X=0), Y = altezza; cielo/fondo/ripiani X = larghezza, Y = profondità (fronte in Y=0); anta X = larghezza, Y = altezza.
var MOB_KEY = 'camtech99l.mobili.v1';
var MOB_TYPES = {
  base: { n: 'Base', d: { L: 600, H: 720, P: 560, nR: 1, nA: 1 } }, pensile: { n: 'Pensile', d: { L: 600, H: 720, P: 330, nR: 2, nA: 1 } },
  colonna: { n: 'Colonna', d: { L: 600, H: 2100, P: 560, nR: 4, nA: 2 } }, giorno: { n: 'Mobile a giorno / libreria', d: { L: 800, H: 1800, P: 350, nR: 4, nA: 0 } }
};
var MOB_PARAMS = [
  ['tipo', 'Tipo di mobile', 'base', Object.keys(MOB_TYPES).map(function (k) { return [k, MOB_TYPES[k].n]; })],
  ['nome', 'Nome (prefisso disegni)', 'BASE60', 'txt'],
  ['L', 'Larghezza L', 600, 'mm'], ['H', 'Altezza H (cassa)', 720, 'mm'], ['P', 'Profondità P', 560, 'mm'], ['T', 'Spessore cassa', 18, 'mm'],
  ['giu', 'Giunzione', 'spine', [['spine', 'Spine Ø8'], ['ecc', 'Eccentrici Ø15 + spine'], ['conf', 'Confirmat']]],
  ['nR', 'Numero ripiani', 1, ''], ['rip', 'Tipo ripiani', 'regg', [['regg', 'Reggiripiano a quota fissa'], ['s32', 'Regolabili: file sistema 32']]],
  ['sch', 'Schiena', 'sovr', [['sovr', 'Sovrapposta (avvitata dietro)'], ['canale', 'In canale fresato']]], ['Ts', 'Spessore schiena', 4, 'mm'], ['Sr', 'Canale schiena dal retro', 10, 'mm'],
  ['nA', 'Ante', 1, [[0, 'Nessuna'], [1, '1 anta'], [2, '2 ante']]], ['lato', 'Cerniere (1 anta)', 'sx', [['sx', 'A sinistra'], ['dx', 'A destra']]],
  ['Ta', 'Spessore ante', 18, 'mm'], ['g', 'Gioco ante (perimetro e centrale)', 3, 'mm'], ['K', 'Cerniere: distanza K', 5, 'mm']
];
var mobVals = (function () { try { var j = JSON.parse(lsGet(MOB_KEY) || 'null'); if (j) return j; } catch (e) {} var o = {}; MOB_PARAMS.forEach(function (p) { o[p[0]] = p[2]; }); return o; })();
ui.mobSel = 0;
function fp(type, over) { var o = {}; FER_TYPES[type].params.forEach(function (q) { o[q.k] = q.def; }); return Object.assign(o, over || {}); }
function mirrorX(ops, L) { return ops.map(function (o) { var q = JSON.parse(JSON.stringify(o)); if (q.type === 'hole' && q.face === 1) q.x = r2(L - q.x); else if (q.type === 'hole') { q.face = q.face === 5 ? 3 : q.face === 3 ? 5 : q.face; if (q.face === 2 || q.face === 4) q.pos = r2(L - q.pos); } else if (q.pts) q.pts = q.pts.map(function (p) { return { x: r2(L - p.x), y: p.y, b: -(p.b || 0) }; }); return q; }); }
function mobBuild(V) {
  var L = +V.L, H = +V.H, P = +V.P, T = +V.T, nR = Math.max(0, Math.round(+V.nR)), nA = +V.nA, g = +V.g, parts = [], warn = [];
  var Pc = V.sch === 'sovr' ? P - (+V.Ts) : P; // profondità di cielo/fondo/fianchi davanti alla schiena sovrapposta
  var mid = Pc > 450 ? ';' + r2(Pc / 2) : '';
  // forature sul fianco per cielo e fondo
  function sideJoin(Pf) {
    var hs = '0;' + r2(H - T), ops = [];
    if (V.giu === 'spine') ops = FER_GEN.joinFace(fp('joinFace', { edge: 'X0', h: hs, tr: T, v: '32;-32' + mid, d: 8, dp: 12 }), Pf);
    else if (V.giu === 'ecc') ops = FER_GEN.joinFace(fp('joinFace', { edge: 'X0', h: hs, tr: T, v: '37;-37', d: 5, dp: 11 }), Pf).concat(FER_GEN.joinFace(fp('joinFace', { edge: 'X0', h: hs, tr: T, v: '69;-69' + mid, d: 8, dp: 12 }), Pf));
    else ops = FER_GEN.joinFace(fp('joinFace', { edge: 'X0', h: hs, tr: T, v: '37;-37' + mid, d: 7, dp: T }), Pf);
    return ops;
  }
  function endJoin(Pp) { // testa di cielo/fondo
    var ops = [];
    ['X0', 'XL'].forEach(function (ed) {
      if (V.giu === 'spine') ops = ops.concat(FER_GEN.joinEdge(fp('joinEdge', { edge: ed, u: '32;-32' + mid, d: 8, dp: 25 }), Pp));
      else if (V.giu === 'ecc') ops = ops.concat(FER_GEN.minifix(fp('minifix', { edge: ed, u: '37;-37', b: 24, dh: 15, ph: 12.5, db: 8, dpb: 34 }), Pp), FER_GEN.joinEdge(fp('joinEdge', { edge: ed, u: '69;-69' + mid, d: 8, dp: 25 }), Pp));
      else ops = ops.concat(FER_GEN.joinEdge(fp('joinEdge', { edge: ed, u: '37;-37' + mid, d: 5, dp: 45 }), Pp));
    });
    return ops;
  }
  var Pf = { L: Pc, W: H, T: T };
  var side = sideJoin(Pf), Hi = H - 2 * T;
  // ripiani
  if (nR > 0) {
    if (V.rip === 's32') side = side.concat(FER_GEN.s32(fp('s32', { edge: 'X0', v1: 37, v2: 37, v2mode: 'retro', u0: T + 64, u1: H - T - 64, step: 32, d: 5, dp: 12 }), Pf));
    else { var hs = []; for (var k = 1; k <= nR; k++) hs.push(r2(T + Hi * k / (nR + 1) - 6)); side = side.concat(FER_GEN.shelf(fp('shelf', { edge: 'X0', h: hs.join(';'), vf: 37, vb: 37, d: 5, dp: 10 }), Pf)); }
  }
  // canale schiena
  function backGroove(Pp, along) { // along: 'Y' per fianchi (canale verticale), 'X' per cielo/fondo
    if (V.sch !== 'canale') return [];
    var t = C.toolByCode(job.tools, ui.def.millTool), D = t ? t.d : 10; if (D > +V.Ts + 0.5) warn.push('Canale schiena: la fresa Ø' + D + ' è più larga della schiena (' + V.Ts + ' mm)');
    var c = along === 'Y' ? Pp.L - (+V.Sr) - (+V.Ts) / 2 : Pp.W - (+V.Sr) - (+V.Ts) / 2;
    var pts = along === 'Y' ? [{ x: r2(c), y: -10, b: 0 }, { x: r2(c), y: r2(Pp.W + 10), b: 0 }] : [{ x: -10, y: r2(c), b: 0 }, { x: r2(Pp.L + 10), y: r2(c), b: 0 }];
    return [newPath(pts, false, { depth: 8, corr: 'C', note: 'canale schiena' })];
  }
  // ante e cerniere
  var ante = [], Wa = nA ? r2((L - g - (nA - 1) * g) / nA) : 0, Ha = r2(H - g), off = r2(g / 2);
  function hingeU(Hh) { var n = Hh <= 900 ? 2 : Hh <= 1600 ? 3 : Hh <= 2000 ? 4 : 5, a = 100, out = []; for (var i = 0; i < n; i++) out.push(r2(a + (Hh - 2 * a) * i / (n - 1))); return out; }
  var hu = nA ? hingeU(Ha) : [], plateSides = nA === 2 ? ['sx', 'dx'] : nA === 1 ? [V.lato] : [];
  for (var a = 0; a < nA; a++) {
    var hingeSide = nA === 2 ? (a === 0 ? 'sx' : 'dx') : V.lato, Pa = { L: Wa, W: Ha, T: +V.Ta };
    ante.push({ name: 'ANTA' + (nA > 1 ? (a + 1) : '') + '_' + hingeSide.toUpperCase(), d: Pa, q: 1, ops: FER_GEN.hinge(fp('hinge', { edge: hingeSide === 'sx' ? 'X0' : 'XL', K: +V.K, pos: hu.join(';') }), Pa) });
  }
  function plates(sideName) { return plateSides.indexOf(sideName) < 0 ? [] : FER_GEN.plate(fp('plate', { edge: 'X0', v: 37, pos: hu.map(function (u) { return r2(u + off); }).join(';'), off: 0 }), Pf); }
  var fsx = side.concat(plates('sx'), backGroove(Pf, 'Y')), fdx = mirrorX(side.concat(plates('dx'), backGroove(Pf, 'Y')), Pc);
  parts.push({ name: 'FIANCO_SX', d: Pf, q: 1, ops: fsx, note: 'faccia interna in alto, fronte a sinistra (X=0)' });
  parts.push({ name: 'FIANCO_DX', d: Pf, q: 1, ops: fdx, note: 'faccia interna in alto, fronte a destra' });
  var Pt = { L: r2(L - 2 * T), W: Pc, T: T };
  parts.push({ name: 'CIELO', d: Pt, q: 1, ops: endJoin(Pt).concat(backGroove(Pt, 'X')), note: 'fronte in Y=0' });
  parts.push({ name: 'FONDO', d: Pt, q: 1, ops: endJoin(Pt).concat(backGroove(Pt, 'X')), note: 'fronte in Y=0' });
  if (nR) parts.push({ name: 'RIPIANO', d: { L: r2(L - 2 * T - 1), W: r2(Pc - 20), T: T }, q: nR, ops: [], note: 'gioco 1 mm in larghezza, 20 mm dal fronte' });
  parts.push({ name: 'SCHIENA', d: V.sch === 'sovr' ? { L: L, W: H, T: +V.Ts } : { L: r2(L - 2 * T + 2 * (8 - 1)), W: r2(H - 2 * T + 2 * (8 - 1)), T: +V.Ts }, q: 1, ops: [], note: V.sch === 'sovr' ? 'sovrapposta, avvitata sul retro' : 'in canale profondo 8 (gioco 1)' });
  ante.forEach(function (x) { x.note = 'cerniere ' + hu.length + ' a ' + hu.join(', ') + ' mm'; parts.push(x); });
  parts.forEach(function (p) { p.ops.forEach(function (o) { if (o.type === 'hole' && !C.findDrill(job.tools, o.d, o.face)) { var w = 'Nessuna punta ' + (o.face === 1 ? 'verticale' : 'orizzontale faccia ' + o.face) + ' Ø' + o.d + ' in attrezzaggio'; if (warn.indexOf(w) < 0) warn.push(w); } if (o.type === 'hole' && o.face !== 1 && o.depth > 25) { var w2 = 'Fori in testa profondi ' + o.depth + ' mm: oltre la lunghezza utile delle punte orizzontali (25)'; if (warn.indexOf(w2) < 0) warn.push(w2); } }); });
  return { parts: parts, warn: warn };
}
function mobName(V, part) { return C.progName({ progName: (V.nome || 'MOBILE') + '_' + part.name }); }
function mobJob(V, part) { var j = newJob(mobName(V, part), part.d.L, part.d.W, part.d.T, MOB_TYPES[V.tipo].n + ' ' + V.L + '×' + V.H + '×' + V.P + ' · ' + part.name + ' · ' + (part.note || '')); j.example = false; part.ops.forEach(function (o, i) { var q = JSON.parse(JSON.stringify(o)); q.id = i + 1; j.ops.push(q); }); return j; }
function renderMob() {
  var R = mobBuild(mobVals), sel = R.parts[Math.min(ui.mobSel, R.parts.length - 1)];
  var rows = R.parts.map(function (p, i) { return '<tr data-mi="' + i + '"' + (i === ui.mobSel ? ' class="sel"' : '') + '><td><b>' + esc(p.name) + '</b></td><td>' + p.q + '</td><td>' + C.f2(p.d.L) + ' × ' + C.f2(p.d.W) + ' × ' + C.f2(p.d.T) + '</td><td>' + p.ops.length + '</td></tr>'; }).join('');
  $('mob').innerHTML = '<div class="card"><h2>' + esc(MOB_TYPES[mobVals.tipo].n) + ' ' + mobVals.L + ' × ' + mobVals.H + ' × ' + mobVals.P + '</h2><div class="tt-wrap"><table class="arch"><thead><tr><th>Pannello</th><th>Q.tà</th><th>Misure X × Y × Z</th><th>Lavorazioni</th></tr></thead><tbody>' + rows + '</tbody></table></div>' +
    (R.warn.length ? R.warn.map(function (w) { return '<div class="issue err">' + esc(w) + '</div>'; }).join('') : '<div class="issue ok">Tutte le forature hanno una punta in attrezzaggio</div>') +
    '<div class="issue warn">Bozza: quote di giunzione, ripiani e cerniere da verificare con la ferramenta usata e con un primo mobile di prova.</div>' +
    '<div class="row"><button class="btn primary" id="mobSave">Crea tutti i disegni in archivio</button><button class="btn small" id="mobCsv">Distinta di taglio (CSV)</button></div></div>' +
    '<div class="card"><h2>' + esc(sel.name) + '</h2><canvas class="prev" id="mobPrev"></canvas><div class="kv"><span>Misure</span><span>' + C.f2(sel.d.L) + ' × ' + C.f2(sel.d.W) + ' × ' + C.f2(sel.d.T) + ' · q.tà ' + sel.q + '</span><span>Lavorazioni</span><span>' + sel.ops.length + '</span><span>Note</span><span>' + esc(sel.note || '') + '</span></div><div class="row"><button class="btn small" id="mobOpen">Apri questo pannello nel CAD</button></div></div>';
  drawPreview($('mobPrev'), { panel: sel.d, ops: sel.ops });
  $('mob').querySelectorAll('tr[data-mi]').forEach(function (tr) { tr.onclick = function () { ui.mobSel = +tr.dataset.mi; renderMob(); }; });
  $('mobOpen').onclick = function () { commit(); job = migrate(mobJob(mobVals, sel)); fixIds(); ui.sel = []; dirty = true; persist(); setEnv('cad'); fitPanel(); toast('Aperto ' + job.name + ' (non ancora salvato)'); };
  $('mobSave').onclick = function () {
    var n = 0; R.parts.forEach(function (p) { var j = mobJob(mobVals, p); archive[j.name] = { job: j, comment: j.comment, date: new Date().toISOString() }; n++; }); saveArchive();
    toast(n + ' disegni creati in archivio con prefisso ' + mobVals.nome); };
  $('mobCsv').onclick = function () { var csv = 'Pannello;Quantita;X;Y;Spessore;Lavorazioni;Note\r\n' + R.parts.map(function (p) { return [mobName(mobVals, p), p.q, p.d.L, p.d.W, p.d.T, p.ops.length, (p.note || '').replace(/;/g, ',')].join(';'); }).join('\r\n'); saveFile((mobVals.nome || 'MOBILE') + '_distinta.csv', csv, 'Distinta salvata'); };
}
function paneMob() {
  return '<h3>Variabili del mobile</h3><div class="grid2">' + MOB_PARAMS.map(function (p) {
    var o = Array.isArray(p[3]) ? { select: p[3], wide: p[0] === 'tipo' || p[0] === 'giu' || p[0] === 'sch' || p[0] === 'rip' } : p[3] === 'txt' ? { text: true, wide: true } : { unit: p[3] };
    return field('mb_' + p[0], p[1], mobVals[p[0]], o);
  }).join('') + '</div><p class="note">Ogni variabile ricalcola subito tutti i pannelli. Il tipo carica misure, ripiani e ante tipici; poi puoi cambiarli. Le variabili restano salvate per il prossimo mobile.</p>';
}
function bindMob() {
  MOB_PARAMS.forEach(function (p) {
    var el = $('mb_' + p[0]); if (!el) return;
    el.addEventListener('change', function () {
      mobVals[p[0]] = Array.isArray(p[3]) || p[3] === 'txt' ? (p[0] === 'nA' ? +el.value : el.value) : num(el.value, p[2]);
      if (p[0] === 'tipo') { var d = MOB_TYPES[el.value].d; Object.keys(d).forEach(function (k) { mobVals[k] = d[k]; }); mobVals.nome = el.value.toUpperCase().slice(0, 6) + Math.round(d.L / 10); refreshPane(); }
      lsSet(MOB_KEY, JSON.stringify(mobVals)); renderMob();
    });
  });
}
cmd('toMob', 'Mobili parametrici', function () { setEnv('mob'); });
Object.assign(HELP, {
  lineMode: ['Linea/polilinea col mouse sul foglio quadrettato: clic sui punti, A = prossimo tratto ad arco, Invio o doppio clic per finire.', 'P'],
  arc3Mode: ['Arco col mouse: inizio, fine, punto sull\'arco.'], arcCMode: ['Arco col mouse: centro, inizio, fine (Maiusc = orario).'], circle3Mode: ['Cerchio col mouse per tre punti.'],
  holeSide: ['Foro di testa: orizzontale su un fianco del pannello (facce 2-5). Col mouse: modo Foro e clic sulle fasce dell\'esploso.'],
  textCmd: ['Scritte e insegne: lettere svuotate, contorno, rilievo o incisione a tratto singolo. Anche con i tuoi font TTF/OTF.'],
  importSvg: ['Importa un disegno vettoriale SVG (loghi, sagome, insegne): fresatura sui tracciati, interna, esterna o svuotamento.'],
  toMob: ['Mobili parametrici: base, pensile, colonna, libreria a variabili; crea tutti i pannelli forati in archivio.'],
  headToggle: ['In simulazione mostra la testa completa con tutti i mandrini, lame ed elettromandrino per vedere gli ingombri.']
});
