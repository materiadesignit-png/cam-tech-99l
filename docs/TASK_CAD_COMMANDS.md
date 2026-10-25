# TASK_CAD_COMMANDS
Elenco completo dei comandi CAD di TASK con stato di implementazione: vedi **TASK_FUNCTIONAL_PARITY_MATRIX.md, sezione CAD**.

## Comandi aggiunti in 0.6.0
| Comando | Menu | Modulo | Comportamento | Test |
|---|---|---|---|---|
| Taglia | Modifica | topo.js `trim`, app2f.js | elimina il tratto tra le due lame che racchiudono il clic; su contorno chiuso servono 2 tagli; su retta o arco | topo.test.js 4-6, e2e_cad.js |
| Estendi | Modifica | topo.js `extend` | allunga l'estremo più vicino al clic fino al primo bordo; rette e archi | topo.test.js 7-8, e2e_cad.js |
| Riduzione fresature | Percorso | topo.js `reduce` | toglie tratti < tolleranza, unisce rette allineate, archi piatti → rette | topo.test.js 9 |
| Quote: Imposta / Quote pannello / Cancella / Cancella tutte / Vedi | Strumenti → Quote | app2f.js | quote X, Y, allineata, raggio, diametro salvate nel progetto, non entrano nel .PRG | e2e_cad.js |
| Informazioni: Tratto fresatura, Fresatura intera | Informazioni | app2f.js | lunghezza, raggio, centro, angolo, area, ingombro | manuale |
| Controllo geometria | Informazioni | topo.js `check` | tratti nulli, autointersezioni, entità duplicate | topo.test.js 10 |
