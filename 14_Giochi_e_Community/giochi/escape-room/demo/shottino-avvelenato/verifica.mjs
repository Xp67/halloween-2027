// Verifica della demo «Lo shottino avvelenato». Non usa il codice della demo: rifà da sé le regole delle
// istruzioni (dove finisce il veleno, chi diventa verde, quali shottini non si distinguono) e ne ricava la soluzione.
//
// Riassunto delle regole (ISTRUZIONI.md, «Variante» e «Regole e mosse»):
// - 4 pipistrelli (0 rosso, 1 giallo, 2 azzurro, 3 bianco), 16 shottini (indici 0..15, targhette 1..16);
// - assaggi[j] è una maschera di 4 bit: il bit i acceso = il pipistrello i assaggia lo shottino j;
// - variante = { pipistrelli: 4, shottini: 16, ordine: permutazione di 0..15 };
// - al giro g l'ordine del veleno è ordine[(g + k) % 16] per k = 0..15; se due o più shottini hanno la stessa
//   maschera il veleno va nel primo shottino (in quell'ordine) che ha un gemello, altrimenti in ordine[g % 16];
// - diventano verdi i pipistrelli della maschera di quello shottino; «indistinguibili» sono tutti gli shottini con
//   quella stessa maschera;
// - indicare lo shottino giusto risolve solo se è l'unico del suo gruppo; altrimenti è un errore, il veleno «era»
//   nel primo shottino del gruppo (nell'ordine del giro) diverso da quello indicato, e si passa al giro dopo.

export default async function verifica(t) {
  const P = 4;
  const N = 16;
  const NOMI = ["rosso", "giallo", "azzurro", "bianco"];
  const bit = (m, i) => (m >> i) & 1;
  const insieme = (m) => [0, 1, 2, 3].filter((i) => bit(m, i));
  const maschera = (lista) => lista.reduce((a, i) => a | (1 << i), 0);
  const uguali = (a, b) => JSON.stringify(a) === JSON.stringify(b);
  // Coordinate della scena (ISTRUZIONI.md, «Grafica»): centro della casella (pipistrello i, shottino j) e dello shottino.
  const cx = (j) => 47 + 17 * j;
  const cy = (i) => 34 + 18 * i;
  const Y_SHOTTINO = 105;

  // ── Il risolutore ──
  const ordineDelGiro = (v, giro) => Array.from({ length: N }, (_, k) => v.ordine[(giro + k) % N]);
  function dopoUnOra(v, giro, assaggi) {
    const ord = ordineDelGiro(v, giro);
    const quanti = (m) => assaggi.filter((x) => x === m).length;
    const conGemello = ord.find((j) => quanti(assaggi[j]) >= 2);
    const base = conGemello !== undefined ? conGemello : ord[0];
    const m = assaggi[base];
    const gruppo = [];
    assaggi.forEach((x, j) => { if (x === m) gruppo.push(j); });
    return { ord, verdi: insieme(m), gruppo };
  }
  function esitoIndica(ora, scelto) {
    if (ora.gruppo.length === 1 && ora.gruppo[0] === scelto) return { risolto: true, veleno: scelto };
    return { errore: true, veleno: ora.ord.find((k) => ora.gruppo.includes(k) && k !== scelto) };
  }
  /** Dai pipistrelli verdi allo shottino: tutti gli shottini con proprio quegli assaggiatori. */
  function deduci(assaggi, verdi) {
    const m = maschera(verdi);
    const c = [];
    assaggi.forEach((x, j) => { if (x === m) c.push(j); });
    return c;
  }
  // L'assegnazione del risolutore: ogni shottino ha un gruppo di assaggiatori diverso (5j+3 mod 16 è biunivoca).
  const giusta = Array.from({ length: N }, (_, j) => (5 * j + 3) % N);

  async function segnaTutto(assaggi) {
    for (let j = 0; j < N; j++)
      for (let i = 0; i < P; i++) {
        const r = await t.gioca({ tipo: "segna", pipistrello: i, shottino: j, valore: bit(assaggi[j], i) === 1 });
        if (!r || !r.ok) {
          t.controlla(false, `segna (${i}, ${j}) rifiutata: ${JSON.stringify(r)}`);
          return false;
        }
      }
    return true;
  }
  const statoGioco = () => t.chiama("statoGioco");

  // ── 1. La variante su sei semi ──
  const semi = [11, 222, 3333, 44444, 555555, 6];
  const primi = new Set();
  for (const seme of semi) {
    const v = await t.nuova(seme);
    const perm = v && Array.isArray(v.ordine) && v.ordine.length === N && uguali([...v.ordine].sort((a, b) => a - b), [...Array(N).keys()]);
    t.controlla(v && v.pipistrelli === P && v.shottini === N && perm,
      `seme ${seme}: 4 pipistrelli, 16 shottini, ordine del veleno = permutazione di 0..15 (${perm ? v.ordine.join(",") : JSON.stringify(v)})`);
    if (!perm) continue;
    primi.add(v.ordine[0]);
    // Risolvibile: con un'assegnazione biunivoca il veleno del primo giro è ordine[0] ed è l'unico del suo gruppo.
    const ora = dopoUnOra(v, 0, giusta);
    t.controlla(ora.gruppo.length === 1 && ora.gruppo[0] === v.ordine[0] && uguali(deduci(giusta, ora.verdi), [v.ordine[0]]),
      `seme ${seme}: con gruppi tutti diversi i verdi (${ora.verdi.map((i) => NOMI[i]).join(", ") || "nessuno"}) indicano un solo shottino, il ${v.ordine[0] + 1}`);
  }
  t.controlla(primi.size >= 3, `il primo shottino avvelenato cambia fra i semi (${[...primi].map((j) => j + 1).join(", ")})`);

  // ── 2. Mosse impossibili: rifiutate, non sono errori ──
  let v = await t.nuova(777);
  let r = await t.gioca({ tipo: "assaggia" });
  t.controlla(r && r.valida === false, `«assaggia» senza nessuna casella segnata è rifiutata (${JSON.stringify(r)})`);
  r = await t.gioca({ tipo: "indica", shottino: 0 });
  t.controlla(r && r.valida === false, "«indica» prima dell'ora è rifiutata");
  r = await t.gioca({ tipo: "segna", pipistrello: 4, shottino: 0, valore: true });
  const r2 = await t.gioca({ tipo: "segna", pipistrello: 0, shottino: 16, valore: true });
  t.controlla(r && r.valida === false && r2 && r2.valida === false, "pipistrello 4 o shottino 16 (fuori dalla griglia) sono rifiutati");
  let s = await t.stato();
  t.controlla(s.errori === 0 && !s.risolto, "le mosse impossibili non contano come errori");

  // ── 3. L'interfaccia vera: clic, trascinamento e bottone Cancella ──
  await t.clicScena(cx(0), cy(0));
  let st = await statoGioco();
  t.controlla(st && st.assaggi && st.assaggi[0] === 1, `un clic sulla casella (rosso, shottino 1) la segna (assaggi[0] = ${st && st.assaggi && st.assaggi[0]})`);
  await t.clicScena(cx(0), cy(0));
  st = await statoGioco();
  t.controlla(st.assaggi[0] === 0, "un secondo clic sulla stessa casella la toglie");
  await t.trascinaScena(cx(0), cy(1), cx(3), cy(1));
  st = await statoGioco();
  t.controlla(uguali(st.assaggi.slice(0, 5), [2, 2, 2, 2, 0]),
    `trascinando sulla riga del giallo dallo shottino 1 al 4 si segnano tutte e quattro (${st.assaggi.slice(0, 5).join(",")})`);
  await t.foto("trascinato");
  await t.bottone("cancella");
  st = await statoGioco();
  t.controlla(st.assaggi.every((m) => m === 0), "il bottone Cancella svuota tutte le caselle");

  // ── 4. Errore tipico: due shottini con gli stessi assaggiatori ──
  const a = 2, b = 9;
  const doppia = [...giusta];
  doppia[b] = doppia[a]; // lo shottino 10 ha gli stessi assaggiatori dello shottino 3; un gruppo resta inutilizzato
  await segnaTutto(doppia);
  let ora = dopoUnOra(v, 0, doppia);
  r = await t.gioca({ tipo: "assaggia" });
  t.controlla(r && r.ok && uguali(r.verdi, ora.verdi) && uguali(r.indistinguibili, [a, b]),
    `con due shottini gemelli il veleno finisce fra i due: verdi ${JSON.stringify(r && r.verdi)}, indistinguibili ${JSON.stringify(r && r.indistinguibili)} (attesi ${JSON.stringify(ora.verdi)} e [${a},${b}])`);
  r = await t.gioca({ tipo: "segna", pipistrello: 0, shottino: 0, valore: true });
  t.controlla(r && r.valida === false, "dopo l'ora le caselle non si cambiano più (mossa rifiutata)");
  await t.aspetta(3200);
  await t.foto("gemelli");
  // ricaricando, l'ora resta passata: non si può rimediare gratis a un'assegnazione sbagliata
  await t.ricarica();
  await t.chiudiCarte();
  st = await statoGioco();
  t.controlla(st && st.fase === "indica" && uguali(st.verdi, ora.verdi) && uguali(st.indistinguibili, [a, b]),
    `ricaricando la pagina dopo l'ora si resta alla scelta dello shottino (fase ${st && st.fase})`);
  const atteso = esitoIndica(ora, a);
  r = await t.gioca({ tipo: "indica", shottino: a });
  s = await t.stato();
  t.controlla(r && r.errore && r.veleno === atteso.veleno && s.errori === 1 && !s.risolto,
    `indicare lo shottino ${a + 1} fra i due gemelli è un errore: il veleno «era» nel ${atteso.veleno + 1} (esito ${JSON.stringify(r)}, errori ${s.errori})`);
  st = await statoGioco();
  t.controlla(st.fase === "assegna" && st.giro === 1 && uguali(st.assaggi, doppia),
    `dopo l'errore comincia il giro 2 con le caselle di prima (fase ${st.fase}, giro ${st.giro})`);
  await t.aspetta(1900);

  // ── 5. Giro 2: gruppi tutti diversi, «Fai assaggiare» dal bottone vero; uno shottino sbagliato è un errore ──
  for (let i = 0; i < P; i++) await t.gioca({ tipo: "segna", pipistrello: i, shottino: b, valore: bit(giusta[b], i) === 1 });
  await t.bottone("assaggia");
  await t.aspetta(3200);
  st = await statoGioco();
  ora = dopoUnOra(v, 1, giusta);
  t.controlla(st.fase === "indica" && uguali(st.verdi, ora.verdi) && uguali(st.indistinguibili, ora.gruppo),
    `al giro 2 il veleno è cambiato: verdi ${JSON.stringify(st.verdi)} (attesi ${JSON.stringify(ora.verdi)}, shottino ${ora.gruppo[0] + 1})`);
  await t.foto("dopo-un-ora");
  let trovati = deduci(giusta, st.verdi);
  t.controlla(trovati.length === 1 && trovati[0] === v.ordine[1], `dai verdi il risolutore ricava un solo shottino, il ${trovati[0] + 1}`);
  const sbagliato = (trovati[0] + 1) % N;
  r = await t.gioca({ tipo: "indica", shottino: sbagliato });
  s = await t.stato();
  t.controlla(r && r.errore && r.veleno === trovati[0] && s.errori === 2 && s.dorateInPalio === 3 && !s.risolto,
    `indicare lo shottino ${sbagliato + 1} invece del ${trovati[0] + 1} è un errore; con 2 errori le dorate in palio sono 3 (esito ${JSON.stringify(r)}, in palio ${s.dorateInPalio})`);
  await t.aspetta(1900);

  // ── 6. Giro 3: la soluzione, scelta con un clic sullo shottino e confermata col bottone Indica ──
  r = await t.gioca({ tipo: "assaggia" });
  ora = dopoUnOra(v, 2, giusta);
  t.controlla(r && r.ok && uguali(r.verdi, ora.verdi) && r.indistinguibili.length === 1,
    `giro 3: verdi ${JSON.stringify(r && r.verdi)} (attesi ${JSON.stringify(ora.verdi)})`);
  trovati = deduci(giusta, r.verdi);
  t.controlla(trovati.length === 1 && trovati[0] === v.ordine[2], `giro 3: lo shottino avvelenato è il ${trovati[0] + 1}`);
  await t.aspetta(3200);
  await t.clicScena(cx(trovati[0]), Y_SHOTTINO);
  st = await statoGioco();
  t.controlla(st.selezionato === trovati[0], `un clic sullo shottino ${trovati[0] + 1} lo seleziona (selezionato ${st.selezionato})`);
  await t.foto("scelto");
  await t.bottone("indica");
  s = await t.stato();
  st = await statoGioco();
  t.controlla(s.risolto && s.errori === 2 && st.fase === "risolto" && st.veleno === trovati[0],
    `il bottone Indica sullo shottino giusto risolve il rompicapo (risolto ${s.risolto}, errori ${s.errori}, fase ${st.fase})`);
  await t.aspetta(1800);
}
