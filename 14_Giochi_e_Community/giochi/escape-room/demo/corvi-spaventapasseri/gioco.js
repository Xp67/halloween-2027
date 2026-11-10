// I corvi dello spaventapasseri: Nim «misère» contro lo spaventapasseri, che non sbaglia mai.
// Quattro pali pieni di corvi; a turno si fanno volare via quanti corvi si vuole da un palo solo;
// chi fa volare via l'ultimo corvo del cortile perde.
// La logica (applica e le funzioni sotto) non sa niente del disegno: il disegno legge lo stato e una «vista».

(function () {
  "use strict";
  const { C, rett, riquadro, retino, sprite, testo, larghezzaTesto, mescola } = EscapeDemo;

  // ── Variante: 10 partite prese da un elenco già verificato ──
  // 79 disposizioni (ordinate in modo crescente): vincenti per chi comincia, una sola apertura giusta.
  const ELENCO = [
    [1,2,4,9],[1,2,5,8],[1,2,5,9],[1,2,6,8],[1,2,6,9],[1,2,7,8],[1,2,7,9],[1,2,8,9],
    [1,3,4,8],[1,3,4,9],[1,3,5,8],[1,3,5,9],[1,3,6,8],[1,3,6,9],[1,3,7,8],[1,3,7,9],[1,3,8,9],
    [1,4,5,8],[1,4,5,9],[1,4,6,8],[1,4,6,9],[1,4,7,8],[1,4,7,9],[1,4,8,9],
    [1,5,6,8],[1,5,6,9],[1,5,7,8],[1,5,7,9],[1,5,8,9],[1,6,7,8],[1,6,7,9],[1,6,8,9],[1,7,8,9],
    [2,3,4,8],[2,3,4,9],[2,3,5,8],[2,3,5,9],[2,3,6,8],[2,3,6,9],[2,3,7,8],[2,3,7,9],
    [2,4,5,8],[2,4,5,9],[2,4,6,8],[2,4,6,9],[2,4,7,8],[2,4,7,9],[2,4,8,9],
    [2,5,6,8],[2,5,6,9],[2,5,7,8],[2,5,7,9],[2,5,8,9],[2,6,7,8],[2,6,7,9],[2,6,8,9],[2,7,8,9],
    [3,4,5,8],[3,4,5,9],[3,4,6,8],[3,4,6,9],[3,4,7,8],[3,4,7,9],[3,4,8,9],
    [3,5,6,8],[3,5,6,9],[3,5,7,8],[3,5,7,9],[3,5,8,9],[3,6,7,8],[3,6,7,9],[3,6,8,9],
    [4,5,6,8],[4,5,6,9],[4,5,7,8],[4,5,7,9],[4,6,7,8],[4,6,7,9],[5,6,7,8],
  ];
  function variante(rng) {
    const scelte = mescola(rng, ELENCO).slice(0, 10); // 10 disposizioni diverse
    return { partite: scelte.map((q) => mescola(rng, q)) }; // e i pali in ordine casuale
  }

  // ── Logica pura ──
  /** Nim misère: chi deve muovere vince? (senza corvi ha vinto chi muove: l'ultimo l'ha preso l'altro) */
  function vinceChiMuove(pali) {
    const x = pali.reduce((a, b) => a ^ b, 0);
    return pali.some((n) => n > 1) ? x !== 0 : x === 0;
  }
  /** La prima mossa che lascia l'avversario in una posizione persa: palo da sinistra, poi quanti dal più piccolo. */
  function mossaVincente(pali) {
    for (let palo = 0; palo < 4; palo++)
      for (let quanti = 1; quanti <= pali[palo]; quanti++) {
        const dopo = [...pali];
        dopo[palo] -= quanti;
        if (!vinceChiMuove(dopo)) return { palo, quanti };
      }
    return null;
  }
  /** Lo spaventapasseri: gioca perfetto; se è in una posizione persa fa volare via UN corvo dal palo più alto
   *  (a parità, il primo da sinistra), per non regalare indizi. */
  function rispostaSpaventapasseri(pali) {
    const m = mossaVincente(pali);
    if (m) return m;
    let alto = -1;
    for (let p = 0; p < 4; p++) if (pali[p] > 0 && (alto < 0 || pali[p] > pali[alto])) alto = p;
    return { palo: alto, quanti: 1 };
  }
  /** stato + mossa → { stato, esito }. Non tocca il kit né il disegno. */
  function applica(stato, mossa, partite) {
    const nuovaPartita = (motivo) => {
      const partita = stato.partita + 1;
      const pali = [...partite[partita % partite.length]];
      return { stato: { pali, partita, mosse: [], vinta: false },
               esito: { errore: true, persa: true, motivo, partita, pali: [...pali] } };
    };
    if (mossa && mossa.arrenditi === true) return nuovaPartita("resa");
    const palo = mossa && mossa.palo, quanti = mossa && mossa.quanti;
    if (!Number.isInteger(palo) || palo < 0 || palo > 3) return { stato, esito: { valida: false, motivo: "palo inesistente" } };
    if (!Number.isInteger(quanti) || quanti < 1) return { stato, esito: { valida: false, motivo: "almeno un corvo" } };
    if (quanti > stato.pali[palo]) return { stato, esito: { valida: false, motivo: "non ci sono abbastanza corvi" } };
    const pali = [...stato.pali];
    pali[palo] -= quanti;
    const mosse = [...stato.mosse, { chi: "tu", palo, quanti }];
    if (pali.every((n) => n === 0)) return nuovaPartita("ultimo corvo"); // l'ultimo l'hai preso tu
    const r = rispostaSpaventapasseri(pali);
    pali[r.palo] -= r.quanti;
    mosse.push({ chi: "spaventapasseri", palo: r.palo, quanti: r.quanti });
    if (pali.every((n) => n === 0)) // l'ultimo l'ha preso lui
      return { stato: { pali, partita: stato.partita, mosse, vinta: true }, esito: { risolto: true, risposta: r, pali: [...pali] } };
    return { stato: { pali, partita: stato.partita, mosse, vinta: false }, esito: { ok: true, risposta: r, pali: [...pali] } };
  }

  // ── Costanti di disegno ──
  const PALI_X = [30, 88, 232, 290]; // centro di ogni palo
  const TRAVERSE_Y = [116, 97, 78]; // bordo alto della traversa bassa, di mezzo, alta (i piedi dei corvi poggiano qui)
  const SLOT_DX = [-15, 0, 15]; // posti sinistro, centrale, destro di ogni traversa
  const CIMA = 64, TERRA = 148; // il palo va da CIMA a TERRA
  const SPAV_X = 160, SPAV_BASE = 150, SPAV_T = 100; // spaventapasseri: centro, piede, cima della giacca
  const ORD = ["primo", "secondo", "terzo", "quarto"];

  const COL_CORVO = {
    k: C.bordo, n: C.ferro, v: C.violaScuro, m: C.ferroChiaro, l: C.notteChiara,
    y: C.giallo, b: C.pietra, B: C.ferroChiaro,
  };
  const CORVO = [ // 17×13 — i piedi (riga 11) poggiano sulla traversa, la coda pende davanti
    "..........kkk....",
    ".........kmlmkk..",
    "........kmnnynbk.",
    "........knnnnnBbk",
    ".......knnnnnnkk.",
    "......knnnnnnnk..",
    "....kkmvvnnnnnk..",
    "...kmvvvvvnnnk...",
    "..kmvvvvvvnnnk...",
    ".kvvvvvvvnnnk....",
    "kvvkkvvvvnnk.....",
    "kvk..kkbkbk......",
    "kk...............",
  ];
  const CORVO_PRONTO = [ // 17×13 — ala alzata: pronto a volare
    "..........kkk....",
    ".........kmlmkk..",
    "...kk...kmnnynbk.",
    "..kmvk..knnnnnBbk",
    "..kvvvkknnnnnnkk.",
    "...kvvvknnnnnnk..",
    "....kvvvvnnnnnk..",
    "...kmvvvvvnnnk...",
    "..kmvvvvvvnnnk...",
    ".kvvvvvvvnnnk....",
    "kvvkkvvvvnnk.....",
    "kvk..kkbkbk......",
    "kk...............",
  ];
  // occhio chiuso: CORVO con la "y" della riga 2 sostituita da "n"
  const CORVO_CHIUSO = CORVO.map((riga, i) => (i === 2 ? riga.replace("y", "n") : riga));
  const COL_GIALLO = {};
  for (const k of Object.keys(COL_CORVO)) COL_GIALLO[k] = C.giallo;

  const VOLO_SU = [ // 20×12
    "...kmmmkk...........",
    "...kmmmmmk..........",
    "....kvvvvvkk........",
    ".....kkvvvvvk.kkk...",
    "..kkkkkkvvvvvkmnykk.",
    ".kvvvnnnnnnnnnnnnbbk",
    ".kvvvnnnnnnnnnnkkBk.",
    "kvvvvknnnnnnnnk..k..",
    ".kkkk.kkkkkkkk......",
    "....................",
    "....................",
    "....................",
  ];
  const VOLO_MEZZO = [ // 20×12
    "....................",
    "....................",
    "....................",
    "...kkkkkkkkkk.kkk...",
    "..kvvmmmmmmmvkmnykk.",
    ".kvvvnnnnnnnnnnnnbbk",
    ".kvvvnnnnnnnnnnkkBk.",
    "kvvvvknnnnnnnnk..k..",
    ".kkkk.kkkkkkkk......",
    "....................",
    "....................",
    "....................",
  ];
  const VOLO_GIU = [ // 20×12
    "....................",
    "....................",
    "....................",
    "..............kkk...",
    "..kkkkkkkkkkkkmnykk.",
    ".kvvvnnnnnnnnnnnnbbk",
    ".kvvvnnnnnnnnnnkkBk.",
    "kvvvvknnnnnnnnk..k..",
    ".kkkk.kvvvvvvk......",
    ".....kvvvvvvk.......",
    "....kmmmmmkk........",
    "...kmmmmkk..........",
  ];
  const VOLO = [VOLO_SU, VOLO_MEZZO, VOLO_GIU, VOLO_MEZZO];

  const COL_GIACCA = {
    k: C.bordo, G: C.erba, g: C.erbaScura, s: C.siepe, c: C.legnoLuce, p: C.tappeto, P: C.tappetoChiaro,
    q: C.legnoChiaro, w: C.pietra, y: C.oro, Y: C.giallo, O: C.oroScuro,
  };
  const GIACCA = [ // 57×32 — braccia sulla traversa, paglia ai polsi e sotto l'orlo, corda in vita, toppe
    ".................YyOkkkkkkkkkkkkkkkkkyYO.................",
    "..YYkkkkkkkkkkkkkGGGgggggggggsgggggggssskkkkkkkkkkkkkYY..",
    "YYYYGGGGGGGGGGGGGGGGGGGGGGGGGsGGGGGGGGGGwkkkkkGGGGGGGYYYY",
    ".yyyGGGGGGGGGGGGGGGGGGGGGGGGGsGGGGGGGGGGkqqqqkGGGGGGGyyy.",
    "OOOOgggggsgggggsgggggggggggggsggggggggggkqqqqkgsgggggOOOO",
    "yyyyggggggsgggggsggggggggggwgsggggggggggkqqqqkggsggggyyyy",
    ".YYYsssssssssssssswkkkkkwssssssssssssssskkkkkwsssssssYYY.",
    "OOOOsssssssssssssskPPpppkssssssssssssssssssssssssssssOOOO",
    "..yykkkkkkkkkkkkGGkpppppkggggsggggggggssskkkkkkkkkkkkyy..",
    "...............kGGkpppppkggggsggggggggsssk...............",
    "...............kGGkpppppkggwgsggggggggsssk...............",
    "...............kGGwkkkkkwggggsggggggggsssk...............",
    "..............kGGGgggggggggggsgggggggggsssk..............",
    "..............kGGGgggggggggggsgggggggggsssk..............",
    "..............kkkkkkkkkkkkkkkkkkkkkkkkkkkkk..............",
    "..............kcccccccccckkkkkcccccccccccck..............",
    "..............kkkkkkkkkkkkccckkkkkkkkkkkkkk..............",
    "..............kGGGgggggggkccckgggggggggsssk..............",
    ".............kGGGggggggggkkkkkggggggggggsssk.............",
    ".............kGGGggggggggcgggscggkkkkkggsssk.............",
    ".............kGGGggggggggkgwgskggkqqqkggsssk.............",
    ".............kGGGggggggggggggsgggkqqqkggsssk.............",
    ".............kGGGggggggggggggsgggkqqqkggsssk.............",
    ".............kGGGggggggggggggsgggkkkkkggsssk.............",
    "............kGGGgggggggggggggsgggggggggggsssk............",
    "............kGGGkgggkgggkgggkgggkgggkgggksssk............",
    "............kGkGkgkgkgkgkgkgkgkgkgkgkgkgksksk............",
    ".............k.k.k.k.k.k.k.k.k.k.k.k.k.k.k.k.............",
    "...............y...O..Y...y....O...Y..y..O...............",
    "...............y...O..Y...y....O...Y..y..O...............",
    "...............y......Y........O......y..................",
    "......................Y...............y..................",
  ];
  // La "e" (occhi, naso, bocca intagliati) cambia colore con lo stato.
  const COL_ZUCCA = { k: C.bordo, r: C.tappeto, b: C.brace, f: C.fiamma, h: C.fiammaChiara, e: C.bordo };
  const ZUCCA = [ // 21×16 — occhi a triangolo cattivi, bocca coi denti
    "........kkkkk........",
    ".....kkkhhfffkkk.....",
    "...kkhhhfffbfffbbkk..",
    "..khhhhffbffffbbbrk..",
    ".khhhffffbfffffbbbrk.",
    ".khheeeefbfffeeeebrk.",
    "khhffeeefbfffeeebbbrk",
    "khfffbeefbfffeebbbbrk",
    "kfffffbbfbebfbbbbbbrk",
    "kfffffbbbeeebbbbbbrrk",
    "kfbeeefeeefeeefeebrrk",
    "kfbbeeeeeeeeeeeebbrrk",
    ".kbbbeeefeeefeeebbrk.",
    "..kbbbbbbbbbbbbbbrrk.",
    "...kkrrbbbbbbbrrrkk..",
    ".....kkkkkkkkkkk.....",
  ];
  const COL_CAPPELLO = { k: C.bordo, n: C.legnoChiaro, m: C.legnoLuce, s: C.legno, r: C.tappeto, R: C.tappetoChiaro };
  const CAPPELLO = [ // 29×13 — feltro sfondato con la punta piegata e il nastro rosso
    "...............kkk...........",
    ".............kkmnsk..........",
    "...........kkmnnnsk..........",
    "..........kmnnnnnsk..........",
    ".........kmnnnnnnnsk.........",
    ".........kmnnnnnnnsk.........",
    "........kmnnnnnnnnnsk........",
    "........kRRRRRRRRRRrk........",
    "........krrrrrrrrrrrk........",
    "..kkkkkkkmnnnnnnnnnskkkkkkk..",
    ".kmmmmmmmnnnnnnnnnnnnnnnnnssk",
    "kmnnnnnnnnnnnnnnnnnnnnnssssk",
    ".kkkkkkkkkkkkkkkkkkkkkkkkkkk.",
  ];
  const DONDOLIO = [0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, -1, -1, -1, -1, -1, -1];

  // ── Messaggi ──
  const M_INIZIO = "Tocca un corvo per scegliere quanti farne volare via, poi premi «Via!».";
  const M_RIPRESA = "Partita ripresa da dove l'avevi lasciata: tocca a te.";
  const M_ANNULLATA = "Tocca a te: scegli i corvi da far volare via.";
  const M_SENZA_SCELTA = "Prima tocca i corvi da far volare via.";
  const M_ASPETTA = "Aspetta un attimo: i corvi stanno volando.";
  const M_RESA = "Arrendersi conta come partita persa. Premi di nuovo per confermare.";
  const M_PERSA = "Partita persa. Arrivano altri corvi: comincia di nuovo tu.";
  const M_VITTORIA = "L'ultimo corvo è toccato allo spaventapasseri: la maledizione è sua!";
  const M_GIA_RISOLTO = "Lo spaventapasseri è maledetto: i corvi non tornano più.";
  const mVola = (q) => (q === 1 ? "Vola via un corvo. Tocca allo spaventapasseri…" : `Volano via ${q} corvi. Tocca allo spaventapasseri…`);
  const mRisposta = (r, p) => (r === 1
    ? `Lo spaventapasseri fa volare via un corvo dal ${ORD[p]} palo. Tocca a te.`
    : `Lo spaventapasseri fa volare via ${r} corvi dal ${ORD[p]} palo. Tocca a te.`);
  const mPronti = (q, p) => (q === 1 ? `Un corvo pronto sul ${ORD[p]} palo: premi «Via!».` : `${q} corvi pronti sul ${ORD[p]} palo: premi «Via!».`);

  const OPZIONI = { id: "corvi-spaventapasseri", sfondo: "cancello", velo: 0.5, variante, crea };
  EscapeDemo.avvia(OPZIONI);

  function crea(g) {
    OPZIONI.testo = g.scheda.enigma + "\nOgni partita persa conta come errore: i corvi tornano, disposti in un altro modo, e si ricomincia.";
    const partite = g.variante.partite;

    // ── Stato logico ──
    function validaMemoria(m) {
      return Array.isArray(m.pali) && m.pali.length === 4 && m.pali.every((n) => Number.isInteger(n) && n >= 0 && n <= 9) &&
        m.pali.reduce((a, b) => a + b, 0) > 0 && Number.isInteger(m.partita) && m.partita >= 0 && Array.isArray(m.mosse);
    }
    let stato;
    let ripresa = false;
    if (g.giaRisolto) {
      stato = { pali: [0, 0, 0, 0], partita: g.memoria.partita ?? 0, mosse: g.memoria.mosse ?? [], vinta: true };
    } else if (validaMemoria(g.memoria)) {
      stato = { pali: [...g.memoria.pali], partita: g.memoria.partita, mosse: g.memoria.mosse.map((m) => ({ ...m })), vinta: false };
      ripresa = stato.mosse.length > 0;
    } else {
      stato = { pali: [...partite[0]], partita: 0, mosse: [], vinta: false };
    }
    let selezione = null; // { palo, quanti }

    function salvaStato() {
      g.memoria.pali = [...stato.pali];
      g.memoria.partita = stato.partita;
      g.memoria.mosse = stato.mosse.map((m) => ({ ...m }));
      g.memoria.vinta = stato.vinta;
      g.salvaMemoria();
    }

    // ── La vista: quello che si vede, separato dallo stato logico ──
    let vista = null;
    let seq = null; // la sequenza animata in corso: { inizio, eventi, i, fine, onFine }
    function sincronizza() {
      vista = {
        pali: [...stato.pali], // corvi seduti su ogni palo
        numeri: [...stato.pali], // numeri sui cartelli
        voli: [],
        posa: stato.vinta ? "maledetto" : "fermo",
        mirato: 0,
        nervosi: null, // { palo, n }
        cappello: stato.vinta ? "giu" : "su", // "su" | "giu" | { da } (in caduta)
        corvoMaledetto: stato.vinta,
        stelline: stato.vinta,
        paglia: null, // istante in cui parte la paglia
        lampoDa: -1e9,
      };
    }
    sincronizza();

    // ── Sequenze animate ──
    function avviaSeq(eventi, { fine = 0, onFine = null } = {}) {
      seq = { inizio: g.tempo, eventi: [...eventi].sort((a, b) => a.t - b.t), i: 0, fine, onFine };
    }
    /** Applica subito tutto quello che resta di una sequenza (nessun corvo lasciato a metà). */
    function concludiSeq() {
      if (!seq) return;
      const s = seq;
      while (s.i < s.eventi.length) {
        const e = s.eventi[s.i++];
        e.fn(s.inizio + e.t);
      }
      seq = null;
      if (s.onFine) s.onFine();
      sincronizza();
    }
    function passoSeq() {
      if (!seq) return;
      const el = g.tempo - seq.inizio;
      while (seq.i < seq.eventi.length && seq.eventi[seq.i].t <= el) {
        const e = seq.eventi[seq.i++];
        e.fn(seq.inizio + e.t);
      }
      // i voli: finiti quelli che hanno raggiunto la fine
      const ora = g.tempo;
      vista.voli = vista.voli.filter((f) => {
        if (ora >= f.inizio + f.dur) {
          if (f.onFine) f.onFine();
          return false;
        }
        return true;
      });
      if (seq.i >= seq.eventi.length && vista.voli.length === 0 && el >= seq.fine) {
        const s = seq;
        seq = null;
        if (s.onFine) s.onFine();
      }
    }

    /** Fa decollare `quanti` corvi dalla cima del palo `p`; ritorna quando finisce l'ultimo (ms dopo `ab`+`ritardo`). */
    function decolla(p, quanti, ab, ritardo = 0, passo = 40, arcoUltimo = false) {
      const n = vista.pali[p];
      const dir = p < 2 ? -1 : 1;
      for (let j = 0; j < quanti; j++) {
        const indice = n - 1 - j;
        const cx = PALI_X[p] + SLOT_DX[indice % 3];
        const ty = TRAVERSE_Y[Math.floor(indice / 3)];
        const f = {
          tipo: arcoUltimo && j === quanti - 1 ? "arco" : "esci",
          x0: cx - 10, y0: ty - 11, x1: cx - 10 + 100 * dir, y1: -16, dir,
          sx: cx - 8, sy: ty - 11, // dov'era seduto
          inizio: ab + ritardo + j * passo, dur: 500, k: vista.voli.length,
        };
        if (f.tipo === "arco") { f.dur = 700; f.x1 = 153; }
        vista.voli.push(f);
      }
      vista.pali[p] = n - quanti;
      vista.numeri[p] = n - quanti;
      return ritardo + (quanti - 1) * passo + 500;
    }
    /** I corvi nuovi atterrano sul palo `p` (n corvi, dal posto 0 in su, 30 ms l'uno dall'altro). */
    function atterra(p, n, ab) {
      const dir = p < 2 ? -1 : 1;
      vista.pali[p] = 0;
      vista.numeri[p] = n;
      for (let i = 0; i < n; i++) {
        const cx = PALI_X[p] + SLOT_DX[i % 3];
        const ty = TRAVERSE_Y[Math.floor(i / 3)];
        vista.voli.push({
          tipo: "arrivo", x0: cx - 10, y0: ty - 11, x1: cx - 10 + 100 * dir, y1: -16, dir,
          inizio: ab + i * 30, dur: 500, k: vista.voli.length,
          onFine: () => { vista.pali[p] += 1; },
        });
      }
      return (n - 1) * 30 + 500;
    }
    const atterraTutti = (pali, ab) => { for (let p = 0; p < 4; p++) atterra(p, pali[p], ab); };

    // Sequenza «turno»: il giocatore fa volare i suoi corvi, lo spaventapasseri risponde.
    function seqTurno(m, r, vittoria) {
      const q = m.quanti, rr = r.quanti;
      const T1 = 550 + 40 * (q - 1);
      const eventi = [
        { t: 0, fn: (ab) => { decolla(m.palo, q, ab); g.messaggio(mVola(q)); } },
        { t: T1, fn: () => { vista.posa = "pensa"; vista.mirato = r.palo; vista.nervosi = { palo: r.palo, n: rr }; } },
        { t: T1 + 450, fn: (ab) => { vista.posa = "scuote"; vista.paglia = ab; } },
      ];
      if (!vittoria) {
        eventi.push({ t: T1 + 700, fn: (ab) => { vista.nervosi = null; vista.posa = "fermo"; decolla(r.palo, rr, ab); g.messaggio(mRisposta(rr, r.palo)); } });
        avviaSeq(eventi, { fine: T1 + 700 + (rr - 1) * 40 + 500 });
        return;
      }
      const Tl = T1 + 700 + (rr - 1) * 40 + 700; // l'ultimo corvo si posa sulla testa
      eventi.push({ t: T1 + 700, fn: (ab) => { vista.nervosi = null; vista.posa = "fermo"; decolla(r.palo, rr, ab, 0, 40, true); } });
      eventi.push({
        t: Tl,
        fn: (ab) => {
          vista.posa = "maledetto";
          vista.corvoMaledetto = true;
          vista.stelline = true;
          vista.cappello = { da: ab };
          g.messaggio(M_VITTORIA);
        },
      });
      avviaSeq(eventi, { fine: Tl + 400 });
    }
    function seqPersa(m) {
      const pali = stato.pali; // della partita nuova
      avviaSeq([
        { t: 0, fn: (ab) => { decolla(m.palo, m.quanti, ab); g.messaggio(M_PERSA); } },
        { t: 500, fn: (ab) => { vista.lampoDa = ab; vista.posa = "ride"; } },
        { t: 1300, fn: (ab) => { vista.posa = "fermo"; atterraTutti(pali, ab); } },
      ], { fine: 1300 + 8 * 30 + 500, onFine: () => g.messaggio(M_INIZIO) });
    }
    function seqResa() {
      const pali = stato.pali; // della partita nuova
      const vecchi = [...vista.pali];
      avviaSeq([
        {
          t: 0,
          fn: (ab) => {
            let contati = 0;
            for (let p = 0; p < 4; p++) {
              if (vecchi[p] > 0) { decolla(p, vecchi[p], ab, contati * 20, 20); contati += vecchi[p]; }
            }
            g.messaggio(M_PERSA);
          },
        },
        { t: 1000, fn: (ab) => { vista.lampoDa = ab; vista.posa = "ride"; } },
        { t: 1800, fn: (ab) => { vista.posa = "fermo"; atterraTutti(pali, ab); } },
      ], { fine: 1800 + 8 * 30 + 500, onFine: () => g.messaggio(M_INIZIO) });
    }

    // ── La mossa: unica per tocchi, bottoni e prove ──
    let timerResa = 0;
    let confermaResa = false;
    let btnResa = null;
    function azzeraResa() {
      clearTimeout(timerResa);
      confermaResa = false;
      if (btnResa) btnResa.textContent = "Arrenditi";
    }
    function mossa(m) {
      const prova = applica(stato, m, partite);
      if (prova.esito.valida === false) return prova.esito; // mossa impossibile: rifiutata e basta
      concludiSeq(); // se c'era una sequenza in corso, salta alla fine
      selezione = null;
      azzeraResa();
      const prima = stato;
      stato = prova.stato;
      const esito = prova.esito;
      salvaStato();
      const ridotto = g.riduciMovimento;
      if (esito.ok) {
        const mm = stato.mosse[stato.mosse.length - 2];
        if (ridotto) { sincronizza(); g.messaggio(mRisposta(esito.risposta.quanti, esito.risposta.palo)); } else seqTurno(mm, esito.risposta, false);
      } else if (esito.persa) {
        if (esito.motivo === "resa") {
          g.errore("Ti sei arreso: partita persa");
          if (ridotto) { sincronizza(); g.messaggio(M_PERSA); } else { sincronizzaDa(prima); seqResa(); }
        } else {
          g.errore("Hai fatto volare via l'ultimo corvo: la maledizione è tua");
          if (ridotto) { sincronizza(); g.messaggio(M_PERSA); } else { sincronizzaDa(prima); seqPersa(m); }
        }
      } else if (esito.risolto) {
        const tue = stato.mosse.filter((x) => x.chi === "tu").length;
        g.risolto({
          riepilogo: "Lo spaventapasseri ha dovuto far volare via l'ultimo corvo: la maledizione è sua.\n" +
            `Hai vinto la partita numero ${stato.partita + 1} in ${tue} mosse.`,
          ritardo: 2900,
        });
        if (ridotto) { sincronizza(); g.messaggio(M_VITTORIA); } else seqTurno(stato.mosse[stato.mosse.length - 2], esito.risposta, true);
      }
      return esito;
    }
    /** La vista resta com'era prima della mossa (corvi della partita vecchia): solo cartelli e corvi seduti. */
    function sincronizzaDa(prec) {
      vista = {
        pali: [...prec.pali], numeri: [...prec.pali], voli: [], posa: "fermo", mirato: 0, nervosi: null,
        cappello: "su", corvoMaledetto: false, stelline: false, paglia: null, lampoDa: -1e9,
      };
    }

    // ── Tocchi ──
    function postoSotto(x, y) {
      const fx = Math.floor(x), fy = Math.floor(y);
      for (let p = 0; p < 4; p++)
        for (let i = 0; i < 9; i++) {
          const cx = PALI_X[p] + SLOT_DX[i % 3];
          const ty = TRAVERSE_Y[Math.floor(i / 3)];
          if (fx >= cx - 7 && fx <= cx + 7 && fy >= ty - 14 && fy <= ty + 3) return { palo: p, indice: i };
        }
      return null;
    }
    g.tocca(({ tipo, x, y }) => {
      if (tipo !== "giu") return;
      azzeraResa();
      const posto = postoSotto(x, y);
      if (seq) { if (posto) g.messaggio(M_ASPETTA); return; }
      if (!posto || posto.indice >= stato.pali[posto.palo]) {
        if (selezione) { selezione = null; g.messaggio(M_ANNULLATA); }
        return;
      }
      const quanti = stato.pali[posto.palo] - posto.indice;
      if (selezione && selezione.palo === posto.palo && selezione.quanti === quanti) {
        selezione = null;
        g.messaggio(M_ANNULLATA);
      } else {
        selezione = { palo: posto.palo, quanti };
        g.messaggio(mPronti(quanti, posto.palo));
      }
    });

    // ── Bottoni ──
    g.bottone("Via!", () => {
      if (seq) { g.messaggio(M_ASPETTA); return; }
      if (!selezione) { g.messaggio(M_SENZA_SCELTA); return; }
      mossa({ palo: selezione.palo, quanti: selezione.quanti });
    }, { id: "vola", forte: true });
    btnResa = g.bottone("Arrenditi", () => {
      if (seq) { g.messaggio(M_ASPETTA); return; }
      if (confermaResa) { mossa({ arrenditi: true }); return; }
      confermaResa = true;
      btnResa.textContent = "Sicuro?";
      g.messaggio(M_RESA);
      timerResa = setTimeout(azzeraResa, 4000);
    }, { id: "arrenditi" });

    g.messaggio(stato.vinta ? M_GIA_RISOLTO : ripresa ? M_RIPRESA : M_INIZIO);

    // ── Disegno ──
    // Il lampo rosso è un retino pronto una volta sola (320×180), poi si copia 1:1.
    const lampo = document.createElement("canvas");
    lampo.width = 320; lampo.height = 180;
    retino(lampo.getContext("2d"), "rgba(0,0,0,0)", C.tappetoChiaro, 0, 16, 320, 138, 0.25);

    function disegnaPali(ctx) {
      for (let p = 0; p < 4; p++) {
        const cx = PALI_X[p];
        const n = vista.numeri[p];
        rett(ctx, C.bordo, cx - 7, TERRA, 19, 2);
        rett(ctx, C.bordo, cx - 6, 146, 13, 3);
        rett(ctx, C.terra, cx - 5, 146, 11, 2);
        rett(ctx, C.pavimento2, cx - 5, 146, 4, 1);
        rett(ctx, C.bordo, cx - 3, CIMA, 6, 84);
        rett(ctx, C.legnoLuce, cx - 2, 65, 1, 82);
        rett(ctx, C.legnoChiaro, cx - 1, 65, 2, 82);
        rett(ctx, C.legno, cx + 1, 65, 1, 82);
        for (const y of [72, 90, 108, 141]) rett(ctx, C.legno, cx - 1, y, 1, 3);
        rett(ctx, C.bordo, cx - 4, 60, 8, 5);
        rett(ctx, C.ferroChiaro, cx - 3, 61, 6, 3);
        rett(ctx, C.pietra, cx - 3, 61, 2, 1);
        rett(ctx, C.bordo, cx - 1, 57, 2, 3);
        for (const y of TRAVERSE_Y) {
          rett(ctx, C.bordo, cx - 24, y, 48, 5);
          rett(ctx, C.legnoChiaro, cx - 23, y + 1, 46, 3);
          rett(ctx, C.legnoLuce, cx - 23, y + 1, 46, 1);
          rett(ctx, C.legno, cx - 23, y + 3, 46, 1);
          rett(ctx, C.bordo, cx - 21, y + 2, 1, 1);
          rett(ctx, C.bordo, cx + 20, y + 2, 1, 1);
          rett(ctx, C.bordo, cx - 4, y - 1, 8, 7);
          rett(ctx, C.legnoLuce, cx - 3, y, 6, 5);
          rett(ctx, C.pietra, cx - 3, y, 6, 1);
          rett(ctx, C.legnoChiaro, cx - 3, y + 2, 6, 1);
          rett(ctx, C.legnoChiaro, cx - 3, y + 4, 6, 1);
        }
        riquadro(ctx, cx - 9, 125, 18, 14, C.legnoChiaro);
        rett(ctx, C.legnoLuce, cx - 8, 126, 16, 1);
        rett(ctx, C.legno, cx - 8, 137, 16, 1);
        rett(ctx, C.ferroChiaro, cx - 7, 127, 1, 1);
        rett(ctx, C.ferroChiaro, cx + 6, 127, 1, 1);
        testo(ctx, String(n), cx, 129, { colore: n ? C.fiammaChiara : C.legnoLuce, ombra: C.bordo, allinea: "centro" });
      }
    }

    function disegnaSpaventapasseri(ctx) {
      let sx = 0, dx = 0, dy = 0, e = C.bordo;
      const f = g.fotogramma;
      const verso = vista.mirato < 2 ? -1 : 1;
      switch (vista.posa) {
        case "pensa": dx = verso; e = f % 3 === 0 ? C.fiammaChiara : C.giallo; break;
        case "scuote": sx = f % 2 ? 1 : -1; dx = verso; e = f % 3 === 0 ? C.fiammaChiara : C.giallo; break;
        case "ride": dy = f % 2 ? -1 : 0; e = C.fiammaChiara; break;
        case "maledetto": dx = 2; dy = 3; break;
        default: dx = g.riduciMovimento ? 0 : DONDOLIO[f % 24];
      }
      rett(ctx, C.bordo, SPAV_X - 12, SPAV_BASE, 27, 2);
      rett(ctx, C.bordo, SPAV_X - 2, SPAV_T + 20, 5, SPAV_BASE - SPAV_T - 20);
      rett(ctx, C.legno, SPAV_X - 1, SPAV_T + 20, 3, 29);
      rett(ctx, C.legnoChiaro, SPAV_X - 1, SPAV_T + 20, 1, 29);
      rett(ctx, C.bordo, SPAV_X - 6, SPAV_BASE - 3, 13, 3);
      rett(ctx, C.terra, SPAV_X - 5, SPAV_BASE - 3, 11, 2);
      sprite(ctx, GIACCA, COL_GIACCA, SPAV_X - 28 + sx, SPAV_T);
      sprite(ctx, ZUCCA, { ...COL_ZUCCA, e }, SPAV_X - 10 + sx + dx, SPAV_T - 14 + dy);
      // il cappello: in testa, in caduta o a terra
      const cap = vista.cappello;
      if (cap === "su") {
        sprite(ctx, CAPPELLO, COL_CAPPELLO, SPAV_X - 14 + sx + dx, SPAV_T - 23 + dy);
      } else if (cap === "giu") {
        sprite(ctx, CAPPELLO, COL_CAPPELLO, 168, 138);
      } else {
        const u = Math.min(1, Math.max(0, (g.tempo - cap.da) / 400));
        sprite(ctx, CAPPELLO, COL_CAPPELLO, Math.round(146 + (168 - 146) * u), Math.round(77 + (138 - 77) * u * u));
      }
    }

    function posCorvo(p, indice) {
      return { x: PALI_X[p] + SLOT_DX[indice % 3] - 8, y: TRAVERSE_Y[Math.floor(indice / 3)] - 11 };
    }
    function disegnaCorviSeduti(ctx) {
      const f = g.fotogramma;
      const vita = !g.riduciMovimento;
      const scelti = [];
      for (let p = 0; p < 4; p++) {
        const n = vista.pali[p];
        for (let i = 0; i < n; i++) {
          const { x, y } = posCorvo(p, i);
          const baseSpecchia = [2, 5, 7].includes((i + 3 * p) % 9);
          const scelto = !seq && selezione && selezione.palo === p && i >= n - selezione.quanti;
          if (scelto) { scelti.push({ x, y, specchia: baseSpecchia }); continue; }
          const nervoso = vista.nervosi && vista.nervosi.palo === p && i >= n - vista.nervosi.n;
          if (nervoso) {
            sprite(ctx, CORVO_PRONTO, COL_CORVO, x, y - (f % 2 ? 1 : 0), { specchia: baseSpecchia });
            continue;
          }
          let specchia = baseSpecchia;
          let righe = CORVO;
          if (vita) {
            if ((f + (23 * p + 13 * i) % 64) % 64 < 8) specchia = !specchia;
            if ((f + 7 * p + 5 * i) % 40 === 0) righe = CORVO_CHIUSO;
          }
          sprite(ctx, righe, COL_CORVO, x, y, { specchia });
        }
      }
      if (!scelti.length) return;
      const su = f % 4 === 0 && vita ? 2 : 1;
      for (const s of scelti)
        for (const [ox, oy] of [[1, 0], [-1, 0], [0, 1], [0, -1]])
          sprite(ctx, CORVO_PRONTO, COL_GIALLO, s.x + ox, s.y - su + oy, { specchia: s.specchia });
      for (const s of scelti) sprite(ctx, CORVO_PRONTO, COL_CORVO, s.x, s.y - su, { specchia: s.specchia });
    }

    function disegnaVoli(ctx) {
      const ora = g.tempo;
      for (const v of vista.voli) {
        if (v.tipo === "esci" || v.tipo === "arco") {
          if (ora < v.inizio) { // aspetta il suo turno: è ancora sul posto, pronto
            sprite(ctx, CORVO_PRONTO, COL_CORVO, v.sx, v.sy);
            continue;
          }
        } else if (ora < v.inizio) continue;
        const frame = VOLO[(g.fotogramma + v.k) % 4];
        let x, y, specchia;
        if (v.tipo === "arco") {
          const u = Math.min(1, (ora - v.inizio) / v.dur);
          x = Math.round(v.x0 + (v.x1 - v.x0) * u);
          y = Math.round((1 - u) * v.y0 + u * 78 - 120 * u * (1 - u));
          specchia = v.x1 < v.x0;
        } else {
          let u = Math.min(1, Math.max(0, (ora - v.inizio) / v.dur));
          if (v.tipo === "arrivo") u = 1 - u;
          x = Math.round(v.x0 + (v.x1 - v.x0) * u * u);
          y = Math.round(v.y0 + (v.y1 - v.y0) * (2 * u - u * u));
          specchia = v.tipo === "arrivo" ? v.dir > 0 : v.dir < 0;
        }
        sprite(ctx, frame, COL_CORVO, x, y, { specchia });
      }
    }

    function stellina(ctx, x, y) {
      rett(ctx, C.lilla, x - 1, y, 3, 1);
      rett(ctx, C.lilla, x, y - 1, 1, 3);
      rett(ctx, C.bianco, x, y, 1, 1);
    }

    g.anima(() => {
      passoSeq();
      const ctx = g.ctx;
      const f = g.fotogramma;
      ctx.clearRect(0, 0, g.larghezza, g.altezza);
      disegnaPali(ctx);
      disegnaSpaventapasseri(ctx);
      disegnaCorviSeduti(ctx);
      if (vista.corvoMaledetto) sprite(ctx, CORVO, COL_CORVO, 154, 78, { specchia: true });
      disegnaVoli(ctx);
      // paglia che si stacca dai polsi mentre lo spaventapasseri scuote
      if (vista.paglia != null && !g.riduciMovimento) {
        const u = (g.tempo - vista.paglia) / 400;
        if (u >= 0 && u < 1) {
          const fili = [[133, 103, -1, C.oro], [135, 105, -1, C.giallo], [186, 103, 1, C.oro], [184, 105, 1, C.giallo]];
          for (const [px, py, d, col] of fili) rett(ctx, col, px + d * Math.round(6 * u), py + Math.round(8 * u), 1, 2);
        }
      }
      if (vista.stelline) {
        const tutte = g.riduciMovimento;
        if (tutte || f % 2 === 0) { stellina(ctx, 141, 90); stellina(ctx, 180, 94); }
        if (tutte || f % 2 === 1) { stellina(ctx, 146, 76); stellina(ctx, 176, 78); }
      }
      // il cartellino «VIA n» sopra il palo scelto
      if (selezione && !seq) {
        const t = `VIA ${selezione.quanti}`;
        const w = larghezzaTesto(t, { piccolo: true });
        const cx = PALI_X[selezione.palo];
        riquadro(ctx, cx - Math.ceil(w / 2) - 3, 44, w + 6, 9, C.bordo, C.giallo);
        testo(ctx, t, cx, 46, { piccolo: true, colore: C.giallo, ombra: null, allinea: "centro" });
      }
      // il lampo rosso
      if (g.tempo - vista.lampoDa < 250 && g.tempo >= vista.lampoDa) ctx.drawImage(lampo, 0, 0);
    });

    // ── L'aggancio per le prove ──
    g.espone({
      gioca: (m) => mossa(m),
      statoGioco: () => ({
        pali: [...stato.pali],
        partita: stato.partita,
        mosse: stato.mosse.map((m) => ({ ...m })),
        selezione: selezione ? { ...selezione } : null,
        vinta: stato.vinta,
        animazione: seq !== null,
      }),
      posizione: (palo, indice) => ({ x: PALI_X[palo] + SLOT_DX[indice % 3], y: TRAVERSE_Y[Math.floor(indice / 3)] - 6 }),
    });
  }
})();
