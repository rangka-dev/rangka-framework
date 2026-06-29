---
status: stable
since: 0.1.0
last-updated: 2026-06-29
description: Production deployment steps and configuration
---

# Deployment

How to run your Rangka application in production.

## 1. Build custom UI

If your project has custom widgets, compile them first:

```bash
rangka build
```

This bundles custom components into `.rangka/` with a manifest. Skip this step if you have no custom widgets.

## 2. Environment variables

Set these in your deployment environment:

```bash
# Required
DATABASE_URL=postgres://user:password@host:5432/rangka_prod

# Optional
PORT=3000
LOG_LEVEL=info
```

Never commit credentials to version control.

## 3. Start the server

```bash
rangka start
```

The server scans your project, connects to PostgreSQL, syncs the schema, and starts listening on port 3000.

## Process management

Use systemd, PM2, or Docker to keep the server running.

**systemd** (`/etc/systemd/system/rangka.service`):

```ini
[Unit]
Description=Rangka
After=network.target postgresql.service

[Service]
Type=simple
User=rangka
WorkingDirectory=/opt/rangka
EnvironmentFile=/opt/rangka/.env
ExecStart=/usr/local/bin/rangka start
Restart=on-failure
RestartSec=5

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl enable rangka
sudo systemctl start rangka
```

**Docker** (`Dockerfile`):

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY . .
RUN npm ci --production
RUN npx rangka build
EXPOSE 3000
CMD ["npx", "rangka", "start"]
```

## 4. Reverse proxy

Put Rangka behind a reverse proxy for TLS termination and compression.

**nginx** (`/etc/nginx/sites-available/rangka`):

```nginx
upstream rangka {
    server 127.0.0.1:3000;
    keepalive 64;
}

server {
    listen 443 ssl http2;
    server_name erp.example.com;

    ssl_certificate     /etc/letsencrypt/live/erp.example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/erp.example.com/privkey.pem;

    location / {
        proxy_pass http://rangka;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Connection "";
        proxy_read_timeout 120s;
    }

    client_max_body_size 10m;

    gzip on;
    gzip_types text/plain application/json application/javascript text/css;
    gzip_min_length 1000;
}

server {
    listen 80;
    server_name erp.example.com;
    return 301 https://$host$request_uri;
}
```

```bash
sudo ln -s /etc/nginx/sites-available/rangka /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

## 5. Production checklist

| Check                                        | Status |
| -------------------------------------------- | ------ |
| `DATABASE_URL` points to production database |        |
| `rangka build` run (if custom widgets exist) |        |
| TLS configured (never run without HTTPS)     |        |
| Process manager restarts on crash            |        |
| Database backups configured                  |        |
| Log rotation configured                      |        |

## Troubleshooting

**"No database config found"** — Ensure `rangka.config.ts` in the project root has database settings.

**"Connection refused" on port 3000** — Check that your firewall or reverse proxy targets the correct port.

**Custom widgets not loading** — Run `rangka build` before `rangka start`. The server serves from `.rangka/` only if it exists.
