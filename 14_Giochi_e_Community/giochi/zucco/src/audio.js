// Musica ed effetti sonori generati dal browser: nessun file audio, nessuna licenza.

// --- La partitura. Il tema è in la minore, con il sol diesis che lo rende inquieto. ---

import { DURATA_TERREMOTO } from "./boss.js";

const ACCORDI = {
  Am: { basso: 45, arpeggio: [69, 72, 76], pad: [57, 60, 64] },
  F: { basso: 41, arpeggio: [65, 69, 72], pad: [53, 57, 60] },
  Dm: { basso: 38, arpeggio: [62, 65, 69], pad: [50, 53, 57] },
  E: { basso: 40, arpeggio: [64, 68, 71], pad: [52, 56, 59] },
  Bb: { basso: 46, arpeggio: [70, 74, 77], pad: [58, 62, 65] },
  A: { basso: 45, arpeggio: [69, 73, 76], pad: [57, 61, 64] },
  D: { basso: 38, arpeggio: [62, 66, 69], pad: [50, 54, 57] },
};

const GIRI = { A: ["Am", "F", "Dm", "E"], B: ["Am", "Bb", "Dm", "E"], L: ["A", "D", "E", "A"] };

// [sedicesimo, nota MIDI, durata in sedicesimi]
export const MELODIE = {
  A: [
    [0, 69, 3], [3, 72, 3], [6, 76, 2], [8, 77, 3], [11, 76, 1], [12, 72, 4],
    [16, 69, 3], [19, 72, 3], [22, 77, 2], [24, 76, 3], [27, 74, 1], [28, 72, 4],
    [32, 74, 3], [35, 77, 3], [38, 81, 2], [40, 80, 3], [43, 77, 1], [44, 76, 4],
    [48, 68, 3], [51, 71, 3], [54, 76, 2], [56, 74, 2], [58, 72, 2], [60, 71, 4],
  ],
  B: [
    [0, 76, 2], [2, 81, 2], [4, 80, 2], [6, 81, 2], [8, 84, 4], [12, 83, 2], [14, 81, 2],
    [16, 77, 2], [18, 82, 2], [20, 81, 2], [22, 82, 2], [24, 86, 4], [28, 84, 2], [30, 82, 2],
    [32, 81, 3], [35, 77, 3], [38, 74, 2], [40, 76, 3], [43, 77, 1], [44, 80, 4],
    [48, 83, 3], [51, 80, 3], [54, 76, 2], [56, 77, 2], [58, 76, 2], [60, 75, 2], [62, 76, 2],
  ],
  L: [
    [0, 81, 2], [2, 85, 2], [4, 88, 2], [6, 93, 2], [8, 88, 2], [10, 85, 2], [12, 88, 4],
    [16, 86, 2], [18, 90, 2], [20, 93, 2], [22, 98, 2], [24, 93, 2], [26, 90, 2], [28, 93, 4],
    [32, 88, 2], [34, 92, 2], [36, 95, 2], [38, 100, 2], [40, 95, 2], [42, 92, 2], [44, 95, 4],
    [48, 93, 4], [52, 88, 2], [54, 85, 2], [56, 81, 4], [60, 93, 4],
  ],
};

export const FORMA = ["A", "A", "B", "A"];
export const FATTORE_LUNA = 1.12;

// Oltre il nono stage la musica resta sull'ultima voce: la velocità del gioco sale, il tema no.
export const STAGE = [
  { bpm: 100, titolo: "Tramonto", nota: "Solo un carillon e il basso: la fuga non è ancora cominciata.", lead: "carillon", basso: "lento", arpeggio: 0, piatti: 0, batteria: 0, pad: 0 },
  { bpm: 112, titolo: "Notte", nota: "Entra l'arpeggio, sottovoce.", lead: "carillon", basso: "lento", arpeggio: 1, piatti: 0, batteria: 0, pad: 0 },
  { bpm: 124, titolo: "Notte più fonda", nota: "Il basso si muove e arrivano i piatti.", lead: "carillon", basso: "ottavi", arpeggio: 1, piatti: 1, batteria: 0, pad: 0 },
  { bpm: 136, titolo: "Luna di sangue", nota: "Parte la batteria e il tema passa a un suono più duro.", lead: "impulso", basso: "ottavi", arpeggio: 1, piatti: 1, batteria: 1, pad: 0 },
  { bpm: 146, titolo: "Prime mani nere", nota: "Sotto si apre un coro cupo.", lead: "impulso", basso: "ottavi", arpeggio: 2, piatti: 1, batteria: 1, pad: 1 },
  { bpm: 156, titolo: "Abisso", nota: "Il basso scende di un'ottava e il tema si sdoppia, leggermente stonato.", lead: "doppio", basso: "galoppo", arpeggio: 2, piatti: 2, batteria: 2, pad: 1, cupo: true },
  { bpm: 166, titolo: "Arriva l'orda", nota: "Compare una nota bassa che stride contro tutto il resto.", lead: "doppio", basso: "galoppo", arpeggio: 2, piatti: 2, batteria: 2, pad: 1, cupo: true, stridore: true },
  { bpm: 176, titolo: "L'orda cresce", nota: "La cassa raddoppia e i tamburi chiudono ogni giro.", lead: "doppio", basso: "galoppo", arpeggio: 2, piatti: 2, batteria: 3, pad: 1, cupo: true, stridore: true },
  { bpm: 186, titolo: "Tutto addosso", nota: "Tutti gli strumenti insieme, alla massima velocità.", lead: "doppio", basso: "galoppo", arpeggio: 2, piatti: 2, batteria: 3, pad: 2, cupo: true, stridore: true },
];

const frequenza = (midi) => 440 * 2 ** ((midi - 69) / 12);
const INDICE_MELODIE = Object.fromEntries(
  Object.entries(MELODIE).map(([nome, note]) => [nome, new Map(note.map(([passo, midi, durata]) => [passo, [midi, durata]]))]),
);

// --- Il banco di mixaggio ---

function stanza(ctx) {
  const durata = 0.7;
  const buffer = ctx.createBuffer(2, Math.floor(ctx.sampleRate * durata), ctx.sampleRate);
  for (let canale = 0; canale < 2; canale++) {
    const dati = buffer.getChannelData(canale);
    for (let i = 0; i < dati.length; i++) dati[i] = (Math.random() * 2 - 1) * (1 - i / dati.length) ** 3;
  }
  return buffer;
}

export function creaMixer(ctx) {
  const limitatore = ctx.createDynamicsCompressor();
  limitatore.threshold.value = -12;
  limitatore.ratio.value = 8;
  const uscita = ctx.createGain();
  uscita.gain.value = 0.62;
  limitatore.connect(uscita).connect(ctx.destination);

  // Stage dopo stage questo filtro chiude un po' gli acuti della musica. Gli effetti non ci passano.
  const luce = ctx.createBiquadFilter();
  luce.type = "lowpass";
  luce.frequency.value = 20000;
  luce.Q.value = 0.4;
  const musica = ctx.createGain();
  luce.connect(musica).connect(limitatore);

  const secco = ctx.createGain();
  secco.connect(luce);

  // L'eco è il suono tipico delle console a 16 bit.
  const invio = ctx.createGain();
  const eco = ctx.createDelay(1);
  const ritorno = ctx.createGain();
  const umido = ctx.createGain();
  ritorno.gain.value = 0.3;
  umido.gain.value = 0.3;
  invio.connect(eco).connect(ritorno).connect(eco);
  eco.connect(umido).connect(luce);

  const effetti = ctx.createGain();
  effetti.gain.value = 3;
  effetti.connect(limitatore);
  const riverbero = ctx.createConvolver();
  riverbero.buffer = stanza(ctx);
  const spazio = ctx.createGain();
  spazio.gain.value = 1.5;
  riverbero.connect(spazio).connect(limitatore);

  const reale = new Float32Array(24);
  const immaginaria = new Float32Array(24);
  for (let k = 1; k < 24; k++) immaginaria[k] = (2 / (k * Math.PI)) * Math.sin(k * Math.PI * 0.25);
  const impulso = ctx.createPeriodicWave(reale, immaginaria);

  const rumore = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
  const campioni = rumore.getChannelData(0);
  for (let i = 0; i < campioni.length; i++) campioni[i] = Math.random() * 2 - 1;

  return { ctx, secco, invio, eco, impulso, rumore, luce, musica, effetti, riverbero, uscita };
}

/** Da 0 (limpida) a 1 (la più scura). La prima versione resta limpida, la luna piena riapre un po' la seconda. */
export const scurezza = (versione, stage, luna) => (versione === 2 ? (Math.min(stage - 1, 8) / 8) * (luna ? 0.5 : 1) : 0);

export function regolaLuce(m, scuro, t, subito = false) {
  const taglio = scuro > 0 ? 10000 * 0.28 ** scuro : 20000;
  if (subito) m.luce.frequency.value = taglio;
  else m.luce.frequency.setTargetAtTime(taglio, t, 0.4);
}

// --- Gli strumenti della musica ---

function tono(m, { f, t, durata, forma = "triangle", vol = 0.2, attacco = 0.004, rilascio = 0.06, fine, stonato = 0, eco = 0, filtro }) {
  const { ctx } = m;
  const osc = ctx.createOscillator();
  if (forma === "impulso") osc.setPeriodicWave(m.impulso);
  else osc.type = forma;
  osc.frequency.setValueAtTime(f, t);
  osc.detune.value = stonato;
  if (fine) osc.frequency.exponentialRampToValueAtTime(fine, t + durata);

  const inviluppo = ctx.createGain();
  inviluppo.gain.setValueAtTime(0.0001, t);
  inviluppo.gain.exponentialRampToValueAtTime(vol, t + attacco);
  inviluppo.gain.setValueAtTime(vol, t + Math.max(attacco, durata - rilascio));
  inviluppo.gain.exponentialRampToValueAtTime(0.0001, t + durata + rilascio);

  let coda = osc;
  if (filtro) {
    const passa = ctx.createBiquadFilter();
    passa.type = "lowpass";
    passa.frequency.value = filtro;
    coda = osc.connect(passa);
  }
  coda.connect(inviluppo).connect(m.secco);
  if (eco > 0) {
    const mandata = ctx.createGain();
    mandata.gain.value = eco;
    inviluppo.connect(mandata).connect(m.invio);
  }
  osc.start(t);
  osc.stop(t + durata + rilascio + 0.02);
}

function colpo(m, { t, durata, vol, tipo, frequenza: taglio }) {
  const { ctx } = m;
  const sorgente = ctx.createBufferSource();
  sorgente.buffer = m.rumore;
  const filtro = ctx.createBiquadFilter();
  filtro.type = tipo;
  filtro.frequency.value = taglio;
  const inviluppo = ctx.createGain();
  inviluppo.gain.setValueAtTime(vol, t);
  inviluppo.gain.exponentialRampToValueAtTime(0.0001, t + durata);
  sorgente.connect(filtro).connect(inviluppo).connect(m.secco);
  sorgente.start(t, Math.random() * 0.8, durata + 0.02);
}

const cassa = (m, t) => tono(m, { f: 140, fine: 44, t, durata: 0.1, forma: "sine", vol: 0.5, rilascio: 0.03 });
const tamburo = (m, t, f) => tono(m, { f, fine: f * 0.6, t, durata: 0.11, forma: "triangle", vol: 0.34, rilascio: 0.04 });
function rullante(m, t, scuro) {
  colpo(m, { t, durata: 0.11, vol: 0.26 * (1 - 0.25 * scuro), tipo: "bandpass", frequenza: 1900 - 600 * scuro });
  tono(m, { f: 210, fine: 150, t, durata: 0.06, vol: 0.14, rilascio: 0.02 });
}
const piatto = (m, t, aperto, scuro) =>
  colpo(m, { t, durata: aperto ? 0.09 : 0.03, vol: (aperto ? 0.08 : 0.06) * (1 - 0.4 * scuro), tipo: "highpass", frequenza: 7500 - 2000 * scuro });

function tema(m, c, midi, t, durata, scuro) {
  const f = frequenza(midi);
  const filtro = scuro > 0 ? 6000 - 3400 * scuro : undefined;
  if (c.lead === "carillon") {
    tono(m, { f, t, durata: durata * 0.5, vol: 0.2, rilascio: durata, eco: 0.55 });
    tono(m, { f: f * 2, t, durata: durata * 0.2, forma: "sine", vol: 0.07 * (1 - scuro), rilascio: durata * 0.6, eco: 0.4 });
  } else {
    tono(m, { f, t, durata: durata * 0.9, forma: "impulso", vol: 0.15, eco: 0.45, filtro });
    if (c.lead === "doppio") tono(m, { f, t, durata: durata * 0.9, forma: "impulso", vol: 0.1, stonato: 14, eco: 0.3, filtro });
  }
}

/** Suona un sedicesimo. È l'unico punto che decide cosa si sente: vale dal vivo, nella pagina di ascolto e nelle prove. */
export function suonaPasso(m, c, luna, frase, passo, t, sedicesimo, scuro = 0) {
  const parte = luna ? "L" : frase;
  const battuta = Math.floor(passo / 16);
  const q = passo % 16;
  const accordo = ACCORDI[GIRI[parte][battuta]];
  const pieno = luna ? { ...c, basso: "galoppo", arpeggio: 2, piatti: 2, batteria: Math.max(c.batteria, 2), lead: "doppio" } : c;

  // Quando si scurisce la musica scende di tono, e l'arpeggio di un'ottava.
  const sposta = -Math.round(scuro * 2);
  const ottavaArpeggio = scuro >= 0.6 ? 0 : 12;

  const nota = INDICE_MELODIE[parte].get(passo);
  if (nota) tema(m, pieno, nota[0] + sposta, t, nota[1] * sedicesimo, scuro);

  const fondo = accordo.basso + sposta - (pieno.cupo && !luna ? 12 : 0);
  const formaBasso = pieno.cupo ? "impulso" : "triangle";
  const suonaBasso = (midi, durata) => tono(m, { f: frequenza(midi), t, durata, forma: formaBasso, vol: pieno.cupo ? 0.17 : 0.3, filtro: pieno.cupo ? 900 : undefined });
  if (pieno.basso === "lento" && q % 8 === 0) suonaBasso(fondo, sedicesimo * 7);
  if (pieno.basso === "ottavi" && q % 2 === 0) suonaBasso(q % 4 === 2 ? fondo + 12 : fondo, sedicesimo * 1.6);
  if (pieno.basso === "galoppo" && q % 4 !== 1) suonaBasso(q % 8 === 6 ? fondo + 12 : fondo, sedicesimo * 0.9);

  if (pieno.arpeggio && (pieno.arpeggio === 2 || q % 2 === 0)) {
    const giro = [0, 1, 2, 1];
    const indice = pieno.arpeggio === 2 ? q : q / 2;
    tono(m, { f: frequenza(accordo.arpeggio[giro[indice % 4]] + sposta + ottavaArpeggio), t, durata: sedicesimo * 0.7, forma: "impulso", vol: 0.045 * (1 - 0.3 * scuro), rilascio: 0.03, eco: 0.35 });
  }

  if (pieno.piatti && (pieno.piatti === 2 || q % 2 === 0)) piatto(m, t, q % 4 === 2, scuro);

  if (pieno.batteria >= 1) {
    const raddoppio = pieno.batteria >= 3 ? q % 2 === 0 : pieno.batteria === 2 ? [0, 6, 8, 14].includes(q) : q % 8 === 0;
    if (raddoppio) cassa(m, t);
    if (q === 4 || q === 12) rullante(m, t, scuro);
  }
  if (pieno.batteria >= 3 && battuta === 3 && q >= 12) tamburo(m, t, [190, 150, 120, 95][q - 12]);

  if (q === 0 && pieno.pad && !luna)
    for (const midi of accordo.pad) {
      const vol = (pieno.pad === 2 ? 0.05 : 0.04) * (1 + 0.5 * scuro);
      tono(m, { f: frequenza(midi + sposta), t, durata: sedicesimo * 15, forma: "sawtooth", vol, attacco: 0.25, rilascio: 0.3, filtro: 1100 });
      tono(m, { f: frequenza(midi + sposta), t, durata: sedicesimo * 15, forma: "sawtooth", vol, attacco: 0.25, rilascio: 0.3, filtro: 1100, stonato: 9 });
    }

  if (q === 0 && battuta % 2 === 0 && pieno.stridore && !luna)
    tono(m, { f: frequenza(accordo.basso + sposta - 18), t, durata: sedicesimo * 30, forma: "sawtooth", vol: 0.1, attacco: 0.5, rilascio: 0.4, filtro: 500 });
}

// --- Versione 3: lo stesso tema, arrangiato come una marcetta macabra che saltella ---

function campana(m, f, t, vol) {
  tono(m, { f, t, durata: 0.05, forma: "sine", vol, rilascio: 0.7, eco: 0.3 });
  tono(m, { f: f * 2.76, t, durata: 0.03, forma: "sine", vol: vol * 0.35, rilascio: 0.25 });
}

const xilofono = (m, f, t, vol) => tono(m, { f, t, durata: 0.02, vol, rilascio: 0.07, eco: 0.2 });
const legnetto = (m, t) => tono(m, { f: 1250, fine: 900, t, durata: 0.012, forma: "square", vol: 0.04, rilascio: 0.012 });

export function suonaPassoCarnevale(m, c, luna, frase, passo, t, sedicesimo) {
  const parte = luna ? "L" : frase;
  const battuta = Math.floor(passo / 16);
  const q = passo % 16;
  const accordo = ACCORDI[GIRI[parte][battuta]];
  const livello = STAGE.indexOf(c) + 1;
  // Il ritmo ballonzolante: i sedicesimi dispari arrivano un po' in ritardo.
  const tempo = t + (q % 2 ? sedicesimo * 0.34 : 0);

  // Oom: il basso sui tempi forti, alternando fondamentale e quinta.
  if (q % 8 === 0) {
    const f = frequenza(accordo.basso - 12 + (q === 8 ? 7 : 0));
    tono(m, { f, t, durata: sedicesimo * 2.2, vol: 0.34 });
    tono(m, { f, t, durata: sedicesimo * 2, forma: "impulso", vol: 0.08, filtro: 800 });
  }
  // Alla fine del giro il basso risale per semitoni, come a teatro.
  if (battuta === 3 && (q === 10 || q === 12 || q === 14))
    tono(m, { f: frequenza(accordo.basso - 12 + (q - 8) / 2), t, durata: sedicesimo * 1.6, vol: 0.28 });

  // Pah: l'accordo secco a contrattempo.
  if (q % 8 === 4)
    for (const midi of accordo.pad) tono(m, { f: frequenza(midi + 12), t, durata: sedicesimo * 0.7, forma: "impulso", vol: 0.05, rilascio: 0.03 });

  // Il tema rimbalza: ogni nota parte da un tono sotto e ci salta sopra.
  const nota = INDICE_MELODIE[parte].get(passo);
  if (nota) {
    const f = frequenza(nota[0]);
    const durata = nota[1] * sedicesimo * 0.62;
    tono(m, { f: f * 0.89, t: tempo, durata: 0.028, forma: "impulso", vol: 0.1, rilascio: 0.008 });
    tono(m, { f, t: tempo + 0.028, durata, forma: "impulso", vol: 0.15, rilascio: 0.05, eco: 0.4 });
    if (livello >= 6) tono(m, { f: f / 2, t: tempo, durata, forma: "sawtooth", vol: 0.05, filtro: 900 });
  }

  if (livello >= 2 && q % 4 === 2) legnetto(m, tempo);
  if (livello >= 3 && q % 2 === 1) xilofono(m, frequenza(accordo.arpeggio[((q - 1) / 2) % 3] + 12), tempo, 0.07);
  if (livello >= 2 && q === 0 && battuta % 2 === 0) campana(m, frequenza(accordo.arpeggio[0]), t, 0.1);

  if (livello >= 4) {
    if (q % 8 === 0) cassa(m, t);
    if (q % 8 === 4) rullante(m, t, 0);
    if (livello >= 6 && q % 2 === 0) piatto(m, tempo, q % 4 === 2, 0);
  }
  if (livello >= 8 && battuta === 3 && q >= 12) tamburo(m, t, [190, 150, 120, 95][q - 12]);
}

// --- Il tema del boss: il motivo della fuga, portato in re minore su un basso che non dà tregua ---

const ACCORDI_BOSS = {
  Dm: { basso: 38, pad: [62, 65, 69], arpeggio: [74, 77, 81] },
  Eb: { basso: 39, pad: [63, 67, 70], arpeggio: [75, 79, 82] },
  Gm: { basso: 43, pad: [62, 67, 70], arpeggio: [74, 79, 82] },
  A: { basso: 45, pad: [61, 64, 69], arpeggio: [73, 76, 81] },
  Cdim: { basso: 37, pad: [61, 64, 67], arpeggio: [73, 76, 79] },
};

export const GIRI_BOSS = { I: ["Dm", "Dm", "Eb", "Cdim"], A: ["Dm", "Eb", "Dm", "Cdim"], B: ["Gm", "Eb", "Dm", "A"] };

// [sedicesimo, nota MIDI, durata in sedicesimi]
export const MELODIE_BOSS = {
  A: [
    [0, 74, 3], [3, 77, 3], [6, 81, 2], [8, 82, 3], [11, 81, 1], [12, 77, 4],
    [16, 75, 3], [19, 79, 3], [22, 82, 2], [24, 84, 3], [27, 82, 1], [28, 79, 4],
    [32, 74, 2], [34, 77, 2], [36, 81, 2], [38, 86, 2], [40, 85, 3], [43, 82, 1], [44, 81, 4],
    [48, 85, 3], [51, 82, 3], [54, 79, 2], [56, 76, 3], [59, 79, 1], [60, 73, 4],
  ],
  B: [
    [0, 79, 2], [2, 82, 2], [4, 86, 2], [6, 82, 2], [8, 91, 4], [12, 90, 2], [14, 86, 2],
    [16, 79, 2], [18, 82, 2], [20, 87, 2], [22, 82, 2], [24, 91, 4], [28, 89, 2], [30, 87, 2],
    [32, 86, 3], [35, 81, 3], [38, 77, 2], [40, 74, 3], [43, 77, 1], [44, 81, 4],
    [48, 85, 2], [50, 88, 2], [52, 85, 2], [54, 81, 2], [56, 85, 2], [58, 88, 2], [60, 93, 4],
  ],
};

// La prima frase è l'ingresso e non torna: il giro riparte dalla seconda.
export const FORMA_BOSS = ["I", "A", "A", "B", "A", "B"];
export const fraseBossDopo = (i) => (i + 1 < FORMA_BOSS.length ? i + 1 : 1);

export const TEMA_BOSS = [
  { bpm: 150, titolo: "Si alza il Padrone", nota: "Da 10 a 7 vite: organo, basso che incalza e rintocchi di campana.", arpeggio: false, doppio: false, batteria: 1, sposta: 0 },
  { bpm: 162, titolo: "Le mani si agitano", nota: "Da 6 a 4 vite: il tema si sdoppia e un arpeggio corre sopra l'organo.", arpeggio: true, doppio: true, batteria: 2, sposta: 0 },
  { bpm: 174, titolo: "Furia", nota: "Le ultime 3 vite: sale di un semitono, la cassa raddoppia e i tamburi chiudono ogni giro.", arpeggio: true, doppio: true, batteria: 3, sposta: 1 },
];

export const livelloTemaBoss = (vite) => (vite > 6 ? 0 : vite > 3 ? 1 : 2);

const COLPI_BOSS = [0, 3, 6, 8, 11, 14];
const INDICE_BOSS = Object.fromEntries(
  Object.entries(MELODIE_BOSS).map(([nome, note]) => [nome, new Map(note.map(([passo, midi, durata]) => [passo, [midi, durata]]))]),
);

export function suonaPassoBoss(m, c, frase, passo, t, sedicesimo) {
  const battuta = Math.floor(passo / 16);
  const q = passo % 16;
  const accordo = ACCORDI_BOSS[GIRI_BOSS[frase][battuta]];
  const nota = (midi) => frequenza(midi + c.sposta);

  // L'organo tiene l'accordo per tutta la battuta.
  if (q === 0)
    for (const midi of accordo.pad)
      for (const stonato of [0, 9])
        tono(m, { f: nota(midi), t, durata: sedicesimo * 15, forma: "sawtooth", vol: 0.04, attacco: 0.015, rilascio: 0.08, filtro: 1600, stonato });

  // Il basso spinge a gruppi di tre e salta d'ottava prima di ogni ripartenza.
  if (COLPI_BOSS.includes(q)) {
    const f = nota(accordo.basso + (q === 6 || q === 14 ? 12 : 0));
    tono(m, { f, t, durata: sedicesimo * 1.7, vol: 0.2, rilascio: 0.03 });
    tono(m, { f, t, durata: sedicesimo * 1.5, forma: "impulso", vol: 0.1, rilascio: 0.03, filtro: 1000 });
  }

  if (q === 0 && battuta % 2 === 0) campana(m, nota(accordo.basso + 36), t, 0.13);

  const voce = INDICE_BOSS[frase]?.get(passo);
  if (voce) {
    const durata = voce[1] * sedicesimo * 0.9;
    tono(m, { f: nota(voce[0]), t, durata, forma: "impulso", vol: 0.17, eco: 0.4 });
    tono(m, { f: nota(voce[0] - 12), t, durata, forma: "sawtooth", vol: 0.07, filtro: 1400 });
    if (c.doppio) tono(m, { f: nota(voce[0]), t, durata, forma: "impulso", vol: 0.1, stonato: 14, eco: 0.3 });
  }

  // L'ingresso è solo organo e basso, e l'ultima battuta si stringe in un rullo.
  if (frase === "I") {
    if (q % 8 === 0) cassa(m, t);
    if (battuta === 3 && (q >= 8 || q % 2 === 0)) rullante(m, t, 0);
    return;
  }

  if (c.arpeggio) tono(m, { f: nota(accordo.arpeggio[[0, 1, 2, 1][q % 4]] + 12), t, durata: sedicesimo * 0.7, forma: "impulso", vol: 0.045, rilascio: 0.03, eco: 0.3 });

  if (c.batteria >= 3 ? q % 2 === 0 : COLPI_BOSS.includes(q)) cassa(m, t);
  if (q === 4 || q === 12) rullante(m, t, 0);
  if (q % 2 === 0) piatto(m, t, q % 4 === 2, 0);
  if (c.batteria >= 2 && battuta === 3 && q >= 12) tamburo(m, t, [190, 150, 120, 95][q - 12]);
}

// --- Gli effetti sonori: brevissimi, e ognuno ha un posto nello spazio ---

const ASCOLTO = 56; // dov'è Zucco: da lì si sente il mondo
const RAGGIO = 260;

/** Porta un suono dov'è la sua sorgente: lontano è più piccolo, più sordo, più immerso nella stanza. */
function luogo(m, x) {
  const { ctx } = m;
  const distanza = Math.min(1, Math.abs(x - ASCOLTO) / RAGGIO);
  const ingresso = ctx.createGain();
  ingresso.gain.value = 1 - 0.55 * distanza;
  const aria = ctx.createBiquadFilter();
  aria.type = "lowpass";
  aria.frequency.value = 16000 * 0.16 ** distanza;
  const lato = ctx.createStereoPanner();
  lato.pan.value = Math.max(-1, Math.min(1, (x - ASCOLTO) / 220)) * 0.9;
  ingresso.connect(aria).connect(lato).connect(m.effetti);
  const mandata = ctx.createGain();
  mandata.gain.value = 0.1 + 0.4 * distanza;
  lato.connect(mandata).connect(m.riverbero);
  return ingresso;
}

function soffio(m, dest, { t, durata, vol, tipo = "bandpass", f, fine, q = 1 }) {
  const { ctx } = m;
  const sorgente = ctx.createBufferSource();
  sorgente.buffer = m.rumore;
  sorgente.loop = true; // il rumore dura un secondo e parte da un punto a caso: i suoni lunghi non devono tagliarsi
  const filtro = ctx.createBiquadFilter();
  filtro.type = tipo;
  filtro.Q.value = q;
  filtro.frequency.setValueAtTime(f, t);
  if (fine) filtro.frequency.exponentialRampToValueAtTime(fine, t + durata);
  const inviluppo = ctx.createGain();
  inviluppo.gain.setValueAtTime(vol, t);
  inviluppo.gain.exponentialRampToValueAtTime(0.0001, t + durata);
  sorgente.connect(filtro).connect(inviluppo).connect(dest);
  sorgente.start(t, Math.random() * 0.7, durata + 0.02);
}

function battito(m, dest, { forma = "sine", f, fine, t, durata, vol, filtro }) {
  const { ctx } = m;
  const osc = ctx.createOscillator();
  osc.type = forma;
  osc.frequency.setValueAtTime(f, t);
  if (fine) osc.frequency.exponentialRampToValueAtTime(fine, t + durata);
  const inviluppo = ctx.createGain();
  inviluppo.gain.setValueAtTime(vol, t);
  inviluppo.gain.exponentialRampToValueAtTime(0.0001, t + durata);
  let coda = osc;
  if (filtro) {
    const passa = ctx.createBiquadFilter();
    passa.type = "lowpass";
    passa.frequency.value = filtro;
    coda = osc.connect(passa);
  }
  coda.connect(inviluppo).connect(dest);
  osc.start(t);
  osc.stop(t + durata + 0.02);
}

function briciole(m, d, t, quante, vol) {
  for (let i = 0; i < quante; i++)
    soffio(m, d, { t: t + 0.03 + Math.random() * 0.08, durata: 0.012, vol, f: 1800 + Math.random() * 1400, q: 4 });
}

const SCALA_CARAMELLE = [0, 2, 4, 7, 9, 12];

export const SUONI = {
  salto(m, d, t) {
    soffio(m, d, { t, durata: 0.09, vol: 0.14, f: 500, fine: 2200 });
    battito(m, d, { forma: "triangle", f: 260, fine: 520, t, durata: 0.07, vol: 0.07 });
  },
  atterra(m, d, t) {
    battito(m, d, { f: 110, fine: 55, t, durata: 0.07, vol: 0.26 });
    soffio(m, d, { t, durata: 0.05, vol: 0.14, tipo: "lowpass", f: 700 });
  },
  scivola(m, d, t) {
    soffio(m, d, { t, durata: 0.2, vol: 0.22, f: 900, fine: 350 });
  },
  caramella(m, d, t, nota = 0) {
    const f = 880 * 2 ** (SCALA_CARAMELLE[nota % SCALA_CARAMELLE.length] / 12);
    battito(m, d, { forma: "triangle", f, t, durata: 0.06, vol: 0.14 });
    battito(m, d, { forma: "triangle", f: f * 1.5, t: t + 0.045, durata: 0.07, vol: 0.11 });
  },
  rotto(m, d, t) {
    soffio(m, d, { t, durata: 0.06, vol: 0.26, tipo: "highpass", f: 1200 });
    soffio(m, d, { t, durata: 0.12, vol: 0.24, f: 500 });
    battito(m, d, { f: 180, fine: 70, t, durata: 0.09, vol: 0.24 });
    briciole(m, d, t, 3, 0.1);
  },
  urto(m, d, t) {
    battito(m, d, { f: 160, fine: 40, t, durata: 0.26, vol: 0.42 });
    soffio(m, d, { t, durata: 0.28, vol: 0.3, tipo: "lowpass", f: 1800, fine: 300 });
    soffio(m, d, { t, durata: 0.03, vol: 0.22, tipo: "highpass", f: 2500 });
  },
  ko(m, d, t) {
    soffio(m, d, { t, durata: 0.12, vol: 0.34, f: 700 });
    battito(m, d, { f: 240, fine: 60, t, durata: 0.18, vol: 0.4 });
  },
  luna(m, d, t) {
    [660, 880, 1320, 1760].forEach((f, i) => battito(m, d, { forma: "triangle", f, t: t + i * 0.05, durata: 0.09, vol: 0.13 }));
    soffio(m, d, { t, durata: 0.3, vol: 0.06, tipo: "highpass", f: 3000, fine: 8000 });
  },
  caramellaPersa(m, d, t) {
    battito(m, d, { forma: "triangle", f: 330, fine: 190, t, durata: 0.06, vol: 0.05 });
  },
  // Arrivano insieme alla terza luna: partono appena dopo, per non confondersi col suo accordo.
  vitaRecuperata(m, d, t) {
    [523, 784, 1047].forEach((f, i) => battito(m, d, { forma: "triangle", f, t: t + 0.25 + i * 0.08, durata: i === 2 ? 0.28 : 0.1, vol: 0.15 }));
  },
  treLune(m, d, t) {
    [784, 988, 1175, 1568].forEach((f, i) => battito(m, d, { forma: "triangle", f, t: t + 0.25 + i * 0.07, durata: i === 3 ? 0.3 : 0.09, vol: 0.14 }));
  },
  stage(m, d, t) {
    battito(m, d, { f: 98, t, durata: 0.35, vol: 0.22 });
    battito(m, d, { forma: "triangle", f: 196, t, durata: 0.22, vol: 0.1 });
  },
  // Il colpo secco di terra: un tonfo senza coda, e qualche zolla che ricade.
  mano(m, d, t) {
    soffio(m, d, { t, durata: 0.045, vol: 0.5, tipo: "lowpass", f: 900 });
    battito(m, d, { f: 130, fine: 52, t, durata: 0.06, vol: 0.5 });
    briciole(m, d, t, 4, 0.08);
  },
  rune(m, d, t) {
    soffio(m, d, { t, durata: 0.22, vol: 0.22, f: 300, fine: 1200, q: 2 });
    battito(m, d, { forma: "sawtooth", f: 55, fine: 70, t, durata: 0.2, vol: 0.1, filtro: 400 });
  },
  // Il terreno che si apre: uno schianto, il sottosuolo che cede e un ringhio.
  demone(m, d, t) {
    battito(m, d, { f: 72, fine: 30, t, durata: 0.34, vol: 0.46 });
    soffio(m, d, { t, durata: 0.06, vol: 0.42, tipo: "lowpass", f: 1200 });
    soffio(m, d, { t, durata: 0.3, vol: 0.32, tipo: "lowpass", f: 220 });
    battito(m, d, { forma: "sawtooth", f: 92, fine: 58, t: t + 0.05, durata: 0.28, vol: 0.14, filtro: 700 });
    briciole(m, d, t, 6, 0.1);
  },
  sfiora(m, d, t) {
    soffio(m, d, { t, durata: 0.12, vol: 0.18, f: 1100, fine: 400 });
  },
  pipistrello(m, d, t) {
    for (const ritardo of [0, 0.045, 0.09]) soffio(m, d, { t: t + ritardo, durata: 0.03, vol: 0.2, f: 1800, q: 2 });
  },
  fantasma(m, d, t) {
    soffio(m, d, { t, durata: 0.26, vol: 0.32, f: 700, fine: 450, q: 6 });
    battito(m, d, { f: 420, fine: 300, t, durata: 0.24, vol: 0.08 });
  },
  ragno(m, d, t) {
    battito(m, d, { forma: "triangle", f: 1500, fine: 900, t, durata: 0.04, vol: 0.07 });
    soffio(m, d, { t, durata: 0.012, vol: 0.06, tipo: "highpass", f: 3000 });
  },
  passo(m, d, t) {
    battito(m, d, { f: 96, fine: 58, t, durata: 0.06, vol: 0.18 });
    soffio(m, d, { t, durata: 0.05, vol: 0.07, tipo: "lowpass", f: 800 });
  },
  vento(m, d, t) {
    [0.05, 0.1, 0.07].forEach((vol, i) => soffio(m, d, { t: t + i * 0.55, durata: 1, vol, f: 380 + i * 120, fine: 700, q: 5 }));
  },
  // La prima scossa: un colpo sordo da sotto i piedi, poi di nuovo silenzio.
  presagio(m, d, t) {
    battito(m, d, { f: 54, fine: 30, t, durata: 0.6, vol: 0.55 });
    soffio(m, d, { t, durata: 0.5, vol: 0.3, tipo: "lowpass", f: 150 });
    briciole(m, d, t + 0.12, 4, 0.05);
  },
  // Soffio e battito sanno solo calare: il boato che cresce è fatto di ondate sovrapposte, ognuna più forte.
  trema(m, d, t) {
    const ondate = Math.round(DURATA_TERREMOTO / 0.2);
    for (let i = 0; i < ondate; i++) {
      const k = (i + 1) / ondate, quando = t + i * 0.2;
      soffio(m, d, { t: quando, durata: 0.5, vol: 0.08 + 0.34 * k * k, tipo: "lowpass", f: 90 + 110 * k });
      battito(m, d, { f: 46, fine: 30, t: quando, durata: 0.4, vol: 0.08 + 0.34 * k * k });
      if (i % 3 === 2) briciole(m, d, quando, 2 + Math.round(4 * k), 0.03 + 0.06 * k);
    }
  },
  balzo(m, d, t) {
    soffio(m, d, { t, durata: 0.8, vol: 0.3, f: 220, fine: 900, q: 1.5 });
    battito(m, d, { forma: "sawtooth", f: 64, fine: 120, t, durata: 0.7, vol: 0.2, filtro: 600 });
  },
  bossAtterra(m, d, t) {
    battito(m, d, { f: 90, fine: 26, t, durata: 0.5, vol: 0.6 });
    soffio(m, d, { t, durata: 0.08, vol: 0.5, tipo: "lowpass", f: 1800 });
    soffio(m, d, { t, durata: 0.45, vol: 0.34, tipo: "lowpass", f: 300 });
    briciole(m, d, t, 8, 0.12);
  },
  prende(m, d, t) {
    battito(m, d, { forma: "triangle", f: 523, t, durata: 0.07, vol: 0.14 });
    battito(m, d, { forma: "triangle", f: 784, t: t + 0.07, durata: 0.11, vol: 0.14 });
  },
  colpoAria(m, d, t) {
    soffio(m, d, { t, durata: 0.1, vol: 0.14, f: 700, fine: 2600, q: 2 });
  },
  lancio(m, d, t) {
    soffio(m, d, { t, durata: 0.14, vol: 0.14, f: 900, fine: 300, q: 2 });
  },
  mazzata(m, d, t) {
    battito(m, d, { forma: "triangle", f: 1500, fine: 500, t, durata: 0.05, vol: 0.3 });
    soffio(m, d, { t, durata: 0.03, vol: 0.34, tipo: "highpass", f: 2200 });
    battito(m, d, { f: 240, fine: 120, t, durata: 0.07, vol: 0.26 });
  },
  fuoricampo(m, d, t) {
    SUONI.mazzata(m, d, t);
    soffio(m, d, { t: t + 0.03, durata: 0.32, vol: 0.16, f: 500, fine: 4000, q: 2 });
    battito(m, d, { forma: "triangle", f: 1318, t: t + 0.1, durata: 0.2, vol: 0.09 });
  },
  bossColpito(m, d, t) {
    SUONI.urto(m, d, t);
    battito(m, d, { forma: "sawtooth", f: 120, fine: 60, t: t + 0.04, durata: 0.26, vol: 0.14, filtro: 800 });
  },
  bossMuore(m, d, t) {
    battito(m, d, { f: 110, fine: 24, t, durata: 0.9, vol: 0.6 });
    soffio(m, d, { t, durata: 0.9, vol: 0.4, tipo: "lowpass", f: 1400, fine: 120 });
    battito(m, d, { forma: "sawtooth", f: 160, fine: 40, t, durata: 0.8, vol: 0.16, filtro: 900 });
  },
  vittoria(m, d, t) {
    [523, 659, 784, 1047, 1319].forEach((f, i) => battito(m, d, { forma: "triangle", f, t: t + i * 0.09, durata: i === 4 ? 0.34 : 0.1, vol: 0.16 }));
  },
  porta(m, d, t) {
    soffio(m, d, { t, durata: 0.16, vol: 0.2, f: 500, fine: 200, q: 3 });
    battito(m, d, { f: 150, fine: 90, t: t + 0.12, durata: 0.07, vol: 0.22 });
  },
  parla(m, d, t) {
    [392, 440, 349, 392].forEach((f, i) => battito(m, d, { forma: "triangle", f, t: t + i * 0.08, durata: 0.06, vol: 0.1 }));
  },
  versa(m, d, t) {
    soffio(m, d, { t, durata: 0.7, vol: 0.14, f: 900, fine: 1800, q: 3 });
  },
  spuma(m, d, t) {
    for (let i = 0; i < 7; i++) soffio(m, d, { t: t + i * 0.09, durata: 0.02, vol: 0.09, tipo: "highpass", f: 3500 });
    soffio(m, d, { t, durata: 0.7, vol: 0.05, tipo: "highpass", f: 5000 });
  },
  bicchiere(m, d, t) {
    battito(m, d, { f: 2400, t, durata: 0.09, vol: 0.12 });
    battito(m, d, { f: 3600, t, durata: 0.05, vol: 0.06 });
  },
  sorso(m, d, t) {
    battito(m, d, { forma: "triangle", f: 240, fine: 420, t, durata: 0.14, vol: 0.14 });
  },
  evviva(m, d, t) {
    [523, 659, 784, 1047].forEach((f, i) => battito(m, d, { forma: "triangle", f, t: t + i * 0.07, durata: 0.12, vol: 0.14 }));
    soffio(m, d, { t, durata: 0.32, vol: 0.08, tipo: "highpass", f: 2500 });
  },
  orda(m, d, t) {
    const f = 70 + Math.random() * 40;
    battito(m, d, { forma: "sawtooth", f, fine: f * 0.7, t, durata: 0.22, vol: 0.12, filtro: 500 });
  },
};

export const suona = (m, nome, x, t, extra) => SUONI[nome](m, luogo(m, x), t, extra);

const PASSAGGI = { pipistrello: "pipistrello", fantasma: "fantasma", ragno: "ragno" };
const STAGE_ORDA = 7;
const MUSICA_ACCESA = 0.85;
const MUSICA_ABBASSATA = 0.4;
// Il tema del boss non lascia buchi come la marcetta: più basso, e cede di più sotto i colpi.
const MUSICA_DUELLO = 0.6;
const DUELLO_ABBASSATO = 0.2;
const COLPI_FORTI = new Set(["urto", "ko", "demone", "mano", "mazzata", "fuoricampo", "bossAtterra", "bossColpito", "bossMuore"]);
const SCENE_SILENZIOSE = new Set(["frenata", "silenzio", "trema", "balzo", "spinta", "presa", "morte"]);
const FASI_TEMA_BOSS = new Set(["apertura", "duello", "morte"]);

/** La musica segue la partita, gli effetti arrivano dagli eventi di sim.js. */
export function creaAudio({ muto: partenzaMuta = false } = {}) {
  let ctx = null;
  let m = null;
  let muto = partenzaMuta;
  let stage = 1;
  let luna = false;
  let frase = 0;
  let passo = 0;
  let prossimo = 0;
  let orologio = 0;
  let caramelle = 0;
  let ultimaCaramella = -1;
  let ruggito = 0;
  let inScena = false;
  let inDuello = false;
  let tema = 0;
  let temaVoluto = 0;

  const volume = () => (muto ? 0 : 0.62);

  function pianifica() {
    let c = inDuello ? TEMA_BOSS[tema] : STAGE[Math.min(stage, STAGE.length) - 1];
    while (prossimo < ctx.currentTime + 0.14) {
      const sedicesimo = 60 / (c.bpm * (luna ? FATTORE_LUNA : 1)) / 4;
      if (inDuello) suonaPassoBoss(m, c, FORMA_BOSS[frase], passo, prossimo, sedicesimo);
      else suonaPassoCarnevale(m, c, luna, FORMA[frase], passo, prossimo, sedicesimo);
      prossimo += sedicesimo;
      passo++;
      if (passo === 64) {
        passo = 0;
        frase = inDuello ? fraseBossDopo(frase) : (frase + 1) % FORMA.length;
        // La furia del boss cambia a fine frase: a metà sarebbe uno strappo.
        if (inDuello) {
          tema = temaVoluto;
          c = TEMA_BOSS[tema];
        }
      }
    }
    m.eco.delayTime.setTargetAtTime((60 / c.bpm) * 0.75, ctx.currentTime, 0.05);
  }

  const fermaOrologio = () => {
    clearInterval(orologio);
    orologio = 0;
  };

  const accendiOrologio = () => {
    if (!orologio) orologio = setInterval(pianifica, 25);
  };

  return {
    /** Va chiamato da un gesto dell'utente: i browser non fanno partire l'audio da soli. */
    avvia() {
      ctx ??= new (globalThis.AudioContext || globalThis.webkitAudioContext)();
      m ??= creaMixer(ctx);
      m.uscita.gain.value = volume();
      ctx.resume();
      m.musica.gain.cancelScheduledValues(ctx.currentTime);
      m.musica.gain.setValueAtTime(MUSICA_ACCESA, ctx.currentTime);
      stage = 1;
      luna = false;
      inScena = false;
      inDuello = false;
      frase = 0;
      passo = 0;
      prossimo = ctx.currentTime + 0.08;
      accendiOrologio();
    },

    evento({ tipo, ostacolo, x = ASCOLTO }) {
      if (!m) return;
      const t = ctx.currentTime;
      if (tipo === "caramella") {
        caramelle = t - ultimaCaramella < 0.6 ? caramelle + 1 : 0;
        ultimaCaramella = t;
        suona(m, "caramella", x, t, caramelle);
      } else if (tipo === "sfiora") suona(m, PASSAGGI[ostacolo] ?? "sfiora", x, t);
      else if (SUONI[tipo]) suona(m, tipo, x, t);
      if (COLPI_FORTI.has(tipo) && !inScena) {
        m.musica.gain.setTargetAtTime(inDuello ? DUELLO_ABBASSATO : MUSICA_ABBASSATA, t, 0.008);
        m.musica.gain.setTargetAtTime(inDuello ? MUSICA_DUELLO : MUSICA_ACCESA, t + 0.09, 0.12);
      }
    },

    aggiorna(s) {
      stage = s.stage;
      luna = s.lunaT > 0;
      // Zucco rallenta e la musica si spegne piano: il silenzio prepara il terremoto.
      // Col duello riattacca di colpo, e quando il boss muore sparisce per lasciare tutto all'esplosione.
      const fase = s.boss?.fase;
      const duello = FASI_TEMA_BOSS.has(fase);
      if (m && orologio && duello !== inDuello) {
        inDuello = duello;
        tema = 0;
        frase = 0;
        passo = 0;
        prossimo = ctx.currentTime + 0.05;
      }
      if (s.boss) temaVoluto = livelloTemaBoss(s.boss.vite);
      const scena = SCENE_SILENZIOSE.has(fase);
      if (m && orologio && scena !== inScena) {
        inScena = scena;
        const piena = inDuello ? MUSICA_DUELLO : MUSICA_ACCESA;
        m.musica.gain.cancelScheduledValues(ctx.currentTime);
        m.musica.gain.setTargetAtTime(scena ? 0 : piena, ctx.currentTime, !scena ? 0.08 : fase === "morte" ? 0.12 : 1.8);
      }
      if (!m || !orologio || s.boss || stage < STAGE_ORDA || ctx.currentTime < ruggito) return;
      ruggito = ctx.currentTime + 1.2 + Math.random() * 2.2;
      suona(m, "orda", -40, ctx.currentTime);
    },

    pausa() {
      fermaOrologio();
      ctx?.suspend();
    },

    riprendi() {
      ctx?.resume();
      accendiOrologio();
    },

    /** Dopo la vittoria la marcetta riparte piano, come se arrivasse dalla festa. */
    cinematica() {
      if (!m) return;
      stage = 1;
      luna = false;
      inScena = false;
      inDuello = false;
      frase = 0;
      passo = 0;
      prossimo = ctx.currentTime + 0.05;
      m.musica.gain.cancelScheduledValues(ctx.currentTime);
      m.musica.gain.setTargetAtTime(0.5, ctx.currentTime, 0.5);
    },

    fine() {
      fermaOrologio();
      if (!m) return;
      m.musica.gain.cancelScheduledValues(ctx.currentTime);
      m.musica.gain.setTargetAtTime(0, ctx.currentTime, 0.25);
    },

    get muto() {
      return muto;
    },

    set muto(valore) {
      muto = valore;
      if (m) m.uscita.gain.value = volume();
    },

    chiudi() {
      fermaOrologio();
      ctx?.close();
      ctx = null;
      m = null;
    },
  };
}
