# TASK_FILE_FORMATS

## Part-program Kvara `.PRG` (VERIFIED — 4 file reali del clone)
Testo ASCII/Latin-1, righe CRLF.
```
Programma in versione Iso :<NOME>
;$$SS
;$$SE
G200 X <L> Y <W> Z <T> E "<battuta> " T " <attrezzaggio> "  H 0 K 0  R 1 U <cU> V <cV> W <cW>;
[G250 P <piano> X <pos> A … B … C …]        ← piani/ventose (INFERRED da Fields/Supports.par)
<lavorazioni>
RET
```
| Codice | Significato | Stato |
|---|---|---|
| G200 | dimensioni pannello, battuta, attrezzaggio, controsagome U V W | VERIFIED |
| G100 X Y P F S T"n" | inizio foratura / discesa fresa | VERIFIED |
| G101 X Y [P] [F] | interpolazione lineare | VERIFIED |
| G102 / G103 X Y I J | arco orario / antiorario (centro I J) | INFERRED (manuale Kvara, nessun arco nei file del clone) |
| G141 / G142 / G140 | correzione raggio destra / sinistra / annulla | G142 VERIFIED; G141, G140 INFERRED |
| DX, DY | variabili macchina = dimensioni pannello | VERIFIED |
| G210 / G211 | barriere di fori in X / Y | INFERRED |
| RET | fine programma | VERIFIED |

**Controsagome U V W:** CAM Tech 99L le scrive sempre `0.00` (richiesta del proprietario: si impostano a bordo macchina). I file originali contengono `U 2.50 V 2.50 W 24.40` impostati a mano.

## Attrezzaggio `Def.TLD` (VERIFIED)
`SP  nn = TL nnn ` una riga per mandrino → utensile. Formato scrittura `SP %c%2.2d = TL %3.3d` (stringa in Attrezzaggio.dll).

## Configurazione `C:\Dati\*.par` (VERIFIED)
INI con sezioni numerate: `TOOLS.par` (utensili 1..n), `ExtTools.par` (utensili da magazzino), `pheads.par` (teste, facce, offset SOFX/SOFY/SOFZ), `Supports.par` (piani e ventose), `Coni.par` (coni → utensili), `Table.par` (contenuto ruota magazzino a 4 posizioni), `Storepos.par` (posizione magazzino).

## Disegni TASK
Formato proprietario dei disegni TASK: **UNKNOWN** (nessun disegno TASK presente nel clone). CAM Tech 99L usa un proprio progetto JSON e importa/esporta DXF.
