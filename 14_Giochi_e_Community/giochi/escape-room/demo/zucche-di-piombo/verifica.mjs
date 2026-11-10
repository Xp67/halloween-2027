// Verifica della demo «La zucca vuota» (id zucche-di-piombo).
// Non usa il codice della demo: ha un risolutore suo (l'avversario che sceglie la zucca diversa solo alla fine,
// la ricerca esaustiva delle strategie e la strategia giusta) e controlla che la demo si comporti come dice
// ISTRUZIONI.md: varianti, pesate, mosse rifiutate, errori, limite di due pesate, salvataggio e soluzione.

// ── Il risolutore ──

const ordina = (a) => [...a].sort((x, y) => x - y);
const uguali = (a, b) => JSON.stringify(ordina(a)) === JSON.stringify(ordina(b));
const tutte = (n) => Array.from({ length: n }, (_, i) => i + 1);

/**
 * L'avversario: dopo una pesata tiene il gruppo di zucche ancora possibili più numeroso (fuori, sinistro, destro);
 * a parità, quello che contiene la zucca che viene prima in `v.preferite`.
 */
export function avversario(v, possibili, sinistro, destro) {
  const gruppi = [
    { gruppo: "fuori", resta: possibili.filter((z) => !sinistro.includes(z) && !destro.includes(z)) },
    { gruppo: "sinistro", resta: possibili.filter((z) => sinistro.includes(z)) },
    { gruppo: "destro", resta: possibili.filter((z) => destro.includes(z)) },
  ];
  const max = Math.max(...gruppi.map((g) => g.resta.length));
  const rango = (g) => Math.min(...g.resta.map((z) => v.preferite.indexOf(z)));
  const scelto = gruppi.filter((g) => g.resta.length === max).sort((a, b) => rango(a) - rango(b))[0];
  return { gruppo: scelto.gruppo, resta: ordina(scelto.resta) };
}

/** Il piatto che scende quando la zucca diversa sta nel gruppo `gruppo`. */
export function scendeDa(v, gruppo) {
  if (gruppo === "fuori") return null;
  if (v.tipo === "pesante") return gruppo;
  return gruppo === "sinistro" ? "destro" : "sinistro"; // leggera: il suo piatto sale, scende l'altro
}

/** Quello che deduce il giocatore: dal piatto che scende al gruppo dove sta la zucca diversa. */
export function gruppoDa(v, scende) {
  if (scende == null) return "fuori";
  if (v.tipo === "pesante") return scende;
  return scende === "sinistro" ? "destro" : "sinistro";
}

/**
 * Ricerca esaustiva sui numeri: con `c` zucche possibili, `g` zucche sicuramente normali e `p` pesate, il giocatore
 * vince contro l'avversario? Ogni piatto ha da 1 a 4 zucche e i due piatti lo stesso numero.
 */
export function vincibile(c, g, p) {
  if (c <= 1) return c === 1;
  if (p === 0) return false;
  for (let a = 0; a <= Math.min(4, c); a++)
    for (let b = 0; b <= Math.min(4, c - a); b++)
      for (let gs = 0; gs <= Math.min(4 - a, g); gs++)
        for (let gd = 0; gd <= Math.min(4 - b, g - gs); gd++) {
          if (a + gs !== b + gd || a + gs === 0) continue;
          const peggio = Math.max(a, b, c - a - b);
          if (vincibile(peggio, c + g - peggio, p - 1)) return true;
        }
  return false;
}

/** La strategia giusta: un terzo delle possibili per piatto (3 contro 3, poi 1 contro 1). */
export function pesataGiusta(possibili) {
  const c = possibili.length;
  const a = Math.min(Math.ceil(c / 3), Math.floor(c / 2));
  return { sinistro: possibili.slice(0, a), destro: possibili.slice(a, 2 * a) };
}

/** La strategia sbagliata tipica: metà contro metà (4 contro 4, poi 2 contro 2). */
export function pesataSbagliata(possibili) {
  const a = Math.min(4, Math.floor(possibili.length / 2));
  return { sinistro: possibili.slice(0, a), destro: possibili.slice(a, 2 * a) };
}

/** Gioca due pesate con una strategia contro l'avversario della variante: le zucche ancora possibili alla fine. */
export function simula(v, strategia) {
  let possibili = tutte(v.n);
  for (let k = 0; k < 2 && possibili.length > 1; k++) {
    const { sinistro, destro } = strategia(possibili);
    possibili = avversario(v, possibili, sinistro, destro).resta;
  }
  return possibili;
}

/** La strategia lascia una sola zucca qualunque esito esca (non solo quello scelto dall'avversario)? */
export function vinceSempre(n, strategia, possibili = tutte(n), pesate = 2) {
  if (possibili.length <= 1) return possibili.length === 1;
  if (pesate === 0) return false;
  const { sinistro, destro } = strategia(possibili);
  if (sinistro.length !== destro.length || !sinistro.length || sinistro.length > 4) return false;
  const gruppi = [
    possibili.filter((z) => !sinistro.includes(z) && !destro.includes(z)),
    possibili.filter((z) => sinistro.includes(z)),
    possibili.filter((z) => destro.includes(z)),
  ].filter((g) => g.length);
  return gruppi.every((g) => vinceSempre(n, strategia, g, pesate - 1));
}

export function varianteValida(v) {
  return !!v && (v.n === 8 || v.n === 9) && (v.tipo === "leggera" || v.tipo === "pesante")
    && Array.isArray(v.preferite) && uguali(v.preferite, tutte(v.n));
}

// ── Aiuti per giocare sulla pagina ──

async function sgombra(t) {
  const s = await t.chiama("statoGioco");
  if (s.sinistro.length || s.destro.length) await t.gioca({ sgombra: true });
}

async function prepara(t, sinistro, destro) {
  await sgombra(t);
  let ok = true;
  for (const z of sinistro) ok = (await t.gioca({ metti: z, su: "sinistro" })).ok && ok;
  for (const z of destro) ok = (await t.gioca({ metti: z, su: "destro" })).ok && ok;
  const s = await t.chiama("statoGioco");
  return ok && uguali(s.sinistro, sinistro) && uguali(s.destro, destro);
}

/** Una pesata vera: controlla l'esito contro il risolutore e ritorna le zucche ancora possibili. */
async function pesa(t, v, possibiliPrima, sinistro, destro, etichetta) {
  const atteso = avversario(v, possibiliPrima, sinistro, destro);
  const r = await t.gioca({ pesa: true });
  const s = await t.chiama("statoGioco");
  const descr = r.scende == null ? "pari" : `scende il ${r.scende}`;
  t.controlla(r.ok === true && r.scende === scendeDa(v, atteso.gruppo),
    `${etichetta}: ${sinistro.join("")} contro ${destro.join("")} → ${descr} (il risolutore si aspetta il gruppo ${atteso.gruppo})`);
  t.controlla(gruppoDa(v, r.scende) === atteso.gruppo && uguali(s.possibili, atteso.resta),
    `${etichetta}: restano possibili ${atteso.resta.join(", ")} e la demo dice lo stesso (${s.possibili.join(", ")})`);
  const incl = r.scende === "sinistro" ? 1 : r.scende === "destro" ? -1 : 0;
  t.controlla(s.inclinazione === incl, `${etichetta}: la bilancia pende dalla parte giusta (inclinazione ${s.inclinazione})`);
  return atteso.resta;
}

async function testoDellaCarta(t) {
  await t.bottone("testo");
  await t.aspetta(250);
  const testo = await t.pagina.evaluate(() => (document.querySelector(".kit-carta") || {}).innerText || "");
  await t.chiudiCarte();
  return testo;
}

function cartaGiusta(testo, v) {
  return testo.includes(`${v.n} zucche`) && (v.tipo === "leggera"
    ? /vuota/i.test(testo) && /leggera/i.test(testo) && !/piombo/i.test(testo)
    : /piombo/i.test(testo) && /pesante/i.test(testo));
}

// ── La verifica ──

export default async function verifica(t) {
  // 1. Varianti su più semi: vincoli, risolvibili in due pesate (non in una), la strategia giusta vince,
  //    metà contro metà perde. I semi coprono 8 e 9 zucche, leggera e pesante.
  const viste = new Set();
  for (const seme of [1, 5, 7, 8, 10, 12]) {
    const v = await t.nuova(seme);
    const ok = varianteValida(v);
    t.controlla(ok, `seme ${seme}: variante valida (${v && v.n} zucche, ${v && v.tipo}, preferite ${v && v.preferite && v.preferite.join("")})`);
    if (!ok) continue;
    viste.add(`${v.n}-${v.tipo}`);
    t.controlla(vincibile(v.n, 0, 2) && !vincibile(v.n, 0, 1), `seme ${seme}: si vince con due pesate e non con una`);
    t.controlla(vinceSempre(v.n, pesataGiusta) && simula(v, pesataGiusta).length === 1,
      `seme ${seme}: 3 contro 3 e poi 1 contro 1 lascia sempre una zucca sola (qui la ${simula(v, pesataGiusta)[0]})`);
    t.controlla(simula(v, pesataSbagliata).length > 1, `seme ${seme}: 4 contro 4 e poi 2 contro 2 non basta`);
    const s = await t.chiama("statoGioco");
    t.controlla(s.pesate === 0 && s.posizioni.length === v.n && s.posizioni.every((p) => p === "panca") && uguali(s.possibili, tutte(v.n)),
      `seme ${seme}: si parte con ${v.n} zucche sulla panca, nessuna pesata, tutte possibili`);
  }
  t.controlla(viste.size === 4, `i semi provati coprono 8 e 9 zucche, leggera e pesante (${[...viste].join(", ")})`);

  // ── Parte A: seme 13 (9 zucche, una leggera). Interfaccia, mosse rifiutate, un errore, poi la soluzione. ──
  let v = await t.nuova(13);
  t.controlla(cartaGiusta(await testoDellaCarta(t), v), `la carta del testo parla di ${v.n} zucche e di una zucca ${v.tipo}`);

  // 2. L'interfaccia vera: tocco su una zucca, tocco sul piatto, trascinamento, bottone Pesa.
  let p = await t.chiama("posizione", 1);
  await t.clicScena(p.x, p.y);
  await t.aspetta(300);
  let s = await t.chiama("statoGioco");
  t.controlla(s.selezionata === 1, "toccando la zucca 1 sulla panca la si seleziona");
  await t.foto("selezionata");
  p = await t.chiama("zona", "sinistro");
  await t.clicScena(p.x, p.y);
  await t.aspetta(400);
  s = await t.chiama("statoGioco");
  t.controlla(s.posizioni[0] === "sinistro" && uguali(s.sinistro, [1]) && s.selezionata === null, "toccando il piatto sinistro la zucca 1 ci va sopra");

  let e = await t.stato();
  await t.bottone("pesa");
  await t.aspetta(300);
  s = await t.chiama("statoGioco");
  let e2 = await t.stato();
  t.controlla(s.pesate === 0 && e2.errori === e.errori, "«Pesa» con il piatto destro vuoto viene rifiutato: non conta come pesata né come errore");

  const da = await t.chiama("posizione", 2);
  const a = await t.chiama("zona", "destro");
  await t.trascinaScena(da.x, da.y, a.x, a.y);
  await t.aspetta(400);
  s = await t.chiama("statoGioco");
  t.controlla(s.posizioni[1] === "destro" && uguali(s.destro, [2]), "trascinando la zucca 2 sul piatto destro ci va sopra");

  // 3. Mosse impossibili: rifiutate, nessun errore.
  for (const z of [3, 4, 5]) await t.gioca({ metti: z, su: "sinistro" });
  let r = await t.gioca({ metti: 6, su: "sinistro" });
  s = await t.chiama("statoGioco");
  t.controlla(r.valida === false && s.posizioni[5] === "panca" && s.sinistro.length === 4, "la quinta zucca su un piatto viene rifiutata (al massimo 4)");
  r = await t.gioca({ pesa: true });
  s = await t.chiama("statoGioco");
  t.controlla(r.valida === false && s.pesate === 0, "4 zucche contro 1: la pesata viene rifiutata e non conta");
  const r1 = await t.gioca({ metti: 0, su: "destro" });
  const r2 = await t.gioca({ metti: 3, su: "tavolo" });
  const r3 = await t.gioca({ consegna: v.n + 1 });
  const r4 = await t.gioca({ metti: 3, su: "sinistro" });
  e2 = await t.stato();
  t.controlla(r1.valida === false && r2.valida === false && r3.valida === false && r4.valida === false && e2.errori === 0,
    "zucca o zona inesistente, consegna di una zucca che non c'è, zucca già sul piatto: rifiutate, nessun errore");
  r = await t.gioca({ sgombra: true });
  s = await t.chiama("statoGioco");
  t.controlla(r.ok === true && s.posizioni.every((x) => x === "panca") && !s.sinistro.length && !s.destro.length, "«Sgombra» rimette tutte le zucche sulla panca");

  // 4. L'errore tipico: 4 contro 4, poi 2 contro 2. Restano due zucche possibili: qualunque si consegni è sbagliata.
  let possibili = tutte(v.n);
  let mossa = pesataSbagliata(possibili);
  t.controlla(await prepara(t, mossa.sinistro, mossa.destro), "4 zucche per piatto sistemate");
  possibili = await pesa(t, v, possibili, mossa.sinistro, mossa.destro, "pesata sbagliata 1");
  await t.aspetta(900);
  await t.foto("pesata");

  // 6a. Il limite resiste al ricaricamento: la pesata fatta resta fatta.
  await t.ricarica();
  await t.chiudiCarte();
  s = await t.chiama("statoGioco");
  t.controlla(s.pesate === 1 && s.registro.length === 1 && uguali(s.possibili, possibili) && uguali(s.sinistro, mossa.sinistro),
    "ricaricando la pagina la pesata resta usata, con le zucche dove erano");

  mossa = pesataSbagliata(possibili);
  t.controlla(await prepara(t, mossa.sinistro, mossa.destro), "2 zucche per piatto fra le 4 sospette");
  possibili = await pesa(t, v, possibili, mossa.sinistro, mossa.destro, "pesata sbagliata 2");
  t.controlla(possibili.length === 2, `dopo due pesate sbagliate restano due zucche possibili (${possibili.join(", ")})`);

  // 6b. La terza pesata viene rifiutata.
  r = await t.gioca({ pesa: true });
  s = await t.chiama("statoGioco");
  e2 = await t.stato();
  t.controlla(r.valida === false && s.pesate === 2 && e2.errori === 0, "la terza pesata viene rifiutata: due pesate e basta, nessun errore");

  r = await t.gioca({ consegna: possibili[0] });
  e2 = await t.stato();
  s = await t.chiama("statoGioco");
  t.controlla(r.errore === true && e2.errori === 1 && !e2.risolto && e2.dorateInPalio === 1,
    `consegnare la zucca ${possibili[0]} quando ne restano due possibili è un errore (dorate in palio: ${e2.dorateInPalio})`);
  t.controlla(s.pesate === 0 && s.registro.length === 0 && s.posizioni.every((x) => x === "panca") && uguali(s.possibili, tutte(v.n)) && s.tentativo === 2,
    "dopo l'errore si ricomincia: zucche sulla panca, lavagna pulita, due pesate nuove, tutte di nuovo possibili");
  await t.aspetta(300);
  await t.foto("errore");

  // 5. La soluzione del risolutore: 3 contro 3, poi 1 contro 1; la consegna passa dall'interfaccia vera.
  possibili = tutte(v.n);
  for (let k = 1; k <= 2; k++) {
    mossa = pesataGiusta(possibili);
    t.controlla(await prepara(t, mossa.sinistro, mossa.destro), `pesata giusta ${k}: zucche sistemate`);
    possibili = await pesa(t, v, possibili, mossa.sinistro, mossa.destro, `pesata giusta ${k}`);
  }
  t.controlla(possibili.length === 1, `dopo le due pesate giuste resta solo la zucca ${possibili[0]}`);
  await t.aspetta(900);
  p = await t.chiama("posizione", possibili[0]);
  await t.clicScena(p.x, p.y);
  await t.aspetta(300);
  s = await t.chiama("statoGioco");
  t.controlla(s.selezionata === possibili[0], `toccando la zucca ${possibili[0]} la si seleziona`);
  await t.bottone("consegna");
  await t.aspetta(200);
  e2 = await t.stato();
  s = await t.chiama("statoGioco");
  t.controlla(e2.risolto && e2.errori === 1 && e2.guadagnate === 1 && s.vinta === possibili[0],
    `«Consegna» della zucca ${possibili[0]} risolve il rompicapo (1 errore, 1 dorata guadagnata)`);
  await t.aspetta(1800);
  await t.foto("vinto-leggera");

  // ── Parte B: seme 8 (8 zucche, una pesante). Soluzione diretta, senza errori: resta risolto per prova.mjs. ──
  v = await t.nuova(8);
  t.controlla(cartaGiusta(await testoDellaCarta(t), v), `la carta del testo parla di ${v.n} zucche e di una zucca ${v.tipo}`);
  possibili = tutte(v.n);
  for (let k = 1; k <= 2; k++) {
    mossa = pesataGiusta(possibili);
    t.controlla(await prepara(t, mossa.sinistro, mossa.destro), `pesante, pesata ${k}: zucche sistemate`);
    possibili = await pesa(t, v, possibili, mossa.sinistro, mossa.destro, `pesante, pesata ${k}`);
    if (k === 1) { await t.aspetta(900); await t.foto("pesata-pesante"); }
  }
  t.controlla(possibili.length === 1, `pesante: resta solo la zucca ${possibili[0]}`);
  r = await t.gioca({ consegna: possibili[0] });
  e2 = await t.stato();
  t.controlla(r.risolto === true && e2.risolto && e2.errori === 0 && e2.guadagnate === 2,
    `pesante: la consegna della zucca ${possibili[0]} risolve senza errori (2 dorate)`);
  await t.aspetta(1800);
}
