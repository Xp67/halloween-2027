// Generata dal catalogo dei rompicapi (collection enigmi, scheda «pista-si-spegne») il 10/11/2026. Non modificare a mano:
// se il testo cambia nel catalogo, si rigenera.
EscapeDemo.scheda({
  "id": "pista-si-spegne",
  "titolo": "La pista che si spegne",
  "stanza": "Sala principale",
  "ordine": 20,
  "difficolta": 4,
  "dorate": 4,
  "erroriConcessi": 2,
  "meccanica": "Luci da spegnere",
  "origine": "il gioco delle luci che si spengono a croce (Merlin, 1978; Lights Out, 1995)",
  "enigma": "La pista da ballo è fatta di 25 piastrelle luminose, cinque per cinque, e qualcuno l'ha lasciata accesa a metà. Pestando una piastrella cambiano lei e le quattro vicine (sopra, sotto, a destra e a sinistra): le accese si spengono e le spente si accendono. Spegni tutta la pista prima che il DJ se ne accorga: hai un numero limitato di passi.",
  "indizi": "L'ordine in cui pesti non conta, e pestare due volte la stessa piastrella è come non pestarla.\nSe pesti solo sotto le luci accese, riga dopo riga, le luci rimaste finiscono tutte nell'ultima riga.\nDa come resta l'ultima riga si capisce quali piastrelle della prima riga andavano pestate all'inizio.",
  "soluzione": "Ogni pista è creata pestando piastrelle a caso sulla pista spenta, quindi si può sempre spegnere (una pista accesa a caso si spegnerebbe solo una volta su quattro). Il server calcola il minimo di passi con l'algebra delle luci: un sistema di 25 equazioni in modulo 2 con 2 incognite libere, quindi le soluzioni sono sempre 4 e si prende la più corta. Sulle piste generate il minimo va da 2 a 15 (media 10); si tengono quelle fra 9 e 13, con limite il minimo più 6.\nPestare due volte la stessa piastrella non serve mai e l'ordine non conta. Un metodo sicuro è «inseguire le luci» (per ogni luce accesa si pesta la piastrella sotto, riga dopo riga, poi da come resta l'ultima riga si capisce quali piastrelle della prima andavano pestate); così però si fanno più passi del necessario, e per stare nel limite bisogna ragionare.",
  "varianti": "Pista diversa per ogni giocatore, generata e misurata dal server.",
  "rischi": "Il limite di passi va provato con qualcuno: senza limite il rompicapo è solo lungo, con un limite troppo stretto diventa una lotteria.",
  "note": "Proposto da Claude il 10/11/2026, da approvare. Conta come errore: superare il limite di passi; la pista si riaccende come all'inizio."
});
