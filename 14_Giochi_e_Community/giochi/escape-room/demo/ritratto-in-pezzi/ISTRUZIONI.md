# Il ritratto in pezzi — istruzioni per il costruttore

Rompicapo `ritratto-in-pezzi`, stanza **Ingresso**, 4 dorate, una in meno ogni 2 errori (minimo 1). Tessere scorrevoli 3×3: il gioco del quindici in piccolo. Valgono tutte le regole di `REGOLE_COMUNI.md`; qui c'è solo quello che è specifico. Le parti marcate **(la verifica lo usa)** vanno rispettate alla lettera, perché `verifica.mjs` le controlla.

## 1. In breve

Sopra il bancone dell'ingresso è appeso il ritratto di **Donna Ottavia**, la padrona di casa (una vampira con l'alveare di capelli e la ciocca bianca a saetta). È tagliato in 9 quadrati e quello in basso a destra manca. Il giocatore tocca un pezzo accanto al buco e il pezzo ci scivola dentro. Vince quando il ritratto torna intero; il fantasma della padrona concede però un numero fisso di mosse (`limite`, scritto nella scena): se finiscono prima, è un errore e il ritratto si rimescola in una partenza nuova, lunga uguale.

## 2. Variante

### Posizioni

Una posizione è una **stringa di 9 cifre**: la cifra all'indice `i` è il pezzo che sta nella casella `i`. Le caselle sono numerate riga per riga dall'alto a sinistra:

```
0 1 2
3 4 5
6 7 8
```

I pezzi sono `1`…`8`, `"0"` è il buco. Il pezzo `n` va nella casella `n − 1`; il ritratto intero è `"123456780"` (buco in basso a destra). Esempio: in `"865413027"` la casella 0 ha il pezzo 8 (la collana), la casella 6 è il buco.

Caselle vicine (servono a tutto, copiale così):

```js
const FINE = "123456780";
const VICINI = [[1, 3], [0, 2, 4], [1, 5], [0, 4, 6], [1, 3, 5, 7], [2, 4, 8], [3, 7], [4, 6, 8], [5, 7]];
```

### Il generatore (la verifica lo usa)

La variante deve uscire **identica** a quella della verifica, che rifà gli stessi passi con lo stesso `rng` del kit. Quindi segui l'ordine esatto delle chiamate a `rng()`:

1. **Ricerca in ampiezza** da `FINE`: per ogni posizione raggiungibile, il numero minimo di mosse per tornare al ritratto intero. Sono 181.440 posizioni (la più lontana a 31 mosse). Calcolala una sola volta, dentro `variante()`: in Edge ci mette circa 200 ms.
2. **Pozzo**: tutte le posizioni a distanza da 22 a 26 compresi, **ordinate con `.sort()`** (ordine alfabetico delle stringhe). Devono essere 98.361.
3. `prima = pozzo[Math.floor(rng() * pozzo.length)]`; `minimo` = la sua distanza.
4. `stessi` = le posizioni del pozzo con distanza esattamente `minimo`, nello stesso ordine.
5. `partenze = [prima]`; finché non sono 8: `s = stessi[Math.floor(rng() * stessi.length)]`, e se `s` non è già in `partenze` lo aggiungi (altrimenti si pesca di nuovo).
6. Ritorna `{ minimo, limite: minimo + 6, partenze }`.

Codice di riferimento (puoi usarlo così com'è):

```js
variante(rng) {
  const dist = new Map([[FINE, 0]]);
  const coda = [FINE];
  for (let i = 0; i < coda.length; i++) {
    const s = coda[i], z = s.indexOf("0"), d = dist.get(s) + 1;
    for (const q of VICINI[z]) {
      const a = s.split(""); a[z] = a[q]; a[q] = "0";
      const u = a.join("");
      if (!dist.has(u)) { dist.set(u, d); coda.push(u); }
    }
  }
  const pozzo = [];
  for (const [s, d] of dist) if (d >= 22 && d <= 26) pozzo.push(s);
  pozzo.sort();
  const prima = pozzo[Math.floor(rng() * pozzo.length)];
  const minimo = dist.get(prima);
  const stessi = pozzo.filter((s) => dist.get(s) === minimo);
  const partenze = [prima];
  while (partenze.length < 8) {
    const s = stessi[Math.floor(rng() * stessi.length)];
    if (!partenze.includes(s)) partenze.push(s);
  }
  return { minimo, limite: minimo + 6, partenze };
},
```

Formato esatto dell'oggetto (niente altri campi):

```js
{ minimo: 22, limite: 28, partenze: ["865413027", "231578064", ...] }   // 8 stringhe
```

- `partenze[0]` è la partenza del giocatore; `partenze[k]` è quella dopo il k-esimo errore (si ricomincia da capo con `k % 8`). Tutte hanno lo stesso `minimo`: «una partenza nuova con lo stesso minimo», come dice la scheda.
- È sempre risolvibile entro il limite: ogni partenza chiede esattamente `minimo` mosse e il limite ne concede 6 in più.

### Esempi (controllali appena hai scritto il generatore)

| seme | minimo | limite | partenze |
|---|---|---|---|
| 12345 | 22 | 28 | `865413027` `231578064` `378602415` `723408156` `418507263` `261458073` `038562417` `652308714` |
| 1 | 23 | 29 | `603458712` `103852746` `534176802` `864035217` `854263107` `345827601` `604823517` `683742105` |
| 777 | 26 | 32 | `640753182` `028756341` `085721364` `064873152` `631572840` `362547810` `185324670` `684715230` |

Soluzioni ottime (le caselle da toccare, in ordine):

- `865413027` (22): 3, 4, 7, 8, 5, 4, 1, 0, 3, 6, 7, 4, 1, 2, 5, 8, 7, 4, 1, 2, 5, 8
- `231578064` (22, la partenza dopo il primo errore col seme 12345): 3, 4, 5, 8, 7, 4, 5, 2, 1, 4, 5, 8, 7, 6, 3, 4, 1, 0, 3, 4, 7, 8

## 3. Regole e mosse

### Stato del rompicapo

```js
{ tessere: "865413027", mosse: 0, giro: 0 }
```

- `tessere`: la posizione attuale; `mosse`: quante mosse valide dall'ultima partenza; `giro`: quante volte il ritratto è stato rimescolato (= errori fatti). La partenza in uso è `partenze[giro % 8]`.
- **Memoria (la verifica lo usa).** Dopo ogni mossa valida, ogni errore e la vittoria: `Object.assign(g.memoria, { tessere, mosse, giro }); g.salvaMemoria();`. In `crea`, se `g.memoria` contiene uno stato valido (`tessere` permutazione di `"012345678"` risolvibile, `mosse` intero da 0 a `limite − 1`, `giro` intero ≥ 0), riparti da lì; altrimenti da `{ tessere: partenze[0], mosse: 0, giro: 0 }`. Così ricaricare la pagina non regala mosse nuove. Risolvibile = il numero di inversioni fra le cifre diverse da 0 è pari:

```js
const risolvibile = (s) => {
  const a = [...s].filter((c) => c !== "0").map(Number);
  let inv = 0;
  for (let i = 0; i < a.length; i++) for (let j = i + 1; j < a.length; j++) if (a[i] > a[j]) inv++;
  return inv % 2 === 0;
};
```

- Se `g.giaRisolto`: `tessere = FINE` e la scena mostra il ritratto intero (vedi Grafica).

### La mossa

Una sola mossa: **toccare la casella `c`**. Funzione pura `mossa(stato, c)` → nuovo stato ed esito, poi l'interfaccia reagisce. In ordine:

1. `c` non è un intero da 0 a 8 → rifiutata: `{ valida: false, motivo: "casella" }`.
2. `c` è il buco → rifiutata: `{ valida: false, motivo: "buco" }`.
3. `c` non è fra i `VICINI` del buco → rifiutata: `{ valida: false, motivo: "lontano" }`.
4. Altrimenti il pezzo di `c` scivola nel buco (si scambiano le due cifre) e `mosse` cresce di 1.
5. Se ora `tessere === FINE` → **risolto** (anche se era proprio la mossa numero `limite`): `{ risolto: true, mosse }`.
6. Altrimenti, se `mosse >= limite` → **errore** (vedi sotto).
7. Altrimenti → `{ ok: true, mosse, restano: limite − mosse, tessere }`.

Le mosse rifiutate **non sono errori** e non contano come mosse: niente `g.errore`, solo la reazione descritta in Interfaccia.

### L'errore: mosse finite (la verifica lo usa)

Conta come errore **solo** finire le mosse senza ritratto intero: la mossa numero `limite` che non completa il ritratto. La mossa viene comunque giocata e mostrata, poi:

- `giro += 1`; `tessere = partenze[giro % 8]`; `mosse = 0`; salva la memoria;
- `g.errore("Mosse finite: la padrona si è arrabbiata")`;
- esito: `{ errore: true, motivo: "mosse finite", giro, tessere }` (con la `tessere` nuova).

Non c'è altro limite: si può sbagliare quante volte si vuole, il kit toglie una dorata ogni 2 errori fino a 1.

Nota sulla scheda: il testo dice «con una in più si arrabbia». Qui l'errore scatta appena l'ultima mossa concessa non basta, invece di aspettare un tocco in più: la sostanza è la stessa (più di `limite` mosse non se ne giocano) ma il giocatore non resta fermo su «28/28» con un solo tocco possibile, che sarebbe comunque un errore.

### Niente «Ricomincia»

Non c'è un bottone per tornare alla partenza: con un limite di mosse servirebbe solo a scansare l'errore. Una mossa sbagliata si rimedia rifacendola all'indietro (e costa la sua mossa).

## 4. Interfaccia

- **Tocco** (`g.tocca`, evento `"giu"`): se il punto cade nella tavola (x da 112 a 207, y da 19 a 114) la casella è `Math.floor((x − 112) / 32) + 3 * Math.floor((y − 19) / 32)` e si chiama `mossa` con quella casella. Fuori dalla tavola non succede niente. La zona di tocco è la casella intera, 32×32.
- **Puntatore sopra** (evento `"muovi"` con `premuto` falso, solo mouse): il pezzo sotto il puntatore, se tocca il buco, ha il contorno in `C.oro` invece che `C.bordo`.
- **Tastiera** (facoltativa): freccia su = sale il pezzo sotto il buco; giù = scende quello sopra; sinistra = va a sinistra quello a destra del buco; destra = va a destra quello a sinistra. Se quel pezzo non c'è, niente.
- **Bottone** (uno solo): `g.bottone("Sbircia", …, { id: "sbircia" })` **(la verifica lo usa)**. Per 1500 ms la tavola mostra i pezzi al loro posto (la posizione `FINE`, con i contorni e il buco in basso a destra) e il bordo interno della cornice diventa `C.lilla`. Non è una mossa e non cambia lo stato. Un tocco sulla scena durante la sbirciata la chiude e basta (non muove niente); `gioca()` durante la sbirciata la chiude e gioca la mossa. Si può sbirciare quante volte si vuole.
- **Blocco dopo l'errore:** per 950 ms dall'errore (il tempo del rimescolamento) i tocchi sulla scena si ignorano. `gioca()` non è bloccato.
- **Animazioni e logica:** lo stato cambia subito; le animazioni lo inseguono. Se arriva una mossa mentre un pezzo sta ancora scorrendo, l'animazione vecchia salta alla fine e parte la nuova.

### Testo della carta iniziale

Il limite cambia con la variante, quindi il testo va adattato. Dichiara l'oggetto delle opzioni in una costante e in `crea` imposta `opzioni.testo` (il kit lo legge dopo `crea`):

```js
const opzioni = {
  id: "ritratto-in-pezzi", sfondo: "ingresso", velo: 0.5,
  variante(rng) { /* sopra */ },
  crea(g) {
    opzioni.testo =
      "Sopra il bancone dell'ingresso il ritratto della padrona di casa, Donna Ottavia, è tagliato in nove quadrati, e uno manca. " +
      "Fai scorrere i pezzi nel buco finché il ritratto torna intero.\n" +
      `Il suo fantasma ti concede ${g.variante.limite} mosse: se finiscono prima che il ritratto sia intero, si arrabbia e lo rimescola tutto.`;
    // …
  },
};
EscapeDemo.avvia(opzioni);
```

### Messaggi del fumetto (testi esatti)

`r` = mosse che restano (`limite − mosse`).

| Quando | `g.messaggio(…)` |
|---|---|
| All'apertura, con `mosse === 0` | «Tocca un pezzo accanto al buco per farlo scorrere.» |
| All'apertura, con `mosse > 0` (pagina ricaricata) | «Restano `r` mosse.» (con `r === 1`: «Resta una sola mossa!») |
| Dopo una mossa valida con `r > 5` | nessuno: `g.messaggio(null)` (basta il cartello) |
| Dopo una mossa valida con `r === 5` | «Il fantasma ti guarda storto: restano 5 mosse.» |
| Dopo una mossa valida con `r` da 2 a 4 | «Restano `r` mosse.» |
| Dopo una mossa valida con `r === 1` | «Resta una sola mossa!» |
| Tocco su un pezzo lontano dal buco | «Quel pezzo non tocca il buco: non può scorrere.» |
| Tocco sul buco | «Quello è il buco: tocca un pezzo lì accanto.» |
| Errore (insieme a `g.errore`) | «Ritratto rimescolato! Hai di nuovo `limite` mosse.» |
| Durante la sbirciata | «Ecco il ritratto com'era. Guardalo bene!» — finita, torna il messaggio di prima |
| Vittoria | «Il ritratto è di nuovo intero!» |
| Già risolto all'apertura | «Donna Ottavia è di nuovo tutta intera.» |

Testo di `g.errore`: «Mosse finite: la padrona si è arrabbiata» (il kit aggiunge da sé le dorate rimaste).

Vittoria, chiamato subito alla mossa vincente (lo stato cambia subito, la carta arriva dopo l'animazione):

```js
g.risolto({
  riepilogo: `Ritratto ricomposto in ${mosse} mosse su ${limite}. Il minimo possibile era ${minimo}.`,
  ritardo: 1600,
});
```

Il fumetto con `r` mosse usa il plurale «mosse» da 2 in su; il caso `r === 1` ha la sua frase.

## 5. Grafica

Sfondo `"ingresso"` (la facciata della casa), `velo: 0.5`. La scena è un **primo piano**: in alto il ritratto nella sua cornice d'oro, sotto il bancone dell'ingresso con un campanello, il libro degli ospiti e un candelabro; a sinistra fluttua il fantasma di Donna Ottavia, a destra pende il cartello delle mosse. La cornice copre apposta l'insegna «FESTA HALLOWEEN» dello sfondo (la scritta sta fra y 12 e 18): non spostarla più in basso, o l'insegna resta tagliata a metà sopra il quadro.

### Colori degli sprite

Tutti gli sprite sotto usano questa tabella (solo paletta del kit e due pietre delle `GEMME`, quindi niente colori fuori paletta):

```js
const { C, GEMME } = EscapeDemo;
const COLORI = {
  k: C.bordo, n: C.nero, w: C.bianco, s: C.pietraChiara, S: C.pietra, d: C.ferroChiaro, D: C.ferro,
  r: C.tappetoChiaro, R: C.tappeto, q: GEMME.rubino[2], o: C.oro, O: C.oroScuro, y: C.giallo, h: GEMME.topazio[0],
  v: C.violaScuro, V: C.viola, l: C.lilla, b: C.notte, B: C.notteChiara, m: C.luna, p: C.rosa,
  f: C.fiamma, F: C.fiammaChiara, M: C.muro, u: C.mattone,
};
```

### Disposizione (pixel della scena, angolo in alto a sinistra di ogni cosa)

| Cosa | Dove | Misure | Note |
|---|---|---|---|
| Tavola dei pezzi | x 112, y 19 | 96×96 | casella `i` in `(112 + (i % 3) * 32, 19 + Math.floor(i / 3) * 32)`, 32×32 |
| Cornice d'oro | x 103, y 10 | 114×114 | 9 pixel attorno alla tavola; il bordo in alto entra nella zona della barra: è decorazione |
| Rosette agli angoli | (103,10) (208,10) (103,115) (208,115) | 9×9 | `ROSETTA` |
| Stemma a pipistrello | x 150, y 4 | 21×10 | `STEMMA`, sopra la cornice (sotto la barra in alto, che lì è solo una sfumatura) |
| Targa col nome | x 130, y 120 | 60×11 | appoggiata sul bordo basso della cornice |
| Bancone | x 18…301, piano da y 138, fronte da y 144 in giù | — | il fronte continua sotto la barra bassa (si vede fra fumetto e bottoni) |
| Campanello | x 34, y 130 | 10×9 | `CAMPANELLO`, appoggiato sul piano |
| Libro degli ospiti | x 214, y 131 | 21×8 | `LIBRO`; la `PENNA` a x 236, y 131 |
| Candelabro | x 268, y 115 | 19×24 | `CANDELABRO` + tre `FIAMMELLE` |
| Cartello delle mosse | x 236, y 40 | 70×38 | due catenelle da y 12; testo vedi sotto |
| Fantasma | x 52, y 76 (+ dondolio) | 34×48 | `FANTASMA_*` |

Ordine di disegno, dal fondo: bancone e oggetti sul piano → cornice (con rosette e stemma) → tavola → targa → cartello → fantasma → scintille della vittoria. Si ridisegna tutto a ogni fotogramma (`g.anima`), su `g.ctx` ripulita.

### Il ritratto e i pezzi

`RITRATTO` (sotto) è 96×96: Donna Ottavia davanti a una tenda rossa raccolta da una corda d'oro (a sinistra) e a un muro di pietra con una finestra gotica e la luna (a destra). Ogni pezzo ha qualcosa di suo e i contorni continuano da un pezzo all'altro (la corda, il colletto, la ciocca a saetta, il davanzale), così si capisce dove va. Il pezzo 9 (in basso a destra: la manica e un pipistrellino sulla spalla) si vede solo a ritratto finito.

- **Disegnalo una volta sola** su una tela fuori scena: `const tela = document.createElement("canvas"); tela.width = tela.height = 96;` poi `EscapeDemo.sprite(tela.getContext("2d"), RITRATTO, COLORI, 0, 0)`. Disegnare ogni fotogramma 9.000 rettangoli è troppo lento sui telefoni.
- **Pezzo `n`** (1…8) nella casella `i`: `ctx.drawImage(tela, ((n − 1) % 3) * 32, Math.floor((n − 1) / 3) * 32, 32, 32, cx, cy, 32, 32)` (stessa misura: non è un ingrandimento), poi un contorno di 1 pixel sui quattro lati del quadrato 32×32 (`rett` larghi 1): `C.bordo` di norma. I contorni di due pezzi vicini fanno una fuga scura di 2 pixel: è voluto, e il ritratto è disegnato tenendone conto.
- **Il buco** (e il fondo della tavola): quadrato 32×32 `C.bordo`, con una fascia `C.nero` di 2 pixel in alto e a sinistra (l'ombra dell'incavo) e, nel resto, un puntinato `C.muro` sui pixel `(i, j)` della casella (da 0 a 31, con `i, j ≥ 2`) dove `(i + j) % 4 === 0` e `Math.floor(j / 2) % 2 === 0`. Preparalo una volta su una tela 32×32 e copialo con `drawImage` senza ingrandire.
- **Ritratto intero** (vittoria e già risolto): `ctx.drawImage(tela, 112, 19)`, senza contorni né fughe, pezzo 9 compreso.

### Cornice (codice di riferimento)

```js
const FX = 103, FY = 10, FS = 114;
const TOPAZIO_SCURO = GEMME.topazio[0];
function cornice(ctx, accesa, sbirciata) {
  // strati 1..7 dall'esterno: in alto e a sinistra la luce, in basso e a destra l'ombra
  const CHIARO = accesa
    ? [C.oro, C.bianco, C.giallo, C.giallo, C.oro, C.giallo, C.legnoLuce]
    : [C.oroScuro, C.giallo, C.oro, C.oro, C.oroScuro, C.oro, C.legnoChiaro];
  const SCURO = accesa
    ? [C.oroScuro, C.oro, C.oro, C.giallo, C.oro, C.oro, C.legnoChiaro]
    : [TOPAZIO_SCURO, C.oroScuro, C.oroScuro, C.oro, C.oroScuro, C.oroScuro, C.legno];
  rett(ctx, C.bordo, FX, FY, FS, FS);
  for (let i = 1; i <= 7; i++) {
    const n = FS - 2 * i;
    rett(ctx, SCURO[i - 1], FX + i, FY + FS - 1 - i, n, 1);   // in basso
    rett(ctx, SCURO[i - 1], FX + FS - 1 - i, FY + i, 1, n);   // a destra
    rett(ctx, CHIARO[i - 1], FX + i, FY + i, n, 1);           // in alto
    rett(ctx, CHIARO[i - 1], FX + i, FY + i, 1, n - 1);       // a sinistra
  }
  // perline: un puntino ogni 4 pixel sullo strato 3
  for (let k = FX + 6; k < FX + FS - 6; k += 4) {
    rett(ctx, C.oroScuro, k, FY + 3, 1, 1);
    rett(ctx, TOPAZIO_SCURO, k, FY + FS - 4, 1, 1);
  }
  for (let k = FY + 6; k < FY + FS - 6; k += 4) {
    rett(ctx, C.oroScuro, FX + 3, k, 1, 1);
    rett(ctx, TOPAZIO_SCURO, FX + FS - 4, k, 1, 1);
  }
  // bordo interno attorno alla tavola (lilla durante la sbirciata)
  const bi = sbirciata ? C.lilla : C.bordo;
  rett(ctx, bi, FX + 8, FY + 8, FS - 16, 1);
  rett(ctx, bi, FX + 8, FY + 8, 1, FS - 16);
  rett(ctx, bi, FX + 8, FY + FS - 9, FS - 16, 1);
  rett(ctx, bi, FX + FS - 9, FY + 8, 1, FS - 16);
  for (const [x, y] of [[FX, FY], [FX + FS - 9, FY], [FX, FY + FS - 9], [FX + FS - 9, FY + FS - 9]])
    sprite(ctx, ROSETTA, COLORI, x, y);
  sprite(ctx, STEMMA, COLORI, 150, FY - 6);
}
```

### Targa, cartello, bancone (codice di riferimento)

```js
function targa(ctx) {
  rett(ctx, C.bordo, 130, 120, 60, 11);
  rett(ctx, C.oroScuro, 131, 121, 58, 9);
  rett(ctx, C.oro, 131, 121, 57, 8);
  rett(ctx, C.giallo, 132, 121, 56, 1);
  rett(ctx, C.bordo, 132, 123, 1, 1);   // ribattini
  rett(ctx, C.bordo, 187, 123, 1, 1);
  testo(ctx, "DONNA OTTAVIA", 160, 123, { piccolo: true, colore: C.legno, ombra: null, allinea: "centro" });
}

function cartello(ctx, { mosse, limite, risolto, lampo }) {
  const x = 236, y = 40, w = 70, h = 38;
  for (const cx of [x + 8, x + w - 10]) {            // catenelle a maglie
    for (let yy = 12; yy < y; yy += 6) {
      rett(ctx, C.bordo, cx - 1, yy, 4, 5);
      rett(ctx, C.ferroChiaro, cx, yy + 1, 2, 3);
      rett(ctx, C.ferro, cx + 1, yy + 2, 1, 2);
      rett(ctx, C.bordo, cx, yy + 5, 2, 1);
    }
  }
  riquadro(ctx, x, y, w, h, C.legnoChiaro);
  rett(ctx, C.legnoLuce, x + 1, y + 1, w - 2, 1);
  rett(ctx, C.legno, x + 1, y + h - 2, w - 2, 1);
  riquadro(ctx, x + 3, y + 3, w - 6, h - 6, C.muro);   // la lavagnetta
  for (const [ax, ay] of [[x + 1, y + 1], [x + w - 2, y + 1], [x + 1, y + h - 2], [x + w - 2, y + h - 2]])
    rett(ctx, C.ferroChiaro, ax, ay, 1, 1);             // chiodini
  if (risolto) {
    testo(ctx, "RITRATTO", x + w / 2, y + 9, { colore: C.fiammaChiara, allinea: "centro" });
    testo(ctx, "INTERO!", x + w / 2, y + 21, { colore: C.giallo, allinea: "centro" });
    return;
  }
  const restano = limite - mosse;
  const colore = lampo ? C.giallo : restano <= 5 ? C.tappetoChiaro : C.bianco;
  testo(ctx, "MOSSE", x + w / 2, y + 7, { colore: C.fiammaChiara, allinea: "centro" });
  testo(ctx, `${mosse}/${limite}`, x + w / 2, y + 18, { colore, scala: 2, allinea: "centro" });
}

function bancone(ctx) {
  rett(ctx, C.bordo, 18, 138, 284, 6);
  rett(ctx, C.legnoLuce, 19, 139, 282, 1);
  rett(ctx, C.legnoChiaro, 19, 140, 282, 2);
  rett(ctx, C.bordo, 20, 144, 280, 36);
  rett(ctx, C.legno, 21, 144, 278, 36);
  rett(ctx, C.legnoScuro, 21, 144, 278, 1);
  for (let k = 28; k < 270; k += 46) {                 // sei pannelli
    riquadro(ctx, k, 147, 38, 30, C.legno, C.legnoScuro);
    rett(ctx, C.legnoChiaro, k + 1, 148, 36, 1);
    rett(ctx, C.legnoChiaro, k + 1, 148, 1, 28);
  }
}
```

(`rett`, `riquadro`, `sprite`, `testo` sono quelli di `EscapeDemo`; le coordinate sono intere, `x + w / 2` qui fa 271.)

### Stati visivi

| Stato | Tavola | Fantasma | Cartello | Cornice |
|---|---|---|---|---|
| Normale | pezzi con contorno `C.bordo`; quello sotto il mouse, se tocca il buco, contorno `C.oro` | `FANTASMA_CALMA` | `MOSSE` / `m/L` in bianco | normale |
| Restano ≤ 5 mosse | come sopra | `FANTASMA_ATTENTA` | numero in `C.tappetoChiaro` | normale |
| Appena mosso | il pezzo scorre | — | numero in `C.giallo` per 120 ms (`lampo`) | — |
| Tocco impossibile | il pezzo toccato trema (vedi Animazioni); sul buco niente | — | — | — |
| Errore | contorni di tutti i pezzi in `C.tappetoChiaro` per 600 ms, poi rimescolamento | `FANTASMA_FURIOSA` per 1400 ms, che trema | `0/L` | normale |
| Sbirciata | pezzi nella posizione `FINE` (buco in basso a destra) | come prima | come prima | bordo interno `C.lilla` |
| Vittoria | lampo bianco nel buco, poi il ritratto intero senza fughe | `FANTASMA_CONTENTA` | `RITRATTO` / `INTERO!` | «accesa» per 600 ms, scintille |
| Già risolto | ritratto intero | `FANTASMA_CONTENTA` | `RITRATTO` / `INTERO!` | normale, niente scintille |

### Animazioni

Tempi in ms dal momento della mossa; posizioni sempre arrotondate a pixel interi.

- **Scorrimento:** il pezzo mosso va dalla sua casella al buco in 160 ms, con uscita morbida (`1 − (1 − t)²`).
- **Tocco impossibile:** il pezzo toccato si sposta in orizzontale di +1, −1, +1, 0 pixel, 60 ms per passo. Con `g.riduciMovimento` niente tremolio: contorno `C.ferroChiaro` per 250 ms.
- **Errore:** la mossa scorre come sempre (in quella posizione, prima del rimescolamento: tieni da parte la posizione «dopo la mossa»); da 0 a 600 ms contorni rossi; a 600 ms parte il **rimescolamento**: ogni pezzo `n` vola dalla sua casella nella posizione vecchia alla sua casella nella posizione nuova, tutti insieme, in 350 ms (entrata e uscita morbide); mentre volano, il fondo della tavola è tutto «buco». A 950 ms la tavola è nella posizione nuova e i tocchi tornano attivi. Il fantasma è furioso da 0 a 1400 ms e trema di ±1 pixel in orizzontale a ogni fotogramma (8 al secondo).
- **Vittoria:** l'ultimo pezzo scorre (160 ms); da 200 a 450 ms la casella del buco (in basso a destra) è un quadrato `C.bianco` pieno (il pezzo mancante che si accende); da 450 ms il ritratto intero; cornice «accesa» da 450 a 1050 ms; da 450 a 2050 ms sei `SCINTILLA` (5×5) in (95,18), (218,30), (96,98), (218,106), (124,126), (192,126), ognuna visibile quando `(g.fotogramma + indice) % 4 < 2`.
- **Fantasma (continua, 8 al secondo):** dondola in verticale di `[0, -1, -2, -2, -1, 0, 1, 1][g.fotogramma % 8]` pixel; l'orlo ondeggia: al posto delle ultime 9 righe dello sprite (dalla 39 alla 47) si disegna `CODA_FANTASMA[g.fotogramma % 4]` (la fase 0 è uguale a quella già dentro gli sprite).
- **Fiammelle del candelabro (continue):** la candela `i` (0, 1, 2) usa `FIAMMELLE[(g.fotogramma + i) % 3]`, disegnata nell'angolo del candelabro più (0, 2), (5, 0), (10, 2).
- **Con `g.riduciMovimento`:** niente scorrimenti, niente volo del rimescolamento (si mostra subito la posizione nuova), niente tremolii, niente dondolio (fantasma fermo, orlo fase 0), fiammelle ferme (`FIAMMELLE[i % 3]`), niente lampo bianco né scintille alla vittoria. I cambi di colore (contorni rossi, cornice accesa, faccia del fantasma) restano.

### Sprite

Copiali così come sono. Ogni riga di uno sprite ha la stessa lunghezza; `"."` è vuoto.

```js
const RITRATTO = [
  "RRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRdddddddddddMdddddddddddMdddddddddddMdddddddddddM",
  "RRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRdDDDDDDDDDDMdDDDDDDDDDDMdDDDDDDDDDDMdDDDDDDDDDDM",
  "rrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrdDDDDDDDDDDMdDDDDDDDDDDMdDDDDDDDDDDMdDDDDDDDDDDM",
  "kkkkkkRRkRRrkkkkkkrrrRnkkkkkkkkRRrrRkkkkkkrrrrrrdDDDDDDDDDDMdDDDDDDDDDDMdDDDDDDDDDDMdDDDDDDDDDDM",
  "OOOOOOkkkkkkOOOOOOkkkkkkOOOOOOkkkkkkOOOOOOkkkkkkkkkkDDDDDDDMdDDDDDDDDDDMdDDDDkkkDDDMdDDDDDDDDDDM",
  "okRorrOOOOOOoRRoRROOOOOOorroRROOOOOOonRorkSwwsvvvvvvkkkMMMMMMMMMMMMMMMMMMMMkkSSSkkMMMMMMMMMMMMMM",
  "nkRrrroRkoRrrRRnRRorronkRrrrRRoRRorRRnRkkSwwskkkkkkkkkkkkddddddddMddddddddkSSSSSSSkddddddMdddddd",
  "nkRrrrRRkRRrrRRnRRrrrRnkRrrrRRkRRrrRRnkkSwwsVVVVVVVVVVVVkkDDDDDDDMdDDDDDDkSSSkkkSSSkDDDDDMdDDDDD",
  "nkRrrrRRkRRrrRRnRRrrrRnkRrrrRRkRRrrRkklSwwsVVVVVVVvvvvvvvvkkDDDDDMdDDDDkkSSSkbkbkSSSkkDDDMdDDDDD",
  "nkRrrrRRkRRrrRRkRRrrRRnRRrrRRnRRrrrklVVSwwsvvvvvvvvvvvvvvvvvkDDDDMdDDDkSSSkkbbkbbkkSSSkDDMdDDDDD",
  "nkRrrrRRkRRrrRRkRRrrRRnRRrrRRnRRrrrkVvvvSwwsvvvvvvvvvvvvvvvvkDDDDMdDDDkSSkbbbbkbbbbkSSkDDMdDDDDD",
  "nkRrrrRRkRRrrRRkRRrrRRnRRrrRRnRRrrkvvvvvkSwwskkkkkkkkkkkvvvvvkMMMkMMMkSSkbbbbbkbbbbbkSSkMMMMMMMM",
  "nkRrrrRRkRRrrRRkRRrrRRnRRrrRRnRRrkvvvkkklSwwsVVVVVVVVVVkkkkkvkkdkkddkSSkbbbbbbkbmmmbbkSSkddddddM",
  "nkRrrrRRkRRrrRRkRRrrRRnRRrrRRnRRrkkkklllSwwsVVVVVVvvvvvkVkvkkkkkVkDkSSkbbbbbbbkmmmmmmbkSSkDDDDDM",
  "nkRrrrRnkRrrrRnkRrrrRnkRrrrRnkRrkklllVVSwwsvvvvvvvvvvvvkvVkkrkrkVvDkSSkbbbbbbmkBBmmmmmkSSkDDDDDM",
  "nkRrrrRnkRrrrRnkRrrrRnkRrrrRnkRrklVVVvSwwsvvvvvvvvvvvvvvkvvkkkkvvkkSSkbbbbbbbmkmmmmmmmbkSSkDDDDM",
  "nkRrrrRnkRrrrRnkRrrrRnkRrrrRnkRrkVvvvvSwwskkkkkkkkkkkkkkvkkvkvkkDDkSSkbbbbbbmmkmmmmmmmmkSSkDDDDM",
  "nkRrrrRnkRrrrRnkRrrrRnkRrrrRnkRrkvvvvkkSwwsVVVVVVVVVVVVVkkkkvkvkMkSSkbbbbbbbmmkmmmmmmmmbkSSkMMMM",
  "nkRrrrRnkRrrRRnRRrrRRkRRrrRRkRRrkvkkklllSwwsVVVVVVvvvvvvvvvkkkvkdkSSkbbbbbbbmmkmmmBBBmmbkSSkdddd",
  "nkRrrrRnkRrrRRnRRrrRRkRRrrRRkRRkkklllVVVSwwsvvvvvvvvvvvvvvvvvvkkkkSSkbbbbbbbbmkmmBBBBBbbkSSkDDDD",
  "nkRrrrRnkRrrRRnRRrrRRkRRrrRRkRRrklVVVvvSwwsvvvvvvvvvvvvvvvvvvvvkDkSkbbbbbbwbbmkmmmBBBmbbbkSkDDDD",
  "nkRrrrRnkRrrRRnRRrrRRkRRrrRRkRRrkVvvvvSwwskkkkkkkkkkkkkkvvvvvvvkksSkbbbbbbbbbbkmmmmmmbbbbkSdkDDD",
  "nkRrrRRnRRrrRRkRrrrRnkRrrRRnRRrrkvvvvSwwsVVVVVVVVVVVVVVVkkkvvvvkksSkbbbbbbbbbbkbmmmbbbbbbkSdkDDD",
  "nkRrrRRnRRrrRRkRrrrRnkRrrRRnRRrrkvkkkSwwsVVVVVVVVVvvvvvvvvvkkkvkksSkbbbbbbbbbbkbbbbbbbbbbkSdkMMM",
  "nkRrrRRnRRrrRRkRrrrRnkRrrRRnRRrrkklllVSwwsvvvvvvvvvvvvvvvvvvvvkkksSkbbbbbbbbbbkbbbbbbbbbbkSdkddM",
  "nkRrrRRnRRrrRRkRrrrRnkRrrRRnRRrrRkVVVvvSwwsvvvvvvvvvvvvvvvvvvvkDksSkbbbbbbbbbbkbbbbbbbbbbkSdkDDM",
  "nkRrrRRkRRrrRnkRrrRRkRRrrRnkRrrRRkvvvvvSwwskkkkkkkkkkkkkvvvvvvkDksSkbbwbbbbbbbkkbbbbbbbbbkSdkDDM",
  "nkRrrRRkRRrrRnkRrrRRkRRrrRnkRrrRRkkvvkSwwsVVVVVVVVVVVVVVkkkvvkDDksSkbbbbbbbbkbkkbbkbbbbbbkSdkDDM",
  "nkRrrRRkRRrrRnkRrrRRkRRrrRnkRrrRRkRkkSwwsVVVVVVVVVvvvvvvvvvkkDDDksSkbbbbbbbbbkkkkkbbbbbbbkSdkDDM",
  "nkRrrRRkRrrrRnRRrrRnkRrrRRkRrrrRnRRkSwwsvvvvvvvvvvvvvvvvvvvvkMMMksSkbbbbbbbbbbkkkbbbbbbbbkSdkMMM",
  "nkRrrRRkRrrrRnRRrrRnkRrrRRkRkrrRnRRkSwwsvvvvvvvvvvvvvvvvvvvvkdddksSkbbbbbbbbbbkbbbbbbbbbwkSdkddd",
  "nkRrrRRkRrrrRnRRrrRnkkrrRRkRkrrRnRkvvVvvvVvvvVvvvvkvvvkvvvkvvkDDksSkbbbbbbkbbbkbbbbbbbbbbkSdkDDD",
  "nkRrrRRkRrrRRkRrrRRkRkkrRnRRkrRnRkvvvVvvvVkvvVvvvvkvvkkvvvkvvvkDksSkkkkkkkkkkkkkkkkkkkkkkkSdkDDD",
  "nkRrrRRkRrrRRkRrrRRkRkvkRnRkvkRnkVvvvVvvkkkvvVvvvvkvvkkkvvkvvvkkkskvkbbbkvkbbbkbbbbbbbbbbkSdkDDD",
  "nkRrrRRkRrrRRkRrrRRkRrkkRnRkvkRkvVvvvVvkSSSkkkvvvvkkkSSSkvkvvvkvkskvkbbbkkbbbbkbbbbbbbbbbkSdkDDD",
  "nkRrrRnkRrrRnkRrrRnkRrkvkkRkvknkvVvvvVkSwssSSkvvvvkSSssSSkkvvvkvkskvkubkvkbbbukbbubbbubbbkSdkMMM",
  "nkRrrRnkRrrRnkRrrRnkRrkvvkRkvvkkvVvvvVkwsssssSkkkkSssssSSkkvvvkvkkvvkbkvvkbbkbkbubbbubbbukSdkddM",
  "nkRrrRnkRrrRnkRrrRnkkrkvvvkkvvkkkVvvvkSsssssssSSSSsskkkSSSkvvvkvkkvkvkvvvkbkbbkubbbubbbubkSdkDDM",
  "nkRrrRnRRrrRnRrrrRkRrkvvvvvkvvkkskvvvksswsssssssssskssskSSkvvvkkSkvkvvvvvvkbbbkbbbubbbwbbkSdkDDM",
  "nkRrrRnRRrrRnRrrrRkRrkvvvvvvkvvksskvkSswsssssssssskssssSkSSkvvkSSkkvvvvvvvkbbukbbubbbubbbkSdkDDM",
  "nkRrrRnRrrRRkRrrRnkRrrkvvvvvkvvkssSkkswkkkkksssssssssssSSkdkvkdSSkkvvvvvvkbbubkbubbbubbbukSdkDDM",
  "nkRrrRnRrrRRkRrrRnkRrrkvvvvvvkvkksSkkwkswssskssssssssssSSSdkvkdSkkvvvvvvvkbubbkubbbubbbubkSdkMMM",
  "nkRrrRnRrrRRkRrrRnkRrrRkvvvvvkvvksSSkssSSSSSSSssssSSSSSSSSdkkddSkkvvvvvvkbubbbkbbbubbbubbkSdkddd",
  "nRkkrRkRrrRnRRrrRkRrrRnkkvvvvvkvkkSSkswskkkkksssssskkkkkSSdkkddkkvvvvvvkkkkkkkkkkkkkkkkkkkSdkDDD",
  "nRyokkkRrrRnRRrrRkRrkkkykvvvvvkvkkSkksskwwrrwksssskwrrwwkSdkvkdkkvvvvvvkSSSSSSSSSSSSSSSSSSSdkDDD",
  "nROOoyokkkRnRRrrRkkkyooOOkvvvvkvvkkkksskwrykrksssskrykrSkSdkkDkkkvvvvvkkkkkkkkkkkkkkkkkkkkkkkkkD",
  "nRkkOOOoyokkkkkkkyooOOOkkkvvvvvkkoDkkssskkkkksssSsskkkkkSSdkDkokkvvvvvkssssssssssssssssssssssskD",
  "nRRrkkkOOOoyooyooOOOkkkRrrkvvvvkkookksssSSSSSsssSssSSSSdSSdkMkookvvvvkSSSSSSSSSSSSSSSSSSSSSSSSkM",
  "nRRrRRkkkkOOOOkkkkkkRRkRrrkvvvvvkkkMksssssssssssSssssssSSSdkdkkkvvvvvkkkkkkkkkkkkkkkkkkkkkkkkkkM",
  "nRRrRRkRrrkkkkyookrrRnRrrRnkvvvvkqrkkssssssssssssSsssssSSSdkdkqrkvvvkDDMdDDDDDDDDDDMdDDDDDDDDDDM",
  "nRRrRRkRrrRkRkoOOkrrRnRrrRnkvvvvkrRkksssSssssssssSsssssSdSdkdkrRkvvvkDDMdDDDDDDDDDDMdDDDDDDDDDDM",
  "nRRrRRkRrrRkRrkOkRrrRnRrrRnRkvvvkRRkdksssSsssssSkSkssssdSSkMkkRRkvvkDDDMdDDDDDDDDDDMdDDDDDDDDDDM",
  "nRrrRnRRrRnRrkooOkrRnRRrRnRrkvvvvkkkdkssssssssssssssssskSSkMkvkkvvvkDDDMdDDDDDDDDDDMdDDDDDDDDDDM",
  "nRrrRnRRrRnRkyooOOkRnRRrRnRrrkvvvvkvkMksssssssssssskkssSSkMkkvvvvvkMMMMMMMMMMMMMMMMMMMMMMMMMMMMM",
  "nRRrRRkRrrRkkoooOOkrRnRrrRnRrkvvvvvkkdkssssskkkkkkkRkssSSkdkkvvvvvkddddddddddMdddddddddddMdddddd",
  "nRRrRRkRrrRkkoyoOOkrRnRrrRnRrrkvvvvkvkDkssskRrrrRRRksssSkDkkvvvvvkdDDDDDDDDDDMdDDDDDDDDDDMdDDDDD",
  "nRRrRRkRrrRnkooooOkrRRkRrrRnRrkvvvvkvvkDkssskRRRkkwkssskDkvkvvvvvkdDDDDDDDDDDMdDDDDDDDDDDMdDDDDD",
  "nRRrRRkRrrRnkOoOoOkrRRkRrrRnRrrkvvvvkvkDDkkkskkkskwkkkkDDkkvvvvvkMdDDDDDDDDDDMdDDDDDDDDDDMdDDDDD",
  "nRRrrRkRrrRnkOkOkOkrrRnRRrrRkRrkvvvvkvvkDMdDkssssskkkMdDkvkvvvvvkMdDDDDDDDDDDMdDDDDDDDDDDMdDDDDD",
  "nRRrrRkRrrRnRkrkRkRrrRnRRrrRkRrrkvvvvkvkMMMMkksssskdkMMMkkvvvvvkMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMM",
  "nkRrrRnRrrRRkRrrRnkRrrRnRrrRRkRrrkvvvkvvkdddkSksskddkddkvkvvvvkddddddddMdddddddddddMdddddddddddM",
  "nkRrrRnRrrRRkRrrRnkRrrRnRrrRRkRrrkvvvvkvvkDDkSSkkdddkDkvkvvvvvkDDDDDDDDMdDDDDDDDDDDMdDDDDDDDDDDM",
  "nkRrrRnRRrrRnRrrrRkRrrRRkRrrRRkRrrkvvvkvvvkDkSSSSdddkkvvkvvvvkDDDDDDDDDMdkDDDDDDDDDMdkDDDDDDDDDM",
  "nkRrrRnkRrrRnkRrrRnkRrrRnkRrrRnkRrkvvvvkvvvkkSSSSdddkvvkvvvvvkDDDDDDDDDMdkkDDkDDDkDMkkDDDDDDDDDM",
  "nkRrrRnkRrrRnkRrrRnkRrrRnkRrrRnkRrrkvvvkvvvvkSSSSdddkvvkvvvvkDDDDDDDDDDMdkvkDkkDkkDkvkDDDDDDDDDM",
  "nkRrrRRkRrrRRkRrrRRkRrrrRnRRrrRnRRrrkvvkvvvvkSSSSdddkvvkvvvkMMMMMMMMMMMMMkvvkkkkkkkvvkMMMMMMMMMM",
  "nkRrrRRkRrrRRkRrrRRkRrrrRnRRrrRnRRrrRkvvkvvvkssssSSSkvkvvvkddddddMdddddddkvVvkrkrkvVvkdddMdddddd",
  "nkRrrRRkRrrrRnRRrrRnkRrrRRkRrrrRnRRrrRkkkvvvkssssSSSkvkvkkDDDDDDDMdDDDDDDDkvvkkkkkvvkDDDDMdDDDDD",
  "nkRrrRRkRrrrRnRRrrRnkRrrRRkRrrrRnkkwskkkkkkkkssssSSSkkkkkkkkSskDDMdDDDDDDDDkvkkkkkvkDDDDDMdDDDDD",
  "nkRrrRRkRRrrRnkRrrRRkRRrkkkkkkkkkVVkksvksssskssssSSSkSSSkvvSkkvkkkkkkkkkDDDDkMkVkDkDDDDDDMdDDDDD",
  "nkRrrRRkRRrrRnkRrrRkkkkkVVVVVVVVVVVVvwsvkssskssssSSSkSSkvvSsvvvvvvvvvvvvkkkkkMdkDDDDDDDDDMdDDDDD",
  "nkRrrRRnRRrrRRkkkkkVVVVVVVVVVVVVVVVVvwsoOssskkkkkkkkkSSkOoSsvvvvvvvvvvvvvvvvvkkkkkMMMMMMMMMMMMMM",
  "nkRrrrRnkRrkkkvlVkkkVVVVVVVVVVVVVVVVvkksvoOssssssssSSSOovSkkvvvvvvvvvvvvvvvvkkkVvvkkkddddddddddM",
  "nkRrrrRnkRklVVvlVVvlkVVVVVVVVVVVVVVVvvvwsksoOoOkkkOoOokvSsvvvvvvvvvvvvvvvvvkvvkVvvkVvkDDDDDDDDDM",
  "nkRrrrRnkkvlVVvlVVvlVkkVVVVVVVVVVVVvvvvwsvkssskyookSSkvvSsvvvvvvvvvvvvvvvkkVvvkVvvkVvvkDDDDDDDDM",
  "nkRrrrRkkVvlVVvlVVvlVVvkVVVVVVVVVVVvvvvkksvkskkkokkkkvvSkkvvvvvvvvvvvvvvkvkVvvkVvvkVvvkkkDDDDDDM",
  "nkRrrrklVVvlVVvlVVvlVVvlkVVVVVVVVVVvvvvvvwskskqrrrRkkvSsvvvvvvvvvvvvvvvkvvkVvvkVvvkVvvkVvkDDDDDM",
  "nkRrrkvlVVvlVVvlVVvlVVvlkVVVVVVVVVvvvvvvvwsvkkqrrRRkvvSsvvvvvvvvvvvvvvvkvvkVvvkVvvkVvvkVvvkMMMMM",
  "nkRrkVvlVVvlVVvlVVvlVVvlVkVVVVVVVVvvvvvvvkksvkkrRRkvvSkkvvvvvvvvvvvvvvkVvvkVvvkVvvkVvvkVvvkkdddd",
  "nkRkVVvlVVvlVVvlVVvlVVvlVVkVVVVVVVvvvvvvvvwsvkskRkkvvSsvvvvvvvvvvvvvvkkVvvkVvvkVvvkVvvkVvvkVkDDD",
  "nkRkVVvlVVvlVVvlVVvlVVvlVVkVVVVVVvvvvvvvvvvwsvkskkvvSsvvvvvvvvvvvvvvvkkVvvkVvvkVvvkVvvkVvvkVkDDD",
  "nkklVVvlVVvlVVvlVVvlVVvlVVkVVVVVVvvvvvvvvvvkksksskvSkkvvvvvvvvvvvvvvvkkVvvkVvvkVvvkVvvkVvvkVvkDD",
  "nkklVVvlVVvlVVvlVVvlVVvlVVvkVVVVVvvvvvvvvvvvwsvkkvvSsvvvvvvvvvvvvvvvkvkvvvkvvvkvvvkvvvkvvvkvvkDD",
  "nkvlVVvlVVvlVVvlVVvlVVvlVVvkVVVVVvvvvvvvvvvvvwsvvvSsvvvvvvvvvvvvvvvvkvkvvvkvvvkvvvkvvvkvvvkvvvkM",
  "nkvlVVvlVVvlVVvlVVvlVVvlVVvkVVVVvvvvvvvvvvvvkksvvvSkkvvvvvvvvvvvvvvvkvkvvvkvvvkvvvkvvvkvvvkvvvkM",
  "kVvlVVvlVVvlVVvlVVvlVVvlVVvkVVVVvvvvvvvvvvvvkowsvSsOkvvvvvvvvvvvvvvvkvkvvvkvvvkvvvkvvvkvvvkvvvkk",
  "VVvlVVvlVVvlVVvlVVvlVVvlVVvkVVVVvvvvvvvvvvvvkvvovOvvkvvvvvvvvvvvvvvvkvkvvvkvvvkvvvkvvvkvvvkvvvkv",
  "VVvlVVvlVVvlVVvlVVvlVVvlVVvkVVVvvvvvvvvvvvvvkvvOyovvkvvvvvvvvvvvvvvvkvkvvvkvvvkvvvkvvvkvvvkvvvkv",
  "VVvlVVvlVVvlVVvlVVvlVVvlVVvkVVVvvvvvvvvvvvvvkvOvvvovkvvvvvvvvvvvvvvvkvkvvvkvvvkvvvkvvvkvvvkvvvkv",
  "VVvVVVvVVVvVVVvVVVvVVVvVVVvkVVVvvvvvvvvvvvvvkovvvvvOkvvvvvvvvvvvvvvvkvkvvvkvvvkvvvkvvvkvvvkvvvkv",
  "VVvVVVvVVVvVVVvVVVvVVVvVVVkVVVvvvvvvvvvvvvvvkvvovOvvkvvvvvvvvvvvvvvvvkkvvvkvvvkvvvkvvvkvvvkvvvkv",
  "VVvVVVvVVVvVVVvVVVvVVVvVVVkVVVvvvvvvvvvvvvvvkvvOyovvkvvvvvvvvvvvvvvvvkkvvvkvvvkvvvkvvvkvvvkvvvkv",
  "VVvVVVvVVVvVVVvVVVvVVVvVVVkVVVvvvvvvvvvvvvvvkvOvvvovkvvvvvvvvvvvvvvvvkkvvvkvvvkvvvkvvvkvvvkvvvkv",
  "kVvVVVvVVVvVVVvVVVvVVVvVVkVVVVvvvvvvvvvvvvvvkovvvvvOkvvvvvvvvvvvvvvvvvkvvvkvvvkvvvkvvvkvvvkvvvkk",
  "VkvVVVvVVVvVVVvVVVvVVVvVkVVVVvvvvvvvvvvvvvvvkvvovOvvkvvvvvvvvvvvvvvvvvvkvvkvvvkvvvkvvvkvvvkvvvkv",
  "VkvVVVvVVVvVVVvVVVvVVVvVkVVVVvvvvvvvvvvvvvvvkvvOyovvkvvvvvvvvvvvvvvvvvvkvvkvvvkvvvkvvvkvvvkvvvkv",
];

const FANTASMA_CALMA = [
  "..............kkkkkk..............",
  ".............kVwwVVVk.............",
  "............klwwlllVVk............",
  "...........klwwllllVVVk...........",
  "..........kllwwllllllVVk..........",
  "..........kllVwwVVVVVllk..........",
  "..........kVVllwwllVVvvk..........",
  "..........klllwwlllVVVVk..........",
  "....k.....kllwwllllllVVk.....k....",
  "....k.....klwwVVVVVVVllk.....k....",
  "....kk....kVwwlllllVVvvk....kk....",
  "....klk.k.kllwwllllVVVVk.k.kVk....",
  "..k.klkkkkllllwwlllllVVVkkkkVk.k..",
  "...klllklllllVVVVVVVVllVVVkVVVk...",
  "...kllkllllVVllllllVVvvllVVkVVk...",
  "...kllkllllkkkkkkkkkkkkVVVVkVVk...",
  "....klklllkwwwwwwwwsssskVVVkVk....",
  "....klklllkwwwwwwwwsssskVVVkVk....",
  "....klklllkwwwwwwwwsssskVVVkVk....",
  "....klklllkwwwwwwwwsssskVVVkVk....",
  ".....kkklkwwwkkkwwwkkksskVkkk.....",
  ".....kkkkkwwwwkkwwwskksskkkkk.....",
  ".....kkkwwwwwwwwwwwsssssSSkkk.....",
  "......kwwwwwwwwwwwwsssssSSSk......",
  "......kwwwwwwwwwwwwsssssSSSk......",
  "......kwwwwwwwwkwwwkssssSSSk......",
  "......kwwwwwwwwwkkksssssSSSk......",
  ".....kwwwwwwwwwwwwwsssssSSSSk.....",
  ".....kwwwwwwwwwwwwwsssssSSSSk.....",
  ".....kwwwwwwwwwwwwwsssssSSSSk.....",
  ".....kwwwwkkkkkkkkkkkkkkSSSSk.....",
  ".....kwwwkwwwwwkkssssssSkSSSk.....",
  "....kwwwwkwwwwwwkksssSSSkSSSSk....",
  "....kwwwwwkkkkkkkkkkkkkkSSSSSk....",
  "....kwwwwwwswwwwwwwssssSSSSSSk....",
  "....kwwwwwwswwwwwwwssssSSSSSSk....",
  "...kwwwwwwswwwwwwwwsssssSSSSSSk...",
  "...kwwwwwwswwwwwwwwsssssSSSSSSk...",
  "...kwwwwwwswwwwwwwwsssssSSSSSSk...",
  "...kwwkwwwswwwkwwwwsssksSSSSSSk...",
  "...kwk.kwwswwk.kwwwssk.kSSSSSk....",
  "..kwk...kwswk...kwwsk...kSSSk.....",
  "..kwk...kswwk...kwwsk...kSSSk.....",
  "..kk.....kwk.....kwk.....kSk......",
  "..k.......k.......k.......k.......",
  "..................................",
  "..................................",
  "..................................",
];

const FANTASMA_ATTENTA = [
  "..............kkkkkk..............",
  ".............kVwwVVVk.............",
  "............klwwlllVVk............",
  "...........klwwllllVVVk...........",
  "..........kllwwllllllVVk..........",
  "..........kllVwwVVVVVllk..........",
  "..........kVVllwwllVVvvk..........",
  "..........klllwwlllVVVVk..........",
  "....k.....kllwwllllllVVk.....k....",
  "....k.....klwwVVVVVVVllk.....k....",
  "....kk....kVwwlllllVVvvk....kk....",
  "....klk.k.kllwwllllVVVVk.k.kVk....",
  "..k.klkkkkllllwwlllllVVVkkkkVk.k..",
  "...klllklllllVVVVVVVVllVVVkVVVk...",
  "...kllkllllVVllllllVVvvllVVkVVk...",
  "...kllkllllkkkkkkkkkkkkVVVVkVVk...",
  "....klklllkwwwwwwwwsssskVVVkVk....",
  "....klklllkwwkwwwwwsskskVVVkVk....",
  "....klklllkwwwkkwwwkksskVVVkVk....",
  "....klklllkwwkkkwwwkkkskVVVkVk....",
  ".....kkklkwwwkwkwwwkwksskVkkk.....",
  ".....kkkkkwwwkkkwwwkkksskkkkk.....",
  ".....kkkwwwwwwwwwwwsssssSSkkk.....",
  "......kwwwwwwwwwwwwsssssSSSk......",
  "......kwwwwwwwwwwwwsssssSSSk......",
  "......kwwwwwwwwwwkwsssssSSSk......",
  "......kwwwwwwwwwkwksssssSSSk......",
  ".....kwwwwwwwwwwwkwsssssSSSSk.....",
  ".....kwwwwwwwwwwwwwsssssSSSSk.....",
  ".....kwwwwwwwwwwwwwsssssSSSSk.....",
  ".....kwwwwkkkkkkkkkkkkkkSSSSk.....",
  ".....kwwwkwwwwwkkssssssSkSSSk.....",
  "....kwwwwkwwwwwwkksssSSSkSSSSk....",
  "....kwwwwwkkkkkkkkkkkkkkSSSSSk....",
  "....kwwwwwwswwwwwwwssssSSSSSSk....",
  "....kwwwwwwswwwwwwwssssSSSSSSk....",
  "...kwwwwwwswwwwwwwwsssssSSSSSSk...",
  "...kwwwwwwswwwwwwwwsssssSSSSSSk...",
  "...kwwwwwwswwwwwwwwsssssSSSSSSk...",
  "...kwwkwwwswwwkwwwwsssksSSSSSSk...",
  "...kwk.kwwswwk.kwwwssk.kSSSSSk....",
  "..kwk...kwswk...kwwsk...kSSSk.....",
  "..kwk...kswwk...kwwsk...kSSSk.....",
  "..kk.....kwk.....kwk.....kSk......",
  "..k.......k.......k.......k.......",
  "..................................",
  "..................................",
  "..................................",
];

const FANTASMA_FURIOSA = [
  "..............kkkkkk..............",
  ".............kVwwVVVk.............",
  "............klwwlllVVk............",
  "...........klwwllllVVVk...........",
  "..........kllwwllllllVVk..........",
  "..........kllVwwVVVVVllk..........",
  "..........kVVllwwllVVvvk..........",
  "..........klllwwlllVVVVk..........",
  "....k.....kllwwllllllVVk.....k....",
  "....k.....klwwVVVVVVVllk.....k....",
  "....kk....kVwwlllllVVvvk....kk....",
  "....klk.k.kllwwllllVVVVk.k.kVk....",
  "..k.klkkkkllllwwlllllVVVkkkkVk.k..",
  "...klllklllllVVVVVVVVllVVVkVVVk...",
  "...kllkllllVVllllllVVvvllVVkVVk...",
  "...kllkllllkkkkkkkkkkkkVVVVkVVk...",
  "....klklllkwwwwwwwwsssskVVVkVk....",
  "....klklllkwwkkwwwwskkskVVVkVk....",
  "....klklllkwwwkkwwwkksskVVVkVk....",
  "....klklllkwwkrkwwwkrkskVVVkVk....",
  "...kkkkklkwwwkrkwwwkrksskVkkkkk...",
  "...kwwkkkkwwwwwwwwwssssskkkkwwk...",
  "...kwskkwwwwwwwwwwwsssssSSkkwsk...",
  "...kkkkwwwwwwwwwwwwsssssSSSkkkk...",
  "....kkkwwwwwwwkkkkkkssssSSSkkk....",
  "....kkkwwwwwwwkwkkwkssssSSSkkk....",
  "......kwwwwwwwkrrrrkssssSSSk......",
  ".....kwwwwwwwwkkkkkkssssSSSSk.....",
  ".....kwwwwwwwwwwwwwsssssSSSSk.....",
  ".....kwwwwwwwwwwwwwsssssSSSSk.....",
  ".....kwwwwwswwwwwwwssssSSSSSk.....",
  ".....kwwwwwswwwwwwwssssSSSSSk.....",
  "....kwwwwwwswwwwwwwssssSSSSSSk....",
  "....kwwwwwwswwwwwwwssssSSSSSSk....",
  "....kwwwwwwswwwwwwwssssSSSSSSk....",
  "....kwwwwwwswwwwwwwssssSSSSSSk....",
  "...kwwwwwwswwwwwwwwsssssSSSSSSk...",
  "...kwwwwwwswwwwwwwwsssssSSSSSSk...",
  "...kwwwwwwswwwwwwwwsssssSSSSSSk...",
  "...kwwkwwwswwwkwwwwsssksSSSSSSk...",
  "...kwk.kwwswwk.kwwwssk.kSSSSSk....",
  "..kwk...kwswk...kwwsk...kSSSk.....",
  "..kwk...kswwk...kwwsk...kSSSk.....",
  "..kk.....kwk.....kwk.....kSk......",
  "..k.......k.......k.......k.......",
  "..................................",
  "..................................",
  "..................................",
];

const FANTASMA_CONTENTA = [
  "..............kkkkkk..............",
  ".............kVwwVVVk.............",
  "............klwwlllVVk............",
  "...........klwwllllVVVk...........",
  "..........kllwwllllllVVk..........",
  "..........kllVwwVVVVVllk..........",
  "..........kVVllwwllVVvvk..........",
  "..........klllwwlllVVVVk..........",
  "....k.....kllwwllllllVVk.....k....",
  "....k.....klwwVVVVVVVllk.....k....",
  "....kk....kVwwlllllVVvvk....kk....",
  "....klk.k.kllwwllllVVVVk.k.kVk....",
  "..k.klkkkkllllwwlllllVVVkkkkVk.k..",
  "...klllklllllVVVVVVVVllVVVkVVVk...",
  "...kllkllllVVllllllVVvvllVVkVVk...",
  "...kllkllllkkkkkkkkkkkkVVVVkVVk...",
  "....klklllkwwwwwwwwsssskVVVkVk....",
  "....klklllkwwwwwwwwsssskVVVkVk....",
  "....klklllkwwwwwwwwsssskVVVkVk....",
  "....klklllkwwwkwwwwsksskVVVkVk....",
  ".....kkklkwwwkwkwwwksksskVkkk.....",
  ".....kkkkkwwwwwwwwwssssskkkkk.....",
  ".....kkkwwwppwwwwwwsssppSSkkk.....",
  "......kwwwwwwwwwwwwsssssSSSk......",
  "......kwwwwwwwwkwwwkssssSSSk......",
  "......kwwwwwwwwwkkksssssSSSk......",
  "......kwwwwwwwwwwwwsssssSSSk......",
  ".....kwwwwwwwwwwwwwsssssSSSSk.....",
  ".....kwwwwwwwwwwwwwsssssSSSSk.....",
  ".....kwwwwwwwwwwwwwsssssSSSSk.....",
  ".....kwwwwkkkkkkkkkkkkkkSSSSk.....",
  ".....kwwwkwwwwwkkssssssSkSSSk.....",
  "....kwwwwkwwwwwwkksssSSSkSSSSk....",
  "....kwwwwwkkkkkkkkkkkkkkSSSSSk....",
  "....kwwwwwwswwwwwwwssssSSSSSSk....",
  "....kwwwwwwswwwwwwwssssSSSSSSk....",
  "...kwwwwwwswwwwwwwwsssssSSSSSSk...",
  "...kwwwwwwswwwwwwwwsssssSSSSSSk...",
  "...kwwwwwwswwwwwwwwsssssSSSSSSk...",
  "...kwwkwwwswwwkwwwwsssksSSSSSSk...",
  "...kwk.kwwswwk.kwwwssk.kSSSSSk....",
  "..kwk...kwswk...kwwsk...kSSSk.....",
  "..kwk...kswwk...kwwsk...kSSSk.....",
  "..kk.....kwk.....kwk.....kSk......",
  "..k.......k.......k.......k.......",
  "..................................",
  "..................................",
  "..................................",
];

// Le onde dell'orlo: righe da 39 a 47 (comprese), una versione per fase 0..3.

const CODA_FANTASMA = [
  [
    "...kwwkwwwswwwkwwwwsssksSSSSSSk...",
    "...kwk.kwwswwk.kwwwssk.kSSSSSk....",
    "..kwk...kwswk...kwwsk...kSSSk.....",
    "..kwk...kswwk...kwwsk...kSSSk.....",
    "..kk.....kwk.....kwk.....kSk......",
    "..k.......k.......k.......k.......",
    "..................................",
    "..................................",
    "..................................",
  ],
  [
    "...kkwwwwwswkwwwwwwsksssSSSSkSk...",
    "...k.kwwwwsk.kwwwwwk.kssSSSk.kk...",
    "..k...kwwwk...kwwwk...ksSSk...kk..",
    "..k...kwwsk...kwwwk...ksSSk...kk..",
    ".......kwk.....kwk.....kSk.....k..",
    "........k.......k.......k.........",
    "..................................",
    "..................................",
    "..................................",
  ],
  [
    "...kwwwwwwkwwwwwwwksssssSSkSSSk...",
    "...kwwwwwk.kwwwwwk.kssssSk.kSSk...",
    "....kwwwk...kwwwk...ksssk...kSSk..",
    "....kwwwk...kwwwk...ksssk...kSSk..",
    ".....kwk.....kwk.....ksk.....kSk..",
    "......k.......k.......k.......k...",
    "..................................",
    "..................................",
    "..................................",
  ],
  [
    "...kwwwwkwswwwwwkwwssssskSSSSSk...",
    "...kwwwk.kswwwwk.kwssssk.kSSSSk...",
    "..kwwwk...kwwwk...ksssk...kSSSk...",
    "..kwwwk...kwwwk...ksssk...kSSSk...",
    "...kwk.....kwk.....ksk.....kSk....",
    "....k.......k.......k.......k.....",
    "..................................",
    "..................................",
    "..................................",
  ],
];

const ROSETTA = [
  "..kkkkk..",
  ".kyyooOk.",
  "kyykkkoOk",
  "kykqrrkOk",
  "kokrrRkOk",
  "kokrRRkhk",
  "kOOkkkhhk",
  ".kOOhhhk.",
  "..kkkkk..",
];

const STEMMA = [
  "k........k.k........k",
  "kk.......kkk.......kk",
  "kyk....kkoookk....kOk",
  "kyok..koyoooOOk..kOOk",
  "kyookkoyororoOOkkoOOk",
  "kyooooooyoooOOOOOOOhk",
  ".kyoooooooOOOOOOOOhk.",
  "..kyookkoooOOOkkOhk..",
  "...kok..kkoOkk..khk..",
  "....k.....kkk....k...",
];

const CAMPANELLO = [
  "....kk....",
  "....ko....",
  "..kkkkkk..",
  ".kyyoooOk.",
  "kyoooooOOk",
  "koooooOOOk",
  "kkkkkkkkkk",
  "kOOOOOOhhk",
  "kkkkkkkkkk",
];

const CANDELABRO = [
  "...................",
  "...................",
  "...................",
  "...................",
  ".......k...........",
  "......kwk..........",
  "..k...kws...k......",
  ".kwk..kws..kwk.....",
  ".kws..kws..kws.....",
  ".kws..kws..kws.....",
  ".kws..kws..kws.....",
  "kkkkkkkkkkkkkkk....",
  "kyoOkkyoOkkyoOk....",
  ".kok..kok..kok.....",
  ".kok..kok..kok.....",
  ".koOkkkokkkOOk.....",
  "..kooooooOOOk......",
  "...kkkkoOkkk.......",
  "......kok..........",
  "......kok..........",
  "......kok..........",
  ".....kyoOk.........",
  "....kyooOOk........",
  "...kkkkkkkkk.......",
];

const FIAMMELLE = [
  ["..F..", ".fFf.", ".fyf.", "..f.."],
  [".F...", ".fF..", ".fyf.", "..f.."],
  ["...F.", "..Ff.", ".fyf.", "..f.."],
];

const LIBRO = [
  "..kkkkkkkk.kkkkkkkk..",
  ".kwwwwwwwwkwwwwwwwsk.",
  ".kwSSwSSwwkwSSSwSSsk.",
  ".kwwwwwwwwkwwwwwwwsk.",
  ".kwSSSwSSwkwSSwSSSsk.",
  "kkkkkkkkkkkkkkkkkkkkk",
  "kRRRRRRRRRkRRRRRRRRRk",
  ".kkkkkkkkkkkkkkkkkkk.",
];

const PENNA = [
  "....kk",
  "...kwk",
  "..kwsk",
  ".kwsk.",
  ".kSk..",
  "kkkk..",
  "kDDk..",
  "kkkk..",
];

const SCINTILLA = [
  "..y..",
  "..w..",
  "ywwwy",
  "..w..",
  "..y..",
];
```

## 6. Aggancio per le prove

```js
g.espone({
  gioca: (m) => toccaCasella(m && m.casella),   // la stessa funzione chiamata dai tocchi
  statoGioco: () => ({ ... }),
  posizione: (i) => ({ x: 112 + (i % 3) * 32 + 16, y: 19 + Math.floor(i / 3) * 32 + 16 }),
});
```

- **`gioca({ casella: c })`** **(la verifica lo usa)**: applica la mossa con la stessa funzione dei tocchi (stessi messaggi, stesse animazioni) e ritorna l'esito, uno di questi oggetti esatti:
  - `{ valida: false, motivo: "casella" }` · `{ valida: false, motivo: "buco" }` · `{ valida: false, motivo: "lontano" }`
  - `{ ok: true, mosse, restano, tessere }`
  - `{ errore: true, motivo: "mosse finite", giro, tessere }` (con la `tessere` della partenza nuova)
  - `{ risolto: true, mosse }`
- **`statoGioco()`** **(la verifica lo usa)**:

```js
{ tessere: "865413027", buco: 6, mosse: 0, limite: 28, minimo: 22, giro: 0, restano: 28, risolto: false, sbirciata: false }
```

  `buco` è l'indice del `"0"`; `risolto` è vero dopo la mossa vincente (e se `g.giaRisolto`); `sbirciata` è vero durante i 1500 ms di «Sbircia».
- **`posizione(i)`** (obbligatoria anche se le regole comuni la dicono facoltativa: la verifica clicca lì): il centro della casella `i` in pixel della scena.

Cosa fa la verifica, così sai dove guarda: controlla la variante su sei semi (vincoli e uguaglianza col generatore); rifiuta buco, pezzo lontano e caselle inesistenti senza errori; fa la prima mossa con un clic vero; ricarica la pagina e pretende posizione e mosse uguali; va avanti e indietro fino alla mossa numero `limite` e pretende l'errore con la partenza `partenze[1]` e il contatore a 0; preme «Sbircia»; poi risolve dalla nuova partenza (il primo pezzo con un clic, a più di un secondo dall'errore) e controlla `{ risolto: true }`.

## 7. Criteri di accettazione

Guardando le foto e giocando:

1. La scena sembra un quadro vero appeso sopra un bancone: cornice d'oro con rosette e pipistrello, targa «DONNA OTTAVIA», bancone con campanello, libro e candelabro acceso; l'insegna «FESTA HALLOWEEN» dello sfondo non spunta tagliata sopra il quadro.
2. I pezzi si riconoscono: tenda rossa con la corda e la nappa, finestra con la luna, alveare con la saetta bianca, viso con gli occhi rossi e il canino, colletto viola, collana col rubino. Le fughe fra i pezzi sono di 2 pixel scuri, il buco si legge come un incavo.
3. Il cartello dice «MOSSE m/L» ben leggibile anche sul telefono; diventa rosso a 5 mosse dalla fine, e il fantasma cambia faccia.
4. Un tocco su un pezzo accanto al buco lo fa scorrere subito; uno su un pezzo lontano lo fa tremare col messaggio giusto, senza errore.
5. All'ultima mossa sprecata: avviso del kit, fantasma furioso, contorni rossi, i pezzi volano nella partenza nuova e il cartello torna a 0.
6. «Sbircia» mostra il ritratto ricomposto per un attimo, col bordo interno lilla, poi torna tutto com'era.
7. Alla vittoria il buco si accende, le fughe spariscono e compare il pezzo col pipistrellino; la cornice brilla, il fantasma è contento, il cartello dice «RITRATTO INTERO!»; dopo circa un secondo e mezzo la carta della vittoria.
8. Ricaricando a metà partita, la posizione e le mosse usate restano; ricaricando dopo la vittoria si vede il ritratto intero.
9. Con «riduci movimento» tutto arriva subito allo stato finale, senza pezzi a metà strada.
10. Niente testo HTML nella scena, niente colori fuori dalla tabella `COLORI` e dalla paletta del kit, tutto a pixel interi.
