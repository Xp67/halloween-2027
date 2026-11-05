// Sprite provvisori, disegnati in codice nello stesso formato JSON che restituisce SpriteForge
// (size, palette, grid, frames). Un file assets/sprite/<nome>.json con quel formato prende il loro posto.

const COLORI = {
  k: "#160f1e", n: "#23304f",
  o: "#9c3b17", O: "#d9661a", y: "#f59a2e", h: "#ffd07a", b: "#4a1a12",
  G: "#2d5a2e", g: "#5f9440", E: "#ffb52e", e: "#fff3b0",
  P: "#3f2a78", p: "#6a43b8", q: "#a47bf0", B: "#463a6a", L: "#7a6aa4",
  s: "#c3c1d4", S: "#8f8da9", d: "#5e5c7a", D: "#3b3a55", m: "#5b8a4c", M: "#35593a",
  i: "#b0b4d0", I: "#6f7292", r: "#a8603a",
  v: "#9dbb78", V: "#64834f", R: "#5e3c44", T: "#83575c",
  a: "#8a5ad0", A: "#5f3fa8", c: "#a03a66", x: "#ff3b3b",
  W: "#f4fbff", C: "#bfe3f0", N: "#7fa8cc",
  u: "#ff6fa8", U: "#c02a68", t: "#37d6c2", z: "#128a8c", Y: "#ffe45e", Z: "#d68a18",
  f: "#7a5a44", F: "#4e3628", H: "#d03a2c", J: "#7e1a20", Q: "#030104", X: "#8a1e36",
};
const CHIAVI = Object.keys(COLORI);
const PALETTA = Object.values(COLORI);

class Tela {
  constructor(w, h) {
    this.w = w;
    this.h = h;
    this.g = Array.from({ length: h }, () => Array(w).fill(-1));
  }
  punto(x, y, c) {
    if (x >= 0 && y >= 0 && x < this.w && y < this.h) this.g[y][x] = CHIAVI.indexOf(c);
  }
  pieno(x, y) {
    return x >= 0 && y >= 0 && x < this.w && y < this.h && this.g[y][x] !== -1;
  }
  rett(x, y, w, h, c) {
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) this.punto(x + i, y + j, c);
  }
  linea(x0, y0, x1, y1, c) {
    const dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0);
    const sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1;
    let e = dx + dy;
    for (;;) {
      this.punto(x0, y0, c);
      if (x0 === x1 && y0 === y1) return;
      const e2 = 2 * e;
      if (e2 >= dy) { e += dy; x0 += sx; }
      if (e2 <= dx) { e += dx; y0 += sy; }
    }
  }
  stampa(righe, x = 0, y = 0, sostituzioni = {}) {
    righe.forEach((riga, j) => {
      [...riga].forEach((ch, i) => {
        if (ch !== ".") this.punto(x + i, y + j, sostituzioni[ch] ?? ch);
      });
    });
    return this;
  }
  /** I pixel pieni che confinano col vuoto diventano contorno. */
  contorna(c = "k") {
    const bordo = [];
    for (let y = 0; y < this.h; y++)
      for (let x = 0; x < this.w; x++)
        if (this.pieno(x, y) && !(this.pieno(x - 1, y) && this.pieno(x + 1, y) && this.pieno(x, y - 1) && this.pieno(x, y + 1)))
          bordo.push([x, y]);
    for (const [x, y] of bordo) this.punto(x, y, c);
    return this;
  }
}

const hash = (x, y) => {
  const n = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
  return n - Math.floor(n);
};

function sprite(...tele) {
  const size = Math.max(tele[0].w, tele[0].h);
  if (tele.length === 1) return { size, palette: PALETTA, grid: tele[0].g };
  return { size, palette: PALETTA, grid: tele[0].g, frames: tele.map((t) => ({ grid: t.g })), frameMode: "anim" };
}

const TESTA = [
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

const MANTELLI = [
  [
    ".....kkkkkkkkk......",
    "....kqqpppppppk.....",
    "...kqpppppppppPk....",
    "..kqppppppppppPk....",
    ".kqpppPppppppPPk....",
    "kqppPPkppppppPk.....",
    "kppPPk.kpppPPPk.....",
    ".kPk...kpPPPPk......",
    "..k.....kkkkk.......",
  ],
  [
    ".....kkkkkkkkk......",
    "...kkqqpppppppk.....",
    ".kkqqpppppppppPk....",
    "kqqpppppppppppPk....",
    ".kkppPPpppppPPPk....",
    "...kkk.kppppPPk.....",
    ".......kpppPPPk.....",
    ".......kpPPPPk......",
    "........kkkkk.......",
  ],
  [
    ".....kkkkkkkkk......",
    "....kqqpppppppk.....",
    "..kkqpppppppppPk....",
    ".kqqppppppppppPk....",
    "kqppppPpppppPPPk....",
    ".kkkPPkkppppPPk.....",
    "....kk.kpppPPPk.....",
    ".......kpPPPPk......",
    "........kkkkk.......",
  ],
];

function gamba(t, xAnca, xPiede, yPiede, chiaro) {
  const c = chiaro ? "L" : "B";
  const yAnca = 21;
  const xGinocchio = Math.round((xAnca + xPiede) / 2) + 2;
  const yGinocchio = Math.round((yAnca + yPiede) / 2);
  for (const dx of [0, 1]) {
    t.linea(xAnca + dx, yAnca, xGinocchio + dx, yGinocchio, c);
    t.linea(xGinocchio + dx, yGinocchio, xPiede + dx, yPiede - 1, c);
  }
  t.rett(xPiede - 1, yPiede - 1, 5, 2, "k");
  t.rett(xPiede, yPiede - 1, 3, 1, chiaro ? "T" : "R");
}

function lanterna(t, x, y) {
  t.linea(19, 15, x - 1, y - 1, "P");
  t.stampa(["kkk", "kek", "kEk", "kkk"], x, y);
}

function zucco({ avanti, dietro, mantello, sposta = 0, oscilla = 0 }) {
  const t = new Tela(28, 31);
  gamba(t, 11, 13 + dietro[0], 30 - dietro[1], false);
  gamba(t, 14, 13 + avanti[0], 30 - avanti[1], true);
  t.stampa(MANTELLI[mantello], 2, 12 + sposta);
  lanterna(t, 22, 16 + sposta + oscilla);
  t.stampa(TESTA, 9, sposta);
  return t;
}

const CORSA = [
  { avanti: [6, 0], dietro: [-6, 2], mantello: 0, sposta: 1, oscilla: 0 },
  { avanti: [3, 0], dietro: [-7, 4], mantello: 1, sposta: 0, oscilla: 1 },
  { avanti: [-1, 0], dietro: [-3, 5], mantello: 2, sposta: 0, oscilla: 1 },
  { avanti: [-6, 2], dietro: [6, 0], mantello: 0, sposta: 1, oscilla: 0 },
  { avanti: [-7, 4], dietro: [3, 0], mantello: 1, sposta: 0, oscilla: -1 },
  { avanti: [-3, 5], dietro: [-1, 0], mantello: 2, sposta: 0, oscilla: -1 },
];

function zuccoScivola(fotogramma) {
  const t = new Tela(32, 19);
  t.stampa(
    [
      "........kkkkkkkkk...",
      ".....kkkqqqpppppk...",
      "..kkkqqqppppppppk...",
      ".kqqqpppppppppppk...",
      "kqqppppppppPPPPPk...",
      ".kkpppppPPPPPPPk....",
      "...kkkPPPPPPkkk.....",
    ],
    fotogramma ? 1 : 0,
    8,
  );
  t.stampa(["..kBBLLkBBLLk.", "..kRRRkkRRRk.."], 3, 15);
  t.stampa(TESTA, 17, 4);
  t.stampa(["kkk", "kek", "kkk"], 29, 13);
  return t;
}

function lapide() {
  const w = 17, h = 23, t = new Tela(w, h);
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      const dx = (x - 8) / 8.5, dy = (y - 7) / 7;
      if (y < 7 && dx * dx + dy * dy > 1) continue;
      const k = x / w + (hash(x, y) - 0.5) * 0.22;
      t.punto(x, y, k < 0.22 ? "s" : k < 0.6 ? "S" : k < 0.86 ? "d" : "D");
    }
  t.linea(8, 5, 8, 14, "D");
  t.linea(5, 8, 11, 8, "D");
  t.linea(9, 6, 9, 14, "s");
  t.linea(6, 9, 11, 9, "s");
  t.linea(13, 11, 11, 15, "D");
  t.linea(11, 15, 12, 18, "D");
  for (let x = 0; x < w; x++) {
    const alto = Math.floor(hash(x, 3) * 4);
    for (let y = h - 1 - alto; y < h; y++) t.punto(x, y, hash(x, y) > 0.5 ? "m" : "M");
  }
  return t.contorna();
}

function croce() {
  const w = 15, h = 33, t = new Tela(w, h);
  const pietra = (x, y) => {
    const k = x / w + (hash(x, y) - 0.5) * 0.2;
    t.punto(x, y, k < 0.38 ? "s" : k < 0.6 ? "S" : k < 0.8 ? "d" : "D");
  };
  for (let y = 0; y < 27; y++) for (let x = 5; x < 10; x++) pietra(x, y);
  for (let y = 7; y < 12; y++) for (let x = 0; x < w; x++) pietra(x, y);
  for (let y = 27; y < h; y++) for (let x = 2; x < 13; x++) pietra(x, y);
  for (let x = 2; x < 13; x++) if (hash(x, 9) > 0.45) t.punto(x, h - 1, "M");
  t.linea(5, 24, 7, 15, "m");
  t.punto(8, 18, "m");
  return t.contorna();
}

function recinto() {
  const w = 38, h = 20, t = new Tela(w, h);
  for (let x = 2; x < w; x += 6) {
    t.rett(x, 4, 2, h - 4, "i");
    t.rett(x + 1, 4, 1, h - 4, "I");
    t.stampa([".i.", "iiI", "iiI", ".I."], x - 1, 0);
  }
  t.rett(0, 7, w, 2, "I");
  t.rett(0, 15, w, 2, "I");
  t.rett(0, 7, w, 1, "i");
  for (let x = 0; x < w; x++) {
    if (hash(x, 1) > 0.72) t.punto(x, 8, "r");
    if (hash(x, 2) > 0.72) t.punto(x, 15, "r");
    if (hash(x, 5) > 0.82) t.punto(x, 12, "r");
  }
  return t.contorna();
}

function mano() {
  return new Tela(14, 26).stampa(
    [
      "...k.k.k......",
      "..kvkvkvk.....",
      "..kvkvkvk.k...",
      "..kvkvkvkkvk..",
      "k.kvvvvvvkvk..",
      "vkkvvvvvvvvk..",
      "kvvvvvvvvvk...",
      ".kvvVVvvvk....",
      "..kvvVVvvk....",
      "...kvvVvk.....",
      "...kvvVvk.....",
      "...kvvVvk.....",
      "..kRRRRRRk....",
      "..kRTTRTRk....",
      "..kRTRRTRk....",
      "...kRTTRk.....",
      "...kRTTRk.....",
      "...kRRTRk.....",
      "...kRRTRk.....",
      "...kRTRRk.....",
      "...kRTRRk.....",
      "...kRRTRk.....",
      "...kRRRRk.....",
      "...kRRTRk.....",
      "...kRTRRk.....",
      "...kRRRRk.....",
    ],
    0,
    0,
  );
}

function monticello() {
  return new Tela(20, 5).stampa([
    ".......kkkk.........",
    "....kkkfffFkkk......",
    "..kkffFffkFffFkk....",
    ".kfFfffFfkkfFffFk...",
    "kFfffFffFffFfffFFk..",
  ]);
}

const ALI = [
  [
    "k....................k",
    "kk..................kk",
    "kak......k..k......kak",
    "kaak.....kkkk.....kaak",
    "kaaak...kAAAAk...kaaak",
    ".kaaak.kAxAAxAk.kaaak.",
    "..kaaakkAAAAAAkkaaak..",
    "...kaaakAAccAAkaaak...",
    "....kkk.kAAAAk.kkk....",
    ".........kkkk.........",
  ],
  [
    "......................",
    ".........k..k.........",
    ".........kkkk.........",
    "...kkkk.kAAAAk.kkkk...",
    ".kkaaaakAxAAxAkaaaakk.",
    "kaaaaaakAAAAAAkaaaaaak",
    "kakaakakAAccAAkakaakak",
    ".k.kk.k.kAAAAk.k.kk.k.",
    ".........kkkk.........",
    "......................",
  ],
  [
    ".........k..k.........",
    ".........kkkk.........",
    "........kAAAAk........",
    "......kkAxAAxAkk......",
    "....kkaaAAAAAAaakk....",
    "...kaaaaAAccAAaaaak...",
    "..kaaak.kAAAAk.kaaak..",
    ".kaak....kkkk....kaak.",
    ".kak..............kak.",
    ".kk................kk.",
  ],
];

function fantasma(fotogramma) {
  const w = 20, h = 25, t = new Tela(w, h);
  for (let x = 2; x < 18; x++) {
    const dx = (x - 9.5) / 8;
    const cima = Math.round(9 - 8 * Math.sqrt(Math.max(0, 1 - dx * dx)));
    const fondo = 20 + Math.round(2.4 * Math.sin((x + fotogramma * 3) / 2.2));
    for (let y = cima; y <= fondo; y++) {
      const k = (x / w) * 0.6 + (y / h) * 0.5 + (hash(x, y) - 0.5) * 0.12;
      t.punto(x, y, k < 0.5 ? "W" : k < 0.78 ? "C" : "N");
    }
  }
  const su = fotogramma % 2;
  t.rett(0, 11 + su, 3, 3, "C");
  t.rett(17, 12 - su, 3, 3, "N");
  t.contorna("n");
  t.rett(6, 7, 3, 4, "n");
  t.rett(11, 7, 3, 4, "n");
  t.punto(7, 8, "W");
  t.punto(12, 8, "W");
  t.rett(8, 13, 4, 3 + su, "n");
  return t;
}

function ragno(fotogramma) {
  const zampe = fotogramma
    ? ["k...kkkkkk...k", ".kkkmAAAAmkkk.", "k..kAxAAxAk..k", ".kkkAAAAAAkkk.", "k..kAAccAAk..k", ".k..kAAAAk..k.", "....k.kk.k...."]
    : [".k..kkkkkk..k.", "k.kkmAAAAmkk.k", ".k.kAxAAxAk.k.", "k.kkAAAAAAkk.k", ".k.kAAccAAk.k.", "k...kAAAAk...k", "....k.kk.k...."];
  return new Tela(14, 7).stampa(zampe, 0, 0, { m: "a" });
}

function caramella(chiaro, scuro, centro, luce) {
  return [0, 1].map((f) =>
    new Tela(13, 9).stampa(
      [
        ".............",
        ".kk.......kk.",
        ".kAk.kkk.kAk.",
        ".kAAkCCCkAAk.",
        "..kAkCWCkAk..",
        ".kAAkCCCkAAk.",
        ".kAk.kkk.kAk.",
        ".kk.......kk.",
        ".............",
      ],
      0,
      0,
      { A: f ? chiaro : scuro, C: centro, W: f ? luce : centro },
    ),
  );
}

// L'orda che insegue Zucco: tutti guardano a destra.
const PASSI_ORDA = [[5, -5], [2, -3], [-5, 5], [-3, 2]];

const TESCHIO = [
  ".kkkkkk.",
  "kWWWWWWk",
  "kWWWWWWk",
  "kWkkWkkk",
  "kWWWWWWk",
  ".kWkWkWk",
  "..kkkkk.",
];

function scheletro(f) {
  const t = new Tela(18, 27);
  const [avanti, dietro] = PASSI_ORDA[f];
  const su = f % 2;
  const gamba = (dx, c) => {
    const ginocchio = 8 + Math.round(dx / 2) + 1;
    t.linea(8, 17, ginocchio, 21, c);
    t.linea(ginocchio, 21, 8 + dx, 25, c);
    t.rett(8 + dx, 25, 3, 1, c);
  };
  gamba(dietro, "N");
  t.linea(9, 9, 15, 11 + su, "N");
  t.linea(8, 7, 8, 16, "C");
  for (const y of [9, 11, 13]) t.linea(5, y, 11, y, "W");
  t.rett(6, 15, 5, 2, "C");
  gamba(avanti, "W");
  t.linea(9, 10, 16, 8 + su * 2, "W");
  t.stampa(TESCHIO, 5, su);
  return t;
}

const TESTA_ZOMBIE = [
  ".kkkkkk.",
  "kVvvvvvk",
  "kvvvvvvk",
  "kvvkxvxk",
  "kvvvvvvk",
  "kVvkkkvk",
  ".kkkkkk.",
];

function zombie(f) {
  const t = new Tela(20, 27);
  const [avanti, dietro] = PASSI_ORDA[f];
  const su = f % 2;
  const gamba = (dx, c) => {
    for (const lato of [0, 1]) t.linea(8 + lato, 17, 8 + dx + lato, 25, c);
    t.rett(8 + dx, 25, 4, 1, "k");
  };
  gamba(dietro, "B");
  t.rett(11, 11 + su, 8, 2, "V");
  t.rett(5, 7, 8, 10, "R");
  for (let y = 7; y < 17; y++) t.punto(5 + (y % 3), y, "T");
  t.rett(7, 15, 2, 2, "v");
  gamba(avanti, "L");
  t.rett(11, 9 + su, 8, 2, "v");
  t.punto(19, 9 + su, "V");
  t.stampa(TESTA_ZOMBIE, 5, su);
  return t;
}

const TESTA_LUPO = [
  "..k.k....",
  ".kfkfk...",
  "kfffffkk.",
  "kfxffffWk",
  "kfffFFFFk",
  ".kfFkWkWk",
  "..kkkkkk.",
];

function lupo(f) {
  const t = new Tela(31, 20);
  const [a, b] = PASSI_ORDA[f];
  const su = f % 2;
  const zampa = (x, dx, c) => {
    for (const lato of [0, 1]) t.linea(x + lato, 13, x + dx + lato, 19, c);
  };
  zampa(10, b, "F");
  zampa(20, a, "F");
  t.linea(7, 8, 1, 4 + su * 2, "F");
  t.linea(7, 9, 2, 5 + su * 2, "f");
  t.rett(7, 7 + su, 16, 7, "f");
  t.rett(7, 12 + su, 16, 2, "F");
  t.rett(9, 7 + su, 12, 1, "S");
  zampa(8, a, "f");
  zampa(18, b, "f");
  t.stampa(TESTA_LUPO, 22, 3 + su);
  return t;
}

function diavoletto(f) {
  const t = new Tela(19, 20);
  const salto = [0, 2, 3, 1][f];
  t.linea(4, 13 - salto, 0, 9 - salto, "J");
  t.stampa(["kHk", ".k."], 0, 7 - salto);
  for (let y = 3; y < 15; y++)
    for (let x = 3; x < 14; x++) {
      const dx = (x - 8) / 5.4, dy = (y - 9) / 6;
      if (dx * dx + dy * dy <= 1) t.punto(x, y - salto, x + y > 19 ? "J" : "H");
    }
  t.stampa(["h......h", "hk....kh"], 4, 2 - salto);
  t.stampa(["YkkY", "...."], 7, 7 - salto);
  t.linea(7, 12 - salto, 11, 12 - salto, "k");
  t.rett(5, 15 - salto, 3, 3, "J");
  t.rett(10, 15 - salto, 3, 3, "J");
  t.linea(16, 3 - salto, 16, 19 - salto, "i");
  t.stampa(["i.i.i", "iiiii", "..i.."], 14, 1 - salto);
  return t;
}

// Il Padrone delle Mani: nero come le mani che ti inseguono, con lo stesso riflesso rosso.
function volto(espressione) {
  const t = new Tela(64, 64);
  for (const lato of [-1, 1])
    for (let i = 0; i < 26; i++) {
      const k = i / 25;
      const x = Math.round(32 + lato * (17 + 12 * k + 3 * Math.sin(k * 3)));
      const y = Math.round(24 - 22 * k);
      t.rett(x - 2, y - 1, k < 0.7 ? 4 : 2, 3, "Q");
    }
  for (let y = 12; y < 64; y++)
    for (let x = 6; x < 58; x++) {
      const dx = (x - 32) / 23, dy = (y - 38) / 26;
      if (dx * dx + dy * dy <= 1) t.punto(x, y, "Q");
    }
  t.contorna("X");

  const occhio = (cx, verso) => {
    if (espressione === "colpito") {
      t.linea(cx - 4, 28, cx + 4, 36, "W");
      t.linea(cx + 4, 28, cx - 4, 36, "W");
      return;
    }
    for (let i = 0; i < 10; i++) {
      const alto = 30 + Math.round(verso * (i - 5) * 0.5);
      t.rett(cx - 5 + i, alto, 1, 5 - Math.abs(i - 5) / 2, "x");
    }
    t.rett(cx - 1, 31, 3, 2, "Y");
  };
  occhio(21, 1);
  occhio(43, -1);

  if (espressione === "ruggito") {
    t.rett(17, 42, 30, 15, "k");
    t.rett(19, 44, 26, 11, "J");
    for (let x = 18; x < 46; x += 5) {
      t.linea(x, 42, x + 2, 48, "W");
      t.linea(x + 2, 56, x + 4, 50, "W");
    }
  } else {
    for (let x = 18; x < 46; x++) t.punto(x, 48 + ((x % 6) < 3 ? 0 : 2), "X");
    for (let x = 20; x < 46; x += 6) t.linea(x, 47, x + 1, 51, "C");
  }
  return t;
}

function manoGigante(posa) {
  const t = new Tela(48, 48);
  t.rett(12, 26, 24, 20, "Q");
  for (const [dita, base] of [[0, 14], [1, 20], [2, 26], [3, 32]]) {
    const apertura = (dita - 1.5) * (posa === "aperta" ? 4 : posa === "artiglio" ? 2 : 0.6);
    const lungo = posa === "pugno" ? 8 : 20 - Math.abs(dita - 1.5) * 2;
    const punta = [base + Math.round(apertura), 26 - lungo];
    for (const lato of [0, 1, 2]) t.linea(base + lato, 27, punta[0] + lato - 1, punta[1], "Q");
    if (posa === "artiglio") t.linea(punta[0], punta[1], punta[0] + (dita < 2 ? 3 : -3), punta[1] + 5, "Q");
  }
  for (const lato of [0, 1, 2, 3]) t.linea(12 + lato, 34, 2 + lato, 22, "Q");
  return t.contorna("X");
}

function mazza() {
  const t = new Tela(30, 8);
  for (let x = 0; x < 30; x++) {
    const grosso = x < 10 ? 1 : Math.min(3, 1 + Math.floor((x - 10) / 6));
    t.rett(x, 4 - grosso, 1, grosso * 2, x < 7 ? "k" : "f");
    t.punto(x, 4 - grosso, x < 7 ? "L" : "h");
  }
  return t.contorna();
}

/** La mazza in mano, a vari angoli: da caricata a fine colpo. */
function mazzaInMano(gradi) {
  const t = new Tela(60, 60);
  const a = (gradi * Math.PI) / 180;
  for (let i = 0; i < 26; i++) {
    const x = Math.round(30 + Math.cos(a) * i), y = Math.round(30 + Math.sin(a) * i);
    const grosso = i < 9 ? 1 : i < 18 ? 2 : 3;
    t.rett(x - (grosso >> 1), y - (grosso >> 1), grosso, grosso, i < 7 ? "k" : "f");
  }
  return t.contorna();
}

function piattaforma() {
  const t = new Tela(60, 9);
  for (let y = 0; y < 9; y++)
    for (let x = 0; x < 60; x++) {
      if (y > 5 && (x < 3 + (y - 5) * 2 || x > 56 - (y - 5) * 2)) continue;
      const k = y / 9 + (hash(x, y) - 0.5) * 0.3;
      t.punto(x, y, k < 0.3 ? "s" : k < 0.65 ? "S" : "d");
    }
  for (let x = 2; x < 58; x++) if (hash(x, 1) > 0.6) t.punto(x, 0, hash(x, 2) > 0.5 ? "m" : "M");
  return t.contorna();
}

function osso() {
  return new Tela(16, 8).stampa([
    ".kk..........kk.",
    "kWWk........kWWk",
    "kWWWkkkkkkkkWWCk",
    ".kWWWWWWWWWWWCk.",
    ".kWWWWWWWWWWCCk.",
    "kWWCkkkkkkkkWCCk",
    "kWCk........kCCk",
    ".kk..........kk.",
  ]);
}

const VITA = [
  "....g....",
  "..kkGkk..",
  ".kOyyOOk.",
  "kOyEOEOOk",
  "kOOOOOOOk",
  "kOEbEbEOk",
  ".kOOOOOk.",
  "..kkkkk..",
];

export const SPRITE_PROVVISORI = {
  zucco_corsa: sprite(...CORSA.map(zucco)),
  zucco_sale: sprite(zucco({ avanti: [3, 7], dietro: [-4, 6], mantello: 2, oscilla: 1 })),
  zucco_scende: sprite(zucco({ avanti: [5, 2], dietro: [-5, 3], mantello: 1, oscilla: -1 })),
  zucco_scivola: sprite(zuccoScivola(0), zuccoScivola(1)),
  zucco_ko: sprite(new Tela(14, 13).stampa(TESTA, 0, 0, { e: "b", E: "o" })),
  zucco_testa: sprite(new Tela(14, 13).stampa(TESTA)),
  vita: sprite(new Tela(9, 8).stampa(VITA)),
  vita_persa: sprite(new Tela(9, 8).stampa(VITA, 0, 0, { O: "D", y: "d", E: "k", b: "k", g: "D", G: "D" })),
  orda_scheletro: sprite(...[0, 1, 2, 3].map(scheletro)),
  orda_zombie: sprite(...[0, 1, 2, 3].map(zombie)),
  orda_lupo: sprite(...[0, 1, 2, 3].map(lupo)),
  orda_diavoletto: sprite(...[0, 1, 2, 3].map(diavoletto)),
  boss_volto: sprite(volto("fermo"), volto("ruggito"), volto("colpito")),
  boss_mano: sprite(manoGigante("aperta"), manoGigante("artiglio"), manoGigante("pugno")),
  mazza: sprite(mazza()),
  mazza_in_mano: sprite(...[-125, -70, -10, 45].map(mazzaInMano)),
  piattaforma: sprite(piattaforma()),
  lancio_osso: sprite(osso()),
  lancio_teschio: sprite(new Tela(8, 7).stampa(TESCHIO)),
  lancio_zucca: sprite(new Tela(14, 13).stampa(TESTA, 0, 0, { O: "V", y: "v", o: "M", h: "v", e: "x", E: "J", b: "k", g: "F", G: "F" })),
  lapide: sprite(lapide()),
  croce: sprite(croce()),
  recinto: sprite(recinto()),
  mano: sprite(mano()),
  monticello: sprite(monticello()),
  pipistrello: sprite(...[0, 1, 2, 1].map((i) => new Tela(22, 10).stampa(ALI[i]))),
  fantasma: sprite(fantasma(0), fantasma(1), fantasma(2), fantasma(3)),
  ragno: sprite(ragno(0), ragno(1)),
  caramella_rosa: sprite(...caramella("u", "U", "Y", "W")),
  caramella_verde: sprite(...caramella("t", "z", "u", "W")),
  caramella_gialla: sprite(...caramella("Y", "Z", "t", "W")),
};
