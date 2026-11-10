// I bauli del deposito: casse da spingere su una pianta 10x9, quattro segni di gesso da coprire.
// La logica (statoIniziale, muovi, incastrati) e' pura: stato + mossa -> nuovo stato, esito ed eventi.
// Il disegno legge lo stato e anima i pezzi su pixel interi.

(function () {
  "use strict";
  const { C, rett, sprite, testo } = EscapeDemo;

  // ── Livelli verificati (identici a quelli di verifica.mjs) ──
  const LIVELLI = [
    { spinte: 43, pianta: ["##########", "#    #. ##", "# $#    ##", "#@$  #   #", "# $#     #", "##      ##", "##$     .#", "#      ..#", "##########"] },
    { spinte: 42, pianta: ["##########", "#.     ###", "## .  #@##", "# . # #$ #", "#    #  ##", "#  # #$  #", "##  $$   #", "## .    ##", "##########"] },
    { spinte: 44, pianta: ["##########", "##  #   ##", "#  ## $$##", "#  @$    #", "#  . #   #", "#  #. #$ #", "#  # #   #", "#  . .# ##", "##########"] },
    { spinte: 40, pianta: ["##########", "#    #@  #", "#  # $$$ #", "##  #  ###", "# .  #  ##", "# .#   $ #", "#        #", "#..   #  #", "##########"] },
    { spinte: 44, pianta: ["##########", "# . #    #", "# @$#    #", "# $$ #.  #", "#    ## ##", "#       ##", "# $##. . #", "#        #", "##########"] },
    { spinte: 41, pianta: ["##########", "###  @## #", "#  # $   #", "#  ## $$ #", "#.#   #  #", "#.  . #$ #", "#  #    ##", "# .      #", "##########"] },
    { spinte: 41, pianta: ["##########", "# #   . ##", "#.   . $ #", "###  ##  #", "### #   ##", "##@$ $$. #", "## #  #  #", "#   #    #", "##########"] },
    { spinte: 41, pianta: ["##########", "###  . # #", "#     .. #", "##$    # #", "##    ####", "#  .## # #", "# $$$    #", "# #@ #   #", "##########"] },
  ];
  const SPECCHI = ["nessuno", "orizzontale", "verticale", "entrambi"];

  const DIR = { su: [0, -1], giu: [0, 1], sinistra: [-1, 0], destra: [1, 0] };
  const DIREZIONI = ["su", "giu", "sinistra", "destra"];

  // ── Logica pura ──
  function leggiLivello(pianta) {
    const liv = { pianta, segni: [], zucco0: null, bauli0: [] };
    for (let y = 0; y < pianta.length; y++)
      for (let x = 0; x < pianta[y].length; x++) {
        const ch = pianta[y][x];
        if (ch === "." || ch === "*" || ch === "+") liv.segni.push([x, y]);
        if (ch === "$" || ch === "*") liv.bauli0.push([x, y]);
        if (ch === "@" || ch === "+") liv.zucco0 = [x, y];
      }
    return liv;
  }
  const statoIniziale = (liv) => ({
    zucco: [...liv.zucco0], bauli: liv.bauli0.map((b) => [...b]), spinte: 0, prima: null, direzione: "giu",
  });
  const muro = (liv, x, y) => (liv.pianta[y] || "#")[x] === undefined || liv.pianta[y][x] === "#";
  const indiceBaule = (bauli, x, y) => bauli.findIndex((b) => b[0] === x && b[1] === y);
  const eSegno = (liv, x, y) => liv.segni.some((s) => s[0] === x && s[1] === y);
  const contaSulSegno = (liv, bauli) => bauli.filter((b) => eSegno(liv, b[0], b[1])).length;
  const chiave = (b) => b[0] + "," + b[1];
  function allaPartenza(liv, bauli) {
    const a = new Set(bauli.map(chiave));
    return liv.bauli0.every((b) => a.has(chiave(b))) && a.size === liv.bauli0.length;
  }
  const clona = (s) => ({ ...s, zucco: [...s.zucco], bauli: s.bauli.map((b) => [...b]), prima: s.prima && { ...s.prima, zucco: [...s.prima.zucco], bauli: s.prima.bauli.map((b) => [...b]) } });

  function incastrati(liv, bauli) {
    const m = (x, y) => liv.pianta[y][x] === "#";
    const baule = (x, y) => bauli.some((b) => b[0] === x && b[1] === y);
    const segno = (x, y) => liv.segni.some((s) => s[0] === x && s[1] === y);
    const fuori = (x, y) => baule(x, y) && !segno(x, y);
    const out = new Set();
    for (const [x, y] of bauli)
      if (!segno(x, y) && (m(x, y - 1) || m(x, y + 1)) && (m(x - 1, y) || m(x + 1, y))) out.add(`${x},${y}`);
    for (let y = 0; y < 8; y++) for (let x = 0; x < 9; x++) {
      const q = [[x, y], [x + 1, y], [x, y + 1], [x + 1, y + 1]];
      if (q.every(([a, b]) => m(a, b) || baule(a, b)) && q.some(([a, b]) => fuori(a, b)))
        for (const [a, b] of q) if (fuori(a, b)) out.add(`${a},${b}`);
    }
    return [...out].map((k) => k.split(",").map(Number));
  }

  /** Strada piu' corta da `da` a `a` sulle caselle libere (bauli esclusi); null se non c'e'. */
  function percorso(liv, bauli, da, a) {
    const k = (x, y) => y * 16 + x;
    const prec = new Map([[k(da[0], da[1]), null]]);
    const coda = [da];
    while (coda.length) {
      const [x, y] = coda.shift();
      if (x === a[0] && y === a[1]) break;
      for (const d of DIREZIONI) {
        const nx = x + DIR[d][0], ny = y + DIR[d][1];
        if (muro(liv, nx, ny) || indiceBaule(bauli, nx, ny) >= 0 || prec.has(k(nx, ny))) continue;
        prec.set(k(nx, ny), [x, y]);
        coda.push([nx, ny]);
      }
    }
    if (!prec.has(k(a[0], a[1]))) return null;
    const lista = [];
    for (let c = a; c; c = prec.get(k(c[0], c[1]))) lista.unshift([...c]);
    return lista;
  }
  const dirDi = (da, a) => (a[0] > da[0] ? "destra" : a[0] < da[0] ? "sinistra" : a[1] > da[1] ? "giu" : "su");

  function muovi(liv, stato, mossa) {
    const nulla = (motivo, ev) => ({ stato, esito: { valida: false, motivo }, eventi: ev || {} });
    if (!mossa || typeof mossa !== "object") return nulla("mossa sconosciuta");

    if (typeof mossa.dir === "string" && DIR[mossa.dir]) {
      const [dx, dy] = DIR[mossa.dir];
      const nx = stato.zucco[0] + dx, ny = stato.zucco[1] + dy;
      if (muro(liv, nx, ny)) return nulla("muro", { tipo: "muro", dir: mossa.dir });
      const i = indiceBaule(stato.bauli, nx, ny);
      const s = clona(stato);
      s.direzione = mossa.dir;
      if (i < 0) {
        s.zucco = [nx, ny];
        return { stato: s, esito: { ok: true, spinta: false, zucco: [nx, ny] },
          eventi: { tipo: "passo", da: stato.zucco, a: [nx, ny], dir: mossa.dir } };
      }
      const bx = nx + dx, by = ny + dy;
      if (muro(liv, bx, by) || indiceBaule(stato.bauli, bx, by) >= 0)
        return nulla("bloccato", { tipo: "bloccato", dir: mossa.dir, baule: i });
      s.prima = { zucco: [...stato.zucco], bauli: stato.bauli.map((b) => [...b]), spinte: stato.spinte, direzione: stato.direzione };
      s.bauli[i] = [bx, by];
      s.zucco = [nx, ny];
      s.spinte = stato.spinte + 1;
      const sul = contaSulSegno(liv, s.bauli);
      const inc = incastrati(liv, s.bauli).some((b) => b[0] === bx && b[1] === by);
      const esito = { ok: true, spinta: true, zucco: [nx, ny], sulSegno: sul, incastrato: inc };
      if (sul === 4) { esito.risolto = true; esito.spinte = s.spinte; }
      return { stato: s, esito, eventi: { tipo: "spinta", da: stato.zucco, a: [nx, ny], dir: mossa.dir, baule: i, bauleDa: [nx, ny], bauleA: [bx, by] } };
    }

    if (Array.isArray(mossa.vai)) {
      const [x, y] = mossa.vai;
      if (!Number.isInteger(x) || !Number.isInteger(y) || x < 1 || x > 8 || y < 1 || y > 7) return nulla("fuori");
      if (muro(liv, x, y)) return nulla("muro");
      if (x === stato.zucco[0] && y === stato.zucco[1]) return nulla("gia li");
      if (indiceBaule(stato.bauli, x, y) >= 0) return nulla("baule");
      const p = percorso(liv, stato.bauli, stato.zucco, [x, y]);
      if (!p) return nulla("irraggiungibile");
      const s = clona(stato);
      s.zucco = [x, y];
      s.direzione = dirDi(p[p.length - 2], p[p.length - 1]);
      return { stato: s, esito: { ok: true, spinta: false, zucco: [x, y], passi: p.length - 1 }, eventi: { tipo: "vai", percorso: p } };
    }

    if (mossa.annulla === true) {
      if (!stato.prima) return nulla("niente da annullare");
      const s = clona(stato);
      s.zucco = [...stato.prima.zucco];
      s.bauli = stato.prima.bauli.map((b) => [...b]);
      s.spinte = stato.prima.spinte;
      s.direzione = stato.prima.direzione;
      s.prima = null;
      return { stato: s, esito: { ok: true, annullata: true, spinte: s.spinte }, eventi: { tipo: "annulla" } };
    }

    if (mossa.ricomincia === true) {
      if (allaPartenza(liv, stato.bauli)) return nulla("gia alla partenza");
      return { stato: statoIniziale(liv), esito: { errore: true, motivo: "ricominciato" }, eventi: { tipo: "ricomincia" } };
    }
    return nulla("mossa sconosciuta");
  }

  // ── Sprite ──
  const PAVIMENTO = {
    colori: { L: C.legnoChiaro, l: C.legno, s: C.legnoScuro },
    righe: [
      "LLLLLLLLLLLsLLLLLL", "lllllllllllsllllll", "llllLLlllllsllllll", "lllllllllllsllllll", "lllllllllllslllLll", "ssssssssssssssssss",
      "LLLLsLLLLLLLLLLLLL", "llllslllllllllllll", "llllsllllllllLLlll", "llllslllllllllllll", "llllsllLllllllllll", "ssssssssssssssssss",
      "LLLLLLLLLLLLLLsLLL", "llllllllllllllslll", "lllLLlllllllllslll", "llllllllllllllslll", "llllllllllLlllslll", "ssssssssssssssssss",
    ],
  };
  const MURO_SOPRA = {
    colori: { a: C.ferroChiaro, b: C.ferro, c: C.mattone },
    righe: [
      "aaaaaaaacaaaaaaaac", "abbbbbbbcabbbbbbbc", "abbcbbbbcabbbbbbbc", "abbbbbbbcabbbbbbbc", "abbbbbbbcabbbbbbbc", "cccccccccccccccccc",
      "aaacaaaaaaaacaaaaa", "bbbcabbbbbbbcabbbb", "bbbcabbbbbbbcabbbb", "bbbcabbbbbbbcabcbb", "bbbcabbbbbbbcabbbb", "cccccccccccccccccc",
      "aaaaaaaacaaaaaaaac", "abbbbbbbcabbbbbbbc", "abbbbbbbcabcbbbbbc", "abbbbbbbcabbbbbbbc", "abbbbbbbcabbbbbbbc", "cccccccccccccccccc",
    ],
  };
  const MURO_FRONTE = {
    colori: { d: C.muroAcceso, e: C.muroCaldo, k: C.bordo },
    righe: ["ddddddddkddddddddk", "eeeeeeeekeeeeeeeek", "kkkkkkkkkkkkkkkkkk", "eeekeeeeeeeekeeeee", "eeekeeeeeeeekeeeee", "kkkkkkkkkkkkkkkkkk"],
  };
  const SEGNO = {
    righe: [
      "wwwW..........Wwww", "w................w", "w................W", "W................w", "..................",
      ".....wW....ww.....", "......ww..ww......", ".......wWww.......", "........ww........", "........ww........",
      ".......wwWw.......", "......ww..ww......", ".....ww....Ww.....", "..................", "w................W",
      "W................w", "w................w", "wwwW..........Wwww",
    ],
  };
  const COL_SEGNO = { w: C.pietraChiara, W: C.pietra };
  const COL_SEGNO_ACCESO = { w: C.giallo, W: C.oro };
  const BAULE = {
    colori: { k: C.bordo, R: C.tappetoChiaro, r: C.tappeto, L: C.legnoLuce, O: C.oroScuro, o: C.oro, y: C.giallo },
    righe: [
      ".kkkkkkkkkkkkkk.", "kyRRRLRRRRLRRRok", "kRRRRLRRRRLRRRrk", "kRRRRLRRRRLRRRrk", "krrrrLrrrrLrrrrk", "kOOOOOOOOOOOOOOk",
      "koRRRLRyyRLRRRok", "kRRRRLROORLRRRrk", "kRRRRLRRRRLRRRrk", "kRRRRLRRRRLRRRrk", "kRRRRLRRRRLRRRrk", "kRRRRLRRRRLRRRrk",
      "koRRRLRRRRLRRRok", "krrrrLrrrrLrrrrk", "krrrrLrrrrLrrrrk", ".kkkkkkkkkkkkkk.",
    ],
  };
  const COL_BAULE = BAULE.colori;
  const COL_BAULE_SEGNO = { ...BAULE.colori, O: C.oro, o: C.giallo, y: C.bianco };
  const COL_BAULE_INCASTRATO = { ...BAULE.colori, R: C.tappeto, r: C.legnoScuro, L: C.legno, O: C.ferro, o: C.ferroChiaro, y: C.ferroChiaro };
  // Il baule aperto: le righe 6-8 (vuote) ospitano il costume, disegnato a parte.
  const BAULE_APERTO = [
    ".kkkkkkkkkkkkkk.", "krrrrrrrrrrrrrrk", "krLrrrrrrrrrrLrk", "krLrrrrrrrrrrLrk", "krLrrrrrrrrrrLrk", "kOOOOOOOOOOOOOOk",
    "k..............k", "k..............k", "k..............k", "kOOOOOOOOOOOOOOk", "koRRRLRyyRLRRRok", "kRRRRLROORLRRRrk",
    "kRRRRLRRRRLRRRrk", "kRRRRLRRRRLRRRrk", "kRRRRLRRRRLRRRrk", "kRRRRLRRRRLRRRrk", "koRRRLRRRRLRRRok", "krrrrLrrrrLrrrrk",
    "krrrrLrrrrLrrrrk", ".kkkkkkkkkkkkkk.",
  ];
  const COSTUMI = [
    { nome: "lenzuolo da fantasma", righe: ["wwwwwwwwwwwwwW", "wwwnnwwwnnwwWW", "wwwwwwwwwwwWWW"], colori: { w: C.bianco, W: C.pietraChiara, n: C.nero } },
    { nome: "cappello da strega", righe: ["rrrrrrPvrrrrrr", "rrrrrPPvvrrrrr", "PPPPPPoPPPPPPP"], colori: { r: C.tappeto, P: C.violaScuro, v: C.viola, o: C.oro } },
    { nome: "bende da mummia", righe: ["wWwwWwwWwwWwwW", "WwwWwwWwwWwwWw", "wwWwwWwwWwwWww"], colori: { w: C.pietraChiara, W: C.pietra } },
    { nome: "mantello da vampiro", righe: ["nnnnnRRRRnnnnn", "nnnnRRRRRRnnnn", "nnnRRRRRRRRnnn"], colori: { n: C.nero, R: C.tappetoChiaro } },
  ];
  const ZUCCO_COLORI = { k: C.bordo, o: "#9c3b17", O: C.brace, y: C.fiamma, h: C.fiammaChiara, E: C.oro, e: C.luna,
    b: C.legnoScuro, G: C.erbaScura, g: C.erba, p: C.viola, P: C.violaScuro, q: C.lilla };
  const ZUCCO_FRONTE = [
    "......Gg......", ".....GGg......", "..kkkkkkkkkk..", ".koOOyyyOOOok.", "koOOyyhyyOOOok", "koOyEEyyOEEOok", "koOEeeEyOEeeEk",
    "koOOEEOOEOEEOk", "koOOOOOEEOOOOk", "koObEbEbEbEbOk", "kooOeEeEeEeOok", ".kooOOOOOOOok.", "..kkkkkkkkkk..", "...kqppppPk...",
    "...kppppPPk...", "...kkk..kkk...",
  ];
  const ZUCCO_RETRO = [
    "......Gg......", ".....GGg......", "..kkkkkkkkkk..", ".koOOyyyOOOok.", "koOyyyhyyyOOok", "koOyyOyyOyyOok", "koOyyOyyOyyOok",
    "koOyyOyyOyyOok", "koOyyOyyOyyOok", "koOOyOyyOyOOok", "kooOOOOOOOOOok", ".kooOOOOOOOok.", "..kkkkkkkkkk..", "...kPppppPk...",
    "...kPPppPPk...", "...kkk..kkk...",
  ];
  const ZUCCO_LATO = [
    ".....Gg.......", ".....GGg......", "..kkkkkkkkkk..", ".koOOyyyyOOok.", "koOOyyhyyyOOok", "koOyyyyyyEEOok", "koOyyyyyyEeeEk",
    "koOyyyyyyOEEOk", "koOOyyyyyOOOOk", "koOOyyyyyEbEbk", "kooOOyyyyeEeEk", ".kooOOOOOOOok.", "..kkkkkkkkkk..", "...kqppppPk...",
    "...kppppPPk...", "...kkk..kkk...",
  ];
  const PIEDI_PASSO = "...kk....kk...";
  const MINI_SEGNO = ["w...w", ".w.w.", "..w..", ".w.w.", "w...w"];
  const RAGNO = {
    colori: { k: C.bordo, v: C.violaScuro, l: C.viola, r: C.tappetoChiaro },
    righe: [
      "......k......", ".....kkk.....", "k...klvvk...k", ".k.klvvvvk.k.", "..kkvvvvvkk..", "kkk.kvvvk.kkk", "...k.krk.k...",
      "..k.krkrk.k..", ".k...kkk...k.", "k...........k",
    ],
  };

  // ── Coordinate della scena ──
  const pxDi = (x) => 88 + (x - 1) * 18;
  const pyDi = (y) => 22 + (y - 1) * 18;
  const cellaDi = (x, y) => [pxDi(x), pyDi(y)];

  // ── Disegno fisso (una volta sola) ──
  function disegnaFisso(ctx, liv) {
    // ombra della pianta a scacchi
    for (let y = 17; y <= 157; y++) for (let x = 239; x <= 241; x++) if ((x + y) % 2 === 0) rett(ctx, C.nero, x, y, 1, 1);
    for (let y = 155; y <= 157; y++) for (let x = 84; x <= 241; x++) if ((x + y) % 2 === 0) rett(ctx, C.nero, x, y, 1, 1);
    // cornice
    rett(ctx, C.bordo, 81, 13, 158, 142);
    const cappa = (x, y, w, h) => {
      rett(ctx, C.ferro, x, y, w, h);
      rett(ctx, C.ferroChiaro, x, y, w, 1);
      rett(ctx, C.ferroChiaro, x, y, 1, h);
      for (let yy = y + 5; yy < y + h; yy += 9) rett(ctx, C.mattone, x, yy, w, 1);
    };
    cappa(82, 14, 6, 139);
    cappa(232, 14, 6, 139);
    rett(ctx, C.ferro, 82, 14, 156, 2); rett(ctx, C.ferroChiaro, 82, 14, 156, 1);
    for (let i = 0; i < 8; i++) sprite(ctx, MURO_FRONTE.righe, MURO_FRONTE.colori, 88 + i * 18, 16);
    rett(ctx, C.ferro, 82, 149, 156, 3); rett(ctx, C.ferroChiaro, 82, 149, 156, 1);
    rett(ctx, C.muroCaldo, 82, 152, 156, 2);
    rett(ctx, C.bordo, 82, 148, 156, 1);
    rett(ctx, C.bordo, 87, 16, 1, 132);
    rett(ctx, C.bordo, 232, 16, 1, 132);
    // pavimento e muri interni
    for (let y = 1; y <= 7; y++) for (let x = 1; x <= 8; x++) {
      const px = pxDi(x), py = pyDi(y);
      if (!muro(liv, x, y)) {
        sprite(ctx, PAVIMENTO.righe, PAVIMENTO.colori, px, py, { specchia: (x + y) % 2 === 1 });
        if (muro(liv, x, y - 1)) {
          rett(ctx, C.legnoScuro, px, py, 18, 2);
          for (let i = 0; i < 18; i += 2) rett(ctx, C.legnoScuro, px + i, py + 2, 1, 1);
        }
        if (muro(liv, x - 1, y)) rett(ctx, C.legnoScuro, px, py, 2, 18);
      } else {
        if (!muro(liv, x, y + 1)) {
          sprite(ctx, MURO_SOPRA.righe.slice(0, 12), MURO_SOPRA.colori, px, py);
          sprite(ctx, MURO_FRONTE.righe, MURO_FRONTE.colori, px, py + 12);
        } else sprite(ctx, MURO_SOPRA.righe, MURO_SOPRA.colori, px, py);
        if (!muro(liv, x - 1, y)) rett(ctx, C.bordo, px, py, 1, 18);
        if (!muro(liv, x + 1, y)) rett(ctx, C.bordo, px + 17, py, 1, 18);
        if (!muro(liv, x, y - 1)) rett(ctx, C.bordo, px, py, 18, 1);
      }
    }
    // lavagna
    rett(ctx, C.bordo, 19, 134, 4, 16); rett(ctx, C.legno, 20, 134, 2, 15);
    rett(ctx, C.bordo, 69, 134, 4, 16); rett(ctx, C.legno, 70, 134, 2, 15);
    rett(ctx, C.bordo, 12, 96, 66, 40);
    rett(ctx, C.legnoChiaro, 13, 97, 64, 38);
    rett(ctx, C.legnoLuce, 13, 97, 64, 1); rett(ctx, C.legnoLuce, 13, 97, 1, 38);
    rett(ctx, C.legno, 13, 133, 64, 2); rett(ctx, C.legno, 75, 97, 2, 38);
    rett(ctx, C.siepe, 15, 99, 60, 34);
    for (const [x, y] of [[28, 120], [53, 104], [64, 128], [38, 131], [70, 101]]) rett(ctx, C.erbaScura, x, y, 2, 1);
    rett(ctx, C.pietraChiara, 58, 134, 5, 1);
  }

  const opzioni = {
    id: "casse-deposito",
    sfondo: "deposito",
    velo: 0.5,

    variante(rng) {
      const i = EscapeDemo.intero(rng, 0, LIVELLI.length - 1);
      const s = EscapeDemo.intero(rng, 0, 3);
      let pianta = [...LIVELLI[i].pianta];
      if (s === 1 || s === 3) pianta = pianta.map((r) => [...r].reverse().join(""));
      if (s === 2 || s === 3) pianta = pianta.reverse();
      return { livello: i + 1, specchio: SPECCHI[s], spinteMinime: LIVELLI[i].spinte, pianta };
    },

    crea(g) {
      opzioni.testo = g.scheda.enigma + "\n" +
        "«Annulla» toglie gratis l'ultima spinta, ma solo quella. Ricominciare il livello conta come un errore.";
      const V = g.variante;
      const liv = leggiLivello(V.pianta);
      const segniOrd = [...liv.segni].sort((a, b) => a[1] - b[1] || a[0] - b[0]);
      const cmp = (a, b) => a[1] - b[1] || a[0] - b[0];
      const chiaveMemoria = "L" + V.livello + "-" + V.specchio;
      const RID = g.riduciMovimento;

      // ── Stato (con ripresa da salvataggio) ──
      let stato = statoIniziale(liv);
      (function ripristina() {
        const p = g.memoria && g.memoria.partita;
        if (!p || p.chiave !== chiaveMemoria) return;
        try {
          const ok = Array.isArray(p.bauli) && p.bauli.length === 4 && Array.isArray(p.zucco) &&
            p.bauli.every((b) => Array.isArray(b) && !muro(liv, b[0], b[1])) &&
            new Set(p.bauli.map(chiave)).size === 4 && !muro(liv, p.zucco[0], p.zucco[1]) &&
            indiceBaule(p.bauli, p.zucco[0], p.zucco[1]) < 0 && DIR[p.direzione];
          if (!ok) return;
          stato = { zucco: [...p.zucco], bauli: p.bauli.map((b) => [...b]), spinte: Number(p.spinte) || 0, prima: p.prima || null, direzione: p.direzione };
        } catch { /* si riparte dalla pianta */ }
      })();
      if (g.giaRisolto && contaSulSegno(liv, stato.bauli) !== 4) {
        stato = statoIniziale(liv);
        stato.bauli = liv.segni.map((s) => [...s]);
      }
      let visDir = stato.direzione;
      let incPrec = incastrati(liv, stato.bauli);
      const risoltoLogico = () => contaSulSegno(liv, stato.bauli) === 4;

      function salvaPartita() {
        g.memoria.partita = {
          chiave: chiaveMemoria, zucco: stato.zucco, bauli: stato.bauli, spinte: stato.spinte, prima: stato.prima, direzione: stato.direzione,
        };
        g.salvaMemoria();
      }

      // ── Animazioni ──
      let tracce = {};          // "z" o indice del baule -> { pts, passo, t0, dirs }
      let effetti = [];         // urti, tremolii, lampi
      let tocco = null;         // { x, y, ok, t0 }
      let hover = null;         // [x, y]
      let ragni = [];           // { tipo, t0 }
      let vinto = null;         // { t0 } oppure "subito"
      let flashNumero = -1;     // fotogramma fino a cui il numero e' bianco
      let ultimoNumero = stato.spinte;
      if (g.giaRisolto) vinto = "subito";

      const fine = () => { tracce = {}; };
      function traccia(chiaveP, pts, passo, dirs) {
        if (RID) return;
        tracce[chiaveP] = { pts, passo, t0: g.tempo, dirs };
      }
      function scivola(da, a, passo, dir, chiaveP) {
        if (da[0] === a[0] && da[1] === a[1]) return;
        traccia(chiaveP, [cellaDi(da[0], da[1]), cellaDi(a[0], a[1])], passo, [dir]);
      }
      function posTraccia(tr, t) {
        const n = tr.pts.length - 1;
        const e = t - tr.t0;
        if (e >= n * tr.passo) return null;
        const i = Math.max(0, Math.floor(e / tr.passo));
        const f = (e - i * tr.passo) / tr.passo;
        const a = tr.pts[i], b = tr.pts[i + 1];
        return { x: Math.round(a[0] + (b[0] - a[0]) * f), y: Math.round(a[1] + (b[1] - a[1]) * f), dir: tr.dirs[i] };
      }
      const aggiungiEffetto = (ef) => { if (!RID) effetti.push({ t0: g.tempo, ...ef }); };

      // ── Conferma di Ricomincia ──
      let btnAnnulla, btnRic;
      let inAttesa = false, timerAttesa = 0;
      function azzeraConferma() {
        if (!inAttesa) return;
        inAttesa = false;
        clearTimeout(timerAttesa);
        btnRic.textContent = "Ricomincia";
        btnRic.classList.remove("kit-btn-forte");
      }
      function aggiornaBottoni() {
        const fin = g.stato().risolto || risoltoLogico() && vinto;
        btnAnnulla.disabled = !stato.prima || !!fin;
        btnRic.disabled = allaPartenza(liv, stato.bauli) || !!fin;
      }

      // ── La mossa: unica porta d'ingresso per tocchi, tastiera, bottoni e prove ──
      function mossa(m) {
        azzeraConferma();
        const prima = stato;
        const sulPrima = contaSulSegno(liv, prima.bauli);
        const r = muovi(liv, prima, m);
        const e = r.esito, ev = r.eventi;

        if (e.valida === false) {
          if (m && DIR[m.dir]) visDir = m.dir;
          if (ev.tipo === "muro") aggiungiEffetto({ tipo: "urto", dir: ev.dir });
          else if (ev.tipo === "bloccato") {
            aggiungiEffetto({ tipo: "urto", dir: ev.dir });
            aggiungiEffetto({ tipo: "trema", dir: ev.dir, baule: ev.baule });
            g.messaggio("Da quella parte il baule non si muove.");
          } else if (m && Array.isArray(m.vai)) {
            if (e.motivo === "baule") g.messaggio("Prima avvicinati al baule, poi spingilo.");
            else if (e.motivo === "irraggiungibile") g.messaggio("Zucco non ci arriva senza spingere un baule.");
          } else if (m && m.annulla) {
            g.messaggio(prima.spinte > 0 ? "Si può annullare solo l'ultima spinta." : "Non c'è nessuna spinta da annullare.");
          } else if (m && m.ricomincia) g.messaggio("I bauli sono già al loro posto.");
          aggiornaBottoni();
          return e;
        }

        fine();
        stato = r.stato;
        visDir = stato.direzione;
        const inc = incastrati(liv, stato.bauli);
        const sulDopo = contaSulSegno(liv, stato.bauli);

        if (ev.tipo === "passo") scivola(ev.da, ev.a, 150, ev.dir, "z");
        else if (ev.tipo === "spinta") {
          scivola(ev.da, ev.a, 150, ev.dir, "z");
          scivola(ev.bauleDa, ev.bauleA, 150, ev.dir, ev.baule);
          aggiungiEffetto({ tipo: "piega", dir: ev.dir });
        } else if (ev.tipo === "vai") {
          const p = ev.percorso;
          const ms = Math.max(30, Math.min(60, Math.floor(480 / (p.length - 1))));
          const dirs = [];
          for (let i = 0; i < p.length - 1; i++) dirs.push(dirImm(p[i], p[i + 1]));
          traccia("z", p.map((c) => cellaDi(c[0], c[1])), ms, dirs);
        } else if (ev.tipo === "annulla") {
          const vecchiBauli = prima.bauli;
          scivola(prima.zucco, stato.zucco, 150, visDir, "z");
          stato.bauli.forEach((b, i) => scivola(vecchiBauli[i], b, 150, visDir, i));
        } else if (ev.tipo === "ricomincia") {
          scivola(prima.zucco, stato.zucco, 350, "giu", "z");
          stato.bauli.forEach((b, i) => scivola(prima.bauli[i], b, 350, "giu", i));
          aggiungiEffetto({ tipo: "lampo" });
          ragni.push({ tipo: "protesta", t0: g.tempo });
        }

        // messaggi
        if (ev.tipo === "spinta") {
          if (e.risolto) g.messaggio("Tutti i bauli sono sui segni!");
          else if (inc.length > incPrec.length) g.messaggio("Quel baule è incastrato: annulla la spinta o ricomincia.");
          else if (sulDopo > sulPrima) g.messaggio(`Un baule è sul segno: ${sulDopo} su 4.`);
          else if (sulDopo < sulPrima) g.messaggio(`Il baule ha lasciato il segno: ${sulDopo} su 4.`);
          else if (stato.spinte === 1) g.messaggio("Spinto! «Annulla» toglie l'ultima spinta, ma solo quella.");
          if (inc.length > incPrec.length && !RID) ragni.push({ tipo: "scende", t0: g.tempo });
        } else if (ev.tipo === "annulla") {
          g.messaggio(inc.length ? "Spinta annullata, ma c'è ancora un baule incastrato." : "Ultima spinta annullata.");
        } else if (ev.tipo === "ricomincia") {
          g.errore("Hai ricominciato il livello");
          g.messaggio("I bauli sono tornati al loro posto. Si riparte!");
        }
        incPrec = inc;
        salvaPartita();

        if (e.risolto) {
          vinto = { t0: g.tempo };
          if (!RID) ragni.push({ tipo: "yoyo", t0: g.tempo + 1000 });
          const riepilogo = stato.spinte === V.spinteMinime
            ? `Quattro bauli sui segni in ${stato.spinte} spinte: meglio di così non si poteva!`
            : `Quattro bauli sui segni in ${stato.spinte} spinte. Il modo più corto ne chiede ${V.spinteMinime}.`;
          g.risolto({ riepilogo, ritardo: 1600 });
        }
        aggiornaBottoni();
        return e;
      }
      function dirImm(a, b) { return dirDi(a, b); }

      // ── Tocchi ──
      let inizio = null;
      g.tocca(({ tipo, x, y, premuto, evento }) => {
        if (tipo === "giu") { inizio = { x, y }; return; }
        if (tipo === "muovi") {
          if (!premuto && evento && evento.pointerType === "mouse") {
            const cx = Math.floor((x - 88) / 18) + 1, cy = Math.floor((y - 22) / 18) + 1;
            hover = cx >= 1 && cx <= 8 && cy >= 1 && cy <= 7 ? [cx, cy] : null;
          } else hover = null;
          return;
        }
        if (tipo !== "su" || !inizio) return;
        const dx = x - inizio.x, dy = y - inizio.y;
        const sx = inizio.x, sy = inizio.y;
        inizio = null;
        if (Math.abs(dx) >= 6 || Math.abs(dy) >= 6) {
          mossa({ dir: Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? "destra" : "sinistra") : (dy > 0 ? "giu" : "su") });
          return;
        }
        const m = mossaDaCasella(sx, sy);
        if (!m) return;
        const r = mossa(m.mossa);
        tocco = { x: m.cx, y: m.cy, ok: r.valida !== false, t0: g.tempo };
      });
      function mossaDaCasella(x, y) {
        const cx = Math.floor((x - 88) / 18) + 1, cy = Math.floor((y - 22) / 18) + 1;
        if (cx < 1 || cx > 8 || cy < 1 || cy > 7) return null;
        const [zx, zy] = stato.zucco;
        if (cx === zx && cy === zy) return null;
        const dist = Math.abs(cx - zx) + Math.abs(cy - zy);
        if (dist === 1) return { cx, cy, mossa: { dir: dirDi([zx, zy], [cx, cy]) } };
        return { cx, cy, mossa: { vai: [cx, cy] } };
      }

      // ── Tastiera ──
      addEventListener("keydown", (e) => {
        if (e.ctrlKey || e.metaKey || e.altKey) return;
        if (document.querySelector(".kit-velo-carta:not([hidden])") || g.stato().risolto) return;
        const mappa = { ArrowUp: "su", ArrowDown: "giu", ArrowLeft: "sinistra", ArrowRight: "destra", w: "su", s: "giu", a: "sinistra", d: "destra", W: "su", S: "giu", A: "sinistra", D: "destra" };
        if (mappa[e.key]) {
          if (e.key.startsWith("Arrow")) e.preventDefault();
          mossa({ dir: mappa[e.key] });
        } else if (e.key === "z" || e.key === "Z" || e.key === "Backspace") {
          e.preventDefault();
          mossa({ annulla: true });
        }
      });

      // ── Bottoni ──
      btnAnnulla = g.bottone("Annulla", () => mossa({ annulla: true }), { id: "annulla" });
      btnRic = g.bottone("Ricomincia", () => {
        if (inAttesa) { mossa({ ricomincia: true }); return; }
        inAttesa = true;
        btnRic.textContent = "Sicuro?";
        btnRic.classList.add("kit-btn-forte");
        g.messaggio("Ricominciare conta come un errore. Premi di nuovo per confermare.");
        timerAttesa = setTimeout(azzeraConferma, 4000);
      }, { id: "ricomincia" });
      aggiornaBottoni();
      g.messaggio(g.giaRisolto ? "I bauli sono tutti sui segni." : "Tocca il pavimento per camminare, tocca un baule vicino per spingerlo.");

      // ── Disegno ──
      disegnaFisso(g.ctx, liv);
      const m = g.nuovaTela();
      let tremola = false, ultimoFot = -1;

      function angoli(px, py, colore) {
        rett(m, colore, px, py, 3, 1); rett(m, colore, px, py, 1, 3);
        rett(m, colore, px + 15, py, 3, 1); rett(m, colore, px + 17, py, 1, 3);
        rett(m, colore, px, py + 17, 3, 1); rett(m, colore, px, py + 15, 1, 3);
        rett(m, colore, px + 15, py + 17, 3, 1); rett(m, colore, px + 17, py + 15, 1, 3);
      }
      function bauleAperto(px, py, j) {
        sprite(m, BAULE_APERTO, COL_BAULE_SEGNO, px + 1, py - 3);
        sprite(m, COSTUMI[j % 4].righe, COSTUMI[j % 4].colori, px + 2, py + 3);
      }

      function yRagno(t) {
        let y = 46 + (!RID && g.fotogramma % 16 >= 8 ? 1 : 0);
        let dx = 0;
        for (const r of ragni) {
          const e = t - r.t0;
          if (e < 0) continue;
          if (r.tipo === "scende") {
            if (e < 200) y = 46 + Math.floor(16 * e / 200);
            else if (e < 1200) y = 62;
            else if (e < 1600) y = 62 - Math.floor(16 * (e - 1200) / 400);
          } else if (r.tipo === "protesta") {
            if (e < 1000) dx = Math.floor(e / 125) % 2 ? 1 : -1;
          } else if (r.tipo === "yoyo") {
            if (e < 1000) {
              const i = Math.floor(e / 250), f = (e - i * 250) / 250;
              const pts = [46, 30, 46, 30, 46];
              y = Math.round(pts[i] + (pts[i + 1] - pts[i]) * f);
            }
          }
        }
        ragni = ragni.filter((r) => t - r.t0 < 2000);
        return { y, dx };
      }

      g.anima((t) => {
        m.clearRect(0, 0, 320, 180);
        const fot = g.fotogramma;
        if (fot !== ultimoFot) { ultimoFot = fot; tremola = !RID && Math.random() < 0.3; }
        if (stato.spinte !== ultimoNumero) { ultimoNumero = stato.spinte; flashNumero = fot + 2; }
        effetti = effetti.filter((ef) => t - ef.t0 < 1000);

        const T = vinto && vinto !== "subito" ? t - vinto.t0 : vinto ? 99999 : -1;
        const incs = incastrati(liv, stato.bauli);

        // posizioni disegnate
        const posZ = (() => {
          const base = cellaDi(stato.zucco[0], stato.zucco[1]);
          const tr = tracce.z && posTraccia(tracce.z, t);
          return tr ? { x: tr.x, y: tr.y, dir: tr.dir, cammina: true, ti: t - tracce.z.t0 } : { x: base[0], y: base[1], dir: visDir, cammina: false };
        })();
        const posB = stato.bauli.map((b, i) => {
          const base = cellaDi(b[0], b[1]);
          const tr = tracce[i] && posTraccia(tracce[i], t);
          return tr ? { x: tr.x, y: tr.y, fermo: false, cella: b } : { x: base[0], y: base[1], fermo: true, cella: b };
        });

        // segni di gesso
        const lampeggia = T >= 150 && T < 550 && Math.floor((T - 150) / 100) % 2 === 1;
        const lampo2 = T >= 150 && T < 550;
        for (const s of liv.segni) {
          const [px, py] = cellaDi(s[0], s[1]);
          const sopra = posB.some((p) => p.fermo && p.cella[0] === s[0] && p.cella[1] === s[1]);
          let col = sopra ? COL_SEGNO_ACCESO : COL_SEGNO;
          if (lampo2) col = { w: lampeggia ? C.bianco : C.giallo, W: lampeggia ? C.giallo : C.oro };
          sprite(m, SEGNO.righe, col, px, py);
        }

        // effetti su Zucco
        let ox = 0, oy = 0;
        for (const ef of effetti) {
          const e = t - ef.t0;
          const [dx, dy] = ef.tipo === "urto" || ef.tipo === "piega" ? DIR[ef.dir] : [0, 0];
          if (ef.tipo === "urto" && e < 160) {
            const k = e < 80 ? 2 * e / 80 : 2 * (160 - e) / 80;
            ox += Math.round(dx * k); oy += Math.round(dy * k);
          } else if (ef.tipo === "piega" && posZ.cammina) { ox += dx; oy += dy; }
        }
        if (T >= 1000 && T < 1480) {
          const e = (T - 1000) % 240;
          if (e < 120) oy -= 2;
        }
        const trema = (i) => {
          let o = [0, 0];
          for (const ef of effetti) if (ef.tipo === "trema" && ef.baule === i) {
            const k = Math.floor((t - ef.t0) / 40);
            const v = [1, -1, 1, 0][k] || 0;
            o = [DIR[ef.dir][0] * v, DIR[ef.dir][1] * v];
          }
          return o;
        };

        // pezzi ordinati per y
        const pezzi = [];
        stato.bauli.forEach((b, i) => {
          const p = posB[i];
          const tr = trema(i);
          pezzi.push({ y: p.y, disegna() {
            const px = p.x + tr[0], py = p.y + tr[1];
            rett(m, C.bordo, px + 2, py + 17, 15, 1);
            const sulSegno = p.fermo && eSegno(liv, b[0], b[1]);
            const j = segniOrd.findIndex((s) => s[0] === b[0] && s[1] === b[1]);
            if (sulSegno && j >= 0 && T >= 550 + 150 * j) { bauleAperto(px, py, j); return; }
            const inc = p.fermo && incs.some((q) => q[0] === b[0] && q[1] === b[1]);
            sprite(m, BAULE.righe, sulSegno ? COL_BAULE_SEGNO : inc ? COL_BAULE_INCASTRATO : COL_BAULE, px + 1, py + 1);
            if (sulSegno && !RID) {
              const k = (Math.floor(fot / 2) + i) % 4;
              const c = [[0, 0], [17, 0], [17, 17], [0, 17]][k];
              rett(m, C.bianco, px + c[0], py + c[1], 1, 1);
            }
          } });
        });
        pezzi.push({ y: posZ.y + oy, disegna() {
          const sx = posZ.x + ox, sy = posZ.y + oy;
          rett(m, C.bordo, posZ.x + 4 + ox, posZ.y + 17 + oy * 0, 10, 1);
          const dir = posZ.dir;
          const righe = dir === "giu" ? ZUCCO_FRONTE : dir === "su" ? ZUCCO_RETRO : ZUCCO_LATO;
          const spec = dir === "sinistra";
          const colori = tremola ? { ...ZUCCO_COLORI, e: C.giallo } : ZUCCO_COLORI;
          const resp = !RID && !posZ.cammina && fot % 16 >= 8 ? 1 : 0;
          sprite(m, righe.slice(0, 13), colori, sx + 2, sy + 1 + resp, { specchia: spec });
          const piedi = posZ.cammina && Math.floor(posZ.ti / 75) % 2 === 1 ? [righe[13], righe[14], PIEDI_PASSO] : righe.slice(13);
          sprite(m, piedi, colori, sx + 2, sy + 14, { specchia: spec });
        } });
        pezzi.sort((a, b) => a.y - b.y);
        for (const p of pezzi) p.disegna();

        // sopra tutto: "!" sui bauli incastrati fermi
        if (!risoltoLogico()) {
          const acceso = RID || Math.floor(fot / 2) % 2 === 0;
          if (acceso) stato.bauli.forEach((b, i) => {
            if (posB[i].fermo && incs.some((q) => q[0] === b[0] && q[1] === b[1])) {
              const [px, py] = cellaDi(b[0], b[1]);
              testo(m, "!", px + 7, py - 5, { colore: C.tappetoChiaro });
            }
          });
        }
        // riquadri del tocco e del mouse
        if (hover && !g.stato().risolto) {
          const mm = mossaDaCasella(pxDi(hover[0]) + 1, pyDi(hover[1]) + 1);
          if (mm && muovi(liv, stato, mm.mossa).esito.valida !== false) angoli(pxDi(hover[0]), pyDi(hover[1]), C.brand);
        }
        if (tocco && t - tocco.t0 < 250) angoli(pxDi(tocco.x), pyDi(tocco.y), tocco.ok ? C.brand : C.tappetoChiaro);

        // scintille della vittoria
        if (T >= 0 && T < 99999 && !RID) {
          for (let j = 0; j < 4; j++) {
            const e = T - (550 + 150 * j);
            if (e < 0) continue;
            const f = Math.floor(e / 125);
            if (f >= 10) continue;
            const s = segniOrd[j];
            const [px, py] = cellaDi(s[0], s[1]);
            for (let k = 0; k < 4; k++) {
              rett(m, (j + k) % 2 ? C.bianco : C.giallo, px + 3 + 3 * k, py - 3 - Math.floor(f / 2) - (k % 2), 1, 1);
            }
          }
        }
        // lampo rosso della cornice
        for (const ef of effetti) if (ef.tipo === "lampo") {
          const e = t - ef.t0;
          if (e < 600 && Math.floor(e / 100) % 2 === 0) {
            rett(m, C.tappetoChiaro, 81, 13, 158, 2); rett(m, C.tappetoChiaro, 81, 153, 158, 2);
            rett(m, C.tappetoChiaro, 81, 13, 2, 142); rett(m, C.tappetoChiaro, 237, 13, 2, 142);
          }
        }

        // ragno
        const rg = yRagno(t);
        rett(m, C.pietra, 266, 16, 1, rg.y - 16);
        sprite(m, RAGNO.righe, RAGNO.colori, 260 + rg.dx, rg.y);

        // lavagna
        testo(m, "SPINTE", 19, 102, { piccolo: true, colore: C.pietra, ombra: null });
        testo(m, String(Math.min(999, stato.spinte)), 19, 109, { scala: 2, colore: fot < flashNumero ? C.bianco : C.pietraChiara, ombra: null });
        testo(m, "SEGNI", 19, 126, { piccolo: true, colore: C.pietra, ombra: null });
        const sul = contaSulSegno(liv, stato.bauli);
        for (let i = 0; i < 4; i++) sprite(m, MINI_SEGNO, { w: i < sul ? C.giallo : C.erbaScura }, 43 + 7 * i, 126);
      });

      g.espone({
        gioca: (mm) => mossa(mm),
        statoGioco: () => ({
          zucco: [...stato.zucco],
          bauli: stato.bauli.map((b) => [...b]).sort(cmp),
          segni: [...liv.segni].sort(cmp),
          spinte: stato.spinte,
          sulSegno: contaSulSegno(liv, stato.bauli),
          incastrati: incastrati(liv, stato.bauli).sort(cmp),
          annullabile: !!stato.prima,
          risolto: risoltoLogico(),
        }),
        posizione: (x, y) => ({ x: 79 + 18 * x, y: 13 + 18 * y }),
      });
    },
  };
  EscapeDemo.avvia(opzioni);
})();
