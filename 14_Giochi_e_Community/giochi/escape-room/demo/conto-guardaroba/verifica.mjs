// Verifica della demo «Il conto del guardaroba» (criptaritmo con i gettoni del guardaroba).
// Non usa il codice della demo: ricava la soluzione dalla variante con un risolutore a colonne suo
// (adattato da ../verifiche/criptaritmi.mjs) e controlla le regole scritte in ISTRUZIONI.md.

// I 45 conti delle varianti, nello stesso ordine di ISTRUZIONI.md (variante.indice è la posizione qui).
const POOL = [
  ["TESCHIO", "TRUCCO", "SCHERZO"], ["NEBBIA", "OMBRA", "BRIVIDO"], ["MUMMIA", "TRUCCO", "VAMPIRO"],
  ["STREGHE", "TORTA", "SPIRITO"], ["SPIRITO", "TERRORE", "ARTIGLI"], ["NOTTE", "OMBRA", "CRANIO"],
  ["STREGA", "STREGHE", "TESCHIO"], ["NOTTE", "STREGHE", "SCHERZO"], ["MOSTRO", "NOTTE", "TESCHIO"],
  ["MOSTRO", "ZOMBIE", "SPIRITO"], ["MOSTRO", "STRIGE", "ARTIGLI"], ["MOSTRO", "SPIRITO", "STREGHE"],
  ["CRIPTA", "NOTTI", "SPETTRO"], ["DOLCE", "TRUCCO", "CANDELA"], ["SCHERZO", "TRUCCO", "TESCHIO"],
  ["MORTO", "TERRORE", "CANDELA"], ["SPETTRO", "TERRORE", "ARTIGLI"], ["CORVO", "TERRORE", "CANDELA"],
  ["NEBBIA", "STREGA", "STREGHE"], ["CATENE", "CIOCCO", "ARTIGLI"], ["CATENE", "CRANIO", "SPIRITO"],
  ["LAPIDE", "SPIRITO", "TERRORE"], ["DIAVOLO", "MUMMIA", "VAMPIRO"], ["DIAVOLO", "NEBBIA", "BRIVIDO"],
  ["STREGHE", "TRUCCO", "TESCHIO"], ["DENTI", "TERRORE", "CANDELA"], ["ARTIGLI", "STREGA", "SPETTRO"],
  ["ARTIGLI", "MUMMIA", "TERRORE"], ["ARTIGLI", "TERRORE", "SPETTRO"], ["ARTIGLI", "MOSTRI", "TERRORE"],
  ["NOTTI", "SPETTRO", "STREGHE"], ["MOSTRI", "SPETTRO", "STREGHE"], ["MOSTRI", "SPIRITO", "STREGHE"],
  ["GHOUL", "STREGHE", "SPETTRO"], ["FESTE", "SCHERZO", "STREGHE"], ["FESTE", "SPIRITO", "TESCHIO"],
  ["CIOCCO", "MOSTRO", "BRIVIDO"], ["CIOCCO", "CRIPTA", "TESCHIO"], ["CIOCCO", "LAPIDE", "TERRORE"],
  ["CIOCCO", "STREGHE", "SPETTRO"], ["CIOCCO", "ZOMBIE", "SCHERZO"], ["CIOCCO", "ZOMBIE", "BRIVIDO"],
  ["CAPPA", "TESCHIO", "TERRORE"], ["CAPPA", "CRIPTA", "STREGHE"], ["CRANIO", "MUMMIA", "TERRORE"],
];

/** Tutte le soluzioni (fino a `limite`) di a + b = c: colonna per colonna da destra, con il riporto. */
export function risolvi(a, b, c, limite = 2) {
  const L = c.length;
  if (a.length > L || b.length > L || L > Math.max(a.length, b.length) + 1) return [];
  if (new Set(a + b + c).size > 10) return [];
  const prime = new Set([a[0], b[0], c[0]]);
  const A = [...a].reverse(), B = [...b].reverse(), Cc = [...c].reverse();
  const val = {}, usate = new Array(10).fill(false), sol = [];
  const assegna = (ch, d) => { val[ch] = d; usate[d] = true; };
  const libera = (ch) => { usate[val[ch]] = false; delete val[ch]; };
  function colonna(i, riporto) {
    if (sol.length >= limite) return;
    if (i === L) { if (riporto === 0) sol.push({ ...val }); return; }
    const ca = A[i], cb = B[i], cc = Cc[i];
    const opzioni = (ch) => (ch === undefined ? [null] : ch in val ? [val[ch]]
      : [...Array(10).keys()].filter((d) => !usate[d] && !(d === 0 && prime.has(ch))));
    for (const da of opzioni(ca)) {
      const nuovaA = ca !== undefined && !(ca in val);
      if (nuovaA) assegna(ca, da);
      for (const db of opzioni(cb)) {
        const nuovaB = cb !== undefined && !(cb in val);
        if (nuovaB) assegna(cb, db);
        const s = (da ?? 0) + (db ?? 0) + riporto, cifra = s % 10, r2 = Math.floor(s / 10);
        if (cc in val) {
          if (val[cc] === cifra) colonna(i + 1, r2);
        } else if (!usate[cifra] && !(cifra === 0 && prime.has(cc))) {
          assegna(cc, cifra); colonna(i + 1, r2); libera(cc);
        }
        if (nuovaB) libera(cb);
      }
      if (nuovaA) libera(ca);
    }
  }
  colonna(0, 0);
  return sol;
}

/** Le lettere in ordine di prima comparsa leggendo a, b, c. */
export const lettereDi = (a, b, c) => [...new Set(a + b + c)];
/** Le prime lettere di a, b, c senza doppioni (non possono valere zero). */
export const inizialiDi = (a, b, c) => [...new Set([a[0], b[0], c[0]])];
const numero = (parola, ass) => [...parola].map((ch) => ass[ch]).join("");
const uguali = (x, y) => JSON.stringify(x) === JSON.stringify(y);

/** Controlla che la variante sia uno dei conti dell'elenco, con i campi giusti e una sola soluzione. */
function controllaVariante(t, v, etichetta) {
  const voce = POOL[v && v.indice];
  t.controlla(voce && voce[0] === v.a && voce[1] === v.b && voce[2] === v.c,
    `${etichetta}: il conto ${v && v.a} + ${v && v.b} = ${v && v.c} è la voce ${v && v.indice} dell'elenco`);
  if (!voce) return null;
  t.controlla(uguali(v.lettere, lettereDi(v.a, v.b, v.c)) && v.lettere.length === 10,
    `${etichetta}: dieci lettere in ordine di prima comparsa (${(v.lettere || []).join("")})`);
  t.controlla(uguali(v.iniziali, inizialiDi(v.a, v.b, v.c)), `${etichetta}: iniziali giuste (${(v.iniziali || []).join(", ")})`);
  t.controlla(Math.max(v.a.length, v.b.length, v.c.length) <= 7, `${etichetta}: il conto sta in sette colonne`);
  const sol = risolvi(v.a, v.b, v.c, 3);
  t.controlla(sol.length === 1, `${etichetta}: una sola soluzione (${sol.length ? `${numero(v.a, sol[0])} + ${numero(v.b, sol[0])} = ${numero(v.c, sol[0])}` : "nessuna"})`);
  return sol.length === 1 ? sol[0] : null;
}

/** Appende a ogni lettera la cifra di `ass` passando da gioca (i gettoni si spostano da soli). */
async function appendiTutto(t, v, ass) {
  for (const L of v.lettere) {
    const r = await t.gioca({ tipo: "appendi", lettera: L, cifra: ass[L] });
    if (!r || !r.ok) return { L, r };
  }
  return null;
}

/** Una soluzione sbagliata ma completa: scambia le cifre di due lettere che non sono iniziali. */
function scambia(v, sol, quale) {
  const libere = v.lettere.filter((L) => !v.iniziali.includes(L));
  const x = libere[quale % libere.length], y = libere[(quale + 1) % libere.length];
  return { ...sol, [x]: sol[y], [y]: sol[x] };
}

export default async function verifica(t) {
  // ── 1. Le varianti: otto semi, tutti conti dell'elenco con una sola soluzione; non sempre lo stesso conto ──
  const conti = new Set();
  for (const seme of [1, 2, 3, 4, 5, 6, 7, 8]) {
    const v = await t.nuova(seme);
    controllaVariante(t, v, `seme ${seme}`);
    conti.add(`${v.a}+${v.b}=${v.c}`);
  }
  t.controlla(conti.size >= 4, `semi diversi danno conti diversi (${conti.size} conti diversi su 8 semi)`);

  // ── Pagina di prova ──
  let v = await t.nuova(4242);
  const sol = controllaVariante(t, v, "seme 4242");
  if (!sol) return;
  t.log(`conto ${v.a} + ${v.b} = ${v.c} → ${numero(v.a, sol)} + ${numero(v.b, sol)} = ${numero(v.c, sol)}`);
  let s = await t.chiama("statoGioco");
  t.controlla(s && uguali(Object.keys(s.assegnate || {}), v.lettere) && Object.values(s.assegnate).every((d) => d === null)
    && s.mancano === 10 && s.pagato === false && s.selezione === null && s.ultimoSbagliato === null,
    "all'inizio nessuna lettera ha il suo gettone");
  await t.foto("inizio");

  // ── 2. Mosse impossibili: rifiutate, nessun errore ──
  const iniziale = v.iniziali[0];
  const fuori = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("").find((L) => !v.lettere.includes(L));
  const L0 = v.lettere.find((L) => !v.iniziali.includes(L));
  const impossibili = [
    [{ tipo: "appendi", lettera: iniziale, cifra: 0 }, "zero", `lo zero sulla ${iniziale}, in testa a un numero`],
    [{ tipo: "appendi", lettera: fuori, cifra: 1 }, "lettera", `un gettone sulla ${fuori}, che nel conto non c'è`],
    [{ tipo: "appendi", lettera: L0, cifra: 12 }, "cifra", "un gettone 12, che non esiste"],
    [{ tipo: "togli", lettera: L0 }, "vuota", `togliere il gettone dalla ${L0}, che non ne ha`],
    [{ tipo: "svuota" }, "vuota", "svuotare quando non c'è nessun gettone"],
    [{ tipo: "paga" }, "incompleto", "pagare con tutte le lettere vuote"],
    [{ tipo: "balla" }, "mossa", "una mossa che non esiste"],
  ];
  for (const [mossa, motivo, cosa] of impossibili) {
    const r = await t.gioca(mossa);
    t.controlla(r && r.valida === false && r.motivo === motivo, `rifiutato: ${cosa} (motivo «${r && r.motivo}»)`);
  }
  s = await t.stato();
  t.controlla(s.errori === 0 && !s.risolto, "le mosse rifiutate non contano come errori");

  // ── 3. Le mosse vere, dall'interfaccia: clic sulla lettera poi sul gettone, e trascinamento ──
  const [L1, L2, L3] = v.lettere.filter((L) => !v.iniziali.includes(L));
  const d1 = sol[L1], d2 = sol[L2];
  let p = await t.chiama("posizioneLettera", L1);
  await t.clicScena(p.x, p.y);
  await t.aspetta(150);
  s = await t.chiama("statoGioco");
  t.controlla(s.selezione && s.selezione.lettera === L1, `un clic sulla ${L1} del conto la seleziona`);
  await t.foto("lettera-scelta");
  p = await t.chiama("posizioneGettone", d1);
  await t.clicScena(p.x, p.y);
  await t.aspetta(150);
  s = await t.chiama("statoGioco");
  t.controlla(s.assegnate[L1] === d1 && s.selezione === null, `poi un clic sul gettone ${d1} lo appende alla ${L1}`);

  const da = await t.chiama("posizioneGettone", d2);
  const a = await t.chiama("posizioneLettera", L2);
  await t.trascinaScena(da.x, da.y, a.x, a.y, 10);
  await t.aspetta(150);
  s = await t.chiama("statoGioco");
  t.controlla(s.assegnate[L2] === d2, `trascinare il gettone ${d2} sulla ${L2} lo appende`);

  // Un gettone solo per cifra: appeso a un'altra lettera, lascia quella di prima.
  let r = await t.gioca({ tipo: "appendi", lettera: L3, cifra: d2 });
  s = await t.chiama("statoGioco");
  t.controlla(r && r.ok && r.tolta === L2 && s.assegnate[L2] === null && s.assegnate[L3] === d2 && s.mancano === 8,
    `il gettone ${d2} appeso alla ${L3} lascia la ${L2} (esito ${JSON.stringify(r)})`);
  r = await t.gioca({ tipo: "appendi", lettera: L3, cifra: d1 });
  s = await t.chiama("statoGioco");
  t.controlla(r && r.ok && r.tolta === L1 && r.liberata === d2 && s.assegnate[L3] === d1 && s.assegnate[L1] === null,
    `il gettone ${d1} sulla ${L3}: il ${d2} torna al gancio e la ${L1} resta vuota (esito ${JSON.stringify(r)})`);
  r = await t.gioca({ tipo: "togli", lettera: L3 });
  s = await t.chiama("statoGioco");
  t.controlla(r && r.ok && s.assegnate[L3] === null && s.mancano === 10, `togli: la ${L3} resta senza gettone`);

  // ── 4. Il lavoro resta ricaricando la pagina ──
  await t.gioca({ tipo: "appendi", lettera: L1, cifra: d1 });
  await t.gioca({ tipo: "appendi", lettera: L2, cifra: d2 });
  await t.ricarica();
  await t.chiudiCarte();
  s = await t.chiama("statoGioco");
  t.controlla(s.assegnate[L1] === d1 && s.assegnate[L2] === d2 && s.mancano === 8, "ricaricando la pagina i gettoni appesi restano");

  // Pagare a metà: rifiutato, non è un errore.
  r = await t.gioca({ tipo: "paga" });
  t.controlla(r && r.valida === false && r.motivo === "incompleto", "pagare con due lettere sole è rifiutato");
  await t.bottone("svuota");
  await t.aspetta(150);
  s = await t.chiama("statoGioco");
  t.controlla(s.mancano === 10, "il bottone Svuota riporta tutti i gettoni ai ganci");

  // ── 5. L'errore tipico: un conto completo che non torna (due cifre scambiate) ──
  const sbagliata = scambia(v, sol, 0);
  let fermo = await appendiTutto(t, v, sbagliata);
  t.controlla(!fermo, `si appende un conto completo sbagliato${fermo ? ` (fermo sulla ${fermo.L}: ${JSON.stringify(fermo.r)})` : ""}`);
  r = await t.gioca({ tipo: "paga" });
  s = await t.stato();
  t.controlla(r && r.errore === true && s.errori === 1 && !s.risolto, "pagare un conto che non torna è un errore e non risolve");
  await t.aspetta(300);
  await t.foto("errore");
  const st = await t.chiama("statoGioco");
  t.controlla(st.ultimoSbagliato === v.lettere.map((L) => sbagliata[L]).join("") && st.mancano === 0,
    "dopo l'errore i gettoni restano appesi e il conto sbagliato è ricordato");
  r = await t.gioca({ tipo: "paga" });
  s = await t.stato();
  t.controlla(r && r.valida === false && r.motivo === "uguale" && s.errori === 1, "ripagare lo stesso conto sbagliato è rifiutato, non è un altro errore");

  // Il secondo errore: le dorate in palio scendono da 4 a 3.
  const sbagliata2 = scambia(v, sol, 2);
  fermo = await appendiTutto(t, v, sbagliata2);
  r = await t.gioca({ tipo: "paga" });
  s = await t.stato();
  t.controlla(!fermo && r && r.errore === true && s.errori === 2 && s.dorateInPalio === 3, "al secondo errore le dorate in palio sono 3");

  // ── 6. La soluzione del risolutore, pagata con il bottone vero ──
  fermo = await appendiTutto(t, v, sol);
  t.controlla(!fermo, "si appende la soluzione del risolutore");
  s = await t.chiama("statoGioco");
  t.controlla(s.mancano === 0 && v.lettere.every((L) => s.assegnate[L] === sol[L]), "il conto mostra la soluzione");
  await t.bottone("paga");
  await t.aspetta(1500);
  s = await t.stato();
  t.controlla(s.risolto && s.errori === 2 && s.guadagnate === 3, `il bottone Paga con il conto giusto risolve (dorate guadagnate ${s.guadagnate})`);
  const fine = await t.chiama("statoGioco");
  t.controlla(fine.pagato === true, "dopo la soluzione statoGioco dice pagato");
}
