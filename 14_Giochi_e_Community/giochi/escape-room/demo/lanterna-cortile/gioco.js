// La lanterna del cortile: cinque mostri, una lanterna, al massimo due alla volta, un limite di minuti.
// La logica (applica) è separata dal disegno: stato + mossa -> nuovo stato ed esito.

(function () {
  "use strict";
  const { C, BAYER, rett, riquadro, testo, sprite, mescola } = EscapeDemo;

  // ───────────────────────── Dati ─────────────────────────
  const IDS = ["fantasma", "strega", "zombie", "mummia", "scheletro"];
  const SERIE = [
    { tempi: [1, 3, 6, 8, 12], limite: 29 },
    { tempi: [1, 2, 6, 9, 13], limite: 27 },
    { tempi: [1, 3, 4, 9, 11], limite: 26 },
    { tempi: [2, 3, 7, 9, 14], limite: 34 },
    { tempi: [1, 4, 5, 10, 12], limite: 31 },
    { tempi: [1, 2, 7, 11, 15], limite: 30 },
  ];
  const NOME = { fantasma: "il fantasma", strega: "la strega", zombie: "lo zombie", mummia: "la mummia", scheletro: "lo scheletro" };
  const XC = [16, 34, 52, 70, 88];
  const XP = [232, 250, 268, 286, 304];
  const X_LANTERNA = { cancello: 106, porta: 214 };
  const RIVA = { cancello: [4, 112], porta: [208, 316] };
  const OCCHI = [[124, 126, C.giallo], [148, 138, C.tappetoChiaro], [178, 124, C.acqua], [198, 134, C.giallo]];
  const SFASA_OCCHI = [0, 9, 17, 23];

  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const posto = (lato, s) => (lato === "cancello" ? XC[s] : XP[s]);
  const minutiTesto = (n) => (n === 1 ? "1 minuto" : `${n} minuti`);
  const ordinati = (chi) => [...chi].sort((a, b) => IDS.indexOf(a) - IDS.indexOf(b));
  function gruppo(chi) {
    const t = ordinati(chi).map((id) => NOME[id]).join(" e ");
    return t[0].toUpperCase() + t.slice(1);
  }
  const vinta = (p) => IDS.every((id) => p.lati[id] === "porta");

  // ───────────────────────── Sprite dei mostri ─────────────────────────
  const BASE = { k: C.bordo, n: C.nero, w: "#e8e4f0", W: "#a9a4bc", y: C.giallo };
  const MOSTRI = {
    fantasma: {
      w: 14, vola: 4, palpebra: "#e8e4f0",
      colori: { ...BASE, f: "#e8e4f0", F: "#b8b4cc", G: C.pietra },
      occhi: [[3, 4], [4, 4], [7, 4], [8, 4], [3, 5], [4, 5], [7, 5], [8, 5]],
      corpo: [
        ".....kkkk.....",
        "...kkffffkk...",
        "..kfffffffFk..",
        ".kffffffffFFk.",
        ".kfnnffnnfFFk.",
        ".kfnnffnnffFk.",
        ".kffffffffFFk.",
        ".kfffnnfffFFk.",
        "kkffffffffFFk.",
        "kfkfffffffFFk.",
        "kffkffffffFFk.",
        ".kfkfffffFFFk.",
        "..kffffffFFFGk",
        "..kfffffFFFFGk",
        ".kffffffFFFGGk",
        "kffffffFFFFGGk",
        "kfFffFffFFfGGk",
        "kfkFfkfFkFkGk.",
        ".k.kk.kk.kk.k.",
      ],
      gambe: { dritte: [], passo: [] },
    },
    strega: {
      w: 16, vola: 0, palpebra: "#9ad88a",
      colori: {
        ...BASE, h: "#241a36", H: "#3f2f5a", o: C.oro, a: C.brace, A: "#8a3a08", g: "#5a9a4a", G: "#3a6a34",
        L: "#9ad88a", v: C.violaScuro, V: C.viola,
      },
      occhi: [[5, 11]],
      corpo: [
        "..........k.....",
        ".........khk....",
        "........khHk....",
        ".......khhHk....",
        "......khhhHk....",
        ".....khhhhhHk...",
        ".....koooooook..",
        "..kkkhhhhhhhhhk.",
        ".kkhhhhhhhhhhhhk",
        "..kkkkkkkkkkkkk.",
        "....kLgggaaAk...",
        "...kLnLggaaAAk..",
        "...kLLLLgaaAAk..",
        "...kkLgGgkaAAk..",
        "....kkGgkvaAAk..",
        "...kvvkkvvvaAk..",
        "..kvVvvvvvvvAk..",
        ".kgkvVvvvvvvvk..",
        ".kgkkVvvvvvvvk..",
        "..kkvvVvvvvvvk..",
        "...kvvVvvvvvvk..",
      ],
      gambe: {
        dritte: [
          "...kvVvvvvvvvvk.",
          "..kvVvvvvvvvvvk.",
          "..kVvvvvvvvvvvk.",
          ".kvVvvvvvvvvvvvk",
          ".kkkkkkkkkkkkkkk",
          "..kkk.....kkk...",
        ],
        passo: [
          "...kvVvvvvvvvvk.",
          "..kvVvvvvvvvvvk.",
          "..kVvvvvvvvvvvvk",
          ".kvVvvvvvvvvvvvk",
          ".kkkkkkkkkkkkkkk",
          "....kkk..kkk....",
        ],
      },
    },
    zombie: {
      w: 16, vola: 0, palpebra: "#7a9a6a",
      colori: { ...BASE, z: "#7a9a6a", Z: "#4a6a44", c: "#6a6a8a", C: "#45435f", p: "#4a3a26", P: C.legnoScuro, r: C.tappeto },
      occhi: [[4, 4], [5, 4]],
      corpo: [
        "......kkkkk.....",
        ".....kzzzZZk....",
        "....kzzrzZZZk...",
        "....kzzzzzZZk...",
        "...kwnzzzzZZk...",
        "...kzzzzzzZZk...",
        "...kkzzzzZZZk...",
        "....knnnzZZk....",
        "....kwkwzZZk....",
        ".....kkzZZkk....",
        "...kkcccccCCk...",
        ".kkkccccrccCCk..",
        "kzzzkcccccCCCk..",
        "kzZZkcckcccCCk..",
        ".kkkcccccccCCk..",
        "....kkcccCcCCk..",
        ".....kcCkCckk...",
        ".....kppppPPk...",
      ],
      gambe: {
        dritte: [
          ".....kppPkpPk...",
          ".....kppPkpPk...",
          ".....kpPPkPPk...",
          ".....kZzkkzZk...",
          "....kzZzk.kzZk..",
          "....kkkkk.kkkk..",
        ],
        passo: [
          ".....kppPkpPk...",
          "....kppPk.kpPk..",
          "....kpPPk.kPPk..",
          "...kZzzk..kzZk..",
          "..kzZzk...kzZk..",
          "..kkkkk...kkkk..",
        ],
      },
    },
    mummia: {
      w: 14, vola: 0, palpebra: "#e0d8c0",
      colori: { ...BASE, a: "#e0d8c0", b: "#c4bca2", c: "#a8a088", d: "#7a7258" },
      occhi: [[3, 3], [4, 3]],
      corpo: [
        "....kkkkk.....",
        "...kbaaack....",
        "..kaaacbadk...",
        "..kynbaaadk...",
        "..kbaaacbdk...",
        "..kdacbaadk...",
        "..kcbaaacdk...",
        "...kaacbdk....",
        "..kkcbaaakk...",
        ".kcbaaacbadk..",
        ".kaakcbaakdk..",
        ".kackaaackdk..",
        ".kbdkacbakdk..",
        ".kaakbaaakbk..",
        ".kkbkaacbkkk..",
        "..kakcbaadk...",
        "..kdkaaacdk...",
        "...kkacbadk...",
      ],
      gambe: {
        dritte: [
          "...kcbkaadk...",
          "...kaakcbdk...",
          "...kackaadk...",
          "...kbakacdk...",
          "..kaadkbaadk..",
          "..kkkkkkkkkk..",
        ],
        passo: [
          "...kcbkaadk...",
          "...kaakkbdk...",
          "..kaak.kaadk..",
          "..kcbk.kcbdk..",
          ".kbadk..kaadk.",
          ".kkkkk..kkkkk.",
        ],
      },
    },
    scheletro: {
      w: 14, vola: 0, palpebra: null,
      colori: { ...BASE, L: C.legnoLuce, l: C.legnoChiaro },
      occhi: [],
      corpo: [
        "....kkkkkk....",
        "...kwwwwwwk...",
        "..kwwwwwwWWk..",
        "..knnwwnnwWk..",
        "..knnwwnnwWk..",
        "..kwwwnwwwWk..",
        "...kwwwwwWk...",
        "...kwkwkwk....",
        "....kkkkk.....",
        ".....kwk......",
        "..kkwwwwwkk...",
        ".kwkwkwkwkwk..",
        ".kwwwwwwwwwk..",
        ".kWkwwwwwkWk..",
        "..kkwkwkwkk...",
        "....kwwwk.....",
        "...kwwwwwk....",
      ],
      gambe: {
        dritte: [
          "...kwk.kwk....",
          "...kwk.kLk....",
          "...kwk.kLk....",
          "...kwk.klk....",
          "..kwwk.kLk....",
          "..kkkk.kkk....",
        ],
        passo: [
          "...kwk.kwk....",
          "..kwk..kLk....",
          "..kwk...kLk...",
          ".kwk....klk...",
          "kwwk....kLk...",
          "kkkk....kkk...",
        ],
      },
    },
  };

  const LANTERNA_ACCESA = [
    [
      "...kkk...", "..k...k..", "..k...k..", "...kmk...", "..kMMmk..", ".kMMmmmk.", "kkkkkkkkk",
      ".kvvvvvk.", ".kvvhvvk.", ".kvhHhvk.", ".kvhHhvk.", ".kvvfvvk.", "kkkkkkkkk", ".kMmmmmk.", "..kkkkk..",
    ],
    [
      "...kkk...", "..k...k..", "..k...k..", "...kmk...", "..kMMmk..", ".kMMmmmk.", "kkkkkkkkk",
      ".kvvhvvk.", ".kvhHhvk.", ".kvhHhvk.", ".kvvhvvk.", ".kvvfvvk.", "kkkkkkkkk", ".kMmmmmk.", "..kkkkk..",
    ],
  ];
  const LANTERNA_FIOCA = [...LANTERNA_ACCESA[0]];
  [".kvvvvvk.", ".kvvvvvk.", ".kvvvvvk.", ".kvvhvvk.", ".kvvfvvk."].forEach((r, i) => { LANTERNA_FIOCA[7 + i] = r; });
  const COL_LANTERNA = { k: C.bordo, M: C.ferroChiaro, m: C.ferro, v: C.vetro, h: C.fiammaChiara, H: C.bianco, f: C.fiamma };
  const COL_LANTERNA_SPENTA = { ...COL_LANTERNA, v: C.ferro, h: C.legnoScuro, H: C.legnoScuro, f: C.legnoScuro };

  const ZUCCO = [
    "......Gg......", ".....GGg......", "..kkkkkkkkkk..", ".koOOyyyOOOok.", "koOOyyhyyOOOok", "koOyEEyyOEEOok",
    "koOEeeEyOEeeEk", "koOOEEOOEOEEOk", "koOOOOOEEOOOOk", "koObEbEbEbEbOk", "kooOeEeEeEeOok", ".kooOOOOOOOok.", "..kkkkkkkkkk..",
  ];
  const COL_ZUCCO = {
    k: C.bordo, o: "#9c3b17", O: C.brace, y: C.fiamma, h: C.fiammaChiara, b: "#4a1a12", G: "#2d5a2e", g: "#5f9440", E: C.oro, e: C.luna,
  };

  // ───────────────────────── Logica pura ─────────────────────────
  function partitaIniziale() {
    return { lati: Object.fromEntries(IDS.map((id) => [id, "cancello"])), lanterna: "cancello", minuti: 0, viaggi: [] };
  }

  /** (partita, mossa, variante) -> { partita: nuova, esito }. Nessun disegno, nessuna scrittura. */
  function applica(p, mossa, v) {
    if (!mossa || typeof mossa !== "object") return { partita: p, esito: { valida: false, motivo: "mossa" } };
    if (mossa.tipo === "ricomincia") {
      if (!p.viaggi.length) return { partita: p, esito: { valida: false, motivo: "inizio" } };
      return { partita: partitaIniziale(), esito: { errore: true, motivo: "ricomincia" } };
    }
    if (mossa.tipo !== "attraversa") return { partita: p, esito: { valida: false, motivo: "mossa" } };
    const chi = mossa.chi;
    if (!Array.isArray(chi) || chi.length < 1 || chi.length > 2 || (chi.length === 2 && chi[0] === chi[1])) {
      return { partita: p, esito: { valida: false, motivo: "quanti" } };
    }
    if (chi.some((id) => !IDS.includes(id))) return { partita: p, esito: { valida: false, motivo: "chi" } };
    if (chi.some((id) => p.lati[id] !== p.lanterna)) return { partita: p, esito: { valida: false, motivo: "lanterna" } };
    const durata = Math.max(...chi.map((id) => v.tempi[id]));
    if (p.minuti + durata > v.limite) {
      return { partita: partitaIniziale(), esito: { errore: true, motivo: "spenta", minuti: p.minuti + durata } };
    }
    const verso = p.lanterna === "cancello" ? "porta" : "cancello";
    const lati = { ...p.lati };
    chi.forEach((id) => { lati[id] = verso; });
    const minuti = p.minuti + durata;
    const nuova = {
      lati, lanterna: verso, minuti,
      viaggi: [...p.viaggi, { chi: ordinati(chi), verso, minuti: durata }],
    };
    if (vinta(nuova)) return { partita: nuova, esito: { risolto: true, minuti } };
    return { partita: nuova, esito: { ok: true, minuti, lanterna: verso } };
  }

  function testoCarta(v) {
    const F = v.tempi.fantasma === 1 ? "1 minuto" : `${v.tempi.fantasma} minuti`;
    return "Cinque mostri devono attraversare il cortile buio fino alla porta dell'ingresso, e c'è una sola lanterna. "
      + "Si cammina al massimo in due, sempre con la lanterna, e la coppia va al passo del più lento; poi qualcuno deve "
      + `riportare indietro la lanterna. Il fantasma ci mette ${F}, la strega ${v.tempi.strega}, lo zombie ${v.tempi.zombie}, `
      + `la mummia ${v.tempi.mummia} e lo scheletro con la gamba di legno ${v.tempi.scheletro}. `
      + `La lanterna si spegne dopo ${v.limite} minuti.`;
  }

  function memoriaValida(m, limite) {
    return !!m && !!m.lati && IDS.every((id) => m.lati[id] === "cancello" || m.lati[id] === "porta")
      && (m.lanterna === "cancello" || m.lanterna === "porta")
      && Number.isInteger(m.minuti) && m.minuti >= 0 && m.minuti <= limite
      && Array.isArray(m.viaggi) && !IDS.every((id) => m.lati[id] === "porta");
  }

  // ───────────────────────── Funzioni di disegno ─────────────────────────
  function retinoSolo(ctx, colore, x, y, w, h, quanto) {
    for (let j = 0; j < h; j++) {
      for (let i = 0; i < w; i++) {
        const px = x + i, py = y + j;
        if (BAYER[py & 3][px & 3] / 16 < quanto) rett(ctx, colore, px, py, 1, 1);
      }
    }
  }

  function buioIn(x, y, luceX, riva) {
    const alto = Math.min(1, Math.max(0, (y - 110) / 12));
    let luce = 0;
    if (luceX != null) {
      const d = Math.hypot(x - luceX, y - 140);
      luce = d <= 18 ? 1 : d >= 40 ? 0 : (40 - d) / 22;
    }
    if (riva) {
      const d = x < riva[0] ? riva[0] - x : x > riva[1] ? x - riva[1] : 0;
      luce = Math.max(luce, 1 - d / 24);
    }
    return 0.6 * alto * (1 - Math.min(1, Math.max(0, luce)));
  }

  function lastricato(ctx, x0, x1) {
    [[141, 5], [146, 6], [152, 2]].forEach(([y, h], r) => {
      const largo = r % 2 ? 14 : 12;
      for (let x = x0 + (r % 2 ? -6 : 0), i = 0; x < x1; x += largo, i++) {
        const a = Math.max(x, x0), b = Math.min(x + largo, x1);
        if (b - a < 2) continue;
        rett(ctx, C.bordo, a, y, b - a, h);
        rett(ctx, (i + r) % 3 === 0 ? C.ferroChiaro : C.ferro, a, y, b - a - 1, h - 1);
        rett(ctx, C.pietra, a, y, Math.max(1, b - a - 3), 1);
      }
    });
  }

  function portale(ctx, apertura) {
    rett(ctx, C.bordo, 247, 58, 46, 5);
    rett(ctx, C.tettoChiaro, 248, 59, 44, 1);
    rett(ctx, C.tetto, 248, 60, 44, 2);
    riquadro(ctx, 249, 63, 42, 55, C.ferro);
    for (let y = 69, r = 0; y < 117; y += 6, r++) {
      rett(ctx, C.bordo, 250, y, 40, 1);
      for (let x = 250 + (r % 2 ? 5 : 0); x < 290; x += 10) rett(ctx, C.bordo, x, y + 1, 1, 5);
    }
    rett(ctx, C.ferroChiaro, 250, 64, 2, 53);
    riquadro(ctx, 252, 65, 36, 9, C.legnoChiaro);
    rett(ctx, C.legnoLuce, 253, 66, 34, 1);
    testo(ctx, "INGRESSO", 270, 67, { piccolo: true, colore: C.luna, ombra: C.legnoScuro, allinea: "centro" });
    for (const [y, x, w] of [[75, 262, 16], [76, 260, 20], [77, 258, 24], [78, 257, 26], [79, 257, 26]]) rett(ctx, C.pietra, x, y, w, 1);
    rett(ctx, C.pietra, 257, 80, 26, 38);
    rett(ctx, C.pietraChiara, 257, 78, 1, 39);
    rett(ctx, C.pietraChiara, 260, 76, 3, 1);
    const ARCO = [[77, 264, 12], [78, 262, 16], [79, 261, 18], [80, 260, 20]];
    for (const [y, x, w] of ARCO) rett(ctx, C.bordo, x - 1, y - 1, w + 2, 1);
    rett(ctx, C.bordo, 259, 80, 22, 38);
    for (const [y, x, w] of ARCO) rett(ctx, C.bordo, x, y, w, 1);
    if (apertura === 0) {
      for (const [y, x, w] of ARCO.slice(1)) rett(ctx, C.legno, x + 1, y, w - 2, 1);
      rett(ctx, C.legno, 260, 81, 20, 36);
      for (let x = 263; x < 280; x += 4) rett(ctx, C.legnoScuro, x, 81, 1, 36);
      rett(ctx, C.legnoChiaro, 260, 81, 1, 36);
      rett(ctx, C.bordo, 269, 78, 2, 39);
      for (const y of [88, 108]) {
        rett(ctx, C.ferro, 260, y, 20, 2);
        for (let x = 262; x < 280; x += 4) rett(ctx, C.ferroChiaro, x, y, 1, 1);
      }
      rett(ctx, C.oro, 266, 98, 2, 3); rett(ctx, C.oro, 272, 98, 2, 3);
      rett(ctx, C.oroScuro, 267, 100, 1, 1); rett(ctx, C.oroScuro, 273, 100, 1, 1);
      rett(ctx, C.vetro, 265, 78, 10, 3);
      rett(ctx, C.bordo, 269, 78, 2, 3);
      rett(ctx, C.bordo, 265, 81, 10, 1);
      rett(ctx, C.vetro, 261, 117, 18, 1);
    } else {
      const b = [0, 7, 5, 3][apertura];
      for (const [y, x, w] of ARCO.slice(1)) rett(ctx, C.vetro, x + 1, y, w - 2, 1);
      rett(ctx, C.vetro, 260, 81, 20, 36);
      rett(ctx, C.fiammaChiara, 260, 111, 20, 6);
      rett(ctx, C.legnoScuro, 260, 81, b, 36); rett(ctx, C.legno, 260, 81, 1, 36);
      rett(ctx, C.legnoScuro, 280 - b, 81, b, 36); rett(ctx, C.legno, 279, 81, 1, 36);
    }
  }

  function tavola(ctx, minuti, limite, anteprima, f, lampeggio) {
    rett(ctx, C.ferroChiaro, 112, 16, 1, 3); rett(ctx, C.ferroChiaro, 207, 16, 1, 3);
    riquadro(ctx, 105, 19, 110, 22, C.legnoChiaro);
    rett(ctx, C.legnoLuce, 106, 20, 108, 1);
    rett(ctx, C.legnoScuro, 107, 29, 106, 1);
    rett(ctx, C.legno, 106, 38, 108, 2);
    testo(ctx, `MINUTI ${minuti}/${limite}`, 160, 21, { colore: C.fiammaChiara, allinea: "centro" });
    const x0 = 160 - Math.floor((limite * 3 - 1) / 2);
    const troppo = minuti + anteprima > limite;
    for (let i = 0; i < limite; i++) {
      const x = x0 + i * 3;
      let corpo = i < minuti ? C.legnoScuro : C.fiamma;
      let cima = i < minuti ? C.legnoScuro : C.fiammaChiara;
      if (lampeggio) {
        corpo = cima = f % 4 < 2 ? C.tappetoChiaro : C.legnoScuro;
      } else if (anteprima && i >= minuti && i < minuti + anteprima) {
        corpo = f % 4 < 2 ? (troppo ? C.tappetoChiaro : C.giallo) : C.fiamma;
        cima = C.bianco;
      }
      if (!anteprima && !lampeggio && i === minuti && f % 4 < 2) cima = C.bianco;
      rett(ctx, C.bordo, x, 31, 2, 6);
      rett(ctx, corpo, x, 31, 2, 5);
      rett(ctx, cima, x, 31, 2, 1);
    }
  }

  function cartellino(ctx, cx, minuti, stato) {
    const x = cx - 7, y = 106;
    const fondo = stato === "scelto" ? C.giallo : stato === "buio" ? C.pietra : C.pietraChiara;
    riquadro(ctx, x, y, 15, 11, fondo);
    rett(ctx, stato === "buio" ? C.pietraChiara : C.bianco, x + 1, y + 1, 13, 1);
    testo(ctx, String(minuti), cx + 1, y + 2, { colore: C.bordo, ombra: null, allinea: "centro" });
  }

  function velaPixel(ctx, righe, x, y, specchia) {
    const w = righe[0].length;
    righe.forEach((riga, j) => [...riga].forEach((ch, i) => {
      if (ch === ".") return;
      const px = x + (specchia ? w - 1 - i : i), py = y + j;
      if (BAYER[py & 3][px & 3] / 16 < 0.3) rett(ctx, C.nero, px, py, 1, 1);
    }));
  }

  function disegnaLanterna(ctx, stato, frame, cx, cima) {
    const x = cx - 4;
    if (stato === "accesa") sprite(ctx, LANTERNA_ACCESA[frame], COL_LANTERNA, x, cima);
    else if (stato === "fioca") sprite(ctx, LANTERNA_FIOCA, COL_LANTERNA, x, cima);
    else sprite(ctx, LANTERNA_ACCESA[0], COL_LANTERNA_SPENTA, x, cima);
  }

  /** Un mostro. m: { id, s, cx, specchia, pose, camminando, buio, scelto, salto }; k = fase delle animazioni da fermo. */
  function disegnaMostro(ctx, m, k, riduci) {
    const M = MOSTRI[m.id];
    const cx = m.cx;
    const x = Math.round(cx - M.w / 2);
    const vola = M.vola;
    const fantasma = m.id === "fantasma";
    const gambe = M.gambe[m.pose];
    const passo = m.pose === "passo";
    let respiro = 0, extra = 0, sporge = 0;
    if (!riduci && !m.camminando) {
      if (fantasma) extra = [0, 1, 2, 2, 1, 0, -1, -1][Math.floor(k / 3)];
      else if (Math.floor(k / 6) % 2 === 1) respiro = 1;
      if (m.id === "zombie" && Math.floor(k / 4) % 3 === 1) sporge = m.specchia ? 1 : -1;
    }
    const cimaGambe = 148 - vola - m.salto - gambe.length;
    const cimaCorpo = fantasma
      ? 148 - vola - m.salto - M.corpo.length - extra
      : cimaGambe - M.corpo.length + respiro + (passo ? 1 : 0);
    const xc = x + sporge;
    // ombra a terra
    if (fantasma) rett(ctx, C.nero, cx - 3, 148, 7, 1);
    else { rett(ctx, C.nero, cx - 5, 148, 11, 1); rett(ctx, C.nero, cx - 3, 149, 7, 1); }
    const disegna = (colori, dx, dy) => {
      if (gambe.length) sprite(ctx, gambe, colori, x + dx, cimaGambe + dy, { specchia: m.specchia });
      sprite(ctx, M.corpo, colori, xc + dx, cimaCorpo + dy, { specchia: m.specchia });
    };
    if (m.scelto) {
      const giallo = Object.fromEntries(Object.keys(M.colori).map((l) => [l, C.giallo]));
      for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) disegna(giallo, dx, dy);
    }
    disegna(M.colori, 0, 0);
    if (k === 0 && M.palpebra) {
      for (const [c, r] of M.occhi) rett(ctx, M.palpebra, xc + (m.specchia ? M.w - 1 - c : c), cimaCorpo + r, 1, 1);
    }
    if (m.buio) {
      if (gambe.length) velaPixel(ctx, gambe, x, cimaGambe, m.specchia);
      velaPixel(ctx, M.corpo, xc, cimaCorpo, m.specchia);
    }
  }

  // ───────────────────────── Il rompicapo ─────────────────────────
  const OPZIONI = {
    id: "lanterna-cortile",
    sfondo: "cancello",
    velo: 0.5,

    variante(rng) {
      const serie = SERIE[Math.floor(rng() * SERIE.length)];
      const tempi = {};
      IDS.forEach((id, i) => { tempi[id] = serie.tempi[i]; });
      return { tempi, limite: serie.limite, ordine: mescola(rng, IDS) };
    },

    crea(g) {
      const V = g.variante;
      OPZIONI.testo = testoCarta(V);
      const riduci = g.riduciMovimento;
      const ctx = g.ctx;
      const sopra = g.nuovaTela();
      const pesto = g.nuovaTela();
      const posOrdine = (id) => V.ordine.indexOf(id);

      // Stato
      let partita = partitaIniziale();
      if (g.giaRisolto) {
        partita = {
          lati: Object.fromEntries(IDS.map((id) => [id, "porta"])), lanterna: "porta", minuti: V.limite,
          viaggi: Array.isArray(g.memoria.partita?.viaggi) ? g.memoria.partita.viaggi : [],
        };
      } else if (memoriaValida(g.memoria.partita, V.limite)) {
        partita = JSON.parse(JSON.stringify(g.memoria.partita));
      }
      let scelti = []; // stato dell'interfaccia, non della partita
      let anim = null;
      let armato = false, timerArmato = 0, btnRic = null;

      const salvaPartita = () => { g.memoria.partita = JSON.parse(JSON.stringify(partita)); g.salvaMemoria(); };
      const finisciAnim = () => { anim = null; };

      // ── Messaggi ──
      const MSG_INIZIO = "Tocca uno o due mostri vicino alla lanterna, poi «Attraversa».";
      function messaggioSelezione() {
        if (!scelti.length) { g.messaggio(MSG_INIZIO); return; }
        const durata = Math.max(...scelti.map((id) => V.tempi[id]));
        const r = V.limite - partita.minuti;
        const uno = scelti.length === 1;
        const nome = gruppo(scelti);
        if (durata <= r) g.messaggio(`${nome} ${uno ? "attraversa" : "attraversano"} in ${minutiTesto(durata)}.`);
        else {
          const resto = r === 0 ? "ma la lanterna è agli sgoccioli" : r === 1 ? "ma ne resta 1" : `ma ne restano ${r}`;
          g.messaggio(`${nome} ${uno ? "ci mette" : "ci mettono"} ${minutiTesto(durata)}, ${resto}.`);
        }
      }

      function disarma() {
        armato = false;
        clearTimeout(timerArmato);
        if (btnRic) btnRic.textContent = "Ricomincia";
      }

      // ── Una mossa: la usano tocchi, bottoni e gioca() ──
      function esegui(mossa) {
        finisciAnim();
        const prima = partita;
        const { partita: nuova, esito } = applica(prima, mossa, V);
        if (esito.valida === false) return esito;
        scelti = [];
        disarma();
        partita = nuova;
        salvaPartita();
        if (mossa.tipo === "ricomincia") {
          g.errore("Hai ricominciato da capo");
          g.messaggio("Tutti di nuovo al cancello: la lanterna riparte da zero minuti.");
          if (!riduci) anim = { tipo: "ricomincia", inizio: g.tempo, durata: 250, prima };
          return esito;
        }
        const chi = ordinati(mossa.chi);
        const dur = Math.max(...chi.map((id) => V.tempi[id]));
        const D = 200 + 10 * dur;
        const verso = prima.lanterna === "cancello" ? "porta" : "cancello";
        if (esito.errore) {
          g.errore("La lanterna si è spenta a metà cortile");
          g.messaggio("Buio pesto! Tutti di nuovo al cancello, con la lanterna riaccesa.");
          if (!riduci) {
            const fr = clamp((V.limite - prima.minuti) / dur, 0.2, 0.8);
            anim = { tipo: "spenta", inizio: g.tempo, durata: D * fr + 800, prima, chi, verso, D, fr };
          }
          return esito;
        }
        if (esito.risolto) {
          g.messaggio(`Tutti alla porta in ${V.limite} minuti: la lanterna si spegne proprio adesso!`);
          if (!riduci) anim = { tipo: "vittoria", inizio: g.tempo, durata: D + 1110, prima, chi, verso, D, dur };
          const sorted = [...IDS].map((id) => V.tempi[id]).sort((a, b) => a - b);
          const avido = sorted.slice(1).reduce((s, n) => s + n, 0) + 3 * sorted[0];
          g.risolto({
            riepilogo: `Tutti alla porta in ${V.limite} minuti esatti. Il trucco: i due più lenti passano insieme, `
              + "e di là li aspetta già qualcuno di veloce per riportare la lanterna. "
              + `Accompagnandoli uno alla volta col più veloce ci sarebbero voluti ${avido} minuti.`,
            ritardo: 1700,
          });
          return esito;
        }
        g.messaggio(verso === "porta"
          ? `${gruppo(chi)}: alla porta! Chi riporta indietro la lanterna?`
          : `${gruppo(chi)}: di nuovo al cancello con la lanterna.`);
        if (!riduci) anim = { tipo: "viaggio", inizio: g.tempo, durata: D, prima, chi, verso, D, dur };
        return esito;
      }

      // ── Tocchi e bottoni ──
      function attraversaScelti() {
        if (!scelti.length) { g.messaggio("Prima scegli chi porta la lanterna: uno o due mostri."); return; }
        esegui({ tipo: "attraversa", chi: [...scelti] });
      }

      g.tocca(({ tipo, x, y }) => {
        if (tipo !== "giu") return;
        finisciAnim();
        const xl = X_LANTERNA[partita.lanterna];
        if (Math.abs(x - xl) <= 8 && y >= 122 && y <= 152) { attraversaScelti(); return; }
        if (y < 104 || y > 152) return;
        for (const id of IDS) {
          const s = posOrdine(id);
          const cx = posto(partita.lati[id], s);
          if (Math.abs(x - cx) > 9) continue;
          disarma();
          if (partita.lati[id] !== partita.lanterna) { g.messaggio("La lanterna è dall'altra parte del cortile."); return; }
          if (scelti.includes(id)) scelti = scelti.filter((q) => q !== id);
          else if (scelti.length >= 2) { g.messaggio("Al massimo in due: prima togline uno."); return; }
          else scelti = [...scelti, id];
          messaggioSelezione();
          return;
        }
      });

      g.bottone("Attraversa", () => { finisciAnim(); attraversaScelti(); }, { id: "attraversa", forte: true });
      btnRic = g.bottone("Ricomincia", () => {
        finisciAnim();
        if (!partita.viaggi.length) { g.messaggio("Sono già tutti al cancello, con la lanterna appena accesa."); return; }
        if (!armato) {
          armato = true;
          btnRic.textContent = "Conferma";
          g.messaggio("Ricominciare conta come un errore: premi «Conferma» per farlo.");
          timerArmato = setTimeout(disarma, 4000);
          return;
        }
        disarma();
        esegui({ tipo: "ricomincia" });
      }, { id: "ricomincia" });

      g.messaggio(g.giaRisolto ? "Tutti alla porta: la festa può cominciare." : MSG_INIZIO);

      // ── Viste: cosa mostrare in un dato momento ──
      function vistaBase(p, sc) {
        const mostri = IDS.map((id) => {
          const s = posOrdine(id);
          const lato = p.lati[id];
          const scelto = sc.includes(id);
          return {
            id, s, cx: posto(lato, s), specchia: lato === "cancello", pose: "dritte", camminando: false,
            buio: lato !== p.lanterna, scelto, salto: scelto ? 2 : 0,
          };
        });
        return {
          mostri,
          lanterna: { x: X_LANTERNA[p.lanterna], cima: 133, stato: "accesa" },
          minuti: p.minuti,
          anteprima: sc.length ? Math.max(...sc.map((id) => V.tempi[id])) : 0,
          luceX: X_LANTERNA[p.lanterna],
          riva: RIVA[p.lanterna],
          apertura: 0, zucco: null, tappeto: false, cartellini: true, pesto: false, lampeggio: false,
        };
      }

      function vistaFinale() {
        const v = vistaBase({ lati: Object.fromEntries(IDS.map((id) => [id, "porta"])), lanterna: "porta", minuti: V.limite }, []);
        v.mostri.forEach((m) => { m.buio = false; });
        v.lanterna.stato = "spenta";
        v.luceX = null;
        v.riva = RIVA.porta;
        v.apertura = 3;
        v.zucco = 99;
        v.tappeto = true;
        v.cartellini = false;
        return v;
      }

      function camminata(prima, chi, verso, t) {
        const v = vistaBase(prima, []);
        v.mostri.forEach((m) => { m.buio = true; });
        let davanti = verso === "porta" ? -Infinity : Infinity;
        for (const id of chi) {
          const m = v.mostri.find((q) => q.id === id);
          const x0 = posto(prima.lati[id], m.s), x1 = posto(verso, m.s);
          m.cx = Math.round(x0 + (x1 - x0) * t);
          m.specchia = verso === "porta";
          m.pose = Math.floor(Math.abs(m.cx - x0) / 6) % 2 ? "passo" : "dritte";
          m.camminando = true;
          m.buio = false;
          davanti = verso === "porta" ? Math.max(davanti, m.cx) : Math.min(davanti, m.cx);
        }
        const xL = verso === "porta" ? clamp(davanti + 9, 106, 214) : clamp(davanti - 9, 106, 214);
        v.lanterna = { x: xL, cima: xL > 106 && xL < 214 ? 121 : 133, stato: "accesa" };
        v.luceX = xL;
        v.riva = null;
        v.anteprima = 0;
        return v;
      }

      function vistaAnim(a, tr) {
        if (a.tipo === "viaggio") {
          const t = Math.min(1, tr / a.D);
          const v = camminata(a.prima, a.chi, a.verso, t);
          v.minuti = Math.round(a.prima.minuti + a.dur * t);
          return v;
        }
        if (a.tipo === "spenta") {
          const Tw = a.D * a.fr;
          const v = camminata(a.prima, a.chi, a.verso, Math.min(a.fr, tr / a.D));
          v.minuti = Math.round(a.prima.minuti + (V.limite - a.prima.minuti) * Math.min(1, tr / Tw));
          if (tr >= Tw + 150) { v.lanterna.stato = "spenta"; v.luceX = null; } else if (tr >= Tw) v.lanterna.stato = "fioca";
          if (tr >= Tw + 300) { v.pesto = true; v.lampeggio = true; }
          return v;
        }
        if (a.tipo === "ricomincia") {
          const v = vistaBase(a.prima, []);
          v.pesto = true;
          return v;
        }
        // vittoria
        if (tr < a.D) {
          const t = tr / a.D;
          const v = camminata(a.prima, a.chi, "porta", t);
          v.minuti = Math.round(a.prima.minuti + a.dur * t);
          return v;
        }
        const u = tr - a.D;
        const v = vistaFinale();
        v.apertura = 0; v.zucco = null; v.tappeto = false; v.cartellini = true;
        if (u < 150) {
          v.lanterna.stato = "fioca"; v.luceX = X_LANTERNA.porta; v.riva = RIVA.porta;
        } else if (u < 300) {
          v.riva = null;
        } else {
          v.apertura = Math.min(3, 1 + Math.floor((u - 300) / 130));
          v.cartellini = false;
          v.tappeto = true;
          if (u >= 690) {
            const ph = u - 690;
            v.zucco = Math.max(99, 105 - 2 * Math.floor(ph / 125));
            v.mostri.forEach((m) => { m.salto = ph >= m.s * 70 && ph < m.s * 70 + 140 ? 2 : 0; });
          }
        }
        return v;
      }

      // ── Disegno ──
      let chiaveLuce = null;
      let pestoAcceso = false;

      function ridisegnaBase(luceX, riva) {
        ctx.clearRect(0, 0, g.larghezza, g.altezza);
        lastricato(ctx, 4, 100);
        lastricato(ctx, 220, 316);
        for (let y = 110; y <= 153; y++) {
          for (let x = 0; x < 320; x++) {
            const q = buioIn(x, y, luceX, riva);
            if (q > 0 && BAYER[y & 3][x & 3] / 16 < q) rett(ctx, C.nero, x, y, 1, 1);
          }
        }
      }

      function disegnaPesto(acceso) {
        pesto.clearRect(0, 0, g.larghezza, g.altezza);
        if (!acceso) return;
        const im = pesto.createImageData(320, 180);
        for (let y = 42; y <= 153; y++) {
          for (let x = 0; x < 320; x++) {
            if (BAYER[y & 3][x & 3] / 16 < 0.8) {
              const i = (y * 320 + x) * 4;
              im.data[i] = 3; im.data[i + 1] = 1; im.data[i + 2] = 4; im.data[i + 3] = 255;
            }
          }
        }
        pesto.putImageData(im, 0, 0);
      }

      function disegnaSopra(v, fermo) {
        const f = riduci ? 0 : Math.max(0, g.fotogramma);
        sopra.clearRect(0, 0, g.larghezza, g.altezza);
        // tappeto di luce
        if (v.tappeto) {
          for (let y = 118; y <= 153; y++) {
            const a = Math.round(260 - (y - 118) * 0.6), b = Math.round(280 + (y - 118) * 0.6);
            retinoSolo(sopra, C.fiamma, a, y, b - a, 1, 0.22);
          }
        }
        // tepore della lanterna
        if (v.lanterna.stato === "accesa") {
          const r = riduci || f % 2 === 0 ? 12 : 11;
          for (let y = 140 - r; y <= 140 + r; y++) {
            if (y < 118) continue;
            for (let x = v.lanterna.x - r; x <= v.lanterna.x + r; x++) {
              if (Math.hypot(x - v.lanterna.x, y - 140) <= r && BAYER[y & 3][x & 3] / 16 < 0.35) rett(sopra, C.muroAcceso, x, y, 1, 1);
            }
          }
        }
        portale(sopra, v.apertura);
        if (v.apertura === 3 && v.zucco != null) sprite(sopra, ZUCCO, COL_ZUCCO, 263, v.zucco, {});
        // occhi nel buio
        OCCHI.forEach(([ex, ey, colore], i) => {
          if (!riduci && (f + SFASA_OCCHI[i]) % 28 === 0) return;
          for (const dx of [0, 4]) {
            if (buioIn(ex + dx, ey, v.luceX, v.riva) >= 0.45) rett(sopra, colore, ex + dx, ey, 2, 1);
          }
        });
        // mostri: prima i fermi, poi quelli in cammino
        const fase = (m) => (riduci ? 1 : (f + 5 * m.s) % 24);
        v.mostri.filter((m) => !m.camminando).forEach((m) => disegnaMostro(sopra, m, fase(m), riduci));
        v.mostri.filter((m) => m.camminando).forEach((m) => disegnaMostro(sopra, m, fase(m), riduci));
        // lanterna
        disegnaLanterna(sopra, v.lanterna.stato, riduci ? 0 : Math.floor(f / 2) % 2, v.lanterna.x, v.lanterna.cima);
        // cartellini
        if (v.cartellini) {
          v.mostri.forEach((m) => cartellino(sopra, m.cx, V.tempi[m.id], m.scelto ? "scelto" : m.buio ? "buio" : "normale"));
        }
        // etichetta +N
        if (fermo && v.anteprima > 0) {
          const troppo = v.minuti + v.anteprima > V.limite;
          testo(sopra, `+${v.anteprima}`, v.lanterna.x + 1, 123, { colore: troppo ? C.tappetoChiaro : C.giallo, allinea: "centro" });
        }
        tavola(sopra, v.minuti, V.limite, fermo ? v.anteprima : 0, f, v.lampeggio);
      }

      g.anima(() => {
        if (anim && g.tempo - anim.inizio >= anim.durata) anim = null;
        const fermo = !anim;
        const v = anim
          ? vistaAnim(anim, g.tempo - anim.inizio)
          : (vinta(partita) ? vistaFinale() : vistaBase(partita, scelti));
        const chiave = `${v.luceX}|${v.riva}`;
        if (chiave !== chiaveLuce) { ridisegnaBase(v.luceX, v.riva); chiaveLuce = chiave; }
        if (v.pesto !== pestoAcceso) { disegnaPesto(v.pesto); pestoAcceso = v.pesto; }
        disegnaSopra(v, fermo);
      });

      // ── L'aggancio per le prove ──
      g.espone({
        gioca: (mossa) => esegui(mossa),
        statoGioco: () => ({
          lati: { ...partita.lati },
          lanterna: partita.lanterna,
          minuti: partita.minuti,
          limite: V.limite,
          viaggi: JSON.parse(JSON.stringify(partita.viaggi)),
          scelti: [...scelti],
        }),
        posizione: (id) => ({ x: posto(partita.lati[id], posOrdine(id)), y: 132 }),
        posizioneLanterna: () => ({ x: X_LANTERNA[partita.lanterna], y: 140 }),
      });
    },
  };

  EscapeDemo.avvia(OPZIONI);
})();
