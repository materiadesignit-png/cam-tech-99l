// Confronto con un programma originale della macchina (C:\Utente\Sconto.PRG del clone) come golden master
const C = require('../src/core.js'), fs = require('fs');
const gold = fs.readFileSync('' + (process.env.SCONTO_PRG || __dirname + '/fixtures/Sconto.PRG') + '', 'latin1').split(/\r?\n/).map(s => s.trim()).filter(Boolean);
const job = { name: 'Sconto', panel: { L: 600, W: 400, T: 18 }, settings: { progName: 'Sconto', battuta: 'A', attrezzaggio: 'DEF', R: 1, millFeed: 5000, millFeedIn: 4000, millRpm: 18000, drillFeed: 2000, drillRpm: 4000 },
  tools: [{ code: '44', kind: 'F', d: 10, len: 163, lut: 30, rpm: 18000, feed: 5000, feedIn: 4000, face: 1 }],
  ops: [{ id: 1, type: 'trim', tool: '44', depth: 22, lead: 20, inset: 0, side: 'L', feedIn: 4000, feed: 5000, rpm: 18000 }] };
const out = C.generate(job).split(/\r?\n/).map(s => s.trim()).filter(Boolean);
const norm = l => l.replace(/;$/, '').replace(/([A-Z])\s+(-?[\d.]+)/g, '$1$2').replace(/(-?\d+\.\d+|-?\d+)/g, m => String(+m)).replace(/\s+/g, ' ');
let pass = 0, fail = 0, notes = [];
function ok(n, c, i) { if (c) pass++; else { fail++; console.log('FAIL', n, i || ''); } }
ok('intestazione', out[0] === gold[0], out[0] + ' | ' + gold[0]);
ok('marcatori $$SS/$$SE', out[1] === gold[1] && out[2] === gold[2]);
const g200o = norm(out[3]).replace(/ U0 V0 W0$/, ''), g200g = norm(gold[3]).replace(/ U[\d.]+ V[\d.]+ W[\d.]+$/, '');
ok('G200 (esclusi U V W)', g200o === g200g, g200o + ' | ' + g200g);
ok('controsagome a zero', / U\s+0\.00 V\s+0\.00 W\s+0\.00;$/.test(out[3]), out[3]);
const body = l => l.filter(s => /^G1(0[01]|4[0-2])/.test(s)).map(norm);
const bo = body(out), bg = body(gold);
bg.forEach((g, i) => ok('riga lavorazione ' + (i + 1), bo[i] === g, bo[i] + ' | ' + g));
if (bo.length > bg.length) notes.push('righe in più rispetto all\'originale: ' + bo.slice(bg.length).join(' / ') + ' (G140 annulla correzione: presente nel manuale Kvara, assente in Sconto.PRG)');
ok('RET finale', out[out.length - 1] === 'RET');
console.log('golden PRG: ' + pass + ' ok, ' + fail + ' falliti'); notes.forEach(n => console.log('NOTA', n)); process.exit(fail ? 1 : 0);
