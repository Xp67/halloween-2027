import assert from "node:assert/strict";
import { test } from "node:test";
import {
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
