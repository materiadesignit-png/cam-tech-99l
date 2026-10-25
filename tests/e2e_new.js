const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
  const errs = []; p.on('pageerror', e => errs.push(e.message)); const r = {};
  await p.goto('file://' + process.cwd() + '/cam-tech99l.html'); await p.waitForTimeout(700);
  await p.evaluate(() => { const j = JSON.parse(JSON.stringify(window.__cam.job())); j.ops = []; j.panel = { L: 800, W: 500, T: 20 }; j.dims = []; window.__cam.setJob(j); });
  const S = (x, y) => p.evaluate(([x, y]) => window.__cam.scr(x, y), [x, y]);
  const click = async (x, y) => { const s = await S(x, y); await p.mouse.click(s.x, s.y); await p.waitForTimeout(60); };
  // polilinea con un tratto ad arco
  await p.click('#toolbar [data-cmd=lineMode]'); await click(100, 100); await click(300, 100); await p.keyboard.press('a'); await click(300, 300); await click(400, 200); await click(100, 300); await p.keyboard.press('Enter');
  r.poly = await p.evaluate(() => window.__cam.job().ops.map(o => o.pts.map(q => [q.x, q.y, +(+q.b).toFixed(3)])));
  // arco 3 punti, cerchio 3 punti
  await p.click('#toolbar [data-cmd=arc3Mode]'); await click(500, 100); await click(700, 100); await click(600, 200);
  await p.click('#toolbar [data-cmd=circle3Mode]'); await click(500, 300); await click(700, 300); await click(600, 400);
  r.arcs = await p.evaluate(() => window.__cam.job().ops.slice(1).map(o => o.pts.map(q => [q.x, q.y, +(+q.b).toFixed(3)])));
  // testo svuotato
  await p.click('#toolbar [data-cmd=textCmd]'); await p.waitForTimeout(150); await p.fill('#qTx', 'GAMMA'); await p.fill('#qH', '80'); await p.click('#mOk'); await p.waitForTimeout(400);
  r.text = await p.evaluate(() => window.__cam.job().ops.filter(o => o.note && o.note.indexOf('testo') === 0).length);
  await p.screenshot({ path: 'n_text.png' });
  // SVG
  await p.evaluate(() => { window.__cam.svg('<svg xmlns="http://www.w3.org/2000/svg" width="200mm" height="100mm" viewBox="0 0 200 100"><rect x="10" y="10" width="180" height="80" rx="0"/><circle cx="50" cy="50" r="20"/><path d="M100 30 C120 10 160 10 170 50 S 120 90 100 70 Z"/></svg>', 'prova.svg'); });
  await p.waitForTimeout(150); r.svgInfo = await p.$eval('#modal .kv', e => e.innerText.replace(/\n/g, ' ')); await p.click('#mOk'); await p.waitForTimeout(300);
  r.svgOps = await p.evaluate(() => window.__cam.job().ops.filter(o => o.note === 'prova.svg').map(o => o.pts.length));
  r.prg = await p.evaluate(() => { const t = CORE.generate(window.__cam.job()).split(/\r?\n/).filter(Boolean); return [t.length, t.filter(l => /^G10[123]/.test(l)).length, t[t.length - 1], (CORE.validate(window.__cam.job()) || []).filter(q => q.lvl === 'err').length]; });
  // simulazione con testa
  await p.evaluate(() => window.__cam.run('animate')); await p.waitForTimeout(1500); await p.screenshot({ path: 'n_head.png' }); await p.keyboard.press('Escape');
  // mobili
  await p.click('[data-env=mob]'); await p.waitForTimeout(300); r.mob = await p.$$eval('#mob tbody tr', a => a.map(t => t.innerText.replace(/\t/g, ' | ')));
  await p.click('#mob tbody tr:nth-child(1)'); await p.waitForTimeout(200); await p.screenshot({ path: 'n_mob.png' });
  await p.selectOption('#mb_giu', 'ecc'); await p.waitForTimeout(200); r.mobWarn = await p.$$eval('#mob .issue', a => a.map(e => e.innerText));
  await p.click('#mobSave'); await p.waitForTimeout(200); r.arch = await p.evaluate(() => Object.keys(JSON.parse(localStorage.getItem('camtech99l.archive.v1'))).filter(k => k.indexOf('BASE60') === 0));
  console.log(JSON.stringify(r, null, 1)); console.log('ERR', JSON.stringify(errs)); await b.close();
})();
