// Logica di gioco pura: niente DOM, niente orologio, niente Math.random.
// Stesso seed + stessi input = stessa partita, così il server può rigiocarla per validare il punteggio.

import { TEMPO_BOSS, iniziaBoss, mazzata, passoBoss } from "./boss.js";
import {
  BUFFER_SALTO,
  DURATA_STAGE,
  GRAVITA,
  GRAVITA_PICCHIATA,
  GRAZIA_COLPO,
  IN,
  LARGHEZZA,
  SPINTA,
  SUOLO,
  TAGLIO_SALTO,
  TICK,
  TOLLERANZA_BORDO,
  VITE,
  X_ZUCCO,
} from "./costanti.js";
import { PIXEL_PER_PUNTO, caramellaPersa, caramellaPresa, guadagna, lunaAccesa, perdiVita } from "./punti.js";

export { ALTEZZA, DURATA_STAGE, IN, LARGHEZZA, SUOLO, TICK, VITE, X_ZUCCO } from "./costanti.js";

export const VERSIONE = 3;
export const CARAMELLE_LUNA = 20;

const DURATA_LUNA = 6;
const GRAZIA_LUNA = 1;
const VELOCITA_INIZIALE = 135;
const PASSO_STAGE = 32;
const RAMPA_STAGE = 1;
const TREGUA_STAGE = 1.3;
const PUNTI_CARAMELLA = 10;
const PUNTI_ROTTO = 100;
const CARAMELLA_SALTATA = 18;

const ZUCCO_IN_PIEDI = { w: 12, h: 24 };
const ZUCCO_SCIVOLA = { w: 18, h: 12 };

// `alta` è tarata sul tocco di un dito (~100 ms, salto di ~42 px): passa il salto corto, non quello pieno.
const QUOTE_PIPISTRELLO = { bassa: SUOLO - 10, media: SUOLO - 24, alta: SUOLO - 76 };

export const TIPI = {
  lapide: { w: 13, h: 19 },
  croce: { w: 11, h: 29 },
  recinto: { w: 34, h: 17 },
  mano: { w: 11, h: 22 },
  pipistrello: { w: 15, h: 9 },
  fantasma: { w: 14, h: 19 },
  ragno: { w: 12, h: 130 },
  // Più piccolo del disegno (46x46): il salto arriva a 52 px e il demone dev'essere superabile.
  demone: { w: 22, h: 34 },
};

// Ostacoli che escono da terra: `anticipo` è a quanti secondi da Zucco iniziano a salire.
const SPUNTANO = {
  mano: { anticipo: 0.75, ritmo: 5 },
  demone: { anticipo: 0.85, ritmo: 3 },
};

// `da`: stage in cui lo schema entra in gioco. Ogni parte è [tipo, distanza dalla prima, opzioni].
const SCHEMI = [
  { da: 1, peso: 5, parti: [["lapide", 0]] },
  { da: 1, peso: 3, parti: [["croce", 0]] },
  { da: 2, peso: 3, parti: [["recinto", 0]] },
  { da: 2, peso: 3, parti: [["pipistrello", 0, { quota: "bassa" }]] },
  { da: 2, peso: 3, parti: [["pipistrello", 0, { quota: "media" }]] },
  { da: 3, peso: 3, parti: [["ragno", 0]] },
  { da: 3, peso: 3, parti: [["mano", 0]] },
  { da: 4, peso: 3, parti: [["demone", 0]] },
  { da: 4, peso: 3, parti: [["fantasma", 0]] },
  { da: 5, peso: 2, parti: [["lapide", 0], ["lapide", 20]] },
  { da: 5, peso: 2, parti: [["lapide", 0], ["pipistrello", -2, { quota: "alta" }]] },
  { da: 6, peso: 2, parti: [["ragno", 0], ["ragno", 26]] },
];

const SCHIVATI_SCIVOLANDO = new Set(["ragno", "fantasma"]);

function generatore(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const interpola = (a, b, k) => a + (b - a) * k;

/** `daSecondo` fa partire la partita più avanti: serve solo a provare il finale, e il risultato resta segnato come prova. */
export function creaPartita(seed, alEvento = () => {}, { daSecondo = 0 } = {}) {
  return {
    seed,
    rng: generatore(seed),
    alEvento,
    prova: daSecondo > 0,
    tick: Math.round(daSecondo / TICK),
    t: daSecondo,
    velocita: 0,
    distanza: 0,
    punti: 0,
    moltiplicatore: 1,
    lunePulite: 0,
    caramelle: 0,
    rotti: 0,
    luna: 0,
    lunaT: 0,
    graziaT: 0,
    vite: VITE,
    stage: stageA(daSecondo),
    boss: null,
    vinta: false,
    finita: false,
    daGenerare: 260,
    ostacoli: [],
    dolci: [],
    input: [],
    tieniSalto: false,
    tieniGiu: false,
    zucco: { y: SUOLO, vy: 0, buffer: 0, bordo: TOLLERANZA_BORDO, stato: "corsa" },
  };
}

export const stageA = (t) => 1 + Math.floor(t / DURATA_STAGE);

// La velocità sale a gradini e non si ferma mai: nessuna partita deve poter durare per sempre.
function velocitaA(t) {
  const stage = stageA(t);
  const rampa = Math.min(1, (t - (stage - 1) * DURATA_STAGE) / RAMPA_STAGE);
  return VELOCITA_INIZIALE + PASSO_STAGE * Math.max(0, stage - 2 + rampa);
}

/** Da 0 a 1: quanto è calato il buio. Dallo stage 4, negli stage pari. La luna piena lo scaccia. */
export function livelloBuio(s) {
  if (s.lunaT > 0 || s.stage < 4 || s.stage % 2) return 0;
  const f = s.t - (s.stage - 1) * DURATA_STAGE;
  return Math.max(0, Math.min(1, f - 3, 17 - f));
}

export function scatolaZucco(z) {
  const m = z.stato === "scivola" ? ZUCCO_SCIVOLA : ZUCCO_IN_PIEDI;
  return { x: X_ZUCCO - m.w / 2, y: z.y - m.h, w: m.w, h: m.h };
}

export function scatolaOstacolo(o) {
  if (SPUNTANO[o.tipo]) {
    const h = o.h * o.salita;
    return { x: o.x, y: SUOLO - h, w: o.w, h };
  }
  return { x: o.x, y: o.y, w: o.w, h: o.h };
}

const sovrapposti = (a, b) => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;

function applicaComando(s, c) {
  if (c === IN.SALTO_GIU) {
    s.tieniSalto = true;
    s.zucco.buffer = BUFFER_SALTO;
  } else if (c === IN.SALTO_SU) s.tieniSalto = false;
  else if (c === IN.SCIVOLA_GIU) s.tieniGiu = true;
  else if (c === IN.SCIVOLA_SU) s.tieniGiu = false;
  else if (c === IN.MAZZA) mazzata(s);
}

function muoviZucco(s) {
  const z = s.zucco;
  const aTerra = z.y >= SUOLO;
  z.bordo = aTerra ? TOLLERANZA_BORDO : Math.max(0, z.bordo - 1);

  if (z.buffer > 0) {
    z.buffer--;
    if (z.bordo > 0) {
      z.vy = SPINTA;
      z.y = SUOLO - 0.01;
      z.bordo = 0;
      z.buffer = 0;
      s.alEvento({ tipo: "salto", x: X_ZUCCO, y: SUOLO });
    }
  }

  if (z.y < SUOLO) {
    if (!s.tieniSalto && z.vy < TAGLIO_SALTO) z.vy = TAGLIO_SALTO;
    z.vy += GRAVITA * (s.tieniGiu ? GRAVITA_PICCHIATA : 1) * TICK;
    z.y += z.vy * TICK;
    if (z.y >= SUOLO) {
      z.y = SUOLO;
      z.vy = 0;
      s.alEvento({ tipo: "atterra", x: X_ZUCCO, y: SUOLO });
    }
  }

  const prima = z.stato;
  z.stato = z.y < SUOLO ? "aria" : s.tieniGiu ? "scivola" : "corsa";
  if (z.stato === "scivola" && prima !== "scivola") s.alEvento({ tipo: "scivola", x: X_ZUCCO, y: SUOLO });
}

function nuovoOstacolo(tipo, x, opzioni = {}, rng) {
  const { w, h } = TIPI[tipo];
  const o = { tipo, x, y: SUOLO - h, w, h, rotto: false };
  if (tipo === "pipistrello") o.y = QUOTE_PIPISTRELLO[opzioni.quota] - h / 2;
  if (tipo === "ragno") o.y = 0;
  if (SPUNTANO[tipo]) {
    o.salita = 0;
    o.carica = 0;
    o.x0 = x;
  }
  if (tipo === "fantasma") o.fase = rng() * Math.PI * 2;
  return o;
}

function scegliSchema(s) {
  const disponibili = SCHEMI.filter((c) => c.da <= s.stage);
  let scelta = s.rng() * disponibili.reduce((n, c) => n + c.peso, 0);
  for (const c of disponibili) {
    scelta -= c.peso;
    if (scelta <= 0) return c;
  }
  return disponibili[0];
}

function aggiungiDolci(s, xCentro, sotto) {
  const quanti = 5;
  if (sotto) {
    for (let i = 0; i < quanti; i++)
      s.dolci.push({ x: xCentro + (i - 2) * 16, y: SUOLO - 7, preso: false });
    return;
  }
  const mezzo = s.velocita * 0.3;
  for (let i = 0; i < quanti; i++) {
    const k = (i - 2) / 2;
    s.dolci.push({ x: xCentro + k * mezzo, y: SUOLO - 14 - 38 * (1 - k * k), preso: false });
  }
}

function genera(s, spostamento) {
  s.daGenerare -= spostamento;
  if (s.daGenerare > 0) return;

  const schema = scegliSchema(s);
  const x0 = LARGHEZZA + 30;
  let fine = x0;
  for (const [tipo, dx, opzioni] of schema.parti) {
    const o = nuovoOstacolo(tipo, x0 + dx, opzioni, s.rng);
    s.ostacoli.push(o);
    if (tipo === "demone") s.alEvento({ tipo: "rune", x: o.x, y: SUOLO });
    fine = Math.max(fine, o.x + o.w);
  }

  const [primo] = schema.parti;
  if (s.rng() < 0.55 && !(primo[2]?.quota === "bassa"))
    aggiungiDolci(s, (x0 + fine) / 2, SCHIVATI_SCIVOLANDO.has(primo[0]) || primo[2]?.quota === "media");

  const difficolta = Math.min(1, (s.stage - 1) / 6);
  const pausa = interpola(1.3, 0.72, difficolta) + s.rng() * interpola(0.8, 0.4, difficolta);
  s.daGenerare = fine - x0 + s.velocita * pausa;
}

function scorri(s, spostamento) {
  const quanto = spostamento;
  for (const o of s.ostacoli) {
    o.x -= quanto;
    if (o.tipo === "fantasma") {
      o.x -= 25 * TICK;
      o.fase += 3.4 * TICK;
      o.y = 112 + Math.sin(o.fase) * 10 - o.h / 2;
    }
    const spunta = SPUNTANO[o.tipo];
    if (spunta) {
      const sveglia = X_ZUCCO + s.velocita * spunta.anticipo;
      o.carica = Math.min(1, (o.x0 - o.x) / Math.max(1, o.x0 - sveglia));
      if (o.x < sveglia) {
        if (o.salita === 0) s.alEvento({ tipo: o.tipo, x: o.x + o.w / 2, y: SUOLO });
        o.salita = Math.min(1, o.salita + spunta.ritmo * TICK);
      }
    }
    if (!o.passato && !o.rotto && o.x + o.w < X_ZUCCO - 6) {
      o.passato = true;
      s.alEvento({ tipo: "sfiora", ostacolo: o.tipo, x: X_ZUCCO - 30 });
    }
  }
  for (const d of s.dolci) {
    d.x -= quanto;
    if (!d.preso && !d.saltata && d.x < X_ZUCCO - CARAMELLA_SALTATA) {
      d.saltata = true;
      caramellaPersa(s, d);
    }
  }
  // Quando la vista si sposta in avanti la parte sinistra dello schermo arriva a x negative.
  s.ostacoli = s.ostacoli.filter((o) => o.x + o.w > -100);
  s.dolci = s.dolci.filter((d) => d.x > -100 && !d.preso);
}

function urti(s) {
  const scatola = scatolaZucco(s.zucco);

  for (const o of s.ostacoli) {
    if (o.rotto || !sovrapposti(scatola, scatolaOstacolo(o))) continue;
    if (s.lunaT > 0) {
      o.rotto = true;
      s.rotti++;
      guadagna(s, PUNTI_ROTTO);
      s.alEvento({ tipo: "rotto", x: o.x + o.w / 2, y: Math.max(o.y, SUOLO - 30), punti: Math.round(PUNTI_ROTTO * s.moltiplicatore) });
    } else if (s.graziaT <= 0) {
      o.rotto = true;
      perdiVita(s);
      s.graziaT = GRAZIA_COLPO;
      s.alEvento({ tipo: "urto", x: o.x + o.w / 2, y: SUOLO });
      if (s.vite > 0) continue;
      s.finita = true;
      s.zucco.stato = "ko";
      s.alEvento({ tipo: "ko", x: X_ZUCCO + 10, y: s.zucco.y - 14 });
      return;
    }
  }

  const presa = { x: scatola.x - 3, y: scatola.y - 3, w: scatola.w + 6, h: scatola.h + 6 };
  for (const d of s.dolci) {
    if (d.preso || !sovrapposti(presa, { x: d.x - 5, y: d.y - 3, w: 10, h: 6 })) continue;
    d.preso = true;
    s.caramelle++;
    guadagna(s, s.lunaT > 0 ? PUNTI_CARAMELLA * 2 : PUNTI_CARAMELLA);
    caramellaPresa(s);
    s.alEvento({ tipo: "caramella", x: d.x, y: d.y });
    // Nel finale la luna non si spegnerebbe più: le ultime caramelle valgono solo i loro punti.
    if (s.lunaT > 0 || s.boss) continue;
    s.luna++;
    if (s.luna >= CARAMELLE_LUNA) {
      s.luna = 0;
      s.lunaT = DURATA_LUNA;
      s.alEvento({ tipo: "luna", x: X_ZUCCO, y: s.zucco.y - 14 });
      lunaAccesa(s);
    }
  }
}

function aggiornaLuna(s) {
  if (s.lunaT > 0) {
    s.lunaT -= TICK;
    if (s.lunaT <= 0) {
      s.lunaT = 0;
      s.graziaT = GRAZIA_LUNA;
    }
  } else if (s.graziaT > 0) s.graziaT = Math.max(0, s.graziaT - TICK);
}

export function passo(s, comandi = []) {
  if (s.finita) return;
  for (const c of comandi) {
    s.input.push([s.tick, c]);
    applicaComando(s, c);
  }
  s.tick++;
  s.t = s.tick * TICK;

  if (!s.boss && s.t >= TEMPO_BOSS) iniziaBoss(s);
  if (s.boss) {
    passoBoss(s, { muoviZucco, scorri, urti });
    return;
  }

  s.velocita = velocitaA(s.t) * (s.lunaT > 0 ? 1.2 : 1);

  const stage = stageA(s.t);
  if (stage !== s.stage) {
    s.stage = stage;
    s.daGenerare = Math.max(s.daGenerare, s.velocita * TREGUA_STAGE);
    s.alEvento({ tipo: "stage", x: X_ZUCCO, y: SUOLO });
  }

  const spostamento = s.velocita * TICK;
  s.distanza += spostamento;
  guadagna(s, ((s.lunaT > 0 ? 2 : 1) * spostamento) / PIXEL_PER_PUNTO);

  muoviZucco(s);
  scorri(s, spostamento);
  genera(s, spostamento);
  aggiornaLuna(s);
  urti(s);
}

export const punteggio = (s) => Math.floor(s.punti);

/** Quello che il client manda al server a fine partita. */
export function risultato(s) {
  return {
    versione: VERSIONE,
    seed: s.seed,
    tick: s.tick,
    input: s.input,
    punteggio: punteggio(s),
    moltiplicatore: s.moltiplicatore,
    caramelle: s.caramelle,
    rotti: s.rotti,
    stage: s.stage,
    vite: s.vite,
    vinta: s.vinta,
    prova: s.prova,
  };
}

/** Rigioca una partita dagli input registrati. `limite` ferma una partita che non finisce mai. */
export function rigioca(seed, input, limite = 60 * 60 * 30) {
  const s = creaPartita(seed);
  let i = 0;
  while (!s.finita && s.tick < limite) {
    const comandi = [];
    while (i < input.length && input[i][0] === s.tick) comandi.push(input[i++][1]);
    passo(s, comandi);
  }
  return s;
}
