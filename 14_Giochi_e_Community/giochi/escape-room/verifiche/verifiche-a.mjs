// Verifiche dei rompicapi difficili, parte A: lucchetto delle lapidi (Mastermind con risposta cattiva),
// corvi (Nim misère), cavalieri (Guarini), pista (Lights Out), lucine (anelli cinesi), mozziconi,
// clessidre, mancia del barista (noci di cocco), pirati-scheletro.
const out = (...a) => console.log(...a);

// ── 1. Il lucchetto delle lapidi: 4 simboli fra 6, ripetizioni ammesse ──
const CODICI = [];
for (let i = 0; i < 1296; i++) CODICI.push([Math.floor(i / 216), Math.floor(i / 36) % 6, Math.floor(i / 6) % 6, i % 6]);
function risposta(a, b) {
  let nere = 0;
  const ca = [0, 0, 0, 0, 0, 0], cb = [0, 0, 0, 0, 0, 0];
  for (let i = 0; i < 4; i++) { if (a[i] === b[i]) nere++; else { ca[a[i]]++; cb[b[i]]++; } }
  let bianche = 0;
  for (let c = 0; c < 6; c++) bianche += Math.min(ca[c], cb[c]);
  return nere * 5 + bianche;
}
const R = new Uint8Array(1296 * 1296);
for (let i = 0; i < 1296; i++) for (let j = 0; j < 1296; j++) R[i * 1296 + j] = risposta(CODICI[i], CODICI[j]);
const VINTO = 20;
function partizioni(g, cand) {
  const m = new Map();
  for (const c of cand) { const k = R[g * 1296 + c]; if (!m.has(k)) m.set(k, []); m.get(k).push(c); }
  return m;
}
function sceltaKnuth(cand) {
  if (cand.length === 1) return cand[0];
  const set = new Set(cand);
  let migliore = -1, peggio = Infinity, inCand = false;
  const cnt = new Uint16Array(25);
  for (let g = 0; g < 1296; g++) {
    cnt.fill(0);
    let mx = 0;
    for (const c of cand) { const k = R[g * 1296 + c]; cnt[k]++; if (cnt[k] > mx) mx = cnt[k]; }
    const isC = set.has(g);
    if (mx < peggio || (mx === peggio && isC && !inCand)) { peggio = mx; migliore = g; inCand = isC; }
  }
  return migliore;
}
let nodi = 0;
function profondita(cand, primo) {
  nodi++;
  const g = primo ?? sceltaKnuth(cand);
  let peggiore = 0;
  for (const [k, p] of partizioni(g, cand)) {
    const d = k === VINTO ? 1 : 1 + profondita(p);
    if (d > peggiore) peggiore = d;
  }
  return peggiore;
}
out('── Lucchetto delle lapidi ──');
const tutti = [...Array(1296).keys()];
out('Con la risposta peggiore (il lucchetto sceglie sempre il gruppo più grande) bastano', profondita(tutti, 7), 'tentativi, aprendo con AABB');
// quanti codici restano dopo un primo tentativo «a caso», per mostrare che giocare male non basta
for (const [nome, g] of [['AABB', 7], ['ABCD', 0 * 216 + 1 * 36 + 2 * 6 + 3], ['AAAA', 0]]) {
  const p = partizioni(g, tutti);
  out(`  primo tentativo ${nome}: il lucchetto cattivo lascia ${Math.max(...[...p.values()].map((x) => x.length))} codici`);
}

// ── 2. I corvi dello spaventapasseri: Nim misère (chi fa volare via l'ultimo corvo perde) ──
const memo = new Map();
function vinceChiMuove(mucchi) {
  const s = mucchi.filter((x) => x > 0).sort((a, b) => a - b);
  if (s.length === 0) return true;
  const k = s.join(',');
  if (memo.has(k)) return memo.get(k);
  let v = false;
  for (let i = 0; i < s.length && !v; i++) for (let t = 1; t <= s[i] && !v; t++) {
    const n = [...s]; n[i] -= t;
    if (!vinceChiMuove(n)) v = true;
  }
  memo.set(k, v);
  return v;
}
const formula = (m) => { const x = m.reduce((a, b) => a ^ b, 0); return m.some((v) => v > 1) ? x !== 0 : x === 0; };
let prove = 0, sbagli = 0;
for (let a = 0; a <= 7; a++) for (let b = a; b <= 7; b++) for (let c = b; c <= 7; c++) for (let d = c; d <= 7; d++) {
  prove++;
  if (vinceChiMuove([a, b, c, d]) !== formula([a, b, c, d])) sbagli++;
}
out('\n── Corvi (Nim misère) ──');
out(`regola «xor diverso da zero, salvo quando restano solo pali da un corvo» verificata su ${prove} posizioni: ${sbagli} differenze`);
for (const m of [[3, 5, 7], [2, 5, 6, 8], [1, 4, 6, 9], [3, 4, 6, 8]]) out(`  pali ${m.join(',')}: chi comincia ${vinceChiMuove(m) ? 'vince' : 'perde'} (xor ${m.reduce((a, b) => a ^ b, 0)})`);

// ── 3. Il ballo dei cavalieri: scambiare cavalli bianchi e neri con le mosse del cavallo ──
function cavalieri(righe, colonne, inizio) {
  const fine = inizio.replace(/[BN]/g, (c) => (c === 'B' ? 'N' : 'B'));
  const salti = [[1, 2], [2, 1], [-1, 2], [-2, 1], [1, -2], [2, -1], [-1, -2], [-2, -1]];
  const dist = new Map([[inizio, 0]]);
  const coda = [inizio];
  for (let i = 0; i < coda.length; i++) {
    const s = coda[i];
    if (s === fine) return { mosse: dist.get(s), stati: dist.size };
    for (let p = 0; p < s.length; p++) {
      if (s[p] === '.') continue;
      const r = Math.floor(p / colonne), c = p % colonne;
      for (const [dr, dc] of salti) {
        const r2 = r + dr, c2 = c + dc;
        if (r2 < 0 || c2 < 0 || r2 >= righe || c2 >= colonne) continue;
        const q = r2 * colonne + c2;
        if (s[q] !== '.') continue;
        const a = s.split(''); a[q] = a[p]; a[p] = '.';
        const t = a.join('');
        if (!dist.has(t)) { dist.set(t, dist.get(s) + 1); coda.push(t); }
      }
    }
  }
  return { mosse: Infinity, stati: dist.size };
}
out('\n── Ballo dei cavalieri ──');
out('3×3, due bianchi in alto agli angoli e due neri in basso:', cavalieri(3, 3, 'B.B' + '...' + 'N.N'));
out('3×3, bianchi e neri su tutta la riga:', cavalieri(3, 3, 'BBB' + '...' + 'NNN'));
out('3×4, quattro bianchi sopra e quattro neri sotto:', cavalieri(3, 4, 'BBBB' + '....' + 'NNNN'));
out('4×3, tre bianchi sopra e tre neri sotto:', cavalieri(4, 3, 'BBB' + '...' + '...' + 'NNN'));

// ── 4. La pista che si spegne: Lights Out 5×5 ──
const N5 = 25;
const effetto = [];
for (let i = 0; i < N5; i++) {
  const r = Math.floor(i / 5), c = i % 5;
  let m = 1 << i;
  if (r > 0) m |= 1 << (i - 5);
  if (r < 4) m |= 1 << (i + 5);
  if (c > 0) m |= 1 << (i - 1);
  if (c < 4) m |= 1 << (i + 1);
  effetto.push(m);
}
function risolviLuci(stato) {
  // righe: per ogni casella, quali pulsanti la cambiano (la matrice è simmetrica)
  const righe = effetto.map((m, i) => ({ a: m, b: (stato >> i) & 1 }));
  let r = 0;
  const pivot = [];
  for (let c = 0; c < N5; c++) {
    let p = -1;
    for (let k = r; k < N5; k++) if ((righe[k].a >> c) & 1) { p = k; break; }
    if (p < 0) continue;
    [righe[r], righe[p]] = [righe[p], righe[r]];
    for (let k = 0; k < N5; k++) if (k !== r && (righe[k].a >> c) & 1) { righe[k].a ^= righe[r].a; righe[k].b ^= righe[r].b; }
    pivot.push(c); r++;
  }
  for (let k = r; k < N5; k++) if (righe[k].b) return null;
  let x = 0;
  for (let k = 0; k < r; k++) if (righe[k].b) x |= 1 << pivot[k];
  const liberi = [...Array(N5).keys()].filter((c) => !pivot.includes(c));
  // vettori del nucleo
  const nucleo = liberi.map((f) => {
    let v = 1 << f;
    for (let k = 0; k < r; k++) if ((righe[k].a >> f) & 1) v |= 1 << pivot[k];
    return v;
  });
  let migliore = x;
  const peso = (v) => { let n = 0; while (v) { n += v & 1; v >>>= 1; } return n; };
  for (let s = 0; s < 1 << nucleo.length; s++) {
    let y = x;
    nucleo.forEach((v, i) => { if ((s >> i) & 1) y ^= v; });
    if (peso(y) < peso(migliore)) migliore = y;
  }
  return { premi: peso(migliore), liberi: liberi.length, soluzione: migliore };
}
let sem = 12345;
const rnd = () => { sem = (sem * 1103515245 + 12345) & 0x7fffffff; return sem / 0x7fffffff; };
out('\n── Pista che si spegne (Lights Out 5×5) ──');
let pesi = [];
for (let t = 0; t < 2000; t++) {
  let stato = 0;
  for (let i = 0; i < N5; i++) if (rnd() < 0.5) stato ^= effetto[i];
  pesi.push(risolviLuci(stato).premi);
}
out('griglie create premendo caselle a caso: sempre risolvibili; pulsanti minimi da', Math.min(...pesi), 'a', Math.max(...pesi), ', media', (pesi.reduce((a, b) => a + b, 0) / pesi.length).toFixed(1));
out('caselle libere del sistema (le griglie a caso non risolvibili sono 3 su 4):', risolviLuci(effetto[0]).liberi);
const accese = (1 << 25) - 1;
out('tutta la pista accesa: pulsanti minimi', risolviLuci(accese).premi);

// ── 5. Le lucine maledette: anelli cinesi ──
function anelli(n) {
  const dist = new Map([[(1 << n) - 1, 0]]);
  const coda = [(1 << n) - 1];
  for (let i = 0; i < coda.length; i++) {
    const s = coda[i];
    if (s === 0) return dist.get(s);
    const mosse = [0];
    for (let k = 1; k < n; k++) if ((s >> (k - 1)) & 1 && (s & ((1 << (k - 1)) - 1)) === 0) mosse.push(k);
    for (const k of mosse) { const t = s ^ (1 << k); if (!dist.has(t)) { dist.set(t, dist.get(s) + 1); coda.push(t); } }
  }
}
out('\n── Lucine maledette (anelli cinesi) ──');
for (const n of [4, 5, 6, 7, 8]) out(`  ${n} lucine tutte accese → tutte spente: ${anelli(n)} clic`);

// ── 6. I mozziconi del fantasma ──
function mozziconi(N, k, prestito) {
  let fumate = 0, m = N;
  while (m >= k) { const s = Math.floor(m / k); fumate += s; m = m - s * k + s; }
  if (prestito && m === k - 1) fumate++;
  return fumate;
}
out('\n── Mozziconi ──');
for (const [N, k] of [[24, 5], [25, 5], [27, 4], [30, 4], [36, 7], [48, 7], [40, 6], [35, 6]]) {
  out(`  ${N} mozziconi, ${k} fanno una sigaretta: senza prestito ${mozziconi(N, k, false)}, con un mozzicone in prestito ${mozziconi(N, k, true)}, formula ⌊N/(k-1)⌋ = ${Math.floor(N / (k - 1))}`);
}

// ── 7. Le clessidre del fungo ──
function clessidre(A, B, T, limite = 4 * T) {
  // stato: sabbia sopra in A e in B al momento di un evento; si può girare una clessidra solo a un evento
  const inizio = { t: 0, a: 0, b: 0, via: [] };
  const coda = [inizio];
  const visti = new Set(['0,0,0']);
  const soluzioni = [];
  for (let i = 0; i < coda.length; i++) {
    const s = coda[i];
    for (const [ga, gb] of [[0, 0], [1, 0], [0, 1], [1, 1]]) {
      let a = ga ? A - s.a : s.a, b = gb ? B - s.b : s.b;
      if (a === 0 && b === 0) continue;
      const dt = Math.min(...[a, b].filter((x) => x > 0));
      const t = s.t + dt;
      if (t > limite) continue;
      const mossa = `${s.t}′: ${[ga && 'gira la ' + A, gb && 'gira la ' + B].filter(Boolean).join(' e ') || 'aspetta'}`;
      a = Math.max(0, a - dt); b = Math.max(0, b - dt);
      const via = [...s.via, mossa];
      if (t === T) soluzioni.push(via);
      const k = `${t},${a},${b}`;
      if (!visti.has(k)) { visti.add(k); coda.push({ t, a, b, via }); }
    }
  }
  return soluzioni.length ? soluzioni[0].join(' · ') + ` → ${T}′` : 'impossibile dal via';
}
out('\n── Clessidre ──');
for (const [A, B, T] of [[7, 11, 15], [4, 7, 9], [5, 8, 11], [7, 13, 19], [5, 9, 13], [6, 11, 16], [4, 9, 10], [7, 10, 13]]) out(`  ${A} e ${B} per ${T}: ${clessidre(A, B, T)}`);

// ── 8. La mancia del barista (noci di cocco) ──
function cocco(n, restoMattina) {
  for (let N = 1; N < 5e7; N++) {
    let x = N, ok = true;
    for (let i = 0; i < n; i++) { if (x % n !== 1) { ok = false; break; } x = ((x - 1) / n) * (n - 1); }
    if (ok && x > 0 && x % n === restoMattina) return N;
  }
  return null;
}
out('\n── Mancia del barista ──');
for (const n of [3, 4, 5, 6]) out(`  ${n} baristi: mattina pari ${cocco(n, 0)}, mattina con una moneta al jukebox ${cocco(n, 1)}`);

// ── 9. La spartizione dei pirati-scheletro ──
function pirati(n, C, regola) {
  // esiti[k] = per k pirati (0 = il più anziano, che propone): monete di ognuno, -1 = buttato in mare
  let prec = null;
  let unica = true;
  for (let k = 1; k <= n; k++) {
    const servono = regola === 'pareggio' ? Math.ceil(k / 2) : Math.floor(k / 2) + 1;
    const costi = [];
    for (let i = 1; i < k; i++) {
      const dopo = prec[i - 1];
      costi.push({ i, costo: dopo === -1 ? 0 : dopo + 1 });
    }
    costi.sort((x, y) => x.costo - y.costo);
    const comprati = costi.slice(0, servono - 1);
    const spesa = comprati.reduce((s, x) => s + x.costo, 0);
    let esito;
    if (spesa <= C) {
      esito = new Array(k).fill(0);
      for (const x of comprati) esito[x.i] = x.costo;
      esito[0] = C - spesa;
      const soglia = comprati.length ? comprati[comprati.length - 1].costo : null;
      if (soglia !== null && costi.length > comprati.length && costi[comprati.length].costo === soglia) {
        if (k === n) unica = false;
      }
    } else {
      esito = [-1, ...prec];
    }
    prec = esito;
  }
  return { esito: prec, unica };
}
out('\n── Pirati-scheletro ──');
for (const regola of ['pareggio', 'maggioranza']) {
  for (const n of [4, 5, 6, 7, 8, 9]) {
    const r = pirati(n, 100, regola);
    out(`  ${regola === 'pareggio' ? 'metà basta' : 'serve più di metà'}, ${n} pirati, 100 monete: ${r.esito.map((x) => (x < 0 ? 'mare' : x)).join(' ')}${r.unica ? '' : '  (NON unica)'}`);
  }
}
out('  nodi esplorati per il lucchetto:', nodi);
