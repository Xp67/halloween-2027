// La classifica vista dal gioco: il modulo per il nome e l'elenco dei migliori.
// `classificaDiProva` parla col piccolo server di server/classifica.mjs: sul sito avviaGioco ne riceverà
// una legata al profilo, con la stessa forma, e il nome non servirà più.

export const LUNGHEZZA_NOME = 16;

const CHIAVE_NOME = "zucco.nome";
const NON_RAGGIUNGIBILE = "Classifica non raggiungibile, riprova tra poco.";

function leggiNome() {
  try {
    return localStorage.getItem(CHIAVE_NOME) ?? "";
  } catch {
    return "";
  }
}

function salvaNome(valore) {
  try {
    localStorage.setItem(CHIAVE_NOME, valore);
  } catch {
    // Senza storage il nome va riscritto al prossimo record.
  }
}

export function classificaDiProva(indirizzo) {
  async function chiedi(opzioni) {
    const risposta = await fetch(indirizzo, { cache: "no-store", ...opzioni }).catch(() => null);
    const dati = await risposta?.json().catch(() => null);
    if (!risposta?.ok) throw new Error(dati?.errore ?? NON_RAGGIUNGIBILE);
    return dati;
  }

  return {
    leggi: () => chiedi(),
    salva: (nome, risultato) =>
      chiedi({
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nome, risultato }),
      }),
  };
}

/**
 * `trova(classe)` cerca dentro il gioco, `classifica` può mancare: senza, il tasto e il modulo restano nascosti.
 * `attesa`: i millisecondi prima di dare il fuoco al campo, perché i tasti della partita non finiscano nel nome.
 * `alMostra` chiude quello che occupa lo stesso spazio, `dopoSalvato` rimette il fuoco su Rigioca.
 */
export function creaTabellone(trova, classifica, { attesa, alMostra, dopoSalvato }) {
  const tasto = trova("tabella");
  const modulo = trova("nome");
  const campo = trova("campo");
  const salva = trova("salva");
  const tabella = trova("classifica");
  const elenco = trova("elenco");
  const avviso = trova("avviso");

  let daSalvare = null;
  let richieste = 0;

  function avvisa(testo) {
    avviso.textContent = testo;
    avviso.hidden = !testo;
  }

  function riga({ posizione, nome, punti }, tua) {
    const voce = document.createElement("li");
    voce.classList.toggle("zucco-tua", posizione === tua?.posizione);
    for (const [classe, testo] of [
      ["posizione", `${posizione}.`],
      ["chi", nome],
      ["punti", punti.toLocaleString("it-IT")],
    ]) {
      const cella = document.createElement("span");
      cella.className = `zucco-${classe}`;
      cella.textContent = testo;
      voce.append(cella);
    }
    return voce;
  }

  function mostra({ voci, tua }) {
    const righe = voci.map((v) => riga(v, tua));
    if (tua && !voci.some((v) => v.posizione === tua.posizione)) righe.push(riga(tua, tua));
    elenco.replaceChildren(...righe);
    elenco.hidden = righe.length === 0;
    avvisa(righe.length ? "" : "Ancora nessuno: il primo posto è libero.");
  }

  function nascondi() {
    tabella.hidden = true;
    tasto.setAttribute("aria-expanded", "false");
  }

  async function apri() {
    const questa = ++richieste;
    alMostra();
    elenco.hidden = true;
    avvisa("Carico la classifica...");
    tabella.hidden = false;
    tasto.setAttribute("aria-expanded", "true");
    try {
      const dati = await classifica.leggi();
      if (questa === richieste) mostra(dati);
    } catch (errore) {
      if (questa === richieste) avvisa(errore.message);
    }
  }

  async function invia(e) {
    e.preventDefault();
    const nome = campo.value.trim();
    if (!nome || salva.disabled) return;
    const questa = ++richieste;
    const risultato = daSalvare;
    salva.disabled = true;
    try {
      const dati = await classifica.salva(nome, risultato);
      salvaNome(nome);
      if (questa !== richieste) return;
      daSalvare = null;
      modulo.hidden = true;
      alMostra();
      mostra(dati);
      tabella.hidden = false;
      tasto.setAttribute("aria-expanded", "true");
      dopoSalvato();
    } catch (errore) {
      if (questa !== richieste) return;
      alMostra();
      elenco.hidden = true;
      avvisa(errore.message);
      tabella.hidden = false;
    } finally {
      salva.disabled = false;
    }
  }

  campo.maxLength = LUNGHEZZA_NOME;
  tasto.hidden = !classifica;
  tasto.addEventListener("click", () => (tabella.hidden ? apri() : nascondi()));
  modulo.addEventListener("submit", invia);

  return {
    nascondi,
    /** Vero finché il record aspetta un nome: un tocco distratto sullo schermo non deve farlo perdere. */
    get inAttesa() {
      return !modulo.hidden;
    },
    /** Il record personale apre il modulo; sui telefoni il fuoco aprirebbe subito la tastiera sopra il gioco. */
    proponi(risultato) {
      if (!classifica) return;
      daSalvare = risultato;
      campo.value = leggiNome();
      modulo.hidden = false;
      if (matchMedia("(pointer: fine)").matches) setTimeout(() => campo.focus({ preventScroll: true }), attesa);
    },
    /** La partita riparte: quello che era aperto si chiude, e una risposta in ritardo non deve riaprirlo. */
    chiudi() {
      richieste++;
      daSalvare = null;
      modulo.hidden = true;
      nascondi();
    },
  };
}
