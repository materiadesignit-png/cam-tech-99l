const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
  const errs = []; p.on('pageerror', e => errs.push(e.message)); const r = {};
  await p.goto('file://' + process.cwd() + '/cam-tech99l.html'); await p.waitForTimeout(700);
  await p.evaluate(() => { const j = JSON.parse(JSON.stringify(window.__cam.job())); j.ops = []; j.panel = { L: 600, W: 400, T: 18 }; window.__cam.setJob(j); });
  // faccia 2: un foro a pos 150, Z vicino a 5 e uno vicino a metà
  await p.click('#disp [data-cmd=face2]'); await p.waitForTimeout(200);
  const W = (f, pos, z) => p.evaluate(([f, pos, z]) => { const st = { G: 40, H: Math.max(18 * 3, 54) }, k = st.H / 18; let w; if (f === 2) w = { x: pos, y: -st.G - st.H + z * k }; if (f === 3) w = { x: 600 + st.G + st.H - z * k, y: pos }; return window.__cam.scr(w.x, w.y); }, [f, pos, z]);
  let s = await W(2, 150, 5.2); await p.mouse.move(s.x, s.y); await p.waitForTimeout(50); await p.mouse.click(s.x, s.y);
  s = await W(2, 300, 8.4); await p.mouse.move(s.x, s.y); await p.mouse.click(s.x, s.y);
  await p.screenshot({ path: 'side1.png' });
  // barriera sulla faccia 3 da 32 a 352
  await p.click('#disp [data-cmd=face3]'); await p.waitForTimeout(200); await p.click('#toolbar [data-cmd=row]');
  s = await W(3, 32, 9); await p.mouse.move(s.x, s.y); await p.mouse.click(s.x, s.y); s = await W(3, 352, 9); await p.mouse.move(s.x, s.y); await p.mouse.click(s.x, s.y);
  r.holes = await p.evaluate(() => window.__cam.job().ops.map(o => [o.face, o.pos, o.z, o.d, o.depth]));
  r.prg = await p.evaluate(() => CORE.generate(window.__cam.job()).split(/\r?\n/).filter(l => /^G1|^G2/.test(l)).slice(0, 6));
  r.valid = await p.evaluate(() => CORE.validate(window.__cam.job()).filter(q => q.lvl === 'err').map(q => q.msg));
  await p.screenshot({ path: 'side2.png' });
  console.log(JSON.stringify(r, null, 0)); console.log('ERR', JSON.stringify(errs)); await b.close();
})();
