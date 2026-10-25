const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
  const errs = []; p.on('pageerror', e => errs.push(e.message)); const r = {};
  const dxf = '0\nSECTION\n2\nENTITIES\n0\nLINE\n8\nFRESA_T44_P10\n10\n100\n20\n100\n11\n300\n21\n100\n0\nCIRCLE\n8\nFORO_D8_P12\n10\n200\n20\n200\n40\n4\n0\nENDSEC\n0\nEOF\n';
  await p.addInitScript((dxf) => { let cb = null; window.__sent = []; window.native = { platform: 'win32', litecad: {
    status: async () => ({ exe: 'C:\\Users\\david\\AppData\\Local\\CAM Tech 99L\\LiteCAD\\LiteCAD.exe', dir: 'C:\\Users\\david\\Documents\\CAM Tech 99L\\LiteCAD', candidates: ['a', 'b'] }),
    choose: async () => null, launch: async () => ({ ok: true }), send: async (n, t) => { window.__sent.push([n, t.length]); return 'C:\\x\\' + n; },
    list: async () => [{ name: 'pannello_litecad.dxf', size: 300, mtime: Date.now() }], read: async () => dxf, openFolder: async () => {}, onNew: f => { cb = f; window.__fire = n => cb(n); } } }; }, dxf);
  await p.goto('file://' + process.cwd() + '/cam-tech99l.html'); await p.waitForTimeout(700);
  r.tab = await p.$eval('#envLc', e => !e.hidden);
  await p.click('#envLc'); await p.waitForTimeout(300); await p.screenshot({ path: 'lc1.png' });
  r.status = await p.$eval('#lc .issue', e => e.innerText.slice(0, 40));
  await p.click('#lcSend'); await p.waitForTimeout(100); r.sent = await p.evaluate(() => window.__sent);
  await p.click('[data-lcimp]'); await p.waitForTimeout(300); r.modal = await p.$eval('#modal', e => e.innerText.slice(0, 120).replace(/\n/g, ' '));
  await p.click('#mOk'); await p.waitForTimeout(300); r.ops = await p.evaluate(() => window.__cam.job().ops.map(o => o.type + (o.d ? ' Ø' + o.d : '')));
  await p.evaluate(() => window.__fire('nuovo.dxf')); await p.waitForTimeout(100); r.notify = await p.$eval('#modal', e => e.innerText.slice(0, 60).replace(/\n/g, ' '));
  console.log(JSON.stringify(r)); console.log('ERR', JSON.stringify(errs)); await b.close();
})();
