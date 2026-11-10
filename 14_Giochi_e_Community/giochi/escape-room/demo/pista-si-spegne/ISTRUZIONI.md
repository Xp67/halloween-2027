# La pista che si spegne — istruzioni per il costruttore

Rompicapo `pista-si-spegne`, Sala principale, 4 caramelle dorate, una in meno ogni 2 errori (lo fa il kit).
Vale tutto quello che c'è in `../REGOLE_COMUNI.md`; qui c'è solo quello che è specifico. Le coordinate sono pixel della scena 320×180, sempre intere.

Tutto il disegno descritto qui è già stato provato in un bozzetto sopra lo sfondo vero: misure, colori e sprite vanno bene così come sono.

---

## 1. In breve

Al centro della sala c'è una pista da ballo luminosa 5×5 su una pedana, in leggera prospettiva. Il giocatore tocca una piastrella: cambiano lei e le quattro vicine (sopra, sotto, a destra, a sinistra), le accese si spengono e le spente si accendono. Vince quando sono spente tutte e 25 entro il limite di passi (minimo + 6). Se i passi finiscono con qualche luce ancora accesa, il DJ vampiro se ne accorge: è un errore e la pista torna com'era all'inizio.

---

## 2. Variante

### Numerazione

- Piastrella `(r, c)`: riga `r` da 0 a 4, **riga 0 = la fila in fondo** (in alto sullo schermo), riga 4 = la fila davanti (in basso); colonna `c` da 0 a 4, da sinistra.
- Indice `i = r * 5 + c`. Una pista è un intero a 25 bit: bit `i` = 1 se la piastrella `i` è accesa.
- Nella variante e nello stato la pista si scrive come **5 stringhe di 5 caratteri `"0"`/`"1"`**, dalla riga 0 alla riga 4: `pista[r][c] === "1"` vuol dire accesa.

### Il formato

```js
{ pista: ["01010", "11000", "11100", "11011", "11111"], minimo: 9, limite: 15 }
```

- `pista`: la pista all'inizio, nel formato sopra.
- `minimo`: il numero minimo di passi che la spengono (calcolato su tutte le soluzioni).
- `limite`: sempre `minimo + 6`.

La variante **non** contiene la soluzione.

### Il generatore (da copiare così: la verifica controlla questi vincoli)

Si parte dalla pista spenta e si pestano piastrelle a caso, quindi la pista si può sempre spegnere (una pista accesa a caso si spegnerebbe solo una volta su quattro). Poi si misura il minimo e si tiene la pista solo se:

- le piastrelle accese sono **fra 9 e 16** (la pista è «accesa a metà»);
- il minimo è **fra 9 e 13**.

Sul 5×5 ogni pista che si spegne ha **esattamente 4 soluzioni** (il sistema ha 2 incognite libere), e non sempre la prima che si trova è la più corta: il minimo va preso su tutte e 4. Il modo più semplice di trovarle è provare le 32 possibili prime righe e «inseguire le luci» verso il basso: le prime righe che lasciano la pista spenta sono esattamente le 4 soluzioni.

```js
// CROCE[i]: le piastrelle che cambiano pestando la piastrella i (lei e le vicine sopra, sotto, a sinistra, a destra).
const CROCE = [];
for (let i = 0; i < 25; i++) {
  const r = Math.floor(i / 5), c = i % 5;
  let m = 1 << i;
  if (r > 0) m |= 1 << (i - 5);
  if (r < 4) m |= 1 << (i + 5);
  if (c > 0) m |= 1 << (i - 1);
  if (c < 4) m |= 1 << (i + 1);
  CROCE.push(m);
}
const contaBit = (v) => { let n = 0; while (v) { n += v & 1; v >>>= 1; } return n; };

/** Tutte le soluzioni della pista (come insiemi di piastrelle da pestare, a 25 bit): sono sempre 0 o 4. */
function soluzioni(pista) {
  const tutte = [];
  for (let primaRiga = 0; primaRiga < 32; primaRiga++) {
    let luci = pista, premute = 0;
    for (let c = 0; c < 5; c++) if ((primaRiga >> c) & 1) { luci ^= CROCE[c]; premute |= 1 << c; }
    // ogni luce accesa nella riga r-1 si spegne pestando la piastrella subito sotto, nella riga r
    for (let r = 1; r < 5; r++)
      for (let c = 0; c < 5; c++)
        if ((luci >> ((r - 1) * 5 + c)) & 1) { const i = r * 5 + c; luci ^= CROCE[i]; premute |= 1 << i; }
    if (luci === 0) tutte.push(premute);
  }
  return tutte;
}
const minimoPassi = (pista) => Math.min(...soluzioni(pista).map(contaBit));

const inRighe = (p) => [0, 1, 2, 3, 4].map((r) => [0, 1, 2, 3, 4].map((c) => ((p >> (r * 5 + c)) & 1 ? "1" : "0")).join(""));
const daRighe = (righe) => righe.reduce((p, riga, r) => [...riga].reduce((q, ch, c) => (ch === "1" ? q | (1 << (r * 5 + c)) : q), p), 0);

// Mai raggiunta in pratica (su 100.000 semi servono al massimo 11 tentativi), ma la variante non deve mai mancare.
const RISERVA = { pista: ["10110", "10100", "00011", "10001", "01101"], minimo: 11, limite: 17 };

function generaVariante(rng) {
  for (let tentativo = 0; tentativo < 300; tentativo++) {
    let pista = 0;
    for (let i = 0; i < 25; i++) if (rng() < 0.5) pista ^= CROCE[i]; // sempre 25 estrazioni per tentativo
    const accese = contaBit(pista);
    if (accese < 9 || accese > 16) continue;
    const minimo = minimoPassi(pista);
    if (minimo < 9 || minimo > 13) continue;
    return { pista: inRighe(pista), minimo, limite: minimo + 6 };
  }
  return { ...RISERVA, pista: [...RISERVA.pista] };
}
```

Le funzioni `CROCE`, `contaBit`, `inRighe`, `daRighe` servono anche alle mosse (sezione 3).

### Esempi (con `generaVariante` qui sopra e `EscapeDemo.casuale(seme)`, che è l'`rng` che il kit passa a `variante`)

| Seme | `pista` | `minimo` | `limite` | Una soluzione più corta (piastrelle `(r,c)` da pestare, in qualsiasi ordine) |
|---|---|---|---|---|
| 12345 | `01010 11000 11100 11011 11111` (16 accese) | 9 | 15 | (0,1) (0,2) (1,0) (1,1) (2,0) (3,0) (3,1) (3,2) (4,4) |
| 42 | `10010 10000 01001 01010 11100` (10 accese) | 9 | 15 | (0,1) (0,2) (2,0) (2,1) (2,2) (3,3) (3,4) (4,0) (4,3) |
| 1 | `01110 01000 00010 01100 10011` (10 accese) | 10 | 16 | (0,2) (0,3) (1,2) (1,3) (1,4) (2,2) (3,1) (3,3) (3,4) (4,0) |

Il seme 12345 è quello delle foto di `prova.mjs`: se la demo con `?seed=12345` mostra un'altra pista, il generatore non è stato copiato giusto.

---

## 3. Regole e mosse

### Lo stato (logica pura, separata dal disegno)

```js
{ pista: 0b...,   // intero a 25 bit, le luci di adesso
  passi: 0,       // passi fatti nel giro in corso
  conferma: false, // true dopo il primo tocco su «Ricomincia», in attesa del secondo
  risolto: false }
```

`statoIniziale(v) = { pista: daRighe(v.pista), passi: 0, conferma: false, risolto: false }`.

Scrivi una funzione pura `applica(stato, mossa, v) → { stato: nuovoStato, esito }` che non disegna e non chiama il kit; la funzione `mossa(m)` della demo la chiama, aggiorna lo stato e solo dopo fa il resto (kit, messaggi, animazioni, memoria). La stessa `mossa(m)` la usano i tocchi, il bottone e `gioca`.

### Le mosse

**Pestare una piastrella** — `{ r, c }`:

1. Se `r` o `c` non sono interi fra 0 e 4 (anche stringhe, decimali, mancanti): **mossa impossibile**, esito `{ valida: false }`, niente cambia (nemmeno `conferma`), **non è un errore** e non conta come passo.
2. Altrimenti `pista ^= CROCE[r * 5 + c]`, `passi += 1`, `conferma = false`.
3. Se adesso `pista === 0`: **risolto** → esito `{ risolto: true, passi }`. (Vale anche se è proprio il passo numero `limite`: prima si guarda se è spenta.)
4. Altrimenti, se `passi >= limite`: **errore** (passi finiti). Lo stato torna `statoIniziale(v)` (pista com'era, passi 0), esito `{ errore: true, motivo: "Passi finiti: il DJ ha riacceso la pista", passi: 0 }`, e la demo chiama `g.errore("Passi finiti: il DJ ha riacceso la pista")`.
5. Altrimenti esito `{ ok: true, passi, accese: contaBit(pista) }`.

Pestare due volte la stessa piastrella è permesso (la rimette com'era) e costa due passi: è il modo di rimediare a un tocco sbagliato.

**Ricomincia** — `{ ricomincia: true }` (il bottone):

- con `passi === 0`: esito `{ valida: false }`, niente cambia, nessun errore;
- con `passi > 0` e `conferma === false`: `conferma = true`, esito `{ conferma: true }`, nessun errore;
- con `passi > 0` e `conferma === true`: **errore**, è come finire i passi (il giro è perso). Lo stato torna `statoIniziale(v)`, esito `{ errore: true, motivo: "Hai ricominciato: il DJ ha riacceso la pista", passi: 0 }`, e la demo chiama `g.errore("Hai ricominciato: il DJ ha riacceso la pista")`.

Perché ricominciare costa un errore: la scheda dice che conta come errore superare il limite di passi. Un «ricomincia» gratis renderebbe quell'errore evitabile sempre (si ricomincia un passo prima del limite) e il limite non costerebbe più niente. Così il bottone fa solo risparmiare i tocchi di chi un giro lo ha già perso: il punteggio è lo stesso che si avrebbe pestando a vuoto fino al limite. Il primo errore non toglie dorate (ne servono 2 per perderne una), quindi un giro «di prova» per capire la pista resta gratis.

### Quando è risolto

Quando tutte le 25 luci sono spente (`pista === 0`). La demo chiama subito `g.risolto({ riepilogo, ritardo: 1400 })` con:

- se `passi === v.minimo`: `Pista spenta in ${passi} passi: meno di così non si poteva.`
- altrimenti: `Pista spenta in ${passi} passi (il minimo era ${v.minimo}).`

### Memoria: il giro in corso resiste al ricaricamento

Ricaricare la pagina non deve dare un giro nuovo gratis. Dopo **ogni** passo e **ogni** errore salva (la conferma di «Ricomincia» non serve salvarla):

```js
g.memoria.pista = inRighe(stato.pista);
g.memoria.passi = stato.passi;
g.salvaMemoria();
```

In `crea(g)`, se `g.giaRisolto` è falso e la memoria è valida (`pista` = array di 5 stringhe `/^[01]{5}$/` non tutte zero, `passi` intero con `0 ≤ passi < v.limite`), lo stato parte da lì (`conferma: false`); altrimenti da `statoIniziale(v)`.

### Già risolto

Con `g.giaRisolto` lo stato è `{ pista: 0, passi: 0, conferma: false, risolto: true }`: la pista si vede tutta spenta, nell'aspetto «risolto» (sezione 5). L'input lo blocca il kit.

---

## 4. Interfaccia

### Tocchi

- Con `g.tocca`, si agisce solo su `tipo === "giu"`: se il punto cade su una piastrella (funzione `piastrellaInPunto`, sezione 5) si chiama `mossa({ r, c })`. Fuori dalla pista non succede niente. Trascinare non pesta altre piastrelle.
- **Anteprima col mouse**: su `tipo === "muovi"` con `premuto === false` **e** `evento.pointerType === "mouse"`, la piastrella sotto il puntatore e le sue vicine prendono il contorno d'anteprima (sezione 5). Sparisce quando il puntatore esce dalla pista o dalla scena (aggiungi un `pointerleave` su `g.scena`). Col dito niente anteprima.
- Tastiera: non serve.

### Bottone

Uno solo: `g.bottone("Ricomincia", () => mossa({ ricomincia: true }), { id: "ricomincia" })`. Tieni l'elemento e, dopo **ogni** mossa (anche un passo, che annulla la conferma), aggiornane l'etichetta: **«Conferma»** mentre `conferma` è vera, altrimenti «Ricomincia» (l'`id` resta `ricomincia`).

### Carta iniziale

Il testo della scheda più una riga con il limite di questa pista. Siccome il limite dipende dalla variante, tieni un riferimento all'oggetto delle opzioni e imposta `testo` dentro `crea` (il kit legge `opzioni.testo` solo dopo `crea`):

```js
const opzioni = {
  id: "pista-si-spegne", sfondo: "sala-principale", velo: 0.5,
  variante(rng) { return generaVariante(rng); },
  crea(g) {
    const v = g.variante;
    opzioni.testo = g.scheda.enigma + "\n" +
      `Per questa pista hai ${v.limite} passi. Se finiscono prima che sia tutta spenta, il DJ se ne accorge e la riaccende com'era all'inizio.`;
    // ...
  },
};
EscapeDemo.avvia(opzioni);
```

### Messaggi del fumetto (`g.messaggio`), testi esatti

`p` = passi, `L` = limite, `n` = luci accese, `resto = L - p`.

| Quando | Testo |
|---|---|
| All'inizio (0 passi) | `Pesta una piastrella: cambiano lei e le quattro vicine.` |
| All'apertura con un giro salvato in memoria (`p > 0`) | `Passo ${p} di ${L}: riprendi da dove eri rimasto.` |
| Dopo un passo, `resto > 3`, `n ≥ 2` | `Passo ${p} di ${L}: ${n} piastrelle ancora accese.` |
| Dopo un passo, `resto > 3`, `n === 1` | `Passo ${p} di ${L}: resta accesa una piastrella sola.` |
| Dopo un passo, `resto` fra 2 e 3 | `Passo ${p} di ${L}: il DJ si guarda intorno, restano ${resto} passi.` |
| Dopo un passo, `resto === 1` | `Passo ${p} di ${L}: il DJ si guarda intorno, resta 1 passo.` |
| Dopo un errore (passi finiti o ricomincia) | `La pista è di nuovo com'era all'inizio: passi a zero.` |
| Primo tocco su Ricomincia | `Ricominciare conta come finire i passi. Tocca ancora per confermare.` |
| Ricomincia con 0 passi | `La pista è già com'era all'inizio.` |
| Risolto | `Pista spenta! Il DJ non si è accorto di niente.` |
| Già risolto all'apertura | `La pista è spenta: qui hai già finito.` |

I motivi di `g.errore` sono esattamente `Passi finiti: il DJ ha riacceso la pista` e `Hai ricominciato: il DJ ha riacceso la pista` (il kit ci aggiunge da solo le dorate rimaste).

---

## 5. Grafica

### Sfondo e composizione

`sfondo: "sala-principale"`, `velo: 0.5`. Nello sfondo ci sono già: la porta del bar con l'insegna BAR a sinistra (x 36…80), la palla stroboscopica in alto al centro (160, 16) con i fasci di luce, la consolle del DJ a destra (piano nero x 226…287, y 82…97, giradischi a y 79…82 con x 230…241 e 272…283, lucine a y 81, base di legno x 218…295, y 98…117), il pavimento da y 118 e le sagome che ballano agli angoli in basso. Il fianco destro della pedana copre qualche pixel della base di legno della consolle (fino a x 233 vicino al pavimento): va bene così, la pedana sta davanti.

| Elemento | Dove (x, y) |
|---|---|
| Pedana: bordo lontano | x 106…214, y 51…53 |
| Griglia 5×5 della pista | y 54…139, trapezio: x 110…210 in cima, x 84…236 in fondo |
| Bordo vicino | x 80…240, y 140 |
| Fronte della pedana | x 80…240, y 141…151 |
| Pannello dei passi | x 121…199, y 142…150 |
| 12 lampadine sul fronte | y 144…147, x 83…116 e 202…235 |
| Ombra sul pavimento | x 81…239, y 152 |
| DJ vampiro (dietro la consolle) | x 247…266, y 57…80 |
| «?» / «!» sopra il DJ | centrati in x 257, y 48 / y 46 |
| Note musicali | partono da (233, 72) e (275, 72), salgono fino a y 53 |
| Zucco | x 44…71, y 121…151 (in piedi sul pavimento, a sinistra della pedana) |

Ordine di disegno su `g.ctx`: DJ con note e segni, pedana (bordi, fughe, piastrelle, contorni, fronte), Zucco. Niente si sovrappone, ma tieni quest'ordine.

**Quando ridisegnare.** Tutte le animazioni vanno a 8 fotogrammi al secondo (`g.fotogramma`). In `g.anima` ridisegna tutto (con `clearRect`) solo se `g.fotogramma` è cambiato o se è successo qualcosa (mossa, anteprima): tieni una variabile `sporco`, `true` all'avvio e dopo ogni mossa e ogni cambio di anteprima. Così la risposta arriva entro un fotogramma dello schermo e la pista (qualche migliaio di rettangoli) non si ridisegna 60 volte al secondo.

Per i tempi delle animazioni salva il fotogramma dell'evento (`fPasso`, `fErrore`, `fVittoria`) e usa `eta = g.fotogramma - fEvento`.

### Geometria della pista

La pista è un trapezio disegnato riga di pixel per riga di pixel (ogni riga di pixel è un rettangolo alto 1: va bene, sono rettangoli pieni a coordinate intere). Le file di piastrelle crescono verso chi guarda, come le piastrelle del pavimento dello sfondo.

```js
const YB = [54, 69, 85, 102, 120, 139];  // YB[r] = riga di pixel della fuga sopra la fila r; YB[5] = bordo in fondo
const mezza = (y) => 50 + Math.floor(((y - 54) * 26) / 85);           // mezza larghezza della griglia, per y fra 54 e 139
const xc = (k, y) => 160 - mezza(y) + Math.round((k * 2 * mezza(y)) / 5); // confine k (0…5) fra le colonne, alla riga y
```

- Fila `r`: fuga (scura) alla riga `YB[r]`, interno delle piastrelle da `YB[r] + 1` a `YB[r+1] - 1` (altezze 14, 15, 16, 17, 18).
- Alla riga di pixel `y`, la colonna `c` ha la fuga in `x = xc(c, y)` e l'interno da `xc(c, y) + 1` a `xc(c + 1, y) - 1`. Il bordo destro della griglia è `x = xc(5, y)`.
- Riscontro: in cima `xc(0, 54) = 110`, `xc(5, 54) = 210`; in fondo `xc(0, 139) = 84`, `xc(5, 139) = 236`.

Centri delle piastrelle (quelli di `posizione(r, c)`):

| Fila | y del centro | Confini x a quella y (k = 0…5) | Centri x (c = 0…4) |
|---|---|---|---|
| 0 | 61 | 108 129 150 170 191 212 | 119 140 160 181 202 |
| 1 | 77 | 103 126 149 171 194 217 | 115 138 160 183 206 |
| 2 | 93 | 99 123 148 172 197 221 | 111 136 160 185 209 |
| 3 | 111 | 93 120 147 173 200 227 | 107 134 160 187 214 |
| 4 | 129 | 88 117 146 174 203 232 | 103 132 160 189 218 |

```js
function posizione(r, c) {
  if (![r, c].every((v) => Number.isInteger(v) && v >= 0 && v <= 4)) return null;
  const y = Math.floor((YB[r] + YB[r + 1]) / 2);
  return { x: Math.round((xc(c, y) + xc(c + 1, y)) / 2), y };
}

/** La piastrella sotto un punto della scena, con 3-4 pixel di margine attorno alla pista; null se fuori. */
function piastrellaInPunto(x, y) {
  const xi = Math.floor(x), yi = Math.floor(y);
  if (yi < 51 || yi > 141) return null;
  const yy = Math.min(138, Math.max(54, yi));
  let r = 0;
  while (r < 4 && yy >= YB[r + 1]) r++;
  const sx = 160 - mezza(yy), dx = 160 + mezza(yy);
  if (xi < sx - 4 || xi > dx + 4) return null;
  const c = Math.min(4, Math.max(0, Math.floor(((xi - sx) * 5) / (dx - sx))));
  return { r, c };
}
```

Le zone di tocco sono le piastrelle intere con le fughe (la più piccola, in fondo, è circa 21×15 pixel della scena).

### La pedana (cornice di metallo)

In questo elenco, per brevità, `rett(colore, x, y, w, h)` sta per `EscapeDemo.rett(ctx, colore, x, y, w, h)`; nei blocchi di codice delle piastrelle `rett`, `retino` e `riquadro` sono quelli del kit, con `ctx` come primo argomento. Colori dei bordi: `chiaro = C.ferroChiaro`, `scuro = C.ferro`. Nell'aspetto **risolto** (vittoria e già risolto) diventano `chiaro = C.oro`, `scuro = C.oroScuro`: la cornice si accende d'oro.

1. **Bordo lontano**: `rett(C.bordo, 106, 51, 109, 1)`; `rett(chiaro, 107, 52, 107, 1)`; `rett(scuro, 107, 53, 107, 1)`.
2. **Fianchi e fughe**, per ogni `y` da 52 a 139, con `yy = Math.max(54, y)`, `L = 160 - mezza(yy)`, `R = 160 + mezza(yy)`:
   - `rett(C.bordo, L - 4, y, 1, 1)` e `rett(C.bordo, R + 4, y, 1, 1)` (contorno esterno);
   - se `y ≥ 54`: `rett(chiaro, L - 3, y, 2, 1)`, `rett(scuro, L - 1, y, 1, 1)` (fianco sinistro, in luce) e `rett(scuro, R + 1, y, 3, 1)` (fianco destro, in ombra);
   - se `y ≥ 54`: `rett(C.bordo, L, y, R - L + 1, 1)` (il fondo scuro della griglia: le fughe sono quello che resta scoperto dalle piastrelle).
3. **Le 25 piastrelle** (sotto).
4. **Bordo vicino**: `rett(chiaro, 81, 140, 159, 1)`, `rett(C.bordo, 80, 140, 1, 1)`, `rett(C.bordo, 240, 140, 1, 1)`.
5. **Fronte**: `riquadro(ctx, 80, 141, 161, 11, C.muro)`; `rett(C.muroCasa, 81, 142, 159, 1)` (lo spigolo in luce).
6. **Ombra**: `rett(C.nero, 81, 152, 159, 1)`.
7. **Pannello dei passi**: `rett(C.nero, 121, 142, 79, 9)`, poi la scritta in 5×7, centrata in x 160, y 143, `ombra: null`:
   - normale: `PASSI 04/17` (passi sempre a due cifre, `String(p).padStart(2, "0")`, poi `/` e il limite), colore `C.acqua`; quando restano da 1 a 3 passi, colore `C.oro`;
   - per 12 fotogrammi dopo un errore: `PASSI FINITI` in `C.tappetoChiaro`;
   - risolto: `PISTA SPENTA` in `C.giallo`.
8. **Lampadine**: 12, indice `k` da 0 a 11; le prime sei in `x = 84 + 6k`, le altre in `x = 203 + 6(k - 6)`. Ognuna: `rett(C.bordo, x - 1, 144, 4, 4)`, `rett(colore, x, 145, 2, 2)` e, se accesa, `rett(C.bianco, x, 145, 1, 1)`.
   - normale: colore di base `[C.rosa, C.acqua, C.giallo, C.lilla][k % 4]`; è accesa se `(k + g.fotogramma) % 4 === 0`, altrimenti è spenta e si disegna `C.ferro` senza il punto bianco (una luce che corre); con `g.riduciMovimento` tutte accese, ferme;
   - per 12 fotogrammi dopo un errore: tutte accese `C.tappetoChiaro`;
   - risolto: tutte accese `C.oro`.

### Le piastrelle

Per la piastrella `(r, c)`: `y0 = YB[r] + 1`, `y1 = YB[r+1] - 1`; per ogni riga `y` da `y0` a `y1`: `x0 = xc(c, y) + 1`, `x1 = xc(c + 1, y) - 1`, `w = x1 - x0 + 1`.

**Accesa.** Colori `[scuro, medio, chiaro] = FAMIGLIE[(r + c) % 4]` con

```js
const FAMIGLIE = [GEMME.acquamarina, GEMME.topazio, GEMME.ametista, GEMME.zaffiro];
```

(le pietre del kit: azzurro, arancio, viola, blu a diagonali, come una vera pista da discoteca; il colore è fisso per piastrella e non vuol dire niente, conta solo accesa o spenta).

```js
for (let y = y0; y <= y1; y++) {
  rett(ctx, medio, x0, y, w, 1);
  if (y === y0) rett(ctx, chiaro, x0, y, w, 1);          // lato in luce in alto
  else if (y === y1) rett(ctx, scuro, x0, y, w, 1);       // ombra in basso
  else {
    rett(ctx, chiaro, x0, y, 1, 1);                        // lato in luce a sinistra
    rett(ctx, scuro, x1, y, 1, 1);                         // ombra a destra
    if (y >= y0 + 3 && y <= y1 - 3) retino(ctx, medio, chiaro, x0 + 3, y, w - 6, 1, 0.5); // il vetro che brilla
  }
}
// riflesso: 2 pixel bianchi sulla seconda riga e 1 sulla terza, in alto a sinistra
rett(ctx, C.bianco, xc(c, y0 + 1) + 2, y0 + 1, 2, 1);
rett(ctx, C.bianco, xc(c, y0 + 2) + 2, y0 + 2, 1, 1);
```

Luccichio (solo decorazione, niente con `g.riduciMovimento`): quando `(g.fotogramma + r * 3 + c * 5) % 16 < 2`, una crocetta `C.bianco` di 5 pixel (centro più i 4 vicini) centrata nel punto `posizione(r, c)`. Le piastrelle luccicano sfasate, ognuna circa una volta ogni 2 secondi.

**Spenta.** Vetro scuro con la lampada spenta incassata:

```js
for (let y = y0; y <= y1; y++) {
  rett(ctx, C.muroCasa, x0, y, w, 1);
  if (y === y0) rett(ctx, C.ferro, x0, y, w, 1);
  else {
    rett(ctx, C.ferro, x0, y, 1, 1);
    if (y >= y0 + 3 && y <= y1 - 3) rett(ctx, C.muro, x0 + 3, y, w - 6, 1);
  }
}
rett(ctx, C.ferroChiaro, xc(c, y0 + 1) + 2, y0 + 1, 2, 1); // riflesso spento
```

**Rossa** (solo nel lampo dell'errore): come «accesa» ma con `[scuro, medio, chiaro] = GEMME.rubino` per tutte le piastrelle, senza luccichio.

**Contorno** (anteprima, passo, onda della vittoria): un anello di 1 pixel *dentro* la piastrella, sopra a tutto il resto: per `y` da `y0` a `y1`, se `y` è `y0` o `y1` tutta la riga `x0…x1`, altrimenti solo i pixel `x0` e `x1`.

### Stati visivi della pista

- **Normale**: ogni piastrella accesa o spenta secondo lo stato.
- **Anteprima** (solo mouse): contorno `C.bianco` sulla piastrella sotto il puntatore, `C.pietraChiara` sulle sue vicine (quelle che cambierebbero).
- **Passo**: lo stato cambia subito; per 2 fotogrammi (`eta` 0 e 1 da `fPasso`) contorno `C.bianco` sulla piastrella pestata e `C.pietraChiara` sulle vicine cambiate. (Se c'è anche l'anteprima, vince il contorno del passo.)
- **Errore** (`eta` da `fErrore`): lo stato è già quello iniziale. `eta` 0–1: tutte le 25 piastrelle **rosse** (lampo). `eta` da 2 a 6: la pista si riaccende dall'alto, una fila per fotogramma: le file `r ≤ eta − 2` si disegnano secondo lo stato, quelle sotto spente. Da `eta` 7 normale. I tocchi restano attivi; il disegno usa sempre lo stato corrente.
- **Risolto**: tutte spente, cornice d'oro, `PISTA SPENTA`, lampadine d'oro. Appena risolto, per `eta` da 0 a 9 (da `fVittoria`) un'onda: contorno `C.bianco` sulle piastrelle con `eta − d` uguale a 0 o 1, dove `d = |r − r0| + |c − c0|` è la distanza dall'ultima piastrella pestata `(r0, c0)`: il buio si allarga dal punto pestato.
- **Già risolto**: come «risolto», senza onda.

Con `g.riduciMovimento`: niente lampo rosso e niente riaccensione a file (subito lo stato), niente onda, niente luccichii, lampadine ferme. Restano i cambi che non sono movimento: faccia del DJ, scritte del pannello, colori di lampadine e cornice.

### Il DJ vampiro

Sta dietro la consolle dello sfondo, con le cuffie: angolo in alto a sinistra in **(247, 57)**, 20×24 pixel, l'ultima riga a y 80 (subito sopra le lucine della consolle, che restano scoperte). È un vampiro della festa con i colori della paletta:

```js
const DJ_COLORI = {
  k: C.bordo, h: C.nero, H: C.ferro, f: C.pietraChiara, F: C.pietra, r: C.tappetoChiaro, w: C.bianco,
  x: C.tappetoChiaro, c: C.ferro, l: C.ferroChiaro, C: C.tappeto, v: C.violaScuro, m: C.ferroChiaro, M: C.ferro, p: C.rosa,
};
// Balla a occhi chiusi, con le cuffie (m archetto, M padiglioni, p lucina rosa), mantello (c, bordo in luce l, fodera rossa C),
// colletto rosso x, camicia w con farfallino, gilet v, mani f sul mixer.
const DJ = [
  ".....kkkkkkkkkk.....",
  "....kmmmmmmmmmmk....",
  "...kmkkkkkkkkkkmk...",
  "...kmkhHHhhhhhkmk...",
  "...kmkhHhffhhhkmk...",
  "..kMMkhhffffhhkMMk..",
  "..kMpkhffffffhkpMk..",
  "..kMpkfkkffkkfkpMk..",
  "..kMMkffffffFFkMMk..",
  "..kkkkffkkkkFFkkkk..",
  ".....kffwffwFFk.....",
  "......kffffFFk......",
  "....kxxkkkkkkxxk....",
  "..kcxxxkwwwwkxxxck..",
  ".klcCxkvwxxwvkxCcck.",
  "klcCCkvvwwwwvvkCCcck",
  "klcCCkvvvwwvvvkCCcck",
  "klccCkvvvwwvvvkCccck",
  "klckCkvvvwwvvvkCkcck",
  "klckckvvvwwvvvkckcck",
  "klckckvvvwwvvvkckcck",
  ".kckfkkvvwwvvkkfkck.",
  ".kkfffkkkkkkkkfffkk.",
  "..kkkk........kkkk..",
];
// Sostituzioni di righe per le altre facce (indice di riga → nuova riga).
const DJ_SOSPETTO = { 7: "..kMpkfrwffrwfkpMk.." };                 // occhi aperti, rossi, che sbirciano la pista
const DJ_ARRABBIATO = {
  6: "..kMpkhkffffkhkpMk..",                                        // sopracciglia aggrottate
  7: "..kMpkfrrffrrfkpMk..",                                        // occhi rossi spalancati
  9: "..kkkkfkkkkkkFkkkk..",                                        // bocca spalancata
  10: ".....kfkwrrwkFk.....",                                       // canini e lingua
  11: "......kfkkkkFk......",
};
```

Disegno: righe 12–23 (busto) in `y = 69`; poi righe 0–11 (testa) in `y = 57 + dy`, sopra il busto. Le facce:

| Faccia | Quando | Cosa cambia |
|---|---|---|
| **Balla** | normale, risolto, già risolto | occhi chiusi; `dy = Math.floor(g.fotogramma / 2) % 2` (la testa va a tempo, due volte al secondo); note musicali. Con `g.riduciMovimento`: `dy = 0`, niente note. |
| **Sospetto** | restano da 1 a 3 passi | righe di `DJ_SOSPETTO`, `dy = 0`, niente note; un `?` piccolo (3×5) `C.giallo` centrato in x 257, y 48. |
| **Arrabbiato** | per 12 fotogrammi dopo un errore (vince su tutto) | righe di `DJ_ARRABBIATO`, `dy = 0`, niente note; un `!` 5×7 `C.tappetoChiaro` centrato in x 257, y 46. |

Dopo la vittoria il DJ continua a ballare: non si è accorto di niente.

**Note musicali** (solo nella faccia «balla», niente con `g.riduciMovimento`): la nota numero `n = Math.floor(g.fotogramma / 12)` nasce al fotogramma `12n` e vive 20 fotogrammi, quindi se ne vedono al massimo due. Per ogni `n` ancora viva (`a = g.fotogramma − 12n`, da 0 a 19): `x = (n % 2 ? 275 : 233) + (Math.floor(a / 4) % 2)`, `y = 72 − a`, colore della lettera `a` = `n % 2 ? C.acqua : C.lilla`.

```js
const NOTA = [ // 6×8, k = C.bordo, a = colore della nota
  "..kkk.",
  "..kaak",
  "..kakk",
  "..kak.",
  "kkkak.",
  "kaaak.",
  "kaaak.",
  ".kkk..",
];
```

### Zucco

In piedi sul pavimento a sinistra della pedana, girato verso la pista: angolo in alto a sinistra in **(44, 121)**, sprite 28×31 (i piedi a y 151). Sono le pose della fuga di Zucco, con i suoi colori originali: alcuni non sono nella paletta del kit (segnati sotto) e vanno tenuti così, perché è il protagonista e deve essere identico all'altro gioco del sito.

```js
const ZUCCO_COLORI = {
  k: C.bordo, O: C.brace, y: C.fiamma, h: C.fiammaChiara, E: C.oro, e: C.luna, P: C.violaScuro, p: C.viola, q: C.lilla,
  // colori propri di Zucco, fuori paletta:
  o: "#9c3b17", b: "#4a1a12", G: "#2d5a2e", g: "#5f9440", B: "#463a6a", L: "#7a6aa4", R: "#5e3c44", T: "#83575c",
};
const ZUCCO_FERMO = [
  "...............Gg...........",
  "..............GGg...........",
  "...........kkkkkkkkkk.......",
  "..........koOOyyyOOOok......",
  ".........koOOyyhyyOOOok.....",
  ".........koOyEEyyOEEOok.....",
  ".........koOEeeEyOEeeEk.....",
  ".........koOOEEOOEOEEOk.....",
  ".........koOOOOOEEOOOOk.....",
  ".........koObEbEbEbEbOk.....",
  ".........kooOeEeEeEeOok.....",
  "..........kooOOOOOOOok......",
  ".......kkkkkkkkkkkkkk.......",
  "......kqqpppppppk...........",
  ".....kqpppppppppPk..........",
  "....kqppppppppppPk.PPP......",
  "...kqpppPppppppPPk....kkk...",
  "..kqppPPkppppppPk.....kek...",
  "..kppPPk.kpppPPPk.....kEk...",
  "...kPk...kpPPPPk......kkk...",
  "....k.....kkkkk.............",
  "...........BB.LL............",
  "...........BB..LL...........",
  "............BB.LL...........",
  "............BB..LL..........",
  ".............BB.LL..........",
  ".............BB..LL.........",
  "............BB...LL.........",
  "...........BB...LL..........",
  ".........kRRRk.kTTTk........",
  ".........kkkkk.kkkkk........",
];
const ZUCCO_RESPIRO = [
  "............................",
  "...............Gg...........",
  "..............GGg...........",
  "...........kkkkkkkkkk.......",
  "..........koOOyyyOOOok......",
  ".........koOOyyhyyOOOok.....",
  ".........koOyEEyyOEEOok.....",
  ".........koOEeeEyOEeeEk.....",
  ".........koOOEEOOEOEEOk.....",
  ".........koOOOOOEEOOOOk.....",
  ".........koObEbEbEbEbOk.....",
  ".........kooOeEeEeEeOok.....",
  "..........kooOOOOOOOok......",
  ".......kkkkkkkkkkkkkk.......",
  "......kqqpppppppk...........",
  "....kkqpppppppppPk.P........",
  "...kqqppppppppppPk..P.......",
  "..kqppppPpppppPPPk...P......",
  "...kkkPPkkppppPPk.....kkk...",
  "......kk.kpppPPPk.....kek...",
  ".........kpPPPPk......kEk...",
  "..........kkkkkL......kkk...",
  "...........BB..LL...........",
  "............BB.LL...........",
  "............BB..LL..........",
  ".............BB.LL..........",
  ".............BB..LL.........",
  "............BB...LL.........",
  "...........BB...LL..........",
  ".........kRRRk.kTTTk........",
  ".........kkkkk.kkkkk........",
];
const ZUCCO_SALTO = [ // gambe raccolte: si disegna 3 pixel più su, in (44, 118)
  "...............Gg...........",
  "..............GGg...........",
  "...........kkkkkkkkkk.......",
  "..........koOOyyyOOOok......",
  ".........koOOyyhyyOOOok.....",
  ".........koOyEEyyOEEOok.....",
  ".........koOEeeEyOEeeEk.....",
  ".........koOOEEOOEOEEOk.....",
  ".........koOOOOOEEOOOOk.....",
  ".........koObEbEbEbEbOk.....",
  ".........kooOeEeEeEeOok.....",
  "..........kooOOOOOOOok......",
  ".......kkkkkkkkkkkkkk.......",
  "......kqqpppppppk...........",
  "....kkqpppppppppPk..........",
  "...kqqppppppppppPk.P........",
  "..kqppppPpppppPPPk..PP......",
  "...kkkPPkkppppPPk.....kkk...",
  "......kk.kpppPPPk.....kek...",
  ".........kpPPPPk......kEk...",
  "..........kkkkk.......kkk...",
  "...........BB.LLL...........",
  "............BB.kTTTk........",
  "........kRRRkB.kkkkk........",
  "........kkkkk...............",
];
```

| Momento | Posa |
|---|---|
| Fermo | `ZUCCO_FERMO` e `ZUCCO_RESPIRO` alternati ogni 4 fotogrammi (`Math.floor(g.fotogramma / 4) % 2`); con `g.riduciMovimento` sempre `ZUCCO_FERMO`. |
| Dopo ogni passo valido | `ZUCCO_SALTO` in (44, 118) per 2 fotogrammi: pesta a tempo con il giocatore. |
| Dopo un errore | `ZUCCO_FERMO` che trema: x 43 e 45 alternati a ogni fotogramma, per 4 fotogrammi. |
| Vittoria | per 12 fotogrammi `ZUCCO_SALTO` (y 118) e `ZUCCO_FERMO` alternati ogni 2 fotogrammi, poi fermo. |

Con `g.riduciMovimento` niente salti né tremolio.

### Riepilogo delle reazioni

| Evento | Pista | Pannello e lampadine | DJ | Zucco |
|---|---|---|---|---|
| Passo | cambia subito; contorni per 2 fotogrammi | `PASSI pp/LL` | balla, o sospetto se restano 1–3 passi | salta |
| Errore | lampo rosso, poi si riaccende a file | `PASSI FINITI` e lampadine rosse per 12 fotogrammi | arrabbiato con `!` per 12 fotogrammi | trema |
| Vittoria | tutta spenta, onda, cornice d'oro | `PISTA SPENTA`, lampadine d'oro | continua a ballare | salta di gioia |

---

## 6. Aggancio per le prove

```js
g.espone({
  gioca: (m) => mossa(m),          // la stessa funzione dei tocchi e del bottone
  statoGioco: () => ({
    pista: inRighe(stato.pista),   // 5 stringhe "0"/"1", riga 0 = la fila in fondo
    passi: stato.passi,
    limite: v.limite,
    minimo: v.minimo,
    accese: contaBit(stato.pista),
    risolto: stato.risolto,
    conferma: stato.conferma,
  }),
  posizione: (r, c) => posizione(r, c),  // centro della piastrella { x, y } in pixel della scena, null se r/c non validi
});
```

Mosse ed esiti di `gioca` (il valore di ritorno è l'`esito` di `applica`, già con lo stato aggiornato):

| Mossa | Esito |
|---|---|
| `{ r, c }` valida, pista non spenta, passi < limite | `{ ok: true, passi, accese }` |
| `{ r, c }` che spegne la pista | `{ risolto: true, passi }` |
| `{ r, c }` che arriva al limite con luci accese | `{ errore: true, motivo: "Passi finiti: il DJ ha riacceso la pista", passi: 0 }` |
| `{ r, c }` con valori non validi, `{}` o altro | `{ valida: false }` |
| `{ ricomincia: true }` con 0 passi | `{ valida: false }` |
| `{ ricomincia: true }` la prima volta | `{ conferma: true }` |
| `{ ricomincia: true }` la seconda volta di fila | `{ errore: true, motivo: "Hai ricominciato: il DJ ha riacceso la pista", passi: 0 }` |

Un passo valido azzera `conferma`; una mossa non valida no. `g.errore` e `g.risolto` si chiamano dentro `mossa`, dopo aver aggiornato lo stato.

---

## 7. Criteri di accettazione

Guardando le foto (`desktop`, `telefono`, `telefono-verticale`, `verifica-*`) e giocando:

1. La pedana è al centro, sopra il pavimento, con la cornice di metallo e il fronte con il pannello `PASSI 00/LL` leggibile; non copre la porta del bar né il piano della consolle; niente disegnato sotto le barre del kit (y < 16 o y ≥ 154).
2. Le piastrelle accese sono colorate e luminose (azzurro, arancio, viola, blu a diagonali) e quelle spente scure: accese e spente si distinguono al primo sguardo anche sul telefono.
3. Con `?seed=12345` la pista è `01010 11000 11100 11011 11111` e il limite 15.
4. Un tocco su una piastrella cambia lei e le quattro vicine (sui bordi e negli angoli solo quelle che esistono), il pannello conta il passo, Zucco salta, il fumetto dice passo e luci accese. Col mouse, prima di toccare, si vede l'anteprima della croce.
5. Toccare il muro o il pavimento fuori dalla pedana non fa niente.
6. Quando restano 3 passi o meno il DJ apre gli occhi con il `?` e il pannello diventa oro.
7. All'ultimo passo senza pista spenta: avviso del kit con «Passi finiti: il DJ ha riacceso la pista», lampo rosso, la pista si riaccende com'era a file dall'alto, il DJ arrabbiato con `!`, `PASSI FINITI` in rosso, passi a zero. Al secondo errore le dorate in palio scendono a 3.
8. «Ricomincia»: al primo tocco l'etichetta diventa «Conferma» e il fumetto avvisa; al secondo è un errore e la pista torna com'era. A 0 passi non fa niente.
9. Ricaricando la pagina a metà giro, pista e passi restano dove erano.
10. Spegnendo l'ultima luce: onda dal punto pestato, cornice e lampadine d'oro, `PISTA SPENTA`, Zucco salta, il DJ continua a ballare; dopo circa 1,4 secondi la carta della vittoria con il riepilogo dei passi e del minimo.
11. Riaprendo dopo la vittoria: pista spenta, cornice d'oro, nessuna mossa accettata.
12. Con «riduci movimento» del sistema: niente teste che dondolano, note, luccichii, lampadine che corrono, salti; le reazioni all'errore e alla vittoria arrivano subito allo stato finale.
13. `node demo/comune/prova.mjs pista-si-spegne` finisce con «TUTTO OK».
