# CAM_TECH_99L_ARCHITECTURE

Tecnologia: HTML5 + JavaScript (un'unica pagina), impacchettata con **Electron 22** (Windows 7-11, 32/64 bit, installer NSIS per utente). Nessun cambio di framework: funziona ed è distribuibile.

| Modulo | File | Responsabilità | Dipende da |
|---|---|---|---|
| Modello CAD + postprocessor | `core.js` (CORE) | archi da bulge, campionamento, DXF parse, validazione fattibilità, **generazione .PRG Kvara**, stima tempi, ordinamento | — |
| Trasformazioni e costruzioni | `geom.js` (GEOM) | sposta/ruota/scala/specchia, raccordi, offset (Clipper), tasche, unioni, oggetti Task, export DXF | CORE, clipper-lib 6.4.2 (Boost) |
| Topologia | `topo.js` (TOPO) | segmenti, intersezioni retta/arco, taglia, estendi, riduzione, controllo integrità | CORE |
| Stato e rendering | `app2a.js` | progetto (`job`), migrazione, undo/redo, attrezzaggio macchina, disegno canvas | CORE |
| Input e dialoghi | `app2b.js` | mouse, tastiera, osnap, selezione, dialoghi | — |
| Comandi e menu | `app2c.js` | registro comandi (`cmd`), menu, barre strumenti, icone | tutti |
| Ferramenta | `app2e.js` | libreria schemi di foratura | CORE |
| CAD esteso | `app2f.js` | taglia, estendi, riduzione, quote, informazioni | TOPO |
| Ambienti e I/O | `app2d.js` | Supervisore, CAM, attrezzaggio, file, animazione, avvio | tutti |
| Shell desktop | `winapp22/app/main.js` | finestra Electron | Electron |

## Principi
- Il **modello è la fonte dei dati** (`job.ops`, `job.dims`, `job.panel`, `job.tools`); il canvas lo disegna soltanto.
- Coordinate: **pannello** (mm, origine in basso a sinistra, Y in alto) ≠ **schermo** (`sx/sy`) ≠ **macchina** (Y invertita sulla Kvara, `sideFlip` in `corrCode`).
- Le lavorazioni sono oggetti strutturati: foro, barriera, fresatura (pts + bulge + profondità per punto), tasca, rifilatura.
- Le quote sono annotazioni (`job.dims`) e **non** entrano nel part-program.
- Comunicazione macchina: **assente per scelta** (output solo su file).

## Struttura di build
`build.py` concatena `app2a,b,c,e,f,d` e incorpora CORE, GEOM, TOPO, Clipper in `cam-tech99l.html` e in `winapp22/app/index.html`; `electron-builder` produce `CAM-Tech-99L-<ver>-Setup.exe`.
