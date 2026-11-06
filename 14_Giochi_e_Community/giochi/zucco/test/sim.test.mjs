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
import { FORMA_BOSS, GIRI_BOSS, MELODIE_BOSS, TEMA_BOSS, fraseBossDopo, livelloTemaBoss } from "../src/audio.js";
import { CORSIE, PIATTAFORME, TEMPO_BOSS, VITE_BOSS } from "../src/boss.js";
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

/** Giocatore automatico del duello: va sulla corsia del lancio più vicino e colpisce quando arriva a tiro. */
function creaBotDuello({ sbaglia = 0, seed = 1 } = {}) {
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
    const mira = p?.y ?? (b.carica ? CORSIE[b.carica.corsia] : null);
    if (mira === null) return comandi;
    if (p && !visti.has(p)) visti.set(p, caso() < sbaglia);

    const qui = z.y - 14;
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
  s.graziaT = 0;
  return { s, eventi };
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

test("tutto il resto vola fuori con HOMERUUUNNN!!! e non fa male al boss", () => {
  for (const tipo of ["osso", "teschio", "zucca"]) {
    const { s } = inDuello();
    s.boss.proiettili.push(lanciato(tipo, X_ZUCCO + 30));
    passo(s, [IN.MAZZA]);
    assert.equal(s.boss.scritta.testo, "HOMERUUUNNN!!!");
    while (s.boss.proiettili.length) passo(s);
    assert.equal(s.boss.vite, VITE_BOSS);
  }
});

test("un lancio non colpito toglie una vita a Zucco", () => {
  const { s } = inDuello();
  s.boss.proiettili.push(lanciato("osso", X_ZUCCO + 20));
  for (let i = 0; i < 20; i++) passo(s);
  assert.equal(s.vite, VITE - 1);
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
  assert.ok(m >= 20 && m <= 70, `mediana ${m} s`);
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
  assert.ok(lungo > corto + 15);
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
  assert.deepEqual([VITE_BOSS, 7, 6, 4, 3, 1].map(livelloTemaBoss), [0, 0, 1, 1, 2, 2]);
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
