# Lo shottino avvelenato — istruzioni per il costruttore

Valgono le [regole comuni](../REGOLE_COMUNI.md) e il kit (`comune/kit.js`); qui c'è solo quello che è specifico di questo rompicapo. Il testo, gli indizi, le dorate (4) e gli errori concessi (2) sono in `scheda.js`: non si toccano. `index.html` è la copia di `_esempio/index.html` con `<title>Lo shottino avvelenato</title>`. Tutto il codice va in `gioco.js` (niente `gioco.css`).

---

## 1. In breve

Sul bancone della Sala Bar ci sono 16 shottini numerati da 1 a 16; sopra, una griglia di 4 righe × 16 colonne: ogni riga è un pipistrello assaggiatore, ogni colonna uno shottino. Il giocatore segna con un tocco (o trascinando) chi assaggia cosa e preme **Fai assaggiare**: passa un'ora, i pipistrelli che hanno bevuto il veleno diventano verdi e il giocatore tocca lo shottino avvelenato e preme **Indica**.

Si vince solo se ogni shottino ha un gruppo di assaggiatori diverso da tutti gli altri (i gruppi possibili sono esattamente 16, compreso «nessuno»): in quel caso i verdi indicano un solo shottino. Se due o più shottini hanno gli stessi assaggiatori, il veleno finisce proprio lì e non si può indovinare: ogni scelta è un errore.

---

## 2. Variante

Cosa cambia fra giocatori: **l'ordine in cui il barista avvelena gli shottini**, una permutazione di 0…15. Al primo giro il veleno (se la griglia è fatta bene) è `ordine[0]`; dopo ogni errore si passa al giro successivo e al veleno successivo.

```js
variante(rng) {
  return {
    pipistrelli: 4,
    shottini: 16,
    ordine: EscapeDemo.mescola(rng, Array.from({ length: 16 }, (_, i) => i)),
  };
},
```

- Formato esatto (lo legge `verifica.mjs`): `{ pipistrelli: 4, shottini: 16, ordine: [16 interi distinti 0..15] }`. Nient'altro nella variante.
- Indici sempre da 0: lo shottino `j` ha la targhetta `j + 1`; il pipistrello `i` è `NOMI[i]` con `NOMI = ["rosso", "giallo", "azzurro", "bianco"]`.
- È sempre risolvibile: qualunque assegnazione che dà a ogni shottino un gruppo diverso (per esempio «lo shottino j lo assaggiano i pipistrelli dei bit accesi di j») isola il veleno. Non serve un elenco di disposizioni verificate.
- La variante non entra nel testo: la carta iniziale usa `scheda.enigma` così com'è (non passare `testo` ad `avvia`).

### Esempi (calcolati con il generatore del kit)

Seme **12345** → `ordine = [9,1,8,12,14,2,5,7,11,0,3,13,10,6,4,15]`.

- **A.** Assaggi «binari»: `assaggi[j] = j` (shottino 1 nessuno, shottino 2 solo il rosso, … shottino 16 tutti e quattro). Tutti diversi → veleno `ordine[0] = 9` (targhetta **10**), maschera `9 = 1001` → verdi **rosso e bianco**. `indica 9` → risolto.
- **B.** Come A ma `assaggi[15] = 14` (lo shottino 16 ha gli stessi assaggiatori del 15: giallo, azzurro, bianco). Il primo shottino di `ordine` con un gemello è il 14 → verdi **giallo, azzurro e bianco**, indistinguibili `[14, 15]` (shottini 15 e 16). `indica 14` → errore «Sbagliato: il veleno era nello shottino 16». Giro 2, il giocatore rimette `assaggi[15] = 15`: veleno `ordine[1] = 1` (targhetta **2**), verde **rosso**; `indica 1` → risolto (con 1 errore: dorate ancora 4).

Seme **42** → `ordine = [12,7,0,15,4,1,3,14,10,13,5,2,8,11,6,9]`.

- **C.** Solo il rosso assaggia lo shottino 1 (`assaggi = [1, 0, 0, …]`). Il primo di `ordine`, il 12, ha 14 gemelli (maschera 0) → nessun verde, indistinguibili gli indici 1…15 (targhette 2…16, 15 shottini), messaggio «15 shottini hanno gli stessi assaggiatori: non si distinguono.». `indica 0` → errore «Sbagliato: il veleno era nello shottino 13».

---

## 3. Regole e mosse

### Lo stato (logica pura, separata dal disegno)

```js
{
  fase: "assegna" | "indica" | "risolto",
  giro: 0,                 // quante volte si è già indicato uno shottino sbagliato
  assaggi: [16 interi],    // assaggi[j] = maschera di 4 bit: bit i acceso = il pipistrello i assaggia lo shottino j
  verdi: null | 0..15,     // maschera dei pipistrelli diventati verdi (solo dopo l'ora)
  gruppo: null | [j, ...], // shottini con proprio quegli assaggiatori, in ordine crescente
  veleno: null | j,        // solo in fase "risolto"
}
```

### La funzione delle regole

Questa è la regola esatta (la verifica la rifà per conto suo): copiala in `gioco.js` così com'è, adattando solo la sintassi da modulo a script. Stato + mossa → nuovo stato ed esito; non modifica mai lo stato ricevuto.

```js
const P = 4, N = 16;
function statoIniziale() {
  return { fase: "assegna", giro: 0, assaggi: Array(N).fill(0), verdi: null, gruppo: null, veleno: null };
}
function ordineDelGiro(variante, giro) {
  return Array.from({ length: N }, (_, k) => variante.ordine[(giro + k) % N]);
}
function bitAccesi(m) { return [0, 1, 2, 3].filter((i) => (m >> i) & 1); }

function applica(stato, m, variante) {
  const no = (motivo) => ({ stato, esito: { valida: false, motivo } });
  const intero = (x, max) => Number.isInteger(x) && x >= 0 && x < max;
  if (!m || typeof m !== "object") return no("mossa sconosciuta");

  if (m.tipo === "segna") {
    if (stato.fase !== "assegna") return no("dopo l'ora le caselle non si cambiano");
    if (!intero(m.pipistrello, P) || !intero(m.shottino, N)) return no("casella fuori dalla griglia");
    if (m.valore !== undefined && typeof m.valore !== "boolean") return no("valore non valido");
    const assaggi = [...stato.assaggi];
    const b = 1 << m.pipistrello;
    const acceso = m.valore === undefined ? !(assaggi[m.shottino] & b) : m.valore;
    assaggi[m.shottino] = acceso ? assaggi[m.shottino] | b : assaggi[m.shottino] & ~b;
    return { stato: { ...stato, assaggi }, esito: { ok: true } };
  }

  if (m.tipo === "cancella") {
    if (stato.fase !== "assegna") return no("dopo l'ora le caselle non si cambiano");
    return { stato: { ...stato, assaggi: Array(N).fill(0) }, esito: { ok: true } };
  }

  if (m.tipo === "assaggia") {
    if (stato.fase !== "assegna") return no("l'ora è già passata");
    if (stato.assaggi.every((x) => x === 0)) return no("nessuno assaggia niente");
    const ord = ordineDelGiro(variante, stato.giro);
    const quanti = (x) => stato.assaggi.filter((y) => y === x).length;
    // Il barista è furbo: se ci sono shottini con gli stessi assaggiatori, il veleno va lì.
    const conGemello = ord.find((j) => quanti(stato.assaggi[j]) >= 2);
    const base = conGemello !== undefined ? conGemello : ord[0];
    const verdi = stato.assaggi[base];
    const gruppo = [];
    stato.assaggi.forEach((x, j) => { if (x === verdi) gruppo.push(j); });
    return {
      stato: { ...stato, fase: "indica", verdi, gruppo },
      esito: { ok: true, verdi: bitAccesi(verdi), indistinguibili: [...gruppo] },
    };
  }

  if (m.tipo === "indica") {
    if (stato.fase !== "indica") return no("prima gli assaggi e l'ora di attesa");
    if (!intero(m.shottino, N)) return no("shottino inesistente");
    const j = m.shottino;
    if (stato.gruppo.length === 1 && stato.gruppo[0] === j)
      return { stato: { ...stato, fase: "risolto", veleno: j }, esito: { risolto: true, veleno: j } };
    // Sbagliato. Se lo shottino era fra gli indistinguibili, il veleno «era» in un suo gemello:
    // il giocatore non poteva saperlo, quindi nessuna scelta a caso vince mai.
    const ord = ordineDelGiro(variante, stato.giro);
    const veleno = ord.find((k) => stato.gruppo.includes(k) && k !== j);
    return {
      stato: { ...stato, fase: "assegna", giro: stato.giro + 1, verdi: null, gruppo: null },
      esito: { errore: true, motivo: `Sbagliato: il veleno era nello shottino ${veleno + 1}`, veleno },
    };
  }

  return no("mossa sconosciuta");
}
```

### Le mosse, in parole

| Mossa | Quando vale | Cosa succede |
|---|---|---|
| `segna` (pipistrello, shottino, valore?) | fase `assegna` | accende/spegne una casella (`valore` assente = inverte). Mai un errore. |
| `cancella` | fase `assegna` | svuota la griglia. Mai un errore. |
| `assaggia` | fase `assegna`, almeno una casella segnata | passa l'ora: si decide il veleno, si calcolano verdi e gruppo, fase `indica`. Le caselle restano bloccate fino al giro dopo. |
| `indica` (shottino) | fase `indica` | giusto → risolto. Sbagliato → **errore**, giro + 1, si torna ad `assegna` con le caselle di prima. |

- **Errore** (l'unico, come da scheda): indicare lo shottino sbagliato, compreso indicarne uno fra gli indistinguibili. Si chiama `g.errore(esito.motivo)`, cioè con il testo esatto `Sbagliato: il veleno era nello shottino N` (N = `veleno + 1`). Il kit toglie le dorate (una ogni 2 errori, minimo 1).
- **Mosse impossibili** (`valida: false`, nessun errore, nessun cambio di stato): `assaggia` con la griglia vuota, `segna`/`cancella`/`assaggia` dopo l'ora, `indica` prima dell'ora, indici fuori dalla griglia, tipi sconosciuti.
- **Risolto**: `indica` dello shottino giusto quando il gruppo ha un solo shottino. Si chiama `g.risolto({ riepilogo, ritardo: 1600 })`.
- **Limiti**: nessuno. I giri sono illimitati; ogni giro sbagliato costa un errore e sposta il veleno (`ordine[giro % 16]`), quindi sapere dov'era il veleno del giro prima non aiuta.

### Persistenza (contro i trucchi col ricaricamento)

Dopo **ogni** mossa valida salva tutto lo stato logico in `g.memoria.stato` e chiama `g.salvaMemoria()`. All'avvio, se `g.memoria.stato` esiste ed è ben formato (array di 16 interi 0..15, fase nota), riparti da lì **senza animazioni**: chi ricarica la pagina dopo l'ora si ritrova alla scelta dello shottino, con gli stessi verdi, e non può correggere gratis una griglia sbagliata. La selezione dello shottino (vedi sotto) non si salva.

### Animazioni e logica

`gioca` e i bottoni applicano la mossa **subito** (lo stato cambia nello stesso istante), poi parte l'animazione. Le animazioni non bloccano mai `gioca`: se arriva una mossa durante un'animazione, l'animazione in corso salta al suo stato finale e parte quella nuova.

Le animazioni **che bloccano l'interfaccia** sono solo tre: «assaggio + un'ora» (2700 ms), «scelta sbagliata» (1600 ms) e «vittoria». Durante queste i tocchi sulla scena sono ignorati e i bottoni sono disabilitati. La caduta della goccia quando si segna una casella è solo decorazione: non blocca niente.

---

## 4. Interfaccia

### Tocchi (`g.tocca`), coordinate della scena

Geometria (la usa anche la verifica, va rispettata al pixel):

- colonna `j` (shottino): `x` da `40 + 17·j` a `56 + 17·j` (17 px), centro `cx(j) = 47 + 17·j`;
- riga `i` (pipistrello): `y` da `26 + 18·i` a `43 + 18·i` (18 px), centro `cy(i) = 34 + 18·i`;
- **casella (i, j)**: il rettangolo intersezione (17 × 18, senza buchi fra una casella e l'altra); griglia intera `x ∈ [40, 312)`, `y ∈ [26, 98)`;
- **zona shottino j** (fase `indica`): tutta la colonna, `x ∈ [40 + 17·j, 57 + 17·j)`, `y ∈ [26, 131)` (caselle + bicchiere + targhetta);
- **zona pipistrello i**: `x ∈ [4, 37)`, `y` della riga `i`.

Comportamento:

- **Fase `assegna`**
  - `giu` su una casella: calcola `valore = !(acceso)`, gioca `segna` con quel valore e comincia un **trascinamento** che ricorda il valore e le caselle già toccate.
  - `muovi` con `premuto` durante il trascinamento: ogni casella nuova sotto il dito (di qualunque riga) riceve `segna` con lo stesso valore. Così si «dipinge» una riga intera in un gesto.
  - `su`: fine del trascinamento.
  - `giu` su uno shottino o una targhetta (`x ∈ [40, 312)`, `y ∈ [98, 131)`): niente mossa, messaggio «Prima decidi gli assaggi, poi premi Fai assaggiare.»
  - `giu` su un pipistrello: niente mossa, messaggio con il suo conto (vedi sotto).
  - `muovi` senza `premuto` (mouse sopra la scena): evidenzia la casella sotto il puntatore.
- **Fase `indica`**
  - `giu` nella zona di uno shottino: lo **seleziona** (solo interfaccia, non è una mossa: `selezionato = j`) e abilita **Indica**. Toccarne un altro sposta la selezione. Non c'è conferma col doppio tocco.
  - `giu` su un pipistrello: messaggio «Il pipistrello NOME è diventato verde.» oppure «Il pipistrello NOME sta benissimo.»
  - `muovi` senza `premuto`: facoltativo, cornice sottile `C.pietraChiara` attorno alla colonna sotto il puntatore.
- Durante le animazioni (assaggio + ora, errore, vittoria) i tocchi sono ignorati.

### Bottoni (`g.bottone`), creati una volta sola nell'ordine qui sotto

| Etichetta | `id` (data-azione) | `forte` | Visibile | Abilitato | Azione |
|---|---|---|---|---|---|
| Fai assaggiare | `assaggia` | sì | fase `assegna` | fuori dalle animazioni | mossa `assaggia` |
| Cancella | `cancella` | no | fase `assegna` | fuori dalle animazioni | mossa `cancella` |
| Indica | `indica` | sì | fase `indica` | con uno shottino selezionato, fuori dalle animazioni | mossa `indica` con `selezionato` |

Mostra/nascondi con la proprietà `hidden` del bottone (il kit ha già `.kit-btn[hidden]`), abilita con `disabled`. Dopo la vittoria li disabilita il kit.

### Messaggi del fumetto (`g.messaggio`), testi esatti

`NOME` è `NOMI[i]`; `N` è il numero della targhetta (`j + 1`); `LISTA` sono i nomi uniti con «, » e « e » prima dell'ultimo («rosso», «rosso e giallo», «rosso, giallo e azzurro»).

| Quando | Testo |
|---|---|
| Avvio in fase `assegna` (anche ripresa da memoria) | `Tocca le caselle: ogni riga dice cosa assaggia quel pipistrello.` |
| Dopo ogni `segna` (da tocco o trascinamento), e tocco su un pipistrello in fase `assegna` | `Pipistrello NOME: K shottini da assaggiare.` · con K = 1: `Pipistrello NOME: 1 shottino da assaggiare.` · con K = 0: `Pipistrello NOME: niente da assaggiare.` |
| Tocco su uno shottino in fase `assegna` | `Prima decidi gli assaggi, poi premi Fai assaggiare.` |
| `cancella` | `Caselle vuote: nessuno assaggia niente.` |
| `assaggia` rifiutata (griglia vuota) | `Nessuno assaggia niente: segna prima qualche casella.` |
| `assaggia` accettata, durante l'animazione | `I pipistrelli assaggiano. Ora si aspetta un'ora...` |
| Fine dell'ora (e ripresa da memoria in fase `indica`), gruppo di 1 | 0 verdi: `Nessuno è diventato verde. Tocca lo shottino avvelenato.` · 1 verde: `Verde: NOME. Tocca lo shottino avvelenato.` · 2+ verdi: `Verdi: LISTA. Tocca lo shottino avvelenato.` |
| Fine dell'ora, gruppo di 2 | `Shottini A e B: stessi assaggiatori, non si distinguono.` |
| Fine dell'ora, gruppo di 3 | `Shottini A, B e C: stessi assaggiatori, non si distinguono.` |
| Fine dell'ora, gruppo di 4 o più | `K shottini hanno gli stessi assaggiatori: non si distinguono.` |
| Selezione di uno shottino | `Shottino N: premi Indica se è quello avvelenato.` |
| `indica` sbagliata (subito, insieme a `g.errore`) | `Nuovo giro: antidoto ai pipistrelli e veleno in un altro shottino.` |
| `indica` giusta | `Giusto: il veleno era nello shottino N!` |
| Avvio con `g.giaRisolto` | `Lo shottino avvelenato era il N.` |

`A`, `B`, `C` sono le targhette degli shottini del gruppo in ordine crescente.

### Riepilogo della vittoria (`g.risolto({ riepilogo, ritardo: 1600 })`)

Due paragrafi separati da `\n`. Primo paragrafo secondo i verdi dello shottino giusto:

- 0 verdi: `Il veleno era nello shottino N: nessun pipistrello l'aveva assaggiato, ed era l'unico senza assaggiatori.`
- 1 verde: `Il veleno era nello shottino N: l'aveva assaggiato solo il pipistrello NOME, e nessun altro shottino aveva solo lui.`
- 2+ verdi: `Il veleno era nello shottino N: l'avevano assaggiato i pipistrelli LISTA, e nessun altro shottino aveva proprio quegli assaggiatori.`

Secondo paragrafo, sempre: `Con quattro pipistrelli i gruppi di assaggiatori possibili sono 16, compreso nessuno: uno per shottino.`

---

## 5. Grafica

`EscapeDemo.avvia({ id: "shottino-avvelenato", sfondo: "sala-bar", velo: 0.55, variante, crea })`.

Lo sfondo ha le bottiglie sui due ripiani ai lati, l'insegna BAR al neon in alto al centro, lo specchio dietro il bancone e il piano del bancone a `y = 112…117` (il davanti del bancone parte da `y = 118`). Il rompicapo copre il muro con la griglia, appoggia gli shottini **sul** piano (base a `y = 111`) e appende le targhette d'ottone **al bordo** del bancone. A sinistra volano i quattro pipistrelli, uno per riga.

### Disposizione (tutto a coordinate intere)

```
y 18-24   "?" sopra le colonne indistinguibili (solo dopo l'ora, gruppo ≥ 2)
y 25      bordo alto delle cornici di colonna
y 26-97   griglia 4 × 16: riga i da y = 26+18i, alta 18; colonna j da x = 40+17j, larga 17
          pipistrello i: sprite 25×16 in (6, 26+18i)
          binario della riga i: da x 33 a x 312, righe y = 26+18i + 6…9
y 98      bordo basso delle cornici di colonna
y 100-111 shottino j: sprite 11×12 in (cx(j) − 5, 100); selezionato 2 px più su (y 98)
y 112     ombra dello shottino: rett(C.legno, cx(j) − 3, 112, 9, 1)
y 119-129 targhetta j: 15×11 in (cx(j) − 7, 119) con il numero j + 1
```

Ordine di disegno a ogni fotogramma: `clearRect` → binari → caselle (gocce e anelli) → evidenziazione della casella sotto il mouse → cornici di colonna → «?» → pipistrelli (con bolle e sbuffi) → shottini con ombra → targhette → effetti della vittoria → velo dell'ora.

### Colori dei pipistrelli

| i | NOME | `p` (fiocco chiaro) | `q` (fiocco scuro) | goccia `h` | goccia `p` | goccia `q` |
|---|---|---|---|---|---|---|
| 0 | rosso | `C.tappetoChiaro` | `C.tappeto` | `GEMME.rubino[2]` | `C.tappetoChiaro` | `C.tappeto` |
| 1 | giallo | `C.giallo` | `C.oroScuro` | `C.bianco` | `C.giallo` | `C.oroScuro` |
| 2 | azzurro | `GEMME.zaffiro[2]` | `GEMME.zaffiro[1]` | `GEMME.zaffiro[2]` | `GEMME.zaffiro[1]` | `GEMME.zaffiro[0]` |
| 3 | bianco | `C.bianco` | `C.pietra` | `C.bianco` | `C.pietraChiara` | `C.pietra` |

(`GEMME` è `EscapeDemo.GEMME`: tutti i colori sono della paletta o delle pietre.) Il fiocco tiene il colore anche quando il pipistrello diventa verde: è la sua identità.

### Sprite del pipistrello (25 × 16), due pose

Lettere: `k` contorno, `m` membrana delle ali, `M` bordo d'attacco dell'ala, `g` corpo, `G` luce sul corpo, `d` ombra del corpo, `r` interno delle orecchie, `y` occhi, `w` zanne, `p`/`q` fiocco.

```js
const PIP_SU = [
  ".kk......k.....k......kk.",
  "kMMkk...kgk...kgk...kkMMk",
  "kmmMMkk.krkkkkkrk.kkMMmmk",
  "kmmmmMMkkGGggggdkkMMmmmmk",
  "kmmmmmmMmGyygyydmMmmmmmmk",
  ".kkmmmmmmgykgkydmmmmmmkk.",
  "...kmmmmmggggggdmmmmmk...",
  "...kmkmmmggkkkgdmmmkmk...",
  "....k.kmmggwgwgdmmk.k....",
  "......kmmggggggdmmk......",
  ".......kkppgggpqkk.......",
  "........kpppqppqk........",
  "........kpqgggqqk........",
  ".........kggggdk.........",
  "..........kggdk..........",
  "...........kkk...........",
];
const PIP_GIU = [
  ".........k.....k.........",
  "........kgk...kgk........",
  "........krkkkkkrk........",
  "....kkkkkGGggggdkkkkk....",
  "..kkMMMMmGyygyydmMMMMkk..",
  ".kMMmmmmmgykgkydmmmmmMMk.",
  "kMmmmmmmmggggggdmmmmmmmMk",
  "kmmmmmmmmggkkkgdmmmmmmmmk",
  "kmmmmmmmmggwgwgdmmmmmmmmk",
  "kmmmmmmmmggggggdmmmmmmmmk",
  "kmkkmmmmkppgggpqkmmmmkkmk",
  ".k.kmkkkkpppqppqkkkkmk.k.",
  "....k...kpqgggqqk...k....",
  ".........kggggdk.........",
  "..........kggdk..........",
  "...........kkk...........",
];
```

| Lettera | Sano | Verde (avvelenato) |
|---|---|---|
| `k` | `C.bordo` | `C.bordo` |
| `m` | `C.ferro` | `C.erbaScura` |
| `M` | `C.ferroChiaro` | `C.erba` |
| `g` | `C.ferroChiaro` | `C.erba` |
| `G` | `C.pietra` | `C.erbaChiara` |
| `d` | `C.ferro` | `C.erbaScura` |
| `r` | `C.tappeto` | `C.erbaScura` |
| `y` | `C.giallo` | `C.bianco` (occhi sbarrati) |
| `w` | `C.bianco` | `C.bianco` |
| `p`, `q` | colori del pipistrello | colori del pipistrello |

Animazione (a 8 fps, `g.fotogramma`), con `f = (g.fotogramma + 3·i) % 4`:

- **sano**: `f` 0–1 → `PIP_SU`, 2–3 → `PIP_GIU`; spostamento verticale `dy = f === 1 ? −1 : f === 3 ? 1 : 0`;
- **verde**: sempre `PIP_GIU`, `dy = 1 + ((g.fotogramma >> 1) + i) % 2` (ondeggia piano, più in basso); due bollicine che salgono sopra la testa: per `b` = 0, 1, `fase = (g.fotogramma + 3·b + i) % 6`, posizione `x = 24 + 4·b`, `y = 26 + 18·i + 1 − fase`; la bolla 0 è 1×1 `C.erbaChiara`, la bolla 1 è 2×2 `C.erbaChiara` con il pixel in alto a sinistra `C.bianco`; non disegnarla quando `fase === 5`;
- **festa** (dopo la vittoria, solo durante l'animazione della vittoria): come sano ma con `f = (2·g.fotogramma + 3·i) % 4`;
- con `g.riduciMovimento`: sempre `PIP_GIU`, `dy = 0` (verde: `dy = 1`), niente bolle.

**Sbuffo** (quando un pipistrello diventa verde, o torna sano con l'antidoto): due fotogrammi di 8 pixel attorno al centro `(18, cy(i))`. Fotogramma 1: offset `(±13, 0)`, `(0, ±10)`, `(±9, ±7)`; fotogramma 2: `(±16, 0)`, `(0, ±12)`, `(±12, ±9)`. Colori: diventa verde → `C.erbaChiara` poi `C.erba`; antidoto → `C.bianco` poi `C.pietraChiara`. Con `g.riduciMovimento` niente sbuffo.

### Binario della riga

Per la riga `i` con `y = 26 + 18·i`:

```js
rett(ctx, C.bordo, 33, y + 6, 280, 4);
rett(ctx, chiaro, 33, y + 7, 279, 1);
rett(ctx, scuro, 33, y + 8, 279, 1);
```

`chiaro`/`scuro` = `C.ferroChiaro`/`C.ferro`; quando il pipistrello della riga è verde, `C.erbaChiara`/`C.erba`. Così a colpo d'occhio si vede quali righe contano.

### Caselle: goccia (segnata) e anello (vuota)

La **goccia** (11 × 14) è disegnata in `(40 + 17·j + 2, 26 + 18·i + 1)` con i colori della riga (`k` = `C.bordo`, `W` = `C.bianco`, `h`/`p`/`q` dalla tabella dei colori). L'**anello** vuoto (7 × 7) va in `(40 + 17·j + 4, 26 + 18·i + 5)` con `k` = `C.bordo`, `e` = `C.tetto`, `r` = `C.ferroChiaro`.

```js
const GOCCIA = [
  ".....k.....",
  "....khk....",
  "....khk....",
  "...khppk...",
  "..khhpppk..",
  "..khppppk..",
  ".khhpppppk.",
  "khhWpppppqk",
  "khhpppppqqk",
  "khpppppqqqk",
  "kpppppqqqqk",
  ".kpppqqqqk.",
  "..kpqqqqk..",
  "...kkkkk...",
];
const ANELLO = [
  ".kkkkk.",
  "keeeeek",
  "keeeerk",
  "keeeerk",
  "keeeerk",
  "kerrrrk",
  ".kkkkk.",
];
```

- Quando una casella si accende, la goccia «cade» al suo posto: 3 px più in alto, poi 1 px, poi a posto (circa 50 ms per passo). Quando si spegne sparisce subito e torna l'anello. Con `g.riduciMovimento`, subito a posto.
- **Casella sotto il mouse** (fase `assegna`, fuori dalle animazioni): cornice di 1 px `C.bianco` sul rettangolo 15 × 16 in `(40 + 17·j, 26 + 18·i)`.

### Cornici di colonna e «?»

Cornice di 1 px (solo il contorno) sul rettangolo 17 × 74 in `(39 + 17·j, 25)`: comprende le quattro caselle della colonna, non lo shottino.

- **Selezionato** (fase `indica`): `C.giallo`.
- **Indistinguibili** (fase `indica` con gruppo di 2 o più): `C.fiamma` su ogni colonna del gruppo, e un `?` con `testo(ctx, "?", cx(j), 18, { colore: C.fiamma, allinea: "centro" })`. Se una colonna del gruppo è anche selezionata vince il giallo, il `?` resta. Con un gruppo di 1 niente cornici arancioni (sarebbe la soluzione).
- **Vittoria**: la colonna dello shottino giusto in `C.oro`, e resta così.

### Lo shottino (11 × 12) e la targhetta

Lettere: `k` contorno, `s` vetro chiaro, `S` riflesso, `e` vetro vuoto, `B` vetro in ombra, `b` base, `L` superficie del liquido, `l` liquido, `d` liquido in ombra.

```js
const SHOT = [            // pieno (fase assegna)
  "kkkkkkkkkkk",
  "ksSeeeeeeBk",
  "ksSeeeeeeBk",
  "ksLLLLLLLBk",
  "ksSllllldBk",
  "ksSllllldBk",
  ".kslllldBk.",
  ".kslllldBk.",
  ".ksllldddk.",
  ".kssssssBk.",
  ".kbbbbbbBk.",
  ".kkkkkkkkk.",
];
const SHOT_BEVUTO = [     // dopo l'assaggio: un goccio in meno
  "kkkkkkkkkkk",
  "ksSeeeeeeBk",
  "ksSeeeeeeBk",
  "ksSeeeeeeBk",
  "ksLLLLLLLBk",
  "ksSllllldBk",
  ".kslllldBk.",
  ".kslllldBk.",
  ".ksllldddk.",
  ".kssssssBk.",
  ".kbbbbbbBk.",
  ".kkkkkkkkk.",
];
const TESCHIETTO = [".www.", "wkwkw", "wwwww", ".w.w."]; // sul vetro dello shottino avvelenato
```

| Lettera | Normale | Avvelenato (svelato) |
|---|---|---|
| `k` | `C.bordo` | `C.bordo` |
| `s` / `S` / `e` / `B` / `b` | `C.pietraChiara` / `C.bianco` / `C.tetto` / `C.ferroChiaro` / `C.pietra` | uguali |
| `L` | `C.lilla` | `C.erbaChiara` |
| `l` | `C.viola` | `C.erba` |
| `d` | `C.violaScuro` | `C.erbaScura` |

- In fase `assegna` tutti `SHOT`. In fase `indica` e `risolto`, `SHOT_BEVUTO` per gli shottini con almeno un assaggiatore (`assaggi[j] !== 0`), `SHOT` per gli altri.
- **Selezionato**: `k` = `C.giallo` e 2 px più in alto.
- **Scelta sbagliata**: `k` = `C.tappetoChiaro` e tremolio orizzontale (`x` ±1 alternato) per 4 fotogrammi.
- **Avvelenato svelato** (dopo un errore lo shottino di `esito.veleno`; alla vittoria quello giusto): colori «avvelenato» e `TESCHIETTO` in `(cx(j) − 2, 105)` con `w` = `C.pietraChiara`, `k` = `C.erbaScura`.
- Ombra: `rett(ctx, C.legno, cx(j) − 3, 112, 9, 1)`.

Targhetta d'ottone appesa al bancone, in `x = cx(j) − 7`:

```js
rett(ctx, C.bordo, x, 119, 15, 11);
rett(ctx, C.oro, x + 1, 120, 13, 9);
rett(ctx, C.giallo, x + 1, 120, 13, 1);
rett(ctx, C.oroScuro, x + 1, 128, 13, 1);
testo(ctx, String(j + 1), cx(j), 121, { colore: C.bordo, ombra: null, allinea: "centro" });
```

### Animazione «assaggio + un'ora» (dopo `assaggia`, 2700 ms in tutto)

Contando da quando parte la mossa (`t` in ms):

1. **0–800, gli assaggi.** Una passata da sinistra a destra, 50 ms per colonna: quando tocca alla colonna `j` (`Math.floor(t / 50) === j`), le sue gocce scendono di 1 px e il loro `W` e `h` diventano `C.bianco` (un lampo); da quel momento, se `assaggi[j] !== 0`, lo shottino `j` passa a `SHOT_BEVUTO`.
2. **800–1000.** Pausa.
3. **1000–2400, un'ora.** Velo notturno sull'area 0, 16, 320, 138: `rett` di `C.nero` con `globalAlpha` 0.36 nei primi 125 ms, poi 0.72, e di nuovo 0.36 negli ultimi 125 ms (lo stesso sistema del velo del kit; rimetti `globalAlpha = 1` subito dopo). Sopra il velo, la clessidra con `scala: 2` in `(149, 46)` e la scritta `UN'ORA DOPO...` con `testo(ctx, "UN'ORA DOPO...", 160, 82, { colore: C.fiammaChiara, allinea: "centro" })`. I fotogrammi della clessidra vanno avanti una volta sola: `F0` → `F3`, uno ogni 350 ms.
4. **2400–2700, chi è verde.** A 2400 ms i pipistrelli dei verdi passano ai colori verdi con lo sbuffo, i loro binari diventano verdi, compaiono le cornici arancioni e i `?` se il gruppo ha 2 o più shottini, e il fumetto mostra il messaggio di fine ora. A 2700 ms l'animazione finisce e si possono toccare gli shottini.

I bottoni seguono subito la fase logica: appena giocata `assaggia` spariscono **Fai assaggiare** e **Cancella** e compare **Indica**, disabilitato; si abilita solo dopo i 2700 ms e con uno shottino selezionato. Il messaggio `I pipistrelli assaggiano. Ora si aspetta un'ora...` va mostrato subito. Con `g.riduciMovimento` si salta tutto e si mostra subito lo stato finale (shottini bevuti, verdi, cornici, messaggio di fine ora).

Clessidra (11 × 15, poi `scala: 2`): `k` = `C.bordo`, `L` = `C.legnoLuce`, `s` = `C.pietraChiara`, `B` = `C.ferroChiaro`, `a` = `C.fiammaChiara` (sabbia), `e` = `C.tetto`.

```js
const CLESSIDRA = [
  [ // F0
    "kkkkkkkkkkk", "kLLLLLLLLLk", "kkkkkkkkkkk",
    ".ksaaaaaBk.", ".ksaaaaaBk.", "..ksaaaBk..", "...ksaBk...", "....kak....",
    "...ksaBk...", "..kseaeBk..", ".kseeaeeBk.", ".kseeaeeBk.",
    "kkkkkkkkkkk", "kLLLLLLLLLk", "kkkkkkkkkkk",
  ],
  [ // F1
    "kkkkkkkkkkk", "kLLLLLLLLLk", "kkkkkkkkkkk",
    ".kseeeeeBk.", ".ksaaaaaBk.", "..ksaaaBk..", "...ksaBk...", "....kak....",
    "...ksaBk...", "..kseaeBk..", ".kseeaeeBk.", ".kseaaaeBk.",
    "kkkkkkkkkkk", "kLLLLLLLLLk", "kkkkkkkkkkk",
  ],
  [ // F2
    "kkkkkkkkkkk", "kLLLLLLLLLk", "kkkkkkkkkkk",
    ".kseeeeeBk.", ".kseeeeeBk.", "..ksaaaBk..", "...ksaBk...", "....kak....",
    "...ksaBk...", "..kseaeBk..", ".kseaaaeBk.", ".ksaaaaaBk.",
    "kkkkkkkkkkk", "kLLLLLLLLLk", "kkkkkkkkkkk",
  ],
  [ // F3
    "kkkkkkkkkkk", "kLLLLLLLLLk", "kkkkkkkkkkk",
    ".kseeeeeBk.", ".kseeeeeBk.", "..kseaeBk..", "...ksaBk...", "....kak....",
    "...ksaBk...", "..kseaeBk..", ".ksaaaaaBk.", ".ksaaaaaBk.",
    "kkkkkkkkkkk", "kLLLLLLLLLk", "kkkkkkkkkkk",
  ],
];
```

### Animazione «scelta sbagliata» (1600 ms)

Subito: `g.errore(esito.motivo)` e il messaggio del nuovo giro. Nella scena restano per 1600 ms i verdi, le cornici arancioni e gli shottini bevuti dell'ora appena passata (anche se lo stato logico è già tornato ad `assegna`):

- **0–500**: lo shottino scelto trema con il contorno `C.tappetoChiaro`;
- **0–1600**: lo shottino di `esito.veleno` è svelato (liquido verde e teschietto);
- **1200**: sbuffo dell'antidoto sui pipistrelli verdi, che tornano sani;
- **1600**: tutto torna all'aspetto della fase `assegna` (shottini pieni, binari grigi, niente cornici), bottoni **Fai assaggiare** e **Cancella** di nuovo abilitati.

Con `g.riduciMovimento`: subito l'aspetto finale.

### Animazione «vittoria» (poi stato finale)

Subito: messaggio di vittoria e `g.risolto({ riepilogo, ritardo: 1600 })`.

- Lo shottino giusto è svelato (liquido verde e teschietto), resta 2 px più su con il contorno `C.oro`; la sua colonna ha la cornice `C.oro`.
- **0–1000**: un vapore a forma di teschio sale dallo shottino: `TESCHIO` (9 × 9) in `(cx(j) − 4, y)` con `y` da 88 a 40, 6 px più su ogni 125 ms, poi sparisce. Colori: `k` = `C.bordo`, `w` = `C.erbaChiara`, `s` = `C.erba`.
- Bollicine verdi che escono dallo shottino: 3 pixel `C.erbaChiara` in `x = cx(j) − 2, cx(j), cx(j) + 2`, che salgono da `y = 97` di 1 px a fotogramma, sfasati, e ripartono dopo 5 px.
- Stelline `STELLA` (5 × 5, `w` = `C.giallo`, `W` = `C.bianco`) in `(cx(j) − 14, 92)`, `(cx(j) + 10, 104)` e `(cx(j) + 9, 40)`, accese a turno (ognuna visibile 2 fotogrammi su 6). Continuano anche dopo, nello stato finale.
- **700**: sbuffo dell'antidoto sui pipistrelli verdi, che tornano sani; poi tutti i pipistrelli sbattono le ali al doppio della velocità fino a 1600 ms.

```js
const TESCHIO = [
  "..kkkkk..",
  ".kwwwwwk.",
  "kwwwwwwsk",
  "kwkkwkksk",
  "kwkkwkksk",
  "kwwwkwwsk",
  ".kwwwwsk.",
  "..kwkwk..",
  "...kkk...",
];
const STELLA = ["..w..", "..w..", "wwWww", "..w..", "..w.."];
```

**Stato finale** (dopo l'animazione e con `g.giaRisolto` se `g.memoria.stato` ha `fase: "risolto"`): griglia con le gocce di quell'assegnazione, binari grigi, pipistrelli sani che sbattono le ali normalmente, shottini bevuti dove assaggiati, lo shottino `veleno` svelato (liquido verde e teschietto), 2 px più su con il contorno `C.oro`, e la cornice `C.oro` sulla sua colonna, stelline accese a turno (senza stelline con `g.riduciMovimento`). Se `g.giaRisolto` ma la memoria non c'è, mostra lo stato iniziale (griglia vuota) e nessun messaggio.

### Decorazioni

Nient'altro: lo sfondo ha già bottiglie, neon e lo scheletro barista (che resta in parte visibile dietro le righe 3 e 4: va bene così). Niente note fisse né scritte oltre a quelle elencate.

---

## 6. Aggancio per le prove

```js
g.espone({
  gioca: (m) => mossa(m),            // la stessa funzione usata da tocchi e bottoni
  statoGioco: () => ({ ... }),
  cella: (i, j) => ({ x: 47 + 17 * j, y: 34 + 18 * i }),
  shottino: (j) => ({ x: 47 + 17 * j, y: 105 }),
});
```

- **`gioca(mossa)`**: una mossa fra
  - `{ tipo: "segna", pipistrello: 0..3, shottino: 0..15, valore: true | false }` (`valore` facoltativo: senza, inverte);
  - `{ tipo: "cancella" }`;
  - `{ tipo: "assaggia" }`;
  - `{ tipo: "indica", shottino: 0..15 }`.

  Applica la mossa con `applica`, salva la memoria, aggiorna messaggi e bottoni, chiama `g.errore` / `g.risolto` quando serve, fa partire l'animazione, e **ritorna l'esito di `applica` così com'è**:
  - `{ ok: true }` (segna, cancella);
  - `{ ok: true, verdi: [indici dei pipistrelli verdi, crescenti], indistinguibili: [indici degli shottini, crescenti] }` (assaggia);
  - `{ errore: true, motivo: "Sbagliato: il veleno era nello shottino N", veleno: k }` (indica sbagliata);
  - `{ risolto: true, veleno: j }` (indica giusta);
  - `{ valida: false, motivo: "..." }` (mossa impossibile).

  `gioca` funziona anche durante le animazioni. Una `segna` che non cambia niente (casella già in quello stato) è comunque `{ ok: true }`.
- **`statoGioco()`**:

  ```js
  {
    fase: "assegna" | "indica" | "risolto",
    giro: 0,
    assaggi: [16 interi 0..15],
    verdi: null | [indici dei pipistrelli verdi, crescenti],   // bitAccesi(stato.verdi)
    indistinguibili: null | [indici degli shottini, crescenti], // stato.gruppo
    selezionato: null | j,                                      // la selezione dell'interfaccia in fase indica
    veleno: null | j,                                           // solo in fase risolto
  }
  ```

  `selezionato` torna `null` dopo ogni `assaggia` e ogni `indica`.
- **`cella(i, j)`**, **`shottino(j)`**: facoltative, i centri da toccare (la verifica usa le stesse coordinate scritte in §4).

---

## 7. Criteri di accettazione

Giocando e guardando le foto di `node demo/comune/prova.mjs shottino-avvelenato` (deve finire con «TUTTO OK»):

1. Si capisce a colpo d'occhio che le righe sono i pipistrelli (ognuno col suo fiocco colorato e le gocce dello stesso colore) e le colonne gli shottini sotto, numerati da 1 a 16 sulle targhette.
2. Sul telefono in orizzontale ogni casella si tocca senza sbagliare quella accanto; trascinare lungo una riga la segna tutta.
3. Le gocce sono più chiare e sature dello sfondo; le caselle vuote si vedono come anelli scuri sul binario, senza confondersi con le bottiglie dietro.
4. Dopo **Fai assaggiare**: lampo delle gocce da sinistra a destra, shottini assaggiati con un goccio in meno, velo scuro con clessidra e «UN'ORA DOPO...», poi i pipistrelli giusti diventano verdi (corpo verde, occhi bianchi, bollicine, binario verde) e il fiocco resta del suo colore.
5. Con due shottini uguali compaiono le cornici arancioni con il «?» sulle colonne gemelle e il messaggio dice quali sono; con una griglia giusta nessuna cornice arancione.
6. Lo shottino selezionato si alza di 2 px con contorno e cornice di colonna gialli; **Indica** è disabilitato finché non se ne seleziona uno.
7. Lo sbaglio mostra il tremolio rosso, lo shottino avvelenato col teschietto, l'antidoto, e torna alla griglia di prima pronta per un altro giro; le dorate in palio scendono a 3 al secondo errore.
8. La vittoria mostra il teschio di vapore che sale, le bollicine, le stelline e la cornice d'oro; la carta arriva dopo circa 1,6 s e ricaricando la scena resta quella finale.
9. Ricaricando la pagina dopo l'ora si resta alla scelta dello shottino con gli stessi verdi; ricaricando a metà griglia le gocce segnate ci sono ancora.
10. Con `prefers-reduced-motion` niente ali che sbattono, niente bolle né stelline, e ogni animazione salta subito allo stato finale.
11. Nessun testo fuori da quelli elencati; nessun colore fuori dalla paletta e dalle pietre (a parte le mescolanze del velo dell'ora, fatte con `globalAlpha` come il velo del kit).
