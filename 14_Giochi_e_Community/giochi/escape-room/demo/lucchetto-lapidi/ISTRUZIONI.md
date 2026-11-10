# Il lucchetto delle lapidi — istruzioni per il costruttore

Stanza: **Cancello**. Scheda: `scheda.js` (4 dorate, una in meno ogni 2 errori). Valgono tutte le regole di `../REGOLE_COMUNI.md`; qui c'è solo quello che è specifico di questo rompicapo. File da scrivere: `index.html` (copia di `../_esempio/index.html` con `<title>Il lucchetto delle lapidi</title>`) e `gioco.js`. La verifica automatica è già pronta in `verifica.mjs` e usa alla lettera i formati della sezione 6.

## 1. In breve

Al centro del cancello pende un grosso lucchetto d'ottone con quattro rotelle; su ognuna si sceglie uno di sei simboli (ripetizioni ammesse). Il giocatore compone una combinazione e preme **Prova**: la combinazione si incide sulla prossima riga di due lapidi (tre righe per lapide, sei tentativi in tutto) e il lucchetto accende accanto candele nere (simbolo giusto al posto giusto) e bianche (simbolo giusto al posto sbagliato).

Il lucchetto è **cattivo**: non ha una combinazione fissa, ma a ogni tentativo risponde in modo da lasciare vive più combinazioni possibile, senza mai mentire. Si vince quando resta viva una sola combinazione e il giocatore la prova (quattro candele nere): il lucchetto si apre. Finire i sei tentativi senza aprire è un **errore**: il lucchetto ride, cancella le lapidi e si ricomincia da capo.

## 2. Variante

Ogni giocatore ha i suoi sei simboli (presi fra otto disegni di lapide, in un ordine suo sulle rotelle) e un suo ordine di spareggio del lucchetto: chi copia i tentativi di un altro non ottiene le stesse candele.

```js
const DISEGNI = ["teschio", "croce", "luna", "pipistrello", "ragno", "fantasma", "occhio", "pozione"];
// Tutte le risposte possibili tranne "4-0" (quattro nere = aperto). "n-b" = n nere e b bianche. "3-1" non esiste.
const RISPOSTE = ["0-0", "0-1", "0-2", "0-3", "0-4", "1-0", "1-1", "1-2", "1-3", "2-0", "2-1", "2-2", "3-0"];

variante(rng) {
  const simboli = EscapeDemo.mescola(rng, DISEGNI).slice(0, 6); // i 6 simboli, nell'ordine delle rotelle
  const preferenze = EscapeDemo.mescola(rng, RISPOSTE);          // ordine di spareggio, vedi 3.2
  return { simboli, preferenze };
}
```

Va scritto **esattamente così** (stesse liste, stesso ordine delle due chiamate a `mescola`): gli esempi qui sotto e i semi delle prove lo danno per scontato.

- Un **codice** (combinazione) è un array di 4 interi `0..5`, da sinistra a destra: ogni intero è l'indice del simbolo in `variante.simboli`. Esempio: con `simboli = ["pipistrello","teschio",…]` il codice `[0,0,1,1]` è pipistrello, pipistrello, teschio, teschio.
- **Risolvibilità:** non dipende dalla variante. Con la strategia di Knuth (aprire con due coppie, poi ogni volta il tentativo il cui caso peggiore lascia meno combinazioni) il lucchetto si apre sempre in 5 tentativi, contro qualunque ordine di spareggio: verificato su tutte le 1.296 combinazioni e controllato di nuovo da `verifica.mjs` sui semi delle prove. I tentativi concessi sono 6.

### Esempi (per provare il proprio codice)

**Seme 12345** → `{"simboli":["pipistrello","teschio","croce","fantasma","ragno","occhio"],"preferenze":["0-2","1-0","0-0","2-1","0-1","0-3","1-1","1-2","1-3","0-4","3-0","2-2","2-0"]}`

| # | codice | simboli | risposta | vive prima → dopo |
|---|---|---|---|---|
| 1 | `[0,0,1,1]` | pipistrello pipistrello teschio teschio | 1 nera | 1296 → 256 (pari a 256 con «0-0» e «0-1»: vince «1-0», che in `preferenze` viene prima) |
| 2 | `[0,2,3,3]` | pipistrello croce fantasma fantasma | 1 bianca | 256 → 44 |
| 3 | `[2,4,1,5]` | croce ragno teschio occhio | 1 nera e 2 bianche | 44 → 7 |
| 4 | `[0,3,5,1]` | pipistrello fantasma occhio teschio | 2 bianche | 7 → 1 (tutti i gruppi valgono 1: vince «0-2», prima in `preferenze`) |
| 5 | `[5,5,1,2]` | occhio occhio teschio croce | 4 nere: **aperto** | 1 |

**Seme 31337** → `{"simboli":["occhio","pozione","teschio","luna","ragno","pipistrello"],"preferenze":["1-3","2-1","1-0","0-2","1-1","0-1","0-4","0-0","1-2","3-0","0-3","2-2","2-0"]}`

| # | codice | risposta | vive prima → dopo |
|---|---|---|---|
| 1 | `[0,0,1,1]` | 1 nera | 1296 → 256 |
| 2 | `[0,2,3,3]` | 1 bianca | 256 → 44 |
| 3 | `[2,4,1,5]` | 1 nera e 2 bianche | 44 → 7 |
| 4 | `[0,3,5,1]` | 2 nere e 1 bianca | 7 → 1 (gruppi tutti da 1: «1-3» non c'è, vince «2-1») |
| 5 | `[3,4,5,1]` | 4 nere: **aperto** | 1 |

## 3. Regole e mosse

### 3.1 Stato

```js
{
  rotelle: [0, 0, 0, 0],   // il simbolo mostrato da ogni rotella (indici in variante.simboli)
  tentativi: [],           // giro in corso: [{ codice: [a,b,c,d], nere, bianche }, …], al massimo 6
  giro: 1,                 // 1 all'inizio, +1 ogni volta che il lucchetto si azzera
  aperto: false,           // true dopo le quattro nere
}
```

All'inizio le rotelle mostrano tutte il simbolo 0. Le combinazioni vive **non** fanno parte dello stato: si ricalcolano dai tentativi ogni volta che servono (nel gioco vero il calcolo starà sul server, e l'elenco delle vive non deve mai arrivare al browser: niente vive in `statoGioco`, in `g.memoria`, in `window` o nel disegno).

### 3.2 Le candele e la risposta del lucchetto (logica pura)

Da scrivere come funzioni pure, separate dal disegno:

```js
/** Le candele che un tentativo `a` riceve se la combinazione fosse `b`. */
function candele(a, b) {
  let nere = 0;
  const ca = [0, 0, 0, 0, 0, 0], cb = [0, 0, 0, 0, 0, 0];
  for (let i = 0; i < 4; i++) {
    if (a[i] === b[i]) nere++;
    else { ca[a[i]]++; cb[b[i]]++; }
  }
  let bianche = 0;
  for (let s = 0; s < 6; s++) bianche += Math.min(ca[s], cb[s]);
  return { nere, bianche };
}

/** Le 1296 combinazioni, in ordine: indice = a·216 + b·36 + c·6 + d. */
const TUTTE = [];
for (let i = 0; i < 1296; i++) TUTTE.push([Math.floor(i / 216), Math.floor(i / 36) % 6, Math.floor(i / 6) % 6, i % 6]);

/** Vive = le combinazioni che avrebbero dato esattamente quelle candele a tutti i tentativi del giro. */
const vive = (tentativi) => TUTTE.filter((c) => tentativi.every((t) => {
  const r = candele(t.codice, c);
  return r.nere === t.nere && r.bianche === t.bianche;
}));

/** La risposta del lucchetto cattivo al tentativo `codice`. */
function rispondi(tentativi, codice, preferenze) {
  const v = vive(tentativi);
  // 1. Quattro nere SOLO se l'unica combinazione viva è proprio quella provata.
  if (v.length === 1 && v[0].every((s, i) => s === codice[i])) return { nere: 4, bianche: 0 };
  // 2. Altrimenti divide le vive per risposta, ignorando "4-0", e sceglie il gruppo più grande.
  const gruppi = {};
  for (const c of v) {
    const r = candele(codice, c);
    if (r.nere === 4) continue;
    const k = `${r.nere}-${r.bianche}`;
    gruppi[k] = (gruppi[k] || 0) + 1;
  }
  // 3. A parità di grandezza vince la risposta che viene prima in variante.preferenze.
  let scelta = null;
  for (const k of preferenze) if (gruppi[k] && (scelta === null || gruppi[k] > gruppi[scelta])) scelta = k;
  const [nere, bianche] = scelta.split("-").map(Number);
  return { nere, bianche };
}
```

Proprietà che ne seguono (e che la verifica controlla): la risposta è sempre giusta per almeno una combinazione viva (il lucchetto non mente); non è mai «4 nere» finché ci sono altre vive; a parità decide `preferenze`. Le vive non sono mai vuote, perché ogni risposta data lascia almeno la sua combinazione.

### 3.3 Mosse

Tutte passano da una sola funzione pura `applica(stato, mossa, variante) → { stato, esito }`, usata dai tocchi, dal bottone, dalla tastiera e da `gioca`.

**`{ tipo: "rotella", rotella: i, verso: v }`** con `i` intero `0..3` e `v` uguale a `1` o `-1`: la rotella `i` passa al simbolo `(valore + v + 6) % 6` (dal simbolo 0 con `-1` si va al 5, e viceversa). Esito `{ ok: true, rotelle: [...] }`. Non conta come tentativo.

**`{ tipo: "prova", codice: [a,b,c,d] }`** oppure **`{ tipo: "prova" }`** (senza `codice` = la combinazione mostrata dalle rotelle; è quello che fa il bottone). In ordine:

1. Se il codice non è un array di 4 interi `0..5` → `{ valida: false, motivo: "combinazione non valida" }`, stato invariato.
2. Se il codice è già fra i `tentativi` del giro in corso → `{ valida: false, motivo: "già provata" }`, stato invariato (nemmeno le rotelle cambiano). **Non è un errore** e non consuma tentativi.
3. Le rotelle prendono il valore del codice; `r = rispondi(tentativi, codice, preferenze)`; il tentativo `{ codice, nere: r.nere, bianche: r.bianche }` si aggiunge ai `tentativi`. Sia `n` il loro numero.
4. Se `r.nere === 4` → `aperto = true`, esito `{ risolto: true, nere: 4, bianche: 0, tentativo: n }`, poi `g.risolto(...)` (sezione 4). Vale anche al sesto tentativo: la vittoria si controlla prima del limite.
5. Altrimenti, se `n === 6` → **errore**: esito `{ errore: true, nere, bianche, tentativo: 6, motivo: "Sei tentativi senza aprire: il lucchetto si azzera" }`, si chiama `g.errore("Sei tentativi senza aprire: il lucchetto si azzera")` e il lucchetto si azzera subito: `tentativi = []`, `giro + 1`, rotelle come sono. Il giro nuovo riparte con tutte le 1296 combinazioni vive (una combinazione già provata nel giro vecchio si può riprovare).
6. Altrimenti → `{ ok: true, nere, bianche, tentativo: n, rimasti: 6 - n }`.

**Qualsiasi altra mossa** (tipo sconosciuto, rotella fuori da `0..3`, verso diverso da ±1, mossa non oggetto) → `{ valida: false, motivo: "…" }`, stato invariato, nessun errore.

**Cosa conta come errore:** soltanto finire i sei tentativi di un giro senza aprire (come dice la scheda). Girare le rotelle, riprovare una combinazione già provata e le mosse non valide non sono errori. Un giro sbagliato = 1 errore; con 2 errori le dorate in palio scendono a 3, con 4 a 2, con 6 a 1 (lo fa il kit).

**Risolto:** dopo le quattro nere il rompicapo è chiuso per sempre (il kit blocca le mosse).

### 3.4 Memoria (ricaricare la pagina non regala tentativi)

Dopo ogni mossa valida si salva lo stato in `g.memoria` (`g.memoria.stato = { rotelle, tentativi, giro, aperto }` e poi `g.salvaMemoria()`). All'avvio, se `g.memoria.stato` c'è ed è ben formato (rotelle 4 interi `0..5`, tentativi al massimo 6 con codici validi, giro intero ≥ 1), si riparte da lì; altrimenti dallo stato iniziale. Così chi ricarica a metà giro ritrova le lapidi incise e i tentativi rimasti.

## 4. Interfaccia

### Tocchi

Ogni rotella ha una colonna di tocco larga 21 pixel: `x` da `X(i) − 2` a `X(i) + 18` compresi, con `X(i) = 119 + 22·i`. Nella colonna:

- **zona su** `58 ≤ y ≤ 84` (freccia su, simbolo che spunta sopra, metà alta della finestra) → `{ tipo: "rotella", rotella: i, verso: -1 }`: scende nella finestra il simbolo che si vedeva sopra;
- **zona giù** `85 ≤ y ≤ 114` (metà bassa della finestra, simbolo che spunta sotto, freccia giù) → `verso: 1`: sale nella finestra il simbolo che si vedeva sotto.

Si reagisce all'evento `"giu"` di `g.tocca` (coordinate arrotondate per difetto). Facoltativo: trascinare in verticale una rotella la gira di un passo ogni 12 pixel (verso il basso = `-1`, verso l'alto = `+1`); se il dito si sposta meno di 4 pixel vale il tocco normale.

Facoltativa la tastiera: ←/→ scelgono la rotella (la sua finestra ha la cornice gialla, vedi 5.4), ↑ = `-1`, ↓ = `+1`, Invio = Prova.

### Bottone

Uno solo: `g.bottone("Prova", () => mossa({ tipo: "prova" }), { id: "prova", forte: true })`.

### Testi del fumetto (`g.messaggio`), esatti

Le candele in parole, `inParole(nere, bianche)` (da non confondere con la funzione `candele` della 3.2):

| nere, bianche | testo |
|---|---|
| 0, 0 | `Nessuna candela accesa` |
| n, 0 | `1 candela nera` · `2 candele nere` · `3 candele nere` |
| 0, b | `1 candela bianca` · `2 candele bianche` · … |
| n, b | `1 nera e 1 bianca` · `2 nere e 1 bianca` · `1 nera e 2 bianche` · `2 nere e 2 bianche` · … |

| quando | messaggio |
|---|---|
| inizio, giro senza tentativi | `Tocca sopra o sotto una rotella per girarla, poi premi «Prova».` |
| inizio, giro con tentativi già fatti (ricarica) | `Restano {k} tentativi: gira le rotelle e premi «Prova».` es. `Restano 4 tentativi: …`; con k = 1: `Resta 1 tentativo: gira le rotelle e premi «Prova».` |
| dopo un tentativo, ne restano 2 o più | `{inParole}. Restano {k} tentativi.` es. `1 nera e 2 bianche. Restano 3 tentativi.` |
| dopo un tentativo, ne resta 1 | `{inParole}. Ultimo tentativo!` |
| sesto tentativo senza aprire | `{inParole}. Il lucchetto ride e cancella tutto: si ricomincia.` |
| combinazione già provata | `Questa combinazione l'hai già provata: cambia almeno un simbolo.` |
| aperto | `Quattro candele nere: clac! Il lucchetto si apre.` |
| pagina aperta con il rompicapo già risolto | `Il lucchetto è aperto.` |

Girare una rotella non cambia il fumetto. Il testo di `g.errore` è `Sei tentativi senza aprire: il lucchetto si azzera` (il kit ci aggiunge da sé le dorate rimaste).

**Vittoria:** `g.risolto({ riepilogo, ritardo: 2600 })` (la carta arriva quando l'arco è scattato, vedi 5.7) con
`riepilogo = "Il lucchetto non poteva più cambiare idea: la combinazione era " + nomi + ". Aperto al " + n + "° tentativo."`, dove `nomi` sono i nomi dei quattro simboli separati da virgola e spazio (es. `occhio, occhio, teschio, croce`) e `n` il numero del tentativo nel giro.

### Carta iniziale (testo adattato alla variante)

I simboli cambiano per giocatore, quindi il testo va passato al kit. Si tiene un riferimento all'oggetto delle opzioni e lo si completa dentro `crea` (il kit legge `opzioni.testo` solo quando mostra la carta, dopo `crea`):

```js
const opzioni = { id: "lucchetto-lapidi", sfondo: "cancello", velo: 0.5, variante(rng) { … }, crea(g) {
  opzioni.testo = testoCarta(g.variante.simboli);
  …
} };
EscapeDemo.avvia(opzioni);
```

`testoCarta(simboli)` restituisce, con `{elenco}` = i sei nomi nell'ordine delle rotelle separati da `", "`:

```
Il cancello è chiuso da un lucchetto con quattro rotelle. Su ognuna si sceglie uno dei sei simboli incisi sulle lapidi del cortile ({elenco}), e lo stesso simbolo può tornare più volte. A ogni tentativo il lucchetto accende delle candele: una nera per ogni simbolo giusto al posto giusto, una bianca per ogni simbolo giusto ma al posto sbagliato. Hai sei tentativi: se li finisci senza aprire, il lucchetto si azzera e si ricomincia da capo.
Attenzione: il lucchetto è stregato e la combinazione non l'ha ancora decisa. Finché può cambia idea per farti sbagliare, ma non mente mai: le sue candele sono sempre giuste per almeno una combinazione.
```

(due paragrafi: fra «da capo.» e «Attenzione» c'è un `\n`).

## 5. Grafica

### 5.1 Sfondo e composizione

`sfondo: "cancello"`, `velo: 0.5`. Lo sfondo ha il cancello di ferro al centro (x 108…212), due pilastri con una lanterna in cima (lanterne centrate in x 100 e x 220, y 27…36), la luna in alto a sinistra e il vialetto in basso al centro. Sopra ci va, tutto dentro l'area di gioco:

| Elemento | Dove (pixel della scena) |
|---|---|
| Lanterne dei pilastri (fiamma animata sopra quella dello sfondo) | finestre `x cx−3…cx+3`, `y 27…36`, con `cx` = 100 e 220 |
| Catena fra i pilastri | `x 106…215`, `y 32…37` |
| Arco del lucchetto (acciaio) | sprite 57×27 in `(132, 22)` (aperto: 6 pixel più su) |
| Corpo del lucchetto (ottone) | `x 113…207`, `y 46…130` (95×85) |
| Sopracciglia e occhi del lucchetto | ciglia 11×2 in `(141, 47)` e `(169, 47)`; occhi 11×7 in `(141, 50)` e `(169, 50)` |
| Pannello scuro delle rotelle | `x 116…204`, `y 58…113` |
| Rotella `i` (i = 0…3) | tamburo 17×39 in `(X(i), 66)`, `X(i) = 119 + 22·i`; frecce 9×5 in `(X(i)+4, 60)` e `(X(i)+4, 107)` |
| Targhetta «TENTATIVO n/6» | `x 128…192`, `y 117…125` |
| Lapide sinistra (tentativi 1–3) | `x0 = 7`, `y0 = 50`: pietra 86×95 (`x 7…92`, `y 50…144`) e base fino a `y 151` |
| Lapide destra (tentativi 4–6) | `x0 = 228`, `y0 = 50` (`x 228…313`) |
| Corvo appollaiato sulla lapide destra (decorazione) | sprite 12×10 in `(280, 41)` |
| Zucco, che guarda il lucchetto dal vialetto | testa 14×13 in `(153, 138)`, ombra `(155, 151, 10×1)` |

La scena è simmetrica attorno a x 160 (corpo, rotelle e lapidi). Ordine di disegno su `g.ctx`, cancellato a ogni fotogramma: lanterne → catena → arco → corpo (con fessure e rivetti) → sopracciglia e occhi → pannello → rotelle → targhetta → lapidi → corvo → Zucco → effetti (scintille, lampo rosso).

Colori: solo `EscapeDemo.C` e `EscapeDemo.GEMME` (negli sprite sotto, `G.acquamarina[0]` ecc. sono le gemme). Unica eccezione: l'arancio scuro `#9c3b17` della testa di Zucco, preso dal suo sprite originale (è anche `--kit-arancio-scuro` del kit), perché Zucco deve avere i colori di Zucco.

Funzione di comodo usata sotto (non c'è nel kit, va scritta in `gioco.js`):

```js
/** Vela: colora solo i pixel dove il retino Bayer è sotto `quanto` (0..1); gli altri restano come sono. */
function vela(ctx, colore, x, y, w, h, quanto) {
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
    const px = x + i, py = y + j;
    if (EscapeDemo.BAYER[py & 3][px & 3] / 16 < quanto) EscapeDemo.rett(ctx, colore, px, py, 1, 1);
  }
}
/** Lo sprite tutto di un colore (sagoma): per i simboli che spuntano sopra e sotto la finestra delle rotelle. */
function sagoma(ctx, righe, colore, x, y) {
  const col = {};
  for (const r of righe) for (const ch of r) if (ch !== ".") col[ch] = colore;
  EscapeDemo.sprite(ctx, righe, col, x, y);
}
```

### 5.2 I sei simboli (11×11)

Si disegnano con `EscapeDemo.sprite(ctx, s.righe, s.colori, x, y)`. Ognuno ha un colore suo (bianco, verde acqua, giallo, viola, rosso, azzurro, verde, rosa) e una forma sua, così si distinguono anche da chi vede male i colori. Fra i disegni apposta non ci sono la candela (le candele sono le risposte del lucchetto) né la zucca (in scena c'è Zucco).

```js
const C = EscapeDemo.C, G = EscapeDemo.GEMME;
const SIMBOLI = {
  teschio: {
    colori: { k: C.bordo, w: C.bianco, s: C.pietraChiara },
    righe: [
      "...........",
      "...kkkkk...",
      "..kwwwwsk..",
      ".kwwwwwwsk.",
      ".kwwwwwwsk.",
      ".kwkkwkksk.",
      ".kwkkwkksk.",
      ".kwwwkwwsk.",
      "..kwwwwsk..",
      "..kwkwksk..",
      "...kkkkk...",
    ],
  },
  croce: {
    colori: { k: C.bordo, h: G.acquamarina[2], a: C.acqua, A: G.acquamarina[0] },
    righe: [
      "...kkkkk...",
      "...khaAk...",
      "kkkkhaAkkkk",
      "khhhhaahhhk",
      "kaaaaaaaaAk",
      "kAAAAaAAAAk",
      "kkkkhaAkkkk",
      "...khaAk...",
      "...khaAk...",
      "...khaAk...",
      "...kkkkk...",
    ],
  },
  luna: {
    colori: { k: C.bordo, l: C.luna, y: C.giallo, o: C.oro },
    righe: [
      "...kkkkk...",
      "..kllyyyk..",
      ".kllyykkk..",
      "kllyyk.....",
      "kllyk......",
      "klyyk......",
      "klyyk......",
      "kyyyok.....",
      ".kyyookkk..",
      "..kyooook..",
      "...kkkkk...",
    ],
  },
  pipistrello: {
    colori: { k: C.bordo, q: C.lilla, p: C.viola, y: C.giallo },
    righe: [
      "...........",
      "...k...k...",
      "k..kk.kk..k",
      "kk.kqkqk.kk",
      "kqkkqqqkkqk",
      "kqqkyqykqqk",
      "kqqqqqqqqpk",
      "kqqqqqqqppk",
      "kqpkqqqkppk",
      ".kk.kqk.kk.",
      ".....k.....",
    ],
  },
  ragno: {
    colori: { k: C.bordo, r: C.tappetoChiaro, R: C.tappeto, h: G.rubino[2], w: C.bianco },
    righe: [
      "..r.....r..",
      ".r..kkk..r.",
      ".r.khhrk.r.",
      "..rkhrrkr..",
      "rrrkrrRkrrr",
      "...kwRwk...",
      "rrkrrrRRkrr",
      "..rkrRRkr..",
      ".r.krRRk.r.",
      ".r..kkk..r.",
      "..r.....r..",
    ],
  },
  fantasma: {
    colori: { k: C.bordo, W: C.bianco, N: C.notteChiara, n: C.ferroChiaro },
    righe: [
      "...kkkkk...",
      "..kWWNNNk..",
      ".kWWNNNNNk.",
      ".kWkkNkkNk.",
      ".kNkkNkkNk.",
      ".kNNNNNNnk.",
      ".kNNNkNNnk.",
      ".kNNNNNNnk.",
      ".kNNNNNNnk.",
      ".kNkNNNkNk.",
      ".kk.kkk.kk.",
    ],
  },
  occhio: {
    colori: { k: C.bordo, W: C.bianco, s: C.pietraChiara, e: C.erbaChiara, E: C.erba },
    righe: [
      "...........",
      "..k.k.k.k..",
      "...kkkkk...",
      ".kkWeeeskk.",
      "kWWeWkeessk",
      "kWWekkkessk",
      "kWsEEkEEssk",
      ".kksEEEskk.",
      "...kkkkk...",
      "...........",
      "...........",
    ],
  },
  pozione: {
    colori: { k: C.bordo, f: C.legnoLuce, W: C.bianco, r: C.rosa, R: C.tappeto },
    righe: [
      "....kkk....",
      "...kfffk...",
      "....kkk....",
      "....kWk....",
      "...kkWkk...",
      "..kWrrrrk..",
      ".kWrrWrrRk.",
      ".krrrrrrRk.",
      ".krrrrrRRk.",
      "..kRRRRRk..",
      "...kkkkk...",
    ],
  },
};
```

### 5.3 Il lucchetto

**Catena** (dietro all'arco). Anelli visti di fronte e maglie viste di taglio, alternati ogni 6 pixel da x 106 finché ci stanno (`x + 8 ≤ 216`): prima tutte le maglie (in `(x, 34)`, ai passi dispari), poi tutti gli anelli (in `(x, 32)`, ai passi pari). Colori `{ k: C.bordo, s: C.pietraChiara, S: C.pietra, d: C.ferroChiaro }`.

```js
const ANELLO = [".kkkkkk.", "kssSSSdk", "ks.kk.dk", "kS.kk.dk", "kSdddddk", ".kkkkkk."];
const MAGLIA = ["kkkkkkkk", "ksSSSSdk", "kkkkkkkk"];
```

**Arco** in `(132, 22 − salto)`, `salto` = 0 chiuso, 6 aperto. Stessi colori della catena. Le righe 10…26 sono tutte uguali.

```js
const ARCO = [
  "....kkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkk....",
  "..kkssssssssssssssssssssssssssssssssssssssssssssssssskk..",
  ".kssSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSssk.",
  ".ksSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSddk.",
  "ksSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSddk",
  "ksSSSSSSSSdddddddddddddddddddddddddddddddddddddSSSSSSSddk",
  "ksSSSSSSSdddddddddddddddddddddddddddddddddddddddSSSSSSddk",
  "ksSSSSSSddkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkksdSSSSSddk",
  "ksSSSSSddk.....................................ksdSSSSddk",
  "ksSSSSddk.......................................ksSSSSddk",
  ...Array(17).fill("ksSSSddk.........................................ksSSSddk"),
];
```

Da aperto (`salto > 0`): la gamba destra resta infilata nel corpo, quindi si disegna `["ksSSSddk"]` in `(181, y)` per ogni `y` da `49 − salto` a `48`; la gamba sinistra esce e si chiude con il tappo `["ksSSSddk", ".kkkkkk."]` in `(132, 47 − salto)`. Il corpo, disegnato dopo, copre quello che entra.

**Corpo** (ottone, luce in alto a sinistra):

```js
const BX = 113, BY = 46, BW = 95, BH = 85;
const SMUSSA = [2, 1]; // angoli smussati
for (let r = 0; r < BH; r++) {               // sagoma scura
  const d = SMUSSA[r] ?? SMUSSA[BH - 1 - r] ?? 0;
  rett(ctx, C.bordo, BX + d, BY + r, BW - 2 * d, 1);
}
for (let r = 1; r < BH - 1; r++) {           // ottone
  const d = SMUSSA[r - 1] ?? SMUSSA[BH - 2 - r] ?? 0;
  rett(ctx, C.oroScuro, BX + 1 + d, BY + r, BW - 2 - 2 * d, 1);
}
rett(ctx, C.oro, BX + 2, BY + 1, BW - 4, 1);       // luce sopra
rett(ctx, C.oro, BX + 1, BY + 2, 1, BH - 4);       // luce a sinistra
rett(ctx, C.giallo, BX + 3, BY + 1, 10, 1);        // riflesso
rett(ctx, C.giallo, BX + 1, BY + 3, 1, 6);
rett(ctx, C.brace, BX + BW - 3, BY + 2, 2, BH - 4); // ombra a destra
rett(ctx, C.brace, BX + 2, BY + BH - 3, BW - 4, 2); // ombra sotto
rett(ctx, C.bordo, 133, BY, 6, 2);                  // fessure dell'arco
rett(ctx, C.bordo, 182, BY, 6, 2);
```

Rivetti `RIVETTO = [".k.", "kyk", ".k."]` con `{ k: C.legnoChiaro, y: C.giallo }` in `(117, 50)`, `(201, 50)`, `(117, 123)`, `(201, 123)`.

**Pannello:** `riquadro(ctx, 116, 58, 89, 56, C.legnoScuro)`, poi `rett(ctx, C.bordo, 117, 59, 87, 1)` (ombra interna) e `rett(ctx, C.oro, 116, 114, 89, 1)` (labbro di luce sotto).

**Targhetta:** `riquadro(ctx, 128, 117, 65, 9, C.oro)`, `rett(ctx, C.giallo, 129, 118, 63, 1)`, poi `testo(ctx, scritta, 160, 119, { piccolo: true, ombra: null, allinea: "centro", colore })` con `scritta` = `TENTATIVO n/6` (n = tentativi fatti + 1) in `C.legnoScuro`; al sesto (`TENTATIVO 6/6`) in `C.tappeto`; da aperto `APERTO` in `C.legnoScuro`.

**Occhi e sopracciglia.** Il lucchetto è stregato e ha una faccia: due occhi verde acqua che guardano il giocatore. Sprite 11×7; colori normali `{ k: C.bordo, a: C.acqua, h: G.acquamarina[2], A: G.acquamarina[0], K: C.bordo }`, da arrabbiato (`ride`) `{ k: C.bordo, a: C.tappetoChiaro, h: G.rubino[2], A: C.tappeto, K: C.bordo }`. L'occhio sinistro in `(141, 50)`, il destro in `(169, 50)`: il destro è **specchiato** (`{ specchia: true }`) solo per `ghigno` (che ha la palpebra storta); gli altri stati si disegnano uguali sui due lati. Le sopracciglia (colore `C.bordo`) in `(141, 47)` e, specchiate, in `(169, 47)`.

```js
const OCCHI = {
  normale:  ["..kkkkkkk..", ".khhaaaaak.", "khaaaKaaaak", "kaaaaKaaaak", "kaaaaKaaaAk", ".kaaaaaaAk.", "..kkkkkkk.."],
  sinistra: ["..kkkkkkk..", ".khhaaaaak.", "khaKaaaaaak", "kaaKaaaaaak", "kaaKaaaaaAk", ".kaaaaaaAk.", "..kkkkkkk.."],
  destra:   ["..kkkkkkk..", ".khhaaaaak.", "khaaaaaKaak", "kaaaaaaKaak", "kaaaaaaKaAk", ".kaaaaaaAk.", "..kkkkkkk.."],
  ghigno:   ["kkk........", "kaakkkk....", "kaaaaKakkk.", "kaaaaKaaaak", ".kaaaaaaAk.", "..kkkkkkk..", "..........."],
  sorpreso: ["..kkkkkkk..", ".khhaaaaak.", "khaaaaaaaak", "kaaaaKaaaak", "kaaaaaaaaAk", ".kaaaaaaAk.", "..kkkkkkk.."],
  ride:     ["...........", "...kkkkk...", "..kaaaaak..", ".kaakkkaak.", "kaak...kaak", "kkk.....kkk", "..........."],
  spento:   ["...........", "...........", "...........", ".kkkkkkkkk.", "..kkkkkkk..", "...........", "..........."],
};
const CIGLIA = {
  piatta:  ["...........", ".kkkkkkkkk."],
  cattiva: ["kkkkk......", "..kkkkkkkkk"],
  alta:    ["..kkkkkkk..", "..........."],
};
```

Sopracciglia per stato: `ghigno` e `ride` → `cattiva`; `sorpreso` → `alta`; tutti gli altri → `piatta`.

### 5.4 Le rotelle

Per ogni rotella `i`, con `x = X(i) = 119 + 22·i`, valore `v` e `scorrimento` (pixel interi, 0 da fermo; vedi 5.7):

```js
const FRECCIA_SU  = ["....k....", "...kWk...", "..kWWWk..", ".kWWWWsk.", ".kkkkkkk."];
const FRECCIA_GIU = [".kkkkkkk.", ".kWWWWsk.", "..kWWsk..", "...kWk...", "....k...."];
// colori: { k: C.bordo, W: C.pietraChiara, s: C.pietra }; freccia appena toccata (150 ms): { k: C.bordo, W: C.giallo, s: C.oro }

sprite(ctx, FRECCIA_SU, coloriFreccia, x + 4, 60);
sprite(ctx, FRECCIA_GIU, coloriFreccia, x + 4, 107);
riquadro(ctx, x, 66, 17, 39, C.ferro);            // tamburo
rett(ctx, C.ferroChiaro, x + 1, 67, 1, 37);       // luce a sinistra
rett(ctx, C.bordo, x + 15, 67, 1, 37);            // ombra a destra
// la striscia dei simboli, ritagliata dentro al tamburo (x+1…x+15, y 67…103):
ctx.save(); ctx.beginPath(); ctx.rect(x + 1, 67, 15, 37); ctx.clip();
for (let j = -2; j <= 2; j++) {
  const s = SIMBOLI[variante.simboli[(v + j + 12) % 6]];
  const y = 80 + 13 * j + scorrimento;
  if (Math.abs(13 * j + scorrimento) < 7) sprite(ctx, s.righe, s.colori, x + 3, y); // il più vicino alla finestra: a colori
  else sagoma(ctx, s.righe, C.ferroChiaro, x + 3, y);                               // gli altri: sagoma
}
ctx.restore();
vela(ctx, C.bordo, x + 1, 67, 15, 2, 0.75);       // il tamburo si incurva: bordi più scuri
vela(ctx, C.bordo, x + 1, 69, 15, 2, 0.4);
vela(ctx, C.bordo, x + 1, 100, 15, 2, 0.4);
vela(ctx, C.bordo, x + 1, 102, 15, 2, 0.75);
rett(ctx, cornice, x, 78, 17, 1);                 // la finestra: due righe d'ottone…
rett(ctx, cornice, x, 92, 17, 1);
rett(ctx, C.oroScuro, x, 79, 1, 13);              // …e i fianchi
rett(ctx, C.oroScuro, x + 16, 79, 1, 13);
```

Da ferma la rotella mostra il simbolo `v` a colori nella finestra (`y 80…90`), il precedente in sagoma sopra (`y 67…77`) e il successivo in sagoma sotto (`y 93…103`): si vede da sé dove toccare per avere quale simbolo. `cornice` = `C.oro`; `C.giallo` per la rotella scelta con la tastiera (se c'è).

### 5.5 Le lapidi

Due lapidi uguali, `lapide(x0, y0 = 50, prima)` con `prima` = 1 (sinistra, x0 = 7) o 4 (destra, x0 = 228). `FACCIA = C.ferroChiaro`, `LUCE = C.pietra`.

```js
const RIENTRO = [12, 8, 6, 4, 3, 2, 1, 1]; // la cima arrotondata, riga per riga
function sagomaLapide(x, y, w, h, colore) {
  for (let r = 0; r < h; r++) { const d = RIENTRO[r] ?? 0; rett(ctx, colore, x + d, y + r, w - 2 * d, 1); }
}
const w = 86, h = 95;
riquadro(ctx, x0 - 3, y0 + h - 1, w + 6, 8, C.ferroChiaro);   // base
rett(ctx, C.pietra, x0 - 2, y0 + h, w + 4, 1);
rett(ctx, C.ferro, x0 - 2, y0 + h + 5, w + 4, 1);
sagomaLapide(x0, y0, w, h, C.bordo);                          // contorno
sagomaLapide(x0 + 1, y0 + 1, w - 2, h - 1, C.ferro);          // ombra a destra
sagomaLapide(x0 + 1, y0 + 1, w - 4, h - 1, FACCIA);
sagomaLapide(x0 + 2, y0 + 2, w - 6, h - 2, FACCIA);
for (let r = 1; r < h - 1; r++) rett(ctx, LUCE, x0 + 1 + (RIENTRO[r] ?? 0), y0 + r, 1, 1); // luce a sinistra
sagomaLapide(x0 + 1, y0 + 1, w - 2, 1, LUCE);                 // luce in cima
vela(ctx, C.ferro, x0 + 2, y0 + h - 14, w - 4, 13, 0.25);     // grana in basso
// muschio in basso a sinistra e una crepa in alto a destra
for (const [mx, my, c] of [[2, 88, C.erba], [3, 89, C.erbaScura], [4, 90, C.erba], [2, 90, C.erbaChiara],
  [5, 91, C.erbaScura], [3, 91, C.erba], [w - 6, 90, C.erbaScura], [w - 5, 91, C.erba]]) rett(ctx, c, x0 + mx, y0 + my, 1, 1);
for (const [cx, cy] of [[w - 14, 4], [w - 13, 5], [w - 13, 6], [w - 12, 7], [w - 11, 8], [w - 11, 9]]) rett(ctx, C.ferro, x0 + cx, y0 + cy, 1, 1);
testo(ctx, "R.I.P.", x0 + w / 2, y0 + 5, { piccolo: true, colore: C.ferro, ombra: LUCE, allinea: "centro" });
```

Poi le tre righe `r = 0…2`, con `ry = y0 + 13 + 26·r` e `n = prima + r` (il numero del tentativo):

- **Numero** `testo(ctx, String(n), x0 + 5, ry + 9, { piccolo: true, colore: C.ferro, ombra: LUCE })`. La riga del **prossimo** tentativo (`n = tentativi + 1`, solo se il lucchetto è chiuso) ha il numero in `C.giallo` con ombra `C.bordo` e una freccetta gialla a sinistra: `rett(C.giallo, x0 + 2, ry + 10, 1, 3)` e `rett(C.giallo, x0 + 3, ry + 11, 1, 1)`.
- **Quattro incavi** 13×13, uno per rotella, in `sx = x0 + 10 + 14·i`, `sy = ry + 5`: `rett(C.ferro, sx, sy, 13, 13)`, ombra in alto e a sinistra `rett(C.bordo, sx, sy, 13, 1)` e `rett(C.bordo, sx, sy, 1, 13)`, luce in basso e a destra `rett(LUCE, sx + 1, sy + 13, 13, 1)` e `rett(LUCE, sx + 13, sy + 1, 1, 13)`. Se il tentativo `n` c'è, dentro va il simbolo `codice[i]` in `(sx + 1, sy + 1)`.
- **Quattro candele** in un quadrato 2×2: riquadri 7×12 in `(x0 + 66, ry)`, `(x0 + 74, ry)`, `(x0 + 66, ry + 12)`, `(x0 + 74, ry + 12)`. Si riempiono in quest'ordine: prima le nere, poi le bianche; le altre restano piattini vuoti. Le righe senza tentativo hanno quattro piattini vuoti.

```js
const PIATTINO = ["kkkkkkk", ".kdddk."];                         // { k: C.bordo, d: C.ferro }, in (x, y + 10)
const CERA = {                                                    // in (x + 1, y + 4)
  nera:   ["kkkkk", "kmnnk", "kmnnk", "kmnnk", "kmnnk", "kmnnk"],  // { k: C.bordo, m: C.ferro, n: C.nero }
  bianca: ["kkkkk", "kWWsk", "kWWsk", "kWWsk", "kWWsk", "kWssk"],  // { k: C.bordo, W: C.bianco, s: C.pietraChiara }
};
const FIAMMA = [                                                  // in (x + 1, y), due fotogrammi
  ["..y..", ".yhy.", ".yhy.", "..k.."],                           // { y: C.fiamma, h: C.fiammaChiara, k: C.bordo }
  [".y...", "..yy.", ".yhy.", "..k.."],
];
```

La nera è cera nera con il filo di luce a sinistra, la bianca è cera bianca: si distinguono a colpo d'occhio anche sul telefono. Nessuna scritta accanto alle candele.

### 5.6 Corvo, Zucco, lanterne, scintille

```js
// Corvo (decorazione), in (280, 41), girato verso il lucchetto. { k: C.bordo, n: C.violaScuro, m: C.viola, y: C.giallo, O: C.oro }
const CORVO = [
  "...kkk......",
  "..knnnk.....",
  ".knynnnk....",
  "kOOknnnk....",
  ".kkknnnnkk..",
  "...knnnnnnk.",
  "...knmmmnnnk",
  "....knmmmnnk",
  ".....knnnnk.",
  "......kOkOk.",
];
const CORVO_GRACCHIA = [ // becco aperto
  "...kkk......",
  "..knnnk.....",
  "kknynnnk....",
  "kOOknnnk....",
  "kOOknnnnkk..",
  ".kkknnnnnnk.",
  "...knmmmnnnk",
  "....knmmmnnk",
  ".....knnnnk.",
  "......kOkOk.",
];

// Zucco (testa di sprite-provvisori.js della fuga di Zucco), in (153, 138).
// { k: C.bordo, o: "#9c3b17", O: C.brace, y: C.fiamma, h: C.fiammaChiara, b: C.legno, G: C.erbaScura, g: C.erba, E: C.oro, e: C.luna }
const TESTA_ZUCCO = [
  "......Gg......",
  ".....GGg......",
  "..kkkkkkkkkk..",
  ".koOOyyyOOOok.",
  "koOOyyhyyOOOok",
  "koOyEEyyOEEOok",
  "koOEeeEyOEeeEk",
  "koOOEEOOEOEEOk",
  "koOOOOOEEOOOOk",
  "koObEbEbEbEbOk",
  "kooOeEeEeEeOok",
  ".kooOOOOOOOok.",
  "..kkkkkkkkkk..",
];

// Scintille dell'apertura, due fotogrammi. { W: C.bianco, y: C.giallo }
const STELLA = [
  ["..y..", "..y..", "yyWyy", "..y..", "..y.."],
  [".....", "..y..", ".yWy.", "..y..", "....."],
];
```

**Lanterne** (sopra le due dello sfondo, `cx` = 100 e 220): fotogramma A `rett(C.fiammaChiara, cx−3, 27, 7, 10)`, `rett(C.fiamma, cx−3, 32, 7, 5)`, `rett(C.bianco, cx−2, 29, 1, 2)`, `rett(C.bordo, cx, 27, 1, 10)`; fotogramma B uguale ma con `rett(C.fiamma, cx−3, 30, 7, 7)` e il bianco in `(cx+1, 30)`. La sinistra usa B quando `g.fotogramma % 3 === 0`, la destra quando `g.fotogramma % 5 === 1`; altrimenti A.

### 5.7 Stati visivi e animazioni

Animazioni continue a 8 fotogrammi al secondo (`g.fotogramma`), sfasate fra loro:

- **fiamme delle candele**: fotogramma `Math.floor((g.fotogramma + 3·k + 5·riga) / 2) % 2` (k = posto della candela 0…3, riga = numero del tentativo);
- **lanterne**: come sopra;
- **occhi del lucchetto** a riposo (`normale`): ogni 40 fotogrammi uno è `spento` (battito di palpebre);
- **Zucco** respira: testa in `y 138` o `139` alternando ogni 4 fotogrammi (l'ombra resta ferma);
- **corvo**: ogni 32 fotogrammi, per un fotogramma, l'occhio `y` diventa `n` (chiude l'occhio).

Animazioni di un'azione (tempi da quando la mossa è stata applicata; lo **stato è già cambiato subito**, il disegno insegue):

| azione | cosa si vede |
|---|---|
| girare una rotella | la freccia toccata diventa gialla per 150 ms; la striscia scorre: `scorrimento` parte da `13·verso` e torna a 0 in 160 ms (`Math.round(13·verso·(1 − t/160))`) |
| combinazione già provata | gli incavi della riga che la contiene hanno il bordo `C.giallo` invece di `C.bordo` per 3 fotogrammi |
| **Prova** (ogni tentativo) | 0–400 ms il lucchetto «ci pensa»: occhi `sinistra` (0–100), `destra` (100–200), `sinistra` (200–300), `destra` (300–400). Da 400 ms i quattro simboli si incidono nella riga uno alla volta, il simbolo `i` a `400 + 80·i` ms. Le candele accese compaiono una alla volta, la `k`-esima (prima le nere) a `720 + 150·k` ms. A 1.200 ms tutto è inciso: occhi `ghigno` fino a 2.100 ms (ha cambiato idea e se la ride), poi `normale` |
| **sesto tentativo sbagliato** | come Prova fino a 1.200 ms (riga 6 incisa con le sue candele); poi, invece del ghigno: occhi `ride` in rosso da 1.200 a 2.800 ms, su e giù di 1 pixel a fotogrammi alterni; corvo `CORVO_GRACCHIA` alternato a `CORVO` a ogni fotogramma nello stesso intervallo; lampo rosso da 1.200 a 1.575 ms (3 fotogrammi): un contorno di 1 pixel `C.tappetoChiaro` attorno al corpo (`x 112…208`, `y 45…131`); Zucco trema da 1.200 a 1.950 ms (x +1 e −1 a fotogrammi alterni). Da 1.600 a 2.100 ms le sei righe si sbriciolano: sopra ogni incavo `vela(ctx, FACCIA, sx, sy, 14, 14, quanto)` e sopra ogni gruppo di candele `vela(ctx, FACCIA, x0 + 66, ry, 15, 24, quanto)`, con `quanto` 0.25, 0.5, 0.75, 1 (un passo ogni 125 ms); poi lapidi vuote |
| **aperto** | come Prova fino a 1.200 ms (quattro candele nere); poi occhi `sorpreso` fino a 1.700 ms, poi `spento` per sempre (l'incantesimo è rotto); da 1.700 ms l'arco sale di 1 pixel ogni 50 ms fino a `salto = 6` (a 2.000 ms), con la gamba sinistra fuori; da 2.000 a 3.200 ms quattro `STELLA` lampeggiano attorno all'arco, centrate in `(124, 18)`, `(194, 22)`, `(126, 40)`, `(198, 42)` (sprite 5×5 in `(cx − 2, cy − 2)`; fotogramma `(g.fotogramma + j) % 2` per la stella `j`); da 2.000 ms Zucco saltella: `y` della testa `−2, −4, −4, −2, 0` due volte, un passo per fotogramma. Targhetta `APERTO` subito |

Per lo sbriciolamento serve una copia dei sei tentativi tenuta **solo per il disegno** (lo stato è già azzerato): una `animazione` decorativa con l'inizio, il tipo e le righe da mostrare. Finché dura (fino a 2.100 ms) le lapidi disegnano quelle righe invece di `stato.tentativi` e nessuna riga ha il numero giallo; poi tornano allo stato (vuote, riga 1 evidenziata). Se arriva una mossa nuova mentre un'animazione è in corso, quella vecchia salta subito al suo stato finale e parte la nuova (nessun pezzo resta a metà).

Il ritaglio della striscia delle rotelle con `ctx.rect` + `ctx.clip()` su un rettangolo a coordinate intere è ammesso: non disegna niente, limita solo dove finiscono i rettangoli degli sprite.

**`g.riduciMovimento`:** niente animazioni continue (fiamme e lanterne fisse al fotogramma 0, niente battiti, respiri o corvo che chiude l'occhio) e ogni azione salta subito allo stato finale: rotella già ferma, riga già incisa con le candele, occhi `normale` (o `spento` da aperto), arco già a `salto = 6`, lapidi già vuote dopo l'errore.

**Già risolto** (`g.giaRisolto`): si riparte da `g.memoria.stato` (che ha `aperto: true` e i tentativi del giro vincente, l'ultimo con le quattro nere): lapidi incise, arco aperto (`salto = 6`), occhi `spento`, targhetta `APERTO`, niente scintille; fumetto `Il lucchetto è aperto.` Se la memoria manca, lo stesso con lapidi vuote e rotelle a 0.

## 6. Aggancio per le prove

```js
g.espone({
  gioca: (m) => mossa(m),          // la stessa funzione dei tocchi e del bottone: applica, salva la memoria, messaggi,
                                   // avvia le animazioni e RITORNA l'esito di applica (tabella sotto)
  statoGioco: () => ({
    rotelle: [...stato.rotelle],                                                     // es. [0, 0, 1, 1]
    tentativi: stato.tentativi.map((t) => ({ codice: [...t.codice], nere: t.nere, bianche: t.bianche })),
    rimasti: 6 - stato.tentativi.length,
    giro: stato.giro,
    aperto: stato.aperto,
  }),
  posizione: (i, verso) => ({ x: 119 + 22 * i + 8, y: verso < 0 ? 62 : 109 }), // centro della freccia su (−1) o giù (+1)
});
```

Mosse ed esiti, esattamente (sezione 3.3):

| mossa | esito |
|---|---|
| `{ tipo: "rotella", rotella: 0..3, verso: 1 \| -1 }` | `{ ok: true, rotelle: [...] }` |
| `{ tipo: "prova" }` o `{ tipo: "prova", codice: [a,b,c,d] }` | `{ ok: true, nere, bianche, tentativo, rimasti }` · `{ errore: true, nere, bianche, tentativo: 6, motivo }` · `{ risolto: true, nere: 4, bianche: 0, tentativo }` |
| non valida, combinazione già provata nel giro | `{ valida: false, motivo }` (stato invariato, nessun errore) |

`statoGioco()` non contiene mai le combinazioni vive. Il bottone ha `data-azione="prova"` (lo mette il kit con `id: "prova"`).

## 7. Criteri di accettazione

Giocando e guardando le foto (`node demo/comune/prova.mjs lucchetto-lapidi` deve finire con «TUTTO OK»):

1. Il lucchetto d'ottone è il centro della scena, appeso alla catena fra i due pilastri; si legge subito come un lucchetto con quattro rotelle; gli occhi verde acqua hanno un'espressione (normale, ci pensa, ghigno, ride in rosso, sorpreso, spento).
2. Ogni rotella mostra il suo simbolo a colori nella finestra d'ottone e in sagoma il precedente sopra e il successivo sotto; toccare sopra o sotto la gira, con lo scorrimento e la freccia che si illumina.
3. I sei simboli della variante si distinguono fra loro a colpo d'occhio, anche sul telefono (foto `telefono.png`), per forma e colore.
4. Dopo **Prova** la combinazione compare incisa sulla riga giusta (1–3 a sinistra, 4–6 a destra), con le candele accese: nere prima, bianche poi, piattini vuoti per il resto. La riga del prossimo tentativo ha il numero giallo e la freccetta.
5. La targhetta dice `TENTATIVO n/6` (in rosso al sesto) e `APERTO` alla fine.
6. Il fumetto dice ogni volta le candele in parole e i tentativi rimasti, con i testi esatti della sezione 4.
7. Finiti i sei tentativi: avviso del kit, lucchetto che ride in rosso, corvo che gracchia, lampo rosso, righe che si sbriciolano, lapidi vuote; il giro riparte e le dorate scendono secondo la scheda.
8. Una combinazione già provata nel giro viene rifiutata col suo messaggio, la sua riga lampeggia gialla, nessun tentativo consumato.
9. Ricaricando a metà giro le lapidi restano incise e i tentativi rimasti sono gli stessi.
10. All'apertura: quattro candele nere, occhi sorpresi e poi chiusi, arco che scatta in su con la gamba sinistra fuori, scintille, Zucco che saltella, poi la carta della vittoria con il riepilogo; ricaricando, la scena resta aperta.
11. Niente fuori dall'area di gioco (`y 18…152`) tranne l'arco aperto e le scintille, che arrivano a y 16; niente testo HTML nella scena, solo pixel interi, solo i colori della paletta (più l'arancio di Zucco).
12. Con «riduci movimento» tutto arriva subito allo stato finale e niente si muove da solo.
