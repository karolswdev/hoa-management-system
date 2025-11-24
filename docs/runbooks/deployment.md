# Deployment Runbook

<!-- anchor: deployment-runbook -->

**Owner:** DevOps Team
**Last Updated:** 2025-11-23
**Related:** [CI Pipeline Runbook](./ci-pipeline.md), [Architecture Section 3.3](../../.codemachine/artifacts/architecture/04_Operational_Architecture.md#3-3-deployment-artifacts-pipeline), [Architecture Section 3.9](../../.codemachine/artifacts/architecture/04_Operational_Architecture.md#3-9-deployment-view)

---

## Overview

This runbook documents the complete deployment workflow for the HOA Management System, from GitHub Actions build to production runtime on Linode. The deployment pipeline implements a **health gate pattern** where Docker images are validated in an isolated environment before being pushed to the container registry, ensuring only verified artifacts reach production.

**Deployment Strategy:** Rolling deployment with zero-downtime restarts
**Runtime Platform:** Linode Nanode (Single Docker Compose stack)
**Container Registry:** GitHub Container Registry (GHCR)
**Workflow File:** `.github/workflows/deploy.yml`
**Remote Script:** `deploy/remote.deploy.sh`

**Key Features:**
- Pre-push health gate with migration validation
- Automated backup of database, uploads, and code
- Health endpoint verification (`/healthz`, `/metrics`)
- Feature flag coordination
- Rollback capability (<5 minutes)

---

## Prerequisites

### GitHub Secrets

The following secrets must be configured in the GitHub repository (Settings → Secrets and variables → Actions):

| Secret Name | Description | Example Value |
|-------------|-------------|---------------|
| `DEPLOY_HOST` | Linode server hostname or IP | `123.45.67.89` |
| `DEPLOY_USER` | SSH user with docker permissions | `root` or `deploy` |
| `DEPLOY_DIR` | Absolute path to deployment directory | `/opt/hoa` |
| `DEPLOY_DOMAIN` | Production domain name | `hoa.example.com` |
| `DEPLOY_SSH_KEY` | Private SSH key for authentication | `-----BEGIN OPENSSH PRIVATE KEY-----...` |
| `VITE_TURNSTILE_SITE_KEY` | Cloudflare Turnstile site key (public) | `0x4AAAAAAA...` |

**Note:** `GITHUB_TOKEN` is automatically provided by GitHub Actions for GHCR authentication.

### Linode Server Setup

**Requirements:**
- Docker Engine 24.x or higher
- docker-compose 2.x (plugin mode preferred)
- Network configured with `hoa-management-network` bridge
- SSH key-based authentication configured
- Ports 80/443 exposed via reverse proxy (Caddy/Nginx)

**Directory Structure:**
```
/opt/hoa/
├── backend/
│   ├── database/          # SQLite database (persistent)
│   └── uploads/           # User uploads (persistent)
├── deploy/
│   ├── docker-compose.prod.yml
│   └── remote.deploy.sh
└── .env                   # Environment variables (not synced)
```

**Environment File (`.env`):**
```bash
# Required environment variables on Linode host
JWT_SECRET=<secure-random-string>
JWT_EXPIRES_IN=7d
EMAIL_PROVIDER=sendgrid
EMAIL_FROM=noreply@hoa.example.com
EMAIL_FROM_NAME="HOA Management System"
EMAIL_REPLY_TO=board@hoa.example.com
FRONTEND_BASE_URL=https://hoa.example.com
SENDGRID_API_KEY=<sendgrid-api-key>
TURNSTILE_SECRET_KEY=<cloudflare-turnstile-secret>
ALLOWED_ORIGINS=https://hoa.example.com
APP_PORT=3001
FRONTEND_PORT=3000
BACKEND_IMAGE=ghcr.io/<owner>/hoa-backend:latest
FRONTEND_IMAGE=ghcr.io/<owner>/hoa-frontend:latest
```

### Access Requirements

- **GitHub:** Write access to repository for triggering workflows
- **GHCR:** Package write permissions (automatic for repo collaborators)
- **Linode SSH:** Key-based access as configured in `DEPLOY_SSH_KEY`
- **Admin UI:** Post-deploy access to toggle feature flags

---

## Deployment Workflow

The deployment process consists of two GitHub Actions jobs: **build-images** (with health gate) and **deploy** (SSH orchestration). See the [CI/CD Pipeline Diagram](../diagrams/cicd-pipeline.svg) for visual representation.

### Trigger Methods

#### 1. Automated Release Trigger

**Recommended for production deployments.**

```bash
# Create and publish a release via GitHub UI or CLI
gh release create v1.2.3 --title "Release 1.2.3" --notes "Brief description"
```

**Behavior:**
- Automatically triggers `deploy.yml` workflow
- Uses release tag for version labeling
- Runs migrations by default (`run_migrations: true`)

#### 2. Manual Workflow Dispatch

**Use for hotfixes, testing, or custom scenarios.**

```bash
# Via GitHub CLI
gh workflow run deploy.yml \
  --ref main \
  -f run_migrations=true \
  -f build_no_cache=false

# Via GitHub UI
# Navigate to Actions → Deploy Production → Run workflow
```

**Parameters:**
- `run_migrations` (default: `true`): Execute database migrations on remote host
- `build_no_cache` (default: `false`): Legacy flag, force Docker rebuild (usually not needed)

---

## Workflow Steps

### Phase 1: Build & Health Gate (Job: `build-images`)

This job runs entirely on GitHub Actions runners and gates GHCR pushes behind health validation.

#### Step 1.1: Checkout and Metadata Extraction

```yaml
- Checkout source (fetch-depth: 0 for full git history)
- Extract version: git describe --tags --always --dirty
- Sanitize version for Docker tags (replace unsafe chars)
```

**Output:** `version` (e.g., `v1.2.3` or `6500d34`)

#### Step 1.2: Docker Setup and GHCR Login

```yaml
- Setup Docker Buildx (multi-platform builds)
- Login to ghcr.io using ${{ secrets.GITHUB_TOKEN }}
```

**Credentials:** Ephemeral, scoped to workflow run

#### Step 1.3: Build Images Locally (--load)

**Critical:** Images are built with `--load` flag to keep them on the runner for health gate testing. They are **not pushed yet**.

```yaml
- Build backend: ghcr.io/<owner>/hoa-backend:<version>
- Build frontend: ghcr.io/<owner>/hoa-frontend:<version>
```

**Build args (backend):**
- `APP_VERSION`: Git version string

**Build args (frontend):**
- `VITE_API_BASE_URL`: Production API endpoint
- `VITE_APP_NAME`: Display name (from workflow env)
- `VITE_TURNSTILE_SITE_KEY`: CAPTCHA site key
- `VITE_APP_VERSION`: Git version string

#### Step 1.4: Health Gate Sequence

**Purpose:** Validate container starts, migrations execute, and health endpoints respond before pushing to registry.

**Substeps:**

1. **Create Temp Infrastructure**
   ```bash
   docker network create hoa-health-gate-network
   mkdir -p $RUNNER_TEMP/health-gate-db
   mkdir -p $RUNNER_TEMP/health-gate-uploads
   ```

2. **Start Backend Container**
   ```bash
   docker run -d \
     --name hoa_backend_health_gate \
     --network hoa-health-gate-network \
     -p 3001:3001 \
     -e NODE_ENV=production \
     -e JWT_SECRET=test-jwt-secret-for-health-gate \
     -v $RUNNER_TEMP/health-gate-db:/usr/src/app/backend/database \
     ghcr.io/<owner>/hoa-backend:<version>
   ```
   **Note:** Uses ephemeral test credentials (not production secrets)

3. **Run Database Migrations**
   ```bash
   docker run --rm \
     -e NODE_ENV=production \
     -v $RUNNER_TEMP/health-gate-db:/usr/src/app/backend/database \
     ghcr.io/<owner>/hoa-backend:<version> \
     npx sequelize-cli db:migrate
   ```
   **Validates:** Migrations execute without errors on fresh database

4. **Wait for Backend Ready**
   - Polls `docker ps` for 30 attempts (60 seconds max)
   - Sleeps 5s after container detected to allow server startup

5. **Health Check: curl /api/health**
   ```bash
   curl -f -s http://localhost:3001/api/health > healthz-response.json
   ```
   **Success criteria:** HTTP 200 response
   **Retry logic:** 15 attempts with 2s delay

6. **Metrics Check: curl /api/metrics**
   ```bash
   curl -f -s http://localhost:3001/api/metrics > metrics-response.json
   ```
   **Success criteria:** HTTP 200 response
   **Fails fast:** No retries (assumes service is already healthy)

7. **Capture Logs (always runs)**
   ```bash
   docker logs hoa_backend_health_gate > health-gate-backend.log
   docker ps -a > health-gate-containers.log
   ls -la health-gate-db > health-gate-db-contents.log
   ```

8. **Upload Artifacts (always runs)**
   - Artifact name: `health-gate-dry-run-logs`
   - Retention: 30 days
   - Contents: All logs + health/metrics JSON responses

9. **Cleanup Temp Resources (always runs)**
   ```bash
   docker stop hoa_backend_health_gate
   docker rm hoa_backend_health_gate
   docker network rm hoa-health-gate-network
   ```

**Decision Point:** If any health check fails, workflow stops here. Images remain local and are **never pushed to GHCR**.

#### Step 1.5: Push to GHCR (Only After Health Gate Pass)

```yaml
- Push backend: ghcr.io/<owner>/hoa-backend:<version>
- Tag & push: ghcr.io/<owner>/hoa-backend:latest
- Push frontend: ghcr.io/<owner>/hoa-frontend:<version>
- Tag & push: ghcr.io/<owner>/hoa-frontend:latest
```

**Image metadata outputs:**
- `backend_image`: Full GHCR URL with version tag
- `frontend_image`: Full GHCR URL with version tag
- `version`: Git version string

**Retention:** Images remain in GHCR indefinitely unless manually deleted

---

### Phase 2: Deploy to Linode (Job: `deploy`)

This job orchestrates SSH commands to pull verified images and restart services.

#### Step 2.1: Validate Deployment Secrets

```yaml
for var in DEPLOY_HOST DEPLOY_USER DEPLOY_DIR DEPLOY_DOMAIN DEPLOY_SSH_KEY; do
  if [ -z "${!var}" ]; then exit 1; fi
done
```

**Fails fast if:** Any required secret is missing

#### Step 2.2: Prepare SSH Key

```bash
install -m 700 -d ~/.ssh
echo "$DEPLOY_SSH_KEY" > $RUNNER_TEMP/hoa_deploy_key
chmod 600 $RUNNER_TEMP/hoa_deploy_key
ssh-keyscan -H $DEPLOY_HOST >> ~/.ssh/known_hosts
```

**Security:** Key exists only for workflow duration, destroyed after run

#### Step 2.3: Ensure Remote Directory Exists

```bash
ssh -i $SSH_KEY_PATH $DEPLOY_USER@$DEPLOY_HOST "mkdir -p $DEPLOY_DIR"
```

**Idempotent:** Safe to run on existing deployments

#### Step 2.4: Sync Repository to Server

```bash
rsync -az --delete \
  --filter='P .env' \
  --exclude-from=deploy/rsync-exclude.txt \
  ./ $DEPLOY_USER@$DEPLOY_HOST:$DEPLOY_DIR/
```

**Preserves:** `.env` file (contains production secrets)
**Excludes:** `node_modules`, `.git`, temp files (see `rsync-exclude.txt`)

#### Step 2.5: Upload and Execute Remote Script

```bash
scp deploy/remote.deploy.sh $DEPLOY_USER@$DEPLOY_HOST:/tmp/hoa-remote-deploy.sh
ssh $DEPLOY_USER@$DEPLOY_HOST \
  REMOTE_DIR=$DEPLOY_DIR \
  COMPOSE_FILE=deploy/docker-compose.prod.yml \
  DOMAIN=$DEPLOY_DOMAIN \
  RUN_MIGRATIONS=$RUN_MIGRATIONS_INPUT \
  APP_VERSION=$APP_VERSION \
  BACKEND_IMAGE=$BACKEND_IMAGE \
  FRONTEND_IMAGE=$FRONTEND_IMAGE \
  /tmp/hoa-remote-deploy.sh
```

**Passed variables:**
- `BACKEND_IMAGE`/`FRONTEND_IMAGE`: From health gate outputs
- `APP_VERSION`: Git version for logging
- `RUN_MIGRATIONS`: User-controlled flag

---

### Phase 3: Remote Server Execution (`remote.deploy.sh`)

This script runs on the Linode host with elevated privileges.

#### Step 3.1: Version Labeling

```bash
VERSION_LABEL="${APP_VERSION:-$(git describe --tags --always)}"
export APP_VERSION="$VERSION_LABEL"
```

**Fallback:** Uses git describe if `APP_VERSION` not passed

#### Step 3.2: Create Backups

```bash
mkdir -p /root/hoa-backups
TS=$(date +%F-%H%M%S)
tar czf /root/hoa-backups/hoa-db-$TS.tgz -C backend database
tar czf /root/hoa-backups/hoa-uploads-$TS.tgz -C backend uploads
tar czf /root/hoa-backups/hoa-code-$TS.tgz --exclude=backend/database --exclude=backend/uploads .
```

**Backup types:**
- Database: SQLite file + WAL/SHM journals
- Uploads: User-submitted files (PDFs, images)
- Code: Entire deployment directory (for config rollback)

**Retention:** Manual cleanup required (consider 7-day retention policy)

#### Step 3.3: Pull New Images

```bash
docker-compose -f deploy/docker-compose.prod.yml pull
```

**Authenticates:** Via GHCR PAT stored in `/root/.docker/config.json` (one-time setup)

#### Step 3.4: Restart Services

```bash
docker rm -f hoa_backend_prod hoa_frontend_prod || true
docker network create hoa-management-network || true
docker-compose down
docker-compose up -d
```

**Zero-downtime strategy:** Nginx/Caddy reverse proxy buffers requests during brief restart

#### Step 3.5: Run Migrations (Conditional)

```bash
if [ "$RUN_MIGRATIONS" = "true" ]; then
  docker-compose run --rm backend npx sequelize-cli db:migrate
fi
```

**Note:** Migrations run **after** `up -d` to ensure database volume is mounted

#### Step 3.6: Verify Services

```bash
docker-compose ps
curl -s -o /dev/null -w "%{http_code}" "https://$DOMAIN/"
curl -s -o /dev/null -w "%{http_code}" "https://$DOMAIN/api/"
curl -s -o /dev/null -w "%{http_code}" "https://$DOMAIN/api/health"
curl -s -o /dev/null -w "%{http_code}" "https://$DOMAIN/api/metrics"
```

**Expected responses:**
- `/`: 200 (frontend served)
- `/api/`: 200 or 404 (API root, may redirect)
- `/api/health`: 200 (healthz endpoint)
- `/api/metrics`: 200 (Prometheus metrics)

**Warning conditions:**
- Apex ≠ 200: Frontend not serving
- API ≠ 200/404: Backend not responding
- Health/Metrics ≠ 200: Endpoints misconfigured

**On warning:** Script tails backend logs (150 lines) for diagnostics

---

## Verification Checklist

Use this checklist after each deployment to ensure system health.

### Immediate Post-Deploy (Automated in Workflow)

- [ ] Health gate passed (artifacts uploaded)
- [ ] GHCR push succeeded (both backend and frontend)
- [ ] SSH connection established
- [ ] Backups created (check `/root/hoa-backups/`)
- [ ] Containers restarted (`docker ps` shows `hoa_backend_prod`, `hoa_frontend_prod`)
- [ ] Migrations executed (if enabled)
- [ ] `/api/health` returns 200
- [ ] `/api/metrics` returns 200

### Manual Verification (Within 5 Minutes)

- [ ] **Frontend loads:** Navigate to `https://<domain>` and verify homepage renders
- [ ] **Login works:** Test authentication with admin account
- [ ] **API responsive:** Check network tab for successful `/api/health` calls
- [ ] **No errors in logs:**
  ```bash
  ssh deploy@<host> "cd /opt/hoa && docker-compose logs -n 50 backend"
  ssh deploy@<host> "cd /opt/hoa && docker-compose logs -n 50 frontend"
  ```
- [ ] **Database migrations applied:**
  ```bash
  ssh deploy@<host> "cd /opt/hoa && docker-compose run --rm backend npx sequelize-cli db:migrate:status"
  ```
- [ ] **Health endpoints return expected data:**
  ```bash
  curl -s https://<domain>/api/health | jq
  curl -s https://<domain>/api/metrics | jq
  ```

### Feature Flag Coordination (Within 30 Minutes)

- [ ] Review release notes for new feature flags
- [ ] Access admin UI: `https://<domain>/admin/config`
- [ ] Toggle flags as documented in release notes
- [ ] Verify feature visibility for end users
- [ ] Document flag states in deployment log

### Smoke Testing (Within 1 Hour)

- [ ] **Board page:** Verify board members display correctly
- [ ] **Polls:** Create test poll (as admin), vote (as member), verify results
- [ ] **Vendors:** Search vendor directory, verify moderation queue (if admin)
- [ ] **File uploads:** Test document upload (board resolution, vendor invoice)
- [ ] **Email delivery:** Trigger notification (e.g., contact form) and verify SendGrid logs
- [ ] **Accessibility:** Test high-visibility mode toggle, keyboard navigation

### Monitoring & Alerts (Continuous)

- [ ] **Prometheus metrics:** Confirm scrape targets healthy (if monitoring configured)
- [ ] **Uptime monitor:** Check external uptime service (e.g., UptimeRobot) shows 100% availability
- [ ] **Error tracking:** Review Sentry/equivalent for new exceptions (if configured)
- [ ] **Performance:** Check response times for `/api/health` (should be <100ms)

---

## Rollback Procedures

Rollbacks restore the system to the previous working state using backups and Docker image history.

### Scenario 1: Failed Health Gate (Pre-Push)

**Symptoms:** Workflow fails during health gate, no GHCR push occurs
**Impact:** Production unaffected (images never published)

**Resolution:**
1. Review `health-gate-dry-run-logs` artifact in GitHub Actions
2. Fix issues (migration errors, health endpoint bugs, etc.)
3. Commit fixes and re-trigger deployment

**No rollback needed** (production still running previous version)

---

### Scenario 2: Failed Remote Deployment (Post-Push)

**Symptoms:** SSH errors, rsync failures, remote script crashes
**Impact:** Production may be in inconsistent state

**Quick Rollback (5 minutes):**

1. **SSH into host:**
   ```bash
   ssh deploy@<host>
   cd /opt/hoa
   ```

2. **Identify previous working version:**
   ```bash
   # List recent backups
   ls -lht /root/hoa-backups/ | head -10

   # List available Docker images
   docker image ls | grep hoa
   ```

3. **Update compose file to previous version:**
   ```bash
   # Edit .env to specify previous image tags
   vim .env
   # Change:
   #   BACKEND_IMAGE=ghcr.io/<owner>/hoa-backend:v1.2.3
   #   FRONTEND_IMAGE=ghcr.io/<owner>/hoa-frontend:v1.2.3
   # To:
   #   BACKEND_IMAGE=ghcr.io/<owner>/hoa-backend:v1.2.2
   #   FRONTEND_IMAGE=ghcr.io/<owner>/hoa-frontend:v1.2.2
   ```

4. **Pull previous images and restart:**
   ```bash
   docker-compose -f deploy/docker-compose.prod.yml pull
   docker-compose down
   docker-compose up -d
   ```

5. **Verify rollback:**
   ```bash
   curl https://<domain>/api/health
   docker-compose logs -n 50 backend
   ```

**Data Rollback (if migrations caused issues):**

```bash
# Stop services
docker-compose down

# Restore database from backup
TS=<timestamp-of-last-good-backup>
rm -rf backend/database
tar xzf /root/hoa-backups/hoa-db-$TS.tgz -C backend

# Restart with previous version
docker-compose up -d
```

**⚠️ Warning:** Database rollback discards data created after backup. Only use if migrations corrupted schema.

---

### Scenario 3: Runtime Issues Post-Deployment

**Symptoms:** Services running but errors in logs, features broken, user reports
**Impact:** Production degraded but accessible

**Investigation Steps:**

1. **Check logs for exceptions:**
   ```bash
   ssh deploy@<host> "cd /opt/hoa && docker-compose logs -f backend"
   ```

2. **Inspect health endpoints:**
   ```bash
   curl -v https://<domain>/api/health
   curl -v https://<domain>/api/metrics
   ```

3. **Review recent commits:**
   ```bash
   git log --oneline -10
   ```

**Mitigation Options:**

- **Feature flag disable:** Turn off new features via admin UI (fastest, no redeploy)
- **Hotfix deploy:** Create patch branch, trigger manual workflow dispatch
- **Full rollback:** Follow Scenario 2 procedure

**Decision Matrix:**

| Issue Severity | Recommended Action | ETA |
|----------------|-------------------|-----|
| Critical (login broken, data loss) | Full rollback + hotfix | 5 min |
| High (feature broken, errors logged) | Feature flag disable + hotfix | 15 min |
| Medium (UI glitch, slow performance) | Hotfix deploy (no rollback) | 30 min |
| Low (cosmetic, rare edge case) | Fix in next release | N/A |

---

## Troubleshooting

### Health Gate Failures

#### Issue: "Health check failed after 15 attempts"

**Diagnosis:**
- Download `health-gate-dry-run-logs` artifact
- Review `health-gate-backend.log` for startup errors
- Check `healthz-response.json` (may be empty if endpoint unreachable)

**Common Causes:**
- **Database migration error:** Check migration logs in backend log
- **Missing environment variable:** Verify all required env vars set in health gate step
- **Port conflict:** GitHub runner may have port 3001 in use (rare)
- **Slow startup:** Increase retry count or sleep duration

**Resolution:**
- Fix root cause (migration SQL, env var, etc.)
- Re-trigger workflow
- If persistent, test locally with same Docker command

---

#### Issue: "Migrations reported an error"

**Diagnosis:**
- Check migration output in workflow logs (step: "Run database migrations in health gate")
- Look for Sequelize errors (syntax errors, constraint violations, etc.)

**Common Causes:**
- **Invalid SQL syntax:** Typo in migration file
- **Missing migration dependency:** Out-of-order migration execution
- **Schema conflict:** Migration assumes state that doesn't match fresh DB

**Resolution:**
- Test migrations locally: `NODE_ENV=test npx sequelize-cli db:migrate`
- Fix migration file
- Ensure migrations are idempotent (safe to re-run)

---

### Remote Deployment Failures

#### Issue: "Permission denied (publickey)"

**Diagnosis:**
- SSH key mismatch between `DEPLOY_SSH_KEY` secret and Linode authorized_keys

**Resolution:**
1. Verify SSH key format (must be OpenSSH private key, not PEM)
2. Test key manually:
   ```bash
   ssh -i /path/to/key deploy@<host> "echo success"
   ```
3. Regenerate key pair if necessary:
   ```bash
   ssh-keygen -t ed25519 -C "github-actions-deploy"
   # Add public key to Linode: ~/.ssh/authorized_keys
   # Add private key to GitHub secret: DEPLOY_SSH_KEY
   ```

---

#### Issue: "rsync: failed to set times on ..."

**Diagnosis:**
- Filesystem permissions issue on Linode host

**Resolution:**
1. Ensure `DEPLOY_USER` owns `DEPLOY_DIR`:
   ```bash
   ssh deploy@<host> "sudo chown -R deploy:deploy /opt/hoa"
   ```
2. If using root, verify no immutable flags:
   ```bash
   lsattr /opt/hoa
   ```

---

#### Issue: "docker-compose: command not found"

**Diagnosis:**
- Docker Compose v2 uses plugin syntax (`docker compose` not `docker-compose`)

**Resolution:**
- Update `remote.deploy.sh` to use `docker compose` (already done in latest version)
- Alternatively, install standalone `docker-compose` on Linode:
  ```bash
  sudo apt install docker-compose-plugin
  ```

---

### Post-Deployment Issues

#### Issue: "502 Bad Gateway" on domain

**Diagnosis:**
- Reverse proxy (Nginx/Caddy) cannot reach backend container

**Checks:**
```bash
# Verify containers running
docker ps | grep hoa

# Check backend health directly
curl http://localhost:3001/api/health

# Inspect reverse proxy logs
journalctl -u caddy -n 50
```

**Common Causes:**
- Backend container crashed (check `docker logs hoa_backend_prod`)
- Port binding changed (verify `docker-compose.prod.yml` ports match proxy config)
- Firewall blocking internal traffic (unlikely on Linode)

**Resolution:**
- Restart backend: `docker-compose restart backend`
- Verify proxy upstream config points to `127.0.0.1:3001`

---

#### Issue: "Database is locked" errors in logs

**Diagnosis:**
- SQLite write lock contention (concurrent migrations + app writes)

**Resolution:**
- Increase SQLite busy timeout in backend config
- Run migrations **before** starting app (already sequenced in remote script)
- For high concurrency, consider migrating to PostgreSQL (future architecture decision)

---

#### Issue: Feature flag not taking effect

**Diagnosis:**
- Config cache not invalidated after flag toggle

**Resolution:**
1. Restart backend to clear cache:
   ```bash
   ssh deploy@<host> "cd /opt/hoa && docker-compose restart backend"
   ```
2. Verify flag in database:
   ```bash
   ssh deploy@<host> "cd /opt/hoa && docker-compose run --rm backend node -e \"
   const db = require('./src/models');
   db.Config.findByPk('board.visibility').then(c => console.log(c.value));
   \""
   ```

---

## Security Considerations

### Secrets Management

- **Never commit `.env` to Git:** Runbook and workflow enforce this via hygiene checks
- **Rotate secrets quarterly:** JWT_SECRET, SENDGRID_API_KEY, TURNSTILE_SECRET_KEY
- **Scope GitHub PATs minimally:** GHCR pull access only (no write/admin)
- **Use separate SSH key for deploys:** Do not reuse personal SSH keys

### Health Gate Isolation

- Health gate uses **ephemeral test credentials** (not production secrets)
- Temp volumes destroyed after workflow completes
- No sensitive data persisted in GitHub Actions artifacts

### Production Environment

- **Database encryption at rest:** Enable Linode volume encryption
- **TLS termination:** Reverse proxy enforces HTTPS (Caddy auto-renews certs)
- **Container isolation:** Backend/frontend run in separate containers with minimal capabilities
- **Audit logging:** All SSH sessions and Docker commands logged via syslog

---

## Monitoring and Observability

### Health Endpoints

**`GET /api/health`**
```json
{
  "status": "ok",
  "timestamp": "2025-11-23T10:30:00.000Z",
  "version": "v1.2.3",
  "database": "connected"
}
```

**`GET /api/metrics`**
```json
{
  "uptime": 86400,
  "memory": {
    "rss": 123456789,
    "heapUsed": 98765432
  },
  "requests": {
    "total": 45678,
    "errors": 12
  }
}
```

### Log Aggregation

**Backend logs:**
```bash
docker-compose logs -f backend
```

**Frontend logs (Nginx access):**
```bash
docker-compose logs -f frontend
```

**Filter for errors:**
```bash
docker-compose logs backend | grep -i error
```

### External Monitoring (Recommended Setup)

- **Uptime monitoring:** Configure UptimeRobot to ping `/api/health` every 5 minutes
- **Prometheus scraping:** Point Prometheus at `/api/metrics` (if monitoring stack deployed)
- **Alert rules:**
  - `/api/health` non-200 for >2 minutes → PagerDuty
  - Memory usage >80% → Slack notification
  - Error rate >1% → Email alert

---

## Deployment Log Template

Maintain a deployment log in `ops/deploy-log.md` (or equivalent) with this format:

```markdown
### Deployment YYYY-MM-DD HH:MM

- **Version:** v1.2.3
- **Operator:** @username
- **Trigger:** Release / Manual Dispatch / Hotfix
- **Migrations:** Yes / No
- **Health Gate:** ✅ Passed / ❌ Failed (link to artifact)
- **Deployment Duration:** 8 minutes
- **Verification:**
  - [x] Health endpoints responding
  - [x] Frontend loads
  - [x] Login functional
  - [x] Smoke tests passed
- **Feature Flags Toggled:**
  - `vendors.moderation-queue`: enabled
  - `board.visibility`: members_only
- **Issues Encountered:** None / [Link to issue #123]
- **Rollback Required:** No / Yes (reason)
```

**Benefits:**
- Audit trail for compliance
- Pattern recognition for recurring issues
- Knowledge transfer for new operators

---

## Related Documentation

- **Architecture:**
  - [Section 3.3: Deployment Artifacts & Pipeline](../../.codemachine/artifacts/architecture/04_Operational_Architecture.md#3-3-deployment-artifacts-pipeline)
  - [Section 3.9: Deployment View](../../.codemachine/artifacts/architecture/04_Operational_Architecture.md#3-9-deployment-view)
- **Runbooks:**
  - [CI Pipeline Runbook](./ci-pipeline.md)
  - [Release Checklist](./release-checklist.md)
  - [Vendor Moderation Runbook](./vendor-moderation.md)
- **Diagrams:**
  - [CI/CD Pipeline Diagram (Mermaid)](../diagrams/cicd-pipeline.mmd)
  - [CI/CD Pipeline Diagram (SVG)](../diagrams/cicd-pipeline.svg)
- **Workflows:**
  - [`.github/workflows/deploy.yml`](../../.github/workflows/deploy.yml)
  - [`.github/workflows/ci.yml`](../../.github/workflows/ci.yml)

---

## Maintenance & Review

**Review Schedule:** Quarterly or after major infrastructure changes

**Update Triggers:**
- Node version upgrades
- Docker/docker-compose version changes
- New health endpoints added
- Reverse proxy configuration changes
- Migration to multi-host deployment

**Change Process:**
1. Update workflow files (`.github/workflows/deploy.yml`, `remote.deploy.sh`)
2. Update this runbook (sync step descriptions, troubleshooting)
3. Test deployment on staging environment (if available)
4. Document changes in deployment log
5. Get approval from 2+ team members
6. Deploy to production during maintenance window

**Owner:** DevOps Team
**Review Approvers:** Lead Engineer, Infrastructure Lead

---

**End of Runbook**

For questions or runbook updates, contact DevOps team or file issue with label `ops/deployment`.
