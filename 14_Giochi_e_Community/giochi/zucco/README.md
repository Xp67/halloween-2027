# La fuga di Zucco

Il primo gioco del sito: un runner a tema Halloween, grafica 16 bit a 320×180. Zucco, un ragazzino con la testa di zucca e una lanterna, scappa di notte da un cimitero, e la notte si fa sempre più nera. Il genere è quello del dinosauro di Chrome, ma personaggio, grafica e nome sono nostri, come chiede il [README della sezione](../../README.md).

## Provarlo

```sh
npm install   # scarica pixelfx da GitHub
npm start     # http://localhost:5177
npm test      # logica di gioco, compresi i bot che misurano la durata delle partite
```

## Regole

| | |
|---|---|
| Comandi | Salto (tenere premuto per saltare più in alto), scivolata, in aria la scivolata fa scendere prima |
| Tastiera | Spazio, freccia su, W per saltare; freccia giù, S per scivolare; Esc o P per la pausa |
| Telefono | Tasti Salta e Scivola; toccare il gioco fa saltare |
| Vite | 3. Ogni colpo fa esplodere l'ostacolo e dà 1,5 secondi di invulnerabilità |
| Punti | 1 ogni 12 px percorsi, 10 per caramella, 25 per ostacolo rotto |
| Luna piena | Con 20 caramelle, per 6 secondi: Zucco rompe tutto, più veloce, punti raddoppiati, e il buio sparisce |
| Buio | Negli stage pari dal quarto: per circa 14 secondi si vede bene solo nel cerchio della lanterna |

## Stage

Ogni stage dura 20 secondi e va 32 px/s più veloce del precedente, senza limite: nessuna partita può durare per sempre. Al cambio c'è una tregua di 1,3 secondi senza ostacoli nuovi.

| Stage | Velocità | Ostacoli nuovi | Atmosfera |
|---|---|---|---|
| 1 | 135 | Lapidi, croci | Tramonto |
| 2 | 167 | Recinto, pipistrelli | Notte |
| 3 | 199 | Ragni, mani di zombie | Notte |
| 4 | 231 | Demone evocato, fantasmi | Luna di sangue, primo buio |
| 5 | 263 | Lapidi doppie, lapide con pipistrello sopra | Prime mani nere |
| 6 | 295 | Ragni doppi | Abisso |
| 7 | 327 | | La vista avanza, arriva l'orda |
| 8 e oltre | +32 | | L'orda cresce, le mani diventano più furiose |

Il fondo si scurisce di continuo fino allo stage 7, ma gli ostacoli no: hanno un bordo chiaro e lo sfondo non contiene mai sagome che sembrano ostacoli.

Con un bot che sbaglia come una persona la durata mediana è di circa 150 secondi, fino allo stage 8. Va confermata con persone vere: dallo stage 7 in poi si vede anche meno lontano.

### Mani nere e orda

Sono **solo grafica**: `sim.js` non le conosce, non tolgono vite e si fermano sempre prima di toccare Zucco. Vivono in `render.js`.

- **Mani:** dallo stage 5 escono da un muro d'ombra sul lato sinistro, 3 in più a ogni stage. Puntano tutte a Zucco, ma si allungano davvero solo quelle alla sua altezza: le esterne restano corte. Agitazione e voracità crescono a ogni stage. Con meno vite si avvicinano
- **Vista:** dallo stage 7 Zucco scorre 44 px in avanti sullo schermo. Si sposta solo il disegno: le regole restano uguali, ma si vedono gli ostacoli con meno anticipo
- **Orda:** dallo stage 7 alle spalle di Zucco corrono scheletri, zombie, lupi e diavoletti, con teschi infuocati, occhi e pipistrelli in aria. Fanno a gara a chi lo prende: scattano, si sorpassano, escono dal bordo sinistro e rientrano

## Struttura

| File | Cosa fa |
|---|---|
| `src/sim.js` | Regole del gioco. Niente DOM: gira anche in Node |
| `src/render.js` | Disegna cielo, parallasse, sprite, mani, orda e HUD |
| `src/gioco.js` | `avviaGioco(elemento, { seme, alTermine })`: monta il gioco in qualunque pagina, restituisce la funzione per smontarlo |
| `src/effetti.js` | Tutti gli effetti pixelfx |
| `src/sprite.js` | Carica gli sprite nel formato SpriteForge |
| `src/sprite-provvisori.js` | Sprite provvisori, disegnati in codice |

## Sprite: SpriteForge

Oggi tutti gli sprite sono provvisori, ma hanno già il formato JSON di [SpriteForge](https://spriteforge.tech/docs) (`palette`, `grid`, `frames`). Per sostituirne uno:

1. Salvare il risultato in `assets/sprite/<nome>.json`
2. Aggiungere il nome in `assets/sprite/elenco.json`, per esempio `["lapide", "fantasma"]`

Il codice non cambia: le collisioni non dipendono dalle misure del disegno. Gli sprite a terra poggiano sul suolo con il bordo inferiore. Il bordo chiaro degli ostacoli e quello rosso dell'orda si aggiungono da soli.

| Nome | Fotogrammi | Misure | Soggetto |
|---|---|---|---|
| `zucco_corsa` | 6 | 28×31 | Ragazzino con testa di zucca intagliata e illuminata, mantello viola, lanterna in mano, corre verso destra |
| `zucco_sale` / `zucco_scende` | 1 + 1 | 28×31 | Lo stesso, in salto: gambe raccolte / gambe distese |
| `zucco_scivola` | 2 | 32×19 | Lo stesso, in scivolata bassa, mantello all'indietro |
| `zucco_ko` | 1 | 14×13 | Solo la testa di zucca a terra, spenta |
| `vita` / `vita_persa` | 1 + 1 | 9×8 | Zucchetta accesa / zucchetta grigia spenta, per l'HUD |
| `lapide` | 1 | 17×23 | Lapide arrotondata, crepata, con muschio alla base |
| `croce` | 1 | 15×33 | Croce di pietra alta su un basamento |
| `recinto` | 1 | 38×20 | Tratto di cancellata di ferro arrugginita |
| `mano` | 1 | 14×26 | Mano di zombie verde con manica strappata, che esce da terra |
| `monticello` | 1 | 20×5 | Mucchietto di terra smossa |
| `pipistrello` | 4 | 22×10 | Pipistrello viola con occhi rossi, ciclo di volo |
| `fantasma` | 4 | 20×25 | Fantasma bianco azzurro, orlo ondulato |
| `ragno` | 2 | 14×7 | Ragno viola visto di fronte, zampe che si muovono |
| `caramella_rosa` / `_verde` / `_gialla` | 2 ciascuna | 13×9 | Caramella incartata, con un bagliore |
| `orda_scheletro` | 4 | 18×27 | Scheletro che corre verso destra, braccia protese |
| `orda_zombie` | 4 | 20×27 | Zombie che corre verso destra, braccia protese |
| `orda_lupo` | 4 | 31×20 | Lupo mannaro al galoppo verso destra, occhi rossi |
| `orda_diavoletto` | 4 | 19×20 | Diavoletto rosso con forcone, salta verso destra |

Gli ostacoli vanno tenuti chiari: quello che uccide deve leggersi sul fondo scuro. Il demone non è in elenco perché lo disegna pixelfx.

## Effetti: pixelfx

[pixelfx](https://github.com/patch-gg/pixelfx) (licenza MIT) è installato da GitHub. Il commit è fissato in `package-lock.json` e nel `Dockerfile`: se cambia, va aggiornato in tutti e due.

| Momento | Effetto |
|---|---|
| Caramella presa | `impacts/hit-spark` |
| Ostacolo rotto con la luna piena | `impacts/blunt-hit` |
| Colpo | `explosions/small-explosion`, attaccata al terreno: scivola dietro Zucco senza coprire la strada |
| Ultimo colpo | `explosions/cartoon-pow` con la scritta «AHI!» |
| Inizio luna piena | `arcane/mana-burst` in oro |
| Luna piena | `status/haste` con la sagoma di Zucco, solo la parte frontale |
| Demone | `spawn/summon-rise`, con il tempo sincronizzato su `sim.js` |
| Orda in volo | `critters/flying-skull`, `critters/eyeball`, `critters/bat` |
| Sfondo | `weather/fog`, `weather/shooting-stars` |

- La scia della luna piena è fatta in `effetti.js`, con la grafica di `status/haste`: ogni immagine sta dove Zucco è passato davvero, quindi se salta quelle dietro restano a terra
- `weather/falling-leaves` e `weather/fireflies` non si possono usare: dipingono uno sfondo pieno sopra la scena
- La polvere di salto e atterraggio è fatta a mano: pixelfx non ha niente di così piccolo
- Per aggiungere un effetto va aggiunta una riga anche alla mappa degli import in `index.html`

## Pubblicazione

Provvisoriamente il gioco sta su **https://zucco.getinvolvd.com**: un container di file statici sul server di ELEFIX, con l'etichetta di Caddy come le istanze. Il tunnel manda già `*.getinvolvd.com` a Caddy, quindi su Cloudflare non serve fare nulla. Finché il container non gira, quell'indirizzo mostra ELEFIX.

Prima volta, sul server:

```sh
sudo mkdir -p /opt/halloween-2027 && sudo chown $USER /opt/halloween-2027
git clone --branch feat/gioco-zucco https://github.com/Xp67/halloween-2027.git /opt/halloween-2027
cd /opt/halloween-2027/14_Giochi_e_Community/giochi/zucco
docker compose up -d --build
docker compose ps
```

Aggiornamento:

```sh
cd /opt/halloween-2027/14_Giochi_e_Community/giochi/zucco
git pull
docker compose up -d --build
```

Per toglierlo: `docker compose down`. Per cambiare nome: etichetta `caddy` in `docker-compose.yml`, senza usare il nome di un'istanza ELEFIX.

## Anti-imbroglio

La partita è deterministica: con lo stesso seed e gli stessi input il risultato è identico. `alTermine` riceve seed, input e punteggio, e `rigioca(seed, input)` rifà la partita da zero. Il server può quindi ricalcolare il punteggio invece di fidarsi del numero che arriva. Effetti, mani e orda non entrano nel calcolo.

- Il seed va dato dal server con la sessione di gioco, tramite l'opzione `seme` di `avviaGioco`
- Il backend è in Python: per rigiocare serve un piccolo processo Node, oppure riscrivere `sim.js`
- Il rigioco smaschera i punteggi inventati, non i bot che giocano davvero: per quelli restano i controlli manuali sui primi in classifica
- Ogni modifica alle regole deve alzare `VERSIONE` in `sim.js`: le partite vecchie non si rigiocano con regole nuove
