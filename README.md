# CAM Tech 99L

CAD/CAM per la foratrice-fresatrice **SCM Tech 99L** con controllo **Kvara**: disegno, lavorazioni, part-program `.PRG`.
Gamma Arredi S.r.l. — i programmi generati sono bozze da provare in aria prima della produzione.

## Struttura
| Cartella | Contenuto |
|---|---|
| `src/core.js` | modello, validazione, **postprocessor Kvara** (`generate`) |
| `src/geom.js`, `src/topo.js`, `src/sketch.js`, `src/shapes.js` | geometria, taglia/estendi, vincoli, testo e SVG |
| `src/app2*.js`, `src/ui2.html` | interfaccia (concatenati in ordine `a b c e f g h i j k l m d`) |
| `src/fonts.js` | caratteri per il comando Testo (generato) |
| `vendor/` | Clipper (Boost), opentype.js (MIT) |
| `desktop/` | Electron 22 per Windows/macOS (`main.js`, `preload.js` per LiteCAD) |
| `tests/` | test Node e Playwright |
| `docs/` | matrice di parità con TASK, formati, test, crediti |

## Comandi
```
python3 tools/build.py                 # crea dist/cam-tech99l.html e desktop/app/index.html
node tests/topo.test.js                # geometria
node tests/golden_prg.test.js          # confronto con Sconto.PRG (percorso del clone da adattare)
node tests/shapes.test.js; node tests/sketch.test.js
cd desktop && npm install && npm run build   # installer Windows (Setup, Portabile, zip)
```
I test Playwright (`tests/e2e_*.js`) aprono `dist/cam-tech99l.html` dalla cartella corrente: lanciarli da `dist/` o adattare il percorso.
