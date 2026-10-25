# TASK_FUNCTIONAL_PARITY_MATRIX

Origine requisito = paragrafo del manuale TASK 5 (ITA). Tutte le funzioni elencate sono **VERIFIED** come esistenti in TASK (descritte nel manuale).
Stato CAM Tech 99L (v0.8.0):
- **TESTED** = implementato e coperto da test automatico
- **IMPL** = implementato, verificato a mano in sviluppo, senza test automatico
- **PARZIALE** = implementato in parte (limite indicato)
- **NO** = non implementato
- **N/A** = non applicabile al PC moderno

## Supervisore (cap. 5)
| § | Funzione TASK | Stato | Comando / note |
|---|---|---|---|
| 5.1.1-5.1.5 | File: Nuovo, Apri, Chiudi, Lista disegni, Esci | IMPL | archivio disegni nel Supervisore |
| 5.2.1 | CAD integrato | IMPL | ambiente CAD |
| 5.2.2 | CAD AutoCAD (LT 97/98) | N/A | sostituito da Import/Export DXF |
| 5.3.1 | Macchina: CAM | IMPL | |
| 5.3.2 | Part-Program: visualizza, genera | IMPL | trasmissione alla macchina **disabilitata** (salvataggio .PRG su file) |
| 5.3.3 | Attrezzaggio: modifica, import da CN Kvara | IMPL | finestra "Modifica attrezzaggio", import Def.TLD + Dati\*.par |
| 5.3.4 | Configurazione | PARZIALE | sola visualizzazione T99LKVA |
| 5.3.5 | Macchina: Utilità (default velocità) | PARZIALE | Default comuni |
| 5.4.1 | Operazioni su archivio (copia, rinomina, cancella, commenti) | IMPL | |
| 5.4.2 | Default comuni | PARZIALE | velocità e giri; manca dimensione icone → ora in Opzioni icone |
| 5.4.3 | Configurazione digitizer | N/A | hardware non più esistente |
| 5.4.4 | Menu tecnico | NO | contenuto non documentato (password tecnico) |
| 5.5.2 | Import/Export DXF | IMPL | layer per profondità/utensile |
| 5.6 | Help: manuale, memoria, registrazione, informazioni | PARZIALE | solo Informazioni |

## CAD (cap. 10-14)
| § | Funzione TASK | Stato | Note |
|---|---|---|---|
| 10.1.1-2 | Salva, Salva come | IMPL | |
| 10.1.3 | Stampa | NO | |
| 10.1.4 | Stampa quotata | NO | le quote ora esistono (base per la stampa) |
| 10.1.5 | Preferenze | PARZIALE | griglia, osnap, icone |
| 10.1.6 | Import DXF | IMPL | |
| 10.2.1 | Zoom (precedente, finestra, meno, più, faccia, estensione, pan) | IMPL | |
| 10.2.2-3 | Faccia, Esploso | IMPL | |
| 10.2.4 | Trasparente | NO | |
| 10.3.1 | Fori: normale, barriera, orizzontali | IMPL | |
| 10.3.2 | Fresature: retta (2 modi), arco (3 modi), cerchio (2 modi), rettangolo, ellisse, segui (6 modi), forma per punti da file | IMPL | digitizer N/A |
| — | Disegno col mouse: linea/polilinea con archi, arco 3 punti, arco da centro, cerchio 3 punti | **TESTED** | estensione: in Task si usava il mouse con i comandi di input |
| 10.3.3 | Oggetti: scontornatura, tasche (3), canali, antina | IMPL | |
| 10.3.3.7 | Oggetti: Testo | **TESTED** | svuotato, contorno, rilievo, tratto singolo, font TTF/OTF |
| 10.3.3.8 | Oggetti: Simboli | NO | |
| 10.3.4 | Blocco: definisci, inserisci | IMPL | |
| 10.4.1-2 | Imposta: diametro, profondità | IMPL | |
| 10.4.3 | Imposta: Formule (parametrica, cap. 13) | NO | priorità alta |
| 10.4.4 | Interpolazione Z (cap. 14) | PARZIALE | profilo lineare e circolare su percorso; "Ruota in Z" no |
| 10.4.5 | Imposta tagli (lama) | NO | codici G della lama non ricostruiti → UNKNOWN |
| 10.4.6 | Altezza svasatura | NO | codifica svasatura nel .PRG UNKNOWN |
| 10.4.7 | Direzione globale | IMPL | |
| 10.5.1-6 | Cancella, copia, muovi, ruota, specchia, opponi | IMPL | |
| 10.5.7 | **Taglia** (lame) | **TESTED** | nuovo in 0.6.0 |
| 10.5.8 | **Estendi** | **TESTED** | nuovo in 0.6.0 |
| 10.5.9-12 | Scala, serie, pannello, entità | IMPL | |
| 10.6.1-5 | Cambio origine, raccordo, smusso, offset (Clipper), griglia | IMPL | |
| 10.6.6 | **Quote: imposta, vedi** | **TESTED** | X, Y, allineata, raggio, diametro, quote pannello, cancella |
| 10.6.7-9 | Distanza, annulla, ripristina | IMPL | undo multilivello |
| 10.7.1-2 | Taglia e cuci, auto unisci | IMPL | |
| 10.7.3 | **Riduzione fresature** | **TESTED** | tolleranza impostabile |
| 10.7.4 | Arrotonda | IMPL | |
| 10.7.5 | Ruota in Z | NO | |
| 10.9 | Informazioni: pannello, foro, **tratto fresatura**, **fresatura intera**, stato | TESTED/IMPL | tratto e fresatura intera nuovi |
| 11 | Selezione: finestra, crossing | IMPL | da sinistra = finestra, da destra = crossing |
| 11.2.3-4 | Selezione precedente, additiva/sottrattiva | PARZIALE | Maiusc/Ctrl per aggiungere/togliere; "precedente" no |
| 12 | Osnap: centro, finale, medio, vicino, intersezione, tangente, perpendicolare | PARZIALE | osnap automatico; da verificare tutti i 7 modi singolarmente |
| 13 | Parametrica (modalità matematica e a icone) | NO | |

## CAM (cap. 15-17)
| § | Funzione TASK | Stato | Note |
|---|---|---|---|
| 17.1 | File: salva, uscita, CAD | IMPL | |
| 17.3.1 | Seleziona configurazione | N/A | una sola configurazione (T99LKVA) |
| 17.3.2 | Seleziona / modifica attrezzaggio, Testa | IMPL | |
| 17.4.1 | Lavorazioni: Forature | IMPL | assegnazione automatica per diametro e faccia |
| 17.4.2 | Lavorazioni: Calate | NO | |
| 17.4.3 | Lavorazioni: Fresature (utensile, passate, velocità) | IMPL | |
| 17.4.4-5 | Ingresso, uscita | IMPL | retta / arco |
| 17.4.6-7 | Sequenze, inverti direzione | IMPL | |
| 17.5.1-2 | Ottimizza, deottimizza (semaforo) | IMPL | |
| 17.5.3 | Genera Part Program | **TESTED** | golden master Sconto.PRG |
| 17.5.4 | Origine programma | IMPL | controsagome sempre 0 |
| 17.5.5 | Animazione | IMPL | da dati percorso |
| 17.6.1 | Opzioni: visualizzazione | IMPL | |
| 17.7.1 | Informazioni: lavorazione | PARZIALE | pannello proprietà |

## Estensioni moderne (non presenti in TASK)
| Funzione | Stato |
|---|---|
| Import SVG | TESTED |
| Vincoli geometrici e quote guidanti (da LiteCAD) | TESTED |
| Trascinamento vertici con vincoli | TESTED |
| Immagine di sfondo per ricalco, Approssima con cerchio | IMPL |
| Mobili parametrici (cabinet) | TESTED (generazione pannelli e archivio) |
| Testa completa in simulazione | IMPL (corpi indicativi) |
| Libreria FERRAMENTA (cerniere, sistema 32, giunzioni, maniglie) | TESTED (generazione fori) |
| Controllo geometria (tratti nulli, autointersezioni, duplicati) | TESTED |
| Icone classiche / con nome / moderne | IMPL |
| Installer Windows 7-11 32/64 bit | IMPL |
