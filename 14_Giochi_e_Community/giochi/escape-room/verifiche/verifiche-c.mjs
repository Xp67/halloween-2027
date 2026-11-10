// Verifiche dei rompicapi difficili, parte C: teli che mentono (sinceri e bugiardi generati per giocatore),
// armadio a combinazione (codice di tre cifre dagli indizi), spettacolo di luci (nonogrammi).
const out = (...a) => console.log(...a);
function generatore(seme) { let s = seme >>> 0; return () => { s = (Math.imul(s, 1664525) + 1013904223) >>> 0; return s / 4294967296; }; }

// ── 1. I teli che mentono ──
const NOMI = ['il telo a righe', 'il telo a quadri', 'il telo a pois', 'il telo rattoppato', 'il telo bucato'];
const bugiardi = (T) => T.filter((x) => !x).length;
const TIPI = [
  { pesa: 3, fa: (s, r) => { const x = altro(s, r); return { dice: `${NOMI[x]} è bugiardo`, vero: (T) => !T[x] }; } },
  { pesa: 2, fa: (s, r) => { const x = altro(s, r); return { dice: `${NOMI[x]} è sincero`, vero: (T) => T[x] }; } },
  { pesa: 3, fa: (s, r) => { const [x, y] = due(s, r); return { dice: `${NOMI[x]} e ${NOMI[y]} sono dello stesso tipo`, vero: (T) => T[x] === T[y] }; } },
  { pesa: 3, fa: (s, r) => { const x = altro(s, r); return { dice: `io e ${NOMI[x]} siamo di tipo diverso`, vero: (T) => T[s] !== T[x] }; } },
  { pesa: 2, fa: (s, r) => { const k = 1 + Math.floor(r() * 4); return { dice: `fra noi cinque ci sono esattamente ${k} bugiardi`, vero: (T) => bugiardi(T) === k }; } },
  { pesa: 2, fa: (s, r) => { const k = 2 + Math.floor(r() * 3); return { dice: `fra noi cinque ci sono almeno ${k} bugiardi`, vero: (T) => bugiardi(T) >= k }; } },
  { pesa: 3, fa: (s, r) => { const [x, y] = due(s, r); return { dice: `se ${NOMI[x]} è sincero, allora ${NOMI[y]} è bugiardo`, vero: (T) => !T[x] || !T[y] }; } },
  { pesa: 2, fa: (s, r) => { const [x, y] = due(s, r); return { dice: `almeno uno fra ${NOMI[x]} e ${NOMI[y]} è sincero`, vero: (T) => T[x] || T[y] }; } },
  { pesa: 3, fa: (s, r) => { const [x, y, z] = tre(s, r); return { dice: `fra ${NOMI[x]}, ${NOMI[y]} e ${NOMI[z]} c'è un solo sincero`, vero: (T) => [x, y, z].filter((i) => T[i]).length === 1 }; } },
];
function altro(s, r) { let x; do x = Math.floor(r() * 5); while (x === s); return x; }
function due(s, r) { const x = altro(s, r); let y; do y = altro(s, r); while (y === x); return [x, y]; }
function tre(s, r) { const [x, y] = due(s, r); let z; do z = altro(s, r); while (z === x || z === y); return [x, y, z]; }
function scegliTipo(r) { const tot = TIPI.reduce((a, t) => a + t.pesa, 0); let v = r() * tot; for (const t of TIPI) { v -= t.pesa; if (v < 0) return t; } return TIPI[0]; }
const MONDI = [...Array(32).keys()].map((m) => [0, 1, 2, 3, 4].map((i) => !!((m >> i) & 1)));
function soluzioni(frasi, quali) { return MONDI.filter((T) => quali.every((i) => T[i] === frasi[i].vero(T))); }
function fissati(sol) { return [0, 1, 2, 3, 4].filter((i) => sol.length && sol.every((T) => T[i] === sol[0][i])).length; }
function generaTeli(r) {
  for (let tentativo = 0; tentativo < 20000; tentativo++) {
    const frasi = [0, 1, 2, 3, 4].map((s) => scegliTipo(r).fa(s, r));
    const tutte = soluzioni(frasi, [0, 1, 2, 3, 4]);
    if (tutte.length !== 1) continue;
    // ogni frase serve: togliendone una qualsiasi le soluzioni diventano più d'una
    if (![0, 1, 2, 3, 4].every((i) => soluzioni(frasi, [0, 1, 2, 3, 4].filter((j) => j !== i)).length > 1)) continue;
    // nessuna coppia di frasi, da sola, svela il tipo di qualcuno
    let facile = false;
    for (let a = 0; a < 5 && !facile; a++) for (let b = a + 1; b < 5 && !facile; b++) if (fissati(soluzioni(frasi, [a, b])) > 0) facile = true;
    if (facile) continue;
    // e almeno due sinceri e due bugiardi, perché la risposta non sia «tutti uguali»
    const n = bugiardi(tutte[0]);
    if (n < 1 || n > 4) continue;
    return { frasi, soluzione: tutte[0], tentativi: tentativo + 1 };
  }
  return null;
}
out('── Teli che mentono ──');
const rT = generatore(2027);
let tent = [];
for (let i = 0; i < 200; i++) { const g = generaTeli(rT); tent.push(g ? g.tentativi : null); }
const riusciti = tent.filter(Boolean);
out(`200 giocatori: ${riusciti.length} rompicapi generati, tentativi in media ${(riusciti.reduce((a, b) => a + b, 0) / riusciti.length).toFixed(0)}, al massimo ${Math.max(...riusciti)}`);
const es = generaTeli(generatore(31));
es.frasi.forEach((f, i) => out(`  ${NOMI[i]}: «${f.dice[0].toUpperCase() + f.dice.slice(1)}.»`));
out('  soluzione:', es.soluzione.map((t, i) => `${NOMI[i]} ${t ? 'sincero' : 'bugiardo'}`).join(', '));

// ── 2. L'armadio a combinazione: tre cifre diverse, indizi del tipo «una cifra giusta al posto giusto» ──
const CODICI = [];
for (let a = 0; a < 10; a++) for (let b = 0; b < 10; b++) for (let c = 0; c < 10; c++) if (a !== b && b !== c && a !== c) CODICI.push([a, b, c]);
const confronta = (g, c) => { let giusto = 0, sbagliato = 0; g.forEach((d, i) => { if (c[i] === d) giusto++; else if (c.includes(d)) sbagliato++; }); return [giusto, sbagliato]; };
function compatibili(indizi) { return CODICI.filter((c) => indizi.every((x) => { const [g, s] = confronta(x.g, c); return g === x.giusto && s === x.sbagliato; })); }
function generaArmadio(r, nIndizi = 5) {
  for (let t = 0; t < 50000; t++) {
    const codice = CODICI[Math.floor(r() * CODICI.length)];
    const indizi = [];
    while (indizi.length < nIndizi) {
      const g = CODICI[Math.floor(r() * CODICI.length)];
      const [giusto, sbagliato] = confronta(g, codice);
      if (giusto + sbagliato === 3 && giusto === 3) continue;
      indizi.push({ g, giusto, sbagliato });
    }
    if (!indizi.some((x) => x.giusto + x.sbagliato === 0)) continue;
    if (indizi.filter((x) => x.giusto > 0).length > 2) continue;
    if (compatibili(indizi).length !== 1) continue;
    if (![...indizi.keys()].every((i) => compatibili(indizi.filter((_, j) => j !== i)).length > 1)) continue;
    // ogni indizio da solo deve lasciare molte possibilità
    return { codice, indizi, tentativi: t + 1 };
  }
  return null;
}
const frase = (x) => {
  const n = ['nessuna cifra', 'una cifra', 'due cifre', 'tre cifre'];
  if (x.giusto + x.sbagliato === 0) return 'nessuna cifra è giusta';
  const parti = [];
  if (x.giusto) parti.push(`${n[x.giusto]} ${x.giusto === 1 ? 'è giusta ed è' : 'sono giuste e sono'} al posto giusto`);
  if (x.sbagliato) parti.push(`${n[x.sbagliato]} ${x.sbagliato === 1 ? 'è giusta ma è' : 'sono giuste ma sono'} al posto sbagliato`);
  return parti.join('; ');
};
out('\n── Armadio a combinazione ──');
const rA = generatore(77);
const tA = [];
for (let i = 0; i < 200; i++) { const g = generaArmadio(rA); tA.push(g ? g.tentativi : null); }
const okA = tA.filter(Boolean);
out(`200 giocatori: ${okA.length} armadi generati, tentativi in media ${(okA.reduce((a, b) => a + b, 0) / okA.length).toFixed(0)}, al massimo ${Math.max(...okA)}`);
const esA = generaArmadio(generatore(5));
esA.indizi.forEach((x) => out(`  ${x.g.join('')}: ${frase(x)}`));
out('  combinazione:', esA.codice.join(''));

// ── 3. Lo spettacolo di luci: nonogrammi, una sola soluzione e risolvibili riga per riga? ──
function indizi(riga) { const r = []; let n = 0; for (const c of riga) { if (c) n++; else if (n) { r.push(n); n = 0; } } if (n) r.push(n); return r; }
function posizioni(ind, n, linea) {
  // tutte le sistemazioni dei blocchi coerenti con la linea (-1 ignoto, 0 spento, 1 acceso)
  const ris = [];
  const cur = new Array(n).fill(0);
  (function metti(k, da) {
    if (k === ind.length) {
      for (let i = 0; i < n; i++) if (linea[i] !== -1 && linea[i] !== cur[i]) return;
      ris.push([...cur]); return;
    }
    const resto = ind.slice(k + 1).reduce((a, b) => a + b + 1, 0);
    for (let p = da; p + ind[k] + resto <= n; p++) {
      let ok = true;
      for (let i = da; i < p; i++) if (linea[i] === 1) { ok = false; break; }
      if (!ok) break;
      for (let i = p; i < p + ind[k]; i++) if (linea[i] === 0) { ok = false; break; }
      if (!ok) continue;
      if (p + ind[k] < n && linea[p + ind[k]] === 1) continue;
      for (let i = p; i < p + ind[k]; i++) cur[i] = 1;
      metti(k + 1, p + ind[k] + 1);
      for (let i = p; i < p + ind[k]; i++) cur[i] = 0;
    }
  })(0, 0);
  return ris;
}
function propaga(g, R, C) {
  const H = R.length, W = C.length;
  let cambiato = true;
  while (cambiato) {
    cambiato = false;
    for (let y = 0; y < H; y++) {
      const pos = posizioni(R[y], W, g[y]);
      if (!pos.length) return false;
      for (let x = 0; x < W; x++) if (g[y][x] === -1) { const v = pos[0][x]; if (pos.every((p) => p[x] === v)) { g[y][x] = v; cambiato = true; } }
    }
    for (let x = 0; x < W; x++) {
      const col = g.map((r) => r[x]);
      const pos = posizioni(C[x], H, col);
      if (!pos.length) return false;
      for (let y = 0; y < H; y++) if (g[y][x] === -1) { const v = pos[0][y]; if (pos.every((p) => p[y] === v)) { g[y][x] = v; cambiato = true; } }
    }
  }
  return true;
}
function conta(g, R, C, limite = 2) {
  if (!propaga(g, R, C)) return { n: 0 };
  let y0 = -1, x0 = -1;
  for (let y = 0; y < g.length && y0 < 0; y++) for (let x = 0; x < g[0].length; x++) if (g[y][x] === -1) { y0 = y; x0 = x; break; }
  if (y0 < 0) return { n: 1, sol: g };
  let n = 0, sol = null, altra = null;
  for (const v of [1, 0]) {
    const h = g.map((r) => [...r]); h[y0][x0] = v;
    const r = conta(h, R, C, limite - n);
    if (r.n && !sol) sol = r.sol; else if (r.n) altra = r.sol;
    n += r.n;
    if (n >= limite) break;
  }
  return { n, sol, altra };
}
function provaNonogramma(nome, disegno) {
  const img = disegno.map((r) => [...r].map((c) => (c === '#' ? 1 : 0)));
  const H = img.length, W = img[0].length;
  const R = img.map(indizi), C = [...Array(W).keys()].map((x) => indizi(img.map((r) => r[x])));
  const g = img.map((r) => r.map(() => -1));
  const g2 = g.map((r) => [...r]);
  propaga(g2, R, C);
  const rigaPerRiga = g2.every((r) => r.every((v) => v !== -1));
  const r = conta(g, R, C);
  out(`${nome} ${W}×${H}: ${r.n === 1 ? 'una sola soluzione' : r.n + '+ soluzioni'}, ${rigaPerRiga ? 'si risolve riga per riga' : 'riga per riga non basta: ' + g2.flat().filter((v) => v === -1).length + ' caselle restano ignote'}, ${img.flat().filter(Boolean).length} luci accese`);
  if (r.n > 1 && r.sol && r.altra) {
    const diff = [];
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (r.sol[y][x] !== r.altra[y][x]) diff.push(`${y},${x}`);
    out('  caselle che cambiano fra due soluzioni:', diff.join(' '));
  }
  out('  righe:', R.map((x) => x.join('.') || '0').join(' | '));
  out('  colonne:', C.map((x) => x.join('.') || '0').join(' | '));
}
out('\n── Spettacolo di luci ──');
const DISEGNI = {
  teschio: [
    '....#######....',
    '..###########..',
    '.#############.',
    '.#############.',
    '###############',
    '###...###...###',
    '##.....#.....##',
    '##.....#.....##',
    '###...###...###',
    '#######.#######',
    '.#####...#####.',
    '..#####.#####..',
    '...#########...',
    '...#.#.#.#.#...',
    '....#######....',
  ],
  zucca: [
    '.......##......',
    '......##.......',
    '...#########...',
    '.#############.',
    '###.#######.###',
    '##...#####...##',
    '#.....###.....#',
    '###############',
    '#######.#######',
    '#.###########.#',
    '##..#.###.#..##',
    '###.........###',
    '.#############.',
    '..###########..',
    '....#######....',
  ],
  pipistrello: [
    '...............',
    '.....#...#.....',
    '.....##.##.....',
    '#....#####....#',
    '##...#.#.#...##',
    '###..#####..###',
    '####.#####.####',
    '###############',
    '###############',
    '.#############.',
    '..#####.#####..',
    '...##..#..##...',
    '...#...#...#...',
    '.......#.......',
    '...............',
  ],
  fantasma: [
    '.....#####.....',
    '...#########...',
    '..###########..',
    '.#############.',
    '.###..###..###.',
    '.###..###..###.',
    '.#############.',
    '.######.######.',
    '.#####...#####.',
    '.######.######.',
    '.#############.',
    '.#############.',
    '.#############.',
    '.###.#####.###.',
    '.#....###....#.',
  ],
};
for (const [nome, d] of Object.entries(DISEGNI)) provaNonogramma(nome, d);
