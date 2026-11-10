# La zucca vuota (`zucche-di-piombo`): istruzioni per il costruttore

Stanza: **Ingresso** · dorate **2** · errori concessi **1** (ogni errore vale una dorata in meno, minimo 1).
Valgono [`../REGOLE_COMUNI.md`](../REGOLE_COMUNI.md), il kit e l'esempio `_esempio/`. Qui c'è solo quello che è specifico di questo rompicapo. Le coordinate sono pixel della scena 320×180.

---

## 1. In breve

Davanti al portone della festa c'è una grande bilancia a due piatti; su una panca aspettano 8 o 9 zucche numerate, identiche. Una è diversa: più leggera (vuota) o più pesante (piena di piombo), a seconda della variante. Il giocatore sposta le zucche sui piatti, preme «Pesa» al massimo **due volte**, poi tocca una zucca e preme «Consegna». Vince solo se, dopo le sue pesate, quella zucca è l'unica possibile: il gioco decide quale zucca è quella diversa **solo alla fine**, scegliendo a ogni pesata l'esito che lascia più zucche possibili, quindi tirare a indovinare non funziona mai.

---

## 2. Variante

### Il generatore (da scrivere esattamente così: la verifica si aspetta questi semi)

```js
variante(rng) {
  const n = rng() < 0.5 ? 8 : 9;
  const tipo = rng() < 0.5 ? "leggera" : "pesante";
  const preferite = EscapeDemo.mescola(rng, Array.from({ length: n }, (_, i) => i + 1));
  return { n, tipo, preferite };
}
```

- `n`: quante zucche (8 o 9), numerate da 1 a `n`.
- `tipo`: `"leggera"` (una zucca è vuota, il suo piatto **sale**) oppure `"pesante"` (una zucca è piena di piombo, il suo piatto **scende**).
- `preferite`: una permutazione di 1…`n`. Serve **solo** a rompere le parità dell'avversario (vedi §3): non è «la soluzione» e la scena non la mostra mai.

Le chiamate a `rng` vanno fatte in quest'ordine (prima `n`, poi `tipo`, poi la permutazione), senza altre chiamate in mezzo.

### Perché è sempre risolvibile

Con 8 o 9 zucche e due pesate c'è sempre una strategia vincente, qualunque esito esca: **3 contro 3** (fuori ne restano 3 o 2), poi **1 contro 1** fra le 3 (o 2) ancora sospette. Con una pesata sola non si vince mai. Metà contro metà (4 contro 4, poi 2 contro 2) lascia sempre 2 zucche possibili, quindi perde. La verifica lo controlla con una ricerca esaustiva.

### Esempi (giocando la strategia giusta con i numeri più bassi)

| Seme | Variante | Pesata 1 | Pesata 2 | Zucca giusta |
|---|---|---|---|---|
| 13 | `{ n: 9, tipo: "leggera", preferite: [5,3,4,2,6,7,8,9,1] }` | 1 2 3 contro 4 5 6 → **sale il destro** (scende il sinistro), restano 4 5 6 | 4 contro 5 → sale il destro, resta 5 | **5** |
| 8 | `{ n: 8, tipo: "pesante", preferite: [7,2,1,6,8,4,5,3] }` | 1 2 3 contro 4 5 6 → **scende il sinistro**, restano 1 2 3 | 1 contro 2 → scende il destro, resta 2 | **2** |
| 12345 | `{ n: 9, tipo: "leggera", preferite: [9,2,6,8,1,3,4,7,5] }` | 1 2 3 contro 4 5 6 → **pari**, restano 7 8 9 | 7 contro 8 → pari, resta 9 | **9** |

Errore tipico col seme 13: 1 2 3 4 contro 5 6 7 8 → scende il sinistro (restano 5 6 7 8); 5 6 contro 7 8 → scende il destro (restano 5 6). Qualunque delle due si consegni è un errore.

---

## 3. Regole e mosse

La logica va scritta come funzioni pulite (stato + mossa → nuovo stato ed esito), separate dal disegno.

### Lo stato del tentativo

```js
{
  posizioni: ["panca", ...],   // lunghezza n; posizioni[i-1] è dove sta la zucca i: "panca" | "sinistro" | "destro"
  sinistro: [],                // zucche sul piatto sinistro, in ordine di arrivo (al massimo 4)
  destro: [],                  // idem a destra
  pesate: 0,                   // pesate valide fatte in questo tentativo (0, 1, 2)
  possibili: [1, ..., n],      // zucche che possono ancora essere quella diversa, in ordine crescente
  registro: [],                // le pesate fatte: { sinistro: [...ordinate], destro: [...ordinate], scende: "sinistro" | "destro" | null }
  tentativo: 1,                // 1 al primo tentativo, +1 dopo ogni errore
}
```

Più lo stato dell'interfaccia (non salvato): `selezionata` (numero della zucca selezionata o `null`) e `inclinazione` (1 = piatto sinistro giù, −1 = piatto destro giù, 0 = in pari).

### L'avversario (il cuore del rompicapo)

A ogni pesata valida le zucche possibili si dividono in tre gruppi: **fuori** (sulla panca), **sinistro**, **destro**. Il gioco tiene il gruppo **più numeroso**; a parità, quello che contiene la zucca che viene **prima** in `variante.preferite`. Quel gruppo diventa il nuovo `possibili`.

```js
function avversario(v, possibili, sinistro, destro) {
  const gruppi = [
    { gruppo: "fuori",    resta: possibili.filter((z) => !sinistro.includes(z) && !destro.includes(z)) },
    { gruppo: "sinistro", resta: possibili.filter((z) => sinistro.includes(z)) },
    { gruppo: "destro",   resta: possibili.filter((z) => destro.includes(z)) },
  ];
  const max = Math.max(...gruppi.map((g) => g.resta.length));
  const rango = (g) => Math.min(...g.resta.map((z) => v.preferite.indexOf(z)));
  return gruppi.filter((g) => g.resta.length === max).sort((a, b) => rango(a) - rango(b))[0];
}
```

Da gruppo a piatto che scende:

| Gruppo scelto | `tipo: "leggera"` | `tipo: "pesante"` |
|---|---|---|
| fuori | `scende: null` (pari) | `scende: null` (pari) |
| sinistro | `scende: "destro"` (il sinistro sale) | `scende: "sinistro"` |
| destro | `scende: "sinistro"` (il destro sale) | `scende: "destro"` |

Mai `Math.random()` qui: stesso seme e stesse mosse danno sempre gli stessi esiti.

### Le mosse

1. **Metti** la zucca `i` in una zona (`"sinistro"`, `"destro"`, `"panca"`). Rifiutata (non è un errore, non cambia niente) se: `i` non esiste, la zona non esiste, la zucca è già lì, o il piatto ha già **4 zucche**. Se viene da un piatto, le altre zucche di quel piatto si ricompattano. Toglie la selezione. Riporta la bilancia in pari (`inclinazione = 0`). Si può fare sempre, anche dopo la seconda pesata.
2. **Sgombra**: tutte le zucche dei piatti tornano sulla panca (ognuna al suo posto). Rifiutata se i piatti sono già vuoti. Non consuma pesate.
3. **Pesa**. Rifiutata (né pesata né errore) se:
   - `pesate` è già 2;
   - un piatto è vuoto;
   - i due piatti hanno un numero diverso di zucche (scenderebbe sempre il più pieno: non è una pesata valida).
   Altrimenti: applica l'avversario, aggiorna `possibili`, `pesate += 1`, aggiunge la riga al `registro`, `inclinazione` = 1 / −1 / 0 secondo `scende`.
4. **Consegna** la zucca `i`. Rifiutata se `i` non esiste.
   - Se `possibili` è **esattamente** `[i]`: **risolto**.
   - Altrimenti è un **errore** (anche se `i` è fra le possibili: l'avversario dice sempre che era un'altra). Dopo l'errore si riparte da capo: tutte le zucche sulla panca, `pesate = 0`, `possibili` = tutte, `registro = []`, `tentativo += 1`, nessuna selezione, bilancia in pari.

### Errore

Conta come errore **solo** consegnare la zucca sbagliata. Testo esatto di `g.errore`:
- `tipo "leggera"`: `` `La zucca ${i} è piena` ``
- `tipo "pesante"`: `` `La zucca ${i} non ha il piombo` ``

(il kit aggiunge da solo « · ora le dorate in palio sono 1»).

### Risolto

`g.risolto({ riepilogo, ritardo: 1500 })` con:
- `"leggera"`: `` `La zucca vuota era la ${i}. Con due pesate ben scelte non aveva più dove nascondersi.` ``
- `"pesante"`: `` `Il piombo era nella zucca ${i}. Con due pesate ben scelte non aveva più dove nascondersi.` ``

### Limiti e salvataggio

- Due pesate per tentativo; la terza viene rifiutata col messaggio del buttafuori (vedi §4). Tentativi illimitati: ogni errore costa come dice il kit.
- **Il tentativo resiste al ricaricamento**: altrimenti chi ha sprecato le pesate ricaricherebbe la pagina invece di sbagliare. Dopo ogni mossa che cambia lo stato (metti, sgombra, pesa, errore, vittoria) salvare `g.memoria.tentativo = { posizioni, sinistro, destro, pesate, possibili, registro, tentativo }` e chiamare `g.salvaMemoria()`. Alla vittoria anche `g.memoria.vinta = i`.
- All'avvio: se `g.memoria.tentativo` esiste ed è coerente (`posizioni.length === n`, zone valide, `sinistro`/`destro` d'accordo con `posizioni`, `pesate` fra 0 e 2, `possibili` non vuoto), si riparte da lì; altrimenti tentativo nuovo.
- La selezione non si salva.

---

## 4. Interfaccia

### Testo della carta iniziale (va adattato alla variante)

Si passa ad `avvia` come `testo`. La variante la calcola il kit dentro `avvia`, quindi si tiene un riferimento all'oggetto delle opzioni e si scrive `testo` dentro `crea` (il kit legge `opzioni.testo` solo quando mostra la carta, cioè dopo `crea`):

```js
const opzioni = {
  id: "zucche-di-piombo",
  sfondo: "ingresso",
  velo: 0.5,
  variante(rng) { /* §2 */ },
  crea(g) {
    opzioni.testo = testoDellaCarta(g.variante);
    // ...
  },
};
EscapeDemo.avvia(opzioni);
```

`testoDellaCarta` (due paragrafi separati da `\n`; `{n}` è 8 o 9):

- `"leggera"`:
  > All'ingresso ci sono {n} zucche identiche. Una è vuota: è la testa di ricambio di Zucco ed è più leggera delle altre. Il buttafuori lascia usare la bilancia a due piatti solo due volte. Trova la zucca vuota.
  > Sposta le zucche sui piatti e premi «Pesa». Quando sei sicuro, tocca la zucca e premi «Consegna».
- `"pesante"`:
  > All'ingresso ci sono {n} zucche identiche. Una è piena di piombo: è il fermaporta del buttafuori ed è più pesante delle altre. Lui lascia usare la bilancia a due piatti solo due volte. Trova la zucca di piombo.
  > Sposta le zucche sui piatti e premi «Pesa». Quando sei sicuro, tocca la zucca e premi «Consegna».

### Bottoni (in quest'ordine)

```js
g.bottone("Pesa", ..., { id: "pesa", forte: true });
g.bottone("Sgombra", ..., { id: "sgombra" });
g.bottone("Consegna", ..., { id: "consegna" });
```

Sempre attivi (il kit li spegne alla vittoria); quando non si può fare, rispondono col messaggio. «Consegna» consegna la zucca selezionata.

### Tocchi (con `g.tocca`, decisi al rilascio, evento `"su"`, se non è stato un trascinamento)

Prima si cerca una **zucca** sotto il dito (zone in §5), poi una **zona** (piatto sinistro, piatto destro, panca).

| Dove si tocca | Nessuna zucca selezionata | Zucca S selezionata |
|---|---|---|
| zucca P | seleziona P | se P = S: deseleziona · se P sta in un'altra zona di S: S va nella zona di P · se P sta nella stessa zona di S: seleziona P |
| zona libera (piatto o panca) | messaggio «Prima tocca una zucca.» | se è un'altra zona: S va lì · se è la sua zona: deseleziona |
| fuori da tutto | niente | deseleziona |

### Trascinamento

Premere su una zucca e muoversi di più di 3 pixel della scena: la zucca segue il dito (disegnata con il centro sul puntatore, sopra tutto). Al rilascio: se il puntatore è su una zona (o su una zucca, che vale la sua zona) diversa da quella della zucca, è una mossa «Metti»; altrimenti la zucca torna al suo posto (220 ms). Durante il trascinamento la selezione si toglie. Se la mossa viene rifiutata (piatto pieno), la zucca torna indietro e compare il messaggio.

### Messaggi del fumetto (testi esatti)

| Quando | Testo |
|---|---|
| all'avvio, e dopo una deselezione | `Tocca una zucca, poi un piatto per metterla sopra.` |
| zucca `i` selezionata | `` `Zucca ${i}: tocca un piatto o la panca, oppure premi «Consegna».` `` |
| dopo una mossa riuscita (pesate < 2) | `` `Sinistra ${a}, destra ${b}. Premi «Pesa» quando sei pronto.` `` (`a`, `b` = zucche sui piatti) |
| dopo una mossa riuscita (pesate = 2) | `Pesate finite: tocca una zucca e premi «Consegna».` |
| Sgombra riuscito | `Tutte le zucche sono tornate sulla panca.` |
| Sgombra coi piatti vuoti | `I piatti sono già vuoti.` |
| piatto pieno | `Su un piatto ci stanno al massimo 4 zucche.` |
| tocco su una zona senza selezione | `Prima tocca una zucca.` |
| Pesa con un piatto vuoto | `Metti almeno una zucca su ogni piatto.` |
| Pesa con numeri diversi | `Numeri diversi: scende il piatto più pieno. Non conta come pesata.` |
| Pesa dopo due pesate | `Il buttafuori: «Due pesate e basta!» Ora consegna una zucca.` |
| Consegna senza selezione | `Prima tocca la zucca da consegnare.` |
| pesata `k` riuscita | `` `Pesata ${k}: ${frase}.` `` + `" Ti resta una pesata."` se k = 1, `" Ora consegna una zucca."` se k = 2 |
| dopo un errore | `Si ricomincia: zucche sulla panca e due pesate nuove.` |
| vittoria, `"leggera"` | `È vuota! Il buttafuori la ridà a Zucco e apre il portone.` |
| vittoria, `"pesante"` | `È di piombo! Col suo fermaporta il buttafuori apre il portone.` |

`frase`: pari → `i piatti stanno pari`; `"leggera"` → nomina il piatto che **sale** (`sale il piatto sinistro` / `sale il piatto destro`); `"pesante"` → il piatto che **scende** (`scende il piatto sinistro` / `scende il piatto destro`). Esempio: «Pesata 1: sale il piatto sinistro. Ti resta una pesata.»

Mai mostrare o suggerire le zucche ancora possibili.

---

## 5. Grafica

Sfondo `ingresso`, `velo: 0.5`. Lo sfondo ha la casa con il portone ad arco al centro (x 142…178, y 78…110), tre gradini (y 110…118), il vialetto di pietra, le finestre accese in alto ai lati, le lanterne a x 30 e x 290: niente zucche apposta. Il cartello «FESTA HALLOWEEN» sta sul tetto (fino a y 31): sotto c'è posto per il braccio della bilancia.

### Disposizione

| Elemento | Dove |
|---|---|
| Bilancia: fulcro | (160, 42); braccio da x 92 a 228; ganci dei piatti a x 96 e 224 |
| Colonna e piedistallo | colonna x 157…163, y 45…111; piedistallo x 141…179, y 111…126 (davanti ai gradini) |
| Piatti (giogo, catene, piatto) | centro x 96 e x 224; giogo y 56…58, piatto y 100…105 (più lo spostamento dell'inclinazione) |
| Panca delle zucche | x 52…268, piano a y 144…149, gambe fino a y 152 |
| Lavagna sul cavalletto | x 5…59, y 62…150 (cornice y 66…111) |
| Zucco | sprite 18×28 con l'angolo in alto a sinistra in (14, 123): piedi a y 150 |
| Buttafuori | sprite 24×42 con l'angolo in alto a sinistra in (276, 109): piedi a y 150 |

Ordine di disegno, dal fondo: portone aperto e luce sui gradini (solo da risolto) → lavagna → colonna e piedistallo → braccio e fulcro → piatti (catene, giogo, piatto) → zucche sui piatti → panca → zucche sulla panca → Zucco e buttafuori → effetti (croce rossa, stelline, polvere) → zucca selezionata → zucca trascinata.

### Aiuti di disegno

Tutto con `rett`, `sprite`, `testo`, `retino` del kit. Per un retino «trasparente» (solo i puntini di un colore, senza riempire il resto) serve un aiutino:

```js
const puntini = (ctx, colore, x, y, w, h, quanto) => {
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++)
    if (EscapeDemo.BAYER[(y + j) & 3][(x + i) & 3] / 16 < quanto) rett(ctx, colore, x + i, y + j, 1, 1);
};
```

### La zucca (16×13)

Contorno `C.bordo`, luce in alto a sinistra, costole più scure, ombra a destra. Il numero va **sopra**, in bianco col carattere 5×7: `testo(ctx, String(i), x + 5, y + 4, { colore: C.bianco, ombra: C.bordo })` (x, y = angolo in alto a sinistra dello sprite).

```js
const ZUCCA = [
  ".......kk.......",
  "......kgGk......",
  "...kkkkgGkkkk...",
  ".kkhhyOooOyOOkk.",
  "khhhyOhyyyOyOOok",
  "khhyOhyyyyyOyOok",
  "khyyOhyyyyyOyOok",
  "kyyyOyyyyyyOyOok",
  "kyyyOyyyyyyOOOok",
  "kOyyyOyyyyOOOOok",
  ".kOyyyOyyOOOOok.",
  "..kOOOOOOOoook..",
  "...kkkkkkkkkk...",
];
const ZUCCA_SCURO = "#9c3b17"; // fuori paletta: è l'ombra della testa di Zucco (sprite-provvisori.js, lettera o)
const COL_ZUCCA  = { n: C.nero, k: C.bordo, h: C.fiammaChiara, y: C.fiamma, O: C.brace, o: ZUCCA_SCURO, g: C.erba, G: C.erbaScura };
// La zucca di piombo, alla vittoria: stessi pixel, colori del metallo.
const COL_PIOMBO = { k: C.bordo, h: C.pietraChiara, y: C.pietra, O: C.ferroChiaro, o: C.ferro, g: C.erba, G: C.erbaScura };
```

Stati della zucca:
- **normale**: `COL_ZUCCA`;
- **selezionata**: alzata di 3 pixel, contorno `C.giallo` (`{ ...COL_ZUCCA, k: C.giallo }`); sulla panca un'ombra `rett(C.legnoScuro, centro − 6, 145, 12, 1)` sotto di lei (sulla riga chiara del piano, disegnata dopo la panca). Facoltativo: sobbalza di un pixel (alzata 3 ↔ 4) ogni 4 fotogrammi;
- **sbagliata** (subito dopo l'errore, 600 ms): contorno `C.tappetoChiaro`, scossa di ±1 pixel in x per 4 fotogrammi, e sopra la croce rossa centrata, angolo in alto a sinistra in (x + 5, y − 9):
  ```js
  const CROCE = ["xx...xx", ".xx.xx.", "..xxx..", ".xx.xx.", "xx...xx"]; // x: C.tappetoChiaro
  ```
- **vuota** (vittoria, `"leggera"`): al posto di `ZUCCA` si disegna `ZUCCA_APERTA` (16×19) in (x, y − 6), col numero in (x + 5, y + 5); il coperchio galleggia sopra la bocca scura. Sopra compaiono tre stelline (una ogni 2 fotogrammi, poi brillano scambiando `w` e `W`) in (x + 2, y − 12), (x + 11, y − 15), (x + 6, y − 19):
  ```js
  const ZUCCA_APERTA = [
    "........kk......",
    ".......kgGk.....",
    ".....kkkgGkkk...",
    "...kkhhyyOOOOkk.",
    "...khhyyyyyOOok.",
    "....kkkkkkkkkk..",
    "................",
    "................",
    "................",
    ".kkkkkkkkkkkkkk.",
    "kOnnnnnnnnnnnnOk",
    "khhyOhyyyyyOyOok",
    "khyyOhyyyyyOyOok",
    "kyyyOyyyyyyOyOok",
    "kyyyOyyyyyyOOOok",
    "kOyyyOyyyyOOOOok",
    ".kOyyyOyyOOOOok.",
    "..kOOOOOOOoook..",
    "...kkkkkkkkkk...",
  ]; // colori COL_ZUCCA (n = C.nero, l'interno vuoto)
  const STELLINA = [".w.", "wWw", ".w."]; // w: C.giallo, W: C.bianco
  ```
- **di piombo** (vittoria, `"pesante"`): `COL_PIOMBO`; un «tonf»: la zucca scende di 1 pixel per 2 fotogrammi e torna, e ai lati della base si alzano sbuffi di polvere `C.pietra` (2×1 pixel) in (x − 3, y + 11), (x − 5, y + 10), (x + 17, y + 11), (x + 19, y + 10), che per 3 fotogrammi si allontanano di un pixel a fotogramma, poi diventano `C.ferroChiaro` e spariscono.

### Dove stanno le zucche

**Sulla panca** ogni zucca ha il suo posto fisso, in ordine di numero. Angolo dello sprite: (centro − 8, 132). Centri:
- `n = 9`: 72, 94, 116, 138, 160, 182, 204, 226, 248;
- `n = 8`: 83, 105, 127, 149, 171, 193, 215, 237.

Un posto vuoto resta vuoto finché la zucca non torna.

**Su un piatto** (centro `cx` = 96 o 224, spostamento verticale `dy`, vedi «La bilancia» qui sotto) le zucche si dispongono secondo quante sono, in ordine di arrivo. Angolo dello sprite: (cx + ox − 8, 87 + dy + oy):

| Zucche sul piatto | (ox, oy) di ciascuna, nell'ordine di arrivo |
|---|---|
| 1 | (0, 0) |
| 2 | (−9, 0), (9, 0) |
| 3 | (−17, 0), (0, 0), (17, 0) |
| 4 | (−17, 0), (0, 0), (17, 0), (0, −11) (la quarta sta in cima, sopra quella di mezzo) |

Si disegnano in quest'ordine (la quarta per ultima).

**Zone di tocco**
- zucca: lo sprite allargato di 2 pixel per lato, da (x − 2, y − 2) a (x + 17, y + 14) (alzata di 3 se selezionata); se più zucche contengono il punto, vince quella col centro (x + 8, y + 6) più vicino;
- piatto: x da cx − 32 a cx + 32, y da 52 + dy a 112 + dy;
- panca: x 50…270, y 126…153.

### La bilancia (ferro con rifiniture d'ottone)

Inclinazione `t` in pixel, da −6 a 6: `t > 0` vuol dire piatto sinistro giù. A riposo `t = 0`; dopo una pesata `t = 6` se scende il sinistro, `t = −6` se scende il destro. Il piatto sinistro si sposta di `dy = t`, il destro di `dy = −t`.

```js
const PIVOT_X = 160, PIVOT_Y = 42, BRACCIO = 64;
const yTrave = (x, t) => PIVOT_Y + Math.round((t * (PIVOT_X - x)) / BRACCIO);

function colonna(ctx) {
  const x = 157;
  rett(ctx, C.bordo, x, 45, 7, 67);
  rett(ctx, C.pietraChiara, x + 1, 45, 1, 67);
  rett(ctx, C.pietra, x + 2, 45, 2, 67);
  rett(ctx, C.ferroChiaro, x + 4, 45, 1, 67);
  rett(ctx, C.ferro, x + 5, 45, 1, 67);
  for (const y of [60, 78, 96]) {               // anelli d'ottone
    rett(ctx, C.bordo, x - 1, y, 9, 4);
    rett(ctx, C.oro, x, y + 1, 7, 1);
    rett(ctx, C.oroScuro, x, y + 2, 7, 1);
    rett(ctx, C.giallo, x, y + 1, 2, 1);
  }
  rett(ctx, C.bordo, 149, 111, 23, 7);           // piedistallo: blocco alto
  rett(ctx, C.pietra, 150, 112, 21, 1);
  rett(ctx, C.ferroChiaro, 150, 113, 21, 4);
  rett(ctx, C.ferro, 164, 113, 7, 4);
  rett(ctx, C.bordo, 141, 117, 39, 10);          // blocco basso
  rett(ctx, C.pietraChiara, 142, 118, 37, 1);
  rett(ctx, C.pietra, 142, 119, 37, 6);
  rett(ctx, C.ferroChiaro, 168, 119, 11, 6);
  rett(ctx, C.oro, 146, 121, 2, 2);
  rett(ctx, C.oro, 173, 121, 2, 2);
  retino(ctx, C.ferroChiaro, C.bordo, 142, 125, 37, 1, 0.5);
  puntini(ctx, C.bordo, 139, 127, 43, 2, 0.5);   // ombra a terra
}

function trave(ctx, t) {
  for (let x = 92; x <= 228; x++) {              // più spessa al centro, una colonna di pixel alla volta
    const y = yTrave(x, t), d = Math.abs(x - PIVOT_X), e = d < 20 ? 2 : d < 40 ? 1 : 0;
    rett(ctx, C.bordo, x, y - 2 - e, 1, 5 + 2 * e);
    rett(ctx, C.pietraChiara, x, y - 1 - e, 1, 1);
    rett(ctx, C.pietra, x, y - e, 1, 1 + e);
    if (e) rett(ctx, C.ferroChiaro, x, y + 1, 1, e);
    rett(ctx, C.ferro, x, y + 1 + e, 1, 1);
  }
  for (const cx of [96, 224]) {                  // ganci
    const y = yTrave(cx, t);
    rett(ctx, C.bordo, cx - 2, y + 2, 5, 3);
    rett(ctx, C.oro, cx - 1, y + 2, 3, 2);
  }
  rett(ctx, C.bordo, 156, 37, 9, 9);             // fulcro: pomello d'ottone (non si muove)
  rett(ctx, C.oroScuro, 157, 38, 7, 7);
  rett(ctx, C.oro, 157, 38, 5, 5);
  rett(ctx, C.giallo, 158, 39, 2, 2);
  rett(ctx, C.bianco, 158, 39, 1, 1);
}

function catena(ctx, x, y0, y1) {                // anelli alternati, larga 3 pixel
  for (let y = y0; y <= y1; y++) {
    const j = (y - y0) % 4;
    if (j < 2) { rett(ctx, C.bordo, x - 1, y, 3, 1); rett(ctx, j === 0 ? C.pietraChiara : C.pietra, x, y, 1, 1); }
    else rett(ctx, C.ferroChiaro, x, y, 1, 1);
  }
}

function piatto(ctx, cx, dy) {
  const y = 100 + dy;
  catena(ctx, cx, 45 + dy, 55 + dy);             // dal gancio al giogo
  rett(ctx, C.bordo, cx - 28, 56 + dy, 57, 3);   // giogo
  rett(ctx, C.pietra, cx - 27, 57 + dy, 55, 1);
  rett(ctx, C.pietraChiara, cx - 27, 57 + dy, 20, 1);
  rett(ctx, C.oro, cx - 1, 56 + dy, 3, 3);
  catena(ctx, cx - 26, 59 + dy, y - 1);          // le due catene del piatto
  catena(ctx, cx + 26, 59 + dy, y - 1);
  rett(ctx, C.bordo, cx - 29, y, 59, 2);         // il piatto, una conca bassa
  rett(ctx, C.pietraChiara, cx - 28, y + 1, 57, 1);
  rett(ctx, C.bordo, cx - 28, y + 2, 57, 1);
  rett(ctx, C.pietra, cx - 27, y + 2, 55, 1);
  rett(ctx, C.ferroChiaro, cx + 12, y + 2, 15, 1);
  rett(ctx, C.bordo, cx - 26, y + 3, 53, 1);
  rett(ctx, C.ferroChiaro, cx - 25, y + 3, 51, 1);
  rett(ctx, C.ferro, cx + 10, y + 3, 16, 1);
  rett(ctx, C.bordo, cx - 23, y + 4, 47, 1);
  rett(ctx, C.ferro, cx - 22, y + 4, 45, 1);
  rett(ctx, C.bordo, cx - 20, y + 5, 41, 1);
}
// ogni fotogramma: colonna(ctx); trave(ctx, t); piatto(ctx, 96, t); piatto(ctx, 224, -t);
```

### La panca

```js
function panca(ctx) {
  rett(ctx, C.bordo, 52, 144, 217, 6);
  rett(ctx, C.legnoLuce, 53, 145, 215, 1);
  rett(ctx, C.legnoChiaro, 53, 146, 215, 2);
  rett(ctx, C.legno, 53, 148, 215, 1);
  for (let k = 0; k < 12; k++) rett(ctx, C.legno, 60 + 17 * k, 146 + (k % 2), 6, 1);   // venature
  for (const x of [58, 157, 257]) {                                                   // gambe
    rett(ctx, C.bordo, x, 150, 6, 3);
    rett(ctx, C.legno, x + 1, 150, 4, 3);
    rett(ctx, C.legnoScuro, x + 4, 150, 1, 3);
  }
}
```

### La lavagna delle pesate

Una lavagna d'ardesia verde su un cavalletto: in alto «PESATE» e il contatore, sotto una riga per ogni pesata del tentativo in corso, disegnata come una **piccola bilancia di gesso**: una linea che pende come la bilancia vera, con i numeri delle zucche seduti sopra ciascun lato.

```js
function lavagna(ctx, pesate, registro) {
  for (const x of [11, 51]) {                     // gambe del cavalletto
    rett(ctx, C.bordo, x - 1, 108, 4, 43);
    rett(ctx, C.legnoChiaro, x, 108, 2, 42);
    rett(ctx, C.legno, x + 1, 108, 1, 42);
  }
  rett(ctx, C.bordo, 30, 62, 5, 6); rett(ctx, C.legnoChiaro, 31, 63, 3, 5);  // piolo in cima
  rett(ctx, C.bordo, 5, 66, 55, 46);              // cornice
  rett(ctx, C.legnoChiaro, 6, 67, 53, 44);
  rett(ctx, C.legnoLuce, 6, 67, 53, 1);
  rett(ctx, C.legno, 6, 109, 53, 2);
  rett(ctx, C.bordo, 8, 69, 49, 40);              // ardesia
  rett(ctx, C.siepe, 9, 70, 47, 38);
  retino(ctx, C.siepe, C.erbaScura, 9, 70, 47, 38, 0.12);   // gesso cancellato
  testo(ctx, "PESATE", 11, 73, { piccolo: true, colore: C.pietraChiara, ombra: null });
  testo(ctx, `${pesate}/2`, 54, 72, { colore: C.giallo, ombra: null, allinea: "destra" });
  for (let x = 11; x <= 54; x += 2) rett(ctx, C.pietra, x, 81, 1, 1);
  registro.forEach((r, i) => {
    const yc = 92 + i * 11;
    const s = r.scende === "sinistro" ? 1 : r.scende === "destro" ? -1 : 0;
    const yl = (x) => yc + Math.round((s * 2 * (32 - x)) / 21);
    for (let x = 11; x <= 53; x++) rett(ctx, C.pietraChiara, x, yl(x), 1, 1);
    rett(ctx, C.pietra, 32, yc + 1, 1, 1); rett(ctx, C.pietra, 31, yc + 2, 3, 1);  // fulcro
    testo(ctx, r.sinistro.join(""), 12, yl(12) - 6, { piccolo: true, colore: C.bianco, ombra: null });
    testo(ctx, r.destro.join(""), 53, yl(53) - 6, { piccolo: true, colore: C.bianco, ombra: null, allinea: "destra" });
  });
}
```

Le righe nuove possono comparire «scritte col gesso» da sinistra a destra in 300 ms; dopo un errore la lavagna si pulisce.

### Zucco (18×28, guarda a destra)

È il protagonista: tiene d'occhio la sua testa di ricambio. Colori: quelli originali di Zucco (`../../zucco/src/sprite-provvisori.js`), **fuori paletta apposta** perché è lo stesso personaggio dell'altro gioco.

```js
const ZUCCO = [
  "......Gg..........",
  ".....GGg..........",
  "..kkkkkkkkkk......",
  ".koOOyyyOOOok.....",
  "koOOyyhyyOOOok....",
  "koOyEEyyOEEOok....",
  "koOEeeEyOEeeEk....",
  "koOOEEOOEOEEOk....",
  "koOOOOOEEOOOOk....",
  "koObEbEbEbEbOk....",
  "kooOeEeEeEeOok....",
  ".kooOOOOOOOok.....",
  "..kkkkkkkkkk......",
  "..kqqpppppPk......",
  ".kqppppppppPk.....",
  ".kqpppppppPPkk....",
  "kqpppppppPPPkPk...",
  "kqppppppPPPPk.Pk..",
  "kqpppppPPPPPk.kkk.",
  ".kppppPPPPPk..kek.",
  "..kkkkkkkkk...kEk.",
  "....kBBkLLk...kkk.",
  "....kBBkLLk.......",
  "....kBBkLLk.......",
  "....kBBkLLk.......",
  "....kBBkLLk.......",
  "...kRRRkTTTk......",
  "...kkkkkkkkk......",
];
const COL_ZUCCO = {
  k: C.bordo, o: "#9c3b17", O: "#d9661a", y: "#f59a2e", h: "#ffd07a", E: "#ffb52e", e: "#fff3b0", b: "#4a1a12",
  G: "#2d5a2e", g: "#5f9440", q: "#a47bf0", p: "#6a43b8", P: "#3f2a78", B: "#463a6a", L: "#7a6aa4", R: "#5e3c44", T: "#83575c",
};
```

### Il buttafuori (24×42, guarda a sinistra)

Uno scheletro grosso in maglietta scura, occhiali da sole, auricolare e distintivo d'ottone, mani giunte davanti alla cintura.

```js
const BUTTAFUORI = [
  ".......kkkkkkk..........",
  ".....kkwwwwwwwkk........",
  "....kwwwwwwwwwwWk.......",
  "....kwwwwwwwwwwWk.......",
  "...kwwwwwwwwwwWWk.......",
  "...knnnnnnnnnnnnkk......",
  "...knlnnnnknlnnnkSk.....",
  "...kknnnnkkknnnkkSk.....",
  "....kwwwwkwwwwWWkb......",
  "....kwwwwwwwwwWSkb......",
  ".....kwkwkwkwkSkb.......",
  ".....kwkwkwkwkkb........",
  "......kkkkkkkkb.........",
  "..kkkkkkkWWSkkkkkkkkkk..",
  ".kFFFFFFFWWSFFFFFFFFFFk.",
  "kFFFFFFFFFFffffffffffffk",
  "kFFFkFFFFFFffffffffkfffk",
  "kFFFkFFFFFFfffyooffkfffk",
  "kFFFkFFFFFFfffoooffkfffk",
  "kFFFkFFFFFfffffffffkfffk",
  "kFFFkFFFFFfffffffffkfffk",
  "kkkkkFFFFFfffffffffkkkkk",
  "kwWkFFFFFFffffffffffkwWk",
  ".kwWkFFFFFfffffffffkwWk.",
  "..kwWkFFFFffffffffkwWk..",
  "...kwWkFFFfffffffkwWk...",
  "...kFwWkFFffffffkwWfk...",
  "...kFFwwwwwwwwwwwWffk...",
  "...kFFkwSwSwSwSwSkffk...",
  "...kFFFkkkkkkkkkkfffk...",
  "...kkkkkkkkookkkkkkkk...",
  "...kjjjjjjjjJJJJJJJJk...",
  "...kjjjjjjjjJJJJJJJJk...",
  "...kjjjjjjjkkJJJJJJJk...",
  "...kjjjjjjjkkJJJJJJJk...",
  "...kjjjjjjjkkJJJJJJJk...",
  "...kjjjjjjjkkJJJJJJJk...",
  "...kjjjjjjjkkJJJJJJJk...",
  "...kjjjjjjjkkJJJJJJJk...",
  "...kjjjjjjjkkJJJJJJJk...",
  "..ksszssssskksszsssssk..",
  "...kkkkkkkk..kkkkkkkk...",
];
const COL_BUTTAFUORI = {
  k: C.bordo, w: C.bianco, W: C.pietraChiara, S: C.pietra, n: C.nero, l: C.notteChiara, b: C.notteChiara,
  F: C.ferroChiaro, f: C.ferro, j: C.notte, J: C.sagoma, s: C.nero, z: C.ferroChiaro, o: C.oro, y: C.giallo,
};
```

Le righe 0…12 sono la testa (si possono spostare da sole per scuoterla), le righe 0…29 il busto con la testa (per il respiro), le righe 30…41 le gambe. `l` sono i riflessi delle lenti, `b` il filo dell'auricolare, `o`/`y` il distintivo e la fibbia.

### Il portone aperto (solo da risolto)

Copre il portone dello sfondo con la luce della festa. Le righe dell'arco sono quelle di `arco()` in `sfondi/sfondi.js`:

```js
const ARCO = [];                                  // [y, x, w] per ogni riga del vano
for (let y = 78; y < 110; y++) {
  const dy = 96 - y, mw = dy > 0 ? Math.sqrt(Math.max(0, 324 - dy * dy)) : 18;
  const x = Math.round(160 - mw);
  ARCO.push([y, x, Math.round(160 + mw) - x]);
}
function portoneAperto(ctx, apertura = 1) {       // apertura 1/3, 2/3, 1 durante l'animazione
  for (const [y, x0, w0] of ARCO) {
    const w = Math.max(1, Math.round(w0 * apertura)), x = 160 - Math.floor(w / 2);
    rett(ctx, C.fiamma, x, y, w, 1);
    if (w > 8) rett(ctx, C.vetro, x + 3, y, w - 6, 1);
    if (w > 16) rett(ctx, C.fiammaChiara, x + 7, y, w - 14, 1);
  }
  if (apertura < 1) return;
  for (const [y, x, w] of ARCO) if (w >= 10) {    // i battenti aperti verso l'interno
    rett(ctx, C.legnoScuro, x, y, 3, 1);
    rett(ctx, C.legnoScuro, x + w - 3, y, 3, 1);
  }
  rett(ctx, C.brace, 150, 96, 4, 4); rett(ctx, C.brace, 149, 100, 6, 10);   // due invitati controluce
  rett(ctx, C.brace, 167, 98, 3, 3); rett(ctx, C.brace, 166, 101, 5, 9);
  rett(ctx, C.vetro, 136, 110, 48, 1);            // la luce sui bordi dei gradini
  rett(ctx, C.fiamma, 130, 113, 60, 1);
  rett(ctx, C.brace, 124, 116, 72, 1);
}
```

### Animazioni

Continue (8 fotogrammi al secondo, `g.fotogramma`, sfasate; niente con `g.riduciMovimento`):
- **Zucco respira**: righe 0…20 un pixel più giù quando `Math.floor(f / 6) % 2 === 1`, gambe ferme. La lanterna tremola: `e` vale `#fff3b0` per 3 fotogrammi e `#ffb52e` per 3.
- **Buttafuori respira**: righe 0…29 un pixel più giù quando `Math.floor((f + 3) / 6) % 2 === 1`. Ogni 24 fotogrammi, per 2, i pixel `l` delle lenti diventano `C.bianco` (riflesso degli occhiali).

Sui gesti (pixel interi, 150–350 ms):
- **Zucca spostata**: dalla posizione disegnata a quella nuova in 220 ms, in linea retta; anche le zucche che si ricompattano sul piatto scivolano.
- **Pesata valida**: `t` passa per questi valori, uno ogni 90 ms: verso il sinistro giù `[2, 4, 6, 7, 6, 5, 6]`; verso il destro giù gli stessi col segno meno; pari `[2, −2, 1, −1, 0]`. La bilancia resta inclinata finché non si sposta una zucca; allora torna a 0 di 2 pixel ogni 50 ms.
- **Pesata rifiutata per numeri diversi**: verso il piatto più pieno (`s` = 1 se è il sinistro, −1 se è il destro) `t` = `s ×` `[1, 2, 3, 3, 3, 2, 1, 0]`, uno ogni 90 ms; il buttafuori scuote la testa.
- **Testa che dice di no** (buttafuori: Pesa dopo due pesate, numeri diversi, errore): le righe 0…12 spostate in x di `[−1, 1, −1, 1, 0]`, una ogni fotogramma.
- **Errore**: subito `g.errore(...)`; la zucca consegnata diventa «sbagliata» (contorno rosso, scossa, croce) per 600 ms; il buttafuori dice di no; Zucco trema (tutto lo sprite in x di `[−1, 1, −1, 1, 0]`). Dopo 600 ms tutte le zucche scivolano sulla panca (250 ms), la bilancia torna in pari, la lavagna si pulisce. Lo stato (`statoGioco`) è già quello nuovo subito.
- **Vittoria**: subito la zucca diventa «vuota» o «di piombo» (sopra); a 500 ms il portone si apre (`apertura` 1/3, 2/3, 1, una ogni 100 ms), il buttafuori si fa da parte (8 pixel a destra, 2 pixel ogni 75 ms) e Zucco salta tre volte (spostamento in y `[−2, −4, −5, −4, −2, 0]`, un valore a fotogramma). La carta della vittoria arriva dopo `ritardo: 1500`.

Con `g.riduciMovimento` si salta subito allo stato finale di ogni gesto (stelline ferme, portone già aperto).

### Già risolto (`g.giaRisolto`)

Si leggono `g.memoria.tentativo` e `g.memoria.vinta`: zucche dove erano, la zucca `vinta` già «vuota» (con le stelline ferme) o «di piombo», portone aperto, buttafuori 8 pixel a destra, bilancia in pari. Se la memoria manca: tutte le zucche sulla panca, portone aperto.

---

## 6. Aggancio per le prove

`g.espone({ gioca, statoGioco, posizione, zona })`. `gioca` usa le stesse funzioni dei tocchi e dei bottoni, aggiorna lo stato subito e ritorna uno di questi oggetti:

| Mossa | Esito riuscito | Esiti rifiutati (`valida: false`, non sono errori) |
|---|---|---|
| `{ metti: i, su: "sinistro" \| "destro" \| "panca" }` | `{ ok: true }` | `motivo`: `"zucca inesistente"`, `"zona inesistente"`, `"già lì"`, `"piatto pieno"` |
| `{ pesa: true }` | `{ ok: true, pesata: k, scende: "sinistro" \| "destro" \| null }` | `"pesate finite"`, `"piatto vuoto"`, `"numeri diversi"` (controllati in quest'ordine) |
| `{ sgombra: true }` | `{ ok: true }` | `"piatti vuoti"` |
| `{ consegna: i }` | `{ risolto: true, zucca: i }` oppure `{ errore: true, motivo }` (`motivo` = il testo dato a `g.errore`) | `"zucca inesistente"` |
| qualunque altra cosa | | `{ valida: false, motivo: "mossa sconosciuta" }` |

Via `gioca` la consegna prende il numero direttamente (non serve selezionare). I rifiuti mostrano anche il loro messaggio nel fumetto come quelli dai tocchi.

`statoGioco()`:

```js
{
  n: 9, tipo: "leggera",
  posizioni: ["panca", "sinistro", ...],   // lunghezza n
  sinistro: [2, 5], destro: [1, 7],        // in ordine di arrivo
  pesate: 1,
  registro: [{ sinistro: [1, 2, 3], destro: [4, 5, 6], scende: "sinistro" }],
  possibili: [4, 5, 6],                    // in ordine crescente
  selezionata: null,                       // o il numero della zucca selezionata
  inclinazione: 1,                         // 1 sinistro giù, -1 destro giù, 0 pari (lo stato, non il fotogramma)
  tentativo: 1,
  vinta: null,                             // il numero della zucca consegnata giusta, dopo la vittoria
}
```

Facoltative ma usate dalla verifica:
- `posizione(i)` → `{ x, y }`: il centro della zucca `i` dove sta (non a metà animazione): angolo dello sprite + (8, 6), in interi;
- `zona(nome)` → `{ x, y }`: un punto dentro la zona: `"sinistro"` → `{ x: 96, y: 66 }`, `"destro"` → `{ x: 224, y: 66 }`, `"panca"` → `{ x: 160, y: 149 }`.

La verifica ([`verifica.mjs`](verifica.mjs)) usa i semi 1, 5, 7, 8, 10, 12, poi gioca col seme 13 (tocchi veri, mosse rifiutate, un errore, ricaricamento, soluzione con «Consegna» dal bottone) e finisce col seme 8 risolto senza errori. Legge anche il testo della carta (bottone «Testo» del kit). Fa le foto `verifica-selezionata`, `verifica-pesata`, `verifica-errore`, `verifica-vinto-leggera`, `verifica-pesata-pesante`.

### Note per il costruttore

- I tocchi vanno provati sulle posizioni **di arrivo** delle zucche (quelle di `posizione(i)`), non su quelle a metà animazione: la verifica aspetta 300–400 ms dopo ogni mossa, ma un tocco durante un'animazione deve comunque colpire la zucca giusta.
- `scende: null` (pari) deve arrivare come `null`, non come stringa né assente.
- Le parti ferme (cornice della lavagna, panca, colonna e piedistallo) si possono disegnare una volta sola su una tela in più (`g.nuovaTela`) sotto quella principale; la lavagna però cambia a ogni pesata, quindi il suo contenuto va ridisegnato.
- Con la bilancia inclinata le zone dei piatti si spostano di `dy`: le zone di tocco seguono l'inclinazione dello stato.
- Il coperchio della zucca aperta e la zucca di piombo restano così (anche dopo aver chiuso la carta della vittoria e ricaricando).
- Non c'è un bottone «Ricomincia»: ricominciare gratis permetterebbe di non pagare le pesate sprecate. «Sgombra» rimette solo le zucche sulla panca.

---

## 7. Criteri di accettazione

Guardando le foto e giocando:

1. All'apertura: casa con il portone chiuso, la bilancia di ferro al centro col braccio sotto il cartello della festa, i piatti vuoti all'altezza delle finestre, 8 o 9 zucche numerate in fila sulla panca, la lavagna con «PESATE 0/2» a sinistra, Zucco davanti al cavalletto, il buttafuori a destra. Niente si sovrappone alle barre del kit.
2. I numeri sulle zucche si leggono anche nella foto del telefono; la zucca selezionata si riconosce subito (alzata, contorno giallo).
3. Si gioca sia toccando zucca e piatto sia trascinando; la quinta zucca su un piatto viene rifiutata col messaggio.
4. «Pesa» con piatti diversi o vuoti non consuma pesate; dopo una pesata valida il braccio oscilla e si ferma inclinato, la lavagna mostra la riga col gessetto che pende dalla stessa parte e il contatore sale.
5. Con `"leggera"` il piatto della zucca diversa **sale**, con `"pesante"` **scende**; il fumetto nomina il piatto giusto.
6. La terza pesata viene rifiutata dal buttafuori; ricaricando la pagina le pesate fatte restano fatte.
7. Consegnare una zucca quando ne restano più di una possibile è sempre un errore: contorno rosso, croce, il buttafuori dice di no, poi tutto torna sulla panca e la lavagna si pulisce.
8. Con 3 contro 3 e poi 1 contro 1 si vince sempre: la zucca si apre (o diventa di piombo), il portone si apre con la luce della festa, Zucco salta, poi la carta della vittoria.
9. Ricaricando dopo la vittoria la scena mostra il portone aperto e la zucca vinta; non si gioca più.
10. La carta iniziale dice il numero giusto di zucche e se la diversa è vuota o di piombo.
11. `node demo/comune/prova.mjs zucche-di-piombo` finisce con «TUTTO OK».
