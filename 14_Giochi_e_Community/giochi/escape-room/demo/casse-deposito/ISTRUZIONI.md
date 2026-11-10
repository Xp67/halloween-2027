# I bauli del deposito: istruzioni per la demo

Rompicapo `casse-deposito`, stanza **Deposito**, 4 caramelle dorate, una in meno ogni 2 errori. Il genere è quello delle casse da spingere: una pianta vista dall'alto, Zucco che cammina e spinge i bauli uno alla volta, quattro segni di gesso da coprire.

Leggi prima `../REGOLE_COMUNI.md`, `../comune/kit.js` e `../_esempio/`. Qui c'è solo quello che è specifico di questo rompicapo. `verifica.mjs` (già scritta) controlla alla lettera il formato descritto nella sezione 6.

---

## 1. In breve

- Il giocatore guida **Zucco** sulla pianta del deposito (10×9 caselle, muri compresi). Tocca il pavimento per camminare e tocca un baule accanto a Zucco per **spingerlo** di una casella. I bauli non si tirano e se ne spinge uno solo per volta.
- Si vince quando **tutti e quattro i bauli sono sui quattro segni di gesso**, in qualsiasi ordine: ogni baule va bene su ogni segno.
- «Annulla» toglie gratis l'**ultima** spinta, ma solo quella. **Ricominciare il livello è l'unico errore** (scheda: «Conta come errore: ricominciare il livello»). Non c'è limite di spinte.

---

## 2. Variante

### Il generatore

Ci sono **8 livelli** già verificati, tutti 10×9 con 4 bauli e 4 segni. Il primo è quello della scheda. Gli altri sette vengono dallo stesso generatore della scheda, che parte dai bauli sui segni e li tira all'indietro, e sono stati ricontrollati con due ricerche in avanti indipendenti: chiedono da 40 a 44 spinte nel modo migliore. Ogni livello si può specchiare in 4 modi, e lo specchio non cambia il numero di spinte. In tutto fanno 32 varianti.

Copia questa lista **identica**, con lo stesso ordine e gli stessi spazi: `verifica.mjs` ne ha una copia e confronta la variante carattere per carattere.

Legenda: `#` muro, spazio pavimento, `$` baule, `.` segno di gesso, `@` Zucco. Non ci sono `*` (baule già sul segno) né `+` (Zucco sul segno).

```js
const LIVELLI = [
  { spinte: 43, pianta: ["##########", "#    #. ##", "# $#    ##", "#@$  #   #", "# $#     #", "##      ##", "##$     .#", "#      ..#", "##########"] },
  { spinte: 42, pianta: ["##########", "#.     ###", "## .  #@##", "# . # #$ #", "#    #  ##", "#  # #$  #", "##  $$   #", "## .    ##", "##########"] },
  { spinte: 44, pianta: ["##########", "##  #   ##", "#  ## $$##", "#  @$    #", "#  . #   #", "#  #. #$ #", "#  # #   #", "#  . .# ##", "##########"] },
  { spinte: 40, pianta: ["##########", "#    #@  #", "#  # $$$ #", "##  #  ###", "# .  #  ##", "# .#   $ #", "#        #", "#..   #  #", "##########"] },
  { spinte: 44, pianta: ["##########", "# . #    #", "# @$#    #", "# $$ #.  #", "#    ## ##", "#       ##", "# $##. . #", "#        #", "##########"] },
  { spinte: 41, pianta: ["##########", "###  @## #", "#  # $   #", "#  ## $$ #", "#.#   #  #", "#.  . #$ #", "#  #    ##", "# .      #", "##########"] },
  { spinte: 41, pianta: ["##########", "# #   . ##", "#.   . $ #", "###  ##  #", "### #   ##", "##@$ $$. #", "## #  #  #", "#   #    #", "##########"] },
  { spinte: 41, pianta: ["##########", "###  . # #", "#     .. #", "##$    # #", "##    ####", "#  .## # #", "# $$$    #", "# #@ #   #", "##########"] },
];
const SPECCHI = ["nessuno", "orizzontale", "verticale", "entrambi"];
```

La variante (deve dipendere solo da `rng`; **l'ordine delle due estrazioni conta**):

```js
variante(rng) {
  const i = EscapeDemo.intero(rng, 0, LIVELLI.length - 1); // prima il livello
  const s = EscapeDemo.intero(rng, 0, 3);                  // poi lo specchio
  let pianta = [...LIVELLI[i].pianta];
  if (s === 1 || s === 3) pianta = pianta.map((r) => [...r].reverse().join("")); // orizzontale: ogni riga al contrario
  if (s === 2 || s === 3) pianta = pianta.reverse();                             // verticale: righe in ordine inverso
  return { livello: i + 1, specchio: SPECCHI[s], spinteMinime: LIVELLI[i].spinte, pianta };
}
```

Il formato esatto dell'oggetto `variante` è `{ livello: 1…8, specchio: "nessuno" | "orizzontale" | "verticale" | "entrambi", spinteMinime: numero, pianta: [9 stringhe da 10 caratteri] }`. Nient'altro dentro, perché il kit la pubblica in `window.__demo.variante` e la prova la confronta.

### Coordinate

Una casella è `[x, y]`: `x` è la colonna (0…9) e `y` la riga (0…8) della pianta **già specchiata**, con `[0, 0]` in alto a sinistra. L'anello esterno (righe 0 e 8, colonne 0 e 9) è sempre muro e diventa la cornice disegnata. Le caselle «vere» vanno da `x` 1 a 8 e da `y` 1 a 7. Dentro possono esserci altri muri, che si disegnano come blocchi di pietra.

### Esempi (con la soluzione attesa)

La soluzione è scritta a lettere: `u d l r` = un passo su, giù, sinistra, destra; **maiuscola** = quel passo spinge un baule. Per provarla dalla console della demo:

```js
const N = { u: "su", d: "giu", l: "sinistra", r: "destra" };
for (const c of "…lettere…") __demo.gioca({ dir: N[c.toLowerCase()] });
```

**Seme 7**: livello 1, specchio `nessuno`, 43 spinte. È la pianta della scheda.

```
##########
#    #. ##
# $#    ##
#@$  #   #
# $#     #
##      ##
##$     .#
#      ..#
##########
```

Zucco `[1,3]`; bauli `[2,2] [2,3] [2,4] [2,6]`; segni `[6,1] [8,6] [7,7] [8,7]`. Una soluzione minima (183 passi, 43 spinte):

`RRlluurDldRuurrdDDuuullddRluurrdDurrddlddllulUluRddrRlluuuurrddDuuullddRluurrdDurrddlDrddllluuRlluurrDDRRurDllllddlUUUluRRluurrdDDullddrRRllddrrruUUUUlldddDRurDRlldRlulldRurrdRlulldRR`

**Seme 12345** (quello delle foto di `prova.mjs`): livello 8, specchio `orizzontale`, 41 spinte.

```
##########
# # .  ###
# ..     #
# #    $##
####    ##
# # ##.  #
#    $$$ #
#   # @# #
##########
```

Zucco `[6,7]`; bauli `[7,3] [5,6] [6,6] [7,6]`; segni `[4,1] [2,2] [3,2] [6,5]`. Una soluzione minima (109 passi, 41 spinte):

`UUUluurrDLLdlUruLLrrrddddLLLdlluRRRRdrUUUluurrdLLdlUruLrrdddrrdLLuuurDlddrruLdlUUruLLdlUUrrddddLLLdlluRRRRdrU`

Altri semi utili: 8 → livello 2 `verticale`, 12 → livello 3 `nessuno`, 14 → livello 4 `orizzontale`, 10 → livello 5 `entrambi`, 102 → livello 6 `verticale`, 20 → livello 7 `orizzontale`, 36 → livello 8 `entrambi`.

Nel **livello 2** Zucco parte chiuso fra tre muri e un baule: la prima mossa è per forza una spinta. È voluto, non è un errore della pianta.

---

## 3. Regole e mosse

### Lo stato

Scrivi la logica come funzioni pulite, senza disegno né kit dentro: `statoIniziale(liv)` e `muovi(liv, stato, mossa) → { stato, esito, eventi }`. Qui `liv` è la pianta letta una volta (muri, segni, partenza) ed `eventi` dice al disegno cosa animare: chi si è mosso, il percorso, il baule spinto. Il resto (messaggi, `g.errore`, `g.risolto`, animazioni, salvataggio) sta in un involucro `mossa(m)`, che è la funzione chiamata da tocchi, tastiera, bottoni e `gioca`.

```
stato = {
  zucco: [x, y],
  bauli: [[x, y] × 4],        // l'ordine interno non conta
  spinte: 0,                  // spinte da quando si è (ri)cominciato, meno quelle annullate
  prima: null | { zucco, bauli, spinte, direzione },  // la foto di prima dell'ultima spinta (per Annulla)
  direzione: "giu",           // dove guarda Zucco: "su" | "giu" | "sinistra" | "destra"
}
```

Si ricava dallo stato:

- `sulSegno` = quanti bauli stanno su un segno;
- `risolto` = `sulSegno === 4`;
- `allaPartenza` = l'insieme dei bauli è uguale a quello della pianta iniziale (la posizione di Zucco non conta);
- `incastrati`, secondo la regola qui sotto.

### Le mosse

| Mossa | Cosa fa | Esito |
|---|---|---|
| `{ dir }` con `dir` = `"su"`, `"giu"`, `"sinistra"` o `"destra"` | Un passo. Se la casella è pavimento libero (o un segno libero) Zucco ci va. Se c'è un baule e la casella dopo è libera (non muro, non baule), il baule avanza di una e Zucco prende il suo posto: è una **spinta** (`spinte + 1`, e `prima` = la foto di prima della spinta). In ogni caso `direzione = dir`. | passo: `{ ok: true, spinta: false, zucco }`; spinta: `{ ok: true, spinta: true, zucco, sulSegno, incastrato }`, più `risolto: true, spinte` se è l'ultima |
| `{ dir }` contro un muro | Niente. | `{ valida: false, motivo: "muro" }` |
| `{ dir }` contro un baule che ha dietro un muro o un altro baule | Niente. | `{ valida: false, motivo: "bloccato" }` |
| `{ vai: [x, y] }` | Zucco **cammina** fino a quella casella per la strada più corta, **senza spingere niente** (ricerca in ampiezza sulle caselle libere, bauli esclusi). `direzione` = quella dell'ultimo passo. | `{ ok: true, spinta: false, zucco, passi }` (`passi` = lunghezza del percorso) |
| `{ vai }` fuori da x 1…8 / y 1…7, o su un muro | Niente. | `{ valida: false, motivo: "fuori" }` o `{ valida: false, motivo: "muro" }` |
| `{ vai }` sulla casella dove Zucco è già | Niente. | `{ valida: false, motivo: "gia li" }` |
| `{ vai }` su un baule | Niente (`vai` non spinge mai). | `{ valida: false, motivo: "baule" }` |
| `{ vai }` su una casella libera ma chiusa da bauli | Niente. | `{ valida: false, motivo: "irraggiungibile" }` |
| `{ annulla: true }` con `prima` presente | Torna alla foto: bauli, Zucco, spinte e direzione di prima dell'ultima spinta. Poi `prima = null`: si annulla una volta sola. **Non è un errore.** | `{ ok: true, annullata: true, spinte }` |
| `{ annulla: true }` senza `prima` | Niente. | `{ valida: false, motivo: "niente da annullare" }` |
| `{ ricomincia: true }` con i bauli **non** alla partenza | Tutto torna alla pianta iniziale: Zucco, bauli, `spinte = 0`, `prima = null`, `direzione = "giu"`. **È un errore**: l'involucro chiama `g.errore("Hai ricominciato il livello")`. Qui niente conferma: la conferma è solo del bottone. | `{ errore: true, motivo: "ricominciato" }` |
| `{ ricomincia: true }` con i bauli alla partenza | Niente, e non è un errore. | `{ valida: false, motivo: "gia alla partenza" }` |
| qualsiasi altra cosa | Niente. | `{ valida: false, motivo: "mossa sconosciuta" }` |

`zucco` negli esiti è la nuova casella `[x, y]`. `incastrato` è `true` se **il baule appena spinto** è nella lista degli incastrati dopo la spinta. Le mosse rifiutate (`valida: false`) non cambiano niente, non sono errori e non toccano il salvataggio.

### Bauli incastrati (aiuto visivo, non errore)

Dopo ogni mossa la demo calcola quali bauli **non più spostabili** si vedono a colpo d'occhio, e li segnala (sezione 5). La regola è esattamente questa, perché `verifica.mjs` la ricalcola e confronta la lista:

1. **Angolo**: un baule *che non sta su un segno*, con un muro sopra o sotto **e** un muro a destra o a sinistra. Contano solo i muri, non gli altri bauli.
2. **Quadrato 2×2**: per ogni quadrato di 2×2 caselle in cui tutte e quattro le caselle sono muro o baule, e almeno una è un baule fuori dai segni, sono incastrati **tutti i bauli fuori dai segni** di quel quadrato.

Un baule su un segno non è mai incastrato. Altri blocchi più sottili (un baule contro un muro senza segni lungo quel muro, per esempio) non si segnalano: tocca al giocatore capirli.

```js
function incastrati(liv, bauli) {           // bauli: lista di [x, y]; ritorna la lista dei bauli incastrati
  const muro = (x, y) => liv.pianta[y][x] === "#";
  const baule = (x, y) => bauli.some((b) => b[0] === x && b[1] === y);
  const segno = (x, y) => liv.segni.some((s) => s[0] === x && s[1] === y);
  const fuori = (x, y) => baule(x, y) && !segno(x, y);
  const out = new Set();
  for (const [x, y] of bauli)
    if (!segno(x, y) && (muro(x, y - 1) || muro(x, y + 1)) && (muro(x - 1, y) || muro(x + 1, y))) out.add(`${x},${y}`);
  for (let y = 0; y < 8; y++) for (let x = 0; x < 9; x++) {
    const q = [[x, y], [x + 1, y], [x, y + 1], [x + 1, y + 1]];
    if (q.every(([a, b]) => muro(a, b) || baule(a, b)) && q.some(([a, b]) => fuori(a, b)))
      for (const [a, b] of q) if (fuori(a, b)) out.add(`${a},${b}`);
  }
  return [...out].map((k) => k.split(",").map(Number));
}
```

### Vittoria

La spinta che mette il quarto baule su un segno risolve il rompicapo. Nello stesso istante l'involucro chiama `g.risolto({ riepilogo, ritardo: 1600 })` (lo stato cambia subito, la carta arriva dopo l'animazione) e `mossa` ritorna `{ ok: true, spinta: true, zucco, sulSegno: 4, incastrato: false, risolto: true, spinte }`.

Il `riepilogo`:

- se `spinte === variante.spinteMinime`: `Quattro bauli sui segni in ${spinte} spinte: meglio di così non si poteva!`
- altrimenti: `Quattro bauli sui segni in ${spinte} spinte. Il modo più corto ne chiede ${spinteMinime}.`

### Errori, limiti, salvataggio

- **L'unico errore** è ricominciare (bottone confermato, o `gioca({ ricomincia: true })`). Spinte in un angolo, passi contro i muri, bauli bloccati e annullamenti **non** sono errori.
- Non ci sono limiti di spinte né di tempo.
- **Ricaricare la pagina non deve ricominciare gratis.** Dopo ogni mossa accettata, compresi passi, `vai`, `annulla` e `ricomincia`, salva in `g.memoria.partita` questo oggetto, poi chiama `g.salvaMemoria()`:
  `{ chiave: "L" + livello + "-" + specchio, zucco, bauli, spinte, prima, direzione }`.
  All'avvio, se `g.memoria.partita` esiste, ha la stessa `chiave`, 4 bauli su caselle non muro tutte diverse e Zucco su una casella libera, riparti da lì. Altrimenti parti dalla pianta. La conferma di «Ricomincia» invece non si salva: dopo un ricaricamento il bottone torna a dire «Ricomincia».
- **Già risolto** (`g.giaRisolto`): mostra lo stato salvato se ha tutti i bauli sui segni; altrimenti i bauli sui segni e Zucco alla partenza. In tutti e due i casi i bauli sono già **aperti** con i costumi (vedi la vittoria nella sezione 5), i segni sono accesi e i bottoni spenti. Fumetto: «I bauli sono tutti sui segni.»

---

## 4. Interfaccia

### Tocchi e trascinamenti (`g.tocca`)

- Al `"giu"` ricorda il punto di partenza e non fare ancora niente.
- Al `"su"` misura lo spostamento dal punto di partenza:
  - **se è di 6 pixel della scena o più** (in x o in y) è una **strisciata**: `mossa({ dir })` nella direzione dominante (|dx| > |dy| → destra o sinistra, altrimenti giù o su). Vale da qualsiasi punto della scena;
  - **altrimenti è un tocco** sulla casella del punto di **partenza**: `cx = floor((x − 88) / 18) + 1`, `cy = floor((y − 22) / 18) + 1`.
    - Fuori da `cx` 1…8 / `cy` 1…7: niente.
    - Sulla casella di Zucco: niente.
    - Casella **accanto** a Zucco (distanza 1 in orizzontale o in verticale): `mossa({ dir })` verso di lei. Così un tocco sul baule accanto lo spinge.
    - Qualsiasi altra casella: `mossa({ vai: [cx, cy] })`. Se è un muro, un baule lontano o una casella chiusa, la mossa viene rifiutata con il messaggio giusto (sotto).
- `"muovi"` con il mouse e senza tasto premuto: ricorda la casella sotto il puntatore per l'evidenziazione (sezione 5).

Il bersaglio è la casella intera, 18×18 pixel della scena (circa 36 pixel veri sul telefono).

### Tastiera (comoda sul computer)

Frecce o `W A S D` → `mossa({ dir })`; `Z` o `Backspace` → `mossa({ annulla: true })`. Usa `preventDefault()` sulle frecce. Ignora i tasti quando c'è una carta del kit aperta (`document.querySelector(".kit-velo-carta:not([hidden])")`) o se il rompicapo è risolto (`g.stato().risolto`).

### Bottoni (`g.bottone`), due

1. **«Annulla»**, `{ id: "annulla" }` → `mossa({ annulla: true })`. È **spento** (`disabled = true`) quando non c'è niente da annullare (`prima === null`) e dopo la soluzione.
2. **«Ricomincia»**, `{ id: "ricomincia" }`. È **spento** quando i bauli sono alla partenza e dopo la soluzione.
   - Prima pressione: non cambia niente nel gioco. L'etichetta diventa **«Sicuro?»**, il bottone prende anche la classe `kit-btn-forte` e il fumetto dice il messaggio di conferma. L'attesa dura **4 secondi**, oppure finché il giocatore fa un'altra mossa, anche rifiutata: poi l'etichetta torna «Ricomincia» e la classe se ne va.
   - Seconda pressione durante l'attesa: `mossa({ ricomincia: true })`, poi l'etichetta torna «Ricomincia».

Aggiorna lo stato spento/acceso dei due bottoni dopo **ogni** mossa e all'avvio, quindi anche dopo un ricaricamento. `data-azione` resta sempre `annulla` e `ricomincia`: `verifica.mjs` li trova così e legge `disabled` e il testo.

### Testo della carta iniziale

Il testo della scheda va bene, ma aggiungi una riga sulle due regole del bottone. Il kit legge `opzioni.testo` quando mostra la carta, cioè dopo `crea`, quindi basta tenere un riferimento all'oggetto delle opzioni:

```js
const opzioni = {
  id: "casse-deposito", sfondo: "deposito", velo: 0.5,
  variante(rng) { /* sezione 2 */ },
  crea(g) {
    opzioni.testo = g.scheda.enigma + "\n" +
      "«Annulla» toglie gratis l'ultima spinta, ma solo quella. Ricominciare il livello conta come un errore.";
    // …
  },
};
EscapeDemo.avvia(opzioni);
```

### Messaggi del fumetto (`g.messaggio`), testi esatti

| Quando | Testo |
|---|---|
| All'avvio (anche ripartendo da una partita salvata) | `Tocca il pavimento per camminare, tocca un baule vicino per spingerlo.` |
| Spinta che rende incastrato un baule in più rispetto a prima (ha la precedenza sugli altri) | `Quel baule è incastrato: annulla la spinta o ricomincia.` |
| Spinta che porta un baule su un segno (non l'ultimo) | `Un baule è sul segno: ${sulSegno} su 4.` |
| Spinta che toglie un baule da un segno | `Il baule ha lasciato il segno: ${sulSegno} su 4.` |
| Spinta che porta `spinte` a 1 (la prima dall'inizio o da un «Ricomincia»), se nessuna riga sopra vale | `Spinto! «Annulla» toglie l'ultima spinta, ma solo quella.` |
| Altre spinte, passi e `vai` riusciti | il fumetto **non cambia** |
| Spinta rifiutata (`bloccato`) | `Da quella parte il baule non si muove.` |
| Passo contro il muro (`muro`), `vai` su un muro o fuori | il fumetto non cambia (basta l'urto, sezione 5) |
| `vai` su un baule | `Prima avvicinati al baule, poi spingilo.` |
| `vai` su una casella chiusa (`irraggiungibile`) | `Zucco non ci arriva senza spingere un baule.` |
| Annulla riuscito, nessun baule incastrato | `Ultima spinta annullata.` |
| Annulla riuscito, ma restano bauli incastrati | `Spinta annullata, ma c'è ancora un baule incastrato.` |
| Annulla rifiutato, con `spinte > 0` | `Si può annullare solo l'ultima spinta.` |
| Annulla rifiutato, con `spinte === 0` | `Non c'è nessuna spinta da annullare.` |
| Prima pressione di «Ricomincia» | `Ricominciare conta come un errore. Premi di nuovo per confermare.` |
| Ricomincia confermato (dopo `g.errore`) | `I bauli sono tornati al loro posto. Si riparte!` |
| `ricomincia` rifiutato | `I bauli sono già al loro posto.` |
| Vittoria | `Tutti i bauli sono sui segni!` |
| Già risolto, all'apertura | `I bauli sono tutti sui segni.` |

Testo esatto di `g.errore`: **`Hai ricominciato il livello`**. Il kit aggiunge da solo «· ora le dorate in palio sono N» quando scendono.

---

## 5. Grafica

Sfondo `sfondo: "deposito"`, `velo: 0.5`. Lo sfondo ha gli abiti appesi a sinistra (x 8–108), lo scaffale a destra (x 216–306), la lampadina a x 160 e il pavimento di assi da y 118. La pianta copre il centro calmo; a sinistra c'è la lavagna con i contatori, a destra il ragno custode.

**Una bozza statica fatta con questi sprite e queste coordinate rende bene**: tienile così, salvo ritocchi dopo aver guardato le foto.

### Disposizione (pixel della scena)

| Cosa | Dove |
|---|---|
| Casella `[x, y]` (x 1…8, y 1…7), 18×18 | angolo in alto a sinistra `px = 88 + (x − 1) × 18`, `py = 22 + (y − 1) × 18`; centro `(79 + 18x, 13 + 18y)` |
| Interno della pianta | x 88…231, y 22…147 |
| Cornice (i muri esterni) | x 81…238, y 13…154 |
| Ombra della pianta | scacchi `C.nero` a x 239…241 (y 17…157) e a y 155…157 (x 84…241), solo dove `(x + y)` è pari |
| Lavagna | x 12…77, y 96…149 (con le gambe) |
| Ragno | filo a x 266 da y 16; sprite 13×10 con l'angolo in `(260, yRagno)`, `yRagno` = 46 a riposo |

### Livelli di disegno

- **Fisso**, su `g.ctx`, disegnato **una volta** all'avvio: cornice, pavimento con le sue ombre, muri interni e telaio della lavagna (tutto tranne le scritte).
- **Mobile**, su una tela in più `const m = g.nuovaTela()`, cancellato e ridisegnato a ogni fotogramma (`g.anima`). Dentro, in quest'ordine: segni di gesso; bauli e Zucco ordinati per la loro **y in pixel attuale** (chi sta più in basso si disegna dopo); sopra tutto «!», riquadri del tocco, scintille, lampo rosso della cornice, ragno e scritte della lavagna.

Tutto a coordinate intere, con `EscapeDemo.rett` ed `EscapeDemo.sprite`. Colori solo da `EscapeDemo.C`, con **una eccezione motivata**: `#9c3b17`, l'arancio scuro della zucca di Zucco. È il colore originale del suo sprite (`giochi/zucco/src/sprite-provvisori.js`), è già in `kit.css` come `--kit-arancio-scuro` e senza di lui la testa di Zucco perde l'ombreggiatura.

### La cornice (i muri esterni)

```js
rett(ctx, C.bordo, 81, 13, 158, 142);                       // contorno esterno pieno
function cappa(x, y, w, h) {                                // la cima di pietra di un muro visto dall'alto
  rett(ctx, C.ferro, x, y, w, h);
  rett(ctx, C.ferroChiaro, x, y, w, 1);
  rett(ctx, C.ferroChiaro, x, y, 1, h);
  for (let yy = y + 5; yy < y + h; yy += 9) rett(ctx, C.mattone, x, yy, w, 1);  // giunti fra le pietre
}
cappa(82, 14, 6, 139);                                      // muro di sinistra
cappa(232, 14, 6, 139);                                     // muro di destra
rett(ctx, C.ferro, 82, 14, 156, 2); rett(ctx, C.ferroChiaro, 82, 14, 156, 1);   // cima del muro di fondo
for (let i = 0; i < 8; i++) sprite(ctx, MURO_FRONTE.righe, MURO_FRONTE.colori, 88 + i * 18, 16);  // facciata del muro di fondo (y 16…21)
rett(ctx, C.ferro, 82, 149, 156, 3); rett(ctx, C.ferroChiaro, 82, 149, 156, 1); // cima del muro davanti
rett(ctx, C.muroCaldo, 82, 152, 156, 2);                    // la sua facciata
rett(ctx, C.bordo, 82, 148, 156, 1);                        // spigoli interni
rett(ctx, C.bordo, 87, 16, 1, 132);
rett(ctx, C.bordo, 232, 16, 1, 132);
```

### Pavimento, ombre, muri interni

Per ogni casella interna `[x, y]`:

- **Pavimento** (non muro): `PAVIMENTO` in `(px, py)`, **specchiato** (`{ specchia: true }`) quando `(x + y)` è dispari, così le assi non sembrano una griglia. Ombre portate dai muri:
  - se sopra c'è un muro (cornice compresa, cioè sempre in riga 1): `rett(C.legnoScuro, px, py, 18, 2)` più una riga di puntini `C.legnoScuro` a `py + 2`, uno sì e uno no;
  - se a sinistra c'è un muro (sempre in colonna 1): `rett(C.legnoScuro, px, py, 2, 18)`.
- **Muro interno**: se la casella sotto è pavimento, disegna `MURO_SOPRA` **solo nelle prime 12 righe** in `(px, py)` e `MURO_FRONTE` (6 righe) in `(px, py + 12)`. Così il blocco ha la faccia davanti e sembra alto. Se sotto c'è un altro muro, o la cornice in riga 7, disegna `MURO_SOPRA` intero (18 righe). Poi, **solo sui lati che confinano con un pavimento**, una riga di 1 pixel `C.bordo`: a sinistra `(px, py, 1, 18)`, a destra `(px + 17, py, 1, 18)`, sopra `(px, py, 18, 1)`.

```js
const PAVIMENTO = { // 18×18, assi di legno orizzontali
  colori: { L: C.legnoChiaro, l: C.legno, s: C.legnoScuro },
  righe: [
    "LLLLLLLLLLLsLLLLLL",
    "lllllllllllsllllll",
    "llllLLlllllsllllll",
    "lllllllllllsllllll",
    "lllllllllllslllLll",
    "ssssssssssssssssss",
    "LLLLsLLLLLLLLLLLLL",
    "llllslllllllllllll",
    "llllsllllllllLLlll",
    "llllslllllllllllll",
    "llllsllLllllllllll",
    "ssssssssssssssssss",
    "LLLLLLLLLLLLLLsLLL",
    "llllllllllllllslll",
    "lllLLlllllllllslll",
    "llllllllllllllslll",
    "llllllllllLlllslll",
    "ssssssssssssssssss",
  ],
};
const MURO_SOPRA = { // 18×18, cima di pietra a blocchi sfalsati
  colori: { a: C.ferroChiaro, b: C.ferro, c: C.mattone },
  righe: [
    "aaaaaaaacaaaaaaaac",
    "abbbbbbbcabbbbbbbc",
    "abbcbbbbcabbbbbbbc",
    "abbbbbbbcabbbbbbbc",
    "abbbbbbbcabbbbbbbc",
    "cccccccccccccccccc",
    "aaacaaaaaaaacaaaaa",
    "bbbcabbbbbbbcabbbb",
    "bbbcabbbbbbbcabbbb",
    "bbbcabbbbbbbcabcbb",
    "bbbcabbbbbbbcabbbb",
    "cccccccccccccccccc",
    "aaaaaaaacaaaaaaaac",
    "abbbbbbbcabbbbbbbc",
    "abbbbbbbcabcbbbbbc",
    "abbbbbbbcabbbbbbbc",
    "abbbbbbbcabbbbbbbc",
    "cccccccccccccccccc",
  ],
};
const MURO_FRONTE = { // 18×6, la faccia davanti di mattoni, in ombra
  colori: { d: C.muroAcceso, e: C.muroCaldo, k: C.bordo },
  righe: [
    "ddddddddkddddddddk",
    "eeeeeeeekeeeeeeeek",
    "kkkkkkkkkkkkkkkkkk",
    "eeekeeeeeeeekeeeee",
    "eeekeeeeeeeekeeeee",
    "kkkkkkkkkkkkkkkkkk",
  ],
};
```

### Segni di gesso

`SEGNO` in `(px, py)` sulla casella del segno: una X di gesso con quattro angoli a squadra sul bordo della casella. Gli angoli restano visibili anche sotto il baule. Con un baule sopra (fermo, vedi «Stati visivi») gli stessi pixel diventano `{ w: C.giallo, W: C.oro }`.

```js
const SEGNO = { // 18×18
  colori: { w: C.pietraChiara, W: C.pietra },
  righe: [
    "wwwW..........Wwww",
    "w................w",
    "w................W",
    "W................w",
    "..................",
    ".....wW....ww.....",
    "......ww..ww......",
    ".......wWww.......",
    "........ww........",
    "........ww........",
    ".......wwWw.......",
    "......ww..ww......",
    ".....ww....Ww.....",
    "..................",
    "w................W",
    "W................w",
    "w................w",
    "wwwW..........Wwww",
  ],
};
```

### I bauli

16×16, disegnati in `(px + 1, py + 1)`, con l'ombra `rett(C.bordo, px + 2, py + 17, 15, 1)`. Sono bauli da costumi in cuoio rosso: coperchio visto dall'alto, fascia d'ottone con la chiusura, doghe di legno, angoli d'ottone. Sono tutti uguali, perché ogni baule va bene su ogni segno: niente numeri né colori diversi.

```js
const BAULE = {
  colori: { k: C.bordo, R: C.tappetoChiaro, r: C.tappeto, L: C.legnoLuce, O: C.oroScuro, o: C.oro, y: C.giallo },
  righe: [
    ".kkkkkkkkkkkkkk.",
    "kyRRRLRRRRLRRRok",
    "kRRRRLRRRRLRRRrk",
    "kRRRRLRRRRLRRRrk",
    "krrrrLrrrrLrrrrk",
    "kOOOOOOOOOOOOOOk",
    "koRRRLRyyRLRRRok",
    "kRRRRLROORLRRRrk",
    "kRRRRLRRRRLRRRrk",
    "kRRRRLRRRRLRRRrk",
    "kRRRRLRRRRLRRRrk",
    "kRRRRLRRRRLRRRrk",
    "koRRRLRRRRLRRRok",
    "krrrrLrrrrLrrrrk",
    "krrrrLrrrrLrrrrk",
    ".kkkkkkkkkkkkkk.",
  ],
};
```

Il **baule aperto** (vittoria e già risolto) è alto 20 e va in `(px + 1, py − 3)`: il coperchio alzato sporge di 3 pixel nella casella sopra, ed è giusto così. Le righe `1`, `2` e `3` si sostituiscono con le tre righe di un costume. Colori: quelli di `BAULE` più quelli del costume.

```js
const BAULE_APERTO = [
  ".kkkkkkkkkkkkkk.",
  "krrrrrrrrrrrrrrk",
  "krLrrrrrrrrrrLrk",
  "krLrrrrrrrrrrLrk",
  "krLrrrrrrrrrrLrk",
  "kOOOOOOOOOOOOOOk",
  "k11111111111111k",
  "k22222222222222k",
  "k33333333333333k",
  "kOOOOOOOOOOOOOOk",
  "koRRRLRyyRLRRRok",
  "kRRRRLROORLRRRrk",
  "kRRRRLRRRRLRRRrk",
  "kRRRRLRRRRLRRRrk",
  "kRRRRLRRRRLRRRrk",
  "kRRRRLRRRRLRRRrk",
  "koRRRLRRRRLRRRok",
  "krrrrLrrrrLrrrrk",
  "krrrrLrrrrLrrrrk",
  ".kkkkkkkkkkkkkk.",
];
// Un costume per baule: il primo segno in ordine di lettura (riga, poi colonna) prende il costume 0, e così via.
const COSTUMI = [
  { nome: "lenzuolo da fantasma", righe: ["wwwwwwwwwwwwwW", "wwwnnwwwnnwwWW", "wwwwwwwwwwwWWW"], colori: { w: C.bianco, W: C.pietraChiara, n: C.nero } },
  { nome: "cappello da strega",   righe: ["rrrrrrPvrrrrrr", "rrrrrPPvvrrrrr", "PPPPPPoPPPPPPP"], colori: { r: C.tappeto, P: C.violaScuro, v: C.viola, o: C.oro } },
  { nome: "bende da mummia",      righe: ["wWwwWwwWwwWwwW", "WwwWwwWwwWwwWw", "wwWwwWwwWwwWww"], colori: { w: C.pietraChiara, W: C.pietra } },
  { nome: "mantello da vampiro",  righe: ["nnnnnRRRRnnnnn", "nnnnRRRRRRnnnn", "nnnRRRRRRRRnnn"], colori: { n: C.nero, R: C.tappetoChiaro } },
];
```

### Zucco

14×16, disegnato in `(px + 2, py + 1)`, con l'ombra `rett(C.bordo, px + 4, py + 17, 10, 1)`. La testa è quella della fuga di Zucco (righe 0–12, identiche a `TESTA` di `sprite-provvisori.js`), con sotto un mantellino viola e i piedi. Tre pose: `FRONTE` per `"giu"`, `RETRO` per `"su"`, `LATO` per `"destra"`, e `LATO` con `{ specchia: true }` per `"sinistra"`.

```js
const ZUCCO_COLORI = { k: C.bordo, o: "#9c3b17", O: C.brace, y: C.fiamma, h: C.fiammaChiara, E: C.oro, e: C.luna,
  b: C.legnoScuro, G: C.erbaScura, g: C.erba, p: C.viola, P: C.violaScuro, q: C.lilla };
const ZUCCO_FRONTE = [
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
  "...kqppppPk...",
  "...kppppPPk...",
  "...kkk..kkk...",
];
const ZUCCO_RETRO = [
  "......Gg......",
  ".....GGg......",
  "..kkkkkkkkkk..",
  ".koOOyyyOOOok.",
  "koOyyyhyyyOOok",
  "koOyyOyyOyyOok",
  "koOyyOyyOyyOok",
  "koOyyOyyOyyOok",
  "koOyyOyyOyyOok",
  "koOOyOyyOyOOok",
  "kooOOOOOOOOOok",
  ".kooOOOOOOOok.",
  "..kkkkkkkkkk..",
  "...kPppppPk...",
  "...kPPppPPk...",
  "...kkk..kkk...",
];
const ZUCCO_LATO = [ // guarda a destra
  ".....Gg.......",
  ".....GGg......",
  "..kkkkkkkkkk..",
  ".koOOyyyyOOok.",
  "koOOyyhyyyOOok",
  "koOyyyyyyEEOok",
  "koOyyyyyyEeeEk",
  "koOyyyyyyOEEOk",
  "koOOyyyyyOOOOk",
  "koOOyyyyyEbEbk",
  "kooOOyyyyeEeEk",
  ".kooOOOOOOOok.",
  "..kkkkkkkkkk..",
  "...kqppppPk...",
  "...kppppPPk...",
  "...kkk..kkk...",
];
const PIEDI_PASSO = "...kk....kk..."; // riga 15 alternativa, mentre cammina
```

### La lavagna dei contatori (a sinistra)

Telaio, sul livello fisso:

```js
rett(ctx, C.bordo, 19, 134, 4, 16);  rett(ctx, C.legno, 20, 134, 2, 15);   // gamba sinistra
rett(ctx, C.bordo, 69, 134, 4, 16);  rett(ctx, C.legno, 70, 134, 2, 15);   // gamba destra
rett(ctx, C.bordo, 12, 96, 66, 40);                                         // contorno
rett(ctx, C.legnoChiaro, 13, 97, 64, 38);                                   // cornice
rett(ctx, C.legnoLuce, 13, 97, 64, 1); rett(ctx, C.legnoLuce, 13, 97, 1, 38);  // luce in alto a sinistra
rett(ctx, C.legno, 13, 133, 64, 2);    rett(ctx, C.legno, 75, 97, 2, 38);      // ombra in basso a destra
rett(ctx, C.siepe, 15, 99, 60, 34);                                         // la lavagna
for (const [x, y] of [[28, 120], [53, 104], [64, 128], [38, 131], [70, 101]]) rett(ctx, C.erbaScura, x, y, 2, 1); // aloni di gesso
rett(ctx, C.pietraChiara, 58, 134, 5, 1);                                   // il gessetto sulla mensola
```

Scritte, sul livello mobile, «col gesso» e quindi senza ombra (`ombra: null`):

- `testo(m, "SPINTE", 19, 102, { piccolo: true, colore: C.pietra, ombra: null })`;
- il numero delle spinte (al massimo 999): `testo(m, String(spinte), 19, 109, { scala: 2, colore: C.pietraChiara, ombra: null })`. Quando cambia, per 2 fotogrammi è `C.bianco`;
- `testo(m, "SEGNI", 19, 126, { piccolo: true, colore: C.pietra, ombra: null })`;
- quattro mini-segni 5×5 a x = 43, 50, 57, 64 e y = 126: il mini-segno `i` è `C.giallo` se `i < sulSegno`, altrimenti `C.erbaScura` (gesso cancellato).

```js
const MINI_SEGNO = ["w...w", ".w.w.", "..w..", ".w.w.", "w...w"]; // colori: { w: … }
```

### Il ragno custode (a destra)

Pende da un filo sopra lo scaffale e reagisce agli eventi. Filo: `rett(m, C.pietra, 266, 16, 1, yRagno − 16)`. Sprite in `(260 + dxRagno, yRagno)`:

```js
const RAGNO = {
  colori: { k: C.bordo, v: C.violaScuro, l: C.viola, r: C.tappetoChiaro },
  righe: [
    "......k......",
    ".....kkk.....",
    "k...klvvk...k",
    ".k.klvvvvk.k.",
    "..kkvvvvvkk..",
    "kkk.kvvvk.kkk",
    "...k.krk.k...",
    "..k.krkrk.k..",
    ".k...kkk...k.",
    "k...........k",
  ],
};
```

- A riposo: `yRagno` = 46, più 1 pixel nei fotogrammi `g.fotogramma % 16 >= 8` (respira).
- Quando aumentano i bauli incastrati: scende a `yRagno` = 62 in 200 ms (a passi interi), resta giù 1 secondo e risale a 46 in 400 ms.
- Ricomincia (errore): protesta, scuotendosi di ±1 pixel in x a ogni fotogramma (125 ms) per 8 fotogrammi.
- Vittoria: fa lo yo-yo, 46 → 30 → 46 → 30 → 46 in 1 secondo.

### Stati visivi

| Stato | Come si vede |
|---|---|
| Baule normale | `BAULE` con i suoi colori |
| Baule **sul segno** (fermo) | colori del baule con `O: C.oro, o: C.giallo, y: C.bianco` (l'ottone brilla), angoli del segno `C.giallo`/`C.oro`. In più una scintilla di 1 pixel `C.bianco` gira sui quattro angoli della casella, un angolo ogni 2 fotogrammi, sfasata da baule a baule |
| Baule **incastrato** | colori spenti `R: C.tappeto, r: C.legnoScuro, L: C.legno, O: C.ferro, o: C.ferroChiaro, y: C.ferroChiaro`, più un «!» lampeggiante sopra: `testo(m, "!", px + 7, py − 5, { colore: C.tappetoChiaro })`, visibile quando `Math.floor(g.fotogramma / 2) % 2 === 0` |
| Baule in movimento | sempre con i colori normali: lo stato «sul segno» o «incastrato» si vede quando ha finito di scivolare |
| Tocco | per 250 ms quattro angoli a squadra (bracci di 3 pixel) sulla casella toccata: `C.brand` se la mossa è stata accettata, `C.tappetoChiaro` se è stata rifiutata |
| Mouse sopra (facoltativo) | gli stessi angoli in `C.brand` sulla casella sotto il puntatore, solo se un tocco lì farebbe una mossa valida |
| Risolto / già risolto | bauli aperti con i costumi, segni gialli, mini-segni tutti gialli |

### Animazioni

Lo stato logico cambia subito; il disegno lo raggiunge. Ogni pezzo ha una posizione disegnata in pixel che va **dalla vecchia alla nuova casella** in modo lineare, arrotondata a **pixel interi**. Se arriva una mossa mentre un'animazione è in corso, quella in corso salta subito alla fine e parte la nuova.

- **Passo** di Zucco: 150 ms. Mentre cammina, la riga 15 alterna fra quella normale e `PIEDI_PASSO` ogni 75 ms.
- **Spinta**: baule e Zucco scivolano insieme in 150 ms; Zucco è spostato di 1 pixel in più verso la spinta (si piega sul baule).
- **`vai`**: Zucco segue il percorso casella per casella, `max(30, min(60, floor(480 / passi)))` ms a casella, girandosi a ogni svolta.
- **Urto contro il muro**: Zucco avanza di 2 pixel verso il muro in 80 ms e torna in 80 ms.
- **Baule bloccato**: il baule trema lungo la direzione della spinta, +1, −1, +1, 0 pixel ogni 40 ms, e Zucco fa l'urto.
- **Annulla**: baule e Zucco tornano indietro scivolando in 150 ms.
- **Ricomincia** (errore): tutti i bauli e Zucco scivolano in linea retta dalla posizione attuale a quella di partenza in 350 ms. Intanto la cornice lampeggia di rosso 3 volte, 100 ms accesa e 100 ms spenta: `C.tappetoChiaro` su `(81, 13, 158, 2)`, `(81, 153, 158, 2)`, `(81, 13, 2, 142)`, `(237, 13, 2, 142)`. Il ragno protesta.
- **Respiro** di Zucco da fermo: le righe 0–12 (la testa) scendono di 1 pixel quando `g.fotogramma % 16 >= 8`, mentre il mantellino e i piedi restano fermi. La candela dentro la zucca tremola: in qualche fotogramma a caso (qui `Math.random` va bene, è decorazione) le `e` si disegnano `C.giallo` invece di `C.luna`.
- **Vittoria** (da quando si chiama `g.risolto`):
  - 0–150 ms: l'ultima spinta;
  - 150–550 ms: i quattro segni lampeggiano, angoli `C.giallo` e `C.bianco` alternati ogni 100 ms;
  - a 550, 700, 850 e 1000 ms: i bauli si aprono uno alla volta, nell'ordine di lettura dei segni, e passano da `BAULE` a `BAULE_APERTO` col loro costume;
  - a ogni apertura salgono 4 scintille di 1 pixel (`C.giallo` e `C.bianco`) da `(px + 3 + 3j, py − 3)`, 1 pixel ogni 2 fotogrammi per 10 fotogrammi;
  - a 1000 ms Zucco salta due volte (−2 pixel per 120 ms, giù per 120 ms) e il ragno fa lo yo-yo;
  - a 1600 ms il kit mostra la carta.
- **`g.riduciMovimento`**: ogni spostamento salta subito alla fine. Niente respiro, tremolio, scintille, lampeggi né yo-yo; il «!» resta acceso fisso. In vittoria i bauli sono subito aperti.

---

## 6. Aggancio per le prove

```js
g.espone({
  gioca: (m) => mossa(m),          // la STESSA funzione di tocchi, tastiera e bottoni; ritorna l'esito
  statoGioco: () => ({ ... }),     // sotto
  posizione: (x, y) => ({ x: 79 + 18 * x, y: 13 + 18 * y }),  // centro della casella [x, y], interi
});
```

- **`gioca(mossa)`**: le mosse e gli esiti della tabella della sezione 3, alla lettera. Gli esiti devono essere oggetti JSON semplici. `verifica.mjs` controlla in particolare:
  - `{ valida: false }` per muro, baule bloccato, `vai` impossibile, `annulla` senza niente da annullare e `ricomincia` alla partenza;
  - `{ ok: true, spinta: true, incastrato: true }` per la spinta che manda un baule in un angolo;
  - `{ risolto: true, spinte: N }` per l'ultima spinta.
- **`statoGioco()`** ritorna esattamente queste chiavi, con le liste ordinate per riga e poi per colonna:

```js
{
  zucco: [x, y],
  bauli: [[x, y], [x, y], [x, y], [x, y]],
  segni: [[x, y], [x, y], [x, y], [x, y]],
  spinte: 0,
  sulSegno: 0,
  incastrati: [],          // lista di [x, y], vuota se nessuno; regola della sezione 3
  annullabile: false,      // true se c'è una spinta da annullare
  risolto: false,
}
```

- **`posizione(x, y)`**: il centro della casella in pixel della scena. La verifica ci clicca sopra con `t.clicScena` e ci fa partire una strisciata di 30 pixel con `t.trascinaScena`.
- I bottoni hanno `data-azione="annulla"` e `data-azione="ricomincia"`. La verifica li preme con `t.bottone(...)` e legge `disabled` e il testo («Annulla», «Ricomincia», «Sicuro?»).

---

## 7. Criteri di accettazione

`node demo/comune/prova.mjs casse-deposito` finisce con «TUTTO OK». Poi, guardando le foto e giocando:

1. Dalle foto `desktop` e `telefono`: la pianta si legge al primo colpo. Muri di pietra grigia con la faccia di mattoni sotto, pavimento di assi, bauli rossi con l'ottone, segni di gesso bianchi, Zucco riconoscibile con la sua testa di zucca. Niente esce dall'area x 4…316 / y 18…152, tranne la cornice e le ombre, che sono decorazione.
2. La lavagna mostra «SPINTE» col numero grande e «SEGNI» con i quattro mini-segni. Il numero cresce a ogni spinta e non coi passi.
3. Un tocco sul pavimento lontano fa camminare Zucco lungo il percorso, senza attraversare bauli e muri. Un tocco sul baule accanto lo spinge. Una strisciata fa un passo. Con le frecce funziona uguale.
4. Spingere un baule contro un muro o un altro baule: il baule trema, appare il messaggio, nessun errore.
5. Spingere un baule in un angolo (foto `verifica-incastrato`): il baule si spegne, il «!» lampeggia, il ragno scende, il fumetto lo dice. Nessun errore.
6. «Annulla» torna indietro di una spinta sola, poi si spegne finché non si spinge di nuovo.
7. «Ricomincia» chiede conferma («Sicuro?»); confermato, i bauli scivolano alla partenza, la cornice lampeggia di rosso, il ragno protesta e il kit conta l'errore (foto `verifica-ricominciato`). Con i bauli alla partenza il bottone è spento.
8. Ricaricando la pagina a metà partita si ritrova la stessa posizione.
9. Un baule su un segno brilla e il segno diventa giallo. Alla quarta spinta giusta i bauli si aprono uno per volta con i costumi, poi arriva la carta col riepilogo (foto `verifica-vinto`). Riaprendo, la stanza mostra i bauli aperti sui segni (foto `verifica-gia-risolto`).
10. Su `telefono-verticale` la scena resta intera e leggibile (le barre del kit escono dalla scena da sole).
11. Con `prefers-reduced-motion` niente resta a metà: ogni mossa salta allo stato finale.
