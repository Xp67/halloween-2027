// Verifica dei «teli che mentono». Non usa il codice della demo: controlla le frasi e ricava la soluzione
// con un risolutore suo (prova tutte le 32 combinazioni di sinceri e bugiardi).
//
// Indici dei teli: 0 a righe, 1 a quadri, 2 a pois, 3 rattoppato, 4 bucato. Nel risolutore T[i] = true vuol dire
// «il fantasma i è sincero».

const NOMI = ["quello a righe", "quello a quadri", "quello a pois", "il rattoppato", "il bucato"];
const NUMERI = ["", "un", "due", "tre", "quattro"];
const QUANTI = { bugiardo: 1, sincero: 1, stesso: 2, se: 2, almenoUno: 2, unSolo: 3, esattamente: 0, almeno: 0 };
const MONDI = Array.from({ length: 32 }, (_, m) => [0, 1, 2, 3, 4].map((i) => ((m >> i) & 1) === 1));

/** Vera o falsa la frase `f` nel mondo `T`. */
function vera(f, T) {
  const [x, y, z] = f.chi;
  const bugiardi = T.filter((t) => !t).length;
  switch (f.tipo) {
    case "bugiardo": return !T[x];
    case "sincero": return T[x];
    case "stesso": return T[x] === T[y];
    case "esattamente": return bugiardi === f.k;
    case "almeno": return bugiardi >= f.k;
    case "se": return !T[x] || !T[y];
    case "almenoUno": return T[x] || T[y];
    case "unSolo": return [x, y, z].filter((i) => T[i]).length === 1;
    default: throw new Error(`tipo sconosciuto: ${f.tipo}`);
  }
}
/** I mondi coerenti: chi è sincero dice il vero, chi è bugiardo il falso (solo le frasi di `quali`). */
function soluzioni(frasi, quali = [0, 1, 2, 3, 4]) {
  return MONDI.filter((T) => quali.every((i) => T[i] === vera(frasi[i], T)));
}
const maiuscola = (s) => s[0].toUpperCase() + s.slice(1);
/** Il testo che ogni frase deve avere, parola per parola (ISTRUZIONI.md, «Le frasi»). */
function testoAtteso(f) {
  const [x, y, z] = f.chi.map((i) => NOMI[i]);
  switch (f.tipo) {
    case "bugiardo": return maiuscola(`${x} è bugiardo.`);
    case "sincero": return maiuscola(`${x} è sincero.`);
    case "stesso": return maiuscola(`${x} e ${y} sono dello stesso tipo.`);
    case "esattamente": return f.k === 1 ? "Fra noi cinque c'è esattamente un bugiardo." : `Fra noi cinque ci sono esattamente ${NUMERI[f.k]} bugiardi.`;
    case "almeno": return `Fra noi cinque ci sono almeno ${NUMERI[f.k]} bugiardi.`;
    case "se": return `Se ${x} è sincero, allora ${y} è bugiardo.`;
    case "almenoUno": return `Almeno uno fra ${x} e ${y} è sincero.`;
    case "unSolo": return `Fra ${x}, ${y} e ${z} c'è un solo sincero.`;
  }
  return null;
}
/** La spiegazione del «?» (null = la frase è semplice e il «?» non c'è). */
function spiegazione(f) {
  switch (f.tipo) {
    case "stesso": return "«Dello stesso tipo»: sinceri tutti e due, oppure bugiardi tutti e due.";
    case "esattamente": return "«Noi cinque» conta anche chi parla; «esattamente»: né di più né di meno.";
    case "almeno": return `«Noi cinque» conta anche chi parla; «almeno ${NUMERI[f.k]}»: ${NUMERI[f.k]} o di più.`;
    case "se": return "«Se A, allora B» è falsa in un caso solo: A vera e B falsa.";
    case "almenoUno": return "«Almeno uno» è vera anche quando sono sinceri tutti e due.";
    case "unSolo": return "«Un solo sincero»: fra i tre ne è sincero uno, né di più né di meno.";
    default: return null;
  }
}
/** A capo a parole intere, al massimo 34 caratteri per riga (come il fumetto nella scena). */
function aCapo(t, max = 34) {
  const righe = [];
  let r = "";
  for (const p of t.split(" ")) {
    if (!r) r = p;
    else if ((r + " " + p).length <= max) r += " " + p;
    else { righe.push(r); r = p; }
  }
  if (r) righe.push(r);
  return righe;
}

/** Tutti i vincoli delle istruzioni su un gruppo di cinque frasi. Ritorna l'elenco dei problemi (vuoto = va bene). */
function problemiFrasi(frasi) {
  if (!Array.isArray(frasi) || frasi.length !== 5) return ["servono 5 frasi"];
  const p = [];
  frasi.forEach((f, chi) => {
    if (!f || !(f.tipo in QUANTI)) { p.push(`frase ${chi}: tipo non valido (${f && f.tipo})`); return; }
    if (!Array.isArray(f.chi) || f.chi.length !== QUANTI[f.tipo]) { p.push(`frase ${chi}: chi deve avere ${QUANTI[f.tipo]} indici`); return; }
    if (f.chi.some((x, j) => !Number.isInteger(x) || x < 0 || x > 4 || x === chi || (j > 0 && x <= f.chi[j - 1])))
      p.push(`frase ${chi}: chi ${JSON.stringify(f.chi)} non è crescente, fuori da 0…4 o nomina chi parla`);
    if (f.tipo === "esattamente" && !(Number.isInteger(f.k) && f.k >= 1 && f.k <= 4)) p.push(`frase ${chi}: k fuori da 1…4`);
    if (f.tipo === "almeno" && !(Number.isInteger(f.k) && f.k >= 2 && f.k <= 4)) p.push(`frase ${chi}: k fuori da 2…4`);
    if (f.testo !== testoAtteso(f)) p.push(`frase ${chi}: testo «${f.testo}» invece di «${testoAtteso(f)}»`);
    else if (aCapo(f.testo).length > 3) p.push(`frase ${chi}: più di 3 righe nel fumetto`);
  });
  if (p.length) return p;
  const tutte = soluzioni(frasi);
  if (tutte.length !== 1) return [`${tutte.length} soluzioni invece di una`];
  for (let i = 0; i < 5; i++)
    if (soluzioni(frasi, [0, 1, 2, 3, 4].filter((j) => j !== i)).length < 2) p.push(`la frase ${i} non serve`);
  for (let a = 0; a < 5; a++)
    for (let b = a + 1; b < 5; b++) {
      const s = soluzioni(frasi, [a, b]);
      for (let i = 0; i < 5; i++) if (s.every((T) => T[i] === s[0][i])) p.push(`le frasi ${a} e ${b} da sole svelano il tipo di ${i}`);
    }
  const bugiardi = tutte[0].filter((t) => !t).length;
  if (bugiardi < 1 || bugiardi > 4) p.push("tutti dello stesso tipo");
  if (new Set(frasi.map((f) => f.testo)).size !== 5) p.push("due frasi uguali");
  const conta = {};
  for (const f of frasi) conta[f.tipo] = (conta[f.tipo] || 0) + 1;
  if (Math.max(...Object.values(conta)) > 2) p.push("più di due frasi dello stesso tipo");
  return p;
}
/** La soluzione come cartellini: "sincero" | "bugiardo" per ogni telo. */
function soluzione(frasi) {
  const s = soluzioni(frasi);
  return s.length === 1 ? s[0].map((t) => (t ? "sincero" : "bugiardo")) : null;
}
const opposto = (c) => (c === "sincero" ? "bugiardo" : "sincero");
const uguali = (a, b) => JSON.stringify(a) === JSON.stringify(b);

export default async function verifica(t) {
  const leggi = (sel) => t.pagina.evaluate((s) => { const e = document.querySelector(s); return e ? e.textContent : ""; }, sel);
  const statoGioco = () => t.chiama("statoGioco");

  // ── 1. Varianti: sei semi, tutte con i vincoli e tutte diverse ──
  const viste = new Set();
  for (const seme of [101, 202, 303, 404, 505, 2027]) {
    const v = await t.nuova(seme);
    const p = problemiFrasi(v && v.frasi);
    t.controlla(p.length === 0, `seme ${seme}: cinque frasi valide, soluzione unica, ogni frase serve${p.length ? " — " + p.join("; ") : ""}`);
    if (p.length === 0) {
      t.log(`seme ${seme}: ${soluzione(v.frasi).map((c, i) => `${NOMI[i]} ${c}`).join(", ")}`);
      viste.add(JSON.stringify(v.frasi.map((f) => f.testo)));
    }
  }
  t.controlla(viste.size === 6, `semi diversi danno frasi diverse (${viste.size} gruppi diversi su 6)`);

  // ── 2. Stato iniziale ──
  const v = await t.nuova(4242);
  const sol = soluzione(v.frasi);
  t.controlla(sol !== null, "seme 4242: la variante ha una sola soluzione");
  let sg = await statoGioco();
  t.controlla(sg && sg.giro === 0 && uguali(sg.cartellini, [null, null, null, null, null]) && uguali(sg.frasi, v.frasi)
    && sg.parla === 0 && sg.sbagliNelGiro === 0 && sg.svelati === false,
    "all'inizio: giro 0, cartellini vuoti, parla quello a righe, frasi uguali alla variante");
  await t.foto("inizio");

  // ── 3. Mosse impossibili: rifiutate, nessun errore ──
  let r = await t.gioca({ tipo: "controlla" });
  let s = await t.stato();
  t.controlla(r && r.valida === false && !r.errore && s.errori === 0, "Controlla con i cartellini mancanti viene rifiutato e non è un errore");
  t.controlla((await leggi(".kit-fumetto")) === "Prima appendi un cartellino a ogni telo.", "il fumetto chiede di appendere tutti i cartellini");
  r = await t.gioca({ tipo: "gira", telo: 7 });
  const r2 = await t.gioca({ tipo: "cartellino", telo: 1, valore: "forse" });
  const r3 = await t.gioca({ tipo: "spiega_tutto" });
  s = await t.stato();
  t.controlla(r.valida === false && r2.valida === false && r3.valida === false && s.errori === 0, "mosse senza senso rifiutate senza errori");

  // ── 4. Interfaccia vera: clic sul cartellino e sui fantasmi ──
  const pc = await t.chiama("posizioneCartellino", 2);
  const giro = [];
  for (let k = 0; k < 3; k++) {
    await t.clicScena(pc.x, pc.y);
    giro.push((await statoGioco()).cartellini[2]);
  }
  sg = await statoGioco();
  t.controlla(uguali(giro, ["sincero", "bugiardo", null]) && sg.parla === 2,
    `tre clic sul cartellino a pois: sincero, bugiardo, vuoto (${JSON.stringify(giro)}), e parla quello a pois`);
  const pt = await t.chiama("posizioneTelo", 4);
  await t.clicScena(pt.x, pt.y);
  sg = await statoGioco();
  t.controlla(sg.parla === 4, "clic sul fantasma bucato: parla lui");
  t.controlla((await leggi(".kit-fumetto")).length > 0, "il fumetto non è vuoto");

  // Il «?»: c'è solo sulle frasi complicate e spiega il loro significato preciso.
  const complicato = v.frasi.findIndex((f) => spiegazione(f) !== null);
  const semplice = v.frasi.findIndex((f) => spiegazione(f) === null);
  if (complicato >= 0) {
    await t.gioca({ tipo: "parla", telo: complicato });
    const pa = await t.chiama("posizioneAiuto");
    t.controlla(pa && Number.isFinite(pa.x) && Number.isFinite(pa.y), `la frase di ${NOMI[complicato]} (${v.frasi[complicato].tipo}) ha il «?»`);
    if (pa) {
      await t.clicScena(pa.x, pa.y);
      const f = await leggi(".kit-fumetto");
      t.controlla(f === spiegazione(v.frasi[complicato]), `il «?» spiega la frase: «${f}»`);
      await t.foto("aiuto");
    }
  }
  if (semplice >= 0) {
    await t.gioca({ tipo: "parla", telo: semplice });
    t.controlla((await t.chiama("posizioneAiuto")) === null, `la frase semplice di ${NOMI[semplice]} non ha il «?»`);
    const rs = await t.gioca({ tipo: "spiega" });
    t.controlla(rs && rs.valida === false, "«spiega» su una frase semplice viene rifiutata");
  }

  // La carta del testo elenca le cinque frasi.
  await t.bottone("testo");
  await t.aspetta(150);
  const carta = await leggi(".kit-carta");
  t.controlla(v.frasi.every((f) => carta.includes(f.testo)) && carta.includes("Telo rattoppato:"), "la carta «Testo» elenca le cinque frasi, telo per telo");
  await t.chiudiCarte();

  // ── 5. Errore tipico: tutto giusto tranne un cartellino ──
  for (let i = 0; i < 5; i++) await t.gioca({ tipo: "cartellino", telo: i, valore: sol[i] });
  const sbagliati = [...sol];
  sbagliati[3] = opposto(sol[3]);
  await t.gioca({ tipo: "cartellino", telo: 3, valore: sbagliati[3] });
  sg = await statoGioco();
  t.controlla(uguali(sg.cartellini, sbagliati), "i cartellini si appendono con la mossa «cartellino»");
  r = await t.gioca({ tipo: "controlla" });
  s = await t.stato();
  sg = await statoGioco();
  t.controlla(r.errore === true && r.rigenerato === false && s.errori === 1 && !s.risolto, "un solo cartellino sbagliato è un errore e non risolve");
  t.controlla(uguali(sg.cartellini, sbagliati) && sg.sbagliNelGiro === 1 && sg.giro === 0, "dopo lo sbaglio i cartellini restano dove sono e il cartello segna 1/3");
  t.controlla((await leggi(".kit-fumetto")) === "Risatine sotto i teli: qualcosa non va. Al terzo sbaglio cambiano frasi.", "fumetto del primo sbaglio");
  await t.aspetta(200);
  await t.foto("errore");

  // ── 6. Il limite: al terzo sbaglio i fantasmi cambiano tutte le frasi ──
  r = await t.gioca({ tipo: "controlla" });
  sg = await statoGioco();
  t.controlla(r.errore === true && r.rigenerato === false && sg.sbagliNelGiro === 2 && sg.giro === 0, "secondo sbaglio: stesse frasi, cartello 2/3");
  r = await t.gioca({ tipo: "controlla" });
  s = await t.stato();
  sg = await statoGioco();
  t.controlla(r.errore === true && r.rigenerato === true && r.giro === 1 && s.errori === 3 && !s.risolto, "terzo sbaglio: errore e frasi rigenerate (giro 1)");
  t.controlla(sg.giro === 1 && sg.sbagliNelGiro === 0 && uguali(sg.cartellini, [null, null, null, null, null]) && sg.parla === 0,
    "dopo il rimescolamento: cartellini vuoti, cartello 0/3, parla quello a righe");
  t.controlla(!uguali(sg.frasi.map((f) => f.testo), v.frasi.map((f) => f.testo)), "le frasi nuove sono diverse dalle vecchie");
  const p2 = problemiFrasi(sg.frasi);
  t.controlla(p2.length === 0, `le frasi nuove rispettano tutti i vincoli${p2.length ? " — " + p2.join("; ") : ""}`);
  t.controlla((await leggi(".kit-fumetto")) === "I fantasmi si sono stufati: frasi nuove, cartellini da rifare.", "fumetto del rimescolamento");
  await t.aspetta(1000);
  await t.foto("frasi-nuove");

  // Ricaricando, il giro resta lo stesso (dipende dagli errori, che il kit salva).
  await t.ricarica();
  await t.chiudiCarte();
  const dopo = await statoGioco();
  t.controlla(dopo.giro === 1 && uguali(dopo.frasi, sg.frasi), "ricaricando la pagina restano le frasi del giro 1");
  await t.bottone("testo");
  await t.aspetta(150);
  const carta2 = await leggi(".kit-carta");
  t.controlla(dopo.frasi.every((f) => carta2.includes(f.testo)), "la carta «Testo» mostra le frasi nuove");
  await t.chiudiCarte();

  // ── 7. La soluzione del risolutore, l'ultimo passo dal bottone vero ──
  const sol2 = soluzione(dopo.frasi);
  t.log(`giro 1: ${sol2.map((c, i) => `${NOMI[i]} ${c}`).join(", ")}`);
  for (let i = 0; i < 5; i++) await t.gioca({ tipo: "cartellino", telo: i, valore: sol2[i] });
  await t.bottone("controlla");
  await t.aspetta(300);
  s = await t.stato();
  sg = await statoGioco();
  t.controlla(s.risolto && s.errori === 3, "la soluzione del risolutore, controllata col bottone, risolve il rompicapo (con i 3 errori di prima)");
  t.controlla(sg.svelati === true && sg.parla === null && uguali(sg.cartellini, sol2), "a rompicapo risolto i teli sono giù e i cartellini restano giusti");
  t.controlla((await leggi(".kit-fumetto")) === "Tutti giusti: i fantasmi si tolgono il telo!", "fumetto della vittoria");
  await t.aspetta(2400);
}
