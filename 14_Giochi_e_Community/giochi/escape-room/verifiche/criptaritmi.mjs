// Criptaritmi PAROLA + PAROLA = PAROLA con una sola soluzione: risolutore per colonne, con il riporto.
function risolvi(a, b, c, limite = 2) {
  const L = c.length;
  if (a.length > L || b.length > L || L > Math.max(a.length, b.length) + 1) return [];
  const lett = [...new Set(a + b + c)];
  if (lett.length > 10) return [];
  const prime = new Set([a[0], b[0], c[0]]);
  const A = [...a].reverse(), B = [...b].reverse(), Cc = [...c].reverse();
  const val = {}, usate = new Array(10).fill(false), sol = [];
  function assegna(ch, d) { val[ch] = d; usate[d] = true; }
  function libera(ch) { usate[val[ch]] = false; delete val[ch]; }
  function colonna(i, riporto) {
    if (sol.length >= limite) return;
    if (i === L) { if (riporto === 0) sol.push({ ...val }); return; }
    const ca = A[i], cb = B[i], cc = Cc[i];
    const opzioni = (ch) => (ch === undefined ? [null] : ch in val ? [val[ch]] : [...Array(10).keys()].filter((d) => !usate[d] && !(d === 0 && prime.has(ch))));
    for (const da of opzioni(ca)) {
      const nuovaA = ca !== undefined && !(ca in val);
      if (nuovaA) assegna(ca, da);
      for (const db of opzioni(cb)) {
        const nuovaB = cb !== undefined && !(cb in val);
        if (nuovaB) assegna(cb, db);
        const s = (da ?? 0) + (db ?? 0) + riporto, cifra = s % 10, r2 = Math.floor(s / 10);
        if (cc in val) {
          if (val[cc] === cifra) colonna(i + 1, r2);
        } else if (!usate[cifra] && !(cifra === 0 && prime.has(cc))) {
          assegna(cc, cifra); colonna(i + 1, r2); libera(cc);
        }
        if (nuovaB) libera(cb);
      }
      if (nuovaA) libera(ca);
    }
  }
  colonna(0, 0);
  return sol;
}

const parole = ['ZUCCA', 'STREGA', 'OSSA', 'TESCHIO', 'FESTA', 'BALLO', 'NOTTE', 'LUNA', 'GATTO', 'NERO', 'MOSTRO', 'CRIPTA', 'PAURA', 'SCOPA', 'MUMMIA', 'CANDELA', 'DOLCE', 'SCHERZO', 'BARA', 'TOMBA', 'BUIO', 'URLO', 'MORTO', 'ORCO', 'SPETTRO', 'CORVO', 'MAGIA', 'NEBBIA', 'TERRORE', 'BRIVIDO', 'CATENE', 'LAPIDE', 'ANIMA', 'OMBRA', 'DIAVOLO', 'STREGHE', 'ZOMBIE', 'TRUCCO', 'FANTASMA', 'VAMPIRO', 'CASTELLO', 'SANGUE', 'DENTI', 'ARTIGLI', 'LUPO', 'NOTTI', 'BALLA', 'BEVE', 'MOSTRI', 'GHOUL', 'STRIGE', 'SABBA', 'FESTE', 'TORTA', 'CIOCCO', 'MANTO', 'OSSO', 'CAPPA', 'CRANIO', 'TETRO', 'BARE', 'TOMBE', 'NOTTURNO', 'SPIRITO', 'MALEFICIO'];
const trovati = [];
for (const a of parole) for (const b of parole) {
  if (b < a) continue;
  for (const c of parole) {
    if (c === a || c === b) continue;
    const s = risolvi(a, b, c);
    if (s.length === 1) {
      const v = s[0];
      const n = (w) => [...w].map((ch) => v[ch]).join('');
      trovati.push(`${a} + ${b} = ${c}   ${n(a)} + ${n(b)} = ${n(c)}`);
    }
  }
}
console.log(trovati.length, 'criptaritmi con una sola soluzione');
console.log(trovati.join('\n'));
