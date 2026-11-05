// Monta il gioco dentro un elemento: basta questo per inserirlo in una pagina del sito.

import { creaEffetti } from "./effetti.js";
import { creaRender } from "./render.js";
import { ALTEZZA, IN, LARGHEZZA, TICK, creaPartita, passo, punteggio, risultato } from "./sim.js";
import { caricaSprite } from "./sprite.js";

const CHIAVE_RECORD = "zucco.record";
const ATTESA_RIGIOCA = 450;
const ATTESA_AIUTO = 1500;

const MARKUP = `
  <div class="zucco-palco">
    <canvas class="zucco-schermo" width="${LARGHEZZA}" height="${ALTEZZA}" aria-label="La fuga di Zucco"></canvas>
    <div class="zucco-pannello">
      <p class="zucco-esito" hidden></p>
      <div class="zucco-azioni">
        <button class="zucco-gioca" type="button">Gioca</button>
        <button class="zucco-aiuto" type="button" aria-label="Comandi" aria-expanded="false">?</button>
      </div>
      <div class="zucco-comandi" hidden>
        <p><b>Salta:</b> spazio, freccia su o tocco. Tieni premuto per saltare più in alto.</p>
        <p><b>Scivola:</b> freccia giù. In aria ti fa scendere prima.</p>
        <p><b>Caramelle:</b> con 20 arriva la luna piena e per 6 secondi rompi tutto.</p>
      </div>
    </div>
  </div>
  <div class="zucco-tocco">
    <button class="zucco-scivola" type="button">Scivola</button>
    <button class="zucco-salta" type="button">Salta</button>
  </div>
`;

function leggiRecord() {
  try {
    return Number(localStorage.getItem(CHIAVE_RECORD)) || 0;
  } catch {
    return 0;
  }
}

function salvaRecord(valore) {
  try {
    localStorage.setItem(CHIAVE_RECORD, String(valore));
  } catch {
    // Senza storage il record dura solo fino alla chiusura della pagina.
  }
}

const nuovoSeme = () => crypto.getRandomValues(new Uint32Array(1))[0];

/**
 * `seme`: se il server apre la sessione di gioco, è lui a dare il seed.
 * `alTermine(risultato)`: riceve seed, input e punteggio da mandare al server.
 */
export async function avviaGioco(radice, { seme = nuovoSeme, alTermine = () => {} } = {}) {
  radice.classList.add("zucco");
  radice.innerHTML = MARKUP;

  const trova = (classe) => radice.querySelector(`.zucco-${classe}`);
  const palco = trova("palco");
  const schermo = trova("schermo");
  const pannello = trova("pannello");
  const esito = trova("esito");
  const bottone = trova("gioca");
  const aiuto = trova("aiuto");
  const comandi = trova("comandi");

  const movimentoRidotto = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const sprite = await caricaSprite(new URL("../", import.meta.url));
  const effetti = creaEffetti({ scosseAttive: !movimentoRidotto, sprite });
  const render = creaRender(schermo, sprite, effetti);

  let s = creaPartita(0);
  let stato = "titolo";
  let record = leggiRecord();
  let coda = [];
  let accumulo = 0;
  let ultimoFotogramma = performance.now();
  let fineAlle = 0;

  function mostraPannello(testoBottone, testoEsito = "") {
    bottone.textContent = testoBottone;
    esito.textContent = testoEsito;
    esito.hidden = !testoEsito;
    pannello.hidden = false;
    bottone.focus({ preventScroll: true });
  }

  function inizia() {
    effetti.svuota();
    s = creaPartita(seme(), (e) => effetti.evento(e));
    coda = [];
    accumulo = 0;
    stato = "gioco";
    pannello.hidden = true;
    comandi.hidden = true;
    aiuto.setAttribute("aria-expanded", "false");
  }

  function pausa() {
    if (stato !== "gioco") return;
    stato = "pausa";
    mostraPannello("Riprendi");
  }

  function riprendi() {
    stato = "gioco";
    pannello.hidden = true;
    coda = [];
    // I tasti tenuti prima della pausa non hanno più il loro rilascio.
    if (s.tieniSalto) coda.push(IN.SALTO_SU);
    if (s.tieniGiu) coda.push(IN.SCIVOLA_SU);
  }

  function termina() {
    stato = "fine";
    fineAlle = performance.now();
    const punti = punteggio(s);
    const nuovoRecord = punti > record;
    if (nuovoRecord) {
      record = punti;
      salvaRecord(record);
    }
    const dolci = s.caramelle === 1 ? "1 caramella" : `${s.caramelle} caramelle`;
    mostraPannello("Rigioca", `${nuovoRecord ? "Nuovo record! " : ""}Stage ${s.stage}: ${punti} punti, ${dolci}`);
    alTermine(risultato(s));
  }

  function azionePrincipale() {
    if (stato === "pausa") riprendi();
    else if (stato === "titolo") inizia();
    else if (stato === "fine" && performance.now() - fineAlle > ATTESA_RIGIOCA) inizia();
  }

  const premi = (codice) => {
    if (stato === "gioco") coda.push(codice);
  };

  bottone.addEventListener("click", azionePrincipale);

  const TASTI_SALTO = new Set(["Space", "ArrowUp", "KeyW"]);
  const TASTI_GIU = new Set(["ArrowDown", "KeyS"]);

  function tastoGiu(e) {
    if (e.code === "Escape" || e.code === "KeyP") {
      if (stato === "gioco") pausa();
      else if (stato === "pausa") riprendi();
      return;
    }
    const salto = TASTI_SALTO.has(e.code);
    if (!salto && !TASTI_GIU.has(e.code)) return;
    e.preventDefault();
    if (e.repeat) return;
    if (stato !== "gioco") {
      if (salto) azionePrincipale();
      return;
    }
    premi(salto ? IN.SALTO_GIU : IN.SCIVOLA_GIU);
  }

  function tastoSu(e) {
    if (TASTI_SALTO.has(e.code)) premi(IN.SALTO_SU);
    else if (TASTI_GIU.has(e.code)) premi(IN.SCIVOLA_SU);
  }

  function tenuto(elemento, giu, su) {
    elemento.addEventListener("pointerdown", (e) => {
      e.preventDefault();
      elemento.setPointerCapture(e.pointerId);
      if (stato !== "gioco" && giu === IN.SALTO_GIU) azionePrincipale();
      else premi(giu);
    });
    for (const fine of ["pointerup", "pointercancel"]) elemento.addEventListener(fine, () => premi(su));
  }

  tenuto(schermo, IN.SALTO_GIU, IN.SALTO_SU);
  tenuto(trova("salta"), IN.SALTO_GIU, IN.SALTO_SU);
  tenuto(trova("scivola"), IN.SCIVOLA_GIU, IN.SCIVOLA_SU);

  let timerAiuto = 0;
  const mostraAiuto = (visibile) => {
    comandi.hidden = !visibile;
    aiuto.setAttribute("aria-expanded", String(visibile));
  };
  aiuto.addEventListener("click", () => {
    clearTimeout(timerAiuto);
    mostraAiuto(comandi.hidden);
  });
  aiuto.addEventListener("pointerenter", (e) => {
    if (e.pointerType === "mouse") timerAiuto = setTimeout(() => mostraAiuto(true), ATTESA_AIUTO);
  });
  aiuto.addEventListener("pointerleave", () => clearTimeout(timerAiuto));

  function adatta() {
    const { width, height } = palco.getBoundingClientRect();
    const dpr = devicePixelRatio || 1;
    const intero = Math.floor(Math.min((width * dpr) / LARGHEZZA, (height * dpr) / ALTEZZA));
    const k = intero >= 1 ? intero / dpr : Math.min(width / LARGHEZZA, height / ALTEZZA);
    schermo.style.width = `${LARGHEZZA * k}px`;
    schermo.style.height = `${ALTEZZA * k}px`;
  }

  const nascosta = () => {
    if (document.hidden) pausa();
  };

  let attivo = true;
  function fotogramma(ora) {
    if (!attivo) return;
    // Il timestamp di requestAnimationFrame può essere precedente a performance.now(): mai un dt negativo.
    const dt = Math.max(0, Math.min(0.1, (ora - ultimoFotogramma) / 1000));
    ultimoFotogramma = ora;

    if (stato === "gioco") {
      accumulo += dt;
      while (accumulo >= TICK && !s.finita) {
        passo(s, coda);
        coda = [];
        accumulo -= TICK;
      }
      if (s.finita) termina();
    } else if (stato === "titolo") {
      s.distanza += 70 * dt;
      s.tick = Math.floor(ora / (1000 / 60));
    }

    const dtScena = stato === "pausa" ? 0 : dt;
    effetti.aggiorna(dtScena, s);
    render.disegna(s, { record, titolo: stato === "titolo", dt: dtScena });
    requestAnimationFrame(fotogramma);
  }

  const osservatore = new ResizeObserver(adatta);
  osservatore.observe(palco);
  addEventListener("keydown", tastoGiu);
  addEventListener("keyup", tastoSu);
  addEventListener("blur", pausa);
  document.addEventListener("visibilitychange", nascosta);

  adatta();
  mostraPannello("Gioca");
  requestAnimationFrame(fotogramma);

  return function smonta() {
    attivo = false;
    osservatore.disconnect();
    removeEventListener("keydown", tastoGiu);
    removeEventListener("keyup", tastoSu);
    removeEventListener("blur", pausa);
    document.removeEventListener("visibilitychange", nascosta);
    radice.innerHTML = "";
  };
}
