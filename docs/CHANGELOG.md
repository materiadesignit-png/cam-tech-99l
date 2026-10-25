# CHANGELOG

## 0.9.0 — 23/10/2026 (solo Windows)
- Pagina LITECAD (solo Windows): avvio del programma LiteCAD, cartella di scambio DXF in Documenti\CAM Tech 99L\LiteCAD, avviso e import automatico dei DXF esportati da LiteCAD, invio del disegno corrente a LiteCAD. Script per compilare LiteCAD sul PC (richiede .NET 8 SDK).
- Lavorazioni di testa sui 4 lati: Display -> Faccia di lavoro e barra sinistra (facce 1-5); la Z del foro segue il cursore nello spessore e si aggancia a metà; barriere di fori di testa con due clic lungo il lato; diametro, profondità e passo dei fori di testa.
- Corretto: profondità predefinita dei fori di testa 22 mm (prima 30, oltre la lunghezza utile 25 delle punte orizzontali); diametro predefinito Ø8 come le punte orizzontali.
- Web/iPad e macOS restano alla 0.8.0.

## 0.8.0 — 23/10/2026
- Dal Draft editor di LiteCAD (fel88, licenza MIT), riscritti in JavaScript dentro la pagina CAD: vincoli geometrici orizzontale, verticale, parallele, perpendicolari, stessa lunghezza, quota guidante (lunghezza e distanza), punti coincidenti, punto fisso; simboli verdi/rossi; doppio clic sulla quota per cambiarla.
- Risolutore dei vincoli Levenberg-Marquardt (minima variazione del disegno), conflitti segnalati.
- Trascinamento dei vertici della fresatura selezionata con i vincoli che seguono.
- Approssima con cerchio; immagine di sfondo in scala per ricalcare.
- Corretto: l'elenco dei punti della fresatura nel pannello laterale era schiacciato a altezza zero.

## 0.7.0 — 23/10/2026
- CAD a mano sul foglio quadrettato: Linea/polilinea col mouse con tratti ad arco (tasto A), Arco 3 punti, Arco da centro, Cerchio 3 punti, con anteprima elastica, griglia e osnap.
- Foro di testa (orizzontale su fianco) e Import DXF/SVG in barra strumenti e nel menu File del Supervisore.
- Testo e insegne: lettere svuotate (isole rispettate), contorno, rilievo compensato, incisione a tratto singolo; 7 caratteri inclusi + caricamento di font TTF/OTF.
- Import SVG: tracciati, rettangoli, cerchi, ellissi, polilinee, curve di Bézier e archi, trasformazioni, unità mm/cm/in/px; fresatura in asse, interna, esterna o svuotamento.
- Simulazione: testa completa (10 mandrini verticali, 4 orizzontali, 2 lame, elettromandrino) con ingombro.
- MOBILI: base, pensile, colonna, libreria a variabili (L, H, P, spessori, giunzione spine/eccentrici/confirmat, ripiani, schiena, ante, cerniere); crea tutti i pannelli forati in archivio e la distinta CSV.

## 0.6.1 — 22/10/2026
- Preselezione comandi: passando col mouse su un pulsante o una voce di menu compare subito nome, tasto rapido, spiegazione e cosa va selezionato prima (anche nella riga di stato, come in Task).
- Preselezione entità: l'entità sotto il cursore si evidenzia tratteggiata con numero e descrizione prima del clic.

## 0.6.0 — 22/10/2026
- CAD: **Taglia** e **Estendi** (manuale 10.5.7-8), con lame/bordi evidenziati in viola.
- CAD: **Quote** X, Y, allineata, raggio, diametro, quote del pannello, cancella, vedi on/off (10.6.6).
- CAD: **Riduzione fresature** con tolleranza (10.7.3).
- CAD: Informazioni **Tratto fresatura**, **Fresatura intera**, **Controllo geometria**.
- Nuovo modulo geometrico `topo.js` (intersezioni retta/arco, sotto-percorsi, integrità).
- Corretto: un pannello nascosto (Ferramenta) poteva coprire l'area di disegno quando la pagina era aperta senza il contenitore dell'installer.
- Test automatici: geometria, golden master `Sconto.PRG`, end-to-end.
- Documentazione: inventario fonti, matrice di parità con TASK, formati, architettura, gap, comportamenti sconosciuti.

## 0.5.0 — Pagina FERRAMENTA (schemi di foratura da catalogo)
## 0.4.4 — Icone barra strumenti classiche / con nome / moderne
## 0.4.3 — Controsagome U V W sempre 0.00; installer universale Windows 7-11
