// Generata dal catalogo dei rompicapi (collection enigmi, scheda «lanterna-cortile») il 10/11/2026. Non modificare a mano:
// se il testo cambia nel catalogo, si rigenera.
EscapeDemo.scheda({
  "id": "lanterna-cortile",
  "titolo": "La lanterna del cortile",
  "stanza": "Cancello",
  "ordine": 13,
  "difficolta": 4,
  "dorate": 4,
  "erroriConcessi": 2,
  "meccanica": "Attraversamento",
  "origine": "il problema del ponte e della torcia (anni Ottanta, poi diventato una domanda classica dei colloqui)",
  "enigma": "Cinque mostri devono attraversare il cortile buio fino alla porta dell'ingresso, e c'è una sola lanterna. Si cammina al massimo in due, sempre con la lanterna, e la coppia va al passo del più lento; poi qualcuno deve riportare indietro la lanterna. Il fantasma ci mette 1 minuto, la strega 2, lo zombie 7, la mummia 11 e lo scheletro con la gamba di legno 15. La lanterna si spegne dopo 30 minuti.",
  "indizi": "Il più veloce che accompagna tutti non basta.\nI due più lenti devono attraversare insieme.\nPerché passino insieme, dall'altra parte deve già aspettare qualcuno di veloce che riporti la lanterna.",
  "soluzione": "30 minuti, il minimo esatto:\n1. vanno fantasma e strega (2)\n2. torna il fantasma (1)\n3. vanno mummia e scheletro (15)\n4. torna la strega (2)\n5. vanno fantasma e zombie (7)\n6. torna il fantasma (1)\n7. vanno fantasma e strega (2)\nTotale 2 + 1 + 15 + 2 + 7 + 1 + 2 = 30. La strategia che viene in mente subito, il fantasma che accompagna uno alla volta, fa 38. Verificato con un risolutore (cammino minimo su tutti gli stati).",
  "varianti": "Tempi diversi per giocatore, tutti verificati con il risolutore (minimo; fra parentesi la strategia «uno alla volta»): 1-3-6-8-12 in 29 (32), 1-2-6-9-13 in 27 (33), 1-3-4-9-11 in 26 (30), 2-3-7-9-14 in 34 (39), 1-4-5-10-12 in 31 (34), 1-2-7-11-15 in 30 (38). Il limite della lanterna è sempre il minimo esatto.",
  "rischi": "Il classico con quattro persone (1, 2, 5, 10 in 17 minuti) si trova ovunque: con cinque mostri e tempi nostri la soluzione non si copia. È un attraversamento come l'ascensore del privé: se si tengono tutti e due, meglio in stanze lontane.",
  "note": "Proposto da Claude il 10/11/2026, da approvare. Conta come errore: la lanterna che si spegne (superato il limite) o ricominciare."
});
