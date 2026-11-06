// Il finale: la casa della festa, il Padrone delle Mani e il duello a mazzate.
// Come sim.js è logica pura: stesso seed e stessi input, stessa partita.

import {
  ANGOLI_SWING,
  BUFFER_SALTO,
  CONTATTO_SWING,
  DURATA_STAGE,
  GRAVITA,
  GRAVITA_PICCHIATA,
  GRAZIA_COLPO,
  SPINTA,
  SUOLO,
  TAGLIO_SALTO,
  TICK,
  TOLLERANZA_BORDO,
  VITE,
  X_ZUCCO,
} from "./costanti.js";
import { PIXEL_PER_PUNTO, fuoricampoFatto, guadagna, perdiVita } from "./punti.js";

export const TEMPO_BOSS = DURATA_STAGE * 10;
export const VITE_BOSS = 10;
export const X_BOSS = 280;
export const X_ATTERRAGGIO = 200;
export const X_LANCIO = X_BOSS - 50;
const Y_VOLTO_BOSS = SUOLO - 110;
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

// Il colpo vale da subito e l'animazione lo raggiunge al contatto: così il tasto risponde senza ritardo.
const DURATA_SWING = ANGOLI_SWING.length;
const FINESTRA_MAZZATA = 10;
const RICARICA_MAZZATA = 16;
const MEMORIA_MAZZATA = 8;
const PORTATA_VICINA = -6;
const PORTATA_LONTANA = 52;
const ALTEZZA_MAZZATA = 22;
const FERMO_MAZZATA = 4;
const FERMO_FUORICAMPO = 7;
const RITORNO_PIPISTRELLO = 520;

export const PREAVVISO_LANCIO = 0.45;
const DURATA_MANO_APERTA = 0.28;
const ALTRI_LANCI = ["osso", "teschio", "zucca"];
const VELOCITA_LANCIO = 270;
const VELOCITA_LANCIO_FURIA = 120;
const PAUSA_LANCIO = 0.95;
const PAUSA_LANCIO_FURIA = 0.45;
// I pipistrelli vanno guadagnati: dopo due homerun il boss lancia solo quelli, finché uno non torna indietro.
// Se ne servissero altri due dopo ogni pipistrello mancato, restando a terra si farebbero homerun all'infinito.
export const HOMERUN_PER_PIPISTRELLO = 2;

const COLPO_LANCIO = { evento: "botta", danno: 0.25, scritta: "-1/4" };
const COLPO_MANATA = { evento: "urto", danno: 0.5, scritta: "-1/2" };

/** Le tre fasi del boss, da 0 a 2. Si sale soltanto: se recupera vite non torna indietro. */
export const faseDaVite = (vite) => (vite > 6 ? 0 : vite > 3 ? 1 : 2);

// A ogni cambio di fase si sporge e ruggisce. Entrando nella terza beve l'Angelo Azzurro, una volta sola:
// lo preparano i suoi scagnozzi dietro di lui, e intanto il boss non attacca.
export const DURATA_RUGGITO = 1.5;
export const TEMPI_ANGELO = { porta: 1.2, beve: 1.6 };
const CURA_ANGELO = 5;

// La manata: dalla seconda fase una mano nera esce dal bordo destro e spazza una corsia, poi torna.
// Le altre mani ai bordi dello schermo restano solo grafica. `x` è la punta delle dita.
const X_MANO_RIPOSO = 410;
const X_MANO_PRONTA = 356;
const X_MANO_ARRIVO = -20;
const AVVISO_MANATA = [0, 1, 0.8];
const VELOCITA_MANATA = 800;
const RITORNO_MANATA = 620;
const PRESA_MANATA = 0.2;
const PRIMA_MANATA = 2.5;
const PAUSA_MANATA = [0, 6, 2.5];
const CASO_MANATA = 2;
const MANATA_SU_ZUCCO = 0.7;
const MANATE_DOPPIE = 0.4;
const RITARDO_SECONDA_MANATA = 0.15;
const ALTEZZA_MANATA = 18;

// Elef: l'amico sul tetto. Ogni tanto si affaccia dal colmo e lancia una vita su una delle piattaforme.
export const X_ELEF = X_CASA_FERMA + 90;
export const Y_ELEF = SUOLO - 116;
export const TEMPI_ELEF = { sale: 0.45, mira: 0.7, lancia: 0.3, scende: 0.5 };
const PRIMO_ELEF = 7;
// A ogni lancio la pausa si allunga: con le vite sempre in arrivo chi sbaglia non cadrebbe mai, e il boss
// che si cura non morirebbe mai. Così un duello perso prima o poi finisce.
const PAUSA_ELEF = 10;
const ATTESA_ELEF = 6;
const CASO_ELEF = 7;
export const VOLO_VITA = 0.9;
export const DURATA_VITA = 3;
const ALTEZZA_ARCO = 26;
const QUOTA_VITA = 7;
const PRESA_VITA = 12;

const PUNTI_MAZZATA = 50;
const PUNTI_FUORICAMPO = 100;
const PUNTI_COLPO_BOSS = 500;
const PUNTI_VITTORIA = 5000;
const PUNTI_VITA = 1000;
const PUNTI_VITA_DI_TROPPO = 250;
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
    viteMinime: VITE_BOSS,
    livello: 0,
    furia: 0,
    ruggito: 0,
    angelo: null,
    angeloBevuto: false,
    homerun: 0,
    spinta: 0,
    mazzaX: null,
    apertura: 0,
    proiettili: [],
    carica: null,
    lanciato: null,
    prossimoLancio: 1.2,
    manate: [],
    prossimaManata: 0,
    elef: null,
    prossimoElef: PRIMO_ELEF,
    vitaLanciate: 0,
    vita: null,
    scritta: null,
    colpito: 0,
    curato: 0,
    ripresa: 0,
    fermo: 0,
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
  z.swing = Math.max(0, (z.swing ?? 0) - 1);
  z.prenotata = Math.max(0, (z.prenotata ?? 0) - 1);
  if (z.prenotata > 0 && z.ricarica === 0) mazzata(s);
}

export function mazzata(s) {
  const b = s.boss;
  const z = s.zucco;
  if (b?.fase !== "duello") return;
  // Premuto un attimo prima della fine della ricarica il colpo parte da solo: non si perde.
  if (z.ricarica > 0) {
    z.prenotata = MEMORIA_MAZZATA;
    return;
  }
  z.prenotata = 0;
  z.mazzata = FINESTRA_MAZZATA;
  z.ricarica = RICARICA_MAZZATA;
  z.swing = DURATA_SWING;
  s.alEvento({ tipo: "colpoAria", x: X_ZUCCO, y: z.y });
}

/** La posa salta al contatto e tutto si ferma per un attimo: è questo fermo a dare peso al colpo. */
function contatto(s, fermo) {
  s.zucco.swing = Math.min(s.zucco.swing, DURATA_SWING - CONTATTO_SWING);
  s.boss.fermo = fermo;
}

const attacchiFermi = (b) => b.ruggito > 0 || b.angelo !== null;

function lancia(s) {
  const b = s.boss;
  if (attacchiFermi(b)) return;
  const progresso = b.furia;
  if (b.carica) {
    b.carica.t -= TICK;
    if (b.carica.t > 0) return;
    const { tipo, corsia } = b.carica;
    b.proiettili.push({ tipo, x: X_LANCIO, y: CORSIE[corsia], vx: -(VELOCITA_LANCIO + VELOCITA_LANCIO_FURIA * progresso), vy: 0, stato: "vola", fase: s.rng() * 6 });
    s.alEvento({ tipo: "lancio", x: X_LANCIO, y: CORSIE[corsia] });
    b.carica = null;
    b.lanciato = { corsia, t: DURATA_MANO_APERTA };
    b.prossimoLancio = PAUSA_LANCIO - PAUSA_LANCIO_FURIA * progresso;
    return;
  }
  b.prossimoLancio -= TICK;
  if (b.prossimoLancio > 0) return;
  const pipistrello = b.homerun >= HOMERUN_PER_PIPISTRELLO;
  const tipo = pipistrello ? "pipistrello" : ALTRI_LANCI[Math.floor(s.rng() * ALTRI_LANCI.length)];
  // I pipistrelli arrivano all'altezza delle piattaforme, tutto il resto anche a terra.
  const corsia = pipistrello ? 1 + Math.floor(s.rng() * 2) : Math.floor(s.rng() * 3);
  b.carica = { tipo, corsia, t: PREAVVISO_LANCIO };
}

const corsiaDi = (z) => (z.y > PIATTAFORME[0] + 10 ? 0 : z.y > PIATTAFORME[1] + 10 ? 1 : 2);

/** In terza fase ogni tanto le mani sono due, su corsie diverse: la terza resta sempre libera. */
function nuoveManate(s) {
  const b = s.boss;
  // Quasi sempre mira il piano di Zucco: la manata non si para, bisogna cambiare corsia.
  const corsia = s.rng() < MANATA_SU_ZUCCO ? corsiaDi(s.zucco) : Math.floor(s.rng() * 3);
  const mano = (c, t) => ({ corsia: c, stato: "avviso", t, durata: AVVISO_MANATA[b.livello], x: X_MANO_RIPOSO });
  b.manate = [mano(corsia, 0)];
  if (b.livello === 2 && s.rng() < MANATE_DOPPIE)
    b.manate.push(mano((corsia + 1 + Math.floor(s.rng() * 2)) % CORSIE.length, -RITARDO_SECONDA_MANATA));
  s.alEvento({ tipo: "manataAvviso", x: X_BOSS, y: CORSIE[corsia] });
}

function muoviManate(s) {
  const b = s.boss;
  if (b.livello === 0) return;
  if (b.manate.length === 0) {
    if (attacchiFermi(b)) return;
    b.prossimaManata -= TICK;
    if (b.prossimaManata <= 0) nuoveManate(s);
    return;
  }
  for (const m of b.manate) {
    muoviManata(s, m);
    if (s.finita) return;
  }
  b.manate = b.manate.filter((m) => m.x < X_MANO_RIPOSO || m.stato !== "torna");
  if (b.manate.length === 0) b.prossimaManata = PAUSA_MANATA[b.livello] + s.rng() * CASO_MANATA;
}

function muoviManata(s, m) {
  const b = s.boss;
  m.t += TICK;
  if (m.stato === "avviso") {
    m.x = X_MANO_RIPOSO + (X_MANO_PRONTA - X_MANO_RIPOSO) * Math.max(0, Math.min(1, m.t / m.durata));
    if (m.t < m.durata) return;
    m.stato = "va";
    s.alEvento({ tipo: "manata", x: X_BOSS, y: CORSIE[m.corsia] });
  } else if (m.stato === "va") {
    m.x -= VELOCITA_MANATA * TICK;
    if (m.x <= X_MANO_ARRIVO) {
      m.x = X_MANO_ARRIVO;
      m.stato = "presa";
      m.t = 0;
    }
  } else if (m.stato === "presa") {
    if (m.t >= PRESA_MANATA) {
      m.stato = "torna";
      s.alEvento({ tipo: "manataTorna", x: X_ZUCCO, y: CORSIE[m.corsia] });
    }
  } else {
    m.x = Math.min(X_MANO_RIPOSO, m.x + RITORNO_MANATA * TICK);
  }

  const z = s.zucco;
  if (m.x <= X_ZUCCO + 8 && Math.abs(z.y - 12 - CORSIE[m.corsia]) < ALTEZZA_MANATA && s.graziaT <= 0) colpisciZucco(s, COLPO_MANATA);
}

function muoviRuggito(s) {
  const b = s.boss;
  if (b.ruggito <= 0) return;
  b.ruggito = Math.max(0, b.ruggito - TICK);
  if (b.ruggito > 0 || b.livello < 2 || b.angeloBevuto) return;
  b.angelo = { stato: "porta", t: 0 };
  s.alEvento({ tipo: "angeloPorta", x: X_BOSS + 60, y: SUOLO });
}

function muoviAngelo(s) {
  const b = s.boss;
  const a = b.angelo;
  if (!a) return;
  a.t += TICK;
  if (a.t < TEMPI_ANGELO[a.stato]) return;
  if (a.stato === "porta") {
    b.angelo = { stato: "beve", t: 0 };
    s.alEvento({ tipo: "angeloBeve", x: X_BOSS, y: Y_VOLTO_BOSS });
    return;
  }
  b.angelo = null;
  b.angeloBevuto = true;
  curaBoss(b, CURA_ANGELO);
  // Le vite del drink sono vite nuove: toglierle paga, a differenza di quelle riprese colpendo Zucco.
  b.viteMinime = b.vite;
  b.scritta = { testo: "ANGELO AZZURRO!", t: DURATA_SCRITTA };
  s.alEvento({ tipo: "angeloAzzurro", x: X_BOSS, y: Y_VOLTO_BOSS, punti: b.ripresa });
}

function curaBoss(b, quante) {
  const prima = b.vite;
  b.vite = Math.min(VITE_BOSS, b.vite + quante);
  b.curato = 0.7;
  b.ripresa = b.vite - prima;
}

function muoviElef(s) {
  const b = s.boss;
  if (!b.elef) {
    b.prossimoElef -= TICK;
    if (b.prossimoElef > 0 || b.vita) return;
    b.elef = { stato: "sale", t: 0, piano: Math.floor(s.rng() * PIATTAFORME.length) };
    s.alEvento({ tipo: "elef", x: X_ELEF, y: Y_ELEF });
    return;
  }

  const e = b.elef;
  e.t += TICK;
  if (e.t < TEMPI_ELEF[e.stato]) return;
  e.t = 0;
  if (e.stato === "sale") e.stato = "mira";
  else if (e.stato === "mira") {
    e.stato = "lancia";
    b.vita = { piano: e.piano, t: 0, x: X_ELEF, y: Y_ELEF, atterrata: false };
    b.vitaLanciate++;
    s.alEvento({ tipo: "lanciaVita", x: X_ELEF, y: Y_ELEF });
  } else if (e.stato === "lancia") e.stato = "scende";
  else {
    b.elef = null;
    b.prossimoElef = PAUSA_ELEF + ATTESA_ELEF * b.vitaLanciate + s.rng() * CASO_ELEF;
  }
}

function prendiVita(s) {
  const b = s.boss;
  const punti = s.vite >= VITE ? Math.round(PUNTI_VITA_DI_TROPPO * s.moltiplicatore) : 0;
  s.vite = Math.min(VITE, s.vite + 1);
  if (punti) guadagna(s, PUNTI_VITA_DI_TROPPO);
  s.alEvento({ tipo: "vitaPresa", x: b.vita.x, y: b.vita.y, punti });
  b.vita = null;
}

/** La vita cade dove passa Zucco: lui non si sposta in avanti, sceglie solo il piano. */
function muoviVita(s) {
  const b = s.boss;
  const v = b.vita;
  if (!v) return;
  v.t += TICK;
  const k = Math.min(1, v.t / VOLO_VITA);
  const arrivo = PIATTAFORME[v.piano] - QUOTA_VITA;
  v.x = X_ELEF + (X_ZUCCO - X_ELEF) * k;
  v.y = Y_ELEF + (arrivo - Y_ELEF) * k - ALTEZZA_ARCO * 4 * k * (1 - k);
  if (k >= 1 && !v.atterrata) {
    v.atterrata = true;
    s.alEvento({ tipo: "vitaAtterra", x: v.x, y: v.y });
  }

  const z = s.zucco;
  if (Math.abs(v.x - X_ZUCCO) < PRESA_VITA && v.y > z.y - 30 && v.y < z.y + 2) prendiVita(s);
  else if (v.t >= VOLO_VITA + DURATA_VITA) {
    s.alEvento({ tipo: "vitaSvanita", x: v.x, y: v.y });
    b.vita = null;
  }
}

/** Ogni colpo che Zucco subisce nel duello ridà una vita al boss. Vero se è stato l'ultimo. */
function colpisciZucco(s, { evento, danno, scritta }) {
  const b = s.boss;
  const z = s.zucco;
  perdiVita(s, danno);
  s.graziaT = GRAZIA_COLPO;
  s.alEvento({ tipo: evento, x: X_ZUCCO + 8, y: z.y - 12, scritta });
  if (s.vite <= 0) {
    s.finita = true;
    z.stato = "ko";
    s.alEvento({ tipo: "ko", x: X_ZUCCO + 10, y: z.y - 14 });
    return true;
  }
  if (b.vite < VITE_BOSS) {
    curaBoss(b, 1);
    s.alEvento({ tipo: "bossCura", x: X_BOSS, y: Y_VOLTO_BOSS });
  }
  return false;
}

function colpisciBoss(s, p) {
  const b = s.boss;
  b.vite--;
  b.colpito = 0.3;
  b.furia = Math.max(b.furia, (VITE_BOSS - b.vite) / (VITE_BOSS - 1));
  // Le vite che si è ripreso non pagano due volte: farsi colpire apposta non deve fruttare punti.
  if (b.vite < b.viteMinime) {
    b.viteMinime = b.vite;
    guadagna(s, PUNTI_COLPO_BOSS);
  }
  s.alEvento({ tipo: "bossColpito", x: X_BOSS - 10, y: p.y + 24 });
  if (b.vite > 0) {
    const livello = faseDaVite(b.vite);
    if (livello <= b.livello) return;
    b.livello = livello;
    b.prossimaManata = PRIMA_MANATA;
    b.ruggito = DURATA_RUGGITO;
    b.carica = null;
    s.alEvento({ tipo: "faseBoss", x: X_BOSS, y: Y_VOLTO_BOSS });
    return;
  }
  b.proiettili = [];
  b.carica = null;
  b.manate = [];
  b.ruggito = 0;
  b.angelo = null;
  b.elef = null;
  b.vita = null;
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
      const vicino = p.x > X_ZUCCO + PORTATA_VICINA && p.x < X_ZUCCO + PORTATA_LONTANA;
      if (z.mazzata > 0 && vicino && Math.abs(p.y - (z.y - 14)) <= ALTEZZA_MAZZATA) {
        if (p.tipo === "pipistrello") {
          p.stato = "ritorno";
          p.vx = RITORNO_PIPISTRELLO;
          b.homerun = 0;
          guadagna(s, PUNTI_MAZZATA);
          contatto(s, FERMO_MAZZATA);
          s.alEvento({ tipo: "mazzata", x: p.x, y: p.y });
        } else {
          p.stato = "fuori";
          p.vx = 300;
          p.vy = -520;
          b.homerun = Math.min(HOMERUN_PER_PIPISTRELLO, b.homerun + 1);
          const punti = Math.round(PUNTI_FUORICAMPO * s.moltiplicatore);
          guadagna(s, PUNTI_FUORICAMPO);
          fuoricampoFatto(s);
          contatto(s, FERMO_FUORICAMPO);
          b.scritta = { testo: "HOMERUUUNNN!!!", t: DURATA_SCRITTA };
          s.alEvento({ tipo: "fuoricampo", x: p.x, y: p.y, punti });
        }
        continue;
      }
      const dentro = p.x - 7 < scatola.x + scatola.w && p.x + 7 > scatola.x && p.y - 5 < scatola.y + scatola.h && p.y + 5 > scatola.y;
      if (dentro && s.graziaT <= 0) {
        p.finito = true;
        if (colpisciZucco(s, COLPO_LANCIO)) return;
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
  b.curato = Math.max(0, b.curato - TICK);
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
    if (b.fermo > 0) {
      b.fermo--;
      return;
    }
    b.durataDuello += TICK;
    muoviDuello(s);
    muoviRuggito(s);
    muoviAngelo(s);
    lancia(s);
    muoviManate(s);
    if (s.finita) return;
    muoviElef(s);
    muoviVita(s);
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
