// Generata dal catalogo dei rompicapi (collection enigmi, scheda «clessidre-fungo») il 10/11/2026. Non modificare a mano:
// se il testo cambia nel catalogo, si rigenera.
EscapeDemo.scheda({
  "id": "clessidre-fungo",
  "titolo": "Le clessidre del fungo",
  "stanza": "Area Fumatori",
  "ordine": 28,
  "difficolta": 4,
  "dorate": 4,
  "erroriConcessi": 2,
  "meccanica": "Clessidre",
  "origine": "i problemi delle clessidre (le raccolte di enigmi a tempo, fra cui Martin Gardner)",
  "enigma": "Il fungo riscaldante dell'area fumatori deve restare acceso esattamente 15 minuti: uno in meno e i fumatori gelano, uno in più e la bombola esplode. Sul tavolino ci sono due clessidre, da 7 e da 11 minuti. Il fungo si accende quando giri la prima clessidra. Puoi girare le clessidre solo quando una delle due si svuota, e devi spegnere il fungo nel momento giusto.",
  "indizi": "Non serve che una clessidra sia vuota per girarla: conta quanta sabbia è già scesa.\nQuando la grande finisce, nella piccola sono scesi dei minuti precisi.\n15 è la clessidra grande più un pezzo della piccola.",
  "soluzione": "Al via si girano tutte e due. A 7′ si svuota la piccola: la si gira. A 11′ si svuota la grande: si gira di nuovo la piccola, che in 4 minuti ha fatto scendere 4 minuti di sabbia e ora li rimette sopra. A 15′ la piccola si svuota: si spegne il fungo.\nVerificato con una ricerca su tutte le possibilità (a ogni clessidra che si svuota: girare l'una, l'altra, tutte e due o nessuna). Il gioco salta da un evento al successivo, senza minuti veri da aspettare.",
  "varianti": "Clessidre e tempi diversi per giocatore, tutti verificati e scelti fra quelli in cui una clessidra va girata a metà (la ricerca dà il numero minimo di giri): 7 e 11 per 15, 5 e 11 per 14, 6 e 11 per 15, 7 e 9 per 17, 9 e 11 per 19, 7 e 13 per 18, 9 e 11 per 21, 4 e 7 per 9.",
  "rischi": "4 e 7 per 9 è il più famoso: meglio darlo poco. Il tempo va mostrato bene: per ogni clessidra la sabbia sopra e sotto, e il minuto in cui siamo.",
  "note": "Proposto da Claude il 10/11/2026, da approvare. Conta come errore: spegnere il fungo al minuto sbagliato."
});
