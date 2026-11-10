# La caramella solitaria — istruzioni per il costruttore

Rompicapo `caramella-solitaria` (scheda in `scheda.js`, da non modificare). Stanza: **Sala del tesoro**. Vale **5** caramelle dorate, una in meno ogni **3** errori (lo fa il kit).

Valgono le regole comuni (`../REGOLE_COMUNI.md`) e l'API del kit (`../comune/kit.js`). Qui c'è solo quello che è specifico di questo rompicapo. `index.html` è la copia di `../_esempio/index.html` con `<title>La caramella solitaria</title>`.

```js
const opzioni = {
  id: "caramella-solitaria",
  sfondo: "sala-del-tesoro",
  velo: 0.5,
  variante(rng) { ... },   // § 2
  crea(g) { ... },         // la prima riga imposta opzioni.testo (§ 2.5)
};
EscapeDemo.avvia(opzioni);
```

---

## 1. In breve

Sul tavolo del tesoro c'è una tavola a croce di velluto viola con 33 buche; in tutte tranne una c'è una caramella dorata. Il giocatore tocca (o trascina) una caramella e la fa saltare sopra una vicina, in orizzontale o in verticale, nella buca vuota subito dopo: quella scavalcata vola in bocca a Zucco, seduto su un forziere lì accanto. Si vince quando, dopo 31 salti, resta una sola caramella e sta nella **buca d'oro** (la buca incastonata in una piastra d'oro). «Annulla» torna indietro di un salto, gratis e quante volte si vuole; «Ricomincia» e i vicoli ciechi costano un errore.

---

## 2. Variante

### 2.1 Buche, nomi e indici

La tavola è la croce inglese: una griglia 7×7 senza i quattro angoli 2×2.

- `x` = colonna 0…6 da sinistra a destra, lettera `"abcdefg"[x]`;
- `y` = riga 0…6 **dall'alto** in basso; il numero nel nome è `7 − y` (riga 1 in basso, riga 7 in alto);
- `(x, y)` è una buca se `2 ≤ x ≤ 4` oppure `2 ≤ y ≤ 4`.

Il nome di una buca è lettera + numero: `(3, 3)` = **d4** (il centro), `(3, 0)` = d7 (in cima), `(0, 3)` = a4 (a sinistra), `(2, 6)` = c1.

L'**indice** delle buche (0…32) va per righe dall'alto, da sinistra a destra: 0 = c7, 1 = d7, 2 = e7, 3 = c6, 4 = d6, 5 = e6, 6…12 = a5…g5, 13…19 = a4…g4 (16 = d4), 20…26 = a3…g3, 27…29 = c2 d2 e2, 30…32 = c1 d1 e1. Serve per le chiavi dei vicoli ciechi (§ 3.5) e per l'ordine di `piene` in `statoGioco()`.

```js
const LETTERE = "abcdefg";
const BUCHE = []; // [x, y] in ordine di indice
for (let y = 0; y < 7; y++) for (let x = 0; x < 7; x++) if ((x >= 2 && x <= 4) || (y >= 2 && y <= 4)) BUCHE.push([x, y]);
const NOMI = BUCHE.map(([x, y]) => LETTERE[x] + (7 - y));   // NOMI[16] === "d4"
const IDX = new Map(NOMI.map((n, i) => [n, i]));
// La buca scavalcata da `da` ad `a`, oppure -1 se non sono a due buche in orizzontale o in verticale.
function mezzo(da, a) {
  const [x1, y1] = BUCHE[IDX.get(da)], [x2, y2] = BUCHE[IDX.get(a)];
  const dx = x2 - x1, dy = y2 - y1;
  if (!((Math.abs(dx) === 2 && dy === 0) || (Math.abs(dy) === 2 && dx === 0))) return -1;
  return IDX.get(LETTERE[x1 + dx / 2] + (7 - (y1 + dy / 2)));
}
```

### 2.2 Le 29 partenze verificate

La scheda dà 7 coppie (buca vuota all'inizio, buca dove deve finire l'ultima caramella), tutte risolvibili. Girando e specchiando la tavola (8 simmetrie) una partenza risolvibile resta risolvibile, e le 7 coppie diventano **29 coppie diverse**. Le ho risolte tutte con un risolutore (ricerca in profondità che ricorda le posizioni senza uscita, provata in avanti e al contrario): ognuna ha una soluzione da 31 salti, trovata in meno di 2 secondi.

L'elenco, **in questo ordine** (la verifica lo ricalcola dal seme, quindi ordine e formula vanno rispettati alla lettera):

```js
const ELENCO = [
  ["d4", "d4"], ["d7", "d1"], ["d1", "d7"], ["a4", "g4"], ["g4", "a4"], ["d7", "d4"], ["d1", "d4"], ["a4", "d4"],
  ["g4", "d4"], ["c7", "c4"], ["e7", "e4"], ["c1", "c4"], ["e1", "e4"], ["a5", "d5"], ["g5", "d5"], ["a3", "d3"],
  ["g3", "d3"], ["d6", "d3"], ["d2", "d5"], ["b4", "e4"], ["f4", "c4"], ["c5", "c5"], ["e5", "e5"], ["c3", "c3"],
  ["e3", "e3"], ["e4", "b4"], ["c4", "f4"], ["d3", "d6"], ["d5", "d2"],
];
```

Da quale coppia della scheda vengono: d4→d4 (la classica, 1 coppia); d7→d1 (4); d7→d4 (4); c7→c4 (8); d6→d3 (4); c5→c5 (4); e4→b4 (4).

### 2.3 Il generatore

Una sola chiamata a `rng`:

```js
variante(rng) {
  const [vuota, finale] = ELENCO[Math.floor(rng() * ELENCO.length)];
  return { vuota, finale };
}
```

Formato esatto: `{ vuota: "d5", finale: "d2" }` (due nomi di buca in minuscolo). Niente altro nella variante: la soluzione **non** ci va.

### 2.4 Esempi con la soluzione

Ogni salto è scritto `da-a`. Le soluzioni sono quelle del mio risolutore (ce ne sono molte altre): servono a provare la demo a mano o da console.

**Seme 12345** (quello delle foto di `prova.mjs`) e **seme 2027** (quello della partita della verifica): `{ vuota: "d5", finale: "d2" }`.

```
b5-d5 b3-b5 d3-b3 f3-d3 e1-e3 d3-f3 d1-d3 g3-e3 d3-f3 e5-e3 f3-d3 a3-c3 d3-b3 c1-c3 b3-d3 g4-e4
e7-e5 e4-e6 d4-b4 a4-c4 c7-c5 c4-c6 g5-e5 e5-e7 a5-c5 d5-b5 e7-c7 c7-c5 b5-d5 d6-d4 d4-d2
```

**Seme 7**: `{ vuota: "d4", finale: "d4" }` (la classica).

```
d6-d4 b5-d5 c7-c5 e7-c7 d5-b5 a5-c5 e5-e7 g5-e5 c4-c6 c7-c5 a4-c4 c4-c6 e4-c4 g4-e4 e4-e6 e7-e5
c3-c5 c6-c4 a3-c3 d3-b3 e2-e4 g3-e3 c1-c3 c4-c2 e1-c1 c1-c3 b3-d3 d3-f3 e5-e3 f3-d3 d2-d4
```

Altri semi: 1 → d2→d5; 2 → c5→c5; 3 → f4→c4; 42 → d6→d3; 12346 → c1→c4 (la foto del telefono in verticale).

### 2.5 Il testo della carta iniziale

Va adattato, perché la buca vuota e quella finale cambiano. In `crea(g)`, come prima riga, `opzioni.testo = testoCarta(g.variante, g.scheda.enigma);` (il kit legge `opzioni.testo` quando mostra la carta, cioè dopo `crea`). Le righe si separano con `\n` (il kit ne fa paragrafi).

```js
const REGOLE = "Puoi annullare i salti uno alla volta, gratis. Ricominciare da capo, o restare senza salti possibili prima di aver finito, conta come errore.";
function testoCarta(v, enigma) {
  if (v.vuota === "d4" && v.finale === "d4") return enigma + "\nLa buca centrale è quella d'oro. " + REGOLE;
  return "Sul tavolo del tesoro c'è una tavola a croce con 33 buche, e in tutte tranne una c'è una caramella dorata. " +
    "Una caramella può saltare sopra una vicina, in orizzontale o in verticale, e finire nella buca vuota subito dopo: " +
    "quella scavalcata si mangia. Mangia le caramelle finché ne resta una sola, e deve restare proprio nella buca d'oro" +
    (v.vuota === v.finale ? ", la stessa che all'inizio è vuota." : ".") + "\n" + REGOLE;
}
```

---

## 3. Regole e mosse

### 3.1 Lo stato

Scrivi la logica come funzione pura, senza disegno né kit: `applica(stato, mossa, variante) → { stato: nuovo, esito }`. La funzione `mossa(m)` della demo la chiama, aggiorna lo stato e **solo dopo** fa il resto (errore e vittoria del kit, fumetto, animazioni, memoria). La stessa `mossa(m)` la usano tocchi, trascinamenti, bottoni e `gioca`.

```js
stato = {
  piene: [/* 33 booleani, per indice */],
  salti: [["b5", "d5"], ...],   // i salti fatti, in ordine (servono per Annulla e per la memoria)
  vicoli: ["1101...", ...],     // le posizioni senza uscita già contate come errore (§ 3.5)
}
```

All'inizio: `piene[i] = NOMI[i] !== variante.vuota` (32 caramelle), `salti = []`, `vicoli = []`.

Due funzioni di comodo: `rimaste` = quante `piene` sono vere; una caramella in `i` **può saltare** se esiste una buca vuota `j` con `mezzo(NOMI[i], NOMI[j]) ≥ 0` e la buca di mezzo piena. La posizione è **senza uscita** se nessuna caramella può saltare.

### 3.2 Le mosse

`{ tipo: "salto", da: "b5", a: "d5" }` — controlli **in quest'ordine**; al primo che fallisce la mossa è rifiutata (non cambia niente e **non** è un errore) e l'esito è `{ valida: false, motivo }`:

| # | Controllo | `motivo` (è anche il testo del fumetto) |
|---|---|---|
| 1 | `da` e `a` sono nomi di buche (in `IDX`) | `Quella buca non esiste.` |
| 2 | in `da` c'è una caramella | `In quella buca non c'è nessuna caramella.` |
| 3 | `a` è vuota | `Si salta solo in una buca vuota.` |
| 4 | `mezzo(da, a) ≥ 0` | `Si salta di due buche, in orizzontale o in verticale.` |
| 5 | la buca di mezzo è piena | `Si salta solo sopra un'altra caramella.` |

Se passa: `piene[da] = false`, `piene[mezzo] = false`, `piene[a] = true`, si aggiunge `[da, a]` a `salti`. Poi, con `n = rimaste`:

1. `n === 1` e `piene[finale]` → **risolto**. Esito `{ valida: true, rimaste: 1, bloccato: false, errore: false, risolto: true }`.
2. altrimenti, se la posizione è senza uscita → **vicolo cieco** (vale anche con una sola caramella fuori dalla buca d'oro). Chiave = le 33 `piene` come stringa di `"1"`/`"0"` in ordine di indice. Se la chiave non è in `vicoli` la si aggiunge ed è un **errore**; se c'era già, niente errore (vedi § 3.5). Esito `{ valida: true, rimaste: n, bloccato: true, errore: <nuovo?>, risolto: false }`, più `motivo` quando `errore` è vero:
   - con `n > 1`: `motivo = "Nessun salto possibile: sei bloccato"`;
   - con `n === 1` (fuori dalla buca d'oro): `motivo = "L'ultima caramella non è nella buca d'oro"`.
3. altrimenti esito `{ valida: true, rimaste: n, bloccato: false, errore: false, risolto: false }`.

`{ tipo: "annulla" }` — se `salti` è vuoto: `{ valida: false, motivo: "Non c'è nessun salto da annullare." }`. Altrimenti toglie l'ultimo `[da, a]` da `salti` e rimette `piene[a] = false`, `piene[mezzo] = true`, `piene[da] = true`. Esito `{ valida: true, rimaste: n }`. **Mai un errore**, anche da un vicolo cieco, anche 31 volte di fila.

`{ tipo: "ricomincia" }` — se `salti` è vuoto: `{ valida: false, motivo: "Sei già all'inizio." }` (non è un errore). Altrimenti la tavola torna quella iniziale (`salti = []`, `vicoli` resta com'è) ed è **un errore**: esito `{ valida: true, errore: true, rimaste: 32, motivo: "Ricominciare da capo conta come errore" }`.

Qualsiasi altra cosa: `{ valida: false, motivo: "Mossa sconosciuta." }`.

### 3.3 Cosa fa `mossa(m)` dopo `applica`

- `esito.errore` vero → `g.errore(esito.motivo)`.
- `esito.risolto` → `g.risolto({ riepilogo: "Trentuno salti e trentuno caramelle mangiate: l'ultima è rimasta nella buca d'oro.", ritardo: 2000 })` subito (lo stato del kit cambia subito, la carta arriva dopo la festa nella scena).
- fumetto, contatori, animazioni come nei §§ 4 e 5;
- memoria (§ 3.6), dopo ogni mossa valida;
- ritorna l'esito così com'è (è quello che riceve `gioca`).

### 3.4 Errori (riassunto)

Contano come errore, come da scheda:

1. **Ricominciare da capo** con almeno un salto fatto (`g.errore("Ricominciare da capo conta come errore")`).
2. **Arrivare a una posizione senza salti con più di una caramella** (`g.errore("Nessun salto possibile: sei bloccato")`).
3. **Restare con una caramella sola fuori dalla buca d'oro** (`g.errore("L'ultima caramella non è nella buca d'oro")`): non ci sono più salti e non si è vinto, quindi è lo stesso caso del punto 2.

Non sono errori: le mosse rifiutate del § 3.2, «Annulla», toccare una caramella che non può saltare, ricaricare la pagina.

### 3.5 Lo stesso vicolo cieco non si paga due volte

Annullare è gratis, quindi chi arriva in un vicolo cieco torna indietro e prova un'altra strada. Se per sbaglio rifà lo stesso salto e rientra **nella stessa identica posizione**, non è un nuovo errore: la chiave è già in `vicoli`. Il fumetto lo dice (§ 4.4). Un vicolo cieco diverso, anche con lo stesso numero di caramelle, conta di nuovo.

### 3.6 Memoria e ripresa (niente ripartenza gratis ricaricando)

Dopo ogni mossa valida: `g.memoria.salti = stato.salti` (copia), `g.memoria.vicoli = stato.vicoli` (copia), `g.salvaMemoria()`.

In `crea(g)`, se `g.giaRisolto` è falso: si parte dallo stato iniziale; `vicoli` = le stringhe di `g.memoria.vicoli` che rispettano `/^[01]{33}$/`; poi si rigiocano i salti di `g.memoria.salti` uno per uno con `applica` e ci si ferma al primo non valido (memoria rovinata: si tiene quello che c'era di buono). Durante il ripristino **niente** `g.errore` e niente animazioni; se la posizione ripristinata è un vicolo cieco non ancora in `vicoli`, la sua chiave si aggiunge in silenzio.

Con `g.giaRisolto` vero lo stato da disegnare è quello finale: `piene` vera solo in `finale`, `salti` = `g.memoria.salti` se c'è (altrimenti `[]`).

### 3.7 Limiti

Nessun limite di salti o di tempo: la partita finisce solo vincendo. «Annulla» è illimitato.

---

## 4. Interfaccia

### 4.1 Tocchi (`g.tocca`)

Ogni buca ha come zona di tocco la sua **casella intera 18×18** (§ 5.2): `colonna = Math.floor((x − 97) / 18)`, `riga = Math.floor((y − 22) / 18)`; è una buca se `0 ≤ colonna, riga ≤ 6` e `(colonna, riga)` è nella croce. Stato dell'interfaccia (non è stato del rompicapo): `selezionata` (nome o `null`), e durante un tocco il punto di partenza e se è diventato un trascinamento.

| Evento | Dove | Cosa succede |
|---|---|---|
| `giu` | buca piena che **può saltare** | diventa `selezionata` (se lo era già, ricordatelo: al `su` senza trascinamento si deseleziona). Fumetto: «Ora tocca la buca vuota dove deve atterrare.» |
| `giu` | buca piena che non può saltare | `selezionata = null`. Fumetto: «Questa caramella ora non può saltare.» (non è un errore) |
| `giu` | buca vuota, con una `selezionata` | `mossa({ tipo: "salto", da: selezionata, a: buca })`. Se è rifiutata il fumetto mostra il `motivo` e la selezione resta. |
| `giu` | buca vuota, senza selezione | Fumetto: «Prima tocca una caramella.» |
| `giu` | fuori dalle buche | `selezionata = null` (fumetto invariato) |
| `muovi` con `premuto` | partito dalla caramella selezionata, a più di 4 pixel dal punto del `giu` | è un **trascinamento**: la caramella segue il dito (§ 5.7, punto 5) |
| `su` | dopo un trascinamento, su una buca diversa da quella di partenza | `mossa({ tipo: "salto", da: selezionata, a: buca })`; se è rifiutata, la caramella torna nella sua buca (150 ms), la selezione resta e il fumetto mostra il `motivo` |
| `su` | dopo un trascinamento, fuori dalle buche o sulla stessa buca | la caramella torna nella sua buca (150 ms), la selezione resta |
| `su` | senza trascinamento, sulla caramella che era già selezionata prima del `giu` | `selezionata = null` |

Gli eventi `muovi` senza `premuto` (il mouse che passa sopra) si ignorano. Dopo ogni salto riuscito `selezionata = null`. Un tocco nuovo mentre ci sono animazioni in corso le porta subito alla fine (§ 5.8).

### 4.2 Bottoni

Due, in quest'ordine:

```js
const btnAnnulla = g.bottone("Annulla", () => mossa({ tipo: "annulla" }), { id: "annulla" });
const btnRicomincia = g.bottone("Ricomincia", premiRicomincia, { id: "ricomincia" });
```

**Ricomincia chiede conferma**, perché costa un errore:

- se non c'è nessun salto: `mossa({ tipo: "ricomincia" })` (rifiutata, fumetto «Sei già all'inizio.»);
- primo tocco con almeno un salto: il bottone si **arma**, il suo testo diventa «Conferma» (cambia solo `textContent`: `data-azione` resta `ricomincia`), fumetto «Ricominciare costa un errore. Tocca ancora per confermare.»;
- secondo tocco entro 4 secondi: `mossa({ tipo: "ricomincia" })`;
- dopo 4 secondi, o a qualsiasi altra mossa o tocco sulla scena, si disarma e torna «Ricomincia».

`gioca({ tipo: "ricomincia" })` ricomincia subito, senza conferma (la conferma è solo dell'interfaccia).

### 4.3 Testo della carta

Vedi § 2.5.

### 4.4 Il fumetto (`g.messaggio`), testi esatti

`${n}` = caramelle rimaste, `${s}` = salti fatti.

| Quando | Testo |
|---|---|
| Apertura, partita nuova | `Tocca una caramella, poi la buca vuota dove deve atterrare.` |
| Apertura, partita ripresa dalla memoria (almeno un salto, non bloccata) | `Ripartiamo da dove eri rimasto: ${s} salti fatti.` |
| Apertura, partita ripresa in un vicolo cieco | `Sei ancora bloccato: «Annulla» torna indietro gratis.` |
| Apertura, già risolto | `L'ultima caramella è già nella buca d'oro.` |
| Caramella selezionata | `Ora tocca la buca vuota dove deve atterrare.` |
| Caramella che non può saltare | `Questa caramella ora non può saltare.` |
| Buca vuota toccata senza selezione | `Prima tocca una caramella.` |
| Salto rifiutato | il `motivo` del § 3.2 |
| Salto riuscito | `Gnam! Ne restano ${n}.` |
| Vicolo cieco nuovo, più caramelle | `Bloccato con ${n} caramelle. «Annulla» torna indietro gratis.` |
| Vicolo cieco nuovo, una caramella fuori posto | `Una sola caramella, ma non nella buca d'oro. Annulla e riprova.` |
| Vicolo cieco già contato | `Di nuovo questo vicolo cieco: non conta un altro errore.` |
| Vittoria | `L'ultima caramella è nella buca d'oro!` |
| Annulla riuscito | `Salto annullato. Ne restano ${n}.` |
| Annulla senza salti | `Non c'è nessun salto da annullare.` |
| Ricomincia armato | `Ricominciare costa un errore. Tocca ancora per confermare.` |
| Ricomincia fatto | `Si ricomincia: 32 caramelle al loro posto.` |
| Ricomincia senza salti | `Sei già all'inizio.` |

I testi di `g.errore` sono i `motivo` del § 3.2 (il kit ci aggiunge da sé l'avviso delle dorate).

---

## 5. Grafica

Scena 320×180, sfondo `sala-del-tesoro` con `velo: 0.5`. Lo sfondo ha al centro l'arco col tesoro, ai lati due stendardi rossi, due torce, due forzieri (x 57…92 e 227…262, coperchio a y 104) e due mucchi d'oro: la tavola copre il centro, Zucco sta sul forziere di sinistra, la targa dei salti è appesa a destra.

### 5.1 Colori

Solo `EscapeDemo.C` e `EscapeDemo.GEMME`, più tre colori già del kit o di Zucco, motivati:

- `ORO_FONDO = EscapeDemo.CARAMELLA.palette[6]` (`#8a5a10`) e `CREMA = EscapeDemo.CARAMELLA.palette[2]` (`#fff6c8`): l'ombra e il riflesso della caramella dorata del kit, perché i pezzi sono quella caramella;
- `ZUCCA_SCURA = "#9c3b17"`: l'arancio scuro della zucca di Zucco (è anche `--kit-arancio-scuro` di `kit.css`), senza il quale la testa perde il volume.

### 5.2 Disposizione (coordinate della scena)

| Cosa | Dove |
|---|---|
| Caselle della tavola | casella `(x, y)` con angolo in alto a sinistra `(97 + 18·x, 22 + 18·y)`, 18×18; la croce di caselle va da x 97 a 222 e da y 22 a 147, centrata su x 159,5 |
| Tavola (croce con cornice) | unione dei rettangoli V = x 129…190, y 18…151 e H = x 93…226, y 54…115 (estremi compresi) |
| Ombra della tavola | 3 pixel in basso a destra (fino a y 154, sotto la barra) |
| Buca | sprite 12×12 a casella + (3, 3) |
| Piastra d'oro (solo la buca `finale`) | sprite 16×16 a casella + (1, 1), sotto la buca |
| Caramella nella buca | sprite 16×8 a casella + (1, 5) |
| Caramella selezionata | casella + (1, 3) (sollevata di 2) |
| Segno «puoi atterrare qui» | sprite 6×6 a casella + (6, 6) |
| Centro di una buca (`posizione`) | casella + (9, 9), cioè `x = 106 + 18·colonna`, `y = 31 + 18·riga` |
| Zucco | gambe a (66, 99), mantello a (66, 88), testa a (67, 77); i piedi poggiano sul coperchio del forziere (y 104) |
| Bocca di Zucco (arrivo delle caramelle mangiate) | lo sprite della caramella in volo finisce con l'angolo in (66, 82) |
| Scritta sopra Zucco (`GNAM!`, `UFF!`, `EVVIVA!`; non è il fumetto del kit) | testo 3×5 centrato su x 74, y 70 |
| Targa dei salti | x 238…309, y 20…71 (72×52), con due catenelle a x 248 e x 299 da y 16 a 19 |
| Luccichii ambiente | otto punti sui mucchi d'oro e sui forzieri (§ 5.7) |

Tutto sta dentro l'area di gioco (x 4…316, y 18…152) tranne le catenelle e l'ombra, che sono decorazioni.

### 5.3 La tavola (disegnata una volta sola)

Disegna la tavola, le buche e la piastra d'oro **una volta sola** su una tela fuori schermo 320×180 (`document.createElement("canvas")`, `imageSmoothingEnabled = false`) e a ogni fotogramma copiala su `g.ctx` con `ctx.drawImage(tavola, 0, 0)`: stessa misura, non è un ridimensionamento. La piastra si conosce dalla variante, quindi è statica anche lei.

La cornice si fa pixel per pixel con la **profondità** dentro la croce (distanza dal bordo esterno), che dà gli angoli giusti anche negli spigoli interni:

```js
const V = { x1: 129, y1: 18, x2: 190, y2: 151 }, H = { x1: 93, y1: 54, x2: 226, y2: 115 };
const dentro = (r, x, y) => (x < r.x1 || x > r.x2 || y < r.y1 || y > r.y2 ? -1 : Math.min(x - r.x1, r.x2 - x, y - r.y1, r.y2 - y));
const prof = (x, y) => Math.max(dentro(V, x, y), dentro(H, x, y));   // -1 = fuori dalla tavola
```

1. **Ombra**: per ogni pixel con `prof ≥ 0` e `(x + y)` pari, un pixel `C.nero` in `(x + 3, y + 3)`. Prima della tavola.
2. **Tavola**: per ogni pixel con `d = prof(x, y) ≥ 0`, `luce = prof(x, y − 1) < d || prof(x − 1, y) < d` (lato in alto o a sinistra del suo anello):

   | `d` | colore |
   |---|---|
   | 0 | `C.bordo` |
   | 1 | `luce ? C.giallo : C.oroScuro` |
   | 2 | `luce ? C.oro : ORO_FONDO` |
   | 3 | `C.bordo` (la scanalatura fra oro e velluto) |
   | 4 | `luce ? C.viola : C.violaScuro` |
   | ≥ 5 | `C.violaScuro` (il velluto) |

3. **Borchie** del velluto: per `q, r` da 0 a 5, se le quattro caselle `(q, r)`, `(q+1, r)`, `(q, r+1)`, `(q+1, r+1)` sono tutte buche, in `sx = 97 + 18·(q+1) − 1`, `sy = 22 + 18·(r+1) − 1`: un 2×2 `C.oroScuro`, il pixel `(sx, sy)` `C.giallo`, e due pixel d'ombra `C.bordo` in `(sx+1, sy+2)` e `(sx+2, sy+1)`.
4. **Piastra d'oro** sotto la buca `finale`, poi **le 33 buche**.

Tieni da parte l'elenco dei pixel con `d` = 1 e 2 (circa mille): servono per i lampi della cornice (§ 5.8).

### 5.4 Gli sprite della tavola

Si disegnano con `EscapeDemo.sprite(ctx, righe, colori, x, y)`.

**Buca** 12×12 — `k` `C.bordo`, `n` `C.nero`, `v` `C.viola` (la parete in fondo, che prende la luce):

```
...kkkkkk...
.kknnnnnnkk.
.knnnnnnnnk.
knnnnnnnnnnk
knnnnnnnnnnk
knnnnnnnnnvk
knnnnnnnnnvk
knnnnnnnnnvk
knnnnnnnnvvk
.knnnnnnvvk.
.kkvvvvvvkk.
...kkkkkk...
```

**Piastra d'oro** 16×16 — `k` `C.bordo`, `w` `C.bianco`, `h` `C.giallo`, `y` `C.oro`, `o` `C.oroScuro`, `b` `ORO_FONDO`. La buca ci va sopra a +2, +2: della piastra resta una cornice d'oro di 2 pixel, ben visibile anche con la caramella dentro.

```
..kkkkkkkkkkkk..
.kwhhhhhhhhhhyk.
kwhyyyyyyyyyyyok
khyyyyyyyyyyyyok
khyyyyyyyyyyyyok
khyyyyyyyyyyyyok
khyyyyyyyyyyyyok
khyyyyyyyyyyyyok
khyyyyyyyyyyyyok
khyyyyyyyyyyyyok
khyyyyyyyyyyyyok
khyyyyyyyyyyyyok
khyyyyyyyyyyyyok
kyoooooooooooobk
.kobbbbbbbbbbbk.
..kkkkkkkkkkkk..
```

**Caramella** (il pezzo) 16×8 — corpo tondo e due incarti più bassi del corpo, luce in alto a sinistra. Colori normali: `k` `C.bordo`, `W` `C.bianco`, `w` `CREMA`, `h` `C.giallo`, `y` `C.oro`, `o` `C.oroScuro`, `b` `ORO_FONDO`.

```
......kkkk......
.kk..khhyyk..kk.
kwokkhWhyyykkoyk
khookhhyyyokooyk
kyookyyyyookoook
kyokkyyyoobkkobk
.kk..koobbk..kk.
......kkkk......
```

Varianti di colore dello stesso sprite:

- **selezionata** (e trascinata): `k` = `C.giallo` nei fotogrammi con `g.fotogramma % 4 < 2`, `C.bianco` negli altri (con `g.riduciMovimento` sempre `C.giallo`);
- **spenta** (vicolo cieco): `k` `C.bordo`, `W` e `w` `C.pietraChiara`, `h` `C.pietra`, `y` `C.ferroChiaro`, `o` e `b` `C.ferro`.

**Segno «puoi atterrare qui»** 6×6, nelle buche vuote dove la caramella selezionata può saltare — `a` `GEMME.acquamarina[0]`, `A` `C.acqua`, `W` `GEMME.acquamarina[2]`. Pulsa: `ROMBO` nei fotogrammi `g.fotogramma % 8 < 4`, `ROMBO_PICCOLO` negli altri (con `g.riduciMovimento` sempre `ROMBO`).

```
ROMBO      ROMBO_PICCOLO
..aa..     ......
.aAAa.     ..aa..
aAWWAa     .aWWa.
aAWWAa     .aWWa.
.aAAa.     ..aa..
..aa..     ......
```

**Stelline** (luccichii e festa) 5×5 — `W` `C.bianco`, `h` `C.giallo`:

```
STELLA     STELLINA
..h..      .....
..W..      ..h..
hWWWh      .hWh.
..W..      ..h..
..h..      .....
```

### 5.5 Zucco

Zucco sta in piedi sul coperchio del forziere di sinistra, girato verso la tavola, e si mangia le caramelle scavalcate. Tre pezzi, disegnati in quest'ordine: gambe, mantello, testa (la testa copre il colletto).

Colori: `k` `C.bordo`, `o` `ZUCCA_SCURA`, `O` `C.brace`, `y` `C.fiamma`, `h` `C.fiammaChiara`, `b` `C.legnoScuro`, `G` `C.erbaScura`, `g` `C.erba`, `E` `C.oro`, `e` `C.luna` (la luce della candela dentro la zucca), `q` `C.lilla`, `p` `C.viola`, `P` `C.violaScuro`, `B` `C.ferro`, `L` `C.ferroChiaro`, `R` `C.legno`, `T` `C.legnoChiaro`.

**Testa** 14×13, a (67, 77 + dy):

```
......Gg......
.....GGg......
..kkkkkkkkkk..
.koOOyyyOOOok.
koOOyyhyyOOOok
koOyEEyyOEEOok
koOEeeEyOEeeEk
koOOEEOOEOEEOk
koOOOOOEEOOOOk
koObEbEbEbEbOk
kooOeEeEeEeOok
.kooOOOOOOOok.
..kkkkkkkkkk..
```

Facce: si sostituiscono alcune righe della testa (il numero è la riga, da 0).

| Faccia | Righe sostituite |
|---|---|
| `normale` | nessuna |
| `aperta` (arriva una caramella, mastica) | 8 `koOOEbEbEbOOOk` · 9 `koOEeeeeeeEOOk` · 10 `kooEeeeeeeEOok` · 11 `.kooOEbEbEOok.` |
| `triste` (vicolo cieco, restituisce caramelle) | 5 `koOyOOyyOOOOok` · 8 `koOOOOOOOOOOOk` · 9 `koOOObEbEbOOOk` · 10 `kooOEOOOOOEOok` |
| `felice` (vittoria, già risolto) | 5 `koOyOOyyOOOOok` · 6 `koOEOOEyOEOOEk` · 7 `koOOOOOOOOOOOk` · 8 `koOOEbEbEbOOOk` · 9 `koOEeeeeeeEOOk` · 10 `kooEeeeeeeEOok` · 11 `.kooOEbEbEOok.` |

**Mantello** 16×11, a (66, 88 + dy):

```
...kkkkkkkkkk...
..kqqpppppppPk..
.kqqpppppppppPk.
.kqppppppppppPk.
kqqppppppppppPPk
kqpppppppppppPPk
kqppppppkppppPPk
kqppppppkpppPPPk
kqpppppkkppPPPPk
.kpppppk.kpPPPk.
.kkkkkk...kkkk..
```

**Gambe** 16×5, a (66, 99) (non si muovono col respiro):

```
.....kBk.kLk....
.....kBk.kLk....
.....kBk.kLk....
....kRRk.kTTk...
....kkkk.kkkk...
```

Animazioni di Zucco (a 8 fps, con `g.fotogramma`):

- **respiro**: `dy = 1` nei fotogrammi `g.fotogramma % 8 ≥ 4`, altrimenti 0 (testa e mantello);
- **candela**: nei fotogrammi con `g.fotogramma % 6 === 0` o `g.fotogramma % 13 === 0` la lettera `e` vale `C.fiammaChiara` invece di `C.luna` (la luce dentro la zucca tremola);
- **mangia**: faccia `aperta` mentre una caramella vola verso di lui; all'arrivo mastica per 4 fotogrammi (alterna `normale` e `aperta` a ogni fotogramma) e sopra la testa compare `GNAM!` (§ 5.2) per 500 ms, che sale di 1 pixel ogni 2 fotogrammi (da y 70 a y 66);
- **triste** finché la tavola è in un vicolo cieco, e per 500 ms quando restituisce caramelle (Annulla, Ricomincia); all'inizio del vicolo cieco sopra la testa compare `UFF!` per 800 ms;
- **felice** dalla vittoria in poi; durante la festa (1,5 s) salta: tutto Zucco, gambe comprese, sale di 3 pixel nei fotogrammi `g.fotogramma % 4 < 2`, e sopra la testa c'è `EVVIVA!`.

Le scritte sopra Zucco: `EscapeDemo.testo(ctx, testo, 74, y, { piccolo: true, colore: C.fiammaChiara, allinea: "centro" })` (l'ombra `C.bordo` la mette già il kit).

Con `g.riduciMovimento`: niente respiro, candela fissa, niente salti; le facce cambiano lo stesso (sono stati, non movimenti) e le scritte compaiono ferme.

### 5.6 La targa dei salti

Tavola di legno con cornice d'oro, appesa a destra davanti allo stendardo: x 238…309, y 20…71. Si disegna pixel per pixel come la tavola grande, con `d = min(x − 238, 309 − x, y − 20, 71 − y)` e `luce = (x − 238 === d) || (y − 20 === d)`: `d` 0 `C.bordo`; 1 `luce ? C.giallo : C.oroScuro`; 2 `luce ? C.oro : ORO_FONDO`; 3 `C.bordo`; da 4 in su `C.legno`, con le venature: se `(y − 20) % 5 === 0` e `(x·7 + y) % 11 > 2` il pixel è `C.legnoScuro`. Si può mettere anche lei nella tela fuori schermo. Le catenelle: a x 248 e x 299, da y 16 a 19, un pixel per riga, `C.ferroChiaro` nelle righe pari e `C.ferro` nelle dispari.

Scritte (tutte con `allinea: "centro"` su x 274):

| y | testo | stile |
|---|---|---|
| 26 | `SALTI` | `piccolo`, `C.fiammaChiara` |
| 34 | `${s}/31` | `scala: 2`, `C.oro` (ombra del kit) |
| 52 | `RESTANO ${n}` | `piccolo`, `C.pietraChiara` |
| 60 | `BLOCCATO!` in un vicolo cieco con più caramelle · `SBAGLIATA!` con una sola caramella fuori posto · `PERFETTO!` risolto · niente altrimenti | 5×7, `C.tappetoChiaro` (i primi due), `C.giallo` (l'ultimo) |

Il numero cambia nello stesso fotogramma della mossa.

### 5.7 Disegno di ogni fotogramma

In `g.anima`, su `g.ctx` (pulito con `clearRect` all'inizio):

1. la tela della tavola (e della targa);
2. il **lampo** della cornice, se attivo: i pixel con `d` = 1 e 2 ridisegnati coi colori del lampo (§ 5.8);
3. i **segni** nelle buche dove la `selezionata` può atterrare (si calcolano dallo stato a ogni fotogramma);
4. le **caramelle** nelle buche piene, tranne la selezionata, quella che salta e quelle che stanno ancora volando verso la loro buca; spente se il vicolo cieco è già partito (§ 5.8);
5. la caramella **selezionata** sollevata, oppure quella **trascinata**: angolo in `(Math.round(px) − 8, Math.round(py) − 4)`, dove `px, py` è il dito;
6. la caramella **che salta** (§ 5.8);
7. le caramelle **in volo** fra la tavola e Zucco;
8. **Zucco** (così le caramelle che arrivano spariscono dietro la sua testa, come se le ingoiasse) e la sua scritta;
9. le scritte della **targa**;
10. i **luccichii**:
    - ambiente, otto punti (angolo in alto a sinistra dello sprite 5×5), con fase `φ = i · 5` (`i` = 0…7 nell'ordine dell'elenco): sinistra (12, 114), (24, 106), (40, 120), (84, 110); destra (234, 110), (268, 118), (290, 106), (306, 116). Con `k = (g.fotogramma + φ) % 24`: `k` 0 e 3 → `STELLINA`, `k` 1 e 2 → `STELLA`, altrimenti niente;
    - sulla piastra d'oro, sempre (anche vuota): con `k = g.fotogramma % 20`, `k` 0 e 2 → `STELLINA`, `k` 1 → `STELLA`, in casella + (14, −2);
    - con `g.riduciMovimento` niente luccichii.

Tutte le posizioni a coordinate intere (`Math.round` sui valori interpolati).

### 5.8 Animazioni delle mosse

Ogni animazione ha un istante di partenza (`g.tempo`) e una durata; **lo stato cambia subito**, l'animazione mostra solo il passaggio. Una mossa o un tocco nuovo porta subito alla fine tutte le animazioni in corso. Con `g.riduciMovimento` niente animazioni: si disegna direttamente lo stato finale (e gli effetti fissi: caramelle spente, scritte, facce).

`p` = avanzamento da 0 a 1; `lerp(a, b, p) = a + (b − a)·p`.

- **Salto** (220 ms): la caramella va dalla posizione della buca `da` a quella della buca `a` (angolo casella + (1, 5)), `x = lerp`, `y = lerp − Math.round(6·Math.sin(π·p))`. Se il salto arriva da un trascinamento non c'è il volo: la caramella è già sopra la buca e ci si posa subito.
- **Caramella mangiata** (320 ms, parte insieme al salto): dalla sua buca a (66, 82), `x = lerp`, `y = lerp − Math.round(18·Math.sin(π·p))`. Zucco ha la faccia `aperta`; all'arrivo mastica e dice `GNAM!` (§ 5.5).
- **Annulla**: la caramella salta all'indietro da `a` a `da` (220 ms, stessa formula) e quella mangiata torna da Zucco alla sua buca (320 ms, stessa curva al contrario); Zucco `triste` per 500 ms. Finché non arriva, la buca di destinazione si disegna vuota.
- **Ricomincia**: tutte le caramelle che tornano (le buche piene adesso e vuote prima) volano da (66, 82) alla loro buca, una dopo l'altra in ordine di indice, ognuna 320 ms e partenze sfalsate di 25 ms; ogni buca resta vuota finché la sua caramella non arriva. Zucco `triste` per 500 ms.
- **Vicolo cieco** (parte 350 ms dopo la mossa, quando il salto è finito): lampo **rosso** della cornice per 4 fotogrammi (`d` 1 → `C.tappetoChiaro`, `d` 2 → `C.tappeto`); le caramelle rimaste tremano di un pixel a destra e a sinistra per 4 fotogrammi, poi restano **spente** finché si è bloccati; Zucco `triste` e `UFF!`; sulla targa `BLOCCATO!` o `SBAGLIATA!`. Con «Annulla» tutto torna normale.
- **Vittoria** (parte 350 ms dopo l'ultimo salto, dura 1,5 s): la cornice lampeggia d'oro (`d` 1 → `C.bianco`, `d` 2 → `C.giallo`, nei fotogrammi `g.fotogramma % 4 < 2`); attorno alla piastra d'oro compaiono quattro stelle, agli angoli casella + (−4, −4), (17, −4), (−4, 17), (17, 17), una ogni 2 fotogrammi in quest'ordine, e ognuna alterna `STELLA` e `STELLINA` ogni 2 fotogrammi; Zucco salta, `felice`, con `EVVIVA!`; la targa dice `31/31`, `RESTANO 1`, `PERFETTO!`. Dopo la festa resta lo stato finale: l'ultima caramella sulla piastra, cornice normale, Zucco `felice` fermo, il luccichio della piastra.
- **Partita ripresa in un vicolo cieco** (all'apertura, dalla memoria): caramelle già spente, Zucco `triste`, `BLOCCATO!` o `SBAGLIATA!` sulla targa, senza lampo né tremito né `UFF!`.
- **Già risolto** (`g.giaRisolto`): lo stato finale come dopo la festa, senza festa. Il kit blocca l'input.

### 5.9 Stati visivi, riassunto

| Stato | Come si vede |
|---|---|
| Normale | caramelle d'oro nelle buche, piastra d'oro con luccichio, Zucco che respira, targa `SALTI s/31` e `RESTANO n` |
| Selezionata | caramella sollevata di 2 pixel con contorno giallo/bianco che lampeggia; segni acquamarina nelle buche dove può atterrare |
| Trascinata | la caramella segue il dito con il contorno della selezione; i segni restano |
| Sbagliato (vicolo cieco) | lampo rosso, caramelle che tremano e poi restano grigie, Zucco triste con `UFF!`, `BLOCCATO!`/`SBAGLIATA!` sulla targa; in più l'avviso e la scossa del kit |
| Risolto | cornice che lampeggia d'oro, stelle attorno alla piastra, Zucco che salta con `EVVIVA!`, `PERFETTO!` sulla targa, poi la carta del kit |

---

## 6. Aggancio per le prove

```js
g.espone({
  gioca: (m) => mossa(m),          // la stessa funzione di tocchi e bottoni
  statoGioco: () => ({ ... }),
  posizione: (nome) => ({ x, y }),
});
```

**`gioca(mossa)`**: mosse ed esiti esattamente come nel § 3.2:

```js
{ tipo: "salto", da: "b5", a: "d5" }  // → { valida: true, rimaste: 31, bloccato: false, errore: false, risolto: false }
                                      // → { valida: true, rimaste: 7, bloccato: true, errore: true, risolto: false, motivo: "Nessun salto possibile: sei bloccato" }
                                      // → { valida: true, rimaste: 7, bloccato: true, errore: false, risolto: false }   (vicolo già contato)
                                      // → { valida: true, rimaste: 1, bloccato: false, errore: false, risolto: true }
                                      // → { valida: false, motivo: "Si salta solo in una buca vuota." }
{ tipo: "annulla" }                   // → { valida: true, rimaste: 32 } oppure { valida: false, motivo: "Non c'è nessun salto da annullare." }
{ tipo: "ricomincia" }                // → { valida: true, errore: true, rimaste: 32, motivo: "..." } oppure { valida: false, motivo: "Sei già all'inizio." }
```

`gioca` aggiorna stato, memoria, targa e fumetto subito, come un tocco vero; le animazioni vengono dopo.

**`statoGioco()`**:

```js
{
  vuota: "d5", finale: "d2",            // la variante
  piene: ["c7", "d7", ...],             // i nomi delle buche piene, in ordine di indice
  rimaste: 32,
  salti: [["b5", "d5"], ...],           // in ordine
  bloccato: false,                      // true se la posizione è senza uscita e non risolta
  selezionata: null,                    // nome della caramella selezionata nell'interfaccia, o null
}
```

Con `g.giaRisolto`: `piene: [finale]`, `rimaste: 1`, `bloccato: false`, `selezionata: null`.

**`posizione(nome)`**: il centro della buca in pixel della scena, interi: `{ x: 106 + 18·colonna, y: 31 + 18·riga }` (riga dall'alto); `null` se il nome non è una buca. Esempio: `posizione("d4")` → `{ x: 160, y: 85 }`.

La verifica (`verifica.mjs`) controlla, fra l'altro: la variante di 7 semi contro l'elenco del § 2.2; le mosse rifiutate senza errori; un clic sulla caramella (deve risultare `selezionata`) e un clic sulla buca; «Annulla» col bottone; un trascinamento; «Ricomincia» col bottone, che al primo clic non deve fare niente e al secondo conta un errore; un vicolo cieco (errore), «Annulla» gratis, lo stesso vicolo rifatto (niente errore); il ricaricamento della pagina (tavola ed errori restano); una partita che finisce con l'ultima caramella fuori dalla buca d'oro (errore), annullata tutta un salto alla volta; infine la soluzione del suo risolutore, che deve risolvere.

---

## 7. Criteri di accettazione

Guardando le foto e giocando:

1. `node demo/comune/prova.mjs caramella-solitaria` finisce con «TUTTO OK», anche con `--seed 7` (la classica) e `--seed 2` (buca d'oro vuota all'inizio).
2. La tavola è una croce di velluto viola con la cornice d'oro di due toni, la scanalatura scura e l'ombra in basso a destra; gli spigoli interni della croce sono netti, senza buchi né doppi bordi.
3. Le caramelle si riconoscono subito come pezzi: d'oro acceso, contorno scuro, più chiare dei mucchi d'oro velati dello sfondo; si vede bene quale buca è vuota.
4. La buca d'oro si trova a colpo d'occhio, sia vuota sia con una caramella dentro, e ogni tanto luccica.
5. Toccando una caramella si solleva e lampeggia, e le buche dove può atterrare mostrano il segno acquamarina; toccando una caramella che non può saltare non succede niente tranne il fumetto.
6. Dopo un salto la caramella vola nella buca nuova e quella scavalcata vola in bocca a Zucco, che mastica e dice `GNAM!`; la targa passa subito a `SALTI 1/31`, `RESTANO 31`.
7. Trascinare una caramella sulla buca giusta fa il salto; lasciarla altrove la rimette a posto.
8. «Annulla» rimette le caramelle (quella mangiata torna da Zucco) e non tocca le dorate; si può annullare fino all'inizio.
9. «Ricomincia» al primo tocco diventa «Conferma» e avvisa; solo al secondo ricomincia, con errore e caramelle che tornano tutte.
10. Un vicolo cieco dà l'avviso del kit, il lampo rosso, le caramelle grigie, Zucco triste e `BLOCCATO!`; rifare lo stesso vicolo non toglie altre dorate.
11. La vittoria ha la festa (cornice, stelle, Zucco che salta, `PERFETTO!`) e poi la carta con il riepilogo; ricaricando, la scena mostra l'ultima caramella sulla piastra d'oro e Zucco felice.
12. Ricaricando a metà partita si riparte dalla stessa posizione, col fumetto «Ripartiamo da dove eri rimasto…».
13. Sul telefono (foto `telefono.png`) le caramelle sono distinguibili e le caselle si toccano bene; niente di importante sotto le barre del kit.
14. Con «riduci movimento» non c'è niente che si muova da solo e nessuna caramella resta a metà strada.
15. Nessun testo nella scena oltre a targa e scritte di Zucco; niente emoji, niente forme smussate, niente sfumature lisce.
