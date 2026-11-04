# 05 · Biglietteria

Come si vendono gli ingressi e come si controllano alla porta.

## Decisione: sito di vendita nostro

*Decisa il 2026-11-03.*

- Vendita da un **sito web nostro**, con pagamento tramite **gateway di pagamento**.
- **Biglietto digitale** con **codice QR** univoco.
- **Android**: pulsante "Aggiungi a Google Wallet".
- **iPhone**: biglietto in **PDF** (con il QR), niente Apple Wallet.

> ⚠️ **Da verificare subito con il commercialista.** In Italia i biglietti delle serate danzanti e di intrattenimento sono "titoli di accesso" fiscali. Di norma vanno emessi da un **sistema di biglietteria automatizzata** approvato (con carta di attivazione SIAE) e comunicati all'Agenzia delle Entrate. Un QR generato dal nostro sito, da solo, potrebbe **non** essere un titolo valido. Le strade possibili:
>
> 1. Il nostro sito vende e incassa, ma il titolo fiscale lo emette un **sistema certificato** collegato via API (molti operatori di biglietteria lo offrono).
> 2. Se la festa è in un **club**, il titolo lo emette il sistema del locale e il nostro sito fa da canale di prevendita.
> 3. Ci si dota di un proprio sistema di biglietteria automatizzata (costoso, ha senso solo per più eventi).
>
> La risposta cambia l'architettura del sito, quindi va avuta **prima** di iniziare lo sviluppo.

## Base esistente: progetto GetInvolved

C'è già un progetto con lo stesso scopo (vendere i biglietti dei propri eventi), da usare come punto di partenza: `C:\Users\marco\GetInvolved`. Ultime modifiche ad aprile 2026, dominio previsto `getinvolvd.com`.

| Parte | Cosa c'è |
|---|---|
| Backend | Django + Django REST Framework, login con JWT, PostgreSQL |
| Frontend | React 19 + Vite + Material UI, tema chiaro/scuro |
| Deploy | Docker Compose (frontend, backend, db), API su `api.getinvolvd.com`; README con istruzioni per Cloud Run |
| Funzioni | Registrazione utente, login, creazione/elenco/eliminazione eventi (titolo, descrizione, luogo) |

**Fatto il 2026-11-03** (branch `feature/biglietteria`, istruzioni in `GetInvolved\TICKETING.md`): fasce di prezzo con passaggio automatico, blocco a capienza, pagamento Stripe Checkout con biglietti emessi solo dal webhook, QR univoco (UUID), PDF, email, pagina "i miei biglietti", scanner da telefono con modalità offline e ricerca per nome, rimborsi dall'admin. 12 test automatici superati.

**Ancora da fare:** programma PR, Google Wallet, omaggi/accrediti, cassa all'ingresso, pagina vendite per l'organizzatore, giochi.

Un tentativo precedente in WordPress (`Google Drive\getinvolved`, 2023) contiene solo un plugin vuoto e un tema base. L'unica cosa utile è la tabella utenti già pensata: nickname, nome, cognome, genere, cellulare, email, data di nascita. La data di nascita serve anche per il controllo 18+.

## Come funziona

```
Cliente sul sito ─▶ sceglie fascia e quantità ─▶ paga sul gateway
                                                     │
                                       conferma del pagamento (webhook)
                                                     │
                  ┌──────────────────────────────────┼──────────────────────────────┐
                  ▼                                  ▼                              ▼
     biglietto salvato nel database        email con PDF + QR        link "Aggiungi a Google Wallet"
     (ID univoco, stato: valido)           (tutti, iPhone compresi)  (Android)

Serata: app di scansione ─▶ legge il QR ─▶ controlla nel database ─▶ valido → "usato" / già usato → respinto
```

Il biglietto si genera **solo** alla conferma del pagamento ricevuta dal gateway (webhook), mai al ritorno dalla pagina di pagamento: altrimenti si emettono biglietti non pagati.

## Gateway di pagamento

| Gateway | Commissioni | Note |
|---|---|---|
| Stripe | ~1,5% + 0,25 € (carte europee) | Checkout pronto, Apple Pay / Google Pay inclusi, webhook affidabili |
| PayPal | più alte | Molti lo vogliono, si può offrire in aggiunta |
| Satispay | basse | Molto usato in Italia dai giovani |
| SumUp / Nexi / banca | variabili | Da valutare se si usa già il loro POS al bar |

Commissioni da verificare al momento dell'attivazione e da inserire nel [budget](../02_Budget_e_Finanza/budget.csv).

## Requisiti del sito

**Vendita**
- [x] Fasce di prezzo con quantità limitate che passano da sole alla successiva
- [x] Limite di biglietti per ordine
- [ ] Programma PR: link personale e codice sconto personalizzabile (vedi [Programma PR](#programma-pr))
- [x] Nome del titolare sul biglietto (scoraggia il bagarinaggio e serve se il titolo fiscale è nominativo)
- [x] Blocco delle vendite al raggiungimento della capienza legale
- [x] Gestione dei pagamenti doppi o falliti

**Biglietto**
- [x] ID univoco non indovinabile (UUID o codice firmato), mai numeri progressivi
- [x] PDF con QR, nome, fascia, data, orario e indirizzo
- [ ] Email di conferma con il PDF allegato e il link a Google Wallet
- [x] Pagina "i miei biglietti" o link per scaricarlo di nuovo

**Google Wallet**
- [ ] Account Issuer su Google Pay & Wallet Console (l'approvazione richiede qualche settimana: chiederla presto)
- [ ] Progetto Google Cloud con account di servizio e Google Wallet API attiva
- [ ] Una classe `EventTicketClass` per l'evento e un `EventTicketObject` per biglietto, con lo stesso codice del QR
- [ ] Pulsante "Aggiungi a Google Wallet" (link con JWT firmato) nell'email e nella pagina di conferma
- [ ] Se il biglietto viene annullato o rimborsato, aggiornare anche l'oggetto in Wallet

**Apple (solo PDF)**
- [ ] Il PDF si apre e si legge bene da iPhone (QR grande, contrasto alto)
- Apple Wallet richiede un account Apple Developer a pagamento: si potrà aggiungere in futuro, se serve

**Legale**
- [ ] Termini e condizioni di vendita
- [ ] Informativa privacy (GDPR) e cookie
- [ ] Politica di rimborso e di cambio nome. Per gli eventi a data fissa non c'è il diritto di recesso di 14 giorni, ma va scritto chiaramente
- [ ] Dati dell'organizzatore (forma fiscale, vedi [04](../04_Legale_e_Permessi/README.md))

**Sicurezza e affidabilità**
- [ ] HTTPS, nessun dato di carta sul nostro server (lo gestisce il gateway)
- [ ] Test di carico prima dell'apertura early bird: è il momento di maggior traffico
- [ ] Backup del database

## Struttura dei prezzi

| Fascia | Periodo | Quantità | Prezzo |
|---|---|---|---|
| Early bird | apertura vendite → esaurimento | | |
| Prevendita 1 | | | |
| Prevendita 2 | | | |
| Ingresso in cassa | la sera | | |
| Ridotto in costume (se previsto) | | | |
| Tavolo / privé | | | |

Le fasce che salgono di prezzo e si esauriscono creano urgenza: aiutano la vendita anticipata, e la vendita anticipata dà cassa per pagare gli acconti.

## Programma PR

*Deciso il 2026-11-03.* Chiunque può **registrarsi sul sito e diventare PR**. Porta clienti in due modi:

1. **Link personale**, es. `sito.it/?pr=nomepr`
2. **Codice sconto personale e personalizzabile**, scelto dal PR (es. `GIULIA10`), da dire a voce o scrivere nelle storie

```
Utente si registra ─▶ diventa PR ─▶ sceglie il suo codice ─▶ riceve link + codice
                                                                    │
Cliente apre il link (il PR viene ricordato con un cookie)  oppure  inserisce il codice al checkout
                                                                    │
                                   pagamento confermato ─▶ vendita attribuita al PR ─▶ provvigione maturata
```

### Da decidere

| Voce | Opzioni | Decisione |
|---|---|---|
| Cosa ottiene il cliente | Sconto con il codice / nessuno sconto con il link / sconto in entrambi i casi | |
| Cosa ottiene il PR | Provvigione in € per biglietto, oppure biglietti omaggio, oppure entrambi | |
| Livelli | Provvigione che sale con le vendite (es. dopo 10, 25, 50 biglietti) | |
| Premi | Premio extra ai PR che vendono di più (privé, bottiglia, ingresso gratis) | |
| Approvazione | Chiunque diventa PR subito, oppure richiesta approvata da noi | |
| Durata del cookie del link | es. 30 giorni | |
| Link e codice insieme | Se il cliente arriva dal link di A e usa il codice di B, vince il codice (consigliato) | |
| Pagamento delle provvigioni | Quando (dopo la festa, a rimborsi chiusi) e come (bonifico) | |

### Requisiti del sito

**Registrazione e account**
- [ ] Registrazione con email verificata e accettazione del regolamento PR
- [ ] Dati necessari per pagare le provvigioni (nome, codice fiscale, IBAN), chiesti solo quando si supera la soglia per il pagamento
- [ ] Possibilità per noi di sospendere un PR

**Codice personalizzabile**
- [ ] Univoco, senza distinzione tra maiuscole e minuscole
- [ ] Solo lettere e numeri, lunghezza 4-15 caratteri
- [ ] Parole vietate: offensive, nomi di marchi, codici che sembrano ufficiali (`STAFF`, `ADMIN`, `FREE`, `OMAGGIO`, `GRATIS`)
- [ ] Modificabile, ma le vendite restano attribuite al PR e il vecchio codice resta bloccato per non essere preso da altri

**Dashboard del PR**
- [ ] Link e codice da copiare con un tocco, QR del link da mostrare
- [ ] Clic sul link, biglietti venduti, provvigioni maturate e pagate
- [ ] Classifica dei PR (stimola la competizione)
- [ ] Grafiche già pronte per storie e post (da [06](../06_Marketing_e_Comunicazione/README.md))

**Pannello per noi**
- [ ] Vendite per PR, provvigioni da pagare, esportazione per i pagamenti
- [ ] Biglietti emessi con e senza PR, per misurare quanto rende il programma

### Abusi da prevenire

- **Autoacquisto:** il PR compra con il proprio codice per avere sconto e provvigione. Bloccarlo (stesso account o stessa email), o almeno non pagare la provvigione
- **Codice sui siti di coupon:** chiunque lo trova e lo usa. Mettere un tetto agli usi del codice, o lo sconto solo sulle prime fasce
- **Rimborsi:** se un biglietto viene rimborsato, la provvigione si annulla. Per questo si paga **dopo** la festa
- **Account multipli** della stessa persona per scalare la classifica

### Aspetti fiscali

> ⚠️ Pagare provvigioni a persone esterne è un compenso da dichiarare. Di solito si usa la **prestazione occasionale con ritenuta d'acconto** (servono codice fiscale e ricevuta firmata), con limiti di importo annuo. Pagare in biglietti omaggio è più semplice ma va comunque gestito. Da chiarire con il commercialista insieme alla questione dei titoli fiscali, e da scrivere nel **regolamento PR**.

## Omaggi e accrediti

- Omaggi: emessi dal sito come biglietti a 0 €, con tetto massimo e chi li autorizza
- Accrediti per staff, artisti e fornitori: tipo di biglietto separato

## Controllo accessi la sera

- **App di scansione** da telefono, collegata al database: segna il biglietto come usato e respinge i duplicati
- **Modalità offline**: elenco dei biglietti scaricato prima di aprire, nel caso la connessione cada nel locale
- Più dispositivi in contemporanea senza far passare lo stesso QR due volte
- Ricerca per nome, per chi ha il telefono scarico
- Braccialetti diversi per tipo di ingresso (normale, privé, staff)
- Contatore in tempo reale delle persone entrate (capienza legale)
- Cassa per chi compra all'ingresso: vendita dal sito stesso con POS, oppure contanti con titolo emesso sul posto
- Politica di rientro (si può uscire e rientrare?)

## Tempi

| Quando | Cosa |
|---|---|
| Entro gennaio 2027 | Risposta del commercialista sui titoli fiscali, scelta del gateway |
| Febbraio 2027 | Richiesta dell'account Issuer Google Wallet |
| Mar – Giu 2027 | Sviluppo del sito, dei biglietti e dell'app di scansione |
| Luglio 2027 | Test completi (pagamenti reali, Wallet, PDF su iPhone, scansione), test di carico |
| Agosto 2027 | Sito online con "save the date" e iscrizione alla lista d'attesa |
| Settembre 2027 | Apertura early bird |
| Ottobre 2027 | Prova generale della scansione con lo staff |

## Checklist

- [ ] Chiarita la questione del titolo fiscale con il commercialista
- [ ] Scelto il gateway e attivato l'account
- [ ] Account Issuer Google Wallet approvato
- [ ] Sito sviluppato e testato
- [ ] Testi legali pubblicati
- [ ] Definite fasce e prezzi (coerenti con [02](../02_Budget_e_Finanza/README.md))
- [ ] Aperte le vendite
- [ ] Regolamento PR scritto e pubblicato
- [ ] Programma PR attivo, con almeno 2 settimane di anticipo sull'early bird per far registrare i PR
- [ ] Provvigioni pagate dopo la festa
- [ ] App di scansione testata, anche offline
- [ ] Organizzato l'ingresso: dispositivi, braccialetti, cassa
