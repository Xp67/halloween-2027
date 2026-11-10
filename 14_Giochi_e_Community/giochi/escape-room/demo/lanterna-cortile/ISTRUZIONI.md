# La lanterna del cortile — istruzioni per il costruttore

Valgono le [regole comuni](../REGOLE_COMUNI.md) e il kit ([`comune/kit.js`](../comune/kit.js)). Qui c'è solo quello che è specifico di questo rompicapo. La scheda è [`scheda.js`](scheda.js): titolo, testo, indizi, dorate (4) ed errori concessi (2) vengono da lì.

## 1. In breve

Cinque mostri aspettano al cancello, a sinistra; devono arrivare tutti alla porta dell'ingresso, a destra, attraversando un cortile buio con una sola lanterna. Il giocatore sceglie uno o due mostri dalla parte della lanterna e li fa attraversare: la coppia va al passo del più lento e i minuti si consumano. Si vince quando sono tutti alla porta senza superare il limite; se la lanterna si spegne a metà strada è un errore e si riparte da capo.

## 2. Variante

Cambiano fra giocatori i **tempi dei mostri** (una serie fra sei, tutte verificate con un risolutore che esplora ogni stato) e **l'ordine dei posti** in cui i mostri stanno in fila. Il limite della lanterna è sempre il **minimo esatto** della serie: chi vince ci mette proprio quei minuti.

I mostri hanno ruoli fissi, dal più veloce al più lento: fantasma, strega, zombie, mummia, scheletro (quello con la gamba di legno è sempre il più lento, il fantasma sempre il più veloce).

| Serie | fantasma | strega | zombie | mummia | scheletro | limite (minimo) | «uno alla volta» col più veloce |
|---|---|---|---|---|---|---|---|
| 0 | 1 | 3 | 6 | 8 | 12 | 29 | 32 |
| 1 | 1 | 2 | 6 | 9 | 13 | 27 | 33 |
| 2 | 1 | 3 | 4 | 9 | 11 | 26 | 30 |
| 3 | 2 | 3 | 7 | 9 | 14 | 34 | 39 |
| 4 | 1 | 4 | 5 | 10 | 12 | 31 | 34 |
| 5 | 1 | 2 | 7 | 11 | 15 | 30 | 38 |

Il generatore, **esattamente così** (la verifica lo rifà uguale e confronta la variante seme per seme):

```js
const IDS = ["fantasma", "strega", "zombie", "mummia", "scheletro"];
const SERIE = [
  { tempi: [1, 3, 6, 8, 12], limite: 29 },
  { tempi: [1, 2, 6, 9, 13], limite: 27 },
  { tempi: [1, 3, 4, 9, 11], limite: 26 },
  { tempi: [2, 3, 7, 9, 14], limite: 34 },
  { tempi: [1, 4, 5, 10, 12], limite: 31 },
  { tempi: [1, 2, 7, 11, 15], limite: 30 },
];

variante(rng) {
  const serie = SERIE[Math.floor(rng() * SERIE.length)];   // prima chiamata di rng
  const tempi = {};
  IDS.forEach((id, i) => { tempi[id] = serie.tempi[i]; });
  return { tempi, limite: serie.limite, ordine: EscapeDemo.mescola(rng, IDS) };
}
```

Formato dell'oggetto `variante` (è anche quello che il kit pubblica in `window.__demo.variante`):

```js
{
  tempi: { fantasma: 1, strega: 2, zombie: 7, mummia: 11, scheletro: 15 },  // minuti per attraversare
  limite: 30,                                                                 // minuti della lanterna
  ordine: ["scheletro", "zombie", "mummia", "fantasma", "strega"],            // ordine[s] = chi sta nel posto s (s = 0 a sinistra)
}
```

Esempi (con il generatore sopra e l'rng del kit):

- **seme 4** → serie 5: fantasma 1, strega 2, zombie 7, mummia 11, scheletro 15; limite 30; ordine scheletro, zombie, mummia, fantasma, strega. Una soluzione: vanno fantasma e strega (2) · torna il fantasma (1) · vanno mummia e scheletro (15) · torna la strega (2) · vanno fantasma e strega (2) · torna il fantasma (1) · vanno fantasma e zombie (7) = 30.
- **seme 7** → serie 0: 1, 3, 6, 8, 12; limite 29; ordine scheletro, strega, zombie, mummia, fantasma. Stessa strategia: 3 + 1 + 12 + 3 + 3 + 1 + 6 = 29. Anche questa vince: vanno fantasma e zombie (6) · torna il fantasma (1) · vanno fantasma e strega (3) · torna il fantasma (1) · vanno mummia e scheletro (12) · torna la strega (3) · vanno fantasma e strega (3) = 29.
- **seme 1** → serie 3: 2, 3, 7, 9, 14; limite 34 (uno alla volta col fantasma farebbe 39).

Le sequenze vincenti sono più d'una (si può accompagnare il terzo prima o dopo i due lenti): valgono tutte. Conta solo arrivare tutti alla porta entro il limite.

### Il testo della carta

Il testo della scheda ha i tempi della serie 5: per la demo va rifatto con quelli della variante e passato come `testo`. In `crea(g)`, per prima cosa, si assegna `opzioni.testo = testo(g.variante)`, dove `opzioni` è l'oggetto passato a `EscapeDemo.avvia` (tenetene un riferimento in una costante): il kit legge `opzioni.testo` quando mostra la carta, cioè dopo `crea`. Il testo, esatto (in grassetto i pezzi che cambiano; nella stringa niente asterischi):

> Cinque mostri devono attraversare il cortile buio fino alla porta dell'ingresso, e c'è una sola lanterna. Si cammina al massimo in due, sempre con la lanterna, e la coppia va al passo del più lento; poi qualcuno deve riportare indietro la lanterna. Il fantasma ci mette **{F}**, la strega **{S}**, lo zombie **{Z}**, la mummia **{M}** e lo scheletro con la gamba di legno **{K}**. La lanterna si spegne dopo **{L}** minuti.

dove `{F}` è `"1 minuto"` se il fantasma ci mette 1, altrimenti `"2 minuti"`; `{S}`, `{Z}`, `{M}`, `{K}` sono solo i numeri; `{L}` è il limite. (La verifica cerca `la strega {S},`, `con la gamba di legno {K}.` e `si spegne dopo {L} minuti`.)

## 3. Regole e mosse

### Lo stato (la «partita»)

```js
{
  lati: { fantasma: "cancello", strega: "cancello", zombie: "cancello", mummia: "cancello", scheletro: "cancello" },
  lanterna: "cancello",        // "cancello" (sinistra) o "porta" (destra)
  minuti: 0,                   // minuti già consumati
  viaggi: [],                  // [{ chi: ["fantasma", "strega"], verso: "porta", minuti: 2 }, ...] (chi in ordine di tempo crescente)
}
```

Scrivetelo come funzioni pulite: `applica(partita, mossa, variante) → { partita: nuova, esito }`, senza disegno dentro. La selezione dei mostri (chi è stato toccato) è stato dell'interfaccia, non della partita.

### Le mosse

**Attraversa** — `{ tipo: "attraversa", chi: [id] }` oppure `{ tipo: "attraversa", chi: [id, id] }`. Controlli, in quest'ordine:

1. `chi` non è un array di 1 o 2 id diversi → rifiutata `{ valida: false, motivo: "quanti" }`;
2. un id non è un mostro → rifiutata `{ valida: false, motivo: "chi" }`;
3. qualcuno non è dalla parte della lanterna → rifiutata `{ valida: false, motivo: "lanterna" }`.

Le mosse rifiutate non cambiano niente e **non sono errori**. Se la mossa è valida: `durata` = il tempo più alto fra quelli di `chi`.

- Se `minuti + durata > limite`: **la lanterna si spegne a metà cortile. È un errore**: `g.errore("La lanterna si è spenta a metà cortile")`; la partita torna **subito** quella iniziale (tutti al cancello, lanterna al cancello, 0 minuti, nessun viaggio); esito `{ errore: true, motivo: "spenta", minuti: minuti + durata }`.
- Altrimenti i mostri di `chi` e la lanterna passano dall'altra parte, `minuti += durata`, si aggiunge il viaggio. Esito `{ ok: true, minuti, lanterna }` (lanterna = dove è adesso).
- Se adesso sono **tutti alla porta**: risolto. Esito `{ risolto: true, minuti }` e subito `g.risolto({ riepilogo, ritardo: 1700 })`.

Si può anche attraversare da soli, e tornare indietro in due: sono mosse lecite (di solito sprecate).

**Ricomincia** — `{ tipo: "ricomincia" }`.

- Se non c'è ancora nessun viaggio: rifiutata `{ valida: false, motivo: "inizio" }`, nessun errore.
- Altrimenti **è un errore** (lo dice la scheda): `g.errore("Hai ricominciato da capo")`, la partita torna quella iniziale, esito `{ errore: true, motivo: "ricomincia" }`.

Qualsiasi altra mossa: `{ valida: false, motivo: "mossa" }`.

Non è un errore fare viaggi inutili o finire in un vicolo cieco (minuti che non bastano più): il giocatore se ne accorge e dovrà ricominciare o provare un viaggio che spegne la lanterna, e lì conta l'errore.

### Riepilogo della vittoria

`avido` = somma dei quattro tempi più lenti + 3 × il tempo più veloce (la strategia «il più veloce accompagna tutti»; serie 5: 2 + 7 + 11 + 15 + 3 = 38).

> Tutti alla porta in {L} minuti esatti. Il trucco: i due più lenti passano insieme, e di là li aspetta già qualcuno di veloce per riportare la lanterna. Accompagnandoli uno alla volta col più veloce ci sarebbero voluti {avido} minuti.

### Ricaricare la pagina

Ricaricare non deve diventare un «ricomincia» gratis: dopo ogni mossa (anche dopo uno spegnimento o un ricomincia) si salva la partita in `g.memoria.partita` e si chiama `g.salvaMemoria()`. In `crea`, se `g.memoria.partita` c'è ed è valida (cinque lati fra "cancello" e "porta", lanterna valida, minuti fra 0 e il limite), si riparte da lì. La selezione e il «Conferma» non si salvano.

### Già risolto

Con `g.giaRisolto` la partita mostrata è quella finale: tutti alla porta, lanterna alla porta e **spenta**, `minuti = limite`, porta aperta con Zucco (vedi Grafica), niente cartellini. Fumetto: «Tutti alla porta: la festa può cominciare.»

## 4. Interfaccia

### Cosa si tocca

Tutto con `g.tocca`, sull'evento `"giu"`. Zone di tocco (pixel della scena):

- **Un mostro**: `|x − xPosto| ≤ 9` e `104 ≤ y ≤ 152` (comprende il cartellino col tempo). `xPosto` è il centro del suo posto dalla parte dove si trova (sezione 5).
- **La lanterna**: `|x − xLanterna| ≤ 8` e `122 ≤ y ≤ 152`, con `xLanterna` = 106 al cancello, 214 alla porta.

Cosa succede:

- Tocco su un mostro **dalla parte della lanterna**: se non era scelto e ne sono scelti meno di due, diventa scelto; se era scelto, torna libero. Se ne sono già scelti due e se ne tocca un terzo: niente cambia, messaggio «Al massimo in due: prima togline uno.»
- Tocco su un mostro **dall'altra parte**: niente cambia, messaggio «La lanterna è dall'altra parte del cortile.»
- Tocco sulla **lanterna** o bottone **«Attraversa»**: se c'è almeno un mostro scelto → mossa `attraversa` con gli scelti (la stessa funzione di `gioca`); altrimenti messaggio «Prima scegli chi porta la lanterna: uno o due mostri.»
- Dopo ogni attraversamento (riuscito o spento) la selezione si svuota.
- Un tocco o un bottone durante un'animazione porta subito l'animazione in corso alla fine, poi viene gestito normalmente.

### Bottoni

1. `g.bottone("Attraversa", …, { id: "attraversa", forte: true })`.
2. `g.bottone("Ricomincia", …, { id: "ricomincia" })`, in due tempi, perché costa un errore:
   - senza viaggi: messaggio «Sono già tutti al cancello, con la lanterna appena accesa.» e basta;
   - primo tocco: il testo del bottone diventa «Conferma» (con `btn.textContent`; il `data-azione` resta `ricomincia`), messaggio «Ricominciare conta come un errore: premi «Conferma» per farlo.»; resta armato per 4 secondi, poi torna «Ricomincia»;
   - tocco mentre è armato → mossa `ricomincia`;
   - qualsiasi altra azione (scelta di un mostro, attraversamento) lo disarma.

### Messaggi del fumetto (testi esatti)

Nomi: «il fantasma», «la strega», «lo zombie», «la mummia», «lo scheletro». Il **gruppo** si scrive dal più veloce al più lento, con la maiuscola iniziale: «Il fantasma», «La mummia e lo scheletro». `{n minuti}` è «1 minuto» oppure «7 minuti».

| Quando | Testo |
|---|---|
| all'apertura, e quando la selezione torna vuota | Tocca uno o due mostri vicino alla lanterna, poi «Attraversa». |
| scelti uno o due, e il tempo basta | {Gruppo} attraversa in {n minuti}. / {Gruppo} attraversano in {n minuti}. |
| scelti, ma il tempo non basta (`minuti + durata > limite`) | {Gruppo} ci mette {n minuti}, ma ne restano {r}. / {Gruppo} ci mettono {n minuti}, ma ne restano {r}. (con r = 1: «ma ne resta 1»; con r = 0: «ma la lanterna è agli sgoccioli») |
| terzo mostro | Al massimo in due: prima togline uno. |
| mostro dall'altra parte | La lanterna è dall'altra parte del cortile. |
| «Attraversa» senza nessuno scelto | Prima scegli chi porta la lanterna: uno o due mostri. |
| arrivati alla porta (non tutti) | {Gruppo}: alla porta! Chi riporta indietro la lanterna? |
| tornati al cancello | {Gruppo}: di nuovo al cancello con la lanterna. |
| lanterna spenta (con `g.errore("La lanterna si è spenta a metà cortile")`) | Buio pesto! Tutti di nuovo al cancello, con la lanterna riaccesa. |
| primo tocco su «Ricomincia» | Ricominciare conta come un errore: premi «Conferma» per farlo. |
| ricomincia confermato (con `g.errore("Hai ricominciato da capo")`) | Tutti di nuovo al cancello: la lanterna riparte da zero minuti. |
| «Ricomincia» senza viaggi | Sono già tutti al cancello, con la lanterna appena accesa. |
| vittoria | Tutti alla porta in {L} minuti: la lanterna si spegne proprio adesso! |
| già risolto | Tutti alla porta: la festa può cominciare. |

## 5. Grafica

Sfondo `cancello`, **velo 0.5**. Lo sfondo ha il muretto da y 88 a 118, i pilastri con le lanterne a x 92–108 e 212–228, il cancello chiuso in mezzo (x 108–212) e il prato da y 118 in giù. Il rompicapo occupa il prato: a sinistra la riva del cancello, in mezzo il cortile buio, a destra la riva della porta con il portale dell'ingresso. In alto al centro, fra le due lanterne dei pilastri, la tavola dei minuti.

```
x:  0          100          160          220          320
y16 ─────────────────── barra del kit ───────────────────
y19               [ MINUTI 3/30  ||||||||||||| ]              tavola 105..214 × 19..40
y58                                          [ INGRESSO ]     portale 247..292 × 58..117
y106  [7] [1] [15]    [11]                      [2]           cartellini col tempo
y121   Z   F   S       M  L      .  .   .        W            mostri (piedi a y 148), L = lanterna
y141 ###############                      ################    lastricati delle due rive
y154 ─────────────────── barra del kit ───────────────────
```

### Livelli

1. **`g.ctx`** (subito sopra lo sfondo): i due lastricati e il **buio**. Si ridisegna (pulito + lastricati + buio) solo quando cambia la luce: dopo ogni mossa, a ogni fotogramma durante un'animazione e alla fine di ogni animazione. Da fermi non si ridisegna.
2. **`sopra = g.nuovaTela()`**: si pulisce e si ridisegna a ogni fotogramma, in quest'ordine: tappeto di luce (solo a porta aperta), tepore della lanterna, portale, Zucco (solo a porta aperta), occhi nel buio, mostri fermi, mostri in cammino, lanterna, cartellini, etichetta «+N», tavola dei minuti.
3. **`pesto = g.nuovaTela()`**: vuota. Solo durante il «buio pesto» (vedi «Lanterna spenta») ci si disegna **una volta** un retino di `C.nero` con quanto 0.8 su x 0…319, y 42…153 (la tavola dei minuti, più in alto, resta visibile), e alla fine la si pulisce.

### Posti, coordinate e misure

| Cosa | Dove (pixel della scena) |
|---|---|
| Posti dei mostri al cancello | centri x = 16, 34, 52, 70, 88 (posto s = 0…4) |
| Posti dei mostri alla porta | centri x = 232, 250, 268, 286, 304 |
| Piedi di tutti i mostri | y = 148 (l'ultima riga dello sprite sta a y 147) |
| Lanterna a riposo | centro x 106 (cancello) o 214 (porta); sprite 9×15 da y 133 a 147 |
| Cartellini col tempo | 15×11, centrati sul mostro, da y 106 a 116 |
| Tavola dei minuti | x 105–214, y 19–40 |
| Portale | x 247–292, y 58–117 |
| Lastricati | cancello x 4–99, porta x 220–315, y 141–153 |
| Buio | x 0–319, y 110–153 |
| Occhi nel buio | (124, 126) giallo, (148, 138) rosso, (178, 124) acqua, (198, 134) giallo |

Il mostro `ordine[s]` sta nel posto `s` da qualunque parte si trovi (il suo posto al cancello e alla porta hanno lo stesso indice, a 216 pixel di distanza). Al cancello i mostri guardano a destra (verso il cortile), alla porta guardano a sinistra (verso chi deve ancora arrivare).

### I mostri

Sono gli stessi della mappa del sito (`../mappa/mappa.js`, `MOSTRI`), con i loro colori; la strega ha le mani libere al posto del telefono, lo zombie ha il braccio teso in avanti, il fantasma ha il lenzuolo al posto del rotolo di carta e lo scheletro ha **la gamba di legno**. Tutti **guardano a sinistra** come sono scritti: per farli guardare a destra si usa `specchia: true`. Ogni mostro è un `corpo` più due pose di `gambe` (`dritte` da fermo, `passo` mentre cammina); il fantasma non ha gambe e galleggia 4 pixel sopra i piedi.

Lettere comuni a tutti: `k` = `C.bordo`, `n` = `C.nero`, `w` = `#e8e4f0`, `W` = `#a9a4bc`, `y` = `C.giallo`. «.» = vuoto.

**Colori fuori paletta, motivati:** quelli dei mostri qui sotto e quelli di Zucco sono gli stessi della mappa (`mappa.js`) e della fuga di Zucco (`sprite-provvisori.js`): i personaggi devono essere riconoscibili e identici in tutto il sito. Tutto il resto della scena usa solo `EscapeDemo.C`.

**Fantasma** — 14×19, galleggia (`vola` 4). `f` = `#e8e4f0`, `F` = `#b8b4cc`, `G` = `C.pietra`. Occhi (colonna, riga): (3,4) (4,4) (7,4) (8,4) (3,5) (4,5) (7,5) (8,5); palpebra `f`.

```js
corpo: [
  ".....kkkk.....",
  "...kkffffkk...",
  "..kfffffffFk..",
  ".kffffffffFFk.",
  ".kfnnffnnfFFk.",
  ".kfnnffnnffFk.",
  ".kffffffffFFk.",
  ".kfffnnfffFFk.",
  "kkffffffffFFk.",
  "kfkfffffffFFk.",
  "kffkffffffFFk.",
  ".kfkfffffFFFk.",
  "..kffffffFFFGk",
  "..kfffffFFFFGk",
  ".kffffffFFFGGk",
  "kffffffFFFFGGk",
  "kfFffFffFFfGGk",
  "kfkFfkfFkFkGk.",
  ".k.kk.kk.kk.k.",
],
gambe: { dritte: [], passo: [] },
```

**Strega** — 16×27 (corpo 21 + gambe 6). `h` = `#241a36`, `H` = `#3f2f5a`, `o` = `C.oro`, `a` = `C.brace`, `A` = `#8a3a08`, `g` = `#5a9a4a`, `G` = `#3a6a34`, `L` = `#9ad88a`, `v` = `C.violaScuro`, `V` = `C.viola`. Occhio (5,11); palpebra `L`.

```js
corpo: [
  "..........k.....",
  ".........khk....",
  "........khHk....",
  ".......khhHk....",
  "......khhhHk....",
  ".....khhhhhHk...",
  ".....koooooook..",
  "..kkkhhhhhhhhhk.",
  ".kkhhhhhhhhhhhhk",
  "..kkkkkkkkkkkkk.",
  "....kLgggaaAk...",
  "...kLnLggaaAAk..",
  "...kLLLLgaaAAk..",
  "...kkLgGgkaAAk..",
  "....kkGgkvaAAk..",
  "...kvvkkvvvaAk..",
  "..kvVvvvvvvvAk..",
  ".kgkvVvvvvvvvk..",
  ".kgkkVvvvvvvvk..",
  "..kkvvVvvvvvvk..",
  "...kvvVvvvvvvk..",
],
gambe: {
  dritte: [
    "...kvVvvvvvvvvk.",
    "..kvVvvvvvvvvvk.",
    "..kVvvvvvvvvvvk.",
    ".kvVvvvvvvvvvvvk",
    ".kkkkkkkkkkkkkkk",
    "..kkk.....kkk...",
  ],
  passo: [
    "...kvVvvvvvvvvk.",
    "..kvVvvvvvvvvvk.",
    "..kVvvvvvvvvvvvk",
    ".kvVvvvvvvvvvvvk",
    ".kkkkkkkkkkkkkkk",
    "....kkk..kkk....",
  ],
},
```

**Zombie** — 16×24 (18 + 6). `z` = `#7a9a6a`, `Z` = `#4a6a44`, `c` = `#6a6a8a`, `C` = `#45435f`, `p` = `#4a3a26`, `P` = `C.legnoScuro`, `r` = `C.tappeto`. Occhi (4,4) (5,4); palpebra `z`.

```js
corpo: [
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
  ".kkkccccrccCCk..",
  "kzzzkcccccCCCk..",
  "kzZZkcckcccCCk..",
  ".kkkcccccccCCk..",
  "....kkcccCcCCk..",
  ".....kcCkCckk...",
  ".....kppppPPk...",
],
gambe: {
  dritte: [
    ".....kppPkpPk...",
    ".....kppPkpPk...",
    ".....kpPPkPPk...",
    ".....kZzkkzZk...",
    "....kzZzk.kzZk..",
    "....kkkkk.kkkk..",
  ],
  passo: [
    ".....kppPkpPk...",
    "....kppPk.kpPk..",
    "....kpPPk.kPPk..",
    "...kZzzk..kzZk..",
    "..kzZzk...kzZk..",
    "..kkkkk...kkkk..",
  ],
},
```

**Mummia** — 14×24 (18 + 6). Bende già disegnate in tre toni: `a` = `#e0d8c0`, `b` = `#c4bca2`, `c` = `#a8a088`; `d` = `#7a7258`. Occhi (3,3) (4,3); palpebra `a`.

```js
corpo: [
  "....kkkkk.....",
  "...kbaaack....",
  "..kaaacbadk...",
  "..kynbaaadk...",
  "..kbaaacbdk...",
  "..kdacbaadk...",
  "..kcbaaacdk...",
  "...kaacbdk....",
  "..kkcbaaakk...",
  ".kcbaaacbadk..",
  ".kaakcbaakdk..",
  ".kackaaackdk..",
  ".kbdkacbakdk..",
  ".kaakbaaakbk..",
  ".kkbkaacbkkk..",
  "..kakcbaadk...",
  "..kdkaaacdk...",
  "...kkacbadk...",
],
gambe: {
  dritte: [
    "...kcbkaadk...",
    "...kaakcbdk...",
    "...kackaadk...",
    "...kbakacdk...",
    "..kaadkbaadk..",
    "..kkkkkkkkkk..",
  ],
  passo: [
    "...kcbkaadk...",
    "...kaakkbdk...",
    "..kaak.kaadk..",
    "..kcbk.kcbdk..",
    ".kbadk..kaadk.",
    ".kkkkk..kkkkk.",
  ],
},
```

**Scheletro con la gamba di legno** — 14×23 (17 + 6). `L` = `C.legnoLuce`, `l` = `C.legnoChiaro` (la gamba di legno). Non sbatte le palpebre (orbite vuote).

```js
corpo: [
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
],
gambe: {
  dritte: [
    "...kwk.kwk....",
    "...kwk.kLk....",
    "...kwk.kLk....",
    "...kwk.klk....",
    "..kwwk.kLk....",
    "..kkkk.kkk....",
  ],
  passo: [
    "...kwk.kwk....",
    "..kwk..kLk....",
    "..kwk...kLk...",
    ".kwk....klk...",
    "kwwk....kLk...",
    "kkkk....kkk...",
  ],
},
```

**Come si disegna un mostro** con centro `cx`: `x = Math.round(cx − larghezza/2)`; le gambe con la cima a `148 − vola − salto − gambe.length`; il corpo subito sopra, con la cima a `cimaGambe − corpo.length + respiro`. `vola` = 4 solo per il fantasma; `salto` = 2 quando il mostro è scelto (e durante il saltello della vittoria). Il fantasma non ha gambe: **non chiamate `EscapeDemo.sprite` con un array vuoto**, va in errore (legge `righe[0].length`); per lui si disegna solo il corpo, con la cima a `148 − 4 − salto − 19`, più il galleggiamento. Ombra a terra prima del mostro: `rett(C.nero, cx − 5, 148, 11, 1)` e `rett(C.nero, cx − 3, 149, 7, 1)`; per il fantasma solo `rett(C.nero, cx − 3, 148, 7, 1)`.

**Animazioni da fermi** (8 fps, `k = (g.fotogramma + 5·s) % 24`, s = posto, così sono sfasati):

- respiro: il corpo scende di 1 pixel quando `Math.floor(k / 6) % 2 === 1` (non il fantasma);
- fantasma: invece del respiro galleggia, il corpo sale di `[0, 1, 2, 2, 1, 0, −1, −1][Math.floor(k / 3)]` pixel in più;
- palpebre: con `k === 0` i pixel degli occhi prendono il colore della palpebra;
- zombie: con `Math.floor(k / 4) % 3 === 1` il corpo si sporge di 1 pixel verso dove guarda.

Con `g.riduciMovimento`: `k` fisso a 1, niente di tutto questo.

### Stati visivi dei mostri

- **Normale** (dalla parte della lanterna, lanterna ferma): come sopra.
- **Scelto**: alzato di 2 pixel e con un contorno `C.giallo` di 1 pixel attorno: si disegnano gambe e corpo quattro volte spostati di (±1, 0) e (0, ±1) con tutte le lettere in `C.giallo`, poi il mostro normale sopra. Il suo cartellino diventa giallo.
- **Al buio** (dalla parte senza lanterna, e tutti quelli fermi mentre qualcuno cammina): il mostro normale, poi sopra i suoi stessi pixel un retino di `C.nero`, per restare riconoscibile ma spento:

```js
// dopo aver disegnato il mostro: stessi x, y e specchia usati per gambe e corpo
function velaPixel(ctx, righe, x, y, specchia) {
  const w = righe[0].length;
  righe.forEach((riga, j) => [...riga].forEach((ch, i) => {
    if (ch === ".") return;
    const px = x + (specchia ? w - 1 - i : i), py = y + j;
    if (EscapeDemo.BAYER[py & 3][px & 3] / 16 < 0.3) EscapeDemo.rett(ctx, EscapeDemo.C.nero, px, py, 1, 1);
  }));
}
```

- **In cammino**: mai al buio (lo illumina la lanterna).

### Il cartellino col tempo

Sopra ogni mostro, sempre alla stessa altezza (una fila ordinata). Segue il mostro quando cammina. Sparisce nella vittoria e nello stato già risolto.

```js
// stato: "normale" | "scelto" | "buio"
function cartellino(ctx, cx, minuti, stato) {
  const x = cx - 7, y = 106;
  const fondo = stato === "scelto" ? C.giallo : stato === "buio" ? C.pietra : C.pietraChiara;
  riquadro(ctx, x, y, 15, 11, fondo);
  rett(ctx, stato === "buio" ? C.pietraChiara : C.bianco, x + 1, y + 1, 13, 1);
  testo(ctx, String(minuti), cx + 1, y + 2, { colore: C.bordo, ombra: null, allinea: "centro" });
}
```

### La lanterna

9×15. `M` = `C.ferroChiaro`, `m` = `C.ferro`, `v` = `C.vetro`, `h` = `C.fiammaChiara`, `H` = `C.bianco`, `f` = `C.fiamma`. Si disegna con la cima a `(cx − 4, cima)`.

```js
accesa: [
  [                 // fotogramma 0
    "...kkk...",
    "..k...k..",
    "..k...k..",
    "...kmk...",
    "..kMMmk..",
    ".kMMmmmk.",
    "kkkkkkkkk",
    ".kvvvvvk.",
    ".kvvhvvk.",
    ".kvhHhvk.",
    ".kvhHhvk.",
    ".kvvfvvk.",
    "kkkkkkkkk",
    ".kMmmmmk.",
    "..kkkkk..",
  ],
  [                 // fotogramma 1: la fiamma un pixel più su
    "...kkk...",
    "..k...k..",
    "..k...k..",
    "...kmk...",
    "..kMMmk..",
    ".kMMmmmk.",
    "kkkkkkkkk",
    ".kvvhvvk.",
    ".kvhHhvk.",
    ".kvhHhvk.",
    ".kvvhvvk.",
    ".kvvfvvk.",
    "kkkkkkkkk",
    ".kMmmmmk.",
    "..kkkkk..",
  ],
],
// fioca: come il fotogramma 0 ma le righe 7..11 sono
//   ".kvvvvvk.", ".kvvvvvk.", ".kvvvvvk.", ".kvvhvvk.", ".kvvfvvk."
// spenta: il fotogramma 0 con v = C.ferro e h, H, f = C.legnoScuro
```

La fiamma accesa alterna i due fotogrammi ogni due fotogrammi del kit (`Math.floor(g.fotogramma / 2) % 2`); con `g.riduciMovimento` sempre il fotogramma 0.

- **A riposo**: centro x 106 o 214, cima y 133 (poggia a terra, y 147).
- **Portata**: cima y 121 (all'altezza delle mani). Vedi «Attraversare».
- **Tepore** (su `sopra`, prima di tutto il resto): finché è accesa, un disco di raggio 12 (11 nei fotogrammi dispari, con riduciMovimento sempre 12) attorno a `(xLanterna, 140)`, solo per y ≥ 118: retino di `C.muroAcceso` con quanto 0.35 (il pixel si colora se `BAYER[y&3][x&3]/16 < 0.35` ed è dentro il disco).
- **Etichetta «+N»**: quando ci sono mostri scelti e la lanterna è ferma, sopra la lanterna si scrive `"+" + durata` in 5×7, centrato su `xLanterna + 1`, a y 123; `C.giallo` se il tempo basta, `C.tappetoChiaro` se no.

### Il buio del cortile (su `g.ctx`)

Il cortile è buio; la lanterna illumina un cerchio attorno a sé e, quando è ferma, tutta la sua riva. Per ogni pixel con x 0…319 e y 110…153 si calcola la densità `q` e si mette un pixel `C.nero` dove `BAYER[y & 3][x & 3] / 16 < q`:

```js
// luceX: x della lanterna accesa (null se spenta); riva: [a, b] illuminata o null
function buioIn(x, y, luceX, riva) {
  const alto = Math.min(1, Math.max(0, (y - 110) / 12));     // il buio sale dal prato: niente a y 110, pieno da y 122
  let luce = 0;
  if (luceX != null) {
    const d = Math.hypot(x - luceX, y - 140);
    luce = d <= 18 ? 1 : d >= 40 ? 0 : (40 - d) / 22;
  }
  if (riva) {
    const d = x < riva[0] ? riva[0] - x : x > riva[1] ? x - riva[1] : 0;
    luce = Math.max(luce, 1 - d / 24);
  }
  return 0.6 * alto * (1 - Math.min(1, Math.max(0, luce)));
}
```

- Lanterna **ferma e accesa**: `luceX` = 106 o 214, `riva` = `[4, 112]` (cancello) o `[208, 316]` (porta).
- Lanterna **in cammino**: `luceX` = la sua x, `riva` = null.
- Lanterna **spenta** (fine dello spegnimento, vittoria, già risolto): `luceX` = null; `riva` = `[208, 316]` solo quando la porta è aperta (la illumina la festa), altrimenti null.

**Occhi nel buio** (su `sopra`): quattro coppie di occhi, ogni occhio 2×1 pixel, il secondo 4 pixel a destra del primo, ai punti della tabella (`C.giallo`, `C.tappetoChiaro`, `C.acqua`, `C.giallo`). Si disegnano solo dove `buioIn(x, y, …) ≥ 0.45` con la luce di quel momento: quando la lanterna si avvicina, gli occhi scompaiono. Sbattono le palpebre: la coppia i non si disegna quando `(g.fotogramma + [0, 9, 17, 23][i]) % 28 === 0` (con riduciMovimento non sbattono).

### I lastricati (su `g.ctx`)

Lastre grigie sotto i mostri delle due rive, come il vialetto dello sfondo. `lastricato(ctx, 4, 100)` e `lastricato(ctx, 220, 316)`:

```js
function lastricato(ctx, x0, x1) {
  [[141, 5], [146, 6], [152, 2]].forEach(([y, h], r) => {
    const largo = r % 2 ? 14 : 12;
    for (let x = x0 + (r % 2 ? -6 : 0), i = 0; x < x1; x += largo, i++) {
      const a = Math.max(x, x0), b = Math.min(x + largo, x1);
      if (b - a < 2) continue;
      rett(ctx, C.bordo, a, y, b - a, h);
      rett(ctx, (i + r) % 3 === 0 ? C.ferroChiaro : C.ferro, a, y, b - a - 1, h - 1);
      rett(ctx, C.pietra, a, y, Math.max(1, b - a - 3), 1);
    }
  });
}
```

### Il portale dell'ingresso (su `sopra`)

Un portale di pietra incassato nel muretto di destra, con il tetto, il cartello «INGRESSO» e la porta ad arco. Centro x 270.

```js
function portale(ctx, apertura) {   // apertura: 0 chiusa, 1, 2, 3 = aperta del tutto
  // tetto
  rett(ctx, C.bordo, 247, 58, 46, 5);
  rett(ctx, C.tettoChiaro, 248, 59, 44, 1);
  rett(ctx, C.tetto, 248, 60, 44, 2);
  // pietra, con i giunti sfalsati
  riquadro(ctx, 249, 63, 42, 55, C.ferro);
  for (let y = 69, r = 0; y < 117; y += 6, r++) {
    rett(ctx, C.bordo, 250, y, 40, 1);
    for (let x = 250 + (r % 2 ? 5 : 0); x < 290; x += 10) rett(ctx, C.bordo, x, y + 1, 1, 5);
  }
  rett(ctx, C.ferroChiaro, 250, 64, 2, 53);
  // cartello
  riquadro(ctx, 252, 65, 36, 9, C.legnoChiaro);
  rett(ctx, C.legnoLuce, 253, 66, 34, 1);
  testo(ctx, "INGRESSO", 270, 67, { piccolo: true, colore: C.luna, ombra: C.legnoScuro, allinea: "centro" });
  // archivolto di pietra chiara
  for (const [y, x, w] of [[75, 262, 16], [76, 260, 20], [77, 258, 24], [78, 257, 26], [79, 257, 26]]) rett(ctx, C.pietra, x, y, w, 1);
  rett(ctx, C.pietra, 257, 80, 26, 38);
  rett(ctx, C.pietraChiara, 257, 78, 1, 39);
  rett(ctx, C.pietraChiara, 260, 76, 3, 1);
  // vano della porta: contorno scuro
  const ARCO = [[77, 264, 12], [78, 262, 16], [79, 261, 18], [80, 260, 20]];
  for (const [y, x, w] of ARCO) rett(ctx, C.bordo, x - 1, y - 1, w + 2, 1);
  rett(ctx, C.bordo, 259, 80, 22, 38);
  for (const [y, x, w] of ARCO) rett(ctx, C.bordo, x, y, w, 1);
  if (apertura === 0) {
    // battenti chiusi
    for (const [y, x, w] of ARCO.slice(1)) rett(ctx, C.legno, x + 1, y, w - 2, 1);
    rett(ctx, C.legno, 260, 81, 20, 36);
    for (let x = 263; x < 280; x += 4) rett(ctx, C.legnoScuro, x, 81, 1, 36);
    rett(ctx, C.legnoChiaro, 260, 81, 1, 36);
    rett(ctx, C.bordo, 269, 78, 2, 39);
    for (const y of [88, 108]) {
      rett(ctx, C.ferro, 260, y, 20, 2);
      for (let x = 262; x < 280; x += 4) rett(ctx, C.ferroChiaro, x, y, 1, 1);
    }
    rett(ctx, C.oro, 266, 98, 2, 3); rett(ctx, C.oro, 272, 98, 2, 3);
    rett(ctx, C.oroScuro, 267, 100, 1, 1); rett(ctx, C.oroScuro, 273, 100, 1, 1);
    rett(ctx, C.vetro, 265, 78, 10, 3);              // lunetta accesa
    rett(ctx, C.bordo, 269, 78, 2, 3);
    rett(ctx, C.bordo, 265, 81, 10, 1);
    rett(ctx, C.vetro, 261, 117, 18, 1);             // la luce della festa filtra da sotto
  } else {
    // aperta: dentro la luce della festa, i battenti sempre più stretti ai lati
    const b = [0, 7, 5, 3][apertura];
    for (const [y, x, w] of ARCO.slice(1)) rett(ctx, C.vetro, x + 1, y, w - 2, 1);
    rett(ctx, C.vetro, 260, 81, 20, 36);
    rett(ctx, C.fiammaChiara, 260, 111, 20, 6);
    rett(ctx, C.legnoScuro, 260, 81, b, 36); rett(ctx, C.legno, 260, 81, 1, 36);
    rett(ctx, C.legnoScuro, 280 - b, 81, b, 36); rett(ctx, C.legno, 279, 81, 1, 36);
  }
}
```

Con la porta aperta del tutto si disegnano anche, su `sopra` prima del portale, un **tappeto di luce** sul prato (per y da 118 a 153: da `x = round(260 − (y − 118)·0.6)` a `round(280 + (y − 118)·0.6)`, retino di `C.fiamma` con quanto 0.22) e, dopo il portale, **Zucco che fa capolino**: la sua testa 14×13 a x 263, con la cima a y 99.

```js
// testa di Zucco (sprite-provvisori.js): k = C.bordo, o = "#9c3b17", O = C.brace, y = C.fiamma, h = C.fiammaChiara,
// b = "#4a1a12", G = "#2d5a2e", g = "#5f9440", E = C.oro, e = C.luna
[
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
]
```

Niente lanterne decorative in più nella scena: l'unica lanterna disegnata dalla demo è quella del rompicapo (quelle sui pilastri sono dello sfondo).

### La tavola dei minuti (su `sopra`, per ultima)

Una tavola di legno appesa con due catenelle, con i minuti e una fila di tacche: una tacca per minuto della lanterna. Le tacche consumate sono bruciate, quelle rimaste accese.

```js
function tavola(ctx, minuti, limite, anteprima, f) {   // anteprima = durata dei mostri scelti (0 se nessuno)
  rett(ctx, C.ferroChiaro, 112, 16, 1, 3); rett(ctx, C.ferroChiaro, 207, 16, 1, 3);   // catenelle
  riquadro(ctx, 105, 19, 110, 22, C.legnoChiaro);
  rett(ctx, C.legnoLuce, 106, 20, 108, 1);
  rett(ctx, C.legnoScuro, 107, 29, 106, 1);
  rett(ctx, C.legno, 106, 38, 108, 2);
  testo(ctx, `MINUTI ${minuti}/${limite}`, 160, 21, { colore: C.fiammaChiara, allinea: "centro" });
  const x0 = 160 - Math.floor((limite * 3 - 1) / 2);
  const troppo = minuti + anteprima > limite;
  for (let i = 0; i < limite; i++) {
    const x = x0 + i * 3;
    let corpo = i < minuti ? C.legnoScuro : C.fiamma;
    let cima = i < minuti ? C.legnoScuro : C.fiammaChiara;
    if (anteprima && i >= minuti && i < minuti + anteprima) {        // le tacche che il viaggio consumerebbe
      corpo = f % 4 < 2 ? (troppo ? C.tappetoChiaro : C.giallo) : C.fiamma;
      cima = C.bianco;
    }
    if (!anteprima && i === minuti && f % 4 < 2) cima = C.bianco;    // la tacca che sta bruciando tremola
    rett(ctx, C.bordo, x, 31, 2, 6);
    rett(ctx, corpo, x, 31, 2, 5);
    rett(ctx, cima, x, 31, 2, 1);
  }
}
```

`f` = `g.fotogramma` (con riduciMovimento passate 0: niente lampeggi). Durante le animazioni i minuti mostrati non sono quelli della partita ma quelli dell'animazione (vedi sotto).

### Attraversare (animazione)

La partita cambia **subito**; il disegno segue un'animazione con i suoi dati (chi cammina, da dove a dove, minuti mostrati), e finché dura la scena si disegna da quelli.

- Durata `D = 200 + 10 · durata` ms (da 210 a 350 ms: il passo del più lento si vede). Avanzamento `t = trascorso / D`.
- Ogni mostro di `chi` va dal suo posto di partenza al suo posto d'arrivo (stesso indice s): `x = round(x0 + (x1 − x0) · t)`, piedi sempre a y 148. Guarda dove va: verso la porta `specchia: true`, verso il cancello `specchia: false`. Gambe: `passo` e `dritte` alternate ogni 6 pixel percorsi (`Math.floor(|x − x0| / 6) % 2`), il corpo 1 pixel più giù quando è su `passo`; il fantasma scivola senza gambe.
- La lanterna la prende chi è davanti: verso la porta `xL = clamp(xDavanti + 9, 106, 214)` con xDavanti la x più grande fra chi cammina; verso il cancello `xL = clamp(xDavanti − 9, 106, 214)` con la x più piccola. Quando `106 < xL < 214` è portata (cima 121), altrimenti sta a terra (cima 133): il primo la raccoglie passando e la posa all'arrivo, così finisce esattamente al suo posto di riposo.
- I minuti sulla tavola salgono da quelli di prima a quelli nuovi: `round(prima + durata · t)`.
- Il buio si ridisegna a ogni fotogramma con `luceX = xL` e `riva = null`; alla fine con la riva d'arrivo.
- Con `g.riduciMovimento`: niente animazione, tutto subito allo stato finale.

### Lanterna spenta (errore)

1. I mostri camminano come sopra ma si fermano alla frazione `fr = clamp((limite − minutiPrima) / durata, 0.2, 0.8)` del cammino (in `D · fr` ms); i minuti mostrati salgono fino a `limite`.
2. Per 300 ms la lanterna è **fioca** (150 ms) e poi **spenta**; da qui il buio si calcola con `luceX = null`.
3. Per 500 ms **buio pesto**: la tela `pesto` si riempie col suo retino (vedi «Livelli»); le tacche della tavola (tutte bruciate) lampeggiano `C.tappetoChiaro` / `C.legnoScuro` ogni 2 fotogrammi.
4. Fine: `pesto` si pulisce e la scena mostra la partita vera (tutti al cancello, lanterna accesa al suo posto, `MINUTI 0/L`).

Con riduciMovimento si salta subito al punto 4. Avviso, scossa e conto delle dorate li fa `g.errore`.

**Ricomincia confermato**: buio pesto per 250 ms (come al punto 3, senza lampeggi), poi la partita iniziale.

### Vittoria

Dal momento dell'ultima mossa (che ha già chiamato `g.risolto` con `ritardo: 1700`):

1. 0 → D: gli ultimi attraversano.
2. D → D + 300: la lanterna, ferma alla porta, diventa fioca (150 ms) e poi spenta; tutte le tacche bruciate.
3. D + 300 → D + 690: la porta si apre in tre passi di 130 ms (`apertura` 1, 2, 3); dal primo passo spariscono i cartellini, il buio si calcola con la riva della porta illuminata (`[208, 316]`) e compare il tappeto di luce.
4. D + 690 → D + 1100: Zucco sale nel vano da y 105 a y 99 (2 pixel a fotogramma) e i cinque mostri fanno un saltello in fila: il mostro nel posto s salta di 2 pixel per 2 fotogrammi, partendo s fotogrammi dopo il primo.

Poi resta così (respiro e palpebre continuano; la porta resta aperta). Con riduciMovimento si mostra subito lo stato finale. Lo stato «già risolto» è uguale allo stato finale della vittoria.

## 6. Aggancio per le prove

```js
g.espone({
  gioca,               // la stessa funzione usata da tocchi e bottoni
  statoGioco,
  posizione,           // (id) → { x, y }
  posizioneLanterna,   // () → { x, y }
});
```

- **`gioca(mossa)`**: applica UNA mossa logica, aggiorna subito la partita (le animazioni dopo) e ritorna l'esito:
  - `{ tipo: "attraversa", chi: ["fantasma", "strega"] }` → `{ ok: true, minuti, lanterna }` · `{ risolto: true, minuti }` · `{ errore: true, motivo: "spenta", minuti }` (minuti = quelli che si sarebbero raggiunti) · `{ valida: false, motivo: "quanti" | "chi" | "lanterna" }`;
  - `{ tipo: "ricomincia" }` → `{ errore: true, motivo: "ricomincia" }` · `{ valida: false, motivo: "inizio" }`;
  - qualsiasi altra cosa → `{ valida: false, motivo: "mossa" }`.
  
  `gioca` non passa dal «Conferma» del bottone e svuota la selezione come i tocchi.
- **`statoGioco()`**:

  ```js
  {
    lati: { fantasma: "porta", strega: "porta", zombie: "cancello", mummia: "cancello", scheletro: "cancello" },
    lanterna: "porta",
    minuti: 2,
    limite: 30,
    viaggi: [{ chi: ["fantasma", "strega"], verso: "porta", minuti: 2 }],
    scelti: [],          // gli id scelti in questo momento, nell'ordine in cui sono stati toccati
  }
  ```

  Con `g.giaRisolto`: tutti alla porta, lanterna alla porta, `minuti = limite`, `scelti` vuoto.
- **`posizione(id)`**: `{ x: centro del suo posto dalla parte dove si trova adesso, y: 132 }`.
- **`posizioneLanterna()`**: `{ x: 106 o 214 (dove si trova adesso), y: 140 }`.

La verifica clicca in questi punti con `t.clicScena`, usa i bottoni `attraversa`, `ricomincia` (due volte) e `testo`, ricarica la pagina a metà partita e alla fine aspetta 1,9 secondi dopo la mossa vincente.

## 7. Criteri di accettazione

Guardando le foto e giocando:

- [ ] All'apertura: cinque mostri in fila sul lastricato a sinistra, illuminati, che guardano a destra, ognuno col suo cartellino; la lanterna accesa a terra alla loro destra; il cortile in mezzo e la riva di destra al buio, con qualche coppia di occhi; il portale «INGRESSO» a destra con la lunetta accesa; la tavola «MINUTI 0/L» con tutte le tacche accese.
- [ ] Il mostro scelto si alza e ha il contorno giallo, il cartellino diventa giallo; sopra la lanterna compare «+N» e sulla tavola lampeggiano le tacche che il viaggio consumerebbe (rosse se non bastano).
- [ ] «Attraversa» (o il tocco sulla lanterna): i due camminano a destra al passo del più lento, il primo raccoglie la lanterna e la posa all'arrivo, il cerchio di luce li segue, gli occhi spariscono quando la luce si avvicina, i minuti salgono sulla tavola.
- [ ] Chi resta dalla parte senza lanterna è velato di scuro ma riconoscibile, e toccarlo dà «La lanterna è dall'altra parte del cortile.»
- [ ] Un viaggio che supera il limite: la lanterna si spegne a metà cortile, buio pesto, scossa e avviso «La lanterna si è spenta a metà cortile», poi tutti di nuovo al cancello e un errore in più.
- [ ] «Ricomincia» chiede conferma («Conferma») e solo al secondo tocco conta un errore.
- [ ] La soluzione al minuto esatto: la lanterna si spegne appena arrivati, la porta si apre, luce sul prato, Zucco fa capolino, i mostri saltellano; poi la carta della vittoria con il riepilogo.
- [ ] Ricaricando a metà partita i mostri sono dove erano; ricaricando dopo la vittoria si vede lo stato finale.
- [ ] Sul telefono (orizzontale e verticale) i cartellini si leggono, i mostri si toccano facilmente e nulla di importante finisce sotto le barre del kit (y < 16 o y ≥ 154).
- [ ] Con «riduci movimento»: niente animazioni continue, ogni mossa salta allo stato finale.
- [ ] `node demo/comune/prova.mjs lanterna-cortile` finisce con «TUTTO OK».
