// Verifica della demo «Le clessidre del fungo». Non usa il codice della demo: ha le sue regole di riferimento
// (applica) e il suo risolutore (risolvi), ricavati dalle istruzioni, e li confronta con quello che fa la pagina.

// Le coppie di clessidre ammesse (piccola, grande): per tutte l'obiettivo è 15 = grande + (grande − piccola).
export const COPPIE = [[7, 11], [9, 12], [11, 13], [13, 14]];
export const OBIETTIVO = 15;

// ── Regole di riferimento (stato + mossa → nuovo stato ed esito), come nelle istruzioni ──
export const iniziale = () => ({ minuto: 0, sopra: [0, 0], acceso: false });

export function applica(v, st, m) {
  const cap = v.clessidre, T = v.obiettivo;
  const azione = m && m.azione;
  if (azione === "gira") {
    const i = m.clessidra;
    if (i !== 0 && i !== 1) return [st, { valida: false, motivo: "clessidra inesistente" }];
    const sopra = [...st.sopra];
    sopra[i] = cap[i] - sopra[i];
    const nuovo = { minuto: st.minuto, sopra, acceso: true };
    return [nuovo, { ok: true, minuto: nuovo.minuto, sopra: [...sopra], acceso: true }];
  }
  if (azione === "aspetta") {
    if (!st.acceso) return [st, { valida: false, motivo: "fungo spento" }];
    const vive = st.sopra.filter((x) => x > 0);
    if (!vive.length) return [st, { valida: false, motivo: "niente scorre" }];
    const dt = Math.min(...vive);
    const minuto = st.minuto + dt;
    if (minuto > T) return [iniziale(), { errore: true, motivo: "troppo tardi", minuto: T + 1 }];
    const svuotate = [0, 1].filter((i) => st.sopra[i] === dt);
    const sopra = st.sopra.map((x) => Math.max(0, x - dt));
    return [{ minuto, sopra, acceso: true }, { ok: true, minuto, sopra: [...sopra], svuotate }];
  }
  if (azione === "spegni") {
    if (!st.acceso) return [st, { valida: false, motivo: "fungo spento" }];
    if (st.minuto === T) return [{ ...st, acceso: false }, { risolto: true, minuto: T }];
    return [iniziale(), { errore: true, motivo: "troppo presto", minuto: st.minuto }];
  }
  if (azione === "ricomincia") return [iniziale(), { ok: true }];
  return [st, { valida: false, motivo: "mossa sconosciuta" }];
}

// ── Risolutore: ricerca in ampiezza sugli eventi (a ogni clessidra che si svuota: girare nessuna, una, l'altra
// o tutte e due), senza mai superare l'obiettivo. Restituisce le mosse nel formato della demo. ──
export function risolvi(v) {
  const cap = v.clessidre, T = v.obiettivo;
  const coda = [{ t: 0, s: [0, 0], via: [], attese: 0 }];
  const visti = new Set(["0|0,0"]);
  for (let n = 0; n < coda.length; n++) {
    const nodo = coda[n];
    for (const giri of [[], [0], [1], [0, 1]]) {
      if (nodo.t === 0 && !giri.length) continue;
      const s = [...nodo.s];
      for (const k of giri) s[k] = cap[k] - s[k];
      const vive = s.filter((x) => x > 0);
      if (!vive.length) continue;
      const dt = Math.min(...vive), t = nodo.t + dt;
      if (t > T) continue;
      const dopo = s.map((x) => Math.max(0, x - dt));
      const via = [...nodo.via, ...giri.map((k) => ({ azione: "gira", clessidra: k })), { azione: "aspetta" }];
      if (t === T) return { mosse: [...via, { azione: "spegni" }], attese: nodo.attese + 1 };
      const chiave = `${t}|${dopo}`;
      if (!visti.has(chiave)) { visti.add(chiave); coda.push({ t, s: dopo, via, attese: nodo.attese + 1 }); }
    }
  }
  return null;
}

/** Tutte le strade diverse che arrivano all'obiettivo (per controllare che la soluzione sia una sola). */
export function strade(v) {
  const cap = v.clessidre, T = v.obiettivo, out = new Set();
  (function giu(t, s, via) {
    for (const giri of [[], [0], [1], [0, 1]]) {
      if (t === 0 && !giri.length) continue;
      const n = [...s];
      for (const k of giri) n[k] = cap[k] - n[k];
      const vive = n.filter((x) => x > 0);
      if (!vive.length) continue;
      const dt = Math.min(...vive), nt = t + dt;
      if (nt > T) continue;
      const passo = `${t}:${giri.join("+") || "-"}`;
      if (nt === T) out.add([...via, passo].join(" "));
      giu(nt, n.map((x) => Math.max(0, x - dt)), [...via, passo]);
    }
  })(0, [0, 0], []);
  return [...out];
}

/** 15 si ottiene con clessidre intere una dopo l'altra (x·A + y·B)? Allora la variante sarebbe troppo facile. */
const sommaDiIntere = (A, B, T) => { for (let x = 0; x * A <= T; x++) if ((T - x * A) % B === 0) return true; return false; };

/** Controlli sulla sola variante (senza la pagina). Ritorna l'elenco dei problemi. */
export function problemiVariante(v) {
  const p = [];
  if (!v || !Array.isArray(v.clessidre) || v.clessidre.length !== 2) return ["manca clessidre: [a, b]"];
  const [a, b] = v.clessidre;
  if (!Number.isInteger(a) || !Number.isInteger(b) || a === b) p.push("clessidre non intere o uguali");
  if (v.obiettivo !== OBIETTIVO) p.push(`obiettivo ${v.obiettivo} invece di ${OBIETTIVO}`);
  const piccola = Math.min(a, b), grande = Math.max(a, b);
  if (!COPPIE.some(([x, y]) => x === piccola && y === grande)) p.push(`coppia ${piccola}/${grande} non ammessa`);
  if (sommaDiIntere(piccola, grande, v.obiettivo)) p.push("si risolve con clessidre intere: troppo facile");
  const r = risolvi(v);
  if (!r) p.push("nessuna soluzione");
  else if (r.attese !== 3) p.push(`la soluzione chiede ${r.attese} attese invece di 3`);
  if (strade(v).length !== 2) p.push(`strade diverse: ${strade(v).length} invece di 2`);
  return p;
}

const uguali = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const vista = (s) => s && { minuto: s.minuto, sopra: s.sopra, acceso: s.acceso };

export default async function verifica(t) {
  // ── 1. Varianti di 8 semi: rispettano i vincoli, hanno una soluzione sola, e non sono tutte uguali ──
  const coppieViste = new Set();
  for (const seme of [11, 22, 33, 44, 55, 66, 77, 88]) {
    const v = await t.nuova(seme);
    const pr = problemiVariante(v);
    const s0 = await t.chiama("statoGioco");
    t.controlla(pr.length === 0, `seme ${seme}: clessidre ${v?.clessidre?.join(" e ")} per ${v?.obiettivo}${pr.length ? " — " + pr.join("; ") : ", una sola strada in 3 attese"}`);
    t.controlla(uguali(vista(s0), vista(iniziale())) && uguali(s0.capacita, v.clessidre) && s0.obiettivo === v.obiettivo && s0.risolto === false,
      `seme ${seme}: si parte dal minuto 0, clessidre a riposo, fungo spento`);
    coppieViste.add(Math.min(...v.clessidre) + "/" + Math.max(...v.clessidre));
  }
  t.controlla(coppieViste.size >= 2, `semi diversi danno coppie diverse (${[...coppieViste].join(", ")})`);

  // ── Partita vera su un seme: il simulatore di riferimento segue la pagina mossa per mossa ──
  const v = await t.nuova(2027);
  t.controlla(problemiVariante(v).length === 0, `seme 2027: variante valida (${v.clessidre.join(" e ")} per ${v.obiettivo})`);
  let atteso = iniziale();
  const piccola = v.clessidre[0] < v.clessidre[1] ? 0 : 1;
  const grande = 1 - piccola;
  async function prova(mossa, descrizione) {
    const [dopo, esitoAtteso] = applica(v, atteso, mossa);
    const esito = await t.gioca(mossa);
    atteso = dopo;
    const s = await t.chiama("statoGioco");
    const okEsito = !!esito && Object.keys(esitoAtteso).every((k) => uguali(esito[k], esitoAtteso[k]));
    t.controlla(okEsito && uguali(vista(s), vista(atteso)),
      `${descrizione}: esito ${JSON.stringify(esito)}, minuto ${s?.minuto}, sopra ${JSON.stringify(s?.sopra)}`);
    return esito;
  }

  // ── 3. Mosse impossibili: rifiutate, nessun errore ──
  await prova({ azione: "aspetta" }, "Aspetta prima del via viene rifiutato");
  await prova({ azione: "spegni" }, "Spegni col fungo spento viene rifiutato");
  await prova({ azione: "gira", clessidra: 2 }, "girare una clessidra che non c'è viene rifiutato");
  let st = await t.stato();
  t.controlla(st.errori === 0 && !st.risolto, "le mosse impossibili non contano come errori");

  // ── 5a. Un giro dall'interfaccia vera: tocco sulla clessidra di sinistra, poi il bottone Ricomincia ──
  const p0 = await t.chiama("posizione", 0);
  await t.clicScena(p0.x, p0.y);
  await t.aspetta(150);
  let s = await t.chiama("statoGioco");
  t.controlla(s.acceso && s.minuto === 0 && s.sopra[0] === v.clessidre[0] && s.sopra[1] === 0,
    `il tocco sulla clessidra di sinistra la gira e accende il fungo (sopra ${JSON.stringify(s.sopra)})`);
  await t.foto("primo-giro");
  await t.bottone("ricomincia");
  await t.aspetta(150);
  s = await t.chiama("statoGioco");
  st = await t.stato();
  t.controlla(uguali(vista(s), vista(iniziale())) && st.errori === 0, "il bottone Ricomincia rimette tutto a riposo senza contare errori");
  atteso = iniziale();

  // ── 2. Errore tipico: spegnere quando si svuota la piccola (troppo presto) ──
  await prova({ azione: "gira", clessidra: 0 }, "al via si gira la sinistra");
  await prova({ azione: "gira", clessidra: 1 }, "al via si gira la destra");
  await prova({ azione: "aspetta" }, `Aspetta: si svuota la piccola al minuto ${v.clessidre[piccola]}`);
  let e = await prova({ azione: "spegni" }, `Spegni al minuto ${v.clessidre[piccola]} è un errore`);
  st = await t.stato();
  t.controlla(e.errore && st.errori === 1 && !st.risolto, "spegnere troppo presto conta come errore e non risolve");
  await t.aspetta(400);
  await t.foto("troppo-presto");

  // ── 6. Limite: superare il minuto 15 fa scoppiare la bombola (errore, si riparte da capo) ──
  await prova({ azione: "gira", clessidra: 0 }, "si riparte: gira la sinistra");
  await prova({ azione: "gira", clessidra: 1 }, "gira la destra");
  await prova({ azione: "aspetta" }, "Aspetta fino alla piccola");
  await prova({ azione: "aspetta" }, `Aspetta fino alla grande (minuto ${v.clessidre[grande]}), senza girare niente`);
  await prova({ azione: "aspetta" }, "Aspetta con le due clessidre vuote viene rifiutato");
  await prova({ azione: "gira", clessidra: grande }, "si rigira la grande");
  e = await prova({ azione: "aspetta" }, "Aspetta porta oltre il minuto 15");
  st = await t.stato();
  t.controlla(e.errore && e.minuto === 16 && st.errori === 2 && st.dorateInPalio === st.dorate - 1 && !st.risolto,
    `oltre il minuto 15 la bombola scoppia: errore, ${st.errori} errori, dorate in palio ${st.dorateInPalio}`);
  await t.aspetta(1200);
  await t.foto("troppo-tardi");

  // ── 4 + 5b. La soluzione del risolutore: il primo giro col tocco, la prima attesa col bottone ──
  const sol = risolvi(v);
  t.controlla(!!sol, `soluzione del risolutore: ${sol && sol.mosse.map((m) => m.azione === "gira" ? "gira " + v.clessidre[m.clessidra] : m.azione).join(", ")}`);
  let primoTocco = true, primoBottone = true;
  for (const mossa of sol.mosse) {
    if (mossa.azione === "gira" && primoTocco) {
      primoTocco = false;
      const p = await t.chiama("posizione", mossa.clessidra);
      [atteso] = applica(v, atteso, mossa);
      await t.clicScena(p.x, p.y);
      await t.aspetta(150);
      s = await t.chiama("statoGioco");
      t.controlla(uguali(vista(s), vista(atteso)), `tocco sulla clessidra da ${v.clessidre[mossa.clessidra]}: sopra ${JSON.stringify(s.sopra)}`);
    } else if (mossa.azione === "aspetta" && primoBottone) {
      primoBottone = false;
      [atteso] = applica(v, atteso, mossa);
      await t.bottone("aspetta");
      await t.aspetta(150);
      s = await t.chiama("statoGioco");
      t.controlla(uguali(vista(s), vista(atteso)), `bottone Aspetta: minuto ${s.minuto}, sopra ${JSON.stringify(s.sopra)}`);
      await t.foto("dopo-aspetta");
    } else if (mossa.azione === "spegni") {
      await t.aspetta(500);
      await t.foto("minuto-15");
      e = await prova(mossa, "Spegni al minuto 15");
    } else await prova(mossa, mossa.azione === "gira" ? `gira la clessidra da ${v.clessidre[mossa.clessidra]}` : "Aspetta");
  }
  st = await t.stato();
  s = await t.chiama("statoGioco");
  t.controlla(e && e.risolto && st.risolto && s.risolto && st.errori === 2, "la soluzione risolve il rompicapo (con i 2 errori di prima)");
  const dopo = await t.gioca({ azione: "gira", clessidra: 0 });
  t.controlla(dopo && dopo.rifiutata === "risolto", "dopo la soluzione le clessidre non si girano più");
  await t.aspetta(1500);
}
