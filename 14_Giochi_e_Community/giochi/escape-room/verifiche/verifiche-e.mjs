// Verifiche dei rompicapi difficili, parte E: torre di sottobicchieri (frittelle bruciate) e cinque tombe
// (indovinello di Einstein generato per giocatore).
const out = (...a) => console.log(...a);
function generatore(seme) { let s = seme >>> 0; return () => { s = (Math.imul(s, 1664525) + 1013904223) >>> 0; return s / 4294967296; }; }

// ── 1. La torre di sottobicchieri: con la paletta si girano i primi k insieme (si capovolgono anche) ──
// stato: dall'alto in basso, numero = grandezza, segno meno = teschio in giù
function sottobicchieri(n) {
  const fine = [...Array(n).keys()].map((i) => i + 1);
  const k0 = fine.join(',');
  const dist = new Map([[k0, 0]]); const coda = [fine];
  for (let i = 0; i < coda.length; i++) {
    const s = coda[i]; const d = dist.get(s.join(','));
    for (let k = 1; k <= n; k++) {
      const t = [...s.slice(0, k).reverse().map((x) => -x), ...s.slice(k)];
      const kt = t.join(',');
      if (!dist.has(kt)) { dist.set(kt, d + 1); coda.push(t); }
    }
  }
  return dist;
}
out('── Torre di sottobicchieri ──');
for (const n of [5, 6, 7]) {
  const t0 = Date.now();
  const dist = sottobicchieri(n);
  const ist = new Map(); for (const d of dist.values()) ist.set(d, (ist.get(d) || 0) + 1);
  out(`  ${n} sottobicchieri: ${dist.size} torri, palettate minime ${[...ist.entries()].sort((a, b) => a[0] - b[0]).map(([d, c]) => `${d}:${c}`).join(' ')} (${Date.now() - t0} ms)`);
  if (n === 6) {
    const es = [...dist.entries()].filter(([, d]) => d === 11).slice(0, 3);
    out('  esempi da 11:', es.map(([k]) => k).join('  |  '));
    out('  tutti con il teschio in giù, già in ordine:', dist.get([...Array(n).keys()].map((i) => -(i + 1)).join(',')));
  }
}

// ── 2. Le cinque tombe: indovinello di Einstein, una sola soluzione, indizi che servono tutti ──
const CARATTERI = {
  lapide: ['nera', 'bianca', 'rossa', 'verde', 'viola'],
  mostro: ['vampiro', 'mummia', 'lupo mannaro', 'strega', 'zombie'],
  bevanda: ['sangue', 'tè', 'latte', 'pozione', 'succo di zucca'],
  dolce: ['liquirizia', 'marzapane', 'caramella mou', 'cioccolato', 'zucchero filato'],
  animale: ['gatto nero', 'corvo', 'pipistrello', 'ragno', 'rospo'],
};
const ATTR = Object.keys(CARATTERI);
const PERM = [];
(function p(a, resto) { if (!resto.length) { PERM.push(a); return; } resto.forEach((x, i) => p([...a, x], resto.filter((_, j) => j !== i))); })([], [0, 1, 2, 3, 4]);
// una soluzione: pos[a][v] = tomba (0 = la prima a sinistra) del valore v del carattere a
function vero(ind, pos) {
  const p = (x) => pos[x[0]][x[1]];
  switch (ind.t) {
    case 'stessa': return p(ind.x) === p(ind.y);
    case 'posto': return p(ind.x) === ind.n;
    case 'sinistra': return p(ind.x) + 1 === p(ind.y);
    case 'accanto': return Math.abs(p(ind.x) - p(ind.y)) === 1;
    case 'diversa': return p(ind.x) !== p(ind.y);
  }
}
const usa = (ind) => [ind.x[0], ...(ind.y ? [ind.y[0]] : [])];
function contaSoluzioni(indizi, limite = 2) {
  // assegna i caratteri uno alla volta; un indizio si controlla appena tutti i suoi caratteri sono assegnati
  const ordine = [...ATTR.keys()];
  const pronti = ordine.map((_, i) => indizi.filter((ind) => usa(ind).every((a) => a <= i) && usa(ind).includes(i)));
  const pos = [];
  let n = 0;
  (function metti(i) {
    if (n >= limite) return;
    if (i === ATTR.length) { n++; return; }
    for (const pr of PERM) {
      pos[i] = pr;
      if (pronti[i].every((ind) => vero(ind, pos))) metti(i + 1);
      if (n >= limite) return;
    }
  })(0);
  return n;
}
function indizioACaso(r, sol) {
  const val = () => { const a = Math.floor(r() * 5); return [a, Math.floor(r() * 5)]; };
  const dove = (x) => sol[x[0]][x[1]];
  for (;;) {
    const q = r();
    const x = val();
    if (q < 0.08) return { t: 'posto', x, n: dove(x) };
    let y = val(); while (y[0] === x[0]) y = val();
    const dx = dove(x), dy = dove(y);
    if (q < 0.45) { const v = { t: 'stessa', x, y: ATTR.map(() => 0) }; v.y = [y[0], sol[y[0]].indexOf(dx)]; return v; }
    if (q < 0.65) { if (dx + 1 === dy) return { t: 'sinistra', x, y }; if (dy + 1 === dx) return { t: 'sinistra', x: y, y: x }; continue; }
    if (q < 0.9) { if (Math.abs(dx - dy) === 1) return { t: 'accanto', x, y }; continue; }
    if (dx !== dy) return { t: 'diversa', x, y };
  }
}
function generaTombe(r) {
  const sol = ATTR.map(() => PERM[Math.floor(r() * 120)]);
  let indizi = [];
  while (contaSoluzioni(indizi) > 1) indizi.push(indizioACaso(r, sol));
  // togli quelli che non servono, in ordine casuale
  const ordine = [...indizi.keys()].sort(() => r() - 0.5);
  const tolti = new Set();
  for (const i of ordine) {
    const prova = indizi.filter((_, j) => j !== i && !tolti.has(j));
    if (contaSoluzioni(prova) === 1) tolti.add(i);
  }
  indizi = indizi.filter((_, j) => !tolti.has(j));
  return { sol, indizi };
}
const NOMIP = ['prima', 'seconda', 'terza', 'quarta', 'quinta'];
function testo(ind) {
  const n = (x) => {
    const a = ATTR[x[0]], v = CARATTERI[a][x[1]];
    return { lapide: `la tomba con la lapide ${v}`, mostro: `la tomba ${['del', 'della', 'del', 'della', 'dello'][x[1]]} ${v}`, bevanda: `la tomba di chi beve ${v}`, dolce: `la tomba di chi mangia ${['la', 'il', 'la', 'il', 'lo'][x[1]]} ${v}`, animale: `la tomba con ${['il', 'il', 'il', 'il', 'il'][x[1]]} ${v}` }[a];
  };
  switch (ind.t) {
    case 'stessa': return `${n(ind.x)} è anche ${n(ind.y)}`;
    case 'posto': return `${n(ind.x)} è la ${NOMIP[ind.n]} da sinistra`;
    case 'sinistra': return `${n(ind.x)} è subito a sinistra di ${n(ind.y).replace(/^la /, 'quella ').replace('quella tomba', 'quella')}`;
    case 'accanto': return `${n(ind.x)} è accanto a ${n(ind.y)}`;
    case 'diversa': return `${n(ind.x)} non è ${n(ind.y)}`;
  }
}
out('\n── Cinque tombe ──');
const r = generatore(1031);
const t0 = Date.now();
const lunghezze = [];
let esempio;
for (let i = 0; i < 40; i++) { const g = generaTombe(r); lunghezze.push(g.indizi.length); if (!esempio) esempio = g; }
out(`  40 giocatori: indizi da ${Math.min(...lunghezze)} a ${Math.max(...lunghezze)}, media ${(lunghezze.reduce((a, b) => a + b, 0) / 40).toFixed(1)}; ${((Date.now() - t0) / 40).toFixed(0)} ms per rompicapo`);
out('  controllo: l\'esempio ha', contaSoluzioni(esempio.indizi, 5), 'soluzione; togliendo un indizio qualsiasi:', esempio.indizi.map((_, i) => contaSoluzioni(esempio.indizi.filter((__, j) => j !== i), 3)).join(','));
esempio.indizi.forEach((ind, i) => { const s = testo(ind); out(`  ${i + 1}. ${s[0].toUpperCase() + s.slice(1)}.`); });
for (let p = 0; p < 5; p++) out(`  tomba ${p + 1}: ` + ATTR.map((a, ai) => CARATTERI[a][esempio.sol[ai].indexOf(p)]).join(', '));
