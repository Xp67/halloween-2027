// Verifica dell'Angelo Azzurro (travasi). Non usa il codice della demo: ricava variante attesa e soluzione
// da sé, con lo stesso generatore del kit (mulberry32) e una BFS sugli stati [shaker, grande, piccolo].
//
// Contratto (ISTRUZIONI.md, «Aggancio per le prove»):
//   gioca({ da, a })                → { ok, versati, livelli, travasi } | { risolto, … } | { errore, motivo: "limite", … }
//                                     | { valida: false, motivo: "stesso" | "vuoto" | "pieno" | "mossa" }
//   gioca({ azione: "ricomincia" }) → { errore, motivo: "ricomincia", livelli, travasi: 0 } | { valida: false, motivo: "inizio" }
//   statoGioco()                    → { livelli, capacita, travasi, limite, selezionato }
//   posizione(i)                    → { x, y } in pixel della scena, dentro la zona di tocco del contenitore i

// Le ricette verificate: capacità di shaker, bicchiere grande, bicchiere piccolo e numero minimo di travasi.
const RICETTE = [
  [12, 8, 5, 7],
  [10, 7, 3, 9],
  [12, 7, 5, 11],
  [14, 8, 3, 9],
  [12, 9, 5, 8],
  [16, 10, 3, 11],
];
const MARGINE = 6; // travasi concessi oltre il minimo

/** Il generatore del kit (EscapeDemo.casuale): stesso seme, stessa sequenza. */
function casuale(seme) {
  let a = seme >>> 0;
  return function () {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** La variante che la demo deve dare per questo seme: una sola chiamata a rng, intero(rng, 0, 5). */
function attesa(seme) {
  const r = RICETTE[Math.floor(casuale(seme)() * RICETTE.length)];
  return { capacita: r.slice(0, 3), meta: r[0] / 2, minimo: r[3], limite: r[3] + MARGINE };
}

/** Un travaso: null se impossibile, altrimenti i livelli nuovi e i cl versati. */
function versa(livelli, cap, da, a) {
  if (da === a || livelli[da] === 0 || livelli[a] === cap[a]) return null;
  const q = Math.min(livelli[da], cap[a] - livelli[a]);
  const nuovi = [...livelli];
  nuovi[da] -= q;
  nuovi[a] += q;
  return { nuovi, q };
}

/** BFS dallo shaker pieno a [A/2, A/2, 0]: la sequenza più corta di travasi { da, a }. */
function risolvi(cap) {
  const inizio = [cap[0], 0, 0];
  const meta = [cap[0] / 2, cap[0] / 2, 0].join(",");
  const da = new Map([[inizio.join(","), null]]);
  const coda = [inizio];
  while (coda.length) {
    const s = coda.shift();
    const k = s.join(",");
    if (k === meta) {
      const mosse = [];
      for (let c = k; da.get(c); c = da.get(c).prima) mosse.unshift(da.get(c).mossa);
      return mosse;
    }
    for (let i = 0; i < 3; i++)
      for (let j = 0; j < 3; j++) {
        const r = versa(s, cap, i, j);
        if (!r) continue;
        const kn = r.nuovi.join(",");
        if (!da.has(kn)) {
          da.set(kn, { prima: k, mossa: { da: i, a: j } });
          coda.push(r.nuovi);
        }
      }
  }
  return null;
}

/** Applica una sequenza di travasi e ritorna i livelli finali (null se una mossa è impossibile). */
function gioca(cap, mosse) {
  let s = [cap[0], 0, 0];
  for (const m of mosse) {
    const r = versa(s, cap, m.da, m.a);
    if (!r) return null;
    s = r.nuovi;
  }
  return s;
}

const uguali = (x, y) => JSON.stringify(x) === JSON.stringify(y);
const proporzionale853 = ([A, B, C]) => A * 5 === B * 8 && A * 3 === C * 8;

export default async function verifica(t) {
  // ── 0. Il risolutore da solo, sulle ricette scritte nelle istruzioni ──
  for (const r of RICETTE) {
    const cap = r.slice(0, 3);
    const sol = risolvi(cap);
    const fine = sol && gioca(cap, sol);
    t.controlla(sol && sol.length === r[3] && uguali(fine, [cap[0] / 2, cap[0] / 2, 0]),
      `risolutore: ${cap.join("-")} si divide in ${r[3]} travasi`);
  }
  t.controlla(RICETTE.every((r) => !proporzionale853(r.slice(0, 3))), "nessuna ricetta è l'8-5-3 classico (o un suo multiplo)");

  // ── 1. Varianti: quella attesa per il seme, vincoli, stato iniziale ──
  const viste = new Set();
  const controllaVariante = async (seme, v) => {
    const att = attesa(seme);
    const [A, B, C] = v.capacita || [];
    t.controlla(uguali(v.capacita, att.capacita) && v.meta === att.meta && v.minimo === att.minimo && v.limite === att.limite,
      `seme ${seme}: variante ${JSON.stringify(v)} (attesa ${att.capacita.join("-")}, minimo ${att.minimo}, limite ${att.limite})`);
    const sol = A ? risolvi([A, B, C]) : null;
    t.controlla(A % 2 === 0 && B > A / 2 && A / 2 > C && C >= 2 && !proporzionale853([A, B, C]) &&
      sol && sol.length === v.minimo && v.limite === v.minimo + MARGINE,
      `seme ${seme}: ${A}-${B}-${C} → ${A / 2} + ${A / 2} è risolvibile in ${sol && sol.length} travasi, limite ${v.limite}`);
    viste.add(String(v.capacita));
  };
  await controllaVariante(t.seme, t.variante);
  for (const seme of [1, 2, 4, 7, 9, 14]) {
    const v = await t.nuova(seme);
    await controllaVariante(seme, v);
    const s = await t.chiama("statoGioco");
    t.controlla(uguali(s.livelli, [v.capacita[0], 0, 0]) && s.travasi === 0 && s.limite === v.limite &&
      uguali(s.capacita, v.capacita) && s.selezionato === null,
      `seme ${seme}: si parte con lo shaker pieno, bicchieri vuoti, travasi 0/${v.limite}`);
  }
  t.controlla(viste.size >= 6, `i semi provati danno tutte e sei le ricette (${viste.size})`);

  // ── 2. Partita sul seme 7: la ricetta principale 12-8-5 → 6 + 6 ──
  const v = await t.nuova(7);
  const cap = v.capacita;
  const [A, , C] = cap;
  const L = v.limite;
  t.controlla(uguali(cap, [12, 8, 5]) && L === 13, "seme 7: shaker 12, bicchieri 8 e 5, limite 13");

  // Mosse impossibili: rifiutate, nessun errore, nessun travaso.
  let r = await t.gioca({ da: 0, a: 0 });
  t.controlla(r.valida === false && r.motivo === "stesso", "versare un contenitore in sé stesso viene rifiutato");
  r = await t.gioca({ da: 1, a: 2 });
  t.controlla(r.valida === false && r.motivo === "vuoto", "versare da un bicchiere vuoto viene rifiutato");
  r = await t.gioca({ da: 5, a: 1 });
  t.controlla(r.valida === false && r.motivo === "mossa", "una mossa con un contenitore che non esiste viene rifiutata");
  r = await t.gioca({ da: 0, a: 2 });
  t.controlla(r.ok === true && r.versati === C && uguali(r.livelli, [A - C, 0, C]) && r.travasi === 1,
    `primo travaso shaker → piccolo: ${JSON.stringify(r)}`);
  r = await t.gioca({ da: 0, a: 2 });
  t.controlla(r.valida === false && r.motivo === "pieno", "versare in un bicchiere già pieno viene rifiutato");
  let s = await t.stato();
  let sg = await t.chiama("statoGioco");
  t.controlla(s.errori === 0 && sg.travasi === 1 && uguali(sg.livelli, [A - C, 0, C]),
    "le mosse impossibili non contano come errori né come travasi");

  // Errore tipico: finire i travasi senza dividere il drink (avanti e indietro fra shaker e bicchiere piccolo).
  let tuttiOk = true;
  for (let n = 2; n < L; n++) {
    r = await t.gioca(n % 2 === 0 ? { da: 2, a: 0 } : { da: 0, a: 2 });
    if (!(r.ok === true && r.travasi === n)) tuttiOk = false;
  }
  s = await t.stato();
  t.controlla(tuttiOk && s.errori === 0, `${L - 1} travasi senza dividere: ancora nessun errore`);
  r = await t.gioca(L % 2 === 0 ? { da: 2, a: 0 } : { da: 0, a: 2 });
  s = await t.stato();
  sg = await t.chiama("statoGioco");
  t.controlla(r.errore === true && r.motivo === "limite" && s.errori === 1 && !s.risolto,
    `il travaso numero ${L} senza il drink diviso è un errore (${JSON.stringify(r)})`);
  t.controlla(uguali(sg.livelli, [A, 0, 0]) && sg.travasi === 0 && sg.selezionato === null,
    "dopo l'errore si riparte: shaker pieno, bicchieri vuoti, travasi a 0");
  await t.aspetta(1700); // il travaso (al massimo 1,1 s) e poi lo shaker che si riempie (0,5 s); le reazioni durano 2 s
  await t.foto("errore");
  await t.aspetta(600);

  // Ricomincia: all'inizio viene rifiutato; dopo un travaso il bottone chiede conferma e poi conta come errore.
  r = await t.gioca({ azione: "ricomincia" });
  s = await t.stato();
  t.controlla(r.valida === false && r.motivo === "inizio" && s.errori === 1, "ricominciare quando si è già all'inizio viene rifiutato");
  r = await t.gioca({ da: 0, a: 1 });
  t.controlla(r.ok === true && r.travasi === 1, "un travaso prima di ricominciare");
  await t.bottone("ricomincia");
  await t.aspetta(150);
  s = await t.stato();
  sg = await t.chiama("statoGioco");
  t.controlla(s.errori === 1 && sg.travasi === 1, "il primo tocco su Ricomincia chiede solo conferma");
  await t.bottone("ricomincia");
  await t.aspetta(300);
  s = await t.stato();
  sg = await t.chiama("statoGioco");
  t.controlla(s.errori === 2 && s.dorateInPalio === 2 && uguali(sg.livelli, [A, 0, 0]) && sg.travasi === 0,
    `il secondo tocco ricomincia e conta come errore (errori ${s.errori}, dorate in palio ${s.dorateInPalio})`);
  await t.aspetta(1500);

  // L'interfaccia vera: un bicchiere vuoto non si prende; poi i primi due travasi della soluzione con un clic e un trascinamento.
  const sol = risolvi(cap);
  const pos = [];
  for (let i = 0; i < 3; i++) pos.push(await t.chiama("posizione", i));
  await t.clicScena(pos[1].x, pos[1].y);
  await t.aspetta(120);
  sg = await t.chiama("statoGioco");
  s = await t.stato();
  t.controlla(sg.selezionato === null && sg.travasi === 0 && s.errori === 2, "toccare un bicchiere vuoto non lo prende e non è un errore");

  const m0 = sol[0];
  await t.clicScena(pos[m0.da].x, pos[m0.da].y);
  await t.aspetta(120);
  sg = await t.chiama("statoGioco");
  t.controlla(sg.selezionato === m0.da, `un clic prende il contenitore ${m0.da}`);
  await t.clicScena(pos[m0.a].x, pos[m0.a].y);
  await t.aspetta(120);
  sg = await t.chiama("statoGioco");
  t.controlla(sg.travasi === 1 && uguali(sg.livelli, gioca(cap, sol.slice(0, 1))) && sg.selezionato === null,
    `un secondo clic versa nel contenitore ${m0.a}: ${sg.livelli.join("-")}`);
  await t.aspetta(1200);

  const m1 = sol[1];
  await t.trascinaScena(pos[m1.da].x, pos[m1.da].y, pos[m1.a].x, pos[m1.a].y);
  await t.aspetta(150);
  sg = await t.chiama("statoGioco");
  t.controlla(sg.travasi === 2 && uguali(sg.livelli, gioca(cap, sol.slice(0, 2))),
    `trascinare il contenitore ${m1.da} sul ${m1.a} versa: ${sg.livelli.join("-")}`);
  await t.aspetta(1200);
  await t.foto("a-meta");

  // Ricaricando la pagina la partita riprende da dove era (niente ripartenze gratis).
  await t.ricarica();
  await t.chiudiCarte();
  sg = await t.chiama("statoGioco");
  t.controlla(sg.travasi === 2 && uguali(sg.livelli, gioca(cap, sol.slice(0, 2))),
    "ricaricando la pagina restano livelli e travasi");

  // Il resto della soluzione del risolutore.
  for (let i = 2; i < sol.length; i++) {
    r = await t.gioca(sol[i]);
    const ultimo = i === sol.length - 1;
    if (ultimo) t.controlla(r.risolto === true, `il travaso ${i + 1} divide il drink: ${JSON.stringify(r)}`);
    else if (!(r.ok === true && r.travasi === i + 1)) t.controlla(false, `travaso ${i + 1} della soluzione: ${JSON.stringify(r)}`);
  }
  s = await t.stato();
  sg = await t.chiama("statoGioco");
  t.controlla(s.risolto && s.errori === 2 && uguali(sg.livelli, [A / 2, A / 2, 0]),
    `la soluzione del risolutore (${sol.length} travasi) risolve il rompicapo con 2 errori`);
  await t.aspetta(2600);
}
