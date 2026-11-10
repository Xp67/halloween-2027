// Controlli finali per le schede: sequenza degli anelli, soluzione dei cavalieri 4×3, pirati con l'unicità
// controllata a ogni passaggio, quante disposizioni lascia un numero fisso nell'esagono.
const out = (...a) => console.log(...a);

// ── anelli: sequenza minima da tutti infilati a tutti sfilati ──
function anelli(n, da = (1 << n) - 1) {
  const prec = new Map([[da, null]]); const coda = [da];
  for (let i = 0; i < coda.length; i++) {
    const s = coda[i];
    if (s === 0) break;
    const mosse = [0];
    for (let k = 1; k < n; k++) if ((s >> (k - 1)) & 1 && (s & ((1 << (k - 1)) - 1)) === 0) mosse.push(k);
    for (const k of mosse) { const t = s ^ (1 << k); if (!prec.has(t)) { prec.set(t, [s, k]); coda.push(t); } }
  }
  const via = []; let s = 0;
  while (prec.get(s)) { const [p, k] = prec.get(s); via.unshift(k + 1); s = p; }
  return via;
}
out('── Anelli ──');
for (const n of [2, 3, 4, 6]) { const v = anelli(n); out(`  ${n} anelli (${v.length} mosse): ${v.join(',')}`); }
// partenze diverse: quanti stati con 6 anelli chiedono almeno 30 mosse
const dist6 = []; for (let s = 0; s < 64; s++) dist6.push(anelli(6, s).length);
out('  6 anelli, mosse minime per ogni partenza:', [...new Set(dist6)].sort((a, b) => a - b).map((d) => `${d}:${dist6.filter((x) => x === d).length}`).join(' '));

// ── cavalieri 4×3: una soluzione da 16 ──
function cavalieri(righe, colonne, inizio) {
  const fine = inizio.replace(/[BN]/g, (c) => (c === 'B' ? 'N' : 'B'));
  const salti = [[1, 2], [2, 1], [-1, 2], [-2, 1], [1, -2], [2, -1], [-1, -2], [-2, -1]];
  const prec = new Map([[inizio, null]]); const coda = [inizio];
  const nome = (p) => 'abc'[p % colonne] + (righe - Math.floor(p / colonne));
  for (let i = 0; i < coda.length; i++) {
    const s = coda[i];
    if (s === fine) break;
    for (let p = 0; p < s.length; p++) {
      if (s[p] === '.') continue;
      const r = Math.floor(p / colonne), c = p % colonne;
      for (const [dr, dc] of salti) {
        const r2 = r + dr, c2 = c + dc;
        if (r2 < 0 || c2 < 0 || r2 >= righe || c2 >= colonne) continue;
        const q = r2 * colonne + c2;
        if (s[q] !== '.') continue;
        const a = s.split(''); a[q] = a[p]; a[p] = '.'; const t = a.join('');
        if (!prec.has(t)) { prec.set(t, [s, `${s[p] === 'B' ? 'S' : 'V'} ${nome(p)}-${nome(q)}`]); coda.push(t); }
      }
    }
  }
  const via = []; let s = fine;
  while (prec.get(s)) { const [p, m] = prec.get(s); via.unshift(m); s = p; }
  return via;
}
out('\n── Cavalieri 4×3 (S = scheletro, V = vampiro; colonne a-c, righe 1-4 dal basso) ──');
const v = cavalieri(4, 3, 'BBB' + '...' + '...' + 'NNN');
out(`  ${v.length} mosse: ${v.join(' · ')}`);

// ── pirati: unicità a ogni passaggio ──
function pirati(n, C, regola) {
  let prec = null, unica = true;
  for (let k = 1; k <= n; k++) {
    const servono = regola === 'pareggio' ? Math.ceil(k / 2) : Math.floor(k / 2) + 1;
    const costi = [];
    for (let i = 1; i < k; i++) { const d = prec[i - 1]; costi.push({ i, costo: d === -1 ? 0 : d + 1 }); }
    costi.sort((x, y) => x.costo - y.costo);
    const comprati = costi.slice(0, servono - 1);
    const spesa = comprati.reduce((s, x) => s + x.costo, 0);
    if (spesa <= C) {
      const esito = new Array(k).fill(0);
      for (const x of comprati) esito[x.i] = x.costo;
      esito[0] = C - spesa;
      if (comprati.length && costi.length > comprati.length && costi[comprati.length].costo === comprati[comprati.length - 1].costo) unica = false;
      prec = esito;
    } else prec = [-1, ...prec];
  }
  return { esito: prec, unica };
}
out('\n── Pirati ──');
for (const regola of ['pareggio', 'maggioranza']) for (const n of [4, 5, 6, 7, 8, 9]) for (const C of [100, 37]) {
  const r = pirati(n, C, regola);
  out(`  ${regola}, ${n} pirati, ${C}: ${r.esito.map((x) => (x < 0 ? 'mare' : x)).join(' ')} ${r.unica ? 'unica' : 'NON unica'}`);
}

// ── esagono: con un numero fisso, quante disposizioni restano ──
const BASE = [3, 17, 18, 19, 7, 1, 11, 16, 2, 5, 6, 9, 12, 4, 8, 14, 10, 13, 15];
const CELLE = [];
for (let r = -2; r <= 2; r++) for (let q = -2; q <= 2; q++) if (Math.abs(q + r) <= 2) CELLE.push([q, r]);
const indice = new Map(CELLE.map(([q, r], i) => [q + ',' + r, i]));
// rotazione di 60° in coordinate assiali: (q, r) → (−r, q + r); riflessione: (q, r) → (r, q)
const ruota = ([q, r]) => [-r, q + r];
const specchia = ([q, r]) => [r, q];
const disposizioni = [];
for (const sp of [false, true]) {
  let f = (c) => (sp ? specchia(c) : c);
  for (let k = 0; k < 6; k++) {
    const d = new Array(19);
    CELLE.forEach((c, i) => { let x = f(c); for (let j = 0; j < k; j++) x = ruota(x); d[indice.get(x.join(','))] = BASE[i]; });
    disposizioni.push(d.join(','));
  }
}
const uniche = [...new Set(disposizioni)].map((s) => s.split(',').map(Number));
const FILE = [];
for (let k = -2; k <= 2; k++) for (const g of [(c) => c[1], (c) => c[0], (c) => -c[0] - c[1]]) FILE.push(CELLE.map((c, i) => (g(c) === k ? i : -1)).filter((i) => i >= 0));
out('\n── Esagono ──');
out('  disposizioni ricavate girando e specchiando:', uniche.length, '| tutte con le file a 38:', uniche.every((d) => FILE.every((f) => f.reduce((a, i) => a + d[i], 0) === 38)));
const conteggi = new Set();
for (let i = 0; i < 19; i++) if (i !== 9) for (let n = 1; n <= 19; n++) { const c = uniche.filter((d) => d[i] === n).length; if (c) conteggi.add(c); }
out('  con un numero fisso fuori dal centro restano', [...conteggi].join(' o '), 'disposizioni');
