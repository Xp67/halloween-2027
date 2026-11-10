// Generata dal catalogo dei rompicapi (collection enigmi, scheda «casse-deposito») il 10/11/2026. Non modificare a mano:
// se il testo cambia nel catalogo, si rigenera.
EscapeDemo.scheda({
  "id": "casse-deposito",
  "titolo": "I bauli del deposito",
  "stanza": "Deposito",
  "ordine": 17,
  "difficolta": 4,
  "dorate": 4,
  "erroriConcessi": 2,
  "meccanica": "Spingere casse",
  "origine": "i rompicapi delle casse da spingere (il genere nato con Sokoban, 1982), con un livello nostro",
  "enigma": "Nel deposito quattro bauli di costumi sono finiti lontano dai loro segni di gesso sul pavimento. Riportali sui segni. La zucca li può solo spingere, uno alla volta, e mai tirare: un baule finito in un angolo non esce più.",
  "indizi": "Prima di spingere, guarda quali bauli possono arrivare a quali segni senza finire contro un muro.\nL'ordine conta: un baule spinto troppo presto chiude la strada agli altri.\nIl segno più lontano va riempito per primo.",
  "soluzione": "Livello trovato da un generatore che parte dai bauli sui segni e li tira all'indietro: la disposizione più lontana chiede 43 spinte nel modo migliore (ricontrollato con una ricerca in avanti su 56.680 posizioni). Pianta, 10×9 (# muro, $ baule, . segno, @ zucca):\n##########\n#    #. ##\n# $#    ##\n#@$  #   #\n# $#     #\n##      ##\n##$     .#\n#      ..#\n##########\nIl gioco controlla solo che alla fine i bauli siano sui segni.",
  "varianti": "Altri due livelli verificati, da usare come varianti o per un rompicapo di contorno: 10×8 con tre bauli (34 spinte) e 9×8 con quattro (34 spinte). Il generatore ne trova altri in qualche minuto.",
  "rischi": "Un livello fisso ha una soluzione che si può passare (una sequenza di spinte). Il numero di spinte non dice quanto il livello sia difficile da capire: va provato da persone. Serve «annulla l'ultima mossa» gratis.",
  "note": "Proposto da Claude il 10/11/2026, da approvare. Conta come errore: ricominciare il livello. Diverso dalle casse della consolle (blocchi scorrevoli): qui si spinge e basta."
});
