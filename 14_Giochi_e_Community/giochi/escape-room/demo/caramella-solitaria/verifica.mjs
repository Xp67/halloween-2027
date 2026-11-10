// Verifica della caramella solitaria (solitario a salti su 33 buche). Non usa il codice della demo: ricava da sé la
// variante attesa dal seme e la soluzione dalla variante, con un risolutore suo (ricerca in profondità che ricorda le
// posizioni senza uscita, provata sia in avanti sia «al contrario»).

// ── La tavola ──
// Colonne a…g da sinistra, righe 1…7 dal basso. Indice delle buche: per righe dall'alto (c7 d7 e7 c6 d6 e6 a5 … g5 a4 …).
const LETTERE = "abcdefg";
const BUCHE = [];
for (let y = 0; y < 7; y++) for (let x = 0; x < 7; x++) if ((x >= 2 && x <= 4) || (y >= 2 && y <= 4)) BUCHE.push([x, y]);
const nomeDi = (x, y) => LETTERE[x] + (7 - y);
const NOMI = BUCHE.map(([x, y]) => nomeDi(x, y));
const IDX = new Map(NOMI.map((n, i) => [n, i]));
const xy = (n) => BUCHE[IDX.get(n)];
// Tutti i salti possibili sulla tavola: [da, sopra, a] come indici.
const SALTI = [];
for (const [x, y] of BUCHE) for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
  const x2 = x + 2 * dx, y2 = y + 2 * dy;
  if (x2 < 0 || x2 > 6 || y2 < 0 || y2 > 6) continue;
  const b = IDX.get(nomeDi(x + dx, y + dy)), c = IDX.get(nomeDi(x2, y2));
  if (b !== undefined && c !== undefined) SALTI.push([IDX.get(nomeDi(x, y)), b, c]);
}

// Le 29 coppie (buca vuota, buca finale) delle istruzioni, nello stesso ordine: le 7 della scheda girate e specchiate.
const ELENCO = [
  ["d4", "d4"], ["d7", "d1"], ["d1", "d7"], ["a4", "g4"], ["g4", "a4"], ["d7", "d4"], ["d1", "d4"], ["a4", "d4"],
  ["g4", "d4"], ["c7", "c4"], ["e7", "e4"], ["c1", "c4"], ["e1", "e4"], ["a5", "d5"], ["g5", "d5"], ["a3", "d3"],
  ["g3", "d3"], ["d6", "d3"], ["d2", "d5"], ["b4", "e4"], ["f4", "c4"], ["c5", "c5"], ["e5", "e5"], ["c3", "c3"],
  ["e3", "e3"], ["e4", "b4"], ["c4", "f4"], ["d3", "d6"], ["d5", "d2"],
];

// Il generatore del kit (mulberry32, come EscapeDemo.casuale): la variante è ELENCO[floor(rng() · 29)] alla prima chiamata.
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
const varianteAttesa = (seme) => {
  const [vuota, finale] = ELENCO[Math.floor(casuale(seme)() * ELENCO.length)];
  return { vuota, finale };
};

// ── Simulazione delle regole (per controllare le risposte della demo) ──
const inizio = (vuota) => NOMI.map((n) => n !== vuota);
const contate = (piene) => piene.reduce((s, p) => s + (p ? 1 : 0), 0);
const saltiPossibili = (piene) => SALTI.filter(([a, b, c]) => piene[a] && piene[b] && !piene[c]);
function applica(piene, [da, a]) {
  const s = SALTI.find(([x, , z]) => NOMI[x] === da && NOMI[z] === a);
  if (!s || !piene[s[0]] || !piene[s[1]] || piene[s[2]]) return null;
  const p = [...piene];
  p[s[0]] = false; p[s[1]] = false; p[s[2]] = true;
  return p;
}
const pieneNomi = (piene) => NOMI.filter((_, i) => piene[i]);
const uguali = (a, b) => JSON.stringify(a) === JSON.stringify(b);

// ── Il risolutore ──
// Ricerca in profondità con memoria delle posizioni senza uscita, con un tetto di posizioni visitate.
function cerca(vuota, finale, tetto) {
  const piene = new Uint8Array(33).fill(1);
  piene[vuota] = 0;
  const falliti = new Set();
  const via = [];
  let lo = 0, hi = 0; // la posizione come numero: bit 0-16 in lo, 17-32 in hi
  for (let i = 0; i < 33; i++) if (piene[i]) { if (i < 17) lo += 2 ** i; else hi += 2 ** (i - 17); }
  const sposta = (i, s) => { if (i < 17) lo += s * 2 ** i; else hi += s * 2 ** (i - 17); };
  let visite = 0, esaurito = false;
  function giu(rimaste) {
    if (rimaste === 1) return piene[finale] === 1;
    if (++visite > tetto) { esaurito = true; return false; }
    const chiave = hi * 131072 + lo;
    if (falliti.has(chiave)) return false;
    for (const s of SALTI) {
      const [a, b, c] = s;
      if (!piene[a] || !piene[b] || piene[c]) continue;
      piene[a] = 0; piene[b] = 0; piene[c] = 1;
      sposta(a, -1); sposta(b, -1); sposta(c, 1);
      via.push(s);
      if (giu(rimaste - 1)) return true;
      via.pop();
      piene[a] = 1; piene[b] = 1; piene[c] = 0;
      sposta(a, 1); sposta(b, 1); sposta(c, -1);
      if (esaurito) return false;
    }
    falliti.add(chiave);
    return false;
  }
  return { ok: giu(32), esaurito, via };
}
/**
 * Una soluzione da `vuota` a `finale` come lista di salti [da, a] (nomi), oppure null.
 * Prova in avanti e «al contrario» con tetti crescenti: il gioco al contrario (tutte piene tranne `finale`, una sola
 * in `vuota`) ha gli stessi salti in ordine inverso, e per alcune partenze è molto più veloce.
 * `limiteMs` ferma la ricerca (ritorna null anche se una soluzione esisteva).
 */
function risolvi(vuota, finale, limiteMs = 60000) {
  const v = IDX.get(vuota), f = IDX.get(finale);
  const t0 = Date.now();
  for (let tetto = 20000; Date.now() - t0 < limiteMs; tetto *= 4) {
    const avanti = cerca(v, f, tetto);
    if (avanti.ok) return avanti.via.map(([a, , c]) => [NOMI[a], NOMI[c]]);
    const indietro = cerca(f, v, tetto);
    if (indietro.ok) return indietro.via.slice().reverse().map(([a, , c]) => [NOMI[a], NOMI[c]]);
    if (!avanti.esaurito && !indietro.esaurito) return null; // impossibile davvero
  }
  return null;
}
/** Rigioca una lista di salti dalla variante: ritorna la posizione finale, o null se un salto non è valido. */
function rigioca(vuota, salti) {
  let piene = inizio(vuota);
  for (const s of salti) {
    piene = applica(piene, s);
    if (!piene) return null;
  }
  return piene;
}
const risolve = (v, salti) => {
  const p = salti && rigioca(v.vuota, salti);
  return !!p && salti.length === 31 && contate(p) === 1 && p[IDX.get(v.finale)];
};

/** Un vicolo cieco con più di una caramella, giocando a caso (ma sempre uguale) dalla partenza della variante. */
function vicoloCieco(v) {
  for (let seme = 7; seme < 200; seme++) {
    const rng = casuale(seme);
    let piene = inizio(v.vuota);
    const salti = [];
    for (;;) {
      const possibili = saltiPossibili(piene);
      if (!possibili.length) break;
      const [a, , c] = possibili[Math.floor(rng() * possibili.length)];
      salti.push([NOMI[a], NOMI[c]]);
      piene = applica(piene, [NOMI[a], NOMI[c]]);
    }
    if (contate(piene) > 1) return { salti, piene };
  }
  return null;
}

/** Una soluzione che lascia l'ultima caramella in una buca diversa da quella d'oro (per provare quell'errore). */
function finaleSbagliato(v, limiteMs) {
  const [fx, fy] = xy(v.finale);
  const candidate = [[3, 0], [-3, 0], [0, 3], [0, -3]]
    .map(([dx, dy]) => [fx + dx, fy + dy])
    .filter(([x, y]) => x >= 0 && x <= 6 && y >= 0 && y <= 6 && ((x >= 2 && x <= 4) || (y >= 2 && y <= 4)))
    .map(([x, y]) => nomeDi(x, y));
  const t0 = Date.now();
  // a giro, con tetti crescenti, così vince la candidata più veloce
  for (let tetto = 20000; Date.now() - t0 < limiteMs; tetto *= 4) {
    for (const altra of candidate) {
      const a = IDX.get(v.vuota), b = IDX.get(altra);
      const avanti = cerca(a, b, tetto);
      if (avanti.ok) return { buca: altra, salti: avanti.via.map(([x, , z]) => [NOMI[x], NOMI[z]]) };
      const indietro = cerca(b, a, tetto);
      if (indietro.ok) return { buca: altra, salti: indietro.via.slice().reverse().map(([x, , z]) => [NOMI[x], NOMI[z]]) };
    }
  }
  return null;
}

export default async function verifica(t) {
  const salto = (da, a) => t.gioca({ tipo: "salto", da, a });
  const sg = () => t.chiama("statoGioco");

  // ── 1. Varianti: quella prevista dal seme, fra le 29, risolvibile; tavola iniziale giusta ──
  const viste = new Set();
  for (const seme of [1, 2, 3, 4, 5, 6, 7]) {
    const v = await t.nuova(seme);
    const attesa = varianteAttesa(seme);
    t.controlla(v && v.vuota === attesa.vuota && v.finale === attesa.finale,
      `seme ${seme}: variante ${v && v.vuota}→${v && v.finale}, quella prevista dall'elenco (${attesa.vuota}→${attesa.finale})`);
    const inElenco = !!v && ELENCO.some(([a, b]) => a === v.vuota && b === v.finale);
    t.controlla(inElenco, `seme ${seme}: la coppia è una delle 29 verificate`);
    if (!inElenco) continue;
    viste.add(v.vuota + v.finale);
    const t0 = Date.now();
    const sol = risolvi(v.vuota, v.finale);
    t.controlla(risolve(v, sol), `seme ${seme}: il risolutore trova 31 salti che lasciano l'ultima caramella in ${v.finale} (${Date.now() - t0} ms)`);
    const s = await sg();
    t.controlla(s.rimaste === 32 && uguali(s.piene, pieneNomi(inizio(v.vuota))) && s.salti.length === 0 && !s.bloccato && s.selezionata === null,
      `seme ${seme}: all'inizio 32 caramelle, vuota solo ${v.vuota}`);
  }
  t.controlla(viste.size >= 3, `i semi danno partenze diverse (${viste.size} coppie diverse su 7 semi)`);

  // ── La partita vera, su un seme fisso ──
  const v = await t.nuova(2027);
  const sol = risolvi(v.vuota, v.finale);
  t.controlla(risolve(v, sol), `seme 2027 (${v.vuota}→${v.finale}): soluzione trovata dal risolutore`);
  if (!sol) return;
  let st = await t.stato();
  t.controlla(st.errori === 0 && !st.risolto, "si parte senza errori");

  // ── 2. Mosse impossibili: rifiutate, nessun errore ──
  const [px, py] = xy(sol[0][0]);
  const piena = sol[0][0]; // una caramella che può saltare
  const diagonale = NOMI.find((n) => { const [x, y] = xy(n); return Math.abs(x - px) === 2 && Math.abs(y - py) === 2; });
  const lontana = NOMI.find((n) => { const [x, y] = xy(n); return (x === px && Math.abs(y - py) === 4) || (y === py && Math.abs(x - px) === 4); });
  const pienaVicina = NOMI.find((n) => { const [x, y] = xy(n); return n !== v.vuota && ((x === px && Math.abs(y - py) === 2) || (y === py && Math.abs(x - px) === 2)); });
  const sopraVuota = NOMI.find((n) => { const [x, y] = xy(v.vuota); const [a, b] = xy(n); return (a === x && Math.abs(b - y) === 1) || (b === y && Math.abs(a - x) === 1); });
  const impossibili = [
    [{ tipo: "salto", da: v.vuota, a: sol[0][1] }, "dalla buca vuota"],
    [{ tipo: "salto", da: "a1", a: "a3" }, "da una buca che non esiste"],
    [{ tipo: "salto", da: piena, a: piena }, "sul posto"],
    [{ tipo: "annulla" }, "annullare all'inizio"],
    [{ tipo: "ricomincia" }, "ricominciare all'inizio"],
  ];
  if (diagonale) impossibili.push([{ tipo: "salto", da: piena, a: diagonale }, "in diagonale"]);
  if (lontana) impossibili.push([{ tipo: "salto", da: piena, a: lontana }, "di quattro buche"]);
  if (pienaVicina) impossibili.push([{ tipo: "salto", da: piena, a: pienaVicina }, "in una buca piena"]);
  if (sopraVuota) impossibili.push([{ tipo: "salto", da: sopraVuota, a: v.vuota }, "di una buca sola"]);
  for (const [m, come] of impossibili) {
    const r = await t.gioca(m);
    t.controlla(r && r.valida === false, `salto impossibile (${come}) rifiutato`);
  }
  st = await t.stato();
  let s = await sg();
  t.controlla(st.errori === 0 && s.rimaste === 32 && s.salti.length === 0, "le mosse impossibili non contano come errore e non cambiano la tavola");

  // ── 5. L'interfaccia vera: tocco sulla caramella, tocco sulla buca; «Annulla»; trascinamento; «Ricomincia» ──
  const [da0, a0] = sol[0];
  const pDa = await t.chiama("posizione", da0), pA = await t.chiama("posizione", a0);
  await t.clicScena(pDa.x, pDa.y);
  await t.aspetta(150);
  s = await sg();
  t.controlla(s.selezionata === da0 && s.salti.length === 0, `toccando ${da0} la caramella si seleziona`);
  await t.foto("selezionata");
  await t.clicScena(pA.x, pA.y);
  await t.aspetta(150);
  s = await sg();
  t.controlla(uguali(s.salti, [[da0, a0]]) && s.rimaste === 31 && s.selezionata === null,
    `toccando poi ${a0} la caramella salta (${s.salti.length} salti, ${s.rimaste} caramelle)`);
  await t.bottone("annulla");
  await t.aspetta(150);
  s = await sg();
  st = await t.stato();
  t.controlla(s.salti.length === 0 && s.rimaste === 32 && st.errori === 0, "«Annulla» rimette a posto il salto, gratis");
  await t.trascinaScena(pDa.x, pDa.y, pA.x, pA.y);
  await t.aspetta(400);
  s = await sg();
  t.controlla(uguali(s.salti, [[da0, a0]]) && s.rimaste === 31, `trascinando ${da0} su ${a0} la caramella salta`);
  await t.bottone("ricomincia");
  await t.aspetta(150);
  s = await sg();
  st = await t.stato();
  t.controlla(s.salti.length === 1 && st.errori === 0, "il primo tocco su «Ricomincia» chiede conferma e non cambia niente");
  await t.bottone("ricomincia");
  await t.aspetta(150);
  s = await sg();
  st = await t.stato();
  t.controlla(s.salti.length === 0 && s.rimaste === 32 && st.errori === 1 && !st.risolto, "il secondo tocco ricomincia da capo e conta un errore");
  let errori = 1;

  // ── 2. Errore tipico: restare bloccati con più di una caramella ──
  const vc = vicoloCieco(v);
  t.controlla(!!vc, `trovato un vicolo cieco da giocare (${vc && vc.salti.length} salti, ${vc && contate(vc.piene)} caramelle)`);
  if (vc) {
    let tuttiValidi = true, ultimo = null;
    for (let i = 0; i < vc.salti.length; i++) {
      const r = await salto(...vc.salti[i]);
      if (i < vc.salti.length - 1 && !(r && r.valida && !r.bloccato && !r.errore)) tuttiValidi = false;
      ultimo = r;
    }
    t.controlla(tuttiValidi, "i salti prima del vicolo cieco sono validi e senza errori");
    st = await t.stato();
    s = await sg();
    errori += 1;
    t.controlla(ultimo && ultimo.valida && ultimo.bloccato && ultimo.errore && !ultimo.risolto && ultimo.rimaste === contate(vc.piene),
      `l'ultimo salto lascia senza salti possibili: esito ${JSON.stringify(ultimo)}`);
    t.controlla(st.errori === errori && !st.risolto && s.bloccato && uguali(s.piene, pieneNomi(vc.piene)),
      `restare bloccati con ${contate(vc.piene)} caramelle conta un errore e non risolve (errori: ${st.errori})`);
    await t.aspetta(300);
    await t.foto("bloccato");
    // annullare è gratis; tornare nello stesso vicolo cieco non conta di nuovo
    const r1 = await t.gioca({ tipo: "annulla" });
    st = await t.stato();
    s = await sg();
    t.controlla(r1 && r1.valida && st.errori === errori && !s.bloccato && s.salti.length === vc.salti.length - 1, "dal vicolo cieco «Annulla» torna indietro senza errori");
    const r2 = await salto(...vc.salti[vc.salti.length - 1]);
    st = await t.stato();
    t.controlla(r2 && r2.valida && r2.bloccato && r2.errore === false && st.errori === errori, "rientrare nello stesso vicolo cieco non conta un altro errore");

    // ── 6. Niente ripartenza gratis ricaricando la pagina ──
    await t.ricarica();
    await t.chiudiCarte();
    s = await sg();
    st = await t.stato();
    t.controlla(uguali(s.salti, vc.salti) && s.bloccato && st.errori === errori, `ricaricando la pagina la tavola resta com'era (${s.salti.length} salti) e gli errori pure`);
    const r3 = await t.gioca({ tipo: "ricomincia" });
    errori += 1;
    st = await t.stato();
    s = await sg();
    t.controlla(r3 && r3.valida && r3.errore && st.errori === errori && s.rimaste === 32 && s.salti.length === 0, "«ricomincia» da gioca conta un errore e rimette 32 caramelle");
  }

  // ── L'ultima caramella nella buca sbagliata: è un errore; poi si annulla tutto, gratis ──
  const t0 = Date.now();
  const sb = finaleSbagliato(v, 20000);
  if (!sb) t.log(`(nessuna soluzione verso un'altra buca trovata in 20 s: controllo della buca sbagliata saltato)`);
  else {
    let ultimo = null, ok = true;
    for (let i = 0; i < sb.salti.length; i++) {
      const r = await salto(...sb.salti[i]);
      if (i < sb.salti.length - 1 && !(r && r.valida && !r.bloccato)) ok = false;
      ultimo = r;
    }
    errori += 1;
    st = await t.stato();
    t.controlla(ok && ultimo && ultimo.valida && ultimo.bloccato && ultimo.errore && !ultimo.risolto && ultimo.rimaste === 1 && st.errori === errori && !st.risolto,
      `l'ultima caramella in ${sb.buca} invece che in ${v.finale} è un errore e non risolve (${Date.now() - t0} ms per trovarla)`);
    await t.foto("buca-sbagliata");
    let annullati = 0;
    for (let i = 0; i < 31; i++) {
      const r = await t.gioca({ tipo: "annulla" });
      if (r && r.valida) annullati++;
    }
    st = await t.stato();
    s = await sg();
    t.controlla(annullati === 31 && s.rimaste === 32 && s.salti.length === 0 && st.errori === errori, "si possono annullare tutti i 31 salti, uno alla volta, senza errori");
  }

  // ── 4. La soluzione del risolutore risolve ──
  let ultimo = null, ok = true;
  for (let i = 0; i < sol.length; i++) {
    const r = await salto(...sol[i]);
    if (i < sol.length - 1 && !(r && r.valida && !r.bloccato && !r.errore && !r.risolto && r.rimaste === 31 - i)) ok = false;
    ultimo = r;
  }
  st = await t.stato();
  s = await sg();
  t.controlla(ok && ultimo && ultimo.valida && ultimo.risolto && ultimo.rimaste === 1, "i 31 salti del risolutore sono tutti validi e l'ultimo risolve");
  t.controlla(st.risolto && st.errori === errori && uguali(s.piene, [v.finale]),
    `rompicapo risolto con l'ultima caramella in ${v.finale} (errori: ${st.errori}, dorate: ${st.guadagnate})`);
  await t.aspetta(1500);
}
