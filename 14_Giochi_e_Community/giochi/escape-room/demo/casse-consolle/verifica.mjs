// Verifica di «casse-consolle» (Le casse della consolle). Non usa il codice della demo: ricava tutto dalla variante
// con un risolutore suo (ricerca in ampiezza sulle disposizioni della tavola 5×4).
//
// Regole (da ISTRUZIONI.md): tavola di 5 colonne × 4 righe; una mossa sposta UN pezzo in linea retta di una o più
// caselle libere; il flight case (2×2) esce quando il suo angolo in alto a sinistra arriva in (3, 2), davanti alla
// porta del backstage. Ogni disposizione si risolve in 34 mosse al minimo; il tetto è 100 mosse: alla centesima
// mossa senza soluzione conta un errore e tutto torna com'era all'inizio (contatore a 0).
//
// Lettere delle righe: F flight case (tutte e 4 le caselle), C/c cassa (alto/basso), W/w subwoofer
// (sinistra/destra), s spia, . vuoto.

const L = 5, A = 4;
const META = { x: 3, y: 2 };
const MINIMO = 34;
const TETTO = 100;
const DISPOSIZIONI = [
  ["FFWw.", "FFssC", "CWwCc", "c.scs"],
  ["FFWw.", "FFsCs", "Cs.cC", "cWwsc"],
  ["FFWwC", "FFC.c", "Cscs.", "csWws"],
  ["FFWw.", "FFs.s", "CCCss", "cccWw"],
  ["FFWws", "FFC.s", "CCcWw", "cc.ss"],
  ["FFsWw", "FFsCs", "CC.c.", "ccWws"],
  ["FFsss", "FFsCC", "CWwcc", "c..Ww"],
  ["FFWw.", "FFWw.", "ssCCC", "ssccc"],
  ["FFWwC", "FFWwc", "sC.sC", "sc.sc"],
  ["FFC.s", "FFcss", "CCWws", "cc.Ww"],
  ["FFCC.", "FFccs", "CsWw.", "csWws"],
  ["FFWwC", "FFCsc", "sCc..", "scsWw"],
];
const DIREZIONI = { su: [0, -1], giu: [0, 1], sinistra: [-1, 0], destra: [1, 0] };
const OPPOSTA = { su: "giu", giu: "su", sinistra: "destra", destra: "sinistra" };

// ── Il risolutore ──

/** Da 4 righe a una stringa di 20 caratteri (indice = y × 5 + x). */
const piatta = (righe) => righe.join("");
const inRighe = (g) => [0, 1, 2, 3].map((y) => g.slice(y * L, y * L + L));

/** I pezzi di una disposizione: { tipo, x, y, w, h }, oppure un elenco di problemi. */
function leggiPezzi(g) {
  const pezzi = [], problemi = [];
  const preso = new Array(L * A).fill(false);
  const at = (x, y) => (x >= 0 && y >= 0 && x < L && y < A ? g[y * L + x] : "#");
  for (let y = 0; y < A; y++) for (let x = 0; x < L; x++) {
    const i = y * L + x, ch = g[i];
    if (preso[i] || ch === ".") continue;
    let p = null;
    if (ch === "F" && at(x + 1, y) === "F" && at(x, y + 1) === "F" && at(x + 1, y + 1) === "F") p = { tipo: "flight", x, y, w: 2, h: 2 };
    else if (ch === "C" && at(x, y + 1) === "c") p = { tipo: "cassa", x, y, w: 1, h: 2 };
    else if (ch === "W" && at(x + 1, y) === "w") p = { tipo: "subwoofer", x, y, w: 2, h: 1 };
    else if (ch === "s") p = { tipo: "spia", x, y, w: 1, h: 1 };
    if (!p) { problemi.push(`lettera «${ch}» fuori posto in (${x}, ${y})`); continue; }
    for (let dy = 0; dy < p.h; dy++) for (let dx = 0; dx < p.w; dx++) {
      if (preso[(y + dy) * L + x + dx]) problemi.push(`caselle sovrapposte in (${x + dx}, ${y + dy})`);
      preso[(y + dy) * L + x + dx] = true;
    }
    pezzi.push(p);
  }
  const conta = (t) => pezzi.filter((p) => p.tipo === t).length;
  if (conta("flight") !== 1) problemi.push(`flight case: ${conta("flight")} invece di 1`);
  if (conta("cassa") !== 3) problemi.push(`casse: ${conta("cassa")} invece di 3`);
  if (conta("subwoofer") !== 2) problemi.push(`subwoofer: ${conta("subwoofer")} invece di 2`);
  if (conta("spia") !== 4) problemi.push(`spie: ${conta("spia")} invece di 4`);
  const vuote = [...g].filter((c) => c === ".").length;
  if (vuote !== 2) problemi.push(`caselle vuote: ${vuote} invece di 2`);
  return { pezzi, problemi };
}

/** Il pezzo che occupa la casella (x, y), o null. */
function pezzoIn(pezzi, x, y) {
  return pezzi.find((p) => x >= p.x && x < p.x + p.w && y >= p.y && y < p.y + p.h) || null;
}

/** Applica una mossa { x, y, dir, passi } (x, y = una casella qualunque del pezzo): nuova stringa o null. */
function applica(g, mossa) {
  const { pezzi } = leggiPezzi(g);
  const d = DIREZIONI[mossa.dir];
  if (!d || !Number.isInteger(mossa.passi) || mossa.passi < 1) return null;
  const p = pezzoIn(pezzi, mossa.x, mossa.y);
  if (!p) return null;
  const nx = p.x + d[0] * mossa.passi, ny = p.y + d[1] * mossa.passi;
  if (nx < 0 || ny < 0 || nx + p.w > L || ny + p.h > A) return null;
  const a = [...g];
  for (let dy = 0; dy < p.h; dy++) for (let dx = 0; dx < p.w; dx++) a[(p.y + dy) * L + p.x + dx] = ".";
  // tutte le caselle attraversate devono essere libere
  for (let k = 1; k <= mossa.passi; k++) {
    const qx = p.x + d[0] * k, qy = p.y + d[1] * k;
    for (let dy = 0; dy < p.h; dy++) for (let dx = 0; dx < p.w; dx++) if (a[(qy + dy) * L + qx + dx] !== ".") return null;
  }
  const lettere = { flight: [["F", "F"], ["F", "F"]], cassa: [["C"], ["c"]], subwoofer: [["W", "w"]], spia: [["s"]] }[p.tipo];
  for (let dy = 0; dy < p.h; dy++) for (let dx = 0; dx < p.w; dx++) a[(ny + dy) * L + nx + dx] = lettere[dy][dx];
  return a.join("");
}

/** Tutte le mosse possibili da g: [{ mossa, g2 }]. La mossa usa l'angolo in alto a sinistra del pezzo. */
function mossePossibili(g) {
  const r = [];
  for (const p of leggiPezzi(g).pezzi) for (const dir of Object.keys(DIREZIONI)) {
    for (let passi = 1; passi <= 4; passi++) {
      const mossa = { x: p.x, y: p.y, dir, passi };
      const g2 = applica(g, mossa);
      if (!g2) break;
      r.push({ mossa, g2, pezzo: p });
    }
  }
  return r;
}

const fuori = (g) => { const i = g.indexOf("F"); return i % L === META.x && Math.floor(i / L) === META.y; };

/** Ricerca in ampiezza: il numero minimo di mosse e una soluzione minima, o null se non si risolve. */
function risolvi(righe) {
  const g0 = piatta(righe);
  if (fuori(g0)) return { minimo: 0, soluzione: [] };
  const da = new Map([[g0, null]]);
  const coda = [g0];
  for (let i = 0; i < coda.length; i++) {
    const g = coda[i];
    for (const { mossa, g2 } of mossePossibili(g)) {
      if (da.has(g2)) continue;
      da.set(g2, { g, mossa });
      if (fuori(g2)) {
        const soluzione = [];
        for (let s = g2; da.get(s); s = da.get(s).g) soluzione.unshift(da.get(s).mossa);
        return { minimo: soluzione.length, soluzione, stati: da.size };
      }
      coda.push(g2);
    }
  }
  return null;
}

// ── La verifica ──

export default async function verifica(t) {
  const stessa = (a, b) => JSON.stringify(a) === JSON.stringify(b);
  const gioco = () => t.chiama("statoGioco");
  const centro = (x, y) => t.chiama("posizione", x, y);
  const cache = new Map();
  const risolviMemo = (righe) => {
    const k = piatta(righe);
    if (!cache.has(k)) cache.set(k, risolvi(righe));
    return cache.get(k);
  };

  // 1. Le varianti: su 8 semi, disposizione dell'elenco, pezzi coerenti, flight case chiuso in alto a sinistra,
  //    minimo di 34 mosse calcolato dal risolutore, tetto di 100.
  const viste = new Set();
  for (const seme of [1, 2, 3, 4, 5, 6, 7, 8]) {
    const v = await t.nuova(seme);
    const problemi = [];
    if (!v || !Array.isArray(v.righe) || v.righe.length !== A || v.righe.some((r) => typeof r !== "string" || r.length !== L)) {
      t.controlla(false, `seme ${seme}: la variante non ha righe 5×4 (${JSON.stringify(v)})`);
      continue;
    }
    const g = piatta(v.righe);
    const { pezzi, problemi: pp } = leggiPezzi(g);
    problemi.push(...pp);
    const n = DISPOSIZIONI.findIndex((d) => piatta(d) === g);
    if (n < 0) problemi.push("la disposizione non è nell'elenco delle istruzioni");
    else if (v.disposizione !== n + 1) problemi.push(`disposizione ${v.disposizione} invece di ${n + 1}`);
    if (v.minimo !== MINIMO) problemi.push(`minimo ${v.minimo} invece di ${MINIMO}`);
    if (v.tetto !== TETTO) problemi.push(`tetto ${v.tetto} invece di ${TETTO}`);
    if (!v.meta || v.meta.x !== META.x || v.meta.y !== META.y) problemi.push("meta diversa da (3, 2)");
    const f = pezzi.find((p) => p.tipo === "flight");
    if (!f || f.x !== 0 || f.y !== 0) problemi.push("il flight case non parte in alto a sinistra");
    if (f && f.x === 0 && f.y === 0 && [[2, 0], [2, 1], [0, 2], [1, 2]].some(([x, y]) => g[y * L + x] === ".")) problemi.push("il flight case non è chiuso nell'angolo");
    // i pezzi della variante corrispondono alle righe (id compresi: numerati in ordine di lettura)
    const attesi = [];
    const numeri = { cassa: 0, subwoofer: 0, spia: 0 };
    const sigla = { cassa: "C", subwoofer: "W", spia: "S" };
    for (const p of pezzi) attesi.push({ id: p.tipo === "flight" ? "F" : sigla[p.tipo] + ++numeri[p.tipo], ...p });
    const firma = (lista) => (Array.isArray(lista) ? lista.map((p) => `${p.id}:${p.tipo}:${p.x},${p.y}:${p.w}x${p.h}`).join(" ") : String(lista));
    if (firma(v.pezzi) !== firma(attesi)) problemi.push(`pezzi diversi da quelli attesi: ${firma(v.pezzi)} invece di ${firma(attesi)}`);
    const r = risolviMemo(v.righe);
    if (!r) problemi.push("il risolutore non trova soluzioni");
    else if (r.minimo !== MINIMO) problemi.push(`il risolutore trova ${r.minimo} mosse invece di ${MINIMO}`);
    viste.add(g);
    t.controlla(problemi.length === 0, `seme ${seme}: disposizione ${v.disposizione}, minimo ${r ? r.minimo : "?"} mosse` + (problemi.length ? ` — ${problemi.join("; ")}` : ""));
  }
  t.controlla(viste.size >= 3, `semi diversi danno disposizioni diverse (${viste.size} su 8 semi)`);

  // 2. Mosse impossibili: rifiutate, nessun errore, contatore fermo.
  const v = await t.nuova(20271031);
  const g0 = piatta(v.righe);
  const vuota = g0.indexOf(".");
  const prove = [
    [{ x: vuota % L, y: Math.floor(vuota / L), dir: "destra", passi: 1 }, "una casella vuota"],
    [{ x: 0, y: 0, dir: "destra", passi: 1 }, "il flight case chiuso nell'angolo"],
    [{ x: 1, y: 1, dir: "su", passi: 1 }, "il flight case contro il bordo"],
    [{ x: 9, y: 0, dir: "giu", passi: 1 }, "una casella fuori dalla tavola"],
    [{ x: 2, y: 0, dir: "obliquo", passi: 1 }, "una direzione che non esiste"],
  ];
  // un pezzo spostato di una casella più del possibile
  const possibili = mossePossibili(g0);
  const lunga = possibili.reduce((m, c) => (!m || c.mossa.passi > m.mossa.passi ? c : m), null);
  prove.push([{ ...lunga.mossa, passi: lunga.mossa.passi + 1 }, "un pezzo spinto oltre lo spazio libero"]);
  for (const [mossa, descrizione] of prove) {
    const r = await t.gioca(mossa);
    const s = await t.stato();
    const sg = await gioco();
    t.controlla(r && r.valida === false && s.errori === 0 && sg.mosse === 0 && piatta(sg.righe) === g0,
      `mossa impossibile rifiutata senza errore: ${descrizione} (${JSON.stringify(r)})`);
  }

  // 3. L'interfaccia vera: una mossa trascinando, una con due tocchi (pezzo, poi casella libera).
  const prima = possibili.find((c) => c.mossa.passi === 1) || possibili[0];
  {
    const { x, y, dir, passi } = prima.mossa;
    const [dx, dy] = DIREZIONI[dir];
    const a = await centro(x, y);
    const b = await centro(x + dx * passi, y + dy * passi);
    await t.trascinaScena(a.x, a.y, b.x, b.y, 10);
    await t.aspetta(450);
    const sg = await gioco();
    t.controlla(piatta(sg.righe) === prima.g2 && sg.mosse === 1, `trascinando il pezzo in (${x}, ${y}) verso ${dir} si sposta e conta una mossa`);
  }
  let g1 = prima.g2;
  {
    // un pezzo diverso da quello appena trascinato (che ora ha l'angolo in alto a sinistra in `spostato`)
    const [ddx, ddy] = DIREZIONI[prima.mossa.dir];
    const spostato = { x: prima.mossa.x + ddx * prima.mossa.passi, y: prima.mossa.y + ddy * prima.mossa.passi };
    const seconda = mossePossibili(g1).find((c) => c.pezzo.x !== spostato.x || c.pezzo.y !== spostato.y) || mossePossibili(g1)[0];
    const { dir, passi } = seconda.mossa;
    const p = seconda.pezzo;
    // la casella libera più lontana che il pezzo copre dopo la mossa
    const meta = { destra: [p.x + p.w - 1 + passi, p.y], sinistra: [p.x - passi, p.y], giu: [p.x, p.y + p.h - 1 + passi], su: [p.x, p.y - passi] }[dir];
    const a = await centro(p.x, p.y);
    const b = await centro(meta[0], meta[1]);
    await t.clicScena(a.x, a.y);
    await t.aspetta(200);
    await t.foto("selezionato");
    await t.clicScena(b.x, b.y);
    await t.aspetta(500);
    const sg = await gioco();
    t.controlla(piatta(sg.righe) === seconda.g2 && sg.mosse === 2, `toccando il pezzo in (${p.x}, ${p.y}) e poi la casella (${meta[0]}, ${meta[1]}) il pezzo scivola lì`);
    g1 = seconda.g2;
  }

  // 4. Ricaricando, posizione e mosse restano; «Da capo» rimette i pezzi ma non azzera le mosse.
  await t.ricarica();
  await t.chiudiCarte();
  {
    const sg = await gioco();
    t.controlla(piatta(sg.righe) === g1 && sg.mosse === 2, `ricaricando la pagina restano la posizione e le 2 mosse fatte (${sg.mosse})`);
  }
  await t.bottone("da-capo");
  await t.aspetta(500);
  {
    const sg = await gioco();
    const s = await t.stato();
    t.controlla(piatta(sg.righe) === g0 && sg.mosse === 2 && s.errori === 0, "«Da capo» rimette i pezzi al loro posto, le mosse restano contate e non è un errore");
  }

  // 5. Il tetto: fino alla 99ª mossa niente, alla 100ª senza soluzione conta un errore e tutto torna com'era.
  //    Avanti e indietro con un pezzo (meglio se lungo, toccato nella seconda casella).
  {
    const lunghe = mossePossibili(g0).filter((c) => c.mossa.passi === 1 && c.pezzo.tipo !== "flight");
    const scelta = lunghe.find((c) => c.pezzo.w * c.pezzo.h === 2) || lunghe[0];
    const p = scelta.pezzo;
    const [dx, dy] = DIREZIONI[scelta.mossa.dir];
    const andata = { x: p.x + p.w - 1, y: p.y + p.h - 1, dir: scelta.mossa.dir, passi: 1 };
    const ritorno = { x: p.x + dx + p.w - 1, y: p.y + dy + p.h - 1, dir: OPPOSTA[scelta.mossa.dir], passi: 1 };
    let mosse = 2, ok = true, r = null;
    while (mosse < TETTO - 1) {
      r = await t.gioca(mosse % 2 === 0 ? andata : ritorno);
      mosse++;
      if (!r || !r.ok || r.mosse !== mosse) { ok = false; break; }
    }
    let s = await t.stato();
    let sg = await gioco();
    t.controlla(ok && sg.mosse === TETTO - 1 && s.errori === 0 && !s.risolto,
      `si arriva a ${TETTO - 1} mosse senza errori (avanti e indietro, toccando anche la seconda casella del pezzo) (${JSON.stringify(r)})`);
    r = await t.gioca(mosse % 2 === 0 ? andata : ritorno);
    await t.aspetta(150);
    await t.foto("tetto");
    s = await t.stato();
    sg = await gioco();
    t.controlla(r && r.errore === true && s.errori === 1 && !s.risolto && sg.mosse === 0 && piatta(sg.righe) === g0,
      `la ${TETTO}ª mossa senza soluzione conta un errore, non risolve e rimette tutto all'inizio (${JSON.stringify(r)})`);
    await t.aspetta(900);
  }

  // 6. La soluzione del risolutore, giocata con t.gioca: 34 mosse dalla disposizione iniziale.
  {
    const { soluzione } = risolviMemo(v.righe);
    let r = null, ok = true;
    for (let i = 0; i < soluzione.length; i++) {
      r = await t.gioca(soluzione[i]);
      const ultima = i === soluzione.length - 1;
      if (!r || (ultima ? !r.risolto : !r.ok)) { ok = false; t.log(`mossa ${i + 1} ${JSON.stringify(soluzione[i])}: ${JSON.stringify(r)}`); break; }
    }
    const s = await t.stato();
    const sg = await gioco();
    t.controlla(ok && r.risolto && s.risolto && sg.risolto && sg.mosse === MINIMO && s.errori === 1,
      `la soluzione del risolutore (${soluzione.length} mosse) fa uscire il flight case dalla porta`);
    const dopo = await t.gioca(soluzione[0]);
    t.controlla(dopo && dopo.rifiutata === "risolto", "dopo la soluzione le mosse vengono rifiutate");
    await t.aspetta(1600);
  }
}

// Per provare il risolutore da solo: node verifica.mjs
if (typeof process !== "undefined" && process.argv[1] && process.argv[1].replace(/\\/g, "/").endsWith("casse-consolle/verifica.mjs")) {
  const t0 = Date.now();
  DISPOSIZIONI.forEach((d, i) => {
    const { problemi } = leggiPezzi(piatta(d));
    const r = risolvi(d);
    console.log(`disposizione ${i + 1}: ${problemi.length ? problemi.join("; ") : "ok"}, minimo ${r ? r.minimo : "nessuna soluzione"} mosse, ${r ? r.stati : 0} stati visti`);
  });
  console.log(`(${((Date.now() - t0) / 1000).toFixed(1)} s)`);
}

export { DISPOSIZIONI, leggiPezzi, applica, mossePossibili, risolvi, piatta, inRighe };
