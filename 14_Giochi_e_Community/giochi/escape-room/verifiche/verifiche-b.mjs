// Verifiche dei rompicapi difficili, parte B: casse del deposito (Sokoban), forziere bloccato (blocchi
// scorrevoli), strati dello shottino (travasi), ritratto in pezzi (tessere 3×3).
const out = (...a) => console.log(...a);
const quale = process.argv[2] || 'tutti';
function generatore(seme) { let s = seme >>> 0; return () => { s = (Math.imul(s, 1664525) + 1013904223) >>> 0; return s / 4294967296; }; }

// ── 1. Le casse del deposito: si parte dalle casse sui segni e si tira all'indietro; lo stato più lontano è il
// livello più difficile per quella pianta, e la distanza è il numero minimo di spinte ──
function sokoban(W, H, nCasse, prove, seme) {
  const rnd = generatore(seme);
  let migliore = null;
  for (let p = 0; p < prove; p++) {
    const muro = new Array(W * H).fill(false);
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (x === 0 || y === 0 || x === W - 1 || y === H - 1 || rnd() < 0.2) muro[y * W + x] = true;
    // tieni solo la zona libera più grande
    const zona = new Array(W * H).fill(-1);
    let grande = -1, quanti = 0;
    for (let i = 0; i < W * H; i++) {
      if (muro[i] || zona[i] >= 0) continue;
      const pila = [i]; zona[i] = i; let n = 0;
      while (pila.length) { const c = pila.pop(); n++; for (const d of [1, -1, W, -W]) if (!muro[c + d] && zona[c + d] < 0) { zona[c + d] = i; pila.push(c + d); } }
      if (n > quanti) { quanti = n; grande = i; }
    }
    for (let i = 0; i < W * H; i++) if (!muro[i] && zona[i] !== grande) muro[i] = true;
    const liberi = [...Array(W * H).keys()].filter((i) => !muro[i]);
    if (liberi.length < nCasse + 6) continue;
    const segni = [];
    while (segni.length < nCasse) { const c = liberi[Math.floor(rnd() * liberi.length)]; if (!segni.includes(c)) segni.push(c); }
    segni.sort((a, b) => a - b);
    const r = indietro(W, muro, segni);
    if (r && (!migliore || r.spinte > migliore.spinte)) migliore = { ...r, muro, segni, W, H };
  }
  return migliore;
}
function regione(W, muro, casse, da) {
  const visti = new Set([da]); const pila = [da]; let min = da;
  while (pila.length) { const c = pila.pop(); if (c < min) min = c; for (const d of [1, -1, W, -W]) { const n = c + d; if (!muro[n] && !casse.has(n) && !visti.has(n)) { visti.add(n); pila.push(n); } } }
  return { visti, min };
}
function indietro(W, muro, segni) {
  const dist = new Map(); const coda = [];
  const casseSet = new Set(segni);
  const fatte = new Set();
  for (const c of muro.keys()) {
    if (muro[c] || casseSet.has(c) || fatte.has(c)) continue;
    const r = regione(W, muro, casseSet, c);
    for (const v of r.visti) fatte.add(v);
    const k = segni.join(',') + '|' + r.min;
    dist.set(k, 0); coda.push({ casse: segni, omino: r.min, k });
  }
  let lontano = coda[0];
  const segniSet = new Set(segni);
  const fuori = (s) => s.casse.filter((c) => !segniSet.has(c)).length;
  for (let i = 0; i < coda.length; i++) {
    const s = coda[i];
    const d0 = dist.get(s.k);
    if (d0 > dist.get(lontano.k) || (d0 === dist.get(lontano.k) && fuori(s) > fuori(lontano))) lontano = s;
    const cs = new Set(s.casse);
    const reg = regione(W, muro, cs, s.omino).visti;
    for (const b of s.casse) for (const d of [1, -1, W, -W]) {
      const x = b - d, y = b - 2 * d;
      if (!reg.has(x) || muro[y] || cs.has(y)) continue;
      const nuove = s.casse.map((c) => (c === b ? x : c)).sort((p, q) => p - q);
      const ns = new Set(nuove);
      const om = regione(W, muro, ns, y).min;
      const k = nuove.join(',') + '|' + om;
      if (!dist.has(k)) { dist.set(k, d0 + 1); coda.push({ casse: nuove, omino: om, k, giocatore: y }); }
    }
  }
  return { spinte: dist.get(lontano.k), stati: dist.size, partenza: lontano };
}
function avanti(W, muro, segni, casse, omino) {
  // controllo: dal livello trovato, spinte minime per mettere le casse sui segni
  const fine = segni.join(',');
  const k0 = casse.join(',') + '|' + regione(W, muro, new Set(casse), omino).min;
  const dist = new Map([[k0, 0]]); const coda = [{ casse, omino }];
  for (let i = 0; i < coda.length; i++) {
    const s = coda[i]; const cs = new Set(s.casse);
    const kk = s.casse.join(',') + '|' + regione(W, muro, cs, s.omino).min;
    if (s.casse.join(',') === fine) return dist.get(kk);
    const reg = regione(W, muro, cs, s.omino).visti;
    for (const b of s.casse) for (const d of [1, -1, W, -W]) {
      const da = b - d, a = b + d;
      if (!reg.has(da) || muro[a] || cs.has(a)) continue;
      const nuove = s.casse.map((c) => (c === b ? a : c)).sort((p, q) => p - q);
      const k = nuove.join(',') + '|' + regione(W, muro, new Set(nuove), b).min;
      if (!dist.has(k)) { dist.set(k, dist.get(kk) + 1); coda.push({ casse: nuove, omino: b }); }
    }
  }
  return null;
}
function disegnaSokoban(l) {
  const { W, H, muro, segni, partenza } = l;
  const cs = new Set(partenza.casse), sg = new Set(segni);
  // l'omino: una casella della sua zona
  const om = partenza.giocatore ?? partenza.omino;
  const righe = [];
  for (let y = 0; y < H; y++) {
    let r = '';
    for (let x = 0; x < W; x++) {
      const i = y * W + x;
      r += muro[i] ? '#' : cs.has(i) && sg.has(i) ? '*' : cs.has(i) ? '$' : i === om ? (sg.has(i) ? '+' : '@') : sg.has(i) ? '.' : ' ';
    }
    righe.push(r);
  }
  return righe.join('\n');
}
if (quale === 'tutti' || quale === 'sokoban' || quale === 'sokoban2') {
  out('── Casse del deposito ──');
  const giri = quale === 'sokoban2' ? [[10, 8, 3, 2500, 101], [9, 8, 4, 900, 202], [10, 9, 4, 500, 303]] : [[9, 8, 3, 500, 11], [9, 9, 3, 500, 23], [8, 8, 4, 150, 37]];
  for (const [W, H, n, prove, seme] of giri) {
    const t0 = Date.now();
    const l = sokoban(W, H, n, prove, seme);
    const verifica = avanti(l.W, l.muro, l.segni, l.partenza.casse, l.partenza.giocatore ?? l.partenza.omino);
    out(`${W}×${H}, ${n} casse, ${prove} piante provate: il più difficile chiede ${l.spinte} spinte (controllo in avanti ${verifica}), ${l.stati} stati, ${((Date.now() - t0) / 1000).toFixed(1)} s`);
    out(disegnaSokoban(l));
  }
}

// ── 2. Il forziere bloccato: blocchi scorrevoli 4×5; una mossa = un pezzo spostato, anche di più caselle ──
const FW = 4, FH = 5;
const TIPI = { Q: [2, 2], V: [1, 2], H: [2, 1], S: [1, 1] };
function chiaveF(pezzi) {
  return ['Q', 'V', 'H', 'S'].map((t) => pezzi.filter((p) => p.t === t).map((p) => p.c).sort((a, b) => a - b).join('.')).join('|');
}
function occupate(p) { const [w, h] = TIPI[p.t]; const r = []; const x = p.c % FW, y = Math.floor(p.c / FW); for (let dy = 0; dy < h; dy++) for (let dx = 0; dx < w; dx++) r.push((y + dy) * FW + x + dx); return r; }
function entra(t, c, pieno) { const [w, h] = TIPI[t]; const x = c % FW, y = Math.floor(c / FW); if (x + w > FW || y + h > FH) return false; for (let dy = 0; dy < h; dy++) for (let dx = 0; dx < w; dx++) if (pieno[(y + dy) * FW + x + dx]) return false; return true; }
function mosseF(pezzi) {
  const res = [];
  const pieno = new Array(FW * FH).fill(false);
  for (const p of pezzi) for (const c of occupate(p)) pieno[c] = true;
  pezzi.forEach((p, i) => {
    for (const c of occupate(p)) pieno[c] = false;
    const visti = new Set([p.c]); const coda = [p.c];
    for (let k = 0; k < coda.length; k++) {
      const c = coda[k]; const x = c % FW;
      for (const [d, ok] of [[1, x < FW - 1], [-1, x > 0], [FW, true], [-FW, true]]) {
        const n = c + d;
        if (!ok || n < 0 || n >= FW * FH || visti.has(n) || !entra(p.t, n, pieno)) continue;
        visti.add(n); coda.push(n);
        const nuovi = pezzi.map((q, j) => (j === i ? { t: q.t, c: n } : q));
        res.push(nuovi);
      }
    }
    for (const c of occupate(p)) pieno[c] = true;
  });
  return res;
}
function disegnaF(pezzi) {
  const g = Array.from({ length: FH }, () => new Array(FW).fill('.'));
  const lettere = { Q: 'F', V: 'v', H: 'h', S: 's' };
  for (const p of pezzi) for (const c of occupate(p)) g[Math.floor(c / FW)][c % FW] = lettere[p.t];
  return g.map((r) => r.join('')).join('\n');
}
if (quale === 'tutti' || quale === 'forziere') {
  out('\n── Forziere bloccato ──');
  // la disposizione classica: lunghi in colonna 0 e 3 (righe 0-1 e 2-3), forziere in 1,0, orizzontale in 1,2,
  // piccoli in 1,3 2,3 0,4 3,4 (indice = riga × 4 + colonna)
  const pezzi0 = [{ t: 'V', c: 0 }, { t: 'Q', c: 1 }, { t: 'V', c: 3 }, { t: 'V', c: 8 }, { t: 'H', c: 9 }, { t: 'V', c: 11 }, { t: 'S', c: 13 }, { t: 'S', c: 14 }, { t: 'S', c: 16 }, { t: 'S', c: 19 }];
  // tutte le posizioni raggiungibili dalla disposizione classica
  const tutte = new Map([[chiaveF(pezzi0), pezzi0]]); const coda = [pezzi0];
  for (let i = 0; i < coda.length; i++) for (const n of mosseF(coda[i])) { const k = chiaveF(n); if (!tutte.has(k)) { tutte.set(k, n); coda.push(n); } }
  out('posizioni raggiungibili:', tutte.size);
  // distanza dall'uscita: il forziere in basso al centro (colonne 1-2, righe 3-4)
  const dist = new Map(); const c2 = [];
  for (const [k, p] of tutte) if (p.find((q) => q.t === 'Q').c === 13) { dist.set(k, 0); c2.push(p); }
  for (let i = 0; i < c2.length; i++) { const d = dist.get(chiaveF(c2[i])); for (const n of mosseF(c2[i])) { const k = chiaveF(n); if (!dist.has(k)) { dist.set(k, d + 1); c2.push(n); } } }
  out('disposizione classica:', dist.get(chiaveF(pezzi0)), 'mosse');
  let max = 0; for (const d of dist.values()) if (d > max) max = d;
  const lontane = [...dist.entries()].filter(([, d]) => d === max).map(([k]) => tutte.get(k));
  out('la più lontana:', max, 'mosse,', lontane.length, 'disposizioni così');
  // fra le lontane, preferisci il forziere in alto
  lontane.sort((a, b) => a.find((q) => q.t === 'Q').c - b.find((q) => q.t === 'Q').c);
  out(disegnaF(lontane[0]));
  const quasi = [...dist.entries()].filter(([, d]) => d >= max - 3 && d < max).map(([k, d]) => ({ p: tutte.get(k), d })).filter((x) => x.p.find((q) => q.t === 'Q').c <= 2);
  out('con il forziere in cima, fra', max - 3, 'e', max - 1, 'mosse:', quasi.length);
  for (const x of quasi.slice(0, 3)) out(x.d + ' mosse\n' + disegnaF(x.p));
}

// ── 3. Gli strati dello shottino: travasi, 4 strati per bicchiere, due bicchieri vuoti ──
function travasi(bicchieri, cap = 4, limite = 3e6) {
  const chiave = (b) => [...b].sort().join('|');
  const fine = (b) => b.every((t) => t.length === 0 || (t.length === cap && [...t].every((c) => c === t[0])));
  const dist = new Map([[chiave(bicchieri), 0]]); const coda = [bicchieri];
  for (let i = 0; i < coda.length; i++) {
    const b = coda[i]; const d = dist.get(chiave(b));
    if (fine(b)) return { mosse: d, stati: dist.size };
    if (dist.size > limite) return { mosse: null, stati: dist.size };
    for (let x = 0; x < b.length; x++) {
      const da = b[x]; if (!da.length) continue;
      const cima = da[da.length - 1];
      let run = 0; while (run < da.length && da[da.length - 1 - run] === cima) run++;
      if (run === da.length && run === cap) continue;
      for (let y = 0; y < b.length; y++) {
        if (y === x) continue;
        const a = b[y];
        if (a.length === cap || (a.length && a[a.length - 1] !== cima)) continue;
        if (!a.length && run === da.length) continue;
        const n = Math.min(run, cap - a.length);
        const nb = [...b]; nb[x] = da.slice(0, da.length - n); nb[y] = a + cima.repeat(n);
        const k = chiave(nb);
        if (!dist.has(k)) { dist.set(k, d + 1); coda.push(nb); }
      }
    }
  }
  return { mosse: null, stati: dist.size };
}
if (quale === 'tutti' || quale === 'shottino') {
  out('\n── Strati dello shottino ──');
  for (const [colori, prove, seme] of [[4, 60, 5], [5, 25, 9], [6, 6, 13]]) {
    const rnd = generatore(seme);
    let migliore = null; const t0 = Date.now(); const tutteMosse = [];
    for (let p = 0; p < prove; p++) {
      const strati = []; for (let c = 0; c < colori; c++) for (let k = 0; k < 4; k++) strati.push('ABCDEFGH'[c]);
      for (let i = strati.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [strati[i], strati[j]] = [strati[j], strati[i]]; }
      const b = []; for (let c = 0; c < colori; c++) b.push(strati.slice(c * 4, c * 4 + 4).join(''));
      b.push('', '');
      const r = travasi(b);
      tutteMosse.push(r.mosse);
      if (r.mosse !== null && (!migliore || r.mosse > migliore.mosse)) migliore = { ...r, b };
    }
    const ok = tutteMosse.filter((m) => m !== null);
    out(`${colori} colori: ${ok.length}/${prove} risolvibili, mosse minime da ${Math.min(...ok)} a ${Math.max(...ok)}; il più lungo ${migliore.mosse} mosse (${migliore.stati} stati) ${migliore.b.map((x) => '[' + x + ']').join(' ')}; ${((Date.now() - t0) / 1000).toFixed(1)} s`);
  }
}

// ── 4. Il ritratto in pezzi: tessere 3×3, quante mosse servono ──
if (quale === 'tutti' || quale === 'ritratto') {
  out('\n── Ritratto in pezzi ──');
  const fine = '123456780';
  const dist = new Map([[fine, 0]]); const coda = [fine];
  for (let i = 0; i < coda.length; i++) {
    const s = coda[i]; const z = s.indexOf('0'); const r = Math.floor(z / 3), c = z % 3;
    for (const [dr, dc] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const r2 = r + dr, c2 = c + dc; if (r2 < 0 || c2 < 0 || r2 > 2 || c2 > 2) continue;
      const q = r2 * 3 + c2; const a = s.split(''); a[z] = a[q]; a[q] = '0'; const t = a.join('');
      if (!dist.has(t)) { dist.set(t, dist.get(s) + 1); coda.push(t); }
    }
  }
  const ist = new Map(); for (const d of dist.values()) ist.set(d, (ist.get(d) || 0) + 1);
  out('posizioni:', dist.size, '| mosse minime per numero di posizioni:', [...ist.entries()].sort((a, b) => a[0] - b[0]).map(([d, n]) => `${d}:${n}`).join(' '));
  const venti = [...dist.entries()].filter(([, d]) => d >= 22 && d <= 26).length;
  out('posizioni fra 22 e 26 mosse (il pozzo da cui pescare quella di ogni giocatore):', venti);
}
