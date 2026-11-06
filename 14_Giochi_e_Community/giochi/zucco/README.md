# La fuga di Zucco

Il primo gioco del sito: un runner a tema Halloween, grafica 16 bit a 320×180. Zucco, un festaiolo adulto con la testa di zucca e una lanterna, scappa di notte da un cimitero, e la notte si fa sempre più nera. Il genere è quello del dinosauro di Chrome, ma personaggio, grafica e nome sono nostri, come chiede il [README della sezione](../../README.md).

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
| Punti | 1 ogni 12 px percorsi, 10 per caramella, 25 per ostacolo rotto. Tutti passano dal moltiplicatore |
| Luna piena | Con 20 caramelle, per 6 secondi: Zucco rompe tutto, più veloce, punti raddoppiati, e il buio sparisce |
| Moltiplicatore | Parte da ×1,00 e non scende mai sotto. +0,01 per ogni caramella presa, −0,10 per ogni caramella saltata, −0,30 per ogni vita persa. Vale per i punti che arrivano da quel momento: quelli già fatti restano |
| Tre lune di fila | Tre lune piene senza perdere vite: se manca una vita torna, con tutte le vite sono 1.000 punti, moltiplicati. Il conto riparte da zero dopo il premio o dopo un colpo |
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

### Il finale

Alla fine del decimo stage (200 secondi) gli ostacoli finiscono: mani e orda si ritirano, la musica si spegne e Zucco rallenta fino a camminare verso una casa con il cartello «Festa Halloween» e il logo GetInvolved. Si frena solo con l'ultimo ostacolo alle spalle, perché a passo d'uomo non si potrebbe più saltarlo. Davanti alla casa Zucco si ferma: silenzio, una prima scossa, poi il terremoto cresce a ondate per oltre tre secondi con sassi, polvere e luci che saltano. Al culmine la terra si ferma, la casa resta al buio e il Padrone delle Mani gli salta davanti, l'atterraggio spinge indietro Zucco e gli fa arrivare davanti una mazza da baseball. Zucco la prende, la visuale si allarga, compaiono due piattaforme e il gioco diventa un duello.

- Il boss ha 10 vite ed è circondato dalle sue mille mani. Una si protende alla quota giusta con il colpo in pugno e lo scaglia in linea retta: così si vede dove arriverà
- Solo i pipistrelli gli fanno male: arrivano all'altezza delle piattaforme e, colpiti con la mazza, tornano indietro ed esplodono su di lui
- Ossa, teschi e zucche marce si possono colpire, ma volano fuori con la scritta HOMERUUUNNN!!!. Un lancio che arriva addosso toglie una vita a Zucco
- Più vite perde il boss, più i lanci sono veloci e frequenti
- Battuto il boss la partita finisce con la vittoria: 5.000 punti, 1.000 per ogni vita rimasta e un premio se è stato rapido. Così anche chi vince resta in classifica
- Poi parte la cinematica (`src/cinematica.js`, 26 secondi, si salta con un tocco): Zucco entra in casa, l'orda sta ballando alla festa, al bancone ordina un negroni sbagliato allo scheletro barista, beve e augura buona festa mentre l'inquadratura si chiude su di lui. Si chiude con «GetInvolved ti augura un buon Halloween!». È solo racconto: il punteggio è già definitivo

Comandi: salto per salire, giù per scendere di un piano, tasto X o freccia destra per la mazza. Su telefono compare il tasto Mazza.

Per provare il finale senza giocare 200 secondi: aggiungere `?boss=1` all'indirizzo. Queste partite non salvano il record e il risultato resta segnato come prova.

### Mani nere e orda

Sono **solo grafica**: `sim.js` non le conosce, non tolgono vite e si fermano sempre prima di toccare Zucco. Vivono in `render.js`.

- **Mani:** dallo stage 5 escono da un muro d'ombra sul lato sinistro, 3 in più a ogni stage. Puntano tutte a Zucco, ma si allungano davvero solo quelle alla sua altezza: le esterne restano corte. Agitazione e voracità crescono a ogni stage. Con meno vite si avvicinano
- **Vista:** dallo stage 7 Zucco scorre 44 px in avanti sullo schermo. Si sposta solo il disegno: le regole restano uguali, ma si vedono gli ostacoli con meno anticipo
- **Orda:** dallo stage 7 alle spalle di Zucco corrono scheletri, zombie, lupi e diavoletti, con teschi infuocati, occhi e pipistrelli in aria. Fanno a gara a chi lo prende: scattano, si sorpassano, escono dal bordo sinistro e rientrano

## Struttura

| File | Cosa fa |
|---|---|
| `src/sim.js` | Regole del gioco. Niente DOM: gira anche in Node |
| `src/boss.js` | Regole del finale: la scena e il duello |
| `src/cinematica.js` | La scena dopo la vittoria |
| `src/render.js` | Disegna cielo, parallasse, sprite, mani, orda e HUD |
| `src/gioco.js` | `avviaGioco(elemento, { seme, alTermine, classifica })`: monta il gioco in qualunque pagina, restituisce la funzione per smontarlo |
| `src/classifica.js` | Il modulo per il nome e l'elenco dei migliori |
| `server/` | La classifica di prova: rigioca la partita e salva nome e punti |
| `src/effetti.js` | Tutti gli effetti pixelfx |
| `src/audio.js` | Musica ed effetti sonori, generati dal browser: nessun file audio |
| `src/sprite.js` | Carica gli sprite nel formato SpriteForge |
| `src/sprite-provvisori.js` | Sprite provvisori, disegnati in codice |

## Classifica di prova

Solo per questa versione: sul sito il nome verrà dal profilo. Quando una partita batte il record personale, quello salvato nel browser, il gioco chiede un nome. Da quel momento solo il tasto Rigioca rinuncia: un tocco sullo schermo non fa perdere il record. Il tasto con la corona mostra i primi dieci in qualunque momento, e chi sta più in basso vede comunque la sua posizione.

- Il server non si fida del punteggio: rigioca la partita con lo stesso `sim.js`, e 12 minuti di gioco costano una decina di millisecondi
- Vale il punteggio migliore di ogni nome, maiuscole e minuscole non contano. La stessa partita entra una volta sola
- Chiunque può usare un nome già preso, se fa più punti: senza profili non c'è modo di distinguerli
- I nomi non sono filtrati. Sono mostrati come testo, quindi non possono iniettare nulla, ma una parolaccia resta finché non la si toglie a mano
- `npm start` serve anche la classifica, con i dati in `.dati/classifica.json`
- Online è il container `classifica`: lo raggiunge solo nginx su `/api/classifica`, e se si ferma il gioco continua a funzionare senza classifica

I dati stanno nel volume `zucco_classifica` e restano anche dopo `docker compose up -d --build`. Per togliere un nome, dalla cartella del gioco sul server:

```sh
docker compose exec classifica node -e '
  const fs = require("fs"), f = process.env.FILE_CLASSIFICA;
  fs.writeFileSync(f, JSON.stringify(JSON.parse(fs.readFileSync(f)).filter((v) => v.nome !== "Nome da togliere")));
'
docker compose restart classifica
```

Per azzerarla: `docker compose exec classifica rm /dati/classifica.json`, poi lo stesso `restart`. Alzando `VERSIONE` le partite già in classifica restano, ma i punteggi con regole diverse non sono confrontabili: conviene azzerarla.

Per passare al sito: `avviaGioco` riceve una `classifica` con gli stessi `leggi` e `salva`, e il servizio `classifica` di `docker-compose.yml` si può togliere insieme alla cartella `server/`.

## Audio

Musica ed effetti nascono nel browser, quindi non ci sono file né licenze. Partono dal primo tocco su Gioca, perché i browser non fanno partire l'audio da soli. Si toglie con il tasto M o con la nota sul pannello.

La musica è un tema unico, nostro, arrangiato come una marcetta macabra che saltella (`suonaPassoCarnevale`): basso oom-pah, campane, xilofono e note che rimbalzano. A ogni stage accelera e si riempie; oltre il nono resta sull'ultima voce. In `src/audio.js` ci sono anche due arrangiamenti alternativi, limpido e cupo (`suonaPasso`), che il gioco oggi non usa.

Il duello ha un tema suo (`suonaPassoBoss`): lo stesso motivo della fuga, in re minore, su un basso che spinge a gruppi di tre, con organo e rintocchi di campana. Attacca appena Zucco prende la mazza e sparisce quando il boss muore. Segue le vite del boss: a 6 vite accelera e si sdoppia, a 3 sale di un semitono e la cassa raddoppia. Il cambio arriva sempre a fine frase, così non ci sono strappi.

Gli effetti durano meno di mezzo secondo e hanno un posto nello spazio: `luogo()` in `src/audio.js` li mette a destra o a sinistra di Zucco, e quello che è lontano arriva più piccolo, più sordo e con più riverbero. Si sente meglio in cuffia.

| Momento | Effetto |
|---|---|
| Salto, atterraggio, scivolata | Soffio, tonfo e strusciata di terra |
| Mano di zombie | Colpo secco di terra, con le zolle che ricadono |
| Demone | Il cerchio di rune si accende, poi schianto, terreno che cede e ringhio |
| Passaggi | Ostacoli, pipistrelli, fantasmi e ragni passano da destra a sinistra |
| Caramelle | Due note, che salgono se le prendi di fila |
| Colpo, ultimo colpo, ostacolo rotto | Esplosione, schianto di zucca, pietra che si spacca |
| Orda | Ringhi alle spalle, a sinistra, dallo stage 7 |

## Sprite: SpriteForge

Oggi tutti gli sprite sono provvisori, ma hanno già il formato JSON di [SpriteForge](https://spriteforge.tech/docs) (`palette`, `grid`, `frames`). Per sostituirne uno:

1. Salvare il risultato in `assets/sprite/<nome>.json`
2. Aggiungere il nome in `assets/sprite/elenco.json`, per esempio `["lapide", "fantasma"]`

Il codice non cambia: le collisioni non dipendono dalle misure del disegno. Gli sprite a terra poggiano sul suolo con il bordo inferiore. Il bordo chiaro degli ostacoli e quello rosso dell'orda si aggiungono da soli.

| Nome | Fotogrammi | Misure | Soggetto |
|---|---|---|---|
| `zucco_corsa` | 6 | 28×31 | Adulto con testa di zucca intagliata e illuminata, mantello viola, lanterna in mano, corre verso destra |
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
| `boss_volto` | 3 | 64×64 | Maschera nera cornuta con riflesso rosso: ferma, ruggito, colpita |
| `boss_mano` | 3 | 48×48 | Mano nera gigante: aperta, artiglio, pugno |
| `mazza` | 1 | 30×8 | Mazza da baseball di legno |
| `mazza_in_mano` | 4 | 60×60 | La mazza che ruota attorno alla mano |
| `piattaforma` | 1 | 60×9 | Lastra di pietra sospesa, con muschio |
| `lancio_osso` / `_teschio` / `_zucca` | 1 ciascuno | 16×8, 8×7, 14×13 | Quello che il boss lancia oltre ai pipistrelli |

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
| Boss | `impacts/ground-slam` all'atterraggio, `explosions/small-explosion` sui colpi, `shadow/dark-explosion` alla morte |
| Sfondo | `weather/fog`, `weather/shooting-stars` |

- La scia della luna piena è fatta in `effetti.js`, con la grafica di `status/haste`: ogni immagine sta dove Zucco è passato davvero, quindi se salta quelle dietro restano a terra
- `weather/falling-leaves` e `weather/fireflies` non si possono usare: dipingono uno sfondo pieno sopra la scena
- La polvere di salto e atterraggio è fatta a mano: pixelfx non ha niente di così piccolo
- Per aggiungere un effetto va aggiunta una riga anche alla mappa degli import in `index.html`

## Pubblicazione

Provvisoriamente il gioco sta su **https://zucco.getinvolvd.com**: un container di file statici sul server di ELEFIX, con l'etichetta di Caddy come le istanze, e accanto il piccolo container della classifica. Il tunnel manda già `*.getinvolvd.com` a Caddy, quindi su Cloudflare non serve fare nulla. Finché il container non gira, quell'indirizzo mostra ELEFIX.

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
- Il backend è in Python: per rigiocare serve un piccolo processo Node, oppure riscrivere `sim.js`. La classifica di prova fa già così, ma il seed lo sceglie ancora il browser
- Il rigioco smaschera i punteggi inventati, non i bot che giocano davvero: per quelli restano i controlli manuali sui primi in classifica
- Ogni modifica alle regole deve alzare `VERSIONE` in `sim.js`: le partite vecchie non si rigiocano con regole nuove
