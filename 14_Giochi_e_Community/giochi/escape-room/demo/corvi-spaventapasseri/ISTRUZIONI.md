# I corvi dello spaventapasseri — istruzioni per il costruttore

Rompicapo del **Cancello** (`scheda.js`: 4 dorate, una in meno ogni 2 errori). È un **Nim «misère»** giocato contro lo spaventapasseri, che non sbaglia mai: quattro pali pieni di corvi, a turno si fanno volare via quanti corvi si vuole da un palo solo, e **chi fa volare via l'ultimo corvo del cortile perde**.

Da consegnare in questa cartella: `index.html` (copia di `_esempio/index.html` con `<title>I corvi dello spaventapasseri</title>`) e `gioco.js`. Valgono tutte le regole di `REGOLE_COMUNI.md`. La verifica (`verifica.mjs`, già scritta) usa alla lettera i formati del § 6: rispettali esattamente.

```js
const OPZIONI = { id: "corvi-spaventapasseri", sfondo: "cancello", velo: 0.5, variante, crea };
EscapeDemo.avvia(OPZIONI);
```

---

## 1. In breve

Sul prato davanti al cancello ci sono quattro pali di legno con tre traverse ciascuno; sulle traverse sono appollaiati da 1 a 9 corvi per palo, e un cartello sotto ogni palo dice quanti sono. In mezzo, sul vialetto, c'è lo spaventapasseri con la testa di zucca. Il giocatore tocca un corvo (si preparano a volare lui e quelli dopo di lui sullo stesso palo) e preme **«Via!»**; subito dopo lo spaventapasseri risponde facendo volare via i suoi. Si vince quando lo spaventapasseri è costretto a far volare via l'ultimo corvo e si prende la maledizione. Se invece l'ultimo corvo lo fa volare via il giocatore, la partita è persa: conta come **errore** e si ricomincia con altri pali.

---

## 2. Variante

### 2.1 Cosa cambia per giocatore

La variante è una lista di **10 partite**: ognuna è la disposizione di partenza dei quattro pali (corvi sul primo, secondo, terzo e quarto palo, da sinistra). Si gioca la prima; dopo ogni partita persa (o resa) si passa alla successiva; dopo la decima si ricomincia dalla prima (`partite[n % 10]`).

Ogni disposizione è presa da un **elenco già verificato** (qui sotto, 79 disposizioni). Ognuna ha:

- quattro pali con un numero di corvi **tutti diversi**, da 1 a 9 (niente coppie uguali, che suggerirebbero il trucco dello specchio);
- da **16 a 26 corvi** in tutto (la partita dura abbastanza);
- è **vincente per chi comincia** (cioè il giocatore) e ha **una sola mossa d'apertura giusta**: qualsiasi altra prima mossa, contro lo spaventapasseri perfetto, porta alla sconfitta.

Verificato a forza bruta su tutte le posizioni fino a 9 corvi per palo: l'elenco contiene esattamente tutte le disposizioni con questi vincoli, da ognuna giocando sempre la mossa giusta si vince (al massimo 11 mosse, in media 8) e dopo una mossa sbagliata si perde sempre.

### 2.2 L'elenco (copialo così com'è, **nello stesso ordine**: il generatore ne dipende)

```js
// 79 disposizioni (ordinate in modo crescente): vincenti per chi comincia, una sola apertura giusta.
const ELENCO = [
  [1,2,4,9],[1,2,5,8],[1,2,5,9],[1,2,6,8],[1,2,6,9],[1,2,7,8],[1,2,7,9],[1,2,8,9],
  [1,3,4,8],[1,3,4,9],[1,3,5,8],[1,3,5,9],[1,3,6,8],[1,3,6,9],[1,3,7,8],[1,3,7,9],[1,3,8,9],
  [1,4,5,8],[1,4,5,9],[1,4,6,8],[1,4,6,9],[1,4,7,8],[1,4,7,9],[1,4,8,9],
  [1,5,6,8],[1,5,6,9],[1,5,7,8],[1,5,7,9],[1,5,8,9],[1,6,7,8],[1,6,7,9],[1,6,8,9],[1,7,8,9],
  [2,3,4,8],[2,3,4,9],[2,3,5,8],[2,3,5,9],[2,3,6,8],[2,3,6,9],[2,3,7,8],[2,3,7,9],
  [2,4,5,8],[2,4,5,9],[2,4,6,8],[2,4,6,9],[2,4,7,8],[2,4,7,9],[2,4,8,9],
  [2,5,6,8],[2,5,6,9],[2,5,7,8],[2,5,7,9],[2,5,8,9],[2,6,7,8],[2,6,7,9],[2,6,8,9],[2,7,8,9],
  [3,4,5,8],[3,4,5,9],[3,4,6,8],[3,4,6,9],[3,4,7,8],[3,4,7,9],[3,4,8,9],
  [3,5,6,8],[3,5,6,9],[3,5,7,8],[3,5,7,9],[3,5,8,9],[3,6,7,8],[3,6,7,9],[3,6,8,9],
  [4,5,6,8],[4,5,6,9],[4,5,7,8],[4,5,7,9],[4,6,7,8],[4,6,7,9],[5,6,7,8],
];
```

### 2.3 Il generatore

```js
const { mescola } = EscapeDemo;
function variante(rng) {
  const scelte = mescola(rng, ELENCO).slice(0, 10);          // 10 disposizioni diverse
  return { partite: scelte.map((q) => mescola(rng, q)) };     // e i pali in ordine casuale
}
```

Dipende solo da `rng`; niente `Math.random()`.

### 2.4 Formato

```js
{ partite: [[4, 8, 7, 3], [5, 2, 8, 9], …] }   // 10 array di 4 interi: corvi sul palo 1, 2, 3, 4 (da sinistra)
```

### 2.5 Esempi (con questo generatore e questo elenco devono uscire esattamente così)

| seme | `partite` | prima mossa giusta |
|---|---|---|
| 12345 (quello delle foto di `prova.mjs`) | `[4,8,7,3] [5,2,8,9] [1,5,7,9] [9,6,5,2] [1,8,3,4] [2,4,6,8] [6,1,8,3] [8,1,7,4] [6,7,9,2] [8,1,9,3]` | dal 2° palo via tutti e 8 |
| 12346 | `[9,1,6,8] [1,8,2,7] [2,3,9,6] [9,2,6,1] [4,3,9,1] [9,5,6,4] [3,4,8,1] [8,2,3,4] [6,9,2,8] [8,9,7,2]` | dal 3° palo via 6 |
| 7 | `[9,7,1,8] [1,4,8,6] [5,1,9,6] [1,2,9,5] [9,8,2,7] [8,2,7,1] [8,5,1,6] [1,3,9,5] [3,8,7,4] [2,7,6,9]` | dal 2° palo via 7 |

Partita completa col seme 12345 giocando sempre bene (pali scritti come corvi sul 1°, 2°, 3°, 4° palo; nel codice gli indici dei pali sono 0–3). Serve per controllare la risposta dello spaventapasseri:

| prima | tu | lo spaventapasseri | dopo |
|---|---|---|---|
| 4 8 7 3 | 2° palo, via 8 | 3° palo, via 1 | 4 0 6 3 |
| 4 0 6 3 | 4° palo, via 1 | 3° palo, via 1 | 4 0 5 2 |
| 4 0 5 2 | 4° palo, via 1 | 3° palo, via 1 | 4 0 4 1 |
| 4 0 4 1 | 4° palo, via 1 | 1° palo, via 1 | 3 0 4 0 |
| 3 0 4 0 | 3° palo, via 1 | 1° palo, via 1 | 2 0 3 0 |
| 2 0 3 0 | 3° palo, via 1 | 1° palo, via 1 | 1 0 2 0 |
| 1 0 2 0 | 3° palo, via 2 | 1° palo, via 1 (l'ultimo!) | 0 0 0 0 → **vinto** |

---

## 3. Regole e mosse

### 3.1 Lo stato logico

```js
stato = {
  pali: [4, 8, 7, 3],     // corvi rimasti su ogni palo (indici 0..3 da sinistra)
  partita: 0,             // indice della partita in corso: si gioca partite[partita % 10]
  mosse: [],              // mosse della partita in corso: { chi: "tu" | "spaventapasseri", palo, quanti }
  vinta: false,
}
```

Lo stato iniziale è `{ pali: [...partite[0]], partita: 0, mosse: [], vinta: false }` (oppure quello salvato, § 3.8).

### 3.2 Le mosse

- `{ palo, quanti }`: il giocatore fa volare via `quanti` corvi dal palo `palo`. Valida se `palo` è un intero 0–3, `quanti` è un intero ≥ 1 e `quanti ≤ pali[palo]`. Altrimenti è **impossibile**: rifiutata con `{ valida: false, motivo }` (`"palo inesistente"`, `"almeno un corvo"`, `"non ci sono abbastanza corvi"`), stato invariato, **non è un errore**, niente messaggi né animazioni.
- `{ arrenditi: true }`: il giocatore si arrende (vedi § 3.5).

Dalla UI arrivano solo mosse valide (si possono scegliere solo corvi che ci sono); quelle impossibili arrivano solo dall'aggancio delle prove.

### 3.3 La logica (funzioni pulite, da copiare)

```js
/** Nim misère: chi deve muovere vince? (senza corvi ha vinto chi muove: l'ultimo l'ha preso l'altro) */
function vinceChiMuove(pali) {
  const x = pali.reduce((a, b) => a ^ b, 0);
  return pali.some((n) => n > 1) ? x !== 0 : x === 0;
}
/** La prima mossa che lascia l'avversario in una posizione persa: palo da sinistra, poi quanti dal più piccolo. */
function mossaVincente(pali) {
  for (let palo = 0; palo < 4; palo++)
    for (let quanti = 1; quanti <= pali[palo]; quanti++) {
      const dopo = [...pali];
      dopo[palo] -= quanti;
      if (!vinceChiMuove(dopo)) return { palo, quanti };
    }
  return null;
}
/** Lo spaventapasseri: gioca perfetto; se è in una posizione persa fa volare via UN corvo dal palo più alto
 *  (a parità, il primo da sinistra), per non regalare indizi. */
function rispostaSpaventapasseri(pali) {
  const m = mossaVincente(pali);
  if (m) return m;
  let alto = -1;
  for (let p = 0; p < 4; p++) if (pali[p] > 0 && (alto < 0 || pali[p] > pali[alto])) alto = p;
  return { palo: alto, quanti: 1 };
}
/** stato + mossa → { stato, esito }. Non tocca il kit né il disegno. */
function applica(stato, mossa, partite) {
  const nuovaPartita = (motivo) => {
    const partita = stato.partita + 1;
    const pali = [...partite[partita % partite.length]];
    return { stato: { pali, partita, mosse: [], vinta: false },
             esito: { errore: true, persa: true, motivo, partita, pali: [...pali] } };
  };
  if (mossa && mossa.arrenditi === true) return nuovaPartita("resa");
  const palo = mossa && mossa.palo, quanti = mossa && mossa.quanti;
  if (!Number.isInteger(palo) || palo < 0 || palo > 3) return { stato, esito: { valida: false, motivo: "palo inesistente" } };
  if (!Number.isInteger(quanti) || quanti < 1) return { stato, esito: { valida: false, motivo: "almeno un corvo" } };
  if (quanti > stato.pali[palo]) return { stato, esito: { valida: false, motivo: "non ci sono abbastanza corvi" } };
  const pali = [...stato.pali];
  pali[palo] -= quanti;
  const mosse = [...stato.mosse, { chi: "tu", palo, quanti }];
  if (pali.every((n) => n === 0)) return nuovaPartita("ultimo corvo");          // l'ultimo l'hai preso tu
  const r = rispostaSpaventapasseri(pali);
  pali[r.palo] -= r.quanti;
  mosse.push({ chi: "spaventapasseri", palo: r.palo, quanti: r.quanti });
  if (pali.every((n) => n === 0))                                                // l'ultimo l'ha preso lui
    return { stato: { pali, partita: stato.partita, mosse, vinta: true }, esito: { risolto: true, risposta: r, pali: [...pali] } };
  return { stato: { pali, partita: stato.partita, mosse, vinta: false }, esito: { ok: true, risposta: r, pali: [...pali] } };
}
```

Nota importante: **la risposta dello spaventapasseri entra nello stato nella stessa chiamata** della mossa del giocatore. Le animazioni (corvi che volano, spaventapasseri che «pensa») vengono dopo e leggono una vista separata (§ 5.8); lo stato logico è già quello finale.

### 3.4 La funzione `mossa(m)`, unica per tocchi, bottoni e prove

`mossa(m)` chiama `applica`, salva il nuovo stato e poi, secondo l'esito:

| esito | cosa fa |
|---|---|
| `valida: false` | niente (ritorna l'esito) |
| `ok` | azzera selezione e conferma della resa, salva la memoria, avvia la sequenza «turno» (§ 5.8), messaggi del § 4.3 |
| `persa`, motivo `"ultimo corvo"` | `g.errore("Hai fatto volare via l'ultimo corvo: la maledizione è tua")`, salva la memoria, sequenza «persa» |
| `persa`, motivo `"resa"` | `g.errore("Ti sei arreso: partita persa")`, salva la memoria, sequenza «resa» |
| `risolto` | salva la memoria, `g.risolto({ riepilogo, ritardo: 2900 })`, sequenza «vittoria» |

Il `riepilogo` della carta di vittoria (due righe):

```
Lo spaventapasseri ha dovuto far volare via l'ultimo corvo: la maledizione è sua.
Hai vinto la partita numero {partita + 1} in {n} mosse.
```

dove `n` è il numero di mosse con `chi: "tu"` della partita vinta. Mai scrivere la strategia (pacchetti, xor…) nella carta o nei messaggi.

### 3.5 Errori

- **Conta come errore solo perdere la partita**: far volare via l'ultimo corvo, oppure arrendersi (bottone «Arrenditi» confermato, o `{ arrenditi: true }`). Testi esatti di `g.errore`: `"Hai fatto volare via l'ultimo corvo: la maledizione è tua"` e `"Ti sei arreso: partita persa"` (il kit aggiunge da sé « · ora le dorate in palio sono N»).
- **Non** sono errori: una mossa sbagliata che non chiude la partita (lo spaventapasseri ne approfitta, ma l'errore si conta solo alla fine), le mosse impossibili, i tocchi durante le animazioni, «Via!» senza corvi scelti, il primo «Arrenditi» non confermato.
- Dopo una partita persa si passa subito (nello stato) alla partita successiva della variante; comincia sempre il giocatore.

### 3.6 Risolto

Quando lo spaventapasseri fa volare via l'ultimo corvo. Il rompicapo si chiude per sempre (lo fa il kit). Lo stato finale ha `pali: [0, 0, 0, 0]` e `vinta: true`.

### 3.7 Limiti

Nessun limite di mosse o di tempo. Le partite sono infinite in sequenza (`partite[n % 10]`): il conto delle dorate lo fa il kit (minimo 1).

### 3.8 Memoria: la partita sopravvive al ricaricamento

Altrimenti basterebbe ricaricare la pagina per scappare da una partita compromessa. Dopo **ogni** cambio di stato (mossa valida, partita persa, vittoria) scrivi in `g.memoria` i campi `pali`, `partita`, `mosse`, `vinta` (copie) e chiama `g.salvaMemoria()`.

All'avvio: se `g.memoria.pali` è un array di 4 interi fra 0 e 9 con somma > 0, `g.memoria.partita` è un intero ≥ 0 e `g.memoria.mosse` è un array, riparti da lì; altrimenti dallo stato iniziale. Se `g.giaRisolto`, lo stato è `{ pali: [0,0,0,0], partita: memoria.partita ?? 0, mosse: memoria.mosse ?? [], vinta: true }`. La selezione non si salva.

---

## 4. Interfaccia

### 4.1 Tocchi (`g.tocca`, solo l'evento `"giu"`)

Ogni palo ha 9 posti per i corvi, numerati con `indice` 0–8 **dal basso in alto e da sinistra a destra**: traversa bassa 0, 1, 2; traversa di mezzo 3, 4, 5; traversa alta 6, 7, 8. Un palo con `n` corvi ha occupati i posti `0 … n−1` (si riempie dal basso). I corvi che volano via sono sempre gli ultimi: con `quanti` corvi via restano occupati i posti `0 … n−quanti−1`.

**Zona di tocco** del posto `indice` sul palo `p` (coordinate della scena, arrotondate con `Math.floor`):

```
cx = PALI_X[p] + SLOT_DX[indice % 3]        ty = TRAVERSE_Y[Math.floor(indice / 3)]
x da cx − 7 a cx + 7 (inclusi), y da ty − 14 a ty + 3 (inclusi)       → 15×18 pixel
```

(costanti nel § 5.2). Le zone non si sovrappongono.

- Tocco su un posto **occupato** (`indice < n`): la selezione diventa `{ palo: p, quanti: n − indice }` (si preparano quel corvo e tutti quelli dopo di lui). Se la selezione era già esattamente quella, si **annulla** (`null`). Una selezione su un altro palo viene sostituita.
- Tocco su un posto vuoto o fuori dai corvi (cielo, prato, spaventapasseri, cartelli): la selezione si annulla, nessun errore.
- Durante una sequenza animata (§ 5.8) i tocchi sui corvi sono **ignorati** (la selezione resta `null`) e il fumetto dice «Aspetta un attimo: i corvi stanno volando.».
- Qualsiasi tocco riporta il bottone «Arrenditi» al suo testo (annulla la conferma in sospeso).

### 4.2 Bottoni (`g.bottone`, in quest'ordine)

| etichetta | `id` | opzioni | cosa fa |
|---|---|---|---|
| `Via!` | `vola` | `forte: true` | se c'è una selezione: `mossa({ palo, quanti })` della selezione. Senza selezione: solo il messaggio «Prima tocca i corvi da far volare via.». Durante un'animazione: ignorato, messaggio «Aspetta un attimo: i corvi stanno volando.» |
| `Arrenditi` | `arrenditi` | — | prima pressione: cambia il **testo** del bottone in `Sicuro?` (l'attributo `data-azione` resta `arrenditi`) e il messaggio in «Arrendersi conta come partita persa. Premi di nuovo per confermare.»; se entro 4 secondi lo si ripreme, `mossa({ arrenditi: true })`; altrimenti torna `Arrenditi`. Durante un'animazione: ignorato come «Via!». |

Niente bottone «Ricomincia»: ricominciare senza perdere permetterebbe di scappare da una partita compromessa.

### 4.3 Messaggi del fumetto (testi esatti; `{ord}` = `primo`, `secondo`, `terzo`, `quarto`)

| quando | testo |
|---|---|
| inizio di una partita senza mosse (anche dopo una persa, quando i corvi nuovi si sono posati) | `Tocca un corvo per scegliere quanti farne volare via, poi premi «Via!».` |
| avvio con una partita salvata che ha già mosse | `Partita ripresa da dove l'avevi lasciata: tocca a te.` |
| selezione di 1 corvo | `Un corvo pronto sul {ord} palo: premi «Via!».` |
| selezione di q > 1 corvi | `{q} corvi pronti sul {ord} palo: premi «Via!».` |
| selezione annullata | `Tocca a te: scegli i corvi da far volare via.` |
| «Via!» senza selezione | `Prima tocca i corvi da far volare via.` |
| tocco o bottone durante un'animazione | `Aspetta un attimo: i corvi stanno volando.` |
| appena giocata la mossa (q corvi) | q = 1: `Vola via un corvo. Tocca allo spaventapasseri…` · q > 1: `Volano via {q} corvi. Tocca allo spaventapasseri…` |
| quando volano i corvi dello spaventapasseri (r corvi dal palo p) | r = 1: `Lo spaventapasseri fa volare via un corvo dal {ord} palo. Tocca a te.` · r > 1: `Lo spaventapasseri fa volare via {r} corvi dal {ord} palo. Tocca a te.` |
| primo «Arrenditi» | `Arrendersi conta come partita persa. Premi di nuovo per confermare.` |
| partita persa o resa | `Partita persa. Arrivano altri corvi: comincia di nuovo tu.` |
| vittoria | `L'ultimo corvo è toccato allo spaventapasseri: la maledizione è sua!` |
| già risolto (all'apertura) | `Lo spaventapasseri è maledetto: i corvi non tornano più.` |

Con `g.riduciMovimento` si mostra subito un solo messaggio per sequenza: per il turno quello della risposta dello spaventapasseri, per una partita persa o una resa «Partita persa. Arrivano altri corvi: comincia di nuovo tu.», per la vittoria quello di vittoria.

### 4.4 Carta iniziale

Il testo è `scheda.enigma` più una riga sulle partite perse. Siccome la scheda è leggibile solo dentro `crea`, impostalo lì sull'oggetto delle opzioni (il kit lo legge quando apre la carta, dopo `crea`):

```js
crea(g) {
  OPZIONI.testo = g.scheda.enigma + "\nOgni partita persa conta come errore: i corvi tornano, disposti in un altro modo, e si ricomincia.";
  …
}
```

---

## 5. Grafica

### 5.1 Sfondo e composizione

`sfondo: "cancello"`, `velo: 0.5`. Lo sfondo ha il cancello di ferro chiuso al centro (x 108–212), due pilastri con le lanterne (x 92–108 e 212–228), i muretti di pietra ai lati (cima a y 88), il prato da y 118 e il vialetto di lastre al centro. La scena del rompicapo:

```
 x:  6        53   64       111      132   160   188      208      255   266      313
     |-palo 1-|     |-palo 2-|        |spaventap.|         |-palo 3-|     |-palo 4-|
y 44                                                     (cartellino «VIA n» sopra il palo scelto)
y 57–64   cappucci di ferro dei pali                 y 77 cappello
y 67–121  corvi sulle traverse (78, 97, 116)         y 86–101 testa di zucca
y 125–138 cartelli col numero                         y 100–131 giacca
y 146–150 zolle e ombre                               y 120–150 palo dello spaventapasseri
```

Lo spaventapasseri sta davanti al lucchetto del cancello, come un guardiano; i pali sono piantati nel prato davanti ai muretti. I corvi in volo escono dalla scena in alto, sopra la barra del kit (lì sono solo decorazione).

### 5.2 Costanti

```js
const PALI_X = [30, 88, 232, 290];   // centro di ogni palo
const TRAVERSE_Y = [116, 97, 78];    // bordo alto della traversa bassa, di mezzo, alta (i piedi dei corvi poggiano qui)
const SLOT_DX = [-15, 0, 15];        // posti sinistro, centrale, destro di ogni traversa
const CIMA = 64, TERRA = 148;        // il palo va da CIMA a TERRA
const SPAV_X = 160, SPAV_BASE = 150, SPAV_T = 100;   // spaventapasseri: centro, piede, cima della giacca
```

Tutto a coordinate intere, solo `EscapeDemo.rett`, `riquadro`, `retino`, `sprite`, `testo`. Colori solo da `EscapeDemo.C` (unica eccezione: il colore trasparente `"rgba(0,0,0,0)"` come primo colore di `retino` per i retini «a buchi», § 5.8).

### 5.3 I pali (per ogni `p`, con `cx = PALI_X[p]`)

Tutti rettangoli `rett(ctx, colore, x, y, w, h)`:

```
ombra       C.bordo        cx−7, 148, 19, 2
zolla       C.bordo        cx−6, 146, 13, 3      C.terra  cx−5, 146, 11, 2      C.pavimento2  cx−5, 146, 4, 1
palo        C.bordo        cx−3, 64, 6, 84       C.legnoLuce  cx−2, 65, 1, 82
            C.legnoChiaro  cx−1, 65, 2, 82       C.legno      cx+1, 65, 1, 82
venature    C.legno        cx−1, y, 1, 3   per y in 72, 90, 108, 141
cappuccio   C.bordo        cx−4, 60, 8, 5        C.ferroChiaro cx−3, 61, 6, 3     C.pietra cx−3, 61, 2, 1
punta       C.bordo        cx−1, 57, 2, 3
per ogni y di TRAVERSE_Y:
  traversa  C.bordo        cx−24, y, 48, 5       C.legnoChiaro cx−23, y+1, 46, 3
            C.legnoLuce    cx−23, y+1, 46, 1     C.legno       cx−23, y+3, 46, 1
  chiodi    C.bordo        cx−21, y+2, 1, 1   e  cx+20, y+2, 1, 1
  legatura  C.bordo        cx−4, y−1, 8, 7       C.legnoLuce   cx−3, y, 6, 5
            C.pietra       cx−3, y, 6, 1         C.legnoChiaro cx−3, y+2, 6, 1   e  cx−3, y+4, 6, 1
cartello    riquadro(ctx, cx−9, 125, 18, 14, C.legnoChiaro)
            C.legnoLuce    cx−8, 126, 16, 1      C.legno  cx−8, 137, 16, 1
            chiodini C.ferroChiaro  cx−7, 127, 1, 1  e  cx+6, 127, 1, 1
            numero: testo(ctx, String(n), cx, 129, { colore: n ? C.fiammaChiara : C.legnoLuce, ombra: C.bordo, allinea: "centro" })
```

Il numero sul cartello è quello della **vista** (§ 5.8): cambia quando i corvi si staccano dal palo, non prima.

### 5.4 I corvi seduti

Sprite 17×13, guardano a destra. Si disegnano con `EscapeDemo.sprite(ctx, CORVO, COL_CORVO, x, y, { specchia })`; specchiati guardano a sinistra (il centro, colonna 8, resta lo stesso).

```js
const COL_CORVO = {
  k: C.bordo, n: C.ferro, v: C.violaScuro, m: C.ferroChiaro, l: C.notteChiara,
  y: C.giallo, b: C.pietra, B: C.ferroChiaro,
};
const CORVO = [ // 17×13 — i piedi (riga 11) poggiano sulla traversa, la coda pende davanti
  "..........kkk....",
  ".........kmlmkk..",
  "........kmnnynbk.",
  "........knnnnnBbk",
  ".......knnnnnnkk.",
  "......knnnnnnnk..",
  "....kkmvvnnnnnk..",
  "...kmvvvvvnnnk...",
  "..kmvvvvvvnnnk...",
  ".kvvvvvvvnnnk....",
  "kvvkkvvvvnnk.....",
  "kvk..kkbkbk......",
  "kk...............",
];
const CORVO_PRONTO = [ // 17×13 — ala alzata: pronto a volare
  "..........kkk....",
  ".........kmlmkk..",
  "...kk...kmnnynbk.",
  "..kmvk..knnnnnBbk",
  "..kvvvkknnnnnnkk.",
  "...kvvvknnnnnnk..",
  "....kvvvvnnnnnk..",
  "...kmvvvvvnnnk...",
  "..kmvvvvvvnnnk...",
  ".kvvvvvvvnnnk....",
  "kvvkkvvvvnnk.....",
  "kvk..kkbkbk......",
  "kk...............",
];
// occhio chiuso: CORVO con la "y" della riga 2 sostituita da "n"
```

**Posizione** del corvo nel posto `indice` del palo `p`: `x = PALI_X[p] + SLOT_DX[indice % 3] − 8`, `y = TRAVERSE_Y[Math.floor(indice / 3)] − 11`.

**Stati:**

- *Normale*: `CORVO`. Verso di base: guarda a sinistra (specchiato) se `(indice + 3·p) % 9` è 2, 5 o 7, altrimenti a destra.
- *Vita* (animazioni continue a 8 fps, saltate con `g.riduciMovimento`): ogni corvo si gira dall'altra parte per 8 fotogrammi ogni 64, quando `(g.fotogramma + (23·p + 13·indice) % 64) % 64 < 8`; sbatte le palpebre (sprite con l'occhio chiuso) per 1 fotogramma quando `(g.fotogramma + 7·p + 5·indice) % 40 === 0`.
- *Selezionato* (i corvi della selezione): `CORVO_PRONTO`, verso di base, 1 pixel più in alto (2 pixel quando `g.fotogramma % 4 === 0`: un saltello), con un **contorno giallo esterno**: prima, per *tutti* i selezionati, lo stesso sprite disegnato con tutte le lettere in `C.giallo` spostato di (+1, 0), (−1, 0), (0, +1), (0, −1); poi, sopra, tutti i selezionati normali. (Due passate, così il contorno di un corvo non copre il vicino.)
- *Nervoso* (i corvi che lo spaventapasseri sta per far volare, durante «pensa» e «scuote»): `CORVO_PRONTO` senza contorno, 1 pixel più in alto nei fotogrammi dispari (tremano).

### 5.5 I corvi in volo

Tre fotogrammi 20×12 visti di profilo (guardano a destra; per volare verso sinistra si specchiano). Ciclo a 8 fps: `[VOLO_SU, VOLO_MEZZO, VOLO_GIU, VOLO_MEZZO][(g.fotogramma + k) % 4]`, con `k` diverso per ogni corvo (l'indice nella lista dei volanti) così non battono le ali all'unisono. Colori: `COL_CORVO`.

```js
const VOLO_SU = [ // 20×12
  "...kmmmkk...........",
  "...kmmmmmk..........",
  "....kvvvvvkk........",
  ".....kkvvvvvk.kkk...",
  "..kkkkkkvvvvvkmnykk.",
  ".kvvvnnnnnnnnnnnnbbk",
  ".kvvvnnnnnnnnnnkkBk.",
  "kvvvvknnnnnnnnk..k..",
  ".kkkk.kkkkkkkk......",
  "....................",
  "....................",
  "....................",
];
const VOLO_MEZZO = [ // 20×12
  "....................",
  "....................",
  "....................",
  "...kkkkkkkkkk.kkk...",
  "..kvvmmmmmmmvkmnykk.",
  ".kvvvnnnnnnnnnnnnbbk",
  ".kvvvnnnnnnnnnnkkBk.",
  "kvvvvknnnnnnnnk..k..",
  ".kkkk.kkkkkkkk......",
  "....................",
  "....................",
  "....................",
];
const VOLO_GIU = [ // 20×12
  "....................",
  "....................",
  "....................",
  "..............kkk...",
  "..kkkkkkkkkkkkmnykk.",
  ".kvvvnnnnnnnnnnnnbbk",
  ".kvvvnnnnnnnnnnkkBk.",
  "kvvvvknnnnnnnnk..k..",
  ".kkkk.kvvvvvvk......",
  ".....kvvvvvvk.......",
  "....kmmmmmkk........",
  "...kmmmmkk..........",
];
```

**Decollo** da un posto (centro `cx`, traversa `ty`): parte da `x0 = cx − 10`, `y0 = ty − 11` e arriva a `x1 = x0 + 100·dir`, `y1 = −16`, con `dir = −1` per i pali 0 e 1 (volano verso sinistra, sprite specchiato) e `+1` per i pali 2 e 3. Con `u` da 0 a 1 in **500 ms**: `x = Math.round(x0 + (x1 − x0)·u·u)`, `y = Math.round(y0 + (y1 − y0)·(2u − u·u))` (si alza subito e poi scivola di lato). Quando parte più di un corvo, parte prima quello più in alto (indice maggiore), gli altri a **40 ms** l'uno dall'altro.

**Atterraggio** (corvi nuovi dopo una partita persa): lo stesso percorso al contrario (`u` da 1 a 0), 500 ms, dal posto 0 in su a 30 ms l'uno dall'altro; chi arriva da sinistra guarda a destra e viceversa; arrivato al posto diventa un corvo seduto.

### 5.6 Lo spaventapasseri

Tre sprite: giacca con le braccia (57×32), testa di zucca (21×16), cappello (29×13). Luce da sinistra in alto come lo sfondo.

```js
const COL_GIACCA = {
  k: C.bordo, G: C.erba, g: C.erbaScura, s: C.siepe, c: C.legnoLuce, p: C.tappeto, P: C.tappetoChiaro,
  q: C.legnoChiaro, w: C.pietra, y: C.oro, Y: C.giallo, O: C.oroScuro,
};
const GIACCA = [ // 57×32 — braccia sulla traversa, paglia ai polsi e sotto l'orlo, corda in vita, toppe
  ".................YyOkkkkkkkkkkkkkkkkkyYO.................",
  "..YYkkkkkkkkkkkkkGGGgggggggggsgggggggssskkkkkkkkkkkkkYY..",
  "YYYYGGGGGGGGGGGGGGGGGGGGGGGGGsGGGGGGGGGGwkkkkkGGGGGGGYYYY",
  ".yyyGGGGGGGGGGGGGGGGGGGGGGGGGsGGGGGGGGGGkqqqqkGGGGGGGyyy.",
  "OOOOgggggsgggggsgggggggggggggsggggggggggkqqqqkgsgggggOOOO",
  "yyyyggggggsgggggsggggggggggwgsggggggggggkqqqqkggsggggyyyy",
  ".YYYsssssssssssssswkkkkkwssssssssssssssskkkkkwsssssssYYY.",
  "OOOOsssssssssssssskPPpppkssssssssssssssssssssssssssssOOOO",
  "..yykkkkkkkkkkkkGGkpppppkggggsggggggggssskkkkkkkkkkkkyy..",
  "...............kGGkpppppkggggsggggggggsssk...............",
  "...............kGGkpppppkggwgsggggggggsssk...............",
  "...............kGGwkkkkkwggggsggggggggsssk...............",
  "..............kGGGgggggggggggsgggggggggsssk..............",
  "..............kGGGgggggggggggsgggggggggsssk..............",
  "..............kkkkkkkkkkkkkkkkkkkkkkkkkkkkk..............",
  "..............kcccccccccckkkkkcccccccccccck..............",
  "..............kkkkkkkkkkkkccckkkkkkkkkkkkkk..............",
  "..............kGGGgggggggkccckgggggggggsssk..............",
  ".............kGGGggggggggkkkkkggggggggggsssk.............",
  ".............kGGGggggggggcgggscggkkkkkggsssk.............",
  ".............kGGGggggggggkgwgskggkqqqkggsssk.............",
  ".............kGGGggggggggggggsgggkqqqkggsssk.............",
  ".............kGGGggggggggggggsgggkqqqkggsssk.............",
  ".............kGGGggggggggggggsgggkkkkkggsssk.............",
  "............kGGGgggggggggggggsgggggggggggsssk............",
  "............kGGGkgggkgggkgggkgggkgggkgggksssk............",
  "............kGkGkgkgkgkgkgkgkgkgkgkgkgkgksksk............",
  ".............k.k.k.k.k.k.k.k.k.k.k.k.k.k.k.k.............",
  "...............y...O..Y...y....O...Y..y..O...............",
  "...............y...O..Y...y....O...Y..y..O...............",
  "...............y......Y........O......y..................",
  "......................Y...............y..................",
];
// La "e" (occhi, naso, bocca intagliati) cambia colore con lo stato: vedi sotto.
const COL_ZUCCA = { k: C.bordo, r: C.tappeto, b: C.brace, f: C.fiamma, h: C.fiammaChiara, e: C.bordo };
const ZUCCA = [ // 21×16 — occhi a triangolo cattivi, bocca coi denti
  "........kkkkk........",
  ".....kkkhhfffkkk.....",
  "...kkhhhfffbfffbbkk..",
  "..khhhhffbffffbbbrk..",
  ".khhhffffbfffffbbbrk.",
  ".khheeeefbfffeeeebrk.",
  "khhffeeefbfffeeebbbrk",
  "khfffbeefbfffeebbbbrk",
  "kfffffbbfbebfbbbbbbrk",
  "kfffffbbbeeebbbbbbrrk",
  "kfbeeefeeefeeefeebrrk",
  "kfbbeeeeeeeeeeeebbrrk",
  ".kbbbeeefeeefeeebbrk.",
  "..kbbbbbbbbbbbbbbrrk.",
  "...kkrrbbbbbbbrrrkk..",
  ".....kkkkkkkkkkk.....",
];
const COL_CAPPELLO = { k: C.bordo, n: C.legnoChiaro, m: C.legnoLuce, s: C.legno, r: C.tappeto, R: C.tappetoChiaro };
const CAPPELLO = [ // 29×13 — feltro sfondato con la punta piegata e il nastro rosso
  "...............kkk...........",
  ".............kkmnsk..........",
  "...........kkmnnnsk..........",
  "..........kmnnnnnsk..........",
  ".........kmnnnnnnnsk.........",
  ".........kmnnnnnnnsk.........",
  "........kmnnnnnnnnnsk........",
  "........kRRRRRRRRRRrk........",
  "........krrrrrrrrrrrk........",
  "..kkkkkkkmnnnnnnnnnskkkkkkk..",
  ".kmmmmmmmnnnnnnnnnnnnnnnnnssk",
  "kmnnnnnnnnnnnnnnnnnnnnnnssssk",
  ".kkkkkkkkkkkkkkkkkkkkkkkkkkk.",
];
```

**Posizioni** (con `dx`, `dy` = scostamenti della posa, sotto):

```
ombra        C.bordo        SPAV_X−12, SPAV_BASE, 27, 2              (150)
palo         C.bordo        SPAV_X−2, SPAV_T+20, 5, SPAV_BASE−SPAV_T−20      → 158, 120, 5, 30
             C.legno        SPAV_X−1, SPAV_T+20, 3, 29     C.legnoChiaro  SPAV_X−1, SPAV_T+20, 1, 29
zolla        C.bordo        SPAV_X−6, SPAV_BASE−3, 13, 3   C.terra  SPAV_X−5, SPAV_BASE−3, 11, 2
giacca       sprite GIACCA     in (SPAV_X−28 + sx, SPAV_T)         → (132, 100)
testa        sprite ZUCCA      in (SPAV_X−10 + sx + dx, SPAV_T−14 + dy)   → (150, 86)
cappello     sprite CAPPELLO   in (SPAV_X−14 + sx + dx, SPAV_T−23 + dy)   → (146, 77): la tesa copre le prime righe della zucca
```

Ordine: ombra, palo, zolla, giacca (copre la cima del palo), testa, cappello.

**Pose** (`sx` sposta tutto lo spaventapasseri, `dx`/`dy` solo testa e cappello, `e` è il colore della lettera `e` della zucca):

| posa | quando | sx | dx, dy | `e` |
|---|---|---|---|---|
| fermo | sempre, quando non fa altro | 0 | dx dondola col vento: `[0,0,0,0,0,0,1,1,1,1,1,1,0,0,0,0,0,0,−1,−1,−1,−1,−1,−1][g.fotogramma % 24]`, dy 0 (fermo del tutto con `riduciMovimento`) | `C.bordo` (intaglio spento) |
| pensa | 450 ms prima della sua mossa | 0 | dx = −1 se il palo che ha scelto è 0 o 1, +1 se è 2 o 3; dy 0 | `C.giallo`, `C.fiammaChiara` quando `g.fotogramma % 3 === 0` (fiamma che tremola) |
| scuote | 250 ms subito dopo | `g.fotogramma % 2 ? 1 : −1` | come «pensa» | come «pensa» |
| ride | dopo una partita persa o una resa, 800 ms | 0 | dx 0, dy = `g.fotogramma % 2 ? −1 : 0` | `C.fiammaChiara` |
| maledetto | dalla vittoria in poi (e se già risolto) | 0 | dx +2, dy +3 (la testa si affloscia), **cappello a terra** | `C.bordo` |

Durante «scuote» quattro fili di paglia (rettangoli 1×2, `C.oro` e `C.giallo`) si staccano dai polsi (da (133, 103) e (186, 103)) e cadono di lato: 6 pixel in fuori e 8 in giù in 400 ms, poi spariscono. Decorazione, saltata con `riduciMovimento`.

**Maledetto**: il cappello sta a terra in (168, 138); sulla testa (che ora è in (152, 89)) è appollaiato il corvo maledetto, `CORVO` specchiato in (154, 78) (i piedi sulla cima della zucca); attorno quattro stelline lilla a croce con centro in (141, 90), (180, 94), (146, 76), (176, 78): ognuna `rett(C.lilla, x−1, y, 3, 1)`, `rett(C.lilla, x, y−1, 1, 3)`, `rett(C.bianco, x, y, 1, 1)`. Le prime due si vedono nei fotogrammi pari, le altre due nei dispari (con `riduciMovimento` tutte e quattro ferme).

### 5.7 Il cartellino «VIA n»

Quando c'è una selezione (e nessuna animazione), sopra il palo scelto:

```js
const t = `VIA ${quanti}`;
const w = EscapeDemo.larghezzaTesto(t, { piccolo: true });
riquadro(ctx, cx - Math.ceil(w / 2) - 3, 44, w + 6, 9, C.bordo, C.giallo);   // fondo scuro, bordo giallo
testo(ctx, t, cx, 46, { piccolo: true, colore: C.giallo, ombra: null, allinea: "centro" });
```

### 5.8 La vista e le sequenze animate

Lo stato logico cambia subito (§ 3.3); il disegno legge una **vista** separata: corvi per palo (`vista.pali`), lista dei corvi in volo, posa dello spaventapasseri, palo «mirato», posizione del cappello, stelline. Ogni sequenza è una lista di eventi a tempi fissi (ms dall'inizio) che modificano la vista. Se arriva una mossa nuova mentre una sequenza è in corso (succede solo dall'aggancio delle prove), **applica subito tutti gli eventi rimasti** (nessun corvo lasciato a metà) e poi parte la nuova. Con `g.riduciMovimento` niente sequenze: la vista diventa subito lo stato finale (corvi nuovi già posati, spaventapasseri già maledetto, ecc.).

`statoGioco().animazione` è `true` finché una sequenza è in corso; nel frattempo tocchi e bottoni sono ignorati (§ 4.1, 4.2).

Con `q` = corvi del giocatore, `r` = corvi dello spaventapasseri, `T1 = 550 + 40·(q − 1)`:

**Turno** (esito `ok`), al massimo 2,4 s:
- 0 ms — i `q` corvi in cima al palo del giocatore decollano (§ 5.5); il cartello mostra subito il numero nuovo. Messaggio «Volano via…».
- `T1` — posa «pensa», palo mirato = quello della risposta, i suoi `r` corvi in cima diventano «nervosi».
- `T1 + 450` — posa «scuote» e paglia che vola.
- `T1 + 700` — i suoi `r` corvi decollano, il cartello si aggiorna, posa «fermo». Messaggio «Lo spaventapasseri fa volare via…».
- fine quando l'ultimo corvo è uscito.

**Partita persa** (motivo `"ultimo corvo"`), al massimo 2,6 s:
- 0 ms — l'ultimo corvo decolla. `g.errore(...)` già chiamato (scossa e avviso li fa il kit). Messaggio «Partita persa…».
- 500 ms — **lampo rosso** per 250 ms: `EscapeDemo.retino(ctx, "rgba(0,0,0,0)", C.tappetoChiaro, 0, 16, 320, 138, 0.25)` sopra tutto (il primo colore trasparente lascia vedere la scena fra i punti); posa «ride» per 800 ms.
- 1300 ms — i cartelli mostrano i numeri della partita nuova e i corvi nuovi atterrano (§ 5.5).
- fine all'ultimo atterraggio; poi messaggio «Tocca un corvo per scegliere…» (con `riduciMovimento` resta «Partita persa…»).

**Resa**, al massimo 3,2 s:
- 0 ms — tutti i corvi rimasti decollano (palo per palo, dall'alto, 20 ms l'uno dall'altro); cartelli a 0.
- fine dei decolli (al massimo 1 s) — lampo rosso e posa «ride» come sopra.
- 800 ms dopo — atterraggio della partita nuova come sopra.

**Vittoria**, al massimo 2,7 s (la carta arriva a 2900 ms grazie a `ritardo`):
- 0 ms — i corvi del giocatore decollano.
- `T1` — «pensa»; `T1 + 450` — «scuote».
- `T1 + 700` — l'ultimo corvo decolla ma, invece di uscire, vola sulla testa dello spaventapasseri in 700 ms: `x` lineare da `cx − 10` a 153, `y = (1−u)·y0 + u·78 − 120·u·(1−u)` (un arco alto 30 pixel), arrotondati; cartello a 0.
- `T1 + 1400` — atterra: diventa il corvo seduto sulla testa, posa «maledetto», stelline, occhi spenti; il cappello cade da (146, 77) a (168, 138) in 400 ms (`x` lineare, `y` con `u·u`). Messaggio di vittoria.

### 5.9 Già risolto

Con `g.giaRisolto`: pali vuoti (cartelli «0» in `C.legnoLuce`), spaventapasseri «maledetto» col corvo in testa, cappello a terra, stelline. Il kit blocca l'input.

### 5.10 Ordine di disegno (ogni fotogramma, su `g.ctx` dopo `clearRect`)

1. pali (ombra, zolla, palo, cappuccio, traverse, legature) e cartelli;
2. spaventapasseri (cappello compreso, o cappello a terra);
3. corvi seduti normali e nervosi; poi i contorni gialli dei selezionati; poi i selezionati;
4. il corvo maledetto sulla testa;
5. corvi in volo;
6. paglia, stelline;
7. cartellino «VIA n»;
8. lampo rosso.

---

## 6. Aggancio per le prove

```js
g.espone({
  gioca: (m) => mossa(m),                      // la stessa funzione usata da tocchi e bottoni
  statoGioco: () => ({ … }),
  posizione: (palo, indice) => ({ x: PALI_X[palo] + SLOT_DX[indice % 3], y: TRAVERSE_Y[Math.floor(indice / 3)] - 6 }),
});
```

**`gioca(mossa)`** — `mossa` è `{ palo, quanti }` oppure `{ arrenditi: true }`. Aggiorna lo stato subito, anche durante un'animazione (le animazioni si adeguano, § 5.8); azzera la selezione. Esiti, esattamente:

| caso | esito |
|---|---|
| mossa impossibile | `{ valida: false, motivo: "palo inesistente" \| "almeno un corvo" \| "non ci sono abbastanza corvi" }` |
| la partita continua | `{ ok: true, risposta: { palo, quanti }, pali: [...] }` (`pali` dopo la risposta) |
| l'ultimo corvo l'hai fatto volare tu | `{ errore: true, persa: true, motivo: "ultimo corvo", partita, pali: [...] }` (`partita` e `pali` della partita nuova) |
| resa | `{ errore: true, persa: true, motivo: "resa", partita, pali: [...] }` |
| l'ultimo corvo l'ha fatto volare lo spaventapasseri | `{ risolto: true, risposta: { palo, quanti }, pali: [0, 0, 0, 0] }` |

**`statoGioco()`**:

```js
{
  pali: [4, 0, 6, 3],          // stato logico (non la vista)
  partita: 0,                  // indice in variante.partite (senza modulo: 10, 11… dopo dieci partite perse)
  mosse: [{ chi: "tu", palo: 1, quanti: 8 }, { chi: "spaventapasseri", palo: 2, quanti: 1 }],   // della partita in corso
  selezione: null,             // oppure { palo, quanti } scelta coi tocchi
  vinta: false,
  animazione: false,           // true mentre una sequenza animata è in corso
}
```

**`posizione(palo, indice)`** — centro della zona di tocco del posto `indice` (0–8, § 4.1) sul palo `palo` (0–3), in pixel della scena, anche se il posto è vuoto.

---

## 7. Criteri di accettazione

Giocando e guardando le foto di `prova.mjs` (`desktop`, `telefono`, `telefono-verticale`, `verifica-*`):

1. `node demo/comune/prova.mjs corvi-spaventapasseri` finisce con «TUTTO OK».
2. Si capisce al primo sguardo: quattro pali con i corvi sulle traverse e un cartello col numero sotto ciascuno, lo spaventapasseri al centro davanti al cancello. Il numero sul cartello corrisponde ai corvi disegnati.
3. I corvi sono più chiari e saturi dello sfondo velato, hanno il contorno scuro e l'occhio giallo; nessuno sembra un piccione o un pipistrello. Si riempiono dal basso (traversa bassa da sinistra a destra, poi quella di mezzo, poi quella alta).
4. Toccando un corvo si alzano con il contorno giallo lui e quelli dopo di lui sullo stesso palo, compare «VIA n» sopra il palo e il fumetto dice quanti sono pronti; toccando di nuovo o toccando il cielo la scelta sparisce.
5. Dopo «Via!» i corvi volano via davvero (battono le ali e escono dalla scena), lo spaventapasseri accende gli occhi, si gira verso il palo che ha scelto, trema, e i suoi corvi volano via. Durante tutto questo i tocchi non fanno niente. Nessun corvo resta a metà.
6. Perdendo: lampo rosso, avviso del kit con «Hai fatto volare via l'ultimo corvo…», lo spaventapasseri ride, arrivano corvi nuovi in volo sui pali e si ricomincia; nella barra le dorate scendono di una ogni due partite perse.
7. «Arrenditi» chiede conferma («Sicuro?») e solo alla seconda pressione conta come partita persa.
8. Ricaricando la pagina a metà partita si ritrova la stessa posizione (non pali nuovi).
9. Vincendo: l'ultimo corvo si posa sulla testa dello spaventapasseri, il cappello cade, la testa si affloscia, stelline lilla; poi la carta della vittoria con il riepilogo. Riaprendo, la scena resta così.
10. Sul telefono (foto `telefono`) i corvi si toccano senza sbagliare posto e il cartellino «VIA n» si legge.
11. Con `prefers-reduced-motion` niente voli né dondolii: tutto salta allo stato finale.
12. Nessun testo suggerisce la strategia (niente pacchetti, binario, xor) e nessun messaggio supera una settantina di caratteri.
