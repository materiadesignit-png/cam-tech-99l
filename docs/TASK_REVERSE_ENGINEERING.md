# TASK_REVERSE_ENGINEERING

## Perimetro
- Fonte primaria: manuale `MAN.PDF` (ITA) e file dati reali del clone.
- Analisi statica limitata a: script di installazione, elenchi file, stringhe di testo dei binari Kvara.
- **Non fatto (scelta di progetto):** decompilazione del codice TASK, esecuzione di TASK, bypass della chiave Hardlock, copia di icone o grafica originale.

## Installazione TASK (VERIFIED)
- Archivi `TASK._01…_06` concatenati = `task._as`. Formato: archivio tipo ZIP con firma locale `AS 02 05` al posto di `PK 03 04`, compressione deflate (metodo 8). Verificato estraendo i primi 17 file.
- File individuati: `SUP.EXE` (Supervisore, PE32), `TASK.EXE`, `INCAD.DLL` (CAD integrato), `ASLIB.DLL`, `ASGLOBAL.DLL`, `ASDIMF/ASDIMV.DLL` (quote), `TASCHE.DLL`, `TASCHEF.DLL` (tasche), `P2PARTUT.DLL`, `CFGATR.DLL` (configurazione/attrezzaggio), `GDIR.DLL`, `TLS704D.DLL`, `CP30FWM.DLL`, `CTL3D.DLL`, `ACAD.TXT` (collegamento AutoCAD LT 97/98), cartella `P2CFG` (configurazioni `proc.pcs`, `kvara.pcs`).
- L'estrazione completa (help in linea, file messaggi `.msg`, utilità `asctask`, `player`) **non è stata completata**: l'operazione è stata bloccata dai controlli di sicurezza dell'ambiente. Serve l'autorizzazione del proprietario per proseguire (vedi UNKNOWN_BEHAVIORS.md).

## Architettura TASK ricostruita dal manuale (VERIFIED)
Tre ambienti: **SUPERVISORE** (archivio, macchina, utilità) → **CAD** integrato (o AutoCAD LT) → **CAM** (lavorazioni, ottimizzazione, part-program). Menu di selezione entità e menu Osnap come barre separate. Parametrica a formule. Interpolazione Z.

## Postprocessor Kvara (VERIFIED su file reali)
Vedi TASK_FILE_FORMATS.md. Il formato dei `.PRG` è stato ricostruito dai programmi presenti in `C:\Utente` e confrontato con test automatico (golden master `Sconto.PRG`).
