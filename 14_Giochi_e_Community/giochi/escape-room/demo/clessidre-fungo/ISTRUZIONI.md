# Le clessidre del fungo — istruzioni per il costruttore

Rompicapo `clessidre-fungo`, stanza **Area Fumatori**, 4 caramelle dorate, una in meno ogni 2 errori (lo fa il kit).
Valgono [REGOLE_COMUNI.md](../REGOLE_COMUNI.md) e il kit; qui c'è solo quello che è specifico. Dove questo file dà
codice, numeri o testi, vanno presi **alla lettera**: `verifica.mjs` li controlla.

---

## 1. In breve

Sul tavolino ci sono due clessidre (per esempio da 7 e da 11 minuti) e a destra il fungo riscaldante. Il giocatore
**tocca una clessidra per girarla** (il primo giro accende il fungo) e preme **Aspetta**: il tempo salta al momento in
cui una clessidra si svuota, e lì può di nuovo girare quello che vuole. Vince se preme **Spegni** esattamente al
**minuto 15**. Spegnere prima, o lasciar passare il minuto 15, è un errore e si riparte dal minuto 0.

---

## 2. Variante

### Il generatore (da copiare così)

```js
variante(rng) {
  const COPPIE = [[7, 11], [9, 12], [11, 13], [13, 14]]; // [piccola, grande]
  const [piccola, grande] = COPPIE[Math.floor(rng() * COPPIE.length)];
  const clessidre = rng() < 0.5 ? [piccola, grande] : [grande, piccola]; // [sinistra, destra]
  return { clessidre, obiettivo: 15 };
},
```

Formato: `{ clessidre: [a, b], obiettivo: 15 }`. `clessidre[0]` è la clessidra di **sinistra**, `clessidre[1]` quella
di **destra**; la piccola può stare da tutte e due le parti. L'obiettivo è **sempre 15** (lo dice il testo del
rompicapo e lo dicono gli indizi del catalogo).

### Perché proprio queste coppie (non serve rifarlo, è già verificato)

Per tutte e quattro vale `15 = grande + (grande − piccola)`, e 15 non si ottiene sommando clessidre intere girate
appena finiscono. La ricerca su tutte le possibilità (a ogni clessidra che si svuota: girare nessuna, una, l'altra
o tutte e due, senza mai superare il minuto 15) dà **una sola strada** per coppia, in 3 attese:

1. al via (minuto 0) si girano **tutte e due**;
2. quando si svuota la piccola (minuto = piccola) si **rigira la piccola**;
3. quando si svuota la grande (minuto = grande) si **rigira ancora la piccola**: sotto aveva `grande − piccola`
   minuti di sabbia, che ora tornano sopra;
4. la piccola si svuota al **minuto 15**: si spegne.

L'unica libertà è rigirare anche la grande al punto 3 (vuota, non cambia niente). Gli indizi del catalogo
(«conta quanta sabbia è già scesa», «quando la grande finisce, nella piccola sono scesi dei minuti precisi»,
«15 è la clessidra grande più un pezzo della piccola») valgono per tutte e quattro.

### Esempi con la soluzione attesa (mosse nel formato del § 6)

**`{ clessidre: [7, 11], obiettivo: 15 }`**

| mossa | dopo la mossa |
|---|---|
| `gira 0` | minuto 0, sopra [7, 0], fungo acceso |
| `gira 1` | minuto 0, sopra [7, 11] |
| `aspetta` | minuto 7, sopra [0, 4], svuotate [0] |
| `gira 0` | minuto 7, sopra [7, 4] |
| `aspetta` | minuto 11, sopra [3, 0], svuotate [1] |
| `gira 0` | minuto 11, sopra [4, 0] |
| `aspetta` | minuto 15, sopra [0, 0], svuotate [0] |
| `spegni` | **risolto** |

**`{ clessidre: [12, 9], obiettivo: 15 }`** (la piccola è a destra)

`gira 0` → sopra [12, 0] · `gira 1` → [12, 9] · `aspetta` → minuto 9, [3, 0], svuotate [1] · `gira 1` → [3, 9] ·
`aspetta` → minuto 12, [0, 6], svuotate [0] · `gira 1` → [0, 3] · `aspetta` → minuto 15, [0, 0], svuotate [1] ·
`spegni` → **risolto**.

### Il testo della carta iniziale (adattato alla variante)

Con `p` = la clessidra più piccola e `q` = la più grande (per numero, non per posizione):

```
Il fungo riscaldante dell'area fumatori deve restare acceso esattamente 15 minuti: uno in meno e i fumatori gelano, uno in più e la bombola esplode. Sul tavolino ci sono due clessidre, da ${p} e da ${q} minuti. Il fungo si accende quando giri la prima clessidra. Puoi girare le clessidre solo quando una delle due si svuota, e devi spegnere il fungo nel momento giusto.
Tocca una clessidra per girarla. «Aspetta» fa scorrere la sabbia finché una clessidra si svuota; «Spegni» spegne il fungo.
```

(Il primo paragrafo è `scheda.enigma` con i numeri della variante; il «\n» separa i due paragrafi della carta.)

**Come passarlo al kit.** La variante si conosce solo dentro `crea(g)`, ma il kit legge `opzioni.testo` *dopo* aver
chiamato `crea` (in `cartaTesto`). Quindi si tiene un riferimento all'oggetto delle opzioni e lo si completa lì:

```js
const opzioni = {
  id: "clessidre-fungo",
  sfondo: "area-fumatori",
  velo: 0.45,
  variante(rng) { /* sopra */ },
  crea(g) {
    opzioni.testo = testoCarta(g.variante);
    // ...
  },
};
EscapeDemo.avvia(opzioni);
```

---

## 3. Regole e mosse

### Lo stato

```js
{ minuto: 0, sopra: [0, 0], acceso: false }   // più `risolto` (vedi sotto)
```

- `minuto`: minuti passati dal via (0 prima del via e al via).
- `sopra[i]`: minuti di sabbia nella metà **alta** della clessidra `i` (quella di sotto ne ha `clessidre[i] − sopra[i]`).
  All'inizio le clessidre sono a riposo, con tutta la sabbia sotto: `sopra = [0, 0]`.
- `acceso`: il fungo è acceso. Si accende al primo giro e resta acceso finché non si spegne o non c'è un errore.
- `risolto`: true dopo lo spegnimento giusto (o se `g.giaRisolto`).

Il tempo **non scorre da solo**: esiste solo nei momenti in cui una clessidra si svuota. Per questo «girare solo
quando una si svuota» è automatico: fra un'attesa e l'altra il giocatore è sempre fermo in uno di quei momenti
(o al via).

### Le regole (funzione pura, da usare così)

È la stessa logica di `verifica.mjs`: stato + mossa → `[nuovo stato, esito]`. Gli effetti (errori del kit, messaggi,
animazioni) si fanno fuori, guardando l'esito.

```js
const iniziale = () => ({ minuto: 0, sopra: [0, 0], acceso: false });

function applica(v, st, m) {
  const cap = v.clessidre, T = v.obiettivo;
  const azione = m && m.azione;
  if (azione === "gira") {
    const i = m.clessidra;
    if (i !== 0 && i !== 1) return [st, { valida: false, motivo: "clessidra inesistente" }];
    const sopra = [...st.sopra];
    sopra[i] = cap[i] - sopra[i];                       // girarla scambia sopra e sotto
    const nuovo = { minuto: st.minuto, sopra, acceso: true };
    return [nuovo, { ok: true, minuto: nuovo.minuto, sopra: [...sopra], acceso: true }];
  }
  if (azione === "aspetta") {
    if (!st.acceso) return [st, { valida: false, motivo: "fungo spento" }];
    const vive = st.sopra.filter((x) => x > 0);
    if (!vive.length) return [st, { valida: false, motivo: "niente scorre" }];
    const dt = Math.min(...vive);                       // fino alla prossima clessidra che si svuota
    const minuto = st.minuto + dt;
    if (minuto > T) return [iniziale(), { errore: true, motivo: "troppo tardi", minuto: T + 1 }];
    const svuotate = [0, 1].filter((i) => st.sopra[i] === dt);
    const sopra = st.sopra.map((x) => Math.max(0, x - dt));
    return [{ minuto, sopra, acceso: true }, { ok: true, minuto, sopra: [...sopra], svuotate }];
  }
  if (azione === "spegni") {
    if (!st.acceso) return [st, { valida: false, motivo: "fungo spento" }];
    if (st.minuto === T) return [{ ...st, acceso: false }, { risolto: true, minuto: T }];
    return [iniziale(), { errore: true, motivo: "troppo presto", minuto: st.minuto }];
  }
  if (azione === "ricomincia") return [iniziale(), { ok: true }];
  return [st, { valida: false, motivo: "mossa sconosciuta" }];
}
```

### Cosa succede dopo ogni mossa

| Mossa | Quando | Esito | Effetti |
|---|---|---|---|
| `gira i` | sempre (anche al via, anche più volte nello stesso momento: due giri si annullano) | `{ ok: true, minuto, sopra, acceso: true }` | animazione del giro (§ 5); messaggio; se il fungo era spento si accende (minuto resta 0) |
| `gira` con indice diverso da 0/1 | — | `{ valida: false, motivo: "clessidra inesistente" }` | niente (arriva solo dall'aggancio) |
| `aspetta` | fungo spento | `{ valida: false, motivo: "fungo spento" }` | solo messaggio. **Non è un errore** |
| `aspetta` | nessuna clessidra ha sabbia sopra | `{ valida: false, motivo: "niente scorre" }` | solo messaggio. **Non è un errore** |
| `aspetta` | la prossima clessidra si svuota entro il minuto 15 | `{ ok: true, minuto, sopra, svuotate }` | corsa del tempo (§ 5); messaggio |
| `aspetta` | la prossima si svuoterebbe dopo il minuto 15 | `{ errore: true, motivo: "troppo tardi", minuto: 16 }` | **errore**: `g.errore(…)`, corsa del tempo fino a 16, scoppio; stato a capo |
| `spegni` | fungo spento | `{ valida: false, motivo: "fungo spento" }` | solo messaggio. **Non è un errore** |
| `spegni` | minuto ≠ 15 | `{ errore: true, motivo: "troppo presto", minuto }` | **errore**: `g.errore(…)`, gelo; stato a capo |
| `spegni` | minuto = 15 | `{ risolto: true, minuto: 15 }` | vittoria: `g.risolto({ riepilogo, ritardo: 1200 })` |
| `ricomincia` | sempre | `{ ok: true }` | stato a capo, **nessun errore** |

### Errori (testi esatti di `g.errore`)

Conta come errore spegnere il fungo al minuto sbagliato. Lasciar passare il minuto 15 è la stessa cosa (da lì si può
solo spegnerlo tardi, e il testo dice «uno in più e la bombola esplode»), quindi conta subito, al minuto 16.

- troppo presto: `` `Spento al minuto ${minuto}: troppo presto, i fumatori gelano` ``
- troppo tardi: `` `Al minuto ${obiettivo + 1} la bombola è scoppiata: troppo tardi` `` (cioè «Al minuto 16 …»)

Dopo un errore lo stato torna a `iniziale()` (fungo spento, clessidre a riposo, minuto 0): si riprova da capo.
Il kit aggiunge da solo «· ora le dorate in palio sono N» quando scendono.

### Limiti

Nessun limite di tentativi o di mosse. L'unico limite è il minuto 15 (vedi sopra). «Ricomincia» è gratis: un tentativo
abbandonato non costa niente (ricaricare la pagina farebbe lo stesso: lo stato della prova **non** si salva in
`g.memoria`).

### Risolto

`spegni` al minuto 15: lo stato diventa `{ minuto: 15, sopra: (com'era), acceso: false }`, `risolto = true`, e si chiama
`g.risolto({ riepilogo, ritardo: 1200 })` con

```js
const d = q - p;
const riepilogo = `Con le clessidre da ${p} e da ${q}: al via le giri tutte e due; al minuto ${p} si svuota la piccola e la rigiri; al minuto ${q} si svuota la grande e rigiri ancora la piccola, che rimette sopra ${d === 1 ? "il minuto appena sceso" : `i ${d} minuti appena scesi`}. Si svuota al minuto 15.`;
```

(La strada è unica, quindi il riepilogo vale anche se il giocatore ha rigirato la grande al minuto `q`.)

---

## 4. Interfaccia

### Tocchi

- **Clessidra `i`**: zona di tocco `x` da `CX[i] − 24` a `CX[i] + 23`, `y` da 44 a 111, con `CX = [142, 190]`
  (le due zone si toccano ma non si sovrappongono). Al **`giu`** applica `gira i`. Nient'altro si tocca nella scena.
- **Passaggio del mouse** (`muovi` con `premuto` falso): la clessidra sotto il puntatore ha il contorno dorato (§ 5).
  Fuori dalle zone nessuna evidenziazione. Facoltativo: `g.scena.style.cursor = "pointer"` sopra le zone.
- Un tocco o un bottone durante un'animazione (giro, corsa del tempo, reazione) **chiude subito l'animazione**
  (salta allo stato finale) e poi applica la nuova mossa.

### Bottoni (`g.bottone`, in quest'ordine)

| Etichetta | id (`data-azione`) | Mossa | Note |
|---|---|---|---|
| Aspetta | `aspetta` | `aspetta` | `forte: true` |
| Spegni | `spegni` | `spegni` | |
| Ricomincia | `ricomincia` | `ricomincia` | |

Tastiera (facoltativa): `1` = `gira 0`, `2` = `gira 1`, `Invio` = `aspetta`. **Nessun tasto per Spegni** (niente
errori per sbaglio).

### Messaggi del fumetto (`g.messaggio`), testi esatti

`cap` = capacità della clessidra in questione, `m` = minuto, `s` = sabbia sopra dopo il giro.

| Momento | Testo |
|---|---|
| all'avvio (non risolto) | `Tocca una clessidra per girarla: il primo giro accende il fungo.` |
| all'avvio, già risolto | `Il fungo si è spento al minuto giusto: qui hai finito.` |
| `gira` che accende il fungo | `Fungo acceso al minuto 0. Quando sei pronto, premi Aspetta.` |
| `gira` (fungo già acceso), `s` > 1 | `` `Girata la clessidra da ${cap}: sopra ci sono ${s} minuti di sabbia.` `` |
| `gira`, `s` = 1 | `` `Girata la clessidra da ${cap}: sopra c'è 1 minuto di sabbia.` `` |
| `gira`, `s` = 0 | `` `Girata la clessidra da ${cap}: sopra non c'è più sabbia.` `` |
| `aspetta` ok, una svuotata | `` `Minuto ${m}: si è svuotata la clessidra da ${cap}.` `` |
| `aspetta` ok, tutte e due | `` `Minuto ${m}: si sono svuotate tutte e due le clessidre.` `` |
| `aspetta` col fungo spento | `Prima gira una clessidra: è il primo giro che accende il fungo.` |
| `aspetta` senza sabbia sopra | `Nessuna clessidra ha sabbia sopra: girane una.` |
| `spegni` col fungo spento | `Il fungo è già spento: si accende girando una clessidra.` |
| errore troppo presto (dopo `g.errore`) | `Brr! Fungo spento e clessidre a riposo: si riparte dal minuto 0.` |
| errore troppo tardi (dopo `g.errore`) | `Bum! Fungo spento e clessidre a riposo: si riparte dal minuto 0.` |
| `ricomincia` | `Fungo spento e clessidre a riposo: si riparte dal minuto 0.` |
| vittoria | `Spento al minuto 15 in punto: fumatori al caldo, bombola salva!` |

Il messaggio del minuto 15 è come gli altri: niente «ora!», il giocatore deve accorgersene dalla lavagna.

---

## 5. Grafica

### Sfondo e ordine di disegno

`sfondo: "area-fumatori"`, `velo: 0.45`. Lo sfondo ha già, a destra, un fungo riscaldante: **il nostro fungo lo copre
esattamente** (stesse coordinate, più grande e in primo piano), così nella stanza ce n'è uno solo, quello del
rompicapo. Il centro dello sfondo (cielo, staccionata) resta libero; la panca di legno dello sfondo (x 74…123,
y 104…117) diventa il posto dello scheletro.

Tutto sulla tela principale `g.ctx`, ridisegnata a ogni fotogramma in `g.anima` (prima `clearRect`), in quest'ordine:

1. alone del fungo (solo se acceso)
2. lavagna
3. scheletro
4. tavolino (piano, targhette, piede, ombra)
5. cartellini dei numeri
6. clessidre
7. fungo
8. effetti: scoppio, neve, scintille, vapore

Mappa d'insieme (pixel della scena, tutto dentro l'area di gioco x 4…316, y 18…152):

```
 x:  10      66 76    101 108  127    157 175    205 207  224          274           310
     ┌lavagna─┐  scheletro  [cart]┌clessid.0┐┌clessid.1┐[cart]             ┌─cappello─┐   y 24
     │MINUTO  │  sulla panca  ◄  │ y 50…109 ││         │  ►    posacenere  │ bruciat. │   y 38…63
     │  7     │                  └──────────┘└─────────┘       (sfondo)    │   palo   │   y 64…103
     │ tacche │      ┌──────── tavolino x 103…229, piano y 107 ───────┐    │   base   │   y 104…150
     │SPEGNI A│      │   [ 7 MIN ]  targhette y 110…120  [ 11 MIN ]   │    │   GAS    │
     │  15    │      └──────────────── piede x 143…189 ────────────────┘    └──────────┘
     y 60…150
```

### Colori e lettere comuni

Tutti i colori sono di `EscapeDemo.C` più lo smeraldo di `EscapeDemo.GEMME`. Nessun colore fuori paletta.

### 1) La clessidra (31×60, due copie)

Sprite in alto a sinistra in `(CX[i] − 15, 50)`, con `CX = [142, 190]`: occupa x `CX−15…CX+15`, y 50…109 (poggia sul
piano del tavolino). Righe 0–5 tappo in alto, 6–28 metà alta, 29–30 collo, 31–53 metà bassa, 54–59 tappo in basso.
Le lettere `g` sono il vetro vuoto: lì dentro va la sabbia (vedi sotto).

```js
const CLESSIDRA = [
  ".kkkkkkkkkkkkkkkkkkkkkkkkkkkkk.", // 0
  "kllllllllllllllllllllllllllllLk", // 1
  "kLLLLLLLLLLLLLLLLLLLLLLLLLLLLmk", // 2
  "kaaaaaaaaaaaaaaaaaaaaaaaaaaaaak", // 3
  "kmmmmmmmmmmmmmmmmmmmmmmmmmmmmMk", // 4
  ".kkkkkkkkkkkkkkkkkkkkkkkkkkkkk.", // 5
  ".klmk.....kvggggggguk.....kLMk.", // 6
  "kllmmk..kvggggggggggguk..kLLMMk", // 7
  "kllmmk.kvggggggggggggguk.kLLMMk", // 8
  ".klmk.kvrgggggggggggggguk.kLMk.", // 9
  ".klmk.kvrgggggggggggggguk.kLMk.", // 10
  ".klmk.kvrgggggggggggggguk.kLMk.", // 11
  ".klmk.kvrgggggggggggggguk.kLMk.", // 12
  ".klmk.kvggggggggggggggguk.kLMk.", // 13
  ".klmk..kvggggggggggggguk..kLMk.", // 14
  ".klmk..kvggggggggggggguk..kLMk.", // 15
  ".klmk...kvggggggggggguk...kLMk.", // 16
  ".klmk...kvggggggggggguk...kLMk.", // 17
  ".klmk....kvggggggggguk....kLMk.", // 18
  ".klmk.....kvggggggguk.....kLMk.", // 19
  ".klmk......kvggggguk......kLMk.", // 20
  ".klmk.......kvggguk.......kLMk.", // 21
  ".klmk.......kvggguk.......kLMk.", // 22
  ".klmk........kvguk........kLMk.", // 23
  ".klmk........kvguk........kLMk.", // 24
  ".klmk........kvguk........kLMk.", // 25
  ".klmk.........kgk.........kLMk.", // 26
  ".klmk.........kgk.........kLMk.", // 27
  ".klmk.........kgk.........kLMk.", // 28
  "kllmmk........kgk........kLLMMk", // 29
  "kllmmk........kgk........kLLMMk", // 30
  ".klmk.........kgk.........kLMk.", // 31
  ".klmk.........kgk.........kLMk.", // 32
  ".klmk.........kgk.........kLMk.", // 33
  ".klmk........kvguk........kLMk.", // 34
  ".klmk........kvguk........kLMk.", // 35
  ".klmk........kvguk........kLMk.", // 36
  ".klmk.......kvggguk.......kLMk.", // 37
  ".klmk.......kvggguk.......kLMk.", // 38
  ".klmk......kvggggguk......kLMk.", // 39
  ".klmk.....kvggggggguk.....kLMk.", // 40
  ".klmk....kvggggggggguk....kLMk.", // 41
  ".klmk...kvggggggggggguk...kLMk.", // 42
  ".klmk...kvggggggggggguk...kLMk.", // 43
  ".klmk..kvggggggggggggguk..kLMk.", // 44
  ".klmk..kvggggggggggggguk..kLMk.", // 45
  ".klmk.kvrgggggggggggggguk.kLMk.", // 46
  ".klmk.kvrgggggggggggggguk.kLMk.", // 47
  ".klmk.kvrgggggggggggggguk.kLMk.", // 48
  ".klmk.kvrgggggggggggggguk.kLMk.", // 49
  ".klmk.kvggggggggggggggguk.kLMk.", // 50
  "kllmmk.kvggggggggggggguk.kLLMMk", // 51
  "kllmmk..kvggggggggggguk..kLLMMk", // 52
  ".klmk.....kvggggggguk.....kLMk.", // 53
  ".kkkkkkkkkkkkkkkkkkkkkkkkkkkkk.", // 54
  "kLLLLLLLLLLLLLLLLLLLLLLLLLLLLmk", // 55
  "kaaaaaaaaaaaaaaaaaaaaaaaaaaaaak", // 56
  "kmmmmmmmmmmmmmmmmmmmmmmmmmmmmMk", // 57
  "kMMMMMMMMMMMMMMMMMMMMMMMMMMMMMk", // 58
  ".kkkkkkkkkkkkkkkkkkkkkkkkkkkkk.", // 59
];
```

Colori: `k` C.bordo (con il mouse sopra: **C.oro**, è l'evidenziazione), `l` C.legnoLuce, `L` C.legnoChiaro,
`m` C.legno, `M` C.legnoScuro, `v` C.notteChiara (bordo del vetro, lato in luce), `u` C.ferroChiaro (bordo del vetro,
lato in ombra), `g` C.notte (vetro vuoto), `r` C.bianco (riflesso), `a` la fascia colorata = colore medio della
sabbia. Sabbia (lettere aggiunte dal riempimento): `s` chiara, `S` media, `D` scura.

| Clessidra | `s` | `S` (e `a`) | `D` |
|---|---|---|---|
| sinistra (indice 0), «sabbia di zucca» | C.fiammaChiara | C.fiamma | C.brace |
| destra (indice 1), «sabbia di strega» | GEMME.smeraldo[2] | GEMME.smeraldo[1] | GEMME.smeraldo[0] |

I colori vanno con la **posizione**, non con la capacità.

### La sabbia: riempimento delle lettere `g`

Ogni metà ha 183 pixel `g`. La sabbia di una clessidra occupa sempre **128** pixel in tutto (circa il 70% di una
metà: tutta sotto, la clessidra è piena per due terzi e sopra resta l'aria). Per disegnare la clessidra `i` con
`sopra` minuti in alto si costruisce la griglia così:

```js
const SABBIA = 128;
function righe(a, b) { const r = []; for (let y = a; y >= b; y--) r.push(y); return r; }
/** Pixel `g` di una metà nell'ordine in cui si riempiono: dalla riga più bassa in su. */
function ordineMeta(meta) {
  const lista = [];
  for (const y of meta === "sopra" ? righe(28, 6) : righe(53, 31)) {
    const xs = [];
    for (let x = 0; x < 31; x++) if (CLESSIDRA[y][x] === "g") xs.push(x);
    const ord = [];
    if (meta === "sopra") {               // sopra: dai bordi verso il centro (la sabbia scende dal centro)
      let a = 0, b = xs.length - 1;
      while (a <= b) { ord.push(xs[a]); if (a !== b) ord.push(xs[b]); a++; b--; }
    } else {                              // sotto: dal centro verso i bordi (il mucchietto)
      ord.push(15);
      for (let d = 1; d < 16; d++) { if (xs.includes(15 - d)) ord.push(15 - d); if (xs.includes(15 + d)) ord.push(15 + d); }
    }
    for (const x of ord) lista.push([x, y]);
  }
  return lista;
}
const ORDINE = { sopra: ordineMeta("sopra"), sotto: ordineMeta("sotto") }; // si calcola una volta
const quanti = (min, cap) => (min <= 0 ? 0 : min >= cap ? SABBIA : Math.min(SABBIA - 1, Math.max(1, Math.round((SABBIA * min) / cap))));

/** La griglia di lettere della clessidra con la sabbia. `flusso`: la sabbia sta scendendo (solo durante la corsa del tempo). */
function griglia(sopra, cap, flusso, tempo) {
  const g = CLESSIDRA.map((r) => [...r]);
  const piene = new Set();
  ORDINE.sopra.slice(0, quanti(sopra, cap)).forEach(([x, y]) => piene.add(x + "," + y));
  ORDINE.sotto.slice(0, quanti(cap - sopra, cap)).forEach(([x, y]) => piene.add(x + "," + y));
  for (const k of piene) {
    const [x, y] = k.split(",").map(Number);
    const larga = CLESSIDRA[y].split("").filter((c) => c === "g").length >= 5;
    g[y][x] = !piene.has(x + "," + (y - 1)) ? "s"                    // la superficie è chiara
      : CLESSIDRA[y][x + 1] === "u" && larga ? "D"                    // il bordo destro è scuro
      : "S";
  }
  if (flusso && sopra > 0) {             // il filo di sabbia: collo e granelli che cadono
    g[29][15] = "S"; g[30][15] = "s";
    const fase = Math.floor(tempo / 60);
    for (let y = 31; y <= 53 && !piene.has("15," + y); y++) if ((((y - fase) % 3) + 3) % 3 === 0) g[y][15] = "S";
  }
  return g.map((r) => r.join(""));
}
```

Si disegna con `EscapeDemo.sprite(ctx, griglia(...), colori, CX[i] - 15, 50)`.

### Il giro (animazione, 240 ms)

Al `gira i` lo stato cambia subito. La clessidra `i` fa tre fotogrammi da 80 ms con la griglia **di prima del giro**
(`prima = griglia(sopraPrima, cap, false, 0)`), poi torna normale con il nuovo stato:

| tempo | cosa si disegna al posto della clessidra `i` |
|---|---|
| 0–80 ms | `prima` in `(CX − 15, 47)` (sollevata di 3 pixel) |
| 80–160 ms | `ruota90(prima)` (60×31, coricata) in `(CX − 30, 65)` |
| 160–240 ms | `ruota180(prima)` in `(CX − 15, 47)` |
| dopo | griglia del nuovo stato in `(CX − 15, 50)` (la sabbia si «assesta») |

```js
const ruota90 = (r) => Array.from({ length: r[0].length }, (_, c) => r.map((riga) => riga[c]).reverse().join(""));
const ruota180 = (r) => [...r].reverse().map((riga) => [...riga].reverse().join(""));
```

Coricata, la clessidra copre per un attimo il suo cartellino: va bene. Con `g.riduciMovimento` niente fotogrammi.

### La corsa del tempo (animazione dopo `aspetta`)

Lo stato è già al nuovo minuto; il disegno lo raggiunge **un minuto ogni 90 ms** (il salto più lungo, 13 minuti,
dura poco più di un secondo). Si ricorda `da` (minuto di prima), `a` (minuto d'arrivo; per lo scoppio `a = 16`) e
`sopraPrima`. A ogni fotogramma:

- minuto mostrato `mm = da + Math.min(a − da, Math.floor((g.tempo − inizio) / 90))`;
- per ogni clessidra, sabbia sopra mostrata `max(0, sopraPrima[i] − (mm − da))`;
- `flusso = true` per le clessidre con sabbia sopra mostrata > 0, finché `mm < a`;
- il fungo resta acceso, la lavagna conta i minuti (numero e tacche).

Arrivati ad `a`: se era un `aspetta` valido si torna al disegno dello stato; se era lo scoppio parte la reazione
«bum» (sotto). Con `g.riduciMovimento` si salta subito ad `a`.

### 2) I cartellini dei numeri (18×11, quattro copie)

Per ogni clessidra due cartellini di carta con i minuti di sabbia: quello in alto (y 62) dice quanti minuti ci sono
**sopra**, quello in basso (y 87) quanti **sotto**. La punta indica la clessidra.

```js
const CARTELLINO = [
  "kkkkkkkkkkkkkkk...",
  "kbbbbbbbbbbbbbk...",
  "kpppppppppppppk...",
  "kpppppppppppppkk..",
  "kppppppppppppppPk.",
  "kpppppppppppppppPk",
  "kppppppppppppppPk.",
  "kpppppppppppppkk..",
  "kpppppppppppppk...",
  "kPPPPPPPPPPPPPk...",
  "kkkkkkkkkkkkkkk...",
];
```

Colori: `k` C.bordo, `b` C.bianco, `p` C.pietraChiara, `P` C.pietra.

- Clessidra di sinistra: cartellini in `(CX[0] − 34, 62)` e `(CX[0] − 34, 87)` = x 108, punta a destra.
  Numero: `testo(ctx, n, x + 7, y + 2, { colore: C.bordo, ombra: null, allinea: "centro" })`.
- Clessidra di destra: cartellini in `(CX[1] + 17, 62)` e `(CX[1] + 17, 87)` = x 207, con `specchia: true`
  (punta a sinistra). Numero centrato su `x + 10`, stessa riga.

I numeri seguono la sabbia **mostrata** (anche durante la corsa del tempo).

### 3) Il tavolino

```js
riquadro(ctx, 103, 107, 127, 15, C.legno);       // piano: x 103…229, y 107…121
rett(ctx, C.legnoLuce, 104, 108, 125, 1);
rett(ctx, C.legnoChiaro, 104, 109, 125, 1);
rett(ctx, C.legnoScuro, 104, 120, 125, 1);
rett(ctx, C.legnoScuro, 228, 110, 1, 11);
riquadro(ctx, 157, 121, 19, 3, C.ferroChiaro);   // collare
riquadro(ctx, 161, 123, 11, 22, C.ferro);        // colonna di ghisa
rett(ctx, C.ferroChiaro, 163, 124, 1, 20);
riquadro(ctx, 143, 144, 47, 6, C.ferro);         // piede
rett(ctx, C.ferroChiaro, 144, 145, 45, 1);
// ombra a puntini sul pavimento
for (let y = 150; y <= 152; y++) for (let x = 138; x <= 194; x++) if (BAYER[y & 3][x & 3] < 8) rett(ctx, C.bordo, x, y, 1, 1);
```

**Targhette d'ottone** con la capacità, sotto ciascuna clessidra, sul bordo del piano:

```js
riquadro(ctx, cx - 19, 110, 39, 11, C.oro);
rett(ctx, C.giallo, cx - 18, 111, 37, 1);
rett(ctx, C.oroScuro, cx - 18, 119, 37, 1);
testo(ctx, `${cap} MIN`, cx, 112, { colore: C.bordo, ombra: null, allinea: "centro" });
```

### 4) La lavagna del tempo (a sinistra, davanti alla porta)

Una lavagnetta a cavalletto da bar: è l'orologio del rompicapo.

```js
riquadro(ctx, 10, 60, 57, 82, C.legno);                 // cornice x 10…66, y 60…141
rett(ctx, C.legnoChiaro, 11, 61, 55, 1);
rett(ctx, C.legnoChiaro, 11, 61, 1, 79);
rett(ctx, C.legnoScuro, 11, 140, 55, 1);
rett(ctx, C.legnoScuro, 65, 62, 1, 79);
riquadro(ctx, 13, 63, 51, 76, C.siepe, C.legnoScuro);   // ardesia: interno x 14…62, y 64…137
for (let y = 64; y < 138; y++) for (let x = 14; x < 63; x++) if ((x * 7 + y * 13) % 23 === 0) rett(ctx, C.erbaScura, x, y, 1, 1); // polvere di gesso
riquadro(ctx, 13, 141, 4, 10, C.legno);                 // gambe
riquadro(ctx, 60, 141, 4, 10, C.legno);
```

Scritte (gesso), tutte centrate su x 38:

| cosa | chiamata |
|---|---|
| «MINUTO» | `testo(ctx, "MINUTO", 38, 66, { colore: C.pietraChiara, ombra: null, allinea: "centro" })` |
| il minuto mostrato | `testo(ctx, String(mm), 38, 77, { colore, ombra: C.bordo, scala: 3, allinea: "centro" })` — `colore` C.bianco; **C.oro** se `mm === 15`; **C.tappetoChiaro** durante le reazioni d'errore (mostra il minuto sbagliato) |
| tacche (vedi sotto) | righe 103…109 |
| puntini | `for (let x = 18; x <= 58; x += 2) rett(ctx, C.pietra, x, 112, 1, 1)` |
| «SPEGNI A» | `testo(ctx, "SPEGNI A", 38, 115, { colore: C.pietraChiara, ombra: null, piccolo: true, allinea: "centro" })` |
| l'obiettivo | `testo(ctx, String(obiettivo), 38, 122, { colore: C.oro, ombra: C.bordo, scala: 2, allinea: "centro" })` |

**Tacche di gesso** (gruppi da cinque, come si contano i minuti sulla lavagna), una per ogni minuto mostrato, al
massimo 15:

```js
for (let i = 0; i < Math.min(15, mm); i++) {
  const gx = 22 + Math.floor(i / 5) * 12, k = i % 5;
  if (k < 4) rett(ctx, C.pietraChiara, gx + k * 2, 103, 1, 7);
  else for (let j = 0; j <= 8; j++) rett(ctx, C.pietraChiara, gx - 1 + j, 109 - Math.round((j * 6) / 8), 1, 1); // la barra
}
if (mm > 15) testo(ctx, "!", 56, 103, { colore: C.tappetoChiaro, ombra: null }); // al minuto 16, lo scoppio
```

**Cornice della vittoria** (dopo lo spegnimento giusto e da già risolto): rettangolo vuoto di 1 pixel C.giallo da
(17, 74) a (59, 101).

### 5) Lo scheletro sulla panca (26×48)

Un fumatore infreddolito con la sciarpa, seduto sulla panca dello sfondo: sprite in alto a sinistra in **(76, 70)**
(occupa x 76…101, y 70…117, piedi sul pavimento della panca). Colori: `k` C.bordo, `w` C.pietraChiara,
`W` C.pietra, `n` C.nero, `b` C.bianco, `s` C.tappetoChiaro, `S` C.tappeto.

Posa **caldo** (mani sulle ginocchia, si gode il fungo):

```js
const SCHELETRO_CALDO = [
  "..........kkkkkk..........",
  "........kkwwwwwwkk........",
  ".......kwwbwwwwwWWk.......",
  "......kwwbwwwwwwwWWk......",
  "......kwwwwwwwwwwWWk......",
  "......kwnnnwwwwnnnWk......",
  "......kwnnnwwwwnnnWk......",
  "......kwwnwwwwwwnWWk......",
  ".......kwwwwnnwwwWk.......",
  "........kwkwkwkwWk........",
  "........kwwwwwwwWk........",
  ".......ksssssssSSSk.......",
  ".......ksssssssSSSk.......",
  ".......ksssssssSSSk.......",
  ".......kkkkkWWkkssSk......",
  "......kwwkkkWWkkswwk......",
  "......kwwwwwWWwwwwwk......",
  ".....kwwwkkkWWkkswwwk.....",
  ".....kwwwwwwWWwwwwwwk.....",
  "....kwwwkkkkWWkksswwwk....",
  "....kwwkwwwwWWwwwwSwwk....",
  "....kwwkkkkkWWkkkkkwwk....",
  "...kwwwkkwwwWWwwwkkwwwk...",
  "...kwwk..kkkWWkkk..kwwk...",
  "...kwwk....kWWk....kwwk...",
  "...kwwk....kWWk....kwwk...",
  "...kwwk....kWWk....kwwk...",
  "...kwwwk...kWWk...kwwwk...",
  "....kwwk.kkkWWkkk.kwwk....",
  "....kwwkkwwwwwwwwkkwwk....",
  "...kwwwwkwwwwwwwwkwwwwk...",
  "...kwwwwwwnwwwwnwwwwwwk...",
  "...kwwwwwwwwwwwwwwwwwwk...",
  "...kwwwwwwWWWWWWwwwwwwk...",
  "...kwwwwWWkkkkkkwwwwWWk...",
  "...kwwwwWWk....kwwwwWWk...",
  "....kwWkkk......kkkwWk....",
  "....kwWk..........kwWk....",
  "....kwWk..........kwWk....",
  "....kwWk..........kwWk....",
  "....kwWk..........kwWk....",
  "....kwWk..........kwWk....",
  "....kwWk..........kwWk....",
  "....kwWk..........kwWk....",
  "..kkkwWk..........kwWkkk..",
  ".kwwwwwwk........kwwwwwwk.",
  ".kWWWWWWk........kWWWWWWk.",
  "..kkkkkk..........kkkkkk..",
];
```

Posa **freddo** (si abbraccia, testa incassata di un pixel):

```js
const SCHELETRO_FREDDO = [
  "..........................",
  "..........kkkkkk..........",
  "........kkwwwwwwkk........",
  ".......kwwbwwwwwWWk.......",
  "......kwwbwwwwwwwWWk......",
  "......kwwwwwwwwwwWWk......",
  "......kwnnnwwwwnnnWk......",
  "......kwnnnwwwwnnnWk......",
  "......kwwnwwwwwwnWWk......",
  ".......kwwwwnnwwwWk.......",
  "........kwkwkwkwWk........",
  "........kwwwwwwwWk........",
  ".......ksssssssSSSk.......",
  ".......ksssssssSSSk.......",
  ".......ksssssssSSSk.......",
  ".......kkkkkWWkkssSk......",
  "......kwwkkkWWkkswwk......",
  "......kwwwwwWWwwwwwk......",
  ".....kwwwkkkWWwwwwwwk.....",
  ".....kwwwWWWwwwwwwwwk.....",
  ".....kwwkWWWWWWWsswwk.....",
  "....kwwwwwwWWWWWWWWwwk....",
  "....kwwwwwkkWWkWWWWWWk....",
  "....kwwwkwwwWWwwwkWWWk....",
  ".....kkk.kkkWWkkk.kkk.....",
  "...........kWWk...........",
  "...........kWWk...........",
  "...........kWWk...........",
  ".........kkkWWkkk.........",
  "........kwwwwwwwwk........",
  "........kwwwwwwwwk........",
  "....kkkkwwnwwwwnwwkkkk....",
  "...kwwwwwwwwwwwwwwwwwwk...",
  "...kwwwwwwWWWWWWwwwwwwk...",
  "...kwwwwWWkkkkkkwwwwWWk...",
  "...kwwwwWWk....kwwwwWWk...",
  "....kwWkkk......kkkwWk....",
  "....kwWk..........kwWk....",
  "....kwWk..........kwWk....",
  "....kwWk..........kwWk....",
  "....kwWk..........kwWk....",
  "....kwWk..........kwWk....",
  "....kwWk..........kwWk....",
  "....kwWk..........kwWk....",
  "..kkkwWk..........kwWkkk..",
  ".kwwwwwwk........kwwwwwwk.",
  ".kWWWWWWk........kWWWWWWk.",
  "..kkkkkk..........kkkkkk..",
];
```

Posa **festa** (braccia al cielo):

```js
const SCHELETRO_FESTA = [
  "..kwwwk...kkkkkk..kwwwk...",
  "..kwwwk.kkwwwwwwkkkwwwk...",
  "...kwwkkwwbwwwwwWWkkwwk...",
  "...kwwkwwbwwwwwwwWWkwwk...",
  "...kwwkwwwwwwwwwwWWkwwk...",
  "...kwwkwnnnwwwwnnnWkwwk...",
  "..kwwwkwnnnwwwwnnnWkwwwk..",
  "..kwwkkwwnwwwwwwnWWkkwwk..",
  "..kwwk.kwwwwnnwwwWk.kwwk..",
  "..kwwk..kwkwkwkwWk..kwwk..",
  "..kwwwk.kwwwwwwwWk.kwwwk..",
  "...kwwkksssssssSSSkkwwk...",
  "...kwwwksssssssSSSkwwwk...",
  "....kwwwsssssssSSSwwwk....",
  ".....kwwkkkkWWkksswwk.....",
  ".....kwwwkkkWWkkswwwk.....",
  "......kwwwwwWWwwwwwk......",
  ".......kkkkkWWkkssSk......",
  ".......kwwwwWWwwwwSk......",
  "........kkkkWWkkssSk......",
  ".......kwwwwWWwwwwSk......",
  "........kkkkWWkkkkk.......",
  "........kwwwWWwwwk........",
  ".........kkkWWkkk.........",
  "...........kWWk...........",
  "...........kWWk...........",
  "...........kWWk...........",
  "...........kWWk...........",
  ".........kkkWWkkk.........",
  "........kwwwwwwwwk........",
  "........kwwwwwwwwk........",
  "....kkkkwwnwwwwnwwkkkk....",
  "...kwwwwwwwwwwwwwwwwwwk...",
  "...kwwwwwwWWWWWWwwwwwwk...",
  "...kwwwwWWkkkkkkwwwwWWk...",
  "...kwwwwWWk....kwwwwWWk...",
  "....kwWkkk......kkkwWk....",
  "....kwWk..........kwWk....",
  "....kwWk..........kwWk....",
  "....kwWk..........kwWk....",
  "....kwWk..........kwWk....",
  "....kwWk..........kwWk....",
  "....kwWk..........kwWk....",
  "....kwWk..........kwWk....",
  "..kkkwWk..........kwWkkk..",
  ".kwwwwwwk........kwwwwwwk.",
  ".kWWWWWWk........kWWWWWWk.",
  "..kkkkkk..........kkkkkk..",
];
```

Quale posa e quale effetto:

| Situazione | Posa | Extra (spostamenti in pixel interi rispetto a (76, 70)) |
|---|---|---|
| fungo spento, nessuna reazione | freddo | brividi: `dx = [0, 0, 1, 0, 0, 0, -1, 0][g.fotogramma % 8]` |
| fungo acceso (anche durante la corsa del tempo) | caldo | fermo |
| reazione **gelo** (troppo presto, 1200 ms) | freddo | colori ghiacciati (`w` C.notteChiara, `W` C.ferroChiaro); trema `dx = g.fotogramma % 2 ? 1 : -1`; ghiaccioli (sotto); «BRR»; neve |
| reazione **bum** (troppo tardi, 1000 ms) | freddo | salto di spavento: `dy = −3` nei primi 120 ms, `−1` fino a 240 ms; occhi sbarrati: pixel C.bianco in `(x + 9, y + 6)` e `(x + 16, y + 6)` |
| vittoria (1200 ms) | festa | due saltelli: `dy = −2` quando `Math.floor(τ / 125)` vale 1 o 4 |
| risolto (dopo la vittoria e da già risolto) | festa | fermo |

Ghiaccioli (gelo), C.bianco, relativi all'angolo dello sprite: `rett(x+10, y+12, 1, 3)`, `rett(x+13, y+12, 1, 2)`,
`rett(x+16, y+12, 1, 3)`, `rett(x+5, y+24, 1, 2)`, `rett(x+20, y+24, 1, 2)`.
«BRR»: `testo(ctx, "BRR", x + 13, y - 9, { colore: C.notteChiara, ombra: C.bordo, piccolo: true, allinea: "centro" })`.
Neve: sei fiocchi (centro C.bianco, quattro punte C.notteChiara) che scendono di un pixel per fotogramma fra
x 64…110 e y 56…116, partenze casuali (qui `Math.random` va bene: è decorazione).

### 6) Il fungo riscaldante (x 274…310, y 24…152)

Copre esattamente quello dello sfondo. Centro x 292.

**Alone** (solo acceso, disegnato *prima* di tutto il resto, così il fungo lo copre): puntini caldi a retino. Conviene
calcolare una volta la lista dei pixel.

```js
for (let y = 18; y < 118; y++) for (let x = 250; x < 320; x++) {
  const d = Math.hypot(x - 292, (y - 50) * 1.15);
  if (d >= 36) continue;
  const soglia = BAYER[y & 3][x & 3] / 16;
  if (d < 20 && soglia < 0.5 * (1 - d / 20)) rett(ctx, C.brace, x, y, 1, 1);
  else if (soglia < 0.55 * (1 - d / 36)) rett(ctx, C.muroAcceso, x, y, 1, 1);
}
```

**Cappello** (riflettore), sprite 37×14 in **(274, 24)**:

```js
const CAPPELLO = [
  "................kkkkk................", // y 24
  "................kpfFk................",
  "...........kkkkkfffffkkkkk...........",
  ".......kkkkpppfffffffffffFkkkk.......",
  "....kkkppppppfffffffffffffFFFFkkk....",
  ".kkkppppppppffffffffffffffffFFFFFkkk.",
  "kppppppppppffffffffffffffffffFFFFFFFk", // y 30
  "kppppppppppffffffffffffffffffFFFFFFFk",
  "kkkppppppppffffffffffffffffffFFFFFkkk",
  "...kkkkqqqqqqqqqqqqqqqqqqqqqqqkkkk...",
  ".......kkqqqqqqqqqqqqqqqqqqqkk.......",
  ".........kkqqqqqqqqqqqqqqqkk.........",
  "...........kfqqqqqqqqqqqqk...........",
  "............kkkkkkkkkkkkk............", // y 37
];
```

Colori: `k` C.bordo, `p` C.pietraChiara, `f` C.ferroChiaro, `F` C.ferro, `q` (il sotto del riflettore) **C.brace se
acceso** (riflette la fiamma), C.ferro se spento.

**Bruciatore** (il tubo con la fiamma, x 286…298, y 38…63):

```js
riquadro(ctx, 286, 38, 13, 26, C.ferro);
rett(ctx, C.ferroChiaro, 287, 39, 11, 1);
rett(ctx, C.ferroChiaro, 287, 62, 11, 1);
if (acceso) {
  const fase = g.fotogramma % 3;                       // le fasce salgono di un pixel a fotogramma
  for (let y = 40; y <= 61; y++) rett(ctx, (y + fase) % 3 === 0 ? C.fiamma : C.brace, 287, y, 11, 1);
  rett(ctx, C.fiammaChiara, 291, 42, 3, 18);           // il cuore della fiamma
  rett(ctx, C.bianco, 292, 44 + (g.fotogramma % 2), 1, 12);
} else {
  rett(ctx, C.ferro, 287, 40, 11, 22);
  rett(ctx, C.ferroChiaro, 290, 42, 1, 18);            // riflesso sul vetro freddo
}
rett(ctx, C.bordo, 289, 40, 1, 22);                    // la griglia di protezione
rett(ctx, C.bordo, 295, 40, 1, 22);
```

**Palo** e **base con la bombola**:

```js
riquadro(ctx, 289, 64, 7, 40, C.ferroChiaro);          // palo x 289…295, y 64…103
rett(ctx, C.pietraChiara, 290, 65, 1, 38);
rett(ctx, C.ferro, 294, 65, 1, 38);
riquadro(ctx, 288, 84, 9, 3, C.ferro);                 // fascetta
riquadro(ctx, 286, 104, 13, 3, C.ferroChiaro);         // collare
for (let y = 107; y <= 145; y++) {                     // la base a tronco di cono
  const s = Math.floor((y - 107) / 8), a = 283 - s, b = 301 + s;
  rett(ctx, C.bordo, a, y, b - a + 1, 1);
  rett(ctx, C.ferro, a + 1, y, b - a - 1, 1);
  rett(ctx, C.ferroChiaro, a + 1, y, 3, 1);
  rett(ctx, C.pietra, a + 1, y, 1, 1);
}
rett(ctx, C.bordo, 283, 107, 19, 1);
rett(ctx, C.bordo, 288, 111, 10, 1);                   // feritoie
rett(ctx, C.bordo, 288, 114, 10, 1);
riquadro(ctx, 285, 121, 15, 9, C.giallo);              // targa «GAS»
testo(ctx, "GAS", 292, 123, { colore: C.bordo, ombra: null, piccolo: true, allinea: "centro" });
riquadro(ctx, 286, 134, 6, 6, C.oroScuro);             // manopola
rett(ctx, C.oro, 287, 135, 2, 2);
riquadro(ctx, 295, 134, 5, 5, acceso ? C.erbaChiara : C.ferro); // spia: verde se acceso
if (acceso) rett(ctx, C.bianco, 296, 135, 1, 1);
riquadro(ctx, 276, 146, 33, 5, C.ferro);               // piede
rett(ctx, C.ferroChiaro, 277, 147, 31, 1);
for (let y = 151; y <= 152; y++) for (let x = 274; x <= 310; x++) if (BAYER[y & 3][x & 3] < 8) rett(ctx, C.bordo, x, y, 1, 1);
```

### 7) Le reazioni

Durante le reazioni d'errore la scena mostra un **fermo immagine** del momento sbagliato (minuto e sabbia di quel
momento, minuto in C.tappetoChiaro sulla lavagna), anche se lo stato è già tornato a capo; finita la reazione si
disegna lo stato (minuto 0, clessidre a riposo).

**Gelo** (spento troppo presto, 1200 ms): fungo spento subito, lavagna col minuto sbagliato in rosso, scheletro
ghiacciato che trema (tabella sopra), «BRR», neve.

**Bum** (oltre il minuto 15): prima la corsa del tempo fino a 16 (fungo acceso), poi 1000 ms di scoppio sul fungo,
con `τ` = ms dall'inizio dello scoppio e `disco(cx, cy, r, colore, densità)` = ogni pixel con `dx² + dy² ≤ r²` e
`BAYER[(cy+dy)&3][(cx+dx)&3] < densità × 16`:

| τ | cosa |
|---|---|
| 0–120 | lampo: `rett(C.bianco, 287, 40, 11, 22)` + `disco(292, 50, 7, C.giallo, 1)` |
| 120–400 | palla di fuoco: `disco(292, 48, 16, C.ferroChiaro, 0.6)`, `disco(292, 48, 12, C.fiamma, 1)`, `disco(292, 48, 7, C.fiammaChiara, 1)`, `disco(292, 48, 3, C.bianco, 1)` |
| 400–1000 | fumo che sale: `r = 16 + ⌊(τ−400)/100⌋`, `cy = 48 − ⌊(τ−400)/150⌋`: `disco(292, cy, r, C.ferro, 0.7)`, `disco(292, cy, r−4, C.ferroChiaro, 0.75)`, `disco(288, cy−4, r−9, C.pietra, 0.8)` |
| 120–520 | il cappello salta: disegnato in (274, 20) invece che in (274, 24) |
| 120–1000 | `testo(ctx, "BUM!", 292, 66, { colore: C.giallo, ombra: C.bordo, scala: 2, allinea: "centro" })` |

Dopo lo scoppio il fungo è spento. Lo scheletro salta per lo spavento (tabella sopra). La lavagna mostra 16 in rosso,
le 15 tacche e il «!».

**Vittoria** (spento al minuto 15, 1200 ms; `g.risolto` si chiama subito, la carta arriva dopo 1200 ms):
- il fungo si spegne in tre passi: 0–125 ms fiamma normale, 125–250 ms tubo tutto C.brace senza cuore, 250–375 ms
  tubo C.muroAcceso, poi spento; dal passo 2 tre sbuffi di vapore (quadratini 2×2 C.pietra) salgono da (291, 22) di
  un pixel ogni 125 ms, a 4 pixel l'uno dall'altro, visibili solo con y ≥ 18;
- lavagna: il 15 in C.oro con la cornice C.giallo;
- scintille attorno alle clessidre: stelline (centro C.bianco, punte C.giallo) in (124, 52), (160, 60), (166, 44),
  (210, 56), (214, 100), (120, 98), (190, 40); la stellina `k` è accesa quando `(g.fotogramma + k) % 3 !== 0` e ha
  le punte quando vale 1;
- scheletro in posa festa con i due saltelli.

**Già risolto** (`g.giaRisolto`): scena ferma con minuto 15 dorato e cornice, 15 tacche, `sopra = [0, 0]`, fungo
spento, scheletro in festa. Niente scintille.

**`g.riduciMovimento`**: niente giro, niente corsa del tempo, niente brividi, niente fiamma che sale (fasce ferme con
`fase = 0`), niente neve né saltelli. Le reazioni restano visibili per la stessa durata ma ferme: gelo con i colori
ghiacciati e «BRR» senza tremare; bum con il solo fotogramma del fumo (`τ = 600`) e «BUM!»; vittoria con il 15
dorato, la cornice e lo scheletro in festa.

---

## 6. Aggancio per le prove

```js
g.espone({
  gioca: (m) => mossa(m),          // la STESSA funzione chiamata da tocchi, bottoni e tastiera
  statoGioco: () => ({ minuto, sopra: [a, b], capacita: [A, B], obiettivo: 15, acceso, risolto }),
  posizione: (i) => ({ x: CX[i], y: 80 }),
});
```

- **Mosse**: `{ azione: "gira", clessidra: 0 | 1 }`, `{ azione: "aspetta" }`, `{ azione: "spegni" }`,
  `{ azione: "ricomincia" }`.
- **Esiti**: esattamente quelli di `applica` (§ 3), stessi campi e stessi `motivo`:
  `{ ok: true, minuto, sopra, acceso: true }` (gira), `{ ok: true, minuto, sopra, svuotate }` (aspetta),
  `{ ok: true }` (ricomincia), `{ valida: false, motivo }` con motivo `"clessidra inesistente"`, `"fungo spento"`,
  `"niente scorre"` o `"mossa sconosciuta"`, `{ errore: true, motivo: "troppo presto", minuto }`,
  `{ errore: true, motivo: "troppo tardi", minuto: 16 }`, `{ risolto: true, minuto: 15 }`.
- **`statoGioco()`**: lo stato logico (non quello mostrato durante le animazioni). `capacita` = `variante.clessidre`.
  Da già risolto: `{ minuto: 15, sopra: [0, 0], …, acceso: false, risolto: true }`.
- **`posizione(i)`**: il centro della clessidra `i` in pixel della scena: un clic lì la gira.

---

## 7. Criteri di accettazione

Guardando le foto e giocando:

1. Si capisce subito dove si tocca: due clessidre grandi sul tavolino, il fungo a destra, la lavagna a sinistra.
2. Nella stanza c'è **un solo** fungo: quello dello sfondo non si vede da nessuna parte (né il cappello, né il palo,
   né la base).
3. Ogni clessidra mostra la sabbia sopra e sotto in proporzione, con i due cartellini giusti (sopra + sotto = targhetta).
4. La lavagna dice sempre il minuto (numero grande e tacche) e «SPEGNI A 15»; durante la corsa del tempo conta.
5. Toccare una clessidra la fa girare in modo visibile (sollevata, coricata, capovolta) entro un fotogramma; il primo
   giro accende il fungo (fiamma, alone, spia verde, riflettore arancio) e lo scheletro passa a «caldo».
6. Aspetta: la sabbia scende col filo nel collo, i numeri calano, la lavagna conta, poi tutto si ferma sulla clessidra
   svuotata e il fumetto lo dice.
7. Spegnere al minuto sbagliato: avviso del kit con il testo esatto, scossa, lavagna col minuto in rosso, scheletro
   ghiacciato con «BRR»; poi tutto a capo e le dorate in palio scendono ogni due errori.
8. Oltre il minuto 15: «BUM!» con la nuvola sul fungo, scheletro che salta; errore come sopra.
9. Vittoria: fungo che si spegne a passi con il vapore, 15 dorato incorniciato, scintille, scheletro che esulta;
   poi la carta con il riepilogo giusto per la variante.
10. Ricaricando dopo la vittoria: scena ferma e chiusa (15 dorato, fungo spento, scheletro in festa).
11. Le mosse impossibili (Aspetta prima del via o senza sabbia sopra, Spegni a fungo spento) danno solo il messaggio:
    nessuna scossa, nessun errore.
12. Al telefono (foto «telefono» e «telefono-verticale») i numeri dei cartellini, delle targhette e della lavagna si
    leggono; le zone di tocco delle clessidre sono ampie (48×68 pixel della scena).
13. Niente fuori dall'area di gioco tranne decorazioni (il vapore della vittoria può salire fino a y 18); niente
    colori fuori paletta; niente linee, archi, sfumature lisce o testo HTML nella scena.
14. `node demo/comune/prova.mjs clessidre-fungo` finisce con «TUTTO OK».
