# L'ascensore del privé: istruzioni per il costruttore

Valgono insieme a [`../REGOLE_COMUNI.md`](../REGOLE_COMUNI.md) e al kit (`../comune/kit.js`). Qui c'è solo quello che è specifico di questo rompicapo. `id` della demo: `ascensore-prive`; `<title>` di `index.html`: `L'ascensore del privé`.

**Stanza provvisoria.** Il privé non esiste più fra le stanze del locale, quindi la stanza non è assegnata: `sfondo: null`, `tinta: EscapeDemo.C.violaScuro`, `velo: 0.5`. La scena la disegni tutta tu, opaca, sopra lo sfondo provvisorio (che resta visibile solo nel fondale ai lati). Nel rapporto finale scrivi che la stanza è provvisoria.

## 1. In breve

Una sezione di un locale su due piani con l'ascensore nel mezzo: al piano terra cinque scheletri e cinque zombie, di sopra il privé. Il giocatore tocca i mostri per farli entrare in cabina (al massimo tre) e preme **Parti**; all'arrivo scendono tutti. Se dopo una corsa in cabina o a un piano ci sono scheletri e gli zombie sono di più, gli zombie rubano le ossa: è un errore e la corsa si annulla. Si vince quando sono tutti e dieci al privé (il minimo è 11 corse; nessun limite).

## 2. Variante

### Il generatore

Tutti i giocatori hanno 5 scheletri, 5 zombie e la cabina da 3. Dal seme cambiano gli **accessori** degli scheletri e le **camicie** degli zombie (chi porta cosa), così ogni mostro si riconosce e due giocatori non vedono la stessa scena.

```js
const NUMERI_ATTIVI = [5];          // vedi «Perché solo 5» qui sotto
const MINIMO = { 4: 9, 5: 11 };     // corse minime, verificate con una ricerca in ampiezza sugli stati
const ACCESSORI = ["cilindro", "festa", "fiore", "papillon", "occhiali"];
const CAMICIE = ["grigia", "viola", "arancio", "blu", "senape"];

variante(rng) {
  const n = NUMERI_ATTIVI[Math.floor(rng() * NUMERI_ATTIVI.length)]; // consuma un numero anche con una sola scelta
  return {
    scheletri: n,
    zombie: n,
    capienza: 3,
    minimo: MINIMO[n],
    accessori: EscapeDemo.mescola(rng, ACCESSORI).slice(0, n), // accessori[i] è dello scheletro s<i>
    camicie: EscapeDemo.mescola(rng, CAMICIE).slice(0, n),     // camicie[i] è dello zombie z<i>
  };
}
```

L'ordine delle chiamate a `rng` (prima `n`, poi gli accessori, poi le camicie) va rispettato: gli esempi qui sotto ne dipendono.

**Formato esatto** (nessun altro campo):

```json
{ "scheletri": 5, "zombie": 5, "capienza": 3, "minimo": 11,
  "accessori": ["cilindro", "papillon", "fiore", "occhiali", "festa"],
  "camicie": ["blu", "senape", "arancio", "grigia", "viola"] }
```

**Esempi** (calcolati con `casuale` e `mescola` del kit):

| seme | accessori (s0…s4) | camicie (z0…z4) |
|---|---|---|
| 12345 | cilindro, papillon, fiore, occhiali, festa | blu, senape, arancio, grigia, viola |
| 12346 | fiore, festa, papillon, cilindro, occhiali | grigia, arancio, senape, viola, blu |
| 1 | occhiali, festa, papillon, fiore, cilindro | senape, grigia, blu, arancio, viola |
| 7 | occhiali, festa, fiore, papillon, cilindro | senape, blu, grigia, viola, arancio |

La soluzione non dipende dagli accessori. Una soluzione in 11 corse (è quella della scheda; S = scheletri, Z = zombie):

| corsa | carico | dopo: piano terra | dopo: privé |
|---|---|---|---|
| 1 | salgono 2 Z | 5S 3Z | 0S 2Z |
| 2 | scende 1 Z | 5S 4Z | 0S 1Z |
| 3 | salgono 3 Z | 5S 1Z | 0S 4Z |
| 4 | scende 1 Z | 5S 2Z | 0S 3Z |
| 5 | salgono 3 S | 2S 2Z | 3S 3Z |
| 6 | scendono 1 S e 1 Z | 3S 3Z | 2S 2Z |
| 7 | salgono 3 S | 0S 3Z | 5S 2Z |
| 8 | scende 1 Z | 0S 4Z | 5S 1Z |
| 9 | salgono 2 Z | 0S 2Z | 5S 3Z |
| 10 | scende 1 Z | 0S 3Z | 5S 2Z |
| 11 | salgono 3 Z | 0S 0Z | 5S 5Z |

### Perché solo 5 (e come si aggiunge il 4)

La scheda prevede anche la variante 4 scheletri + 4 zombie (9 corse), ma il secondo indizio del catalogo («Gli scheletri salgono in tre quando di sotto restano 2 zombie») con 4+4 è **falso**: tre scheletri non possono mai salire lasciando di sotto 2 zombie senza farsi rubare le ossa. Gli indizi li vende il kit dalla scheda e la demo non li può cambiare, quindi chi ha il 4+4 pagherebbe una dorata per un indizio che lo fa sbagliare. Per ora `NUMERI_ATTIVI = [5]`.

Il codice va scritto comunque per `n` generico (4 o 5), così il giorno che l'indizio viene riscritto basta mettere `NUMERI_ATTIVI = [4, 5]`. Con `n = 4`: si usano solo i posti 0…3 di ogni gruppo, il testo dice «Quattro scheletri e quattro zombie», il riepilogo dice «otto». Una soluzione 4+4 in 9 corse: 3Z su, 1Z giù, 2S su, 1S+1Z giù, 3S su, 1Z giù, 3Z su, 1Z giù, 2Z su.

## 3. Regole e mosse

### I mostri e lo stato

Ogni mostro ha un id: `s0`…`s4` (scheletri) e `z0`…`z4` (zombie). Ognuno sta in uno di tre posti: `"sotto"` (piano terra, fuori dalla cabina), `"sopra"` (privé, fuori dalla cabina) o `"cabina"`. La cabina sta ferma a un piano, `piano` (`"sotto"` o `"sopra"`), con a bordo da 0 a 3 mostri.

Stato logico consigliato (funzioni pulite stato + mossa → nuovo stato ed esito, come dicono le regole comuni):

```js
{
  piano: "sotto",                                // dove sta la cabina
  dove: { s0: "sotto", …, z4: "sotto" },          // "sotto" | "sopra" | "cabina"
  aBordo: [],                                     // id in cabina, nell'ordine in cui sono saliti
  posti: {},                                      // id in cabina → posto 0, 1 o 2 (da sinistra)
  corse: 0,                                       // corse riuscite (gli errori non contano)
  risolto: false,
}
```

Stato iniziale: tutti `"sotto"`, `piano: "sotto"`, cabina vuota, `corse: 0`.

### Le mosse

**Sali** (`sali(id)`): un mostro entra in cabina. Controlli, in quest'ordine:

1. l'id non esiste → rifiutata, motivo `"nessuno"`;
2. è già in cabina → rifiutata, motivo `"a bordo"`;
3. sta all'altro piano rispetto alla cabina → rifiutata, motivo `"altro piano"`;
4. in cabina ce ne sono già 3 → rifiutata, motivo `"piena"`;
5. altrimenti sale. Il posto in cabina: uno **scheletro** prende il posto libero più a sinistra, uno **zombie** quello più a destra (così con 1 scheletro e 2 zombie si guardano in faccia). Gli altri passeggeri non si spostano.

**Scendi** (`scendi(id)`): un passeggero torna al suo posto sul piano dove sta la cabina. Se l'id non esiste → `"nessuno"`; se non è in cabina → `"non a bordo"`.

**Parti** (`parti()`): la corsa. Cabina vuota → rifiutata, motivo `"vuota"` (l'ascensore non si muove vuoto). Altrimenti si contano scheletri e zombie in tre posti, e si controllano **in quest'ordine**:

1. **la cabina** durante il viaggio (i passeggeri);
2. **il piano di partenza** dopo che la cabina se n'è andata (chi è rimasto fuori);
3. **il piano d'arrivo** dopo che sono scesi tutti (chi c'era più i passeggeri).

Un posto è in regola se non ci sono scheletri, oppure se gli zombie non sono più degli scheletri (`s === 0 || z <= s`). Il primo posto fuori regola fa scattare l'**errore** (vedi sotto). Se sono tutti in regola la corsa riesce: la cabina va all'altro piano, **scendono sempre tutti** (ognuno al suo posto su quel piano), `corse` cresce di 1. Se a quel punto sono tutti `"sopra"`, il rompicapo è risolto.

Riferimento della corsa:

```js
function parti(st, v) {
  if (st.aBordo.length === 0) return { stato: st, esito: { valida: false, motivo: "vuota" } };
  const da = st.piano, a = da === "sotto" ? "sopra" : "sotto";
  const cab = conta(st, "cabina"), fp = conta(st, da), fa0 = conta(st, a);
  const fa = { s: fa0.s + cab.s, z: fa0.z + cab.z };
  const ok = (c) => c.s === 0 || c.z <= c.s;
  const dove = !ok(cab) ? "cabina" : !ok(fp) ? da : !ok(fa) ? a : null;
  if (dove) return { stato: st, esito: { errore: true, dove, motivo: MOTIVO[dove] } }; // stato invariato
  const n = copia(st);
  for (const id of n.aBordo) n.dove[id] = a;
  n.aBordo = []; n.posti = {}; n.piano = a; n.corse += 1;
  const tutti = conta(n, "sopra");
  if (tutti.s === v.scheletri && tutti.z === v.zombie) {
    n.risolto = true;
    return { stato: n, esito: { risolto: true, corse: n.corse } };
  }
  return { stato: n, esito: { ok: true, corse: n.corse, piano: a } };
}
```

**Ricomincia**: tutti di nuovo al piano terra, cabina di sotto e vuota, `corse: 0`. Non è un errore, non tocca errori né dorate.

### Errori

Conta come errore **solo una corsa che lascia in un posto (cabina o piano) degli scheletri con più zombie**. In quel caso:

- `g.errore(MOTIVO[dove])`, con questi testi esatti:
  - `dove: "cabina"` → `In cabina gli zombie sono di più: ossa rubate!`
  - `dove: "sotto"` → `Al piano terra gli zombie sono di più: ossa rubate!`
  - `dove: "sopra"` → `Al privé gli zombie sono di più: ossa rubate!`
- la corsa **si annulla**: lo stato resta esattamente quello di prima di Parti, **passeggeri compresi** (la cabina torna al piano di partenza con le stesse persone a bordo, così il giocatore corregge il carico);
- `corse` non cresce;
- nella scena: la rapina (vedi «Animazioni»).

Non sono errori, e non cambiano niente: cabina vuota, quarto passeggero, toccare un mostro dell'altro piano. Vengono rifiutate con un messaggio nel fumetto.

Errori concessi e dorate come da scheda (4 dorate, una in meno ogni 2 errori, minimo 1): li conta il kit.

### Limiti

Nessuno: si possono fare tutte le corse che si vogliono. Il contatore `CORSE` serve solo a vedere quante se ne fanno; il minimo (11) si scopre nel riepilogo della vittoria.

### Vittoria

All'ultima corsa (tutti `"sopra"`): `g.messaggio("Tutti al privé! Si balla.")`, salvi il numero di corse in `g.memoria.corse` e chiami `g.salvaMemoria()`, poi `g.risolto({ riepilogo, ritardo: 1600 })` subito (lo stato cambia subito; la carta arriva dopo, quando la festa si è vista). Il riepilogo:

- se `corse === minimo`: `Tutti e dieci al privé in 11 corse: meno di così non si può.`
- altrimenti: `Tutti e dieci al privé in ${corse} corse. Si poteva fare in ${minimo}.`

(«dieci» è il totale dei mostri in parole: `{ 8: "otto", 10: "dieci" }`.)

**Già risolto** (`g.giaRisolto`): la scena mostra lo stato finale (tutti al privé, cabina di sopra, festa in corso), `CORSE` mostra `g.memoria.corse` (o `minimo` se manca), il fumetto dice `Tutti al privé: la festa è già cominciata.`

## 4. Interfaccia

### Tocchi (`g.tocca`, solo `tipo === "giu"`)

Le zone di tocco si calcolano dallo **stato logico** (dove il mostro deve stare), non da dove è disegnato in quel momento. Si controllano in quest'ordine:

1. **un passeggero** (zona: `x` da `cx − 8` a `cx + 7`, `y` da `base − 28` a `base + 3`, con `cx` il centro del suo posto in cabina e `base` la base del piano della cabina) → **scendi**;
2. **un mostro su un piano** (zona: `|x − cx| ≤ 11`, `y` da `base − 28` a `base + 3`, con `cx` il centro del suo posto e `base` la base del suo piano):
   - se è al piano della cabina → **sali**;
   - se è all'altro piano → messaggio (vedi sotto) e il mostro scuote la testa;
3. altrove: niente.

Durante una corsa o un errore (vedi `occupato`) i tocchi e il bottone Parti si ignorano. Salire e scendere dalla cabina **non** bloccano niente: si può toccare di fila.

Facoltativo: col mouse sopra un mostro toccabile, cursore a manina (`scena.style.cursor = "pointer"`).

### Bottoni

- `g.bottone("Parti", parti, { id: "parti", forte: true })`
- `g.bottone("Ricomincia", ricomincia, { id: "ricomincia" })` — funziona sempre, anche durante un'animazione (che salta subito allo stato nuovo).

### Testi del fumetto (esatti; tutti sotto i 50 caratteri, così sul telefono stanno su una riga)

| Quando | `g.messaggio(...)` |
|---|---|
| all'inizio | `Tocca i mostri per farli salire, poi premi Parti.` |
| dopo sali/scendi, cabina con qualcuno | `In cabina: ${carico}.` (es. `In cabina: 2 scheletri e 1 zombie.`) |
| dopo scendi, cabina vuota | `Cabina vuota: tocca i mostri per farli salire.` |
| quarto passeggero | `In cabina ci stanno al massimo tre mostri.` |
| mostro all'altro piano, cabina di sopra | `La cabina è al privé.` |
| mostro all'altro piano, cabina di sotto | `La cabina è al piano terra.` |
| Parti con la cabina vuota | `L'ascensore non parte vuoto.` |
| corsa riuscita | `Corsa ${n}: ${verbo} ${carico}.` (es. `Corsa 1: saliti 2 zombie.`, `Corsa 2: sceso 1 zombie.`, `Corsa 6: scesi 1 scheletro e 1 zombie.`) |
| errore (dopo `g.errore`) | `La cabina torna indietro, passeggeri a bordo.` |
| Ricomincia | `Tutti di nuovo al piano terra.` |
| vittoria | `Tutti al privé! Si balla.` |
| già risolto | `Tutti al privé: la festa è già cominciata.` |

- `carico`: le parti non vuote unite da « e »: `1 scheletro` / `${s} scheletri`, poi `${z} zombie` (invariabile).
- `verbo`: in salita `salito` (1 passeggero) o `saliti` (più di uno); in discesa `sceso` o `scesi`.

### Testo della carta iniziale

Si passa ad `avvia` come `testo`, costruito dalla variante. Siccome il kit legge `opzioni.testo` solo quando mostra la carta (dopo `crea`), tieni un riferimento all'oggetto delle opzioni e assegna `opzioni.testo` dentro `crea(g)`:

```js
const NUMERO = { 4: "Quattro", 5: "Cinque" };
opzioni.testo =
  `${NUMERO[n]} scheletri e ${NUMERO[n].toLowerCase()} zombie devono salire al privé. ` +
  "L'ascensore porta al massimo tre persone e non si muove vuoto. Se a un piano o in cabina gli zombie sono " +
  "più degli scheletri, gli rubano le ossa (va bene solo se lì di scheletri non ce ne sono).\n" +
  "A ogni arrivo scendono tutti. Si controlla dopo ogni corsa: la cabina e tutti e due i piani.";
```

## 5. Grafica

Una sezione del locale vista di fronte, come un taglio nel muro: in alto il privé (velluto viola, boiserie, tappeto rosso, insegna al neon, palla da discoteca), in basso il piano terra (mattoni, torce, cartelli, ragnatele), in mezzo il vano dell'ascensore in ferro con la puleggia, la cabina d'ottone e legno e i cancelletti a pantografo. Gli scheletri stanno sempre a sinistra del vano e guardano verso destra (verso l'ascensore); gli zombie sempre a destra e guardano verso sinistra.

### Misure fisse

```js
const BASE = { sopra: 80, sotto: 146 };      // y della base: l'ultima riga dei piedi è BASE − 1
const SLOT_S = [114, 90, 66, 42, 18];        // centro x del posto dello scheletro s<i> (0 = vicino al vano)
const SLOT_Z = [206, 230, 254, 278, 302];    // centro x del posto dello zombie z<i>
const POSTI = [144, 160, 176];               // centro x dei tre posti in cabina, da sinistra
const cabY = (piano) => BASE[piano] - 38;    // y del tetto della cabina: 42 di sopra, 108 di sotto
```

Ogni mostro ha il suo posto fisso su **tutti e due** i piani (lo scheletro `s2` sta sempre a `x = 66`, di sopra o di sotto): quando sale in cabina lascia un buco, quando arriva va al suo posto. Così non si sovrappongono mai.

### Due livelli

- **Livello fisso**: `g.ctx`, disegnato **una volta** in `crea` (muri, pavimenti, vano, pilastri, cartelli, torce spente, palla da discoteca, targa dell'insegna).
- **Livello vivo**: una tela da `g.nuovaTela()`, cancellata e ridisegnata a ogni fotogramma con `g.anima` (tutto quello che si muove o cambia).

Utilità che servono (deterministiche, niente `Math.random` qui):

```js
const hash = (x, y) => { const n = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453; return n - Math.floor(n); };
```

### Livello fisso, in ordine

Tutto con `EscapeDemo.rett(ctx, colore, x, y, w, h)` e `riquadro(ctx, x, y, w, h, fondo, bordo = C.bordo)`; i colori sono `EscapeDemo.C`.

```js
// 0. fondo
rett(C.nero, 0, 0, 320, 180);

// 1. il privé: velluto a righe
rett(C.muro, 0, 16, 320, 64);
for (let x = 0; x < 320; x += 8) { rett(C.muroCasa, x + 2, 20, 3, 42); rett(C.violaScuro, x + 3, 20, 1, 42); }
// modanatura sotto il soffitto
rett(C.legnoScuro, 0, 16, 320, 2); rett(C.oroScuro, 0, 18, 320, 1); rett(C.bordo, 0, 19, 320, 1);
// boiserie
rett(C.bordo, 0, 61, 320, 1); rett(C.legnoChiaro, 0, 62, 320, 1); rett(C.legno, 0, 63, 320, 17);
for (let x = 2; x < 320; x += 20) {
  riquadro(x, 65, 17, 13, C.legno, C.legnoScuro);
  rett(C.legnoChiaro, x + 1, 66, 15, 1); rett(C.legnoChiaro, x + 1, 66, 1, 11);
}
// tappeto rosso (ci poggiano i piedi: BASE.sopra = 80)
rett(C.tappetoChiaro, 0, 80, 320, 1); rett(C.tappeto, 0, 81, 320, 3); rett(C.bordo, 0, 84, 320, 1);

// 2. il solaio fra i piani, con le teste delle travi
rett(C.tetto, 0, 85, 320, 5);
for (let x = 3; x < 320; x += 12) { riquadro(x, 85, 7, 5, C.legno); rett(C.legnoChiaro, x + 1, 86, 5, 1); }
rett(C.bordo, 0, 90, 320, 1);

// 3. il piano terra: mattoni 9×4 con la malta, sfalsati di mezzo mattone
rett(C.muro, 0, 91, 320, 55);
for (let r = 0; 91 + r * 5 < 143; r++) {
  const y = 91 + r * 5;
  for (let x = (r % 2) * -5; x < 320; x += 10) {
    const caldo = hash(x, y) < 0.18;
    rett(caldo ? C.muroCaldo : C.mattone, x + 1, y + 1, 9, 4);
    rett(caldo ? C.muroAcceso : C.muroCasa, x + 1, y + 1, 9, 1);   // luce sul bordo alto
  }
}
// battiscopa e pavimento a scacchi (ci poggiano i piedi: BASE.sotto = 146)
rett(C.bordo, 0, 142, 320, 1); rett(C.tetto, 0, 143, 320, 3);
rett(C.ferroChiaro, 0, 146, 320, 1);
for (let y = 147; y < 180; y += 3)
  for (let x = 0; x < 320; x += 8) rett(((x / 8 + (y - 147) / 3) % 2) ? C.pavimento : C.pavimento2, x, y, 8, 3);
// alone caldo delle torce, rotondo a retino (centri (8,104) e (311,104), raggio 16)
for (const tx of [8, 311])
  for (let y = 88; y <= 120; y++) for (let x = tx - 16; x <= tx + 16; x++) {
    const d = Math.hypot(x - tx, y - 104);
    if (d <= 16 && EscapeDemo.BAYER[y & 3][x & 3] / 16 < 0.55 * (1 - d / 16)) rett(C.muroAcceso, x, y, 1, 1);
  }

// 4. il vano: fondo scuro con i mattoni appena accennati, due guide
rett(C.tetto, 132, 16, 56, 140);
for (let r = 0; r < 24; r++) {
  const y = 16 + r * 6;
  for (let x = 132 + (r % 2) * 4; x < 188; x += 8) rett(C.tettoChiaro, x, y, 7, 1);
}
rett(C.ferro, 136, 20, 2, 136); rett(C.ferroChiaro, 136, 20, 1, 136);
rett(C.ferro, 182, 20, 2, 136); rett(C.ferroChiaro, 182, 20, 1, 136);
rett(C.ferro, 132, 16, 56, 2); rett(C.bordo, 132, 18, 56, 1);          // trave della puleggia

// 5. i pilastri di ferro con i ribattini (disegnati dopo il vano: coprono le sbavature dei mattoni)
for (const px of [124, 188]) {
  rett(C.ferro, px, 16, 8, 140); rett(C.ferroChiaro, px, 16, 1, 140); rett(C.bordo, px + 7, 16, 1, 140);
  for (let y = 22; y < 154; y += 8) {
    rett(C.pietra, px + 2, y, 1, 1); rett(C.pietra, px + 5, y, 1, 1);
    rett(C.bordo, px + 2, y + 1, 1, 1); rett(C.bordo, px + 5, y + 1, 1, 1);
  }
}
// pulsantiere d'ottone sul pilastro sinistro, una per piano (decorative)
for (const y of [64, 128]) {
  riquadro(125, y, 6, 9, C.oroScuro); rett(C.oro, 126, y + 1, 4, 1);
  rett(C.tappetoChiaro, 127, y + 2, 2, 2); rett(C.ferroChiaro, 127, y + 5, 2, 2);
}

// 6. decorazioni
rett(C.ferroChiaro, 92, 16, 1, 4);                       // catenella della palla
sprite(PALLA, { k: C.bordo, s: C.pietraChiara, S: C.pietra, f: C.ferroChiaro }, 86, 20);
riquadro(223, 20, 68, 21, C.tetto); rett(C.tettoChiaro, 224, 21, 66, 1);   // targa dell'insegna
for (const [vx, vy] of [[225, 22], [288, 22], [225, 38], [288, 38]]) rett(C.ferroChiaro, vx, vy, 1, 1);
riquadro(34, 95, 49, 9, C.legno); rett(C.legnoChiaro, 35, 96, 47, 1);      // cartello PIANO TERRA
testo("PIANO TERRA", 58, 97, { piccolo: true, colore: C.pietraChiara, ombra: C.legnoScuro, allinea: "centro" });
riquadro(244, 95, 37, 9, C.legno); rett(C.legnoChiaro, 245, 96, 35, 1);    // cartello ↑ PRIVE
sprite(FRECCIA, { "#": C.oro }, 248, 97);
testo("PRIVE", 256, 97, { piccolo: true, colore: C.pietraChiara, ombra: C.legnoScuro });
sprite(RAGNATELA, { "#": C.pietra }, 114, 91);                    // angolo col pilastro sinistro
sprite(RAGNATELA, { "#": C.pietra }, 196, 91, { specchia: true }); // angolo col pilastro destro
for (const tx of [6, 309]) sprite(TORCIA, { k: C.bordo, f: C.ferro, F: C.ferroChiaro, l: C.legno, L: C.legnoChiaro }, tx, 108);
```

(Qui `rett(colore, …)`, `sprite(righe, colori, x, y)` e `testo(…)` sono abbreviazioni di `EscapeDemo.rett(ctx, colore, …)` ecc.)

### Livello vivo, in ordine a ogni fotogramma

`k = g.fotogramma` (8 al secondo). Con `g.riduciMovimento`: `k` fermo a 0 per tutto quello che è decorativo.

1. **Luci della festa** (solo dopo la vittoria e nel già risolto; per prime, così stanno sotto insegna e targa): 16 puntini 2×2 sul muro del privé. Per `j` da 0 a 15: `x = 6 + ((j * 37 + k * 2) % 300)`, `y = 22 + ((j * 11) % 38)`; saltalo se `120 ≤ x ≤ 199` (il vano); colore `[C.giallo, C.acqua, C.rosa, C.lilla][(j + Math.floor(k / 4)) % 4]`.
2. **Insegna al neon** `PRIVE`: le lettere una per una con `testo(lettera, 229 + 12 * j, 23, { scala: 2, colore: C.rosa, ombra: C.tappeto })`, `j` da 0 a 4. La `V` (`j = 3`) sfarfalla: è spenta (`colore: C.muroAcceso, ombra: null`) quando `k % 37` vale 0, 1 o 5. Dopo la vittoria e con `riduciMovimento`: sempre accesa.
3. **Luccichio della palla**: una crocetta bianca (`rett(C.bianco, x, y − 1, 1, 3)` e `rett(C.bianco, x − 1, y, 3, 1)`) in una di quattro posizioni, che cambia ogni 2 fotogrammi: `[[89, 23], [94, 22], [95, 27], [90, 28]][Math.floor(k / 2) % 4]`.
4. **Fiamme delle torce**: `FIAMME[[0, 1, 0, 2][(k + sfaso) % 4]]` in `(6, 101)` con `sfaso = 0` e in `(309, 101)` con `sfaso = 2`; colori `{ o: C.brace, y: C.fiamma, Y: C.fiammaChiara, w: C.luna }`.
5. **Targa CORSE**: `riquadro(6, 22, 55, 13, C.legnoScuro)`, `rett(C.oroScuro, 7, 23, 53, 1)`, `testo("CORSE " + corse, 33, 25, { colore: C.oro, ombra: C.bordo, allinea: "centro" })`.
6. **Puleggia**: `PULEGGIA[f]` in `(154, 19)`, colori `{ k: C.bordo, F: C.ferroChiaro, f: C.ferro, p: C.pietra }`; `f = 0` da ferma, mentre la cabina viaggia alterna 0 e 1 ogni 60 ms.
7. **Cavi**: `rett(C.ferroChiaro, 157, 30, 1, y0 − 33)` e lo stesso a `x = 162`, con `y0` la y attuale del tetto della cabina (arrivano alla staffa).
8. **Cabina** in `(133, y0)`, 54×42 (vedi «La cabina»), con i passeggeri dentro.
9. **Mostri sui piani** (e quelli che stanno camminando fra piano e cabina), da sinistra a destra.
10. **Cancelletti** dei due piani (vedi «I cancelletti»): davanti alla cabina e ai mostri.
11. **Travi coi lampioncini**: `trave(32, …, "P")` e `trave(98, …, "T")` (vedi sotto): stanno davanti ai cavi e alla staffa.
12. **Effetti**: contorno rosso, osso che vola (vedi «Animazioni»).

### La cabina

`y0` = tetto (42 di sopra, 108 di sotto); i passeggeri poggiano su `y0 + 38`.

```js
riquadro(154, y0 - 3, 12, 3, C.ferro);                                   // staffa dei cavi
rett(C.bordo, 133, y0, 54, 1); rett(C.oro, 134, y0 + 1, 52, 1);          // tetto d'ottone
rett(C.oroScuro, 134, y0 + 2, 52, 1); rett(C.bordo, 133, y0 + 3, 54, 1);
rett(C.bordo, 133, y0 + 4, 1, 34); rett(C.oro, 134, y0 + 4, 1, 34); rett(C.oroScuro, 135, y0 + 4, 1, 34);       // fianco sinistro (in luce)
rett(C.oroScuro, 184, y0 + 4, 1, 34); rett(C.oroScuro, 185, y0 + 4, 1, 34); rett(C.bordo, 186, y0 + 4, 1, 34); // fianco destro
rett(C.legno, 136, y0 + 4, 48, 34);                                       // parete di fondo a pannelli
EscapeDemo.retino(ctx, C.legno, C.legnoChiaro, 136, y0 + 4, 48, 12, 0.5); // la luce della lampada in alto
for (let x = 143; x < 184; x += 8) rett(C.legnoScuro, x, y0 + 4, 1, 34);
rett(C.legnoLuce, 136, y0 + 4, 48, 1);
riquadro(150, y0 + 5, 21, 7, C.legnoScuro);                               // targhetta
testo("MAX 3", 160, y0 + 6, { piccolo: true, colore: targaRossa ? C.tappetoChiaro : C.oro, ombra: null, allinea: "centro" });
rett(C.oro, 133, y0 + 38, 54, 1); rett(C.legnoScuro, 133, y0 + 39, 54, 2); rett(C.bordo, 133, y0 + 41, 54, 1); // pavimento
```

`targaRossa` è vera per 375 ms dopo un rifiuto «piena» o «vuota». Poi i passeggeri ai loro posti `POSTI[posto]` con base `y0 + 38` (scheletri specchiati, zombie no). Il cappello da festa può coprire un pezzo della targhetta: va bene.

### I cancelletti

Uno per piano, davanti al vano: da `x = 132` a `187`, da `y = cabY(piano)` per 38 righe (42…79 di sopra, 108…145 di sotto). Quando la cabina è ferma a quel piano è **aperto**, altrimenti **chiuso**.

- **Chiuso**: due binari in alto (`C.ferroChiaro` alla riga 0, `C.ferro` alla 1) e in basso (`C.ferroChiaro` alla riga 36, `C.ferro` alla 37) per tutta la larghezza; fra i binari (righe 2…35) il traliccio a pantografo, ripetendo questa piastrella 6×6 dalla colonna `x − 132` e dalla riga `j − 2`:

  ```
  #.....
  ##...#
  #.#.#.
  #..#..
  #.#.#.
  ##...#
  ```

  `#` in colonna 0 (la sbarra verticale) = `C.ferroChiaro`; gli altri `#` = `C.ferro`. Conviene disegnarlo una volta su una tela fuori schermo 56×38 e copiarlo a 1:1 con `drawImage` (copiare pezzi a misura vera va bene; vietato solo ridimensionare).
- **Aperto**: ripiegato ai lati, tre righe verticali per parte alte 38: `C.ferroChiaro` a `x` 132, 134, 185, 187 e `C.ferro` a 133 e 186.
- **Mentre si apre o si chiude**: il traliccio chiuso, tagliato a una larghezza `w` da ciascun lato (da 132 a `132 + w − 1` e da `188 − w` a 187, binari compresi). Chiudere: `w` = 3 (aperto), 10, 19, 28 (chiuso), un passo ogni 40 ms; aprire al contrario.

### Le travi coi lampioncini

```js
function trave(y, acceso, lettera) {   // y = 32 di sopra ("P"), 98 di sotto ("T")
  riquadro(124, y, 72, 9, C.legno);
  rett(C.legnoLuce, 125, y + 1, 70, 1); rett(C.oroScuro, 125, y + 7, 70, 1);
  riquadro(154, y + 1, 13, 7, acceso ? C.giallo : C.ferro);
  testo(lettera, 160, y + 2, { piccolo: true, colore: acceso ? C.brace : C.ferroChiaro, ombra: null, allinea: "centro" });
}
```

`acceso` = la cabina è ferma a quel piano (durante il viaggio sono spenti tutti e due).

### I mostri

Copiati da `MOSTRI` in `../mappa/mappa.js`, così sono uguali in tutto il gioco. Guardano a sinistra; gli **scheletri vanno disegnati specchiati** (`specchia: true`), sia sul piano sia in cabina.

Colori comuni (tavolozza dei mostri della mappa: sono fuori dalla paletta `C`, ma sono gli stessi dei mostri di `mappa.js`, quindi vanno bene):

```js
const M = { k: C.bordo, n: "#0c0812", w: "#e8e4f0", W: "#a9a4bc",
            z: "#7a9a6a", Z: "#4a6a44", p: "#4a3a26", P: "#2a1a12", r: C.tappeto };
```

**Scheletro** (corpo 14×17 + gambe 14×6):

```js
const SCHELETRO = [
  "....kkkkkk....",
  "...kwwwwwwk...",
  "..kwwwwwwWWk..",
  "..knnwwnnwWk..",
  "..knnwwnnwWk..",
  "..kwwwnwwwWk..",
  "...kwwwwwWk...",
  "...kwkwkwk....",
  "....kkkkk.....",
  ".....kwk......",
  "..kkwwwwwkk...",
  ".kwkwkwkwkwk..",
  ".kwwwwwwwwwk..",
  ".kWkwwwwwkWk..",
  "..kkwkwkwkk...",
  "....kwwwk.....",
  "...kwwwwwk....",
];
const GAMBE_S = [
  "...kwk.kwk....",
  "...kwk.kwk....",
  "...kwk.kwk....",
  "...kwk.kwk....",
  "..kwwk.kwwk...",
  "..kkkk.kkkk...",
];
```

**Zombie** (corpo 16×18 + gambe 16×6; `c`/`C` sono la camicia, chiara e scura):

```js
const ZOMBIE = [
  "......kkkkk.....",
  ".....kzzzZZk....",
  "....kzzrzZZZk...",
  "....kzzzzzZZk...",
  "...kwnzzzzZZk...",
  "...kzzzzzzZZk...",
  "...kkzzzzZZZk...",
  "....knnnzZZk....",
  "....kwkwzZZk....",
  ".....kkzZZkk....",
  "...kkcccccCCk...",
  "..kccccrcccCCk..",
  ".kzkcccccccCCk..",
  ".kzkcckccccCCk..",
  "kzzkccccccCCCk..",
  "kzZkkcccCcCCk...",
  "kzzk.kcCkCckk...",
  ".kk..kppppPPk...",
];
const GAMBE_Z = [
  ".....kppPkpPk...",
  ".....kppPkpPk...",
  ".....kpPPkPPk...",
  ".....kZzkkzZk...",
  "....kzZzk.kzZk..",
  "....kkkkk.kkkk..",
];
const COLORI_CAMICIE = {      // nome della variante → [c, C]
  grigia:  ["#6a6a8a", "#45435f"],   // quella dello zombie della mappa
  viola:   [C.viola, C.violaScuro],
  arancio: [C.brace, C.legnoChiaro],
  blu:     [C.notteChiara, C.notte],
  senape:  [C.oroScuro, C.legno],
};
```

**Come si disegna un mostro** con centro `cx` e base `base`:

- `w` = larghezza del corpo (14 o 16), `x = Math.round(cx − w / 2)`;
- gambe in `(x, base − 6)`;
- corpo in `(x + dx, base − 6 − righeCorpo + dy)`: il busto si abbassa di `dy` pixel sopra le gambe (respiro);
- con `specchia` (scheletri) lo sprite è girato e l'eventuale `dx` cambia segno.

Animazioni continue, a 8 fps, sfasate: `fase = (k + 5 * i + (zombie ? 3 : 0)) % 24`, con `i` l'indice del mostro.

- **respiro**: `dy = Math.floor(fase / 6) % 2`;
- **zombie che ciondola**: `dx = −1` quando `Math.floor(fase / 4) % 3 === 1`;
- **zombie che sbatte le palpebre**: quando `fase === 0`, nella riga 4 del corpo le colonne 4 e 5 diventano `z`.

Con `riduciMovimento`: `dy = 0`, `dx = 0`, niente palpebre.

**Accessori degli scheletri.** Si disegnano dopo il corpo, con lo stesso `dy`. `(ax, ay)` è l'angolo dell'accessorio rispetto all'angolo del corpo **non specchiato**; siccome gli scheletri sono specchiati, l'accessorio va disegnato specchiato in `x + (14 − ax − larghezza)`, `y = cimaCorpo + ay`.

```js
const SPRITE_ACCESSORI = {    // nome della variante → sprite
  cilindro: { ax: 3, ay: -5, colori: { k: C.bordo, f: C.ferro, F: C.ferroChiaro, r: C.tappetoChiaro }, righe: [
    "..kkkk..",
    ".kfFFfk.",
    ".kfFFfk.",
    ".krrrrk.",
    "kkkkkkkk",
  ] },
  festa: { ax: 5, ay: -7, colori: { k: C.bordo, y: C.giallo, a: C.acqua, b: C.rosa }, righe: [
    "..y..",
    "..k..",
    ".kak.",
    ".kbk.",
    "kaaak",
    "kbbbk",
    "kkkkk",
  ] },
  fiore: { ax: 8, ay: -2, colori: { k: C.bordo, p: C.rosa, y: C.giallo }, righe: [
    ".kpk.",
    "kpypk",
    ".kpk.",
  ] },
  papillon: { ax: 3, ay: 9, colori: { k: C.bordo, r: C.tappetoChiaro }, righe: [
    "kk...kk",
    "krrkrrk",
    "kk...kk",
  ] },
  occhiali: { ax: 2, ay: 3, colori: { k: C.bordo, n: C.violaScuro, g: C.lilla }, righe: [
    "kgnkkgnk",
    ".nn..nn.",
  ] },
};
```

Le camicie degli zombie sostituiscono `c` e `C` nei colori dello zombie: lo zombie `z<i>` usa `COLORI_CAMICIE[variante.camicie[i]]`; lo scheletro `s<i>` porta `SPRITE_ACCESSORI[variante.accessori[i]]`.

### Sprite della scena

```js
const PALLA = [            // 12×12, palla da discoteca
  "....kkkk....",
  "..kkSsSskk..",
  ".kssSsSsSSk.",
  ".ksSsSsSsSk.",
  "kSsSsSsSsSSk",
  "ksSsSsSsSsSk",
  "kSsSsSsSsSfk",
  "ksSsSsSsSfSk",
  ".kSsSsSsfSk.",
  ".kSSsSsSfSk.",
  "..kkSfSfkk..",
  "....kkkk....",
];
const PULEGGIA = [         // 12×12, due fotogrammi (raggi a croce e a ics)
  [
    "....kkkk....",
    "..kkFFFFkk..",
    ".kFFkkkkFfk.",
    ".kFk.kk.kfk.",
    "kFk..kk..kfk",
    "kFkkkppkkkfk",
    "kFkkkppkkkfk",
    "kFk..kk..kfk",
    ".kfk.kk.kfk.",
    ".kffkkkkffk.",
    "..kkffffkk..",
    "....kkkk....",
  ],
  [
    "....kkkk....",
    "..kkFFFFkk..",
    ".kFFkkkkFfk.",
    ".kFk....kfk.",
    "kFk.k..k.kfk",
    "kFk..pp..kfk",
    "kFk..pp..kfk",
    "kFk.k..k.kfk",
    ".kfk....kfk.",
    ".kffkkkkffk.",
    "..kkffffkk..",
    "....kkkk....",
  ],
];
const TORCIA = [           // 5×10, il supporto (la fiamma sta sopra, a y − 7)
  "kkkkk",
  "kFffk",
  ".kfk.",
  ".klk.",
  ".klk.",
  ".kLk.",
  "kkFkk",
  "kFfFk",
  ".kfk.",
  "..k..",
];
const FIAMME = [           // 5×7, tre fotogrammi
  ["..o..", "..y..", ".oyo.", ".yYy.", "oyYyo", "oYwYo", ".oyo."],
  ["...o.", "..yo.", ".oy..", ".yYyo", "oyYyo", "oYwYo", ".oyo."],
  [".o...", ".oy..", "..yo.", ".yYy.", "oyYYo", "oYwYo", ".oyo."],
];
const FRECCIA = ["..#..", ".###.", "#####", "..#..", "..#.."];   // 5×5
const RAGNATELA = [        // 10×10, angolo in alto a destra
  "##########",
  ".#...#..##",
  "..#..#.#.#",
  "..##.###.#",
  "...#.#.###",
  "....##..##",
  ".....#.#.#",
  "......##.#",
  ".......###",
  "........##",
];
const MUCCHIO = [          // 16×9, lo scheletro derubato: teschio su un osso (colori M)
  ".....kkkkk......",
  "....kwwwwwk.....",
  "...kwnnwnnWk....",
  "...kwwwnwwWk....",
  "..kkkwkwkWkk.kk.",
  ".kwwkkkkkkkwkwwk",
  "kwwwwwwwwwwwwWWk",
  ".kwWkkkkkkkkWWk.",
  "..kk........kk..",
];
const OSSO = [             // 9×5, l'osso che vola (colori M)
  ".kk...kk.",
  "kwwk.kwwk",
  ".kwwwwwk.",
  "kwWk.kWWk",
  ".kk...kk.",
];
```

### Stati visivi

- **Normale**: i mostri respirano ai loro posti; la cabina ferma col suo cancelletto aperto e il lampioncino acceso; l'altro cancelletto chiuso.
- **In cabina**: i passeggeri stanno nella cabina illuminata (sono loro i «selezionati»).
- **Rifiuto** (piena, vuota): la scritta `MAX 3` diventa rossa per 375 ms; nel caso «piena» il mostro toccato scuote la testa (vedi sotto).
- **Altro piano**: il mostro toccato scuote la testa: `dx` alterna −1, +1, −1, +1 ogni 60 ms (250 ms in tutto), poi torna fermo.
- **Errore**: la rapina (sotto).
- **Risolto**: tutti al privé, insegna fissa, luci della festa, mostri che ballano.

### Animazioni (durate esatte)

Lo stato logico cambia **subito**; le animazioni vengono dopo. Una mossa nuova che arriva durante un'animazione (dall'aggancio o da Ricomincia) la interrompe: il disegno salta allo stato attuale e, se serve, parte l'animazione nuova. Tutte le posizioni vanno arrotondate a pixel interi; per il viaggio usa `e(t) = 3t² − 2t³`.

**Salire / scendere dalla cabina**: il mostro scivola in orizzontale dal suo posto sul piano al suo posto in cabina (o al contrario) in **180 ms**. Non blocca niente.

**Corsa riuscita** (810 ms, `occupato` vero per tutto il tempo):

| da | a | cosa |
|---|---|---|
| 0 | 120 ms | il cancelletto del piano di partenza si chiude |
| 120 | 470 ms | la cabina viaggia (66 pixel) con i passeggeri; la puleggia gira; i lampioncini spenti |
| 470 | 590 ms | il cancelletto del piano d'arrivo si apre |
| 590 | 810 ms | i passeggeri scendono: scivolano dal posto in cabina al loro posto sul piano |

**Errore: la rapina** (1930 ms, `occupato` vero per tutto il tempo):

| da | a | cosa |
|---|---|---|
| 0 | 590 ms | come la corsa, fino al cancelletto aperto (i passeggeri restano in cabina) |
| 590 | 1340 ms | **la rapina** nel posto dell'errore (sotto) |
| 1340 | 1930 ms | la cabina torna indietro: cancelletto chiuso (120), viaggio (350), cancelletto aperto (120); i passeggeri restano a bordo |

Durante la rapina, nel posto dell'errore:

- un **contorno rosso** di 2 pixel in `C.tappetoChiaro` che lampeggia (acceso 125 ms, spento 125 ms, tre volte):
  - `"sopra"`: rettangolo da (4, 20) a (315, 83);
  - `"sotto"`: rettangolo da (4, 91) a (315, 152);
  - `"cabina"`: rettangolo da (131, y0 − 2) a (188, y0 + 43);
- **ogni scheletro** di quel posto (compresi i passeggeri, se il posto è il piano d'arrivo o la cabina) è disegnato come `MUCCHIO` in `(cx − 8, base − 9)`;
- **un osso vola** dal primo mucchio verso lo zombie più vicino dello stesso posto: `OSSO` da `(cxMucchio − 4, base − 14)` a `(cxZombie − 4, baseZombie − 20)` in linea retta in 375 ms, poi sparisce;
- gli zombie di quel posto **esultano**: saltellano di 1 pixel (su a fotogrammi alterni).

A 1340 ms gli scheletri si ricompongono.

**Vittoria**: la corsa normale (810 ms), poi la festa che non finisce più: insegna fissa, luci della festa, e i mostri del privé che ballano (`base − 1` a fotogrammi alterni: `(k + i) % 2` per gli scheletri, `(k + i + 1) % 2` per gli zombie).

**Con `g.riduciMovimento`**: niente viaggi né scivolate (si salta allo stato finale), niente animazioni continue. L'errore mostra solo per 750 ms il contorno rosso fisso e i mucchi nel posto dell'errore, senza osso né viaggio (la cabina resta al piano di partenza); `occupato` è vero per quei 750 ms.

## 6. Aggancio per le prove

```js
g.espone({ gioca, statoGioco, posizione, occupato });
```

### `gioca(mossa)`

Usa **le stesse funzioni** dei tocchi e dei bottoni (e quindi aggiorna anche fumetto e animazioni). Non è mai bloccata da `occupato`.

| mossa | cosa fa |
|---|---|
| `{ sali: "s0" }` … `{ sali: "z4" }` | sali quel mostro |
| `{ sali: "s" }` / `{ sali: "z" }` | sali lo scheletro (zombie) con l'indice più basso fra quelli fuori dalla cabina al piano della cabina; se non ce n'è → `{ valida: false, motivo: "nessuno" }` |
| `{ scendi: "s0" }` … | scendi quel passeggero |
| `{ scendi: "s" }` / `{ scendi: "z" }` | scendi l'ultimo salito di quel tipo; se non ce n'è → `"nessuno"` |
| `{ parti: true }` | Parti, come il bottone |
| `{ corsa: { s: 1, z: 1 } }` | una corsa con esattamente quel carico: prima controlla, poi fa scendere tutti i passeggeri, fa salire con `sali("s")` e `sali("z")` gli scheletri e gli zombie che servono, e chiama Parti |
| `{ ricomincia: true }` | Ricomincia, come il bottone |
| altro | `{ valida: false, motivo: "mossa" }` |

Controlli di `corsa`, in quest'ordine e **senza toccare lo stato** se falliscono: `s` e `z` interi ≥ 0, altrimenti `"mossa"`; `s + z === 0` → `"vuota"`; `s + z > capienza` → `"piena"`; al piano della cabina (contando anche chi è già a bordo) non ci sono abbastanza scheletri o zombie → `"nessuno"`. Se la corsa finisce in errore, lo stato resta quello con il carico a bordo.

**Esiti** (esattamente questi campi):

| caso | esito |
|---|---|
| sali/scendi riusciti | `{ ok: true, cabina: { s, z } }` (i passeggeri dopo la mossa) |
| corsa riuscita | `{ ok: true, corse, piano }` (`piano` = dove è arrivata) |
| ultima corsa | `{ risolto: true, corse }` |
| corsa fuori regola | `{ errore: true, dove, motivo }` (`dove`: `"cabina"`, `"sotto"` o `"sopra"`; `motivo` = il testo di `g.errore`) |
| mossa rifiutata | `{ valida: false, motivo }` (`"vuota"`, `"piena"`, `"nessuno"`, `"altro piano"`, `"a bordo"`, `"non a bordo"`, `"mossa"`) |
| ricomincia | `{ ok: true }` |

### `statoGioco()`

```json
{
  "piano": "sotto",
  "sotto": { "s": 5, "z": 3 },
  "sopra": { "s": 0, "z": 0 },
  "cabina": { "s": 0, "z": 2 },
  "aBordo": ["z0", "z1"],
  "dove": { "s0": "sotto", "s1": "sotto", "s2": "sotto", "s3": "sotto", "s4": "sotto",
            "z0": "cabina", "z1": "cabina", "z2": "sotto", "z3": "sotto", "z4": "sotto" },
  "corse": 0,
  "capienza": 3,
  "risolto": false
}
```

`sotto` e `sopra` contano solo chi sta **fuori** dalla cabina; `cabina` conta i passeggeri (la cabina è ferma a `piano`).

### Facoltative (la verifica le usa: vanno esposte)

- `posizione(id)` → `{ x, y }` interi in pixel della scena, il punto da toccare per quel mostro **dove sta nello stato logico**: sul piano `{ x: SLOT_S[i] o SLOT_Z[i], y: BASE[piano] − 12 }`, in cabina `{ x: POSTI[posto], y: BASE[stato.piano] − 12 }`. Id inesistente → `null`.
- `occupato()` → `true` mentre è in corso l'animazione di una corsa o di un errore (quando i tocchi e Parti sono ignorati), altrimenti `false`.

## 7. Criteri di accettazione

Guardando le foto e giocando:

1. La scena sembra un pezzo di un gioco curato: due piani ben distinti (privé viola e caldo sopra, mattoni e torce sotto), il vano di ferro al centro con la puleggia, la cabina d'ottone che spicca, niente zone vuote o colori fuori posto.
2. A colpo d'occhio si contano scheletri e zombie su ogni piano e in cabina; scheletri sempre a sinistra, zombie sempre a destra; si capisce dove sta la cabina (cancelletto aperto, lampioncino acceso).
3. Ogni scheletro ha il suo accessorio e ogni zombie la sua camicia, uguali per lo stesso seme e diversi fra semi.
4. Niente di importante sotto le barre: i piedi del piano terra a y 145, la targa CORSE e l'insegna sotto y 16; il fumetto sta su una riga.
5. Toccare un mostro al piano della cabina lo fa entrare; toccarlo in cabina lo fa uscire; il quarto viene rifiutato con la targhetta rossa; un mostro dell'altro piano scuote la testa.
6. Parti con un carico buono: cancelletto che si chiude, cabina che viaggia con la puleggia che gira, cancelletto che si apre, passeggeri che escono ai loro posti; `CORSE` cresce.
7. Parti con un carico sbagliato: avviso del kit con il testo giusto, contorno rosso nel posto giusto, scheletri a mucchietto, osso che vola, cabina che torna indietro con gli stessi passeggeri; `CORSE` non cresce; le dorate calano ogni due errori.
8. Ricomincia rimette tutti di sotto senza errori.
9. All'undicesima corsa giusta: festa al privé (luci, insegna fissa, balli), poi la carta con il riepilogo; ricaricando, la scena resta in festa e niente si muove più.
10. Con `prefers-reduced-motion` niente animazioni continue e nessun mostro lasciato a metà strada.
11. `node demo/comune/prova.mjs ascensore-prive` finisce con «TUTTO OK».
