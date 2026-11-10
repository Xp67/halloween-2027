// Verifica della demo «La pista che si spegne» (luci da spegnere 5×5).
// Non usa il codice della demo: ricava minimo e soluzione dalla variante con un risolutore suo
// (eliminazione di Gauss in modulo 2, adattata da ../verifiche/verifiche-a.mjs), diverso dall'inseguimento
// delle 32 prime righe descritto nelle istruzioni, così i due calcoli si controllano a vicenda.

const N = 25;
// CROCE[i]: le piastrelle che cambiano pestando la i-esima (i = riga * 5 + colonna, riga 0 = la fila in fondo).
const CROCE = [];
for (let i = 0; i < N; i++) {
  const r = Math.floor(i / 5), c = i % 5;
  let m = 1 << i;
  if (r > 0) m |= 1 << (i - 5);
  if (r < 4) m |= 1 << (i + 5);
  if (c > 0) m |= 1 << (i - 1);
  if (c < 4) m |= 1 << (i + 1);
  CROCE.push(m);
}
const peso = (v) => { let n = 0; while (v) { n += v & 1; v >>>= 1; } return n; };
const daRighe = (righe) => righe.reduce((p, riga, r) => [...riga].reduce((q, ch, c) => (ch === "1" ? q | (1 << (r * 5 + c)) : q), p), 0);
const inRighe = (p) => [0, 1, 2, 3, 4].map((r) => [0, 1, 2, 3, 4].map((c) => ((p >> (r * 5 + c)) & 1 ? "1" : "0")).join(""));
const piastrelle = (v) => [...Array(N).keys()].filter((i) => (v >> i) & 1);
const uguali = (a, b) => JSON.stringify(a) === JSON.stringify(b);

/** Tutte le soluzioni (0 o 4: il nucleo ha dimensione 2) e la più corta; null se la pista non si spegne. */
function risolvi(pista) {
  const righe = CROCE.map((m, i) => ({ a: m, b: (pista >> i) & 1 })); // la matrice è simmetrica
  let r = 0;
  const pivot = [];
  for (let c = 0; c < N; c++) {
    let p = -1;
    for (let k = r; k < N; k++) if ((righe[k].a >> c) & 1) { p = k; break; }
    if (p < 0) continue;
    [righe[r], righe[p]] = [righe[p], righe[r]];
    for (let k = 0; k < N; k++) if (k !== r && (righe[k].a >> c) & 1) { righe[k].a ^= righe[r].a; righe[k].b ^= righe[r].b; }
    pivot.push(c);
    r++;
  }
  for (let k = r; k < N; k++) if (righe[k].b) return null;
  let x = 0;
  for (let k = 0; k < r; k++) if (righe[k].b) x |= 1 << pivot[k];
  const liberi = [...Array(N).keys()].filter((c) => !pivot.includes(c));
  const nucleo = liberi.map((f) => {
    let v = 1 << f;
    for (let k = 0; k < r; k++) if ((righe[k].a >> f) & 1) v |= 1 << pivot[k];
    return v;
  });
  const soluzioni = [];
  for (let s = 0; s < 1 << nucleo.length; s++) {
    let y = x;
    nucleo.forEach((v, i) => { if ((s >> i) & 1) y ^= v; });
    soluzioni.push(y);
  }
  const migliore = soluzioni.reduce((a, b) => (peso(b) < peso(a) ? b : a));
  return { soluzioni, migliore, minimo: peso(migliore) };
}

// Il generatore delle istruzioni, rifatto qui con il risolutore di Gauss (solo per un confronto nel registro).
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
function generaRiferimento(seme) {
  const rng = casuale(seme);
  for (let tentativo = 0; tentativo < 300; tentativo++) {
    let pista = 0;
    for (let i = 0; i < N; i++) if (rng() < 0.5) pista ^= CROCE[i];
    const accese = peso(pista);
    if (accese < 9 || accese > 16) continue;
    const minimo = risolvi(pista).minimo;
    if (minimo < 9 || minimo > 13) continue;
    return { pista: inRighe(pista), minimo, limite: minimo + 6 };
  }
  return null;
}

// La geometria della pista delle istruzioni, per controllare che posizione(r, c) cada dentro la piastrella giusta.
const YB = [54, 69, 85, 102, 120, 139];
const mezza = (y) => 50 + Math.floor(((y - 54) * 26) / 85);
const xc = (k, y) => 160 - mezza(y) + Math.round((k * 2 * mezza(y)) / 5);
function dentro(r, c, p) {
  if (!p || !Number.isFinite(p.x) || !Number.isFinite(p.y)) return false;
  const x = Math.floor(p.x), y = Math.floor(p.y);
  if (y < YB[r] + 1 || y > YB[r + 1] - 1) return false;
  return x >= xc(c, y) + 1 && x <= xc(c + 1, y) - 1;
}

const formatoOk = (v) =>
  v && Array.isArray(v.pista) && v.pista.length === 5 && v.pista.every((s) => typeof s === "string" && /^[01]{5}$/.test(s)) &&
  Number.isInteger(v.minimo) && Number.isInteger(v.limite);

export default async function verifica(t) {
  const semePrincipale = t.seme;

  // ── 1. Su sei semi la variante rispetta i vincoli: si spegne, minimo 9..13, limite = minimo + 6, 9..16 accese ──
  for (const seme of [1, 2, 3, 4, 5, 6]) {
    const v = await t.nuova(seme);
    if (!t.controlla(formatoOk(v), `seme ${seme}: variante nel formato { pista: 5 righe di 0/1, minimo, limite }`)) continue;
    const p = daRighe(v.pista);
    const s = risolvi(p);
    const accese = peso(p);
    t.controlla(
      s && s.minimo === v.minimo && v.minimo >= 9 && v.minimo <= 13 && v.limite === v.minimo + 6 && accese >= 9 && accese <= 16,
      `seme ${seme}: pista ${v.pista.join(" ")} · si spegne: ${s ? "sì" : "no"} · minimo ${s ? s.minimo : "-"} (dichiarato ${v.minimo}) · limite ${v.limite} · accese ${accese}`,
    );
    const rif = generaRiferimento(seme);
    if (!uguali(rif, v)) t.log(`(nota) seme ${seme}: la variante non coincide con il generatore delle istruzioni (atteso ${rif && rif.pista.join(" ")})`);
  }

  // ── Partita principale ──
  const v = await t.nuova(semePrincipale);
  const iniziale = daRighe(v.pista);
  const sol = risolvi(iniziale);
  if (!t.controlla(sol, `seme ${semePrincipale}: la pista principale si spegne`)) return;
  const L = v.limite;
  const statoGioco = () => t.chiama("statoGioco");
  t.log(`pista ${v.pista.join(" ")} · minimo ${sol.minimo} · limite ${L} · una soluzione: ${piastrelle(sol.migliore).map((i) => `(${Math.floor(i / 5)},${i % 5})`).join(" ")}`);

  let sg = await statoGioco();
  t.controlla(sg && sg.passi === 0 && sg.limite === L && uguali(sg.pista, v.pista) && sg.risolto === false && sg.accese === peso(iniziale),
    "all'inizio la pista è quella della variante, con 0 passi");

  // ── 3. Mosse impossibili: rifiutate, nessun passo, nessun errore ──
  let tutteRifiutate = true;
  for (const m of [{ r: 5, c: 0 }, { r: -1, c: 2 }, { r: 1.5, c: 2 }, { r: "2", c: 2 }, { c: 3 }, {}]) {
    const esito = await t.gioca(m);
    if (!esito || esito.valida !== false) { tutteRifiutate = false; t.log("mossa impossibile non rifiutata:", JSON.stringify(m), JSON.stringify(esito)); }
  }
  let esito = await t.gioca({ ricomincia: true });
  if (!esito || esito.valida !== false) { tutteRifiutate = false; t.log("Ricomincia a 0 passi non rifiutato:", JSON.stringify(esito)); }
  sg = await statoGioco();
  let st = await t.stato();
  t.controlla(tutteRifiutate && st.errori === 0 && sg.passi === 0 && uguali(sg.pista, v.pista) && !sg.conferma,
    "fuori dalla pista, valori sbagliati e Ricomincia a 0 passi: rifiutati, senza passi né errori");

  // ── 5. Interfaccia vera: un clic fuori dalla pista non fa niente, un clic su una piastrella la pesta ──
  await t.clicScena(30, 40);
  sg = await statoGioco();
  t.controlla(sg.passi === 0 && uguali(sg.pista, v.pista), "un clic sul muro, fuori dalla pista, non conta come passo");
  const pos = await t.chiama("posizione", 1, 3);
  t.controlla(dentro(1, 3, pos), `posizione(1, 3) = ${JSON.stringify(pos)} cade dentro la piastrella in riga 1, colonna 3`);
  await t.clicScena(pos.x, pos.y);
  sg = await statoGioco();
  t.controlla(sg.passi === 1 && uguali(sg.pista, inRighe(iniziale ^ CROCE[8])), "il clic sulla scena pesta la piastrella (1, 3): cambiano lei e le quattro vicine");
  await t.foto("primo-passo");

  // ── Ricomincia dal bottone: il primo tocco chiede conferma, il secondo è un errore e riaccende la pista ──
  await t.bottone("ricomincia");
  sg = await statoGioco();
  st = await t.stato();
  t.controlla(sg.conferma === true && sg.passi === 1 && st.errori === 0, "il primo tocco su Ricomincia chiede conferma e non conta come errore");
  await t.bottone("ricomincia");
  sg = await statoGioco();
  st = await t.stato();
  t.controlla(st.errori === 1 && sg.passi === 0 && uguali(sg.pista, v.pista) && !sg.conferma && !st.risolto,
    "il secondo tocco su Ricomincia conta come passi finiti: un errore, pista com'era all'inizio, passi a zero");

  // ── 2 e 6. Limite: pestando sempre la stessa piastrella la pista non si spegne mai; all'ultimo passo il DJ se ne accorge ──
  let percorsoOk = true;
  for (let k = 1; k < L; k++) {
    esito = await t.gioca({ r: 0, c: 0 });
    if (!esito || !esito.ok || esito.passi !== k) { percorsoOk = false; t.log(`passo ${k}:`, JSON.stringify(esito)); break; }
  }
  sg = await statoGioco();
  st = await t.stato();
  t.controlla(percorsoOk && sg.passi === L - 1 && st.errori === 1, `fino a ${L - 1} passi su ${L} nessun errore`);
  esito = await t.gioca({ r: 0, c: 0 });
  sg = await statoGioco();
  st = await t.stato();
  t.controlla(esito && esito.errore === true && st.errori === 2 && !st.risolto && sg.passi === 0 && uguali(sg.pista, v.pista),
    `il passo numero ${L} senza pista spenta è un errore: la pista torna com'era e i passi ripartono da zero`);
  t.controlla(st.dorateInPalio === 3, `dopo due errori le dorate in palio sono ${st.dorateInPalio} (attese 3)`);
  await t.foto("passi-finiti");

  // ── La partita resta salvata ricaricando la pagina ──
  const tutte = piastrelle(sol.migliore);
  for (const i of tutte.slice(0, 2)) await t.gioca({ r: Math.floor(i / 5), c: i % 5 });
  await t.ricarica();
  await t.chiudiCarte();
  sg = await statoGioco();
  const attesa = inRighe(iniziale ^ CROCE[tutte[0]] ^ CROCE[tutte[1]]);
  t.controlla(sg.passi === 2 && uguali(sg.pista, attesa), "ricaricando la pagina la pista e i passi fatti restano (niente ripartenza gratis)");

  // ── 4. La soluzione più corta del risolutore spegne la pista ──
  let prima = true;
  for (const [k, i] of tutte.slice(2).entries()) {
    esito = await t.gioca({ r: Math.floor(i / 5), c: i % 5 });
    const ultimo = k === tutte.length - 3;
    if (!ultimo && (!esito || !esito.ok)) { prima = false; t.log(`passo ${k + 3}:`, JSON.stringify(esito)); }
  }
  sg = await statoGioco();
  st = await t.stato();
  t.controlla(prima && esito && esito.risolto === true && esito.passi === sol.minimo, `la soluzione più corta (${sol.minimo} passi) spegne la pista`);
  t.controlla(st.risolto && st.errori === 2 && sg.risolto === true && uguali(sg.pista, inRighe(0)), "il rompicapo risulta risolto, con i due errori di prima");
  await t.aspetta(300);
  await t.foto("pista-spenta");
  await t.aspetta(1800);
}
