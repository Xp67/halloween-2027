# Le cinque tombe — istruzioni per il costruttore

Rompicapo della **Sala del tesoro**, difficoltà 5, vale **5 dorate**, una in meno ogni **3 errori** (lo fa il kit). Leggi prima `../REGOLE_COMUNI.md`, `../comune/kit.js` e `../_esempio/`: qui c'è solo quello che è specifico di questo rompicapo.

Il generatore della variante, gli sprite e le funzioni di disegno qui sotto **sono già stati provati** (in Node e in un'anteprima sullo sfondo vero, con il kit): copiali così come sono. Il tuo lavoro è lo stato, le mosse, i tocchi, i messaggi, le animazioni e l'aggancio per le prove.

## 1. In breve

Nella cripta ci sono cinque tombe in fila. Ognuna ha una lapide (il colore), un ritratto ovale (il mostro) e tre nicchie (bevanda, dolce, animale): sono le 25 caselle del **registro**. Sul muro, su 14–17 targhe di pietra, sono disegnati gli indizi (toccandone una si legge la frase intera). Il giocatore tocca una casella, sceglie cosa metterci da una finestrella e può segnare dei NO, come le crocette sul quaderno. Quando il registro è pieno preme «Controlla»: se è tutto giusto le lapidi si accendono e la cripta si apre; se è sbagliato è un errore e il gioco **non dice dove**.

## 2. Variante

### Valori e indici

Gli indici valgono ovunque (variante, mosse, stato, disegno). **Tomba** `p` = 0…4 da sinistra (sullo schermo 1…5). **Carattere** `a`:

| `a` | carattere | valori `v` = 0, 1, 2, 3, 4 |
|---|---|---|
| 0 | lapide | nera, bianca, rossa, verde, viola |
| 1 | mostro | vampiro, mummia, lupo mannaro, strega, zombie |
| 2 | bevanda | sangue, tè, latte, pozione, succo di zucca |
| 3 | dolce | liquirizia, marzapane, caramella mou, cioccolato, zucchero filato |
| 4 | animale | gatto nero, corvo, pipistrello, ragno, rospo |

### Formato della variante

```js
{
  indizi: [ // da 14 a 17, nell'ordine in cui stanno sul muro (indizio i → targa i)
    { tipo: "accanto", x: [2, 2], y: [0, 1], testo: "La tomba di chi beve latte è accanto a quella con la lapide bianca." },
    { tipo: "posto", x: [4, 2], n: 4, testo: "La tomba con il pipistrello è la quinta da sinistra." },
    …
  ],
  soluzione: [[0, 3, 1, 2, 4], [2, 3, 4, 1, 0], …], // soluzione[a][p] = valore del carattere a nella tomba p
}
```

- `x`, `y`: coppie `[a, v]` (carattere, valore). `posto` non ha `y` ma ha `n` (la tomba, 0…4).
- I cinque tipi: **`stessa`** (x e y nella stessa tomba), **`diversa`** (x e y in tombe diverse), **`posto`** (x nella tomba n), **`sinistra`** (la tomba di x è **subito** a sinistra di quella di y), **`accanto`** (tombe vicine, in un verso o nell'altro).
- In `stessa` e `diversa`, se c'è un mostro è sempre `x` (fa da soggetto della frase).
- `testo`: la frase italiana, costruita dal codice qui sotto. La verifica la ricostruisce e la confronta lettera per lettera.

### Il generatore (da copiare così com'è)

È il generatore del catalogo (soluzione a caso, indizi veri aggiunti a caso finché la soluzione è una sola, poi tolti in ordine casuale quelli che non servono) con un risolutore molto più veloce: **circa 1 ms** per variante (massimo 9 ms su 3000 semi), quindi gira nel browser all'apertura, niente scorte. Tiene la griglia solo se restano **da 14 a 17 indizi**, tutti necessari, e se si risolve **ragionando** (propagazione più al massimo 5 prove di un passo: niente griglie che richiedono di tirare a indovinare); altrimenti ne genera un'altra con lo stesso `rng`.

In `gioco.js`: `const { mescola } = EscapeDemo;` prima di questo blocco, e l'avvio è

```js
const opzioni = {
  id: "cinque-tombe",
  sfondo: "sala-del-tesoro",
  velo: 0.55,
  variante(rng) { return creaVariante(rng); },
  crea(g) { /* … per prima cosa opzioni.testo = … (§4) */ },
};
EscapeDemo.avvia(opzioni);
```

`index.html` è la copia di `_esempio/index.html` con `<title>Le cinque tombe</title>`.

```js
// ── La variante: griglia logica generata per giocatore ──
// Soluzione a caso; indizi veri aggiunti a caso finché la soluzione è una sola; poi tolti, in ordine casuale, quelli
// che non servono. Si tiene la griglia solo se restano da 14 a 17 indizi e se si risolve ragionando (vedi difficolta);
// altrimenti se ne genera un'altra. Circa 2 ms per griglia.

const VALORI = [
  ["nera", "bianca", "rossa", "verde", "viola"], // 0 lapide
  ["vampiro", "mummia", "lupo mannaro", "strega", "zombie"], // 1 mostro
  ["sangue", "tè", "latte", "pozione", "succo di zucca"], // 2 bevanda
  ["liquirizia", "marzapane", "caramella mou", "cioccolato", "zucchero filato"], // 3 dolce
  ["gatto nero", "corvo", "pipistrello", "ragno", "rospo"], // 4 animale
];

// Domini: D[a * 5 + v] è una maschera di 5 bit con le tombe dove può stare il valore v del carattere a
// (bit p acceso = può stare nella tomba p; tomba 0 = la prima a sinistra).
const TUTTE = 31;
const bit = (p) => 1 << p;
const unico = (m) => m !== 0 && (m & (m - 1)) === 0;
const quante = (m) => { let n = 0; while (m) { n += m & 1; m >>= 1; } return n; };
const tombaDi = (m) => 31 - Math.clz32(m);
const aDestra = (m) => (m << 1) & TUTTE;
const aSinistra = (m) => m >> 1;

/** Restringe i domini secondo gli indizi e le regole della griglia. Ritorna false se si arriva a una contraddizione. */
function propaga(D, indizi) {
  let cambiato = true;
  while (cambiato) {
    cambiato = false;
    const metti = (i, m) => { if (m !== D[i]) { D[i] = m; cambiato = true; } return m !== 0; };
    for (const c of indizi) {
      const i = c.x[0] * 5 + c.x[1];
      const j = c.y ? c.y[0] * 5 + c.y[1] : -1;
      if (c.t === "posto") {
        if (!metti(i, D[i] & bit(c.n))) return false;
      } else if (c.t === "stessa") {
        const m = D[i] & D[j];
        if (!metti(i, m) || !metti(j, m)) return false;
      } else if (c.t === "diversa") {
        if (unico(D[i]) && !metti(j, D[j] & ~D[i])) return false;
        if (unico(D[j]) && !metti(i, D[i] & ~D[j])) return false;
      } else if (c.t === "sinistra") { // x subito a sinistra di y
        if (!metti(i, D[i] & aSinistra(D[j]))) return false;
        if (!metti(j, D[j] & aDestra(D[i]))) return false;
      } else if (c.t === "accanto") {
        if (!metti(i, D[i] & (aSinistra(D[j]) | aDestra(D[j])))) return false;
        if (!metti(j, D[j] & (aSinistra(D[i]) | aDestra(D[i])))) return false;
      }
    }
    for (let a = 0; a < 5; a++) {
      // un valore già al suo posto toglie quella tomba agli altri valori dello stesso carattere
      for (let v = 0; v < 5; v++) {
        const m = D[a * 5 + v];
        if (m === 0) return false;
        if (unico(m))
          for (let w = 0; w < 5; w++)
            if (w !== v && (D[a * 5 + w] & m) && !metti(a * 5 + w, D[a * 5 + w] & ~m)) return false;
      }
      // una tomba dove può stare un solo valore del carattere: è sua
      for (let p = 0; p < 5; p++) {
        let chi = -1, n = 0;
        for (let v = 0; v < 5; v++) if (D[a * 5 + v] & bit(p)) { n++; chi = v; }
        if (n === 0) return false;
        if (n === 1 && !unico(D[a * 5 + chi])) metti(a * 5 + chi, bit(p));
      }
    }
  }
  return true;
}

/** dove[a][v] = tomba del valore v del carattere a. */
function eVero(c, dove) {
  const p = (x) => dove[x[0]][x[1]];
  if (c.t === "posto") return p(c.x) === c.n;
  if (c.t === "stessa") return p(c.x) === p(c.y);
  if (c.t === "diversa") return p(c.x) !== p(c.y);
  if (c.t === "sinistra") return p(c.x) + 1 === p(c.y);
  return Math.abs(p(c.x) - p(c.y)) === 1; // accanto
}

/** Quante soluzioni hanno gli indizi (si ferma a `limite`). */
function contaSoluzioni(indizi, limite) {
  let n = 0;
  (function cerca(D) {
    if (n >= limite || !propaga(D, indizi)) return;
    let scelto = -1, minimo = 9;
    for (let i = 0; i < 25; i++) {
      const k = quante(D[i]);
      if (k > 1 && k < minimo) { minimo = k; scelto = i; }
    }
    if (scelto < 0) {
      const dove = [0, 1, 2, 3, 4].map((a) => [0, 1, 2, 3, 4].map((v) => tombaDi(D[a * 5 + v])));
      if (indizi.every((c) => eVero(c, dove))) n++;
      return;
    }
    for (let p = 0; p < 5 && n < limite; p++)
      if (D[scelto] & bit(p)) {
        const E = D.slice();
        E[scelto] = bit(p);
        cerca(E);
      }
  })(new Array(25).fill(TUTTE));
  return n;
}

/** Un indizio vero a caso (stesse probabilità del generatore del catalogo). */
function indizioACaso(rng, dove) {
  const valore = () => [Math.floor(rng() * 5), Math.floor(rng() * 5)];
  const d = (x) => dove[x[0]][x[1]];
  for (;;) {
    const q = rng();
    const x = valore();
    if (q < 0.08) return { t: "posto", x, n: d(x) };
    let y = valore();
    while (y[0] === x[0]) y = valore();
    const dx = d(x), dy = d(y);
    if (q < 0.45) return { t: "stessa", x, y: [y[0], dove[y[0]].indexOf(dx)] };
    if (q < 0.65) {
      if (dx + 1 === dy) return { t: "sinistra", x, y };
      if (dy + 1 === dx) return { t: "sinistra", x: y, y: x };
      continue;
    }
    if (q < 0.9) {
      if (Math.abs(dx - dy) === 1) return { t: "accanto", x, y };
      continue;
    }
    if (dx !== dy) return { t: "diversa", x, y };
  }
}

/**
 * Quanto è difficile: livello 1 se basta la propagazione; livello 2 se servono anche prove di un passo
 * («se il valore fosse in questa tomba, si arriverebbe a una contraddizione»), contate in `prove`; 3 se non basta.
 */
function difficolta(indizi) {
  const D = new Array(25).fill(TUTTE);
  if (!propaga(D, indizi)) return { livello: 0, prove: 0 };
  let prove = 0;
  while (!D.every(unico)) {
    let progresso = false;
    for (let i = 0; i < 25 && !progresso; i++) {
      if (unico(D[i])) continue;
      for (let p = 0; p < 5; p++) {
        if (!(D[i] & bit(p))) continue;
        const E = D.slice();
        E[i] = bit(p);
        if (!propaga(E, indizi)) { D[i] &= ~bit(p); prove++; progresso = true; break; }
      }
    }
    if (!progresso) return { livello: 3, prove };
    if (!propaga(D, indizi)) return { livello: 0, prove };
  }
  return { livello: prove === 0 ? 1 : 2, prove };
}

function generaGriglia(rng) {
  for (;;) {
    const dove = VALORI.map(() => mescola(rng, [0, 1, 2, 3, 4]));
    let indizi = [];
    while (contaSoluzioni(indizi, 2) > 1) indizi.push(indizioACaso(rng, dove));
    const tolti = new Set();
    for (const i of mescola(rng, [...indizi.keys()])) {
      const prova = indizi.filter((_, j) => j !== i && !tolti.has(j));
      if (contaSoluzioni(prova, 2) === 1) tolti.add(i);
    }
    indizi = indizi.filter((_, j) => !tolti.has(j));
    const { livello, prove } = difficolta(indizi);
    if (indizi.length >= 14 && indizi.length <= 17 && (livello === 1 || (livello === 2 && prove <= 5))) return { dove, indizi };
  }
}

// ── Le frasi degli indizi ──
const ORDINALI = ["prima", "seconda", "terza", "quarta", "quinta"];
const ART_MOSTRO = ["il", "la", "il", "la", "lo"];
const DI_MOSTRO = ["del", "della", "del", "della", "dello"];
/** «beve sangue», «beve la pozione», «mangia la caramella mou», … */
const cosa = (a, v) => (a === 2 && v === 3) || (a === 3 && v === 2) ? `la ${VALORI[a][v]}` : VALORI[a][v];
function soggetto([a, v]) {
  if (a === 0) return `chi riposa sotto la lapide ${VALORI[0][v]}`;
  if (a === 1) return `${ART_MOSTRO[v]} ${VALORI[1][v]}`;
  if (a === 2) return `chi beve ${cosa(2, v)}`;
  if (a === 3) return `chi mangia ${cosa(3, v)}`;
  return `chi ha il ${VALORI[4][v]}`;
}
function predicato([a, v]) {
  if (a === 0) return `riposa sotto la lapide ${VALORI[0][v]}`;
  if (a === 2) return `beve ${cosa(2, v)}`;
  if (a === 3) return `mangia ${cosa(3, v)}`;
  return `ha il ${VALORI[4][v]}`; // a === 4 (il mostro è sempre il soggetto)
}
function tomba([a, v], inizio) {
  if (a === 0) return `${inizio} con la lapide ${VALORI[0][v]}`;
  if (a === 1) return `${inizio} ${DI_MOSTRO[v]} ${VALORI[1][v]}`;
  if (a === 2) return `${inizio} di chi beve ${cosa(2, v)}`;
  if (a === 3) return `${inizio} di chi mangia ${cosa(3, v)}`;
  return `${inizio} con il ${VALORI[4][v]}`;
}
const maiuscola = (s) => s[0].toUpperCase() + s.slice(1);
function frase(ind) {
  if (ind.tipo === "stessa") return maiuscola(`${soggetto(ind.x)} ${predicato(ind.y)}.`);
  if (ind.tipo === "diversa") return maiuscola(`${soggetto(ind.x)} non ${predicato(ind.y)}.`);
  if (ind.tipo === "posto") return `${maiuscola(tomba(ind.x, "la tomba"))} è la ${ORDINALI[ind.n]} da sinistra.`;
  if (ind.tipo === "sinistra") return `${maiuscola(tomba(ind.x, "la tomba"))} è subito a sinistra di ${tomba(ind.y, "quella")}.`;
  return `${maiuscola(tomba(ind.x, "la tomba"))} è accanto a ${tomba(ind.y, "quella")}.`; // accanto
}

/** La variante del giocatore: da chiamare in `variante(rng)` di EscapeDemo.avvia. */
function creaVariante(rng) {
  const { dove, indizi } = generaGriglia(rng);
  // soluzione[a][p] = valore del carattere a nella tomba p
  const soluzione = dove.map((d) => { const s = [0, 0, 0, 0, 0]; d.forEach((p, v) => { s[p] = v; }); return s; });
  const lista = mescola(rng, indizi).map((c) => {
    let x = c.x, y = c.y;
    // nelle frasi «stessa» e «diversa» il mostro fa sempre da soggetto
    if ((c.t === "stessa" || c.t === "diversa") && y[0] === 1) [x, y] = [y, x];
    const ind = c.t === "posto" ? { tipo: "posto", x, n: c.n } : { tipo: c.t, x, y };
    ind.testo = frase(ind);
    return ind;
  });
  return { indizi: lista, soluzione };
}
```

### Esempi (se il codice è copiato esattamente)

**Seme 12345** (quello delle foto di `prova.mjs`), 15 indizi:

1. La tomba di chi beve latte è accanto a quella con la lapide bianca.
2. Chi riposa sotto la lapide rossa beve la pozione.
3. Chi ha il pipistrello riposa sotto la lapide viola.
4. Chi mangia liquirizia riposa sotto la lapide bianca.
5. Chi mangia marzapane riposa sotto la lapide nera.
6. La tomba con il corvo è subito a sinistra di quella del vampiro.
7. Chi ha il pipistrello beve succo di zucca.
8. La tomba con il pipistrello è la quinta da sinistra.
9. La tomba del lupo mannaro è la prima da sinistra.
10. Lo zombie mangia liquirizia.
11. Chi mangia liquirizia ha il rospo.
12. Chi ha il gatto nero beve sangue.
13. La tomba del lupo mannaro è accanto a quella di chi mangia la caramella mou.
14. La mummia mangia cioccolato.
15. Chi beve la pozione mangia cioccolato.

I primi tre in JSON: `{"tipo":"accanto","x":[2,2],"y":[0,1],…}`, `{"tipo":"stessa","x":[0,2],"y":[2,3],…}`, `{"tipo":"stessa","x":[4,2],"y":[0,4],…}`.
`soluzione = [[0,3,1,2,4],[2,3,4,1,0],[0,2,1,3,4],[1,2,0,3,4],[0,3,4,1,2]]`, cioè:

- Tomba 1: lapide nera, lupo mannaro, sangue, marzapane, gatto nero.
- Tomba 2: lapide verde, strega, latte, caramella mou, ragno.
- Tomba 3: lapide bianca, zombie, tè, liquirizia, rospo.
- Tomba 4: lapide rossa, mummia, pozione, cioccolato, corvo.
- Tomba 5: lapide viola, vampiro, succo di zucca, zucchero filato, pipistrello.

**Seme 1**, 15 indizi; il primo è `{"tipo":"stessa","x":[1,2],"y":[0,4],"testo":"Il lupo mannaro riposa sotto la lapide viola."}`, il secondo `{"tipo":"sinistra","x":[3,3],"y":[0,1],"testo":"La tomba di chi mangia cioccolato è subito a sinistra di quella con la lapide bianca."}`; `soluzione = [[3,2,1,4,0],[0,3,1,2,4],[1,2,4,3,0],[4,3,1,0,2],[3,2,4,0,1]]`.

## 3. Regole e mosse

### Lo stato

Scrivilo come dati puri, con una funzione `applica(stato, mossa, soluzione) → { stato, esito }` che non disegna niente; il disegno e i messaggi leggono l'esito.

```js
{
  registro: [[null, null, null, null, null], …], // 5×5: registro[a][p] = valore messo (0…4) o null
  esclusi:  [[[], [], [], [], []], …],          // 5×5: esclusi[a][p] = valori segnati NO, in ordine crescente
  usati: [],                                     // indici delle targhe segnate come usate, in ordine crescente
}
```

Fuori dallo stato logico (solo interfaccia): la casella con la finestra aperta, la targa selezionata, la conferma di «Svuota», gli istanti delle animazioni.

### Le mosse

| Mossa | Cosa fa | Esito |
|---|---|---|
| `{ metti: [a, p, v] }` | mette il valore `v` nella casella (carattere `a`, tomba `p`). Se `v` era già in un'altra tomba `q`, da lì sparisce (un valore sta in una tomba sola). Se `v` era fra gli esclusi della casella, il NO si toglie. Se la casella conteneva già `v`, non cambia niente. | `{ ok: true }`, oppure `{ ok: true, da: q }` se è stato spostato |
| `{ togli: [a, p] }` | svuota la casella (anche se era già vuota) | `{ ok: true }` |
| `{ escludi: [a, p, v] }` | mette o toglie il NO di `v` in quella casella. Se `v` era proprio il valore messo lì, la casella si svuota e `v` diventa escluso. | `{ ok: true, escluso: true }` o `{ ok: true, escluso: false }` |
| `{ controlla: true }` | controlla il registro (vedi sotto) | `{ valida: false, mancano: k }`, `{ errore: true }` o `{ risolto: true }` |
| `{ svuota: true }` | cancella registro, NO e targhe usate | `{ ok: true }` |
| qualsiasi altra cosa, o indici fuori da 0…4 o non interi | niente | `{ valida: false }` |

### Errori, soluzione, limiti

- **Registro incompleto** (almeno una casella `null`) e «Controlla»: mossa impossibile, rifiutata, **non** è un errore. Esito `{ valida: false, mancano: k }` (k = caselle vuote).
- **Registro pieno ma diverso da `soluzione`**: è l'unico errore del rompicapo. `g.errore("Il registro non torna: la cripta resta chiusa.")`; il registro resta com'era, il gioco non dice quali caselle sono sbagliate. Esito `{ errore: true }`.
- **Registro pieno e uguale a `soluzione`**: risolto. Esito `{ risolto: true }`; subito `g.risolto({ riepilogo, ritardo: 1600 })` (le animazioni vengono dopo, vedi §5), con
  `riepilogo` = cinque righe separate da `\n`: `Tomba 1: lapide nera, lupo mannaro, sangue, marzapane, gatto nero.` (lapide + nome del colore, poi i nomi di mostro, bevanda, dolce e animale da `VALORI`).
- **Limiti:** nessun limite di tentativi. Ogni 3 errori le dorate in palio scendono di una (5 → 4 → 3 …, minimo 1): lo fa il kit.

### Memoria

Il rompicapo è lungo: il registro non deve perdersi ricaricando la pagina. Dopo ogni mossa che cambia lo stato (e dopo ogni targa segnata) salva `g.memoria.quaderno = { registro, esclusi, usati }` e chiama `g.salvaMemoria()`. All'avvio, se `g.memoria.quaderno` c'è ed è valido (registro 5×5 con valori 0…4 o null e nessun valore ripetuto nello stesso carattere, esclusi 5×5 di liste, usati con indici di targhe esistenti), riparti da lì; altrimenti dal registro vuoto.

Con `g.giaRisolto` il registro mostrato è `soluzione`, senza NO.

## 4. Interfaccia

### Tocchi (con `g.tocca`, solo sul tipo `"giu"`, coordinate arrotondate per difetto)

In quest'ordine:

1. **Finestra aperta.** Se il tocco cade dentro il suo rettangolo (112×46, posizione in `finestraXY`):
   - sul riquadro del valore `k` (x da `fx + 4 + 21k` a `+19`, y da `fy + 11` a `fy + 30`): se la casella contiene già `k` → mossa `togli`, altrimenti → `metti` con `k`; poi la finestra **si chiude**;
   - sul NO del valore `k` (stessa x, y da `fy + 31` a `fy + 45`): mossa `escludi`; la finestra **resta aperta**;
   - altrove nella finestra: niente.
   Se il tocco cade fuori dalla finestra, la finestra si chiude; se il tocco era sulla stessa casella della finestra, finisce lì; altrimenti prosegue ai punti 2 e 3 (così un tocco su un'altra casella apre subito la sua finestra).
2. **Targa** (rettangolo 40×16 della targa `i`, solo se l'indizio `i` esiste): se non è la targa selezionata → la seleziona (contorno giallo) e il fumetto mostra la frase; se è già selezionata → la segna come usata, o toglie il segno.
3. **Casella** di una tomba `p` (`cx` = `TOMBA_CX[p]`): apre la sua finestra.
   - ritratto (mostro, `a = 1`): x da `cx − 10` a `cx + 9`, y da 75 a 96 (si controlla per primo);
   - lapide (`a = 0`): x da `cx − 17` a `cx + 16`, y da 72 a 113;
   - nicchie (y da 118 a 138): bevanda (`a = 2`) x da `cx − 28` a `cx − 11`, dolce (`a = 3`) x da `cx − 9` a `cx + 8`, animale (`a = 4`) x da `cx + 10` a `cx + 27`.

Tasto Esc: chiude la finestra (facoltativo).

### Bottoni (nell'ordine)

- `g.bottone("Svuota", …, { id: "svuota" })`: il primo tocco **non** cancella, chiede conferma nel fumetto; un secondo tocco entro 4 secondi fa la mossa `svuota`. Qualsiasi altra azione annulla la richiesta di conferma.
- `g.bottone("Controlla", …, { id: "controlla", forte: true })`: chiude la finestra, se aperta, e fa la mossa `controlla`.

### Fumetto del kit (`g.messaggio`), testi esatti

`n` = numero della tomba sullo schermo (`p + 1`), `i + 1` = numero dell'indizio.

| Quando | Testo |
|---|---|
| all'avvio | `Leggi gli indizi sul muro e tocca le tombe per compilare il registro.` |
| all'avvio, già risolto | `La cripta è aperta: il registro è completo.` |
| targa selezionata | `${i + 1}. ${indizio.testo}` |
| targa segnata / tolta dagli usati | `Indizio ${i + 1} segnato come usato.` / `Indizio ${i + 1} di nuovo da usare.` |
| finestra aperta, lapide | `Tomba ${n}, lapide: tocca un colore per metterlo, NO per escluderlo.` |
| finestra aperta, ritratto | `Tomba ${n}, ritratto: tocca un mostro per metterlo, NO per escluderlo.` |
| finestra aperta, bevanda | `Tomba ${n}, bevanda: toccane una per metterla, NO per escluderla.` |
| finestra aperta, dolce | `Tomba ${n}, dolce: toccane uno per metterlo, NO per escluderlo.` |
| finestra aperta, animale | `Tomba ${n}, animale: toccane uno per metterlo, NO per escluderlo.` |
| `metti` | `Tomba ${n}: ${descrizione}.` e, se il valore è stato spostato dalla tomba q, ` (prima era nella tomba ${q + 1})` prima del punto |
| `togli` | `Tomba ${n}: casella svuotata.` |
| `escludi` acceso / spento | `Tomba ${n}: NO per ${nome}.` / `Tomba ${n}: tolto il NO per ${nome}.` |
| «Controlla», incompleto | `Il registro non è completo: mancano ${k} caselle.` (con k = 1: `Il registro non è completo: manca 1 casella.`) |
| «Controlla», sbagliato | `Qualcosa non torna, ma la cripta non dice dove.` (più l'avviso di `g.errore`, §3) |
| «Controlla», giusto | `Le lapidi si accendono: la cripta è aperta!` |
| «Svuota», primo tocco | `Tocca ancora «Svuota» per cancellare tutto il registro.` |
| «Svuota», secondo tocco | `Registro svuotato: si ricomincia.` |

`descrizione` (dopo `metti`), con la funzione `cosa(a, v)` del generatore:

- lapide: `lapide ${VALORI[0][v]}` → «Tomba 2: lapide verde.»
- mostro: `ci riposa ${ART_MOSTRO[v]} ${VALORI[1][v]}` → «Tomba 2: ci riposa lo zombie.»
- bevanda: `si beve ${cosa(2, v)}` → «Tomba 2: si beve la pozione.»
- dolce: `si mangia ${cosa(3, v)}` → «Tomba 2: si mangia zucchero filato.»
- animale: `c'è il ${VALORI[4][v]}` → «Tomba 2: c'è il rospo (prima era nella tomba 1).»


`nome` (dopo `escludi`), con l'articolo:

- lapide: `la lapide ${VALORI[0][v]}`
- mostro: `${ART_MOSTRO[v]} ${VALORI[1][v]}` (il vampiro, la mummia, il lupo mannaro, la strega, lo zombie)
- bevanda: il sangue, il tè, il latte, la pozione, il succo di zucca
- dolce: la liquirizia, il marzapane, la caramella mou, il cioccolato, lo zucchero filato
- animale: `il ${VALORI[4][v]}`

Chiudere la finestra con un tocco fuori non cambia il fumetto.

### La carta del testo

In `crea`, prima di tutto, imposta `opzioni.testo` (l'oggetto passato ad `avvia`) così, un paragrafo per riga:

```js
opzioni.testo = [
  g.scheda.enigma,
  "Tocca una targa del muro per leggere il suo indizio; toccala di nuovo per segnarla come usata. Sulle targhe: = stessa tomba, ≠ tombe diverse, → subito a sinistra, ↔ accanto; la tombina d'oro è la posizione contando da sinistra.",
  "Tocca la lapide, il ritratto o una nicchia di una tomba per scegliere cosa metterci. NO serve a escludere, come le crocette sul quaderno. Quando il registro è pieno, «Controlla»: se è sbagliato la cripta resta chiusa e non dice dove.",
  "Gli indizi incisi sul muro:",
  ...g.variante.indizi.map((c, i) => `${i + 1}. ${c.testo}`),
].join("\n");
```

La carta diventa lunga: il kit la fa scorrere, va bene così (è anche la versione da leggere di tutte le targhe, col bottone «Testo»).

## 5. Grafica

### Composizione (sfondo `sala-del-tesoro`, `velo: 0.55`)

Lo sfondo ha al centro l'arco di pietra con il fascio di luce, ai lati due stendardi e due torce, sul pavimento (da y 118) i mucchi di caramelle e due forzieri. Il rompicapo lo trasforma in una cripta:

```
y  0  ─────────────────────── barra del kit (y < 16): solo decorazioni ───────────────────────
y 19  [targa 1 ][targa 2 ][targa 3 ]   ║ catenelle ║   [targa 4 ][targa 5 ][targa 6 ]
y 36  [targa 7 ][targa 8 ][targa 9 ]  ┌─ REGISTRO ─┐  [targa 10][targa 11][targa 12]
y 53  [targa 13][targa 14][targa 15]  └── 17/25 ───┘  [targa 16][targa 17][targa 18]
         (x 4…127)                   arco e luce        (x 193…316)
y 72     ╭─────╮       ╭─────╮       ╭─────╮       ╭─────╮       ╭─────╮
         │(rit)│       │(rit)│       │(rit)│       │(rit)│       │(rit)│      lapidi 34×42
         │ [1] │       │ [2] │       │ [3] │       │ [4] │       │ [5] │
y114  [▢][▢][▢]     [▢][▢][▢]     [▢][▢][▢]     [▢][▢][▢]     [▢][▢][▢]     lastre 58×26 con 3 nicchie
y154  ─────────────────────── barra del kit (fumetto e bottoni) ──────────────────────────────
```

- **Targhe degli indizi**: 18 posti, 40×16, a x `TARGA_X` = 4, 46, 88 | 193, 235, 277 e y `TARGA_Y` = 19, 36, 53. Il posto `i` sta nella riga `floor(i / 6)` e nella colonna `i % 6` (si legge per righe, saltando l'arco). Ci sono da 14 a 17 indizi: i posti che avanzano mostrano una **targa vuota** (pietra scura con una crepa, non si tocca). Le targhe sono di pietra chiara (`C.pietra`) con luce in alto a sinistra: `[icona x] [segno] [icona y]`, oppure per `posto` `[icona x]` e una fila di cinque tombine con quella giusta d'oro.
- **Cartello del registro**: lastra d'ottone 52×22 a (134, 25), appesa con due catenelle all'arco: in alto `REGISTRO` (3×5), sotto il conto delle caselle piene `17/25` (5×7). Lascia vedere la luce dell'arco ai lati.
- **Le cinque tombe**, centri `TOMBA_CX` = 36, 98, 160, 222, 284:
  - **lapide** 34×42 con la cima arrotondata (y 72…113), del colore messo nel registro, o di pietra grezza se vuota; sotto la lapide grezza, una fila di 5 pallini con i colori ancora possibili (spenti quelli segnati NO);
  - **ritratto ovale** dorato 18×20 a (cx − 9, 76), come le fotografie sulle lapidi: dentro, la testa del mostro; vuoto, una sagoma grigia e 5 pallini (bianchi i mostri ancora possibili, spenti i NO);
  - **targhetta del numero** (1…5, cifra d'oro su legno scuro) a (cx − 5, 101);
  - **lastra** di pietra 58×26 a (cx − 29, 114), appoggiata sul pavimento dello sfondo, con tre **nicchie** 18×18 a y 119: bevanda (x cx − 28), dolce (cx − 9), animale (cx + 10). Nella nicchia vuota: il segno della categoria (calice, lecca-lecca, zampa) e i 5 pallini.
  - **Promemoria**: se in una casella vuota resta un solo valore non escluso, si vede quel valore a scacchiera (metà pixel): aiuta, ma la casella resta vuota finché non lo si mette.
- **Finestra della casella** (112×46, legno scuro con chiodini d'oro): titolo `TOMBA 2 - DOLCE` (3×5), cinque riquadri 20×20 con le icone (il valore messo qui ha il contorno giallo; un valore messo in un'altra tomba porta il numero di quella tomba nell'angolo; un valore escluso è a scacchiera con una X rossa) e sotto ciascuno il suo bottone `NO` 20×12 (rosso quando acceso). Per lapide e ritratto sta sopra le targhe (y 22), per le nicchie sopra le lapidi (y 72): non copre mai la casella che si sta scegliendo, e ha una punta verso di lei.

### Sprite (da copiare così come sono)

Icone 12×12 per i 25 valori, tutte dalla paletta: si leggono anche piccole perché ognuna ha una sagoma diversa (calice, tazzina, bottiglia, ampolla, bicchiere con cannuccia…). I neri (gatto, corvo, liquirizia, lapide nera) stanno sempre su pietra chiara: targhe, nicchie, ritratti e finestra hanno tutti il fondo `C.pietra`.

```js
// ── Sprite di «cinque-tombe»: una lettera per colore, "." = vuoto ──
const { C, GEMME } = EscapeDemo;
// Le lettere delle icone: tutte dalla paletta EscapeDemo.C.
const PAL = {
  k: C.bordo, n: C.nero, s: C.sagoma, N: C.ferro, f: C.ferroChiaro, p: C.pietra, P: C.pietraChiara, w: C.bianco,
  R: C.tappeto, r: C.tappetoChiaro, o: C.oroScuro, O: C.oro, y: C.giallo, b: C.brace, F: C.fiamma, L: C.fiammaChiara,
  d: C.legnoScuro, l: C.legno, m: C.legnoChiaro, M: C.legnoLuce, e: C.erbaScura, g: C.erba, G: C.erbaChiara,
  v: C.violaScuro, V: C.viola, u: C.lilla, z: C.rosa, a: C.acqua, c: C.notteChiara, t: C.notte, Y: C.luna,
};
// I colori delle lapidi: [chiaro, medio, scuro]. Rossa e verde prendono le pietre rubino e smeraldo (più sature).
const LAPIDI = [
  [C.ferroChiaro, C.sagoma, C.nero], // 0 nera
  [C.bianco, C.pietraChiara, C.pietra], // 1 bianca
  [GEMME.rubino[2], C.tappetoChiaro, C.tappeto], // 2 rossa
  [GEMME.smeraldo[2], GEMME.smeraldo[1], GEMME.smeraldo[0]], // 3 verde
  [C.lilla, C.viola, C.violaScuro], // 4 viola
];
const LAPIDE_GREZZA = [C.ferroChiaro, C.ferro, C.muro]; // lapide ancora senza colore
// I pallini dei colori ancora possibili sotto la lapide grezza (nell’ordine delle lapidi).
const PIP_LAPIDE = [C.nero, C.bianco, C.tappetoChiaro, GEMME.smeraldo[1], C.viola];

// Icona 12×12 delle lapidi: 1, 2, 3 = chiaro, medio, scuro della lapide (la croce è incisa con lo scuro); f = C.ferroChiaro.

const ICONA_LAPIDE = [
  "...kkkkkk...",
  "..k112222k..",
  ".k11222223k.",
  ".k12232223k.",
  ".k12333223k.",
  ".k12232223k.",
  ".k12232223k.",
  ".k12222223k.",
  ".k22222233k.",
  "kkkkkkkkkkkk",
  "kffffffffffk",
  "kkkkkkkkkkkk",
];

// Icone 12×12 dei valori, nell’ordine di VALORI. ICONE[a][v], con a = 1 mostro, 2 bevanda, 3 dolce, 4 animale.
const ICONE_OGG = {
  mostro: [
    [ // vampiro
      "...kkkkkk...",
      "..knnnnnNk..",
      ".knnnnnnnNk.",
      ".knPPnnPPnk.",
      ".kPPPPPPPpk.",
      ".kPrkPPrkpk.",
      ".kPPPPPPPpk.",
      ".kPkwkkwkpk.",
      "kRkPwPPwpkRk",
      "krRkPPPpkRrk",
      "krRRkkkkRRrk",
      "kkkkkkkkkkkk",
    ],
    [ // mummia
      "...kkkkkk...",
      "..kYYYPPPk..",
      ".kYYPPPYYpk.",
      ".kPPPYYYPpk.",
      ".knnnnnnnnk.",
      ".knyynnnnnk.",
      ".kYYYPPPYpk.",
      ".kPPYYYPPpk.",
      ".kYYPPPYYpk.",
      "..kPPYYYpk..",
      "..kYpkkpYk..",
      "...kk..kk...",
    ],
    [ // lupo mannaro
      ".k........k.",
      "kMk......kmk",
      "kMmk....kmlk",
      "kmmmkkkkmmlk",
      "kmmmmmmmmmlk",
      "kmykmmmmykmk",
      "kmmmmmmmmmlk",
      ".kmMMnnMMmk.",
      ".kmMMMMMMmk.",
      ".kmMwkkwMlk.",
      "..kmMMMMlk..",
      "...kkkkkk...",
    ],
    [ // strega
      "......kk....",
      ".....kVk....",
      "....kVvk....",
      "...kVVvk....",
      "...kVVVvk...",
      ".kkOOOOOOkk.",
      "kvvvvvvvvvvk",
      ".kkGGGGGGkk.",
      "..kGnGGnGk..",
      "..kGGGGGGGk.",
      "..kGGrrGgk..",
      "...kkkkkk...",
    ],
    [ // zombie
      "..kkk.kkk...",
      ".knnnknnnk..",
      ".knGGnnGnnk.",
      ".kGGGGGGGgk.",
      ".kGwwGGGGgk.",
      ".kGwnGGnGgk.",
      ".kGGGGGGGgk.",
      ".kGkkkkGGgk.",
      ".kGkrrkGggk.",
      ".kGGkkGGgk..",
      "..kGGGGggk..",
      "...kkkkkk...",
    ],
  ],
  bevanda: [
    [ // sangue
      "............",
      ".kkkkkkkkkk.",
      ".kwPPPPPPPk.",
      ".kwrrrrrrRk.",
      ".kPrrrrrrRk.",
      "..krrrrrRk..",
      "...kRRRRk...",
      "....kkkk....",
      ".....kPk....",
      ".....kPk....",
      "...kkPPPkk..",
      "...kkkkkkk..",
    ],
    [ // tè
      "....p..p....",
      "...p..p.....",
      "....p..p....",
      ".kkkkkkkk...",
      ".kMmmmmmmkk.",
      ".kwPPPPPPkPk",
      ".kwPPPPPPkPk",
      ".kPPPPPPpkk.",
      "..kPPPPpk...",
      "kkkkkkkkkkk.",
      "kPPPPPPPPpk.",
      ".kkkkkkkkk..",
    ],
    [ // latte
      "....kkkk....",
      "....kcck....",
      "....kkkk....",
      "....kwPk....",
      "...kwwPPk...",
      "..kwwwPPpk..",
      "..kwwwPPpk..",
      "..kwcccccpk.",
      "..kwwwPPpk..",
      "..kwwwPPpk..",
      "..kPPPPppk..",
      "...kkkkkk...",
    ],
    [ // pozione
      ".....kk.....",
      "....kMmk....",
      "....kPpk....",
      "....kPpk....",
      "...kPaapk...",
      "..kPaaaaak..",
      ".kPaawaaaak.",
      ".kPaaaaaatk.",
      ".kaaaawaatk.",
      ".kaaaaaattk.",
      "..kttttttk..",
      "...kkkkkk...",
    ],
    [ // succo di zucca
      "......kr....",
      "......kwk...",
      ".....kr.....",
      "..kkkkwkkk..",
      "..kPLLrLPk..",
      "..kPFFFFbk..",
      "..kPFFFFbk..",
      "..kPFFFFbk..",
      "..kPFFFFbk..",
      "..kPFFFbbk..",
      "..kPPPPPpk..",
      "..kkkkkkkk..",
    ],
  ],
  dolce: [
    [ // liquirizia
      "............",
      "...kkkkkk...",
      "..knNNNNnk..",
      ".knNnnnnNnk.",
      ".kNnNNNNnNk.",
      ".kNnNzzNnNk.",
      ".kNnNzzNnNk.",
      ".kNnNNNnnNk.",
      ".knNnnnnNnk.",
      "..knNNNNnk..",
      "...kkkkkk...",
      "............",
    ],
    [ // marzapane
      "............",
      ".kk......kk.",
      ".kzk....kzk.",
      ".kzzkkkkzzk.",
      "kzwzzzzzzzzk",
      "kzzkzzzzkzzk",
      "kzzzzzzzzzrk",
      "kzzzkkkkzzrk",
      "kzzkrzzrkzrk",
      ".kzzkkkkzrk.",
      "..kkzzzzrk..",
      "....kkkkk...",
    ],
    [ // caramella mou
      "............",
      "............",
      "....kkkkkk..",
      "...kLLLLLLk.",
      "..kLLLLLLok.",
      "..kooooobbk.",
      "kkkkkkkobbk.",
      "kLLLLLLkbbk.",
      "kooooobkbk..",
      "kooooobkk...",
      "kobbbbbk....",
      "kkkkkkkk....",
    ],
    [ // cioccolato
      "..kkkkkkkk..",
      "..kMmmkMmk..",
      "..kmmlkmlk..",
      "..kkkkkkkk..",
      "..kMmmkMmk..",
      "..kmmlkmlk..",
      "..kPPPPPPk..",
      "..krrrrrRk..",
      "..krwrrrRk..",
      "..krrrrrRk..",
      "..kRRRRRRk..",
      "..kkkkkkkk..",
    ],
    [ // zucchero filato
      "...kkkkk....",
      "..kcwcccck..",
      ".kccccwccck.",
      "kcwcccccccck",
      "kcccccccuck.",
      ".kcccccucck.",
      "..kcccuuck..",
      "...kkcukk...",
      ".....Pk.....",
      ".....Pk.....",
      ".....Pk.....",
      ".....kk.....",
    ],
  ],
  animale: [
    [ // gatto nero
      ".kk......kk.",
      ".kNk....knk.",
      ".kNnkkkknnk.",
      ".knnnnnnnnk.",
      "kNnnnnnnnnnk",
      "kNyynnnnyynk",
      "kNynnnnnynnk",
      "knnnnzznnnnk",
      "kfnnnnnnnnfk",
      ".knnnnnnnnk.",
      "..knnnnnnk..",
      "...kkkkkk...",
    ],
    [ // corvo
      "............",
      ".....kkk....",
      "....knnNk...",
      "..kknwnnk...",
      "kOOOknnnnk..",
      ".kkknnnnnk..",
      "....knnnnnk.",
      "...knnNnnnnk",
      "...knnnNNnnk",
      "....knnnnnkk",
      ".....kOkOk..",
      ".....k.k....",
    ],
    [ // pipistrello
      "............",
      "............",
      "....k..k....",
      "k..knkknk..k",
      "kk.knnnnk.kk",
      "kNkknynykkNk",
      "kNNknnnnkNNk",
      "kNNNknnkNNNk",
      "kNkNNkkNNkNk",
      "kk.kk..kk.kk",
      "............",
      "............",
    ],
    [ // ragno
      "......p.....",
      "......p.....",
      ".k..kkkk..k.",
      "k.kknNnnkk.k",
      "kk.knnnnk.kk",
      "..kknrrnkk..",
      ".k.knnnnk.k.",
      "k.kknnnnkk.k",
      "k..kknnkk..k",
      "..k..kk..k..",
      ".k........k.",
      "............",
    ],
    [ // rospo
      "............",
      "............",
      ".kkk....kkk.",
      "kGyGk..kGyGk",
      "kGGGkkkkGGgk",
      "kGGGGGGGGGgk",
      "kgGGGGGGGGgk",
      "kekkkkkkkkek",
      "kGGGGGGGGGgk",
      ".kgGGgGGgggk",
      "kGGkkkkkkGGk",
      "kkk......kkk",
    ],
  ],
};

const ICONE = [null, /* le lapidi usano ICONA_LAPIDE */ ICONE_OGG.mostro, ICONE_OGG.bevanda, ICONE_OGG.dolce, ICONE_OGG.animale];
// I segni delle targhe (9×7): e = inciso (C.bordo), r = barra rossa (C.tappetoChiaro).
const GLIFI = {
  stessa: [".........", ".........", ".eeeeeee.", ".........", ".eeeeeee.", ".........", "........."],
  diversa: ["......r..", ".....r...", ".eeeeree.", "....r....", ".eereeee.", "...r.....", "..r......"],
  sinistra: [".........", ".....e...", ".....ee..", "eeeeeeeee", ".....ee..", ".....e...", "........."],
  accanto: [".........", "..e...e..", ".ee...ee.", "eeeeeeeee", ".ee...ee.", "..e...e..", "........."],
};
// Il segno inciso nelle nicchie vuote (7×7, e = C.ferroChiaro): calice, lecca-lecca, zampa.
const CATEGORIE = [null, null,
  ["eeeeeee", "e.....e", "e.....e", ".e...e.", "..eee..", "...e...", "..eee.."],
  ["..eee..", ".e...e.", ".e.e.e.", ".e...e.", "..eee..", "...e...", "...e..."],
  ["..e.e..", "..e.e..", "e.....e", "e.eee.e", ".eeeee.", ".eeeee.", "..eee.."],
];
// La cornice ovale del ritratto (18×20): k = C.bordo, O = C.oro, o = C.oroScuro; dentro, i punti sono il fondo.
const CORNICE_RITRATTO = [
  "....kkkkkkkkkk....",
  "..kkOOOOOOOOOokk..",
  ".kOOkkkkkkkkkkook.",
  ".kOk..........kok.",
  "kOk............kok",
  "kOk............kok",
  "kOk............kok",
  "kOk............kok",
  "kOk............kok",
  "kOk............kok",
  "kOk............kok",
  "kOk............kok",
  "kOk............kok",
  "kOk............kok",
  "kOk............kok",
  "kok............kok",
  ".kok..........kok.",
  ".kookkkkkkkkkkook.",
  "..kkooooooooookk..",
  "....kkkkkkkkkk....",
];
// La sagoma del ritratto vuoto (8×9, e = C.ferroChiaro).
const SAGOMA_VUOTA = ["..eeee..", ".eeeeee.", ".eeeeee.", ".eeeeee.", "..eeee..", "...ee...", ".eeeeee.", "eeeeeeee", "eeeeeeee"];
// Gli occhi chiusi dei ritratti: [colonna, riga, lettera] da sostituire nell’icona del mostro (stesso ordine).
const PALPEBRE = [
  [[3, 5, "k"], [7, 5, "k"]],
  [[3, 5, "n"], [4, 5, "n"]],
  [[2, 5, "k"], [8, 5, "k"]],
  [[4, 8, "g"], [7, 8, "g"]],
  [[3, 4, "G"], [4, 4, "G"], [3, 5, "k"], [4, 5, "k"]],
];
```

### Disegno di riferimento (da copiare o adattare)

Queste funzioni disegnano tutti i pezzi nelle loro posizioni. Le ho provate sullo sfondo vero: con il registro vuoto, a metà, pieno, con la finestra aperta su ogni tipo di casella, nell'errore e nella vittoria. I tre blocchi (generatore, sprite, disegno) sono stati caricati insieme e non hanno nomi in comune; se in `gioco.js` prendi già `C`, `rett`, `testo`… da `EscapeDemo` in testa al file, togli i doppioni (`const` ripetuti nella stessa funzione sono un errore di sintassi).

```js
// ── Disegno di riferimento di «cinque-tombe» (provato in anteprima sullo sfondo vero) ──
// Usa EscapeDemo e gli sprite qui sopra. Coordinate in pixel della scena 320×180, sempre intere.
const { rett, riquadro, testo } = EscapeDemo;

const TOMBA_CX = [36, 98, 160, 222, 284]; // centro di ogni tomba
const TARGA_X = [4, 46, 88, 193, 235, 277]; // colonne delle targhe (3 a sinistra dell'arco, 3 a destra)
const TARGA_Y = [19, 36, 53]; // righe delle targhe
const LAPIDE_Y = 72; // prima riga della lapide (alta 42)
const LASTRA_Y = 114; // prima riga della lastra (alta 26)
const NICCHIA_Y = 119;
const MEZZE = [9, 12, 14, 15, 16]; // mezza larghezza delle prime 5 righe della lapide; poi 17

const nicchiaX = (p, a) => TOMBA_CX[p] - 28 + (a - 2) * 19;
const targaXY = (i) => ({ x: TARGA_X[i % 6], y: TARGA_Y[Math.floor(i / 6)] });
function finestraXY(a, p) { return { x: Math.min(204, Math.max(4, TOMBA_CX[p] - 56)), y: a <= 1 ? 22 : 72 }; }

/** Icona 12×12 del valore v del carattere a. */
function icona(ctx, a, v, x, y, righe) {
  if (a === 0) EscapeDemo.sprite(ctx, ICONA_LAPIDE, { ...PAL, 1: LAPIDI[v][0], 2: LAPIDI[v][1], 3: LAPIDI[v][2] }, x, y);
  else EscapeDemo.sprite(ctx, righe || ICONE[a][v], PAL, x, y);
}
/** Copre metà dei pixel a scacchiera: icone «spente» o promemoria. */
function scacchiera(ctx, x, y, w, h, colore) {
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) if (((x + i + y + j) & 1) === 0) rett(ctx, colore, x + i, y + j, 1, 1);
}
function cornice(ctx, x, y, w, h, colore) { // rettangolo vuoto di 1 pixel
  rett(ctx, colore, x, y, w, 1); rett(ctx, colore, x, y + h - 1, w, 1);
  rett(ctx, colore, x, y, 1, h); rett(ctx, colore, x + w - 1, y, 1, h);
}

// ── Le targhe degli indizi (40×16) ──
function disegnaTarga(ctx, i, ind, stato) {
  const { x, y } = targaXY(i);
  if (!ind) { // posto vuoto: pietra liscia e scura con una crepa
    riquadro(ctx, x, y, 40, 16, C.ferro);
    rett(ctx, C.ferroChiaro, x + 1, y + 1, 38, 1);
    rett(ctx, C.muro, x + 1, y + 14, 38, 1);
    [[22, 3], [23, 4], [23, 5], [24, 6], [23, 7], [24, 8], [24, 9]].forEach(([i2, j]) => rett(ctx, C.muro, x + i2, y + j, 1, 1));
    return;
  }
  const sel = stato === "selezionata";
  if (sel) cornice(ctx, x - 1, y - 1, 42, 18, C.giallo);
  riquadro(ctx, x, y, 40, 16, sel ? C.pietraChiara : C.pietra);
  rett(ctx, sel ? C.bianco : C.pietraChiara, x + 1, y + 1, 38, 1);
  rett(ctx, sel ? C.bianco : C.pietraChiara, x + 1, y + 1, 1, 14);
  rett(ctx, C.ferroChiaro, x + 1, y + 14, 38, 1);
  rett(ctx, C.ferroChiaro, x + 38, y + 1, 1, 14);
  icona(ctx, ind.x[0], ind.x[1], x + 2, y + 2);
  if (ind.tipo === "posto") {
    rett(ctx, C.ferroChiaro, x + 15, y + 11, 22, 1); // il pavimento delle cinque tombine
    for (let k = 0; k < 5; k++) {
      const c = k === ind.n ? C.oro : C.ferro;
      rett(ctx, c, x + 17 + k * 4, y + 4, 1, 1);
      rett(ctx, c, x + 16 + k * 4, y + 5, 3, 6);
      if (k === ind.n) rett(ctx, C.giallo, x + 16 + k * 4, y + 5, 1, 2);
    }
  } else {
    EscapeDemo.sprite(ctx, GLIFI[ind.tipo], { e: C.bordo, r: C.tappetoChiaro }, x + 15, y + 4);
    icona(ctx, ind.y[0], ind.y[1], x + 26, y + 2);
  }
  if (stato === "usata") scacchiera(ctx, x + 1, y + 1, 38, 14, C.ferro);
}

// ── Il cartello del registro, appeso nell'arco ──
function disegnaCartello(ctx, sopra, sotto, coloreSotto) {
  for (let y = 16; y < 25; y += 2) { rett(ctx, C.ferroChiaro, 140, y, 1, 1); rett(ctx, C.ferroChiaro, 179, y, 1, 1); }
  riquadro(ctx, 134, 25, 52, 22, C.oroScuro);
  rett(ctx, C.oro, 135, 26, 50, 1);
  rett(ctx, C.oro, 135, 26, 1, 20);
  rett(ctx, EscapeDemo.GEMME.topazio[0], 135, 45, 50, 1);
  rett(ctx, EscapeDemo.GEMME.topazio[0], 184, 27, 1, 19);
  testo(ctx, sopra, 160, 29, { piccolo: true, colore: C.bordo, ombra: null, allinea: "centro" });
  testo(ctx, sotto, 160, 36, { colore: coloreSotto || C.bordo, ombra: C.oro, allinea: "centro" });
}

// ── La lapide grande 34×42 (colori = [chiaro, medio, scuro]) ──
function disegnaLapide(ctx, cx, colori, contorno) {
  const [L, M, S] = colori;
  const h = (j) => (j < 5 ? MEZZE[j] : 17);
  for (let j = 0; j < 42; j++) {
    const y = LAPIDE_Y + j;
    rett(ctx, contorno, cx - h(j), y, h(j) * 2, 1);
    if (j === 0 || j === 41) continue;
    const m = Math.min(h(j), h(j - 1));
    const xi = cx - m + 1, wi = m * 2 - 2;
    rett(ctx, M, xi, y, wi, 1);
    rett(ctx, L, xi, y, 2, 1);
    rett(ctx, S, xi + wi - 2, y, 2, 1);
    if (j <= 2) rett(ctx, L, xi, y, wi - 2, 1);
    if (j >= 39) rett(ctx, S, xi + 2, y, wi - 2, 1);
  }
  rett(ctx, S, cx - 13, LAPIDE_Y + 26, 26, 1); // riga incisa sotto il ritratto
  rett(ctx, L, cx - 13, LAPIDE_Y + 27, 26, 1);
}
/** Il contorno giallo (selezione) o rosso (errore) attorno alla lapide: un pixel fuori dal suo bordo. */
function contornoLapide(ctx, cx, colore) {
  const h = (j) => (j < 5 ? MEZZE[j] : 17);
  rett(ctx, colore, cx - h(0), LAPIDE_Y - 1, h(0) * 2, 1);
  for (let j = 0; j < 42; j++) {
    const hj = h(j), hp = j > 0 ? h(j - 1) : hj;
    rett(ctx, colore, cx - hj - 1, LAPIDE_Y + j, 1, 1);
    rett(ctx, colore, cx + hj, LAPIDE_Y + j, 1, 1);
    if (hj > hp) { rett(ctx, colore, cx - hj, LAPIDE_Y + j - 1, hj - hp, 1); rett(ctx, colore, cx + hp, LAPIDE_Y + j - 1, hj - hp, 1); }
  }
}

function disegnaRitratto(ctx, cx, v, esclusi, alza, chiudiOcchi) {
  const x = cx - 9, y = LAPIDE_Y + 4;
  rett(ctx, C.pietra, x + 3, y + 3, 12, 14); // il fondo dentro la cornice
  EscapeDemo.sprite(ctx, CORNICE_RITRATTO, { k: C.bordo, O: C.oro, o: C.oroScuro }, x, y);
  if (v != null) {
    let righe = ICONE[1][v];
    if (chiudiOcchi) righe = righe.map((r, j) => [...r].map((ch, i) => { const q = PALPEBRE[v].find(([pi, pj]) => pi === i && pj === j); return q ? q[2] : ch; }).join(""));
    icona(ctx, 1, v, x + 3, y + 3 - (alza || 0), righe);
  } else {
    const libere = [0, 1, 2, 3, 4].filter((k) => !esclusi.includes(k));
    if (libere.length === 1) { icona(ctx, 1, libere[0], x + 3, y + 3); scacchiera(ctx, x + 3, y + 3, 12, 12, C.pietra); }
    else EscapeDemo.sprite(ctx, SAGOMA_VUOTA, { e: C.ferroChiaro }, x + 5, y + 4);
    for (let k = 0; k < 5; k++) rett(ctx, esclusi.includes(k) ? C.ferroChiaro : C.bianco, x + 2 + k * 3, y + 15, 2, 2);
  }
}

function disegnaTarghetta(ctx, cx, n) {
  riquadro(ctx, cx - 5, LAPIDE_Y + 29, 11, 9, C.legnoScuro);
  testo(ctx, String(n), cx, LAPIDE_Y + 30, { colore: C.oro, ombra: null, allinea: "centro" });
}

function disegnaNicchia(ctx, nx, ny, a, v, esclusi) {
  riquadro(ctx, nx, ny, 18, 18, C.pietra);
  rett(ctx, C.ferroChiaro, nx + 1, ny + 1, 16, 1);
  rett(ctx, C.ferroChiaro, nx + 1, ny + 1, 1, 16);
  rett(ctx, C.pietraChiara, nx + 1, ny + 16, 16, 1);
  if (v != null) { icona(ctx, a, v, nx + 3, ny + 3); return; }
  const libere = [0, 1, 2, 3, 4].filter((k) => !esclusi.includes(k));
  if (libere.length === 1) { icona(ctx, a, libere[0], nx + 3, ny + 3); scacchiera(ctx, nx + 3, ny + 3, 12, 12, C.pietra); }
  else EscapeDemo.sprite(ctx, CATEGORIE[a], { e: C.ferroChiaro }, nx + 6, ny + 4);
  for (let k = 0; k < 5; k++) rett(ctx, esclusi.includes(k) ? C.ferroChiaro : C.bianco, nx + 2 + k * 3, ny + 13, 2, 2);
}

function disegnaLastra(ctx, cx) {
  const x = cx - 29;
  for (let i = 0; i < 60; i++) if ((i + LASTRA_Y) & 1) rett(ctx, C.nero, x - 1 + i, LASTRA_Y + 26, 1, 1); // ombra a terra
  rett(ctx, C.nero, x, LASTRA_Y + 26, 58, 1);
  riquadro(ctx, x, LASTRA_Y, 58, 26, C.ferro);
  rett(ctx, C.pietraChiara, x + 1, LASTRA_Y + 1, 56, 1);
  rett(ctx, C.pietra, x + 1, LASTRA_Y + 2, 56, 2);
  rett(ctx, C.bordo, x + 1, LASTRA_Y + 4, 56, 1);
  rett(ctx, C.ferroChiaro, x + 1, LASTRA_Y + 5, 1, 19);
  rett(ctx, C.muro, x + 56, LASTRA_Y + 5, 1, 19);
  rett(ctx, C.muro, x + 1, LASTRA_Y + 24, 56, 1);
}

/**
 * Una tomba intera. valori[a] = valore del carattere a in questa tomba (o null); esclusi[a] = valori segnati NO.
 * op: selezione (carattere con la finestra aperta), contorno (colore del bordo della lapide: C.giallo se accesa),
 * contornoFuori (contorno rosso dell’errore o giallo del lampeggio), alza (1 = ritratto un pixel più su), chiudiOcchi.
 */
function disegnaTomba(ctx, p, valori, esclusi, op = {}) {
  const cx = TOMBA_CX[p];
  const v0 = valori[0];
  const libere0 = [0, 1, 2, 3, 4].filter((k) => !esclusi[0].includes(k));
  disegnaLapide(ctx, cx, v0 != null ? LAPIDI[v0] : LAPIDE_GREZZA, op.contorno || C.bordo);
  if (v0 == null && libere0.length === 1) { // promemoria: il solo colore rimasto, a scacchiera sulla pietra grezza
    disegnaLapide(ctx, cx, LAPIDI[libere0[0]], op.contorno || C.bordo);
    const h = (j) => (j < 5 ? MEZZE[j] : 17);
    for (let j = 1; j < 41; j++) { const m = Math.min(h(j), h(j - 1)); scacchiera(ctx, cx - m + 1, LAPIDE_Y + j, m * 2 - 2, 1, C.ferro); }
  }
  if (op.selezione === 0) contornoLapide(ctx, cx, C.giallo);
  if (op.contornoFuori) contornoLapide(ctx, cx, op.contornoFuori);
  disegnaRitratto(ctx, cx, valori[1], esclusi[1], op.alza, op.chiudiOcchi);
  if (op.selezione === 1) cornice(ctx, cx - 10, LAPIDE_Y + 3, 20, 22, C.giallo);
  disegnaTarghetta(ctx, cx, p + 1);
  if (v0 == null) PIP_LAPIDE.forEach((c, k) => rett(ctx, esclusi[0].includes(k) ? C.ferroChiaro : c, cx - 7 + k * 3, LAPIDE_Y + 39, 2, 1));
  disegnaLastra(ctx, cx);
  for (let a = 2; a <= 4; a++) {
    disegnaNicchia(ctx, nicchiaX(p, a), NICCHIA_Y, a, valori[a], esclusi[a]);
    if (op.selezione === a) cornice(ctx, nicchiaX(p, a) - 1, NICCHIA_Y - 1, 20, 20, C.giallo);
  }
}

// ── La finestra di una casella (112×46) ──
const NOMI_CARATTERI = ["LAPIDE", "MOSTRO", "BEVANDA", "DOLCE", "ANIMALE"];
function disegnaFinestra(ctx, a, p, registro, esclusi) {
  const { x, y } = finestraXY(a, p);
  rett(ctx, C.nero, x + 1, y + 46, 112, 1); // ombra
  rett(ctx, C.nero, x + 112, y + 1, 1, 46);
  riquadro(ctx, x, y, 112, 46, C.legnoScuro);
  rett(ctx, C.legno, x + 1, y + 1, 110, 1);
  [[1, 1], [110, 1], [1, 44], [110, 44]].forEach(([i, j]) => rett(ctx, C.oro, x + i, y + j, 1, 1));
  testo(ctx, `TOMBA ${p + 1} - ${NOMI_CARATTERI[a]}`, x + 5, y + 4, { piccolo: true, colore: C.fiammaChiara, ombra: null });
  for (let k = 0; k < 5; k++) {
    const bx = x + 4 + k * 21, by = y + 11;
    const qui = registro[a][p] === k;
    const altrove = registro[a].indexOf(k);
    const escluso = esclusi[a][p].includes(k);
    if (qui) cornice(ctx, bx - 1, by - 1, 22, 22, C.giallo);
    riquadro(ctx, bx, by, 20, 20, qui ? C.pietraChiara : C.pietra);
    rett(ctx, qui ? C.bianco : C.pietraChiara, bx + 1, by + 1, 18, 1);
    rett(ctx, C.ferroChiaro, bx + 1, by + 18, 18, 1);
    icona(ctx, a, k, bx + 4, by + 4);
    if (escluso) {
      scacchiera(ctx, bx + 1, by + 1, 18, 18, C.ferro);
      for (let i = 0; i < 9; i++) { rett(ctx, C.tappetoChiaro, bx + 5 + i, by + 5 + i, 1, 1); rett(ctx, C.tappetoChiaro, bx + 13 - i, by + 5 + i, 1, 1); }
    }
    if (altrove >= 0 && altrove !== p) { // già messo in un'altra tomba: il suo numero nell'angolo
      rett(ctx, C.bordo, bx + 14, by + 13, 6, 7);
      testo(ctx, String(altrove + 1), bx + 15, by + 14, { piccolo: true, colore: C.giallo, ombra: null });
    }
    const ny = y + 32;
    riquadro(ctx, bx, ny, 20, 12, escluso ? C.tappetoChiaro : C.ferro);
    rett(ctx, escluso ? "#ff8a7a" : C.ferroChiaro, bx + 1, ny + 1, 18, 1);
    testo(ctx, "NO", bx + 10, ny + 4, { piccolo: true, colore: escluso ? C.bianco : C.ferroChiaro, ombra: null, allinea: "centro" });
  }
  const tx = a <= 1 ? TOMBA_CX[p] : nicchiaX(p, a) + 9; // la punta verso la casella
  rett(ctx, C.bordo, tx - 3, y + 46, 7, 1); rett(ctx, C.legnoScuro, tx - 2, y + 46, 5, 1);
  rett(ctx, C.bordo, tx - 2, y + 47, 5, 1); rett(ctx, C.legnoScuro, tx - 1, y + 47, 3, 1);
  rett(ctx, C.bordo, tx - 1, y + 48, 3, 1);
}

/** Stellina dorata di 5×5 (vittoria): f = fotogramma 0..3. */
function scintilla(ctx, x, y, f) {
  if (f === 3) return;
  rett(ctx, C.bianco, x, y, 1, 1);
  if (f === 1) { rett(ctx, C.giallo, x - 1, y, 3, 1); rett(ctx, C.giallo, x, y - 1, 1, 3); rett(ctx, C.bianco, x, y, 1, 1); }
  if (f === 2) { rett(ctx, C.giallo, x - 2, y, 5, 1); rett(ctx, C.giallo, x, y - 2, 1, 5); rett(ctx, C.bianco, x, y, 1, 1); }
}

/** Il pulviscolo che scende nella luce dell’arco (fotogramma f). */
function disegnaPulviscolo(ctx, f) {
  for (let k = 0; k < 5; k++) rett(ctx, (f + k) % 4 < 2 ? C.fiammaChiara : C.oro, 145 + 7 * k, 18 + ((f + 11 * k) % 50), 1, 1);
}
/** Il fascio di luce dorata nell arco, a retino (vittoria). */
function disegnaFascio(ctx) {
  const B = EscapeDemo.BAYER;
  for (let y = 16; y < 72; y++)
    for (let x = 130; x < 190; x++) {
      const k = 0.6 * (1 - Math.abs(x - 160) / (6 + (y - 16) * 0.45));
      if (k > 0 && B[y & 3][x & 3] / 16 < k) rett(ctx, C.giallo, x, y, 1, 1);
    }
}
```

### Stati visivi

| Pezzo | Normale | Selezionato | Altro |
|---|---|---|---|
| targa | pietra chiara | contorno `C.giallo` e pietra più chiara (`disegnaTarga(…, "selezionata")`) | usata: a scacchiera scura (`"usata"`), resta leggibile e toccabile |
| lapide | colore messo o grezza | contorno giallo fuori dal bordo (`op.selezione = 0`) | errore: contorno rosso; vittoria: bordo giallo |
| ritratto | testa del mostro o sagoma | cornice gialla (`op.selezione = 1`) | occhi chiusi (`op.chiudiOcchi`), saltello (`op.alza`) |
| nicchia | icona o segno della categoria | cornice gialla (`op.selezione = a`) | promemoria a scacchiera |
| cartello | `REGISTRO` / `n/25` | — | errore: `NO` rosso; vittoria: `CRIPTA` / `APERTA` |

### Animazioni (8 fotogrammi al secondo, `f = g.fotogramma`)

- **Pulviscolo** nella luce dell'arco (`disegnaPulviscolo(ctx, f)`), sotto il cartello: sempre, finché non è risolto.
- **I ritratti sbattono le palpebre**: il ritratto della tomba `p` ha gli occhi chiusi quando `(f + 9 * p) % 40 === 0` (un fotogramma ogni 5 secondi, sfasati).
- **Lampo** dopo `metti`: per 150 ms un contorno `C.bianco` attorno alla casella (per la lapide `op.contornoFuori = C.bianco`, per il ritratto `cornice(ctx, cx - 10, 75, 20, 22, C.bianco)`, per la nicchia `cornice(ctx, nicchiaX(p, a) - 1, 118, 20, 20, C.bianco)`, dopo `disegnaTomba`); se il valore è stato spostato, lo stesso lampo in `C.ferroChiaro` sulla casella da cui è sparito.
- **«Controlla» con il registro incompleto**: per 450 ms le caselle vuote lampeggiano in giallo, accese da 0 a 150 e da 300 a 450 ms (lapide: `op.contornoFuori = C.giallo`; ritratto e nicchie: le stesse cornici gialle della selezione), e negli stessi istanti il conto del cartello è in `C.tappetoChiaro` (quarto argomento di `disegnaCartello`).
- **Errore**: per 900 ms il cartello mostra `REGISTRO` / `NO` (`C.tappetoChiaro`); le cinque lapidi hanno il contorno rosso (`op.contornoFuori = C.tappetoChiaro`) da 0 a 120 ms e da 240 a 360 ms. La scossa e l'avviso li fa il kit.
- **Vittoria** (t = 0 all'istante della soluzione, la carta arriva a 1600 ms):
  - la lapide `p` si accende (bordo `C.giallo`, `op.contorno`) a `150 · p` ms, da sinistra a destra;
  - da 750 ms: il cartello diventa `CRIPTA` / `APERTA`, il fascio dorato riempie l'arco (`disegnaFascio`, al posto del pulviscolo), i mostri nei ritratti saltellano (`op.alza = ((f >> 1) + p) % 2`) e brillano 8 stelline (`scintilla`) in (30, 70), (70, 90), (125, 80), (190, 75), (250, 92), (300, 70), (98, 69), (228, 69), con fase `(f + 2 * i) % 8` (disegnata solo se ≤ 2).
- **Già risolto** (`g.giaRisolto`): direttamente lo stato finale della vittoria (registro = soluzione, lapidi accese, cartello `CRIPTA` / `APERTA`, fascio, stelline e saltelli).
- **`g.riduciMovimento`**: niente pulviscolo, palpebre, lampi né saltelli; la vittoria va subito allo stato finale con le stelline ferme (fase 1); il lampeggio dell'incompleto e il contorno rosso dell'errore restano accesi per tutta la loro durata invece di lampeggiare.

### Ordine di disegno e prestazioni

Ogni volta: cancella la tela; fascio (vittoria) o pulviscolo; cartello; le 18 targhe; le 5 tombe (`disegnaTomba`); le stelline; la finestra (per ultima, sopra tutto). Disegnare la scena costa diverse migliaia di rettangoli: in `g.anima` ridisegna solo quando cambia `g.fotogramma` o quando cambia qualcosa (stato, finestra, selezione, inizio o fine di un'animazione).

### Colori

Tutto dalla paletta `EscapeDemo.C`, più tre pietre di `EscapeDemo.GEMME` già previste dalle regole: rubino e smeraldo per le lapidi rossa e verde (più sature dei rossi e verdi della paletta, che sullo sfondo velato sembravano spenti), topazio scuro per l'ombra del cartello. L'unico colore scritto a mano, `#ff8a7a` nel bottone NO acceso, è `GEMME.rubino[2]`.

## 6. Aggancio per le prove

```js
g.espone({
  gioca: (mossa) => …,     // applica UNA mossa (tabella del §3) con la stessa funzione dei tocchi e dei bottoni
  statoGioco: () => …,
  casella: (a, p) => …,    // { x, y }: dove toccare la casella
  scelta: (k) => …,        // { x, y } del riquadro del valore k nella finestra aperta, null se è chiusa
  no: (k) => …,            // { x, y } del NO del valore k nella finestra aperta, null se è chiusa
  targa: (i) => …,         // { x, y }: il centro della targa i
});
```

- **`gioca(mossa)`**: le mosse e gli esiti della tabella del §3, con gli stessi messaggi, lampi, errori e vittoria dei tocchi. Non apre né chiude la finestra e non cambia la targa selezionata. `{ svuota: true }` cancella subito, senza la conferma del bottone.
- **`statoGioco()`**:
  ```js
  {
    registro: [[…5], …],   // 5×5 come nello stato (valore o null)
    esclusi: [[[…], …], …],// 5×5, liste in ordine crescente
    usati: [0, 3],         // targhe segnate, in ordine crescente
    mancano: 23,           // caselle vuote
    aperta: { a: 3, p: 1 },// casella con la finestra aperta, o null
    selezionato: 0,        // targa selezionata, o null
    risolto: false,
  }
  ```
- **`casella(a, p)`**: lapide `{ x: cx, y: 106 }`, ritratto `{ x: cx, y: 86 }`, nicchie `{ x: cx − 19, y: 128 }`, `{ x: cx, y: 128 }`, `{ x: cx + 19, y: 128 }` (con `cx = TOMBA_CX[p]`).
- **`scelta(k)`**: `{ x: fx + 14 + 21k, y: fy + 21 }`; **`no(k)`**: `{ x: fx + 14 + 21k, y: fy + 38 }`, con `{ x: fx, y: fy } = finestraXY(a, p)` della finestra aperta.
- **`targa(i)`**: `{ x: TARGA_X[i % 6] + 20, y: TARGA_Y[floor(i / 6)] + 8 }`.

`verifica.mjs` usa tutto questo alla lettera: controlla le varianti di sei semi (frasi, una sola soluzione, ogni indizio necessario, difficoltà), apre la finestra del ritratto e mette un mostro con due clic veri, segna un NO, seleziona e segna una targa con i clic, prova spostamenti, mosse impossibili, «Controlla» incompleto, la memoria (ricarica la pagina a metà partita e chiude la carta), un registro sbagliato, tre errori (dorate da 5 a 4), «Svuota» con la conferma e infine la soluzione con il bottone «Controlla».

## 7. Criteri di accettazione

Guardando le foto e giocando:

1. La scena sembra una cripta: targhe incise sul muro ai due lati dell'arco, cartello d'ottone appeso nella luce, cinque lapidi con il ritratto ovale e il numero, lastre con le nicchie appoggiate sul pavimento. Niente esce dall'area di gioco (x 4…316, y 18…152) a parte le catenelle.
2. Sul telefono in orizzontale le icone delle targhe e delle nicchie si riconoscono e si toccano senza sbagliare; ogni zona di tocco è almeno 18×14 pixel della scena.
3. Ogni targa corrisponde alla sua frase (stesso numero nella carta del testo); toccandola la frase compare nel fumetto, toccandola ancora si spegne a scacchiera.
4. Toccando una casella si apre la finestra giusta, senza coprire la casella; un valore si mette con un tocco e la finestra si chiude; i NO si accendono e spengono senza chiuderla; un valore già usato in un'altra tomba si sposta, e il fumetto lo dice.
5. Le caselle vuote mostrano i pallini dei valori ancora possibili; con un solo valore rimasto compare il promemoria a scacchiera.
6. Il cartello conta le caselle piene. «Controlla» incompleto non toglie dorate; sbagliato toglie un terzo di dorata (una ogni 3 errori) senza dire dove; giusto accende le lapidi una alla volta, apre la cripta e poi arriva la carta con il riepilogo.
7. Ricaricando la pagina a metà partita il registro, i NO e le targhe usate sono ancora lì; ricaricando dopo la soluzione la cripta è aperta e non si tocca niente.
8. «Svuota» chiede conferma; il secondo tocco cancella tutto.
9. Con `g.riduciMovimento` niente si muove da solo e la vittoria arriva subito allo stato finale.
10. `node demo/comune/prova.mjs cinque-tombe` finisce con «TUTTO OK».
