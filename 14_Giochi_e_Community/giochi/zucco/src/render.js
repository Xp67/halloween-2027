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
import {
  CORSIE,
  DURATA_RUGGITO,
  DURATA_VITA,
  HOMERUN_PER_PIPISTRELLO,
  LARGO_PIATTAFORMA,
  PIATTAFORME,
  PREAVVISO_LANCIO,
  PRESAGIO,
  TEMPI_ANGELO,
  TEMPI_ELEF,
  VITE_BOSS,
  VOLO_VITA,
  X_ATTERRAGGIO,
  X_BOSS,
  X_ELEF,
  X_LANCIO,
  X_PIATTAFORMA,
  Y_ELEF,
  forzaTerremoto,
} from "./boss.js";
import { creaCinematica } from "./cinematica.js";
import { ANGOLI_SWING, COLORE_BRAND } from "./costanti.js";
import { LUNE_PER_PREMIO } from "./punti.js";
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
const OSTACOLI_CON_BORDO = ["lapide", "croce", "recinto", "mano", "pipistrello", "fantasma", "ragno", "lancio_osso", "lancio_teschio", "lancio_zucca"];

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
const MANI_DEL_BOSS = 18;
// Le mani del duello, fase per fase. Le prime stanno a sinistra come nella corsa, poi entrano da ogni lato.
// Sono solo grafica: quella che colpisce è la manata, e sta in boss.js.
const MANI_ASSEDIO = [6, 14, 26];
const MANI_AL_SECONDO = 12;
const PORTATA_ASSEDIO = [36, 58, 52, 34];
// A destra stanno solo in alto: sotto ci sono gli scagnozzi.
const QUOTA_MANI_DESTRA = 0.6;
const SPESSORE_ASSEDIO = 34;
const RIPARO_LARGO = 62;
const RIPARO_ALTO = 72;
const RIPARO_SUOLO = 28;
const ROSSO_AVVISO = "#ff2a3a";
const BORDO_AMICO = "#fff3b0";
const LATO_CORSIA = 13;
const BRACCIO_MANATA = 6;
// Quanto Zucco si butta sul colpo a ogni tick dello swing, e quanto a lungo resta la scia.
const SLANCIO_SWING = [0, -1, -2, -1, 1, 3, 3, 3, 2, 2, 1, 1];
const SCIA_SWING = 3;
// Dietro il boss, sul bordo destro: lo scheletro versa, lo zombie mescola. Solo scena, il drink sta in boss.js.
const X_SCHELETRO = 352;
const X_BOCCIA = 373;
const X_ZOMBIE = 391;
const ALTO_BOCCIA = 22;
const PIENO_INIZIALE = 0.15;
const VITE_PRIMA_FASE = 4;
const COLORE_VETRO = "#bfe3f0";
const BOTTIGLIE = ["#d8f0ff", "#ffb52e", "#2a8cff"];
const LIQUIDO_CHIARO = "#d8f0ff";
const LIQUIDO_AZZURRO = "#2a8cff";
const GIRO_BOTTIGLIA = 3;
const RAGGIO_ONDE = 150;
const ONDE_RUGGITO = 3;
const INCLINAZIONE_RUGGITO = 0.42;
const CRESCITA_RUGGITO = 0.14;
const RAGGIO_SCIA = 32;
const SPESSORE_SCIA = 9;
const GIRO_MANI = 4;
const COLORE_BRACCIO = "#6a43b8";
const COLORE_MANO = "#ffd07a";
const TACCA_VITA = 3;
const TACCHE_PER_VITA = 4;
const RITIRATA_MANI = 2.4;
const FASI_SENZA_BOSS = ["arrivo", "frenata", "silenzio", "trema"];
const FINESTRE = [[36, 72], [132, 72], [136, 24]];
const LUCI_CASA = [...FINESTRE.map(([x, y]) => [x, y, 14, 18]), [80, 90, 22, 32]];
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
  ":": [0x00, 0x36, 0x36, 0x00, 0x00], ",": [0x00, 0x50, 0x30, 0x00, 0x00], "-": [0x08, 0x08, 0x08, 0x08, 0x08], " ": [0, 0, 0, 0, 0],
  "+": [0x08, 0x08, 0x3e, 0x08, 0x08], "/": [0x40, 0x30, 0x08, 0x06, 0x01],
};

function scriviSu(ctx, testo, x, y, { colore = "#fff", scala = 1, ombra = "#160f1e", centro = false, destra = false } = {}) {
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

/** Il buio che si stringe da tutti i lati nel duello. Ha le misure della visuale larga. */
function telaAssedio() {
  const w = LARGHEZZA + 80, h = Math.round((w * ALTEZZA) / LARGHEZZA), [tela, ctx] = creaTela(w, h);
  ctx.fillStyle = COLORE_MANI;
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      // Gli scagnozzi lavorano in quell'angolo: il buio li deve lasciare in vista.
      if (x > w - RIPARO_LARGO && y > h - RIPARO_ALTO && y < h - RIPARO_SUOLO) continue;
      const k = 1 - Math.min(x, y, w - 1 - x, h - 1 - y) / SPESSORE_ASSEDIO;
      if (k > 0 && k * k * 18 > BAYER[y & 3][x & 3]) ctx.fillRect(x, y, 1, 1);
    }
  return tela;
}

/** Mezza larghezza della boccia alla riga `j`, contata dall'orlo. */
const rigaBoccia = (j) => (j < 3 ? 7 : Math.round(13 * Math.sqrt(Math.max(0, 1 - ((j - 12.5) / 10) ** 2))));

function telaBoccia() {
  const [tela, ctx] = creaTela(28, ALTO_BOCCIA);
  ctx.fillStyle = COLORE_VETRO;
  for (let j = 0; j < ALTO_BOCCIA; j++) {
    const lato = rigaBoccia(j);
    ctx.fillRect(14 - lato, j, 1, 1);
    ctx.fillRect(14 + lato - 1, j, 1, 1);
  }
  ctx.fillRect(7, 0, 14, 1);
  ctx.fillRect(8, ALTO_BOCCIA - 1, 12, 1);
  return tela;
}

/** La stessa immagine guardata dall'altra parte: lo zombie sta a destra della boccia. */
function specchiata(tela) {
  const [copia, ctx] = creaTela(tela.width, tela.height);
  ctx.translate(tela.width, 0);
  ctx.scale(-1, 1);
  ctx.drawImage(tela, 0, 0);
  return copia;
}

function fraColori(a, b, k) {
  const [ra, ga, ba] = rgb(a), [rb, gb, bb] = rgb(b);
  return `rgb(${ra + (rb - ra) * k},${ga + (gb - ga) * k},${ba + (bb - ba) * k})`;
}

/** Da 0 a 1 quanto è sporto il boss: scatta in avanti, resta lì a ruggire e torna. */
function sporgenza(b) {
  if (b.ruggito <= 0) return 0;
  const entra = Math.min(1, (DURATA_RUGGITO - b.ruggito) / 0.22);
  return entra * entra * (3 - 2 * entra) * Math.min(1, b.ruggito / 0.35);
}

/** Un numero fra 0 e 1 che cambia dieci volte al secondo, diverso per ogni luce. */
const guizzo = (t, i) => Math.abs(Math.sin(Math.floor(t * 10) * 12.9898 + i * 78.233));

function telaCasa() {
  const w = 180, h = 122, [tela, ctx] = creaTela(w, h), rng = casuale(13);
  const muro = "#2a1c38", ombraMuro = "#1c1228", tetto = "#140c1e";
  const rettangolo = (c, x, y, l, a) => {
    ctx.fillStyle = c;
    ctx.fillRect(x, y, l, a);
  };
  rettangolo(muro, 22, 44, 136, 78);
  for (let y = 46; y < 120; y += 8) for (let x = 24 + ((y / 8) % 2) * 6; x < 156; x += 12) rettangolo(ombraMuro, x, y, 10, 1);
  for (let i = 0; i < 40; i++) rettangolo(tetto, 90 - 78 + i * 2, 44 - i, 156 - i * 4, 1);
  rettangolo(muro, 128, 12, 24, 40);
  for (let i = 0; i < 18; i++) rettangolo(tetto, 124 + i, 12 - i, 32 - i * 2, 1);
  for (const [x, y] of FINESTRE) {
    rettangolo("#160f1e", x - 1, y - 1, 16, 20);
    rettangolo("#ffcf5e", x, y, 14, 18);
    rettangolo("#f59a2e", x + 6, y, 2, 18);
    rettangolo("#f59a2e", x, y + 8, 14, 2);
  }
  rettangolo("#160f1e", 78, 88, 26, 34);
  rettangolo("#f59a2e", 80, 90, 22, 32);
  rettangolo("#ffcf5e", 84, 94, 14, 28);
  for (let i = 0; i < 14; i++) rettangolo(rng() > 0.5 ? "#ff6fa8" : "#37d6c2", 26 + i * 10, 56 + (i % 2) * 2, 2, 2);

  // Il cartello: legno, scritta e logo.
  rettangolo("#160f1e", 34, 34, 112, 30);
  rettangolo("#5a3a26", 36, 36, 108, 26);
  rettangolo("#7a5a44", 36, 36, 108, 2);
  scriviSu(ctx, "FESTA HALLOWEEN", 90, 39, { centro: true, colore: "#ffe45e" });
  const riga = 51, parola = "GET", resto = "INVOLVED", totale = (parola.length + resto.length) * 6;
  scriviSu(ctx, parola, 90 - totale / 2, riga, { colore: "#ffffff" });
  scriviSu(ctx, resto, 90 - totale / 2 + parola.length * 6, riga, { colore: COLORE_BRAND });
  return tela;
}

function telaCorpoBoss() {
  const w = 130, h = 120, [tela, ctx] = creaTela(w, h);
  const dentro = (x, y) => {
    const k = y / h;
    const largo = 18 + 44 * k + Math.sin(y / 5) * 3;
    return Math.abs(x - w / 2) < largo;
  };
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      if (!dentro(x, y)) continue;
      const bordo = !dentro(x - 1, y) || !dentro(x + 1, y) || y === 0;
      ctx.fillStyle = bordo ? "#8a1e36" : "#030104";
      ctx.fillRect(x, y, 1, 1);
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
  const elef = sprite.elef.map((tela) => conBordo(tela, BORDO_AMICO));
  const vitaInVolo = conBordo(sprite.vita[0], BORDO_AMICO);
  const buioAssedio = telaAssedio();
  const boccia = telaBoccia();
  const scheletri = sprite.scagnozzo_scheletro.map((tela) => conBordo(tela, COLORE_ORDA));
  const zombie = sprite.scagnozzo_zombie.map((tela) => specchiata(conBordo(tela, COLORE_ORDA)));
  const calici = sprite.angelo_azzurro;

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
  let W = LARGHEZZA;
  let H = ALTEZZA;
  let assedioVisto = 0;
  let pienoVisto = PIENO_INIZIALE;
  let moltiplicatoreVisto = 1;
  let saltoMoltiplicatore = 0;
  let caloMoltiplicatore = 0;
  const casa = telaCasa();
  const corpoBoss = telaCorpoBoss();

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
  // Le mille mani del boss: una corona di braccia tutto attorno, a parte il suolo.
  const corona = Array.from({ length: MANI_DEL_BOSS }, (_, i) => ({
    angolo: Math.PI * (0.92 + (1.16 * i) / (MANI_DEL_BOSS - 1)) + (rng() - 0.5) * 0.1,
    lungo: 58 + rng() * 44,
    fase: rng() * 6,
    ritmo: 0.8 + rng() * 0.9,
  }));

  // `lato`: 0 sinistra, 1 destra, 2 alto, 3 basso. `dove` è la posizione lungo quel lato, da 0 a 1.
  const assedio = Array.from({ length: MANI_ASSEDIO.at(-1) }, (_, i) => ({
    lato: i < MANI_ASSEDIO[0] ? 0 : [1, 2, 3, 0][i % 4],
    dove: (i * 0.618 + 0.08) % 1,
    fase: rng() * 6,
    ritmo: 0.8 + rng() * 0.8,
    lungo: 0.7 + rng() * 0.3,
  }));

  const scrivi = (testo, x, y, opzioni) => scriviSu(ctx, testo, x, y, opzioni);

  function ripeti(tela, periodo, offset, y) {
    const inizio = -Math.round(offset % periodo);
    for (let x = inizio; x < W; x += periodo) ctx.drawImage(tela, x, y);
  }

  function dissolvi(nome, { da, a, k }, disegna) {
    disegna(strati[da][nome]);
    if (k <= 0) return;
    ctx.globalAlpha = k;
    disegna(strati[a][nome]);
    ctx.globalAlpha = 1;
  }

  function cielo(s, passaggio) {
    dissolvi("cielo", passaggio, (t) => ctx.drawImage(t, 0, 0, W, t.height));

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

  function creaTratti() {
    const tratti = [];
    const tratto = (x0, y0, x1, y1, r) => {
      const passi = Math.ceil(Math.hypot(x1 - x0, y1 - y0));
      for (let i = 0; i <= passi; i++) {
        const k = i / Math.max(1, passi);
        tratti.push([x0 + (x1 - x0) * k, y0 + (y1 - y0) * k, r]);
      }
    };
    return { tratti, tratto };
  }

  /** Un braccio nero che ondeggia fino alla punta, con le dita che si aprono e si chiudono come per afferrare. */
  function braccio(tratto, x0, y0, xPunta, yPunta, tempo, apre) {
    let px = x0, py = y0;
    for (let i = 1; i <= 12; i++) {
      const u = i / 12;
      const x = x0 + (xPunta - x0) * u;
      const y = y0 + (yPunta - y0) * u + Math.sin(u * 5 + tempo * 3) * 5 * Math.sin(u * Math.PI);
      tratto(px, py, x, y, 3.5 - u * 2);
      px = x;
      py = y;
    }
    const verso = Math.atan2(yPunta - y0, xPunta - x0);
    for (let d = 0; d < 4; d++) {
      const lato = d - 1.5;
      const angolo = verso + lato * (0.2 + apre * 0.3);
      const x1 = xPunta + Math.cos(angolo) * 6, y1 = yPunta + Math.sin(angolo) * 6;
      const piega = angolo - lato * (1 - apre) * 0.7;
      tratto(xPunta, yPunta, x1, y1, 1.4);
      tratto(x1, y1, x1 + Math.cos(piega) * 5, y1 + Math.sin(piega) * 5, 0.8);
    }
  }

  function disegnaTratti(tratti) {
    for (const [colore, extra] of [[RIFLESSO_MANI, 1], [COLORE_MANI, 0]]) {
      ctx.fillStyle = colore;
      for (const [x, y, r] of tratti) {
        const lato = Math.max(1, Math.round((r + extra) * 2));
        ctx.fillRect(Math.round(x - lato / 2), Math.round(y - lato / 2), lato, lato);
      }
    }
  }

  function maniNere(s, ingresso, vista) {
    if (s.boss && !["arrivo", "frenata"].includes(s.boss.fase)) return;
    const quante = Math.min(braccia.length, (s.stage - PRIMO_STAGE_MANI + 1) * MANI_PER_STAGE);
    if (quante <= 0) return;

    const crescita = Math.min(3, s.stage - PRIMO_STAGE_MANI + 1);
    const furia = furiaMani(s.stage);
    const respiro = Math.sin(faseMani * 2) * 3;
    ctx.drawImage(ombra, -ombra.width + 34 + crescita * 14 + respiro + vista * 0.5, 0);

    // Puntano tutte a Zucco e si fermano prima di toccarlo. Con meno vite si fanno più vicine.
    const vicino = Math.max(DISTANZA_MINIMA, DISTANZA_MANI - crescita * 6 - (VITE - s.vite) * 7);
    const cx = X_ZUCCO + vista, cy = s.zucco.y - 14;
    const { tratti, tratto } = creaTratti();

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

      braccio(tratto, -8, b.y, xPunta, yPunta, tempo, 0.5 + 0.5 * Math.sin(tempo * 3.1 * (1 + (furia - 1) * 0.5)));
    }
    disegnaTratti(tratti);

    if (ingresso > 0) {
      ordaDiMostri(s, ingresso, vista);
      effetti.disegnaOrda(ctx, s, ingresso);
    }

  }

  /** Nel duello le mani entrano da tutti i lati, sempre di più. Si fermano ai bordi: chi colpisce è la manata. */
  function assedioDiMani(s, vista, sopra, dt) {
    const b = s.boss;
    if (!b) {
      assedioVisto = 0;
      return;
    }
    const voluto = b.fase === "duello" ? MANI_ASSEDIO[b.livello] : 0;
    const passo = MANI_AL_SECONDO * dt;
    assedioVisto += Math.max(-passo, Math.min(passo, voluto - assedioVisto));
    if (assedioVisto <= 0) return;

    ctx.globalAlpha = Math.min(1, assedioVisto / MANI_ASSEDIO[1]);
    ctx.drawImage(buioAssedio, 0, -sopra, W, H);
    ctx.globalAlpha = 1;

    const cx = X_ZUCCO + vista, cy = s.zucco.y - 14;
    const { tratti, tratto } = creaTratti();
    for (let i = 0; i < Math.ceil(assedioVisto); i++) {
      const m = assedio[i];
      const tempo = faseMani * m.ritmo + m.fase;
      const orizzontale = m.lato < 2;
      const x0 = orizzontale ? (m.lato === 0 ? -8 : W + 8) : m.dove * W;
      const y0 = orizzontale ? -sopra + m.dove * H * (m.lato === 1 ? QUOTA_MANI_DESTRA : 1) : m.lato === 2 ? -sopra - 8 : ALTEZZA + 8;
      const dx = cx - x0, dy = cy - y0, totale = Math.hypot(dx, dy);
      const entrata = Math.min(1, assedioVisto - i);
      const portata = PORTATA_ASSEDIO[m.lato] * m.lungo * entrata * (0.72 + 0.28 * Math.sin(tempo * 1.7));
      const xPunta = x0 + (dx / totale) * portata;
      const yPunta = y0 + (dy / totale) * portata + Math.sin(tempo * 21) * 1.2;
      braccio(tratto, x0, y0, xPunta, yPunta, tempo, 0.5 + 0.5 * Math.sin(tempo * 3.6));
    }
    disegnaTratti(tratti);
  }

  /** La bottiglia in mano allo scheletro: `inclina` da 0, dritta, a 1, che versa. */
  function bottiglia(x, y, inclina, colore) {
    const angolo = -1 + inclina * 1.5;
    const dx = Math.cos(angolo), dy = Math.sin(angolo);
    ctx.fillStyle = colore;
    for (let i = -3; i < 5; i++) ctx.fillRect(Math.round(x + dx * i) - 1, Math.round(y + dy * i) - 1, 3, 3);
    for (let i = 5; i < 9; i++) ctx.fillRect(Math.round(x + dx * i), Math.round(y + dy * i), 1, 1);
    return [x + dx * 9, y + dy * 9];
  }

  /** Il drink si prepara dietro il boss: in prima fase si versa, in seconda si mescola. */
  function disegnaScagnozzi(s, dt) {
    const b = s.boss;
    if (!b || !["apertura", "duello", "morte"].includes(b.fase)) return;
    if (b.fase === "apertura") pienoVisto = PIENO_INIZIALE;
    const voluto = b.angelo || b.angeloBevuto ? 0.1 : b.livello > 0 ? 1 : PIENO_INIZIALE + ((1 - PIENO_INIZIALE) * (VITE_BOSS - b.viteMinime)) / VITE_PRIMA_FASE;
    pienoVisto += (voluto - pienoVisto) * Math.min(1, dt * 2.5);

    ctx.save();
    if (b.fase === "morte") ctx.translate(Math.min(1, b.t / 1.4) ** 2 * 90, 0);
    const verso = b.livello === 0 && b.fase === "duello";
    const mescola = b.livello === 1 && b.fase === "duello";
    const festa = b.angeloBevuto ? Math.round(Math.abs(Math.sin(faseOrda * 8)) * 3) : 0;

    // Una bottiglia alla volta: si alza, versa e torna giù.
    const giro = (faseOrda % GIRO_BOTTIGLIA) / GIRO_BOTTIGLIA;
    const inclina = verso ? Math.min(1, giro / 0.15, (1 - giro) / 0.15) : 0;
    const alzato = verso || b.angelo;
    const scheletro = scheletri[alzato ? 1 : 0];
    ctx.drawImage(scheletro, X_SCHELETRO - 10, SUOLO - scheletro.height + 2 - festa);
    if (verso) {
      const colore = BOTTIGLIE[Math.floor(faseOrda / GIRO_BOTTIGLIA) % BOTTIGLIE.length];
      const [xBocca, yBocca] = bottiglia(X_SCHELETRO + 9, SUOLO - 26, inclina, colore);
      if (inclina > 0.8) {
        ctx.fillStyle = colore;
        ctx.fillRect(Math.round(xBocca), Math.round(yBocca), 1, SUOLO - 6 - Math.round(yBocca));
      }
    }

    const piega = mescola ? (Math.sin(faseOrda * 7) > 0 ? 1 : 0) : 0;
    const zombi = zombie[piega];
    ctx.drawImage(zombi, X_ZOMBIE - 11, SUOLO - zombi.height + 2 - festa);

    const acqua = Math.round(pienoVisto * (ALTO_BOCCIA - 5));
    const xBoccia = X_BOCCIA - 14, yBoccia = SUOLO - ALTO_BOCCIA + 1;
    ctx.fillStyle = fraColori(LIQUIDO_CHIARO, LIQUIDO_AZZURRO, Math.min(1, pienoVisto * 1.4));
    for (let j = ALTO_BOCCIA - 1 - acqua; j < ALTO_BOCCIA - 1; j++) {
      const lato = rigaBoccia(j);
      ctx.fillRect(X_BOCCIA - lato + 1, yBoccia + j, lato * 2 - 2, 1);
    }
    if (mescola) {
      // Il mestolo gira nella boccia e il drink ribolle.
      const giroMestolo = faseOrda * 7;
      const xFondo = X_BOCCIA + Math.cos(giroMestolo) * 7, yFondo = SUOLO - 6 + Math.sin(giroMestolo) * 2;
      const xCima = X_ZOMBIE - 5, yCima = SUOLO - 30;
      ctx.fillStyle = "#c8a070";
      for (let k = 0; k <= 1; k += 0.04) ctx.fillRect(Math.round(xCima + (xFondo - xCima) * k), Math.round(yCima + (yFondo - yCima) * k), 2, 1);
      ctx.fillStyle = LIQUIDO_CHIARO;
      for (let i = 0; i < 5; i++) {
        const sale = (faseOrda * (0.9 + i * 0.13) + i * 0.37) % 1;
        ctx.fillRect(Math.round(X_BOCCIA + Math.sin(i * 2.1 + faseOrda * 3) * 8), Math.round(SUOLO - 2 - sale * 14), 1, 1);
      }
    }
    ctx.drawImage(boccia, xBoccia, yBoccia);
    ctx.restore();
  }

  /** Il calice sale dalla boccia alla mano dello scheletro, il boss lo prende e lo vuota. */
  function angeloInMano(bx, by, b) {
    const a = b.angelo;
    if (!a) return;
    const k = Math.min(1, a.t / TEMPI_ANGELO[a.stato]);
    const xSpalla = bx + 30, ySpalla = by - 80;
    const xPresa = X_SCHELETRO + 9, yPresa = SUOLO - 30;
    const xBocca = bx - 2, yBocca = by - 104;
    let x, y, arrivata, inclina = 0, posa = 0, sorsi = false;
    if (a.stato === "porta") {
      const sale = Math.min(1, k * 2);
      x = X_BOCCIA + (xPresa - X_BOCCIA) * sale;
      y = SUOLO - ALTO_BOCCIA + (yPresa - SUOLO + ALTO_BOCCIA) * sale;
      arrivata = Math.max(0, k * 2 - 1);
    } else {
      const va = Math.min(1, k / 0.35), beve = Math.max(0, (k - 0.35) / 0.65);
      x = xPresa + (xBocca - xPresa) * va;
      y = yPresa + (yBocca - yPresa) * va;
      arrivata = 1;
      inclina = -0.75 * Math.min(1, beve * 3);
      posa = Math.min(calici.length - 1, Math.floor(beve * calici.length));
      sorsi = beve > 0.2 && beve < 0.95;
    }
    if (arrivata > 0) {
      const { tratti, tratto } = creaTratti();
      braccio(tratto, xSpalla, ySpalla, xSpalla + (x - xSpalla) * arrivata, ySpalla + (y + 8 - ySpalla) * arrivata, faseMani, arrivata < 1 ? 1 : 0.15);
      disegnaTratti(tratti);
    }
    const img = calici[posa];
    ctx.save();
    ctx.translate(Math.round(x + (a.stato === "beve" ? 26 : 0)), Math.round(y));
    ctx.rotate(inclina);
    ctx.drawImage(img, -img.width, -img.height, img.width * 2, img.height * 2);
    ctx.restore();
    if (!sorsi) return;
    // Dal calice alla bocca: un filo azzurro che scende a gocce.
    ctx.fillStyle = LIQUIDO_AZZURRO;
    for (let i = 0; i < 6; i++) {
      const u = (faseOrda * 3 + i / 6) % 1;
      ctx.fillRect(Math.round(x + 12 - u * 12), Math.round(y - 12 + u * u * 14), 2, 2);
    }
  }

  /** Il ruggito si vede: onde che partono dalla bocca e vanno verso Zucco. */
  function ondeDelRuggito(b, x, y) {
    const passato = DURATA_RUGGITO - b.ruggito;
    ctx.fillStyle = "#ffb0a0";
    for (let i = 0; i < ONDE_RUGGITO; i++) {
      const raggio = 22 + ((passato * 230 + (i * RAGGIO_ONDE) / ONDE_RUGGITO) % RAGGIO_ONDE);
      ctx.globalAlpha = (1 - raggio / (RAGGIO_ONDE + 22)) * Math.min(1, b.ruggito * 3);
      for (let a = Math.PI * 0.6; a < Math.PI * 1.4; a += 3 / raggio) ctx.fillRect(Math.round(x + Math.cos(a) * raggio), Math.round(y + Math.sin(a) * raggio), 2, 2);
    }
    ctx.globalAlpha = 1;
  }

  /** La manata: prima la corsia lampeggia e la mano si carica sul bordo destro, poi la attraversa tutta. */
  function disegnaManate(s, vista) {
    for (const m of s.boss?.manate ?? []) disegnaManata(m, vista);
  }

  function disegnaManata(m, vista) {
    const y = CORSIE[m.corsia];
    const destra = W - vista + 12;

    if (m.stato === "avviso") {
      ctx.fillStyle = ROSSO_AVVISO;
      ctx.globalAlpha = Math.floor(m.t * 12) % 2 ? 0.42 : 0.18;
      ctx.fillRect(-vista, y - LATO_CORSIA, W, LATO_CORSIA * 2);
      ctx.globalAlpha = 0.85;
      const scorre = Math.floor(m.t * 90) % 24;
      for (let x = destra - scorre; x > -vista; x -= 24)
        for (let i = 0; i < 7; i++) {
          ctx.fillRect(x - 7 + i, y - i, 2, 1);
          ctx.fillRect(x - 7 + i, y + i, 2, 1);
        }
      ctx.globalAlpha = 1;
    }

    const { tratti, tratto } = creaTratti();
    let px = destra, py = y;
    const passi = Math.max(1, Math.ceil((destra - m.x) / 14));
    for (let i = 1; i <= passi; i++) {
      const u = i / passi;
      const x = destra + (m.x - destra) * u;
      const ondeggia = Math.sin(u * 9 + faseMani * 6) * 4 * Math.sin(u * Math.PI);
      tratto(px, py, x, y + ondeggia, BRACCIO_MANATA - u * 1.5);
      px = x;
      py = y + ondeggia;
    }
    tratto(m.x + 4, y, m.x - 4, y, 8);

    // Le dita stanno aperte finché cerca, e si chiudono a pugno quando arriva in fondo.
    const aperta = m.stato === "presa" ? 0.15 : m.stato === "torna" ? 0.3 : 1;
    for (let d = 0; d < 4; d++) {
      const lato = d - 1.5;
      const angolo = Math.PI + lato * (0.12 + aperta * 0.24);
      const lungo = 7 + aperta * 8;
      const x1 = m.x + Math.cos(angolo) * lungo, y1 = y + Math.sin(angolo) * lungo;
      const piega = angolo - lato * (1 - aperta) * 0.8;
      tratto(m.x - 4, y + lato * 3, x1, y1, 2.4);
      tratto(x1, y1, x1 + Math.cos(piega) * 7, y1 + Math.sin(piega) * 7, 1.4);
    }
    disegnaTratti(tratti);
  }

  /** Elef sta dietro il colmo del tetto: il disegno della casa gli copre le gambe finché non è salito. */
  function disegnaElef(e) {
    const uscito = e.stato === "sale" ? e.t / TEMPI_ELEF.sale : e.stato === "scende" ? 1 - e.t / TEMPI_ELEF.scende : 1;
    const posa = { sale: 0, mira: 1, lancia: 2, scende: 3 }[e.stato];
    const img = elef[posa];
    ctx.drawImage(img, Math.round(X_ELEF - img.width / 2 + 4), Math.round(Y_ELEF + 3 - img.height * uscito));
  }

  function nomeElef(e) {
    if (e.stato === "sale" && e.t < TEMPI_ELEF.sale * 0.6) return;
    scrivi("ELEF", X_ELEF + 2, Y_ELEF - 30, { centro: true, colore: COLORE_BRAND });
  }

  /** Il finale, disegnato nel mondo: la casa, le piattaforme, il boss e tutto quello che vola. */
  function disegnaCasa(s) {
    const b = s.boss;
    if (!b || b.casaX === null) return;
    const forza = effetti.scosseAttive ? forzaTerremoto(b) : 0;
    const x = Math.round(b.casaX + (Math.random() - 0.5) * forza * 3);
    const y = SUOLO - casa.height + 1;
    if (b.elef) disegnaElef(b.elef);
    ctx.drawImage(casa, x, y);
    if (b.elef) nomeElef(b.elef);
    // Il terremoto fa saltare la luce, e mentre lui balza la casa resta al buio.
    ctx.fillStyle = "#1c1228";
    LUCI_CASA.forEach(([lx, ly, largo, alto], i) => {
      if (b.fase === "balzo" || guizzo(b.t, i) < forza * 0.75) ctx.fillRect(x + lx, y + ly, largo, alto);
    });
  }

  function disegnaPiattaforme(s) {
    const k = s.boss?.apertura ?? 0;
    if (k <= 0) return;
    const img = sprite.piattaforma[0];
    const scala = LARGO_PIATTAFORMA / img.width;
    for (const y of PIATTAFORME) ctx.drawImage(img, X_PIATTAFORMA, Math.round(y + 1 + (1 - k) * 40), img.width * scala, img.height);
  }

  function posizioneBoss(b) {
    if (b.fase === "balzo") {
      const k = Math.min(1, b.t);
      return { x: -130 + (X_ATTERRAGGIO + 130) * k, y: SUOLO - Math.sin(k * Math.PI) * 46 };
    }
    return { x: X_ATTERRAGGIO + (X_BOSS - X_ATTERRAGGIO) * b.apertura, y: SUOLO };
  }

  function coronaDiMani(bx, by) {
    const { tratti, tratto } = creaTratti();
    const cx = bx, cy = by - 74;
    for (const m of corona) {
      const tempo = faseMani * m.ritmo + m.fase;
      const a = m.angolo + Math.sin(tempo * 1.3) * 0.14;
      const lungo = m.lungo * (0.8 + 0.2 * Math.sin(tempo * 1.9));
      braccio(tratto, cx + Math.cos(a) * 22, cy + Math.sin(a) * 22, cx + Math.cos(a) * lungo, cy + Math.sin(a) * lungo, tempo, 0.5 + 0.5 * Math.sin(tempo * 3.4));
    }
    disegnaTratti(tratti);
  }

  /** Il lancio parte da una delle sue mani: si protende alla quota giusta con il colpo in pugno e lo scaglia. */
  function manoCheLancia(bx, by, b) {
    const lancio = b.carica ?? b.lanciato;
    if (!lancio) return;
    const y = CORSIE[lancio.corsia];
    const k = b.carica ? 1 - b.carica.t / PREAVVISO_LANCIO : 1;
    const xPunta = bx - 30 + (X_LANCIO - bx + 30) * k * k;
    const { tratti, tratto } = creaTratti();
    braccio(tratto, bx - 16, by - 76, xPunta, y, faseMani, b.carica ? 0.05 : 1);
    disegnaTratti(tratti);
    if (!b.carica) return;
    const nome = b.carica.tipo === "pipistrello" ? "pipistrello" : `lancio_${b.carica.tipo}`;
    const img = evidenti[nome][0];
    ctx.drawImage(img, Math.round(xPunta - img.width / 2 - 4), Math.round(y - img.height / 2));
  }

  function disegnaBoss(s) {
    const b = s.boss;
    if (!b || FASI_SENZA_BOSS.includes(b.fase)) return;
    const { x, y } = posizioneBoss(b);
    const fine = b.fase === "morte" ? Math.min(1, b.t / 2.4) : 0;
    const respiro = Math.sin(faseMani * 2.2) * 2;
    const sporge = sporgenza(b);
    const sobbalzo = b.colpito > 0 || sporge > 0.5 ? Math.round((Math.random() - 0.5) * 6) : 0;
    const bx = Math.round(x + sobbalzo);
    const by = Math.round(y + fine * 50);

    ctx.save();
    ctx.globalAlpha = 1 - fine;
    // Si piega dai piedi verso Zucco e sembra venirgli addosso.
    if (sporge > 0) {
      ctx.translate(bx, by);
      ctx.transform(1, 0, INCLINAZIONE_RUGGITO * sporge, 1, 0, 0);
      ctx.scale(1 + CRESCITA_RUGGITO * sporge, 1 + CRESCITA_RUGGITO * sporge);
      ctx.translate(-bx, -by);
    }
    coronaDiMani(bx, by);
    ctx.drawImage(corpoBoss, bx - corpoBoss.width / 2, by - corpoBoss.height + 1);
    const volti = sprite.boss_volto;
    const espressione = b.colpito > 0 || fine > 0 ? 2 : b.carica || b.fase === "spinta" || sporge > 0 || b.angelo?.stato === "beve" ? 1 : 0;
    ctx.drawImage(volti[espressione % volti.length], bx - 32, Math.round(by - 150 + respiro));

    const mani = sprite.boss_mano;
    const destra = mani[0];
    ctx.drawImage(destra, bx + 26, Math.round(by - 76 - respiro));
    ctx.save();
    ctx.translate(bx - 26, Math.round(by - 66 + respiro));
    ctx.scale(-1, 1);
    ctx.drawImage(mani[0], 0, 0);
    ctx.restore();
    manoCheLancia(bx, by, b);
    if (b.colpito > 0) {
      ctx.globalCompositeOperation = "lighter";
      ctx.globalAlpha = 0.55;
      ctx.drawImage(volti[2 % volti.length], bx - 32, Math.round(by - 150 + respiro));
      ctx.globalCompositeOperation = "source-over";
    }
    // Quando si cura il corpo si accende di rosso, poi si spegne.
    if (b.curato > 0) {
      ctx.globalCompositeOperation = "lighter";
      ctx.globalAlpha = Math.min(1, b.curato * 1.6) * (Math.floor(b.curato * 14) % 2 ? 0.8 : 0.45);
      ctx.drawImage(corpoBoss, bx - corpoBoss.width / 2, by - corpoBoss.height + 1);
      ctx.drawImage(volti[1 % volti.length], bx - 32, Math.round(by - 150 + respiro));
      ctx.globalCompositeOperation = "source-over";
    }
    angeloInMano(bx, by, b);
    ctx.restore();
    if (sporge > 0) ondeDelRuggito(b, bx - 66 * sporge, by - 112);
  }

  /** La vita di Elef: vola, si posa e negli ultimi istanti lampeggia. La barretta dice quanto le resta. */
  function disegnaVitaDiElef(s) {
    const v = s.boss?.vita;
    if (!v) return;
    const resta = VOLO_VITA + DURATA_VITA - v.t;
    if (resta < 1 && Math.floor(resta * 10) % 2) return;
    const x = Math.round(v.x), y = Math.round(v.y + (v.atterrata ? Math.sin(v.t * 6) * 1.5 : 0));
    const w = vitaInVolo.width * 2, h = vitaInVolo.height * 2;
    ctx.fillStyle = "#fff3b0";
    ctx.globalAlpha = 0.12;
    for (const raggio of [14, 19]) {
      ctx.beginPath();
      ctx.arc(x, y, raggio + Math.sin(v.t * 9), 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    ctx.drawImage(vitaInVolo, x - w / 2, y - h / 2, w, h);
    if (!v.atterrata) return;
    ctx.fillStyle = "#160f1e";
    ctx.fillRect(x - 10, y - h / 2 - 5, 20, 3);
    ctx.fillStyle = "#fff3b0";
    ctx.fillRect(x - 9, y - h / 2 - 4, Math.round(18 * (resta / DURATA_VITA)), 1);
  }

  function disegnaProiettili(s) {
    const b = s.boss;
    if (!b) return;
    if (b.mazzaX !== null) {
      const k = b.fase === "spinta" ? Math.min(1, b.t / 0.9) : 1;
      const img = sprite.mazza[0];
      const salto = Math.abs(Math.sin(k * Math.PI * 2)) * (1 - k) * 34;
      ctx.drawImage(img, Math.round(b.mazzaX - img.width / 2), Math.round(SUOLO - img.height - salto));
    }
    for (const p of b.proiettili) {
      const nome = p.tipo === "pipistrello" ? "pipistrello" : `lancio_${p.tipo}`;
      const fotogrammi = evidenti[nome];
      const img = fotogrammi[Math.floor(p.fase * 2) % fotogrammi.length];
      const x = Math.round(p.x - img.width / 2), y = Math.round(p.y - img.height / 2);
      ctx.drawImage(img, x, y);
      if (p.stato === "ritorno") {
        ctx.globalCompositeOperation = "lighter";
        ctx.globalAlpha = 0.7;
        ctx.drawImage(img, x, y);
        ctx.fillStyle = "#ffb52e";
        ctx.fillRect(x - 12, y + 4, 12, 2);
        ctx.globalAlpha = 1;
        ctx.globalCompositeOperation = "source-over";
      }
    }
  }

  /** Quanti homerun mancano ai pipistrelli, sotto la barra del boss: senza, la regola non si capirebbe. */
  function contoHomerun(b) {
    if (b.fase !== "duello") return;
    if (b.homerun >= HOMERUN_PER_PIPISTRELLO) {
      if (Math.floor(faseOrda * 5) % 2) scrivi("PIPISTRELLI!", W / 2, 35, { centro: true, colore: "#ffe45e" });
      return;
    }
    scrivi("HOMERUN", W / 2 - 8, 35, { centro: true, colore: "#c3c1d4" });
    for (let i = 0; i < HOMERUN_PER_PIPISTRELLO; i++) {
      const x = W / 2 + 19 + i * 8;
      ctx.fillStyle = "#160f1e";
      ctx.fillRect(x - 1, 35, 7, 7);
      ctx.fillStyle = i < b.homerun ? "#ffe45e" : "#3b2a52";
      ctx.fillRect(x, 36, 5, 5);
    }
  }

  function hudBoss(s) {
    const b = s.boss;
    if (!b || !["duello", "morte"].includes(b.fase)) return;
    scrivi("PADRONE DELLE MANI", W / 2, 16, { centro: true, colore: "#ff6b5e" });
    const largo = VITE_BOSS * 11;
    for (let i = 0; i < VITE_BOSS; i++) {
      ctx.fillStyle = "#160f1e";
      ctx.fillRect(W / 2 - largo / 2 + i * 11 - 1, 25, 10, 7);
      const ripresa = b.curato > 0 && i >= b.vite - b.ripresa && i < b.vite && Math.floor(b.curato * 12) % 2;
      ctx.fillStyle = ripresa ? "#ffffff" : i < b.vite ? "#ff3b3b" : "#3b1a26";
      ctx.fillRect(W / 2 - largo / 2 + i * 11, 26, 8, 5);
    }
    contoHomerun(b);
    if (b.scritta) {
      const passato = 1.3 - b.scritta.t;
      const su = Math.round(Math.max(0, 1 - passato * 5) * 16);
      const colore = Math.floor(passato * 12) % 2 ? "#ffe45e" : "#ff6fa8";
      scrivi(b.scritta.testo, W / 2, 48 + su, { centro: true, colore, scala: 3 });
    }
  }

  /** La mezzaluna dietro la punta della mazza: sottile dove è già passata, piena dove sta arrivando. */
  function sciaMazza(x, y, tick) {
    const inizio = Math.max(2, tick - SCIA_SWING);
    ctx.fillStyle = "#fff3b0";
    for (let t = inizio; t < tick; t++) {
      const da = ANGOLI_SWING[t], a = ANGOLI_SWING[t + 1];
      for (let k = 0; k < 1; k += 0.06) {
        const u = (t - inizio + k) / (tick - inizio);
        const angolo = ((da + (a - da) * k) * Math.PI) / 180;
        ctx.globalAlpha = 0.25 + 0.65 * u;
        for (let r = RAGGIO_SCIA - SPESSORE_SCIA * u; r <= RAGGIO_SCIA; r++) ctx.fillRect(Math.round(x + Math.cos(angolo) * r), Math.round(y + Math.sin(angolo) * r), 1, 1);
      }
    }
    ctx.globalAlpha = 1;
  }

  function disegnaZucco(s) {
    const z = s.zucco;
    const y = Math.round(z.y);
    const tickSwing = z.swing > 0 ? ANGOLI_SWING.length - z.swing : 0;
    const spinta = Math.round(s.boss?.spinta ?? 0) + (SLANCIO_SWING[tickSwing] ?? 0);
    if (z.stato === "ko") {
      const img = sprite.zucco_ko[0];
      ctx.drawImage(img, X_ZUCCO - 7, Math.round(z.y) - img.height + 1);
      return;
    }
    if (s.graziaT > 0 && Math.floor(s.tick / 4) % 2) return;

    let img;
    if (z.stato === "scivola") img = sprite.zucco_scivola[Math.floor(s.tick / 6) % sprite.zucco_scivola.length];
    else if (z.stato === "aria") img = (z.vy < 0 ? sprite.zucco_sale : sprite.zucco_scende)[0];
    else img = sprite.zucco_corsa[s.velocita > 0 ? Math.floor(s.distanza / 13) % sprite.zucco_corsa.length : 0];

    const x = X_ZUCCO - Math.floor(img.width / 2) + spinta;
    ctx.drawImage(img, x, y - img.height + 1);
    if (z.conMazza) {
      // Le mani girano attorno al petto insieme alla mazza, e il braccio le segue.
      const pose = sprite.mazza_in_mano;
      const angolo = (ANGOLI_SWING[tickSwing] * Math.PI) / 180;
      const xMani = X_ZUCCO + 3 + spinta + Math.round(Math.cos(angolo) * GIRO_MANI);
      const yMani = y - 14 + Math.round(Math.sin(angolo) * GIRO_MANI);
      if (tickSwing >= 3 && tickSwing <= 9) sciaMazza(xMani, yMani, tickSwing);
      const posa = pose[Math.floor((tickSwing / ANGOLI_SWING.length) * pose.length)];
      ctx.drawImage(posa, xMani - posa.width / 2, yMani - posa.height / 2);
      const xSpalla = X_ZUCCO - 1 + spinta, ySpalla = y - 15;
      ctx.fillStyle = COLORE_BRACCIO;
      for (let k = 0; k < 1; k += 0.2) ctx.fillRect(Math.round(xSpalla + (xMani - xSpalla) * k), Math.round(ySpalla + (yMani - ySpalla) * k), 2, 2);
      ctx.fillStyle = COLORE_MANO;
      ctx.fillRect(xMani - 1, yMani - 1, 3, 3);
    }
    if (s.lunaT > 0 && Math.floor(s.tick / 3) % 2) {
      ctx.globalCompositeOperation = "lighter";
      ctx.globalAlpha = 0.6;
      ctx.drawImage(img, x, y - img.height + 1);
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = "source-over";
    }
  }

  /** Dalla prima scossa Zucco ha capito che qualcosa non va. */
  function allarme(s) {
    const b = s.boss;
    if (b?.fase !== "silenzio" || b.t < PRESAGIO) return;
    scrivi("!", X_ZUCCO, Math.round(s.zucco.y) - 46, { centro: true, colore: "#ffe45e", scala: 2 });
  }

  function disegnaDolce(d, i, s) {
    const nomi = ["caramella_rosa", "caramella_verde", "caramella_gialla"];
    const f = sprite[nomi[Math.abs(Math.round(d.y + d.x / 40 + i)) % 3]] ?? sprite.caramella_rosa;
    const img = f[Math.floor(s.tick / 10) % f.length];
    ctx.drawImage(img, Math.round(d.x - img.width / 2), Math.round(d.y - img.height / 2 + Math.sin(s.tick / 9 + i) * 1.4));
  }

  /** Il moltiplicatore sta accanto alla barra delle caramelle, e diventa rosso per un attimo quando scende. */
  function mostraMoltiplicatore(s, x, dt) {
    if (s.moltiplicatore < moltiplicatoreVisto) caloMoltiplicatore = 0.4;
    if (s.moltiplicatore >= moltiplicatoreVisto + 0.05) saltoMoltiplicatore = 0.6;
    moltiplicatoreVisto = s.moltiplicatore;
    caloMoltiplicatore = Math.max(0, caloMoltiplicatore - dt);
    saltoMoltiplicatore = Math.max(0, saltoMoltiplicatore - dt);
    const colore = caloMoltiplicatore > 0 ? "#ff5e5e" : saltoMoltiplicatore > 0 ? "#7dffb0" : s.moltiplicatore > 1 ? "#ffe45e" : "#c3c1d4";
    scrivi(`X${s.moltiplicatore.toFixed(2)}`, x, 6, { colore });
  }

  /** A quarti la zucchetta da sola non basta: sotto compare una tacca per ogni quarto di vita. */
  function tacchePerVite(s) {
    const tacche = VITE * TACCHE_PER_VITA;
    for (let i = 0; i < tacche; i++) {
      const x = 6 + i * TACCA_VITA + Math.floor(i / TACCHE_PER_VITA);
      ctx.fillStyle = "#160f1e";
      ctx.fillRect(x - 1, 25, TACCA_VITA + 1, 5);
      ctx.fillStyle = i < s.vite * TACCHE_PER_VITA ? "#ffb52e" : "#3b2a52";
      ctx.fillRect(x, 26, TACCA_VITA - 1, 3);
    }
  }

  function hud(s, record, dt) {
    scrivi(String(punteggio(s)).padStart(6, "0"), W - 6, 6, { destra: true, colore: "#ffe45e" });
    if (record > 0)
      scrivi(`REC ${String(record).padStart(6, "0")}`, W - 6, 16, { destra: true, colore: "#c3c1d4" });

    scrivi(s.boss ? "FINALE" : `STAGE ${s.stage}`, W / 2, 6, { centro: true, colore: "#c3c1d4" });
    for (let i = 0; i < VITE; i++) {
      // Nel duello si perde a quarti: la zucchetta resta spenta per la parte che manca.
      const piena = sprite.vita[0];
      const parte = Math.ceil(piena.width * Math.max(0, Math.min(1, s.vite - i)));
      ctx.drawImage(sprite.vita_persa[0], 6 + i * 11, 16);
      if (parte > 0) ctx.drawImage(piena, 0, 0, parte, piena.height, 6 + i * 11, 16, parte, piena.height);
    }
    if (s.boss) tacchePerVite(s);
    for (let i = 0; i < LUNE_PER_PREMIO; i++) {
      ctx.fillStyle = i < s.lunePulite ? "#fff3b0" : "#3b2a52";
      ctx.fillRect(41 + i * 6, 18, 4, 4);
    }

    const x = 22, y = 8, largo = 60;
    ctx.drawImage(sprite.caramella_rosa[1], 6, 5);
    ctx.fillStyle = "#160f1e";
    ctx.fillRect(x - 1, y - 1, largo + 2, 6);
    ctx.fillStyle = "#3b2a52";
    ctx.fillRect(x, y, largo, 4);
    if (s.lunaT > 0) {
      ctx.fillStyle = Math.floor(s.tick / 5) % 2 ? "#fff3b0" : "#ffb52e";
      ctx.fillRect(x, y, Math.round(largo * (s.lunaT / 6)), 4);
      scrivi("LUNA PIENA!", W / 2, 16, { centro: true, colore: "#fff3b0" });
    } else {
      ctx.fillStyle = "#ff6fa8";
      ctx.fillRect(x, y, Math.round(largo * (s.luna / CARAMELLE_LUNA)), 4);
      ctx.fillStyle = "#ffb2cf";
      ctx.fillRect(x, y, Math.round(largo * (s.luna / CARAMELLE_LUNA)), 1);
    }
    mostraMoltiplicatore(s, x + largo + 5, dt);
    if (effetti.annuncio) scrivi(effetti.annuncio, W / 2, 30, { centro: true, colore: "#fff3b0", scala: 2 });
  }

  function cartelloStage(s) {
    const trascorso = s.t - (s.stage - 1) * DURATA_STAGE;
    if (s.stage === 1 || s.boss || trascorso > 1.7) return;
    if (trascorso > 1.2 && Math.floor(s.tick / 4) % 2) return;
    scrivi(`STAGE ${s.stage}`, LARGHEZZA / 2, 56, { centro: true, colore: "#ffe45e", scala: 3 });
  }

  function velo(passaggio) {
    ctx.globalCompositeOperation = "multiply";
    ctx.fillStyle = ATTI[passaggio.da].velo;
    ctx.fillRect(0, -60, W, ALTEZZA + 60);
    if (passaggio.k > 0) {
      ctx.globalAlpha = passaggio.k;
      ctx.fillStyle = ATTI[passaggio.a].velo;
      ctx.fillRect(0, -60, W, ALTEZZA + 60);
      ctx.globalAlpha = 1;
    }
    ctx.globalCompositeOperation = "source-over";
  }

  // Il fondo si spegne stage dopo stage. Sta sotto gli sprite, che così spiccano di più.
  function incupisci(s) {
    ctx.globalAlpha = 0.45 * cupezza(s.t);
    ctx.fillStyle = "#05020a";
    ctx.fillRect(0, -60, W, ALTEZZA + 60);
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

  const film = creaCinematica({ ctx, sprite, effetti, casa, cielo: strati[1].cielo, suolo, scrivi });

  return {
    /** Dopo la vittoria: niente HUD, solo la scena al tempo `t`. */
    cinematica(t) {
      if (canvas.width !== LARGHEZZA) {
        canvas.width = LARGHEZZA;
        canvas.height = ALTEZZA;
        ctx.imageSmoothingEnabled = false;
      }
      film.disegna(t);
    },

    disegna(s, { record = 0, titolo = false, dt = 0 } = {}) {
      const passaggio = passaggioAtti(s.t);
      const ruggito = s.boss ? sporgenza(s.boss) * 3.5 : 0;
      const tremaTerra = effetti.scosseAttive ? Math.max(forzaTerremoto(s.boss) * 4.5, ruggito) : 0;
      const scossa = Math.max(effetti.scossa, tremaTerra);
      const ingresso = ingressoOrda(s.t);

      // La visuale si allarga mostrando più pixel, non rimpicciolendoli: la grafica resta nitida.
      // Nel duello torna tutta a sinistra, così dietro il boss resta posto per gli scagnozzi.
      const apertura = s.boss?.apertura ?? 0;
      const vista = Math.round(VISTA_AVANTI * ingresso * (1 - apertura));
      W = LARGHEZZA + 2 * Math.round(40 * apertura);
      H = Math.round((W * ALTEZZA) / LARGHEZZA);
      if (canvas.width !== W) {
        canvas.width = W;
        canvas.height = H;
        ctx.imageSmoothingEnabled = false;
      }
      const sopra = H - ALTEZZA;
      // Le fasi si accumulano: al cambio di stage le mani accelerano senza fare salti.
      faseMani += dt * furiaMani(s.stage);
      faseOrda += dt;

      ctx.save();
      if (sopra > 0) {
        ctx.fillStyle = ATTI[passaggio.a].cielo[0];
        ctx.fillRect(0, 0, W, sopra + 2);
      }
      ctx.translate(0, sopra);
      if (scossa > 0.2) ctx.translate(Math.round((Math.random() - 0.5) * scossa * 2), Math.round((Math.random() - 0.5) * scossa * 2));

      cielo(s, passaggio);
      paesaggio(s, passaggio);
      // La tinta dell'atto resta sotto gli sprite: quello che uccide deve leggersi sempre.
      velo(passaggio);
      incupisci(s);

      ctx.save();
      ctx.translate(vista, 0);
      disegnaCasa(s);
      disegnaPiattaforme(s);
      s.dolci.forEach((d, i) => !d.preso && disegnaDolce(d, i, s));
      for (const o of s.ostacoli) if (!o.rotto) disegnaOstacolo(o, s);
      disegnaScagnozzi(s, dt);
      disegnaBoss(s);
      disegnaProiettili(s);
      disegnaManate(s, vista);
      disegnaVitaDiElef(s);
      effetti.disegnaDietro(ctx, s);
      disegnaZucco(s);
      effetti.disegna(ctx);
      allarme(s);
      for (const r of effetti.scritte) if (!r.svanisce || Math.floor(r.t * 20) % 2) scrivi(r.testo, r.x, Math.round(r.y), { centro: true, colore: r.colore, scala: r.scala });
      ctx.restore();

      ripeti(primoPiano, 160, s.distanza * 1.3, ALTEZZA - 12);
      oscurita(s, vista);

      // Hanno paura di quello che sta per arrivare: Zucco può rallentare perché loro si ritirano.
      const fuga = s.boss?.fase === "frenata" ? Math.min(1, s.boss.t / RITIRATA_MANI) ** 2 : 0;
      ctx.save();
      ctx.translate(-170 * fuga, 0);
      maniNere(s, ingresso, vista);
      ctx.restore();
      assedioDiMani(s, vista, sopra, dt);

      // Il muro passa sopra la scena, ma Zucco deve restare sempre leggibile.
      if (s.stage >= PRIMO_STAGE_MANI && !s.boss) {
        ctx.save();
        ctx.translate(vista, 0);
        disegnaZucco(s);
        ctx.restore();
      }
      ctx.restore();

      if (titolo) {
        scrivi("LA FUGA DI", W / 2, 26, { centro: true, colore: "#fff3b0", scala: 2 });
        scrivi("ZUCCO", W / 2, 46, { centro: true, colore: "#f59a2e", scala: 5 });
      } else {
        hud(s, record, dt);
        cartelloStage(s);
        hudBoss(s);
      }
    },

    scrivi,
  };
}
