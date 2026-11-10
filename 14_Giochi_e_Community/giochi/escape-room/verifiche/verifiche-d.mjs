// Verifiche dei rompicapi della Sala del tesoro: dodici monete, caramella solitaria (solitario inglese),
// esagono d'oro (esagono magico), tre teschi (Vero, Falso, Casuale con «tic» e «tac»).
const out = (...a) => console.log(...a);
const quale = process.argv[2] || 'tutti';

// ── 1. Le dodici monete: basta sapere quante monete sono in ogni stato ──
// u = ancora sospette in tutti e due i sensi, h = forse più pesanti, l = forse più leggere, g = buone di sicuro
const memo = new Map();
function risolvibile(u, h, l, g, k) {
  const ipotesi = 2 * u + h + l;
  if (ipotesi <= 1) return true;
  if (k === 0) return false;
  const chiave = `${u},${h},${l},${g > 0 ? 1 : 0},${k}`;
  if (memo.has(chiave)) return memo.get(chiave);
  if (ipotesi > 3 ** k) { memo.set(chiave, false); return false; }
  const gg = g > 0 ? u + h + l : 0; // buone da usare come zavorra: non ne servono più di così
  for (let u1 = 0; u1 <= u; u1++) for (let u2 = 0; u1 + u2 <= u; u2++)
    for (let h1 = 0; h1 <= h; h1++) for (let h2 = 0; h1 + h2 <= h; h2++)
      for (let l1 = 0; l1 <= l; l1++) for (let l2 = 0; l1 + l2 <= l; l2++)
        for (let g1 = 0; g1 <= Math.min(gg, g); g1++) {
          const sx = u1 + h1 + l1 + g1, dxSenza = u2 + h2 + l2;
          const g2 = sx - dxSenza;
          if (g2 < 0 || g1 + g2 > g || sx === 0) continue;
          if (g1 > 0 && g2 > 0) continue;
          const pende = (hh, ll) => risolvibile(0, hh, ll, g + u + h + l - hh - ll, k - 1);
          if (!pende(u1 + h1, u2 + l2)) continue;
          if (!pende(u2 + h2, u1 + l1)) continue;
          if (!risolvibile(u - u1 - u2, h - h1 - h2, l - l1 - l2, g + u1 + u2 + h1 + h2 + l1 + l2, k - 1)) continue;
          memo.set(chiave, true);
          return true;
        }
  memo.set(chiave, false);
  return false;
}
if (quale === 'tutti' || quale === 'monete') {
  out('── Dodici monete ──');
  for (const [n, k, zavorra] of [[12, 3, 0], [12, 2, 0], [13, 3, 0], [13, 3, 1], [14, 3, 1], [39, 4, 0], [40, 4, 1]]) {
    out(`  ${n} monete, ${k} pesate${zavorra ? ', con una moneta buona in più' : ''}: ${risolvibile(n, 0, 0, zavorra, k) ? 'si trova la falsa e se pesa di più o di meno' : 'non basta'}`);
  }
  // la strategia scritta nella scheda (monete 1-12): per ogni ipotesi la si segue e si controlla che trovi la falsa
  const pesa = (sx, dx, falsa, verso) => { const p = (lato) => (lato.includes(falsa) ? verso : 0); const d = p(sx) - p(dx); return d > 0 ? 'sx' : d < 0 ? 'dx' : 'pari'; };
  function strategia(w) {
    const r1 = w([1, 2, 3, 4], [5, 6, 7, 8]);
    if (r1 === 'pari') {
      const r2 = w([9, 10, 11], [1, 2, 3]);
      if (r2 === 'pari') return w([12], [1]) === 'sx' ? '12+' : '12-';
      const r3 = w([9], [10]);
      if (r2 === 'sx') return r3 === 'sx' ? '9+' : r3 === 'dx' ? '10+' : '11+';
      return r3 === 'sx' ? '10-' : r3 === 'dx' ? '9-' : '11-';
    }
    // se pende a destra è lo stesso a parti invertite: 5-8 forse pesanti, 1-4 forse leggere
    const [a, b, c, d, e, f, g, h] = r1 === 'sx' ? [1, 2, 3, 4, 5, 6, 7, 8] : [5, 6, 7, 8, 1, 2, 3, 4];
    const r2 = w([a, b, e], [c, f, 9]);
    if (r2 === 'pari') { const r3 = w([g], [h]); return r3 === 'sx' ? h + '-' : r3 === 'dx' ? g + '-' : d + '+'; }
    if (r2 === 'sx') { const r3 = w([a], [b]); return r3 === 'sx' ? a + '+' : r3 === 'dx' ? b + '+' : f + '-'; }
    return w([c], [9]) === 'sx' ? c + '+' : e + '-';
  }
  let giuste = 0, pesate = 0;
  for (let falsa = 1; falsa <= 12; falsa++) for (const verso of [1, -1]) {
    let n = 0;
    const r = strategia((sx, dx) => { n++; return pesa(sx, dx, falsa, verso); });
    pesate = Math.max(pesate, n);
    if (r === falsa + (verso > 0 ? '+' : '-')) giuste++;
  }
  out(`  la strategia della scheda trova moneta e verso in ${giuste} ipotesi su 24, con al massimo ${pesate} pesate`);
}

// ── 2. La caramella solitaria: solitario inglese a 33 buche ──
const BUCHE = [];
for (let y = 0; y < 7; y++) for (let x = 0; x < 7; x++) if ((x >= 2 && x <= 4) || (y >= 2 && y <= 4)) BUCHE.push([x, y]);
const idx = new Map(BUCHE.map(([x, y], i) => [x + ',' + y, i]));
const SALTI = [];
for (const [x, y] of BUCHE) for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
  const a = idx.get(x + dx + ',' + (y + dy)), b = idx.get(x + 2 * dx + ',' + (y + 2 * dy));
  if (a !== undefined && b !== undefined) SALTI.push([idx.get(x + ',' + y), a, b]);
}
const P2 = BUCHE.map((_, i) => 2 ** i);
// le 8 simmetrie del tavoliere, per non ripetere posizioni gemelle
const SIMM = [(x, y) => [x, y], (x, y) => [6 - x, y], (x, y) => [x, 6 - y], (x, y) => [6 - x, 6 - y], (x, y) => [y, x], (x, y) => [6 - y, x], (x, y) => [y, 6 - x], (x, y) => [6 - y, 6 - x]];
const PERM = SIMM.map((f) => BUCHE.map(([x, y]) => idx.get(f(x, y).join(','))));
function solitario(vuota, finale, limiteMs = 60000) {
  const piene = BUCHE.map((_, i) => i !== vuota);
  let chiave = piene.reduce((a, p, i) => a + (p ? P2[i] : 0), 0);
  const falliti = new Set();
  const via = [];
  const t0 = Date.now();
  let scaduto = false;
  const simmetriche = vuota === idx.get('3,3') && finale === idx.get('3,3');
  const canon = () => { if (!simmetriche) return chiave; let m = Infinity; for (const p of PERM) { let k = 0; for (let i = 0; i < 33; i++) if (piene[i]) k += P2[p[i]]; if (k < m) m = k; } return m; };
  function cerca(rimaste) {
    if (rimaste === 1) return piene[finale];
    if ((falliti.size & 1023) === 0 && Date.now() - t0 > limiteMs) { scaduto = true; return false; }
    const k = canon();
    if (falliti.has(k)) return false;
    for (const [a, b, c] of SALTI) {
      if (!piene[a] || !piene[b] || piene[c]) continue;
      piene[a] = false; piene[b] = false; piene[c] = true; chiave += P2[c] - P2[a] - P2[b];
      via.push([a, c]);
      if (cerca(rimaste - 1)) return true;
      via.pop();
      piene[a] = true; piene[b] = true; piene[c] = false; chiave -= P2[c] - P2[a] - P2[b];
      if (scaduto) return false;
    }
    falliti.add(k);
    return false;
  }
  const ok = cerca(32);
  return { ok, scaduto, salti: via.length, ms: Date.now() - t0, falliti: falliti.size };
}
const nome = (i) => 'abcdefg'[BUCHE[i][0]] + (7 - BUCHE[i][1]);
if (quale === 'tutti' || quale === 'solitario') {
  out('\n── Caramella solitaria ──');
  const centro = idx.get('3,3');
  const r = solitario(centro, centro);
  out(`  buca vuota al centro, ultima caramella al centro: ${r.ok ? 'si può' : r.scaduto ? 'tempo scaduto' : 'impossibile'} (${r.salti} salti, ${r.ms} ms, ${r.falliti} posizioni scartate)`);
  for (const [v, f] of [['3,0', '3,6'], ['3,0', '3,3'], ['2,0', '2,3'], ['3,1', '3,4'], ['2,2', '2,2'], ['4,3', '1,3']]) {
    const rv = solitario(idx.get(v), idx.get(f), 30000);
    out(`  vuota ${nome(idx.get(v))}, ultima in ${nome(idx.get(f))}: ${rv.ok ? 'si può' : rv.scaduto ? 'tempo scaduto' : 'impossibile'} (${rv.ms} ms)`);
  }
}

// ── 3. L'esagono d'oro: 1-19 nell'esagono a tre per lato, ogni fila fa 38 ──
const CELLE = [];
for (let r = -2; r <= 2; r++) for (let q = -2; q <= 2; q++) if (Math.abs(q + r) <= 2) CELLE.push([q, r]);
const FILE = [];
for (let k = -2; k <= 2; k++) {
  FILE.push(CELLE.map((c, i) => (c[1] === k ? i : -1)).filter((i) => i >= 0));
  FILE.push(CELLE.map((c, i) => (c[0] === k ? i : -1)).filter((i) => i >= 0));
  FILE.push(CELLE.map((c, i) => (-c[0] - c[1] === k ? i : -1)).filter((i) => i >= 0));
}
function esagoni() {
  const v = new Array(19).fill(0), usato = new Array(20).fill(false), sol = [];
  // per ogni cella, le file che si chiudono quando la si riempie (l'ordine è quello delle celle)
  const chiude = CELLE.map((_, i) => FILE.filter((f) => Math.max(...f) === i));
  const tocca = CELLE.map((_, i) => FILE.filter((f) => f.includes(i)));
  (function metti(i) {
    if (i === 19) { sol.push([...v]); return; }
    for (let n = 1; n <= 19; n++) {
      if (usato[n]) continue;
      v[i] = n;
      let ok = true;
      for (const f of tocca[i]) { const s = f.reduce((a, j) => a + (j <= i ? v[j] : 0), 0); if (s > 38) { ok = false; break; } }
      if (ok) for (const f of chiude[i]) if (f.reduce((a, j) => a + v[j], 0) !== 38) { ok = false; break; }
      if (!ok) continue;
      usato[n] = true; metti(i + 1); usato[n] = false;
    }
    v[i] = 0;
  })(0);
  return sol;
}
if (quale === 'tutti' || quale === 'esagono') {
  out('\n── Esagono d\'oro ──');
  const t0 = Date.now();
  const sol = esagoni();
  out(`  ${sol.length} disposizioni (${Date.now() - t0} ms): ${sol.length === 12 ? 'una sola, girata e specchiata nei 12 modi' : 'ATTENZIONE'}`);
  const righe = [-2, -1, 0, 1, 2].map((r) => CELLE.map((c, i) => (c[1] === r ? sol[0][i] : null)).filter((x) => x !== null));
  righe.forEach((r) => out('   ' + ' '.repeat((5 - r.length) * 2) + r.map((n) => String(n).padStart(3)).join(' ')));
  // quali numeri messi in partenza in una casella scelgono una sola delle 12
  const unici = [];
  for (let i = 0; i < 19; i++) for (let n = 1; n <= 19; n++) if (sol.filter((s) => s[i] === n).length === 1) unici.push([i, n]);
  out(`  coppie (casella, numero) che lasciano una sola disposizione: ${unici.length}; con un numero al centro: ${sol.map((s) => s[9]).join(',')}`);
}

// ── 4. I tre teschi: Vero, Falso e Casuale; «tic» e «tac» vogliono dire sì e no, non si sa quale ──
// un mondo: chi è chi (permutazione di V, F, C su A, B, C) e se «tic» vuol dire sì
const PERMS = [['V', 'F', 'C'], ['V', 'C', 'F'], ['F', 'V', 'C'], ['F', 'C', 'V'], ['C', 'V', 'F'], ['C', 'F', 'V']];
const MONDI = PERMS.flatMap((p) => [true, false].map((ticSi) => ({ p, ticSi })));
// risponde il teschio t alla domanda q (una funzione del mondo); il Casuale usa la moneta
function chiedi(mondo, t, q, moneta) {
  const chi = mondo.p[t];
  if (chi === 'C') return moneta() ? 'tic' : 'tac';
  const vero = q(mondo);
  const dice = chi === 'V' ? vero : !vero;
  return dice === mondo.ticSi ? 'tic' : 'tac';
}
// «Se ti chiedessi Q, risponderesti tic?»: per Vero e Falso la risposta è tic se e solo se Q è vera
const seTiChiedessi = (t, q) => (mondo) => chiedi(mondo, t, q, () => true) === 'tic';
// la strada con il biconditionale: «tic vuol dire sì se e solo se tu sei Vero se e solo se Q»
const bicond = (t, q) => (mondo) => mondo.ticSi === (mondo.p[t] === 'V') === q(mondo);
function strategia(mondo, moneta, costruisci) {
  const A = 0, B = 1, C = 2;
  const e = (x, ruolo) => (m) => m.p[x] === ruolo;
  const r1 = chiedi(mondo, B, costruisci(B, e(A, 'C')), moneta);
  const x = r1 === 'tic' ? C : A; // non è il Casuale
  const r2 = chiedi(mondo, x, costruisci(x, e(x, 'F')), moneta);
  const ruoloX = r2 === 'tic' ? 'F' : 'V';
  const r3 = chiedi(mondo, x, costruisci(x, e(B, 'C')), moneta);
  const casuale = r3 === 'tic' ? B : [A, B, C].find((y) => y !== x && y !== B);
  const res = [];
  res[x] = ruoloX; res[casuale] = 'C';
  const terzo = [A, B, C].find((y) => y !== x && y !== casuale);
  res[terzo] = ruoloX === 'V' ? 'F' : 'V';
  return res.join('');
}
if (quale === 'tutti' || quale === 'teschi') {
  out('\n── Tre teschi ──');
  for (const [nomeS, costr] of [['«se ti chiedessi…, risponderesti tic?»', seTiChiedessi], ['«tic vuol dire sì se e solo se sei Vero se e solo se…»', bicond]]) {
    let prove = 0, giuste = 0;
    for (const m of MONDI) for (let monete = 0; monete < 8; monete++) {
      let k = 0;
      const moneta = () => ((monete >> k++) & 1) === 1;
      prove++;
      if (strategia(m, moneta, costr) === m.p.join('')) giuste++;
    }
    out(`  domande del tipo ${nomeS}: ${giuste}/${prove} casi giusti (12 mondi × ogni risposta del Casuale)`);
  }
  // una domanda semplice non basta: «A è Casuale?» chiesta a B
  let ok = 0, tot = 0;
  for (const m of MONDI) for (const lancio of [true, false]) { tot++; const r = chiedi(m, 1, (w) => w.p[0] === 'C', () => lancio); if ((r === 'tic') === (m.p[0] === 'C')) ok++; }
  out(`  controprova: la domanda diretta «A è Casuale?» dice il vero solo in ${ok} casi su ${tot}`);
}
