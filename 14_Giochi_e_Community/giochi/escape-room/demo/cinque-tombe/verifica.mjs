// Verifica della demo «Le cinque tombe». Non usa il codice della demo: controlla la variante con un risolutore suo
// (a forza bruta, carattere per carattere, come quello del catalogo in ../verifiche/verifiche-e.mjs), ricostruisce le
// frasi degli indizi e gioca la soluzione con le mosse descritte in ISTRUZIONI.md.

const VALORI = [
  ["nera", "bianca", "rossa", "verde", "viola"],
  ["vampiro", "mummia", "lupo mannaro", "strega", "zombie"],
  ["sangue", "tè", "latte", "pozione", "succo di zucca"],
  ["liquirizia", "marzapane", "caramella mou", "cioccolato", "zucchero filato"],
  ["gatto nero", "corvo", "pipistrello", "ragno", "rospo"],
];
const TIPI = ["stessa", "diversa", "posto", "sinistra", "accanto"];

// ── Risolutore a forza bruta: per ogni carattere una delle 120 permutazioni; un indizio si controlla appena i suoi
// caratteri sono tutti assegnati. pos[a][v] = tomba del valore v del carattere a. ──
const PERM = [];
(function p(a, resto) {
  if (!resto.length) { PERM.push(a); return; }
  resto.forEach((x, i) => p([...a, x], resto.filter((_, j) => j !== i)));
})([], [0, 1, 2, 3, 4]);

function vale(ind, pos) {
  const p = (x) => pos[x[0]][x[1]];
  switch (ind.tipo) {
    case "stessa": return p(ind.x) === p(ind.y);
    case "diversa": return p(ind.x) !== p(ind.y);
    case "posto": return p(ind.x) === ind.n;
    case "sinistra": return p(ind.x) + 1 === p(ind.y);
    case "accanto": return Math.abs(p(ind.x) - p(ind.y)) === 1;
  }
  return false;
}
const caratteri = (ind) => [ind.x[0], ...(ind.y ? [ind.y[0]] : [])];
/** Le soluzioni degli indizi, al massimo `limite` (ognuna come pos[a][v]). */
function soluzioni(indizi, limite = 2) {
  const pronti = [0, 1, 2, 3, 4].map((i) => indizi.filter((ind) => caratteri(ind).every((a) => a <= i) && caratteri(ind).includes(i)));
  const pos = [];
  const trovate = [];
  (function metti(i) {
    if (trovate.length >= limite) return;
    if (i === 5) { trovate.push(pos.map((r) => [...r])); return; }
    for (const pr of PERM) {
      pos[i] = pr;
      if (pronti[i].every((ind) => vale(ind, pos))) metti(i + 1);
      if (trovate.length >= limite) return;
    }
  })(0);
  return trovate;
}
/** Da pos[a][v] (tomba del valore) a registro[a][p] (valore nella tomba). */
const comeRegistro = (pos) => pos.map((r) => { const s = [0, 0, 0, 0, 0]; r.forEach((p, v) => { s[p] = v; }); return s; });

// ── Difficoltà, come nelle istruzioni: propagazione sui domini (maschere di tombe) e prove di un passo ──
const unico = (m) => m !== 0 && (m & (m - 1)) === 0;
function propaga(D, indizi) {
  let cambiato = true;
  while (cambiato) {
    cambiato = false;
    const metti = (i, m) => { if (m !== D[i]) { D[i] = m; cambiato = true; } return m !== 0; };
    for (const c of indizi) {
      const i = c.x[0] * 5 + c.x[1];
      const j = c.y ? c.y[0] * 5 + c.y[1] : -1;
      if (c.tipo === "posto") { if (!metti(i, D[i] & (1 << c.n))) return false; }
      else if (c.tipo === "stessa") { const m = D[i] & D[j]; if (!metti(i, m) || !metti(j, m)) return false; }
      else if (c.tipo === "diversa") {
        if (unico(D[i]) && !metti(j, D[j] & ~D[i])) return false;
        if (unico(D[j]) && !metti(i, D[i] & ~D[j])) return false;
      } else if (c.tipo === "sinistra") {
        if (!metti(i, D[i] & (D[j] >> 1))) return false;
        if (!metti(j, D[j] & ((D[i] << 1) & 31))) return false;
      } else {
        if (!metti(i, D[i] & ((D[j] >> 1) | ((D[j] << 1) & 31)))) return false;
        if (!metti(j, D[j] & ((D[i] >> 1) | ((D[i] << 1) & 31)))) return false;
      }
    }
    for (let a = 0; a < 5; a++) {
      for (let v = 0; v < 5; v++) {
        const m = D[a * 5 + v];
        if (m === 0) return false;
        if (unico(m)) for (let w = 0; w < 5; w++) if (w !== v && (D[a * 5 + w] & m) && !metti(a * 5 + w, D[a * 5 + w] & ~m)) return false;
      }
      for (let p = 0; p < 5; p++) {
        let chi = -1, n = 0;
        for (let v = 0; v < 5; v++) if (D[a * 5 + v] & (1 << p)) { n++; chi = v; }
        if (n === 0) return false;
        if (n === 1 && !unico(D[a * 5 + chi])) metti(a * 5 + chi, 1 << p);
      }
    }
  }
  return true;
}
function difficolta(indizi) {
  const D = new Array(25).fill(31);
  if (!propaga(D, indizi)) return { livello: 0, prove: 0 };
  let prove = 0;
  while (!D.every(unico)) {
    let progresso = false;
    for (let i = 0; i < 25 && !progresso; i++) {
      if (unico(D[i])) continue;
      for (let p = 0; p < 5; p++) {
        if (!(D[i] & (1 << p))) continue;
        const E = D.slice();
        E[i] = 1 << p;
        if (!propaga(E, indizi)) { D[i] &= ~(1 << p); prove++; progresso = true; break; }
      }
    }
    if (!progresso) return { livello: 3, prove };
    if (!propaga(D, indizi)) return { livello: 0, prove };
  }
  return { livello: prove === 0 ? 1 : 2, prove };
}

// ── Le frasi, ricostruite dalle regole delle istruzioni ──
const ORD = ["prima", "seconda", "terza", "quarta", "quinta"];
function nomeCon(a, v) { return (a === 2 && v === 3) || (a === 3 && v === 2) ? `la ${VALORI[a][v]}` : VALORI[a][v]; }
function chi([a, v]) {
  return [`chi riposa sotto la lapide ${VALORI[0][v]}`, `${["il", "la", "il", "la", "lo"][v]} ${VALORI[1][v]}`,
    `chi beve ${nomeCon(2, v)}`, `chi mangia ${nomeCon(3, v)}`, `chi ha il ${VALORI[4][v]}`][a];
}
function cheCosa([a, v]) {
  return [`riposa sotto la lapide ${VALORI[0][v]}`, null, `beve ${nomeCon(2, v)}`, `mangia ${nomeCon(3, v)}`, `ha il ${VALORI[4][v]}`][a];
}
function laTomba([a, v], inizio) {
  return [`${inizio} con la lapide ${VALORI[0][v]}`, `${inizio} ${["del", "della", "del", "della", "dello"][v]} ${VALORI[1][v]}`,
    `${inizio} di chi beve ${nomeCon(2, v)}`, `${inizio} di chi mangia ${nomeCon(3, v)}`, `${inizio} con il ${VALORI[4][v]}`][a];
}
const Maiusc = (s) => s.charAt(0).toUpperCase() + s.slice(1);
function fraseAttesa(ind) {
  switch (ind.tipo) {
    case "stessa": return Maiusc(`${chi(ind.x)} ${cheCosa(ind.y)}.`);
    case "diversa": return Maiusc(`${chi(ind.x)} non ${cheCosa(ind.y)}.`);
    case "posto": return `${Maiusc(laTomba(ind.x, "la tomba"))} è la ${ORD[ind.n]} da sinistra.`;
    case "sinistra": return `${Maiusc(laTomba(ind.x, "la tomba"))} è subito a sinistra di ${laTomba(ind.y, "quella")}.`;
    case "accanto": return `${Maiusc(laTomba(ind.x, "la tomba"))} è accanto a ${laTomba(ind.y, "quella")}.`;
  }
  return null;
}

const coppia = (x) => Array.isArray(x) && x.length === 2 && x.every((k) => Number.isInteger(k) && k >= 0 && k < 5);
const permutazione = (r) => Array.isArray(r) && r.length === 5 && [...r].sort().join() === "0,1,2,3,4";
const uguali = (a, b) => JSON.stringify(a) === JSON.stringify(b);

/** Controlla una variante; ritorna la soluzione come registro[a][p] (o null se la variante non va). */
function controllaVariante(t, v, etichetta) {
  const ind = v && v.indizi;
  if (!t.controlla(Array.isArray(ind) && ind.length >= 14 && ind.length <= 17, `${etichetta}: da 14 a 17 indizi (${ind && ind.length})`)) return null;
  const formati = ind.every((c) => TIPI.includes(c.tipo) && coppia(c.x) &&
    (c.tipo === "posto" ? Number.isInteger(c.n) && c.n >= 0 && c.n < 5 && c.y === undefined : coppia(c.y) && c.y[0] !== c.x[0]));
  if (!t.controlla(formati, `${etichetta}: ogni indizio ha tipo, x, y (o n) nel formato delle istruzioni`)) return null;
  t.controlla(ind.every((c) => !(c.tipo === "stessa" || c.tipo === "diversa") || c.y[0] !== 1),
    `${etichetta}: negli indizi «stessa» e «diversa» il mostro è sempre il soggetto (x)`);
  const sbagliate = ind.filter((c) => c.testo !== fraseAttesa(c));
  t.controlla(sbagliate.length === 0, `${etichetta}: le frasi degli indizi sono quelle delle istruzioni` +
    (sbagliate.length ? ` (es. «${sbagliate[0].testo}» invece di «${fraseAttesa(sbagliate[0])}»)` : ""));
  const trovate = soluzioni(ind, 2);
  if (!t.controlla(trovate.length === 1, `${etichetta}: gli indizi hanno una sola soluzione (trovate ${trovate.length})`)) return null;
  const sol = comeRegistro(trovate[0]);
  t.controlla(Array.isArray(v.soluzione) && v.soluzione.length === 5 && v.soluzione.every(permutazione) && uguali(v.soluzione, sol),
    `${etichetta}: variante.soluzione è la soluzione del risolutore`);
  const superflui = ind.filter((_, i) => soluzioni(ind.filter((__, j) => j !== i), 2).length === 1).length;
  t.controlla(superflui === 0, `${etichetta}: ogni indizio serve (superflui: ${superflui})`);
  const d = difficolta(ind);
  t.controlla(d.livello === 1 || (d.livello === 2 && d.prove <= 5), `${etichetta}: si risolve ragionando (livello ${d.livello}, prove ${d.prove})`);
  return sol;
}

/** Riempie il registro con `registro[a][p]` usando la mossa «metti». */
async function riempi(t, registro) {
  for (let a = 0; a < 5; a++) for (let p = 0; p < 5; p++) await t.gioca({ metti: [a, p, registro[a][p]] });
}

export default async function verifica(t) {
  // 1. Varianti di sei semi: vincoli, frasi, una sola soluzione, indizi tutti necessari, difficoltà.
  const viste = new Set();
  for (const seme of [1, 2, 3, 4, 5, 6]) {
    const v = await t.nuova(seme);
    controllaVariante(t, v, `seme ${seme}`);
    viste.add(JSON.stringify(v && v.indizi));
  }
  t.controlla(viste.size === 6, "semi diversi danno griglie diverse");

  // Da qui si gioca su un seme solo.
  let v = await t.nuova(20271031);
  const sol = controllaVariante(t, v, "seme 20271031");
  if (!sol) return;
  const vuoto = (s) => s.registro.every((r) => r.every((x) => x === null));
  let s = await t.chiama("statoGioco");
  t.controlla(s && Array.isArray(s.registro) && vuoto(s) && s.mancano === 25 && s.aperta === null,
    "all'inizio il registro è vuoto (25 caselle da riempire) e nessuna finestra è aperta");

  // 2. L'interfaccia vera: un clic sul ritratto della tomba 1 apre la finestra, un clic su un mostro lo mette.
  let pos = await t.chiama("casella", 1, 0);
  await t.clicScena(pos.x, pos.y);
  await t.aspetta(150);
  s = await t.chiama("statoGioco");
  t.controlla(s.aperta && s.aperta.a === 1 && s.aperta.p === 0, "un clic sul ritratto della tomba 1 apre la finestra dei mostri");
  await t.foto("finestra");
  const mostro = sol[1][0];
  pos = await t.chiama("scelta", mostro);
  await t.clicScena(pos.x, pos.y);
  await t.aspetta(150);
  s = await t.chiama("statoGioco");
  t.controlla(s.registro[1][0] === mostro && s.aperta === null, `un clic sul mostro lo mette nella tomba 1 e chiude la finestra (${VALORI[1][mostro]})`);
  // NO dall'interfaccia: nicchia del dolce della tomba 2, esclude un dolce sbagliato
  const dolceNo = (sol[3][1] + 1) % 5;
  pos = await t.chiama("casella", 3, 1);
  await t.clicScena(pos.x, pos.y);
  await t.aspetta(150);
  pos = await t.chiama("no", dolceNo);
  await t.clicScena(pos.x, pos.y);
  await t.aspetta(150);
  s = await t.chiama("statoGioco");
  t.controlla(s.esclusi[3][1].includes(dolceNo) && s.registro[3][1] === null && s.aperta && s.aperta.a === 3,
    "un clic su NO esclude il dolce nella tomba 2 e la finestra resta aperta");
  // un clic fuori chiude la finestra senza cambiare niente; un clic su una targa la seleziona
  pos = await t.chiama("targa", 0);
  await t.clicScena(pos.x, pos.y);
  await t.aspetta(150);
  s = await t.chiama("statoGioco");
  t.controlla(s.aperta === null && s.selezionato === 0, "un clic sulla prima targa chiude la finestra e seleziona l'indizio 1");
  await t.clicScena(pos.x, pos.y);
  await t.aspetta(150);
  s = await t.chiama("statoGioco");
  t.controlla(s.usati.includes(0), "un secondo clic sulla targa la segna come usata");
  await t.foto("targa");

  // 3. Mosse: spostare un valore, togliere, escludere; le mosse impossibili sono rifiutate senza errore.
  const altro = (mostro + 1) % 5;
  await t.gioca({ metti: [1, 2, altro] });
  let r = await t.gioca({ metti: [1, 3, altro] });
  s = await t.chiama("statoGioco");
  t.controlla(r && r.ok && r.da === 2 && s.registro[1][2] === null && s.registro[1][3] === altro,
    "mettere un mostro già usato lo sposta dalla sua tomba (esito { ok, da })");
  r = await t.gioca({ togli: [1, 3] });
  s = await t.chiama("statoGioco");
  t.controlla(r && r.ok && s.registro[1][3] === null, "«togli» svuota la casella");
  r = await t.gioca({ escludi: [3, 1, dolceNo] });
  s = await t.chiama("statoGioco");
  t.controlla(r && r.ok && r.escluso === false && !s.esclusi[3][1].includes(dolceNo), "«escludi» due volte toglie il NO");
  for (const [m, cosa] of [[{ metti: [5, 0, 0] }, "carattere inesistente"], [{ metti: [0, 5, 0] }, "tomba inesistente"],
    [{ metti: [0, 0, 7] }, "valore inesistente"], [{ salta: true }, "mossa sconosciuta"]]) {
    r = await t.gioca(m);
    t.controlla(r && r.valida === false, `mossa impossibile rifiutata: ${cosa}`);
  }
  r = await t.gioca({ controlla: true });
  s = await t.stato();
  t.controlla(r && r.valida === false && r.mancano === 24 && s.errori === 0 && !s.risolto,
    "«Controlla» con il registro incompleto è rifiutato e non conta come errore (mancano 24)");

  // Memoria: ricaricando a metà partita registro, NO e targhe usate restano.
  await t.gioca({ metti: [2, 4, sol[2][4]] });
  await t.gioca({ escludi: [4, 0, (sol[4][0] + 2) % 5] });
  const prima = await t.chiama("statoGioco");
  await t.ricarica();
  await t.chiudiCarte();
  s = await t.chiama("statoGioco");
  t.controlla(uguali(s.registro, prima.registro) && uguali(s.esclusi, prima.esclusi) && uguali(s.usati, prima.usati),
    "ricaricando la pagina a metà partita registro, NO e targhe usate restano");

  // 4. L'errore tipico: registro pieno ma con due mostri scambiati.
  const sbagliato = sol.map((riga) => [...riga]);
  [sbagliato[1][0], sbagliato[1][1]] = [sbagliato[1][1], sbagliato[1][0]];
  await riempi(t, sbagliato);
  s = await t.chiama("statoGioco");
  t.controlla(s.mancano === 0 && uguali(s.registro, sbagliato), "il registro si riempie con «metti»");
  r = await t.gioca({ controlla: true });
  s = await t.stato();
  t.controlla(r && r.errore === true && s.errori === 1 && !s.risolto, "registro pieno ma sbagliato: è un errore e non risolve");
  const dopo = await t.chiama("statoGioco");
  t.controlla(uguali(dopo.registro, sbagliato), "dopo l'errore il registro resta com'era (il gioco non dice dove sta lo sbaglio)");
  await t.foto("errore");

  // 5. I limiti: ogni 3 errori una dorata in meno (5 → 4), il rompicapo resta aperto.
  await t.gioca({ controlla: true });
  r = await t.gioca({ controlla: true });
  s = await t.stato();
  t.controlla(r.errore && s.errori === 3 && s.dorateInPalio === 4 && !s.risolto, `dopo 3 errori le dorate in palio sono 4 (${s.dorateInPalio})`);

  // 6. «Svuota» cancella registro e NO; il bottone chiede conferma.
  await t.gioca({ escludi: [4, 4, 0] });
  r = await t.gioca({ svuota: true });
  s = await t.chiama("statoGioco");
  t.controlla(r && r.ok && vuoto(s) && s.esclusi.every((riga) => riga.every((e) => e.length === 0)), "«svuota» cancella registro e NO");
  await t.gioca({ metti: [0, 0, sol[0][0]] });
  await t.bottone("svuota");
  await t.aspetta(100);
  s = await t.chiama("statoGioco");
  t.controlla(s.registro[0][0] === sol[0][0], "il primo tocco su «Svuota» non cancella niente (chiede conferma)");
  await t.bottone("svuota");
  await t.aspetta(100);
  s = await t.chiama("statoGioco");
  t.controlla(vuoto(s), "il secondo tocco su «Svuota» cancella il registro");

  // 7. La soluzione del risolutore, con «Controlla» premuto dall'interfaccia.
  await riempi(t, sol);
  s = await t.chiama("statoGioco");
  t.controlla(s.mancano === 0 && uguali(s.registro, sol), "il registro contiene la soluzione del risolutore");
  await t.bottone("controlla");
  await t.aspetta(300);
  s = await t.stato();
  t.controlla(s.risolto && s.errori === 3 && s.guadagnate === 4, `la soluzione risolve il rompicapo (dorate guadagnate ${s.guadagnate})`);
  await t.aspetta(2200);
}

// Per provare il risolutore da Node senza la demo: node verifica.mjs
if (typeof process !== "undefined" && process.argv[1] && import.meta.url.endsWith(process.argv[1].replace(/\\/g, "/").split("/").pop())) {
  // L'esempio della scheda (16 indizi): deve avere una sola soluzione, quella scritta nella scheda.
  const I = (tipo, x, y, n) => (tipo === "posto" ? { tipo, x, n } : { tipo, x, y });
  const esempio = [
    I("stessa", [4, 2], [2, 2]), I("stessa", [1, 2], [3, 2]), I("stessa", [3, 3], [2, 0]), I("sinistra", [1, 4], [2, 3]),
    I("posto", [0, 2], null, 4), I("stessa", [0, 3], [3, 4]), I("stessa", [4, 4], [0, 3]), I("sinistra", [1, 4], [0, 3]),
    I("stessa", [4, 0], [0, 4]), I("posto", [3, 4], null, 1), I("stessa", [4, 1], [2, 0]), I("accanto", [0, 3], [4, 2]),
    I("stessa", [1, 1], [2, 1]), I("sinistra", [3, 2], [1, 0]), I("stessa", [2, 0], [0, 0]), I("stessa", [3, 1], [4, 2]),
  ];
  const t0 = Date.now();
  const s = soluzioni(esempio, 3);
  console.log(`esempio della scheda: ${s.length} soluzione/i in ${Date.now() - t0} ms`);
  const reg = comeRegistro(s[0]);
  for (let p = 0; p < 5; p++) console.log(`  tomba ${p + 1}: ` + reg.map((r, a) => VALORI[a][r[p]]).join(", "));
  console.log("  indizi superflui:", esempio.filter((_, i) => soluzioni(esempio.filter((__, j) => j !== i), 2).length === 1).length);
  console.log("  difficoltà:", JSON.stringify(difficolta(esempio)));
  esempio.slice(0, 4).forEach((c) => console.log("  frase:", fraseAttesa(c)));
}
