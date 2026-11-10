// Gli otto candelabri (Ingresso): otto candelabri sulla scacchiera, nessuno deve vederne un altro.
// Logica pura in `passo` (stato + mossa -> nuovo stato ed esito); il disegno legge lo stato.

(function () {
  "use strict";
  const { C, rett, riquadro, retino, sprite, testo, intero } = EscapeDemo;

  // ── Le 308 coppie di caselle fisse che lasciano una sola soluzione: "r1 c1 r2 c2" ──
  const COPPIE = (
    "0014 0015 0023 0024 0032 0037 0041 0042 0046 0047 0051 0056 0064 0065 " +
    "0073 0074 0113 0117 0120 0122 0124 0127 0132 0133 0135 0136 0143 0147 " +
    "0150 0160 0162 0210 0217 0233 0255 0260 0264 0322 0335 0344 0354 0355 " +
    "0361 0367 0370 0377 0425 0432 0443 0452 0453 0460 0466 0470 0477 0510 " +
    "0517 0534 0552 0563 0567 0610 0614 0620 0623 0625 0627 0631 0632 0634 " +
    "0635 0640 0644 0657 0665 0667 0712 0713 0723 0724 0730 0735 0740 0741 " +
    "0745 0746 0751 0756 0762 0763 0773 0774 1022 1023 1026 1031 1033 1034 " +
    "1042 1053 1063 1071 1072 1074 1136 1137 1163 1173 1246 1271 1277 1325 " +
    "1332 1344 1354 1356 1360 1361 1364 1375 1377 1422 1435 1443 1451 1453 " +
    "1463 1466 1467 1470 1472 1541 1570 1576 1630 1631 1664 1674 1721 1724 " +
    "1725 1733 1734 1736 1745 1754 1764 1773 1775 1776 2033 2046 2055 2071 " +
    "2164 2170 2177 2230 2235 2241 2247 2253 2257 2274 2275 2331 2340 2352 " +
    "2360 2364 2374 2436 2447 2455 2463 2467 2473 2532 2537 2540 2546 2550 " +
    "2554 2572 2573 2663 2670 2677 2734 2741 2752 2776 3044 3045 3053 3055 " +
    "3076 3077 3144 3145 3146 3152 3157 3165 3170 3177 3246 3247 3260 3270 " +
    "3346 3347 3364 3371 3374 3440 3441 3463 3473 3476 3540 3541 3567 3577 " +
    "3641 3642 3643 3650 3655 3662 3670 3677 3742 3743 3752 3754 3770 3771 " +
    "4052 4066 4077 4153 4160 4166 4176 4255 4263 4270 4271 4274 4276 4350 " +
    "4360 4367 4371 4372 4457 4460 4467 4475 4476 4552 4564 4571 4573 4576 " +
    "4577 4654 4661 4667 4671 4755 4761 4770 5071 5076 5167 5260 5264 5271 " +
    "5273 5360 5370 5376 5377 5467 5470 5471 5477 5563 5567 5574 5576 5660 " +
    "5771 5776 6072 6075 6076 6277 6371 6377 6470 6476 6570 6771 6772 6775"
  ).split(" ");

  /** L'unica disposizione con i due fissi: ritorna le otto caselle [riga, colonna] ordinate per riga. */
  function soluzione(fissi) {
    const fisso = new Map(fissi.map(([r, c]) => [r, c]));
    const col = [];
    const libera = (r, c) => {
      for (let q = 0; q < 8; q++) {
        if (q === r) continue;
        const cq = q < r ? col[q] : fisso.get(q);
        if (cq === undefined) continue;
        if (cq === c || Math.abs(cq - c) === Math.abs(q - r)) return false;
      }
      return true;
    };
    function cerca(r) {
      if (r === 8) return true;
      for (const c of fisso.has(r) ? [fisso.get(r)] : [0, 1, 2, 3, 4, 5, 6, 7]) {
        if (!libera(r, c)) continue;
        col[r] = c;
        if (cerca(r + 1)) return true;
      }
      return false;
    }
    cerca(0);
    return col.map((c, r) => [r, c]);
  }

  // ── Logica pura ──
  const eq = (a, b) => a[0] === b[0] && a[1] === b[1];
  const ha = (lista, p) => lista.some((q) => eq(q, p));
  const ordina = (l) => [...l].map(([r, c]) => [r, c]).sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const nome = ([r, c]) => "ABCDEFGH"[c] + (8 - r);
  const intOk = (n) => Number.isInteger(n) && n >= 0 && n < 8;
  const valida = (p) => Array.isArray(p) && p.length === 2 && intOk(p[0]) && intOk(p[1]);
  const chiave = (mobili) => ordina(mobili).map(([r, c]) => `${r},${c}`).join(";");
  const vede = (a, b) => a[0] === b[0] || a[1] === b[1] || Math.abs(a[0] - b[0]) === Math.abs(a[1] - b[1]);
  const chiSiSpegne = (tutti) => tutti.filter((a) => tutti.some((b) => b !== a && vede(a, b)));

  /** stato + mossa -> { st, esito, ev }. `ev` descrive cosa è successo, per messaggi e animazioni. */
  function passo(st, fissi, m) {
    const rifiuto = (motivo, extra = {}) => ({ st, esito: { valida: false, motivo }, ev: { tipo: "rifiuto", motivo, ...extra } });
    const daPosare = 6 - st.mobili.length;
    const cambia = (mobili) => ({ ...st, mobili, accesi: [], spenti: [] });
    if (!m || typeof m !== "object") return rifiuto("sconosciuta");
    switch (m.tipo) {
      case "posa": {
        const p = [m.riga, m.colonna];
        if (!valida(p)) return rifiuto("fuori");
        if (ha(fissi, p) || ha(st.mobili, p)) return rifiuto("occupata", { casella: p });
        if (daPosare === 0) return rifiuto("finiti");
        const mobili = [...st.mobili, p];
        return { st: cambia(mobili), esito: { ok: true, daPosare: 6 - mobili.length }, ev: { tipo: "posa", casella: p, daPosare: 6 - mobili.length } };
      }
      case "togli": {
        const p = [m.riga, m.colonna];
        if (!valida(p)) return rifiuto("fuori");
        if (ha(fissi, p)) return rifiuto("inchiodato", { casella: p });
        if (!ha(st.mobili, p)) return rifiuto("vuota");
        const mobili = st.mobili.filter((q) => !eq(q, p));
        return { st: cambia(mobili), esito: { ok: true, daPosare: 6 - mobili.length }, ev: { tipo: "togli", casella: p, daPosare: 6 - mobili.length } };
      }
      case "sposta": {
        if (!valida(m.da) || !valida(m.a)) return rifiuto("fuori");
        if (ha(fissi, m.da)) return rifiuto("inchiodato", { casella: m.da });
        if (!ha(st.mobili, m.da)) return rifiuto("vuota");
        if (ha(fissi, m.a) || ha(st.mobili, m.a)) return rifiuto("occupata", { casella: m.a });
        const mobili = st.mobili.map((q) => (eq(q, m.da) ? [m.a[0], m.a[1]] : q));
        return { st: cambia(mobili), esito: { ok: true }, ev: { tipo: "sposta", da: m.da, a: m.a } };
      }
      case "svuota": {
        const cera = st.mobili.length > 0;
        return { st: cambia([]), esito: { ok: true, daPosare: 6 }, ev: { tipo: "svuota", cera } };
      }
      case "accendi": {
        if (daPosare > 0) return rifiuto("mancano", { daPosare });
        if (chiave(st.mobili) === st.ultimo) return rifiuto("invariato");
        const tutti = ordina([...fissi, ...st.mobili]);
        const sp = ordina(chiSiSpegne(tutti));
        if (sp.length === 0) {
          return { st: { ...st, accesi: tutti, spenti: [], risolto: true }, esito: { risolto: true }, ev: { tipo: "vittoria", tutti } };
        }
        const acc = tutti.filter((p) => !ha(sp, p));
        return {
          st: { ...st, accesi: acc, spenti: sp, ultimo: chiave(st.mobili) },
          esito: { errore: true, spenti: sp },
          ev: { tipo: "errore", tutti, spenti: sp },
        };
      }
      default:
        return rifiuto("sconosciuta");
    }
  }

  // ── Sprite ──
  const CANDELABRO = [
    "......k......",
    ".....kwk.....",
    "..k..kwk..k..",
    ".kwk.kwk.kwk.",
    ".kwk.kwk.kwk.",
    ".kpk.kpk.kpk.",
    "kgoOkgoOkgoOk",
    ".kok.kok.kOk.",
    ".kgokkokkOOk.",
    "..kgooooOOk..",
    "...kkgoOkk...",
    "..kgooooOOk..",
    "...kkkkkkk...",
  ];
  const COLORI = {
    k: C.bordo, w: C.bianco, p: C.pietraChiara, s: C.pietra,
    o: C.oro, O: C.oroScuro, g: C.giallo, f: C.fiamma, h: C.fiammaChiara,
  };
  const STOPPINI = [[6, 0], [2, 2], [10, 2]];
  const FIAMME = [
    [".f.", "fhf", "fwf", ".h."],
    ["f..", "ff.", "fhf", ".h."],
    ["...", ".f.", "fhf", ".h."],
    ["..f", ".ff", "fhf", ".h."],
  ];
  const FUMO = [
    ["...", "...", ".s.", ".s."],
    ["..s", ".s.", ".s.", "..."],
    [".s.", "s..", "...", "..."],
    ["s..", "...", "...", "..."],
  ];
  const CORVO = [
    "...kkk......",
    "..kfffk.....",
    ".kfyfffk....",
    "kOOkffffk...",
    ".kkfffffk...",
    "..kfFffffk..",
    "..kfFFfffkk.",
    "...kfFFfffFk",
    "....kfFFFFFk",
    ".....kkkkkk.",
    "......kO.kO.",
  ];
  const COLORI_CORVO = { k: C.bordo, f: C.ferroChiaro, F: C.ferro, y: C.giallo, O: C.oroScuro };
  const ZUCCO = [
    ".............Gg........",
    "............GGg........",
    ".........kkkkkkkkkk....",
    "........koOOyyyOOOok...",
    ".......koOOyyhyyOOOok..",
    ".......koOyEEyyOEEOok..",
    ".......koOEeeEyOEeeEk..",
    ".......koOOEEOOEOEEOk..",
    ".......koOOOOOEEOOOOk..",
    ".......koObEbEbEbEbOk..",
    ".......kooOeEeEeEeOok..",
    "........kooOOOOOOOok...",
    ".....kkkkkkkkkkkkkk....",
    "....kqqpppppppk........",
    "...kqpppppppppPk.......",
    "..kqppppppppppPk.PPP...",
    ".kqpppPppppppPPk....kkk",
    "kqppPPkppppppPk.....kek",
    "kppPPk.kpppPPPk.....kEk",
    ".kPk...kpPPPPk......kkk",
    "..k.....kkkkk..........",
    "........kBBkLLk........",
    "........kBBkLLk........",
    "........kBBkLLk........",
    "........kBBkLLk........",
    "........kBBkLLk........",
    "........kBBkLLk........",
    "........kBBkLLk........",
    ".......kRRRkTTTk.......",
    ".......kkkkkkkkk.......",
  ];
  const ZUCCO_RESPIRO = [
    ".......................",
    ".............Gg........",
    "............GGg........",
    ".........kkkkkkkkkk....",
    "........koOOyyyOOOok...",
    ".......koOOyyhyyOOOok..",
    ".......koOyEEyyOEEOok..",
    ".......koOEeeEyOEeeEk..",
    ".......koOOEEOOEOEEOk..",
    ".......koOOOOOEEOOOOk..",
    ".......koObEbEbEbEbOk..",
    ".......kooOeEeEeEeOok..",
    "........kooOOOOOOOok...",
    ".....kkkkkkkkkkkkkk....",
    "....kqqpppppppk........",
    "...kqpppppppppPk.......",
    "..kqppppppppppPk.PPP...",
    ".kqpppPppppppPPk....kkk",
    "kqppPPkppppppPk.....kek",
    "kppPPk.kpppPPPk.....kEk",
    ".kPk...kpPPPPk......kkk",
    "..k.....kkkkk..........",
    "........kBBkLLk........",
    "........kBBkLLk........",
    "........kBBkLLk........",
    "........kBBkLLk........",
    "........kBBkLLk........",
    "........kBBkLLk........",
    ".......kRRRkTTTk.......",
    ".......kkkkkkkkk.......",
  ];
  const COLORI_ZUCCO = {
    k: C.bordo, O: C.brace, y: C.fiamma, h: C.fiammaChiara, E: C.oro, e: C.luna,
    P: C.violaScuro, p: C.viola, q: C.lilla,
    // fuori paletta, motivati: sono i colori di Zucco nella fuga di Zucco (zucco/src/sprite-provvisori.js),
    // così il protagonista è identico nei due giochi. Si usano solo per lui.
    o: "#9c3b17", b: "#4a1a12", G: "#2d5a2e", g: "#5f9440", B: "#463a6a", L: "#7a6aa4", R: "#5e3c44", T: "#83575c",
  };
  const STELLA = ["..g..", "..g..", "ggwgg", "..g..", "..g.."];
  const STELLINA = [".g.", "gwg", ".g."];

  const BX = 100; // scacchiera: angolo in alto a sinistra
  const BY = 25;
  const PASSO = 15;
  const chiaveCasella = (r, c) => r * 8 + c;
  const postoScorta = (i) => ({ x: 28 + (i % 2) * 27, y: 67 + Math.floor(i / 2) * 28 });

  EscapeDemo.avvia({
    id: "otto-candelabri",
    sfondo: "ingresso",
    velo: 0.5,

    variante(rng) {
      const s = COPPIE[intero(rng, 0, COPPIE.length - 1)];
      return { fissi: [[+s[0], +s[1]], [+s[2], +s[3]]] };
    },

    crea(g) {
      const RID = g.riduciMovimento;
      const fissi = g.variante.fissi.map(([r, c]) => [r, c]);

      // ── Stato ──
      let st = { mobili: [], accesi: [], spenti: [], ultimo: null, risolto: false };
      if (g.giaRisolto) {
        const sol = soluzione(fissi);
        st = {
          mobili: sol.filter((p) => !ha(fissi, p)), accesi: sol, spenti: [], ultimo: null, risolto: true,
        };
      } else {
        const m = g.memoria.mobili;
        if (Array.isArray(m) && m.length <= 6 && m.every(valida)) {
          const distinte = m.every((p, i) => m.findIndex((q) => eq(p, q)) === i);
          if (distinte && m.every((p) => !ha(fissi, p))) st.mobili = m.map(([r, c]) => [r, c]);
        }
        if (typeof g.memoria.ultimo === "string") st.ultimo = g.memoria.ultimo;
      }
      const salvaMemoria = () => {
        g.memoria.mobili = st.mobili;
        g.memoria.ultimo = st.ultimo;
        g.salvaMemoria();
      };

      // ── Animazioni (tempi in ms di g.tempo) ──
      const anim = {
        caduta: {}, arrivo: {}, trema: {}, occ: {}, salite: [],
        cartello: -1e9, invariato: -1e9, acc: null, zuccoErr: -1e9, vitt: -1e9,
      };
      let stelle = { f: -1, pos: null };

      // ── Messaggi ──
      const restano = (n) => (n === 1 ? "Ne resta 1 da posare." : `Ne restano ${n} da posare.`);
      function messaggiRifiuto(ev) {
        switch (ev.motivo) {
          case "inchiodato": g.messaggio(`Quello in ${nome(ev.casella)} è inchiodato al pavimento.`); break;
          case "occupata": g.messaggio("Lì c'è già un candelabro."); break;
          case "finiti": g.messaggio("Sono già tutti e otto sul pavimento."); break;
          case "mancano": g.messaggio(ev.daPosare === 1 ? "Ne manca ancora 1 da posare." : `Ne mancano ancora ${ev.daPosare} da posare.`); break;
          case "invariato": g.messaggio("Sono gli stessi di prima: sposta qualche candelabro."); break;
          default: break;
        }
      }

      // ── La mossa: la stessa funzione per tocchi, bottoni e prove ──
      function mossa(m) {
        const T = g.tempo;
        const { st: nuovo, esito, ev } = passo(st, fissi, m);
        st = nuovo;
        switch (ev.tipo) {
          case "rifiuto":
            messaggiRifiuto(ev);
            if (ev.motivo === "inchiodato" && !RID) anim.trema[chiaveCasella(...ev.casella)] = T;
            if (ev.motivo === "occupata") anim.occ[chiaveCasella(...ev.casella)] = T;
            if (ev.motivo === "finiti" || ev.motivo === "mancano") anim.cartello = T;
            if (ev.motivo === "invariato") anim.invariato = T;
            return esito;
          case "posa":
            anim.acc = null;
            if (!RID) anim.caduta[chiaveCasella(...ev.casella)] = T;
            g.messaggio(ev.daPosare === 0 ? `Posato in ${nome(ev.casella)}. Tutti e otto a posto: premi Accendi.` : `Posato in ${nome(ev.casella)}. ${restano(ev.daPosare)}`);
            break;
          case "togli":
            anim.acc = null;
            if (!RID) anim.salite.push({ r: ev.casella[0], c: ev.casella[1], t0: T });
            g.messaggio(`Tolto da ${nome(ev.casella)}. ${restano(ev.daPosare)}`);
            break;
          case "sposta":
            anim.acc = null;
            if (!RID) anim.arrivo[chiaveCasella(...ev.a)] = T;
            g.messaggio(`Spostato da ${nome(ev.da)} a ${nome(ev.a)}.`);
            break;
          case "svuota":
            anim.acc = null;
            g.messaggio(ev.cera ? "Tolti tutti: restano i due inchiodati." : "Ci sono solo i due inchiodati.");
            break;
          case "vittoria":
            anim.acc = RID ? null : { tipo: "ok", t0: T };
            anim.vitt = T;
            g.risolto({ riepilogo: `Nessuno si vede: ${ev.tutti.map(nome).join(", ")}.`, ritardo: 1600 });
            g.messaggio("Nessuno si vede: le otto fiammelle restano accese!");
            return esito;
          case "errore":
            anim.acc = RID ? null : { tipo: "err", t0: T };
            anim.zuccoErr = T;
            salvaMemoria();
            g.errore("Alcuni candelabri si vedono: si spengono");
            g.messaggio(`Si sono spenti ${ev.spenti.length} candelabri: quelli col bordo rosso si vedono.`);
            return esito;
          default: break;
        }
        salvaMemoria();
        return esito;
      }

      // ── Tocchi e trascinamenti ──
      const casellaDa = (x, y) => {
        const c = Math.floor((x - BX) / PASSO), r = Math.floor((y - BY) / PASSO);
        return intOk(r) && intOk(c) ? [r, c] : null;
      };
      const nellaRastrelliera = (x, y) => x >= 20 && x <= 75 && y >= 54 && y <= 143;
      let gesto = null; // { x0, y0, origine, cella }
      let trascinato = null; // { tipo: "mobile" | "scorta", da, x, y }
      let sopra = null; // casella sotto il mouse
      const daPosare = () => 6 - st.mobili.length;

      function origineDi(x, y) {
        const p = casellaDa(x, y);
        if (p) return { tipo: ha(fissi, p) ? "fisso" : ha(st.mobili, p) ? "mobile" : "vuota", cella: p };
        if (nellaRastrelliera(x, y)) return { tipo: "scorta" };
        return { tipo: "altrove" };
      }
      const trascinabile = (o) => o.tipo === "mobile" || (o.tipo === "scorta" && daPosare() > 0);

      g.tocca(({ tipo, x, y, premuto }) => {
        if (tipo === "giu") {
          gesto = { x0: x, y0: y, origine: origineDi(x, y) };
          trascinato = null;
        } else if (tipo === "muovi") {
          if (!premuto || !gesto) {
            sopra = casellaDa(x, y);
            return;
          }
          const lontano = Math.max(Math.abs(x - gesto.x0), Math.abs(y - gesto.y0)) >= 4;
          if (!trascinato && lontano && trascinabile(gesto.origine)) {
            trascinato = { tipo: gesto.origine.tipo, da: gesto.origine.cella, x, y };
          }
          if (trascinato) { trascinato.x = x; trascinato.y = y; }
          sopra = null;
        } else if (tipo === "su") {
          if (!gesto) return;
          const o = gesto.origine;
          const lontano = Math.max(Math.abs(x - gesto.x0), Math.abs(y - gesto.y0)) >= 4;
          const eraTrascinato = !!trascinato || (lontano && trascinabile(o));
          gesto = null;
          trascinato = null;
          if (eraTrascinato) {
            const dest = casellaDa(x, y);
            if (o.tipo === "mobile") {
              if (!dest) mossa({ tipo: "togli", riga: o.cella[0], colonna: o.cella[1] });
              else if (!eq(dest, o.cella)) mossa({ tipo: "sposta", da: o.cella, a: dest });
            } else if (o.tipo === "scorta" && dest) {
              mossa({ tipo: "posa", riga: dest[0], colonna: dest[1] });
            }
            return;
          }
          if (o.tipo === "fisso") mossa({ tipo: "togli", riga: o.cella[0], colonna: o.cella[1] });
          else if (lontano) return;
          else if (o.tipo === "vuota") mossa({ tipo: "posa", riga: o.cella[0], colonna: o.cella[1] });
          else if (o.tipo === "mobile") mossa({ tipo: "togli", riga: o.cella[0], colonna: o.cella[1] });
          else if (o.tipo === "scorta" && daPosare() > 0) g.messaggio("Tocca una casella del pavimento per posare un candelabro.");
        }
      });

      g.bottone("Svuota", () => mossa({ tipo: "svuota" }), { id: "svuota" });
      g.bottone("Accendi", () => mossa({ tipo: "accendi" }), { id: "accendi", forte: true });
      g.messaggio(g.giaRisolto ? "Le otto fiammelle sono accese: nessuna vede le altre." : "Tocca le caselle per posare i candelabri, poi premi Accendi.");

      // ── Disegno ──
      function candelabro(ctx, X, Y, asp, sfasa, F) {
        sprite(ctx, CANDELABRO, COLORI, X, Y);
        STOPPINI.forEach(([sx, sy], i) => {
          if (asp === "acceso") sprite(ctx, FIAMME[(F + sfasa + 3 * i) % 4], COLORI, X + sx - 1, Y + sy - 3);
          else if (asp === "brace") {
            rett(ctx, C.brace, X + sx, Y + sy, 1, 1);
            if (!RID) {
              const fr = (F + sfasa + 2 * i) % 8;
              if (fr < 4) sprite(ctx, FUMO[fr], COLORI, X + sx - 1, Y + sy - 4);
            }
          }
        });
      }
      function anello(ctx, colore, x, y, d) {
        const w = PASSO - 2 * d;
        rett(ctx, colore, x + d, y + d, w, 1);
        rett(ctx, colore, x + d, y + d + w - 1, w, 1);
        rett(ctx, colore, x + d, y + d, 1, w);
        rett(ctx, colore, x + d + w - 1, y + d, 1, w);
      }
      function piastrella(ctx, r, c, x, y, accesa, lampo) {
        const chiara = (r + c) % 2 === 0;
        if (lampo) { rett(ctx, C.tappeto, x, y, PASSO, PASSO); return; }
        rett(ctx, chiara ? (accesa ? C.pietraChiara : C.pietra) : (accesa ? C.viola : C.violaScuro), x, y, PASSO, PASSO);
        const luce = accesa ? C.fiammaChiara : chiara ? C.pietraChiara : C.viola;
        rett(ctx, luce, x, y, PASSO, 1);
        rett(ctx, luce, x, y, 1, PASSO);
        const ombra = chiara ? C.ferroChiaro : C.muro;
        rett(ctx, ombra, x, y + 14, PASSO, 1);
        rett(ctx, ombra, x + 14, y, 1, PASSO);
        if (!accesa) {
          const sx = (3 * r + c) % 2 === 1, sy = (r + 3 * c) % 2 === 1;
          for (const [ox, oy] of [[3, 4], [4, 4], [9, 10], [11, 6]]) {
            rett(ctx, chiara ? C.pietraChiara : C.viola, x + (sx ? ox : 14 - ox), y + (sy ? oy : 14 - oy), 1, 1);
          }
        }
      }
      function piastra(ctx, x, y, chiodiBianchi, lampo) {
        riquadro(ctx, x, y, PASSO, PASSO, C.ferroChiaro);
        rett(ctx, C.pietra, x + 1, y + 1, 13, 1); rett(ctx, C.pietra, x + 1, y + 1, 1, 13);
        rett(ctx, C.ferro, x + 1, y + 13, 13, 1); rett(ctx, C.ferro, x + 13, y + 1, 1, 13);
        if (lampo) rett(ctx, C.tappeto, x + 3, y + 3, 9, 9);
        for (const [nx, ny] of [[2, 2], [11, 2], [2, 11], [11, 11]]) {
          rett(ctx, chiodiBianchi ? C.bianco : C.pietraChiara, x + nx, y + ny, 1, 1);
          rett(ctx, C.pietra, x + nx + 1, y + ny, 1, 1);
          rett(ctx, C.pietra, x + nx, y + ny + 1, 1, 1);
          rett(ctx, C.bordo, x + nx + 1, y + ny + 1, 1, 1);
        }
      }

      g.anima(() => {
        const ctx = g.ctx;
        const T = g.tempo;
        const F = RID ? 0 : g.fotogramma;
        const Fr = g.fotogramma; // per le animazioni che con RID non ci sono: serve solo per lampeggi
        ctx.clearRect(0, 0, g.larghezza, g.altezza);

        // tutti i candelabri, ordinati: l'indice serve alla sequenza di accensione
        const tutti = ordina([...fissi, ...st.mobili]);
        const indice = new Map(tutti.map((p, i) => [chiaveCasella(p[0], p[1]), i]));
        const accesiK = new Set(st.accesi.map((p) => chiaveCasella(p[0], p[1])));
        const spentiK = new Set(st.spenti.map((p) => chiaveCasella(p[0], p[1])));
        const acc = anim.acc;
        const el = acc ? T - acc.t0 : 1e9;
        const aspetto = (k) => {
          if (acc && acc.tipo === "err" && el < 450) return indice.get(k) * 40 <= el ? "acceso" : "normale";
          if (acc && acc.tipo === "ok" && el < 560) return indice.get(k) * 80 <= el ? "acceso" : "normale";
          if (accesiK.has(k)) return "acceso";
          if (spentiK.has(k)) return "brace";
          return "normale";
        };
        const lampoRosso = !!acc && acc.tipo === "err" && el >= 450 && el < 700;
        const inVittoria = st.risolto && T - anim.vitt < 2000;

        // 1. ombra, cornice
        retino(ctx, C.nero, C.bordo, 227, 21, 2, 132, 0.5);
        retino(ctx, C.nero, C.bordo, 96, 152, 133, 1, 0.5);
        rett(ctx, C.bordo, 93, 18, 134, 134);
        rett(ctx, C.legnoChiaro, 94, 19, 132, 132);
        rett(ctx, C.legnoLuce, 94, 19, 132, 1); rett(ctx, C.legnoLuce, 94, 19, 1, 132);
        rett(ctx, C.legno, 94, 150, 132, 1); rett(ctx, C.legno, 225, 19, 1, 132);
        for (let x = 98; x < 222; x += 9) { rett(ctx, C.legno, x, 21, 4, 1); rett(ctx, C.legno, x + 4, 148, 4, 1); }
        for (let y = 28; y < 146; y += 11) rett(ctx, C.legno, 222, y, 1, 4);
        rett(ctx, C.bordo, 99, 24, 122, 122);
        const lampBorchie = inVittoria && !RID && Fr % 2 === 0;
        for (const [x, y] of [[95, 20], [222, 20], [95, 147], [222, 147]]) {
          rett(ctx, C.oroScuro, x, y, 3, 3); rett(ctx, C.oro, x, y, 2, 2); rett(ctx, C.giallo, x, y, 1, 1);
          if (lampBorchie) rett(ctx, C.bianco, x, y, 2, 2);
        }
        for (let c = 0; c < 8; c++) testo(ctx, "ABCDEFGH"[c], 107 + 15 * c, 146, { piccolo: true, colore: C.oro, ombra: null, allinea: "centro" });
        for (let r = 0; r < 8; r++) testo(ctx, String(8 - r), 96, 30 + 15 * r, { piccolo: true, colore: C.oro, ombra: null, allinea: "centro" });

        // 2. piastrelle e piastre
        const tremaX = (k) => {
          const t0 = anim.trema[k];
          if (t0 === undefined) return { dx: 0, bianchi: false };
          const e = T - t0;
          if (e >= 500) return { dx: 0, bianchi: false };
          const i = Math.floor(e / 125);
          return { dx: [1, -1, 1, 0][i], bianchi: i < 2 };
        };
        for (let r = 0; r < 8; r++) {
          for (let c = 0; c < 8; c++) {
            const x = BX + PASSO * c, y = BY + PASSO * r, k = chiaveCasella(r, c);
            if (ha(fissi, [r, c])) {
              piastra(ctx, x, y, tremaX(k).bianchi, lampoRosso && spentiK.has(k));
            } else {
              const asp = ha(st.mobili, [r, c]) ? aspetto(k) : "normale";
              piastrella(ctx, r, c, x, y, asp === "acceso", lampoRosso && spentiK.has(k));
            }
          }
        }

        // 3. anelli
        for (let r = 0; r < 8; r++) {
          for (let c = 0; c < 8; c++) {
            const x = BX + PASSO * c, y = BY + PASSO * r, k = chiaveCasella(r, c);
            if (!indice.has(k)) continue;
            const asp = aspetto(k);
            if (asp === "brace" && !lampoRosso) {
              let col = C.tappetoChiaro;
              if (T - anim.invariato < 500) col = Math.floor((T - anim.invariato) / 125) % 2 === 0 ? C.bianco : C.tappetoChiaro;
              anello(ctx, col, x, y, 1);
            } else if (asp === "acceso" && st.risolto && (!acc || el >= 560 || RID)) {
              anello(ctx, inVittoria && !RID && Math.floor(Fr / 2) % 2 === 1 ? C.oro : C.giallo, x, y, 1);
            }
          }
        }
        for (const kk of Object.keys(anim.occ)) {
          if (T - anim.occ[kk] < 500) anello(ctx, C.tappetoChiaro, BX + PASSO * (kk % 8), BY + PASSO * Math.floor(kk / 8), 0);
        }
        if (trascinato) {
          const dest = casellaDa(trascinato.x, trascinato.y);
          if (dest && !(trascinato.da && eq(dest, trascinato.da))) {
            const occ = ha(fissi, dest) || ha(st.mobili, dest);
            anello(ctx, occ ? C.tappetoChiaro : C.giallo, BX + PASSO * dest[1], BY + PASSO * dest[0], 0);
          }
        } else if (sopra) {
          anello(ctx, C.lilla, BX + PASSO * sopra[1], BY + PASSO * sopra[0], 0);
        }

        // 4. candelabri della scacchiera, riga per riga
        for (let r = 0; r < 8; r++) {
          for (let c = 0; c < 8; c++) {
            const k = chiaveCasella(r, c);
            if (!indice.has(k)) continue;
            if (trascinato && trascinato.tipo === "mobile" && trascinato.da && eq(trascinato.da, [r, c])) continue;
            let dx = 0, dy = 0;
            if (anim.caduta[k] !== undefined) { const e = T - anim.caduta[k]; dy = e < 50 ? -4 : e < 100 ? -2 : 0; }
            if (anim.arrivo[k] !== undefined) { const e = T - anim.arrivo[k]; dy = e < 50 ? -2 : 0; }
            dx = tremaX(k).dx;
            candelabro(ctx, BX + PASSO * c + 1 + dx, BY + PASSO * r + 2 + dy, aspetto(k), 5 * r + c, F);
          }
          // candelabri che stanno salendo (tolti)
          anim.salite = anim.salite.filter((s) => T - s.t0 < 150);
          for (const s of anim.salite) {
            if (s.r !== r) continue;
            const e = T - s.t0;
            candelabro(ctx, BX + PASSO * s.c + 1, BY + PASSO * r + 2 + (e < 50 ? 0 : e < 100 ? -2 : -4), "normale", 0, F);
          }
        }

        // 5. stelline della vittoria
        if (st.risolto && !RID && T - anim.vitt < 1600) {
          if (stelle.f !== Fr) {
            stelle.f = Fr;
            if (Fr % 2 === 0) {
              const p = tutti[Math.floor(Math.random() * tutti.length)];
              stelle.pos = { x: BX + PASSO * p[1] + Math.floor(Math.random() * 8), y: BY + PASSO * p[0] - 3 + Math.floor(Math.random() * 3), grande: Math.random() < 0.5 };
            } else stelle.pos = null;
          }
          if (stelle.pos) sprite(ctx, stelle.pos.grande ? STELLA : STELLINA, COLORI, stelle.pos.x, stelle.pos.y);
        }

        // 6. cartello, rastrelliera, scorta, corvo
        rett(ctx, C.bordo, 30, 49, 1, 5); rett(ctx, C.bordo, 65, 49, 1, 5);
        riquadro(ctx, 24, 30, 48, 19, C.legnoChiaro);
        rett(ctx, C.legnoLuce, 25, 31, 46, 1);
        testo(ctx, "POSATI", 48, 33, { piccolo: true, colore: C.pietraChiara, allinea: "centro" });
        const dp = daPosare();
        const rosso = T - anim.cartello < 500;
        testo(ctx, `${8 - dp}/8`, 48, 40, { colore: rosso ? C.tappetoChiaro : dp === 0 ? C.giallo : C.bianco, allinea: "centro" });
        riquadro(ctx, 22, 54, 52, 90, C.legno);
        rett(ctx, C.legnoScuro, 23, 55, 50, 2);
        for (let x = 30; x < 72; x += 8) rett(ctx, C.legnoScuro, x, 57, 1, 86);
        const inScorta = trascinato && trascinato.tipo === "scorta" ? 1 : 0;
        const nScorta = dp - inScorta;
        for (let i = 0; i < 3; i++) {
          for (const j of [2 * i, 2 * i + 1]) {
            if (j < nScorta) { const p = postoScorta(j); candelabro(ctx, p.x, p.y, "normale", 0, F); }
          }
          const py = 80 + i * 28;
          riquadro(ctx, 20, py, 56, 5, C.legnoChiaro);
          rett(ctx, C.legnoLuce, 21, py + 1, 54, 1);
        }
        const occhio = !RID && g.fotogramma % 24 === 5;
        sprite(ctx, CORVO, { ...COLORI_CORVO, y: occhio ? C.ferroChiaro : C.giallo }, 55, 19);

        // 7. Zucco e il suo fumetto
        let zx = 238, zy = 111;
        const errZ = T - anim.zuccoErr;
        if (!RID) {
          if (errZ < 750) zx += Fr % 2 === 0 ? 1 : -1;
          if (inVittoria && Fr % 4 < 2) zy -= 3;
        }
        sprite(ctx, !RID && Fr % 8 >= 4 ? ZUCCO_RESPIRO : ZUCCO, COLORI_ZUCCO, zx, zy, { specchia: true });
        if (errZ < 1500) {
          riquadro(ctx, 243, 96, 9, 11, C.bianco);
          rett(ctx, C.bianco, 246, 106, 2, 1);
          rett(ctx, C.bordo, 246, 107, 1, 1);
          testo(ctx, "!", 245, 98, { colore: C.tappetoChiaro, ombra: null });
        }

        // 8. il candelabro trascinato
        if (trascinato) {
          const px = Math.round(trascinato.x), py = Math.round(trascinato.y);
          retino(ctx, C.nero, C.bordo, px - 4, py + 3, 9, 1, 0.5);
          candelabro(ctx, px - 6, py - 10, "normale", 0, F);
        }
      });

      // ── L'aggancio per le prove ──
      g.espone({
        gioca: (m) => mossa(m),
        statoGioco: () => ({
          fissi: fissi.map(([r, c]) => [r, c]),
          mobili: ordina(st.mobili),
          daPosare: 6 - st.mobili.length,
          accesi: ordina(st.accesi),
          spenti: ordina(st.spenti),
          risolto: st.risolto,
        }),
        posizione: (riga, colonna) => ({ x: 107 + 15 * colonna, y: 32 + 15 * riga }),
      });
    },
  });
})();
