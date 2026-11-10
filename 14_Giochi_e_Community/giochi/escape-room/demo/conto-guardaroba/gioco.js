// Il conto del guardaroba: un criptaritmo. Ogni lettera del conto è una cifra; il giocatore appende a ogni lettera
// uno dei dieci gettoni numerati (0-9) e poi paga. La logica (applica) è separata dal disegno.

(function () {
  "use strict";
  const { C, rett, riquadro, retino, sprite, testo } = EscapeDemo;

  // ── I 45 conti: [a, b, c, cifre di a, cifre di b, cifre di c] ──
  const POOL = [
    ["TESCHIO", "TRUCCO", "SCHERZO", "5863790", "514330", "6378120"], // 0
    ["NEBBIA", "OMBRA", "BRIVIDO", "981127", "45107", "1026234"], // 1
    ["MUMMIA", "TRUCCO", "VAMPIRO", "242250", "784339", "1026589"], // 2
    ["STREGHE", "TORTA", "SPIRITO", "8375295", "31736", "8407031"], // 3
    ["SPIRITO", "TERRORE", "ARTIGLI", "2594931", "3844148", "6439079"], // 4
    ["NOTTE", "OMBRA", "CRANIO", "86557", "63249", "149806"], // 5
    ["STREGA", "STREGHE", "TESCHIO", "568217", "5682132", "6250349"], // 6
    ["NOTTE", "STREGHE", "SCHERZO", "20665", "4695315", "4715980"], // 7
    ["MOSTRO", "NOTTE", "TESCHIO", "976147", "87110", "1063257"], // 8
    ["MOSTRO", "ZOMBIE", "SPIRITO", "561976", "865320", "1427296"], // 9
    ["MOSTRO", "STRIGE", "ARTIGLI", "697849", "784203", "1482052"], // 10
    ["MOSTRO", "SPIRITO", "STREGHE", "491569", "1076759", "1568328"], // 11
    ["CRIPTA", "NOTTI", "SPETTRO", "958026", "74228", "1032254"], // 12
    ["DOLCE", "TRUCCO", "CANDELA", "86314", "972116", "1058430"], // 13
    ["SCHERZO", "TRUCCO", "TESCHIO", "7563140", "812550", "8375690"], // 14
    ["MORTO", "TERRORE", "CANDELA", "61741", "4977179", "5038920"], // 15
    ["SPETTRO", "TERRORE", "ARTIGLI", "1847726", "7422624", "9270350"], // 16
    ["CORVO", "TERRORE", "CANDELA", "61741", "5977179", "6038920"], // 17
    ["NEBBIA", "STREGA", "STREGHE", "948837", "105427", "1054264"], // 18
    ["CATENE", "CIOCCO", "ARTIGLI", "814505", "827887", "1642392"], // 19
    ["CATENE", "CRANIO", "SPIRITO", "923060", "952674", "1875734"], // 20
    ["LAPIDE", "SPIRITO", "TERRORE", "429513", "6958570", "7388083"], // 21
    ["DIAVOLO", "MUMMIA", "VAMPIRO", "7608191", "434460", "8042651"], // 22
    ["DIAVOLO", "NEBBIA", "BRIVIDO", "8501636", "749950", "9251586"], // 23
    ["STREGHE", "TRUCCO", "TESCHIO", "4520310", "527886", "5048196"], // 24
    ["DENTI", "TERRORE", "CANDELA", "79641", "4988289", "5067930"], // 25
    ["ARTIGLI", "STREGA", "SPETTRO", "6352492", "753046", "7105538"], // 26
    ["ARTIGLI", "MUMMIA", "TERRORE", "4856716", "232264", "5088980"], // 27
    ["ARTIGLI", "TERRORE", "SPETTRO", "5834704", "3288682", "9123386"], // 28
    ["ARTIGLI", "MOSTRI", "TERRORE", "7982302", "516892", "8499194"], // 29
    ["NOTTI", "SPETTRO", "STREGHE", "41778", "2697731", "2739509"], // 30
    ["MOSTRI", "SPETTRO", "STREGHE", "582671", "2096678", "2679349"], // 31
    ["MOSTRI", "SPIRITO", "STREGHE", "548627", "8072764", "8621391"], // 32
    ["GHOUL", "STREGHE", "SPETTRO", "76289", "4053763", "4130052"], // 33
    ["FESTE", "SCHERZO", "STREGHE", "89539", "5279640", "5369179"], // 34
    ["FESTE", "SPIRITO", "TESCHIO", "50340", "3986842", "4037182"], // 35
    ["CIOCCO", "MOSTRO", "BRIVIDO", "420440", "905830", "1326270"], // 36
    ["CIOCCO", "CRIPTA", "TESCHIO", "678668", "647910", "1326578"], // 37
    ["CIOCCO", "LAPIDE", "TERRORE", "720770", "934286", "1655056"], // 38
    ["CIOCCO", "STREGHE", "SPETTRO", "542552", "7360810", "7903362"], // 39
    ["CIOCCO", "ZOMBIE", "SCHERZO", "368338", "982460", "1350798"], // 40
    ["CIOCCO", "ZOMBIE", "BRIVIDO", "349339", "896140", "1245479"], // 41
    ["CAPPA", "TESCHIO", "TERRORE", "16556", "3071924", "3088480"], // 42
    ["CAPPA", "CRIPTA", "STREGHE", "96776", "935706", "1032482"], // 43
    ["CRANIO", "MUMMIA", "TERRORE", "538762", "494468", "1033230"], // 44
  ];

  // Controllo all'avvio: ogni voce deve tornare (somma giusta e una cifra per lettera).
  POOL.forEach(([a, b, c, na, nb, nc], i) => {
    const mappa = {};
    let ok = Number(na) + Number(nb) === Number(nc) && a.length === na.length && b.length === nb.length && c.length === nc.length;
    [[a, na], [b, nb], [c, nc]].forEach(([p, n]) => {
      for (let k = 0; k < p.length; k++) {
        if (mappa[p[k]] !== undefined && mappa[p[k]] !== n[k]) ok = false;
        mappa[p[k]] = n[k];
      }
    });
    if (new Set(Object.values(mappa)).size !== Object.keys(mappa).length) ok = false;
    if (!ok) console.error(`POOL: la voce ${i} (${a} + ${b} = ${c}) non torna`);
  });

  // ── Variante ──
  function generaVariante(rng) {
    const indice = Math.floor(rng() * POOL.length);
    const [a, b, c] = POOL[indice];
    return {
      indice, a, b, c,
      lettere: [...new Set(a + b + c)],
      iniziali: [...new Set([a[0], b[0], c[0]])],
    };
  }

  function testoDi(v) {
    return "Sul bancone del guardaroba lo scheletro ha lasciato il conto della serata, scritto in lettere:\n"
      + `${v.a} + ${v.b} = ${v.c}\n`
      + `Ogni lettera è una cifra, lettere diverse sono cifre diverse e nessun numero comincia con lo zero. Per ritirare il cappotto bisogna dire quanto fa ${v.c}.\n`
      + "Appendi a ogni lettera il gettone con la sua cifra, poi paga il conto.";
  }

  // ── Logica pura: stato + mossa → nuovo stato ed esito ──
  const numeroDi = (parola, ass) => parola.split("").map((L) => ass[L]).join("");
  const cifreDi = (v, ass) => v.lettere.map((L) => ass[L]).join("");

  /** @returns {{stato, esito, cambia: boolean}} */
  function applica(stato, m, v) {
    const rifiuta = (motivo, extra) => ({ stato, esito: { valida: false, motivo, ...(extra || {}) }, cambia: false });
    if (!m || typeof m !== "object") return rifiuta("mossa");
    const ass = { ...stato.assegnate };
    const nuovo = (extra) => ({ ...stato, assegnate: ass, ...(extra || {}) });
    switch (m.tipo) {
      case "appendi": {
        if (typeof m.lettera !== "string" || !v.lettere.includes(m.lettera)) return rifiuta("lettera");
        if (!Number.isInteger(m.cifra) || m.cifra < 0 || m.cifra > 9) return rifiuta("cifra");
        if (m.cifra === 0 && v.iniziali.includes(m.lettera)) return rifiuta("zero");
        const prima = ass[m.lettera];
        if (prima === m.cifra) return { stato: nuovo(), esito: { ok: true, tolta: null, liberata: null }, cambia: false };
        const tolta = v.lettere.find((L) => L !== m.lettera && ass[L] === m.cifra) ?? null;
        if (tolta) ass[tolta] = null;
        ass[m.lettera] = m.cifra;
        return { stato: nuovo(), esito: { ok: true, tolta, liberata: prima ?? null }, cambia: true, prima, tolta };
      }
      case "togli": {
        if (typeof m.lettera !== "string" || !v.lettere.includes(m.lettera)) return rifiuta("lettera");
        if (ass[m.lettera] === null) return rifiuta("vuota");
        const cifra = ass[m.lettera];
        ass[m.lettera] = null;
        return { stato: nuovo(), esito: { ok: true }, cambia: true, cifra };
      }
      case "svuota": {
        if (v.lettere.every((L) => ass[L] === null)) return rifiuta("vuota");
        v.lettere.forEach((L) => { ass[L] = null; });
        return { stato: nuovo(), esito: { ok: true }, cambia: true };
      }
      case "paga": {
        const mancano = v.lettere.filter((L) => ass[L] === null).length;
        if (mancano > 0) return rifiuta("incompleto", { mancano });
        const chiave = cifreDi(v, ass);
        if (stato.ultimoSbagliato !== null && chiave === stato.ultimoSbagliato) return rifiuta("uguale");
        const na = Number(numeroDi(v.a, ass)), nb = Number(numeroDi(v.b, ass)), nc = Number(numeroDi(v.c, ass));
        if (na + nb === nc) return { stato: nuovo({ pagato: true }), esito: { risolto: true }, cambia: true };
        return { stato: nuovo({ ultimoSbagliato: chiave }), esito: { errore: true, motivo: "conto" }, cambia: true };
      }
      default:
        return rifiuta("mossa");
    }
  }

  const opzioni = {
    id: "conto-guardaroba",
    sfondo: "ingresso",
    velo: 0.55,
    variante: generaVariante,
    crea,
  };
  // ── Sprite ──
  const PAL_SCHELETRO = { k: C.bordo, W: C.bianco, s: C.pietraChiara, S: C.pietra, n: C.nero, o: C.oro, O: C.oroScuro, r: C.tappetoChiaro, R: C.tappeto };
  const PAL_GETTONE = { k: C.bordo, w: C.bianco, y: C.giallo, o: C.oro, O: C.oroScuro };
  const PAL_USATO = { k: C.bordo, w: C.oro, y: C.oroScuro, o: C.legnoLuce, O: C.legnoChiaro };
  const PAL_SCELTO = { ...PAL_GETTONE, k: C.bianco };
  const PAL_OGGETTI = { k: C.bordo, W: C.bianco, w: C.bianco, s: C.pietraChiara, S: C.pietra, y: C.giallo, o: C.oro, O: C.oroScuro };
  const PAL_FIAMMA = { k: C.brace, y: C.fiamma, h: C.fiammaChiara };
  const PAL_VESTITI = { k: C.bordo, r: C.tappetoChiaro, R: C.tappeto, v: C.viola, V: C.violaScuro, q: C.lilla,
    h: C.fiammaChiara, y: C.fiamma, O: C.brace, o: C.oro, g: C.erba, G: C.erbaScura };
  const PAL_ZUCCO = { k: "#160f1e", o: "#9c3b17", O: "#d9661a", y: "#f59a2e", h: "#ffd07a", b: "#4a1a12", G: "#2d5a2e", g: "#5f9440",
    E: "#ffb52e", e: "#fff3b0", P: "#3f2a78", p: "#6a43b8", q: "#a47bf0", B: "#463a6a", L: "#7a6aa4", R: "#5e3c44", T: "#83575c" };

  // Il gettone del guardaroba: medaglietta d'ottone con il buco in alto (13×15)
  const GETTONE = [
    "....kkkkk....",
    "..kkwyyyokk..",
    ".kyyykkkooOk.",
    ".kyyk...kOOk.",
    "kyyyykkkooOOk",
    "kwyooooooooOk",
    "kyoooooooooOk",
    "kyoooooooooOk",
    "kyoooooooooOk",
    "kyoooooooooOk",
    "kyoooooooooOk",
    "kyoooooooooOk",
    ".kyoooooooOk.",
    "..kkOOOOOkk..",
    "....kkkkk....",
  ];

  // Lo scheletro dalla vita in su: spalle, braccia appoggiate, costole, colonna (41×40)
  const BUSTO = [
    "..................kssSk..................",
    "..................kWssk..................",
    "..................kssSk..................",
    "....kkkk..........kWssk..........kkkk....",
    "...kWWWWkkkkkkkkkkkssSkkkkkkkkkkkWWWWk...",
    "..kWsssssWWWWWWWWWWWWWWWWWWWWWWWsssssSk..",
    "..kWssssSsssssssssssSssssssssSSSsssssSk..",
    "..kWssssSkkkkkkkkkkWsSkkkkkkkkkksssssSk..",
    "..ksssssSk.kkkkkkkkWsSkkkkkkkk.ksssssSk..",
    "...kssssk..kkWWWWWWWsSsssssskk..kSSSSk...",
    "...kWssSk.kWWssssssWsSSSSSSSssk.kWssSk...",
    "...kWssSk.ksskkkkkkWsSkkkkkkSSk.kWssSk...",
    "...kWssSk..kkWWWWWWWsSsssssskk..kWssSk...",
    "...kWssSk.kWWssssssWsSSSSSSSssk.kWssSk...",
    "...kWssSk.ksskkkkkkWsSkkkkkkSSk.kWssSk...",
    "...kWssSk..kkkWWWWWWsSssssskkk..kWssSk...",
    "...kWssSk..kWWsssssWsSSSSSSssk..kWssSk...",
    "...kWssSk..ksskkkkkWsSkkkkkSSk..kWssSk...",
    "...kWssSk..kkkkWWWWWsSsssskkkk..kWssSk...",
    "...kWssSk..kkWWssssWsSSSSSsskk..kWssSk...",
    "...kWssSk..kksskkkkWsSkkkkSSkk..kWssSk...",
    "...kWssSk..kkkkkWWWWsSssskkkkk..kWssSk...",
    "...kWssSk..kkkWWsssssSSSSsskkk..kWssSk...",
    "...kWssSk..kkksskkkkskkkkSSkkk..kWssSk...",
    "...kWssSk..kkkkkkkkkSkkkkkkkkk..kWssSk...",
    "..kWsssssk.kkkkkkkkkskkkkkkkkk.kWsssssk..",
    "..kWssssSk.kkkkkkkkkskkkkkkkkk.kWssssSk..",
    "..kWssssSk.........kSk.........kWssssSk..",
    "...kWsSkk..........ksk..........kkWsSk...",
    "....kWsSk..........ksk..........kWsSk....",
    "....kWsSk..........kSk..........kWsSk....",
    ".....kWsSk.........ksk.........kWsSk.....",
    ".....kWsSk.........ksk.........kWsSk.....",
    "......kWsSk........kSk........kWsSk......",
    ".......kWsSk.......ksk.......kWsSk.......",
    ".......kWsSk.......ksk.......kWsSk.......",
    "........kWsSk......kSk......kWsSk........",
    "........kWsSk......ksk......kWsSk........",
    ".........kWsSk.....ksk.....kWsSk.........",
    "..........kWsSk....kSk....kWsSk..........",
  ];

  // Il cranio: occhiaie con il bagliore arancione (o), naso, denti di sopra (17×15)
  const CRANIO = [
    ".....kkkkkkk.....",
    "...kkWWWWWWWskk..",
    "..kWWWWWWWWWWssk.",
    ".kWWWWWWWWWWWWssk",
    ".kWWWWWWWWWWWWssk",
    ".kWkkkkkWkkkkksSk",
    "kWWkonnkWkonnksSk",
    "kWWknnnkWknnnksSk",
    "kWWknnnkWknnnkSSk",
    "kWWWkkkWWWkkkSSSk",
    ".kWWWWWknkWWWWSk.",
    ".kWWWWWkkkWWWSSk.",
    "..kWWWWWWWWWSSk..",
    "..kWkWkWkWkWkSk..",
    "..kkkkkkkkkkkkk..",
  ];

  // La mandibola: un pixel più giù quando lo scheletro parla (11×3)
  const MANDIBOLA = [
    "kWkWkWkWkSk",
    ".kWWWWWWSk.",
    "..kkkkkkk..",
  ];

  // Il papillon rosso (9×5)
  const PAPILLON = [
    "kk.....kk",
    "krk...kRk",
    "krrkrkRRk",
    "krk...kRk",
    "kk.....kk",
  ];

  // Il cappellino da guardarobiere, rosso con la fascia d'oro (15×7)
  const CAPPELLO = [
    "....kkkkkkk....",
    "...krrrrrrRk...",
    "...krrrrrrRk...",
    "...krrrrrRRk...",
    "..kkoooooOOkk..",
    ".kRRRRRRRRRRRk.",
    "..kkkkkkkkkkk..",
  ];

  // La mano sinistra appoggiata al bancone (la destra è la stessa specchiata) (11×6)
  const MANO = [
    "...kkkkk...",
    "..kWsssSk..",
    ".kWsssssSk.",
    "kWskskskSk.",
    "kWkWkWkWkk.",
    ".k.k.k.k...",
  ];

  // La mano che tamburella: un dito alzato (11×6)
  const MANO_TAMBURELLA = [
    "...kkkkk...",
    "..kWsssSk..",
    ".kWsssssSkk",
    "kWskskskSsk",
    "kWkWkWkWk.k",
    ".k.k.k.k...",
  ];

  // La candela nel candeliere d'ottone (9×15)
  const CANDELA = [
    "...kkk...",
    "..kWssk..",
    "..kWssk..",
    "..kWsSk..",
    "..kWsSk..",
    "..kWsSk..",
    "..kWsSk..",
    "..kWsSk..",
    ".kkkkkkk.",
    "kyoooooOk",
    ".kkoooOk.",
    "...kok...",
    "..kyoOk..",
    ".kyoooOk.",
    "kkkkkkkkk",
  ];

  // La fiamma della candela, tre fotogrammi (5×5 ciascuno)
  const FIAMME = [
    ["..k..", ".kyk.", "kyhyk", "kyhyk", ".kyk."],
    ["...k.", "..kyk", ".kyhk", "kyhyk", ".kyk."],
    [".k...", "kyk..", "khyk.", "kyhyk", ".kyk."],
  ];

  // Il campanello da banco (10×9)
  const CAMPANELLO = [
    "....kk....",
    "...kwyk...",
    "..kkkkkk..",
    ".kwyyyyOk.",
    "kwyyyyyoOk",
    "kyyoooooOk",
    "kkkkkkkkkk",
    "kOOOOOOOOk",
    "kkkkkkkkkk",
  ];

  // Il mantello da vampiro: colletto alto, fodera rossa, orlo a punte (19×35)
  const MANTELLO = [
    "....krrk...kRRk....",
    "...krrrk...kRRRk...",
    "...krrrkkkkkRRRk...",
    "...krrrVVVVVRRRk...",
    "...krrrVVVVVRRRk...",
    "...krrrvvRVVRRRk...",
    "....kqvvvRVVVVk....",
    "....kqvvvRVVVVk....",
    "....kqvvvRVVVVk....",
    "...kqvVvvRVVVVVk...",
    "...kqvVvvRVVVVVk...",
    "...kqvVvvRVVVVVk...",
    "..kqvVvvvRVVVVVVk..",
    "..kqvVvvvRVVVVVVk..",
    "..kqvVvvvRVVVVVVk..",
    ".kqvVvvvVRVVVVVVVk.",
    ".kqvVvvvVRVVVVVVVk.",
    ".kqvVvvvVRRVVVVVVk.",
    "kqvVvvvVvRRVVVVVVVk",
    "kqvVvvvVvRRVVVVVVVk",
    "kqvVvvvVvRRVVVVVVVk",
    "kqvVvvvVvRRVVVVVVVk",
    "kqvVvvvVvRRVVVVVVVk",
    "kqvVvvvVvRRVVVVVVVk",
    "kqvVvvvVvRRVVVVVVVk",
    "kqvVvvvVvRRVVVVVVVk",
    "kqvVvvvVvRRVVVVVVVk",
    "kqvVvvvVrRRVVVVVVVk",
    "kqvVvvvVrRRVVVVVVVk",
    "kqvVvvvVrRRVVVVVVVk",
    "kqvVvvvVrRRVVVVVVVk",
    "kqvVvvvVrRRVVVVVVVk",
    "kqkkkvkkkRkkkVkkkVk",
    "kqk.kvk.kRk.kVk.kVk",
    ".k...k...k...k...k.",
  ];

  // Il cappotto arancione da ritirare: maniche, revers, bottoni d'oro (19×34)
  const CAPPOTTO = [
    ".....k..k.k..k.....",
    "....kykkhkOkkyk....",
    "..kkyykkkkkkkyykk..",
    ".khyyhykkkkkOOOyOk.",
    ".khyyhykkkkkOOOyOk.",
    ".khyyhyykkkyOOOyOk.",
    ".khyyhyykkkyOOOyOk.",
    ".khykhyyykyyOOkyOk.",
    ".khykhyyykyyOOkyOk.",
    ".khykhyyyOyyOOkyOk.",
    ".khykhyyyOyyOOkyOk.",
    ".khykhyyyoyyOOkyOk.",
    ".khykhyyyOyyOOkyOk.",
    ".khykhyyyOyyOOkyOk.",
    ".khykhyyyOyyOOkyOk.",
    ".khykhyyyOyyOOkyOk.",
    ".khykhyyyoyyOOkyOk.",
    ".khykhyyyOyyOOkyOk.",
    ".khykhyyyOyyOOkyOk.",
    ".khykhyyyOyyOOkyOk.",
    ".khykhyyyOyyOOkyOk.",
    ".khykhyyyoyyOOkyOk.",
    ".khykhOOOOykkOkyOk.",
    ".khykhyyyOyyOOkyOk.",
    ".kookhyyyOyyOOkOok.",
    ".kookhyyyOyyOOkOOk.",
    "..kkkhyyyoyyOOkkk..",
    "....khyyyOyyOOk....",
    "....khyyyOyyOOk....",
    "....khyyyOyyOOk....",
    "....khyyyOyyOOk....",
    "....khyyyOyyOOk....",
    "....khyyyOyyOOk....",
    ".....kkkkkkkkk.....",
  ];

  // Il cappello da strega in cima alla piantana (15×13)
  const STREGA = [
    "..........kk...",
    ".........kgk...",
    "........kggk...",
    ".......kggGk...",
    "......kgggGk...",
    ".....kggggGk...",
    ".....kgggggGk..",
    "....kooooooOk..",
    "....kgggggggGk.",
    "kkkkgggggggggGk",
    "kgggggggggggGGk",
    ".kkGGGGGGGGGGk.",
    "..kkkkkkkkkkk..",
  ];

  // Zucco in piedi con la lanterna (dalla fuga di Zucco); si disegna specchiato (28×31)
  const ZUCCO = [
    "...............Gg...........",
    "..............GGg...........",
    "...........kkkkkkkkkk.......",
    "..........koOOyyyOOOok......",
    ".........koOOyyhyyOOOok.....",
    ".........koOyEEyyOEEOok.....",
    ".........koOEeeEyOEeeEk.....",
    ".........koOOEEOOEOEEOk.....",
    ".........koOOOOOEEOOOOk.....",
    ".........koObEbEbEbEbOk.....",
    ".........kooOeEeEeEeOok.....",
    "..........kooOOOOOOOok......",
    ".......kkkkkkkkkkkkkk.......",
    "......kqqpppppppk...........",
    ".....kqpppppppppPk..........",
    "....kqppppppppppPk.PPP......",
    "...kqpppPppppppPPk....kkk...",
    "..kqppPPkppppppPk.....kek...",
    "..kppPPk.kpppPPPk.....kEk...",
    "...kPk...kpPPPPk......kkk...",
    "....k.....kkkkk.............",
    "...........BB.LL............",
    "...........BB..LL...........",
    "............BB.LL...........",
    "............BB..LL..........",
    ".............BB.LL..........",
    ".............BB..LL.........",
    "............BB..LL..........",
    "...........BB...LL..........",
    ".........kRRRkkTTTk.........",
    ".........kkkkkkkkkk.........",
  ];

  // ── Geometria ──
  const COLONNE = 7;
  const RIGHE_Y = [44, 65, 91];
  const gx = (d) => 70 + 20 * d;

  function crea(g) {
    const v = g.variante;
    const parole = [v.a, v.b, v.c];
    const contoStr = `${v.a}+${v.b}=${v.c}`;
    opzioni.testo = testoDi(v);

    // Le celle del conto, riga per riga, da sinistra a destra.
    const celle = [];
    parole.forEach((w, riga) => {
      for (let i = 0; i < w.length; i++) {
        celle.push({ L: w[i], riga, cx: 116 + 14 * (COLONNE - w.length + i), cy: RIGHE_Y[riga] });
      }
    });

    // ── Stato ──
    let stato = {
      assegnate: Object.fromEntries(v.lettere.map((L) => [L, null])),
      ultimoSbagliato: null,
      pagato: false,
    };
    let selezione = null; // { lettera } | { cifra }
    let trascino = null; // { cifra, x, y }

    // Animazioni (fotogramma di partenza; null = spenta)
    let parlaF0 = -99;
    let dondolo = null; // { cifra, f0 }
    let trilloF0 = null;
    let erroreF0 = null, erroreT = -1e9;
    let vittoriaF0 = null;

    if (g.giaRisolto) {
      const voce = POOL[v.indice];
      const ass = {};
      [[voce[0], voce[3]], [voce[1], voce[4]], [voce[2], voce[5]]].forEach(([p, n]) => {
        for (let k = 0; k < p.length; k++) ass[p[k]] = Number(n[k]);
      });
      stato = { assegnate: Object.fromEntries(v.lettere.map((L) => [L, ass[L]])), ultimoSbagliato: null, pagato: true };
    } else if (g.memoria.conto === contoStr && g.memoria.assegnate) {
      const m = g.memoria.assegnate;
      stato = {
        assegnate: Object.fromEntries(v.lettere.map((L) => [L, Number.isInteger(m[L]) ? m[L] : null])),
        ultimoSbagliato: g.memoria.ultimoSbagliato ?? null,
        pagato: false,
      };
    }

    const dillo = (t) => { g.messaggio(t); parlaF0 = g.fotogramma; };
    const salva = () => {
      g.memoria.conto = contoStr;
      g.memoria.assegnate = { ...stato.assegnate };
      g.memoria.ultimoSbagliato = stato.ultimoSbagliato;
      g.salvaMemoria();
    };
    const mancanoOra = () => v.lettere.filter((L) => stato.assegnate[L] === null).length;
    const lettereAccusative = (n) => (n === 1 ? "Manca 1 gettone: ogni lettera vuole il suo." : `Mancano ${n} gettoni: ogni lettera vuole il suo.`);

    // ── La mossa: tocchi, bottoni, tastiera e gioca passano tutti da qui ──
    function mossa(m) {
      const prima = stato;
      const r = applica(stato, m, v);
      const { esito } = r;
      if (esito.valida === false) {
        if (esito.motivo === "zero") dillo("Lo zero non può stare in testa a un numero.");
        else if (esito.motivo === "vuota" && m.tipo === "svuota") dillo("Non c'è nessun gettone da togliere.");
        else if (esito.motivo === "incompleto") dillo(lettereAccusative(esito.mancano));
        else if (esito.motivo === "uguale") dillo("È lo stesso conto di prima: cambia qualche gettone.");
        return esito;
      }
      stato = r.stato;
      selezione = null;
      if (m.tipo === "appendi") {
        if (r.cambia) {
          dondolo = { cifra: m.cifra, f0: g.fotogramma };
          if (mancanoOra() === 0) dillo("Ogni lettera ha il suo gettone: quando sei pronto, paga.");
          else if (r.tolta) dillo(`Il gettone ${m.cifra} passa dalla ${r.tolta} alla ${m.lettera}.`);
          else dillo(`Appeso il gettone ${m.cifra} alla ${m.lettera}.`);
        }
        salva();
      } else if (m.tipo === "togli") {
        dillo(`Tolto il gettone ${r.cifra} dalla ${m.lettera}.`);
        salva();
      } else if (m.tipo === "svuota") {
        dillo("Tutti i gettoni tornano al loro gancio.");
        salva();
      } else if (m.tipo === "paga") {
        trilloF0 = g.fotogramma;
        if (esito.errore) {
          erroreF0 = g.fotogramma;
          erroreT = g.tempo;
          salva();
          dillo("Lo scheletro rifà la somma e scuote la testa.");
          g.errore("Il conto non torna");
        } else {
          const na = numeroDi(v.a, stato.assegnate), nb = numeroDi(v.b, stato.assegnate), nc = numeroDi(v.c, stato.assegnate);
          vittoriaF0 = g.riduciMovimento ? null : g.fotogramma;
          salva();
          dillo("Il conto torna! Lo scheletro ti ridà il cappotto.");
          g.risolto({ riepilogo: `${v.a} + ${v.b} = ${v.c}\n${na} + ${nb} = ${nc}`, ritardo: 1200 });
        }
      }
      void prima;
      return esito;
    }

    // ── Selezione con il tocco ──
    const gettoneDi = (L) => stato.assegnate[L];
    const lettereDelGettone = (d) => v.lettere.find((L) => stato.assegnate[L] === d) ?? null;
    function selezionaLettera(L) {
      selezione = { lettera: L };
      const d = gettoneDi(L);
      dillo(d === null ? `Lettera ${L}: tocca il gettone con la sua cifra.`
        : `La ${L} ha il gettone ${d}: toccane un altro, o lo stesso per toglierlo.`);
    }
    function selezionaGettone(d) {
      selezione = { cifra: d };
      const M = lettereDelGettone(d);
      dillo(M === null ? `Gettone ${d}: tocca la lettera a cui appenderlo.`
        : `Il gettone ${d} è sulla ${M}: tocca un'altra lettera per spostarlo.`);
    }
    function tocco(x, y) {
      const L = letteraIn(x, y);
      const d = L === null ? gettoneIn(x, y) : null;
      if (selezione === null) {
        if (L !== null) selezionaLettera(L);
        else if (d !== null) selezionaGettone(d);
      } else if (selezione.lettera !== undefined) {
        const M = selezione.lettera;
        if (L !== null) { if (L === M) selezione = null; else selezionaLettera(L); }
        else if (d !== null) {
          if (gettoneDi(M) === d) mossa({ tipo: "togli", lettera: M });
          else mossa({ tipo: "appendi", lettera: M, cifra: d });
        } else selezione = null;
      } else {
        const c = selezione.cifra;
        if (L !== null) {
          if (gettoneDi(L) === c) mossa({ tipo: "togli", lettera: L });
          else mossa({ tipo: "appendi", lettera: L, cifra: c });
        } else if (d !== null) { if (d === c) selezione = null; else selezionaGettone(d); }
        else selezione = null;
      }
    }
    function letteraIn(x, y) {
      for (const c of celle) if (x >= c.cx && x <= c.cx + 13 && y >= c.cy && y <= c.cy + 19) return c.L;
      return null;
    }
    function gettoneIn(x, y) {
      if (y < 119 || y > 152) return null;
      for (let d = 0; d < 10; d++) if (x >= gx(d) - 10 && x <= gx(d) + 9) return d;
      return null;
    }

    // ── Tocchi e trascinamenti ──
    let partenza = null; // { x, y, cifra }
    g.tocca((e) => {
      if (e.tipo === "giu") {
        partenza = { x: e.x, y: e.y, cifra: letteraIn(e.x, e.y) === null ? gettoneIn(e.x, e.y) : null };
        trascino = null;
      } else if (e.tipo === "muovi") {
        if (e.premuto && partenza && partenza.cifra !== null) {
          if (Math.hypot(e.x - partenza.x, e.y - partenza.y) >= 4 || trascino) trascino = { cifra: partenza.cifra, x: e.x, y: e.y };
        }
      } else if (e.tipo === "su") {
        if (!partenza) return;
        const lontano = Math.hypot(e.x - partenza.x, e.y - partenza.y) >= 4;
        const cifra = partenza.cifra;
        partenza = null;
        trascino = null;
        if (!lontano) tocco(e.x, e.y);
        else if (cifra !== null) {
          const L = letteraIn(e.x, e.y);
          if (L !== null) mossa({ tipo: "appendi", lettera: L, cifra });
          selezione = null;
        }
      }
    });

    // ── Tastiera (facoltativa) ──
    addEventListener("keydown", (e) => {
      if (e.ctrlKey || e.metaKey || e.altKey || g.stato().risolto) return;
      if (document.querySelector(".kit-velo-carta:not([hidden])")) return;
      const k = e.key;
      if (k === "Enter") {
        if (e.target && e.target.tagName === "BUTTON") return;
        mossa({ tipo: "paga" });
      } else if (k === "Backspace" || k === "Delete") {
        if (selezione && selezione.lettera !== undefined) mossa({ tipo: "togli", lettera: selezione.lettera });
      } else if (/^[0-9]$/.test(k)) {
        if (selezione && selezione.lettera !== undefined) {
          const M = selezione.lettera, d = Number(k);
          if (gettoneDi(M) === d) mossa({ tipo: "togli", lettera: M });
          else mossa({ tipo: "appendi", lettera: M, cifra: d });
        }
      } else if (/^[a-zA-Z]$/.test(k) && v.lettere.includes(k.toUpperCase())) {
        const L = k.toUpperCase();
        if (selezione && selezione.lettera === L) selezione = null; else selezionaLettera(L);
      }
    });

    g.bottone("Paga", () => mossa({ tipo: "paga" }), { id: "paga", forte: true });
    g.bottone("Svuota", () => mossa({ tipo: "svuota" }), { id: "svuota" });
    g.messaggio(g.giaRisolto ? "Il conto è pagato: il cappotto è tuo." : "Tocca una lettera del conto, poi il gettone con la sua cifra.");

    // ── Disegno ──
    function disegnaAttaccapanni(ctx, cappottoY) {
      rett(ctx, C.bordo, 286, 52, 5, 64); rett(ctx, C.legnoChiaro, 287, 52, 3, 64); rett(ctx, C.legnoLuce, 287, 52, 1, 64);
      for (const x of [277, 291]) {
        rett(ctx, C.bordo, x, 55, 10, 3); rett(ctx, C.legnoLuce, x + 1, 56, 8, 1);
        const punta = x === 277 ? x : x + 9;
        rett(ctx, C.bordo, punta - 1, 51, 3, 6); rett(ctx, C.legnoLuce, punta, 52, 1, 4);
      }
      sprite(ctx, MANTELLO, PAL_VESTITI, 269, 54);
      sprite(ctx, CAPPOTTO, PAL_VESTITI, 290, cappottoY);
      riquadro(ctx, 285, 48, 7, 5, C.legnoChiaro);
      sprite(ctx, STREGA, PAL_VESTITI, 281, 38);
    }

    function disegnaBancone(ctx) {
      rett(ctx, C.bordo, 0, 115, 320, 7);
      rett(ctx, C.legnoLuce, 0, 116, 320, 1);
      rett(ctx, C.legnoChiaro, 0, 117, 320, 3);
      rett(ctx, C.legno, 0, 120, 320, 1);
      rett(ctx, C.legno, 0, 122, 320, 58);
      rett(ctx, C.bordo, 0, 122, 320, 1);
      for (const [x, w] of [[10, 42], [268, 42]]) {
        rett(ctx, C.legnoScuro, x, 127, w, 1); rett(ctx, C.legnoScuro, x, 127, 1, 50);
        rett(ctx, C.legnoChiaro, x + 1, 176, w - 1, 1); rett(ctx, C.legnoChiaro, x + w - 1, 128, 1, 49);
      }
      rett(ctx, C.legnoScuro, 56, 125, 208, 30);
      rett(ctx, C.bordo, 56, 125, 208, 1);
      riquadro(ctx, 58, 122, 204, 4, C.oroScuro);
      rett(ctx, C.oro, 59, 123, 202, 1);
    }

    function disegnaTavoletta(ctx) {
      riquadro(ctx, 96, 18, 128, 101, C.legnoChiaro);
      rett(ctx, C.legnoLuce, 97, 19, 126, 1); rett(ctx, C.legnoLuce, 97, 19, 1, 99);
      rett(ctx, C.legno, 222, 20, 1, 98); rett(ctx, C.legno, 98, 117, 125, 1);
      rett(ctx, C.bordo, 99, 21, 122, 92);
      rett(ctx, C.luna, 100, 22, 120, 89);
      retino(ctx, C.luna, C.fiammaChiara, 212, 22, 8, 89, 0.35);
      for (let x = 100; x < 220; x += 4) rett(ctx, C.luna, x, 111, 2, 1);
      riquadro(ctx, 148, 15, 24, 9, C.ferroChiaro);
      rett(ctx, C.pietraChiara, 149, 16, 22, 1); rett(ctx, C.ferro, 149, 22, 22, 1);
      riquadro(ctx, 157, 12, 6, 5, C.pietra);
      testo(ctx, "CONTO", 104, 26, { colore: C.bordo, ombra: null });
      testo(ctx, "GUARDAROBA", 104, 35, { colore: C.legnoChiaro, ombra: null, piccolo: true });
      for (let x = 104; x <= 215; x += 2) rett(ctx, C.pietra, x, 42, 1, 1);
      testo(ctx, "+", 106, 75, { colore: C.bordo, ombra: null });
      rett(ctx, C.bordo, 104, 87, 112, 2);
    }

    function disegnaCelle(ctx, rossa, sotto) {
      for (const c of celle) {
        const { L, cx, cy, riga } = c;
        const sel = selezione && selezione.lettera === L;
        const d = stato.assegnate[L];
        if (sel) { rett(ctx, C.viola, cx + 1, cy, 12, 20); rett(ctx, C.lilla, cx + 2, cy + 1, 10, 18); }
        const inchiostro = sel ? C.bianco : C.bordo;
        if (rossa && riga === 2 && d !== null) rett(ctx, C.tappetoChiaro, cx + 2, cy + 9, 11, 10);
        testo(ctx, L, cx + 5, cy + 1, { colore: inchiostro, ombra: null });
        if (d !== null) {
          testo(ctx, String(d), cx + 5, cy + 10, { colore: sel || (rossa && riga === 2) ? C.bianco : C.tappeto, ombra: null });
        } else {
          for (let k = 0; k < 4; k++) rett(ctx, sel ? C.bianco : C.pietra, cx + 3 + 3 * k, cy + 18, 2, 1);
        }
        if (sotto === L) {
          rett(ctx, C.oro, cx, cy, 14, 1); rett(ctx, C.oro, cx, cy + 19, 14, 1);
          rett(ctx, C.oro, cx, cy, 1, 20); rett(ctx, C.oro, cx + 13, cy, 1, 20);
        }
      }
    }

    function disegnaGettoni(ctx, dondolaX) {
      for (let d = 0; d < 10; d++) {
        const x = gx(d);
        const L = lettereDelGettone(d);
        const scelto = selezione && selezione.cifra === d;
        const su = scelto ? 3 : 0;
        const inMano = trascino && trascino.cifra === d;
        const ox = dondolo && dondolo.cifra === d ? dondolaX : 0;
        if (!inMano) {
          sprite(ctx, GETTONE, scelto ? PAL_SCELTO : L !== null ? PAL_USATO : PAL_GETTONE, x - 6 + ox, 127 - su);
        }
        rett(ctx, C.pietraChiara, x, 124, 1, 6 - su);
        rett(ctx, C.ferro, x, 130 - su, 1, 1);
        if (inMano) continue;
        testo(ctx, String(d), x - 2 + ox, 132 - su, { colore: C.legnoScuro, ombra: L === null ? C.giallo : C.oroScuro });
        if (L !== null) {
          const lil = selezione && selezione.lettera === L;
          rett(ctx, C.pietraChiara, x + ox, 142, 1, 1);
          riquadro(ctx, x - 4 + ox, 143, 9, 9, lil ? C.lilla : C.luna);
          testo(ctx, L, x + ox, 145, { piccolo: true, colore: lil ? C.bianco : C.bordo, ombra: null, allinea: "centro" });
        }
      }
    }

    g.anima(() => {
      const ctx = g.ctx;
      const rid = g.riduciMovimento;
      const f = Math.max(0, g.fotogramma);
      ctx.clearRect(0, 0, g.larghezza, g.altezza);

      // eventi
      const fDond = dondolo ? f - dondolo.f0 : 99;
      const dondolaX = !rid && fDond >= 0 && fDond < 4 ? [1, 0, -1, 0][fDond] : 0;
      const fTrillo = trilloF0 === null ? 99 : f - trilloF0;
      const trilla = !rid && fTrillo >= 0 && fTrillo < 4;
      let rossa = false, nonTorna = false, dxTesta = 0;
      if (erroreF0 !== null) {
        if (rid) {
          rossa = nonTorna = g.tempo - erroreT < 1500;
        } else {
          const fe = f - erroreF0;
          rossa = [0, 1, 3, 4].includes(fe);
          nonTorna = fe >= 0 && fe < 12;
          if (fe >= 0 && fe < 6) dxTesta = [-1, 1, -1, 1, 0, 0][fe];
        }
      }
      const fv = vittoriaF0 === null ? null : f - vittoriaF0;
      const lampo = fv !== null && fv <= 0;
      const pagato = stato.pagato && !lampo;
      const cappottoY = !stato.pagato ? 55 : fv === null ? 49 : Math.max(49, 55 - 2 * Math.max(0, fv));
      const luccica = stato.pagato && !rid && (fv === null || fv >= 2);
      const zuccoDy = fv !== null && fv >= 0 && fv < 8 && !rid ? [0, -2, -3, -2, 0, -2, -3, -2][fv] : 0;

      const dy = rid ? 0 : Math.floor(f / 6) % 2;
      const parla = !rid && [0, 2].includes(f - parlaF0);
      const palScheletro = { ...PAL_SCHELETRO, o: rid || f % 6 < 3 ? C.oro : C.fiamma };
      const tamburella = !rid && [0, 2].includes(f % 32);
      const bx = 22, by = 76;

      // 1. attaccapanni
      disegnaAttaccapanni(ctx, cappottoY);
      // 2. scheletro
      sprite(ctx, BUSTO, palScheletro, bx, by + dy);
      sprite(ctx, CRANIO, palScheletro, bx + 12 + dxTesta, by - 15 + dy);
      sprite(ctx, MANDIBOLA, palScheletro, bx + 15 + dxTesta, by - 1 + dy + (parla ? 1 : 0));
      sprite(ctx, PAPILLON, palScheletro, bx + 16, by + 3 + dy);
      sprite(ctx, CAPPELLO, palScheletro, bx + 13 + dxTesta, by - 20 + dy);
      // 3. bancone
      disegnaBancone(ctx);
      // 4. mani
      sprite(ctx, MANO, palScheletro, bx + 7, 112);
      sprite(ctx, tamburella ? MANO_TAMBURELLA : MANO, palScheletro, bx + 23, 112, { specchia: true });
      // 5. candela e campanello
      sprite(ctx, CANDELA, PAL_OGGETTI, 75, 104);
      sprite(ctx, FIAMME[rid ? 0 : [0, 1, 0, 2][f % 4]], PAL_FIAMMA, 77, 99);
      const cxTrillo = trilla ? [1, -1, 1, -1][fTrillo] : 0;
      sprite(ctx, CAMPANELLO, PAL_OGGETTI, 230 + cxTrillo, 110);
      if (trilla) testo(ctx, "DRIN", 235, 102, { piccolo: true, colore: C.giallo, allinea: "centro" });
      // 6. tavoletta, conto, timbri
      disegnaTavoletta(ctx);
      const sotto = trascino ? letteraIn(trascino.x, trascino.y) : null;
      disegnaCelle(ctx, rossa, sotto);
      if (nonTorna) {
        rett(ctx, C.tappetoChiaro, 155, 24, 62, 11); rett(ctx, C.luna, 156, 25, 60, 9);
        testo(ctx, "NON TORNA", 186, 26, { colore: C.tappetoChiaro, ombra: null, allinea: "centro" });
      }
      if (lampo) rett(ctx, C.bianco, 177, 24, 40, 11);
      if (pagato) {
        rett(ctx, C.erba, 177, 24, 40, 11); rett(ctx, C.luna, 178, 25, 38, 9);
        testo(ctx, "PAGATO", 197, 26, { colore: C.erba, ombra: null, allinea: "centro" });
      }
      // 7. gettoni
      disegnaGettoni(ctx, dondolaX);
      // luccichii del cappotto (sopra il cappotto, prima di Zucco)
      if (luccica) {
        [[288, 52], [310, 60], [309, 78], [288, 74]].forEach(([sx, sy], k) => {
          if ((f + 2 * k) % 8 >= 3) return;
          rett(ctx, C.giallo, sx - 1, sy, 3, 1); rett(ctx, C.giallo, sx, sy - 1, 1, 3);
          rett(ctx, C.bianco, sx, sy, 1, 1);
        });
      }
      // 8. Zucco
      sprite(ctx, ZUCCO, PAL_ZUCCO, 280, 121 + zuccoDy, { specchia: true });
      // 9. il gettone trascinato
      if (trascino) {
        const px = Math.round(trascino.x), py = Math.round(trascino.y);
        sprite(ctx, GETTONE, PAL_SCELTO, px - 6, py - 7);
        testo(ctx, String(trascino.cifra), px - 2, py - 2, { colore: C.legnoScuro, ombra: C.giallo });
      }
    });

    // ── Aggancio per le prove ──
    g.espone({
      gioca: (m) => mossa(m),
      statoGioco: () => ({
        conto: contoStr,
        assegnate: { ...stato.assegnate },
        mancano: mancanoOra(),
        selezione: selezione ? { ...selezione } : null,
        ultimoSbagliato: stato.ultimoSbagliato,
        pagato: stato.pagato,
      }),
      posizioneLettera: (L) => {
        const c = celle.find((q) => q.L === L);
        return c ? { x: c.cx + 7, y: c.cy + 10 } : null;
      },
      posizioneGettone: (d) => ({ x: gx(d), y: 134 }),
    });
  }
  EscapeDemo.avvia(opzioni);
})();
