// Prova automatica di una demo: la apre in Edge senza finestra, fa le foto e lancia la sua verifica.mjs.
//
//   node demo/comune/prova.mjs <id> [--seed 12345] [--solo-foto]
//
// Cosa controlla, per ogni demo:
// - la pagina si apre senza errori in console, senza file mancanti, e pubblica window.__demo;
// - la variante dipende solo dal seme (due aperture con lo stesso seme danno la stessa variante);
// - la verifica della demo (demo/<id>/verifica.mjs, scritta da chi ha scritto le istruzioni) passa;
// - dopo la soluzione il rompicapo resta chiuso anche ricaricando la pagina.
// Le foto vanno in demo/<id>/foto/ (desktop con il testo, desktop, telefono in orizzontale, telefono in verticale).

import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath, pathToFileURL } from "node:url";

const require = createRequire(import.meta.url);
const puppeteer = require("C:/Users/marco/Desktop/ELEFIX WORKSPACE/Airlance/frontend/node_modules/puppeteer-core");
const EDGE = "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe";

const QUI = path.dirname(fileURLToPath(import.meta.url));
const DEMO = path.resolve(QUI, "..");

const argomenti = process.argv.slice(2);
const id = argomenti.find((a) => !a.startsWith("--"));
if (!id) {
  console.error("Uso: node demo/comune/prova.mjs <id> [--seed 12345] [--solo-foto]");
  process.exit(2);
}
const valore = (nome, base) => {
  const i = argomenti.indexOf(nome);
  return i >= 0 ? argomenti[i + 1] : base;
};
const semeBase = Number(valore("--seed", "12345")) >>> 0;
const soloFoto = argomenti.includes("--solo-foto");

const cartella = path.join(DEMO, id);
const pagina = path.join(cartella, "index.html");
if (!fs.existsSync(pagina)) {
  console.error(`Manca ${pagina}`);
  process.exit(2);
}
const cartellaFoto = path.join(cartella, "foto");
fs.mkdirSync(cartellaFoto, { recursive: true });

const esiti = [];
const controlla = (ok, messaggio) => {
  esiti.push({ ok: !!ok, messaggio });
  console.log(`${ok ? "  ok  " : "  NO  "} ${messaggio}`);
  return !!ok;
};

const VISTE = {
  desktop: { width: 1280, height: 720, deviceScaleFactor: 1 },
  telefono: { width: 844, height: 390, deviceScaleFactor: 2, isMobile: true, hasTouch: true, isLandscape: true },
  verticale: { width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true },
};

const browser = await puppeteer.launch({
  executablePath: EDGE,
  headless: "new",
  args: ["--allow-file-access-from-files", "--autoplay-policy=no-user-gesture-required"],
});

const problemiTotali = [];

/** Apre la demo in un profilo pulito (niente salvataggi di prima). */
async function apri(seme, vista = "desktop") {
  const contesto = await browser.createBrowserContext();
  const p = await contesto.newPage();
  const problemi = [];
  p.on("console", (m) => { if (m.type() === "error") problemi.push(`console: ${m.text()}`); });
  p.on("pageerror", (e) => problemi.push(`eccezione: ${e.message}`));
  p.on("requestfailed", (r) => problemi.push(`file non caricato: ${r.url()}`));
  await p.setViewport(VISTE[vista]);
  const url = `${pathToFileURL(pagina).href}?seed=${seme}`;
  await p.goto(url, { waitUntil: "load" });
  try {
    await p.waitForFunction(() => window.__demo && window.__demo.pronto, { timeout: 10000 });
  } catch {
    problemi.push("window.__demo non è comparso entro 10 secondi");
  }
  await new Promise((r) => setTimeout(r, 400));
  problemiTotali.push(problemi);
  return { contesto, p, problemi };
}

const leggiDemo = (p) => p.evaluate(() => window.__demo && {
  id: window.__demo.id, seme: window.__demo.seme, variante: window.__demo.variante, funzioni: window.__demo.funzioni,
});

console.log(`Prova della demo «${id}» (seme ${semeBase})`);

// ── 1. Apertura e foto ──
let { contesto, p, problemi } = await apri(semeBase, "desktop");
const info = await leggiDemo(p);
controlla(info && info.id, "la pagina pubblica window.__demo");
controlla(info && info.funzioni && info.funzioni.includes("gioca"), "la demo espone gioca(mossa) con g.espone");
await p.screenshot({ path: path.join(cartellaFoto, "desktop-testo.png") });
const haComincia = await p.$('[data-azione="comincia"]');
controlla(haComincia, "all'apertura c'è la carta con il testo e il bottone Comincia");
if (haComincia) await haComincia.click();
await new Promise((r) => setTimeout(r, 600));
await p.screenshot({ path: path.join(cartellaFoto, "desktop.png") });

// ── 2. Stesso seme, stessa variante ──
const seconda = await apri(semeBase, "telefono");
const info2 = await leggiDemo(seconda.p);
controlla(JSON.stringify(info?.variante) === JSON.stringify(info2?.variante), "stesso seme → stessa variante");
await seconda.p.evaluate(() => window.__demo?.chiudiCarte?.());
await new Promise((r) => setTimeout(r, 300));
await seconda.p.screenshot({ path: path.join(cartellaFoto, "telefono.png") });
await seconda.contesto.close();
const terza = await apri(semeBase + 1, "verticale");
await terza.p.evaluate(() => window.__demo?.chiudiCarte?.());
await new Promise((r) => setTimeout(r, 300));
await terza.p.screenshot({ path: path.join(cartellaFoto, "telefono-verticale.png") });
const info3 = await leggiDemo(terza.p);
if (JSON.stringify(info?.variante) === JSON.stringify(info3?.variante))
  console.log("  (nota) il seme successivo dà la stessa variante: va bene solo se il rompicapo ha una variante unica");
await terza.contesto.close();

// ── 3. La verifica della demo ──
const fileVerifica = path.join(cartella, "verifica.mjs");
if (!soloFoto && fs.existsSync(fileVerifica)) {
  const { default: verifica } = await import(pathToFileURL(fileVerifica).href + `?t=${Date.now()}`);
  const scena = async () => p.evaluate(() => {
    const r = document.querySelector('[data-kit="scena"]').getBoundingClientRect();
    return { x: r.left, y: r.top, k: r.width / 320 };
  });
  const t = {
    get seme() { return t._seme; },
    get variante() { return t._variante; },
    _seme: semeBase,
    _variante: info?.variante,
    get pagina() { return p; },
    gioca: (mossa) => p.evaluate((m) => window.__demo.gioca(m), mossa),
    stato: () => p.evaluate(() => window.__demo.stato()),
    chiama: (nome, ...args) => p.evaluate((n, a) => window.__demo[n](...a), nome, args),
    async nuova(seme) {
      await contesto.close();
      ({ contesto, p, problemi } = await apri(seme >>> 0, "desktop"));
      await p.evaluate(() => window.__demo?.chiudiCarte?.());
      const d = await leggiDemo(p);
      t._seme = d?.seme;
      t._variante = d?.variante;
      return t._variante;
    },
    async ricarica() {
      await p.reload({ waitUntil: "load" });
      await p.waitForFunction(() => window.__demo && window.__demo.pronto, { timeout: 10000 });
      await new Promise((r) => setTimeout(r, 300));
      const d = await leggiDemo(p);
      t._variante = d?.variante;
      return t._variante;
    },
    controlla,
    foto: (nome) => p.screenshot({ path: path.join(cartellaFoto, `verifica-${nome}.png`) }),
    aspetta: (ms) => new Promise((r) => setTimeout(r, ms)),
    log: (...a) => console.log("       ", ...a),
    /** Clic su un punto della scena, in pixel 320×180: prova il percorso vero dell'interfaccia. */
    async clicScena(x, y) {
      const s = await scena();
      await p.mouse.click(s.x + (x + 0.5) * s.k, s.y + (y + 0.5) * s.k);
    },
    async trascinaScena(x1, y1, x2, y2, passi = 8) {
      const s = await scena();
      await p.mouse.move(s.x + (x1 + 0.5) * s.k, s.y + (y1 + 0.5) * s.k);
      await p.mouse.down();
      await p.mouse.move(s.x + (x2 + 0.5) * s.k, s.y + (y2 + 0.5) * s.k, { steps: passi });
      await p.mouse.up();
    },
    async bottone(azione) {
      const b = await p.$(`[data-azione="${azione}"]`);
      if (!b) throw new Error(`nessun bottone con data-azione="${azione}"`);
      await b.click();
    },
    chiudiCarte: () => p.evaluate(() => window.__demo.chiudiCarte()),
  };
  await p.evaluate(() => window.__demo?.chiudiCarte?.());
  console.log("Verifica della demo:");
  try {
    await verifica(t);
  } catch (err) {
    controlla(false, `la verifica si è fermata con un'eccezione: ${err && err.stack || err}`);
  }

  // ── 4. Chiuso dopo la soluzione ──
  const stato = await t.stato().catch(() => null);
  if (stato && stato.risolto) {
    controlla(stato.guadagnate === Math.max(1, stato.dorate - Math.floor(stato.errori / stato.erroriConcessi)),
      `dorate guadagnate giuste (${stato.guadagnate} con ${stato.errori} errori)`);
    await t.foto("vinto");
    await t.ricarica();
    const dopo = await t.stato();
    controlla(dopo.risolto, "ricaricando la pagina il rompicapo resta risolto");
    const r = await t.gioca({});
    controlla(r && r.rifiutata === "risolto", "dopo la soluzione le mosse vengono rifiutate");
    await t.foto("gia-risolto");
  } else if (stato) {
    console.log("  (nota) alla fine della verifica il rompicapo non risulta risolto: il controllo «resta chiuso» è saltato");
  }
} else if (!soloFoto) {
  controlla(false, `manca ${path.relative(DEMO, fileVerifica)}`);
}

await contesto.close().catch(() => {});
await browser.close();

const tuttiProblemi = [...new Set(problemiTotali.flat())];
controlla(tuttiProblemi.length === 0, tuttiProblemi.length ? `problemi nella pagina:\n         - ${tuttiProblemi.join("\n         - ")}` : "nessun errore in console né file mancanti");

const falliti = esiti.filter((e) => !e.ok);
const rapporto = [
  `Demo ${id} · seme ${semeBase} · ${new Date().toISOString()}`,
  ...esiti.map((e) => `${e.ok ? "ok" : "NO"}  ${e.messaggio}`),
  falliti.length ? `\n${falliti.length} controlli NON passati` : "\nTUTTO OK",
].join("\n");
fs.writeFileSync(path.join(cartellaFoto, "rapporto.txt"), rapporto + "\n");
console.log(falliti.length ? `\n${falliti.length} controlli NON passati` : "\nTUTTO OK");
console.log(`Foto e rapporto in ${path.relative(process.cwd(), cartellaFoto) || cartellaFoto}`);
process.exit(falliti.length ? 1 : 0);
