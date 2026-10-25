const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1400, height: 860 } });
  p.on('pageerror', e => console.log('PE', e.message)); p.on('console', m => console.log('C', m.text()));
  await p.goto('file://' + process.cwd() + '/cam-tech99l.html'); await p.waitForTimeout(600);
  await p.evaluate(() => { const j = JSON.parse(JSON.stringify(window.__cam.job())); j.ops = [
    { type: 'path', closed: false, pts: [{ x: 20, y: 150, b: 0 }, { x: 380, y: 150, b: 0 }], tool: '44', depth: 5, corr: 'C' },
    { type: 'path', closed: false, pts: [{ x: 100, y: 50, b: 0 }, { x: 100, y: 250, b: 0 }], tool: '44', depth: 5, corr: 'C' }];
    j.panel = { L: 400, W: 300, T: 20 }; window.__cam.setJob(j); });
  const ids = await p.evaluate(() => window.__cam.job().ops.map(o => o.id)); console.log(ids);
  await p.evaluate((ids) => { window.__cam.ui.sel = [ids[1]]; window.__cam.run('trimEnt'); }, ids);
  console.log(await p.evaluate(() => JSON.stringify({ pick: !!window.__cam.ui.pick, bl: window.__cam.ui.blades, env: window.__cam.ui.env })));
  console.log(await p.$eval('#prompt, .status, footer', e => e.innerText).catch(e => 'x'));
  await p.evaluate(() => { const t = TOPO.trim; TOPO.trim = function (o, c, q) { console.log('TRIM', JSON.stringify([o.pts, c.map(x => x.pts), q])); const r = t(o, c, q); console.log('R', JSON.stringify(r)); return r; }; });
  const s = await p.evaluate(() => window.__cam.scr(50, 151)); console.log(s, await p.evaluate((s) => { const e = document.elementFromPoint(s.x, s.y); return e.tagName + '#' + e.id + '.' + e.className; }, s)); await p.mouse.click(s.x, s.y); console.log(await p.evaluate(() => JSON.stringify(window.__cam.ui.mouse))); await p.waitForTimeout(300);
  console.log(await p.evaluate(() => JSON.stringify(window.__cam.job().ops.map(o => o.pts))));
  console.log(await p.evaluate(() => document.body.innerText.match(/(Nessuna|Si possono|Taglia)[^\n]*/g)));
  await b.close();
})();
