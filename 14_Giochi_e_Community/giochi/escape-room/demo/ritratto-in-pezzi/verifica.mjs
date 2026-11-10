// Verifica del «ritratto in pezzi»: tessere scorrevoli 3×3. Non usa il codice della demo: ha la sua ricerca in
// ampiezza (le 181.440 posizioni, dal ritratto intero) e il suo generatore della variante, scritto come nelle istruzioni.
//
// Posizione = stringa di 9 cifre: la cifra in posizione i è il pezzo nella casella i (caselle 0..8 riga per riga,
// dall'alto a sinistra); "0" è il buco. Il ritratto intero è "123456780".

const FINE = "123456780";
const VICINI = [[1, 3], [0, 2, 4], [1, 5], [0, 4, 6], [1, 3, 5, 7], [2, 4, 8], [3, 7], [4, 6, 8], [5, 7]];
const MARGINE = 6;
const N_PARTENZE = 8;

// Le coordinate della tavola nella scena (dalle istruzioni): servono se la demo non espone posizione(i).
const TAVOLA_X = 112;
const TAVOLA_Y = 19;
const LATO = 32;

let DIST = null;
let POZZO = null;

/** Mosse minime di ogni posizione, con una ricerca in ampiezza dal ritratto intero. */
function distanze() {
  if (DIST) return DIST;
  DIST = new Map([[FINE, 0]]);
  const coda = [FINE];
  for (let i = 0; i < coda.length; i++) {
    const s = coda[i];
    const d = DIST.get(s) + 1;
    for (const u of successori(s)) if (!DIST.has(u)) { DIST.set(u, d); coda.push(u); }
  }
  POZZO = [...DIST].filter(([, d]) => d >= 22 && d <= 26).map(([s]) => s).sort();
  return DIST;
}

/** Le posizioni raggiungibili con una mossa. */
function successori(s) {
  const z = s.indexOf("0");
  return VICINI[z].map((q) => scambia(s, z, q));
}
function scambia(s, a, b) {
  const v = s.split("");
  [v[a], v[b]] = [v[b], v[a]];
  return v.join("");
}

/** Toccare la casella c: se tocca il buco, il suo pezzo scivola nel buco. null = mossa impossibile. */
function muovi(s, c) {
  if (!Number.isInteger(c) || c < 0 || c > 8) return null;
  const z = s.indexOf("0");
  if (c === z || !VICINI[z].includes(c)) return null;
  return scambia(s, z, c);
}

/** Una soluzione ottima: la sequenza di caselle da toccare, scendendo lungo la distanza. */
function percorso(s) {
  const D = distanze();
  const mosse = [];
  while (s !== FINE) {
    const z = s.indexOf("0");
    const d = D.get(s);
    const c = VICINI[z].find((q) => D.get(scambia(s, z, q)) === d - 1);
    if (c === undefined) throw new Error(`nessuna mossa che avvicina da ${s}`);
    mosse.push(c);
    s = scambia(s, z, c);
  }
  return mosse;
}

/** Lo stesso generatore pseudo-casuale del kit (mulberry32). */
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

/** Il generatore delle istruzioni: la prima partenza dal pozzo 22..26, poi 7 partenze diverse con lo stesso minimo. */
function varianteAttesa(seme) {
  const D = distanze();
  const rng = casuale(seme);
  const prima = POZZO[Math.floor(rng() * POZZO.length)];
  const minimo = D.get(prima);
  const stessi = POZZO.filter((s) => D.get(s) === minimo);
  const partenze = [prima];
  while (partenze.length < N_PARTENZE) {
    const s = stessi[Math.floor(rng() * stessi.length)];
    if (!partenze.includes(s)) partenze.push(s);
  }
  return { minimo, limite: minimo + MARGINE, partenze };
}

const permutazione = (s) => typeof s === "string" && /^[0-8]{9}$/.test(s) && new Set(s).size === 9;

/** I vincoli della variante, controllati con la ricerca in ampiezza della verifica. */
function vincoli(v) {
  const D = distanze();
  const p = v && v.partenze;
  if (!v || !Number.isInteger(v.minimo)) return "manca minimo";
  if (v.minimo < 22 || v.minimo > 26) return `minimo ${v.minimo} fuori da 22..26`;
  if (v.limite !== v.minimo + MARGINE) return `limite ${v.limite} invece di ${v.minimo + MARGINE}`;
  if (!Array.isArray(p) || p.length !== N_PARTENZE) return `servono ${N_PARTENZE} partenze`;
  if (new Set(p).size !== p.length) return "partenze ripetute";
  for (const s of p) {
    if (!permutazione(s)) return `partenza non valida: ${s}`;
    if (!D.has(s)) return `partenza irrisolvibile: ${s}`;
    if (D.get(s) !== v.minimo) return `la partenza ${s} chiede ${D.get(s)} mosse, non ${v.minimo}`;
  }
  return "";
}

export default async function verifica(t) {
  const t0 = Date.now();
  distanze();
  t.log(`ricerca in ampiezza: ${DIST.size} posizioni, ${POZZO.length} nel pozzo 22..26 (${Date.now() - t0} ms)`);
  t.controlla(DIST.size === 181440 && POZZO.length === 98361, "il risolutore della verifica conta 181.440 posizioni e 98.361 partenze possibili");

  const stato = () => t.chiama("statoGioco");
  async function dove(c) {
    try {
      const p = await t.chiama("posizione", c);
      if (p && Number.isFinite(p.x) && Number.isFinite(p.y)) return { x: Math.round(p.x), y: Math.round(p.y) };
    } catch { /* posizione non esposta: si usano le coordinate delle istruzioni */ }
    return { x: TAVOLA_X + (c % 3) * LATO + LATO / 2, y: TAVOLA_Y + Math.floor(c / 3) * LATO + LATO / 2 };
  }

  // ── 1. Varianti: vincoli e generatore delle istruzioni, su sei semi ──
  const prime = new Set();
  for (const seme of [1, 2, 3, 42, 777, 2027]) {
    const v = await t.nuova(seme);
    const errore = vincoli(v);
    t.controlla(!errore, `seme ${seme}: ${errore || `minimo ${v.minimo}, limite ${v.limite}, 8 partenze tutte a ${v.minimo} mosse dal ritratto`}`);
    const attesa = varianteAttesa(seme);
    t.controlla(JSON.stringify(v) === JSON.stringify(attesa),
      `seme ${seme}: la variante è quella del generatore delle istruzioni` +
      (JSON.stringify(v) === JSON.stringify(attesa) ? "" : ` (attesa ${JSON.stringify(attesa)}, arrivata ${JSON.stringify(v)})`));
    if (v && v.partenze) prime.add(v.partenze[0]);
  }
  t.controlla(prime.size >= 5, `semi diversi danno partenze diverse (${prime.size} su 6)`);

  // ── 2. Partita vera, sul seme 12345 ──
  let v = await t.nuova(12345);
  t.controlla(!vincoli(v), "seme 12345: variante valida");
  let s = await stato();
  t.controlla(s.tessere === v.partenze[0] && s.mosse === 0 && s.giro === 0 && s.limite === v.limite && s.minimo === v.minimo &&
    s.restano === v.limite && s.buco === v.partenze[0].indexOf("0") && s.risolto === false,
  `all'inizio statoGioco dice partenza ${v.partenze[0]}, 0 mosse su ${v.limite}`);
  await t.foto("partenza");

  // ── 3. Mosse impossibili: rifiutate, nessun errore, niente cambia ──
  const partenza = v.partenze[0];
  const buco = partenza.indexOf("0");
  const lontana = [...Array(9).keys()].find((c) => c !== buco && !VICINI[buco].includes(c));
  const rBuco = await t.gioca({ casella: buco });
  const rLontana = await t.gioca({ casella: lontana });
  const rFuori = await t.gioca({ casella: 9 });
  const rStrana = await t.gioca({ casella: "tre" });
  let k = await t.stato();
  s = await stato();
  t.controlla(rBuco && rBuco.valida === false && rBuco.motivo === "buco", `toccare il buco è rifiutato (${JSON.stringify(rBuco)})`);
  t.controlla(rLontana && rLontana.valida === false && rLontana.motivo === "lontano", `un pezzo che non tocca il buco non si muove (${JSON.stringify(rLontana)})`);
  t.controlla(rFuori && rFuori.valida === false && rStrana && rStrana.valida === false, "caselle inesistenti rifiutate");
  t.controlla(k.errori === 0 && s.mosse === 0 && s.tessere === partenza, "le mosse impossibili non contano come errori né come mosse");
  // anche col clic vero su un pezzo lontano
  let p = await dove(lontana);
  await t.clicScena(p.x, p.y);
  await t.aspetta(150);
  k = await t.stato();
  s = await stato();
  t.controlla(k.errori === 0 && s.mosse === 0 && s.tessere === partenza, "un clic su un pezzo lontano dal buco non fa niente");

  // ── 4. Una mossa dall'interfaccia vera: la prima di una soluzione ottima, con un clic sulla scena ──
  const ottima = percorso(partenza);
  t.controlla(ottima.length === v.minimo, `il risolutore trova ${ottima.length} mosse per ${partenza} (minimo dichiarato ${v.minimo})`);
  const dopo1 = muovi(partenza, ottima[0]);
  p = await dove(ottima[0]);
  await t.clicScena(p.x, p.y);
  await t.aspetta(400);
  s = await stato();
  t.controlla(s.mosse === 1 && s.tessere === dopo1 && s.restano === v.limite - 1,
    `un clic sul pezzo accanto al buco lo fa scorrere (${partenza} → ${s.tessere}, mosse ${s.mosse})`);

  // ── 5. Ricaricando la pagina le mosse usate restano (niente partenza nuova gratis) ──
  await t.ricarica();
  await t.chiudiCarte();
  s = await stato();
  t.controlla(s.mosse === 1 && s.tessere === dopo1 && s.giro === 0, "ricaricando la pagina la posizione e le mosse usate restano");

  // ── 6. Il limite: avanti e indietro senza risolvere; la mossa numero «limite» è l'errore ──
  // Si fa scorrere avanti e indietro lo stesso pezzo: le posizioni toccate restano lontane dal ritratto intero.
  const a = dopo1.indexOf("0");
  const b = partenza.indexOf("0");
  let pos = dopo1;
  let tuttoOk = true;
  for (let m = 2; m <= v.limite - 1; m++) {
    const c = m % 2 === 0 ? b : a;
    const r = await t.gioca({ casella: c });
    pos = muovi(pos, c);
    if (!(r && r.ok === true && r.mosse === m && r.restano === v.limite - m && r.tessere === pos)) {
      tuttoOk = false;
      t.log(`mossa ${m}: atteso ok con ${pos}, arrivato ${JSON.stringify(r)}`);
      break;
    }
  }
  s = await stato();
  k = await t.stato();
  t.controlla(tuttoOk && s.mosse === v.limite - 1 && s.restano === 1 && k.errori === 0,
    `fino a ${v.limite - 1} mosse nessun errore (resta 1 mossa)`);
  await t.foto("ultima-mossa");
  const cUltima = v.limite % 2 === 0 ? b : a;
  const rTroppo = await t.gioca({ casella: cUltima });
  k = await t.stato();
  s = await stato();
  t.controlla(rTroppo && rTroppo.errore === true && rTroppo.motivo === "mosse finite" && rTroppo.giro === 1 && rTroppo.tessere === v.partenze[1],
    `la mossa numero ${v.limite} senza ritratto intero è un errore (${JSON.stringify(rTroppo)})`);
  t.controlla(k.errori === 1 && !k.risolto, "l'errore è contato e il rompicapo non è risolto");
  t.controlla(s.giro === 1 && s.mosse === 0 && s.restano === v.limite && s.tessere === v.partenze[1],
    `il ritratto si rimescola nella seconda partenza (${v.partenze[1]}, sempre ${v.minimo} mosse) con il contatore a 0`);
  await t.aspetta(250);
  await t.foto("errore");
  await t.aspetta(1500);

  // ── 7. «Sbircia»: mostra il ritratto per un attimo, non è una mossa ──
  await t.bottone("sbircia");
  await t.aspetta(150);
  s = await stato();
  t.controlla(s.sbirciata === true && s.mosse === 0 && s.tessere === v.partenze[1], "Sbircia mostra il ritratto senza contare mosse");
  await t.foto("sbircia");
  await t.aspetta(1800);
  s = await stato();
  t.controlla(s.sbirciata === false, "la sbirciata finisce da sola");

  // ── 8. La soluzione del risolutore, dalla nuova partenza: il primo pezzo col clic, il resto con gioca ──
  const soluzione = percorso(v.partenze[1]);
  t.controlla(soluzione.length === v.minimo && soluzione.length <= v.limite, `soluzione di ${soluzione.length} mosse entro il limite di ${v.limite}`);
  p = await dove(soluzione[0]);
  await t.clicScena(p.x, p.y);
  await t.aspetta(300);
  s = await stato();
  pos = muovi(v.partenze[1], soluzione[0]);
  t.controlla(s.mosse === 1 && s.tessere === pos, "dopo il rimescolamento i clic sulla scena funzionano di nuovo");
  let ultimo = null;
  for (let i = 1; i < soluzione.length; i++) {
    if (i === soluzione.length - 1) await t.foto("quasi");
    ultimo = await t.gioca({ casella: soluzione[i] });
    pos = muovi(pos, soluzione[i]);
    if (i < soluzione.length - 1 && !(ultimo && ultimo.ok === true && ultimo.tessere === pos)) {
      t.controlla(false, `mossa ${i + 1} della soluzione: atteso ok, arrivato ${JSON.stringify(ultimo)}`);
      break;
    }
  }
  k = await t.stato();
  s = await stato();
  t.controlla(ultimo && ultimo.risolto === true && ultimo.mosse === soluzione.length, `l'ultima mossa ricompone il ritratto (${JSON.stringify(ultimo)})`);
  t.controlla(k.risolto && k.errori === 1 && s.tessere === FINE && s.risolto === true, "il rompicapo è risolto, con l'errore di prima");
  await t.aspetta(400);
  await t.foto("ricomposto");
  await t.aspetta(1800);
}
