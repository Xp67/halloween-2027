// Terne di clessidre (A, B, minuti da misurare dal via) che chiedono più giri: il minimo di eventi in cui si
// decide qualcosa, e se il tempo si ottiene anche solo sommando clessidre intere girate appena finiscono.
function eventiMinimi(A, B, T) {
  const coda = [{ t: 0, a: 0, b: 0, n: 0, via: [] }];
  const visti = new Set(['0,0,0']);
  for (let i = 0; i < coda.length; i++) {
    const s = coda[i];
    for (const [ga, gb] of [[0, 0], [1, 0], [0, 1], [1, 1]]) {
      let a = ga ? A - s.a : s.a, b = gb ? B - s.b : s.b;
      if (a === 0 && b === 0) continue;
      const dt = Math.min(...[a, b].filter((x) => x > 0));
      const t = s.t + dt;
      if (t > T) continue;
      const giri = s.n + (ga || gb ? 1 : 0);
      const via = [...s.via, `${s.t}′ ${[ga && A, gb && B].filter(Boolean).join('+') || '—'}`];
      a = Math.max(0, a - dt); b = Math.max(0, b - dt);
      if (t === T) return { giri, via: via.join(', ') };
      const k = `${t},${a},${b}`;
      if (!visti.has(k)) { visti.add(k); coda.push({ t, a, b, n: giri, via }); }
    }
  }
  return null;
}
// il tempo si ottiene con clessidre intere una dopo l'altra (anche le due insieme)? allora è troppo facile
function facile(A, B, T) {
  for (let x = 0; x * A <= T; x++) for (let y = 0; y * B <= T; y++) if (x * A === T || y * B === T || x * A + 0 === T) return true;
  for (let x = 0; x * A <= T; x++) if ((T - x * A) % B === 0) return true;
  return false;
}
const buone = [];
for (let A = 3; A <= 9; A++) for (let B = A + 2; B <= 13; B++) for (let T = B + 1; T <= 2 * B; T++) {
  if (facile(A, B, T)) continue;
  const r = eventiMinimi(A, B, T);
  if (r && r.giri >= 3) buone.push({ A, B, T, ...r });
}
buone.sort((p, q) => q.giri - p.giri);
console.log(buone.length, 'terne');
for (const b of buone.slice(0, 40)) console.log(`${b.A} e ${b.B} per ${b.T}: ${b.giri} giri — ${b.via}`);
