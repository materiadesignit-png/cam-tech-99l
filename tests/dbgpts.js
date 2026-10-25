const { chromium } = require('playwright');
(async () => { const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
  await p.goto('file://' + process.cwd() + '/cam-tech99l.html'); await p.waitForTimeout(600);
  await p.evaluate(() => { const o = window.__cam.job().ops.find(o => o.type === 'path'); window.__cam.ui.sel = [o.id]; window.__cam.run('entity'); });
  await p.waitForTimeout(200); console.log(await p.$$eval('#pts .pt', a => a.length), await p.$eval('#pts', e => JSON.stringify(e.getBoundingClientRect())));
  await b.close(); })();
