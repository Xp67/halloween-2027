// Generata dal catalogo dei rompicapi (collection enigmi, scheda «lucchetto-lapidi») il 10/11/2026. Non modificare a mano:
// se il testo cambia nel catalogo, si rigenera.
EscapeDemo.scheda({
  "id": "lucchetto-lapidi",
  "titolo": "Il lucchetto delle lapidi",
  "stanza": "Cancello",
  "ordine": 11,
  "difficolta": 4,
  "dorate": 4,
  "erroriConcessi": 2,
  "meccanica": "Codice da indovinare",
  "origine": "Mastermind (Mordecai Meirowitz, 1970), dal vecchio gioco «tori e vacche»",
  "enigma": "Il cancello è chiuso da un lucchetto con quattro rotelle. Su ognuna si sceglie uno dei sei simboli incisi sulle lapidi del cortile (teschio, croce, luna, pipistrello, ragno, candela), e lo stesso simbolo può tornare più volte. A ogni tentativo il lucchetto accende delle candele: una nera per ogni simbolo giusto al posto giusto, una bianca per ogni simbolo giusto ma al posto sbagliato. Hai sei tentativi.\nAttenzione: il lucchetto è stregato e la combinazione non l'ha ancora decisa. Finché può cambia idea per farti sbagliare, ma non mente mai: le sue candele sono sempre giuste per almeno una combinazione.",
  "indizi": "Non partire con quattro simboli diversi: due coppie di simboli dicono di più.\nTieni l'elenco delle combinazioni ancora possibili e cancella quelle che non darebbero le stesse candele a tutti i tentativi fatti.\nA volte conviene provare una combinazione che sai già sbagliata, se divide meglio quelle rimaste.",
  "soluzione": "Non c'è una combinazione fissa. Il lucchetto tiene vive tutte le combinazioni che darebbero le stesse candele ai tentativi fatti e a ogni tentativo risponde con le candele che ne lasciano di più. Si apre quando ne resta una sola e la si prova.\nCon una buona strategia bastano sempre 5 tentativi: verificato con l'algoritmo di Knuth su tutte le 1.296 combinazioni, contro un lucchetto che sceglie sempre la risposta peggiore. Si apre con due simboli a coppie (es. teschio, teschio, croce, croce: restano al massimo 256 combinazioni; con quattro simboli diversi 312, con quattro uguali 625), poi ogni volta si sceglie il tentativo il cui caso peggiore lascia meno combinazioni. Giocando a caso, il lucchetto cattivo fa finire i sei tentativi.",
  "varianti": "La partita è diversa per ognuno: il lucchetto risponde ai tentativi del giocatore, quindi copiare i tentativi di un altro non apre niente. Si possono anche cambiare i simboli fra giocatori (sei fra otto disegni di lapide).",
  "rischi": "Il lucchetto che «cambia idea» va spiegato bene, o sembra un imbroglio: la frase chiave è che le candele sono sempre giuste. L'elenco delle combinazioni ancora vive sta sul server e non deve mai arrivare al browser.",
  "note": "Proposto da Claude il 10/11/2026, da approvare. Conta come errore: finire i sei tentativi senza aprire; si riparte con il lucchetto azzerato."
});
