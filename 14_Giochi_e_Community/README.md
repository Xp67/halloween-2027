# 14 · Giochi e Community

*Deciso il 2026-11-03.* Sul sito ci sarà una sezione di **giochi nel browser**: ogni gioco ha la sua **classifica** e c'è un **obiettivo di comunità**. Con i giochi si vincono **premi da ritirare alla festa**.

Lo scopo è tenere il pubblico sul sito nelle settimane prima della festa, farlo tornare ogni giorno e spingerlo a coinvolgere amici. Più persone giocano, più biglietti si vendono.

## Come funziona

```
Utente registrato ─▶ gioca ─▶ punteggio inviato al server ─▶ validato ─▶ classifica del gioco
                                                                │
                                                                └──▶ somma all'obiettivo di comunità

Fine del periodo ─▶ premi assegnati all'account ─▶ alla festa: QR del biglietto ─▶ ritiro del premio
```

## Giochi

Giochi brevi (partite da 1-3 minuti), a tema Halloween, giocabili da telefono. Idee:

| Gioco | Meccanica | Note |
|---|---|---|
| [La fuga di Zucco](giochi/zucco/README.md) | Runner a stage: 3 vite, salta, scivola, raccogli caramelle per la luna piena, scappa da mani nere e orda di mostri | Prima versione giocabile con effetti pixelfx, sprite provvisori |
| [Escape room](giochi/escape-room/README.md) (titolo da decidere) | Escape room ambientata nella location della festa: rompicapi della storia principale, che aprono le stanze, e di contorno, che danno caramelle. Logica ripresa dai classici e da Layton, testo e disegni nostri | In progettazione: [catalogo dei rompicapi](https://claude.ai/artifact/GYz9mKr8rS3vebB1eJhiCx) (pagina privata, si apre con l'accesso) |
| | es. colpisci gli zombie (reazione) | |
| | es. memory / puzzle a tempo | |
| | es. quiz horror | Si possono svelare indizi sulla festa |

Tutti i giochi vanno ideati da noi, non copiati da giochi esistenti (nomi, personaggi, grafica).

*Deciso il 2026-11-05.* Grafica 16 bit, sprite con [SpriteForge](https://spriteforge.tech) ed effetti con [pixelfx](https://github.com/patch-gg/pixelfx). I giochi stanno in [`giochi/`](giochi/), uno per cartella.

*Deciso il 2026-11-07.* Nell'escape room l'avanzamento si salva sul profilo del giocatore, sul server, e si riprende da qualsiasi dispositivo. I rompicapi sono di due tipi: quelli della **storia principale** vanno in fila e fanno proseguire la trama; quelli **di contorno** sono facoltativi e servono a guadagnare altre caramelle. Il server controlla ogni risposta e registra il progresso nello stesso momento, così salvataggio e anti-imbroglio sono la stessa cosa. Le stanze, per ora: il **Cancello**, l'**Ingresso**, il **Deposito** (il guardaroba), la **Sala principale** (sala 1) con dentro la **Sala Bar**, l'**Area Fumatori**, e la **Sala del tesoro** (sala 2), l'unica al primo piano. Fra l'Ingresso e la Sala principale c'è un'anti-sala, da cui parte il corridoio con i bagni e gli spogliatoi che porta all'Area Fumatori. Alla Sala del tesoro si sale dall'Ingresso, e la salita si apre solo con tutte e sei le **chiavi di diamante**: ogni stanza del piano terra completata dà la sua, con una pietra preziosa diversa negli occhi del teschio che fa da manico, e ogni chiave va inserita nella sua serratura del portone in mezzo all'Ingresso, dove continua a brillare. Nella Sala del tesoro ci sono gli ultimi rompicapi, i più difficili, e chi li risolve sblocca il **premio finale** (cos'è e a chi va è da decidere, vedi [Premi](#premi)). Ogni rompicapo si gioca sopra lo **sfondo in pixel art della sua stanza** (la pixel art di ogni stanza è da stabilire; per ora ci sono sfondi provvisori). Un rompicapo risolto si chiude per quel giocatore e **non si può rifare**. **Niente rompicapi a scelta multipla**: la risposta giusta si passa fra giocatori con un messaggio. Ogni rompicapo risolto, della storia o di contorno, dà un tot di **caramelle dorate**; dopo un tot di tentativi sbagliati ne dà di meno, e gli errori li conta il server, quindi ricaricare non li azzera. Le dorate restano sul profilo del giocatore e servono a comprare gli indizi. Quando una dorata viene guadagnata, nel [cesto della comunità](#obiettivo-di-comunità) si versano 100 caramelle, così i rompicapi pesano quanto le caramelle che Zucco fa raccogliere a ogni partita; spendere la dorata non toglie nulla dal cesto. Dettagli e schede nel [catalogo dei rompicapi](https://claude.ai/artifact/GYz9mKr8rS3vebB1eJhiCx).

**Da decidere:** quanti giochi e chi li sviluppa. Il frontend di [GetInvolved](../05_Biglietteria/README.md#base-esistente-progetto-getinvolved) è in React: i giochi si possono inserire come pagine del sito. La fuga di Zucco è in HTML5 Canvas senza motore di gioco, e si monta in una pagina con una sola funzione.

## Classifiche

- Una classifica per gioco, con il miglior punteggio di ogni utente
- Classifica generale (somma dei piazzamenti o dei punti)
- Classifica settimanale, così anche chi arriva tardi può vincere qualcosa
- Il nickname mostrato è scelto dall'utente (filtro sulle parole offensive)

## Obiettivo di comunità

Un traguardo comune: la somma di quello che fanno tutti sblocca un premio per **tutti** quelli che vengono alla festa.

*Deciso il 2026-11-07.* Il traguardo è un **cesto della comunità** pieno di caramelle; ogni soglia raggiunta sblocca una ricompensa della comunità.

- Le **caramelle normali**, per esempio quelle di Zucco, vanno direttamente nel cesto appena guadagnate. Non restano sull'account e per ora non servono ad altro.
- Le **caramelle dorate**, quelle dei rompicapi dell'escape room, restano sull'account e servono a comprare indizi. Quando una dorata viene guadagnata, nel cesto si versano 100 caramelle; spenderla dopo non toglie nulla dal cesto.
- Le caramelle le conta il server, mai il numero mandato dal browser: in Zucco rigiocando la partita, nell'escape room a ogni rompicapo risolto.

| Idea di obiettivo | Premio sbloccato |
|---|---|
| es. 1.000.000 di caramelle nel cesto | es. shot gratis per tutti a mezzanotte |
| es. 10.000 partite giocate | es. ospite a sorpresa, show extra |
| es. traguardi intermedi (25%, 50%, 75%) | premi più piccoli, svelati a ogni traguardo |

- Barra di avanzamento ben visibile sul sito
- Annuncio sui social a ogni traguardo raggiunto ([06](../06_Marketing_e_Comunicazione/README.md))
- I biglietti venduti possono contare per l'obiettivo, così giocare e comprare spingono nella stessa direzione

## Premi

| Tipo | Esempi | Chi li può vincere |
|---|---|---|
| Classifica per gioco | Ingresso gratis, privé, bottiglia, gadget | Primi N di ogni gioco |
| Obiettivo di comunità | Drink, show, sorpresa | Tutti i presenti alla festa |
| Piccoli premi frequenti | Codice sconto sul biglietto, salto della fila | Chi raggiunge un certo punteggio |
| Premio finale dell'escape room | Da decidere | Chi risolve gli ultimi rompicapi della Sala del tesoro: il primo, i primi N o tutti, da decidere |

- I premi si possono far pagare agli sponsor ([11](../11_Sponsor_e_Partner/README.md)): uno sponsor per gioco, con il suo logo
- Per ritirare un premio servono un account e un **biglietto valido**: il premio è legato al QR e si ritira al bar o a un punto premi
- I premi alcolici solo a chi ha 18 anni compiuti (vale comunque per tutta la festa)
- Il costo dei premi va nel [budget](../02_Budget_e_Finanza/budget.csv)

## Anti-imbroglio

I punteggi dei giochi nel browser sono facili da falsificare: se in palio ci sono premi veri, qualcuno ci proverà.

- [ ] Il punteggio non si invia solo come numero: il server riceve i dati della partita (durata, eventi) e controlla che siano plausibili
- [ ] Sessione di gioco aperta dal server, con un token valido una sola volta
- [ ] Limite di partite al minuto e al giorno per utente
- [ ] Un account per persona (email verificata, eventualmente cellulare)
- [ ] Controllo manuale dei primi in classifica prima di assegnare i premi
- [ ] Nel regolamento: possiamo annullare punteggi sospetti

## Aspetti legali

> ⚠️ Assegnare premi tramite giochi per promuovere la festa può essere un **concorso a premio**. In Italia i concorsi a premio (DPR 430/2001) richiedono di norma la comunicazione preventiva al Ministero, un regolamento e una cauzione, con alcune esclusioni. Da verificare con il commercialista insieme ai temi della sezione [04](../04_Legale_e_Permessi/README.md), **prima** di annunciare i premi.

- Regolamento dei giochi pubblicato sul sito
- Privacy: i nickname sono pubblici, i dati personali no

## Tempi

| Quando | Cosa |
|---|---|
| Entro marzo 2027 | Scelti i giochi e i premi, verifica legale sui concorsi |
| Apr – Lug 2027 | Sviluppo dei giochi, delle classifiche e dell'obiettivo di comunità |
| Agosto 2027 | Test, anche anti-imbroglio |
| Settembre 2027 | Giochi online insieme all'apertura delle vendite |
| Ottobre 2027 | Un gioco nuovo o un evento speciale a metà mese per rilanciare |
| Alla festa | Consegna dei premi, annuncio dei vincitori dal palco |

## Checklist

- [ ] Scelti i giochi
- [ ] Definito l'obiettivo di comunità e i traguardi
- [ ] Definiti i premi e chi li paga
- [ ] Verifica legale sui concorsi a premio
- [ ] Regolamento scritto
- [ ] Giochi sviluppati e testati
- [ ] Sistema di ritiro dei premi alla festa pronto
