// I teli che mentono (Deposito): cinque fantasmi sotto cinque teli, ognuno sincero o bugiardo.
// Il giocatore appende a ogni telo il cartellino giusto. Logica (muovi) separata dal disegno.

(function () {
  "use strict";
  const { C, GEMME, BAYER, rett, riquadro, sprite, testo, larghezzaTesto } = EscapeDemo;

  // ───────────────────────── Frasi e generatore ─────────────────────────
  const NOMI = ["quello a righe", "quello a quadri", "quello a pois", "il rattoppato", "il bucato"];
  const NUMERI = ["", "un", "due", "tre", "quattro"];
  const TIPI = [["bugiardo", 3], ["sincero", 2], ["stesso", 3], ["esattamente", 2], ["almeno", 2], ["se", 3], ["almenoUno", 2], ["unSolo", 3]];
  const MONDI = Array.from({ length: 32 }, (_, m) => [0, 1, 2, 3, 4].map((i) => ((m >> i) & 1) === 1));

  function altri(rng, chi, n) {
    const scelti = [];
    while (scelti.length < n) {
      const x = Math.floor(rng() * 5);
      if (x !== chi && !scelti.includes(x)) scelti.push(x);
    }
    return scelti.sort((a, b) => a - b);
  }
  function nuovaFrase(rng, chi) {
    let v = rng() * 20;
    let tipo = "bugiardo";
    for (const [t, p] of TIPI) { if (v < p) { tipo = t; break; } v -= p; }
    if (tipo === "bugiardo" || tipo === "sincero") return { tipo, chi: altri(rng, chi, 1) };
    if (tipo === "stesso" || tipo === "se" || tipo === "almenoUno") return { tipo, chi: altri(rng, chi, 2) };
    if (tipo === "unSolo") return { tipo, chi: altri(rng, chi, 3) };
    if (tipo === "esattamente") return { tipo, chi: [], k: 1 + Math.floor(rng() * 4) };
    return { tipo, chi: [], k: 2 + Math.floor(rng() * 3) };
  }
  function vera(f, T) {
    const [x, y, z] = f.chi;
    const bugiardi = T.filter((t) => !t).length;
    switch (f.tipo) {
      case "bugiardo": return !T[x];
      case "sincero": return T[x];
      case "stesso": return T[x] === T[y];
      case "esattamente": return bugiardi === f.k;
      case "almeno": return bugiardi >= f.k;
      case "se": return !T[x] || !T[y];
      case "almenoUno": return T[x] || T[y];
      case "unSolo": return [x, y, z].filter((i) => T[i]).length === 1;
    }
    return false;
  }
  function soluzioni(frasi, quali = [0, 1, 2, 3, 4]) {
    return MONDI.filter((T) => quali.every((i) => T[i] === vera(frasi[i], T)));
  }
  const maiuscola = (s) => s[0].toUpperCase() + s.slice(1);
  function testoFrase(f) {
    const [x, y, z] = f.chi.map((i) => NOMI[i]);
    switch (f.tipo) {
      case "bugiardo": return maiuscola(`${x} è bugiardo.`);
      case "sincero": return maiuscola(`${x} è sincero.`);
      case "stesso": return maiuscola(`${x} e ${y} sono dello stesso tipo.`);
      case "esattamente": return f.k === 1 ? "Fra noi cinque c'è esattamente un bugiardo." : `Fra noi cinque ci sono esattamente ${NUMERI[f.k]} bugiardi.`;
      case "almeno": return `Fra noi cinque ci sono almeno ${NUMERI[f.k]} bugiardi.`;
      case "se": return `Se ${x} è sincero, allora ${y} è bugiardo.`;
      case "almenoUno": return `Almeno uno fra ${x} e ${y} è sincero.`;
      case "unSolo": return `Fra ${x}, ${y} e ${z} c'è un solo sincero.`;
    }
    return "";
  }
  function vaBene(frasi) {
    const tutte = soluzioni(frasi);
    if (tutte.length !== 1) return false;
    for (let i = 0; i < 5; i++) if (soluzioni(frasi, [0, 1, 2, 3, 4].filter((j) => j !== i)).length < 2) return false;
    for (let a = 0; a < 5; a++)
      for (let b = a + 1; b < 5; b++) {
        const s = soluzioni(frasi, [a, b]);
        for (let i = 0; i < 5; i++) if (s.every((T) => T[i] === s[0][i])) return false;
      }
    const bugiardi = tutte[0].filter((t) => !t).length;
    if (bugiardi < 1 || bugiardi > 4) return false;
    if (new Set(frasi.map(testoFrase)).size !== 5) return false;
    const conta = {};
    for (const f of frasi) conta[f.tipo] = (conta[f.tipo] || 0) + 1;
    return Math.max(...Object.values(conta)) <= 2;
  }
  const RISERVA = [
    { tipo: "unSolo", chi: [1, 3, 4] }, { tipo: "stesso", chi: [2, 3] }, { tipo: "se", chi: [0, 3] },
    { tipo: "se", chi: [0, 2] }, { tipo: "bugiardo", chi: [2] },
  ];
  function generaTeli(rng) {
    for (let tentativo = 1; tentativo <= 20000; tentativo++) {
      const frasi = [0, 1, 2, 3, 4].map((chi) => nuovaFrase(rng, chi));
      if (vaBene(frasi)) return frasi.map((f) => ({ ...f, testo: testoFrase(f) }));
    }
    return RISERVA.map((f) => ({ ...f, testo: testoFrase(f) }));
  }
  const soluzioneDi = (frasi) => soluzioni(frasi)[0].map((t) => (t ? "sincero" : "bugiardo"));
  const semeGiro = (seme, giro) => (seme + Math.imul(giro, 0x9e3779b1)) >>> 0;

  // La spiegazione del «?» (null = frase semplice).
  function spiegazione(f) {
    switch (f.tipo) {
      case "stesso": return "«Dello stesso tipo»: sinceri tutti e due, oppure bugiardi tutti e due.";
      case "esattamente": return "«Noi cinque» conta anche chi parla; «esattamente»: né di più né di meno.";
      case "almeno": return `«Noi cinque» conta anche chi parla; «almeno ${NUMERI[f.k]}»: ${NUMERI[f.k]} o di più.`;
      case "se": return "«Se A, allora B» è falsa in un caso solo: A vera e B falsa.";
      case "almenoUno": return "«Almeno uno» è vera anche quando sono sinceri tutti e due.";
      case "unSolo": return "«Un solo sincero»: fra i tre ne è sincero uno, né di più né di meno.";
    }
    return null;
  }
  function elenco(lista) {
    if (lista.length <= 1) return lista.join("");
    return `${lista.slice(0, -1).join(", ")} e ${lista[lista.length - 1]}`;
  }

  // ───────────────────────── Logica pura ─────────────────────────
  const CX = [40, 100, 160, 220, 280];
  const SUCCESSIVO = { null: "sincero", sincero: "bugiardo", bugiardo: null };
  const valoreOk = (v) => v === null || v === "sincero" || v === "bugiardo";
  const quanti = (cart) => cart.filter((c) => c !== null).length;

  /**
   * stato + mossa → { st, esito, ev }. `errori` sono gli errori già fatti (del kit). Non tocca niente fuori.
   * `ev` dice al chiamante quali effetti (messaggi, errore del kit, animazioni) deve produrre.
   */
  function muovi(st, m, errori, frasiDelGiro) {
    const no = { st, esito: { valida: false }, ev: null };
    if (!m || typeof m !== "object") return no;
    const telo = m.telo;
    const teloOk = Number.isInteger(telo) && telo >= 0 && telo <= 4;
    switch (m.tipo) {
      case "parla":
        if (!teloOk) return no;
        return { st: { ...st, parla: telo }, esito: { ok: true, parla: telo }, ev: "parla", telo };
      case "gira": {
        if (!teloOk) return no;
        const cart = [...st.cartellini];
        cart[telo] = SUCCESSIVO[cart[telo]];
        return { st: { ...st, cartellini: cart, parla: telo }, esito: { ok: true, cartellini: [...cart] }, ev: "cartellino", telo };
      }
      case "cartellino": {
        if (!teloOk || !valoreOk(m.valore)) return no;
        const cart = [...st.cartellini];
        cart[telo] = m.valore;
        return { st: { ...st, cartellini: cart, parla: telo }, esito: { ok: true, cartellini: [...cart] }, ev: "cartellino", telo };
      }
      case "togli": {
        const cart = [null, null, null, null, null];
        return { st: { ...st, cartellini: cart }, esito: { ok: true, cartellini: [...cart] }, ev: "togli" };
      }
      case "spiega": {
        if (st.parla === null) return no;
        const t = spiegazione(st.frasi[st.parla]);
        if (!t) return no;
        return { st, esito: { ok: true, testo: t }, ev: "spiega", testo: t };
      }
      case "controlla": {
        if (st.cartellini.some((c) => c === null))
          return { st, esito: { valida: false, motivo: "mancano cartellini" }, ev: "mancano" };
        const sol = soluzioneDi(st.frasi);
        if (sol.every((c, i) => c === st.cartellini[i])) {
          const sinceri = NOMI.filter((_, i) => sol[i] === "sincero");
          const bugiardi = NOMI.filter((_, i) => sol[i] === "bugiardo");
          return {
            st: { ...st, parla: null, svelati: true }, esito: { risolto: true }, ev: "vittoria",
            riepilogo: `Sinceri: ${elenco(sinceri)}. Bugiardi: ${elenco(bugiardi)}.`,
          };
        }
        const nuovi = errori + 1;
        const giro = Math.floor(nuovi / 3);
        const rigenerato = giro !== st.giro;
        const esito = { errore: true, motivo: "Qualche cartellino è sbagliato", sbagliNelGiro: nuovi % 3, rigenerato, giro };
        const nuovoSt = rigenerato
          ? { giro, frasi: frasiDelGiro(giro), cartellini: [null, null, null, null, null], parla: 0, svelati: false }
          : st;
        return { st: nuovoSt, esito, ev: "errore", n: nuovi % 3, rigenerato };
      }
    }
    return no;
  }

  // ───────────────────────── Grafica: sprite ─────────────────────────
  const OMBRA = { l: 0, f: 1, F: 2, G: 3 };
  const RAMPE = {
    bianco: [C.bianco, C.pietraChiara, C.pietra, C.ferroChiaro],
    rosso: [GEMME.rubino[2], C.tappetoChiaro, C.tappeto, C.tappeto],
    bluScuro: [GEMME.zaffiro[2], GEMME.zaffiro[1], GEMME.zaffiro[0], GEMME.zaffiro[0]],
    bluChiaro: [C.bianco, GEMME.zaffiro[2], C.notteChiara, C.ferroChiaro],
    viola: [C.lilla, C.viola, C.violaScuro, C.violaScuro],
    giallo: [C.bianco, C.giallo, C.oro, C.oroScuro],
    grigio: [C.pietraChiara, C.pietra, C.ferroChiaro, C.ferro],
    verde: [C.erbaChiara, C.erba, C.erbaScura, C.erbaScura],
    arancio: [C.fiammaChiara, C.fiamma, C.brace, C.brace],
    acqua: [GEMME.acquamarina[2], C.acqua, GEMME.acquamarina[0], GEMME.acquamarina[0]],
  };
  const TOPPE = [
    { x: 5, y: 19, w: 8, h: 8, r: "verde" },
    { x: 18, y: 27, w: 8, h: 7, r: "arancio" },
    { x: 16, y: 3, w: 6, h: 5, r: "acqua" },
  ];
  const BUCHI = [
    [12, 4], [13, 4], [12, 5],
    [7, 21], [8, 21], [7, 22], [8, 22], [9, 22], [8, 23],
    [26, 19], [26, 20], [27, 20],
    [21, 27], [22, 27], [21, 28], [22, 28], [23, 28], [22, 29],
    [13, 32], [14, 32], [14, 33], [15, 33],
  ];
  function colorePixel(telo, x, y, ch) {
    const s = OMBRA[ch];
    if (telo === 0) return (Math.floor(y / 3) % 2 === 1 ? RAMPE.rosso : RAMPE.bianco)[s];
    if (telo === 1) {
      const a = ((x % 8) + 8) % 8 < 4, b = ((y % 8) + 8) % 8 < 4;
      return (a && b ? RAMPE.bluScuro : a || b ? RAMPE.bluChiaro : RAMPE.bianco)[s];
    }
    if (telo === 2) {
      const riga = Math.floor(y / 5), rx = (((x + (riga % 2) * 3) % 6) + 6) % 6, ry = y % 5;
      return (rx < 2 && ry < 2 ? RAMPE.giallo : RAMPE.viola)[s];
    }
    if (telo === 3) {
      for (const t of TOPPE)
        if (x >= t.x && x < t.x + t.w && y >= t.y && y < t.y + t.h) {
          const orlo = x === t.x || y === t.y || x === t.x + t.w - 1 || y === t.y + t.h - 1;
          if (orlo) return (x + y) % 2 === 0 ? C.bordo : RAMPE[t.r][2];
          return RAMPE[t.r][Math.min(s, 2)];
        }
      return RAMPE.bianco[s];
    }
    if (BUCHI.some(([a, b]) => a === x && b === y)) return C.nero;
    return RAMPE.grigio[s];
  }

  const FANTASMA_A = `
............kkkkkkkk............
..........kkllllFFFGkk..........
.........kllllllffFFFGk.........
........klllllllfffFFFGk........
.......kllffffffffffFFFGk.......
.......kllffffffffffFFFGk.......
......kllffffffffffffFFFGk......
......kllffffffffffffFFFGk......
......kllffffffffffffFFFGk......
.....kllffffffffffffffFFFGk.....
.....kllffffffffffffffFFFGk.....
.....kllffffffffffffffFFFGk.....
.....kllffffffffffffffFFFGk.....
.....kllffffffffffffffFFFGk.....
.....kllffffffffffffffFFFGk.....
.....kllffffffffffffffFFFGk.....
....kllffffffffffffffffFFFGk....
...kllffffffffffffffffffFFFGk...
..kllffffffffffffffffffffFFFGk..
.kllffffffffffffffffffffffFFFGk.
.kllffffffffffffffffffffffFFFGk.
.kllffffffffffffffffffffffFFFGk.
..kllffffffffffffffffffffFFFGk..
..kllffffffffffffffffffffFFFGk..
...klGGfffffffffffffffffFGGGk...
...klGffffFfffffffffFfffFFGGk...
...kllffffFfffffffffFfffFFFGk...
...kllffffFfffffffffFfffFFFGk...
..kllfffffFlffffffffFlfffFFFGk..
..kllfffffFlffffffffFlfffFFFGk..
..kllfffffFlffffffffFlfffFFFGk..
..kllfffffFlffffffffFlfffFFFGk..
..kllfffffFlffffffffFlfffFFFGk..
.kllffffffFlffffffffFlffffFFFGk.
.kllffffffFlffffffffFlffffFFFGk.
.kllffffffFlffffffffFlffffFFFGk.
.kffffffffFlffffffffFlffffFFFGk.
.kFFFFFFFFFFFFFFFFFFFFFFFFFFFGk.
.kFFFFkkFFFFkkFFFFkkFFFFkkFFFGk.
..kkkk..kkkk..kkkk..kkkk..kkkk..`.trim().split("\n");
  const FANTASMA_B = [...FANTASMA_A.slice(0, 38),
    "..kFFFFkkFFFFkkFFFFkkFFFFkkFFGk.",
    "...kkkk..kkkk..kkkk..kkkk..kkkk."];
  const FRAME = [FANTASMA_A, FANTASMA_B];

  const MUCCHIO = `
...........kkkkkkkkkkkk.............
.......kkkkllllllllffffkkkk.........
.....kkllllllffffffffffFFFGkkk......
...kkllfffffffffffffffffffFFFGkk....
..kllfffffffffffffffffffFfffFFFGk...
.kllffffffffFFfffffffffffFfffFFFGk..
kllffffffffFGGFffffffffffFffffFFFGk.
kllffffffffFGGFffffffffffffffffFFFGk
kllffffffffffffffffffffffffffffFFFGk
kllffffffffffffffffffffffffffffFFFGk
.kFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFk.
..kkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkk..`.trim().split("\n");

  const SPIRITO = `
.......kkkkkk.......
.....kkwwwwwwkk.....
....kwllwwwwwwwk....
...kwllwwwwwwwwck...
...kwlwwwwwwwwwck...
..kwlwwwwwwwwwwwck..
..kwwwwwwwwwwwwwck..
k.kwwwwwwwwwwwwwck.k
wkkwwwwwwwwwwwwwckkw
kwwwwwwwwwwwwwwwwcck
.kkwwwwwwwwwwwwwckk.
..kwwwwwwwwwwwwwck..
..kwwwwwwwwwwwwcck..
...kwwwwwwwwwwcck...
...kcwwwwwwwwwcck...
....kcwwwwwwwcck....
.....kcwwwwwwck.....
......kccwwcck......
.......kkccck.......
.........kcck.......
..........kck.......
...........kk.......`.trim().split("\n");
  const COL_SPIRITO = { k: C.bordo, w: GEMME.acquamarina[2], l: C.bianco, c: C.acqua };
  const AUREOLA = `
..kkkkkk..
.kyyyyyyk.
kyokkkkoyk
.kyyyyyyk.
..kkkkkk..`.trim().split("\n");
  const CORNO = ["k..", "rk.", "rrk", "krk"];
  const CODA = ["kfffffffk", ".kfffffk.", "..kfffk..", "...kfk...", "....k...."];
  const PUNTO = `
...kkkkk...
.kkoooookk.
.kooyyyook.
koyyooyyook
kooooooyook
koooooyyook
kooooyyoook
koooooooOok
.kooooyoOk.
.kkOOOOOkk.
...kkkkk...`.trim().split("\n");

  function nuovaTela(w, h) {
    const t = document.createElement("canvas");
    t.width = w;
    t.height = h;
    const c = t.getContext("2d");
    c.imageSmoothingEnabled = false;
    return { t, c };
  }
  /** Lista dei pixel colorati di uno sprite del telo: [{ x, y, c }]. */
  function pixelTelo(i, righe) {
    const out = [];
    righe.forEach((riga, y) => {
      for (let x = 0; x < riga.length; x++) {
        const ch = riga[x];
        if (ch === ".") continue;
        out.push({ x, y, c: ch === "k" ? C.bordo : colorePixel(i, x, y, ch) });
      }
    });
    return out;
  }
  function pixelMucchio(i) {
    const out = [];
    MUCCHIO.forEach((riga, y) => {
      for (let x = 0; x < riga.length; x++) {
        const ch = riga[x];
        if (ch === ".") continue;
        out.push({ x, y, c: ch === "k" ? C.bordo : colorePixel(i, x - 2, y + 22, ch) });
      }
    });
    return out;
  }
  function inTela(w, h, pixel) {
    const { t, c } = nuovaTela(w, h);
    for (const p of pixel) rett(c, p.c, p.x, p.y, 1, 1);
    return t;
  }
  // Pre-disegno: teli (5×2 fotogrammi), sagome gialle e bianche (2 fotogrammi), mucchi.
  const TELI = [0, 1, 2, 3, 4].map((i) => FRAME.map((righe) => {
    const pix = pixelTelo(i, righe);
    return { pix, tela: inTela(32, 40, pix) };
  }));
  const SAGOME = FRAME.map((righe) => {
    const pix = pixelTelo(0, righe);
    return {
      giallo: inTela(32, 40, pix.map((p) => ({ ...p, c: C.giallo }))),
      bianco: inTela(32, 40, pix.map((p) => ({ ...p, c: C.bianco }))),
    };
  });
  const MUCCHI = [0, 1, 2, 3, 4].map((i) => { const pix = pixelMucchio(i); return { pix, tela: inTela(36, 12, pix) }; });

  // ───────────────────────── Fumetto della frase ─────────────────────────
  function aCapo(t, max = 34) {
    const righe = [];
    let r = "";
    for (const p of t.split(" ")) {
      if (!r) r = p;
      else if ((r + " " + p).length <= max) r += " " + p;
      else { righe.push(r); r = p; }
    }
    if (r) righe.push(r);
    return righe;
  }
  function geometriaFumetto(stato) {
    if (stato.parla === null) return null;
    const f = stato.frasi[stato.parla], cx = CX[stato.parla];
    const righe = aCapo(f.testo);
    const larg = Math.max(...righe.map((r) => larghezzaTesto(r)));
    const w = Math.max(40, larg + 12), h = 8 + righe.length * 10;
    const x = Math.max(6, Math.min(312 - w, cx - Math.floor(w / 2)));
    const y = 74 - h;
    const aiuto = f.tipo === "bugiardo" || f.tipo === "sincero" ? null : { x: x + w - 2, y: y - 1 };
    return { x, y, w, h, righe, cx, aiuto };
  }

  const NOME = ["A RIGHE", "A QUADRI", "A POIS", "RATTOPPATO", "BUCATO"];
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

  // ───────────────────────── Il gioco ─────────────────────────
  let statoCorrente = null; // per il getter del testo della carta
  let enigma = "";
  function testoCarta() {
    if (!statoCorrente) return undefined;
    const f = statoCorrente.frasi;
    return [
      enigma,
      "Se controlli con qualche cartellino sbagliato, i fantasmi ridacchiano ma non dicono quale. Al terzo sbaglio si stufano e cambiano tutte le frasi.",
      "Ecco cosa dicono:",
      `Telo a righe: «${f[0].testo}»`,
      `Telo a quadri: «${f[1].testo}»`,
      `Telo a pois: «${f[2].testo}»`,
      `Telo rattoppato: «${f[3].testo}»`,
      `Telo bucato: «${f[4].testo}»`,
    ].join("\n");
  }

  const opzioni = {
    id: "teli-che-mentono",
    sfondo: "deposito",
    velo: 0.5,
    get testo() { return testoCarta(); },
    variante(rng) { return { frasi: generaTeli(rng) }; },
    crea(g) {
      enigma = g.scheda.enigma;
      const frasiDelGiro = (giro) => (giro === 0 ? g.variante.frasi : generaTeli(EscapeDemo.casuale(semeGiro(g.seme, giro))));
      const giro0 = Math.floor(g.stato().errori / 3);
      let stato = {
        giro: giro0, frasi: frasiDelGiro(giro0), cartellini: [null, null, null, null, null], parla: 0, svelati: false,
      };
      const mem = g.memoria;
      if (mem && mem.giro === giro0 && Array.isArray(mem.cartellini) && mem.cartellini.length === 5 && mem.cartellini.every(valoreOk))
        stato.cartellini = [...mem.cartellini];
      if (g.giaRisolto) stato = { ...stato, cartellini: soluzioneDi(stato.frasi), parla: null, svelati: true };
      statoCorrente = stato;

      // Tempi degli effetti (ms di g.tempo).
      let tParla = 0;
      let tE = -1e9;            // ultimo errore
      let rimescolato = false;  // l'ultimo errore ha cambiato le frasi
      let vecchiCart = null;    // cartellini com'erano prima del rimescolamento (per il disegno)
      let tMancanti = -1e9;
      let tV = null;            // inizio vittoria
      const tGira = [-1e9, -1e9, -1e9, -1e9, -1e9];

      const salvaMemoria = () => {
        g.memoria = { giro: stato.giro, cartellini: [...stato.cartellini] };
        g.salvaMemoria();
      };

      function gioca(m) {
        const r = muovi(stato, m, g.stato().errori, frasiDelGiro);
        stato = r.st;
        statoCorrente = stato;
        switch (r.ev) {
          case "parla":
            tParla = g.tempo;
            break;
          case "cartellino": {
            tParla = g.tempo;
            tGira[r.telo] = g.tempo;
            const n = quanti(stato.cartellini);
            g.messaggio(n < 5 ? `Cartellini appesi: ${n} su 5.` : "Cartellini appesi: 5 su 5. Quando sei sicuro, premi Controlla.");
            salvaMemoria();
            break;
          }
          case "togli":
            g.messaggio("Cartellini tolti.");
            salvaMemoria();
            break;
          case "spiega":
            g.messaggio(r.testo);
            break;
          case "mancano":
            g.messaggio("Prima appendi un cartellino a ogni telo.");
            tMancanti = g.tempo;
            break;
          case "vittoria":
            tV = g.tempo;
            g.messaggio("Tutti giusti: i fantasmi si tolgono il telo!");
            g.risolto({ riepilogo: r.riepilogo, ritardo: 1800 });
            break;
          case "errore": {
            const prima = statoPrimaDellErrore;
            g.errore(r.esito.motivo);
            tE = g.tempo;
            rimescolato = r.rigenerato;
            if (r.rigenerato) {
              vecchiCart = prima;
              tParla = g.tempo;
              g.messaggio("I fantasmi si sono stufati: frasi nuove, cartellini da rifare.");
              salvaMemoria();
            } else {
              g.messaggio(r.n === 1
                ? "Risatine sotto i teli: qualcosa non va. Al terzo sbaglio cambiano frasi."
                : "Ancora risatine. Attento: al prossimo sbaglio cambiano tutte le frasi.");
            }
            break;
          }
        }
        return r.esito;
      }
      // I cartellini prima dell'errore servono al disegno del rimescolamento: li copio prima di muovere.
      let statoPrimaDellErrore = null;
      const giocaConCopia = (m) => {
        statoPrimaDellErrore = [...stato.cartellini];
        return gioca(m);
      };

      // Tocchi.
      g.tocca(({ tipo, x, y }) => {
        if (tipo !== "giu") return;
        const gf = geometriaFumetto(stato);
        if (gf && gf.aiuto && Math.abs(x - gf.aiuto.x) <= 9 && Math.abs(y - gf.aiuto.y) <= 9) { giocaConCopia({ tipo: "spiega" }); return; }
        for (let i = 0; i < 5; i++)
          if (Math.abs(x - CX[i]) <= 28 && y >= 121 && y <= 151) { giocaConCopia({ tipo: "gira", telo: i }); return; }
        for (let i = 0; i < 5; i++)
          if (Math.abs(x - CX[i]) <= 26 && y >= 79 && y <= 120) { giocaConCopia({ tipo: "parla", telo: i }); return; }
      });
      g.bottone("Togli tutti", () => giocaConCopia({ tipo: "togli" }), { id: "togli" });
      g.bottone("Controlla", () => giocaConCopia({ tipo: "controlla" }), { id: "controlla", forte: true });
      g.messaggio(g.giaRisolto ? "I fantasmi si sono già tolti il telo." : "Tocca un fantasma per sentirlo e il suo cartellino per cambiarlo.");

      // ── Disegno ──
      const riduci = g.riduciMovimento;
      const FOT = () => Math.max(0, g.fotogramma); // il primo fotogramma può avere tempo negativo
      const DY = [0, -1, -1, -1, 0, 1, 1, 1];
      const DYS = [0, -1, -1, -2, -2, -2, -1, -1];

      function cartello(ctx) {
        rett(ctx, C.pietra, 12, 16, 1, 4);
        rett(ctx, C.pietra, 64, 16, 1, 4);
        riquadro(ctx, 6, 19, 66, 13, C.legnoChiaro);
        rett(ctx, C.legnoLuce, 7, 20, 64, 1);
        rett(ctx, C.legno, 7, 30, 64, 1);
        if (stato.svelati) testo(ctx, "SVELATI!", 39, 22, { colore: C.acqua, allinea: "centro" });
        else {
          const n = g.stato().errori % 3;
          testo(ctx, `SBAGLI ${n}/3`, 39, 22, { colore: n === 0 ? C.pietraChiara : n === 1 ? C.giallo : C.tappetoChiaro, allinea: "centro" });
        }
      }
      function ombra(ctx, i) {
        for (let j = 0; j < 4; j++)
          for (let k = -16; k <= 16; k++) {
            if ((k / 16) ** 2 + ((j - 1.5) / 2) ** 2 > 1) continue;
            const px = CX[i] + k, py = 148 + j;
            if (BAYER[py & 3][px & 3] / 16 < 0.55) rett(ctx, C.nero, px, py, 1, 1);
          }
      }
      function cartellino(ctx, i, cx, dy, valore, bordo, largo) {
        const w = largo ? 54 : 26, h = 24;
        const x = cx - Math.floor(w / 2), y = 123 + dy;
        const col = valore === "sincero" ? [GEMME.smeraldo[2], GEMME.smeraldo[1], GEMME.smeraldo[0]]
          : valore === "bugiardo" ? [GEMME.rubino[2], C.tappetoChiaro, C.tappeto]
            : [C.bianco, C.pietraChiara, C.pietra];
        rett(ctx, bordo, x + 1, y, w - 2, h);
        rett(ctx, bordo, x, y + 1, w, h - 2);
        rett(ctx, col[1], x + 1, y + 1, w - 2, h - 2);
        rett(ctx, col[0], x + 1, y + 1, w - 2, 1);
        rett(ctx, col[0], x + 1, y + 1, 1, h - 2);
        rett(ctx, col[2], x + 1, y + h - 2, w - 2, 1);
        rett(ctx, col[2], x + w - 2, y + 1, 1, h - 2);
        if (!largo) return;
        rett(ctx, C.ferroChiaro, cx - 2, y + 1, 4, 4);
        rett(ctx, C.nero, cx - 1, y + 2, 2, 2);
        testo(ctx, NOME[i], cx, y + 6, { piccolo: true, colore: C.bordo, ombra: null, allinea: "centro" });
        if (valore === null) {
          for (let k = -14; k <= 14; k += 2) rett(ctx, C.pietra, cx + k, y + 19, 1, 1);
        } else {
          testo(ctx, valore === "sincero" ? "SINCERO" : "BUGIARDO", cx, y + 14, { colore: C.bianco, ombra: C.bordo, allinea: "centro" });
        }
      }
      function occhi(ctx, i, ox, oy, apertaPari) {
        rett(ctx, C.nero, ox + 10, oy + 11, 3, 4);
        rett(ctx, C.nero, ox + 19, oy + 11, 3, 4);
        const guarda = stato.parla === null || stato.parla === i ? 0 : Math.sign(CX[stato.parla] - CX[i]);
        const ciglia = !riduci && (FOT() + 7 * i) % 29 === 0;
        if (!ciglia) {
          rett(ctx, C.luna, ox + 11 + guarda, oy + 12, 1, 2);
          rett(ctx, C.luna, ox + 20 + guarda, oy + 12, 1, 2);
        }
        const parlando = !riduci && stato.parla === i && g.tempo - tParla < 1200;
        const aperta = !riduci && (parlando || apertaPari) && FOT() % 2 === 0;
        if (aperta) rett(ctx, C.nero, ox + 15, oy + 18, 2, 3);
        else rett(ctx, C.nero, ox + 15, oy + 19, 2, 1);
      }
      function spirito(ctx, i, oy, finale) {
        const ox = CX[i] - 10;
        const dyS = finale && !riduci ? DYS[(FOT() + 2 * i) % 8] : 0;
        const y = oy + dyS;
        sprite(ctx, SPIRITO, COL_SPIRITO, ox, y);
        rett(ctx, C.nero, ox + 6, y + 5, 2, 2);
        rett(ctx, C.nero, ox + 12, y + 5, 2, 2);
        if (stato.cartellini[i] === "sincero") {
          sprite(ctx, AUREOLA, { k: C.bordo, y: C.giallo, o: C.oro }, ox + 5, y - 7);
          if (!riduci && (FOT() + 3 * i) % 8 === 0) rett(ctx, C.bianco, ox + 7, y - 6, 1, 1);
          rett(ctx, C.bordo, ox + 7, y + 9, 1, 1);
          rett(ctx, C.bordo, ox + 12, y + 9, 1, 1);
          rett(ctx, C.bordo, ox + 8, y + 10, 4, 1);
        } else {
          const cornoCol = { k: C.bordo, r: C.tappetoChiaro };
          sprite(ctx, CORNO, cornoCol, ox + 3, y - 2);
          sprite(ctx, CORNO, cornoCol, ox + 14, y - 2, { specchia: true });
          rett(ctx, C.bordo, ox + 6, y + 4, 3, 1);
          rett(ctx, C.bordo, ox + 11, y + 4, 3, 1);
          rett(ctx, C.bordo, ox + 7, y + 9, 6, 1);
          if (riduci || ((FOT() >> 2) + i) % 2 === 0) {
            rett(ctx, C.rosa, ox + 10, y + 10, 2, 2);
            rett(ctx, C.bordo, ox + 10, y + 12, 2, 1);
          }
        }
      }
      function fumetto(ctx) {
        const gf = geometriaFumetto(stato);
        if (!gf) return;
        const { x, y, w, h } = gf;
        rett(ctx, C.bordo, x + 1, y, w - 2, h);
        rett(ctx, C.bordo, x, y + 1, w, h - 2);
        rett(ctx, C.pietraChiara, x + 1, y + 1, w - 2, h - 2);
        rett(ctx, C.bianco, x + 2, y + 1, w - 4, 1);
        rett(ctx, C.pietra, x + 2, y + h - 2, w - 4, 1);
        gf.righe.forEach((riga, n) => {
          const lw = larghezzaTesto(riga);
          const tx = Math.round(x + w / 2 - lw / 2), ty = y + 6 + 10 * n;
          testo(ctx, riga, tx, ty, { colore: C.bordo, ombra: null });
          for (let k = 0; k < riga.length; k++)
            if (riga[k] === "è") {
              rett(ctx, C.bordo, tx + 6 * k + 1, ty - 3, 1, 1);
              rett(ctx, C.bordo, tx + 6 * k + 2, ty - 2, 1, 1);
            }
        });
        sprite(ctx, CODA, { k: C.bordo, f: C.pietraChiara }, gf.cx - 4, 73);
        if (gf.aiuto) sprite(ctx, PUNTO, { k: C.bordo, o: C.oro, O: C.oroScuro, y: C.bianco }, gf.aiuto.x - 5, gf.aiuto.y - 5);
      }

      g.anima(() => {
        const ctx = g.ctx;
        ctx.clearRect(0, 0, g.larghezza, g.altezza);
        const dE = riduci ? 1e9 : g.tempo - tE;
        const dV = stato.svelati ? (riduci || tV === null ? 1e9 : g.tempo - tV) : -1;
        const rimesc = rimescolato && dE < 900;
        const cartVisti = rimescolato && dE < 500 && vecchiCart ? vecchiCart : stato.cartellini;

        cartello(ctx);
        for (let i = 0; i < 5; i++) ombra(ctx, i);

        for (let i = 0; i < 5; i++) {
          const dy = riduci ? 0 : DY[(FOT() + 3 * i) % 8];
          const sx = dE < 500 ? [1, -1, 1, -1][Math.floor(dE / 125)] : 0;
          const ox = CX[i] - 16 + sx;
          const oy = 80 + dy;
          const fr = riduci ? 0 : ((FOT() >> 1) + i) % 2;
          const p = stato.svelati ? clamp((dV - 300 - 150 * i) / 450, 0, 1) : 0;

          if (stato.svelati) {
            // mucchio, spirito, telo che si dissolve
            const m = MUCCHI[i];
            if (p >= 1) ctx.drawImage(m.tela, CX[i] - 18, 108);
            else if (p > 0)
              for (const q of m.pix) {
                const px = CX[i] - 18 + q.x, py = 108 + q.y;
                if (BAYER[py & 3][px & 3] / 16 < p) rett(ctx, q.c, px, py, 1, 1);
              }
            if (p > 0) spirito(ctx, i, p >= 1 ? 80 : 100 - Math.round(20 * p), p >= 1);
            if (p < 1) {
              const sy = oy + Math.round(6 * p);
              if (p <= 0) { ctx.drawImage(TELI[i][fr].tela, ox, sy); occhi(ctx, i, ox, sy, false); }
              else
                for (const q of TELI[i][fr].pix) {
                  const px = ox + q.x, py = sy + q.y;
                  if (BAYER[py & 3][px & 3] / 16 >= p) rett(ctx, q.c, px, py, 1, 1);
                }
            }
          } else {
            if (stato.parla === i) {
              const sg = SAGOME[fr].giallo;
              ctx.drawImage(sg, ox - 1, oy);
              ctx.drawImage(sg, ox + 1, oy);
              ctx.drawImage(sg, ox, oy - 1);
              ctx.drawImage(sg, ox, oy + 1);
            }
            const bianco = rimesc && dE >= 500 && Math.floor((dE - 500) / 100) % 2 === 0;
            ctx.drawImage(bianco ? SAGOME[fr].bianco : TELI[i][fr].tela, ox, oy);
            occhi(ctx, i, ox, oy, dE < 500);
          }

          // spago e cartellino
          const cdy = stato.svelati ? 0 : dy;
          const cx = CX[i] + (stato.svelati ? 0 : sx);
          rett(ctx, C.pietraChiara, cx, 120 + cdy, 1, 3);
          let bordo = C.bordo;
          if (dE < 500 && Math.floor(dE / 125) % 2 === 0) bordo = C.tappetoChiaro;
          else if (!riduci && g.tempo - tMancanti < 600 && cartVisti[i] === null && FOT() % 2 === 0) bordo = C.giallo;
          else if (dV >= 0 && dV < 375 && Math.floor(dV / 125) % 2 === 0) bordo = C.bianco;
          const squish = !riduci && g.tempo - tGira[i] < 150;
          cartellino(ctx, i, cx, cdy, cartVisti[i], bordo, !squish);
        }

        if (!rimesc && !stato.svelati) fumetto(ctx);

        // effetti sopra tutto
        if (dE < 900) {
          for (let i = 0; i < 5; i++)
            if ((i + Math.floor(dE / 250)) % 2 === 0)
              testo(ctx, "IH", CX[i] + 8, 76 - Math.floor(dE / 150), { piccolo: true, colore: C.lilla, ombra: C.bordo, allinea: "centro" });
        }
        if (rimesc && dE >= 500) {
          const r = Math.round((dE - 500) / 400 * 20);
          for (let i = 0; i < 5; i++)
            for (let n = 0; n < 8; n++) {
              const px = CX[i] + Math.round(Math.cos(n * Math.PI / 4) * r) - 1;
              const py = 100 + Math.round(Math.sin(n * Math.PI / 4) * r * 0.6) - 1;
              rett(ctx, n % 2 === 0 ? C.pietraChiara : C.pietra, px, py, 2, 2);
            }
        }
      });

      g.espone({
        gioca: (m) => giocaConCopia(m),
        statoGioco: () => ({
          giro: stato.giro,
          frasi: stato.frasi.map((f) => ({ ...f, chi: [...f.chi] })),
          cartellini: [...stato.cartellini],
          parla: stato.parla,
          sbagliNelGiro: g.stato().errori % 3,
          svelati: stato.svelati,
        }),
        posizioneTelo: (i) => ({ x: CX[i], y: 100 }),
        posizioneCartellino: (i) => ({ x: CX[i], y: 135 }),
        posizioneAiuto: () => { const gf = geometriaFumetto(stato); return gf && gf.aiuto ? { x: gf.aiuto.x, y: gf.aiuto.y } : null; },
      });
    },
  };
  EscapeDemo.avvia(opzioni);
})();
