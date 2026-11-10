# Escape room (titolo da decidere)

Secondo gioco del sito: un'escape room nelle stanze della festa, con rompicapi ripresi dai classici e da Layton (solo la logica: testo, disegni e numeri sono nostri). Le regole del gioco e le schede dei rompicapi stanno nel [catalogo dei rompicapi](https://claude.ai/artifact/GYz9mKr8rS3vebB1eJhiCx); le decisioni principali anche nel [README della sezione 14](../../README.md).

Il gioco non è ancora scritto. Per ora qui ci sono gli sfondi, gli sprite degli oggetti, la mappa e le demo dei rompicapi approvati.

## Sala del tesoro e chiavi di diamante

La Sala del tesoro è al primo piano: ci si arriva da una salita che parte dall'Ingresso ed è chiusa. Tutte le altre stanze sono al piano terra; il Deposito sta fra l'Ingresso e il Cancello, con la porta sull'Ingresso, e l'Area Fumatori accanto alla Sala principale. La pianta dei due piani è nella linguetta «Mappa del posto» del [catalogo dei rompicapi](https://claude.ai/artifact/GYz9mKr8rS3vebB1eJhiCx#mappa).

Ogni stanza del piano terra completata dà una **chiave di diamante**: il manico è un teschio e negli occhi ha una pietra preziosa diversa per ogni stanza. La salita parte dal centro dell'Ingresso ed è chiusa da un **portone con sei serrature in cerchio**, ognuna del colore della sua pietra. Toccando il portone (o la salita chiusa) lo si guarda **da vicino**: le serrature per cui hai la chiave brillano e, toccandone una, la chiave sale da sotto intera e scintillante, si gira verso la toppa, entra e gira; da lì continua a brillare. Con tutte e sei inserite il portone si apre. Le chiavi prese e quelle inserite si salvano sul profilo del giocatore: rientrando non si rimettono (vedi «Il portone da vicino» più sotto). Nella Sala del tesoro ci sono gli ultimi rompicapi, i più difficili del gioco: chi li risolve sblocca il premio finale.

| Stanza | Chiave (proposta) |
|---|---|
| Cancello | ametista |
| Ingresso | topazio |
| Deposito | smeraldo |
| Sala principale | rubino |
| Sala Bar | zaffiro |
| Area Fumatori | acquamarina |

## Rompicapi della storia

*Proposti il 2026-11-10, da approvare.* Tre rompicapi molto difficili (difficoltà 4) per ognuna delle sei sale che danno una chiave, e sei impossibili (difficoltà 5) nella Sala del tesoro. Le schede complete (testo, soluzione, indizi, varianti per giocatore, rischi, cosa conta come errore) sono nel [catalogo](https://claude.ai/artifact/GYz9mKr8rS3vebB1eJhiCx), con le posizioni nella storia da 11 a 34. Quelli di contorno arriveranno dopo.

| Sala | Rompicapi |
|---|---|
| Cancello | Il lucchetto delle lapidi (codice da indovinare, contro un lucchetto che cambia idea) · I corvi dello spaventapasseri (Nim misère contro un avversario perfetto) · La lanterna del cortile (cinque mostri, una lanterna, 30 minuti) |
| Ingresso | Il ritratto in pezzi (tessere 3×3 con un limite di mosse) · Gli otto candelabri (otto regine con due pezzi fissi) · Il conto del guardaroba (TESCHIO + TRUCCO = SCHERZO) |
| Deposito | I bauli del deposito (casse da spingere, 43 spinte) · I teli che mentono (sinceri e bugiardi generati per giocatore) · L'armadio a combinazione (codice di tre cifre dagli indizi) |
| Sala principale | La pista che si spegne (luci 5×5) · Il ballo dei cavalieri (scambio di cavalli su un palco 4×3) · Il maxischermo del DJ (nonogramma 15×15) |
| Sala Bar | La torre di sottobicchieri (frittelle bruciate) · Lo shottino avvelenato (16 shottini, 4 assaggiatori) · La mancia dei baristi (marinai e noci di cocco) |
| Area Fumatori | La catena dello spettro (anelli cinesi) · I mozziconi della strega (il mozzicone in prestito) · Le clessidre del fungo (7 e 11 minuti per farne 15) |
| Sala del tesoro | Le dodici monete (con una bilancia che sceglie la risposta peggiore) · Le cinque tombe (indovinello di Einstein generato per giocatore) · La caramella solitaria (solitario a 33 buche) · L'esagono d'oro (esagono magico) · La spartizione dei pirati-scheletro · I tre teschi (Sincero, Bugiardo e Casuale con «tic» e «tac») |

Ogni soluzione è controllata con un risolutore. Gli script sono in [`verifiche/`](verifiche/) e si lanciano con Node (`node verifiche/verifiche-a.mjs`; alcuni accettano il nome di una parte, per esempio `node verifiche/verifiche-b.mjs sokoban`). Serviranno anche per i generatori lato server delle varianti per giocatore.

| Script | Cosa controlla |
|---|---|
| `lanterna-candelabri.mjs` | lanterna (cammino minimo), otto candelabri (le 92 soluzioni e le 308 coppie fisse che ne lasciano una) |
| `criptaritmi.mjs` | i conti in lettere con una sola soluzione (risolutore a colonne con il riporto) |
| `clessidre.mjs` | le coppie di clessidre in cui una va girata a metà |
| `verifiche-a.mjs` | lucchetto (strategia di Knuth contro la risposta peggiore), corvi, cavalieri, pista, anelli, mozziconi, clessidre, mancia, pirati |
| `verifiche-b.mjs` | bauli (`sokoban`, `sokoban2`: generatore che tira le casse all'indietro), blocchi scorrevoli (`forziere`), travasi a colori (`shottino`), tessere 3×3 (`ritratto`) |
| `verifiche-c.mjs` | generatori dei teli e dell'armadio, unicità dei nonogrammi |
| `verifiche-d.mjs` | dodici monete (`monete`), solitario (`solitario`), esagono (`esagono`), tre teschi (`teschi`) |
| `verifiche-e.mjs` | torre di sottobicchieri, generatore delle cinque tombe |
| `verifiche-f.mjs` | sequenza degli anelli, soluzione dei cavalieri, unicità dei pirati a ogni passaggio, esagono con un numero fisso |

Per non ripetere meccaniche già nel catalogo: i blocchi scorrevoli restano alle casse della consolle (il forziere previsto per la Sala del tesoro è diventato le cinque tombe; `verifiche-b.mjs forziere` ha comunque trovato una disposizione nostra da 93 mosse, contro le 81 della classica), i travasi all'Angelo Azzurro (al bar ci sono i sottobicchieri), le luci da spegnere alla pista (nell'Area Fumatori la catena con gli anelli).

## Demo dei rompicapi

*Dal 2026-11-10.* In [`demo/`](demo/) c'è una demo giocabile per ogni rompicapo approvato. Ognuna si apre con un doppio clic su `demo/<id>/index.html` (oppure da [`demo/index.html`](demo/index.html), l'elenco per stanza): niente server, niente librerie. Per ora sono 18: le quattro principali di prima (zucca vuota, casse della consolle, Angelo Azzurro, ascensore) e le posizioni 11–20, 24, 28, 30 e 31 della storia.

Come sono fatte:

- **[`demo/REGOLE_COMUNI.md`](demo/REGOLE_COMUNI.md)**: le regole valide per tutte (gioco, pixel art, testi, prove).
- **[`demo/comune/`](demo/comune/)**: il kit condiviso, così le demo sembrano lo stesso gioco.
  - `kit.js` e `kit.css`: scena in pixel art 320×180 sopra lo sfondo della stanza; barre con caramelle dorate in palio, indizi a pagamento e testo del rompicapo; errori che tolgono dorate; rompicapo chiuso dopo la soluzione; variante per giocatore dal seme; salvataggio nel browser al posto del profilo.
  - `prova.mjs`: la prova automatica.
- **[`demo/_esempio/`](demo/_esempio/)**: una demo minima che mostra il kit.
- **In ogni cartella `demo/<id>/`:**
  - `scheda.js`: generata dal catalogo;
  - `ISTRUZIONI.md` e `verifica.mjs`: istruzioni di gameplay e grafica, e la prova indipendente con il risolutore. Li scrive un agente Opus, il regista;
  - `index.html`, `gioco.js`: la demo. La scrive un agente Sonnet, il costruttore, seguendo solo le istruzioni.

La prova si lancia da questa cartella:

```sh
node demo/comune/prova.mjs <id>
```

Apre la demo in Edge senza finestra e fa le foto in `demo/<id>/foto/`, che git non tiene. Poi lancia `verifica.mjs`, che risolve la variante con il suo risolutore e la gioca, e controlla che dopo la soluzione il rompicapo resti chiuso.

## Mappa del gioco

*Deciso il 2026-11-09.* Il gioco è disegnato in pixel art **vista dall'alto a tre quarti**, come un punta e clicca, ma si vede **una sala alla volta**: la sala in cui sei riempie la scena e il resto resta al buio. Un ragazzino con la testa di zucca sta nella sala, le frecce stanno sulle porte; toccandone una, la zucca cammina fino alla porta, la sala dopo si accende, la telecamera ci scivola dentro e la zucca entra. Le sale più grandi della scena (il cortile del Cancello, la Sala del tesoro) si seguono mentre la zucca cammina; sulla scala si passa dal buio al primo piano. Gli sfondi delle stanze servono solo da sfondo ai rompicapi. La bozza giocabile è nella linguetta «Esplora» del [catalogo](https://claude.ai/artifact/GYz9mKr8rS3vebB1eJhiCx#esplora).

*Deciso dopo, lo stesso giorno.* Ogni sala è una **schermata intera** di 16×10 quadretti (320×200 pixel) che riempie lo schermo, ridisegnata per stare in quella forma: dalla pianta prende i collegamenti e il lato delle porte, non le misure (nella pianta il Deposito e il Bar sono stretti e lunghi e lascerebbero lo schermo quasi tutto nero). Passando da una porta la scena scorre verso la sala dopo, come nei giochi a stanze: quella vecchia esce, quella nuova entra dal lato opposto e la zucca rientra dalla porta d'arrivo. Sulla scala si passa dal buio.

Le sale sono disegnate in codice in [`mappa/mappa.js`](mappa/mappa.js) (sezione «Le sale a schermata intera»), a 20 pixel per quadretto. Da lì si generano `sale.png` (le schermate una sotto l'altra, il foglio che usa il gioco) e `geometria.json` (dove sta ogni sala nel foglio, il punto della zucca, le porte con il verso della freccia, la porta del premio). Lo stesso file disegna anche la **pianta intera** dei due piani (`piano-terra.png`, `primo-piano.png`, 720×760, con `geometria-pianta.json`), che per ora il gioco non usa: può servire come mappa d'insieme. Per i muri vale la regola della vista a tre quarti: si vede la faccia rivolta in basso, e chi sta più giù copre chi sta dietro.

Le schermate e i loro collegamenti (*sistemati con l'utente il 2026-11-09*):

| Schermata | Si va a |
|---|---|
| La strada (partenza, fuori dal cancello) | il cancello, in alto a sinistra |
| Cancello (lo spiazzo appena dentro, con i suoi rompicapi) | in basso a sinistra la strada, in alto a destra il vialetto |
| Vialetto | in basso il Cancello, in alto la porta dell'Ingresso |
| Ingresso (un po' più alto dello schermo, 11,6 quadretti) | in basso il vialetto; in alto a sinistra l'Anti-sala; in alto a destra, dietro il bancone del guardaroba (di traverso, con un'apertura), la porta del Deposito; al centro la scala per la Sala del tesoro, chiusa da un portone con sei serrature in cerchio, una per chiave |
| Anti-sala | in basso l'Ingresso; a sinistra la porta grande della Sala principale (con il buttafuori e i cordoni); a destra il corridoio verso l'Area Fumatori |
| Deposito | Ingresso (a sinistra) |
| Sala principale (16×26 quadretti, molto più alta che larga: la scena la segue e la si scorre) | Anti-sala (a destra, in basso); l'area bar, che si vede in piccolo sul lato destro |
| Sala Bar (un angolo della Sala principale, contro il muro di destra: bancone verticale, scaffali di bottiglie lungo il muro, sgabelli verso la sala) | ci si entra ingrandendo l'angolo del bar e sfumando nella schermata di dettaglio; si esce a sinistra, al contrario |
| Corridoio dei bagni (muro piastrellato; alla porta delle donne una coda di mostri un po' in disordine, la mummia in testa che bussa; tutti e due i bagni occupati) | Anti-sala (a sinistra), Corridoio degli spogliatoi (a destra); sul muro il bagno delle donne e quello degli uomini |
| Corridoio degli spogliatoi (nastro di pericolo sulle porte, cartelli WARNING, DANGER, GO AWAY!, NO ENTRY, STAFF ONLY, transenna KEEP OUT con due coni) | Corridoio dei bagni (a sinistra), Area Fumatori (a destra); sul muro gli spogliatoi, inchiodati e chiusi con la catena |
| Area Fumatori (16×15 quadretti, più alta dello schermo: la scena la segue e la si scorre; mostri che fumano a gruppetti, e il fumo che sale prende la forma di spiriti) | Corridoio degli spogliatoi (a sinistra) |
| Sala del tesoro (primo piano) | la scala che scende all'Ingresso; la porta d'oro a destra è chiusa: è la proposta per il premio finale |

I mostri della coda e dei fumatori sono sprite a lettere in `MOSTRI` dentro `mappa.js` (mummia, strega, lupo mannaro, zombie, fantasma, scheletro, vampiro, diavoletto, demone): guardano a sinistra, si girano con `specchio`, e le gambe sono a parte (dritte, incrociate, il piede che batte). Il fumo dei fumatori lo disegna `fumoSpirito`: una scia che ondeggia e in cima diventa uno spirito (con le braccia alzate, che urla, a teschio, a pipistrello, lungo come una serpe, a gatto, con le corna). I cartelli usano un carattere piccolo di 5 pixel (`LETTERE`), con solo le lettere che servono: per una scritta nuova può servire aggiungerne qualcuna.

### Il portone da vicino

*Fatto il 2026-11-10.* Nell'Ingresso, toccando il portone delle serrature (nella scena o con la salita, finché è chiusa), la zucca va davanti al portone, la telecamera si avvicina e la scena passa a una schermata col portone solo: arco di pietra, due ante, le sei serrature grandi in cerchio col colore della loro pietra, il teschio al centro e due torce.

- **Le serrature:** quelle per cui hai la chiave pulsano col colore della pietra, con un bordo di luce che gira attorno; quelle con la chiave già dentro mostrano la testa della chiave che brilla; le altre restano in ombra e, toccandole, il gioco dice quale sala dà la chiave.
- **La chiave che entra:** toccando una serratura che brilla, la chiave sale da sotto intera, coi suoi fotogrammi che scintillano e una scia di luce. Poi si gira verso la toppa: il gambo si accorcia a scatti sotto la testa e la testa sale sulla toppa. Entra con uno sbuffo di polvere, fa mezzo giro (la testa si stringe a un filo e torna larga) e la serratura lampeggia.
- **L'apertura:** con la sesta chiave gli occhi del teschio si accendono, le due ante scivolano sotto l'arco scoprendo la luce dorata della Sala del tesoro, e si torna nella sala col portone aperto.
- **Tornare indietro:** «Torna all'Ingresso» (sulla scena e sotto) o Esc.

Il disegno è `disegnaPortone()` in `mappa.js` (sezione «Il portone da vicino»): `portone.png` 320×200, con le torce animate nei quadratini del giro (sotto il nome `portone`). `portone.json` (da `geometriaPortone()`) dice dove sono le serrature, la piastra, l'arco, le ante e gli occhi del teschio. Nella pagina l'immagine è un file caricato e la geometria sta nel documento `pianta/portone`. Lo sprite della chiave è quello delle chiavi di diamante (`oggetti`): la pagina ne ricava da sola dove finisce la testa.

**Salvataggio:** le chiavi prese e quelle inserite stanno nell'archivio, nella parte privata di ogni giocatore (`data/users/<id>`, documento `escape-room`: `chiavi`, `inserite`). Si scrive a ogni chiave presa o inserita. Rientrando, anche da un altro dispositivo, le chiavi sono già al loro posto. La sala in cui sei resta solo sul dispositivo. La prima volta col profilo, le chiavi ricordate sul dispositivo vengono portate sul profilo. «Ricomincia dalla strada» (per le prove) svuota anche il profilo.

### Animazioni della mappa

*Fatte il 2026-11-10.* Tutti i personaggi si muovono, anche solo un poco, e con loro fiamme e luci. Ogni funzione di disegno di `mappa.js` sa in che istante del **giro** si trova: 24 fotogrammi a 8 al secondo, 3 secondi, poi ricomincia. Ognuno è sfasato, così due mostri uguali non si muovono insieme.

- **Personaggi:**
  - i mostri a lettere respirano (il busto scende di un pixel), sbattono le palpebre e fanno il loro gesto: la mummia bussa, la strega scorre il telefono, il lupo a gambe incrociate saltella, lo zombie ciondola, il fantasma galleggia, lo scheletro batte il piede, il vampiro fa luccicare l'orologio, il diavoletto agita la coda;
  - gli ospiti della Sala principale ballano a tempo; il vampiro beve, il barista shakera;
  - il buttafuori gira la testa;
  - i teli del Deposito ondeggiano e chiudono gli occhi, gli occhi nell'armadio e quelli sotto la porta degli uomini sbattono e guardano;
  - lo spaventapasseri dondola col vento e il corvo si guarda attorno;
  - i pipistrelli sbattono le ali.
- **Il resto:** torce, candele, zucche, lampioni e lanterne tremano; le lampade dei corridoi sfarfallano; le insegne al neon tremolano; le lucine e le lampadine dello specchio fanno la rincorsa; la pista, la palla, le casse, la consolle e il jukebox vanno a tempo col battito; l'acqua e le pozzanghere luccicano; nel tesoro brillano monete, mucchi e porta d'oro.
- **Eventi:** il fumo dei fumatori e il manichino non girano col giro. Il fumo di ogni fumatore fa una boccata di 3,5 secondi (la brace si ravviva, la scia sale, lo spirito si forma, ondeggia, si stacca e svanisce), poi aspetta da 2 a 5 secondi a caso e riparte, ognuno per conto suo. Il manichino gira la testa di scatto ogni 6–14 secondi.
- **I fumi tirati a sorte** (*2026-11-10*): i fumi non sono legati ai fumatori.
  - Stanno in una raccolta, `FUMI` in `mappa.js`, di 18 fumi: braccia alzate, urli, teschi, pipistrelli, serpi, gatti coi baffi, cornuti col ghigno, una coppia di serpi che escono dalla stessa brace; di varie misure, alcuni con gli occhi accesi.
  - A ogni boccata la pagina tira a sorte quale fumo fare, anche specchiato, fra quelli che stanno dentro la sala. Scarta quello della boccata prima e quelli che stanno facendo gli altri fumatori, finché ne restano. Lo scheletro vicino al muro, per esempio, pesca solo fra i fumi piccoli.
  - Ogni fumatore ha un fumo `preferito`, il suo di prima, che si vede fermo con «riduci movimento» e nelle anteprime.
  - Per aggiungere un fumo basta una riga in `FUMI`, poi si rigenerano i file.

`animazioni()` (in fondo a `mappa.js`) disegna ogni sala in ogni fotogramma e prepara quattro file:

- `sale.png`: il foglio fermo, senza il fumo, che è un evento;
- `animazioni-giro.png`: i quadratini 16×16 che cambiano da un fotogramma all'altro, senza doppioni;
- `animazioni-eventi.png`: una riga di fotogrammi per il manichino e una per ogni fumo della raccolta, trasparenti, con la brace in un punto fisso (`ax`, `ay` nell'indice);
- `animazioni.json`: l'indice di fotogrammi ed eventi.

Nella pagina del catalogo i due fogli sono file caricati nella pagina, e l'indice sta nel documento `pianta/animazioni`. La scena disegna il pezzo di foglio della sala, sopra i quadratini del fotogramma corrente, poi gli eventi.

Con «riduci movimento» non si muove niente e il fumo resta fermo, già formato (fotogramma `fermo`).

Peso totale circa 770 KB: foglio fermo 308 KB, quadratini 239 KB, eventi 111 KB, indice 110 KB.

**Dopo ogni modifica al disegno** vanno rigenerati e ricaricati tutti e quattro i file: non solo `sale.png`, perché i quadratini sono pezzi della sala e devono combaciare col foglio fermo.

Nella bozza ci sono due visuali per vedere come verrebbe il gioco vero: **a schermo intero** (come al computer: la finestra 320×200 riempie lo schermo con le bande nere dove serve, e in alto ci sono il nome della sala, le sei chiavi e «Esci»; sul telefono prova anche a girare lo schermo in orizzontale) e **dentro la sagoma di un telefono** in orizzontale, per vederlo dal computer.

Le chiavi di diamante le danno sei sale: Cancello, Ingresso, Deposito, Sala principale, Sala Bar, Area Fumatori. La strada, il vialetto, l'Anti-sala e i due corridoi sono passaggi e non danno chiavi.

## Sprite degli oggetti

Gli sprite sono disegnati pixel per pixel in [`sprite/oggetti.js`](sprite/oggetti.js), come gli sprite provvisori di Zucco: una lettera per colore. Accanto ci sono i JSON nel formato di SpriteForge (`size`, `palette`, `grid`, `frames`, `frameMode: "anim"`), generati da quel file:

- `chiave-<pietra>.json`: chiave di diamante 17×34, 8 fotogrammi. Un riflesso scende lungo il diamante, gli occhi si accendono uno alla volta e compaiono due stelline.
- `caramella-dorata.json`: caramella dorata 24×14, 8 fotogrammi. Un riflesso la attraversa e brilla una stellina.

Per una stanza nuova basta aggiungere una riga a `CHIAVI_PER_STANZA` con una pietra di `GEMME` e un colore nuovo in `GEMME` (le sei pietre ora sono tutte usate).

## Sfondi delle stanze

Ogni rompicapo si gioca sopra lo sfondo in pixel art della sua stanza. Gli sfondi sono disegnati in codice in [`sfondi/sfondi.js`](sfondi/sfondi.js): 320×180 come [La fuga di Zucco](../zucco/README.md), con la stessa paletta, così i due giochi sembrano lo stesso mondo. I PNG accanto (`sfondi/<stanza>.png`) sono generati da quel file e non vanno ritoccati a mano.

| Stanza | Sfondo |
|---|---|
| Cancello (fuori: cancello chiuso, la casa in fondo) | [`cancello.png`](sfondi/cancello.png), prima prova da approvare |
| Ingresso (fuori: la casa dove finisce Zucco) | [`ingresso.png`](sfondi/ingresso.png), seconda prova da approvare |
| Deposito (il guardaroba abbandonato) | [`deposito.png`](sfondi/deposito.png), prima prova da approvare |
| Sala principale (sala 1, la pista) | [`sala-principale.png`](sfondi/sala-principale.png), prima prova da approvare |
| Sala Bar (dentro la sala principale) | [`sala-bar.png`](sfondi/sala-bar.png), prima prova da approvare |
| Area Fumatori (fuori dalla porta sul retro, sotto la tettoia) | [`area-fumatori.png`](sfondi/area-fumatori.png), prima prova da approvare |
| Sala del tesoro (sala 2) | [`sala-del-tesoro.png`](sfondi/sala-del-tesoro.png), prima prova da approvare |

I nomi dei PNG sono gli id delle stanze nel catalogo. Nella Sala Bar il «pavimento» del rompicapo è il piano del bancone.

Regole di composizione, valide per tutte le stanze:

- il centro resta calmo: lì sopra il gioco mette il rompicapo;
- i dettagli stanno ai bordi, che sul telefono possono essere tagliati;
- il pavimento parte da y = 118 e ospita gli oggetti del rompicapo appoggiati a terra;
- niente oggetti che somigliano ai pezzi del rompicapo della stanza (nell'Ingresso, niente zucche);
- scritte e colori forti (cartelli, finestre accese, lanterne) lontano dalla zona dove il rompicapo mette i suoi pezzi: nell'Ingresso il cartello sta sul tetto e le lanterne vicino alla cancellata, perché fra i piatti della bilancia sembravano zucche.

Nella pagina del catalogo, sotto un rompicapo lo sfondo ha un velo scuro leggero e si aggancia al 30% dall'alto: sugli schermi larghi così restano visibili sia il cartello sia il prato.
