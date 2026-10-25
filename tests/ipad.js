const { chromium, devices } = require('playwright');
(async () => {
  const b = await chromium.launch(); const ctx = await b.newContext({ ...devices['iPad Pro 11 landscape'] }); const p = await ctx.newPage();
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto('file://' + process.cwd() + '/cam-tech99l.html'); await p.waitForTimeout(700);
  await p.tap('#toolbar [data-cmd=hole]'); const s = await p.evaluate(() => window.__cam.scr(400, 300)); const n0 = await p.evaluate(() => window.__cam.job().ops.length);
  await p.touchscreen.tap(s.x, s.y); await p.waitForTimeout(200); const n1 = await p.evaluate(() => window.__cam.job().ops.length);
  await p.screenshot({ path: 'ipad.png' });
  console.log(JSON.stringify({ viewport: p.viewportSize(), foroAggiunto: n1 - n0 })); console.log('ERR', JSON.stringify(errs)); await b.close();
})();
