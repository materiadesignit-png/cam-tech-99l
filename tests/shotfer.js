const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto('file://' + process.cwd() + '/cam-tech99l.html'); await p.waitForTimeout(700);
  await p.click('[data-env=fer]'); await p.waitForTimeout(300);
  await p.fill('#fL', '446'); await p.press('#fL', 'Tab'); await p.fill('#fW', '716'); await p.press('#fW', 'Tab'); await p.waitForTimeout(300);
  await p.screenshot({ path: 'fer1.png' });
  // tutti i preset
  const ids = await p.$$eval('[data-fer]', a => a.map(e => e.dataset.fer));
  for (const id of ids) { await p.click('[data-fer="' + id + '"]'); await p.waitForTimeout(80); const n = await p.$eval('#fer .kv', e => e.innerText.split('\n').slice(2,4).join(' ')); console.log(id, n.replace(/\s+/g,' ')); }
  await p.click('[data-fer="b1"]'); await p.waitForTimeout(100);
  await p.click('#ferIns'); await p.waitForTimeout(400);
  await p.screenshot({ path: 'fer2.png' });
  const j = await p.evaluate(() => window.__cam.job());
  console.log(JSON.stringify(j.ops.filter(o=>o.type==='hole').slice(-6)));
  await p.click('[data-fer]').catch(()=>{});
  await p.click('[data-env=fer]'); await p.click('[data-fer="b14"]'); await p.waitForTimeout(200); await p.screenshot({ path: 'fer3.png' });
  console.log('ERR', JSON.stringify(errs)); await b.close();
})();
