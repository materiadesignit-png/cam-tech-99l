# UNKNOWN_BEHAVIORS

| # | Comportamento | Perché è sconosciuto | Come chiuderlo |
|---|---|---|---|
| U1 | Codici .PRG di archi G102/G103 su questa macchina | nessun arco nei .PRG del clone | programma di prova in aria con un arco noto |
| U2 | Verso G141/G142 rispetto alla Y invertita della Kvara | un solo esempio (G142 su rifilatura) | prova in aria su un rettangolo interno |
| U3 | Numerazione facce dei fori orizzontali | dedotta da pheads.par | foro di prova su ogni faccia |
| U4 | Codifica di tagli con lama (Imposta tagli) | nessun esempio | serve un .PRG generato da TASK con lama |
| U5 | Codifica dell'altezza svasatura | nessun esempio | serve un .PRG TASK con foro svasato |
| U6 | Contatore pezzi della lista Kvara non incrementa | gestito dal Kvara/PLC, non dal .PRG | prova con programma originale TASK (vedi conversazione) |
| U7 | Magazzino cambio utensile richiesto a mano | Table.par: posizione 2 vuota; cono montato 0 | verifica attrezzaggio magazzino sul CN |
| U8 | Formato dei disegni TASK (.DRW?) | nessun disegno nel clone | fornire un disegno salvato da TASK |
| U9 | File di help e messaggi TASK (.hlp/.msg) | estrazione completa bloccata dai controlli di sicurezza dell'ambiente | autorizzazione del proprietario a estrarre gli archivi di installazione |
