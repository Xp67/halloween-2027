// Verifica del lucchetto delle lapidi. Non usa il codice della demo: ha un suo modello del lucchetto cattivo
// (stessa regola delle istruzioni) e gioca con la strategia di Knuth, leggendo le risposte dalla demo.
//
// Codici: 4 rotelle, ognuna con un indice 0..5 nell'elenco variante.simboli. Le 1296 combinazioni sono numerate
// c = a·216 + b·36 + c·6 + d. Una risposta è la coppia (nere, bianche), scritta come stringa "n-b".

const DISEGNI = ["teschio", "croce", "luna", "pipistrello", "ragno", "fantasma", "occhio", "pozione"];
const RISPOSTE = ["0-0", "0-1", "0-2", "0-3", "0-4", "1-0", "1-1", "1-2", "1-3", "2-0", "2-1", "2-2", "3-0"];
const TENTATIVI = 6;

const CODICI = [];
for (let i = 0; i < 1296; i++) CODICI.push([Math.floor(i / 216), Math.floor(i / 36) % 6, Math.floor(i / 6) % 6, i % 6]);
const indice = (c) => c[0] * 216 + c[1] * 36 + c[2] * 6 + c[3];

/** Le candele fra un tentativo `a` e una combinazione `b`: [nere, bianche]. */
function risposta(a, b) {
  let nere = 0;
  const ca = [0, 0, 0, 0, 0, 0], cb = [0, 0, 0, 0, 0, 0];
  for (let i = 0; i < 4; i++) {
    if (a[i] === b[i]) nere++;
    else { ca[a[i]]++; cb[b[i]]++; }
  }
  let bianche = 0;
  for (let s = 0; s < 6; s++) bianche += Math.min(ca[s], cb[s]);
  return [nere, bianche];
}

// Tabella delle risposte (nere·5 + bianche) fra ogni coppia di combinazioni: si calcola una volta sola.
let TAB = null;
function tabella() {
  if (TAB) return TAB;
  TAB = new Uint8Array(1296 * 1296);
  for (let i = 0; i < 1296; i++)
    for (let j = 0; j < 1296; j++) {
      const [n, b] = risposta(CODICI[i], CODICI[j]);
      TAB[i * 1296 + j] = n * 5 + b;
    }
  return TAB;
}
const chiave = (k) => `${Math.floor(k / 5)}-${k % 5}`;

/** Le combinazioni ancora vive: danno le stesse candele a tutti i tentativi del giro. */
function vive(tentativi) {
  const R = tabella();
  const out = [];
  for (let c = 0; c < 1296; c++)
    if (tentativi.every((t) => R[indice(t.codice) * 1296 + c] === t.nere * 5 + t.bianche)) out.push(c);
  return out;
}

/** Quante combinazioni vive darebbero ogni risposta al tentativo g. */
function gruppi(S, g) {
  const R = tabella();
  const m = new Map();
  for (const c of S) {
    const k = chiave(R[g * 1296 + c]);
    m.set(k, (m.get(k) || 0) + 1);
  }
  return m;
}

/**
 * La risposta del lucchetto cattivo (regola delle istruzioni): 4 nere solo se l'unica viva è proprio il tentativo;
 * altrimenti la risposta (diversa da 4 nere) col gruppo più grande, a parità la prima in `preferenze`.
 */
function attesa(S, g, preferenze) {
  if (S.length === 1 && S[0] === g) return { nere: 4, bianche: 0 };
  const m = gruppi(S, g);
  let meglio = null;
  for (const r of preferenze) {
    const n = m.get(r) || 0;
    if (n > 0 && (meglio === null || n > m.get(meglio))) meglio = r;
  }
  const [nere, bianche] = meglio.split("-").map(Number);
  return { nere, bianche };
}

/** Strategia di Knuth: il tentativo il cui caso peggiore lascia meno vive; a parità una viva, poi l'indice più basso. */
function knuth(S) {
  if (S.length === 1) return S[0];
  const R = tabella();
  const dentro = new Set(S);
  const conta = new Uint16Array(25);
  let migliore = -1, peggio = Infinity, inVive = false;
  for (let g = 0; g < 1296; g++) {
    conta.fill(0);
    let mx = 0;
    for (const c of S) {
      const k = R[g * 1296 + c];
      conta[k]++;
      if (conta[k] > mx) mx = conta[k];
    }
    const v = dentro.has(g);
    if (mx < peggio || (mx === peggio && v && !inVive)) { peggio = mx; migliore = g; inVive = v; }
  }
  return migliore;
}

/** Una partita intera contro il modello (senza la demo): quanti tentativi servono a Knuth aprendo con AABB. */
function partitaModello(preferenze) {
  const tent = [];
  for (let n = 1; n <= 10; n++) {
    const S = vive(tent);
    const g = n === 1 ? indice([0, 0, 1, 1]) : knuth(S);
    const r = attesa(S, g, preferenze);
    tent.push({ codice: CODICI[g], nere: r.nere, bianche: r.bianche });
    if (r.nere === 4) return n;
  }
  return Infinity;
}

const uguali = (a, b) => JSON.stringify(a) === JSON.stringify(b);

export default async function verifica(t) {
  tabella();

  // ── 1. Varianti: simboli e spareggio validi, e Knuth apre sempre entro i 6 tentativi ──
  for (const seme of [1, 2, 3, 42, 777, 2027]) {
    const v = await t.nuova(seme);
    const simboliOk = Array.isArray(v?.simboli) && v.simboli.length === 6 && new Set(v.simboli).size === 6
      && v.simboli.every((s) => DISEGNI.includes(s));
    const prefOk = Array.isArray(v?.preferenze) && v.preferenze.length === 13 && new Set(v.preferenze).size === 13
      && v.preferenze.every((r) => RISPOSTE.includes(r));
    const n = simboliOk && prefOk ? partitaModello(v.preferenze) : Infinity;
    t.controlla(simboliOk && prefOk && n <= 5,
      `seme ${seme}: 6 simboli diversi fra gli 8 disegni (${v?.simboli?.join(", ")}), spareggio valido, Knuth apre in ${n} tentativi`);
    const s0 = await t.chiama("statoGioco");
    t.controlla(uguali(s0.rotelle, [0, 0, 0, 0]) && s0.tentativi.length === 0 && s0.rimasti === TENTATIVI && s0.giro === 1 && s0.aperto === false,
      `seme ${seme}: si parte con le rotelle a 0, nessun tentativo, 6 rimasti, giro 1`);
  }

  // ── Partita principale ──
  const v = await t.nuova(31337);
  const pref = v.preferenze;
  t.log(`seme 31337: simboli ${v.simboli.join(", ")}`);

  // Confronta ogni risposta della demo col modello: mai una bugia, sempre il gruppo più grande, spareggio giusto.
  const problemi = { bugia: [], gruppo: [], spareggio: [] };
  function confronta(tentativi, g, esito, dove) {
    const S = vive(tentativi);
    const m = gruppi(S, g);
    const k = `${esito.nere}-${esito.bianche}`;
    const att = attesa(S, g, pref);
    if (!(m.get(k) > 0)) problemi.bugia.push(`${dove}: ${k} non è giusta per nessuna combinazione viva`);
    else {
      const maxNo4 = Math.max(0, ...[...m].filter(([r]) => r !== "4-0").map(([, n]) => n));
      const atteso4 = S.length === 1 && S[0] === g;
      if (k === "4-0" ? !atteso4 : m.get(k) !== maxNo4)
        problemi.gruppo.push(`${dove}: ${k} lascia ${m.get(k)} vive, il massimo era ${atteso4 ? "4 nere (unica viva)" : maxNo4}`);
      else if (k !== `${att.nere}-${att.bianche}`)
        problemi.spareggio.push(`${dove}: ${k} invece di ${att.nere}-${att.bianche} (a parità vale l'ordine di preferenze)`);
    }
  }

  // ── 2. Mosse impossibili: rifiutate, nessun errore, nessun tentativo consumato ──
  const r1 = await t.gioca({ tipo: "prova", codice: [0, 0, 9, 1] });
  const r2 = await t.gioca({ tipo: "rotella", rotella: 4, verso: 1 });
  const r3 = await t.gioca({ tipo: "rotella", rotella: 1, verso: 2 });
  const r4 = await t.gioca({ tipo: "spingi" });
  let st = await t.stato();
  let sg = await t.chiama("statoGioco");
  t.controlla([r1, r2, r3, r4].every((r) => r && r.valida === false) && st.errori === 0 && sg.tentativi.length === 0,
    "simbolo, rotella, verso e mossa inesistenti vengono rifiutati senza errori né tentativi consumati");

  // ── 3. Interfaccia vera: clic sulle frecce delle rotelle, poi il bottone Prova ──
  const su0 = await t.chiama("posizione", 0, -1);
  await t.clicScena(su0.x, su0.y);
  sg = await t.chiama("statoGioco");
  const giro = sg.rotelle[0] === 5;
  const giu0 = await t.chiama("posizione", 0, 1);
  await t.clicScena(giu0.x, giu0.y);
  for (const i of [2, 3]) {
    const p = await t.chiama("posizione", i, 1);
    await t.clicScena(p.x, p.y);
  }
  sg = await t.chiama("statoGioco");
  t.controlla(giro && uguali(sg.rotelle, [0, 0, 1, 1]),
    `i clic sulle frecce girano le rotelle (freccia su dal primo simbolo → l'ultimo; ora ${JSON.stringify(sg.rotelle)})`);
  await t.bottone("prova");
  await t.aspetta(150);
  sg = await t.chiama("statoGioco");
  const primo = sg.tentativi[0];
  t.controlla(sg.tentativi.length === 1 && uguali(primo?.codice, [0, 0, 1, 1]) && sg.rimasti === 5,
    "il bottone Prova manda la combinazione delle rotelle e consuma un tentativo");
  if (primo) confronta([], indice([0, 0, 1, 1]), primo, "giro 1, tentativo 1");
  await t.aspetta(1500);
  await t.foto("primo-tentativo");

  // ── 4. Combinazione già provata nel giro: rifiutata, non è un errore ──
  const rip = await t.gioca({ tipo: "prova", codice: [0, 0, 1, 1] });
  st = await t.stato();
  sg = await t.chiama("statoGioco");
  t.controlla(rip.valida === false && st.errori === 0 && sg.tentativi.length === 1,
    "riprovare una combinazione già provata nel giro viene rifiutato senza errore");

  // ── 5. Ricaricando la pagina i tentativi restano (niente tentativi gratis) ──
  await t.ricarica();
  await t.chiudiCarte();
  const dopo = await t.chiama("statoGioco");
  t.controlla(uguali(dopo.tentativi, sg.tentativi) && dopo.rimasti === 5 && dopo.giro === 1,
    "ricaricando la pagina il tentativo fatto resta sulla lapide");

  // ── 6. Finire i sei tentativi senza aprire: un errore, lucchetto azzerato ──
  // Gioca combinazioni che non sono vive: così il lucchetto non può mai dire 4 nere.
  let tent = dopo.tentativi.map((x) => ({ codice: x.codice, nere: x.nere, bianche: x.bianche }));
  let esitoUltimo = null;
  for (let n = 2; n <= TENTATIVI; n++) {
    const S = new Set(vive(tent));
    const provati = new Set(tent.map((x) => indice(x.codice)));
    let g = 0;
    while (S.has(g) || provati.has(g)) g++;
    if (n === TENTATIVI) { await t.aspetta(400); await t.foto("ultimo-tentativo"); }
    const e = await t.gioca({ tipo: "prova", codice: CODICI[g] });
    if (e && typeof e.nere === "number") confronta(tent, g, e, `giro 1, tentativo ${n}`);
    tent.push({ codice: CODICI[g], nere: e?.nere, bianche: e?.bianche });
    if (n < TENTATIVI) {
      if (!(e && e.ok === true && e.tentativo === n && e.rimasti === TENTATIVI - n))
        t.controlla(false, `il tentativo ${n} doveva dare { ok: true, tentativo: ${n}, rimasti: ${TENTATIVI - n} }, invece ${JSON.stringify(e)}`);
    } else esitoUltimo = e;
  }
  st = await t.stato();
  sg = await t.chiama("statoGioco");
  t.controlla(esitoUltimo && esitoUltimo.errore === true && st.errori === 1 && !st.risolto,
    `il sesto tentativo sbagliato è un errore e non apre (esito ${JSON.stringify(esitoUltimo)})`);
  t.controlla(sg.tentativi.length === 0 && sg.rimasti === TENTATIVI && sg.giro === 2 && st.dorateInPalio === 4,
    "dopo l'errore il lucchetto si azzera: lapidi vuote, 6 tentativi, giro 2, ancora 4 dorate in palio");
  await t.aspetta(2600);
  await t.foto("azzerato");

  // ── 7. La soluzione: Knuth contro la demo, leggendo le sue risposte ──
  tent = [];
  let aperto = false, usati = 0;
  for (let n = 1; n <= TENTATIVI && !aperto; n++) {
    const S = vive(tent);
    const g = n === 1 ? indice([0, 0, 1, 1]) : knuth(S);
    const e = await t.gioca({ tipo: "prova", codice: CODICI[g] });
    usati = n;
    if (!(e && typeof e.nere === "number")) {
      t.controlla(false, `giro 2, tentativo ${n}: esito senza candele ${JSON.stringify(e)}`);
      break;
    }
    confronta(tent, g, e, `giro 2, tentativo ${n}`);
    tent.push({ codice: CODICI[g], nere: e.nere, bianche: e.bianche });
    if (e.risolto) aperto = true;
  }
  st = await t.stato();
  sg = await t.chiama("statoGioco");
  t.controlla(aperto && st.risolto && st.errori === 1 && sg.aperto === true && usati <= 5,
    `la strategia di Knuth apre il lucchetto in ${usati} tentativi (al massimo 5) e il rompicapo risulta risolto`);

  t.controlla(problemi.bugia.length === 0, "il lucchetto non mente mai: ogni risposta è giusta per almeno una combinazione viva");
  t.controlla(problemi.gruppo.length === 0, "il lucchetto risponde sempre col gruppo più grande e dice 4 nere solo quando non ha scelta");
  t.controlla(problemi.spareggio.length === 0, "a parità di gruppo il lucchetto segue l'ordine di variante.preferenze");
  for (const p of [...problemi.bugia, ...problemi.gruppo, ...problemi.spareggio].slice(0, 8)) t.log(p);
  await t.aspetta(1800);
}
