// Punti e moltiplicatore, condivisi fra la corsa (sim.js) e il duello col boss (boss.js).

import { VITE, X_ZUCCO } from "./costanti.js";

export const PIXEL_PER_PUNTO = 12;
export const LUNE_PER_PREMIO = 3;
export const PUNTI_TRE_LUNE = 1000;

const MOLTIPLICATORE_MINIMO = 1;
const PIU_CARAMELLA = 0.01;
const MENO_CARAMELLA = 0.1;
const MENO_VITA = 0.3;

function sposta(s, quanto) {
  s.moltiplicatore = Math.max(MOLTIPLICATORE_MINIMO, Math.round((s.moltiplicatore + quanto) * 100) / 100);
}

/** Il moltiplicatore vale per i punti che arrivano adesso: quelli già fatti non si perdono. */
export function guadagna(s, punti) {
  s.punti += punti * s.moltiplicatore;
}

export const caramellaPresa = (s) => sposta(s, PIU_CARAMELLA);

export function caramellaPersa(s, d) {
  const prima = s.moltiplicatore;
  sposta(s, -MENO_CARAMELLA);
  if (s.moltiplicatore < prima) s.alEvento({ tipo: "caramellaPersa", x: d.x, y: d.y });
}

export function perdiVita(s) {
  s.vite--;
  s.lunePulite = 0;
  sposta(s, -MENO_VITA);
}

/** Tre lune di fila senza perdere vite: se ne manca una torna, con tutte le vite sono punti extra. */
export function lunaAccesa(s) {
  s.lunePulite++;
  if (s.lunePulite < LUNE_PER_PREMIO) return;
  s.lunePulite = 0;
  const y = s.zucco.y - 14;
  if (s.vite < VITE) {
    s.vite++;
    s.alEvento({ tipo: "vitaRecuperata", x: X_ZUCCO, y });
    return;
  }
  guadagna(s, PUNTI_TRE_LUNE);
  s.alEvento({ tipo: "treLune", x: X_ZUCCO, y, punti: Math.round(PUNTI_TRE_LUNE * s.moltiplicatore) });
}
