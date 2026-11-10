// Sfondi in pixel art delle stanze dell'escape room: 320×180 e paletta della fuga di Zucco, così i due giochi
// sembrano lo stesso mondo. Ogni stanza è una funzione che disegna su un contesto 2D.
//
// Regole di composizione, valide per tutte le stanze:
// - il centro resta calmo: lì sopra il gioco mette il rompicapo (bilancia, casse, bicchieri…);
// - i dettagli stanno ai bordi, che sul telefono possono essere tagliati;
// - il pavimento (o il prato) parte da PAVIMENTO e ospita gli oggetti del rompicapo appoggiati a terra;
// - niente oggetti che somigliano ai pezzi del rompicapo della stanza (nell'Ingresso, niente zucche).

export const LARGHEZZA = 320;
export const ALTEZZA = 180;
export const PAVIMENTO = 118;

const BAYER = [[0, 8, 2, 10], [12, 4, 14, 6], [3, 11, 1, 9], [15, 7, 13, 5]];

// Colori presi da sprite-provvisori.js, render.js e cinematica.js della fuga di Zucco.
export const C = {
  nero: "#030104",
  bordo: "#160f1e",
  muro: "#1c1230",
  mattone: "#241838",
  muroCaldo: "#33203f",
  muroAcceso: "#4a2c3a",
  muroCasa: "#2a1c38",
  ombraCasa: "#1c1228",
  tetto: "#140c1e",
  tettoChiaro: "#21162f",
  pavimento: "#2d1c3a",
  pavimento2: "#3a2546",
  terra: "#241630",
  erbaScura: "#2c4a34",
  erba: "#47703f",
  erbaChiara: "#7da04f",
  siepe: "#1d3326",
  legnoScuro: "#2a1a12",
  legno: "#3a2418",
  legnoChiaro: "#5a3a26",
  legnoLuce: "#7a5a44",
  ferro: "#3b3a55",
  ferroChiaro: "#5e5c7a",
  pietra: "#8f8da9",
  pietraChiara: "#c3c1d4",
  notte: "#23304f",
  notteChiara: "#7fa8cc",
  sagoma: "#0a0d22",
  luna: "#fff3b0",
  vetro: "#ffcf5e",
  fiamma: "#f59a2e",
  fiammaChiara: "#ffd07a",
  brace: "#d9661a",
  tappeto: "#7e1a20",
  tappetoChiaro: "#d03a2c",
  oro: "#ffb52e",
  oroScuro: "#d68a18",
  violaScuro: "#3f2a78",
  viola: "#6a43b8",
  lilla: "#a47bf0",
  rosa: "#ff6fa8",
  acqua: "#37d6c2",
  giallo: "#ffe45e",
  brand: "#aaa5ff",
  bianco: "#ffffff",
};

// Il cielo di notte e la luna del secondo atto di Zucco.
const CIELO_NOTTE = ["#070a1f", "#0d1536", "#16214f", "#23316b", "#3a4a86"];
const LUNA = ["#f4f7ff", "#c9d3ec", "#94a3cc"];

// Il carattere 5×7 di Zucco (render.js): solo le lettere che servono.
const FONT = {
  A: [0x7c, 0x12, 0x11, 0x12, 0x7c], B: [0x7f, 0x49, 0x49, 0x49, 0x36], D: [0x7f, 0x41, 0x41, 0x41, 0x3e],
  E: [0x7f, 0x49, 0x49, 0x49, 0x41], F: [0x7f, 0x09, 0x09, 0x09, 0x01], G: [0x3e, 0x41, 0x41, 0x51, 0x73],
  H: [0x7f, 0x08, 0x08, 0x08, 0x7f], I: [0x00, 0x41, 0x7f, 0x41, 0x00], J: [0x20, 0x40, 0x41, 0x3f, 0x01],
  L: [0x7f, 0x40, 0x40, 0x40, 0x40], M: [0x7f, 0x02, 0x1c, 0x02, 0x7f], N: [0x7f, 0x04, 0x08, 0x10, 0x7f],
  O: [0x3e, 0x41, 0x41, 0x41, 0x3e], R: [0x7f, 0x09, 0x19, 0x29, 0x46], S: [0x26, 0x49, 0x49, 0x49, 0x32],
  T: [0x03, 0x01, 0x7f, 0x01, 0x03], U: [0x3f, 0x40, 0x40, 0x40, 0x3f], V: [0x1f, 0x20, 0x40, 0x20, 0x1f],
  W: [0x3f, 0x40, 0x38, 0x40, 0x3f], " ": [0, 0, 0, 0, 0],
};

export function casuale(seme) {
  let a = seme;
  return () => {
    a = (Math.imul(a, 1664525) + 1013904223) >>> 0;
    return a / 4294967296;
  };
}

export function rett(ctx, c, x, y, w, h) {
  ctx.fillStyle = c;
  ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
}

export function linea(ctx, c, x0, y0, x1, y1) {
  ctx.fillStyle = c;
  x0 = Math.round(x0); y0 = Math.round(y0); x1 = Math.round(x1); y1 = Math.round(y1);
  const dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0);
  const sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1;
  let err = dx + dy;
  for (;;) {
    ctx.fillRect(x0, y0, 1, 1);
    if (x0 === x1 && y0 === y1) return;
    const e2 = 2 * err;
    if (e2 >= dy) { err += dy; x0 += sx; }
    if (e2 <= dx) { err += dx; y0 += sy; }
  }
}

/** Riempie con un retino ordinato dove forza(x, y) va da 0 (niente) a 1 (pieno): niente sfumature, solo pixel. */
export function retino(ctx, c, x0, y0, w, h, forza) {
  ctx.fillStyle = c;
  for (let y = y0; y < y0 + h; y++)
    for (let x = x0; x < x0 + w; x++) {
      const k = forza(x, y);
      if (k > 0 && k * 16 > BAYER[y & 3][x & 3]) ctx.fillRect(x, y, 1, 1);
    }
}

export function bagliore(ctx, c, cx, cy, raggio, forza = 1) {
  retino(ctx, c, cx - raggio, cy - raggio, raggio * 2, raggio * 2, (x, y) => forza * (1 - Math.hypot(x - cx, y - cy) / raggio));
}

/** Una forma ad arco: rettangolo con la cima a mezzo cerchio. */
function arco(ctx, c, cx, cima, mezzo, fondo) {
  ctx.fillStyle = c;
  for (let y = cima; y < fondo; y++) {
    const dy = cima + mezzo - y;
    const mw = dy > 0 ? Math.sqrt(Math.max(0, mezzo * mezzo - dy * dy)) : mezzo;
    const x = Math.round(cx - mw);
    ctx.fillRect(x, y, Math.round(cx + mw) - x, 1);
  }
}

function scrivi(ctx, testo, x, y, colore, ombra = C.bordo, s = 1) {
  const glifi = (dx, dy, c) => {
    ctx.fillStyle = c;
    [...testo].forEach((ch, i) => (FONT[ch] ?? FONT[" "]).forEach((colonna, col) => {
      for (let r = 0; r < 7; r++) if (colonna & (1 << r)) ctx.fillRect(x + (i * 6 + col) * s + dx, y + r * s + dy, s, s);
    }));
  };
  if (ombra) glifi(1, 1, ombra);
  glifi(0, 0, colore);
}
const larghezzaTesto = (testo, s = 1) => (testo.length * 6 - 1) * s;

// ── Esterni ──

function cielo(ctx, fasce, fino) {
  for (let y = 0; y < fino; y++) {
    const pos = (y / (fino - 1)) * (fasce.length - 1);
    const i = Math.min(fasce.length - 2, Math.floor(pos));
    const f = pos - i;
    for (let x = 0; x < LARGHEZZA; x++) rett(ctx, f * 16 > BAYER[y & 3][x & 3] ? fasce[i + 1] : fasce[i], x, y, 1, 1);
  }
}

function stelle(ctx, fino, seme) {
  const rng = casuale(seme);
  for (let i = 0; i < 70; i++) {
    const x = Math.floor(rng() * LARGHEZZA), y = Math.floor(rng() * fino);
    rett(ctx, rng() > 0.85 ? C.bianco : rng() > 0.5 ? C.notteChiara : "#3a4a86", x, y, 1, 1);
  }
}

function luna(ctx, cx, cy, raggio) {
  const [chiaro, medio, scuro] = LUNA;
  bagliore(ctx, "#23316b", cx, cy, raggio + 14, 0.9);
  const crateri = [[-0.35, -0.3, 0.26], [0.3, -0.1, 0.18], [-0.05, 0.42, 0.3], [0.45, 0.45, 0.14], [-0.55, 0.3, 0.12]];
  for (let y = -raggio; y <= raggio; y++)
    for (let x = -raggio; x <= raggio; x++) {
      const dx = x / raggio, dy = y / raggio;
      if (dx * dx + dy * dy > 1) continue;
      const px = cx + x, py = cy + y;
      const ombra = dx * 0.5 + dy * 0.35;
      let c = ombra * 16 > BAYER[py & 3][px & 3] * 0.8 + 3 ? medio : chiaro;
      for (const [kx, ky, r] of crateri) if ((dx - kx) ** 2 + (dy - ky) ** 2 < r * r) c = dx - kx + (dy - ky) > 0 ? medio : scuro;
      rett(ctx, c, px, py, 1, 1);
    }
}

function albero(ctx, x, y, angolo, lunghezza, rng, spessore) {
  if (lunghezza < 3) return;
  const fx = x + Math.cos(angolo) * lunghezza, fy = y + Math.sin(angolo) * lunghezza;
  const passi = Math.ceil(lunghezza);
  for (let i = 0; i <= passi; i++) {
    const k = i / passi;
    ctx.fillRect(Math.round(x + (fx - x) * k), Math.round(y + (fy - y) * k), spessore, spessore);
  }
  const rami = lunghezza > 9 ? 3 : 2;
  for (let i = 0; i < rami; i++)
    albero(ctx, fx, fy, angolo + (rng() - 0.5) * 1.5, lunghezza * (0.58 + rng() * 0.2), rng, Math.max(1, spessore - 1));
}

function alberoSpoglio(ctx, x, base, alto, seme) {
  ctx.fillStyle = C.sagoma;
  albero(ctx, x, base, -Math.PI / 2, alto, casuale(seme), 4);
}

function siepe(ctx, x, w, base, seme) {
  const rng = casuale(seme);
  for (let i = 0; i < w; i++) {
    const alto = 9 + Math.round(Math.sin(i / 4) * 2 + rng() * 2);
    rett(ctx, C.siepe, x + i, base - alto, 1, alto);
    if (rng() > 0.7) rett(ctx, C.erbaScura, x + i, base - alto, 1, 1);
  }
}

function prato(ctx, seme) {
  const rng = casuale(seme);
  const terra = [C.pavimento2, C.pavimento, C.terra];
  for (let y = PAVIMENTO; y < ALTEZZA; y++)
    for (let x = 0; x < LARGHEZZA; x++) {
      const k = ((y - PAVIMENTO) / (ALTEZZA - PAVIMENTO)) * 0.9 + rng() * 0.35;
      rett(ctx, k < 0.45 ? terra[0] : k < 0.85 ? terra[1] : terra[2], x, y, 1, 1);
    }
  for (let x = 0; x < LARGHEZZA; x++) {
    const alto = 2 + Math.floor(rng() * 3);
    rett(ctx, C.erbaScura, x, PAVIMENTO, 1, alto + 1);
    rett(ctx, C.erba, x, PAVIMENTO, 1, alto - 1);
    if (rng() > 0.8) rett(ctx, C.erbaChiara, x, PAVIMENTO, 1, 1);
  }
  // Ciuffi d'erba sparsi.
  for (let i = 0; i < 26; i++) {
    const x = Math.floor(rng() * LARGHEZZA), y = PAVIMENTO + 8 + Math.floor(rng() * (ALTEZZA - PAVIMENTO - 12));
    rett(ctx, C.erbaScura, x, y, 1, 3);
    rett(ctx, C.erbaScura, x + 2, y + 1, 1, 2);
    rett(ctx, C.erba, x + 1, y - 1, 1, 3);
  }
}

function vialetto(ctx, cimaSx, cimaDx, fondoSx, fondoDx) {
  const rng = casuale(29);
  let y = PAVIMENTO;
  let riga = 0;
  while (y < ALTEZZA) {
    const h = 5 + riga;
    const k0 = (y - PAVIMENTO) / (ALTEZZA - PAVIMENTO);
    const sx = cimaSx + (fondoSx - cimaSx) * k0, dx = cimaDx + (fondoDx - cimaDx) * k0;
    const pietre = 3 + (riga % 2);
    const largo = (dx - sx) / pietre;
    for (let p = 0; p < pietre; p++) {
      const x0 = sx + p * largo + 1, w = largo - 2;
      rett(ctx, C.ferro, x0, y + 1, w, h - 1);
      rett(ctx, rng() > 0.5 ? C.ferroChiaro : "#4f4d6a", x0, y, w, h - 2);
      rett(ctx, C.pietra, x0 + 1, y, Math.max(1, w - 3), 1);
    }
    y += h;
    riga++;
  }
}

function cancellata(ctx, x0, x1, base) {
  rett(ctx, C.bordo, x0, base - 16, x1 - x0, 2);
  rett(ctx, C.bordo, x0, base - 6, x1 - x0, 2);
  for (let x = x0; x < x1; x += 5) {
    rett(ctx, C.bordo, x, base - 20, 2, 20);
    rett(ctx, C.bordo, x, base - 22, 2, 1);
    rett(ctx, C.ferro, x, base - 20, 1, 1);
  }
}

function lanterna(ctx, cx, base) {
  bagliore(ctx, "#3a2a3a", cx, base - 36, 26, 1);
  bagliore(ctx, "#5a3a26", cx, base - 36, 12, 1);
  rett(ctx, C.bordo, cx - 1, base - 30, 3, 30);
  rett(ctx, C.ferro, cx, base - 30, 1, 30);
  rett(ctx, C.bordo, cx - 4, base - 33, 9, 3);
  rett(ctx, C.bordo, cx - 4, base - 43, 9, 11);
  rett(ctx, C.fiammaChiara, cx - 3, base - 42, 7, 9);
  rett(ctx, C.fiamma, cx - 3, base - 38, 7, 5);
  rett(ctx, C.bordo, cx, base - 42, 1, 9);
  rett(ctx, C.bordo, cx - 5, base - 45, 11, 2);
  rett(ctx, C.bordo, cx - 2, base - 47, 5, 2);
}

function lucineSulGronda(ctx, x0, x1, y0) {
  const colori = [C.rosa, C.acqua, C.giallo, C.lilla];
  let prima = null;
  for (let x = x0, i = 0; x <= x1; x += 12, i++) {
    const y = y0 + (i % 2 ? 3 : 1);
    if (prima) linea(ctx, C.bordo, prima[0] + 1, prima[1], x + 1, y);
    rett(ctx, C.bordo, x, y, 3, 1);
    rett(ctx, colori[i % 4], x, y + 1, 3, 2);
    prima = [x, y];
  }
}

function finestraAccesa(ctx, x, y, w, h, sagoma) {
  bagliore(ctx, "#3a2a40", x + w / 2, y + h / 2, w, 0.9);
  rett(ctx, C.bordo, x - 2, y - 2, w + 4, h + 4);
  rett(ctx, C.vetro, x, y, w, h);
  if (sagoma) {
    // Qualcuno che balla alla festa, controluce.
    const sx = x + Math.round(w * 0.62);
    rett(ctx, C.brace, sx - 2, y + 5, 5, 5);
    rett(ctx, C.brace, sx - 3, y + 10, 7, h - 10);
    rett(ctx, C.brace, sx - 6, y + 9, 3, 2);
    rett(ctx, C.brace, sx + 4, y + 7, 3, 2);
  }
  rett(ctx, C.fiamma, x + Math.floor(w / 2) - 1, y, 2, h);
  rett(ctx, C.fiamma, x, y + Math.floor(h / 2) - 1, w, 2);
  rett(ctx, C.pietra, x - 3, y + h + 2, w + 6, 2);
  // Persiane.
  rett(ctx, C.tetto, x - 9, y - 2, 6, h + 4);
  rett(ctx, C.tetto, x + w + 3, y - 2, 6, h + 4);
  for (let j = y; j < y + h + 2; j += 3) {
    rett(ctx, C.tettoChiaro, x - 8, j, 4, 1);
    rett(ctx, C.tettoChiaro, x + w + 4, j, 4, 1);
  }
}

function portone(ctx, cx, cima, mezzo, fondo = PAVIMENTO, teschio = true) {
  const alto = fondo - cima;
  // Cornice di pietra, poi i due battenti di legno con le fasce di ferro.
  arco(ctx, C.ferroChiaro, cx, cima - 6, mezzo + 6, fondo);
  arco(ctx, C.ferro, cx, cima - 2, mezzo + 2, fondo);
  arco(ctx, C.legno, cx, cima, mezzo, fondo);
  for (let x = cx - mezzo + 5; x < cx + mezzo; x += 7) {
    for (let y = cima; y < fondo; y++) {
      const dy = cima + mezzo - y;
      if (dy > 0 && Math.abs(x - cx) > Math.sqrt(Math.max(0, mezzo * mezzo - dy * dy)) - 1) continue;
      rett(ctx, C.legnoScuro, x, y, 1, 1);
    }
  }
  rett(ctx, C.bordo, cx - 1, cima, 2, alto);
  for (const y of [cima + Math.round(alto * 0.38), fondo - Math.round(alto * 0.22)]) {
    rett(ctx, C.ferro, cx - mezzo, y, mezzo * 2, 3);
    for (let x = cx - mezzo + 3; x < cx + mezzo - 2; x += 5) rett(ctx, C.ferroChiaro, x, y + 1, 1, 1);
  }
  const ya = cima + Math.round(alto * 0.6);
  for (const ax of [cx - 6, cx + 3]) {
    rett(ctx, C.oroScuro, ax, ya, 3, 1);
    rett(ctx, C.oroScuro, ax - 1, ya + 1, 1, 3);
    rett(ctx, C.oroScuro, ax + 3, ya + 1, 1, 3);
    rett(ctx, C.oro, ax, ya + 4, 3, 1);
  }
  // La luce della festa filtra da sotto la porta.
  rett(ctx, C.vetro, cx - mezzo + 2, fondo - 1, mezzo * 2 - 4, 1);
  if (teschio) {
    const ty = cima - 7;
    rett(ctx, C.pietraChiara, cx - 4, ty - 1, 9, 7);
    rett(ctx, C.pietraChiara, cx - 3, ty + 6, 7, 2);
    rett(ctx, C.bordo, cx - 3, ty + 2, 2, 2);
    rett(ctx, C.bordo, cx + 2, ty + 2, 2, 2);
    rett(ctx, C.bordo, cx, ty + 5, 1, 1);
  }
}

function cartelloFesta(ctx, cx, y) {
  const w = 100, h = 25, x = cx - w / 2;
  rett(ctx, C.bordo, x, y, w, h);
  rett(ctx, C.legnoChiaro, x + 2, y + 2, w - 4, h - 4);
  rett(ctx, C.legnoLuce, x + 2, y + 2, w - 4, 2);
  const riga1 = "FESTA HALLOWEEN";
  scrivi(ctx, riga1, Math.round(cx - larghezzaTesto(riga1) / 2), y + 5, C.giallo);
  const parola = "GET", resto = "INVOLVED", inizio = Math.round(cx - larghezzaTesto(parola + resto) / 2);
  scrivi(ctx, parola, inizio, y + 15, C.bianco);
  scrivi(ctx, resto, inizio + parola.length * 6, y + 15, C.brand);
}

/** La facciata della casa della festa, con il portone d'ingresso al centro. */
function facciata(ctx) {
  const sx = 46, dx = 274, gronda = 34, base = 110;
  // Tetto a capanna con l'abbaino tondo.
  for (let i = 0; i < 32; i++) {
    const x0 = sx - 8 + i * 3.6, x1 = dx + 8 - i * 3.6;
    if (x1 <= x0) break;
    rett(ctx, i % 4 === 3 ? C.tettoChiaro : C.tetto, x0, gronda - i, x1 - x0, 1);
  }
  rett(ctx, C.bordo, sx - 10, gronda, dx - sx + 20, 2);
  // Il cartello sta sul tetto: più in basso lo taglierebbe il rompicapo (il braccio della bilancia).
  for (const x of [128, 190]) rett(ctx, C.bordo, x, 30, 2, 5);
  cartelloFesta(ctx, 160, 7);
  // Muro di mattoni.
  rett(ctx, C.muroCasa, sx, gronda + 2, dx - sx, base - gronda - 2);
  for (let y = gronda + 4; y < base; y += 6)
    for (let x = sx + 2 + (((y - gronda) / 6) % 2) * 6; x < dx - 2; x += 12) rett(ctx, C.ombraCasa, x, y, 10, 1);
  rett(ctx, C.ombraCasa, sx, base - 4, dx - sx, 4);
  // Le fondamenta di pietra fino al prato: senza, sotto la casa si vedeva il cielo.
  rett(ctx, C.ferro, sx - 3, base, dx - sx + 6, PAVIMENTO - base);
  rett(ctx, C.ferroChiaro, sx - 3, base, dx - sx + 6, 1);
  for (let x = sx + 4; x < dx; x += 14) rett(ctx, C.bordo, x, base + 2, 1, PAVIMENTO - base - 2);
  lucineSulGronda(ctx, sx, dx - 4, gronda + 2);
  // Finestre in alto e verso i bordi: in mezzo, all'altezza dei piatti, il giallo coprirebbe le zucche.
  finestraAccesa(ctx, 58, 42, 20, 20, true);
  finestraAccesa(ctx, 242, 42, 20, 20, false);
  // Pensilina sopra il portone, con le due colonne.
  rett(ctx, C.bordo, 120, 64, 80, 5);
  rett(ctx, C.tettoChiaro, 121, 64, 78, 2);
  for (const x of [125, 191]) {
    rett(ctx, C.pietra, x, 69, 4, base - 69);
    rett(ctx, C.pietraChiara, x, 69, 1, base - 69);
    rett(ctx, C.ferroChiaro, x - 1, 69, 6, 2);
  }
  portone(ctx, 160, 78, 18, base, true);
  // Tre scalini fino al prato.
  [[134, 186], [128, 192], [122, 198]].forEach(([a, b], i) => {
    const y = base + i * 3 - (i === 2 ? 0 : 0);
    rett(ctx, C.ferro, a, y, b - a, i === 2 ? PAVIMENTO - y : 3);
    rett(ctx, C.pietra, a, y, b - a, 1);
  });
}

function vignetta(ctx, forza = 1) {
  retino(ctx, C.bordo, 0, 0, LARGHEZZA, ALTEZZA, (x, y) => {
    const dx = (x - LARGHEZZA / 2) / (LARGHEZZA / 2), dy = (y - ALTEZZA / 2) / (ALTEZZA / 2);
    return forza * (Math.hypot(dx, dy * 0.75) - 0.95) * 2.4;
  });
}

/**
 * L'Ingresso, visto da fuori: la casa della festa dove finisce la fuga di Zucco. Il portone è chiuso
 * (si apre quando il rompicapo è risolto) e da sotto filtra la luce della festa.
 */
export function ingresso(ctx) {
  cielo(ctx, CIELO_NOTTE, PAVIMENTO);
  stelle(ctx, 90, 7);
  luna(ctx, 290, 26, 13);
  alberoSpoglio(ctx, 18, PAVIMENTO, 30, 41);
  alberoSpoglio(ctx, 302, PAVIMENTO, 26, 53);
  facciata(ctx);
  siepe(ctx, 0, 44, PAVIMENTO, 3);
  siepe(ctx, 276, 44, PAVIMENTO, 9);
  prato(ctx, 5);
  vialetto(ctx, 122, 198, 92, 228);
  cancellata(ctx, 0, 40, PAVIMENTO + 4);
  cancellata(ctx, 282, LARGHEZZA, PAVIMENTO + 4);
  // Le lanterne vicino alla cancellata: arancioni come sono, fra i piatti sembrerebbero zucche.
  lanterna(ctx, 30, PAVIMENTO + 2);
  lanterna(ctx, 290, PAVIMENTO + 2);
  vignetta(ctx);
}

// ── Il Cancello ──

function colline(ctx, colore, base, ampiezza, seme) {
  const rng = casuale(seme);
  const f1 = rng() * 6, f2 = rng() * 6;
  for (let x = 0; x < LARGHEZZA; x++) {
    const y = Math.round(base - Math.sin(x / 53 + f1) * ampiezza - Math.sin(x / 19 + f2) * ampiezza * 0.3 - ampiezza);
    rett(ctx, colore, x, y, 1, PAVIMENTO - y);
  }
}

function casaLontana(ctx, cx, base) {
  const w = 60, h = 26, x = cx - w / 2;
  bagliore(ctx, "#1d2350", cx, base - 16, 46, 0.9);
  for (let i = 0; i < 14; i++) rett(ctx, C.tetto, x - 4 + i * 2.6, base - h - i, w + 8 - i * 5.2, 1);
  rett(ctx, C.muroCasa, x, base - h, w, h);
  rett(ctx, C.bordo, cx - 14, base - h - 11, 28, 7);
  rett(ctx, C.legnoChiaro, cx - 13, base - h - 10, 26, 5);
  for (let i = 0; i < 8; i++) rett(ctx, C.giallo, cx - 11 + i * 3, base - h - 8, 2, 1);
  for (let i = 0; i < 12; i++) rett(ctx, i % 2 ? C.rosa : C.acqua, x + 2 + i * 5, base - h + 1, 1, 1);
  for (const fx of [x + 7, x + w - 15]) {
    rett(ctx, C.bordo, fx - 1, base - h + 5, 10, 10);
    rett(ctx, C.vetro, fx, base - h + 6, 8, 8);
    rett(ctx, C.fiamma, fx + 3, base - h + 6, 1, 8);
  }
  rett(ctx, C.bordo, cx - 5, base - 14, 10, 14);
  rett(ctx, C.fiamma, cx - 4, base - 13, 8, 13);
  rett(ctx, C.vetro, cx - 2, base - 11, 4, 11);
}

function pilastro(ctx, x, w, cima, base) {
  rett(ctx, C.ferro, x, cima, w, base - cima);
  for (let y = cima, r = 0; y < base; y += 7, r++) {
    rett(ctx, C.bordo, x, y + 6, w, 1);
    rett(ctx, C.bordo, x + (r % 2 ? Math.floor(w / 2) : 0), y, 1, 6);
  }
  rett(ctx, C.ferroChiaro, x, cima, 2, base - cima);
  rett(ctx, C.pietra, x - 3, cima - 4, w + 6, 4);
  rett(ctx, C.pietraChiara, x - 3, cima - 4, w + 6, 1);
  // Una lanterna sopra ogni pilastro.
  const cx = x + Math.floor(w / 2);
  bagliore(ctx, "#3a2a3a", cx, cima - 12, 20, 1);
  rett(ctx, C.bordo, cx - 4, cima - 18, 9, 13);
  rett(ctx, C.fiammaChiara, cx - 3, cima - 17, 7, 10);
  rett(ctx, C.fiamma, cx - 3, cima - 12, 7, 5);
  rett(ctx, C.bordo, cx, cima - 17, 1, 10);
  rett(ctx, C.bordo, cx - 5, cima - 20, 11, 2);
}

function muretto(ctx, x0, x1, cima) {
  rett(ctx, C.ferro, x0, cima, x1 - x0, PAVIMENTO - cima);
  for (let y = cima, r = 0; y < PAVIMENTO; y += 7, r++)
    for (let x = x0 + (r % 2 ? 6 : 0); x < x1; x += 12) {
      rett(ctx, C.bordo, x, y, 1, 6);
      rett(ctx, C.bordo, x0, y + 6, x1 - x0, 1);
    }
  rett(ctx, C.pietra, x0, cima, x1 - x0, 2);
  // Punte di ferro e un po' d'edera.
  for (let x = x0 + 2; x < x1; x += 6) rett(ctx, C.bordo, x, cima - 6, 1, 6);
  const rng = casuale(x0 + 3);
  for (let i = 0; i < (x1 - x0) / 3; i++) {
    const ex = x0 + Math.floor(rng() * (x1 - x0)), ey = cima + Math.floor(rng() * (PAVIMENTO - cima - 4));
    rett(ctx, rng() > 0.5 ? C.erbaScura : C.siepe, ex, ey, 2, 2);
  }
}

function cancelloDiFerro(ctx, x0, x1, cima, base) {
  const cx = (x0 + x1) / 2, mezzo = (x1 - x0) / 2;
  for (let x = x0 + 2; x < x1 - 1; x += 5) {
    const k = Math.abs(x + 1 - cx) / mezzo;
    const top = cima + Math.round(k * k * 16);
    rett(ctx, C.bordo, x, top, 2, base - top);
    rett(ctx, C.ferro, x, top, 1, base - top);
    rett(ctx, C.bordo, x - 1, top - 2, 4, 2);
    rett(ctx, C.bordo, x, top - 4, 2, 2);
  }
  for (const y of [cima + 24, base - 34, base - 10]) {
    rett(ctx, C.bordo, x0, y, x1 - x0, 3);
    rett(ctx, C.ferro, x0, y, x1 - x0, 1);
  }
  // Riccioli fra le due traverse alte.
  for (let x = x0 + 8; x < x1 - 8; x += 16) {
    retino(ctx, C.bordo, x - 5, cima + 28, 11, 11, (px, py) => Math.abs(Math.hypot(px - x, py - cima - 33) - 4) < 0.8 ? 1 : 0);
  }
  rett(ctx, C.bordo, cx - 1, cima - 4, 2, base - cima + 4);
  // Catena e lucchetto.
  const yc = base - 48;
  for (let i = 0; i < 7; i++) rett(ctx, i % 2 ? C.ferroChiaro : C.pietra, cx - 9 + i * 3, yc + (i % 2), 2, 2);
  rett(ctx, C.oroScuro, cx - 2, yc + 2, 1, 4);
  rett(ctx, C.oroScuro, cx + 2, yc + 2, 1, 4);
  rett(ctx, C.oroScuro, cx - 2, yc + 1, 5, 1);
  rett(ctx, C.oro, cx - 4, yc + 5, 9, 7);
  rett(ctx, C.giallo, cx - 4, yc + 5, 9, 1);
  rett(ctx, C.bordo, cx, yc + 7, 1, 3);
}

function nebbia(ctx, da, a) {
  const rng = casuale(77);
  const onde = [rng() * 6, rng() * 6];
  retino(ctx, "#2a3566", 0, da, LARGHEZZA, a - da, (x, y) => {
    const centro = (da + a) / 2 + Math.sin(x / 23 + onde[0]) * 2 + Math.sin(x / 9 + onde[1]);
    return 0.75 * (1 - Math.abs(y - centro) / ((a - da) / 2));
  });
}

/** Il Cancello: il cancello di ferro chiuso, la nebbia, e in fondo la casa della festa. */
export function cancello(ctx) {
  cielo(ctx, CIELO_NOTTE, PAVIMENTO);
  stelle(ctx, 80, 13);
  luna(ctx, 46, 30, 15);
  colline(ctx, "#0d1536", 96, 6, 4);
  colline(ctx, "#0a0f28", 104, 4, 8);
  alberoSpoglio(ctx, 70, 100, 18, 61);
  alberoSpoglio(ctx, 252, 100, 16, 67);
  casaLontana(ctx, 160, 100);
  rett(ctx, C.siepe, 0, 100, LARGHEZZA, PAVIMENTO - 100);
  for (let y = 100; y < PAVIMENTO; y++) rett(ctx, C.ferro, 156 - (y - 100) * 1.2, y, 8 + (y - 100) * 2.4, 1);
  nebbia(ctx, 92, 116);
  alberoSpoglio(ctx, 10, PAVIMENTO, 34, 71);
  alberoSpoglio(ctx, 312, PAVIMENTO, 30, 79);
  muretto(ctx, 0, 92, 88);
  muretto(ctx, 228, LARGHEZZA, 88);
  cancelloDiFerro(ctx, 108, 212, 52, PAVIMENTO);
  pilastro(ctx, 92, 16, 44, PAVIMENTO);
  pilastro(ctx, 212, 16, 44, PAVIMENTO);
  prato(ctx, 15);
  vialetto(ctx, 128, 192, 100, 220);
  vignetta(ctx);
}

// ── Interni ──

function muroDiMattoni(ctx, fino, seme, { base = C.muro, malta = C.mattone, caldo = C.muroCaldo, alto = 8, largo = 16 } = {}) {
  const rng = casuale(seme);
  rett(ctx, base, 0, 0, LARGHEZZA, fino);
  for (let r = 0; r * alto < fino; r++) {
    const y = r * alto;
    for (let x = r % 2 ? -largo / 2 : 0; x < LARGHEZZA; x += largo) {
      if (rng() < 0.18) rett(ctx, caldo, x + 1, y + 1, largo - 2, alto - 3);
      rett(ctx, malta, x + largo - 1, y, 1, alto - 1);
    }
    rett(ctx, malta, 0, y + alto - 1, LARGHEZZA, 1);
  }
}

function trave(ctx, y, h = 7) {
  rett(ctx, C.legnoScuro, 0, y, LARGHEZZA, h);
  rett(ctx, C.legno, 0, y + h, LARGHEZZA, 2);
  for (let x = 10; x < LARGHEZZA; x += 40) rett(ctx, C.ferroChiaro, x, y + 3, 2, 2);
}

function ragnatela(ctx, x, y, verso, lungo = 28) {
  const raggi = [0, 0.33, 0.66, 1].map((k) => (k * Math.PI) / 2);
  const punto = (a, d) => [x + verso * Math.cos(a) * d, y + Math.sin(a) * d];
  for (const a of raggi) linea(ctx, C.pietra, x, y, ...punto(a, lungo));
  for (const d of [lungo * 0.32, lungo * 0.6, lungo * 0.9])
    for (let i = 0; i < raggi.length - 1; i++) linea(ctx, C.pietra, ...punto(raggi[i], d - 1), ...punto(raggi[i + 1], d));
}

function lucine(ctx, y0) {
  const colori = [C.rosa, C.acqua, C.giallo, C.lilla];
  let prima = null;
  for (let i = 0; i < 20; i++) {
    const x = 6 + i * 16;
    const y = y0 + Math.round(Math.abs(Math.sin(i * 0.7)) * 5);
    if (prima) linea(ctx, C.bordo, prima[0] + 1, prima[1], x + 1, y);
    rett(ctx, C.bordo, x, y, 3, 1);
    rett(ctx, colori[i % 4], x, y + 1, 3, 3);
    prima = [x, y];
  }
}

function torcia(ctx, cx, cy) {
  bagliore(ctx, C.muroCaldo, cx, cy, 30, 1);
  bagliore(ctx, C.muroAcceso, cx, cy, 15, 1);
  rett(ctx, C.ferro, cx - 1, cy + 4, 3, 12);
  rett(ctx, C.ferroChiaro, cx - 3, cy + 2, 7, 3);
  rett(ctx, C.brace, cx - 2, cy - 5, 5, 7);
  rett(ctx, C.fiamma, cx - 1, cy - 7, 3, 8);
  rett(ctx, C.fiammaChiara, cx, cy - 4, 1, 4);
  rett(ctx, C.luna, cx, cy - 8, 1, 2);
}

function pavimentoAPiastrelle(ctx, [a, b], accesa = null) {
  const altezze = [5, 7, 9, 11, 13, 17];
  const larghezze = [12, 15, 18, 22, 26, 32];
  let y = PAVIMENTO;
  altezze.forEach((h, r) => {
    const w = larghezze[r];
    const primo = LARGHEZZA / 2 - Math.ceil(LARGHEZZA / 2 / w) * w;
    for (let x = primo, i = 0; x < LARGHEZZA; x += w, i++) {
      rett(ctx, (accesa && accesa(r, i)) || ((i + r) % 2 ? b : a), x, y, w, h);
      rett(ctx, C.bordo, x, y, 1, h);
    }
    rett(ctx, C.bordo, 0, y, LARGHEZZA, 1);
    y += h;
  });
}

function assiDiLegno(ctx, seme) {
  const rng = casuale(seme);
  const altezze = [5, 6, 7, 9, 11, 13, 11];
  let y = PAVIMENTO;
  altezze.forEach((h, r) => {
    rett(ctx, r % 2 ? C.legno : C.legnoScuro, 0, y, LARGHEZZA, h);
    rett(ctx, C.bordo, 0, y, LARGHEZZA, 1);
    for (let x = Math.floor(rng() * 40); x < LARGHEZZA; x += 40 + Math.floor(rng() * 50)) rett(ctx, C.bordo, x, y, 1, h);
    if (rng() > 0.4) rett(ctx, C.bordo, Math.floor(rng() * LARGHEZZA), y + Math.floor(h / 2), 2, 1);
    y += h;
  });
}

function caramellaDorata(ctx, x, y) {
  rett(ctx, C.oroScuro, x, y, 1, 5);
  rett(ctx, C.oroScuro, x + 1, y + 1, 1, 3);
  rett(ctx, C.oroScuro, x + 10, y, 1, 5);
  rett(ctx, C.oroScuro, x + 9, y + 1, 1, 3);
  rett(ctx, C.oroScuro, x + 3, y, 5, 5);
  rett(ctx, C.oro, x + 2, y + 1, 7, 3);
  rett(ctx, C.oro, x + 3, y, 5, 1);
  rett(ctx, C.giallo, x + 4, y + 1, 2, 1);
}

function moneta(ctx, x, y) {
  rett(ctx, C.oroScuro, x, y + 1, 4, 1);
  rett(ctx, C.oro, x, y, 4, 1);
}

// ── Il Deposito ──

function telo(ctx, cx, cima, fondo, seme) {
  const rng = casuale(seme);
  const scuro = "#4f4d6a", chiaro = "#6f7292";
  linea(ctx, C.bordo, cx, cima - 4, cx, cima);
  for (let y = cima; y < fondo; y++) {
    const k = (y - cima) / (fondo - cima);
    const mezzo = Math.round(3 + Math.min(1, k * 4) * 6 + k * 3);
    rett(ctx, chiaro, cx - mezzo, y, mezzo * 2, 1);
    rett(ctx, scuro, cx - mezzo, y, 1, 1);
    rett(ctx, scuro, cx + mezzo - 1, y, 1, 1);
    if (k > 0.25) {
      rett(ctx, scuro, cx - 3, y, 1, 1);
      rett(ctx, scuro, cx + 3, y, 1, 1);
    }
  }
  for (let x = -12; x <= 12; x++) {
    const giu = Math.floor(rng() * 4);
    if (Math.abs(x) <= 12) rett(ctx, chiaro, cx + x, fondo, 1, giu);
  }
  rett(ctx, C.pietra, cx - 1, cima + 1, 2, 2);
}

function appendiabiti(ctx) {
  rett(ctx, C.bordo, 10, 36, 2, PAVIMENTO - 36);
  rett(ctx, C.bordo, 104, 36, 2, PAVIMENTO - 36);
  rett(ctx, C.ferro, 8, 34, 100, 3);
  rett(ctx, C.ferroChiaro, 8, 34, 100, 1);
  [[24, 74, 3], [46, 88, 5], [68, 70, 7], [90, 96, 9]].forEach(([cx, fondo, seme]) => telo(ctx, cx, 42, fondo, seme));
  // Le etichette appese, senza numeri: le cifre sono del rompicapo delle ossa.
  for (const x of [35, 57, 79]) {
    linea(ctx, C.pietra, x, 37, x, 42);
    rett(ctx, C.tappeto, x - 2, 42, 5, 4);
  }
}

function scaffale(ctx, x0, x1, cima) {
  rett(ctx, C.legnoScuro, x0, cima, 3, PAVIMENTO - cima);
  rett(ctx, C.legnoScuro, x1 - 3, cima, 3, PAVIMENTO - cima);
  const ripiani = [cima + 18, cima + 44, cima + 70];
  for (const y of ripiani) {
    rett(ctx, C.legno, x0, y, x1 - x0, 3);
    rett(ctx, C.legnoChiaro, x0, y, x1 - x0, 1);
  }
  const cassa = (x, y, w, h) => {
    rett(ctx, C.bordo, x - 1, y - h - 1, w + 2, h + 1);
    rett(ctx, C.legnoChiaro, x, y - h, w, h);
    linea(ctx, C.legno, x, y - h, x + w - 1, y - 1);
    linea(ctx, C.legno, x + w - 1, y - h, x, y - 1);
  };
  const barattolo = (x, y, liquido) => {
    rett(ctx, C.bordo, x - 1, y - 11, 9, 11);
    rett(ctx, "#26324a", x, y - 10, 7, 10);
    rett(ctx, liquido, x, y - 5, 7, 5);
    rett(ctx, C.notteChiara, x + 1, y - 9, 1, 3);
    rett(ctx, C.ferroChiaro, x, y - 12, 7, 2);
  };
  cassa(x0 + 6, ripiani[0], 18, 12);
  barattolo(x0 + 30, ripiani[0], "#3d5a2e");
  barattolo(x0 + 42, ripiani[0], "#5e3c44");
  cassa(x0 + 56, ripiani[0], 22, 14);
  barattolo(x0 + 8, ripiani[1], "#5e3c44");
  rett(ctx, C.bordo, x0 + 22, ripiani[1] - 9, 10, 9);
  rett(ctx, C.pietraChiara, x0 + 23, ripiani[1] - 8, 8, 8);
  rett(ctx, C.pietra, x0 + 23, ripiani[1] - 3, 8, 1);
  rett(ctx, C.fiamma, x0 + 26, ripiani[1] - 12, 2, 3);
  bagliore(ctx, "#2a2030", x0 + 27, ripiani[1] - 12, 9, 0.8);
  cassa(x0 + 40, ripiani[1], 30, 18);
  cassa(x0 + 6, ripiani[2], 26, 16);
  cassa(x0 + 30, ripiani[2], 14, 10);
  barattolo(x0 + 52, ripiani[2], "#3d5a2e");
  barattolo(x0 + 64, ripiani[2], "#26324a");
  ragnatela(ctx, x1 - 4, ripiani[0] + 3, -1, 14);
}

/** Il Deposito: il guardaroba abbandonato, con una sola lampadina accesa sul centro della stanza. */
export function deposito(ctx) {
  muroDiMattoni(ctx, PAVIMENTO, 61, { base: "#141018", malta: "#1c1622", caldo: "#18131e", alto: 10, largo: 22 });
  trave(ctx, 0);
  // Il cono di luce della lampadina scende sul centro: lì il rompicapo appoggia le ossa.
  retino(ctx, "#241c2a", 40, 30, 240, PAVIMENTO - 30, (x, y) => {
    const mezzo = 8 + ((y - 30) / (PAVIMENTO - 30)) * 70;
    return 0.9 * (1 - Math.abs(x - 160) / mezzo);
  });
  appendiabiti(ctx);
  scaffale(ctx, 216, 306, 24);
  ragnatela(ctx, 0, 9, 1);
  ragnatela(ctx, LARGHEZZA - 1, 9, -1);
  assiDiLegno(ctx, 19);
  retino(ctx, "#4e3628", 60, PAVIMENTO, 200, ALTEZZA - PAVIMENTO, (x, y) => 0.9 * (1 - Math.hypot((x - 160) / 90, (y - 150) / 26)));
  // Filo e lampadina.
  rett(ctx, C.bordo, 160, 9, 1, 18);
  rett(ctx, C.ferro, 158, 26, 5, 3);
  bagliore(ctx, "#3a2c34", 160, 32, 10, 1);
  rett(ctx, C.fiammaChiara, 158, 29, 5, 5);
  rett(ctx, C.luna, 159, 30, 2, 2);
  // Pulviscolo nel fascio di luce.
  const rng = casuale(5);
  for (let i = 0; i < 18; i++) rett(ctx, "#4a3a44", 130 + Math.floor(rng() * 60), 40 + Math.floor(rng() * 70), 1, 1);
  vignetta(ctx, 1.4);
}

// ── La Sala principale ──

function tenda(ctx, x0, w, verso) {
  for (let x = 0; x < w; x++) {
    const piega = Math.sin((x / w) * Math.PI * 3);
    rett(ctx, piega > 0.4 ? C.viola : piega > -0.3 ? C.violaScuro : "#2a1c50", x0 + x, 0, 1, PAVIMENTO + 8 - Math.round(x * 0.2 * (verso > 0 ? 1 : 0)));
  }
  const xc = verso > 0 ? x0 + w - 6 : x0 + 2;
  rett(ctx, C.oroScuro, xc, 60, 5, 4);
  rett(ctx, C.oro, xc, 60, 5, 1);
}

function palla(ctx, cx, cy, r) {
  rett(ctx, C.bordo, cx, 0, 1, cy - r);
  for (let y = -r; y <= r; y++)
    for (let x = -r; x <= r; x++) {
      if (x * x + y * y > r * r) continue;
      const c = (Math.floor((x + r) / 2) + Math.floor((y + r) / 2)) % 2 ? C.pietra : C.pietraChiara;
      rett(ctx, x + y > r * 0.6 ? C.ferroChiaro : c, cx + x, cy + y, 1, 1);
    }
}

function fascio(ctx, colore, x0, y0, x1, larghezza, forza) {
  retino(ctx, colore, 0, y0, LARGHEZZA, PAVIMENTO - y0, (x, y) => {
    const k = (y - y0) / (PAVIMENTO - y0);
    const cx = x0 + (x1 - x0) * k, mezzo = 1 + larghezza * k;
    return forza * (1 - Math.abs(x - cx) / mezzo);
  });
}

function portaDelBar(ctx, cx) {
  arco(ctx, C.ferroChiaro, cx, 46, 22, PAVIMENTO);
  arco(ctx, "#0f2a2e", cx, 50, 18, PAVIMENTO);
  bagliore(ctx, "#1f4a4a", cx, 96, 22, 1);
  // Dentro si intravede il bancone.
  rett(ctx, C.legno, cx - 18, 96, 36, PAVIMENTO - 96);
  rett(ctx, C.legnoChiaro, cx - 18, 96, 36, 2);
  for (let i = 0; i < 5; i++) rett(ctx, [C.acqua, C.rosa, C.giallo, C.lilla, C.acqua][i], cx - 12 + i * 6, 84, 3, 8);
  // Insegna al neon.
  bagliore(ctx, "#4a1f3a", cx, 30, 20, 1);
  scrivi(ctx, "BAR", Math.round(cx - larghezzaTesto("BAR", 2) / 2), 22, C.rosa, "#5a1f3a", 2);
}

function consolle(ctx, x0, x1) {
  rett(ctx, C.legnoScuro, x0, 98, x1 - x0, PAVIMENTO - 98);
  rett(ctx, C.legno, x0, 98, x1 - x0, 2);
  const x = x0 + 8, w = x1 - x0 - 16;
  rett(ctx, C.bordo, x, 82, w, 16);
  rett(ctx, C.ferro, x + 1, 83, w - 2, 3);
  for (const px of [x + 10, x + w - 10]) {
    rett(ctx, C.bordo, px - 6, 79, 12, 4);
    rett(ctx, C.ferroChiaro, px - 5, 79, 10, 2);
    rett(ctx, C.bordo, px - 1, 79, 2, 1);
  }
  const led = [C.rosa, C.acqua, C.giallo, C.lilla, C.acqua, C.rosa];
  led.forEach((c, i) => rett(ctx, c, x + w / 2 - 9 + i * 3, 81, 2, 2));
  scrivi(ctx, "DJ", Math.round(x + w / 2 - larghezzaTesto("DJ") / 2), 88, C.lilla, null);
  bagliore(ctx, "#2a1f4a", x + w / 2, 70, 22, 0.8);
}

function sagomeCheBallano(ctx, x0, x1, seme) {
  const rng = casuale(seme);
  for (let x = x0; x < x1; x += 13) {
    const alto = 150 + Math.floor(rng() * 10);
    const c = "#0e0916";
    rett(ctx, c, x, alto, 10, ALTEZZA - alto);
    rett(ctx, c, x + 2, alto - 8, 6, 7);
    if (rng() > 0.4) {
      linea(ctx, c, x, alto + 2, x - 4, alto - 9);
      linea(ctx, c, x + 9, alto + 2, x + 13, alto - 9);
    }
  }
}

/** La Sala principale (sala 1): la pista, la palla stroboscopica, la porta del bar e la consolle del DJ. */
export function salaPrincipale(ctx) {
  muroDiMattoni(ctx, PAVIMENTO, 71);
  rett(ctx, C.bordo, 0, 0, LARGHEZZA, 5);
  fascio(ctx, "#4a1f3a", 160, 16, 70, 26, 0.55);
  fascio(ctx, "#1f4a4a", 160, 16, 130, 22, 0.5);
  fascio(ctx, "#4a4520", 160, 16, 205, 22, 0.45);
  fascio(ctx, "#33255a", 160, 16, 262, 26, 0.55);
  const rng = casuale(33);
  for (let i = 0; i < 46; i++) {
    const c = [C.rosa, C.acqua, C.giallo, C.lilla][i % 4];
    rett(ctx, c, Math.floor(rng() * LARGHEZZA), 10 + Math.floor(rng() * 90), rng() > 0.7 ? 2 : 1, 1);
  }
  lucine(ctx, 6);
  portaDelBar(ctx, 58);
  consolle(ctx, 218, 296);
  tenda(ctx, 0, 22, 1);
  tenda(ctx, 298, 22, -1);
  palla(ctx, 160, 16, 7);
  const accese = [C.pavimento, "#5a2a4a", "#1f4a4a", "#4a2f6a"];
  pavimentoAPiastrelle(ctx, ["#2a1838", "#3a2148"], (r, i) => ((r * 7 + i * 3) % 11 === 0 ? accese[(r + i) % 4] : null));
  sagomeCheBallano(ctx, -4, 40, 3);
  sagomeCheBallano(ctx, 282, 330, 7);
  vignetta(ctx);
}

// ── La Sala Bar ──

const BOTTIGLIE = ["#c8242c", "#2d5a2e", "#f0b84a", "#7b55c4", "#8a3a1e", "#2a8cff"];

function ripianoDiBottiglie(ctx, x0, x1, y, seme) {
  rett(ctx, C.legnoChiaro, x0, y, x1 - x0, 3);
  rett(ctx, C.legnoLuce, x0, y, x1 - x0, 1);
  const rng = casuale(seme);
  for (let x = x0 + 4; x < x1 - 8; x += 11) {
    const c = BOTTIGLIE[Math.floor(rng() * BOTTIGLIE.length)];
    const alto = 14 + Math.floor(rng() * 6);
    rett(ctx, C.bordo, x - 1, y - alto - 1, 8, alto + 1);
    rett(ctx, c, x, y - alto + 4, 6, alto - 4);
    rett(ctx, c, x + 2, y - alto, 2, 4);
    rett(ctx, C.pietraChiara, x + 1, y - alto + 6, 1, 4);
  }
}

function lampadaAppesa(ctx, cx, fino) {
  rett(ctx, C.bordo, cx, 0, 1, fino);
  rett(ctx, C.bordo, cx - 6, fino, 13, 5);
  rett(ctx, C.ferro, cx - 5, fino, 11, 3);
  rett(ctx, C.fiammaChiara, cx - 3, fino + 5, 7, 1);
}

function scheletroBarista(ctx, cx, base) {
  rett(ctx, C.bordo, cx - 9, base - 30, 18, 30);
  rett(ctx, C.pietraChiara, cx - 2, base - 30, 4, 10);
  rett(ctx, C.tappetoChiaro, cx - 3, base - 30, 6, 2);
  rett(ctx, C.pietraChiara, cx - 5, base - 42, 10, 11);
  rett(ctx, C.pietraChiara, cx - 4, base - 31, 8, 2);
  rett(ctx, C.bordo, cx - 3, base - 38, 2, 3);
  rett(ctx, C.bordo, cx + 1, base - 38, 2, 3);
  rett(ctx, C.bordo, cx, base - 34, 1, 1);
  for (let i = 0; i < 4; i++) rett(ctx, C.bordo, cx - 3 + i * 2, base - 32, 1, 2);
  rett(ctx, C.pietraChiara, cx - 12, base - 26, 3, 14);
  rett(ctx, C.pietraChiara, cx + 9, base - 26, 3, 14);
}

/** La Sala Bar (dentro la sala principale): bottiglie, insegna al neon, lo scheletro barista e il bancone. */
export function salaBar(ctx) {
  rett(ctx, "#15101e", 0, 0, LARGHEZZA, PAVIMENTO);
  for (let x = 4; x < LARGHEZZA; x += 10) rett(ctx, "#1b1528", x, 0, 2, PAVIMENTO);
  rett(ctx, C.legnoScuro, 0, 70, LARGHEZZA, PAVIMENTO - 70);
  for (let x = 0; x < LARGHEZZA; x += 20) rett(ctx, C.bordo, x, 70, 1, PAVIMENTO - 70);
  rett(ctx, C.legno, 0, 70, LARGHEZZA, 2);
  // Specchio al centro, dietro il bancone: scuro e calmo, lì sopra vanno shaker e bicchieri.
  rett(ctx, C.legnoChiaro, 120, 46, 80, 50);
  rett(ctx, "#121a2a", 123, 49, 74, 44);
  for (let i = 0; i < 3; i++) linea(ctx, "#1d2a40", 130 + i * 20, 92, 146 + i * 20, 50);
  // Bottiglie sui due lati.
  for (const [x0, x1, s] of [[10, 112, 3], [208, 310, 9]]) {
    ripianoDiBottiglie(ctx, x0, x1, 34, s);
    ripianoDiBottiglie(ctx, x0, x1, 60, s + 1);
  }
  // Insegna al neon: il bicchiere azzurro dell'Angelo Azzurro e la scritta.
  bagliore(ctx, "#123a3e", 160, 24, 26, 1);
  linea(ctx, C.acqua, 132, 12, 146, 12);
  linea(ctx, C.acqua, 132, 12, 139, 21);
  linea(ctx, C.acqua, 146, 12, 139, 21);
  linea(ctx, C.acqua, 139, 21, 139, 30);
  linea(ctx, C.acqua, 135, 30, 143, 30);
  rett(ctx, C.giallo, 143, 10, 2, 2);
  scrivi(ctx, "BAR", 152, 16, C.rosa, "#5a1f3a", 2);
  scheletroBarista(ctx, 256, 112);
  // Solo la lampada centrale: quelle ai lati finivano sopra le bottiglie e sembravano blocchi neri.
  lampadaAppesa(ctx, 160, 4);
  // Il bancone: il piano è il «pavimento» del rompicapo, i bicchieri ci stanno sopra.
  bagliore(ctx, "#3a2a20", 160, 118, 60, 0.9);
  rett(ctx, C.legnoChiaro, 0, PAVIMENTO - 6, LARGHEZZA, 6);
  rett(ctx, C.legnoLuce, 0, PAVIMENTO - 6, LARGHEZZA, 1);
  retino(ctx, "#8a6a50", 60, PAVIMENTO - 6, 200, 6, (x) => 0.8 * (1 - Math.abs(x - 160) / 100));
  rett(ctx, C.legno, 0, PAVIMENTO, LARGHEZZA, 44);
  for (let x = 16; x < LARGHEZZA; x += 32) {
    rett(ctx, C.legnoScuro, x, PAVIMENTO + 6, 26, 30);
    rett(ctx, C.legnoChiaro, x, PAVIMENTO + 6, 26, 1);
  }
  rett(ctx, C.oroScuro, 0, PAVIMENTO + 39, LARGHEZZA, 2);
  rett(ctx, C.oro, 0, PAVIMENTO + 39, LARGHEZZA, 1);
  rett(ctx, "#1c1228", 0, PAVIMENTO + 44, LARGHEZZA, ALTEZZA - PAVIMENTO - 44);
  for (let x = 0; x < LARGHEZZA; x += 16) rett(ctx, "#241838", x, PAVIMENTO + 44, 8, ALTEZZA - PAVIMENTO - 44);
  // Sgabelli ai lati.
  for (const x of [26, 294]) {
    rett(ctx, C.tappeto, x - 9, 146, 18, 5);
    rett(ctx, C.tappetoChiaro, x - 9, 146, 18, 1);
    rett(ctx, C.ferro, x - 1, 151, 2, ALTEZZA - 151);
  }
  vignetta(ctx);
}

// ── L'Area Fumatori ──

function staccionata(ctx, x0, x1, alto) {
  const cima = PAVIMENTO - alto;
  for (let x = x0; x < x1; x += 7) {
    rett(ctx, C.legnoScuro, x, cima + 2, 6, alto - 2);
    rett(ctx, C.legnoScuro, x + 1, cima + 1, 4, 1);
    rett(ctx, C.legnoScuro, x + 2, cima, 2, 1);
    rett(ctx, C.legno, x, cima + 2, 1, alto - 2);
  }
  for (const y of [cima + 7, PAVIMENTO - 8]) {
    rett(ctx, C.legno, x0, y, x1 - x0, 3);
    rett(ctx, C.legnoChiaro, x0, y, x1 - x0, 1);
  }
}

/** La tettoia di legno: la trave in alto e i due pali, con le lucine appese. */
function tettoia(ctx, x0, x1, y) {
  for (const x of [x0, x1 - 6]) {
    rett(ctx, C.legnoScuro, x, y, 6, PAVIMENTO - y);
    rett(ctx, C.legno, x + 1, y, 1, PAVIMENTO - y);
  }
  rett(ctx, C.legnoScuro, 0, y - 8, LARGHEZZA, 8);
  rett(ctx, C.legno, 0, y, LARGHEZZA, 2);
  for (let x = 12; x < LARGHEZZA; x += 30) {
    rett(ctx, C.legno, x, y - 7, 5, 5);
    rett(ctx, C.legnoLuce, x, y - 7, 5, 1);
  }
}

function insegnaFumatori(ctx, cx, y) {
  const testo = "FUMATORI", w = larghezzaTesto(testo) + 8;
  bagliore(ctx, "#123a3e", cx, y + 5, 30, 1);
  rett(ctx, C.bordo, cx - w / 2, y - 3, w, 13);
  rett(ctx, "#0f2a2e", cx - w / 2 + 1, y - 2, w - 2, 11);
  scrivi(ctx, testo, Math.round(cx - larghezzaTesto(testo) / 2), y, C.acqua, "#0f4a4a");
}

/** La porta sul retro della sala: da qui si esce a fumare, e da sotto filtra la musica della festa. */
function portaSulRetro(ctx, x, w, cima) {
  rett(ctx, C.ferro, x - 3, cima - 3, w + 6, PAVIMENTO - cima + 3);
  rett(ctx, C.legnoScuro, x, cima, w, PAVIMENTO - cima);
  rett(ctx, C.legno, x + 3, cima + 4, w - 6, 26);
  rett(ctx, C.legno, x + 3, cima + 36, w - 6, PAVIMENTO - cima - 40);
  rett(ctx, C.oro, x + w - 6, cima + 34, 3, 2);
  rett(ctx, C.vetro, x + 2, PAVIMENTO - 1, w - 4, 1);
}

/** Il fungo riscaldante: l'unica luce calda dell'area, sul bordo. */
function fungoRiscaldante(ctx, cx) {
  bagliore(ctx, "#3a2228", cx, 56, 40, 1);
  bagliore(ctx, "#5a3022", cx, 56, 18, 1);
  rett(ctx, C.bordo, cx - 14, 30, 28, 4);
  rett(ctx, C.ferroChiaro, cx - 13, 30, 26, 2);
  for (let i = 0; i < 4; i++) rett(ctx, C.ferro, cx - 10 + i * 2, 34 + i, 20 - i * 4, 1);
  rett(ctx, C.bordo, cx - 5, 38, 10, 20);
  for (let y = 39; y < 57; y++) rett(ctx, y % 3 ? C.brace : C.fiamma, cx - 4, y, 8, 1);
  rett(ctx, C.fiammaChiara, cx - 1, 41, 2, 14);
  rett(ctx, C.bordo, cx - 2, 58, 4, PAVIMENTO - 64);
  rett(ctx, C.ferro, cx - 1, 58, 1, PAVIMENTO - 64);
  rett(ctx, C.bordo, cx - 10, PAVIMENTO - 6, 20, 6);
  rett(ctx, C.ferroChiaro, cx - 9, PAVIMENTO - 6, 18, 1);
}

/** La colonna posacenere: dal fumo che sale si forma una faccia. */
function posacenere(ctx, cx) {
  const cima = PAVIMENTO - 30;
  rett(ctx, C.bordo, cx - 6, cima - 1, 12, 31);
  rett(ctx, C.ferro, cx - 5, cima, 10, 30);
  rett(ctx, C.ferroChiaro, cx - 4, cima, 2, 30);
  rett(ctx, C.pietraChiara, cx - 5, cima, 10, 2);
  rett(ctx, C.bianco, cx - 3, cima - 1, 3, 1);
  rett(ctx, C.brace, cx, cima - 1, 1, 1);
  rett(ctx, C.bianco, cx + 2, cima, 2, 1);
  // Il fumo: una scia che ondeggia salendo e in cima si apre in un fantasma con gli occhi vuoti.
  const fumo = "#4f5577";
  retino(ctx, fumo, cx - 26, 22, 44, cima - 22, (x, y) => {
    const k = (cima - y) / (cima - 22);
    const asse = cx - k * 12 + Math.sin(y / 7) * 3;
    return 0.85 * (1 - Math.abs(x - asse) / (1.5 + k * 3));
  });
  const fx = cx - 12, fy = 30;
  bagliore(ctx, fumo, fx, fy, 11, 1.4);
  rett(ctx, C.bordo, fx - 4, fy - 2, 3, 3);
  rett(ctx, C.bordo, fx + 2, fy - 2, 3, 3);
  rett(ctx, C.bordo, fx - 1, fy + 3, 3, 2);
}

function mozziconi(ctx, seme) {
  const rng = casuale(seme);
  for (let i = 0; i < 14; i++) {
    const lato = i % 2 ? 1 : -1;
    const x = 160 + lato * (80 + Math.floor(rng() * 70)), y = PAVIMENTO + 8 + Math.floor(rng() * 50);
    rett(ctx, C.pietraChiara, x, y, 2, 1);
    rett(ctx, C.oroScuro, x + (lato > 0 ? 2 : -1), y, 1, 1);
  }
}

/** L'Area Fumatori: fuori dalla porta sul retro della sala, sotto la tettoia, con la staccionata e il bosco dietro. */
export function areaFumatori(ctx) {
  cielo(ctx, CIELO_NOTTE, PAVIMENTO);
  stelle(ctx, 80, 23);
  luna(ctx, 100, 38, 11);
  colline(ctx, "#0a0f28", PAVIMENTO - 24, 4, 12);
  alberoSpoglio(ctx, 136, PAVIMENTO - 22, 22, 83);
  alberoSpoglio(ctx, 206, PAVIMENTO - 22, 18, 89);
  // Il muro della casa a sinistra, con la porta da cui si esce e l'insegna al neon: largo quanto basta
  // perché l'insegna non finisca nella vignetta del bordo.
  const muro = 66;
  staccionata(ctx, muro, LARGHEZZA, 28);
  rett(ctx, C.muroCasa, 0, 0, muro, PAVIMENTO);
  for (let y = 4; y < PAVIMENTO; y += 6)
    for (let x = (y / 6) % 2 ? 0 : 6; x < muro - 2; x += 12) rett(ctx, C.ombraCasa, x, y, 10, 1);
  rett(ctx, C.ombraCasa, muro - 4, 0, 4, PAVIMENTO);
  portaSulRetro(ctx, 20, 28, 54);
  insegnaFumatori(ctx, 34, 36);
  tettoia(ctx, muro, 314, 16);
  lucine(ctx, 19);
  posacenere(ctx, 252);
  fungoRiscaldante(ctx, 292);
  pavimentoAPiastrelle(ctx, ["#24243a", "#2c2c46"]);
  // La luce calda del fungo sul pavimento.
  retino(ctx, "#4a2c28", 230, PAVIMENTO, 90, ALTEZZA - PAVIMENTO, (x, y) => 0.9 * (1 - Math.hypot((x - 292) / 46, (y - PAVIMENTO) / 22)));
  mozziconi(ctx, 17);
  // Una panca di legno davanti al muro.
  rett(ctx, C.bordo, 74, PAVIMENTO - 14, 50, 5);
  rett(ctx, C.legnoChiaro, 75, PAVIMENTO - 14, 48, 3);
  rett(ctx, C.legnoLuce, 75, PAVIMENTO - 14, 48, 1);
  for (const x of [78, 116]) rett(ctx, C.legnoScuro, x, PAVIMENTO - 9, 4, 9);
  vignetta(ctx);
}

// ── La Sala del tesoro ──

function stendardo(ctx, cx, cima, alto) {
  rett(ctx, C.oroScuro, cx - 12, cima - 2, 24, 2);
  for (let y = 0; y < alto; y++) {
    const punta = y > alto - 8 ? (y - (alto - 8)) : 0;
    rett(ctx, C.tappeto, cx - 10 + punta, cima + y, 20 - punta * 2, 1);
    rett(ctx, C.oroScuro, cx - 10 + punta, cima + y, 1, 1);
    rett(ctx, C.oroScuro, cx + 9 - punta, cima + y, 1, 1);
  }
  caramellaDorata(ctx, cx - 5, cima + 14);
}

function mucchio(ctx, cx, base, mezzo, alto, seme) {
  const rng = casuale(seme);
  for (let y = 0; y < alto; y++) {
    const largo = Math.round(mezzo * Math.sqrt(y / alto));
    for (let x = -largo; x <= largo; x++) rett(ctx, rng() > 0.75 ? C.oro : rng() > 0.3 ? C.oroScuro : "#8a5a10", cx + x, base - alto + y, 1, 1);
  }
  for (let i = 0; i < Math.round(mezzo / 2); i++) {
    const k = rng();
    const y = base - alto + 2 + Math.floor(k * (alto - 6));
    const largo = Math.round(mezzo * Math.sqrt((y - base + alto) / alto));
    caramellaDorata(ctx, cx - largo + Math.floor(rng() * Math.max(1, largo * 2 - 10)), y);
  }
}

function forziere(ctx, x, base) {
  bagliore(ctx, "#4a3a14", x + 17, base - 22, 22, 0.9);
  rett(ctx, C.bordo, x - 1, base - 34, 36, 14);
  rett(ctx, C.legno, x, base - 33, 34, 12);
  rett(ctx, C.oroScuro, x, base - 33, 34, 2);
  rett(ctx, C.oro, x + 3, base - 22, 28, 4);
  for (let i = 0; i < 4; i++) caramellaDorata(ctx, x + 1 + i * 8, base - 25 + (i % 2) * 2);
  rett(ctx, C.bordo, x - 1, base - 18, 36, 18);
  rett(ctx, C.legnoChiaro, x, base - 17, 34, 17);
  rett(ctx, C.oroScuro, x, base - 17, 34, 2);
  rett(ctx, C.oroScuro, x + 6, base - 17, 3, 17);
  rett(ctx, C.oroScuro, x + 25, base - 17, 3, 17);
  rett(ctx, C.oro, x + 15, base - 12, 4, 5);
}

/** La Sala del tesoro (sala 2): la volta di pietra, i mucchi di caramelle dorate e il tesoro sul piedistallo. */
export function salaDelTesoro(ctx) {
  muroDiMattoni(ctx, PAVIMENTO, 81, { base: "#1d1a2a", malta: "#13101c", caldo: "#24203a", alto: 14, largo: 26 });
  // La nicchia di fondo con il fascio di luce dall'alto.
  arco(ctx, C.ferroChiaro, 160, 20, 34, PAVIMENTO);
  arco(ctx, "#0f0c18", 160, 24, 30, PAVIMENTO);
  retino(ctx, "#3a3014", 126, 24, 68, PAVIMENTO - 24, (x, y) => 0.8 * (1 - Math.abs(x - 160) / (8 + (y - 24) * 0.25)));
  rett(ctx, C.ferro, 140, 96, 40, PAVIMENTO - 96);
  rett(ctx, C.pietra, 140, 96, 40, 2);
  rett(ctx, C.ferroChiaro, 146, 86, 28, 10);
  rett(ctx, C.pietraChiara, 146, 86, 28, 1);
  bagliore(ctx, "#5a4818", 160, 76, 14, 1);
  // La caramella dorata gigante, tre volte più grande.
  ctx.save();
  ctx.translate(160 - 16, 68);
  ctx.scale(3, 3);
  caramellaDorata(ctx, 0, 0);
  ctx.restore();
  stendardo(ctx, 56, 14, 52);
  stendardo(ctx, 264, 14, 52);
  torcia(ctx, 100, 52);
  torcia(ctx, 220, 52);
  // Pavimento di lastre di pietra.
  const lastre = ["#2a2638", "#33304a"];
  let y = PAVIMENTO;
  [8, 10, 13, 15, 16].forEach((h, r) => {
    const w = 24 + r * 8;
    // Una lastra in più a sinistra: con le file sfalsate di mezza lastra il bordo restava vuoto.
    for (let x = LARGHEZZA / 2 - Math.ceil(LARGHEZZA / 2 / w) * w - w + (r % 2) * (w / 2), i = 0; x < LARGHEZZA; x += w, i++) {
      rett(ctx, lastre[(i + r) % 2], x, y, w, h);
      rett(ctx, C.bordo, x, y, 1, h);
    }
    rett(ctx, C.bordo, 0, y, LARGHEZZA, 1);
    y += h;
  });
  mucchio(ctx, 26, PAVIMENTO + 14, 34, 30, 3);
  mucchio(ctx, 296, PAVIMENTO + 14, 32, 28, 5);
  forziere(ctx, 58, PAVIMENTO + 20);
  forziere(ctx, 228, PAVIMENTO + 20);
  const rng = casuale(9);
  for (let i = 0; i < 22; i++) {
    const lato = i % 2 ? 1 : -1;
    moneta(ctx, 160 + lato * (64 + Math.floor(rng() * 90)), PAVIMENTO + 20 + Math.floor(rng() * 40));
  }
  vignetta(ctx, 1.2);
}

// I nomi sono gli id delle stanze nel catalogo: il PNG esportato si chiama <id>.png.
export const STANZE = {
  cancello,
  ingresso,
  deposito,
  "sala-principale": salaPrincipale,
  "sala-bar": salaBar,
  "area-fumatori": areaFumatori,
  "sala-del-tesoro": salaDelTesoro,
};
