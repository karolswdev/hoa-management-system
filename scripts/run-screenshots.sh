#!/usr/bin/env bash
# Run the end-to-end screenshot flow locally (migrate + seed + start servers + Playwright).

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BACK_PORT="${BACK_PORT:-3001}"
FRONT_PORT="${FRONT_PORT:-4173}"
BACK_LOG="${BACK_LOG:-/tmp/hoa-backend-screens.log}"
FRONT_LOG="${FRONT_LOG:-/tmp/hoa-frontend-screens.log}"

wait_for() {
  local url="$1"
  local attempts=45
  for ((i = 1; i <= attempts; i++)); do
    if curl -fs "$url" >/dev/null 2>&1; then
      return 0
    fi
    sleep 2
  done
  echo "Timed out waiting for ${url}" >&2
  return 1
}

echo "==> Running DB migrations (test) and seeding demo data"
pushd "$ROOT_DIR/backend" >/dev/null
NODE_ENV=test npx sequelize-cli db:migrate
NODE_ENV=test node scripts/seed-test-data.js

echo "==> Starting backend on port ${BACK_PORT} (logs: ${BACK_LOG})"
NODE_ENV=test PORT="${BACK_PORT}" npm start >"${BACK_LOG}" 2>&1 &
BACK_PID=$!
popd >/dev/null

echo "==> Starting frontend on port ${FRONT_PORT} (logs: ${FRONT_LOG})"
pushd "$ROOT_DIR/frontend" >/dev/null
PORT="${FRONT_PORT}" npm run dev:screenshots -- --host 0.0.0.0 --port "${FRONT_PORT}" --strictPort >"${FRONT_LOG}" 2>&1 &
FRONT_PID=$!

cleanup() {
  kill "${BACK_PID}" "${FRONT_PID}" 2>/dev/null || true
}
trap cleanup EXIT

echo "==> Waiting for backend and frontend to become ready"
wait_for "http://localhost:${BACK_PORT}/api/health"
wait_for "http://localhost:${FRONT_PORT}"

echo "==> Generating screenshots with Playwright"
BASE_URL="http://localhost:${FRONT_PORT}" npm run generate-screenshots -- --project=chromium
popd >/dev/null

echo "==> Done. Screenshots are in: ${ROOT_DIR}/frontend/screenshots"
echo "    Logs: ${BACK_LOG}, ${FRONT_LOG}"
