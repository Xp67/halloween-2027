// L'Angelo Azzurro (Sala Bar): travasi fra uno shaker e due bicchieri senza tacche.
// Indici dei contenitori ovunque: 0 = shaker, 1 = bicchiere grande, 2 = bicchiere piccolo.

(function () {
  "use strict";
  const { C, GEMME, rett, retino, sprite, testo, larghezzaTesto, intero } = EscapeDemo;

  // ── Variante ──
  // [shaker, bicchiere grande, bicchiere piccolo] e numero minimo di travasi (ricerca in ampiezza).
  const RICETTE = [
    { capacita: [12, 8, 5], minimo: 7 },
    { capacita: [10, 7, 3], minimo: 9 },
    { capacita: [12, 7, 5], minimo: 11 },
    { capacita: [14, 8, 3], minimo: 9 },
    { capacita: [12, 9, 5], minimo: 8 },
    { capacita: [16, 10, 3], minimo: 11 },
  ];

  // ── Logica pura ──
  /** Un travaso: { nuovi, q } oppure { motivo }. */
  function versa(livelli, cap, da, a) {
    if (![0, 1, 2].includes(da) || ![0, 1, 2].includes(a)) return { motivo: "mossa" };
    if (da === a) return { motivo: "stesso" };
    if (livelli[da] === 0) return { motivo: "vuoto" };
    if (livelli[a] === cap[a]) return { motivo: "pieno" };
    const q = Math.min(livelli[da], cap[a] - livelli[a]);
    const nuovi = [...livelli];
    nuovi[da] -= q;
    nuovi[a] += q;
    return { nuovi, q };
  }

  /**
   * stato + mossa → nuovo stato ed esito.
   * Ritorna { rif } se la mossa è rifiutata (stato invariato), altrimenti
   * { tipo: "ok" | "risolto" | "limite" | "ricomincia", st, q?, prima, dopo? }.
   */
  function applica(st, v, m) {
    const [A] = v.capacita;
    const inizio = { livelli: [A, 0, 0], travasi: 0, selezionato: null };
    if (m && m.azione === "ricomincia") {
      if (st.travasi === 0) return { rif: "inizio" };
      return { tipo: "ricomincia", st: inizio, prima: st.livelli };
    }
    if (!m || !Number.isInteger(m.da) || !Number.isInteger(m.a)) return { rif: "mossa" };
    const r = versa(st.livelli, v.capacita, m.da, m.a);
    if (r.motivo) return { rif: r.motivo };
    const travasi = st.travasi + 1;
    const nuovo = { livelli: r.nuovi, travasi, selezionato: null };
    if (r.nuovi[0] === v.meta && r.nuovi[1] === v.meta)
      return { tipo: "risolto", st: nuovo, q: r.q, prima: st.livelli, dopo: r.nuovi };
    if (travasi >= v.limite)
      return { tipo: "limite", st: inizio, q: r.q, prima: st.livelli, dopo: r.nuovi, travasi };
    return { tipo: "ok", st: nuovo, q: r.q, prima: st.livelli, dopo: r.nuovi };
  }

  // ── Grafica: costanti ──
  const Z = GEMME.zaffiro; // scura, media, chiara
  const CX = [110, 160, 208];
  const SIN = [100, 151, 201];
  const LARG = [20, 18, 14];
  const zona = (x, y) => {
    for (let i = 0; i < 3; i++) if (Math.abs(x - CX[i]) <= 18 && y >= 30 && y <= 134) return i;
    return null;
  };

  const NEON = [
    "...........YY..",
    "...........YY..",
    "AAAAAAAAAAAAAAA",
    ".A...........A.",
    "..A.........A..",
    "..A.........A..",
    "...A.......A...",
    "....A.....A....",
    ".....A...A.....",
    ".....A...A.....",
    "......A.A......",
    ".......A.......",
    ".......A.......",
    ".......A.......",
    ".......A.......",
    ".......A.......",
    ".......A.......",
    ".......A.......",
    ".......A.......",
    ".......A.......",
    "...AAAAAAAAA...",
  ];
  const TAPPO = [
    "........kkkk........",
    "......kkwspfkk......",
    ".....kwsppppfFk.....",
    ".....kspppppfFk.....",
    "....kkkkkkkkkkkk....",
    ".....kspppppfFk.....",
    ".....kspppppfFk.....",
    "....kkkkkkkkkkkk....",
    "....kwsppppppfFk....",
    "...kssppppppfffFk...",
    "..ksppppppppfffFFk..",
    ".kspppppppppffffFFk.",
    "kkkkkkkkkkkkkkkkkkkk",
    "kwssppppppppppfffFFk",
    "kkkkkkkkkkkkkkkkkkkk",
  ];
  const PIEDE = [
    "kkkkkkkkkkkkkkkkkkkk",
    "kwssppppppppppfffFFk",
    ".kkkkkkkkkkkkkkkkkk.",
  ];
  const FRECCIA = [
    "kkkkkkkkkkk",
    "kyyyyyyyyyk",
    ".kyyyyyyyk.",
    "..kyyyyyk..",
    "...kyyyk...",
    "....kyk....",
    ".....k.....",
  ];
  const ZUCCO = [
    ".......Gg.......",
    "......GGg.......",
    "...kkkkkkkkkk...",
    "..koOOyyyOOOok..",
    ".koOOyyhyyOOOok.",
    ".koOyEEyyOEEOok.",
    ".koOEeeEyOEeeEk.",
    ".koOOEEOOEOEEOk.",
    ".koOOOOOEEOOOOk.",
    ".koObEbEbEbEbOk.",
    ".kooOeEeEeEeOok.",
    "..kooOOOOOOOok..",
    "..kkkkkkkkkkkk..",
    "..kqqppppppPPk..",
    ".kqqpppppppPPPk.",
    ".kqppppppppPPPk.",
    "kqqpppppppppPPPk",
    "kqpppppppppPPPPk",
    "kkkkkkkkkkkkkkkk",
    "...kLBk..kLBk...",
    "...kLBk..kLBk...",
    "...kLBk..kLBk...",
    "..kTRRk.kTRRk...",
    "..kkkkk.kkkkk...",
  ];
  const COLORI_ZUCCO = {
    k: C.bordo, O: C.brace, y: C.fiamma, h: C.fiammaChiara, E: C.oro, e: C.luna,
    q: C.lilla, p: C.viola, P: C.violaScuro, L: C.ferroChiaro, B: C.ferro, R: C.legnoChiaro, T: C.legnoLuce,
    // Fuori paletta, motivati: sono i colori di Zucco nella fuga di Zucco (zucco/src/sprite-provvisori.js).
    G: "#2d5a2e", g: "#5f9440", o: "#9c3b17", b: "#4a1a12",
  };
  const ZUCCO_CHIUSO = {
    5: ".koOyOOyyOOOOok.",
    6: ".koObbbbyObbbbk.",
    7: ".koOOOOOOOOOOOk.",
  };
  const CUORE = [
    ".kk.kk.",
    "krrkrrk",
    "krrrrrk",
    ".krrrk.",
    "..krk..",
    "...k...",
  ];
  const STELLA = ["..g..", "..g..", "ggWgg", "..g..", "..g.."];
  const STELLINA = [".g.", "gWg", ".g."];

  const MSG_INIZIO = "Tocca un contenitore e poi quello in cui versare, o trascinalo.";
  const SCOSSE = [-1, 1, -1, 1, -1, 0];

  const opzioni = {
    id: "angelo-azzurro",
    sfondo: "sala-bar",
    velo: 0.5,

    // Una sola chiamata a rng.
    variante(rng) {
      const r = RICETTE[intero(rng, 0, RICETTE.length - 1)];
      return { capacita: [...r.capacita], meta: r.capacita[0] / 2, minimo: r.minimo, limite: r.minimo + 6 };
    },

    crea(g) {
      const v = g.variante;
      const { capacita: cap, meta: M, minimo, limite } = v;
      const A = cap[0];
      opzioni.testo =
        `Lo scheletro barista ha uno shaker con ${A} cl di Angelo Azzurro e due bicchieri vuoti da ${cap[1]} e da ${cap[2]} cl, senza tacche. ` +
        `Deve dividere il drink a metà: ${M} cl nello shaker e ${M} nel bicchiere grande.\n` +
        `Si può solo versare da un contenitore all'altro finché il primo non si svuota o il secondo non si riempie.\n` +
        `Hai ${limite} travasi: se finiscono prima, lo scheletro rimette tutto nello shaker e conta come un errore. ` +
        `Anche ricominciare da capo conta come un errore.`;

      const ctx = g.ctx;
      const riduci = g.riduciMovimento;
      const pxCl = Math.floor(56 / A);
      const altezza = [18 + A * pxCl, 6 + cap[1] * pxCl, 6 + cap[2] * pxCl];
      const alto = altezza.map((h) => 116 - h);

      // ── Stato ──
      let livelli = [A, 0, 0];
      let travasi = 0;
      let selezionato = null;
      let ripreso = false;
      const m0 = g.memoria;
      const validi = Array.isArray(m0.livelli) && m0.livelli.length === 3 &&
        m0.livelli.every((n, i) => Number.isInteger(n) && n >= 0 && n <= cap[i]) &&
        m0.livelli.reduce((s, n) => s + n, 0) === A &&
        !(m0.livelli[0] === M && m0.livelli[1] === M) &&
        Number.isInteger(m0.travasi) && m0.travasi >= 0 && m0.travasi < limite;
      if (g.giaRisolto) {
        livelli = [M, M, 0];
        travasi = Number.isInteger(m0.travasi) ? m0.travasi : minimo;
      } else if (validi) {
        livelli = [...m0.livelli];
        travasi = m0.travasi;
        ripreso = travasi > 0;
      }

      // ── Effetti e animazioni ──
      const coda = []; // segmenti: { tipo, t0, fine, dur, ... }
      let festaT = g.giaRisolto ? -1e9 : Infinity; // inizio della festa della vittoria
      let erroreT = -1e9;
      const scosse = [-1e9, -1e9, -1e9];
      let premuto = null, sopra = null, trascinando = false, inizioX = 0, inizioY = 0;
      let conferma = false, timerConf = 0;

      const nome = (i) => (i === 0 ? "lo shaker" : `il bicchiere da ${cap[i]}`);
      const Nome = (i) => (i === 0 ? "Lo shaker" : `Il bicchiere da ${cap[i]}`);

      function geometria(da, a) {
        const d = CX[a] > CX[da] ? 1 : -1;
        const xv = d > 0 ? SIN[a] - 2 - LARG[da] : SIN[a] + LARG[a] + 2;
        const su = Math.max(4, alto[da] - (alto[a] - 8));
        const bx = da === 0 ? xv + (d > 0 ? 13 : 6) : xv + (d > 0 ? LARG[da] - 1 : 0);
        const becco = { x: bx, y: alto[da] - su };
        const bocca = a === 0 ? { x: 110, y: alto[0] } : { x: CX[a], y: alto[a] + 3 };
        return { d, xv, su, becco, bocca };
      }

      function accoda(seg) {
        const inizio = coda.length ? coda[coda.length - 1].fine : g.tempo;
        seg.t0 = inizio;
        seg.fine = inizio + seg.dur;
        coda.push(seg);
      }
      function accodaTravaso(da, a, q, prima, dopo) {
        const versaDur = Math.min(700, 250 + 50 * q);
        accoda({ tipo: "travaso", da, a, q, prima, dopo, versaDur, dur: 200 + versaDur + 200, geo: geometria(da, a) });
      }
      function accodaRovescia(da, a, dur = 500) {
        accoda({ tipo: "rovescia", daLiv: da, aLiv: a, dur });
      }

      /** Cosa mostrare ora: livelli disegnati, sorgente che versa, getto, contorni rossi. */
      function vista(ora) {
        while (coda.length && ora >= coda[0].fine) coda.shift();
        const s = coda[0];
        if (!s || ora < s.t0) return { liv: livelli, sorg: null, rovescia: false };
        const el = ora - s.t0;
        if (s.tipo === "rovescia") {
          const p = el / s.dur;
          return { liv: s.daLiv.map((n, i) => Math.round(n + (s.aLiv[i] - n) * p)), sorg: null, rovescia: true };
        }
        const ease = (p) => 1 - (1 - p) * (1 - p);
        const { geo, da, a, q } = s;
        let f, liv, getto = null;
        if (el < 200) {
          f = ease(el / 200);
          liv = s.prima;
        } else if (el < 200 + s.versaDur) {
          f = 1;
          const p = (el - 200) / s.versaDur;
          const k = Math.round(q * Math.min(1, Math.max(0, (p - 0.2) / 0.6)));
          liv = [...s.prima];
          liv[da] -= k;
          liv[a] += k;
          getto = { testa: Math.min(1, p / 0.2), coda: Math.max(0, (p - 0.8) / 0.2), p };
        } else {
          f = ease(1 - (el - 200 - s.versaDur) / 200);
          liv = s.dopo;
        }
        const sorg = {
          i: da, a, geo, getto,
          x: SIN[da] + Math.round((geo.xv - SIN[da]) * f),
          sollevo: Math.round(geo.su * f),
        };
        return { liv, sorg, rovescia: false };
      }

      // ── Messaggi ──
      const dimmi = (t) => g.messaggio(t);
      function msgTravaso(da, a, q) {
        const cl = q === 1 ? "Versato 1 cl" : `Versati ${q} cl`;
        let resto;
        if (da === 0) resto = `dallo shaker nel bicchiere da ${cap[a]}`;
        else if (a === 0) resto = `dal bicchiere da ${cap[da]} nello shaker`;
        else resto = `dal bicchiere da ${cap[da]} in quello da ${cap[a]}`;
        let s = `${cl} ${resto}.`;
        const r = limite - travasi;
        if (r >= 1 && r <= 3) s += r === 1 ? " Resta 1 travaso." : ` Restano ${r} travasi.`;
        return s;
      }
      function scossa(i) {
        if (riduci) { scosse[i] = g.tempo - 240; return; }
        scosse[i] = g.tempo;
      }

      function salvaMemoria() {
        g.memoria.livelli = [...livelli];
        g.memoria.travasi = travasi;
        g.salvaMemoria();
      }

      function annullaConferma(ripristina) {
        if (!conferma) return;
        conferma = false;
        clearTimeout(timerConf);
        btnRicomincia.textContent = "Ricomincia";
        if (ripristina) dimmi(MSG_INIZIO);
      }

      /** Applica UNA mossa (la usano tocchi, trascinamento, bottone e prove) e ne mostra gli effetti. */
      function esegui(m) {
        annullaConferma(true);
        const ora = g.tempo;
        const r = applica({ livelli, travasi, selezionato }, v, m);
        if (r.rif) {
          if (r.rif === "vuoto") { dimmi(`${Nome(m.da)} è vuoto: non c'è niente da versare.`); scossa(m.da); }
          else if (r.rif === "pieno") { dimmi(`${Nome(m.a)} è già pieno fino all'orlo.`); scossa(m.a); }
          else if (r.rif === "stesso") { dimmi("Scegli un altro contenitore in cui versare."); scossa(m.da); }
          else if (r.rif === "inizio") dimmi("Sei già all'inizio: shaker pieno e bicchieri vuoti.");
          return { valida: false, motivo: r.rif };
        }
        coda.length = 0; // un'animazione in corso salta alla fine
        livelli = [...r.st.livelli];
        travasi = r.st.travasi;
        selezionato = null;
        salvaMemoria();

        if (r.tipo === "ricomincia") {
          if (!riduci) accodaRovescia(r.prima, [A, 0, 0]);
          erroreT = ora;
          g.errore("Ricominciare conta come un errore");
          dimmi(`Si riparte con lo shaker pieno: hai di nuovo ${limite} travasi.`);
          return { errore: true, motivo: "ricomincia", livelli: [...livelli], travasi };
        }
        if (!riduci) accodaTravaso(m.da, m.a, r.q, r.prima, r.dopo);
        if (r.tipo === "limite") {
          if (!riduci) accodaRovescia(r.dopo, [A, 0, 0]);
          erroreT = ora;
          g.errore("Finiti i travasi: lo scheletro rimette tutto nello shaker");
          dimmi(`Si riparte con lo shaker pieno: hai di nuovo ${limite} travasi.`);
          return { errore: true, motivo: "limite", versati: r.q, livelli: [...livelli], travasi };
        }
        if (r.tipo === "risolto") {
          festaT = riduci || !coda.length ? ora : coda[coda.length - 1].fine;
          dimmi(`${M} cl nello shaker e ${M} nel bicchiere grande: diviso a metà!`);
          g.risolto({
            riepilogo: travasi === minimo
              ? `Hai diviso l'Angelo Azzurro in ${travasi} travasi: il minimo possibile!`
              : `Hai diviso l'Angelo Azzurro in ${travasi} travasi (il minimo era ${minimo}).`,
            ritardo: 1800,
          });
          return { risolto: true, versati: r.q, livelli: [...livelli], travasi };
        }
        dimmi(msgTravaso(m.da, m.a, r.q));
        return { ok: true, versati: r.q, livelli: [...livelli], travasi };
      }

      // ── Tocchi e trascinamento ──
      function tocco(i) {
        if (i === null) {
          if (selezionato !== null) { selezionato = null; dimmi(MSG_INIZIO); }
          return;
        }
        if (selezionato === null) {
          if (livelli[i] === 0) {
            dimmi(`${Nome(i)} è vuoto: non c'è niente da versare.`);
            scossa(i);
            return;
          }
          selezionato = i;
          dimmi(`Preso ${nome(i)}: ora tocca dove versarlo.`);
          return;
        }
        if (i === selezionato) { selezionato = null; dimmi(MSG_INIZIO); return; }
        const da = selezionato;
        selezionato = null;
        esegui({ da, a: i });
      }

      g.tocca(({ tipo, x, y, premuto: giu }) => {
        if (tipo === "giu") {
          annullaConferma(true);
          premuto = zona(x, y);
          inizioX = x; inizioY = y;
          trascinando = false;
          sopra = null;
        } else if (tipo === "muovi") {
          if (premuto !== null && giu) {
            if (!trascinando && Math.hypot(x - inizioX, y - inizioY) > 4) trascinando = true;
            if (trascinando) sopra = zona(x, y);
          }
        } else if (tipo === "su") {
          if (trascinando) {
            const z = zona(x, y);
            if (z !== null && z !== premuto) esegui({ da: premuto, a: z });
            selezionato = null;
          } else tocco(premuto);
          premuto = null; sopra = null; trascinando = false;
        }
      });
      addEventListener("keydown", (e) => {
        if (!["1", "2", "3"].includes(e.key) || g.stato().risolto) return;
        if (document.querySelector(".kit-velo-carta:not([hidden])")) return;
        tocco(Number(e.key) - 1);
      });

      const btnRicomincia = g.bottone("Ricomincia", () => {
        if (travasi === 0) { esegui({ azione: "ricomincia" }); return; }
        if (!conferma) {
          conferma = true;
          btnRicomincia.textContent = "Conferma";
          dimmi("Ricominciare conta come un errore: tocca «Conferma» per farlo.");
          timerConf = setTimeout(() => annullaConferma(true), 4000);
          return;
        }
        esegui({ azione: "ricomincia" });
      }, { id: "ricomincia" });
      if (g.giaRisolto) btnRicomincia.disabled = true;

      if (g.giaRisolto) dimmi("Il drink è già diviso a metà: salute!");
      else if (ripreso) dimmi(`Si riprende da dove eri: ${travasi} travasi su ${limite}.`);
      else dimmi(MSG_INIZIO);

      // ── Disegno ──
      function interno(x, y, wi, hi, livello, indice) {
        const hl = livello * pxCl;
        for (let r = 0; r < hi; r++) {
          const yy = y + r, dalFondo = hi - 1 - r;
          if (dalFondo < hl) {
            if (dalFondo === hl - 1) {
              rett(ctx, Z[2], x, yy, wi - 2, 1);
              rett(ctx, Z[1], x + wi - 2, yy, 2, 1);
            } else {
              rett(ctx, Z[1], x, yy, wi, 1);
              rett(ctx, Z[2], x + 1, yy, 1, 1);
              rett(ctx, Z[0], x + wi - 3, yy, 3, 1);
            }
          } else {
            retino(ctx, C.sagoma, C.notte, x, yy, wi, 1, 0.45);
            if (r >= 1) rett(ctx, C.notteChiara, x + 1, yy, 1, 1);
          }
        }
        if (hl > 0 && !riduci) {
          rett(ctx, C.bianco, x + ((g.fotogramma + 3 * indice) % (wi - 2)), y + hi - hl, 1, 1);
          if (hl >= 6) rett(ctx, Z[2], x + 3 + indice, y + hi - 2 - ((g.fotogramma + 7 * indice) % (hl - 1)), 1, 1);
        }
      }
      function disegnaShaker(x0, y0, livello, bordo) {
        const hi = A * pxCl;
        const col = { k: bordo, w: C.bianco, s: C.pietraChiara, p: C.pietra, f: C.ferroChiaro, F: C.ferro };
        sprite(ctx, TAPPO, col, x0, y0);
        const yb = y0 + 15;
        rett(ctx, bordo, x0, yb, 1, hi); rett(ctx, C.pietraChiara, x0 + 1, yb, 1, hi);
        rett(ctx, C.ferroChiaro, x0 + 18, yb, 1, hi); rett(ctx, bordo, x0 + 19, yb, 1, hi);
        interno(x0 + 2, yb, 16, hi, livello, 0);
        sprite(ctx, PIEDE, col, x0, yb + hi);
      }
      function disegnaBicchiere(i, x0, y0, livello, bordo) {
        const wi = i === 1 ? 14 : 10, W = wi + 4, hi = cap[i] * pxCl;
        rett(ctx, bordo, x0, y0, W, 1);
        rett(ctx, bordo, x0, y0 + 1, 1, 1); rett(ctx, bordo, x0 + W - 1, y0 + 1, 1, 1);
        rett(ctx, C.pietraChiara, x0 + 1, y0 + 1, W - 2, 1);
        rett(ctx, C.bianco, x0 + 2, y0 + 1, 2, 1);
        const yb = y0 + 2;
        rett(ctx, bordo, x0, yb, 1, hi); rett(ctx, C.pietraChiara, x0 + 1, yb, 1, hi);
        rett(ctx, C.ferroChiaro, x0 + W - 2, yb, 1, hi); rett(ctx, bordo, x0 + W - 1, yb, 1, hi);
        interno(x0 + 2, yb, wi, hi, livello, i);
        const yf = yb + hi;
        rett(ctx, bordo, x0, yf, 1, 3); rett(ctx, bordo, x0 + W - 1, yf, 1, 3);
        rett(ctx, C.notteChiara, x0 + 1, yf, W - 2, 3);
        rett(ctx, C.pietraChiara, x0 + 1, yf, W - 4, 1);
        rett(ctx, C.bianco, x0 + 2, yf + 1, 2, 1);
        rett(ctx, C.notte, x0 + W - 4, yf + 1, 3, 2);
        rett(ctx, bordo, x0 + 1, yf + 3, W - 2, 1);
      }
      function contenitore(i, x, y, livello, bordo) {
        if (i === 0) disegnaShaker(x, y, livello, bordo);
        else disegnaBicchiere(i, x, y, livello, bordo);
      }
      function targhetta(cx, n, c, coloreNumero) {
        rett(ctx, C.bordo, cx - 15, 120, 30, 13);
        rett(ctx, C.oroScuro, cx - 14, 121, 28, 11);
        rett(ctx, C.oro, cx - 14, 121, 28, 1); rett(ctx, C.oro, cx - 14, 121, 1, 11);
        rett(ctx, C.sagoma, cx - 12, 123, 24, 7);
        const a = String(n), b = "/" + c;
        const wa = larghezzaTesto(a), wb = larghezzaTesto(b, { piccolo: true });
        const sx = cx - Math.floor((wa + 1 + wb) / 2);
        testo(ctx, a, sx, 123, { colore: coloreNumero, ombra: null });
        testo(ctx, b, sx + wa + 1, 125, { piccolo: true, colore: C.pietra, ombra: null });
      }
      function lavagna(risoltoVis, ora) {
        rett(ctx, C.bordo, 16, 74, 76, 38);
        rett(ctx, C.legnoChiaro, 17, 75, 74, 36);
        rett(ctx, C.legnoLuce, 17, 75, 74, 1); rett(ctx, C.legnoLuce, 17, 75, 1, 36);
        rett(ctx, C.legno, 17, 110, 74, 1);
        rett(ctx, C.bordo, 19, 77, 70, 32);
        rett(ctx, C.siepe, 20, 78, 68, 30);
        rett(ctx, C.bordo, 23, 112, 4, 4); rett(ctx, C.legno, 24, 112, 2, 3);
        rett(ctx, C.bordo, 81, 112, 4, 4); rett(ctx, C.legno, 82, 112, 2, 3);
        testo(ctx, "META", 54, 80, { piccolo: true, colore: C.pietraChiara, ombra: null, allinea: "centro" });
        testo(ctx, `${M} + ${M}`, 54, 87, { colore: risoltoVis ? C.acqua : C.bianco, ombra: null, allinea: "centro" });
        for (let x = 22; x <= 86; x += 2) rett(ctx, C.ferroChiaro, x, 96, 1, 1);
        if (risoltoVis) testo(ctx, "SALUTE!", 54, 99, { colore: C.giallo, ombra: null, allinea: "centro" });
        else {
          const coloreConto = ora - erroreT < 1200 ? C.tappetoChiaro : limite - travasi <= 3 ? C.giallo : C.bianco;
          testo(ctx, "TRAVASI", 22, 100, { piccolo: true, colore: C.pietraChiara, ombra: null });
          testo(ctx, `${travasi}/${limite}`, 86, 99, { colore: coloreConto, ombra: null, allinea: "destra" });
        }
      }
      function getto(s) {
        const { geo, getto: gt } = s;
        const x0 = geo.becco.x + geo.d, y0 = geo.becco.y;
        const x1 = geo.bocca.x, y1 = geo.bocca.y;
        const n = Math.max(1, 2 * Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)));
        const pts = [];
        for (let k = 0; k <= n; k++) {
          const t = k / n;
          if (t < gt.coda || t > gt.testa) continue;
          pts.push([Math.round(x0 + (x1 - x0) * t), Math.round(y0 + (y1 - y0) * t - 16 * t * (1 - t))]);
        }
        for (const [x, y] of pts) rett(ctx, C.bordo, x - 1, y - 1, 4, 4);
        for (const [x, y] of pts) rett(ctx, Z[1], x, y, 2, 2);
        for (const [x, y] of pts) rett(ctx, Z[2], x, y, 1, 1);
        if (gt.testa >= 1 && gt.coda === 0 && gt.p <= 0.8 && !riduci) {
          const f = g.fotogramma & 1;
          rett(ctx, C.bianco, x1 + (f ? -2 : 2), y1 - 2 - f, 1, 1);
          rett(ctx, Z[2], x1 + (f ? 3 : -3), y1 - 3 + f, 1, 1);
        }
      }

      function disegna() {
        const ora = g.tempo, fr = g.fotogramma;
        ctx.clearRect(0, 0, g.larghezza, g.altezza);
        const vis = vista(ora);
        const liv = vis.liv;
        const festa = ora >= festaT;
        const sinceFesta = ora - festaT;
        const inErrore = ora - erroreT < 2000;

        // 2. luce sul bancone
        for (let bx = 56; bx < 264; bx += 4) {
          const q = 0.65 * Math.max(0, 1 - Math.abs(bx + 2 - 160) / 104);
          retino(ctx, C.legnoScuro, C.legnoChiaro, bx, 113, 4, 5, q);
        }
        // 3. neon riacceso
        const lampeggia = festa && !riduci && sinceFesta < 750 && Math.floor(sinceFesta / 125) % 2 === 1;
        const sfarfalla = !riduci && (fr % 53 === 0 || fr % 53 === 2);
        if (!lampeggia && !sfarfalla) {
          sprite(ctx, NEON, { A: C.acqua, Y: C.giallo }, 132, 10);
          testo(ctx, "BAR", 152, 16, { scala: 2, colore: C.rosa, ombra: null });
        }
        // 4. occhi dello scheletro
        if (inErrore) {
          rett(ctx, C.tappetoChiaro, 253, 74, 2, 2); rett(ctx, C.tappetoChiaro, 257, 74, 2, 2);
          testo(ctx, "!", 256, 60, { colore: C.tappetoChiaro, allinea: "centro" });
        } else if (festa) {
          rett(ctx, C.giallo, 253, 75, 1, 1); rett(ctx, C.giallo, 257, 75, 1, 1);
        } else if (riduci || fr % 37 !== 0) {
          rett(ctx, C.acqua, 253, 75, 1, 1); rett(ctx, C.acqua, 257, 75, 1, 1);
        }
        // 5. lavagna
        lavagna(festa, ora);

        // contorni e sollevamenti
        const stato = [0, 1, 2].map(() => ({ su: 0, bordo: C.bordo }));
        const giallo = (i) => { stato[i] = { su: 3, bordo: C.giallo }; };
        const acqua = (i) => { stato[i] = { su: 1, bordo: C.acqua }; };
        if (trascinando) {
          giallo(premuto);
          if (sopra !== null && sopra !== premuto) acqua(sopra);
        } else if (premuto !== null) {
          if (selezionato !== null && selezionato !== premuto) { giallo(selezionato); acqua(premuto); }
          else giallo(premuto);
        } else if (selezionato !== null) giallo(selezionato);
        if (vis.rovescia) for (let i = 0; i < 3; i++) stato[i] = { su: 0, bordo: C.tappetoChiaro };

        const sorgI = vis.sorg ? vis.sorg.i : -1;
        const dxScossa = (i) => {
          const step = Math.floor((ora - scosse[i]) / 40);
          return step >= 0 && step < SCOSSE.length ? SCOSSE[step] : 0;
        };
        // 6. ombre
        for (let i = 0; i < 3; i++) {
          if (i === sorgI) continue;
          retino(ctx, C.legno, C.legnoScuro, SIN[i] + 3, 114, LARG[i], 3, 0.6);
        }
        // 7. contenitori fermi, poi targhette
        for (let i = 0; i < 3; i++) {
          if (i === sorgI) continue;
          contenitore(i, SIN[i] + dxScossa(i), alto[i] - stato[i].su, liv[i], stato[i].bordo);
        }
        for (let i = 0; i < 3; i++) {
          targhetta(CX[i], liv[i], cap[i], ora - scosse[i] < 300 ? C.tappetoChiaro : C.bianco);
        }
        // 8. il contenitore che versa, il getto
        if (vis.sorg) {
          const s = vis.sorg;
          contenitore(s.i, s.x, alto[s.i] - s.sollevo, liv[s.i], C.bordo);
          if (s.getto) getto(s);
        }
        // 9. freccia
        if (premuto === null && selezionato !== null && !vis.sorg) {
          const dy = riduci ? 0 : (fr >> 1) & 1;
          sprite(ctx, FRECCIA, { k: C.bordo, y: C.giallo }, CX[selezionato] - 5, alto[selezionato] - 12 + dy);
        }
        // 10. sgabello e Zucco
        rett(ctx, C.bordo, 16, 145, 20, 7);
        rett(ctx, C.tappeto, 17, 146, 18, 5);
        rett(ctx, C.tappetoChiaro, 17, 146, 18, 1);
        rett(ctx, C.ferro, 25, 151, 2, 3);
        let zy = 0;
        if (inErrore && ora - erroreT < 250) zy = -2;
        if (festa && !riduci && ((sinceFesta >= 0 && sinceFesta < 125) || (sinceFesta >= 250 && sinceFesta < 375))) zy = -3;
        const respiro = !riduci && ((fr >> 2) & 1) === 1 ? 1 : 0;
        const chiuso = !riduci && fr % 29 === 0;
        sprite(ctx, ZUCCO.slice(13), COLORI_ZUCCO, 18, 143 + zy);
        const testa = ZUCCO.slice(0, 13).map((riga, r) => (chiuso && ZUCCO_CHIUSO[r]) || riga);
        sprite(ctx, testa, COLORI_ZUCCO, 18, 130 + zy + respiro);
        if (inErrore) testo(ctx, "?!", 26, 119, { colore: C.giallo, allinea: "centro" });
        else if (festa && sinceFesta < 2500) sprite(ctx, CUORE, { k: C.bordo, r: C.rosa }, 23, 118 + zy);
        // 11. stelline
        if (festa) {
          const vede = (k) => riduci || (fr + 2 * k) % 6 < 3;
          const col = { g: C.giallo, W: C.bianco };
          if (vede(0)) sprite(ctx, STELLA, col, SIN[0] - 4, alto[0] + 10);
          if (vede(1)) sprite(ctx, STELLINA, col, SIN[0] + 24, alto[0] + 22);
          if (vede(2)) sprite(ctx, STELLA, col, SIN[1] - 5, alto[1] - 2);
          if (vede(3)) sprite(ctx, STELLINA, col, SIN[1] + 21, alto[1] + 8);
        }
      }
      g.anima(disegna);

      g.espone({
        gioca: (mossa) => esegui(mossa),
        statoGioco: () => ({ livelli: [...livelli], capacita: [...cap], travasi, limite, selezionato }),
        posizione: (i) => ({ x: CX[i], y: 108 }),
      });
    },
  };

  EscapeDemo.avvia(opzioni);
})();
