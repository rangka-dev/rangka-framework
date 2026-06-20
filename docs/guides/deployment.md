---
status: stable
since: 0.1.0
last-updated: 2026-06-12
description: Production deployment steps and configuration
---

# Deployment

This guide covers running your Rangka application in production behind a reverse proxy.

## 1. Build Custom UI (if applicable)

If your project has custom views, fields, or cards, compile them first:

```bash
rangka build
```

This bundles custom components into `.rangka/` with a manifest. If you have no custom UI, skip this step.

## 2. Environment Variables

Create a `.env` file or set these in your deployment environment:

```bash
# Required
DATABASE_URL=postgres://user:password@host:5432/rangka_prod

# Optional
PORT=3000
LOG_LEVEL=info                    # debug, info, warn, error
```

> **Security:** Never commit `.env` to version control.

## 3. Start the Server

```bash
rangka start
```

The server scans your project, connects to PostgreSQL, syncs the schema, and starts listening on port 3000.

For process management, use systemd, PM2, or Docker:

**systemd unit** (`/etc/systemd/system/rangka.service`):

```ini
[Unit]
Description=Rangka ERP
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
FROM node:18-alpine
WORKDIR /app
COPY . .
RUN npm ci --production
RUN npx rangka build
EXPOSE 3000
CMD ["npx", "rangka", "start"]
```

## 4. Reverse Proxy Setup

Put Rangka behind a reverse proxy for TLS termination, compression, and static asset caching.

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

    # API requests
    location /api/ {
        proxy_pass http://rangka;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Connection "";
        proxy_read_timeout 120s;
    }

    # SPA fallback — all other routes serve index.html
    location / {
        proxy_pass http://rangka;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Connection "";
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

Enable the site:

```bash
sudo ln -s /etc/nginx/sites-available/rangka /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

## 5. Production Checklist

Before going live, verify:

- [ ] `DATABASE_URL` points to the production database
- [ ] `rangka build` has been run (if you have custom UI)
- [ ] TLS is configured (never run without HTTPS in production)
- [ ] Process manager restarts the server on crash
- [ ] Backups are configured for the database
- [ ] Log rotation is configured

## Common Issues

> **"No database config found"** — Ensure `rangka.config.ts` in the project root has database settings.

> **"Connection refused" on port 3000** — Check that your firewall or reverse proxy is targeting the correct port.

> **Custom components not loading** — Run `rangka build` before `rangka start`. The server serves from `.rangka/` only if it exists.

## Further Reading

- [CLI reference](/reference/cli) — all available commands
- [Custom Widgets](/guides/custom-widgets) — building and bundling custom components
