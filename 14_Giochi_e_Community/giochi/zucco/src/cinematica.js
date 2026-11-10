// La scena dopo la vittoria: Zucco entra alla festa, ordina al bancone e brinda. È solo racconto, la partita è già finita.

import { ALTEZZA, COLORE_BRAND, LARGHEZZA, SUOLO } from "./costanti.js";

export const DURATA_CINEMATICA = 26;

export const SUONI_CINEMATICA = [
  [2.5, "porta"],
  [6.1, "parla"],
  [8.3, "parla"],
  [9.3, "versa"],
  [10.3, "versa"],
  [11.3, "spuma"],
  [12.8, "bicchiere"],
  [13.3, "bicchiere"],
  [15.9, "sorso"],
  [16.6, "sorso"],
  [17.5, "evviva"],
];

const FINE_ESTERNO = 3.2;
const INIZIO_PRIMO_PIANO = 15;
const X_PORTA = 161;
const BANCONE = 124;
const X_BANCONE = 172;
const X_BARISTA = 248;
const X_ZUCCO_BANCONE = 150;

const CAMPARI = "#c8242c";
const VERMOUTH = "#8a3a1e";
const PROSECCO = "#f0b84a";

const tra = (a, b, k) => a + (b - a) * Math.max(0, Math.min(1, k));
const dolce = (k) => {
  const c = Math.max(0, Math.min(1, k));
  return c * c * (3 - 2 * c);
};

export function creaCinematica({ ctx, sprite, effetti, casa, cielo, suolo, scrivi }) {
  function rett(c, x, y, w, h) {
    ctx.fillStyle = c;
    ctx.fillRect(Math.round(x), Math.round(y), w, h);
  }

  function fumetto(x, y, righe) {
    const largo = Math.max(...righe.map((r) => r.length)) * 6 + 8;
    const alto = righe.length * 9 + 6;
    rett("#160f1e", x - 1, y - 1, largo + 2, alto + 2);
    rett("#fff3d6", x, y, largo, alto);
    rett("#fff3d6", x + 10, y + alto, 5, 3);
    rett("#160f1e", x + 10, y + alto + 3, 3, 2);
    righe.forEach((r, i) => scrivi(r, x + 4, y + 4 + i * 9, { colore: "#160f1e", ombra: null }));
  }

  /** Il bicchiere basso del negroni, con il livello del liquido da 0 a 1. */
  function bicchiere(x, y, scala, livello, colore, fetta) {
    const w = 11 * scala, h = 13 * scala;
    const pieno = Math.round((h - 2 * scala) * livello);
    rett("#160f1e", x - scala, y - h - scala, w + 2 * scala, h + 2 * scala);
    rett("#3b3a55", x, y - h, w, h);
    if (pieno > 0) rett(colore, x + scala, y - scala - pieno, w - 2 * scala, pieno);
    rett("#c3e0f0", x + scala, y - h + scala, scala, h - 3 * scala);
    if (fetta) {
      rett("#f59a2e", x + w - 2 * scala, y - h - 3 * scala, 4 * scala, 4 * scala);
      rett("#ffd07a", x + w - scala, y - h - 2 * scala, 2 * scala, 2 * scala);
    }
  }

  function esterno(t) {
    ctx.drawImage(cielo, 0, 0, LARGHEZZA, cielo.height);
    for (let x = 0; x < LARGHEZZA; x += suolo.width) ctx.drawImage(suolo, x, SUOLO);
    ctx.drawImage(casa, 70, SUOLO - casa.height + 1);

    const k = t / 2.4;
    const img = sprite.zucco_corsa[Math.floor(t * 11) % sprite.zucco_corsa.length];
    if (t > 2.3) rett("#fff3b0", X_PORTA - 9, SUOLO - 28, 18, 29);
    if (t < 2.75) ctx.drawImage(img, Math.round(tra(14, X_PORTA - 14, k)), SUOLO - img.height + 1);

    const buio = (t - 2.7) / 0.5;
    if (buio > 0) {
      ctx.globalAlpha = Math.min(1, buio);
      rett("#030104", 0, 0, LARGHEZZA, ALTEZZA);
      ctx.globalAlpha = 1;
    }
  }

  function sala(t) {
    rett("#1c1230", 0, 0, LARGHEZZA, ALTEZZA);
    for (let y = 8; y < SUOLO; y += 12)
      for (let x = (y / 12) % 2 ? 0 : 10; x < LARGHEZZA; x += 20) rett("#241838", x, y, 18, 1);
    rett("#2d1c3a", 0, SUOLO, LARGHEZZA, ALTEZZA - SUOLO);
    for (let x = 0; x < LARGHEZZA; x += 16) rett("#3a2546", x, SUOLO, 8, ALTEZZA - SUOLO);

    // Le luci della festa.
    const colori = ["#ff6fa8", "#37d6c2", "#ffe45e", "#a47bf0"];
    for (let i = 0; i < 20; i++) {
      const y = 6 + Math.round(Math.abs(Math.sin(i * 0.7)) * 5);
      rett("#160f1e", i * 17, y - 1, 1, 2);
      ctx.globalAlpha = (i + Math.floor(t * 4)) % 3 ? 1 : 0.35;
      rett(colori[i % 4], i * 17, y + 1, 3, 3);
      ctx.globalAlpha = 1;
    }
    ctx.globalAlpha = 0.1;
    for (let i = 0; i < 3; i++) {
      const x = 70 + Math.sin(t * 1.3 + i * 2) * 60;
      ctx.fillStyle = colori[i];
      ctx.beginPath();
      ctx.moveTo(70, 0);
      ctx.lineTo(x - 18, SUOLO);
      ctx.lineTo(x + 18, SUOLO);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    // Gli scaffali, poi il barista e il bancone.
    for (const y of [40, 72]) {
      rett("#5a3a26", 186, y, 130, 3);
      for (let x = 192, i = 0; x < 308; x += 13, i++) {
        const c = [CAMPARI, "#2d5a2e", PROSECCO, "#7b55c4", VERMOUTH][(i + y) % 5];
        rett("#160f1e", x - 1, y - 19, 8, 19);
        rett(c, x, y - 15, 6, 15);
        rett(c, x + 2, y - 18, 2, 3);
      }
    }

    const scheletro = sprite.orda_scheletro;
    const movimento = t > 9 && t < 12.6 ? Math.floor(t * 8) % scheletro.length : 0;
    ctx.save();
    ctx.translate(X_BARISTA, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(scheletro[movimento], -9, BANCONE - 18);
    ctx.restore();
    rett("#c8242c", X_BARISTA - 3, BANCONE - 10, 6, 2);

    rett("#3a2418", X_BANCONE, BANCONE, LARGHEZZA - X_BANCONE, SUOLO - BANCONE + 1);
    rett("#7a5a44", X_BANCONE - 2, BANCONE, LARGHEZZA - X_BANCONE + 2, 3);
    for (let x = X_BANCONE + 8; x < LARGHEZZA; x += 22) rett("#2a1a12", x, BANCONE + 6, 16, SUOLO - BANCONE - 8);

    // L'orda inseguiva Zucco solo per portarlo qui: ora balla.
    const ballerini = ["orda_zombie", "orda_diavoletto", "orda_lupo", "orda_scheletro"];
    ballerini.forEach((nome, i) => {
      const f = sprite[nome];
      const img = f[Math.floor(t * 6 + i) % f.length];
      const salto = Math.abs(Math.sin(t * 5 + i * 1.4)) * 7;
      ctx.drawImage(img, 18 + i * 30, Math.round(SUOLO + 6 - img.height - salto));
    });

    // Zucco arriva al bancone e ordina.
    const k = (t - FINE_ESTERNO) / 2.3;
    const cammina = k < 1;
    const img = sprite.zucco_corsa[cammina ? Math.floor(t * 11) % sprite.zucco_corsa.length : 0];
    ctx.drawImage(img, Math.round(tra(-24, X_ZUCCO_BANCONE - 14, k)), SUOLO - img.height + 1);

    if (t > 6 && t < 8.1) fumetto(70, 66, ["UN NEGRONI", "SBAGLIATO, GRAZIE!"]);
    if (t > 8.2 && t < 9.1) fumetto(196, 78, ["SUBITO!"]);

    // Campari, vermouth e prosecco, uno dopo l'altro.
    const xVersa = 232;
    const dosi = [[9.2, CAMPARI], [10.2, VERMOUTH], [11.2, PROSECCO]];
    let livello = 0;
    for (const [inizio, colore] of dosi) {
      const u = t - inizio;
      livello += Math.max(0, Math.min(1, u / 0.8)) / 3;
      if (u > 0 && u < 0.85) {
        rett("#160f1e", xVersa + 8, BANCONE - 42, 16, 7);
        rett(colore, xVersa + 9, BANCONE - 41, 14, 5);
        rett(colore, xVersa + 7, BANCONE - 38, 2, 2);
        rett(colore, xVersa + 5, BANCONE - 37, 1, 22);
      }
    }
    const colore = t > 11.2 ? PROSECCO : t > 10.2 ? VERMOUTH : CAMPARI;
    const servito = t > 12 ? "#d9502a" : colore;
    if (t > 8.9) {
      const scivola = dolce((t - 12.3) / 0.9);
      bicchiere(Math.round(tra(xVersa, X_BANCONE + 4, scivola)), BANCONE, 1, livello, servito, t > 11.9);
    }
    if (t > 11.3 && t < 12.2)
      for (let i = 0; i < 3; i++) rett("#fff3d6", xVersa + 3 + i * 2, BANCONE - 5 - ((t * 40 + i * 4) % 8), 1, 1);

    const buio = (t - 14.5) / 0.5;
    if (buio > 0) {
      ctx.globalAlpha = Math.min(1, buio);
      rett("#030104", 0, 0, LARGHEZZA, ALTEZZA);
      ctx.globalAlpha = 1;
    }
  }

  function primoPiano(t) {
    const u = t - INIZIO_PRIMO_PIANO;
    rett("#1c1230", 0, 0, LARGHEZZA, ALTEZZA);
    const colori = ["#ff6fa8", "#37d6c2", "#ffe45e", "#a47bf0"];
    for (let i = 0; i < 14; i++) {
      const x = (i * 53 + Math.sin(t + i) * 8) % LARGHEZZA, y = 18 + ((i * 37) % 120);
      ctx.globalAlpha = 0.22;
      ctx.fillStyle = colori[i % 4];
      ctx.beginPath();
      ctx.arc(x, y, 9 + (i % 3) * 3, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    const cx = 140, cy = 92;
    rett("#160f1e", cx - 56, 136, 112, 44);
    rett("#6a43b8", cx - 54, 138, 108, 42);
    rett("#a47bf0", cx - 54, 138, 108, 4);
    const testa = sprite.zucco_testa[0];
    const su = Math.sin(t * 3) * 1.5;
    ctx.drawImage(testa, cx - 49, Math.round(cy - 56 + su), testa.width * 7, testa.height * 7);

    const alza = dolce((u - 0.3) / 0.6) - dolce((u - 2.5) / 0.5);
    const sorso = Math.max(0, Math.min(1, (u - 0.9) / 1.6));
    const x = tra(236, 178, alza), y = tra(176, 142, alza);
    bicchiere(Math.round(x), Math.round(y), 4, 0.86 - sorso * 0.7, "#d9502a", true);
    rett("#160f1e", x + 44, y - 24, 12, 26);
    rett("#6a43b8", x + 45, y - 23, 10, 24);

    effetti.disegna(ctx);

    if (u > 2.6) {
      const iride = dolce((u - 3.8) / 2.7);
      const scritta = u < 6.2;
      if (scritta) scrivi("BUONA FESTA!", 164, 26, { centro: true, colore: "#ffe45e", scala: 3 });
      const raggio = tra(240, 0, iride);
      ctx.fillStyle = "#030104";
      ctx.beginPath();
      ctx.rect(0, 0, LARGHEZZA, ALTEZZA);
      ctx.arc(cx, cy - 8, raggio, 0, Math.PI * 2);
      ctx.fill("evenodd");
    }
    if (u > 6.5) saluto();
  }

  function saluto() {
    const scala = 3, passo = 6 * scala;
    const x = (LARGHEZZA - "GETINVOLVED".length * passo) / 2;
    scrivi("GET", x, 44, { colore: "#ffffff", scala });
    scrivi("INVOLVED", x + 3 * passo, 44, { colore: COLORE_BRAND, scala });
    scrivi("TI AUGURA UN", LARGHEZZA / 2, 76, { centro: true, colore: "#ffe45e", scala });
    scrivi("BUON HALLOWEEN!", LARGHEZZA / 2, 108, { centro: true, colore: "#f59a2e", scala });
  }

  return {
    disegna(t) {
      if (t < FINE_ESTERNO) esterno(t);
      else if (t < INIZIO_PRIMO_PIANO) sala(t);
      else primoPiano(t);
    },
  };
}
