# CAM_TECH_99L_GAP_ANALYSIS

## Funzioni TASK mancanti (ordine di priorità proposto)
| Pri | Funzione | Motivo | Bloccata da |
|---|---|---|---|
| 1 | Parametrica (Imposta: Formule, cap. 13) | programmi a misura variabile, molto usata nei mobili | — |
| 2 | Stampa / Stampa quotata | documentazione per l'operatore | — (quote già presenti) |
| 3 | Testo e Simboli (fresatura scritte) | richiesto dal manuale | font a tratto singolo da definire |
| 4 | Ruota in Z, Interpolazione Z completa | lavorazioni in profondità | — |
| 5 | Lavorazioni: Calate | CAM | dettagli nel manuale 17.4.2 |
| 6 | Osnap a modo singolo, selezione precedente | ergonomia TASK | — |
| 7 | Imposta tagli (lama), Altezza svasatura | richiedono codici .PRG | **UNKNOWN**: servono programmi reali con lama/svasatura |
| 8 | Display Trasparente | vista | — |

## Richieste del master prompt oltre TASK (estensioni)
Layer e tipi di linea, spline, poligono, tratteggio, testo multilinea, serie polare, stiramento, command line testuale, tracciamento polare, albero progetto, associazione persistente geometria→operazione con ricalcolo, autosalvataggio/recupero, pannelli agganciabili. **Non presenti in TASK**: da fare dopo la parità con TASK, tenendole separate.

## Debito tecnico
- Le lavorazioni CAM coincidono con la geometria (come in TASK); manca la separazione geometria/operazione richiesta dal master prompt → refactoring importante, da pianificare.
- Archi G102/G103, fori orizzontali, barriere: formato dedotto, **da validare in aria** sulla macchina.
