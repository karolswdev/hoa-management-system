#!/bin/bash
# scripts/rollout/accessibility-phase1-opt-in.sh
# Enables accessibility features with opt-in high-vis mode

set -e

echo "=== Accessibility Phase 1: Opt-In High-Vis Mode ==="

ADMIN_TOKEN="${ADMIN_TOKEN:-}"
API_BASE="${API_BASE:-https://hoa.example.com/api}"

if [ -z "$ADMIN_TOKEN" ]; then
  echo "ERROR: ADMIN_TOKEN environment variable not set"
  exit 1
fi

update_config() {
  local KEY=$1
  local VALUE=$2
  echo "Setting $KEY = $VALUE..."
  curl -s -X PUT "$API_BASE/admin/config/$KEY" \
    -H "Authorization: Bearer $ADMIN_TOKEN" \
    -H "Content-Type: application/json" \
    -d "{\"value\": \"$VALUE\"}" \
    | jq -r '.status // "ERROR"'
}

update_config "accessibility.high-vis-default" "false"
update_config "accessibility.font-scaling" "true"

echo ""
echo "Accessibility Phase 1 complete!"
echo "Users can toggle high-vis mode via UI"
echo "Monitor: Accessibility adoption KPI (target >15%)"
