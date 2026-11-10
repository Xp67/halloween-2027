// Verifiche della lanterna del cortile (ponte e torcia, cinque mostri) e degli otto candelabri (otto regine con
// due pezzi fissi).
const out = (...a) => console.log(...a);

// ── 1. La lanterna: chi attraversa in due con una lanterna, tempo minimo (Dijkstra sugli stati) ──
function ponte(tempi) {
  const n = tempi.length, tutti = (1 << n) - 1;
  // stato: maschera di chi è ancora di qua, lanterna di qua (0) o di là (1)
  const dist = new Map(), prec = new Map();
  const chiave = (m, l) => m * 2 + l;
  const coda = [[0, tutti, 0]];
  dist.set(chiave(tutti, 0), 0);
  while (coda.length) {
    coda.sort((a, b) => a[0] - b[0]);
    const [d, m, l] = coda.shift();
    if (d > dist.get(chiave(m, l))) continue;
    if (m === 0) {
      const passi = [];
      let k = chiave(m, l);
      while (prec.has(k)) { const [pk, mossa] = prec.get(k); passi.unshift(mossa); k = pk; }
      return { tempo: d, passi };
    }
    const lato = l === 0 ? m : tutti & ~m;
    const persone = [...Array(n).keys()].filter((i) => lato & (1 << i));
    const gruppi = [];
    for (let i = 0; i < persone.length; i++) {
      gruppi.push([persone[i]]);
      for (let j = i + 1; j < persone.length; j++) gruppi.push([persone[i], persone[j]]);
    }
    for (const g of gruppi) {
      if (l === 0 && g.length === 1 && m !== (1 << g[0])) { /* va bene anche da solo */ }
      const bit = g.reduce((s, i) => s | (1 << i), 0);
      const m2 = l === 0 ? m & ~bit : m | bit;
      const d2 = d + Math.max(...g.map((i) => tempi[i]));
      const k2 = chiave(m2, 1 - l);
      if (!dist.has(k2) || d2 < dist.get(k2)) {
        dist.set(k2, d2);
        prec.set(k2, [chiave(m, l), (l === 0 ? 'vanno ' : 'torna ') + g.map((i) => tempi[i]).join('+')]);
        coda.push([d2, m2, 1 - l]);
      }
    }
  }
}
function avido(tempi) {
  // la strategia «il più veloce accompagna tutti»
  const t = [...tempi].sort((a, b) => a - b);
  return t.slice(1).reduce((s, x) => s + x, 0) + t[0] * (t.length - 2);
}
out('── Lanterna ──');
for (const t of [[1, 3, 6, 8, 12], [1, 2, 5, 10], [1, 2, 6, 9, 13], [1, 3, 4, 9, 11], [2, 3, 7, 9, 14], [1, 4, 5, 10, 12], [1, 2, 7, 11, 15]]) {
  const r = ponte(t);
  out(t.join(','), '→ minimo', r.tempo, '| avido', avido(t), '|', r.passi.join(' · '));
}

// ── 2. Gli otto candelabri: regine 8×8, quali due pezzi fissi lasciano una sola soluzione ──
const regine = [];
(function cerca(riga, col) {
  if (riga === 8) { regine.push([...col]); return; }
  for (let c = 0; c < 8; c++) {
    if (col.some((cc, r) => cc === c || Math.abs(cc - c) === riga - r)) continue;
    col.push(c); cerca(riga + 1, col); col.pop();
  }
})(0, []);
out('\n── Otto candelabri ──', regine.length, 'soluzioni');
// coppie di caselle che compaiono in una sola soluzione
const conta = new Map();
for (const s of regine) {
  for (let a = 0; a < 8; a++) for (let b = a + 1; b < 8; b++) {
    const k = `${a},${s[a]}|${b},${s[b]}`;
    conta.set(k, (conta.get(k) || 0) + 1);
  }
}
const uniche = [...conta.entries()].filter(([, v]) => v === 1).map(([k]) => k);
out('coppie fisse che danno una sola soluzione:', uniche.length);
const lettere = 'abcdefgh';
const casella = (r, c) => lettere[c] + (8 - r);
for (const k of uniche.slice(0, 4)) {
  const [[r1, c1], [r2, c2]] = k.split('|').map((x) => x.split(',').map(Number));
  const sol = regine.find((s) => s[r1] === c1 && s[r2] === c2);
  out('fissi', casella(r1, c1), casella(r2, c2), '→', sol.map((c, r) => casella(r, c)).join(' '));
}
// e con un solo pezzo fisso?
const singole = new Map();
for (const s of regine) for (let r = 0; r < 8; r++) singole.set(`${r},${s[r]}`, (singole.get(`${r},${s[r]}`) || 0) + 1);
out('con un solo pezzo fisso, minimo soluzioni:', Math.min(...singole.values()));

