// Esplora le sale: la bozza del giro dell'escape room, staccata dal catalogo dei rompicapi.
// Il codice di Esplora è quello del catalogo; i dati che lì vengono dall'archivio (pianta, oggetti, stanze) qui sono
// file in dati/ e img/, e le chiavi prese restano su questo dispositivo invece che sul profilo.
(() => {
  const ID_FILE = /^[0-9a-f]{32}$/;
  const $ = (id) => document.getElementById(id);
  const el = (tag, cls, text) => {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  };
  const slug = (s) => String(s || '').trim().toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const limita = (v, a, b) => Math.max(a, Math.min(b, v));
  const arrotonda = (v) => Math.round(v * 100) / 100;
  const muovere = () => !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let stanze = [];
  let oggetti = [];
  const datiStanza = (nome) => ({ id: slug(nome), nome: stanze.find((x) => x.id === slug(nome))?.nome || String(nome || '').trim() });
  function spriteValido(s) {
    if (!s || !Number.isInteger(s.w) || !Number.isInteger(s.h) || s.w < 1 || s.h < 1 || s.w > 64 || s.h > 64) return null;
    const palette = {};
    for (const [k, v] of Object.entries(s.palette || {})) if (k.length === 1 && /^#[0-9a-f]{6}$/i.test(v)) palette[k] = v;
    const frames = (Array.isArray(s.frames) ? s.frames : []).slice(0, 16)
      .filter((f) => Array.isArray(f) && f.length === s.h && f.every((r) => typeof r === 'string' && r.length === s.w));
    if (!frames.length) return null;
    const fps = Number.isFinite(s.fps) ? limita(s.fps, 1, 24) : 8;
    return { w: s.w, h: s.h, palette, frames, fps };
  }
  function telaFotogramma(s, righe) {
    const t = document.createElement('canvas');
    t.width = s.w;
    t.height = s.h;
    const c = t.getContext('2d');
    righe.forEach((r, y) => [...r].forEach((ch, x) => {
      const col = s.palette[ch];
      if (!col) return;
      c.fillStyle = col;
      c.fillRect(x, y, 1, 1);
    }));
    return t;
  }
  // Al posto dell'archivio: una raccolta è un file dati/<nome>.json, { id: documento }. Il profilo non c'è.
  const leggi = (nome) => fetch('dati/' + nome + '.json').then((r) => { if (!r.ok) throw new Error(r.status); return r.json(); });
  const db = {
    collection: (nome) => ({
      onSnapshot(ok, ko) {
        leggi(nome).then((docs) => ok({ metadata: { fromCache: false }, docs: Object.entries(docs).map(([id, d]) => ({ id, data: () => d })) }), ko);
        return () => {};
      },
    }),
  };

  // ── Esplora: una sala alla volta, a schermata intera, con la zucca che passa di sala in sala ──
  // Ogni sala è una schermata in pixel art vista dall'alto a tre quarti; tutte stanno in un foglio solo.
  // Foglio e geometria vengono dall'archivio, collection pianta: li esporta giochi/escape-room/mappa/mappa.js
  // del progetto della festa. Passando da una porta la scena scorre verso la sala dopo, come nei giochi a stanze;
  // le sale più alte dello schermo (la Sala principale) si seguono e si scorrono; nell'area bar, che è un angolo
  // della Sala principale, si entra ingrandendola.
  const PIANI_MAPPA = ['piano-terra', 'primo-piano'];
  const VERSI = ['su', 'giu', 'sx', 'dx'];
  const DIREZIONI = { su: [0, -1], giu: [0, 1], sx: [-1, 0], dx: [1, 0] };
  const INIZIO = 'anticancello';
  const MEMORIA_GIRO = 'escape-room-giro';
  let pianta = { caricata: false, geo: null, immagine: '' };
  // Il portone da vicino (pianta/portone) e, mentre lo guardi, lo stato della vista: la chiave che entra, il lampo,
  // l'apertura. Quando `vicino` c'è, la scena disegna il portone al posto delle sale.
  let portoneGeo = null;
  let vicino = null;
  // Quello che la scena disegna: le viste (una sala con la sua telecamera; due mentre scorre o sfuma) e la zucca,
  // che sta in una vista oppure, mentre la scena scorre, direttamente sulla finestra.
  let scena = { viste: [], zucca: { vista: 0, p: [0, 0] }, zuccaFinestra: null };

  const numero = (v, max) => Number.isFinite(v) && v >= 0 && v <= max;
  const nelRiquadro = (p, w, h) => Array.isArray(p) && p.length === 2 && numero(p[0], w) && numero(p[1], h);

  // La geometria arriva dall'archivio condiviso: si tiene solo quello che ha la forma giusta.
  function geometriaValida(d) {
    if (!d || d.versione !== 2 || !Array.isArray(d.schermo) || d.schermo.length !== 2) return null;
    const [L, A] = d.schermo;
    const misura = (v) => Number.isInteger(v) && v >= 16 && v <= 8000;
    if (![L, A, d.larghezza, d.altezza].every(misura)) return null;
    const scala = Number.isInteger(d.scala) && d.scala >= 4 && d.scala <= 64 ? d.scala : 20;
    const g = { larghezza: d.larghezza, altezza: d.altezza, schermo: [L, A], scala, stanze: {}, porte: [], premio: null, serrature: null };
    for (const [id, s] of Object.entries(d.stanze || {})) {
      if (!/^[a-z0-9-]{1,40}$/.test(id) || !s || !PIANI_MAPPA.includes(s.piano)) continue;
      // Larga quanto lo schermo, alta almeno quanto lo schermo (la Sala principale lo è molto di più).
      const r = s.riquadro;
      if (!Array.isArray(r) || r.length !== 4 || r[2] !== L || !Number.isInteger(r[3]) || r[3] < A) continue;
      if (!numero(r[0], g.larghezza - L) || !numero(r[1], g.altezza - r[3]) || !nelRiquadro(s.centro, L, r[3])) continue;
      const nome = typeof s.nome === 'string' ? s.nome.trim().slice(0, 60) : '';
      g.stanze[id] = { nome, piano: s.piano, centro: [s.centro[0], s.centro[1]], riquadro: [...r] };
    }
    for (const p of Array.isArray(d.porte) ? d.porte : []) {
      if (!p || !Array.isArray(p.tra) || p.tra.length !== 2 || !p.tra.every((id) => g.stanze[id])) continue;
      if (!Array.isArray(p.punti) || p.punti.length !== 2 || !p.punti.every((q, i) => nelRiquadro(q, L, g.stanze[p.tra[i]].riquadro[3]))) continue;
      if (!Array.isArray(p.versi) || p.versi.length !== 2 || !p.versi.every((v) => VERSI.includes(v))) continue;
      // zoom: il riquadro della prima sala che si ingrandisce per entrare nella seconda (l'area bar).
      let zoom = null;
      if (p.zoom !== undefined) {
        const z = p.zoom, H = g.stanze[p.tra[0]].riquadro[3];
        if (!Array.isArray(z) || z.length !== 4 || !z.every(Number.isFinite) || z[2] < 16 || z[3] < 10) continue;
        if (!nelRiquadro([z[0], z[1]], L, H) || z[0] + z[2] > L + 8 || z[1] + z[3] > H) continue;
        zoom = [...z];
      }
      g.porte.push({ tra: [...p.tra], punti: p.punti.map((q) => [q[0], q[1]]), versi: [...p.versi], salita: p.salita === true, zoom });
    }
    const pr = d.premio;
    if (pr && g.stanze[pr.stanza] && nelRiquadro(pr.punto, L, g.stanze[pr.stanza].riquadro[3]) && VERSI.includes(pr.verso)) {
      g.premio = { stanza: pr.stanza, punto: [pr.punto[0], pr.punto[1]], verso: pr.verso };
    }
    // Il portone della salita: dove stanno le serrature, il portone, il punto davanti e il riquadro da ingrandire.
    const sr = d.serrature;
    if (sr && g.stanze[sr.stanza] && Array.isArray(sr.posti) && sr.posti.length >= 1 && sr.posti.length <= 12) {
      const H = g.stanze[sr.stanza].riquadro[3];
      const riquadroOk = (r) => Array.isArray(r) && r.length === 4 && r.every(Number.isFinite) && nelRiquadro([r[0], r[1]], L, H) && r[2] > 0 && r[3] > 0;
      if (sr.posti.every((q) => nelRiquadro(q, L, H)) && nelRiquadro(sr.davanti, L, H) && riquadroOk(sr.portone) && riquadroOk(sr.zoom)) {
        const colori = Array.isArray(sr.colori) ? sr.colori : [];
        g.serrature = {
          stanza: sr.stanza,
          posti: sr.posti.map((q) => [q[0], q[1]]),
          colori: sr.posti.map((_, i) => (typeof colori[i] === 'string' && /^#[0-9a-f]{6}$/i.test(colori[i]) ? colori[i] : '#ffffff')),
          portone: [...sr.portone],
          davanti: [sr.davanti[0], sr.davanti[1]],
          zoom: [...sr.zoom],
        };
      }
    }
    return g.stanze[INIZIO] ? g : null;
  }
  /** Il nome della sala: quello della sua scheda nel catalogo, se c'è; altrimenti quello della geometria (i corridoi). */
  const nomeSala = (id) => stanze.find((s) => s.id === id)?.nome || pianta.geo?.stanze[id]?.nome || datiStanza(id).nome;

  function immagineValida(d) {
    if (d && typeof d.asset === 'string' && ID_FILE.test(d.asset)) return 'img/' + d.asset + '.png';
    if (d && typeof d.immagine === 'string' && /^data:image\/png;base64,[A-Za-z0-9+/=]+$/.test(d.immagine)) return d.immagine;
    return '';
  }

  const pixelSvg = (righe, colori) => {
    let r = '';
    righe.forEach((riga, y) => [...riga].forEach((c, x) => {
      if (colori[c]) r += `<rect x="${x}" y="${y}" width="1" height="1" fill="${colori[c]}"/>`;
    }));
    return `<svg viewBox="0 0 ${righe[0].length} ${righe.length}" aria-hidden="true">${r}</svg>`;
  };
  const SVG_FRECCIA = '<span class="giro">' + pixelSvg([
    '.....k.....',
    '....kWk....',
    '...kWWWk...',
    '..kWWWWWk..',
    '.kWWWWWWWk.',
    'kkkkWWWkkkk',
    '...kWWWk...',
    '...kWyWk...',
    '...kWyWk...',
    '...kWWWk...',
    '...kkkkk...',
  ], { k: '#160f1e', W: '#ffffff', y: '#ffe45e' }) + '</span>';
  const SVG_LUCCHETTO = pixelSvg([
    '...kkkkk...',
    '..kWWWWWk..',
    '..kWk.kWk..',
    '..kWk.kWk..',
    '.kkkkkkkkk.',
    '.kyyyyyyyk.',
    '.kyyykyyyk.',
    '.kyyykyyyk.',
    '.kyyyyyyyk.',
    '.koooooook.',
    '.kkkkkkkkk.',
  ], { k: '#160f1e', W: '#c3c1d4', y: '#ffb52e', o: '#d68a18' });
  // Il segnaposto: un ragazzino con la testa di zucca, come Zucco. Un pixel dello sprite è un pixel della mappa.
  const pixelTela = (righe, colori) => {
    const t = document.createElement('canvas');
    t.width = righe[0].length;
    t.height = righe.length;
    const c = t.getContext('2d');
    righe.forEach((riga, y) => [...riga].forEach((ch, x) => {
      if (!colori[ch]) return;
      c.fillStyle = colori[ch];
      c.fillRect(x, y, 1, 1);
    }));
    return t;
  };
  const TELA_ZUCCA = pixelTela([
    '......kgk.......',
    '.......gk.......',
    '...kkkkkkkkkk...',
    '..kOhOoOOoOOOk..',
    '.kOhOOoOOoOOOOk.',
    '.kOyyOoOOoOyyOk.',
    '.kOyyyoOOoyyyOk.',
    '.kOOOOoOOoOOOOk.',
    '.kOyOyOyOyOyOOk.',
    '.kOOyyyyyyyyOOk.',
    '..kOOOoOOoOOOk..',
    '...kkkkkkkkkk...',
    '....kpPPPPpk....',
    '...kpPPPPPPpk...',
    '...kpPPPPPPpk...',
    '..kppPPPPPPppk..',
    '..kppPPPPPPppk..',
    '..kpppppppppppk.',
    '..kkkkkkkkkkkk..',
    '....kwk..kwk....',
    '....kwk..kwk....',
    '...kkkk..kkkk...',
  ], { k: '#160f1e', O: '#f28c28', o: '#b9520c', h: '#ffb050', y: '#ffe45e', g: '#4a7a2a', p: '#3f2a78', P: '#6a43b8', w: '#2a1c38' });

  let giro = { stanza: INIZIO, chiavi: [], inserite: [] };
  try {
    const g = JSON.parse(localStorage.getItem(MEMORIA_GIRO));
    const testi = (v) => (Array.isArray(v) ? v.filter((c) => typeof c === 'string') : []);
    if (g && typeof g.stanza === 'string') giro = { stanza: g.stanza, chiavi: testi(g.chiavi), inserite: testi(g.inserite) };
  } catch { /* senza memoria si parte dalla strada */ }
  const ricordaGiro = () => { try { localStorage.setItem(MEMORIA_GIRO, JSON.stringify(giro)); } catch { /* vale solo per questa visita */ } };

  // Le chiavi prese e quelle nel portone stanno sul profilo (archivio, data/users/<id>, documento escape-room):
  // rientrando si ritrovano, anche da un altro dispositivo, e non si rimettono. La sala in cui sei resta su questo
  // dispositivo. Il localStorage fa solo da copia mentre il profilo non ha ancora risposto.
  let refGiro = null;
  let giroDaSalvare = false;
  const testiGiro = (v) => (Array.isArray(v) ? [...new Set(v.filter((c) => typeof c === 'string' && c.length <= 60))] : []);
  function salvaGiro() {
    ricordaGiro();
    if (!refGiro) { giroDaSalvare = true; return; }
    refGiro.set({ chiavi: giro.chiavi, inserite: giro.inserite, aggiornato: new Date().toISOString() })
      .catch(() => avvisa('Non riesco a salvare le chiavi sul tuo profilo: riprova più tardi.'));
  }
  async function caricaGiroProfilo(user) {
    let uid = null;
    try { uid = user ? await user.id() : null; } catch { uid = null; }
    if (!uid) return;
    const ref = db.collection('data/users/' + uid).doc('escape-room');
    try {
      const s = await ref.get();
      if (s.exists) {
        const d = s.data();
        // Quello che hai fatto qui prima che il profilo rispondesse si aggiunge; il resto lo decide il profilo.
        const unisci = (dalProfilo, qui) => (giroDaSalvare ? [...new Set([...dalProfilo, ...qui])] : dalProfilo);
        giro.inserite = unisci(testiGiro(d.inserite), giro.inserite);
        giro.chiavi = [...new Set([...unisci(testiGiro(d.chiavi), giro.chiavi), ...giro.inserite])];
      } else if (giro.chiavi.length || giro.inserite.length) {
        // La prima volta col profilo: ci si portano le chiavi ricordate su questo dispositivo.
        giroDaSalvare = true;
      }
    } catch {
      return;
    }
    refGiro = ref;
    if (giroDaSalvare) {
      giroDaSalvare = false;
      salvaGiro();
    } else ricordaGiro();
    if (vicino) renderVicino();
    if (inCammino) renderZaino(contoChiavi());
    else renderEsplora();
  }
  let inCammino = false;
  let timerAvviso = 0;
  let lampo = null; // la chiave appena presa brilla per due giri

  // Le chiavi vengono dall'archivio (collection oggetti): ognuna dice la stanza che la dà.
  function chiaviDelGiro() {
    const ordina = (a, b) => (Number.isFinite(a.ordine) ? a.ordine : 99) - (Number.isFinite(b.ordine) ? b.ordine : 99);
    return oggetti.filter((o) => o.tipo === 'chiave').sort(ordina)
      .map((o) => ({ ...o, stanzaId: slug(o.stanza), s: spriteValido(o.sprite) }));
  }
  function contoChiavi() {
    const chiavi = chiaviDelGiro();
    const servono = chiavi.length || 6;
    const prese = chiavi.filter((c) => giro.chiavi.includes(c.stanzaId)).length;
    // La salita si apre quando tutte le chiavi sono inserite nel portone, non basta averle.
    const inserite = chiavi.filter((c) => giro.inserite.includes(c.stanzaId)).length;
    const daInserire = chiavi.filter((c) => giro.chiavi.includes(c.stanzaId) && !giro.inserite.includes(c.stanzaId));
    return { chiavi, servono, prese, inserite, daInserire, aperta: inserite >= servono };
  }

  /** Le uscite della sala: le porte verso le sale vicine e, nella Sala del tesoro, la porta d'oro del premio. */
  function uscite(stanza) {
    const g = pianta.geo;
    const lista = g.porte.flatMap((p) => {
      const i = p.tra.indexOf(stanza);
      // entra: si va dalla sala grande al suo angolo (la Sala Bar), cioè si ingrandisce.
      return i < 0 ? [] : [{ a: p.tra[1 - i], punto: p.punti[i], arrivo: p.punti[1 - i], verso: p.versi[i], salita: p.salita, zoom: p.zoom, entra: i === 0 }];
    });
    if (g.premio && g.premio.stanza === stanza) lista.push({ premio: true, punto: g.premio.punto, verso: g.premio.verso });
    return lista;
  }

  function avvisa(testo) {
    const a = $('e-avviso');
    a.textContent = testo;
    a.hidden = false;
    clearTimeout(timerAvviso);
    timerAvviso = setTimeout(() => { a.hidden = true; }, 3500);
  }

  // ── La scena ──
  function misuraScena() {
    const r = $('e-scena').getBoundingClientRect();
    return { w: r.width, h: r.height };
  }
  /**
   * Lo zoom della finestra 320×200: riempie la scena. Sotto i 3 pixel dello schermo per pixel della sala si arrotonda
   * a un numero intero, così i pixel restano tutti uguali; sopra la differenza non si vede e la sala riempie tutto.
   * Non si arrotonda nemmeno quando si perderebbe troppo spazio (per esempio un telefono in orizzontale con pochi pixel).
   */
  function inquadratura() {
    const { w, h } = misuraScena();
    const dpr = window.devicePixelRatio || 1;
    const [L, A] = pianta.geo.schermo;
    const pieno = Math.min(w / L, h / A);
    const intero = Math.max(1, Math.floor(pieno * dpr)) / dpr;
    const z = pieno * dpr >= 3 || intero < pieno * 0.85 ? pieno : intero;
    return { z, ox: (w - L * z) / 2, oy: (h - A * z) / 2, w, h };
  }

  // Il foglio con tutte le sale, caricato una volta: la scena lo ridisegna a ogni fotogramma.
  let fogliaSale = null;
  function immagineSale() {
    const url = pianta.immagine;
    if (!url) return null;
    if (fogliaSale?.dataset.url !== url) {
      fogliaSale = new Image();
      fogliaSale.dataset.url = url;
      fogliaSale.addEventListener('load', () => disegnaScena());
      fogliaSale.src = url;
    }
    return fogliaSale;
  }

  // Le animazioni della mappa (`animazioni()` in giochi/escape-room/mappa/mappa.js): per ogni sala i quadratini che
  // cambiano a ogni fotogramma del giro, e gli eventi (il fumo dei fumatori, il manichino) che partono, finiscono e
  // ripartono dopo un'attesa a caso. Con «riduci movimento» non si muove niente e il fumo resta fermo, già formato.
  let animi = null;
  const fogliAnimi = new Map();
  function foglioAnimi(url) {
    if (!fogliAnimi.has(url)) {
      const im = new Image();
      im.addEventListener('load', () => disegnaScena());
      im.src = url;
      fogliAnimi.set(url, im);
    }
    return fogliAnimi.get(url);
  }
  function animazioniValide(d) {
    if (!d || (d.versione !== 1 && d.versione !== 2) || !d.giro || typeof d.giro.stanze !== 'object' || !Array.isArray(d.eventi)) return null;
    const T = d.tessera, C = d.colonne, n = d.giro.fotogrammi, fps = d.giro.fps;
    if (![T, C, n, fps].every((v) => Number.isInteger(v) && v > 0 && v <= 1000)) return null;
    const urlGiro = immagineValida({ asset: d.assetGiro, immagine: d.immagineGiro });
    const urlEventi = immagineValida({ asset: d.assetEventi, immagine: d.immagineEventi });
    if (!urlGiro || !urlEventi) return null;
    const intero = (v) => Number.isInteger(v) && v >= 0;
    const stanze = {};
    for (const [id, fotogrammi] of Object.entries(d.giro.stanze)) {
      if (!Array.isArray(fotogrammi) || fotogrammi.length !== n) continue;
      stanze[id] = fotogrammi.map((l) => (Array.isArray(l) ? l.filter((q) => Array.isArray(q) && q.length === 3 && q.every(intero)) : []));
    }
    const eventi = d.eventi
      .filter((e) => e && typeof e.stanza === 'string' && (e.tipo === 'sopra' || e.tipo === 'scena')
        && [e.x, e.y, e.w, e.h, e.riga, e.fotogrammi].every(intero) && e.fotogrammi > 0
        && Array.isArray(e.attesa) && e.attesa.length === 2 && e.attesa.every((v) => Number.isFinite(v) && v >= 0) && e.attesa[0] <= e.attesa[1])
      .map((e) => ({
        stanza: e.stanza, tipo: e.tipo, x: e.x, y: e.y, w: e.w, h: e.h, riga: e.riga, fotogrammi: e.fotogrammi, attesa: [...e.attesa],
        fermo: Number.isInteger(e.fermo) && e.fermo >= 0 && e.fermo < e.fotogrammi ? e.fermo : null, inizio: null, prossimo: null,
      }));
    return { T, C, n, fps, stanze, eventi, fumi: fumiValidi(d.fumi), giro: foglioAnimi(urlGiro), fogEventi: foglioAnimi(urlEventi) };
  }
  // Il fumo dei fumatori (versione 2): una raccolta di fumi nello stesso foglio degli eventi, ognuno con la brace in
  // (ax, ay), e i fumatori con la loro brace nella sala. A ogni boccata la pagina tira a sorte quale fumo fare.
  function fumiValidi(f) {
    const intero = (v) => Number.isInteger(v) && v >= 0;
    if (!f || !Array.isArray(f.pool) || !Array.isArray(f.fumatori) || !intero(f.fotogrammi) || !f.fotogrammi || !intero(f.fps) || !f.fps) return null;
    if (!Array.isArray(f.attesa) || f.attesa.length !== 2 || !f.attesa.every((v) => Number.isFinite(v) && v >= 0) || f.attesa[0] > f.attesa[1]) return null;
    const pool = f.pool.filter((p) => p && [p.w, p.h, p.ax, p.ay, p.riga].every(intero) && p.w > 0 && p.h > 0)
      .map((p) => ({ w: p.w, h: p.h, ax: p.ax, ay: p.ay, riga: p.riga }));
    if (!pool.length || pool.length !== f.pool.length) return null;
    const fumatori = f.fumatori.filter((u) => u && typeof u.stanza === 'string' && intero(u.x) && intero(u.y))
      .map((u) => ({
        stanza: u.stanza, x: u.x, y: u.y, preferito: intero(u.preferito) && u.preferito < pool.length ? u.preferito : 0,
        inizio: null, prossimo: null, scelto: null, specchio: false, ultimo: null,
      }));
    return { fotogrammi: f.fotogrammi, fps: f.fps, attesa: [...f.attesa], fermo: intero(f.fermo) && f.fermo < f.fotogrammi ? f.fermo : 0, pool, fumatori };
  }
  /** Dove va disegnato il fumo k per un fumatore, specchiato o no; null se uscirebbe dalla sala. */
  function postoFumo(u, k, specchio, L, A) {
    const p = animi.fumi.pool[k];
    const x0 = specchio ? u.x - (p.w - 1 - p.ax) : u.x - p.ax, y0 = u.y - p.ay;
    return x0 >= 0 && y0 >= 0 && x0 + p.w <= L && y0 + p.h <= A ? [x0, y0] : null;
  }
  /**
   * Il sorteggio del fumo per la boccata che parte: fra quelli che stanno nella sala, non quello della boccata prima
   * né quelli che stanno facendo gli altri fumatori (se ne restano); poi, se sta in tutti e due i versi, anche il verso.
   */
  function sorteggiaFumo(u, L, A) {
    const fm = animi.fumi, versi = (k) => [false, true].filter((sp) => postoFumo(u, k, sp, L, A));
    const adatti = fm.pool.map((_, k) => k).filter((k) => versi(k).length);
    const inUso = new Set(fm.fumatori.filter((g) => g !== u && g.inizio !== null).map((g) => g.scelto));
    const scelte = [adatti.filter((k) => k !== u.ultimo && !inUso.has(k)), adatti.filter((k) => k !== u.ultimo), adatti].find((l) => l.length);
    if (!scelte) return null;
    const k = scelte[Math.floor(Math.random() * scelte.length)], vv = versi(k);
    return [k, vv[Math.floor(Math.random() * vv.length)]];
  }
  /** Il fotogramma della boccata di un fumatore all'istante t, o -1 mentre aspetta; il fumo si sorteggia alla partenza. */
  function fotogrammaFumo(u, t, L, A) {
    const fm = animi.fumi;
    if (u.prossimo === null) u.prossimo = t + Math.random() * fm.attesa[1];
    if (u.inizio === null && t >= u.prossimo) {
      const s = sorteggiaFumo(u, L, A);
      if (!s) { u.prossimo = t + fm.attesa[1]; return -1; }
      [u.scelto, u.specchio] = s;
      u.inizio = t;
    }
    if (u.inizio === null) return -1;
    const j = Math.floor(((t - u.inizio) * fm.fps) / 1000);
    if (j < fm.fotogrammi) return j;
    u.ultimo = u.scelto;
    u.inizio = null;
    u.prossimo = t + fm.attesa[0] + Math.random() * (fm.attesa[1] - fm.attesa[0]);
    return -1;
  }
  /** Il fumo dei fumatori di una sala, sopra tutto; con «riduci movimento» il fumo preferito di ognuno, fermo. */
  function disegnaFumi(ctx, stanza, t, L, A, vivo) {
    const fm = animi.fumi;
    if (!fm) return;
    for (const u of fm.fumatori) {
      if (u.stanza !== stanza) continue;
      let k, specchio, j;
      if (vivo) {
        j = fotogrammaFumo(u, t, L, A);
        if (j < 0) continue;
        [k, specchio] = [u.scelto, u.specchio];
      } else [k, specchio, j] = [u.preferito, false, fm.fermo];
      const p = fm.pool[k], posto = postoFumo(u, k, specchio, L, A);
      if (!posto) continue;
      if (specchio) {
        ctx.save();
        ctx.translate(posto[0] + p.w, posto[1]);
        ctx.scale(-1, 1);
        ctx.drawImage(animi.fogEventi, j * p.w, p.riga, p.w, p.h, 0, 0, p.w, p.h);
        ctx.restore();
      } else ctx.drawImage(animi.fogEventi, j * p.w, p.riga, p.w, p.h, posto[0], posto[1], p.w, p.h);
    }
  }
  /** Il fotogramma di un evento all'istante t, o -1 mentre aspetta: finito, riparte dopo un'attesa a caso fra attesa[0] e attesa[1]. */
  function fotogrammaEvento(e, t) {
    // La prima volta parte entro l'attesa più lunga, così i fumatori non cominciano tutti insieme.
    if (e.prossimo === null) e.prossimo = t + Math.random() * e.attesa[1];
    if (e.inizio === null && t >= e.prossimo) e.inizio = t;
    if (e.inizio === null) return -1;
    const j = Math.floor(((t - e.inizio) * animi.fps) / 1000);
    if (j < e.fotogrammi) return j;
    e.inizio = null;
    e.prossimo = t + e.attesa[0] + Math.random() * (e.attesa[1] - e.attesa[0]);
    return -1;
  }
  /**
   * Sopra il pezzo di foglio di una sala (con la trasformazione della sala): i quadratini del giro, poi gli eventi.
   * `misure` serve per quello che non è una sala della geometria (il portone da vicino).
   */
  function disegnaAnimazioni(ctx, stanza, t, misure = pianta.geo.stanze[stanza]?.riquadro.slice(2)) {
    const a = animi;
    if (!a || !misure) return;
    const [L, A] = misure, vivo = muovere();
    const pronta = (im) => im.complete && im.naturalWidth > 0;
    if (vivo && pronta(a.giro)) {
      for (const [q, x, y] of a.stanze[stanza]?.[Math.floor((t * a.fps) / 1000) % a.n] ?? []) {
        const w = Math.min(a.T, L - x), h = Math.min(a.T, A - y);
        if (w > 0 && h > 0) ctx.drawImage(a.giro, (q % a.C) * a.T, Math.floor(q / a.C) * a.T, w, h, x, y, w, h);
      }
    }
    if (!pronta(a.fogEventi)) return;
    // Prima i pezzi della sala (il manichino), poi quello che sta sopra tutto (il fumo).
    for (const tipo of ['scena', 'sopra'])
      for (const e of a.eventi) {
        if (e.stanza !== stanza || e.tipo !== tipo) continue;
        const j = vivo ? fotogrammaEvento(e, t) : e.fermo;
        if (j === null || j < 0) continue;
        ctx.drawImage(a.fogEventi, j * e.w, e.riga, e.w, e.h, e.x, e.y, e.w, e.h);
      }
    disegnaFumi(ctx, stanza, t, L, A, vivo);
  }

  const altezzaSala = (id) => pianta.geo.stanze[id].riquadro[3];
  const salaAlta = (id) => altezzaSala(id) > pianta.geo.schermo[1];
  /** Dove guarda la telecamera di una sala con la zucca in p: nelle sale alte la segue in verticale. */
  function camPer(id, p) {
    const [L, A] = pianta.geo.schermo;
    const H = altezzaSala(id);
    return { x: L / 2, y: H <= A ? A / 2 : limita(p[1] - A * 0.3, A / 2, H - A / 2), k: 1 };
  }
  const vista = (stanza, cam, extra = {}) => ({ stanza, cam, dx: 0, dy: 0, alfa: 1, ...extra });
  /** Da pixel della sala a pixel della finestra 320×200, per una vista. */
  function inFinestra(v, p) {
    const [L, A] = pianta.geo.schermo;
    return [(p[0] - v.cam.x) * v.cam.k + L / 2 + v.dx, (p[1] - v.cam.y) * v.cam.k + A / 2 + v.dy];
  }
  /** Fra due telecamere: lo spostamento è lineare, l'ingrandimento cresce in modo costante. */
  const fraCamere = (a, b, e) => ({ x: a.x + (b.x - a.x) * e, y: a.y + (b.y - a.y) * e, k: a.k * Math.pow(b.k / a.k, e) });

  /** Disegna la scena: le viste (a pixel netti, con la loro telecamera) e la zucca che saltella. */
  function disegnaScena(t = performance.now()) {
    const tela = $('e-tela');
    const { w, h } = misuraScena();
    if (!w || !pianta.geo) return;
    const dpr = window.devicePixelRatio || 1;
    const PL = Math.round(w * dpr), PA = Math.round(h * dpr);
    if (tela.width !== PL || tela.height !== PA) { tela.width = PL; tela.height = PA; }
    const ctx = tela.getContext('2d');
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalAlpha = 1;
    ctx.fillStyle = '#0b0716';
    ctx.fillRect(0, 0, PL, PA);
    if (vicino && portoneGeo) {
      // Il portone da vicino occupa la finestra 320×200 come una sala.
      const [L, A] = pianta.geo.schermo, { z, ox, oy } = inquadratura();
      ctx.setTransform(z * dpr, 0, 0, z * dpr, Math.round(ox * dpr), Math.round(oy * dpr));
      ctx.save();
      ctx.beginPath();
      ctx.rect(0, 0, L, A);
      ctx.clip();
      ctx.imageSmoothingEnabled = false;
      disegnaVicino(ctx, t);
      ctx.restore();
      ctx.globalAlpha = 1;
      return;
    }
    const im = immagineSale();
    if (!im || !im.complete || !im.naturalWidth || !scena.viste.length) return;
    const [L, A] = pianta.geo.schermo;
    const { z, ox, oy } = inquadratura();
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.save();
    ctx.beginPath();
    ctx.rect(ox, oy, L * z, A * z);
    ctx.clip();
    ctx.imageSmoothingEnabled = false;
    const metti = (v) => {
      const k = z * v.cam.k;
      const tx = ox + (L / 2 + v.dx - v.cam.x * v.cam.k) * z, ty = oy + (A / 2 + v.dy - v.cam.y * v.cam.k) * z;
      ctx.setTransform(k * dpr, 0, 0, k * dpr, Math.round(tx * dpr), Math.round(ty * dpr));
    };
    for (const v of scena.viste) {
      const [rx, ry, rw, rh] = pianta.geo.stanze[v.stanza].riquadro;
      metti(v);
      ctx.globalAlpha = v.alfa;
      ctx.drawImage(im, rx, ry, rw, rh, 0, 0, rw, rh);
      disegnaAnimazioni(ctx, v.stanza, t);
    }
    const sr = pianta.geo.serrature;
    if (sr) {
      for (const v of scena.viste) {
        if (v.stanza !== sr.stanza) continue;
        metti(v);
        disegnaSerrature(ctx, t, v.alfa);
      }
    }
    const salto = muovere() && Math.floor(t / 400) % 2 ? 1 : 0;
    if (scena.zuccaFinestra) {
      ctx.globalAlpha = 1;
      ctx.setTransform(z * dpr, 0, 0, z * dpr, Math.round(ox * dpr), Math.round(oy * dpr));
      ctx.drawImage(TELA_ZUCCA, Math.round(scena.zuccaFinestra[0]) - 8, Math.round(scena.zuccaFinestra[1]) - 22 - salto);
    } else {
      const v = scena.viste[scena.zucca.vista] || scena.viste[0];
      metti(v);
      ctx.globalAlpha = v.alfa;
      ctx.drawImage(TELA_ZUCCA, Math.round(scena.zucca.p[0]) - 8, Math.round(scena.zucca.p[1]) - 22 - salto);
    }
    ctx.restore();
    ctx.globalAlpha = 1;
  }

  // Le animazioni della scena (la zucca che cammina, la scena che scorre o si ingrandisce) girano in un solo ciclo,
  // che si ferma quando la vista è nascosta.
  let tween = null;
  let giroScena = 0;
  function finisciTween() {
    if (!tween) return;
    tween.passo(1);
    const ok = tween.fine;
    tween = null;
    ok();
  }
  function passoTween(t) {
    if (!tween) return;
    tween.inizio ??= t;
    const k = Math.min(1, (t - tween.inizio) / tween.durata);
    tween.passo(tween.easing === 'ease-in-out' ? k * k * (3 - 2 * k) : k);
    if (k >= 1) finisciTween();
  }
  function giraScena(t) {
    giroScena = 0;
    if ($('vista-esplora').hidden) { finisciTween(); return; }
    passoTween(t);
    disegnaScena(t);
    if (tween || muovere()) giroScena = requestAnimationFrame(giraScena);
  }
  function avviaScena() {
    if (!giroScena && !$('vista-esplora').hidden) giroScena = requestAnimationFrame(giraScena);
  }
  /** Un'animazione: `passo(e)` porta la scena alla frazione e (da 0 a 1); con «riduci movimento» va subito alla fine. */
  function anima(durata, easing, passo) {
    if (!durata || !muovere() || $('vista-esplora').hidden) {
      passo(1);
      disegnaScena();
      return Promise.resolve();
    }
    finisciTween();
    return new Promise((ok) => {
      tween = { inizio: null, durata, easing, passo, fine: ok };
      avviaScena();
    });
  }
  const mescola = (p, q, e) => [p[0] + (q[0] - p[0]) * e, p[1] + (q[1] - p[1]) * e];

  /** Dove sta sulla scena (in pixel della pagina) un punto della sala in cui sei. */
  const sulloSchermo = (p) => {
    const { z, ox, oy } = inquadratura();
    const [x, y] = inFinestra(scena.viste[0], p);
    return [x * z + ox, y * z + oy];
  };

  function posiziona(p) {
    scena.zucca = { vista: 0, p: [p[0], p[1]] };
    scena.zuccaFinestra = null;
    $('e-scena').dataset.zucca = p.join(' ');
  }
  /** La zucca cammina da a a b dentro la sala, circa un quadretto ogni 110 ms; nelle sale alte la telecamera la segue. */
  function cammina(a, b) {
    const stanza = scena.viste[0].stanza;
    const cam0 = { ...scena.viste[0].cam };
    posiziona(a);
    $('e-scena').dataset.zucca = b.join(' ');
    const durata = limita((Math.hypot(b[0] - a[0], b[1] - a[1]) / pianta.geo.scala) * 110, 200, 1400);
    return anima(durata, 'linear', (e) => {
      const p = mescola(a, b, e);
      scena.zucca = { vista: 0, p };
      // Se la sala era stata scorsa, la telecamera torna sulla zucca nel primo terzo del cammino.
      const cam = camPer(stanza, p), r = Math.min(1, e / 0.3);
      scena.viste[0].cam = { ...cam, y: cam0.y + (cam.y - cam0.y) * r };
    });
  }
  /**
   * La scena scorre dalla sala `da` alla sala `a` nel verso della porta: quella vecchia esce, quella nuova entra
   * dal lato opposto, e la zucca passa dalla porta di partenza a quella d'arrivo.
   */
  function scorri(da, a, verso, partenza, arrivo) {
    const [L, A] = pianta.geo.schermo;
    const [vx, vy] = DIREZIONI[verso];
    const camDa = { ...scena.viste[0].cam }, camA = camPer(a, arrivo);
    const inizio = inFinestra(vista(da, camDa), partenza), fine = inFinestra(vista(a, camA), arrivo);
    $('e-scena').dataset.zucca = arrivo.join(' ');
    return anima(640, 'ease-in-out', (e) => {
      if (e >= 1) {
        scena.viste = [vista(a, camA)];
        posiziona(arrivo);
        return;
      }
      scena.viste = [vista(da, camDa, { dx: -vx * e * L, dy: -vy * e * A }), vista(a, camA, { dx: vx * (1 - e) * L, dy: vy * (1 - e) * A })];
      scena.zuccaFinestra = mescola(inizio, fine, e);
    });
  }
  /** Si entra in un angolo della sala: la telecamera ingrandisce il riquadro, poi sfuma nella sala di dettaglio. */
  async function ingrandisci(da, a, riquadro, arrivo) {
    const [L] = pianta.geo.schermo;
    const [rx, ry, rw, rh] = riquadro;
    const camDa = { ...scena.viste[0].cam }, camZoom = { x: rx + rw / 2, y: ry + rh / 2, k: L / rw }, camA = camPer(a, arrivo);
    await anima(620, 'ease-in-out', (e) => { scena.viste = [vista(da, fraCamere(camDa, camZoom, e))]; });
    scena.zucca = { vista: 1, p: [arrivo[0], arrivo[1]] };
    await anima(320, 'linear', (e) => {
      scena.viste = e >= 1 ? [vista(a, camA)] : [vista(da, camZoom), vista(a, camA, { alfa: e })];
      if (e >= 1) posiziona(arrivo);
    });
  }
  /** Si esce dall'angolo: la sala di dettaglio sfuma nella sala grande ingrandita, che poi torna intera. */
  async function rimpicciolisci(da, a, riquadro, arrivo) {
    const [L] = pianta.geo.schermo;
    const [rx, ry, rw, rh] = riquadro;
    const camDa = { ...scena.viste[0].cam }, camZoom = { x: rx + rw / 2, y: ry + rh / 2, k: L / rw }, camA = camPer(a, arrivo);
    scena.zucca = { vista: 1, p: [arrivo[0], arrivo[1]] };
    await anima(320, 'linear', (e) => { scena.viste = [vista(da, camDa), vista(a, camZoom, { alfa: e })]; });
    posiziona(arrivo);
    await anima(620, 'ease-in-out', (e) => { scena.viste = [vista(a, fraCamere(camZoom, camA, e))]; });
  }
  function buio(acceso) {
    $('e-buio').classList.toggle('acceso', acceso);
    return new Promise((ok) => setTimeout(ok, muovere() ? 190 : 0));
  }

  // ── Il portone della salita: nella sala le chiavi inserite brillano; si inseriscono guardandolo da vicino ──
  /** Le pietre in ordine di serratura: la chiave i va nella serratura i (lo stesso ordine di oggetti.js). */
  let ordineSerrature = [];
  let portoneAperto = false;

  /** La chiave di diamante in piccolo: testa a teschio con la pietra negli occhi; se non è infilata, anche il gambo. */
  function chiaveMini(ctx, x, y, pietra, infilata, giro = 0) {
    const c = '#bfe3f0', w = '#ffffff', m = '#7fa8cc', k = '#160f1e';
    const testa = infilata ? y - 6 : y - 11;
    const larga = giro > 0 && giro < 1 ? Math.max(1, Math.round(5 * Math.abs(Math.cos(giro * Math.PI)))) : 5;
    const x0 = x - Math.floor(larga / 2);
    ctx.fillStyle = k;
    ctx.fillRect(x0 - 1, testa - 1, larga + 2, 6);
    ctx.fillStyle = c;
    ctx.fillRect(x0, testa, larga, 4);
    if (larga >= 5) {
      ctx.fillStyle = w;
      ctx.fillRect(x0 + 1, testa + 1, 3, 2);
      ctx.fillStyle = pietra;
      ctx.fillRect(x0 + 1, testa + 1, 1, 1);
      ctx.fillRect(x0 + 3, testa + 1, 1, 1);
      ctx.fillStyle = m;
      ctx.fillRect(x0 + 1, testa + 3, 3, 1);
    }
    if (!infilata) {
      ctx.fillStyle = k;
      ctx.fillRect(x - 1, testa + 4, 3, 8);
      ctx.fillStyle = m;
      ctx.fillRect(x, testa + 4, 1, 7);
      ctx.fillRect(x + 1, testa + 8, 1, 2);
    }
  }

  function disegnaSerrature(ctx, t, alfa) {
    const sr = pianta.geo.serrature;
    const brillano = muovere();
    // Il portone aperto: le ante si ritirano ai lati e dietro c'è la luce dorata della Sala del tesoro.
    const aperto = portoneAperto ? 1 : 0;
    if (aperto > 0) {
      const [ax, ay, aw, ah] = sr.portone;
      ctx.globalAlpha = alfa;
      ctx.fillStyle = '#0b0716';
      ctx.fillRect(ax, ay, aw, ah);
      ctx.globalAlpha = alfa * aperto * 0.8;
      ctx.fillStyle = '#5a4818';
      ctx.fillRect(ax + 8, ay + 3, aw - 16, ah - 3);
      ctx.fillStyle = '#d6b25e';
      ctx.fillRect(ax + 18, ay + 6, aw - 36, ah - 6);
      ctx.globalAlpha = alfa;
      const meta = Math.round((aw / 2) * (1 - aperto));
      for (const [x0, verso] of [[ax, 1], [ax + aw - meta, -1]]) {
        if (meta <= 0) continue;
        ctx.fillStyle = '#2a1a12';
        ctx.fillRect(x0, ay, meta, ah);
        ctx.fillStyle = '#3a2418';
        for (let x = x0 + (verso > 0 ? 1 : 2); x < x0 + meta - 1; x += 5) ctx.fillRect(x, ay, 3, ah);
      }
    }
    sr.posti.forEach(([x, y], i) => {
      const id = ordineSerrature[i];
      if (!id || !giro.inserite.includes(id)) return;
      // L'alone che pulsa, a quadrati come nei pixel, e la testa della chiave infilata.
      const k = brillano ? 0.5 + 0.5 * Math.sin(t / 260 + i * 1.1) : 0.6;
      ctx.fillStyle = sr.colori[i];
      ctx.globalAlpha = alfa * (0.2 + 0.25 * k);
      ctx.fillRect(x - 6, y - 7, 13, 13);
      ctx.globalAlpha = alfa * (0.35 + 0.35 * k);
      ctx.fillRect(x - 4, y - 5, 9, 9);
      ctx.globalAlpha = alfa;
      chiaveMini(ctx, x, y, sr.colori[i], true);
      // Ogni tanto una stellina.
      if (brillano && Math.floor(t / 130 + i * 5) % 11 === 0) {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(x + 4, y - 9, 1, 3);
        ctx.fillRect(x + 3, y - 8, 3, 1);
      }
    });
  }

  // ── Il portone da vicino ──
  // Toccando il portone nella sala (o la salita chiusa) la zucca ci va davanti, la telecamera si avvicina e la scena
  // passa al portone solo, disegnato grande (pianta/portone, da `disegnaPortone` in mappa.js). Le serrature dove puoi
  // mettere una chiave brillano; toccandone una la chiave sale da sotto, intera e scintillante, si gira verso la toppa,
  // entra e gira. Con tutte e sei il portone si apre e si torna nella sala.

  function portoneValido(d) {
    if (!d || d.versione !== 1 || !pianta.geo) return null;
    const [L, A] = pianta.geo.schermo;
    const url = immagineValida(d);
    const n = (v) => Number.isFinite(v);
    if (!url || d.larghezza !== L || d.altezza !== A) return null;
    if (!Array.isArray(d.posti) || d.posti.length < 1 || d.posti.length > 12 || !d.posti.every((q) => nelRiquadro(q, L, A))) return null;
    if (!Array.isArray(d.piastra) || d.piastra.length !== 2 || !d.piastra.every(n)) return null;
    if (!Array.isArray(d.arco) || d.arco.length !== 3 || !d.arco.every(n)) return null;
    if (!Array.isArray(d.ante) || d.ante.length !== 4 || !d.ante.every(n)) return null;
    const colori = Array.isArray(d.colori) ? d.colori : [];
    return {
      url, larghezza: L, altezza: A,
      posti: d.posti.map((q) => [q[0], q[1]]),
      colori: d.posti.map((_, i) => (typeof colori[i] === 'string' && /^#[0-9a-f]{6}$/i.test(colori[i]) ? colori[i] : '#ffffff')),
      piastra: [...d.piastra], arco: [...d.arco], ante: [...d.ante],
      occhi: Array.isArray(d.occhi) ? d.occhi.filter((q) => nelRiquadro(q, L, A)) : [],
    };
  }

  /** I fotogrammi della chiave già disegnati, dove finisce la testa (il teschio) e dove ne sta il centro. */
  const teleChiavi = new Map();
  function chiaveDisegnata(c) {
    if (!c?.s) return null;
    const firma = c.s.frames.map((f) => f.join('')).join('/');
    const gia = teleChiavi.get(c.stanzaId);
    if (gia?.firma === firma) return gia;
    // La testa è la parte larga in alto: finisce dove la chiave si stringe nel collo.
    const larghe = c.s.frames[0].map((r) => {
      let a = -1, b = -1;
      [...r].forEach((ch, x) => { if (c.s.palette[ch]) { if (a < 0) a = x; b = x; } });
      return a < 0 ? 0 : b - a + 1;
    });
    const cima = Math.max(0, larghe.findIndex((w) => w > 0)), massima = Math.max(...larghe), piuLarga = larghe.indexOf(massima);
    let testa = larghe.findIndex((w, y) => y > piuLarga && w > 0 && w <= massima * 0.6);
    if (testa < 0) testa = Math.round(c.s.h / 2);
    const d = { firma, w: c.s.w, h: c.s.h, fps: c.s.fps, frames: c.s.frames.map((f) => telaFotogramma(c.s, f)), testa, cx: c.s.w / 2, cy: (cima + testa) / 2 };
    teleChiavi.set(c.stanzaId, d);
    return d;
  }

  /** Il bordo di luce che gira attorno a un rettangolo: un pixel acceso ogni tre, che avanza col tempo. */
  function bordoCheGira(ctx, x0, y0, w, h, t, colore) {
    const giro = 2 * (w + h), passo = Math.floor(t / 90) % 6;
    ctx.fillStyle = colore;
    for (let p = 0; p < giro; p++) {
      if ((p + passo) % 6 >= 3) continue;
      const [x, y] = p < w ? [x0 + p, y0] : p < w + h ? [x0 + w - 1, y0 + p - w] : p < 2 * w + h ? [x0 + w - 1 - (p - w - h), y0 + h - 1] : [x0, y0 + h - 1 - (p - 2 * w - h)];
      ctx.fillRect(x, y, 1, 1);
    }
  }

  /** Le serrature da vicino: le chiavi già dentro brillano, quelle che puoi inserire pulsano, le altre restano in ombra. */
  function disegnaSerratureVicine(ctx, t, conto, vivo) {
    const g = portoneGeo, [pw, ph] = g.piastra;
    g.posti.forEach(([x, y], i) => {
      const id = ordineSerrature[i], c = conto.chiavi.find((k) => k.stanzaId === id), colore = g.colori[i];
      const x0 = x - pw / 2, y0 = y - ph / 2;
      if (vicino.chiave?.i === i) return;
      if (id && giro.inserite.includes(id)) {
        const k = vivo ? 0.5 + 0.5 * Math.sin(t / 260 + i * 1.1) : 0.6;
        ctx.fillStyle = colore;
        ctx.globalAlpha = 0.25 + 0.3 * k;
        ctx.fillRect(x0 - 3, y0 - 3, pw + 6, ph + 6);
        ctx.globalAlpha = 1;
        const kd = chiaveDisegnata(c);
        if (kd) {
          const f = kd.frames[vivo ? Math.floor(t / (1000 / kd.fps) + i * 3) % kd.frames.length : 0];
          ctx.drawImage(f, 0, 0, kd.w, kd.testa, Math.round(x - kd.cx), Math.round(y - kd.cy), kd.w, kd.testa);
        } else chiaveMini(ctx, x, y, colore, true);
      } else if (id && giro.chiavi.includes(id)) {
        // Si può inserire: un alone che pulsa attorno alla piastra e un bordo di luce che gira.
        const k = vivo ? 0.5 + 0.5 * Math.sin(t / 170 + i) : 0.8;
        ctx.fillStyle = colore;
        ctx.globalAlpha = 0.35 + 0.5 * k;
        ctx.fillRect(x0 - 4, y0 - 4, pw + 8, 3);
        ctx.fillRect(x0 - 4, y0 + ph + 1, pw + 8, 3);
        ctx.fillRect(x0 - 4, y0 - 1, 3, ph + 2);
        ctx.fillRect(x0 + pw + 1, y0 - 1, 3, ph + 2);
        ctx.globalAlpha = 0.18 * k;
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(x0, y0, pw, ph);
        ctx.globalAlpha = 1;
        bordoCheGira(ctx, x0 - 5, y0 - 5, pw + 10, ph + 10, vivo ? t : 0, '#ffffff');
      } else {
        // Manca la chiave: la serratura resta in ombra.
        ctx.globalAlpha = 0.5;
        ctx.fillStyle = '#0b0716';
        ctx.fillRect(x0, y0, pw, ph);
        ctx.globalAlpha = 1;
      }
    });
  }

  /** La chiave che sta entrando: sale intera, poi il gambo si accorcia sotto la testa (punta nella toppa), entra e gira. */
  function disegnaChiaveCheEntra(ctx, t, vivo) {
    const v = vicino.chiave, kd = v.kd, colore = portoneGeo.colori[v.i];
    const f = kd.frames[vivo ? Math.floor(t / (1000 / kd.fps)) % kd.frames.length : 0];
    const cima = Math.round(v.y - kd.cy), x0 = Math.round(v.x - kd.cx);
    if (v.fase === 'sale') {
      // Una scia di scintille sotto la chiave che sale.
      for (let s = 0; s < 7; s++) {
        const yy = cima + kd.h + 3 + s * 5 + (Math.floor(t / 60) % 5);
        if (yy >= portoneGeo.altezza) break;
        ctx.globalAlpha = 0.85 - s * 0.11;
        ctx.fillStyle = s % 2 ? '#ffffff' : colore;
        ctx.fillRect(x0 + Math.round(kd.cx) - 1 + ((s * 37 + Math.floor(t / 120)) % 5) - 2, yy, 1, 2);
      }
      ctx.globalAlpha = 1;
      ctx.drawImage(f, x0, cima);
      return;
    }
    const gambo = kd.h - kd.testa, visibile = Math.round(gambo * (1 - v.piega));
    if (visibile > 0) ctx.drawImage(f, 0, kd.testa, kd.w, gambo, x0, cima + kd.testa, kd.w, visibile);
    // Mezzo giro nella toppa: la testa si stringe fino a un filo e torna larga.
    const s = Math.abs(Math.cos(v.giro * Math.PI)), larga = Math.max(1, Math.round(kd.w * s));
    ctx.drawImage(f, 0, 0, kd.w, kd.testa, Math.round(v.x - larga / 2), cima, larga, kd.testa);
    if (v.fase === 'entra') {
      // Il colpo della chiave che entra: quattro schegge di polvere che si allontanano.
      const r = Math.round(3 + v.dentro * 8), [pw, ph] = portoneGeo.piastra;
      ctx.globalAlpha = 1 - v.dentro;
      ctx.fillStyle = '#c3c1d4';
      for (const [dx, dy] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) ctx.fillRect(v.x + dx * (pw / 2 + r) - 1, v.y + dy * (ph / 2 + r / 2) - 1, 2, 2);
      ctx.globalAlpha = 1;
    }
  }

  /** Il portone da vicino, al posto delle sale. Durante l'apertura le due ante scivolano ai lati, sotto l'arco. */
  function disegnaVicino(ctx, t) {
    const g = portoneGeo, im = foglioAnimi(g.url);
    if (!im.complete || !im.naturalWidth) return;
    const vivo = muovere(), conto = contoChiavi();
    const misure = [g.larghezza, g.altezza];
    const chiuso = () => {
      ctx.drawImage(im, 0, 0);
      disegnaAnimazioni(ctx, 'portone', t, misure);
      disegnaSerratureVicine(ctx, t, conto, vivo);
    };
    const ap = vicino.apertura ?? 0;
    if (ap <= 0) chiuso();
    else {
      ctx.drawImage(im, 0, 0);
      disegnaAnimazioni(ctx, 'portone', t, misure);
      const [ax, ay, ar] = g.arco, fondo = g.ante[1] + g.ante[3];
      const arco = () => {
        ctx.beginPath();
        ctx.moveTo(ax - ar, fondo);
        ctx.lineTo(ax - ar, ay);
        ctx.arc(ax, ay, ar, Math.PI, 0);
        ctx.lineTo(ax + ar, fondo);
        ctx.closePath();
      };
      // Dietro le ante la luce dorata della Sala del tesoro, sempre più forte.
      ctx.save();
      arco();
      ctx.clip();
      ctx.fillStyle = '#3a2a10';
      ctx.fillRect(ax - ar, 0, ar * 2, fondo);
      ctx.globalAlpha = Math.min(1, ap * 1.4);
      ctx.fillStyle = '#d6b25e';
      ctx.fillRect(ax - Math.round(ar * ap), 0, Math.round(ar * ap) * 2, fondo);
      ctx.fillStyle = '#ffe7a0';
      ctx.fillRect(ax - Math.round(ar * ap * 0.5), 0, Math.round(ar * ap * 0.5) * 2, fondo);
      ctx.globalAlpha = 1;
      // Ogni anta si porta dietro solo il suo pezzo (ritaglio dopo lo spostamento) e sparisce sotto l'arco.
      const d = Math.round(ap * ar);
      for (const [da, a, sposta] of [[ax - ar, ax, -d], [ax, ax + ar, d]]) {
        ctx.save();
        ctx.translate(sposta, 0);
        ctx.beginPath();
        ctx.rect(da, 0, a - da, fondo);
        ctx.clip();
        chiuso();
        ctx.restore();
      }
      ctx.restore();
    }
    // Gli occhi del teschio si accendono quando ci sono tutte le chiavi (finché le ante non si aprono e lo dividono).
    if (conto.aperta && ap <= 0) {
      const k = vivo ? 0.8 + 0.2 * Math.sin(t / 200) : 1;
      for (const [x, y] of g.occhi) {
        ctx.globalAlpha = k * 0.55;
        ctx.fillStyle = '#ffb52e';
        ctx.fillRect(x - 2, y - 2, 4, 4);
        ctx.globalAlpha = k;
        ctx.fillStyle = '#ffe45e';
        ctx.fillRect(x - 1, y - 1, 2, 2);
      }
      ctx.globalAlpha = 1;
    }
    if (vicino.chiave) disegnaChiaveCheEntra(ctx, t, vivo);
    if (vicino.lampo) {
      const [x, y] = g.posti[vicino.lampo.i], e = vicino.lampo.e, r = Math.round(3 + e * 14);
      ctx.globalAlpha = 1 - e;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(x - r, y - 1, r * 2 + 1, 2);
      ctx.fillRect(x - 1, y - r, 2, r * 2 + 1);
      ctx.fillRect(x - Math.round(r / 3), y - Math.round(r / 3), Math.round(r / 3) * 2 + 1, Math.round(r / 3) * 2 + 1);
      ctx.globalAlpha = 1;
    }
  }

  /** I pulsanti delle serrature sopra il disegno, la scritta e «Torna all'Ingresso». */
  function renderVicino() {
    $('e-vicino').hidden = !vicino;
    if (!vicino || !portoneGeo) return;
    const g = portoneGeo, conto = contoChiavi(), [pw, ph] = g.piastra;
    const { z, ox, oy } = inquadratura();
    const pronte = conto.daInserire.length;
    $('e-vicino-titolo').textContent = conto.aperta ? 'Il portone è aperto'
      : pronte ? `Tocca ${pronte === 1 ? 'la serratura che brilla' : 'una serratura che brilla'} · ${conto.inserite}/${conto.servono}`
        : `Chiavi nel portone: ${conto.inserite} su ${conto.servono}`;
    $('e-vicino-serrature').replaceChildren(...g.posti.map(([x, y], i) => {
      const id = ordineSerrature[i], c = conto.chiavi.find((k) => k.stanzaId === id);
      const stato = id && giro.inserite.includes(id) ? 'inserita' : id && giro.chiavi.includes(id) ? 'pronta' : 'manca';
      const di = c?.gemma ? ` di ${c.gemma}` : '';
      const b = el('button', 'serratura');
      b.type = 'button';
      b.dataset.stato = stato;
      b.dataset.i = String(i);
      b.style.left = ox + x * z + 'px';
      b.style.top = oy + y * z + 'px';
      b.style.width = (pw + 8) * z + 'px';
      b.style.height = (ph + 8) * z + 'px';
      b.setAttribute('aria-label', stato === 'pronta' ? `Inserisci la chiave${di}`
        : stato === 'inserita' ? `Serratura${di}: la chiave è inserita` : `Serratura${di}: ti manca la chiave`);
      b.disabled = vicino.inCorso;
      b.addEventListener('click', () => toccaSerratura(i));
      return b;
    }));
    $('e-vicino-torna').disabled = vicino.inCorso;
  }

  function toccaSerratura(i) {
    if (!vicino || vicino.inCorso) return;
    const conto = contoChiavi(), id = ordineSerrature[i], c = conto.chiavi.find((k) => k.stanzaId === id);
    if (!id || !c) return;
    const nome = c.gemma ? `di ${c.gemma}` : 'di questa serratura';
    if (giro.inserite.includes(id)) return avvisa(`La chiave ${nome} è già nel portone.`);
    if (!giro.chiavi.includes(id)) return avvisa(`Ti manca la chiave ${nome}: la dà ${nomeSala(id)}, quando ne risolvi i rompicapi.`);
    inserisciChiave(i, c);
  }

  /** La chiave entra nella serratura i e si salva sul profilo; con l'ultima il portone si apre e si torna nella sala. */
  async function inserisciChiave(i, c) {
    const g = portoneGeo, kd = chiaveDisegnata(c), [x, y] = g.posti[i];
    vicino.inCorso = true;
    $('e-avviso').hidden = true;
    renderVicino();
    if (kd) {
      const v = { i, kd, x, y: g.altezza + kd.h - kd.cy + 2, fase: 'sale', piega: 0, giro: 0, dentro: 0 };
      vicino.chiave = v;
      // 1. Sale da sotto, intera, brillando, fino a poco sotto la serratura.
      const da = v.y, sotto = y + 12;
      await anima(1100, 'ease-in-out', (e) => { v.y = da + (sotto - da) * e; });
      // 2. Si gira verso la toppa: il gambo si accorcia a scatti sotto la testa, e la testa sale sulla toppa.
      v.fase = 'gira';
      await anima(360, 'linear', (e) => { v.piega = Math.min(1, Math.floor(e * 4) / 3); v.y = sotto + (y - sotto) * e; });
      // 3. Entra, 4. gira.
      v.fase = 'entra';
      v.piega = 1;
      v.y = y;
      await anima(200, 'linear', (e) => { v.dentro = e; });
      v.fase = 'ruota';
      await anima(420, 'linear', (e) => { v.giro = e; });
      vicino.chiave = null;
    }
    giro.inserite.push(c.stanzaId);
    salvaGiro();
    renderZaino(contoChiavi());
    vicino.lampo = { i, e: 0 };
    await anima(380, 'linear', (e) => { vicino.lampo.e = e; });
    vicino.lampo = null;
    const conto = contoChiavi();
    portoneAperto = conto.aperta;
    if (conto.aperta) {
      renderVicino();
      // Un attimo con gli occhi del teschio accesi, poi le ante scivolano via.
      await new Promise((ok) => setTimeout(ok, muovere() ? 700 : 0));
      vicino.apertura = 0;
      await anima(1600, 'ease-in-out', (e) => { vicino.apertura = e; });
      avvisa('Il portone si è aperto: la salita per la Sala del tesoro è libera!');
      await new Promise((ok) => setTimeout(ok, muovere() ? 1000 : 0));
      vicino.inCorso = false;
      chiudiPortone();
      return;
    }
    vicino.inCorso = false;
    renderVicino();
    avvisa(`Chiavi nel portone: ${conto.inserite} su ${conto.servono}.`);
    $('e-vicino-serrature').querySelector('[data-stato="pronta"]')?.focus();
  }

  /** La zucca va davanti al portone, la telecamera si avvicina, e la scena passa al portone da vicino. */
  async function apriPortone() {
    const g = pianta.geo, sr = g?.serrature;
    if (inCammino || vicino || !sr || !portoneGeo || giro.stanza !== sr.stanza) return;
    inCammino = true;
    $('e-avviso').hidden = true;
    $('e-scorri').hidden = true;
    $('e-frecce').classList.add('in-cammino');
    $('e-uscite').querySelectorAll('button').forEach((b) => { b.disabled = true; });
    const qui = g.stanze[giro.stanza];
    await cammina(scena.zucca.p ?? qui.centro, sr.davanti);
    const [L] = g.schermo, [rx, ry, rw, rh] = sr.zoom;
    const camDa = { ...scena.viste[0].cam }, camZoom = { x: rx + rw / 2, y: ry + rh / 2, k: L / rw };
    await anima(650, 'ease-in-out', (e) => { scena.viste[0].cam = fraCamere(camDa, camZoom, e); });
    await buio(true);
    vicino = { chiave: null, lampo: null, apertura: null, inCorso: false, camZoom };
    inCammino = false;
    $('e-frecce').classList.remove('in-cammino');
    renderEsplora();
    await buio(false);
    ($('e-vicino-serrature').querySelector('[data-stato="pronta"]') ?? $('e-vicino-torna')).focus();
  }

  /** Dal portone da vicino si torna nella sala: la telecamera si allontana e la zucca torna al centro. */
  async function chiudiPortone() {
    if (!vicino || vicino.inCorso || inCammino) return;
    const g = pianta.geo, sr = g.serrature, qui = g.stanze[giro.stanza];
    inCammino = true;
    $('e-frecce').classList.add('in-cammino');
    $('e-uscite').querySelectorAll('button').forEach((b) => { b.disabled = true; });
    await buio(true);
    const camZoom = vicino.camZoom;
    vicino = null;
    renderVicino();
    scena.viste = [vista(giro.stanza, camZoom)];
    posiziona(sr.davanti);
    disegnaScena();
    await buio(false);
    await anima(650, 'ease-in-out', (e) => { scena.viste[0].cam = fraCamere(camZoom, camPer(giro.stanza, sr.davanti), e); });
    await cammina(sr.davanti, qui.centro);
    inCammino = false;
    $('e-frecce').classList.remove('in-cammino');
    renderEsplora();
  }
  $('e-vicino-torna').addEventListener('click', () => chiudiPortone());

  /** Da un punto della scena (in pixel della pagina) al punto della sala in cui sei. */
  function puntoNellaSala(ev) {
    const v = scena.viste[0];
    if (!v || !pianta.geo) return null;
    const r = $('e-scena').getBoundingClientRect(), { z, ox, oy } = inquadratura();
    const [L, A] = pianta.geo.schermo;
    const sx = (ev.clientX - r.left - ox) / z, sy = (ev.clientY - r.top - oy) / z;
    return [(sx - L / 2 - v.dx) / v.cam.k + v.cam.x, (sy - A / 2 - v.dy) / v.cam.k + v.cam.y];
  }
  /** true se il puntatore è sul portone delle serrature, nella sala dove sta e senza niente in corso. */
  function sulPortone(ev) {
    const sr = pianta.geo?.serrature;
    if (!sr || vicino || inCammino || !portoneGeo || scena.viste.length !== 1 || scena.viste[0].stanza !== sr.stanza) return false;
    const p = puntoNellaSala(ev);
    const [x, y, w, h] = sr.portone;
    return Boolean(p) && p[0] >= x - 4 && p[0] <= x + w + 4 && p[1] >= y - 8 && p[1] <= y + h + 2;
  }

  async function vai(u) {
    if (inCammino) return;
    if (u.premio) {
      avvisa('La porta d’oro si apre quando risolvi gli ultimi rompicapi della Sala del tesoro: dietro c’è il premio finale.');
      return;
    }
    const g = pianta.geo;
    const { servono, inserite, aperta } = contoChiavi();
    // Le chiavi servono per salire; per scendere no. Col portone chiuso la zucca ci va davanti e lo guardi da vicino.
    if (u.salita && g.stanze[u.a].piano === 'primo-piano' && !aperta) {
      if (portoneGeo) return apriPortone();
      avvisa(`Il portone è chiuso: servono tutte e ${servono} le chiavi di diamante nelle serrature. Ne hai inserite ${inserite}.`);
      return;
    }
    const da = giro.stanza;
    const focoQui = $('e-uscite').contains(document.activeElement);
    inCammino = true;
    $('e-avviso').hidden = true;
    $('e-scorri').hidden = true;
    $('e-frecce').classList.add('in-cammino');
    $('e-uscite').querySelectorAll('button').forEach((b) => { b.disabled = true; });
    // 1. La zucca va alla porta.
    await cammina(g.stanze[da].centro, u.punto);
    giro.stanza = u.a;
    ricordaGiro();
    renderEsplora();
    if (u.salita) {
      // 2a. Sulla scala: buio, cambio di piano, e si riaccende in cima (o in fondo).
      await buio(true);
      scena.viste = [vista(u.a, camPer(u.a, u.arrivo))];
      posiziona(u.arrivo);
      disegnaScena();
      await buio(false);
    } else if (u.zoom) {
      // 2b. L'area bar: si ingrandisce entrando, si rimpicciolisce uscendo.
      await (u.entra ? ingrandisci(da, u.a, u.zoom, u.arrivo) : rimpicciolisci(da, u.a, u.zoom, u.arrivo));
    } else {
      // 2c. La scena scorre verso la sala dopo.
      await scorri(da, u.a, u.verso, u.punto, u.arrivo);
    }
    // 3. La zucca entra nella sala.
    await cammina(u.arrivo, g.stanze[u.a].centro);
    inCammino = false;
    $('e-frecce').classList.remove('in-cammino');
    renderEsplora();
    // Da tastiera si resta sull'uscita che riporta indietro.
    if (focoQui) $('e-uscite').querySelector(`[data-a="${da}"]`)?.focus();
  }

  /** Nelle sale più alte dello schermo si scorre con la rotella o trascinando; true se la scena si è mossa. */
  function scorriSala(dy) {
    if (inCammino || vicino || !pianta.geo || !scena.viste[0]) return false;
    const v = scena.viste[0];
    const A = pianta.geo.schermo[1], H = altezzaSala(v.stanza);
    if (H <= A) return false;
    const y = limita(v.cam.y + dy, A / 2, H - A / 2);
    if (y === v.cam.y) return false;
    v.cam = { ...v.cam, y };
    disegnaScena();
    renderUscite(contoChiavi());
    return true;
  }
  $('e-scena').addEventListener('wheel', (ev) => { if (scorriSala(ev.deltaY * 0.5)) ev.preventDefault(); }, { passive: false });
  let trascinando = null;
  let tocco = null; // dove è cominciato l'ultimo tocco: se poi il dito si è mosso, non è un clic sul portone
  $('e-scena').addEventListener('pointerdown', (ev) => {
    tocco = { x: ev.clientX, y: ev.clientY };
    if (ev.target.closest('button') || vicino || !scena.viste[0] || !salaAlta(scena.viste[0].stanza)) return;
    trascinando = { id: ev.pointerId, y: ev.clientY };
    $('e-scena').setPointerCapture(ev.pointerId);
  });
  $('e-scena').addEventListener('pointermove', (ev) => {
    if (!trascinando) $('e-scena').classList.toggle('su-portone', ev.pointerType === 'mouse' && sulPortone(ev));
    if (!trascinando || ev.pointerId !== trascinando.id) return;
    scorriSala(-(ev.clientY - trascinando.y) / inquadratura().z);
    trascinando.y = ev.clientY;
  });
  // Toccando il portone delle serrature nell'Ingresso: chiuso lo guardi da vicino, aperto si sale.
  $('e-scena').addEventListener('click', (ev) => {
    if (ev.target.closest('button') || (tocco && Math.hypot(ev.clientX - tocco.x, ev.clientY - tocco.y) > 6) || !sulPortone(ev)) return;
    $('e-scena').classList.remove('su-portone');
    const salita = uscite(giro.stanza).find((u) => u.salita);
    if (contoChiavi().aperta && salita) vai(salita);
    else apriPortone();
  });
  const fineTrascina = () => { trascinando = null; };
  $('e-scena').addEventListener('pointerup', fineTrascina);
  $('e-scena').addEventListener('pointercancel', fineTrascina);

  function sagoma(s) {
    const palette = {};
    for (const k of Object.keys(s.palette)) palette[k] = k === 'k' ? '#0c0812' : '#3a3150';
    return { ...s, palette };
  }

  function brilla(t) {
    if (!lampo) return;
    const { ctx, frames } = lampo;
    lampo.inizio ??= t;
    const f = Math.floor(((t - lampo.inizio) / 1000) * 8);
    const finito = f >= frames.length * 2 || $('vista-esplora').hidden;
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    ctx.drawImage(frames[finito ? 0 : f % frames.length], 0, 0);
    if (finito) lampo = null;
    else requestAnimationFrame(brilla);
  }

  function renderZaino(conto) {
    renderHud(conto);
    const { chiavi, servono, prese } = conto;
    $('e-conto').textContent = `${prese} su ${servono}` + (conto.inserite ? ` · ${conto.inserite} nel portone` : '');
    if (!chiavi.length) {
      $('e-zaino').replaceChildren(el('p', null, db ? 'Le chiavi compaiono appena l’archivio risponde.' : 'Le chiavi stanno nell’archivio, che si apre dentro Claude.'));
      return;
    }
    const nuova = lampo?.stanzaId;
    $('e-zaino').replaceChildren(...chiavi.map((c) => {
      const presa = giro.chiavi.includes(c.stanzaId);
      const fig = el('figure', presa ? 'presa' : '');
      const tela = document.createElement('canvas');
      if (c.s) {
        tela.width = c.s.w;
        tela.height = c.s.h;
        const ctx = tela.getContext('2d');
        ctx.drawImage(telaFotogramma(presa ? c.s : sagoma(c.s), c.s.frames[0]), 0, 0);
        if (presa && c.stanzaId === nuova) {
          lampo.ctx = ctx;
          lampo.frames = c.s.frames.map((f) => telaFotogramma(c.s, f));
        }
      }
      tela.setAttribute('role', 'img');
      tela.setAttribute('aria-label', `${c.nome || 'Chiave'}: ${presa ? 'presa' : 'ancora da prendere'}`);
      const didascalia = el('figcaption', null, datiStanza(c.stanzaId).nome);
      if (giro.inserite.includes(c.stanzaId)) didascalia.append(el('span', 'nel-portone', 'nel portone'));
      fig.append(tela, didascalia);
      return fig;
    }));
    if (!lampo?.ctx || !muovere()) lampo = null;
    else if (!lampo.inCorso) {
      lampo.inCorso = true;
      requestAnimationFrame(brilla);
    }
  }

  function renderLato(conto) {
    const g = pianta.geo;
    const chiave = conto.chiavi.find((c) => c.stanzaId === giro.stanza);
    const presa = giro.chiavi.includes(giro.stanza);
    $('e-completa').disabled = !g || !chiave || presa || inCammino;
    const piano = g?.stanze[giro.stanza]?.piano;
    $('e-completa-nota').textContent = !g ? ''
      : !chiave ? (piano === 'primo-piano' ? 'Qui ci sono gli ultimi rompicapi e il premio finale: nessuna chiave da prendere.' : 'Qui non ci sono chiavi da prendere.')
        : presa ? `La chiave di ${chiave.gemma || 'questa sala'} è già tua.`
          : `Fai finta di aver risolto i rompicapi di questa sala e prendi la chiave di ${chiave.gemma || 'diamante'}.`;
  }

  function testoFreccia(u, conto) {
    if (u.premio) return 'Premio finale';
    if (u.salita) {
      if (pianta.geo.stanze[u.a].piano === 'piano-terra') return 'Scendi all’Ingresso';
      if (conto.aperta) return 'Salita';
      const n = conto.daInserire.length;
      return n ? `Inserisci ${n === 1 ? 'la chiave' : n + ' chiavi'}` : `Portone · ${conto.inserite}/${conto.servono}`;
    }
    return nomeSala(u.a);
  }

  function renderUscite(conto) {
    const g = pianta.geo;
    const qui = g.stanze[giro.stanza];
    const { w, h } = misuraScena();
    const lista = uscite(giro.stanza).map((u) => ({
      u,
      chiusa: u.premio || (u.salita && !conto.aperta && qui.piano === 'piano-terra'),
      testo: testoFreccia(u, conto),
    }));
    // Le frecce sulla scena sono per il dito e il mouse; tastiera e lettori di schermo usano l'elenco sotto.
    // Una porta fuori dall'inquadratura (nelle sale grandi) ha la freccia sul bordo della scena.
    $('e-frecce').replaceChildren(...lista.map(({ u, chiusa, testo }) => {
      const [sx, sy] = sulloSchermo(u.punto);
      const x = limita(sx, 22, w - 22), y = limita(sy, 22, h - 22);
      const b = el('button', `freccia verso-${u.verso}${chiusa ? ' chiusa' : ''}`);
      b.type = 'button';
      b.tabIndex = -1;
      b.setAttribute('aria-hidden', 'true');
      b.title = testo;
      b.style.left = x + 'px';
      b.style.top = y + 'px';
      b.innerHTML = chiusa ? SVG_LUCCHETTO : SVG_FRECCIA;
      // L'etichetta va dalla parte verso cui si va, così non copre la sala; vicino ai bordi rientra.
      const sopraSotto = u.verso === 'su' || (u.salita && qui.piano === 'piano-terra') ? (y < 60 ? '' : ' sopra') : (y > h - 50 ? ' sopra' : '');
      const rientro = x < 90 ? ' a-sx' : x > w - 90 ? ' a-dx' : '';
      const largo = testo.length * 7 + 40; // quanto occupa, circa, l'etichetta con la freccia accanto
      const posto = u.verso === 'dx' && x + largo < w ? ' lato'
        : u.verso === 'sx' && x - largo > 0 ? ' lato-sx' : sopraSotto + rientro;
      b.append(el('span', 'freccia-nome' + posto, testo));
      b.addEventListener('click', () => vai(u));
      return b;
    }));
    const icona = { su: 'M3 7l4-4 4 4M7 3v9', giu: 'M3 7l4 4 4-4M7 2v9', sx: 'M7 3L3 7l4 4M3 7h9', dx: 'M7 3l4 4-4 4M2 7h9' };
    $('e-uscite').replaceChildren(...(lista.length ? [el('span', 'k', 'Uscite')] : []), ...lista.map(({ u, chiusa, testo }) => {
      const b = el('button', 'btn');
      b.type = 'button';
      if (u.a) b.dataset.a = u.a;
      b.innerHTML = chiusa ? SVG_LUCCHETTO
        : `<svg viewBox="0 0 14 14" aria-hidden="true"><path d="${icona[u.verso]}" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="square"/></svg>`;
      b.append(testo);
      b.setAttribute('aria-label', u.premio ? 'Porta d’oro del premio finale: chiusa'
        : chiusa ? `Salita per la Sala del tesoro: chiusa, servono ${conto.servono} chiavi di diamante e ne hai ${conto.prese}`
          : `Vai: ${testo}`);
      b.addEventListener('click', () => vai(u));
      return b;
    }));
  }

  function renderEsplora() {
    const g = pianta.geo;
    const conto = contoChiavi();
    ordineSerrature = conto.chiavi.map((c) => c.stanzaId);
    portoneAperto = conto.aperta;
    const vuota = $('e-vuota');
    if (g && !g.stanze[giro.stanza]) giro.stanza = INIZIO;
    if (!g || !pianta.immagine) {
      vuota.textContent = !db ? 'La mappa si apre dentro Claude, con l’accesso fatto.'
        : pianta.caricata ? 'La mappa non è ancora nell’archivio.' : 'Carico la mappa…';
      vuota.hidden = false;
      scena.viste = [];
      disegnaScena();
      $('e-frecce').replaceChildren();
      $('e-uscite').replaceChildren();
      $('e-nome').textContent = 'Mappa del posto';
      renderZaino(conto);
      renderLato(conto);
      return;
    }
    vuota.hidden = true;
    const qui = g.stanze[giro.stanza];
    $('e-nome').replaceChildren(nomeSala(giro.stanza), el('span', null, qui.piano === 'primo-piano' ? 'primo piano' : 'piano terra'));
    renderZaino(conto);
    renderLato(conto);
    // Davanti al portone da vicino: niente frecce né scorrimento, sotto la scena solo «Torna all'Ingresso».
    if (vicino) {
      $('e-frecce').replaceChildren();
      $('e-scorri').hidden = true;
      $('e-scena').classList.remove('alta', 'su-portone');
      const torna = el('button', 'btn', 'Torna all’Ingresso');
      torna.type = 'button';
      torna.disabled = vicino.inCorso;
      torna.addEventListener('click', () => chiudiPortone());
      $('e-uscite').replaceChildren(el('span', 'k', 'Portone'), torna);
      renderVicino();
      disegnaScena();
      avviaScena();
      return;
    }
    // Mentre la zucca cammina, la scena la muove vai().
    if (inCammino) return;
    scena.viste = [vista(giro.stanza, camPer(giro.stanza, qui.centro))];
    posiziona(qui.centro);
    // Nelle sale più alte dello schermo si può scorrere: lo dice un cartellino, e sul telefono il dito non scorre la pagina.
    const alta = salaAlta(giro.stanza);
    $('e-scorri').hidden = !alta;
    $('e-scena').classList.toggle('alta', alta);
    disegnaScena();
    avviaScena();
    renderUscite(conto);
  }

  function caricaPianta() {
    db.collection('pianta').onSnapshot((snap) => {
      const docs = Object.fromEntries(snap.docs.map((d) => [d.id, d.data()]));
      pianta = { caricata: true, geo: geometriaValida(docs.geometria), immagine: immagineValida(docs.sale) };
      animi = animazioniValide(docs.animazioni);
      portoneGeo = portoneValido(docs.portone);
      if (portoneGeo) foglioAnimi(portoneGeo.url);
      if (!portoneGeo) vicino = null;
      immagineSale();
      renderEsplora();
    }, () => {
      pianta = { ...pianta, caricata: true };
      renderEsplora();
    });
  }

  $('e-completa').addEventListener('click', () => {
    const chiave = contoChiavi().chiavi.find((c) => c.stanzaId === giro.stanza);
    if (!chiave || giro.chiavi.includes(giro.stanza) || inCammino) return;
    giro.chiavi.push(giro.stanza);
    salvaGiro();
    lampo = { stanzaId: giro.stanza };
    renderEsplora();
    const { prese, servono } = contoChiavi();
    avvisa(prese >= servono ? 'Hai tutte le chiavi: inseriscile nel portone dell’Ingresso!' : `Hai preso la ${chiave.nome || 'chiave'}! Inseriscila nel portone dell’Ingresso.`);
  });
  $('e-ricomincia').addEventListener('click', () => {
    if (inCammino || vicino?.inCorso) return;
    // Per le prove: si riparte dalla strada senza chiavi, anche sul profilo.
    giro = { stanza: INIZIO, chiavi: [], inserite: [] };
    vicino = null;
    renderVicino();
    salvaGiro();
    $('e-avviso').hidden = true;
    renderEsplora();
  });
  document.addEventListener('keydown', (ev) => {
    if ($('vista-esplora').hidden || !pianta.geo || ev.altKey || ev.ctrlKey || ev.metaKey || ev.target.closest('input, textarea, select, dialog')) return;
    if (vicino) {
      if (ev.key === 'Escape') {
        ev.preventDefault();
        ev.stopImmediatePropagation();
        chiudiPortone();
      }
      return;
    }
    const verso = { ArrowUp: 'su', ArrowDown: 'giu', ArrowLeft: 'sx', ArrowRight: 'dx' }[ev.key];
    const u = verso && uscite(giro.stanza).find((x) => x.verso === verso && !x.premio);
    if (!u) return;
    ev.preventDefault();
    vai(u);
  });
  // ── Visuale di gioco: la scena a schermo intero (come al computer) o dentro la sagoma di un telefono ──
  // Il riquadro della scena cambia forma e il disegno si adatta da solo: la finestra 320×200 resta intera, con le
  // bande nere dove lo schermo è più largo. Sopra, come nel gioco: nome della sala, le sei chiavi, Esci.
  let modoGioco = '';
  const palco = () => document.querySelector('#vista-esplora .esplora-main');

  function renderHud(conto = contoChiavi()) {
    if (!modoGioco) return;
    $('e-hud-nome').textContent = pianta.geo?.stanze[giro.stanza] ? nomeSala(giro.stanza) : '';
    $('e-hud-chiavi').replaceChildren(...conto.chiavi.map((c) => {
      const i = el('i', giro.inserite.includes(c.stanzaId) ? 'presa inserita' : giro.chiavi.includes(c.stanzaId) ? 'presa' : '');
      i.style.setProperty('--c', c.s?.palette.g || '#ffffff');
      return i;
    }));
    $('e-hud-chiavi').setAttribute('aria-label', `Chiavi: ${conto.prese} su ${conto.servono}, ${conto.inserite} nel portone`);
  }

  function apriGioco(modo) {
    modoGioco = modo;
    const p = palco();
    p.classList.add('gioco');
    p.classList.toggle('telefono', modo === 'telefono');
    $('e-hud').hidden = false;
    // A schermo intero davvero, se il browser lo permette; altrimenti la scena riempie la finestra della pagina.
    if (modo === 'pieno' && p.requestFullscreen && !document.fullscreenElement) {
      p.requestFullscreen({ navigationUI: 'hide' })
        .then(() => screen.orientation?.lock?.('landscape'))
        .catch(() => { /* resta a tutta finestra */ });
    }
    $('e-esci').focus();
    renderEsplora();
  }
  function chiudiGioco() {
    if (!modoGioco) return;
    modoGioco = '';
    palco().classList.remove('gioco', 'telefono');
    $('e-hud').hidden = true;
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    renderEsplora();
  }
  $('e-pieno').addEventListener('click', () => apriGioco('pieno'));
  $('e-telefono').addEventListener('click', () => apriGioco('telefono'));
  $('e-esci').addEventListener('click', chiudiGioco);
  // Uscendo dallo schermo intero con il tasto Esc del browser, si torna alla pagina.
  document.addEventListener('fullscreenchange', () => { if (!document.fullscreenElement && modoGioco === 'pieno') chiudiGioco(); });
  document.addEventListener('keydown', (ev) => { if (modoGioco && ev.key === 'Escape') chiudiGioco(); });

  // La scena cambia misura con la finestra: scena e frecce si ricalcolano.
  new ResizeObserver(() => { if (!$('vista-esplora').hidden && !inCammino) renderEsplora(); }).observe($('e-scena'));
  renderEsplora();

  Promise.all([leggi('stanze'), leggi('oggetti')]).then(([s, o]) => {
    stanze = Object.entries(s).map(([id, d]) => ({ id, ...d }));
    oggetti = Object.entries(o).map(([id, d]) => ({ id, ...d }));
    renderEsplora();
  }).catch(() => {});
  caricaPianta();
  renderEsplora();
})();
