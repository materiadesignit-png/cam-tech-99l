# TASK_CAM_OPERATIONS
Vedi **TASK_FUNCTIONAL_PARITY_MATRIX.md, sezione CAM**. Lavorazioni supportate dal postprocessor Kvara di CAM Tech 99L:
| Lavorazione | Codici | Stato |
|---|---|---|
| Foratura verticale | G100 … T"n" | VERIFIED formato, IMPL |
| Foratura orizzontale facce 2-5 | G100 su faccia (G221-G225) | INFERRED — da provare in aria |
| Barriere | G210/G211 | INFERRED |
| Fresatura contorno con correzione | G141/G142, G101, G102/G103, G140 | G142+G101 VERIFIED; archi INFERRED |
| Rifilatura perimetro DX/DY | G142, G100, G101 X DX Y DY | **TESTED** (identica a Sconto.PRG) |
| Tasche | percorsi concentrici G101/G103 | IMPL |
| Taglio con lama | — | UNKNOWN (non generato) |
| Calate | — | NO |
