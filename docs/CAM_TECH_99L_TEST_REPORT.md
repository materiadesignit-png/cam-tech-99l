# CAM_TECH_99L_TEST_REPORT — v0.8.0 (23/10/2026)

| Suite | File | Risultato |
|---|---|---|
| Geometria (valori numerici noti) | `tests/topo.test.js` | **14 / 14 ok** |
| Golden master part-program vs `Sconto.PRG` originale | `tests/golden_prg.test.js` | **11 / 11 ok** |
| End-to-end CAD nel browser (Chromium) | `tests/e2e_cad.js` | **ok** — nessun errore JavaScript |
| Testo, svuotamento con isole, SVG path/archi/Bézier | `tests/shapes.test.js` | **7 / 7 ok** |
| End-to-end disegno col mouse, testo, SVG, simulazione, mobili, part-program | `tests/e2e_new.js` | **ok** — polilinea con arco b=1, arco 3p b=−1, cerchio 3p, 15 passate testo, 3 tracciati SVG, 7 pannelli, .PRG con 337 movimenti e RET, 0 errori di fattibilità |
| Risolutore vincoli (rettangolo da quadrilatero storto, parallele, perpendicolari, uguali, coincidenti, punto bloccato, conflitto) | `tests/sketch.test.js` | **7 / 7 ok** |
| Vincoli nell'interfaccia + trascinamento vertice + .PRG | `tests/e2e_cons.js` | **ok** — rettangolo 300 esatto, dopo il trascinamento resta 300 × 270 |
| Preselezione comandi | `tests/e2e_tip.js` | **ok** |
| iPad (emulazione touch) | `tests/ipad.js` | **ok** |
| Regressione Ferramenta (18 schemi) | `shotfer.js` | **ok** |
| Regressione icone barra strumenti | `shotic.js` | **ok** |
| Installazione silenziosa (Wine) | installer NSIS | **ok** (versione 0.4.3) |

## Dettaglio geometria
intersezione retta-retta (5;5) · retta-arco (0;10) · arco-arco (5;8,66) · taglia al centro / all'inizio / senza lame · taglia contorno chiuso (lunghezza residua 20) · taglia arco (lunghezza π·5) · estendi fine e inizio retta · estendi arco fino al semicerchio (bulge 1) · riduzione (3 punti tolti) · autointersezione rilevata / contorno pulito.

## Golden master
Intestazione, `;$$SS`, `;$$SE`, `G200` (escluse U V W), controsagome 0.00, 6 righe di lavorazione (`G142`, `G100`, 4×`G101`) **identiche** all'originale, `RET` finale.
Differenza nota: CAM Tech 99L aggiunge `G140` (annulla correzione) dopo la rifilatura; l'originale non lo ha. Codice previsto dal manuale Kvara, **da validare in aria**.

## End-to-end
Taglia tra due lame → restano 20-100 e 300-380 · Estendi fino al bordo x=300 · Quota X 200 tra due punti con osnap · Quote pannello · Annulla ripristina le quote · le quote non compaiono nel .PRG · Controllo geometria pulito.

## Non coperto da test automatici
Comandi CAD/CAM precedenti alla 0.6.0 (verificati a mano in sviluppo), trasmissione alla macchina (non presente), comportamento reale sul CN (solo prova in aria).
