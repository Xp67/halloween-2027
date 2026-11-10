// Il container della classifica: risponde solo a nginx, che gli passa /api/classifica.

import { createServer } from "node:http";

import { creaClassifica, gestisci } from "./classifica.mjs";

const classifica = creaClassifica(process.env.FILE_CLASSIFICA);

createServer((richiesta, risposta) => gestisci(classifica, richiesta, risposta)).listen(8080, () =>
  console.log("Classifica di Zucco in ascolto sulla porta 8080"),
);
