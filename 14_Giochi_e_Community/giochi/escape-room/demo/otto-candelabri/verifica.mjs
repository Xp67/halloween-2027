// Verifica degli otto candelabri. Non usa il codice della demo: ricava coppie, soluzione e candelabri che si
// vedono con un risolutore suo, e controlla la demo solo attraverso window.__demo, i clic e i bottoni.
//
// Righe e colonne come nelle istruzioni: riga 0 = fila 8 (in alto), riga 7 = fila 1; colonna 0 = A, 7 = H.

// ── Il risolutore ──

/** Due caselle si vedono se stanno sulla stessa fila, colonna o diagonale. */
const vede = (a, b) => a[0] === b[0] || a[1] === b[1] || Math.abs(a[0] - b[0]) === Math.abs(a[1] - b[1]);

/** Tutte le disposizioni di otto candelabri che non si vedono: col[r] = colonna del candelabro della riga r. */
function tutteLeDisposizioni() {
  const trovate = [];
  const col = [];
  (function cerca(r) {
    if (r === 8) { trovate.push([...col]); return; }
    for (let c = 0; c < 8; c++) {
      if (col.some((cq, q) => cq === c || Math.abs(cq - c) === r - q)) continue;
      col.push(c);
      cerca(r + 1);
      col.pop();
    }
  })(0);
  return trovate;
}
const DISPOSIZIONI = tutteLeDisposizioni();

/** Le coppie di caselle che compaiono in una sola disposizione, come "r1c1r2c2" (r1 < r2), in ordine alfabetico. */
const COPPIE = (() => {
  const conta = new Map();
  for (const d of DISPOSIZIONI)
    for (let a = 0; a < 8; a++)
      for (let b = a + 1; b < 8; b++) {
        const k = `${a}${d[a]}${b}${d[b]}`;
        conta.set(k, (conta.get(k) || 0) + 1);
      }
  return [...conta].filter(([, n]) => n === 1).map(([k]) => k).sort();
})();

/** Le disposizioni che contengono entrambi i candelabri fissi. */
const compatibili = (fissi) => DISPOSIZIONI.filter((d) => fissi.every(([r, c]) => d[r] === c));

/** Lo stesso generatore di EscapeDemo.casuale (mulberry32). */
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

const ordina = (l) => (Array.isArray(l) ? l : []).map(([r, c]) => [r, c]).sort((a, b) => a[0] - b[0] || a[1] - b[1]);
const uguali = (a, b) => JSON.stringify(ordina(a)) === JSON.stringify(ordina(b));
const nome = ([r, c]) => "ABCDEFGH"[c] + (8 - r);
/** I candelabri che si spengono: quelli che ne vedono almeno un altro. */
const spentiAttesi = (tutti) => ordina(tutti.filter((a) => tutti.some((b) => b !== a && vede(a, b))));
const accesiAttesi = (tutti) => ordina(tutti.filter((a) => !tutti.some((b) => b !== a && vede(a, b))));

// ── Dove toccare (coordinate delle istruzioni) ──
const centro = ([r, c]) => ({ x: 100 + c * 15 + 7, y: 25 + r * 15 + 7 });
const RASTRELLIERA = { x: 48, y: 100 };

export default async function verifica(t) {
  const semeBase = t.seme;
  t.controlla(DISPOSIZIONI.length === 92 && COPPIE.length === 308,
    `il risolutore trova 92 disposizioni e 308 coppie che ne lasciano una sola (${DISPOSIZIONI.length}, ${COPPIE.length})`);

  // ── 1. La variante su più semi: formato, generatore, una sola soluzione, stato iniziale ──
  const viste = new Set();
  for (const seme of [1, 2, 3, 4, 5, 42]) {
    const v = await t.nuova(seme);
    const f = v && v.fissi;
    const forma = Array.isArray(f) && f.length === 2
      && f.every((p) => Array.isArray(p) && p.length === 2 && p.every((x) => Number.isInteger(x) && x >= 0 && x < 8))
      && f[0][0] < f[1][0];
    if (!t.controlla(forma, `seme ${seme}: variante { fissi: [[r1, c1], [r2, c2]] } con r1 < r2 (${JSON.stringify(v)})`)) continue;
    const chiave = `${f[0][0]}${f[0][1]}${f[1][0]}${f[1][1]}`;
    viste.add(chiave);
    const n = compatibili(f).length;
    t.controlla(!vede(f[0], f[1]) && n === 1,
      `seme ${seme}: i fissi ${nome(f[0])} e ${nome(f[1])} non si vedono e lasciano una sola disposizione (${n})`);
    const attesa = COPPIE[Math.floor(casuale(seme)() * COPPIE.length)];
    t.controlla(chiave === attesa, `seme ${seme}: la coppia è quella del generatore delle istruzioni (${chiave}, attesa ${attesa})`);
    const s = await t.chiama("statoGioco");
    t.controlla(s && uguali(s.fissi, f) && Array.isArray(s.mobili) && s.mobili.length === 0 && s.daPosare === 6
      && s.accesi.length === 0 && s.spenti.length === 0 && s.risolto === false,
    `seme ${seme}: all'inizio ci sono solo i due inchiodati e sei candelabri da posare (${JSON.stringify(s)})`);
  }
  t.controlla(viste.size >= 4, `semi diversi danno coppie diverse (${viste.size} coppie su 6 semi)`);

  // ── La partita vera, sul seme della prova ──
  const v = await t.nuova(semeBase);
  const fissi = v.fissi;
  const soluzione = compatibili(fissi)[0].map((c, r) => [r, c]);
  const righeFisse = new Set(fissi.map(([r]) => r));
  const giusti = soluzione.filter(([r]) => !righeFisse.has(r)); // i sei da posare, in ordine di riga
  t.log(`seme ${semeBase}: fissi ${fissi.map(nome).join(" ")} → soluzione ${soluzione.map(nome).join(" ")}`);
  const occupata = (p, lista) => lista.some(([r, c]) => r === p[0] && c === p[1]);
  // una casella libera che non è nella soluzione (per spostare e per i rifiuti)
  let altrove = null;
  for (let r = 0; r < 8 && !altrove; r++)
    for (let c = 0; c < 8 && !altrove; c++)
      if (!occupata([r, c], soluzione)) altrove = [r, c];

  // ── 3. Mosse impossibili: rifiutate, non sono errori ──
  const rifiuti = [
    [{ tipo: "posa", riga: fissi[0][0], colonna: fissi[0][1] }, "occupata", "posare sopra un candelabro inchiodato"],
    [{ tipo: "togli", riga: fissi[1][0], colonna: fissi[1][1] }, "inchiodato", "togliere un candelabro inchiodato"],
    [{ tipo: "sposta", da: fissi[0], a: altrove }, "inchiodato", "spostare un candelabro inchiodato"],
    [{ tipo: "togli", riga: giusti[0][0], colonna: giusti[0][1] }, "vuota", "togliere da una casella vuota"],
    [{ tipo: "posa", riga: 8, colonna: 0 }, "fuori", "posare fuori dalla scacchiera"],
    [{ tipo: "posa", riga: 1.5, colonna: 2 }, "fuori", "posare su una riga non intera"],
    [{ tipo: "accendi" }, "mancano", "accendere con sei candelabri ancora da posare"],
    [{ tipo: "vola" }, "sconosciuta", "una mossa che non esiste"],
  ];
  for (const [mossa, motivo, cosa] of rifiuti) {
    const r = await t.gioca(mossa);
    t.controlla(r && r.valida === false && r.motivo === motivo, `${cosa}: rifiutata con motivo «${motivo}» (${JSON.stringify(r)})`);
  }
  let st = await t.stato();
  t.controlla(st.errori === 0 && !st.risolto, `le mosse impossibili non contano come errori (errori: ${st.errori})`);

  // ── 5. L'interfaccia vera: clic per posare e togliere, trascinamenti per spostare e prendere dalla rastrelliera ──
  const statoGioco = () => t.chiama("statoGioco");
  let p = centro(giusti[0]);
  await t.clicScena(p.x, p.y);
  await t.aspetta(120);
  let sg = await statoGioco();
  t.controlla(uguali(sg.mobili, [giusti[0]]) && sg.daPosare === 5, `un clic su ${nome(giusti[0])} posa un candelabro (${JSON.stringify(sg.mobili)})`);
  await t.clicScena(p.x, p.y);
  await t.aspetta(120);
  sg = await statoGioco();
  t.controlla(sg.mobili.length === 0 && sg.daPosare === 6, `un secondo clic su ${nome(giusti[0])} lo toglie`);
  await t.clicScena(p.x, p.y);
  await t.aspetta(120);
  const pf = centro(fissi[0]);
  await t.clicScena(pf.x, pf.y);
  await t.aspetta(120);
  sg = await statoGioco();
  st = await t.stato();
  t.controlla(uguali(sg.mobili, [giusti[0]]) && st.errori === 0, `un clic sul fisso ${nome(fissi[0])} non lo toglie e non è un errore`);
  const dest = centro(altrove);
  await t.trascinaScena(p.x, p.y, dest.x, dest.y);
  await t.aspetta(400);
  sg = await statoGioco();
  t.controlla(uguali(sg.mobili, [altrove]), `trascinare il candelabro da ${nome(giusti[0])} a ${nome(altrove)} lo sposta (${JSON.stringify(sg.mobili)})`);
  await t.trascinaScena(dest.x, dest.y, p.x, p.y);
  await t.aspetta(400);
  p = centro(giusti[1]);
  await t.trascinaScena(RASTRELLIERA.x, RASTRELLIERA.y, p.x, p.y);
  await t.aspetta(400);
  sg = await statoGioco();
  t.controlla(uguali(sg.mobili, [giusti[0], giusti[1]]) && sg.daPosare === 4,
    `trascinare dalla rastrelliera a ${nome(giusti[1])} posa un candelabro (${JSON.stringify(sg.mobili)})`);
  const r9 = await t.gioca({ tipo: "sposta", da: giusti[0], a: giusti[1] });
  t.controlla(r9 && r9.valida === false && r9.motivo === "occupata", `spostare su una casella occupata è rifiutato (${JSON.stringify(r9)})`);

  // I candelabri posati restano anche ricaricando la pagina.
  await t.ricarica();
  await t.chiudiCarte();
  sg = await statoGioco();
  t.controlla(uguali(sg.mobili, [giusti[0], giusti[1]]) && sg.daPosare === 4, `ricaricando la pagina i candelabri posati restano (${JSON.stringify(sg.mobili)})`);

  // ── 2. Errori: otto candelabri che si vedono ──
  // Scambiare le colonne di due candelabri della soluzione dà sempre una disposizione sbagliata (la soluzione è unica).
  const scambia = (lista, i, j) => lista.map(([r, c], k) => [r, k === i ? lista[j][1] : k === j ? lista[i][1] : c]);
  const sbagliati1 = scambia(giusti, 2, 3);
  const sbagliati2 = scambia(giusti, 0, 5);
  await t.bottone("svuota");
  await t.aspetta(120);
  sg = await statoGioco();
  t.controlla(sg.mobili.length === 0 && sg.daPosare === 6, "il bottone Svuota rimette i candelabri nella rastrelliera");
  for (const [r, c] of sbagliati1) {
    const esito = await t.gioca({ tipo: "posa", riga: r, colonna: c });
    if (!esito || !esito.ok) t.controlla(false, `posa in ${nome([r, c])}: ${JSON.stringify(esito)}`);
  }
  sg = await statoGioco();
  t.controlla(sg.daPosare === 0 && sg.mobili.length === 6, "sei candelabri posati: la rastrelliera è vuota");
  const r10 = await t.gioca({ tipo: "posa", riga: altrove[0], colonna: altrove[1] });
  t.controlla(r10 && r10.valida === false && r10.motivo === "finiti", `un nono candelabro è rifiutato (${JSON.stringify(r10)})`);
  const tutti1 = [...fissi, ...sbagliati1];
  let r = await t.gioca({ tipo: "accendi" });
  st = await t.stato();
  sg = await statoGioco();
  t.controlla(r && r.errore === true && uguali(r.spenti, spentiAttesi(tutti1)) && st.errori === 1 && !st.risolto,
    `accendere con candelabri che si vedono è un errore e non risolve (si spengono ${spentiAttesi(tutti1).map(nome).join(" ")}; esito ${JSON.stringify(r)})`);
  t.controlla(uguali(sg.spenti, spentiAttesi(tutti1)) && uguali(sg.accesi, accesiAttesi(tutti1)),
    "dopo l'errore restano accesi solo quelli che non ne vedono nessun altro");
  await t.aspetta(900); // la sequenza di accensione e spegnimento dura meno di un secondo
  await t.foto("errore");
  r = await t.gioca({ tipo: "accendi" });
  st = await t.stato();
  t.controlla(r && r.valida === false && r.motivo === "invariato" && st.errori === 1,
    `riaccendere gli stessi candelabri è rifiutato e non è un altro errore (${JSON.stringify(r)})`);
  // Cambiando la disposizione le fiammelle tornano spente.
  const a1 = sbagliati1[0];
  r = await t.gioca({ tipo: "togli", riga: a1[0], colonna: a1[1] });
  sg = await statoGioco();
  t.controlla(r && r.ok && sg.daPosare === 1 && sg.accesi.length === 0 && sg.spenti.length === 0,
    "togliendo un candelabro dopo l'errore tutti tornano spenti senza bordo rosso");
  // Seconda disposizione sbagliata (un altro scambio), poi accendi: secondo errore.
  for (const [rr, cc] of sbagliati1) if (!occupata([rr, cc], sbagliati2) && !(rr === a1[0] && cc === a1[1]))
    await t.gioca({ tipo: "togli", riga: rr, colonna: cc });
  for (const [rr, cc] of sbagliati2) {
    sg = await statoGioco();
    if (!occupata([rr, cc], sg.mobili)) await t.gioca({ tipo: "posa", riga: rr, colonna: cc });
  }
  sg = await statoGioco();
  t.controlla(uguali(sg.mobili, sbagliati2), `seconda disposizione sbagliata pronta (${sg.mobili.map(nome).join(" ")}, voluta ${sbagliati2.map(nome).join(" ")})`);
  r = await t.gioca({ tipo: "accendi" });
  st = await t.stato();
  t.controlla(r && r.errore === true && st.errori === 2 && st.dorateInPalio === 3 && !st.risolto,
    `secondo errore: le dorate in palio scendono da 4 a 3 (errori ${st.errori}, in palio ${st.dorateInPalio})`);

  // ── 4. La soluzione del risolutore: cinque con gioca, l'ultimo con un clic, poi il bottone Accendi ──
  r = await t.gioca({ tipo: "svuota" });
  t.controlla(r && r.ok && r.daPosare === 6, `svuota con gioca rimette tutti nella rastrelliera (${JSON.stringify(r)})`);
  for (const [rr, cc] of giusti.slice(0, 5)) {
    const esito = await t.gioca({ tipo: "posa", riga: rr, colonna: cc });
    if (!esito || !esito.ok) t.controlla(false, `posa in ${nome([rr, cc])}: ${JSON.stringify(esito)}`);
  }
  p = centro(giusti[5]);
  await t.clicScena(p.x, p.y);
  await t.aspetta(150);
  sg = await statoGioco();
  t.controlla(uguali(sg.mobili, giusti) && sg.daPosare === 0, `i sei candelabri della soluzione sono posati (${sg.mobili.map(nome).join(" ")})`);
  await t.bottone("accendi");
  await t.aspetta(200);
  st = await t.stato();
  sg = await statoGioco();
  t.controlla(st.risolto && st.errori === 2 && st.guadagnate === 3,
    `la soluzione ${soluzione.map(nome).join(" ")} risolve il rompicapo (risolto ${st.risolto}, errori ${st.errori}, guadagnate ${st.guadagnate})`);
  t.controlla(sg.risolto === true && uguali(sg.accesi, soluzione) && sg.spenti.length === 0, "dopo la soluzione tutti e otto restano accesi");
  await t.aspetta(1800);
}
