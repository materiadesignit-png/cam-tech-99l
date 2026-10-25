const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1400, height: 860 } });
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto('file://' + process.cwd() + '/cam-tech99l.html'); await p.waitForTimeout(600);
  let res = {};
  // disegno di prova: orizzontale 0..400 a y=150, due lame verticali x=100 e x=300
  await p.evaluate(() => { const j = JSON.parse(JSON.stringify(window.__cam.job())); j.ops = [
    { type: 'path', closed: false, pts: [{ x: 20, y: 150, b: 0 }, { x: 380, y: 150, b: 0 }], tool: '44', depth: 5, corr: 'C' },
    { type: 'path', closed: false, pts: [{ x: 100, y: 50, b: 0 }, { x: 100, y: 250, b: 0 }], tool: '44', depth: 5, corr: 'C' },
    { type: 'path', closed: false, pts: [{ x: 300, y: 50, b: 0 }, { x: 300, y: 250, b: 0 }], tool: '44', depth: 5, corr: 'C' },
    { type: 'path', closed: false, pts: [{ x: 150, y: 220, b: 0 }, { x: 250, y: 220, b: 0 }], tool: '44', depth: 5, corr: 'C' }];
    j.panel = { L: 400, W: 300, T: 20 }; j.dims = []; window.__cam.setJob(j); });
  await p.waitForTimeout(300);
  const ids = await p.evaluate(() => window.__cam.job().ops.map(o => o.id));
  // TAGLIA: lame = le due verticali, clic sulla parte centrale della orizzontale
  await p.evaluate((ids) => { window.__cam.ui.sel = [ids[1], ids[2]]; window.__cam.run('trimEnt'); }, ids);
  let s = await p.evaluate(() => window.__cam.scr(200, 151)); await p.mouse.click(s.x, s.y); await p.waitForTimeout(200);
  await p.keyboard.press('Escape');
  res.trim = await p.evaluate(() => window.__cam.job().ops.filter(o => o.pts[0].y === 150 || (o.pts[1] && o.pts[1].y === 150)).map(o => o.pts.map(q => q.x)));
  // ESTENDI: bordo = verticale x=300, estendi la corta y=220 verso destra
  const ids2 = await p.evaluate(() => window.__cam.job().ops.map(o => o.id + ':' + o.pts[0].x + ',' + o.pts[0].y));
  await p.evaluate(() => { const j = window.__cam.job(); const v = j.ops.find(o => o.pts[0].x === 300 && o.pts[0].y === 50); window.__cam.ui.sel = [v.id]; window.__cam.run('extendEnt'); });
  s = await p.evaluate(() => window.__cam.scr(245, 220)); await p.mouse.click(s.x, s.y); await p.waitForTimeout(200); await p.keyboard.press('Escape');
  res.extend = await p.evaluate(() => window.__cam.job().ops.find(o => o.pts[0].y === 220).pts.map(q => q.x));
  // QUOTA X tra (100,50) e (300,50)
  await p.evaluate(() => window.__cam.run('dimAdd')); await p.waitForTimeout(150); await p.click('#mOk'); await p.waitForTimeout(100);
  for (const [x, y] of [[100, 50], [300, 50], [200, 20]]) { s = await p.evaluate(([x, y]) => window.__cam.scr(x, y), [x, y]); await p.mouse.click(s.x, s.y); await p.waitForTimeout(120); }
  res.dims = await p.evaluate(() => window.__cam.job().dims);
  await p.evaluate(() => window.__cam.run('dimPanel')); await p.waitForTimeout(200);
  await p.screenshot({ path: 'e2e_cad.png' });
  // UNDO ripristina
  await p.keyboard.press('Control+z'); res.undoDims = await p.evaluate(() => window.__cam.job().dims.length);
  // salva / riapri progetto: le quote restano nel JSON
  res.json = await p.evaluate(() => JSON.parse(JSON.stringify(window.__cam.job())).dims.length);
  // part program invariato dalle quote
  res.pp = await p.evaluate(() => CORE.generate(window.__cam.job()).split('\n').filter(l => /QUOT|dim/i.test(l)).length);
  await p.evaluate(() => window.__cam.run('geoCheck')); await p.waitForTimeout(100); res.check = await p.$eval('#modal', e => e.innerText.slice(0, 80));
  console.log(JSON.stringify(res)); console.log('ERR', JSON.stringify(errs)); await b.close();
})();
