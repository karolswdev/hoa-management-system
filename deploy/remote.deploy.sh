#!/usr/bin/env bash
set -euo pipefail

# Remote deploy script. Runs on server via SSH.
# Expects env vars set by the caller:
#   REMOTE_DIR, COMPOSE_FILE, DOMAIN, RUN_MIGRATIONS, BUILD_NO_CACHE

log()   { echo -e "\033[0;32m[OK]\033[0m  $*"; }
info()  { echo -e "\033[0;34m[..]\033[0m  $*"; }
warn()  { echo -e "\033[1;33m[!!]\033[0m  $*"; }
error() { echo -e "\033[0;31m[XX]\033[0m  $*"; }

cd "$REMOTE_DIR"

COMPOSE="docker-compose -f $COMPOSE_FILE"

info "Creating backups"
mkdir -p /root/hoa-backups
TS=$(date +%F-%H%M%S)
tar czf "/root/hoa-backups/hoa-db-$TS.tgz" -C backend database || true
tar czf "/root/hoa-backups/hoa-uploads-$TS.tgz" -C backend uploads || true
tar czf "/root/hoa-backups/hoa-code-$TS.tgz" --exclude=backend/database --exclude=backend/uploads . || true
log "Backups archived: $TS"

info "Building images (BUILD_NO_CACHE=$BUILD_NO_CACHE)"
if [ "$BUILD_NO_CACHE" = "true" ]; then
  $COMPOSE build --no-cache
else
  $COMPOSE build
fi
log "Images built"

info "Restarting services with minimal downtime"
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

set +e
APEX=$(curl -s -o /dev/null -w "%{http_code}" "https://$DOMAIN/")
API=$(curl -s -o /dev/null -w "%{http_code}" "https://$DOMAIN/api/")
set -e
echo "Apex: $APEX  API: $API"

if [ "$APEX" != "200" ]; then
  warn "Apex did not return 200"
fi

if [ "$API" != "200" ] && [ "$API" != "404" ]; then
  warn "API did not return 200/404; tailing backend logs"
  $COMPOSE logs -n 150 backend || true
fi

log "Remote deploy finished"

