// La caramella solitaria: solitario a salti su una tavola a croce di 33 buche (Sala del tesoro).
// Logica pura in applica(); il disegno legge lo stato (vedi ISTRUZIONI.md).

(function () {
  "use strict";
  const { C, GEMME, rett, sprite, testo } = EscapeDemo;

  const ORO_FONDO = EscapeDemo.CARAMELLA.palette[6]; // ombra della caramella dorata del kit
  const CREMA = EscapeDemo.CARAMELLA.palette[2]; // riflesso della caramella dorata del kit
  const ZUCCA_SCURA = "#9c3b17"; // arancio scuro della zucca di Zucco

  // ── La tavola: nomi, indici, salti ──
  const LETTERE = "abcdefg";
  const BUCHE = []; // [x, y] in ordine di indice
  for (let y = 0; y < 7; y++) for (let x = 0; x < 7; x++) if ((x >= 2 && x <= 4) || (y >= 2 && y <= 4)) BUCHE.push([x, y]);
  const NOMI = BUCHE.map(([x, y]) => LETTERE[x] + (7 - y));
  const IDX = new Map(NOMI.map((n, i) => [n, i]));
  const GRIGLIA = Array.from({ length: 7 }, () => Array(7).fill(-1));
  BUCHE.forEach(([x, y], i) => { GRIGLIA[y][x] = i; });
  const NB = BUCHE.length; // 33

  // La buca scavalcata da `da` ad `a`, oppure -1 se non sono a due buche in orizzontale o in verticale.
  function mezzo(da, a) {
    const [x1, y1] = BUCHE[IDX.get(da)], [x2, y2] = BUCHE[IDX.get(a)];
    const dx = x2 - x1, dy = y2 - y1;
    if (!((Math.abs(dx) === 2 && dy === 0) || (Math.abs(dy) === 2 && dx === 0))) return -1;
    return IDX.get(LETTERE[x1 + dx / 2] + (7 - (y1 + dy / 2)));
  }
  // Per ogni buca, i salti possibili da lì: [buca d'arrivo, buca di mezzo].
  const MOSSE = NOMI.map((da) => {
    const lista = [];
    NOMI.forEach((a, j) => { const m = mezzo(da, a); if (m >= 0) lista.push([j, m]); });
    return lista;
  });

  const ELENCO = [
    ["d4", "d4"], ["d7", "d1"], ["d1", "d7"], ["a4", "g4"], ["g4", "a4"], ["d7", "d4"], ["d1", "d4"], ["a4", "d4"],
    ["g4", "d4"], ["c7", "c4"], ["e7", "e4"], ["c1", "c4"], ["e1", "e4"], ["a5", "d5"], ["g5", "d5"], ["a3", "d3"],
    ["g3", "d3"], ["d6", "d3"], ["d2", "d5"], ["b4", "e4"], ["f4", "c4"], ["c5", "c5"], ["e5", "e5"], ["c3", "c3"],
    ["e3", "e3"], ["e4", "b4"], ["c4", "f4"], ["d3", "d6"], ["d5", "d2"],
  ];

  const REGOLE = "Puoi annullare i salti uno alla volta, gratis. Ricominciare da capo, o restare senza salti possibili prima di aver finito, conta come errore.";
  function testoCarta(v, enigma) {
    if (v.vuota === "d4" && v.finale === "d4") return enigma + "\nLa buca centrale è quella d'oro. " + REGOLE;
    return "Sul tavolo del tesoro c'è una tavola a croce con 33 buche, e in tutte tranne una c'è una caramella dorata. " +
      "Una caramella può saltare sopra una vicina, in orizzontale o in verticale, e finire nella buca vuota subito dopo: " +
      "quella scavalcata si mangia. Mangia le caramelle finché ne resta una sola, e deve restare proprio nella buca d'oro" +
      (v.vuota === v.finale ? ", la stessa che all'inizio è vuota." : ".") + "\n" + REGOLE;
  }

  // ── Logica pura ──
  const chiaveDi = (piene) => piene.map((p) => (p ? "1" : "0")).join("");
  const contaPiene = (piene) => piene.reduce((s, p) => s + (p ? 1 : 0), 0);
  function puoSaltare(piene, i) {
    if (!piene[i]) return false;
    for (const [j, m] of MOSSE[i]) if (!piene[j] && piene[m]) return true;
    return false;
  }
  function senzaUscita(piene) {
    for (let i = 0; i < NB; i++) if (puoSaltare(piene, i)) return false;
    return true;
  }
  function nuovoStato(v) {
    return { piene: NOMI.map((n) => n !== v.vuota), salti: [], vicoli: [] };
  }

  /** (stato, mossa, variante) → { stato, esito }. Non tocca niente, non disegna. */
  function applica(stato, m, v) {
    const rifiuto = (motivo) => ({ stato, esito: { valida: false, motivo } });
    if (!m || typeof m !== "object") return rifiuto("Mossa sconosciuta.");
    if (m.tipo === "salto") {
      if (typeof m.da !== "string" || typeof m.a !== "string" || !IDX.has(m.da) || !IDX.has(m.a)) return rifiuto("Quella buca non esiste.");
      const da = IDX.get(m.da), a = IDX.get(m.a);
      if (!stato.piene[da]) return rifiuto("In quella buca non c'è nessuna caramella.");
      if (stato.piene[a]) return rifiuto("Si salta solo in una buca vuota.");
      const mz = mezzo(m.da, m.a);
      if (mz < 0) return rifiuto("Si salta di due buche, in orizzontale o in verticale.");
      if (!stato.piene[mz]) return rifiuto("Si salta solo sopra un'altra caramella.");
      const piene = stato.piene.slice();
      piene[da] = false; piene[mz] = false; piene[a] = true;
      const salti = [...stato.salti, [m.da, m.a]];
      const n = contaPiene(piene);
      if (n === 1 && piene[IDX.get(v.finale)]) {
        return { stato: { piene, salti, vicoli: stato.vicoli }, esito: { valida: true, rimaste: 1, bloccato: false, errore: false, risolto: true } };
      }
      if (senzaUscita(piene)) {
        const chiave = chiaveDi(piene);
        const nuovo = !stato.vicoli.includes(chiave);
        const vicoli = nuovo ? [...stato.vicoli, chiave] : stato.vicoli;
        const esito = { valida: true, rimaste: n, bloccato: true, errore: nuovo, risolto: false };
        if (nuovo) esito.motivo = n > 1 ? "Nessun salto possibile: sei bloccato" : "L'ultima caramella non è nella buca d'oro";
        return { stato: { piene, salti, vicoli }, esito };
      }
      return { stato: { piene, salti, vicoli: stato.vicoli }, esito: { valida: true, rimaste: n, bloccato: false, errore: false, risolto: false } };
    }
    if (m.tipo === "annulla") {
      if (!stato.salti.length) return rifiuto("Non c'è nessun salto da annullare.");
      const [da, a] = stato.salti[stato.salti.length - 1];
      const mz = mezzo(da, a);
      const piene = stato.piene.slice();
      piene[IDX.get(a)] = false; piene[mz] = true; piene[IDX.get(da)] = true;
      return { stato: { piene, salti: stato.salti.slice(0, -1), vicoli: stato.vicoli }, esito: { valida: true, rimaste: contaPiene(piene) } };
    }
    if (m.tipo === "ricomincia") {
      if (!stato.salti.length) return rifiuto("Sei già all'inizio.");
      const s = nuovoStato(v);
      s.vicoli = stato.vicoli;
      return { stato: s, esito: { valida: true, errore: true, rimaste: 32, motivo: "Ricominciare da capo conta come errore" } };
    }
    return rifiuto("Mossa sconosciuta.");
  }

  // ── Grafica: geometria ──
  const casella = (i) => ({ x: 97 + 18 * BUCHE[i][0], y: 22 + 18 * BUCHE[i][1] });
  const BOCCA = { x: 66, y: 82 };
  const bucaDa = (px, py) => {
    const c = Math.floor((px - 97) / 18), r = Math.floor((py - 22) / 18);
    if (c < 0 || c > 6 || r < 0 || r > 6) return -1;
    return GRIGLIA[r][c];
  };

  // ── Sprite ──
  const SP_BUCA = [
    "...kkkkkk...", ".kknnnnnnkk.", ".knnnnnnnnk.", "knnnnnnnnnnk", "knnnnnnnnnnk", "knnnnnnnnnvk",
    "knnnnnnnnnvk", "knnnnnnnnnvk", "knnnnnnnnvvk", ".knnnnnnvvk.", ".kkvvvvvvkk.", "...kkkkkk...",
  ];
  const CL_BUCA = { k: C.bordo, n: C.nero, v: C.viola };
  const SP_PIASTRA = [
    "..kkkkkkkkkkkk..", ".kwhhhhhhhhhhyk.", "kwhyyyyyyyyyyyok", "khyyyyyyyyyyyyok", "khyyyyyyyyyyyyok",
    "khyyyyyyyyyyyyok", "khyyyyyyyyyyyyok", "khyyyyyyyyyyyyok", "khyyyyyyyyyyyyok", "khyyyyyyyyyyyyok",
    "khyyyyyyyyyyyyok", "khyyyyyyyyyyyyok", "khyyyyyyyyyyyyok", "kyoooooooooooobk", ".kobbbbbbbbbbbk.", "..kkkkkkkkkkkk..",
  ];
  const CL_PIASTRA = { k: C.bordo, w: C.bianco, h: C.giallo, y: C.oro, o: C.oroScuro, b: ORO_FONDO };
  const SP_CARAMELLA = [
    "......kkkk......", ".kk..khhyyk..kk.", "kwokkhWhyyykkoyk", "khookhhyyyokooyk",
    "kyookyyyyookoook", "kyokkyyyoobkkobk", ".kk..koobbk..kk.", "......kkkk......",
  ];
  const CL_CARAMELLA = { k: C.bordo, W: C.bianco, w: CREMA, h: C.giallo, y: C.oro, o: C.oroScuro, b: ORO_FONDO };
  const CL_SEL_A = { ...CL_CARAMELLA, k: C.giallo };
  const CL_SEL_B = { ...CL_CARAMELLA, k: C.bianco };
  const CL_SPENTA = { k: C.bordo, W: C.pietraChiara, w: C.pietraChiara, h: C.pietra, y: C.ferroChiaro, o: C.ferro, b: C.ferro };
  const ROMBO = ["..aa..", ".aAAa.", "aAWWAa", "aAWWAa", ".aAAa.", "..aa.."];
  const ROMBO_PICCOLO = ["......", "..aa..", ".aWWa.", ".aWWa.", "..aa..", "......"];
  const CL_SEGNO = { a: GEMME.acquamarina[0], A: C.acqua, W: GEMME.acquamarina[2] };
  const STELLA = ["..h..", "..W..", "hWWWh", "..W..", "..h.."];
  const STELLINA = [".....", "..h..", ".hWh.", "..h..", "....."];
  const CL_STELLA = { W: C.bianco, h: C.giallo };

  // Zucco
  const TESTA = [
    "......Gg......", ".....GGg......", "..kkkkkkkkkk..", ".koOOyyyOOOok.", "koOOyyhyyOOOok", "koOyEEyyOEEOok",
    "koOEeeEyOEeeEk", "koOOEEOOEOEEOk", "koOOOOOEEOOOOk", "koObEbEbEbEbOk", "kooOeEeEeEeOok", ".kooOOOOOOOok.", "..kkkkkkkkkk..",
  ];
  const FACCE = {
    normale: {},
    aperta: { 8: "koOOEbEbEbOOOk", 9: "koOEeeeeeeEOOk", 10: "kooEeeeeeeEOok", 11: ".kooOEbEbEOok." },
    triste: { 5: "koOyOOyyOOOOok", 8: "koOOOOOOOOOOOk", 9: "koOOObEbEbOOOk", 10: "kooOEOOOOOEOok" },
    felice: { 5: "koOyOOyyOOOOok", 6: "koOEOOEyOEOOEk", 7: "koOOOOOOOOOOOk", 8: "koOOEbEbEbOOOk", 9: "koOEeeeeeeEOOk", 10: "kooEeeeeeeEOok", 11: ".kooOEbEbEOok." },
  };
  const TESTE = {};
  for (const [nome, sost] of Object.entries(FACCE)) {
    const r = TESTA.slice();
    for (const [k, s] of Object.entries(sost)) r[Number(k)] = s;
    TESTE[nome] = r;
  }
  const MANTELLO = [
    "...kkkkkkkkkk...", "..kqqpppppppPk..", ".kqqpppppppppPk.", ".kqppppppppppPk.", "kqqppppppppppPPk", "kqpppppppppppPPk",
    "kqppppppkppppPPk", "kqppppppkpppPPPk", "kqpppppkkppPPPPk", ".kpppppk.kpPPPk.", ".kkkkkk...kkkk..",
  ];
  const GAMBE = [".....kBk.kLk....", ".....kBk.kLk....", ".....kBk.kLk....", "....kRRk.kTTk...", "....kkkk.kkkk..."];
  const CL_ZUCCO = {
    k: C.bordo, o: ZUCCA_SCURA, O: C.brace, y: C.fiamma, h: C.fiammaChiara, b: C.legnoScuro, G: C.erbaScura, g: C.erba,
    E: C.oro, e: C.luna, q: C.lilla, p: C.viola, P: C.violaScuro, B: C.ferro, L: C.ferroChiaro, R: C.legno, T: C.legnoChiaro,
  };

  // ── La tavola e la targa, disegnate una volta sola ──
  const V = { x1: 129, y1: 18, x2: 190, y2: 151 }, H = { x1: 93, y1: 54, x2: 226, y2: 115 };
  const dentro = (r, x, y) => (x < r.x1 || x > r.x2 || y < r.y1 || y > r.y2 ? -1 : Math.min(x - r.x1, r.x2 - x, y - r.y1, r.y2 - y));
  const prof = (x, y) => Math.max(dentro(V, x, y), dentro(H, x, y));

  const PIXEL_CORNICE = []; // [x, y, d] con d = 1 o 2, per i lampi
  function costruisciTavola(finale) {
    const cv = document.createElement("canvas");
    cv.width = 320; cv.height = 180;
    const c = cv.getContext("2d");
    c.imageSmoothingEnabled = false;
    // ombra
    c.fillStyle = C.nero;
    for (let y = 0; y < 180; y++) for (let x = 0; x < 320; x++) if (prof(x, y) >= 0 && ((x + y) & 1) === 0) c.fillRect(x + 3, y + 3, 1, 1);
    // tavola
    for (let y = 0; y < 180; y++) for (let x = 0; x < 320; x++) {
      const d = prof(x, y);
      if (d < 0) continue;
      const luce = prof(x, y - 1) < d || prof(x - 1, y) < d;
      let col;
      if (d === 0) col = C.bordo;
      else if (d === 1) col = luce ? C.giallo : C.oroScuro;
      else if (d === 2) col = luce ? C.oro : ORO_FONDO;
      else if (d === 3) col = C.bordo;
      else if (d === 4) col = luce ? C.viola : C.violaScuro;
      else col = C.violaScuro;
      if (d === 1 || d === 2) PIXEL_CORNICE.push([x, y, d]);
      rett(c, col, x, y, 1, 1);
    }
    // borchie
    const buca = (x, y) => x >= 0 && x <= 6 && y >= 0 && y <= 6 && GRIGLIA[y][x] >= 0;
    for (let r = 0; r < 6; r++) for (let q = 0; q < 6; q++) {
      if (!(buca(q, r) && buca(q + 1, r) && buca(q, r + 1) && buca(q + 1, r + 1))) continue;
      const sx = 97 + 18 * (q + 1) - 1, sy = 22 + 18 * (r + 1) - 1;
      rett(c, C.oroScuro, sx, sy, 2, 2);
      rett(c, C.giallo, sx, sy, 1, 1);
      rett(c, C.bordo, sx + 1, sy + 2, 1, 1);
      rett(c, C.bordo, sx + 2, sy + 1, 1, 1);
    }
    // piastra d'oro e buche
    const cf = casella(IDX.get(finale));
    sprite(c, SP_PIASTRA, CL_PIASTRA, cf.x + 1, cf.y + 1);
    for (let i = 0; i < NB; i++) {
      const ca = casella(i);
      sprite(c, SP_BUCA, CL_BUCA, ca.x + 3, ca.y + 3);
    }
    // targa
    for (let y = 20; y <= 71; y++) for (let x = 238; x <= 309; x++) {
      const d = Math.min(x - 238, 309 - x, y - 20, 71 - y);
      const luce = x - 238 === d || y - 20 === d;
      let col;
      if (d === 0) col = C.bordo;
      else if (d === 1) col = luce ? C.giallo : C.oroScuro;
      else if (d === 2) col = luce ? C.oro : ORO_FONDO;
      else if (d === 3) col = C.bordo;
      else col = (y - 20) % 5 === 0 && (x * 7 + y) % 11 > 2 ? C.legnoScuro : C.legno;
      rett(c, col, x, y, 1, 1);
    }
    for (const cx of [248, 299]) for (let y = 16; y <= 19; y++) rett(c, y % 2 === 0 ? C.ferroChiaro : C.ferro, cx, y, 1, 1);
    return cv;
  }

  const LUCCICHII = [[12, 114], [24, 106], [40, 120], [84, 110], [234, 110], [268, 118], [290, 106], [306, 116]];

  const opzioni = {
    id: "caramella-solitaria",
    sfondo: "sala-del-tesoro",
    velo: 0.5,

    variante(rng) {
      const [vuota, finale] = ELENCO[Math.floor(rng() * ELENCO.length)];
      return { vuota, finale };
    },

    crea(g) {
      const v = g.variante;
      opzioni.testo = testoCarta(v, g.scheda.enigma);
      const FIN = IDX.get(v.finale);
      const TAVOLA = costruisciTavola(v.finale);
      const riduci = g.riduciMovimento;

      // ── Stato del rompicapo e dell'interfaccia ──
      let stato = nuovoStato(v);
      let vinta = false;
      let bloccato = false;
      let selezionata = -1;
      let down = null; // { x, y, b, eraSel }
      let trascinando = false;
      let dito = { x: 0, y: 0 };
      let ritorno = null; // { t0, x0, y0 }

      // animazioni
      let anims = []; // { x0, y0, x1, y1, t0, dur, arco, idx }
      let facce = []; // { t0, t1, f }  f: aperta | mastica | triste
      let scritte = []; // { t0, t1, testo, sale }
      let lampo = null; // { tipo, t0, t1 }
      let tremolo = null; // { t0, t1 }
      let bloccatoDa = 0;
      let festa = null; // { t0, t1 }

      if (g.giaRisolto) {
        vinta = true;
        stato.piene = NOMI.map((n) => n === v.finale);
        stato.salti = Array.isArray(g.memoria.salti) ? g.memoria.salti.map((s) => [...s]) : [];
      } else {
        const mem = g.memoria;
        if (Array.isArray(mem.vicoli)) stato.vicoli = mem.vicoli.filter((s) => typeof s === "string" && /^[01]{33}$/.test(s));
        if (Array.isArray(mem.salti)) {
          for (const s of mem.salti) {
            if (!Array.isArray(s)) break;
            const r = applica(stato, { tipo: "salto", da: s[0], a: s[1] }, v);
            if (!r.esito.valida) break;
            stato = r.stato;
            if (r.esito.risolto) break;
          }
        }
        bloccato = senzaUscita(stato.piene);
      }

      const rimaste = () => contaPiene(stato.piene);
      function finisciAnim() {
        anims = []; facce = []; scritte = []; lampo = null; tremolo = null; ritorno = null;
        if (bloccato) bloccatoDa = 0;
      }

      // ── Il pulsante «Ricomincia» chiede conferma ──
      let btnRicomincia = null;
      let armato = false;
      let timerArmo = 0;
      function disarma() {
        if (!armato) return;
        armato = false;
        clearTimeout(timerArmo);
        if (btnRicomincia) btnRicomincia.textContent = "Ricomincia";
      }
      function premiRicomincia() {
        if (!stato.salti.length) { mossa({ tipo: "ricomincia" }); return; }
        if (!armato) {
          armato = true;
          btnRicomincia.textContent = "Conferma";
          g.messaggio("Ricominciare costa un errore. Tocca ancora per confermare.");
          timerArmo = setTimeout(disarma, 4000);
          return;
        }
        mossa({ tipo: "ricomincia" });
      }

      // ── Le mosse ──
      function volo(da, a, t0, dur, arco, idx) {
        anims.push({ x0: da.x, y0: da.y, x1: a.x, y1: a.y, t0, dur, arco, idx });
      }
      const posCaramella = (i) => { const c = casella(i); return { x: c.x + 1, y: c.y + 5 }; };

      function animaMossa(m, prima, esito, senzaVolo) {
        if (riduci) {
          bloccatoDa = 0;
          const t = g.tempo;
          if (m.tipo === "salto" && !esito.risolto) scritte.push({ t0: t, t1: t + 500, testo: "GNAM!", sale: false });
          if (m.tipo !== "salto") facce.push({ t0: t, t1: t + 500, f: "triste" });
          if (m.tipo === "salto" && esito.bloccato) scritte.push({ t0: t, t1: t + 800, testo: "UFF!", sale: false });
          if (esito.risolto) { festa = { t0: t, t1: t + 1500 }; scritte.push({ t0: t, t1: t + 1500, testo: "EVVIVA!", sale: false }); }
          return;
        }
        const t = g.tempo;
        if (m.tipo === "salto") {
          const da = IDX.get(m.da), a = IDX.get(m.a), mz = mezzo(m.da, m.a);
          if (!senzaVolo) volo(posCaramella(da), posCaramella(a), t, 220, 6, a);
          volo(posCaramella(mz), BOCCA, t, 320, 18, -1);
          facce.push({ t0: t, t1: t + 320, f: "aperta" });
          facce.push({ t0: t + 320, t1: t + 820, f: "mastica" });
          scritte.push({ t0: t + 320, t1: t + 820, testo: "GNAM!", sale: true });
          if (esito.bloccato) {
            bloccatoDa = t + 350;
            lampo = { tipo: "rosso", t0: t + 350, t1: t + 850 };
            tremolo = { t0: t + 350, t1: t + 850 };
            scritte.push({ t0: t + 350, t1: t + 1150, testo: "UFF!", sale: false });
          }
          if (esito.risolto) {
            festa = { t0: t + 350, t1: t + 1850 };
            lampo = { tipo: "oro", t0: t + 350, t1: t + 1850 };
            scritte.push({ t0: t + 350, t1: t + 1850, testo: "EVVIVA!", sale: false });
          }
        } else if (m.tipo === "annulla") {
          // `prima` è lo stato prima di annullare: l'ultimo salto è quello da disfare
          const [da, a] = prima.salti[prima.salti.length - 1];
          const ida = IDX.get(da), ia = IDX.get(a), mz = mezzo(da, a);
          volo(posCaramella(ia), posCaramella(ida), t, 220, 6, ida);
          volo(BOCCA, posCaramella(mz), t, 320, 18, mz);
          facce.push({ t0: t, t1: t + 500, f: "triste" });
        } else if (m.tipo === "ricomincia") {
          let k = 0;
          for (let i = 0; i < NB; i++) {
            if (stato.piene[i] && !prima.piene[i]) {
              volo(BOCCA, posCaramella(i), t + 25 * k, 320, 18, i);
              k++;
            }
          }
          facce.push({ t0: t, t1: t + 500, f: "triste" });
        }
      }

      function mossa(m, daTrascinamento) {
        finisciAnim();
        disarma();
        const prima = stato;
        const { stato: nuovo, esito } = applica(stato, m, v);
        if (!esito.valida) {
          g.messaggio(esito.motivo);
          return esito;
        }
        stato = nuovo;
        selezionata = -1;
        trascinando = false;
        bloccato = !esito.risolto && senzaUscita(stato.piene);
        if (esito.risolto) vinta = true;

        const n = esito.rimaste;
        // memoria
        g.memoria.salti = stato.salti.map((s) => [...s]);
        g.memoria.vicoli = [...stato.vicoli];
        g.salvaMemoria();

        if (esito.errore) g.errore(esito.motivo);
        if (esito.risolto) {
          g.risolto({ riepilogo: "Trentuno salti e trentuno caramelle mangiate: l'ultima è rimasta nella buca d'oro.", ritardo: 2000 });
        }

        // fumetto
        if (m.tipo === "salto") {
          if (esito.risolto) g.messaggio("L'ultima caramella è nella buca d'oro!");
          else if (esito.bloccato) {
            if (!esito.errore) g.messaggio("Di nuovo questo vicolo cieco: non conta un altro errore.");
            else if (n > 1) g.messaggio(`Bloccato con ${n} caramelle. «Annulla» torna indietro gratis.`);
            else g.messaggio("Una sola caramella, ma non nella buca d'oro. Annulla e riprova.");
          } else g.messaggio(`Gnam! Ne restano ${n}.`);
        } else if (m.tipo === "annulla") g.messaggio(`Salto annullato. Ne restano ${n}.`);
        else g.messaggio("Si ricomincia: 32 caramelle al loro posto.");

        animaMossa(m, prima, esito, !!daTrascinamento);
        return esito;
      }

      // ── Tocchi e trascinamenti ──
      g.tocca(({ tipo, x, y, premuto }) => {
        if (tipo === "giu") {
          finisciAnim();
          disarma();
          const b = bucaDa(x, y);
          down = null;
          trascinando = false;
          if (b < 0) { selezionata = -1; return; }
          if (stato.piene[b]) {
            down = { x, y, b, eraSel: false };
            if (puoSaltare(stato.piene, b)) {
              if (selezionata === b) down.eraSel = true;
              else { selezionata = b; g.messaggio("Ora tocca la buca vuota dove deve atterrare."); }
            } else {
              selezionata = -1;
              g.messaggio("Questa caramella ora non può saltare.");
            }
          } else if (selezionata >= 0) {
            mossa({ tipo: "salto", da: NOMI[selezionata], a: NOMI[b] });
          } else g.messaggio("Prima tocca una caramella.");
        } else if (tipo === "muovi") {
          if (!premuto || !down) return;
          if (!trascinando && selezionata === down.b && Math.hypot(x - down.x, y - down.y) > 4) trascinando = true;
          if (trascinando) dito = { x, y };
        } else if (tipo === "su") {
          if (!down) return;
          const d = down;
          down = null;
          if (trascinando) {
            trascinando = false;
            dito = { x, y };
            const b = bucaDa(x, y);
            let fatto = false;
            if (b >= 0 && b !== selezionata) {
              const r = mossa({ tipo: "salto", da: NOMI[selezionata], a: NOMI[b] }, true);
              fatto = r.valida;
            }
            if (!fatto && !riduci) ritorno = { t0: g.tempo, x0: dito.x, y0: dito.y };
          } else if (d.eraSel) selezionata = -1;
        }
      });

      // ── Bottoni ──
      g.bottone("Annulla", () => mossa({ tipo: "annulla" }), { id: "annulla" });
      btnRicomincia = g.bottone("Ricomincia", premiRicomincia, { id: "ricomincia" });

      // ── Fumetto d'apertura ──
      if (g.giaRisolto) g.messaggio("L'ultima caramella è già nella buca d'oro.");
      else if (stato.salti.length > 0) {
        g.messaggio(bloccato ? "Sei ancora bloccato: «Annulla» torna indietro gratis." : `Ripartiamo da dove eri rimasto: ${stato.salti.length} salti fatti.`);
      } else g.messaggio("Tocca una caramella, poi la buca vuota dove deve atterrare.");

      // ── Disegno ──
      const lerp = (a, b, p) => a + (b - a) * p;
      function disegnaZucco(ctx, faccia, dy, su, fot) {
        const cz = { ...CL_ZUCCO };
        if (!riduci && (fot % 6 === 0 || fot % 13 === 0)) cz.e = C.fiammaChiara;
        sprite(ctx, GAMBE, cz, 66, 99 - su);
        sprite(ctx, MANTELLO, cz, 66, 88 + dy - su);
        sprite(ctx, TESTE[faccia], cz, 67, 77 + dy - su);
      }

      g.anima((tempo) => {
        const ctx = g.ctx;
        const fot = g.fotogramma;
        ctx.clearRect(0, 0, 320, 180);
        ctx.drawImage(TAVOLA, 0, 0);

        // lampo della cornice
        if (lampo && tempo >= lampo.t0 && tempo < lampo.t1) {
          let cols = null;
          if (lampo.tipo === "rosso") cols = [C.tappetoChiaro, C.tappeto];
          else if (fot % 4 < 2) cols = [C.bianco, C.giallo];
          if (cols) for (const [x, y, d] of PIXEL_CORNICE) rett(ctx, cols[d - 1], x, y, 1, 1);
        }

        // buche nascoste da un volo in corso
        anims = anims.filter((a) => tempo < a.t0 + a.dur);
        const nascoste = new Set();
        for (const a of anims) if (a.idx >= 0) nascoste.add(a.idx);

        // segni dove può atterrare la caramella selezionata
        if (selezionata >= 0 && !vinta) {
          const rombo = riduci || fot % 8 < 4 ? ROMBO : ROMBO_PICCOLO;
          for (const [j, m] of MOSSE[selezionata]) {
            if (stato.piene[j] || !stato.piene[m]) continue;
            const c = casella(j);
            sprite(ctx, rombo, CL_SEGNO, c.x + 6, c.y + 6);
          }
        }

        // caramelle nelle buche
        const spente = bloccato && tempo >= bloccatoDa;
        let tr = 0;
        if (tremolo && tempo >= tremolo.t0 && tempo < tremolo.t1) tr = Math.floor((tempo - tremolo.t0) / 125) % 2 === 0 ? 1 : -1;
        for (let i = 0; i < NB; i++) {
          if (!stato.piene[i] || i === selezionata || nascoste.has(i)) continue;
          const c = casella(i);
          sprite(ctx, SP_CARAMELLA, spente ? CL_SPENTA : CL_CARAMELLA, c.x + 1 + tr, c.y + 5);
        }

        // la selezionata (sollevata o trascinata)
        if (selezionata >= 0 && stato.piene[selezionata] && !vinta) {
          const c = casella(selezionata);
          const colori = riduci || fot % 4 < 2 ? CL_SEL_A : CL_SEL_B;
          let px = c.x + 1, py = c.y + 3;
          if (trascinando) { px = Math.round(dito.x) - 8; py = Math.round(dito.y) - 4; }
          else if (ritorno && tempo < ritorno.t0 + 150) {
            const p = (tempo - ritorno.t0) / 150;
            px = Math.round(lerp(Math.round(ritorno.x0) - 8, c.x + 1, p));
            py = Math.round(lerp(Math.round(ritorno.y0) - 4, c.y + 3, p));
          }
          sprite(ctx, SP_CARAMELLA, colori, px, py);
        }

        // caramelle in volo
        for (const a of anims) {
          if (tempo < a.t0) continue;
          const p = Math.min(1, (tempo - a.t0) / a.dur);
          const x = Math.round(lerp(a.x0, a.x1, p));
          const y = Math.round(lerp(a.y0, a.y1, p) - a.arco * Math.sin(Math.PI * p));
          sprite(ctx, SP_CARAMELLA, CL_CARAMELLA, x, y);
        }

        // Zucco
        facce = facce.filter((f) => tempo < f.t1);
        scritte = scritte.filter((s) => tempo < s.t1);
        let faccia = "normale";
        const inFesta = festa && tempo >= festa.t0 && tempo < festa.t1;
        if (vinta && (g.giaRisolto || (festa && tempo >= festa.t0))) faccia = "felice";
        else if (facce.some((f) => f.f === "triste" && tempo >= f.t0)) faccia = "triste";
        else if (bloccato && tempo >= bloccatoDa) faccia = "triste";
        else {
          const f = facce.find((x) => tempo >= x.t0 && tempo < x.t1);
          if (f) faccia = f.f === "aperta" ? "aperta" : Math.floor((tempo - f.t0) / 125) % 2 === 0 ? "normale" : "aperta";
        }
        const dy = !riduci && fot % 8 >= 4 ? 1 : 0;
        const su = inFesta && !riduci && fot % 4 < 2 ? 3 : 0;
        disegnaZucco(ctx, faccia, dy, su, fot);
        const sc = scritte.find((s) => tempo >= s.t0 && tempo < s.t1);
        if (sc) {
          const yy = sc.sale ? 70 - Math.floor((tempo - sc.t0) / 250) : 70;
          testo(ctx, sc.testo, 74, yy, { piccolo: true, colore: C.fiammaChiara, allinea: "centro" });
        }

        // targa
        const s = vinta ? 31 : stato.salti.length;
        const n = vinta ? 1 : rimaste();
        testo(ctx, "SALTI", 274, 26, { piccolo: true, colore: C.fiammaChiara, allinea: "centro" });
        testo(ctx, `${s}/31`, 274, 34, { scala: 2, colore: C.oro, allinea: "centro" });
        testo(ctx, `RESTANO ${n}`, 274, 52, { piccolo: true, colore: C.pietraChiara, allinea: "centro" });
        if (vinta) testo(ctx, "PERFETTO!", 274, 60, { colore: C.giallo, allinea: "centro" });
        else if (bloccato) testo(ctx, n > 1 ? "BLOCCATO!" : "SBAGLIATA!", 274, 60, { colore: C.tappetoChiaro, allinea: "centro" });

        // luccichii
        if (!riduci) {
          LUCCICHII.forEach(([x, y], i) => {
            const k = (fot + i * 5) % 24;
            if (k === 0 || k === 3) sprite(ctx, STELLINA, CL_STELLA, x, y);
            else if (k === 1 || k === 2) sprite(ctx, STELLA, CL_STELLA, x, y);
          });
          const cf = casella(FIN);
          const k = fot % 20;
          if (k === 0 || k === 2) sprite(ctx, STELLINA, CL_STELLA, cf.x + 14, cf.y - 2);
          else if (k === 1) sprite(ctx, STELLA, CL_STELLA, cf.x + 14, cf.y - 2);
          if (inFesta) {
            const ff = Math.floor((tempo - festa.t0) / 125);
            const ang = [[-4, -4], [17, -4], [-4, 17], [17, 17]];
            ang.forEach(([ox, oy], i) => {
              if (ff < 2 * i) return;
              const alt = Math.floor((ff - 2 * i) / 2) % 2 === 0;
              sprite(ctx, alt ? STELLA : STELLINA, CL_STELLA, cf.x + ox, cf.y + oy);
            });
          }
        }
      });

      g.espone({
        gioca: (m) => mossa(m),
        statoGioco: () => ({
          vuota: v.vuota,
          finale: v.finale,
          piene: NOMI.filter((_, i) => stato.piene[i]),
          rimaste: rimaste(),
          salti: stato.salti.map((s) => [...s]),
          bloccato,
          selezionata: selezionata >= 0 ? NOMI[selezionata] : null,
        }),
        posizione: (nome) => {
          if (!IDX.has(nome)) return null;
          const [c, r] = BUCHE[IDX.get(nome)];
          return { x: 106 + 18 * c, y: 31 + 18 * r };
        },
      });
    },
  };

  EscapeDemo.avvia(opzioni);
})();
