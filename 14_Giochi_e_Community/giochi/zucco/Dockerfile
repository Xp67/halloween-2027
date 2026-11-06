# Il gioco è fatto di soli file statici. pixelfx è fissato allo stesso commit di package-lock.json,
# ma preso via HTTPS perché nella build non c'è una chiave SSH per GitHub.
FROM alpine:3.20 AS pixelfx
ADD https://github.com/patch-gg/pixelfx/archive/a84159688af3ca37a4be05a0d422b94451b2e24e.tar.gz /tmp/pixelfx.tar.gz
RUN mkdir /pixelfx && tar -xzf /tmp/pixelfx.tar.gz -C /pixelfx --strip-components=1

FROM nginx:1.27-alpine AS web
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY index.html stile.css /usr/share/nginx/html/
COPY src /usr/share/nginx/html/src
COPY assets /usr/share/nginx/html/assets
COPY --from=pixelfx /pixelfx/src /usr/share/nginx/html/node_modules/pixelfx/src
COPY --from=pixelfx /pixelfx/LICENSE /usr/share/nginx/html/node_modules/pixelfx/LICENSE

# La classifica della versione di prova: rigioca le partite con lo stesso sim.js del browser.
FROM node:22-alpine AS classifica
WORKDIR /app
COPY package.json ./
COPY src src
COPY server server
RUN mkdir /dati && chown node /dati
USER node
ENV FILE_CLASSIFICA=/dati/classifica.json
CMD ["node", "server/avvia.mjs"]
