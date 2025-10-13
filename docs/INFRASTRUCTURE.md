Infrastructure Overview

Environment
- Cloud: Linode (KVM virtualized)
- Host: Ubuntu 24.04.2 LTS (kernel 6.8.0)
- CPU/Memory: 1 vCPU (AMD EPYC), ~1 GB RAM, ~2.5 GB swap
- Disk: 25 GB SSD (root ~54% used at last check)

Networking & Domains
- Public site: https://sandersoncreekhoa.com/
- HTTPS redirect: https://www.sandersoncreekhoa.com/ → apex
- TLS: Let’s Encrypt (Certbot) – certs at `/etc/letsencrypt/live/sandersoncreekhoa.com/`

Reverse Proxy (Nginx)
- Version: nginx/1.24 (Ubuntu package)
- Config path: `/etc/nginx/sites-enabled/hoa-management.conf`
- Proxies:
  - `/api/` → backend at `127.0.0.1:3001`
  - `/` → frontend at `127.0.0.1:3000`
- Security:
  - HSTS enabled; CSP tightened for Turnstile; same-origin defaults
  - Access/Error logs: `/var/log/nginx/hoa-management-access.log`, `/var/log/nginx/hoa-management-error.log`

Application Stack
- App root: `/opt/hoa-management`
- Compose file (prod in-place): `/opt/hoa-management/docker-compose.yml`
- Services:
  - backend → `hoa_backend_prod` on `127.0.0.1:3001`
  - frontend → `hoa_frontend_prod` on `127.0.0.1:3000`
- Docker: Engine 27.5, Compose v2.37

Persistence
- SQLite DB (mounted): `/opt/hoa-management/backend/database/hoa.db`
- Uploads (mounted): `/opt/hoa-management/backend/uploads`
- Backups (created by deployment): `/root/hoa-backups/` (DB, uploads, code snapshots)

Build & Deploy
- Local → Remote deployment scripts in `deploy/`:
  - `deploy/deploy.local.sh` rsyncs code (excludes `.env`, DB, uploads), invokes remote steps
  - `deploy/remote.deploy.sh` creates backups, builds images, restarts with minimal downtime, optional migrations, and verifies
- Environment variables:
  - Backend: `JWT_SECRET`, `JWT_EXPIRES_IN`, `EMAIL_PROVIDER`, `EMAIL_FROM`, `EMAIL_FROM_NAME`, `SENDGRID_API_KEY`, `FRONTEND_BASE_URL`, `PASSWORD_RESET_COOLDOWN_MINUTES`, `TURNSTILE_SECRET_KEY`
  - Frontend build args: `VITE_API_BASE_URL`, `VITE_APP_NAME`, `VITE_TURNSTILE_SITE_KEY`
- Health endpoints:
  - Backend: `/api/health` (200 JSON)
  - Frontend (container): `/health` (200 text)

Operational Notes
- Nginx enforces HTTPS and redirects `www` to apex
- CSP allows Turnstile: `https://challenges.cloudflare.com` for script/connect/frame
- Backend container base: Debian slim for stability with SQLite
- Email via SendGrid (adapter-based); when not configured, emails are logged by backend

Access & Security
- SSH access: key-based only (documented outside of this repo)
- Secrets are not synced from local; `.env` remains on server in `/opt/hoa-management/.env`

