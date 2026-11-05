// Disegna lo stato della partita su un canvas 320x180: cielo in dithering, parallasse, sprite, HUD.

import {
  ALTEZZA,
  CARAMELLE_LUNA,
  DURATA_STAGE,
  LARGHEZZA,
  SUOLO,
  VITE,
  X_ZUCCO,
  livelloBuio,
  punteggio,
  scatolaOstacolo,
} from "./sim.js";
import { conBordo, scurito } from "./sprite.js";

const BAYER = [
  [0, 8, 2, 10],
  [12, 4, 14, 6],
  [3, 11, 1, 9],
  [15, 7, 13, 5],
];

// Quattro atti sempre più cupi: tramonto, notte, luna di sangue, abisso.
const ATTI = [
  {
    daStage: 1,
    cielo: ["#1b1238", "#3a1a52", "#7a2a5c", "#c8483f", "#f08a3c"],
    lontano: "#4a2458", medio: "#2e163f", vicino: "#1c0f2c",
    luna: ["#fff0c2", "#e8c98a", "#c9a56a"], velo: "#ffe2cc",
  },
  {
    daStage: 2,
    cielo: ["#070a1f", "#0d1536", "#16214f", "#23316b", "#3a4a86"],
    lontano: "#1a2452", medio: "#10183a", vicino: "#090e24",
    luna: ["#f4f7ff", "#c9d3ec", "#94a3cc"], velo: "#ced9ff",
  },
  {
    daStage: 4,
    cielo: ["#12040f", "#2b0a1c", "#571026", "#8e1b2a", "#c8352c"],
    lontano: "#431024", medio: "#2a0a1a", vicino: "#190610",
    luna: ["#ff9a7a", "#e0472f", "#9c1f22"], velo: "#ffbfb4",
  },
  {
    daStage: 6,
    cielo: ["#030206", "#07040c", "#0e0612", "#1c0814", "#340a14"],
    lontano: "#0e0712", medio: "#0a0510", vicino: "#060308",
    luna: ["#9a3030", "#6a1c24", "#2e0c16"], velo: "#c8b4bc",
  },
];
const inizioAtto = (atto) => (atto.daStage - 1) * DURATA_STAGE;
const DURATA_PASSAGGIO = 6;

/** Da 0 a 1: quanto si è incupita la partita. Sale piano fino allo stage 7. */
const cupezza = (t) => Math.min(1, t / (6 * DURATA_STAGE));

const BORDO_PERICOLO = "#ffe9b0";
const OSTACOLI_CON_BORDO = ["lapide", "croce", "recinto", "mano", "pipistrello", "fantasma", "ragno"];

// Le mani nere sono solo grafica: non arrivano mai a toccare Zucco e la logica di gioco non le conosce.
const PRIMO_STAGE_MANI = 5;
const MANI_PER_STAGE = 3;
const DISTANZA_MANI = 62;
const DISTANZA_MINIMA = 40;
const BRACCIO_LUNGO = 66;
const BRACCIO_CORTO = 26;
const QUOTA_ZUCCO = SUOLO - 14;
const COLORE_MANI = "#030104";
const RIFLESSO_MANI = "#7a1a30";

/** Quanto sono agitate e fameliche le mani: cresce a ogni stage. */
const furiaMani = (stage) => Math.min(3, 1 + Math.max(0, stage - PRIMO_STAGE_MANI) * 0.4);

// Dallo stage 7 la vista porta Zucco in avanti e dietro di lui arriva l'orda. Anche questa è solo grafica:
// le regole non cambiano, ma in avanti si vede un po' meno lontano.
const PRIMO_STAGE_ORDA = 7;
const DURATA_INGRESSO = 3;
const VISTA_AVANTI = 44;
const COLORE_ORDA = "#7a1a30";
const MOSTRI_PER_STAGE = 4;
// `x`: da 0 (in fondo, contro il muro) a 1 (alle spalle di Zucco). La riga 0 è più lontana e più scura.
const ORDA = [
  { tipo: "orda_lupo", x: 0.92, riga: 1 },
  { tipo: "orda_zombie", x: 0.62, riga: 1 },
  { tipo: "orda_scheletro", x: 0.78, riga: 0 },
  { tipo: "orda_diavoletto", x: 0.4, riga: 1 },
  { tipo: "orda_scheletro", x: 0.24, riga: 1 },
  { tipo: "orda_zombie", x: 0.48, riga: 0 },
  { tipo: "orda_lupo", x: 0.12, riga: 0 },
  { tipo: "orda_diavoletto", x: 0.84, riga: 0 },
  { tipo: "orda_zombie", x: 0.04, riga: 1 },
  { tipo: "orda_scheletro", x: 0.54, riga: 1 },
  { tipo: "orda_lupo", x: 0.3, riga: 0 },
  { tipo: "orda_diavoletto", x: 0.68, riga: 1 },
];

/** Da 0 a 1: quanto sono entrate l'orda e la vista spostata. */
function ingressoOrda(t) {
  const k = Math.max(0, Math.min(1, (t - (PRIMO_STAGE_ORDA - 1) * DURATA_STAGE) / DURATA_INGRESSO));
  return k * k * (3 - 2 * k);
}

const FONT = {
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
  ":": [0x00, 0x36, 0x36, 0x00, 0x00], "-": [0x08, 0x08, 0x08, 0x08, 0x08], " ": [0, 0, 0, 0, 0],
};

function creaTela(w, h) {
  const tela = document.createElement("canvas");
  tela.width = w;
  tela.height = h;
  return [tela, tela.getContext("2d")];
}

const rgb = (hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));

function casuale(seed) {
  let a = seed;
  return () => {
    a = (Math.imul(a, 1664525) + 1013904223) >>> 0;
    return a / 4294967296;
  };
}

function telaCielo(fasce) {
  const h = SUOLO + 4;
  const [tela, ctx] = creaTela(LARGHEZZA, h);
  const img = ctx.createImageData(LARGHEZZA, h);
  const colori = fasce.map(rgb);
  for (let y = 0; y < h; y++) {
    const pos = (y / (h - 1)) * (colori.length - 1);
    const i = Math.min(colori.length - 2, Math.floor(pos));
    const f = pos - i;
    for (let x = 0; x < LARGHEZZA; x++) {
      const c = f * 16 > BAYER[y & 3][x & 3] ? colori[i + 1] : colori[i];
      img.data.set([...c, 255], (y * LARGHEZZA + x) * 4);
    }
  }
  ctx.putImageData(img, 0, 0);
  return tela;
}

function telaLuna(raggio, [chiaro, medio, scuro]) {
  const lato = raggio * 2 + 2;
  const [tela, ctx] = creaTela(lato, lato);
  const crateri = [[-0.35, -0.3, 0.26], [0.3, -0.1, 0.18], [-0.05, 0.42, 0.3], [0.45, 0.45, 0.14], [-0.55, 0.3, 0.12]];
  for (let y = 0; y < lato; y++)
    for (let x = 0; x < lato; x++) {
      const dx = (x - raggio) / raggio, dy = (y - raggio) / raggio;
      if (dx * dx + dy * dy > 1) continue;
      const ombra = dx * 0.5 + dy * 0.35;
      let colore = ombra * 16 > BAYER[y & 3][x & 3] * 0.8 + 3 ? medio : chiaro;
      for (const [cx, cy, r] of crateri)
        if ((dx - cx) ** 2 + (dy - cy) ** 2 < r * r) colore = dx - cx + (dy - cy) > 0 ? medio : scuro;
      ctx.fillStyle = colore;
      ctx.fillRect(x, y, 1, 1);
    }
  return tela;
}

function profilo(periodo, armoniche, rng) {
  const onde = armoniche.map(([k, a]) => [k, a, rng() * Math.PI * 2]);
  return (x) => onde.reduce((h, [k, a, fase]) => h + Math.sin((x / periodo) * Math.PI * 2 * k + fase) * a, 0);
}

function villa(ctx, x, base, colore) {
  ctx.fillStyle = colore;
  ctx.fillRect(x, base - 26, 44, 30);
  ctx.fillRect(x - 8, base - 36, 12, 40);
  ctx.fillRect(x + 30, base - 44, 12, 48);
  for (const [cx, alto, largo] of [[x - 2, base - 36, 8], [x + 36, base - 44, 8], [x + 22, base - 26, 24]])
    for (let i = 0; i < largo * 2; i++) ctx.fillRect(cx - largo + i / 2, alto - i + largo * 2 - largo * 2, largo * 2 - i, 1);
  ctx.fillStyle = "#ffcf5e";
  for (const [fx, fy] of [[x + 6, base - 18], [x + 16, base - 18], [x + 26, base - 12], [x + 34, base - 34], [x - 4, base - 26]])
    ctx.fillRect(fx, fy, 2, 3);
}

function albero(ctx, x, y, angolo, lunghezza, rng, spessore) {
  if (lunghezza < 3) return;
  const fx = x + Math.cos(angolo) * lunghezza;
  const fy = y + Math.sin(angolo) * lunghezza;
  const passi = Math.ceil(lunghezza);
  for (let i = 0; i <= passi; i++) {
    const k = i / passi;
    ctx.fillRect(Math.round(x + (fx - x) * k), Math.round(y + (fy - y) * k), spessore, spessore);
  }
  const rami = lunghezza > 9 ? 3 : 2;
  for (let i = 0; i < rami; i++)
    albero(ctx, fx, fy, angolo + (rng() - 0.5) * 1.5, lunghezza * (0.58 + rng() * 0.2), rng, Math.max(1, spessore - 1));
}

function telaLontana(colore) {
  const P = 640, [tela, ctx] = creaTela(P, 110), rng = casuale(11);
  const h = profilo(P, [[1, 12], [3, 6], [7, 2]], rng);
  ctx.fillStyle = colore;
  for (let x = 0; x < P; x++) {
    const y = Math.round(84 + h(x));
    ctx.fillRect(x, y, 1, 110 - y);
  }
  villa(ctx, 180, Math.round(84 + h(200)), colore);
  return tela;
}

function telaMedia(colore) {
  const P = 480, [tela, ctx] = creaTela(P, 110), rng = casuale(23);
  const h = profilo(P, [[2, 7], [5, 3]], rng);
  ctx.fillStyle = colore;
  for (let x = 0; x < P; x++) {
    const y = Math.round(92 + h(x));
    ctx.fillRect(x, y, 1, 110 - y);
  }
  for (const [x, l] of [[40, 15], [150, 19], [262, 13], [372, 17], [440, 12]])
    albero(ctx, x, 92 + h(x), -Math.PI / 2, l, rng, 3);
  return tela;
}

// Solo siepi basse: qui non ci vanno sagome di lapidi o croci, sembrerebbero ostacoli veri.
function telaVicina(colore) {
  const P = 400, [tela, ctx] = creaTela(P, 60), rng = casuale(37);
  const h = profilo(P, [[3, 2], [7, 1.5], [13, 1]], rng);
  ctx.fillStyle = colore;
  for (let x = 0; x < P; x++) {
    const y = Math.round(47 + h(x) + rng() * 1.4);
    ctx.fillRect(x, y, 1, 60 - y);
  }
  return tela;
}

function telaSuolo() {
  const P = 64, h = ALTEZZA - SUOLO, [tela, ctx] = creaTela(P, h), rng = casuale(5);
  const terra = ["#2d1c3a", "#3a2546", "#241630"];
  for (let y = 0; y < h; y++)
    for (let x = 0; x < P; x++) {
      const k = (y / h) * 0.9 + rng() * 0.35;
      ctx.fillStyle = k < 0.45 ? terra[1] : k < 0.85 ? terra[0] : terra[2];
      ctx.fillRect(x, y, 1, 1);
    }
  for (let i = 0; i < 7; i++) {
    const x = Math.floor(rng() * (P - 6)), y = 7 + Math.floor(rng() * (h - 11));
    ctx.fillStyle = "#1a1024";
    ctx.fillRect(x, y + 1, 5, 2);
    ctx.fillStyle = "#5d4a6c";
    ctx.fillRect(x, y, 4, 2);
    ctx.fillStyle = "#7a6688";
    ctx.fillRect(x + 1, y, 2, 1);
  }
  for (let x = 0; x < P; x++) {
    const alto = 2 + Math.floor(rng() * 3);
    ctx.fillStyle = "#2c4a34";
    ctx.fillRect(x, 0, 1, alto + 1);
    ctx.fillStyle = "#47703f";
    ctx.fillRect(x, 0, 1, alto - 1);
    if (rng() > 0.8) {
      ctx.fillStyle = "#7da04f";
      ctx.fillRect(x, 0, 1, 1);
    }
  }
  return tela;
}

function telaPrimoPiano() {
  const P = 160, [tela, ctx] = creaTela(P, 12), rng = casuale(71);
  ctx.fillStyle = "#0e0916";
  for (let x = 0; x < P; x++) {
    const onda = Math.sin((x / P) * Math.PI * 6) * 2 + Math.sin((x / P) * Math.PI * 14);
    const alto = 3 + Math.round(onda + rng() * 3);
    ctx.fillRect(x, 12 - alto, 1, alto);
  }
  return tela;
}

function telaBuio() {
  const w = LARGHEZZA * 2, h = ALTEZZA * 2, [tela, ctx] = creaTela(w, h);
  const interno = 40, esterno = 74;
  ctx.fillStyle = "#04030a";
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      const d = Math.hypot(x - w / 2, y - h / 2);
      const k = (d - interno) / (esterno - interno);
      if (k * 16 > BAYER[y & 3][x & 3]) ctx.fillRect(x, y, 1, 1);
    }
  return tela;
}

// Il muro da cui escono le mani: nero contro il bordo, poi un bagliore rosso che le fa risaltare.
function telaOmbra() {
  const w = 110, [tela, ctx] = creaTela(w, ALTEZZA);
  for (let y = 0; y < ALTEZZA; y++) {
    const orlo = w - 22 + Math.sin(y / 9) * 7 + Math.sin(y / 3.7) * 3;
    for (let x = 0; x < w; x++) {
      const k = 1 - x / orlo;
      if (k <= 0 || k * k * 22 <= BAYER[y & 3][x & 3]) continue;
      ctx.fillStyle = k > 0.68 ? COLORE_MANI : k > 0.4 ? "#2a0610" : "#540e1c";
      ctx.fillRect(x, y, 1, 1);
    }
  }
  return tela;
}

function passaggioAtti(t) {
  let atto = 0;
  ATTI.forEach((a, i) => {
    if (t >= inizioAtto(a)) atto = i;
  });
  const k = (t - inizioAtto(ATTI[atto])) / DURATA_PASSAGGIO;
  if (atto === 0 || k >= 1) return { da: atto, a: atto, k: 0 };
  return { da: atto - 1, a: atto, k };
}

export function creaRender(canvas, sprite, effetti) {
  const ctx = canvas.getContext("2d");
  ctx.imageSmoothingEnabled = false;

  const strati = ATTI.map((a) => ({
    cielo: telaCielo(a.cielo),
    luna: telaLuna(18, a.luna),
    lunaPiena: telaLuna(32, a.luna),
    lontano: telaLontana(a.lontano),
    medio: telaMedia(a.medio),
    vicino: telaVicina(a.vicino),
  }));
  const suolo = telaSuolo();
  const primoPiano = telaPrimoPiano();
  const buio = telaBuio();
  const ombra = telaOmbra();
  const evidenti = Object.fromEntries(
    OSTACOLI_CON_BORDO.map((nome) => [nome, sprite[nome].map((tela) => conBordo(tela, BORDO_PERICOLO))]),
  );

  const orda = ORDA.map((m) => m.tipo).filter((tipo, i, tutti) => tutti.indexOf(tipo) === i);
  const immaginiOrda = Object.fromEntries(
    orda.map((tipo) => [
      tipo,
      [
        sprite[tipo].map((tela) => conBordo(scurito(tela, 0.55), COLORE_ORDA)),
        sprite[tipo].map((tela) => conBordo(scurito(tela, 0.12), COLORE_ORDA)),
      ],
    ]),
  );
  let faseMani = 0;
  let faseOrda = 0;

  const rng = casuale(99);
  const stelle = Array.from({ length: 70 }, () => ({
    x: Math.floor(rng() * LARGHEZZA),
    y: Math.floor(rng() * 90),
    fase: rng() * 6,
  }));
  // L'ordine sparge le prime mani su tutta l'altezza dello schermo.
  const braccia = [4, 1, 7, 2, 6, 0, 8, 3, 5, 2.5, 5.5, 0.5, 7.5].map((riga) => ({
    y: 10 + riga * 19 + rng() * 6,
    fase: rng() * Math.PI * 2,
    ritmo: 0.7 + rng() * 0.8,
    lungo: 0.72 + rng() * 0.28,
  }));
  const mostri = ORDA.map((m) => ({ ...m, fase: rng() * 6, ritmo: 0.8 + rng() * 0.7 }));

  function scrivi(testo, x, y, { colore = "#fff", scala = 1, ombra = "#160f1e", centro = false, destra = false } = {}) {
    const larghezza = testo.length * 6 * scala - scala;
    let cx = centro ? x - larghezza / 2 : destra ? x - larghezza : x;
    cx = Math.round(cx);
    const glifo = (dx, dy, c) => {
      ctx.fillStyle = c;
      [...testo].forEach((ch, i) => {
        (FONT[ch] ?? FONT[" "]).forEach((colonna, col) => {
          for (let r = 0; r < 7; r++)
            if (colonna & (1 << r)) ctx.fillRect(cx + (i * 6 + col) * scala + dx, y + r * scala + dy, scala, scala);
        });
      });
    };
    if (ombra) {
      const scarto = Math.min(scala, 2);
      glifo(scarto, scarto, ombra);
      if (scala > 2) for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) glifo(dx, dy, ombra);
    }
    glifo(0, 0, colore);
  }

  function ripeti(tela, periodo, offset, y) {
    const inizio = -Math.round(offset % periodo);
    for (let x = inizio; x < LARGHEZZA; x += periodo) ctx.drawImage(tela, x, y);
  }

  function dissolvi(nome, { da, a, k }, disegna) {
    disegna(strati[da][nome]);
    if (k <= 0) return;
    ctx.globalAlpha = k;
    disegna(strati[a][nome]);
    ctx.globalAlpha = 1;
  }

  function cielo(s, passaggio) {
    dissolvi("cielo", passaggio, (t) => ctx.drawImage(t, 0, 0));

    const notte = Math.min(1, s.t / inizioAtto(ATTI[1]));
    const spente = 1 - cupezza(s.t) * 0.75;
    ctx.fillStyle = "#fff";
    for (const st of stelle) {
      const luce = (0.4 + 0.6 * Math.abs(Math.sin(s.tick / 40 + st.fase))) * (0.35 + notte * 0.65) * (1 - st.y / 120) * spente;
      ctx.globalAlpha = luce;
      ctx.fillRect(st.x, st.y, 1, 1);
    }
    ctx.globalAlpha = 1;
    effetti.disegnaCielo(ctx, s);

    const quota = Math.round(66 - Math.min(1, s.t / 90) * 34);
    if (s.lunaT > 0) {
      const respiro = 3 + Math.sin(s.tick / 6) * 2;
      ctx.fillStyle = "#fff3b0";
      ctx.globalAlpha = 0.14;
      for (const extra of [10, 20]) {
        ctx.beginPath();
        ctx.arc(232, 44, 33 + extra + respiro, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      dissolvi("lunaPiena", passaggio, (t) => ctx.drawImage(t, 199, 11));
    } else {
      dissolvi("luna", passaggio, (t) => ctx.drawImage(t, 232, quota));
    }
  }

  function paesaggio(s, passaggio) {
    dissolvi("lontano", passaggio, (t) => ripeti(t, 640, s.distanza * 0.08, 46));
    dissolvi("medio", passaggio, (t) => ripeti(t, 480, s.distanza * 0.2, 46));
    effetti.disegnaNebbia(ctx, s);
    dissolvi("vicino", passaggio, (t) => ripeti(t, 400, s.distanza * 0.45, 96));
    ripeti(suolo, 64, s.distanza, SUOLO);
  }

  function disegnaOstacolo(o, s) {
    if (o.tipo === "demone") return; // lo disegna pixelfx, in effetti.js
    const f = (nome, i = 0) => evidenti[nome][i % evidenti[nome].length];
    const scatola = scatolaOstacolo(o);
    const cx = Math.round(o.x + o.w / 2);

    if (o.tipo === "mano") {
      const collina = sprite.monticello[0];
      const img = f("mano");
      const fuori = Math.round(img.height * o.salita);
      if (fuori > 0) ctx.drawImage(img, 0, 0, img.width, fuori, cx - 7, SUOLO - fuori, img.width, fuori);
      ctx.drawImage(collina, cx - 9, SUOLO - collina.height + 1);
    } else if (o.tipo === "ragno") {
      const img = f("ragno", Math.floor(s.tick / 12));
      const fondo = Math.round(o.y + o.h);
      ctx.fillStyle = BORDO_PERICOLO;
      ctx.fillRect(cx, 0, 1, fondo - img.height + 2);
      ctx.drawImage(img, cx - 8, fondo - img.height + 1);
    } else if (o.tipo === "pipistrello") {
      const img = f("pipistrello", Math.floor(s.tick / 7));
      ctx.drawImage(img, cx - 12, Math.round(scatola.y + scatola.h / 2 - img.height / 2));
    } else if (o.tipo === "fantasma") {
      const img = f("fantasma", Math.floor(s.tick / 9));
      ctx.drawImage(img, cx - 11, Math.round(scatola.y + scatola.h / 2 - img.height / 2));
    } else {
      const img = f(o.tipo);
      ctx.drawImage(img, cx - Math.floor(img.width / 2), SUOLO - img.height + 2);
    }
  }

  function ordaDiMostri(s, ingresso, vista) {
    const quanti = (s.stage - PRIMO_STAGE_ORDA + 2) * MOSTRI_PER_STAGE;
    // Più vite perse, più l'orda è addosso. Si ferma sempre alle spalle di Zucco.
    const fronte = X_ZUCCO + vista - 30 - s.vite * 3;
    const presenti = mostri.slice(0, quanti).sort((p, q) => p.riga - q.riga);
    for (const m of presenti) {
      const fotogrammi = immaginiOrda[m.tipo][m.riga];
      const img = fotogrammi[Math.floor(faseOrda * 9 * m.ritmo + m.fase) % fotogrammi.length];
      // Fanno a gara: ognuno scatta, viene ripreso, esce dal bordo sinistro e rientra col suo ritmo.
      const passo = faseOrda * m.ritmo * 1.4 + m.fase;
      const gara = 0.5 + 0.35 * Math.sin(passo) + 0.15 * Math.sin(passo * 2.3 + m.fase);
      const x = -40 + (fronte + 40) * (gara * 0.75 + m.x * 0.25) * ingresso;
      const y = SUOLO + (m.riga ? 5 : -2) - Math.abs(Math.sin(passo * 3)) * 1.5;
      ctx.drawImage(img, Math.round(x - img.width / 2), Math.round(y - img.height));
    }
  }

  function maniNere(s, ingresso, vista) {
    const quante = Math.min(braccia.length, (s.stage - PRIMO_STAGE_MANI + 1) * MANI_PER_STAGE);
    if (quante <= 0) return;

    const crescita = Math.min(3, s.stage - PRIMO_STAGE_MANI + 1);
    const furia = furiaMani(s.stage);
    const respiro = Math.sin(faseMani * 2) * 3;
    ctx.drawImage(ombra, -ombra.width + 34 + crescita * 14 + respiro + vista * 0.5, 0);

    // Puntano tutte a Zucco e si fermano prima di toccarlo. Con meno vite si fanno più vicine.
    const vicino = Math.max(DISTANZA_MINIMA, DISTANZA_MANI - crescita * 6 - (VITE - s.vite) * 7);
    const cx = X_ZUCCO + vista, cy = s.zucco.y - 14;
    const tratti = [];
    const tratto = (x0, y0, x1, y1, r) => {
      const passi = Math.ceil(Math.hypot(x1 - x0, y1 - y0));
      for (let i = 0; i <= passi; i++) {
        const k = i / Math.max(1, passi);
        tratti.push([x0 + (x1 - x0) * k, y0 + (y1 - y0) * k, r]);
      }
    };

    for (const b of braccia.slice(0, quante)) {
      const tempo = faseMani * b.ritmo + b.fase;
      // Più sono furiose, più restano protese e tornano indietro di scatto, tremando.
      const scatto = (0.5 + 0.5 * Math.sin(tempo * 1.7)) ** (1 / furia);
      // Si allungano davvero solo quelle alla sua altezza: le esterne indicano la direzione e restano corte.
      const dx = cx + 8, dy = cy - b.y, totale = Math.hypot(dx, dy);
      const esterna = Math.min(1, Math.abs(b.y - QUOTA_ZUCCO) / 100);
      const massimo = (BRACCIO_LUNGO + (BRACCIO_CORTO - BRACCIO_LUNGO) * esterna) * b.lungo;
      const portata = Math.max(12, Math.min(totale - vicino, massimo)) * (0.55 + 0.45 * scatto);
      const tremito = Math.sin(tempo * 21) * (furia - 1) * 1.2;
      const xPunta = -8 + (dx / totale) * portata;
      const yPunta = b.y + (dy / totale) * portata + Math.sin(tempo * 2.3) * 3 + tremito;

      let px = -8, py = b.y;
      for (let i = 1; i <= 12; i++) {
        const u = i / 12;
        const x = -8 + (xPunta + 8) * u;
        const y = b.y + (yPunta - b.y) * u + Math.sin(u * 5 + tempo * 3) * 5 * Math.sin(u * Math.PI);
        tratto(px, py, x, y, 3.5 - u * 2);
        px = x;
        py = y;
      }

      // Le dita si aprono e si chiudono, come per afferrare.
      const verso = Math.atan2(yPunta - b.y, xPunta + 8);
      const apre = 0.5 + 0.5 * Math.sin(tempo * 3.1 * (1 + (furia - 1) * 0.5));
      for (let d = 0; d < 4; d++) {
        const lato = d - 1.5;
        const angolo = verso + lato * (0.2 + apre * 0.3);
        const x1 = xPunta + Math.cos(angolo) * 6, y1 = yPunta + Math.sin(angolo) * 6;
        const piega = angolo - lato * (1 - apre) * 0.7;
        tratto(xPunta, yPunta, x1, y1, 1.4);
        tratto(x1, y1, x1 + Math.cos(piega) * 5, y1 + Math.sin(piega) * 5, 0.8);
      }
    }

    for (const [colore, extra] of [[RIFLESSO_MANI, 1], [COLORE_MANI, 0]]) {
      ctx.fillStyle = colore;
      for (const [x, y, r] of tratti) {
        const lato = Math.max(1, Math.round((r + extra) * 2));
        ctx.fillRect(Math.round(x - lato / 2), Math.round(y - lato / 2), lato, lato);
      }
    }

    if (ingresso > 0) {
      ordaDiMostri(s, ingresso, vista);
      effetti.disegnaOrda(ctx, s, ingresso);
    }

    // Il muro passa sopra la scena, ma Zucco deve restare sempre leggibile.
    ctx.save();
    ctx.translate(vista, 0);
    disegnaZucco(s);
    ctx.restore();
  }

  function disegnaZucco(s) {
    const z = s.zucco;
    const y = Math.round(z.y);
    if (z.stato === "ko") {
      const img = sprite.zucco_ko[0];
      ctx.drawImage(img, X_ZUCCO - 7, SUOLO - img.height + 1);
      return;
    }
    if (s.graziaT > 0 && Math.floor(s.tick / 4) % 2) return;

    let img;
    if (z.stato === "scivola") img = sprite.zucco_scivola[Math.floor(s.tick / 6) % sprite.zucco_scivola.length];
    else if (z.stato === "aria") img = (z.vy < 0 ? sprite.zucco_sale : sprite.zucco_scende)[0];
    else img = sprite.zucco_corsa[Math.floor(s.distanza / 13) % sprite.zucco_corsa.length];

    const x = X_ZUCCO - Math.floor(img.width / 2);
    ctx.drawImage(img, x, y - img.height + 1);
    if (s.lunaT > 0 && Math.floor(s.tick / 3) % 2) {
      ctx.globalCompositeOperation = "lighter";
      ctx.globalAlpha = 0.6;
      ctx.drawImage(img, x, y - img.height + 1);
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = "source-over";
    }
  }

  function disegnaDolce(d, i, s) {
    const nomi = ["caramella_rosa", "caramella_verde", "caramella_gialla"];
    const f = sprite[nomi[Math.abs(Math.round(d.y + d.x / 40 + i)) % 3]] ?? sprite.caramella_rosa;
    const img = f[Math.floor(s.tick / 10) % f.length];
    ctx.drawImage(img, Math.round(d.x - img.width / 2), Math.round(d.y - img.height / 2 + Math.sin(s.tick / 9 + i) * 1.4));
  }

  function hud(s, record) {
    scrivi(String(punteggio(s)).padStart(6, "0"), LARGHEZZA - 6, 6, { destra: true, colore: "#ffe45e" });
    if (record > 0)
      scrivi(`REC ${String(record).padStart(6, "0")}`, LARGHEZZA - 6, 16, { destra: true, colore: "#c3c1d4" });

    scrivi(`STAGE ${s.stage}`, LARGHEZZA / 2, 6, { centro: true, colore: "#c3c1d4" });
    for (let i = 0; i < VITE; i++) ctx.drawImage((i < s.vite ? sprite.vita : sprite.vita_persa)[0], 6 + i * 11, 16);

    const x = 22, y = 8, largo = 60;
    ctx.drawImage(sprite.caramella_rosa[1], 6, 5);
    ctx.fillStyle = "#160f1e";
    ctx.fillRect(x - 1, y - 1, largo + 2, 6);
    ctx.fillStyle = "#3b2a52";
    ctx.fillRect(x, y, largo, 4);
    if (s.lunaT > 0) {
      ctx.fillStyle = Math.floor(s.tick / 5) % 2 ? "#fff3b0" : "#ffb52e";
      ctx.fillRect(x, y, Math.round(largo * (s.lunaT / 6)), 4);
      scrivi("LUNA PIENA!", LARGHEZZA / 2, 16, { centro: true, colore: "#fff3b0" });
    } else {
      ctx.fillStyle = "#ff6fa8";
      ctx.fillRect(x, y, Math.round(largo * (s.luna / CARAMELLE_LUNA)), 4);
      ctx.fillStyle = "#ffb2cf";
      ctx.fillRect(x, y, Math.round(largo * (s.luna / CARAMELLE_LUNA)), 1);
    }
  }

  function cartelloStage(s) {
    const trascorso = s.t - (s.stage - 1) * DURATA_STAGE;
    if (s.stage === 1 || trascorso > 1.7) return;
    if (trascorso > 1.2 && Math.floor(s.tick / 4) % 2) return;
    scrivi(`STAGE ${s.stage}`, LARGHEZZA / 2, 56, { centro: true, colore: "#ffe45e", scala: 3 });
  }

  function velo(passaggio) {
    ctx.globalCompositeOperation = "multiply";
    ctx.fillStyle = ATTI[passaggio.da].velo;
    ctx.fillRect(0, 0, LARGHEZZA, ALTEZZA);
    if (passaggio.k > 0) {
      ctx.globalAlpha = passaggio.k;
      ctx.fillStyle = ATTI[passaggio.a].velo;
      ctx.fillRect(0, 0, LARGHEZZA, ALTEZZA);
      ctx.globalAlpha = 1;
    }
    ctx.globalCompositeOperation = "source-over";
  }

  // Il fondo si spegne stage dopo stage. Sta sotto gli sprite, che così spiccano di più.
  function incupisci(s) {
    ctx.globalAlpha = 0.45 * cupezza(s.t);
    ctx.fillStyle = "#05020a";
    ctx.fillRect(0, 0, LARGHEZZA, ALTEZZA);
    ctx.globalAlpha = 1;
  }

  function oscurita(s, vista) {
    const livello = livelloBuio(s);
    if (livello <= 0) return;
    ctx.globalAlpha = livello;
    ctx.drawImage(buio, X_ZUCCO + vista + 8 - LARGHEZZA, Math.round(s.zucco.y) - 16 - ALTEZZA);
    // Gli ostacoli restano intuibili nel buio: la partita dev'essere difficile, non ingiusta.
    ctx.save();
    ctx.translate(vista, 0);
    ctx.globalAlpha = 0.5 * livello;
    for (const o of s.ostacoli) if (!o.rotto) disegnaOstacolo(o, s);
    effetti.ripetiDemoni(ctx);
    ctx.restore();
    ctx.globalAlpha = 1;
  }

  return {
    disegna(s, { record = 0, titolo = false, dt = 0 } = {}) {
      const passaggio = passaggioAtti(s.t);
      const scossa = effetti.scossa;
      const ingresso = ingressoOrda(s.t);
      const vista = Math.round(VISTA_AVANTI * ingresso);
      // Le fasi si accumulano: al cambio di stage le mani accelerano senza fare salti.
      faseMani += dt * furiaMani(s.stage);
      faseOrda += dt;

      ctx.save();
      if (scossa > 0.2) ctx.translate(Math.round((Math.random() - 0.5) * scossa * 2), Math.round((Math.random() - 0.5) * scossa * 2));

      cielo(s, passaggio);
      paesaggio(s, passaggio);
      // La tinta dell'atto resta sotto gli sprite: quello che uccide deve leggersi sempre.
      velo(passaggio);
      incupisci(s);

      ctx.save();
      ctx.translate(vista, 0);
      s.dolci.forEach((d, i) => !d.preso && disegnaDolce(d, i, s));
      for (const o of s.ostacoli) if (!o.rotto) disegnaOstacolo(o, s);
      effetti.disegnaDietro(ctx, s);
      disegnaZucco(s);
      effetti.disegna(ctx);
      ctx.restore();

      ripeti(primoPiano, 160, s.distanza * 1.3, ALTEZZA - 12);
      oscurita(s, vista);
      maniNere(s, ingresso, vista);
      ctx.restore();

      if (titolo) {
        scrivi("LA FUGA DI", LARGHEZZA / 2, 26, { centro: true, colore: "#fff3b0", scala: 2 });
        scrivi("ZUCCO", LARGHEZZA / 2, 46, { centro: true, colore: "#f59a2e", scala: 5 });
      } else {
        hud(s, record);
        cartelloStage(s);
      }
    },

    scrivi,
  };
}
