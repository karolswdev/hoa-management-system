#!/usr/bin/env bash
set -euo pipefail

# Remote deploy script. Runs on server via SSH.
# Expects env vars set by the caller:
#   REMOTE_DIR, COMPOSE_FILE, DOMAIN, RUN_MIGRATIONS,
#   BACKEND_IMAGE, FRONTEND_IMAGE, APP_VERSION (optional), BUILD_NO_CACHE

log()   { echo -e "\033[0;32m[OK]\033[0m  $*"; }
info()  { echo -e "\033[0;34m[..]\033[0m  $*"; }
warn()  { echo -e "\033[1;33m[!!]\033[0m  $*"; }
error() { echo -e "\033[0;31m[XX]\033[0m  $*"; }

cd "$REMOTE_DIR"

VERSION_LABEL="${APP_VERSION:-}"
if [ -z "$VERSION_LABEL" ]; then
  if git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
    VERSION_LABEL=$(git describe --tags --always 2>/dev/null || git rev-parse --short HEAD)
  else
    VERSION_LABEL="dev"
  fi
fi
export APP_VERSION="$VERSION_LABEL"
export VITE_APP_VERSION="$VERSION_LABEL"
if [ -z "${BACKEND_IMAGE:-}" ] || [ -z "${FRONTEND_IMAGE:-}" ]; then
  error "BACKEND_IMAGE and FRONTEND_IMAGE environment variables are required"
fi
export BACKEND_IMAGE FRONTEND_IMAGE
info "Deploying version $APP_VERSION"

COMPOSE="docker-compose -f $COMPOSE_FILE"
if [ -f .env ]; then
  set -a
  . ./.env
  set +a
fi

info "Creating backups"
mkdir -p /root/hoa-backups
TS=$(date +%F-%H%M%S)
tar czf "/root/hoa-backups/hoa-db-$TS.tgz" -C backend database || true
tar czf "/root/hoa-backups/hoa-uploads-$TS.tgz" -C backend uploads || true
tar czf "/root/hoa-backups/hoa-code-$TS.tgz" --exclude=backend/database --exclude=backend/uploads . || true
log "Backups archived: $TS"

info "Pulling container images"
$COMPOSE pull
log "Images pulled"

info "Restarting services with minimal downtime"
docker rm -f hoa_backend_prod hoa_frontend_prod >/dev/null 2>&1 || true
docker network create hoa-management-network >/dev/null 2>&1 || true
$COMPOSE down || true
$COMPOSE up -d
log "Services updated"

if [ "${RUN_MIGRATIONS:-false}" = "true" ]; then
  info "Running DB migrations"
  if ! $COMPOSE run --rm backend npx sequelize-cli db:migrate; then
    warn "Migrations reported an error; check logs"
  else
    log "Migrations completed"
  fi
fi

info "Verifying services"
$COMPOSE ps

info "Running endpoint health checks"
set +e
APEX=$(curl -s -o /dev/null -w "%{http_code}" "https://$DOMAIN/")
API=$(curl -s -o /dev/null -w "%{http_code}" "https://$DOMAIN/api/")
HEALTH=$(curl -s -o /dev/null -w "%{http_code}" "https://$DOMAIN/api/health")
METRICS=$(curl -s -o /dev/null -w "%{http_code}" "https://$DOMAIN/api/metrics")
set -e

echo "Endpoint Status:"
echo "  Apex:    $APEX"
echo "  API:     $API"
echo "  Health:  $HEALTH"
echo "  Metrics: $METRICS"

CHECKS_FAILED=0

if [ "$APEX" != "200" ]; then
  warn "Apex did not return 200"
  CHECKS_FAILED=$((CHECKS_FAILED + 1))
fi

if [ "$API" != "200" ] && [ "$API" != "404" ]; then
  warn "API did not return 200/404"
  CHECKS_FAILED=$((CHECKS_FAILED + 1))
fi

if [ "$HEALTH" != "200" ]; then
  warn "Health endpoint did not return 200"
  CHECKS_FAILED=$((CHECKS_FAILED + 1))
fi

if [ "$METRICS" != "200" ]; then
  warn "Metrics endpoint did not return 200"
  CHECKS_FAILED=$((CHECKS_FAILED + 1))
fi

if [ $CHECKS_FAILED -gt 0 ]; then
  warn "$CHECKS_FAILED health check(s) failed; tailing backend logs"
  $COMPOSE logs -n 150 backend || true
else
  log "All health checks passed"
fi

log "Remote deploy finished"
