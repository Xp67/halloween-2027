// Numeri condivisi fra la corsa (sim.js) e il duello col boss (boss.js).

export const LARGHEZZA = 320;
export const ALTEZZA = 180;
export const SUOLO = 150;
export const TICK = 1 / 60;
export const X_ZUCCO = 56;
export const VITE = 3;
export const DURATA_STAGE = 20;

export const COLORE_BRAND = "#aaa5ff";

export const GRAVITA = 1150;
export const SPINTA = -345;
export const TAGLIO_SALTO = -150;
export const GRAVITA_PICCHIATA = 2.4;
export const BUFFER_SALTO = 7;
export const TOLLERANZA_BORDO = 5;
export const GRAZIA_COLPO = 1.5;

// La mazza a ogni tick dello swing, in gradi: fa un giro intero, dalla spalla giù dietro Zucco, orizzontale
// in avanti al contatto (-360) e di nuovo su, sopra la spalla. In salita, come un fuoricampo.
export const ANGOLI_SWING = [-125, -150, -190, -240, -300, -360, -415, -455, -485, -505, -515, -518, -515, -510, -503, -496, -490, -485];
export const CONTATTO_SWING = 5;

export const IN = { SALTO_GIU: 1, SALTO_SU: 2, SCIVOLA_GIU: 3, SCIVOLA_SU: 4, MAZZA: 5 };
