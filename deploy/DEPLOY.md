Deployment Scripts

Overview
- These scripts streamline deploying the app to a remote server via SSH, with backups, code sync, Docker image builds, minimal downtime restarts, and basic verification.
- They do not overwrite the remote `.env` or persisted data (`backend/database`, `backend/uploads`).

Files
- `deploy/config.example.env` – copy to `deploy/config.env` and set your values.
- `deploy/rsync-exclude.txt` – paths to exclude when syncing (DB, uploads, node_modules, .env, etc.).
- `deploy/remote.deploy.sh` – runs on the server to back up, build, restart, and verify.
- `deploy/deploy.local.sh` – run locally; performs preflight, sync, and executes the remote steps.

Prerequisites
- SSH access to the server using the configured key and user.
- Remote directory exists (default `/opt/hoa-management`) and contains `.env` and `docker-compose.yml`.
- Docker and Docker Compose installed on the server.

Quick Start
1) Configure:
   - `cp deploy/config.example.env deploy/config.env`
   - Edit `deploy/config.env` with your host, user, SSH key path, and remote dir.
2) Deploy:
   - `bash deploy/deploy.local.sh`

What it does
- Preflight: verifies SSH connectivity and remote paths.
- Backups (remote): DB, uploads, and code snapshot to `/root/hoa-backups`.
- Sync: `rsync` local repo to the remote app directory, excluding DB/uploads/.env.
- Build: `docker-compose build` (optionally `--no-cache`).
- Restart: `docker-compose up -d` (no full down to minimize downtime).
- Migrations (optional): `docker-compose run --rm backend npx sequelize-cli db:migrate`.
- Verify: `docker-compose ps`, curl apex/API, and print logs tail on error.

Notes
- Secrets: Keep `/opt/hoa-management/.env` on the server as the source of truth.
- To use `--no-cache` or enable migrations, set flags in `deploy/config.env`.

