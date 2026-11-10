// Generata dal catalogo dei rompicapi (collection enigmi, scheda «caramella-solitaria») il 10/11/2026. Non modificare a mano:
// se il testo cambia nel catalogo, si rigenera.
EscapeDemo.scheda({
  "id": "caramella-solitaria",
  "titolo": "La caramella solitaria",
  "stanza": "Sala del tesoro",
  "ordine": 31,
  "difficolta": 5,
  "dorate": 5,
  "erroriConcessi": 3,
  "meccanica": "Solitario a salti",
  "origine": "il solitario inglese a 33 buche (alla corte di Luigi XIV, fine Seicento)",
  "enigma": "Sul tavolo del tesoro c'è una tavola a croce con 33 buche, e in tutte tranne quella centrale c'è una caramella dorata. Una caramella può saltare sopra una vicina, in orizzontale o in verticale, e finire nella buca vuota subito dopo: quella scavalcata si mangia. Mangia le caramelle finché ne resta una sola, e deve restare proprio nella buca centrale.",
  "indizi": "Svuota un braccio della croce alla volta, partendo dalle punte.\nCi sono gruppi di salti che tolgono tre caramelle in fila e lasciano tutto il resto come prima: imparali e usali come mattoni.\nLascia per ultima la zona attorno al centro.",
  "soluzione": "Si può fare, in 31 salti (ogni salto mangia una caramella: da 32 a 1). Verificato con una ricerca completa che ricorda le posizioni senza uscita, anche girate e specchiate: trova la soluzione in pochi millisecondi.\nIl gioco controlla solo le regole del salto e la posizione dell'ultima caramella.",
  "varianti": "Buca vuota di partenza e buca finale diverse per giocatore, tutte verificate (colonne a-g, righe 1-7 dal basso): vuota d4, finale d4 (la classica); vuota d7, finale d1; vuota d7, finale d4; vuota c7, finale c4; vuota d6, finale d3; vuota c5, finale c5; vuota e4, finale b4.",
  "rischi": "Senza un modo di tornare indietro è frustrante: serve «annulla l'ultimo salto» gratis. La soluzione della versione classica si trova online: le partenze diverse la rendono inutile.",
  "note": "Proposto da Claude il 10/11/2026, da approvare. Conta come errore: ricominciare da capo o arrivare a una posizione senza salti con più di una caramella."
});
