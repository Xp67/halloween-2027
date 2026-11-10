// Verifica della lanterna del cortile. Non usa il codice della demo: ricava tutto dalla variante con un risolutore
// suo (cammino minimo di Dijkstra su tutti gli stati: chi è ancora al cancello + da che parte è la lanterna).

const IDS = ["fantasma", "strega", "zombie", "mummia", "scheletro"];
// Le serie di tempi ammesse (scheda, «varianti»), dal più veloce al più lento, con il minimo esatto.
const SERIE = [
  { tempi: [1, 3, 6, 8, 12], limite: 29 },
  { tempi: [1, 2, 6, 9, 13], limite: 27 },
  { tempi: [1, 3, 4, 9, 11], limite: 26 },
  { tempi: [2, 3, 7, 9, 14], limite: 34 },
  { tempi: [1, 4, 5, 10, 12], limite: 31 },
  { tempi: [1, 2, 7, 11, 15], limite: 30 },
];

// ── Il generatore della variante, rifatto qui come lo descrivono le istruzioni (stesso rng del kit) ──
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
function mescola(rng, lista) {
  const a = [...lista];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
export function varianteAttesa(seme) {
  const rng = casuale(seme);
  const serie = SERIE[Math.floor(rng() * SERIE.length)];
  const tempi = {};
  IDS.forEach((id, i) => { tempi[id] = serie.tempi[i]; });
  return { tempi, limite: serie.limite, ordine: mescola(rng, IDS) };
}

// ── Il risolutore ──
/** Tempo minimo e una sequenza di viaggi che lo realizza: [{ chi: [id, id?] }, ...] alternando andata e ritorno. */
export function risolvi(tempi) {
  const n = IDS.length, tutti = (1 << n) - 1;
  const t = IDS.map((id) => tempi[id]);
  const chiave = (m, l) => m * 2 + l; // m = maschera di chi è al cancello, l = 0 lanterna al cancello, 1 alla porta
  const dist = new Map([[chiave(tutti, 0), 0]]);
  const prec = new Map();
  const coda = [[0, tutti, 0]];
  while (coda.length) {
    coda.sort((a, b) => a[0] - b[0]);
    const [d, m, l] = coda.shift();
    if (d > dist.get(chiave(m, l))) continue;
    if (m === 0) {
      const passi = [];
      let k = chiave(m, l);
      while (prec.has(k)) { const [pk, chi] = prec.get(k); passi.unshift({ chi }); k = pk; }
      return { tempo: d, passi };
    }
    const lato = l === 0 ? m : tutti & ~m;
    const qui = [...Array(n).keys()].filter((i) => lato & (1 << i));
    const gruppi = [];
    for (let i = 0; i < qui.length; i++) {
      gruppi.push([qui[i]]);
      for (let j = i + 1; j < qui.length; j++) gruppi.push([qui[i], qui[j]]);
    }
    for (const g of gruppi) {
      const bit = g.reduce((s, i) => s | (1 << i), 0);
      const m2 = l === 0 ? m & ~bit : m | bit;
      const d2 = d + Math.max(...g.map((i) => t[i]));
      const k2 = chiave(m2, 1 - l);
      if (!dist.has(k2) || d2 < dist.get(k2)) {
        dist.set(k2, d2);
        prec.set(k2, [chiave(m, l), g.map((i) => IDS[i])]);
        coda.push([d2, m2, 1 - l]);
      }
    }
  }
  return null;
}

/** «Il più veloce accompagna tutti, uno alla volta»: la strategia che viene in mente subito. */
export function strategiaAvida(tempi) {
  const per = [...IDS].sort((a, b) => tempi[a] - tempi[b]);
  const [veloce, ...altri] = per;
  const passi = [];
  altri.forEach((id, i) => {
    passi.push({ chi: [veloce, id] });
    if (i < altri.length - 1) passi.push({ chi: [veloce] });
  });
  return passi;
}

/** L'altra strada ottima: prima si accompagna il terzo, poi passano insieme i due più lenti. */
export function strategiaAlternativa(tempi) {
  const [a, b, c, d, e] = [...IDS].sort((x, y) => tempi[x] - tempi[y]);
  return [[a, c], [a], [a, b], [a], [d, e], [b], [a, b]].map((chi) => ({ chi }));
}

/** Simula una sequenza dall'inizio: tempo totale, valida (sempre dal lato della lanterna), tutti arrivati. */
export function simula(tempi, passi) {
  const lati = Object.fromEntries(IDS.map((id) => [id, "cancello"]));
  let lanterna = "cancello", minuti = 0, valida = true;
  for (const { chi } of passi) {
    if (!chi.length || chi.length > 2 || chi.some((id) => lati[id] !== lanterna)) { valida = false; break; }
    const verso = lanterna === "cancello" ? "porta" : "cancello";
    chi.forEach((id) => { lati[id] = verso; });
    lanterna = verso;
    minuti += Math.max(...chi.map((id) => tempi[id]));
  }
  return { minuti, valida, arrivati: IDS.every((id) => lati[id] === "porta") };
}

export default async function verifica(t) {
  const tutti = (s, lato) => IDS.every((id) => s.lati[id] === lato);
  const nomi = (chi) => chi.join("+");

  // ── 1. Le varianti: dieci semi, ognuna uguale al generatore delle istruzioni e risolvibile al minuto esatto ──
  const serieViste = new Set();
  for (const seme of [1, 2, 3, 4, 5, 6, 7, 8, 101, 2027]) {
    const v = await t.nuova(seme);
    const attesa = varianteAttesa(seme);
    const serie = SERIE.findIndex((s) => s.tempi.every((x, i) => v.tempi?.[IDS[i]] === x));
    const r = v.tempi ? risolvi(v.tempi) : null;
    const avida = v.tempi ? simula(v.tempi, strategiaAvida(v.tempi)) : { minuti: 0 };
    serieViste.add(serie);
    t.controlla(
      serie >= 0 && v.limite === SERIE[serie].limite && r && r.tempo === v.limite && avida.minuti > v.limite
        && Array.isArray(v.ordine) && v.ordine.length === 5 && IDS.every((id) => v.ordine.includes(id)),
      `seme ${seme}: tempi ${IDS.map((id) => v.tempi?.[id]).join("-")}, limite ${v.limite} = minimo del risolutore `
        + `(uno alla volta: ${avida.minuti}), ordine ${v.ordine?.join(",")}`,
    );
    t.controlla(
      JSON.stringify(attesa.tempi) === JSON.stringify(v.tempi) && attesa.limite === v.limite
        && JSON.stringify(attesa.ordine) === JSON.stringify(v.ordine),
      `seme ${seme}: la variante è quella del generatore delle istruzioni`,
    );
  }
  t.controlla(serieViste.size >= 3, `i semi danno serie di tempi diverse (${serieViste.size} su 10 semi)`);

  // ── 2. Una partita pulita con l'altra strada ottima: clic veri per il primo viaggio, tocco sulla lanterna ──
  let v = await t.nuova(4242);
  let alt = strategiaAlternativa(v.tempi);
  t.controlla(simula(v.tempi, alt).minuti === v.limite, `seme 4242: anche l'altra strada ottima fa ${v.limite} minuti`);
  for (const id of alt[0].chi) {
    const p = await t.chiama("posizione", id);
    await t.clicScena(p.x, p.y);
  }
  let sg = await t.chiama("statoGioco");
  t.controlla(sg.scelti.length === 2 && alt[0].chi.every((id) => sg.scelti.includes(id)), `i clic sui mostri li scelgono (${sg.scelti.join(", ")})`);
  const pl = await t.chiama("posizioneLanterna");
  await t.clicScena(pl.x, pl.y);
  sg = await t.chiama("statoGioco");
  t.controlla(alt[0].chi.every((id) => sg.lati[id] === "porta") && sg.lanterna === "porta" && sg.minuti === Math.max(...alt[0].chi.map((id) => v.tempi[id])) && sg.scelti.length === 0,
    `toccare la lanterna fa attraversare i due scelti (minuti ${sg.minuti})`);
  let r = null;
  for (const passo of alt.slice(1)) r = await t.gioca({ tipo: "attraversa", chi: passo.chi });
  let s = await t.stato();
  sg = await t.chiama("statoGioco");
  t.controlla(r && r.risolto && s.risolto && s.errori === 0 && sg.minuti === v.limite && tutti(sg, "porta"),
    `l'altra strada ottima risolve senza errori (${sg.minuti}/${v.limite} minuti)`);
  await t.aspetta(600);

  // ── 3. La partita principale ──
  v = await t.nuova(7777);
  const sol = risolvi(v.tempi);
  t.log(`seme 7777: tempi ${IDS.map((id) => `${id} ${v.tempi[id]}`).join(", ")}; limite ${v.limite}`);
  t.log(`soluzione del risolutore: ${sol.passi.map((p) => nomi(p.chi)).join(" · ")} = ${sol.tempo}`);

  // 3a. Il testo della carta usa i tempi della variante.
  await t.bottone("testo");
  await t.aspetta(200);
  const carta = await t.pagina.evaluate(() => document.querySelector(".kit-carta")?.textContent ?? "");
  t.controlla(carta.includes(`con la gamba di legno ${v.tempi.scheletro}.`) && carta.includes(`la strega ${v.tempi.strega},`)
    && carta.includes(`si spegne dopo ${v.limite} minuti`),
    "la carta del testo riporta i tempi e il limite della variante");
  await t.chiudiCarte();

  // 3b. Mosse impossibili: rifiutate, nessun errore.
  const per = [...IDS].sort((a, b) => v.tempi[a] - v.tempi[b]);
  const impossibili = [
    [{ tipo: "attraversa", chi: [] }, "nessuno"],
    [{ tipo: "attraversa", chi: [per[0], per[1], per[2]] }, "in tre"],
    [{ tipo: "attraversa", chi: [per[0], per[0]] }, "due volte lo stesso"],
    [{ tipo: "attraversa", chi: ["drago"] }, "un mostro che non c'è"],
    [{ tipo: "vola" }, "una mossa che non esiste"],
    [{ tipo: "ricomincia" }, "ricominciare prima di partire"],
  ];
  for (const [mossa, cosa] of impossibili) {
    r = await t.gioca(mossa);
    t.controlla(r && r.valida === false, `rifiutata: ${cosa} (${JSON.stringify(r)})`);
  }
  s = await t.stato();
  t.controlla(s.errori === 0, "le mosse impossibili non contano come errori");

  // 3c. Scelta con i clic: due al massimo, un clic sul mostro scelto lo toglie; poi «Attraversa».
  for (const id of [per[0], per[1], per[2]]) {
    const p = await t.chiama("posizione", id);
    await t.clicScena(p.x, p.y);
  }
  sg = await t.chiama("statoGioco");
  t.controlla(sg.scelti.length === 2 && !sg.scelti.includes(per[2]), "un terzo mostro non si può scegliere");
  let p1 = await t.chiama("posizione", per[1]);
  await t.clicScena(p1.x, p1.y);
  sg = await t.chiama("statoGioco");
  t.controlla(sg.scelti.length === 1 && sg.scelti[0] === per[0], "un clic sul mostro scelto lo toglie");
  await t.clicScena(p1.x, p1.y);
  await t.bottone("attraversa");
  sg = await t.chiama("statoGioco");
  t.controlla(sg.lati[per[0]] === "porta" && sg.lati[per[1]] === "porta" && sg.lanterna === "porta" && sg.minuti === v.tempi[per[1]],
    `il bottone «Attraversa» porta i due più veloci alla porta (minuti ${sg.minuti})`);
  await t.foto("andata");

  // 3d. Chi è al cancello non può partire: la lanterna è alla porta.
  r = await t.gioca({ tipo: "attraversa", chi: [per[2]] });
  s = await t.stato();
  t.controlla(r && r.valida === false && s.errori === 0, "partire senza la lanterna è rifiutato, senza errore");

  // 3e. Ricaricando la pagina la partita riprende da dove era.
  await t.ricarica();
  await t.chiudiCarte();
  sg = await t.chiama("statoGioco");
  t.controlla(sg.minuti === v.tempi[per[1]] && sg.lati[per[0]] === "porta" && sg.lanterna === "porta",
    "ricaricando la pagina i mostri restano dove erano");

  // 3f. L'errore tipico: il più veloce accompagna tutti. La lanterna si spegne: errore e tutti di nuovo al cancello.
  const avida = strategiaAvida(v.tempi).slice(1); // il primo viaggio (i due più veloci) è già fatto
  let spenta = null, giocati = 0;
  for (const passo of avida) {
    r = await t.gioca({ tipo: "attraversa", chi: passo.chi });
    giocati++;
    if (r && r.errore) { spenta = r; break; }
    if (!r || !r.ok) break;
  }
  s = await t.stato();
  sg = await t.chiama("statoGioco");
  t.controlla(spenta && spenta.motivo === "spenta" && spenta.minuti > v.limite && s.errori === 1 && !s.risolto,
    `accompagnando uno alla volta la lanterna si spegne al viaggio ${giocati + 1}: un errore (${JSON.stringify(spenta)})`);
  t.controlla(sg.minuti === 0 && tutti(sg, "cancello") && sg.lanterna === "cancello" && sg.viaggi.length === 0,
    "dopo lo spegnimento si riparte da zero, tutti al cancello");
  await t.foto("spenta");

  // 3g. «Ricomincia» dal bottone: il primo tocco chiede conferma, il secondo conta un errore.
  r = await t.gioca({ tipo: "attraversa", chi: [per[0], per[1]] });
  t.controlla(r && r.ok, "di nuovo i due più veloci alla porta");
  await t.bottone("ricomincia");
  s = await t.stato();
  sg = await t.chiama("statoGioco");
  t.controlla(s.errori === 1 && sg.minuti === v.tempi[per[1]], "il primo tocco su «Ricomincia» chiede solo conferma");
  await t.bottone("ricomincia");
  s = await t.stato();
  sg = await t.chiama("statoGioco");
  t.controlla(s.errori === 2 && sg.minuti === 0 && tutti(sg, "cancello") && !s.risolto, "confermare «Ricomincia» conta un errore e riporta tutti al cancello");
  t.controlla(s.dorateInPalio === Math.max(1, s.dorate - Math.floor(2 / s.erroriConcessi)), `dopo due errori le dorate in palio sono ${s.dorateInPalio}`);

  // 3h. La soluzione del risolutore.
  for (const passo of sol.passi) r = await t.gioca({ tipo: "attraversa", chi: passo.chi });
  s = await t.stato();
  sg = await t.chiama("statoGioco");
  t.controlla(r && r.risolto && s.risolto && s.errori === 2 && sg.minuti === v.limite && tutti(sg, "porta"),
    `la soluzione del risolutore risolve in ${sg.minuti}/${v.limite} minuti`);
  await t.aspetta(1900);
}
