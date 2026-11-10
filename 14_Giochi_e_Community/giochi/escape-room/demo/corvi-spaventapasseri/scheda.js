// Generata dal catalogo dei rompicapi (collection enigmi, scheda «corvi-spaventapasseri») il 10/11/2026. Non modificare a mano:
// se il testo cambia nel catalogo, si rigenera.
EscapeDemo.scheda({
  "id": "corvi-spaventapasseri",
  "titolo": "I corvi dello spaventapasseri",
  "stanza": "Cancello",
  "ordine": 12,
  "difficolta": 4,
  "dorate": 4,
  "erroriConcessi": 2,
  "meccanica": "Gioco contro il gioco",
  "origine": "il Nim nella versione «misère» (Charles Bouton, 1901)",
  "enigma": "I corvi dello spaventapasseri sono appollaiati su quattro pali del cortile. A turno tu e lo spaventapasseri fate volare via quanti corvi volete, almeno uno, ma da un palo solo. Chi fa volare via l'ultimo corvo del cortile si prende la maledizione e perde. Cominci tu. Lo spaventapasseri non sbaglia mai.",
  "indizi": "Scrivi i corvi di ogni palo come somma di pacchetti da 1, 2, 4 e 8.\nDopo la tua mossa ogni pacchetto deve comparire un numero pari di volte, contando tutti i pali.\nVerso la fine la regola cambia: quando restano solo pali con un corvo, lasciane un numero dispari.",
  "soluzione": "Si vince solo con la strategia del Nim misère. Si scrivono i corvi di ogni palo in binario (pacchetti da 1, 2, 4, 8) e si fa lo xor, cioè si guarda se ogni pacchetto compare un numero pari o dispari di volte: dopo ogni tua mossa ogni pacchetto deve comparire un numero pari di volte. Fa eccezione il finale: quando la tua mossa lascerebbe solo pali con un corvo, ne devi lasciare un numero dispari.\nEsempio: con 2, 5, 6 e 8 corvi si fanno volare via 7 corvi dal palo da 8 (restano 2, 5, 6, 1: ogni pacchetto compare due volte o nessuna).\nVerificato con un risolutore su tutte le 330 posizioni con quattro pali fino a 7 corvi: la regola non sbaglia mai. Le partite date ai giocatori partono sempre da una posizione vincente per chi comincia, quindi si può vincere, ma basta una mossa sbagliata e lo spaventapasseri, che gioca perfetto, non perdona.",
  "varianti": "Pali e corvi diversi per ogni giocatore: quattro pali da 1 a 9 corvi, sempre con lo xor diverso da zero, così chi comincia può vincere. Quando lo spaventapasseri è in una posizione persa fa volare via un corvo dal palo più alto, per non regalare indizi.",
  "rischi": "La regola del finale è quella che frega: va scritta chiara nell'enigma. Il Nim normale (chi prende l'ultimo vince) si trova ovunque online; il misère molto meno.",
  "note": "Proposto da Claude il 10/11/2026, da approvare. Conta come errore: perdere la partita; si riparte con pali nuovi."
});
