// Le clessidre del fungo: due clessidre sul tavolino, un fungo riscaldante da spegnere esattamente al minuto 15.
// Logica (applica) separata dal disegno: stato + mossa -> [nuovo stato, esito].

(function () {
  "use strict";
  const { C, GEMME, BAYER, rett, riquadro, sprite, testo } = EscapeDemo;

  const CX = [142, 190]; // centro delle due clessidre

  // ───────────────────────── Dati grafici ─────────────────────────
  const CLESSIDRA = [
    ".kkkkkkkkkkkkkkkkkkkkkkkkkkkkk.", // 0
    "kllllllllllllllllllllllllllllLk", // 1
    "kLLLLLLLLLLLLLLLLLLLLLLLLLLLLmk", // 2
    "kaaaaaaaaaaaaaaaaaaaaaaaaaaaaak", // 3
    "kmmmmmmmmmmmmmmmmmmmmmmmmmmmmMk", // 4
    ".kkkkkkkkkkkkkkkkkkkkkkkkkkkkk.", // 5
    ".klmk.....kvggggggguk.....kLMk.", // 6
    "kllmmk..kvggggggggggguk..kLLMMk", // 7
    "kllmmk.kvggggggggggggguk.kLLMMk", // 8
    ".klmk.kvrgggggggggggggguk.kLMk.", // 9
    ".klmk.kvrgggggggggggggguk.kLMk.", // 10
    ".klmk.kvrgggggggggggggguk.kLMk.", // 11
    ".klmk.kvrgggggggggggggguk.kLMk.", // 12
    ".klmk.kvggggggggggggggguk.kLMk.", // 13
    ".klmk..kvggggggggggggguk..kLMk.", // 14
    ".klmk..kvggggggggggggguk..kLMk.", // 15
    ".klmk...kvggggggggggguk...kLMk.", // 16
    ".klmk...kvggggggggggguk...kLMk.", // 17
    ".klmk....kvggggggggguk....kLMk.", // 18
    ".klmk.....kvggggggguk.....kLMk.", // 19
    ".klmk......kvggggguk......kLMk.", // 20
    ".klmk.......kvggguk.......kLMk.", // 21
    ".klmk.......kvggguk.......kLMk.", // 22
    ".klmk........kvguk........kLMk.", // 23
    ".klmk........kvguk........kLMk.", // 24
    ".klmk........kvguk........kLMk.", // 25
    ".klmk.........kgk.........kLMk.", // 26
    ".klmk.........kgk.........kLMk.", // 27
    ".klmk.........kgk.........kLMk.", // 28
    "kllmmk........kgk........kLLMMk", // 29
    "kllmmk........kgk........kLLMMk", // 30
    ".klmk.........kgk.........kLMk.", // 31
    ".klmk.........kgk.........kLMk.", // 32
    ".klmk.........kgk.........kLMk.", // 33
    ".klmk........kvguk........kLMk.", // 34
    ".klmk........kvguk........kLMk.", // 35
    ".klmk........kvguk........kLMk.", // 36
    ".klmk.......kvggguk.......kLMk.", // 37
    ".klmk.......kvggguk.......kLMk.", // 38
    ".klmk......kvggggguk......kLMk.", // 39
    ".klmk.....kvggggggguk.....kLMk.", // 40
    ".klmk....kvggggggggguk....kLMk.", // 41
    ".klmk...kvggggggggggguk...kLMk.", // 42
    ".klmk...kvggggggggggguk...kLMk.", // 43
    ".klmk..kvggggggggggggguk..kLMk.", // 44
    ".klmk..kvggggggggggggguk..kLMk.", // 45
    ".klmk.kvrgggggggggggggguk.kLMk.", // 46
    ".klmk.kvrgggggggggggggguk.kLMk.", // 47
    ".klmk.kvrgggggggggggggguk.kLMk.", // 48
    ".klmk.kvrgggggggggggggguk.kLMk.", // 49
    ".klmk.kvggggggggggggggguk.kLMk.", // 50
    "kllmmk.kvggggggggggggguk.kLLMMk", // 51
    "kllmmk..kvggggggggggguk..kLLMMk", // 52
    ".klmk.....kvggggggguk.....kLMk.", // 53
    ".kkkkkkkkkkkkkkkkkkkkkkkkkkkkk.", // 54
    "kLLLLLLLLLLLLLLLLLLLLLLLLLLLLmk", // 55
    "kaaaaaaaaaaaaaaaaaaaaaaaaaaaaak", // 56
    "kmmmmmmmmmmmmmmmmmmmmmmmmmmmmMk", // 57
    "kMMMMMMMMMMMMMMMMMMMMMMMMMMMMMk", // 58
    ".kkkkkkkkkkkkkkkkkkkkkkkkkkkkk.", // 59
  ];

  const CARTELLINO = [
    "kkkkkkkkkkkkkkk...",
    "kbbbbbbbbbbbbbk...",
    "kpppppppppppppk...",
    "kpppppppppppppkk..",
    "kppppppppppppppPk.",
    "kpppppppppppppppPk",
    "kppppppppppppppPk.",
    "kpppppppppppppkk..",
    "kpppppppppppppk...",
    "kPPPPPPPPPPPPPk...",
    "kkkkkkkkkkkkkkk...",
  ];

  const CAPPELLO = [
    "................kkkkk................", // y 24
    "................kpfFk................",
    "...........kkkkkfffffkkkkk...........",
    ".......kkkkpppfffffffffffFkkkk.......",
    "....kkkppppppfffffffffffffFFFFkkk....",
    ".kkkppppppppffffffffffffffffFFFFFkkk.",
    "kppppppppppffffffffffffffffffFFFFFFFk", // y 30
    "kppppppppppffffffffffffffffffFFFFFFFk",
    "kkkppppppppffffffffffffffffffFFFFFkkk",
    "...kkkkqqqqqqqqqqqqqqqqqqqqqqqkkkk...",
    ".......kkqqqqqqqqqqqqqqqqqqqkk.......",
    ".........kkqqqqqqqqqqqqqqqkk.........",
    "...........kfqqqqqqqqqqqqk...........",
    "............kkkkkkkkkkkkk............", // y 37
  ];

  const SCHELETRO_CALDO = [
    "..........kkkkkk..........",
    "........kkwwwwwwkk........",
    ".......kwwbwwwwwWWk.......",
    "......kwwbwwwwwwwWWk......",
    "......kwwwwwwwwwwWWk......",
    "......kwnnnwwwwnnnWk......",
    "......kwnnnwwwwnnnWk......",
    "......kwwnwwwwwwnWWk......",
    ".......kwwwwnnwwwWk.......",
    "........kwkwkwkwWk........",
    "........kwwwwwwwWk........",
    ".......ksssssssSSSk.......",
    ".......ksssssssSSSk.......",
    ".......ksssssssSSSk.......",
    ".......kkkkkWWkkssSk......",
    "......kwwkkkWWkkswwk......",
    "......kwwwwwWWwwwwwk......",
    ".....kwwwkkkWWkkswwwk.....",
    ".....kwwwwwwWWwwwwwwk.....",
    "....kwwwkkkkWWkksswwwk....",
    "....kwwkwwwwWWwwwwSwwk....",
    "....kwwkkkkkWWkkkkkwwk....",
    "...kwwwkkwwwWWwwwkkwwwk...",
    "...kwwk..kkkWWkkk..kwwk...",
    "...kwwk....kWWk....kwwk...",
    "...kwwk....kWWk....kwwk...",
    "...kwwk....kWWk....kwwk...",
    "...kwwwk...kWWk...kwwwk...",
    "....kwwk.kkkWWkkk.kwwk....",
    "....kwwkkwwwwwwwwkkwwk....",
    "...kwwwwkwwwwwwwwkwwwwk...",
    "...kwwwwwwnwwwwnwwwwwwk...",
    "...kwwwwwwwwwwwwwwwwwwk...",
    "...kwwwwwwWWWWWWwwwwwwk...",
    "...kwwwwWWkkkkkkwwwwWWk...",
    "...kwwwwWWk....kwwwwWWk...",
    "....kwWkkk......kkkwWk....",
    "....kwWk..........kwWk....",
    "....kwWk..........kwWk....",
    "....kwWk..........kwWk....",
    "....kwWk..........kwWk....",
    "....kwWk..........kwWk....",
    "....kwWk..........kwWk....",
    "....kwWk..........kwWk....",
    "..kkkwWk..........kwWkkk..",
    ".kwwwwwwk........kwwwwwwk.",
    ".kWWWWWWk........kWWWWWWk.",
    "..kkkkkk..........kkkkkk..",
  ];

  const SCHELETRO_FREDDO = [
    "..........................",
    "..........kkkkkk..........",
    "........kkwwwwwwkk........",
    ".......kwwbwwwwwWWk.......",
    "......kwwbwwwwwwwWWk......",
    "......kwwwwwwwwwwWWk......",
    "......kwnnnwwwwnnnWk......",
    "......kwnnnwwwwnnnWk......",
    "......kwwnwwwwwwnWWk......",
    ".......kwwwwnnwwwWk.......",
    "........kwkwkwkwWk........",
    "........kwwwwwwwWk........",
    ".......ksssssssSSSk.......",
    ".......ksssssssSSSk.......",
    ".......ksssssssSSSk.......",
    ".......kkkkkWWkkssSk......",
    "......kwwkkkWWkkswwk......",
    "......kwwwwwWWwwwwwk......",
    ".....kwwwkkkWWwwwwwwk.....",
    ".....kwwwWWWwwwwwwwwk.....",
    ".....kwwkWWWWWWWsswwk.....",
    "....kwwwwwwWWWWWWWWwwk....",
    "....kwwwwwkkWWkWWWWWWk....",
    "....kwwwkwwwWWwwwkWWWk....",
    ".....kkk.kkkWWkkk.kkk.....",
    "...........kWWk...........",
    "...........kWWk...........",
    "...........kWWk...........",
    ".........kkkWWkkk.........",
    "........kwwwwwwwwk........",
    "........kwwwwwwwwk........",
    "....kkkkwwnwwwwnwwkkkk....",
    "...kwwwwwwwwwwwwwwwwwwk...",
    "...kwwwwwwWWWWWWwwwwwwk...",
    "...kwwwwWWkkkkkkwwwwWWk...",
    "...kwwwwWWk....kwwwwWWk...",
    "....kwWkkk......kkkwWk....",
    "....kwWk..........kwWk....",
    "....kwWk..........kwWk....",
    "....kwWk..........kwWk....",
    "....kwWk..........kwWk....",
    "....kwWk..........kwWk....",
    "....kwWk..........kwWk....",
    "....kwWk..........kwWk....",
    "..kkkwWk..........kwWkkk..",
    ".kwwwwwwk........kwwwwwwk.",
    ".kWWWWWWk........kWWWWWWk.",
    "..kkkkkk..........kkkkkk..",
  ];

  const SCHELETRO_FESTA = [
    "..kwwwk...kkkkkk..kwwwk...",
    "..kwwwk.kkwwwwwwkkkwwwk...",
    "...kwwkkwwbwwwwwWWkkwwk...",
    "...kwwkwwbwwwwwwwWWkwwk...",
    "...kwwkwwwwwwwwwwWWkwwk...",
    "...kwwkwnnnwwwwnnnWkwwk...",
    "..kwwwkwnnnwwwwnnnWkwwwk..",
    "..kwwkkwwnwwwwwwnWWkkwwk..",
    "..kwwk.kwwwwnnwwwWk.kwwk..",
    "..kwwk..kwkwkwkwWk..kwwk..",
    "..kwwwk.kwwwwwwwWk.kwwwk..",
    "...kwwkksssssssSSSkkwwk...",
    "...kwwwksssssssSSSkwwwk...",
    "....kwwwsssssssSSSwwwk....",
    ".....kwwkkkkWWkksswwk.....",
    ".....kwwwkkkWWkkswwwk.....",
    "......kwwwwwWWwwwwwk......",
    ".......kkkkkWWkkssSk......",
    ".......kwwwwWWwwwwSk......",
    "........kkkkWWkkssSk......",
    ".......kwwwwWWwwwwSk......",
    "........kkkkWWkkkkk.......",
    "........kwwwWWwwwk........",
    ".........kkkWWkkk.........",
    "...........kWWk...........",
    "...........kWWk...........",
    "...........kWWk...........",
    "...........kWWk...........",
    ".........kkkWWkkk.........",
    "........kwwwwwwwwk........",
    "........kwwwwwwwwk........",
    "....kkkkwwnwwwwnwwkkkk....",
    "...kwwwwwwwwwwwwwwwwwwk...",
    "...kwwwwwwWWWWWWwwwwwwk...",
    "...kwwwwWWkkkkkkwwwwWWk...",
    "...kwwwwWWk....kwwwwWWk...",
    "....kwWkkk......kkkwWk....",
    "....kwWk..........kwWk....",
    "....kwWk..........kwWk....",
    "....kwWk..........kwWk....",
    "....kwWk..........kwWk....",
    "....kwWk..........kwWk....",
    "....kwWk..........kwWk....",
    "....kwWk..........kwWk....",
    "..kkkwWk..........kwWkkk..",
    ".kwwwwwwk........kwwwwwwk.",
    ".kWWWWWWk........kWWWWWWk.",
    "..kkkkkk..........kkkkkk..",
  ];

  // ───────────────────────── La sabbia ─────────────────────────
  const SABBIA = 128;
  function righe(a, b) { const r = []; for (let y = a; y >= b; y--) r.push(y); return r; }
  /** Pixel `g` di una metà nell'ordine in cui si riempiono: dalla riga più bassa in su. */
  function ordineMeta(meta) {
    const lista = [];
    for (const y of meta === "sopra" ? righe(28, 6) : righe(53, 31)) {
      const xs = [];
      for (let x = 0; x < 31; x++) if (CLESSIDRA[y][x] === "g") xs.push(x);
      const ord = [];
      if (meta === "sopra") { // sopra: dai bordi verso il centro (la sabbia scende dal centro)
        let a = 0, b = xs.length - 1;
        while (a <= b) { ord.push(xs[a]); if (a !== b) ord.push(xs[b]); a++; b--; }
      } else { // sotto: dal centro verso i bordi (il mucchietto)
        ord.push(15);
        for (let d = 1; d < 16; d++) { if (xs.includes(15 - d)) ord.push(15 - d); if (xs.includes(15 + d)) ord.push(15 + d); }
      }
      for (const x of ord) lista.push([x, y]);
    }
    return lista;
  }
  const ORDINE = { sopra: ordineMeta("sopra"), sotto: ordineMeta("sotto") };
  const LARGA = CLESSIDRA.map((r) => r.split("").filter((c) => c === "g").length >= 5);
  const quanti = (min, cap) => (min <= 0 ? 0 : min >= cap ? SABBIA : Math.min(SABBIA - 1, Math.max(1, Math.round((SABBIA * min) / cap))));

  /** La griglia di lettere della clessidra con la sabbia. `flusso`: la sabbia sta scendendo (solo durante la corsa del tempo). */
  function griglia(sopra, cap, flusso, tempo) {
    const gr = CLESSIDRA.map((r) => [...r]);
    const piene = new Set();
    ORDINE.sopra.slice(0, quanti(sopra, cap)).forEach(([x, y]) => piene.add(x + "," + y));
    ORDINE.sotto.slice(0, quanti(cap - sopra, cap)).forEach(([x, y]) => piene.add(x + "," + y));
    for (const k of piene) {
      const [x, y] = k.split(",").map(Number);
      gr[y][x] = !piene.has(x + "," + (y - 1)) ? "s"
        : CLESSIDRA[y][x + 1] === "u" && LARGA[y] ? "D"
        : "S";
    }
    if (flusso && sopra > 0) { // il filo di sabbia: collo e granelli che cadono
      gr[29][15] = "S"; gr[30][15] = "s";
      const fase = Math.floor(tempo / 60);
      for (let y = 31; y <= 53 && !piene.has("15," + y); y++) if ((((y - fase) % 3) + 3) % 3 === 0) gr[y][15] = "S";
    }
    return gr.map((r) => r.join(""));
  }
  const ruota90 = (r) => Array.from({ length: r[0].length }, (_, c) => r.map((riga) => riga[c]).reverse().join(""));
  const ruota180 = (r) => [...r].reverse().map((riga) => [...riga].reverse().join(""));

  function coloriClessidra(i, hover) {
    const sab = i === 0
      ? { s: C.fiammaChiara, S: C.fiamma, D: C.brace }
      : { s: GEMME.smeraldo[2], S: GEMME.smeraldo[1], D: GEMME.smeraldo[0] };
    return {
      k: hover ? C.oro : C.bordo, l: C.legnoLuce, L: C.legnoChiaro, m: C.legno, M: C.legnoScuro,
      v: C.notteChiara, u: C.ferroChiaro, g: C.notte, r: C.bianco, a: sab.S, ...sab,
    };
  }

  // ───────────────────────── Regole (funzione pura) ─────────────────────────
  const iniziale = () => ({ minuto: 0, sopra: [0, 0], acceso: false });

  function applica(v, st, m) {
    const cap = v.clessidre, T = v.obiettivo;
    const azione = m && m.azione;
    if (azione === "gira") {
      const i = m.clessidra;
      if (i !== 0 && i !== 1) return [st, { valida: false, motivo: "clessidra inesistente" }];
      const sopra = [...st.sopra];
      sopra[i] = cap[i] - sopra[i];
      const nuovo = { minuto: st.minuto, sopra, acceso: true };
      return [nuovo, { ok: true, minuto: nuovo.minuto, sopra: [...sopra], acceso: true }];
    }
    if (azione === "aspetta") {
      if (!st.acceso) return [st, { valida: false, motivo: "fungo spento" }];
      const vive = st.sopra.filter((x) => x > 0);
      if (!vive.length) return [st, { valida: false, motivo: "niente scorre" }];
      const dt = Math.min(...vive);
      const minuto = st.minuto + dt;
      if (minuto > T) return [iniziale(), { errore: true, motivo: "troppo tardi", minuto: T + 1 }];
      const svuotate = [0, 1].filter((i) => st.sopra[i] === dt);
      const sopra = st.sopra.map((x) => Math.max(0, x - dt));
      return [{ minuto, sopra, acceso: true }, { ok: true, minuto, sopra: [...sopra], svuotate }];
    }
    if (azione === "spegni") {
      if (!st.acceso) return [st, { valida: false, motivo: "fungo spento" }];
      if (st.minuto === T) return [{ ...st, acceso: false }, { risolto: true, minuto: T }];
      return [iniziale(), { errore: true, motivo: "troppo presto", minuto: st.minuto }];
    }
    if (azione === "ricomincia") return [iniziale(), { ok: true }];
    return [st, { valida: false, motivo: "mossa sconosciuta" }];
  }

  function testoCarta(v) {
    const p = Math.min(...v.clessidre), q = Math.max(...v.clessidre);
    return `Il fungo riscaldante dell'area fumatori deve restare acceso esattamente ${v.obiettivo} minuti: uno in meno e i fumatori gelano, uno in più e la bombola esplode. Sul tavolino ci sono due clessidre, da ${p} e da ${q} minuti. Il fungo si accende quando giri la prima clessidra. Puoi girare le clessidre solo quando una delle due si svuota, e devi spegnere il fungo nel momento giusto.\nTocca una clessidra per girarla. «Aspetta» fa scorrere la sabbia finché una clessidra si svuota; «Spegni» spegne il fungo.`;
  }

  // ───────────────────────── Disegno: utilità ─────────────────────────
  function disco(ctx, cx, cy, r, colore, densita) {
    for (let dy = -r; dy <= r; dy++)
      for (let dx = -r; dx <= r; dx++)
        if (dx * dx + dy * dy <= r * r && BAYER[(cy + dy) & 3][(cx + dx) & 3] < densita * 16) rett(ctx, colore, cx + dx, cy + dy, 1, 1);
  }

  // l'alone caldo del fungo: lista di pixel calcolata una volta
  const ALONE = [];
  for (let y = 18; y < 118; y++) for (let x = 250; x < 320; x++) {
    const d = Math.hypot(x - 292, (y - 50) * 1.15);
    if (d >= 36) continue;
    const soglia = BAYER[y & 3][x & 3] / 16;
    if (d < 20 && soglia < 0.5 * (1 - d / 20)) ALONE.push([x, y, C.brace]);
    else if (soglia < 0.55 * (1 - d / 36)) ALONE.push([x, y, C.muroAcceso]);
  }

  const SCINTILLE = [[124, 52], [160, 60], [166, 44], [210, 56], [214, 100], [120, 98], [190, 40]];

  // ───────────────────────── Il rompicapo ─────────────────────────
  const opzioni = {
    id: "clessidre-fungo",
    sfondo: "area-fumatori",
    velo: 0.45,

    variante(rng) {
      const COPPIE = [[7, 11], [9, 12], [11, 13], [13, 14]]; // [piccola, grande]
      const [piccola, grande] = COPPIE[Math.floor(rng() * COPPIE.length)];
      const clessidre = rng() < 0.5 ? [piccola, grande] : [grande, piccola]; // [sinistra, destra]
      return { clessidre, obiettivo: 15 };
    },

    crea(g) {
      opzioni.testo = testoCarta(g.variante);
      const v = g.variante;
      const cap = v.clessidre, T = v.obiettivo;
      const riduci = g.riduciMovimento;

      let st = iniziale();
      let risolto = !!g.giaRisolto;
      if (risolto) st = { minuto: T, sopra: [0, 0], acceso: false };

      // animazioni
      let giri = [null, null]; // { inizio, prima }
      let corsa = null;        // { da, a, sopraPrima, inizio, scoppio }
      let reaz = null;         // { tipo: "gelo" | "bum" | "vittoria", inizio, durata, minuto, sopra }
      let hover = -1;
      let neve = [];
      let ultimoFotogramma = -1;

      function chiudiAnim() {
        giri = [null, null];
        corsa = null;
        if (reaz && reaz.tipo !== "vittoria") reaz = null;
      }

      function nuovaNeve() {
        neve = Array.from({ length: 6 }, () => ({ x: 64 + Math.floor(Math.random() * 46), y: 56 + Math.floor(Math.random() * 60) }));
      }

      // ── La mossa: la stessa funzione per tocchi, bottoni, tastiera e prove ──
      function mossa(m) {
        chiudiAnim();
        const prima = st;
        const [nuovo, esito] = applica(v, st, m);
        if (esito.valida === false) {
          if (esito.motivo === "fungo spento" && m.azione === "aspetta") g.messaggio("Prima gira una clessidra: è il primo giro che accende il fungo.");
          else if (esito.motivo === "niente scorre") g.messaggio("Nessuna clessidra ha sabbia sopra: girane una.");
          else if (esito.motivo === "fungo spento" && m.azione === "spegni") g.messaggio("Il fungo è già spento: si accende girando una clessidra.");
          return esito;
        }
        st = nuovo;
        const t = g.tempo;

        if (m.azione === "gira") {
          const i = m.clessidra;
          if (!riduci) giri[i] = { inizio: t, prima: prima.sopra[i] };
          const s = nuovo.sopra[i];
          if (!prima.acceso) g.messaggio("Fungo acceso al minuto 0. Quando sei pronto, premi Aspetta.");
          else if (s > 1) g.messaggio(`Girata la clessidra da ${cap[i]}: sopra ci sono ${s} minuti di sabbia.`);
          else if (s === 1) g.messaggio(`Girata la clessidra da ${cap[i]}: sopra c'è 1 minuto di sabbia.`);
          else g.messaggio(`Girata la clessidra da ${cap[i]}: sopra non c'è più sabbia.`);
        } else if (m.azione === "aspetta") {
          if (esito.errore) {
            g.errore(`Al minuto ${T + 1} la bombola è scoppiata: troppo tardi`);
            g.messaggio("Bum! Fungo spento e clessidre a riposo: si riparte dal minuto 0.");
            const sopraFine = prima.sopra.map((x) => Math.max(0, x - (T + 1 - prima.minuto)));
            if (riduci) reaz = { tipo: "bum", inizio: t, durata: 1000, minuto: T + 1, sopra: sopraFine };
            else corsa = { da: prima.minuto, a: T + 1, sopraPrima: [...prima.sopra], inizio: t, scoppio: true, sopraFine };
          } else {
            if (!riduci) corsa = { da: prima.minuto, a: esito.minuto, sopraPrima: [...prima.sopra], inizio: t, scoppio: false };
            if (esito.svuotate.length === 2) g.messaggio(`Minuto ${esito.minuto}: si sono svuotate tutte e due le clessidre.`);
            else g.messaggio(`Minuto ${esito.minuto}: si è svuotata la clessidra da ${cap[esito.svuotate[0]]}.`);
          }
        } else if (m.azione === "spegni") {
          if (esito.errore) {
            g.errore(`Spento al minuto ${esito.minuto}: troppo presto, i fumatori gelano`);
            g.messaggio("Brr! Fungo spento e clessidre a riposo: si riparte dal minuto 0.");
            reaz = { tipo: "gelo", inizio: t, durata: 1200, minuto: prima.minuto, sopra: [...prima.sopra] };
            nuovaNeve();
          } else if (esito.risolto) {
            risolto = true;
            reaz = { tipo: "vittoria", inizio: t, durata: 1200 };
            g.messaggio("Spento al minuto 15 in punto: fumatori al caldo, bombola salva!");
            const p = Math.min(...cap), q = Math.max(...cap), d = q - p;
            const riepilogo = `Con le clessidre da ${p} e da ${q}: al via le giri tutte e due; al minuto ${p} si svuota la piccola e la rigiri; al minuto ${q} si svuota la grande e rigiri ancora la piccola, che rimette sopra ${d === 1 ? "il minuto appena sceso" : `i ${d} minuti appena scesi`}. Si svuota al minuto 15.`;
            g.risolto({ riepilogo, ritardo: 1200 });
          }
        } else if (m.azione === "ricomincia") {
          g.messaggio("Fungo spento e clessidre a riposo: si riparte dal minuto 0.");
        }
        return esito;
      }

      // ── Tocchi ──
      const zona = (x, y) => {
        if (y < 44 || y > 111) return -1;
        for (let i = 0; i < 2; i++) if (x >= CX[i] - 24 && x <= CX[i] + 23) return i;
        return -1;
      };
      g.tocca(({ tipo, x, y, premuto }) => {
        const i = zona(x, y);
        if (tipo === "muovi" && !premuto) {
          hover = i;
          g.scena.style.cursor = i >= 0 ? "pointer" : "";
        } else if (tipo === "giu" && i >= 0) {
          mossa({ azione: "gira", clessidra: i });
        }
      });
      g.scena.addEventListener("pointerleave", () => { hover = -1; g.scena.style.cursor = ""; });

      g.bottone("Aspetta", () => mossa({ azione: "aspetta" }), { id: "aspetta", forte: true });
      g.bottone("Spegni", () => mossa({ azione: "spegni" }), { id: "spegni" });
      g.bottone("Ricomincia", () => mossa({ azione: "ricomincia" }), { id: "ricomincia" });

      addEventListener("keydown", (e) => {
        if (risolto || e.target !== document.body || e.ctrlKey || e.altKey || e.metaKey) return;
        if (document.querySelector(".kit-velo-carta:not([hidden])")) return;
        if (e.key === "1") mossa({ azione: "gira", clessidra: 0 });
        else if (e.key === "2") mossa({ azione: "gira", clessidra: 1 });
        else if (e.key === "Enter") mossa({ azione: "aspetta" });
      });

      g.messaggio(g.giaRisolto
        ? "Il fungo si è spento al minuto giusto: qui hai finito."
        : "Tocca una clessidra per girarla: il primo giro accende il fungo.");

      // ───────────────────────── Vista: cosa si mostra in questo istante ─────────────────────────
      function vista(t) {
        const V = {
          mm: st.minuto, sopra: [...st.sopra], flusso: [false, false], rosso: false,
          fungo: st.acceso ? "acceso" : "spento", spia: st.acceso, pose: st.acceso ? "caldo" : "freddo",
          tau: 0, reaz: null, bum: false, vinto: false,
        };
        if (corsa) {
          const passi = Math.min(corsa.a - corsa.da, Math.floor((t - corsa.inizio) / 90));
          V.mm = corsa.da + passi;
          V.sopra = corsa.sopraPrima.map((x) => Math.max(0, x - passi));
          V.flusso = V.sopra.map((x) => x > 0 && V.mm < corsa.a);
          V.fungo = "acceso"; V.spia = true; V.pose = "caldo";
        } else if (reaz) {
          V.reaz = reaz.tipo;
          V.tau = t - reaz.inizio;
          if (reaz.tipo === "gelo") {
            V.mm = reaz.minuto; V.sopra = [...reaz.sopra]; V.rosso = true;
            V.fungo = "spento"; V.spia = false; V.pose = "gelo";
          } else if (reaz.tipo === "bum") {
            V.mm = reaz.minuto; V.sopra = [...reaz.sopra]; V.rosso = true;
            V.fungo = "spento"; V.spia = false; V.pose = "bum";
            if (riduci) V.tau = 600;
          } else {
            V.vinto = true; V.pose = "festa";
            const tau = V.tau;
            if (riduci || tau >= 375) { V.fungo = "spento"; V.spia = false; }
            else if (tau >= 250) { V.fungo = "caldo"; V.spia = false; }
            else if (tau >= 125) { V.fungo = "brace"; V.spia = false; }
            else { V.fungo = "acceso"; V.spia = true; }
          }
        } else if (risolto) {
          V.vinto = true; V.pose = "festa"; V.fungo = "spento"; V.spia = false;
        }
        return V;
      }

      // ───────────────────────── Disegno ─────────────────────────
      function disegnaAlone(ctx) {
        for (const [x, y, c] of ALONE) rett(ctx, c, x, y, 1, 1);
      }

      function disegnaLavagna(ctx, V) {
        const { mm } = V;
        riquadro(ctx, 10, 60, 57, 82, C.legno);
        rett(ctx, C.legnoChiaro, 11, 61, 55, 1);
        rett(ctx, C.legnoChiaro, 11, 61, 1, 79);
        rett(ctx, C.legnoScuro, 11, 140, 55, 1);
        rett(ctx, C.legnoScuro, 65, 62, 1, 79);
        riquadro(ctx, 13, 63, 51, 76, C.siepe, C.legnoScuro);
        for (let y = 64; y < 138; y++) for (let x = 14; x < 63; x++) if ((x * 7 + y * 13) % 23 === 0) rett(ctx, C.erbaScura, x, y, 1, 1);
        riquadro(ctx, 13, 141, 4, 10, C.legno);
        riquadro(ctx, 60, 141, 4, 10, C.legno);
        testo(ctx, "MINUTO", 38, 66, { colore: C.pietraChiara, ombra: null, allinea: "centro" });
        const colore = V.rosso ? C.tappetoChiaro : mm === T ? C.oro : C.bianco;
        testo(ctx, String(mm), 38, 77, { colore, ombra: C.bordo, scala: 3, allinea: "centro" });
        for (let i = 0; i < Math.min(15, mm); i++) {
          const gx = 22 + Math.floor(i / 5) * 12, k = i % 5;
          if (k < 4) rett(ctx, C.pietraChiara, gx + k * 2, 103, 1, 7);
          else for (let j = 0; j <= 8; j++) rett(ctx, C.pietraChiara, gx - 1 + j, 109 - Math.round((j * 6) / 8), 1, 1);
        }
        if (mm > 15) testo(ctx, "!", 56, 103, { colore: C.tappetoChiaro, ombra: null });
        for (let x = 18; x <= 58; x += 2) rett(ctx, C.pietra, x, 112, 1, 1);
        testo(ctx, "SPEGNI A", 38, 115, { colore: C.pietraChiara, ombra: null, piccolo: true, allinea: "centro" });
        testo(ctx, String(T), 38, 122, { colore: C.oro, ombra: C.bordo, scala: 2, allinea: "centro" });
        if (V.vinto) {
          rett(ctx, C.giallo, 17, 74, 43, 1);
          rett(ctx, C.giallo, 17, 101, 43, 1);
          rett(ctx, C.giallo, 17, 74, 1, 28);
          rett(ctx, C.giallo, 59, 74, 1, 28);
        }
      }

      function disegnaScheletro(ctx, V) {
        let x = 76, y = 70;
        let righeS = SCHELETRO_FREDDO;
        const col = { k: C.bordo, w: C.pietraChiara, W: C.pietra, n: C.nero, b: C.bianco, s: C.tappetoChiaro, S: C.tappeto };
        const fr = g.fotogramma;
        if (V.pose === "caldo") righeS = SCHELETRO_CALDO;
        else if (V.pose === "festa") {
          righeS = SCHELETRO_FESTA;
          if (!riduci && V.reaz === "vittoria") {
            const s = Math.floor(V.tau / 125);
            if (s === 1 || s === 4) y -= 2;
          }
        } else if (V.pose === "freddo") {
          if (!riduci) x += [0, 0, 1, 0, 0, 0, -1, 0][fr % 8];
        } else if (V.pose === "gelo") {
          col.w = C.notteChiara; col.W = C.ferroChiaro;
          if (!riduci) x += fr % 2 ? 1 : -1;
        } else if (V.pose === "bum") {
          if (!riduci) { if (V.tau < 120) y -= 3; else if (V.tau < 240) y -= 1; }
        }
        sprite(ctx, righeS, col, x, y);
        if (V.pose === "bum") {
          rett(ctx, C.bianco, x + 9, y + 6, 1, 1);
          rett(ctx, C.bianco, x + 16, y + 6, 1, 1);
        }
        if (V.pose === "gelo") {
          rett(ctx, C.bianco, x + 10, y + 12, 1, 3);
          rett(ctx, C.bianco, x + 13, y + 12, 1, 2);
          rett(ctx, C.bianco, x + 16, y + 12, 1, 3);
          rett(ctx, C.bianco, x + 5, y + 24, 1, 2);
          rett(ctx, C.bianco, x + 20, y + 24, 1, 2);
          testo(ctx, "BRR", x + 13, y - 9, { colore: C.notteChiara, ombra: C.bordo, piccolo: true, allinea: "centro" });
        }
      }

      function disegnaTavolino(ctx) {
        riquadro(ctx, 103, 107, 127, 15, C.legno);
        rett(ctx, C.legnoLuce, 104, 108, 125, 1);
        rett(ctx, C.legnoChiaro, 104, 109, 125, 1);
        rett(ctx, C.legnoScuro, 104, 120, 125, 1);
        rett(ctx, C.legnoScuro, 228, 110, 1, 11);
        riquadro(ctx, 157, 121, 19, 3, C.ferroChiaro);
        riquadro(ctx, 161, 123, 11, 22, C.ferro);
        rett(ctx, C.ferroChiaro, 163, 124, 1, 20);
        riquadro(ctx, 143, 144, 47, 6, C.ferro);
        rett(ctx, C.ferroChiaro, 144, 145, 45, 1);
        for (let y = 150; y <= 152; y++) for (let x = 138; x <= 194; x++) if (BAYER[y & 3][x & 3] < 8) rett(ctx, C.bordo, x, y, 1, 1);
        for (let i = 0; i < 2; i++) {
          const cx = CX[i];
          riquadro(ctx, cx - 19, 110, 39, 11, C.oro);
          rett(ctx, C.giallo, cx - 18, 111, 37, 1);
          rett(ctx, C.oroScuro, cx - 18, 119, 37, 1);
          testo(ctx, `${cap[i]} MIN`, cx, 112, { colore: C.bordo, ombra: null, allinea: "centro" });
        }
      }

      function disegnaCartellini(ctx, V) {
        const col = { k: C.bordo, b: C.bianco, p: C.pietraChiara, P: C.pietra };
        for (let i = 0; i < 2; i++) {
          const sopra = V.sopra[i], sotto = cap[i] - sopra;
          const x = i === 0 ? CX[0] - 34 : CX[1] + 17;
          const nx = i === 0 ? x + 7 : x + 10;
          [[62, sopra], [87, sotto]].forEach(([y, n]) => {
            sprite(ctx, CARTELLINO, col, x, y, { specchia: i === 1 });
            testo(ctx, String(n), nx, y + 2, { colore: C.bordo, ombra: null, allinea: "centro" });
          });
        }
      }

      function disegnaClessidre(ctx, V, t) {
        for (let i = 0; i < 2; i++) {
          const colori = coloriClessidra(i, hover === i && !risolto);
          const gi = giri[i];
          if (gi) {
            const prima = griglia(gi.prima, cap[i], false, 0);
            const el = t - gi.inizio;
            if (el < 80) sprite(ctx, prima, colori, CX[i] - 15, 47);
            else if (el < 160) sprite(ctx, ruota90(prima), colori, CX[i] - 30, 65);
            else sprite(ctx, ruota180(prima), colori, CX[i] - 15, 47);
          } else {
            sprite(ctx, griglia(V.sopra[i], cap[i], V.flusso[i], t), colori, CX[i] - 15, 50);
          }
        }
      }

      function disegnaFungo(ctx, V) {
        const acceso = V.fungo === "acceso";
        const lit = V.fungo === "acceso" || V.fungo === "brace";
        const fr = g.fotogramma;
        // cappello (salta durante lo scoppio)
        let cy = 24;
        if (V.reaz === "bum" && V.tau >= 120 && V.tau < 520) cy = 20;
        sprite(ctx, CAPPELLO, { k: C.bordo, p: C.pietraChiara, f: C.ferroChiaro, F: C.ferro, q: lit ? C.brace : C.ferro }, 274, cy);
        // bruciatore
        riquadro(ctx, 286, 38, 13, 26, C.ferro);
        rett(ctx, C.ferroChiaro, 287, 39, 11, 1);
        rett(ctx, C.ferroChiaro, 287, 62, 11, 1);
        if (acceso) {
          const fase = riduci ? 0 : fr % 3;
          for (let y = 40; y <= 61; y++) rett(ctx, (y + fase) % 3 === 0 ? C.fiamma : C.brace, 287, y, 11, 1);
          rett(ctx, C.fiammaChiara, 291, 42, 3, 18);
          rett(ctx, C.bianco, 292, 44 + (riduci ? 0 : fr % 2), 1, 12);
        } else if (V.fungo === "brace") {
          rett(ctx, C.brace, 287, 40, 11, 22);
        } else if (V.fungo === "caldo") {
          rett(ctx, C.muroAcceso, 287, 40, 11, 22);
        } else {
          rett(ctx, C.ferro, 287, 40, 11, 22);
          rett(ctx, C.ferroChiaro, 290, 42, 1, 18);
        }
        rett(ctx, C.bordo, 289, 40, 1, 22);
        rett(ctx, C.bordo, 295, 40, 1, 22);
        // palo
        riquadro(ctx, 289, 64, 7, 40, C.ferroChiaro);
        rett(ctx, C.pietraChiara, 290, 65, 1, 38);
        rett(ctx, C.ferro, 294, 65, 1, 38);
        riquadro(ctx, 288, 84, 9, 3, C.ferro);
        riquadro(ctx, 286, 104, 13, 3, C.ferroChiaro);
        for (let y = 107; y <= 145; y++) {
          const s = Math.floor((y - 107) / 8), a = 283 - s, b = 301 + s;
          rett(ctx, C.bordo, a, y, b - a + 1, 1);
          rett(ctx, C.ferro, a + 1, y, b - a - 1, 1);
          rett(ctx, C.ferroChiaro, a + 1, y, 3, 1);
          rett(ctx, C.pietra, a + 1, y, 1, 1);
        }
        rett(ctx, C.bordo, 283, 107, 19, 1);
        rett(ctx, C.bordo, 288, 111, 10, 1);
        rett(ctx, C.bordo, 288, 114, 10, 1);
        riquadro(ctx, 285, 121, 15, 9, C.giallo);
        testo(ctx, "GAS", 292, 123, { colore: C.bordo, ombra: null, piccolo: true, allinea: "centro" });
        riquadro(ctx, 286, 134, 6, 6, C.oroScuro);
        rett(ctx, C.oro, 287, 135, 2, 2);
        riquadro(ctx, 295, 134, 5, 5, V.spia ? C.erbaChiara : C.ferro);
        if (V.spia) rett(ctx, C.bianco, 296, 135, 1, 1);
        riquadro(ctx, 276, 146, 33, 5, C.ferro);
        rett(ctx, C.ferroChiaro, 277, 147, 31, 1);
        for (let y = 151; y <= 152; y++) for (let x = 274; x <= 310; x++) if (BAYER[y & 3][x & 3] < 8) rett(ctx, C.bordo, x, y, 1, 1);
      }

      function disegnaEffetti(ctx, V, t) {
        if (V.reaz === "bum") {
          const tau = V.tau;
          if (tau < 120) {
            rett(ctx, C.bianco, 287, 40, 11, 22);
            disco(ctx, 292, 50, 7, C.giallo, 1);
          } else if (tau < 400) {
            disco(ctx, 292, 48, 16, C.ferroChiaro, 0.6);
            disco(ctx, 292, 48, 12, C.fiamma, 1);
            disco(ctx, 292, 48, 7, C.fiammaChiara, 1);
            disco(ctx, 292, 48, 3, C.bianco, 1);
          } else {
            const r = 16 + Math.floor((tau - 400) / 100), cy = 48 - Math.floor((tau - 400) / 150);
            disco(ctx, 292, cy, r, C.ferro, 0.7);
            disco(ctx, 292, cy, r - 4, C.ferroChiaro, 0.75);
            disco(ctx, 288, cy - 4, r - 9, C.pietra, 0.8);
          }
          if (tau >= 120) testo(ctx, "BUM!", 292, 66, { colore: C.giallo, ombra: C.bordo, scala: 2, allinea: "centro" });
        }
        if (V.reaz === "gelo" && !riduci) {
          if (g.fotogramma !== ultimoFotogramma) {
            ultimoFotogramma = g.fotogramma;
            for (const f of neve) { f.y += 1; if (f.y > 116) { f.y = 56; f.x = 64 + Math.floor(Math.random() * 46); } }
          }
          for (const f of neve) {
            rett(ctx, C.notteChiara, f.x - 1, f.y, 1, 1);
            rett(ctx, C.notteChiara, f.x + 1, f.y, 1, 1);
            rett(ctx, C.notteChiara, f.x, f.y - 1, 1, 1);
            rett(ctx, C.notteChiara, f.x, f.y + 1, 1, 1);
            rett(ctx, C.bianco, f.x, f.y, 1, 1);
          }
        }
        // scintille della vittoria (solo se vinto in questa sessione)
        if (V.vinto && !g.giaRisolto && !riduci) {
          SCINTILLE.forEach(([sx, sy], k) => {
            const f = (g.fotogramma + k) % 3;
            if (f === 0) return;
            if (f === 1) {
              rett(ctx, C.giallo, sx - 1, sy, 1, 1);
              rett(ctx, C.giallo, sx + 1, sy, 1, 1);
              rett(ctx, C.giallo, sx, sy - 1, 1, 1);
              rett(ctx, C.giallo, sx, sy + 1, 1, 1);
            }
            rett(ctx, C.bianco, sx, sy, 1, 1);
          });
        }
        // vapore della vittoria
        if (V.reaz === "vittoria" && !riduci && V.tau >= 125) {
          const s = Math.floor((V.tau - 125) / 125);
          for (let j = 0; j < 3; j++) {
            const y = 22 - s - 4 * j;
            if (y >= 18) rett(ctx, C.pietra, 291, y, 2, 2);
          }
        }
      }

      function aggiorna(t) {
        for (let i = 0; i < 2; i++) if (giri[i] && t - giri[i].inizio >= 240) giri[i] = null;
        if (corsa && t - corsa.inizio >= (corsa.a - corsa.da) * 90) {
          const c = corsa;
          corsa = null;
          if (c.scoppio) reaz = { tipo: "bum", inizio: t, durata: 1000, minuto: c.a, sopra: c.sopraFine };
        }
        if (reaz && t - reaz.inizio >= reaz.durata) reaz = null;
      }

      g.anima((t) => {
        aggiorna(t);
        const ctx = g.ctx;
        const V = vista(t);
        ctx.clearRect(0, 0, g.larghezza, g.altezza);
        if (V.fungo === "acceso" || (V.reaz === "vittoria" && V.tau < 250 && !riduci)) disegnaAlone(ctx);
        disegnaLavagna(ctx, V);
        disegnaScheletro(ctx, V);
        disegnaTavolino(ctx);
        disegnaCartellini(ctx, V);
        disegnaClessidre(ctx, V, t);
        disegnaFungo(ctx, V);
        disegnaEffetti(ctx, V, t);
      });

      g.espone({
        gioca: (m) => mossa(m),
        statoGioco: () => ({ minuto: st.minuto, sopra: [...st.sopra], capacita: [...cap], obiettivo: T, acceso: st.acceso, risolto }),
        posizione: (i) => ({ x: CX[i], y: 80 }),
      });
    },
  };

  EscapeDemo.avvia(opzioni);
})();
