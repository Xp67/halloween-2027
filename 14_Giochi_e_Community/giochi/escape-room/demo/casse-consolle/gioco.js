// Le casse della consolle: rompicapo a blocchi scorrevoli (pedana 5×4, flight case 2×2 da portare sulle strisce gialle).
// La logica (pezziDaRighe, spazioLibero, applicaMossa…) è pura e separata dal disegno.

(function () {
  "use strict";
  const { C, GEMME, rett, riquadro, sprite, testo } = EscapeDemo;

  const L = 5, A = 4, CELLA = 28, X0 = 86, Y0 = 34;
  const TETTO = 100, MINIMO = 34;
  const META = { x: 3, y: 2 };
  const DIREZIONI = { su: [0, -1], giu: [0, 1], sinistra: [-1, 0], destra: [1, 0] };

  const DISPOSIZIONI = [
    ["FFWw.", "FFssC", "CWwCc", "c.scs"], //  1
    ["FFWw.", "FFsCs", "Cs.cC", "cWwsc"], //  2
    ["FFWwC", "FFC.c", "Cscs.", "csWws"], //  3
    ["FFWw.", "FFs.s", "CCCss", "cccWw"], //  4
    ["FFWws", "FFC.s", "CCcWw", "cc.ss"], //  5
    ["FFsWw", "FFsCs", "CC.c.", "ccWws"], //  6
    ["FFsss", "FFsCC", "CWwcc", "c..Ww"], //  7
    ["FFWw.", "FFWw.", "ssCCC", "ssccc"], //  8
    ["FFWwC", "FFWwc", "sC.sC", "sc.sc"], //  9
    ["FFC.s", "FFcss", "CCWws", "cc.Ww"], // 10
    ["FFCC.", "FFccs", "CsWw.", "csWws"], // 11
    ["FFWwC", "FFCsc", "sCc..", "scsWw"], // 12
  ];

  // ───────────────────────── Logica pura ─────────────────────────

  function pezziDaRighe(righe) {
    const out = [];
    const n = { cassa: 0, subwoofer: 0, spia: 0 };
    let flight = false;
    for (let y = 0; y < A; y++) {
      for (let x = 0; x < L; x++) {
        const ch = righe[y][x];
        if (ch === "F" && !flight) {
          flight = true;
          out.push({ id: "F", tipo: "flight", x, y, w: 2, h: 2 });
        } else if (ch === "C") out.push({ id: "C" + ++n.cassa, tipo: "cassa", x, y, w: 1, h: 2 });
        else if (ch === "W") out.push({ id: "W" + ++n.subwoofer, tipo: "subwoofer", x, y, w: 2, h: 1 });
        else if (ch === "s") out.push({ id: "S" + ++n.spia, tipo: "spia", x, y, w: 1, h: 1 });
      }
    }
    return out;
  }

  function righeDaPezzi(pezzi) {
    const m = Array.from({ length: A }, () => Array(L).fill("."));
    for (const p of pezzi) {
      for (let j = 0; j < p.h; j++) {
        for (let i = 0; i < p.w; i++) {
          let ch = "s";
          if (p.tipo === "flight") ch = "F";
          else if (p.tipo === "cassa") ch = j === 0 ? "C" : "c";
          else if (p.tipo === "subwoofer") ch = i === 0 ? "W" : "w";
          m[p.y + j][p.x + i] = ch;
        }
      }
    }
    return m.map((r) => r.join(""));
  }

  /** Una disposizione salvata è buona se ha 4 righe di 5 lettere con gli stessi pezzi (1+3+2+4 e 2 vuote). */
  function righeValide(righe) {
    if (!Array.isArray(righe) || righe.length !== A) return false;
    if (righe.some((r) => typeof r !== "string" || r.length !== L || /[^FCcWws.]/.test(r))) return false;
    const pezzi = pezziDaRighe(righe);
    const conta = (t) => pezzi.filter((p) => p.tipo === t).length;
    if (conta("flight") !== 1 || conta("cassa") !== 3 || conta("subwoofer") !== 2 || conta("spia") !== 4) return false;
    return righeDaPezzi(pezzi).join("|") === righe.join("|");
  }

  const copiaPezzi = (pezzi) => pezzi.map((p) => ({ ...p }));

  function pezzoIn(pezzi, x, y) {
    return pezzi.find((p) => x >= p.x && x < p.x + p.w && y >= p.y && y < p.y + p.h) || null;
  }

  /** Quante caselle libere ha il pezzo davanti in quella direzione, fino al bordo o al primo pezzo. */
  function spazioLibero(pezzi, p, dir) {
    const [dx, dy] = DIREZIONI[dir];
    let n = 0;
    for (;;) {
      const k = n + 1;
      const nx = p.x + dx * k, ny = p.y + dy * k;
      if (nx < 0 || ny < 0 || nx + p.w > L || ny + p.h > A) break;
      let libero = true;
      for (let j = 0; j < p.h && libero; j++) {
        for (let i = 0; i < p.w; i++) {
          const q = pezzoIn(pezzi, nx + i, ny + j);
          if (q && q.id !== p.id) { libero = false; break; }
        }
      }
      if (!libero) break;
      n++;
    }
    return n;
  }

  /**
   * stato + mossa → { stato, esito, ... }. `iniziale` sono i pezzi della disposizione di partenza (per il tetto).
   * Mosse non valide: l'esito ha valida:false e lo stato non cambia.
   */
  function applicaMossa(stato, m, iniziale) {
    const rifiuto = (motivo) => ({ stato, esito: { valida: false, motivo } });
    if (!m || typeof m !== "object" || !Number.isInteger(m.x) || !Number.isInteger(m.y) || m.x < 0 || m.x >= L
      || m.y < 0 || m.y >= A || typeof m.dir !== "string" || !Object.prototype.hasOwnProperty.call(DIREZIONI, m.dir)
      || !Number.isInteger(m.passi) || m.passi < 1) return rifiuto("formato");
    const p = pezzoIn(stato.pezzi, m.x, m.y);
    if (!p) return rifiuto("vuota");
    if (m.passi > spazioLibero(stato.pezzi, p, m.dir)) return rifiuto("bloccata");
    const [dx, dy] = DIREZIONI[m.dir];
    const pezzi = stato.pezzi.map((q) => (q.id === p.id ? { ...q, x: q.x + dx * m.passi, y: q.y + dy * m.passi } : { ...q }));
    const mosse = stato.mosse + 1;
    const base = { mosso: p.id, da: { x: p.x, y: p.y }, tipo: p.tipo, passi: m.passi, pezziDopo: pezzi };
    const f = pezzi.find((q) => q.tipo === "flight");
    if (f.x === META.x && f.y === META.y) {
      return { ...base, stato: { pezzi, mosse, risolto: true }, esito: { risolto: true, mosse } };
    }
    if (mosse === TETTO) {
      return { ...base, stato: { pezzi: copiaPezzi(iniziale), mosse: 0, risolto: false }, esito: { errore: true, motivo: "tetto", mosse: 0 } };
    }
    return { ...base, stato: { pezzi, mosse, risolto: false }, esito: { ok: true, mosse } };
  }

  // ───────────────────────── Sprite ─────────────────────────

  const CASSA = [
    "kkkkkkkkkkkkkkkkkkkkkkkkkk",
    "kLLLLLLLLLLLLLLLLLLLLLLLLk",
    "kLMMMMMMMMMMMMMMMMMMMMMMDk",
    "kLMMMMMMMMMMMMMMMMMMMMMMDk",
    "kLMMMMMMMMMkkkkMMMMMggMMDk",
    "kLMMMMMMMMkbbbakMMMMggMMDk",
    "kLMMMMMMMkbbccaakMMMMMMMDk",
    "kLMMMMMMMkbcedbakMMMMMMMDk",
    "kLMMMMMMMkbcddbakMMMMMMMDk",
    "kLMMMMMMMkaabbaakMMMMMMMDk",
    "kLMMMMMMMMkaaaakMMMMMMMMDk",
    "kLMMMMMMMMMkkkkMMMMMMMMMDk",
    "kLMMMMMMMMMMMMMMMMMMMMMMDk",
    "kLMMMMMMMMMMMMMMMMMMMMMMDk",
    "kLMMMMMMMMMkkkkMMMMMMMMMDk",
    "kLMMMMMMMkkbbbakkMMMMMMMDk",
    "kLMMMMMkkbbccccaakkMMMMMDk",
    "kLMMMMMkbcccccccbakMMMMMDk",
    "kLMMMMkbcccccccbbbakMMMMDk",
    "kLMMMMkbccceeddbbbakMMMMDk",
    "kLMMMkbccceeedddbbbakMMMDk",
    "kLMMMkbccceeedddbbbakMMMDk",
    "kLMMMkbcccddddddbbbakMMMDk",
    "kLMMMkacccddddddbbbakMMMDk",
    "kLMMMMkacbbddddbbbakMMMMDk",
    "kLMMMMkabbbbbbbbbbakMMMMDk",
    "kLMMMMMkabbbbbbbbakMMMMMDk",
    "kLMMMMMkkaabbbbaakkMMMMMDk",
    "kLMMMMMMMkkaaaakkMMMMMMMDk",
    "kLMMMMMMMMMkkkkMMMMMMMMMDk",
    "kLMMMMMMMMMMMMMMMMMMMMMMDk",
    "kLMMMMMMMMMkkkkMMMMMMMMMDk",
    "kLMMMMMMMkkbbbakkMMMMMMMDk",
    "kLMMMMMkkbbccccaakkMMMMMDk",
    "kLMMMMMkbcccccccbakMMMMMDk",
    "kLMMMMkbcccccccbbbakMMMMDk",
    "kLMMMMkbccceeddbbbakMMMMDk",
    "kLMMMkbccceeedddbbbakMMMDk",
    "kLMMMkbccceeedddbbbakMMMDk",
    "kLMMMkbcccddddddbbbakMMMDk",
    "kLMMMkacccddddddbbbakMMMDk",
    "kLMMMMkacbbddddbbbakMMMMDk",
    "kLMMMMkabbbbbbbbbbakMMMMDk",
    "kLMMMMMkabbbbbbbbakMMMMMDk",
    "kLMMMMMkkaabbbbaakkMMMMMDk",
    "kLMMMMMMMkkaaaakkMMMMMMMDk",
    "kLMMMMMMMMMkkkkMMMMMMMMMDk",
    "kLMMMMMMMMMMMMMMMMMMMMMMDk",
    "kkkkkkkkkkkkkkkkkkkkkkkkkk",
    "kDDDDDDDDDDDDDDDDDDDDDDDDk",
    "kDDDDDDDDDDDDDDDDDDDDDDDDk",
    "kDDDDDDDDDDDDDDDDDDDDDDDDk",
    "kDDnnnnDDDDDDDDDDDDnnnnDDk",
    "kkkkkkkkkkkkkkkkkkkkkkkkkk",
  ];

  const SUBWOOFER = [
    "kkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkk",
    "kLLLLLLLLLLLLLLLLLLLLLLLLkkkkLLLLLLLLLLLLLLLLLLLLLLLLk",
    "kLMMMMMMMMMMMMMMMMMMMMkkkbbbbkkkMMMMMMMMMMMMMMMMMMMMDk",
    "kLMMDMMMMMMMMMMMMMMMMkbbbbbbaaaakMMMMMMMMMMMMMMggDMMDk",
    "kLMMMMMMMMMMMMMMMMMMkbbbbccccaaaakMMMMMMMMMMMMMggMMMDk",
    "kLMMMMMMMMMMMMMMMMMkbbbcccccccbaaakMMMMMMMMMMMMMMMMMDk",
    "kLMMMMMMMMMMMMMMMMMkbbcccccccbbbaakMMMMMMMMMMMMMMMMMDk",
    "kLMMMMMMkkMMMMMMMMMkbbccceeddbbbaakMMMMMMMMMkkMMMMMMDk",
    "kLMMMMMkaakMMMMMMMkbbccceeedddbbbaakMMMMMMMkaakMMMMMDk",
    "kLMMMMkaaaakMMMMMMkbbccceeedddbbbaakMMMMMMkaaaakMMMMDk",
    "kLMMMMkaaaakMMMMMMkbbcccddddddbbbaakMMMMMMkaaaakMMMMDk",
    "kLMMMMMkaakMMMMMMMkbacccddddddbbbaakMMMMMMMkaakMMMMMDk",
    "kLMMMMMMkkMMMMMMMMMkaacbbddddbbbaakMMMMMMMMMkkMMMMMMDk",
    "kLMMMMMMMMMMMMMMMMMkaabbbbbbbbbbaakMMMMMMMMMMMMMMMMMDk",
    "kLMMMMMMMMMMMMMMMMMkaaabbbbbbbbaaakMMMMMMMMMMMMMMMMMDk",
    "kLMMMMMMMMMMMMMMMMMMkaaaabbbbaaaakMMMMMMMMMMMMMMMMMMDk",
    "kLMMMMMMMMMMMMMMMMMMMkaaaaaaaaaakMMMMMMMMMMMMMMMMMMMDk",
    "kLMMDMMMMMMMMMMMMMMMMMkkkaaaakkkMMMMMMMMMMMMMMMMMDMMDk",
    "kLMMMMMMMMMMMMMMMMMMMMMMMkkkkMMMMMMMMMMMMMMMMMMMMMMMDk",
    "kLMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMDk",
    "kkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkk",
    "kDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDk",
    "kDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDk",
    "kDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDk",
    "kDDnnnnDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDnnnnDDk",
    "kkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkk",
  ];

  const SPIA = [
    ".kkkkkkkkkkkkkkkkkkkkkkkk.",
    "kkLLLLLLLLLLLLLLLLLLLLLLkk",
    "kLMMMMMMMMMMMMMMMMMMMMMMDk",
    "kLMMMMMMMMMkkkkMMMMMMggMDk",
    "kLMMMMMMMkkbbbakkMMMMggMDk",
    "kLMMMMMMkbbccccaakMMMMMMDk",
    "kLMMMMMkbccccccbbakMMMMMDk",
    "kLMMMMMkbcccedbbbakMMMMMDk",
    "kLMMMMkbccceeddbbbakMMMMDk",
    "kLMMMMkbcceeedddbbakMMMMDk",
    "kLMMMMkbccddddddbbakMMMMDk",
    "kLMMMMkaccbddddbbbakMMMMDk",
    "kLMMMMMkabbbddbbbakMMMMMDk",
    "kLMMMMMkabbbbbbbbakMMMMMDk",
    "kLMMMMMMkaabbbbaakMMMMMMDk",
    "kLMMMMMMMkkaaaakkMMMMMMMDk",
    "kLMMMMMMMMMkkkkMMMMMMMMMDk",
    "kLMMMMMMMMMMMMMMMMMMMMMMDk",
    "kLMMMMMMMMMMMMMMMMMMMMMMDk",
    "kLMMMMMMMMMMMMMMMMMMMMMMDk",
    "kkkkkkkkkkkkkkkkkkkkkkkkkk",
    "kDDDDDDDDDDDDDDDDDDDDDDDDk",
    "kDDDDDDDDDDDDDDDDDDDDDDDDk",
    "kDDDDDDDDDDDDDDDDDDDDDDDDk",
    "kDDnnnnDDDDDDDDDDDDnnnnDDk",
    "kkkkkkkkkkkkkkkkkkkkkkkkkk",
  ];

  const FLIGHT = [
    "kkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkk",
    "kqqqqqpkqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqkqqqqqpk",
    "kqwqqppkppppppppppppppppppppppppppppppppppppppkqwqqppk",
    "kqqqqppkppppppppppppppppppppppppppppppppppppppkqqqqppk",
    "kqqqpppkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkqqqpppk",
    "kqpppppkLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLkqpppppk",
    "kppppffkMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMkppppffk",
    "kkkkkkkkMMMMMMDMMMMMMDMMMMMMDMMMMMMDMMMMMMDMMMkkkkkkkk",
    "kqppkLMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMDkppfk",
    "kqppkLMMMMDMMMMMMDMMMMMMDMMMMMMDMMMMMMDMMMMMMDMMDkppfk",
    "kqppkLMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMDkppfk",
    "kqppkLDMMMMMMDMMMMMMDMMMMMMDMMMMMMDMMMMMMDMMMMMMDkppfk",
    "kqppkLMMMMkkkkkMMMMMkkkkkkkkkkkkkkMMMMMMMMMMMMMMDkppfk",
    "kqppkLMMMkwwwwwkDMMMknnnnnnnnnnnnkMMMDkkkkkkDMMMDkppfk",
    "kqppkLMMMkwkwkwkMMMMknqqqqqqqqqqnkMMMMkyyyykMMMMDkppfk",
    "kqppkLMMMkwwwwwkMMMDknppppppppppnkMMMMkyrrykMMMDDkppfk",
    "kqppkLMMMMkwkwkMMMMMknnnnnnnnnnnnkMMMMkyyyykMMMMDkppfk",
    "kqppkLMMDMMkkkMDMMMMkkkkkkkkkkkkkkMMDMkkkkkkMMMMDkppfk",
    "kqppkLMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMDkppfk",
    "kqppkLMMMMMDMMMMMMDMMMMMMDMMMMMMDMMMMMMDMMMMMMDMDkppfk",
    "kqppkLMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMDkppfk",
    "kqppkLMDMMMMMMDMMMMMMDMMMMMMDMMMMMMDMMMMMMDMMMMMDkppfk",
    "kqppkLMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMDkppfk",
    "kqppkLMMMMDMMMMMMDMMMMMMDMMMMMMDMMMMMMDMMMMMMDMMDkppfk",
    "kkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkk",
    "kqqqqqqqqqkooooOOkqqqqqqqqqqqqqqqqqqkooooOOkqqqqqqqqqk",
    "kpppppppppkoOkkoOkppppppppppppppppppkoOkkoOkpppppppppk",
    "kfffffffffkooooOOkffffffffffffffffffkooooOOkfffffffffk",
    "kkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkk",
    "kqppkLMMMMMMDMMMMMMDMMMMMMDMMMMMMDMMMMMMDMMMMMMDDkppfk",
    "kqppkLMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMDkppfk",
    "kqppkLMMDMMMMMMDMMMMMMDMMMMMMDMMMMMMDMMMMMMDMMMMDkppfk",
    "kqppkLMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMDkppfk",
    "kqppkLMMMMMDMMMMwwwwwwwwMDMMMMMMwwwwwwMDMMMMMMDMDkppfk",
    "kqppkLMMMMMMMMMMwwwwwwwwDMMMMMMMwwwwwwDMMMMMMMMMDkppfk",
    "kqppkLMDMMMMMMDMwwDDDDDDwwMMDMMMMDwwDDDMMMDMMMMMDkppfk",
    "kqppkLMMMMMMMMMMwwDMMMMMwwDMMMMMMMwwDMMMMMMMMMMMDkppfk",
    "kqppkLMMMMDMMMMMwwDMMMMMwwDMMMMDMMwwDMDMMMMMMDMMDkppfk",
    "kqppkLMMMMMMMMMMwwDMMMMMwwDMMMMMMMwwDMMMMMMMMMMMDkppfk",
    "kqppkLDMMMMMMDMMwwDMDMMMwwDDMMMMMMwwDMMMMDMMMMMMDkppfk",
    "kqppkLMMMMMMMMMMwwDMMMMMwwDMMMMMMMwwDMMMMMMMMMMMDkppfk",
    "kqppkLMMMDMMMMMMwwDMMMMDwwDMMMDMMMwwDDMMMMMMDMMMDkppfk",
    "kqppkLMMMMMMMMMMwwDMMMMMwwDMMMMMMMwwDMMMMMMMMMMMDkppfk",
    "kqppkLMMMMMMDMMMwwDDMMMMwwDMwwMMMDwwDMMMDMMMMMMDDkppfk",
    "kqppkLMMMMMMMMMMwwDMMMMMwwDMwwDMMMwwDMMMMMMMMMMMDkppfk",
    "kqppkLMMDMMMMMMDwwwwwwwwMDDMMDwwwwMDDMMMMMMDMMMMDkppfk",
    "kkkkkkkkMMMMMMMMwwwwwwwwDMMMMMwwwwDMMMMMMMMMMMkkkkkkkk",
    "kqqqqqpkMMMDMMMMMDDDDDDDDDMMMMMDDDDMMMMDMMMMMMkqqqqqpk",
    "kqwqqppkDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDkqwqqppk",
    "kqqqqppkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkqqqqppk",
    "kqqqpppkppppppppppppppppppppppppppppppppppppppkqqqpppk",
    "kqpppppkppppppppppppppppppppppppppppppppppppppkqpppppk",
    "kppppffkffffffffffffffffffffffffffffffffffffffkppppffk",
    "kkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkk",
  ];

  const DJ = [
    "....kkkkkkkk....",
    "...khhhhhhhhk...",
    "..kh.kkkkkk.hk..",
    "..khkwwwwwwkhk..",
    ".kkkwwwwwwWWkkk.",
    ".krkkkkkkkkWkrk.",
    ".krknnwwnnwWkrk.",
    ".kRkwwwnwwwWkRk.",
    ".kkkkwwwwwWkkkk.",
    "....kwkwkwk.....",
    ".....kkkkk......",
    "......kwk.......",
    "...kkwwwwwkk....",
    "..kwkwkwkwkwk...",
    "..kwwwwwwwwwk...",
    "..kWkwwwwwkWk...",
    "...kkwkwkwkk....",
    ".....kwwwk......",
    "....kwwwwwk.....",
    "....kwk.kwk.....",
    "....kwk.kwk.....",
    "....kwk.kwk.....",
    "....kwk.kwk.....",
    "...kwwk.kwwk....",
    "...kkkk.kkkk....",
  ];
  const DJ_BATTE = [
    ...DJ.slice(0, 19),
    "....kwk.kwk.....",
    "....kwk..kwk....",
    "....kwk..kwk....",
    "....kwk.kwwk....",
    "...kwwk.kkk.....",
    "...kkkk.........",
  ];
  const NOTA = ["..##.", "..#.#", "..#..", "..#..", ".##..", "###..", ".#..."];
  const FRECCIA = [
    ".........#....",
    ".........##...",
    ".........###..",
    "ooooooooooooo.",
    "##############",
    "#############.",
    ".........###..",
    ".........##...",
    ".........#....",
  ];

  const CONO = { k: C.bordo, n: C.nero, a: C.nero, b: C.ferro, c: C.ferroChiaro, d: C.pietra, e: C.pietraChiara };
  const COLORI = {
    cassa: { ...CONO, L: C.lilla, M: C.viola, D: C.violaScuro, g: C.acqua },
    subwoofer: { ...CONO, L: GEMME.smeraldo[2], M: GEMME.smeraldo[1], D: GEMME.smeraldo[0], g: C.giallo },
    spia: { ...CONO, L: GEMME.zaffiro[2], M: GEMME.zaffiro[1], D: GEMME.zaffiro[0], g: C.rosa },
    flight: {
      k: C.bordo, n: C.nero, p: C.pietra, q: C.pietraChiara, f: C.ferroChiaro, M: C.tappetoChiaro,
      L: GEMME.rubino[2], D: C.tappeto, w: C.bianco, o: C.oro, O: C.oroScuro, y: C.giallo, r: C.rosa,
    },
  };
  // per i led: versione spenta (g = D)
  const COLORI_SPENTI = {};
  for (const t of ["cassa", "subwoofer", "spia"]) COLORI_SPENTI[t] = { ...COLORI[t], g: COLORI[t].D };
  const SPRITE = { cassa: CASSA, subwoofer: SUBWOOFER, spia: SPIA, flight: FLIGHT };
  const COLORI_DJ = { k: C.bordo, n: C.nero, w: C.pietraChiara, W: C.pietra, h: C.ferroChiaro, r: C.rosa, R: C.tappetoChiaro };

  // ───────────────────────── Parte fissa ─────────────────────────

  function piastra(ctx, x, y) {
    riquadro(ctx, x, y, 6, 6, C.pietraChiara);
    rett(ctx, C.bianco, x + 1, y + 1, 1, 1);
    rett(ctx, C.pietra, x + 4, y + 1, 1, 4); rett(ctx, C.pietra, x + 1, y + 4, 4, 1);
    rett(ctx, C.ferroChiaro, x + 2, y + 2, 2, 2);
  }

  function disegnaFisso(ctx) {
    rett(ctx, C.legnoScuro, 86, 34, 140, 112);
    rett(ctx, C.legnoScuro, 226, 90, 6, 56);
    for (let j = 0; j < 16; j++) {
      const y = 34 + j * 7, w = 140 + (j >= 8 ? 6 : 0);
      rett(ctx, C.bordo, 86, y, w, 1);
      if (j % 2) rett(ctx, C.legno, 86, y + 1, w, 1);
      for (let x = 92 + ((j * 23) % 41); x < 226; x += 41) rett(ctx, C.bordo, x, y + 1, 1, 6);
    }
    for (let y = 90; y < 146; y++) {
      for (let x = 170; x < 226; x++) {
        if (x < 172 || y < 92 || y >= 144) rett(ctx, (x + y) % 4 < 2 ? C.giallo : C.bordo, x, y, 1, 1);
      }
    }
    sprite(ctx, FRECCIA, { "#": C.oroScuro, o: C.oro }, 191, 113);
    for (let i = 1; i < 5; i++) {
      for (let j = 1; j < 4; j++) {
        if (i === 4 && j === 3) continue;
        const cx = 86 + i * 28, cy = 34 + j * 28;
        rett(ctx, C.ferro, cx - 3, cy - 1, 6, 2); rett(ctx, C.ferro, cx - 1, cy - 3, 2, 6);
      }
    }
    const trussO = (x, y, w) => {
      rett(ctx, C.bordo, x, y, w, 6); rett(ctx, C.pietraChiara, x, y + 1, w, 1); rett(ctx, C.ferroChiaro, x, y + 4, w, 1);
      for (let i = 0; i < w; i++) {
        const m = (x + i) % 4;
        rett(ctx, m === 0 || m === 3 ? C.pietra : C.bordo, x + i, y + 2, 1, 1);
        rett(ctx, m === 1 || m === 2 ? C.pietra : C.bordo, x + i, y + 3, 1, 1);
      }
    };
    const trussV = (x, y, h) => {
      rett(ctx, C.bordo, x, y, 6, h); rett(ctx, C.pietraChiara, x + 1, y, 1, h); rett(ctx, C.ferroChiaro, x + 4, y, 1, h);
      for (let j = 0; j < h; j++) {
        const m = (y + j) % 4;
        rett(ctx, m === 0 || m === 3 ? C.pietra : C.bordo, x + 2, y + j, 1, 1);
        rett(ctx, m === 1 || m === 2 ? C.pietra : C.bordo, x + 3, y + j, 1, 1);
      }
    };
    trussO(80, 28, 152); trussO(80, 146, 152); trussV(80, 28, 124); trussV(226, 28, 62);
    piastra(ctx, 80, 28); piastra(ctx, 226, 28); piastra(ctx, 80, 146); piastra(ctx, 226, 146);
    rett(ctx, C.nero, 232, 90, 26, 56);
  }

  // ───────────────────────── Il rompicapo ─────────────────────────

  const opzioni = {
    id: "casse-consolle", sfondo: "sala-principale", velo: 0.5,
    variante(rng) {
      const n = EscapeDemo.intero(rng, 0, DISPOSIZIONI.length - 1); // unica chiamata a rng
      const righe = DISPOSIZIONI[n].slice();
      return { disposizione: n + 1, righe, pezzi: pezziDaRighe(righe), minimo: MINIMO, tetto: TETTO, meta: { x: META.x, y: META.y } };
    },

    crea(g) {
      opzioni.testo = g.scheda.enigma + "\nOgni spostamento è una mossa, anche di più caselle. Hai 100 mosse: se finiscono prima che il flight case sia uscito, il DJ rimette tutto com'era e conta un errore.";
      const variante = g.variante;
      const iniziale = variante.pezzi;
      const riduci = g.riduciMovimento;

      // stato di partenza: dalla memoria, se valida
      let stato = { pezzi: copiaPezzi(iniziale), mosse: 0, risolto: false };
      const mem = g.memoria;
      if (righeValide(mem.righe) && Number.isInteger(mem.mosse) && mem.mosse >= 0 && mem.mosse <= TETTO) {
        stato = { pezzi: pezziDaRighe(mem.righe), mosse: mem.mosse, risolto: false };
      }
      stato.risolto = !!g.giaRisolto;

      let selezionato = null; // id del pezzo selezionato
      let drag = null; // trascinamento in corso
      const anim = new Map(); // id → { x0, y0, x1, y1, t0, ritardo, dur, lineare } (pixel relativi alla tavola)
      const colpi = new Map(); // id → { dir, t0 }
      let vittoria = null; // { inizio }
      let erroreAnim = null; // { t0 }

      const salvaStato = () => {
        g.memoria.righe = righeDaPezzi(stato.pezzi);
        g.memoria.mosse = stato.mosse;
        g.salvaMemoria();
      };
      const pezzoDi = (id) => stato.pezzi.find((p) => p.id === id) || null;
      const cella = (px, py) => {
        const cx = Math.floor((px - X0) / CELLA), cy = Math.floor((py - Y0) / CELLA);
        return cx >= 0 && cx < L && cy >= 0 && cy < A ? { x: cx, y: cy } : null;
      };

      function messaggioSelezione(p) {
        const nome = { cassa: "Cassa scelta", subwoofer: "Subwoofer scelto", spia: "Spia scelta", flight: "Flight case scelto" }[p.tipo];
        g.messaggio(`${nome}: tocca una casella libera sulla sua riga o colonna.`);
      }

      function colpo(id, dir) {
        if (!riduci) colpi.set(id, { dir, t0: g.tempo });
      }

      /** Applica una mossa (la stessa funzione per gioca, trascinamenti, due tocchi, tastiera). */
      function esegui(m, { da = null, durata = null } = {}) {
        if (stato.risolto) return { rifiutata: "risolto" };
        const r = applicaMossa(stato, m, iniziale);
        if (r.esito.valida === false) return r.esito;
        const prima = stato;
        stato = r.stato;
        const t = g.tempo;
        if (r.esito.errore) {
          if (!riduci) {
            const dopo = new Map(r.pezziDopo.map((p) => [p.id, p]));
            for (const p of stato.pezzi) {
              const d = dopo.get(p.id);
              if (!d) continue;
              if (d.x === p.x && d.y === p.y) { anim.delete(p.id); continue; }
              anim.set(p.id, { x0: d.x * CELLA, y0: d.y * CELLA, x1: p.x * CELLA, y1: p.y * CELLA, t0: t, ritardo: 450, dur: 350, lineare: true });
            }
            // il pezzo mosso per ultimo parte dalla casella appena raggiunta
          }
          erroreAnim = { t0: t, dopo: r.pezziDopo };
          selezionato = null;
          drag = null;
        } else if (!riduci) {
          const nuovo = pezzoDi(r.mosso);
          const vecchio = prima.pezzi.find((p) => p.id === r.mosso);
          const x0 = da ? da.x : vecchio.x * CELLA, y0 = da ? da.y : vecchio.y * CELLA;
          const dur = durata ?? Math.min(300, 120 + 60 * r.passi);
          if (x0 !== nuovo.x * CELLA || y0 !== nuovo.y * CELLA) {
            anim.set(r.mosso, { x0, y0, x1: nuovo.x * CELLA, y1: nuovo.y * CELLA, t0: t, ritardo: 0, dur, lineare: false });
          } else anim.delete(r.mosso);
        }
        salvaStato();

        if (r.esito.risolto) {
          const a = anim.get("F");
          vittoria = { inizio: riduci ? 0 : (a ? a.t0 + a.ritardo + a.dur : t) };
          selezionato = null;
          drag = null;
          g.messaggio("Il flight case è nel backstage!");
          g.risolto({
            riepilogo: stato.mosse === MINIMO
              ? "Ce l'hai fatta in 34 mosse: proprio il minimo possibile!"
              : `Ce l'hai fatta in ${stato.mosse} mosse: il minimo possibile è 34.`,
            ritardo: 1100,
          });
        } else if (r.esito.errore) {
          g.errore("Mosse finite: il DJ rimette tutto com'era");
          g.messaggio("Si ricomincia da capo, con 100 mosse nuove.");
        } else if (stato.mosse === 90) {
          g.messaggio("Restano 10 mosse: poi il DJ rimette tutto com'era.");
        } else if (r.tipo === "flight") {
          g.messaggio("Il flight case si muove: portalo sulle strisce gialle davanti alla porta.");
        } else g.messaggio(null);
        return r.esito;
      }

      function daCapo() {
        selezionato = null;
        drag = null;
        const righe = righeDaPezzi(stato.pezzi);
        if (righe.join("|") === variante.righe.join("|")) {
          g.messaggio("È già tutto com'era all'inizio.");
          return;
        }
        const vecchi = stato.pezzi;
        stato = { pezzi: copiaPezzi(iniziale), mosse: stato.mosse, risolto: false };
        if (!riduci) {
          for (const p of stato.pezzi) {
            const v = vecchi.find((q) => q.id === p.id);
            if (v.x !== p.x || v.y !== p.y) anim.set(p.id, { x0: v.x * CELLA, y0: v.y * CELLA, x1: p.x * CELLA, y1: p.y * CELLA, t0: g.tempo, ritardo: 0, dur: 300, lineare: false });
          }
        }
        salvaStato();
        g.messaggio("Tutto com'era all'inizio. Le mosse fatte restano contate.");
      }

      // ── Input ──
      const occupato = () => !riduci && erroreAnim && g.tempo < erroreAnim.t0 + 800;

      g.tocca(({ tipo, x, y, premuto }) => {
        if (stato.risolto) return;
        if (tipo === "giu") {
          if (occupato()) return;
          const c = cella(x, y);
          if (!c) { selezionato = null; drag = null; return; }
          const p = pezzoIn(stato.pezzi, c.x, c.y);
          if (p) {
            selezionato = p.id;
            anim.delete(p.id);
            drag = {
              id: p.id, px: x, py: y, asse: null, off: { x: 0, y: 0 }, dir: null,
              libero: { su: spazioLibero(stato.pezzi, p, "su"), giu: spazioLibero(stato.pezzi, p, "giu"), sinistra: spazioLibero(stato.pezzi, p, "sinistra"), destra: spazioLibero(stato.pezzi, p, "destra") },
            };
            return;
          }
          // casella libera: due tocchi
          const s = selezionato && pezzoDi(selezionato);
          if (!s) return;
          let dir = null, passi = 0;
          const inY = c.y >= s.y && c.y <= s.y + s.h - 1, inX = c.x >= s.x && c.x <= s.x + s.w - 1;
          if (inY && c.x > s.x + s.w - 1) { dir = "destra"; passi = c.x - (s.x + s.w - 1); }
          else if (inY && c.x < s.x) { dir = "sinistra"; passi = s.x - c.x; }
          else if (inX && c.y > s.y + s.h - 1) { dir = "giu"; passi = c.y - (s.y + s.h - 1); }
          else if (inX && c.y < s.y) { dir = "su"; passi = s.y - c.y; }
          if (!dir) { g.messaggio("I pezzi scivolano solo in orizzontale o in verticale."); return; }
          const r = esegui({ x: s.x, y: s.y, dir, passi });
          if (r.valida === false && r.motivo === "bloccata") {
            colpo(s.id, dir);
            g.messaggio("Di lì non passa: c'è qualcosa in mezzo.");
          }
        } else if (tipo === "muovi") {
          if (!drag || !premuto) return;
          const dx = x - drag.px, dy = y - drag.py;
          if (drag.asse === null && Math.max(Math.abs(dx), Math.abs(dy)) >= 4) drag.asse = Math.abs(dx) >= Math.abs(dy) ? "x" : "y";
          else if (drag.asse !== null && Math.abs(dx) < 4 && Math.abs(dy) < 4) drag.asse = null;
          drag.off = { x: 0, y: 0 };
          drag.dir = null;
          if (drag.asse === "x") {
            drag.dir = dx >= 0 ? "destra" : "sinistra";
            const lim = drag.libero[drag.dir] * CELLA;
            drag.off.x = Math.round(Math.min(Math.abs(dx), lim)) * (dx >= 0 ? 1 : -1);
            drag.tirata = Math.abs(dx);
          } else if (drag.asse === "y") {
            drag.dir = dy >= 0 ? "giu" : "su";
            const lim = drag.libero[drag.dir] * CELLA;
            drag.off.y = Math.round(Math.min(Math.abs(dy), lim)) * (dy >= 0 ? 1 : -1);
            drag.tirata = Math.abs(dy);
          }
        } else if (tipo === "su") {
          if (!drag) return;
          const d = drag;
          drag = null;
          const p = pezzoDi(d.id);
          if (!p) return;
          if (d.asse === null) { messaggioSelezione(p); return; }
          const spost = Math.abs(d.off.x) + Math.abs(d.off.y);
          const passi = Math.round(spost / CELLA);
          if (passi >= 1) {
            esegui({ x: p.x, y: p.y, dir: d.dir, passi }, { da: { x: p.x * CELLA + d.off.x, y: p.y * CELLA + d.off.y }, durata: 120 });
          } else {
            if (!riduci && spost > 0) anim.set(p.id, { x0: p.x * CELLA + d.off.x, y0: p.y * CELLA + d.off.y, x1: p.x * CELLA, y1: p.y * CELLA, t0: g.tempo, ritardo: 0, dur: 120, lineare: false });
            if (d.libero[d.dir] === 0 && d.tirata >= 10) {
              colpo(p.id, d.dir);
              g.messaggio("Di lì non passa: c'è qualcosa in mezzo.");
            }
          }
        }
      });

      addEventListener("keydown", (e) => {
        const dir = { ArrowUp: "su", ArrowDown: "giu", ArrowLeft: "sinistra", ArrowRight: "destra" }[e.key];
        if (!dir || !selezionato || stato.risolto) return;
        if (document.querySelector(".kit-velo-carta:not([hidden]), .kit-menu:not([hidden])")) return;
        e.preventDefault();
        if (occupato()) return;
        const p = pezzoDi(selezionato);
        if (!p) return;
        const r = esegui({ x: p.x, y: p.y, dir, passi: 1 });
        if (r.valida === false && r.motivo === "bloccata") {
          colpo(p.id, dir);
          g.messaggio("Di lì non passa: c'è qualcosa in mezzo.");
        }
      });

      g.bottone("Da capo", daCapo, { id: "da-capo" });

      g.messaggio(stato.risolto
        ? "Il flight case è già nel backstage."
        : stato.mosse > 0 ? "Riprendi da dove eri: le mosse fatte restano contate." : "Trascina i pezzi e porta il flight case rosso alla porta del backstage.");

      // ── Disegno ──
      disegnaFisso(g.ctx);
      const ctx = g.nuovaTela();

      /** Posizione visiva (pixel relativi alla tavola) di un pezzo, con animazioni, trascinamento e colpo. */
      function posVis(p, t) {
        let x = p.x * CELLA, y = p.y * CELLA;
        const a = anim.get(p.id);
        if (a) {
          const k = (t - a.t0 - a.ritardo) / a.dur;
          if (k >= 1) anim.delete(p.id);
          else {
            const kk = Math.max(0, k);
            const e = a.lineare ? kk : 1 - Math.pow(1 - kk, 3);
            x = Math.round(a.x0 + (a.x1 - a.x0) * e);
            y = Math.round(a.y0 + (a.y1 - a.y0) * e);
          }
        }
        if (drag && drag.id === p.id) { x = p.x * CELLA + drag.off.x; y = p.y * CELLA + drag.off.y; }
        const c = colpi.get(p.id);
        if (c) {
          const dt = t - c.t0;
          if (dt >= 160) colpi.delete(p.id);
          else if (dt < 80) { x += DIREZIONI[c.dir][0] * 2; y += DIREZIONI[c.dir][1] * 2; }
        }
        return { x, y };
      }

      const cornice = (colore, x, y, w, h) => {
        rett(ctx, colore, x, y, w, 1); rett(ctx, colore, x, y + h - 1, w, 1);
        rett(ctx, colore, x, y, 1, h); rett(ctx, colore, x + w - 1, y, 1, h);
      };

      function disegnaPezzo(p, i, pos, t) {
        let colori = COLORI[p.tipo];
        if (p.tipo !== "flight") {
          const acceso = riduci || (g.fotogramma + i * 3) % 8 < 6;
          colori = acceso ? COLORI[p.tipo] : COLORI_SPENTI[p.tipo];
        }
        sprite(ctx, SPRITE[p.tipo], colori, X0 + pos.x + 1, Y0 + pos.y + 1);
        if (selezionato === p.id) cornice(C.giallo, X0 + pos.x, Y0 + pos.y, CELLA * p.w, CELLA * p.h);
        else if (erroreAnim && !riduci) {
          const dt = t - erroreAnim.t0;
          if ((dt >= 0 && dt < 150) || (dt >= 300 && dt < 450)) cornice(C.tappetoChiaro, X0 + pos.x, Y0 + pos.y, CELLA * p.w, CELLA * p.h);
        }
      }

      const vintoOra = (t) => stato.risolto && (g.giaRisolto || (vittoria && (riduci || t >= vittoria.inizio + 700)));

      g.anima((t) => {
        ctx.clearRect(0, 0, g.larghezza, g.altezza);
        const inUscita = !g.giaRisolto && vittoria && !riduci && t >= vittoria.inizio && t < vittoria.inizio + 700;
        const vinto = vintoOra(t);
        const nascondiFlight = g.giaRisolto || (vittoria && (riduci || t >= vittoria.inizio));

        // 2. pezzi: fermi, poi quelli che scivolano, per ultimo il trascinato
        const lista = stato.pezzi.map((p, i) => ({ p, i, pos: posVis(p, t) }));
        const ordine = (e) => (drag && drag.id === e.p.id ? 2 : anim.has(e.p.id) ? 1 : 0);
        lista.sort((a, b) => ordine(a) - ordine(b));
        for (const e of lista) {
          if (nascondiFlight && e.p.tipo === "flight") continue;
          disegnaPezzo(e.p, e.i, e.pos, t);
        }

        // 3. il flight case che esce dalla porta (ritagliato a x < 258)
        if (inUscita) {
          const k = Math.min(1, (t - vittoria.inizio) / 700);
          ctx.save();
          ctx.beginPath();
          ctx.rect(0, 0, 258, 180);
          ctx.clip();
          sprite(ctx, FLIGHT, COLORI.flight, 171 + Math.round(90 * k * k), 91);
          ctx.restore();
        }

        // 4. listelle traslucide, architrave, montante, soglia
        for (let i = 0; i < 5; i++) {
          const sx = 233 + i * 5;
          for (let y = 90; y < 143; y++) {
            rett(ctx, C.pietra, sx, y, 1, 1);
            for (let x = sx + 1; x < sx + 4; x++) if ((x + y) % 2 === 0) rett(ctx, C.ferroChiaro, x, y, 1, 1);
          }
        }
        riquadro(ctx, 226, 84, 38, 6, C.ferro); rett(ctx, C.ferroChiaro, 227, 85, 36, 1); piastra(ctx, 226, 84);
        riquadro(ctx, 258, 84, 6, 68, C.ferro); rett(ctx, C.ferroChiaro, 259, 85, 1, 66);
        riquadro(ctx, 232, 146, 26, 6, C.ferro); rett(ctx, C.ferroChiaro, 233, 147, 24, 1);
        for (let x = 233; x < 257; x++) rett(ctx, (x >> 1) % 2 ? C.giallo : C.bordo, x, 149, 1, 1);

        // 5. insegna e lampeggiante
        const alone = vinto ? GEMME.acquamarina[0] : C.tappeto;
        const pieno = vinto ? C.acqua : C.rosa;
        riquadro(ctx, 225, 73, 41, 10, C.nero);
        for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) testo(ctx, "BACKSTAGE", 245 + dx, 75 + dy, { piccolo: true, colore: alone, ombra: null, allinea: "centro" });
        if (riduci || g.fotogramma % 48 !== 0) testo(ctx, "BACKSTAGE", 245, 75, { piccolo: true, colore: pieno, ombra: null, allinea: "centro" });
        let fondo, luce;
        if (vinto) { fondo = GEMME.smeraldo[2]; luce = C.bianco; }
        else if (riduci || g.fotogramma % 8 < 4) { fondo = C.tappetoChiaro; luce = GEMME.rubino[2]; }
        else { fondo = C.tappeto; luce = C.tappeto; }
        rett(ctx, C.ferro, 240, 72, 10, 1); riquadro(ctx, 241, 66, 8, 6, fondo); rett(ctx, luce, 242, 67, 2, 1);

        // 6. contatore
        const inErrore = erroreAnim && !riduci && t < erroreAnim.t0 + 800;
        const mosse = inErrore ? TETTO : stato.mosse;
        let colore = C.acqua;
        if (inErrore) colore = C.tappetoChiaro;
        else if (mosse >= 95) colore = riduci || g.fotogramma % 4 < 2 ? C.tappetoChiaro : C.tappeto;
        else if (mosse >= 85) colore = C.giallo;
        rett(ctx, C.bordo, 252, 16, 1, 14); rett(ctx, C.bordo, 303, 16, 1, 14);
        riquadro(ctx, 244, 30, 68, 26, C.ferro); rett(ctx, C.ferroChiaro, 245, 31, 66, 1);
        riquadro(ctx, 247, 33, 62, 20, C.nero);
        testo(ctx, "MOSSE", 278, 35, { piccolo: true, colore: C.ferroChiaro, ombra: null, allinea: "centro" });
        testo(ctx, `${mosse}/${TETTO}`, 278, 43, { colore, ombra: null, allinea: "centro" });

        // 7. lo scheletro DJ
        rett(ctx, C.bordo, 37, 148, 14, 2);
        const puntoEsclamativo = erroreAnim && t < erroreAnim.t0 + 1200;
        if (vinto) {
          const su = !riduci && Math.floor(g.fotogramma / 2) % 2 === 1;
          sprite(ctx, DJ, COLORI_DJ, 36, 124 - (su ? 2 : 0));
          const colori = [C.giallo, C.acqua, C.rosa];
          const partenze = [[28, 114], [54, 108], [40, 100]];
          partenze.forEach(([nx, ny], i) => {
            const salita = riduci ? 0 : (g.fotogramma + i * 4) % 12;
            sprite(ctx, NOTA, { "#": colori[i] }, nx, ny - salita);
          });
        } else {
          const batte = puntoEsclamativo && !riduci ? g.fotogramma % 2 === 1 : !riduci && Math.floor(g.fotogramma / 2) % 2 === 1;
          sprite(ctx, batte ? DJ_BATTE : DJ, COLORI_DJ, 36, 124);
          if (puntoEsclamativo) testo(ctx, "!", 43, 112, { colore: C.tappetoChiaro });
        }
      });

      // ── L'aggancio per le prove ──
      g.espone({
        gioca: (m) => esegui(m),
        statoGioco: () => ({
          righe: righeDaPezzi(stato.pezzi),
          pezzi: copiaPezzi(stato.pezzi),
          mosse: stato.mosse,
          tetto: TETTO,
          minimo: MINIMO,
          risolto: stato.risolto,
          selezionato,
        }),
        posizione: (x, y) => ({ x: X0 + CELLA * x + 14, y: Y0 + CELLA * y + 14 }),
      });
    },
  };

  EscapeDemo.avvia(opzioni);
})();
