// L'ascensore del privé: cinque scheletri e cinque zombie salgono al privé con una cabina da tre posti.
// Se in cabina o a un piano gli zombie sono più degli scheletri (e di scheletri ce n'è), gli rubano le ossa.
// Stanza provvisoria: il privé non è fra le stanze del locale, quindi niente sfondo (sfondo: null).

(function () {
  "use strict";
  const { C, intero, mescola } = EscapeDemo;
  const R = EscapeDemo.rett;
  const RQ = EscapeDemo.riquadro;
  const SP = EscapeDemo.sprite;
  const TX = EscapeDemo.testo;

  // ── Misure fisse ──
  const BASE = { sopra: 80, sotto: 146 };
  const SLOT_S = [114, 90, 66, 42, 18];
  const SLOT_Z = [206, 230, 254, 278, 302];
  const POSTI = [144, 160, 176];
  const cabY = (piano) => BASE[piano] - 38;

  // ── Variante ──
  const NUMERI_ATTIVI = [5];
  const MINIMO = { 4: 9, 5: 11 };
  const ACCESSORI = ["cilindro", "festa", "fiore", "papillon", "occhiali"];
  const CAMICIE = ["grigia", "viola", "arancio", "blu", "senape"];
  const NUMERO = { 4: "Quattro", 5: "Cinque" };
  const IN_PAROLE = { 8: "otto", 10: "dieci" };

  const MOTIVO = {
    cabina: "In cabina gli zombie sono di più: ossa rubate!",
    sotto: "Al piano terra gli zombie sono di più: ossa rubate!",
    sopra: "Al privé gli zombie sono di più: ossa rubate!",
  };

  // ── Sprite ──
  const M = { k: C.bordo, n: "#0c0812", w: "#e8e4f0", W: "#a9a4bc", z: "#7a9a6a", Z: "#4a6a44", p: "#4a3a26", P: "#2a1a12", r: C.tappeto };
  const SCHELETRO = [
    "....kkkkkk....", "...kwwwwwwk...", "..kwwwwwwWWk..", "..knnwwnnwWk..", "..knnwwnnwWk..", "..kwwwnwwwWk..",
    "...kwwwwwWk...", "...kwkwkwk....", "....kkkkk.....", ".....kwk......", "..kkwwwwwkk...", ".kwkwkwkwkwk..",
    ".kwwwwwwwwwk..", ".kWkwwwwwkWk..", "..kkwkwkwkk...", "....kwwwk.....", "...kwwwwwk....",
  ];
  const GAMBE_S = ["...kwk.kwk....", "...kwk.kwk....", "...kwk.kwk....", "...kwk.kwk....", "..kwwk.kwwk...", "..kkkk.kkkk..."];
  const ZOMBIE = [
    "......kkkkk.....", ".....kzzzZZk....", "....kzzrzZZZk...", "....kzzzzzZZk...", "...kwnzzzzZZk...", "...kzzzzzzZZk...",
    "...kkzzzzZZZk...", "....knnnzZZk....", "....kwkwzZZk....", ".....kkzZZkk....", "...kkcccccCCk...", "..kccccrcccCCk..",
    ".kzkcccccccCCk..", ".kzkcckccccCCk..", "kzzkccccccCCCk..", "kzZkkcccCcCCk...", "kzzk.kcCkCckk...", ".kk..kppppPPk...",
  ];
  const ZOMBIE_PALPEBRA = ZOMBIE.map((riga, i) => (i === 4 ? ZOMBIE[5] : riga));
  const GAMBE_Z = [
    ".....kppPkpPk...", ".....kppPkpPk...", ".....kpPPkPPk...", ".....kZzkkzZk...", "....kzZzk.kzZk..", "....kkkkk.kkkk..",
  ];
  const COLORI_CAMICIE = {
    grigia: ["#6a6a8a", "#45435f"],
    viola: [C.viola, C.violaScuro],
    arancio: [C.brace, C.legnoChiaro],
    blu: [C.notteChiara, C.notte],
    senape: [C.oroScuro, C.legno],
  };
  const SPRITE_ACCESSORI = {
    cilindro: { ax: 3, ay: -5, colori: { k: C.bordo, f: C.ferro, F: C.ferroChiaro, r: C.tappetoChiaro }, righe: ["..kkkk..", ".kfFFfk.", ".kfFFfk.", ".krrrrk.", "kkkkkkkk"] },
    festa: { ax: 5, ay: -7, colori: { k: C.bordo, y: C.giallo, a: C.acqua, b: C.rosa }, righe: ["..y..", "..k..", ".kak.", ".kbk.", "kaaak", "kbbbk", "kkkkk"] },
    fiore: { ax: 8, ay: -2, colori: { k: C.bordo, p: C.rosa, y: C.giallo }, righe: [".kpk.", "kpypk", ".kpk."] },
    papillon: { ax: 3, ay: 9, colori: { k: C.bordo, r: C.tappetoChiaro }, righe: ["kk...kk", "krrkrrk", "kk...kk"] },
    occhiali: { ax: 2, ay: 3, colori: { k: C.bordo, n: C.violaScuro, g: C.lilla }, righe: ["kgnkkgnk", ".nn..nn."] },
  };
  const PALLA = [
    "....kkkk....", "..kkSsSskk..", ".kssSsSsSSk.", ".ksSsSsSsSk.", "kSsSsSsSsSSk", "ksSsSsSsSsSk",
    "kSsSsSsSsSfk", "ksSsSsSsSfSk", ".kSsSsSsfSk.", ".kSSsSsSfSk.", "..kkSfSfkk..", "....kkkk....",
  ];
  const PULEGGIA = [
    [
      "....kkkk....", "..kkFFFFkk..", ".kFFkkkkFfk.", ".kFk.kk.kfk.", "kFk..kk..kfk", "kFkkkppkkkfk",
      "kFkkkppkkkfk", "kFk..kk..kfk", ".kfk.kk.kfk.", ".kffkkkkffk.", "..kkffffkk..", "....kkkk....",
    ],
    [
      "....kkkk....", "..kkFFFFkk..", ".kFFkkkkFfk.", ".kFk....kfk.", "kFk.k..k.kfk", "kFk..pp..kfk",
      "kFk..pp..kfk", "kFk.k..k.kfk", ".kfk....kfk.", ".kffkkkkffk.", "..kkffffkk..", "....kkkk....",
    ],
  ];
  const TORCIA = ["kkkkk", "kFffk", ".kfk.", ".klk.", ".klk.", ".kLk.", "kkFkk", "kFfFk", ".kfk.", "..k.."];
  const FIAMME = [
    ["..o..", "..y..", ".oyo.", ".yYy.", "oyYyo", "oYwYo", ".oyo."],
    ["...o.", "..yo.", ".oy..", ".yYyo", "oyYyo", "oYwYo", ".oyo."],
    [".o...", ".oy..", "..yo.", ".yYy.", "oyYYo", "oYwYo", ".oyo."],
  ];
  const FRECCIA = ["..#..", ".###.", "#####", "..#..", "..#.."];
  const RAGNATELA = [
    "##########", ".#...#..##", "..#..#.#.#", "..##.###.#", "...#.#.###", "....##..##", ".....#.#.#", "......##.#", ".......###", "........##",
  ];
  const MUCCHIO = [
    ".....kkkkk......", "....kwwwwwk.....", "...kwnnwnnWk....", "...kwwwnwwWk....", "..kkkwkwkWkk.kk.",
    ".kwwkkkkkkkwkwwk", "kwwwwwwwwwwwwWWk", ".kwWkkkkkkkkWWk.", "..kk........kk..",
  ];
  const OSSO = [".kk...kk.", "kwwk.kwwk", ".kwwwwwk.", "kwWk.kWWk", ".kk...kk."];
  const TRALICCIO = ["#.....", "##...#", "#.#.#.", "#..#..", "#.#.#.", "##...#"];

  const hash = (x, y) => { const n = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453; return n - Math.floor(n); };
  const limita = (v, a, b) => Math.max(a, Math.min(b, v));
  const e3 = (t) => { t = limita(t, 0, 1); return 3 * t * t - 2 * t * t * t; };
  const lerp = (a, b, f) => Math.round(a + (b - a) * f);

  // ══════════════ Logica pura: stato + mossa → nuovo stato ed esito ══════════════

  const idsDi = (v) => {
    const r = [];
    for (let i = 0; i < v.scheletri; i++) r.push("s" + i);
    for (let i = 0; i < v.zombie; i++) r.push("z" + i);
    return r;
  };
  const copia = (st) => JSON.parse(JSON.stringify(st));
  function statoIniziale(v) {
    const dove = {};
    for (const id of idsDi(v)) dove[id] = "sotto";
    return { piano: "sotto", dove, aBordo: [], posti: {}, corse: 0, risolto: false };
  }
  function conta(st, posto) {
    const c = { s: 0, z: 0 };
    for (const id of Object.keys(st.dove)) if (st.dove[id] === posto) c[id[0]]++;
    return c;
  }
  const inRegola = (c) => c.s === 0 || c.z <= c.s;

  function sali(st, v, id) {
    if (!(id in st.dove)) return { stato: st, esito: { valida: false, motivo: "nessuno" } };
    if (st.dove[id] === "cabina") return { stato: st, esito: { valida: false, motivo: "a bordo" } };
    if (st.dove[id] !== st.piano) return { stato: st, esito: { valida: false, motivo: "altro piano" } };
    if (st.aBordo.length >= v.capienza) return { stato: st, esito: { valida: false, motivo: "piena" } };
    const n = copia(st);
    const usati = new Set(Object.values(n.posti));
    let posto;
    if (id[0] === "s") { posto = 0; while (usati.has(posto)) posto++; }
    else { posto = v.capienza - 1; while (usati.has(posto)) posto--; }
    n.dove[id] = "cabina";
    n.aBordo.push(id);
    n.posti[id] = posto;
    return { stato: n, esito: { ok: true, cabina: conta(n, "cabina") } };
  }
  function scendi(st, id) {
    if (!(id in st.dove)) return { stato: st, esito: { valida: false, motivo: "nessuno" } };
    if (st.dove[id] !== "cabina") return { stato: st, esito: { valida: false, motivo: "non a bordo" } };
    const n = copia(st);
    n.dove[id] = n.piano;
    n.aBordo = n.aBordo.filter((x) => x !== id);
    delete n.posti[id];
    return { stato: n, esito: { ok: true, cabina: conta(n, "cabina") } };
  }
  function parti(st, v) {
    if (st.aBordo.length === 0) return { stato: st, esito: { valida: false, motivo: "vuota" } };
    const da = st.piano, a = da === "sotto" ? "sopra" : "sotto";
    const cab = conta(st, "cabina"), fp = conta(st, da), fa0 = conta(st, a);
    const fa = { s: fa0.s + cab.s, z: fa0.z + cab.z };
    const dove = !inRegola(cab) ? "cabina" : !inRegola(fp) ? da : !inRegola(fa) ? a : null;
    if (dove) return { stato: st, esito: { errore: true, dove, motivo: MOTIVO[dove] } };
    const n = copia(st);
    for (const id of n.aBordo) n.dove[id] = a;
    n.aBordo = []; n.posti = {}; n.piano = a; n.corse += 1;
    const tutti = conta(n, "sopra");
    if (tutti.s === v.scheletri && tutti.z === v.zombie) {
      n.risolto = true;
      return { stato: n, esito: { risolto: true, corse: n.corse } };
    }
    return { stato: n, esito: { ok: true, corse: n.corse, piano: a } };
  }

  const carico = (s, z) => {
    const parti_ = [];
    if (s > 0) parti_.push(s === 1 ? "1 scheletro" : `${s} scheletri`);
    if (z > 0) parti_.push(`${z} zombie`);
    return parti_.join(" e ");
  };

  // ══════════════ La demo ══════════════

  const opzioni = {
    id: "ascensore-prive",
    sfondo: null,
    tinta: C.violaScuro,
    velo: 0.5,

    variante(rng) {
      const n = NUMERI_ATTIVI[Math.floor(rng() * NUMERI_ATTIVI.length)];
      return {
        scheletri: n,
        zombie: n,
        capienza: 3,
        minimo: MINIMO[n],
        accessori: mescola(rng, ACCESSORI).slice(0, n),
        camicie: mescola(rng, CAMICIE).slice(0, n),
      };
    },

    crea(g) {
      const v = g.variante;
      const n = v.scheletri;
      opzioni.testo =
        `${NUMERO[n]} scheletri e ${NUMERO[n].toLowerCase()} zombie devono salire al privé. ` +
        "L'ascensore porta al massimo tre persone e non si muove vuoto. Se a un piano o in cabina gli zombie sono " +
        "più degli scheletri, gli rubano le ossa (va bene solo se lì di scheletri non ce ne sono).\n" +
        "A ogni arrivo scendono tutti. Si controlla dopo ogni corsa: la cabina e tutti e due i piani.";

      const ids = idsDi(v);
      const ridu = g.riduciMovimento;
      let st = statoIniziale(v);
      if (g.giaRisolto) {
        for (const id of ids) st.dove[id] = "sopra";
        st.piano = "sopra";
        st.corse = g.memoria.corse ?? v.minimo;
        st.risolto = true;
      }
      let anim = null; // animazione di corsa o di errore in corso
      let slide = []; // scivolate di salita e discesa dalla cabina
      let scuote = null; // { id, t0 }
      let targaRossaFino = 0;

      const slotX = (id) => (id[0] === "s" ? SLOT_S : SLOT_Z)[+id.slice(1)];

      // ── Azioni (logica + messaggi + animazioni), usate da tocchi, bottoni e gioca ──
      const occupato = () => anim !== null;

      function rifiuto(esito, id) {
        const m = esito.motivo;
        if (m === "piena") {
          targaRossaFino = g.tempo + 375;
          scuote = { id, t0: g.tempo };
          g.messaggio("In cabina ci stanno al massimo tre mostri.");
        } else if (m === "vuota") {
          targaRossaFino = g.tempo + 375;
          g.messaggio("L'ascensore non parte vuoto.");
        } else if (m === "altro piano") {
          scuote = { id, t0: g.tempo };
          g.messaggio(st.piano === "sopra" ? "La cabina è al privé." : "La cabina è al piano terra.");
        }
        return esito;
      }
      function messaggioCabina() {
        const c = conta(st, "cabina");
        g.messaggio(c.s + c.z === 0 ? "Cabina vuota: tocca i mostri per farli salire." : `In cabina: ${carico(c.s, c.z)}.`);
      }
      function avviaScivolata(id, da, a) {
        slide = slide.filter((s) => s.id !== id);
        if (!ridu) slide.push({ id, da, a, t0: g.tempo, dur: 180 });
      }
      function azSali(id) {
        const r = sali(st, v, id);
        if (r.esito.valida === false) return rifiuto(r.esito, id);
        anim = null;
        st = r.stato;
        avviaScivolata(id, { x: slotX(id), base: BASE[st.piano] }, { x: POSTI[st.posti[id]], base: BASE[st.piano] });
        messaggioCabina();
        return r.esito;
      }
      function azScendi(id) {
        const r = scendi(st, id);
        if (r.esito.valida === false) return rifiuto(r.esito, id);
        anim = null;
        const posto = st.posti[id];
        st = r.stato;
        avviaScivolata(id, { x: POSTI[posto], base: BASE[st.piano] }, { x: slotX(id), base: BASE[st.piano] });
        messaggioCabina();
        return r.esito;
      }
      function azParti() {
        const r = parti(st, v);
        const e = r.esito;
        if (e.valida === false) return rifiuto(e);
        const da = st.piano, a = da === "sotto" ? "sopra" : "sotto";
        const pass = st.aBordo.map((id) => ({ id, posto: st.posti[id] }));
        const cab = conta(st, "cabina");
        slide = [];
        if (e.errore) {
          anim = ridu
            ? { tipo: "errore", ridu: true, t0: g.tempo, dur: 750, da, a, dove: e.dove, pass }
            : { tipo: "errore", t0: g.tempo, dur: 1930, da, a, dove: e.dove, pass };
          g.errore(e.motivo);
          g.messaggio("La cabina torna indietro, passeggeri a bordo.");
          return e;
        }
        st = r.stato;
        anim = ridu ? null : { tipo: "corsa", t0: g.tempo, dur: 810, da, a, pass };
        if (e.risolto) {
          g.messaggio("Tutti al privé! Si balla.");
          g.memoria.corse = st.corse;
          g.salvaMemoria();
          const tot = IN_PAROLE[v.scheletri + v.zombie];
          const riepilogo = st.corse === v.minimo
            ? `Tutti e ${tot} al privé in ${st.corse} corse: meno di così non si può.`
            : `Tutti e ${tot} al privé in ${st.corse} corse. Si poteva fare in ${v.minimo}.`;
          g.risolto({ riepilogo, ritardo: 1600 });
          return e;
        }
        const tot = cab.s + cab.z;
        const verbo = da === "sotto" ? (tot > 1 ? "saliti" : "salito") : (tot > 1 ? "scesi" : "sceso");
        g.messaggio(`Corsa ${st.corse}: ${verbo} ${carico(cab.s, cab.z)}.`);
        return e;
      }
      function azRicomincia() {
        st = statoIniziale(v);
        anim = null;
        slide = [];
        g.messaggio("Tutti di nuovo al piano terra.");
        return { ok: true };
      }

      // ── Tocchi ──
      function bersaglio(x, y) {
        const bc = BASE[st.piano];
        for (const id of st.aBordo) {
          const cx = POSTI[st.posti[id]];
          if (x >= cx - 8 && x <= cx + 7 && y >= bc - 28 && y <= bc + 3) return { tipo: "scendi", id };
        }
        for (const id of ids) {
          const p = st.dove[id];
          if (p === "cabina") continue;
          const cx = slotX(id);
          if (Math.abs(x - cx) <= 11 && y >= BASE[p] - 28 && y <= BASE[p] + 3) {
            return { tipo: p === st.piano ? "sali" : "altro", id };
          }
        }
        return null;
      }
      g.tocca(({ tipo, x, y }) => {
        const b = bersaglio(x, y);
        if (tipo === "muovi") { g.scena.style.cursor = b && !occupato() ? "pointer" : ""; return; }
        if (tipo !== "giu" || occupato() || !b) return;
        if (b.tipo === "scendi") azScendi(b.id);
        else if (b.tipo === "sali") azSali(b.id);
        else rifiuto({ valida: false, motivo: "altro piano" }, b.id);
      });
      g.bottone("Parti", () => { if (!occupato()) azParti(); }, { id: "parti", forte: true });
      g.bottone("Ricomincia", azRicomincia, { id: "ricomincia" });
      g.messaggio(g.giaRisolto ? "Tutti al privé: la festa è già cominciata." : "Tocca i mostri per farli salire, poi premi Parti.");

      // ══════════════ Grafica: livello fisso ══════════════
      const ctx = g.ctx;
      (function disegnaFisso() {
        const rett = (c, x, y, w, h) => R(ctx, c, x, y, w, h);
        const riquadro = (x, y, w, h, fondo, bordo) => RQ(ctx, x, y, w, h, fondo, bordo);
        const sprite = (r, c, x, y, o) => SP(ctx, r, c, x, y, o);
        const testo = (s, x, y, o) => TX(ctx, s, x, y, o);

        rett(C.nero, 0, 0, 320, 180);
        // il privé: velluto a righe
        rett(C.muro, 0, 16, 320, 64);
        for (let x = 0; x < 320; x += 8) { rett(C.muroCasa, x + 2, 20, 3, 42); rett(C.violaScuro, x + 3, 20, 1, 42); }
        rett(C.legnoScuro, 0, 16, 320, 2); rett(C.oroScuro, 0, 18, 320, 1); rett(C.bordo, 0, 19, 320, 1);
        // boiserie
        rett(C.bordo, 0, 61, 320, 1); rett(C.legnoChiaro, 0, 62, 320, 1); rett(C.legno, 0, 63, 320, 17);
        for (let x = 2; x < 320; x += 20) {
          riquadro(x, 65, 17, 13, C.legno, C.legnoScuro);
          rett(C.legnoChiaro, x + 1, 66, 15, 1); rett(C.legnoChiaro, x + 1, 66, 1, 11);
        }
        // tappeto
        rett(C.tappetoChiaro, 0, 80, 320, 1); rett(C.tappeto, 0, 81, 320, 3); rett(C.bordo, 0, 84, 320, 1);
        // solaio
        rett(C.tetto, 0, 85, 320, 5);
        for (let x = 3; x < 320; x += 12) { riquadro(x, 85, 7, 5, C.legno); rett(C.legnoChiaro, x + 1, 86, 5, 1); }
        rett(C.bordo, 0, 90, 320, 1);
        // piano terra: mattoni
        rett(C.muro, 0, 91, 320, 55);
        for (let r = 0; 91 + r * 5 < 143; r++) {
          const y = 91 + r * 5;
          for (let x = (r % 2) * -5; x < 320; x += 10) {
            const caldo = hash(x, y) < 0.18;
            rett(caldo ? C.muroCaldo : C.mattone, x + 1, y + 1, 9, 4);
            rett(caldo ? C.muroAcceso : C.muroCasa, x + 1, y + 1, 9, 1);
          }
        }
        rett(C.bordo, 0, 142, 320, 1); rett(C.tetto, 0, 143, 320, 3);
        rett(C.ferroChiaro, 0, 146, 320, 1);
        for (let y = 147; y < 180; y += 3)
          for (let x = 0; x < 320; x += 8) rett(((x / 8 + (y - 147) / 3) % 2) ? C.pavimento : C.pavimento2, x, y, 8, 3);
        // alone delle torce
        for (const tx of [8, 311])
          for (let y = 88; y <= 120; y++) for (let x = tx - 16; x <= tx + 16; x++) {
            const d = Math.hypot(x - tx, y - 104);
            if (d <= 16 && EscapeDemo.BAYER[y & 3][x & 3] / 16 < 0.55 * (1 - d / 16)) rett(C.muroAcceso, x, y, 1, 1);
          }
        // il vano
        rett(C.tetto, 132, 16, 56, 140);
        for (let r = 0; r < 24; r++) {
          const y = 16 + r * 6;
          for (let x = 132 + (r % 2) * 4; x < 188; x += 8) rett(C.tettoChiaro, x, y, 7, 1);
        }
        rett(C.ferro, 136, 20, 2, 136); rett(C.ferroChiaro, 136, 20, 1, 136);
        rett(C.ferro, 182, 20, 2, 136); rett(C.ferroChiaro, 182, 20, 1, 136);
        rett(C.ferro, 132, 16, 56, 2); rett(C.bordo, 132, 18, 56, 1);
        // pilastri di ferro
        for (const px of [124, 188]) {
          rett(C.ferro, px, 16, 8, 140); rett(C.ferroChiaro, px, 16, 1, 140); rett(C.bordo, px + 7, 16, 1, 140);
          for (let y = 22; y < 154; y += 8) {
            rett(C.pietra, px + 2, y, 1, 1); rett(C.pietra, px + 5, y, 1, 1);
            rett(C.bordo, px + 2, y + 1, 1, 1); rett(C.bordo, px + 5, y + 1, 1, 1);
          }
        }
        for (const y of [64, 128]) {
          riquadro(125, y, 6, 9, C.oroScuro); rett(C.oro, 126, y + 1, 4, 1);
          rett(C.tappetoChiaro, 127, y + 2, 2, 2); rett(C.ferroChiaro, 127, y + 5, 2, 2);
        }
        // decorazioni
        rett(C.ferroChiaro, 92, 16, 1, 4);
        sprite(PALLA, { k: C.bordo, s: C.pietraChiara, S: C.pietra, f: C.ferroChiaro }, 86, 20);
        riquadro(223, 20, 68, 21, C.tetto); rett(C.tettoChiaro, 224, 21, 66, 1);
        for (const [vx, vy] of [[225, 22], [288, 22], [225, 38], [288, 38]]) rett(C.ferroChiaro, vx, vy, 1, 1);
        riquadro(34, 95, 49, 9, C.legno); rett(C.legnoChiaro, 35, 96, 47, 1);
        testo("PIANO TERRA", 58, 97, { piccolo: true, colore: C.pietraChiara, ombra: C.legnoScuro, allinea: "centro" });
        riquadro(244, 95, 37, 9, C.legno); rett(C.legnoChiaro, 245, 96, 35, 1);
        sprite(FRECCIA, { "#": C.oro }, 248, 97);
        testo("PRIVE", 256, 97, { piccolo: true, colore: C.pietraChiara, ombra: C.legnoScuro });
        sprite(RAGNATELA, { "#": C.pietra }, 114, 91);
        sprite(RAGNATELA, { "#": C.pietra }, 196, 91, { specchia: true });
        for (const tx of [6, 309]) sprite(TORCIA, { k: C.bordo, f: C.ferro, F: C.ferroChiaro, l: C.legno, L: C.legnoChiaro }, tx, 108);
      })();

      // il cancelletto chiuso, disegnato una volta su una tela fuori schermo 56×38
      const cancello = document.createElement("canvas");
      cancello.width = 56; cancello.height = 38;
      (function () {
        const c2 = cancello.getContext("2d");
        c2.imageSmoothingEnabled = false;
        R(c2, C.ferroChiaro, 0, 0, 56, 1); R(c2, C.ferro, 0, 1, 56, 1);
        R(c2, C.ferroChiaro, 0, 36, 56, 1); R(c2, C.ferro, 0, 37, 56, 1);
        for (let j = 2; j < 36; j++)
          for (let x = 0; x < 56; x++)
            if (TRALICCIO[(j - 2) % 6][x % 6] === "#") R(c2, x % 6 === 0 ? C.ferroChiaro : C.ferro, x, j, 1, 1);
      })();

      // ══════════════ Grafica: livello vivo ══════════════
      const vivo = g.nuovaTela();

      const passo = (u) => Math.min(3, Math.floor(Math.max(0, u) / 40));
      const chiudi = (u) => [3, 10, 19, 28][passo(u)];
      const apri = (u) => [28, 19, 10, 3][passo(u)];

      // un tratto di viaggio (590 ms) da `da` ad `a`
      function tratto(da, a, u) {
        const gate = {}, lit = {};
        gate[da] = chiudi(u);
        gate[a] = u < 470 ? 28 : apri(u - 470);
        lit[da] = u < 120;
        lit[a] = u >= 470;
        const f = e3((u - 120) / 350);
        return { y0: lerp(cabY(da), cabY(a), f), gate, lit, rota: u >= 120 && u < 470, pass: [], rap: null };
      }
      function ferma() {
        const gate = { sopra: 28, sotto: 28 }, lit = {};
        gate[st.piano] = 3;
        lit[st.piano] = true;
        return { y0: cabY(st.piano), gate, lit, rota: false, pass: [], rap: null };
      }
      // La vista di questo istante: posizione della cabina, cancelletti, passeggeri disegnati dall'animazione.
      function vista(now) {
        if (!anim) return ferma();
        const t = now - anim.t0;
        const { da, a } = anim;
        let vv;
        if (anim.tipo === "corsa") {
          vv = tratto(da, a, Math.min(t, 590));
          for (const p of anim.pass) {
            if (t < 590) vv.pass.push({ id: p.id, cx: POSTI[p.posto], base: vv.y0 + 38, strato: 8 });
            else {
              const f = e3((t - 590) / 220);
              vv.pass.push({ id: p.id, cx: lerp(POSTI[p.posto], slotX(p.id), f), base: BASE[a], strato: 9 });
            }
          }
          return vv;
        }
        // errore
        if (anim.ridu) {
          vv = ferma();
          vv.gate[da] = 3; vv.gate[a] = 28;
          vv.rap = { dove: anim.dove, tr: 0, fisso: true };
        } else if (t < 590) vv = tratto(da, a, t);
        else if (t < 1340) {
          vv = { y0: cabY(a), gate: { [da]: 28, [a]: 3 }, lit: { [a]: true }, rota: false, pass: [], rap: { dove: anim.dove, tr: t - 590 } };
        } else vv = tratto(a, da, Math.min(t - 1340, 590));
        for (const p of anim.pass) vv.pass.push({ id: p.id, cx: POSTI[p.posto], base: vv.y0 + 38, strato: 8 });
        return vv;
      }

      // chi sta nel posto dell'errore: scheletri (diventano mucchi) e zombie (esultano)
      function postoRapina(vv) {
        const res = { s: [], z: [] };
        const dove = anim.dove;
        const aggiungi = (id, cx, base) => res[id[0]].push({ id, cx, base });
        if (dove === "cabina" || dove === anim.a) for (const p of anim.pass) aggiungi(p.id, POSTI[p.posto], vv.y0 + 38);
        if (dove !== "cabina") for (const id of ids) if (st.dove[id] === dove) aggiungi(id, slotX(id), BASE[dove]);
        return res;
      }

      function disegnaMostro(id, cx, base, { dx = 0, alza = 0 } = {}) {
        const zombie = id[0] === "z";
        const i = +id.slice(1);
        const k = ridu ? 0 : Math.max(0, g.fotogramma);
        let dy = 0, mx = 0, palpebra = false;
        if (!ridu) {
          const fase = (k + 5 * i + (zombie ? 3 : 0)) % 24;
          dy = Math.floor(fase / 6) % 2;
          if (zombie && Math.floor(fase / 4) % 3 === 1) mx = -1;
          palpebra = zombie && fase === 0;
        }
        mx += dx;
        base -= alza;
        const w = zombie ? 16 : 14;
        const x = Math.round(cx - w / 2);
        const righe = zombie ? (palpebra ? ZOMBIE_PALPEBRA : ZOMBIE) : SCHELETRO;
        let colori = M;
        if (zombie) {
          const cam = COLORI_CAMICIE[v.camicie[i]] || COLORI_CAMICIE.grigia;
          colori = { ...M, c: cam[0], C: cam[1] };
        }
        SP(vivo, zombie ? GAMBE_Z : GAMBE_S, colori, x, base - 6, { specchia: !zombie });
        const bx = x + (zombie ? mx : -mx);
        const cima = base - 6 - righe.length + dy;
        SP(vivo, righe, colori, bx, cima, { specchia: !zombie });
        if (!zombie) {
          const acc = SPRITE_ACCESSORI[v.accessori[i]];
          if (acc) SP(vivo, acc.righe, acc.colori, bx + (14 - acc.ax - acc.righe[0].length), cima + acc.ay, { specchia: true });
        }
      }

      function disegnaCancello(piano, w) {
        const y = cabY(piano);
        if (w <= 3) {
          for (const x of [132, 134, 185, 187]) R(vivo, C.ferroChiaro, x, y, 1, 38);
          for (const x of [133, 186]) R(vivo, C.ferro, x, y, 1, 38);
        } else if (w >= 28) {
          vivo.drawImage(cancello, 132, y);
        } else {
          vivo.drawImage(cancello, 0, 0, w, 38, 132, y, w, 38);
          vivo.drawImage(cancello, 56 - w, 0, w, 38, 188 - w, y, w, 38);
        }
      }

      function trave(y, acceso, lettera) {
        RQ(vivo, 124, y, 72, 9, C.legno);
        R(vivo, C.legnoLuce, 125, y + 1, 70, 1); R(vivo, C.oroScuro, 125, y + 7, 70, 1);
        RQ(vivo, 154, y + 1, 13, 7, acceso ? C.giallo : C.ferro);
        TX(vivo, lettera, 160, y + 2, { piccolo: true, colore: acceso ? C.brace : C.ferroChiaro, ombra: null, allinea: "centro" });
      }

      function disegnaCabina(y0, rossa) {
        RQ(vivo, 154, y0 - 3, 12, 3, C.ferro);
        R(vivo, C.bordo, 133, y0, 54, 1); R(vivo, C.oro, 134, y0 + 1, 52, 1);
        R(vivo, C.oroScuro, 134, y0 + 2, 52, 1); R(vivo, C.bordo, 133, y0 + 3, 54, 1);
        R(vivo, C.bordo, 133, y0 + 4, 1, 34); R(vivo, C.oro, 134, y0 + 4, 1, 34); R(vivo, C.oroScuro, 135, y0 + 4, 1, 34);
        R(vivo, C.oroScuro, 184, y0 + 4, 1, 34); R(vivo, C.oroScuro, 185, y0 + 4, 1, 34); R(vivo, C.bordo, 186, y0 + 4, 1, 34);
        R(vivo, C.legno, 136, y0 + 4, 48, 34);
        EscapeDemo.retino(vivo, C.legno, C.legnoChiaro, 136, y0 + 4, 48, 12, 0.5);
        for (let x = 143; x < 184; x += 8) R(vivo, C.legnoScuro, x, y0 + 4, 1, 34);
        R(vivo, C.legnoLuce, 136, y0 + 4, 48, 1);
        RQ(vivo, 150, y0 + 5, 21, 7, C.legnoScuro);
        TX(vivo, "MAX 3", 160, y0 + 6, { piccolo: true, colore: rossa ? C.tappetoChiaro : C.oro, ombra: null, allinea: "centro" });
        R(vivo, C.oro, 133, y0 + 38, 54, 1); R(vivo, C.legnoScuro, 133, y0 + 39, 54, 2); R(vivo, C.bordo, 133, y0 + 41, 54, 1);
      }

      function contorno(x1, y1, x2, y2) {
        const w = x2 - x1 + 1, h = y2 - y1 + 1;
        R(vivo, C.tappetoChiaro, x1, y1, w, 2); R(vivo, C.tappetoChiaro, x1, y2 - 1, w, 2);
        R(vivo, C.tappetoChiaro, x1, y1, 2, h); R(vivo, C.tappetoChiaro, x2 - 1, y1, 2, h);
      }

      g.anima((now) => {
        // le animazioni finite
        if (anim && now - anim.t0 >= anim.dur) anim = null;
        slide = slide.filter((s) => now - s.t0 < s.dur);
        const festa = st.risolto && !anim;
        const k = ridu ? 0 : Math.max(0, g.fotogramma);
        const vv = vista(now);
        vivo.clearRect(0, 0, 320, 180);

        // 1. luci della festa
        if (festa) {
          for (let j = 0; j < 16; j++) {
            const x = 6 + ((j * 37 + k * 2) % 300);
            const y = 22 + ((j * 11) % 38);
            if (x >= 120 && x <= 199) continue;
            if (x >= 220 && x <= 292 && y >= 18 && y <= 42) continue;
            if (x >= 3 && x <= 62 && y >= 20 && y <= 36) continue;
            R(vivo, [C.giallo, C.acqua, C.rosa, C.lilla][(j + Math.floor(k / 4)) % 4], x, y, 2, 2);
          }
        }
        // 2. insegna al neon
        for (let j = 0; j < 5; j++) {
          const spenta = j === 3 && !festa && !ridu && [0, 1, 5].includes(k % 37);
          TX(vivo, "PRIVE"[j], 229 + 12 * j, 23, spenta ? { scala: 2, colore: C.muroAcceso, ombra: null } : { scala: 2, colore: C.rosa, ombra: C.tappeto });
        }
        // 3. luccichio della palla
        {
          const [lx, ly] = [[89, 23], [94, 22], [95, 27], [90, 28]][Math.floor(k / 2) % 4];
          R(vivo, C.bianco, lx, ly - 1, 1, 3); R(vivo, C.bianco, lx - 1, ly, 3, 1);
        }
        // 4. fiamme delle torce
        const colF = { o: C.brace, y: C.fiamma, Y: C.fiammaChiara, w: C.luna };
        SP(vivo, FIAMME[[0, 1, 0, 2][k % 4]], colF, 6, 101);
        SP(vivo, FIAMME[[0, 1, 0, 2][(k + 2) % 4]], colF, 309, 101);
        // 5. targa CORSE
        RQ(vivo, 6, 22, 55, 13, C.legnoScuro);
        R(vivo, C.oroScuro, 7, 23, 53, 1);
        TX(vivo, "CORSE " + st.corse, 33, 25, { colore: C.oro, ombra: C.bordo, allinea: "centro" });
        // 6. puleggia
        SP(vivo, PULEGGIA[vv.rota ? Math.floor(now / 60) % 2 : 0], { k: C.bordo, F: C.ferroChiaro, f: C.ferro, p: C.pietra }, 154, 19);
        // 7. cavi
        R(vivo, C.ferroChiaro, 157, 30, 1, vv.y0 - 33);
        R(vivo, C.ferroChiaro, 162, 30, 1, vv.y0 - 33);

        // 8. cabina e passeggeri
        const rapina = vv.rap ? postoRapina(vv) : null;
        const mucchi = new Set(rapina ? rapina.s.map((m) => m.id) : []);
        disegnaCabina(vv.y0, now < targaRossaFino);
        const scossa = (id) => {
          if (!scuote || scuote.id !== id) return 0;
          const i = Math.floor((now - scuote.t0) / 60);
          return i >= 0 && i < 4 ? [-1, 1, -1, 1][i] : 0;
        };
        const inSlide = new Map(slide.map((s) => [s.id, s]));
        const dinamici = new Set(vv.pass.map((p) => p.id));
        const alzaDi = (id) => {
          if (rapina && !mucchi.has(id) && rapina.z.some((m) => m.id === id) && !vv.rap.fisso && !ridu) return (k + (+id.slice(1))) % 2 === 0 ? 1 : 0;
          return 0;
        };
        const mucchio = (cx, base) => SP(vivo, MUCCHIO, M, cx - 8, base - 9);
        for (const p of vv.pass) {
          if (p.strato !== 8) continue;
          if (mucchi.has(p.id)) mucchio(p.cx, p.base);
          else disegnaMostro(p.id, p.cx, p.base, { alza: alzaDi(p.id) });
        }
        if (!anim) {
          for (const id of st.aBordo) {
            if (inSlide.has(id)) continue;
            disegnaMostro(id, POSTI[st.posti[id]], vv.y0 + 38, { dx: scossa(id) });
          }
        }

        // 9. mostri sui piani e quelli in cammino
        const festaLift = (id, i) => {
          if (!festa || ridu || st.dove[id] !== "sopra") return 0;
          return id[0] === "s" ? ((k + i) % 2 === 0 ? 1 : 0) : ((k + i + 1) % 2 === 0 ? 1 : 0);
        };
        for (const id of ids) {
          if (dinamici.has(id) || inSlide.has(id)) continue;
          const p = st.dove[id];
          if (p === "cabina") continue;
          if (mucchi.has(id)) { mucchio(slotX(id), BASE[p]); continue; }
          disegnaMostro(id, slotX(id), BASE[p], { dx: scossa(id), alza: alzaDi(id) + festaLift(id, +id.slice(1)) });
        }
        for (const s of slide) {
          const f = e3((now - s.t0) / s.dur);
          disegnaMostro(s.id, lerp(s.da.x, s.a.x, f), s.da.base);
        }
        for (const p of vv.pass) {
          if (p.strato !== 9) continue;
          disegnaMostro(p.id, p.cx, p.base);
        }

        // 10. cancelletti
        disegnaCancello("sopra", vv.gate.sopra);
        disegnaCancello("sotto", vv.gate.sotto);
        // 11. travi con i lampioncini
        trave(32, !!vv.lit.sopra, "P");
        trave(98, !!vv.lit.sotto, "T");

        // 12. effetti
        if (rapina) {
          const tr = vv.rap.tr;
          const acceso = vv.rap.fisso || Math.floor(tr / 125) % 2 === 0;
          if (acceso) {
            if (vv.rap.dove === "sopra") contorno(4, 20, 315, 83);
            else if (vv.rap.dove === "sotto") contorno(4, 91, 315, 152);
            else contorno(131, vv.y0 - 2, 188, vv.y0 + 43);
          }
          if (!vv.rap.fisso && tr >= 150 && tr < 525 && rapina.s.length && rapina.z.length) {
            const m = rapina.s[0];
            const z = rapina.z.reduce((b, c) => (Math.abs(c.cx - m.cx) < Math.abs(b.cx - m.cx) ? c : b));
            const f = (tr - 150) / 375;
            SP(vivo, OSSO, M, lerp(m.cx - 4, z.cx - 4, f), lerp(m.base - 14, z.base - 20, f));
          }
        }
      });

      // ══════════════ Aggancio per le prove ══════════════
      const stSommario = () => {
        const ss = copia(st.dove);
        return {
          piano: st.piano,
          sotto: conta(st, "sotto"),
          sopra: conta(st, "sopra"),
          cabina: conta(st, "cabina"),
          aBordo: [...st.aBordo],
          dove: ss,
          corse: st.corse,
          capienza: v.capienza,
          risolto: st.risolto,
        };
      };
      const primoFuori = (tipo) => ids.find((id) => id[0] === tipo && st.dove[id] === st.piano);
      function gioca(m) {
        if (!m || typeof m !== "object") return { valida: false, motivo: "mossa" };
        if (m.sali !== undefined) {
          const id = m.sali === "s" || m.sali === "z" ? primoFuori(m.sali) : m.sali;
          if (!id) return { valida: false, motivo: "nessuno" };
          return azSali(id);
        }
        if (m.scendi !== undefined) {
          let id = m.scendi;
          if (id === "s" || id === "z") id = [...st.aBordo].reverse().find((x) => x[0] === id);
          if (!id) return { valida: false, motivo: "nessuno" };
          return azScendi(id);
        }
        if (m.parti) return azParti();
        if (m.ricomincia) return azRicomincia();
        if (m.corsa) {
          const { s, z } = m.corsa;
          if (!Number.isInteger(s) || !Number.isInteger(z) || s < 0 || z < 0) return { valida: false, motivo: "mossa" };
          if (s + z === 0) return { valida: false, motivo: "vuota" };
          if (s + z > v.capienza) return { valida: false, motivo: "piena" };
          const disp = (tipo) => ids.filter((id) => id[0] === tipo && (st.dove[id] === st.piano || st.dove[id] === "cabina")).length;
          if (disp("s") < s || disp("z") < z) return { valida: false, motivo: "nessuno" };
          for (const id of [...st.aBordo]) azScendi(id);
          for (let i = 0; i < s; i++) azSali(primoFuori("s"));
          for (let i = 0; i < z; i++) azSali(primoFuori("z"));
          return azParti();
        }
        return { valida: false, motivo: "mossa" };
      }
      g.espone({
        gioca,
        statoGioco: stSommario,
        posizione(id) {
          if (!(id in st.dove)) return null;
          if (st.dove[id] === "cabina") return { x: POSTI[st.posti[id]], y: BASE[st.piano] - 12 };
          return { x: slotX(id), y: BASE[st.dove[id]] - 12 };
        },
        occupato,
      });
    },
  };

  EscapeDemo.avvia(opzioni);
})();
