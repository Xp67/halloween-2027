# L'armadio a combinazione — istruzioni per il costruttore

Rompicapo del **Deposito** (`scheda.js`: 4 dorate, una in meno ogni 2 errori). Valgono le regole comuni (`../REGOLE_COMUNI.md`) e il kit (`../comune/kit.js`); qui c'è solo quello che è specifico di questa demo. Tutte le coordinate sono in pixel della scena 320×180, con `x` e `y` dell'angolo in alto a sinistra, salvo dove è scritto «centro».

`index.html` è la copia di `../_esempio/index.html` con `<title>L'armadio a combinazione</title>`. Niente `gioco.css`.

---

## 1. In breve

Nel Deposito c'è l'armadio dei costumi, chiuso da un grosso lucchetto a tre rotelle. Sull'anta sinistra sono incisi cinque tentativi con la risposta del lucchetto («2 giuste al posto», «nessuna giusta»…). Il giocatore gira le rotelle con le frecce (e, se vuole, si segna le cifre sulla lavagnetta degli appunti), poi preme **Prova**. Con la combinazione giusta il lucchetto scatta, la ferramenta cade, le ante si spalancano e dentro, fra i costumi, c'è davvero uno scheletro che saluta. Ogni combinazione sbagliata è un errore.

---

## 2. Variante

La variante è una combinazione di tre cifre diverse e cinque tentativi con la risposta vera del lucchetto, scelti in modo che **una sola** combinazione sia compatibile con tutti e cinque e che **ogni tentativo serva**. È il generatore della scheda, provato su 1000 semi: riesce sempre, in media al 29° giro (al massimo 196), in 3 ms (al massimo 18).

### Il generatore (da copiare così com'è)

```js
// Le 720 combinazioni con tre cifre diverse, in ordine: 012, 013, …, 987.
const CODICI = [];
for (let a = 0; a < 10; a++)
  for (let b = 0; b < 10; b++)
    for (let c = 0; c < 10; c++) if (a !== b && b !== c && a !== c) CODICI.push([a, b, c]);

/** Quello che il lucchetto risponde a un tentativo. */
function risposta(cifre, codice) {
  let alPosto = 0, fuoriPosto = 0;
  cifre.forEach((d, i) => {
    if (codice[i] === d) alPosto++;
    else if (codice.includes(d)) fuoriPosto++;
  });
  return { alPosto, fuoriPosto };
}

/** Le combinazioni che danno, a ogni tentativo, esattamente la risposta incisa. */
function compatibili(tentativi) {
  return CODICI.filter((c) => tentativi.every((t) => {
    const r = risposta(t.cifre, c);
    return r.alPosto === t.alPosto && r.fuoriPosto === t.fuoriPosto;
  }));
}

// Se in 50000 giri non ne esce una buona (non succede mai), si usa l'esempio della scheda.
const RISERVA = {
  codice: [3, 8, 9],
  tentativi: [
    { cifre: [2, 7, 4], alPosto: 0, fuoriPosto: 0 },
    { cifre: [1, 8, 9], alPosto: 2, fuoriPosto: 0 },
    { cifre: [9, 2, 7], alPosto: 0, fuoriPosto: 1 },
    { cifre: [6, 3, 4], alPosto: 0, fuoriPosto: 1 },
    { cifre: [0, 8, 5], alPosto: 1, fuoriPosto: 0 },
  ],
};

// In EscapeDemo.avvia: variante(rng) { ... }
function variante(rng) {
  for (let giro = 0; giro < 50000; giro++) {
    const codice = CODICI[Math.floor(rng() * CODICI.length)];
    const tentativi = [];
    while (tentativi.length < 5) {
      const cifre = CODICI[Math.floor(rng() * CODICI.length)];
      const r = risposta(cifre, codice);
      if (r.alPosto === 3) continue; // un tentativo non è mai la combinazione
      tentativi.push({ cifre: [...cifre], alPosto: r.alPosto, fuoriPosto: r.fuoriPosto });
    }
    // almeno un tentativo senza cifre giuste
    if (!tentativi.some((t) => t.alPosto + t.fuoriPosto === 0)) continue;
    // al massimo due tentativi con cifre al posto giusto
    if (tentativi.filter((t) => t.alPosto > 0).length > 2) continue;
    // una sola combinazione compatibile
    if (compatibili(tentativi).length !== 1) continue;
    // ogni tentativo serve: togliendone uno qualsiasi le combinazioni diventano più d'una
    if (!tentativi.every((_, i) => compatibili(tentativi.filter((__, j) => j !== i)).length > 1)) continue;
    return { codice: [...codice], tentativi };
  }
  return JSON.parse(JSON.stringify(RISERVA));
}
```

### Formato dell'oggetto `variante`

```js
{
  codice: [5, 8, 1],                                   // la combinazione (nel gioco vero resterà sul server)
  tentativi: [                                         // cinque, nell'ordine in cui si incidono dall'alto
    { cifre: [1, 2, 7], alPosto: 0, fuoriPosto: 1 },   // cifre: tre cifre diverse 0..9
    ...                                                // alPosto + fuoriPosto ≤ 3, alPosto < 3
  ]
}
```

Le risposte possibili sono 0/0, 1/0, 2/0, 0/1, 0/2, 0/3, 1/1, 1/2 (`alPosto/fuoriPosto`). Su 1000 semi escono solo 0/0, 0/1, 0/2, 1/0, 1/1 e 2/0 (1/1 in una variante su cinque), ma la demo deve saperle scrivere tutte (vedi §5.3).

### Esempi (con il codice qui sopra e il `rng` del kit)

| seme | tentativi (`cifre alPosto/fuoriPosto`) | combinazione |
|---|---|---|
| 1 | 287 0/1 · 874 0/1 · 310 0/1 · 907 0/0 · 854 0/2 | **538** |
| 12345 | 069 0/0 · 627 0/1 · 924 0/1 · 352 0/1 · 210 1/1 | **281** |
| 4242 | 127 0/1 · 068 0/1 · 290 0/0 · 369 0/0 · 784 1/0 | **581** |
| riserva | 274 0/0 · 189 2/0 · 927 0/1 · 634 0/1 · 085 1/0 | **389** |

Se con il seme 1 non esce 538, il generatore non è stato copiato alla lettera (conta anche l'ordine delle chiamate a `rng`).

---

## 3. Regole e mosse

### Lo stato (logica pura, separata dal disegno)

```js
{
  rotelle: [0, 0, 0],                    // le cifre che segnano le tre rotelle, da sinistra
  provate: [],                           // le combinazioni sbagliate già provate, come stringhe "127", in ordine
  appunti: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0], // la lavagnetta: per ogni cifra 0 = pulita, 1 = barrata, 2 = incorniciata
  aperto: false,                         // true quando il lucchetto si è aperto
}
```

All'inizio le rotelle segnano **000** (non è mai la combinazione, perché le cifre sono ripetute).

### Le mosse

Tutte passano da una funzione pura `applica(stato, mossa, codice) → { stato, esito }` che non disegna e non chiama il kit. La usano i tocchi, la tastiera, il bottone e `gioca` delle prove. Eccola, da copiare:

```js
const intera = (n, a, b) => Number.isInteger(n) && n >= a && n <= b;

function applica(stato, m, codice) {
  const s = { rotelle: [...stato.rotelle], provate: [...stato.provate], appunti: [...stato.appunti], aperto: stato.aperto };
  const no = (motivo) => ({ stato, esito: { valida: false, motivo } });
  if (!m || typeof m !== "object") return no("mossa sconosciuta");
  if (m.tipo === "ruota") {               // una tacca su o giù di una rotella
    if (!intera(m.rotella, 0, 2)) return no("rotella inesistente");
    if (m.verso !== 1 && m.verso !== -1) return no("verso non valido");
    s.rotelle[m.rotella] = (s.rotelle[m.rotella] + m.verso + 10) % 10;
    return { stato: s, esito: { ok: true, rotelle: [...s.rotelle] } };
  }
  if (m.tipo === "imposta") {             // tutte e tre le rotelle in un colpo (tastiera e prove)
    if (!Array.isArray(m.cifre) || m.cifre.length !== 3 || !m.cifre.every((d) => intera(d, 0, 9))) return no("cifre non valide");
    s.rotelle = [...m.cifre];
    return { stato: s, esito: { ok: true, rotelle: [...s.rotelle] } };
  }
  if (m.tipo === "segna") {               // un tocco sulla lavagnetta: pulita → barrata → incorniciata → pulita
    if (!intera(m.cifra, 0, 9)) return no("cifra non valida");
    s.appunti[m.cifra] = (s.appunti[m.cifra] + 1) % 3;
    return { stato: s, esito: { ok: true, cifra: m.cifra, segno: s.appunti[m.cifra] } };
  }
  if (m.tipo === "prova") {               // il bottone Prova
    const combo = s.rotelle.join("");
    if (new Set(s.rotelle).size < 3) return no("cifre ripetute");
    if (s.provate.includes(combo)) return no("già provata");
    if (combo === codice.join("")) { s.aperto = true; return { stato: s, esito: { risolto: true, combinazione: combo } }; }
    s.provate.push(combo);
    return { stato: s, esito: { errore: true, motivo: "combinazione sbagliata", provata: combo } };
  }
  return no("mossa sconosciuta");
}
```

### Cosa succede dopo ogni mossa (fuori da `applica`)

Una funzione `gioca(mossa)` chiama `applica`, sostituisce lo stato, salva la memoria e reagisce all'esito:

| Esito | Reazione | Fumetto (`g.messaggio`) |
|---|---|---|
| `ruota` o `imposta` ok | la rotella gira (§5.6); `imposta` cambia le cifre senza animazione | non cambia |
| `segna` ok | il segno sulla lavagnetta cambia subito | non cambia |
| `valida: false`, motivo `cifre ripetute` | «tonfo» del lucchetto e «?» sopra Zucco (§5.6); **non è un errore** | `Le tre cifre della combinazione sono tutte diverse.` |
| `valida: false`, motivo `già provata` | «tonfo» e «?» come sopra; **non è un errore** | `127 l'hai già provata: il lucchetto non si apre.` (con la combinazione al posto di 127) |
| `valida: false`, altri motivi | niente (succede solo dalle prove) | non cambia |
| `errore: true` | `g.errore("Combinazione sbagliata")`, poi la reazione d'errore (§5.6) | `127 non è la combinazione: il lucchetto resta chiuso.` |
| `risolto: true` | `g.risolto({ riepilogo, ritardo: 2000 })` e la sequenza della vittoria (§5.6) | `Clic! Il lucchetto si apre... e nell'armadio c'era uno scheletro.` |

`gioca` ritorna l'`esito` così com'è (è JSON).

**Conta come errore solo una combinazione di tre cifre diverse, mai provata prima, che non è quella giusta.** Le cifre ripetute e le combinazioni già provate vengono rifiutate senza errore: non sono tentativi nuovi. Girare le rotelle e scrivere appunti non sono mai errori.

**Limiti:** nessuno. Si può provare quante volte si vuole; il kit toglie una dorata ogni 2 errori, fino a un minimo di 1.

**Riepilogo** per `g.risolto`: `La combinazione era 581. Il tentativo 290 escludeva subito le cifre 2, 9 e 0.` — con la combinazione, e con il **primo** tentativo che ha risposta 0/0 e le sue tre cifre nell'ordine inciso.

### Memoria (resiste al ricaricamento)

Dopo ogni mossa accettata (esito `ok`, `errore` o `risolto`, cioè tutte tranne quelle con `valida: false`): `g.memoria.rotelle = stato.rotelle; g.memoria.provate = stato.provate; g.memoria.appunti = stato.appunti; g.salvaMemoria();`. All'avvio si riparte da `g.memoria` se i campi ci sono e sono validi (3 interi 0..9; stringhe di 3 cifre; 10 interi 0..2), altrimenti dallo stato iniziale. Così chi ricarica la pagina non ritrova pulite le combinazioni già provate (e non può farsi contare due volte la stessa).

### Già risolto (`g.giaRisolto`)

Si parte con `aperto: true` e la scena finale: ante aperte, niente ferramenta, scheletro che saluta (§5.6). Fumetto: `L'armadio è aperto: lo scheletro ti saluta.` Le mosse le blocca il kit.

---

## 4. Interfaccia

### Testo della carta iniziale

Si passa ad `avvia` come `testo` (le righe sono paragrafi):

```
L'armadio dei costumi ha un lucchetto a tre cifre, tutte diverse. Sull'anta qualcuno ha inciso cinque tentativi, con quello che il lucchetto aveva risposto.
«Al posto» vuol dire cifre giuste e al posto giusto; «fuori posto», cifre giuste ma al posto sbagliato.
Ogni combinazione sbagliata conta come errore. Sulla lavagnetta puoi segnarti le cifre: un tocco la barra, due la incorniciano, tre la puliscono.
```

### Fumetto all'inizio

`Gira le tre rotelle con le frecce, poi premi Prova.` (anche dopo un ricaricamento, se non è risolto).

### Bottoni

Uno solo: `g.bottone("Prova", () => gioca({ tipo: "prova" }), { id: "prova", forte: true })`.

### Tocchi (con `g.tocca`, solo sull'evento `"giu"`)

Le zone sono più grandi del disegno (§5.4 per le coordinate di `X0`, `Y0`):

| Zona | Rettangolo (x da…a escluso, y da…a escluso) | Mossa |
|---|---|---|
| rotella `i` (0, 1, 2), metà alta | x `X0+4+20i` … `X0+24+20i`, y 80 … 108 | `{ tipo: "ruota", rotella: i, verso: 1 }` |
| rotella `i`, metà bassa | x come sopra, y 108 … 138 | `{ tipo: "ruota", rotella: i, verso: -1 }` |
| lavagnetta, cifra `d` | x 266 … 287 se `d < 5`, 287 … 308 se `d ≥ 5`; y `72+14·(d%5)` … `86+14·(d%5)` | `{ tipo: "segna", cifra: d }` |

Con `X0 = 170` le zone delle rotelle sono x 174…194, 194…214, 214…234 (20×28 e 20×30), quelle della lavagnetta 21×14. Le zone delle rotelle sono fisse (non seguono la scossa del lucchetto).

### Tastiera (facoltativa, gradita)

← → scelgono la rotella (al primo uso compare la cornice bianca sulla finestrella della rotella scelta, §5.4); ↑ ↓ la girano (`ruota`); una cifra 0–9 la imposta e passa alla rotella dopo (`imposta` con le altre due invariate); Invio = Prova.

---

## 5. Grafica

`sfondo: "deposito"`, `velo: 0.5`. Colori: solo `EscapeDemo.C` (nessuna eccezione). Tutto a coordinate intere, con `rett`, `riquadro`, `sprite`, `testo` del kit.

### 5.1 Composizione

Lo sfondo ha a sinistra la rastrelliera con i teli (x 8…108), a destra lo scaffale (x 216…306), al centro il cono di luce della lampadina (x 160, y 26…33) e il pavimento da y 118.

- **Armadio** al centro, da x 60 a 259 e da y 18 a 150: copre il cono di luce; la lampadina si ridisegna davanti (§5.2).
- **Zucco** a sinistra, davanti ai teli: x 26…47, piedi a y 149.
- **Lavagnetta degli appunti** a destra, appoggiata allo scaffale: x 262…311, y 58…150, con il cappello da strega appeso all'angolo.
- **Ragno** che penzola dalla cornice dell'armadio, a sinistra (x 59…67).

Ordine di disegno, dal fondo: ombra a terra → armadio (cornice, corpo, zoccolo, piedi) → interno (solo se le ante sono aperte) → ante → tentativi incisi, targhetta e ferramenta del lucchetto (solo a ante chiuse) → lampadina → ragno → Zucco e i suoi segni → lavagnetta e cappello → pipistrello → ferramenta che cade e polvere (durante la vittoria).

L'effetto d'insieme (provato dal regista in un prototipo con queste stesse coordinate): un armadio di legno scuro che riempie il centro, i tentativi in giallo chiaro ben leggibili sull'anta sinistra, un grosso lucchetto d'ottone con tre finestrelle chiare sull'anta destra, la lavagnetta verde scuro a destra e Zucco piccolo a sinistra che guarda la scena.

A ogni fotogramma si cancella la tela (`g.ctx.clearRect(0, 0, 320, 180)`) e si ridisegna tutto in quest'ordine, leggendo solo lo stato e i tempi delle animazioni.

### 5.2 L'armadio e la lampadina

```js
const { C, rett, riquadro, sprite, testo, BAYER } = EscapeDemo;

/** Ombra a retino: solo i pixel del retino sotto la soglia, gli altri restano trasparenti. */
function ombraRetino(ctx, x, y, w, h, q, col = C.nero) {
  for (let j = 0; j < h; j++)
    for (let i = 0; i < w; i++) {
      const px = x + i, py = y + j;
      if (BAYER[py & 3][px & 3] / 16 < q) rett(ctx, col, px, py, 1, 1);
    }
}

function armadio(ctx) {
  ombraRetino(ctx, 58, 147, 206, 5, 0.55);                 // ombra sul pavimento
  // cornice in tre fasce
  riquadro(ctx, 60, 18, 200, 4, C.legnoChiaro);
  rett(ctx, C.legnoLuce, 61, 19, 198, 1);
  riquadro(ctx, 62, 21, 196, 7, C.legno);
  for (let x = 66; x < 254; x += 6) rett(ctx, C.legnoScuro, x, 23, 3, 3); // dentelli
  riquadro(ctx, 63, 27, 194, 4, C.legnoScuro);
  // corpo (si vede ai lati e nella fessura fra le ante)
  riquadro(ctx, 66, 30, 188, 110, C.legnoScuro);
  rett(ctx, C.legnoChiaro, 67, 31, 1, 108);
  // zoccolo e piedi
  riquadro(ctx, 64, 140, 192, 7, C.legno);
  rett(ctx, C.legnoChiaro, 65, 141, 190, 1);
  riquadro(ctx, 68, 146, 8, 5, C.legnoScuro);
  riquadro(ctx, 244, 146, 8, 5, C.legnoScuro);
}

/** La lampadina dello sfondo, ridisegnata davanti alla cornice. `fioca` = un fotogramma di sfarfallio. */
function lampadina(ctx, fioca) {
  rett(ctx, C.bordo, 160, 16, 1, 10);
  rett(ctx, C.bordo, 157, 25, 7, 10);
  rett(ctx, C.ferro, 158, 26, 5, 3);
  rett(ctx, fioca ? C.fiamma : C.fiammaChiara, 158, 29, 5, 5);
  rett(ctx, fioca ? C.fiammaChiara : C.luna, 159, 30, 2, 2);
}
```

**Le ante.** Due ante da 88 pixel: la sinistra da x 72 a 159 (cerniera a x 72), la destra da x 161 a 248 (cerniera a x 248); fra le due, a x 160, si vede il corpo scuro. Ogni anta ha quattro passi: 0 chiusa, 1–3 sempre più aperta (si stringe verso la cerniera e il bordo libero, più vicino a chi guarda, si allunga in alto e in basso).

```js
// xc = colonna della cerniera (72 sinistra, 248 destra), verso = +1 (sinistra) o -1 (destra), passo = 0..3.
function anta(ctx, xc, verso, passo) {
  const w = [88, 70, 52, 34][passo];
  const sx = verso > 0 ? xc : xc - w + 1;                  // la colonna più a sinistra sullo schermo
  for (let j = 0; j < w; j++) {                             // j = distanza dalla cerniera
    const x = verso > 0 ? xc + j : xc - j;
    const e = Math.floor((passo * j) / (w - 1));            // allungamento verso il bordo libero
    const y0 = 30 - e, y1 = 139 + e, h = y1 - y0 + 1;
    rett(ctx, C.bordo, x, y0, 1, h);
    if (j === 0 || j === w - 1) continue;
    const dx = x - sx;
    let fondo = passo >= 2 ? C.legnoScuro : C.legno;
    if (dx === 1) fondo = C.legnoChiaro;                    // costa illuminata a sinistra
    if (dx === w - 2) fondo = C.legnoScuro;                 // costa in ombra a destra
    if (passo > 0 && j >= w - 3) fondo = C.legnoLuce;       // lo spessore dell'anta aperta
    rett(ctx, fondo, x, y0 + 1, 1, h - 2);
    rett(ctx, C.legnoChiaro, x, y0 + 1, 1, 1);
    rett(ctx, C.legnoScuro, x, y1 - 1, 1, 1);
    if (passo <= 1 && dx >= 4 && dx <= w - 5) {             // il pannello incassato
      rett(ctx, C.legnoScuro, x, y0 + 4, 1, 1);
      rett(ctx, C.legnoLuce, x, y1 - 4, 1, 1);
      if (dx === 4) rett(ctx, C.legnoScuro, x, y0 + 4, 1, h - 8);
      if (dx === w - 5) rett(ctx, C.legnoLuce, x, y0 + 5, 1, h - 9);
    }
  }
}
// chiuse: anta(ctx, 72, +1, 0); anta(ctx, 248, -1, 0);
```

A ante chiuse il pannello incassato dell'anta sinistra va da x 76 a 155 e da y 34 a 135; quello della destra da x 165 a 244.

### 5.3 I tentativi incisi (anta sinistra)

Cinque righe, la `k`-esima (0…4) con l'angolo in alto a `yk = 41 + 19·k` (41, 60, 79, 98, 117):

- **le cifre** del tentativo, carattere 5×7: `testo(ctx, "127", 80, yk + 2, { colore: C.fiammaChiara, ombra: C.legnoScuro })` (x 80…96);
- **la risposta** su due righe, carattere 3×5 (`piccolo: true`), stessi colori: prima riga a `(101, yk)`, seconda a `(101, yk + 6)` (al massimo 49 pixel: finisce entro x 149);
- **un tratteggio** fra una riga e la successiva (solo per k = 0…3): trattini `rett(ctx, C.legnoScuro, x, yk + 15, 2, 1)` per x = 80, 84, …, 148.

Le due righe della risposta:

| `alPosto/fuoriPosto` | prima riga | seconda riga |
|---|---|---|
| 0/0 | `NESSUNA` | `GIUSTA` |
| 1/0 | `1 GIUSTA` | `AL POSTO` |
| 2/0 | `2 GIUSTE` | `AL POSTO` |
| 0/1 | `1 GIUSTA` | `FUORI POSTO` |
| 0/2 | `2 GIUSTE` | `FUORI POSTO` |
| 0/3 | `3 GIUSTE` | `FUORI POSTO` |
| 1/1 | `1 AL POSTO` | `1 FUORI POSTO` |
| 1/2 | `1 AL POSTO` | `2 FUORI POSTO` |

I tentativi si vedono solo a ante chiuse (passo 0).

**Targhetta** sull'anta destra: `riquadro(ctx, 185, 40, 39, 9, C.oroScuro)`, `rett(ctx, C.oro, 186, 41, 37, 1)`, `testo(ctx, "COSTUMI", 204, 42, { piccolo: true, colore: C.legnoScuro, ombra: null, allinea: "centro" })`, due viti `rett(ctx, C.giallo, 187, 44, 1, 1)` e `rett(ctx, C.giallo, 221, 44, 1, 1)`. Solo a ante chiuse.

### 5.4 La ferramenta e il lucchetto (anta destra)

Una bandella di ferro incernierata sull'anta sinistra attraversa la fessura; dall'anta destra spunta un occhiello in cui passa la gamba sinistra dell'arco del lucchetto; il corpo d'ottone pende sotto, con le tre rotelle.

Tutto il gruppo si disegna con uno spostamento `(dx, dy)` (scossa, tonfo, caduta) e con lo stato `scatto` (arco alzato dopo la vittoria). Il corpo ha l'angolo in alto a sinistra in `X0 = 170 + dx`, `Y0 = 84 + dy` e misura 68×50.

```js
function ferramenta(ctx, { dx = 0, dy = 0, scatto = false, errore = false, cifre, scelta = -1, anim }) {
  // cerniera e bandella
  riquadro(ctx, 153 + dx, 65 + dy, 5, 12, C.ferroChiaro);
  rett(ctx, C.pietra, 154 + dx, 66 + dy, 1, 10);
  riquadro(ctx, 157 + dx, 67 + dy, 37, 8, C.ferro);
  rett(ctx, C.ferroChiaro, 158 + dx, 68 + dy, 35, 1);
  rett(ctx, C.pietra, 161 + dx, 70 + dy, 2, 2);
  rett(ctx, C.pietra, 171 + dx, 70 + dy, 2, 2);
  // arco: aperto si alza di 6 e la gamba destra si allunga per restare nel corpo
  const ARCO_COLORI = { k: C.bordo, s: C.pietraChiara, p: C.pietra, f: C.ferroChiaro };
  sprite(ctx, ARCO, ARCO_COLORI, 182 + dx, 54 + dy - (scatto ? 6 : 0));
  if (scatto) sprite(ctx, ["kpfpk", "kpfpk", "kpfpk", "kpfpk", "kpfpk", "kpfpk"], ARCO_COLORI, 222 + dx, 78 + dy);
  // occhiello, davanti alla gamba sinistra
  riquadro(ctx, 178 + dx, 70 + dy, 13, 4, C.ferroChiaro);
  rett(ctx, C.pietra, 179 + dx, 71 + dy, 11, 1);
  // corpo d'ottone (angoli smussati: i quattro pixel d'angolo restano vuoti)
  const X = 170 + dx, Y = 84 + dy, bordo = errore ? C.tappetoChiaro : C.bordo;
  rett(ctx, bordo, X + 1, Y, 66, 50);
  rett(ctx, bordo, X, Y + 1, 68, 48);
  rett(ctx, C.oroScuro, X + 1, Y + 1, 66, 48);
  rett(ctx, C.oro, X + 2, Y + 2, 64, 2);                   // luce in alto
  rett(ctx, C.oro, X + 2, Y + 2, 2, 45);                   // luce a sinistra
  rett(ctx, C.giallo, X + 3, Y + 2, 10, 1);                // riflesso
  rett(ctx, C.brace, X + 2, Y + 46, 64, 2);                // ombra in basso
  rett(ctx, C.brace, X + 64, Y + 4, 2, 44);                // ombra a destra
  for (let i = 0; i < 3; i++) {
    const x0 = X + 6 + 20 * i;                             // colonna della rotella: x0 … x0+15
    // freccia su
    riquadro(ctx, x0 + 2, Y + 3, 12, 8, C.pietra);
    rett(ctx, C.pietraChiara, x0 + 3, Y + 4, 10, 1);
    sprite(ctx, ["..k..", ".kkk.", "kkkkk"], { k: C.bordo }, x0 + 5, Y + 6);
    // finestrella della rotella, 16×24 (cornice bianca se scelta da tastiera, verde dopo lo scatto)
    riquadro(ctx, x0, Y + 12, 16, 24, C.pietraChiara, scatto ? C.erbaChiara : i === scelta ? C.bianco : C.bordo);
    rett(ctx, C.ferroChiaro, x0 + 1, Y + 13, 14, 2);      // il tamburo: bande scure in alto e in basso
    rett(ctx, C.pietra, x0 + 1, Y + 15, 14, 2);
    rett(ctx, C.pietra, x0 + 1, Y + 31, 14, 2);
    rett(ctx, C.ferroChiaro, x0 + 1, Y + 33, 14, 2);
    cifraRotella(ctx, i, x0, Y, cifre[i], errore, anim);   // §5.6: la cifra (o due, mentre gira)
    rett(ctx, C.tappetoChiaro, x0 - 1, Y + 23, 1, 2);      // tacche rosse di lettura ai lati
    rett(ctx, C.tappetoChiaro, x0 + 16, Y + 23, 1, 2);
    // freccia giù
    riquadro(ctx, x0 + 2, Y + 37, 12, 8, C.pietra);
    rett(ctx, C.pietraChiara, x0 + 3, Y + 38, 10, 1);
    sprite(ctx, ["kkkkk", ".kkk.", "..k.."], { k: C.bordo }, x0 + 5, Y + 40);
  }
}
```

`cifraRotella` disegna la cifra ferma con `testo(ctx, String(cifra), x0 + 3, Y + 17, { scala: 2, colore: errore ? C.tappeto : C.bordo, ombra: null })` (10×14 pixel, centrata nella finestrella) oppure, se la rotella `i` sta girando, le due cifre che scorrono (§5.6). `anim` è lo stato delle animazioni delle rotelle (per ognuna: cifra vecchia, verso, istante d'inizio), tenuto fuori dallo stato del rompicapo.

Le frecce disegnate sono 12×8; le zone di tocco sono quelle di §4 (molto più grandi).

### 5.5 La lavagnetta, Zucco, il ragno e l'interno

**Lavagnetta degli appunti** (sempre visibile, anche a rompicapo risolto):

```js
function lavagnetta(ctx, appunti) {
  riquadro(ctx, 262, 58, 50, 89, C.legnoChiaro);
  rett(ctx, C.legnoLuce, 263, 59, 48, 1);
  riquadro(ctx, 265, 61, 44, 83, C.siepe);                  // la lavagna, verde scurissimo
  testo(ctx, "APPUNTI", 287, 64, { piccolo: true, colore: C.pietraChiara, ombra: null, allinea: "centro" });
  for (let x = 268; x < 306; x += 2) rett(ctx, C.pietra, x, 70, 1, 1); // riga di gesso puntinata
  for (let d = 0; d < 10; d++) {
    const cx = d < 5 ? 266 : 287, cy = 72 + 14 * (d % 5); // la cella 21×14 della cifra
    const x = cx + 8, y = cy + 3, segno = appunti[d];       // la cifra 5×7
    testo(ctx, String(d), x, y, { colore: segno === 1 ? C.ferroChiaro : segno === 2 ? C.bianco : C.pietraChiara, ombra: null });
    if (segno === 1) sprite(ctx, CROCE, { x: C.tappetoChiaro }, x - 2, y - 1);  // barrata
    if (segno === 2) {                                                         // incorniciata
      rett(ctx, C.erbaChiara, x - 2, y - 2, 9, 1); rett(ctx, C.erbaChiara, x - 2, y + 8, 9, 1);
      rett(ctx, C.erbaChiara, x - 2, y - 2, 1, 11); rett(ctx, C.erbaChiara, x + 6, y - 2, 1, 11);
    }
  }
  rett(ctx, C.pietraChiara, 282, 145, 6, 1);                // il gessetto sulla cornice
  riquadro(ctx, 266, 146, 4, 5, C.legnoScuro);              // piedini
  riquadro(ctx, 304, 146, 4, 5, C.legnoScuro);
  sprite(ctx, CAPPELLO, { k: C.bordo, V: C.viola, v: C.violaScuro, o: C.oro, O: C.oroScuro }, 289, 46);
}
const CROCE = ["x.......x", ".x.....x.", "..x...x..", "...x.x...", "....x....", "...x.x...", "..x...x..", ".x.....x.", "x.......x"];
```

Le cifre 0–4 sono nella colonna di sinistra, 5–9 in quella di destra, dall'alto in basso.

**Zucco** (sprite qui sotto): `sprite(ctx, ZUCCO_GAMBE, Z, 26, 144 + salto)` e poi `sprite(ctx, ZUCCO_BUSTO, Z, 26 + scuoti, 122 + respiro + salto)`, con

```js
const Z = { k: C.bordo, o: C.tappeto, O: C.brace, y: C.fiamma, h: C.fiammaChiara, E: C.oro, e: C.luna, b: C.legnoScuro,
  G: C.erbaScura, g: C.erba, P: C.violaScuro, p: C.viola, q: C.lilla, u: C.luna, U: C.oro,
  B: C.ferro, L: C.ferroChiaro, R: C.muroAcceso, T: C.legnoLuce };
// la lanterna che sfarfalla: per un fotogramma ogni tre, { ...Z, u: C.fiammaChiara, U: C.fiamma }
```

I segni sopra la testa di Zucco sono scritte 5×7 centrate a x 37, y `110 + salto`: `?!` in `C.tappetoChiaro` (errore), `?` in `C.pietraChiara` (mossa rifiutata), `!` in `C.giallo` (vittoria); tutte con l'ombra normale del kit.

**Ragno:** filo `rett(ctx, C.pietra, 63, 31, 1, 13 + b)` e `sprite(ctx, RAGNO, { k: C.bordo, f: C.ferroChiaro, r: C.tappetoChiaro }, 59, 44 + b)`, con `b` l'oscillazione di §5.6.

**Interno dell'armadio** (solo con le ante al passo 1, 2 o 3, disegnato prima delle ante):

```js
function interno(ctx, saluto) {
  rett(ctx, C.bordo, 72, 30, 177, 110);
  for (let x = 73; x < 248; x++) rett(ctx, x % 12 === 0 ? C.nero : C.legnoScuro, x, 31, 1, 108); // assi del fondo
  ombraRetino(ctx, 73, 31, 175, 12, 0.75);                  // buio sotto la cornice
  ombraRetino(ctx, 73, 43, 175, 14, 0.4);
  rett(ctx, C.ferroChiaro, 76, 36, 169, 2);                 // l'asta delle grucce
  rett(ctx, C.bordo, 76, 38, 169, 1);
  sprite(ctx, MANTELLO, { k: C.bordo, f: C.ferroChiaro, t: C.tappeto, x: C.tappetoChiaro, s: C.ferroChiaro, S: C.ferro, o: C.oro }, 112, 35);
  sprite(ctx, VESTITO, { k: C.bordo, f: C.ferroChiaro, v: C.violaScuro, V: C.viola, g: C.erbaChiara, o: C.oro }, 184, 35);
  rett(ctx, C.legno, 73, 133, 175, 6);                      // il ripiano in basso
  rett(ctx, C.legnoChiaro, 73, 133, 175, 1);
  sprite(ctx, saluto ? SCHELETRO_1 : SCHELETRO_0, { k: C.bordo, w: C.pietraChiara, W: C.pietra, n: C.nero }, 149, 81);
}
```

Con le ante al passo 3 (larghe 34) si vede l'interno da x 106 a 214: mantello a sinistra, scheletro al centro coi piedi sul ripiano, vestito a destra.

**Pipistrello** (solo durante la vittoria): `sprite(ctx, ALI_n, { k: C.bordo, a: C.viola, A: C.violaScuro, x: C.giallo, c: C.rosa }, x, y)`.

**Scintilla dello scatto** (7×7, due fotogrammi alternati ogni 125 ms) a (175, 45):

```js
const SCINTILLA = [
  ["...g...", "...g...", ".......", "gg.w.gg", ".......", "...g...", "...g..."],
  [".......", ".......", "...g...", "..gwg..", "...g...", ".......", "......."],
]; // colori { g: C.giallo, w: C.bianco }
```

**Polvere** quando la ferramenta tocca terra (due fotogrammi, tre sbuffi a (176, 147), (200, 147), (222, 147)):

```js
const POLVERE = [
  ["....s...s....", "..ss.sss.ss..", ".s..s...s..s."],
  [".s....s....s.", "s..s.....s..s", "............."],
]; // colori { s: C.pietra }
```

### 5.6 Animazioni e stati

Tempi in millisecondi; i fotogrammi continui seguono `g.fotogramma` (8 al secondo). Con `g.riduciMovimento`: niente animazioni continue (lampadina accesa fissa, ragno fermo a `b = 0`, Zucco fermo, scheletro su `SCHELETRO_0`) e ogni sequenza salta subito allo stato finale.

**Continue** (sfasate fra loro):
- lampadina: `fioca` quando `g.fotogramma % 40` è 0 o 3;
- ragno: `b = [0, 1, 2, 1][Math.floor(g.fotogramma / 3) % 4]`;
- Zucco respira: `respiro = Math.floor((g.fotogramma + 2) / 4) % 2`; la lanterna sfarfalla quando `g.fotogramma % 3 === 0`;
- scheletro (ante aperte): `saluto = Math.floor(g.fotogramma / 2) % 2`.

**Rotella che gira** (mossa `ruota`, 160 ms): la cifra vecchia esce e la nuova entra scorrendo di 18 pixel, dentro la finestrella. Con `p = min(1, (adesso − inizio) / 160)` e `o = Math.round(18 * p)`:
- verso +1 (freccia su): vecchia a `y = Y0 + 17 − o`, nuova a `Y0 + 17 + 18 − o` (la nuova sale da sotto);
- verso −1: vecchia a `Y0 + 17 + o`, nuova a `Y0 + 17 − 18 + o`.

Si ritaglia sull'interno della finestrella, così le cifre non escono mai: `ctx.save(); ctx.beginPath(); ctx.rect(x0 + 1, Y0 + 13, 14, 22); ctx.clip(); …; ctx.restore();` (un rettangolo a coordinate intere: niente smussature). Una nuova mossa sulla stessa rotella prima della fine chiude subito l'animazione precedente e ne parte un'altra. `imposta` non anima. Lo stato cambia subito, l'animazione viene dopo.

**Mossa rifiutata** (cifre ripetute, già provata): tonfo, cioè tutta la ferramenta con `dy = 1` per 120 ms; `?` sopra Zucco per 800 ms.

**Errore** (combinazione sbagliata): per 300 ms la ferramenta trema, `dx` = `[1, -1, 1, -1, 1, 0]` (un valore ogni 50 ms); per 400 ms `errore: true` (bordo del corpo `C.tappetoChiaro`, cifre `C.tappeto`); Zucco scuote la testa (`scuoti` = −1, 1, −1, 1, un valore ogni 125 ms) e sopra di lui compare `?!` per 1200 ms.

**Vittoria** (t = 0 alla mossa giusta; lo stato è già `aperto`):

| t | Cosa si vede |
|---|---|
| 0–400 | `scatto: true` (arco alzato di 6, finestrelle con la cornice `C.erbaChiara`); scintilla a (175, 45) |
| 400–800 | la ferramenta intera (cerniera, bandella, occhiello, arco aperto, corpo) cade: `dy` = 3, 8, 15, 24, 36, 50, 66, 84, un valore ogni 50 ms; poi non si disegna più (sparisce sotto la barra) |
| 800–1050 | polvere: fotogramma 0 fino a 925, poi 1 |
| 850 / 950 / 1050 | le ante passano al passo 1, 2, 3 (l'interno compare dal passo 1) |
| 1050–2300 | il pipistrello vola via: `x = 149 + Math.round(0.11·(t−1050))`, `y = 70 − Math.round(0.06·(t−1050))`, fotogramma `[0, 1, 2, 1][Math.floor((t−1050)/125) % 4]`; non si disegna più quando `y < 6` |
| 400–1000 | Zucco saltella: `salto` = −3, 0, −3, 0, −2, 0 (un valore ogni 100 ms) |
| 400–3500 | `!` giallo sopra Zucco |
| da 1050 | lo scheletro saluta (animazione continua) |

La carta della vittoria arriva da sola dopo 2000 ms (`ritardo: 2000`). **Stato finale** (anche per `g.giaRisolto` e con `g.riduciMovimento`): ante al passo 3, interno con costumi e scheletro, niente ferramenta, niente pipistrello, niente segni sopra Zucco; lavagnetta con gli appunti salvati.

### 5.7 Gli sprite a lettere

Tutti già verificati in un prototipo: righe della stessa lunghezza, `.` = vuoto. Le mappe dei colori sono nei paragrafi sopra.

```js
// ZUCCO_BUSTO: 22×22, testa, mantello e lanterna (pixel u/U); si disegna a (26, 122 + respiro)
const ZUCCO_BUSTO = [
  ".........Gg...........",
  "........GGg...........",
  ".....kkkkkkkkkk.......",
  "....koOOyyyOOOok......",
  "...koOOyyhyyOOOok.....",
  "...koOyEEyyOEEOok.....",
  "...koOEeeEyOEeeEk.....",
  "...koOOEEOOEOEEOk.....",
  "...koOOOOOEEOOOOk.....",
  "...koObEbEbEbEbOk.....",
  "...kooOeEeEeEeOok.....",
  "....kooOOOOOOOok......",
  "....kkkkkkkkkkkk......",
  "...kqqppppppppPPk.....",
  "..kqppppppppppPPPk....",
  "..kqppppppppppPPPkP...",
  "..kpppppppPpppPPPk.P..",
  "..kpppppppPpppPPPk.kkk",
  "..kpppppppPppPPPPk.kuk",
  "...kppppppPpPPPPk..kUk",
  "...kkppppppPPPPkk..kkk",
  ".....kkkkkkkkkk.......",
];

// ZUCCO_GAMBE: 22×6, si disegna a (26, 144 + salto), prima del busto
const ZUCCO_GAMBE = [
  "......kBBk.kLLk.......",
  "......kBBk.kLLk.......",
  "......kBBk.kLLk.......",
  "......kBBk.kLLk.......",
  ".....kRRRk.kTTTk......",
  ".....kkkkk.kkkkk......",
];

// CAPPELLO: 24×13, il cappello da strega appeso alla lavagnetta, a (289, 46)
const CAPPELLO = [
  "..................kk....",
  "................kkVk....",
  "..............kkVVk.....",
  ".............kVVvk......",
  "............kVVvvk......",
  "...........kVVVvvk......",
  "..........kVVVVvvk......",
  ".........kVVVVVvvvk.....",
  "........kOooooooOOk.....",
  ".......kVVVVVVVVvvvk....",
  "...kkkkVVVVVVVVVvvvvkkk.",
  "..kVVVVVVVVVVVVVVVVvvvvk",
  "...kkkkkkkkkkkkkkkkkkkk.",
];

// RAGNO: 9×7, a (59, 44 + oscillazione), appeso a un filo
const RAGNO = [
  "k.......k",
  ".k.kkk.k.",
  "..kfffk..",
  "kkfrfrfkk",
  "..kfffk..",
  ".k.kkk.k.",
  "k.......k",
];

// ARCO: 45×30, l'arco d'acciaio del lucchetto, a (182, 54) chiuso
const ARCO = [
  "....kkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkk....",
  "...kpssssssssssssssssssssssssssssssssssspk...",
  "..kfpsssssssssssssssssssssssssssssssssssppk..",
  ".ksfpppfffffffffffffffffffffffffffffffppppfk.",
  "kpsfpppkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkppppfpk",
  "kpsfppk...............................kpppfpk",
  "kpsfpk.................................kppfpk",
  "kpsfk...................................kpfpk",
  "kpsfk...................................kpfpk",
  "kpsfk...................................kpfpk",
  "kpsfk...................................kpfpk",
  "kpsfk...................................kpfpk",
  "kpsfk...................................kpfpk",
  "kpsfk...................................kpfpk",
  "kpsfk...................................kpfpk",
  "kpsfk...................................kpfpk",
  "kpsfk...................................kpfpk",
  "kpsfk...................................kpfpk",
  "kpsfk...................................kpfpk",
  "kpsfk...................................kpfpk",
  "kpsfk...................................kpfpk",
  "kpsfk...................................kpfpk",
  "kpsfk...................................kpfpk",
  "kpsfk...................................kpfpk",
  "kpsfk...................................kpfpk",
  "kpsfk...................................kpfpk",
  "kpsfk...................................kpfpk",
  "kpsfk...................................kpfpk",
  "kpsfk...................................kpfpk",
  "kpsfk...................................kpfpk",
];

// ALI_0: 22×10, pipistrello, fotogramma 0
const ALI_0 = [
  "k....................k",
  "kk..................kk",
  "kak......k..k......kak",
  "kaak.....kkkk.....kaak",
  "kaaak...kAAAAk...kaaak",
  ".kaaak.kAxAAxAk.kaaak.",
  "..kaaakkAAAAAAkkaaak..",
  "...kaaakAAccAAkaaak...",
  "....kkk.kAAAAk.kkk....",
  ".........kkkk.........",
];

// ALI_1: 22×10, pipistrello, fotogramma 1
const ALI_1 = [
  "......................",
  ".........k..k.........",
  ".........kkkk.........",
  "...kkkk.kAAAAk.kkkk...",
  ".kkaaaakAxAAxAkaaaakk.",
  "kaaaaaakAAAAAAkaaaaaak",
  "kakaakakAAccAAkakaakak",
  ".k.kk.k.kAAAAk.k.kk.k.",
  ".........kkkk.........",
  "......................",
];

// ALI_2: 22×10, pipistrello, fotogramma 2 (la sequenza è 0, 1, 2, 1)
const ALI_2 = [
  ".........k..k.........",
  ".........kkkk.........",
  "........kAAAAk........",
  "......kkAxAAxAkk......",
  "....kkaaAAAAAAaakk....",
  "...kaaaaAAccAAaaaak...",
  "..kaaak.kAAAAk.kaaak..",
  ".kaak....kkkk....kaak.",
  ".kak..............kak.",
  ".kk................kk.",
];

// SCHELETRO_0: 23×53, lo scheletro nell'armadio, mano a sinistra; a (149, 81)
const SCHELETRO_0 = [
  ".......kkkkkkkkk.kwwwk.",
  "......kwwwwwwwwwkkwwwk.",
  ".....kwwwwwwwwwwwkkwk..",
  ".....kwwwwwwwwwWwkkwk..",
  ".....kwwnnwwwnnWwkkwk..",
  ".....kwwnnwwwnnWwkkwk..",
  ".....kwwwwwnwwwWwkkwk..",
  ".....kwwwwwnwwwWwkkwk..",
  ".....kwwwwwwwwwWwkkk...",
  "......kwwwwwwwWwkkwk...",
  "......kwnwnwnwnwkkwk...",
  ".......kkkkwkkkk.kwk...",
  "..........kwk....kwk...",
  ".....kkkkkkwkkkkkkwk...",
  "....kwwwwwwwwwwwwwwk...",
  "...kwkkkkkkwkkkkkkk....",
  "...kwkkwwwwwwwwwk......",
  "...kwk.kkkkwkkkk.......",
  "...kwkkwwwwwwwwwk......",
  "...kwk.kkkkwkkkk.......",
  "...kwkkwwwwwwwwwk......",
  "...kwk.kkkkwkkkk.......",
  "...kwk.kwwwwwwwk.......",
  "...kwk..kkkwkkk........",
  "...kwk....kwk..........",
  "....k.....kwk..........",
  "...kwk....kwk..........",
  "...kwk....kwk..........",
  "...kwk....kwk..........",
  "...kwk....kwk..........",
  "...kwk.kkkkwkkkk.......",
  "...kwkkwwwwwwwWWk......",
  "...kwkkwwwwnwwWWk......",
  "...kwkkwwwwwwwWWk......",
  "..kwwwkkkkkkkkkk.......",
  "..kwwwkkwk...kwk.......",
  "...kkk.kwk...kwk.......",
  ".......kwk...kwk.......",
  ".......kwk...kwk.......",
  ".......kwk...kwk.......",
  ".......kwk...kwk.......",
  ".......kwk...kwk.......",
  ".......kwk...kwk.......",
  "........k.....k........",
  ".......kwk...kwk.......",
  ".......kwk...kwk.......",
  ".......kwk...kwk.......",
  ".......kwk...kwk.......",
  ".......kwk...kwk.......",
  "......kkwk...kwkk......",
  ".....kwwwk...kwwwk.....",
  "......kkk.....kkk......",
  ".......................",
];

// SCHELETRO_1: 23×53, mano a destra (si alterna con SCHELETRO_0 per salutare)
const SCHELETRO_1 = [
  ".......kkkkkkkkk...kwww",
  "......kwwwwwwwwwk..kwww",
  ".....kwwwwwwwwwwwk..kkk",
  ".....kwwwwwwwwwWwk.kwk.",
  ".....kwwnnwwwnnWwk.kwk.",
  ".....kwwnnwwwnnWwk.kwk.",
  ".....kwwwwwnwwwWwk.kwk.",
  ".....kwwwwwnwwwWwk.kwk.",
  ".....kwwwwwwwwwWwkkwk..",
  "......kwwwwwwwWwkkwk...",
  "......kwnwnwnwnwkkwk...",
  ".......kkkkwkkkk.kwk...",
  "..........kwk....kwk...",
  ".....kkkkkkwkkkkkkwk...",
  "....kwwwwwwwwwwwwwwk...",
  "...kwkkkkkkwkkkkkkk....",
  "...kwkkwwwwwwwwwk......",
  "...kwk.kkkkwkkkk.......",
  "...kwkkwwwwwwwwwk......",
  "...kwk.kkkkwkkkk.......",
  "...kwkkwwwwwwwwwk......",
  "...kwk.kkkkwkkkk.......",
  "...kwk.kwwwwwwwk.......",
  "...kwk..kkkwkkk........",
  "...kwk....kwk..........",
  "....k.....kwk..........",
  "...kwk....kwk..........",
  "...kwk....kwk..........",
  "...kwk....kwk..........",
  "...kwk....kwk..........",
  "...kwk.kkkkwkkkk.......",
  "...kwkkwwwwwwwWWk......",
  "...kwkkwwwwnwwWWk......",
  "...kwkkwwwwwwwWWk......",
  "..kwwwkkkkkkkkkk.......",
  "..kwwwkkwk...kwk.......",
  "...kkk.kwk...kwk.......",
  ".......kwk...kwk.......",
  ".......kwk...kwk.......",
  ".......kwk...kwk.......",
  ".......kwk...kwk.......",
  ".......kwk...kwk.......",
  ".......kwk...kwk.......",
  "........k.....k........",
  ".......kwk...kwk.......",
  ".......kwk...kwk.......",
  ".......kwk...kwk.......",
  ".......kwk...kwk.......",
  ".......kwk...kwk.......",
  "......kkwk...kwkk......",
  ".....kwwwk...kwwwk.....",
  "......kkk.....kkk......",
  ".......................",
];

// MANTELLO: 24×58, mantello da vampiro appeso, a (112, 35)
const MANTELLO = [
  ".....kk....kfk...kk.....",
  "....kxxk...kfk..kttk....",
  "...kxxxxk...k..kttttk...",
  "...kxxxxkkkkkkkkttttk...",
  "...kxxxxssssssssttttk...",
  "...kxxxxssssssssttttk...",
  "....kkkssxxoottSSkkk....",
  "......kssxxoottSSk......",
  "......kssxxxtttSSk......",
  ".....kssxxxxttttSSk.....",
  ".....kssxxxxttttSSk.....",
  ".....kssxxxxttttSSk.....",
  ".....kssxxxxttttSSk.....",
  ".....kssxxxxttttSSk.....",
  ".....kssxxxxttttSSk.....",
  ".....kssxxxxttttSSk.....",
  ".....kssxxxxttttSSk.....",
  "....ksssxxxxttttSSSk....",
  "....ksssxxxxttttSSSk....",
  "....ksssxxxxttttSSSk....",
  "....ksssxxxxttttSSSk....",
  "....ksssxxxxttttSSSk....",
  "....ksssxxxxttttSSSk....",
  "....ksssxxxxttttSSSk....",
  "....ksssxxxxttttSSSk....",
  "....ksssxxxxttttSSSk....",
  "...ksssxxxxxtttttSSSk...",
  "...ksssxxxxxtttttSSSk...",
  "...ksssxxxxxtttttSSSk...",
  "...ksssxxxxxtttttSSSk...",
  "...ksssxxxxxtttttSSSk...",
  "...ksssxxxxxtttttSSSk...",
  "...ksssxxxxxtttttSSSk...",
  "...ksssxxxxxtttttSSSk...",
  "..ksssxxxxxxttttttSSSk..",
  "..ksssxxxxxxttttttSSSk..",
  "..ksssxxxxxxttttttSSSk..",
  "..ksssxxxxxxttttttSSSk..",
  "..ksssxxxxxxttttttSSSk..",
  "..ksssxxxxxxttttttSSSk..",
  "..ksssxxxxxxttttttSSSk..",
  "..ksssxxxxxxttttttSSSk..",
  "..ksssxxxxxxttttttSSSk..",
  ".kssssxxxxxxttttttSSSSk.",
  ".kssssxxxxxxttttttSSSSk.",
  ".kssssxxxxxxttttttSSSSk.",
  ".kssssxxxxxxttttttSSSSk.",
  ".kssssxxxxxxttttttSSSSk.",
  ".kssssxxxxxxttttttSSSSk.",
  ".kssssxxxxxxttttttSSSSk.",
  ".kssssxxxxxxttttttSSSSk.",
  "kssssxxxxxxxtttttttSSSSk",
  "kssssxxxxxxxtttttttSSSSk",
  "kssssxxxxxxxtttttttSSSSk",
  "kssssxxxxxxxtttttttSSSSk",
  "kssssxxxxxxxtttttttSSSSk",
  "kskkkxkkkxkkktkkktkkkSk.",
  ".k...k...k...k...k...k..",
];

// VESTITO: 24×56, vestito da strega appeso, a (184, 35)
const VESTITO = [
  "...........kfk..........",
  "...........kfk..........",
  "........kkkkkkkk........",
  ".......kVvvvvvvVk.......",
  ".......kVVVVVVVVk.......",
  "....kkkkVVVVVVVVkkkk....",
  "...kvvvVVVVVVVVVVvvvk...",
  "...kvvvVVVVVVVVVVvvvk...",
  "...kvvvVVVVVVVVVVvvvk...",
  "...kvvvVVVVVVVVVVvvvk...",
  "...kvvvVVVVVVVVVVvvvk...",
  "...kvvvVVVVVVVVVVvvvk...",
  "...kvvvVVVVVVVVVVvvvk...",
  "...kvvvVVVVVVVVVVvvvk...",
  "...kvvvVVVVVVVVVVvvvk...",
  "...kvvvVVVVVVVVVVvvvk...",
  "...kvvvVVVVVVVVVVvvvk...",
  "...kvvvVVVVVVVVVVvvvk...",
  "..kvvvvggggooggggvvvvk..",
  "..kvvvvggggooggggvvvvk..",
  "..kvvvvvVVVVVVvvvvvvvk..",
  "...kkkkVVVVVVVvvvkkkk...",
  "......kVVVVVVVvvvk......",
  ".....kVVVVVVVvVvvvk.....",
  ".....kVVVVVVvVVvvvk.....",
  ".....kVVVVVvVVVvvvk.....",
  ".....kVVVVvVVVVvvvk.....",
  ".....kVVVvVVVVVvvvk.....",
  "....kVVVvVVVVVVVvvvk....",
  "....kVVvVVVVVVVVvvvk....",
  "....kVvVVVVVVVVvvvvk....",
  "....kvVVVVVVVVvVvvvk....",
  "....kVVVVVVVVvVVvvvk....",
  "...kVVVVVVVVvVVVVvvvk...",
  "...kVVVVVVVvVVVVVvvvk...",
  "...kVVVVVVvVVVVVVvvvk...",
  "...kVVVVVvVVVVVVVvvvk...",
  "...kVVVVvVVVVVVVVvvvk...",
  "...kVVVvVVVVVVVVvvvvk...",
  "..kVVVvVVVVVVVVvVVvvvk..",
  "..kVVvVVVVVVVVvVVVvvvk..",
  "..kVvVVVVVVVVvVVVVvvvk..",
  "..kvVVVVVVVVvVVVVVvvvk..",
  "..kVVVVVVVVvVVVVVVvvvk..",
  ".kVVVVVVVVvVVVVVVVVvvvk.",
  ".kVVVVVVVvVVVVVVVVvvvvk.",
  ".kVVVVVVvVVVVVVVVvVvvvk.",
  ".kVVVVVvVVVVVVVVvVVvvvk.",
  ".kVVVVvVVVVVVVVvVVVvvvk.",
  "kVVVVvVVVVVVVVvVVVVVvvvk",
  "kVVVvVVVVVVVVvVVVVVVvvvk",
  "kVVvVVVVVVVVvVVVVVVVvvvk",
  "kVVvkVVVkVVVkVVVkVVVkvvk",
  "kVkvkVkVkVkVkVkVkVkVkvk.",
  ".kkvkkkVkkkVkkkVkkkVkk..",
  "...k...k...k...k...k....",
];
```

---

## 6. Aggancio per le prove

```js
g.espone({
  gioca: (mossa) => gioca(mossa),              // la stessa funzione di tocchi, tastiera e bottone; ritorna l'esito
  statoGioco: () => ({ rotelle: [...stato.rotelle], provate: [...stato.provate], appunti: [...stato.appunti], aperto: stato.aperto }),
  zona: (i, verso) => ({ x: 170 + 6 + 20 * i + 8, y: verso > 0 ? 84 + 6 : 84 + 40 }),       // centro della freccia su/giù della rotella i
  zonaAppunto: (d) => ({ x: (d < 5 ? 266 : 287) + 10, y: 72 + 14 * (d % 5) + 7 }),           // centro della cella della cifra d
});
```

Mosse (esattamente questi campi):

| Mossa | Esito |
|---|---|
| `{ tipo: "ruota", rotella: 0..2, verso: 1 \| -1 }` | `{ ok: true, rotelle: [..] }` oppure `{ valida: false, motivo: "rotella inesistente" \| "verso non valido" }` |
| `{ tipo: "imposta", cifre: [a, b, c] }` | `{ ok: true, rotelle: [..] }` oppure `{ valida: false, motivo: "cifre non valide" }` |
| `{ tipo: "segna", cifra: 0..9 }` | `{ ok: true, cifra, segno: 0 \| 1 \| 2 }` oppure `{ valida: false, motivo: "cifra non valida" }` |
| `{ tipo: "prova" }` | `{ errore: true, motivo: "combinazione sbagliata", provata: "127" }`, `{ risolto: true, combinazione: "581" }`, `{ valida: false, motivo: "cifre ripetute" \| "già provata" }` |
| qualsiasi altra cosa | `{ valida: false, motivo: "mossa sconosciuta" }` |

`statoGioco()` → `{ rotelle: [0, 0, 0], provate: ["127", "068"], appunti: [10 numeri 0..2], aperto: false }`.

`zona(0, 1)` → `{ x: 184, y: 90 }`, `zona(2, -1)` → `{ x: 224, y: 124 }`, `zonaAppunto(7)` → `{ x: 297, y: 107 }`: cliccando lì `t.clicScena` deve fare la stessa mossa di `gioca`.

La verifica (`verifica.mjs`) usa tutto questo: semi 1, 2, 3, 42, 777, 2027 e 4242, mosse rifiutate, clic sulle frecce e sulla lavagnetta, due combinazioni sbagliate (errori e dorate), ricaricamento (le combinazioni provate restano), soluzione girando le rotelle una tacca alla volta con `ruota` e premendo il bottone `prova` (`data-azione="prova"`).

---

## 7. Criteri di accettazione

Guardando le foto e giocando:

1. Con il seme 1 le cinque righe incise sono 287, 874, 310, 907, 854 con le risposte di §2, e la combinazione 538 apre.
2. L'armadio sembra un armadio (alto, con cornice a dentelli, ante con pannello, zoccolo e piedi), non uno schema; la lampadina si vede davanti alla cornice e ogni tanto sfarfalla.
3. I tentativi si leggono bene anche nella foto del telefono: cifre grandi in giallo chiaro, risposta su due righe, tratteggio fra una riga e l'altra; niente esce dal pannello dell'anta né tocca la cerniera (x 153).
4. Le tre rotelle hanno frecce su e giù ben visibili; un clic sulla metà alta di una rotella la fa salire di uno (9 → 0), sulla metà bassa la fa scendere (0 → 9), con la cifra che scorre nella finestrella senza uscirne.
5. Niente fuori dall'area di gioco (x 4…316, y 18…152): solo la ferramenta che cade, durante la vittoria, sparisce sotto la barra in basso.
6. Prova con cifre ripetute o con una combinazione già provata: fumetto giusto, tonfo e «?», errori invariati.
7. Prova sbagliata: avviso del kit «Combinazione sbagliata», lucchetto che trema col bordo rosso, Zucco con «?!»; dopo due errori le dorate in palio sono 3.
8. Prova giusta: arco che scatta, ferramenta che cade con la polvere, ante che si aprono in tre passi, pipistrello che vola via, scheletro che saluta fra mantello e vestito; la carta della vittoria arriva dopo circa 2 secondi col riepilogo di §3.
9. Ricaricando a rompicapo risolto si vede l'armadio aperto con lo scheletro; ricaricando prima, le combinazioni provate e gli appunti sono ancora lì.
10. La lavagnetta: un tocco barra la cifra (croce rossa, cifra spenta), due la incorniciano di verde, tre la puliscono; non costa mai dorate.
11. Con `prefers-reduced-motion` nessuna animazione continua e ogni sequenza arriva subito allo stato finale (mai una rotella o un'anta a metà).
12. `node demo/comune/prova.mjs armadio-combinazione` finisce con «TUTTO OK».
