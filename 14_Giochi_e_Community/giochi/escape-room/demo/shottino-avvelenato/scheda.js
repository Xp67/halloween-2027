// Generata dal catalogo dei rompicapi (collection enigmi, scheda «shottino-avvelenato») il 10/11/2026. Non modificare a mano:
// se il testo cambia nel catalogo, si rigenera.
EscapeDemo.scheda({
  "id": "shottino-avvelenato",
  "titolo": "Lo shottino avvelenato",
  "stanza": "Sala Bar",
  "ordine": 24,
  "difficolta": 4,
  "dorate": 4,
  "erroriConcessi": 2,
  "meccanica": "Assaggiatori",
  "origine": "l'indovinello delle bottiglie avvelenate e degli assaggiatori (la ricerca con i numeri binari)",
  "enigma": "Sul bancone ci sono 16 shottini. Uno è avvelenato: chi lo assaggia, anche solo un goccio, fra un'ora diventa verde. Hai quattro pipistrelli assaggiatori e una sola ora: ogni pipistrello può assaggiare tutti gli shottini che vuoi, ma gli assaggi si fanno adesso, tutti insieme. Decidi chi assaggia cosa; fra un'ora guarderai chi è diventato verde e dovrai dire qual è lo shottino avvelenato.",
  "indizi": "Un pipistrello può assaggiare anche otto shottini.\nCon quattro pipistrelli, in quanti modi diversi possono diventare verdi?\nC'è uno shottino che non deve assaggiarlo nessuno.",
  "soluzione": "Ogni shottino deve avere un gruppo di assaggiatori diverso da tutti gli altri. Con quattro pipistrelli i gruppi possibili sono esattamente 16 (2 × 2 × 2 × 2), compreso quello vuoto: uno shottino non lo assaggia nessuno. Si numerano gli shottini da 0 a 15 in binario e il pipistrello k assaggia quelli che hanno 1 nella cifra k; i pipistrelli verdi scrivono in binario il numero dello shottino.\nIl gioco controlla l'assegnazione: se due shottini hanno gli stessi assaggiatori, mette il veleno proprio in uno di quei due e il giocatore non può sapere quale. Altrimenti il veleno è a caso, e il giocatore deve indicare lo shottino giusto.",
  "varianti": "Il veleno cambia per ogni giocatore. Per un rompicapo di contorno: 8 shottini e 3 pipistrelli.",
  "rischi": "Assegnare gli assaggi sul telefono è laborioso (16 shottini per 4 pipistrelli): serve una griglia comoda, una spunta per casella. La versione con 1.000 bottiglie e 10 prigionieri si trova online: l'idea si passa, ma va comunque applicata.",
  "note": "Proposto da Claude il 10/11/2026, da approvare. Conta come errore: indicare lo shottino sbagliato. Se due shottini hanno gli stessi assaggiatori il gioco lo fa vedere dopo l'ora, quando non si possono più distinguere."
});
