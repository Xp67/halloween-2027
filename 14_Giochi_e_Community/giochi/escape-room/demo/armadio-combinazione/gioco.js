// L'armadio a combinazione: demo del rompicapo del Deposito (vedi ISTRUZIONI.md).
// Gli sprite a lettere dell'armadio a combinazione (vedi ISTRUZIONI.md §5.7).
// Sono dati puri: gioco.js li legge da window.ArmadioSprite.
(function () {
  "use strict";

  const ZUCCO_BUSTO = [
    ".........Gg...........",
    "........GGg...........",
    ".....kkkkkkkkkk.......",
    "....koOOyyyOOOok......",
    "...koOOyyhyyOOOok.....",
    "...koOyEEyyOEEOok.....",
    "...koOEeeEyOEeeEk.....",
    "...koOOEEOOEOEEOk.....",
    "...koOOOOOEEOOOOk.....",
    "...koObEbEbEbEbOk.....",
    "...kooOeEeEeEeOok.....",
    "....kooOOOOOOOok......",
    "....kkkkkkkkkkkk......",
    "...kqqppppppppPPk.....",
    "..kqppppppppppPPPk....",
    "..kqppppppppppPPPkP...",
    "..kpppppppPpppPPPk.P..",
    "..kpppppppPpppPPPk.kkk",
    "..kpppppppPppPPPPk.kuk",
    "...kppppppPpPPPPk..kUk",
    "...kkppppppPPPPkk..kkk",
    ".....kkkkkkkkkk.......",
  ];

  const ZUCCO_GAMBE = [
    "......kBBk.kLLk.......",
    "......kBBk.kLLk.......",
    "......kBBk.kLLk.......",
    "......kBBk.kLLk.......",
    ".....kRRRk.kTTTk......",
    ".....kkkkk.kkkkk......",
  ];

  const CAPPELLO = [
    "..................kk....",
    "................kkVk....",
    "..............kkVVk.....",
    ".............kVVvk......",
    "............kVVvvk......",
    "...........kVVVvvk......",
    "..........kVVVVvvk......",
    ".........kVVVVVvvvk.....",
    "........kOooooooOOk.....",
    ".......kVVVVVVVVvvvk....",
    "...kkkkVVVVVVVVVvvvvkkk.",
    "..kVVVVVVVVVVVVVVVVvvvvk",
    "...kkkkkkkkkkkkkkkkkkkk.",
  ];

  const RAGNO = [
    "k.......k",
    ".k.kkk.k.",
    "..kfffk..",
    "kkfrfrfkk",
    "..kfffk..",
    ".k.kkk.k.",
    "k.......k",
  ];

  const ARCO = [
    "....kkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkk....",
    "...kpssssssssssssssssssssssssssssssssssspk...",
    "..kfpsssssssssssssssssssssssssssssssssssppk..",
    ".ksfpppfffffffffffffffffffffffffffffffppppfk.",
    "kpsfpppkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkppppfpk",
    "kpsfppk...............................kpppfpk",
    "kpsfpk.................................kppfpk",
    "kpsfk...................................kpfpk",
    "kpsfk...................................kpfpk",
    "kpsfk...................................kpfpk",
    "kpsfk...................................kpfpk",
    "kpsfk...................................kpfpk",
    "kpsfk...................................kpfpk",
    "kpsfk...................................kpfpk",
    "kpsfk...................................kpfpk",
    "kpsfk...................................kpfpk",
    "kpsfk...................................kpfpk",
    "kpsfk...................................kpfpk",
    "kpsfk...................................kpfpk",
    "kpsfk...................................kpfpk",
    "kpsfk...................................kpfpk",
    "kpsfk...................................kpfpk",
    "kpsfk...................................kpfpk",
    "kpsfk...................................kpfpk",
    "kpsfk...................................kpfpk",
    "kpsfk...................................kpfpk",
    "kpsfk...................................kpfpk",
    "kpsfk...................................kpfpk",
    "kpsfk...................................kpfpk",
    "kpsfk...................................kpfpk",
  ];

  const ALI_0 = [
    "k....................k",
    "kk..................kk",
    "kak......k..k......kak",
    "kaak.....kkkk.....kaak",
    "kaaak...kAAAAk...kaaak",
    ".kaaak.kAxAAxAk.kaaak.",
    "..kaaakkAAAAAAkkaaak..",
    "...kaaakAAccAAkaaak...",
    "....kkk.kAAAAk.kkk....",
    ".........kkkk.........",
  ];

  const ALI_1 = [
    "......................",
    ".........k..k.........",
    ".........kkkk.........",
    "...kkkk.kAAAAk.kkkk...",
    ".kkaaaakAxAAxAkaaaakk.",
    "kaaaaaakAAAAAAkaaaaaak",
    "kakaakakAAccAAkakaakak",
    ".k.kk.k.kAAAAk.k.kk.k.",
    ".........kkkk.........",
    "......................",
  ];

  const ALI_2 = [
    ".........k..k.........",
    ".........kkkk.........",
    "........kAAAAk........",
    "......kkAxAAxAkk......",
    "....kkaaAAAAAAaakk....",
    "...kaaaaAAccAAaaaak...",
    "..kaaak.kAAAAk.kaaak..",
    ".kaak....kkkk....kaak.",
    ".kak..............kak.",
    ".kk................kk.",
  ];

  const SCHELETRO_0 = [
    ".......kkkkkkkkk.kwwwk.",
    "......kwwwwwwwwwkkwwwk.",
    ".....kwwwwwwwwwwwkkwk..",
    ".....kwwwwwwwwwWwkkwk..",
    ".....kwwnnwwwnnWwkkwk..",
    ".....kwwnnwwwnnWwkkwk..",
    ".....kwwwwwnwwwWwkkwk..",
    ".....kwwwwwnwwwWwkkwk..",
    ".....kwwwwwwwwwWwkkk...",
    "......kwwwwwwwWwkkwk...",
    "......kwnwnwnwnwkkwk...",
    ".......kkkkwkkkk.kwk...",
    "..........kwk....kwk...",
    ".....kkkkkkwkkkkkkwk...",
    "....kwwwwwwwwwwwwwwk...",
    "...kwkkkkkkwkkkkkkk....",
    "...kwkkwwwwwwwwwk......",
    "...kwk.kkkkwkkkk.......",
    "...kwkkwwwwwwwwwk......",
    "...kwk.kkkkwkkkk.......",
    "...kwkkwwwwwwwwwk......",
    "...kwk.kkkkwkkkk.......",
    "...kwk.kwwwwwwwk.......",
    "...kwk..kkkwkkk........",
    "...kwk....kwk..........",
    "....k.....kwk..........",
    "...kwk....kwk..........",
    "...kwk....kwk..........",
    "...kwk....kwk..........",
    "...kwk....kwk..........",
    "...kwk.kkkkwkkkk.......",
    "...kwkkwwwwwwwWWk......",
    "...kwkkwwwwnwwWWk......",
    "...kwkkwwwwwwwWWk......",
    "..kwwwkkkkkkkkkk.......",
    "..kwwwkkwk...kwk.......",
    "...kkk.kwk...kwk.......",
    ".......kwk...kwk.......",
    ".......kwk...kwk.......",
    ".......kwk...kwk.......",
    ".......kwk...kwk.......",
    ".......kwk...kwk.......",
    ".......kwk...kwk.......",
    "........k.....k........",
    ".......kwk...kwk.......",
    ".......kwk...kwk.......",
    ".......kwk...kwk.......",
    ".......kwk...kwk.......",
    ".......kwk...kwk.......",
    "......kkwk...kwkk......",
    ".....kwwwk...kwwwk.....",
    "......kkk.....kkk......",
    ".......................",
  ];

  const SCHELETRO_1 = [
    ".......kkkkkkkkk...kwww",
    "......kwwwwwwwwwk..kwww",
    ".....kwwwwwwwwwwwk..kkk",
    ".....kwwwwwwwwwWwk.kwk.",
    ".....kwwnnwwwnnWwk.kwk.",
    ".....kwwnnwwwnnWwk.kwk.",
    ".....kwwwwwnwwwWwk.kwk.",
    ".....kwwwwwnwwwWwk.kwk.",
    ".....kwwwwwwwwwWwkkwk..",
    "......kwwwwwwwWwkkwk...",
    "......kwnwnwnwnwkkwk...",
    ".......kkkkwkkkk.kwk...",
    "..........kwk....kwk...",
    ".....kkkkkkwkkkkkkwk...",
    "....kwwwwwwwwwwwwwwk...",
    "...kwkkkkkkwkkkkkkk....",
    "...kwkkwwwwwwwwwk......",
    "...kwk.kkkkwkkkk.......",
    "...kwkkwwwwwwwwwk......",
    "...kwk.kkkkwkkkk.......",
    "...kwkkwwwwwwwwwk......",
    "...kwk.kkkkwkkkk.......",
    "...kwk.kwwwwwwwk.......",
    "...kwk..kkkwkkk........",
    "...kwk....kwk..........",
    "....k.....kwk..........",
    "...kwk....kwk..........",
    "...kwk....kwk..........",
    "...kwk....kwk..........",
    "...kwk....kwk..........",
    "...kwk.kkkkwkkkk.......",
    "...kwkkwwwwwwwWWk......",
    "...kwkkwwwwnwwWWk......",
    "...kwkkwwwwwwwWWk......",
    "..kwwwkkkkkkkkkk.......",
    "..kwwwkkwk...kwk.......",
    "...kkk.kwk...kwk.......",
    ".......kwk...kwk.......",
    ".......kwk...kwk.......",
    ".......kwk...kwk.......",
    ".......kwk...kwk.......",
    ".......kwk...kwk.......",
    ".......kwk...kwk.......",
    "........k.....k........",
    ".......kwk...kwk.......",
    ".......kwk...kwk.......",
    ".......kwk...kwk.......",
    ".......kwk...kwk.......",
    ".......kwk...kwk.......",
    "......kkwk...kwkk......",
    ".....kwwwk...kwwwk.....",
    "......kkk.....kkk......",
    ".......................",
  ];

  const MANTELLO = [
    ".....kk....kfk...kk.....",
    "....kxxk...kfk..kttk....",
    "...kxxxxk...k..kttttk...",
    "...kxxxxkkkkkkkkttttk...",
    "...kxxxxssssssssttttk...",
    "...kxxxxssssssssttttk...",
    "....kkkssxxoottSSkkk....",
    "......kssxxoottSSk......",
    "......kssxxxtttSSk......",
    ".....kssxxxxttttSSk.....",
    ".....kssxxxxttttSSk.....",
    ".....kssxxxxttttSSk.....",
    ".....kssxxxxttttSSk.....",
    ".....kssxxxxttttSSk.....",
    ".....kssxxxxttttSSk.....",
    ".....kssxxxxttttSSk.....",
    ".....kssxxxxttttSSk.....",
    "....ksssxxxxttttSSSk....",
    "....ksssxxxxttttSSSk....",
    "....ksssxxxxttttSSSk....",
    "....ksssxxxxttttSSSk....",
    "....ksssxxxxttttSSSk....",
    "....ksssxxxxttttSSSk....",
    "....ksssxxxxttttSSSk....",
    "....ksssxxxxttttSSSk....",
    "....ksssxxxxttttSSSk....",
    "...ksssxxxxxtttttSSSk...",
    "...ksssxxxxxtttttSSSk...",
    "...ksssxxxxxtttttSSSk...",
    "...ksssxxxxxtttttSSSk...",
    "...ksssxxxxxtttttSSSk...",
    "...ksssxxxxxtttttSSSk...",
    "...ksssxxxxxtttttSSSk...",
    "...ksssxxxxxtttttSSSk...",
    "..ksssxxxxxxttttttSSSk..",
    "..ksssxxxxxxttttttSSSk..",
    "..ksssxxxxxxttttttSSSk..",
    "..ksssxxxxxxttttttSSSk..",
    "..ksssxxxxxxttttttSSSk..",
    "..ksssxxxxxxttttttSSSk..",
    "..ksssxxxxxxttttttSSSk..",
    "..ksssxxxxxxttttttSSSk..",
    "..ksssxxxxxxttttttSSSk..",
    ".kssssxxxxxxttttttSSSSk.",
    ".kssssxxxxxxttttttSSSSk.",
    ".kssssxxxxxxttttttSSSSk.",
    ".kssssxxxxxxttttttSSSSk.",
    ".kssssxxxxxxttttttSSSSk.",
    ".kssssxxxxxxttttttSSSSk.",
    ".kssssxxxxxxttttttSSSSk.",
    ".kssssxxxxxxttttttSSSSk.",
    "kssssxxxxxxxtttttttSSSSk",
    "kssssxxxxxxxtttttttSSSSk",
    "kssssxxxxxxxtttttttSSSSk",
    "kssssxxxxxxxtttttttSSSSk",
    "kssssxxxxxxxtttttttSSSSk",
    "kskkkxkkkxkkktkkktkkkSk.",
    ".k...k...k...k...k...k..",
  ];

  const VESTITO = [
    "...........kfk..........",
    "...........kfk..........",
    "........kkkkkkkk........",
    ".......kVvvvvvvVk.......",
    ".......kVVVVVVVVk.......",
    "....kkkkVVVVVVVVkkkk....",
    "...kvvvVVVVVVVVVVvvvk...",
    "...kvvvVVVVVVVVVVvvvk...",
    "...kvvvVVVVVVVVVVvvvk...",
    "...kvvvVVVVVVVVVVvvvk...",
    "...kvvvVVVVVVVVVVvvvk...",
    "...kvvvVVVVVVVVVVvvvk...",
    "...kvvvVVVVVVVVVVvvvk...",
    "...kvvvVVVVVVVVVVvvvk...",
    "...kvvvVVVVVVVVVVvvvk...",
    "...kvvvVVVVVVVVVVvvvk...",
    "...kvvvVVVVVVVVVVvvvk...",
    "...kvvvVVVVVVVVVVvvvk...",
    "..kvvvvggggooggggvvvvk..",
    "..kvvvvggggooggggvvvvk..",
    "..kvvvvvVVVVVVvvvvvvvk..",
    "...kkkkVVVVVVVvvvkkkk...",
    "......kVVVVVVVvvvk......",
    ".....kVVVVVVVvVvvvk.....",
    ".....kVVVVVVvVVvvvk.....",
    ".....kVVVVVvVVVvvvk.....",
    ".....kVVVVvVVVVvvvk.....",
    ".....kVVVvVVVVVvvvk.....",
    "....kVVVvVVVVVVVvvvk....",
    "....kVVvVVVVVVVVvvvk....",
    "....kVvVVVVVVVVvvvvk....",
    "....kvVVVVVVVVvVvvvk....",
    "....kVVVVVVVVvVVvvvk....",
    "...kVVVVVVVVvVVVVvvvk...",
    "...kVVVVVVVvVVVVVvvvk...",
    "...kVVVVVVvVVVVVVvvvk...",
    "...kVVVVVvVVVVVVVvvvk...",
    "...kVVVVvVVVVVVVVvvvk...",
    "...kVVVvVVVVVVVVvvvvk...",
    "..kVVVvVVVVVVVVvVVvvvk..",
    "..kVVvVVVVVVVVvVVVvvvk..",
    "..kVvVVVVVVVVvVVVVvvvk..",
    "..kvVVVVVVVVvVVVVVvvvk..",
    "..kVVVVVVVVvVVVVVVvvvk..",
    ".kVVVVVVVVvVVVVVVVVvvvk.",
    ".kVVVVVVVvVVVVVVVVvvvvk.",
    ".kVVVVVVvVVVVVVVVvVvvvk.",
    ".kVVVVVvVVVVVVVVvVVvvvk.",
    ".kVVVVvVVVVVVVVvVVVvvvk.",
    "kVVVVvVVVVVVVVvVVVVVvvvk",
    "kVVVvVVVVVVVVvVVVVVVvvvk",
    "kVVvVVVVVVVVvVVVVVVVvvvk",
    "kVVvkVVVkVVVkVVVkVVVkvvk",
    "kVkvkVkVkVkVkVkVkVkVkvk.",
    ".kkvkkkVkkkVkkkVkkkVkk..",
    "...k...k...k...k...k....",
  ];

  const CROCE = ["x.......x", ".x.....x.", "..x...x..", "...x.x...", "....x....", "...x.x...", "..x...x..", ".x.....x.", "x.......x"];

  const SCINTILLA = [
    ["...g...", "...g...", ".......", "gg.w.gg", ".......", "...g...", "...g..."],
    [".......", ".......", "...g...", "..gwg..", "...g...", ".......", "......."],
  ];

  const POLVERE = [
    ["....s...s....", "..ss.sss.ss..", ".s..s...s..s."],
    [".s....s....s.", "s..s.....s..s", "............."],
  ];

  window.ArmadioSprite = {
    ZUCCO_BUSTO, ZUCCO_GAMBE, CAPPELLO, RAGNO, ARCO, ALI: [ALI_0, ALI_1, ALI_2],
    SCHELETRO: [SCHELETRO_0, SCHELETRO_1], MANTELLO, VESTITO, CROCE, SCINTILLA, POLVERE,
  };
})();

// ─────────────────────────────────────────────────────────────────────────────
// L'armadio a combinazione: logica pura, disegno e aggancio per le prove.
// ─────────────────────────────────────────────────────────────────────────────
(function () {
  "use strict";
  const { C, rett, riquadro, sprite, testo, BAYER } = EscapeDemo;
  const S = window.ArmadioSprite;

  // ── Variante: le 720 combinazioni con tre cifre diverse ──
  const CODICI = [];
  for (let a = 0; a < 10; a++)
    for (let b = 0; b < 10; b++)
      for (let c = 0; c < 10; c++) if (a !== b && b !== c && a !== c) CODICI.push([a, b, c]);

  /** Quello che il lucchetto risponde a un tentativo. */
  function risposta(cifre, codice) {
    let alPosto = 0, fuoriPosto = 0;
    cifre.forEach((d, i) => {
      if (codice[i] === d) alPosto++;
      else if (codice.includes(d)) fuoriPosto++;
    });
    return { alPosto, fuoriPosto };
  }

  /** Le combinazioni che danno, a ogni tentativo, esattamente la risposta incisa. */
  function compatibili(tentativi) {
    return CODICI.filter((c) => tentativi.every((t) => {
      const r = risposta(t.cifre, c);
      return r.alPosto === t.alPosto && r.fuoriPosto === t.fuoriPosto;
    }));
  }

  // Se in 50000 giri non ne esce una buona (non succede mai), si usa l'esempio della scheda.
  const RISERVA = {
    codice: [3, 8, 9],
    tentativi: [
      { cifre: [2, 7, 4], alPosto: 0, fuoriPosto: 0 },
      { cifre: [1, 8, 9], alPosto: 2, fuoriPosto: 0 },
      { cifre: [9, 2, 7], alPosto: 0, fuoriPosto: 1 },
      { cifre: [6, 3, 4], alPosto: 0, fuoriPosto: 1 },
      { cifre: [0, 8, 5], alPosto: 1, fuoriPosto: 0 },
    ],
  };

  function variante(rng) {
    for (let giro = 0; giro < 50000; giro++) {
      const codice = CODICI[Math.floor(rng() * CODICI.length)];
      const tentativi = [];
      while (tentativi.length < 5) {
        const cifre = CODICI[Math.floor(rng() * CODICI.length)];
        const r = risposta(cifre, codice);
        if (r.alPosto === 3) continue; // un tentativo non è mai la combinazione
        tentativi.push({ cifre: [...cifre], alPosto: r.alPosto, fuoriPosto: r.fuoriPosto });
      }
      // almeno un tentativo senza cifre giuste
      if (!tentativi.some((t) => t.alPosto + t.fuoriPosto === 0)) continue;
      // al massimo due tentativi con cifre al posto giusto
      if (tentativi.filter((t) => t.alPosto > 0).length > 2) continue;
      // una sola combinazione compatibile
      if (compatibili(tentativi).length !== 1) continue;
      // ogni tentativo serve: togliendone uno qualsiasi le combinazioni diventano più d'una
      if (!tentativi.every((_, i) => compatibili(tentativi.filter((__, j) => j !== i)).length > 1)) continue;
      return { codice: [...codice], tentativi };
    }
    return JSON.parse(JSON.stringify(RISERVA));
  }

  // ── Regole: stato + mossa → nuovo stato ed esito (niente disegno, niente kit) ──
  const intera = (n, a, b) => Number.isInteger(n) && n >= a && n <= b;

  function applica(stato, m, codice) {
    const s = { rotelle: [...stato.rotelle], provate: [...stato.provate], appunti: [...stato.appunti], aperto: stato.aperto };
    const no = (motivo) => ({ stato, esito: { valida: false, motivo } });
    if (!m || typeof m !== "object") return no("mossa sconosciuta");
    if (m.tipo === "ruota") { // una tacca su o giù di una rotella
      if (!intera(m.rotella, 0, 2)) return no("rotella inesistente");
      if (m.verso !== 1 && m.verso !== -1) return no("verso non valido");
      s.rotelle[m.rotella] = (s.rotelle[m.rotella] + m.verso + 10) % 10;
      return { stato: s, esito: { ok: true, rotelle: [...s.rotelle] } };
    }
    if (m.tipo === "imposta") { // tutte e tre le rotelle in un colpo (tastiera e prove)
      if (!Array.isArray(m.cifre) || m.cifre.length !== 3 || !m.cifre.every((d) => intera(d, 0, 9))) return no("cifre non valide");
      s.rotelle = [...m.cifre];
      return { stato: s, esito: { ok: true, rotelle: [...s.rotelle] } };
    }
    if (m.tipo === "segna") { // un tocco sulla lavagnetta: pulita → barrata → incorniciata → pulita
      if (!intera(m.cifra, 0, 9)) return no("cifra non valida");
      s.appunti[m.cifra] = (s.appunti[m.cifra] + 1) % 3;
      return { stato: s, esito: { ok: true, cifra: m.cifra, segno: s.appunti[m.cifra] } };
    }
    if (m.tipo === "prova") { // il bottone Prova
      const combo = s.rotelle.join("");
      if (new Set(s.rotelle).size < 3) return no("cifre ripetute");
      if (s.provate.includes(combo)) return no("già provata");
      if (combo === codice.join("")) { s.aperto = true; return { stato: s, esito: { risolto: true, combinazione: combo } }; }
      s.provate.push(combo);
      return { stato: s, esito: { errore: true, motivo: "combinazione sbagliata", provata: combo } };
    }
    return no("mossa sconosciuta");
  }

  // ── Disegno ──
  /** Ombra a retino: solo i pixel del retino sotto la soglia, gli altri restano trasparenti. */
  function ombraRetino(ctx, x, y, w, h, q, col = C.nero) {
    for (let j = 0; j < h; j++)
      for (let i = 0; i < w; i++) {
        const px = x + i, py = y + j;
        if (BAYER[py & 3][px & 3] / 16 < q) rett(ctx, col, px, py, 1, 1);
      }
  }

  function armadio(ctx) {
    ombraRetino(ctx, 58, 147, 206, 5, 0.55); // ombra sul pavimento
    // cornice in tre fasce
    riquadro(ctx, 60, 18, 200, 4, C.legnoChiaro);
    rett(ctx, C.legnoLuce, 61, 19, 198, 1);
    riquadro(ctx, 62, 21, 196, 7, C.legno);
    for (let x = 66; x < 254; x += 6) rett(ctx, C.legnoScuro, x, 23, 3, 3); // dentelli
    riquadro(ctx, 63, 27, 194, 4, C.legnoScuro);
    // corpo (si vede ai lati e nella fessura fra le ante)
    riquadro(ctx, 66, 30, 188, 110, C.legnoScuro);
    rett(ctx, C.legnoChiaro, 67, 31, 1, 108);
    // zoccolo e piedi
    riquadro(ctx, 64, 140, 192, 7, C.legno);
    rett(ctx, C.legnoChiaro, 65, 141, 190, 1);
    riquadro(ctx, 68, 146, 8, 5, C.legnoScuro);
    riquadro(ctx, 244, 146, 8, 5, C.legnoScuro);
  }

  /** La lampadina dello sfondo, ridisegnata davanti alla cornice. */
  function lampadina(ctx, fioca) {
    rett(ctx, C.bordo, 160, 16, 1, 10);
    rett(ctx, C.bordo, 157, 25, 7, 10);
    rett(ctx, C.ferro, 158, 26, 5, 3);
    rett(ctx, fioca ? C.fiamma : C.fiammaChiara, 158, 29, 5, 5);
    rett(ctx, fioca ? C.fiammaChiara : C.luna, 159, 30, 2, 2);
  }

  // xc = colonna della cerniera (72 sinistra, 248 destra), verso = +1 (sinistra) o -1 (destra), passo = 0..3.
  function anta(ctx, xc, verso, passo) {
    const w = [88, 70, 52, 34][passo];
    const sx = verso > 0 ? xc : xc - w + 1; // la colonna più a sinistra sullo schermo
    for (let j = 0; j < w; j++) { // j = distanza dalla cerniera
      const x = verso > 0 ? xc + j : xc - j;
      const e = Math.floor((passo * j) / (w - 1)); // allungamento verso il bordo libero
      const y0 = 30 - e, y1 = 139 + e, h = y1 - y0 + 1;
      rett(ctx, C.bordo, x, y0, 1, h);
      if (j === 0 || j === w - 1) continue;
      const dx = x - sx;
      let fondo = passo >= 2 ? C.legnoScuro : C.legno;
      if (dx === 1) fondo = C.legnoChiaro; // costa illuminata a sinistra
      if (dx === w - 2) fondo = C.legnoScuro; // costa in ombra a destra
      if (passo > 0 && j >= w - 3) fondo = C.legnoLuce; // lo spessore dell'anta aperta
      rett(ctx, fondo, x, y0 + 1, 1, h - 2);
      rett(ctx, C.legnoChiaro, x, y0 + 1, 1, 1);
      rett(ctx, C.legnoScuro, x, y1 - 1, 1, 1);
      if (passo <= 1 && dx >= 4 && dx <= w - 5) { // il pannello incassato
        rett(ctx, C.legnoScuro, x, y0 + 4, 1, 1);
        rett(ctx, C.legnoLuce, x, y1 - 4, 1, 1);
        if (dx === 4) rett(ctx, C.legnoScuro, x, y0 + 4, 1, h - 8);
        if (dx === w - 5) rett(ctx, C.legnoLuce, x, y0 + 5, 1, h - 9);
      }
    }
  }

  const TESTO_RISPOSTA = {
    "0/0": ["NESSUNA", "GIUSTA"],
    "1/0": ["1 GIUSTA", "AL POSTO"],
    "2/0": ["2 GIUSTE", "AL POSTO"],
    "0/1": ["1 GIUSTA", "FUORI POSTO"],
    "0/2": ["2 GIUSTE", "FUORI POSTO"],
    "0/3": ["3 GIUSTE", "FUORI POSTO"],
    "1/1": ["1 AL POSTO", "1 FUORI POSTO"],
    "1/2": ["1 AL POSTO", "2 FUORI POSTO"],
  };

  function tentativiIncisi(ctx, tentativi) {
    const col = { colore: C.fiammaChiara, ombra: C.legnoScuro };
    tentativi.forEach((t, k) => {
      const yk = 41 + 19 * k;
      testo(ctx, t.cifre.join(""), 80, yk + 2, col);
      const righe = TESTO_RISPOSTA[`${t.alPosto}/${t.fuoriPosto}`] || ["", ""];
      testo(ctx, righe[0], 101, yk, { ...col, piccolo: true });
      testo(ctx, righe[1], 101, yk + 6, { ...col, piccolo: true });
      if (k < 4) for (let x = 80; x <= 148; x += 4) rett(ctx, C.legnoScuro, x, yk + 15, 2, 1);
    });
  }

  function targhetta(ctx) {
    riquadro(ctx, 185, 40, 39, 9, C.oroScuro);
    rett(ctx, C.oro, 186, 41, 37, 1);
    testo(ctx, "COSTUMI", 204, 42, { piccolo: true, colore: C.legnoScuro, ombra: null, allinea: "centro" });
    rett(ctx, C.giallo, 187, 44, 1, 1);
    rett(ctx, C.giallo, 221, 44, 1, 1);
  }

  // Cifre delle rotelle: la cifra ferma, o le due cifre che scorrono mentre gira.
  function cifraRotella(ctx, i, x0, Y, cifra, errore, anim, adesso) {
    const colore = errore ? C.tappeto : C.bordo;
    const a = anim && anim[i];
    const p = a ? Math.min(1, (adesso - a.inizio) / 160) : 1;
    if (!a || p >= 1) {
      testo(ctx, String(cifra), x0 + 3, Y + 17, { scala: 2, colore, ombra: null });
      return;
    }
    const o = Math.round(18 * p);
    const yv = a.verso > 0 ? Y + 17 - o : Y + 17 + o;
    const yn = a.verso > 0 ? Y + 17 + 18 - o : Y + 17 - 18 + o;
    ctx.save();
    ctx.beginPath();
    ctx.rect(x0 + 1, Y + 13, 14, 22);
    ctx.clip();
    testo(ctx, String(a.vecchia), x0 + 3, yv, { scala: 2, colore, ombra: null });
    testo(ctx, String(cifra), x0 + 3, yn, { scala: 2, colore, ombra: null });
    ctx.restore();
  }

  function ferramenta(ctx, { dx = 0, dy = 0, scatto = false, errore = false, cifre, scelta = -1, anim, adesso }) {
    // cerniera e bandella
    riquadro(ctx, 153 + dx, 65 + dy, 5, 12, C.ferroChiaro);
    rett(ctx, C.pietra, 154 + dx, 66 + dy, 1, 10);
    riquadro(ctx, 157 + dx, 67 + dy, 37, 8, C.ferro);
    rett(ctx, C.ferroChiaro, 158 + dx, 68 + dy, 35, 1);
    rett(ctx, C.pietra, 161 + dx, 70 + dy, 2, 2);
    rett(ctx, C.pietra, 171 + dx, 70 + dy, 2, 2);
    // arco: aperto si alza di 6 e la gamba destra si allunga per restare nel corpo
    const ARCO_COLORI = { k: C.bordo, s: C.pietraChiara, p: C.pietra, f: C.ferroChiaro };
    sprite(ctx, S.ARCO, ARCO_COLORI, 182 + dx, 54 + dy - (scatto ? 6 : 0));
    if (scatto) sprite(ctx, ["kpfpk", "kpfpk", "kpfpk", "kpfpk", "kpfpk", "kpfpk"], ARCO_COLORI, 222 + dx, 78 + dy);
    // occhiello, davanti alla gamba sinistra
    riquadro(ctx, 178 + dx, 70 + dy, 13, 4, C.ferroChiaro);
    rett(ctx, C.pietra, 179 + dx, 71 + dy, 11, 1);
    // corpo d'ottone (angoli smussati: i quattro pixel d'angolo restano vuoti)
    const X = 170 + dx, Y = 84 + dy, bordo = errore ? C.tappetoChiaro : C.bordo;
    rett(ctx, bordo, X + 1, Y, 66, 50);
    rett(ctx, bordo, X, Y + 1, 68, 48);
    rett(ctx, C.oroScuro, X + 1, Y + 1, 66, 48);
    rett(ctx, C.oro, X + 2, Y + 2, 64, 2); // luce in alto
    rett(ctx, C.oro, X + 2, Y + 2, 2, 45); // luce a sinistra
    rett(ctx, C.giallo, X + 3, Y + 2, 10, 1); // riflesso
    rett(ctx, C.brace, X + 2, Y + 46, 64, 2); // ombra in basso
    rett(ctx, C.brace, X + 64, Y + 4, 2, 44); // ombra a destra
    for (let i = 0; i < 3; i++) {
      const x0 = X + 6 + 20 * i; // colonna della rotella: x0 … x0+15
      // freccia su
      riquadro(ctx, x0 + 2, Y + 3, 12, 8, C.pietra);
      rett(ctx, C.pietraChiara, x0 + 3, Y + 4, 10, 1);
      sprite(ctx, ["..k..", ".kkk.", "kkkkk"], { k: C.bordo }, x0 + 5, Y + 6);
      // finestrella della rotella, 16×24
      riquadro(ctx, x0, Y + 12, 16, 24, C.pietraChiara, scatto ? C.erbaChiara : i === scelta ? C.bianco : C.bordo);
      rett(ctx, C.ferroChiaro, x0 + 1, Y + 13, 14, 2); // il tamburo: bande scure in alto e in basso
      rett(ctx, C.pietra, x0 + 1, Y + 15, 14, 2);
      rett(ctx, C.pietra, x0 + 1, Y + 31, 14, 2);
      rett(ctx, C.ferroChiaro, x0 + 1, Y + 33, 14, 2);
      cifraRotella(ctx, i, x0, Y, cifre[i], errore, anim, adesso);
      rett(ctx, C.tappetoChiaro, x0 - 1, Y + 23, 1, 2); // tacche rosse di lettura ai lati
      rett(ctx, C.tappetoChiaro, x0 + 16, Y + 23, 1, 2);
      // freccia giù
      riquadro(ctx, x0 + 2, Y + 37, 12, 8, C.pietra);
      rett(ctx, C.pietraChiara, x0 + 3, Y + 38, 10, 1);
      sprite(ctx, ["kkkkk", ".kkk.", "..k.."], { k: C.bordo }, x0 + 5, Y + 40);
    }
  }

  function lavagnetta(ctx, appunti) {
    riquadro(ctx, 262, 58, 50, 89, C.legnoChiaro);
    rett(ctx, C.legnoLuce, 263, 59, 48, 1);
    riquadro(ctx, 265, 61, 44, 83, C.siepe); // la lavagna, verde scurissimo
    testo(ctx, "APPUNTI", 287, 64, { piccolo: true, colore: C.pietraChiara, ombra: null, allinea: "centro" });
    for (let x = 268; x < 306; x += 2) rett(ctx, C.pietra, x, 70, 1, 1); // riga di gesso puntinata
    for (let d = 0; d < 10; d++) {
      const cx = d < 5 ? 266 : 287, cy = 72 + 14 * (d % 5); // la cella 21×14 della cifra
      const x = cx + 8, y = cy + 3, segno = appunti[d]; // la cifra 5×7
      testo(ctx, String(d), x, y, { colore: segno === 1 ? C.ferroChiaro : segno === 2 ? C.bianco : C.pietraChiara, ombra: null });
      if (segno === 1) sprite(ctx, S.CROCE, { x: C.tappetoChiaro }, x - 2, y - 1); // barrata
      if (segno === 2) { // incorniciata
        rett(ctx, C.erbaChiara, x - 2, y - 2, 9, 1); rett(ctx, C.erbaChiara, x - 2, y + 8, 9, 1);
        rett(ctx, C.erbaChiara, x - 2, y - 2, 1, 11); rett(ctx, C.erbaChiara, x + 6, y - 2, 1, 11);
      }
    }
    rett(ctx, C.pietraChiara, 282, 145, 6, 1); // il gessetto sulla cornice
    riquadro(ctx, 266, 146, 4, 5, C.legnoScuro); // piedini
    riquadro(ctx, 304, 146, 4, 5, C.legnoScuro);
    sprite(ctx, S.CAPPELLO, { k: C.bordo, V: C.viola, v: C.violaScuro, o: C.oro, O: C.oroScuro }, 289, 46);
  }

  const COLORI_ZUCCO = {
    k: C.bordo, o: C.tappeto, O: C.brace, y: C.fiamma, h: C.fiammaChiara, E: C.oro, e: C.luna, b: C.legnoScuro,
    G: C.erbaScura, g: C.erba, P: C.violaScuro, p: C.viola, q: C.lilla, u: C.luna, U: C.oro,
    B: C.ferro, L: C.ferroChiaro, R: C.muroAcceso, T: C.legnoLuce,
  };
  const COLORI_ZUCCO_FIOCA = { ...COLORI_ZUCCO, u: C.fiammaChiara, U: C.fiamma };

  function interno(ctx, saluto) {
    rett(ctx, C.bordo, 72, 30, 177, 110);
    for (let x = 73; x < 248; x++) rett(ctx, x % 12 === 0 ? C.nero : C.legnoScuro, x, 31, 1, 108); // assi del fondo
    ombraRetino(ctx, 73, 31, 175, 12, 0.75); // buio sotto la cornice
    ombraRetino(ctx, 73, 43, 175, 14, 0.4);
    rett(ctx, C.ferroChiaro, 76, 36, 169, 2); // l'asta delle grucce
    rett(ctx, C.bordo, 76, 38, 169, 1);
    sprite(ctx, S.MANTELLO, { k: C.bordo, f: C.ferroChiaro, t: C.tappeto, x: C.tappetoChiaro, s: C.ferroChiaro, S: C.ferro, o: C.oro }, 112, 35);
    sprite(ctx, S.VESTITO, { k: C.bordo, f: C.ferroChiaro, v: C.violaScuro, V: C.viola, g: C.erbaChiara, o: C.oro }, 184, 35);
    rett(ctx, C.legno, 73, 133, 175, 6); // il ripiano in basso
    rett(ctx, C.legnoChiaro, 73, 133, 175, 1);
    sprite(ctx, saluto ? S.SCHELETRO[1] : S.SCHELETRO[0], { k: C.bordo, w: C.pietraChiara, W: C.pietra, n: C.nero }, 149, 81);
  }

  // ── Il rompicapo ──
  const TESTO_CARTA = [
    "L'armadio dei costumi ha un lucchetto a tre cifre, tutte diverse. Sull'anta qualcuno ha inciso cinque tentativi, con quello che il lucchetto aveva risposto.",
    "«Al posto» vuol dire cifre giuste e al posto giusto; «fuori posto», cifre giuste ma al posto sbagliato.",
    "Ogni combinazione sbagliata conta come errore. Sulla lavagnetta puoi segnarti le cifre: un tocco la barra, due la incorniciano, tre la puliscono.",
  ].join("\n");

  EscapeDemo.avvia({
    id: "armadio-combinazione",
    sfondo: "deposito",
    velo: 0.5,
    testo: TESTO_CARTA,
    variante,

    crea(g) {
      const v = g.variante;
      const codice = v.codice;

      // Stato iniziale, con la memoria del ricaricamento se è valida.
      let stato = { rotelle: [0, 0, 0], provate: [], appunti: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0], aperto: false };
      const mem = g.memoria || {};
      if (Array.isArray(mem.rotelle) && mem.rotelle.length === 3 && mem.rotelle.every((d) => intera(d, 0, 9))) stato.rotelle = [...mem.rotelle];
      if (Array.isArray(mem.provate) && mem.provate.every((p) => typeof p === "string" && /^\d{3}$/.test(p))) stato.provate = [...mem.provate];
      if (Array.isArray(mem.appunti) && mem.appunti.length === 10 && mem.appunti.every((d) => intera(d, 0, 2))) stato.appunti = [...mem.appunti];
      if (g.giaRisolto) stato.aperto = true;

      // Animazioni (fuori dallo stato del rompicapo)
      const anim = [null, null, null]; // per rotella: { vecchia, verso, inizio }
      let tErrore = -1e9, tRifiuto = -1e9, tVittoria = null, sceltaTastiera = -1;

      function salvaMemoria() {
        g.memoria.rotelle = stato.rotelle;
        g.memoria.provate = stato.provate;
        g.memoria.appunti = stato.appunti;
        g.salvaMemoria();
      }

      // Il primo tentativo senza cifre giuste: serve al riepilogo.
      const primoVuoto = v.tentativi.find((t) => t.alPosto + t.fuoriPosto === 0) || v.tentativi[0];

      function gioca(mossa) {
        const prima = stato;
        const { stato: nuovo, esito } = applica(stato, mossa, codice);
        if (esito.valida === false) {
          if (esito.motivo === "cifre ripetute") {
            tRifiuto = g.tempo;
            g.messaggio("Le tre cifre della combinazione sono tutte diverse.");
          } else if (esito.motivo === "già provata") {
            tRifiuto = g.tempo;
            g.messaggio(`${prima.rotelle.join("")} l'hai già provata: il lucchetto non si apre.`);
          }
          return esito;
        }
        stato = nuovo;
        if (mossa.tipo === "ruota" && !g.riduciMovimento) {
          anim[mossa.rotella] = { vecchia: prima.rotelle[mossa.rotella], verso: mossa.verso, inizio: g.tempo };
        }
        salvaMemoria();
        if (esito.errore) {
          g.errore("Combinazione sbagliata");
          tErrore = g.tempo;
          g.messaggio(`${esito.provata} non è la combinazione: il lucchetto resta chiuso.`);
        } else if (esito.risolto) {
          tVittoria = g.tempo;
          g.messaggio("Clic! Il lucchetto si apre... e nell'armadio c'era uno scheletro.");
          g.risolto({
            riepilogo: `La combinazione era ${codice.join("")}. Il tentativo ${primoVuoto.cifre.join("")} escludeva subito le cifre ${primoVuoto.cifre.join(", ").replace(/, ([^,]*)$/, " e $1")}.`,
            ritardo: 2000,
          });
        }
        return esito;
      }

      // Tocchi: rotelle e lavagnetta. Zone più grandi del disegno.
      const X0 = 170;
      g.tocca(({ tipo, x, y }) => {
        if (tipo !== "giu") return;
        for (let i = 0; i < 3; i++) {
          if (x >= X0 + 4 + 20 * i && x < X0 + 24 + 20 * i) {
            if (y >= 80 && y < 108) { sceltaTastiera = -1; gioca({ tipo: "ruota", rotella: i, verso: 1 }); return; }
            if (y >= 108 && y < 138) { sceltaTastiera = -1; gioca({ tipo: "ruota", rotella: i, verso: -1 }); return; }
          }
        }
        for (let d = 0; d < 10; d++) {
          const xa = d < 5 ? 266 : 287;
          const ya = 72 + 14 * (d % 5);
          if (x >= xa && x < xa + 21 && y >= ya && y < ya + 14) { gioca({ tipo: "segna", cifra: d }); return; }
        }
      });

      g.bottone("Prova", () => gioca({ tipo: "prova" }), { id: "prova", forte: true });

      // Tastiera (facoltativa)
      document.addEventListener("keydown", (e) => {
        if (g.stato().risolto) return;
        const carta = document.querySelector(".kit-velo-carta");
        if (carta && !carta.hidden) return;
        if (e.ctrlKey || e.metaKey || e.altKey) return;
        const tag = e.target && e.target.tagName;
        if (e.key === "Enter") {
          if (tag === "BUTTON") return; // il bottone si attiva da solo
          gioca({ tipo: "prova" });
          e.preventDefault();
          return;
        }
        if (e.key === "ArrowLeft") { sceltaTastiera = sceltaTastiera < 0 ? 0 : (sceltaTastiera + 2) % 3; e.preventDefault(); return; }
        if (e.key === "ArrowRight") { sceltaTastiera = sceltaTastiera < 0 ? 0 : (sceltaTastiera + 1) % 3; e.preventDefault(); return; }
        if (e.key === "ArrowUp" || e.key === "ArrowDown") {
          if (sceltaTastiera < 0) sceltaTastiera = 0;
          gioca({ tipo: "ruota", rotella: sceltaTastiera, verso: e.key === "ArrowUp" ? 1 : -1 });
          e.preventDefault();
          return;
        }
        if (/^[0-9]$/.test(e.key)) {
          if (sceltaTastiera < 0) sceltaTastiera = 0;
          const cifre = [...stato.rotelle];
          cifre[sceltaTastiera] = Number(e.key);
          gioca({ tipo: "imposta", cifre });
          sceltaTastiera = (sceltaTastiera + 1) % 3;
          e.preventDefault();
        }
      });

      if (!g.giaRisolto) g.messaggio("Gira le tre rotelle con le frecce, poi premi Prova.");
      else g.messaggio("L'armadio è aperto: lo scheletro ti saluta.");

      // ── Il disegno: ogni fotogramma si ricancella e si ridisegna tutto ──
      const SALTO = [-3, 0, -3, 0, -2, 0];
      const CADUTA = [3, 8, 15, 24, 36, 50, 66, 84];
      const TREMA = [1, -1, 1, -1, 1, 0];
      const SCUOTI = [-1, 1, -1, 1];

      function segnoZucco(ctx, scritta, colore, salto) {
        testo(ctx, scritta, 37, 110 + salto, { colore, allinea: "centro" });
      }

      g.anima((adesso) => {
        const ctx = g.ctx;
        const rid = g.riduciMovimento;
        ctx.clearRect(0, 0, 320, 180);

        // fase della vittoria
        const tv = (stato.aperto && tVittoria !== null && !rid) ? adesso - tVittoria : null;
        const seq = tv !== null && tv < 3500; // sequenza in corso
        let passo = 0;
        if (stato.aperto) {
          if (tv === null) passo = 3;
          else passo = tv < 850 ? 0 : tv < 950 ? 1 : tv < 1050 ? 2 : 3;
        }
        const finale = stato.aperto && (tv === null || tv >= 1050);
        const ferraInScena = stato.aperto && tv !== null && tv < 800;

        // tempi di errore / rifiuto
        const te = rid ? 1e9 : adesso - tErrore;
        const tr = rid ? 1e9 : adesso - tRifiuto;
        let dx = 0, dy = 0;
        if (te < 300) dx = TREMA[Math.min(5, Math.floor(te / 50))];
        const erroreRosso = te < 400;
        if (tr < 120) dy = 1;

        // animazioni di rotella: chiudi quelle finite
        for (let i = 0; i < 3; i++) if (anim[i] && (rid || adesso - anim[i].inizio >= 160)) anim[i] = null;

        // lampadina, ragno, Zucco, scheletro: continui
        const fioca = !rid && (g.fotogramma % 40 === 0 || g.fotogramma % 40 === 3);
        const b = rid ? 0 : [0, 1, 2, 1][Math.floor(g.fotogramma / 3) % 4];
        const respiro = rid ? 0 : Math.floor((g.fotogramma + 2) / 4) % 2;
        const lanternaFioca = !rid && g.fotogramma % 3 === 0;
        const saluto = rid ? 0 : Math.floor(g.fotogramma / 2) % 2;
        let salto = 0, scuoti = 0;
        if (tv !== null && tv >= 400 && tv < 1000) salto = SALTO[Math.min(5, Math.floor((tv - 400) / 100))];
        if (te < 500) scuoti = SCUOTI[Math.floor(te / 125) % 4];

        const params = (extra) => ({ cifre: stato.rotelle, scelta: sceltaTastiera, anim, adesso, ...extra });

        // 1. ombra e armadio
        armadio(ctx);
        // 2. interno
        if (passo >= 1) interno(ctx, saluto === 1);
        // 3. ante
        anta(ctx, 72, 1, passo);
        anta(ctx, 248, -1, passo);
        // 4. tentativi, targhetta, ferramenta (solo ante chiuse)
        if (passo === 0) {
          tentativiIncisi(ctx, v.tentativi);
          targhetta(ctx);
          if (!stato.aperto) ferramenta(ctx, params({ dx, dy, errore: erroreRosso }));
          else if (tv !== null && tv < 400) ferramenta(ctx, params({ scatto: true }));
        }
        // 5. lampadina, ragno
        lampadina(ctx, fioca);
        rett(ctx, C.pietra, 63, 31, 1, 13 + b);
        sprite(ctx, S.RAGNO, { k: C.bordo, f: C.ferroChiaro, r: C.tappetoChiaro }, 59, 44 + b);
        // 6. Zucco e i suoi segni
        sprite(ctx, S.ZUCCO_GAMBE, COLORI_ZUCCO, 26, 144 + salto);
        sprite(ctx, S.ZUCCO_BUSTO, lanternaFioca ? COLORI_ZUCCO_FIOCA : COLORI_ZUCCO, 26 + scuoti, 122 + respiro + salto);
        if (te < 1200) segnoZucco(ctx, "?!", C.tappetoChiaro, salto);
        else if (tr < 800) segnoZucco(ctx, "?", C.pietraChiara, salto);
        else if (tv !== null && tv >= 400 && tv < 3500) segnoZucco(ctx, "!", C.giallo, salto);
        // 7. lavagnetta e cappello
        lavagnetta(ctx, stato.appunti);
        // 8. pipistrello
        if (tv !== null && tv >= 1050 && tv < 2300) {
          const u = tv - 1050;
          const px = 149 + Math.round(0.11 * u), py = 70 - Math.round(0.06 * u);
          if (py >= 6) {
            sprite(ctx, S.ALI[[0, 1, 2, 1][Math.floor(u / 125) % 4]],
              { k: C.bordo, a: C.viola, A: C.violaScuro, x: C.giallo, c: C.rosa }, px, py);
          }
        }
        // 9. ferramenta che cade, scintilla e polvere
        if (tv !== null && tv >= 400 && tv < 800) {
          ferramenta(ctx, params({ scatto: true, dy: CADUTA[Math.min(7, Math.floor((tv - 400) / 50))] }));
        }
        if (tv !== null && tv < 400) {
          sprite(ctx, S.SCINTILLA[Math.floor(tv / 125) % 2], { g: C.giallo, w: C.bianco }, 175, 45);
        }
        if (tv !== null && tv >= 800 && tv < 1050) {
          const f = S.POLVERE[tv < 925 ? 0 : 1];
          for (const px of [176, 200, 222]) sprite(ctx, f, { s: C.pietra }, px, 147);
        }
        void seq; void finale; void ferraInScena;
      });

      g.espone({
        gioca: (mossa) => gioca(mossa),
        statoGioco: () => ({ rotelle: [...stato.rotelle], provate: [...stato.provate], appunti: [...stato.appunti], aperto: stato.aperto }),
        zona: (i, verso) => ({ x: 170 + 6 + 20 * i + 8, y: verso > 0 ? 84 + 6 : 84 + 40 }),
        zonaAppunto: (d) => ({ x: (d < 5 ? 266 : 287) + 10, y: 72 + 14 * (d % 5) + 7 }),
      });
    },
  });
})();
