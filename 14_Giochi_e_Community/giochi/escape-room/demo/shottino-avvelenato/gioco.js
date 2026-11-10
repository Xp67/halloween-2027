// Lo shottino avvelenato: quattro pipistrelli assaggiatori, sedici shottini, una sola ora.
// Il giocatore segna chi assaggia cosa; il barista, se due shottini hanno gli stessi assaggiatori, mette il veleno lì.

(function () {
  "use strict";
  const { C, GEMME, rett, sprite, testo, mescola } = EscapeDemo;

  // ───────────────────────── Logica pura (stato + mossa → nuovo stato ed esito) ─────────────────────────
  const P = 4, N = 16;
  const NOMI = ["rosso", "giallo", "azzurro", "bianco"];

  function statoIniziale() {
    return { fase: "assegna", giro: 0, assaggi: Array(N).fill(0), verdi: null, gruppo: null, veleno: null };
  }
  function ordineDelGiro(variante, giro) {
    return Array.from({ length: N }, (_, k) => variante.ordine[(giro + k) % N]);
  }
  function bitAccesi(m) { return [0, 1, 2, 3].filter((i) => (m >> i) & 1); }

  function applica(stato, m, variante) {
    const no = (motivo) => ({ stato, esito: { valida: false, motivo } });
    const intero = (x, max) => Number.isInteger(x) && x >= 0 && x < max;
    if (!m || typeof m !== "object") return no("mossa sconosciuta");

    if (m.tipo === "segna") {
      if (stato.fase !== "assegna") return no("dopo l'ora le caselle non si cambiano");
      if (!intero(m.pipistrello, P) || !intero(m.shottino, N)) return no("casella fuori dalla griglia");
      if (m.valore !== undefined && typeof m.valore !== "boolean") return no("valore non valido");
      const assaggi = [...stato.assaggi];
      const b = 1 << m.pipistrello;
      const acceso = m.valore === undefined ? !(assaggi[m.shottino] & b) : m.valore;
      assaggi[m.shottino] = acceso ? assaggi[m.shottino] | b : assaggi[m.shottino] & ~b;
      return { stato: { ...stato, assaggi }, esito: { ok: true } };
    }

    if (m.tipo === "cancella") {
      if (stato.fase !== "assegna") return no("dopo l'ora le caselle non si cambiano");
      return { stato: { ...stato, assaggi: Array(N).fill(0) }, esito: { ok: true } };
    }

    if (m.tipo === "assaggia") {
      if (stato.fase !== "assegna") return no("l'ora è già passata");
      if (stato.assaggi.every((x) => x === 0)) return no("nessuno assaggia niente");
      const ord = ordineDelGiro(variante, stato.giro);
      const quanti = (x) => stato.assaggi.filter((y) => y === x).length;
      // Il barista è furbo: se ci sono shottini con gli stessi assaggiatori, il veleno va lì.
      const conGemello = ord.find((j) => quanti(stato.assaggi[j]) >= 2);
      const base = conGemello !== undefined ? conGemello : ord[0];
      const verdi = stato.assaggi[base];
      const gruppo = [];
      stato.assaggi.forEach((x, j) => { if (x === verdi) gruppo.push(j); });
      return {
        stato: { ...stato, fase: "indica", verdi, gruppo },
        esito: { ok: true, verdi: bitAccesi(verdi), indistinguibili: [...gruppo] },
      };
    }

    if (m.tipo === "indica") {
      if (stato.fase !== "indica") return no("prima gli assaggi e l'ora di attesa");
      if (!intero(m.shottino, N)) return no("shottino inesistente");
      const j = m.shottino;
      if (stato.gruppo.length === 1 && stato.gruppo[0] === j)
        return { stato: { ...stato, fase: "risolto", veleno: j }, esito: { risolto: true, veleno: j } };
      // Sbagliato. Se lo shottino era fra gli indistinguibili, il veleno «era» in un suo gemello:
      // il giocatore non poteva saperlo, quindi nessuna scelta a caso vince mai.
      const ord = ordineDelGiro(variante, stato.giro);
      const veleno = ord.find((k) => stato.gruppo.includes(k) && k !== j);
      return {
        stato: { ...stato, fase: "assegna", giro: stato.giro + 1, verdi: null, gruppo: null },
        esito: { errore: true, motivo: `Sbagliato: il veleno era nello shottino ${veleno + 1}`, veleno },
      };
    }

    return no("mossa sconosciuta");
  }

  // Lo stato salvato è ben formato?
  function statoValido(s) {
    const int = (x, a, b) => Number.isInteger(x) && x >= a && x <= b;
    if (!s || typeof s !== "object") return false;
    if (!["assegna", "indica", "risolto"].includes(s.fase)) return false;
    if (!int(s.giro, 0, 1e6)) return false;
    if (!Array.isArray(s.assaggi) || s.assaggi.length !== N || !s.assaggi.every((x) => int(x, 0, 15))) return false;
    if (s.fase === "assegna") return true;
    if (!int(s.verdi, 0, 15)) return false;
    if (!Array.isArray(s.gruppo) || !s.gruppo.length || !s.gruppo.every((x) => int(x, 0, 15))) return false;
    if (s.fase === "risolto" && !int(s.veleno, 0, 15)) return false;
    return true;
  }

  // ───────────────────────── Sprite ─────────────────────────
  const PIP_SU = [
    ".kk......k.....k......kk.",
    "kMMkk...kgk...kgk...kkMMk",
    "kmmMMkk.krkkkkkrk.kkMMmmk",
    "kmmmmMMkkGGggggdkkMMmmmmk",
    "kmmmmmmMmGyygyydmMmmmmmmk",
    ".kkmmmmmmgykgkydmmmmmmkk.",
    "...kmmmmmggggggdmmmmmk...",
    "...kmkmmmggkkkgdmmmkmk...",
    "....k.kmmggwgwgdmmk.k....",
    "......kmmggggggdmmk......",
    ".......kkppgggpqkk.......",
    "........kpppqppqk........",
    "........kpqgggqqk........",
    ".........kggggdk.........",
    "..........kggdk..........",
    "...........kkk...........",
  ];
  const PIP_GIU = [
    ".........k.....k.........",
    "........kgk...kgk........",
    "........krkkkkkrk........",
    "....kkkkkGGggggdkkkkk....",
    "..kkMMMMmGyygyydmMMMMkk..",
    ".kMMmmmmmgykgkydmmmmmMMk.",
    "kMmmmmmmmggggggdmmmmmmmMk",
    "kmmmmmmmmggkkkgdmmmmmmmmk",
    "kmmmmmmmmggwgwgdmmmmmmmmk",
    "kmmmmmmmmggggggdmmmmmmmmk",
    "kmkkmmmmkppgggpqkmmmmkkmk",
    ".k.kmkkkkpppqppqkkkkmk.k.",
    "....k...kpqgggqqk...k....",
    ".........kggggdk.........",
    "..........kggdk..........",
    "...........kkk...........",
  ];
  const GOCCIA = [
    ".....k.....",
    "....khk....",
    "....khk....",
    "...khppk...",
    "..khhpppk..",
    "..khppppk..",
    ".khhpppppk.",
    "khhWpppppqk",
    "khhpppppqqk",
    "khpppppqqqk",
    "kpppppqqqqk",
    ".kpppqqqqk.",
    "..kpqqqqk..",
    "...kkkkk...",
  ];
  const ANELLO = [
    ".kkkkk.",
    "keeeeek",
    "keeeerk",
    "keeeerk",
    "keeeerk",
    "kerrrrk",
    ".kkkkk.",
  ];
  const SHOT = [
    "kkkkkkkkkkk",
    "ksSeeeeeeBk",
    "ksSeeeeeeBk",
    "ksLLLLLLLBk",
    "ksSllllldBk",
    "ksSllllldBk",
    ".kslllldBk.",
    ".kslllldBk.",
    ".ksllldddk.",
    ".kssssssBk.",
    ".kbbbbbbBk.",
    ".kkkkkkkkk.",
  ];
  const SHOT_BEVUTO = [
    "kkkkkkkkkkk",
    "ksSeeeeeeBk",
    "ksSeeeeeeBk",
    "ksSeeeeeeBk",
    "ksLLLLLLLBk",
    "ksSllllldBk",
    ".kslllldBk.",
    ".kslllldBk.",
    ".ksllldddk.",
    ".kssssssBk.",
    ".kbbbbbbBk.",
    ".kkkkkkkkk.",
  ];
  const TESCHIETTO = [".www.", "wkwkw", "wwwww", ".w.w."];
  const CLESSIDRA = [
    [
      "kkkkkkkkkkk", "kLLLLLLLLLk", "kkkkkkkkkkk",
      ".ksaaaaaBk.", ".ksaaaaaBk.", "..ksaaaBk..", "...ksaBk...", "....kak....",
      "...ksaBk...", "..kseaeBk..", ".kseeaeeBk.", ".kseeaeeBk.",
      "kkkkkkkkkkk", "kLLLLLLLLLk", "kkkkkkkkkkk",
    ],
    [
      "kkkkkkkkkkk", "kLLLLLLLLLk", "kkkkkkkkkkk",
      ".kseeeeeBk.", ".ksaaaaaBk.", "..ksaaaBk..", "...ksaBk...", "....kak....",
      "...ksaBk...", "..kseaeBk..", ".kseeaeeBk.", ".kseaaaeBk.",
      "kkkkkkkkkkk", "kLLLLLLLLLk", "kkkkkkkkkkk",
    ],
    [
      "kkkkkkkkkkk", "kLLLLLLLLLk", "kkkkkkkkkkk",
      ".kseeeeeBk.", ".kseeeeeBk.", "..ksaaaBk..", "...ksaBk...", "....kak....",
      "...ksaBk...", "..kseaeBk..", ".kseaaaeBk.", ".ksaaaaaBk.",
      "kkkkkkkkkkk", "kLLLLLLLLLk", "kkkkkkkkkkk",
    ],
    [
      "kkkkkkkkkkk", "kLLLLLLLLLk", "kkkkkkkkkkk",
      ".kseeeeeBk.", ".kseeeeeBk.", "..kseaeBk..", "...ksaBk...", "....kak....",
      "...ksaBk...", "..kseaeBk..", ".ksaaaaaBk.", ".ksaaaaaBk.",
      "kkkkkkkkkkk", "kLLLLLLLLLk", "kkkkkkkkkkk",
    ],
  ];
  const TESCHIO = [
    "..kkkkk..",
    ".kwwwwwk.",
    "kwwwwwwsk",
    "kwkkwkksk",
    "kwkkwkksk",
    "kwwwkwwsk",
    ".kwwwwsk.",
    "..kwkwk..",
    "...kkk...",
  ];
  const STELLA = ["..w..", "..w..", "wwWww", "..w..", "..w.."];

  // ───────────────────────── Colori ─────────────────────────
  const FIOCCHI = [
    { p: C.tappetoChiaro, q: C.tappeto },
    { p: C.giallo, q: C.oroScuro },
    { p: GEMME.zaffiro[2], q: GEMME.zaffiro[1] },
    { p: C.bianco, q: C.pietra },
  ];
  const GOCCE = [
    { h: GEMME.rubino[2], p: C.tappetoChiaro, q: C.tappeto },
    { h: C.bianco, p: C.giallo, q: C.oroScuro },
    { h: GEMME.zaffiro[2], p: GEMME.zaffiro[1], q: GEMME.zaffiro[0] },
    { h: C.bianco, p: C.pietraChiara, q: C.pietra },
  ];
  const COLORI_PIP = FIOCCHI.map((f) => ({
    sano: { k: C.bordo, m: C.ferro, M: C.ferroChiaro, g: C.ferroChiaro, G: C.pietra, d: C.ferro, r: C.tappeto, y: C.giallo, w: C.bianco, p: f.p, q: f.q },
    verde: { k: C.bordo, m: C.erbaScura, M: C.erba, g: C.erba, G: C.erbaChiara, d: C.erbaScura, r: C.erbaScura, y: C.bianco, w: C.bianco, p: f.p, q: f.q },
  }));
  const COLORI_GOCCIA = GOCCE.map((c) => ({
    normale: { k: C.bordo, h: c.h, W: C.bianco, p: c.p, q: c.q },
    lampo: { k: C.bordo, h: C.bianco, W: C.bianco, p: c.p, q: c.q },
  }));
  const COLORI_ANELLO = { k: C.bordo, e: C.tetto, r: C.ferroChiaro };
  function coloriShot(contorno, avvelenato) {
    return {
      k: contorno, s: C.pietraChiara, S: C.bianco, e: C.tetto, B: C.ferroChiaro, b: C.pietra,
      L: avvelenato ? C.erbaChiara : C.lilla, l: avvelenato ? C.erba : C.viola, d: avvelenato ? C.erbaScura : C.violaScuro,
    };
  }
  const COLORI_CLESSIDRA = { k: C.bordo, L: C.legnoLuce, s: C.pietraChiara, B: C.ferroChiaro, a: C.fiammaChiara, e: C.tetto };
  const COLORI_TESCHIETTO = { w: C.pietraChiara, k: C.erbaScura };
  const COLORI_TESCHIO = { k: C.bordo, w: C.erbaChiara, s: C.erba };
  const COLORI_STELLA = { w: C.giallo, W: C.bianco };

  // Geometria (la usa anche la verifica)
  const cx = (j) => 47 + 17 * j;
  const cy = (i) => 34 + 18 * i;

  function lista(nomi) {
    if (nomi.length <= 1) return nomi.join("");
    return nomi.slice(0, -1).join(", ") + " e " + nomi[nomi.length - 1];
  }
  const listaNumeri = (idx) => lista(idx.map((j) => String(j + 1)));

  EscapeDemo.avvia({
    id: "shottino-avvelenato",
    sfondo: "sala-bar",
    velo: 0.55,

    variante(rng) {
      return {
        pipistrelli: 4,
        shottini: 16,
        ordine: mescola(rng, Array.from({ length: 16 }, (_, i) => i)),
      };
    },

    crea(g) {
      const ctx = g.ctx;
      const variante = g.variante;

      let stato = statoIniziale();
      let selezionato = null;
      let anim = null; // { tipo, t0, dur, eventi, ... }
      let trascina = null; // { valore, viste:Set, ultimo:{x,y} }
      let hover = null; // { i, j } in fase assegna, { j } in fase indica
      const cadute = new Map(); // "i-j" → istante in cui la goccia è stata accesa
      let sbuffi = []; // { i, t0, tipo }

      // ── Ripresa dalla memoria ──
      const salvato = g.memoria.stato;
      const ripreso = statoValido(salvato);
      if (ripreso) stato = JSON.parse(JSON.stringify(salvato));
      function salvaMemoria() {
        g.memoria.stato = JSON.parse(JSON.stringify(stato));
        g.salvaMemoria();
      }

      // ── Bottoni ──
      const bAssaggia = g.bottone("Fai assaggiare", () => mossa({ tipo: "assaggia" }), { id: "assaggia", forte: true });
      const bCancella = g.bottone("Cancella", () => mossa({ tipo: "cancella" }), { id: "cancella" });
      const bIndica = g.bottone("Indica", () => { if (selezionato !== null) mossa({ tipo: "indica", shottino: selezionato }); }, { id: "indica", forte: true });

      const bloccato = () => anim !== null && anim.blocca;
      function aggiornaBottoni() {
        const ris = stato.fase === "risolto" || g.stato().risolto;
        bAssaggia.hidden = stato.fase !== "assegna";
        bCancella.hidden = stato.fase !== "assegna";
        bIndica.hidden = stato.fase !== "indica";
        const bl = bloccato();
        bAssaggia.disabled = bl || ris;
        bCancella.disabled = bl || ris;
        bIndica.disabled = bl || ris || selezionato === null;
      }

      // ── Messaggi ──
      function msgConto(i) {
        let k = 0;
        for (let j = 0; j < N; j++) if ((stato.assaggi[j] >> i) & 1) k++;
        const nome = NOMI[i];
        if (k === 0) return `Pipistrello ${nome}: niente da assaggiare.`;
        if (k === 1) return `Pipistrello ${nome}: 1 shottino da assaggiare.`;
        return `Pipistrello ${nome}: ${k} shottini da assaggiare.`;
      }
      function msgFineOra() {
        const gr = stato.gruppo;
        if (gr.length === 1) {
          const v = bitAccesi(stato.verdi).map((i) => NOMI[i]);
          if (v.length === 0) return "Nessuno è diventato verde. Tocca lo shottino avvelenato.";
          if (v.length === 1) return `Verde: ${v[0]}. Tocca lo shottino avvelenato.`;
          return `Verdi: ${lista(v)}. Tocca lo shottino avvelenato.`;
        }
        if (gr.length <= 3) return `Shottini ${listaNumeri(gr)}: stessi assaggiatori, non si distinguono.`;
        return `${gr.length} shottini hanno gli stessi assaggiatori: non si distinguono.`;
      }
      function msgPipistrello(i) {
        if (stato.fase === "assegna") return msgConto(i);
        return (stato.verdi >> i) & 1 ? `Il pipistrello ${NOMI[i]} è diventato verde.` : `Il pipistrello ${NOMI[i]} sta benissimo.`;
      }
      function riepilogoVittoria(j, verdi) {
        const n = j + 1;
        const v = bitAccesi(verdi).map((i) => NOMI[i]);
        let p1;
        if (v.length === 0) p1 = `Il veleno era nello shottino ${n}: nessun pipistrello l'aveva assaggiato, ed era l'unico senza assaggiatori.`;
        else if (v.length === 1) p1 = `Il veleno era nello shottino ${n}: l'aveva assaggiato solo il pipistrello ${v[0]}, e nessun altro shottino aveva solo lui.`;
        else p1 = `Il veleno era nello shottino ${n}: l'avevano assaggiato i pipistrelli ${lista(v)}, e nessun altro shottino aveva proprio quegli assaggiatori.`;
        return p1 + "\nCon quattro pipistrelli i gruppi di assaggiatori possibili sono 16, compreso nessuno: uno per shottino.";
      }

      // ── Animazioni ──
      function avviaAnim(a) {
        anim = { t0: g.tempo, fatto: false, ...a, eventi: (a.eventi || []).map((e) => ({ ...e, fatto: false })) };
      }
      function finisciAnim() {
        if (!anim) return;
        for (const e of anim.eventi) if (!e.fatto) { e.fatto = true; e.fn(true); }
        anim = null;
        aggiornaBottoni();
      }
      function sbuffa(maschera, tipo) {
        if (g.riduciMovimento) return;
        for (const i of bitAccesi(maschera)) sbuffi.push({ i, t0: g.tempo, tipo });
      }

      // ── La mossa: la stessa funzione per tocchi, bottoni e prove ──
      function mossa(m) {
        const prima = stato;
        const r = applica(prima, m, variante);
        const esito = r.esito;
        if (esito.valida === false) {
          if (m && m.tipo === "assaggia" && prima.fase === "assegna" && prima.assaggi.every((x) => x === 0))
            g.messaggio("Nessuno assaggia niente: segna prima qualche casella.");
          return esito;
        }
        finisciAnim();
        stato = r.stato;
        const riduci = g.riduciMovimento;

        if (m.tipo === "segna") {
          const era = (prima.assaggi[m.shottino] >> m.pipistrello) & 1;
          const ora = (stato.assaggi[m.shottino] >> m.pipistrello) & 1;
          if (ora && !era && !riduci) cadute.set(`${m.pipistrello}-${m.shottino}`, g.tempo);
          g.messaggio(msgConto(m.pipistrello));
        } else if (m.tipo === "cancella") {
          g.messaggio("Caselle vuote: nessuno assaggia niente.");
        } else if (m.tipo === "assaggia") {
          selezionato = null;
          trascina = null;
          if (riduci) {
            g.messaggio(msgFineOra());
          } else {
            g.messaggio("I pipistrelli assaggiano. Ora si aspetta un'ora...");
            const verdi = stato.verdi;
            avviaAnim({
              tipo: "assaggio", dur: 2700, blocca: true,
              eventi: [{ t: 2400, fn: (salta) => { g.messaggio(msgFineOra()); if (!salta) sbuffa(verdi, "verde"); } }],
            });
          }
        } else if (m.tipo === "indica") {
          selezionato = null;
          if (esito.errore) {
            salvaMemoria();
            g.errore(esito.motivo);
            g.messaggio("Nuovo giro: antidoto ai pipistrelli e veleno in un altro shottino.");
            if (!riduci) {
              const snap = { verdi: prima.verdi, gruppo: prima.gruppo, scelto: m.shottino, veleno: esito.veleno };
              avviaAnim({
                tipo: "errore", dur: 1600, blocca: true, snap,
                eventi: [{ t: 1200, fn: (salta) => { if (!salta) sbuffa(snap.verdi, "antidoto"); } }],
              });
            }
            aggiornaBottoni();
            return esito;
          }
          // giusto
          salvaMemoria();
          g.messaggio(`Giusto: il veleno era nello shottino ${esito.veleno + 1}!`);
          if (!riduci) {
            const snap = { verdi: prima.verdi, shottino: esito.veleno };
            avviaAnim({
              tipo: "vittoria", dur: 1600, blocca: true, snap,
              eventi: [{ t: 700, fn: (salta) => { if (!salta) sbuffa(snap.verdi, "antidoto"); } }],
            });
          }
          g.risolto({ riepilogo: riepilogoVittoria(esito.veleno, prima.verdi), ritardo: 1600 });
          aggiornaBottoni();
          return esito;
        }
        salvaMemoria();
        aggiornaBottoni();
        return esito;
      }

      // ── Messaggio iniziale ──
      if (stato.fase === "assegna") g.messaggio("Tocca le caselle: ogni riga dice cosa assaggia quel pipistrello.");
      else if (stato.fase === "indica") g.messaggio(msgFineOra());
      else if (g.giaRisolto) g.messaggio(`Lo shottino avvelenato era il ${stato.veleno + 1}.`);
      if (g.giaRisolto && stato.fase !== "risolto") stato = statoIniziale();
      aggiornaBottoni();

      // ── Tocchi ──
      const dentroGriglia = (x, y) => x >= 40 && x < 312 && y >= 26 && y < 98;
      const cellaDa = (x, y) => (dentroGriglia(x, y) ? { i: Math.floor((y - 26) / 18), j: Math.floor((x - 40) / 17) } : null);
      const colonnaDa = (x, y) => (x >= 40 && x < 312 && y >= 26 && y < 131 ? Math.floor((x - 40) / 17) : null);
      const pipistrelloDa = (x, y) => (x >= 4 && x < 37 && y >= 26 && y < 98 ? Math.floor((y - 26) / 18) : null);

      function segnaCella(c) {
        mossa({ tipo: "segna", pipistrello: c.i, shottino: c.j, valore: trascina.valore });
        trascina.viste.add(`${c.i}-${c.j}`);
      }

      g.tocca(({ tipo, x, y, premuto }) => {
        if (bloccato()) {
          if (tipo === "su") trascina = null;
          hover = null;
          return;
        }
        if (tipo === "muovi" && !premuto) {
          if (stato.fase === "assegna") { const c = cellaDa(x, y); hover = c; }
          else if (stato.fase === "indica") { const j = colonnaDa(x, y); hover = j === null ? null : { j }; }
          else hover = null;
          return;
        }
        if (stato.fase === "assegna") {
          if (tipo === "giu") {
            const c = cellaDa(x, y);
            if (c) {
              const acceso = (stato.assaggi[c.j] >> c.i) & 1;
              trascina = { valore: !acceso, viste: new Set(), ultimo: { x, y } };
              segnaCella(c);
              return;
            }
            trascina = null;
            if (x >= 40 && x < 312 && y >= 98 && y < 131) { g.messaggio("Prima decidi gli assaggi, poi premi Fai assaggiare."); return; }
            const p = pipistrelloDa(x, y);
            if (p !== null) g.messaggio(msgPipistrello(p));
          } else if (tipo === "muovi" && trascina) {
            // Si campiona il segmento dall'ultimo punto, così un gesto veloce non salta caselle.
            const a = trascina.ultimo;
            const passi = Math.max(1, Math.ceil(Math.max(Math.abs(x - a.x), Math.abs(y - a.y)) / 3));
            for (let s = 1; s <= passi; s++) {
              const c = cellaDa(a.x + ((x - a.x) * s) / passi, a.y + ((y - a.y) * s) / passi);
              if (c && !trascina.viste.has(`${c.i}-${c.j}`)) segnaCella(c);
            }
            trascina.ultimo = { x, y };
          } else if (tipo === "su") {
            trascina = null;
          }
        } else if (stato.fase === "indica" && tipo === "giu") {
          const j = colonnaDa(x, y);
          if (j !== null) {
            selezionato = j;
            g.messaggio(`Shottino ${j + 1}: premi Indica se è quello avvelenato.`);
            aggiornaBottoni();
            return;
          }
          const p = pipistrelloDa(x, y);
          if (p !== null) g.messaggio(msgPipistrello(p));
        }
      });

      // ── Disegno ──
      function contorno(c, x, y, w, h, colore) {
        rett(c, colore, x, y, w, 1);
        rett(c, colore, x, y + h - 1, w, 1);
        rett(c, colore, x, y, 1, h);
        rett(c, colore, x + w - 1, y, 1, h);
      }

      /** Che cosa mostrare ora, ricavato dallo stato logico e dall'animazione in corso. */
      function vista() {
        const v = {
          verdi: null, gruppo: null, bevuto: () => false, flash: -1, velo: 0, clessidra: 0, scelta: -1,
          t: 0, tipo: anim ? anim.tipo : null,
        };
        const bev = (j) => stato.assaggi[j] !== 0;
        if (!anim) {
          if (stato.fase === "indica") { v.verdi = stato.verdi; v.gruppo = stato.gruppo; v.bevuto = bev; }
          else if (stato.fase === "risolto") v.bevuto = bev;
          return v;
        }
        const t = g.tempo - anim.t0;
        v.t = t;
        if (anim.tipo === "assaggio") {
          v.bevuto = (j) => bev(j) && (t >= 800 || Math.floor(t / 50) >= j);
          if (t < 800) v.flash = Math.floor(t / 50);
          if (t >= 1000 && t < 2400) {
            v.velo = t < 1125 || t >= 2275 ? 0.36 : 0.72;
            v.clessidra = Math.min(3, Math.floor((t - 1000) / 350));
          }
          if (t >= 2400) { v.verdi = stato.verdi; v.gruppo = stato.gruppo; }
        } else if (anim.tipo === "errore") {
          v.bevuto = bev;
          if (t < 1200) v.verdi = anim.snap.verdi;
          v.gruppo = anim.snap.gruppo;
          if (t < 500) v.scelta = anim.snap.scelto;
        } else if (anim.tipo === "vittoria") {
          v.bevuto = bev;
          if (t < 700) v.verdi = anim.snap.verdi;
        }
        return v;
      }

      function disegnaPipistrello(i, v) {
        const verde = v.verdi !== null && ((v.verdi >> i) & 1) === 1;
        const col = COLORI_PIP[i][verde ? "verde" : "sano"];
        const y0 = 26 + 18 * i;
        const fo = g.fotogramma;
        let riga = PIP_GIU, dy = 0;
        if (verde) {
          dy = 1 + (((fo >> 1) + i) % 2);
          if (g.riduciMovimento) dy = 1;
        } else if (!g.riduciMovimento) {
          const festa = v.tipo === "vittoria";
          const f = ((festa ? 2 * fo : fo) + 3 * i) % 4;
          riga = f < 2 ? PIP_SU : PIP_GIU;
          dy = f === 1 ? -1 : f === 3 ? 1 : 0;
        }
        sprite(ctx, riga, col, 6, y0 + dy);
        if (verde && !g.riduciMovimento) {
          for (let b = 0; b < 2; b++) {
            const fase = (fo + 3 * b + i) % 6;
            if (fase === 5) continue;
            const bx = 24 + 4 * b, by = y0 + 1 - fase;
            if (b === 0) rett(ctx, C.erbaChiara, bx, by, 1, 1);
            else {
              rett(ctx, C.erbaChiara, bx, by, 2, 2);
              rett(ctx, C.bianco, bx, by, 1, 1);
            }
          }
        }
      }

      const SBUFFO1 = [[-13, 0], [13, 0], [0, -10], [0, 10], [-9, -7], [9, -7], [-9, 7], [9, 7]];
      const SBUFFO2 = [[-16, 0], [16, 0], [0, -12], [0, 12], [-12, -9], [12, -9], [-12, 9], [12, 9]];
      function disegnaSbuffi() {
        sbuffi = sbuffi.filter((s) => g.tempo - s.t0 < 250);
        for (const s of sbuffi) {
          const f2 = g.tempo - s.t0 >= 125;
          const colore = s.tipo === "verde" ? (f2 ? C.erba : C.erbaChiara) : (f2 ? C.pietraChiara : C.bianco);
          for (const [dx, dy] of f2 ? SBUFFO2 : SBUFFO1) rett(ctx, colore, 18 + dx - 1, cy(s.i) + dy - 1, 2, 2);
        }
      }

      function disegnaShottino(j, v, risoltoJ) {
        const x0 = cx(j) - 5;
        const vel = stato.fase === "risolto" && stato.veleno === j;
        const svelato = vel || (anim && anim.tipo === "errore" && anim.snap.veleno === j);
        const sel = selezionato === j && stato.fase === "indica";
        let contornoCol = C.bordo;
        if (vel) contornoCol = C.oro;
        else if (sel) contornoCol = C.giallo;
        let dx = 0;
        if (v.scelta === j) {
          contornoCol = C.tappetoChiaro;
          dx = g.fotogramma % 2 ? 1 : -1;
          if (g.riduciMovimento) dx = 0;
        }
        const y = 100 - (vel || sel ? 2 : 0);
        rett(ctx, C.legno, cx(j) - 3, 112, 9, 1);
        sprite(ctx, v.bevuto(j) ? SHOT_BEVUTO : SHOT, coloriShot(contornoCol, svelato), x0 + dx, y);
        if (svelato) sprite(ctx, TESCHIETTO, COLORI_TESCHIETTO, cx(j) - 2 + dx, 105 - (vel || sel ? 2 : 0));
      }

      function disegnaTarghetta(j) {
        const x = cx(j) - 7;
        rett(ctx, C.bordo, x, 119, 15, 11);
        rett(ctx, C.oro, x + 1, 120, 13, 9);
        rett(ctx, C.giallo, x + 1, 120, 13, 1);
        rett(ctx, C.oroScuro, x + 1, 128, 13, 1);
        testo(ctx, String(j + 1), cx(j), 121, { colore: C.bordo, ombra: null, allinea: "centro" });
      }

      function disegnaEffettiVittoria() {
        const j = stato.veleno;
        const x = cx(j);
        const fo = g.fotogramma;
        const rid = g.riduciMovimento;
        if (anim && anim.tipo === "vittoria") {
          const t = g.tempo - anim.t0;
          if (t < 1000) {
            const y = 88 - 6 * Math.floor(t / 125);
            if (y >= 40) sprite(ctx, TESCHIO, COLORI_TESCHIO, x - 4, y);
          }
          for (let b = 0; b < 3; b++) {
            const off = (fo + 2 * b) % 5;
            rett(ctx, C.erbaChiara, x - 2 + 2 * b, 97 - off, 1, 1);
          }
        }
        if (!rid) {
          const POS = [[x - 14, 92], [x + 10, 104], [x + 9, 40]];
          POS.forEach(([sx, sy], s) => {
            const f = fo % 6;
            if (f === 2 * s || f === 2 * s + 1) sprite(ctx, STELLA, COLORI_STELLA, sx, sy);
          });
        }
      }

      g.anima((tempo) => {
        // eventi e fine dell'animazione
        if (anim) {
          const t = tempo - anim.t0;
          for (const e of anim.eventi) if (!e.fatto && t >= e.t) { e.fatto = true; e.fn(false); }
          if (t >= anim.dur) { anim = null; aggiornaBottoni(); }
        }
        const v = vista();
        ctx.clearRect(0, 0, g.larghezza, g.altezza);

        // binari
        for (let i = 0; i < P; i++) {
          const verde = v.verdi !== null && ((v.verdi >> i) & 1) === 1;
          const y = 26 + 18 * i;
          rett(ctx, C.bordo, 33, y + 6, 280, 4);
          rett(ctx, verde ? C.erbaChiara : C.ferroChiaro, 33, y + 7, 279, 1);
          rett(ctx, verde ? C.erba : C.ferro, 33, y + 8, 279, 1);
        }

        // caselle: gocce e anelli
        for (let i = 0; i < P; i++)
          for (let j = 0; j < N; j++) {
            const x = 40 + 17 * j, y = 26 + 18 * i;
            if ((stato.assaggi[j] >> i) & 1) {
              let dy = 0;
              const c0 = cadute.get(`${i}-${j}`);
              if (c0 !== undefined) {
                const eta = g.tempo - c0;
                dy = eta < 50 ? -3 : eta < 100 ? -1 : 0;
              }
              let lampo = false;
              if (v.flash === j) { dy += 1; lampo = true; }
              sprite(ctx, GOCCIA, COLORI_GOCCIA[i][lampo ? "lampo" : "normale"], x + 2, y + 1 + dy);
            } else {
              sprite(ctx, ANELLO, COLORI_ANELLO, x + 4, y + 5);
            }
          }

        // evidenziazione sotto il mouse
        if (hover && !bloccato()) {
          if (stato.fase === "assegna" && hover.i !== undefined) contorno(ctx, 40 + 17 * hover.j, 26 + 18 * hover.i, 15, 16, C.bianco);
          else if (stato.fase === "indica" && hover.j !== undefined) contorno(ctx, 39 + 17 * hover.j, 25, 17, 74, C.pietraChiara);
        }

        // cornici di colonna e punti interrogativi
        const gr = v.gruppo && v.gruppo.length >= 2 ? v.gruppo : null;
        for (let j = 0; j < N; j++) {
          let col = null;
          if (gr && gr.includes(j)) col = C.fiamma;
          if (selezionato === j && stato.fase === "indica") col = C.giallo;
          if (stato.fase === "risolto" && stato.veleno === j) col = C.oro;
          if (col) contorno(ctx, 39 + 17 * j, 25, 17, 74, col);
          if (gr && gr.includes(j)) testo(ctx, "?", cx(j), 18, { colore: C.fiamma, allinea: "centro" });
        }

        // pipistrelli e sbuffi
        for (let i = 0; i < P; i++) disegnaPipistrello(i, v);
        disegnaSbuffi();

        // shottini e targhette
        for (let j = 0; j < N; j++) disegnaShottino(j, v);
        for (let j = 0; j < N; j++) disegnaTarghetta(j);

        if (stato.fase === "risolto") disegnaEffettiVittoria();

        // velo dell'ora
        if (v.velo > 0) {
          ctx.globalAlpha = v.velo;
          rett(ctx, C.nero, 0, 16, 320, 138);
          ctx.globalAlpha = 1;
          sprite(ctx, CLESSIDRA[v.clessidra], COLORI_CLESSIDRA, 149, 46, { scala: 2 });
          testo(ctx, "UN'ORA DOPO...", 160, 82, { colore: C.fiammaChiara, allinea: "centro" });
        }
      });

      // ── L'aggancio per le prove ──
      g.espone({
        gioca: (m) => mossa(m),
        statoGioco: () => ({
          fase: stato.fase,
          giro: stato.giro,
          assaggi: [...stato.assaggi],
          verdi: stato.verdi === null ? null : bitAccesi(stato.verdi),
          indistinguibili: stato.gruppo === null ? null : [...stato.gruppo],
          selezionato,
          veleno: stato.fase === "risolto" ? stato.veleno : null,
        }),
        cella: (i, j) => ({ x: cx(j), y: cy(i) }),
        shottino: (j) => ({ x: cx(j), y: 105 }),
      });
    },
  });
})();
