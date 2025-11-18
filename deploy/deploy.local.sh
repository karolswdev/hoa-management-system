#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR=$(cd "$(dirname "$0")/.." && pwd)
CONFIG_FILE="$ROOT_DIR/deploy/config.env"
EXCLUDES_FILE="$ROOT_DIR/deploy/rsync-exclude.txt"
REMOTE_SCRIPT_PATH="/tmp/hoa-remote-deploy.sh"

log()   { echo -e "\033[0;32m[OK]\033[0m  $*"; }
info()  { echo -e "\033[0;34m[..]\033[0m  $*"; }
warn()  { echo -e "\033[1;33m[!!]\033[0m  $*"; }
error() { echo -e "\033[0;31m[XX]\033[0m  $*"; }

require() {
  if ! command -v "$1" >/dev/null 2>&1; then
    error "Missing required command: $1"; exit 1; fi
}

require ssh
require rsync

if [ ! -f "$CONFIG_FILE" ]; then
  error "Missing $CONFIG_FILE. Copy deploy/config.example.env to deploy/config.env and edit."
  exit 1
fi

# shellcheck disable=SC1090
. "$CONFIG_FILE"

: "${DEPLOY_HOST:?set in deploy/config.env}"
: "${DEPLOY_USER:?set in deploy/config.env}"
: "${SSH_KEY:?set in deploy/config.env}"
: "${REMOTE_DIR:?set in deploy/config.env}"
: "${DOMAIN:?set in deploy/config.env}"
: "${BACKEND_IMAGE:?set in deploy/config.env}"
: "${FRONTEND_IMAGE:?set in deploy/config.env}"
: "${COMPOSE_FILE:=docker-compose.yml}"
: "${BUILD_NO_CACHE:=false}"
: "${RUN_MIGRATIONS:=true}"

SSH_OPTS=(-i "$SSH_KEY" -o BatchMode=yes -o StrictHostKeyChecking=accept-new -o ConnectTimeout=20)

step() {
  echo -e "\n\033[1;36m==> $*\033[0m"
}

step "Preflight checks"
if [ ! -f "$SSH_KEY" ]; then
  error "SSH key not found at $SSH_KEY"; exit 1; fi

ssh "${SSH_OPTS[@]}" "$DEPLOY_USER@$DEPLOY_HOST" 'echo ok >/dev/null' || {
  error "SSH connectivity failed"; exit 1; }
log "SSH ok"

ssh "${SSH_OPTS[@]}" "$DEPLOY_USER@$DEPLOY_HOST" "mkdir -p '$REMOTE_DIR'" || true

step "Sync code to remote (excluding DB/uploads/.env)"
rsync -az --delete --delete-excluded \
  --exclude-from="$EXCLUDES_FILE" \
  -e "ssh ${SSH_OPTS[*]}" \
  "$ROOT_DIR/" "$DEPLOY_USER@$DEPLOY_HOST:$REMOTE_DIR/"
log "Code synced to $DEPLOY_HOST:$REMOTE_DIR"

step "Upload remote deploy script"
scp "${SSH_OPTS[@]}" "$ROOT_DIR/deploy/remote.deploy.sh" "$DEPLOY_USER@$DEPLOY_HOST:$REMOTE_SCRIPT_PATH"
ssh "${SSH_OPTS[@]}" "$DEPLOY_USER@$DEPLOY_HOST" "chmod +x '$REMOTE_SCRIPT_PATH'"
log "Remote script staged"

step "Run remote deploy"
ssh "${SSH_OPTS[@]}" "$DEPLOY_USER@$DEPLOY_HOST" \
  REMOTE_DIR="$REMOTE_DIR" \
  COMPOSE_FILE="$COMPOSE_FILE" \
  DOMAIN="$DOMAIN" \
  BUILD_NO_CACHE="$BUILD_NO_CACHE" \
  RUN_MIGRATIONS="$RUN_MIGRATIONS" \
  BACKEND_IMAGE="$BACKEND_IMAGE" \
  FRONTEND_IMAGE="$FRONTEND_IMAGE" \
  "$REMOTE_SCRIPT_PATH"

log "Deployment completed"
