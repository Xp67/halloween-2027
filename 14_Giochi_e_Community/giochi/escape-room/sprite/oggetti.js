// Sprite degli oggetti dell'escape room: le chiavi di diamante e la caramella dorata.
// Disegnati pixel per pixel come gli sprite provvisori della fuga di Zucco: una lettera per colore, "." per il vuoto.
// `inSpriteForge` li porta nel formato JSON di SpriteForge (size, palette, grid, frames) che legge il gioco.

// Diamante e contorno: i colori di Zucco (k, W, C, N di sprite-provvisori.js) più un'ombra azzurra.
const DIAMANTE = { k: "#160f1e", W: "#ffffff", w: "#f4fbff", c: "#bfe3f0", m: "#7fa8cc", s: "#46628a" };
// L'oro della caramella: gli stessi di oro e caramelle negli sfondi.
const ORO = { k: "#160f1e", W: "#ffffff", w: "#fff6c8", h: "#ffe45e", y: "#ffb52e", o: "#d68a18", b: "#8a5a10" };

/** Le pietre preziose: scura, media, chiara. Una per stanza, negli occhi del teschio. */
export const GEMME = {
  ametista: { nome: "ametista", colori: ["#3f2a78", "#8a5ad0", "#d3b0ff"] },
  topazio: { nome: "topazio", colori: ["#8a4a10", "#f59a2e", "#ffe08a"] },
  smeraldo: { nome: "smeraldo", colori: ["#1d5a32", "#2fa35a", "#8ff0a8"] },
  rubino: { nome: "rubino", colori: ["#7e1a20", "#d03a2c", "#ff8a7a"] },
  zaffiro: { nome: "zaffiro", colori: ["#1a2a7a", "#2a6cff", "#8fd0ff"] },
  acquamarina: { nome: "acquamarina", colori: ["#12606a", "#37d6c2", "#b8fff0"] },
};

// La chiave dritta, 13×30: teschio come manico, collarino, gambo e mappa.
// Negli occhi (E) va la pietra: chiara in alto a sinistra, scura in basso a destra.
const CHIAVE = [
  "...kkkkkkk...",
  ".kkwwcccmmkk.",
  "kwwcccccmmmsk",
  "kwccccmmmmmsk",
  "kcEEEcmcEEEsk",
  "kcEEEcmcEEEsk",
  "kcEEEmmmEEEsk",
  "kccmmmkmmmmsk",
  ".kcmmkkkmmsk.",
  ".kcmmmmmmmsk.",
  "..kmkmkmkmk..",
  "..kmmmmmmsk..",
  "...kkkkkkk...",
  "...kwccmsk...",
  "...kkkkkkk...",
  "....kcmsk....",
  "....kcmsk....",
  "....kwmsk....",
  "....kcmsk....",
  "....kcmsk....",
  "....kcmskkkk.",
  "....kcmsmmsk.",
  "....kcmsmmsk.",
  "....kcmskksk.",
  "....kcmsmmsk.",
  "....kcmsmmsk.",
  "....kcmskkkk.",
  "....kcmsk....",
  "....kcmsk....",
  ".....kkk.....",
];
const OCCHIO = ["hgg", "ggG", "gGG"];
const OCCHI = [[2, 4], [8, 4]];
const MARGINE = 2; // spazio attorno per i bagliori

const FOTOGRAMMI = 8;

/** Una griglia di lettere modificabile. */
class Tela {
  constructor(w, h) {
    this.w = w;
    this.h = h;
    this.g = Array.from({ length: h }, () => Array(w).fill("."));
  }
  static da(righe, margine = 0) {
    const t = new Tela(righe[0].length + margine * 2, righe.length + margine * 2);
    righe.forEach((r, y) => [...r].forEach((c, x) => { t.g[y + margine][x + margine] = c; }));
    return t;
  }
  copia() {
    const t = new Tela(this.w, this.h);
    t.g = this.g.map((r) => [...r]);
    return t;
  }
  dentro(x, y) { return x >= 0 && y >= 0 && x < this.w && y < this.h; }
  get(x, y) { return this.dentro(x, y) ? this.g[y][x] : "."; }
  set(x, y, c) { if (this.dentro(x, y)) this.g[y][x] = c; }
  righe() { return this.g.map((r) => r.join("")); }
  /** Contorno esterno: ogni pixel vuoto che tocca la forma diventa `c`. */
  contornaFuori(c = "k") {
    const fuori = [];
    for (let y = 0; y < this.h; y++)
      for (let x = 0; x < this.w; x++)
        if (this.get(x, y) === "." && [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => !".k".includes(this.get(x + dx, y + dy))))
          fuori.push([x, y]);
    for (const [x, y] of fuori) this.set(x, y, c);
    return this;
  }
}

/** Una stellina a quattro punte: centro bianco, punte chiare. Non copre le pietre. */
function stellina(t, x, y, grande, protetti) {
  const metti = (px, py, c) => { if (!protetti.has(px + "," + py)) t.set(px, py, c); };
  metti(x, y, "W");
  if (!grande) return;
  for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) metti(x + dx, y + dy, "w");
}

/** Il riflesso che scorre in diagonale: schiarisce di un tono i pixel del materiale sotto la banda. */
function riflesso(t, centro, scala, materiali, protetti) {
  for (let y = 0; y < t.h; y++)
    for (let x = 0; x < t.w; x++) {
      const c = t.get(x, y);
      if (!materiali.includes(c) || protetti.has(x + "," + y)) continue;
      const d = Math.abs(x + y - centro);
      if (d <= 1) t.set(x, y, scala[c] ?? c);
    }
}

/**
 * La chiave di diamante con la pietra negli occhi del teschio. Animazione di 8 fotogrammi: un riflesso
 * scende lungo il diamante, gli occhi si accendono uno alla volta e compaiono due stelline.
 */
export function chiave(gemma) {
  const [scuro, medio, chiaro] = GEMME[gemma].colori;
  const base = Tela.da(CHIAVE, MARGINE);
  const occhi = new Set();
  OCCHI.forEach(([ox, oy]) => OCCHIO.forEach((riga, j) => [...riga].forEach((c, i) => {
    const x = ox + i + MARGINE, y = oy + j + MARGINE;
    base.set(x, y, c);
    occhi.add(x + "," + y);
  })));
  const frames = [];
  for (let f = 0; f < FOTOGRAMMI; f++) {
    const t = base.copia();
    riflesso(t, -4 + f * 8, { w: "W", c: "W", m: "w", s: "c" }, "wcms", occhi);
    // Gli occhi brillano a turno: tutta la pietra si schiarisce e il punto più chiaro diventa bianco.
    OCCHI.forEach(([ox, oy], i) => {
      const acceso = i === 0 ? f === 1 || f === 2 : f === 5 || f === 6;
      if (!acceso) return;
      OCCHIO.forEach((riga, j) => [...riga].forEach((c, k) => {
        const x = ox + k + MARGINE, y = oy + j + MARGINE;
        t.set(x, y, c === "G" ? "g" : "h");
      }));
      t.set(ox + MARGINE, oy + MARGINE, "W");
    });
    if (f === 2) stellina(t, 14, 3, true, occhi);
    if (f === 3) stellina(t, 14, 3, false, occhi);
    if (f === 5) stellina(t, 13, 25, true, occhi);
    if (f === 6) stellina(t, 13, 25, false, occhi);
    frames.push(t.righe());
  }
  return {
    nome: `Chiave di ${GEMME[gemma].nome}`,
    w: base.w,
    h: base.h,
    fps: 8,
    palette: { ...DIAMANTE, G: scuro, g: medio, h: chiaro },
    frames,
  };
}

/** La caramella dorata: corpo tondo d'oro e due incarti arricciati. Un riflesso la attraversa e brilla una stellina. */
export function caramella() {
  const t = new Tela(24, 14);
  const cx = 12, cy = 7, rx = 5.1, ry = 4.9;
  // Gli incarti: ventagli più bassi del corpo (alti uguali sembrava un papillon), con le pieghe più scure.
  for (const verso of [-1, 1]) {
    for (let i = 0; i < 5; i++) {
      const x = cx + verso * (6 + i);
      const mezzo = Math.round(0.6 + i * 0.6);
      for (let y = cy - mezzo; y <= cy + mezzo; y++) t.set(x, y, i % 2 ? "o" : y < cy ? "h" : "y");
    }
    for (let y = cy - 1; y <= cy + 1; y++) t.set(cx + verso * 5, y, "o");
  }
  for (let y = 0; y < t.h; y++)
    for (let x = 0; x < t.w; x++) {
      const dx = (x - cx) / rx, dy = (y - cy) / ry;
      if (dx * dx + dy * dy > 1) continue;
      const v = dx * 0.6 + dy * 0.8;
      t.set(x, y, v < -0.55 ? "h" : v < 0.25 ? "y" : v < 0.75 ? "o" : "b");
    }
  t.set(cx - 2, cy - 2, "W");
  t.set(cx - 1, cy - 2, "h");
  t.contornaFuori("k");
  const frames = [];
  const nessuno = new Set();
  for (let f = 0; f < FOTOGRAMMI; f++) {
    const c = t.copia();
    riflesso(c, -2 + f * 6, { b: "o", o: "y", y: "h", h: "W" }, "boyh", nessuno);
    if (f === 4) stellina(c, 18, 2, true, nessuno);
    if (f === 5) stellina(c, 18, 2, false, nessuno);
    frames.push(c.righe());
  }
  return { nome: "Caramella dorata", w: t.w, h: t.h, fps: 8, palette: ORO, frames };
}

/** Lo stesso sprite nel formato di SpriteForge usato da Zucco: indici nella paletta, -1 per il vuoto. */
export function inSpriteForge(s) {
  const chiavi = Object.keys(s.palette);
  const griglia = (righe) => righe.map((r) => [...r].map((c) => (c === "." ? -1 : chiavi.indexOf(c))));
  return {
    size: Math.max(s.w, s.h),
    palette: chiavi.map((c) => s.palette[c]),
    grid: griglia(s.frames[0]),
    frames: s.frames.map((righe) => ({ grid: griglia(righe) })),
    frameMode: "anim",
  };
}

/** Quale chiave dà ogni stanza (proposta: si può cambiare). */
export const CHIAVI_PER_STANZA = [
  { stanza: "Cancello", gemma: "ametista" },
  { stanza: "Ingresso", gemma: "topazio" },
  { stanza: "Deposito", gemma: "smeraldo" },
  { stanza: "Sala principale", gemma: "rubino" },
  { stanza: "Sala Bar", gemma: "zaffiro" },
  { stanza: "Area Fumatori", gemma: "acquamarina" },
];

export const OGGETTI = {
  ...Object.fromEntries(CHIAVI_PER_STANZA.map(({ gemma }) => [`chiave-${gemma}`, chiave(gemma)])),
  "caramella-dorata": caramella(),
};
