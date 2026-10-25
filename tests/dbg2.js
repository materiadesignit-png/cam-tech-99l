const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const p = await b.newPage();
  p.on('pageerror', e => console.log('PE', e.message));
  await p.goto('file://' + process.cwd() + '/cam-tech99l.html'); await p.waitForTimeout(500);
  console.log(await p.evaluate(() => { const L = (a) => ({ type: 'path', closed: false, pts: a.map(q => ({ x: q[0], y: q[1], b: 0 })) });
    const o = L([[20,150],[380,150]]), c = L([[100,50],[100,250]]);
    return JSON.stringify({ segs: TOPO.segs(o).length, inter: TOPO.inter(TOPO.segs(o)[0], TOPO.segs(c)[0]), trim: TOPO.trim(o, [c], { x: 50, y: 151 }) }); }));
  await b.close();
})();
