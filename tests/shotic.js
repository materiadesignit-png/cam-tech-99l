const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1400, height: 820 } });
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto('file://' + process.cwd() + '/cam-tech99l.html'); await p.waitForTimeout(700);
  await p.evaluate(() => window.__cam.run('toCad')); await p.waitForTimeout(300);
  await p.screenshot({ path: 'ic1.png', clip: { x: 0, y: 0, width: 1400, height: 300 } });
  await p.evaluate(() => window.__cam.run('iconStyle')); await p.waitForTimeout(300);
  await p.screenshot({ path: 'ic2.png' });
  await p.check('input[name=qIs][value=etichette]'); await p.click('#mOk'); await p.waitForTimeout(300);
  await p.screenshot({ path: 'ic3.png', clip: { x: 0, y: 0, width: 1400, height: 300 } });
  console.log('ERR', JSON.stringify(errs)); await b.close();
})();
