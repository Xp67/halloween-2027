// Verifica dell'armadio a combinazione. Non usa il codice della demo: ricava la combinazione dai cinque
// tentativi incisi con un risolutore suo (prova tutte le 720 combinazioni con tre cifre diverse).

const CODICI = [];
for (let a = 0; a < 10; a++)
  for (let b = 0; b < 10; b++)
    for (let c = 0; c < 10; c++) if (a !== b && b !== c && a !== c) CODICI.push([a, b, c]);

/** Quello che il lucchetto risponde a un tentativo: cifre giuste al posto giusto e giuste ma fuori posto. */
function risposta(cifre, codice) {
  let alPosto = 0, fuoriPosto = 0;
  cifre.forEach((d, i) => {
    if (codice[i] === d) alPosto++;
    else if (codice.includes(d)) fuoriPosto++;
  });
  return { alPosto, fuoriPosto };
}

/** Le combinazioni che danno, a ogni tentativo, esattamente la risposta incisa. */
function compatibili(tentativi) {
  return CODICI.filter((c) => tentativi.every((t) => {
    const r = risposta(t.cifre, c);
    return r.alPosto === t.alPosto && r.fuoriPosto === t.fuoriPosto;
  }));
}

const scritta = (cifre) => cifre.join("");
const treCifreDiverse = (c) => Array.isArray(c) && c.length === 3
  && c.every((d) => Number.isInteger(d) && d >= 0 && d <= 9) && new Set(c).size === 3;

/** Controlla una variante e ritorna la combinazione trovata dal risolutore (o null). */
function controllaVariante(t, v, seme) {
  const formato = v && treCifreDiverse(v.codice) && Array.isArray(v.tentativi) && v.tentativi.length === 5
    && v.tentativi.every((x) => x && treCifreDiverse(x.cifre) && Number.isInteger(x.alPosto) && Number.isInteger(x.fuoriPosto));
  t.controlla(formato, `seme ${seme}: la variante ha il codice e cinque tentativi di tre cifre diverse`);
  if (!formato) return null;
  t.controlla(v.tentativi.every((x) => {
    const r = risposta(x.cifre, v.codice);
    return r.alPosto === x.alPosto && r.fuoriPosto === x.fuoriPosto;
  }), `seme ${seme}: le risposte incise sono quelle vere del lucchetto`);
  const nessuna = v.tentativi.filter((x) => x.alPosto + x.fuoriPosto === 0).length;
  const conAlPosto = v.tentativi.filter((x) => x.alPosto > 0).length;
  t.controlla(nessuna >= 1 && conAlPosto <= 2,
    `seme ${seme}: almeno un tentativo senza cifre giuste (${nessuna}) e al massimo due con cifre al posto giusto (${conAlPosto})`);
  t.controlla(v.tentativi.every((x) => x.alPosto < 3), `seme ${seme}: nessun tentativo è già la combinazione`);
  const soluzioni = compatibili(v.tentativi);
  t.controlla(soluzioni.length === 1 && scritta(soluzioni[0]) === scritta(v.codice),
    `seme ${seme}: una sola combinazione compatibile con i tentativi (${soluzioni.map(scritta).join(", ") || "nessuna"})`);
  const servono = v.tentativi.map((_, i) => compatibili(v.tentativi.filter((__, j) => j !== i)).length);
  t.controlla(servono.every((n) => n > 1), `seme ${seme}: ogni tentativo serve (senza uno restano ${servono.join("/")} combinazioni)`);
  t.log(`seme ${seme}: ${v.tentativi.map((x) => `${scritta(x.cifre)} ${x.alPosto}/${x.fuoriPosto}`).join(" · ")} → ${soluzioni.map(scritta).join("")}`);
  return soluzioni.length === 1 ? soluzioni[0] : null;
}

export default async function verifica(t) {
  // ── 1. Varianti di semi diversi: vincoli della scheda, soluzione unica, ogni tentativo serve ──
  const codici = new Set();
  for (const seme of [1, 2, 3, 42, 777, 2027]) {
    const v = await t.nuova(seme);
    controllaVariante(t, v, seme);
    if (v && v.codice) codici.add(scritta(v.codice));
  }
  t.controlla(codici.size >= 4, `semi diversi danno combinazioni diverse (${[...codici].join(", ")})`);

  // ── 2. La partita: seme fisso ──
  const v = await t.nuova(4242);
  const soluzione = controllaVariante(t, v, 4242);
  if (!soluzione) return;
  let g = await t.chiama("statoGioco");
  t.controlla(g && Array.isArray(g.rotelle) && scritta(g.rotelle) === "000" && Array.isArray(g.provate) && g.provate.length === 0
    && Array.isArray(g.appunti) && g.appunti.length === 10 && g.aperto === false,
  `all'inizio le rotelle segnano 000, nessuna combinazione provata, appunti puliti (${JSON.stringify(g)})`);

  // ── 3. Mosse impossibili: rifiutate e mai contate come errore ──
  let r = await t.gioca({ tipo: "ruota", rotella: 3, verso: 1 });
  t.controlla(r && r.valida === false, `una rotella che non c'è viene rifiutata (${JSON.stringify(r)})`);
  r = await t.gioca({ tipo: "ruota", rotella: 0, verso: 2 });
  t.controlla(r && r.valida === false, `un verso diverso da +1/-1 viene rifiutato (${JSON.stringify(r)})`);
  r = await t.gioca({ tipo: "volo" });
  t.controlla(r && r.valida === false, `una mossa sconosciuta viene rifiutata (${JSON.stringify(r)})`);
  r = await t.gioca({ tipo: "imposta", cifre: [5, 5, 1] });
  t.controlla(r && r.ok === true && scritta(r.rotelle) === "551", `le rotelle possono segnare cifre ripetute (${JSON.stringify(r)})`);
  r = await t.gioca({ tipo: "prova" });
  t.controlla(r && r.valida === false && r.motivo === "cifre ripetute", `provare 551 viene rifiutato: le cifre sono tutte diverse (${JSON.stringify(r)})`);
  let s = await t.stato();
  t.controlla(s.errori === 0 && !s.risolto, `le mosse rifiutate non contano come errore (errori: ${s.errori})`);

  // ── 4. L'interfaccia vera: frecce delle rotelle e lavagnetta ──
  await t.gioca({ tipo: "imposta", cifre: [0, 0, 0] });
  let p = await t.chiama("zona", 0, 1);
  await t.clicScena(p.x, p.y);
  p = await t.chiama("zona", 2, -1);
  await t.clicScena(p.x, p.y);
  p = await t.chiama("zona", 1, 1);
  await t.clicScena(p.x, p.y);
  await t.clicScena(p.x, p.y);
  g = await t.chiama("statoGioco");
  t.controlla(scritta(g.rotelle) === "129", `i clic sulle frecce girano le rotelle: 000 → 129 (${scritta(g.rotelle)})`);
  p = await t.chiama("zonaAppunto", 7);
  await t.clicScena(p.x, p.y);
  g = await t.chiama("statoGioco");
  t.controlla(g.appunti[7] === 1, `un tocco sulla lavagnetta barra la cifra 7 (${g.appunti.join("")})`);
  await t.clicScena(p.x, p.y);
  g = await t.chiama("statoGioco");
  t.controlla(g.appunti[7] === 2, `un secondo tocco la incornicia (${g.appunti.join("")})`);
  r = await t.gioca({ tipo: "segna", cifra: 7 });
  t.controlla(r && r.ok === true && r.segno === 0, `il terzo segno la pulisce (${JSON.stringify(r)})`);
  r = await t.gioca({ tipo: "segna", cifra: 10 });
  t.controlla(r && r.valida === false, `una cifra che non c'è sulla lavagnetta viene rifiutata (${JSON.stringify(r)})`);
  s = await t.stato();
  t.controlla(s.errori === 0, `girare rotelle e scrivere appunti non sono errori (errori: ${s.errori})`);
  await t.foto("rotelle");

  // ── 5. Errore tipico: una combinazione sbagliata conta come errore e non apre ──
  const sbagliata1 = v.tentativi[0].cifre; // un tentativo inciso non è mai la combinazione
  await t.gioca({ tipo: "imposta", cifre: sbagliata1 });
  r = await t.gioca({ tipo: "prova" });
  s = await t.stato();
  t.controlla(r && r.errore === true && s.errori === 1 && !s.risolto,
    `provare ${scritta(sbagliata1)} è un errore e il lucchetto resta chiuso (${JSON.stringify(r)}, errori ${s.errori})`);
  r = await t.gioca({ tipo: "prova" });
  s = await t.stato();
  t.controlla(r && r.valida === false && r.motivo === "già provata" && s.errori === 1,
    `riprovare la stessa combinazione viene rifiutato senza un altro errore (${JSON.stringify(r)})`);
  const sbagliata2 = v.tentativi[1].cifre;
  await t.gioca({ tipo: "imposta", cifre: sbagliata2 });
  r = await t.gioca({ tipo: "prova" });
  s = await t.stato();
  t.controlla(r && r.errore === true && s.errori === 2 && s.dorateInPalio === Math.max(1, s.dorate - 1),
    `con due combinazioni sbagliate le dorate in palio scendono a ${Math.max(1, s.dorate - 1)} (${s.dorateInPalio})`);
  await t.aspetta(500);
  await t.foto("errore");

  // ── 6. Ricaricando, le combinazioni già provate restano ──
  await t.ricarica();
  await t.chiudiCarte();
  g = await t.chiama("statoGioco");
  s = await t.stato();
  t.controlla(g.provate.includes(scritta(sbagliata1)) && g.provate.includes(scritta(sbagliata2)) && s.errori === 2,
    `dopo il ricaricamento le combinazioni provate restano (${g.provate.join(", ")}) e gli errori anche (${s.errori})`);

  // ── 7. La soluzione del risolutore, girando le rotelle una tacca alla volta e premendo il bottone Prova ──
  let mosse = 0;
  for (let i = 0; i < 3; i++) {
    let passi = (soluzione[i] - g.rotelle[i] + 10) % 10;
    const verso = passi <= 5 ? 1 : -1;
    if (verso < 0) passi = 10 - passi;
    for (let k = 0; k < passi; k++) {
      r = await t.gioca({ tipo: "ruota", rotella: i, verso });
      mosse++;
    }
  }
  g = await t.chiama("statoGioco");
  t.controlla(scritta(g.rotelle) === scritta(soluzione), `con ${mosse} tacche le rotelle segnano ${scritta(soluzione)} (${scritta(g.rotelle)})`);
  await t.bottone("prova");
  await t.aspetta(200);
  s = await t.stato();
  g = await t.chiama("statoGioco");
  t.controlla(s.risolto && s.errori === 2 && g.aperto === true,
    `il bottone Prova con ${scritta(soluzione)} apre l'armadio (risolto: ${s.risolto}, errori: ${s.errori})`);
  await t.aspetta(1200);
  await t.foto("apertura");
  await t.aspetta(1500);
}
