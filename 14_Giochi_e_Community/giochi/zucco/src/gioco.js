// Monta il gioco dentro un elemento: basta questo per inserirlo in una pagina del sito.

import { creaAudio } from "./audio.js";
import { TEMPO_BOSS } from "./boss.js";
import { DURATA_CINEMATICA, SUONI_CINEMATICA } from "./cinematica.js";
import { creaTabellone } from "./classifica.js";
import { creaEffetti } from "./effetti.js";
import { creaRender } from "./render.js";
import { ALTEZZA, IN, LARGHEZZA, TICK, creaPartita, passo, punteggio, risultato } from "./sim.js";
import { caricaSprite } from "./sprite.js";

const CHIAVE_RECORD = "zucco.record";
const CHIAVE_MUTO = "zucco.muto";
const ATTESA_RIGIOCA = 450;
const ATTESA_AIUTO = 1500;

const MARKUP = `
  <div class="zucco-palco">
    <canvas class="zucco-schermo" width="${LARGHEZZA}" height="${ALTEZZA}" aria-label="La fuga di Zucco"></canvas>
    <div class="zucco-pannello">
      <p class="zucco-esito" hidden></p>
      <form class="zucco-nome" hidden>
        <input class="zucco-campo" type="text" placeholder="Il tuo nome" aria-label="Il tuo nome per la classifica" autocomplete="nickname" enterkeyhint="send" spellcheck="false" required />
        <button class="zucco-salva" type="submit">Salva</button>
      </form>
      <div class="zucco-classifica" hidden>
        <h2>Classifica</h2>
        <ol class="zucco-elenco" hidden></ol>
        <p class="zucco-avviso" hidden></p>
      </div>
      <div class="zucco-azioni">
        <button class="zucco-gioca" type="button">Gioca</button>
        <button class="zucco-suono" type="button" aria-label="Audio" aria-pressed="true">&#9835;</button>
        <button class="zucco-tabella" type="button" aria-label="Classifica" title="Classifica" aria-expanded="false" hidden>&#9819;</button>
        <button class="zucco-aiuto" type="button" aria-label="Comandi" aria-expanded="false">?</button>
      </div>
      <div class="zucco-comandi" hidden>
        <p><b>Salta:</b> spazio, freccia su o tocco. Tieni premuto per saltare più in alto.</p>
        <p><b>Scivola:</b> freccia giù. In aria ti fa scendere prima.</p>
        <p><b>Mazza:</b> nel finale, tasto X o freccia destra.</p>
        <p><b>Audio:</b> tasto M o la nota qui accanto. In cuffia si sente da dove arrivano le cose.</p>
        <p><b>Caramelle:</b> con 20 arriva la luna piena e per 6 secondi rompi tutto.</p>
      </div>
    </div>
  </div>
  <div class="zucco-tocco">
    <button class="zucco-scivola" type="button">Scivola</button>
    <button class="zucco-mazza" type="button" hidden>Mazza</button>
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

function leggiMuto() {
  try {
    return localStorage.getItem(CHIAVE_MUTO) === "1";
  } catch {
    return false;
  }
}

function salvaMuto(valore) {
  try {
    localStorage.setItem(CHIAVE_MUTO, valore ? "1" : "0");
  } catch {
    // Senza storage la scelta dura solo fino alla chiusura della pagina.
  }
}

const nuovoSeme = () => crypto.getRandomValues(new Uint32Array(1))[0];

/**
 * `seme`: se il server apre la sessione di gioco, è lui a dare il seed.
 * `alTermine(risultato)`: riceve seed, input e punteggio da mandare al server.
 * `alFotogramma(partita, stato)`: chiamata a ogni fotogramma, per chi vuole seguire la partita da fuori.
 * `classifica`: `{ leggi, salva }`, vedi classifica.js. Senza, il gioco non propone di salvare il nome.
 */
export async function avviaGioco(radice, { seme = nuovoSeme, alTermine = () => {}, alFotogramma = () => {}, classifica = null } = {}) {
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
  const tastoSuono = trova("suono");
  const tastoMazza = trova("mazza");
  const barraTocco = trova("tocco");
  const daSecondo = new URLSearchParams(location.search).has("boss") ? TEMPO_BOSS - 1 : 0;

  const movimentoRidotto = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const sprite = await caricaSprite(new URL("../", import.meta.url));
  const effetti = creaEffetti({ scosseAttive: !movimentoRidotto, sprite });
  const render = creaRender(schermo, sprite, effetti);
  const audio = creaAudio({ muto: leggiMuto() });
  const tabellone = creaTabellone(trova, classifica, {
    attesa: ATTESA_RIGIOCA,
    alMostra: () => mostraAiuto(false),
    dopoSalvato: () => bottone.focus({ preventScroll: true }),
  });

  let s = creaPartita(0);
  let stato = "titolo";
  let record = leggiRecord();
  let coda = [];
  let accumulo = 0;
  let ultimoFotogramma = performance.now();
  let fineAlle = 0;
  let tempoFilm = 0;
  let prossimoSuono = 0;
  let risultatoInviato = false;

  function mostraPannello(testoBottone, testoEsito = "") {
    bottone.textContent = testoBottone;
    esito.textContent = testoEsito;
    esito.hidden = !testoEsito;
    pannello.classList.toggle("in-fondo", stato === "fine" && s.vinta);
    pannello.hidden = false;
    bottone.focus({ preventScroll: true });
  }

  function inizia() {
    effetti.svuota();
    audio.avvia();
    s = creaPartita(
      seme(),
      (e) => {
        effetti.evento(e);
        audio.evento(e);
      },
      { daSecondo },
    );
    coda = [];
    accumulo = 0;
    stato = "gioco";
    pannello.hidden = true;
    comandi.hidden = true;
    aiuto.setAttribute("aria-expanded", "false");
    tabellone.chiudi();
  }

  function pausa() {
    if (stato !== "gioco") return;
    stato = "pausa";
    audio.pausa();
    mostraPannello("Riprendi");
  }

  function riprendi() {
    stato = "gioco";
    audio.riprendi();
    pannello.hidden = true;
    coda = [];
    // I tasti tenuti prima della pausa non hanno più il loro rilascio.
    if (s.tieniSalto) coda.push(IN.SALTO_SU);
    if (s.tieniGiu) coda.push(IN.SCIVOLA_SU);
  }

  function termina() {
    stato = "fine";
    audio.fine();
    fineAlle = performance.now();
    const punti = punteggio(s);
    const nuovoRecord = !s.prova && punti > record;
    if (nuovoRecord) {
      record = punti;
      salvaRecord(record);
    }
    const dolci = s.caramelle === 1 ? "1 caramella" : `${s.caramelle} caramelle`;
    const esitoPartita = s.vinta ? "Hai battuto il Padrone delle Mani!" : `Stage ${s.stage}:`;
    mostraPannello("Rigioca", `${nuovoRecord ? "Nuovo record! " : ""}${esitoPartita} ${punti} punti, ${dolci}`);
    if (nuovoRecord) tabellone.proponi(risultato(s));
    if (!risultatoInviato) alTermine(risultato(s));
    risultatoInviato = false;
  }

  function avviaCinematica() {
    stato = "cinematica";
    tempoFilm = 0;
    prossimoSuono = 0;
    effetti.svuota();
    audio.cinematica();
    alTermine(risultato(s));
    risultatoInviato = true;
    tastoMazza.hidden = true;
    barraTocco.classList.remove("con-mazza");
  }

  /** `deciso`: arriva dal tasto Rigioca, l'unico che può lasciare un record senza nome. */
  function azionePrincipale(deciso = false) {
    if (stato === "cinematica" && tempoFilm > 0.6) termina();
    else if (stato === "pausa") riprendi();
    else if (stato === "titolo") inizia();
    else if (stato === "fine" && performance.now() - fineAlle > ATTESA_RIGIOCA && (deciso || !tabellone.inAttesa)) inizia();
  }

  const premi = (codice) => {
    if (stato === "gioco") coda.push(codice);
  };

  bottone.addEventListener("click", () => azionePrincipale(true));

  function alternaSuono() {
    audio.muto = !audio.muto;
    salvaMuto(audio.muto);
    tastoSuono.setAttribute("aria-pressed", String(!audio.muto));
  }

  tastoSuono.setAttribute("aria-pressed", String(!audio.muto));
  tastoSuono.addEventListener("click", alternaSuono);

  const TASTI_SALTO = new Set(["Space", "ArrowUp", "KeyW"]);
  const TASTI_GIU = new Set(["ArrowDown", "KeyS"]);
  const TASTI_MAZZA = new Set(["KeyX", "ArrowRight", "KeyD"]);

  function tastoGiu(e) {
    // Mentre si scrive il nome, M, X, D e lo spazio sono solo lettere.
    if (e.target instanceof HTMLInputElement) return;
    if (e.code === "Escape" || e.code === "KeyP") {
      if (stato === "gioco") pausa();
      else if (stato === "pausa") riprendi();
      return;
    }
    if (e.code === "KeyM" && !e.repeat) return alternaSuono();
    if (TASTI_MAZZA.has(e.code)) {
      e.preventDefault();
      if (!e.repeat) premi(IN.MAZZA);
      return;
    }
    const salto = TASTI_SALTO.has(e.code);
    if (!salto && !TASTI_GIU.has(e.code)) return;
    e.preventDefault();
    if (e.repeat) return;
    if (stato !== "gioco") {
      if (salto) azionePrincipale(e.target === bottone);
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
  tastoMazza.addEventListener("pointerdown", (e) => {
    e.preventDefault();
    premi(IN.MAZZA);
  });

  let timerAiuto = 0;
  const mostraAiuto = (visibile) => {
    comandi.hidden = !visibile;
    aiuto.setAttribute("aria-expanded", String(visibile));
    if (visibile) tabellone.nascondi();
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
      audio.aggiorna(s);
      const duello = s.boss?.fase === "duello";
      if (duello === tastoMazza.hidden) {
        tastoMazza.hidden = !duello;
        barraTocco.classList.toggle("con-mazza", duello);
      }
      if (s.finita) {
        if (s.vinta) avviaCinematica();
        else termina();
      }
    } else if (stato === "cinematica") {
      tempoFilm += dt;
      while (prossimoSuono < SUONI_CINEMATICA.length && SUONI_CINEMATICA[prossimoSuono][0] <= tempoFilm) {
        const tipo = SUONI_CINEMATICA[prossimoSuono++][1];
        audio.evento({ tipo });
        effetti.evento({ tipo, x: 164, y: 150 });
      }
      if (tempoFilm >= DURATA_CINEMATICA) termina();
    } else if (stato === "titolo") {
      s.distanza += 70 * dt;
      s.tick = Math.floor(ora / (1000 / 60));
    }

    alFotogramma(s, stato);
    const dtScena = stato === "pausa" ? 0 : dt;
    effetti.aggiorna(dtScena, s);
    if (stato === "cinematica") render.cinematica(tempoFilm);
    else if (stato === "fine" && s.vinta) render.cinematica(DURATA_CINEMATICA);
    else render.disegna(s, { record, titolo: stato === "titolo", dt: dtScena });
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
    audio.chiudi();
    osservatore.disconnect();
    removeEventListener("keydown", tastoGiu);
    removeEventListener("keyup", tastoSu);
    removeEventListener("blur", pausa);
    document.removeEventListener("visibilitychange", nascosta);
    radice.innerHTML = "";
  };
}
