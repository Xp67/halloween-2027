// Demo di esempio del kit: non è un rompicapo del catalogo, mostra solo come si usa EscapeDemo.
// Cinque candele con un numero: vanno accese dalla più bassa alla più alta. Un'accensione fuori ordine è un errore
// e spegne tutto.

(function () {
  "use strict";
  const { C, rett, riquadro, testo, intero, mescola } = EscapeDemo;

  const N = 5;
  const PASSO = 44; // distanza fra le candele
  const X0 = 160 - PASSO * 2; // centro della prima candela
  const BASE = 128; // dove poggiano le candele (sopra la barra in basso)

  EscapeDemo.avvia({
    id: "_esempio",
    sfondo: "ingresso",
    velo: 0.5,

    // La variante: cinque numeri diversi fra 1 e 40, in ordine casuale. Dipende solo da rng.
    variante(rng) {
      const numeri = new Set();
      while (numeri.size < N) numeri.add(intero(rng, 1, 40));
      return { numeri: mescola(rng, [...numeri]) };
    },

    crea(g) {
      const { numeri } = g.variante;
      const ordine = [...numeri].map((v, i) => [v, i]).sort((a, b) => a[0] - b[0]).map(([, i]) => i);
      let accese = []; // indici delle candele accese, nell'ordine in cui sono state accese
      let spegnimento = 0; // istante dell'ultimo errore, per il fumo

      function mossa(i) {
        if (!Number.isInteger(i) || i < 0 || i >= N) return { valida: false };
        if (accese.includes(i)) return { valida: false, motivo: "già accesa" };
        if (ordine[accese.length] !== i) {
          accese = [];
          spegnimento = g.tempo;
          g.errore("Fuori ordine: le candele si spengono tutte");
          g.messaggio("Ricomincia dalla candela con il numero più basso.");
          return { errore: true };
        }
        accese.push(i);
        if (accese.length === N) {
          g.messaggio("Tutte accese!");
          g.risolto({ riepilogo: `L'ordine era ${ordine.map((j) => numeri[j]).join(", ")}.` });
          return { risolto: true };
        }
        g.messaggio(`Accesa la ${numeri[i]}. Ne mancano ${N - accese.length}.`);
        return { ok: true };
      }

      // Tocchi: la candela sotto il dito (zona generosa, 30×50 pixel della scena).
      g.tocca(({ tipo, x, y }) => {
        if (tipo !== "giu") return;
        for (let i = 0; i < N; i++) {
          const cx = X0 + i * PASSO;
          if (Math.abs(x - cx) <= 15 && y >= BASE - 50 && y <= BASE + 4) mossa(i);
        }
      });
      g.bottone("Spegni tutto", () => { accese = []; spegnimento = g.tempo; g.messaggio(null); }, { id: "spegni" });
      g.messaggio("Accendi le candele dalla più bassa alla più alta.");

      // Se era già risolto, mostra tutto acceso.
      if (g.giaRisolto) accese = [...ordine];

      g.anima(() => {
        const ctx = g.ctx;
        ctx.clearRect(0, 0, g.larghezza, g.altezza);
        // la mensola
        riquadro(ctx, X0 - 26, BASE, PASSO * 4 + 52, 6, C.legnoChiaro);
        rett(ctx, C.legno, X0 - 25, BASE + 4, PASSO * 4 + 50, 1);
        for (let i = 0; i < N; i++) {
          const cx = X0 + i * PASSO;
          const h = 18 + (numeri[i] % 4) * 3;
          const top = BASE - h;
          riquadro(ctx, cx - 6, top, 12, h, C.pietraChiara);
          rett(ctx, C.pietra, cx + 2, top + 1, 3, h - 2);
          rett(ctx, C.bordo, cx, top - 3, 1, 3); // stoppino
          testo(ctx, String(numeri[i]), cx, top + 4, { piccolo: true, colore: C.bordo, ombra: null, allinea: "centro" });
          if (accese.includes(i)) {
            // fiammella a 8 fps, sfasata per candela
            const f = (g.fotogramma + i * 3) % 4;
            const alta = f === 1 || f === 2 ? 1 : 0;
            rett(ctx, C.fiamma, cx - 2, top - 9 - alta, 5, 6 + alta);
            rett(ctx, C.fiammaChiara, cx - 1, top - 8 - alta, 3, 4 + alta);
            rett(ctx, C.bianco, cx, top - 6, 1, 2);
          } else if (g.tempo - spegnimento < 900 && !g.riduciMovimento) {
            // un filo di fumo dopo lo spegnimento
            const s = Math.floor((g.tempo - spegnimento) / 150);
            rett(ctx, C.pietra, cx + (s % 2), top - 6 - s * 2, 1, 3);
          }
        }
      });

      // L'aggancio per le prove: la stessa funzione che usano i tocchi.
      g.espone({
        gioca: (m) => mossa(m && m.candela),
        statoGioco: () => ({ accese: [...accese] }),
        posizione: (i) => ({ x: X0 + i * PASSO, y: BASE - 10 }),
      });
    },
  });
})();
