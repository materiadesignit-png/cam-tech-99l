# ORIGINAL_SOURCE_INVENTORY

Fonti originali usate come riferimento. **Restano inalterate**: vengono solo lette (copie di lavoro nel container di sviluppo).

Cartella sul PC: `C:\Users\david\Desktop\VIRTUALIZZAZIONE HDD KVARA`

## 1. Clone disco macchina — `KWARA 95\`
| Percorso | Contenuto | Uso nel progetto |
|---|---|---|
| `Utente\*.PRG` (Sconto, SCONTCOLTELLI, ANTA PVC2MM, ANTA LAMINATO PVC2MM) | Part-program reali della macchina | Golden master del postprocessor |
| `Utente\Def.TLD`, `Def.TLD` | Attrezzaggio DEF (SP nn = TL nnn) | Import attrezzaggio |
| `Utente\Global.var` | Variabili ambiente (vuoto) | — |
| `Dati\*.par` (TOOLS, ExtTools, pheads, Supports, Coni, Cone, Table, Storepos, Fields, Axis…) | Configurazione macchina Kvara | Utensili, teste, offset, piani, magazzino |
| `Morbidelli\Plc\19902051.plc`, `PLCITA.ERR/.MSG` | Programma PLC e messaggi | Solo consultazione (magazzino, fine ciclo) |
| `Kvara\Exe`, `Kvara\Lib` | Software Kvara 30 (Win98) | Solo consultazione stringhe, nessuna esecuzione sull'host |
| `kvara.ini`, `STARTCN.RPT` | Configurazione e log avvio CN | Diagnosi (timeout CN) |

## 2. Installazione TASK — `SETUP\TASK\`
| Percorso | Contenuto |
|---|---|
| `TASK\DISK1..7` | Dischi di installazione TASK **5.2 p2**, SN 22010206, configurazione **T99LKVA [KV300V1]**, personalizzato Morbidelli, build A6090939 (18/09/2000) |
| `TASK\DISK1\PACKING.LST` | Script di installazione: dir `C:\TASK3`, gruppo programmi (Task, Service, Network Manager, CONVERT DOS-WIN, ASCTASK, ASCII-PGM, PGM-ASCII, Task Help) |
| `TASK\DISK1\KVARA.TXT` | Procedura import attrezzaggio Kvara (def.tld + file di `c:\dati`) |
| `TASK\DISK1\HARDLOCK.VXD` | Driver chiave hardware: **non usato, non aggirato** |
| `TASK\PDF\ITA\MAN.PDF` | Manuale d'uso TASK (italiano) — fonte principale dei requisiti |
| `TASK\Eval`, `TASK\DEMO` | Versioni dimostrative |
| `ACROBAT.32` | Acrobat Reader per il manuale |

## 3. Altro
| Percorso | Contenuto |
|---|---|
| `SETUP\LOCALW95`, `SETUP\ASETUP`, `SaveReg` | Ripristino Windows 95/98 del PC di bordo |

## Metodo
- Requisiti funzionali: dal manuale TASK (capitoli 4–19) → stato **VERIFIED** solo se descritti lì o osservati nei file.
- Formati: dai file reali del clone (`.PRG`, `.TLD`, `.par`).
- Binari TASK: estratti solo in parte per inventario (vedi TASK_REVERSE_ENGINEERING.md). Non eseguiti, non decompilati, chiave hardware non toccata.
