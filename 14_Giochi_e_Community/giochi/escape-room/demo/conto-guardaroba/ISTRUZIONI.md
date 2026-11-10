# Il conto del guardaroba — istruzioni per il costruttore

Valgono insieme a [`../REGOLE_COMUNI.md`](../REGOLE_COMUNI.md) e al kit (`../comune/kit.js`). Qui c'è solo quello che è specifico di questo rompicapo. `index.html` è la copia di `../_esempio/index.html` con `<title>Il conto del guardaroba</title>`; la logica e il disegno vanno in `gioco.js`.

```js
EscapeDemo.avvia(opzioni); // opzioni = { id: "conto-guardaroba", sfondo: "ingresso", velo: 0.55, variante, crea }, con il testo assegnato in crea (§2)
```

Nei pezzi di codice qui sotto `rett`, `riquadro`, `retino`, `sprite`, `testo` sono quelli di `EscapeDemo`; dove il primo argomento `ctx` manca (nelle tabelle e negli elenchi) è sottinteso.

---

## 1. In breve

Sul bancone del guardaroba c'è un conto scritto in lettere, in colonna (per esempio `TESCHIO + TRUCCO = SCHERZO`): ogni lettera è una cifra, lettere diverse sono cifre diverse, nessun numero comincia con lo zero. Il giocatore appende a ogni lettera uno dei dieci gettoni numerati del guardaroba (0–9, uno per cifra) e vede le cifre comparire sul conto. Quando tutte e dieci le lettere hanno il loro gettone preme **Paga**: se la somma torna ha vinto, altrimenti è un errore.

---

## 2. Variante

### Il generatore

Il conto del giocatore è uno dei **45 conti** qui sotto, tutti già verificati con un risolutore a colonne: dieci lettere diverse (quindi si usano tutte e dieci le cifre), **una sola soluzione**, al massimo sette colonne, nessun risultato uguale a un altro.

```js
variante(rng) {
  const indice = Math.floor(rng() * POOL.length);      // UNA sola chiamata a rng
  const [a, b, c] = POOL[indice];
  return {
    indice,                                             // posizione nel POOL (0…44)
    a, b, c,                                            // i tre numeri in lettere: a + b = c
    lettere: [...new Set(a + b + c)],                   // le 10 lettere, in ordine di prima comparsa leggendo a, b, c
    iniziali: [...new Set([a[0], b[0], c[0]])],         // le lettere che non possono valere 0
  };
}
```

L'oggetto `variante` ha **solo questi sei campi**: i numeri della soluzione non ci vanno (finirebbero in `window.__demo.variante`, e nel gioco vero il controllo lo farà il server).

### L'elenco dei conti (da copiare così, nello stesso ordine)

Le ultime tre colonne sono la soluzione. In `gioco.js` servono solo per mostrare il conto pagato quando il rompicapo era già risolto (`g.giaRisolto`) e per un controllo all'avvio (se una voce non torna, `console.error`): **Paga non li usa** (vedi §3).

```js
const POOL = [
  ["TESCHIO", "TRUCCO", "SCHERZO", "5863790", "514330", "6378120"], // 0
  ["NEBBIA", "OMBRA", "BRIVIDO", "981127", "45107", "1026234"], // 1
  ["MUMMIA", "TRUCCO", "VAMPIRO", "242250", "784339", "1026589"], // 2
  ["STREGHE", "TORTA", "SPIRITO", "8375295", "31736", "8407031"], // 3
  ["SPIRITO", "TERRORE", "ARTIGLI", "2594931", "3844148", "6439079"], // 4
  ["NOTTE", "OMBRA", "CRANIO", "86557", "63249", "149806"], // 5
  ["STREGA", "STREGHE", "TESCHIO", "568217", "5682132", "6250349"], // 6
  ["NOTTE", "STREGHE", "SCHERZO", "20665", "4695315", "4715980"], // 7
  ["MOSTRO", "NOTTE", "TESCHIO", "976147", "87110", "1063257"], // 8
  ["MOSTRO", "ZOMBIE", "SPIRITO", "561976", "865320", "1427296"], // 9
  ["MOSTRO", "STRIGE", "ARTIGLI", "697849", "784203", "1482052"], // 10
  ["MOSTRO", "SPIRITO", "STREGHE", "491569", "1076759", "1568328"], // 11
  ["CRIPTA", "NOTTI", "SPETTRO", "958026", "74228", "1032254"], // 12
  ["DOLCE", "TRUCCO", "CANDELA", "86314", "972116", "1058430"], // 13
  ["SCHERZO", "TRUCCO", "TESCHIO", "7563140", "812550", "8375690"], // 14
  ["MORTO", "TERRORE", "CANDELA", "61741", "4977179", "5038920"], // 15
  ["SPETTRO", "TERRORE", "ARTIGLI", "1847726", "7422624", "9270350"], // 16
  ["CORVO", "TERRORE", "CANDELA", "61741", "5977179", "6038920"], // 17
  ["NEBBIA", "STREGA", "STREGHE", "948837", "105427", "1054264"], // 18
  ["CATENE", "CIOCCO", "ARTIGLI", "814505", "827887", "1642392"], // 19
  ["CATENE", "CRANIO", "SPIRITO", "923060", "952674", "1875734"], // 20
  ["LAPIDE", "SPIRITO", "TERRORE", "429513", "6958570", "7388083"], // 21
  ["DIAVOLO", "MUMMIA", "VAMPIRO", "7608191", "434460", "8042651"], // 22
  ["DIAVOLO", "NEBBIA", "BRIVIDO", "8501636", "749950", "9251586"], // 23
  ["STREGHE", "TRUCCO", "TESCHIO", "4520310", "527886", "5048196"], // 24
  ["DENTI", "TERRORE", "CANDELA", "79641", "4988289", "5067930"], // 25
  ["ARTIGLI", "STREGA", "SPETTRO", "6352492", "753046", "7105538"], // 26
  ["ARTIGLI", "MUMMIA", "TERRORE", "4856716", "232264", "5088980"], // 27
  ["ARTIGLI", "TERRORE", "SPETTRO", "5834704", "3288682", "9123386"], // 28
  ["ARTIGLI", "MOSTRI", "TERRORE", "7982302", "516892", "8499194"], // 29
  ["NOTTI", "SPETTRO", "STREGHE", "41778", "2697731", "2739509"], // 30
  ["MOSTRI", "SPETTRO", "STREGHE", "582671", "2096678", "2679349"], // 31
  ["MOSTRI", "SPIRITO", "STREGHE", "548627", "8072764", "8621391"], // 32
  ["GHOUL", "STREGHE", "SPETTRO", "76289", "4053763", "4130052"], // 33
  ["FESTE", "SCHERZO", "STREGHE", "89539", "5279640", "5369179"], // 34
  ["FESTE", "SPIRITO", "TESCHIO", "50340", "3986842", "4037182"], // 35
  ["CIOCCO", "MOSTRO", "BRIVIDO", "420440", "905830", "1326270"], // 36
  ["CIOCCO", "CRIPTA", "TESCHIO", "678668", "647910", "1326578"], // 37
  ["CIOCCO", "LAPIDE", "TERRORE", "720770", "934286", "1655056"], // 38
  ["CIOCCO", "STREGHE", "SPETTRO", "542552", "7360810", "7903362"], // 39
  ["CIOCCO", "ZOMBIE", "SCHERZO", "368338", "982460", "1350798"], // 40
  ["CIOCCO", "ZOMBIE", "BRIVIDO", "349339", "896140", "1245479"], // 41
  ["CAPPA", "TESCHIO", "TERRORE", "16556", "3071924", "3088480"], // 42
  ["CAPPA", "CRIPTA", "STREGHE", "96776", "935706", "1032482"], // 43
  ["CRANIO", "MUMMIA", "TERRORE", "538762", "494468", "1033230"], // 44
];
```

### Esempi (con il generatore qui sopra e il `casuale` del kit)

| Seme | indice | Conto | Soluzione | `lettere` | `iniziali` |
|---|---|---|---|---|---|
| 7 | 0 | TESCHIO + TRUCCO = SCHERZO | 5863790 + 514330 = 6378120 | T E S C H I O R U Z | T, S |
| 4242 | 24 | STREGHE + TRUCCO = TESCHIO | 4520310 + 527886 = 5048196 | S T R E G H U C O I | S, T |
| 12345 | 44 | CRANIO + MUMMIA = TERRORE | 538762 + 494468 = 1033230 | C R A N I O M U T E | C, M, T |
| 8 | 7 | NOTTE + STREGHE = SCHERZO | 20665 + 4695315 = 4715980 | N O T E S R G H C Z | N, S |

Con il seme 7, per esempio, la soluzione è T=5, E=8, S=6, C=3, H=7, I=9, O=0, R=1, U=4, Z=2. Il seme 12345 è quello delle foto di `prova.mjs`.

### Il testo della carta iniziale

Il testo dipende dalla variante, che però la sceglie il kit dentro `avvia`. Non serve calcolarla prima: il kit legge `opzioni.testo` solo quando mostra la carta, cioè **dopo** aver chiamato `variante(...)` e `crea(g)`. Quindi tieni l'oggetto delle opzioni in una costante e assegna il testo dentro `crea`:

```js
const opzioni = {
  id: "conto-guardaroba", sfondo: "ingresso", velo: 0.55,
  variante: generaVariante,
  crea(g) {
    opzioni.testo = testoDi(g.variante);   // la carta iniziale (e il bottone «Testo») mostrano questo
    // … il resto del rompicapo
  },
};
EscapeDemo.avvia(opzioni);
```

Il testo, con le tre parole della variante al posto di `{A}`, `{B}`, `{C}` e le righe separate da `\n`:

```
Sul bancone del guardaroba lo scheletro ha lasciato il conto della serata, scritto in lettere:
{A} + {B} = {C}
Ogni lettera è una cifra, lettere diverse sono cifre diverse e nessun numero comincia con lo zero. Per ritirare il cappotto bisogna dire quanto fa {C}.
Appendi a ogni lettera il gettone con la sua cifra, poi paga il conto.
```

---

## 3. Regole e mosse

### Lo stato del rompicapo

```js
{
  assegnate: { T: 5, E: null, ... }, // una voce per ogni lettera di variante.lettere, nello stesso ordine: cifra 0–9 o null
  ultimoSbagliato: null,             // le cifre dell'ultimo conto pagato sbagliato, in ordine di variante.lettere (es. "5863740192")
  pagato: false,
}
```

I gettoni sono **dieci oggetti, uno per cifra**: una cifra può stare su una sola lettera. Tutte le regole del conto (cifre diverse, gettone che si sposta) discendono da qui.

Scrivi la logica come funzione pulita, per esempio `applica(stato, mossa, variante) → { stato, esito }`, senza disegno né messaggi; sopra ci metti una funzione `mossa(m)` che la chiama, aggiorna lo stato, salva la memoria, scrive il messaggio, chiama `g.errore` / `g.risolto` e fa partire le animazioni. **Tocchi, bottoni, tastiera e `gioca` passano tutti da `mossa(m)`.**

### Le mosse

| Mossa | Cosa fa | Esito |
|---|---|---|
| `{ tipo: "appendi", lettera: "T", cifra: 5 }` | Appende il gettone 5 alla T. Se il 5 era su un'altra lettera, quella resta senza gettone (il gettone si sposta). Se la T aveva già un altro gettone, quello torna al suo gancio. Se la T aveva già il 5, non cambia niente. | `{ ok: true, tolta, liberata }`: `tolta` è la lettera che ha perso il 5 (o `null`), `liberata` la cifra che la T aveva prima e che torna al gancio (o `null`) |
| `{ tipo: "togli", lettera: "T" }` | Toglie il gettone dalla T (torna al suo gancio). | `{ ok: true }` |
| `{ tipo: "svuota" }` | Tutti i gettoni tornano ai ganci. | `{ ok: true }` |
| `{ tipo: "paga" }` | Controlla il conto (sotto). | `{ risolto: true }` oppure `{ errore: true, motivo: "conto" }` |

**Paga** si controlla così, solo con le cifre appese: si leggono i tre numeri (`a`, `b`, `c` con le cifre di `assegnate`) e si verifica che `a + b === c`. Siccome ogni conto dell'elenco ha una sola soluzione, la somma torna solo con quella. Non confrontare con i numeri del `POOL`.

### Mosse rifiutate (non sono errori: nessun conteggio, nessuna scossa)

Ritornano `{ valida: false, motivo }` e lasciano lo stato com'è:

| Caso | `motivo` | Messaggio nel fumetto |
|---|---|---|
| `appendi` o `togli` con una lettera che non è nel conto | `"lettera"` | — (dall'interfaccia non può succedere) |
| `appendi` con una cifra che non è un intero da 0 a 9 | `"cifra"` | — |
| `appendi` dello **0** su una lettera di `iniziali` | `"zero"` | `Lo zero non può stare in testa a un numero.` |
| `togli` su una lettera senza gettone | `"vuota"` | — |
| `svuota` quando nessuna lettera ha un gettone | `"vuota"` | `Non c'è nessun gettone da togliere.` |
| `paga` con almeno una lettera senza gettone | `"incompleto"` (aggiungi `mancano: n`) | `Manca 1 gettone: ogni lettera vuole il suo.` oppure `Mancano {n} gettoni: ogni lettera vuole il suo.` |
| `paga` con esattamente le stesse cifre dell'ultimo conto sbagliato (`ultimoSbagliato`) | `"uguale"` | `È lo stesso conto di prima: cambia qualche gettone.` |
| `tipo` sconosciuto o mossa senza `tipo` | `"mossa"` | — |

### L'errore

**Conta come errore: pagare un conto completo che non torna** (è il «numero sbagliato» della scheda). Allora:

- `g.errore("Il conto non torna")` (il kit conta l'errore, scuote la scena e aggiunge da solo «· ora le dorate in palio sono …»);
- fumetto: `Lo scheletro rifà la somma e scuote la testa.`;
- `ultimoSbagliato` = le cifre appese in ordine di `variante.lettere`, come stringa;
- **i gettoni restano appesi** (il giocatore corregge quello che vuole);
- reazione nella scena (§5): campanello, riga del risultato che lampeggia in rosso, timbro «NON TORNA», lo scheletro scuote la testa.

Il rompicapo vale **4 dorate, una in meno ogni 2 errori, minimo 1** (lo fa il kit). Non c'è limite di tentativi.

### La vittoria

Paga con la somma giusta: `pagato = true`, fumetto `Il conto torna! Lo scheletro ti ridà il cappotto.`, animazione di vittoria (§5) e subito

```js
g.risolto({ riepilogo: `${a} + ${b} = ${c}\n${na} + ${nb} = ${nc}`, ritardo: 1200 });
```

dove `na`, `nb`, `nc` sono i numeri letti dalle cifre appese. Lo stato cambia subito; la carta arriva dopo 1,2 secondi.

### Selezione e azzeramento

Dopo ogni mossa **riuscita** (esito `ok`, `errore` o `risolto`) la selezione dell'interfaccia (§4) si azzera. Dopo una mossa **rifiutata** la selezione resta com'era.

### La memoria (resiste al ricaricamento)

Dopo ogni mossa che cambia lo stato: `g.memoria.conto = "A+B=C"` (le tre parole della variante), `g.memoria.assegnate = {…}`, `g.memoria.ultimoSbagliato = …`, poi `g.salvaMemoria()`. All'avvio, se `g.memoria.conto` è il conto della variante, si riparte da lì; altrimenti da tutte le lettere vuote.

### Già risolto

Con `g.giaRisolto`: `assegnate` = la soluzione presa dal `POOL` (cifra per cifra dalle parole e dai numeri), `pagato = true`, timbro PAGATO, cappotto sollevato con i luccichii (§5). Fumetto: `Il conto è pagato: il cappotto è tuo.` (l'input lo blocca il kit).

---

## 4. Interfaccia

### Cosa si tocca

Due tipi di bersagli, entrambi nell'area di gioco:

- **le celle del conto**: ogni lettera del conto è una cella di 14×20 pixel (coordinate in §5); toccare una cella vuol dire toccare **quella lettera** (tutte le sue comparse sono la stessa lettera);
- **i dieci gettoni** appesi al bancone, dallo 0 al 9.

Zone di tocco (pixel della scena):

- cella: `x` da `cx` a `cx + 13`, `y` da `cy` a `cy + 19` (`cx`, `cy` della cella, §5);
- gettone `d` (centro `gx = 70 + 20 × d`): `x` da `gx − 10` a `gx + 9`, `y` da 119 a 152.

### Tocco o trascinamento

Usa `g.tocca`. Un'azione si decide al **rilascio** (`"su"`):

- se fra `"giu"` e `"su"` il puntatore si è spostato meno di 4 pixel della scena, è un **tocco** nel punto di rilascio;
- se si è spostato di 4 pixel o più **ed era partito da un gettone**, è un **trascinamento** di quel gettone (anche se è già appeso a una lettera); partito da altrove non fa niente.

### Il tocco (la selezione: al massimo una lettera o un gettone)

| Selezione attuale | Tocchi la lettera L | Tocchi il gettone d | Tocchi altrove |
|---|---|---|---|
| niente | seleziona L | seleziona d | niente |
| lettera M | se L = M deseleziona; altrimenti seleziona L | se M ha già il gettone d → `togli M`; altrimenti → `appendi M d` | deseleziona |
| gettone c | se L ha già il gettone c → `togli L`; altrimenti → `appendi L c` | se d = c deseleziona; altrimenti seleziona d | deseleziona |

Quando la selezione cambia, il fumetto lo dice (testi sotto). Deselezionare non cambia il fumetto.

### Il trascinamento

Mentre trascini, il gettone segue il dito (§5) e le celle della lettera sotto il dito hanno il contorno d'oro. Al rilascio su una cella → `appendi` (lettera della cella, cifra del gettone); fuori dalle celle il gettone torna al suo gancio e non succede niente. Dopo un trascinamento la selezione si azzera (anche se l'`appendi` è stato rifiutato, per esempio lo zero in testa: in quel caso il fumetto dà il messaggio del rifiuto).

### Tastiera (facoltativa)

Una lettera del conto seleziona quella lettera; una cifra 0–9 con una lettera selezionata fa come toccare quel gettone; Backspace o Canc con una lettera selezionata → `togli`; Invio → Paga.

### Bottoni (`g.bottone`)

1. **Paga** — `g.bottone("Paga", …, { id: "paga", forte: true })` → `mossa({ tipo: "paga" })`.
2. **Svuota** — `g.bottone("Svuota", …, { id: "svuota" })` → `mossa({ tipo: "svuota" })`.

Tutti e due sempre attivi (i casi in cui non servono li gestiscono i rifiuti, con il loro messaggio).

### I messaggi del fumetto (testi esatti)

| Quando | Testo |
|---|---|
| all'avvio | `Tocca una lettera del conto, poi il gettone con la sua cifra.` |
| all'avvio, già risolto | `Il conto è pagato: il cappotto è tuo.` |
| selezioni la lettera L, senza gettone | `Lettera {L}: tocca il gettone con la sua cifra.` |
| selezioni la lettera L, che ha il gettone d | `La {L} ha il gettone {d}: toccane un altro, o lo stesso per toglierlo.` |
| selezioni il gettone d, libero | `Gettone {d}: tocca la lettera a cui appenderlo.` |
| selezioni il gettone d, appeso alla M | `Il gettone {d} è sulla {M}: tocca un'altra lettera per spostarlo.` |
| `appendi` riuscito, gettone che era libero | `Appeso il gettone {d} alla {L}.` |
| `appendi` riuscito, gettone che era sulla M | `Il gettone {d} passa dalla {M} alla {L}.` |
| `appendi` riuscito che lascia **tutte** le lettere con un gettone (al posto dei due sopra) | `Ogni lettera ha il suo gettone: quando sei pronto, paga.` |
| `appendi` che non cambia niente (stesso gettone sulla stessa lettera) | nessun messaggio nuovo |
| `togli` | `Tolto il gettone {d} dalla {L}.` |
| `svuota` | `Tutti i gettoni tornano al loro gancio.` |
| i rifiuti | vedi la tabella in §3 |
| conto sbagliato | `Lo scheletro rifà la somma e scuote la testa.` (più `g.errore("Il conto non torna")`) |
| conto giusto | `Il conto torna! Lo scheletro ti ridà il cappotto.` |

(Le lettere sono femminili: «la T», «alla T», «dalla T», «sulla T».)

---

## 5. Grafica

Scena 320×180, sfondo `ingresso` (la facciata della casa della festa), `velo: 0.55`. Il guardaroba è un banco montato davanti al portone: un bancone di legno da un bordo all'altro, lo scheletro guardarobiere dietro a sinistra, l'attaccapanni con i cappotti dietro a destra, il **conto** su una tavoletta in mezzo (copre il portone, il punto più affollato dello sfondo), i **gettoni** appesi sul davanti del bancone e Zucco, il cliente, davanti a destra.

Ridisegna tutto a ogni fotogramma con `g.anima` (`clearRect`, poi disegno), come l'esempio. Tutto a coordinate intere, con `EscapeDemo.rett`, `riquadro`, `retino`, `sprite`, `testo`. Colori solo da `EscapeDemo.C` tranne Zucco (vedi sotto).

### Ordine di disegno (dal fondo al davanti)

1. attaccapanni e cappotti;
2. scheletro (busto, cranio, mandibola, papillon, cappello);
3. bancone (piano e davanti), fascia dei gettoni, barra d'ottone;
4. mani dello scheletro sul piano;
5. candela e campanello;
6. tavoletta, conto, timbri;
7. gettoni (ganci, gettoni, cifre, cartellini), tranne quello trascinato;
8. Zucco;
9. il gettone trascinato.

### Tavolozze

```js
const { C } = EscapeDemo;
const PAL_SCHELETRO = { k: C.bordo, W: C.bianco, s: C.pietraChiara, S: C.pietra, n: C.nero, o: C.oro, O: C.oroScuro, r: C.tappetoChiaro, R: C.tappeto };
const PAL_GETTONE   = { k: C.bordo, w: C.bianco, y: C.giallo, o: C.oro, O: C.oroScuro };          // gettone libero
const PAL_USATO     = { k: C.bordo, w: C.oro, y: C.oroScuro, o: C.legnoLuce, O: C.legnoChiaro };  // gettone appeso a una lettera (ottone brunito)
const PAL_SCELTO    = { ...PAL_GETTONE, k: C.bianco };                                             // gettone selezionato o trascinato
const PAL_OGGETTI   = { k: C.bordo, W: C.bianco, w: C.bianco, s: C.pietraChiara, S: C.pietra, y: C.giallo, o: C.oro, O: C.oroScuro };
const PAL_FIAMMA    = { k: C.brace, y: C.fiamma, h: C.fiammaChiara };
const PAL_VESTITI   = { k: C.bordo, r: C.tappetoChiaro, R: C.tappeto, v: C.viola, V: C.violaScuro, q: C.lilla,
                        h: C.fiammaChiara, y: C.fiamma, O: C.brace, o: C.oro, g: C.erba, G: C.erbaScura };
// Zucco con i colori del suo sprite nella fuga di Zucco (eccezione motivata: è lo stesso personaggio, deve essere identico).
const PAL_ZUCCO = { k: "#160f1e", o: "#9c3b17", O: "#d9661a", y: "#f59a2e", h: "#ffd07a", b: "#4a1a12", G: "#2d5a2e", g: "#5f9440",
                    E: "#ffb52e", e: "#fff3b0", P: "#3f2a78", p: "#6a43b8", q: "#a47bf0", B: "#463a6a", L: "#7a6aa4", R: "#5e3c44", T: "#83575c" };
```

Nell'animazione l'arancione negli occhi dello scheletro (`o`) alterna `C.oro` e `C.fiamma` (§ Animazioni).

### Il bancone

```js
rett(ctx, C.bordo, 0, 115, 320, 7);           // piano: y 115…121
rett(ctx, C.legnoLuce, 0, 116, 320, 1);
rett(ctx, C.legnoChiaro, 0, 117, 320, 3);
rett(ctx, C.legno, 0, 120, 320, 1);
rett(ctx, C.legno, 0, 122, 320, 58);          // davanti: y 122 fino in fondo (sotto la barra del kit è solo decorazione)
rett(ctx, C.bordo, 0, 122, 320, 1);
for (const [x, w] of [[10, 42], [268, 42]]) { // due pannelli incassati ai lati
  rett(ctx, C.legnoScuro, x, 127, w, 1); rett(ctx, C.legnoScuro, x, 127, 1, 50);
  rett(ctx, C.legnoChiaro, x + 1, 176, w - 1, 1); rett(ctx, C.legnoChiaro, x + w - 1, 128, 1, 49);
}
rett(ctx, C.legnoScuro, 56, 125, 208, 30);    // fascia scura dietro i gettoni
rett(ctx, C.bordo, 56, 125, 208, 1);
riquadro(ctx, 58, 122, 204, 4, C.oroScuro);   // barra d'ottone dei ganci
rett(ctx, C.oro, 59, 123, 202, 1);
```

### La tavoletta e il conto (il centro della scena)

```js
riquadro(ctx, 96, 18, 128, 101, C.legnoChiaro);                               // tavoletta: x 96…223, y 18…118 (poggia sul piano)
rett(ctx, C.legnoLuce, 97, 19, 126, 1); rett(ctx, C.legnoLuce, 97, 19, 1, 99);  // luce in alto e a sinistra
rett(ctx, C.legno, 222, 20, 1, 98);     rett(ctx, C.legno, 98, 117, 125, 1);    // ombra a destra e sotto
rett(ctx, C.bordo, 99, 21, 122, 92);                                          // carta: bordo
rett(ctx, C.luna, 100, 22, 120, 89);                                          // carta: x 100…219, y 22…110
retino(ctx, C.luna, C.fiammaChiara, 212, 22, 8, 89, 0.35);                    // bordo destro ingiallito
for (let x = 100; x < 220; x += 4) rett(ctx, C.luna, x, 111, 2, 1);           // il bordo strappato in fondo
riquadro(ctx, 148, 15, 24, 9, C.ferroChiaro);                                 // la molla in alto
rett(ctx, C.pietraChiara, 149, 16, 22, 1); rett(ctx, C.ferro, 149, 22, 22, 1);
riquadro(ctx, 157, 12, 6, 5, C.pietra);
testo(ctx, "CONTO", 104, 26, { colore: C.bordo, ombra: null });
testo(ctx, "GUARDAROBA", 104, 35, { colore: C.legnoChiaro, ombra: null, piccolo: true });
for (let x = 104; x <= 215; x += 2) rett(ctx, C.pietra, x, 42, 1, 1);         // riga a puntini
testo(ctx, "+", 106, 75, { colore: C.bordo, ombra: null });
rett(ctx, C.bordo, 104, 87, 112, 2);                                          // la riga della somma
```

**Le celle.** Il conto ha sette colonne allineate a destra; la colonna `j` (0 a sinistra, 6 = unità) ha `cx = 116 + 14 × j`. Le tre righe hanno `cy = 44` (a), `65` (b), `91` (c). La parola `w` occupa le colonne da `7 − w.length` a 6. Ogni cella è 14×20 da (`cx`, `cy`):

- la **lettera**: `testo(ctx, L, cx + 5, cy + 1, { colore: C.bordo, ombra: null })`;
- la **cifra**, se la lettera ha un gettone: `testo(ctx, String(d), cx + 5, cy + 10, { colore: C.tappeto, ombra: null })` (inchiostro rosso);
- **senza gettone**: quattro trattini `rett(ctx, C.pietra, cx + 3 + 3 × k, cy + 18, 2, 1)` per `k` da 0 a 3.

Stati della cella:

| Stato | Disegno |
|---|---|
| normale | come sopra |
| lettera selezionata (tutte le sue comparse) | `rett(C.viola, cx + 1, cy, 12, 20)`, `rett(C.lilla, cx + 2, cy + 1, 10, 18)`; lettera, cifra e trattini in `C.bianco` |
| sotto il dito durante un trascinamento (tutte le comparse) | contorno di 1 pixel `C.oro`: `rett(C.oro, cx, cy, 14, 1)`, `rett(C.oro, cx, cy + 19, 14, 1)`, `rett(C.oro, cx, cy, 1, 20)`, `rett(C.oro, cx + 13, cy, 1, 20)` |
| errore, riga del risultato (c) mentre lampeggia | `rett(C.tappetoChiaro, cx + 2, cy + 9, 11, 10)` e la cifra in `C.bianco` |

**I timbri** (in alto a destra della carta, dove non c'è scritto niente):

- **NON TORNA** (dopo un errore, per 12 fotogrammi = 1,5 s): `rett(C.tappetoChiaro, 155, 24, 62, 11)`, `rett(C.luna, 156, 25, 60, 9)`, `testo("NON TORNA", 186, 26, { colore: C.tappetoChiaro, ombra: null, allinea: "centro" })`;
- **PAGATO** (dalla vittoria in poi, per sempre): `rett(C.erba, 177, 24, 40, 11)`, `rett(C.luna, 178, 25, 38, 9)`, `testo("PAGATO", 197, 26, { colore: C.erba, ombra: null, allinea: "centro" })`. Nel fotogramma prima che compaia: un lampo `rett(C.bianco, 177, 24, 40, 11)`.

### I gettoni

Il gettone `d` ha centro `gx = 70 + 20 × d`. Sprite 13×15 in (`gx − 6`, `127 − su`), dove `su` = 3 se è selezionato, altrimenti 0.

```js
// Il gettone del guardaroba: medaglietta d'ottone con il buco in alto (13×15)
const GETTONE = [
  "....kkkkk....",
  "..kkwyyyokk..",
  ".kyyykkkooOk.",
  ".kyyk...kOOk.",
  "kyyyykkkooOOk",
  "kwyooooooooOk",
  "kyoooooooooOk",
  "kyoooooooooOk",
  "kyoooooooooOk",
  "kyoooooooooOk",
  "kyoooooooooOk",
  "kyoooooooooOk",
  ".kyoooooooOk.",
  "..kkOOOOOkk..",
  "....kkkkk....",
];
```

Per ogni gettone, nell'ordine:

1. lo sprite con la tavolozza dello stato: libero `PAL_GETTONE`, appeso a una lettera `PAL_USATO`, selezionato `PAL_SCELTO`;
2. il gancio, sopra lo sprite: `rett(C.pietraChiara, gx, 124, 1, 6 − su)` e `rett(C.ferro, gx, 130 − su, 1, 1)` (si vede attraverso il buco);
3. la cifra incisa: `testo(String(d), gx − 2, 132 − su, { colore: C.legnoScuro, ombra: libero ? C.giallo : C.oroScuro })`;
4. se è appeso alla lettera L, il **cartellino** sotto: `rett(C.pietraChiara, gx, 142, 1, 1)` (lo spago), `riquadro(gx − 4, 143, 9, 9, C.luna)`, `testo(L, gx, 145, { piccolo: true, colore: C.bordo, ombra: null, allinea: "centro" })`. Se L è la lettera selezionata, il cartellino ha fondo `C.lilla` e la lettera `C.bianco`.

Il gettone trascinato non si disegna sul suo gancio (il gancio resta, il cartellino no): si disegna per ultimo con `PAL_SCELTO` in (`round(x) − 6`, `round(y) − 7`) e la cifra in (`round(x) − 2`, `round(y) − 2`) con `ombra: C.giallo`, dove x, y è il dito in pixel della scena.

### Lo scheletro guardarobiere (dietro il bancone, a sinistra)

Riferimento `bx = 22`, `by = 76`. Con `dy` (respiro) e `dx` (scuote la testa) delle animazioni:

| Pezzo | Posizione |
|---|---|
| `BUSTO` | (`bx`, `by + dy`) — il bancone ne copre il fondo |
| `CRANIO` | (`bx + 12 + dx`, `by − 15 + dy`) |
| `MANDIBOLA` | (`bx + 15 + dx`, `by − 1 + dy`), un pixel più giù quando parla |
| `PAPILLON` | (`bx + 16`, `by + 3 + dy`) |
| `CAPPELLO` | (`bx + 13 + dx`, `by − 20 + dy`) |
| mano sinistra (dopo il bancone) | `MANO` in (`bx + 7`, 112) |
| mano destra (dopo il bancone) | `MANO` specchiata (`{ specchia: true }`) in (`bx + 23`, 112); quando tamburella, `MANO_TAMBURELLA` specchiata |

Tutti con `PAL_SCHELETRO`, nell'ordine della tabella (la mandibola copre l'ultima riga del cranio; da chiusa combacia, da aperta lascia vedere la riga scura della bocca).

```js
// Lo scheletro dalla vita in su: spalle, braccia appoggiate, costole, colonna (41×40)
const BUSTO = [
  "..................kssSk..................",
  "..................kWssk..................",
  "..................kssSk..................",
  "....kkkk..........kWssk..........kkkk....",
  "...kWWWWkkkkkkkkkkkssSkkkkkkkkkkkWWWWk...",
  "..kWsssssWWWWWWWWWWWWWWWWWWWWWWWsssssSk..",
  "..kWssssSsssssssssssSssssssssSSSsssssSk..",
  "..kWssssSkkkkkkkkkkWsSkkkkkkkkkksssssSk..",
  "..ksssssSk.kkkkkkkkWsSkkkkkkkk.ksssssSk..",
  "...kssssk..kkWWWWWWWsSsssssskk..kSSSSk...",
  "...kWssSk.kWWssssssWsSSSSSSSssk.kWssSk...",
  "...kWssSk.ksskkkkkkWsSkkkkkkSSk.kWssSk...",
  "...kWssSk..kkWWWWWWWsSsssssskk..kWssSk...",
  "...kWssSk.kWWssssssWsSSSSSSSssk.kWssSk...",
  "...kWssSk.ksskkkkkkWsSkkkkkkSSk.kWssSk...",
  "...kWssSk..kkkWWWWWWsSssssskkk..kWssSk...",
  "...kWssSk..kWWsssssWsSSSSSSssk..kWssSk...",
  "...kWssSk..ksskkkkkWsSkkkkkSSk..kWssSk...",
  "...kWssSk..kkkkWWWWWsSsssskkkk..kWssSk...",
  "...kWssSk..kkWWssssWsSSSSSsskk..kWssSk...",
  "...kWssSk..kksskkkkWsSkkkkSSkk..kWssSk...",
  "...kWssSk..kkkkkWWWWsSssskkkkk..kWssSk...",
  "...kWssSk..kkkWWsssssSSSSsskkk..kWssSk...",
  "...kWssSk..kkksskkkkskkkkSSkkk..kWssSk...",
  "...kWssSk..kkkkkkkkkSkkkkkkkkk..kWssSk...",
  "..kWsssssk.kkkkkkkkkskkkkkkkkk.kWsssssk..",
  "..kWssssSk.kkkkkkkkkskkkkkkkkk.kWssssSk..",
  "..kWssssSk.........kSk.........kWssssSk..",
  "...kWsSkk..........ksk..........kkWsSk...",
  "....kWsSk..........ksk..........kWsSk....",
  "....kWsSk..........kSk..........kWsSk....",
  ".....kWsSk.........ksk.........kWsSk.....",
  ".....kWsSk.........ksk.........kWsSk.....",
  "......kWsSk........kSk........kWsSk......",
  ".......kWsSk.......ksk.......kWsSk.......",
  ".......kWsSk.......ksk.......kWsSk.......",
  "........kWsSk......kSk......kWsSk........",
  "........kWsSk......ksk......kWsSk........",
  ".........kWsSk.....ksk.....kWsSk.........",
  "..........kWsSk....kSk....kWsSk..........",
];

// Il cranio: occhiaie con il bagliore arancione (o), naso, denti di sopra (17×15)
const CRANIO = [
  ".....kkkkkkk.....",
  "...kkWWWWWWWskk..",
  "..kWWWWWWWWWWssk.",
  ".kWWWWWWWWWWWWssk",
  ".kWWWWWWWWWWWWssk",
  ".kWkkkkkWkkkkksSk",
  "kWWkonnkWkonnksSk",
  "kWWknnnkWknnnksSk",
  "kWWknnnkWknnnkSSk",
  "kWWWkkkWWWkkkSSSk",
  ".kWWWWWknkWWWWSk.",
  ".kWWWWWkkkWWWSSk.",
  "..kWWWWWWWWWSSk..",
  "..kWkWkWkWkWkSk..",
  "..kkkkkkkkkkkkk..",
];

// La mandibola: un pixel più giù quando lo scheletro parla (11×3)
const MANDIBOLA = [
  "kWkWkWkWkSk",
  ".kWWWWWWSk.",
  "..kkkkkkk..",
];

// Il papillon rosso (9×5)
const PAPILLON = [
  "kk.....kk",
  "krk...kRk",
  "krrkrkRRk",
  "krk...kRk",
  "kk.....kk",
];

// Il cappellino da guardarobiere, rosso con la fascia d'oro (15×7)
const CAPPELLO = [
  "....kkkkkkk....",
  "...krrrrrrRk...",
  "...krrrrrrRk...",
  "...krrrrrRRk...",
  "..kkoooooOOkk..",
  ".kRRRRRRRRRRRk.",
  "..kkkkkkkkkkk..",
];

// La mano sinistra appoggiata al bancone (la destra è la stessa specchiata) (11×6)
const MANO = [
  "...kkkkk...",
  "..kWsssSk..",
  ".kWsssssSk.",
  "kWskskskSk.",
  "kWkWkWkWkk.",
  ".k.k.k.k...",
];

// La mano che tamburella: un dito alzato (11×6)
const MANO_TAMBURELLA = [
  "...kkkkk...",
  "..kWsssSk..",
  ".kWsssssSkk",
  "kWskskskSsk",
  "kWkWkWkWk.k",
  ".k.k.k.k...",
];
```


### Candela e campanello (sul piano del bancone)

Candela in (75, 104) con `PAL_OGGETTI`, fiamma sopra in (77, 99) con `PAL_FIAMMA`. Campanello in (230, 110) con `PAL_OGGETTI`.

```js
// La candela nel candeliere d'ottone (9×15)
const CANDELA = [
  "...kkk...",
  "..kWssk..",
  "..kWssk..",
  "..kWsSk..",
  "..kWsSk..",
  "..kWsSk..",
  "..kWsSk..",
  "..kWsSk..",
  ".kkkkkkk.",
  "kyoooooOk",
  ".kkoooOk.",
  "...kok...",
  "..kyoOk..",
  ".kyoooOk.",
  "kkkkkkkkk",
];

// La fiamma della candela, tre fotogrammi (5×5 ciascuno)
const FIAMME = [
  ["..k..", ".kyk.", "kyhyk", "kyhyk", ".kyk."],
  ["...k.", "..kyk", ".kyhk", "kyhyk", ".kyk."],
  [".k...", "kyk..", "khyk.", "kyhyk", ".kyk."],
];

// Il campanello da banco (10×9)
const CAMPANELLO = [
  "....kk....",
  "...kwyk...",
  "..kkkkkk..",
  ".kwyyyyOk.",
  "kwyyyyyoOk",
  "kyyoooooOk",
  "kkkkkkkkkk",
  "kOOOOOOOOk",
  "kkkkkkkkkk",
];
```

### L'attaccapanni a piantana (dietro il bancone, a destra)

```js
rett(ctx, C.bordo, 286, 52, 5, 64); rett(ctx, C.legnoChiaro, 287, 52, 3, 64); rett(ctx, C.legnoLuce, 287, 52, 1, 64); // asta
for (const x of [277, 291]) {                                                                                     // due bracci
  rett(ctx, C.bordo, x, 55, 10, 3); rett(ctx, C.legnoLuce, x + 1, 56, 8, 1);
  const punta = x === 277 ? x : x + 9;
  rett(ctx, C.bordo, punta - 1, 51, 3, 6); rett(ctx, C.legnoLuce, punta, 52, 1, 4);
}
sprite(ctx, MANTELLO, PAL_VESTITI, 269, 54);              // a sinistra
sprite(ctx, CAPPOTTO, PAL_VESTITI, 290, cappottoY);        // a destra: cappottoY = 55, 49 dopo la vittoria
riquadro(ctx, 285, 48, 7, 5, C.legnoChiaro);               // pomello
sprite(ctx, STREGA, PAL_VESTITI, 281, 38);                 // il cappello da strega in cima
```

Il cappotto arancione è quello da ritirare: alla vittoria si solleva dal braccio e luccica.

```js
// Il mantello da vampiro: colletto alto, fodera rossa, orlo a punte (19×35)
const MANTELLO = [
  "....krrk...kRRk....",
  "...krrrk...kRRRk...",
  "...krrrkkkkkRRRk...",
  "...krrrVVVVVRRRk...",
  "...krrrVVVVVRRRk...",
  "...krrrvvRVVRRRk...",
  "....kqvvvRVVVVk....",
  "....kqvvvRVVVVk....",
  "....kqvvvRVVVVk....",
  "...kqvVvvRVVVVVk...",
  "...kqvVvvRVVVVVk...",
  "...kqvVvvRVVVVVk...",
  "..kqvVvvvRVVVVVVk..",
  "..kqvVvvvRVVVVVVk..",
  "..kqvVvvvRVVVVVVk..",
  ".kqvVvvvVRVVVVVVVk.",
  ".kqvVvvvVRVVVVVVVk.",
  ".kqvVvvvVRRVVVVVVk.",
  "kqvVvvvVvRRVVVVVVVk",
  "kqvVvvvVvRRVVVVVVVk",
  "kqvVvvvVvRRVVVVVVVk",
  "kqvVvvvVvRRVVVVVVVk",
  "kqvVvvvVvRRVVVVVVVk",
  "kqvVvvvVvRRVVVVVVVk",
  "kqvVvvvVvRRVVVVVVVk",
  "kqvVvvvVvRRVVVVVVVk",
  "kqvVvvvVvRRVVVVVVVk",
  "kqvVvvvVrRRVVVVVVVk",
  "kqvVvvvVrRRVVVVVVVk",
  "kqvVvvvVrRRVVVVVVVk",
  "kqvVvvvVrRRVVVVVVVk",
  "kqvVvvvVrRRVVVVVVVk",
  "kqkkkvkkkRkkkVkkkVk",
  "kqk.kvk.kRk.kVk.kVk",
  ".k...k...k...k...k.",
];

// Il cappotto arancione da ritirare: maniche, revers, bottoni d'oro (19×34)
const CAPPOTTO = [
  ".....k..k.k..k.....",
  "....kykkhkOkkyk....",
  "..kkyykkkkkkkyykk..",
  ".khyyhykkkkkOOOyOk.",
  ".khyyhykkkkkOOOyOk.",
  ".khyyhyykkkyOOOyOk.",
  ".khyyhyykkkyOOOyOk.",
  ".khykhyyykyyOOkyOk.",
  ".khykhyyykyyOOkyOk.",
  ".khykhyyyOyyOOkyOk.",
  ".khykhyyyOyyOOkyOk.",
  ".khykhyyyoyyOOkyOk.",
  ".khykhyyyOyyOOkyOk.",
  ".khykhyyyOyyOOkyOk.",
  ".khykhyyyOyyOOkyOk.",
  ".khykhyyyOyyOOkyOk.",
  ".khykhyyyoyyOOkyOk.",
  ".khykhyyyOyyOOkyOk.",
  ".khykhyyyOyyOOkyOk.",
  ".khykhyyyOyyOOkyOk.",
  ".khykhyyyOyyOOkyOk.",
  ".khykhyyyoyyOOkyOk.",
  ".khykhOOOOykkOkyOk.",
  ".khykhyyyOyyOOkyOk.",
  ".kookhyyyOyyOOkOok.",
  ".kookhyyyOyyOOkOOk.",
  "..kkkhyyyoyyOOkkk..",
  "....khyyyOyyOOk....",
  "....khyyyOyyOOk....",
  "....khyyyOyyOOk....",
  "....khyyyOyyOOk....",
  "....khyyyOyyOOk....",
  "....khyyyOyyOOk....",
  ".....kkkkkkkkk.....",
];

// Il cappello da strega in cima alla piantana (15×13)
const STREGA = [
  "..........kk...",
  ".........kgk...",
  "........kggk...",
  ".......kggGk...",
  "......kgggGk...",
  ".....kggggGk...",
  ".....kgggggGk..",
  "....kooooooOk..",
  "....kgggggggGk.",
  "kkkkgggggggggGk",
  "kgggggggggggGGk",
  ".kkGGGGGGGGGGk.",
  "..kkkkkkkkkkk..",
];
```

### Zucco (davanti al bancone, a destra)

Sprite 28×31 in (280, 121) **specchiato** (`{ specchia: true }`, così guarda verso il conto), con `PAL_ZUCCO`. È lo sprite in piedi della fuga di Zucco, con la lanterna.

```js
// Zucco in piedi con la lanterna (dalla fuga di Zucco); si disegna specchiato (28×31)
const ZUCCO = [
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
  "............BB..LL..........",
  "...........BB...LL..........",
  ".........kRRRkkTTTk.........",
  ".........kkkkkkkkkk.........",
];
```

### Animazioni (8 fotogrammi al secondo, `g.fotogramma`)

Continue (tutte spente con `g.riduciMovimento`):

- **fiamma della candela**: `FIAMME[[0, 1, 0, 2][g.fotogramma % 4]]` (con `g.riduciMovimento` sempre `FIAMME[0]`);
- **respiro dello scheletro**: `dy = Math.floor(g.fotogramma / 6) % 2` (busto, cranio, mandibola, papillon e cappello; le mani no);
- **occhi dello scheletro**: la lettera `o` è `C.oro` se `g.fotogramma % 6 < 3`, altrimenti `C.fiamma`;
- **lo scheletro tamburella**: ogni 32 fotogrammi, nei fotogrammi 0 e 2 del giro (`g.fotogramma % 32`), la mano destra usa `MANO_TAMBURELLA` (specchiata);
- **luccichii del cappotto** (solo da risolto): quattro stelline nei punti (288, 52), (310, 60), (309, 78), (288, 74); la stellina `k` (0…3) si vede quando `(g.fotogramma + 2 × k) % 8 < 3`; ognuna è un pixel `C.bianco` con i quattro vicini `C.giallo`.

A ogni evento (si contano i fotogrammi da quando succede; con `g.riduciMovimento` si salta allo stato finale):

| Evento | Animazione |
|---|---|
| ogni messaggio nuovo nel fumetto | la mandibola parla: abbassata di 1 pixel nei fotogrammi 0 e 2, poi ferma (4 fotogrammi) |
| `appendi` riuscito | il gettone appena appeso dondola: sprite, cifra e cartellino spostati di `[1, 0, −1, 0]` pixel in x nei fotogrammi 0–3 (il gancio resta fermo) |
| Paga (sbagliato o giusto) | il campanello trilla: spostato di `[1, −1, 1, −1]` in x per 4 fotogrammi, con la scritta `DRIN` (`piccolo`, `C.giallo`, centrata in x 235, y 102) |
| conto sbagliato | riga del risultato rossa nei fotogrammi 0, 1, 3, 4 (spenta nel 2 e dal 5); timbro NON TORNA per 12 fotogrammi; lo scheletro scuote la testa: `dx = [−1, 1, −1, 1, 0, 0]` nei fotogrammi 0–5 |
| conto giusto | fotogramma 0: lampo bianco al posto del timbro; dal fotogramma 1: timbro PAGATO; il cappotto sale di 2 pixel per fotogramma (`cappottoY` 55 → 53 → 51 → 49) e resta su; dal fotogramma 2 i luccichii; Zucco saltella: disegnato in (280, `121 + dy`) con `dy = [0, −2, −3, −2, 0, −2, −3, −2]` nei fotogrammi 0–7, poi 0 |

Con `g.riduciMovimento`: niente dondolii, trilli, scosse né saltelli; dopo un errore la riga rossa e il timbro NON TORNA restano fermi per 1,5 secondi; alla vittoria compaiono subito PAGATO e il cappotto a `cappottoY = 49`, senza luccichii.

### Già risolto

Stessa scena dello stato finale: tutte le cifre della soluzione sul conto, tutti i gettoni con il cartellino, timbro PAGATO, cappotto a 49 con i luccichii, nessuna selezione.

---

## 6. Aggancio per le prove

```js
g.espone({
  gioca: (m) => mossa(m),             // la stessa funzione di tocchi, bottoni e tastiera
  statoGioco: () => ({ ... }),
  posizioneLettera: (L) => ({ x, y }),
  posizioneGettone: (d) => ({ x, y }),
});
```

- **`gioca(mossa)`**: le mosse e gli esiti di §3, alla lettera: `{ ok: true, tolta, liberata }` per `appendi` (`tolta` e `liberata` sempre presenti, `null` se non c'entrano), `{ ok: true }` per `togli` e `svuota`, `{ errore: true, motivo: "conto" }`, `{ risolto: true }`, `{ valida: false, motivo }` (più `mancano` per `"incompleto"`). Lo stato cambia subito; le animazioni vengono dopo.
- **`statoGioco()`**:

  ```js
  {
    conto: "TESCHIO+TRUCCO=SCHERZO",
    assegnate: { T: 5, E: null, ... }, // tutte le lettere, nell'ordine di variante.lettere; cifra o null
    mancano: 9,                        // lettere senza gettone
    selezione: null,                   // oppure { lettera: "T" } oppure { cifra: 5 }
    ultimoSbagliato: null,             // oppure la stringa delle cifre dell'ultimo conto sbagliato, in ordine di variante.lettere
    pagato: false,
  }
  ```

- **`posizioneLettera(L)`**: il centro della **prima** cella di quella lettera, leggendo le righe a, b, c da sinistra a destra: `{ x: cx + 7, y: cy + 10 }`.
- **`posizioneGettone(d)`**: `{ x: 70 + 20 × d, y: 134 }`.

`verifica.mjs` usa anche `t.bottone("paga")` e `t.bottone("svuota")` (gli `id` dei bottoni), clic sulle celle e sui gettoni, e un trascinamento da un gettone a una cella.

---

## 7. Criteri di accettazione

Giocando e guardando le foto (`desktop`, `telefono`, `telefono-verticale`, `verifica-*`):

1. `node demo/comune/prova.mjs conto-guardaroba` finisce con «TUTTO OK».
2. La carta iniziale mostra il conto della variante (`{A} + {B} = {C}`) e chiede quanto fa la terza parola.
3. Il conto si legge a colpo d'occhio anche nella foto del telefono: lettere e cifre nitide, le tre righe allineate a destra, il «+» e la riga della somma; con un conto a sei colonne (per esempio NOTTE + OMBRA = CRANIO) la colonna di sinistra resta vuota.
4. Toccando una lettera si illuminano di lilla **tutte** le sue comparse; toccando poi un gettone la cifra compare in rosso sotto ogni comparsa e il gettone diventa brunito con il cartellino della lettera.
5. Il gettone selezionato si alza di 3 pixel con il contorno bianco; trascinato, segue il dito e illumina d'oro le celle sotto.
6. Lo 0 non si appende alla prima lettera di nessuna parola (messaggio, nessun errore); un gettone già usato appeso a un'altra lettera si sposta.
7. Paga a metà o con lo stesso conto sbagliato di prima viene rifiutato con il suo messaggio, senza errore; un conto completo sbagliato fa trillare il campanello, lampeggiare in rosso il risultato, comparire NON TORNA, scuotere la testa allo scheletro e conta un errore (le dorate scendono di una ogni due errori). I gettoni restano dove sono.
8. La vittoria: campanello, timbro PAGATO, il cappotto arancione che si alza e luccica, Zucco che saltella, poi la carta con il conto in lettere e in cifre.
9. Ricaricando la pagina a metà partita i gettoni appesi restano; da risolto la scena mostra il conto pagato.
10. Niente sopra le barre del kit (y < 16 e y ≥ 154) tranne decorazioni (molla della tavoletta, il davanti del bancone); fumetto mai più lungo di una settantina di caratteri.
11. Con «riduci movimento» niente si muove da solo e nessuno stato resta a metà.

### Una nota per il rapporto finale

Gli **indizi** della scheda (quelli che vende il kit) parlano solo del conto TESCHIO + TRUCCO = SCHERZO (voce 0): con gli altri conti non tornano. La demo non può cambiarli (li legge il kit dalla scheda); è segnalato al catalogo. Non serve fare niente, ma se nelle prove lo noti non è un errore della demo.
