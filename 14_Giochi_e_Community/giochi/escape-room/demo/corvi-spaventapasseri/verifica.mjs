// Verifica dei corvi dello spaventapasseri (Nim misère: chi fa volare via l'ultimo corvo perde).
// Non usa il codice della demo: ricava la mossa giusta e la risposta attesa dello spaventapasseri dalla variante,
// con un risolutore suo a forza bruta (controllato contro la formula del Nim misère).
//
// Formati (vedi ISTRUZIONI.md, «Aggancio per le prove»):
//   variante      { partite: [[a, b, c, d], … 10 partite] }
//   gioca         { palo: 0..3, quanti: 1..9 }  oppure  { arrenditi: true }
//   statoGioco()  { pali, partita, mosse: [{ chi, palo, quanti }], selezione: null | { palo, quanti }, vinta, animazione }
//   posizione(palo, indice) → { x, y } centro del posto `indice` (0 = il primo in basso a sinistra) sul palo `palo`

export default async function verifica(t) {
  // ── Risolutore ──
  const memo = new Map();
  /** Chi deve muovere vince? (forza bruta; senza corvi ha vinto chi muove, perché l'altro ha preso l'ultimo) */
  function vinceChiMuove(pali) {
    const s = pali.filter((n) => n > 0).sort((a, b) => a - b);
    if (s.length === 0) return true;
    const k = s.join(",");
    if (memo.has(k)) return memo.get(k);
    let v = false;
    for (let i = 0; i < s.length && !v; i++)
      for (let q = 1; q <= s[i] && !v; q++) {
        const n = [...s];
        n[i] -= q;
        if (!vinceChiMuove(n)) v = true;
      }
    memo.set(k, v);
    return v;
  }
  const formula = (m) => { const x = m.reduce((a, b) => a ^ b, 0); return m.some((n) => n > 1) ? x !== 0 : x === 0; };
  /** Tutte le mosse dopo le quali chi deve muovere perde, in ordine: palo da sinistra, poi quanti dal più piccolo. */
  function mosseVincenti(pali) {
    const r = [];
    for (let palo = 0; palo < 4; palo++)
      for (let quanti = 1; quanti <= pali[palo]; quanti++) {
        const dopo = [...pali];
        dopo[palo] -= quanti;
        if (!vinceChiMuove(dopo)) r.push({ palo, quanti });
      }
    return r;
  }
  const mossaVincente = (pali) => mosseVincenti(pali)[0] ?? null;
  /** La risposta dello spaventapasseri: la prima mossa vincente; se non c'è, un corvo dal palo più alto (il primo da sinistra). */
  function rispostaAttesa(pali) {
    const m = mossaVincente(pali);
    if (m) return m;
    let alto = -1;
    for (let p = 0; p < 4; p++) if (pali[p] > 0 && (alto < 0 || pali[p] > pali[alto])) alto = p;
    return { palo: alto, quanti: 1 };
  }
  const togli = (pali, m) => { const d = [...pali]; d[m.palo] -= m.quanti; return d; };
  const uguali = (a, b) => JSON.stringify(a) === JSON.stringify(b);
  const stessaMossa = (a, b) => !!a && !!b && a.palo === b.palo && a.quanti === b.quanti;
  const somma = (p) => p.reduce((a, b) => a + b, 0);
  const statoGioco = () => t.chiama("statoGioco");
  const avviso = () => t.pagina.evaluate(() => document.querySelector(".kit-avviso")?.textContent || "");
  const fumetto = () => t.pagina.evaluate(() => document.querySelector(".kit-fumetto")?.textContent || "");

  // Il risolutore stesso: la forza bruta coincide con la formula su tutte le posizioni fino a 9 corvi per palo.
  let differenze = 0;
  for (let a = 0; a <= 9; a++) for (let b = 0; b <= 9; b++) for (let c = 0; c <= 9; c++) for (let d = 0; d <= 9; d++)
    if (vinceChiMuove([a, b, c, d]) !== formula([a, b, c, d])) differenze++;
  t.controlla(differenze === 0, "il risolutore a forza bruta coincide con la regola del Nim misère su 10000 posizioni");

  /** Una partita di partenza valida: 4 pali da 1 a 9, tutti diversi, da 16 a 26 corvi, vincente per chi comincia, una sola mossa giusta. */
  const partitaValida = (p) =>
    Array.isArray(p) && p.length === 4 && p.every((n) => Number.isInteger(n) && n >= 1 && n <= 9) &&
    new Set(p).size === 4 && somma(p) >= 16 && somma(p) <= 26 && vinceChiMuove(p) && mosseVincenti(p).length === 1;

  // ── 1. Le varianti su sei semi ──
  const prime = new Set();
  for (const seme of [1, 2, 3, 4, 5, 2027]) {
    const v = await t.nuova(seme);
    const P = v && v.partite;
    const chiavi = new Set((Array.isArray(P) ? P : []).map((p) => [...p].sort((x, y) => x - y).join(",")));
    t.controlla(Array.isArray(P) && P.length === 10 && P.every(partitaValida) && chiavi.size === 10,
      `seme ${seme}: 10 partite valide e diverse (la prima: ${P && P[0]})`);
    const s = await statoGioco();
    t.controlla(s && uguali(s.pali, P[0]) && s.partita === 0 && s.mosse.length === 0 && s.selezione === null && s.vinta === false,
      `seme ${seme}: si comincia dalla prima partita, senza mosse né selezione`);
    if (P) prime.add(P[0].join(","));
  }
  t.controlla(prime.size >= 4, `semi diversi danno pali diversi (${prime.size} prime partite diverse su 6)`);

  // ── 2. Le mosse impossibili vengono rifiutate e non contano ──
  const v = await t.nuova(7);
  let s = await statoGioco();
  const pali0 = [...s.pali];
  const impossibili = [{ palo: 0, quanti: 0 }, { palo: 4, quanti: 1 }, { palo: -1, quanti: 2 }, { palo: 1, quanti: pali0[1] + 1 },
    { palo: 2, quanti: 1.5 }, { palo: "1", quanti: 1 }, {}];
  const rifiutate = [];
  for (const m of impossibili) rifiutate.push(await t.gioca(m));
  let st = await t.stato();
  s = await statoGioco();
  t.controlla(rifiutate.every((r) => r && r.valida === false), "le mosse impossibili (0 corvi, palo che non c'è, troppi corvi…) danno { valida: false }");
  t.controlla(st.errori === 0 && uguali(s.pali, pali0) && s.mosse.length === 0, "le mosse impossibili non contano come errore e non toccano i pali");

  // ── 3. I tocchi veri: scegliere i corvi ──
  let p = await t.chiama("posizione", 0, 0);
  await t.clicScena(p.x, p.y);
  s = await statoGioco();
  t.controlla(s.selezione && s.selezione.palo === 0 && s.selezione.quanti === pali0[0],
    `toccando il primo corvo del primo palo si preparano tutti e ${pali0[0]}`);
  p = await t.chiama("posizione", 1, pali0[1] - 1);
  await t.clicScena(p.x, p.y);
  s = await statoGioco();
  t.controlla(stessaMossa(s.selezione, { palo: 1, quanti: 1 }), "toccando l'ultimo corvo del secondo palo se ne prepara uno solo");
  t.controlla(/pront/i.test(await fumetto()), "il fumetto dice quanti corvi sono pronti");
  await t.clicScena(p.x, p.y);
  s = await statoGioco();
  t.controlla(s.selezione === null, "toccando di nuovo lo stesso corvo la scelta si annulla");
  p = await t.chiama("posizione", 3, 0);
  await t.clicScena(p.x, p.y);
  const scelta = (await statoGioco()).selezione;
  await t.clicScena(160, 30);
  s = await statoGioco();
  t.controlla(stessaMossa(scelta, { palo: 3, quanti: pali0[3] }) && s.selezione === null && (await t.stato()).errori === 0,
    "toccando il cielo la scelta si annulla, senza errori");
  await t.bottone("vola");
  s = await statoGioco();
  t.controlla(s.mosse.length === 0 && uguali(s.pali, pali0), "«Via!» senza corvi scelti non fa niente");

  // ── 4. L'errore tipico: una mossa sbagliata, e lo spaventapasseri non perdona ──
  const sbagliata = (() => {
    for (let palo = 0; palo < 4; palo++)
      for (let quanti = 1; quanti <= pali0[palo]; quanti++) if (vinceChiMuove(togli(pali0, { palo, quanti }))) return { palo, quanti };
    return null;
  })();
  let r = await t.gioca(sbagliata);
  let risposteGiuste = r && r.ok && stessaMossa(r.risposta, rispostaAttesa(togli(pali0, sbagliata)));
  s = await statoGioco();
  t.controlla(r && r.ok && !r.errore && (await t.stato()).errori === 0 && s.mosse.length === 2,
    `una mossa sbagliata (palo ${sbagliata.palo + 1}, via ${sbagliata.quanti}) non è ancora un errore: la partita continua`);
  let giri = 0, semprePerse = true;
  while (r && !r.persa && !r.risolto && giri++ < 40) {
    s = await statoGioco();
    // da qui ogni posizione è persa: si gioca svelti, togliendo tutto il primo palo con corvi
    if (mossaVincente(s.pali) !== null) semprePerse = false;
    const palo = s.pali.findIndex((n) => n > 0);
    const m = { palo, quanti: s.pali[palo] };
    const dopo = togli(s.pali, m);
    r = await t.gioca(m);
    if (r && r.ok) risposteGiuste = risposteGiuste && stessaMossa(r.risposta, rispostaAttesa(dopo));
  }
  st = await t.stato();
  s = await statoGioco();
  t.controlla(semprePerse, "dopo la mossa sbagliata lo spaventapasseri lascia solo posizioni perse");
  t.controlla(risposteGiuste, "lo spaventapasseri risponde sempre con la mossa attesa (la prima vincente)");
  t.controlla(r && r.errore && r.persa && r.motivo === "ultimo corvo", "far volare via l'ultimo corvo fa perdere la partita");
  t.controlla(st.errori === 1 && !st.risolto, "la partita persa conta come un errore e non risolve");
  t.controlla(s.partita === 1 && uguali(s.pali, v.partite[1]) && s.mosse.length === 0 && s.selezione === null,
    "dopo la partita persa si riparte dalla seconda partita della variante");
  t.controlla((await avviso()).startsWith("Hai fatto volare via l'ultimo corvo"), `l'avviso dice perché si è perso («${await avviso()}»)`);
  await t.foto("persa");

  // ── 5. Arrendersi: con il bottone vero serve la conferma, e conta come partita persa ──
  await t.aspetta(3800);
  await t.bottone("arrenditi");
  st = await t.stato();
  t.controlla(st.errori === 1, "il primo «Arrenditi» chiede conferma e non conta ancora");
  await t.bottone("arrenditi");
  st = await t.stato();
  s = await statoGioco();
  t.controlla(st.errori === 2 && s.partita === 2 && uguali(s.pali, v.partite[2]) && s.mosse.length === 0,
    "confermando la resa conta come partita persa e si passa alla terza partita");
  t.controlla((await avviso()).startsWith("Ti sei arreso"), "l'avviso della resa");
  const resa = await t.gioca({ arrenditi: true });
  t.controlla(resa && resa.errore && resa.persa && resa.motivo === "resa", "anche gioca({ arrenditi: true }) fa perdere la partita");
  st = await t.stato();
  s = await statoGioco();
  t.controlla(st.errori === 3 && st.dorateInPalio === 3 && s.partita === 3 && uguali(s.pali, v.partite[3]),
    "tre partite perse: errori 3, dorate in palio 3, quarta partita");
  await t.aspetta(3800);

  // ── 6. La soluzione: prima mossa con il tocco e «Via!», poi con gioca ──
  s = await statoGioco();
  const prima = mossaVincente(s.pali);
  p = await t.chiama("posizione", prima.palo, s.pali[prima.palo] - prima.quanti);
  await t.clicScena(p.x, p.y);
  let s1 = await statoGioco();
  t.controlla(stessaMossa(s1.selezione, prima), `il tocco prepara la mossa giusta (palo ${prima.palo + 1}, via ${prima.quanti})`);
  await t.bottone("vola");
  const s2 = await statoGioco();
  const attesa = rispostaAttesa(togli(s.pali, prima));
  t.controlla(s2.mosse.length === 2 && s2.mosse[0].chi === "tu" && stessaMossa(s2.mosse[0], prima) &&
    s2.mosse[1].chi === "spaventapasseri" && stessaMossa(s2.mosse[1], attesa) && uguali(s2.pali, togli(togli(s.pali, prima), attesa)),
    "«Via!» gioca la mossa scelta e lo spaventapasseri risponde subito nello stato");
  if (s2.animazione) {
    const q = await t.chiama("posizione", s2.pali.findIndex((n) => n > 0), 0);
    await t.clicScena(q.x, q.y);
    t.controlla((await statoGioco()).selezione === null, "mentre lo spaventapasseri gioca i tocchi sui corvi sono ignorati");
  }
  await t.foto("turno-spaventapasseri");

  // ── 7. Ricaricando la pagina la partita riprende da dove era ──
  await t.ricarica();
  await t.chiudiCarte();
  s = await statoGioco();
  st = await t.stato();
  t.controlla(uguali(s.pali, s2.pali) && s.partita === 3 && s.mosse.length === 2 && st.errori === 3,
    "ricaricando la pagina la partita riprende dalla stessa posizione (niente pali nuovi gratis)");

  giri = 0;
  risposteGiuste = true;
  r = { ok: true };
  while (r && r.ok && giri++ < 30) {
    s = await statoGioco();
    const m = mossaVincente(s.pali);
    if (!m) { risposteGiuste = false; break; }
    const dopo = togli(s.pali, m);
    r = await t.gioca(m);
    if (r && (r.ok || r.risolto)) risposteGiuste = risposteGiuste && stessaMossa(r.risposta, rispostaAttesa(dopo));
  }
  st = await t.stato();
  s = await statoGioco();
  t.controlla(risposteGiuste && r && r.risolto, "giocando sempre la mossa giusta lo spaventapasseri deve far volare via l'ultimo corvo");
  t.controlla(st.risolto && st.errori === 3 && s.vinta === true && s.pali.every((n) => n === 0), "il rompicapo è risolto con i pali vuoti");
  const rifiutata = await t.gioca({ palo: 0, quanti: 1 });
  t.controlla(rifiutata && rifiutata.rifiutata === "risolto", "dopo la vittoria le mosse non passano più");
  await t.aspetta(3000);
}
