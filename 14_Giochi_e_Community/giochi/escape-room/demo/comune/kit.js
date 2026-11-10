// Kit comune delle demo dei rompicapi dell'escape room.
//
// Ogni demo carica, in quest'ordine: comune/kit.js, la sua scheda.js (i dati del catalogo) e il suo gioco.js.
// Il kit fa tutto quello che è uguale per ogni rompicapo, così le demo sembrano lo stesso gioco:
// - la scena in pixel art 320×180 (come gli sfondi delle stanze), ingrandita a tutta finestra, con lo sfondo della stanza;
// - la barra in alto (titolo, caramelle dorate in palio, indizi, testo del rompicapo, menu della demo);
// - la barra in basso (i bottoni del rompicapo e il fumetto dei messaggi);
// - errori e caramelle dorate, indizi pagati con le dorate, vittoria, rompicapo chiuso dopo la soluzione;
// - il seme della variante per giocatore e il salvataggio nel browser (al posto del profilo del giocatore);
// - `window.__demo`, l'aggancio per le prove automatiche (comune/prova.mjs).
//
// Il rompicapo, in gioco.js, chiama una volta sola:
//
//   EscapeDemo.avvia({
//     id: "lucchetto-lapidi",              // uguale a quello della scheda
//     sfondo: "cancello",                  // sfondi/<sfondo>.png; null = sfondo provvisorio a gradiente
//     tinta: "#23304f",                    // solo con sfondo null: il colore del gradiente provvisorio
//     velo: 0.45,                          // quanto scurire lo sfondo (0..1), così i pezzi del rompicapo risaltano
//     variante(rng, seme) { return {...} }, // la variante del giocatore: deve dipendere solo da rng (o da seme)
//     crea(g) { ... },                     // costruisce il rompicapo; `g` è descritto sotto, in «La maniglia»
//   });
//
// Nessuna libreria esterna, niente moduli ES: le demo si aprono anche con un doppio clic (file://).

(function () {
  "use strict";

  const L = 320;
  const A = 180;
  const ZONA_ALTA = 16; // la barra in alto copre fino a qui (in pixel della scena)
  const ZONA_BASSA = 26; // la barra in basso copre gli ultimi 26 pixel
  const BORSA_INIZIALE = 3; // dorate con cui parte la borsa della demo (per comprare indizi)
  const VERSIONE_SALVATAGGIO = "v1";

  // ── Colori: la paletta della fuga di Zucco, la stessa di sfondi/sfondi.js ──
  const C = {
    nero: "#030104", bordo: "#160f1e", muro: "#1c1230", mattone: "#241838", muroCaldo: "#33203f",
    muroAcceso: "#4a2c3a", muroCasa: "#2a1c38", ombraCasa: "#1c1228", tetto: "#140c1e", tettoChiaro: "#21162f",
    pavimento: "#2d1c3a", pavimento2: "#3a2546", terra: "#241630", erbaScura: "#2c4a34", erba: "#47703f",
    erbaChiara: "#7da04f", siepe: "#1d3326", legnoScuro: "#2a1a12", legno: "#3a2418", legnoChiaro: "#5a3a26",
    legnoLuce: "#7a5a44", ferro: "#3b3a55", ferroChiaro: "#5e5c7a", pietra: "#8f8da9", pietraChiara: "#c3c1d4",
    notte: "#23304f", notteChiara: "#7fa8cc", sagoma: "#0a0d22", luna: "#fff3b0", vetro: "#ffcf5e",
    fiamma: "#f59a2e", fiammaChiara: "#ffd07a", brace: "#d9661a", tappeto: "#7e1a20", tappetoChiaro: "#d03a2c",
    oro: "#ffb52e", oroScuro: "#d68a18", violaScuro: "#3f2a78", viola: "#6a43b8", lilla: "#a47bf0",
    rosa: "#ff6fa8", acqua: "#37d6c2", giallo: "#ffe45e", brand: "#aaa5ff", bianco: "#ffffff",
  };
  // Le pietre delle chiavi (sprite/oggetti.js): scura, media, chiara.
  const GEMME = {
    ametista: ["#3f2a78", "#8a5ad0", "#d3b0ff"], topazio: ["#8a4a10", "#f59a2e", "#ffe08a"],
    smeraldo: ["#1d5a32", "#2fa35a", "#8ff0a8"], rubino: ["#7e1a20", "#d03a2c", "#ff8a7a"],
    zaffiro: ["#1a2a7a", "#2a6cff", "#8fd0ff"], acquamarina: ["#12606a", "#37d6c2", "#b8fff0"],
  };
  const BAYER = [[0, 8, 2, 10], [12, 4, 14, 6], [3, 11, 1, 9], [15, 7, 13, 5]];

  // ── La caramella dorata (sprite/caramella-dorata.json, 8 fotogrammi a 8 fps) ──
  const CARAMELLA = {
    w: 24, h: 12,
    palette: ["#160f1e","#ffffff","#fff6c8","#ffe45e","#ffb52e","#d68a18","#8a5a10"],
    frames: [
      ["........................", "..........00000.........", "..0.....003334400.....0.", ".0300..03333444440..0030", ".03530003313444440003530", ".03535353444444455353530", ".04545434444444555454540", ".04545454444455555454540", ".04540004444555560004540", ".0400..04455555660..0040", "..0.....005556600.....0.", "..........00000........."],
      ["........................", "..........00000.........", "..0.....003334400.....0.", ".0300..03333444440..0030", ".03530003313444440003530", ".03535353444444455353530", ".04545434444444555454540", ".04545454444455555454540", ".04540004444555560004540", ".0400..04455555660..0040", "..0.....005556600.....0.", "..........00000........."],
      ["........................", "..........00000.........", "..0.....003334400.....0.", ".0300..03333444440..0030", ".03510003313444440003530", ".03414353444444455353530", ".03435434444444555454540", ".03445454444455555454540", ".03540004444555560004540", ".0400..04455555660..0040", "..0.....005556600.....0.", "..........00000........."],
      ["........................", "..........00000.........", "..0.....003313300.....0.", ".0300..03331334440..0030", ".03530003311344440003530", ".03535353333444455353530", ".04545433334444555454540", ".04545443344455555454540", ".04540003444555560004540", ".0400..04455555660..0040", "..0.....005556600.....0.", "..........00000........."],
      ["..................2.....", "..........00000..212....", "..0.....003334400.2...0.", ".0300..03333444440..0030", ".03530003313444430003530", ".03535353444444344353530", ".04545434444443445454540", ".04545454444444455454540", ".04540004444444560004540", ".0400..04454445660..0040", "..0.....004446600.....0.", "..........00000........."],
      ["........................", "..........00000...1.....", "..0.....003334400.....0.", ".0300..03333444440..0030", ".03530003313444440003510", ".03535353444444455353410", ".04545434444444555453430", ".04545454444455555443440", ".04540004444555560003540", ".0400..04455555660..0040", "..0.....005556600.....0.", "..........00000........."],
      ["........................", "..........00000.........", "..0.....003334400.....0.", ".0300..03333444440..0030", ".03530003313444440003530", ".03535353444444455353530", ".04545434444444555454540", ".04545454444455555454540", ".04540004444555560004540", ".0400..04455555660..0040", "..0.....005556600.....0.", "..........00000........."],
      ["........................", "..........00000.........", "..0.....003334400.....0.", ".0300..03333444440..0030", ".03530003313444440003530", ".03535353444444455353530", ".04545434444444555454540", ".04545454444455555454540", ".04540004444555560004540", ".0400..04455555660..0040", "..0.....005556600.....0.", "..........00000........."],
    ],
  };

  // ── Caratteri pixel ──
  // 5×7 della fuga di Zucco (render.js): colonne, bit 0 = riga in alto.
  const FONT5 = {
    A: [0x7c, 0x12, 0x11, 0x12, 0x7c], B: [0x7f, 0x49, 0x49, 0x49, 0x36], C: [0x3e, 0x41, 0x41, 0x41, 0x22],
    D: [0x7f, 0x41, 0x41, 0x41, 0x3e], E: [0x7f, 0x49, 0x49, 0x49, 0x41], F: [0x7f, 0x09, 0x09, 0x09, 0x01],
    G: [0x3e, 0x41, 0x41, 0x51, 0x73], H: [0x7f, 0x08, 0x08, 0x08, 0x7f], I: [0x00, 0x41, 0x7f, 0x41, 0x00],
    J: [0x20, 0x40, 0x41, 0x3f, 0x01], K: [0x7f, 0x08, 0x14, 0x22, 0x41], L: [0x7f, 0x40, 0x40, 0x40, 0x40],
    M: [0x7f, 0x02, 0x1c, 0x02, 0x7f], N: [0x7f, 0x04, 0x08, 0x10, 0x7f], O: [0x3e, 0x41, 0x41, 0x41, 0x3e],
    P: [0x7f, 0x09, 0x09, 0x09, 0x06], Q: [0x3e, 0x41, 0x51, 0x21, 0x5e], R: [0x7f, 0x09, 0x19, 0x29, 0x46],
    S: [0x26, 0x49, 0x49, 0x49, 0x32], T: [0x03, 0x01, 0x7f, 0x01, 0x03], U: [0x3f, 0x40, 0x40, 0x40, 0x3f],
    V: [0x1f, 0x20, 0x40, 0x20, 0x1f], W: [0x3f, 0x40, 0x38, 0x40, 0x3f], X: [0x63, 0x14, 0x08, 0x14, 0x63],
    Y: [0x03, 0x04, 0x78, 0x04, 0x03], Z: [0x61, 0x59, 0x49, 0x4d, 0x43],
    0: [0x3e, 0x51, 0x49, 0x45, 0x3e], 1: [0x00, 0x42, 0x7f, 0x40, 0x00], 2: [0x72, 0x49, 0x49, 0x49, 0x46],
    3: [0x21, 0x41, 0x49, 0x4d, 0x33], 4: [0x18, 0x14, 0x12, 0x7f, 0x10], 5: [0x27, 0x45, 0x45, 0x45, 0x39],
    6: [0x3c, 0x4a, 0x49, 0x49, 0x31], 7: [0x41, 0x21, 0x11, 0x09, 0x07], 8: [0x36, 0x49, 0x49, 0x49, 0x36],
    9: [0x46, 0x49, 0x49, 0x29, 0x1e], "!": [0x00, 0x00, 0x5f, 0x00, 0x00], ".": [0x00, 0x60, 0x60, 0x00, 0x00],
    ":": [0x00, 0x36, 0x36, 0x00, 0x00], ",": [0x00, 0x50, 0x30, 0x00, 0x00], "-": [0x08, 0x08, 0x08, 0x08, 0x08],
    "+": [0x08, 0x08, 0x3e, 0x08, 0x08], "/": [0x40, 0x30, 0x08, 0x06, 0x01], "?": [0x02, 0x01, 0x51, 0x09, 0x06],
    "=": [0x14, 0x14, 0x14, 0x14, 0x14], "'": [0x00, 0x00, 0x03, 0x00, 0x00], "(": [0x00, 0x1c, 0x22, 0x41, 0x00],
    ")": [0x00, 0x41, 0x22, 0x1c, 0x00], "×": [0x22, 0x14, 0x08, 0x14, 0x22], " ": [0, 0, 0, 0, 0],
  };
  // 3×5 per le etichette piccole (stesse lettere dei cartelli della mappa, più cifre e segni).
  const FONT3 = {
    A: [".#.", "#.#", "###", "#.#", "#.#"], B: ["##.", "#.#", "##.", "#.#", "##."], C: [".##", "#..", "#..", "#..", ".##"],
    D: ["##.", "#.#", "#.#", "#.#", "##."], E: ["###", "#..", "##.", "#..", "###"], F: ["###", "#..", "##.", "#..", "#.."],
    G: [".##", "#..", "#.#", "#.#", ".##"], H: ["#.#", "#.#", "###", "#.#", "#.#"], I: ["###", ".#.", ".#.", ".#.", "###"],
    J: ["..#", "..#", "..#", "#.#", ".#."], K: ["#.#", "##.", "#..", "##.", "#.#"], L: ["#..", "#..", "#..", "#..", "###"],
    M: ["#...#", "##.##", "#.#.#", "#...#", "#...#"], N: ["#..#", "##.#", "#.##", "#..#", "#..#"],
    O: ["###", "#.#", "#.#", "#.#", "###"], P: ["##.", "#.#", "##.", "#..", "#.."], Q: [".#.", "#.#", "#.#", "##.", ".##"],
    R: ["##.", "#.#", "##.", "#.#", "#.#"], S: [".##", "#..", ".#.", "..#", "##."], T: ["###", ".#.", ".#.", ".#.", ".#."],
    U: ["#.#", "#.#", "#.#", "#.#", "###"], V: ["#.#", "#.#", "#.#", "#.#", ".#."], W: ["#...#", "#...#", "#.#.#", "##.##", "#...#"],
    X: ["#.#", "#.#", ".#.", "#.#", "#.#"], Y: ["#.#", "#.#", ".#.", ".#.", ".#."], Z: ["###", "..#", ".#.", "#..", "###"],
    0: ["###", "#.#", "#.#", "#.#", "###"], 1: [".#.", "##.", ".#.", ".#.", "###"], 2: ["##.", "..#", ".#.", "#..", "###"],
    3: ["##.", "..#", ".#.", "..#", "##."], 4: ["#.#", "#.#", "###", "..#", "..#"], 5: ["###", "#..", "##.", "..#", "##."],
    6: [".##", "#..", "###", "#.#", "###"], 7: ["###", "..#", ".#.", ".#.", ".#."], 8: ["###", "#.#", "###", "#.#", "###"],
    9: ["###", "#.#", "###", "..#", "##."], "!": ["#", "#", "#", ".", "#"], ".": [".", ".", ".", ".", "#"],
    ":": [".", "#", ".", "#", "."], "-": ["...", "...", "###", "...", "..."], "+": ["...", ".#.", "###", ".#.", "..."],
    "=": ["...", "###", "...", "###", "..."], "/": ["..#", "..#", ".#.", "#..", "#.."], "?": ["##.", "..#", ".#.", "...", ".#."],
    "'": ["#", "#", ".", ".", "."], "×": ["...", "#.#", ".#.", "#.#", "..."], " ": ["..", "..", "..", "..", ".."],
  };
  /** Maiuscole senza accenti: i caratteri pixel hanno solo quelle. */
  const normalizza = (t) => String(t).toUpperCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

  // ── Utilità di disegno (in pixel della scena, sempre a coordinate intere) ──
  function rett(ctx, colore, x, y, w, h) {
    ctx.fillStyle = colore;
    ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
  }
  /** Un riquadro con il bordo scuro di 1 pixel, come i pezzi della fuga di Zucco. */
  function riquadro(ctx, x, y, w, h, fondo, bordo = C.bordo) {
    rett(ctx, bordo, x, y, w, h);
    rett(ctx, fondo, x + 1, y + 1, w - 2, h - 2);
  }
  /** Retino ordinato (Bayer 4×4) fra due colori: `quanto` da 0 (tutto `a`) a 1 (tutto `b`). Niente sfumature lisce. */
  function retino(ctx, a, b, x, y, w, h, quanto) {
    for (let j = 0; j < h; j++)
      for (let i = 0; i < w; i++) {
        const px = Math.round(x) + i, py = Math.round(y) + j;
        rett(ctx, BAYER[py & 3][px & 3] / 16 < quanto ? b : a, px, py, 1, 1);
      }
  }
  /** Disegna uno sprite a lettere: `righe` di testo, `colori` lettera → colore, "." = vuoto. */
  function sprite(ctx, righe, colori, x, y, { specchia = false, scala = 1 } = {}) {
    const w = righe[0].length;
    righe.forEach((riga, r) => {
      for (let i = 0; i < riga.length; i++) {
        const ch = riga[i];
        if (ch === "." || ch === " " || !(ch in colori)) continue;
        const cx = specchia ? w - 1 - i : i;
        rett(ctx, colori[ch], x + cx * scala, y + r * scala, scala, scala);
      }
    });
  }
  function larghezzaTesto(testo, { piccolo = false, scala = 1 } = {}) {
    const t = normalizza(testo);
    if (!piccolo) return t.length * 6 * scala - scala;
    return [...t].reduce((l, ch) => l + ((FONT3[ch] ?? FONT3[" "])[0].length + 1) * scala, -scala);
  }
  /**
   * Scrive in pixel: `piccolo` = carattere 3×5, altrimenti 5×7. Solo maiuscole, cifre e pochi segni.
   * `allinea`: "sinistra" | "centro" | "destra" rispetto a x. `ombra`: colore dell'ombra in basso a destra, o null.
   */
  function testo(ctx, scritta, x, y, { colore = C.bianco, ombra = C.bordo, piccolo = false, scala = 1, allinea = "sinistra" } = {}) {
    const t = normalizza(scritta);
    const w = larghezzaTesto(t, { piccolo, scala });
    let cx = Math.round(allinea === "centro" ? x - w / 2 : allinea === "destra" ? x - w : x);
    const disegna = (dx, dy, c) => {
      let px = cx;
      for (const ch of t) {
        if (piccolo) {
          const g = FONT3[ch] ?? FONT3[" "];
          g.forEach((riga, r) => [...riga].forEach((p, k) => { if (p === "#") rett(ctx, c, px + k * scala + dx, y + r * scala + dy, scala, scala); }));
          px += (g[0].length + 1) * scala;
        } else {
          (FONT5[ch] ?? FONT5[" "]).forEach((colonna, k) => {
            for (let r = 0; r < 7; r++)
              if (colonna & (1 << r)) rett(ctx, c, px + k * scala + dx, y + r * scala + dy, scala, scala);
          });
          px += 6 * scala;
        }
      }
    };
    if (ombra) disegna(scala, scala, ombra);
    disegna(0, 0, colore);
    return w;
  }
  function caramella(ctx, x, y, fotogramma = 0, { scala = 1, spenta = false } = {}) {
    const righe = CARAMELLA.frames[((fotogramma % 8) + 8) % 8];
    const colori = {};
    CARAMELLA.palette.forEach((c, i) => { colori[String(i)] = spenta ? (i === 0 ? C.bordo : i < 4 ? C.ferroChiaro : C.ferro) : c; });
    sprite(ctx, righe, colori, x, y, { scala });
  }
  /** Generatore pseudo-casuale riproducibile (mulberry32): stesso seme, stessa sequenza. */
  function casuale(seme) {
    let a = seme >>> 0;
    return function () {
      a = (a + 0x6d2b79f5) >>> 0;
      let t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  const intero = (rng, min, max) => min + Math.floor(rng() * (max - min + 1));
  function mescola(rng, lista) {
    const a = [...lista];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }
  /** Le dorate in palio dopo `errori` errori: piene fino a k−1 errori, poi una in meno ogni k, minimo 1. */
  const dorateInPalio = (dorate, k, errori) => Math.max(1, dorate - Math.floor(errori / Math.max(1, k)));

  // ── Salvataggio nel browser (nel gioco vero: il profilo del giocatore) ──
  const leggi = (chiave, base) => {
    try {
      const v = localStorage.getItem(chiave);
      return v ? JSON.parse(v) : base;
    } catch {
      return base;
    }
  };
  const scrivi = (chiave, valore) => {
    try { localStorage.setItem(chiave, JSON.stringify(valore)); } catch { /* senza salvataggio la demo funziona lo stesso */ }
  };
  const togli = (chiave) => { try { localStorage.removeItem(chiave); } catch { /* idem */ } };
  const chiaveStato = (id) => `escape-demo:${VERSIONE_SALVATAGGIO}:${id}`;
  const CHIAVE_BORSA = `escape-demo:${VERSIONE_SALVATAGGIO}:borsa`;

  // ── Elementi della pagina ──
  const el = (tag, attr = {}, ...figli) => {
    const e = document.createElement(tag);
    for (const [k, v] of Object.entries(attr)) {
      if (k === "testo") e.textContent = v;
      else if (k.startsWith("on")) e.addEventListener(k.slice(2), v);
      else if (v !== false && v != null) e.setAttribute(k, v === true ? "" : v);
    }
    for (const f of figli) if (f) e.append(f);
    return e;
  };

  /** Una piccola tela con la caramella animata, per la barra e le carte. */
  function iconaCaramella(spenta = false, scala = 1) {
    const t = el("canvas", { class: "kit-icona-caramella" + (spenta ? " spenta" : ""), width: CARAMELLA.w, height: CARAMELLA.h });
    t.style.setProperty("--scala-icona", scala);
    t._spenta = spenta;
    return t;
  }

  let SCHEDA = null;
  const RIDUCI = (() => { try { return matchMedia("(prefers-reduced-motion: reduce)").matches; } catch { return false; } })();

  function avvia(opzioni) {
    if (!SCHEDA) throw new Error("scheda.js non caricata: va inclusa prima di gioco.js");
    const id = opzioni.id || SCHEDA.id;
    const parametri = new URLSearchParams(location.search);
    const semeUrl = parametri.has("seed") ? Number(parametri.get("seed")) >>> 0 : null;

    // Stato salvato: seme, errori, indizi comprati, risolto, dorate guadagnate, memoria del rompicapo.
    let salvato = leggi(chiaveStato(id), null);
    if (!salvato || (semeUrl != null && salvato.seme !== semeUrl)) {
      salvato = {
        seme: semeUrl ?? (Math.floor(Math.random() * 2 ** 31) >>> 0),
        errori: 0, indizi: 0, risolto: false, guadagnate: 0, memoria: {},
      };
    }
    const borsa = leggi(CHIAVE_BORSA, { saldo: BORSA_INIZIALE });
    const salva = () => scrivi(chiaveStato(id), salvato);
    salva();

    const dorate = Number(SCHEDA.dorate) || 1;
    const k = Number(SCHEDA.erroriConcessi) || 1;
    const indizi = String(SCHEDA.indizi || "").split("\n").map((s) => s.trim()).filter(Boolean);
    const variante = opzioni.variante ? opzioni.variante(casuale(salvato.seme), salvato.seme) : {};

    // ── Struttura ──
    document.documentElement.lang = "it";
    document.title = SCHEDA.titolo || id;
    const scena = el("div", { class: "kit-scena", "data-kit": "scena" });
    const sfondo = el("canvas", { class: "kit-tela", width: L, height: A });
    const tela = el("canvas", { class: "kit-tela", width: L, height: A });
    scena.append(sfondo, tela);
    const blocco = el("div", { class: "kit-blocco", hidden: true });
    scena.append(blocco);

    const caramelleBarra = el("div", { class: "kit-dorate", "aria-label": "Caramelle dorate in palio" });
    const btnIndizio = el("button", { class: "kit-btn", type: "button", "data-azione": "indizi" });
    const btnTesto = el("button", { class: "kit-btn", type: "button", "data-azione": "testo", testo: "Testo" });
    const btnMenu = el("button", { class: "kit-btn kit-btn-icona", type: "button", "data-azione": "menu", "aria-label": "Menu della demo", testo: "⋯" });
    const alto = el("div", { class: "kit-alto" },
      el("div", { class: "kit-titolo" }, el("strong", { testo: SCHEDA.titolo || id }), el("span", { testo: SCHEDA.stanza || "" })),
      caramelleBarra, btnIndizio, btnTesto, btnMenu);
    const azioni = el("div", { class: "kit-azioni" });
    const fumetto = el("div", { class: "kit-fumetto", hidden: true, "aria-live": "polite" });
    const basso = el("div", { class: "kit-basso" }, fumetto, azioni);
    const avviso = el("div", { class: "kit-avviso", hidden: true, role: "status" });
    const carta = el("div", { class: "kit-velo-carta", hidden: true });
    const menu = el("div", { class: "kit-menu", hidden: true });
    const cornice = el("div", { class: "kit-cornice" }, scena, alto, basso, avviso, carta, menu);
    const gira = el("div", { class: "kit-gira", hidden: true },
      el("p", { testo: "Si gioca col telefono in orizzontale." }),
      el("button", { class: "kit-btn", type: "button", testo: "Va bene", onclick: () => { gira.hidden = true; giraChiuso = true; } }));
    let giraChiuso = false;
    // Il fondale: lo sfondo della stanza ingrandito e scurito dietro la scena, così ai lati non resta il nero.
    const fondale = el("div", { class: "kit-fondale" });
    const radice = el("div", { class: "kit-radice" }, fondale, cornice, gira);
    document.body.append(radice);

    const ctx = tela.getContext("2d");
    ctx.imageSmoothingEnabled = false;
    const sctx = sfondo.getContext("2d");
    sctx.imageSmoothingEnabled = false;

    // ── Sfondo della stanza con il velo scuro ──
    const velo = opzioni.velo ?? 0.45;
    function disegnaVelo() {
      if (velo > 0) {
        sctx.globalAlpha = velo;
        rett(sctx, C.nero, 0, 0, L, A);
        sctx.globalAlpha = 1;
      }
    }
    function sfondoProvvisorio() {
      const tinta = opzioni.tinta || C.muro;
      rett(sctx, C.nero, 0, 0, L, A);
      // gradiente a retino dalla tinta (in alto) al nero (in basso), a bande di 12 pixel
      for (let y = 0; y < A; y += 12) retino(sctx, tinta, C.nero, 0, y, L, 12, y / A);
      disegnaVelo();
      try { fondale.style.backgroundImage = `url(${sfondo.toDataURL()})`; } catch { /* resta il fondo scuro */ }
    }
    if (opzioni.sfondo) {
      const img = new Image();
      img.onload = () => {
        sctx.drawImage(img, 0, 0, L, A);
        disegnaVelo();
        fondale.style.backgroundImage = `url(${img.src})`;
      };
      img.onerror = sfondoProvvisorio;
      img.src = `../../sfondi/${opzioni.sfondo}.png`;
    } else sfondoProvvisorio();

    // ── Misure: la scena riempie la finestra (o la sagoma del telefono) senza deformarsi ──
    let telefono = parametri.get("telefono") === "1";
    let scala = 1;
    function misura() {
      radice.classList.toggle("kit-telefono", telefono);
      const W = telefono ? Math.min(844, innerWidth - 24) : innerWidth;
      const H = telefono ? Math.min(390, innerHeight - 24) : innerHeight;
      let s = Math.min(W / L, H / A);
      // Con molto spazio sopra e sotto (telefono in verticale, finestre quasi quadrate) le barre escono dalla scena.
      const fuori = !telefono && H - A * s >= 110;
      radice.classList.toggle("kit-fuori", fuori);
      if (fuori) s = Math.min(W / L, (H - 110) / A);
      // intero solo se non si perde più del 15% (come la visuale di gioco della mappa)
      if (Math.floor(s) >= 1 && Math.floor(s) / s >= 0.85) s = Math.floor(s);
      scala = s;
      cornice.style.width = `${Math.round(L * s)}px`;
      cornice.style.height = `${Math.round(A * s)}px`;
      cornice.style.setProperty("--k", s);
      scena.style.transform = `scale(${s})`;
      gira.hidden = giraChiuso || telefono || !(innerHeight > innerWidth && innerWidth < 700);
    }
    addEventListener("resize", misura);
    misura();

    // ── Caramelle in palio nella barra ──
    function aggiornaBarra() {
      const n = dorateInPalio(dorate, k, salvato.errori);
      const mostrate = salvato.risolto ? salvato.guadagnate : n;
      caramelleBarra.replaceChildren(...Array.from({ length: dorate }, (_, i) => iconaCaramella(i >= mostrate)));
      caramelleBarra.title = salvato.risolto
        ? `Hai guadagnato ${salvato.guadagnate} caramelle dorate`
        : `In palio: ${n} caramelle dorate · errori: ${salvato.errori}`;
      btnIndizio.textContent = salvato.indizi > 0 ? `Indizi (${salvato.indizi})` : "Indizio";
      btnIndizio.hidden = indizi.length === 0;
      blocco.hidden = !salvato.risolto;
    }

    // ── Carte (testo del rompicapo, indizi, vittoria) ──
    function mostraCarta(contenuto, { chiudibile = true } = {}) {
      carta.replaceChildren(el("div", { class: "kit-carta", role: "dialog", "aria-modal": "true" }, ...contenuto));
      carta.hidden = false;
      carta.onclick = chiudibile ? (e) => { if (e.target === carta) chiudiCarta(); } : null;
    }
    function chiudiCarta() { carta.hidden = true; carta.replaceChildren(); }
    const paragrafi = (t) => String(t || "").split("\n").filter((s) => s.trim()).map((s) => el("p", { testo: s }));

    function cartaTesto(primaVolta) {
      mostraCarta([
        el("p", { class: "kit-sopratitolo", testo: SCHEDA.stanza || "" }),
        el("h2", { testo: SCHEDA.titolo || id }),
        ...paragrafi(opzioni.testo ?? SCHEDA.enigma),
        el("div", { class: "kit-riga-btn" },
          el("button", { class: "kit-btn kit-btn-forte", type: "button", "data-azione": "comincia", testo: primaVolta ? "Comincia" : "Torna al rompicapo", onclick: chiudiCarta })),
      ], { chiudibile: !primaVolta });
    }
    function cartaIndizi() {
      const comprati = indizi.slice(0, salvato.indizi);
      const prossimo = salvato.indizi < indizi.length;
      const saldo = leggi(CHIAVE_BORSA, borsa).saldo;
      mostraCarta([
        el("h2", { testo: "Indizi" }),
        comprati.length
          ? el("ol", { class: "kit-indizi" }, ...comprati.map((t) => el("li", { testo: t })))
          : el("p", { testo: "Ogni indizio costa una caramella dorata della tua borsa." }),
        el("p", { class: "kit-borsa" }, iconaCaramella(), document.createTextNode(` Nella borsa: ${saldo}`)),
        el("div", { class: "kit-riga-btn" },
          prossimo && !salvato.risolto
            ? el("button", {
              class: "kit-btn kit-btn-forte", type: "button", "data-azione": "compra-indizio",
              disabled: saldo < 1 ? true : false, testo: saldo < 1 ? "Borsa vuota" : "Compra un indizio (1 dorata)",
              onclick: () => {
                const b = leggi(CHIAVE_BORSA, borsa);
                if (b.saldo < 1) return;
                b.saldo -= 1;
                scrivi(CHIAVE_BORSA, b);
                salvato.indizi += 1;
                salva();
                aggiornaBarra();
                cartaIndizi();
              },
            })
            : null,
          el("button", { class: "kit-btn", type: "button", "data-azione": "chiudi", testo: "Chiudi", onclick: chiudiCarta })),
      ]);
    }
    function cartaVittoria(riepilogo) {
      const icone = Array.from({ length: salvato.guadagnate }, () => iconaCaramella(false, 2));
      icone.forEach((ic, i) => { ic.style.animationDelay = RIDUCI ? "0s" : `${0.15 + i * 0.18}s`; ic.classList.add("kit-entra"); });
      mostraCarta([
        el("p", { class: "kit-sopratitolo", testo: SCHEDA.titolo || id }),
        el("h2", { testo: "Risolto!" }),
        ...(riepilogo ? paragrafi(riepilogo) : []),
        el("div", { class: "kit-vincita" }, ...icone),
        el("p", { testo: salvato.guadagnate === 1 ? "Hai guadagnato 1 caramella dorata." : `Hai guadagnato ${salvato.guadagnate} caramelle dorate.` }),
        el("div", { class: "kit-riga-btn" },
          el("button", { class: "kit-btn kit-btn-forte", type: "button", "data-azione": "chiudi", testo: "Guarda la stanza", onclick: chiudiCarta })),
      ]);
    }
    function cartaGiaRisolto() {
      mostraCarta([
        el("p", { class: "kit-sopratitolo", testo: SCHEDA.stanza || "" }),
        el("h2", { testo: SCHEDA.titolo || id }),
        el("p", { testo: `Questo rompicapo l'hai già risolto e hai guadagnato ${salvato.guadagnate} ${salvato.guadagnate === 1 ? "caramella dorata" : "caramelle dorate"}.` }),
        el("div", { class: "kit-riga-btn" },
          el("button", { class: "kit-btn kit-btn-forte", type: "button", "data-azione": "chiudi", testo: "Guarda la stanza", onclick: chiudiCarta })),
      ]);
    }

    // ── Menu della demo (solo per le prove: nel gioco vero non c'è) ──
    function apriMenu() {
      menu.replaceChildren(
        el("p", { class: "kit-sopratitolo", testo: `Demo · variante ${salvato.seme}` }),
        el("button", { class: "kit-btn", type: "button", "data-azione": "telefono", testo: telefono ? "Vista normale" : "Prova come su un telefono", onclick: () => { telefono = !telefono; menu.hidden = true; misura(); } }),
        el("button", { class: "kit-btn", type: "button", "data-azione": "schermo-intero", testo: "Schermo intero", onclick: () => { menu.hidden = true; document.documentElement.requestFullscreen?.().catch(() => {}); } }),
        el("button", { class: "kit-btn", type: "button", "data-azione": "nuova-variante", testo: "Nuova variante", onclick: () => azzera(true) }),
        el("button", { class: "kit-btn", type: "button", "data-azione": "azzera", testo: "Azzera la demo", onclick: () => azzera(false) }),
      );
      menu.hidden = !menu.hidden;
    }
    function azzera(nuovoSeme) {
      const seme = salvato.seme;
      togli(chiaveStato(id));
      scrivi(CHIAVE_BORSA, { saldo: BORSA_INIZIALE });
      const url = new URL(location.href);
      if (nuovoSeme) url.searchParams.delete("seed");
      else {
        scrivi(chiaveStato(id), { seme, errori: 0, indizi: 0, risolto: false, guadagnate: 0, memoria: {} });
        url.searchParams.delete("seed");
      }
      location.replace(url.toString());
    }
    btnIndizio.addEventListener("click", cartaIndizi);
    btnTesto.addEventListener("click", () => cartaTesto(false));
    btnMenu.addEventListener("click", apriMenu);
    addEventListener("keydown", (e) => {
      if (e.key !== "Escape") return;
      if (!menu.hidden) menu.hidden = true;
      else if (!carta.hidden && carta.onclick) chiudiCarta();
    });

    // ── Avvisi (errori) e fumetto ──
    let timerAvviso = 0;
    function mostraAvviso(testo, tipo = "errore") {
      avviso.textContent = testo;
      avviso.className = `kit-avviso kit-avviso-${tipo}`;
      avviso.hidden = false;
      clearTimeout(timerAvviso);
      timerAvviso = setTimeout(() => { avviso.hidden = true; }, 2600);
    }
    function scuoti() {
      if (RIDUCI) return;
      cornice.classList.remove("kit-scossa");
      void cornice.offsetWidth;
      cornice.classList.add("kit-scossa");
    }

    // ── Ciclo di disegno ──
    const ciclo = [];
    let t0 = performance.now(), ultimo = t0;
    function fotogramma(ora) {
      const dt = Math.min(100, ora - ultimo);
      ultimo = ora;
      // il primo timestamp di requestAnimationFrame può precedere t0: niente tempi negativi
      g.tempo = Math.max(0, ora - t0);
      g.fotogramma = Math.floor(g.tempo / 125);
      for (const f of ciclo) {
        try { f(g.tempo, dt); } catch (err) { console.error(err); }
      }
      // le caramelle della barra e delle carte girano a 8 fps
      for (const ic of document.querySelectorAll(".kit-icona-caramella")) {
        const c2 = ic.getContext("2d");
        c2.clearRect(0, 0, ic.width, ic.height);
        caramella(c2, 0, 0, ic._spenta || RIDUCI ? 0 : g.fotogramma, { spenta: ic._spenta });
      }
      requestAnimationFrame(fotogramma);
    }

    // ── La maniglia `g` passata a crea(g) ──
    let api = {};
    const g = {
      /** I dati del catalogo: titolo, enigma, soluzione, indizi, dorate, erroriConcessi, note, varianti, … */
      scheda: SCHEDA,
      id,
      seme: salvato.seme,
      variante,
      /** true se il giocatore l'aveva già risolto prima di aprire la pagina: il kit blocca già l'input. */
      giaRisolto: salvato.risolto,
      /** true se l'utente ha chiesto meno movimento: le animazioni vanno saltate allo stato finale. */
      riduciMovimento: RIDUCI,
      /** Il contenitore 320×180 della scena (pixel della scena): ci si possono aggiungere tele ed elementi. */
      scena,
      /** La tela principale 320×180 sopra lo sfondo, già senza smussature. */
      ctx,
      tela,
      larghezza: L,
      altezza: A,
      /** Da y = 0 a zonaAlta e da altezza − zonaBassa in giù ci sono le barre del kit: niente pezzi importanti lì. */
      zonaAlta: ZONA_ALTA,
      zonaBassa: ZONA_BASSA,
      tempo: 0,
      fotogramma: 0,
      /** Una tela in più, sopra quelle già create (per livelli separati). */
      nuovaTela(w = L, h = A, x = 0, y = 0) {
        const t = el("canvas", { class: "kit-tela", width: w, height: h });
        t.style.left = `${x}px`;
        t.style.top = `${y}px`;
        t.style.width = `${w}px`;
        t.style.height = `${h}px`;
        scena.insertBefore(t, blocco);
        const c2 = t.getContext("2d");
        c2.imageSmoothingEnabled = false;
        return c2;
      },
      /** Chiama fn(tempo, dt) a ogni fotogramma dello schermo (tempo in ms dall'avvio). */
      anima(fn) { ciclo.push(fn); },
      /** Da un evento del puntatore alle coordinate della scena (pixel 320×180, non arrotondate). */
      aPixel(e) {
        const r = scena.getBoundingClientRect();
        return { x: (e.clientX - r.left) / scala, y: (e.clientY - r.top) / scala };
      },
      /**
       * Ascolta tocchi e clic sulla scena: fn({ tipo: "giu" | "muovi" | "su", x, y, premuto, evento }).
       * "muovi" arriva anche senza tasto premuto (mouse sopra la scena): premuto dice se si sta trascinando.
       * Coordinate in pixel della scena. Funziona con mouse e dita; durante il trascinamento la pagina non scorre.
       */
      tocca(fn) {
        let giu = false;
        const manda = (tipo, e) => {
          if (salvato.risolto) return;
          const p = g.aPixel(e);
          fn({ tipo, x: p.x, y: p.y, premuto: giu, evento: e });
        };
        scena.addEventListener("pointerdown", (e) => { giu = true; scena.setPointerCapture?.(e.pointerId); manda("giu", e); });
        scena.addEventListener("pointermove", (e) => { manda("muovi", e); });
        scena.addEventListener("pointerup", (e) => { if (giu) manda("su", e); giu = false; });
        scena.addEventListener("pointercancel", (e) => { if (giu) manda("su", e); giu = false; });
      },
      /** Un bottone in grassetto nella barra in basso. Ritorna l'elemento (per disabilitarlo o cambiarne il testo). */
      bottone(etichetta, onClick, { id: idBtn, forte = false } = {}) {
        const b = el("button", { class: "kit-btn" + (forte ? " kit-btn-forte" : ""), type: "button", "data-azione": idBtn || etichetta, testo: etichetta });
        b.addEventListener("click", () => { if (!salvato.risolto) onClick(); });
        azioni.append(b);
        return b;
      },
      /** Il fumetto in basso: una o due righe che spiegano cosa è appena successo. null lo nasconde. */
      messaggio(testoMsg) {
        if (testoMsg == null || testoMsg === "") { fumetto.hidden = true; return; }
        fumetto.textContent = testoMsg;
        fumetto.hidden = false;
      },
      /** Un errore: conta, toglie dorate secondo la scheda, scuote la scena e mostra il motivo. */
      errore(motivo) {
        if (salvato.risolto) return g.stato();
        const prima = dorateInPalio(dorate, k, salvato.errori);
        salvato.errori += 1;
        salva();
        const dopo = dorateInPalio(dorate, k, salvato.errori);
        aggiornaBarra();
        scuoti();
        mostraAvviso((motivo ? motivo : "Errore") + (dopo < prima ? ` · ora le dorate in palio sono ${dopo}` : ""));
        return g.stato();
      },
      /** Il rompicapo è risolto: si chiude per sempre. La carta della vittoria arriva dopo `ritardo` ms. */
      risolto({ riepilogo = "", ritardo = 700 } = {}) {
        if (salvato.risolto) return g.stato();
        salvato.risolto = true;
        salvato.guadagnate = dorateInPalio(dorate, k, salvato.errori);
        salva();
        const b = leggi(CHIAVE_BORSA, borsa);
        b.saldo += salvato.guadagnate;
        scrivi(CHIAVE_BORSA, b);
        aggiornaBarra();
        for (const btn of azioni.querySelectorAll("button")) btn.disabled = true;
        setTimeout(() => cartaVittoria(riepilogo), RIDUCI ? 0 : ritardo);
        return g.stato();
      },
      /** Stato comune: errori, dorate in palio, risolto, guadagnate, indizi comprati, borsa. */
      stato() {
        return {
          errori: salvato.errori,
          dorateInPalio: dorateInPalio(dorate, k, salvato.errori),
          risolto: salvato.risolto,
          guadagnate: salvato.guadagnate,
          indiziComprati: salvato.indizi,
          borsa: leggi(CHIAVE_BORSA, borsa).saldo,
          dorate,
          erroriConcessi: k,
        };
      },
      /**
       * Memoria del rompicapo che resiste al ricaricamento (es. tentativi già usati, per non farli ripartire
       * ricaricando la pagina). Si modifica g.memoria e poi si chiama g.salvaMemoria().
       */
      memoria: salvato.memoria,
      salvaMemoria() { salvato.memoria = g.memoria; salva(); },
      /** L'aggancio per le prove: deve esserci almeno gioca(mossa). Vedi REGOLE_COMUNI.md. */
      espone(funzioni) { api = { ...api, ...funzioni }; pubblica(); },
    };

    function pubblica() {
      const gioca = api.gioca;
      window.__demo = {
        ...api,
        pronto: true,
        id,
        funzioni: Object.keys(api),
        seme: salvato.seme,
        variante: JSON.parse(JSON.stringify(variante ?? {})),
        stato: () => g.stato(),
        gioca(mossa) {
          if (salvato.risolto) return { rifiutata: "risolto" };
          if (typeof gioca !== "function") return { eccezione: "gioca non esposta" };
          try {
            const r = gioca(mossa);
            return r === undefined ? { ok: true } : JSON.parse(JSON.stringify(r));
          } catch (err) {
            console.error(err);
            return { eccezione: String(err && err.message || err) };
          }
        },
        chiudiCarte() { chiudiCarta(); menu.hidden = true; },
        azzera: () => azzera(false),
      };
    }

    aggiornaBarra();
    try {
      opzioni.crea(g);
    } catch (err) {
      console.error(err);
    }
    pubblica();
    if (salvato.risolto) cartaGiaRisolto();
    else cartaTesto(true);
    requestAnimationFrame(fotogramma);
    return g;
  }

  window.EscapeDemo = {
    /** La scheda del catalogo: la chiama scheda.js. */
    scheda(dati) { SCHEDA = dati; },
    avvia,
    C, GEMME, BAYER, L, A,
    rett, riquadro, retino, sprite, testo, larghezzaTesto, caramella, casuale, intero, mescola, dorateInPalio, normalizza,
    CARAMELLA,
  };
})();
