# Regole comuni delle demo dei rompicapi

Valgono per ogni demo in questa cartella. Chi scrive le istruzioni di un rompicapo (il **regista**) le dà per scontate e scrive solo quello che è specifico; chi costruisce la demo (il **costruttore**) le segue insieme alle istruzioni.

## Il lavoro

Ogni rompicapo ha la sua cartella `demo/<id>/`:

| File | Chi lo scrive | Cosa contiene |
|---|---|---|
| `scheda.js` | già pronto (generato dal catalogo) | testo, soluzione, indizi, dorate, errori concessi, varianti, rischi, note. **Non si modifica.** |
| `ISTRUZIONI.md` | regista | gameplay e grafica del rompicapo, abbastanza precisi da costruirlo senza altre domande |
| `verifica.mjs` | regista | la prova automatica, indipendente dal codice della demo |
| `index.html`, `gioco.js` (ed eventualmente `gioco.css`) | costruttore | la demo |
| `foto/` | `comune/prova.mjs` | foto e rapporto delle prove (non vanno in git) |

Non si toccano: `comune/`, `_esempio/`, le cartelle delle altre demo, `../sfondi/`, `../mappa/`, `../sprite/`, `../verifiche/`, il catalogo. Niente commit git, niente rete. Se il kit non basta per qualcosa, lo si scrive nel rapporto finale invece di modificarlo.

## Il gioco

Un'escape room nel sito della festa di Halloween 2027 (GETINVOLVED). Le stanze sono quelle del locale della festa: Cancello, Ingresso, Deposito, Sala principale (con la Sala Bar in un angolo), Area Fumatori e, al primo piano, la Sala del tesoro. Il protagonista è **Zucco**, la zucca della fuga di Zucco (l'altro gioco del sito); in giro ci sono i mostri della festa: scheletri, zombie, streghe, fantasmi, vampiri, mummie, corvi, ragni. Il tono è spiritoso e un po' macabro, mai splatter.

- **Tutto in italiano**, testi brevi e chiari.
- **Mai nominare Layton** né altri videogiochi; niente nomi, personaggi o grafica di giochi esistenti. Le soluzioni dei rompicapi famosi sono online: per questo numeri e disposizioni sono nostri e cambiano per giocatore.

Regole valide per ogni rompicapo (già gestite dal kit dove indicato):

1. **Niente scelta multipla.** Il giocatore costruisce la risposta (muove pezzi, compone un codice, decide posizioni, gioca mosse); non sceglie mai fra opzioni proposte dal gioco.
2. **Risolto = chiuso per sempre.** Niente «rigioca» (kit).
3. **Caramelle dorate.** Il rompicapo vale `dorate` (scheda); ogni `erroriConcessi` errori ne vale una in meno, minimo 1 (kit). Cosa conta come errore è nella scheda (campo `note`, «Conta come errore: …») e nelle istruzioni. Le mosse impossibili (un pezzo che non può andare lì) **non** sono errori: vengono rifiutate e basta.
4. **Indizi.** Li vende il kit, uno per volta, per una dorata della borsa (testi in `scheda.indizi`). La demo non se ne occupa.
5. **Variante per giocatore.** Tutto ciò che cambia fra giocatori viene da `variante(rng, seme)`: deterministica, stesso seme stessa variante. Mai `Math.random()` nella logica (nelle decorazioni sì).
6. **Logica separata dal disegno.** Nel gioco vero le risposte le controllerà il server: lo stato e le mosse vanno scritti come funzioni pulite (stato + mossa → nuovo stato ed esito), e il disegno legge lo stato. Così si spostano facilmente.

## Il kit

- [`comune/kit.js`](comune/kit.js): l'API è descritta in testa al file e nei commenti della maniglia `g` (cerca «La maniglia»). Funzioni di disegno in `EscapeDemo`: `rett`, `riquadro`, `retino`, `sprite`, `testo`, `larghezzaTesto`, `caramella`; utilità `casuale`, `intero`, `mescola`; colori `C`, `GEMME`.
- [`comune/kit.css`](comune/kit.css): barre, bottoni e carte. Il costruttore non deve ridisegnarli.
- [`comune/prova.mjs`](comune/prova.mjs): la prova automatica.
- [`_esempio/`](_esempio/): una demo minima completa (`index.html`, `gioco.js`, `verifica.mjs`) che usa tutto il kit. **Va letta prima di cominciare.**

`index.html` è la copia di `_esempio/index.html` con il `<title>` giusto (più `<link rel="stylesheet" href="gioco.css">` se serve). `gioco.js` è uno script classico in una funzione che si chiama da sola, con `"use strict"`: niente moduli ES, niente librerie, niente `fetch` — le demo devono aprirsi anche con un doppio clic (file://).

## Grafica: pixel art

- **Scena 320×180 pixel**, come gli sfondi delle stanze; il kit la ingrandisce a tutto schermo. Si disegna su `g.ctx` (o su tele in più con `g.nuovaTela`) **solo a coordinate intere**, con rettangoli pieni (`EscapeDemo.rett`, `riquadro`) e sprite a lettere (`EscapeDemo.sprite`, come in `../sprite/oggetti.js`). Vietati: `arc`, `stroke`, linee e forme smussate, `drawImage` ridimensionati, gradienti lisci (per le sfumature c'è `EscapeDemo.retino`), ombre del canvas, emoji, testo HTML dentro la scena.
- **Scritte e numeri sugli oggetti** con `EscapeDemo.testo`: 5×7 per quello che conta, 3×5 (`piccolo: true`) per le etichette secondarie. Solo maiuscole, cifre e pochi segni (gli accenti spariscono da soli).
- **Colori:** solo la paletta `EscapeDemo.C` (quella della fuga di Zucco, la stessa degli sfondi) e le pietre di `EscapeDemo.GEMME`. Un colore fuori paletta va motivato nelle istruzioni.
- **Stile:** contorno scuro di 1 pixel (`C.bordo`) attorno a pezzi e personaggi; luce calda dall'alto a sinistra (lato chiaro sopra e a sinistra, ombra sotto e a destra); i pezzi del rompicapo più chiari e saturi dello sfondo, che è già velato di scuro. Nessun oggetto decorativo che somigli ai pezzi del rompicapo.
- **Zone:** le barre del kit coprono `y < 16` (titolo, caramelle, bottoni) e `y ≥ 154` (fumetto e bottoni del rompicapo). Lì solo decorazioni. **Area di gioco: x 4…316, y 18…152.**
- **Tocco:** bersagli di almeno 14×14 pixel della scena (sul telefono la scena è ingrandita circa 2×, quindi 28 pixel veri) e zone di tocco più generose del disegno. Trascinare va bene; la tastiera è facoltativa.
- **Sfondo:** `sfondo` è l'id della stanza: `cancello`, `ingresso`, `deposito`, `sala-principale`, `sala-bar`, `area-fumatori` o `sala-del-tesoro`. `velo` fra 0.4 e 0.6. Se la stanza non è assegnata: `sfondo: null` e una `tinta` della paletta (sfondo provvisorio a retino).
- **Animazioni:** quelle continue a 8 fotogrammi al secondo (`g.fotogramma`): fiamme, luccichii, il respiro dei personaggi, sfasate fra loro. I pezzi si spostano in 150–350 ms, sempre su pixel interi. Con `g.riduciMovimento` si salta subito allo stato finale (mai un pezzo lasciato a metà) e niente animazioni continue.
- **Risposta a ogni azione:** si vede entro un fotogramma. Lo stato si legge a colpo d'occhio: numeri sui pezzi, contatori disegnati nella scena quando servono (es. «MOSSE 12/30», «MINUTI 17/30»), pezzo selezionato evidenziato.
- **Errore:** `g.errore(motivo)` (avviso, scossa e conto delle dorate li fa il kit) più una reazione nella scena (lampo rosso, pezzo che torna al suo posto, personaggio che protesta).
- **Vittoria:** una piccola animazione nella scena (luce, serratura che scatta, oggetto che si apre), poi `g.risolto({ riepilogo })`. La carta della vittoria arriva dopo `ritardo` ms; lo stato invece cambia subito.
- **Già risolto** (`g.giaRisolto`): la scena mostra lo stato finale se si ricava dalla variante, altrimenti quello iniziale; l'input lo blocca il kit.

## Testi

- Il testo del rompicapo è `scheda.enigma` e lo mostra la carta iniziale. Se per la demo va adattato (per esempio perché i numeri cambiano con la variante), lo si passa ad `avvia` come `testo` e le istruzioni dicono come costruirlo.
- All'inizio il fumetto (`g.messaggio`) dice in una frase cosa si tocca. Dopo ogni azione importante, un messaggio breve (al massimo una settantina di caratteri) che dice cosa è successo, senza suggerire la soluzione.
- Bottoni del rompicapo (`g.bottone`): al massimo tre, verbi brevi («Pesa», «Prova», «Ricomincia»).
- Niente note fisse in grigio sullo schermo.

## L'aggancio per le prove

Con `g.espone({...})` la demo pubblica in `window.__demo`:

- **`gioca(mossa)`, obbligatoria.** Applica UNA mossa usando la stessa funzione chiamata dai tocchi e dai bottoni; aggiorna lo stato subito (le animazioni vengono dopo); ritorna un oggetto JSON con l'esito, per esempio `{ ok: true }`, `{ valida: false }`, `{ errore: true, motivo }`, `{ risolto: true }`.
- **`statoGioco()`, obbligatoria.** Lo stato del rompicapo in JSON.
- **Facoltative:** funzioni che dicono dove toccare (es. `posizione(i)` → `{ x, y }` in pixel della scena), così la verifica prova anche i clic veri.

Il formato esatto di mosse, esiti e stato lo decidono le istruzioni di ogni demo e il costruttore lo rispetta alla lettera, perché `verifica.mjs` lo usa.

## `verifica.mjs`

- `export default async function verifica(t)`. L'oggetto `t` è descritto in `comune/prova.mjs`: `t.seme`, `t.variante`, `t.gioca(mossa)`, `t.stato()` (errori, dorateInPalio, risolto…), `t.chiama(nome, ...argomenti)`, `t.nuova(seme)` (pagina pulita con un altro seme; ritorna la variante), `t.ricarica()`, `t.controlla(condizione, messaggio)`, `t.foto(nome)`, `t.aspetta(ms)`, `t.clicScena(x, y)`, `t.trascinaScena(x1, y1, x2, y2)`, `t.bottone(azione)`, `t.chiudiCarte()`, `t.log(...)`, `t.pagina` (la pagina di Puppeteer).
- **È indipendente dalla demo:** ricava la soluzione dalla `variante` con un risolutore suo. Il codice si può copiare e adattare da `../verifiche/*.mjs`, ma non importare (quegli script stampano e girano appena caricati).
- **Controlla almeno:**
  1. su almeno 5 semi diversi la variante rispetta i vincoli delle istruzioni (ed è risolvibile entro i limiti, con una sola soluzione dove le istruzioni lo chiedono);
  2. un errore tipico conta come errore e non risolve;
  3. una mossa impossibile viene rifiutata e non conta come errore;
  4. la soluzione del risolutore, giocata con `t.gioca`, risolve il rompicapo;
  5. almeno una mossa passa dall'interfaccia vera (`t.clicScena`, `t.trascinaScena` o `t.bottone`);
  6. se ci sono limiti (mosse, minuti, tentativi), superarli fa quello che dicono le istruzioni.
- Alla fine il rompicapo deve restare **risolto**: dopo, `prova.mjs` controlla che resti chiuso anche ricaricando.
- Il regista prova da solo il risolutore con Node (per esempio su una variante scritta a mano) prima di consegnare, perché la demo ancora non esiste.

## Comandi

Dalla cartella `escape-room`:

```sh
node demo/comune/prova.mjs <id>             # foto + verifica; deve finire con «TUTTO OK»
node demo/comune/prova.mjs <id> --seed 42   # un altro seme per le foto
```

Le foto finiscono in `demo/<id>/foto/` (desktop-testo, desktop, telefono, telefono-verticale, verifica-*). **Vanno guardate** (con Read sul PNG): la verifica dice se la demo funziona, le foto dicono se si capisce e se è bella.

## Cosa scrive il regista in `ISTRUZIONI.md`

1. **In breve:** cosa fa il giocatore e come si vince, in tre righe.
2. **Variante:** il generatore passo per passo (parametri, vincoli, come si garantisce che sia risolvibile), il formato esatto dell'oggetto `variante` e un paio di esempi con la soluzione attesa. Se serve un elenco di disposizioni già verificate, va scritto per intero nelle istruzioni.
3. **Regole e mosse:** lo stato; le mosse ammesse; cosa succede dopo ognuna; quando è un errore (con il testo esatto di `g.errore`); quando è risolto; limiti e cosa succede quando si superano.
4. **Interfaccia:** cosa si tocca o si trascina, bottoni (`g.bottone`), testi esatti di tutti i messaggi del fumetto, testo della carta iniziale se va adattato.
5. **Grafica:** la disposizione nella scena con le coordinate (dentro l'area di gioco), ogni sprite con misure e colori (meglio se già disegnato a lettere), gli stati visivi (normale, selezionato, sbagliato, risolto), le animazioni, sfondo e velo.
6. **Aggancio per le prove:** il formato esatto di `gioca(mossa)`, degli esiti, di `statoGioco()` e delle funzioni facoltative.
7. **Criteri di accettazione:** l'elenco di cose da controllare guardando le foto e giocando.

## Cosa consegna il costruttore

La demo che passa `prova.mjs` con «TUTTO OK», le foto guardate e corrette se qualcosa non si capiva, e un rapporto breve: cosa ha fatto, cosa non torna nelle istruzioni (se le ha dovute interpretare), cosa manca al kit.
