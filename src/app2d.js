
/* ================= area comando (destra) ================= */
function fmtTime(sec) { sec = Math.round(sec); var m = Math.floor(sec / 60), s2 = sec % 60; return (m ? m + ' min ' : '') + s2 + ' s'; }
function opLabel(op) {
  if (op.type === 'hole') return (op.face === 1 ? 'Foro' : 'Foro orizz. f' + op.face) + ' Ø' + op.d + ' P' + op.depth;
  if (op.type === 'row') return 'Barriera ' + op.n + '×Ø' + op.d + ' passo ' + op.step;
  if (op.type === 'pocket') return 'Tasca ' + (op.shape === 'circle' ? 'Ø' + C.f2(2 * op.r) : op.shape === 'poly' ? 'generica' : C.f2(Math.abs(op.x2 - op.x)) + '×' + C.f2(Math.abs(op.y2 - op.y))) + ' T' + (op.tool || '?') + ' P' + op.depth;
  if (op.type === 'trim') return 'Rifilatura T' + (op.tool || '?') + ' P' + op.depth;
  if (op.type === 'path') return (op.closed ? 'Contorno' : 'Fresatura') + ' T' + (op.tool || '?') + ' P' + op.depth + (op.corr && op.corr !== 'C' ? ' ' + CORR_NAMES[op.corr].split(' ')[0].toLowerCase() : '');
  return op.type;
}
function opColor(op) { return op.type === 'path' || op.type === 'trim' || op.type === 'pocket' ? 'var(--mill)' : (op.type === 'hole' && op.face !== 1 ? 'var(--hhole)' : 'var(--hole)'); }
function setHead(t, sub) { $('cmdTitle').textContent = t; $('cmdSub').textContent = sub || ''; }
function refreshPane() {
  var h = '';
  if (ui.env === 'lc') { setHead('LiteCAD', 'Programma di disegno collegato (Windows)'); $('pane').innerHTML = paneLc(); bindPane(); return; }
  if (ui.env === 'mob') { setHead('Mobili', 'Moduli parametrici a variabili'); $('pane').innerHTML = paneMob(); bindMob(); return; }
  if (ui.env === 'fer') { setHead('Ferramenta', 'Schemi di foratura da catalogo'); $('pane').innerHTML = paneFer(); bindFer(); return; }
  if (ui.env === 'sup') { setHead('Supervisore', 'Configurazione T99LKVA · attrezzaggio ' + job.settings.attrezzaggio); h = paneSup(); }
  else if (ui.env === 'cam') { setHead('CAM', job.ops.length + ' lavorazioni · ' + fmtTime(C.estimateTime(job))); h = paneCam(); }
  else h = paneCad();
  $('pane').innerHTML = h; bindPane();
}
function focusPane() { if (ui.env !== 'cad' && ui.env !== 'cam') setEnv('cad'); refreshPane(); var f = $('pane').querySelector('input,select'); if (f) f.focus(); }

function paneCad() {
  var ops = selOps();
  if (ops.length > 1) {
    setHead(ops.length + ' entità selezionate', 'Modifica, Imposta e Percorso agiscono su tutte');
    var kinds = {}; ops.forEach(function (o) { kinds[o.type] = (kinds[o.type] || 0) + 1; });
    return '<p class="note">' + Object.keys(kinds).map(function (k) { return kinds[k] + ' ' + { hole: 'fori', row: 'barriere', path: 'fresature', pocket: 'tasche', trim: 'rifilature' }[k]; }).join(' · ') + '</p>' +
      '<div class="row"><button class="btn small" data-cmd="move">Muovi…</button><button class="btn small" data-cmd="copy">Copia…</button><button class="btn small" data-cmd="rotate">Ruota…</button><button class="btn small" data-cmd="mirror">Specchia…</button><button class="btn small" data-cmd="series">Serie…</button><button class="btn small" data-cmd="setDepth">Profondità…</button><button class="btn small" data-cmd="setDiam">Diametro…</button><button class="btn small" data-cmd="autojoin">Auto unisci</button><button class="btn small" data-cmd="blockDef">Definisci blocco…</button><button class="btn small" data-cmd="del" style="color:var(--err)">Cancella</button></div>';
  }
  var op = ops[0];
  if (!op) {
    var d = ui.def, mt = millOpts();
    if (ui.mode === 'hole' || ui.mode === 'row') {
      setHead(ui.mode === 'hole' ? 'Foro' : 'Barriera', 'Valori per i nuovi elementi');
      return '<div class="grid2">' + field('dD', 'Diametro', d.d, { unit: 'mm', select: drillDiams() }) + field('dDepth', 'Profondità vert.', d.depth, { unit: 'mm' }) + (ui.mode === 'hole' ? field('dHDepth', 'Profondità orizz.', d.hdepth, { unit: 'mm' }) : field('dStep', 'Passo', d.step, { unit: 'mm' })) + '</div>' +
        '<div class="row"><button class="btn small" data-cmd="' + (ui.mode === 'hole' ? 'holeNum' : 'rowNum') + '">Inserisci con quote…</button>' + (ui.mode === 'hole' ? '<button class="btn small" data-cmd="holeSide">Orizzontale con quote…</button>' : '') + '</div><p class="note">' + PROMPTS[ui.mode] + '</p>';
    }
    if (ui.mode === 'path' || ui.mode === 'rect' || ui.mode === 'circle' || ui.mode === 'pocket') {
      setHead({ path: 'Fresatura', rect: 'Rettangolo', circle: 'Cerchio', pocket: 'Tasca' }[ui.mode], 'Valori per i nuovi elementi');
      var s = '<div class="grid2">' + field('dTool', 'Fresa', d.millTool, { select: mt }) + field('dMDepth', 'Profondità', d.millDepth, { unit: 'mm' });
      if (ui.mode === 'pocket') s += field('dPShape', 'Forma', d.pocketShape, { select: [['rect', 'Rettangolare'], ['circle', 'Circolare']] }) + field('dStepO', 'Passo laterale', d.stepover, { unit: '% Ø' }) + field('dPDir', 'Direzione', d.pocketDir, { select: [['CCW', 'Antioraria'], ['CW', 'Oraria']] }) + (d.pocketShape === 'rect' ? field('dRad', 'Raggio raccordo', d.radius, { unit: 'mm' }) : '');
      else s += field('dCorr', 'Correzione (chiusi)', d.corr, { select: [['IN', 'Interno'], ['OUT', 'Esterno'], ['C', 'In asse'], ['L', 'Sinistra G142'], ['R', 'Destra G141']] }) + (ui.mode === 'rect' ? field('dRad', 'Raggio raccordo', d.radius, { unit: 'mm' }) : '');
      var num2 = { path: 'line2', rect: 'rectNum', circle: 'circleCR', pocket: d.pocketShape === 'circle' ? 'pocketCirc' : 'pocketRect' }[ui.mode];
      return s + '</div><div class="row"><button class="btn small" data-cmd="' + num2 + '">Inserisci con quote…</button></div><p class="note">' + PROMPTS[ui.mode] + '</p>';
    }
    setHead('CAD', job.ops.length + ' entità · ' + C.f2(job.panel.L) + ' × ' + C.f2(job.panel.W) + ' × ' + C.f2(job.panel.T));
    return '<p class="note">Scegli un comando dai menu o dalla barra strumenti. Clic su un\'entità per vederne i dati qui; trascina per selezionare a finestra (da sinistra: solo entità interne, da destra: anche quelle toccate).</p>' +
      (job.example ? '<p class="note">Sul piano c\'è il <b>disegno di esempio</b> dell\'addestramento di Task (pannello 800×600×20). <b>File → Nuovo</b> per iniziare.</p>' : '') +
      '<div class="legend"><span><i style="background:var(--hole)"></i>foro verticale</span><span><i style="background:var(--hhole)"></i>foro orizzontale</span><span><i style="background:var(--mill)"></i>fresatura / tasca</span></div>' +
      '<h3>Pannello</h3><div class="grid3">' + field('nL', 'X', job.panel.L, { unit: 'mm' }) + field('nW', 'Y', job.panel.W, { unit: 'mm' }) + field('nT', 'Z', job.panel.T, { unit: 'mm' }) + '</div>' +
      '<div class="grid2">' + field('nName', 'Nome disegno', job.name, { text: true }) + field('nCm', 'Commento', job.comment, { text: true }) + '</div>';
  }
  var i = opIndex(op.id), s2 = '<div class="grid2">';
  setHead('#' + (i + 1) + ' · ' + opLabel(op), { hole: 'Foro', row: 'Barriera', path: 'Fresatura', pocket: 'Tasca', trim: 'Rifilatura perimetro' }[op.type]);
  if (op.type === 'hole') {
    s2 += field('pFace', 'Faccia', op.face, { wide: true, select: [1, 2, 3, 4, 5].map(function (f) { return [f, f + ' · ' + FACE_NAMES[f]]; }) });
    if (op.face === 1) s2 += field('pX', 'X', op.x, { unit: 'mm' }) + field('pY', 'Y', op.y, { unit: 'mm' });
    else s2 += field('pPos', (op.face === 2 || op.face === 4) ? 'Posizione X' : 'Posizione Y', op.pos, { unit: 'mm' }) + field('pZ', 'Altezza da sotto', op.z, { unit: 'mm' });
    s2 += field('pD', 'Diametro', op.d, { unit: 'mm' }) + field('pDepth', 'Profondità', op.depth, { unit: 'mm' }) + '</div>';
    var tl = C.findDrill(job.tools, op.d, op.face);
    s2 += '<p class="note">' + (tl ? 'Utensile: <b>' + esc(tl.code) + '</b> · ' + KIND_NAMES[tl.kind].toLowerCase() + ' Ø' + tl.d : '<span style="color:var(--err)">Nessuna ' + (op.face === 1 ? 'punta verticale' : 'punta orizzontale per la faccia ' + op.face) + ' Ø' + op.d + ' in attrezzaggio.</span>') + '</p>';
  } else if (op.type === 'row') {
    s2 += field('pX', 'X primo foro', op.x, { unit: 'mm' }) + field('pY', 'Y primo foro', op.y, { unit: 'mm' }) + field('pDirRow', 'Direzione', op.dir, { select: [['X', 'Parallela a X (G210)'], ['Y', 'Parallela a Y (G211)']] }) + field('pN', 'Numero fori', op.n) + field('pStep', 'Passo', op.step, { unit: 'mm' }) + field('pD', 'Diametro', op.d, { unit: 'mm' }) + field('pDepth', 'Profondità', op.depth, { unit: 'mm' }) + '</div>';
  } else if (op.type === 'trim') {
    var t3 = toolOf(op);
    s2 += field('pTool', 'Fresa', op.tool || '', { select: millOpts() }) + field('pDepth', 'Profondità', op.depth, { unit: 'mm' }) + field('pLead', 'Attacco fuori pezzo', op.lead == null ? 20 : op.lead, { unit: 'mm' }) + field('pInset', 'Offset lato inf./sin.', op.inset || 0, { unit: 'mm' }) +
      field('pSide', 'Correzione', op.side || 'L', { select: [['L', 'G142'], ['R', 'G141']] }) + field('pFeed', 'Avanzamento', op.feed || '', { unit: 'mm/min', ph: t3 ? t3.feed : '' }) + '</div><p class="note">Rifila tutto il perimetro usando le variabili <code>DX</code> e <code>DY</code> della macchina.</p>';
  } else if (op.type === 'pocket') {
    if (op.shape === 'circle') s2 += field('pX', 'Centro X', op.x, { unit: 'mm' }) + field('pY', 'Centro Y', op.y, { unit: 'mm' }) + field('pR', 'Raggio', op.r, { unit: 'mm' }) + '<span></span>';
    else if (op.shape === 'rect') s2 += field('pX', 'X1', op.x, { unit: 'mm' }) + field('pY', 'Y1', op.y, { unit: 'mm' }) + field('pX2', 'X2', op.x2, { unit: 'mm' }) + field('pY2', 'Y2', op.y2, { unit: 'mm' }) + field('pRad', 'Raggio raccordo', op.radius || 0, { unit: 'mm' }) + '<span></span>';
    s2 += field('pTool', 'Fresa', op.tool || '', { select: millOpts() }) + field('pDepth', 'Profondità', op.depth, { unit: 'mm' }) + field('pPass', 'Passate in Z', op.passes || 1) + field('pStepO', 'Passo laterale', op.stepover || 70, { unit: '% Ø' }) + field('pDirP', 'Direzione', op.dir || 'CCW', { select: [['CCW', 'Antioraria'], ['CW', 'Oraria']] }) + '</div>';
    var t4 = toolOf(op), nc = t4 ? C.pocketContours(op, t4.d).length : 0;
    s2 += '<p class="note">' + (nc ? nc + ' giri per passata, dal centro verso il bordo, percorso già sul centro fresa.' : '<span style="color:var(--err)">Tasca più piccola della fresa.</span>') + '</p>';
  } else if (op.type === 'path') {
    var tp = toolOf(op);
    s2 += field('pTool', 'Fresa', op.tool || '', { select: millOpts() }) + field('pDepth', 'Profondità', op.depth, { unit: 'mm' }) + field('pPass', 'Passate in Z', op.passes || 1) + field('pCorr', 'Correzione', op.corr || 'C', { select: [['IN', 'Interno'], ['OUT', 'Esterno'], ['C', 'In asse'], ['L', 'Sinistra G142'], ['R', 'Destra G141']] }) +
      field('pFeed', 'Avanzamento', op.feed || '', { unit: 'mm/min', ph: tp ? tp.feed : '' }) + field('pRpm', 'Giri', op.rpm || '', { unit: 'g/min', ph: tp ? tp.rpm : '' }) +
      field('pLiT', 'Ingresso', (op.leadIn || {}).type || 'none', { select: [['none', 'Nessuno'], ['line', 'Retta'], ['arc', 'Arco']] }) + field('pLiL', 'Lungh. ingresso', (op.leadIn || {}).len || 15, { unit: 'mm' }) +
      field('pLoT', 'Uscita', (op.leadOut || {}).type || 'none', { select: [['none', 'Nessuna'], ['line', 'Retta'], ['arc', 'Arco']] }) + field('pLoL', 'Lungh. uscita', (op.leadOut || {}).len || 15, { unit: 'mm' }) + '</div>' +
      '<label class="chk"><input type="checkbox" id="pClosed"' + (op.closed ? ' checked' : '') + '> Percorso chiuso</label>' +
      '<div class="row"><button class="btn small" data-cmd="reverse">Inverti direzione</button><button class="btn small" data-cmd="fillet">Raccordo…</button><button class="btn small" data-cmd="offset">Offset…</button><button class="btn small" data-cmd="setInterpZ">Interpolazione Z…</button>' + (op.closed ? '<button class="btn small" data-cmd="pocketGen">Svuota (tasca)…</button>' : '<button class="btn small" data-cmd="follow_rp">Segui…</button>') + '</div>' +
      '<h3>Punti (' + op.pts.length + ')</h3><div class="pt" style="font-weight:600;color:var(--ink2)"><span>#</span><span>X</span><span>Y</span><span>Curva</span><span>P</span><span></span></div><div class="pts" id="pts">' + op.pts.map(function (p, k) {
        return '<div class="pt"><span>' + (k + 1) + '</span><input data-k="' + k + '" data-c="x" value="' + C.f2(p.x) + '"><input data-k="' + k + '" data-c="y" value="' + C.f2(p.y) + '"><input data-k="' + k + '" data-c="b" value="' + (p.b ? (+p.b).toFixed(4) : '') + '" placeholder="retta"><input data-k="' + k + '" data-c="p" value="' + (p.p != null ? p.p : '') + '" placeholder="' + op.depth + '"><button class="x" data-del="' + k + '" title="Togli punto">×</button></div>';
      }).join('') + '</div><p class="note">Curva = curvatura del tratto verso il punto successivo (vuoto retta, 1 semicerchio antiorario, −1 orario). P = profondità in quel punto (interpolazione Z).</p>';
  }
  s2 += field('pNote', 'Commento nel programma', op.note || '', { wide: true, text: true });
  s2 += '<div class="row">' + (op.type === 'trim' ? '' : '<button class="btn small" data-cmd="copy">Copia…</button><button class="btn small" data-cmd="move">Muovi…</button><button class="btn small" data-cmd="rotate">Ruota…</button><button class="btn small" data-cmd="mirror">Specchia…</button><button class="btn small" data-cmd="series">Serie…</button>') + '<button class="btn small" data-cmd="del" style="color:var(--err)">Cancella</button></div>';
  return s2;
}
function paneCam() {
  var iss = C.validate(job), sel = primary();
  var s = '<div class="row"><button class="btn small" id="aUp"' + (sel ? '' : ' disabled') + '>Su</button><button class="btn small" id="aDown"' + (sel ? '' : ' disabled') + '>Giù</button><button class="btn small" data-cmd="optimize">Ottimizza</button><button class="btn small" data-cmd="deoptimize">Deottimizza</button><button class="btn primary small" data-cmd="genPP">Genera Part Program</button></div>';
  s += '<div class="oplist">' + job.ops.map(function (op, i) {
    return '<div class="oprow' + (isSel(op) ? ' sel' : '') + '" data-id="' + op.id + '"><span class="n">' + (i + 1) + '</span><span class="sw" style="background:' + opColor(op) + '"></span><span class="t">' + esc(opLabel(op)) + '</span><span class="d">' + esc(toolTxt(op)) + '</span></div>';
  }).join('') + '</div>';
  s += '<p class="note">Tempo macchina stimato: <b>' + fmtTime(C.estimateTime(job)) + '</b>. ' + (job.optimized ? 'Disegno ottimizzato (semaforo verde).' : 'Semaforo rosso: usa <b>Ottimizza</b> per ordinare percorsi e discese.') + '</p>';
  s += '<h3>Controllo di fattibilità</h3>' + (iss.length ? iss.map(function (q) { return '<div class="issue ' + q.lvl + '" data-i="' + q.i + '">' + esc(q.msg) + '</div>'; }).join('') : '<div class="issue ok">Tutte le entità sono fattibili con l\'attrezzaggio corrente</div>');
  if (sel && (sel.type === 'path' || sel.type === 'pocket' || sel.type === 'trim')) s += '<div class="row"><button class="btn small" data-cmd="fresature">Utensile e velocità…</button>' + (sel.type === 'path' ? '<button class="btn small" data-cmd="leadIn">Ingresso…</button><button class="btn small" data-cmd="leadOut">Uscita…</button><button class="btn small" data-cmd="reverse">Inverti</button>' : '') + '</div>';
  return s;
}
function toolTxt(op) {
  if (op.type === 'hole' || op.type === 'row') { var t = C.findDrill(job.tools, op.d, op.type === 'hole' ? op.face : 1); return t ? 'T' + t.code : 'T?'; }
  return 'T' + (op.tool || '?');
}
function paneSup() {
  var S = job.settings, iss = C.validate(job);
  return '<h3>Disegno corrente</h3><div class="kv"><span>Nome</span><span>' + esc(job.name) + (dirty ? ' · <span style="color:var(--warn)">non salvato</span>' : '') + '</span><span>Pannello</span><span>' + C.f2(job.panel.L) + ' × ' + C.f2(job.panel.W) + ' × ' + C.f2(job.panel.T) + '</span><span>Lavorazioni</span><span>' + job.ops.length + '</span><span>Tempo</span><span>' + fmtTime(C.estimateTime(job)) + '</span><span>Fattibilità</span><span>' + (iss.filter(function (q) { return q.lvl === 'err'; }).length ? '<span style="color:var(--err)">da correggere</span>' : 'ok') + '</span></div>' +
    '<div class="row"><button class="btn small" data-cmd="toCad">CAD</button><button class="btn small" data-cmd="toCam">CAM</button><button class="btn primary small" data-cmd="ppView">Part-Program</button><button class="btn small" data-cmd="save">Salva in archivio</button></div>' +
    '<h3>Macchina</h3><div class="kv"><span>Configurazione</span><span>T99LKVA</span><span>Attrezzaggio</span><span>' + esc(S.attrezzaggio) + ' · ' + job.tools.length + ' utensili</span><span>Battuta</span><span>' + esc(S.battuta) + ' · controsagome 0 · 0 · 0</span></div>' +
    '<div class="row"><button class="btn small" data-cmd="toolsEdit">Attrezzaggio…</button><button class="btn small" data-cmd="machImport">Import dalla macchina…</button><button class="btn small" data-cmd="configView">Configurazione</button></div>' +
    '<h3>Sequenza giornaliera</h3><p class="note">1. File → Nuovo (o Apri dall\'archivio) · 2. CAD: disegna fori e fresature · 3. CAM: controlla, Ottimizza · 4. Genera Part Program e copia il <code>.PRG</code> sulla chiavetta del floppy.</p>';
}
function bindPane() {
  var pane = $('pane'), op = primary();
  pane.querySelectorAll('[data-cmd]').forEach(function (b) { b.addEventListener('click', function () { run(b.dataset.cmd); }); });
  function on(id, ev, fn) { var el = $(id); if (el) el.addEventListener(ev, fn); }
  function setOp(id, key, conv) { on(id, 'change', function () { commit(); var q = getOp(op.id); q[key] = conv ? conv(this.value, this) : num(this.value, q[key]); changed(); }); }
  var str = function (v) { return v; }, opt = function (v) { return v === '' ? undefined : num(v, undefined); };
  if (ui.env === 'cad') {
    if (op && ui.sel.length === 1) {
      setOp('pX', 'x'); setOp('pY', 'y'); setOp('pPos', 'pos'); setOp('pZ', 'z'); setOp('pD', 'd'); setOp('pDepth', 'depth'); setOp('pStep', 'step'); setOp('pR', 'r'); setOp('pX2', 'x2'); setOp('pY2', 'y2'); setOp('pRad', 'radius');
      setOp('pN', 'n', function (v) { return Math.max(1, Math.round(num(v, 1))); }); setOp('pDirRow', 'dir', str); setOp('pDirP', 'dir', str); setOp('pTool', 'tool', str); setOp('pCorr', 'corr', str); setOp('pSide', 'side', str);
      setOp('pPass', 'passes', function (v) { return Math.max(1, Math.round(num(v, 1))); }); setOp('pStepO', 'stepover', function (v) { return Math.min(95, Math.max(20, num(v, 70))); });
      setOp('pFeed', 'feed', opt); setOp('pRpm', 'rpm', opt); setOp('pNote', 'note', str); setOp('pLead', 'lead'); setOp('pInset', 'inset');
      ['pLiT', 'pLiL'].forEach(function (id) { on(id, 'change', function () { commit(); getOp(op.id).leadIn = { type: $('pLiT').value, len: v('pLiL', 15) }; changed(); }); });
      ['pLoT', 'pLoL'].forEach(function (id) { on(id, 'change', function () { commit(); getOp(op.id).leadOut = { type: $('pLoT').value, len: v('pLoL', 15) }; changed(); }); });
      on('pFace', 'change', function () {
        commit(); var q = getOp(op.id), f = +this.value, P = job.panel;
        if (q.face === 1 && f !== 1) { q.pos = (f === 2 || f === 4) ? q.x : q.y; q.z = r2(P.T / 2); if (q.depth < 20) q.depth = ui.def.hdepth; }
        else if (q.face !== 1 && f === 1) { q.x = (q.face === 2 || q.face === 4) ? q.pos : (q.face === 5 ? 20 : P.L - 20); q.y = (q.face === 3 || q.face === 5) ? q.pos : (q.face === 2 ? 20 : P.W - 20); q.depth = ui.def.depth; }
        q.face = f; changed();
      });
      on('pClosed', 'change', function () { commit(); getOp(op.id).closed = this.checked; changed(); });
      var pts = $('pts');
      if (pts) {
        pts.addEventListener('change', function (e) { var t = e.target; if (!t.dataset.c) return; commit(); var p = getOp(op.id).pts[+t.dataset.k], c = t.dataset.c; if (c === 'p') { if (t.value.trim() === '') delete p.p; else p.p = num(t.value, op.depth); } else p[c] = num(t.value, c === 'b' ? 0 : p[c]); changed(); });
        pts.addEventListener('click', function (e) { var b = e.target.closest('[data-del]'); if (!b || op.pts.length <= 2) return; commit(); getOp(op.id).pts.splice(+b.dataset.del, 1); changed(); });
      }
    } else if (!op) {
      var d = ui.def;
      on('dD', 'change', function () { d.d = num(this.value, d.d); }); on('dDepth', 'change', function () { d.depth = num(this.value, d.depth); }); on('dHDepth', 'change', function () { d.hdepth = num(this.value, d.hdepth); });
      on('dStep', 'change', function () { d.step = num(this.value, d.step); }); on('dTool', 'change', function () { d.millTool = this.value; }); on('dMDepth', 'change', function () { d.millDepth = num(this.value, d.millDepth); });
      on('dCorr', 'change', function () { d.corr = this.value; }); on('dRad', 'change', function () { d.radius = Math.max(0, num(this.value, 0)); });
      on('dPShape', 'change', function () { d.pocketShape = this.value; ui.draft = null; refreshPane(); }); on('dStepO', 'change', function () { d.stepover = Math.min(95, Math.max(20, num(this.value, 70))); }); on('dPDir', 'change', function () { d.pocketDir = this.value; });
      on('nL', 'change', function () { commit(); job.panel.L = num(this.value, job.panel.L); changed(); fitPanel(); }); on('nW', 'change', function () { commit(); job.panel.W = num(this.value, job.panel.W); changed(); fitPanel(); }); on('nT', 'change', function () { commit(); job.panel.T = num(this.value, job.panel.T); changed(); });
      on('nName', 'change', function () { job.name = C.progName({ progName: this.value }); job.settings.progName = job.name; persist(); refresh(); }); on('nCm', 'change', function () { job.comment = this.value; persist(); });
    }
  } else if (ui.env === 'cam') {
    var list = pane.querySelector('.oplist');
    if (list) list.addEventListener('click', function (e) { var r = e.target.closest('[data-id]'); if (!r) return; var id = +r.dataset.id; if (e.shiftKey) ui.sel.push(id); else ui.sel = [id]; refreshPane(); draw(); });
    on('aUp', 'click', function () { moveInSeq(-1); }); on('aDown', 'click', function () { moveInSeq(1); });
  }
  pane.querySelectorAll('.issue[data-i]').forEach(function (el) { el.addEventListener('click', function () { var i = +el.dataset.i; if (i >= 0 && job.ops[i]) { ui.sel = [job.ops[i].id]; refreshPane(); draw(); } }); });
}
function moveInSeq(dir) { var i = opIndex(ui.sel[ui.sel.length - 1]), j = i + dir; if (i < 0 || j < 0 || j >= job.ops.length) return; commit(); var t = job.ops[i]; job.ops[i] = job.ops[j]; job.ops[j] = t; changed(); }

/* ================= supervisore ================= */
function renderSup() {
  var names = Object.keys(archive).sort(function (a, b) { return (archive[b].date || '').localeCompare(archive[a].date || ''); });
  var sel = archSelName();
  var rows = names.map(function (n) { var a = archive[n], P = a.job.panel; return '<tr data-n="' + esc(n) + '"' + (n === sel ? ' class="sel"' : '') + '><td><b>' + esc(n) + '</b></td><td>' + esc(a.comment || '') + '</td><td>' + C.f2(P.L) + '×' + C.f2(P.W) + '×' + C.f2(P.T) + '</td><td>' + a.job.ops.length + '</td><td>' + (a.date ? new Date(a.date).toLocaleDateString('it-IT') : '') + '</td></tr>'; }).join('');
  $('sup').innerHTML = '<div class="card"><h2>Archivio disegni</h2>' + (names.length ? '<div class="tt-wrap"><table class="arch"><thead><tr><th>Nome</th><th>Commento</th><th>Dimensioni</th><th>Entità</th><th>Data</th></tr></thead><tbody>' + rows + '</tbody></table></div>' : '<p class="note">Archivio vuoto. Usa <b>File → Nuovo</b>, oppure apri il disegno corrente nel CAD e salvalo con <b>Salva</b>.</p>') +
    '<div class="row"><button class="btn primary small" data-a="open"' + (sel ? '' : ' disabled') + '>Apri nel CAD</button><button class="btn small" data-a="cam"' + (sel ? '' : ' disabled') + '>Apri nel CAM</button><button class="btn small" data-cmd="newDrawing">Nuovo…</button><button class="btn small" data-cmd="arcCopy">Copia…</button><button class="btn small" data-cmd="arcRename">Rinomina…</button><button class="btn small" data-cmd="arcComment">Commento…</button><button class="btn small" data-cmd="arcDelete">Cancella…</button></div>' +
    '<p class="note">L\'archivio è salvato su questo computer. Per spostare i disegni su un altro PC usa <b>File → Esporta progetto</b>.</p></div>' +
    '<div class="card"><h2>' + (sel ? esc(sel) : 'Disegno corrente: ' + esc(job.name)) + '</h2><canvas class="prev" id="prev"></canvas><div class="kv" id="prevInfo"></div></div>';
  var sj = sel ? archive[sel].job : job;
  drawPreview($('prev'), sj);
  var st = sj.ops.reduce(function (a, o) { a[o.type] = (a[o.type] || 0) + 1; return a; }, {});
  $('prevInfo').innerHTML = '<span>Pannello</span><span>' + C.f2(sj.panel.L) + ' × ' + C.f2(sj.panel.W) + ' × ' + C.f2(sj.panel.T) + '</span><span>Fori</span><span>' + ((st.hole || 0) + (st.row || 0)) + '</span><span>Fresature</span><span>' + ((st.path || 0) + (st.trim || 0)) + '</span><span>Tasche</span><span>' + (st.pocket || 0) + '</span><span>Commento</span><span>' + esc(sj.comment || '—') + '</span>';
  $('sup').querySelectorAll('tr[data-n]').forEach(function (tr) { tr.addEventListener('click', function () { ui.archSel = tr.dataset.n; renderSup(); }); tr.addEventListener('dblclick', function () { openFromArchive(tr.dataset.n); }); });
  $('sup').querySelectorAll('[data-cmd]').forEach(function (b) { b.addEventListener('click', function () { run(b.dataset.cmd); }); });
  $('sup').querySelectorAll('[data-a]').forEach(function (b) { b.addEventListener('click', function () { if (!sel) return; openFromArchive(sel); if (b.dataset.a === 'cam') setEnv('cam'); }); });
}
function drawPreview(c, j) {
  var r = c.getBoundingClientRect(), d = window.devicePixelRatio || 1; c.width = Math.max(1, r.width * d); c.height = Math.max(1, r.height * d);
  var g = c.getContext('2d'), P = j.panel, s = Math.min((r.width - 20) / P.L, (r.height - 20) / P.W), ox = (r.width - P.L * s) / 2, oy = (r.height + P.W * s) / 2;
  g.setTransform(d, 0, 0, d, 0, 0); readCols(); g.fillStyle = COL.work; g.fillRect(0, 0, r.width, r.height);
  g.fillStyle = COL.mdf; g.fillRect(ox, oy - P.W * s, P.L * s, P.W * s); g.strokeStyle = COL['mdf-edge']; g.strokeRect(ox, oy - P.W * s, P.L * s, P.W * s);
  function X(x) { return ox + x * s; } function Y(y) { return oy - y * s; }
  j.ops.forEach(function (o) {
    if (o.type === 'hole' && o.face === 1) { g.fillStyle = COL.hole; g.beginPath(); g.arc(X(o.x), Y(o.y), Math.max(1.5, o.d / 2 * s), 0, 7); g.fill(); }
    else if (o.type === 'row') for (var i = 0; i < o.n; i++) { g.fillStyle = COL.hole; g.beginPath(); g.arc(X(o.dir === 'X' ? o.x + i * o.step : o.x), Y(o.dir === 'Y' ? o.y + i * o.step : o.y), Math.max(1.5, o.d / 2 * s), 0, 7); g.fill(); }
    else if (o.type === 'path' || o.type === 'pocket') {
      var pts = o.type === 'path' ? o.pts : (o.shape === 'circle' ? C.circlePath(o.x, o.y, o.r) : o.shape === 'poly' ? o.pts : C.rectPath(o.x, o.y, o.x2, o.y2, o.radius || 0)), cl = o.type === 'path' ? o.closed : true;
      var sp = C.samplePath(pts, cl, 6); g.strokeStyle = COL.mill; g.lineWidth = 1.5; g.beginPath(); sp.forEach(function (p, k) { if (k) g.lineTo(X(p.x), Y(p.y)); else g.moveTo(X(p.x), Y(p.y)); }); if (cl) g.closePath(); g.stroke();
      if (o.type === 'pocket') { g.globalAlpha = .3; g.fillStyle = COL.mill; g.fill(); g.globalAlpha = 1; }
    }
  });
}

/* ================= ambienti ================= */
function setEnv(e, keep) {
  if (ui.anim) stopAnim();
  var prev = ui.env; ui.env = e; if (!keep || e !== 'cad') { ui.mode = 'select'; ui.draft = null; }
  document.querySelectorAll('#envs button').forEach(function (b) { b.classList.toggle('on', b.dataset.env === e); });
  $('sup').hidden = e !== 'sup'; $('fer').hidden = e !== 'fer'; $('mob').hidden = e !== 'mob'; $('lc').hidden = e !== 'lc'; cv.style.visibility = (e === 'sup' || e === 'fer' || e === 'mob' || e === 'lc') ? 'hidden' : 'visible';
  applyIconPref(); renderMenus(); renderToolbar(); refresh();
  if ((e === 'cad' || e === 'cam') && (prev === 'sup' || prev === 'fer' || prev === 'mob' || prev === 'lc')) { resize(); fitPanel(); }
  setPrompt(e === 'lc' ? 'LiteCAD: disegna in LiteCAD ed esporta in DXF nella cartella di scambio.' : e === 'mob' ? 'Mobili: imposta le variabili, controlla i pannelli e crea i disegni in archivio.' : e === 'fer' ? 'Ferramenta: scegli uno schema di foratura e inseriscilo nel pannello corrente.' : e === 'sup' ? 'Supervisore: archivio disegni, macchina e part-program.' : e === 'cam' ? 'CAM: controlla le lavorazioni, ottimizza e genera il part-program.' : PROMPTS[ui.mode]);
}
$('envs').addEventListener('click', function (e) { var b = e.target.closest('[data-env]'); if (b) setEnv(b.dataset.env); });
function refresh() {
  $('docName').textContent = job.name + (dirty ? ' *' : '') + '  ·  ' + C.f2(job.panel.L) + '×' + C.f2(job.panel.W) + '×' + C.f2(job.panel.T);
  var li = $('light'); li.classList.toggle('go', !!job.optimized); $('lightTxt').textContent = job.optimized ? 'Ottimizzato' : 'Da ottimizzare'; li.style.visibility = ui.env === 'cam' ? 'visible' : 'hidden';
  $('sT').textContent = fmtTime(C.estimateTime(job));
  var info = $('tbInfo'); if (info) info.textContent = ui.sel.length ? ui.sel.length + ' selezionate' : '';
  if (ui.env === 'sup') renderSup();
  if (ui.env === 'fer') renderFer();
  if (ui.env === 'mob') renderMob();
  if (ui.env === 'lc') renderLc();
  refreshPane(); updToggles(); draw();
}

/* ================= part-program ================= */
function hl(code) {
  return code.split('\n').map(function (l) {
    var q = false, ci = -1;
    for (var i = 0; i < l.length; i++) { var ch = l[i]; if (ch === '"') q = !q; else if (ch === ';' && !q) { ci = i; break; } }
    if (ci >= 0 && /^G200/.test(l) && ci === l.replace(/\s+$/, '').length - 1) ci = -1;
    var body = esc(ci >= 0 ? l.slice(0, ci) : l), com = ci >= 0 ? esc(l.slice(ci)) : '';
    return body.replace(/\b([GM]\d{1,3})\b/g, '<span class="g">$1</span>') + (com ? '<span class="c">' + com + '</span>' : '');
  }).join('\n');
}
function showCode() {
  var code = C.generate(job), errs = C.validate(job).filter(function (q) { return q.lvl === 'err'; }), fn = C.progName(job.settings) + '.PRG';
  modal('<h2>Genera Part Program</h2><div class="grid2">' + field('cName', 'Nome programma', job.name, { text: true }) + '<div class="kv"><span>Battuta</span><span>' + esc(job.settings.battuta) + '</span><span>Controsagome</span><span>U 0 · V 0 · W 0</span></div></div>' +
    (errs.length ? errs.map(function (q) { return '<div class="issue err">' + esc(q.msg) + '</div>'; }).join('') : '') + (job.optimized ? '' : '<div class="issue warn">Disegno non ottimizzato: puoi generare lo stesso, oppure chiudi e usa Elabora → Ottimizza.</div>') +
    '<pre class="code" id="code">' + hl(code.replace(/\r/g, '')) + '</pre><div class="row"><button class="btn primary" id="cZip">Scarica ' + esc(fn) + ' (zip)</button><button class="btn" id="cTxt">Scarica .txt</button><button class="btn" id="cCopy">Copia</button><button class="btn" id="mNo">Chiudi</button></div>' +
    '<p class="note">Lo zip contiene <code>' + esc(fn) + '</code> nello stesso formato dei programmi in <code>C:\\Utente</code> della macchina. Copialo sulla chiavetta del floppy. Prima di lavorare un pannello: anteprima grafica sulla macchina e prova in aria.</p>', true);
  $('mNo').onclick = closeModal;
  $('cName').onchange = function () { job.name = C.progName({ progName: this.value }); job.settings.progName = job.name; persist(); refresh(); showCode(); };
  $('cCopy').onclick = function () { navigator.clipboard.writeText(C.generate(job)).then(function () { toast('Programma copiato'); }, function () { var r = document.createRange(); r.selectNodeContents($('code')); var s = getSelection(); s.removeAllRanges(); s.addRange(r); toast('Testo selezionato: Ctrl+C per copiare'); }); };
  $('cZip').onclick = function () { var nm = C.progName(job.settings); saveFile(nm + '.zip', C.zipStore([{ name: nm + '.PRG', data: C.latin1(C.generate(job)) }]), 'Zip salvato: estrai ' + nm + '.PRG sulla chiavetta'); };
  $('cTxt').onclick = function () { saveFile(C.progName(job.settings) + '.txt', C.generate(job), 'Salvato: rinomina l\'estensione in .PRG'); };
}

/* ================= attrezzaggio ================= */
var TIPI = { V: ['Piatta', 'Lancia', 'Svasatore'], H: ['Piatta', 'Lancia', 'Svasatore'], F: ['Cilindrica', 'Sferica', 'Conica', 'Elicoidale'], L: ['Lama'] };
var UT_NAME = { V: 'Punta', H: 'Punta', F: 'Fresa', L: 'Lama' };
var FACE_TXT = { 1: 'Superiore', 2: 'Anteriore', 3: 'Destra', 4: 'Posteriore', 5: 'Sinistra' };
function f2s(v) { return v == null || v === '' ? '' : (Math.round(v * 100) / 100).toFixed(2); }
// Finestra "Modifica attrezzaggio" come in Task: un utensile alla volta, scelto con Numero; Testa fissa / Cambio utensile
function toolsDialog() {
  var draft = clone(job.tools), group = 'fixed', idx = 0, view = 'tool';
  draft.forEach(function (t) { if (!t.group) t.group = t.kind === 'F' && +t.code >= 100 ? 'change' : 'fixed'; if (!t.off) t.off = { x: 0, y: 0, z: 0, a: 0, alfa: 0, d: 0 }; if (!t.tipo) t.tipo = TIPI[t.kind][0]; if (!t.rot) t.rot = 'CW'; });
  function list() { return draft.filter(function (t) { return t.group === group; }); }
  function cur() { var l = list(); if (idx >= l.length) idx = l.length - 1; if (idx < 0) idx = 0; return l[idx]; }
  modal('<h2 style="background:var(--bar);color:var(--bar-ink);margin:-14px -14px 4px;padding:10px 14px;border-radius:8px 8px 0 0;font-size:16px;letter-spacing:.04em">MODIFICA ATTREZZAGGIO · ' + esc(job.settings.attrezzaggio) + '</h2><div id="atBody"></div>' +
    '<div class="row" style="justify-content:space-between"><div class="row"><button class="btn primary" id="mOk">OK</button><button class="btn" id="mNo">Annulla</button><button class="btn" id="atHelp">Aiuto</button></div><div class="row"><button class="btn small" id="atAdd">Nuovo utensile</button><button class="btn small" id="atDel">Elimina</button><button class="btn small" id="atReset">Ripristina macchina</button></div></div>' +
    '<label class="chk"><input type="checkbox" id="tDef" checked> Usa questo attrezzaggio anche per i nuovi disegni</label><div style="border-top:1px solid var(--line);padding-top:6px;font-size:13px;color:var(--ink2)" id="atStatus">Utensile corrente dell\'attrezzaggio</div>', true);
  function render() {
    var t = cur(), L = list();
    if (!t) { $('atBody').innerHTML = '<p>Nessun utensile in questo gruppo.</p>'; return; }
    var rpmK = function (v) { return v ? (v / 1000).toFixed(1) : ''; };
    var left = '<div style="display:grid;grid-template-columns:auto 1fr;gap:8px 14px;align-items:center">' +
      '<b>Numero</b><div class="row" style="flex-wrap:nowrap"><select id="atNum" style="font-family:var(--f-mono);font-size:15px;padding:5px;border:1px solid var(--line);border-radius:4px;background:var(--bg);min-width:90px">' + L.map(function (x, i) { return '<option value="' + i + '"' + (i === idx ? ' selected' : '') + '>' + esc(x.code) + '</option>'; }).join('') + '</select><button class="btn small" id="atUp" title="Precedente">▲</button><button class="btn small" id="atDn" title="Successivo">▼</button></div>' +
      '<b>Utensile</b><span>' + UT_NAME[t.kind] + (t.kind === 'H' ? ' orizzontale' : '') + '</span>' +
      '<b>Faccia di lavoro</b><span>' + (t.kind === 'H' ? '<select id="atFace" style="padding:4px;border:1px solid var(--line);border-radius:4px;background:var(--bg)">' + [2, 3, 4, 5].map(function (f) { return '<option value="' + f + '"' + (+t.face === f ? ' selected' : '') + '>' + FACE_TXT[f] + ' (' + f + ')</option>'; }).join('') + '</select>' : FACE_TXT[t.face || 1]) + '</span>' +
      inRow('atLen', 'Lunghezza', f2s(t.len), 'mm') + inRow('atLut', t.kind === 'L' ? 'Sporgenza utile' : 'Lunghezza utile', f2s(t.lut), 'mm') + inRow('atD', 'Diametro', f2s(t.d), 'mm') +
      (t.kind === 'L' ? inRow('atTh', 'Spessore', f2s(t.thick), 'mm') : '') +
      '<b>Tipo</b><select id="atTipo" style="padding:5px;border:1px solid var(--line);border-radius:4px;background:var(--bg)">' + TIPI[t.kind].map(function (x) { return '<option' + (x === t.tipo ? ' selected' : '') + '>' + x + '</option>'; }).join('') + '</select>' +
      inRow('atSv', 'Svasatura', f2s(t.svas || 0), 'mm', t.tipo !== 'Svasatore') +
      '<b>Verso rotazione</b><select id="atRot" style="padding:5px;border:1px solid var(--line);border-radius:4px;background:var(--bg)"><option value="CW"' + (t.rot === 'CW' ? ' selected' : '') + '>Orario</option><option value="CCW"' + (t.rot === 'CCW' ? ' selected' : '') + '>Antiorario</option></select>' +
      inRow('atRpm', 'Default RPM', rpmK(t.rpm), '× 1000') + inRow('atRpmM', 'Max RPM', rpmK(t.rpmMax), '× 1000') + inRow('atF', 'Vel. Predefinita', t.feed || '', 'mm/min') +
      (t.kind === 'F' ? inRow('atFi', 'Vel. entrata', t.feedIn || '', 'mm/min') : '') +
      '<b>Descrizione</b><input id="atDs" value="' + esc(t.descr || '') + '" style="font-size:14px;padding:5px;border:1px solid var(--line);border-radius:4px;background:var(--bg)">' + '</div>';
    var o = t.off || {};
    var right = '<div style="display:flex;flex-direction:column;gap:10px">' +
      '<label class="chk"><input type="radio" name="atG" value="fixed"' + (group === 'fixed' ? ' checked' : '') + '> <b>Testa fissa</b></label>' +
      '<label class="chk"><input type="radio" name="atG" value="change"' + (group === 'change' ? ' checked' : '') + '> <b>Cambio utensile</b></label>' +
      '<div class="kv" style="font-family:var(--f-mono);font-size:14px">' + [['Offset X', o.x], ['Offset Y', o.y], ['Offset Z', o.z], ['Offset A', o.a], ['Offset alfa', o.alfa], ['Offset D', o.d]].map(function (r) { return '<span>' + r[0] + ' :</span><span>' + f2s(r[1] || 0) + '</span>'; }).join('') + '</div>' +
      '<canvas id="atCv" style="width:100%;height:190px;background:var(--work);border-radius:6px"></canvas>' +
      '<div class="row"><button class="tb' + (view === 'tool' ? ' on' : '') + '" data-v="tool" title="Utensile"><svg viewBox="0 0 24 24"><path d="M10 2h4v8h-4zM9 10h6l-1 4h-4zM11 14h2v8h-2z"/></svg></button><button class="tb' + (view === 'face' ? ' on' : '') + '" data-v="face" title="Faccia di lavoro"><svg viewBox="0 0 24 24"><path d="M4 8l8-4 8 4v8l-8 4-8-4z"/><path d="M4 8l8 4 8-4M12 12v8"/></svg></button><button class="tb' + (view === 'head' ? ' on' : '') + '" data-v="head" title="Posizione sulla testa"><svg viewBox="0 0 24 24">' + ICONS.hole + '</svg></button><button class="btn" id="atPrint" style="margin-left:auto">Stampa</button></div></div>';
    $('atBody').innerHTML = '<div style="display:grid;grid-template-columns:minmax(0,1.1fr) minmax(0,1fr);gap:22px">' + left + right + '</div>';
    bindForm(t); drawTool(t);
  }
  function inRow(id, label, val, unit, dis) { return '<b' + (dis ? ' style="opacity:.45"' : '') + '>' + label + '</b><div class="row" style="flex-wrap:nowrap"><input id="' + id + '" value="' + esc(val) + '"' + (dis ? ' disabled' : '') + ' inputmode="decimal" style="font-family:var(--f-mono);font-size:15px;padding:5px 7px;border:1px solid var(--line);border-radius:4px;background:var(--bg);width:120px"><span class="unit" style="font-size:12px">' + unit + '</span></div>'; }
  function bindForm(t) {
    function set(id, key, k) { var el = $(id); if (el) el.onchange = function () { var v2 = this.value.trim(); t[key] = v2 === '' ? undefined : num(v2, t[key]) * (k || 1); if (key === 'd' || key === 'len' || key === 'lut') drawTool(t); status('Modificato: ' + UT_NAME[t.kind] + ' ' + t.code); }; }
    set('atLen', 'len'); set('atLut', 'lut'); set('atD', 'd'); set('atTh', 'thick'); set('atSv', 'svas'); set('atRpm', 'rpm', 1000); set('atRpmM', 'rpmMax', 1000); set('atF', 'feed'); set('atFi', 'feedIn');
    $('atTipo').onchange = function () { t.tipo = this.value; render(); };
    $('atRot').onchange = function () { t.rot = this.value; };
    $('atDs').onchange = function () { t.descr = this.value; };
    if ($('atFace')) $('atFace').onchange = function () { t.face = +this.value; drawTool(t); };
    $('atNum').onchange = function () { idx = +this.value; render(); };
    $('atUp').onclick = function () { idx = Math.max(0, idx - 1); render(); };
    $('atDn').onclick = function () { idx = Math.min(list().length - 1, idx + 1); render(); };
    document.querySelectorAll('input[name=atG]').forEach(function (r) { r.onchange = function () { group = this.value; idx = 0; render(); }; });
    $('atBody').querySelectorAll('[data-v]').forEach(function (b) { b.onclick = function () { view = b.dataset.v; render(); }; });
    $('atPrint').onclick = printTools;
    var rpmIn = [$('atRpm'), $('atRpmM')]; rpmIn.forEach(function (el) { if (el) el.title = 'Giri al minuto in migliaia, come in Task (2.0 = 2000 giri/min)'; });
  }
  function status(t) { $('atStatus').textContent = t; }
  function drawTool(t) {
    var c = $('atCv'); if (!c) return; var r = c.getBoundingClientRect(), dp = window.devicePixelRatio || 1; c.width = r.width * dp; c.height = r.height * dp;
    var g = c.getContext('2d'); g.setTransform(dp, 0, 0, dp, 0, 0); readCols(); g.fillStyle = COL.work; g.fillRect(0, 0, r.width, r.height);
    g.font = '500 11px ' + css('--f-mono'); g.fillStyle = COL.ink2; g.strokeStyle = COL.ink; g.lineWidth = 1.2;
    var W2 = r.width, H2 = r.height;
    if (view === 'tool') {
      if (t.kind === 'L') {
        var R = Math.min(W2, H2) * 0.38, cx = W2 / 2, cy = H2 / 2; g.beginPath(); g.arc(cx, cy, R, 0, 7); g.stroke(); g.beginPath(); g.arc(cx, cy, R * 0.15, 0, 7); g.stroke();
        for (var k = 0; k < 24; k++) { var a1 = k * Math.PI / 12; g.beginPath(); g.moveTo(cx + R * Math.cos(a1), cy + R * Math.sin(a1)); g.lineTo(cx + (R + 6) * Math.cos(a1 + 0.08), cy + (R + 6) * Math.sin(a1 + 0.08)); g.stroke(); }
        g.textAlign = 'center'; g.fillText('Ø ' + f2s(t.d) + ' · sp. ' + f2s(t.thick), cx, H2 - 8); return;
      }
      var len = t.len || 60, lut = Math.min(t.lut || 0, len), dd = t.d || 8, sc = Math.min((H2 - 30) / len, (W2 * 0.35) / Math.max(dd, 14)), x = W2 / 2, top = 12;
      var shankD = Math.max(dd, 10) * sc, L1 = (len - lut) * sc, L2 = lut * sc, dw = dd * sc;
      g.fillStyle = COL.surface; g.fillRect(x - shankD / 2, top, shankD, L1); g.strokeRect(x - shankD / 2, top, shankD, L1);
      g.fillStyle = COL.mill; g.globalAlpha = .35; g.fillRect(x - dw / 2, top + L1, dw, L2); g.globalAlpha = 1; g.strokeRect(x - dw / 2, top + L1, dw, L2);
      if (t.tipo === 'Lancia' || t.tipo === 'Svasatore' || t.tipo === 'Conica') { g.beginPath(); g.moveTo(x - dw / 2, top + L1 + L2); g.lineTo(x, top + L1 + L2 + Math.min(12, dw / 2)); g.lineTo(x + dw / 2, top + L1 + L2); g.stroke(); }
      if (t.tipo === 'Sferica') { g.beginPath(); g.arc(x, top + L1 + L2, dw / 2, 0, Math.PI); g.stroke(); }
      g.textAlign = 'left'; g.fillStyle = COL.ink2;
      g.fillText('L ' + f2s(t.len), x + shankD / 2 + 10, top + 12); g.fillText('L.u. ' + f2s(t.lut), x + shankD / 2 + 10, top + L1 + L2 / 2); g.textAlign = 'center'; g.fillText('Ø ' + f2s(t.d) + ' · ' + t.tipo + ' · ' + (t.rot === 'CW' ? 'orario' : 'antiorario'), x, H2 - 4);
    } else if (view === 'face') {
      var bx = W2 / 2 - 70, by = H2 / 2 - 25, bw = 140, bh = 50, dpth = 26;
      var faces = { 1: [[bx, by], [bx + bw, by], [bx + bw + dpth, by - dpth], [bx + dpth, by - dpth]], 2: [[bx, by], [bx + bw, by], [bx + bw, by + bh], [bx, by + bh]], 3: [[bx + bw, by], [bx + bw + dpth, by - dpth], [bx + bw + dpth, by + bh - dpth], [bx + bw, by + bh]] };
      Object.keys(faces).forEach(function (f) { var p = faces[f]; g.beginPath(); p.forEach(function (q, i) { if (i) g.lineTo(q[0], q[1]); else g.moveTo(q[0], q[1]); }); g.closePath(); g.fillStyle = +f === +(t.face || 1) ? COL.accent : COL.mdf; g.fill(); g.stroke(); });
      g.fillStyle = COL.ink; g.textAlign = 'center'; g.fillText('Faccia ' + (t.face || 1) + ' · ' + FACE_TXT[t.face || 1], W2 / 2, H2 - 10);
      if (+t.face === 4 || +t.face === 5) g.fillText('(lato nascosto in questa vista)', W2 / 2, 16);
    } else {
      var heads = draft.filter(function (q) { return q.group === 'fixed'; }), xs = heads.map(function (q) { return q.off.x; }), ys = heads.map(function (q) { return q.off.y; });
      var mnx = Math.min.apply(null, xs), mxx = Math.max.apply(null, xs), mny = Math.min.apply(null, ys), mxy = Math.max.apply(null, ys), s2 = Math.min((W2 - 40) / Math.max(1, mxx - mnx), (H2 - 40) / Math.max(1, mxy - mny));
      heads.forEach(function (q) { var px = 20 + (q.off.x - mnx) * s2, py = H2 - 20 - (q.off.y - mny) * s2, on = q === t; g.fillStyle = on ? COL.accent : (q.kind === 'H' ? COL.hhole : q.kind === 'F' ? COL.mill : q.kind === 'L' ? COL.ink2 : COL.hole); g.beginPath(); g.arc(px, py, on ? 7 : 4.5, 0, 7); g.fill(); if (on || q.kind !== 'V') { g.fillStyle = COL.ink; g.textAlign = 'left'; g.fillText(q.code, px + 8, py + 4); } });
      g.fillStyle = COL.ink2; g.textAlign = 'left'; g.fillText('Posizione dei mandrini (offset X/Y)', 8, 14);
    }
  }
  function printTools() {
    var lines = ['ATTREZZAGGIO ' + job.settings.attrezzaggio + ' - SCM Tech 99L (Kvara)', 'Generato da CAM Tech 99L il ' + new Date().toLocaleString('it-IT'), '',
      'Num  Utensile   Faccia      Lungh.  L.utile  Diam.   Tipo         Svas.  Rot.        RPM    RPM max  Vel.   OffX     OffY     OffZ    A     alfa  Gruppo'];
    draft.forEach(function (t) { var o = t.off || {}; lines.push([pad(t.code, 4), pad(UT_NAME[t.kind] + (t.kind === 'H' ? ' or.' : ''), 10), pad(FACE_TXT[t.face || 1], 11), lp(f2s(t.len), 7), lp(f2s(t.lut), 8), lp(f2s(t.d), 7), ' ' + pad(t.tipo, 12), lp(f2s(t.svas || 0), 5), ' ' + pad(t.rot === 'CW' ? 'Orario' : 'Antiorario', 11), lp(t.rpm || '', 6), lp(t.rpmMax || '', 8), lp(t.feed || '', 6), lp(f2s(o.x), 8), lp(f2s(o.y), 9), lp(f2s(o.z), 8), lp(f2s(o.a), 6), lp(f2s(o.alfa), 6), '  ' + (t.group === 'change' ? 'Cambio ut.' : 'Testa fissa')].join(' ')); });
    saveFile('Attrezzaggio_' + job.settings.attrezzaggio + '.txt', lines.join('\r\n') + '\r\n', 'Elenco attrezzaggio salvato: aprilo e stampalo');
    function pad(s, n) { s = String(s == null ? '' : s); return (s + ' '.repeat(n)).slice(0, n); } function lp(s, n) { s = String(s == null ? '' : s); return (' '.repeat(n) + s).slice(-n); }
  }
  $('mNo').onclick = closeModal;
  $('mOk').onclick = function () { commit(); job.tools = draft; job.toolsVer = TOOLS_VER; if ($('tDef').checked) lsSet(TOOLS_KEY, JSON.stringify(draft)); closeModal(); changed(true); toast('Attrezzaggio aggiornato'); };
  $('atHelp').onclick = function () { status('Numero sceglie l\'utensile (▲▼ o frecce). Testa fissa: mandrini verticali, orizzontali, lame ed elettromandrino. Cambio utensile: utensili del magazzino. RPM in migliaia come in Task. Gli offset vengono dalla configurazione macchina e non si modificano qui.'); };
  $('atAdd').onclick = function () { var n = { code: String(group === 'change' ? 100 + list().length : draft.length + 1), kind: group === 'change' ? 'F' : 'V', group: group, face: 1, d: 10, len: 80, lut: 30, tipo: group === 'change' ? 'Cilindrica' : 'Piatta', rot: 'CW', rpm: group === 'change' ? 18000 : 2000, rpmMax: group === 'change' ? 24000 : 2000, feed: group === 'change' ? 4000 : 1000, feedIn: 4000, off: { x: 0, y: 0, z: 0, a: 0, alfa: 0, d: 0 }, descr: 'Nuovo' }; draft.push(n); idx = list().length - 1; render(); status('Nuovo utensile ' + n.code + ': cambia il numero nella tabella con Codice se serve'); };
  $('atDel').onclick = function () { var t = cur(); if (!t) return; draft.splice(draft.indexOf(t), 1); render(); status('Utensile ' + t.code + ' eliminato (confermi con OK)'); };
  $('atReset').onclick = function () { draft = machineTools(); idx = 0; group = 'fixed'; render(); status('Valori della macchina ripristinati (confermi con OK)'); };
  $('modal').querySelector('.card').addEventListener('keydown', function (e) { if (e.target.tagName === 'INPUT' && e.target.id !== 'atNum') return; if (e.key === 'ArrowUp' || e.key === 'ArrowDown') { e.preventDefault(); idx = Math.max(0, Math.min(list().length - 1, idx + (e.key === 'ArrowUp' ? -1 : 1))); render(); } });
  render();
}
// import attrezzaggio dai file della macchina (Def.TLD + Dati\pheads.par, TOOLS.par, ExtTools.par)
function parseIni(txt) { var secs = {}, cur = null; txt.split(/\r?\n/).forEach(function (l) { l = l.trim(); var m = l.match(/^\[(.*)\]$/); if (m) { cur = m[1]; secs[cur] = {}; return; } var e = l.indexOf('='); if (e > 0 && cur !== null) secs[cur][l.slice(0, e).trim()] = l.slice(e + 1).trim(); }); return secs; }
function importMachine(files) {
  var by = {}; files.forEach(function (f) { by[f.name.toLowerCase()] = f.text; });
  function pick(end) { var k = Object.keys(by).filter(function (n) { return n === end || n.slice(-end.length - 1) === '_' + end || (end === 'def.tld' && /\.tld$/.test(n)); })[0]; return k ? by[k] : null; }
  var tld = pick('def.tld'), ph = pick('pheads.par'), tl = pick('tools.par'), ext = pick('exttools.par');
  if (!tld || !ph || !tl) { toast('Servono almeno Def.TLD, pheads.par e TOOLS.par'); return; }
  var sps = []; tld.split(/\r?\n/).forEach(function (l) { var m = l.match(/SP\s+(\d+)\s*=\s*TL\s+(\d+)/i); if (m) sps.push({ sp: +m[1], tl: +m[2] }); });
  var heads = parseIni(ph), tools = parseIni(tl), spList = [];
  Object.keys(heads).forEach(function (k) { var m = k.match(/^hd(\d+)\.sp(\d+)$/); if (m) spList.push({ hd: +m[1], sp: +m[2], d: heads[k] }); });
  spList.sort(function (a, b) { return a.hd - b.hd || a.sp - b.sp; });
  var out = [];
  spList.forEach(function (s, i) {
    var map = sps[i]; if (!map) return; var t = tools['atr' + (map.tl - 1)] || {}, face = +s.d.DS_FACE || 1, type = (s.d.DS_TIPO || t.UT_TIPO || 'M').charAt(0);
    var kind = type === 'F' ? 'F' : type === 'D' ? 'L' : face === 1 ? 'V' : 'H', d = num(t.UT_DIAM, kind === 'L' ? 0 : 10);
    if (out.some(function (o) { return o.code === String(map.tl); })) return;
    var o = { code: String(map.tl), kind: kind, group: 'fixed', face: face, d: kind === 'L' ? 2 * num(t.UT_RADIUS, 0) : d, len: num(t.UT_LUNG, 0), tipo: TIPI[kind][0], rot: t.UT_ROTDIR === '-' ? 'CCW' : 'CW', descr: (t.UT_LABEL && t.UT_LABEL !== ';' ? t.UT_LABEL + ' · ' : '') + 'SP ' + map.sp + ' · testa ' + s.hd,
      off: { x: num(s.d.DS_SOFX, 0), y: -num(s.d.DS_SOFY, 0), z: num(s.d.DS_SOFZ, 0), a: num(s.d.DS_SOFR, 0), alfa: num(s.d.DS_ALFA, 0), d: num(s.d.DS_SOFD, 0) } };
    if (t.UT_LUT) o.lut = num(t.UT_LUT, 0); if (kind === 'L') { o.thick = num(t.UT_SPESS, 0); o.lut = num(t.UT_CORUT, 0); }
    o.rpmMax = num(t.UT_RPMMAX, 0) || undefined;
    if (kind === 'H') o.face = face;
    if (kind === 'F') { o.feedIn = 4000; o.feed = num(t.UT_WRKSTD, 5000) || 5000; o.rpm = num(t.UT_RPMSTD, 18000) || 18000; } else { o.feed = 1000; o.rpm = 2000; o.rpmMax = o.rpmMax || 2000; }
    out.push(o);
  });
  if (ext) { var e = parseIni(ext); Object.keys(e).forEach(function (k) { var m = k.match(/^atrext(\d+)$/); if (m && e[k].UT_TIPO === 'F') out.push({ code: String(100 + +m[1]), kind: 'F', group: 'change', face: 1, tipo: 'Cilindrica', rot: e[k].UT_ROTDIR === '-' ? 'CCW' : 'CW', len: num(e[k].UT_LUNG, 0), rpmMax: num(e[k].UT_RPMMAX, 0) || undefined, off: { x: 0, y: 0, z: 0, a: 0, alfa: 0, d: 0 }, d: num(e[k].UT_DIAM, 10), lut: num(e[k].UT_LUT, 0) || undefined, feedIn: 4000, feed: num(e[k].UT_WRKSTD, 4000) || 4000, rpm: num(e[k].UT_RPMSTD, 14000) || 14000, descr: 'Utensile esterno ' + m[1] }); }); }
  if (!out.length) { toast('Nessun utensile riconosciuto'); return; }
  commit(); job.tools = out; job.toolsVer = TOOLS_VER; lsSet(TOOLS_KEY, JSON.stringify(out)); changed(true); toast('Importati ' + out.length + ' utensili dalla macchina'); toolsDialog();
}
$('fMach').addEventListener('change', function () {
  var fs = Array.prototype.slice.call(this.files), res = [], left = fs.length; this.value = '';
  fs.forEach(function (f) { var r = new FileReader(); r.onload = function () { res.push({ name: f.name, text: r.result }); if (!--left) { closeModal(); importMachine(res); } }; r.readAsText(f, 'latin1'); });
});

/* ================= file ================= */
var dl = null;
if (window.claude && window.claude.use) window.claude.use('downloads').then(function (d) { dl = d; }, function () {});
function saveFile(name, data, okMsg) {
  if (!dl) {
    try { var blob = data instanceof Blob ? data : new Blob([data], { type: 'application/octet-stream' }); var a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name; document.body.appendChild(a); a.click(); setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 2000); toast(okMsg || 'Salvato'); }
    catch (e) { toast('Salvataggio non disponibile: usa Copia'); }
    return;
  }
  dl.save({ filename: name, data: data }).then(function () { toast(okMsg || 'Salvato'); }, function (e) { if (e && e.code === 'declined') return; toast('Salvataggio non riuscito' + (e && e.code ? ' (' + e.code + ')' : '')); });
}
$('fProj').addEventListener('change', function () {
  var f = this.files[0]; if (!f) return; var r = new FileReader(); this.value = '';
  r.onload = function () { try { var j = JSON.parse(r.result); if (!j.panel || !j.ops) throw 0; commit(); job = migrate(j); fixIds(); ui.sel = []; persist(); setEnv('cad'); fitPanel(); toast('Progetto importato'); } catch (e) { toast('File non valido: serve un progetto .json di CAM Tech 99L'); } };
  r.readAsText(f);
});
$('fPts').addEventListener('change', function () {
  var f = this.files[0]; if (!f) return; var r = new FileReader(); this.value = '';
  r.onload = function () {
    var pts = []; r.result.split(/\r?\n/).forEach(function (l) { var p = l.trim().split(/[;\t ]+|,(?=\s*-?\d)/).map(function (x) { return num(x, NaN); }); if (p.length >= 2 && isFinite(p[0]) && isFinite(p[1])) pts.push({ x: p[0], y: p[1], b: isFinite(p[2]) ? p[2] : 0 }); });
    if (pts.length < 2) return toast('Servono almeno due righe "X;Y" (terza colonna facoltativa: curvatura)');
    var closed = Math.hypot(pts[0].x - pts[pts.length - 1].x, pts[0].y - pts[pts.length - 1].y) < 0.01; if (closed) pts.pop();
    addOps([newPath(pts, closed)]); toast('Forma per punti: ' + pts.length + ' punti');
  };
  r.readAsText(f, 'latin1');
});
$('fDxf').addEventListener('change', function () { var f = this.files[0]; if (f) readDxf(f); this.value = ''; });
var mainEl = $('main');
mainEl.addEventListener('dragover', function (e) { if (ui.env === 'sup' || ui.env === 'fer' || ui.env === 'mob' || ui.env === 'lc') return; e.preventDefault(); $('dropzone').hidden = false; });
mainEl.addEventListener('dragleave', function (e) { if (e.target === $('dropzone')) $('dropzone').hidden = true; });
mainEl.addEventListener('drop', function (e) { e.preventDefault(); $('dropzone').hidden = true; var f = e.dataTransfer.files[0]; if (f) readDxf(f); });
function readDxf(f) {
  if (/\.dwg$/i.test(f.name)) { dlg('File DWG', '<p>Il DWG è un formato chiuso e non si legge qui. Da AutoCAD usa <code>SALVACOME</code> e scegli il formato <b>DXF</b>, poi importa quel file.</p>', 'Ho capito', function () {}); return; }
  var r = new FileReader();
  r.onload = function () {
    var txt = r.result; if (/^AutoCAD Binary DXF/.test(txt)) return toast('DXF binario non supportato: salva come DXF ASCII');
    var parsed; try { parsed = C.parseDXF(txt); } catch (e) { return toast('DXF non leggibile'); }
    var res = C.dxfToOps(parsed, {}), nH = res.ops.filter(function (o) { return o.type === 'hole'; }).length, nP = res.ops.length - nH;
    var layers = {}; parsed.items.forEach(function (it) { layers[it.layer] = (layers[it.layer] || 0) + 1; });
    var lay = Object.keys(layers).map(function (k) { var rr = C.layerRule(k); return '<code>' + esc(k) + '</code> ' + layers[k] + (rr.role ? ' → ' + { panel: 'pannello', hole: 'fori', mill: 'fresatura' }[rr.role] : ''); }).join(' · ');
    dlg('Import DXF: ' + esc(f.name), '<p>Trovati <b>' + nH + ' fori</b> e <b>' + nP + ' percorsi</b>' + (res.panel ? ', pannello <b>' + C.f2(res.panel.L) + ' × ' + C.f2(res.panel.W) + '</b>' : ', nessun contorno pannello') + '.</p><p class="note">Layer: ' + (lay || '—') + '</p>' +
      '<div class="grid2">' + field('iT', 'Spessore pannello', job.panel.T, { unit: 'mm' }) + field('iHD', 'Profondità fori', ui.def.depth, { unit: 'mm' }) + field('iMD', 'Profondità fresature', ui.def.millDepth, { unit: 'mm' }) + field('iTool', 'Fresa', ui.def.millTool, { select: millOpts() }) + '</div>' +
      chk('iRep', 'Sostituisci le lavorazioni del disegno corrente', true) + chk('iJoin', 'Auto unisci i tratti con estremi comuni', true) +
      '<p class="note">Layer riconosciuti: <code>PANNELLO</code> grezzo, <code>FORO_D8_P12</code> fori, <code>FRESA_T44_P18_EST</code> fresature (utensile, profondità, lato). I valori nei nomi dei layer prevalgono.</p>', 'Importa', function () {
      commit(); var T = v('iT', job.panel.T), hd = v('iHD', ui.def.depth), md = v('iMD', ui.def.millDepth), tool = $('iTool').value || ui.def.millTool;
      if ($('iRep').checked) job.ops = [];
      if (res.panel) { job.panel.L = r2(res.panel.L); job.panel.W = r2(res.panel.W); }
      job.panel.T = T; job.refPoly = res.panel && !res.panel.rect ? res.panelPoly : null;
      var ops = res.ops.map(function (o) { if (o.type === 'hole') { if (o.depth == null) o.depth = hd; } else { if (o.depth == null) o.depth = md; if (!o.tool) o.tool = tool; o.passes = 1; o.pts.forEach(function (p) { p.x = r2(p.x); p.y = r2(p.y); }); } if (o.layer) { o.note = o.layer; delete o.layer; } return o; });
      if ($('iJoin').checked) { var paths = ops.filter(function (o) { return o.type === 'path' && !o.closed; }), rest = ops.filter(function (o) { return !(o.type === 'path' && !o.closed); }); if (paths.length > 1) ops = rest.concat(G.autoJoin(paths).paths); }
      ops.forEach(function (o) { o.id = nextId++; job.ops.push(o); });
      if (job.name === 'ESEMPIO' || job.name === 'NUOVO') { job.name = C.progName({ progName: f.name.replace(/\.dxf$/i, '') }); job.settings.progName = job.name; }
      ui.sel = []; changed(); setEnv('cad'); fitPanel(); toast('Importate ' + ops.length + ' entità');
    });
  };
  r.readAsText(f, 'latin1');
}

/* ================= animazione ================= */
function animPath() {
  var seq = [], last = { x: 0, y: 0 };
  job.ops.forEach(function (op) {
    var t = op.type === 'hole' || op.type === 'row' ? C.findDrill(job.tools, op.d, op.type === 'hole' ? op.face : 1) : toolOf(op), d = t ? t.d : 10, tc = t ? t.code : null;
    function go(p, work) { seq.push({ x: p.x, y: p.y, work: work, d: d, tc: tc }); }
    if (op.type === 'hole') { var p = opStart(op); go(p, false); go(p, true); }
    else if (op.type === 'row') for (var i = 0; i < op.n; i++) { var q = { x: op.dir === 'X' ? op.x + i * op.step : op.x, y: op.dir === 'Y' ? op.y + i * op.step : op.y }; go(q, false); go(q, true); }
    else if (op.type === 'path') { var s = C.samplePath(op.pts, op.closed, 5); if (op.closed) s.push(s[0]); go(s[0], false); s.forEach(function (q) { go(q, true); }); }
    else if (op.type === 'pocket' && t) C.pocketContours(op, t.d).forEach(function (c, k) { var s = C.samplePath(c, !(c.length === 2 && !c[0].b), 5); s.push(s[0]); go(s[0], k > 0); s.forEach(function (q) { go(q, true); }); });
    else if (op.type === 'trim') { var tp = trimPts(op); go(tp[0], false); tp.forEach(function (q) { go(q, true); }); }
  });
  void last; return seq;
}
function startAnim() {
  var seq = animPath(); if (!seq.length) return toast('Nessuna lavorazione da animare');
  if (ui.env === 'sup' || ui.env === 'fer' || ui.env === 'mob' || ui.env === 'lc') setEnv('cam');
  var i = 0, pos = { x: seq[0].x, y: seq[0].y }, speedW = 5000 / 60 * 4, speedR = 40000 / 60 * 4, lastT = null;
  ui.anim = { pos: pos, d: seq[0].d, tc: seq[0].tc };
  setPrompt('Animazione a 4× velocità reale: rapidi tratteggiati, lavoro pieno. Esc o clic per fermare.');
  function step(ts) {
    if (!ui.anim) return; if (lastT == null) lastT = ts; var dt = (ts - lastT) / 1000; lastT = ts;
    var budget = dt;
    while (budget > 0 && i < seq.length) {
      var tg = seq[i], dx = tg.x - pos.x, dy = tg.y - pos.y, L = Math.hypot(dx, dy), sp = tg.work ? speedW : speedR, need = L / sp;
      if (need <= budget) { pos.x = tg.x; pos.y = tg.y; budget -= need; ui.anim.d = tg.d; ui.anim.tc = tg.tc; i++; } else { pos.x += dx * budget / need; pos.y += dy * budget / need; budget = 0; }
    }
    draw(); if (i >= seq.length) { stopAnim(); toast('Animazione terminata'); return; } ui.anim.raf = requestAnimationFrame(step);
  }
  ui.anim.raf = requestAnimationFrame(step);
}
function stopAnim() { if (ui.anim && ui.anim.raf) cancelAnimationFrame(ui.anim.raf); ui.anim = null; setPrompt(''); draw(); }

/* ================= avvio ================= */
window.addEventListener('resize', function () { resize(); if (ui.env === 'sup') renderSup(); if (ui.env === 'fer') renderFer(); if (ui.env === 'mob') renderMob(); });
if (window.matchMedia) window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function () { draw(); if (ui.env === 'sup') renderSup(); });
new MutationObserver(function () { draw(); }).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
setEnv('cad'); resize(); fitPanel();
if (document.fonts && document.fonts.ready) document.fonts.ready.then(draw);
window.__cam = { job: function () { return job; }, run: run, ui: ui, svg: svgDialog, scr: function (x, y) { var r = cv.getBoundingClientRect(); return { x: r.left + sx(x), y: r.top + sy(y) }; }, setJob: function (j) { commit(); job = migrate(j); fixIds(); ui.sel = []; changed(); fitPanel(); } };
})();
