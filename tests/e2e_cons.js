const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
  const errs = []; p.on('pageerror', e => errs.push(e.message)); const r = {};
  await p.goto('file://' + process.cwd() + '/cam-tech99l.html'); await p.waitForTimeout(700);
  await p.evaluate(() => { const j = JSON.parse(JSON.stringify(window.__cam.job())); j.ops = [{ type: 'path', closed: true, pts: [{ x: 100, y: 100, b: 0 }, { x: 420, y: 120, b: 0 }, { x: 400, y: 330, b: 0 }, { x: 90, y: 310, b: 0 }], tool: '44', depth: 5, corr: 'IN' }]; j.panel = { L: 800, W: 500, T: 20 }; j.cons = []; window.__cam.setJob(j); });
  const S = (x, y) => p.evaluate(([x, y]) => window.__cam.scr(x, y), [x, y]);
  const click = async (x, y) => { const s = await S(x, y); await p.mouse.click(s.x, s.y); await p.waitForTimeout(80); };
  const P = () => p.evaluate(() => window.__cam.job().ops[0].pts.map(q => [q.x, q.y]));
  const mid = async k => { const q = await P(); const a = q[k], c = q[(k + 1) % 4]; return [(a[0] + c[0]) / 2, (a[1] + c[1]) / 2]; };
  for (const [cmd, k] of [['cH', 0], ['cV', 1], ['cH', 2], ['cV', 3]]) { await p.evaluate(c => window.__cam.run(c), cmd); const m = await mid(k); await click(m[0], m[1]); await p.keyboard.press('Escape'); }
  await p.evaluate(() => window.__cam.run('cFix')); { const q = await P(); await click(q[0][0], q[0][1]); }
  await p.evaluate(() => window.__cam.run('cLen')); { const m = await mid(0); await click(m[0], m[1]); } await p.waitForTimeout(100); await p.fill('#qL', '300'); await p.click('#mOk'); await p.waitForTimeout(150);
  r.rect = await P(); r.cons = await p.evaluate(() => window.__cam.job().cons.map(c => c.t));
  await p.screenshot({ path: 'cons1.png' });
  // trascina il vertice 2: deve restare un rettangolo largo 300
  await p.evaluate(() => { window.__cam.ui.sel = [window.__cam.job().ops[0].id]; window.__cam.run('cShow'); window.__cam.run('cShow'); });
  { const q = await P(); const a = await S(q[2][0], q[2][1]), c = await S(q[2][0] + 50, q[2][1] + 60); await p.mouse.move(a.x, a.y); await p.mouse.down(); await p.mouse.move((a.x + c.x) / 2, (a.y + c.y) / 2); await p.mouse.move(c.x, c.y); await p.mouse.up(); }
  r.drag = await P();
  // PRG ancora generabile
  r.prg = await p.evaluate(() => CORE.generate(window.__cam.job()).split(/\r?\n/).filter(l => /^G10/.test(l)).length);
  await p.screenshot({ path: 'cons2.png' });
  console.log(JSON.stringify(r)); console.log('ERR', JSON.stringify(errs)); await b.close();
})();
