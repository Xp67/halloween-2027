# Le demo dei rompicapi: soli file statici, senza build. Nel container demo/ diventa la radice
# e gli sfondi stanno in /sfondi, così ../../sfondi/<stanza>.png di kit.js arriva dove serve.
# La bozza del giro delle sale (esplora/) sta in /esplora.
FROM nginx:1.27-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY demo /usr/share/nginx/html
COPY sfondi/*.png /usr/share/nginx/html/sfondi/
COPY esplora /usr/share/nginx/html/esplora
# Cloudflare tiene in cache del browser per 4 ore i .js e i .css, anche se nginx dice no-cache (vedi Zucco).
# Le demo usano script classici con percorsi relativi: basta aggiungere ?v=<impronta> a ogni src e href
# delle pagine, così una versione nuova ha indirizzi nuovi. L'impronta è l'md5 di tutti i file.
RUN cd /usr/share/nginx/html \
 && rm -f REGOLE_COMUNI.md */ISTRUZIONI.md */verifica.mjs \
 && V=$(find . -type f ! -name '*.html' | sort | xargs cat | md5sum | cut -c1-10) \
 && find . -name index.html -exec sed -i -E "s#(src|href)=\"([^\":]+\.(js|css))\"#\1=\"\2?v=$V\"#g" {} + \
 && grep -q "kit.js?v=$V" _esempio/index.html
