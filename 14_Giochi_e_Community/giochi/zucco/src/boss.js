// Il finale: la casa della festa, il Padrone delle Mani e il duello a mazzate.
// Come sim.js è logica pura: stesso seed e stessi input, stessa partita.

import {
  BUFFER_SALTO,
  DURATA_STAGE,
  GRAVITA,
  GRAVITA_PICCHIATA,
  GRAZIA_COLPO,
  SPINTA,
  SUOLO,
  TAGLIO_SALTO,
  TICK,
  TOLLERANZA_BORDO,
  X_ZUCCO,
} from "./costanti.js";
import { PIXEL_PER_PUNTO, guadagna, perdiVita } from "./punti.js";

export const TEMPO_BOSS = DURATA_STAGE * 10;
export const VITE_BOSS = 10;
export const X_BOSS = 290;
export const X_ATTERRAGGIO = 200;
export const X_LANCIO = X_BOSS - 60;
export const PIATTAFORME = [SUOLO - 40, SUOLO - 80];
export const CORSIE = [SUOLO - 14, PIATTAFORME[0] - 14, PIATTAFORME[1] - 14];
export const X_PIATTAFORMA = X_ZUCCO - 26;
export const LARGO_PIATTAFORMA = 60;

const FRENATA = 140;
const VELOCITA_PASSO = 50;
// Zucco cammina già quando la casa entra dal bordo destro, e gli ultimi pixel li fa rallentando.
const STRADA_A_PASSO = 250;
const ULTIMI_PASSI = 24;
const LUNGHEZZA_PASSO = 26;
const X_CASA_FERMA = 48;
const DURATE = { silenzio: 2, trema: 3.4, balzo: 1, spinta: 0.9, presa: 0.8, apertura: 1.2, morte: 2.8 };
export const DURATA_TERREMOTO = DURATE.trema;
export const PRESAGIO = 1;
const SPINTA_INDIETRO = 40;
const X_MAZZA = X_ZUCCO + 30;

const FINESTRA_MAZZATA = 10;
const RICARICA_MAZZATA = 22;
const PORTATA_VICINA = 6;
const PORTATA_LONTANA = 46;
const ALTEZZA_MAZZATA = 18;

export const PREAVVISO_LANCIO = 0.45;
const DURATA_MANO_APERTA = 0.28;
const QUOTA_PIPISTRELLI = 0.55;
const ALTRI_LANCI = ["osso", "teschio", "zucca"];

const PUNTI_MAZZATA = 50;
const PUNTI_FUORICAMPO = 100;
const PUNTI_COLPO_BOSS = 500;
const PUNTI_VITTORIA = 5000;
const PUNTI_VITA = 1000;
const PUNTI_RAPIDITA = 20;
const SECONDI_RAPIDITA = 90;
const DURATA_SCRITTA = 1.3;

export function iniziaBoss(s) {
  s.lunaT = 0;
  s.boss = {
    fase: "arrivo",
    t: 0,
    casaX: null,
    presagio: false,
    vite: VITE_BOSS,
    spinta: 0,
    mazzaX: null,
    apertura: 0,
    proiettili: [],
    carica: null,
    lanciato: null,
    prossimoLancio: 1.2,
    scritta: null,
    colpito: 0,
    durataDuello: 0,
  };
  s.alEvento({ tipo: "finale", x: X_ZUCCO, y: SUOLO });
}

function cambiaFase(s, fase) {
  s.boss.fase = fase;
  s.boss.t = 0;
}

const avanzamento = (b) => Math.min(1, b.t / DURATE[b.fase]);

/** Nelle scene Zucco non comanda: resta solo la gravità, per non lasciarlo a mezz'aria. */
function ricadi(z) {
  z.buffer = 0;
  if (z.y < SUOLO) {
    z.vy += GRAVITA * TICK;
    z.y = Math.min(SUOLO, z.y + z.vy * TICK);
    if (z.y >= SUOLO) z.vy = 0;
  }
  z.stato = z.y < SUOLO ? "aria" : "corsa";
}

/** Frena con costanza fino al passo, cammina, e negli ultimi pixel si ferma: arriva sempre davanti alla casa. */
function velocitaVersoCasa(casaX) {
  const resta = casaX - X_CASA_FERMA;
  if (resta < ULTIMI_PASSI) return VELOCITA_PASSO * Math.sqrt(Math.max(0, resta) / ULTIMI_PASSI);
  if (resta < STRADA_A_PASSO) return VELOCITA_PASSO;
  return Math.sqrt(VELOCITA_PASSO ** 2 + 2 * FRENATA * (resta - STRADA_A_PASSO));
}

/** Da 0 a 1, quanto trema la terra: è solo scena, la partita non lo legge. */
export function forzaTerremoto(b) {
  if (b?.fase !== "trema") return 0;
  const k = Math.min(1, b.t / DURATE.trema);
  // Arriva a ondate, e ogni ondata è più forte della precedente.
  return Math.min(1, 0.12 + k * k * (0.75 + 0.25 * Math.sin(b.t * 9)));
}

function muoviDuello(s) {
  const z = s.zucco;
  const appoggio = z.vy >= 0 && (z.y === SUOLO || PIATTAFORME.includes(z.y));
  z.bordo = appoggio ? TOLLERANZA_BORDO : Math.max(0, z.bordo - 1);

  if (z.buffer > 0) {
    z.buffer--;
    if (z.bordo > 0) {
      z.vy = SPINTA;
      z.y -= 0.01;
      z.bordo = 0;
      z.buffer = 0;
      s.alEvento({ tipo: "salto", x: X_ZUCCO, y: z.y });
    }
  }

  // Giù da una piattaforma: si attraversa solo quella, un tocco scende di un piano.
  if (s.tieniGiu && appoggio && z.y < SUOLO) {
    z.ignora = z.y;
    z.y += 0.5;
  }

  if (!PIATTAFORME.includes(z.y) && z.y !== SUOLO) {
    const prima = z.y;
    if (!s.tieniSalto && z.vy < TAGLIO_SALTO) z.vy = TAGLIO_SALTO;
    z.vy += GRAVITA * (s.tieniGiu ? GRAVITA_PICCHIATA : 1) * TICK;
    z.y += z.vy * TICK;
    for (const piano of [PIATTAFORME[1], PIATTAFORME[0], SUOLO])
      if (piano !== z.ignora && z.vy > 0 && prima <= piano && z.y >= piano) {
        z.y = piano;
        z.vy = 0;
        s.alEvento({ tipo: "atterra", x: X_ZUCCO, y: piano });
        break;
      }
    if (z.y > z.ignora + 2) z.ignora = null;
  }

  z.stato = z.y === SUOLO || PIATTAFORME.includes(z.y) ? "corsa" : "aria";
  z.ricarica = Math.max(0, (z.ricarica ?? 0) - 1);
  z.mazzata = Math.max(0, (z.mazzata ?? 0) - 1);
}

export function mazzata(s) {
  const b = s.boss;
  const z = s.zucco;
  if (b?.fase !== "duello" || z.ricarica > 0) return;
  z.mazzata = FINESTRA_MAZZATA;
  z.ricarica = RICARICA_MAZZATA;
  s.alEvento({ tipo: "colpoAria", x: X_ZUCCO, y: z.y });
}

function lancia(s) {
  const b = s.boss;
  const progresso = (VITE_BOSS - b.vite) / (VITE_BOSS - 1);
  if (b.carica) {
    b.carica.t -= TICK;
    if (b.carica.t > 0) return;
    const { tipo, corsia } = b.carica;
    b.proiettili.push({ tipo, x: X_LANCIO, y: CORSIE[corsia], vx: -(190 + 110 * progresso), vy: 0, stato: "vola", fase: s.rng() * 6 });
    s.alEvento({ tipo: "lancio", x: X_LANCIO, y: CORSIE[corsia] });
    b.carica = null;
    b.lanciato = { corsia, t: DURATA_MANO_APERTA };
    b.prossimoLancio = 1.9 - 0.9 * progresso;
    return;
  }
  b.prossimoLancio -= TICK;
  if (b.prossimoLancio > 0) return;
  const pipistrello = s.rng() < QUOTA_PIPISTRELLI;
  const tipo = pipistrello ? "pipistrello" : ALTRI_LANCI[Math.floor(s.rng() * ALTRI_LANCI.length)];
  // I pipistrelli arrivano all'altezza delle piattaforme, tutto il resto anche a terra.
  const corsia = pipistrello ? 1 + Math.floor(s.rng() * 2) : Math.floor(s.rng() * 3);
  b.carica = { tipo, corsia, t: PREAVVISO_LANCIO };
}

function colpisciBoss(s, p) {
  const b = s.boss;
  b.vite--;
  b.colpito = 0.3;
  guadagna(s, PUNTI_COLPO_BOSS);
  s.alEvento({ tipo: "bossColpito", x: X_BOSS - 10, y: p.y + 24 });
  if (b.vite > 0) return;
  b.proiettili = [];
  b.carica = null;
  cambiaFase(s, "morte");
  s.alEvento({ tipo: "bossMuore", x: X_BOSS, y: SUOLO });
}

function muoviProiettili(s) {
  const b = s.boss;
  const z = s.zucco;
  const scatola = { x: X_ZUCCO - 6, y: z.y - 24, w: 12, h: 24 };

  for (const p of b.proiettili) {
    p.x += p.vx * TICK;
    p.y += p.vy * TICK;
    p.fase += 8 * TICK;

    if (p.stato === "vola") {
      const vicino = p.x > X_ZUCCO + PORTATA_VICINA - 8 && p.x < X_ZUCCO + PORTATA_LONTANA;
      if (z.mazzata > 0 && vicino && Math.abs(p.y - (z.y - 14)) <= ALTEZZA_MAZZATA) {
        z.mazzata = 0;
        if (p.tipo === "pipistrello") {
          p.stato = "ritorno";
          p.vx = 460;
          guadagna(s, PUNTI_MAZZATA);
          s.alEvento({ tipo: "mazzata", x: p.x, y: p.y });
        } else {
          p.stato = "fuori";
          p.vx = 300;
          p.vy = -520;
          guadagna(s, PUNTI_FUORICAMPO);
          b.scritta = { testo: "HOMERUUUNNN!!!", t: DURATA_SCRITTA };
          s.alEvento({ tipo: "fuoricampo", x: p.x, y: p.y });
        }
        continue;
      }
      const dentro = p.x - 7 < scatola.x + scatola.w && p.x + 7 > scatola.x && p.y - 5 < scatola.y + scatola.h && p.y + 5 > scatola.y;
      if (dentro && s.graziaT <= 0) {
        p.finito = true;
        perdiVita(s);
        s.graziaT = GRAZIA_COLPO;
        s.alEvento({ tipo: "urto", x: X_ZUCCO + 8, y: z.y });
        if (s.vite > 0) continue;
        s.finita = true;
        z.stato = "ko";
        s.alEvento({ tipo: "ko", x: X_ZUCCO + 10, y: z.y - 14 });
        return;
      }
    } else if (p.stato === "ritorno" && p.x >= X_BOSS - 30) {
      p.finito = true;
      colpisciBoss(s, p);
      if (b.fase !== "duello") return;
    }
  }
  b.proiettili = b.proiettili.filter((p) => !p.finito && p.x > -30 && p.y > -80);
}

function vince(s) {
  const b = s.boss;
  guadagna(s, PUNTI_VITTORIA + s.vite * PUNTI_VITA + Math.max(0, SECONDI_RAPIDITA - b.durataDuello) * PUNTI_RAPIDITA);
  s.vinta = true;
  s.finita = true;
  s.alEvento({ tipo: "vittoria", x: X_ZUCCO, y: SUOLO });
}

/** `corsa` sono le funzioni di sim.js che servono finché Zucco sta ancora correndo verso la casa. */
export function passoBoss(s, corsa) {
  const b = s.boss;
  b.t += TICK;
  b.colpito = Math.max(0, b.colpito - TICK);
  if (s.graziaT > 0) s.graziaT = Math.max(0, s.graziaT - TICK);
  if (b.lanciato) {
    b.lanciato.t -= TICK;
    if (b.lanciato.t <= 0) b.lanciato = null;
  }
  if (b.scritta) {
    b.scritta.t -= TICK;
    if (b.scritta.t <= 0) b.scritta = null;
  }

  if (b.fase === "arrivo" || b.fase === "frenata") {
    if (b.fase === "frenata") s.velocita = Math.min(s.velocita, velocitaVersoCasa(b.casaX));
    const spostamento = s.velocita * TICK;
    const passi = Math.floor(s.distanza / LUNGHEZZA_PASSO);
    s.distanza += spostamento;
    guadagna(s, spostamento / PIXEL_PER_PUNTO);
    if (b.casaX !== null) b.casaX -= spostamento;
    corsa.muoviZucco(s);
    corsa.scorri(s, spostamento);
    corsa.urti(s);
    if (s.finita) return;
    if (s.velocita <= VELOCITA_PASSO && s.zucco.stato === "corsa" && Math.floor(s.distanza / LUNGHEZZA_PASSO) > passi)
      s.alEvento({ tipo: "passo", x: X_ZUCCO, y: SUOLO });

    if (b.fase === "arrivo") {
      // A passo d'uomo un salto non supera più niente: si frena solo con l'ultimo ostacolo alle spalle.
      if (!s.ostacoli.every((o) => o.passato || o.rotto)) return;
      b.casaX = X_CASA_FERMA + STRADA_A_PASSO + (s.velocita ** 2 - VELOCITA_PASSO ** 2) / (2 * FRENATA);
      cambiaFase(s, "frenata");
      s.alEvento({ tipo: "orda", x: -40, y: SUOLO });
    } else if (b.casaX - X_CASA_FERMA < 0.25) {
      b.casaX = X_CASA_FERMA;
      s.velocita = 0;
      cambiaFase(s, "silenzio");
      s.alEvento({ tipo: "vento", x: X_ZUCCO + 120, y: SUOLO });
    }
    return;
  }

  if (b.fase === "duello") {
    b.durataDuello += TICK;
    muoviDuello(s);
    lancia(s);
    muoviProiettili(s);
    return;
  }

  ricadi(s.zucco);
  const k = avanzamento(b);

  if (b.fase === "silenzio") {
    if (!b.presagio && b.t >= PRESAGIO) {
      b.presagio = true;
      s.alEvento({ tipo: "presagio", x: X_ZUCCO, y: SUOLO });
    }
    if (k >= 1) {
      cambiaFase(s, "trema");
      s.alEvento({ tipo: "trema", x: X_ZUCCO, y: SUOLO });
    }
  } else if (b.fase === "trema") {
    if (k >= 1) {
      cambiaFase(s, "balzo");
      s.alEvento({ tipo: "balzo", x: X_ZUCCO, y: SUOLO });
    }
  } else if (b.fase === "balzo") {
    if (k >= 1) {
      cambiaFase(s, "spinta");
      s.alEvento({ tipo: "bossAtterra", x: X_ATTERRAGGIO, y: SUOLO });
    }
  } else if (b.fase === "spinta") {
    b.spinta = -SPINTA_INDIETRO * (1 - (1 - k) ** 3);
    b.mazzaX = X_ATTERRAGGIO + (X_MAZZA - X_ATTERRAGGIO) * k;
    if (k >= 1) cambiaFase(s, "presa");
  } else if (b.fase === "presa") {
    b.spinta = -SPINTA_INDIETRO * (1 - k);
    if (k >= 1) {
      b.mazzaX = null;
      b.spinta = 0;
      s.zucco.conMazza = true;
      cambiaFase(s, "apertura");
      s.alEvento({ tipo: "prende", x: X_ZUCCO, y: SUOLO });
    }
  } else if (b.fase === "apertura") {
    b.apertura = k * k * (3 - 2 * k);
    if (k >= 1) cambiaFase(s, "duello");
  } else if (b.fase === "morte" && k >= 1) vince(s);
}
