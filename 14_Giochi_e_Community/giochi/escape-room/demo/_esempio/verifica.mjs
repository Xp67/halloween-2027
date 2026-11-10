// Verifica della demo di esempio. Non usa il codice della demo: ricava la soluzione dalla variante da sé.
export default async function verifica(t) {
  const soluzione = (v) => [...v.numeri].map((n, i) => [n, i]).sort((a, b) => a[0] - b[0]).map(([, i]) => i);

  // 1. Varianti diverse per semi diversi, tutte con 5 numeri distinti.
  for (const seme of [1, 2, 3]) {
    const v = await t.nuova(seme);
    t.controlla(v.numeri.length === 5 && new Set(v.numeri).size === 5, `seme ${seme}: cinque numeri diversi (${v.numeri.join(", ")})`);
  }

  // 2. Un errore conta e non risolve.
  let v = await t.nuova(7);
  const giusta = soluzione(v);
  const r = await t.gioca({ candela: giusta[1] });
  let s = await t.stato();
  t.controlla(r.errore && s.errori === 1 && !s.risolto, "accendere la seconda per prima è un errore");

  // 3. La soluzione, passando dall'interfaccia vera (clic sulla scena) per le prime due candele.
  for (const i of giusta.slice(0, 2)) {
    const p = await t.chiama("posizione", i);
    await t.clicScena(p.x, p.y);
  }
  const accese = (await t.chiama("statoGioco")).accese;
  t.controlla(accese.length === 2, "i clic sulla scena accendono le candele");
  for (const i of giusta.slice(2)) await t.gioca({ candela: i });
  s = await t.stato();
  t.controlla(s.risolto && s.errori === 1, "la soluzione risolve il rompicapo (con l'errore di prima)");
  await t.aspetta(900);
}
