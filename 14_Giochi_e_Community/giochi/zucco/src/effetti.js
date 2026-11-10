// Effetti con pixelfx: ogni livello è un frame 320x180 composto su un canvas trasparente, poi disegnato sulla scena.
// Sono solo grafica: non toccano sim.js, così la partita resta identica quando il server la rigioca.

import { clearFrame, composite, createFrame, createFx, fit, luma, painterFor } from "pixelfx";
import * as manaBurst from "pixelfx/fx/arcane/mana-burst";
import * as bat from "pixelfx/fx/critters/bat";
import * as eyeball from "pixelfx/fx/critters/eyeball";
import * as flyingSkull from "pixelfx/fx/critters/flying-skull";
import * as cartoonPow from "pixelfx/fx/explosions/cartoon-pow";
import * as smallExplosion from "pixelfx/fx/explosions/small-explosion";
import * as bluntHit from "pixelfx/fx/impacts/blunt-hit";
import * as groundSlam from "pixelfx/fx/impacts/ground-slam";
import * as hitSpark from "pixelfx/fx/impacts/hit-spark";
import * as darkExplosion from "pixelfx/fx/shadow/dark-explosion";
import * as summonRise from "pixelfx/fx/spawn/summon-rise";
import * as haste from "pixelfx/fx/status/haste";
import * as confetti from "pixelfx/fx/ui/confetti";
import * as fog from "pixelfx/fx/weather/fog";
import * as shootingStars from "pixelfx/fx/weather/shooting-stars";
import { forzaTerremoto } from "./boss.js";
import { ALTEZZA, LARGHEZZA, SUOLO, X_ZUCCO } from "./sim.js";

const AZZURRO = ["#04122a", "#0a2a5e", "#1450a0", "#2a8cff", "#5cb0ff", "#8fd0ff", "#d0ecff", "#ffffff"];
const SANGUE = ["#1c0408", "#3a0a12", "#6a1020", "#a01a2c", "#d02a3a", "#ff5e5e", "#ffb0a0", "#ffffff"];
const ORO = ["#3a1a08", "#7a3a10", "#c8701a", "#f5a72e", "#ffd24a", "#ffe98a", "#fff6c8", "#ffffff"];
const ZUCCHERO = ["#3a0a2a", "#7a1a52", "#c02a68", "#ff6fa8", "#ffb2cf", "#ffe45e", "#fff6c8", "#ffffff"];

// `mondo`: l'effetto resta attaccato al terreno e scorre via con lui. Per l'esplosione è la regola: dopo un
// colpo si gioca ancora, e deve scivolare dietro Zucco senza coprire quello che arriva.
const LAMPI = {
  // `aim` e non `angle`: le scintille partono verso l'alto ma la gravità resta in basso.
  caramella: { modulo: hitSpark, ritmo: 1, mondo: true, opzioni: { palette: ZUCCHERO, aim: -Math.PI / 2, height: 0 } },
  rotto: { modulo: bluntHit, ritmo: 1, mondo: true },
  urto: { modulo: smallExplosion, ritmo: 1.5, mondo: true },
  botta: { modulo: bluntHit, ritmo: 1.2, mondo: false },
  ko: { modulo: cartoonPow, ritmo: 1, mondo: false, opzioni: { text: "AHI!" } },
  luna: { modulo: manaBurst, ritmo: 1, mondo: false, opzioni: { palette: ORO } },
  mazzata: { modulo: hitSpark, ritmo: 1, mondo: false, opzioni: { palette: ORO, height: 0 } },
  fuoricampo: { modulo: hitSpark, ritmo: 1, mondo: false, opzioni: { palette: ORO, height: 0, aim: -1 } },
  // Il boss ribatte: le scintille sono le sue, rosse, e partono verso Zucco.
  ribatte: { modulo: hitSpark, ritmo: 1, mondo: false, opzioni: { palette: SANGUE, height: 0, aim: Math.PI } },
  bossAtterra: { modulo: groundSlam, ritmo: 1.5, mondo: false },
  bossColpito: { modulo: smallExplosion, ritmo: 1.6, mondo: false },
  bossMuore: { modulo: darkExplosion, ritmo: 1.2, mondo: false },
  bossCura: { modulo: manaBurst, ritmo: 1.4, mondo: false, opzioni: { palette: SANGUE } },
  angeloAzzurro: { modulo: manaBurst, ritmo: 1.2, mondo: false, opzioni: { palette: AZZURRO } },
  vitaPresa: { modulo: manaBurst, ritmo: 1.6, mondo: false, opzioni: { palette: ORO } },
  evviva: { modulo: confetti, ritmo: 1, mondo: false },
};

// L'evocazione dura 4,6 s ma un ostacolo attraversa lo schermo in poco più di uno: il suo tempo segue la partita.
// Il cerchio di rune riempie l'attesa, poi il demone si alza quando lo dice sim.js.
const T_ROTTURA = 1.05;
const T_IN_PIEDI = 2.12;
const DEMONE = {
  body: ["#1c0a18", "#3a1228", "#5e1c38", "#86284a", "#b03c60"],
  horn: ["#2a1a22", "#4a3440", "#6e5660", "#9a8088", "#d0bcc0"],
};

const FUORI_SCHERMO = -170;

// I mostri che volano nell'orda, alle spalle di Zucco. `x` e `y` sono a schermo: teschio e occhio hanno
// l'origine sul pavimento, circa 50 px sotto il disegno.
const ORDA_VOLANTE = [
  { modulo: flyingSkull, x: 62, y: 130, fase: 0, daStage: 7 },
  { modulo: bat, x: 30, y: 62, fase: 1.3, daStage: 7 },
  { modulo: eyeball, x: 20, y: 142, fase: 2.1, daStage: 8 },
  { modulo: bat, x: 70, y: 44, fase: 4.2, daStage: 8 },
  { modulo: flyingSkull, x: 26, y: 104, fase: 3.4, daStage: 9 },
  { modulo: eyeball, x: 50, y: 116, fase: 5, daStage: 9 },
];
const PRIMO_STAGE_ORDA_VOLANTE = 7;

// La scia della luna piena: tre immagini di Zucco, una ogni 14 px, con la grafica di status/haste.
const IMMAGINI_SCIA = 3;
const PASSO_SCIA = 14;
const MEMORIA_SCIA = 0.5;
const TONI_SCIA = fit(ORO.slice(1), 7);
const RIGHE_SCIA = [0, 3, 4, 0];

// pixelfx non ha polvere abbastanza piccola per un salto: questa resta fatta a mano.
const POLVERE = {
  salto: { n: 5, forza: 40 },
  atterra: { n: 7, forza: 55 },
  passo: { n: 2, forza: 22 },
  // Un lancio che si dissolve quando parte lo scambio.
  dissolto: { n: 8, forza: 50 },
};
const COLORI_POLVERE = ["#6b5a7a", "#8f7fa0"];
const COLORI_SASSI = ["#8f7fa0", "#b3a6c4", "#d8cfe4"];
const GRAVITA_POLVERE = 260;
const DETRITI_AL_SECONDO = 140;
const SASSI_DEL_PRESAGIO = 16;
const QUOTA_GRONDA = SUOLO - 78;

const SCOSSE = { rotto: 2, urto: 4, botta: 3, luna: 3, presagio: 3, bossAtterra: 6, bossColpito: 3, bossMuore: 6, mazzata: 2, fuoricampo: 3, ribatte: 2, faseBoss: 6, angeloAzzurro: 3, manata: 3 };
const ANNUNCI = {
  vitaRecuperata: () => "VITA RECUPERATA!",
  treLune: (punti) => `TRE LUNE! ${punti} PUNTI`,
};
const DURATA_ANNUNCIO = 2;

// I lampi del duello escono dai 320x180 della corsa: il boss arriva oltre il bordo destro e sopra il cielo.
const LARGHEZZA_LAMPI = LARGHEZZA + 100;
const MARGINE_LAMPI = 60;

// Le scritte che salgono dal punto dell'azione: ognuna spiega cosa è appena successo.
const SCRITTE = {
  rotto: ({ punti }) => ({ testo: `+${punti}`, colore: "#ffe45e", su: 10 }),
  vitaPresa: ({ punti }) => ({ testo: punti ? `+${punti}` : "+1 VITA", colore: "#ffe45e", su: 14 }),
  bossCura: () => ({ testo: "+1", colore: "#ff8a7a", su: 40, scala: 3 }),
  bossColpito: ({ scritta }) => (scritta ? { testo: scritta, colore: "#ff6b5e", su: 40, scala: 3 } : null),
  angeloAzzurro: ({ punti }) => ({ testo: `+${punti}`, colore: "#8fd0ff", su: 40, scala: 3 }),
  fuoricampo: ({ punti }) => (punti ? { testo: `+${punti}`, colore: "#ffe45e", su: 12 } : null),
  botta: ({ scritta }) => ({ testo: scritta, colore: "#ffffff", su: 34, scala: 2 }),
  urto: ({ scritta }) => (scritta ? { testo: scritta, colore: "#ffffff", su: 34, scala: 2 } : null),
};
const DURATA_SCRITTA = 0.9;
const SALITA_SCRITTA = 22;
const INIZIO_STELLE_CADENTI = 40;
const ORIGINE_METEO = { x: LARGHEZZA / 2, y: 170 };

function creaLivello(w = LARGHEZZA, h = ALTEZZA) {
  const frame = createFrame(w, h);
  const img = new ImageData(w, h);
  const tela = document.createElement("canvas");
  tela.width = w;
  tela.height = h;
  const ctx = tela.getContext("2d");
  return {
    tela,
    riempi(disegna) {
      clearFrame(frame);
      disegna(frame);
      composite(frame, img.data, null);
      ctx.putImageData(img, 0, 0);
    },
  };
}

/** La sagoma di uno sprite nel formato che gli effetti di pixelfx leggono da `o.actor`. */
function attoreDa(tela) {
  const w = tela.width, h = tela.height;
  const rgba = tela.getContext("2d").getImageData(0, 0, w, h).data;
  const data = new Uint8Array(w * h);
  const pixels = new Uint32Array(w * h);
  const livelli = [];
  for (let i = 0; i < w * h; i++) {
    if (rgba[i * 4 + 3] === 0) continue;
    data[i] = 1;
    pixels[i] = ((255 << 24) | (rgba[i * 4 + 2] << 16) | (rgba[i * 4 + 1] << 8) | rgba[i * 4]) >>> 0;
    const luce = luma(pixels[i]);
    livelli.push([i % w, Math.floor(i / w), luce < 0.24 ? 1 : luce < 0.66 ? 2 : 3]);
  }
  const x = -Math.floor(w / 2);
  return { mask: { w, h, data }, pixels, livelli, x, y: -h, w, h, k: 2, head: [0, -h], chest: [0, -Math.round(h * 0.6)] };
}

export function creaEffetti({ scosseAttive, sprite }) {
  const attori = {
    corsa: sprite.zucco_corsa.map(attoreDa),
    sale: attoreDa(sprite.zucco_sale[0]),
    scende: attoreDa(sprite.zucco_scende[0]),
    scivola: attoreDa(sprite.zucco_scivola[0]),
  };

  const livelloCielo = creaLivello();
  const livelloNebbia = creaLivello();
  const livelloDietro = creaLivello();
  const livelloDavanti = creaLivello(LARGHEZZA_LAMPI, ALTEZZA + MARGINE_LAMPI);
  const livelloOrda = creaLivello();

  const stelleCadenti = createFx(shootingStars, ORIGINE_METEO);
  const nebbia = createFx(fog, ORIGINE_METEO);

  const volanti = ORDA_VOLANTE.map((v) => ({ ...v, fx: createFx(v.modulo, { x: 0, y: 0, light: 0.35, seed: Math.round(v.fase * 7) }) }));
  const demoni = new Map();
  let lampi = [];
  let scia = null;
  let storia = [];
  let polvere = [];
  let detriti = 0;
  let scossa = 0;
  let annuncio = null;
  let scritte = [];
  let turno = false;

  function attoreDi(s) {
    const z = s.zucco;
    if (z.stato === "scivola") return attori.scivola;
    if (z.stato === "aria") return z.vy < 0 ? attori.sale : attori.scende;
    return attori.corsa[Math.floor(s.distanza / 13) % attori.corsa.length];
  }

  function doveEra(t) {
    for (let i = storia.length - 1; i >= 0; i--) if (storia[i].t <= t) return storia[i];
    return storia[0];
  }

  /** Ogni immagine sta dove Zucco è passato davvero: se salta, quelle dietro restano a terra fino al punto di stacco. */
  function immaginiScia(f, s) {
    const p = painterFor(f);
    const giro = Math.floor(s.t * 30);
    for (let g = IMMAGINI_SCIA; g >= 1; g--) {
      const { y, attore: a } = doveEra(s.t - (g * PASSO_SCIA) / s.velocita);
      p.place(X_ZUCCO - g * PASSO_SCIA, y + 1);
      p.outline(a.mask, a.x, a.y, (mx, my) => (g === IMMAGINI_SCIA && (mx + my) % 2 ? 0 : TONI_SCIA[5 - g]));
      const righe = RIGHE_SCIA[g];
      if (!righe) continue;
      for (const [lx, ly, livello] of a.livelli)
        if ((ly + giro) % righe === 0) p.px(a.x + lx, a.y + ly, TONI_SCIA[5 - g + livello - 2]);
    }
  }

  /** Un sassolino che salta dal suolo e ci ricade: vive esattamente quanto il suo salto. */
  function sassolino(forza) {
    const vy = -(30 + Math.random() * 110 * forza);
    polvere.push({
      x: Math.random() * (LARGHEZZA + 50) - 50,
      y: SUOLO,
      vx: (Math.random() - 0.5) * 24,
      vy,
      vita: (-2 * vy) / GRAVITA_POLVERE,
      colore: COLORI_SASSI[Math.floor(Math.random() * COLORI_SASSI.length)],
      lato: Math.random() < 0.4 ? 2 : 1,
    });
  }

  /** Il terremoto muove la terra anche quando lo schermo non può tremare: sassi dal suolo, polvere dal tetto. */
  function terremoto(dt, s) {
    const forza = forzaTerremoto(s.boss);
    detriti += forza * DETRITI_AL_SECONDO * dt;
    for (; detriti >= 1; detriti--) {
      if (Math.random() < 0.7) sassolino(forza);
      else polvere.push({ x: s.boss.casaX + 22 + Math.random() * 136, y: QUOTA_GRONDA, vx: 0, vy: Math.random() * 20, vita: 0.75, colore: COLORI_POLVERE[1] });
    }
  }

  function seguiDemoni(dt, s) {
    for (const [o, fx] of demoni)
      if (o.rotto || !s.ostacoli.includes(o)) {
        fx.stop();
        fx.options.y += MARGINE_LAMPI;
        lampi.push({ fx, ritmo: 1, mondo: true });
        demoni.delete(o);
      }

    for (const o of s.ostacoli) {
      if (o.tipo !== "demone" || o.rotto) continue;
      if (!demoni.has(o)) demoni.set(o, createFx(summonRise, { ...DEMONE, y: SUOLO, seed: Math.floor(Math.random() * 1000) }));
      const fx = demoni.get(o);
      fx.options.x = o.x + o.w / 2;
      let meta = T_ROTTURA * o.carica;
      if (o.salita >= 1) meta = fx.t + dt;
      else if (o.salita > 0) meta = T_ROTTURA + (T_IN_PIEDI - T_ROTTURA) * o.salita;
      fx.update(Math.max(0, meta - fx.t));
    }
  }

  return {
    evento({ tipo, x, y, punti, scritta }) {
      if (ANNUNCI[tipo]) annuncio = { testo: ANNUNCI[tipo](punti), t: DURATA_ANNUNCIO };
      const riga = SCRITTE[tipo]?.({ punti, scritta });
      if (riga) scritte.push({ scala: 1, ...riga, x, y: y - riga.su, t: 0 });
      const lampo = LAMPI[tipo];
      if (lampo) {
        const fx = createFx(lampo.modulo, { ...lampo.opzioni, x, y: y + MARGINE_LAMPI, seed: Math.floor(Math.random() * 1000) });
        lampi.push({ fx, ritmo: lampo.ritmo, mondo: lampo.mondo });
      }
      const nuvola = POLVERE[tipo];
      if (nuvola) {
        for (let i = 0; i < nuvola.n; i++) {
          const angolo = Math.random() * Math.PI * 2;
          const forza = nuvola.forza * (0.4 + Math.random() * 0.6);
          polvere.push({
            x,
            y,
            vx: Math.cos(angolo) * forza,
            vy: -Math.abs(Math.sin(angolo)) * forza * 0.3,
            vita: 0.3 * (0.6 + Math.random() * 0.4),
            colore: COLORI_POLVERE[i % 2],
          });
        }
      }
      if (tipo === "presagio") for (let i = 0; i < SASSI_DEL_PRESAGIO; i++) sassolino(0.4);
      if (scosseAttive && SCOSSE[tipo]) scossa = Math.max(scossa, SCOSSE[tipo]);
    },

    aggiorna(dt, s) {
      const scorre = s.finita ? 0 : s.velocita * dt;

      terremoto(dt, s);
      if (annuncio) {
        annuncio.t -= dt;
        if (annuncio.t <= 0) annuncio = null;
      }
      for (const r of scritte) {
        r.t += dt;
        r.x -= s.velocita * dt * 0.5;
      }
      scritte = scritte.filter((r) => r.t < DURATA_SCRITTA);
      for (const p of polvere) {
        p.vita -= dt;
        p.vy += GRAVITA_POLVERE * dt;
        p.x += (p.vx - s.velocita * 0.5) * dt;
        p.y += p.vy * dt;
      }
      polvere = polvere.filter((p) => p.vita > 0);

      for (const l of lampi) {
        l.fx.update(dt * l.ritmo);
        if (l.mondo) l.fx.options.x -= scorre;
      }
      lampi = lampi.filter((l) => !l.fx.done() && l.fx.options.x > FUORI_SCHERMO);
      seguiDemoni(dt, s);

      if (s.lunaT > 0 && !scia) {
        scia = createFx(haste, { palette: ORO.slice(1), actor: attori.corsa[0] });
        storia = [];
      }
      if (scia) {
        const attore = attoreDi(s);
        scia.options.x = X_ZUCCO;
        scia.options.y = s.zucco.y + MARGINE_LAMPI;
        scia.options.actor = attore;
        scia.update(dt);
        storia.push({ t: s.t, y: s.zucco.y, attore });
        while (s.t - storia[0].t > MEMORIA_SCIA) storia.shift();
        if (s.lunaT <= 0) scia.stop();
        if (scia.done()) scia = null;
      }

      if (s.stage >= PRIMO_STAGE_ORDA_VOLANTE) for (const v of volanti) v.fx.update(dt);

      scossa = Math.max(0, scossa - dt * 14);

      // Il meteo va a 30 fps come nei suoi disegni: costa la metà e non si nota.
      nebbia.update(dt);
      stelleCadenti.update(dt);
      turno = !turno;
      if (turno) livelloNebbia.riempi((f) => nebbia.draw(f));
      else if (s.t >= INIZIO_STELLE_CADENTI) livelloCielo.riempi((f) => stelleCadenti.draw(f));
    },

    disegnaCielo(ctx, s) {
      if (s.t >= INIZIO_STELLE_CADENTI) ctx.drawImage(livelloCielo.tela, 0, 0);
    },

    disegnaNebbia(ctx, s) {
      ctx.globalAlpha = 0.5 + 0.35 * Math.min(1, s.t / 120);
      ctx.drawImage(livelloNebbia.tela, 0, 0);
      ctx.globalAlpha = 1;
    },

    disegnaDietro(ctx, s) {
      if (!scia && demoni.size === 0) return;
      livelloDietro.riempi((f) => {
        if (scia) immaginiScia(f, s);
        for (const fx of demoni.values()) fx.draw(f);
      });
      ctx.drawImage(livelloDietro.tela, 0, 0);
    },

    disegnaOrda(ctx, s, ingresso) {
      livelloOrda.riempi((f) => {
        for (const v of volanti) {
          if (s.stage < v.daStage) continue;
          const onda = v.fx.t * 1.1 + v.fase;
          const gara = 0.55 + 0.45 * Math.sin(onda);
          v.fx.options.x = -40 + (v.x + 40) * gara * ingresso;
          v.fx.options.y = v.y + Math.cos(onda * 1.9) * 5;
          v.fx.draw(f);
        }
      });
      ctx.drawImage(livelloOrda.tela, 0, 0);
    },

    /** Nel buio il demone va ridisegnato sopra l'oscurità, come gli altri ostacoli. */
    ripetiDemoni(ctx) {
      if (demoni.size > 0) ctx.drawImage(livelloDietro.tela, 0, 0);
    },

    disegna(ctx) {
      for (const p of polvere) {
        const lato = p.lato ?? 1;
        ctx.fillStyle = p.colore;
        ctx.fillRect(Math.round(p.x), Math.round(p.y), lato, lato);
      }
      if (!scia && lampi.length === 0) return;
      livelloDavanti.riempi((f) => {
        scia?.draw(f, "front");
        for (const l of lampi) l.fx.draw(f);
      });
      ctx.drawImage(livelloDavanti.tela, 0, -MARGINE_LAMPI);
    },

    get scossa() {
      return scossa;
    },

    get annuncio() {
      return annuncio?.testo;
    },

    /** Le scritte del momento, già nella posizione in cui disegnarle. */
    get scritte() {
      return scritte.map((r) => ({ ...r, y: r.y - SALITA_SCRITTA * (r.t / DURATA_SCRITTA) ** 0.5, svanisce: r.t > DURATA_SCRITTA * 0.7 }));
    },

    scosseAttive,

    svuota() {
      lampi = [];
      demoni.clear();
      storia = [];
      polvere = [];
      detriti = 0;
      annuncio = null;
      scritte = [];
      scia = null;
      scossa = 0;
    },
  };
}
