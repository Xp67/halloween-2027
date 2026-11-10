// Demo «La pista che si spegne»: pista da ballo 5×5 a luci che cambiano a croce, da spegnere entro minimo + 6 passi.

(function () {
  "use strict";
  const { C, GEMME, rett, riquadro, retino, sprite, testo } = EscapeDemo;

  // ───────────────────────── Logica pura ─────────────────────────

  // CROCE[i]: le piastrelle che cambiano pestando la piastrella i (lei e le vicine).
  const CROCE = [];
  for (let i = 0; i < 25; i++) {
    const r = Math.floor(i / 5), c = i % 5;
    let m = 1 << i;
    if (r > 0) m |= 1 << (i - 5);
    if (r < 4) m |= 1 << (i + 5);
    if (c > 0) m |= 1 << (i - 1);
    if (c < 4) m |= 1 << (i + 1);
    CROCE.push(m);
  }
  const contaBit = (v) => { let n = 0; while (v) { n += v & 1; v >>>= 1; } return n; };

  /** Tutte le soluzioni della pista (insiemi di piastrelle da pestare): sempre 0 o 4. */
  function soluzioni(pista) {
    const tutte = [];
    for (let primaRiga = 0; primaRiga < 32; primaRiga++) {
      let luci = pista, premute = 0;
      for (let c = 0; c < 5; c++) if ((primaRiga >> c) & 1) { luci ^= CROCE[c]; premute |= 1 << c; }
      for (let r = 1; r < 5; r++)
        for (let c = 0; c < 5; c++)
          if ((luci >> ((r - 1) * 5 + c)) & 1) { const i = r * 5 + c; luci ^= CROCE[i]; premute |= 1 << i; }
      if (luci === 0) tutte.push(premute);
    }
    return tutte;
  }
  const minimoPassi = (pista) => Math.min(...soluzioni(pista).map(contaBit));

  const inRighe = (p) => [0, 1, 2, 3, 4].map((r) => [0, 1, 2, 3, 4].map((c) => ((p >> (r * 5 + c)) & 1 ? "1" : "0")).join(""));
  const daRighe = (righe) => righe.reduce((p, riga, r) => [...riga].reduce((q, ch, c) => (ch === "1" ? q | (1 << (r * 5 + c)) : q), p), 0);

  const RISERVA = { pista: ["10110", "10100", "00011", "10001", "01101"], minimo: 11, limite: 17 };

  function generaVariante(rng) {
    for (let tentativo = 0; tentativo < 300; tentativo++) {
      let pista = 0;
      for (let i = 0; i < 25; i++) if (rng() < 0.5) pista ^= CROCE[i];
      const accese = contaBit(pista);
      if (accese < 9 || accese > 16) continue;
      const minimo = minimoPassi(pista);
      if (minimo < 9 || minimo > 13) continue;
      return { pista: inRighe(pista), minimo, limite: minimo + 6 };
    }
    return { ...RISERVA, pista: [...RISERVA.pista] };
  }

  const MOTIVO_FINITI = "Passi finiti: il DJ ha riacceso la pista";
  const MOTIVO_RICOMINCIA = "Hai ricominciato: il DJ ha riacceso la pista";

  const statoIniziale = (v) => ({ pista: daRighe(v.pista), passi: 0, conferma: false, risolto: false });

  /** stato + mossa → { stato, esito }. Non disegna e non chiama il kit. */
  function applica(stato, mossa, v) {
    if (stato.risolto) return { stato, esito: { valida: false } };
    if (mossa && mossa.ricomincia === true) {
      if (stato.passi === 0) return { stato, esito: { valida: false } };
      if (!stato.conferma) return { stato: { ...stato, conferma: true }, esito: { conferma: true } };
      return { stato: statoIniziale(v), esito: { errore: true, motivo: MOTIVO_RICOMINCIA, passi: 0 } };
    }
    const r = mossa && mossa.r, c = mossa && mossa.c;
    const bene = (x) => Number.isInteger(x) && x >= 0 && x <= 4;
    if (!bene(r) || !bene(c)) return { stato, esito: { valida: false } };
    const pista = stato.pista ^ CROCE[r * 5 + c];
    const passi = stato.passi + 1;
    if (pista === 0) return { stato: { pista, passi, conferma: false, risolto: true }, esito: { risolto: true, passi } };
    if (passi >= v.limite) return { stato: statoIniziale(v), esito: { errore: true, motivo: MOTIVO_FINITI, passi: 0 } };
    return { stato: { pista, passi, conferma: false, risolto: false }, esito: { ok: true, passi, accese: contaBit(pista) } };
  }

  // ───────────────────────── Geometria ─────────────────────────

  const YB = [54, 69, 85, 102, 120, 139];
  const mezza = (y) => 50 + Math.floor(((y - 54) * 26) / 85);
  const xc = (k, y) => 160 - mezza(y) + Math.round((k * 2 * mezza(y)) / 5);

  function posizione(r, c) {
    if (![r, c].every((v) => Number.isInteger(v) && v >= 0 && v <= 4)) return null;
    const y = Math.floor((YB[r] + YB[r + 1]) / 2);
    return { x: Math.round((xc(c, y) + xc(c + 1, y)) / 2), y };
  }

  function piastrellaInPunto(x, y) {
    const xi = Math.floor(x), yi = Math.floor(y);
    if (yi < 51 || yi > 141) return null;
    const yy = Math.min(138, Math.max(54, yi));
    let r = 0;
    while (r < 4 && yy >= YB[r + 1]) r++;
    const sx = 160 - mezza(yy), dx = 160 + mezza(yy);
    if (xi < sx - 4 || xi > dx + 4) return null;
    const c = Math.min(4, Math.max(0, Math.floor(((xi - sx) * 5) / (dx - sx))));
    return { r, c };
  }

  // ───────────────────────── Sprite ─────────────────────────

  const FAMIGLIE = [GEMME.acquamarina, GEMME.topazio, GEMME.ametista, GEMME.zaffiro];

  const DJ_COLORI = {
    k: C.bordo, h: C.nero, H: C.ferro, f: C.pietraChiara, F: C.pietra, r: C.tappetoChiaro, w: C.bianco,
    x: C.tappetoChiaro, c: C.ferro, l: C.ferroChiaro, C: C.tappeto, v: C.violaScuro, m: C.ferroChiaro, M: C.ferro, p: C.rosa,
  };
  const DJ = [
    ".....kkkkkkkkkk.....",
    "....kmmmmmmmmmmk....",
    "...kmkkkkkkkkkkmk...",
    "...kmkhHHhhhhhkmk...",
    "...kmkhHhffhhhkmk...",
    "..kMMkhhffffhhkMMk..",
    "..kMpkhffffffhkpMk..",
    "..kMpkfkkffkkfkpMk..",
    "..kMMkffffffFFkMMk..",
    "..kkkkffkkkkFFkkkk..",
    ".....kffwffwFFk.....",
    "......kffffFFk......",
    "....kxxkkkkkkxxk....",
    "..kcxxxkwwwwkxxxck..",
    ".klcCxkvwxxwvkxCcck.",
    "klcCCkvvwwwwvvkCCcck",
    "klcCCkvvvwwvvvkCCcck",
    "klccCkvvvwwvvvkCccck",
    "klckCkvvvwwvvvkCkcck",
    "klckckvvvwwvvvkckcck",
    "klckckvvvwwvvvkckcck",
    ".kckfkkvvwwvvkkfkck.",
    ".kkfffkkkkkkkkfffkk.",
    "..kkkk........kkkk..",
  ];
  const DJ_SOSPETTO = { 7: "..kMpkfrwffrwfkpMk.." };
  const DJ_ARRABBIATO = {
    6: "..kMpkhkffffkhkpMk..",
    7: "..kMpkfrrffrrfkpMk..",
    9: "..kkkkfkkkkkkFkkkk..",
    10: ".....kfkwrrwkFk.....",
    11: "......kfkkkkFk......",
  };
  const NOTA = [
    "..kkk.",
    "..kaak",
    "..kakk",
    "..kak.",
    "kkkak.",
    "kaaak.",
    "kaaak.",
    ".kkk..",
  ];

  const ZUCCO_COLORI = {
    k: C.bordo, O: C.brace, y: C.fiamma, h: C.fiammaChiara, E: C.oro, e: C.luna, P: C.violaScuro, p: C.viola, q: C.lilla,
    o: "#9c3b17", b: "#4a1a12", G: "#2d5a2e", g: "#5f9440", B: "#463a6a", L: "#7a6aa4", R: "#5e3c44", T: "#83575c",
  };
  const ZUCCO_FERMO = [
    "...............Gg...........",
    "..............GGg...........",
    "...........kkkkkkkkkk.......",
    "..........koOOyyyOOOok......",
    ".........koOOyyhyyOOOok.....",
    ".........koOyEEyyOEEOok.....",
    ".........koOEeeEyOEeeEk.....",
    ".........koOOEEOOEOEEOk.....",
    ".........koOOOOOEEOOOOk.....",
    ".........koObEbEbEbEbOk.....",
    ".........kooOeEeEeEeOok.....",
    "..........kooOOOOOOOok......",
    ".......kkkkkkkkkkkkkk.......",
    "......kqqpppppppk...........",
    ".....kqpppppppppPk..........",
    "....kqppppppppppPk.PPP......",
    "...kqpppPppppppPPk....kkk...",
    "..kqppPPkppppppPk.....kek...",
    "..kppPPk.kpppPPPk.....kEk...",
    "...kPk...kpPPPPk......kkk...",
    "....k.....kkkkk.............",
    "...........BB.LL............",
    "...........BB..LL...........",
    "............BB.LL...........",
    "............BB..LL..........",
    ".............BB.LL..........",
    ".............BB..LL.........",
    "............BB...LL.........",
    "...........BB...LL..........",
    ".........kRRRk.kTTTk........",
    ".........kkkkk.kkkkk........",
  ];
  const ZUCCO_RESPIRO = [
    "............................",
    "...............Gg...........",
    "..............GGg...........",
    "...........kkkkkkkkkk.......",
    "..........koOOyyyOOOok......",
    ".........koOOyyhyyOOOok.....",
    ".........koOyEEyyOEEOok.....",
    ".........koOEeeEyOEeeEk.....",
    ".........koOOEEOOEOEEOk.....",
    ".........koOOOOOEEOOOOk.....",
    ".........koObEbEbEbEbOk.....",
    ".........kooOeEeEeEeOok.....",
    "..........kooOOOOOOOok......",
    ".......kkkkkkkkkkkkkk.......",
    "......kqqpppppppk...........",
    "....kkqpppppppppPk.P........",
    "...kqqppppppppppPk..P.......",
    "..kqppppPpppppPPPk...P......",
    "...kkkPPkkppppPPk.....kkk...",
    "......kk.kpppPPPk.....kek...",
    ".........kpPPPPk......kEk...",
    "..........kkkkkL......kkk...",
    "...........BB..LL...........",
    "............BB.LL...........",
    "............BB..LL..........",
    ".............BB.LL..........",
    ".............BB..LL.........",
    "............BB...LL.........",
    "...........BB...LL..........",
    ".........kRRRk.kTTTk........",
    ".........kkkkk.kkkkk........",
  ];
  const ZUCCO_SALTO = [
    "...............Gg...........",
    "..............GGg...........",
    "...........kkkkkkkkkk.......",
    "..........koOOyyyOOOok......",
    ".........koOOyyhyyOOOok.....",
    ".........koOyEEyyOEEOok.....",
    ".........koOEeeEyOEeeEk.....",
    ".........koOOEEOOEOEEOk.....",
    ".........koOOOOOEEOOOOk.....",
    ".........koObEbEbEbEbOk.....",
    ".........kooOeEeEeEeOok.....",
    "..........kooOOOOOOOok......",
    ".......kkkkkkkkkkkkkk.......",
    "......kqqpppppppk...........",
    "....kkqpppppppppPk..........",
    "...kqqppppppppppPk.P........",
    "..kqppppPpppppPPPk..PP......",
    "...kkkPPkkppppPPk.....kkk...",
    "......kk.kpppPPPk.....kek...",
    ".........kpPPPPk......kEk...",
    "..........kkkkk.......kkk...",
    "...........BB.LLL...........",
    "............BB.kTTTk........",
    "........kRRRkB.kkkkk........",
    "........kkkkk...............",
  ];

  // ───────────────────────── Il rompicapo ─────────────────────────

  const opzioni = {
    id: "pista-si-spegne",
    sfondo: "sala-principale",
    velo: 0.5,
    variante(rng) { return generaVariante(rng); },

    crea(g) {
      const v = g.variante;
      opzioni.testo = g.scheda.enigma + "\n" +
        `Per questa pista hai ${v.limite} passi. Se finiscono prima che sia tutta spenta, il DJ se ne accorge e la riaccende com'era all'inizio.`;
      const ctx = g.ctx;

      // Stato iniziale (eventualmente da memoria)
      let stato;
      let ripreso = false;
      if (g.giaRisolto) {
        stato = { pista: 0, passi: 0, conferma: false, risolto: true };
      } else {
        stato = statoIniziale(v);
        const m = g.memoria || {};
        const okPista = Array.isArray(m.pista) && m.pista.length === 5 && m.pista.every((s) => typeof s === "string" && /^[01]{5}$/.test(s)) &&
          !m.pista.every((s) => s === "00000");
        if (okPista && Number.isInteger(m.passi) && m.passi >= 0 && m.passi < v.limite) {
          stato = { pista: daRighe(m.pista), passi: m.passi, conferma: false, risolto: false };
          ripreso = m.passi > 0;
        }
      }

      let fPasso = null, fErrore = null, fVittoria = null;
      let ultima = { r: 0, c: 0 };
      let anteprima = null;
      let sporco = true;
      let ultimoFotogramma = -1;
      let btn = null;

      function aggiornaEtichetta() { if (btn) btn.textContent = stato.conferma ? "Conferma" : "Ricomincia"; }

      function messaggioPasso() {
        const p = stato.passi, L = v.limite, n = contaBit(stato.pista), resto = L - p;
        if (resto > 3) {
          g.messaggio(n >= 2 ? `Passo ${p} di ${L}: ${n} piastrelle ancora accese.` : `Passo ${p} di ${L}: resta accesa una piastrella sola.`);
        } else if (resto >= 2) {
          g.messaggio(`Passo ${p} di ${L}: il DJ si guarda intorno, restano ${resto} passi.`);
        } else {
          g.messaggio(`Passo ${p} di ${L}: il DJ si guarda intorno, resta 1 passo.`);
        }
      }

      function mossa(m) {
        const { stato: nuovo, esito } = applica(stato, m, v);
        stato = nuovo;
        const eRicomincia = m && m.ricomincia === true;
        if (esito.valida === false) {
          if (eRicomincia) g.messaggio("La pista è già com'era all'inizio.");
          aggiornaEtichetta();
          return esito;
        }
        sporco = true;
        if (esito.conferma) {
          g.messaggio("Ricominciare conta come finire i passi. Tocca ancora per confermare.");
          aggiornaEtichetta();
          return esito;
        }
        if (!eRicomincia) { ultima = { r: m.r, c: m.c }; }
        aggiornaEtichetta();
        if (esito.errore) {
          fErrore = g.fotogramma;
          fPasso = null;
          g.memoria.pista = inRighe(stato.pista);
          g.memoria.passi = stato.passi;
          g.salvaMemoria();
          g.errore(esito.motivo);
          g.messaggio("La pista è di nuovo com'era all'inizio: passi a zero.");
          return esito;
        }
        fPasso = g.fotogramma;
        g.memoria.pista = inRighe(stato.pista);
        g.memoria.passi = stato.passi;
        g.salvaMemoria();
        if (esito.risolto) {
          fVittoria = g.fotogramma;
          anteprima = null;
          g.messaggio("Pista spenta! Il DJ non si è accorto di niente.");
          const p = stato.passi;
          g.risolto({
            riepilogo: p === v.minimo ? `Pista spenta in ${p} passi: meno di così non si poteva.` : `Pista spenta in ${p} passi (il minimo era ${v.minimo}).`,
            ritardo: 1400,
          });
          return esito;
        }
        messaggioPasso();
        return esito;
      }

      // ── Interfaccia ──
      g.tocca(({ tipo, x, y, premuto, evento }) => {
        if (tipo === "giu") {
          const t = piastrellaInPunto(x, y);
          if (t) mossa({ r: t.r, c: t.c });
        } else if (tipo === "muovi" && !premuto && evento && evento.pointerType === "mouse") {
          const t = piastrellaInPunto(x, y);
          const cambia = (t ? `${t.r},${t.c}` : "") !== (anteprima ? `${anteprima.r},${anteprima.c}` : "");
          if (cambia) { anteprima = t; sporco = true; }
        }
      });
      g.scena.addEventListener("pointerleave", () => { if (anteprima) { anteprima = null; sporco = true; } });
      btn = g.bottone("Ricomincia", () => mossa({ ricomincia: true }), { id: "ricomincia" });
      aggiornaEtichetta();

      if (g.giaRisolto) g.messaggio("La pista è spenta: qui hai già finito.");
      else if (ripreso) g.messaggio(`Passo ${stato.passi} di ${v.limite}: riprendi da dove eri rimasto.`);
      else g.messaggio("Pesta una piastrella: cambiano lei e le quattro vicine.");

      // ── Disegno ──
      function piastrella(r, c, tipo) {
        const y0 = YB[r] + 1, y1 = YB[r + 1] - 1;
        if (tipo === "spenta") {
          for (let y = y0; y <= y1; y++) {
            const x0 = xc(c, y) + 1, x1 = xc(c + 1, y) - 1, w = x1 - x0 + 1;
            rett(ctx, C.muroCasa, x0, y, w, 1);
            if (y === y0) rett(ctx, C.ferro, x0, y, w, 1);
            else {
              rett(ctx, C.ferro, x0, y, 1, 1);
              if (y >= y0 + 3 && y <= y1 - 3) rett(ctx, C.muro, x0 + 3, y, w - 6, 1);
            }
          }
          rett(ctx, C.ferroChiaro, xc(c, y0 + 1) + 2, y0 + 1, 2, 1);
          return;
        }
        const [scuro, medio, chiaro] = tipo === "rossa" ? GEMME.rubino : FAMIGLIE[(r + c) % 4];
        for (let y = y0; y <= y1; y++) {
          const x0 = xc(c, y) + 1, x1 = xc(c + 1, y) - 1, w = x1 - x0 + 1;
          rett(ctx, medio, x0, y, w, 1);
          if (y === y0) rett(ctx, chiaro, x0, y, w, 1);
          else if (y === y1) rett(ctx, scuro, x0, y, w, 1);
          else {
            rett(ctx, chiaro, x0, y, 1, 1);
            rett(ctx, scuro, x1, y, 1, 1);
            if (y >= y0 + 3 && y <= y1 - 3) retino(ctx, medio, chiaro, x0 + 3, y, w - 6, 1, 0.5);
          }
        }
        rett(ctx, C.bianco, xc(c, y0 + 1) + 2, y0 + 1, 2, 1);
        rett(ctx, C.bianco, xc(c, y0 + 2) + 2, y0 + 2, 1, 1);
      }

      function contorno(r, c, colore) {
        const y0 = YB[r] + 1, y1 = YB[r + 1] - 1;
        for (let y = y0; y <= y1; y++) {
          const x0 = xc(c, y) + 1, x1 = xc(c + 1, y) - 1;
          if (y === y0 || y === y1) rett(ctx, colore, x0, y, x1 - x0 + 1, 1);
          else { rett(ctx, colore, x0, y, 1, 1); rett(ctx, colore, x1, y, 1, 1); }
        }
      }

      const vicine = (r, c) => [[r - 1, c], [r + 1, c], [r, c - 1], [r, c + 1]].filter(([a, b]) => a >= 0 && a <= 4 && b >= 0 && b <= 4);

      function disegnaDJ(f) {
        const eta = fErrore === null ? 99 : f - fErrore;
        const arrabbiato = eta < 12;
        const resto = v.limite - stato.passi;
        const sospetto = !arrabbiato && !stato.risolto && resto >= 1 && resto <= 3;
        const anim = !g.riduciMovimento;
        const testa = DJ.slice(0, 12).slice();
        if (arrabbiato) for (const k in DJ_ARRABBIATO) testa[k] = DJ_ARRABBIATO[k];
        else if (sospetto) for (const k in DJ_SOSPETTO) testa[k] = DJ_SOSPETTO[k];
        const balla = !arrabbiato && !sospetto;
        const dy = balla && anim ? Math.floor(f / 2) % 2 : 0;
        // note
        if (balla && anim) {
          for (let n = Math.max(0, Math.floor((f - 19) / 12)); n <= Math.floor(f / 12); n++) {
            const a = f - 12 * n;
            if (a < 0 || a > 19) continue;
            const x = (n % 2 ? 275 : 233) + (Math.floor(a / 4) % 2);
            sprite(ctx, NOTA, { k: C.bordo, a: n % 2 ? C.acqua : C.lilla }, x, 72 - a);
          }
        }
        sprite(ctx, DJ.slice(12), DJ_COLORI, 247, 69);
        sprite(ctx, testa, DJ_COLORI, 247, 57 + dy);
        if (arrabbiato) testo(ctx, "!", 257, 46, { colore: C.tappetoChiaro, allinea: "centro" });
        else if (sospetto) testo(ctx, "?", 257, 48, { colore: C.giallo, piccolo: true, ombra: null, allinea: "centro" });
      }

      function disegnaPedana(f) {
        const risolto = stato.risolto;
        const chiaro = risolto ? C.oro : C.ferroChiaro;
        const scuro = risolto ? C.oroScuro : C.ferro;
        rett(ctx, C.bordo, 106, 51, 109, 1);
        rett(ctx, chiaro, 107, 52, 107, 1);
        rett(ctx, scuro, 107, 53, 107, 1);
        for (let y = 52; y <= 139; y++) {
          const yy = Math.max(54, y);
          const L = 160 - mezza(yy), R = 160 + mezza(yy);
          rett(ctx, C.bordo, L - 4, y, 1, 1);
          rett(ctx, C.bordo, R + 4, y, 1, 1);
          if (y >= 54) {
            rett(ctx, chiaro, L - 3, y, 2, 1);
            rett(ctx, scuro, L - 1, y, 1, 1);
            rett(ctx, scuro, R + 1, y, 3, 1);
            rett(ctx, C.bordo, L, y, R - L + 1, 1);
          }
        }

        // piastrelle
        const anim = !g.riduciMovimento;
        const etaE = fErrore === null ? 99 : f - fErrore;
        const lampo = anim && etaE <= 1;
        const riaccensione = anim && etaE >= 2 && etaE <= 6;
        for (let r = 0; r < 5; r++)
          for (let c = 0; c < 5; c++) {
            let acc = (stato.pista >> (r * 5 + c)) & 1;
            if (riaccensione && r > etaE - 2) acc = 0;
            piastrella(r, c, lampo ? "rossa" : acc ? "accesa" : "spenta");
          }
        // luccichii
        if (anim) {
          for (let r = 0; r < 5; r++)
            for (let c = 0; c < 5; c++) {
              if (lampo || !((stato.pista >> (r * 5 + c)) & 1)) continue;
              if ((f + r * 3 + c * 5) % 16 < 2) {
                const p = posizione(r, c);
                rett(ctx, C.bianco, p.x - 2, p.y, 5, 1);
                rett(ctx, C.bianco, p.x, p.y - 2, 1, 5);
              }
            }
        }
        // contorni: anteprima, passo, onda
        const etaP = fPasso === null ? 99 : f - fPasso;
        if (anim && !stato.risolto && etaP <= 1 && fErrore !== fPasso) {
          contorno(ultima.r, ultima.c, C.bianco);
          for (const [a, b] of vicine(ultima.r, ultima.c)) contorno(a, b, C.pietraChiara);
        } else if (anteprima && !stato.risolto) {
          contorno(anteprima.r, anteprima.c, C.bianco);
          for (const [a, b] of vicine(anteprima.r, anteprima.c)) contorno(a, b, C.pietraChiara);
        }
        if (anim && fVittoria !== null) {
          const eta = f - fVittoria;
          if (eta >= 0 && eta <= 9)
            for (let r = 0; r < 5; r++)
              for (let c = 0; c < 5; c++) {
                const d = Math.abs(r - ultima.r) + Math.abs(c - ultima.c);
                if (eta - d === 0 || eta - d === 1) contorno(r, c, C.bianco);
              }
        }

        // bordo vicino, fronte, ombra
        rett(ctx, chiaro, 81, 140, 159, 1);
        rett(ctx, C.bordo, 80, 140, 1, 1);
        rett(ctx, C.bordo, 240, 140, 1, 1);
        riquadro(ctx, 80, 141, 161, 11, C.muro);
        rett(ctx, C.muroCasa, 81, 142, 159, 1);
        rett(ctx, C.nero, 81, 152, 159, 1);

        // pannello
        rett(ctx, C.nero, 121, 142, 79, 9);
        const resto = v.limite - stato.passi;
        let scritta, colore;
        if (risolto) { scritta = "PISTA SPENTA"; colore = C.giallo; }
        else if (etaE < 12) { scritta = "PASSI FINITI"; colore = C.tappetoChiaro; }
        else {
          scritta = `PASSI ${String(stato.passi).padStart(2, "0")}/${v.limite}`;
          colore = resto >= 1 && resto <= 3 ? C.oro : C.acqua;
        }
        testo(ctx, scritta, 160, 143, { colore, ombra: null, allinea: "centro" });

        // lampadine
        for (let k = 0; k < 12; k++) {
          const x = k < 6 ? 84 + 6 * k : 203 + 6 * (k - 6);
          let col, acc;
          if (risolto) { col = C.oro; acc = true; }
          else if (etaE < 12) { col = C.tappetoChiaro; acc = true; }
          else if (!anim) { col = [C.rosa, C.acqua, C.giallo, C.lilla][k % 4]; acc = true; }
          else { acc = (k + f) % 4 === 0; col = acc ? [C.rosa, C.acqua, C.giallo, C.lilla][k % 4] : C.ferro; }
          rett(ctx, C.bordo, x - 1, 144, 4, 4);
          rett(ctx, col, x, 145, 2, 2);
          if (acc) rett(ctx, C.bianco, x, 145, 1, 1);
        }
      }

      function disegnaZucco(f) {
        const anim = !g.riduciMovimento;
        let riga = ZUCCO_FERMO, x = 44, y = 121;
        if (g.riduciMovimento) {
          riga = ZUCCO_FERMO;
        } else {
          const etaV = fVittoria === null ? 99 : f - fVittoria;
          const etaE = fErrore === null ? 99 : f - fErrore;
          const etaP = fPasso === null ? 99 : f - fPasso;
          if (etaV < 12) {
            if (Math.floor(etaV / 2) % 2 === 0) { riga = ZUCCO_SALTO; y = 118; }
          } else if (etaE < 4) {
            x = etaE % 2 === 0 ? 43 : 45;
          } else if (etaP < 2) {
            riga = ZUCCO_SALTO; y = 118;
          } else {
            riga = Math.floor(f / 4) % 2 ? ZUCCO_RESPIRO : ZUCCO_FERMO;
          }
        }
        void anim;
        sprite(ctx, riga, ZUCCO_COLORI, x, y);
      }

      g.anima(() => {
        const f = g.fotogramma;
        if (f === ultimoFotogramma && !sporco) return;
        ultimoFotogramma = f;
        sporco = false;
        ctx.clearRect(0, 0, g.larghezza, g.altezza);
        disegnaDJ(f);
        disegnaPedana(f);
        disegnaZucco(f);
      });

      g.espone({
        gioca: (m) => mossa(m),
        statoGioco: () => ({
          pista: inRighe(stato.pista),
          passi: stato.passi,
          limite: v.limite,
          minimo: v.minimo,
          accese: contaBit(stato.pista),
          risolto: stato.risolto,
          conferma: stato.conferma,
        }),
        posizione: (r, c) => posizione(r, c),
      });
    },
  };
  EscapeDemo.avvia(opzioni);
})();
