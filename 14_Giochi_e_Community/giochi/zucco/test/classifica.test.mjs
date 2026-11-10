import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { createServer } from "node:http";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { after, test } from "node:test";
import { creaClassifica, gestisci, pulisciNome } from "../server/classifica.mjs";
import { IN, VERSIONE, creaPartita, passo, punteggio, rigioca, risultato } from "../src/sim.js";

const cartella = mkdtempSync(join(tmpdir(), "zucco-classifica-"));
after(() => rmSync(cartella, { recursive: true, force: true }));

let contatore = 0;
const nuovoFile = () => join(cartella, `classifica-${++contatore}.json`);

/** Una partita vera: senza toccare nulla Zucco prende tre colpi e finisce. */
const partita = (seed) => risultato(rigioca(seed, []));

/** Due partite con punteggi diversi, per provare chi resta davanti. */
function dueConPunti() {
  const [a, b] = [partita(1), partita(2)];
  assert.notEqual(a.punteggio, b.punteggio);
  return a.punteggio > b.punteggio ? [a, b] : [b, a];
}

test("il nome viene ripulito e tagliato", () => {
  assert.equal(pulisciNome("  Zucco   il\tGrande  "), "Zucco il Grande");
  assert.equal(pulisciNome("Mar\u0000co​"), "Marco");
  assert.equal(pulisciNome("x".repeat(40)).length, 16);
  assert.equal(pulisciNome("🎃".repeat(20)), "🎃".repeat(16));
  assert.equal(pulisciNome("   "), "");
  assert.equal(pulisciNome(42), "");
});

test("una partita vera entra e il punteggio è quello rigiocato", () => {
  const r = partita(7);
  const { voci, tua } = creaClassifica(nuovoFile()).aggiungi("Marco", r);
  assert.deepEqual(voci, [{ posizione: 1, nome: "Marco", punti: r.punteggio }]);
  assert.equal(tua.posizione, 1);
});

test("una partita giocata davvero, con i comandi, supera il controllo", () => {
  const s = creaPartita(11);
  while (!s.finita) passo(s, s.tick % 50 === 0 ? [IN.SALTO_GIU] : s.tick % 50 === 12 ? [IN.SALTO_SU] : []);
  const r = JSON.parse(JSON.stringify(risultato(s)));
  assert.equal(creaClassifica(nuovoFile()).aggiungi("Marco", r).tua.punti, punteggio(s));
});

test("punteggi inventati, regole vecchie e partite rotte non entrano", () => {
  const classifica = creaClassifica(nuovoFile());
  const r = partita(7);
  const rifiuta = (dati, codice) => assert.throws(() => classifica.aggiungi("Marco", dati), { codice });

  rifiuta({ ...r, punteggio: r.punteggio + 1 }, 422);
  rifiuta({ ...r, punteggio: 999999 }, 422);
  rifiuta({ ...r, versione: VERSIONE - 1 }, 409);
  rifiuta({ ...r, seed: "uno" }, 400);
  rifiuta({ ...r, input: [[0, 99]] }, 400);
  rifiuta({ ...r, input: "niente" }, 400);
  rifiuta(undefined, 409);
  assert.throws(() => classifica.aggiungi("   ", r), { codice: 400 });
  assert.deepEqual(classifica.elenco().voci, []);
});

test("resta il punteggio migliore di ogni nome, in ordine", () => {
  const [alta, bassa] = dueConPunti();
  const classifica = creaClassifica(nuovoFile());

  classifica.aggiungi("Marco", bassa);
  assert.equal(classifica.aggiungi("MARCO", alta).tua.punti, alta.punteggio);
  assert.equal(classifica.elenco().voci.length, 1);

  const altra = creaClassifica(nuovoFile());
  altra.aggiungi("Marco", alta);
  assert.equal(altra.aggiungi("marco", bassa).tua.punti, alta.punteggio);

  const terza = creaClassifica(nuovoFile());
  terza.aggiungi("Secondo", bassa);
  const { voci, tua } = terza.aggiungi("Primo", alta);
  assert.deepEqual(voci.map((v) => v.nome), ["Primo", "Secondo"]);
  assert.equal(tua.posizione, 1);
});

test("la stessa partita conta una volta sola", () => {
  const classifica = creaClassifica(nuovoFile());
  const r = partita(7);
  classifica.aggiungi("Marco", r);
  const { voci, tua } = classifica.aggiungi("Altro", r);
  assert.equal(voci.length, 1);
  assert.equal(tua.nome, "Marco");
});

test("la classifica sopravvive al riavvio e ne mostra solo i primi dieci", () => {
  const file = nuovoFile();
  const classifica = creaClassifica(file);
  for (let seed = 1; seed <= 12; seed++) classifica.aggiungi(`Giocatore ${seed}`, partita(seed));

  const dopo = creaClassifica(file).elenco();
  assert.equal(dopo.voci.length, 10);
  assert.deepEqual(dopo, classifica.elenco());
  assert.ok(dopo.voci.every((v, i) => i === 0 || dopo.voci[i - 1].punti >= v.punti));
  assert.equal(JSON.parse(readFileSync(file, "utf8")).length, 12);
});

test("chi sta oltre il decimo posto vede comunque la sua posizione", () => {
  const classifica = creaClassifica(nuovoFile());
  const partite = Array.from({ length: 12 }, (_, i) => partita(i + 1)).sort((a, b) => b.punteggio - a.punteggio);
  partite.slice(0, 11).forEach((r, i) => classifica.aggiungi(`Giocatore ${i}`, r));
  const { voci, tua } = classifica.aggiungi("Ultimo", partite[11]);
  assert.equal(voci.length, 10);
  assert.deepEqual(tua, { posizione: 12, nome: "Ultimo", punti: partite[11].punteggio });
});

test("il server risponde in JSON e rifiuta i corpi troppo grandi", async () => {
  const classifica = creaClassifica(nuovoFile());
  const server = createServer((q, r) => gestisci(classifica, q, r));
  await new Promise((pronto) => server.listen(0, "127.0.0.1", pronto));
  const indirizzo = `http://127.0.0.1:${server.address().port}/`;
  const manda = (corpo) => fetch(indirizzo, { method: "POST", body: corpo });

  try {
    assert.deepEqual(await (await fetch(indirizzo)).json(), { voci: [], tua: null });

    const r = partita(7);
    const salvata = await manda(JSON.stringify({ nome: "Marco", risultato: r }));
    assert.equal(salvata.status, 200);
    assert.equal((await salvata.json()).tua.nome, "Marco");

    const falsa = await manda(JSON.stringify({ nome: "Furbo", risultato: { ...r, seed: 8, punteggio: 1 } }));
    assert.equal(falsa.status, 422);
    assert.equal((await falsa.json()).errore, "Questa partita non torna.");

    assert.equal((await manda("non è json")).status, 400);
    assert.equal((await manda("x".repeat(300 * 1024))).status, 413);
    assert.equal((await fetch(indirizzo, { method: "DELETE" })).status, 405);
    assert.equal((await (await fetch(indirizzo)).json()).voci.length, 1);
  } finally {
    server.close();
  }
});
