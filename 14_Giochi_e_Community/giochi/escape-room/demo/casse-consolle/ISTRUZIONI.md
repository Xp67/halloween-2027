# Le casse della consolle — istruzioni per il costruttore

Rompicapo a **blocchi scorrevoli** della Sala principale. Valgono le regole comuni (`../REGOLE_COMUNI.md`) e il kit (`../comune/kit.js`); qui c'è solo quello che è specifico. Tutto quello che serve è in questo file: disposizioni, regole, testi, coordinate e sprite già disegnati.

`index.html` è la copia di `../_esempio/index.html` con `<title>Le casse della consolle</title>`; non serve `gioco.css`. La scheda non ha indizi: il kit nasconde da solo il bottone «Indizio», non c'è niente da fare.

## 1. In breve

Dietro la consolle c'è una pedana di 5 × 4 caselle, chiusa da una struttura di truss, con la porta del backstage in basso a destra. Il flight case rosso del DJ (2 × 2) è chiuso nell'angolo in alto a sinistra da 3 casse (1 × 2, in piedi), 2 subwoofer (2 × 1, sdraiati) e 4 spie (1 × 1); restano 2 caselle libere. Il giocatore trascina i pezzi in orizzontale o in verticale; ogni spostamento è **una mossa**, anche se il pezzo scivola di più caselle. Vince quando il flight case arriva sulle strisce gialle davanti alla porta: esce nel backstage. Ha 100 mosse: se finiscono prima, il DJ rimette tutto com'era e conta un errore.

## 2. Variante

### Il generatore

Le disposizioni sono già trovate e verificate (ricerca in ampiezza, mossa = un pezzo in linea retta di una o più caselle): sono 12, **tutte con lo stesso minimo di 34 mosse**, tutte con il flight case in (0, 0) e le quattro caselle accanto a lui occupate (non può muoversi alla prima mossa). Sono originali: non vengono da nessun gioco esistente e la tavola, con l'uscita in un angolo, non è quella del rompicapo classico.

```js
variante(rng) {
  const n = EscapeDemo.intero(rng, 0, DISPOSIZIONI.length - 1); // unica chiamata a rng
  const righe = DISPOSIZIONI[n].slice();
  return { disposizione: n + 1, righe, pezzi: pezziDaRighe(righe), minimo: 34, tetto: 100, meta: { x: 3, y: 2 } };
}
```

Niente altro dipende dal seme: niente specchiature, niente rimescolamenti.

### Le 12 disposizioni (da copiare così)

Quattro stringhe di 5 lettere, dall'alto in basso; la colonna `x` va da 0 (sinistra) a 4, la riga `y` da 0 (in alto) a 3.

| Lettera | Significato |
|---|---|
| `F` | flight case, 2 × 2: tutte e quattro le sue caselle |
| `C` / `c` | cassa, 1 × 2: `C` è la casella in alto, `c` quella sotto |
| `W` / `w` | subwoofer, 2 × 1: `W` è la casella a sinistra, `w` quella a destra |
| `s` | spia, 1 × 1 |
| `.` | casella libera |

```js
const DISPOSIZIONI = [
  ["FFWw.", "FFssC", "CWwCc", "c.scs"], //  1
  ["FFWw.", "FFsCs", "Cs.cC", "cWwsc"], //  2
  ["FFWwC", "FFC.c", "Cscs.", "csWws"], //  3
  ["FFWw.", "FFs.s", "CCCss", "cccWw"], //  4
  ["FFWws", "FFC.s", "CCcWw", "cc.ss"], //  5
  ["FFsWw", "FFsCs", "CC.c.", "ccWws"], //  6
  ["FFsss", "FFsCC", "CWwcc", "c..Ww"], //  7
  ["FFWw.", "FFWw.", "ssCCC", "ssccc"], //  8
  ["FFWwC", "FFWwc", "sC.sC", "sc.sc"], //  9
  ["FFC.s", "FFcss", "CCWws", "cc.Ww"], // 10
  ["FFCC.", "FFccs", "CsWw.", "csWws"], // 11
  ["FFWwC", "FFCsc", "sCc..", "scsWw"], // 12
];
```

### `pezziDaRighe(righe)`

Si leggono le caselle **in ordine di lettura** (riga `y` da 0 a 3, dentro la riga `x` da 0 a 4) e si crea un pezzo ogni volta che si incontra la sua casella in alto a sinistra:

- la prima `F` → `{ id: "F", tipo: "flight", x, y, w: 2, h: 2 }` (le altre tre `F` si saltano);
- `C` → `{ id: "C1" | "C2" | "C3", tipo: "cassa", x, y, w: 1, h: 2 }`;
- `W` → `{ id: "W1" | "W2", tipo: "subwoofer", x, y, w: 2, h: 1 }`;
- `s` → `{ id: "S1" … "S4", tipo: "spia", x, y, w: 1, h: 1 }`;
- `c`, `w` e `.` si saltano.

I numeri crescono per tipo, nell'ordine in cui si incontrano; l'array ha l'ordine di lettura. Le proprietà sono esattamente `id, tipo, x, y, w, h`. Serve anche la funzione inversa `righeDaPezzi(pezzi)`, che riscrive le quattro stringhe con le stesse lettere.

### Esempi

Seme con `n = 0` (disposizione 1):

```json
{
  "disposizione": 1,
  "righe": ["FFWw.", "FFssC", "CWwCc", "c.scs"],
  "pezzi": [
    { "id": "F",  "tipo": "flight",    "x": 0, "y": 0, "w": 2, "h": 2 },
    { "id": "W1", "tipo": "subwoofer", "x": 2, "y": 0, "w": 2, "h": 1 },
    { "id": "S1", "tipo": "spia",      "x": 2, "y": 1, "w": 1, "h": 1 },
    { "id": "S2", "tipo": "spia",      "x": 3, "y": 1, "w": 1, "h": 1 },
    { "id": "C1", "tipo": "cassa",     "x": 4, "y": 1, "w": 1, "h": 2 },
    { "id": "C2", "tipo": "cassa",     "x": 0, "y": 2, "w": 1, "h": 2 },
    { "id": "W2", "tipo": "subwoofer", "x": 1, "y": 2, "w": 2, "h": 1 },
    { "id": "C3", "tipo": "cassa",     "x": 3, "y": 2, "w": 1, "h": 2 },
    { "id": "S3", "tipo": "spia",      "x": 2, "y": 3, "w": 1, "h": 1 },
    { "id": "S4", "tipo": "spia",      "x": 4, "y": 3, "w": 1, "h": 1 }
  ],
  "minimo": 34, "tetto": 100, "meta": { "x": 3, "y": 2 }
}
```

Una soluzione minima (34 mosse). Notazione: `x,y dir passi` = `gioca({ x, y, dir, passi })`, con `x,y` l'angolo in alto a sinistra del pezzo in quel momento:

```
2,0 des 1 · 2,1 su 1 · 3,1 sin 1 · 3,2 su 1 · 2,3 des 1 · 1,2 giu 1 · 2,1 giu 1 · 2,2 sin 1 · 2,0 giu 2 · 0,0 des 1 ·
0,2 su 2 · 1,2 sin 1 · 1,3 sin 1 · 2,2 giu 1 · 1,0 giu 1 · 3,0 sin 2 · 3,1 su 1 · 3,3 su 1 · 4,3 sin 1 · 4,1 giu 1 ·
3,0 des 1 · 3,2 su 2 · 1,1 des 1 · 0,2 des 1 · 1,2 su 1 · 0,3 su 1 · 2,3 sin 2 · 3,3 sin 2 · 2,1 giu 1 · 3,0 giu 1 ·
3,1 sin 1 · 4,0 sin 1 · 4,2 su 2 · 2,2 des 1
```

(`des` = `"destra"`, `sin` = `"sinistra"`.) Disposizione 8, `["FFWw.", "FFWw.", "ssCCC", "ssccc"]`, anche lei in 34:

```
4,2 su 2 · 3,2 des 1 · 2,2 des 1 · 1,2 des 1 · 2,2 giu 1 · 0,2 des 2 · 0,0 giu 1 · 2,0 sin 2 · 2,1 su 1 · 2,2 su 1 ·
2,1 des 1 · 0,1 des 1 · 0,3 su 2 · 1,3 sin 1 · 0,3 su 1 · 2,3 sin 2 · 1,1 giu 1 · 0,1 des 2 · 0,0 giu 1 · 2,0 sin 2 ·
2,1 su 1 · 3,1 sin 1 · 3,2 su 2 · 1,2 des 1 · 0,2 des 1 · 1,2 giu 1 · 0,1 giu 1 · 2,1 sin 2 · 2,0 giu 1 · 2,1 sin 1 ·
3,0 sin 1 · 4,0 sin 1 · 4,2 su 2 · 2,2 des 1
```

## 3. Regole e mosse

### Lo stato (logica pura, separata dal disegno)

`{ pezzi, mosse, risolto }`: le posizioni attuali dei pezzi (con il loro `id`), le mosse contate dall'inizio di questo giro (0…100) e se il flight case è uscito. Scrivi la logica come funzioni pulite, senza disegno dentro: `pezzoIn(pezzi, x, y)`, `spazioLibero(pezzi, pezzo, dir)` (quante caselle libere ha davanti in quella direzione, fino al bordo o al primo pezzo), `applicaMossa(stato, mossa) → { stato, esito }`.

### La mossa

`{ x, y, dir, passi }`: `x, y` = **una casella qualunque** del pezzo da spostare (non per forza l'angolo in alto a sinistra), `dir` ∈ `"su" | "giu" | "sinistra" | "destra"`, `passi` = intero ≥ 1. Il pezzo scivola in linea retta di `passi` caselle; tutte le caselle che attraversa devono essere libere (o sue). Non esce mai dalla tavola: nemmeno il flight case passa dalla porta finché non è sulle strisce gialle.

Controlli, in quest'ordine (nessuno di questi è un errore: la mossa è rifiutata e basta, stato e contatore restano uguali):

1. formato sbagliato (`x` fuori da 0…4, `y` fuori da 0…3, non interi, `dir` sconosciuta, `passi` non intero o < 1) → `{ valida: false, motivo: "formato" }`;
2. casella libera → `{ valida: false, motivo: "vuota" }`;
3. `passi > spazioLibero(...)` → `{ valida: false, motivo: "bloccata" }`.

Se passa, il pezzo si sposta e `mosse` cresce di 1. Poi:

- se il flight case ha l'angolo in alto a sinistra in (3, 2) → **risolto**: `{ risolto: true, mosse }`. Si chiama subito `g.risolto(...)` (vedi «Vittoria»);
- altrimenti, se `mosse === 100` → **errore** (il tetto): `g.errore("Mosse finite: il DJ rimette tutto com'era")`; i pezzi tornano tutti alla disposizione iniziale della variante (copie di `variante.pezzi`), `mosse` torna a 0; esito `{ errore: true, motivo: "tetto", mosse: 0 }`. La centesima mossa che risolve vale come vittoria, non come errore;
- altrimenti → `{ ok: true, mosse }`.

**Conta come errore solo il tetto delle 100 mosse.** (La scheda non lo diceva: è una scelta della regia, scritta nella carta iniziale.) Il minimo è 34 per tutte le disposizioni, quindi 100 lascia quasi il triplo.

### «Da capo»

Bottone `g.bottone("Da capo", daCapo, { id: "da-capo" })`. Rimette i pezzi nella disposizione iniziale **senza azzerare il contatore** e senza contare né una mossa né un errore (altrimenti basterebbe premerlo a 99 mosse per non sbagliare mai). Se i pezzi sono già nella disposizione iniziale, cambia solo il messaggio.

### Memoria (il tetto non si aggira ricaricando)

Dopo ogni cambiamento (mossa valida, errore del tetto, «Da capo») salva `g.memoria.righe = righeDaPezzi(pezzi)` e `g.memoria.mosse = mosse`, poi `g.salvaMemoria()`. All'avvio, se `g.memoria.righe` c'è ed è una disposizione valida con gli stessi pezzi (1 flight case, 3 casse, 2 subwoofer, 4 spie, 2 vuote), si riparte da lì: `pezzi = pezziDaRighe(g.memoria.righe)` (gli id si rinumerano, va bene così: pezzi dello stesso tipo sono uguali) e `mosse = g.memoria.mosse`. Altrimenti si parte da `variante.pezzi` con 0 mosse.

### Già risolto

Con `g.giaRisolto` si disegna la posizione salvata in `g.memoria.righe` (se manca, `variante.righe`) **senza il flight case**, che è già nel backstage, con la porta nello stato «vinto» (vedi grafica). Messaggio: «Il flight case è già nel backstage.»

## 4. Interfaccia

### Testo della carta iniziale

La scheda non parla del tetto: va aggiunto. Siccome il testo si legge dalla scheda dentro `crea`, tieni un riferimento all'oggetto delle opzioni e impostalo lì (il kit legge `opzioni.testo` solo quando mostra la carta, cioè dopo `crea`):

```js
const opzioni = {
  id: "casse-consolle", sfondo: "sala-principale", velo: 0.5, variante,
  crea(g) {
    opzioni.testo = g.scheda.enigma + "\nOgni spostamento è una mossa, anche di più caselle. Hai 100 mosse: se finiscono prima che il flight case sia uscito, il DJ rimette tutto com'era e conta un errore.";
    // …
  },
};
EscapeDemo.avvia(opzioni);
```

### Le caselle sotto il dito

Casella `(cx, cy) = (floor((px − 86) / 28), floor((py − 34) / 28))`, con `px, py` in pixel della scena; dentro la tavola se `0 ≤ cx ≤ 4` e `0 ≤ cy ≤ 3`. Ogni casella è un bersaglio di 28 × 28 pixel; il pezzo è quello che occupa la casella.

### Trascinare (il modo principale)

Con `g.tocca`:

- **«giu»** su una casella occupata: quel pezzo diventa il **selezionato** (anche se un altro lo era) e comincia un trascinamento. Si ricorda il punto di partenza e, una volta per tutte, `spazioLibero` nelle quattro direzioni.
- **«muovi»** con `premuto`: `dx, dy` = spostamento dal punto di partenza. L'asse si sceglie quando `max(|dx|, |dy|) ≥ 4`: orizzontale se `|dx| ≥ |dy|`, altrimenti verticale. Se il dito torna entro 4 pixel dal punto di partenza su tutti e due gli assi, l'asse si sblocca. Lungo l'asse scelto il pezzo segue il dito, **limitato** a `spazioLibero × 28` pixel in quella direzione e arrotondato al pixel intero; nell'altro asse non si muove. Il pezzo trascinato si disegna sopra gli altri.
- **«su»**: `passi = Math.round(|spostamento limitato| / 28)`. Se `passi ≥ 1` si chiama la stessa funzione di `gioca` con `{ x: pezzo.x, y: pezzo.y, dir, passi }` e il pezzo scivola dalla posizione del dito alla casella d'arrivo in 120 ms. Se `passi = 0`: torna al suo posto in 120 ms; se però il dito ha tirato verso una direzione con `spazioLibero = 0` per almeno 10 pixel, il pezzo fa il «colpo» (vedi grafica) e il fumetto dice «Di lì non passa: c'è qualcosa in mezzo.». Se l'asse non è mai stato scelto è un **tocco**: il pezzo resta selezionato e il fumetto mostra il suo messaggio di selezione (vedi testi).

### Due tocchi (pezzo, poi casella libera)

Con un pezzo selezionato, un **«giu»** su una casella **libera** `(cx, cy)` lo fa scivolare fino a coprirla, se è sulla sua stessa riga o colonna:

- `cy` fra `pezzo.y` e `pezzo.y + h − 1` e `cx > pezzo.x + w − 1` → `destra`, `passi = cx − (pezzo.x + w − 1)`;
- stessa condizione su `cy` e `cx < pezzo.x` → `sinistra`, `passi = pezzo.x − cx`;
- `cx` fra `pezzo.x` e `pezzo.x + w − 1` e `cy > pezzo.y + h − 1` → `giu`, `passi = cy − (pezzo.y + h − 1)`;
- stessa condizione su `cx` e `cy < pezzo.y` → `su`, `passi = pezzo.y − cy`;
- altrimenti nessuna mossa, fumetto «I pezzi scivolano solo in orizzontale o in verticale.».

Se la mossa viene rifiutata come `bloccata`: «colpo» e «Di lì non passa: c'è qualcosa in mezzo.». Dopo una mossa riuscita il pezzo resta selezionato. Toccare un altro pezzo seleziona quello (toccare di nuovo lo stesso pezzo lo lascia selezionato, non lo deseleziona); toccare fuori dalla tavola toglie la selezione. Il movimento a due tocchi dura `min(300, 120 + 60 × passi)` ms.

### Tastiera (facoltativa)

Frecce = sposta di una casella il pezzo selezionato (stessa funzione di `gioca`). Se la fai, Tab passa al pezzo successivo nell'ordine dell'array.

### Mentre ci sono animazioni

Durante l'animazione dell'errore e quella della vittoria (vedi grafica) i tocchi si ignorano. Durante il semplice scivolare di un pezzo no: una nuova mossa parte dalla posizione logica e interrompe l'animazione vecchia. `gioca()` non è mai bloccato dalle animazioni.

### Testi del fumetto (esatti)

| Quando | Testo |
|---|---|
| All'avvio, 0 mosse | Trascina i pezzi e porta il flight case rosso alla porta del backstage. |
| All'avvio con mosse salvate (> 0) | Riprendi da dove eri: le mosse fatte restano contate. |
| Tocco su una cassa | Cassa scelta: tocca una casella libera sulla sua riga o colonna. |
| Tocco su un subwoofer | Subwoofer scelto: tocca una casella libera sulla sua riga o colonna. |
| Tocco su una spia | Spia scelta: tocca una casella libera sulla sua riga o colonna. |
| Tocco sul flight case | Flight case scelto: tocca una casella libera sulla sua riga o colonna. |
| Mossa riuscita del flight case (che non risolve) | Il flight case si muove: portalo sulle strisce gialle davanti alla porta. |
| Mossa riuscita di un altro pezzo | (nasconde il fumetto: `g.messaggio(null)`), salvo la riga sotto |
| Mossa riuscita che porta a 90 mosse (ha la precedenza sulle due righe sopra) | Restano 10 mosse: poi il DJ rimette tutto com'era. |
| Pezzo bloccato | Di lì non passa: c'è qualcosa in mezzo. |
| Casella non in fila | I pezzi scivolano solo in orizzontale o in verticale. |
| Errore del tetto | Si ricomincia da capo, con 100 mosse nuove. |
| «Da capo» | Tutto com'era all'inizio. Le mosse fatte restano contate. |
| «Da capo» già all'inizio | È già tutto com'era all'inizio. |
| Vittoria | Il flight case è nel backstage! |
| Già risolto | Il flight case è già nel backstage. |

Testo di `g.errore`: **«Mosse finite: il DJ rimette tutto com'era»** (il kit aggiunge da solo «· ora le dorate in palio sono N» quando calano).

### Vittoria

Subito, nella stessa chiamata della mossa: `g.risolto({ riepilogo, ritardo: 1100 })` con `riepilogo` = «Ce l'hai fatta in N mosse: il minimo possibile è 34.» oppure, se N = 34, «Ce l'hai fatta in 34 mosse: proprio il minimo possibile!». Il kit disabilita da solo il bottone e blocca i tocchi.

## 5. Grafica

### Sfondo e strati

`sfondo: "sala-principale"`, `velo: 0.5`. A sinistra lo sfondo ha la porta del BAR (x 36…80), al centro la pista calma, a destra la consolle del DJ (x 218…296): la pedana sta al centro, la porta del backstage e il contatore sulla destra, il DJ a sinistra.

Due tele: **`g.ctx`** (sotto) con la parte fissa, disegnata **una volta sola** all'avvio; una tela **`g.nuovaTela()`** (sopra) ridisegnata a ogni fotogramma con tutto il resto. Ordine:

1. *(fisso, `g.ctx`)* pavimento, strisce gialle e freccia, croci di nastro, truss, vano buio della porta;
2. *(ogni fotogramma)* i pezzi (prima quelli fermi, poi quelli che scivolano, per ultimo quello trascinato), con cornici di selezione o d'errore;
3. il flight case che esce dalla porta (solo durante la vittoria);
4. le listelle della porta, l'architrave, il montante e la soglia (sopra al flight case che esce);
5. l'insegna BACKSTAGE e il lampeggiante;
6. il contatore delle mosse;
7. lo scheletro DJ, il suo «!» e le note.

Tutto a coordinate intere, solo `rett`, `riquadro`, `sprite`, `testo` del kit. Unica eccezione ammessa: per tagliare il flight case che esce si usa un ritaglio rettangolare (`ctx.save(); ctx.beginPath(); ctx.rect(0, 0, 258, 180); ctx.clip(); … ctx.restore();`), che non smussa niente. Colori: solo `EscapeDemo.C` e `EscapeDemo.GEMME` (tutti quelli sotto lo sono).

### Misure

`CELLA = 28`, angolo della tavola `X0 = 86`, `Y0 = 34`: la tavola occupa x 86…225, y 34…145. La casella `(x, y)` ha l'angolo in `(86 + 28x, 34 + 28y)`; lo sprite di un pezzo si disegna a `(86 + 28x + 1, 34 + 28y + 1)` ed è grande `28w − 2` × `28h − 2` (fra due pezzi vicini restano 2 pixel di pavimento). La zona di arrivo del flight case sono le caselle da (3, 2) a (4, 3): x 170…225, y 90…145. Tutto sta dentro l'area di gioco; solo i due cavi del contatore partono da y 16.

```
 y 16  cavi ┐                                               ┌ cavi
 y 28  ┌──────── truss 152×6 ────────┐            ┌─ contatore 244…311 × 30…55 ─┐
 y 34  │ F F │ … tavola 5×4 …        │            └──────────────────────────────┘
       │                             │   lampeggiante 241…248 × 66…71
       │                             │   insegna BACKSTAGE 225…265 × 73…82
 y 84  │                             ├─ architrave 226…263 ──┐
 y 90  │               ┌ zona gialla │ vano 232…257 listelle │ montante 258…263
 y146  └──────── truss ┴─────────────┘ soglia 232…257 ───────┘
       DJ (36…51 × 124…148)   x 80                    x 231
```

### Parte fissa (una volta, su `g.ctx`)

```js
const { C, GEMME, rett, riquadro, sprite, testo } = EscapeDemo;
// pavimento a assi (anche nella soglia della porta, x 226…231 sulle righe 2-3)
rett(ctx, C.legnoScuro, 86, 34, 140, 112);
rett(ctx, C.legnoScuro, 226, 90, 6, 56);
for (let j = 0; j < 16; j++) {
  const y = 34 + j * 7, w = 140 + (j >= 8 ? 6 : 0);
  rett(ctx, C.bordo, 86, y, w, 1);
  if (j % 2) rett(ctx, C.legno, 86, y + 1, w, 1);
  for (let x = 92 + ((j * 23) % 41); x < 226; x += 41) rett(ctx, C.bordo, x, y + 1, 1, 6); // giunte delle assi
}
// strisce gialle e nere sui lati sinistro, alto e basso della zona di arrivo (2 pixel)
for (let y = 90; y < 146; y++) for (let x = 170; x < 226; x++)
  if (x < 172 || y < 92 || y >= 144) rett(ctx, (x + y) % 4 < 2 ? C.giallo : C.bordo, x, y, 1, 1);
sprite(ctx, FRECCIA, { "#": C.oroScuro, o: C.oro }, 191, 113); // freccia dipinta verso la porta
// croci di nastro grigio agli incroci interni della griglia (tranne il centro della zona, dove c'è la freccia)
for (let i = 1; i < 5; i++) for (let j = 1; j < 4; j++) {
  if (i === 4 && j === 3) continue;
  const cx = 86 + i * 28, cy = 34 + j * 28;
  rett(ctx, C.ferro, cx - 3, cy - 1, 6, 2); rett(ctx, C.ferro, cx - 1, cy - 3, 2, 6);
}
// truss di alluminio: due correnti chiari e una reticella a zig-zag in mezzo
function trussO(x, y, w) {
  rett(ctx, C.bordo, x, y, w, 6); rett(ctx, C.pietraChiara, x, y + 1, w, 1); rett(ctx, C.ferroChiaro, x, y + 4, w, 1);
  for (let i = 0; i < w; i++) {
    const m = (x + i) % 4;
    rett(ctx, m === 0 || m === 3 ? C.pietra : C.bordo, x + i, y + 2, 1, 1);
    rett(ctx, m === 1 || m === 2 ? C.pietra : C.bordo, x + i, y + 3, 1, 1);
  }
}
function trussV(x, y, h) {
  rett(ctx, C.bordo, x, y, 6, h); rett(ctx, C.pietraChiara, x + 1, y, 1, h); rett(ctx, C.ferroChiaro, x + 4, y, 1, h);
  for (let j = 0; j < h; j++) {
    const m = (y + j) % 4;
    rett(ctx, m === 0 || m === 3 ? C.pietra : C.bordo, x + 2, y + j, 1, 1);
    rett(ctx, m === 1 || m === 2 ? C.pietra : C.bordo, x + 3, y + j, 1, 1);
  }
}
function piastra(x, y) { // giunto 6×6 con il bullone
  riquadro(ctx, x, y, 6, 6, C.pietraChiara);
  rett(ctx, C.bianco, x + 1, y + 1, 1, 1);
  rett(ctx, C.pietra, x + 4, y + 1, 1, 4); rett(ctx, C.pietra, x + 1, y + 4, 4, 1);
  rett(ctx, C.ferroChiaro, x + 2, y + 2, 2, 2);
}
trussO(80, 28, 152); trussO(80, 146, 152); trussV(80, 28, 124); trussV(226, 28, 62); // a destra si ferma: lì c'è la porta
piastra(80, 28); piastra(226, 28); piastra(80, 146); piastra(226, 146);
rett(ctx, C.nero, 232, 90, 26, 56); // il vano buio della porta del backstage
```

`piastra` serve anche sopra, sull'architrave della porta.

### Parte che si ridisegna (ogni fotogramma, sulla tela di sopra)

**Pezzi.** Sprite qui sotto (sezione «Sprite»), uno per tipo, con questi colori:

```js
const CONO = { k: C.bordo, n: C.nero, a: C.nero, b: C.ferro, c: C.ferroChiaro, d: C.pietra, e: C.pietraChiara };
const COLORI = {
  cassa:     { ...CONO, L: C.lilla, M: C.viola, D: C.violaScuro, g: C.acqua },                              // viola
  subwoofer: { ...CONO, L: GEMME.smeraldo[2], M: GEMME.smeraldo[1], D: GEMME.smeraldo[0], g: C.giallo },   // verde
  spia:      { ...CONO, L: GEMME.zaffiro[2], M: GEMME.zaffiro[1], D: GEMME.zaffiro[0], g: C.rosa },        // blu
  flight:    { k: C.bordo, n: C.nero, p: C.pietra, q: C.pietraChiara, f: C.ferroChiaro, M: C.tappetoChiaro,
               L: GEMME.rubino[2], D: C.tappeto, w: C.bianco, o: C.oro, O: C.oroScuro, y: C.giallo, r: C.rosa },
};
```

Ogni tipo ha forma e colore suoi (viola, verde, blu, rosso con l'alluminio): si riconoscono anche senza i colori, dalla misura. Pezzi dello stesso tipo sono identici, come nella logica. Il **led** (`g`) di casse, subwoofer e spie lampeggia: acceso se `(g.fotogramma + i * 3) % 8 < 6`, dove `i` è l'indice del pezzo nell'array; spento si disegna con il colore `D` del pezzo.

**Porta del backstage** (dopo i pezzi e dopo il flight case che esce):

```js
// listelle di plastica traslucide: il bordo chiaro pieno, il resto a scacchiera (si vede quello che c'è dietro)
for (let i = 0; i < 5; i++) {
  const sx = 233 + i * 5;
  for (let y = 90; y < 143; y++) {
    rett(ctx, C.pietra, sx, y, 1, 1);
    for (let x = sx + 1; x < sx + 4; x++) if ((x + y) % 2 === 0) rett(ctx, C.ferroChiaro, x, y, 1, 1);
  }
}
riquadro(ctx, 226, 84, 38, 6, C.ferro); rett(ctx, C.ferroChiaro, 227, 85, 36, 1); piastra(226, 84); // architrave
riquadro(ctx, 258, 84, 6, 68, C.ferro); rett(ctx, C.ferroChiaro, 259, 85, 1, 66);                // montante
riquadro(ctx, 232, 146, 26, 6, C.ferro); rett(ctx, C.ferroChiaro, 233, 147, 24, 1);              // soglia
for (let x = 233; x < 257; x++) rett(ctx, (x >> 1) % 2 ? C.giallo : C.bordo, x, 149, 1, 1);
```

**Insegna e lampeggiante.** Insegna al neon: `riquadro(ctx, 225, 73, 41, 10, C.nero)`; poi la scritta `BACKSTAGE` (carattere piccolo, `allinea: "centro"`, `ombra: null`) quattro volte spostata di un pixel (x 245 ± 1 con y 75, e x 245 con y 75 ± 1) nel colore dell'alone, e una volta a (245, 75) nel colore pieno. Prima della vittoria: alone `C.tappeto`, scritta `C.rosa`; dopo: alone `GEMME.acquamarina[0]`, scritta `C.acqua`. Facoltativo: un fotogramma ogni 48 il neon «sfarfalla» (solo l'alone, senza scritta piena). Lampeggiante: `rett(ctx, C.ferro, 240, 72, 10, 1)`, `riquadro(ctx, 241, 66, 8, 6, fondo)`, `rett(ctx, luce, 242, 67, 2, 1)`. Prima della vittoria lampeggia: acceso (`g.fotogramma % 8 < 4`) fondo `C.tappetoChiaro` e luce `GEMME.rubino[2]`, spento fondo e luce `C.tappeto`. Dopo: fisso, fondo `GEMME.smeraldo[2]` e luce `C.bianco`.

**Contatore appeso** (sullo stile del display della consolle):

```js
rett(ctx, C.bordo, 252, 16, 1, 14); rett(ctx, C.bordo, 303, 16, 1, 14);           // i due cavi
riquadro(ctx, 244, 30, 68, 26, C.ferro); rett(ctx, C.ferroChiaro, 245, 31, 66, 1);
riquadro(ctx, 247, 33, 62, 20, C.nero);
testo(ctx, "MOSSE", 278, 35, { piccolo: true, colore: C.ferroChiaro, ombra: null, allinea: "centro" });
testo(ctx, `${mosseMostrate}/100`, 278, 43, { colore, ombra: null, allinea: "centro" });
```

`colore`: `C.acqua` sotto 85 mosse; `C.giallo` da 85 a 94; da 95 in su `C.tappetoChiaro` che lampeggia (spento = `C.tappeto` quando `g.fotogramma % 4 >= 2`). Durante l'animazione dell'errore mostra «100/100» in `C.tappetoChiaro`, poi «0/100».

**Lo scheletro DJ** (il padrone del flight case, impaziente, a braccia conserte): ombra `rett(ctx, C.bordo, 37, 148, 14, 2)`, sprite a `(36, 124)` con

```js
const COLORI_DJ = { k: C.bordo, n: C.nero, w: C.pietraChiara, W: C.pietra, h: C.ferroChiaro, r: C.rosa, R: C.tappetoChiaro };
```

### Stati visivi

- **Normale**: come sopra. Il DJ batte il piede: `DJ_BATTE` quando `Math.floor(g.fotogramma / 2) % 2 === 1`, altrimenti `DJ`.
- **Selezionato**: cornice di 1 pixel `C.giallo` sul bordo della sua area di caselle, cioè il rettangolo `(86 + 28x, 34 + 28y, 28w, 28h)` disegnato come quattro `rett` di 1 pixel (cade nel pavimento fra i pezzi). Segue il pezzo mentre scivola o è trascinato.
- **Trascinato**: il pezzo segue il dito lungo l'asse (vedi interfaccia), sopra tutti gli altri, con la cornice gialla.
- **Colpo** (mossa rifiutata perché bloccata): il pezzo si sposta di 2 pixel verso la direzione voluta e torna indietro in 160 ms. Nessun errore.
- **Errore del tetto** (la logica è già azzerata; il disegno racconta): da 0 a 450 ms i pezzi restano nella posizione raggiunta con la centesima mossa, con una cornice `C.tappetoChiaro` (stesso rettangolo della selezione) visibile da 0 a 150 e da 300 a 450 ms; il contatore dice «100/100» in rosso; sopra il DJ compare un «!» (`testo(ctx, "!", 43, 112, { colore: C.tappetoChiaro })`) per 1200 ms e lui batte il piede a ogni fotogramma. Da 450 a 800 ms ogni pezzo scivola in linea retta (interpolazione lineare, pixel arrotondati) dalla sua posizione alla casella di partenza; poi il contatore dice «0/100».
- **Vittoria**: il flight case, già nella zona gialla (se ci stava ancora scivolando, si parte quando è arrivato), scivola verso destra da x 171 a x 261 in 700 ms (accelera: `x = 171 + round(90 × k²)`, `k` da 0 a 1), tagliato a x < 258 con il ritaglio rettangolare e disegnato **prima** delle listelle, che gli restano davanti traslucide. A 700 ms sparisce, il lampeggiante diventa verde fisso e l'insegna `C.acqua`. Da lì il DJ balla (sprite `DJ`, alzato di 2 pixel quando `Math.floor(g.fotogramma / 2) % 2 === 1`) e tre note salgono sopra di lui: sprite `NOTA` nei colori `C.giallo`, `C.acqua`, `C.rosa`, partenze (28, 114), (54, 108), (40, 100); ognuna sale di 1 pixel a fotogramma per 12 fotogrammi e riparte dalla sua partenza, sfasate di 4 fotogrammi.
- **Già risolto**: posizione salvata senza flight case, lampeggiante verde, insegna `C.acqua`, il DJ che balla con le note.

### Animazioni e meno movimento

Continue a 8 fotogrammi al secondo (`g.fotogramma`): led dei pezzi, lampeggiante, piede del DJ, contatore rosso, neon, ballo e note dopo la vittoria. Gli spostamenti dei pezzi su pixel interi: 120 ms dopo un trascinamento, `min(300, 120 + 60 × passi)` ms con i due tocchi o con `gioca`, curva che rallenta all'arrivo. Con `g.riduciMovimento`: ogni pezzo salta subito alla posizione finale (anche nell'errore e nella vittoria: il flight case sparisce subito), niente animazioni continue (led accesi, lampeggiante fisso, DJ fermo con `DJ`, note ferme nelle loro partenze dopo la vittoria), il «!» resta 1200 ms fermo.

### Sprite

Già disegnati e controllati (righe tutte della stessa lunghezza). Si disegnano con `EscapeDemo.sprite(ctx, righe, colori, x, y)`; `.` è vuoto.

Cassa, 26 × 54 (tweeter, due woofer, led in alto a destra, fianco scuro e piedini in basso):

```js
const CASSA = [
  "kkkkkkkkkkkkkkkkkkkkkkkkkk",
  "kLLLLLLLLLLLLLLLLLLLLLLLLk",
  "kLMMMMMMMMMMMMMMMMMMMMMMDk",
  "kLMMMMMMMMMMMMMMMMMMMMMMDk",
  "kLMMMMMMMMMkkkkMMMMMggMMDk",
  "kLMMMMMMMMkbbbakMMMMggMMDk",
  "kLMMMMMMMkbbccaakMMMMMMMDk",
  "kLMMMMMMMkbcedbakMMMMMMMDk",
  "kLMMMMMMMkbcddbakMMMMMMMDk",
  "kLMMMMMMMkaabbaakMMMMMMMDk",
  "kLMMMMMMMMkaaaakMMMMMMMMDk",
  "kLMMMMMMMMMkkkkMMMMMMMMMDk",
  "kLMMMMMMMMMMMMMMMMMMMMMMDk",
  "kLMMMMMMMMMMMMMMMMMMMMMMDk",
  "kLMMMMMMMMMkkkkMMMMMMMMMDk",
  "kLMMMMMMMkkbbbakkMMMMMMMDk",
  "kLMMMMMkkbbccccaakkMMMMMDk",
  "kLMMMMMkbcccccccbakMMMMMDk",
  "kLMMMMkbcccccccbbbakMMMMDk",
  "kLMMMMkbccceeddbbbakMMMMDk",
  "kLMMMkbccceeedddbbbakMMMDk",
  "kLMMMkbccceeedddbbbakMMMDk",
  "kLMMMkbcccddddddbbbakMMMDk",
  "kLMMMkacccddddddbbbakMMMDk",
  "kLMMMMkacbbddddbbbakMMMMDk",
  "kLMMMMkabbbbbbbbbbakMMMMDk",
  "kLMMMMMkabbbbbbbbakMMMMMDk",
  "kLMMMMMkkaabbbbaakkMMMMMDk",
  "kLMMMMMMMkkaaaakkMMMMMMMDk",
  "kLMMMMMMMMMkkkkMMMMMMMMMDk",
  "kLMMMMMMMMMMMMMMMMMMMMMMDk",
  "kLMMMMMMMMMkkkkMMMMMMMMMDk",
  "kLMMMMMMMkkbbbakkMMMMMMMDk",
  "kLMMMMMkkbbccccaakkMMMMMDk",
  "kLMMMMMkbcccccccbakMMMMMDk",
  "kLMMMMkbcccccccbbbakMMMMDk",
  "kLMMMMkbccceeddbbbakMMMMDk",
  "kLMMMkbccceeedddbbbakMMMDk",
  "kLMMMkbccceeedddbbbakMMMDk",
  "kLMMMkbcccddddddbbbakMMMDk",
  "kLMMMkacccddddddbbbakMMMDk",
  "kLMMMMkacbbddddbbbakMMMMDk",
  "kLMMMMkabbbbbbbbbbakMMMMDk",
  "kLMMMMMkabbbbbbbbakMMMMMDk",
  "kLMMMMMkkaabbbbaakkMMMMMDk",
  "kLMMMMMMMkkaaaakkMMMMMMMDk",
  "kLMMMMMMMMMkkkkMMMMMMMMMDk",
  "kLMMMMMMMMMMMMMMMMMMMMMMDk",
  "kkkkkkkkkkkkkkkkkkkkkkkkkk",
  "kDDDDDDDDDDDDDDDDDDDDDDDDk",
  "kDDDDDDDDDDDDDDDDDDDDDDDDk",
  "kDDDDDDDDDDDDDDDDDDDDDDDDk",
  "kDDnnnnDDDDDDDDDDDDnnnnDDk",
  "kkkkkkkkkkkkkkkkkkkkkkkkkk",
];
```

Subwoofer, 54 × 26 (un cono grande al centro, due bocche reflex, viti, led):

```js
const SUBWOOFER = [
  "kkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkk",
  "kLLLLLLLLLLLLLLLLLLLLLLLLkkkkLLLLLLLLLLLLLLLLLLLLLLLLk",
  "kLMMMMMMMMMMMMMMMMMMMMkkkbbbbkkkMMMMMMMMMMMMMMMMMMMMDk",
  "kLMMDMMMMMMMMMMMMMMMMkbbbbbbaaaakMMMMMMMMMMMMMMggDMMDk",
  "kLMMMMMMMMMMMMMMMMMMkbbbbccccaaaakMMMMMMMMMMMMMggMMMDk",
  "kLMMMMMMMMMMMMMMMMMkbbbcccccccbaaakMMMMMMMMMMMMMMMMMDk",
  "kLMMMMMMMMMMMMMMMMMkbbcccccccbbbaakMMMMMMMMMMMMMMMMMDk",
  "kLMMMMMMkkMMMMMMMMMkbbccceeddbbbaakMMMMMMMMMkkMMMMMMDk",
  "kLMMMMMkaakMMMMMMMkbbccceeedddbbbaakMMMMMMMkaakMMMMMDk",
  "kLMMMMkaaaakMMMMMMkbbccceeedddbbbaakMMMMMMkaaaakMMMMDk",
  "kLMMMMkaaaakMMMMMMkbbcccddddddbbbaakMMMMMMkaaaakMMMMDk",
  "kLMMMMMkaakMMMMMMMkbacccddddddbbbaakMMMMMMMkaakMMMMMDk",
  "kLMMMMMMkkMMMMMMMMMkaacbbddddbbbaakMMMMMMMMMkkMMMMMMDk",
  "kLMMMMMMMMMMMMMMMMMkaabbbbbbbbbbaakMMMMMMMMMMMMMMMMMDk",
  "kLMMMMMMMMMMMMMMMMMkaaabbbbbbbbaaakMMMMMMMMMMMMMMMMMDk",
  "kLMMMMMMMMMMMMMMMMMMkaaaabbbbaaaakMMMMMMMMMMMMMMMMMMDk",
  "kLMMMMMMMMMMMMMMMMMMMkaaaaaaaaaakMMMMMMMMMMMMMMMMMMMDk",
  "kLMMDMMMMMMMMMMMMMMMMMkkkaaaakkkMMMMMMMMMMMMMMMMMDMMDk",
  "kLMMMMMMMMMMMMMMMMMMMMMMMkkkkMMMMMMMMMMMMMMMMMMMMMMMDk",
  "kLMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMDk",
  "kkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkk",
  "kDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDk",
  "kDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDk",
  "kDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDk",
  "kDDnnnnDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDnnnnDDk",
  "kkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkk",
];
```

Spia, 26 × 26 (la spia da palco, con gli angoli in alto smussati):

```js
const SPIA = [
  ".kkkkkkkkkkkkkkkkkkkkkkkk.",
  "kkLLLLLLLLLLLLLLLLLLLLLLkk",
  "kLMMMMMMMMMMMMMMMMMMMMMMDk",
  "kLMMMMMMMMMkkkkMMMMMMggMDk",
  "kLMMMMMMMkkbbbakkMMMMggMDk",
  "kLMMMMMMkbbccccaakMMMMMMDk",
  "kLMMMMMkbccccccbbakMMMMMDk",
  "kLMMMMMkbcccedbbbakMMMMMDk",
  "kLMMMMkbccceeddbbbakMMMMDk",
  "kLMMMMkbcceeedddbbakMMMMDk",
  "kLMMMMkbccddddddbbakMMMMDk",
  "kLMMMMkaccbddddbbbakMMMMDk",
  "kLMMMMMkabbbddbbbakMMMMMDk",
  "kLMMMMMkabbbbbbbbakMMMMMDk",
  "kLMMMMMMkaabbbbaakMMMMMMDk",
  "kLMMMMMMMkkaaaakkMMMMMMMDk",
  "kLMMMMMMMMMkkkkMMMMMMMMMDk",
  "kLMMMMMMMMMMMMMMMMMMMMMMDk",
  "kLMMMMMMMMMMMMMMMMMMMMMMDk",
  "kLMMMMMMMMMMMMMMMMMMMMMMDk",
  "kkkkkkkkkkkkkkkkkkkkkkkkkk",
  "kDDDDDDDDDDDDDDDDDDDDDDDDk",
  "kDDDDDDDDDDDDDDDDDDDDDDDDk",
  "kDDDDDDDDDDDDDDDDDDDDDDDDk",
  "kDDnnnnDDDDDDDDDDDDnnnnDDk",
  "kkkkkkkkkkkkkkkkkkkkkkkkkk",
];
```

Flight case, 54 × 54 (profili e angolari di alluminio, chiusure a farfalla, maniglia, teschio adesivo, scritta DJ a stampino):

```js
const FLIGHT = [
  "kkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkk",
  "kqqqqqpkqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqkqqqqqpk",
  "kqwqqppkppppppppppppppppppppppppppppppppppppppkqwqqppk",
  "kqqqqppkppppppppppppppppppppppppppppppppppppppkqqqqppk",
  "kqqqpppkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkqqqpppk",
  "kqpppppkLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLkqpppppk",
  "kppppffkMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMkppppffk",
  "kkkkkkkkMMMMMMDMMMMMMDMMMMMMDMMMMMMDMMMMMMDMMMkkkkkkkk",
  "kqppkLMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMDkppfk",
  "kqppkLMMMMDMMMMMMDMMMMMMDMMMMMMDMMMMMMDMMMMMMDMMDkppfk",
  "kqppkLMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMDkppfk",
  "kqppkLDMMMMMMDMMMMMMDMMMMMMDMMMMMMDMMMMMMDMMMMMMDkppfk",
  "kqppkLMMMMkkkkkMMMMMkkkkkkkkkkkkkkMMMMMMMMMMMMMMDkppfk",
  "kqppkLMMMkwwwwwkDMMMknnnnnnnnnnnnkMMMDkkkkkkDMMMDkppfk",
  "kqppkLMMMkwkwkwkMMMMknqqqqqqqqqqnkMMMMkyyyykMMMMDkppfk",
  "kqppkLMMMkwwwwwkMMMDknppppppppppnkMMMMkyrrykMMMDDkppfk",
  "kqppkLMMMMkwkwkMMMMMknnnnnnnnnnnnkMMMMkyyyykMMMMDkppfk",
  "kqppkLMMDMMkkkMDMMMMkkkkkkkkkkkkkkMMDMkkkkkkMMMMDkppfk",
  "kqppkLMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMDkppfk",
  "kqppkLMMMMMDMMMMMMDMMMMMMDMMMMMMDMMMMMMDMMMMMMDMDkppfk",
  "kqppkLMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMDkppfk",
  "kqppkLMDMMMMMMDMMMMMMDMMMMMMDMMMMMMDMMMMMMDMMMMMDkppfk",
  "kqppkLMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMDkppfk",
  "kqppkLMMMMDMMMMMMDMMMMMMDMMMMMMDMMMMMMDMMMMMMDMMDkppfk",
  "kkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkk",
  "kqqqqqqqqqkooooOOkqqqqqqqqqqqqqqqqqqkooooOOkqqqqqqqqqk",
  "kpppppppppkoOkkoOkppppppppppppppppppkoOkkoOkpppppppppk",
  "kfffffffffkooooOOkffffffffffffffffffkooooOOkfffffffffk",
  "kkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkk",
  "kqppkLMMMMMMDMMMMMMDMMMMMMDMMMMMMDMMMMMMDMMMMMMDDkppfk",
  "kqppkLMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMDkppfk",
  "kqppkLMMDMMMMMMDMMMMMMDMMMMMMDMMMMMMDMMMMMMDMMMMDkppfk",
  "kqppkLMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMDkppfk",
  "kqppkLMMMMMDMMMMwwwwwwwwMDMMMMMMwwwwwwMDMMMMMMDMDkppfk",
  "kqppkLMMMMMMMMMMwwwwwwwwDMMMMMMMwwwwwwDMMMMMMMMMDkppfk",
  "kqppkLMDMMMMMMDMwwDDDDDDwwMMDMMMMDwwDDDMMMDMMMMMDkppfk",
  "kqppkLMMMMMMMMMMwwDMMMMMwwDMMMMMMMwwDMMMMMMMMMMMDkppfk",
  "kqppkLMMMMDMMMMMwwDMMMMMwwDMMMMDMMwwDMDMMMMMMDMMDkppfk",
  "kqppkLMMMMMMMMMMwwDMMMMMwwDMMMMMMMwwDMMMMMMMMMMMDkppfk",
  "kqppkLDMMMMMMDMMwwDMDMMMwwDDMMMMMMwwDMMMMDMMMMMMDkppfk",
  "kqppkLMMMMMMMMMMwwDMMMMMwwDMMMMMMMwwDMMMMMMMMMMMDkppfk",
  "kqppkLMMMDMMMMMMwwDMMMMDwwDMMMDMMMwwDDMMMMMMDMMMDkppfk",
  "kqppkLMMMMMMMMMMwwDMMMMMwwDMMMMMMMwwDMMMMMMMMMMMDkppfk",
  "kqppkLMMMMMMDMMMwwDDMMMMwwDMwwMMMDwwDMMMDMMMMMMDDkppfk",
  "kqppkLMMMMMMMMMMwwDMMMMMwwDMwwDMMMwwDMMMMMMMMMMMDkppfk",
  "kqppkLMMDMMMMMMDwwwwwwwwMDDMMDwwwwMDDMMMMMMDMMMMDkppfk",
  "kkkkkkkkMMMMMMMMwwwwwwwwDMMMMMwwwwDMMMMMMMMMMMkkkkkkkk",
  "kqqqqqpkMMMDMMMMMDDDDDDDDDMMMMMDDDDMMMMDMMMMMMkqqqqqpk",
  "kqwqqppkDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDkqwqqppk",
  "kqqqqppkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkqqqqppk",
  "kqqqpppkppppppppppppppppppppppppppppppppppppppkqqqpppk",
  "kqpppppkppppppppppppppppppppppppppppppppppppppkqpppppk",
  "kppppffkffffffffffffffffffffffffffffffffffffffkppppffk",
  "kkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkk",
];
```

Lo scheletro DJ, 16 × 25 (lo scheletro a braccia conserte della mappa, con cuffie rosa e occhiali scuri), fermo e col piede alzato:

```js
const DJ = [
  "....kkkkkkkk....",
  "...khhhhhhhhk...",
  "..kh.kkkkkk.hk..",
  "..khkwwwwwwkhk..",
  ".kkkwwwwwwWWkkk.",
  ".krkkkkkkkkWkrk.",
  ".krknnwwnnwWkrk.",
  ".kRkwwwnwwwWkRk.",
  ".kkkkwwwwwWkkkk.",
  "....kwkwkwk.....",
  ".....kkkkk......",
  "......kwk.......",
  "...kkwwwwwkk....",
  "..kwkwkwkwkwk...",
  "..kwwwwwwwwwk...",
  "..kWkwwwwwkWk...",
  "...kkwkwkwkk....",
  ".....kwwwk......",
  "....kwwwwwk.....",
  "....kwk.kwk.....",
  "....kwk.kwk.....",
  "....kwk.kwk.....",
  "....kwk.kwk.....",
  "...kwwk.kwwk....",
  "...kkkk.kkkk....",
];
const DJ_BATTE = [ // uguale a DJ nelle prime 19 righe
  ...DJ.slice(0, 19),
  "....kwk.kwk.....",
  "....kwk..kwk....",
  "....kwk..kwk....",
  "....kwk.kwwk....",
  "...kwwk.kkk.....",
  "...kkkk.........",
];
```

Nota musicale 5 × 7 (colore unico, senza contorno) e freccia dipinta sul pavimento 14 × 9:

```js
const NOTA = ["..##.", "..#.#", "..#..", "..#..", ".##..", "###..", ".#..."];
const FRECCIA = [
  ".........#....",
  ".........##...",
  ".........###..",
  "ooooooooooooo.",
  "##############",
  "#############.",
  ".........###..",
  ".........##...",
  ".........#....",
];
```

## 6. Aggancio per le prove

```js
g.espone({
  gioca: (mossa) => …,           // la stessa funzione chiamata da trascinamenti, due tocchi e tastiera
  statoGioco: () => …,
  posizione: (x, y) => ({ x: 86 + 28 * x + 14, y: 34 + 28 * y + 14 }), // centro della casella, pixel della scena
});
```

- **`gioca({ x, y, dir, passi })`** → esattamente uno di:
  - `{ valida: false, motivo: "formato" | "vuota" | "bloccata" }` (nessun cambiamento);
  - `{ ok: true, mosse: n }`;
  - `{ errore: true, motivo: "tetto", mosse: 0 }` (la centesima mossa senza soluzione: errore contato, tutto all'inizio);
  - `{ risolto: true, mosse: n }`.
  Aggiorna stato, memoria, contatore e fumetto subito, come un tocco vero (le animazioni vengono dopo).
- **`statoGioco()`** → `{ righe: [4 stringhe], pezzi: [{ id, tipo, x, y, w, h }], mosse, tetto: 100, minimo: 34, risolto, selezionato }`, con le posizioni **logiche** (dopo la vittoria il flight case è in (3, 2) anche se non si disegna più) e `selezionato` = id del pezzo selezionato o `null`.
- **`posizione(x, y)`** → centro della casella `(x, y)`.

La verifica controlla anche: che `variante` abbia `disposizione`, `righe`, `pezzi` (id e ordine come in §2), `minimo: 34`, `tetto: 100`, `meta: { x: 3, y: 2 }`; che la disposizione sia una delle 12; un trascinamento vero da centro a centro di casella; i due tocchi (pezzo, poi la casella libera più lontana che il pezzo copre dopo la mossa); che ricaricando restino posizione e mosse; il bottone `data-azione="da-capo"`; il tetto alla centesima mossa (toccando un pezzo lungo nella sua **seconda** casella); la soluzione minima giocata con `gioca` che finisce con `{ risolto: true, mosse: 34 }`.

## 7. Criteri di accettazione

Giocando e guardando le foto (`desktop`, `telefono`, `telefono-verticale`, `verifica-*`):

1. La pedana è al centro, dentro la cornice di truss; la porta del backstage con l'insegna rosa e il lampeggiante rosso è chiaramente in basso a destra; le strisce gialle segnano dove deve arrivare il flight case.
2. Si capisce al primo sguardo quale pezzo è il flight case (rosso, grande, con la scritta DJ) e che è chiuso nell'angolo; casse viola, subwoofer verdi e spie blu si distinguono anche sul telefono.
3. Fra i pezzi si vede sempre il pavimento (2 pixel); nessun pezzo esce dalla tavola o si sovrappone a un altro, nemmeno durante le animazioni.
4. Trascinando, il pezzo segue il dito solo lungo il suo asse e si ferma contro gli ostacoli; lasciato a metà fra due caselle va in quella più vicina. I due tocchi funzionano. Il pezzo selezionato ha la cornice gialla.
5. Il contatore dice «MOSSE n/100», cresce di 1 per spostamento anche se il pezzo scivola di più caselle, diventa giallo da 85 e rosso lampeggiante da 95.
6. Una mossa contro un ostacolo fa solo il «colpo»: nessun errore, il contatore resta fermo.
7. Alla centesima mossa senza soluzione: avviso del kit, cornici rosse, «!» sopra il DJ, i pezzi tornano al loro posto scivolando, contatore a 0. Ricaricando la pagina il contatore non riparte da 0 (se non dopo un errore).
8. «Da capo» rimette i pezzi ma non il contatore.
9. Alla vittoria il flight case passa dietro le listelle traslucide e sparisce; lampeggiante verde, insegna azzurra, il DJ balla con le note; poi la carta con le mosse fatte e il minimo 34.
10. Con «meno movimento» non resta nessun pezzo a metà e niente si muove da solo.
11. Nessun colore fuori da `C` e `GEMME`, niente testo HTML nella scena, niente linee o forme smussate.
12. `node demo/comune/prova.mjs casse-consolle` finisce con «TUTTO OK».
