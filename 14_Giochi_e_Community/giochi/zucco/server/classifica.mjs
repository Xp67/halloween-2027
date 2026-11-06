// La classifica della versione di prova: nome e punti in un file. Sul sito il nome verrà dal profilo.
// Il punteggio che arriva da solo non vale nulla: la partita viene rigiocata con lo stesso sim.js del browser.
// Smaschera i punteggi inventati, non i bot che giocano davvero.

import { mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";

import { LUNGHEZZA_NOME } from "../src/classifica.js";
import { IN, VERSIONE, punteggio, rigioca } from "../src/sim.js";

const MASSIMO_CORPO = 256 * 1024;
const MASSIMO_VOCI = 1000;
const VOCI_MOSTRATE = 10;
const COMANDI = new Set(Object.values(IN));

class Rifiuto extends Error {
  constructor(codice, messaggio) {
    super(messaggio);
    this.codice = codice;
  }
}

export function pulisciNome(testo) {
  if (typeof testo !== "string") return "";
  const pulito = testo.normalize("NFC").replace(/\s/g, " ").replace(/\p{C}/gu, "").replace(/ +/g, " ").trim();
  return [...pulito].slice(0, LUNGHEZZA_NOME).join("").trim();
}

function controllaPartita(r) {
  if (r?.versione !== VERSIONE) throw new Rifiuto(409, "Il gioco è stato aggiornato: ricarica la pagina.");
  const forma =
    Number.isInteger(r.seed) &&
    Number.isInteger(r.punteggio) &&
    Array.isArray(r.input) &&
    r.input.every((v) => Array.isArray(v) && Number.isInteger(v[0]) && COMANDI.has(v[1]));
  if (!forma) throw new Rifiuto(400, "Partita non valida.");
  const s = rigioca(r.seed, r.input);
  if (!s.finita || punteggio(s) !== r.punteggio) throw new Rifiuto(422, "Questa partita non torna.");
}

function leggiFile(file) {
  try {
    return JSON.parse(readFileSync(file, "utf8"));
  } catch (errore) {
    if (errore.code === "ENOENT") return [];
    throw errore;
  }
}

export function creaClassifica(file) {
  let voci = leggiFile(file);

  function scrivi() {
    mkdirSync(dirname(file), { recursive: true });
    writeFileSync(`${file}.tmp`, JSON.stringify(voci));
    renameSync(`${file}.tmp`, file);
  }

  const inChiaro = (voce) => ({ posizione: voci.indexOf(voce) + 1, nome: voce.nome, punti: voce.punti });

  function elenco(tua) {
    return { voci: voci.slice(0, VOCI_MOSTRATE).map(inChiaro), tua: tua && voci.includes(tua) ? inChiaro(tua) : null };
  }

  /** Vale il miglior punteggio di ogni nome, e la stessa partita conta una volta sola. */
  function aggiungi(testo, risultato) {
    const nome = pulisciNome(testo);
    if (!nome) throw new Rifiuto(400, "Scrivi un nome.");
    controllaPartita(risultato);

    const giaSalvata = voci.find((v) => v.seed === risultato.seed);
    if (giaSalvata) return elenco(giaSalvata);

    const chiave = nome.toLowerCase();
    const omonimo = voci.find((v) => v.nome.toLowerCase() === chiave);
    if (omonimo && omonimo.punti >= risultato.punteggio) return elenco(omonimo);

    const voce = { nome, punti: risultato.punteggio, seed: risultato.seed, data: new Date().toISOString() };
    voci = voci.filter((v) => v !== omonimo);
    voci.push(voce);
    voci.sort((a, b) => b.punti - a.punti);
    voci = voci.slice(0, MASSIMO_VOCI);
    scrivi();
    return elenco(voce);
  }

  return { elenco, aggiungi };
}

async function leggiCorpo(richiesta) {
  let corpo = "";
  richiesta.setEncoding("utf8");
  for await (const pezzo of richiesta) {
    corpo += pezzo;
    if (corpo.length > MASSIMO_CORPO) throw new Rifiuto(413, "Partita troppo lunga.");
  }
  try {
    return JSON.parse(corpo);
  } catch {
    throw new Rifiuto(400, "Richiesta non valida.");
  }
}

export async function gestisci(classifica, richiesta, risposta) {
  const rispondi = (codice, dati) => {
    risposta.writeHead(codice, { "Content-Type": "application/json; charset=utf-8" }).end(JSON.stringify(dati));
  };
  try {
    if (richiesta.method === "GET") return rispondi(200, classifica.elenco());
    if (richiesta.method !== "POST") throw new Rifiuto(405, "Metodo non ammesso.");
    const { nome, risultato } = await leggiCorpo(richiesta);
    rispondi(200, classifica.aggiungi(nome, risultato));
  } catch (errore) {
    if (!(errore instanceof Rifiuto)) console.error(errore);
    rispondi(errore.codice ?? 500, { errore: errore instanceof Rifiuto ? errore.message : "Errore del server." });
  }
}
