# 15 · Sito e Infrastruttura

Dove e come gira il sito (biglietti, PR, giochi). *Proposta del 2026-11-04, da confermare.*

## Decisione

- Il sito è il progetto **GetInvolved** (`github.com/Xp67/GetInvolved`): Django + React + PostgreSQL.
- Gira sullo **stesso server** di ELEFIX ma **a parte**, come il networker: **non** è un'istanza ELEFIX e non dipende da ELEFIX.
  - Cartella sua: `/opt/getinvolved`, accanto a `/opt/elefix`.
  - **Cloudflare Tunnel suo**, con un container `cloudflared` nel suo compose.
  - Ingresso suo (nginx del frontend). Niente Caddy di ELEFIX, niente rete `elefix_proxy`, niente label.
  - Database suo.
- Si aggiorna **come c4shopper**: `git pull` nella cartella e riavvio dei container. Niente manifest, provisioning o pipeline.

Se ELEFIX va giù o si aggiorna, il sito resta online; vale anche il contrario. L'unica cosa in comune è la macchina: CPU, RAM e disco.

## Schema

```
Internet ──HTTPS──▶ Cloudflare ──tunnel "getinvolved"──▶ cloudflared  (container di questo progetto)
                                                           │
                                                           ▼
                                              frontend :80  (nginx)
                                     ┌─────────────┴──────────────┐
                    /api/  /admin/  /static/  /media/  /healthz    tutto il resto
                                     ▼                             ▼
                          backend :8080 (gunicorn)       file della SPA React
                                     │
                                     ▼
                               db (PostgreSQL 16)

Tutto su una rete Docker privata del progetto: nessuna porta aperta sull'host,
nessuna rete condivisa con ELEFIX.

ELEFIX, in parallelo e senza contatti:  Cloudflare ──tunnel ELEFIX──▶ caddy:80 ──▶ ELEFIX / vetrina
```

nginx fa da unico ingresso: serve il frontend e passa al backend i percorsi delle API. Un solo dominio, quindi niente CORS, e il webhook Stripe sta sullo stesso indirizzo del sito.

## Dominio

| | Valore proposto | Note |
|---|---|---|
| Sito | `eventi.getinvolvd.com` | Generico: serve anche per eventi futuri. Halloween sta a `eventi.getinvolvd.com/e/<evento>` |
| Staging | `eventi-staging.getinvolvd.com` | Con chiavi Stripe di test |
| Dominio della festa (facoltativo) | es. un `.it` dedicato | Si aggiunge dopo come secondo public hostname dello stesso tunnel |

- Il sottodominio sta nella stessa zona Cloudflare di `getinvolvd.com`, ma punta al **tunnel nuovo**. Un record specifico (`eventi`) ha la precedenza su un eventuale jolly `*.getinvolvd.com` di ELEFIX.
- **Da non usare:** `getinvolvd.com` e `www`, che sono il sito vetrina di ELEFIX. Oggi `.env.example` e `docker-compose.yml` di GetInvolved puntano a `getinvolvd.com` e `api.getinvolvd.com`: vanno cambiati.

## Cartelle sul server

```
/opt/elefix/                  ELEFIX (non si tocca)
/opt/getinvolved/             produzione: clone del repo, branch main
    .env                      configurazione e segreti, compreso il token del tunnel (mai nel repo)
    secrets/                  chiave del service account Google Wallet (sola lettura)
    media/                    eventuali file caricati
/opt/getinvolved-staging/     staging: stesso repo, altro .env, altro tunnel
/mnt/backups/getinvolved/     dump notturni del database
```

## Container

Proposta di `docker-compose.yml` per il server:

```yaml
# GetInvolved in produzione. Gira a parte rispetto a ELEFIX: tunnel Cloudflare
# suo, nessuna porta sull'host, nessuna rete condivisa.
# Si deploya a mano con `git pull && docker compose build && docker compose up -d`.
name: ${GI_PROJECT:-getinvolved}

services:
  tunnel:
    image: cloudflare/cloudflared:2024.12.2
    command: tunnel --no-autoupdate run
    environment:
      TUNNEL_TOKEN: ${CLOUDFLARE_TUNNEL_TOKEN}
    depends_on: [frontend]
    restart: unless-stopped

  frontend:
    build:
      context: ./frontend
      args:
        VITE_API_URL: ""                 # stesso dominio: le chiamate vanno a /api/...
    depends_on: [backend]
    restart: unless-stopped

  backend:
    build: ./backend
    env_file: .env
    environment:
      DB_HOST: db
    volumes:
      - ./media:/app/media
      - ./secrets:/secrets:ro
    depends_on:
      db:
        condition: service_healthy
    restart: unless-stopped
    deploy:
      resources:
        limits:
          memory: 1g                    # un picco di vendite non deve togliere memoria a ELEFIX

  db:
    image: postgres:16-alpine
    env_file: .env
    volumes:
      - db_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U $${POSTGRES_USER}"]
      interval: 5s
      retries: 10
    restart: unless-stopped

volumes:
  db_data:
```

`frontend/nginx.conf` (nuovo):

```nginx
server {
    listen 80;
    root /usr/share/nginx/html;
    client_max_body_size 10m;

    location ~ ^/(api|admin|static|media|healthz)(/|$) {
        proxy_pass http://backend:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-For $http_cf_connecting_ip;   # IP vero del cliente, da Cloudflare
        proxy_set_header X-Forwarded-Proto https;                  # TLS terminato da Cloudflare
    }

    location /assets/ {
        add_header Cache-Control "public, max-age=31536000, immutable";
    }

    location / {
        try_files $uri /index.html;                                # SPA: /e/3, /biglietti/<token> ...
    }
}
```

- `GI_PROJECT` nel `.env` distingue produzione e staging (`getinvolved` / `getinvolved-staging`): container, rete e volumi hanno nomi diversi e non si toccano.
- Sono spariti i nomi fissi dei container e le porte sull'host (`127.0.0.1:3000`, `127.0.0.1:8080`) del compose attuale: con il tunnel dentro il compose non servono.
- `cloudflared` raggiunge `frontend` per nome sulla rete privata del progetto.

## Modifiche da fare nel repo GetInvolved

Da fare quando la biglietteria (branch `feature/biglietteria`, ancora senza commit) è finita, per non sovrapporsi al lavoro in corso:

| # | Modifica | Perché |
|---|---|---|
| 1 | `frontend/nginx.conf` come sopra, copiato nel Dockerfile del frontend | Oggi ricaricare `/e/3` o `/biglietti/<token>` dà 404, e nginx deve fare da ingresso per le API |
| 2 | `docker-compose.yml` come sopra, con `.env.example` aggiornato (`GI_PROJECT`, `CLOUDFLARE_TUNNEL_TOKEN`, host nuovo) | Tunnel suo, nessuna dipendenza da ELEFIX |
| 3 | Entrypoint del backend: `migrate`, `collectstatic`, poi gunicorn | Le migrazioni girano da sole all'avvio |
| 4 | Gunicorn con `--workers 3 --timeout 60` | Oggi gira con 1 worker: all'apertura dell'early bird le richieste si mettono in coda, e la generazione dei PDF rallenta tutti |
| 5 | Impostazioni di produzione: `DEBUG=False` di default, `ALLOWED_HOSTS` e `CSRF_TRUSTED_ORIGINS` dall'env, `SECURE_PROXY_SSL_HEADER`, cookie `Secure`, CORS chiuso | Oggi `DEBUG` vale `True` se manca, `ALLOWED_HOSTS` è `*` e `CORS_ALLOW_ALL_ORIGINS=True` |
| 6 | Rotta `/healthz` sul backend | Oggi lo stato è su `/`, che sul dominio unico è la home del frontend |
| 7 | Togliere da git `db.sqlite3`, `__pycache__/` e `frontend/.env` | Sono tracciati: ogni modifica locale finisce nei commit, e `git pull` sul server può dare conflitti |
| 8 | Cambiare la password del database usata nei vecchi commit | `backend/.env` con `DB_PASSWORD` è nella cronologia del repo |
| 9 | README nello stile c4shopper (sotto) + `docs/DEPLOY.md` | Comandi da copiare e incollare |

C'è anche una seconda copia del repo in `Desktop\Progetti\GetInvolved` (febbraio 2026) con commit che non sono in quella della home (`graphic changes`, `Refine EventEdit layout…`). Prima del primo deploy va deciso quale tenere, e i commit utili vanno portati su `main`.

## README stile c4shopper (proposta)

```
-- First time
cp .env.example .env              # poi compila chiavi Stripe, SMTP, segreti
cd backend && python -m venv env && env/Scripts/pip install -r requirements.txt
cd frontend && npm install

-- Run
cd backend && env/Scripts/python manage.py runserver            # http://localhost:8000
cd frontend && npm run dev                                      # http://localhost:5173
stripe listen --forward-to localhost:8000/api/stripe/webhook/   # webhook in locale

-- Test
cd backend && env/Scripts/python manage.py test api

-- Database
cd backend && env/Scripts/python manage.py makemigrations
cd backend && env/Scripts/python manage.py migrate
# Mai modificare una migrazione già applicata in produzione: aggiungerne una nuova.

-- Deploy live: https://eventi.getinvolvd.com/
# Setup iniziale (una volta): docs/DEPLOY.md
cd /opt/getinvolved
git pull
docker compose build
docker compose up -d
docker compose logs -f backend
-- Back
cd /opt/getinvolved && git checkout <commit-buono> && docker compose up -d --build

-- Deploy staging: https://eventi-staging.getinvolvd.com/
cd /opt/getinvolved-staging && git pull && docker compose up -d --build

-- Admin
docker compose exec backend python manage.py createsuperuser

-- Backup
docker compose exec -T db pg_dump -U getinvolved getinvolved | gzip > /mnt/backups/getinvolved/gi-$(date +%F).sql.gz
-- Restore
gunzip -c /mnt/backups/getinvolved/gi-<data>.sql.gz | docker compose exec -T db psql -U getinvolved getinvolved
```

`docker compose build` prima di `up -d` serve a ridurre il tempo in cui il sito è giù: l'immagine si costruisce mentre la versione vecchia è ancora online, poi lo scambio dura pochi secondi.

## Setup iniziale (una volta)

**1. Tunnel su Cloudflare** (Zero Trust → Networks → Tunnels)
- *Create a tunnel* → tipo **Cloudflared** → nome `getinvolved` → copiare il **token**
- *Public Hostname* → `eventi.getinvolvd.com` → servizio `HTTP` → `frontend:80`
- Per lo staging: un secondo tunnel `getinvolved-staging` con `eventi-staging.getinvolvd.com` → `frontend:80`

**2. Server**

```sh
# Codice
sudo mkdir -p /opt/getinvolved /mnt/backups/getinvolved && sudo chown $USER /opt/getinvolved /mnt/backups/getinvolved
git clone https://github.com/Xp67/GetInvolved.git /opt/getinvolved
cd /opt/getinvolved

# Configurazione
cp .env.example .env && nano .env
#   GI_PROJECT=getinvolved
#   CLOUDFLARE_TUNNEL_TOKEN=<token del tunnel>
#   FRONTEND_URL=https://eventi.getinvolvd.com
#   ALLOWED_HOSTS=eventi.getinvolvd.com,backend
#   CSRF_TRUSTED_ORIGINS=https://eventi.getinvolvd.com
#   DJANGO_SECRET_KEY=$(openssl rand -hex 32)
#   DB_PASSWORD / POSTGRES_PASSWORD = stessa password, nuova (non quella dei vecchi commit)
#   STRIPE_SECRET_KEY=sk_live_...   STRIPE_WEBHOOK_SECRET=whsec_...
#   EMAIL_HOST e simili (SMTP del servizio email)
chmod 600 .env
mkdir -p secrets media && chmod 700 secrets

# Avvio
docker compose up -d --build
docker compose logs tunnel | grep -i "registered tunnel connection"
docker compose exec backend python manage.py createsuperuser
curl -sI https://eventi.getinvolvd.com/healthz
```

**3. Stripe:** endpoint webhook `https://eventi.getinvolvd.com/api/stripe/webhook/`. In Cloudflare, `/api/*` va escluso dalla cache e dai controlli anti-bot: una verifica "sei umano?" blocca i webhook di Stripe.

## Servizi esterni

| Servizio | A cosa serve | Note |
|---|---|---|
| Cloudflare | Tunnel dedicato, HTTPS, cache dei file statici | Stesso account e zona di ELEFIX, tunnel diverso |
| Stripe | Pagamenti | Account live, webhook, chiavi solo nel `.env` |
| SMTP transazionale (es. Brevo, Postmark, Amazon SES) | Email con i biglietti | Mittente su `getinvolvd.com`: aggiungere SPF/DKIM in Cloudflare **senza toccare** i record che usa ELEFIX |
| Google Wallet API | Pulsante "Aggiungi a Google Wallet" | Chiave del service account in `secrets/`, mai nel repo |

## Backup

- `pg_dump` ogni notte con cron in `/mnt/backups/getinvolved`, più una copia fuori dal server (rclone verso un cloud).
- Tenere 14 giorni, più un dump **prima di ogni deploy** con migrazioni.
- `media/` va nello stesso backup.
- Provare almeno una volta il ripristino su staging.

## Il picco di vendite

Il momento critico è l'apertura dell'early bird: molti accessi in pochi minuti.

- Cloudflare tiene in cache i file del frontend (`/assets/`): il server riceve soprattutto le chiamate API
- 3 worker gunicorn bastano per qualche centinaio di checkout in pochi minuti; i pagamenti li regge Stripe
- Test di carico su **staging** a luglio 2027 (es. con k6 o Locust), controllando che ELEFIX resti reattivo: la macchina è la stessa
- Limite di memoria sul backend, così un picco non toglie risorse a ELEFIX
- **Niente deploy** nelle 24 ore prima dell'apertura delle vendite e nella settimana della festa

## La sera della festa

- Lo scanner funziona anche **offline** (già fatto): se cade la connessione nel locale o il server, l'ingresso continua
- Prima di aprire le porte: aprire lo scanner su tutti i telefoni con rete buona, così scaricano l'elenco dei biglietti
- Chi ha accesso al server deve essere raggiungibile durante la serata

## Checklist

- [ ] Scelto il dominio (proposta: `eventi.getinvolvd.com`)
- [ ] Scelta la copia del repo da tenere, commit utili portati su `main`
- [ ] Biglietteria finita e su `main`
- [ ] Modifiche 1-9 fatte nel repo
- [ ] Password del database cambiata
- [ ] Tunnel Cloudflare creati (produzione e staging)
- [ ] Staging online con Stripe di test
- [ ] Produzione online
- [ ] Webhook Stripe live configurato e provato
- [ ] SMTP con SPF/DKIM verificati
- [ ] Backup notturno attivo e ripristino provato
- [ ] Test di carico fatto
