import assert from "node:assert/strict";
import { test } from "node:test";
import {
  CARAMELLE_LUNA,
  DURATA_STAGE,
  IN,
  SUOLO,
  TICK,
  TIPI,
  VITE,
  X_ZUCCO,
  creaPartita,
  livelloBuio,
  passo,
  punteggio,
  rigioca,
  risultato,
  scatolaOstacolo,
} from "../src/sim.js";
import { FORMA_BOSS, GIRI_BOSS, MELODIE_BOSS, TEMA_BOSS, fraseBossDopo } from "../src/audio.js";
import { CORSIE, DURATA_RUGGITO, DURATA_VITA, HOMERUN_PER_PIPISTRELLO, PIATTAFORME, TEMPI_ANGELO, TEMPO_BOSS, VITE_BOSS, VOLO_VITA, faseDaVite } from "../src/boss.js";
import { PUNTI_TRE_LUNE } from "../src/punti.js";

const MINUTI = 60 * 60;

/** Giocatore automatico. `ritardo` e `errore` lo rendono umano: 0 e 0 è il giocatore perfetto. */
function creaBot({ ritardo = 0, errore = 0, seed = 1 } = {}) {
  let a = seed * 2654435761;
  const caso = () => {
    a = (Math.imul(a ^ (a >>> 15), 2246822519) + 1) >>> 0;
    return a / 4294967296;
  };
  let saltoPremuto = 0;
  let giu = false;
  const visti = new Map();

  return (s) => {
    const comandi = [];
    if (saltoPremuto > 0 && --saltoPremuto === 0) comandi.push(IN.SALTO_SU);

    const davanti = s.ostacoli
      .filter((o) => !o.rotto && o.x + o.w > X_ZUCCO - 10)
      .sort((p, q) => p.x - q.x);
    const pericoli = davanti.filter((o) => !(o.tipo === "pipistrello" && o.y < SUOLO - 50));
    const o = pericoli[0];

    let vuoleGiu = false;
    if (o) {
      // Più si va veloci, più una persona sbaglia.
      const rischio = errore * (s.velocita / 200) ** 2.5;
      if (!visti.has(o)) visti.set(o, { scarto: (caso() - 0.5) * 2 * ritardo, sbaglia: caso() < rischio });
      const { scarto, sbaglia } = visti.get(o);
      const arrivo = (o.x - (X_ZUCCO + 6)) / s.velocita + scarto;
      const sotto = o.tipo === "ragno" || o.tipo === "fantasma" || (o.tipo === "pipistrello" && o.y + o.h < SUOLO - 14);
      if (!sbaglia) {
        if (sotto) vuoleGiu = arrivo < 0.14 && o.x + o.w > X_ZUCCO - 12;
        else if (arrivo < 0.2 && arrivo > -0.1 && s.zucco.y >= SUOLO && saltoPremuto === 0) {
          const basso = davanti.some((p) => p.tipo === "pipistrello" && p.y < SUOLO - 50 && Math.abs(p.x - o.x) < 30);
          comandi.push(IN.SALTO_GIU);
          saltoPremuto = basso ? 7 : 16;
        }
      }
    }
    if (vuoleGiu !== giu) {
      giu = vuoleGiu;
      comandi.push(giu ? IN.SCIVOLA_GIU : IN.SCIVOLA_SU);
    }
    return comandi;
  };
}

function gioca(seed, bot, limite = 10 * MINUTI) {
  const s = creaPartita(seed);
  while (!s.finita && s.tick < limite) passo(s, bot(s));
  return s;
}

const mediana = (v) => [...v].sort((p, q) => p - q)[Math.floor(v.length / 2)];

function fino(s, secondi) {
  while (s.t < secondi && !s.finita) {
    s.graziaT = 1;
    passo(s);
  }
}

const ostacolo = (tipo, x = X_ZUCCO) => ({ tipo, x, y: SUOLO - TIPI[tipo].h, w: TIPI[tipo].w, h: TIPI[tipo].h, rotto: false });

test("senza toccare nulla Zucco perde tutte le vite", () => {
  const s = gioca(7, () => []);
  assert.ok(s.finita);
  assert.equal(s.vite, 0);
  assert.ok(s.t > 3 && s.t < 20, `finita a ${s.t.toFixed(1)} s`);
});

test("un colpo toglie una vita, fa esplodere l'ostacolo e dà un attimo di tregua", () => {
  const eventi = [];
  const s = creaPartita(3, (e) => eventi.push(e.tipo));
  passo(s);
  const lapide = ostacolo("lapide");
  s.ostacoli.push(lapide, ostacolo("croce"));
  passo(s);
  assert.equal(s.vite, VITE - 1);
  assert.equal(s.finita, false);
  assert.equal(lapide.rotto, true);
  assert.ok(eventi.includes("urto"));
  assert.ok(s.graziaT > 0);
});

test("l'ultimo colpo chiude la partita", () => {
  const eventi = [];
  const s = creaPartita(3, (e) => eventi.push(e.tipo));
  passo(s);
  s.vite = 1;
  s.ostacoli.push(ostacolo("lapide"));
  passo(s);
  assert.equal(s.finita, true);
  assert.equal(s.zucco.stato, "ko");
  assert.ok(eventi.includes("ko"));
});

test("ogni stage va più veloce del precedente", () => {
  const s = creaPartita(1);
  const velocita = [];
  for (let stage = 1; stage <= 6; stage++) {
    fino(s, stage * DURATA_STAGE - 1);
    assert.equal(s.stage, stage);
    velocita.push(s.velocita);
  }
  for (let i = 1; i < velocita.length; i++) assert.ok(velocita[i] > velocita[i - 1], velocita.join(" "));
});

test("al cambio di stage c'è una tregua senza ostacoli nuovi", () => {
  const s = creaPartita(1);
  fino(s, DURATA_STAGE - 0.05);
  const prima = s.daGenerare;
  fino(s, DURATA_STAGE + 0.02);
  assert.ok(s.daGenerare >= Math.min(prima, s.velocita * 1.2));
});

test("il buio arriva solo negli stage pari dal quarto", () => {
  const s = creaPartita(1);
  fino(s, 2.5 * DURATA_STAGE);
  assert.equal(livelloBuio(s), 0);
  fino(s, 3.5 * DURATA_STAGE);
  assert.equal(s.stage, 4);
  s.lunaT = 0;
  assert.equal(livelloBuio(s), 1);
  s.lunaT = 3;
  assert.equal(livelloBuio(s), 0, "la luna piena scaccia il buio");
});

test("il demone esce da terra poco prima di Zucco e non prima", () => {
  const s = creaPartita(1);
  passo(s);
  const demone = { ...ostacolo("demone", 340), salita: 0, carica: 0, x0: 340 };
  s.ostacoli = [demone];
  s.daGenerare = 99999;
  s.graziaT = 99;
  passo(s);
  assert.equal(scatolaOstacolo(demone).h, 0);
  while (demone.salita < 1) passo(s);
  assert.equal(scatolaOstacolo(demone).h, TIPI.demone.h);
  assert.ok(demone.x > X_ZUCCO + s.velocita * 0.4, "deve lasciare il tempo di reagire");
});

test("la mano e il demone si annunciano una volta sola, quando escono da terra", () => {
  const eventi = [];
  const s = creaPartita(1, (e) => eventi.push(e));
  passo(s);
  s.daGenerare = 99999;
  s.graziaT = 99;
  for (const tipo of ["mano", "demone"]) s.ostacoli.push({ ...ostacolo(tipo, 340), salita: 0, carica: 0, x0: 340 });
  while (s.ostacoli.some((o) => o.salita < 1)) passo(s);
  for (let i = 0; i < 30; i++) passo(s);
  assert.equal(eventi.filter((e) => e.tipo === "mano").length, 1);
  assert.equal(eventi.filter((e) => e.tipo === "demone").length, 1);
});

test("ogni ostacolo sfiora Zucco una volta sola, alle sue spalle", () => {
  const eventi = [];
  const s = creaPartita(1, (e) => eventi.push(e));
  passo(s);
  s.daGenerare = 99999;
  s.graziaT = 99;
  s.ostacoli.push({ ...ostacolo("pipistrello", 200), y: 60 });
  while (s.ostacoli.length) passo(s);
  const passaggi = eventi.filter((e) => e.tipo === "sfiora");
  assert.equal(passaggi.length, 1);
  assert.equal(passaggi[0].ostacolo, "pipistrello");
  assert.ok(passaggi[0].x < X_ZUCCO);
});

/**
 * Giocatore automatico del duello: va sulla corsia del lancio più vicino e colpisce quando arriva a tiro.
 * Prima di tutto toglie Zucco dalla corsia della manata. `distratto`: quante manate non vede.
 */
function creaBotDuello({ sbaglia = 0, distratto = 0, seed = 1 } = {}) {
  let a = seed * 2654435761;
  const caso = () => {
    a = (Math.imul(a ^ (a >>> 15), 2246822519) + 1) >>> 0;
    return a / 4294967296;
  };
  let salto = 0;
  let giu = 0;
  const visti = new Map();
  return (s) => {
    const comandi = [];
    if (salto > 0 && --salto === 0) comandi.push(IN.SALTO_SU);
    if (giu > 0 && --giu === 0) comandi.push(IN.SCIVOLA_SU);
    const b = s.boss;
    if (b?.fase !== "duello") return comandi;

    const z = s.zucco;
    const pericoli = b.proiettili.filter((p) => p.stato === "vola").sort((p, q) => p.x - q.x);
    const p = pericoli[0];
    if (p && !visti.has(p)) visti.set(p, caso() < sbaglia);
    const qui = z.y - 14;

    let mira = p?.y ?? (b.carica ? CORSIE[b.carica.corsia] : null);
    for (const m of b.manate) if (!visti.has(m)) visti.set(m, caso() < distratto);
    const occupate = b.manate.filter((m) => !visti.get(m)).map((m) => CORSIE[m.corsia]);
    if (occupate.some((y) => Math.abs(qui - y) < 20)) {
      const libere = CORSIE.filter((y) => !occupate.includes(y));
      mira = libere.sort((p, q) => Math.abs(p - qui) - Math.abs(q - qui))[0];
    } else if (mira !== null && occupate.some((y) => Math.abs(mira - y) < 6)) mira = null;
    if (mira === null) return comandi;

    const fermo = z.vy === 0;
    if (fermo && mira < qui - 6 && salto === 0) {
      comandi.push(IN.SALTO_GIU);
      salto = 18;
    } else if (fermo && mira > qui + 6 && giu === 0) {
      comandi.push(IN.SCIVOLA_GIU);
      giu = 6;
    }
    if (p && !visti.get(p) && Math.abs(p.y - qui) < 14 && p.x < X_ZUCCO + 40 && p.x > X_ZUCCO + 8) comandi.push(IN.MAZZA);
    return comandi;
  };
}

function giocaDuello(seed, opzioni, eventi = []) {
  const s = creaPartita(seed, (e) => eventi.push(e), { daSecondo: TEMPO_BOSS - 1 });
  const bot = creaBotDuello({ ...opzioni, seed });
  while (!s.finita && s.t < TEMPO_BOSS + 240) passo(s, bot(s));
  return s;
}

test("alla fine del decimo stage la scena porta al duello, in ordine", () => {
  const fasi = [];
  const s = creaPartita(2, () => {}, { daSecondo: TEMPO_BOSS - 1 });
  while (s.boss?.fase !== "duello" && s.t < TEMPO_BOSS + 30) {
    s.graziaT = 1;
    passo(s);
    const fase = s.boss?.fase;
    if (fase && fasi.at(-1) !== fase) fasi.push(fase);
  }
  assert.deepEqual(fasi, ["arrivo", "frenata", "silenzio", "trema", "balzo", "spinta", "presa", "apertura", "duello"]);
  assert.equal(s.zucco.conMazza, true);
  assert.equal(s.boss.vite, VITE_BOSS);
});

test("durante la scena finale non nascono ostacoli nuovi", () => {
  const s = creaPartita(2, () => {}, { daSecondo: TEMPO_BOSS - 0.1 });
  while (!s.boss) passo(s);
  s.ostacoli = [];
  while (s.boss.fase === "arrivo") {
    s.graziaT = 1;
    passo(s);
    assert.equal(s.ostacoli.length, 0);
  }
});

test("si frena solo con l'ultimo ostacolo alle spalle: a passo d'uomo non si potrebbe più saltarlo", () => {
  for (let seed = 1; seed <= 12; seed++) {
    const s = creaPartita(seed, () => {}, { daSecondo: TEMPO_BOSS - 1 });
    while (s.boss?.fase !== "frenata") {
      s.graziaT = 1;
      passo(s);
    }
    assert.ok(s.ostacoli.every((o) => o.x + o.w < X_ZUCCO), `seed ${seed}`);
  }
});

test("l'arrivo è lento, passa da una prima scossa e la casa si ferma sempre nello stesso punto", () => {
  const fermate = [];
  for (const luna of [0, 5]) {
    const eventi = [];
    const s = creaPartita(3, (e) => eventi.push(e.tipo), { daSecondo: TEMPO_BOSS - 1 });
    s.lunaT = luna;
    while (!s.boss) {
      s.graziaT = 1;
      passo(s);
    }
    const inizio = s.t;
    while (s.boss.fase !== "balzo") {
      s.graziaT = 1;
      passo(s);
    }
    assert.ok(s.t - inizio > 12, `la scena dura ${s.t - inizio} s`);
    assert.ok(eventi.indexOf("presagio") < eventi.indexOf("trema"));
    assert.ok(eventi.filter((e) => e === "passo").length >= 8);
    assert.equal(s.velocita, 0);
    fermate.push(s.boss.casaX);
  }
  assert.equal(fermate[0], fermate[1]);
});

test("se la scena lo prende a mezz'aria, Zucco torna coi piedi per terra", () => {
  const s = creaPartita(3, () => {}, { daSecondo: TEMPO_BOSS - 1 });
  while (s.boss?.fase !== "frenata") {
    s.graziaT = 1;
    passo(s);
  }
  while (s.boss.fase === "frenata") passo(s, s.velocita < 14 ? [IN.SALTO_GIU] : []);
  assert.ok(s.zucco.y < SUOLO);
  while (s.boss.fase === "silenzio") passo(s);
  assert.equal(s.zucco.y, SUOLO);
  assert.equal(s.zucco.stato, "corsa");
});

function inDuello(seed = 1) {
  const eventi = [];
  const s = creaPartita(seed, (e) => eventi.push(e), { daSecondo: TEMPO_BOSS - 1 });
  while (s.boss?.fase !== "duello") {
    s.graziaT = 1;
    passo(s);
  }
  s.boss.prossimoLancio = 999;
  s.boss.prossimoElef = 999;
  s.graziaT = 0;
  return { s, eventi };
}

/** Il boss perde vite a colpi di pipistrello: è l'unico modo di farlo cambiare fase. */
function pipistrelloSulBoss(s) {
  s.boss.proiettili.push({ ...lanciato("pipistrello", 225, 1), stato: "ritorno", vx: 520 });
  while (s.boss.proiettili.length) {
    s.graziaT = 1;
    passo(s);
  }
}

function finoAVite(s, vite) {
  while (s.boss.vite > vite) pipistrelloSulBoss(s);
}

/** Lascia finire il ruggito, così il boss torna ad attaccare. */
function dopoIlRuggito(s) {
  while (s.boss.ruggito > 0 || s.boss.angelo) {
    s.graziaT = 1;
    passo(s);
  }
}

/** Porta il boss in seconda fase e fa partire una manata su `corsia`. */
function manataSu(s, corsia) {
  finoAVite(s, 6);
  dopoIlRuggito(s);
  s.boss.prossimaManata = 0;
  s.zucco.y = PIATTAFORME[0];
  s.graziaT = 1;
  passo(s);
  s.boss.manate[0].corsia = corsia;
  return s.boss.manate[0];
}

const lanciato = (tipo, x, corsia = 0) => ({ tipo, x, y: CORSIE[corsia], vx: -200, vy: 0, stato: "vola", fase: 0 });

test("un pipistrello colpito torna indietro ed esplode sul boss", () => {
  const { s, eventi } = inDuello();
  s.boss.proiettili.push(lanciato("pipistrello", X_ZUCCO + 30));
  passo(s, [IN.MAZZA]);
  assert.equal(s.boss.proiettili[0].stato, "ritorno");
  while (s.boss.proiettili.length) passo(s);
  assert.equal(s.boss.vite, VITE_BOSS - 1);
  assert.ok(eventi.some((e) => e.tipo === "bossColpito"));
});

test("tutto il resto vola fuori con HOMERUUUNNN!!!, dà punti e alza il moltiplicatore, ma non fa male al boss", () => {
  for (const tipo of ["osso", "teschio", "zucca"]) {
    const { s } = inDuello();
    s.moltiplicatore = 1.5;
    const prima = s.punti;
    s.boss.proiettili.push(lanciato(tipo, X_ZUCCO + 30));
    passo(s, [IN.MAZZA]);
    assert.equal(s.boss.scritta.testo, "HOMERUUUNNN!!!");
    assert.ok(Math.abs(s.punti - prima - 150) < 1e-6, "i punti valgono col moltiplicatore di prima");
    assert.equal(s.moltiplicatore, 1.6);
    while (s.boss.proiettili.length) passo(s);
    assert.equal(s.boss.vite, VITE_BOSS);
  }
});

/** Il prossimo lancio del boss, appena preso in mano. */
function prossimoLancio(s) {
  s.boss.prossimoLancio = 0;
  while (!s.boss.carica) passo(s);
  const { tipo, corsia } = s.boss.carica;
  s.boss.carica = null;
  s.boss.prossimoLancio = 999;
  return { tipo, corsia };
}

test("i pipistrelli arrivano solo dopo due homerun", () => {
  const { s } = inDuello();
  for (let i = 0; i < 40; i++) assert.notEqual(prossimoLancio(s).tipo, "pipistrello");

  for (let fatti = 1; fatti <= HOMERUN_PER_PIPISTRELLO; fatti++) {
    s.boss.proiettili.push(lanciato("osso", X_ZUCCO + 30));
    s.zucco.ricarica = 0;
    passo(s, [IN.MAZZA]);
    assert.equal(s.boss.homerun, fatti);
    while (s.boss.proiettili.length) passo(s);
  }
  const { tipo, corsia } = prossimoLancio(s);
  assert.equal(tipo, "pipistrello");
  assert.ok(corsia >= 1, "resta all'altezza delle piattaforme");
});

test("un pipistrello mancato ne porta un altro, uno ribattuto rimette a zero il conto", () => {
  const { s } = inDuello();
  s.boss.homerun = HOMERUN_PER_PIPISTRELLO;
  for (let i = 0; i < 10; i++) assert.equal(prossimoLancio(s).tipo, "pipistrello", "finché non torna indietro");
  s.boss.proiettili.push(lanciato("pipistrello", X_ZUCCO + 30));
  passo(s, [IN.MAZZA]);
  assert.equal(s.boss.homerun, 0);
  assert.notEqual(prossimoLancio(s).tipo, "pipistrello");
});

test("chi resta a terra a fare homerun non accumula punti senza fine: arrivati a due, ci sono solo pipistrelli", () => {
  const { s } = inDuello();
  s.boss.prossimoLancio = 0;
  let fatti = 0;
  while (s.t < TEMPO_BOSS + 180) {
    s.graziaT = 1;
    const p = s.boss.proiettili.find((q) => q.stato === "vola" && q.tipo !== "pipistrello" && q.y === CORSIE[0] && q.x < X_ZUCCO + 40 && q.x > X_ZUCCO + 8);
    const prima = s.boss.homerun;
    passo(s, p ? [IN.MAZZA] : []);
    if (s.boss.homerun > prima) fatti++;
  }
  assert.equal(fatti, HOMERUN_PER_PIPISTRELLO);
  assert.ok(s.moltiplicatore < 1.5, `${s.moltiplicatore}`);
});

test("un lancio non colpito toglie un quarto di vita, e il moltiplicatore cala in proporzione", () => {
  const { s } = inDuello();
  s.moltiplicatore = 1.5;
  s.boss.proiettili.push(lanciato("osso", X_ZUCCO + 20));
  for (let i = 0; i < 20; i++) passo(s);
  assert.equal(s.vite, VITE - 0.25);
  assert.ok(Math.abs(s.moltiplicatore - 1.43) < 0.011, `${s.moltiplicatore}`);
});

test("con 12 lanci addosso Zucco cade, non prima", () => {
  const { s } = inDuello();
  for (let i = 1; i <= 12; i++) {
    s.graziaT = 0;
    assert.equal(s.finita, false);
    s.boss.proiettili.push(lanciato("osso", X_ZUCCO + 8));
    for (let j = 0; j < 3; j++) passo(s);
    assert.equal(s.vite, VITE - i * 0.25);
  }
  assert.equal(s.finita, true);
  assert.equal(s.zucco.stato, "ko");
});

test("quando Zucco viene colpito il boss recupera una vita, mai oltre il massimo", () => {
  const { s, eventi } = inDuello();
  s.boss.vite = 4;
  s.boss.proiettili.push(lanciato("osso", X_ZUCCO + 8));
  for (let i = 0; i < 3; i++) passo(s);
  assert.equal(s.boss.vite, 5);
  assert.ok(eventi.some((e) => e.tipo === "bossCura"));

  s.boss.vite = VITE_BOSS;
  s.graziaT = 0;
  s.boss.proiettili.push(lanciato("osso", X_ZUCCO + 8));
  for (let i = 0; i < 3; i++) passo(s);
  assert.equal(s.boss.vite, VITE_BOSS);
});

test("la mazza colpisce da subito, si ferma sul contatto e finisce il gesto", () => {
  const { s } = inDuello();
  s.boss.proiettili.push(lanciato("pipistrello", X_ZUCCO + 30, 0));
  passo(s, [IN.MAZZA]);
  assert.equal(s.boss.proiettili[0].stato, "ritorno");
  assert.ok(s.boss.fermo > 0, "il fermo sul colpo");
  const x = s.boss.proiettili[0].x;
  const posa = s.zucco.swing;
  passo(s);
  assert.equal(s.boss.proiettili[0].x, x, "durante il fermo non si muove niente");
  assert.equal(s.zucco.swing, posa);
  while (s.boss.fermo > 0) passo(s);
  for (let i = 0; i < 4; i++) passo(s);
  assert.ok(s.zucco.swing > 0 && s.zucco.swing < posa, "dopo il contatto il gesto continua");
});

test("uno swing prende tutto quello che ha a tiro", () => {
  const { s } = inDuello();
  s.boss.proiettili.push(lanciato("pipistrello", X_ZUCCO + 20), lanciato("osso", X_ZUCCO + 34));
  passo(s, [IN.MAZZA]);
  assert.deepEqual(s.boss.proiettili.map((p) => p.stato), ["ritorno", "fuori"]);
});

test("il tasto premuto a fine ricarica non si perde", () => {
  const { s, eventi } = inDuello();
  const colpi = () => eventi.filter((e) => e.tipo === "colpoAria").length;
  passo(s, [IN.MAZZA]);
  for (let i = 0; i < 12; i++) passo(s);
  passo(s, [IN.MAZZA]);
  assert.equal(colpi(), 1);
  for (let i = 0; i < 8; i++) passo(s);
  assert.equal(colpi(), 2);
});

test("le fasi salgono con le vite perse e non tornano indietro se il boss si cura", () => {
  const { s, eventi } = inDuello();
  finoAVite(s, 7);
  assert.equal(s.boss.livello, 0);
  finoAVite(s, 6);
  assert.equal(s.boss.livello, 1);
  s.boss.vite = 8;
  s.graziaT = 0;
  s.boss.proiettili.push(lanciato("osso", X_ZUCCO + 8));
  for (let i = 0; i < 3; i++) passo(s);
  assert.equal(s.boss.livello, 1);
  finoAVite(s, 3);
  assert.equal(s.boss.livello, 2);
  assert.equal(eventi.filter((e) => e.tipo === "faseBoss").length, 2);
});

test("a ogni cambio di fase il boss ruggisce e smette di attaccare, senza nessun titolo", () => {
  const { s, eventi } = inDuello();
  finoAVite(s, 6);
  assert.ok(s.boss.ruggito > 0);
  assert.equal(s.boss.scritta, null);
  assert.equal(eventi.filter((e) => e.tipo === "faseBoss").length, 1);
  s.boss.prossimoLancio = 0;
  s.boss.prossimaManata = 0;
  while (s.boss.ruggito > 0) {
    assert.equal(s.boss.carica, null);
    assert.equal(s.boss.manate.length, 0);
    s.graziaT = 1;
    passo(s);
  }
  passo(s);
  assert.ok(s.boss.carica, "finito il ruggito riprende a lanciare");
});

test("il ruggito dura quanto deve", () => {
  const { s } = inDuello();
  finoAVite(s, 6);
  const inizio = s.t;
  while (s.boss.ruggito > 0) {
    s.graziaT = 1;
    passo(s);
  }
  assert.ok(s.t - inizio <= DURATA_RUGGITO + 0.1);
});

test("in prima fase niente manate, dalla seconda sì", () => {
  const { s } = inDuello();
  for (let i = 0; i < 60 * 30; i++) {
    s.graziaT = 1;
    passo(s);
    assert.equal(s.boss.manate.length, 0);
  }
  finoAVite(s, 6);
  for (let i = 0; i < 60 * 12 && !s.boss.manate.length; i++) {
    s.graziaT = 1;
    passo(s);
  }
  assert.ok(s.boss.manate.length, "la seconda fase deve attaccare con le mani");
});

/** Conta le manate per qualche minuto: quante, quante doppie, e ogni quanto. */
function contaManate(s, minuti = 5) {
  let gruppi = 0, doppie = 0, ultima = 0;
  const pause = [];
  const fine = s.t + minuti * 60;
  while (s.t < fine) {
    s.graziaT = 1;
    const prima = s.boss.manate.length;
    passo(s);
    if (prima === 0 && s.boss.manate.length) {
      gruppi++;
      if (s.boss.manate.length === 2) {
        doppie++;
        assert.notEqual(s.boss.manate[0].corsia, s.boss.manate[1].corsia);
      }
      if (ultima) pause.push(s.t - ultima);
      ultima = s.t;
    }
  }
  return { gruppi, doppie, pausa: mediana(pause) };
}

test("in terza fase le manate sono più fitte e ogni tanto sono due, su corsie diverse", () => {
  const seconda = inDuello(4).s;
  finoAVite(seconda, 6);
  dopoIlRuggito(seconda);
  const terza = inDuello(4).s;
  finoAVite(terza, 3);
  dopoIlRuggito(terza);

  const a = contaManate(seconda);
  const b = contaManate(terza);
  assert.equal(a.doppie, 0, "le doppie sono solo della terza fase");
  assert.ok(b.doppie >= 3, `${b.doppie} doppie su ${b.gruppi}`);
  assert.ok(b.doppie < b.gruppi * 0.7, "ogni tanto, non sempre");
  assert.ok(b.pausa < a.pausa - 1, `${a.pausa.toFixed(1)} s contro ${b.pausa.toFixed(1)} s`);
});

test("con due manate una corsia resta libera e Zucco lì non viene toccato", () => {
  const { s } = inDuello(4);
  finoAVite(s, 3);
  dopoIlRuggito(s);
  s.boss.manate = [0, 2].map((corsia) => ({ corsia, stato: "avviso", t: 0, durata: 0.8, x: 410 }));
  s.zucco.y = PIATTAFORME[0];
  s.zucco.vy = 0;
  s.graziaT = 0;
  const vite = s.vite;
  while (s.boss.manate.length) passo(s);
  assert.equal(s.vite, vite);
});

/** Fino a quando il boss ha finito di bere. */
function angeloBevuto(s) {
  while (!s.boss.angeloBevuto) {
    s.graziaT = 1;
    passo(s);
  }
}

test("entrando in terza fase il boss beve l'Angelo Azzurro: 5 vite, dopo il ruggito, senza attaccare", () => {
  const { s, eventi } = inDuello();
  finoAVite(s, 3);
  assert.equal(s.boss.livello, 2);
  assert.ok(s.boss.ruggito > 0);
  assert.equal(s.boss.angelo, null, "prima ruggisce");
  while (s.boss.ruggito > 0) passo(s);
  assert.equal(s.boss.angelo.stato, "porta");
  const inizio = s.t;
  s.boss.prossimoLancio = 0;
  while (s.boss.angelo) {
    assert.equal(s.boss.carica, null);
    s.graziaT = 1;
    passo(s);
  }
  assert.ok(Math.abs(s.t - inizio - TEMPI_ANGELO.porta - TEMPI_ANGELO.beve) < 0.1);
  assert.equal(s.boss.vite, 8);
  assert.equal(s.boss.livello, 2, "la fase non scende anche se ora ha 8 vite");
  assert.deepEqual(eventi.filter((e) => e.tipo.startsWith("angelo")).map((e) => e.tipo), ["angeloPorta", "angeloBeve", "angeloAzzurro"]);
});

test("l'Angelo Azzurro si beve una volta sola, e non oltre le 10 vite", () => {
  const { s, eventi } = inDuello();
  finoAVite(s, 3);
  angeloBevuto(s);
  finoAVite(s, 1);
  s.boss.vite = 3;
  for (let i = 0; i < 60 * 10; i++) {
    s.graziaT = 1;
    passo(s);
  }
  assert.equal(s.boss.vite, 3);
  assert.equal(eventi.filter((e) => e.tipo === "angeloAzzurro").length, 1);

  const altro = inDuello().s;
  finoAVite(altro, 3);
  altro.boss.vite = 8;
  angeloBevuto(altro);
  assert.equal(altro.boss.vite, VITE_BOSS);
});

test("le vite dell'Angelo Azzurro si pagano come vite nuove", () => {
  const { s } = inDuello();
  finoAVite(s, 3);
  angeloBevuto(s);
  s.moltiplicatore = 1;
  const prima = s.punti;
  pipistrelloSulBoss(s);
  assert.ok(Math.abs(s.punti - prima - 500) < 1e-6);
});

test("il boss non rallenta i lanci dopo aver bevuto", () => {
  const { s } = inDuello();
  finoAVite(s, 3);
  const furia = s.boss.furia;
  angeloBevuto(s);
  assert.equal(s.boss.vite, 8);
  assert.equal(s.boss.furia, furia);
});

test("la manata attraversa tutta la corsia e torna indietro", () => {
  const { s, eventi } = inDuello();
  const m = manataSu(s, 2);
  const visti = new Set();
  let minimo = Infinity;
  while (s.boss.manate.length) {
    s.graziaT = 1;
    passo(s);
    visti.add(m.stato);
    minimo = Math.min(minimo, m.x);
  }
  assert.deepEqual([...visti], ["avviso", "va", "presa", "torna"]);
  assert.ok(minimo < 0, "arriva oltre il bordo sinistro");
  assert.ok(eventi.some((e) => e.tipo === "manata"));
  assert.ok(eventi.some((e) => e.tipo === "manataTorna"));
});

test("la manata toglie mezza vita a chi resta nella corsia e passa oltre chi l'ha cambiata", () => {
  const colpo = (corsia, y) => {
    const { s } = inDuello();
    manataSu(s, corsia);
    s.zucco.y = y;
    s.zucco.vy = 0;
    s.graziaT = 0;
    while (s.boss.manate.length && !s.finita) passo(s);
    return s.vite;
  };
  assert.equal(colpo(0, SUOLO), VITE - 0.5);
  assert.equal(colpo(1, PIATTAFORME[0]), VITE - 0.5);
  assert.equal(colpo(2, PIATTAFORME[1]), VITE - 0.5);
  assert.equal(colpo(2, PIATTAFORME[0]), VITE);
  assert.equal(colpo(0, PIATTAFORME[1]), VITE);
});

test("con un quarto di vita la manata chiude la partita senza andare sotto zero", () => {
  const { s } = inDuello();
  manataSu(s, 1);
  s.zucco.y = PIATTAFORME[0];
  s.zucco.vy = 0;
  s.graziaT = 0;
  s.vite = 0.25;
  while (!s.finita) passo(s);
  assert.equal(s.vite, 0);
  assert.equal(s.zucco.stato, "ko");
});

test("la manata non si ferma con la mazza", () => {
  const { s } = inDuello();
  manataSu(s, 1);
  s.zucco.y = PIATTAFORME[0];
  s.zucco.vy = 0;
  s.graziaT = 0;
  while (s.boss.manate[0]?.stato === "avviso") passo(s);
  while (s.vite === VITE && s.boss.manate.length) passo(s, [IN.MAZZA]);
  assert.equal(s.vite, VITE - 0.5);
});

/** Porta Elef fino al lancio, poi lascia cadere la vita. */
function vitaLanciata(s, piano) {
  s.boss.prossimoElef = 0;
  passo(s);
  s.boss.elef.piano = piano;
  while (!s.boss.vita) passo(s);
  while (!s.boss.vita.atterrata) passo(s);
  return s.boss.vita;
}

test("Elef esce dal tetto ogni tanto e lancia una vita su una piattaforma", () => {
  const { s, eventi } = inDuello();
  for (const piano of [0, 1]) {
    const v = vitaLanciata(s, piano);
    assert.equal(v.x, X_ZUCCO);
    assert.equal(v.y, PIATTAFORME[piano] - 7);
    s.boss.vita = null;
    while (s.boss.elef) passo(s);
    assert.ok(s.boss.prossimoElef >= 9, "tra un lancio e l'altro passa del tempo");
  }
  assert.equal(eventi.filter((e) => e.tipo === "elef").length, 2);
  assert.equal(eventi.filter((e) => e.tipo === "lanciaVita").length, 2);
});

test("la vita resta 3 secondi, poi sparisce", () => {
  const { s, eventi } = inDuello();
  const v = vitaLanciata(s, 1);
  const atterrata = s.t;
  while (s.boss.vita) passo(s);
  assert.equal(v.piano, 1);
  assert.ok(Math.abs(s.t - atterrata - DURATA_VITA) < 0.05, `${(s.t - atterrata).toFixed(2)} s`);
  assert.ok(eventi.some((e) => e.tipo === "vitaSvanita"));
  assert.equal(s.vite, VITE);
});

test("salire sulla piattaforma giusta prende la vita, quella sbagliata no", () => {
  const prova = (y, piano) => {
    const { s } = inDuello();
    s.vite = 1.5;
    vitaLanciata(s, piano);
    s.zucco.y = y;
    s.zucco.vy = 0;
    passo(s);
    return s.vite;
  };
  assert.equal(prova(PIATTAFORME[0], 0), 2.5);
  assert.equal(prova(PIATTAFORME[1], 1), 2.5);
  assert.equal(prova(PIATTAFORME[1], 0), 1.5);
  assert.equal(prova(SUOLO, 0), 1.5);
});

test("con tutte le vite la vita di Elef vale punti e non supera il massimo", () => {
  const { s } = inDuello();
  vitaLanciata(s, 0);
  s.zucco.y = PIATTAFORME[0];
  s.zucco.vy = 0;
  const prima = s.punti;
  passo(s);
  assert.equal(s.vite, VITE);
  assert.ok(s.punti - prima >= 250);
  assert.equal(s.boss.vita, null);
});

test("la vita atterra dopo il volo previsto", () => {
  const { s } = inDuello();
  s.boss.prossimoElef = 0;
  passo(s);
  while (!s.boss.vita) passo(s);
  const lancio = s.t;
  while (!s.boss.vita.atterrata) passo(s);
  assert.ok(Math.abs(s.t - lancio - VOLO_VITA) < 0.05);
});

test("alla morte del boss spariscono manate, Elef e vita in volo", () => {
  const { s } = inDuello();
  s.boss.vite = 1;
  s.boss.livello = 2;
  s.boss.manate = [{ corsia: 0, stato: "avviso", t: 0, durata: 1, x: 410 }];
  s.boss.elef = { stato: "mira", t: 0, piano: 0 };
  s.boss.vita = { piano: 0, t: 0, x: 100, y: 40, atterrata: false };
  pipistrelloSulBoss(s);
  assert.equal(s.boss.fase, "morte");
  assert.equal(s.boss.manate.length, 0);
  assert.equal(s.boss.elef, null);
  assert.equal(s.boss.vita, null);
});

test("ogni lancio di Elef allunga la pausa prima del successivo", () => {
  const { s } = inDuello();
  for (let lanci = 1; lanci <= 4; lanci++) {
    vitaLanciata(s, 0);
    s.boss.vita = null;
    while (s.boss.elef) passo(s);
    const pausa = s.boss.prossimoElef;
    assert.ok(pausa >= 10 + 6 * lanci && pausa < 17 + 6 * lanci, `dopo ${lanci} lanci: ${pausa.toFixed(1)} s`);
  }
});

test("le vite che il boss si riprende non pagano due volte", () => {
  const { s } = inDuello();
  s.moltiplicatore = 1;
  const colpo = () => {
    const prima = s.punti;
    pipistrelloSulBoss(s);
    return s.punti - prima;
  };
  assert.ok(Math.abs(colpo() - 500) < 1e-6);
  s.boss.vite = VITE_BOSS;
  assert.equal(colpo(), 0, "riportarlo dov'era già stato non vale");
  assert.ok(Math.abs(colpo() - 500) < 1e-6, "scendere sotto il minimo sì");
});

test("anche chi sbaglia quasi tutto finisce il duello: le vite di Elef non lo tengono in piedi per sempre", () => {
  for (let seed = 1; seed <= 40; seed++) {
    const s = giocaDuello(seed, { sbaglia: 0.6, distratto: 0.6 });
    assert.ok(s.finita, `seed ${seed}: dopo ${s.boss.durataDuello.toFixed(0)} s non è finita`);
  }
});

test("rompere gli ostacoli con la luna piena vale 100 punti e l'evento li annuncia", () => {
  const eventi = [];
  const s = creaPartita(3, (e) => eventi.push(e));
  passo(s);
  s.lunaT = 3;
  s.moltiplicatore = 1.5;
  const prima = s.punti;
  s.ostacoli.push(ostacolo("mano"), ostacolo("demone"));
  s.ostacoli.forEach((o) => {
    o.salita = 1;
    o.carica = 1;
    o.x0 = o.x;
  });
  passo(s);
  assert.equal(s.rotti, 2);
  assert.ok(s.punti - prima >= 300);
  assert.deepEqual(eventi.filter((e) => e.tipo === "rotto").map((e) => e.punti), [150, 150]);
});

test("si può salire sulle due piattaforme e scendere attraversandole", () => {
  const { s } = inDuello();
  const sali = () => {
    passo(s, [IN.SALTO_GIU]);
    for (let i = 0; i < 18; i++) passo(s);
    passo(s, [IN.SALTO_SU]);
    for (let i = 0; i < 50; i++) passo(s);
  };
  sali();
  assert.equal(s.zucco.y, PIATTAFORME[0]);
  sali();
  assert.equal(s.zucco.y, PIATTAFORME[1]);
  passo(s, [IN.SCIVOLA_GIU]);
  for (let i = 0; i < 8; i++) passo(s);
  passo(s, [IN.SCIVOLA_SU]);
  for (let i = 0; i < 60; i++) passo(s);
  assert.equal(s.zucco.y, PIATTAFORME[0]);
});

test("il giocatore preciso batte il boss, e il duello dura il giusto", () => {
  const durate = [];
  let vittorie = 0;
  for (let seed = 1; seed <= 60; seed++) {
    const s = giocaDuello(seed, {});
    if (s.vinta) {
      vittorie++;
      durate.push(s.boss.durataDuello);
    }
  }
  const m = mediana(durate);
  console.log(`duello: ${vittorie}/60 vinti, mediana ${m?.toFixed(0)} s`);
  assert.ok(vittorie >= 54, `${vittorie}/60`);
  assert.ok(m >= 50 && m <= 110, `mediana ${m} s`);
});

test("una vittoria vale più di una sconfitta e si rigioca uguale", () => {
  const s = giocaDuello(3, {});
  assert.equal(s.vinta, true);
  assert.ok(punteggio(s) > 5000);
  const r = risultato(s);
  assert.equal(r.vinta, true);
  assert.equal(r.prova, true);
});

test("rigiocare gli input dà la stessa partita", () => {
  for (const seed of [1, 42, 9001]) {
    const s = gioca(seed, creaBot({ ritardo: 0.05, errore: 0.01, seed }));
    const r = risultato(s);
    const copia = rigioca(r.seed, r.input);
    assert.equal(copia.tick, s.tick);
    assert.equal(punteggio(copia), r.punteggio);
    assert.equal(copia.caramelle, r.caramelle);
    assert.equal(copia.rotti, r.rotti);
    assert.equal(copia.vite, r.vite);
    assert.equal(copia.stage, r.stage);
  }
});

test("tenere premuto salta più in alto di un tocco breve", () => {
  const altezza = (rilascio) => {
    const s = creaPartita(1);
    let cima = SUOLO;
    for (let i = 0; i < 60; i++) {
      const comandi = i === 0 ? [IN.SALTO_GIU] : i === rilascio ? [IN.SALTO_SU] : [];
      passo(s, comandi);
      cima = Math.min(cima, s.zucco.y);
    }
    return SUOLO - cima;
  };
  const corto = altezza(3);
  const lungo = altezza(40);
  assert.ok(corto > TIPI.lapide.h, `il salto corto (${corto.toFixed(0)}) deve superare una lapide`);
  assert.ok(lungo > TIPI.demone.h + 10, `il salto pieno (${lungo.toFixed(0)}) deve superare il demone`);
  assert.ok(lungo > corto + 10);
});

/** Salto pieno, poi una seconda pressione `anticipo` tick prima di toccare terra, tenuta `tenuta` tick. Torna l'altezza del salto che ne esce. */
function secondoSalto(anticipo, tenuta) {
  const prova = creaPartita(1);
  prova.daGenerare = Infinity;
  passo(prova, [IN.SALTO_GIU]);
  let volo = 0;
  for (; prova.zucco.y < SUOLO; volo++) passo(prova);
  const s = creaPartita(1);
  s.daGenerare = Infinity;
  const premo = volo - anticipo + 1;
  let cima = SUOLO;
  let atterrato = false;
  for (let i = 0; i < 110; i++) {
    const comandi = [];
    if (i === 0 || i === premo) comandi.push(IN.SALTO_GIU);
    if (i === premo + tenuta) comandi.push(IN.SALTO_SU);
    passo(s, comandi);
    if (i > 2 && s.zucco.y >= SUOLO) atterrato = true;
    if (atterrato) cima = Math.min(cima, s.zucco.y);
  }
  return SUOLO - cima;
}

const SALTO_MINIMO = 34;

test("un tocco rapido fa sempre un salto vero, ma passa ancora sotto il pipistrello alto", () => {
  for (const rilascio of [0, 1, 2, 3, 5]) {
    const s = creaPartita(1);
    s.daGenerare = Infinity;
    let cima = SUOLO;
    for (let i = 0; i < 60; i++) {
      const comandi = [];
      if (i === 0) comandi.push(IN.SALTO_GIU);
      if (i === rilascio) comandi.push(IN.SALTO_SU);
      passo(s, comandi);
      cima = Math.min(cima, s.zucco.y);
    }
    assert.ok(SUOLO - cima > SALTO_MINIMO, `tasto tenuto ${rilascio} tick: ${(SUOLO - cima).toFixed(1)} px`);
    assert.ok(SUOLO - cima < 43, `tasto tenuto ${rilascio} tick: ${(SUOLO - cima).toFixed(1)} px, sbatte contro il pipistrello alto`);
  }
});

test("premuto poco prima di atterrare, Zucco salta davvero anche se il tasto è già stato lasciato", () => {
  for (const anticipo of [1, 4, 7, 10, 12])
    for (const tenuta of [1, 3, 5]) {
      if (tenuta >= anticipo) continue;
      const alto = secondoSalto(anticipo, tenuta);
      assert.ok(alto > SALTO_MINIMO, `${anticipo} tick prima, tenuto ${tenuta}: ${alto.toFixed(1)} px`);
    }
});

test("premuto in volo e tenuto giù, Zucco salta appena tocca terra, anche se ha premuto molto prima", () => {
  for (const anticipo of [13, 18, 25]) {
    const alto = secondoSalto(anticipo, 40);
    assert.ok(alto > TIPI.demone.h + 10, `${anticipo} tick prima: ${alto.toFixed(1)} px`);
  }
});

test("premuto troppo presto e lasciato, in volo non resta nessun salto in sospeso", () => {
  assert.equal(secondoSalto(25, 3), 0);
});

test("il tasto tenuto dal primo salto non fa ripartire Zucco da solo", () => {
  const s = creaPartita(1);
  s.daGenerare = Infinity;
  passo(s, [IN.SALTO_GIU]);
  for (let i = 0; i < 39; i++) passo(s);
  assert.equal(s.zucco.y, SUOLO);
  for (let i = 0; i < 20; i++) {
    passo(s);
    assert.equal(s.zucco.y, SUOLO);
  }
});

test("dalla scivolata il salto parte pieno quanto un tocco rapido, anche col tasto giù ancora premuto", () => {
  const s = creaPartita(1);
  s.daGenerare = Infinity;
  passo(s, [IN.SCIVOLA_GIU]);
  passo(s);
  passo(s, [IN.SALTO_GIU]);
  let cima = SUOLO;
  for (let i = 0; i < 40; i++) {
    passo(s, i === 3 ? [IN.SALTO_SU] : []);
    cima = Math.min(cima, s.zucco.y);
  }
  assert.ok(SUOLO - cima > TIPI.croce.h, `salto di ${(SUOLO - cima).toFixed(1)} px`);
});

test("nel duello il tasto premuto in volo e tenuto fa saltare appena Zucco tocca un piano", () => {
  const { s, eventi } = inDuello();
  const salti = () => eventi.filter((e) => e.tipo === "salto").length;
  passo(s, [IN.SALTO_GIU]);
  passo(s, [IN.SALTO_SU]);
  for (let i = 0; i < 3; i++) passo(s);
  passo(s, [IN.SALTO_GIU]);
  assert.equal(salti(), 1);
  for (let i = 0; i < 60; i++) passo(s);
  assert.equal(salti(), 2);
});

test("nel duello un tocco rapido arriva al piano di sopra, da terra e dalla piattaforma", () => {
  const { s } = inDuello();
  s.boss.prossimoElef = 1e9;
  const tocco = () => {
    passo(s, [IN.SALTO_GIU]);
    passo(s, [IN.SALTO_SU]);
    for (let i = 0; i < 50; i++) passo(s);
  };
  tocco();
  assert.equal(s.zucco.y, PIATTAFORME[0]);
  tocco();
  assert.equal(s.zucco.y, PIATTAFORME[1]);
});

test("venti caramelle accendono la luna piena e gli ostacoli si rompono", () => {
  const s = creaPartita(3);
  passo(s);
  for (let i = 0; i < 20; i++) s.dolci.push({ x: X_ZUCCO, y: SUOLO - 10, preso: false });
  passo(s);
  assert.equal(s.caramelle, 20);
  assert.ok(s.lunaT > 0);

  s.ostacoli.push(ostacolo("lapide"));
  passo(s);
  assert.equal(s.vite, VITE);
  assert.equal(s.rotti, 1);
});

const caramella = (x = X_ZUCCO) => ({ x, y: SUOLO - 10, preso: false });

function accendiLuna(s) {
  s.lunaT = 0;
  s.luna = CARAMELLE_LUNA - 1;
  s.dolci.push(caramella());
  passo(s);
  assert.ok(s.lunaT > 0);
}

test("ogni caramella presa alza il moltiplicatore di 0,01", () => {
  const s = creaPartita(3);
  passo(s);
  for (let i = 0; i < 5; i++) s.dolci.push(caramella());
  passo(s);
  assert.equal(s.moltiplicatore, 1.05);
});

test("una caramella saltata abbassa il moltiplicatore di 0,10, una volta sola e mai sotto 1", () => {
  const s = creaPartita(3);
  passo(s);
  s.moltiplicatore = 1.25;
  s.dolci.push({ x: X_ZUCCO - 10, y: 20, preso: false });
  for (let i = 0; i < 30; i++) passo(s);
  assert.equal(s.moltiplicatore, 1.15);

  s.moltiplicatore = 1.05;
  s.dolci.push({ x: X_ZUCCO - 10, y: 20, preso: false });
  for (let i = 0; i < 30; i++) passo(s);
  assert.equal(s.moltiplicatore, 1);
});

test("perdere una vita abbassa il moltiplicatore di 0,30", () => {
  const s = creaPartita(3);
  passo(s);
  s.moltiplicatore = 1.5;
  s.ostacoli.push(ostacolo("lapide"));
  passo(s);
  assert.equal(s.vite, VITE - 1);
  assert.equal(s.moltiplicatore, 1.2);
});

test("il moltiplicatore vale per i punti che arrivano dopo, non per quelli già fatti", () => {
  const s = creaPartita(3);
  passo(s);
  const prima = s.punti;
  passo(s);
  const normale = s.punti - prima;

  s.moltiplicatore = 2;
  const fatti = s.punti;
  passo(s);
  assert.ok(Math.abs(s.punti - fatti - normale * 2) < 1e-9);

  s.moltiplicatore = 1;
  assert.ok(s.punti > fatti);
});

test("tre lune di fila con tutte le vite danno i punti extra", () => {
  const eventi = [];
  const s = creaPartita(3, (e) => eventi.push(e.tipo));
  passo(s);
  accendiLuna(s);
  accendiLuna(s);
  assert.equal(s.lunePulite, 2);
  const prima = s.punti;
  accendiLuna(s);
  assert.ok(s.punti - prima >= PUNTI_TRE_LUNE);
  assert.equal(s.lunePulite, 0);
  assert.equal(s.vite, VITE);
  assert.ok(eventi.includes("treLune"));
});

test("tre lune di fila senza colpi ridanno una vita, non i punti", () => {
  const eventi = [];
  const s = creaPartita(3, (e) => eventi.push(e.tipo));
  passo(s);
  s.vite = 1;
  for (let i = 0; i < 3; i++) accendiLuna(s);
  assert.equal(s.vite, 2);
  assert.ok(eventi.includes("vitaRecuperata"));
  assert.ok(!eventi.includes("treLune"));
});

test("perdere una vita azzera il conto delle lune", () => {
  const s = creaPartita(3);
  passo(s);
  accendiLuna(s);
  accendiLuna(s);
  s.lunaT = 0;
  s.graziaT = 0;
  s.ostacoli.push(ostacolo("lapide"));
  passo(s);
  assert.equal(s.vite, VITE - 1);
  assert.equal(s.lunePulite, 0);

  accendiLuna(s);
  accendiLuna(s);
  assert.equal(s.vite, VITE - 1);
  accendiLuna(s);
  assert.equal(s.vite, VITE);
});

test("nel finale le caramelle non accendono più la luna, che non si spegnerebbe", () => {
  const s = creaPartita(3, () => {}, { daSecondo: TEMPO_BOSS - 0.1 });
  while (!s.boss) passo(s);
  s.luna = CARAMELLE_LUNA - 1;
  s.dolci.push(caramella());
  passo(s);
  assert.equal(s.lunaT, 0);
});

test("il tema del boss si fa più furioso man mano che il boss perde vite", () => {
  assert.deepEqual([VITE_BOSS, 7, 6, 4, 3, 1].map(faseDaVite), [0, 0, 1, 1, 2, 2]);
  for (let i = 1; i < TEMA_BOSS.length; i++) assert.ok(TEMA_BOSS[i].bpm > TEMA_BOSS[i - 1].bpm);
});

test("la partitura del boss sta dentro le sue frasi e l'ingresso non torna", () => {
  for (const frase of FORMA_BOSS) assert.equal(GIRI_BOSS[frase].length, 4);
  for (const note of Object.values(MELODIE_BOSS)) {
    let fine = 0;
    for (const [passo, , durata] of note) {
      assert.ok(passo >= fine, `note sovrapposte al sedicesimo ${passo}`);
      fine = passo + durata;
    }
    assert.equal(fine, 64);
  }
  let i = 0;
  for (let giro = 0; giro < 20; giro++) {
    i = fraseBossDopo(i);
    assert.notEqual(FORMA_BOSS[i], "I");
  }
});

test("il giocatore perfetto passa 3 minuti senza un colpo: nessuno schema è impossibile", () => {
  for (let seed = 1; seed <= 40; seed++) {
    const s = gioca(seed, creaBot({ seed }), 3 * MINUTI);
    assert.equal(s.vite, VITE, `seed ${seed}: colpito a ${s.t.toFixed(1)} s, stage ${s.stage}`);
  }
});

test("una partita umana dura tra 1 e 3 minuti", () => {
  const partite = [];
  for (let seed = 1; seed <= 300; seed++) partite.push(gioca(seed, creaBot({ seed, ritardo: 0.075, errore: 0.02 })));
  const durate = partite.map((s) => s.tick * TICK);
  const m = mediana(durate);
  const stage = mediana(partite.map((s) => s.stage));
  console.log(`mediana ${m.toFixed(0)} s (stage ${stage}), min ${Math.min(...durate).toFixed(0)}, max ${Math.max(...durate).toFixed(0)}`);
  assert.ok(m >= 60 && m <= 180, `mediana ${m.toFixed(0)} s`);
});
