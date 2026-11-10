# Gli otto candelabri — istruzioni per il costruttore

Rompicapo `otto-candelabri` (scheda in `scheda.js`, da non modificare). Stanza: **Ingresso**. Vale 4 caramelle dorate, una in meno ogni 2 errori (lo fa il kit).

Valgono le regole comuni (`../REGOLE_COMUNI.md`) e l'API del kit (`../comune/kit.js`). Qui c'è solo quello che è specifico di questo rompicapo. `index.html` è la copia di `../_esempio/index.html` con `<title>Gli otto candelabri</title>`.

```js
EscapeDemo.avvia({
  id: "otto-candelabri",
  sfondo: "ingresso",
  velo: 0.5,
  variante(rng) { ... },   // § 2
  crea(g) { ... },
});
```

Il testo della carta iniziale è `scheda.enigma` così com'è: **non** passare `testo` ad `avvia`.

---

## 1. In breve

Il pavimento dell'ingresso è una scacchiera 8×8. Due candelabri sono già inchiodati al pavimento; il giocatore ne posa altri sei toccando le caselle (o trascinandoli), poi preme **Accendi**. Se nessun candelabro ne vede un altro sulla sua fila, colonna o diagonale, le otto fiammelle restano accese e il rompicapo è risolto; altrimenti si spengono quelli che si vedono, ed è un errore.

---

## 2. Variante

### Righe, colonne e nomi delle caselle

Ovunque (variante, mosse, stato) una casella è una coppia `[riga, colonna]`:

- `riga` 0…7 dall'alto in basso: riga 0 = fila **8** (in alto), riga 7 = fila **1** (in basso);
- `colonna` 0…7 da sinistra a destra: colonna 0 = **A**, colonna 7 = **H**.

Il nome che si scrive nei messaggi è `"ABCDEFGH"[colonna] + (8 − riga)`: `[0, 0]` = A8, `[7, 7]` = H1, `[6, 3]` = D2.

### Il generatore

Delle 92 disposizioni di otto candelabri che non si vedono, ci sono esattamente **308 coppie di caselle** che compaiono in una sola disposizione: fissando i due candelabri lì, la soluzione è unica (elenco già verificato dal regista, enumerando tutte le 92 disposizioni). Ogni coppia è scritta come quattro cifre `r1 c1 r2 c2`, con `r1 < r2`. La variante ne pesca una con la **prima** chiamata a `rng`:

```js
const COPPIE = (
  "0014 0015 0023 0024 0032 0037 0041 0042 0046 0047 0051 0056 0064 0065 " +
  "0073 0074 0113 0117 0120 0122 0124 0127 0132 0133 0135 0136 0143 0147 " +
  "0150 0160 0162 0210 0217 0233 0255 0260 0264 0322 0335 0344 0354 0355 " +
  "0361 0367 0370 0377 0425 0432 0443 0452 0453 0460 0466 0470 0477 0510 " +
  "0517 0534 0552 0563 0567 0610 0614 0620 0623 0625 0627 0631 0632 0634 " +
  "0635 0640 0644 0657 0665 0667 0712 0713 0723 0724 0730 0735 0740 0741 " +
  "0745 0746 0751 0756 0762 0763 0773 0774 1022 1023 1026 1031 1033 1034 " +
  "1042 1053 1063 1071 1072 1074 1136 1137 1163 1173 1246 1271 1277 1325 " +
  "1332 1344 1354 1356 1360 1361 1364 1375 1377 1422 1435 1443 1451 1453 " +
  "1463 1466 1467 1470 1472 1541 1570 1576 1630 1631 1664 1674 1721 1724 " +
  "1725 1733 1734 1736 1745 1754 1764 1773 1775 1776 2033 2046 2055 2071 " +
  "2164 2170 2177 2230 2235 2241 2247 2253 2257 2274 2275 2331 2340 2352 " +
  "2360 2364 2374 2436 2447 2455 2463 2467 2473 2532 2537 2540 2546 2550 " +
  "2554 2572 2573 2663 2670 2677 2734 2741 2752 2776 3044 3045 3053 3055 " +
  "3076 3077 3144 3145 3146 3152 3157 3165 3170 3177 3246 3247 3260 3270 " +
  "3346 3347 3364 3371 3374 3440 3441 3463 3473 3476 3540 3541 3567 3577 " +
  "3641 3642 3643 3650 3655 3662 3670 3677 3742 3743 3752 3754 3770 3771 " +
  "4052 4066 4077 4153 4160 4166 4176 4255 4263 4270 4271 4274 4276 4350 " +
  "4360 4367 4371 4372 4457 4460 4467 4475 4476 4552 4564 4571 4573 4576 " +
  "4577 4654 4661 4667 4671 4755 4761 4770 5071 5076 5167 5260 5264 5271 " +
  "5273 5360 5370 5376 5377 5467 5470 5471 5477 5563 5567 5574 5576 5660 " +
  "5771 5776 6072 6075 6076 6277 6371 6377 6470 6476 6570 6771 6772 6775"
).split(" ");   // 308 voci: controlla COPPIE.length === 308

variante(rng) {
  const s = COPPIE[EscapeDemo.intero(rng, 0, COPPIE.length - 1)];
  return { fissi: [[+s[0], +s[1]], [+s[2], +s[3]]] };
}
```

L'elenco va copiato **così com'è e nello stesso ordine**: la verifica ricalcola la coppia attesa per ogni seme.

### Formato

```js
variante = { fissi: [[r1, c1], [r2, c2]] }   // r1 < r2, tutti interi 0…7
```

### Esempi (seme → coppia → soluzione)

| Seme | Voce | Fissi | Unica soluzione (dall'alto in basso) |
|---|---|---|---|
| 12345 | `6377` | D2 `[6,3]`, H1 `[7,7]` | E8 G7 B6 F5 C4 A3 **D2** **H1** |
| 1 | `3045` | A5 `[3,0]`, F4 `[4,5]` | G8 E7 C6 **A5** **F4** H3 B2 D1 |
| 42 | `2663` | G6 `[2,6]`, D2 `[6,3]` | C8 A7 **G6** E5 H4 B3 **D2** F1 |
| 7 | `0024` | A8 `[0,0]`, E6 `[2,4]` | **A8** G7 **E6** H5 B4 D3 F2 C1 |

Con il seme 12345 i sei da posare sono quindi `[0,4] [1,6] [2,1] [3,5] [4,2] [5,0]`.

---

## 3. Regole e mosse

### Lo stato (logica pura, separata dal disegno)

```js
stato = {
  mobili: [[r, c], ...], // i candelabri posati dal giocatore: da 0 a 6, mai sopra un fisso, mai due sulla stessa casella
  accesi: [],            // esito dell'ultima accensione: chi è rimasto acceso
  spenti: [],            // esito dell'ultima accensione: chi si è spento (bordo rosso)
  ultimo: null,          // la disposizione dell'ultima accensione sbagliata, come chiave (vedi sotto)
  risolto: false,
}
daPosare = 6 − mobili.length
chiave(mobili) = mobili ordinati per riga e poi colonna, scritti "r,c;r,c;…"
```

`accesi` e `spenti` restano finché la disposizione non cambia: **ogni** posa, tolta, spostamento o svuotamento riuscito li azzera (tutti i candelabri tornano spenti, senza bordo rosso). `ultimo` invece resta.

Due candelabri **si vedono** se stanno sulla stessa riga, sulla stessa colonna o sulla stessa diagonale (`|r1 − r2| === |c1 − c2|`), a qualunque distanza. Un candelabro **si spegne** se ne vede almeno un altro. (Un candelabro in mezzo non fa da schermo: tanto anche lui ne vede uno, quindi l'insieme di quelli che si spengono non cambia.)

```js
const vede = (a, b) => a[0] === b[0] || a[1] === b[1] || Math.abs(a[0] - b[0]) === Math.abs(a[1] - b[1]);
const chiSiSpegne = (tutti) => tutti.filter((a) => tutti.some((b) => b !== a && vede(a, b)));
```

### Le mosse

Una casella è valida se `riga` e `colonna` sono interi da 0 a 7; altrimenti la mossa è rifiutata con `"fuori"`. I controlli si fanno **nell'ordine scritto**; il primo che scatta decide l'esito.

| Mossa | Rifiuti (in ordine) | Se riesce |
|---|---|---|
| `{ tipo: "posa", riga, colonna }` | `"fuori"` · `"occupata"` (c'è un fisso o un mobile) · `"finiti"` (daPosare = 0) | aggiunge la casella a `mobili` → `{ ok: true, daPosare }` |
| `{ tipo: "togli", riga, colonna }` | `"fuori"` · `"inchiodato"` (è un fisso) · `"vuota"` | la toglie da `mobili` (torna nella rastrelliera) → `{ ok: true, daPosare }` |
| `{ tipo: "sposta", da: [r, c], a: [r, c] }` | `"fuori"` (una delle due non valida) · `"inchiodato"` (`da` è un fisso) · `"vuota"` (`da` vuota) · `"occupata"` (`a` ha un fisso o un mobile, anche se `a` = `da`) | sposta il mobile → `{ ok: true }` |
| `{ tipo: "svuota" }` | nessuno | `mobili = []` → `{ ok: true, daPosare: 6 }` |
| `{ tipo: "accendi" }` | `"mancano"` (daPosare > 0) · `"invariato"` (`chiave(mobili) === ultimo`) | vedi sotto |
| qualunque altra cosa (anche `null` o `{}`) | `"sconosciuta"` | — |

Un rifiuto è `{ valida: false, motivo }`: **non** è un errore, non cambia lo stato e non tocca le dorate. Ha solo un messaggio nel fumetto e una piccola reazione nella scena (§ 4 e § 5).

### Accendi

Con otto candelabri sul pavimento (2 fissi + 6 mobili) e una disposizione diversa dall'ultima sbagliata:

1. `tutti = fissi + mobili`, `sp = chiSiSpegne(tutti)`.
2. **Nessuno si spegne** → `accesi = tutti`, `spenti = []`, `risolto = true`, poi `g.risolto({ riepilogo, ritardo: 1600 })` con
   `riepilogo = "Nessuno si vede: " + i nomi degli otto ordinati per riga, separati da ", " + "."`
   (seme 12345: «Nessuno si vede: E8, G7, B6, F5, C4, A3, D2, H1.»). Esito `{ risolto: true }`.
3. **Qualcuno si spegne** → è un **errore**: `spenti = sp` (ordinati), `accesi = tutti − sp` (ordinati), `ultimo = chiave(mobili)`, salva la memoria, poi
   `g.errore("Alcuni candelabri si vedono: si spengono")`. Esito `{ errore: true, spenti: [...] }` (ordinati per riga e colonna).

Il gioco controlla le regole, non una risposta salvata. Grazie ai due fissi la disposizione giusta è comunque una sola.

**Conta come errore solo l'accensione sbagliata.** Riaccendere la stessa disposizione sbagliata è rifiutato (`"invariato"`), così un doppio tocco non costa una dorata. Non ci sono altri limiti: tentativi illimitati, nessun tempo.

### Memoria (resiste al ricaricamento)

Dopo ogni mossa riuscita e dopo ogni errore: `g.memoria.mobili = mobili; g.memoria.ultimo = ultimo; g.salvaMemoria();`.
All'avvio si rileggono; `mobili` si accetta solo se è un array di al massimo 6 caselle valide, distinte e diverse dai fissi (altrimenti `[]`). `accesi` e `spenti` ripartono sempre vuoti. Gli errori li conserva già il kit.

### Già risolto

Se `g.giaRisolto`: `mobili` = la soluzione senza i due fissi, `accesi` = tutti e otto, `spenti = []`, `risolto = true`. La soluzione si ricava dalla variante con questa funzione (provata dal regista su tutte le 308 coppie):

```js
/** L'unica disposizione con i due fissi: ritorna le otto caselle [riga, colonna] ordinate per riga. */
function soluzione(fissi) {
  const fisso = new Map(fissi.map(([r, c]) => [r, c]));
  const col = [];
  const libera = (r, c) => {
    for (let q = 0; q < 8; q++) {
      if (q === r) continue;
      const cq = q < r ? col[q] : fisso.get(q);
      if (cq === undefined) continue;
      if (cq === c || Math.abs(cq - c) === Math.abs(q - r)) return false;
    }
    return true;
  };
  function cerca(r) {
    if (r === 8) return true;
    for (const c of fisso.has(r) ? [fisso.get(r)] : [0, 1, 2, 3, 4, 5, 6, 7]) {
      if (!libera(r, c)) continue;
      col[r] = c;
      if (cerca(r + 1)) return true;
    }
    return false;
  }
  cerca(0);
  return col.map((c, r) => [r, c]);
}
```

---

## 4. Interfaccia

### Zone di tocco (pixel della scena)

- **Scacchiera:** la casella `[r, c]` è il quadrato `x 100 + 15c … 114 + 15c`, `y 25 + 15r … 39 + 15r` (15×15, tutta la casella è zona di tocco). Da un punto: `c = floor((x − 100) / 15)`, `r = floor((y − 25) / 15)`, valido se entrambi in 0…7.
- **Rastrelliera:** il rettangolo `x 20…75`, `y 54…143`.

### Tocchi e trascinamenti (con `g.tocca`)

Un gesto comincia con `"giu"` e finisce con `"su"`. Diventa un **trascinamento** quando il dito si allontana di almeno 4 pixel della scena dal punto di partenza (`max(|dx|, |dy|) ≥ 4`); altrimenti è un **tocco**.

| Dove comincia | Tocco | Trascinamento |
|---|---|---|
| casella vuota | `posa` su quella casella | niente |
| casella con un mobile | `togli` | il candelabro segue il dito; lasciato su una casella → `sposta(da, a)` (se `a` = `da` non succede niente, nessun messaggio); lasciato fuori dalla scacchiera → `togli` |
| casella con un fisso | `togli` (rifiutato con `"inchiodato"`: messaggio e scossa) | non parte: al rilascio vale come tocco |
| rastrelliera con daPosare > 0 | messaggio «Tocca una casella del pavimento per posare un candelabro.» | un candelabro della scorta segue il dito; lasciato su una casella → `posa` (anche lì valgono i rifiuti); lasciato altrove torna nella rastrelliera |
| altrove | niente | niente |

Tutte queste azioni chiamano **la stessa funzione** `mossa(m)` che usa `gioca` (§ 6). Con il mouse, `"muovi"` senza tasto premuto sopra una casella la evidenzia (anello lilla, § 5).

### Bottoni (`g.bottone`, in quest'ordine)

1. **«Svuota»** — `{ id: "svuota" }` → mossa `svuota`.
2. **«Accendi»** — `{ id: "accendi", forte: true }` → mossa `accendi`.

### Messaggi del fumetto (`g.messaggio`), testi esatti

`{X}` = nome di una casella (es. C4), `{n}` = un numero.

| Quando | Testo |
|---|---|
| all'avvio | Tocca le caselle per posare i candelabri, poi premi Accendi. |
| all'avvio, già risolto | Le otto fiammelle sono accese: nessuna vede le altre. |
| posa, ne restano 2 o più | Posato in {X}. Ne restano {n} da posare. |
| posa, ne resta 1 | Posato in {X}. Ne resta 1 da posare. |
| posa, era l'ultimo | Posato in {X}. Tutti e otto a posto: premi Accendi. |
| togli (anche trascinando fuori), ne restano 2 o più | Tolto da {X}. Ne restano {n} da posare. |
| togli, ne resta 1 | Tolto da {X}. Ne resta 1 da posare. |
| sposta | Spostato da {X} a {Y}. |
| svuota, c'era qualcosa da togliere | Tolti tutti: restano i due inchiodati. |
| svuota, non c'era niente | Ci sono solo i due inchiodati. |
| rifiuto `inchiodato` | Quello in {X} è inchiodato al pavimento. |
| rifiuto `occupata` | Lì c'è già un candelabro. |
| rifiuto `finiti` | Sono già tutti e otto sul pavimento. |
| rifiuto `mancano`, 2 o più | Ne mancano ancora {n} da posare. |
| rifiuto `mancano`, 1 | Ne manca ancora 1 da posare. |
| rifiuto `invariato` | Sono gli stessi di prima: sposta qualche candelabro. |
| tocco sulla rastrelliera | Tocca una casella del pavimento per posare un candelabro. |
| errore (dopo `g.errore`) | Si sono spenti {n} candelabri: quelli col bordo rosso si vedono. |
| vittoria | Nessuno si vede: le otto fiammelle restano accese! |

I rifiuti `"fuori"`, `"vuota"` e `"sconosciuta"` arrivano solo da `gioca` (i tocchi non li producono mai): nessun messaggio. Il motivo di `g.errore` è esattamente «Alcuni candelabri si vedono: si spengono» (il kit aggiunge da sé le dorate rimaste).

---

## 5. Grafica

Sfondo `ingresso` (la facciata della casa vista dal vialetto) con velo 0.5. La scacchiera copre il centro calmo (portone e scalini): è il «pavimento a scacchi dell'ingresso», incorniciato come una tavola preziosa. A sinistra la rastrelliera con i candelabri da posare e il contatore; a destra Zucco che fa il tifo; sul cartello un corvo.

Tutto a coordinate intere con `EscapeDemo.rett`, `riquadro`, `retino`, `sprite`, `testo`. Si può ridisegnare tutta la scena a ogni fotogramma su `g.ctx` (dopo `clearRect`): sono poche centinaia di rettangoli. Qui sotto `C` è `EscapeDemo.C`.

### Disposizione

| Cosa | Dove |
|---|---|
| Ombra della scacchiera | `retino(ctx, C.nero, C.bordo, 227, 21, 2, 132, 0.5)` e `retino(ctx, C.nero, C.bordo, 96, 152, 133, 1, 0.5)` |
| Cornice di legno | rettangolo esterno `x 93, y 18, 134×134` (fino a x 226, y 151) |
| Caselle | `[r, c]` in `x = 100 + 15c`, `y = 25 + 15r`, 15×15; la scacchiera va da (100, 25) a (219, 144) |
| Lettere A…H | sotto, sulla cornice: centrate in `x = 107 + 15c`, cima del testo a `y = 146` |
| Numeri 8…1 | a sinistra, sulla cornice: centrati in `x = 96`, cima del testo a `y = 30 + 15r` |
| Cartello «POSATI» | `riquadro(24, 30, 48, 19)` |
| Rastrelliera | `riquadro(22, 54, 52, 90)`, tre ripiani a `y = 80, 108, 136` |
| Posti della scorta | posto `i` (0…5): `x = 28 + (i % 2) · 27`, `y = 67 + floor(i / 2) · 28` |
| Corvo | (55, 19), sopra il cartello |
| Zucco | (238, 111), **specchiato** (guarda la scacchiera, la lanterna verso sinistra) |
| Fumetto di Zucco | `riquadro(243, 96, 9, 11)` |

Tutto sta nell'area di gioco (x 4…316, y 18…152).

### La cornice

```js
rett(ctx, C.bordo, 93, 18, 134, 134);
rett(ctx, C.legnoChiaro, 94, 19, 132, 132);
rett(ctx, C.legnoLuce, 94, 19, 132, 1); rett(ctx, C.legnoLuce, 94, 19, 1, 132);   // luce in alto e a sinistra
rett(ctx, C.legno, 94, 150, 132, 1);    rett(ctx, C.legno, 225, 19, 1, 132);      // ombra in basso e a destra
for (let x = 98; x < 222; x += 9) { rett(ctx, C.legno, x, 21, 4, 1); rett(ctx, C.legno, x + 4, 148, 4, 1); } // venature
for (let y = 28; y < 146; y += 11) rett(ctx, C.legno, 222, y, 1, 4);
rett(ctx, C.bordo, 99, 24, 122, 122);   // filo scuro attorno alle caselle
for (const [x, y] of [[95, 20], [222, 20], [95, 147], [222, 147]]) {   // borchie d'oro agli angoli
  rett(ctx, C.oroScuro, x, y, 3, 3); rett(ctx, C.oro, x, y, 2, 2); rett(ctx, C.giallo, x, y, 1, 1);
}
for (let c = 0; c < 8; c++) testo(ctx, "ABCDEFGH"[c], 107 + 15 * c, 146, { piccolo: true, colore: C.oro, ombra: null, allinea: "centro" });
for (let r = 0; r < 8; r++) testo(ctx, String(8 - r), 96, 30 + 15 * r, { piccolo: true, colore: C.oro, ombra: null, allinea: "centro" });
```

### Le piastrelle (caselle senza fisso)

Scacchi chiari e scuri: `chiara = (r + c) % 2 === 0` (A8 è chiara). Per la casella in `(x, y)`:

| | chiara | scura |
|---|---|---|
| fondo (15×15) | `C.pietra` | `C.violaScuro` |
| fondo se **accesa** | `C.pietraChiara` | `C.viola` |
| riga in alto e colonna a sinistra (1 px) | `C.pietraChiara`; accesa: `C.fiammaChiara` | `C.viola`; accesa: `C.fiammaChiara` |
| riga in basso e colonna a destra (1 px) | `C.ferroChiaro` | `C.muro` |
| quattro puntini di marmo (solo se non accesa) | `C.pietraChiara` | `C.viola` |

Una casella è «accesa» quando è in `stato.accesi`. Puntini: offset `[3,4] [4,4] [9,10] [11,6]`, specchiati per variare: `px = sx ? ox : 14 − ox` con `sx = (3r + c) % 2 === 1`, `py = sy ? oy : 14 − oy` con `sy = (r + 3c) % 2 === 1`.

### La piastra dei fissi

Le caselle dei due fissi non hanno piastrella: hanno una **piastra di ferro inchiodata**, che si riconosce a colpo d'occhio su entrambi i colori.

```js
riquadro(ctx, x, y, 15, 15, C.ferroChiaro);
rett(ctx, C.pietra, x + 1, y + 1, 13, 1); rett(ctx, C.pietra, x + 1, y + 1, 1, 13);
rett(ctx, C.ferro, x + 1, y + 13, 13, 1); rett(ctx, C.ferro, x + 13, y + 1, 1, 13);
for (const [nx, ny] of [[2, 2], [11, 2], [2, 11], [11, 11]]) {   // i quattro chiodi, 2×2
  rett(ctx, C.pietraChiara, x + nx, y + ny, 1, 1);     // (C.bianco quando lampeggiano, § Animazioni)
  rett(ctx, C.pietra, x + nx + 1, y + ny, 1, 1);
  rett(ctx, C.pietra, x + nx, y + ny + 1, 1, 1);
  rett(ctx, C.bordo, x + nx + 1, y + ny + 1, 1, 1);
}
```

### Gli anelli (evidenziazioni)

Un quadrato vuoto di 1 px dentro la casella: rientro `d` = 1 (lati da `x + 1` a `x + 13`) oppure `d` = 0 (sul bordo della casella).

| Anello | Rientro | Colore |
|---|---|---|
| candelabro spento dopo l'errore (resta finché la disposizione non cambia) | 1 | `C.tappetoChiaro` |
| vittoria / già risolto, sotto ognuno degli otto | 1 | `C.giallo` (in vittoria alterna con `C.oro` ogni 2 fotogrammi) |
| casella sotto il mouse (solo `"muovi"` senza tasto) | 0 | `C.lilla` |
| casella di arrivo durante un trascinamento | 0 | `C.giallo` se libera, `C.tappetoChiaro` se occupata |

### Il candelabro (13×13)

Tutti gli otto candelabri sono uguali, d'ottone con tre candele bianche; i fissi si distinguono solo dalla piastra. Sulla casella `[r, c]` lo sprite va in `(100 + 15c + 1, 25 + 15r + 2)`.

```js
const CANDELABRO = [
  "......k......",
  ".....kwk.....",
  "..k..kwk..k..",
  ".kwk.kwk.kwk.",
  ".kwk.kwk.kwk.",
  ".kpk.kpk.kpk.",
  "kgoOkgoOkgoOk",
  ".kok.kok.kOk.",
  ".kgokkokkOOk.",
  "..kgooooOOk..",
  "...kkgoOkk...",
  "..kgooooOOk..",
  "...kkkkkkk...",
];
const COLORI = {
  k: C.bordo, w: C.bianco, p: C.pietraChiara, s: C.pietra,
  o: C.oro, O: C.oroScuro, g: C.giallo, f: C.fiamma, h: C.fiammaChiara,
};
const STOPPINI = [[6, 0], [2, 2], [10, 2]];   // (colonna, riga) nello sprite: centro, sinistra, destra
```

**Fiammelle** (3×4, 4 fotogrammi). Per lo stoppino `i` in `(sx, sy)` dello sprite in `(X, Y)`: `sprite(ctx, FIAMME[(g.fotogramma + sfasa + 3 * i) % 4], COLORI, X + sx − 1, Y + sy − 3)` con `sfasa = 5r + c`. La fiammella copre lo stoppino; quella centrale sporge di 1 px sulla casella sopra (va bene: si disegna riga per riga dall'alto).

```js
const FIAMME = [
  [".f.", "fhf", "fwf", ".h."],
  ["f..", "ff.", "fhf", ".h."],
  ["...", ".f.", "fhf", ".h."],
  ["..f", ".ff", "fhf", ".h."],
];
```

**Spento dopo l'errore:** gli stoppini diventano braci (`rett(ctx, C.brace, X + sx, Y + sy, 1, 1)`) e da ognuno sale un filo di fumo, ciclo di 8 fotogrammi: `fr = (g.fotogramma + sfasa + 2 * i) % 8`; se `fr < 4`, `sprite(ctx, FUMO[fr], COLORI, X + sx − 1, Y + sy − 4)`, altrimenti niente.

```js
const FUMO = [
  ["...", "...", ".s.", ".s."],
  ["..s", ".s.", ".s.", "..."],
  [".s.", "s..", "...", "..."],
  ["s..", "...", "...", "..."],
];
```

**Stati del candelabro:** normale (spento, nessuna fiamma: è lo stato mentre si posa) · acceso (fiammelle, piastrella accesa) · spento dopo l'errore (braci, fumo, anello rosso) · trascinato (vedi sotto).

**Trascinato:** non si disegna sulla sua casella (o nel suo posto della rastrelliera); si disegna per ultimo, sopra tutto, in `(px − 6, py − 10)` dove `(px, py)` è il punto del dito arrotondato, con l'ombra `retino(ctx, C.nero, C.bordo, px − 4, py + 3, 9, 1, 0.5)` sotto.

### Rastrelliera e contatore

```js
rett(ctx, C.bordo, 30, 49, 1, 5); rett(ctx, C.bordo, 65, 49, 1, 5);          // le due catenelle
riquadro(ctx, 24, 30, 48, 19, C.legnoChiaro);
rett(ctx, C.legnoLuce, 25, 31, 46, 1);
testo(ctx, "POSATI", 48, 33, { piccolo: true, colore: C.pietraChiara, allinea: "centro" });
testo(ctx, `${8 - daPosare}/8`, 48, 40, { colore: daPosare === 0 ? C.giallo : C.bianco, allinea: "centro" });
riquadro(ctx, 22, 54, 52, 90, C.legno);
rett(ctx, C.legnoScuro, 23, 55, 50, 2);
for (let x = 30; x < 72; x += 8) rett(ctx, C.legnoScuro, x, 57, 1, 86);     // assi del fondo
for (let i = 0; i < 3; i++) {
  const py = 80 + i * 28;
  // prima i candelabri dei posti 2i e 2i+1 (se ci sono), poi il ripiano davanti ai loro piedi
  riquadro(ctx, 20, py, 56, 5, C.legnoChiaro);
  rett(ctx, C.legnoLuce, 21, py + 1, 54, 1);
}
```

Il contatore conta i candelabri sul pavimento, fissi compresi: parte da `2/8`. Nella rastrelliera ci sono `daPosare` candelabri (spenti, stesso sprite), nei posti `0 … daPosare − 1`; durante un trascinamento dalla scorta se ne disegna uno in meno.

### Il corvo (12×11), in (55, 19)

```js
const CORVO = [
  "...kkk......",
  "..kfffk.....",
  ".kfyfffk....",
  "kOOkffffk...",
  ".kkfffffk...",
  "..kfFffffk..",
  "..kfFFfffkk.",
  "...kfFFfffFk",
  "....kfFFFFFk",
  ".....kkkkkk.",
  "......kO.kO.",
];
const COLORI_CORVO = { k: C.bordo, f: C.ferroChiaro, F: C.ferro, y: C.giallo, O: C.oroScuro };
```

Strizza l'occhio quando `g.fotogramma % 24 === 5` (per quel fotogramma `y` diventa `C.ferroChiaro`).

### Zucco (23×30), in (238, 111), specchiato

Due fotogrammi di respiro: `ZUCCO` quando `g.fotogramma % 8 < 4`, `ZUCCO_RESPIRO` altrimenti (testa e mantello scendono di un pixel, i piedi restano fermi). Disegnalo con `{ specchia: true }`.

```js
const ZUCCO = [
  ".............Gg........",
  "............GGg........",
  ".........kkkkkkkkkk....",
  "........koOOyyyOOOok...",
  ".......koOOyyhyyOOOok..",
  ".......koOyEEyyOEEOok..",
  ".......koOEeeEyOEeeEk..",
  ".......koOOEEOOEOEEOk..",
  ".......koOOOOOEEOOOOk..",
  ".......koObEbEbEbEbOk..",
  ".......kooOeEeEeEeOok..",
  "........kooOOOOOOOok...",
  ".....kkkkkkkkkkkkkk....",
  "....kqqpppppppk........",
  "...kqpppppppppPk.......",
  "..kqppppppppppPk.PPP...",
  ".kqpppPppppppPPk....kkk",
  "kqppPPkppppppPk.....kek",
  "kppPPk.kpppPPPk.....kEk",
  ".kPk...kpPPPPk......kkk",
  "..k.....kkkkk..........",
  "........kBBkLLk........",
  "........kBBkLLk........",
  "........kBBkLLk........",
  "........kBBkLLk........",
  "........kBBkLLk........",
  "........kBBkLLk........",
  "........kBBkLLk........",
  ".......kRRRkTTTk.......",
  ".......kkkkkkkkk.......",
];
const ZUCCO_RESPIRO = [
  ".......................",
  ".............Gg........",
  "............GGg........",
  ".........kkkkkkkkkk....",
  "........koOOyyyOOOok...",
  ".......koOOyyhyyOOOok..",
  ".......koOyEEyyOEEOok..",
  ".......koOEeeEyOEeeEk..",
  ".......koOOEEOOEOEEOk..",
  ".......koOOOOOEEOOOOk..",
  ".......koObEbEbEbEbOk..",
  ".......kooOeEeEeEeOok..",
  "........kooOOOOOOOok...",
  ".....kkkkkkkkkkkkkk....",
  "....kqqpppppppk........",
  "...kqpppppppppPk.......",
  "..kqppppppppppPk.PPP...",
  ".kqpppPppppppPPk....kkk",
  "kqppPPkppppppPk.....kek",
  "kppPPk.kpppPPPk.....kEk",
  ".kPk...kpPPPPk......kkk",
  "..k.....kkkkk..........",
  "........kBBkLLk........",
  "........kBBkLLk........",
  "........kBBkLLk........",
  "........kBBkLLk........",
  "........kBBkLLk........",
  "........kBBkLLk........",
  ".......kRRRkTTTk.......",
  ".......kkkkkkkkk.......",
];
const COLORI_ZUCCO = {
  k: C.bordo, O: C.brace, y: C.fiamma, h: C.fiammaChiara, E: C.oro, e: C.luna,
  P: C.violaScuro, p: C.viola, q: C.lilla,
  // fuori paletta, motivati: sono i colori di Zucco nella fuga di Zucco (zucco/src/sprite-provvisori.js),
  // così il protagonista è identico nei due giochi. Si usano solo per lui.
  o: "#9c3b17", b: "#4a1a12", G: "#2d5a2e", g: "#5f9440", B: "#463a6a", L: "#7a6aa4", R: "#5e3c44", T: "#83575c",
};
```

**Il fumetto di Zucco** (dopo un errore, per 1,5 s): `riquadro(ctx, 243, 96, 9, 11, C.bianco)`, la coda `rett(ctx, C.bianco, 246, 106, 2, 1)` e `rett(ctx, C.bordo, 246, 107, 1, 1)`, dentro `testo(ctx, "!", 245, 98, { colore: C.tappetoChiaro, ombra: null })`.

### Stelline della vittoria

```js
const STELLA = ["..g..", "..g..", "ggwgg", "..g..", "..g.."];   // g: C.giallo, w: C.bianco (usa COLORI)
const STELLINA = [".g.", "gwg", ".g."];
```

### Ordine di disegno (a ogni fotogramma)

1. ombra della scacchiera e cornice con lettere, numeri e borchie;
2. piastrelle e piastre;
3. anelli;
4. i candelabri della scacchiera **riga per riga dall'alto** (r = 0…7), ognuno con fiammelle o fumo;
5. stelline (solo in vittoria);
6. cartello, rastrelliera e candelabri della scorta, corvo;
7. Zucco e il suo fumetto;
8. il candelabro trascinato.

### Animazioni

Animazioni continue a 8 fotogrammi al secondo con `g.fotogramma`: fiammelle, fumo, respiro di Zucco, occhio del corvo, anelli della vittoria. Spostamenti brevi su pixel interi. **Lo stato cambia sempre subito**; le animazioni vengono dopo.

| Evento | Animazione |
|---|---|
| posa | il candelabro cade nella casella: scostamento in y −4, −2, 0 in 150 ms; il suo posto nella rastrelliera si svuota subito e il contatore cambia subito |
| togli | il candelabro sale (y 0, −2, −4) e sparisce in 150 ms; ricompare nella rastrelliera |
| sposta (rilascio del trascinamento) | appare nella casella di arrivo con scostamento −2, 0 (100 ms) |
| rifiuto `inchiodato` | il fisso trema: x +1, −1, +1, 0 per 4 fotogrammi; i chiodi della sua piastra diventano `C.bianco` per i primi 2 |
| rifiuto `finiti` o `mancano` | il numero del cartello diventa `C.tappetoChiaro` per 4 fotogrammi |
| rifiuto `invariato` | gli anelli rossi alternano `C.bianco` e `C.tappetoChiaro` per 4 fotogrammi |
| rifiuto `occupata` | la casella occupata mostra l'anello `C.tappetoChiaro` (rientro 0) per 4 fotogrammi; un candelabro trascinato torna da dove era partito |
| **accendi sbagliato** | 0–320 ms: si accendono tutti e otto uno dopo l'altro (40 ms ciascuno, in ordine di riga e colonna); a 450 ms quelli di `spenti` si spengono: fiammella via, fumo dal fotogramma 0, piastrella riempita di `C.tappeto` per 2 fotogrammi (lampo rosso), poi l'anello rosso che resta; Zucco trema (x ±1 a fotogrammi alterni per 6 fotogrammi) e mostra il fumetto «!» per 1,5 s |
| **accendi giusto** | si accendono tutti e otto uno dopo l'altro (80 ms ciascuno, in ordine di riga); poi gli anelli della vittoria lampeggiano giallo/oro, per 1,6 s compare una stellina a fotogrammi alterni sopra un candelabro a caso (`STELLA` o `STELLINA` vicino alla cima delle candele; qui `Math.random` va bene), le quattro borchie della cornice diventano `C.bianco` a fotogrammi alterni e Zucco salta (y −3 quando `g.fotogramma % 4 < 2`) per 2 s; la carta della vittoria arriva dopo 1600 ms |
| già risolto | otto candelabri accesi con le fiammelle animate, anelli gialli fissi, niente stelline, Zucco che respira |

Con `g.riduciMovimento`: niente cadute, tremolii, salti, stelline né sequenze; tutto passa subito allo stato finale (anelli rossi e piastrelle accese subito), fiammelle ferme sul fotogramma 0, nessun fumo (solo le braci), niente respiro né occhiolino.

---

## 6. Aggancio per le prove

```js
g.espone({
  gioca: (m) => mossa(m),          // la stessa funzione dei tocchi e dei bottoni
  statoGioco: () => ({ ... }),
  posizione: (riga, colonna) => ({ x: 107 + 15 * colonna, y: 32 + 15 * riga }),   // centro della casella
});
```

**`gioca(mossa)`**: le mosse e gli esiti sono quelli della tabella del § 3, alla lettera:

```js
{ tipo: "posa", riga: 4, colonna: 2 }      → { ok: true, daPosare: 5 }   | { valida: false, motivo: "fuori" | "occupata" | "finiti" }
{ tipo: "togli", riga: 4, colonna: 2 }     → { ok: true, daPosare: 6 }   | { valida: false, motivo: "fuori" | "inchiodato" | "vuota" }
{ tipo: "sposta", da: [4, 2], a: [3, 5] }  → { ok: true }                | { valida: false, motivo: "fuori" | "inchiodato" | "vuota" | "occupata" }
{ tipo: "svuota" }                          → { ok: true, daPosare: 6 }
{ tipo: "accendi" }                         → { risolto: true } | { errore: true, spenti: [[r, c], ...] } | { valida: false, motivo: "mancano" | "invariato" }
qualunque altra                             → { valida: false, motivo: "sconosciuta" }
```

`gioca` aggiorna lo stato subito (le animazioni partono dopo) e mostra gli stessi messaggi dei tocchi.

**`statoGioco()`**:

```js
{
  fissi: [[r1, c1], [r2, c2]],   // come nella variante
  mobili: [[r, c], ...],         // ordinati per riga e poi colonna
  daPosare: 6,                   // 6 − mobili.length
  accesi: [[r, c], ...],         // ordinati; [] se non c'è un'accensione in corso
  spenti: [[r, c], ...],         // ordinati; [] se non c'è un'accensione in corso
  risolto: false,
}
```

Dopo la vittoria (e con `g.giaRisolto`) `accesi` contiene tutti e otto, `spenti` è vuoto e `risolto` è `true`.

La verifica tocca la scacchiera nei centri `(107 + 15c, 32 + 15r)` e trascina dalla rastrelliera partendo da `(48, 100)`: rispetta coordinate e zone del § 4 e § 5.

---

## 7. Criteri di accettazione

Giocando:

- [ ] Con il seme 12345 i fissi sono D2 e H1 (piastre di ferro con i chiodi) e la soluzione E8 G7 B6 F5 C4 A3 D2 H1 risolve; con il seme 7 i fissi sono A8 ed E6.
- [ ] Un tocco su una casella vuota posa, un tocco su un candelabro posato lo toglie, un tocco su un fisso dice che è inchiodato (non è un errore, il fisso trema).
- [ ] Trascinare un candelabro posato lo sposta; trascinarlo fuori dalla scacchiera lo rimette nella rastrelliera; trascinare dalla rastrelliera a una casella lo posa.
- [ ] Accendi con meno di otto: rifiutato con il messaggio, niente errore. Con otto che si vedono: errore, si spengono esattamente quelli che ne vedono un altro (bordo rosso e fumo), gli altri restano accesi. Riaccendere senza cambiare niente: rifiutato.
- [ ] Ogni 2 errori le dorate in palio scendono di una (4 → 3 → 2 → 1).
- [ ] I candelabri posati restano ricaricando la pagina; dopo la vittoria la pagina ricaricata mostra gli otto accesi e non si può più giocare.
- [ ] `node demo/comune/prova.mjs otto-candelabri` finisce con «TUTTO OK».

Guardando le foto (`desktop`, `telefono`, `telefono-verticale`, `verifica-errore`, `verifica-vinto`):

- [ ] La scacchiera è al centro con la cornice di legno, le lettere A…H sotto e i numeri 8…1 a sinistra leggibili; i due fissi si distinguono subito dalle piastre di ferro.
- [ ] I candelabri d'ottone risaltano sia sulle caselle chiare sia su quelle scure; le fiammelle si muovono.
- [ ] Nella foto dell'errore si capisce al volo chi si è spento (bordo rosso) e chi è rimasto acceso (piastrella chiara, fiammelle).
- [ ] La rastrelliera mostra quanti candelabri restano e il cartello dice «POSATI n/8».
- [ ] Zucco è a destra, guarda la scacchiera e respira; il corvo è sul cartello.
- [ ] Niente esce dall'area di gioco (y 18…152) a parte le decorazioni già previste; nessun colore fuori paletta tranne quelli di Zucco.
- [ ] Sul telefono le caselle (15×15 pixel della scena) si toccano senza sbagliare.
