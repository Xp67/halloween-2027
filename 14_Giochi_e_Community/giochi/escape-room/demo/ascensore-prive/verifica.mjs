// Verifica dell'ascensore del privé. Non usa il codice della demo: ricava la soluzione dalla variante con un
// risolutore suo (ricerca in ampiezza sugli stati «scheletri e zombie di sotto + piano della cabina»).
//
// Le regole sono quelle di ISTRUZIONI.md: la cabina porta al massimo `capienza` mostri e non parte vuota; a ogni
// corsa si controllano la cabina in viaggio, il piano che lascia e il piano dove arriva (dopo che sono scesi tutti);
// se in uno di questi posti ci sono scheletri e gli zombie sono di più, è un errore e la corsa si annulla.

// I numeri di mostri che la demo può dare oggi. Il 4 si aggiunge solo quando nel catalogo l'indizio 2 sarà riscritto
// (vedi ISTRUZIONI.md, «Variante»); il risolutore sa già risolvere anche quello.
const NUMERI_ATTIVI = [5];
const ACCESSORI = ["cilindro", "festa", "fiore", "papillon", "occhiali"];
const CAMICIE = ["grigia", "viola", "arancio", "blu", "senape"];

/** Un posto è sicuro se non ci sono scheletri o se gli zombie non sono di più. */
const sicuro = (s, z) => s === 0 || z <= s;

/** I carichi che possono viaggiare: da 1 a K mostri, con la cabina stessa sicura. */
function carichi(K) {
  const r = [];
  for (let s = 0; s <= K; s++) for (let z = 0; z <= K - s; z++) if (s + z >= 1 && sicuro(s, z)) r.push({ s, z });
  return r;
}

/**
 * Ricerca in ampiezza: da tutti di sotto (cabina di sotto) a tutti di sopra.
 * Ritorna { minimo, corse: [{ s, z }, ...] } con una soluzione più corta, o null se non c'è.
 */
export function risolvi(S, Z, K) {
  const chiave = (s, z, p) => `${s},${z},${p}`;
  const inizio = chiave(S, Z, 0);
  const fine = chiave(0, 0, 1);
  const da = new Map([[inizio, null]]);
  let coda = [[S, Z, 0]];
  while (coda.length && !da.has(fine)) {
    const nuova = [];
    for (const [s, z, p] of coda) {
      for (const c of carichi(K)) {
        let ns, nz;
        if (p === 0) {
          if (c.s > s || c.z > z) continue;
          ns = s - c.s;
          nz = z - c.z;
        } else {
          if (c.s > S - s || c.z > Z - z) continue;
          ns = s + c.s;
          nz = z + c.z;
        }
        if (!sicuro(ns, nz) || !sicuro(S - ns, Z - nz)) continue;
        const k = chiave(ns, nz, 1 - p);
        if (da.has(k)) continue;
        da.set(k, { prima: chiave(s, z, p), carico: c });
        nuova.push([ns, nz, 1 - p]);
      }
    }
    coda = nuova;
  }
  if (!da.has(fine)) return null;
  const corse = [];
  for (let k = fine; da.get(k); k = da.get(k).prima) corse.unshift(da.get(k).carico);
  return { minimo: corse.length, corse };
}

/** Simula una sequenza di corse con le regole delle istruzioni: dove si rompe, o null se arriva in fondo valida. */
export function simula(S, Z, K, corse) {
  let s = S, z = Z, p = 0;
  for (let i = 0; i < corse.length; i++) {
    const c = corse[i];
    if (c.s + c.z < 1 || c.s + c.z > K) return { corsa: i + 1, motivo: "carico non valido" };
    if (p === 0 ? c.s > s || c.z > z : c.s > S - s || c.z > Z - z) return { corsa: i + 1, motivo: "mostri che non ci sono" };
    if (!sicuro(c.s, c.z)) return { corsa: i + 1, motivo: "cabina" };
    const ns = p === 0 ? s - c.s : s + c.s;
    const nz = p === 0 ? z - c.z : z + c.z;
    if (!sicuro(ns, nz) || !sicuro(S - ns, Z - nz)) return { corsa: i + 1, motivo: "piano" };
    s = ns; z = nz; p = 1 - p;
  }
  return s === 0 && z === 0 && p === 1 ? null : { corsa: corse.length, motivo: "non sono tutti di sopra" };
}

const pari = (a, b) => a && b && a.s === b.s && a.z === b.z;
const conta = (o) => (o ? `${o.s}S ${o.z}Z` : "?");

export default async function verifica(t) {
  // Aspetta che finisca l'animazione di una corsa (durante la corsa i tocchi sono ignorati).
  const libera = async (massimo = 4000) => {
    for (let ms = 0; ms < massimo; ms += 100) {
      if (!(await t.chiama("occupato"))) return true;
      await t.aspetta(100);
    }
    return false;
  };

  // ── 1. Le varianti: forma giusta, risolvibili, minimo giusto ──
  const viste = new Set();
  let v = null;
  for (const seme of [1, 2, 3, 4, 5, 6]) {
    v = await t.nuova(seme);
    const N = v && v.scheletri;
    const okForma = v && NUMERI_ATTIVI.includes(N) && v.zombie === N && v.capienza === 3;
    const okAcc = v && Array.isArray(v.accessori) && v.accessori.length === N && new Set(v.accessori).size === N &&
      v.accessori.every((a) => ACCESSORI.includes(a));
    const okCam = v && Array.isArray(v.camicie) && v.camicie.length === N && new Set(v.camicie).size === N &&
      v.camicie.every((c) => CAMICIE.includes(c));
    const r = okForma ? risolvi(N, N, 3) : null;
    t.controlla(okForma && okAcc && okCam && r && r.minimo === v.minimo,
      `seme ${seme}: ${N} scheletri e ${v && v.zombie} zombie, cabina da ${v && v.capienza}, minimo ${v && v.minimo} corse ` +
      `(risolutore: ${r ? r.minimo : "nessuna soluzione"})`);
    const sg = await t.chiama("statoGioco");
    t.controlla(sg && sg.piano === "sotto" && pari(sg.sotto, { s: N, z: N }) && pari(sg.sopra, { s: 0, z: 0 }) &&
      pari(sg.cabina, { s: 0, z: 0 }) && sg.corse === 0 && sg.capienza === 3,
    `seme ${seme}: all'inizio sono tutti al piano terra con la cabina vuota`);
    viste.add(JSON.stringify(v));
  }
  t.controlla(viste.size >= 2, `semi diversi danno varianti diverse (${viste.size} diverse su 6)`);
  await t.foto("inizio");

  // ── 2. Errori tipici: contano, non risolvono, la corsa si annulla ──
  const N = v.scheletri;
  let r = await t.gioca({ corsa: { s: 1, z: 2 } });
  let s = await t.stato();
  let sg = await t.chiama("statoGioco");
  t.controlla(r && r.errore && r.dove === "cabina" && s.errori === 1 && !s.risolto,
    `1 scheletro e 2 zombie in cabina: errore «cabina» (esito ${JSON.stringify(r)})`);
  t.controlla(sg.piano === "sotto" && sg.corse === 0 && pari(sg.cabina, { s: 1, z: 2 }) && pari(sg.sotto, { s: N - 1, z: N - 2 }),
    `dopo l'errore la cabina torna al piano terra con gli stessi passeggeri (cabina ${conta(sg.cabina)}, piano ${conta(sg.sotto)})`);
  await t.aspetta(1000);
  await t.foto("errore");

  r = await t.gioca({ corsa: { s: 2, z: 0 } });
  s = await t.stato();
  t.controlla(r && r.errore && r.dove === "sotto" && s.errori === 2 && s.dorateInPalio === 3,
    `2 scheletri che lasciano 3 scheletri con 5 zombie: errore «sotto», dorate in palio 3 (esito ${JSON.stringify(r)})`);

  r = await t.gioca({ corsa: { s: 0, z: 3 } });
  const r2 = await t.gioca({ corsa: { s: 0, z: 1 } });
  t.controlla(r && r.ok && r2 && r2.ok && r2.corse === 2, `due corse buone (3 zombie su, 1 zombie giù): ${JSON.stringify(r)} ${JSON.stringify(r2)}`);
  r = await t.gioca({ corsa: { s: 1, z: 0 } });
  s = await t.stato();
  sg = await t.chiama("statoGioco");
  t.controlla(r && r.errore && r.dove === "sopra" && s.errori === 3 && !s.risolto,
    `1 scheletro che arriva al privé fra 2 zombie: errore «sopra» (esito ${JSON.stringify(r)})`);
  t.controlla(sg.piano === "sotto" && sg.corse === 2 && pari(sg.cabina, { s: 1, z: 0 }) && pari(sg.sopra, { s: 0, z: 2 }),
    `la corsa sbagliata non conta (corse ${sg.corse}, privé ${conta(sg.sopra)})`);

  // ── 3. Mosse impossibili: rifiutate, non contano come errore ──
  r = await t.gioca({ scendi: "s" });
  t.controlla(r && r.ok && pari(r.cabina, { s: 0, z: 0 }), "lo scheletro scende dalla cabina");
  r = await t.gioca({ parti: true });
  t.controlla(r && r.valida === false && r.motivo === "vuota", `la cabina vuota non parte (esito ${JSON.stringify(r)})`);
  r = await t.gioca({ corsa: { s: 2, z: 2 } });
  t.controlla(r && r.valida === false && r.motivo === "piena", `quattro mostri non ci stanno (esito ${JSON.stringify(r)})`);
  for (const tipo of ["s", "s", "z"]) await t.gioca({ sali: tipo });
  r = await t.gioca({ sali: "z" });
  t.controlla(r && r.valida === false && r.motivo === "piena", `il quarto passeggero viene rifiutato (esito ${JSON.stringify(r)})`);
  for (const tipo of ["s", "s", "z"]) await t.gioca({ scendi: tipo });
  sg = await t.chiama("statoGioco");
  const lassu = Object.keys(sg.dove).find((id) => sg.dove[id] === "sopra");
  r = await t.gioca({ sali: lassu });
  t.controlla(r && r.valida === false && r.motivo === "altro piano",
    `${lassu} è al privé e la cabina al piano terra: rifiutato (esito ${JSON.stringify(r)})`);
  s = await t.stato();
  sg = await t.chiama("statoGioco");
  t.controlla(s.errori === 3 && s.dorateInPalio === 3 && sg.corse === 2 && pari(sg.cabina, { s: 0, z: 0 }),
    `le mosse impossibili non hanno contato (errori ${s.errori}, corse ${sg.corse})`);

  // ── 4. Una pagina pulita: prima corsa dall'interfaccia vera, poi la soluzione del risolutore ──
  v = await t.nuova(7);
  const sol = risolvi(v.scheletri, v.zombie, v.capienza);
  t.controlla(sol && simula(v.scheletri, v.zombie, v.capienza, sol.corse) === null && sol.minimo === v.minimo,
    `soluzione del risolutore in ${sol && sol.minimo} corse: ${sol && sol.corse.map((c) => `${c.s}S${c.z}Z`).join(" ")}`);

  // la prima corsa con i tocchi: si fanno salire i mostri toccandoli, uno ne scende e risale, poi «Parti»
  const prima = sol.corse[0];
  const daFar = [...Array(prima.s).keys()].map((i) => `s${i}`).concat([...Array(prima.z).keys()].map((i) => `z${i}`));
  for (const id of daFar) {
    const pos = await t.chiama("posizione", id);
    await t.clicScena(pos.x, pos.y);
    await t.aspetta(250);
  }
  sg = await t.chiama("statoGioco");
  t.controlla(pari(sg.cabina, prima), `toccando i mostri salgono in cabina (${conta(sg.cabina)}, servivano ${conta(prima)})`);
  let pos = await t.chiama("posizione", daFar[0]);
  await t.clicScena(pos.x, pos.y);
  await t.aspetta(250);
  sg = await t.chiama("statoGioco");
  const scesoOk = sg.dove[daFar[0]] === "sotto" && sg.cabina.s + sg.cabina.z === prima.s + prima.z - 1;
  pos = await t.chiama("posizione", daFar[0]);
  await t.clicScena(pos.x, pos.y);
  await t.aspetta(250);
  sg = await t.chiama("statoGioco");
  t.controlla(scesoOk && pari(sg.cabina, prima), `toccando un passeggero scende, toccandolo di nuovo risale`);
  await t.foto("cabina");
  await t.bottone("parti");
  await t.aspetta(150);
  t.controlla(await t.chiama("occupato"), "durante la corsa la demo è occupata");
  t.controlla(await libera(), "la corsa finisce entro 4 secondi");
  sg = await t.chiama("statoGioco");
  t.controlla(sg.corse === 1 && sg.piano === "sopra" && pari(sg.sopra, prima) && pari(sg.cabina, { s: 0, z: 0 }),
    `il bottone Parti fa la corsa e all'arrivo scendono tutti (privé ${conta(sg.sopra)})`);

  // nessun limite di corse: avanti e indietro con lo stesso carico, fino a 13 corse
  let tutteOk = true;
  for (let i = 0; i < 6; i++) {
    const a = await t.gioca({ corsa: prima });
    const b = await t.gioca({ corsa: prima });
    tutteOk = tutteOk && a && a.ok && b && b.ok;
  }
  sg = await t.chiama("statoGioco");
  s = await t.stato();
  t.controlla(tutteOk && sg.corse === 13 && s.errori === 0 && !s.risolto, `nessun limite: 13 corse senza errori (corse ${sg.corse})`);

  // Ricomincia riporta tutti di sotto, senza errori
  await t.bottone("ricomincia");
  await t.aspetta(200);
  sg = await t.chiama("statoGioco");
  s = await t.stato();
  t.controlla(sg.corse === 0 && sg.piano === "sotto" && pari(sg.sotto, { s: v.scheletri, z: v.zombie }) && s.errori === 0,
    "Ricomincia: tutti di nuovo al piano terra, corse a zero, nessun errore");

  // la soluzione completa
  let ultimo = null;
  let buone = true;
  for (let i = 0; i < sol.corse.length; i++) {
    ultimo = await t.gioca({ corsa: sol.corse[i] });
    if (i < sol.corse.length - 1 && !(ultimo && ultimo.ok)) {
      buone = false;
      t.log(`corsa ${i + 1} (${conta(sol.corse[i])}) rifiutata: ${JSON.stringify(ultimo)}`);
    }
  }
  s = await t.stato();
  sg = await t.chiama("statoGioco");
  t.controlla(buone && ultimo && ultimo.risolto && ultimo.corse === sol.minimo,
    `la soluzione del risolutore risolve il rompicapo all'ultima corsa (esito ${JSON.stringify(ultimo)})`);
  t.controlla(s.risolto && s.errori === 0 && s.guadagnate === 4, `risolto senza errori: ${s.guadagnate} dorate guadagnate`);
  t.controlla(sg.piano === "sopra" && pari(sg.sopra, { s: v.scheletri, z: v.zombie }), "alla fine sono tutti al privé");
  await t.aspetta(1200);
  await t.foto("festa");
  await t.aspetta(800);
}
