// Il lucchetto delle lapidi: un Mastermind contro un lucchetto cattivo che risponde sempre col gruppo di
// combinazioni vive più grande. La logica (candele, rispondi, applica) è pura e separata dal disegno.

(function () {
  "use strict";
  const { C, GEMME: G, rett, riquadro, sprite, testo } = EscapeDemo;

  // ───────────────────────────── Logica pura ─────────────────────────────

  const DISEGNI = ["teschio", "croce", "luna", "pipistrello", "ragno", "fantasma", "occhio", "pozione"];
  const RISPOSTE = ["0-0", "0-1", "0-2", "0-3", "0-4", "1-0", "1-1", "1-2", "1-3", "2-0", "2-1", "2-2", "3-0"];
  const MAX_TENTATIVI = 6;

  /** Le candele che un tentativo `a` riceve se la combinazione fosse `b`. */
  function candele(a, b) {
    let nere = 0;
    const ca = [0, 0, 0, 0, 0, 0], cb = [0, 0, 0, 0, 0, 0];
    for (let i = 0; i < 4; i++) {
      if (a[i] === b[i]) nere++;
      else { ca[a[i]]++; cb[b[i]]++; }
    }
    let bianche = 0;
    for (let s = 0; s < 6; s++) bianche += Math.min(ca[s], cb[s]);
    return { nere, bianche };
  }

  /** Le 1296 combinazioni, in ordine: indice = a·216 + b·36 + c·6 + d. */
  const TUTTE = [];
  for (let i = 0; i < 1296; i++) TUTTE.push([Math.floor(i / 216), Math.floor(i / 36) % 6, Math.floor(i / 6) % 6, i % 6]);

  /** Vive = le combinazioni che avrebbero dato esattamente quelle candele a tutti i tentativi del giro. */
  const vive = (tentativi) => TUTTE.filter((c) => tentativi.every((t) => {
    const r = candele(t.codice, c);
    return r.nere === t.nere && r.bianche === t.bianche;
  }));

  /** La risposta del lucchetto cattivo al tentativo `codice`. */
  function rispondi(tentativi, codice, preferenze) {
    const v = vive(tentativi);
    // 1. Quattro nere SOLO se l'unica combinazione viva è proprio quella provata.
    if (v.length === 1 && v[0].every((s, i) => s === codice[i])) return { nere: 4, bianche: 0 };
    // 2. Altrimenti divide le vive per risposta, ignorando "4-0", e sceglie il gruppo più grande.
    const gruppi = {};
    for (const c of v) {
      const r = candele(codice, c);
      if (r.nere === 4) continue;
      const k = `${r.nere}-${r.bianche}`;
      gruppi[k] = (gruppi[k] || 0) + 1;
    }
    // 3. A parità di grandezza vince la risposta che viene prima in variante.preferenze.
    let scelta = null;
    for (const k of preferenze) if (gruppi[k] && (scelta === null || gruppi[k] > gruppi[scelta])) scelta = k;
    const [nere, bianche] = scelta.split("-").map(Number);
    return { nere, bianche };
  }

  const codiceValido = (c) => Array.isArray(c) && c.length === 4 && c.every((s) => Number.isInteger(s) && s >= 0 && s <= 5);
  const stessoCodice = (a, b) => a.every((s, i) => s === b[i]);

  function statoIniziale() {
    return { rotelle: [0, 0, 0, 0], tentativi: [], giro: 1, aperto: false };
  }
  function clona(s) {
    return {
      rotelle: [...s.rotelle],
      tentativi: s.tentativi.map((t) => ({ codice: [...t.codice], nere: t.nere, bianche: t.bianche })),
      giro: s.giro,
      aperto: s.aperto,
    };
  }

  const MOTIVO_ERRORE = "Sei tentativi senza aprire: il lucchetto si azzera";

  /** stato + mossa → nuovo stato ed esito. Non tocca né il disegno né il kit. */
  function applica(stato, mossa, variante) {
    if (!mossa || typeof mossa !== "object") return { stato, esito: { valida: false, motivo: "mossa non valida" } };
    if (mossa.tipo === "rotella") {
      const { rotella, verso } = mossa;
      if (!Number.isInteger(rotella) || rotella < 0 || rotella > 3) return { stato, esito: { valida: false, motivo: "rotella inesistente" } };
      if (verso !== 1 && verso !== -1) return { stato, esito: { valida: false, motivo: "verso non valido" } };
      const ns = clona(stato);
      ns.rotelle[rotella] = (ns.rotelle[rotella] + verso + 6) % 6;
      return { stato: ns, esito: { ok: true, rotelle: [...ns.rotelle] } };
    }
    if (mossa.tipo === "prova") {
      const codice = mossa.codice === undefined ? stato.rotelle : mossa.codice;
      if (!codiceValido(codice)) return { stato, esito: { valida: false, motivo: "combinazione non valida" } };
      if (stato.tentativi.some((t) => stessoCodice(t.codice, codice))) return { stato, esito: { valida: false, motivo: "già provata" } };
      const ns = clona(stato);
      ns.rotelle = [...codice];
      const r = rispondi(stato.tentativi, codice, variante.preferenze);
      ns.tentativi.push({ codice: [...codice], nere: r.nere, bianche: r.bianche });
      const n = ns.tentativi.length;
      if (r.nere === 4) {
        ns.aperto = true;
        return { stato: ns, esito: { risolto: true, nere: 4, bianche: 0, tentativo: n } };
      }
      if (n === MAX_TENTATIVI) {
        ns.tentativi = [];
        ns.giro += 1;
        return { stato: ns, esito: { errore: true, nere: r.nere, bianche: r.bianche, tentativo: MAX_TENTATIVI, motivo: MOTIVO_ERRORE } };
      }
      return { stato: ns, esito: { ok: true, nere: r.nere, bianche: r.bianche, tentativo: n, rimasti: MAX_TENTATIVI - n } };
    }
    return { stato, esito: { valida: false, motivo: "tipo di mossa sconosciuto" } };
  }

  /** Le candele in parole, per il fumetto. */
  function inParole(nere, bianche) {
    if (nere === 0 && bianche === 0) return "Nessuna candela accesa";
    if (bianche === 0) return `${nere} ${nere === 1 ? "candela nera" : "candele nere"}`;
    if (nere === 0) return `${bianche} ${bianche === 1 ? "candela bianca" : "candele bianche"}`;
    return `${nere} ${nere === 1 ? "nera" : "nere"} e ${bianche} ${bianche === 1 ? "bianca" : "bianche"}`;
  }

  function testoCarta(simboli) {
    return "Il cancello è chiuso da un lucchetto con quattro rotelle. Su ognuna si sceglie uno dei sei simboli incisi sulle lapidi del cortile ("
      + simboli.join(", ")
      + "), e lo stesso simbolo può tornare più volte. A ogni tentativo il lucchetto accende delle candele: una nera per ogni simbolo giusto al posto giusto, una bianca per ogni simbolo giusto ma al posto sbagliato. Hai sei tentativi: se li finisci senza aprire, il lucchetto si azzera e si ricomincia da capo.\n"
      + "Attenzione: il lucchetto è stregato e la combinazione non l'ha ancora decisa. Finché può cambia idea per farti sbagliare, ma non mente mai: le sue candele sono sempre giuste per almeno una combinazione.";
  }

  /** Legge lo stato dalla memoria del kit; null se manca o è malformato. */
  function leggiMemoria(m) {
    if (!m || !codiceValido(m.rotelle) || !Array.isArray(m.tentativi) || m.tentativi.length > MAX_TENTATIVI) return null;
    if (!Number.isInteger(m.giro) || m.giro < 1) return null;
    const ok = m.tentativi.every((t) => t && codiceValido(t.codice) && Number.isInteger(t.nere) && Number.isInteger(t.bianche)
      && t.nere >= 0 && t.nere <= 4 && t.bianche >= 0 && t.bianche <= 4);
    if (!ok) return null;
    return clona({ rotelle: m.rotelle, tentativi: m.tentativi, giro: m.giro, aperto: m.aperto === true });
  }

  // ───────────────────────────── Sprite ─────────────────────────────

  const SIMBOLI = {
    teschio: {
      colori: { k: C.bordo, w: C.bianco, s: C.pietraChiara },
      righe: [
        "...........",
        "...kkkkk...",
        "..kwwwwsk..",
        ".kwwwwwwsk.",
        ".kwwwwwwsk.",
        ".kwkkwkksk.",
        ".kwkkwkksk.",
        ".kwwwkwwsk.",
        "..kwwwwsk..",
        "..kwkwksk..",
        "...kkkkk...",
      ],
    },
    croce: {
      colori: { k: C.bordo, h: G.acquamarina[2], a: C.acqua, A: G.acquamarina[0] },
      righe: [
        "...kkkkk...",
        "...khaAk...",
        "kkkkhaAkkkk",
        "khhhhaahhhk",
        "kaaaaaaaaAk",
        "kAAAAaAAAAk",
        "kkkkhaAkkkk",
        "...khaAk...",
        "...khaAk...",
        "...khaAk...",
        "...kkkkk...",
      ],
    },
    luna: {
      colori: { k: C.bordo, l: C.luna, y: C.giallo, o: C.oro },
      righe: [
        "...kkkkk...",
        "..kllyyyk..",
        ".kllyykkk..",
        "kllyyk.....",
        "kllyk......",
        "klyyk......",
        "klyyk......",
        "kyyyok.....",
        ".kyyookkk..",
        "..kyooook..",
        "...kkkkk...",
      ],
    },
    pipistrello: {
      colori: { k: C.bordo, q: C.lilla, p: C.viola, y: C.giallo },
      righe: [
        "...........",
        "...k...k...",
        "k..kk.kk..k",
        "kk.kqkqk.kk",
        "kqkkqqqkkqk",
        "kqqkyqykqqk",
        "kqqqqqqqqpk",
        "kqqqqqqqppk",
        "kqpkqqqkppk",
        ".kk.kqk.kk.",
        ".....k.....",
      ],
    },
    ragno: {
      colori: { k: C.bordo, r: C.tappetoChiaro, R: C.tappeto, h: G.rubino[2], w: C.bianco },
      righe: [
        "..r.....r..",
        ".r..kkk..r.",
        ".r.khhrk.r.",
        "..rkhrrkr..",
        "rrrkrrRkrrr",
        "...kwRwk...",
        "rrkrrrRRkrr",
        "..rkrRRkr..",
        ".r.krRRk.r.",
        ".r..kkk..r.",
        "..r.....r..",
      ],
    },
    fantasma: {
      colori: { k: C.bordo, W: C.bianco, N: C.notteChiara, n: C.ferroChiaro },
      righe: [
        "...kkkkk...",
        "..kWWNNNk..",
        ".kWWNNNNNk.",
        ".kWkkNkkNk.",
        ".kNkkNkkNk.",
        ".kNNNNNNnk.",
        ".kNNNkNNnk.",
        ".kNNNNNNnk.",
        ".kNNNNNNnk.",
        ".kNkNNNkNk.",
        ".kk.kkk.kk.",
      ],
    },
    occhio: {
      colori: { k: C.bordo, W: C.bianco, s: C.pietraChiara, e: C.erbaChiara, E: C.erba },
      righe: [
        "...........",
        "..k.k.k.k..",
        "...kkkkk...",
        ".kkWeeeskk.",
        "kWWeWkeessk",
        "kWWekkkessk",
        "kWsEEkEEssk",
        ".kksEEEskk.",
        "...kkkkk...",
        "...........",
        "...........",
      ],
    },
    pozione: {
      colori: { k: C.bordo, f: C.legnoLuce, W: C.bianco, r: C.rosa, R: C.tappeto },
      righe: [
        "....kkk....",
        "...kfffk...",
        "....kkk....",
        "....kWk....",
        "...kkWkk...",
        "..kWrrrrk..",
        ".kWrrWrrRk.",
        ".krrrrrrRk.",
        ".krrrrrRRk.",
        "..kRRRRRk..",
        "...kkkkk...",
      ],
    },
  };

  const ANELLO = [".kkkkkk.", "kssSSSdk", "ks.kk.dk", "kS.kk.dk", "kSdddddk", ".kkkkkk."];
  const MAGLIA = ["kkkkkkkk", "ksSSSSdk", "kkkkkkkk"];
  const COL_ACCIAIO = { k: C.bordo, s: C.pietraChiara, S: C.pietra, d: C.ferroChiaro };
  const ARCO = [
    "....kkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkk....",
    "..kkssssssssssssssssssssssssssssssssssssssssssssssssskk..",
    ".kssSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSssk.",
    ".ksSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSddk.",
    "ksSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSddk",
    "ksSSSSSSSSdddddddddddddddddddddddddddddddddddddSSSSSSSddk",
    "ksSSSSSSSdddddddddddddddddddddddddddddddddddddddSSSSSSddk",
    "ksSSSSSSddkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkksdSSSSSddk",
    "ksSSSSSddk.....................................ksdSSSSddk",
    "ksSSSSddk.......................................ksSSSSddk",
    ...Array(17).fill("ksSSSddk.........................................ksSSSddk"),
  ];
  const RIVETTO = [".k.", "kyk", ".k."];
  const COL_RIVETTO = { k: C.legnoChiaro, y: C.giallo };

  const OCCHI = {
    normale: ["..kkkkkkk..", ".khhaaaaak.", "khaaaKaaaak", "kaaaaKaaaak", "kaaaaKaaaAk", ".kaaaaaaAk.", "..kkkkkkk.."],
    sinistra: ["..kkkkkkk..", ".khhaaaaak.", "khaKaaaaaak", "kaaKaaaaaak", "kaaKaaaaaAk", ".kaaaaaaAk.", "..kkkkkkk.."],
    destra: ["..kkkkkkk..", ".khhaaaaak.", "khaaaaaKaak", "kaaaaaaKaak", "kaaaaaaKaAk", ".kaaaaaaAk.", "..kkkkkkk.."],
    ghigno: ["kkk........", "kaakkkk....", "kaaaaKakkk.", "kaaaaKaaaak", ".kaaaaaaAk.", "..kkkkkkk..", "..........."],
    sorpreso: ["..kkkkkkk..", ".khhaaaaak.", "khaaaaaaaak", "kaaaaKaaaak", "kaaaaaaaaAk", ".kaaaaaaAk.", "..kkkkkkk.."],
    ride: ["...........", "...kkkkk...", "..kaaaaak..", ".kaakkkaak.", "kaak...kaak", "kkk.....kkk", "..........."],
    spento: ["...........", "...........", "...........", ".kkkkkkkkk.", "..kkkkkkk..", "...........", "..........."],
  };
  const CIGLIA = {
    piatta: ["...........", ".kkkkkkkkk."],
    cattiva: ["kkkkk......", "..kkkkkkkkk"],
    alta: ["..kkkkkkk..", "..........."],
  };
  const COL_OCCHI = { k: C.bordo, a: C.acqua, h: G.acquamarina[2], A: G.acquamarina[0], K: C.bordo };
  const COL_OCCHI_RABBIA = { k: C.bordo, a: C.tappetoChiaro, h: G.rubino[2], A: C.tappeto, K: C.bordo };
  const COL_CIGLIA = { k: C.bordo };

  const FRECCIA_SU = ["....k....", "...kWk...", "..kWWWk..", ".kWWWWsk.", ".kkkkkkk."];
  const FRECCIA_GIU = [".kkkkkkk.", ".kWWWWsk.", "..kWWsk..", "...kWk...", "....k...."];
  const COL_FRECCIA = { k: C.bordo, W: C.pietraChiara, s: C.pietra };
  const COL_FRECCIA_TOCCATA = { k: C.bordo, W: C.giallo, s: C.oro };

  const PIATTINO = ["kkkkkkk", ".kdddk."];
  const COL_PIATTINO = { k: C.bordo, d: C.ferro };
  const CERA = {
    nera: ["kkkkk", "kmnnk", "kmnnk", "kmnnk", "kmnnk", "kmnnk"],
    bianca: ["kkkkk", "kWWsk", "kWWsk", "kWWsk", "kWWsk", "kWssk"],
  };
  const COL_CERA = {
    nera: { k: C.bordo, m: C.ferro, n: C.nero },
    bianca: { k: C.bordo, W: C.bianco, s: C.pietraChiara },
  };
  const FIAMMA = [
    ["..y..", ".yhy.", ".yhy.", "..k.."],
    [".y...", "..yy.", ".yhy.", "..k.."],
  ];
  const COL_FIAMMA = { y: C.fiamma, h: C.fiammaChiara, k: C.bordo };

  const CORVO = [
    "...kkk......",
    "..knnnk.....",
    ".knynnnk....",
    "kOOknnnk....",
    ".kkknnnnkk..",
    "...knnnnnnk.",
    "...knmmmnnnk",
    "....knmmmnnk",
    ".....knnnnk.",
    "......kOkOk.",
  ];
  const CORVO_GRACCHIA = [
    "...kkk......",
    "..knnnk.....",
    "kknynnnk....",
    "kOOknnnk....",
    "kOOknnnnkk..",
    ".kkknnnnnnk.",
    "...knmmmnnnk",
    "....knmmmnnk",
    ".....knnnnk.",
    "......kOkOk.",
  ];
  const COL_CORVO = { k: C.bordo, n: C.violaScuro, m: C.viola, y: C.giallo, O: C.oro };
  const COL_CORVO_OCCHIO_CHIUSO = { ...COL_CORVO, y: C.violaScuro };

  const TESTA_ZUCCO = [
    "......Gg......",
    ".....GGg......",
    "..kkkkkkkkkk..",
    ".koOOyyyOOOok.",
    "koOOyyhyyOOOok",
    "koOyEEyyOEEOok",
    "koOEeeEyOEeeEk",
    "koOOEEOOEOEEOk",
    "koOOOOOEEOOOOk",
    "koObEbEbEbEbOk",
    "kooOeEeEeEeOok",
    ".kooOOOOOOOok.",
    "..kkkkkkkkkk..",
  ];
  const COL_ZUCCO = {
    k: C.bordo, o: "#9c3b17", O: C.brace, y: C.fiamma, h: C.fiammaChiara, b: C.legno,
    G: C.erbaScura, g: C.erba, E: C.oro, e: C.luna,
  };

  const STELLA = [
    ["..y..", "..y..", "yyWyy", "..y..", "..y.."],
    [".....", "..y..", ".yWy.", "..y..", "....."],
  ];
  const COL_STELLA = { W: C.bianco, y: C.giallo };

  // ───────────────────────────── Funzioni di disegno ─────────────────────────────

  /** Vela: colora solo i pixel dove il retino Bayer è sotto `quanto` (0..1); gli altri restano come sono. */
  function vela(ctx, colore, x, y, w, h, quanto) {
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
      const px = x + i, py = y + j;
      if (EscapeDemo.BAYER[py & 3][px & 3] / 16 < quanto) rett(ctx, colore, px, py, 1, 1);
    }
  }
  /** Lo sprite tutto di un colore (sagoma): per i simboli che spuntano sopra e sotto la finestra delle rotelle. */
  function sagoma(ctx, righe, colore, x, y) {
    const col = {};
    for (const r of righe) for (const ch of r) if (ch !== ".") col[ch] = colore;
    sprite(ctx, righe, col, x, y);
  }

  const X = (i) => 119 + 22 * i;

  // ───────────────────────────── Il gioco ─────────────────────────────

  const opzioni = {
    id: "lucchetto-lapidi",
    sfondo: "cancello",
    velo: 0.5,

    variante(rng) {
      const simboli = EscapeDemo.mescola(rng, DISEGNI).slice(0, 6); // i 6 simboli, nell'ordine delle rotelle
      const preferenze = EscapeDemo.mescola(rng, RISPOSTE);          // ordine di spareggio
      return { simboli, preferenze };
    },

    crea(g) {
      opzioni.testo = testoCarta(g.variante.simboli);
      const variante = g.variante;
      const ctx = g.ctx;

      let stato = leggiMemoria(g.memoria.stato) || statoIniziale();
      if (g.giaRisolto) stato.aperto = true;

      // Animazioni (solo disegno): l'azione in corso, le rotelle che scorrono, i lampi.
      let anim = null;        // { tipo: "prova" | "errore" | "aperto", t0, riga, righe? }
      const scorri = [null, null, null, null]; // per rotella: { t0, verso }
      let lampo = null;       // { riga, t0 }: combinazione già provata
      let selezione = null;   // rotella scelta con la tastiera

      function salvaTutto() {
        g.memoria.stato = clona(stato);
        g.salvaMemoria();
      }

      function mossa(m) {
        if (stato.aperto) return { valida: false, motivo: "il lucchetto è già aperto" };
        const prima = stato;
        const codiceUsato = m && typeof m === "object" && m.tipo === "prova" && m.codice === undefined ? prima.rotelle : (m && m.codice);
        const r = applica(stato, m, variante);
        const esito = r.esito;

        if (esito.valida === false) {
          if (esito.motivo === "già provata") {
            g.messaggio("Questa combinazione l'hai già provata: cambia almeno un simbolo.");
            const riga = prima.tentativi.findIndex((t) => stessoCodice(t.codice, codiceUsato));
            lampo = { riga, t0: g.tempo };
          }
          return esito;
        }

        stato = r.stato;
        salvaTutto();

        if (m.tipo === "rotella") {
          if (!g.riduciMovimento) scorri[m.rotella] = { t0: g.tempo, verso: m.verso };
          return esito;
        }

        // Prova: la vecchia animazione salta al suo finale.
        anim = null;
        const n = esito.tentativo;
        if (esito.risolto) {
          g.messaggio("Quattro candele nere: clac! Il lucchetto si apre.");
          if (!g.riduciMovimento) anim = { tipo: "aperto", t0: g.tempo, riga: n - 1 };
          const nomi = stato.tentativi[n - 1].codice.map((s) => variante.simboli[s]).join(", ");
          g.risolto({
            riepilogo: "Il lucchetto non poteva più cambiare idea: la combinazione era " + nomi + ". Aperto al " + n + "° tentativo.",
            ritardo: 2600,
          });
        } else if (esito.errore) {
          const copia = prima.tentativi.concat([{ codice: [...codiceUsato], nere: esito.nere, bianche: esito.bianche }]);
          if (!g.riduciMovimento) anim = { tipo: "errore", t0: g.tempo, riga: n - 1, righe: copia };
          g.errore(MOTIVO_ERRORE);
          g.messaggio(`${inParole(esito.nere, esito.bianche)}. Il lucchetto ride e cancella tutto: si ricomincia.`);
        } else {
          if (!g.riduciMovimento) anim = { tipo: "prova", t0: g.tempo, riga: n - 1 };
          const k = esito.rimasti;
          g.messaggio(k >= 2 ? `${inParole(esito.nere, esito.bianche)}. Restano ${k} tentativi.` : `${inParole(esito.nere, esito.bianche)}. Ultimo tentativo!`);
        }
        return esito;
      }

      // ── Tocchi ──
      let freccia = null; // { i, verso, t0 }
      g.tocca(({ tipo, x, y }) => {
        if (tipo !== "giu") return;
        const px = Math.floor(x), py = Math.floor(y);
        for (let i = 0; i < 4; i++) {
          if (px >= X(i) - 2 && px <= X(i) + 18) {
            let verso = 0;
            if (py >= 58 && py <= 84) verso = -1;
            else if (py >= 85 && py <= 114) verso = 1;
            if (verso) {
              freccia = { i, verso, t0: g.tempo };
              mossa({ tipo: "rotella", rotella: i, verso });
            }
            return;
          }
        }
      });

      g.bottone("Prova", () => mossa({ tipo: "prova" }), { id: "prova", forte: true });

      // Tastiera (facoltativa): ←/→ scelgono la rotella, ↑/↓ la girano, Invio prova.
      addEventListener("keydown", (e) => {
        if (stato.aperto || document.querySelector(".kit-velo-carta:not([hidden])")) return;
        if (e.key === "ArrowLeft") { selezione = selezione === null ? 3 : (selezione + 3) % 4; e.preventDefault(); }
        else if (e.key === "ArrowRight") { selezione = selezione === null ? 0 : (selezione + 1) % 4; e.preventDefault(); }
        else if ((e.key === "ArrowUp" || e.key === "ArrowDown") && selezione !== null) {
          const verso = e.key === "ArrowUp" ? -1 : 1;
          freccia = { i: selezione, verso, t0: g.tempo };
          mossa({ tipo: "rotella", rotella: selezione, verso });
          e.preventDefault();
        } else if (e.key === "Enter") { mossa({ tipo: "prova" }); e.preventDefault(); }
      });

      // ── Messaggio iniziale ──
      if (g.giaRisolto) g.messaggio("Il lucchetto è aperto.");
      else if (stato.tentativi.length > 0) {
        const k = MAX_TENTATIVI - stato.tentativi.length;
        g.messaggio(k === 1 ? "Resta 1 tentativo: gira le rotelle e premi «Prova»." : `Restano ${k} tentativi: gira le rotelle e premi «Prova».`);
      } else g.messaggio("Tocca sopra o sotto una rotella per girarla, poi premi «Prova».");

      // ───────── Disegno ─────────

      function lanterna(cx, b) {
        rett(ctx, C.fiammaChiara, cx - 3, 27, 7, 10);
        if (b) {
          rett(ctx, C.fiamma, cx - 3, 30, 7, 7);
          rett(ctx, C.bianco, cx + 1, 30, 1, 2);
        } else {
          rett(ctx, C.fiamma, cx - 3, 32, 7, 5);
          rett(ctx, C.bianco, cx - 2, 29, 1, 2);
        }
        rett(ctx, C.bordo, cx, 27, 1, 10);
      }

      function catena() {
        const passi = [];
        for (let x = 106; x + 8 <= 216; x += 6) passi.push(x);
        passi.forEach((x, p) => { if (p % 2 === 1) sprite(ctx, MAGLIA, COL_ACCIAIO, x, 34); });
        passi.forEach((x, p) => { if (p % 2 === 0) sprite(ctx, ANELLO, COL_ACCIAIO, x, 32); });
      }

      function arco(salto) {
        sprite(ctx, ARCO, COL_ACCIAIO, 132, 22 - salto);
        if (salto > 0) {
          for (let y = 49 - salto; y <= 48; y++) sprite(ctx, ["ksSSSddk"], COL_ACCIAIO, 181, y);
          sprite(ctx, ["ksSSSddk", ".kkkkkk."], COL_ACCIAIO, 132, 47 - salto);
        }
      }

      function corpo() {
        const BX = 113, BY = 46, BW = 95, BH = 85;
        const SMUSSA = [2, 1];
        for (let r = 0; r < BH; r++) {
          const d = SMUSSA[r] ?? SMUSSA[BH - 1 - r] ?? 0;
          rett(ctx, C.bordo, BX + d, BY + r, BW - 2 * d, 1);
        }
        for (let r = 1; r < BH - 1; r++) {
          const d = SMUSSA[r - 1] ?? SMUSSA[BH - 2 - r] ?? 0;
          rett(ctx, C.oroScuro, BX + 1 + d, BY + r, BW - 2 - 2 * d, 1);
        }
        rett(ctx, C.oro, BX + 2, BY + 1, BW - 4, 1);
        rett(ctx, C.oro, BX + 1, BY + 2, 1, BH - 4);
        rett(ctx, C.giallo, BX + 3, BY + 1, 10, 1);
        rett(ctx, C.giallo, BX + 1, BY + 3, 1, 6);
        rett(ctx, C.brace, BX + BW - 3, BY + 2, 2, BH - 4);
        rett(ctx, C.brace, BX + 2, BY + BH - 3, BW - 4, 2);
        rett(ctx, C.bordo, 133, BY, 6, 2);
        rett(ctx, C.bordo, 182, BY, 6, 2);
        for (const [rx, ry] of [[117, 50], [201, 50], [117, 123], [201, 123]]) sprite(ctx, RIVETTO, COL_RIVETTO, rx, ry);
      }

      function faccia(nome, nomeS, nomeD, rabbia, dy, ciglia) {
        const col = rabbia ? COL_OCCHI_RABBIA : COL_OCCHI;
        sprite(ctx, CIGLIA[ciglia], COL_CIGLIA, 141, 47 + dy);
        sprite(ctx, CIGLIA[ciglia], COL_CIGLIA, 169, 47 + dy, { specchia: true });
        sprite(ctx, OCCHI[nomeS], col, 141, 50 + dy);
        sprite(ctx, OCCHI[nomeD], col, 169, 50 + dy, { specchia: nome === "ghigno" });
      }

      function occhi(el, f) {
        const aperto = stato.aperto;
        let nome = aperto ? "spento" : "normale";
        let rabbia = false, dy = 0, ciglia = "piatta";
        let sx = null, dx = null;
        if (anim && el >= 0) {
          if (el < 400) nome = Math.floor(el / 100) % 2 === 0 ? "sinistra" : "destra";
          else if (el < 1200) nome = "normale";
          else if (anim.tipo === "prova") nome = el < 2100 ? "ghigno" : "normale";
          else if (anim.tipo === "errore") {
            if (el < 2800) { nome = "ride"; rabbia = true; dy = Math.floor(el / 125) % 2; } else nome = "normale";
          } else if (anim.tipo === "aperto") nome = el < 1700 ? "sorpreso" : "spento";
        } else if (nome === "normale" && !g.riduciMovimento) {
          if (f % 40 === 0) sx = "spento";
          else if (f % 40 === 20) dx = "spento";
        }
        if (nome === "ghigno" || nome === "ride") ciglia = "cattiva";
        else if (nome === "sorpreso") ciglia = "alta";
        faccia(nome, sx || nome, dx || nome, rabbia, dy, ciglia);
      }

      function rotella(i, f) {
        const x = X(i);
        const v = stato.rotelle[i];
        const s = scorri[i];
        let scorrimento = 0;
        if (s && !g.riduciMovimento) {
          const t = g.tempo - s.t0;
          if (t < 160) scorrimento = Math.round(13 * s.verso * (1 - t / 160));
          else scorri[i] = null;
        }
        const toccata = freccia && freccia.i === i && g.tempo - freccia.t0 < 150;
        sprite(ctx, FRECCIA_SU, toccata && freccia.verso < 0 ? COL_FRECCIA_TOCCATA : COL_FRECCIA, x + 4, 60);
        sprite(ctx, FRECCIA_GIU, toccata && freccia.verso > 0 ? COL_FRECCIA_TOCCATA : COL_FRECCIA, x + 4, 107);
        riquadro(ctx, x, 66, 17, 39, C.ferro);
        rett(ctx, C.ferroChiaro, x + 1, 67, 1, 37);
        rett(ctx, C.bordo, x + 15, 67, 1, 37);
        ctx.save();
        ctx.beginPath();
        ctx.rect(x + 1, 67, 15, 37);
        ctx.clip();
        for (let j = -2; j <= 2; j++) {
          const sim = SIMBOLI[variante.simboli[(v + j + 12) % 6]];
          const y = 80 + 13 * j + scorrimento;
          if (Math.abs(13 * j + scorrimento) < 7) sprite(ctx, sim.righe, sim.colori, x + 3, y);
          else sagoma(ctx, sim.righe, C.ferroChiaro, x + 3, y);
        }
        ctx.restore();
        vela(ctx, C.bordo, x + 1, 67, 15, 2, 0.75);
        vela(ctx, C.bordo, x + 1, 69, 15, 2, 0.4);
        vela(ctx, C.bordo, x + 1, 100, 15, 2, 0.4);
        vela(ctx, C.bordo, x + 1, 102, 15, 2, 0.75);
        const cornice = selezione === i ? C.giallo : C.oro;
        rett(ctx, cornice, x, 78, 17, 1);
        rett(ctx, cornice, x, 92, 17, 1);
        rett(ctx, C.oroScuro, x, 79, 1, 13);
        rett(ctx, C.oroScuro, x + 16, 79, 1, 13);
      }

      function targhetta() {
        let scritta, colore = C.legnoScuro;
        if (stato.aperto) scritta = "APERTO";
        else if (anim && anim.tipo === "errore") { scritta = "TENTATIVO 6/6"; colore = C.tappeto; }
        else {
          const n = stato.tentativi.length + 1;
          scritta = `TENTATIVO ${n}/6`;
          if (n === 6) colore = C.tappeto;
        }
        riquadro(ctx, 128, 117, 65, 9, C.oro);
        rett(ctx, C.giallo, 129, 118, 63, 1);
        testo(ctx, scritta, 160, 119, { piccolo: true, ombra: null, allinea: "centro", colore });
      }

      const RIENTRO = [12, 8, 6, 4, 3, 2, 1, 1];
      const FACCIA = C.ferroChiaro, LUCE = C.pietra;
      function sagomaLapide(x, y, w, h, colore) {
        for (let r = 0; r < h; r++) { const d = RIENTRO[r] ?? 0; rett(ctx, colore, x + d, y + r, w - 2 * d, 1); }
      }

      function lapide(x0, prima, righe, el, prossimo) {
        const y0 = 50, w = 86, h = 95;
        riquadro(ctx, x0 - 3, y0 + h - 1, w + 6, 8, C.ferroChiaro);
        rett(ctx, C.pietra, x0 - 2, y0 + h, w + 4, 1);
        rett(ctx, C.ferro, x0 - 2, y0 + h + 5, w + 4, 1);
        sagomaLapide(x0, y0, w, h, C.bordo);
        sagomaLapide(x0 + 1, y0 + 1, w - 2, h - 1, C.ferro);
        sagomaLapide(x0 + 1, y0 + 1, w - 4, h - 1, FACCIA);
        sagomaLapide(x0 + 2, y0 + 2, w - 6, h - 2, FACCIA);
        for (let r = 1; r < h - 1; r++) rett(ctx, LUCE, x0 + 1 + (RIENTRO[r] ?? 0), y0 + r, 1, 1);
        sagomaLapide(x0 + 1, y0 + 1, w - 2, 1, LUCE);
        vela(ctx, C.ferro, x0 + 2, y0 + h - 14, w - 4, 13, 0.25);
        for (const [mx, my, c] of [[2, 88, C.erba], [3, 89, C.erbaScura], [4, 90, C.erba], [2, 90, C.erbaChiara],
          [5, 91, C.erbaScura], [3, 91, C.erba], [w - 6, 90, C.erbaScura], [w - 5, 91, C.erba]]) rett(ctx, c, x0 + mx, y0 + my, 1, 1);
        for (const [cx, cy] of [[w - 14, 4], [w - 13, 5], [w - 13, 6], [w - 12, 7], [w - 11, 8], [w - 11, 9]]) rett(ctx, C.ferro, x0 + cx, y0 + cy, 1, 1);
        testo(ctx, "R.I.P.", x0 + w / 2, y0 + 5, { piccolo: true, colore: C.ferro, ombra: LUCE, allinea: "centro" });

        const sbriciola = anim && anim.tipo === "errore" && el >= 1600 ? Math.min(1, 0.25 * (Math.floor((el - 1600) / 125) + 1)) : 0;
        for (let r = 0; r < 3; r++) {
          const ry = y0 + 13 + 26 * r;
          const n = prima + r;
          const t = righe[n - 1];
          const animata = anim && anim.riga === n - 1 && t;
          const e = animata ? el : 1e9;
          // numero e freccetta
          if (n === prossimo) {
            testo(ctx, String(n), x0 + 5, ry + 9, { piccolo: true, colore: C.giallo, ombra: C.bordo });
            rett(ctx, C.giallo, x0 + 2, ry + 10, 1, 3);
            rett(ctx, C.giallo, x0 + 3, ry + 11, 1, 1);
          } else testo(ctx, String(n), x0 + 5, ry + 9, { piccolo: true, colore: C.ferro, ombra: LUCE });
          // incavi
          const lamp = lampo && lampo.riga === n - 1 && g.tempo - lampo.t0 < 375;
          const bordoInc = lamp ? C.giallo : C.bordo;
          for (let i = 0; i < 4; i++) {
            const sx = x0 + 10 + 14 * i, sy = ry + 5;
            rett(ctx, C.ferro, sx, sy, 13, 13);
            rett(ctx, bordoInc, sx, sy, 13, 1);
            rett(ctx, bordoInc, sx, sy, 1, 13);
            rett(ctx, LUCE, sx + 1, sy + 13, 13, 1);
            rett(ctx, LUCE, sx + 13, sy + 1, 1, 13);
            if (t && e >= 400 + 80 * i) {
              const sim = SIMBOLI[variante.simboli[t.codice[i]]];
              sprite(ctx, sim.righe, sim.colori, sx + 1, sy + 1);
            }
          }
          // candele
          const posti = [[66, 0], [74, 0], [66, 12], [74, 12]];
          const accese = t ? [...Array(t.nere).fill("nera"), ...Array(t.bianche).fill("bianca")] : [];
          for (let k = 0; k < 4; k++) {
            const cx = x0 + posti[k][0], cy = ry + posti[k][1];
            const tipoC = accese[k];
            if (tipoC && e >= 720 + 150 * k) {
              sprite(ctx, CERA[tipoC], COL_CERA[tipoC], cx + 1, cy + 4);
              const ff = g.riduciMovimento ? 0 : Math.floor((g.fotogramma + 3 * k + 5 * n) / 2) % 2;
              sprite(ctx, FIAMMA[ff], COL_FIAMMA, cx + 1, cy);
            }
            sprite(ctx, PIATTINO, COL_PIATTINO, cx, cy + 10);
          }
          if (sbriciola > 0) {
            for (let i = 0; i < 4; i++) vela(ctx, FACCIA, x0 + 10 + 14 * i, ry + 5, 14, 14, sbriciola);
            vela(ctx, FACCIA, x0 + 66, ry, 15, 24, sbriciola);
          }
        }
      }

      g.anima((tempo) => {
        const f = g.riduciMovimento ? 0 : g.fotogramma;
        let el = 0;
        if (anim) {
          el = tempo - anim.t0;
          const durata = anim.tipo === "prova" ? 2100 : anim.tipo === "errore" ? 2800 : 3300;
          if (el >= durata) anim = null;
        }
        if (lampo && tempo - lampo.t0 >= 375) lampo = null;
        ctx.clearRect(0, 0, g.larghezza, g.altezza);

        // lanterne e catena
        lanterna(100, !g.riduciMovimento && f % 3 === 0);
        lanterna(220, !g.riduciMovimento && f % 5 === 1);
        catena();

        // arco
        let salto = 0;
        if (stato.aperto) salto = anim && anim.tipo === "aperto" ? (el < 1700 ? 0 : Math.min(6, Math.floor((el - 1700) / 50))) : 6;
        arco(salto);
        corpo();

        // occhi
        occhi(el, f);

        // pannello e rotelle
        riquadro(ctx, 116, 58, 89, 56, C.legnoScuro);
        rett(ctx, C.bordo, 117, 59, 87, 1);
        rett(ctx, C.oro, 116, 114, 89, 1);
        for (let i = 0; i < 4; i++) rotella(i, f);
        targhetta();

        // lapidi
        const righe = anim && anim.tipo === "errore" ? anim.righe : stato.tentativi;
        const prossimo = stato.aperto || (anim && anim.tipo === "errore") ? -1 : stato.tentativi.length + 1;
        lapide(7, 1, righe, el, prossimo);
        lapide(228, 4, righe, el, prossimo);

        // corvo
        const gracchia = anim && anim.tipo === "errore" && el >= 1200 && el < 2800 && Math.floor(el / 125) % 2 === 0;
        const chiuso = !g.riduciMovimento && f % 32 === 0;
        sprite(ctx, gracchia ? CORVO_GRACCHIA : CORVO, chiuso ? COL_CORVO_OCCHIO_CHIUSO : COL_CORVO, 280, 41);

        // Zucco
        let zx = 153, zy = 138 + (g.riduciMovimento ? 0 : Math.floor(f / 4) % 2);
        if (anim && anim.tipo === "errore" && el >= 1200 && el < 1950) zx += Math.floor(el / 125) % 2 === 0 ? 1 : -1;
        if (anim && anim.tipo === "aperto" && el >= 2000) {
          const passo = Math.floor((el - 2000) / 125);
          if (passo < 10) zy = 138 + [-2, -4, -4, -2, 0][passo % 5];
        }
        rett(ctx, C.bordo, 155, 151, 10, 1);
        sprite(ctx, TESTA_ZUCCO, COL_ZUCCO, zx, zy);

        // effetti
        if (anim && anim.tipo === "errore" && el >= 1200 && el < 1575) {
          rett(ctx, C.tappetoChiaro, 112, 45, 97, 1);
          rett(ctx, C.tappetoChiaro, 112, 131, 97, 1);
          rett(ctx, C.tappetoChiaro, 112, 45, 1, 87);
          rett(ctx, C.tappetoChiaro, 208, 45, 1, 87);
        }
        if (anim && anim.tipo === "aperto" && el >= 2000 && el < 3200) {
          [[124, 18], [194, 22], [126, 40], [198, 42]].forEach(([cx, cy], j) => {
            sprite(ctx, STELLA[(g.fotogramma + j) % 2], COL_STELLA, cx - 2, cy - 2);
          });
        }
      });

      // ── Aggancio per le prove ──
      g.espone({
        gioca: (m) => mossa(m),
        statoGioco: () => ({
          rotelle: [...stato.rotelle],
          tentativi: stato.tentativi.map((t) => ({ codice: [...t.codice], nere: t.nere, bianche: t.bianche })),
          rimasti: MAX_TENTATIVI - stato.tentativi.length,
          giro: stato.giro,
          aperto: stato.aperto,
        }),
        posizione: (i, verso) => ({ x: X(i) + 8, y: verso < 0 ? 62 : 109 }),
      });
    },
  };

  EscapeDemo.avvia(opzioni);
})();
