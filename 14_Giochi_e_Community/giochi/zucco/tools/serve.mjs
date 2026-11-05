// Server statico per giocare in locale: npm start, poi http://localhost:5177

import { createReadStream, existsSync, statSync } from "node:fs";
import { createServer } from "node:http";
import { extname, join, normalize, sep } from "node:path";
import { fileURLToPath } from "node:url";

const RADICE = fileURLToPath(new URL("..", import.meta.url));
const PORTA = Number(process.env.PORT) || 5177;
const TIPI = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
};

createServer((richiesta, risposta) => {
  const percorso = decodeURIComponent(new URL(richiesta.url, "http://localhost").pathname);
  const file = normalize(join(RADICE, percorso === "/" ? "index.html" : percorso));
  if (!file.startsWith(RADICE.endsWith(sep) ? RADICE : RADICE + sep) || !existsSync(file) || statSync(file).isDirectory()) {
    risposta.writeHead(404).end("Non trovato");
    return;
  }
  risposta.writeHead(200, { "Content-Type": TIPI[extname(file)] ?? "application/octet-stream", "Cache-Control": "no-store" });
  createReadStream(file).pipe(risposta);
}).listen(PORTA, () => console.log(`La fuga di Zucco: http://localhost:${PORTA}`));
