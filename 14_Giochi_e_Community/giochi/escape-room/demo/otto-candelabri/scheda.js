// Generata dal catalogo dei rompicapi (collection enigmi, scheda «otto-candelabri») il 10/11/2026. Non modificare a mano:
// se il testo cambia nel catalogo, si rigenera.
EscapeDemo.scheda({
  "id": "otto-candelabri",
  "titolo": "Gli otto candelabri",
  "stanza": "Ingresso",
  "ordine": 15,
  "difficolta": 4,
  "dorate": 4,
  "erroriConcessi": 2,
  "meccanica": "Pezzi che non si vedono",
  "origine": "il problema delle otto regine (Max Bezzel, 1848)",
  "enigma": "Il pavimento dell'ingresso è una scacchiera di otto file per otto. Bisogna posare otto candelabri in modo che nessuno veda un altro: le fiammelle si guardano lungo la propria fila, la propria colonna e le due diagonali. Due candelabri sono già posati e inchiodati al pavimento. Quando tutti e otto sono a posto, accendili: se due si vedono, si spengono.",
  "indizi": "Ogni fila e ogni colonna deve avere esattamente un candelabro.\nParti dalle file in cui i due candelabri fissi lasciano meno caselle libere.\nSe resti bloccato, torna indietro di una sola fila e prova la casella dopo.",
  "soluzione": "Le disposizioni possibili sono 92. I due candelabri fissi sono scelti in modo che ne resti una sola: 308 coppie di caselle fanno così (verificato elencando tutte le 92 disposizioni; con un candelabro fisso solo ne restano sempre almeno 4).\nEsempio: con i candelabri fissi in a8 ed e7 l'unica soluzione è a8, e7, h6, f5, c4, g3, b2, d1.\nIl gioco controlla le regole, non una risposta salvata.",
  "varianti": "Coppia di candelabri fissi diversa per ogni giocatore, fra le 308 che lasciano una sola soluzione.",
  "rischi": "Le 92 soluzioni si trovano online, ma con due pezzi fissi bisogna comunque cercare quella giusta. Sul telefono la scacchiera 8×8 deve avere caselle grandi abbastanza da toccare senza sbagliare.",
  "note": "Proposto da Claude il 10/11/2026, da approvare. Conta come errore: accendere con candelabri che si vedono (si spengono quelli che si vedono, così si capisce dove si è sbagliato)."
});
