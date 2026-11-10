# I teli che mentono — istruzioni per il costruttore

Rompicapo del **Deposito**, difficoltà 4, vale **4 dorate**, una in meno ogni **2 errori** (lo fa il kit). Leggi prima `../REGOLE_COMUNI.md`, `../comune/kit.js` e `../_esempio/`: qui c'è solo quello che è specifico di questo rompicapo.

## 1. In breve

Nel deposito galleggiano cinque fantasmi sotto cinque teli (a righe, a quadri, a pois, rattoppato, bucato). Ognuno è sincero o bugiardo e dice una frase: toccando un fantasma la sua frase compare in un fumetto. A ogni telo è legato un cartellino di carta: toccandolo si scrive SINCERO, poi BUGIARDO, poi torna vuoto.
Quando tutti e cinque hanno il cartellino, «Controlla»: se sono tutti giusti i fantasmi si sfilano il telo e si vede chi ha l'aureola e chi le corna. Se qualcuno è sbagliato è un errore (il gioco non dice quale); al terzo sbaglio i fantasmi cambiano tutte le frasi e si ricomincia con cartellini nuovi.

## 2. Variante

### Le frasi

I teli hanno sempre questi indici, in quest'ordine da sinistra a destra: **0 a righe, 1 a quadri, 2 a pois, 3 rattoppato, 4 bucato**. La frase `frasi[i]` è quella detta dal fantasma `i`. Una frase è un oggetto:

```js
{ tipo: "se", chi: [0, 3], testo: "Se quello a righe è sincero, allora il rattoppato è bugiardo." }
{ tipo: "esattamente", chi: [], k: 3, testo: "Fra noi cinque ci sono esattamente tre bugiardi." }
```

- `tipo`: uno degli otto tipi della tabella;
- `chi`: gli indici dei teli nominati, **in ordine crescente**, mai quello di chi parla (vuoto per i tipi numerici);
- `k`: solo nei tipi `esattamente` (1…4) e `almeno` (2…4);
- `testo`: la frase in italiano, **esattamente** come nella tabella (la verifica la ricostruisce e la confronta lettera per lettera). X, Y, Z sono i nomi dei teli di `chi`, nell'ordine: `quello a righe`, `quello a quadri`, `quello a pois`, `il rattoppato`, `il bucato`; a inizio frase la prima lettera diventa maiuscola.

| `tipo` | Testo | Vera quando |
|---|---|---|
| `bugiardo` | «X è bugiardo.» | X è bugiardo |
| `sincero` | «X è sincero.» | X è sincero |
| `stesso` | «X e Y sono dello stesso tipo.» | X e Y sono tutti e due sinceri o tutti e due bugiardi |
| `esattamente` | «Fra noi cinque c'è esattamente un bugiardo.» (k = 1) / «Fra noi cinque ci sono esattamente due bugiardi.» (k = 2, 3 «tre», 4 «quattro») | i bugiardi, contando anche chi parla, sono proprio k |
| `almeno` | «Fra noi cinque ci sono almeno tre bugiardi.» (k = 2 «due», 3 «tre», 4 «quattro») | i bugiardi, contando anche chi parla, sono k o di più |
| `se` | «Se X è sincero, allora Y è bugiardo.» | non sono sinceri tutti e due (falsa solo se X e Y sono entrambi sinceri) |
| `almenoUno` | «Almeno uno fra X e Y è sincero.» | almeno uno dei due è sincero (anche tutti e due) |
| `unSolo` | «Fra X, Y e Z c'è un solo sincero.» | dei tre è sincero esattamente uno |

Un fantasma sincero dice una frase vera, un bugiardo una frase falsa.

### Il generatore (da copiare così com'è)

Si estraggono cinque frasi a caso e si tengono solo se: le 32 combinazioni di sinceri e bugiardi ne lasciano **una sola** coerente; **ogni frase serve** (togliendone una qualsiasi le combinazioni coerenti diventano più d'una); **nessuna coppia di frasi da sola** svela il tipo di qualcuno; nella soluzione c'è **almeno un sincero e almeno un bugiardo**; le cinque frasi sono **tutte diverse**; **al massimo due** frasi dello stesso tipo. Provato su 2000 semi: riesce sempre, in media 77 tentativi, al massimo 576, circa 1 ms. Se dopo 20 000 tentativi non trovasse niente (non succede), usa la `RISERVA`, che è l'esempio della scheda.

```js
const NOMI = ["quello a righe", "quello a quadri", "quello a pois", "il rattoppato", "il bucato"];
const NUMERI = ["", "un", "due", "tre", "quattro"];
// Tipi di frase e peso nell'estrazione (totale 20).
const TIPI = [["bugiardo", 3], ["sincero", 2], ["stesso", 3], ["esattamente", 2], ["almeno", 2], ["se", 3], ["almenoUno", 2], ["unSolo", 3]];
// Le 32 combinazioni: MONDI[m][i] === true se il fantasma i è sincero.
const MONDI = Array.from({ length: 32 }, (_, m) => [0, 1, 2, 3, 4].map((i) => ((m >> i) & 1) === 1));

/** n teli diversi fra loro e da chi parla, in ordine crescente. */
function altri(rng, chi, n) {
  const scelti = [];
  while (scelti.length < n) {
    const x = Math.floor(rng() * 5);
    if (x !== chi && !scelti.includes(x)) scelti.push(x);
  }
  return scelti.sort((a, b) => a - b);
}
function nuovaFrase(rng, chi) {
  let v = rng() * 20;
  let tipo = "bugiardo";
  for (const [t, p] of TIPI) { if (v < p) { tipo = t; break; } v -= p; }
  if (tipo === "bugiardo" || tipo === "sincero") return { tipo, chi: altri(rng, chi, 1) };
  if (tipo === "stesso" || tipo === "se" || tipo === "almenoUno") return { tipo, chi: altri(rng, chi, 2) };
  if (tipo === "unSolo") return { tipo, chi: altri(rng, chi, 3) };
  if (tipo === "esattamente") return { tipo, chi: [], k: 1 + Math.floor(rng() * 4) };
  return { tipo, chi: [], k: 2 + Math.floor(rng() * 3) }; // almeno
}
/** La frase f è vera nella combinazione T? */
function vera(f, T) {
  const [x, y, z] = f.chi;
  const bugiardi = T.filter((t) => !t).length;
  switch (f.tipo) {
    case "bugiardo": return !T[x];
    case "sincero": return T[x];
    case "stesso": return T[x] === T[y];
    case "esattamente": return bugiardi === f.k;
    case "almeno": return bugiardi >= f.k;
    case "se": return !T[x] || !T[y];
    case "almenoUno": return T[x] || T[y];
    case "unSolo": return [x, y, z].filter((i) => T[i]).length === 1;
  }
  return false;
}
/** Le combinazioni coerenti con le frasi di `quali` (chi è sincero dice il vero, chi è bugiardo il falso). */
function soluzioni(frasi, quali = [0, 1, 2, 3, 4]) {
  return MONDI.filter((T) => quali.every((i) => T[i] === vera(frasi[i], T)));
}
const maiuscola = (s) => s[0].toUpperCase() + s.slice(1);
function testoFrase(f) {
  const [x, y, z] = f.chi.map((i) => NOMI[i]);
  switch (f.tipo) {
    case "bugiardo": return maiuscola(`${x} è bugiardo.`);
    case "sincero": return maiuscola(`${x} è sincero.`);
    case "stesso": return maiuscola(`${x} e ${y} sono dello stesso tipo.`);
    case "esattamente": return f.k === 1 ? "Fra noi cinque c'è esattamente un bugiardo." : `Fra noi cinque ci sono esattamente ${NUMERI[f.k]} bugiardi.`;
    case "almeno": return `Fra noi cinque ci sono almeno ${NUMERI[f.k]} bugiardi.`;
    case "se": return `Se ${x} è sincero, allora ${y} è bugiardo.`;
    case "almenoUno": return `Almeno uno fra ${x} e ${y} è sincero.`;
    case "unSolo": return `Fra ${x}, ${y} e ${z} c'è un solo sincero.`;
  }
  return "";
}
function vaBene(frasi) {
  const tutte = soluzioni(frasi);
  if (tutte.length !== 1) return false;
  for (let i = 0; i < 5; i++) if (soluzioni(frasi, [0, 1, 2, 3, 4].filter((j) => j !== i)).length < 2) return false;
  for (let a = 0; a < 5; a++)
    for (let b = a + 1; b < 5; b++) {
      const s = soluzioni(frasi, [a, b]);
      for (let i = 0; i < 5; i++) if (s.every((T) => T[i] === s[0][i])) return false;
    }
  const bugiardi = tutte[0].filter((t) => !t).length;
  if (bugiardi < 1 || bugiardi > 4) return false;
  if (new Set(frasi.map(testoFrase)).size !== 5) return false;
  const conta = {};
  for (const f of frasi) conta[f.tipo] = (conta[f.tipo] || 0) + 1;
  return Math.max(...Object.values(conta)) <= 2;
}
const RISERVA = [
  { tipo: "unSolo", chi: [1, 3, 4] }, { tipo: "stesso", chi: [2, 3] }, { tipo: "se", chi: [0, 3] },
  { tipo: "se", chi: [0, 2] }, { tipo: "bugiardo", chi: [2] },
];
/** Cinque frasi buone, ognuna col suo testo. Dipende solo da rng. */
function generaTeli(rng) {
  for (let tentativo = 1; tentativo <= 20000; tentativo++) {
    const frasi = [0, 1, 2, 3, 4].map((chi) => nuovaFrase(rng, chi));
    if (vaBene(frasi)) return frasi.map((f) => ({ ...f, testo: testoFrase(f) }));
  }
  return RISERVA.map((f) => ({ ...f, testo: testoFrase(f) }));
}
/** La soluzione delle frasi: "sincero" | "bugiardo" per ogni telo. */
const soluzioneDi = (frasi) => soluzioni(frasi)[0].map((t) => (t ? "sincero" : "bugiardo"));
/** Il seme dei giri dopo il primo (vedi «Il terzo sbaglio»). */
const semeGiro = (seme, giro) => (seme + Math.imul(giro, 0x9e3779b1)) >>> 0;
```

In `avvia`:

```js
variante(rng) { return { frasi: generaTeli(rng) }; },
```

L'oggetto `variante` è **solo** `{ frasi: [5 frasi] }`: niente soluzione dentro (la demo la calcola con `soluzioneDi`, la verifica con il suo risolutore).

### I giri

Il **giro** è quante volte i fantasmi hanno già cambiato frasi: `giro = Math.floor(errori / 3)`, con `errori` del kit (`g.stato().errori`, che resiste al ricaricamento). Le frasi del giro sono:

```js
const frasiDelGiro = (g, giro) => (giro === 0 ? g.variante.frasi : generaTeli(EscapeDemo.casuale(semeGiro(g.seme, giro))));
```

Così tutto dipende solo dal seme e dagli errori: ricaricando la pagina si ritrovano le stesse frasi.

### Esempi (se il codice è copiato esattamente)

**Seme 12345** (quello delle foto di `prova.mjs`), giro 0:

| telo | frase | tipo |
|---|---|---|
| 0 a righe | «Il rattoppato e il bucato sono dello stesso tipo.» | `stesso` [3, 4] |
| 1 a quadri | «Fra noi cinque c'è esattamente un bugiardo.» | `esattamente` k 1 |
| 2 a pois | «Fra quello a quadri, il rattoppato e il bucato c'è un solo sincero.» | `unSolo` [1, 3, 4] |
| 3 rattoppato | «Se quello a pois è sincero, allora il bucato è bugiardo.» | `se` [2, 4] |
| 4 bucato | «Quello a pois è sincero.» | `sincero` [2] |

Soluzione: a righe **bugiardo**, a quadri **bugiardo**, a pois **sincero**, rattoppato **bugiardo**, bucato **sincero**.

**Seme 4242** (quello della verifica), giro 0:

| telo | frase | tipo |
|---|---|---|
| 0 a righe | «Se quello a quadri è sincero, allora quello a pois è bugiardo.» | `se` [1, 2] |
| 1 a quadri | «Il rattoppato è sincero.» | `sincero` [3] |
| 2 a pois | «Fra quello a righe, quello a quadri e il rattoppato c'è un solo sincero.» | `unSolo` [0, 1, 3] |
| 3 rattoppato | «Quello a righe è bugiardo.» | `bugiardo` [0] |
| 4 bucato | «Quello a righe è sincero.» | `sincero` [0] |

Soluzione: sincero, bugiardo, sincero, bugiardo, sincero.

**Seme 4242, giro 1** (dopo tre sbagli): «Fra noi cinque ci sono almeno tre bugiardi.» / «Fra noi cinque c'è esattamente un bugiardo.» / «Se quello a righe è sincero, allora il bucato è bugiardo.» / «Se quello a righe è sincero, allora quello a pois è bugiardo.» / «Fra quello a righe, quello a pois e il rattoppato c'è un solo sincero.» Soluzione: sincero, bugiardo, sincero, bugiardo, bugiardo.

## 3. Regole e mosse

### Lo stato

```js
{
  giro: 0,                                   // Math.floor(errori / 3)
  frasi: [...],                              // le 5 frasi del giro
  cartellini: [null, null, null, null, null], // per telo: null | "sincero" | "bugiardo"
  parla: 0,                                  // il fantasma che sta parlando (0…4), null a rompicapo risolto
}
```

Scrivi la logica come funzioni pulite (stato + mossa → nuovo stato ed esito); il disegno legge solo lo stato. All'avvio `parla` è 0 (parla subito quello a righe, così il fumetto della scena non è mai vuoto) e i cartellini vengono dalla memoria (vedi sotto) o sono tutti vuoti.

**Memoria:** dopo ogni cambio dei cartellini salva `g.memoria = { giro, cartellini }` e chiama `g.salvaMemoria()`. All'avvio, se `g.memoria.giro === giro` e `g.memoria.cartellini` è un array di 5, riprendi quei cartellini; altrimenti tutti vuoti.

### Le mosse

| Mossa | Cosa fa | Esito |
|---|---|---|
| `{ tipo: "parla", telo: i }` | il fantasma `i` parla: il fumetto mostra la sua frase | `{ ok: true, parla: i }` |
| `{ tipo: "gira", telo: i }` | il cartellino di `i` passa da vuoto → `"sincero"` → `"bugiardo"` → vuoto; il fantasma `i` parla | `{ ok: true, cartellini: [...] }` |
| `{ tipo: "cartellino", telo: i, valore }` | scrive direttamente `valore` (`"sincero"`, `"bugiardo"` o `null`); il fantasma `i` parla | `{ ok: true, cartellini: [...] }` |
| `{ tipo: "togli" }` | tutti i cartellini tornano vuoti | `{ ok: true, cartellini: [null, null, null, null, null] }` |
| `{ tipo: "spiega" }` | se la frase di chi parla ha il «?» (vedi §4), il fumetto mostra la spiegazione | `{ ok: true, testo }`, oppure `{ valida: false }` se la frase è semplice |
| `{ tipo: "controlla" }` | vedi sotto | vedi sotto |

Qualsiasi altra cosa (tipo sconosciuto, `telo` che non è un intero 0…4, `valore` diverso da quei tre) → `{ valida: false }`, senza toccare lo stato e **senza errore**.

### Controlla

1. **Manca almeno un cartellino** → mossa impossibile: niente errore. Fumetto «Prima appendi un cartellino a ogni telo.», i cartellini vuoti lampeggiano (vedi §5). Esito `{ valida: false, motivo: "mancano cartellini" }`.
2. **Tutti uguali a `soluzioneDi(frasi)`** → risolto: `parla = null`, fumetto «Tutti giusti: i fantasmi si tolgono il telo!», animazione di vittoria e subito `g.risolto({ riepilogo, ritardo: 1800 })`. Esito `{ risolto: true }`.
   `riepilogo` = `Sinceri: ${elenco}. Bugiardi: ${elenco}.` con i nomi della tabella (minuscoli) uniti da «, » e «e» prima dell'ultimo. Per il seme 12345: «Sinceri: quello a pois e il bucato. Bugiardi: quello a righe, quello a quadri e il rattoppato.»
3. **Almeno uno sbagliato** → **errore**: `g.errore("Qualche cartellino è sbagliato")` (il kit aggiunge da sé il calo delle dorate). Il gioco non dice quale cartellino è sbagliato. Poi leggi `errori = g.stato().errori`:
   - se `Math.floor(errori / 3)` è uguale al giro → **i cartellini restano dove sono**; fumetto, con `n = errori % 3`:
     - n = 1: «Risatine sotto i teli: qualcosa non va. Al terzo sbaglio cambiano frasi.»
     - n = 2: «Ancora risatine. Attento: al prossimo sbaglio cambiano tutte le frasi.»
   - se è cambiato → **il terzo sbaglio**: vedi sotto.

   Esito `{ errore: true, motivo: "Qualche cartellino è sbagliato", sbagliNelGiro: errori % 3, rigenerato: true|false, giro }` (`giro` è quello dopo l'eventuale cambio).

### Il terzo sbaglio

Con 32 combinazioni si potrebbe tirare a indovinare: per questo ogni 3 errori (al 3°, 6°, 9°…) i fantasmi si stufano. Il giro aumenta di uno, `frasi = frasiDelGiro(g, giro)`, tutti i cartellini tornano vuoti, `parla = 0`, memoria salvata. Fumetto: «I fantasmi si sono stufati: frasi nuove, cartellini da rifare.» Animazione del rimescolamento (§5). Gli errori non si azzerano: le dorate le conta il kit su tutti gli errori.

Non ci sono altri limiti: si può controllare quante volte si vuole.

## 4. Interfaccia

### Tocchi (con `g.tocca`, sul tipo `"giu"`)

Nell'ordine, il primo che corrisponde vince (coordinate della scena; `CX = [40, 100, 160, 220, 280]` sono i centri dei fantasmi):

1. il **«?»** del fumetto, se c'è: `|x − ax| ≤ 9` e `|y − ay| ≤ 9`, con `(ax, ay)` il suo centro (§5) → mossa `spiega`;
2. un **cartellino**: `|x − CX[i]| ≤ 28` e `121 ≤ y ≤ 151` → mossa `gira` del telo `i`;
3. un **fantasma**: `|x − CX[i]| ≤ 26` e `79 ≤ y ≤ 120` → mossa `parla` del telo `i`.

Il tocco chiama la stessa funzione delle mosse di `gioca`. La posizione del «?» si calcola dallo stato attuale (con la stessa funzione che usa il disegno), non dall'ultimo fotogramma disegnato. Tastiera facoltativa.

### Bottoni (nell'ordine)

- `g.bottone("Togli tutti", …, { id: "togli" })` → mossa `togli`;
- `g.bottone("Controlla", …, { id: "controlla", forte: true })` → mossa `controlla`.

### Fumetto del kit (`g.messaggio`), testi esatti

| Quando | Testo |
|---|---|
| all'avvio | «Tocca un fantasma per sentirlo e il suo cartellino per cambiarlo.» |
| dopo `gira` o `cartellino`, con n cartellini appesi | n < 5: «Cartellini appesi: n su 5.» — n = 5: «Cartellini appesi: 5 su 5. Quando sei sicuro, premi Controlla.» |
| dopo `togli` | «Cartellini tolti.» |
| dopo `parla` | non cambia |
| dopo `spiega` | la spiegazione (tabella sotto) |
| `controlla` con cartellini mancanti | «Prima appendi un cartellino a ogni telo.» |
| primo sbaglio del giro | «Risatine sotto i teli: qualcosa non va. Al terzo sbaglio cambiano frasi.» |
| secondo sbaglio del giro | «Ancora risatine. Attento: al prossimo sbaglio cambiano tutte le frasi.» |
| terzo sbaglio | «I fantasmi si sono stufati: frasi nuove, cartellini da rifare.» |
| vittoria | «Tutti giusti: i fantasmi si tolgono il telo!» |
| aperto già risolto | «I fantasmi si sono già tolti il telo.» |

### Il «?» delle frasi complicate

Le frasi dei tipi `bugiardo` e `sincero` sono semplici e non hanno il «?». Le altre sì: toccandolo, il fumetto dice il significato preciso del tipo di frase (le frasi «se…, allora…» e «almeno» in italiano si leggono in modi diversi: qui si toglie ogni dubbio).

| `tipo` | Spiegazione (testo esatto) |
|---|---|
| `stesso` | «Dello stesso tipo»: sinceri tutti e due, oppure bugiardi tutti e due. |
| `esattamente` | «Noi cinque» conta anche chi parla; «esattamente»: né di più né di meno. |
| `almeno` | «Noi cinque» conta anche chi parla; «almeno K»: K o di più. (K è la parola: due, tre, quattro; es. «almeno tre»: tre o di più.) |
| `se` | «Se A, allora B» è falsa in un caso solo: A vera e B falsa. |
| `almenoUno` | «Almeno uno» è vera anche quando sono sinceri tutti e due. |
| `unSolo` | «Un solo sincero»: fra i tre ne è sincero uno, né di più né di meno. |

Le virgolette basse «» fanno parte del testo.

### La carta del testo

La carta iniziale (e il bottone «Testo» del kit) deve elencare le frasi del giro attuale. Passa ad `avvia` un **getter** `testo`, che il kit legge ogni volta che apre la carta:

```js
const opzioni = {
  id: "teli-che-mentono", sfondo: "deposito", velo: 0.5,
  get testo() { return testoCarta(); },   // prima che crea abbia girato ritorna undefined: il kit usa scheda.enigma
  variante(rng) { return { frasi: generaTeli(rng) }; },
  crea(g) { … },
};
EscapeDemo.avvia(opzioni);
```

Il testo è questo, con le righe unite da `"\n"` (il kit fa un paragrafo per riga):

```
<scheda.enigma>
Se controlli con qualche cartellino sbagliato, i fantasmi ridacchiano ma non dicono quale. Al terzo sbaglio si stufano e cambiano tutte le frasi.
Ecco cosa dicono:
Telo a righe: «<frasi[0].testo>»
Telo a quadri: «<frasi[1].testo>»
Telo a pois: «<frasi[2].testo>»
Telo rattoppato: «<frasi[3].testo>»
Telo bucato: «<frasi[4].testo>»
```

Dopo il terzo sbaglio il getter restituisce le frasi nuove (la verifica lo controlla aprendo «Testo»).

## 5. Grafica

### Composizione (scena 320×180, sfondo `deposito`, `velo: 0.5`)

Lo sfondo ha a sinistra un appendiabiti con quattro teli grigi (x 8…108, y 34…118), a destra uno scaffale (x 216…306) e al centro la lampadina (x 158…162, y 26…34) col suo cono di luce; il pavimento parte da y 118. I fantasmi galleggiano in fila davanti a tutto, nel cono di luce; il fumetto della frase sta sopra di loro e lascia scoperta la lampadina.

```
y 16-31   [cartello SBAGLI 1/3]  (x 6…71)                      lampadina (160, 26…34)
y 34-73          ┌──────── fumetto della frase (sopra chi parla) ─────────┐ (?)
y 73-77                                   ▼ coda
y 79-120     (righe)     (quadri)      (pois)      (rattoppato)    (bucato)     fantasmi 32×40
y 120-122       |           |             |             |             |          spago
y 123-146   [A RIGHE ]  [A QUADRI]   [ A POIS ]   [RATTOPPATO]  [ BUCATO ]     cartellini 54×24
y 148-151     ombra       ombra         ombra         ombra         ombra
x centri:      40          100           160           220           280
```

Tutto a coordinate intere. Ordine di disegno a ogni fotogramma (su `g.ctx`, dopo `clearRect`): cartello → ombre → per ogni fantasma (evidenziatura, telo, occhi, bocca, oppure, a rompicapo risolto, mucchio e spirito) → spago e cartellino → fumetto con coda e «?» → effetti sopra tutto (risatine, polvere).

Puoi pre-disegnare gli sprite su tele fuori scena (`document.createElement("canvas")`, con `imageSmoothingEnabled = false`) e copiarle con `drawImage` a coordinate intere **senza ridimensionare**: conviene per i cinque teli × 2 fotogrammi, le cinque sagome gialle e i cinque mucchi.

### Il fantasma col telo (sprite 32×40)

Angolo in alto a sinistra in `(CX[i] − 16, 80 + dy)`, con `dy` il galleggiamento. Lettere: `k` contorno (`C.bordo`), `l` luce, `f` tessuto, `F` ombra, `G` ombra profonda, `.` vuoto. I colori di `l f F G` dipendono dal telo e dal pixel (funzione `colorePixel` più sotto); `k` è sempre `C.bordo`.

Fotogramma A:

```
............kkkkkkkk............
..........kkllllFFFGkk..........
.........kllllllffFFFGk.........
........klllllllfffFFFGk........
.......kllffffffffffFFFGk.......
.......kllffffffffffFFFGk.......
......kllffffffffffffFFFGk......
......kllffffffffffffFFFGk......
......kllffffffffffffFFFGk......
.....kllffffffffffffffFFFGk.....
.....kllffffffffffffffFFFGk.....
.....kllffffffffffffffFFFGk.....
.....kllffffffffffffffFFFGk.....
.....kllffffffffffffffFFFGk.....
.....kllffffffffffffffFFFGk.....
.....kllffffffffffffffFFFGk.....
....kllffffffffffffffffFFFGk....
...kllffffffffffffffffffFFFGk...
..kllffffffffffffffffffffFFFGk..
.kllffffffffffffffffffffffFFFGk.
.kllffffffffffffffffffffffFFFGk.
.kllffffffffffffffffffffffFFFGk.
..kllffffffffffffffffffffFFFGk..
..kllffffffffffffffffffffFFFGk..
...klGGfffffffffffffffffFGGGk...
...klGffffFfffffffffFfffFFGGk...
...kllffffFfffffffffFfffFFFGk...
...kllffffFfffffffffFfffFFFGk...
..kllfffffFlffffffffFlfffFFFGk..
..kllfffffFlffffffffFlfffFFFGk..
..kllfffffFlffffffffFlfffFFFGk..
..kllfffffFlffffffffFlfffFFFGk..
..kllfffffFlffffffffFlfffFFFGk..
.kllffffffFlffffffffFlffffFFFGk.
.kllffffffFlffffffffFlffffFFFGk.
.kllffffffFlffffffffFlffffFFFGk.
.kffffffffFlffffffffFlffffFFFGk.
.kFFFFFFFFFFFFFFFFFFFFFFFFFFFGk.
.kFFFFkkFFFFkkFFFFkkFFFFkkFFFGk.
..kkkk..kkkk..kkkk..kkkk..kkkk..
```

Fotogramma B (l'orlo ondeggia): uguale ad A tranne le ultime due righe, che diventano

```
..kFFFFkkFFFFkkFFFFkkFFFFkkFFGk.
...kkkk..kkkk..kkkk..kkkk..kkkk.
```

Fotogramma: `((g.fotogramma >> 1) + i) % 2` (0 = A, 1 = B), cioè cambia due volte al secondo, sfasato fra fantasmi vicini.

**Le stoffe.** Ogni pixel `l f F G` dello sprite (coordinate `x, y` dentro lo sprite, quindi la stoffa si muove col fantasma) prende il colore così:

```js
const { C, GEMME } = EscapeDemo;
const OMBRA = { l: 0, f: 1, F: 2, G: 3 };
// Rampe: [luce, tessuto, ombra, ombra profonda]
const RAMPE = {
  bianco:    [C.bianco, C.pietraChiara, C.pietra, C.ferroChiaro],
  rosso:     [GEMME.rubino[2], C.tappetoChiaro, C.tappeto, C.tappeto],
  bluScuro:  [GEMME.zaffiro[2], GEMME.zaffiro[1], GEMME.zaffiro[0], GEMME.zaffiro[0]],
  bluChiaro: [C.bianco, GEMME.zaffiro[2], C.notteChiara, C.ferroChiaro],
  viola:     [C.lilla, C.viola, C.violaScuro, C.violaScuro],
  giallo:    [C.bianco, C.giallo, C.oro, C.oroScuro],
  grigio:    [C.pietraChiara, C.pietra, C.ferroChiaro, C.ferro],
  verde:     [C.erbaChiara, C.erba, C.erbaScura, C.erbaScura],
  arancio:   [C.fiammaChiara, C.fiamma, C.brace, C.brace],
  acqua:     [GEMME.acquamarina[2], C.acqua, GEMME.acquamarina[0], GEMME.acquamarina[0]],
};
// Le toppe del rattoppato e i buchi del bucato, in coordinate dello sprite.
const TOPPE = [
  { x: 5, y: 19, w: 8, h: 8, r: "verde" },
  { x: 18, y: 27, w: 8, h: 7, r: "arancio" },
  { x: 16, y: 3, w: 6, h: 5, r: "acqua" },
];
const BUCHI = [
  [12, 4], [13, 4], [12, 5],
  [7, 21], [8, 21], [7, 22], [8, 22], [9, 22], [8, 23],
  [26, 19], [26, 20], [27, 20],
  [21, 27], [22, 27], [21, 28], [22, 28], [23, 28], [22, 29],
  [13, 32], [14, 32], [14, 33], [15, 33],
];
function colorePixel(telo, x, y, ch) {
  const s = OMBRA[ch];
  if (telo === 0) return (Math.floor(y / 3) % 2 === 1 ? RAMPE.rosso : RAMPE.bianco)[s];           // a righe
  if (telo === 1) {                                                                              // a quadri (vichy)
    const a = x % 8 < 4, b = y % 8 < 4;
    return (a && b ? RAMPE.bluScuro : a || b ? RAMPE.bluChiaro : RAMPE.bianco)[s];
  }
  if (telo === 2) {                                                                              // a pois
    const riga = Math.floor(y / 5), rx = (x + (riga % 2) * 3) % 6, ry = y % 5;
    return (rx < 2 && ry < 2 ? RAMPE.giallo : RAMPE.viola)[s];
  }
  if (telo === 3) {                                                                              // rattoppato
    for (const t of TOPPE)
      if (x >= t.x && x < t.x + t.w && y >= t.y && y < t.y + t.h) {
        const orlo = x === t.x || y === t.y || x === t.x + t.w - 1 || y === t.y + t.h - 1;
        if (orlo) return (x + y) % 2 === 0 ? C.bordo : RAMPE[t.r][2];                            // punti di cucito
        return RAMPE[t.r][Math.min(s, 2)];
      }
    return RAMPE.bianco[s];
  }
  if (BUCHI.some(([a, b]) => a === x && b === y)) return C.nero;                                 // bucato
  return RAMPE.grigio[s];
}
```

Risultato: a righe = bianco a strisce rosse orizzontali; a quadri = vichy azzurro; a pois = viola a pois gialli; rattoppato = bianco con tre toppe cucite (verde, arancio, acquamarina sulla testa); bucato = grigio con cinque buchi neri. Sono tutti molto più chiari e saturi dei teli grigi dell'appendiabiti dello sfondo, e solo i nostri hanno occhi e cartellino: non si confondono.

**Occhi e bocca** (sopra lo sprite, coordinate dello sprite con origine `(ox, oy)`):

- due fori `C.nero` 3×4 in `(ox+10, oy+11)` e `(ox+19, oy+11)`;
- le pupille `C.luna` 1×2 in `(ox+11+guarda, oy+12)` e `(ox+20+guarda, oy+12)`. `guarda` = 0 per chi parla (guarda il giocatore) e quando nessuno parla; per gli altri `Math.sign(CX[parla] − CX[i])`: guardano chi sta parlando;
- battito di ciglia: pupille nascoste nel fotogramma in cui `(g.fotogramma + 7 * i) % 29 === 0`;
- bocca chiusa: `C.nero` 2×1 in `(ox+15, oy+19)`; aperta: `C.nero` 2×3 in `(ox+15, oy+18)`. Chi parla muove la bocca per 1200 ms da quando ha cominciato a parlare (aperta nei fotogrammi pari, chiusa nei dispari), poi la tiene chiusa.

**Chi parla è evidenziato:** prima del suo telo, disegna la sagoma dello stesso fotogramma tutta in `C.giallo` spostata di 1 pixel a sinistra, a destra, in alto e in basso (ogni pixel non vuoto dello sprite diventa giallo): ne esce un contorno giallo di 1 pixel attorno al contorno scuro.

**Galleggiamento:** `dy = [0, -1, -1, -1, 0, 1, 1, 1][(g.fotogramma + 3 * i) % 8]`. Spago e cartellino si muovono con lo stesso `dy`.

**Ombra a terra:** sotto ogni fantasma un'ellisse di puntini `C.nero` a retino (non il `retino` del kit, che dipinge due colori: qui solo i puntini), centro `CX[i]`, righe y 148…151, mezza larghezza 16, densità 0,55:

```js
for (let j = 0; j < 4; j++)
  for (let k = -16; k <= 16; k++) {
    if ((k / 16) ** 2 + ((j - 1.5) / 2) ** 2 > 1) continue;
    const px = CX[i] + k, py = 148 + j;
    if (EscapeDemo.BAYER[py & 3][px & 3] / 16 < 0.55) EscapeDemo.rett(ctx, C.nero, px, py, 1, 1);
  }
```

### Il cartellino (54×24)

Spago: `C.pietraChiara` 1×3 in `(CX[i], 120 + dy)`. Cartellino con angolo in alto a sinistra `(x, y) = (CX[i] − 27, 123 + dy)`:

```js
const w = 54, h = 24;
rett(ctx, bordo, x + 1, y, w - 2, h);          // contorno con gli angoli smussati di 1 pixel
rett(ctx, bordo, x, y + 1, w, h - 2);
rett(ctx, col[1], x + 1, y + 1, w - 2, h - 2); // carta
rett(ctx, col[0], x + 1, y + 1, w - 2, 1);     // luce in alto e a sinistra
rett(ctx, col[0], x + 1, y + 1, 1, h - 2);
rett(ctx, col[2], x + 1, y + h - 2, w - 2, 1); // ombra in basso e a destra
rett(ctx, col[2], x + w - 2, y + 1, 1, h - 2);
rett(ctx, C.ferroChiaro, CX[i] - 2, y + 1, 4, 4); // occhiello
rett(ctx, C.nero, CX[i] - 1, y + 2, 2, 2);
testo(ctx, NOME[i], CX[i], y + 6, { piccolo: true, colore: C.bordo, ombra: null, allinea: "centro" });
```

con `bordo = C.bordo` (salvo i lampeggi sotto) e `NOME = ["A RIGHE", "A QUADRI", "A POIS", "RATTOPPATO", "BUCATO"]`. Poi, secondo lo stato:

| stato | `col` (luce, carta, ombra) | scritta |
|---|---|---|
| vuoto | `C.bianco, C.pietraChiara, C.pietra` | una riga tratteggiata dove si scrive: pixel `C.pietra` 1×1 a x = CX[i]−14, −12, …, +14, y = y+19 |
| sincero | `GEMME.smeraldo[2], GEMME.smeraldo[1], GEMME.smeraldo[0]` | «SINCERO» 5×7 `C.bianco`, ombra `C.bordo`, centrata, a y+14 |
| bugiardo | `GEMME.rubino[2], C.tappetoChiaro, C.tappeto` | «BUGIARDO» 5×7 `C.bianco`, ombra `C.bordo`, centrata, a y+14 |

Verde e rosso aiutano, ma la scritta c'è sempre (chi non distingue i colori legge la parola).

**Giro del cartellino** (dopo `gira`, `cartellino`): per 150 ms il cartellino è disegnato schiacciato, largo 26 invece di 54 (`x = CX[i] − 13`), con i colori del nuovo stato e senza scritte né occhiello; poi normale.

### Il fumetto della frase

Si disegna quando `parla !== null` (e non durante il rimescolamento). Geometria, da una funzione sola che usano sia il disegno sia i tocchi sia `posizioneAiuto`:

```js
function aCapo(t, max = 34) {             // a capo a parole intere, al massimo 34 caratteri per riga
  const righe = []; let r = "";
  for (const p of t.split(" ")) {
    if (!r) r = p;
    else if ((r + " " + p).length <= max) r += " " + p;
    else { righe.push(r); r = p; }
  }
  if (r) righe.push(r);
  return righe;
}
function geometriaFumetto(stato) {
  if (stato.parla === null) return null;
  const f = stato.frasi[stato.parla], cx = CX[stato.parla];
  const righe = aCapo(f.testo);                                    // 1, 2 o al massimo 3 righe (garantito)
  const larg = Math.max(...righe.map((r) => EscapeDemo.larghezzaTesto(r)));
  const w = Math.max(40, larg + 12), h = 8 + righe.length * 10;
  const x = Math.max(6, Math.min(312 - w, cx - Math.floor(w / 2)));  // a destra resta posto per il «?»
  const y = 74 - h;                                                // il fondo sta sempre a y 73
  const aiuto = f.tipo === "bugiardo" || f.tipo === "sincero" ? null : { x: x + w - 2, y: y - 1 }; // centro del «?»
  return { x, y, w, h, righe, cx, aiuto };
}
```

Disegno:

- riquadro `C.pietraChiara` con contorno `C.bordo` e angoli smussati di 1 pixel (come il cartellino), riga di luce `C.bianco` in `(x+2, y+1, w−4, 1)`, riga d'ombra `C.pietra` in `(x+2, y+h−2, w−4, 1)`;
- le righe di testo 5×7 `C.bordo`, **senza ombra**, ognuna centrata nel fumetto, la riga n a `y + 6 + 10·n`;
- **accento sulle «è»**: i caratteri pixel perdono gli accenti, ma qui «è» conta (si confonde con «e»). Per ogni «è» della riga (indice `k` nella stringa originale, ogni carattere largo 6) disegna due pixel `C.bordo` in `(tx + 6k + 1, ty − 3)` e `(tx + 6k + 2, ty − 2)`, con `(tx, ty)` l'inizio della riga;
- la coda, sprite in `(cx − 4, 73)` (la prima riga apre il contorno del fumetto), `f` = `C.pietraChiara`:

```
kfffffffk
.kfffffk.
..kfffk..
...kfk...
....k....
```

- il «?», se `aiuto` non è null: sprite 11×11 con l'angolo in `(aiuto.x − 5, aiuto.y − 5)`, `k` = `C.bordo`, `o` = `C.oro`, `O` = `C.oroScuro`, `y` = `C.bianco`:

```
...kkkkk...
.kkoooookk.
.kooyyyook.
koyyooyyook
kooooooyook
koooooyyook
kooooyyoook
koooooooOok
.kooooyoOk.
.kkOOOOOkk.
...kkkkk...
```

Il fumetto non copre mai i fantasmi (finisce a y 77 con la coda, i fantasmi cominciano a y 79) né la lampadina (comincia al più a y 36).

### Il cartello degli sbagli

Appeso alla trave in alto a sinistra: due spaghi `C.pietra` 1×4 in `(12, 16)` e `(64, 16)`; `riquadro(ctx, 6, 19, 66, 13, C.legnoChiaro)`; luce `C.legnoLuce` in `(7, 20, 64, 1)`; ombra `C.legno` in `(7, 30, 64, 1)`. Scritta 5×7 centrata a x 39, y 22, ombra `C.bordo`: `SBAGLI n/3` con `n = errori % 3`, in `C.pietraChiara` se n = 0, `C.giallo` se 1, `C.tappetoChiaro` se 2. A rompicapo risolto: «SVELATI!» in `C.acqua`.

### Gli spiriti (rompicapo risolto)

Sotto i teli ci sono piccoli spiriti: i sinceri con l'aureola, i bugiardi con le corna e la linguaccia.

**Il mucchio** (il telo afflosciato, 36×12) in `(CX[i] − 18, 108)`; i colori con `colorePixel(i, x − 2, y + 22, ch)` (x, y dentro il mucchio), così stoffa, toppe e buchi restano riconoscibili:

```
...........kkkkkkkkkkkk.............
.......kkkkllllllllffffkkkk.........
.....kkllllllffffffffffFFFGkkk......
...kkllfffffffffffffffffffFFFGkk....
..kllfffffffffffffffffffFfffFFFGk...
.kllffffffffFFfffffffffffFfffFFFGk..
kllffffffffFGGFffffffffffFffffFFFGk.
kllffffffffFGGFffffffffffffffffFFFGk
kllffffffffffffffffffffffffffffFFFGk
kllffffffffffffffffffffffffffffFFFGk
.kFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFk.
..kkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkk..
```

Lo spago del cartellino resta in `(CX[i], 120)`: ora il cartellino è legato al mucchio.

**Lo spirito** (20×22) con l'angolo in `(ox, oy) = (CX[i] − 10, 80 + dyS)`, `dyS = [0, -1, -1, -2, -2, -2, -1, -1][(g.fotogramma + 2 * i) % 8]`; `k` = `C.bordo`, `w` = `GEMME.acquamarina[2]`, `l` = `C.bianco`, `c` = `C.acqua`:

```
.......kkkkkk.......
.....kkwwwwwwkk.....
....kwllwwwwwwwk....
...kwllwwwwwwwwck...
...kwlwwwwwwwwwck...
..kwlwwwwwwwwwwwck..
..kwwwwwwwwwwwwwck..
k.kwwwwwwwwwwwwwck.k
wkkwwwwwwwwwwwwwckkw
kwwwwwwwwwwwwwwwwcck
.kkwwwwwwwwwwwwwckk.
..kwwwwwwwwwwwwwck..
..kwwwwwwwwwwwwcck..
...kwwwwwwwwwwcck...
...kcwwwwwwwwwcck...
....kcwwwwwwwcck....
.....kcwwwwwwck.....
......kccwwcck......
.......kkccck.......
.........kcck.......
..........kck.......
...........kk.......
```

Occhi: `C.nero` 2×2 in `(ox+6, oy+5)` e `(ox+12, oy+5)`.

- **Sincero:** aureola in `(ox+5, oy−7)` (`k` `C.bordo`, `y` `C.giallo`, `o` `C.oro`); sorriso `C.bordo`: pixel in `(ox+7, oy+9)` e `(ox+12, oy+9)`, riga 4×1 in `(ox+8, oy+10)`. Luccichio: nel fotogramma in cui `(g.fotogramma + 3 * i) % 8 === 0`, il pixel `(ox+7, oy−6)` diventa `C.bianco`.

```
..kkkkkk..
.kyyyyyyk.
kyokkkkoyk
.kyyyyyyk.
..kkkkkk..
```

- **Bugiardo:** due corna, sprite 3×4 (`k` `C.bordo`, `r` `C.tappetoChiaro`) in `(ox+3, oy−2)` e specchiato (`specchia: true`) in `(ox+14, oy−2)`; sopracciglia furbe `C.bordo` 3×1 in `(ox+6, oy+4)` e `(ox+11, oy+4)`; ghigno `C.bordo` 6×1 in `(ox+7, oy+9)`; linguaccia `C.rosa` 2×2 in `(ox+10, oy+10)` con sotto `C.bordo` 2×1 in `(ox+10, oy+12)`, visibile solo quando `((g.fotogramma >> 2) + i) % 2 === 0` (entra ed esce).

```
k..
rk.
rrk
krk
```

### Animazioni

Tutte calcolate da `g.tempo` (o `g.fotogramma` per quelle continue), sempre su pixel interi. Con `g.riduciMovimento`: niente galleggiamento, orlo fermo sul fotogramma A, niente ciglia, bocca chiusa, niente scosse, risatine, polvere né giro del cartellino; la vittoria salta subito allo stato finale.

- **Errore** (da `tE` = `g.tempo` dell'errore, `d = g.tempo − tE`):
  - `d < 500`: tutti i fantasmi, con spago e cartellino, si spostano in orizzontale di `[1, -1, 1, -1][Math.floor(d / 125)]`; tutte le bocche aperte nei fotogrammi pari (ridacchiano); il contorno dei cartellini è `C.tappetoChiaro` quando `Math.floor(d / 125)` è pari (lampo rosso su tutti: il gioco non dice quale è sbagliato);
  - `d < 900`: risatine: «IH» 3×5 `C.lilla` con ombra `C.bordo`, centrata in `CX[i] + 8`, a y `76 − Math.floor(d / 150)`, sopra ai fantasmi con `(i + Math.floor(d / 250)) % 2 === 0`.
- **Rimescolamento** (terzo sbaglio, dopo l'animazione d'errore): per `500 ≤ d < 900` i teli sono disegnati come sagome tutte `C.bianco` quando `Math.floor((d − 500) / 100)` è pari, normali (con le frasi e i cartellini nuovi) altrimenti; nello stesso tempo da ogni fantasma partono 8 sbuffi di polvere 2×2: lo sbuffo n (0…7) ha l'angolo in alto a sinistra in `x = CX[i] + Math.round(Math.cos(n * Math.PI / 4) * r) - 1`, `y = 100 + Math.round(Math.sin(n * Math.PI / 4) * r * 0.6) - 1`, con `r = Math.round((d - 500) / 400 * 20)`, colore `C.pietraChiara` per n pari e `C.pietra` per n dispari. Il fumetto della frase resta nascosto per `d < 900`. Lo stato cambia subito, solo il disegno aspetta.
- **Cartellini mancanti** (Controlla rifiutato): per 600 ms i cartellini vuoti hanno il contorno `C.giallo` nei fotogrammi pari.
- **Vittoria** (da `tV`, `d = g.tempo − tV`; il fumetto della frase e l'evidenziatura spariscono subito):
  - `d < 375`: tutti i cartellini col contorno `C.bianco` quando `Math.floor(d / 125)` è pari;
  - per il fantasma i, `p = clamp((d − 300 − 150·i) / 450, 0, 1)`: lo spirito sale da y 100 a y 80 (`oy = 100 − Math.round(20·p)`, disegnato dietro al telo); il telo scende di `Math.round(6·p)` pixel e si dissolve: si disegnano solo i suoi pixel con `BAYER[py & 3][px & 3] / 16 >= p` (px, py coordinate della scena); il mucchio compare all'inverso, solo i pixel con `BAYER / 16 < p`. Ordine: ombra, mucchio, spirito, telo che si dissolve, spago, cartellino;
  - da `d ≥ 1350` (tutti a p = 1): lo stato finale, con gli spiriti che galleggiano (`dyS`), luccichio delle aureole e linguacce.
  La carta della vittoria arriva da sola dopo 1800 ms (`ritardo`).
- **Già risolto** (`g.giaRisolto`): subito lo stato finale (mucchi, spiriti, cartellini giusti del giro `Math.floor(errori / 3)`, cartello «SVELATI!»), niente fumetto della frase. La soluzione si ricava da variante + errori.

### Colori

Solo `EscapeDemo.C` e `EscapeDemo.GEMME`: le rampe dei teli, i cartellini e gli spiriti usano le pietre `rubino`, `zaffiro`, `smeraldo`, `acquamarina` come scritto sopra. Nessun colore fuori paletta.

## 6. Aggancio per le prove

```js
g.espone({
  gioca: (m) => mossa(m),                 // la stessa funzione dei tocchi e dei bottoni; esiti come in §3
  statoGioco: () => ({
    giro,                                 // Math.floor(errori / 3)
    frasi,                                // le 5 frasi del giro, stesso formato della variante (copia)
    cartellini: [...cartellini],          // null | "sincero" | "bugiardo"
    parla,                                // 0…4, null a rompicapo risolto
    sbagliNelGiro: errori % 3,            // quello che segna il cartello
    svelati,                              // true a rompicapo risolto (anche se aperto già risolto)
  }),
  posizioneTelo: (i) => ({ x: CX[i], y: 100 }),
  posizioneCartellino: (i) => ({ x: CX[i], y: 135 }),
  posizioneAiuto: () => { const gf = geometriaFumetto(stato); return gf && gf.aiuto ? { x: gf.aiuto.x, y: gf.aiuto.y } : null; },
});
```

Tutte e tre le funzioni di posizione sono **obbligatorie** per questa demo: la verifica clicca davvero su cartellini, fantasmi e «?». Lo stato cambia subito a ogni mossa, prima delle animazioni. Gli esiti sono esattamente quelli della tabella di §3 (la verifica legge `valida`, `errore`, `rigenerato`, `giro`, `risolto`). La verifica legge anche il testo del fumetto (`.kit-fumetto`) e della carta (`.kit-carta`): i testi devono essere quelli di §4, lettera per lettera.

## 7. Criteri di accettazione

Giocando e guardando le foto (`node demo/comune/prova.mjs teli-che-mentono` deve finire con «TUTTO OK»):

1. Cinque fantasmi in fila, ben distinti per stoffa (righe rosse, vichy azzurro, viola a pois gialli, toppe cucite, grigio bucato), molto più vivi dei teli grigi dell'appendiabiti dello sfondo; galleggiano sfasati, l'orlo ondeggia, ogni tanto sbattono le ciglia.
2. All'apertura parla quello a righe: contorno giallo attorno a lui, bocca che si muove, fumetto sopra di lui con la coda che lo indica, gli altri lo guardano. La lampadina dello sfondo resta visibile.
3. Il fumetto si legge bene anche nella foto del telefono: testo scuro su chiaro, a capo a parole intere, al massimo 3 righe, accento sulle «è» (es. «C'È»).
4. Toccando un altro fantasma il fumetto si sposta su di lui; toccando un cartellino cambia vuoto → SINCERO (verde) → BUGIARDO (rosso) → vuoto con un piccolo giro; il nome del telo sul cartellino si legge sempre.
5. Il «?» arancione compare solo sulle frasi complicate e la spiegazione arriva nel fumetto del kit.
6. «Controlla» con un cartellino mancante: niente errore, i vuoti lampeggiano in giallo. Con uno sbagliato: errore del kit, fantasmi che ridacchiano («IH»), lampo rosso su tutti i cartellini, cartello «SBAGLI 1/3» in giallo; i cartellini restano al loro posto.
7. Al terzo sbaglio: lampi bianchi, polvere, frasi nuove nel fumetto e nella carta «Testo», cartellini vuoti, cartello «SBAGLI 0/3»; ricaricando la pagina le frasi restano quelle nuove.
8. Vittoria: i teli si afflosciano a terra uno dopo l'altro, escono gli spiriti (aureola per i sinceri, corna e linguaccia per i bugiardi), il cartello dice «SVELATI!», poi la carta col riepilogo.
9. Riaperto già risolto: si vede direttamente la scena finale.
10. Niente dentro le barre del kit (y < 16 e y ≥ 154); niente testo HTML nella scena, niente forme smussate né trasparenze, solo coordinate intere.
