
/* ================= SIMULAZIONE: testa completa della macchina (ingombri) ================= */
// posizioni dei mandrini da Dati\pheads.par (offset come in "Modifica attrezzaggio"); corpi e carter con misure indicative
function drawHead() {
  var A = ui.anim, cur = A.tc && C.toolByCode(job.tools, A.tc); if (!cur) cur = job.tools.filter(function (t) { return t.code === '1'; })[0];
  var o0 = cur && cur.off ? cur.off : { x: 0, y: 0 }, css = getComputedStyle(document.documentElement), ink = css.getPropertyValue('--ink').trim() || '#222', acc = css.getPropertyValue('--accent').trim() || '#e5671f';
  var flip = job.settings.sideFlip ? -1 : 1; // Y della macchina invertita rispetto al disegno (da verificare in aria)
  function at(t) { var o = t.off || { x: 0, y: 0 }; return { x: A.pos.x + (o.x - o0.x), y: A.pos.y + flip * (o.y - o0.y) }; }
  var fixed = job.tools.filter(function (t) { return t.group === 'fixed'; }), bb = { x0: Infinity, y0: Infinity, x1: -Infinity, y1: -Infinity };
  function grow(p, r) { bb.x0 = Math.min(bb.x0, p.x - r); bb.y0 = Math.min(bb.y0, p.y - r); bb.x1 = Math.max(bb.x1, p.x + r); bb.y1 = Math.max(bb.y1, p.y + r); }
  ctx.save(); ctx.lineWidth = 1.2;
  fixed.forEach(function (t) {
    var p = at(t), X = sx(p.x), Y = sy(p.y), active = t === cur;
    ctx.strokeStyle = active ? acc : ink; ctx.fillStyle = active ? acc : 'rgba(120,130,125,.35)';
    if (t.kind === 'V') { grow(p, 14); ctx.beginPath(); ctx.arc(X, Y, 13 * view.s, 0, 7); ctx.globalAlpha = .35; ctx.fill(); ctx.globalAlpha = 1; ctx.stroke(); ctx.beginPath(); ctx.arc(X, Y, Math.max(1.5, t.d / 2 * view.s), 0, 7); ctx.fill(); }
    else if (t.kind === 'H') { var a = (t.off.a || 0) * Math.PI / 180, L = (t.len || 55), dx = Math.cos(a), dy = flip * Math.sin(a); grow(p, 30); ctx.save(); ctx.translate(X, Y); ctx.rotate(-Math.atan2(dy, dx)); ctx.globalAlpha = .35; ctx.fillRect(-28 * view.s, -14 * view.s, 28 * view.s, 28 * view.s); ctx.globalAlpha = 1; ctx.strokeRect(-28 * view.s, -14 * view.s, 28 * view.s, 28 * view.s); ctx.fillRect(0, -t.d / 2 * view.s, L * view.s * 0.5, t.d * view.s); ctx.restore(); }
    else if (t.kind === 'L') { var b = (t.off.a || 0) * Math.PI / 180, R = (t.d || 240) / 2; grow(p, R); ctx.save(); ctx.translate(X, Y); ctx.rotate(-flip * b); ctx.globalAlpha = .5; ctx.fillRect(-R * view.s, -(t.thick || 4) / 2 * view.s - 1, 2 * R * view.s, (t.thick || 4) * view.s + 2); ctx.globalAlpha = 1; ctx.setLineDash([4, 3]); ctx.strokeRect(-R * view.s, -20 * view.s, 2 * R * view.s, 40 * view.s); ctx.setLineDash([]); ctx.restore(); }
    else if (t.kind === 'F') { grow(p, 75); ctx.beginPath(); ctx.arc(X, Y, 75 * view.s, 0, 7); ctx.globalAlpha = .25; ctx.fill(); ctx.globalAlpha = 1; ctx.stroke(); ctx.beginPath(); ctx.arc(X, Y, Math.max(2, t.d / 2 * view.s), 0, 7); ctx.fillStyle = active ? acc : ink; ctx.fill(); }
  });
  if (isFinite(bb.x0)) { ctx.strokeStyle = ink; ctx.setLineDash([8, 4]); ctx.globalAlpha = .7; ctx.strokeRect(sx(bb.x0 - 20), sy(bb.y1 + 20), (bb.x1 - bb.x0 + 40) * view.s, (bb.y1 - bb.y0 + 40) * view.s); ctx.setLineDash([]); ctx.globalAlpha = 1; }
  var P = job.panel, out = isFinite(bb.x0) && (bb.x0 - 20 < -400 || bb.x1 + 20 > P.L + 400 || bb.y0 - 20 < -400 || bb.y1 + 20 > P.W + 400);
  ctx.font = '12px ' + (css.getPropertyValue('--f-ui').trim() || 'sans-serif'); ctx.textAlign = 'left'; ctx.fillStyle = ink;
  ctx.fillText('Testa: utensile attivo ' + (cur ? cur.code + ' ' + (cur.descr || '') : '—') + '  ·  X ' + C.f2(A.pos.x) + '  Y ' + C.f2(A.pos.y), 12, 18);
  ctx.fillText('Ingombro testa ' + C.f2(bb.x1 - bb.x0 + 40) + ' × ' + C.f2(bb.y1 - bb.y0 + 40) + ' mm (indicativo: posizioni mandrini da pheads.par, corpi stimati)', 12, 34);
  if (out) { ctx.fillStyle = css.getPropertyValue('--warn').trim() || '#b7791f'; ctx.fillText('Attenzione: la testa esce di oltre 400 mm dal pannello in questa posizione', 12, 50); }
  ctx.restore();
}
cmd('headToggle', 'Testa in simulazione on/off', function () { ui.showHead = ui.showHead === false; draw(); toast(ui.showHead === false ? 'Testa nascosta: solo utensile' : 'Testa completa visibile'); });
