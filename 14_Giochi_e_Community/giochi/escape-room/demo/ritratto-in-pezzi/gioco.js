// Il ritratto in pezzi: tessere scorrevoli 3×3 (il gioco del quindici in piccolo).
// Il ritratto di Donna Ottavia è tagliato in 9 pezzi e manca quello in basso a destra. Si tocca un pezzo accanto al
// buco e scivola dentro; il fantasma della padrona concede un numero fisso di mosse: se finiscono, si arrabbia e
// rimescola il ritratto in una partenza nuova con lo stesso minimo.

(function () {
  "use strict";

  const { C, GEMME } = EscapeDemo;
  const COLORI = {
    k: C.bordo, n: C.nero, w: C.bianco, s: C.pietraChiara, S: C.pietra, d: C.ferroChiaro, D: C.ferro,
    r: C.tappetoChiaro, R: C.tappeto, q: GEMME.rubino[2], o: C.oro, O: C.oroScuro, y: C.giallo, h: GEMME.topazio[0],
    v: C.violaScuro, V: C.viola, l: C.lilla, b: C.notte, B: C.notteChiara, m: C.luna, p: C.rosa,
    f: C.fiamma, F: C.fiammaChiara, M: C.muro, u: C.mattone,
  };
  const { rett, riquadro, sprite, testo } = EscapeDemo;

  // ── Logica (pura: stato + mossa → nuovo stato ed esito) ──
  const FINE = "123456780";
  const VICINI = [[1, 3], [0, 2, 4], [1, 5], [0, 4, 6], [1, 3, 5, 7], [2, 4, 8], [3, 7], [4, 6, 8], [5, 7]];

  const risolvibile = (s) => {
    const a = [...s].filter((c) => c !== "0").map(Number);
    let inv = 0;
    for (let i = 0; i < a.length; i++) for (let j = i + 1; j < a.length; j++) if (a[i] > a[j]) inv++;
    return inv % 2 === 0;
  };
  const permutazione = (s) => typeof s === "string" && /^[0-8]{9}$/.test(s) && new Set(s).size === 9;

  /** Toccare la casella c nello stato st: ritorna { stato, esito, pezzo, da, a } (stato invariato se rifiutata). */
  function mossa(st, c, v) {
    if (!Number.isInteger(c) || c < 0 || c > 8) return { stato: st, esito: { valida: false, motivo: "casella" } };
    const z = st.tessere.indexOf("0");
    if (c === z) return { stato: st, esito: { valida: false, motivo: "buco" } };
    if (!VICINI[z].includes(c)) return { stato: st, esito: { valida: false, motivo: "lontano" } };
    const a = st.tessere.split("");
    const pezzo = a[c];
    a[z] = a[c];
    a[c] = "0";
    const tessere = a.join("");
    const mosse = st.mosse + 1;
    const dopo = { tessere, mosse, giro: st.giro };
    const base = { pezzo, da: c, a: z };
    if (tessere === FINE) return { ...base, stato: dopo, esito: { risolto: true, mosse } };
    if (mosse >= v.limite) {
      const giro = st.giro + 1;
      const nuovo = { tessere: v.partenze[giro % 8], mosse: 0, giro };
      return { ...base, stato: nuovo, dopoMossa: tessere, esito: { errore: true, motivo: "mosse finite", giro, tessere: nuovo.tessere } };
    }
    return { ...base, stato: dopo, esito: { ok: true, mosse, restano: v.limite - mosse, tessere } };
  }

  // ── Disegno: costanti e preparazioni ──
  const TX = 112;
  const TY = 19;
  const LATO = 32;
  const cx = (i) => TX + (i % 3) * LATO;
  const cy = (i) => TY + Math.floor(i / 3) * LATO;

  const ease = (t) => 1 - (1 - t) * (1 - t);
  const dolce = (t) => t * t * (3 - 2 * t);
  const adesso = () => performance.now();
  let fot = () => 0; // il fotogramma del kit può essere negativo nei primissimi istanti

  const FX = 103, FY = 10, FS = 114;
const TOPAZIO_SCURO = GEMME.topazio[0];
function cornice(ctx, accesa, sbirciata) {
  // strati 1..7 dall'esterno: in alto e a sinistra la luce, in basso e a destra l'ombra
  const CHIARO = accesa
    ? [C.oro, C.bianco, C.giallo, C.giallo, C.oro, C.giallo, C.legnoLuce]
    : [C.oroScuro, C.giallo, C.oro, C.oro, C.oroScuro, C.oro, C.legnoChiaro];
  const SCURO = accesa
    ? [C.oroScuro, C.oro, C.oro, C.giallo, C.oro, C.oro, C.legnoChiaro]
    : [TOPAZIO_SCURO, C.oroScuro, C.oroScuro, C.oro, C.oroScuro, C.oroScuro, C.legno];
  rett(ctx, C.bordo, FX, FY, FS, FS);
  for (let i = 1; i <= 7; i++) {
    const n = FS - 2 * i;
    rett(ctx, SCURO[i - 1], FX + i, FY + FS - 1 - i, n, 1);   // in basso
    rett(ctx, SCURO[i - 1], FX + FS - 1 - i, FY + i, 1, n);   // a destra
    rett(ctx, CHIARO[i - 1], FX + i, FY + i, n, 1);           // in alto
    rett(ctx, CHIARO[i - 1], FX + i, FY + i, 1, n - 1);       // a sinistra
  }
  // perline: un puntino ogni 4 pixel sullo strato 3
  for (let k = FX + 6; k < FX + FS - 6; k += 4) {
    rett(ctx, C.oroScuro, k, FY + 3, 1, 1);
    rett(ctx, TOPAZIO_SCURO, k, FY + FS - 4, 1, 1);
  }
  for (let k = FY + 6; k < FY + FS - 6; k += 4) {
    rett(ctx, C.oroScuro, FX + 3, k, 1, 1);
    rett(ctx, TOPAZIO_SCURO, FX + FS - 4, k, 1, 1);
  }
  // bordo interno attorno alla tavola (lilla durante la sbirciata)
  const bi = sbirciata ? C.lilla : C.bordo;
  rett(ctx, bi, FX + 8, FY + 8, FS - 16, 1);
  rett(ctx, bi, FX + 8, FY + 8, 1, FS - 16);
  rett(ctx, bi, FX + 8, FY + FS - 9, FS - 16, 1);
  rett(ctx, bi, FX + FS - 9, FY + 8, 1, FS - 16);
  for (const [x, y] of [[FX, FY], [FX + FS - 9, FY], [FX, FY + FS - 9], [FX + FS - 9, FY + FS - 9]])
    sprite(ctx, ROSETTA, COLORI, x, y);
  sprite(ctx, STEMMA, COLORI, 150, FY - 6);
}
  function targa(ctx) {
  rett(ctx, C.bordo, 130, 120, 60, 11);
  rett(ctx, C.oroScuro, 131, 121, 58, 9);
  rett(ctx, C.oro, 131, 121, 57, 8);
  rett(ctx, C.giallo, 132, 121, 56, 1);
  rett(ctx, C.bordo, 132, 123, 1, 1);   // ribattini
  rett(ctx, C.bordo, 187, 123, 1, 1);
  testo(ctx, "DONNA OTTAVIA", 160, 123, { piccolo: true, colore: C.legno, ombra: null, allinea: "centro" });
}

function cartello(ctx, { mosse, limite, risolto, lampo }) {
  const x = 236, y = 40, w = 70, h = 38;
  for (const cx of [x + 8, x + w - 10]) {            // catenelle a maglie
    for (let yy = 12; yy < y; yy += 6) {
      rett(ctx, C.bordo, cx - 1, yy, 4, 5);
      rett(ctx, C.ferroChiaro, cx, yy + 1, 2, 3);
      rett(ctx, C.ferro, cx + 1, yy + 2, 1, 2);
      rett(ctx, C.bordo, cx, yy + 5, 2, 1);
    }
  }
  riquadro(ctx, x, y, w, h, C.legnoChiaro);
  rett(ctx, C.legnoLuce, x + 1, y + 1, w - 2, 1);
  rett(ctx, C.legno, x + 1, y + h - 2, w - 2, 1);
  riquadro(ctx, x + 3, y + 3, w - 6, h - 6, C.muro);   // la lavagnetta
  for (const [ax, ay] of [[x + 1, y + 1], [x + w - 2, y + 1], [x + 1, y + h - 2], [x + w - 2, y + h - 2]])
    rett(ctx, C.ferroChiaro, ax, ay, 1, 1);             // chiodini
  if (risolto) {
    testo(ctx, "RITRATTO", x + w / 2, y + 9, { colore: C.fiammaChiara, allinea: "centro" });
    testo(ctx, "INTERO!", x + w / 2, y + 21, { colore: C.giallo, allinea: "centro" });
    return;
  }
  const restano = limite - mosse;
  const colore = lampo ? C.giallo : restano <= 5 ? C.tappetoChiaro : C.bianco;
  testo(ctx, "MOSSE", x + w / 2, y + 7, { colore: C.fiammaChiara, allinea: "centro" });
  testo(ctx, `${mosse}/${limite}`, x + w / 2, y + 18, { colore, scala: 2, allinea: "centro" });
}

function bancone(ctx) {
  rett(ctx, C.bordo, 18, 138, 284, 6);
  rett(ctx, C.legnoLuce, 19, 139, 282, 1);
  rett(ctx, C.legnoChiaro, 19, 140, 282, 2);
  rett(ctx, C.bordo, 20, 144, 280, 36);
  rett(ctx, C.legno, 21, 144, 278, 36);
  rett(ctx, C.legnoScuro, 21, 144, 278, 1);
  for (let k = 28; k < 270; k += 46) {                 // sei pannelli
    riquadro(ctx, k, 147, 38, 30, C.legno, C.legnoScuro);
    rett(ctx, C.legnoChiaro, k + 1, 148, 36, 1);
    rett(ctx, C.legnoChiaro, k + 1, 148, 1, 28);
  }
}

const RITRATTO = [
  "RRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRdddddddddddMdddddddddddMdddddddddddMdddddddddddM",
  "RRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRdDDDDDDDDDDMdDDDDDDDDDDMdDDDDDDDDDDMdDDDDDDDDDDM",
  "rrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrdDDDDDDDDDDMdDDDDDDDDDDMdDDDDDDDDDDMdDDDDDDDDDDM",
  "kkkkkkRRkRRrkkkkkkrrrRnkkkkkkkkRRrrRkkkkkkrrrrrrdDDDDDDDDDDMdDDDDDDDDDDMdDDDDDDDDDDMdDDDDDDDDDDM",
  "OOOOOOkkkkkkOOOOOOkkkkkkOOOOOOkkkkkkOOOOOOkkkkkkkkkkDDDDDDDMdDDDDDDDDDDMdDDDDkkkDDDMdDDDDDDDDDDM",
  "okRorrOOOOOOoRRoRROOOOOOorroRROOOOOOonRorkSwwsvvvvvvkkkMMMMMMMMMMMMMMMMMMMMkkSSSkkMMMMMMMMMMMMMM",
  "nkRrrroRkoRrrRRnRRorronkRrrrRRoRRorRRnRkkSwwskkkkkkkkkkkkddddddddMddddddddkSSSSSSSkddddddMdddddd",
  "nkRrrrRRkRRrrRRnRRrrrRnkRrrrRRkRRrrRRnkkSwwsVVVVVVVVVVVVkkDDDDDDDMdDDDDDDkSSSkkkSSSkDDDDDMdDDDDD",
  "nkRrrrRRkRRrrRRnRRrrrRnkRrrrRRkRRrrRkklSwwsVVVVVVVvvvvvvvvkkDDDDDMdDDDDkkSSSkbkbkSSSkkDDDMdDDDDD",
  "nkRrrrRRkRRrrRRkRRrrRRnRRrrRRnRRrrrklVVSwwsvvvvvvvvvvvvvvvvvkDDDDMdDDDkSSSkkbbkbbkkSSSkDDMdDDDDD",
  "nkRrrrRRkRRrrRRkRRrrRRnRRrrRRnRRrrrkVvvvSwwsvvvvvvvvvvvvvvvvkDDDDMdDDDkSSkbbbbkbbbbkSSkDDMdDDDDD",
  "nkRrrrRRkRRrrRRkRRrrRRnRRrrRRnRRrrkvvvvvkSwwskkkkkkkkkkkvvvvvkMMMkMMMkSSkbbbbbkbbbbbkSSkMMMMMMMM",
  "nkRrrrRRkRRrrRRkRRrrRRnRRrrRRnRRrkvvvkkklSwwsVVVVVVVVVVkkkkkvkkdkkddkSSkbbbbbbkbmmmbbkSSkddddddM",
  "nkRrrrRRkRRrrRRkRRrrRRnRRrrRRnRRrkkkklllSwwsVVVVVVvvvvvkVkvkkkkkVkDkSSkbbbbbbbkmmmmmmbkSSkDDDDDM",
  "nkRrrrRnkRrrrRnkRrrrRnkRrrrRnkRrkklllVVSwwsvvvvvvvvvvvvkvVkkrkrkVvDkSSkbbbbbbmkBBmmmmmkSSkDDDDDM",
  "nkRrrrRnkRrrrRnkRrrrRnkRrrrRnkRrklVVVvSwwsvvvvvvvvvvvvvvkvvkkkkvvkkSSkbbbbbbbmkmmmmmmmbkSSkDDDDM",
  "nkRrrrRnkRrrrRnkRrrrRnkRrrrRnkRrkVvvvvSwwskkkkkkkkkkkkkkvkkvkvkkDDkSSkbbbbbbmmkmmmmmmmmkSSkDDDDM",
  "nkRrrrRnkRrrrRnkRrrrRnkRrrrRnkRrkvvvvkkSwwsVVVVVVVVVVVVVkkkkvkvkMkSSkbbbbbbbmmkmmmmmmmmbkSSkMMMM",
  "nkRrrrRnkRrrRRnRRrrRRkRRrrRRkRRrkvkkklllSwwsVVVVVVvvvvvvvvvkkkvkdkSSkbbbbbbbmmkmmmBBBmmbkSSkdddd",
  "nkRrrrRnkRrrRRnRRrrRRkRRrrRRkRRkkklllVVVSwwsvvvvvvvvvvvvvvvvvvkkkkSSkbbbbbbbbmkmmBBBBBbbkSSkDDDD",
  "nkRrrrRnkRrrRRnRRrrRRkRRrrRRkRRrklVVVvvSwwsvvvvvvvvvvvvvvvvvvvvkDkSkbbbbbbwbbmkmmmBBBmbbbkSkDDDD",
  "nkRrrrRnkRrrRRnRRrrRRkRRrrRRkRRrkVvvvvSwwskkkkkkkkkkkkkkvvvvvvvkksSkbbbbbbbbbbkmmmmmmbbbbkSdkDDD",
  "nkRrrRRnRRrrRRkRrrrRnkRrrRRnRRrrkvvvvSwwsVVVVVVVVVVVVVVVkkkvvvvkksSkbbbbbbbbbbkbmmmbbbbbbkSdkDDD",
  "nkRrrRRnRRrrRRkRrrrRnkRrrRRnRRrrkvkkkSwwsVVVVVVVVVvvvvvvvvvkkkvkksSkbbbbbbbbbbkbbbbbbbbbbkSdkMMM",
  "nkRrrRRnRRrrRRkRrrrRnkRrrRRnRRrrkklllVSwwsvvvvvvvvvvvvvvvvvvvvkkksSkbbbbbbbbbbkbbbbbbbbbbkSdkddM",
  "nkRrrRRnRRrrRRkRrrrRnkRrrRRnRRrrRkVVVvvSwwsvvvvvvvvvvvvvvvvvvvkDksSkbbbbbbbbbbkbbbbbbbbbbkSdkDDM",
  "nkRrrRRkRRrrRnkRrrRRkRRrrRnkRrrRRkvvvvvSwwskkkkkkkkkkkkkvvvvvvkDksSkbbwbbbbbbbkkbbbbbbbbbkSdkDDM",
  "nkRrrRRkRRrrRnkRrrRRkRRrrRnkRrrRRkkvvkSwwsVVVVVVVVVVVVVVkkkvvkDDksSkbbbbbbbbkbkkbbkbbbbbbkSdkDDM",
  "nkRrrRRkRRrrRnkRrrRRkRRrrRnkRrrRRkRkkSwwsVVVVVVVVVvvvvvvvvvkkDDDksSkbbbbbbbbbkkkkkbbbbbbbkSdkDDM",
  "nkRrrRRkRrrrRnRRrrRnkRrrRRkRrrrRnRRkSwwsvvvvvvvvvvvvvvvvvvvvkMMMksSkbbbbbbbbbbkkkbbbbbbbbkSdkMMM",
  "nkRrrRRkRrrrRnRRrrRnkRrrRRkRkrrRnRRkSwwsvvvvvvvvvvvvvvvvvvvvkdddksSkbbbbbbbbbbkbbbbbbbbbwkSdkddd",
  "nkRrrRRkRrrrRnRRrrRnkkrrRRkRkrrRnRkvvVvvvVvvvVvvvvkvvvkvvvkvvkDDksSkbbbbbbkbbbkbbbbbbbbbbkSdkDDD",
  "nkRrrRRkRrrRRkRrrRRkRkkrRnRRkrRnRkvvvVvvvVkvvVvvvvkvvkkvvvkvvvkDksSkkkkkkkkkkkkkkkkkkkkkkkSdkDDD",
  "nkRrrRRkRrrRRkRrrRRkRkvkRnRkvkRnkVvvvVvvkkkvvVvvvvkvvkkkvvkvvvkkkskvkbbbkvkbbbkbbbbbbbbbbkSdkDDD",
  "nkRrrRRkRrrRRkRrrRRkRrkkRnRkvkRkvVvvvVvkSSSkkkvvvvkkkSSSkvkvvvkvkskvkbbbkkbbbbkbbbbbbbbbbkSdkDDD",
  "nkRrrRnkRrrRnkRrrRnkRrkvkkRkvknkvVvvvVkSwssSSkvvvvkSSssSSkkvvvkvkskvkubkvkbbbukbbubbbubbbkSdkMMM",
  "nkRrrRnkRrrRnkRrrRnkRrkvvkRkvvkkvVvvvVkwsssssSkkkkSssssSSkkvvvkvkkvvkbkvvkbbkbkbubbbubbbukSdkddM",
  "nkRrrRnkRrrRnkRrrRnkkrkvvvkkvvkkkVvvvkSsssssssSSSSsskkkSSSkvvvkvkkvkvkvvvkbkbbkubbbubbbubkSdkDDM",
  "nkRrrRnRRrrRnRrrrRkRrkvvvvvkvvkkskvvvksswsssssssssskssskSSkvvvkkSkvkvvvvvvkbbbkbbbubbbwbbkSdkDDM",
  "nkRrrRnRRrrRnRrrrRkRrkvvvvvvkvvksskvkSswsssssssssskssssSkSSkvvkSSkkvvvvvvvkbbukbbubbbubbbkSdkDDM",
  "nkRrrRnRrrRRkRrrRnkRrrkvvvvvkvvkssSkkswkkkkksssssssssssSSkdkvkdSSkkvvvvvvkbbubkbubbbubbbukSdkDDM",
  "nkRrrRnRrrRRkRrrRnkRrrkvvvvvvkvkksSkkwkswssskssssssssssSSSdkvkdSkkvvvvvvvkbubbkubbbubbbubkSdkMMM",
  "nkRrrRnRrrRRkRrrRnkRrrRkvvvvvkvvksSSkssSSSSSSSssssSSSSSSSSdkkddSkkvvvvvvkbubbbkbbbubbbubbkSdkddd",
  "nRkkrRkRrrRnRRrrRkRrrRnkkvvvvvkvkkSSkswskkkkksssssskkkkkSSdkkddkkvvvvvvkkkkkkkkkkkkkkkkkkkSdkDDD",
  "nRyokkkRrrRnRRrrRkRrkkkykvvvvvkvkkSkksskwwrrwksssskwrrwwkSdkvkdkkvvvvvvkSSSSSSSSSSSSSSSSSSSdkDDD",
  "nROOoyokkkRnRRrrRkkkyooOOkvvvvkvvkkkksskwrykrksssskrykrSkSdkkDkkkvvvvvkkkkkkkkkkkkkkkkkkkkkkkkkD",
  "nRkkOOOoyokkkkkkkyooOOOkkkvvvvvkkoDkkssskkkkksssSsskkkkkSSdkDkokkvvvvvkssssssssssssssssssssssskD",
  "nRRrkkkOOOoyooyooOOOkkkRrrkvvvvkkookksssSSSSSsssSssSSSSdSSdkMkookvvvvkSSSSSSSSSSSSSSSSSSSSSSSSkM",
  "nRRrRRkkkkOOOOkkkkkkRRkRrrkvvvvvkkkMksssssssssssSssssssSSSdkdkkkvvvvvkkkkkkkkkkkkkkkkkkkkkkkkkkM",
  "nRRrRRkRrrkkkkyookrrRnRrrRnkvvvvkqrkkssssssssssssSsssssSSSdkdkqrkvvvkDDMdDDDDDDDDDDMdDDDDDDDDDDM",
  "nRRrRRkRrrRkRkoOOkrrRnRrrRnkvvvvkrRkksssSssssssssSsssssSdSdkdkrRkvvvkDDMdDDDDDDDDDDMdDDDDDDDDDDM",
  "nRRrRRkRrrRkRrkOkRrrRnRrrRnRkvvvkRRkdksssSsssssSkSkssssdSSkMkkRRkvvkDDDMdDDDDDDDDDDMdDDDDDDDDDDM",
  "nRrrRnRRrRnRrkooOkrRnRRrRnRrkvvvvkkkdkssssssssssssssssskSSkMkvkkvvvkDDDMdDDDDDDDDDDMdDDDDDDDDDDM",
  "nRrrRnRRrRnRkyooOOkRnRRrRnRrrkvvvvkvkMksssssssssssskkssSSkMkkvvvvvkMMMMMMMMMMMMMMMMMMMMMMMMMMMMM",
  "nRRrRRkRrrRkkoooOOkrRnRrrRnRrkvvvvvkkdkssssskkkkkkkRkssSSkdkkvvvvvkddddddddddMdddddddddddMdddddd",
  "nRRrRRkRrrRkkoyoOOkrRnRrrRnRrrkvvvvkvkDkssskRrrrRRRksssSkDkkvvvvvkdDDDDDDDDDDMdDDDDDDDDDDMdDDDDD",
  "nRRrRRkRrrRnkooooOkrRRkRrrRnRrkvvvvkvvkDkssskRRRkkwkssskDkvkvvvvvkdDDDDDDDDDDMdDDDDDDDDDDMdDDDDD",
  "nRRrRRkRrrRnkOoOoOkrRRkRrrRnRrrkvvvvkvkDDkkkskkkskwkkkkDDkkvvvvvkMdDDDDDDDDDDMdDDDDDDDDDDMdDDDDD",
  "nRRrrRkRrrRnkOkOkOkrrRnRRrrRkRrkvvvvkvvkDMdDkssssskkkMdDkvkvvvvvkMdDDDDDDDDDDMdDDDDDDDDDDMdDDDDD",
  "nRRrrRkRrrRnRkrkRkRrrRnRRrrRkRrrkvvvvkvkMMMMkksssskdkMMMkkvvvvvkMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMM",
  "nkRrrRnRrrRRkRrrRnkRrrRnRrrRRkRrrkvvvkvvkdddkSksskddkddkvkvvvvkddddddddMdddddddddddMdddddddddddM",
  "nkRrrRnRrrRRkRrrRnkRrrRnRrrRRkRrrkvvvvkvvkDDkSSkkdddkDkvkvvvvvkDDDDDDDDMdDDDDDDDDDDMdDDDDDDDDDDM",
  "nkRrrRnRRrrRnRrrrRkRrrRRkRrrRRkRrrkvvvkvvvkDkSSSSdddkkvvkvvvvkDDDDDDDDDMdkDDDDDDDDDMdkDDDDDDDDDM",
  "nkRrrRnkRrrRnkRrrRnkRrrRnkRrrRnkRrkvvvvkvvvkkSSSSdddkvvkvvvvvkDDDDDDDDDMdkkDDkDDDkDMkkDDDDDDDDDM",
  "nkRrrRnkRrrRnkRrrRnkRrrRnkRrrRnkRrrkvvvkvvvvkSSSSdddkvvkvvvvkDDDDDDDDDDMdkvkDkkDkkDkvkDDDDDDDDDM",
  "nkRrrRRkRrrRRkRrrRRkRrrrRnRRrrRnRRrrkvvkvvvvkSSSSdddkvvkvvvkMMMMMMMMMMMMMkvvkkkkkkkvvkMMMMMMMMMM",
  "nkRrrRRkRrrRRkRrrRRkRrrrRnRRrrRnRRrrRkvvkvvvkssssSSSkvkvvvkddddddMdddddddkvVvkrkrkvVvkdddMdddddd",
  "nkRrrRRkRrrrRnRRrrRnkRrrRRkRrrrRnRRrrRkkkvvvkssssSSSkvkvkkDDDDDDDMdDDDDDDDkvvkkkkkvvkDDDDMdDDDDD",
  "nkRrrRRkRrrrRnRRrrRnkRrrRRkRrrrRnkkwskkkkkkkkssssSSSkkkkkkkkSskDDMdDDDDDDDDkvkkkkkvkDDDDDMdDDDDD",
  "nkRrrRRkRRrrRnkRrrRRkRRrkkkkkkkkkVVkksvksssskssssSSSkSSSkvvSkkvkkkkkkkkkDDDDkMkVkDkDDDDDDMdDDDDD",
  "nkRrrRRkRRrrRnkRrrRkkkkkVVVVVVVVVVVVvwsvkssskssssSSSkSSkvvSsvvvvvvvvvvvvkkkkkMdkDDDDDDDDDMdDDDDD",
  "nkRrrRRnRRrrRRkkkkkVVVVVVVVVVVVVVVVVvwsoOssskkkkkkkkkSSkOoSsvvvvvvvvvvvvvvvvvkkkkkMMMMMMMMMMMMMM",
  "nkRrrrRnkRrkkkvlVkkkVVVVVVVVVVVVVVVVvkksvoOssssssssSSSOovSkkvvvvvvvvvvvvvvvvkkkVvvkkkddddddddddM",
  "nkRrrrRnkRklVVvlVVvlkVVVVVVVVVVVVVVVvvvwsksoOoOkkkOoOokvSsvvvvvvvvvvvvvvvvvkvvkVvvkVvkDDDDDDDDDM",
  "nkRrrrRnkkvlVVvlVVvlVkkVVVVVVVVVVVVvvvvwsvkssskyookSSkvvSsvvvvvvvvvvvvvvvkkVvvkVvvkVvvkDDDDDDDDM",
  "nkRrrrRkkVvlVVvlVVvlVVvkVVVVVVVVVVVvvvvkksvkskkkokkkkvvSkkvvvvvvvvvvvvvvkvkVvvkVvvkVvvkkkDDDDDDM",
  "nkRrrrklVVvlVVvlVVvlVVvlkVVVVVVVVVVvvvvvvwskskqrrrRkkvSsvvvvvvvvvvvvvvvkvvkVvvkVvvkVvvkVvkDDDDDM",
  "nkRrrkvlVVvlVVvlVVvlVVvlkVVVVVVVVVvvvvvvvwsvkkqrrRRkvvSsvvvvvvvvvvvvvvvkvvkVvvkVvvkVvvkVvvkMMMMM",
  "nkRrkVvlVVvlVVvlVVvlVVvlVkVVVVVVVVvvvvvvvkksvkkrRRkvvSkkvvvvvvvvvvvvvvkVvvkVvvkVvvkVvvkVvvkkdddd",
  "nkRkVVvlVVvlVVvlVVvlVVvlVVkVVVVVVVvvvvvvvvwsvkskRkkvvSsvvvvvvvvvvvvvvkkVvvkVvvkVvvkVvvkVvvkVkDDD",
  "nkRkVVvlVVvlVVvlVVvlVVvlVVkVVVVVVvvvvvvvvvvwsvkskkvvSsvvvvvvvvvvvvvvvkkVvvkVvvkVvvkVvvkVvvkVkDDD",
  "nkklVVvlVVvlVVvlVVvlVVvlVVkVVVVVVvvvvvvvvvvkksksskvSkkvvvvvvvvvvvvvvvkkVvvkVvvkVvvkVvvkVvvkVvkDD",
  "nkklVVvlVVvlVVvlVVvlVVvlVVvkVVVVVvvvvvvvvvvvwsvkkvvSsvvvvvvvvvvvvvvvkvkvvvkvvvkvvvkvvvkvvvkvvkDD",
  "nkvlVVvlVVvlVVvlVVvlVVvlVVvkVVVVVvvvvvvvvvvvvwsvvvSsvvvvvvvvvvvvvvvvkvkvvvkvvvkvvvkvvvkvvvkvvvkM",
  "nkvlVVvlVVvlVVvlVVvlVVvlVVvkVVVVvvvvvvvvvvvvkksvvvSkkvvvvvvvvvvvvvvvkvkvvvkvvvkvvvkvvvkvvvkvvvkM",
  "kVvlVVvlVVvlVVvlVVvlVVvlVVvkVVVVvvvvvvvvvvvvkowsvSsOkvvvvvvvvvvvvvvvkvkvvvkvvvkvvvkvvvkvvvkvvvkk",
  "VVvlVVvlVVvlVVvlVVvlVVvlVVvkVVVVvvvvvvvvvvvvkvvovOvvkvvvvvvvvvvvvvvvkvkvvvkvvvkvvvkvvvkvvvkvvvkv",
  "VVvlVVvlVVvlVVvlVVvlVVvlVVvkVVVvvvvvvvvvvvvvkvvOyovvkvvvvvvvvvvvvvvvkvkvvvkvvvkvvvkvvvkvvvkvvvkv",
  "VVvlVVvlVVvlVVvlVVvlVVvlVVvkVVVvvvvvvvvvvvvvkvOvvvovkvvvvvvvvvvvvvvvkvkvvvkvvvkvvvkvvvkvvvkvvvkv",
  "VVvVVVvVVVvVVVvVVVvVVVvVVVvkVVVvvvvvvvvvvvvvkovvvvvOkvvvvvvvvvvvvvvvkvkvvvkvvvkvvvkvvvkvvvkvvvkv",
  "VVvVVVvVVVvVVVvVVVvVVVvVVVkVVVvvvvvvvvvvvvvvkvvovOvvkvvvvvvvvvvvvvvvvkkvvvkvvvkvvvkvvvkvvvkvvvkv",
  "VVvVVVvVVVvVVVvVVVvVVVvVVVkVVVvvvvvvvvvvvvvvkvvOyovvkvvvvvvvvvvvvvvvvkkvvvkvvvkvvvkvvvkvvvkvvvkv",
  "VVvVVVvVVVvVVVvVVVvVVVvVVVkVVVvvvvvvvvvvvvvvkvOvvvovkvvvvvvvvvvvvvvvvkkvvvkvvvkvvvkvvvkvvvkvvvkv",
  "kVvVVVvVVVvVVVvVVVvVVVvVVkVVVVvvvvvvvvvvvvvvkovvvvvOkvvvvvvvvvvvvvvvvvkvvvkvvvkvvvkvvvkvvvkvvvkk",
  "VkvVVVvVVVvVVVvVVVvVVVvVkVVVVvvvvvvvvvvvvvvvkvvovOvvkvvvvvvvvvvvvvvvvvvkvvkvvvkvvvkvvvkvvvkvvvkv",
  "VkvVVVvVVVvVVVvVVVvVVVvVkVVVVvvvvvvvvvvvvvvvkvvOyovvkvvvvvvvvvvvvvvvvvvkvvkvvvkvvvkvvvkvvvkvvvkv",
];

const FANTASMA_CALMA = [
  "..............kkkkkk..............",
  ".............kVwwVVVk.............",
  "............klwwlllVVk............",
  "...........klwwllllVVVk...........",
  "..........kllwwllllllVVk..........",
  "..........kllVwwVVVVVllk..........",
  "..........kVVllwwllVVvvk..........",
  "..........klllwwlllVVVVk..........",
  "....k.....kllwwllllllVVk.....k....",
  "....k.....klwwVVVVVVVllk.....k....",
  "....kk....kVwwlllllVVvvk....kk....",
  "....klk.k.kllwwllllVVVVk.k.kVk....",
  "..k.klkkkkllllwwlllllVVVkkkkVk.k..",
  "...klllklllllVVVVVVVVllVVVkVVVk...",
  "...kllkllllVVllllllVVvvllVVkVVk...",
  "...kllkllllkkkkkkkkkkkkVVVVkVVk...",
  "....klklllkwwwwwwwwsssskVVVkVk....",
  "....klklllkwwwwwwwwsssskVVVkVk....",
  "....klklllkwwwwwwwwsssskVVVkVk....",
  "....klklllkwwwwwwwwsssskVVVkVk....",
  ".....kkklkwwwkkkwwwkkksskVkkk.....",
  ".....kkkkkwwwwkkwwwskksskkkkk.....",
  ".....kkkwwwwwwwwwwwsssssSSkkk.....",
  "......kwwwwwwwwwwwwsssssSSSk......",
  "......kwwwwwwwwwwwwsssssSSSk......",
  "......kwwwwwwwwkwwwkssssSSSk......",
  "......kwwwwwwwwwkkksssssSSSk......",
  ".....kwwwwwwwwwwwwwsssssSSSSk.....",
  ".....kwwwwwwwwwwwwwsssssSSSSk.....",
  ".....kwwwwwwwwwwwwwsssssSSSSk.....",
  ".....kwwwwkkkkkkkkkkkkkkSSSSk.....",
  ".....kwwwkwwwwwkkssssssSkSSSk.....",
  "....kwwwwkwwwwwwkksssSSSkSSSSk....",
  "....kwwwwwkkkkkkkkkkkkkkSSSSSk....",
  "....kwwwwwwswwwwwwwssssSSSSSSk....",
  "....kwwwwwwswwwwwwwssssSSSSSSk....",
  "...kwwwwwwswwwwwwwwsssssSSSSSSk...",
  "...kwwwwwwswwwwwwwwsssssSSSSSSk...",
  "...kwwwwwwswwwwwwwwsssssSSSSSSk...",
  "...kwwkwwwswwwkwwwwsssksSSSSSSk...",
  "...kwk.kwwswwk.kwwwssk.kSSSSSk....",
  "..kwk...kwswk...kwwsk...kSSSk.....",
  "..kwk...kswwk...kwwsk...kSSSk.....",
  "..kk.....kwk.....kwk.....kSk......",
  "..k.......k.......k.......k.......",
  "..................................",
  "..................................",
  "..................................",
];

const FANTASMA_ATTENTA = [
  "..............kkkkkk..............",
  ".............kVwwVVVk.............",
  "............klwwlllVVk............",
  "...........klwwllllVVVk...........",
  "..........kllwwllllllVVk..........",
  "..........kllVwwVVVVVllk..........",
  "..........kVVllwwllVVvvk..........",
  "..........klllwwlllVVVVk..........",
  "....k.....kllwwllllllVVk.....k....",
  "....k.....klwwVVVVVVVllk.....k....",
  "....kk....kVwwlllllVVvvk....kk....",
  "....klk.k.kllwwllllVVVVk.k.kVk....",
  "..k.klkkkkllllwwlllllVVVkkkkVk.k..",
  "...klllklllllVVVVVVVVllVVVkVVVk...",
  "...kllkllllVVllllllVVvvllVVkVVk...",
  "...kllkllllkkkkkkkkkkkkVVVVkVVk...",
  "....klklllkwwwwwwwwsssskVVVkVk....",
  "....klklllkwwkwwwwwsskskVVVkVk....",
  "....klklllkwwwkkwwwkksskVVVkVk....",
  "....klklllkwwkkkwwwkkkskVVVkVk....",
  ".....kkklkwwwkwkwwwkwksskVkkk.....",
  ".....kkkkkwwwkkkwwwkkksskkkkk.....",
  ".....kkkwwwwwwwwwwwsssssSSkkk.....",
  "......kwwwwwwwwwwwwsssssSSSk......",
  "......kwwwwwwwwwwwwsssssSSSk......",
  "......kwwwwwwwwwwkwsssssSSSk......",
  "......kwwwwwwwwwkwksssssSSSk......",
  ".....kwwwwwwwwwwwkwsssssSSSSk.....",
  ".....kwwwwwwwwwwwwwsssssSSSSk.....",
  ".....kwwwwwwwwwwwwwsssssSSSSk.....",
  ".....kwwwwkkkkkkkkkkkkkkSSSSk.....",
  ".....kwwwkwwwwwkkssssssSkSSSk.....",
  "....kwwwwkwwwwwwkksssSSSkSSSSk....",
  "....kwwwwwkkkkkkkkkkkkkkSSSSSk....",
  "....kwwwwwwswwwwwwwssssSSSSSSk....",
  "....kwwwwwwswwwwwwwssssSSSSSSk....",
  "...kwwwwwwswwwwwwwwsssssSSSSSSk...",
  "...kwwwwwwswwwwwwwwsssssSSSSSSk...",
  "...kwwwwwwswwwwwwwwsssssSSSSSSk...",
  "...kwwkwwwswwwkwwwwsssksSSSSSSk...",
  "...kwk.kwwswwk.kwwwssk.kSSSSSk....",
  "..kwk...kwswk...kwwsk...kSSSk.....",
  "..kwk...kswwk...kwwsk...kSSSk.....",
  "..kk.....kwk.....kwk.....kSk......",
  "..k.......k.......k.......k.......",
  "..................................",
  "..................................",
  "..................................",
];

const FANTASMA_FURIOSA = [
  "..............kkkkkk..............",
  ".............kVwwVVVk.............",
  "............klwwlllVVk............",
  "...........klwwllllVVVk...........",
  "..........kllwwllllllVVk..........",
  "..........kllVwwVVVVVllk..........",
  "..........kVVllwwllVVvvk..........",
  "..........klllwwlllVVVVk..........",
  "....k.....kllwwllllllVVk.....k....",
  "....k.....klwwVVVVVVVllk.....k....",
  "....kk....kVwwlllllVVvvk....kk....",
  "....klk.k.kllwwllllVVVVk.k.kVk....",
  "..k.klkkkkllllwwlllllVVVkkkkVk.k..",
  "...klllklllllVVVVVVVVllVVVkVVVk...",
  "...kllkllllVVllllllVVvvllVVkVVk...",
  "...kllkllllkkkkkkkkkkkkVVVVkVVk...",
  "....klklllkwwwwwwwwsssskVVVkVk....",
  "....klklllkwwkkwwwwskkskVVVkVk....",
  "....klklllkwwwkkwwwkksskVVVkVk....",
  "....klklllkwwkrkwwwkrkskVVVkVk....",
  "...kkkkklkwwwkrkwwwkrksskVkkkkk...",
  "...kwwkkkkwwwwwwwwwssssskkkkwwk...",
  "...kwskkwwwwwwwwwwwsssssSSkkwsk...",
  "...kkkkwwwwwwwwwwwwsssssSSSkkkk...",
  "....kkkwwwwwwwkkkkkkssssSSSkkk....",
  "....kkkwwwwwwwkwkkwkssssSSSkkk....",
  "......kwwwwwwwkrrrrkssssSSSk......",
  ".....kwwwwwwwwkkkkkkssssSSSSk.....",
  ".....kwwwwwwwwwwwwwsssssSSSSk.....",
  ".....kwwwwwwwwwwwwwsssssSSSSk.....",
  ".....kwwwwwswwwwwwwssssSSSSSk.....",
  ".....kwwwwwswwwwwwwssssSSSSSk.....",
  "....kwwwwwwswwwwwwwssssSSSSSSk....",
  "....kwwwwwwswwwwwwwssssSSSSSSk....",
  "....kwwwwwwswwwwwwwssssSSSSSSk....",
  "....kwwwwwwswwwwwwwssssSSSSSSk....",
  "...kwwwwwwswwwwwwwwsssssSSSSSSk...",
  "...kwwwwwwswwwwwwwwsssssSSSSSSk...",
  "...kwwwwwwswwwwwwwwsssssSSSSSSk...",
  "...kwwkwwwswwwkwwwwsssksSSSSSSk...",
  "...kwk.kwwswwk.kwwwssk.kSSSSSk....",
  "..kwk...kwswk...kwwsk...kSSSk.....",
  "..kwk...kswwk...kwwsk...kSSSk.....",
  "..kk.....kwk.....kwk.....kSk......",
  "..k.......k.......k.......k.......",
  "..................................",
  "..................................",
  "..................................",
];

const FANTASMA_CONTENTA = [
  "..............kkkkkk..............",
  ".............kVwwVVVk.............",
  "............klwwlllVVk............",
  "...........klwwllllVVVk...........",
  "..........kllwwllllllVVk..........",
  "..........kllVwwVVVVVllk..........",
  "..........kVVllwwllVVvvk..........",
  "..........klllwwlllVVVVk..........",
  "....k.....kllwwllllllVVk.....k....",
  "....k.....klwwVVVVVVVllk.....k....",
  "....kk....kVwwlllllVVvvk....kk....",
  "....klk.k.kllwwllllVVVVk.k.kVk....",
  "..k.klkkkkllllwwlllllVVVkkkkVk.k..",
  "...klllklllllVVVVVVVVllVVVkVVVk...",
  "...kllkllllVVllllllVVvvllVVkVVk...",
  "...kllkllllkkkkkkkkkkkkVVVVkVVk...",
  "....klklllkwwwwwwwwsssskVVVkVk....",
  "....klklllkwwwwwwwwsssskVVVkVk....",
  "....klklllkwwwwwwwwsssskVVVkVk....",
  "....klklllkwwwkwwwwsksskVVVkVk....",
  ".....kkklkwwwkwkwwwksksskVkkk.....",
  ".....kkkkkwwwwwwwwwssssskkkkk.....",
  ".....kkkwwwppwwwwwwsssppSSkkk.....",
  "......kwwwwwwwwwwwwsssssSSSk......",
  "......kwwwwwwwwkwwwkssssSSSk......",
  "......kwwwwwwwwwkkksssssSSSk......",
  "......kwwwwwwwwwwwwsssssSSSk......",
  ".....kwwwwwwwwwwwwwsssssSSSSk.....",
  ".....kwwwwwwwwwwwwwsssssSSSSk.....",
  ".....kwwwwwwwwwwwwwsssssSSSSk.....",
  ".....kwwwwkkkkkkkkkkkkkkSSSSk.....",
  ".....kwwwkwwwwwkkssssssSkSSSk.....",
  "....kwwwwkwwwwwwkksssSSSkSSSSk....",
  "....kwwwwwkkkkkkkkkkkkkkSSSSSk....",
  "....kwwwwwwswwwwwwwssssSSSSSSk....",
  "....kwwwwwwswwwwwwwssssSSSSSSk....",
  "...kwwwwwwswwwwwwwwsssssSSSSSSk...",
  "...kwwwwwwswwwwwwwwsssssSSSSSSk...",
  "...kwwwwwwswwwwwwwwsssssSSSSSSk...",
  "...kwwkwwwswwwkwwwwsssksSSSSSSk...",
  "...kwk.kwwswwk.kwwwssk.kSSSSSk....",
  "..kwk...kwswk...kwwsk...kSSSk.....",
  "..kwk...kswwk...kwwsk...kSSSk.....",
  "..kk.....kwk.....kwk.....kSk......",
  "..k.......k.......k.......k.......",
  "..................................",
  "..................................",
  "..................................",
];

// Le onde dell'orlo: righe da 39 a 47 (comprese), una versione per fase 0..3.

const CODA_FANTASMA = [
  [
    "...kwwkwwwswwwkwwwwsssksSSSSSSk...",
    "...kwk.kwwswwk.kwwwssk.kSSSSSk....",
    "..kwk...kwswk...kwwsk...kSSSk.....",
    "..kwk...kswwk...kwwsk...kSSSk.....",
    "..kk.....kwk.....kwk.....kSk......",
    "..k.......k.......k.......k.......",
    "..................................",
    "..................................",
    "..................................",
  ],
  [
    "...kkwwwwwswkwwwwwwsksssSSSSkSk...",
    "...k.kwwwwsk.kwwwwwk.kssSSSk.kk...",
    "..k...kwwwk...kwwwk...ksSSk...kk..",
    "..k...kwwsk...kwwwk...ksSSk...kk..",
    ".......kwk.....kwk.....kSk.....k..",
    "........k.......k.......k.........",
    "..................................",
    "..................................",
    "..................................",
  ],
  [
    "...kwwwwwwkwwwwwwwksssssSSkSSSk...",
    "...kwwwwwk.kwwwwwk.kssssSk.kSSk...",
    "....kwwwk...kwwwk...ksssk...kSSk..",
    "....kwwwk...kwwwk...ksssk...kSSk..",
    ".....kwk.....kwk.....ksk.....kSk..",
    "......k.......k.......k.......k...",
    "..................................",
    "..................................",
    "..................................",
  ],
  [
    "...kwwwwkwswwwwwkwwssssskSSSSSk...",
    "...kwwwk.kswwwwk.kwssssk.kSSSSk...",
    "..kwwwk...kwwwk...ksssk...kSSSk...",
    "..kwwwk...kwwwk...ksssk...kSSSk...",
    "...kwk.....kwk.....ksk.....kSk....",
    "....k.......k.......k.......k.....",
    "..................................",
    "..................................",
    "..................................",
  ],
];

const ROSETTA = [
  "..kkkkk..",
  ".kyyooOk.",
  "kyykkkoOk",
  "kykqrrkOk",
  "kokrrRkOk",
  "kokrRRkhk",
  "kOOkkkhhk",
  ".kOOhhhk.",
  "..kkkkk..",
];

const STEMMA = [
  "k........k.k........k",
  "kk.......kkk.......kk",
  "kyk....kkoookk....kOk",
  "kyok..koyoooOOk..kOOk",
  "kyookkoyororoOOkkoOOk",
  "kyooooooyoooOOOOOOOhk",
  ".kyoooooooOOOOOOOOhk.",
  "..kyookkoooOOOkkOhk..",
  "...kok..kkoOkk..khk..",
  "....k.....kkk....k...",
];

const CAMPANELLO = [
  "....kk....",
  "....ko....",
  "..kkkkkk..",
  ".kyyoooOk.",
  "kyoooooOOk",
  "koooooOOOk",
  "kkkkkkkkkk",
  "kOOOOOOhhk",
  "kkkkkkkkkk",
];

const CANDELABRO = [
  "...................",
  "...................",
  "...................",
  "...................",
  ".......k...........",
  "......kwk..........",
  "..k...kws...k......",
  ".kwk..kws..kwk.....",
  ".kws..kws..kws.....",
  ".kws..kws..kws.....",
  ".kws..kws..kws.....",
  "kkkkkkkkkkkkkkk....",
  "kyoOkkyoOkkyoOk....",
  ".kok..kok..kok.....",
  ".kok..kok..kok.....",
  ".koOkkkokkkOOk.....",
  "..kooooooOOOk......",
  "...kkkkoOkkk.......",
  "......kok..........",
  "......kok..........",
  "......kok..........",
  ".....kyoOk.........",
  "....kyooOOk........",
  "...kkkkkkkkk.......",
];

const FIAMMELLE = [
  ["..F..", ".fFf.", ".fyf.", "..f.."],
  [".F...", ".fF..", ".fyf.", "..f.."],
  ["...F.", "..Ff.", ".fyf.", "..f.."],
];

const LIBRO = [
  "..kkkkkkkk.kkkkkkkk..",
  ".kwwwwwwwwkwwwwwwwsk.",
  ".kwSSwSSwwkwSSSwSSsk.",
  ".kwwwwwwwwkwwwwwwwsk.",
  ".kwSSSwSSwkwSSwSSSsk.",
  "kkkkkkkkkkkkkkkkkkkkk",
  "kRRRRRRRRRkRRRRRRRRRk",
  ".kkkkkkkkkkkkkkkkkkk.",
];

const PENNA = [
  "....kk",
  "...kwk",
  "..kwsk",
  ".kwsk.",
  ".kSk..",
  "kkkk..",
  "kDDk..",
  "kkkk..",
];

const SCINTILLA = [
  "..y..",
  "..w..",
  "ywwwy",
  "..w..",
  "..y..",
];

  // Le facce del fantasma: 3 + contenta, ognuna con le 4 fasi dell'orlo (righe da 39 a 47).
  function facce(base) {
    return [0, 1, 2, 3].map((f) => base.slice(0, 39).concat(CODA_FANTASMA[f]));
  }
  const FANTASMI = {
    calma: facce(FANTASMA_CALMA),
    attenta: facce(FANTASMA_ATTENTA),
    furiosa: facce(FANTASMA_FURIOSA),
    contenta: facce(FANTASMA_CONTENTA),
  };

  const SCINTILLE = [[95, 18], [218, 30], [96, 98], [218, 106], [124, 126], [192, 126]];

  function nuovaTelaFuori(w, h) {
    const t = document.createElement("canvas");
    t.width = w;
    t.height = h;
    const c = t.getContext("2d");
    c.imageSmoothingEnabled = false;
    return { t, c };
  }

  const opzioni = {
    id: "ritratto-in-pezzi",
    sfondo: "ingresso",
    velo: 0.5,
    variante(rng) {
      const dist = new Map([[FINE, 0]]);
      const coda = [FINE];
      for (let i = 0; i < coda.length; i++) {
        const s = coda[i], z = s.indexOf("0"), d = dist.get(s) + 1;
        for (const q of VICINI[z]) {
          const a = s.split(""); a[z] = a[q]; a[q] = "0";
          const u = a.join("");
          if (!dist.has(u)) { dist.set(u, d); coda.push(u); }
        }
      }
      const pozzo = [];
      for (const [s, d] of dist) if (d >= 22 && d <= 26) pozzo.push(s);
      pozzo.sort();
      const prima = pozzo[Math.floor(rng() * pozzo.length)];
      const minimo = dist.get(prima);
      const stessi = pozzo.filter((s) => dist.get(s) === minimo);
      const partenze = [prima];
      while (partenze.length < 8) {
        const s = stessi[Math.floor(rng() * stessi.length)];
        if (!partenze.includes(s)) partenze.push(s);
      }
      return { minimo, limite: minimo + 6, partenze };
    },
    crea(g) {
      const v = g.variante;
      fot = () => Math.max(0, g.fotogramma | 0);
      opzioni.testo =
        "Sopra il bancone dell'ingresso il ritratto della padrona di casa, Donna Ottavia, è tagliato in nove quadrati, e uno manca. " +
        "Fai scorrere i pezzi nel buco finché il ritratto torna intero.\n" +
        `Il suo fantasma ti concede ${v.limite} mosse: se finiscono prima che il ritratto sia intero, si arrabbia e lo rimescola tutto.`;

      // ── Tele fuori scena: il ritratto intero e il buco ──
      const rit = nuovaTelaFuori(96, 96);
      sprite(rit.c, RITRATTO, COLORI, 0, 0);
      const buco = nuovaTelaFuori(LATO, LATO);
      rett(buco.c, C.bordo, 0, 0, LATO, LATO);
      rett(buco.c, C.nero, 0, 0, LATO, 2);
      rett(buco.c, C.nero, 0, 0, 2, LATO);
      for (let j = 2; j < LATO; j++) {
        for (let i = 2; i < LATO; i++) {
          if ((i + j) % 4 === 0 && Math.floor(j / 2) % 2 === 0) rett(buco.c, C.muro, i, j, 1, 1);
        }
      }

      // ── Stato ──
      let st = { tessere: v.partenze[0], mosse: 0, giro: 0 };
      const m = g.memoria || {};
      if (
        permutazione(m.tessere) && risolvibile(m.tessere) && m.tessere !== FINE &&
        Number.isInteger(m.mosse) && m.mosse >= 0 && m.mosse <= v.limite - 1 &&
        Number.isInteger(m.giro) && m.giro >= 0
      ) st = { tessere: m.tessere, mosse: m.mosse, giro: m.giro };
      let risolto = false;
      if (g.giaRisolto) {
        st = { tessere: FINE, mosse: Number.isInteger(m.mosse) ? m.mosse : 0, giro: Number.isInteger(m.giro) ? m.giro : 0 };
        risolto = true;
      }
      const salva = () => { Object.assign(g.memoria, { tessere: st.tessere, mosse: st.mosse, giro: st.giro }); g.salvaMemoria(); };

      // ── Animazioni ──
      let scorri = null;        // { pezzo, da, a, t0 }
      let tremolio = null;      // { cella, t0 }
      let lampo = -1e9;         // istante dell'ultima mossa valida
      let err = null;           // { t0, vecchia }
      let furia = -1e9;         // istante dell'ultimo errore (fantasma furioso)
      let bloccoFine = 0;       // fino a quando i tocchi sono ignorati
      let vittoria = null;      // { t0, scorri }
      let sbirciataFine = 0;
      let sbirciataAttiva = false;
      let ultimoMsg = null;
      let sopra = -1;           // casella sotto il mouse

      const msg = (t) => { ultimoMsg = t; g.messaggio(t); };
      function chiudiSbirciata() {
        if (!sbirciataAttiva) return;
        sbirciataAttiva = false;
        sbirciataFine = 0;
        g.messaggio(ultimoMsg);
      }
      function controllaSbirciata() {
        if (sbirciataAttiva && adesso() >= sbirciataFine) chiudiSbirciata();
      }

      const restano = () => v.limite - st.mosse;
      function messaggioStato() {
        const r = restano();
        if (st.mosse === 0) return "Tocca un pezzo accanto al buco per farlo scorrere.";
        return r === 1 ? "Resta una sola mossa!" : `Restano ${r} mosse.`;
      }

      /** La mossa vera: usata da tocchi, tastiera e gioca(). */
      function toccaCasella(c) {
        chiudiSbirciata();
        if (risolto) return { valida: false, motivo: "risolto" };
        const r = mossa(st, c, v);
        const e = r.esito;
        const ora = adesso();
        if (e.valida === false) {
          if (e.motivo === "lontano") {
            tremolio = { cella: c, t0: ora };
            g.messaggio("Quel pezzo non tocca il buco: non può scorrere.");
          } else if (e.motivo === "buco") {
            g.messaggio("Quello è il buco: tocca un pezzo lì accanto.");
          }
          return e;
        }
        // mossa valida (o che chiude la partita): l'animazione vecchia salta alla fine
        err = null;
        tremolio = null;
        scorri = g.riduciMovimento ? null : { pezzo: r.pezzo, da: r.da, a: r.a, t0: ora };
        lampo = ora;
        if (e.errore) {
          err = { t0: ora, vecchia: r.dopoMossa };
          furia = ora;
          bloccoFine = ora + 950;
          st = r.stato;
          salva();
          g.errore("Mosse finite: la padrona si è arrabbiata");
          msg(`Ritratto rimescolato! Hai di nuovo ${v.limite} mosse.`);
          return e;
        }
        st = r.stato;
        salva();
        if (e.risolto) {
          risolto = true;
          vittoria = { t0: ora, scorri };
          msg("Il ritratto è di nuovo intero!");
          g.risolto({
            riepilogo: `Ritratto ricomposto in ${st.mosse} mosse su ${v.limite}. Il minimo possibile era ${v.minimo}.`,
            ritardo: 1600,
          });
          return e;
        }
        const rr = e.restano;
        if (rr > 5) msg(null);
        else if (rr === 5) msg("Il fantasma ti guarda storto: restano 5 mosse.");
        else if (rr >= 2) msg(`Restano ${rr} mosse.`);
        else msg("Resta una sola mossa!");
        return e;
      }

      // ── Tocchi, tastiera, bottone ──
      const cellaDa = (x, y) => {
        if (x < TX || x >= TX + 96 || y < TY || y >= TY + 96) return -1;
        return Math.floor((x - TX) / LATO) + 3 * Math.floor((y - TY) / LATO);
      };
      g.tocca(({ tipo, x, y, premuto, evento }) => {
        if (tipo === "giu") {
          if (sbirciataAttiva) { chiudiSbirciata(); return; }
          if (adesso() < bloccoFine) return;
          const c = cellaDa(x, y);
          if (c >= 0) toccaCasella(c);
        } else if (tipo === "muovi" && !premuto) {
          sopra = evento && evento.pointerType && evento.pointerType !== "mouse" ? -1 : cellaDa(x, y);
        }
      });
      window.addEventListener("keydown", (e) => {
        if (risolto || adesso() < bloccoFine) return;
        const z = st.tessere.indexOf("0");
        let c = -1;
        if (e.key === "ArrowUp" && z < 6) c = z + 3;
        else if (e.key === "ArrowDown" && z >= 3) c = z - 3;
        else if (e.key === "ArrowLeft" && z % 3 < 2) c = z + 1;
        else if (e.key === "ArrowRight" && z % 3 > 0) c = z - 1;
        if (c >= 0) { e.preventDefault(); toccaCasella(c); }
      });
      g.bottone("Sbircia", () => {
        sbirciataFine = adesso() + 1500;
        sbirciataAttiva = true;
        g.messaggio("Ecco il ritratto com'era. Guardalo bene!");
      }, { id: "sbircia" });

      if (g.giaRisolto) msg("Donna Ottavia è di nuovo tutta intera.");
      else msg(messaggioStato());

      // ── Disegno ──
      function pezzo(ctx, n, x, y, colore) {
        const k = n - 1;
        ctx.drawImage(rit.t, (k % 3) * LATO, Math.floor(k / 3) * LATO, LATO, LATO, x, y, LATO, LATO);
        rett(ctx, colore, x, y, LATO, 1);
        rett(ctx, colore, x, y + LATO - 1, LATO, 1);
        rett(ctx, colore, x, y, 1, LATO);
        rett(ctx, colore, x + LATO - 1, y, 1, LATO);
      }
      const foro = (ctx, x, y) => ctx.drawImage(buco.t, x, y);

      function tavola(ctx, ora) {
        const ridotto = g.riduciMovimento;
        // vittoria
        if (risolto && vittoria === null) { ctx.drawImage(rit.t, TX, TY); return; }
        if (vittoria) {
          const t = ora - vittoria.t0;
          if (ridotto || t >= 450) { ctx.drawImage(rit.t, TX, TY); return; }
        }
        // sbirciata
        const sbirc = sbirciataAttiva;
        let tess = st.tessere;
        let colore = C.bordo;
        let volo = null;
        let sc = scorri && ora - scorri.t0 < 160 ? scorri : null;
        if (sbirc) { tess = FINE; sc = null; }
        else if (err) {
          const t = ora - err.t0;
          if (ridotto) {
            if (t < 600) colore = C.tappetoChiaro;
            else if (t >= 950) err = null;
          } else if (t < 600) { tess = err.vecchia; colore = C.tappetoChiaro; }
          else if (t < 950) volo = dolce((t - 600) / 350);
          else err = null;
        }
        if (vittoria && !sbirc) {
          const t = ora - vittoria.t0;
          sc = vittoria.scorri && t < 160 ? vittoria.scorri : null;
        }
        if (volo !== null) {
          for (let i = 0; i < 9; i++) foro(ctx, cx(i), cy(i));
          for (let n = 1; n <= 8; n++) {
            const a = err.vecchia.indexOf(String(n));
            const b = st.tessere.indexOf(String(n));
            const x = Math.round(cx(a) + (cx(b) - cx(a)) * volo);
            const y = Math.round(cy(a) + (cy(b) - cy(a)) * volo);
            pezzo(ctx, n, x, y, C.bordo);
          }
          return;
        }
        const z = tess.indexOf("0");
        for (let i = 0; i < 9; i++) {
          const n = Number(tess[i]);
          if (n === 0 || (sc && i === sc.a)) { foro(ctx, cx(i), cy(i)); continue; }
          let col = colore;
          let dx = 0;
          if (!sbirc && tremolio && tremolio.cella === i) {
            const t = ora - tremolio.t0;
            if (ridotto) { if (t < 250) col = C.ferroChiaro; }
            else if (t < 240) dx = [1, -1, 1, 0][Math.floor(t / 60)];
          } else if (!sbirc && !err && sopra === i && !risolto && VICINI[z].includes(i)) col = C.oro;
          pezzo(ctx, n, cx(i) + dx, cy(i), col);
        }
        if (sc) {
          const p = ease((ora - sc.t0) / 160);
          const x = Math.round(cx(sc.da) + (cx(sc.a) - cx(sc.da)) * p);
          const y = Math.round(cy(sc.da) + (cy(sc.a) - cy(sc.da)) * p);
          pezzo(ctx, Number(sc.pezzo), x, y, colore);
        }
        if (vittoria && !ridotto) {
          const t = ora - vittoria.t0;
          if (t >= 200 && t < 450) rett(ctx, C.bianco, cx(8), cy(8), LATO, LATO);
        }
      }

      function fantasma(ctx, ora) {
        let faccia = "calma";
        let dx = 0;
        const ridotto = g.riduciMovimento;
        if (risolto) faccia = "contenta";
        else if (ora - furia < 1400) { faccia = "furiosa"; if (!ridotto) dx = fot() % 2 === 0 ? 1 : -1; }
        else if (restano() <= 5) faccia = "attenta";
        const fase = ridotto ? 0 : fot() % 4;
        const bob = ridotto ? 0 : [0, -1, -2, -2, -1, 0, 1, 1][fot() % 8];
        sprite(ctx, FANTASMI[faccia][fase], COLORI, 52 + dx, 76 + bob);
      }

      g.anima(() => {
        const ctx = g.ctx;
        const ora = adesso();
        controllaSbirciata();
        ctx.clearRect(0, 0, g.larghezza, g.altezza);
        const ridotto = g.riduciMovimento;
        // bancone e oggetti sul piano
        bancone(ctx);
        sprite(ctx, CAMPANELLO, COLORI, 34, 130);
        sprite(ctx, LIBRO, COLORI, 214, 131);
        sprite(ctx, PENNA, COLORI, 236, 131);
        sprite(ctx, CANDELABRO, COLORI, 268, 115);
        [[0, 2], [5, 0], [10, 2]].forEach(([ox, oy], i) => {
          const f = ridotto ? i % 3 : (fot() + i) % 3;
          sprite(ctx, FIAMMELLE[f], COLORI, 268 + ox, 115 + oy);
        });
        // cornice
        let accesa = false;
        if (vittoria) {
          const t = ora - vittoria.t0;
          accesa = ridotto ? t < 600 : t >= 450 && t < 1050;
        }
        cornice(ctx, accesa, sbirciataAttiva);
        tavola(ctx, ora);
        targa(ctx);
        cartello(ctx, { mosse: st.mosse, limite: v.limite, risolto, lampo: ora - lampo < 120 });
        fantasma(ctx, ora);
        if (vittoria && !ridotto) {
          const t = ora - vittoria.t0;
          if (t >= 450 && t < 2050) {
            SCINTILLE.forEach(([x, y], i) => {
              if ((fot() + i) % 4 < 2) sprite(ctx, SCINTILLA, COLORI, x, y);
            });
          }
        }
      });

      // ── Aggancio per le prove ──
      g.espone({
        gioca: (mo) => toccaCasella(mo && mo.casella),
        statoGioco: () => {
          controllaSbirciata();
          return {
            tessere: st.tessere, buco: st.tessere.indexOf("0"), mosse: st.mosse, limite: v.limite, minimo: v.minimo,
            giro: st.giro, restano: restano(), risolto, sbirciata: sbirciataAttiva,
          };
        },
        posizione: (i) => ({ x: cx(i) + 16, y: cy(i) + 16 }),
      });
    },
  };
  EscapeDemo.avvia(opzioni);
})();
