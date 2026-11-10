# L'Angelo Azzurro — istruzioni per il costruttore

Sala Bar. Sul bancone ci sono uno shaker di vetro pieno di Angelo Azzurro (un cocktail blu) e due bicchieri vuoti senza tacche. Si versa da un contenitore all'altro finché il primo non si svuota o il secondo non si riempie, e bisogna dividere il drink a metà. Valgono le regole comuni (`../REGOLE_COMUNI.md`) e il kit (`../comune/kit.js`); qui c'è solo quello che è specifico di questo rompicapo.

`index.html` è la copia di `../_esempio/index.html` con `<title>L'Angelo Azzurro</title>`. Tutto il resto va in `gioco.js`.

```js
EscapeDemo.avvia(opzioni) // con opzioni = { id: "angelo-azzurro", sfondo: "sala-bar", velo: 0.5, variante, crea }
```

---

## 1. In breve

Il giocatore tocca un contenitore e poi quello in cui versarlo (oppure lo trascina sull'altro): il liquido passa finché il primo è vuoto o il secondo è pieno, e sotto ogni contenitore una targhetta dice quanti cl contiene. Si vince quando lo shaker e il bicchiere grande contengono metà drink ciascuno e il piccolo è vuoto (per esempio 6 + 6). I travasi a disposizione sono contati: se finiscono senza aver diviso il drink, o se si ricomincia da capo, è un errore.

---

## 2. Variante

Le capacità cambiano per giocatore. Si sceglie una delle sei **ricette** qui sotto, tutte già verificate con una ricerca in ampiezza su tutti gli stati (il minimo è il numero esatto di travasi della soluzione più corta). Il classico 8-5-3 (e i suoi multipli) è escluso apposta: la sua soluzione è ovunque in rete.

```js
// [shaker, bicchiere grande, bicchiere piccolo] e numero minimo di travasi. Non cambiare l'ordine: la verifica lo usa.
const RICETTE = [
  { capacita: [12, 8, 5], minimo: 7 },   // la ricetta della scheda
  { capacita: [10, 7, 3], minimo: 9 },
  { capacita: [12, 7, 5], minimo: 11 },
  { capacita: [14, 8, 3], minimo: 9 },
  { capacita: [12, 9, 5], minimo: 8 },
  { capacita: [16, 10, 3], minimo: 11 },
];

variante(rng) {
  const r = RICETTE[EscapeDemo.intero(rng, 0, RICETTE.length - 1)]; // UNA sola chiamata a rng, e nessun'altra
  return { capacita: [...r.capacita], meta: r.capacita[0] / 2, minimo: r.minimo, limite: r.minimo + 6 };
}
```

Formato esatto dell'oggetto `variante` (con queste chiavi, in quest'ordine):

```js
{ capacita: [12, 8, 5], meta: 6, minimo: 7, limite: 13 }
```

- `capacita[0]` = shaker (A), `capacita[1]` = bicchiere grande (B), `capacita[2]` = bicchiere piccolo (C).
- `meta` = A/2: alla fine ci devono essere `meta` cl nello shaker e `meta` nel bicchiere grande.
- `limite` = travasi a disposizione = minimo + 6.

Indici dei contenitori, usati ovunque (logica, aggancio, disegno): **0 = shaker, 1 = bicchiere grande, 2 = bicchiere piccolo.**

Soluzioni attese (S = shaker, G = grande, P = piccolo; nella colonna «Semi» alcuni semi che danno quella ricetta). Ne basta una qualsiasi lunga quanto il minimo: la verifica ne calcola una sua.

| Ricetta | Semi | Minimo | Limite | Una soluzione più corta (livelli S-G-P dopo ogni travaso) |
|---|---|---|---|---|
| 12-8-5 → 6+6 | 7, 8, 19 | 7 | 13 | 12-0-0 → 4-8-0 → 4-3-5 → 9-3-0 → 9-0-3 → 1-8-3 → 1-6-5 → 6-6-0 |
| 10-7-3 → 5+5 | 9, 12, 15 | 9 | 15 | 10-0-0 → 3-7-0 → 3-4-3 → 6-4-0 → 6-1-3 → 9-1-0 → 9-0-1 → 2-7-1 → 2-5-3 → 5-5-0 |
| 12-7-5 → 6+6 | 14, 18, 21 | 11 | 17 | 12-0-0 → 5-7-0 → 5-2-5 → 10-2-0 → 10-0-2 → 3-7-2 → 3-4-5 → 8-4-0 → 8-0-4 → 1-7-4 → 1-6-5 → 6-6-0 |
| 14-8-3 → 7+7 | 1, 6, 10 | 9 | 15 | 14-0-0 → 6-8-0 → 6-5-3 → 9-5-0 → 9-2-3 → 12-2-0 → 12-0-2 → 4-8-2 → 4-7-3 → 7-7-0 |
| 12-9-5 → 6+6 | 2, 3, 5 | 8 | 14 | 12-0-0 → 7-0-5 → 7-5-0 → 2-5-5 → 2-9-1 → 11-0-1 → 11-1-0 → 6-1-5 → 6-6-0 |
| 16-10-3 → 8+8 | 4, 30, 36, 12345 | 11 | 17 | 16-0-0 → 6-10-0 → 6-7-3 → 9-7-0 → 9-4-3 → 12-4-0 → 12-1-3 → 15-1-0 → 15-0-1 → 5-10-1 → 5-8-3 → 8-8-0 |

Il seme 12345 (quello delle foto di `prova.mjs`) dà 16-10-3; il 12346 dà 12-7-5.

### Testo della carta iniziale

La variante cambia i numeri, quindi il testo va adattato e passato al kit come `opzioni.testo`. Il kit lo legge solo quando mostra la carta, cioè **dopo** `crea(g)`: tieni l'oggetto delle opzioni in una costante e scrivilo dentro `crea`:

```js
const opzioni = { id: "angelo-azzurro", sfondo: "sala-bar", velo: 0.5, variante(rng) { … }, crea(g) {
  const { capacita: [A, B, C], meta: M, limite: L } = g.variante;
  opzioni.testo =
    `Lo scheletro barista ha uno shaker con ${A} cl di Angelo Azzurro e due bicchieri vuoti da ${B} e da ${C} cl, senza tacche. ` +
    `Deve dividere il drink a metà: ${M} cl nello shaker e ${M} nel bicchiere grande.\n` +
    `Si può solo versare da un contenitore all'altro finché il primo non si svuota o il secondo non si riempie.\n` +
    `Hai ${L} travasi: se finiscono prima, lo scheletro rimette tutto nello shaker e conta come un errore. ` +
    `Anche ricominciare da capo conta come un errore.`;
  …
} };
EscapeDemo.avvia(opzioni);
```

---

## 3. Regole e mosse

### Stato del rompicapo

```js
{ livelli: [A, 0, 0], travasi: 0, selezionato: null }
```

- `livelli`: cl interi in shaker, grande, piccolo. La somma resta sempre A.
- `travasi`: travasi fatti nel tentativo in corso (si azzera quando si riparte).
- `selezionato`: il contenitore preso con un tocco (null, 0, 1 o 2). È solo interfaccia, ma sta nello stato per l'aggancio.

Scrivi la logica come funzioni pulite (stato + mossa → nuovo stato ed esito), senza disegno né chiamate al kit dentro; una funzione a parte applica l'esito (`g.errore`, `g.risolto`, messaggi, animazioni, memoria). Esempio del nucleo:

```js
function versa(livelli, cap, da, a) {         // → { nuovi, q } oppure { motivo }
  if (![0, 1, 2].includes(da) || ![0, 1, 2].includes(a)) return { motivo: "mossa" };
  if (da === a) return { motivo: "stesso" };
  if (livelli[da] === 0) return { motivo: "vuoto" };
  if (livelli[a] === cap[a]) return { motivo: "pieno" };
  const q = Math.min(livelli[da], cap[a] - livelli[a]);
  const nuovi = [...livelli]; nuovi[da] -= q; nuovi[a] += q;
  return { nuovi, q };
}
```

### Le mosse

Ci sono due mosse. Sono le uniche cose che passano da `gioca(mossa)` e le stesse funzioni le chiamano i tocchi, il trascinamento e il bottone.

**Travaso `{ da, a }`** — nell'ordine:

1. Controlli (in quest'ordine): indici non validi → rifiutata `"mossa"`; `da === a` → rifiutata `"stesso"`; contenitore `da` vuoto → rifiutata `"vuoto"`; contenitore `a` pieno → rifiutata `"pieno"`. Una mossa rifiutata **non è un errore**, non conta come travaso e non cambia i livelli.
2. Si versa `q = min(livelli[da], capacita[a] − livelli[a])`, `travasi += 1`, `selezionato = null`.
3. Se `livelli[0] === meta && livelli[1] === meta` (il piccolo è per forza vuoto) → **risolto**.
4. Altrimenti, se `travasi >= limite` → **errore «limite»**: i livelli tornano `[A, 0, 0]` e `travasi = 0`. Quindi il travaso numero `limite` può ancora risolvere; se non risolve, scatta l'errore.
5. Altrimenti → travaso riuscito.

**Ricomincia `{ azione: "ricomincia" }`**:

- se `travasi === 0` → rifiutata `"inizio"` (niente errore, niente cambia);
- altrimenti → **errore «ricomincia»**: livelli `[A, 0, 0]`, `travasi = 0`, `selezionato = null`.

Qualsiasi altro oggetto (azione sconosciuta, `{}`) → rifiutata `"mossa"`.

### Errori (contano per le dorate)

La scheda dà 3 dorate e 2 errori concessi: col primo errore le dorate in palio restano 3, al secondo diventano 2, al quarto 1 (lo calcola il kit). Contano come errore **solo** queste due cose, con questi testi esatti per `g.errore`:

| Quando | `g.errore(…)` | Poi `g.messaggio(…)` |
|---|---|---|
| finiscono i travasi senza il drink diviso | `Finiti i travasi: lo scheletro rimette tutto nello shaker` | `Si riparte con lo shaker pieno: hai di nuovo ${limite} travasi.` |
| Ricomincia confermato con almeno un travaso fatto | `Ricominciare conta come un errore` | lo stesso |

### Risolto

`g.risolto({ riepilogo, ritardo: 1800 })` subito, nella stessa funzione della mossa (lo stato cambia subito; la carta arriva dopo la festa nella scena). Riepilogo:

- se `travasi === minimo`: `Hai diviso l'Angelo Azzurro in ${travasi} travasi: il minimo possibile!`
- altrimenti: `Hai diviso l'Angelo Azzurro in ${travasi} travasi (il minimo era ${minimo}).`

### Memoria (ricaricare non deve regalare una ripartenza)

Dopo ogni cambiamento di livelli o travasi (travaso, errore, ricomincia, soluzione) scrivi `g.memoria.livelli = [...livelli]`, `g.memoria.travasi = travasi` e chiama `g.salvaMemoria()`.

All'avvio, se **non** è già risolto e `g.memoria` contiene `livelli` validi (3 interi, ognuno fra 0 e la sua capacità, somma A, diversi da `[meta, meta, 0]`) e `travasi` intero con `0 ≤ travasi < limite`, riparti da lì; altrimenti da `[A, 0, 0]` con 0 travasi. `selezionato` parte sempre da null.

### Già risolto (`g.giaRisolto`)

Livelli `[meta, meta, 0]`, la lavagna dice `SALUTE!`, lo scheletro ha gli occhi gialli, le stelline luccicano (vedi Grafica). Messaggio: `Il drink è già diviso a metà: salute!`. L'input lo blocca il kit.

---

## 4. Interfaccia

### Zone di tocco

Ogni contenitore ha una zona fissa, più grande del disegno: **x da cx−18 a cx+18, y da 30 a 134**, con `cx = 110` (shaker), `160` (grande), `208` (piccolo). La zona comprende anche la targhetta sotto il contenitore. Le tre zone non si toccano fra loro.

```js
const CX = [110, 160, 208];
const zona = (x, y) => { for (let i = 0; i < 3; i++) if (Math.abs(x - CX[i]) <= 18 && y >= 30 && y <= 134) return i; return null; };
```

### Tocchi e trascinamento (con `g.tocca`)

- **giu**: `premuto = zona(x, y)`, ricorda il punto di partenza, `trascinando = false`. Annulla la conferma di Ricomincia se era in corso.
- **muovi** con `premuto` non null e il tasto giù: se ci si è spostati di più di 4 pixel della scena dal punto di partenza, `trascinando = true`; `sopra = zona(x, y)`.
- **su**:
  - se `trascinando`: se `zona(x, y)` è un contenitore diverso da `premuto`, travaso `{ da: premuto, a: quella zona }`; in ogni caso `selezionato = null`;
  - altrimenti è un **tocco** su `premuto` (che può essere null).
  - Poi `premuto = sopra = null`, `trascinando = false`.

**Tocco** sul contenitore `i`:

- `i` null (fuori dalle zone) → `selezionato = null`; se c'era una selezione torna il messaggio iniziale.
- nessuna selezione: se il contenitore `i` è vuoto non si prende (messaggio «vuoto» e la scossetta del contenitore, vedi Grafica, niente errore); altrimenti `selezionato = i` e messaggio «preso».
- `i === selezionato` → si posa (`selezionato = null`), messaggio iniziale.
- altrimenti → travaso `{ da: selezionato, a: i }` (la selezione si azzera comunque).

Tastiera facoltativa: i tasti `1`, `2`, `3` fanno un tocco sullo shaker, sul grande e sul piccolo.

### Bottone

Uno solo: `g.bottone("Ricomincia", …, { id: "ricomincia" })`.

- Con `travasi === 0` il tocco chiama subito la mossa `{ azione: "ricomincia" }`, che viene rifiutata e mostra il messaggio «già all'inizio».
- Con almeno un travaso, il **primo tocco** non fa la mossa: il bottone diventa `Conferma` (cambia solo il testo, l'`id` resta `ricomincia`) e il fumetto chiede conferma. Il **secondo tocco** entro 4 secondi chiama la mossa `{ azione: "ricomincia" }` (errore). Dopo 4 secondi senza conferma, o a qualsiasi tocco sulla scena o mossa, il bottone torna `Ricomincia` (e il fumetto torna al messaggio iniziale, se la conferma è scaduta da sola).
- Con `g.giaRisolto` il bottone nasce disabilitato (`btn.disabled = true`); dopo `g.risolto` lo disabilita il kit.

### Messaggi del fumetto (testi esatti)

Nei testi qui sotto `X`, `Y` sono le capacità dei bicchieri, `n` i travasi, `L` il limite, `M` la meta, `q` i cl versati. Nomi dei contenitori: «lo shaker», «il bicchiere da B», «il bicchiere da C».

| Quando | Messaggio |
|---|---|
| inizio, o selezione posata | `Tocca un contenitore e poi quello in cui versare, o trascinalo.` |
| inizio ripreso dalla memoria con n > 0 | `Si riprende da dove eri: ${n} travasi su ${L}.` |
| contenitore preso | `Preso lo shaker: ora tocca dove versarlo.` / `Preso il bicchiere da ${X}: ora tocca dove versarlo.` |
| rifiutata «vuoto» (anche quando si prova a prendere un contenitore vuoto) | `Lo shaker è vuoto: non c'è niente da versare.` / `Il bicchiere da ${X} è vuoto: non c'è niente da versare.` |
| rifiutata «pieno» | `Lo shaker è già pieno fino all'orlo.` / `Il bicchiere da ${X} è già pieno fino all'orlo.` |
| rifiutata «stesso» | `Scegli un altro contenitore in cui versare.` |
| rifiutata «mossa» | nessun messaggio |
| travaso riuscito, shaker → bicchiere | `Versati ${q} cl dallo shaker nel bicchiere da ${X}.` |
| travaso riuscito, bicchiere → shaker | `Versati ${q} cl dal bicchiere da ${X} nello shaker.` |
| travaso riuscito, bicchiere → bicchiere | `Versati ${q} cl dal bicchiere da ${X} in quello da ${Y}.` |
| … con q = 1 | `Versato 1 cl …` (stesso resto della frase) |
| … se dopo il travaso restano da 1 a 3 travasi | aggiungi ` Restano ${r} travasi.` (con r = 1: ` Resta 1 travaso.`) |
| risolto | `${M} cl nello shaker e ${M} nel bicchiere grande: diviso a metà!` |
| errore (limite o ricomincia) | `Si riparte con lo shaker pieno: hai di nuovo ${L} travasi.` |
| Ricomincia con 0 travasi | `Sei già all'inizio: shaker pieno e bicchieri vuoti.` |
| primo tocco su Ricomincia | `Ricominciare conta come un errore: tocca «Conferma» per farlo.` |
| già risolto | `Il drink è già diviso a metà: salute!` |

---

## 5. Grafica

Sfondo `sala-bar`, **velo 0.5**. Lo sfondo ha già: bottiglie su due ripiani ai lati (y 14…63), l'insegna al neon in alto al centro (bicchiere da cocktail azzurro e «BAR» rosa), uno specchio scuro al centro dietro il bancone (x 120…200, y 46…96), lo scheletro barista a destra (cranio x 251…260, y 70…80), il piano del bancone (y 112…117), il fronte del bancone (y 118…157) e uno sgabello per lato (seduta a x 17…34, y 146…150). Tutto quello che segue va disegnato sulla tela principale a ogni fotogramma (o in parte in una tela fuori schermo copiata 1:1 con `drawImage`), a coordinate intere.

Colori del liquido: le tre tonalità di `EscapeDemo.GEMME.zaffiro` → `Z = ["#1a2a7a", "#2a6cff", "#8fd0ff"]` (scura, media, chiara).

### Disposizione

| Cosa | Dove (pixel della scena) |
|---|---|
| luce sul bancone | y 113…117, x 56…263 |
| lavagna con meta e travasi | x 16…91, y 74…111, piedini fino a y 115 |
| shaker (0) | sinistra x = 100, largo 20, centro 110 |
| bicchiere grande (1) | sinistra x = 151, largo 18, centro 160 |
| bicchiere piccolo (2) | sinistra x = 201, largo 14, centro 208 |
| fondo di tutti i contenitori | ultima riga a y = 115 (alto = 116 − altezza) |
| targhette | sotto ogni centro, y 120…132 |
| Zucco seduto sullo sgabello di sinistra | x 18…33, y 130…153 |
| neon riacceso | x 132…146, y 10…30 e «BAR» da (152, 16) |
| pupille dello scheletro | (253, 75) e (257, 75) |

**Pixel per cl**: `pxCl = Math.floor(56 / A)` (A = capacità dello shaker): 5 con A = 10, 4 con A = 12 o 14, 3 con A = 16. Ogni cl è una fascia alta `pxCl` pixel **in tutti e tre i contenitori**, così i livelli si confrontano a occhio.

**Altezze**: shaker `18 + A·pxCl`; bicchiere grande `6 + B·pxCl`; piccolo `6 + C·pxCl`. Esempi: con 12-8-5 lo shaker va da y 50 a 115, il grande da 78 a 115, il piccolo da 90 a 115; con 14-8-3 lo shaker parte da y 42, il piccolo da 98.

### Ordine di disegno (dal fondo)

1. `ctx.clearRect` di tutta la tela.
2. Luce sul bancone.
3. Neon riacceso (salvo quando lampeggia spento).
4. Pupille dello scheletro e il suo «!».
5. Lavagna.
6. Ombre dei contenitori fermi.
7. Contenitori fermi (quello selezionato o premuto sollevato), poi le targhette.
8. Il contenitore che sta versando (fuori posto), poi il getto e gli schizzi.
9. Freccia sopra il selezionato.
10. Sgabello, Zucco, il suo «?!» o il cuore.
11. Stelline della vittoria.

### Luce sul bancone

Una pozza di luce della lampada sul piano del bancone, che fa risaltare i contenitori. Il colore di base (`legnoScuro`) è quasi uguale al piano velato, quindi i bordi si fondono:

```js
for (let bx = 56; bx < 264; bx += 4) {
  const q = 0.65 * Math.max(0, 1 - Math.abs(bx + 2 - 160) / 104);
  EscapeDemo.retino(ctx, C.legnoScuro, C.legnoChiaro, bx, 113, 4, 5, q);
}
```

### Neon riacceso

Lo sfondo velato spegne l'insegna; la ridisegniamo accesa sopra, esattamente sui pixel dello sfondo (la parte con y < 16 resta sotto la barra del kit, va bene così):

```js
const NEON = [ // a (132, 10): A = C.acqua, Y = C.giallo (l'oliva)
  "...........YY..",
  "...........YY..",
  "AAAAAAAAAAAAAAA",
  ".A...........A.",
  "..A.........A..",
  "..A.........A..",
  "...A.......A...",
  "....A.....A....",
  ".....A...A.....",
  ".....A...A.....",
  "......A.A......",
  ".......A.......",
  ".......A.......",
  ".......A.......",
  ".......A.......",
  ".......A.......",
  ".......A.......",
  ".......A.......",
  ".......A.......",
  ".......A.......",
  "...AAAAAAAAA...",
];
// poi: EscapeDemo.testo(ctx, "BAR", 152, 16, { scala: 2, colore: C.rosa, ombra: null });
```

Sfarfallio (decorazione): il neon (bicchiere e scritta) **non** si disegna nei fotogrammi in cui `g.fotogramma % 53` vale 0 o 2. Alla vittoria lampeggia: spento quando `Math.floor((ora − inizioFesta) / 125)` è dispari, per 750 ms. Con `g.riduciMovimento` è sempre acceso.

### Lo scheletro barista

È nello sfondo; ci aggiungiamo solo gli occhi:

- normale: due pixel `C.acqua` a (253, 75) e (257, 75); si nascondono (battito) quando `g.fotogramma % 37 === 0`;
- errore (per 2000 ms): due quadratini 2×2 `C.tappetoChiaro` a (253, 74) e (257, 74), e sopra la testa `EscapeDemo.testo(ctx, "!", 256, 60, { colore: C.tappetoChiaro, allinea: "centro" })`;
- risolto (e già risolto): i due pixel diventano `C.giallo` e non battono più.

### Lavagna (a cavalletto sul bancone)

```js
rett(ctx, C.bordo, 16, 74, 76, 38);
rett(ctx, C.legnoChiaro, 17, 75, 74, 36);
rett(ctx, C.legnoLuce, 17, 75, 74, 1);   rett(ctx, C.legnoLuce, 17, 75, 1, 36);   // luce in alto a sinistra
rett(ctx, C.legno, 17, 110, 74, 1);                                               // ombra in basso
rett(ctx, C.bordo, 19, 77, 70, 32);
rett(ctx, C.siepe, 20, 78, 68, 30);                                               // il verde della lavagna
// piedini
rett(ctx, C.bordo, 23, 112, 4, 4); rett(ctx, C.legno, 24, 112, 2, 3);
rett(ctx, C.bordo, 81, 112, 4, 4); rett(ctx, C.legno, 82, 112, 2, 3);
// gessetto
testo(ctx, "META", 54, 80, { piccolo: true, colore: C.pietraChiara, ombra: null, allinea: "centro" });
testo(ctx, `${M} + ${M}`, 54, 87, { colore: risolto ? C.acqua : C.bianco, ombra: null, allinea: "centro" });
for (let x = 22; x <= 86; x += 2) rett(ctx, C.ferroChiaro, x, 96, 1, 1);           // riga tratteggiata
if (risolto) testo(ctx, "SALUTE!", 54, 99, { colore: C.giallo, ombra: null, allinea: "centro" });
else {
  testo(ctx, "TRAVASI", 22, 100, { piccolo: true, colore: C.pietraChiara, ombra: null });
  testo(ctx, `${travasi}/${limite}`, 86, 99, { colore: coloreConto, ombra: null, allinea: "destra" });
}
```

`coloreConto`: `C.tappetoChiaro` per 1200 ms dopo un errore; altrimenti `C.giallo` se `limite − travasi ≤ 3`; altrimenti `C.bianco`. La lavagna mostra sempre i travasi **logici** (cambiano subito). Il passaggio a `SALUTE!` avviene all'inizio della festa (vedi Animazioni).

### Lo shaker (indice 0)

Uno shaker con il corpo di vetro (così si vede il livello) e il tappo d'acciaio a gradini. Largo 20. Dall'alto: il **tappo** (sprite 20×15), il **corpo** di vetro alto `A·pxCl`, il **piede** d'acciaio (sprite 20×3).

```js
// k = colore del contorno (C.bordo, o il colore di stato), w = C.bianco, s = C.pietraChiara, p = C.pietra, f = C.ferroChiaro, F = C.ferro
const TAPPO = [
  "........kkkk........",
  "......kkwspfkk......",
  ".....kwsppppfFk.....",
  ".....kspppppfFk.....",
  "....kkkkkkkkkkkk....",
  ".....kspppppfFk.....",
  ".....kspppppfFk.....",
  "....kkkkkkkkkkkk....",
  "....kwsppppppfFk....",
  "...kssppppppfffFk...",
  "..ksppppppppfffFFk..",
  ".kspppppppppffffFFk.",
  "kkkkkkkkkkkkkkkkkkkk",
  "kwssppppppppppfffFFk",
  "kkkkkkkkkkkkkkkkkkkk",
];
const PIEDE = [
  "kkkkkkkkkkkkkkkkkkkk",
  "kwssppppppppppfffFFk",
  ".kkkkkkkkkkkkkkkkkk.",
];

function disegnaShaker(ctx, x0, y0, livello, bordo) {   // x0, y0 = angolo in alto a sinistra
  const hi = A * pxCl;
  const col = { k: bordo, w: C.bianco, s: C.pietraChiara, p: C.pietra, f: C.ferroChiaro, F: C.ferro };
  sprite(ctx, TAPPO, col, x0, y0);
  const yb = y0 + 15;
  rett(ctx, bordo, x0, yb, 1, hi);           rett(ctx, C.pietraChiara, x0 + 1, yb, 1, hi);   // parete sinistra, in luce
  rett(ctx, C.ferroChiaro, x0 + 18, yb, 1, hi); rett(ctx, bordo, x0 + 19, yb, 1, hi);         // parete destra, in ombra
  interno(ctx, x0 + 2, yb, 16, hi, livello);
  sprite(ctx, PIEDE, col, x0, yb + hi);
}
```

### I bicchieri (indici 1 e 2)

Bicchieri dritti con l'orlo luccicante e il fondo di vetro spesso. Interno largo `wi = 14` (grande, largo 18 in tutto) o `wi = 10` (piccolo, largo 14). Alti `6 + capacità·pxCl`.

```js
function disegnaBicchiere(ctx, x0, y0, livello, cap, wi, bordo) {
  const W = wi + 4, hi = cap * pxCl;
  rett(ctx, bordo, x0, y0, W, 1);                                                      // contorno sopra
  rett(ctx, bordo, x0, y0 + 1, 1, 1); rett(ctx, bordo, x0 + W - 1, y0 + 1, 1, 1);
  rett(ctx, C.pietraChiara, x0 + 1, y0 + 1, W - 2, 1);                                 // orlo
  rett(ctx, C.bianco, x0 + 2, y0 + 1, 2, 1);                                           // luccichio dell'orlo
  const yb = y0 + 2;
  rett(ctx, bordo, x0, yb, 1, hi);              rett(ctx, C.pietraChiara, x0 + 1, yb, 1, hi);
  rett(ctx, C.ferroChiaro, x0 + W - 2, yb, 1, hi); rett(ctx, bordo, x0 + W - 1, yb, 1, hi);
  interno(ctx, x0 + 2, yb, wi, hi, livello);
  const yf = yb + hi;                                                                  // fondo spesso
  rett(ctx, bordo, x0, yf, 1, 3); rett(ctx, bordo, x0 + W - 1, yf, 1, 3);
  rett(ctx, C.notteChiara, x0 + 1, yf, W - 2, 3);
  rett(ctx, C.pietraChiara, x0 + 1, yf, W - 4, 1);
  rett(ctx, C.bianco, x0 + 2, yf + 1, 2, 1);
  rett(ctx, C.notte, x0 + W - 4, yf + 1, 3, 2);
  rett(ctx, bordo, x0 + 1, yf + 3, W - 2, 1);                                          // contorno sotto (angoli smussati)
}
```

### L'interno di vetro, con il liquido

Uguale per tutti e tre i contenitori. Il liquido riempie le ultime `livello·pxCl` righe; sopra c'è vetro vuoto scuro a retino con un riflesso.

```js
function interno(ctx, x, y, wi, hi, livello) {
  const hl = livello * pxCl;
  for (let r = 0; r < hi; r++) {
    const yy = y + r, dalFondo = hi - 1 - r;
    if (dalFondo < hl) {                                   // liquido
      const superficie = dalFondo === hl - 1;
      for (let i = 0; i < wi; i++) {
        let c;
        if (superficie) c = i < wi - 2 ? Z[2] : Z[1];      // la superficie chiara
        else if (i === 1) c = Z[2];                        // il riflesso a sinistra
        else if (i >= wi - 3) c = Z[0];                    // l'ombra a destra
        else c = Z[1];
        rett(ctx, c, x + i, yy, 1, 1);                     // (si può fare a strisce: è uguale)
      }
    } else {                                               // vetro vuoto
      EscapeDemo.retino(ctx, C.sagoma, C.notte, x, yy, wi, 1, 0.45);
      if (r >= 1) rett(ctx, C.notteChiara, x + 1, yy, 1, 1);
    }
  }
}
```

Decorazioni facoltative del liquido (niente con `riduciMovimento`): un pixel `C.bianco` che scorre sulla riga della superficie (`i = (g.fotogramma + 3·indice) % (wi − 2)`), e una bollicina `Z[2]` di 1 pixel che sale di un pixel a fotogramma nei contenitori con almeno 6 pixel di liquido.

### Ombre, sollevamento e colore del contorno

- **Ombra** di ogni contenitore fermo (luce da sinistra, ombra a destra): `EscapeDemo.retino(ctx, C.legno, C.legnoScuro, sinistra + 3, 114, larghezza, 3, 0.6)`, disegnata prima del contenitore. Non c'è per quello che sta versando.
- **Stati** (sollevamento verso l'alto, colore passato come `bordo`):

| Stato | Sollevato | Contorno |
|---|---|---|
| normale | 0 | `C.bordo` |
| selezionato, o premuto come sorgente | 3 px | `C.giallo` |
| bersaglio (sotto il dito durante un trascinamento, o premuto mentre un altro è selezionato) | 1 px | `C.acqua` |
| durante il ritorno dopo un errore (animazione «rovescia») | 0 | `C.tappetoChiaro` |

Priorità: durante un trascinamento, `premuto` è giallo e `sopra` (se diverso) è acqua, la selezione non si vede; senza trascinamento ma col dito giù, se c'è una selezione diversa da `premuto` la selezione è gialla e `premuto` acqua, altrimenti `premuto` è giallo; col dito su, `selezionato` è giallo.

- **Freccia** sopra il selezionato (solo col dito su), gialla, con un saltello di 1 px (`dy = (g.fotogramma >> 1) & 1`, 0 con `riduciMovimento`), a `(cx − 5, alto − 12 + dy)` dove `alto` è l'alto del contenitore a riposo:

```js
const FRECCIA = [ // k = C.bordo, y = C.giallo
  "kkkkkkkkkkk",
  "kyyyyyyyyyk",
  ".kyyyyyyyk.",
  "..kyyyyyk..",
  "...kyyyk...",
  "....kyk....",
  ".....k.....",
];
```

- **Scossetta** di rifiuto: il contenitore che blocca (quello vuoto per «vuoto», quello pieno per «pieno», quello toccato per «stesso») si sposta in orizzontale di −1, +1, −1, +1, −1, 0 pixel, 40 ms per passo (240 ms), e il numero della sua targhetta è `C.tappetoChiaro` per 300 ms.

### Targhette

Una targhetta d'ottone con una finestrella scura sotto ogni contenitore, sempre al suo posto: il numero grande è il contenuto, quello piccolo la capacità («6/8»). Mostra i livelli **disegnati** (durante un travaso cambiano insieme al liquido).

```js
function targhetta(ctx, cx, n, cap, coloreNumero = C.bianco) {
  rett(ctx, C.bordo, cx - 15, 120, 30, 13);
  rett(ctx, C.oroScuro, cx - 14, 121, 28, 11);
  rett(ctx, C.oro, cx - 14, 121, 28, 1); rett(ctx, C.oro, cx - 14, 121, 1, 11);
  rett(ctx, C.sagoma, cx - 12, 123, 24, 7);
  const a = String(n), b = "/" + cap;
  const wa = larghezzaTesto(a), wb = larghezzaTesto(b, { piccolo: true });
  const sx = cx - Math.floor((wa + 1 + wb) / 2);
  testo(ctx, a, sx, 123, { colore: coloreNumero, ombra: null });
  testo(ctx, b, sx + wa + 1, 125, { piccolo: true, colore: C.pietra, ombra: null });
}
```

### Zucco sullo sgabello

Zucco (la zucca della fuga di Zucco) è seduto sullo sgabello di sinistra e guarda. Prima ridisegna la seduta acceso sopra il velo, poi Zucco a (18, 130):

```js
rett(ctx, C.bordo, 16, 145, 20, 7);
rett(ctx, C.tappeto, 17, 146, 18, 5);
rett(ctx, C.tappetoChiaro, 17, 146, 18, 1);
rett(ctx, C.ferro, 25, 151, 2, 3);

const ZUCCO = [ // 16×24, a (18, 130). Righe 0-12 = la testa, 13-18 = il mantello, 19-23 = gambe e scarpe.
  ".......Gg.......",
  "......GGg.......",
  "...kkkkkkkkkk...",
  "..koOOyyyOOOok..",
  ".koOOyyhyyOOOok.",
  ".koOyEEyyOEEOok.",
  ".koOEeeEyOEeeEk.",
  ".koOOEEOOEOEEOk.",
  ".koOOOOOEEOOOOk.",
  ".koObEbEbEbEbOk.",
  ".kooOeEeEeEeOok.",
  "..kooOOOOOOOok..",
  "..kkkkkkkkkkkk..",
  "..kqqppppppPPk..",
  ".kqqpppppppPPPk.",
  ".kqppppppppPPPk.",
  "kqqpppppppppPPPk",
  "kqpppppppppPPPPk",
  "kkkkkkkkkkkkkkkk",
  "...kLBk..kLBk...",
  "...kLBk..kLBk...",
  "...kLBk..kLBk...",
  "..kTRRk.kTRRk...",
  "..kkkkk.kkkkk...",
];
const COLORI_ZUCCO = {
  k: C.bordo, O: C.brace, y: C.fiamma, h: C.fiammaChiara, E: C.oro, e: C.luna,
  q: C.lilla, p: C.viola, P: C.violaScuro, L: C.ferroChiaro, B: C.ferro, R: C.legnoChiaro, T: C.legnoLuce,
  // Fuori paletta, motivati: sono i colori di Zucco nella fuga di Zucco (zucco/src/sprite-provvisori.js),
  // così il protagonista è identico nei due giochi.
  G: "#2d5a2e", g: "#5f9440", o: "#9c3b17", b: "#4a1a12",
};
// Battito di ciglia: quando g.fotogramma % 29 === 0, le righe 5, 6, 7 diventano
const ZUCCO_CHIUSO = {
  5: ".koOyOOyyOOOOok.",
  6: ".koObbbbyObbbbk.",
  7: ".koOOOOOOOOOOOk.",
};
```

- **Respiro**: le righe 0-12 (la testa) si disegnano 1 px più in basso quando `(g.fotogramma >> 2) & 1` vale 1 (mezzo secondo su, mezzo giù). Il mantello e le gambe restano fermi. Si disegna prima il corpo (righe 13-23) e poi la testa, così quando scende copre la prima riga del mantello.
- **Errore** (per 2000 ms): sopra la testa `testo(ctx, "?!", 26, 119, { colore: C.giallo, allinea: "centro" })` (con l'ombra `C.bordo` del kit); nei primi 250 ms tutto Zucco sta 2 px più su (un sobbalzo).
- **Vittoria**: due saltelli di 3 px (Zucco 3 px più su nei primi 125 ms della festa e fra 250 e 375 ms) e per 2500 ms un cuore sopra la testa, a (23, 118):

```js
const CUORE = [ // k = C.bordo, r = C.rosa
  ".kk.kk.",
  "krrkrrk",
  "krrrrrk",
  ".krrrk.",
  "..krk..",
  "...k...",
];
```

### Il travaso: animazione

La logica è già aggiornata quando l'animazione parte; l'animazione usa i livelli **prima** del travaso e i cl versati `q`. Per ogni contenitore `i` a riposo: `sin[i]` (sinistra), `alto[i] = 116 − altezza[i]`, `larg[i]`, `cx[i]`.

- `d = cx[a] > cx[da] ? 1 : -1` (il bersaglio è a destra o a sinistra).
- **Posizione di versata** della sorgente: sinistra `xv = d > 0 ? sin[a] − 2 − larg[da] : sin[a] + larg[a] + 2` (accanto al bersaglio, senza toccarlo); sollevamento `su = Math.max(4, alto[da] − (alto[a] − 8))` (il bordo della sorgente finisce almeno 8 px sopra quello del bersaglio).
- **Becco** (da dove esce il getto), alla posizione di versata: shaker `x = xv + (d > 0 ? 13 : 6)`, bicchiere `x = xv + (d > 0 ? larg − 1 : 0)`; `y = alto[da] − su`. Il getto parte da `(becco.x + d, becco.y)`.
- **Bocca** del bersaglio (dove arriva): shaker `(110, alto[0])` (sulla cima del tappo); bicchiere `(cx[a], alto[a] + 3)`.
- **Getto**: un arco di quadratini. Con `(x0, y0)` partenza e `(x1, y1)` arrivo, `n = 2 · max(|x1 − x0|, |y1 − y0|)`; per `k = 0…n`, `s = k / n`, punto `x = round(x0 + (x1 − x0)·s)`, `y = round(y0 + (y1 − y0)·s − 16·s·(1 − s))`. Disegna in tre passate su tutti i punti visibili: prima `rett(C.bordo, x − 1, y − 1, 4, 4)`, poi `rett(Z[1], x, y, 2, 2)`, poi `rett(Z[2], x, y, 1, 1)`.

Tempi:

1. **va** (200 ms): la sorgente passa da casa alla posizione di versata: spostamento `round(dx · e)` e sollevamento `round(su · e)` con `e = 1 − (1 − p)²` (p da 0 a 1). Livelli quelli di prima.
2. **versa** (`Math.min(700, 250 + 50·q)` ms): sorgente ferma alla posizione di versata. Il getto mostra i punti con `s` fra `coda = max(0, (p − 0.8) / 0.2)` e `testa = min(1, p / 0.2)` (arriva nel primo quinto, si stacca nell'ultimo). I cl passano fra il 20% e l'80%: `k = Math.round(q · clamp((p − 0.2) / 0.6, 0, 1))`; la sorgente mostra `prima[da] − k`, il bersaglio `prima[a] + k`. Facoltativo: mentre il getto arriva, due schizzi di 1 px (`C.bianco` e `Z[2]`) che saltellano attorno alla bocca (±2…3 px, alternati a ogni fotogramma).
3. **torna** (200 ms): di nuovo a casa, all'inverso; livelli quelli di dopo.

Se arriva un'altra mossa mentre un'animazione è in corso, quella in corso (e quelle in coda) salta subito alla fine e parte la nuova. Le targhette seguono i livelli disegnati.

**Errore «limite»**: il travaso si anima normalmente e in coda parte **rovescia** (500 ms): i livelli disegnati vanno in modo lineare da quelli dopo il travaso a `[A, 0, 0]` (arrotondati a cl interi), con i contorni dei tre contenitori `C.tappetoChiaro`. Le reazioni (occhi rossi e «!» dello scheletro, «?!» e sobbalzo di Zucco, conto rosso sulla lavagna) partono subito, al momento di `g.errore`, e durano 2000 ms (il conto rosso 1200 ms).

**Errore «ricomincia»**: parte subito **rovescia** dai livelli disegnati, con le stesse reazioni.

**Vittoria**: la **festa** comincia alla fine dell'animazione del travaso (subito con `riduciMovimento`): la lavagna passa a `SALUTE!` e il `M + M` diventa acqua, il neon lampeggia, gli occhi dello scheletro diventano gialli, Zucco salta col cuore, compaiono le stelline. La carta arriva da sola dopo i 1800 ms di `ritardo`.

**Stelline** (dalla festa in poi per sempre, anche con `g.giaRisolto`): quattro, attorno allo shaker e al bicchiere grande; la stellina k è visibile quando `(g.fotogramma + 2·k) % 6 < 3` (sempre visibile con `riduciMovimento`).

```js
const STELLA = ["..g..", "..g..", "ggWgg", "..g..", "..g.."]; // g = C.giallo, W = C.bianco
const STELLINA = [".g.", "gWg", ".g."];
// k = 0: STELLA    a (sin[0] − 4,  alto[0] + 10)
// k = 1: STELLINA  a (sin[0] + 24, alto[0] + 22)
// k = 2: STELLA    a (sin[1] − 5,  alto[1] − 2)
// k = 3: STELLINA  a (sin[1] + 21, alto[1] + 8)
```

Con `g.riduciMovimento`: niente animazioni del travaso né di rovescia (i livelli disegnati sono subito quelli logici), niente sfarfallio, battiti, respiro, saltelli, bollicine; le reazioni (colori, «!», «?!», cuore, stelline) restano, ferme.

---

## 6. Aggancio per le prove

```js
g.espone({
  gioca: (mossa) => …,      // la stessa funzione usata da tocchi, trascinamento e bottone (il bottone senza la conferma)
  statoGioco: () => …,
  posizione: (i) => ({ x: [110, 160, 208][i], y: 108 }),
});
```

`gioca(mossa)` accetta:

- `{ da: 0|1|2, a: 0|1|2 }` — un travaso;
- `{ azione: "ricomincia" }` — ricomincia **già confermato** (la conferma è solo del bottone).

Esiti (esattamente queste chiavi; `livelli` sono quelli logici dopo la mossa):

| Caso | Esito |
|---|---|
| travaso riuscito | `{ ok: true, versati: q, livelli: [s, g, p], travasi: n }` |
| travaso che risolve | `{ risolto: true, versati: q, livelli: [M, M, 0], travasi: n }` |
| travaso che esaurisce i travasi | `{ errore: true, motivo: "limite", versati: q, livelli: [A, 0, 0], travasi: 0 }` |
| ricomincia con travasi > 0 | `{ errore: true, motivo: "ricomincia", livelli: [A, 0, 0], travasi: 0 }` |
| ricomincia con 0 travasi | `{ valida: false, motivo: "inizio" }` |
| rifiutata | `{ valida: false, motivo: "stesso" }` / `"vuoto"` / `"pieno"` / `"mossa"` |

`statoGioco()`:

```js
{ livelli: [4, 3, 5], capacita: [12, 8, 5], travasi: 2, limite: 13, selezionato: null }
```

`selezionato` è quello preso con un tocco (resta null durante un trascinamento). `posizione(i)` dà un punto dentro la zona di tocco del contenitore `i` (dentro il disegno di tutti e tre, in ogni ricetta).

La verifica (`verifica.mjs`) controlla: la variante esatta per i semi 1, 2, 4, 7, 9, 14 e per il seme delle foto; lo stato iniziale; le mosse rifiutate senza errore; l'errore al travaso numero `limite`; Ricomincia (rifiutato all'inizio, conferma col primo tocco, errore col secondo); un tocco su un bicchiere vuoto che non lo prende; un travaso con due clic e uno col trascinamento; livelli e travasi che restano ricaricando la pagina; la soluzione più corta giocata fino alla fine (con 2 errori → 2 dorate).

---

## 7. Criteri di accettazione

Guardando le foto e giocando:

1. Si capisce al primo sguardo che si versa fra tre contenitori: shaker di vetro col tappo d'acciaio a sinistra, bicchiere alto al centro davanti allo specchio, bicchiere piccolo a destra, tutti appoggiati sul piano del bancone (fondo a y = 115) nella pozza di luce.
2. Il liquido è blu acceso con la superficie chiara, il riflesso a sinistra e l'ombra a destra; il vetro vuoto è scuro ma si distingue dallo specchio dietro.
3. Le targhette sono leggibili anche al telefono e dicono sempre il contenuto e la capacità («4/12», «3/8», «5/5»); durante un travaso cambiano insieme al liquido.
4. La lavagna verde dice la meta («6 + 6») e i travasi («2/13»), senza che «TRAVASI» e il numero si tocchino, anche con «16/17». Il numero diventa giallo quando ne restano 3 o meno.
5. Toccando un contenitore si alza di 3 px con il contorno giallo e la freccia sopra; trascinandolo, il bersaglio sotto il dito ha il contorno acqua.
6. Il travaso si vede: la sorgente va accanto al bersaglio, il getto blu ad arco entra nella bocca, i livelli salgono e scendono cl per cl, poi torna a posto. Nessun pezzo resta a metà se si gioca in fretta.
7. Un bicchiere vuoto che si prova a prendere, o uno pieno in cui si prova a versare, fa la scossetta e il messaggio giusto, senza errori.
8. Il travaso numero `limite` senza il drink diviso: avviso rosso del kit, scossa, scheletro con gli occhi rossi e il «!», Zucco con «?!», contenitori col contorno rosso mentre il liquido torna nello shaker, lavagna a «0/limite».
9. Ricomincia chiede conferma (il bottone diventa «Conferma») e solo al secondo tocco conta come errore; all'inizio non fa niente.
10. Ricaricando la pagina a metà partita, livelli e travasi sono quelli di prima.
11. Alla vittoria: stelline, neon che lampeggia, occhi gialli, Zucco che salta col cuore, «SALUTE!» sulla lavagna, poi la carta con il riepilogo e le dorate giuste. Ricaricando, la scena resta così (stato finale e stelline).
12. Il neon in alto è acceso (non velato) e ogni tanto sfarfalla; Zucco respira e sbatte le palpebre; lo scheletro sbatte le pupille. Nessuna animazione continua con `riduciMovimento`.
13. Niente fuori dall'area di gioco tranne decorazioni: la parte alta del neon sotto la barra del kit, le scarpe di Zucco fino a y 153.
14. `node demo/comune/prova.mjs angelo-azzurro` finisce con «TUTTO OK»; guarda anche `foto/verifica-errore.png` e `foto/verifica-a-meta.png`.
