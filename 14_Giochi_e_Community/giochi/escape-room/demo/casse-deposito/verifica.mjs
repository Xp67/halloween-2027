// Verifica di «I bauli del deposito». Non usa il codice della demo: ricalcola la variante dal seme, risolve la pianta
// con una ricerca in avanti sua (spinte minime) e gioca la soluzione con t.gioca. Le esportazioni con nome servono
// solo per provare il risolutore da Node; prova.mjs usa la funzione predefinita.

// ── I livelli: copiati da ISTRUZIONI.md (stessa lista, stesso ordine) ──
export const LIVELLI = [
  { spinte: 43, pianta: ["##########", "#    #. ##", "# $#    ##", "#@$  #   #", "# $#     #", "##      ##", "##$     .#", "#      ..#", "##########"] },
  { spinte: 42, pianta: ["##########", "#.     ###", "## .  #@##", "# . # #$ #", "#    #  ##", "#  # #$  #", "##  $$   #", "## .    ##", "##########"] },
  { spinte: 44, pianta: ["##########", "##  #   ##", "#  ## $$##", "#  @$    #", "#  . #   #", "#  #. #$ #", "#  # #   #", "#  . .# ##", "##########"] },
  { spinte: 40, pianta: ["##########", "#    #@  #", "#  # $$$ #", "##  #  ###", "# .  #  ##", "# .#   $ #", "#        #", "#..   #  #", "##########"] },
  { spinte: 44, pianta: ["##########", "# . #    #", "# @$#    #", "# $$ #.  #", "#    ## ##", "#       ##", "# $##. . #", "#        #", "##########"] },
  { spinte: 41, pianta: ["##########", "###  @## #", "#  # $   #", "#  ## $$ #", "#.#   #  #", "#.  . #$ #", "#  #    ##", "# .      #", "##########"] },
  { spinte: 41, pianta: ["##########", "# #   . ##", "#.   . $ #", "###  ##  #", "### #   ##", "##@$ $$. #", "## #  #  #", "#   #    #", "##########"] },
  { spinte: 41, pianta: ["##########", "###  . # #", "#     .. #", "##$    # #", "##    ####", "#  .## # #", "# $$$    #", "# #@ #   #", "##########"] },
];
export const SPECCHI = ["nessuno", "orizzontale", "verticale", "entrambi"];

// ── La variante attesa, ricalcolata dal seme come dicono le istruzioni (stesso generatore del kit) ──
export function casuale(seme) {
  let a = seme >>> 0;
  return function () {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const intero = (rng, min, max) => min + Math.floor(rng() * (max - min + 1));
export function specchia(pianta, specchio) {
  let p = [...pianta];
  if (specchio === "orizzontale" || specchio === "entrambi") p = p.map((r) => [...r].reverse().join(""));
  if (specchio === "verticale" || specchio === "entrambi") p = p.reverse();
  return p;
}
export function varianteAttesa(seme) {
  const rng = casuale(seme);
  const i = intero(rng, 0, LIVELLI.length - 1);
  const s = intero(rng, 0, 3);
  return { livello: i + 1, specchio: SPECCHI[s], spinteMinime: LIVELLI[i].spinte, pianta: specchia(LIVELLI[i].pianta, SPECCHI[s]) };
}

// ── Lettura della pianta: # muro, spazio pavimento, $ baule, . segno, @ zucca (* e + non devono esserci) ──
export function leggiPianta(pianta) {
  const H = pianta.length, W = pianta[0].length;
  const muro = new Uint8Array(W * H), segni = [], bauli = [];
  let zucco = -1, zucche = 0, strani = 0;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const c = pianta[y][x], i = y * W + x;
    if (c === "#") muro[i] = 1;
    else if (c === ".") segni.push(i);
    else if (c === "$") bauli.push(i);
    else if (c === "@") { zucco = i; zucche++; }
    else if (c !== " ") strani++;
  }
  return { W, H, muro, segni, bauli, zucco, zucche, strani };
}

// ── Il risolutore: ricerca in ampiezza sulle spinte (stato = bauli ordinati + zona della zucca) ──
const DIREZIONI = (W) => [1, -1, W, -W];
export const NOME_DIR = (W, d) => (d === 1 ? "destra" : d === -1 ? "sinistra" : d === W ? "giu" : "su");

function zona(W, N, muro, occ, da, stamp, pila, tag) {
  let sp = 0, min = da;
  pila[sp++] = da; stamp[da] = tag;
  const D = DIREZIONI(W);
  while (sp) {
    const c = pila[--sp];
    if (c < min) min = c;
    for (let k = 0; k < 4; k++) {
      const n = c + D[k];
      if (n >= 0 && n < N && !muro[n] && !occ[n] && stamp[n] !== tag) { stamp[n] = tag; pila[sp++] = n; }
    }
  }
  return min;
}

/** Spinte minime dalla posizione data (bauli e zucca), o null. Ritorna { spinte: [{ baule, d }], stati }. */
export function risolvi({ W, H, muro, segni }, bauli, zucco, limite = 3000000) {
  const N = W * H, D = DIREZIONI(W);
  // Caselle vive: quelle da cui un baule può ancora arrivare a un segno (tirandolo all'indietro dai segni).
  const viva = new Uint8Array(N);
  const coda0 = [...segni];
  for (const s of segni) viva[s] = 1;
  while (coda0.length) {
    const c = coda0.pop();
    for (const d of D) {
      const q = c - d;
      if (!muro[q] && !muro[q - d] && !viva[q]) { viva[q] = 1; coda0.push(q); }
    }
  }
  const occ = new Uint8Array(N), stamp = new Int32Array(N), pila = new Int32Array(N);
  let tag = 0;
  const chiave = (casse, om) => { let k = 0; for (const c of casse) k = k * 128 + c; return k * 128 + om; };
  const fine = [...segni].sort((a, b) => a - b).join(",");
  const b0 = [...bauli].sort((a, b) => a - b);
  for (const c of b0) occ[c] = 1;
  const k0 = chiave(b0, zona(W, N, muro, occ, zucco, stamp, pila, ++tag));
  for (const c of b0) occ[c] = 0;
  const visti = new Set([k0]);
  const casseDi = [b0], omDi = [zucco], padre = [-1], spinta = [null];
  for (let i = 0; i < casseDi.length; i++) {
    const casse = casseDi[i];
    if (casse.join(",") === fine) {
      const spinte = [];
      for (let j = i; padre[j] >= 0; j = padre[j]) spinte.unshift(spinta[j]);
      return { spinte, stati: visti.size };
    }
    if (visti.size > limite) return null;
    for (const c of casse) occ[c] = 1;
    const t = ++tag;
    zona(W, N, muro, occ, omDi[i], stamp, pila, t);
    const mosse = [];
    for (const b of casse) for (const d of D) {
      const da = b - d, a = b + d;
      if (stamp[da] === t && !muro[a] && !occ[a] && viva[a]) mosse.push([b, d, a]);
    }
    for (const c of casse) occ[c] = 0;
    for (const [b, d, a] of mosse) {
      const nuove = casse.map((c) => (c === b ? a : c)).sort((p, q) => p - q);
      for (const c of nuove) occ[c] = 1;
      const m = zona(W, N, muro, occ, b, stamp, pila, ++tag);
      for (const c of nuove) occ[c] = 0;
      const k = chiave(nuove, m);
      if (!visti.has(k)) { visti.add(k); casseDi.push(nuove); omDi.push(b); padre.push(i); spinta.push({ baule: b, d }); }
    }
  }
  return null;
}

/** Percorso a piedi (senza spingere) da `da` ad `a`, come lista di caselle esclusa la partenza; null se non c'è. */
export function percorso({ W, H, muro }, bauli, da, a) {
  const N = W * H, D = DIREZIONI(W);
  const occ = new Uint8Array(N);
  for (const b of bauli) occ[b] = 1;
  if (muro[a] || occ[a]) return null;
  const prima = new Int32Array(N).fill(-2);
  prima[da] = -1;
  const coda = [da];
  for (let i = 0; i < coda.length; i++) {
    const c = coda[i];
    if (c === a) break;
    for (const d of D) { const n = c + d; if (!muro[n] && !occ[n] && prima[n] === -2) { prima[n] = c; coda.push(n); } }
  }
  if (prima[a] === -2) return null;
  const via = [];
  for (let c = a; c !== da; c = prima[c]) via.unshift(c);
  return via;
}

/** Dalle spinte alle mosse della demo: { vai: [x, y] } per raggiungere il baule, poi { dir }. */
export function mosseDaSpinte(liv, bauli0, zucco0, spinte) {
  const { W } = liv;
  let bauli = [...bauli0], zucco = zucco0;
  const mosse = [];
  for (const { baule, d } of spinte) {
    const dietro = baule - d;
    if (dietro !== zucco) {
      if (!percorso(liv, bauli, zucco, dietro)) throw new Error(`nessun percorso verso ${dietro}`);
      mosse.push({ vai: [dietro % W, Math.floor(dietro / W)] });
    }
    mosse.push({ dir: NOME_DIR(W, d) });
    bauli = bauli.map((b) => (b === baule ? baule + d : b));
    zucco = baule;
  }
  return mosse;
}

/** Un baule incastrato in un angolo (non su un segno): muro su un lato verticale e su uno orizzontale. */
export function inAngolo({ W, muro, segni }, b) {
  return !segni.includes(b) && (muro[b - W] || muro[b + W]) && (muro[b - 1] || muro[b + 1]);
}

/** I bauli incastrati come li segnala la demo: in un angolo, o in un quadrato 2×2 tutto pieno di muri e bauli. */
export function calcolaIncastrati({ W, H, muro, segni }, bauli) {
  const pieno = (c) => muro[c] || bauli.includes(c);
  const fuori = (c) => bauli.includes(c) && !segni.includes(c);
  const fuoriUso = new Set();
  for (const b of bauli) if (inAngolo({ W, muro, segni }, b)) fuoriUso.add(b);
  for (let y = 0; y < H - 1; y++) for (let x = 0; x < W - 1; x++) {
    const q = [y * W + x, y * W + x + 1, (y + 1) * W + x, (y + 1) * W + x + 1];
    if (q.every(pieno) && q.some(fuori)) for (const c of q) if (fuori(c)) fuoriUso.add(c);
  }
  return [...fuoriUso];
}

/** Cerca la sequenza più corta di spinte (al massimo `profondita`) che lascia un baule in un angolo. */
export function cercaIncastro(liv, bauli0, zucco0, profondita = 4) {
  const { W } = liv, D = DIREZIONI(W);
  let livello = [{ bauli: [...bauli0], zucco: zucco0, spinte: [] }];
  const visti = new Set();
  for (let p = 0; p < profondita; p++) {
    const prossimo = [];
    for (const s of livello) {
      const N = liv.W * liv.H, occ = new Uint8Array(N);
      for (const b of s.bauli) occ[b] = 1;
      for (const b of s.bauli) for (const d of D) {
        const dietro = b - d, a = b + d;
        if (liv.muro[a] || occ[a] || liv.muro[dietro] || occ[dietro]) continue;
        if (dietro !== s.zucco && !percorso(liv, s.bauli, s.zucco, dietro)) continue;
        const bauli = s.bauli.map((c) => (c === b ? a : c));
        const spinte = [...s.spinte, { baule: b, d }];
        if (inAngolo(liv, a)) return { spinte, baule: a };
        const k = [...bauli].sort((x, y) => x - y).join(",") + "|" + b;
        if (visti.has(k)) continue;
        visti.add(k);
        prossimo.push({ bauli, zucco: b, spinte });
      }
    }
    livello = prossimo;
  }
  return null;
}

// ── La verifica ──
const xy = (W, i) => [i % W, Math.floor(i / W)];
const ordina = (lista) => [...lista].sort((a, b) => a[1] - b[1] || a[0] - b[0]);
const uguali = (a, b) => JSON.stringify(a) === JSON.stringify(b);

export default async function verifica(t) {
  const semeBase = t.seme;

  // 1. Varianti: otto semi scelti per coprire tutti gli otto livelli e i quattro specchi.
  const visti = new Set();
  for (const seme of [7, 8, 12, 14, 10, 102, 20, 36]) {
    const v = await t.nuova(seme);
    const a = varianteAttesa(seme);
    const pianta = Array.isArray(v?.pianta) ? v.pianta : [];
    t.controlla(v && v.livello === a.livello && v.specchio === a.specchio && v.spinteMinime === a.spinteMinime && uguali(pianta, a.pianta),
      `seme ${seme}: variante come da istruzioni (livello ${a.livello}, specchio ${a.specchio}, ${a.spinteMinime} spinte)`);
    const liv = leggiPianta(pianta.length ? pianta : a.pianta);
    const { W, H } = liv;
    const anello = [...Array(W * H).keys()].filter((i) => i % W === 0 || i % W === W - 1 || i < W || i >= W * (H - 1));
    t.controlla(W === 10 && H === 9 && liv.bauli.length === 4 && liv.segni.length === 4 && liv.zucche === 1 && liv.strani === 0 && anello.every((i) => liv.muro[i]),
      `seme ${seme}: pianta 10×9 chiusa, 4 bauli fuori dai segni, 4 segni, una zucca`);
    const t0 = Date.now();
    const r = risolvi(liv, liv.bauli, liv.zucco);
    t.controlla(r && r.spinte.length === a.spinteMinime, `seme ${seme}: il risolutore trova ${r ? r.spinte.length : "nessuna soluzione"} spinte minime (${Date.now() - t0} ms)`);
    const sg = await t.chiama("statoGioco");
    t.controlla(sg && uguali(sg.zucco, xy(W, liv.zucco)) && uguali(ordina(sg.bauli), ordina(liv.bauli.map((i) => xy(W, i))))
      && uguali(ordina(sg.segni), ordina(liv.segni.map((i) => xy(W, i)))) && sg.spinte === 0 && sg.sulSegno === 0 && sg.risolto === false
      && sg.annullabile === false && Array.isArray(sg.incastrati) && sg.incastrati.length === 0,
    `seme ${seme}: statoGioco() iniziale coincide con la pianta`);
    visti.add(a.livello);
  }
  t.controlla(visti.size === 8, `gli otto semi mostrano tutti gli otto livelli (${visti.size})`);

  // 2. La partita vera, con il seme della prova.
  const v = await t.nuova(semeBase);
  const liv = leggiPianta(v.pianta);
  const { W, muro } = liv;
  const D = DIREZIONI(W);
  const statoG = () => t.chiama("statoGioco");
  const aIndice = ([x, y]) => y * W + x;
  const bauliDi = (sg) => sg.bauli.map(aIndice);
  const partenza = ordina(liv.bauli.map((i) => xy(W, i)));
  // I due bottoni del rompicapo: { spento, testo } letti dalla pagina (null se il bottone non c'è).
  const bottoneDi = (az) => t.pagina.evaluate((a) => {
    const b = document.querySelector(`.kit-azioni [data-azione="${a}"]`);
    return b ? { spento: b.disabled, testo: b.textContent.trim() } : null;
  }, az);
  let s = await t.stato();
  t.controlla(s.errori === 0 && !s.risolto, `seme ${semeBase}: partita nuova (livello ${v.livello}, specchio ${v.specchio})`);
  let bA = await bottoneDi("annulla"), bR = await bottoneDi("ricomincia");
  t.controlla(bA && bA.spento && bA.testo === "Annulla" && bR && bR.spento && bR.testo === "Ricomincia",
    `all'inizio «Annulla» e «Ricomincia» ci sono e sono spenti (${JSON.stringify({ bA, bR })})`);

  // 2a. Mosse impossibili: rifiutate, nessun errore, stato invariato.
  let sg = await statoG();
  const prima = JSON.stringify(sg);
  let r = await t.gioca({ vai: [0, 0] });
  s = await t.stato();
  t.controlla(r && r.valida === false && JSON.stringify(await statoG()) === prima && s.errori === 0,
    `«vai» verso un muro è rifiutato, stato invariato, nessun errore (${JSON.stringify(r)})`);
  // una casella raggiungibile accanto a un muro, poi un passo contro il muro
  let bauliOra = bauliDi(sg), zuccoOra = aIndice(sg.zucco);
  let controMuro = null;
  for (let c = 0; c < W * liv.H && !controMuro; c++) {
    if (muro[c] || bauliOra.includes(c)) continue;
    if (c !== zuccoOra && !percorso(liv, bauliOra, zuccoOra, c)) continue;
    for (const d of D) if (muro[c + d]) { controMuro = { c, d }; break; }
  }
  if (controMuro.c !== zuccoOra) await t.gioca({ vai: xy(W, controMuro.c) });
  r = await t.gioca({ dir: NOME_DIR(W, controMuro.d) });
  s = await t.stato();
  t.controlla(r && r.valida === false && s.errori === 0, `un passo contro il muro è rifiutato e non è un errore (${JSON.stringify(r)})`);
  // un baule con dietro un muro o un altro baule
  sg = await statoG();
  bauliOra = bauliDi(sg); zuccoOra = aIndice(sg.zucco);
  let bloccata = null;
  for (const b of bauliOra) for (const d of D) {
    const dietro = b - d, a = b + d;
    if (bloccata || muro[dietro] || bauliOra.includes(dietro)) continue;
    if (!(muro[a] || bauliOra.includes(a))) continue;
    if (dietro === zuccoOra || percorso(liv, bauliOra, zuccoOra, dietro)) bloccata = { dietro, d };
  }
  if (bloccata) {
    if (bloccata.dietro !== zuccoOra) await t.gioca({ vai: xy(W, bloccata.dietro) });
    const primaSpinta = await statoG();
    r = await t.gioca({ dir: NOME_DIR(W, bloccata.d) });
    const dopo = await statoG();
    s = await t.stato();
    t.controlla(r && r.valida === false && s.errori === 0 && uguali(dopo.bauli, primaSpinta.bauli) && dopo.spinte === 0,
      `spingere un baule contro un muro o un altro baule è rifiutato, non è un errore (${JSON.stringify(r)})`);
  } else t.log("(nessun baule bloccato raggiungibile nella posizione iniziale: controllo saltato)");

  // 2b. L'interfaccia vera: un clic su una casella accanto, una strisciata, un clic su una casella lontana.
  sg = await statoG();
  bauliOra = bauliDi(sg); zuccoOra = aIndice(sg.zucco);
  const libera = (c) => !muro[c] && !bauliOra.includes(c);
  let dClic = D.find((d) => libera(zuccoOra + d));
  if (dClic === undefined) { // Zucco parte chiuso fra muri e bauli (livello 2): prima la spinta obbligata della soluzione
    const sol0 = risolvi(liv, bauliOra, zuccoOra);
    for (const m of mosseDaSpinte(liv, bauliOra, zuccoOra, sol0.spinte.slice(0, 1))) await t.gioca(m);
    sg = await statoG();
    bauliOra = bauliDi(sg); zuccoOra = aIndice(sg.zucco);
    t.log(`(Zucco parte chiuso: prima una spinta obbligata, ora è in ${JSON.stringify(sg.zucco)})`);
    dClic = D.find((d) => libera(zuccoOra + d));
  }
  const meta = zuccoOra + dClic;
  let p = await t.chiama("posizione", meta % W, Math.floor(meta / W));
  await t.clicScena(p.x, p.y);
  await t.aspetta(400);
  sg = await statoG();
  t.controlla(uguali(sg.zucco, xy(W, meta)), `un clic sulla casella accanto muove Zucco (${JSON.stringify(sg.zucco)})`);
  zuccoOra = meta;
  const dStr = D.find((d) => libera(zuccoOra + d));
  p = await t.chiama("posizione", zuccoOra % W, Math.floor(zuccoOra / W));
  const vx = dStr === 1 ? 30 : dStr === -1 ? -30 : 0, vy = dStr === W ? 30 : dStr === -W ? -30 : 0;
  await t.trascinaScena(p.x, p.y, p.x + vx, p.y + vy);
  await t.aspetta(400);
  sg = await statoG();
  t.controlla(uguali(sg.zucco, xy(W, zuccoOra + dStr)), `una strisciata verso ${NOME_DIR(W, dStr)} muove Zucco di una casella (${JSON.stringify(sg.zucco)})`);
  zuccoOra += dStr;
  // la casella raggiungibile più lontana (a piedi)
  let lontana = null, lung = 0;
  for (let c = 0; c < W * liv.H; c++) {
    if (!libera(c)) continue;
    const via = percorso(liv, bauliOra, zuccoOra, c);
    if (via && via.length > lung) { lung = via.length; lontana = c; }
  }
  let fattoClicLontano = false;
  if (lung >= 3) {
    const spinte0 = sg.spinte;
    p = await t.chiama("posizione", lontana % W, Math.floor(lontana / W));
    await t.clicScena(p.x, p.y);
    await t.aspetta(600);
    sg = await statoG();
    t.controlla(uguali(sg.zucco, xy(W, lontana)) && sg.spinte === spinte0, `un clic su una casella lontana (${lung} passi) porta Zucco lì senza spingere`);
    fattoClicLontano = true;
  } else t.log(`(la zona di Zucco è piccola, ${lung} passi: il clic lontano si prova durante la soluzione)`);
  await t.foto("passeggiata");

  // 2c. Un baule spinto in un angolo: segnalato come incastrato, ma non è un errore.
  zuccoOra = aIndice(sg.zucco); bauliOra = bauliDi(sg);
  const spinteAvanti = sg.spinte;
  const inc = cercaIncastro(liv, bauliOra, zuccoOra, 4);
  let primaDellUltima = null;
  if (inc) {
    const mosse = mosseDaSpinte(liv, bauliOra, zuccoOra, inc.spinte);
    for (const [i, m] of mosse.entries()) {
      if (i === mosse.length - 1) primaDellUltima = await statoG();
      r = await t.gioca(m);
    }
    sg = await statoG();
    s = await t.stato();
    t.controlla(r && r.ok === true && r.spinta === true && r.incastrato === true, `la spinta che manda un baule in un angolo risponde incastrato: true (${JSON.stringify(r)})`);
    const attesi = ordina(calcolaIncastrati(liv, bauliDi(sg)).map((i) => xy(W, i)));
    t.controlla(sg.incastrati.some((c) => uguali(c, xy(W, inc.baule))) && uguali(ordina(sg.incastrati), attesi) && s.errori === 0 && sg.spinte === spinteAvanti + inc.spinte.length,
      `statoGioco() elenca il baule incastrato e non conta errori (${inc.spinte.length} spinte, incastrati ${JSON.stringify(sg.incastrati)})`);
    await t.aspetta(400);
    await t.foto("incastrato");
  } else t.log("(nessun angolo raggiungibile in 4 spinte: controllo dell'incastro saltato)");

  // 2d. Annulla dal bottone: torna a prima dell'ultima spinta; una seconda volta non si può.
  sg = await statoG();
  if (!primaDellUltima) { // nessun incastro giocato: fa la prossima spinta della soluzione
    const sol = risolvi(liv, bauliDi(sg), aIndice(sg.zucco));
    const mosse = mosseDaSpinte(liv, bauliDi(sg), aIndice(sg.zucco), sol.spinte.slice(0, 1));
    for (const [i, m] of mosse.entries()) { if (i === mosse.length - 1) primaDellUltima = await statoG(); await t.gioca(m); }
    sg = await statoG();
  }
  bA = await bottoneDi("annulla");
  t.controlla(sg.annullabile === true && bA && !bA.spento, "dopo una spinta si può annullare e «Annulla» è acceso");
  await t.bottone("annulla");
  await t.aspetta(300);
  sg = await statoG();
  s = await t.stato();
  const incastratiAttesi = ordina(calcolaIncastrati(liv, bauliDi(sg)).map((i) => xy(W, i)));
  t.controlla(uguali(ordina(sg.bauli), ordina(primaDellUltima.bauli)) && uguali(sg.zucco, primaDellUltima.zucco) && sg.spinte === primaDellUltima.spinte
    && uguali(ordina(sg.incastrati), incastratiAttesi) && s.errori === 0, "il bottone Annulla riporta a prima dell'ultima spinta, gratis");
  r = await t.gioca({ annulla: true });
  s = await t.stato();
  bA = await bottoneDi("annulla");
  t.controlla(r && r.valida === false && s.errori === 0 && (await statoG()).annullabile === false && bA && bA.spento,
    `si annulla solo l'ultima spinta, poi «Annulla» si spegne (${JSON.stringify(r)})`);

  // 2e. Ricaricando la pagina la partita resta com'era (niente ricominciare gratis).
  sg = await statoG();
  if (uguali(ordina(sg.bauli), partenza)) { // i bauli devono essere fuori dalla partenza, se no Ricomincia è spento
    const sol = risolvi(liv, bauliDi(sg), aIndice(sg.zucco));
    for (const m of mosseDaSpinte(liv, bauliDi(sg), aIndice(sg.zucco), sol.spinte.slice(0, 1))) await t.gioca(m);
    sg = await statoG();
  }
  await t.ricarica();
  await t.chiudiCarte();
  const dopoRicarica = await statoG();
  t.controlla(uguali(ordina(dopoRicarica.bauli), ordina(sg.bauli)) && uguali(dopoRicarica.zucco, sg.zucco) && dopoRicarica.spinte === sg.spinte
    && dopoRicarica.annullabile === sg.annullabile, `ricaricando, bauli, zucca e spinte restano com'erano (${sg.spinte} spinte)`);

  // 2f. Ricomincia dal bottone: la prima pressione chiede conferma, la seconda ricomincia e conta un errore.
  bR = await bottoneDi("ricomincia");
  t.controlla(bR && !bR.spento, "con i bauli fuori dalla partenza «Ricomincia» è acceso");
  await t.bottone("ricomincia");
  await t.aspetta(200);
  sg = await statoG();
  s = await t.stato();
  bR = await bottoneDi("ricomincia");
  t.controlla(s.errori === 0 && uguali(ordina(sg.bauli), ordina(dopoRicarica.bauli)) && bR && bR.testo === "Sicuro?",
    `la prima pressione di Ricomincia chiede solo conferma (il bottone dice «${bR && bR.testo}»)`);
  await t.bottone("ricomincia");
  await t.aspetta(400);
  sg = await statoG();
  s = await t.stato();
  bA = await bottoneDi("annulla"); bR = await bottoneDi("ricomincia");
  t.controlla(s.errori === 1 && !s.risolto && uguali(ordina(sg.bauli), partenza) && uguali(sg.zucco, xy(W, liv.zucco)) && sg.spinte === 0 && sg.annullabile === false,
    "confermando, il livello ricomincia e conta un errore");
  t.controlla(bA && bA.spento && bR && bR.spento && bR.testo === "Ricomincia", "dopo aver ricominciato i due bottoni sono di nuovo spenti");
  await t.foto("ricominciato");
  r = await t.gioca({ ricomincia: true });
  s = await t.stato();
  t.controlla(r && r.valida === false && s.errori === 1, `ricominciare quando i bauli sono già alla partenza è rifiutato (${JSON.stringify(r)})`);

  // 2g. La soluzione del risolutore, giocata con t.gioca: risolve con le spinte minime.
  sg = await statoG();
  const sol = risolvi(liv, bauliDi(sg), aIndice(sg.zucco));
  const mosse = mosseDaSpinte(liv, bauliDi(sg), aIndice(sg.zucco), sol.spinte);
  t.log(`soluzione: ${sol.spinte.length} spinte, ${mosse.length} mosse`);
  // Due mosse passano dall'interfaccia: la prima spinta (clic sul baule accanto) e, se non è già stato provato,
  // il primo tragitto di almeno 3 passi (clic sulla casella di arrivo). Le altre con t.gioca.
  let rifiutate = 0, fattoClicSpinta = false;
  const DIR = { destra: 1, sinistra: -1, giu: W, su: -W };
  for (const [i, m] of mosse.entries()) {
    const ultima = i === mosse.length - 1;
    if (m.vai && !fattoClicLontano) {
      const prima2 = await statoG();
      const via = percorso(liv, bauliDi(prima2), aIndice(prima2.zucco), aIndice(m.vai));
      if (via && via.length >= 3) {
        const q = await t.chiama("posizione", m.vai[0], m.vai[1]);
        await t.clicScena(q.x, q.y);
        await t.aspetta(600);
        const dopo = await statoG();
        t.controlla(uguali(dopo.zucco, m.vai) && dopo.spinte === prima2.spinte, `un clic su una casella lontana (${via.length} passi) porta Zucco lì senza spingere`);
        fattoClicLontano = true;
        continue;
      }
    }
    if (m.dir && !fattoClicSpinta && !ultima) {
      const prima2 = await statoG();
      const b = aIndice(prima2.zucco) + DIR[m.dir];
      const q = await t.chiama("posizione", b % W, Math.floor(b / W));
      await t.clicScena(q.x, q.y);
      await t.aspetta(400);
      const dopo = await statoG();
      t.controlla(dopo.spinte === prima2.spinte + 1 && uguali(dopo.zucco, xy(W, b)) && dopo.bauli.some((c) => uguali(c, xy(W, b + DIR[m.dir]))),
        "un clic sul baule accanto a Zucco lo spinge di una casella");
      fattoClicSpinta = true;
      continue;
    }
    r = await t.gioca(m);
    if (!r || r.valida === false || r.eccezione || r.errore) rifiutate++;
  }
  t.controlla(fattoClicLontano, "il clic su una casella lontana è stato provato");
  s = await t.stato();
  t.controlla(rifiutate === 0 && r && r.risolto === true && s.risolto && s.errori === 1,
    `la soluzione del risolutore (${sol.spinte.length} spinte) risolve il rompicapo (rifiutate ${rifiutate}, ultima risposta ${JSON.stringify(r)})`);
  t.controlla(r && r.spinte === v.spinteMinime, `la risposta finale riporta ${r && r.spinte} spinte, come il minimo ${v.spinteMinime}`);
  sg = await statoG();
  t.controlla(sg.risolto === true && sg.sulSegno === 4 && sg.incastrati.length === 0 && uguali(ordina(sg.bauli), ordina(sg.segni)) && sg.spinte === v.spinteMinime,
    "statoGioco() finale: quattro bauli sui segni, risolto");
  await t.aspetta(1800);
}
