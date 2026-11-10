// Le cinque tombe: rompicapo logico della Sala del tesoro (griglia di 5 tombe x 5 caratteri).
(function () {
  "use strict";
  const { mescola } = EscapeDemo;

// ── La variante: griglia logica generata per giocatore ──
// Soluzione a caso; indizi veri aggiunti a caso finché la soluzione è una sola; poi tolti, in ordine casuale, quelli
// che non servono. Si tiene la griglia solo se restano da 14 a 17 indizi e se si risolve ragionando (vedi difficolta);
// altrimenti se ne genera un'altra. Circa 2 ms per griglia.

const VALORI = [
  ["nera", "bianca", "rossa", "verde", "viola"], // 0 lapide
  ["vampiro", "mummia", "lupo mannaro", "strega", "zombie"], // 1 mostro
  ["sangue", "tè", "latte", "pozione", "succo di zucca"], // 2 bevanda
  ["liquirizia", "marzapane", "caramella mou", "cioccolato", "zucchero filato"], // 3 dolce
  ["gatto nero", "corvo", "pipistrello", "ragno", "rospo"], // 4 animale
];

// Domini: D[a * 5 + v] è una maschera di 5 bit con le tombe dove può stare il valore v del carattere a
// (bit p acceso = può stare nella tomba p; tomba 0 = la prima a sinistra).
const TUTTE = 31;
const bit = (p) => 1 << p;
const unico = (m) => m !== 0 && (m & (m - 1)) === 0;
const quante = (m) => { let n = 0; while (m) { n += m & 1; m >>= 1; } return n; };
const tombaDi = (m) => 31 - Math.clz32(m);
const aDestra = (m) => (m << 1) & TUTTE;
const aSinistra = (m) => m >> 1;

/** Restringe i domini secondo gli indizi e le regole della griglia. Ritorna false se si arriva a una contraddizione. */
function propaga(D, indizi) {
  let cambiato = true;
  while (cambiato) {
    cambiato = false;
    const metti = (i, m) => { if (m !== D[i]) { D[i] = m; cambiato = true; } return m !== 0; };
    for (const c of indizi) {
      const i = c.x[0] * 5 + c.x[1];
      const j = c.y ? c.y[0] * 5 + c.y[1] : -1;
      if (c.t === "posto") {
        if (!metti(i, D[i] & bit(c.n))) return false;
      } else if (c.t === "stessa") {
        const m = D[i] & D[j];
        if (!metti(i, m) || !metti(j, m)) return false;
      } else if (c.t === "diversa") {
        if (unico(D[i]) && !metti(j, D[j] & ~D[i])) return false;
        if (unico(D[j]) && !metti(i, D[i] & ~D[j])) return false;
      } else if (c.t === "sinistra") { // x subito a sinistra di y
        if (!metti(i, D[i] & aSinistra(D[j]))) return false;
        if (!metti(j, D[j] & aDestra(D[i]))) return false;
      } else if (c.t === "accanto") {
        if (!metti(i, D[i] & (aSinistra(D[j]) | aDestra(D[j])))) return false;
        if (!metti(j, D[j] & (aSinistra(D[i]) | aDestra(D[i])))) return false;
      }
    }
    for (let a = 0; a < 5; a++) {
      // un valore già al suo posto toglie quella tomba agli altri valori dello stesso carattere
      for (let v = 0; v < 5; v++) {
        const m = D[a * 5 + v];
        if (m === 0) return false;
        if (unico(m))
          for (let w = 0; w < 5; w++)
            if (w !== v && (D[a * 5 + w] & m) && !metti(a * 5 + w, D[a * 5 + w] & ~m)) return false;
      }
      // una tomba dove può stare un solo valore del carattere: è sua
      for (let p = 0; p < 5; p++) {
        let chi = -1, n = 0;
        for (let v = 0; v < 5; v++) if (D[a * 5 + v] & bit(p)) { n++; chi = v; }
        if (n === 0) return false;
        if (n === 1 && !unico(D[a * 5 + chi])) metti(a * 5 + chi, bit(p));
      }
    }
  }
  return true;
}

/** dove[a][v] = tomba del valore v del carattere a. */
function eVero(c, dove) {
  const p = (x) => dove[x[0]][x[1]];
  if (c.t === "posto") return p(c.x) === c.n;
  if (c.t === "stessa") return p(c.x) === p(c.y);
  if (c.t === "diversa") return p(c.x) !== p(c.y);
  if (c.t === "sinistra") return p(c.x) + 1 === p(c.y);
  return Math.abs(p(c.x) - p(c.y)) === 1; // accanto
}

/** Quante soluzioni hanno gli indizi (si ferma a `limite`). */
function contaSoluzioni(indizi, limite) {
  let n = 0;
  (function cerca(D) {
    if (n >= limite || !propaga(D, indizi)) return;
    let scelto = -1, minimo = 9;
    for (let i = 0; i < 25; i++) {
      const k = quante(D[i]);
      if (k > 1 && k < minimo) { minimo = k; scelto = i; }
    }
    if (scelto < 0) {
      const dove = [0, 1, 2, 3, 4].map((a) => [0, 1, 2, 3, 4].map((v) => tombaDi(D[a * 5 + v])));
      if (indizi.every((c) => eVero(c, dove))) n++;
      return;
    }
    for (let p = 0; p < 5 && n < limite; p++)
      if (D[scelto] & bit(p)) {
        const E = D.slice();
        E[scelto] = bit(p);
        cerca(E);
      }
  })(new Array(25).fill(TUTTE));
  return n;
}

/** Un indizio vero a caso (stesse probabilità del generatore del catalogo). */
function indizioACaso(rng, dove) {
  const valore = () => [Math.floor(rng() * 5), Math.floor(rng() * 5)];
  const d = (x) => dove[x[0]][x[1]];
  for (;;) {
    const q = rng();
    const x = valore();
    if (q < 0.08) return { t: "posto", x, n: d(x) };
    let y = valore();
    while (y[0] === x[0]) y = valore();
    const dx = d(x), dy = d(y);
    if (q < 0.45) return { t: "stessa", x, y: [y[0], dove[y[0]].indexOf(dx)] };
    if (q < 0.65) {
      if (dx + 1 === dy) return { t: "sinistra", x, y };
      if (dy + 1 === dx) return { t: "sinistra", x: y, y: x };
      continue;
    }
    if (q < 0.9) {
      if (Math.abs(dx - dy) === 1) return { t: "accanto", x, y };
      continue;
    }
    if (dx !== dy) return { t: "diversa", x, y };
  }
}

/**
 * Quanto è difficile: livello 1 se basta la propagazione; livello 2 se servono anche prove di un passo
 * («se il valore fosse in questa tomba, si arriverebbe a una contraddizione»), contate in `prove`; 3 se non basta.
 */
function difficolta(indizi) {
  const D = new Array(25).fill(TUTTE);
  if (!propaga(D, indizi)) return { livello: 0, prove: 0 };
  let prove = 0;
  while (!D.every(unico)) {
    let progresso = false;
    for (let i = 0; i < 25 && !progresso; i++) {
      if (unico(D[i])) continue;
      for (let p = 0; p < 5; p++) {
        if (!(D[i] & bit(p))) continue;
        const E = D.slice();
        E[i] = bit(p);
        if (!propaga(E, indizi)) { D[i] &= ~bit(p); prove++; progresso = true; break; }
      }
    }
    if (!progresso) return { livello: 3, prove };
    if (!propaga(D, indizi)) return { livello: 0, prove };
  }
  return { livello: prove === 0 ? 1 : 2, prove };
}

function generaGriglia(rng) {
  for (;;) {
    const dove = VALORI.map(() => mescola(rng, [0, 1, 2, 3, 4]));
    let indizi = [];
    while (contaSoluzioni(indizi, 2) > 1) indizi.push(indizioACaso(rng, dove));
    const tolti = new Set();
    for (const i of mescola(rng, [...indizi.keys()])) {
      const prova = indizi.filter((_, j) => j !== i && !tolti.has(j));
      if (contaSoluzioni(prova, 2) === 1) tolti.add(i);
    }
    indizi = indizi.filter((_, j) => !tolti.has(j));
    const { livello, prove } = difficolta(indizi);
    if (indizi.length >= 14 && indizi.length <= 17 && (livello === 1 || (livello === 2 && prove <= 5))) return { dove, indizi };
  }
}

// ── Le frasi degli indizi ──
const ORDINALI = ["prima", "seconda", "terza", "quarta", "quinta"];
const ART_MOSTRO = ["il", "la", "il", "la", "lo"];
const DI_MOSTRO = ["del", "della", "del", "della", "dello"];
/** «beve sangue», «beve la pozione», «mangia la caramella mou», … */
const cosa = (a, v) => (a === 2 && v === 3) || (a === 3 && v === 2) ? `la ${VALORI[a][v]}` : VALORI[a][v];
function soggetto([a, v]) {
  if (a === 0) return `chi riposa sotto la lapide ${VALORI[0][v]}`;
  if (a === 1) return `${ART_MOSTRO[v]} ${VALORI[1][v]}`;
  if (a === 2) return `chi beve ${cosa(2, v)}`;
  if (a === 3) return `chi mangia ${cosa(3, v)}`;
  return `chi ha il ${VALORI[4][v]}`;
}
function predicato([a, v]) {
  if (a === 0) return `riposa sotto la lapide ${VALORI[0][v]}`;
  if (a === 2) return `beve ${cosa(2, v)}`;
  if (a === 3) return `mangia ${cosa(3, v)}`;
  return `ha il ${VALORI[4][v]}`; // a === 4 (il mostro è sempre il soggetto)
}
function tomba([a, v], inizio) {
  if (a === 0) return `${inizio} con la lapide ${VALORI[0][v]}`;
  if (a === 1) return `${inizio} ${DI_MOSTRO[v]} ${VALORI[1][v]}`;
  if (a === 2) return `${inizio} di chi beve ${cosa(2, v)}`;
  if (a === 3) return `${inizio} di chi mangia ${cosa(3, v)}`;
  return `${inizio} con il ${VALORI[4][v]}`;
}
const maiuscola = (s) => s[0].toUpperCase() + s.slice(1);
function frase(ind) {
  if (ind.tipo === "stessa") return maiuscola(`${soggetto(ind.x)} ${predicato(ind.y)}.`);
  if (ind.tipo === "diversa") return maiuscola(`${soggetto(ind.x)} non ${predicato(ind.y)}.`);
  if (ind.tipo === "posto") return `${maiuscola(tomba(ind.x, "la tomba"))} è la ${ORDINALI[ind.n]} da sinistra.`;
  if (ind.tipo === "sinistra") return `${maiuscola(tomba(ind.x, "la tomba"))} è subito a sinistra di ${tomba(ind.y, "quella")}.`;
  return `${maiuscola(tomba(ind.x, "la tomba"))} è accanto a ${tomba(ind.y, "quella")}.`; // accanto
}

/** La variante del giocatore: da chiamare in `variante(rng)` di EscapeDemo.avvia. */
function creaVariante(rng) {
  const { dove, indizi } = generaGriglia(rng);
  // soluzione[a][p] = valore del carattere a nella tomba p
  const soluzione = dove.map((d) => { const s = [0, 0, 0, 0, 0]; d.forEach((p, v) => { s[p] = v; }); return s; });
  const lista = mescola(rng, indizi).map((c) => {
    let x = c.x, y = c.y;
    // nelle frasi «stessa» e «diversa» il mostro fa sempre da soggetto
    if ((c.t === "stessa" || c.t === "diversa") && y[0] === 1) [x, y] = [y, x];
    const ind = c.t === "posto" ? { tipo: "posto", x, n: c.n } : { tipo: c.t, x, y };
    ind.testo = frase(ind);
    return ind;
  });
  return { indizi: lista, soluzione };
}

// ── Sprite di «cinque-tombe»: una lettera per colore, "." = vuoto ──
const { C, GEMME } = EscapeDemo;
// Le lettere delle icone: tutte dalla paletta EscapeDemo.C.
const PAL = {
  k: C.bordo, n: C.nero, s: C.sagoma, N: C.ferro, f: C.ferroChiaro, p: C.pietra, P: C.pietraChiara, w: C.bianco,
  R: C.tappeto, r: C.tappetoChiaro, o: C.oroScuro, O: C.oro, y: C.giallo, b: C.brace, F: C.fiamma, L: C.fiammaChiara,
  d: C.legnoScuro, l: C.legno, m: C.legnoChiaro, M: C.legnoLuce, e: C.erbaScura, g: C.erba, G: C.erbaChiara,
  v: C.violaScuro, V: C.viola, u: C.lilla, z: C.rosa, a: C.acqua, c: C.notteChiara, t: C.notte, Y: C.luna,
};
// I colori delle lapidi: [chiaro, medio, scuro]. Rossa e verde prendono le pietre rubino e smeraldo (più sature).
const LAPIDI = [
  [C.ferroChiaro, C.sagoma, C.nero], // 0 nera
  [C.bianco, C.pietraChiara, C.pietra], // 1 bianca
  [GEMME.rubino[2], C.tappetoChiaro, C.tappeto], // 2 rossa
  [GEMME.smeraldo[2], GEMME.smeraldo[1], GEMME.smeraldo[0]], // 3 verde
  [C.lilla, C.viola, C.violaScuro], // 4 viola
];
const LAPIDE_GREZZA = [C.ferroChiaro, C.ferro, C.muro]; // lapide ancora senza colore
// I pallini dei colori ancora possibili sotto la lapide grezza (nell’ordine delle lapidi).
const PIP_LAPIDE = [C.nero, C.bianco, C.tappetoChiaro, GEMME.smeraldo[1], C.viola];

// Icona 12×12 delle lapidi: 1, 2, 3 = chiaro, medio, scuro della lapide (la croce è incisa con lo scuro); f = C.ferroChiaro.

const ICONA_LAPIDE = [
  "...kkkkkk...",
  "..k112222k..",
  ".k11222223k.",
  ".k12232223k.",
  ".k12333223k.",
  ".k12232223k.",
  ".k12232223k.",
  ".k12222223k.",
  ".k22222233k.",
  "kkkkkkkkkkkk",
  "kffffffffffk",
  "kkkkkkkkkkkk",
];

// Icone 12×12 dei valori, nell’ordine di VALORI. ICONE[a][v], con a = 1 mostro, 2 bevanda, 3 dolce, 4 animale.
const ICONE_OGG = {
  mostro: [
    [ // vampiro
      "...kkkkkk...",
      "..knnnnnNk..",
      ".knnnnnnnNk.",
      ".knPPnnPPnk.",
      ".kPPPPPPPpk.",
      ".kPrkPPrkpk.",
      ".kPPPPPPPpk.",
      ".kPkwkkwkpk.",
      "kRkPwPPwpkRk",
      "krRkPPPpkRrk",
      "krRRkkkkRRrk",
      "kkkkkkkkkkkk",
    ],
    [ // mummia
      "...kkkkkk...",
      "..kYYYPPPk..",
      ".kYYPPPYYpk.",
      ".kPPPYYYPpk.",
      ".knnnnnnnnk.",
      ".knyynnnnnk.",
      ".kYYYPPPYpk.",
      ".kPPYYYPPpk.",
      ".kYYPPPYYpk.",
      "..kPPYYYpk..",
      "..kYpkkpYk..",
      "...kk..kk...",
    ],
    [ // lupo mannaro
      ".k........k.",
      "kMk......kmk",
      "kMmk....kmlk",
      "kmmmkkkkmmlk",
      "kmmmmmmmmmlk",
      "kmykmmmmykmk",
      "kmmmmmmmmmlk",
      ".kmMMnnMMmk.",
      ".kmMMMMMMmk.",
      ".kmMwkkwMlk.",
      "..kmMMMMlk..",
      "...kkkkkk...",
    ],
    [ // strega
      "......kk....",
      ".....kVk....",
      "....kVvk....",
      "...kVVvk....",
      "...kVVVvk...",
      ".kkOOOOOOkk.",
      "kvvvvvvvvvvk",
      ".kkGGGGGGkk.",
      "..kGnGGnGk..",
      "..kGGGGGGGk.",
      "..kGGrrGgk..",
      "...kkkkkk...",
    ],
    [ // zombie
      "..kkk.kkk...",
      ".knnnknnnk..",
      ".knGGnnGnnk.",
      ".kGGGGGGGgk.",
      ".kGwwGGGGgk.",
      ".kGwnGGnGgk.",
      ".kGGGGGGGgk.",
      ".kGkkkkGGgk.",
      ".kGkrrkGggk.",
      ".kGGkkGGgk..",
      "..kGGGGggk..",
      "...kkkkkk...",
    ],
  ],
  bevanda: [
    [ // sangue
      "............",
      ".kkkkkkkkkk.",
      ".kwPPPPPPPk.",
      ".kwrrrrrrRk.",
      ".kPrrrrrrRk.",
      "..krrrrrRk..",
      "...kRRRRk...",
      "....kkkk....",
      ".....kPk....",
      ".....kPk....",
      "...kkPPPkk..",
      "...kkkkkkk..",
    ],
    [ // tè
      "....p..p....",
      "...p..p.....",
      "....p..p....",
      ".kkkkkkkk...",
      ".kMmmmmmmkk.",
      ".kwPPPPPPkPk",
      ".kwPPPPPPkPk",
      ".kPPPPPPpkk.",
      "..kPPPPpk...",
      "kkkkkkkkkkk.",
      "kPPPPPPPPpk.",
      ".kkkkkkkkk..",
    ],
    [ // latte
      "....kkkk....",
      "....kcck....",
      "....kkkk....",
      "....kwPk....",
      "...kwwPPk...",
      "..kwwwPPpk..",
      "..kwwwPPpk..",
      "..kwcccccpk.",
      "..kwwwPPpk..",
      "..kwwwPPpk..",
      "..kPPPPppk..",
      "...kkkkkk...",
    ],
    [ // pozione
      ".....kk.....",
      "....kMmk....",
      "....kPpk....",
      "....kPpk....",
      "...kPaapk...",
      "..kPaaaaak..",
      ".kPaawaaaak.",
      ".kPaaaaaatk.",
      ".kaaaawaatk.",
      ".kaaaaaattk.",
      "..kttttttk..",
      "...kkkkkk...",
    ],
    [ // succo di zucca
      "......kr....",
      "......kwk...",
      ".....kr.....",
      "..kkkkwkkk..",
      "..kPLLrLPk..",
      "..kPFFFFbk..",
      "..kPFFFFbk..",
      "..kPFFFFbk..",
      "..kPFFFFbk..",
      "..kPFFFbbk..",
      "..kPPPPPpk..",
      "..kkkkkkkk..",
    ],
  ],
  dolce: [
    [ // liquirizia
      "............",
      "...kkkkkk...",
      "..knNNNNnk..",
      ".knNnnnnNnk.",
      ".kNnNNNNnNk.",
      ".kNnNzzNnNk.",
      ".kNnNzzNnNk.",
      ".kNnNNNnnNk.",
      ".knNnnnnNnk.",
      "..knNNNNnk..",
      "...kkkkkk...",
      "............",
    ],
    [ // marzapane
      "............",
      ".kk......kk.",
      ".kzk....kzk.",
      ".kzzkkkkzzk.",
      "kzwzzzzzzzzk",
      "kzzkzzzzkzzk",
      "kzzzzzzzzzrk",
      "kzzzkkkkzzrk",
      "kzzkrzzrkzrk",
      ".kzzkkkkzrk.",
      "..kkzzzzrk..",
      "....kkkkk...",
    ],
    [ // caramella mou
      "............",
      "............",
      "....kkkkkk..",
      "...kLLLLLLk.",
      "..kLLLLLLok.",
      "..kooooobbk.",
      "kkkkkkkobbk.",
      "kLLLLLLkbbk.",
      "kooooobkbk..",
      "kooooobkk...",
      "kobbbbbk....",
      "kkkkkkkk....",
    ],
    [ // cioccolato
      "..kkkkkkkk..",
      "..kMmmkMmk..",
      "..kmmlkmlk..",
      "..kkkkkkkk..",
      "..kMmmkMmk..",
      "..kmmlkmlk..",
      "..kPPPPPPk..",
      "..krrrrrRk..",
      "..krwrrrRk..",
      "..krrrrrRk..",
      "..kRRRRRRk..",
      "..kkkkkkkk..",
    ],
    [ // zucchero filato
      "...kkkkk....",
      "..kcwcccck..",
      ".kccccwccck.",
      "kcwcccccccck",
      "kcccccccuck.",
      ".kcccccucck.",
      "..kcccuuck..",
      "...kkcukk...",
      ".....Pk.....",
      ".....Pk.....",
      ".....Pk.....",
      ".....kk.....",
    ],
  ],
  animale: [
    [ // gatto nero
      ".kk......kk.",
      ".kNk....knk.",
      ".kNnkkkknnk.",
      ".knnnnnnnnk.",
      "kNnnnnnnnnnk",
      "kNyynnnnyynk",
      "kNynnnnnynnk",
      "knnnnzznnnnk",
      "kfnnnnnnnnfk",
      ".knnnnnnnnk.",
      "..knnnnnnk..",
      "...kkkkkk...",
    ],
    [ // corvo
      "............",
      ".....kkk....",
      "....knnNk...",
      "..kknwnnk...",
      "kOOOknnnnk..",
      ".kkknnnnnk..",
      "....knnnnnk.",
      "...knnNnnnnk",
      "...knnnNNnnk",
      "....knnnnnkk",
      ".....kOkOk..",
      ".....k.k....",
    ],
    [ // pipistrello
      "............",
      "............",
      "....k..k....",
      "k..knkknk..k",
      "kk.knnnnk.kk",
      "kNkknynykkNk",
      "kNNknnnnkNNk",
      "kNNNknnkNNNk",
      "kNkNNkkNNkNk",
      "kk.kk..kk.kk",
      "............",
      "............",
    ],
    [ // ragno
      "......p.....",
      "......p.....",
      ".k..kkkk..k.",
      "k.kknNnnkk.k",
      "kk.knnnnk.kk",
      "..kknrrnkk..",
      ".k.knnnnk.k.",
      "k.kknnnnkk.k",
      "k..kknnkk..k",
      "..k..kk..k..",
      ".k........k.",
      "............",
    ],
    [ // rospo
      "............",
      "............",
      ".kkk....kkk.",
      "kGyGk..kGyGk",
      "kGGGkkkkGGgk",
      "kGGGGGGGGGgk",
      "kgGGGGGGGGgk",
      "kekkkkkkkkek",
      "kGGGGGGGGGgk",
      ".kgGGgGGgggk",
      "kGGkkkkkkGGk",
      "kkk......kkk",
    ],
  ],
};

const ICONE = [null, /* le lapidi usano ICONA_LAPIDE */ ICONE_OGG.mostro, ICONE_OGG.bevanda, ICONE_OGG.dolce, ICONE_OGG.animale];
// I segni delle targhe (9×7): e = inciso (C.bordo), r = barra rossa (C.tappetoChiaro).
const GLIFI = {
  stessa: [".........", ".........", ".eeeeeee.", ".........", ".eeeeeee.", ".........", "........."],
  diversa: ["......r..", ".....r...", ".eeeeree.", "....r....", ".eereeee.", "...r.....", "..r......"],
  sinistra: [".........", ".....e...", ".....ee..", "eeeeeeeee", ".....ee..", ".....e...", "........."],
  accanto: [".........", "..e...e..", ".ee...ee.", "eeeeeeeee", ".ee...ee.", "..e...e..", "........."],
};
// Il segno inciso nelle nicchie vuote (7×7, e = C.ferroChiaro): calice, lecca-lecca, zampa.
const CATEGORIE = [null, null,
  ["eeeeeee", "e.....e", "e.....e", ".e...e.", "..eee..", "...e...", "..eee.."],
  ["..eee..", ".e...e.", ".e.e.e.", ".e...e.", "..eee..", "...e...", "...e..."],
  ["..e.e..", "..e.e..", "e.....e", "e.eee.e", ".eeeee.", ".eeeee.", "..eee.."],
];
// La cornice ovale del ritratto (18×20): k = C.bordo, O = C.oro, o = C.oroScuro; dentro, i punti sono il fondo.
const CORNICE_RITRATTO = [
  "....kkkkkkkkkk....",
  "..kkOOOOOOOOOokk..",
  ".kOOkkkkkkkkkkook.",
  ".kOk..........kok.",
  "kOk............kok",
  "kOk............kok",
  "kOk............kok",
  "kOk............kok",
  "kOk............kok",
  "kOk............kok",
  "kOk............kok",
  "kOk............kok",
  "kOk............kok",
  "kOk............kok",
  "kOk............kok",
  "kok............kok",
  ".kok..........kok.",
  ".kookkkkkkkkkkook.",
  "..kkooooooooookk..",
  "....kkkkkkkkkk....",
];
// La sagoma del ritratto vuoto (8×9, e = C.ferroChiaro).
const SAGOMA_VUOTA = ["..eeee..", ".eeeeee.", ".eeeeee.", ".eeeeee.", "..eeee..", "...ee...", ".eeeeee.", "eeeeeeee", "eeeeeeee"];
// Gli occhi chiusi dei ritratti: [colonna, riga, lettera] da sostituire nell’icona del mostro (stesso ordine).
const PALPEBRE = [
  [[3, 5, "k"], [7, 5, "k"]],
  [[3, 5, "n"], [4, 5, "n"]],
  [[2, 5, "k"], [8, 5, "k"]],
  [[4, 8, "g"], [7, 8, "g"]],
  [[3, 4, "G"], [4, 4, "G"], [3, 5, "k"], [4, 5, "k"]],
];

// ── Disegno di riferimento di «cinque-tombe» (provato in anteprima sullo sfondo vero) ──
// Usa EscapeDemo e gli sprite qui sopra. Coordinate in pixel della scena 320×180, sempre intere.
const { rett, riquadro, testo } = EscapeDemo;

const TOMBA_CX = [36, 98, 160, 222, 284]; // centro di ogni tomba
const TARGA_X = [4, 46, 88, 193, 235, 277]; // colonne delle targhe (3 a sinistra dell'arco, 3 a destra)
const TARGA_Y = [19, 36, 53]; // righe delle targhe
const LAPIDE_Y = 72; // prima riga della lapide (alta 42)
const LASTRA_Y = 114; // prima riga della lastra (alta 26)
const NICCHIA_Y = 119;
const MEZZE = [9, 12, 14, 15, 16]; // mezza larghezza delle prime 5 righe della lapide; poi 17

const nicchiaX = (p, a) => TOMBA_CX[p] - 28 + (a - 2) * 19;
const targaXY = (i) => ({ x: TARGA_X[i % 6], y: TARGA_Y[Math.floor(i / 6)] });
function finestraXY(a, p) { return { x: Math.min(204, Math.max(4, TOMBA_CX[p] - 56)), y: a <= 1 ? 22 : 72 }; }

/** Icona 12×12 del valore v del carattere a. */
function icona(ctx, a, v, x, y, righe) {
  if (a === 0) EscapeDemo.sprite(ctx, ICONA_LAPIDE, { ...PAL, 1: LAPIDI[v][0], 2: LAPIDI[v][1], 3: LAPIDI[v][2] }, x, y);
  else EscapeDemo.sprite(ctx, righe || ICONE[a][v], PAL, x, y);
}
/** Copre metà dei pixel a scacchiera: icone «spente» o promemoria. */
function scacchiera(ctx, x, y, w, h, colore) {
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) if (((x + i + y + j) & 1) === 0) rett(ctx, colore, x + i, y + j, 1, 1);
}
function cornice(ctx, x, y, w, h, colore) { // rettangolo vuoto di 1 pixel
  rett(ctx, colore, x, y, w, 1); rett(ctx, colore, x, y + h - 1, w, 1);
  rett(ctx, colore, x, y, 1, h); rett(ctx, colore, x + w - 1, y, 1, h);
}

// ── Le targhe degli indizi (40×16) ──
function disegnaTarga(ctx, i, ind, stato) {
  const { x, y } = targaXY(i);
  if (!ind) { // posto vuoto: pietra liscia e scura con una crepa
    riquadro(ctx, x, y, 40, 16, C.ferro);
    rett(ctx, C.ferroChiaro, x + 1, y + 1, 38, 1);
    rett(ctx, C.muro, x + 1, y + 14, 38, 1);
    [[22, 3], [23, 4], [23, 5], [24, 6], [23, 7], [24, 8], [24, 9]].forEach(([i2, j]) => rett(ctx, C.muro, x + i2, y + j, 1, 1));
    return;
  }
  const sel = stato === "selezionata";
  if (sel) cornice(ctx, x - 1, y - 1, 42, 18, C.giallo);
  riquadro(ctx, x, y, 40, 16, sel ? C.pietraChiara : C.pietra);
  rett(ctx, sel ? C.bianco : C.pietraChiara, x + 1, y + 1, 38, 1);
  rett(ctx, sel ? C.bianco : C.pietraChiara, x + 1, y + 1, 1, 14);
  rett(ctx, C.ferroChiaro, x + 1, y + 14, 38, 1);
  rett(ctx, C.ferroChiaro, x + 38, y + 1, 1, 14);
  icona(ctx, ind.x[0], ind.x[1], x + 2, y + 2);
  if (ind.tipo === "posto") {
    rett(ctx, C.ferroChiaro, x + 15, y + 11, 22, 1); // il pavimento delle cinque tombine
    for (let k = 0; k < 5; k++) {
      const c = k === ind.n ? C.oro : C.ferro;
      rett(ctx, c, x + 17 + k * 4, y + 4, 1, 1);
      rett(ctx, c, x + 16 + k * 4, y + 5, 3, 6);
      if (k === ind.n) rett(ctx, C.giallo, x + 16 + k * 4, y + 5, 1, 2);
    }
  } else {
    EscapeDemo.sprite(ctx, GLIFI[ind.tipo], { e: C.bordo, r: C.tappetoChiaro }, x + 15, y + 4);
    icona(ctx, ind.y[0], ind.y[1], x + 26, y + 2);
  }
  if (stato === "usata") scacchiera(ctx, x + 1, y + 1, 38, 14, C.ferro);
}

// ── Il cartello del registro, appeso nell'arco ──
function disegnaCartello(ctx, sopra, sotto, coloreSotto) {
  for (let y = 16; y < 25; y += 2) { rett(ctx, C.ferroChiaro, 140, y, 1, 1); rett(ctx, C.ferroChiaro, 179, y, 1, 1); }
  riquadro(ctx, 134, 25, 52, 22, C.oroScuro);
  rett(ctx, C.oro, 135, 26, 50, 1);
  rett(ctx, C.oro, 135, 26, 1, 20);
  rett(ctx, EscapeDemo.GEMME.topazio[0], 135, 45, 50, 1);
  rett(ctx, EscapeDemo.GEMME.topazio[0], 184, 27, 1, 19);
  testo(ctx, sopra, 160, 29, { piccolo: true, colore: C.bordo, ombra: null, allinea: "centro" });
  testo(ctx, sotto, 160, 36, { colore: coloreSotto || C.bordo, ombra: C.oro, allinea: "centro" });
}

// ── La lapide grande 34×42 (colori = [chiaro, medio, scuro]) ──
function disegnaLapide(ctx, cx, colori, contorno) {
  const [L, M, S] = colori;
  const h = (j) => (j < 5 ? MEZZE[j] : 17);
  for (let j = 0; j < 42; j++) {
    const y = LAPIDE_Y + j;
    rett(ctx, contorno, cx - h(j), y, h(j) * 2, 1);
    if (j === 0 || j === 41) continue;
    const m = Math.min(h(j), h(j - 1));
    const xi = cx - m + 1, wi = m * 2 - 2;
    rett(ctx, M, xi, y, wi, 1);
    rett(ctx, L, xi, y, 2, 1);
    rett(ctx, S, xi + wi - 2, y, 2, 1);
    if (j <= 2) rett(ctx, L, xi, y, wi - 2, 1);
    if (j >= 39) rett(ctx, S, xi + 2, y, wi - 2, 1);
  }
  rett(ctx, S, cx - 13, LAPIDE_Y + 26, 26, 1); // riga incisa sotto il ritratto
  rett(ctx, L, cx - 13, LAPIDE_Y + 27, 26, 1);
}
/** Il contorno giallo (selezione) o rosso (errore) attorno alla lapide: un pixel fuori dal suo bordo. */
function contornoLapide(ctx, cx, colore) {
  const h = (j) => (j < 5 ? MEZZE[j] : 17);
  rett(ctx, colore, cx - h(0), LAPIDE_Y - 1, h(0) * 2, 1);
  for (let j = 0; j < 42; j++) {
    const hj = h(j), hp = j > 0 ? h(j - 1) : hj;
    rett(ctx, colore, cx - hj - 1, LAPIDE_Y + j, 1, 1);
    rett(ctx, colore, cx + hj, LAPIDE_Y + j, 1, 1);
    if (hj > hp) { rett(ctx, colore, cx - hj, LAPIDE_Y + j - 1, hj - hp, 1); rett(ctx, colore, cx + hp, LAPIDE_Y + j - 1, hj - hp, 1); }
  }
}

function disegnaRitratto(ctx, cx, v, esclusi, alza, chiudiOcchi) {
  const x = cx - 9, y = LAPIDE_Y + 4;
  rett(ctx, C.pietra, x + 3, y + 3, 12, 14); // il fondo dentro la cornice
  EscapeDemo.sprite(ctx, CORNICE_RITRATTO, { k: C.bordo, O: C.oro, o: C.oroScuro }, x, y);
  if (v != null) {
    let righe = ICONE[1][v];
    if (chiudiOcchi) righe = righe.map((r, j) => [...r].map((ch, i) => { const q = PALPEBRE[v].find(([pi, pj]) => pi === i && pj === j); return q ? q[2] : ch; }).join(""));
    icona(ctx, 1, v, x + 3, y + 3 - (alza || 0), righe);
  } else {
    const libere = [0, 1, 2, 3, 4].filter((k) => !esclusi.includes(k));
    if (libere.length === 1) { icona(ctx, 1, libere[0], x + 3, y + 3); scacchiera(ctx, x + 3, y + 3, 12, 12, C.pietra); }
    else EscapeDemo.sprite(ctx, SAGOMA_VUOTA, { e: C.ferroChiaro }, x + 5, y + 4);
    for (let k = 0; k < 5; k++) rett(ctx, esclusi.includes(k) ? C.ferroChiaro : C.bianco, x + 2 + k * 3, y + 15, 2, 2);
  }
}

function disegnaTarghetta(ctx, cx, n) {
  riquadro(ctx, cx - 5, LAPIDE_Y + 29, 11, 9, C.legnoScuro);
  testo(ctx, String(n), cx, LAPIDE_Y + 30, { colore: C.oro, ombra: null, allinea: "centro" });
}

function disegnaNicchia(ctx, nx, ny, a, v, esclusi) {
  riquadro(ctx, nx, ny, 18, 18, C.pietra);
  rett(ctx, C.ferroChiaro, nx + 1, ny + 1, 16, 1);
  rett(ctx, C.ferroChiaro, nx + 1, ny + 1, 1, 16);
  rett(ctx, C.pietraChiara, nx + 1, ny + 16, 16, 1);
  if (v != null) { icona(ctx, a, v, nx + 3, ny + 3); return; }
  const libere = [0, 1, 2, 3, 4].filter((k) => !esclusi.includes(k));
  if (libere.length === 1) { icona(ctx, a, libere[0], nx + 3, ny + 3); scacchiera(ctx, nx + 3, ny + 3, 12, 12, C.pietra); }
  else EscapeDemo.sprite(ctx, CATEGORIE[a], { e: C.ferroChiaro }, nx + 6, ny + 4);
  for (let k = 0; k < 5; k++) rett(ctx, esclusi.includes(k) ? C.ferroChiaro : C.bianco, nx + 2 + k * 3, ny + 13, 2, 2);
}

function disegnaLastra(ctx, cx) {
  const x = cx - 29;
  for (let i = 0; i < 60; i++) if ((i + LASTRA_Y) & 1) rett(ctx, C.nero, x - 1 + i, LASTRA_Y + 26, 1, 1); // ombra a terra
  rett(ctx, C.nero, x, LASTRA_Y + 26, 58, 1);
  riquadro(ctx, x, LASTRA_Y, 58, 26, C.ferro);
  rett(ctx, C.pietraChiara, x + 1, LASTRA_Y + 1, 56, 1);
  rett(ctx, C.pietra, x + 1, LASTRA_Y + 2, 56, 2);
  rett(ctx, C.bordo, x + 1, LASTRA_Y + 4, 56, 1);
  rett(ctx, C.ferroChiaro, x + 1, LASTRA_Y + 5, 1, 19);
  rett(ctx, C.muro, x + 56, LASTRA_Y + 5, 1, 19);
  rett(ctx, C.muro, x + 1, LASTRA_Y + 24, 56, 1);
}

/**
 * Una tomba intera. valori[a] = valore del carattere a in questa tomba (o null); esclusi[a] = valori segnati NO.
 * op: selezione (carattere con la finestra aperta), contorno (colore del bordo della lapide: C.giallo se accesa),
 * contornoFuori (contorno rosso dell’errore o giallo del lampeggio), alza (1 = ritratto un pixel più su), chiudiOcchi.
 */
function disegnaTomba(ctx, p, valori, esclusi, op = {}) {
  const cx = TOMBA_CX[p];
  const v0 = valori[0];
  const libere0 = [0, 1, 2, 3, 4].filter((k) => !esclusi[0].includes(k));
  disegnaLapide(ctx, cx, v0 != null ? LAPIDI[v0] : LAPIDE_GREZZA, op.contorno || C.bordo);
  if (v0 == null && libere0.length === 1) { // promemoria: il solo colore rimasto, a scacchiera sulla pietra grezza
    disegnaLapide(ctx, cx, LAPIDI[libere0[0]], op.contorno || C.bordo);
    const h = (j) => (j < 5 ? MEZZE[j] : 17);
    for (let j = 1; j < 41; j++) { const m = Math.min(h(j), h(j - 1)); scacchiera(ctx, cx - m + 1, LAPIDE_Y + j, m * 2 - 2, 1, C.ferro); }
  }
  if (op.selezione === 0) contornoLapide(ctx, cx, C.giallo);
  if (op.contornoFuori) contornoLapide(ctx, cx, op.contornoFuori);
  disegnaRitratto(ctx, cx, valori[1], esclusi[1], op.alza, op.chiudiOcchi);
  if (op.selezione === 1) cornice(ctx, cx - 10, LAPIDE_Y + 3, 20, 22, C.giallo);
  disegnaTarghetta(ctx, cx, p + 1);
  if (v0 == null) PIP_LAPIDE.forEach((c, k) => rett(ctx, esclusi[0].includes(k) ? C.ferroChiaro : c, cx - 7 + k * 3, LAPIDE_Y + 39, 2, 1));
  disegnaLastra(ctx, cx);
  for (let a = 2; a <= 4; a++) {
    disegnaNicchia(ctx, nicchiaX(p, a), NICCHIA_Y, a, valori[a], esclusi[a]);
    if (op.selezione === a) cornice(ctx, nicchiaX(p, a) - 1, NICCHIA_Y - 1, 20, 20, C.giallo);
  }
}

// ── La finestra di una casella (112×46) ──
const NOMI_CARATTERI = ["LAPIDE", "MOSTRO", "BEVANDA", "DOLCE", "ANIMALE"];
function disegnaFinestra(ctx, a, p, registro, esclusi) {
  const { x, y } = finestraXY(a, p);
  rett(ctx, C.nero, x + 1, y + 46, 112, 1); // ombra
  rett(ctx, C.nero, x + 112, y + 1, 1, 46);
  riquadro(ctx, x, y, 112, 46, C.legnoScuro);
  rett(ctx, C.legno, x + 1, y + 1, 110, 1);
  [[1, 1], [110, 1], [1, 44], [110, 44]].forEach(([i, j]) => rett(ctx, C.oro, x + i, y + j, 1, 1));
  testo(ctx, `TOMBA ${p + 1} - ${NOMI_CARATTERI[a]}`, x + 5, y + 4, { piccolo: true, colore: C.fiammaChiara, ombra: null });
  for (let k = 0; k < 5; k++) {
    const bx = x + 4 + k * 21, by = y + 11;
    const qui = registro[a][p] === k;
    const altrove = registro[a].indexOf(k);
    const escluso = esclusi[a][p].includes(k);
    if (qui) cornice(ctx, bx - 1, by - 1, 22, 22, C.giallo);
    riquadro(ctx, bx, by, 20, 20, qui ? C.pietraChiara : C.pietra);
    rett(ctx, qui ? C.bianco : C.pietraChiara, bx + 1, by + 1, 18, 1);
    rett(ctx, C.ferroChiaro, bx + 1, by + 18, 18, 1);
    icona(ctx, a, k, bx + 4, by + 4);
    if (escluso) {
      scacchiera(ctx, bx + 1, by + 1, 18, 18, C.ferro);
      for (let i = 0; i < 9; i++) { rett(ctx, C.tappetoChiaro, bx + 5 + i, by + 5 + i, 1, 1); rett(ctx, C.tappetoChiaro, bx + 13 - i, by + 5 + i, 1, 1); }
    }
    if (altrove >= 0 && altrove !== p) { // già messo in un'altra tomba: il suo numero nell'angolo
      rett(ctx, C.bordo, bx + 14, by + 13, 6, 7);
      testo(ctx, String(altrove + 1), bx + 15, by + 14, { piccolo: true, colore: C.giallo, ombra: null });
    }
    const ny = y + 32;
    riquadro(ctx, bx, ny, 20, 12, escluso ? C.tappetoChiaro : C.ferro);
    rett(ctx, escluso ? "#ff8a7a" : C.ferroChiaro, bx + 1, ny + 1, 18, 1);
    testo(ctx, "NO", bx + 10, ny + 4, { piccolo: true, colore: escluso ? C.bianco : C.ferroChiaro, ombra: null, allinea: "centro" });
  }
  const tx = a <= 1 ? TOMBA_CX[p] : nicchiaX(p, a) + 9; // la punta verso la casella
  rett(ctx, C.bordo, tx - 3, y + 46, 7, 1); rett(ctx, C.legnoScuro, tx - 2, y + 46, 5, 1);
  rett(ctx, C.bordo, tx - 2, y + 47, 5, 1); rett(ctx, C.legnoScuro, tx - 1, y + 47, 3, 1);
  rett(ctx, C.bordo, tx - 1, y + 48, 3, 1);
}

/** Stellina dorata di 5×5 (vittoria): f = fotogramma 0..3. */
function scintilla(ctx, x, y, f) {
  if (f === 3) return;
  rett(ctx, C.bianco, x, y, 1, 1);
  if (f === 1) { rett(ctx, C.giallo, x - 1, y, 3, 1); rett(ctx, C.giallo, x, y - 1, 1, 3); rett(ctx, C.bianco, x, y, 1, 1); }
  if (f === 2) { rett(ctx, C.giallo, x - 2, y, 5, 1); rett(ctx, C.giallo, x, y - 2, 1, 5); rett(ctx, C.bianco, x, y, 1, 1); }
}

/** Il pulviscolo che scende nella luce dell’arco (fotogramma f). */
function disegnaPulviscolo(ctx, f) {
  for (let k = 0; k < 5; k++) rett(ctx, (f + k) % 4 < 2 ? C.fiammaChiara : C.oro, 145 + 7 * k, 18 + ((f + 11 * k) % 50), 1, 1);
}
/** Il fascio di luce dorata nell arco, a retino (vittoria). */
function disegnaFascio(ctx) {
  const B = EscapeDemo.BAYER;
  for (let y = 16; y < 72; y++)
    for (let x = 130; x < 190; x++) {
      const k = 0.6 * (1 - Math.abs(x - 160) / (6 + (y - 16) * 0.45));
      if (k > 0 && B[y & 3][x & 3] / 16 < k) rett(ctx, C.giallo, x, y, 1, 1);
    }
}


// ── Stato e mosse: funzioni pure (stato + mossa → nuovo stato ed esito) ──
const statoVuoto = () => ({
  registro: Array.from({ length: 5 }, () => Array(5).fill(null)),
  esclusi: Array.from({ length: 5 }, () => Array.from({ length: 5 }, () => [])),
  usati: [],
});
const copiaJson = (o) => JSON.parse(JSON.stringify(o));
const ok05 = (n) => Number.isInteger(n) && n >= 0 && n <= 4;
const terna = (m, k) => Array.isArray(m) && m.length === k && m.every(ok05);
const contaVuote = (s) => s.registro.reduce((n, r) => n + r.filter((x) => x === null).length, 0);

/** applica(stato, mossa, soluzione) → { stato, esito }. Non disegna niente. */
function applica(stato, mossa, soluzione) {
  const NO = { stato, esito: { valida: false } };
  if (!mossa || typeof mossa !== "object" || Array.isArray(mossa)) return NO;
  const chiavi = Object.keys(mossa);
  if (chiavi.length !== 1) return NO;
  const chiave = chiavi[0];
  const arg = mossa[chiave];
  const s = copiaJson(stato);
  if (chiave === "metti" && terna(arg, 3)) {
    const [a, p, v] = arg;
    if (s.registro[a][p] === v) return { stato: s, esito: { ok: true } };
    const q = s.registro[a].indexOf(v);
    if (q >= 0) s.registro[a][q] = null;
    s.registro[a][p] = v;
    s.esclusi[a][p] = s.esclusi[a][p].filter((k) => k !== v);
    return { stato: s, esito: q >= 0 ? { ok: true, da: q } : { ok: true } };
  }
  if (chiave === "togli" && terna(arg, 2)) {
    s.registro[arg[0]][arg[1]] = null;
    return { stato: s, esito: { ok: true } };
  }
  if (chiave === "escludi" && terna(arg, 3)) {
    const [a, p, v] = arg;
    let acceso;
    if (s.registro[a][p] === v) { s.registro[a][p] = null; acceso = true; }
    else acceso = !s.esclusi[a][p].includes(v);
    s.esclusi[a][p] = s.esclusi[a][p].filter((k) => k !== v);
    if (acceso) s.esclusi[a][p].push(v);
    s.esclusi[a][p].sort((x, y) => x - y);
    return { stato: s, esito: { ok: true, escluso: acceso } };
  }
  if (chiave === "controlla" && arg === true) {
    const mancano = contaVuote(s);
    if (mancano > 0) return { stato: s, esito: { valida: false, mancano } };
    const giusto = s.registro.every((r, a) => r.every((x, p) => x === soluzione[a][p]));
    return { stato: s, esito: giusto ? { risolto: true } : { errore: true } };
  }
  if (chiave === "svuota" && arg === true) return { stato: statoVuoto(), esito: { ok: true } };
  return NO;
}

/** Un quaderno salvato è valido? (registro 5×5 senza ripetizioni, esclusi 5×5 di liste, usati con indici esistenti) */
function quadernoValido(q, nIndizi) {
  const griglia = (m) => Array.isArray(m) && m.length === 5 && m.every((r) => Array.isArray(r) && r.length === 5);
  if (!q || !griglia(q.registro) || !griglia(q.esclusi) || !Array.isArray(q.usati)) return false;
  for (const r of q.registro) {
    if (!r.every((x) => x === null || ok05(x))) return false;
    const pieni = r.filter((x) => x !== null);
    if (new Set(pieni).size !== pieni.length) return false;
  }
  if (!q.esclusi.every((r) => r.every((l) => Array.isArray(l) && l.every(ok05)))) return false;
  return q.usati.every((i) => Number.isInteger(i) && i >= 0 && i < nIndizi);
}

// ── Testi ──
const ART_BEV = ["il", "il", "il", "la", "il"];
const ART_DOL = ["la", "il", "la", "il", "lo"];
function nomeValore(a, v) {
  if (a === 0) return `la lapide ${VALORI[0][v]}`;
  if (a === 1) return `${ART_MOSTRO[v]} ${VALORI[1][v]}`;
  if (a === 2) return `${ART_BEV[v]} ${VALORI[2][v]}`;
  if (a === 3) return `${ART_DOL[v]} ${VALORI[3][v]}`;
  return `il ${VALORI[4][v]}`;
}
function descrizioneValore(a, v) {
  if (a === 0) return `lapide ${VALORI[0][v]}`;
  if (a === 1) return `ci riposa ${ART_MOSTRO[v]} ${VALORI[1][v]}`;
  if (a === 2) return `si beve ${cosa(2, v)}`;
  if (a === 3) return `si mangia ${cosa(3, v)}`;
  return `c'è il ${VALORI[4][v]}`;
}
const INVITO = [
  "lapide: tocca un colore per metterlo, NO per escluderlo.",
  "ritratto: tocca un mostro per metterlo, NO per escluderlo.",
  "bevanda: toccane una per metterla, NO per escluderla.",
  "dolce: toccane uno per metterlo, NO per escluderlo.",
  "animale: toccane uno per metterlo, NO per escluderlo.",
];

// ── Avvio ──
const opzioni = {
  id: "cinque-tombe",
  sfondo: "sala-del-tesoro",
  velo: 0.55,
  variante(rng) { return creaVariante(rng); },
  crea(g) {
    opzioni.testo = [
      g.scheda.enigma,
      "Tocca una targa del muro per leggere il suo indizio; toccala di nuovo per segnarla come usata. Sulle targhe: = stessa tomba, ≠ tombe diverse, → subito a sinistra, ↔ accanto; la tombina d'oro è la posizione contando da sinistra.",
      "Tocca la lapide, il ritratto o una nicchia di una tomba per scegliere cosa metterci. NO serve a escludere, come le crocette sul quaderno. Quando il registro è pieno, «Controlla»: se è sbagliato la cripta resta chiusa e non dice dove.",
      "Gli indizi incisi sul muro:",
      ...g.variante.indizi.map((c, i) => `${i + 1}. ${c.testo}`),
    ].join("\n");

    const indizi = g.variante.indizi;
    const sol = g.variante.soluzione;
    const riduci = g.riduciMovimento;

    // Stato logico
    let stato = statoVuoto();
    if (quadernoValido(g.memoria.quaderno, indizi.length)) {
      const q = g.memoria.quaderno;
      stato = {
        registro: copiaJson(q.registro),
        esclusi: q.esclusi.map((r) => r.map((l) => [...new Set(l)].sort((x, y) => x - y))),
        usati: [...new Set(q.usati)].sort((x, y) => x - y),
      };
    }
    if (g.giaRisolto) stato = { registro: copiaJson(sol), esclusi: statoVuoto().esclusi, usati: [] };

    // Solo interfaccia
    let finestra = null; // { a, p }
    let sel = null; // targa selezionata
    let conferma = false;
    let timerConferma = 0;
    let lampi = []; // { a, p, col, t0 }
    let incT = -1e9; // istante di «Controlla» incompleto
    let errT = -1e9; // istante dell'errore
    let vitT = g.giaRisolto ? -1e9 : null; // istante della vittoria
    let risolto = !!g.giaRisolto;
    let ver = 0; // cambia a ogni modifica visibile
    const sporca = () => { ver++; };

    function salva() {
      g.memoria.quaderno = { registro: stato.registro, esclusi: stato.esclusi, usati: stato.usati };
      g.salvaMemoria();
    }
    function annullaConferma() { conferma = false; clearTimeout(timerConferma); }
    function chiudiFinestra() { if (finestra) { finestra = null; sporca(); } }

    // La funzione unica delle mosse: la usano i tocchi, i bottoni e l'aggancio per le prove.
    function esegui(mossa) {
      if (!(mossa && mossa.svuota)) annullaConferma();
      const r = applica(stato, mossa, sol);
      const e = r.esito;
      const chiave = mossa && typeof mossa === "object" ? Object.keys(mossa)[0] : null;
      if (e.valida === false && e.mancano === undefined) return e;
      const t = g.tempo;
      if (chiave === "metti") {
        const [a, p, v] = mossa.metti;
        stato = r.stato;
        const n = p + 1;
        g.messaggio(`Tomba ${n}: ${descrizioneValore(a, v)}${e.da !== undefined ? ` (prima era nella tomba ${e.da + 1})` : ""}.`);
        if (!riduci) {
          lampi.push({ a, p, col: C.bianco, t0: t });
          if (e.da !== undefined) lampi.push({ a, p: e.da, col: C.ferroChiaro, t0: t });
        }
        salva(); sporca();
      } else if (chiave === "togli") {
        const [a, p] = mossa.togli;
        stato = r.stato;
        g.messaggio(`Tomba ${p + 1}: casella svuotata.`);
        salva(); sporca();
      } else if (chiave === "escludi") {
        const [a, p, v] = mossa.escludi;
        stato = r.stato;
        g.messaggio(e.escluso ? `Tomba ${p + 1}: NO per ${nomeValore(a, v)}.` : `Tomba ${p + 1}: tolto il NO per ${nomeValore(a, v)}.`);
        salva(); sporca();
      } else if (chiave === "svuota") {
        stato = r.stato;
        finestra = null;
        g.messaggio("Registro svuotato: si ricomincia.");
        salva(); sporca();
      } else if (chiave === "controlla") {
        if (e.mancano !== undefined) {
          g.messaggio(e.mancano === 1 ? "Il registro non è completo: manca 1 casella." : `Il registro non è completo: mancano ${e.mancano} caselle.`);
          incT = t; sporca();
        } else if (e.errore) {
          g.messaggio("Qualcosa non torna, ma la cripta non dice dove.");
          g.errore("Il registro non torna: la cripta resta chiusa.");
          errT = t; sporca();
        } else {
          vitT = t; risolto = true;
          g.messaggio("Le lapidi si accendono: la cripta è aperta!");
          const riepilogo = [0, 1, 2, 3, 4].map((p) =>
            `Tomba ${p + 1}: lapide ${VALORI[0][sol[0][p]]}, ${[1, 2, 3, 4].map((a) => VALORI[a][sol[a][p]]).join(", ")}.`).join("\n");
          g.risolto({ riepilogo, ritardo: 1600 });
          sporca();
        }
      }
      return e;
    }

    function segnaTarga(i) {
      const gia = stato.usati.includes(i);
      stato = { ...stato, usati: gia ? stato.usati.filter((k) => k !== i) : [...stato.usati, i].sort((x, y) => x - y) };
      g.messaggio(gia ? `Indizio ${i + 1} di nuovo da usare.` : `Indizio ${i + 1} segnato come usato.`);
      salva(); sporca();
    }
    function apriFinestra(a, p) {
      finestra = { a, p };
      g.messaggio(`Tomba ${p + 1}, ${INVITO[a]}`);
      sporca();
    }

    // Quale casella sta sotto il punto (x, y)?
    function cellaIn(x, y) {
      for (let p = 0; p < 5; p++) {
        const cx = TOMBA_CX[p];
        if (x >= cx - 10 && x <= cx + 9 && y >= 75 && y <= 96) return { a: 1, p };
        if (x >= cx - 17 && x <= cx + 16 && y >= 72 && y <= 113) return { a: 0, p };
        if (y >= 118 && y <= 138) {
          if (x >= cx - 28 && x <= cx - 11) return { a: 2, p };
          if (x >= cx - 9 && x <= cx + 8) return { a: 3, p };
          if (x >= cx + 10 && x <= cx + 27) return { a: 4, p };
        }
      }
      return null;
    }

    g.tocca(({ tipo, x: xr, y: yr }) => {
      if (tipo !== "giu") return;
      const x = Math.floor(xr), y = Math.floor(yr);
      annullaConferma();
      const cella = cellaIn(x, y);
      if (finestra) {
        const { x: fx, y: fy } = finestraXY(finestra.a, finestra.p);
        if (x >= fx && x < fx + 112 && y >= fy && y < fy + 46) {
          for (let k = 0; k < 5; k++) {
            const bx = fx + 4 + 21 * k;
            if (x < bx || x > bx + 19) continue;
            const { a, p } = finestra;
            if (y >= fy + 11 && y <= fy + 30) {
              finestra = null;
              esegui(stato.registro[a][p] === k ? { togli: [a, p] } : { metti: [a, p, k] });
              sporca();
            } else if (y >= fy + 31 && y <= fy + 45) {
              esegui({ escludi: [a, p, k] });
            }
          }
          return;
        }
        const stessa = cella && cella.a === finestra.a && cella.p === finestra.p;
        chiudiFinestra();
        if (stessa) return;
      }
      for (let i = 0; i < indizi.length; i++) {
        const t = targaXY(i);
        if (x >= t.x && x < t.x + 40 && y >= t.y && y < t.y + 16) {
          if (sel !== i) {
            sel = i;
            g.messaggio(`${i + 1}. ${indizi[i].testo}`);
            sporca();
          } else segnaTarga(i);
          return;
        }
      }
      if (cella) apriFinestra(cella.a, cella.p);
    });
    addEventListener("keydown", (e) => { if (e.key === "Escape") chiudiFinestra(); });

    g.bottone("Svuota", () => {
      if (!conferma) {
        conferma = true;
        clearTimeout(timerConferma);
        timerConferma = setTimeout(() => { conferma = false; }, 4000);
        g.messaggio("Tocca ancora «Svuota» per cancellare tutto il registro.");
        return;
      }
      annullaConferma();
      esegui({ svuota: true });
    }, { id: "svuota" });
    g.bottone("Controlla", () => {
      chiudiFinestra();
      esegui({ controlla: true });
    }, { id: "controlla", forte: true });

    g.messaggio(g.giaRisolto ? "La cripta è aperta: il registro è completo." : "Leggi gli indizi sul muro e tocca le tombe per compilare il registro.");

    // ── Disegno ──
    const STELLE = [[30, 70], [70, 90], [125, 80], [190, 75], [250, 92], [300, 70], [98, 69], [228, 69]];
    let ultimaFirma = "";
    g.anima((t) => {
      const f = riduci ? 0 : g.fotogramma;
      lampi = lampi.filter((l) => t - l.t0 < 150);
      const tInc = t - incT;
      const incAttivo = tInc < 450;
      const incOn = incAttivo && (riduci || tInc < 150 || tInc >= 300);
      const tErr = t - errT;
      const errAttivo = tErr < 900;
      const lapideRossa = errAttivo && (riduci ? tErr < 360 : tErr < 120 || (tErr >= 240 && tErr < 360));
      const tv = vitT === null ? null : riduci ? 1e9 : t - vitT;
      const accese = tv === null ? 0 : Math.min(5, Math.floor(tv / 150) + 1);
      const finale = tv !== null && tv >= 750;
      const firma = [f, ver, lampi.length, incOn, lapideRossa, errAttivo, accese, finale].join("|");
      if (firma === ultimaFirma) return;
      ultimaFirma = firma;

      const ctx = g.ctx;
      ctx.clearRect(0, 0, g.larghezza, g.altezza);
      if (finale) disegnaFascio(ctx);
      else if (!riduci) disegnaPulviscolo(ctx, f);
      const piene = stato.registro.reduce((n, r) => n + r.filter((x) => x !== null).length, 0);
      if (finale) disegnaCartello(ctx, "CRIPTA", "APERTA");
      else if (errAttivo) disegnaCartello(ctx, "REGISTRO", "NO", C.tappetoChiaro);
      else disegnaCartello(ctx, "REGISTRO", `${piene}/25`, incOn ? C.tappetoChiaro : undefined);

      for (let i = 0; i < 18; i++) {
        const ind = indizi[i] || null;
        const stTarga = sel === i ? "selezionata" : stato.usati.includes(i) ? "usata" : "normale";
        disegnaTarga(ctx, i, ind, stTarga);
        if (ind && sel === i && stato.usati.includes(i)) {
          const q = targaXY(i);
          scacchiera(ctx, q.x + 1, q.y + 1, 38, 14, C.ferro);
        }
      }

      for (let p = 0; p < 5; p++) {
        const valori = [0, 1, 2, 3, 4].map((a) => stato.registro[a][p]);
        const esclusi = [0, 1, 2, 3, 4].map((a) => stato.esclusi[a][p]);
        const lampoCella = (a) => lampi.find((l) => l.a === a && l.p === p);
        const op = {
          selezione: finestra && finestra.p === p ? finestra.a : undefined,
          contorno: tv !== null && tv >= 150 * p ? C.giallo : undefined,
          alza: finale && !riduci ? ((f >> 1) + p) % 2 : 0,
          chiudiOcchi: !riduci && !finale && (f + 9 * p) % 40 === 0,
        };
        if (lapideRossa) op.contornoFuori = C.tappetoChiaro;
        else if (incOn && valori[0] === null) op.contornoFuori = C.giallo;
        else if (lampoCella(0)) op.contornoFuori = lampoCella(0).col;
        disegnaTomba(ctx, p, valori, esclusi, op);
        const cx = TOMBA_CX[p];
        const l1 = lampoCella(1);
        if (incOn && valori[1] === null) cornice(ctx, cx - 10, 75, 20, 22, C.giallo);
        else if (l1) cornice(ctx, cx - 10, 75, 20, 22, l1.col);
        for (let a = 2; a <= 4; a++) {
          const la = lampoCella(a);
          if (incOn && valori[a] === null) cornice(ctx, nicchiaX(p, a) - 1, 118, 20, 20, C.giallo);
          else if (la) cornice(ctx, nicchiaX(p, a) - 1, 118, 20, 20, la.col);
        }
      }

      if (finale) STELLE.forEach(([sx, sy], i) => {
        const fase = riduci ? 1 : (f + 2 * i) % 8;
        if (fase <= 2) scintilla(ctx, sx, sy, fase);
      });
      if (finestra) disegnaFinestra(ctx, finestra.a, finestra.p, stato.registro, stato.esclusi);
    });

    // ── L'aggancio per le prove ──
    g.espone({
      gioca: (mossa) => esegui(mossa),
      statoGioco: () => ({
        registro: copiaJson(stato.registro),
        esclusi: copiaJson(stato.esclusi),
        usati: [...stato.usati],
        mancano: contaVuote(stato),
        aperta: finestra ? { a: finestra.a, p: finestra.p } : null,
        selezionato: sel,
        risolto,
      }),
      casella: (a, p) => {
        const cx = TOMBA_CX[p];
        if (a === 0) return { x: cx, y: 106 };
        if (a === 1) return { x: cx, y: 86 };
        return { x: cx + (a - 3) * 19, y: 128 };
      },
      scelta: (k) => {
        if (!finestra) return null;
        const { x, y } = finestraXY(finestra.a, finestra.p);
        return { x: x + 14 + 21 * k, y: y + 21 };
      },
      no: (k) => {
        if (!finestra) return null;
        const { x, y } = finestraXY(finestra.a, finestra.p);
        return { x: x + 14 + 21 * k, y: y + 38 };
      },
      targa: (i) => ({ x: TARGA_X[i % 6] + 20, y: TARGA_Y[Math.floor(i / 6)] + 8 }),
    });
  },
};
EscapeDemo.avvia(opzioni);
})();
