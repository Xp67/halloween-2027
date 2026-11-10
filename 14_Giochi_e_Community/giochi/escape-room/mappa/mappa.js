// La mappa del posto in pixel art, vista dall'alto a tre quarti: il piano terra e il primo piano.
// Ricalca la pianta disegnata nella linguetta «Mappa del posto» del catalogo (griglia 64×40). Ogni unità della
// griglia è S = 20 pixel: la Sala principale viene circa 320×180, grande come gli sfondi delle stanze e come la
// fuga di Zucco, così nel gioco ogni sala riempie la scena con pixel piccoli.
// Le stanze sono tagliate via del soffitto; i muri mostrano la faccia rivolta in basso, e chi sta più giù copre
// chi sta dietro. La geometria qui sotto (stanze, porte, salita) serve anche al gioco: frecce, segnaposto, telecamera.
import { C, casuale, rett, linea, retino, bagliore } from "../sfondi/sfondi.js";

export const S = 20;
export const MAPPA_L = 36 * S;
export const MAPPA_A = 38 * S;
// L'origine in quadretti: (17, 2) per la pianta intera, (0, 0) per le sale a schermata intera.
let OX = 17;
let OY = 2;
const px = (u) => Math.round((u - OX) * S);
const py = (v) => Math.round((v - OY) * S);
function conOrigine(x, y, disegna) {
  const prima = [OX, OY];
  [OX, OY] = [x, y];
  try { disegna(); } finally { [OX, OY] = prima; }
}

const B4 = [[0, 8, 2, 10], [12, 4, 14, 6], [3, 11, 1, 9], [15, 7, 13, 5]];
const dith = (x, y) => B4[y & 3][x & 3] / 16 - 0.47;
const NERO = "#0c0812";

// ── Animazione ──
// Ogni sala si può disegnare in un istante del «giro», che dura GIRO.fotogrammi fotogrammi a GIRO.fps al secondo e poi
// ricomincia: personaggi, fiamme e luci si muovono col giro, ognuno sfasato. Alcune cose sono invece «eventi», che
// partono, finiscono e ripartono dopo un'attesa a caso decisa dalla pagina: il fumo dei fumatori (da 2 a 5 secondi) e
// il manichino che gira la testa. La sala ferma (fase 0, nessun evento in corso, senza fumo) è `sale.png`; le
// animazioni le prepara `animazioni()`, in fondo al file.
export const GIRO = { fotogrammi: 24, fps: 8 };
const ANIMA = { fase: 0, fumo: true, eventi: null, evento: null, fumatori: null, sala: null };

/** Un numero fra 0 e 1 che dipende solo da `n`: lo stesso a ogni disegno (tremolii, scintille, sfasamenti). */
function caso(n) {
  let a = Math.imul(Math.round(n) ^ 0x9e3779b9, 0x85ebca6b);
  a = Math.imul(a ^ (a >>> 13), 0xc2b2ae35);
  return ((a ^ (a >>> 16)) >>> 0) / 4294967296;
}
/** Il passo del giro, da 0 a n-1, per una cosa sfasata di `sfaso` (da 0 a 1). */
const passo = (sfaso = 0, n = GIRO.fotogrammi) => Math.floor((((ANIMA.fase + sfaso) % 1) + 1) % 1 * n) % n;
/** Lo sfasamento fisso della cosa in (x, y): così le cose uguali non si muovono tutte insieme. */
const sfasoDi = (x, y) => caso(x * 97 + y * 389);
/** Il battito della musica: cambia ogni 3 fotogrammi, 8 battiti per giro, uguale per tutti. */
const battito = () => Math.floor(passo() / 3);
/** Una fiamma trema fra tre forme, a caso a ogni fotogramma (0, 1 o 2). */
const fiammella = (x, y) => Math.floor(caso(x * 3109 + y * 1013 + passo() * 7) * 3);

/**
 * Un evento della sala che si sta disegnando: lo iscrive (quando si esportano le animazioni) e dice a che punto è,
 * da 0 a 1, oppure null quando non è in corso (cioè quasi sempre).
 */
function evento(id, opzioni) {
  const chiave = `${ANIMA.sala}:${id}`;
  ANIMA.eventi?.push({ id: chiave, stanza: ANIMA.sala, ...opzioni });
  return ANIMA.evento?.id === chiave ? ANIMA.evento.k : null;
}

// ── Geometria (unità della griglia della mappa) ──

/** Le stanze: piano, rettangoli [x, y, larghezza, altezza] e il punto dove sta il segnaposto. */
export const STANZE = {
  cancello: { piano: "piano-terra", zone: [[20, 32, 11, 5], [26, 19, 2, 13], [28, 28, 3, 4]], centro: [24, 34.8] },
  ingresso: { piano: "piano-terra", zone: [[24, 14, 7, 5], [31, 14, 2, 3]], centro: [25.5, 17.8] },
  deposito: { piano: "piano-terra", zone: [[28, 19, 3, 9]], centro: [29.5, 23.5] },
  "sala-principale": { piano: "piano-terra", zone: [[31, 5, 15, 9]], centro: [38.5, 11] },
  // Il bar è un angolo della Sala principale; nella striscia sotto la sala ci sono bagni, spogliatoi e il corridoio.
  "sala-bar": { piano: "piano-terra", zone: [[31, 11, 5, 3]], centro: [33.5, 13.2] },
  corridoio: { piano: "piano-terra", zone: [[33, 14, 13, 3]], centro: [37.5, 16.8] },
  "area-fumatori": { piano: "piano-terra", zone: [[46, 7, 4, 10], [47, 17, 3, 1], [47, 18, 1, 3]], centro: [48, 12.5] },
  "sala-del-tesoro": { piano: "primo-piano", zone: [[30, 16, 12, 12]], centro: [32.5, 25.5] },
};

/**
 * Le porte fra due stanze: dove sta la freccia e verso dove punta, guardando dalla prima e dalla seconda stanza.
 * La salita ha due punti: ai piedi (piano terra) e in cima (primo piano).
 */
export const PORTE = [
  { tra: ["cancello", "ingresso"], punti: [[27, 19], [27, 19]], versi: ["su", "giu"] },
  { tra: ["ingresso", "deposito"], punti: [[30.5, 19], [30.5, 19]], versi: ["giu", "su"] },
  { tra: ["ingresso", "sala-principale"], punti: [[32, 14], [32, 14]], versi: ["su", "giu"] },
  { tra: ["sala-principale", "sala-bar"], punti: [[35, 11.6], [35, 11.6]], versi: ["giu", "su"] },
  { tra: ["ingresso", "corridoio"], punti: [[33, 16.4], [33, 16.4]], versi: ["dx", "sx"] },
  { tra: ["corridoio", "area-fumatori"], punti: [[46, 16.4], [46, 16.4]], versi: ["dx", "sx"] },
  { tra: ["ingresso", "sala-del-tesoro"], punti: [[27.6, 16.5], [29.6, 16.5]], versi: ["dx", "sx"], salita: true },
];

/** Lo stanzino in fondo alla Sala del tesoro: la porta d'oro del premio finale, chiusa. */
export const PREMIO = { stanza: "sala-del-tesoro", punto: [39.5, 25], verso: "giu" };

// ── Disegno di base ──

function ellisse(ctx, c, cx, cy, rx, ry) {
  for (let y = -ry; y <= ry; y++) {
    const w = Math.round(rx * Math.sqrt(Math.max(0, 1 - (y * y) / (ry * ry))));
    rett(ctx, c, cx - w, cy + y, w * 2 + 1, 1);
  }
}

/** Un ovale con la luce da in alto a sinistra, a quattro toni con il retino ai passaggi: scuro, medio, chiaro, luce. */
function ovale(ctx, cx, cy, rx, ry, toni, contorno = C.bordo) {
  for (let y = -ry - 1; y <= ry + 1; y++)
    for (let x = -rx - 1; x <= rx + 1; x++) {
      if (Math.hypot(x / (rx + 0.5), y / (ry + 0.5)) > 1) continue;
      const X = cx + x, Y = cy + y;
      if (contorno && Math.hypot(x / Math.max(0.5, rx - 0.5), y / Math.max(0.5, ry - 0.5)) > 1) { rett(ctx, contorno, X, Y, 1, 1); continue; }
      const l = (-x / rx - y / ry) * 0.7 + dith(X, Y) * 0.35;
      rett(ctx, l > 0.6 ? toni[3] : l > 0.05 ? toni[2] : l > -0.5 ? toni[1] : toni[0], X, Y, 1, 1);
    }
}

function ombraTerra(ctx, cx, cy, rx, ry, forza = 0.75) {
  retino(ctx, NERO, cx - rx, cy - ry, rx * 2 + 1, ry * 2 + 1, (x, y) => forza * (1.25 - Math.hypot((x - cx) / rx, (y - cy) / ry)) * 1.6);
}

/** Una scatola vista a tre quarti, in pixel: piano sopra profondo `prof`, faccia davanti alta `alto`, base in `base`. */
function scatola(ctx, a, base, L, prof, alto, sopra, davanti, luce = null) {
  rett(ctx, C.bordo, a - 1, base - alto - prof - 1, L + 2, alto + prof + 2);
  rett(ctx, sopra, a, base - alto - prof, L, prof);
  if (luce) rett(ctx, luce, a, base - alto - prof, L, 1);
  rett(ctx, davanti, a, base - alto, L, alto);
  rett(ctx, NERO, a, base - alto, L, 1);
}

// ── Muri ──

const STILI = {
  casa: { faccia: "#3a2546", malta: "#24162e", luce: "#4a2f58", cima: "#1c1228", bordo: "#6a4a78", alto: 18, spess: 6 },
  interno: { faccia: "#33203f", malta: "#21142a", luce: "#432a52", cima: "#1c1228", bordo: "#5e3d6a", alto: 16, spess: 6 },
  basso: { faccia: "#33203f", malta: "#21142a", luce: "#432a52", cima: "#1c1228", bordo: "#5e3d6a", alto: 5, spess: 4 },
  muretto: { faccia: "#4f4d6a", malta: "#2e2d45", luce: "#6f6d8c", cima: "#8f8da9", bordo: "#c3c1d4", alto: 10, spess: 6, pietra: true },
  bancone: { faccia: "#5a3a26", malta: "#3a2418", luce: "#7a5a44", cima: "#7a5a44", bordo: "#ffb52e", alto: 12, spess: 6, legno: true },
  pietra: { faccia: "#2f2b40", malta: "#1d1a2a", luce: "#45405e", cima: "#16131f", bordo: "#6f6d8c", alto: 18, spess: 6, pietra: true },
  // Il muro di fondo dei corridoi, alto abbastanza per le porte dei bagni e degli spogliatoi.
  corridoio: { faccia: "#33203f", malta: "#21142a", luce: "#432a52", cima: "#1c1228", bordo: "#5e3d6a", alto: 32, spess: 6 },
  // Il muro di fondo dell'Ingresso e dell'Anti-sala, alto per il portone della scala e le porte grandi.
  atrio: { faccia: "#3a2546", malta: "#24162e", luce: "#4a2f58", cima: "#1c1228", bordo: "#6a4a78", alto: 32, spess: 6 },
};

// [stile, x0, y0, x1, y1]: orizzontali (y0 = y1) o verticali (x0 = x1). Le porte sono i buchi fra un tratto e l'altro.
const MURI_TERRA = [
  // Il cortile del Cancello: muretti di pietra; il cancello di ferro sta nel buco in basso a sinistra.
  ["muretto", 20, 32, 26, 32], ["muretto", 23, 37, 31, 37],
  ["muretto", 20, 32, 20, 37], ["muretto", 26, 19, 26, 32], ["muretto", 31, 32, 31, 37],
  // Ingresso, Deposito, Sala principale, Bar, Area Fumatori.
  ["casa", 24, 19, 26, 19], ["casa", 28, 19, 30, 19], ["casa", 24, 14, 31, 14], ["casa", 31, 5, 46, 5],
  ["casa", 46, 7, 50, 7], ["casa", 48, 18, 50, 18], ["casa", 47, 21, 48, 21], ["casa", 46, 17, 47, 17],
  ["casa", 28, 28, 31, 28], ["casa", 31, 32, 47, 32],
  ["casa", 24, 14, 24, 19], ["casa", 28, 19, 28, 28], ["casa", 31, 17, 31, 32], ["casa", 31, 5, 31, 14],
  ["casa", 46, 5, 46, 14], ["casa", 50, 7, 50, 18], ["casa", 48, 18, 48, 21], ["casa", 47, 17, 47, 32],
  ["interno", 33, 14, 46, 14], ["interno", 33, 14, 33, 16], ["interno", 46, 14, 46, 16],
  ["interno", 36, 14, 36, 16], ["interno", 39, 14, 39, 16], ["interno", 43, 14, 43, 16],
  // I due bagni e i due spogliatoi, con le porte sul corridoio, e il muretto basso del corridoio.
  ["interno", 33, 16, 35, 16], ["interno", 36, 16, 38, 16], ["interno", 39, 16, 41, 16], ["interno", 42, 16, 44, 16],
  ["interno", 45, 16, 46, 16],
  ["basso", 31, 17, 46, 17],
  // Il bancone del bar, nell'angolo in basso a sinistra della Sala principale.
  ["bancone", 31.4, 12.2, 35.8, 12.2],
];

const MURI_SOPRA = [
  // Le pareti della scala che sale dall'Ingresso.
  ["basso", 27, 16, 30, 16], ["basso", 27, 17, 30, 17],
  ["pietra", 30, 16, 42, 16], ["pietra", 30, 17, 39, 17], ["pietra", 30, 28, 42, 28],
  ["pietra", 35, 22, 39, 22], ["pietra", 35, 21, 38, 21], ["pietra", 40, 25, 42, 25],
  ["pietra", 42, 16, 42, 28], ["pietra", 30, 17, 30, 28], ["pietra", 38, 17, 38, 21], ["pietra", 35, 21, 35, 22],
  ["pietra", 39, 17, 39, 22], ["pietra", 39, 24, 39, 28],
];

function facciaDelMuro(ctx, st, a, cima, L, seme) {
  const rng = casuale(seme);
  rett(ctx, st.faccia, a, cima, L, st.alto);
  if (st.legno) {
    // Pannelli di legno con la cornice e la barra d'ottone in alto.
    for (let x = a + 2; x < a + L - 2; x += 12) {
      rett(ctx, st.malta, x, cima + 3, 10, st.alto - 5);
      rett(ctx, st.faccia, x + 1, cima + 4, 8, st.alto - 7);
      rett(ctx, st.luce, x + 1, cima + 4, 8, 1);
    }
    rett(ctx, C.oroScuro, a, cima + 1, L, 1);
  } else if (st.pietra) {
    for (let y = cima, r = 0; y < cima + st.alto; y += 6, r++) {
      for (let x = a - (r % 2) * 7; x < a + L; ) {
        const w = 10 + Math.floor(rng() * 7);
        rett(ctx, rng() > 0.7 ? st.luce : st.faccia, x + 1, y + 1, w - 2, 4);
        rett(ctx, st.luce, x + 1, y + 1, w - 3, 1);
        rett(ctx, st.malta, x, y, 1, 6);
        x += w;
      }
      rett(ctx, st.malta, a, y, L, 1);
    }
  } else {
    // Mattoni 12×5: qualcuno più caldo, qualcuno più chiaro.
    for (let y = cima, r = 0; y < cima + st.alto; y += 5, r++) {
      for (let x = a - (r % 2) * 6; x < a + L; x += 12) {
        const k = rng();
        if (k > 0.8) rett(ctx, st.luce, x + 1, y + 1, 10, 3);
        else if (k < 0.12) rett(ctx, C.muroAcceso, x + 1, y + 1, 10, 3);
        rett(ctx, st.malta, x, y, 1, 5);
      }
      rett(ctx, st.malta, a, y, L, 1);
    }
  }
  rett(ctx, NERO, a, cima + st.alto - 2, L, 2);
}

function muroOrizzontale(ctx, st, x0, x1, y) {
  const a = px(x0) - 4, b = px(x1) + 4, base = py(y), cima = base - st.alto;
  // L'ombra che il muro fa sul pavimento sotto.
  retino(ctx, NERO, a, base, b - a, 6, (x, yy) => 0.75 - (yy - base) * 0.13);
  facciaDelMuro(ctx, st, a, cima, b - a, x0 * 31 + y * 7);
  rett(ctx, st.cima, a, cima - st.spess, b - a, st.spess);
  rett(ctx, st.bordo, a, cima - st.spess, b - a, 1);
  rett(ctx, NERO, a, cima - 1, b - a, 1);
}

function muroVerticale(ctx, st, x, y0, y1) {
  const larga = st.spess + 2, c = px(x) - larga / 2, alto = py(y0) - st.alto - st.spess, basso = py(y1) - st.alto;
  rett(ctx, st.cima, c, alto, larga, basso - alto);
  rett(ctx, st.bordo, c, alto, 1, basso - alto);
  rett(ctx, NERO, c + larga - 1, alto, 1, basso - alto);
  facciaDelMuro(ctx, st, c, basso, larga, x * 13 + y1);
}

// ── Pavimenti ──

function pavimento(ctx, [x, y, w, h], tipo, seme = 1) {
  const a = px(x), b = py(y), L = w * S, A = h * S;
  const rng = casuale(seme);
  ctx.save();
  ctx.beginPath();
  ctx.rect(a, b, L, A);
  ctx.clip();
  if (tipo === "selciato") {
    rett(ctx, "#22213a", a, b, L, A);
    for (let yy = b - 3, r = 0; yy < b + A; yy += 7, r++) {
      for (let xx = a - (r % 2) * 6 - 5; xx < a + L; ) {
        const lw = 9 + Math.floor(rng() * 6);
        const tono = ["#4f4d6a", "#45435f", "#57557a", "#4a4864"][Math.floor(rng() * 4)];
        rett(ctx, tono, xx + 1, yy, lw - 3, 6);
        rett(ctx, tono, xx, yy + 1, lw - 1, 4);
        rett(ctx, "#6f6d8c", xx + 1, yy, lw - 4, 1);
        rett(ctx, "#6f6d8c", xx, yy + 1, 1, 2);
        rett(ctx, "#33324a", xx + 1, yy + 5, lw - 3, 1);
        if (rng() > 0.86) rett(ctx, "#3a5e3a", xx + lw - 1, yy + 2, 1, 3);
        xx += lw;
      }
    }
  } else if (tipo === "marmo") {
    for (let yy = b, r = 0; yy < b + A; yy += S, r++)
      for (let xx = a, i = 0; xx < a + L; xx += S, i++) {
        const chiaro = (i + r) % 2 === 0;
        rett(ctx, chiaro ? "#3d3858" : "#25213a", xx, yy, S, S);
        rett(ctx, chiaro ? "#4f4970" : "#302b48", xx, yy, S, 1);
        rett(ctx, chiaro ? "#4f4970" : "#302b48", xx, yy, 1, S);
        if (rng() > 0.4) {
          const v = Math.floor(rng() * 12);
          linea(ctx, chiaro ? "#575078" : "#36304f", xx + 2, yy + 8 + v / 2, xx + 10 + v / 2, yy + 2);
        }
        rett(ctx, "#16131f", xx + S - 1, yy, 1, S);
        rett(ctx, "#16131f", xx, yy + S - 1, S, 1);
      }
  } else if (tipo === "assi" || tipo === "assiScure") {
    const toni = tipo === "assi" ? [C.legnoScuro, C.legno, "#33201a"] : ["#1f140e", "#2a1a12", "#24170f"];
    for (let yy = b, r = 0; yy < b + A; yy += 7, r++) {
      rett(ctx, toni[r % 3], a, yy, L, 7);
      rett(ctx, tipo === "assi" ? "#4a2e20" : "#33221a", a, yy + 1, L, 1);
      rett(ctx, C.bordo, a, yy, L, 1);
      for (let xx = a + Math.floor(rng() * 30); xx < a + L; xx += 30 + Math.floor(rng() * 40)) {
        rett(ctx, C.bordo, xx, yy, 1, 7);
        rett(ctx, C.ferroChiaro, xx + 2, yy + 3, 1, 1);
        rett(ctx, C.ferroChiaro, xx - 3, yy + 3, 1, 1);
      }
      for (let i = 0; i < L / 18; i++) rett(ctx, C.bordo, a + Math.floor(rng() * L), yy + 3 + Math.floor(rng() * 3), 3 + Math.floor(rng() * 5), 1);
    }
  } else if (tipo === "pista") {
    // Le mattonelle accese cambiano a ogni battito della musica.
    const accese = [["#7a2058", "#c8408e", "#ff8acb"], ["#14646a", "#2ab4b4", "#9ff5ee"], ["#7a6414", "#d6b42a", "#fff08a"], ["#45237a", "#7a50d0", "#c8a8ff"]];
    const bt = battito();
    for (let yy = b, r = 0; yy < b + A; yy += S, r++)
      for (let xx = a, i = 0; xx < a + L; xx += S, i++) {
        if ((r * 5 + i * 3 + bt * 2) % 7 === 0) {
          const [s, m, c] = accese[(r + i + bt) % 4];
          bagliore(ctx, s, xx + S / 2, yy + S / 2, S, 0.9);
          rett(ctx, s, xx, yy, S, S);
          rett(ctx, m, xx + 2, yy + 2, S - 4, S - 4);
          rett(ctx, c, xx + 5, yy + 5, S - 10, S - 10);
          rett(ctx, "#ffffff", xx + 6, yy + 6, 2, 2);
        } else {
          rett(ctx, (i + r) % 2 ? "#241430" : "#2e1a3e", xx, yy, S, S);
          rett(ctx, "#3a2450", xx + 1, yy + 1, S - 2, 1);
          rett(ctx, "#3a2450", xx + 1, yy + 1, 1, S - 2);
        }
        rett(ctx, "#120a18", xx, yy, S, 1);
        rett(ctx, "#120a18", xx, yy, 1, S);
      }
  } else if (tipo === "scacchiera") {
    // Le piastrelle bianche e nere dei bagni, un po' sporche.
    for (let yy = b, r = 0; yy < b + A; yy += 10, r++)
      for (let xx = a, i = 0; xx < a + L; xx += 10, i++) {
        const chiaro = (i + r) % 2 === 0;
        rett(ctx, chiaro ? "#5e5c7a" : "#1d1a2a", xx, yy, 10, 10);
        rett(ctx, chiaro ? "#7a7898" : "#2a2638", xx, yy, 10, 1);
        rett(ctx, chiaro ? "#45435f" : "#16131f", xx, yy + 9, 10, 1);
        if (chiaro && rng() > 0.8) rett(ctx, "#45435f", xx + 2 + Math.floor(rng() * 5), yy + 3 + Math.floor(rng() * 4), 2, 1);
      }
  } else if (tipo === "piastrelle") {
    for (let yy = b, r = 0; yy < b + A; yy += 10, r++)
      for (let xx = a, i = 0; xx < a + L; xx += 10, i++) {
        rett(ctx, (i + r) % 2 ? "#241c2e" : "#30264a", xx, yy, 10, 10);
        rett(ctx, "#3a3058", xx, yy, 10, 1);
        rett(ctx, "#16101e", xx, yy + 9, 10, 1);
      }
  } else if (tipo === "lastre") {
    for (let yy = b, r = 0; yy < b + A; yy += 14, r++)
      for (let xx = a - (r % 2) * 10, i = 0; xx < a + L; xx += S, i++) {
        rett(ctx, ["#24243a", "#2c2c46", "#28283f"][(i + r * 2) % 3], xx, yy, S, 14);
        rett(ctx, "#3a3a58", xx + 1, yy + 1, S - 2, 1);
        rett(ctx, "#15152a", xx, yy, S, 1);
        rett(ctx, "#15152a", xx, yy, 1, 14);
        if (rng() > 0.75) linea(ctx, "#15152a", xx + 4, yy + 3, xx + 9 + Math.floor(rng() * 6), yy + 10);
      }
  } else if (tipo === "lastrePietra") {
    for (let yy = b, r = 0; yy < b + A; yy += S, r++)
      for (let xx = a - (r % 2) * 10, i = 0; xx < a + L; xx += S, i++) {
        rett(ctx, (i + r) % 2 ? "#2a2638" : "#33304a", xx, yy, S, S);
        rett(ctx, "#45405e", xx + 1, yy + 1, S - 2, 1);
        rett(ctx, "#45405e", xx + 1, yy + 1, 1, S - 2);
        rett(ctx, "#16131f", xx, yy + S - 1, S, 1);
        rett(ctx, "#16131f", xx + S - 1, yy, 1, S);
        if (rng() > 0.8) linea(ctx, "#1d1a2a", xx + 3, yy + 12, xx + 12, yy + 6);
      }
  } else if (tipo === "oro") {
    for (let yy = b, r = 0; yy < b + A; yy += 10, r++)
      for (let xx = a, i = 0; xx < a + L; xx += 10, i++) {
        rett(ctx, (i + r) % 2 ? "#8a5a10" : "#a8701a", xx, yy, 10, 10);
        rett(ctx, C.oro, xx + 1, yy + 1, 8, 1);
      }
  }
  ctx.restore();
}

function tappeto(ctx, x, y, w, h, frange = null) {
  const a = px(x), b = py(y), L = Math.round(w * S), A = Math.round(h * S);
  rett(ctx, "#5a1218", a, b, L, A);
  rett(ctx, C.tappeto, a + 1, b + 1, L - 2, A - 2);
  rett(ctx, C.oroScuro, a + 2, b + 2, L - 4, 1);
  rett(ctx, C.oroScuro, a + 2, b + A - 3, L - 4, 1);
  rett(ctx, C.oroScuro, a + 2, b + 2, 1, A - 4);
  rett(ctx, C.oroScuro, a + L - 3, b + 2, 1, A - 4);
  // Rombi lungo il tappeto.
  const lungo = L > A;
  for (let t = 10; t < (lungo ? L : A) - 8; t += 12) {
    const cx = lungo ? a + t : a + Math.floor(L / 2), cy = lungo ? b + Math.floor(A / 2) : b + t;
    rett(ctx, C.tappetoChiaro, cx - 1, cy - 2, 3, 5);
    rett(ctx, C.tappetoChiaro, cx - 2, cy - 1, 5, 3);
    rett(ctx, C.oro, cx, cy, 1, 1);
  }
  if (frange === "giu") for (let x2 = a + 1; x2 < a + L - 1; x2 += 2) rett(ctx, C.pietraChiara, x2, b + A, 1, 2);
}

// ── Fuori ──

function prato(ctx, a = 0, b = 0, L = MAPPA_L, A = MAPPA_A) {
  const rng = casuale(11);
  const quanti = (L * A) / (MAPPA_L * MAPPA_A);
  rett(ctx, "#16261d", a, b, L, A);
  retino(ctx, "#1f3527", a, b, L, A, (x, y) => 0.5 + 0.4 * Math.sin(x / 31 + Math.sin(y / 23) * 2) * Math.cos(y / 27 + x / 61));
  retino(ctx, "#294532", a, b, L, A, (x, y) => 0.15 + 0.35 * Math.sin(x / 17 + y / 29) * Math.cos(y / 13 - x / 41));
  for (let i = 0; i < 1500 * quanti; i++) {
    const x = a + Math.floor(rng() * L), y = b + Math.floor(rng() * A), h = 2 + Math.floor(rng() * 3);
    rett(ctx, rng() > 0.6 ? "#3a5e3a" : "#2c4a34", x, y - h, 1, h);
    if (rng() > 0.8) rett(ctx, "#4f7a46", x, y - h, 1, 1);
  }
  // Foglie cadute: è autunno.
  for (let i = 0; i < 320 * quanti; i++) {
    const x = a + Math.floor(rng() * L), y = b + Math.floor(rng() * A);
    const c = ["#8a3a12", "#c85a18", "#f0902a", "#6a2a10"][Math.floor(rng() * 4)];
    rett(ctx, c, x, y, 2, 1);
    if (rng() > 0.5) rett(ctx, c, x + 1, y + 1, 1, 1);
  }
  for (let i = 0; i < Math.max(2, 22 * quanti); i++) {
    const x = a + Math.floor(rng() * L), y = b + Math.floor(rng() * A);
    rett(ctx, C.pietraChiara, x, y - 2, 1, 2);
    rett(ctx, C.tappetoChiaro, x - 1, y - 4, 3, 2);
    rett(ctx, C.bianco, x, y - 4, 1, 1);
  }
}

/** Il tetto della parte che non si visita: tegole viste dall'alto, il colmo, un comignolo e un gatto nero. */
function tetto(ctx, x, y, w, h) {
  const a = px(x), b = py(y), L = w * S, A = h * S;
  const rng = casuale(19);
  const colmo = b + Math.round(A / 2);
  for (let yy = b, fila = 0; yy < b + A; yy += 8, fila++) {
    const sopra = yy < colmo;
    for (let xx = a - (fila % 2) * 6; xx < a + L; xx += 12) {
      const k = rng();
      const [base, luce, ombra] = sopra ? ["#4a2c4a", "#62406a", "#2e1a34"] : ["#3a2240", "#4e3058", "#24142a"];
      rett(ctx, k > 0.93 ? "#2c4a34" : k > 0.85 ? luce : base, xx, yy, 11, 7);
      rett(ctx, luce, xx + 1, yy, 9, 1);
      rett(ctx, ombra, xx, yy + 6, 11, 1);
      rett(ctx, "#140c1a", xx + 11, yy, 1, 8);
    }
    rett(ctx, "#140c1a", a, yy + 7, L, 1);
  }
  rett(ctx, "#140c1a", a, colmo - 4, L, 8);
  for (let xx = a + 2; xx < a + L; xx += 8) {
    rett(ctx, "#5a3a62", xx, colmo - 3, 6, 5);
    rett(ctx, "#7a5a82", xx + 1, colmo - 3, 4, 1);
  }
  // Il comignolo, con il fumo.
  const cx = a + Math.round(L * 0.7), cy = colmo + 30;
  ombraTerra(ctx, cx + 16, cy + 6, 14, 5);
  scatola(ctx, cx - 12, cy, 24, 10, 30, "#2a1c38", C.muroCasa, C.muroAcceso);
  for (let yy = cy - 28; yy < cy; yy += 5) for (let xx = cx - 12 + ((yy / 5) % 2) * 6; xx < cx + 12; xx += 12) rett(ctx, C.ombraCasa, xx, yy, 1, 5);
  rett(ctx, NERO, cx - 8, cy - 39, 16, 6);
  retino(ctx, "#4f5577", cx - 26, cy - 110, 40, 72, (xx, yy) => 0.85 * (1 - Math.abs(xx - (cx - (cy - 40 - yy) * 0.35 + Math.sin(yy / 7) * 4)) / (3 + (cy - 40 - yy) * 0.06)));
  // Il gatto nero sul colmo, con gli occhi gialli.
  const gx = a + Math.round(L * 0.28), gy = colmo - 2;
  rett(ctx, NERO, gx - 4, gy - 9, 9, 9);
  rett(ctx, NERO, gx - 3, gy - 14, 7, 6);
  rett(ctx, NERO, gx - 3, gy - 16, 2, 2);
  rett(ctx, NERO, gx + 2, gy - 16, 2, 2);
  rett(ctx, C.giallo, gx - 2, gy - 12, 1, 1);
  rett(ctx, C.giallo, gx + 2, gy - 12, 1, 1);
  linea(ctx, NERO, gx + 4, gy - 1, gx + 10, gy - 6);
  linea(ctx, NERO, gx + 10, gy - 6, gx + 9, gy - 10);
}

function albero(ctx, u, v, r, autunno, seme) {
  const cx = px(u), base = py(v);
  const rng = casuale(seme);
  const toni = autunno ? ["#4a1f10", "#8a3a12", "#c85a18", "#f0902a"] : ["#0f1f17", "#1d3a28", "#2f5a3a", "#4a7f4a"];
  ombraTerra(ctx, cx + 5, base, Math.round(r * 0.9), Math.round(r * 0.32));
  rett(ctx, C.bordo, cx - 4, base - 18, 9, 18);
  rett(ctx, C.legnoScuro, cx - 3, base - 18, 7, 17);
  rett(ctx, C.legno, cx - 3, base - 18, 2, 17);
  rett(ctx, C.legnoScuro, cx - 7, base - 3, 3, 3);
  rett(ctx, C.legnoScuro, cx + 5, base - 3, 3, 3);
  const cy = base - 16 - r;
  const lobi = [[0, 0, r * 0.72]];
  for (let i = 0; i < 7; i++) {
    const ang = (i / 7) * Math.PI * 2 + rng() * 0.6;
    lobi.push([Math.cos(ang) * r * 0.48, Math.sin(ang) * r * 0.4, r * (0.42 + rng() * 0.14)]);
  }
  for (const [dx, dy, rr] of lobi) ellisse(ctx, C.bordo, Math.round(cx + dx), Math.round(cy + dy), Math.round(rr) + 1, Math.round(rr) + 1);
  lobi.sort((p, q) => p[1] - q[1]);
  for (const [dx, dy, rr] of lobi) ovale(ctx, Math.round(cx + dx), Math.round(cy + dy), Math.round(rr), Math.round(rr), toni, null);
  for (let i = 0; i < r; i++) {
    const ang = rng() * Math.PI * 2, d = rng() * r * 0.8;
    rett(ctx, toni[3], Math.round(cx + Math.cos(ang) * d) - 2, Math.round(cy + Math.sin(ang) * d * 0.85) - 2, 2, 1);
  }
}

function zucca(ctx, u, v, accesa = true) {
  const cx = px(u), base = py(v);
  if (accesa) bagliore(ctx, "#3a2a20", cx, base - 6, 16, 0.55);
  ombraTerra(ctx, cx, base, 10, 3);
  const toni = ["#8a3a08", "#d9661a", "#f28c28", "#ffb050"];
  ovale(ctx, cx - 4, base - 6, 5, 6, toni);
  ovale(ctx, cx + 4, base - 6, 5, 6, toni);
  ovale(ctx, cx, base - 7, 5, 7, toni);
  rett(ctx, "#4a7a2a", cx - 1, base - 16, 3, 3);
  rett(ctx, "#2d5a2e", cx + 1, base - 17, 2, 1);
  if (accesa) {
    // La candela dentro trema: ogni tanto la faccia si abbassa di luce.
    const luce = fiammella(u, v) === 2 ? C.fiammaChiara : C.giallo;
    const occhio = (ox) => {
      rett(ctx, luce, ox - 1, base - 9, 3, 1);
      rett(ctx, luce, ox, base - 10, 1, 1);
      rett(ctx, C.fiamma, ox - 1, base - 8, 3, 1);
    };
    occhio(cx - 3);
    occhio(cx + 3);
    rett(ctx, luce, cx - 4, base - 5, 9, 2);
    rett(ctx, "#b9520c", cx - 2, base - 5, 1, 1);
    rett(ctx, "#b9520c", cx + 2, base - 5, 1, 1);
    rett(ctx, C.fiamma, cx - 3, base - 3, 7, 1);
  }
}

function lapide(ctx, u, v, seme) {
  const cx = px(u), base = py(v);
  const rng = casuale(seme);
  ombraTerra(ctx, cx + 3, base + 1, 12, 3);
  ellisse(ctx, "#2a1c24", cx, base + 2, 9, 3);
  ellisse(ctx, "#3a2a2e", cx, base + 1, 8, 2);
  const alto = 20 + Math.floor(rng() * 5);
  for (let y = base - alto; y < base; y++) {
    const dy = base - alto + 7 - y;
    const mezzo = dy > 0 ? Math.round(Math.sqrt(Math.max(0, 49 - dy * dy))) : 7;
    rett(ctx, C.bordo, cx - mezzo - 1, y, mezzo * 2 + 3, 1);
    rett(ctx, C.pietra, cx - mezzo, y, mezzo * 2 + 1, 1);
    rett(ctx, C.pietraChiara, cx - mezzo, y, 2, 1);
    rett(ctx, C.ferroChiaro, cx + mezzo - 1, y, 2, 1);
  }
  rett(ctx, C.bordo, cx - 8, base - alto - 1, 17, 1);
  rett(ctx, C.ferro, cx, base - alto + 5, 1, 9);
  rett(ctx, C.ferro, cx - 3, base - alto + 8, 7, 1);
  if (rng() > 0.4) linea(ctx, C.ferro, cx + 4, base - alto + 3, cx + 2, base - alto + 10);
  retino(ctx, "#3a5e3a", cx - 7, base - 5, 15, 5, (x, y) => (y - base + 5) * 0.25);
}

function lampione(ctx, u, v) {
  const cx = px(u), base = py(v);
  bagliore(ctx, "#4a3a2a", cx, base - 34, 34, 0.9);
  ombraTerra(ctx, cx + 4, base, 8, 3);
  rett(ctx, C.bordo, cx - 2, base - 30, 4, 30);
  rett(ctx, C.ferro, cx - 1, base - 30, 1, 30);
  rett(ctx, C.bordo, cx - 4, base - 3, 9, 3);
  rett(ctx, C.bordo, cx - 6, base - 46, 13, 16);
  rett(ctx, C.fiammaChiara, cx - 4, base - 44, 9, 11);
  // La fiamma dentro il vetro sale e scende di un pixel.
  const f = fiammella(u, v);
  rett(ctx, C.fiamma, cx - 4, base - 38 - f + 1, 9, 4 + f);
  rett(ctx, C.bordo, cx, base - 44, 1, 12);
  rett(ctx, C.bordo, cx - 7, base - 49, 15, 3);
  rett(ctx, C.bordo, cx - 3, base - 52, 7, 3);
}

/** Il cancello di ferro, aperto: i due battenti girati verso fuori, fra due pilastri con le lanterne. */
function cancelloDiFerro(ctx, x0, x1, y) {
  const a = px(x0), b = px(x1), base = py(y);
  for (const [cx, verso] of [[a, -1], [b, 1]]) {
    for (let i = 0; i <= 24; i += 3) {
      const x = cx + verso * (6 + i), giu = Math.round(i * 0.35);
      rett(ctx, C.bordo, x, base - 24 + giu, 2, 24);
      rett(ctx, C.ferroChiaro, x, base - 24 + giu, 1, 1);
      rett(ctx, C.bordo, x, base - 27 + giu, 2, 2);
    }
    linea(ctx, C.bordo, cx + verso * 6, base - 21, cx + verso * 31, base - 13);
    linea(ctx, C.bordo, cx + verso * 6, base - 5, cx + verso * 31, base + 3);
    ombraTerra(ctx, cx + 4, base + 1, 10, 3);
    bagliore(ctx, "#4a3a2a", cx, base - 46, 30, 1);
    scatola(ctx, cx - 7, base, 14, 6, 34, C.pietraChiara, C.pietra, C.bianco);
    rett(ctx, C.ferroChiaro, cx + 4, base - 34, 3, 34);
    rett(ctx, C.bordo, cx - 4, base - 52, 9, 12);
    rett(ctx, C.fiammaChiara, cx - 3, base - 50, 7, 8);
    const f = fiammella(cx, base);
    rett(ctx, C.fiamma, cx - 3, base - 46 - f + 1, 7, 3 + f);
    rett(ctx, C.bordo, cx - 5, base - 54, 11, 2);
  }
}

// ── Arredi dentro ──

function scala(ctx, x0, x1, y0, y1, chiusa) {
  // Gradini che salgono verso destra: più si sale, più sono chiari.
  const a = px(x0), b = px(x1), c = py(y0), d = py(y1);
  const n = Math.floor((b - a) / 6);
  for (let i = 0; i < n; i++) {
    const k = i / (n - 1);
    const tono = k < 0.33 ? ["#3b3a55", "#4f4d6a"] : k < 0.66 ? ["#4f4d6a", "#6f6d8c"] : ["#6f6d8c", "#8f8da9"];
    rett(ctx, tono[0], a + i * 6, c, 6, d - c);
    rett(ctx, tono[1], a + i * 6, c, 2, d - c);
    rett(ctx, C.bordo, a + i * 6 + 5, c, 1, d - c);
  }
  // Il corrimano di legno con i pomoli.
  for (const yy of [c, d - 3]) {
    rett(ctx, C.legnoScuro, a, yy - 1, b - a, 3);
    rett(ctx, C.legnoChiaro, a, yy - 1, b - a, 1);
  }
  for (let x = a + 4; x < b; x += 14) {
    rett(ctx, C.legnoChiaro, x, c - 3, 2, 2);
    rett(ctx, C.legnoChiaro, x, d - 5, 2, 2);
  }
  if (chiusa) {
    // La grata di ferro con il lucchetto d'oro ai piedi della scala.
    rett(ctx, C.bordo, a - 2, c - 12, 5, d - c + 12);
    for (let yy = c - 10; yy < d; yy += 3) rett(ctx, C.ferroChiaro, a - 1, yy, 3, 1);
    rett(ctx, C.ferroChiaro, a - 1, c - 12, 1, d - c + 12);
    rett(ctx, C.bordo, a - 5, c + 3, 11, 10);
    rett(ctx, C.oro, a - 4, c + 6, 9, 6);
    rett(ctx, C.giallo, a - 4, c + 6, 9, 1);
    rett(ctx, C.bordo, a - 3, c + 2, 1, 4);
    rett(ctx, C.bordo, a + 3, c + 2, 1, 4);
    rett(ctx, C.bordo, a - 3, c + 2, 7, 1);
    rett(ctx, C.bordo, a, c + 8, 1, 2);
  }
}

function torciaAMuro(ctx, x, y, alto = 18) {
  const cx = px(x), cy = py(y) - alto + 4;
  bagliore(ctx, C.muroAcceso, cx, cy, 26, 1);
  bagliore(ctx, "#5a3a3a", cx, cy, 12, 1);
  rett(ctx, C.ferro, cx - 1, cy + 2, 3, 8);
  rett(ctx, C.ferroChiaro, cx - 3, cy + 1, 7, 2);
  rett(ctx, C.brace, cx - 2, cy - 4, 5, 5);
  // La fiamma: tre forme che si alternano a caso, così trema (il bagliore resta fermo).
  const f = fiammella(x, y);
  if (f === 0) {
    rett(ctx, C.fiamma, cx - 1, cy - 7, 3, 7);
    rett(ctx, C.fiammaChiara, cx, cy - 5, 1, 4);
    rett(ctx, C.luna, cx, cy - 8, 1, 2);
  } else if (f === 1) {
    rett(ctx, C.fiamma, cx - 1, cy - 6, 3, 6);
    rett(ctx, C.fiamma, cx - 2, cy - 4, 1, 2);
    rett(ctx, C.fiammaChiara, cx, cy - 4, 1, 3);
    rett(ctx, C.luna, cx - 1, cy - 7, 1, 2);
  } else {
    rett(ctx, C.fiamma, cx - 1, cy - 8, 3, 8);
    rett(ctx, C.fiamma, cx + 2, cy - 5, 1, 2);
    rett(ctx, C.fiammaChiara, cx, cy - 6, 1, 5);
    rett(ctx, C.luna, cx + 1, cy - 10, 1, 2);
  }
}

function quadroAMuro(ctx, x, y, alto = 18) {
  const cx = px(x), cima = py(y) - alto + 2;
  rett(ctx, C.oroScuro, cx - 8, cima, 16, 12);
  rett(ctx, C.oro, cx - 8, cima, 16, 1);
  rett(ctx, "#1d1a2a", cx - 6, cima + 2, 12, 8);
  rett(ctx, "#3a2a46", cx - 3, cima + 3, 6, 7);
  rett(ctx, C.pietraChiara, cx - 2, cima + 4, 4, 3);
  rett(ctx, C.tappetoChiaro, cx - 2, cima + 5, 1, 1);
  rett(ctx, C.tappetoChiaro, cx + 1, cima + 5, 1, 1);
}

function festoni(ctx, x0, x1, y, alto = 18) {
  const a = px(x0), b = px(x1), cima = py(y) - alto + 3;
  const colori = [C.fiamma, C.violaScuro, NERO, C.lilla];
  for (let x = a, i = 0; x < b - 6; x += 9, i++) {
    const giu = Math.round(Math.abs(Math.sin((x - a) / 40 * Math.PI)) * 4);
    rett(ctx, colori[i % 4], x, cima + giu, 7, 2);
    rett(ctx, colori[i % 4], x + 1, cima + giu + 2, 5, 2);
    rett(ctx, colori[i % 4], x + 2, cima + giu + 4, 3, 1);
    rett(ctx, colori[i % 4], x + 3, cima + giu + 5, 1, 1);
  }
  linea(ctx, C.bordo, a, cima, b, cima);
}

/** Il telo sopra un mobile che sembra un fantasma: l'orlo ondeggia, il fondo si sposta e ogni tanto chiude gli occhi. */
function telo(ctx, x, y, seme) {
  const cx = px(x), base = py(y), s = caso(seme * 53), k = passo(s);
  ombraTerra(ctx, cx + 2, base, 10, 3);
  rett(ctx, C.ferro, cx, base - 34, 1, 6);
  // Il fondo del telo va avanti e indietro di un pixel, la cima resta appesa.
  const sposta = [0, 0, 1, 1, 1, 0, 0, -1, -1, -1, 0, 0][Math.floor(k / 2)];
  for (let yy = base - 28; yy < base; yy++) {
    const q = (yy - base + 28) / 28;
    const mezzo = Math.round(4 + q * 6), c = cx + (q > 0.5 ? sposta : 0);
    rett(ctx, C.bordo, c - mezzo - 1, yy, mezzo * 2 + 3, 1);
    rett(ctx, "#8f93b2", c - mezzo, yy, mezzo * 2 + 1, 1);
    rett(ctx, "#b8bcd6", c - mezzo, yy, 3, 1);
    rett(ctx, "#6f7292", c + mezzo - 2, yy, 3, 1);
  }
  // L'orlo: un'onda che scorre.
  for (let x = cx - 10; x <= cx + 10; x += 2) {
    const giu = Math.round((Math.sin((x - cx) / 3 + (k / GIRO.fotogrammi) * Math.PI * 2) + 1) / 2 * 1.4);
    rett(ctx, "#6f7292", x + sposta, base - 2 + giu, 2, 2);
  }
  const chiusi = k === 0;
  rett(ctx, C.bordo, cx - 3, base - 21 + (chiusi ? 2 : 0), 2, chiusi ? 1 : 3);
  rett(ctx, C.bordo, cx + 2, base - 21 + (chiusi ? 2 : 0), 2, chiusi ? 1 : 3);
  rett(ctx, C.bordo, cx - 1, base - 15, 3, 2);
}

function cassa(ctx, x, y, w = 1, alto = 12) {
  const a = px(x), base = py(y), L = Math.round(w * S);
  ombraTerra(ctx, a + L / 2 + 3, base + 1, L / 2 + 3, 3);
  scatola(ctx, a, base, L, 8, alto, C.legnoChiaro, C.legno, C.legnoLuce);
  linea(ctx, C.legnoScuro, a, base - alto, a + L - 1, base - 1);
  linea(ctx, C.legnoScuro, a + L - 1, base - alto, a, base - 1);
  rett(ctx, C.legnoScuro, a, base - alto, 2, alto);
  rett(ctx, C.legnoScuro, a + L - 2, base - alto, 2, alto);
  for (let x2 = a + 3; x2 < a + L; x2 += 6) rett(ctx, C.legno, x2, base - alto - 7, 1, 6);
}

function secchio(ctx, x, y) {
  const cx = px(x), base = py(y);
  ombraTerra(ctx, cx + 2, base, 7, 2);
  rett(ctx, C.bordo, cx - 5, base - 10, 11, 10);
  rett(ctx, C.ferroChiaro, cx - 4, base - 9, 9, 8);
  rett(ctx, C.pietra, cx - 4, base - 9, 2, 8);
  ellisse(ctx, "#26324a", cx, base - 10, 4, 1);
  linea(ctx, C.legno, cx + 1, base - 10, cx + 7, base - 30);
  rett(ctx, C.pietraChiara, cx + 6, base - 33, 4, 4);
}

function ragnatelaAngolo(ctx, x, y, verso) {
  const cx = px(x), cy = py(y);
  for (const [dx, dy] of [[18, 0], [15, 8], [8, 15], [0, 18]]) linea(ctx, "#8f8da9", cx, cy, cx + verso * dx, cy + dy);
  for (const d of [6, 11, 16]) {
    linea(ctx, "#6f6d8c", cx + verso * d, cy, cx + verso * Math.round(d * 0.82), cy + Math.round(d * 0.45));
    linea(ctx, "#6f6d8c", cx + verso * Math.round(d * 0.82), cy + Math.round(d * 0.45), cx + verso * Math.round(d * 0.45), cy + Math.round(d * 0.82));
    linea(ctx, "#6f6d8c", cx + verso * Math.round(d * 0.45), cy + Math.round(d * 0.82), cx, cy + d);
  }
  rett(ctx, NERO, cx + verso * 9, cy + 9, 2, 2);
}

function consolleDj(ctx, x0, x1, y) {
  const a = px(x0), base = py(y), L = Math.round((x1 - x0) * S);
  bagliore(ctx, "#2a1f4a", a + L / 2, base - 20, 46, 0.8);
  ombraTerra(ctx, a + L / 2 + 4, base + 2, L / 2 + 6, 4);
  scatola(ctx, a, base, L, 16, 14, "#3b3a55", "#1c1828", "#5e5c7a");
  // La fascia di luce sul davanti: i colori corrono verso destra a ogni battito.
  const led = [C.rosa, C.acqua, C.giallo, C.lilla], b = battito();
  for (let x = a + 3, i = 0; x < a + L - 3; x += 4, i++) rett(ctx, led[(i + 4 - (b % 4)) % 4], x, base - 8, 2, 2);
  // Due piatti che girano (il riflesso fa il giro del disco) e il mixer.
  for (const k of [0.22, 0.78]) {
    const cx = a + Math.round(L * k), cy = base - 22;
    ellisse(ctx, NERO, cx, cy, 8, 5);
    ellisse(ctx, "#2a2638", cx, cy, 7, 4);
    const ang = (passo(k, 8) / 8) * Math.PI * 2;
    rett(ctx, "#5e5c7a", cx + Math.round(Math.cos(ang) * 5), cy + Math.round(Math.sin(ang) * 3), 2, 1);
    ellisse(ctx, C.tappetoChiaro, cx, cy, 2, 1);
    linea(ctx, C.pietraChiara, cx + 8, cy - 4, cx + 3, cy + 1);
  }
  const mx = a + Math.round(L / 2);
  rett(ctx, NERO, mx - 9, base - 28, 18, 10);
  // I cursori del mixer saltano col battito.
  for (let i = 0; i < 4; i++) {
    rett(ctx, C.ferroChiaro, mx - 7 + i * 4, base - 26, 1, 6);
    rett(ctx, led[i], mx - 8 + i * 4, base - 26 + Math.floor(caso(i * 11 + b) * 5), 3, 1);
  }
  // Il portatile acceso.
  rett(ctx, C.bordo, mx - 6, base - 38, 13, 9);
  rett(ctx, "#6a8ad0", mx - 5, base - 37, 11, 6);
  rett(ctx, "#c8d8ff", mx - 4, base - 36, 3, 1);
}

function cassaAcustica(ctx, x, y) {
  const cx = px(x), base = py(y);
  ombraTerra(ctx, cx + 4, base + 1, 12, 3);
  scatola(ctx, cx - 10, base, 20, 8, 32, "#3b3a55", "#1c1828", "#5e5c7a");
  // I coni pulsano col battito: sul colpo si gonfiano.
  const colpo = battito() % 2 === 0;
  for (const [dy, r] of [[-22, 6], [-8, 4]]) {
    ellisse(ctx, NERO, cx, base + dy, r, r);
    ellisse(ctx, colpo ? C.ferroChiaro : C.ferro, cx, base + dy, r - 1, r - 1);
    const dentro = Math.max(1, r - (colpo ? 2 : 3));
    ellisse(ctx, "#1c1828", cx, base + dy, dentro, dentro);
  }
}

function pallaStroboscopica(ctx, x, y) {
  const cx = px(x), cy = py(y);
  ombraTerra(ctx, cx, cy + 34, 10, 3, 0.5);
  // La palla gira: gli specchietti scorrono di un pixel ogni mezzo secondo, e i lampi cambiano posto a ogni battito.
  const giro = passo(0, 6);
  for (let yy = -9; yy <= 9; yy++)
    for (let xx = -9; xx <= 9; xx++) {
      const d = Math.hypot(xx, yy);
      if (d > 9.5) continue;
      if (d > 8.5) { rett(ctx, C.bordo, cx + xx, cy + yy, 1, 1); continue; }
      const scacco = (Math.floor((xx + 9 - giro + 18) / 3) + Math.floor((yy + 9) / 3)) % 2;
      const luce = -xx - yy > 6;
      rett(ctx, luce ? (scacco ? C.bianco : C.pietraChiara) : scacco ? C.pietra : C.ferroChiaro, cx + xx, cy + yy, 1, 1);
    }
  const lampi = [[[-4, -5], [3, -2], [-6, 2]], [[-1, -6], [5, 1], [-5, -1]], [[-6, -3], [1, -4], [2, 4]]][battito() % 3];
  for (const [dx, dy] of lampi) {
    rett(ctx, C.bianco, cx + dx - 1, cy + dy, 3, 1);
    rett(ctx, C.bianco, cx + dx, cy + dy - 1, 1, 3);
  }
}

/** Le macchie colorate che la palla getta sul pavimento: girano un po' attorno al loro posto a ogni battito. */
function luciDellaPalla(ctx, x0, y0, x1, y1) {
  const rng = casuale(5);
  const colori = ["#4a1f3a", "#1f4a4a", "#4a4520", "#33255a"];
  const ang = (battito() / 8) * Math.PI * 2;
  for (let i = 0; i < 16; i++) {
    const a = ang + i * 1.7;
    const cx = px(x0 + rng() * (x1 - x0)) + Math.round(Math.cos(a) * 9), cy = py(y0 + rng() * (y1 - y0)) + Math.round(Math.sin(a) * 4);
    retino(ctx, colori[i % 4], cx - 9, cy - 5, 19, 11, (x, y) => 1.4 * (1 - Math.hypot((x - cx) / 9, (y - cy) / 5)));
  }
}

/**
 * Gli ospiti della festa: scheletri, un vampiro, una strega, una mummia. `moto` dice come si muovono: "aspetta"
 * (respira), "balla" (braccia su e giù a ogni battito, con un saltello), "beve" (alza il bicchiere), "shakera"
 * (il barista). Restituisce di quanto si è spostato in su o in giù il busto, per chi ci disegna sopra.
 */
function ospite(ctx, x, y, tipo, posa = 0, moto = "aspetta") {
  const cx = px(x), piedi = py(y), s = sfasoDi(x, y), k = passo(s);
  let dy = Math.floor(k / 6) % 2;
  if (moto === "balla") {
    posa = (battito() + (s > 0.5 ? 1 : 0)) % 2;
    dy = -posa;
  } else if (moto === "beve") posa = passo(s, 8) >= 3 && passo(s, 8) <= 5 ? 1 : 0;
  else if (moto === "shakera") {
    posa = passo(s, 12) % 2;
    dy = 0;
  }
  const base = piedi + dy, chiusi = k === 0;
  ombraTerra(ctx, cx + 2, piedi, 7, 2);
  const braccia = (colore, su) => {
    if (su) {
      linea(ctx, colore, cx - 4, base - 14, cx - 7, base - 21);
      linea(ctx, colore, cx + 4, base - 14, cx + 7, base - 21);
    } else {
      linea(ctx, colore, cx - 4, base - 14, cx - 7, base - 8);
      linea(ctx, colore, cx + 4, base - 14, cx + 7, base - 20);
    }
  };
  if (tipo === "scheletro") {
    const osso = "#e8e4f0", ombra = "#a9a4bc";
    linea(ctx, osso, cx - 2, base - 7, cx - 3 - posa, piedi);
    linea(ctx, osso, cx + 2, base - 7, cx + 3 + posa, piedi);
    rett(ctx, osso, cx - 3, base - 9, 7, 2);
    rett(ctx, osso, cx, base - 16, 1, 7);
    for (let i = 0; i < 3; i++) rett(ctx, i % 2 ? ombra : osso, cx - 3, base - 16 + i * 2, 7, 1);
    braccia(osso, posa > 0);
    rett(ctx, C.bordo, cx - 4, base - 25, 9, 9);
    rett(ctx, osso, cx - 3, base - 24, 7, 7);
    rett(ctx, ombra, cx + 2, base - 24, 1, 7);
    rett(ctx, NERO, cx - 2, base - 22, 2, 2);
    rett(ctx, NERO, cx + 1, base - 22, 2, 2);
    rett(ctx, NERO, cx, base - 19, 1, 1);
  } else if (tipo === "vampiro") {
    for (let yy = base - 16; yy < piedi; yy++) {
      const m = Math.round(3 + (yy - base + 16) * 0.4);
      rett(ctx, NERO, cx - m, yy, m * 2 + 1, 1);
    }
    rett(ctx, C.tappeto, cx - 6, base - 15, 3, 1);
    rett(ctx, C.tappeto, cx + 4, base - 15, 3, 1);
    braccia(NERO, posa > 0);
    rett(ctx, C.tappetoChiaro, cx - 5, base - 18, 11, 3);
    rett(ctx, "#d8d4e8", cx - 3, base - 24, 7, 7);
    rett(ctx, NERO, cx - 3, base - 25, 7, 3);
    if (!chiusi) {
      rett(ctx, NERO, cx - 1, base - 22, 1, 1);
      rett(ctx, NERO, cx + 2, base - 22, 1, 1);
    }
    rett(ctx, C.tappetoChiaro, cx, base - 19, 1, 1);
    // Il bicchiere di rosso, quando lo alza.
    if (moto === "beve" && posa) {
      rett(ctx, C.pietraChiara, cx + 6, base - 24, 3, 4);
      rett(ctx, C.tappeto, cx + 6, base - 22, 3, 2);
    }
  } else if (tipo === "strega") {
    for (let yy = base - 14; yy < piedi; yy++) {
      const m = Math.round(3 + (yy - base + 14) * 0.35);
      rett(ctx, C.violaScuro, cx - m, yy, m * 2 + 1, 1);
    }
    braccia("#5a9a4a", posa > 0);
    rett(ctx, "#5a9a4a", cx - 3, base - 20, 7, 6);
    if (!chiusi) {
      rett(ctx, NERO, cx - 1, base - 18, 1, 1);
      rett(ctx, NERO, cx + 2, base - 18, 1, 1);
    }
    rett(ctx, NERO, cx - 7, base - 21, 15, 2);
    for (let i = 0; i < 9; i++) rett(ctx, NERO, cx - 4 + Math.floor(i / 2), base - 22 - i, 9 - i, 1);
    rett(ctx, C.oro, cx - 4, base - 23, 9, 1);
  } else {
    const benda = "#d8d0b8", ombra = "#a8a088";
    rett(ctx, benda, cx - 3, base - 9, 3, piedi - base + 9);
    rett(ctx, benda, cx + 1, base - 9, 3, piedi - base + 9);
    rett(ctx, benda, cx - 4, base - 17, 9, 9);
    for (let yy = base - 17; yy < base; yy += 3) rett(ctx, ombra, cx - 4, yy, 9, 1);
    braccia(benda, posa > 0);
    rett(ctx, benda, cx - 3, base - 24, 7, 7);
    rett(ctx, ombra, cx - 3, base - 22, 7, 1);
    if (!chiusi) {
      rett(ctx, C.giallo, cx - 2, base - 21, 1, 1);
      rett(ctx, C.giallo, cx + 2, base - 21, 1, 1);
    }
  }
  return dy;
}

/** Un pipistrello: sbatte le ali e sale e scende di un pixel, ognuno col suo tempo. */
function pipistrello(ctx, x, y) {
  const s = sfasoDi(x, y), ali = passo(s, 12) % 2, cx = px(x), cy = py(y) + (passo(s, 6) % 3 === 1 ? -1 : 0);
  rett(ctx, NERO, cx - 1, cy - 1, 3, 3);
  rett(ctx, NERO, cx - 1, cy - 2, 1, 1);
  rett(ctx, NERO, cx + 1, cy - 2, 1, 1);
  for (const v of [-1, 1]) {
    if (ali) {
      // Ali giù.
      linea(ctx, NERO, cx + v * 2, cy - 1, cx + v * 5, cy + 1);
      linea(ctx, NERO, cx + v * 5, cy + 1, cx + v * 6, cy + 4);
      linea(ctx, NERO, cx + v * 2, cy, cx + v * 4, cy + 3);
    } else {
      linea(ctx, NERO, cx + v * 2, cy - 1, cx + v * 6, cy - 3);
      linea(ctx, NERO, cx + v * 6, cy - 3, cx + v * 7, cy);
      linea(ctx, NERO, cx + v * 2, cy, cx + v * 5, cy);
    }
  }
  rett(ctx, C.tappetoChiaro, cx - 1, cy, 1, 1);
  rett(ctx, C.tappetoChiaro, cx + 1, cy, 1, 1);
}

function tavolino(ctx, x, y) {
  const cx = px(x), base = py(y);
  ombraTerra(ctx, cx + 3, base + 1, 11, 3);
  ellisse(ctx, C.bordo, cx, base - 8, 11, 6);
  ellisse(ctx, C.violaScuro, cx, base - 8, 10, 5);
  ellisse(ctx, C.viola, cx - 1, base - 9, 7, 3);
  rett(ctx, C.violaScuro, cx - 10, base - 8, 21, 6);
  rett(ctx, C.bordo, cx - 11, base - 3, 23, 1);
  for (let x2 = cx - 9; x2 <= cx + 9; x2 += 3) rett(ctx, "#2a1c50", x2, base - 7, 1, 5);
  bagliore(ctx, "#4a3a2a", cx + 4, base - 14, 10, 1);
  rett(ctx, C.pietraChiara, cx + 4, base - 15, 2, 5);
  candela(ctx, cx + 4, base - 15, x, y);
  zucchina(ctx, cx - 3, base - 9);
}

/** La fiammella di una candela larga 2 sopra (x, cima), in pixel: tre forme a caso, così trema. */
function candela(ctx, x, cima, u = x, v = cima) {
  const f = fiammella(u * 7 + x, v * 7 + cima);
  rett(ctx, C.fiamma, x, cima - 2 - (f === 2 ? 1 : 0), 2, 2 + (f === 2 ? 1 : 0));
  rett(ctx, C.fiammaChiara, x + (f === 1 ? 1 : 0), cima - 2, 1, 1);
}

function zucchina(ctx, cx, base) {
  rett(ctx, C.bordo, cx - 3, base - 5, 7, 5);
  rett(ctx, "#f28c28", cx - 2, base - 4, 5, 4);
  rett(ctx, "#ffb050", cx - 2, base - 4, 2, 1);
  rett(ctx, "#4a7a2a", cx, base - 6, 1, 2);
}

function bottiglieAMuro(ctx, x0, x1, y, alto = 16) {
  const rng = casuale(3);
  const a = px(x0), b = px(x1), cima = py(y) - alto;
  const colori = ["#c8242c", "#2d5a2e", "#f0b84a", "#7b55c4", "#2a8cff", "#37d6c2", "#8a3a1e"];
  for (const [ripiano, h] of [[cima + 7, 6], [cima + 14, 5]]) {
    for (let x = a + 2; x < b - 3; x += 4) {
      if (rng() < 0.15) continue;
      const c = colori[Math.floor(rng() * colori.length)];
      const hh = h - Math.floor(rng() * 2);
      rett(ctx, c, x, ripiano - hh, 3, hh);
      rett(ctx, c, x + 1, ripiano - hh - 2, 1, 2);
      rett(ctx, C.pietraChiara, x, ripiano - hh + 1, 1, 2);
    }
    rett(ctx, C.legnoChiaro, a, ripiano, b - a, 1);
  }
}

function sgabello(ctx, x, y) {
  const cx = px(x), base = py(y);
  ombraTerra(ctx, cx + 2, base, 6, 2);
  rett(ctx, C.ferro, cx - 1, base - 9, 2, 9);
  rett(ctx, C.ferroChiaro, cx - 3, base - 2, 6, 1);
  ellisse(ctx, C.bordo, cx, base - 10, 6, 3);
  ellisse(ctx, C.tappeto, cx, base - 10, 5, 2);
  rett(ctx, C.tappetoChiaro, cx - 3, base - 12, 4, 1);
}

function bicchieri(ctx, x0, x1, y, alto = 12) {
  const rng = casuale(8);
  const piano = py(y) - alto - 3;
  for (let x = px(x0) + 4; x < px(x1) - 4; x += 9 + Math.floor(rng() * 8)) {
    const c = [C.acqua, C.tappetoChiaro, C.giallo, "#2a8cff"][Math.floor(rng() * 4)];
    rett(ctx, C.pietraChiara, x, piano - 5, 3, 5);
    rett(ctx, c, x, piano - 3, 3, 3);
    rett(ctx, C.bianco, x, piano - 5, 1, 1);
  }
}

/** Lo scheletro col papillon: al bar shakera, al guardaroba aspetta. */
function scheletroBarista(ctx, x, y, moto = "shakera") {
  const cx = px(x), base = py(y) + ospite(ctx, x, y, "scheletro", 0, moto);
  rett(ctx, NERO, cx - 3, base - 17, 7, 2);
  rett(ctx, C.tappetoChiaro, cx - 2, base - 17, 2, 2);
  rett(ctx, C.tappetoChiaro, cx + 1, base - 17, 2, 2);
}

function fungoRiscaldante(ctx, x, y) {
  const cx = px(x), base = py(y);
  bagliore(ctx, "#3a2228", cx, base - 24, 50, 1);
  bagliore(ctx, "#5a3022", cx, base - 30, 22, 1);
  ombraTerra(ctx, cx + 4, base + 1, 10, 3);
  rett(ctx, C.bordo, cx - 7, base - 4, 15, 4);
  rett(ctx, C.ferroChiaro, cx - 6, base - 4, 13, 1);
  rett(ctx, C.bordo, cx - 2, base - 30, 4, 26);
  rett(ctx, C.ferroChiaro, cx - 1, base - 30, 1, 26);
  rett(ctx, C.bordo, cx - 4, base - 42, 9, 13);
  // Le righe incandescenti salgono, come il calore.
  const sale = passo(0, 12);
  for (let yy = base - 41; yy < base - 30; yy++) rett(ctx, (yy + sale) % 2 ? C.brace : C.fiamma, cx - 3, yy, 7, 1);
  rett(ctx, C.fiammaChiara, cx - 1, base - 40 + (sale % 3 === 0 ? 1 : 0), 2, 9 - (sale % 3 === 0 ? 1 : 0));
  ellisse(ctx, C.bordo, cx, base - 46, 13, 4);
  ellisse(ctx, C.ferroChiaro, cx, base - 47, 12, 3);
  ellisse(ctx, C.pietra, cx - 2, base - 48, 7, 1);
}

/**
 * La posacenere alta, con un mozzicone acceso. Restituisce la brace (in pixel); con `spirito` disegna anche il fumo
 * col fantasma della pianta intera (nelle sale il fumo lo fa `fumoSpirito`).
 */
function posacenere(ctx, x, y, spirito = true) {
  const cx = px(x), base = py(y);
  ombraTerra(ctx, cx + 3, base + 1, 7, 2);
  if (spirito) retino(ctx, "#4f5577", cx - 14, base - 70, 22, 50, (xx, yy) => 0.85 * (1 - Math.abs(xx - (cx - (base - 20 - yy) * 0.22 + Math.sin(yy / 6) * 2.5)) / (1.4 + (base - 20 - yy) * 0.04)));
  rett(ctx, C.bordo, cx - 5, base - 20, 10, 20);
  rett(ctx, C.ferro, cx - 4, base - 19, 8, 19);
  rett(ctx, C.ferroChiaro, cx - 3, base - 19, 2, 19);
  ellisse(ctx, C.pietraChiara, cx, base - 20, 4, 1);
  rett(ctx, C.bianco, cx - 2, base - 21, 3, 1);
  rett(ctx, C.brace, cx + 1, base - 21, 1, 1);
  if (!spirito) return [cx + 1, base - 22];
  // In cima al fumo, il fantasma con gli occhi vuoti.
  const fx = cx - 11, fy = base - 72;
  for (let yy = -7; yy <= 9; yy++) {
    const m = yy < 0 ? Math.round(Math.sqrt(49 - yy * yy)) : 7 - (yy > 6 ? (yy - 6) * 2 : 0);
    if (m <= 0) continue;
    retino(ctx, "#8f93b2", fx - m, fy + yy, m * 2 + 1, 1, () => 0.75);
  }
  rett(ctx, NERO, fx - 3, fy - 2, 2, 3);
  rett(ctx, NERO, fx + 2, fy - 2, 2, 3);
  rett(ctx, NERO, fx - 1, fy + 3, 3, 2);
}

function panca(ctx, x, y0, y1) {
  const a = px(x), b = py(y0), d = py(y1);
  ombraTerra(ctx, a + 8, d + 1, 8, 3);
  rett(ctx, C.bordo, a - 1, b - 7, 14, d - b + 8);
  for (let xx = a; xx < a + 12; xx += 4) {
    rett(ctx, C.legnoChiaro, xx, b - 6, 3, d - b);
    rett(ctx, C.legnoLuce, xx, b - 6, 1, d - b);
  }
  rett(ctx, C.legno, a, d - 6, 12, 5);
  rett(ctx, C.legnoScuro, a + 1, d - 1, 2, 2);
  rett(ctx, C.legnoScuro, a + 9, d - 1, 2, 2);
}

/** Le lucine colorate appese: i colori corrono lungo il filo, uno scatto ogni mezzo secondo. */
function lucineAppese(ctx, punti) {
  const colori = [C.rosa, C.acqua, C.giallo, C.lilla], corre = passo(0, 6);
  for (let i = 0; i < punti.length - 1; i++) {
    const [ax, ay] = [px(punti[i][0]), py(punti[i][1])], [bx, by] = [px(punti[i + 1][0]), py(punti[i + 1][1])];
    const n = Math.max(2, Math.round(Math.hypot(bx - ax, by - ay) / 9));
    for (let j = 0; j < n; j++) {
      const k = j / n, k2 = (j + 1) / n;
      const pend = (t) => Math.sin(t * Math.PI) * 6;
      linea(ctx, C.bordo, ax + (bx - ax) * k, ay + (by - ay) * k + pend(k), ax + (bx - ax) * k2, ay + (by - ay) * k2 + pend(k2));
      if (j === 0) continue;
      const x = Math.round(ax + (bx - ax) * k), y = Math.round(ay + (by - ay) * k + pend(k));
      const c = colori[(i * 7 + j + 8 - (corre % 4)) % 4];
      bagliore(ctx, "#3a2a40", x, y + 2, 5, 0.9);
      rett(ctx, C.bordo, x - 1, y, 3, 1);
      rett(ctx, c, x - 1, y + 1, 3, 3);
      rett(ctx, C.bianco, x - 1, y + 1, 1, 1);
    }
  }
}

function vasoSecco(ctx, x, y) {
  const cx = px(x), base = py(y);
  ombraTerra(ctx, cx + 2, base, 7, 2);
  rett(ctx, C.bordo, cx - 5, base - 9, 11, 9);
  rett(ctx, "#8a3a1e", cx - 4, base - 8, 9, 8);
  rett(ctx, "#b0582e", cx - 4, base - 8, 9, 2);
  for (const [dx, h] of [[-2, 14], [0, 18], [2, 12], [-4, 9]]) linea(ctx, "#5a3a26", cx, base - 9, cx + dx * 2, base - 9 - h);
}

function candelabro(ctx, x, y) {
  const cx = px(x), base = py(y);
  bagliore(ctx, "#4a3a2a", cx, base - 24, 20, 1);
  ombraTerra(ctx, cx + 2, base, 6, 2);
  rett(ctx, C.oroScuro, cx - 4, base - 2, 9, 2);
  rett(ctx, C.oroScuro, cx, base - 20, 1, 18);
  rett(ctx, C.oroScuro, cx - 6, base - 18, 13, 1);
  for (const dx of [-6, 0, 6]) {
    rett(ctx, C.pietraChiara, cx + dx, base - 24, 1, 5);
    // Ogni fiammella trema per conto suo: più alta, più bassa, con la punta chiara.
    const f = fiammella(x * 5 + dx, y);
    const alta = f === 2 ? 3 : f === 1 ? 1 : 2;
    rett(ctx, C.fiamma, cx + dx, base - 24 - alta, 1, alta);
    if (f === 2) rett(ctx, C.fiammaChiara, cx + dx, base - 26, 1, 1);
  }
}

function mozziconi(ctx, x0, y0, x1, y1, seme) {
  const rng = casuale(seme);
  for (let i = 0; i < 16; i++) {
    const x = px(x0 + rng() * (x1 - x0)), y = py(y0 + rng() * (y1 - y0));
    rett(ctx, C.pietraChiara, x, y, 3, 1);
    rett(ctx, C.oroScuro, x + 3, y, 1, 1);
  }
}

// ── Tesoro ──

function mucchioDOro(ctx, x, y, r, seme) {
  const cx = px(x), base = py(y);
  const rng = casuale(seme);
  ombraTerra(ctx, cx + 3, base + 1, Math.round(r * 1.5), 3);
  for (let yy = 0; yy < r; yy++) {
    const largo = Math.round(r * 1.5 * Math.sqrt((yy + 1) / r));
    for (let xx = -largo; xx <= largo; xx++) {
      const k = rng() + (-xx / largo) * 0.15 - (yy / r) * 0.2;
      rett(ctx, k > 0.82 ? C.giallo : k > 0.4 ? C.oro : C.oroScuro, cx + xx, base - r + yy, 1, 1);
    }
  }
  for (let i = 0; i < r * 2; i++) {
    const yy = Math.floor(rng() * r), largo = Math.round(r * 1.5 * Math.sqrt((yy + 1) / r));
    const xx = cx - largo + Math.floor(rng() * largo * 2);
    rett(ctx, C.oroScuro, xx, base - r + yy + 1, 3, 1);
    rett(ctx, C.giallo, xx, base - r + yy, 3, 1);
  }
  rett(ctx, C.bianco, cx - Math.round(r * 0.4), base - r + 2, 1, 1);
  // Una scintilla che si accende in un punto diverso del mucchio ogni mezzo secondo, e a volte non c'è.
  const q = passo(caso(seme), 6), lx = cx + Math.round((caso(seme * 7 + q) - 0.5) * r * 1.6);
  if (caso(seme * 11 + q) > 0.3) scintilla(ctx, lx, base - Math.round(r * (0.4 + caso(seme * 13 + q) * 0.4)));
}

/** La stellina bianca di un riflesso: una croce di cinque pixel. */
function scintilla(ctx, x, y) {
  rett(ctx, C.bianco, x - 1, y, 3, 1);
  rett(ctx, C.bianco, x, y - 1, 1, 3);
}

function monete(ctx, x0, y0, x1, y1) {
  const rng = casuale(21);
  const brilla = passo(0, 8);
  for (let i = 0; i < 46; i++) {
    const x = px(x0 + rng() * (x1 - x0)), y = py(y0 + rng() * (y1 - y0));
    rett(ctx, C.oroScuro, x, y + 1, 3, 1);
    rett(ctx, C.oro, x, y, 3, 1);
    rett(ctx, C.giallo, x, y, 1, 1);
    // Un paio di monete per volta luccicano.
    if ((i * 5 + brilla) % 23 === 0) scintilla(ctx, x + 1, y);
  }
}

function forziere(ctx, x, y) {
  const a = px(x), base = py(y);
  bagliore(ctx, "#4a3a14", a + 11, base - 12, 24, 0.9);
  ombraTerra(ctx, a + 14, base + 1, 14, 3);
  // Il coperchio aperto, dietro.
  rett(ctx, C.bordo, a - 1, base - 26, 24, 9);
  rett(ctx, C.legno, a, base - 25, 22, 7);
  rett(ctx, C.oroScuro, a, base - 25, 22, 1);
  rett(ctx, C.oroScuro, a + 4, base - 25, 2, 7);
  rett(ctx, C.oroScuro, a + 16, base - 25, 2, 7);
  // L'oro che trabocca.
  for (let xx = 0; xx < 22; xx++) {
    const h = 3 + Math.round(Math.sin((xx / 21) * Math.PI) * 4);
    rett(ctx, xx % 3 ? C.oro : C.giallo, a + xx, base - 14 - h, 1, h);
  }
  rett(ctx, C.bordo, a - 1, base - 15, 24, 16);
  rett(ctx, C.legnoChiaro, a, base - 14, 22, 14);
  rett(ctx, C.legno, a, base - 4, 22, 4);
  rett(ctx, C.oroScuro, a, base - 14, 22, 2);
  rett(ctx, C.oroScuro, a + 4, base - 14, 2, 14);
  rett(ctx, C.oroScuro, a + 16, base - 14, 2, 14);
  rett(ctx, C.oro, a + 9, base - 10, 4, 5);
  rett(ctx, NERO, a + 10, base - 8, 2, 2);
  // L'oro che trabocca luccica.
  const q = passo(caso(a * 3 + base), 6);
  if (q % 2 === 0) scintilla(ctx, a + 3 + Math.floor(caso(a + q) * 16), base - 17 - Math.floor(caso(base + q) * 3));
}

function stendardoAMuro(ctx, x, y, alto = 18) {
  const cx = px(x), cima = py(y) - alto - 2;
  rett(ctx, C.oroScuro, cx - 6, cima, 13, 2);
  for (let yy = 0; yy < 16; yy++) {
    const p = yy > 11 ? yy - 11 : 0;
    rett(ctx, C.tappeto, cx - 5 + p, cima + 2 + yy, 11 - p * 2, 1);
    rett(ctx, C.oroScuro, cx - 5 + p, cima + 2 + yy, 1, 1);
    rett(ctx, C.oroScuro, cx + 5 - p, cima + 2 + yy, 1, 1);
  }
  rett(ctx, C.oro, cx - 2, cima + 7, 5, 3);
  rett(ctx, C.giallo, cx - 1, cima + 7, 2, 1);
}

function piedistallo(ctx, x, y) {
  const cx = px(x), base = py(y);
  retino(ctx, "#5a4818", cx - 34, base - 60, 68, 64, (xx, yy) => 0.9 * (1 - Math.hypot((xx - cx) / 34, (yy - base + 26) / 30)));
  ombraTerra(ctx, cx + 3, base + 1, 16, 3);
  scatola(ctx, cx - 14, base, 28, 8, 8, C.pietraChiara, C.pietra, C.bianco);
  scatola(ctx, cx - 10, base - 8, 20, 6, 10, C.pietraChiara, C.pietra, C.bianco);
  // La caramella dorata gigante sul piedistallo, con i suoi incarti.
  const a = cx, b = base - 34;
  for (const v of [-1, 1]) {
    for (let i = 0; i < 5; i++) rett(ctx, i % 2 ? C.oroScuro : C.oro, a + v * (8 + i), b - 1 - Math.floor(i / 2), 1, 3 + Math.floor(i / 2) * 2);
  }
  ovale(ctx, a, b, 8, 7, [C.oroScuro, C.oro, "#ffd07a", C.giallo]);
  rett(ctx, C.bianco, a - 4, b - 4, 2, 1);
  rett(ctx, C.bianco, a - 4, b - 4, 1, 2);
  // Le stelline attorno alla caramella si accendono a turno.
  const turno = passo(0, 4);
  [[-14, -12], [12, -8], [-11, 6], [13, 4]].forEach(([dx, dy], i) => {
    if (i !== turno && i !== (turno + 1) % 4) return;
    rett(ctx, C.giallo, a + dx - 1, b + dy, 3, 1);
    rett(ctx, C.giallo, a + dx, b + dy - 1, 1, 3);
    rett(ctx, C.bianco, a + dx, b + dy, 1, 1);
  });
}

function portaDOro(ctx, x0, x1, y) {
  const a = px(x0), b = px(x1), base = py(y);
  bagliore(ctx, "#4a3a14", (a + b) / 2, base - 10, 20, 1);
  rett(ctx, C.bordo, a - 1, base - 19, b - a + 2, 19);
  rett(ctx, C.oroScuro, a, base - 18, b - a, 18);
  rett(ctx, C.oro, a + 1, base - 18, b - a - 2, 2);
  for (let x = a + 3; x < b - 2; x += 4) rett(ctx, C.oro, x, base - 15, 1, 13);
  rett(ctx, C.giallo, a + 1, base - 18, 2, 18);
  rett(ctx, NERO, Math.round((a + b) / 2) - 1, base - 10, 3, 4);
  rett(ctx, C.giallo, Math.round((a + b) / 2), base - 9, 1, 1);
}

// ── Disegno dei due piani ──

/** Disegna in ordine dall'alto in basso: chi sta più giù copre chi sta dietro, come nella vista a tre quarti. */
function disegnaInOrdine(ctx, muri, oggetti) {
  const cose = [
    ...muri.map(([stile, x0, y0, x1, y1]) => ({
      y: Math.max(y0, y1), ordine: y0 === y1 ? 1 : 0,
      disegna: () => (y0 === y1 ? muroOrizzontale(ctx, STILI[stile], Math.min(x0, x1), Math.max(x0, x1), y0)
        : muroVerticale(ctx, STILI[stile], x0, Math.min(y0, y1), Math.max(y0, y1))),
    })),
    ...oggetti.map(([y, disegna]) => ({ y, ordine: 2, disegna })),
  ];
  cose.sort((a, b) => a.y - b.y || a.ordine - b.ordine);
  for (const c of cose) c.disegna();
}

export function pianoTerra(ctx) {
  prato(ctx);
  // Il sentiero di sassi che arriva al cancello dal basso.
  pavimento(ctx, [19.6, 37, 3.8, 3], "selciato", 4);
  tetto(ctx, 31, 17, 16, 15);
  // Pavimenti.
  STANZE.cancello.zone.forEach((z, i) => pavimento(ctx, z, "selciato", 7 + i));
  pavimento(ctx, [24, 14, 7, 5], "marmo", 2);
  pavimento(ctx, [31, 14, 2, 3], "marmo", 6);
  pavimento(ctx, [28, 19, 3, 9], "assi", 3);
  retino(ctx, "#5a4a44", px(28), py(19), 3 * S, 9 * S, (x, y) => 0.22 + 0.12 * Math.sin(x / 7 + y / 11));
  pavimento(ctx, [31, 5, 15, 9], "pista");
  pavimento(ctx, [33, 14, 6, 2], "scacchiera", 9);
  pavimento(ctx, [39, 14, 7, 2], "assiScure", 9);
  pavimento(ctx, [33, 16, 13, 1], "piastrelle");
  STANZE["area-fumatori"].zone.forEach((z) => pavimento(ctx, z, "lastre"));
  // Tappeti e luci per terra.
  tappeto(ctx, 25.7, 15.4, 1.3, 3.6, "giu");
  tappeto(ctx, 25.7, 14.5, 7.1, 1.2);
  luciDellaPalla(ctx, 33, 7.5, 44.5, 13.5);
  retino(ctx, "#4a2c28", px(46), py(7), 4 * S, 7 * S, (x, y) => 0.8 * (1 - Math.hypot((x - px(49)) / 46, (y - py(10)) / 40)));

  disegnaInOrdine(ctx, MURI_TERRA, [
    // Fuori: alberi, il piccolo cimitero, zucche e lampioni.
    [7.2, () => albero(ctx, 19, 7.2, 18, false, 1)],
    [11.6, () => albero(ctx, 21.8, 11.6, 15, true, 2)],
    [6.6, () => albero(ctx, 25.2, 6.6, 16, false, 3)],
    [10.2, () => albero(ctx, 28.4, 10.2, 17, true, 4)],
    [17.2, () => albero(ctx, 19.4, 17.2, 18, false, 5)],
    [24, () => albero(ctx, 22, 24, 15, true, 6)],
    [30.6, () => albero(ctx, 18.8, 30.6, 17, false, 7)],
    [5.6, () => albero(ctx, 51.6, 5.6, 15, true, 8)],
    [13.2, () => albero(ctx, 52, 13.2, 15, false, 9)],
    [25.2, () => albero(ctx, 50.6, 25.2, 18, true, 10)],
    [31.2, () => albero(ctx, 52, 31.2, 15, false, 11)],
    [39.6, () => albero(ctx, 49.6, 39.6, 18, false, 12)],
    [39.4, () => albero(ctx, 33.2, 39.4, 15, true, 13)],
    [35, () => lapide(ctx, 37, 35, 1)], [35.4, () => lapide(ctx, 40, 35.4, 2)], [36.6, () => lapide(ctx, 43.5, 36.6, 3)],
    [38.2, () => lapide(ctx, 38.5, 38.2, 4)], [38, () => lapide(ctx, 45.5, 38, 5)], [34.6, () => lapide(ctx, 46.2, 34.6, 6)],
    [36.4, () => zucca(ctx, 41.7, 36.4)], [39, () => zucca(ctx, 24.8, 39)], [38.6, () => zucca(ctx, 18.8, 38.6)],
    [21.6, () => zucca(ctx, 23.2, 21.6)], [8.6, () => zucca(ctx, 22.9, 8.6)], [28, () => zucca(ctx, 49.2, 28, false)],
    [37.6, () => lampione(ctx, 18.6, 36.2)], [33.2, () => lampione(ctx, 34.6, 33.4)],
    // Il Cancello.
    [37, () => cancelloDiFerro(ctx, 20, 23, 37)],
    [33.6, () => zucca(ctx, 21.2, 33.6)], [36.4, () => zucca(ctx, 30, 36.4)], [29.6, () => zucca(ctx, 27.4, 29.6)],
    [24.4, () => zucca(ctx, 26.6, 24.4, false)],
    [34.6, () => lapide(ctx, 29.4, 34.6, 7)],
    // L'Ingresso: la scala chiusa, le torce, un quadro che guarda.
    [14, () => { torciaAMuro(ctx, 25.2, 14); torciaAMuro(ctx, 30, 14); quadroAMuro(ctx, 27.6, 14); }],
    [17, () => scala(ctx, 27, 30, 16, 17, true)],
    [15, () => vasoSecco(ctx, 24.6, 15)], [18.6, () => candelabro(ctx, 24.7, 18.6)],
    // Il Deposito.
    [21.4, () => telo(ctx, 28.8, 21.4, 1)], [23.6, () => telo(ctx, 28.9, 23.6, 2)], [25.6, () => telo(ctx, 28.8, 25.6, 3)],
    [21.8, () => cassa(ctx, 29.8, 21.8, 1)], [27.3, () => cassa(ctx, 29.6, 27.3, 1.2, 14)], [26.2, () => cassa(ctx, 30.1, 26.2, 0.8, 10)],
    [24.6, () => secchio(ctx, 30.4, 24.6)],
    [19.4, () => { ragnatelaAngolo(ctx, 30.85, 19.25, -1); ragnatelaAngolo(ctx, 28.15, 19.25, 1); }],
    // La Sala principale.
    [5, () => { festoni(ctx, 31.3, 45.7, 5); torciaAMuro(ctx, 33, 5); torciaAMuro(ctx, 44, 5); }],
    [6.9, () => consolleDj(ctx, 36.4, 40.6, 6.9)],
    [7, () => { cassaAcustica(ctx, 35.1, 7); cassaAcustica(ctx, 41.9, 7); }],
    [9.4, () => ospite(ctx, 35.4, 9.4, "scheletro", 1)], [11, () => ospite(ctx, 39.2, 11.2, "vampiro", 1)],
    [10, () => ospite(ctx, 42.6, 10, "strega", 0)], [12.6, () => ospite(ctx, 36.6, 12.6, "mummia", 1)],
    [12.3, () => ospite(ctx, 41.2, 12.3, "scheletro", 0)], [10.4, () => ospite(ctx, 36.4, 10.4, "scheletro", 1)],
    [7.4, () => tavolino(ctx, 32.5, 7.4)], [13.2, () => tavolino(ctx, 45, 13.2)], [13.2, () => tavolino(ctx, 32.6, 13.2)],
    [7.6, () => tavolino(ctx, 44.8, 7.6)],
    [13.9, () => pallaStroboscopica(ctx, 38.6, 8.2)],
    [13.95, () => { pipistrello(ctx, 34.2, 6.6); pipistrello(ctx, 43.2, 9.2); pipistrello(ctx, 40.6, 6.2); }],
    // Il bar nell'angolo della sala: lo scheletro barista dietro il bancone, i bicchieri, gli sgabelli.
    [11.7, () => scheletroBarista(ctx, 33.4, 11.7)],
    [12.21, () => bicchieri(ctx, 31.4, 35.8, 12.2)],
    [13.1, () => [32.4, 34.4].forEach((x) => sgabello(ctx, x, 13.1))],
    // I cartelli dei bagni sulle porte del corridoio.
    [16.01, () => {
      for (const [x, tipo] of [[35.5, "donne"], [38.5, "uomini"]]) cartelloBagno(ctx, px(x), py(16) - 14, tipo);
    }],
    // L'Area Fumatori.
    [7.6, () => lucineAppese(ctx, [[46.2, 7.6], [49.8, 9.4], [46.2, 11.2], [49.8, 13]])],
    [8.6, () => vasoSecco(ctx, 46.7, 8.6)],
    [10.4, () => fungoRiscaldante(ctx, 49, 10.4)],
    [14.4, () => posacenere(ctx, 47.1, 14.4)],
    [16.2, () => panca(ctx, 49.25, 12.6, 16.2)],
    [16.5, () => mozziconi(ctx, 46.3, 8, 49.5, 16.6, 4)],
  ]);
}

export function primoPiano(ctx) {
  // Sotto, il piano terra al buio: si capisce che si è saliti.
  pianoTerra(ctx);
  ctx.fillStyle = "rgba(5, 3, 12, 0.82)";
  ctx.fillRect(0, 0, MAPPA_L, MAPPA_A);
  pavimento(ctx, [27, 16, 3, 1], "lastrePietra", 1);
  pavimento(ctx, [30, 16, 12, 1], "lastrePietra", 2);
  pavimento(ctx, [30, 17, 12, 11], "lastrePietra", 3);
  pavimento(ctx, [39, 25, 3, 3], "oro");
  // La massa di pietra al centro: la nicchia del tesoro si apre a sinistra.
  rett(ctx, "#16131f", px(38), py(17), px(39) - px(38), py(22) - py(17));
  rett(ctx, "#16131f", px(35), py(21), px(38) - px(35), py(22) - py(21));
  tappeto(ctx, 30.2, 16.15, 9.2, 0.7);
  tappeto(ctx, 39.85, 16.15, 1.5, 8.4, "giu");
  disegnaInOrdine(ctx, MURI_SOPRA, [
    [17, () => scala(ctx, 27, 30, 16, 17, false)],
    [16, () => { stendardoAMuro(ctx, 33, 16); stendardoAMuro(ctx, 37, 16); stendardoAMuro(ctx, 41, 16); }],
    [17, () => { torciaAMuro(ctx, 31.6, 17); torciaAMuro(ctx, 34.2, 17); }],
    [20.6, () => piedistallo(ctx, 36.5, 20.6)],
    [26.6, () => mucchioDOro(ctx, 31.8, 26.6, 9, 1)], [21.8, () => mucchioDOro(ctx, 31.4, 21.8, 7, 2)],
    [26.4, () => mucchioDOro(ctx, 37.4, 26.4, 8, 3)], [24.2, () => mucchioDOro(ctx, 41.1, 24.2, 5, 4)],
    [24.4, () => forziere(ctx, 33.6, 24.4)], [27.2, () => forziere(ctx, 39.6, 27.2)],
    [27.5, () => monete(ctx, 30.5, 22.5, 38.8, 27.5)],
    [25, () => portaDOro(ctx, 39, 40, 25)],
  ]);
}

export const PIANI = { "piano-terra": pianoTerra, "primo-piano": primoPiano };

// ── Le sale a schermata intera ──
// Nel gioco si vede una sala alla volta e deve riempire lo schermo: ogni sala è una schermata di 16×10 quadretti
// (320×200), ridisegnata per stare in quella forma. Dalla pianta prende i collegamenti e il lato delle porte.
// Coordinate in quadretti della schermata: pavimento da x 0,4 a 15,6 e da y 1,5 a 9,8.

export const SCHERMO = [16, 10];
const SL = 0.4, SR = 15.6, ST = 1.5, SB = 9.8;
const BUIO = "#07040c";

/** I tratti di un muro da `da` ad `a` lasciando i buchi delle porte (centri in `buchi`, larghi `largo`). */
function tratti(da, a, buchi, largo) {
  const fuori = [];
  let x = da;
  // Un buco è il centro, oppure [centro, larghezza] per le porte più larghe del solito.
  const misure = buchi.map((b) => (Array.isArray(b) ? b : [b, largo])).sort((p, q) => p[0] - q[0]);
  for (const [c, l] of misure) {
    if (c - l / 2 > x) fuori.push([x, c - l / 2]);
    x = c + l / 2;
  }
  if (a > x) fuori.push([x, a]);
  return fuori;
}

/**
 * I quattro muri della sala, con i buchi delle porte: nord e sud per x, ovest ed est per y. `cima` è dove sta il
 * muro di fondo: più in basso del solito nelle sale con il muro di fondo alto (i corridoi con le porte sopra).
 */
function muriSala({ nord = [], sud = [], ovest = [], est = [] }, { stileNord = "casa", stileSud = "basso", stileLati = stileNord, cima = ST, fondo = SB } = {}) {
  return [
    ...tratti(SL, SR, nord, 1.6).map(([a, b]) => [stileNord, a, cima, b, cima]),
    ...tratti(SL, SR, sud, 1.6).map(([a, b]) => [stileSud, a, fondo, b, fondo]),
    ...tratti(cima, fondo, ovest, 2.4).map(([a, b]) => [stileLati, SL, a, SL, b]),
    ...tratti(cima, fondo, est, 2.4).map(([a, b]) => [stileLati, SR, a, SR, b]),
  ];
}

/** Una porta nel muro di fondo: stipiti, architrave e il buio della sala dopo. */
function portaNord(ctx, x, st = STILI.casa, linea = ST) {
  const a = px(x - 0.6), b = px(x + 0.6), base = py(linea), cima = base - st.alto;
  rett(ctx, BUIO, a, cima, b - a, st.alto);
  retino(ctx, "#2a1c38", a, cima, b - a, st.alto, (xx, yy) => ((yy - cima) / st.alto) * 0.8);
  rett(ctx, C.legnoScuro, a - 3, cima - 1, 3, st.alto + 1);
  rett(ctx, C.legnoScuro, b, cima - 1, 3, st.alto + 1);
  rett(ctx, C.legno, a - 3, cima - 1, 1, st.alto + 1);
  rett(ctx, st.cima, a - 5, cima - st.spess, b - a + 10, st.spess);
  rett(ctx, st.bordo, a - 5, cima - st.spess, b - a + 10, 1);
  rett(ctx, C.pietra, a - 2, base - 1, b - a + 4, 2);
}

/** Una porta nel muretto davanti: lo zerbino e il buio fuori dalla schermata. */
function portaSud(ctx, x, fondo = SB) {
  const a = px(x - 0.8), b = px(x + 0.8), base = py(fondo);
  rett(ctx, "#3a2418", a + 3, base - 13, b - a - 6, 10);
  for (let xx = a + 4; xx < b - 4; xx += 2) rett(ctx, "#5a3a26", xx, base - 12, 1, 8);
  rett(ctx, C.pietra, a, base - 2, b - a, 2);
  rett(ctx, BUIO, a, base, b - a, 200 - base);
}

/** Una porta in un muro laterale (verso -1 a ovest, 1 a est): soglia e passaggio verso il bordo dello schermo. */
function portaLato(ctx, y, verso) {
  // Nella vista a tre quarti i muri laterali si vedono dall'alto: la porta è il varco fra i due tratti di muro,
  // con il buio del passaggio, l'architrave di legno e uno zerbino che porta fin lì.
  const st = STILI.casa, c = px(verso < 0 ? SL : SR);
  const su = py(y - 1.2), giu = py(y + 1.2) - st.alto - st.spess;
  const da = verso < 0 ? 0 : c - 5, fino = verso < 0 ? c + 5 : px(SCHERMO[0]);
  rett(ctx, BUIO, da, su - 4, fino - da, giu - su + 10);
  retino(ctx, "#2a1c38", da, su - 4, fino - da, giu - su + 10, (xx) => (verso < 0 ? xx / fino : 1 - (xx - da) / (fino - da)) * 0.9);
  rett(ctx, C.legnoScuro, c - 6, su - 6, 12, 3);
  rett(ctx, C.legnoChiaro, c - 6, su - 6, 12, 1);
  rett(ctx, C.pietra, c - 6, giu + 5, 12, 2);
  const za = verso < 0 ? c + 6 : c - 30;
  rett(ctx, "#3a2418", za, giu - 4, 24, 10);
  for (let xx = za + 1; xx < za + 23; xx += 2) rett(ctx, "#5a3a26", xx, giu - 3, 1, 8);
}

function finestrella(ctx, x, st = STILI.casa) {
  const cx = px(x), cima = py(ST) - st.alto + 3;
  bagliore(ctx, "#4a3040", cx, cima + 5, 12, 0.9);
  rett(ctx, C.bordo, cx - 5, cima - 1, 11, 12);
  rett(ctx, C.vetro, cx - 4, cima, 9, 10);
  rett(ctx, C.fiamma, cx, cima, 1, 10);
  rett(ctx, C.fiamma, cx - 4, cima + 4, 9, 1);
  rett(ctx, C.pietra, cx - 5, cima + 10, 11, 1);
}

function edera(ctx, x0, x1, st = STILI.casa, seme = 1) {
  const rng = casuale(seme);
  const base = py(ST), cima = base - st.alto - st.spess;
  for (let x = px(x0); x < px(x1); x++) {
    const giu = Math.floor(rng() * st.alto * 0.9);
    if (rng() < 0.45) continue;
    for (let y = cima; y < cima + giu; y++) if (rng() > 0.35) rett(ctx, rng() > 0.7 ? "#3a5e3a" : "#24402e", x, y, 1, 1);
  }
}

function mensolaAMuro(ctx, x0, x1, st = STILI.casa) {
  const a = px(x0), b = px(x1), y = py(ST) - 6;
  const rng = casuale(x0 * 7);
  rett(ctx, C.legnoChiaro, a, y, b - a, 2);
  rett(ctx, C.legnoScuro, a, y + 2, b - a, 1);
  for (let x = a + 2; x < b - 6; x += 7 + Math.floor(rng() * 4)) {
    const c = ["#3d5a2e", "#5e3c44", "#26324a", "#8a6a30"][Math.floor(rng() * 4)];
    rett(ctx, C.bordo, x - 1, y - 9, 7, 9);
    rett(ctx, "#2a3450", x, y - 8, 5, 8);
    rett(ctx, c, x, y - 4, 5, 4);
    rett(ctx, C.notteChiara, x + 1, y - 7, 1, 2);
    rett(ctx, C.ferroChiaro, x, y - 10, 5, 2);
  }
}

/** La scala che sale verso il muro di fondo: pedate chiare e alzate scure, corrimano, la grata col lucchetto. */
function scalaSu(ctx, x0, x1, y0, y1, chiusa) {
  const a = px(x0), b = px(x1), c = py(y0), d = py(y1);
  for (let y = c, i = 0; y < d; y += 7, i++) {
    const k = (y - c) / (d - c);
    rett(ctx, k < 0.4 ? "#8f8da9" : k < 0.75 ? "#6f6d8c" : "#4f4d6a", a, y, b - a, 4);
    rett(ctx, k < 0.4 ? "#c3c1d4" : "#8f8da9", a, y, b - a, 1);
    rett(ctx, k < 0.4 ? "#4f4d6a" : "#3b3a55", a, y + 4, b - a, 3);
  }
  for (const x of [a - 3, b]) {
    rett(ctx, C.legnoScuro, x, c - 4, 3, d - c + 4);
    rett(ctx, C.legnoChiaro, x, c - 4, 1, d - c + 4);
    for (let y = c; y < d; y += 14) rett(ctx, C.legnoChiaro, x - 1, y, 5, 2);
  }
  if (chiusa) {
    const g = d - 4;
    rett(ctx, C.bordo, a - 3, g - 18, b - a + 6, 3);
    for (let x = a - 1; x < b + 2; x += 4) {
      rett(ctx, C.bordo, x, g - 18, 2, 20);
      rett(ctx, C.ferroChiaro, x, g - 18, 1, 20);
      rett(ctx, C.bordo, x, g - 21, 2, 3);
    }
    rett(ctx, C.bordo, a - 3, g - 2, b - a + 6, 3);
    const lx = Math.round((a + b) / 2);
    rett(ctx, C.bordo, lx - 5, g - 12, 11, 10);
    rett(ctx, C.oro, lx - 4, g - 9, 9, 6);
    rett(ctx, C.giallo, lx - 4, g - 9, 9, 1);
    rett(ctx, C.bordo, lx - 3, g - 14, 1, 5);
    rett(ctx, C.bordo, lx + 3, g - 14, 1, 5);
    rett(ctx, C.bordo, lx - 3, g - 14, 7, 1);
    rett(ctx, C.bordo, lx, g - 7, 1, 2);
  }
}

/** La scala che scende, nell'angolo della Sala del tesoro: più si scende, più è buio. */
function scalaGiu(ctx, x0, x1, y0, y1) {
  const a = px(x0), b = px(x1), c = py(y0), d = py(y1);
  for (let y = c, i = 0; y < d; y += 7, i++) {
    const k = (y - c) / (d - c);
    rett(ctx, k < 0.35 ? "#6f6d8c" : k < 0.7 ? "#4f4d6a" : "#2e2d45", a, y, b - a, 4);
    rett(ctx, k < 0.35 ? "#8f8da9" : "#5e5c7a", a, y, b - a, 1);
    rett(ctx, k < 0.7 ? "#3b3a55" : "#1d1a2a", a, y + 4, b - a, 3);
  }
  retino(ctx, BUIO, a, c, b - a, d - c, (x, y) => ((y - c) / (d - c)) * 1.1 - 0.2);
  for (const x of [a - 4, b]) {
    rett(ctx, "#2f2b40", x, c - 4, 4, d - c + 4);
    rett(ctx, "#45405e", x, c - 4, 1, d - c + 4);
  }
}

function pancaLunga(ctx, x0, x1, y) {
  const a = px(x0), b = px(x1), base = py(y);
  ombraTerra(ctx, Math.round((a + b) / 2) + 3, base + 1, Math.round((b - a) / 2) + 2, 3);
  rett(ctx, C.bordo, a - 1, base - 13, b - a + 2, 9);
  for (let yy = base - 12; yy < base - 5; yy += 3) {
    rett(ctx, C.legnoChiaro, a, yy, b - a, 2);
    rett(ctx, C.legnoLuce, a, yy, b - a, 1);
  }
  rett(ctx, C.legno, a, base - 6, b - a, 3);
  for (const x of [a + 2, b - 5]) rett(ctx, C.legnoScuro, x, base - 4, 3, 4);
}

/** Il vecchio armadio del deposito, con l'anta socchiusa e due occhi gialli nel buio. */
function armadio(ctx, x, y) {
  const a = px(x), base = py(y);
  ombraTerra(ctx, a + 20, base + 1, 20, 3);
  scatola(ctx, a, base, 36, 8, 44, C.legno, C.legnoScuro, C.legnoChiaro);
  rett(ctx, C.bordo, a + 17, base - 44, 2, 44);
  rett(ctx, BUIO, a + 19, base - 42, 6, 40);
  // Gli occhi nel buio dell'anta: sbattono le palpebre e ogni tanto guardano verso la porta.
  const k = passo(caso(a + base));
  if (k !== 0 && k !== 13) {
    const guarda = k >= 14 && k < 20 ? -1 : 0;
    rett(ctx, C.giallo, a + 20 + guarda, base - 30, 1, 1);
    rett(ctx, C.giallo, a + 23 + guarda, base - 30, 1, 1);
  }
  rett(ctx, C.legno, a + 25, base - 43, 10, 42);
  for (const xx of [a + 3, a + 27]) {
    rett(ctx, C.legno, xx, base - 40, 10, 16);
    rett(ctx, C.legno, xx, base - 20, 10, 16);
  }
  rett(ctx, C.oro, a + 14, base - 24, 2, 3);
}

function lanternaATerra(ctx, x, y) {
  const cx = px(x), base = py(y);
  bagliore(ctx, "#4a3a2a", cx, base - 6, 24, 1);
  ombraTerra(ctx, cx + 2, base, 6, 2);
  rett(ctx, C.bordo, cx - 4, base - 12, 9, 12);
  rett(ctx, C.fiammaChiara, cx - 3, base - 10, 7, 8);
  const f = fiammella(x, y);
  rett(ctx, C.fiamma, cx - 3, base - 6 - f + 1, 7, 3 + f);
  rett(ctx, C.bordo, cx, base - 10, 1, 8);
  rett(ctx, C.bordo, cx - 2, base - 15, 5, 3);
}

/** L'insegna al neon del bar, un bicchiere da cocktail: ogni tanto sfarfalla e la ciliegina si spegne. */
function insegnaBar(ctx, x, st) {
  const cx = px(x), cima = py(ST) - st.alto + 2, k = passo();
  bagliore(ctx, "#123a3e", cx, cima + 8, 30, 1);
  const neon = k === 7 || k === 9 ? "#1f6a66" : C.acqua;
  linea(ctx, neon, cx - 8, cima + 2, cx + 8, cima + 2);
  linea(ctx, neon, cx - 8, cima + 2, cx, cima + 10);
  linea(ctx, neon, cx + 8, cima + 2, cx, cima + 10);
  linea(ctx, neon, cx, cima + 10, cx, cima + 17);
  linea(ctx, neon, cx - 4, cima + 17, cx + 4, cima + 17);
  rett(ctx, k >= 16 && k < 19 ? C.oroScuro : C.giallo, cx + 5, cima, 2, 2);
}

/** L'insegna al neon rosa dell'Area Fumatori, sul muro di fondo, con la sigaretta accesa accanto. */
function insegnaFumatori(ctx, x, st = STILI.casa) {
  const cx = px(x), cima = py(ST) - st.alto + 3, L = larghezzaScritta("AREA FUMATORI");
  bagliore(ctx, "#4a1f3a", cx, cima + 5, 40, 1);
  rett(ctx, C.bordo, cx - L / 2 - 13, cima - 1, L + 18, 11);
  rett(ctx, "#1a1024", cx - L / 2 - 12, cima, L + 16, 9);
  // Il neon sfarfalla due volte per giro; il fumino della sigaretta dell'insegna sale a zig-zag.
  const k = passo(0.4);
  const spento = k === 3 || k === 5;
  scritta(ctx, "AREA FUMATORI", cx + 4, cima + 2, spento ? "#7a2058" : C.rosa);
  if (!spento) rett(ctx, "#ffd0e4", cx + 4 - L / 2, cima + 2, 1, 1);
  const sx = cx - L / 2 - 9, zig = passo(0, 6) % 2;
  rett(ctx, C.pietraChiara, sx, cima + 5, 5, 2);
  rett(ctx, C.brace, sx + 5, cima + 5, 1, 2);
  for (const [dx, dy] of [[5, 3], [6, 2], [5, 1], [6, 0]]) rett(ctx, C.acqua, sx + (zig ? 11 - dx : dx), cima + dy, 1, 1);
}

function jukebox(ctx, x, y) {
  const cx = px(x), base = py(y);
  bagliore(ctx, "#4a1f3a", cx, base - 18, 28, 1);
  ombraTerra(ctx, cx + 3, base + 1, 12, 3);
  for (let yy = base - 36; yy < base; yy++) {
    const dy = base - 36 + 9 - yy;
    const m = dy > 0 ? Math.round(Math.sqrt(Math.max(0, 81 - dy * dy))) + 2 : 11;
    rett(ctx, C.bordo, cx - m - 1, yy, m * 2 + 3, 1);
    rett(ctx, yy < base - 26 ? C.rosa : C.legnoScuro, cx - m, yy, m * 2 + 1, 1);
  }
  rett(ctx, C.giallo, cx - 7, base - 24, 15, 8);
  // Le barre colorate del jukebox salgono e scendono con la musica.
  const b = battito();
  for (let i = 0; i < 5; i++) {
    const h = 1 + Math.floor(caso(i * 17 + b) * 4);
    rett(ctx, [C.acqua, C.rosa, C.lilla, C.giallo, C.acqua][i], cx - 6 + i * 3, base - 18 - h, 2, h);
  }
  rett(ctx, C.ferro, cx - 8, base - 14, 17, 10);
  for (let yy = base - 13; yy < base - 5; yy += 2) rett(ctx, C.bordo, cx - 7, yy, 15, 1);
}

function cestino(ctx, x, y) {
  const cx = px(x), base = py(y);
  ombraTerra(ctx, cx + 2, base, 7, 2);
  rett(ctx, C.bordo, cx - 5, base - 14, 11, 14);
  rett(ctx, C.ferro, cx - 4, base - 13, 9, 13);
  for (let xx = cx - 3; xx < cx + 5; xx += 3) rett(ctx, C.ferroChiaro, xx, base - 12, 1, 11);
  ellisse(ctx, C.bordo, cx, base - 14, 5, 2);
  rett(ctx, C.pietraChiara, cx - 2, base - 16, 3, 2);
}

/** La porta d'oro del premio in un muro laterale (a est), chiusa da sbarre e serratura. */
function portaDOroLato(ctx, y) {
  const c = px(SR), a = py(y - 0.6), b = py(y + 0.6);
  bagliore(ctx, "#5a4818", c - 6, (a + b) / 2, 26, 1);
  rett(ctx, C.bordo, c - 6, a - 20, 10, b - a + 20);
  rett(ctx, C.oroScuro, c - 5, a - 19, 8, b - a + 18);
  rett(ctx, C.giallo, c - 5, a - 19, 1, b - a + 18);
  for (let yy = a - 16; yy < b - 2; yy += 4) rett(ctx, C.oro, c - 4, yy, 6, 1);
  rett(ctx, NERO, c - 3, Math.round((a + b) / 2) - 12, 3, 4);
  // Un riflesso scende lungo la porta, poi riparte dall'alto.
  const r = a - 19 + Math.floor((passo(0, 12) / 12) * (b - a + 18));
  rett(ctx, C.giallo, c - 4, r, 6, 1);
  rett(ctx, C.bianco, c - 2, r, 1, 1);
}

// ── I corridoi: il muro di fondo è alto, con le porte dei bagni e degli spogliatoi ──

const CIMA_CORRIDOIO = 2.2;

/** Una porta chiusa disegnata sul muro di fondo (non è un'uscita): stipiti, pannelli, maniglia, soglia. */
function portaSullaParete(ctx, x, st, cima, colori = [C.legno, C.legnoScuro, C.legnoChiaro]) {
  const base = py(cima), a = px(x - 0.7), b = px(x + 0.7), alto = base - st.alto + 3;
  rett(ctx, C.bordo, a - 3, alto - 3, b - a + 6, base - alto + 3);
  rett(ctx, colori[2], a - 2, alto - 2, b - a + 4, 1);
  rett(ctx, colori[0], a, alto, b - a, base - alto);
  rett(ctx, colori[1], a + 3, alto + 3, b - a - 6, 9);
  rett(ctx, colori[1], a + 3, alto + 15, b - a - 6, base - alto - 18);
  rett(ctx, colori[2], a + 3, alto + 3, b - a - 6, 1);
  rett(ctx, colori[2], a + 3, alto + 15, b - a - 6, 1);
  rett(ctx, C.oro, b - 5, alto + 14, 2, 3);
  rett(ctx, C.pietra, a - 3, base - 1, b - a + 6, 2);
  return { a, b, alto, base };
}

/** Il cartello del bagno: una figurina rosa con la gonna per le donne, azzurra per gli uomini. */
function cartelloBagno(ctx, cx, y, tipo) {
  rett(ctx, C.bordo, cx - 6, y - 1, 13, 15);
  rett(ctx, "#e8e4f0", cx - 5, y, 11, 13);
  const c = tipo === "donne" ? "#d03a6a" : "#2a6cff";
  rett(ctx, c, cx - 1, y + 2, 3, 3);
  if (tipo === "donne") {
    for (let i = 0; i < 4; i++) rett(ctx, c, cx - 1 - Math.floor(i / 2) - (i > 2 ? 1 : 0), y + 6 + i, 3 + Math.floor(i / 2) * 2 + (i > 2 ? 2 : 0), 1);
    rett(ctx, c, cx - 1, y + 10, 1, 2);
    rett(ctx, c, cx + 1, y + 10, 1, 2);
  } else {
    rett(ctx, c, cx - 2, y + 6, 5, 4);
    rett(ctx, c, cx - 2, y + 10, 2, 2);
    rett(ctx, c, cx + 1, y + 10, 2, 2);
  }
}

/** La lampada a muro dei corridoi: ogni tanto la lampadina sfarfalla, ognuna in un momento diverso. */
function lampadaAMuro(ctx, x, st, cima) {
  const cx = px(x), y = py(cima) - st.alto + 6, k = passo(caso(x * 41));
  bagliore(ctx, "#4a3a40", cx, y + 3, 26, 1);
  rett(ctx, C.ferro, cx - 1, y + 4, 3, 4);
  rett(ctx, C.bordo, cx - 4, y - 2, 9, 6);
  const sfarfalla = k === 4 || k === 6;
  rett(ctx, sfarfalla ? C.oroScuro : C.fiammaChiara, cx - 3, y - 1, 7, 4);
  rett(ctx, sfarfalla ? C.fiamma : C.luna, cx - 1, y, 2, 2);
}

/** Il cartello giallo del pavimento bagnato. */
function pavimentoBagnato(ctx, x, y) {
  const cx = px(x), base = py(y);
  ombraTerra(ctx, cx + 2, base, 8, 2);
  retino(ctx, "#5a7a9a", cx - 14, base - 3, 18, 6, (xx, yy) => 0.6 * (1 - Math.hypot((xx - cx + 5) / 9, (yy - base) / 3)));
  for (let yy = 0; yy < 16; yy++) {
    const m = 2 + Math.floor(yy / 3);
    rett(ctx, C.bordo, cx - m - 1, base - 16 + yy, m * 2 + 3, 1);
    rett(ctx, C.giallo, cx - m, base - 16 + yy, m * 2 + 1, 1);
  }
  rett(ctx, C.bordo, cx, base - 12, 1, 6);
  rett(ctx, C.bordo, cx, base - 4, 1, 1);
}

/** La carta igienica srotolata che esce dal bagno, come le bende di una mummia. */
function cartaIgienica(ctx, punti) {
  for (let i = 0; i < punti.length - 1; i++) {
    const [ax, ay] = [px(punti[i][0]), py(punti[i][1])], [bx, by] = [px(punti[i + 1][0]), py(punti[i + 1][1])];
    linea(ctx, "#e8e4f0", ax, ay, bx, by);
    linea(ctx, "#e8e4f0", ax, ay + 1, bx, by + 1);
    linea(ctx, "#a9a4bc", ax, ay + 2, bx, by + 2);
  }
  const [ex, ey] = [px(punti.at(-1)[0]), py(punti.at(-1)[1])];
  rett(ctx, C.bordo, ex - 4, ey - 4, 9, 8);
  rett(ctx, "#e8e4f0", ex - 3, ey - 3, 7, 6);
  rett(ctx, "#a9a4bc", ex - 3, ey + 1, 7, 2);
  rett(ctx, "#8f8da9", ex, ey - 1, 1, 2);
}

/** Una porta di spogliatoio chiusa: la stella sulla porta, due assi inchiodate a croce, catena e lucchetto. */
function portaSpogliatoio(ctx, x, st, cima) {
  const { a, b, alto, base } = portaSullaParete(ctx, x, st, cima, ["#4a2e3a", "#33202a", "#6a4a58"]);
  const cx = Math.round((a + b) / 2);
  rett(ctx, C.oro, cx - 1, alto + 4, 3, 3);
  rett(ctx, C.oro, cx - 3, alto + 6, 7, 1);
  rett(ctx, C.oro, cx - 2, alto + 7, 2, 2);
  rett(ctx, C.oro, cx + 1, alto + 7, 2, 2);
  for (const [x0, y0, x1, y1] of [[a - 4, alto + 2, b + 3, base - 4], [b + 3, alto + 2, a - 4, base - 4]]) {
    for (let d = 0; d < 3; d++) linea(ctx, d === 0 ? C.legnoChiaro : C.legno, x0, y0 + d, x1, y1 + d);
    rett(ctx, C.ferroChiaro, x0 + (x1 > x0 ? 2 : -3), y0 + 1, 1, 1);
    rett(ctx, C.ferroChiaro, x1 + (x1 > x0 ? -3 : 2), y1 + 1, 1, 1);
  }
  for (let xx = a - 2; xx < b + 2; xx += 3) rett(ctx, xx % 2 ? C.ferroChiaro : C.ferro, xx, alto + 17, 2, 2);
  rett(ctx, C.bordo, cx - 4, alto + 18, 9, 9);
  rett(ctx, C.oro, cx - 3, alto + 21, 7, 5);
  rett(ctx, C.giallo, cx - 3, alto + 21, 7, 1);
  rett(ctx, C.bordo, cx, alto + 23, 1, 2);
}

// Il carattere piccolo dei cartelli, 5 pixel di altezza: le lettere che servono per KEEP OUT, WARNING, DANGER…
const LETTERE = {
  A: [".#.", "#.#", "###", "#.#", "#.#"], B: ["##.", "#.#", "##.", "#.#", "##."], C: [".##", "#..", "#..", "#..", ".##"],
  D: ["##.", "#.#", "#.#", "#.#", "##."], E: ["###", "#..", "##.", "#..", "###"], F: ["###", "#..", "##.", "#..", "#.."],
  G: [".##", "#..", "#.#", "#.#", ".##"], H: ["#.#", "#.#", "###", "#.#", "#.#"], I: ["###", ".#.", ".#.", ".#.", "###"],
  K: ["#.#", "##.", "#..", "##.", "#.#"], L: ["#..", "#..", "#..", "#..", "###"], M: ["#...#", "##.##", "#.#.#", "#...#", "#...#"],
  N: ["#..#", "##.#", "#.##", "#..#", "#..#"], O: ["###", "#.#", "#.#", "#.#", "###"], P: ["##.", "#.#", "##.", "#..", "#.."],
  R: ["##.", "#.#", "##.", "#.#", "#.#"], S: [".##", "#..", ".#.", "..#", "##."], T: ["###", ".#.", ".#.", ".#.", ".#."],
  U: ["#.#", "#.#", "#.#", "#.#", "###"], W: ["#...#", "#...#", "#.#.#", "##.##", "#...#"], Y: ["#.#", "#.#", ".#.", ".#.", ".#."],
  "!": ["#", "#", "#", ".", "#"], " ": ["..", "..", "..", "..", ".."],
};
const larghezzaScritta = (testo) => [...testo].reduce((l, ch) => l + (LETTERE[ch] ?? LETTERE[" "])[0].length + 1, -1);

/** Una scritta col carattere piccolo, centrata su `cx`, con la cima in `y`. */
function scritta(ctx, testo, cx, y, colore) {
  let x = Math.round(cx - larghezzaScritta(testo) / 2);
  for (const ch of testo) {
    const g = LETTERE[ch] ?? LETTERE[" "];
    g.forEach((riga, r) => [...riga].forEach((p, c) => { if (p === "#") rett(ctx, colore, x + c, y + r, 1, 1); }));
    x += g[0].length + 1;
  }
}

/** Il teschio con le ossa incrociate dei cartelli di pericolo, 9×10, con la cima in (cx, y); `fondo` per gli occhi. */
function teschioPericolo(ctx, cx, y, colore, fondo) {
  for (const [dx, dy, w] of [[-2, 0, 5], [-3, 1, 7], [-3, 2, 7], [-3, 3, 7], [-2, 4, 5], [-1, 5, 3]]) rett(ctx, colore, cx + dx, y + dy, w, 1);
  rett(ctx, fondo, cx - 2, y + 2, 2, 1);
  rett(ctx, fondo, cx + 1, y + 2, 2, 1);
  rett(ctx, fondo, cx, y + 4, 1, 1);
  for (let i = 0; i < 4; i++) {
    rett(ctx, colore, cx - 4 + i * 2 + 1, y + 6 + i, 1, 1);
    rett(ctx, colore, cx - 4 + i * 2, y + 6 + i, 1, 1);
    rett(ctx, colore, cx + 4 - i * 2 - 1, y + 6 + i, 1, 1);
    rett(ctx, colore, cx + 4 - i * 2, y + 6 + i, 1, 1);
  }
}

/** Un cartello appeso al muro di fondo: `y` è la sua cima in pixel. Restituisce quanto è alto. */
function cartelloAvviso(ctx, cx, y, tipo) {
  cx = Math.round(cx);
  if (tipo === "warning") {
    // Il triangolo giallo col teschio e la targa WARNING sotto.
    for (let r = 0; r < 15; r++) {
      const m = Math.floor(r / 2) + 1;
      rett(ctx, C.bordo, cx - m - 1, y + r, m * 2 + 3, 1);
      if (r >= 2) rett(ctx, C.giallo, cx - m, y + r, m * 2 + 1, 1);
    }
    rett(ctx, C.bordo, cx - 9, y + 15, 19, 1);
    teschioPericolo(ctx, cx, y + 4, C.bordo, C.giallo);
    const m = Math.ceil(larghezzaScritta("WARNING") / 2) + 2;
    rett(ctx, C.bordo, cx - m - 1, y + 18, m * 2 + 3, 9);
    rett(ctx, C.giallo, cx - m, y + 19, m * 2 + 1, 7);
    scritta(ctx, "WARNING", cx, y + 20, C.bordo);
    return 27;
  }
  if (tipo === "danger") {
    // Rosso sopra con DANGER, bianco sotto col teschio.
    rett(ctx, C.bordo, cx - 14, y, 29, 24);
    rett(ctx, "#e8e4f0", cx - 13, y + 1, 27, 22);
    rett(ctx, C.tappetoChiaro, cx - 12, y + 2, 25, 8);
    scritta(ctx, "DANGER", cx, y + 3, "#e8e4f0");
    teschioPericolo(ctx, cx, y + 12, C.bordo, "#e8e4f0");
    return 24;
  }
  if (tipo === "divieto") {
    // Il cerchio rosso con la barra bianca: non si entra.
    for (let dy = -7; dy <= 7; dy++)
      for (let dx = -7; dx <= 7; dx++) {
        const d = Math.hypot(dx, dy);
        if (d <= 7.5) rett(ctx, d > 6.6 ? C.bordo : Math.abs(dy) <= 1 && Math.abs(dx) <= 4 ? "#e8e4f0" : C.tappetoChiaro, cx + dx, y + 7 + dy, 1, 1);
      }
    rett(ctx, C.bordo, cx - 18, y + 17, 37, 9);
    rett(ctx, "#e8e4f0", cx - 17, y + 18, 35, 7);
    scritta(ctx, "NO ENTRY", cx, y + 19, C.tappetoChiaro);
    return 26;
  }
  if (tipo === "staff") {
    rett(ctx, C.bordo, cx - 23, y, 47, 9);
    rett(ctx, "#2a6cff", cx - 22, y + 1, 45, 7);
    scritta(ctx, "STAFF ONLY", cx, y + 2, "#e8e4f0");
    return 9;
  }
  // "vattene": la tavola rossa inchiodata, con la scritta a mano.
  const m = Math.ceil(larghezzaScritta("GO AWAY!") / 2) + 5;
  rett(ctx, C.bordo, cx - m - 1, y, m * 2 + 3, 13);
  rett(ctx, C.tappetoChiaro, cx - m, y + 1, m * 2 + 1, 11);
  rett(ctx, C.tappeto, cx - m, y + 10, m * 2 + 1, 2);
  rett(ctx, "#ff6a5a", cx - m, y + 1, m * 2 + 1, 1);
  scritta(ctx, "GO AWAY!", cx, y + 4, "#e8e4f0");
  rett(ctx, C.ferroChiaro, cx - m + 1, y + 2, 1, 1);
  rett(ctx, C.ferroChiaro, cx + m - 1, y + 2, 1, 1);
  return 13;
}

/** L'acqua che esce da sotto una porta del muro di fondo e si allarga sulle piastrelle. */
function acquaSottoLaPorta(ctx, x0, x1, y) {
  const a = px(x0), b = px(x1), cy = py(y), mezzo = (a + b) / 2;
  retino(ctx, "#3e5a80", a - 4, cy, b - a + 8, 12, (xx, yy) => 1.3 - Math.hypot((xx - mezzo) / ((b - a) / 2 + 4), (yy - cy) / 10) * 1.4);
  retino(ctx, "#6a8ab0", a, cy, b - a, 8, (xx, yy) => 0.9 - Math.hypot((xx - mezzo) / ((b - a) / 2), (yy - cy) / 7) * 1.3);
  // I riflessi tremano sull'acqua.
  const q = passo(0.3, 6) % 3;
  rett(ctx, "#b8d4f0", a + 5 + q, cy + 3, 4 - (q === 1 ? 1 : 0), 1);
  rett(ctx, "#b8d4f0", b - 8 - q, cy + 5, 2, 1);
}

/** Il nastro giallo e nero con la scritta, teso da a a b (pixel) all'altezza y; scende un po' verso destra. */
function nastroPericolo(ctx, a, b, y, testo, scende = 2) {
  const quota = (x) => y + Math.round(((x - a) / (b - a)) * scende);
  for (let x = a; x < b; x++) {
    rett(ctx, C.bordo, x, quota(x) - 1, 1, 9);
    rett(ctx, C.giallo, x, quota(x), 1, 7);
  }
  // La scritta al centro del nastro, lettera per lettera, così segue la pendenza e non esce dal giallo.
  let x = Math.round((a + b) / 2 - larghezzaScritta(testo) / 2);
  for (const ch of testo) {
    const w = (LETTERE[ch] ?? LETTERE[" "])[0].length;
    scritta(ctx, ch, x + w / 2, quota(x + w / 2) + 1, C.bordo);
    x += w + 1;
  }
}

/** La transenna a strisce bianche e rosse, con il cartello KEEP OUT appeso. */
function transenna(ctx, x0, x1, y) {
  const a = px(x0), b = px(x1), base = py(y);
  ombraTerra(ctx, Math.round((a + b) / 2) + 3, base + 1, Math.round((b - a) / 2) + 3, 3);
  for (const x of [a + 2, b - 4]) {
    linea(ctx, C.bordo, x - 4, base, x + 1, base - 20);
    linea(ctx, C.bordo, x + 6, base, x + 1, base - 20);
    linea(ctx, C.ferroChiaro, x - 3, base, x + 1, base - 19);
    linea(ctx, C.ferro, x + 5, base, x + 1, base - 19);
  }
  rett(ctx, C.bordo, a - 2, base - 24, b - a + 4, 8);
  for (let x = a - 1; x < b + 1; x++) rett(ctx, Math.floor((x - a + 40) / 5) % 2 ? "#e8e4f0" : C.tappetoChiaro, x, base - 23, 1, 6);
  rett(ctx, "#ff6a5a", a - 1, base - 23, b - a + 2, 1);
  // Il cartello appeso con due fili sotto la sbarra.
  const cx = Math.round((a + b) / 2);
  rett(ctx, C.ferroChiaro, cx - 12, base - 17, 1, 3);
  rett(ctx, C.ferroChiaro, cx + 12, base - 17, 1, 3);
  rett(ctx, C.bordo, cx - 18, base - 14, 37, 11);
  rett(ctx, C.giallo, cx - 17, base - 13, 35, 9);
  scritta(ctx, "KEEP OUT", cx, base - 11, C.bordo);
}

/** Il cono arancione con la fascia bianca. */
function cono(ctx, x, y) {
  const cx = px(x), base = py(y);
  ombraTerra(ctx, cx + 2, base, 7, 2);
  rett(ctx, C.bordo, cx - 7, base - 3, 15, 3);
  rett(ctx, "#d9661a", cx - 6, base - 2, 13, 1);
  for (let r = 0; r < 14; r++) {
    const m = 1 + Math.floor(r / 3);
    rett(ctx, C.bordo, cx - m - 1, base - 17 + r, m * 2 + 3, 1);
    rett(ctx, r >= 5 && r <= 7 ? "#e8e4f0" : r < 2 ? "#ffb050" : "#f28c28", cx - m, base - 17 + r, m * 2 + 1, 1);
  }
}

/** Le piastrelle chiare a metà del muro dei bagni, sopra i mattoni: qualcuna crepata, qualcuna caduta. */
function piastrelleAMuro(ctx, x0, x1, st, cima) {
  const a = px(x0) - 4, b = px(x1) + 4, base = py(cima) - 2, alto = 18;
  const rng = casuale(Math.round(x0 * 13));
  rett(ctx, "#22303a", a, base - alto, b - a, alto);
  for (let y = base - alto, r = 0; y < base; y += 6, r++)
    for (let x = a - (r % 2) * 3; x < b; x += 6) {
      const k = rng();
      if (k < 0.04) continue;
      const tono = k > 0.85 ? "#5e7a84" : k > 0.3 ? "#4a6670" : "#40585f";
      rett(ctx, tono, Math.max(a, x + 1), y + 1, Math.min(5, b - x - 1), 5);
      rett(ctx, "#7a96a0", Math.max(a, x + 1), y + 1, Math.min(4, b - x - 1), 1);
      if (k > 0.94) linea(ctx, "#22303a", x + 1, y + 1, x + 4, y + 5);
    }
  rett(ctx, "#8aa6b0", a, base - alto - 1, b - a, 1);
  rett(ctx, "#22303a", a, base - alto, b - a, 1);
  // Il grigio sporco che sale dal pavimento.
  retino(ctx, "#2a3036", a, base - 6, b - a, 6, (x, y) => (y - base + 6) / 7);
}

/** La spia della serratura: rossa quando è occupato. */
function spiaOccupato(ctx, d) {
  rett(ctx, C.bordo, d.b - 7, d.alto + 9, 5, 4);
  rett(ctx, C.tappetoChiaro, d.b - 6, d.alto + 10, 3, 2);
  rett(ctx, "#ff8a7a", d.b - 6, d.alto + 10, 1, 1);
}

/** Lo specchio da camerino con le lampadine, appoggiato al muro. */
function specchioConLuci(ctx, x, y) {
  const cx = px(x), base = py(y);
  bagliore(ctx, "#4a4030", cx, base - 20, 30, 1);
  ombraTerra(ctx, cx + 3, base + 1, 14, 3);
  rett(ctx, C.bordo, cx - 13, base - 40, 27, 40);
  rett(ctx, C.legnoChiaro, cx - 12, base - 39, 25, 38);
  rett(ctx, "#26324a", cx - 8, base - 35, 17, 30);
  linea(ctx, "#4a5a7a", cx - 6, base - 9, cx + 4, base - 33);
  linea(ctx, "#4a5a7a", cx - 2, base - 9, cx + 7, base - 28);
  // Le lampadine fanno la rincorsa tutto attorno: una su quattro è spenta, e quella spenta avanza.
  const lampadine = [];
  for (let yy = base - 2 - 5; yy >= base - 37; yy -= 6) lampadine.push([cx - 11, yy]);
  for (let xx = cx - 7; xx < cx + 9; xx += 5) lampadine.push([xx, base - 38]);
  for (let yy = base - 37; yy < base - 2; yy += 6) lampadine.push([cx + 10, yy]);
  const corre = passo(0, 8);
  lampadine.forEach(([xx, yy], i) => rett(ctx, (i + 8 - (corre % 4)) % 4 === 0 ? C.oroScuro : C.giallo, xx, yy, 2, 2));
}

/** Il manichino con la maschera bianca. Ogni tanto (un evento a caso) gira la testa di scatto verso chi passa. */
function manichino(ctx, x, y) {
  const cx = px(x), base = py(y);
  const k = evento("manichino", { tipo: "scena", fotogrammi: 16, attesa: [6000, 14000] });
  // Di scatto a metà, poi di colpo tutta girata, ferma, e torna com'era.
  const gira = k === null ? 0 : k < 0.12 ? 0 : k < 0.2 ? 1 : k < 0.75 ? 2 : k < 0.82 ? 1 : 0;
  ombraTerra(ctx, cx + 2, base, 7, 2);
  rett(ctx, C.ferro, cx - 4, base - 2, 9, 2);
  rett(ctx, C.ferro, cx, base - 12, 1, 10);
  for (let yy = 0; yy < 14; yy++) {
    const m = yy < 4 ? 5 - Math.floor(yy / 2) : yy < 8 ? 3 : 3 + Math.floor((yy - 8) / 2);
    rett(ctx, C.bordo, cx - m - 1, base - 26 + yy, m * 2 + 3, 1);
    rett(ctx, "#c8a888", cx - m, base - 26 + yy, m * 2 + 1, 1);
  }
  const t = gira === 2 ? 1 : 0;
  rett(ctx, C.bordo, cx - 4 + t, base - 35 - t, 9, 9);
  rett(ctx, "#f0ece0", cx - 3 + t, base - 34 - t, 7, 7);
  if (gira === 2) {
    // Di profilo, verso destra: un occhio solo, più grande, e la bocca spostata.
    rett(ctx, "#c8c4b8", cx - 2, base - 35, 2, 7);
    rett(ctx, NERO, cx + 3, base - 33, 2, 3);
    rett(ctx, C.tappetoChiaro, cx + 3, base - 30, 2, 1);
  } else {
    rett(ctx, NERO, cx - 2 + gira, base - 32, 2, 2);
    rett(ctx, NERO, cx + 1 + gira, base - 32, 2, 2);
    rett(ctx, C.tappetoChiaro, cx - 1 + gira, base - 29, 3, 1);
  }
}

function baule(ctx, x, y) {
  const a = px(x), base = py(y);
  ombraTerra(ctx, a + 15, base + 1, 15, 3);
  scatola(ctx, a, base, 28, 8, 14, "#4a2e20", C.legnoScuro, C.legno);
  for (const xx of [a + 6, a + 20]) rett(ctx, C.ferro, xx, base - 22, 2, 22);
  rett(ctx, C.oro, a + 12, base - 12, 4, 4);
  rett(ctx, C.tappeto, a + 22, base - 24, 6, 3);
}

// ── I mostri della festa: la coda del bagno e i fumatori ──
// Disegnati pixel per pixel come gli sprite di Zucco e delle chiavi: una lettera per colore, "." per il vuoto.
// Guardano tutti a sinistra (la coda va verso la porta del bagno); `specchio` li gira a destra. Le gambe sono a
// parte, così lo stesso mostro può stare dritto, a gambe incrociate o battere il piede.

// Le bende delle mummie: righe oblique più scure sulla tela chiara (la lettera "m" dipende dal pixel).
const BENDE = (x, y) => ((x + y * 2) % 5 === 0 ? "#a8a088" : (x + y * 2) % 5 === 1 ? "#c4bca2" : "#e0d8c0");

const TAVOLOZZA_MOSTRI = {
  k: C.bordo, n: NERO, w: "#e8e4f0", W: "#a9a4bc", y: C.giallo, o: C.oro, O: C.oroScuro, s: C.pietraChiara, e: C.brace,
  m: BENDE, d: "#7a7258",
};

// Per le animazioni: ogni mostro può avere `occhi` (i pixel che si chiudono, col colore della `palpebra`) e `anima`,
// che riceve il passo del giro (k, da 0 a 23, già sfasato) e cambia lo stato: dy (il busto si abbassa di un pixel),
// dx, gambe, pose (righe del corpo sostituite), colori, vola.

// Il pugno che bussa, un pixel più su: le righe 2-6 della mummia di schiena.
const POSA_BUSSA = { 2: "..kmmmmmmmk.kk", 3: "..kmmmmmmmkkmk", 4: "..kmmmmmmdkmmk", 5: "..kdmmmmmdkkdk", 6: "...kmmmmdk.kmk" };
// La coda del diavoletto che si sposta in giù.
const POSA_CODA = { 11: ".fkdkdddDDk..", 12: ".fkdkddddDk.k", 13: ".f.kkddddDkdk" };

const MOSTRI = {
  // La mummia di schiena, davanti alla porta del bagno: bussa due volte, aspetta, ribussa.
  mummiaBussa: {
    colori: {},
    anima: (k, a) => { if (k < 2 || (k >= 3 && k < 5)) a.pose = POSA_BUSSA; },
    corpo: [
      "....kkkkk.....",
      "...kmmmmmk....",
      "..kmmmmmmmk...",
      "..kmmmmmmmk.kk",
      "..kmmmmmmdkkmk",
      "..kdmmmmmdkmmk",
      "...kmmmmdkkmdk",
      "....kmmdk.kmk.",
      "..kkmmmmmkkmk.",
      ".kmmmmmmmmmdk.",
      ".kmmmmmmmmdk..",
      "kmmkmmmmmmdk..",
      "kmmkmmmmmmdk..",
      "kmdkmmmmmmdk..",
      "kmdkmmmmmmdk..",
      ".kkkmmmmmmdk..",
      "...kmmmmmmdk..",
      "...kmmmmmmdk..",
    ],
    gambe: {
      dritte: [
        "...kmmmkmmdk..",
        "...kmmmkmmdk..",
        "...kmmmkmmdk..",
        "...kmmdkmmdk..",
        "...kddmkmddk..",
        "...kkkkkkkkk..",
      ],
    },
  },
  // La mummia di fronte, con un occhio giallo fra le bende e una benda che penzola dal braccio.
  mummia: {
    colori: {},
    bocca: [3, 6],
    occhi: [[3, 3], [4, 3]],
    palpebra: "m",
    corpo: [
      "....kkkkk.....",
      "...kmmmmmk....",
      "..kmmmmmmdk...",
      "..kynmmmmdk...",
      "..kmmmmmmdk...",
      "..kdmmmmmdk...",
      "..kmmmmmmdk...",
      "...kmmmmdk....",
      "..kkmmmmmkk...",
      ".kmmmmmmmmdk..",
      ".kmmkmmmmkdk..",
      ".kmmkmmmmkdk..",
      ".kmdkmmmmkdk..",
      ".kmmkmmmmkmk..",
      ".kkmkmmmmkkk..",
      "..kmkmmmmdk...",
      "..kdkmmmmdk...",
      "...kkmmmmdk...",
    ],
    gambe: {
      dritte: [
        "...kmmkmmdk...",
        "...kmmkmmdk...",
        "...kmmkmmdk...",
        "...kmmkmmdk...",
        "..kmmdkmmmdk..",
        "..kkkkkkkkkk..",
      ],
    },
  },
  // La strega guarda il telefono: lo schermo le illumina la faccia.
  strega: {
    colori: { h: "#241a36", H: "#3f2f5a", a: "#d9661a", A: "#8a3a08", g: "#5a9a4a", G: "#3a6a34", L: "#9ad88a", v: C.violaScuro, V: C.viola, p: "#9ff5ee", P: NERO },
    bocca: [5, 13],
    occhi: [[5, 11]],
    palpebra: "L",
    // Scorre il telefono: la luce dello schermo cambia ogni mezzo secondo.
    anima: (k, a) => { if (k % 8 >= 4) a.colori = { p: "#d8fff4", L: "#b4eaa4" }; },
    corpo: [
      "..........k.....",
      ".........khk....",
      "........khHk....",
      ".......khhHk....",
      "......khhhHk....",
      ".....khhhhhHk...",
      ".....koooooook..",
      "..kkkhhhhhhhhhk.",
      ".kkhhhhhhhhhhhhk",
      "..kkkkkkkkkkkkk.",
      "....kLgggaaAk...",
      "...kLnLggaaAAk..",
      "...kLLLLgaaAAk..",
      "...kkLgGgkaAAk..",
      "....kkGgkvaAAk..",
      "...kvvkkvvvaAk..",
      "..kvVvvvvvvvAk..",
      ".kgkPpVvvvvvvk..",
      ".kgPppkVvvvvvk..",
      "..kkkkvVvvvvvk..",
      "...kvvVvvvvvvk..",
    ],
    gambe: {
      dritte: [
        "...kvVvvvvvvvvk.",
        "..kvVvvvvvvvvvk.",
        "..kVvvvvvvvvvvk.",
        ".kvVvvvvvvvvvvvk",
        ".kkkkkkkkkkkkkkk",
        "..kkk.....kkk...",
      ],
    },
  },
  // Il lupo mannaro: camicia a quadri strappata, muso lungo verso sinistra.
  lupo: {
    colori: { f: "#3e2a20", F: "#6e5038", l: "#a8865e", c: C.tappeto, C: "#5a1218", p: C.ferro, P: "#2a2a40" },
    bocca: [3, 9],
    occhi: [[9, 5]],
    palpebra: "F",
    // A gambe incrociate gli scappa: saltella da un piede all'altro.
    anima: (k, a) => {
      if (a.gambe !== "incrociate") return;
      const su = Math.floor(k / 2) % 2;
      a.gambe = su ? "saltello" : "incrociate";
      a.dy = su ? 0 : 1;
    },
    corpo: [
      "...........k..k.",
      "..........kFkkFk",
      "..........kFFFFk",
      ".........kFFFFFk",
      "........kFFFFFFk",
      ".....kkkFyFFFFfk",
      "...kkllFFFFFFFfk",
      "..kllllFFFFFFffk",
      ".knlllllFFFFFffk",
      "..kwkwlllFFFfffk",
      "...kkkkllFFfffk.",
      "......kllFFffk..",
      "....kkcllcccCk..",
      "...kFccllccCCCk.",
      "..kFkccccccCCFFk",
      "..kFkcccccCCkFfk",
      "..kFkccccccCkFfk",
      "..kllkcccccCkllk",
      "...kkkppppPPPkk.",
    ],
    gambe: {
      dritte: [
        "....kpppkppPk...",
        "....kppPkppPk...",
        "....kpPPkpPPk...",
        "....kFFFkFFFk...",
        "...klFFkklFFk...",
        "...kkkkk.kkkk...",
      ],
      incrociate: [
        "....kpppppPk....",
        ".....kppPPk.....",
        "....kpPkkpPk....",
        "...kFFk..kFFk...",
        "..klFk...klFk...",
        "..kkkk...kkkk...",
      ],
      saltello: [
        "....kpppppPk....",
        ".....kppPPk.....",
        "....kpPkkpPk....",
        "...kFFk.kFFk....",
        "..klFk..kkkk....",
        "..kkkk..........",
      ],
    },
  },
  // Lo zombie, curvo, con la bocca aperta e la camicia a brandelli.
  zombie: {
    colori: { z: "#7a9a6a", Z: "#4a6a44", c: "#6a6a8a", C: "#45435f", p: "#4a3a26", P: "#2a1a12", r: C.tappeto },
    bocca: [5, 7],
    occhi: [[4, 4], [5, 4]],
    palpebra: "z",
    // Ciondola in avanti e torna su.
    anima: (k, a) => { if (Math.floor(k / 4) % 3 === 1) a.dx = -1; },
    corpo: [
      "......kkkkk.....",
      ".....kzzzZZk....",
      "....kzzrzZZZk...",
      "....kzzzzzZZk...",
      "...kwnzzzzZZk...",
      "...kzzzzzzZZk...",
      "...kkzzzzZZZk...",
      "....knnnzZZk....",
      "....kwkwzZZk....",
      ".....kkzZZkk....",
      "...kkcccccCCk...",
      "..kccccrcccCCk..",
      ".kzkcccccccCCk..",
      ".kzkcckccccCCk..",
      "kzzkccccccCCCk..",
      "kzZkkcccCcCCk...",
      "kzzk.kcCkCckk...",
      ".kk..kppppPPk...",
    ],
    gambe: {
      dritte: [
        ".....kppPkpPk...",
        ".....kppPkpPk...",
        ".....kpPPkPPk...",
        ".....kZzkkzZk...",
        "....kzZzk.kzZk..",
        "....kkkkk.kkkk..",
      ],
    },
  },
  // Il fantasma col lenzuolo: galleggia e si è portato il rotolo di carta da casa.
  fantasma: {
    colori: { f: "#e8e4f0", F: "#b8b4cc", G: "#8f8da9" },
    vola: 4,
    occhi: [[3, 4], [4, 4], [7, 4], [8, 4]],
    palpebra: "f",
    // Galleggia su e giù invece di respirare.
    anima: (k, a) => {
      a.dy = 0;
      a.vola = [0, 1, 2, 2, 1, 0, -1, -1][Math.floor(k / 3)];
    },
    corpo: [
      ".....kkkk.....",
      "...kkffffkk...",
      "..kfffffffFk..",
      ".kffffffffFFk.",
      ".kfnnffnnfFFk.",
      ".kfnnffnnffFk.",
      ".kffffffffFFk.",
      ".kfffnnfffFFk.",
      "kkkkfnnffffFFk",
      "kwwWkffffffFFk",
      "kwnWkfffffFFFk",
      "kwwWkffffffFFk",
      "kWWWkffffFFFGk",
      ".kkkfffffFFFGk",
      ".kfffffffFFGGk",
      "kffffffFFFFGGk",
      "kfFffFffFFfGGk",
      "kfkFfkfFkFkGk.",
      ".k.kk.kk.kk.k.",
    ],
    gambe: { dritte: [] },
  },
  // Lo scheletro a braccia conserte.
  scheletro: {
    colori: {},
    bocca: [3, 7],
    // Con la posa "batte" batte davvero il piede, due volte al secondo.
    anima: (k, a) => { if (a.gambe === "batte") a.gambe = Math.floor(k / 2) % 2 ? "batte" : "dritte"; },
    corpo: [
      "....kkkkkk....",
      "...kwwwwwwk...",
      "..kwwwwwwWWk..",
      "..knnwwnnwWk..",
      "..knnwwnnwWk..",
      "..kwwwnwwwWk..",
      "...kwwwwwWk...",
      "...kwkwkwk....",
      "....kkkkk.....",
      ".....kwk......",
      "..kkwwwwwkk...",
      ".kwkwkwkwkwk..",
      ".kwwwwwwwwwk..",
      ".kWkwwwwwkWk..",
      "..kkwkwkwkk...",
      "....kwwwk.....",
      "...kwwwwwk....",
    ],
    gambe: {
      dritte: [
        "...kwk.kwk....",
        "...kwk.kwk....",
        "...kwk.kwk....",
        "...kwk.kwk....",
        "..kwwk.kwwk...",
        "..kkkk.kkkk...",
      ],
      batte: [
        "...kwk.kwk....",
        "...kwk..kwk...",
        "...kwk..kwk...",
        "...kwk.kwwk...",
        "..kwwk.kkk....",
        "..kkkk........",
      ],
    },
  },
  // Il vampiro guarda l'orologio da taschino.
  vampiro: {
    colori: { c: "#1a1226", C: C.tappeto, x: C.tappetoChiaro, f: "#d8d4e8", F: "#a9a4bc", h: NERO, v: "#3a2a52", r: C.tappetoChiaro },
    bocca: [5, 7],
    occhi: [[4, 5], [7, 5]],
    palpebra: "f",
    // Il riflesso sull'orologio da taschino.
    anima: (k, a) => { if (k === 9 || k === 10) a.colori = { o: "#fff6c8" }; },
    corpo: [
      ".....kkkkkk.....",
      "....khhhhhhk....",
      "...khhhhhhhhk...",
      "...khffhfhhhk...",
      "...kffffffhhk...",
      "...krffrfFhhk...",
      "...kffffffFhk...",
      "....kfwfwfFk....",
      "..kkxkffffkxkk..",
      ".kcxxkkkkkkxxck.",
      ".kcCxwwvvvvxCck.",
      "kccCkwwvvvvkCcck",
      "kccCkwwvvvvkCcck",
      "kcCofkwvvvvkCcck",
      "kcCoofwvvvvkCcck",
      "kcCkkkwvvvvkCcck",
      "kcCCkvvvvvvkCcck",
      "kcCCkvvvvvvkCcck",
    ],
    gambe: {
      dritte: [
        "kccCkvvkvvvkCcck",
        "kccCkvvkvvvkCcck",
        "kcccCkvkvvkCccck",
        "kccccCkkkkCcccck",
        ".kkkkkknknkkkkk.",
        "......kk.kk.....",
      ],
    },
  },
  // Il diavoletto, piccolo, in fondo alla coda: con la coda a punta e il forcone.
  diavoletto: {
    colori: { d: "#d03a2c", D: "#7e1a20", l: "#ff8a7a", f: C.ferroChiaro },
    occhi: [[5, 5], [8, 5]],
    palpebra: "d",
    // Agita la coda.
    anima: (k, a) => { if (Math.floor(k / 3) % 2) a.pose = POSA_CODA; },
    corpo: [
      "f.f.f........",
      "fff.k....k...",
      ".f.kwk..kwk..",
      ".f.kwkkkkwk..",
      ".f.kddddddk..",
      ".fkddyddydDk.",
      ".fkldddddDDk.",
      ".fkddnwnddDk.",
      ".f.kddddDDk..",
      ".f..kddDDk...",
      ".fkkddddDDk..",
      ".fkdkdddDDk.k",
      ".fkdkddddDkdk",
      ".f.kkddddDkk.",
    ],
    gambe: {
      dritte: [
        ".f..kdkDDk...",
        ".f..kdkdDk...",
        ".f.kddkkdDk..",
        ".f.kkkk.kkk..",
      ],
    },
  },
  // Il demone grosso, in giacca e cravatta, col sigaro: il capo dei fumatori.
  demone: {
    colori: { r: "#b03040", R: "#6a1828", l: "#e06060", h: "#e8dcc0", H: "#a89878", c: "#1a1226", C: "#2f2244", t: C.tappetoChiaro },
    bocca: [3, 13],
    occhi: [[4, 9], [5, 9]],
    palpebra: "r",
    corpo: [
      "..k...........k.....",
      ".khk.........khk....",
      ".khHk.......kHhk....",
      "..khHk.....kHhk.....",
      "..khhHkkkkkHhhk.....",
      "...kkkrrrrrrkk......",
      "....krrrrrrrRRk.....",
      "...klrrrrrrrRRk.....",
      "...kkkkrrrrrrRk.....",
      "...kyykrrrrrrRk.....",
      "...krrrrrrrrrRk.....",
      "..klrrrrrrrrrRk.....",
      "..krrrrrrrrrRRk.....",
      "..knnnnrrrrrrRk.....",
      "..kwnwnwrrrrRk......",
      "...kkrrrrrrRk.......",
      "....kkkrrRRk........",
      "..kkcckwwtwkcckk....",
      ".kccCCkwttwkcCCck...",
      "kcccCCkwttwkcCCCck..",
      "kcCccCkwwtwkcCCCck..",
      "kcCkcCkwwwwkcCkCck..",
      "kcCkcckwwwwkccCkck..",
      "krRkccCkkkkCccCkRk..",
      "krRkcccccccccccCkRk.",
      ".kkkcccccccccccCkkRk",
      "....kcccccccccCCk.kk",
      "....kcccccCkccCCk...",
    ],
    gambe: {
      dritte: [
        "....kcccCk.kcCCk....",
        "....kcccCk.kcCCk....",
        "....kccCCk.kcCCk....",
        "...knnnnnk.knnnnk...",
        "...kkkkkkk.kkkkkk...",
      ],
    },
  },
};

// Il lupo più vecchio, col pelo grigio e la camicia verde: per non avere due lupi uguali nella stessa sala.
const LUPO_GRIGIO = { f: "#3b3a55", F: "#6f6d8c", l: "#a9a4bc", c: "#2d5a2e", C: "#1d3a20" };

/**
 * Uno sprite a lettere centrato su `cx` con i piedi su `base`. Con `specchio` guarda a destra.
 * Restituisce dove sta il pixel (colonna, riga) che gli si chiede, già girato: serve per la sigaretta in bocca.
 */
function sprite(ctx, righe, tavolozza, cx, base, specchio = false) {
  if (!righe.length) return () => [cx, base];
  const w = righe[0].length, a = Math.round(cx - w / 2), cima = base - righe.length;
  righe.forEach((riga, yy) => {
    for (let xx = 0; xx < w; xx++) {
      const c = tavolozza[riga[xx]];
      if (c) rett(ctx, typeof c === "function" ? c(xx, yy) : c, specchio ? a + w - 1 - xx : a + xx, cima + yy, 1, 1);
    }
  });
  return ([col, riga]) => [specchio ? a + w - 1 - col : a + col, cima + riga];
}

/**
 * Un mostro della festa in (x, y), in quadretti. `gambe` sceglie la posa delle gambe; `fuma` gli mette in bocca una
 * "sigaretta", un "bocchino" lungo o un "sigaro". Restituisce la punta accesa (in pixel), da cui parte il fumo.
 */
function mostro(ctx, x, y, tipo, { specchio = false, gambe = "dritte", fuma = null, colori = {} } = {}) {
  const m = MOSTRI[tipo], cx = px(x), base = py(y);
  // Lo stato in questo istante del giro, sfasato per ogni mostro: respira (il busto scende di un pixel ogni tre
  // quarti di secondo), sbatte le palpebre una volta per giro e fa il suo gesto.
  const k = passo(sfasoDi(x, y));
  const a = { dy: Math.floor(k / 6) % 2, dx: 0, gambe, pose: null, colori: null, vola: 0 };
  m.anima?.(k, a);
  let corpo = a.pose ? m.corpo.map((riga, i) => a.pose[i] ?? riga) : m.corpo;
  if (k === 0 && m.occhi) {
    corpo = corpo.map((riga, r) => [...riga].map((ch, c) => (m.occhi.some(([oc, or]) => oc === c && or === r) ? m.palpebra : ch)).join(""));
  }
  const piedi = m.gambe[a.gambe] ?? m.gambe.dritte;
  const tavolozza = { ...TAVOLOZZA_MOSTRI, ...m.colori, ...colori, ...a.colori };
  ombraTerra(ctx, cx + 1, base, Math.ceil(corpo[0].length / 2), 2, m.vola ? 0.45 : 0.75);
  const terra = base - (m.vola ?? 0) - a.vola;
  sprite(ctx, piedi, tavolozza, cx, terra, specchio);
  const punto = sprite(ctx, corpo, tavolozza, cx + (specchio ? -a.dx : a.dx), terra - piedi.length + a.dy, specchio);
  if (!fuma || !m.bocca) return null;
  const [bx, by] = punto(m.bocca), v = specchio ? 1 : -1;
  if (fuma === "sigaro") {
    rett(ctx, C.bordo, Math.min(bx + v, bx + v * 6), by - 1, 6, 3);
    for (let i = 1; i <= 5; i++) rett(ctx, i === 2 ? C.tappetoChiaro : "#7a4a2a", bx + v * i, by, 1, 1);
    rett(ctx, C.brace, bx + v * 6, by, 1, 1);
    rett(ctx, C.fiamma, bx + v * 6, by - 1, 1, 1);
    return [bx + v * 6, by - 2];
  }
  // Il bocchino: un'asticella nera, poi la sigaretta; sale un po' perché lo tiene alto, da vampiro elegante.
  const lungo = fuma === "bocchino" ? 6 : 0;
  for (let i = 1; i <= lungo; i++) rett(ctx, i === lungo ? C.oro : NERO, bx + v * i, by - Math.floor(i / 3), 1, 1);
  const sy = by - Math.floor(lungo / 3);
  for (let i = 1; i <= 4; i++) rett(ctx, C.pietraChiara, bx + v * (lungo + i), sy, 1, 1);
  rett(ctx, C.brace, bx + v * (lungo + 5), sy, 1, 1);
  return [bx + v * (lungo + 5), sy - 1];
}

// Il fumo: scuro ai bordi, chiaro dentro. Disegnato a retino, così lascia vedere quello che c'è dietro.
const FUMO = ["#4f4d6a", "#8f8da9", "#c3c1d4"];

// Il fumo di un fumatore non gira col giro: è un evento. Una boccata dura BOCCATA.fotogrammi (3,5 secondi), poi la
// pagina aspetta da 2 a 5 secondi a caso e ne fa partire un'altra, per ogni fumatore per conto suo. A ogni boccata la
// pagina tira a sorte un fumo dalla raccolta FUMI: diverso dall'ultimo di quel fumatore e da quelli che stanno
// facendo gli altri, che stia dentro la sala, a volte specchiato. `fermo` è il fotogramma da mostrare fisso a chi ha
// chiesto meno movimento, col fumo `preferito` del fumatore.
const BOCCATA = { fotogrammi: 28, attesa: [2000, 5000], fermo: 15 };

/** La raccolta dei fumi: ognuno è uno spirito, o due che escono dalla stessa brace. I primi nove sono i preferiti. */
const FUMI = [
  { nome: "serpe piccola", spiriti: [{ alto: 12, r: 5, forma: "serpe", deriva: 0.25, fase: 1 }] },
  { nome: "urlo storto", spiriti: [{ alto: 30, r: 7, forma: "urlo", deriva: -0.45, fase: 2 }] },
  { nome: "braccia corte", spiriti: [{ alto: 24, r: 6, forma: "braccia", deriva: 0.55, fase: 4.5 }] },
  { nome: "pipistrello rosso", spiriti: [{ alto: 30, r: 6, forma: "pipistrello", deriva: 0.05, fase: 4, occhi: C.tappetoChiaro }] },
  { nome: "teschio di brace", spiriti: [{ alto: 44, r: 9, forma: "teschio", deriva: 0.12, fase: 0.5, occhi: C.brace }] },
  { nome: "braccia alte", spiriti: [{ alto: 44, r: 7, forma: "braccia", deriva: -0.1, fase: 3 }] },
  { nome: "braccia piccole", spiriti: [{ alto: 26, r: 5, forma: "braccia", deriva: -0.2, fase: 5 }] },
  { nome: "urlo alto", spiriti: [{ alto: 40, r: 6, forma: "urlo", deriva: 0.06, fase: 1.5 }] },
  { nome: "serpe lunga", spiriti: [{ alto: 46, r: 7, forma: "serpe", deriva: 0.12, fase: 2.5 }] },
  { nome: "gatto", spiriti: [{ alto: 32, r: 7, forma: "gatto", deriva: 0.15, fase: 0.8, occhi: C.giallo }] },
  { nome: "cornuto", spiriti: [{ alto: 36, r: 7, forma: "corna", deriva: -0.12, fase: 2.2, occhi: C.tappetoChiaro }] },
  { nome: "teschio piccolo", spiriti: [{ alto: 22, r: 6, forma: "teschio", deriva: 0.3, fase: 3.7, occhi: C.acqua }] },
  { nome: "pipistrello grande", spiriti: [{ alto: 38, r: 8, forma: "pipistrello", deriva: -0.2, fase: 1.1, occhi: C.giallo }] },
  { nome: "urlo gigante", spiriti: [{ alto: 48, r: 9, forma: "urlo", deriva: 0, fase: 5.5 }] },
  { nome: "gatto piccolo", spiriti: [{ alto: 18, r: 5, forma: "gatto", deriva: -0.3, fase: 2.9 }] },
  { nome: "coppia di serpi", spiriti: [{ alto: 26, r: 5, forma: "serpe", deriva: -0.35, fase: 0.3 }, { alto: 34, r: 5, forma: "serpe", deriva: 0.3, fase: 3.1 }] },
  { nome: "cornuto piccolo", spiriti: [{ alto: 20, r: 5, forma: "corna", deriva: 0.2, fase: 4.4, occhi: C.brace }] },
  { nome: "braccia lilla", spiriti: [{ alto: 34, r: 8, forma: "braccia", deriva: 0.2, fase: 6.1, occhi: C.lilla }] },
];

/** Un fumo della raccolta dalla brace in (x, y): tutti i suoi spiriti, nello stesso istante della boccata. */
function disegnaFumo(ctx, brace, f, tempo = null) {
  for (const s of f.spiriti) fumoSpirito(ctx, brace, s, tempo);
}

/** Iscrive un fumatore (dove ha la brace e il suo fumo preferito); col fumo nella sala disegna il preferito, fermo. */
function fumo(ctx, brace, preferito) {
  if (!brace) return;
  ANIMA.fumatori?.push({ stanza: ANIMA.sala, x: brace[0], y: brace[1], preferito });
  if (ANIMA.fumo) disegnaFumo(ctx, brace, FUMI[preferito]);
}

/**
 * Il fumo che sale ondeggiando dalla brace in (x0, y0), pixel, per `alto` pixel e in cima prende la forma di uno
 * spirito largo `r`: "braccia" (alza le braccia), "urlo" (la faccia lunga che urla), "teschio", "pipistrello",
 * "serpe" (lungo e sottile), "gatto" (orecchie a punta e baffi), "corna" (corna e ghigno). `occhi` colora le
 * pupille; senza, gli occhi sono vuoti.
 * `tempo` va da 0 a 1 lungo una boccata: la brace si ravviva, la scia sale, lo spirito si forma, ondeggia, si stacca e
 * svanisce. Senza `tempo` lo spirito è disegnato fermo e già formato (la sala ferma, la pianta, le anteprime).
 */
function fumoSpirito(ctx, [x0, y0], spirito, tempo = null) {
  const { alto = 40, r = 7, forma = "braccia", deriva = 0.1, onda = 3, occhi = null } = spirito;
  const fermo = tempo === null;
  const rampa = (a, b) => (fermo ? 1 : Math.max(0, Math.min(1, (tempo - a) / (b - a))));
  const cima = rampa(0.04, 0.4) * alto;                      // fin dove è salita la punta della scia
  const coda = fermo ? 0 : rampa(0.55, 0.9) * alto;          // da dove si è già dissolta, dal basso
  const forte = fermo ? 1 : Math.min(rampa(0.3, 0.5), 1 - rampa(0.72, 1)); // quanto è fitto lo spirito
  const stacca = fermo ? 0 : Math.round(rampa(0.62, 1) * 9); // lo spirito sale mentre svanisce
  const fase = (spirito.fase ?? 0) + (fermo ? 0 : tempo * 2.5);
  // La boccata: la brace si accende di più.
  if (!fermo && tempo < 0.12) {
    rett(ctx, C.fiamma, x0, y0 + 1, 1, 1);
    rett(ctx, C.fiammaChiara, x0, y0, 1, 1);
  }
  const curva = (i) => x0 + deriva * i + Math.sin(i / 6 + fase) * onda * Math.min(1, i / 12);
  // La scia: sottile appena esce dalla brace, poi si allarga e si sfrangia; la punta che sale è più rada.
  for (let i = Math.ceil(coda); i <= cima; i++) {
    const y = y0 - i, x = curva(i), m = 0.3 + (i / alto) * 1.4;
    const sfuma = Math.min(1, (cima - i) / 6 + 0.35, (i - coda) / 6 + 0.35);
    for (let xx = Math.floor(x - m - 1); xx <= Math.ceil(x + m + 1); xx++) {
      const k = (1 - Math.abs(xx - x) / (m + 0.6)) * (0.95 - (i / alto) * 0.2) * sfuma;
      if (k + dith(xx, y) * 0.8 > 0.5) rett(ctx, k > 0.7 ? FUMO[2] : FUMO[1], xx, y, 1, 1);
    }
  }
  if (forte <= 0) return;
  // Lo spirito: la coda si attacca in cima alla scia, il corpo ondeggia e si allarga fino alle spalle.
  const serpe = forma === "serpe", urlo = forma === "urlo";
  const testa = serpe ? r * 0.75 : r, lungo = r * (serpe ? 3.6 : 2.3), ry = urlo ? 1.3 : forma === "teschio" ? 1.05 : 0.95;
  const piede = y0 - alto - stacca, hx = curva(alto) + Math.sin(fase + 2) * r * 0.4, hy = piede - lungo - testa * ry * 0.4;
  const centro = (t) => curva(alto) + (hx - curva(alto)) * t + Math.sin(t * (serpe ? 9 : 4) + fase) * r * (serpe ? 0.5 : 0.25) * (1 - t);
  const capsula = (x, y, ax, ay, bx, by, spess) => {
    const vx = bx - ax, vy = by - ay, t = Math.max(0, Math.min(1, ((x - ax) * vx + (y - ay) * vy) / (vx * vx + vy * vy)));
    return 1 - Math.hypot(x - ax - vx * t, y - ay - vy * t) / spess;
  };
  const campo = (x, y) => {
    let d = 1 - Math.hypot((x - hx) / testa, (y - hy) / (testa * ry));
    if (y > hy && y <= piede) {
      const t = (piede - y) / (piede - hy), mezza = testa * (0.12 + 0.88 * Math.pow(t, 0.8)) * (1 + Math.sin(y / 3 + fase) * 0.08);
      d = Math.max(d, 1 - Math.abs(x - centro(t)) / Math.max(0.6, mezza));
    }
    if (forma === "braccia")
      for (const v of [-1, 1]) d = Math.max(d, capsula(x, y, hx + v * r * 0.7, hy + r * 0.8, hx + v * r * 1.9, hy - r * 0.5, r * 0.32));
    if (forma === "pipistrello")
      for (const v of [-1, 1]) {
        // L'ala: un ventaglio dalla spalla, col bordo di sotto a smerli.
        const ox = (x - hx) * v, oy = y - hy;
        if (ox > r * 0.4 && ox < r * 2.8) {
          const sopra = -r * 0.2 - (ox - r * 0.4) * 0.45, sotto = r * 0.9 - (ox - r * 0.4) * 0.15 - Math.abs(Math.sin(ox / (r * 0.45))) * r * 0.5;
          d = Math.max(d, Math.min((oy - sopra) / 3, (sotto - oy) / 3, 1));
        }
        d = Math.max(d, capsula(x, y, hx + v * r * 0.45, hy - r * 0.7, hx + v * r * 0.75, hy - r * 1.35, 1.6));
      }
    // Il gatto: due orecchie a punta, larghe alla base.
    if (forma === "gatto")
      for (const v of [-1, 1]) {
        const t = Math.max(0, Math.min(1, (hy - r * 0.55 - y) / (r * 0.9)));
        d = Math.max(d, capsula(x, y, hx + v * r * 0.55, hy - r * 0.55, hx + v * r * 0.8, hy - r * 1.45, 1 + r * 0.32 * (1 - t)));
      }
    // Il cornuto: due corna che escono di lato e poi salgono.
    if (forma === "corna")
      for (const v of [-1, 1]) {
        d = Math.max(d, capsula(x, y, hx + v * r * 0.6, hy - r * 0.6, hx + v * r * 1.15, hy - r * 1.0, 1.9));
        d = Math.max(d, capsula(x, y, hx + v * r * 1.15, hy - r * 1.0, hx + v * r * 1.05, hy - r * 1.6, 1.2));
      }
    return d;
  };
  const raggio = Math.ceil(r * 3), su = Math.ceil(hy - testa * ry - r * 1.6);
  bagliore(ctx, "#26304a", Math.round(hx), Math.round(hy + r * 0.6), Math.round(r * 2.6), 0.55 * forte);
  // Mentre si forma e mentre svanisce lo spirito è più rado: il retino lascia più buchi.
  const rado = (1 - forte) * 0.9;
  for (let y = su; y <= piede + 1; y++)
    for (let x = Math.floor(hx - raggio - Math.abs(hx - curva(alto))); x <= Math.ceil(hx + raggio + Math.abs(hx - curva(alto))); x++) {
      const d = campo(x, y);
      if (d <= -0.15) continue;
      const l = d * 1.5 * forte + ((hx - x) / r - (y - hy) / r) * 0.12 + dith(x, y) * 0.55 - rado * 0.3;
      if (l > 0.95) rett(ctx, FUMO[2], x, y, 1, 1);
      else if (l > 0.42) rett(ctx, FUMO[1], x, y, 1, 1);
      else if (l > 0.1 + rado * 0.4) rett(ctx, FUMO[0], x, y, 1, 1);
    }
  if (forte < 0.6) return;
  // La faccia: occhi vuoti, e la bocca che dipende dalla forma.
  const ex = Math.max(1, Math.round(testa * 0.38)), ey = Math.round(hy - testa * 0.1), cx = Math.round(hx);
  const occhio = (x) => {
    const h = Math.max(2, Math.round(testa * (forma === "teschio" ? 0.42 : 0.32)));
    rett(ctx, NERO, x - (forma === "teschio" ? 1 : 0), ey - Math.floor(h / 2), forma === "teschio" ? 3 : 2, h);
    if (occhi) rett(ctx, occhi, x, ey, 1, 1);
  };
  occhio(cx - ex - 1);
  occhio(cx + ex);
  if (forma === "teschio") {
    rett(ctx, NERO, cx, ey + Math.round(testa * 0.35), 1, 2);
    const by = Math.round(hy + testa * 0.6);
    rett(ctx, NERO, cx - 3, by, 7, 3);
    for (let x = cx - 2; x <= cx + 2; x += 2) rett(ctx, FUMO[2], x, by, 1, 2);
  } else if (urlo) {
    const h = Math.round(testa * 0.75);
    rett(ctx, NERO, cx - 1, ey + 3, 3, h);
    rett(ctx, NERO, cx - 2, ey + 4, 5, h - 2);
  } else if (forma === "pipistrello") {
    rett(ctx, NERO, cx - 2, ey + 3, 5, 1);
    rett(ctx, FUMO[2], cx - 2, ey + 4, 1, 2);
    rett(ctx, FUMO[2], cx + 2, ey + 4, 1, 2);
  } else if (forma === "gatto") {
    // Il muso a «w» e i baffi di fumo scuro.
    const by = ey + Math.max(3, Math.round(testa * 0.45));
    rett(ctx, NERO, cx - 2, by, 1, 1);
    rett(ctx, NERO, cx - 1, by + 1, 1, 1);
    rett(ctx, NERO, cx, by, 1, 1);
    rett(ctx, NERO, cx + 1, by + 1, 1, 1);
    rett(ctx, NERO, cx + 2, by, 1, 1);
    for (const v of [-1, 1]) {
      linea(ctx, FUMO[0], cx + v * 3, by, cx + v * (testa + 2), by - 1);
      linea(ctx, FUMO[0], cx + v * 3, by + 1, cx + v * (testa + 2), by + 2);
    }
  } else if (forma === "corna") {
    // Le sopracciglia cattive e il ghigno coi denti.
    for (const v of [-1, 1]) linea(ctx, NERO, cx + v * (ex + 2), ey - 3, cx + v * 1, ey - 2);
    const by = ey + Math.max(3, Math.round(testa * 0.45)), mezza = Math.max(3, Math.round(testa * 0.5));
    rett(ctx, NERO, cx - mezza, by, mezza * 2 + 1, 2);
    rett(ctx, NERO, cx - mezza - 1, by - 1, 1, 1);
    rett(ctx, NERO, cx + mezza + 1, by - 1, 1, 1);
    for (let x = cx - mezza + 1; x < cx + mezza; x += 2) rett(ctx, FUMO[2], x, by, 1, 1);
  } else {
    rett(ctx, NERO, cx - 1, ey + Math.max(3, Math.round(testa * 0.45)), 2, 2);
    if (!serpe) rett(ctx, NERO, cx - 1, ey + Math.max(3, Math.round(testa * 0.45)) + 2, 2, 1);
  }
}

// ── Fuori: la strada, il cortile del cancello e il vialetto ──

function asfalto(ctx, x, y, w, h) {
  const a = px(x), b = py(y), L = Math.round(w * S), A = Math.round(h * S);
  rett(ctx, "#1d1c2c", a, b, L, A);
  retino(ctx, "#26253a", a, b, L, A, (xx, yy) => 0.35 + 0.25 * Math.sin(xx / 7 + yy / 5) * Math.cos(yy / 9 - xx / 13));
  const rng = casuale(17);
  for (let i = 0; i < (L * A) / 90; i++) rett(ctx, rng() > 0.5 ? "#2e2d45" : "#15141f", a + Math.floor(rng() * L), b + Math.floor(rng() * A), 1, 1);
}

/** Il marciapiede: lastre chiare e il cordolo di pietra verso la strada. */
function marciapiede(ctx, x, y, w, h) {
  pavimento(ctx, [x, y, w, h], "lastre", 33);
  const a = px(x), fondo = py(y + h);
  rett(ctx, C.pietra, a, fondo - 4, Math.round(w * S), 3);
  rett(ctx, C.pietraChiara, a, fondo - 4, Math.round(w * S), 1);
  rett(ctx, C.ferro, a, fondo - 1, Math.round(w * S), 2);
}

function rigaDiMezzeria(ctx, y) {
  for (let x = 4; x < 320; x += 26) {
    rett(ctx, "#c8c4a0", x, py(y), 14, 2);
    rett(ctx, "#8a876a", x, py(y) + 2, 14, 1);
  }
}

function pozzanghera(ctx, x, y, rx, ry) {
  const cx = px(x), cy = py(y);
  ellisse(ctx, "#26324a", cx, cy, rx, ry);
  ellisse(ctx, "#33405e", cx - 2, cy - 1, rx - 3, Math.max(1, ry - 2));
  // Il riflesso del lampione si increspa.
  const q = passo(caso(cx), 6) % 3;
  rett(ctx, C.fiammaChiara, cx + 2 + (q === 1 ? 1 : 0), cy - 1, q === 2 ? 2 : 3, 1);
  if (q === 2) rett(ctx, C.fiamma, cx + 5, cy - 1, 1, 1);
  rett(ctx, "#7fa8cc", cx - rx + 3 + (q === 1 ? 1 : 0), cy, 4, 1);
}

function tombino(ctx, x, y) {
  const cx = px(x), cy = py(y);
  ellisse(ctx, NERO, cx, cy, 8, 4);
  ellisse(ctx, C.ferro, cx, cy, 7, 3);
  for (let xx = cx - 5; xx <= cx + 5; xx += 2) rett(ctx, NERO, xx, cy - 2, 1, 5);
  retino(ctx, "#6f7292", cx - 10, cy - 40, 20, 38, (xx, yy) => 0.7 * (1 - Math.abs(xx - (cx + Math.sin(yy / 5) * 3)) / (2 + (cy - yy) * 0.12)) * (1 - (cy - yy) / 40));
}

/** Il carro funebre parcheggiato sulla strada, visto dall'alto: nero, con le tendine viola. */
function carroFunebre(ctx, x, y) {
  const a = px(x), base = py(y);
  ombraTerra(ctx, a + 46, base + 3, 46, 5);
  for (const rx of [a + 12, a + 74]) {
    rett(ctx, NERO, rx - 5, base - 3, 11, 5);
    rett(ctx, C.ferro, rx - 3, base - 2, 7, 3);
  }
  scatola(ctx, a, base - 2, 92, 22, 14, "#2a2638", NERO, "#45405e");
  rett(ctx, "#1d1a2a", a + 4, base - 36, 60, 18);
  for (let xx = a + 8; xx < a + 60; xx += 13) {
    rett(ctx, C.violaScuro, xx, base - 34, 10, 14);
    rett(ctx, C.viola, xx, base - 34, 10, 2);
  }
  rett(ctx, "#26324a", a + 68, base - 34, 18, 14);
  rett(ctx, "#4a5a7a", a + 70, base - 33, 6, 2);
  rett(ctx, C.fiammaChiara, a + 88, base - 12, 3, 4);
  rett(ctx, C.tappetoChiaro, a + 1, base - 12, 2, 4);
  rett(ctx, C.oro, a + 30, base - 9, 30, 1);
}

/** L'inferriata in cima al muro di cinta, con le punte. */
function inferriata(ctx, x0, x1, y, st = STILI.muretto) {
  const a = px(x0), b = px(x1), cima = py(y) - st.alto - st.spess;
  for (let x = a + 2; x < b; x += 6) {
    rett(ctx, NERO, x, cima - 16, 2, 16);
    rett(ctx, C.ferroChiaro, x, cima - 16, 1, 1);
    rett(ctx, NERO, x - 1, cima - 18, 4, 2);
  }
  rett(ctx, NERO, a, cima - 12, b - a, 2);
  rett(ctx, NERO, a, cima - 4, b - a, 2);
}

function pozzo(ctx, x, y) {
  const cx = px(x), base = py(y);
  ombraTerra(ctx, cx + 4, base + 2, 20, 4);
  ellisse(ctx, C.bordo, cx, base - 10, 17, 8);
  ellisse(ctx, C.pietra, cx, base - 10, 16, 7);
  ellisse(ctx, BUIO, cx, base - 11, 11, 4);
  rett(ctx, C.bordo, cx - 17, base - 10, 35, 10);
  for (let x = cx - 16, i = 0; x < cx + 16; x += 8, i++) {
    rett(ctx, i % 2 ? C.pietra : C.ferroChiaro, x, base - 10, 7, 9);
    rett(ctx, C.pietraChiara, x, base - 10, 7, 1);
  }
  for (const xx of [cx - 15, cx + 13]) rett(ctx, C.legnoScuro, xx, base - 40, 3, 30);
  rett(ctx, C.legno, cx - 16, base - 42, 33, 4);
  rett(ctx, C.legnoChiaro, cx - 16, base - 42, 33, 1);
  linea(ctx, C.pietraChiara, cx, base - 38, cx, base - 18);
  rett(ctx, C.legno, cx - 3, base - 20, 7, 5);
}

/** Lo spaventapasseri con la testa di zucca: la testa e il cappello dondolano col vento, il corvo si guarda attorno. */
function spaventapasseri(ctx, x, y) {
  const cx = px(x), base = py(y), k = passo(sfasoDi(x, y));
  const vento = [0, 0, 1, 1, 1, 0, 0, -1][Math.floor(k / 3)];
  ombraTerra(ctx, cx + 3, base + 1, 9, 2);
  rett(ctx, C.legnoScuro, cx - 1, base - 30, 3, 30);
  rett(ctx, C.legnoScuro, cx - 14, base - 26, 29, 3);
  for (let yy = 0; yy < 14; yy++) {
    const m = 4 + Math.floor(yy / 3);
    // Il fondo della giacca sventola un po'.
    rett(ctx, "#5a3a26", cx - m + (yy > 9 ? vento : 0), base - 28 + yy, m * 2 + 1, 1);
  }
  // Le mani di paglia si piegano col vento.
  rett(ctx, "#8a6a30", cx - 14, base - 26 + (vento < 0 ? 1 : 0), 4, 5);
  rett(ctx, "#8a6a30", cx + 11, base - 26 + (vento > 0 ? 1 : 0), 4, 5);
  const h = cx + vento;
  ovale(ctx, h, base - 34, 6, 6, ["#8a3a08", "#d9661a", "#f28c28", "#ffb050"]);
  rett(ctx, NERO, h - 3, base - 36, 2, 2);
  rett(ctx, NERO, h + 2, base - 36, 2, 2);
  rett(ctx, NERO, h - 2, base - 32, 5, 1);
  rett(ctx, NERO, h - 8 + vento, base - 42, 17, 2);
  rett(ctx, NERO, h - 5 + vento, base - 48, 11, 6);
  // Il corvo sul braccio: guarda a destra, poi a sinistra, poi becca il braccio.
  const corvo = passo(sfasoDi(x + 1, y), 8);
  rett(ctx, NERO, cx + 9, base - 32, 5, 4);
  if (corvo === 3 || corvo === 4) {
    rett(ctx, NERO, cx + 9, base - 34, 3, 2);
    rett(ctx, C.oro, cx + 7, base - 33, 2, 1);
  } else if (corvo === 6) {
    rett(ctx, NERO, cx + 12, base - 33, 3, 2);
    rett(ctx, C.oro, cx + 14, base - 31, 2, 1);
  } else {
    rett(ctx, NERO, cx + 12, base - 34, 3, 2);
    rett(ctx, C.oro, cx + 14, base - 33, 2, 1);
  }
}

// ── L'Ingresso e l'Anti-sala ──

// Le pietre delle sei chiavi di diamante, nello stesso ordine di CHIAVI_PER_STANZA in sprite/oggetti.js.
const PIETRE_SERRATURE = ["#8a5ad0", "#f59a2e", "#2fa35a", "#d03a2c", "#2a6cff", "#37d6c2"];
/**
 * Il portone della salita nell'Ingresso (quadretti): dove sta, la porta del Deposito sul muro di destra e il punto
 * davanti al portone dove la zucca inserisce le chiavi. La geometria per il gioco la calcola geometriaSerrature().
 */
const SERRATURE = { stanza: "ingresso", x: 8, portaDeposito: 3.8, davanti: [8, 3.6] };

/** Le sei serrature in pixel della sala, nello stesso cerchio che disegna portoneSerrature. */
function geometriaSerrature() {
  const st = STILI.atrio, base = Math.round(CIMA_CORRIDOIO * S), cima = base - st.alto + 1;
  const cx = Math.round(SERRATURE.x * S), cy = cima + 16, r = 10, mezzo = 26;
  const posti = Array.from({ length: 6 }, (_, i) => {
    const ang = -Math.PI / 2 + (i * Math.PI) / 3;
    return [Math.round(cx + Math.cos(ang) * r), Math.round(cy + Math.sin(ang) * r)];
  });
  return {
    stanza: SERRATURE.stanza,
    posti,
    colori: PIETRE_SERRATURE,
    portone: [cx - mezzo, cima + 2, mezzo * 2, base - cima - 2],
    davanti: SERRATURE.davanti.map((v) => Math.round(v * S)),
    // Il riquadro che la telecamera ingrandisce mentre si inseriscono le chiavi.
    zoom: [cx - 40, cy - 25, 80, 50],
  };
}

/** Il portone in cima alla scala, nel muro di fondo: sei serrature in cerchio, una per chiave, e un teschio al centro. */
function portoneSerrature(ctx, x, st, linea) {
  const base = py(linea), cx = px(x), mezzo = 26, cima = base - st.alto + 1;
  bagliore(ctx, "#2a1c50", cx, cima + 15, 34, 0.8);
  for (let y = cima - 3; y < base; y++) {
    const dentro = y - cima + 3;
    const smusso = dentro < 6 ? 6 - dentro : 0;
    rett(ctx, C.bordo, cx - mezzo - 5 + smusso, y, (mezzo + 5 - smusso) * 2 + 1, 1);
    rett(ctx, C.pietra, cx - mezzo - 4 + smusso, y, (mezzo + 4 - smusso) * 2 - 1, 1);
    rett(ctx, C.pietraChiara, cx - mezzo - 4 + smusso, y, 2, 1);
  }
  rett(ctx, C.legnoScuro, cx - mezzo, cima + 2, mezzo * 2, base - cima - 2);
  for (let xx = cx - mezzo + 3; xx < cx + mezzo; xx += 5) rett(ctx, C.legno, xx, cima + 2, 3, base - cima - 2);
  for (const yy of [cima + 5, base - 6]) {
    rett(ctx, C.ferro, cx - mezzo, yy, mezzo * 2, 2);
    for (let xx = cx - mezzo + 2; xx < cx + mezzo; xx += 6) rett(ctx, C.ferroChiaro, xx, yy, 1, 1);
  }
  rett(ctx, NERO, cx, cima + 2, 1, base - cima - 2);
  // Le sei serrature in cerchio, ognuna con la pietra della sua chiave.
  const cy = cima + 16, r = 10;
  for (let i = 0; i < 6; i++) {
    const ang = -Math.PI / 2 + (i * Math.PI) / 3;
    const sx = Math.round(cx + Math.cos(ang) * r), sy = Math.round(cy + Math.sin(ang) * r);
    rett(ctx, C.bordo, sx - 3, sy - 3, 7, 7);
    rett(ctx, PIETRE_SERRATURE[i], sx - 2, sy - 2, 5, 5);
    rett(ctx, C.oro, sx - 1, sy - 1, 3, 3);
    rett(ctx, NERO, sx, sy - 1, 1, 2);
    rett(ctx, NERO, sx - 1, sy + 1, 3, 1);
  }
  rett(ctx, C.bordo, cx - 4, cy - 4, 9, 9);
  rett(ctx, C.pietraChiara, cx - 3, cy - 3, 7, 6);
  rett(ctx, C.pietraChiara, cx - 2, cy + 3, 5, 1);
  rett(ctx, NERO, cx - 2, cy - 1, 2, 2);
  rett(ctx, NERO, cx + 1, cy - 1, 2, 2);
  rett(ctx, NERO, cx, cy + 2, 1, 1);
}

// ── Il portone da vicino ──
// Toccando il portone della salita il gioco passa a una schermata col portone solo, 320×200 come le sale: arco di
// pietra, due ante, le sei serrature grandi in cerchio col colore della pietra della loro chiave e il teschio al centro.
// Qui si inseriscono le chiavi, una alla volta. In pixel della schermata, non in quadretti.

const PORTONE = { larghezza: 320, altezza: 200, arco: [160, 100, 80], ante: [80, 20, 160, 158], cerchio: [160, 112, 46], piastra: [18, 24] };

/** Le sei serrature del portone da vicino: il centro di ognuna (dove entra la chiave), nell'ordine delle pietre. */
const postiPortone = () => Array.from({ length: 6 }, (_, i) => {
  const [cx, cy, r] = PORTONE.cerchio, ang = -Math.PI / 2 + (i * Math.PI) / 3;
  return [Math.round(cx + Math.cos(ang) * r), Math.round(cy + Math.sin(ang) * r)];
});

/** Un colore più scuro (k < 1) o più chiaro (k > 1). */
function tono(hex, k) {
  const n = parseInt(hex.slice(1), 16), c = (v) => Math.max(0, Math.min(255, Math.round(k > 1 ? v + (255 - v) * (k - 1) : v * k)));
  return "#" + [n >> 16, (n >> 8) & 255, n & 255].map((v) => c(v).toString(16).padStart(2, "0")).join("");
}

// Il teschio di pietra al centro del portone; negli occhi, quando ci sono tutte le chiavi, si accende la luce.
const TESCHIO_PORTONE = [
  "....kkkkkkkkk....",
  "..kkwwwwwwwwwkk..",
  ".kwwwwwwwwwwwwWk.",
  "kwwwwwwwwwwwwwWWk",
  "kwwnnnwwwwwnnnwWk",
  "kwnnnnnwwwnnnnnWk",
  "kwnnnnnwwwnnnnnWk",
  "kwwnnnwwnwwnnnwWk",
  ".kwwwwwnnnwwwwWk.",
  "..kwwwwwwwwwwWk..",
  "...kwkwkwkwkwk...",
  "...kwkwkwkwkwk...",
  "....kkkkkkkkk....",
];

/** Una serratura grande: piastra d'oro, la pietra della chiave, il buco a toppa e quattro chiodi. */
function serraturaGrande(ctx, x, y, pietra) {
  const [w, h] = PORTONE.piastra, a = x - w / 2, b = y - h / 2;
  // La borchia con la pietra, sul cerchio di ferro sopra la piastra.
  rett(ctx, C.bordo, x - 3, b - 5, 7, 6);
  rett(ctx, pietra, x - 2, b - 4, 5, 4);
  rett(ctx, tono(pietra, 1.6), x - 2, b - 4, 2, 1);
  rett(ctx, C.bordo, a, b, w, h);
  rett(ctx, C.oroScuro, a + 1, b + 1, w - 2, h - 2);
  rett(ctx, C.oro, a + 1, b + 1, w - 2, 1);
  rett(ctx, C.oro, a + 1, b + 1, 1, h - 2);
  rett(ctx, tono(pietra, 0.55), a + 3, b + 3, w - 6, h - 6);
  rett(ctx, pietra, a + 3, b + 3, w - 7, h - 7);
  rett(ctx, tono(pietra, 1.45), a + 3, b + 3, w - 7, 1);
  rett(ctx, tono(pietra, 1.45), a + 3, b + 3, 1, h - 7);
  for (const [dx, dy] of [[2, 2], [w - 3, 2], [2, h - 3], [w - 3, h - 3]]) rett(ctx, C.ferroChiaro, a + dx, b + dy, 1, 1);
  // La toppa: un tondo e la fessura che si allarga in basso.
  rett(ctx, NERO, x - 2, y - 5, 4, 4);
  rett(ctx, NERO, x - 1, y - 6, 2, 6);
  rett(ctx, NERO, x - 1, y - 1, 2, 4);
  rett(ctx, NERO, x - 2, y + 2, 4, 3);
}

/** Una torcia grande sul muro, per il portone da vicino. */
function torciaGrande(ctx, cx, cy) {
  bagliore(ctx, C.muroAcceso, cx, cy - 6, 44, 1);
  bagliore(ctx, "#5a3a3a", cx, cy - 6, 20, 1);
  rett(ctx, C.bordo, cx - 2, cy, 5, 16);
  rett(ctx, C.ferro, cx - 1, cy, 3, 16);
  rett(ctx, C.ferroChiaro, cx - 1, cy, 1, 16);
  rett(ctx, C.bordo, cx - 6, cy - 4, 13, 5);
  rett(ctx, C.ferroChiaro, cx - 5, cy - 3, 11, 3);
  rett(ctx, C.brace, cx - 4, cy - 6, 9, 3);
  const f = fiammella(cx, cy);
  const forme = [
    [[-3, -14, 7, 9], [-2, -18, 5, 4], [-1, -21, 3, 3]],
    [[-4, -13, 8, 8], [-2, -17, 5, 4], [0, -20, 2, 3]],
    [[-3, -15, 7, 10], [-1, -20, 4, 5], [-1, -24, 2, 4]],
  ][f];
  for (const [dx, dy, w, h] of forme) rett(ctx, C.fiamma, cx + dx, cy + dy, w, h);
  rett(ctx, C.fiammaChiara, cx - 1, cy - 13 - f, 3, 7);
  rett(ctx, C.luna, cx, cy - 11 - f, 1, 3);
}

/** Il portone da vicino, nell'istante del giro scelto da ANIMA (le torce tremano). */
function portoneDaVicino(ctx) {
  const { larghezza: L, altezza: A } = PORTONE, [ax, ay, ar] = PORTONE.arco;
  const rng = casuale(77);
  // Il muro dell'Ingresso: mattoni grandi.
  rett(ctx, "#3a2546", 0, 0, L, A);
  for (let y = 0, r = 0; y < A; y += 10, r++) {
    for (let x = -(r % 2) * 12; x < L; x += 24) {
      const k = rng();
      rett(ctx, k > 0.82 ? "#4a2f58" : k < 0.1 ? C.muroAcceso : "#3a2546", x + 1, y + 1, 22, 8);
      rett(ctx, "#4a2f58", x + 1, y + 1, 21, 1);
      rett(ctx, "#24162e", x, y, 1, 10);
    }
    rett(ctx, "#24162e", 0, y, L, 1);
  }
  torciaGrande(ctx, 34, 84);
  torciaGrande(ctx, 286, 84);
  // L'arco di pietra e i due pilastri, a conci chiari e scuri.
  const dentro = (x, y) => (y >= ay ? x >= ax - ar && x < ax + ar : Math.hypot(x - ax, y - ay) < ar);
  for (let y = 0; y < 180; y++)
    for (let x = 60; x < 260; x++) {
      const d = Math.hypot(x - ax, y - ay);
      const pilastro = y >= ay && ((x >= ax - ar - 14 && x < ax - ar) || (x >= ax + ar && x < ax + ar + 14));
      const anello = y < ay && d >= ar && d < ar + 14;
      if (!pilastro && !anello) continue;
      const blocco = anello ? Math.floor(((Math.atan2(y - ay, x - ax) + Math.PI) / Math.PI) * 13) : Math.floor((y - ay) / 13) + (x < ax ? 0 : 50);
      const giunto = anello ? Math.abs(((Math.atan2(y - ay, x - ax) + Math.PI) / Math.PI) * 13 - Math.round(((Math.atan2(y - ay, x - ax) + Math.PI) / Math.PI) * 13)) < 0.06
        : (y - ay) % 13 === 0;
      let c = blocco % 2 ? C.pietra : "#7a7898";
      if (anello && d >= ar + 12) c = C.pietraChiara;
      if (giunto || (anello && (d < ar + 1 || d >= ar + 13))) c = "#4f4d6a";
      rett(ctx, c, x, y, 1, 1);
    }
  // La chiave di volta, più grande, con una pietra.
  rett(ctx, C.bordo, ax - 9, ay - ar - 16, 19, 20);
  rett(ctx, C.pietraChiara, ax - 8, ay - ar - 15, 17, 18);
  rett(ctx, C.pietra, ax - 8, ay - ar + 1, 17, 2);
  rett(ctx, C.bordo, ax - 3, ay - ar - 10, 7, 7);
  rett(ctx, C.acqua, ax - 2, ay - ar - 9, 5, 5);
  rett(ctx, "#b8fff0", ax - 2, ay - ar - 9, 2, 1);
  // Le due ante: assi verticali, scure al centro dove si incontrano.
  for (let y = 0; y < 180; y++)
    for (let x = ax - ar; x < ax + ar; x++) {
      if (!dentro(x, y)) continue;
      const asse = Math.floor((x - (ax - ar)) / 10), dx = (x - (ax - ar)) % 10;
      let c = asse % 2 ? C.legno : "#3e2619";
      if (dx === 0) c = C.legnoScuro;
      else if (dx === 1) c = asse % 2 ? C.legnoChiaro : C.legno;
      if (rng() > 0.985) c = C.legnoScuro;
      rett(ctx, c, x, y, 1, 1);
    }
  rett(ctx, NERO, ax - 1, ay - ar, 2, 180 - ay + ar);
  // Le fasce di ferro con i chiodi.
  for (const yy of [50, 166]) {
    for (let x = ax - ar; x < ax + ar; x++) {
      if (!dentro(x, yy)) continue;
      rett(ctx, C.bordo, x, yy - 1, 1, 6);
      rett(ctx, C.ferro, x, yy, 1, 4);
      rett(ctx, C.ferroChiaro, x, yy, 1, 1);
      if ((x - ax) % 8 === 4) rett(ctx, C.pietraChiara, x, yy + 2, 1, 1);
    }
  }
  // Le cerniere a ricciolo sui bordi.
  for (const [x, v] of [[ax - ar, 1], [ax + ar - 1, -1]])
    for (const yy of [70, 140]) {
      rett(ctx, C.bordo, Math.min(x, x + v * 22), yy - 1, 23, 5);
      rett(ctx, C.ferro, Math.min(x, x + v * 21), yy, 22, 3);
      rett(ctx, C.ferro, x + v * 20 - (v < 0 ? 3 : 0), yy - 3, 4, 9);
      rett(ctx, C.ferroChiaro, x + v * 21, yy - 2, 1, 1);
    }
  // Il cerchio di ferro che lega le serrature, poi le serrature e il teschio.
  const [cx, cy, r] = PORTONE.cerchio;
  for (let a = 0; a < 720; a++) {
    const t = (a / 720) * Math.PI * 2, x = Math.round(cx + Math.cos(t) * r), y = Math.round(cy + Math.sin(t) * r);
    rett(ctx, C.bordo, x - 1, y - 1, 3, 3);
  }
  for (let a = 0; a < 720; a++) {
    const t = (a / 720) * Math.PI * 2;
    rett(ctx, t > Math.PI ? C.ferroChiaro : C.ferro, Math.round(cx + Math.cos(t) * r), Math.round(cy + Math.sin(t) * r), 1, 1);
  }
  postiPortone().forEach(([x, y], i) => serraturaGrande(ctx, x, y, PIETRE_SERRATURE[i]));
  sprite(ctx, TESCHIO_PORTONE, { k: C.bordo, w: "#d8d4e8", W: "#a9a4bc", n: NERO }, cx, cy + 7);
  // I gradini della salita, davanti al portone.
  for (const [y0, h, pedata, alzata] of [[178, 9, "#8f8da9", "#4f4d6a"], [187, 13, "#6f6d8c", "#3b3a55"]]) {
    rett(ctx, C.bordo, 40, y0 - 1, 240, 1);
    rett(ctx, pedata, 40, y0, 240, h - 4);
    rett(ctx, tono(pedata, 1.3), 40, y0, 240, 1);
    rett(ctx, alzata, 40, y0 + h - 4, 240, 4);
  }
  rett(ctx, "#25213a", 0, 178, 40, 22);
  rett(ctx, "#25213a", 280, 178, 40, 22);
  // Le ragnatele negli angoli dell'arco.
  for (const [x, v] of [[62, 1], [257, -1]]) {
    for (const [dx, dy] of [[16, 0], [12, 8], [6, 14], [0, 16]]) linea(ctx, "#8f8da9", x, 2, x + v * dx, 2 + dy);
    for (const d of [6, 11]) linea(ctx, "#6f6d8c", x + v * d, 2, x, 2 + d);
  }
}

/** Il portone da vicino come immagine a sé: `fase` è l'istante del giro. */
export function disegnaPortone(ctx, { fase = 0 } = {}) {
  Object.assign(ANIMA, { fase, sala: "portone" });
  try {
    conOrigine(0, 0, () => portoneDaVicino(ctx));
  } finally {
    Object.assign(ANIMA, { fase: 0, sala: null });
  }
}

/** Dove stanno le cose nel portone da vicino, per il gioco: serrature, ante (che si aprono), occhi del teschio. */
export function geometriaPortone() {
  const [cx, cy] = PORTONE.cerchio;
  return {
    versione: 1,
    larghezza: PORTONE.larghezza,
    altezza: PORTONE.altezza,
    posti: postiPortone(),
    colori: PIETRE_SERRATURE,
    piastra: PORTONE.piastra,
    arco: PORTONE.arco,
    ante: PORTONE.ante,
    occhi: [[cx - 4, cy + 7 - 13 + 5], [cx + 4, cy + 7 - 13 + 5]],
  };
}

/** La porta doppia della Sala principale, aperta: dentro le luci della festa, e la luce che esce sul pavimento. */
function portaDoppia(ctx, x, st, linea) {
  const a = px(x - 1), b = px(x + 1), base = py(linea), cima = base - st.alto;
  rett(ctx, "#1c0f2a", a, cima, b - a, st.alto);
  retino(ctx, "#5a2a6a", a, cima, b - a, st.alto, (xx, yy) => ((yy - cima) / st.alto) * 0.9);
  const rng = casuale(5);
  for (let i = 0; i < 14; i++) rett(ctx, [C.rosa, C.acqua, C.giallo, C.lilla][i % 4], a + 2 + Math.floor(rng() * (b - a - 4)), cima + 2 + Math.floor(rng() * (st.alto - 6)), 1, 1);
  rett(ctx, C.legnoScuro, a - 5, cima, 5, st.alto);
  rett(ctx, C.legnoScuro, b, cima, 5, st.alto);
  rett(ctx, C.legno, a - 4, cima + 3, 3, st.alto - 6);
  rett(ctx, C.legno, b + 1, cima + 3, 3, st.alto - 6);
  rett(ctx, st.cima, a - 7, cima - st.spess, b - a + 14, st.spess);
  rett(ctx, C.oro, a - 7, cima - st.spess, b - a + 14, 1);
  retino(ctx, "#4a2a5a", a - 14, base, b - a + 28, 46, (xx, yy) => 0.9 * (1 - (yy - base) / 46) * (1 - Math.abs(xx - (a + b) / 2) / ((b - a) / 2 + 6 + (yy - base) * 0.35)));
}

/** La porta grande della Sala principale in un muro laterale: aperta, con le luci della festa e la luce sul pavimento. */
function portaLatoFesta(ctx, y, verso) {
  const st = STILI.casa, c = px(verso < 0 ? SL : SR);
  const su = py(y - 1.5), giu = py(y + 1.5) - st.alto - st.spess;
  const da = verso < 0 ? 0 : c - 5, fino = verso < 0 ? c + 5 : px(SCHERMO[0]);
  const dentro = verso < 0 ? c + 5 : c - 5;
  const cy = (su + giu) / 2 + 8;
  // La luce della festa che esce sul pavimento, con le macchie colorate delle luci della pista.
  for (const [colore, lungo, forza] of [["#4a2a5a", 110, 1], ["#7a3a7a", 60, 0.9]]) {
    retino(ctx, colore, verso < 0 ? dentro : dentro - lungo, cy - 34, lungo, 68, (xx, yy) =>
      forza * (1 - Math.abs(xx - dentro) / lungo) * (1 - Math.abs(yy - cy) / (22 + Math.abs(xx - dentro) * 0.4)));
  }
  const rng = casuale(9);
  for (let i = 0; i < 6; i++) {
    const lx = dentro - verso * (14 + Math.floor(rng() * 50)), ly = cy - 14 + Math.floor(rng() * 28);
    retino(ctx, ["#7a2058", "#14646a", "#7a6414", "#45237a"][i % 4], lx - 6, ly - 3, 13, 7, (xx, yy) => 1.4 * (1 - Math.hypot((xx - lx) / 6, (yy - ly) / 3)));
  }
  rett(ctx, "#1c0f2a", da, su - 6, fino - da, giu - su + 12);
  for (let i = 0; i < 12; i++) rett(ctx, [C.rosa, C.acqua, C.giallo, C.lilla][i % 4], da + Math.floor(rng() * (fino - da)), su - 4 + Math.floor(rng() * (giu - su + 8)), 1, 1);
  rett(ctx, C.oroScuro, c - 7, su - 9, 14, 3);
  rett(ctx, C.oro, c - 7, su - 9, 14, 1);
  rett(ctx, C.pietra, c - 7, giu + 6, 14, 2);
}

/** Un bancone che corre dall'alto in basso, visto da sopra: il piano di legno e la testata davanti. */
function banconeVerticale(ctx, x, y0, y1) {
  const c = px(x), larga = 14, alto = 13;
  const cima = py(y0) - alto, fondo = py(y1) - alto;
  ombraTerra(ctx, c + 4, py(y1) + 1, 10, 3);
  rett(ctx, C.bordo, c - larga / 2 - 1, cima - 1, larga + 2, fondo - cima + alto + 2);
  rett(ctx, C.legnoChiaro, c - larga / 2, cima, larga, fondo - cima);
  rett(ctx, C.legnoLuce, c - larga / 2, cima, 1, fondo - cima);
  rett(ctx, C.oro, c - larga / 2, cima, larga, 1);
  rett(ctx, C.legno, c - larga / 2, fondo, larga, alto);
  rett(ctx, C.legnoScuro, c - larga / 2 + 2, fondo + 3, larga - 4, alto - 5);
  rett(ctx, C.oroScuro, c - larga / 2, fondo, larga, 1);
}

/** Lo scaffale delle bottiglie contro il muro di destra, visto dall'alto: file di tappi colorati sui ripiani. */
function scaffaleBottiglie(ctx, x, y0, y1) {
  const c = px(x), cima = py(y0) - 22, fondo = py(y1) - 22;
  const rng = casuale(Math.round(x * 13 + y0));
  const colori = ["#c8242c", "#2d5a2e", "#f0b84a", "#7b55c4", "#2a8cff", "#37d6c2", "#8a3a1e"];
  rett(ctx, C.bordo, c - 9, cima - 1, 19, fondo - cima + 24);
  rett(ctx, C.legnoScuro, c - 8, cima, 17, fondo - cima);
  for (let y = cima + 2; y < fondo - 2; y += 5) {
    rett(ctx, C.legno, c - 8, y + 3, 17, 1);
    for (let xx = c - 7; xx < c + 8; xx += 3) {
      if (rng() < 0.15) continue;
      const col = colori[Math.floor(rng() * colori.length)];
      rett(ctx, col, xx, y, 2, 2);
      rett(ctx, C.pietraChiara, xx, y, 1, 1);
    }
  }
  // La testata dello scaffale, in fondo, con le bottiglie viste di fronte.
  rett(ctx, C.legno, c - 8, fondo, 17, 22);
  for (let r = 0; r < 2; r++) {
    for (let xx = c - 7; xx < c + 8; xx += 3) {
      const col = colori[Math.floor(rng() * colori.length)];
      rett(ctx, col, xx, fondo + 3 + r * 9, 2, 6);
      rett(ctx, col, xx, fondo + 1 + r * 9, 1, 2);
    }
    rett(ctx, C.legnoChiaro, c - 8, fondo + 9 + r * 9, 17, 1);
  }
}

/** I bicchieri in fila sul piano di un bancone verticale. */
function bicchieriVerticali(ctx, x, y0, y1) {
  const rng = casuale(Math.round(x * 7));
  for (let y = py(y0) - 10; y < py(y1) - 14; y += 9 + Math.floor(rng() * 6)) {
    const c = [C.acqua, C.tappetoChiaro, C.giallo, "#2a8cff"][Math.floor(rng() * 4)];
    rett(ctx, C.pietraChiara, px(x) - 2, y, 3, 4);
    rett(ctx, c, px(x) - 2, y + 2, 3, 2);
    rett(ctx, C.bianco, px(x) - 2, y, 1, 1);
  }
}

function campanello(ctx, x, y) {
  const cx = px(x), cy = py(y) - 15;
  rett(ctx, C.bordo, cx - 3, cy - 3, 7, 4);
  rett(ctx, C.oro, cx - 2, cy - 3, 5, 3);
  rett(ctx, C.giallo, cx - 1, cy - 3, 1, 1);
  rett(ctx, C.oroScuro, cx - 3, cy, 7, 1);
  rett(ctx, C.oro, cx, cy - 5, 1, 2);
}

/** I biglietti numerati del guardaroba, sul bancone. */
function biglietti(ctx, x, y) {
  const cx = px(x), cy = py(y) - 16;
  for (let i = 0; i < 3; i++) {
    rett(ctx, C.bordo, cx - 3 + i, cy + i * 3, 6, 4);
    rett(ctx, "#e8e4f0", cx - 2 + i, cy + i * 3, 4, 3);
    rett(ctx, C.tappetoChiaro, cx - 1 + i, cy + 1 + i * 3, 2, 1);
  }
}

/** L'appendiabiti del guardaroba con i cappotti degli ospiti. */
function appendiabitiPieno(ctx, x, y) {
  const cx = px(x), base = py(y);
  ombraTerra(ctx, cx + 3, base + 1, 10, 3);
  rett(ctx, C.legnoScuro, cx - 1, base - 40, 3, 40);
  rett(ctx, C.legnoScuro, cx - 6, base - 2, 13, 2);
  rett(ctx, C.legnoChiaro, cx - 6, base - 40, 13, 2);
  const cappotti = [[C.violaScuro, -5], ["#5a2a12", 1], [NERO, 4], ["#14646a", -2]];
  cappotti.forEach(([c, dx], i) => {
    for (let yy = 0; yy < 18; yy++) {
      const m = 2 + Math.floor(yy / 4);
      rett(ctx, c, cx + dx - m, base - 38 + yy + (i % 2) * 2, m * 2 + 1, 1);
    }
  });
}

/** Un cordone di velluto fra due paletti d'oro. */
function cordone(ctx, x0, x1, y) {
  const a = px(x0), b = px(x1), base = py(y);
  for (let xx = a; xx <= b; xx++) {
    const yy = base - 12 + Math.round(Math.sin(((xx - a) / (b - a)) * Math.PI) * 5);
    rett(ctx, C.tappeto, xx, yy, 1, 2);
    rett(ctx, C.tappetoChiaro, xx, yy, 1, 1);
  }
  for (const x of [a, b]) {
    ombraTerra(ctx, x + 2, base, 4, 1);
    rett(ctx, C.oroScuro, x - 1, base - 14, 3, 14);
    rett(ctx, C.oro, x - 1, base - 14, 1, 14);
    rett(ctx, C.oro, x - 2, base - 16, 5, 3);
    rett(ctx, C.oroScuro, x - 3, base - 1, 7, 2);
  }
}

/** Il buttafuori: uno scheletro in completo nero, con gli occhiali scuri. */
function buttafuori(ctx, x, y) {
  const cx = px(x), base = py(y);
  ombraTerra(ctx, cx + 2, base, 8, 2);
  rett(ctx, NERO, cx - 6, base - 19, 13, 19);
  rett(ctx, "#1c1828", cx - 1, base - 7, 3, 7);
  rett(ctx, "#e8e4f0", cx - 1, base - 19, 3, 6);
  rett(ctx, C.tappeto, cx, base - 18, 1, 4);
  rett(ctx, "#e8e4f0", cx - 5, base - 13, 11, 2);
  // La testa: guarda la fila, poi la porta, e ogni tanto il riflesso passa sugli occhiali.
  const k = passo(sfasoDi(x, y)), gira = k >= 8 && k < 16 ? -1 : k >= 18 && k < 22 ? 1 : 0;
  rett(ctx, C.bordo, cx - 4 + gira, base - 28, 9, 9);
  rett(ctx, "#e8e4f0", cx - 3 + gira, base - 27, 7, 7);
  rett(ctx, NERO, cx - 3 + gira, base - 25, 7, 2);
  const riflesso = k === 3 ? 2 : k === 4 ? 4 : 0;
  rett(ctx, C.acqua, cx - 2 + gira + riflesso, base - 25, 1, 1);
  rett(ctx, NERO, cx - 1 + gira, base - 22, 3, 1);
}

/** Una locandina della festa appesa al muro di fondo. */
function locandina(ctx, x, st, linea, seme) {
  const cx = px(x), cima = py(linea) - st.alto + 5;
  const fondo = [C.violaScuro, "#7a2058", "#14646a", "#5a2a12"][seme % 4];
  rett(ctx, C.bordo, cx - 7, cima - 1, 15, 21);
  rett(ctx, fondo, cx - 6, cima, 13, 19);
  if (seme % 2) {
    rett(ctx, C.fiamma, cx - 3, cima + 3, 7, 6);
    rett(ctx, C.giallo, cx - 2, cima + 5, 1, 1);
    rett(ctx, C.giallo, cx + 2, cima + 5, 1, 1);
  } else {
    rett(ctx, C.pietraChiara, cx - 3, cima + 3, 7, 6);
    rett(ctx, NERO, cx - 2, cima + 5, 2, 2);
    rett(ctx, NERO, cx + 1, cima + 5, 2, 2);
  }
  rett(ctx, C.giallo, cx - 4, cima + 12, 9, 1);
  rett(ctx, C.pietraChiara, cx - 4, cima + 14, 7, 1);
  rett(ctx, C.pietraChiara, cx - 4, cima + 16, 8, 1);
}

const SALE = {
  anticancello: {
    piano: "piano-terra",
    centro: [8, 3.9],
    disegna(ctx) {
      // La strada, fuori: da qui parte il gioco. In alto il muro di cinta con l'inferriata e il cancello a sinistra,
      // il marciapiede, la strada con il carro funebre parcheggiato.
      const T = CIMA_CORRIDOIO;
      prato(ctx, 0, 0, 320, py(T));
      marciapiede(ctx, 0, T, 16, 2.6);
      asfalto(ctx, 0, T + 2.6, 16, 10 - T - 2.6);
      rigaDiMezzeria(ctx, 7.6);
      pozzanghera(ctx, 11.6, 6.2, 14, 4);
      pozzanghera(ctx, 3.2, 8.8, 10, 3);
      disegnaInOrdine(ctx, tratti(0, 16, [[4, 1.6]], 1.6).map(([a, b]) => ["muretto", a, T, b, T]), [
        [0.9, () => { albero(ctx, 1, 0.9, 14, false, 51); albero(ctx, 7.6, 0.8, 15, true, 52); albero(ctx, 13.6, 0.9, 14, false, 53); }],
        [T, () => { inferriata(ctx, 0, 3.2, T); inferriata(ctx, 4.8, 16, T); }],
        [T + 0.01, () => { locandina(ctx, 9.6, STILI.muretto, T, 1); }],
        [T + 0.02, () => cancelloDiFerro(ctx, 3.2, 4.8, T)],
        [4.4, () => { lampione(ctx, 6.4, 4.4); lampione(ctx, 14.4, 4.4); }],
        [4.3, () => { zucca(ctx, 2.2, 4.3); zucca(ctx, 5.8, 4.3, false); }],
        [8.6, () => tombino(ctx, 8.6, 8.6)],
        [6.8, () => carroFunebre(ctx, 9.4, 6.8)],
      ]);
    },
  },
  cancello: {
    piano: "piano-terra",
    centro: [7, 6.4],
    disegna(ctx) {
      // Il cortile appena passato il cancello (in basso a sinistra), più grande; in alto a destra parte il vialetto
      // che porta all'Ingresso. Qui ci sono i rompicapi del Cancello.
      prato(ctx, 0, 0, 320, 200);
      pavimento(ctx, [SL, ST, SR - SL, SB - ST], "selciato", 21);
      prato(ctx, px(5.6), py(4.2), 5 * S, 2.6 * S);
      disegnaInOrdine(ctx, muriSala({ nord: [12.6], sud: [4] }, { stileNord: "muretto", stileSud: "muretto", stileLati: "muretto" }), [
        [ST, () => { inferriata(ctx, SL, 11.8, ST); inferriata(ctx, 13.4, SR, ST); }],
        [ST + 0.01, () => { lampione(ctx, 11.6, ST + 0.4); lampione(ctx, 13.6, ST + 0.4); }],
        [6.4, () => pozzo(ctx, 8.2, 6.4)],
        [4.8, () => spaventapasseri(ctx, 3.2, 4.8)],
        [3.6, () => lapide(ctx, 13.8, 3.6, 3)], [5.4, () => lapide(ctx, 14.4, 5.4, 8)], [7.4, () => lapide(ctx, 13.2, 7.4, 5)],
        [9.2, () => zucca(ctx, 1.4, 9.2)], [3.2, () => zucca(ctx, 6, 3.2)], [8.6, () => zucca(ctx, 10.6, 8.6)],
        [7.8, () => zucca(ctx, 1.8, 7.8, false)], [3.4, () => zucca(ctx, 9.6, 3.4)],
        [SB, () => cancelloDiFerro(ctx, 3.2, 4.8, SB)],
      ]);
    },
  },
  vialetto: {
    piano: "piano-terra",
    centro: [8, 6.6],
    disegna(ctx) {
      // Il vialetto dal cortile alla casa: in fondo la facciata con la porta dell'Ingresso, ai lati prato e alberi.
      prato(ctx, 0, 0, 320, 200);
      pavimento(ctx, [5.4, ST, 5.2, SB + 0.2 - ST], "selciato", 22);
      tappeto(ctx, 7.4, ST, 1.2, 1.4);
      disegnaInOrdine(ctx, [
        ...tratti(0, 16, [8], 1.6).map(([a, b]) => ["casa", a, ST, b, ST]),
        ["muretto", 5.4, ST, 5.4, 10.4], ["muretto", 10.6, ST, 10.6, 10.4],
      ], [
        [ST, () => {
          portaNord(ctx, 8);
          for (const x of [2.6, 5, 11, 13.4]) finestrella(ctx, x);
          torciaAMuro(ctx, 6.6, ST);
          torciaAMuro(ctx, 9.4, ST);
          edera(ctx, 0, 4.6, STILI.casa, 3);
          edera(ctx, 11.4, 16, STILI.casa, 4);
        }],
        [4.6, () => albero(ctx, 2, 4.6, 16, true, 31)], [8.8, () => albero(ctx, 13.8, 8.8, 16, false, 32)],
        [8.4, () => albero(ctx, 1.6, 8.4, 13, false, 33)], [4.2, () => albero(ctx, 14.2, 4.2, 13, true, 34)],
        [3.8, () => zucca(ctx, 6.4, 3.8)], [3.8, () => zucca(ctx, 9.6, 3.8)],
        [6.6, () => zucca(ctx, 6.2, 6.6, false)], [8.4, () => zucca(ctx, 9.8, 8.4)],
        [5.4, () => lampione(ctx, 4.6, 5.4)], [5.4, () => lampione(ctx, 11.4, 5.4)],
        [6.8, () => lapide(ctx, 3.6, 6.8, 4)], [6.2, () => lapide(ctx, 12.6, 6.2, 9)],
      ]);
    },
  },
  ingresso: {
    piano: "piano-terra",
    // Un po' più alta dello schermo: 11,6 quadretti. La scena la segue e la si può scorrere.
    alto: 11.6,
    centro: [7, 8.2],
    disegna(ctx) {
      // Al centro la scala, chiusa dal portone con le sei serrature; in alto a sinistra l'Anti-sala; in alto a destra,
      // dietro il bancone del guardaroba, la porta del Deposito; in basso il vialetto.
      const T = CIMA_CORRIDOIO, st = STILI.atrio, B = 11.4;
      rett(ctx, BUIO, 0, 0, 320, 232);
      pavimento(ctx, [SL, T, SR - SL, B - T], "marmo", 22);
      tappeto(ctx, 7.4, 5.6, 1.2, B - 5.6, "giu");
      tappeto(ctx, 2.4, 7.2, 11.4, 1.2);
      tappeto(ctx, 2.4, T, 1.2, 6.2);
      tappeto(ctx, 12.6, 3.2, 1.2, 5.2);
      tappeto(ctx, 12.6, 3.2, SR - 12.6, 1.2);
      disegnaInOrdine(ctx, [
        ...muriSala({ nord: [3], sud: [8], est: [SERRATURE.portaDeposito] }, { stileNord: "atrio", stileLati: "casa", cima: T, fondo: B }),
        // Il bancone del guardaroba, di traverso, con l'apertura per passare verso il Deposito.
        ["bancone", 11.2, 5.4, 12.6, 5.4], ["bancone", 13.8, 5.4, SR, 5.4],
      ], [
        [T, () => {
          portaNord(ctx, 3, st, T);
          portoneSerrature(ctx, SERRATURE.x, st, T);
          torciaAMuro(ctx, 5, T, st.alto);
          torciaAMuro(ctx, 11, T, st.alto);
          quadroAMuro(ctx, 1.3, T, st.alto - 6);
        }],
        [B, () => portaSud(ctx, 8, B)],
        [SERRATURE.portaDeposito, () => portaLato(ctx, SERRATURE.portaDeposito, 1)],
        [5.6, () => scalaSu(ctx, 6.6, 9.4, T, 5.6, false)],
        [5.9, () => { candelabro(ctx, 6.1, 5.9); candelabro(ctx, 9.9, 5.9); }],
        [4.6, () => appendiabitiPieno(ctx, 11.9, 4.6)],
        [4.7, () => scheletroBarista(ctx, 14.6, 4.7, "aspetta")],
        [5.41, () => { campanello(ctx, 14.9, 5.4); biglietti(ctx, 11.8, 5.4); }],
        [3.6, () => vasoSecco(ctx, 1.2, 3.6)],
        [10.9, () => { candelabro(ctx, 1.6, 10.9); candelabro(ctx, 14.6, 10.9); }],
        [10, () => ospite(ctx, 4.8, 10, "scheletro", 0)],
        [10.4, () => tavolino(ctx, 11.2, 10.4)],
        [10.9, () => zucca(ctx, 13.2, 10.9)],
      ]);
    },
  },
  antisala: {
    piano: "piano-terra",
    centro: [8, 7.4],
    disegna(ctx) {
      // L'anti-sala: a sinistra la porta grande della Sala principale, a destra il corridoio dei bagni e degli spogliatoi.
      const T = CIMA_CORRIDOIO, st = STILI.atrio;
      rett(ctx, BUIO, 0, 0, 320, 200);
      pavimento(ctx, [SL, T, SR - SL, SB - T], "marmo", 29);
      tappeto(ctx, 7.4, 6.4, 1.2, SB - 6.4, "giu");
      tappeto(ctx, 0, 6.4, 16, 1.2);
      disegnaInOrdine(ctx, muriSala({ sud: [8], ovest: [[7, 3]], est: [7.2] }, { stileNord: "atrio", stileLati: "casa", cima: T }), [
        [T, () => {
          for (const [x, seme] of [[2.4, 1], [4.8, 2], [11.2, 3], [13.6, 4]]) locandina(ctx, x, st, T, seme);
          torciaAMuro(ctx, 6.6, T, st.alto);
          torciaAMuro(ctx, 9.4, T, st.alto);
          quadroAMuro(ctx, 8, T, st.alto - 6);
        }],
        [SB, () => portaSud(ctx, 8)],
        [7, () => portaLatoFesta(ctx, 7, -1)],
        [7.2, () => portaLato(ctx, 7.2, 1)],
        // I cordoni di velluto che portano alla Sala principale, e il buttafuori.
        [5.9, () => cordone(ctx, 1.2, 4, 5.9)], [8.6, () => cordone(ctx, 1.2, 4, 8.6)],
        [5.6, () => buttafuori(ctx, 4.8, 5.6)],
        [9.3, () => pancaLunga(ctx, 10, 13.4, 9.3)],
        [3.6, () => vasoSecco(ctx, 14.8, 3.6)], [3.6, () => vasoSecco(ctx, 1.2, 3.6)],
        [9.2, () => zucca(ctx, 14.4, 9.2)], [9.5, () => zucca(ctx, 5.4, 9.5)],
        [4.6, () => ospite(ctx, 11.4, 4.6, "strega", 1)],
      ]);
    },
  },
  deposito: {
    piano: "piano-terra",
    centro: [8, 6.4],
    disegna(ctx) {
      rett(ctx, BUIO, 0, 0, 320, 200);
      pavimento(ctx, [SL, ST, SR - SL, SB - ST], "assi", 23);
      retino(ctx, "#5a4a44", px(SL), py(ST), (SR - SL) * S, (SB - ST) * S, (x, y) => 0.24 + 0.14 * Math.sin(x / 9 + y / 13));
      // Le impronte nella polvere, dalla porta (in alto a sinistra, dal guardaroba dell'Ingresso) verso il centro.
      for (let i = 0; i < 7; i++) rett(ctx, "#2a1a12", px(1.4 + i * 0.9), py(4.2 + i * 0.35 + (i % 2) * 0.4), 3, 2);
      disegnaInOrdine(ctx, muriSala({ ovest: [3.8] }), [
        [3.8, () => portaLato(ctx, 3.8, -1)],
        [ST, () => { mensolaAMuro(ctx, 3, 6.4); mensolaAMuro(ctx, 6.8, 9.6); mensolaAMuro(ctx, 10, 14.6); }],
        [ST + 0.05, () => { ragnatelaAngolo(ctx, SL + 0.2, ST + 0.1, 1); ragnatelaAngolo(ctx, SR - 0.2, ST + 0.1, -1); }],
        [6.4, () => telo(ctx, 3.2, 6.4, 1)], [7.8, () => telo(ctx, 5.4, 7.8, 2)], [5.6, () => telo(ctx, 7.6, 5.6, 3)],
        [9.3, () => telo(ctx, 2.4, 9.3, 4)],
        [4.4, () => armadio(ctx, 11.4, 4.4)],
        [6.4, () => cassa(ctx, 12.6, 6.4, 1.4, 14)], [8.4, () => cassa(ctx, 13.4, 8.4, 1.2)], [8.8, () => cassa(ctx, 11.6, 8.8, 1, 10)],
        [9.3, () => secchio(ctx, 4.8, 9.3)],
        [7.8, () => lanternaATerra(ctx, 9.6, 7.8)],
      ]);
    },
  },
  "sala-principale": {
    piano: "piano-terra",
    // Molto più alta che larga: 26 quadretti. La scena la segue e la si può scorrere.
    alto: 26,
    centro: [7.4, 17.2],
    disegna(ctx) {
      // In alto la consolle e la pista; sul lato destro l'area bar, che da qui si vede in piccolo (avvicinandosi
      // diventa la schermata della Sala Bar); in basso i tavolini. Si entra dalla porta a destra, dall'Anti-sala.
      const B = 25.8;
      rett(ctx, BUIO, 0, 0, 320, 520);
      pavimento(ctx, [SL, ST, SR - SL, B - ST], "assiScure", 31);
      pavimento(ctx, [1.6, 4.4, 12.8, 7.8], "pista");
      luciDellaPalla(ctx, 1.8, 4.8, 14.2, 11.8);
      pavimento(ctx, [11.2, 12.4, SR - 11.2, 3.6], "piastrelle");
      tappeto(ctx, 6.4, 21.6, SR - 6.4, 1.2);
      disegnaInOrdine(ctx, [
        ...muriSala({ est: [22.2] }, { fondo: B }),
      ], [
        [ST, () => { festoni(ctx, 0.6, 15.4, ST); torciaAMuro(ctx, 1.8, ST); torciaAMuro(ctx, 14.2, ST); }],
        [22.2, () => portaLato(ctx, 22.2, 1)],
        [3.4, () => consolleDj(ctx, 5.8, 10.2, 3.4)],
        [3.5, () => { cassaAcustica(ctx, 4.5, 3.5); cassaAcustica(ctx, 11.5, 3.5); }],
        [6.6, () => ospite(ctx, 3.4, 6.6, "scheletro", 1, "balla")], [8.4, () => ospite(ctx, 10.8, 8.4, "vampiro", 1, "balla")],
        [6.4, () => ospite(ctx, 12.6, 6.4, "strega", 0, "balla")], [10.6, () => ospite(ctx, 5, 10.6, "mummia", 1, "balla")],
        [9, () => ospite(ctx, 4.4, 9, "scheletro", 0, "balla")], [11.4, () => ospite(ctx, 8.2, 11.4, "scheletro", 1, "balla")],
        [12.3, () => pallaStroboscopica(ctx, 8, 7.2)],
        [12.35, () => { pipistrello(ctx, 3, 4); pipistrello(ctx, 13, 5.2); pipistrello(ctx, 9.6, 3.4); }],
        // L'area bar, in piccolo, contro il muro di destra: lo scaffale delle bottiglie, il barista, il bancone
        // che corre dall'alto in basso e gli sgabelli verso la sala.
        [15.2, () => scaffaleBottiglie(ctx, 15, 12.9, 15.2)],
        [14.2, () => scheletroBarista(ctx, 14, 14.2)],
        [15.4, () => { banconeVerticale(ctx, 13, 12.4, 15.4); bicchieriVerticali(ctx, 13, 12.6, 15.2); }],
        [15.45, () => [12.9, 14.1, 15.3].forEach((y) => sgabello(ctx, 12, y))],
        // I tavolini e il salotto in basso.
        [14.6, () => tavolino(ctx, 2.2, 14.6)], [18.4, () => tavolino(ctx, 2.4, 18.4)], [21.2, () => tavolino(ctx, 4.4, 21.2)],
        [24.6, () => tavolino(ctx, 2.2, 24.6)], [24.8, () => tavolino(ctx, 12.4, 24.8)], [19.4, () => tavolino(ctx, 12.6, 19.4)],
        [25.4, () => pancaLunga(ctx, 5.4, 9.8, 25.4)],
        [16.4, () => ospite(ctx, 5.6, 16.4, "strega", 1)], [19.8, () => ospite(ctx, 9.4, 19.8, "vampiro", 0, "beve")],
        [23.6, () => ospite(ctx, 9, 23.6, "mummia", 0)],
        [24.9, () => zucca(ctx, 14.8, 24.9)], [14.8, () => zucca(ctx, 1.2, 14.8, false)],
        [19, () => pipistrello(ctx, 11.4, 18)],
      ]);
    },
  },
  "sala-bar": {
    piano: "piano-terra",
    centro: [7, 6.4],
    disegna(ctx) {
      // L'angolo bar della Sala principale, da vicino: il bancone corre lungo il muro di destra, con le bottiglie sugli
      // scaffali alle spalle del barista e gli sgabelli verso la sala. A sinistra non c'è muro: si torna nella sala.
      rett(ctx, BUIO, 0, 0, 320, 200);
      pavimento(ctx, [0, ST, SR, SB - ST], "assiScure", 24);
      pavimento(ctx, [12.6, ST, SR - 12.6, SB - ST], "piastrelle");
      luciDellaPalla(ctx, 0.4, 2.8, 7.6, 9.2);
      disegnaInOrdine(ctx, [
        ["interno", 0, ST, SR, ST],
        ["casa", SR, ST, SR, SB],
        ["basso", 0, SB, SR, SB],
      ], [
        [ST, () => {
          insegnaBar(ctx, 13.6, STILI.interno);
          festoni(ctx, 0, 11.6, ST, STILI.interno.alto);
          torciaAMuro(ctx, 5.4, ST, STILI.interno.alto);
        }],
        [9.3, () => scaffaleBottiglie(ctx, 14.9, 2.4, 8.8)],
        [6.2, () => scheletroBarista(ctx, 13.6, 6.2)],
        [8.9, () => { banconeVerticale(ctx, 12.2, 2.4, 8.9); bicchieriVerticali(ctx, 12.2, 2.6, 8.7); }],
        [8.95, () => [3.6, 5.2, 6.8, 8.4].forEach((y) => sgabello(ctx, 10.9, y))],
        [3.2, () => jukebox(ctx, 1.8, 3.2)],
        [4.6, () => tavolino(ctx, 5.2, 4.6)], [8.6, () => tavolino(ctx, 3.4, 8.6)], [7.8, () => tavolino(ctx, 7.6, 7.8)],
        [6, () => ospite(ctx, 8.6, 6, "vampiro", 0, "beve")],
        [9.3, () => zucca(ctx, 1.2, 9.3)],
      ]);
    },
  },
  "corridoio-bagni": {
    piano: "piano-terra",
    centro: [8, 7.6],
    disegna(ctx) {
      // La prima parte del corridoio che porta all'Area Fumatori. Al bagno delle donne c'è la coda dei mostri, un po'
      // in disordine, che arriva quasi alla porta degli uomini; da quella esce la carta igienica e sotto brillano due
      // occhi. Tutti e due i bagni sono occupati.
      const T = CIMA_CORRIDOIO, st = STILI.corridoio;
      rett(ctx, BUIO, 0, 0, 320, 200);
      pavimento(ctx, [SL, T, SR - SL, SB - T], "scacchiera", 27);
      tappeto(ctx, 0, 6.7, 16, 1.2);
      disegnaInOrdine(ctx, muriSala({ ovest: [7.2], est: [7.2] }, { stileNord: "corridoio", stileLati: "interno", cima: T }), [
        [T, () => {
          piastrelleAMuro(ctx, SL, SR, st, T);
          const d = portaSullaParete(ctx, 4.4, st, T);
          cartelloBagno(ctx, Math.round((d.a + d.b) / 2), d.alto + 2, "donne");
          spiaOccupato(ctx, d);
          const u = portaSullaParete(ctx, 11.6, st, T);
          cartelloBagno(ctx, Math.round((u.a + u.b) / 2), u.alto + 2, "uomini");
          spiaOccupato(ctx, u);
          // Sotto la porta degli uomini, due occhi nel buio: sbattono le palpebre e guardano la coda.
          const cu = Math.round((u.a + u.b) / 2), ko = passo(0.37);
          rett(ctx, NERO, u.a + 2, u.base - 3, u.b - u.a - 4, 2);
          if (ko !== 5 && ko !== 17) {
            const guarda = ko >= 9 && ko < 15 ? -2 : 0;
            rett(ctx, C.giallo, cu - 3 + guarda, u.base - 3, 1, 1);
            rett(ctx, C.giallo, cu + 2 + guarda, u.base - 3, 1, 1);
          }
          for (const x of [1.6, 8, 14.4]) lampadaAMuro(ctx, x, st, T);
        }],
        // L'acqua che esce da sotto la porta delle donne.
        [T + 0.02, () => acquaSottoLaPorta(ctx, 3.2, 5.5, T)],
        [7.2, () => { portaLato(ctx, 7.2, -1); portaLato(ctx, 7.2, 1); }],
        [T + 0.1, () => cartaIgienica(ctx, [[11.9, T + 0.05], [12.6, 3.2], [12, 4.1], [13.2, 5.3]])],
        // La coda: la mummia bussa, gli altri aspettano come possono.
        [2.75, () => mostro(ctx, 4.45, 2.75, "mummiaBussa")],
        [3.15, () => mostro(ctx, 5.45, 3.15, "strega")],
        [2.95, () => mostro(ctx, 6.4, 2.95, "lupo", { gambe: "incrociate" })],
        [3.4, () => mostro(ctx, 7.35, 3.4, "zombie")],
        [3.05, () => mostro(ctx, 8.3, 3.05, "fantasma")],
        [3.45, () => mostro(ctx, 9.2, 3.45, "scheletro", { gambe: "batte" })],
        [3.2, () => mostro(ctx, 10.1, 3.2, "vampiro")],
        [4.15, () => mostro(ctx, 10.6, 4.15, "diavoletto")],
        [4.6, () => pavimentoBagnato(ctx, 14.2, 4.6)],
        [9.2, () => secchio(ctx, 13.8, 9.2)],
        [9.4, () => pancaLunga(ctx, 3.2, 6.8, 9.4)],
        [9.2, () => vasoSecco(ctx, 1.4, 9.2)],
      ]);
    },
  },
  "corridoio-spogliatoi": {
    piano: "piano-terra",
    centro: [8, 7.6],
    disegna(ctx) {
      // La seconda parte del corridoio: gli spogliatoi, inchiodati e chiusi con la catena, col nastro di pericolo, i
      // cartelli sul muro e la transenna in mezzo.
      const T = CIMA_CORRIDOIO, st = STILI.corridoio, muro = py(T) - st.alto;
      rett(ctx, BUIO, 0, 0, 320, 200);
      pavimento(ctx, [SL, T, SR - SL, SB - T], "assi", 28);
      tappeto(ctx, 0, 6.7, 16, 1.2);
      disegnaInOrdine(ctx, muriSala({ ovest: [7.2], est: [7.2] }, { stileNord: "corridoio", stileLati: "interno", cima: T }), [
        [T, () => {
          portaSpogliatoio(ctx, 4.4, st, T);
          portaSpogliatoio(ctx, 11.6, st, T);
          nastroPericolo(ctx, px(4.4) - 19, px(4.4) + 19, muro + 10, "KEEP OUT", 4);
          nastroPericolo(ctx, px(11.6) - 19, px(11.6) + 19, muro + 13, "CAUTION", -4);
          lampadaAMuro(ctx, 8, st, T);
          cartelloAvviso(ctx, px(6.15), muro + 4, "warning");
          cartelloAvviso(ctx, px(8), muro + 15, "vattene");
          cartelloAvviso(ctx, px(9.85), muro + 6, "danger");
          cartelloAvviso(ctx, px(1.7), muro + 9, "staff");
          cartelloAvviso(ctx, px(14.15), muro + 4, "divieto");
        }],
        [7.2, () => { portaLato(ctx, 7.2, -1); portaLato(ctx, 7.2, 1); }],
        [4.9, () => transenna(ctx, 6.6, 9.4, 4.9)],
        [5.1, () => { cono(ctx, 5.8, 5.1); cono(ctx, 10.2, 5.1); }],
        [4.4, () => specchioConLuci(ctx, 14.3, 4.4)],
        [4.6, () => manichino(ctx, 1.7, 4.6)],
        [9.4, () => baule(ctx, 10.2, 9.4)],
        [9.2, () => cassa(ctx, 2, 9.2, 1.2)], [9.4, () => cassa(ctx, 13.6, 9.4, 1)],
      ]);
    },
  },
  "area-fumatori": {
    piano: "piano-terra",
    // Più alta dello schermo, 15 quadretti, per far salire il fumo. La scena la segue e la si può scorrere.
    alto: 15,
    centro: [7.8, 8.8],
    disegna(ctx) {
      // Il cortile dei fumatori: mostri che fumano a gruppetti attorno al fungo e alla posacenere, e il loro fumo che
      // salendo prende la forma di spiriti. Il fumo si disegna per ultimo, sopra tutto.
      const B = 14.8;
      rett(ctx, BUIO, 0, 0, 320, 300);
      pavimento(ctx, [SL, ST, SR - SL, B - ST], "lastre", 25);
      retino(ctx, "#4a2c28", px(SL), py(ST), (SR - SL) * S, (B - ST) * S, (x, y) => 0.85 * (1 - Math.hypot((x - px(11.6)) / 80, (y - py(5.4)) / 60)));
      const braci = [];
      // Un fumatore: lo disegna e si segna dove sta la brace e il suo fumo preferito (un numero della raccolta FUMI).
      const fumatore = (x, y, tipo, opzioni, preferito) => [y, () => braci.push([mostro(ctx, x, y, tipo, opzioni), preferito])];
      disegnaInOrdine(ctx, muriSala({ ovest: [8.4] }, { fondo: B }), [
        [ST, () => { edera(ctx, 0.4, 15.6, STILI.casa, 9); finestrella(ctx, 3); finestrella(ctx, 13); insegnaFumatori(ctx, 8); }],
        [ST + 0.1, () => lucineAppese(ctx, [[0.8, 2], [5.6, 3.6], [10.4, 2], [15.2, 3.6]])],
        [ST + 0.2, () => { mozziconi(ctx, 1.4, 4, 14.4, 9, 7); mozziconi(ctx, 1.4, 9, 14.4, 14.4, 11); }],
        [8.4, () => portaLato(ctx, 8.4, -1)],
        [6.4, () => fungoRiscaldante(ctx, 11.6, 6.4)],
        fumatore(2.2, 3.6, "scheletro", { specchio: true, fuma: "sigaretta" }, 0),
        fumatore(10.3, 6.9, "lupo", { specchio: true, fuma: "sigaretta" }, 1),
        // Il gruppetto a sinistra: il lupo grigio al tavolino.
        [7.2, () => tavolino(ctx, 3.7, 7.2)],
        fumatore(2.3, 7, "lupo", { specchio: true, fuma: "sigaretta", colori: LUPO_GRIGIO }, 2),
        fumatore(13, 7, "vampiro", { fuma: "bocchino" }, 3),
        fumatore(4.8, 10.8, "demone", { specchio: true, fuma: "sigaro" }, 4),
        [10.9, () => mostro(ctx, 6.6, 10.9, "diavoletto", { specchio: true })],
        fumatore(9.9, 12.2, "zombie", { fuma: "sigaretta" }, 5),
        [12.5, () => braci.push([posacenere(ctx, 8.4, 12.5, false), 6])],
        fumatore(13.5, 11.4, "mummia", { fuma: "sigaretta" }, 7),
        fumatore(2.8, 13.9, "strega", { specchio: true, fuma: "sigaretta" }, 8),
        [14.4, () => panca(ctx, 14.4, 12.6, 14.4)],
        [5.2, () => cestino(ctx, 1.4, 5.2)],
        [3, () => vasoSecco(ctx, 9.6, 3)],
        [99, () => braci.forEach(([brace, preferito]) => fumo(ctx, brace, preferito))],
      ]);
    },
  },
  "sala-del-tesoro": {
    piano: "primo-piano",
    centro: [8, 6.6],
    disegna(ctx) {
      rett(ctx, BUIO, 0, 0, 320, 200);
      pavimento(ctx, [SL, ST, SR - SL, SB - ST], "lastrePietra", 26);
      tappeto(ctx, 1.4, 6.6, 6.2, 1.2);
      tappeto(ctx, 7.4, 3.9, 1.2, 3.9);
      disegnaInOrdine(ctx, muriSala({ sud: [2], est: [6.2] }, { stileNord: "pietra" }), [
        [ST, () => {
          for (const x of [3, 6, 10, 13]) stendardoAMuro(ctx, x, ST);
          torciaAMuro(ctx, 4.5, ST);
          torciaAMuro(ctx, 11.5, ST);
        }],
        [SB, () => portaSud(ctx, 2)],
        [6.2, () => portaDOroLato(ctx, 6.2)],
        [9.7, () => scalaGiu(ctx, 1.2, 2.8, 7.6, SB)],
        [3.6, () => piedistallo(ctx, 8, 3.6)],
        [3.2, () => mucchioDOro(ctx, 2.6, 3.2, 9, 41)], [3.4, () => mucchioDOro(ctx, 13.2, 3.4, 10, 42)],
        [9.2, () => mucchioDOro(ctx, 12.4, 9.2, 8, 43)], [8.2, () => mucchioDOro(ctx, 5.8, 8.2, 6, 44)],
        [5.4, () => forziere(ctx, 3.4, 5.4)], [6, () => forziere(ctx, 11.2, 6)], [9.4, () => forziere(ctx, 8.8, 9.4)],
        [9.5, () => monete(ctx, 3.6, 4.4, 14.4, 9.4)],
      ]);
    },
  },
};

export const ORDINE_SALE = [
  "anticancello", "cancello", "vialetto", "ingresso", "antisala", "deposito", "sala-principale", "sala-bar",
  "corridoio-bagni", "corridoio-spogliatoi", "area-fumatori", "sala-del-tesoro",
];
/** Il nome di ogni schermata, per quelle che nel catalogo non hanno una scheda (la strada, il vialetto, i passaggi). */
const NOMI_SALE = {
  anticancello: "La strada", cancello: "Cancello", vialetto: "Vialetto", ingresso: "Ingresso", antisala: "Anti-sala",
  deposito: "Deposito", "sala-principale": "Sala principale", "sala-bar": "Sala Bar",
  "corridoio-bagni": "Corridoio dei bagni", "corridoio-spogliatoi": "Corridoio degli spogliatoi",
  "area-fumatori": "Area Fumatori", "sala-del-tesoro": "Sala del tesoro",
};

/**
 * Le uscite fra le schermate: punto della porta in ciascuna delle due e verso della freccia.
 * Si parte dalla strada; il cancello porta nel cortile del Cancello, poi il vialetto sale all'Ingresso.
 * Dall'Ingresso: in alto a sinistra l'Anti-sala, al centro la scala chiusa, a destra il Deposito (passando dal
 * bancone del guardaroba). Dall'Anti-sala: a sinistra la Sala principale, a destra il corridoio dei bagni e degli
 * spogliatoi, in due schermate, che porta all'Area Fumatori. La Sala Bar è un angolo della Sala principale:
 * `zoom` è il riquadro (in pixel della Sala principale) che la telecamera ingrandisce per entrarci.
 */
const USCITE = [
  { tra: ["anticancello", "cancello"], punti: [[4, 2.9], [4, 9.2]], versi: ["su", "giu"] },
  { tra: ["cancello", "vialetto"], punti: [[12.6, 2.2], [8, 9.4]], versi: ["su", "giu"] },
  { tra: ["vialetto", "ingresso"], punti: [[8, 2.2], [8, 10.8]], versi: ["su", "giu"] },
  { tra: ["ingresso", "antisala"], punti: [[3, 2.9], [8, 9.2]], versi: ["su", "giu"] },
  { tra: ["ingresso", "deposito"], punti: [[15, 4.2], [1, 4.4]], versi: ["dx", "sx"] },
  { tra: ["antisala", "sala-principale"], punti: [[1, 7.4], [15, 22.6]], versi: ["sx", "dx"] },
  { tra: ["sala-principale", "sala-bar"], punti: [[11.2, 14.4], [1, 6.4]], versi: ["dx", "sx"], zoom: [188, 236, 128, 80] },
  { tra: ["antisala", "corridoio-bagni"], punti: [[15, 7.6], [1, 7.6]], versi: ["dx", "sx"] },
  { tra: ["corridoio-bagni", "corridoio-spogliatoi"], punti: [[15, 7.6], [1, 7.6]], versi: ["dx", "sx"] },
  { tra: ["corridoio-spogliatoi", "area-fumatori"], punti: [[15, 7.6], [1, 8.8]], versi: ["dx", "sx"] },
  { tra: ["ingresso", "sala-del-tesoro"], punti: [[8, 6.3], [2, 8.9]], versi: ["su", "giu"], salita: true },
];
const PREMIO_SALA = { stanza: "sala-del-tesoro", punto: [14.8, 6.6], verso: "dx" };

/** L'altezza in pixel di una schermata: quasi tutte 200, la Sala principale molto più alta. */
const altezzaSala = (id) => (SALE[id].alto ?? SCHERMO[1]) * S;

/**
 * Disegna una schermata in (0, 0). `fase` è l'istante del giro (da 0 a 1). Il fumo dei fumatori di solito resta fuori,
 * perché lo mette la pagina come evento: `fumo: true` lo disegna fermo, già formato (per le anteprime). `eventi`
 * raccoglie gli eventi della sala, `fumatori` i fumatori; `evento` ({ id, k }) ne disegna uno a metà.
 */
export function disegnaSala(ctx, id, { fase = 0, fumo = false, eventi = null, evento = null, fumatori = null } = {}) {
  Object.assign(ANIMA, { fase, fumo, eventi, evento, fumatori, sala: id });
  try {
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, SCHERMO[0] * S, altezzaSala(id));
    ctx.clip();
    conOrigine(0, 0, () => SALE[id].disegna(ctx));
    ctx.restore();
  } finally {
    Object.assign(ANIMA, { fase: 0, fumo: true, eventi: null, evento: null, fumatori: null, sala: null });
  }
}

/** Disegna tutte le schermate una sotto l'altra: un foglio largo 320. Le opzioni sono quelle di `disegnaSala`. */
export function disegnaSale(ctx, opzioni = {}) {
  let y = 0;
  for (const id of ORDINE_SALE) {
    ctx.save();
    ctx.translate(0, y);
    disegnaSala(ctx, id, opzioni);
    ctx.restore();
    y += altezzaSala(id);
  }
}

/**
 * Le animazioni per il gioco, da mettere sopra il foglio fermo (`disegnaSale` con `fumo: false`).
 * - giro: per ogni sala e ogni fotogramma del giro, i quadratini di TESSERA pixel che cambiano rispetto al fotogramma
 *   0, come [quadratino, x, y] in pixel della sala; i quadratini uguali stanno una volta sola nel foglio `giro`.
 * - eventi: per ogni evento (il manichino) la sua posizione nella sala e una riga di fotogrammi, pezzi della sala, nel
 *   foglio `eventi`.
 * - fumi: la raccolta FUMI, ogni fumo una riga di fotogrammi trasparenti nello stesso foglio, con la brace in (ax, ay);
 *   e i fumatori, con la loro brace nella sala e il fumo preferito. Quale fumo fare lo tira a sorte la pagina.
 * - il portone da vicino: la sua immagine ferma (`portone`) e i suoi quadratini del giro, sotto il nome "portone".
 * `tela(w, h)` crea un canvas. Restituisce { indice, giro, eventi, fermo, portone }: `fermo` è il foglio da usare come
 * sale.png, `portone` l'immagine del portone da vicino (portone.png).
 */
export function animazioni(tela) {
  const TESSERA = 16, COLONNE = 32, L = SCHERMO[0] * S;
  const disegna = (id, opzioni) => {
    const c = tela(L, altezzaSala(id)), g = c.getContext("2d");
    disegnaSala(g, id, opzioni);
    return g.getImageData(0, 0, c.width, c.height);
  };
  const uguale = (p, q, x, y, w, h) => {
    for (let yy = y; yy < y + h; yy++) {
      const i = (yy * p.width + x) * 4;
      for (let j = 0; j < w * 4; j++) if (p.data[i + j] !== q.data[i + j]) return false;
    }
    return true;
  };
  // I quadratini, senza doppioni: l'impronta per trovarli, i pixel per esserne sicuri.
  const tessere = [], perImpronta = new Map();
  const tessera = (img, x, y, w, h) => {
    const px4 = new Uint8ClampedArray(w * h * 4);
    for (let yy = 0; yy < h; yy++) px4.set(img.data.subarray(((y + yy) * img.width + x) * 4, ((y + yy) * img.width + x + w) * 4), yy * w * 4);
    let impronta = 2166136261 ^ (w * 31 + h);
    for (let i = 0; i < px4.length; i++) impronta = Math.imul(impronta ^ px4[i], 16777619);
    const simili = perImpronta.get(impronta) ?? [];
    for (const n of simili) if (tessere[n].w === w && tessere[n].h === h && tessere[n].px.every((v, i) => v === px4[i])) return n;
    tessere.push({ w, h, px: px4 });
    simili.push(tessere.length - 1);
    perImpronta.set(impronta, simili);
    return tessere.length - 1;
  };
  // I quadratini che cambiano in ogni fotogramma del giro rispetto a `base`; `inFase(f)` disegna il fotogramma f.
  const fotogrammiGiro = (base, inFase) => {
    const fotogrammi = [[]];
    for (let f = 1; f < GIRO.fotogrammi; f++) {
      const img = inFase(f / GIRO.fotogrammi), lista = [];
      for (let y = 0; y < base.height; y += TESSERA)
        for (let x = 0; x < base.width; x += TESSERA) {
          const w = Math.min(TESSERA, base.width - x), h = Math.min(TESSERA, base.height - y);
          if (!uguale(base, img, x, y, w, h)) lista.push([tessera(img, x, y, w, h), x, y]);
        }
      fotogrammi.push(lista);
    }
    return fotogrammi;
  };
  const giro = {}, eventi = [], fermi = {}, fumatori = [];
  for (const id of ORDINE_SALE) {
    const iscritti = [];
    const base = disegna(id, { fumo: false, eventi: iscritti, fumatori });
    fermi[id] = base;
    const A = base.height;
    const fotogrammi = fotogrammiGiro(base, (fase) => disegna(id, { fase, fumo: false }));
    if (fotogrammi.some((l) => l.length)) giro[id] = fotogrammi;
    // Gli eventi: tutti i fotogrammi, poi il riquadro più piccolo che li contiene tutti.
    for (const ev of iscritti) {
      const quadri = [];
      for (let j = 0; j < ev.fotogrammi; j++) quadri.push(disegna(id, { fumo: false, evento: { id: ev.id, k: j / ev.fotogrammi } }));
      let x0 = L, y0 = A, x1 = -1, y1 = -1;
      for (const q of quadri)
        for (let y = 0; y < A; y++)
          for (let x = 0; x < L; x++) {
            const i = (y * L + x) * 4;
            if (q.data[i] === base.data[i] && q.data[i + 1] === base.data[i + 1] && q.data[i + 2] === base.data[i + 2]) continue;
            if (x < x0) x0 = x;
            if (x > x1) x1 = x;
            if (y < y0) y0 = y;
            if (y > y1) y1 = y;
          }
      if (x1 < 0) continue;
      eventi.push({ ...ev, x: x0, y: y0, w: x1 - x0 + 1, h: y1 - y0 + 1, quadri });
    }
  }
  // Il portone da vicino: le sue torce girano col giro come le sale, sotto il nome "portone".
  const disegnaVicino = (fase) => {
    const c = tela(PORTONE.larghezza, PORTONE.altezza), g = c.getContext("2d");
    disegnaPortone(g, { fase });
    return g.getImageData(0, 0, c.width, c.height);
  };
  const vicino = disegnaVicino(0);
  giro.portone = fotogrammiGiro(vicino, disegnaVicino);
  const portone = tela(PORTONE.larghezza, PORTONE.altezza);
  portone.getContext("2d").putImageData(vicino, 0, 0);
  // I fumi della raccolta, ognuno disegnato una volta sola su un foglio trasparente con la brace in basso al centro;
  // poi il riquadro più piccolo che contiene tutti i suoi fotogrammi, e dove ci sta la brace.
  const pool = FUMI.map((f) => {
    const W = 240, H = 240, bx = 120, by = 225, quadri = [];
    for (let j = 0; j < BOCCATA.fotogrammi; j++) {
      const c = tela(W, H), g = c.getContext("2d");
      disegnaFumo(g, [bx, by], f, j / BOCCATA.fotogrammi);
      quadri.push(g.getImageData(0, 0, W, H));
    }
    let x0 = W, y0 = H, x1 = -1, y1 = -1;
    for (const q of quadri)
      for (let y = 0; y < H; y++)
        for (let x = 0; x < W; x++) {
          if (!q.data[(y * W + x) * 4 + 3]) continue;
          if (x < x0) x0 = x;
          if (x > x1) x1 = x;
          if (y < y0) y0 = y;
          if (y > y1) y1 = y;
        }
    return { nome: f.nome, x: x0, y: y0, w: x1 - x0 + 1, h: y1 - y0 + 1, ax: bx - x0, ay: by - y0, fotogrammi: BOCCATA.fotogrammi, quadri };
  });
  // Il foglio dei quadratini del giro: COLONNE per riga.
  const fg = tela(COLONNE * TESSERA, Math.max(1, Math.ceil(tessere.length / COLONNE)) * TESSERA), gg = fg.getContext("2d");
  tessere.forEach((t, n) => gg.putImageData(new ImageData(t.px, t.w, t.h), (n % COLONNE) * TESSERA, Math.floor(n / COLONNE) * TESSERA));
  // Il foglio degli eventi: una riga per evento e una per fumo, i fotogrammi uno accanto all'altro.
  const righe = [...eventi, ...pool];
  const larga = Math.max(1, ...righe.map((e) => e.w * e.fotogrammi)), alta = righe.reduce((s, e) => s + e.h, 0);
  const fe = tela(larga, Math.max(1, alta)), ge = fe.getContext("2d");
  let riga = 0;
  for (const e of righe) {
    e.quadri.forEach((q, j) => ge.putImageData(q, j * e.w - e.x, riga - e.y, e.x, e.y, e.w, e.h));
    e.riga = riga;
    riga += e.h;
    delete e.quadri;
  }
  // Il foglio fermo, come sale.png ma senza fumo.
  const geo = geometria(), fermo = tela(geo.larghezza, geo.altezza), gf = fermo.getContext("2d");
  for (const id of ORDINE_SALE) gf.putImageData(fermi[id], 0, geo.stanze[id].riquadro[1]);
  // Versione 2: il fumo non è più un evento per fumatore ma una raccolta (fumi) da cui la pagina tira a sorte.
  const indice = {
    versione: 2,
    tessera: TESSERA,
    colonne: COLONNE,
    giro: { fotogrammi: GIRO.fotogrammi, fps: GIRO.fps, stanze: giro },
    eventi: eventi.map((e) => ({ ...e, fps: GIRO.fps })),
    fumi: {
      fotogrammi: BOCCATA.fotogrammi,
      fps: GIRO.fps,
      attesa: BOCCATA.attesa,
      fermo: BOCCATA.fermo,
      pool: pool.map(({ nome, w, h, ax, ay, riga: r }) => ({ nome, w, h, ax, ay, riga: r })),
      fumatori,
    },
  };
  return { indice, giro: fg, eventi: fe, fermo, portone };
}

/** Geometria delle schermate per il gioco, in pixel: dove sta ognuna nel foglio, il centro, le porte, il premio. */
export function geometria() {
  const L = SCHERMO[0] * S, A = SCHERMO[1] * S;
  const p = ([x, y]) => [Math.round(x * S), Math.round(y * S)];
  const stanze = {};
  let y = 0;
  for (const id of ORDINE_SALE) {
    stanze[id] = { nome: NOMI_SALE[id], piano: SALE[id].piano, riquadro: [0, y, L, altezzaSala(id)], centro: p(SALE[id].centro) };
    y += altezzaSala(id);
  }
  return {
    versione: 2,
    larghezza: L,
    altezza: y,
    schermo: [L, A],
    scala: S,
    stanze,
    porte: USCITE.map((u) => ({
      tra: u.tra, punti: u.punti.map(p), versi: u.versi, ...(u.salita ? { salita: true } : {}), ...(u.zoom ? { zoom: u.zoom } : {}),
    })),
    premio: { stanza: PREMIO_SALA.stanza, punto: p(PREMIO_SALA.punto), verso: PREMIO_SALA.verso },
    serrature: geometriaSerrature(),
  };
}

/** Geometria in pixel della pianta intera: dove sono stanze, porte e premio sulle immagini dei due piani. */
export function geometriaPianta() {
  const punto = ([x, y]) => [px(x), py(y)];
  return {
    larghezza: MAPPA_L,
    altezza: MAPPA_A,
    scala: S,
    stanze: Object.fromEntries(Object.entries(STANZE).map(([id, s]) => [id, {
      piano: s.piano,
      centro: punto(s.centro),
      zone: s.zone.map(([x, y, w, h]) => [px(x), py(y), w * S, h * S]),
    }])),
    porte: PORTE.map((p) => ({ tra: p.tra, punti: p.punti.map(punto), versi: p.versi, ...(p.salita ? { salita: true } : {}) })),
    premio: { stanza: PREMIO.stanza, punto: punto(PREMIO.punto), verso: PREMIO.verso },
  };
}
