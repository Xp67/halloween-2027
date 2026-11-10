// «La zucca vuota» (zucche-di-piombo): la bilancia a due piatti e le zucche dell'Ingresso.
// Il giocatore mette le zucche sui piatti, pesa al massimo due volte e consegna la zucca diversa.
// L'avversario decide quale zucca è quella diversa solo alla fine (tiene il gruppo più numeroso).
// Logica pulita (stato + mossa → nuovo stato ed esito) in alto; il disegno e i tocchi più sotto.

(function () {
  "use strict";
  const { C, rett, retino, sprite, testo, BAYER } = EscapeDemo;

  const ZONE = ["panca", "sinistro", "destro"];
  const ordina = (a) => [...a].sort((x, y) => x - y);
  const tutte = (n) => Array.from({ length: n }, (_, i) => i + 1);
  const copia = (x) => JSON.parse(JSON.stringify(x));

  // ════════════════════════ LOGICA ════════════════════════

  function nuovoTentativo(n, numero = 1) {
    return {
      posizioni: Array(n).fill("panca"), sinistro: [], destro: [], pesate: 0,
      possibili: tutte(n), registro: [], tentativo: numero,
    };
  }

  /** L'avversario: tiene il gruppo di zucche possibili più numeroso; a parità, quello con la zucca preferita prima. */
  function avversario(v, possibili, sinistro, destro) {
    const gruppi = [
      { gruppo: "fuori", resta: possibili.filter((z) => !sinistro.includes(z) && !destro.includes(z)) },
      { gruppo: "sinistro", resta: possibili.filter((z) => sinistro.includes(z)) },
      { gruppo: "destro", resta: possibili.filter((z) => destro.includes(z)) },
    ];
    const max = Math.max(...gruppi.map((g) => g.resta.length));
    const rango = (g) => Math.min(...g.resta.map((z) => v.preferite.indexOf(z)));
    return gruppi.filter((g) => g.resta.length === max).sort((a, b) => rango(a) - rango(b))[0];
  }

  /** Da gruppo scelto a piatto che scende. */
  function scendeDa(tipo, gruppo) {
    if (gruppo === "fuori") return null;
    if (tipo === "pesante") return gruppo;
    return gruppo === "sinistro" ? "destro" : "sinistro";
  }

  const rifiuto = (motivo) => ({ valida: false, motivo });
  const zuccaValida = (v, i) => Number.isInteger(i) && i >= 1 && i <= v.n;

  function logicaMetti(v, st, i, zona) {
    if (!zuccaValida(v, i)) return { st, esito: rifiuto("zucca inesistente") };
    if (!ZONE.includes(zona)) return { st, esito: rifiuto("zona inesistente") };
    if (st.posizioni[i - 1] === zona) return { st, esito: rifiuto("già lì") };
    if (zona !== "panca" && st[zona].length >= 4) return { st, esito: rifiuto("piatto pieno") };
    const n = copia(st);
    const da = n.posizioni[i - 1];
    if (da !== "panca") n[da] = n[da].filter((z) => z !== i);
    if (zona !== "panca") n[zona].push(i);
    n.posizioni[i - 1] = zona;
    return { st: n, esito: { ok: true } };
  }

  function logicaSgombra(v, st) {
    if (!st.sinistro.length && !st.destro.length) return { st, esito: rifiuto("piatti vuoti") };
    const n = copia(st);
    n.posizioni = n.posizioni.map(() => "panca");
    n.sinistro = [];
    n.destro = [];
    return { st: n, esito: { ok: true } };
  }

  function logicaPesa(v, st) {
    if (st.pesate >= 2) return { st, esito: rifiuto("pesate finite") };
    if (!st.sinistro.length || !st.destro.length) return { st, esito: rifiuto("piatto vuoto") };
    if (st.sinistro.length !== st.destro.length) return { st, esito: rifiuto("numeri diversi") };
    const r = avversario(v, st.possibili, st.sinistro, st.destro);
    const scende = scendeDa(v.tipo, r.gruppo);
    const n = copia(st);
    n.possibili = ordina(r.resta);
    n.pesate += 1;
    n.registro.push({ sinistro: ordina(st.sinistro), destro: ordina(st.destro), scende });
    return { st: n, esito: { ok: true, pesata: n.pesate, scende } };
  }

  function logicaConsegna(v, st, i) {
    if (!zuccaValida(v, i)) return { st, esito: rifiuto("zucca inesistente") };
    if (st.possibili.length === 1 && st.possibili[0] === i) return { st, esito: { risolto: true, zucca: i } };
    const motivo = v.tipo === "leggera" ? `La zucca ${i} è piena` : `La zucca ${i} non ha il piombo`;
    return { st: nuovoTentativo(v.n, st.tentativo + 1), esito: { errore: true, motivo } };
  }

  /** La memoria salvata è un tentativo coerente? */
  function memoriaValida(m, n) {
    if (!m || typeof m !== "object") return false;
    const ok = Array.isArray(m.posizioni) && m.posizioni.length === n && m.posizioni.every((p) => ZONE.includes(p))
      && Array.isArray(m.sinistro) && Array.isArray(m.destro) && Array.isArray(m.possibili) && Array.isArray(m.registro);
    if (!ok) return false;
    if (m.sinistro.length > 4 || m.destro.length > 4) return false;
    for (const z of ["sinistro", "destro"]) {
      if (!m[z].every((i) => Number.isInteger(i) && i >= 1 && i <= n && m.posizioni[i - 1] === z)) return false;
      if (m.posizioni.filter((p) => p === z).length !== m[z].length) return false;
    }
    return Number.isInteger(m.pesate) && m.pesate >= 0 && m.pesate <= 2 && m.registro.length === m.pesate
      && m.possibili.length > 0 && m.possibili.every((i) => Number.isInteger(i) && i >= 1 && i <= n)
      && Number.isInteger(m.tentativo) && m.tentativo >= 1;
  }

  // ════════════════════════ GRAFICA: DATI ════════════════════════

  const ZUCCA = [
    ".......kk.......",
    "......kgGk......",
    "...kkkkgGkkkk...",
    ".kkhhyOooOyOOkk.",
    "khhhyOhyyyOyOOok",
    "khhyOhyyyyyOyOok",
    "khyyOhyyyyyOyOok",
    "kyyyOyyyyyyOyOok",
    "kyyyOyyyyyyOOOok",
    "kOyyyOyyyyOOOOok",
    ".kOyyyOyyOOOOok.",
    "..kOOOOOOOoook..",
    "...kkkkkkkkkk...",
  ];
  const ZUCCA_SCURO = "#9c3b17"; // fuori paletta: l'ombra della testa di Zucco
  const COL_ZUCCA = { n: C.nero, k: C.bordo, h: C.fiammaChiara, y: C.fiamma, O: C.brace, o: ZUCCA_SCURO, g: C.erba, G: C.erbaScura };
  const COL_ZUCCA_SEL = { ...COL_ZUCCA, k: C.giallo };
  const COL_ZUCCA_SBAGLIATA = { ...COL_ZUCCA, k: C.tappetoChiaro };
  const COL_PIOMBO = { k: C.bordo, h: C.pietraChiara, y: C.pietra, O: C.ferroChiaro, o: C.ferro, g: C.erba, G: C.erbaScura };
  const CROCE = ["xx...xx", ".xx.xx.", "..xxx..", ".xx.xx.", "xx...xx"];
  const ZUCCA_APERTA = [
    "........kk......",
    ".......kgGk.....",
    ".....kkkgGkkk...",
    "...kkhhyyOOOOkk.",
    "...khhyyyyyOOok.",
    "....kkkkkkkkkk..",
    "................",
    "................",
    "................",
    ".kkkkkkkkkkkkkk.",
    "kOnnnnnnnnnnnnOk",
    "khhyOhyyyyyOyOok",
    "khyyOhyyyyyOyOok",
    "kyyyOyyyyyyOyOok",
    "kyyyOyyyyyyOOOok",
    "kOyyyOyyyyOOOOok",
    ".kOyyyOyyOOOOok.",
    "..kOOOOOOOoook..",
    "...kkkkkkkkkk...",
  ];
  const STELLINA = [".w.", "wWw", ".w."];

  const ZUCCO = [
    "......Gg..........",
    ".....GGg..........",
    "..kkkkkkkkkk......",
    ".koOOyyyOOOok.....",
    "koOOyyhyyOOOok....",
    "koOyEEyyOEEOok....",
    "koOEeeEyOEeeEk....",
    "koOOEEOOEOEEOk....",
    "koOOOOOEEOOOOk....",
    "koObEbEbEbEbOk....",
    "kooOeEeEeEeOok....",
    ".kooOOOOOOOok.....",
    "..kkkkkkkkkk......",
    "..kqqpppppPk......",
    ".kqppppppppPk.....",
    ".kqpppppppPPkk....",
    "kqpppppppPPPkPk...",
    "kqppppppPPPPk.Pk..",
    "kqpppppPPPPPk.kkk.",
    ".kppppPPPPPk..kek.",
    "..kkkkkkkkk...kEk.",
    "....kBBkLLk...kkk.",
    "....kBBkLLk.......",
    "....kBBkLLk.......",
    "....kBBkLLk.......",
    "....kBBkLLk.......",
    "...kRRRkTTTk......",
    "...kkkkkkkkk......",
  ];
  const COL_ZUCCO = {
    k: C.bordo, o: "#9c3b17", O: "#d9661a", y: "#f59a2e", h: "#ffd07a", E: "#ffb52e", e: "#fff3b0", b: "#4a1a12",
    G: "#2d5a2e", g: "#5f9440", q: "#a47bf0", p: "#6a43b8", P: "#3f2a78", B: "#463a6a", L: "#7a6aa4", R: "#5e3c44", T: "#83575c",
  };

  const BUTTAFUORI = [
    ".......kkkkkkk..........",
    ".....kkwwwwwwwkk........",
    "....kwwwwwwwwwwWk.......",
    "....kwwwwwwwwwwWk.......",
    "...kwwwwwwwwwwWWk.......",
    "...knnnnnnnnnnnnkk......",
    "...knlnnnnknlnnnkSk.....",
    "...kknnnnkkknnnkkSk.....",
    "....kwwwwkwwwwWWkb......",
    "....kwwwwwwwwwWSkb......",
    ".....kwkwkwkwkSkb.......",
    ".....kwkwkwkwkkb........",
    "......kkkkkkkkb.........",
    "..kkkkkkkWWSkkkkkkkkkk..",
    ".kFFFFFFFWWSFFFFFFFFFFk.",
    "kFFFFFFFFFFffffffffffffk",
    "kFFFkFFFFFFffffffffkfffk",
    "kFFFkFFFFFFfffyooffkfffk",
    "kFFFkFFFFFFfffoooffkfffk",
    "kFFFkFFFFFfffffffffkfffk",
    "kFFFkFFFFFfffffffffkfffk",
    "kkkkkFFFFFfffffffffkkkkk",
    "kwWkFFFFFFffffffffffkwWk",
    ".kwWkFFFFFfffffffffkwWk.",
    "..kwWkFFFFffffffffkwWk..",
    "...kwWkFFFfffffffkwWk...",
    "...kFwWkFFffffffkwWfk...",
    "...kFFwwwwwwwwwwwWffk...",
    "...kFFkwSwSwSwSwSkffk...",
    "...kFFFkkkkkkkkkkfffk...",
    "...kkkkkkkkookkkkkkkk...",
    "...kjjjjjjjjJJJJJJJJk...",
    "...kjjjjjjjjJJJJJJJJk...",
    "...kjjjjjjjkkJJJJJJJk...",
    "...kjjjjjjjkkJJJJJJJk...",
    "...kjjjjjjjkkJJJJJJJk...",
    "...kjjjjjjjkkJJJJJJJk...",
    "...kjjjjjjjkkJJJJJJJk...",
    "...kjjjjjjjkkJJJJJJJk...",
    "...kjjjjjjjkkJJJJJJJk...",
    "..ksszssssskksszsssssk..",
    "...kkkkkkkk..kkkkkkkk...",
  ];
  const COL_BUTTAFUORI = {
    k: C.bordo, w: C.bianco, W: C.pietraChiara, S: C.pietra, n: C.nero, l: C.notteChiara, b: C.notteChiara,
    F: C.ferroChiaro, f: C.ferro, j: C.notte, J: C.sagoma, s: C.nero, z: C.ferroChiaro, o: C.oro, y: C.giallo,
  };

  // Le righe dell'arco del portone (come arco() in sfondi/sfondi.js).
  const ARCO = [];
  for (let y = 78; y < 110; y++) {
    const dy = 96 - y, mw = dy > 0 ? Math.sqrt(Math.max(0, 324 - dy * dy)) : 18;
    const x = Math.round(160 - mw);
    ARCO.push([y, x, Math.round(160 + mw) - x]);
  }

  const puntini = (ctx, colore, x, y, w, h, quanto) => {
    for (let j = 0; j < h; j++)
      for (let i = 0; i < w; i++)
        if (BAYER[(y + j) & 3][(x + i) & 3] / 16 < quanto) rett(ctx, colore, x + i, y + j, 1, 1);
  };

  /** Disegna solo le righe da..a di uno sprite, con uno scostamento. */
  function righe(ctx, sp, colori, x, y, da, a, dx, dy) {
    sprite(ctx, sp.slice(da, a + 1), colori, x + dx, y + da + dy);
  }

  // ════════════════════════ GRAFICA: DISEGNI ════════════════════════

  const PIVOT_X = 160, PIVOT_Y = 42, BRACCIO = 64;
  const yTrave = (x, t) => PIVOT_Y + Math.round((t * (PIVOT_X - x)) / BRACCIO);

  function colonna(ctx) {
    const x = 157;
    rett(ctx, C.bordo, x, 45, 7, 67);
    rett(ctx, C.pietraChiara, x + 1, 45, 1, 67);
    rett(ctx, C.pietra, x + 2, 45, 2, 67);
    rett(ctx, C.ferroChiaro, x + 4, 45, 1, 67);
    rett(ctx, C.ferro, x + 5, 45, 1, 67);
    for (const y of [60, 78, 96]) {
      rett(ctx, C.bordo, x - 1, y, 9, 4);
      rett(ctx, C.oro, x, y + 1, 7, 1);
      rett(ctx, C.oroScuro, x, y + 2, 7, 1);
      rett(ctx, C.giallo, x, y + 1, 2, 1);
    }
    rett(ctx, C.bordo, 149, 111, 23, 7);
    rett(ctx, C.pietra, 150, 112, 21, 1);
    rett(ctx, C.ferroChiaro, 150, 113, 21, 4);
    rett(ctx, C.ferro, 164, 113, 7, 4);
    rett(ctx, C.bordo, 141, 117, 39, 10);
    rett(ctx, C.pietraChiara, 142, 118, 37, 1);
    rett(ctx, C.pietra, 142, 119, 37, 6);
    rett(ctx, C.ferroChiaro, 168, 119, 11, 6);
    rett(ctx, C.oro, 146, 121, 2, 2);
    rett(ctx, C.oro, 173, 121, 2, 2);
    retino(ctx, C.ferroChiaro, C.bordo, 142, 125, 37, 1, 0.5);
    puntini(ctx, C.bordo, 139, 127, 43, 2, 0.5);
  }

  function trave(ctx, t) {
    for (let x = 92; x <= 228; x++) {
      const y = yTrave(x, t), d = Math.abs(x - PIVOT_X), e = d < 20 ? 2 : d < 40 ? 1 : 0;
      rett(ctx, C.bordo, x, y - 2 - e, 1, 5 + 2 * e);
      rett(ctx, C.pietraChiara, x, y - 1 - e, 1, 1);
      rett(ctx, C.pietra, x, y - e, 1, 1 + e);
      if (e) rett(ctx, C.ferroChiaro, x, y + 1, 1, e);
      rett(ctx, C.ferro, x, y + 1 + e, 1, 1);
    }
    for (const cx of [96, 224]) {
      const y = yTrave(cx, t);
      rett(ctx, C.bordo, cx - 2, y + 2, 5, 3);
      rett(ctx, C.oro, cx - 1, y + 2, 3, 2);
    }
    rett(ctx, C.bordo, 156, 37, 9, 9);
    rett(ctx, C.oroScuro, 157, 38, 7, 7);
    rett(ctx, C.oro, 157, 38, 5, 5);
    rett(ctx, C.giallo, 158, 39, 2, 2);
    rett(ctx, C.bianco, 158, 39, 1, 1);
  }

  function catena(ctx, x, y0, y1) {
    for (let y = y0; y <= y1; y++) {
      const j = (y - y0) % 4;
      if (j < 2) { rett(ctx, C.bordo, x - 1, y, 3, 1); rett(ctx, j === 0 ? C.pietraChiara : C.pietra, x, y, 1, 1); }
      else rett(ctx, C.ferroChiaro, x, y, 1, 1);
    }
  }

  function piatto(ctx, cx, dy) {
    const y = 100 + dy;
    catena(ctx, cx, 45 + dy, 55 + dy);
    rett(ctx, C.bordo, cx - 28, 56 + dy, 57, 3);
    rett(ctx, C.pietra, cx - 27, 57 + dy, 55, 1);
    rett(ctx, C.pietraChiara, cx - 27, 57 + dy, 20, 1);
    rett(ctx, C.oro, cx - 1, 56 + dy, 3, 3);
    catena(ctx, cx - 26, 59 + dy, y - 1);
    catena(ctx, cx + 26, 59 + dy, y - 1);
    rett(ctx, C.bordo, cx - 29, y, 59, 2);
    rett(ctx, C.pietraChiara, cx - 28, y + 1, 57, 1);
    rett(ctx, C.bordo, cx - 28, y + 2, 57, 1);
    rett(ctx, C.pietra, cx - 27, y + 2, 55, 1);
    rett(ctx, C.ferroChiaro, cx + 12, y + 2, 15, 1);
    rett(ctx, C.bordo, cx - 26, y + 3, 53, 1);
    rett(ctx, C.ferroChiaro, cx - 25, y + 3, 51, 1);
    rett(ctx, C.ferro, cx + 10, y + 3, 16, 1);
    rett(ctx, C.bordo, cx - 23, y + 4, 47, 1);
    rett(ctx, C.ferro, cx - 22, y + 4, 45, 1);
    rett(ctx, C.bordo, cx - 20, y + 5, 41, 1);
  }

  function panca(ctx) {
    rett(ctx, C.bordo, 52, 144, 217, 6);
    rett(ctx, C.legnoLuce, 53, 145, 215, 1);
    rett(ctx, C.legnoChiaro, 53, 146, 215, 2);
    rett(ctx, C.legno, 53, 148, 215, 1);
    for (let k = 0; k < 12; k++) rett(ctx, C.legno, 60 + 17 * k, 146 + (k % 2), 6, 1);
    for (const x of [58, 157, 257]) {
      rett(ctx, C.bordo, x, 150, 6, 3);
      rett(ctx, C.legno, x + 1, 150, 4, 3);
      rett(ctx, C.legnoScuro, x + 4, 150, 1, 3);
    }
  }

  /** La parte ferma della lavagna: cavalletto, cornice, ardesia e la scritta PESATE. */
  function lavagnaBase(ctx) {
    for (const x of [11, 51]) {
      rett(ctx, C.bordo, x - 1, 108, 4, 43);
      rett(ctx, C.legnoChiaro, x, 108, 2, 42);
      rett(ctx, C.legno, x + 1, 108, 1, 42);
    }
    rett(ctx, C.bordo, 30, 62, 5, 6); rett(ctx, C.legnoChiaro, 31, 63, 3, 5);
    rett(ctx, C.bordo, 5, 66, 55, 46);
    rett(ctx, C.legnoChiaro, 6, 67, 53, 44);
    rett(ctx, C.legnoLuce, 6, 67, 53, 1);
    rett(ctx, C.legno, 6, 109, 53, 2);
    rett(ctx, C.bordo, 8, 69, 49, 40);
    rett(ctx, C.siepe, 9, 70, 47, 38);
    retino(ctx, C.siepe, C.erbaScura, 9, 70, 47, 38, 0.12);
    testo(ctx, "PESATE", 11, 73, { piccolo: true, colore: C.pietraChiara, ombra: null });
    for (let x = 11; x <= 54; x += 2) rett(ctx, C.pietra, x, 81, 1, 1);
    // il gessetto nella vaschetta
    rett(ctx, C.bordo, 12, 106, 7, 3);
    rett(ctx, C.bianco, 13, 106, 5, 1);
    rett(ctx, C.pietraChiara, 13, 107, 5, 1);
  }

  /** La parte che cambia: contatore e una bilancia di gesso per ogni pesata. `progresso(i)` va da 0 a 1 (gesso che scrive). */
  function lavagnaDati(ctx, pesate, registro, progresso) {
    testo(ctx, `${pesate}/2`, 54, 72, { colore: C.giallo, ombra: null, allinea: "destra" });
    registro.forEach((r, i) => {
      const yc = 92 + i * 11;
      const s = r.scende === "sinistro" ? 1 : r.scende === "destro" ? -1 : 0;
      const yl = (x) => yc + Math.round((s * 2 * (32 - x)) / 21);
      const p = progresso(i);
      if (p < 1) { ctx.save(); ctx.beginPath(); ctx.rect(8, yc - 12, Math.round(49 * p), 26); ctx.clip(); }
      for (let x = 11; x <= 53; x++) rett(ctx, C.pietraChiara, x, yl(x), 1, 1);
      rett(ctx, C.pietra, 32, yc + 1, 1, 1); rett(ctx, C.pietra, 31, yc + 2, 3, 1);
      testo(ctx, r.sinistro.join(""), 12, yl(12) - 6, { piccolo: true, colore: C.bianco, ombra: null });
      testo(ctx, r.destro.join(""), 53, yl(53) - 6, { piccolo: true, colore: C.bianco, ombra: null, allinea: "destra" });
      if (p < 1) ctx.restore();
    });
  }

  function portoneAperto(ctx, apertura = 1) {
    for (const [y, x0, w0] of ARCO) {
      const w = Math.max(1, Math.round(w0 * apertura)), x = 160 - Math.floor(w / 2);
      rett(ctx, C.fiamma, x, y, w, 1);
      if (w > 8) rett(ctx, C.vetro, x + 3, y, w - 6, 1);
      if (w > 16) rett(ctx, C.fiammaChiara, x + 7, y, w - 14, 1);
    }
    if (apertura < 1) return;
    for (const [y, x, w] of ARCO) if (w >= 10) {
      rett(ctx, C.legnoScuro, x, y, 3, 1);
      rett(ctx, C.legnoScuro, x + w - 3, y, 3, 1);
    }
    rett(ctx, C.brace, 150, 96, 4, 4); rett(ctx, C.brace, 149, 100, 6, 10);
    rett(ctx, C.brace, 167, 98, 3, 3); rett(ctx, C.brace, 166, 101, 5, 9);
    rett(ctx, C.vetro, 136, 110, 48, 1);
    rett(ctx, C.fiamma, 130, 113, 60, 1);
    rett(ctx, C.brace, 124, 116, 72, 1);
  }

  // ════════════════════════ POSIZIONI ════════════════════════

  const CENTRI = {
    9: [72, 94, 116, 138, 160, 182, 204, 226, 248],
    8: [83, 105, 127, 149, 171, 193, 215, 237],
  };
  const OFF = {
    1: [[0, 0]],
    2: [[-9, 0], [9, 0]],
    3: [[-17, 0], [0, 0], [17, 0]],
    4: [[-17, 0], [0, 0], [17, 0], [0, -11]],
  };

  // ════════════════════════ IL GIOCO ════════════════════════

  const opzioni = {
    id: "zucche-di-piombo",
    sfondo: "ingresso",
    velo: 0.5,
    variante(rng) {
      const n = rng() < 0.5 ? 8 : 9;
      const tipo = rng() < 0.5 ? "leggera" : "pesante";
      const preferite = EscapeDemo.mescola(rng, Array.from({ length: n }, (_, i) => i + 1));
      return { n, tipo, preferite };
    },
    crea(g) {
      const v = g.variante;
      const n = v.n;
      opzioni.testo = testoDellaCarta(v);

      // ── stato ──
      let st = nuovoTentativo(n);
      let incl = 0; // 1 sinistro giù, -1 destro giù, 0 pari
      let sel = null;
      let vinta = null;
      let risolta = g.giaRisolto;
      let tV0 = -Infinity; // istante della vittoria in questa sessione
      const salvato = g.memoria.tentativo;
      if (memoriaValida(salvato, n)) {
        st = copia(salvato);
        const ult = st.registro[st.registro.length - 1];
        if (ult && JSON.stringify(ordina(st.sinistro)) === JSON.stringify(ult.sinistro)
          && JSON.stringify(ordina(st.destro)) === JSON.stringify(ult.destro)) {
          incl = ult.scende === "sinistro" ? 1 : ult.scende === "destro" ? -1 : 0;
        }
      }
      if (g.giaRisolto) {
        vinta = Number.isInteger(g.memoria.vinta) ? g.memoria.vinta : null;
        incl = 0;
      }

      // ── stato visivo ──
      const tilt = { valore: incl * 6, seq: null, t0: 0, ultimo: 0 };
      const anim = {}; // i → { da, t0, dur }
      const disegnata = {}; // i → ultima posizione disegnata
      let trascinata = null; // { i, x, y }
      let premuto = null; // { i, x0, y0, trascina }
      let congelato = null; // { fine, v, wrong }
      let rigaNuova = null; // { indice, t0 }
      let testaNo = -Infinity;
      let zuccoTrema = -Infinity;
      let aperturaDisegnata = -1;

      const MSG = {
        inizio: "Tocca una zucca, poi un piatto per metterla sopra.",
        pieno: "Su un piatto ci stanno al massimo 4 zucche.",
        prima: "Prima tocca una zucca.",
        sgombrato: "Tutte le zucche sono tornate sulla panca.",
        giaVuoti: "I piatti sono già vuoti.",
        piattoVuoto: "Metti almeno una zucca su ogni piatto.",
        diversi: "Numeri diversi: scende il piatto più pieno. Non conta come pesata.",
        finite: "Il buttafuori: «Due pesate e basta!» Ora consegna una zucca.",
        consegnaSenza: "Prima tocca la zucca da consegnare.",
        ricomincia: "Si ricomincia: zucche sulla panca e due pesate nuove.",
        vittoria: v.tipo === "leggera"
          ? "È vuota! Il buttafuori la ridà a Zucco e apre il portone."
          : "È di piombo! Col suo fermaporta il buttafuori apre il portone.",
      };

      // ── posizioni ──
      const slotPanca = (i) => ({ x: CENTRI[n][i - 1] - 8, y: 132 });
      function calcPos(i, vista, t) {
        const z = vista.posizioni[i - 1];
        if (z === "panca") return slotPanca(i);
        const arr = vista[z], k = arr.indexOf(i), cnt = arr.length;
        const [ox, oy] = OFF[cnt][k];
        const cx = z === "sinistro" ? 96 : 224;
        const dy = z === "sinistro" ? t : -t;
        return { x: cx + ox - 8, y: 87 + dy + oy };
      }
      const posStato = (i, vista = st) => calcPos(i, vista, incl * 6);
      const centro = (i) => { const p = posStato(i); return { x: p.x + 8, y: p.y + 6 }; };

      function zuccaA(x, y, escludi) {
        let migliore = null, dist = Infinity;
        for (let i = 1; i <= n; i++) {
          if (i === escludi) continue;
          const p = posStato(i), su = i === sel ? 3 : 0;
          if (x < p.x - 2 || x > p.x + 17 || y < p.y - 2 - su || y > p.y + 14 - su) continue;
          const d = (x - (p.x + 8)) ** 2 + (y - (p.y + 6 - su)) ** 2;
          if (d < dist) { dist = d; migliore = i; }
        }
        return migliore;
      }
      function zonaA(x, y) {
        const t = incl * 6;
        if (Math.abs(x - 96) <= 32 && y >= 52 + t && y <= 112 + t) return "sinistro";
        if (Math.abs(x - 224) <= 32 && y >= 52 - t && y <= 112 - t) return "destro";
        if (x >= 50 && x <= 270 && y >= 126 && y <= 153) return "panca";
        return null;
      }

      // ── animazioni ──
      const durata = (ms) => (g.riduciMovimento ? 0 : ms);
      function tuttePosizioniFisse(vista) {
        const r = {};
        for (let i = 1; i <= n; i++) r[i] = calcPos(i, vista, 0);
        return r;
      }
      function animaSpostamenti(prima, dopo) {
        if (g.riduciMovimento) return;
        for (let i = 1; i <= n; i++) {
          if (prima[i].x === dopo[i].x && prima[i].y === dopo[i].y) continue;
          const da = disegnata[i] || calcPos(i, st, tilt.valore);
          anim[i] = { da: { x: da.x, y: da.y }, t0: g.tempo, dur: 220 };
        }
      }
      function sciogli() {
        if (!congelato) return;
        const c = congelato;
        congelato = null;
        for (let i = 1; i <= n; i++) {
          const da = calcPos(i, c.v, tilt.valore), a = calcPos(i, st, tilt.valore);
          if (da.x !== a.x || da.y !== a.y) anim[i] = { da, t0: g.tempo, dur: durata(250) };
        }
      }
      function avviaTilt(seq) {
        if (g.riduciMovimento) { tilt.seq = null; tilt.valore = incl * 6; return; }
        tilt.seq = seq;
        tilt.t0 = g.tempo;
      }

      // ── salvataggio ──
      function salvaTentativo() {
        g.memoria.tentativo = {
          posizioni: [...st.posizioni], sinistro: [...st.sinistro], destro: [...st.destro], pesate: st.pesate,
          possibili: [...st.possibili], registro: copia(st.registro), tentativo: st.tentativo,
        };
        g.salvaMemoria();
      }

      // ── messaggi ──
      const elenco = (a) => (a.length ? a.join(" ") : "nessuna");
      function messaggioStato() {
        if (st.pesate >= 2) g.messaggio("Pesate finite: tocca una zucca e premi «Consegna».");
        else g.messaggio(`Sinistra ${elenco(st.sinistro)}, destra ${elenco(st.destro)}. Premi «Pesa» quando sei pronto.`);
      }
      function frase(scende) {
        if (scende == null) return "i piatti stanno pari";
        if (v.tipo === "leggera") return `sale il piatto ${scende === "sinistro" ? "destro" : "sinistro"}`;
        return `scende il piatto ${scende}`;
      }

      // ── azioni (usate da tocchi, bottoni e gioca) ──
      function azioneMetti(i, zona) {
        sciogli();
        const prima = tuttePosizioniFisse(st);
        const r = logicaMetti(v, st, i, zona);
        if (!r.esito.ok) {
          if (r.esito.motivo === "piatto pieno") g.messaggio(MSG.pieno);
          return r.esito;
        }
        st = r.st; sel = null; incl = 0; tilt.seq = null;
        salvaTentativo();
        animaSpostamenti(prima, tuttePosizioniFisse(st));
        messaggioStato();
        return { ok: true };
      }

      function azioneSgombra() {
        sciogli();
        const prima = tuttePosizioniFisse(st);
        const r = logicaSgombra(v, st);
        if (!r.esito.ok) { g.messaggio(MSG.giaVuoti); return r.esito; }
        st = r.st; incl = 0; tilt.seq = null;
        salvaTentativo();
        animaSpostamenti(prima, tuttePosizioniFisse(st));
        g.messaggio(MSG.sgombrato);
        return { ok: true };
      }

      function azionePesa() {
        sciogli();
        const r = logicaPesa(v, st);
        if (!r.esito.ok) {
          const m = r.esito.motivo;
          if (m === "pesate finite") { g.messaggio(MSG.finite); testaNo = g.tempo; }
          else if (m === "piatto vuoto") g.messaggio(MSG.piattoVuoto);
          else if (m === "numeri diversi") {
            g.messaggio(MSG.diversi);
            testaNo = g.tempo;
            const s = st.sinistro.length > st.destro.length ? 1 : -1;
            avviaTilt([1, 2, 3, 3, 3, 2, 1, 0].map((x) => s * x));
          }
          return r.esito;
        }
        st = r.st;
        const sc = r.esito.scende;
        incl = sc === "sinistro" ? 1 : sc === "destro" ? -1 : 0;
        const seq = sc === "sinistro" ? [2, 4, 6, 7, 6, 5, 6] : sc === "destro" ? [-2, -4, -6, -7, -6, -5, -6] : [2, -2, 1, -1, 0];
        avviaTilt(seq);
        rigaNuova = { indice: st.registro.length - 1, t0: g.riduciMovimento ? -Infinity : g.tempo };
        salvaTentativo();
        const k = st.pesate;
        g.messaggio(`Pesata ${k}: ${frase(sc)}.` + (k === 1 ? " Ti resta una pesata." : " Ora consegna una zucca."));
        return { ok: true, pesata: k, scende: sc };
      }

      function azioneConsegna(i) {
        sciogli();
        const r = logicaConsegna(v, st, i);
        if (r.esito.valida === false) return r.esito;
        if (r.esito.risolto) {
          vinta = i; sel = null; risolta = true; tV0 = g.tempo;
          g.memoria.vinta = i;
          salvaTentativo();
          g.messaggio(MSG.vittoria);
          g.risolto({
            riepilogo: v.tipo === "leggera"
              ? `La zucca vuota era la ${i}. Con due pesate ben scelte non aveva più dove nascondersi.`
              : `Il piombo era nella zucca ${i}. Con due pesate ben scelte non aveva più dove nascondersi.`,
            ritardo: 1500,
          });
          return { risolto: true, zucca: i };
        }
        // errore: si riparte da capo, ma per 600 ms la scena resta com'era
        if (!g.riduciMovimento) congelato = { fine: g.tempo + 600, inizio: g.tempo, v: copia(st), wrong: i };
        st = r.st; sel = null; incl = 0;
        salvaTentativo();
        testaNo = g.tempo;
        zuccoTrema = g.tempo;
        g.messaggio(MSG.ricomincia);
        g.errore(r.esito.motivo);
        if (g.riduciMovimento) tilt.valore = 0;
        return { errore: true, motivo: r.esito.motivo };
      }

      // ── tocchi ──
      function seleziona(i) {
        sel = i;
        g.messaggio(`Zucca ${i}: tocca un piatto o la panca, oppure premi «Consegna».`);
      }
      function deseleziona() { sel = null; g.messaggio(MSG.inizio); }

      function tocco(x, y) {
        const P = zuccaA(x, y);
        if (P) {
          if (sel == null) return seleziona(P);
          if (P === sel) return deseleziona();
          const zP = st.posizioni[P - 1], zS = st.posizioni[sel - 1];
          if (zP !== zS) { azioneMetti(sel, zP); return; }
          return seleziona(P);
        }
        const z = zonaA(x, y);
        if (z) {
          if (sel == null) { g.messaggio(MSG.prima); return; }
          if (st.posizioni[sel - 1] === z) return deseleziona();
          azioneMetti(sel, z);
          return;
        }
        if (sel != null) deseleziona();
      }

      function rilascio(x, y) {
        const i = trascinata.i;
        const posAttuale = { x: Math.round(x - 8), y: Math.round(y - 6) };
        trascinata = null;
        const altra = zuccaA(x, y, i);
        const zona = altra ? st.posizioni[altra - 1] : zonaA(x, y);
        if (zona && zona !== st.posizioni[i - 1]) {
          disegnata[i] = posAttuale;
          const esito = azioneMetti(i, zona);
          if (esito.ok) return;
        }
        if (!g.riduciMovimento) anim[i] = { da: posAttuale, t0: g.tempo, dur: 220 };
      }

      g.tocca(({ tipo, x, y }) => {
        if (tipo === "giu") {
          sciogli();
          premuto = { i: zuccaA(x, y), x0: x, y0: y, trascina: false };
          return;
        }
        if (!premuto) return;
        if (tipo === "muovi") {
          if (!premuto.trascina && premuto.i && Math.hypot(x - premuto.x0, y - premuto.y0) > 3) {
            premuto.trascina = true; sel = null;
            trascinata = { i: premuto.i, x, y };
          } else if (premuto.trascina) { trascinata.x = x; trascinata.y = y; }
          return;
        }
        if (tipo === "su") {
          const p = premuto;
          premuto = null;
          if (p.trascina && trascinata) rilascio(x, y);
          else tocco(x, y);
        }
      });

      g.bottone("Pesa", () => azionePesa(), { id: "pesa", forte: true });
      g.bottone("Sgombra", () => azioneSgombra(), { id: "sgombra" });
      g.bottone("Consegna", () => {
        if (sel == null) { g.messaggio(MSG.consegnaSenza); return; }
        azioneConsegna(sel);
      }, { id: "consegna" });
      g.messaggio(MSG.inizio);

      // ── disegno ──
      const ctxFermo = g.ctx; // livello sotto: portone, lavagna, bilancia ferma, panca
      const d = g.nuovaTela(); // livello sopra: tutto quello che si muove

      function ridisegnaFermo(apertura) {
        ctxFermo.clearRect(0, 0, g.larghezza, g.altezza);
        if (apertura > 0) portoneAperto(ctxFermo, apertura);
        lavagnaBase(ctxFermo);
        colonna(ctxFermo);
        panca(ctxFermo);
      }

      function aggiornaTilt(ora) {
        if (congelato && ora < congelato.fine) return;
        if (tilt.seq) {
          const k = Math.floor((ora - tilt.t0) / 90);
          if (k < tilt.seq.length) { tilt.valore = tilt.seq[k]; return; }
          tilt.seq = null;
          tilt.valore = incl * 6;
          return;
        }
        const bersaglio = incl * 6;
        if (tilt.valore === bersaglio) return;
        if (g.riduciMovimento) { tilt.valore = bersaglio; return; }
        if (ora - tilt.ultimo >= 50) {
          tilt.ultimo = ora;
          const diff = bersaglio - tilt.valore;
          tilt.valore += Math.abs(diff) <= 2 ? diff : Math.sign(diff) * 2;
        }
      }

      function posVista(i, vista, ora) {
        const base = calcPos(i, vista, tilt.valore);
        const a = anim[i];
        if (a) {
          const k = a.dur > 0 ? (ora - a.t0) / a.dur : 1;
          if (k >= 1) anim[i] = null;
          else {
            const e = 1 - (1 - k) * (1 - k);
            return { x: Math.round(a.da.x + (base.x - a.da.x) * e), y: Math.round(a.da.y + (base.y - a.da.y) * e) };
          }
        }
        return base;
      }

      function disegnaZucca(ctx, i, x, y, stile, fv) {
        if (stile === "vuota") {
          sprite(ctx, ZUCCA_APERTA, COL_ZUCCA, x, y - 6);
          testo(ctx, String(i), x + 5, y + 5, { colore: C.bianco, ombra: C.bordo });
          const fermo = g.riduciMovimento || risolta && tV0 === -Infinity;
          [[2, -12], [11, -15], [6, -19]].forEach(([ox, oy], k) => {
            if (!fermo && fv < 2 * k) return;
            const b = fermo ? "w" : ((fv + k) & 1 ? "W" : "w");
            const colori = b === "w" ? { w: C.giallo, W: C.bianco } : { w: C.bianco, W: C.giallo };
            sprite(ctx, STELLINA, colori, x + ox, y + oy);
          });
          return;
        }
        if (stile === "piombo") {
          let yy = y;
          if (!g.riduciMovimento && tV0 !== -Infinity && fv >= 0 && fv < 2) yy = y + 1;
          sprite(ctx, ZUCCA, COL_PIOMBO, x, yy);
          testo(ctx, String(i), x + 5, yy + 4, { colore: C.bianco, ombra: C.bordo });
          if (!g.riduciMovimento && tV0 !== -Infinity && fv >= 0 && fv < 4) {
            const col = fv < 3 ? C.pietra : C.ferroChiaro, s = Math.min(fv, 3);
            rett(ctx, col, x - 3 - s, y + 11, 2, 1);
            rett(ctx, col, x - 5 - s, y + 10, 2, 1);
            rett(ctx, col, x + 17 + s, y + 11, 2, 1);
            rett(ctx, col, x + 19 + s, y + 10, 2, 1);
          }
          return;
        }
        const colori = stile === "sel" ? COL_ZUCCA_SEL : stile === "sbagliata" ? COL_ZUCCA_SBAGLIATA : COL_ZUCCA;
        sprite(ctx, ZUCCA, colori, x, y);
        testo(ctx, String(i), x + 5, y + 4, { colore: C.bianco, ombra: C.bordo });
      }

      const SALTO = [-2, -4, -5, -4, -2, 0];
      const SCOSSA = [-1, 1, -1, 1, 0];

      function disegna(ora) {
        const f = g.fotogramma;
        if (congelato && ora >= congelato.fine) sciogli();
        aggiornaTilt(ora);

        // tempi della vittoria
        const tv = !risolta ? -1 : (g.riduciMovimento || tV0 === -Infinity) ? Infinity : ora - tV0;
        const fv = tv === Infinity || tv < 0 ? (tv < 0 ? -1 : 99) : Math.floor(tv / 125);
        const apertura = !risolta ? 0 : tv < 500 ? 0 : tv < 600 ? 1 / 3 : tv < 700 ? 2 / 3 : 1;
        if (apertura !== aperturaDisegnata) { aperturaDisegnata = apertura; ridisegnaFermo(apertura); }

        d.clearRect(0, 0, g.larghezza, g.altezza);
        const vista = congelato ? congelato.v : st;
        const t = tilt.valore;

        // bilancia
        trave(d, t);
        piatto(d, 96, t);
        piatto(d, 224, -t);
        lavagnaDati(d, vista.pesate, vista.registro, (k) => {
          if (!rigaNuova || rigaNuova.indice !== k) return 1;
          return Math.max(0, Math.min(1, (ora - rigaNuova.t0) / 300));
        });

        // le zucche
        const stilo = (i) => {
          if (i === vinta) return v.tipo === "leggera" ? "vuota" : "piombo";
          if (congelato && congelato.wrong === i) return "sbagliata";
          return "normale";
        };
        const trasc = trascinata ? trascinata.i : null;
        const pos = {};
        for (let i = 1; i <= n; i++) {
          pos[i] = i === trasc
            ? { x: Math.round(trascinata.x - 8), y: Math.round(trascinata.y - 6) }
            : posVista(i, vista, ora);
          disegnata[i] = pos[i];
        }
        const cosa = (i) => {
          let { x, y } = pos[i];
          const s = stilo(i);
          if (s === "sbagliata") {
            const k = Math.floor((ora - congelato.inizio) / 125);
            if (k < 4) x += SCOSSA[k];
          }
          disegnaZucca(d, i, x, y, s, fv);
        };
        const sulPiatto = [...vista.sinistro, ...vista.destro].filter((i) => i !== sel && i !== trasc);
        sulPiatto.forEach(cosa);
        const inPanca = tutte(n).filter((i) => vista.posizioni[i - 1] === "panca" && i !== sel && i !== trasc);
        inPanca.forEach(cosa);

        // Zucco
        {
          let dxz = 0;
          if (!g.riduciMovimento && ora >= zuccoTrema) {
            const k = Math.floor((ora - zuccoTrema) / 125);
            if (k < 5) dxz = SCOSSA[k];
          }
          let dyz = 0;
          if (tv >= 700 && tv !== Infinity) { const k = Math.floor((tv - 700) / 125); if (k < 18) dyz = SALTO[k % 6]; }
          const resp = g.riduciMovimento ? 0 : (Math.floor(f / 6) % 2 === 1 ? 1 : 0);
          const acceso = g.riduciMovimento || Math.floor(f / 3) % 2 === 0;
          const colori = acceso ? COL_ZUCCO : { ...COL_ZUCCO, e: "#ffb52e" };
          righe(d, ZUCCO, colori, 14, 123, 21, 27, dxz, dyz);
          righe(d, ZUCCO, colori, 14, 123, 0, 20, dxz, dyz + resp);
        }
        // buttafuori
        {
          const lato = tv === Infinity ? 8 : tv < 500 ? 0 : Math.min(8, 2 * Math.floor((tv - 500) / 75) + 2);
          const x = 276 + lato, y = 109;
          const resp = g.riduciMovimento ? 0 : (Math.floor((f + 3) / 6) % 2 === 1 ? 1 : 0);
          const lampo = !g.riduciMovimento && f % 24 < 2;
          const colori = lampo ? { ...COL_BUTTAFUORI, l: C.bianco } : COL_BUTTAFUORI;
          let dxt = 0;
          if (!g.riduciMovimento) {
            const k = Math.floor((ora - testaNo) / 125);
            if (ora >= testaNo && k >= 0 && k < 5) dxt = SCOSSA[k];
          }
          righe(d, BUTTAFUORI, colori, x, y, 30, 41, 0, 0);
          righe(d, BUTTAFUORI, colori, x, y, 13, 29, 0, resp);
          righe(d, BUTTAFUORI, colori, x, y, 0, 12, dxt, resp);
        }

        // la croce rossa sulla zucca sbagliata
        if (congelato) {
          const p = pos[congelato.wrong];
          if (p) {
            sprite(d, CROCE, { x: C.bordo }, p.x + 6, p.y - 8);
            sprite(d, CROCE, { x: C.tappetoChiaro }, p.x + 5, p.y - 9);
          }
        }

        // la zucca selezionata e quella trascinata stanno sopra tutto
        if (sel != null && sel !== trasc) {
          const p = pos[sel];
          const alza = g.riduciMovimento ? 3 : (Math.floor(f / 4) % 2 ? 4 : 3);
          if (vista.posizioni[sel - 1] === "panca") rett(d, C.legnoScuro, p.x + 8 - 6, 145, 12, 1);
          disegnaZucca(d, sel, p.x, p.y - alza, "sel", fv);
        }
        if (trasc != null) {
          const p = pos[trasc];
          disegnaZucca(d, trasc, p.x, p.y, "normale", fv);
        }
      }

      if (g.giaRisolto) {
        // già risolto: la scena mostra lo stato finale (portone aperto, buttafuori da parte)
        tilt.valore = 0;
      }
      g.anima((ora) => disegna(ora));

      // ── aggancio per le prove ──
      g.espone({
        gioca(m) {
          if (!m || typeof m !== "object") return rifiuto("mossa sconosciuta");
          if ("metti" in m) return azioneMetti(m.metti, m.su);
          if (m.pesa) return azionePesa();
          if (m.sgombra) return azioneSgombra();
          if ("consegna" in m) return azioneConsegna(m.consegna);
          return rifiuto("mossa sconosciuta");
        },
        statoGioco() {
          return {
            n, tipo: v.tipo,
            posizioni: [...st.posizioni], sinistro: [...st.sinistro], destro: [...st.destro],
            pesate: st.pesate, registro: copia(st.registro), possibili: [...st.possibili],
            selezionata: sel, inclinazione: incl, tentativo: st.tentativo, vinta,
          };
        },
        posizione(i) {
          const c = centro(i);
          return { x: c.x, y: c.y };
        },
        zona(nome) {
          return { sinistro: { x: 96, y: 66 }, destro: { x: 224, y: 66 }, panca: { x: 160, y: 149 } }[nome];
        },
      });
    },
  };

  function testoDellaCarta(v) {
    const base = v.tipo === "leggera"
      ? `All'ingresso ci sono ${v.n} zucche identiche. Una è vuota: è la testa di ricambio di Zucco ed è più leggera delle altre. Il buttafuori lascia usare la bilancia a due piatti solo due volte. Trova la zucca vuota.`
      : `All'ingresso ci sono ${v.n} zucche identiche. Una è piena di piombo: è il fermaporta del buttafuori ed è più pesante delle altre. Lui lascia usare la bilancia a due piatti solo due volte. Trova la zucca di piombo.`;
    return `${base}\nSposta le zucche sui piatti e premi «Pesa». Quando sei sicuro, tocca la zucca e premi «Consegna».`;
  }

  EscapeDemo.avvia(opzioni);
})();
