const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1400, height: 860 } });
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto('file://' + process.cwd() + '/cam-tech99l.html'); await p.waitForTimeout(600);
  const r = {};
  await p.hover('#toolbar [data-cmd=trimEnt]'); await p.waitForTimeout(450);
  r.tip = await p.$eval('.ctip', e => !e.hidden && e.innerText); r.prompt = await p.$eval('#prompt', e => e.innerText);
  await p.screenshot({ path: 'tip1.png', clip: { x: 0, y: 0, width: 1000, height: 260 } });
  await p.hover('#toolbar [data-cmd=hole]'); await p.waitForTimeout(60); r.tip2 = await p.$eval('.ctip', e => e.innerText.split('\n')[0]);
  await p.mouse.move(700, 500); await p.waitForTimeout(100); r.hidden = await p.$eval('.ctip', e => e.hidden);
  // menu
  await p.click('.mtop:nth-child(5) > button'); await p.hover('[data-cmd=extendEnt]'); await p.waitForTimeout(450); r.menuTip = await p.$eval('.ctip', e => e.innerText.split('\n')[0]);
  await p.screenshot({ path: 'tip2.png' }); await p.keyboard.press('Escape'); await p.mouse.click(700, 830);
  // preselezione entità
  const pt = await p.evaluate(() => { const o = window.__cam.job().ops.find(o => o.type === 'path'); return window.__cam.scr(o.pts[0].x, o.pts[0].y); });
  await p.mouse.move(pt.x + 2, pt.y); await p.waitForTimeout(150); r.hover = await p.evaluate(() => window.__cam.ui.hoverId);
  await p.screenshot({ path: 'tip3.png' });
  console.log(JSON.stringify(r, null, 1)); console.log('ERR', JSON.stringify(errs)); await b.close();
})();
