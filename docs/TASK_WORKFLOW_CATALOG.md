# TASK_WORKFLOW_CATALOG

## W1 — Operazioni giornaliere (manuale 4.2.2, VERIFIED)
1. Supervisore → File: Nuovo (dimensioni pannello) o Apri da Lista disegni.
2. CAD: disegna fori e fresature, imposta diametri e profondità.
3. CAM: controlla le lavorazioni, Ottimizza (semaforo verde).
4. Genera Part Program → trasferimento al CN.
**CAM Tech 99L:** identico; il punto 4 salva il `.PRG` su file (chiavetta/floppy USB). Stato: IMPL.

## W2 — Operazioni preliminari (4.2.1, VERIFIED)
Selezione configurazione macchina, import attrezzaggio dal CN Kvara (def.tld + c:\dati), default comuni.
**CAM Tech 99L:** configurazione unica T99LKVA; import attrezzaggio IMPL.

## W3 — Import DXF (10.1.6, VERIFIED)
Layer → tipo di lavorazione e profondità. **CAM Tech 99L:** IMPL con regole sui nomi layer.

## W4 — Taglia / Estendi (10.5.7-8, VERIFIED)
Selezione lame (o bordi) → conferma → clic sulle entità, una alla volta → Esc.
**CAM Tech 99L:** selezionare prima le lame, poi il comando; lame evidenziate in viola. TESTED.

## W5 — Quotatura (10.6.6, VERIFIED)
Strumenti → Quote → Imposta: tipo X/Y/XY/raggio, clic sull'entità. Le quote non si cancellano col Cancella normale.
**CAM Tech 99L:** stesso comportamento (Cancella quota separato). TESTED.

## W6 — Ferramenta (estensione)
Ferramenta → schema → parametri → Inserisci nel disegno → CAD/CAM.
