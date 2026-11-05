// Trasforma i JSON degli sprite (formato SpriteForge) in canvas pronti da disegnare.

import { SPRITE_PROVVISORI } from "./sprite-provvisori.js";

function griglia(grid, palette) {
  const h = grid.length;
  const w = grid[0].length;
  const tela = document.createElement("canvas");
  tela.width = w;
  tela.height = h;
  const ctx = tela.getContext("2d");
  grid.forEach((riga, y) =>
    riga.forEach((c, x) => {
      if (c < 0) return;
      ctx.fillStyle = palette[c];
      ctx.fillRect(x, y, 1, 1);
    }),
  );
  return tela;
}

function fotogrammi(dati) {
  const griglie = dati.frames ? dati.frames.map((f) => f.grid) : [dati.grid];
  return griglie.map((g) => griglia(g, dati.palette));
}

/** Copia dello sprite spenta verso il nero: `quanto` da 0 a 1. */
export function scurito(tela, quanto) {
  const copia = document.createElement("canvas");
  copia.width = tela.width;
  copia.height = tela.height;
  const ctx = copia.getContext("2d");
  ctx.drawImage(tela, 0, 0);
  ctx.globalCompositeOperation = "source-atop";
  ctx.globalAlpha = quanto;
  ctx.fillStyle = "#05020a";
  ctx.fillRect(0, 0, copia.width, copia.height);
  return copia;
}

/** Copia dello sprite con un bordo di 1 px tutto intorno, per staccarlo dal fondo. */
export function conBordo(tela, colore) {
  const sagoma = document.createElement("canvas");
  sagoma.width = tela.width;
  sagoma.height = tela.height;
  const ctxSagoma = sagoma.getContext("2d");
  ctxSagoma.drawImage(tela, 0, 0);
  ctxSagoma.globalCompositeOperation = "source-in";
  ctxSagoma.fillStyle = colore;
  ctxSagoma.fillRect(0, 0, sagoma.width, sagoma.height);

  const risultato = document.createElement("canvas");
  risultato.width = tela.width + 2;
  risultato.height = tela.height + 2;
  const ctx = risultato.getContext("2d");
  for (const [x, y] of [[0, 1], [2, 1], [1, 0], [1, 2]]) ctx.drawImage(sagoma, x, y);
  ctx.drawImage(tela, 1, 1);
  return risultato;
}

/** Quelli elencati in assets/sprite/elenco.json sono i disegni veri, gli altri restano provvisori. */
export async function caricaSprite(base) {
  const veri = {};
  const elenco = await fetch(new URL("assets/sprite/elenco.json", base)).then((r) => (r.ok ? r.json() : []));
  await Promise.all(
    elenco.map(async (nome) => {
      veri[nome] = await fetch(new URL(`assets/sprite/${nome}.json`, base)).then((r) => r.json());
    }),
  );
  return Object.fromEntries(
    Object.entries({ ...SPRITE_PROVVISORI, ...veri }).map(([nome, dati]) => [nome, fotogrammi(dati)]),
  );
}
