#!/bin/bash
# scripts/rollout/accessibility-phase2-default-highvis.sh
# Enables high-vis mode as default for new users (based on KPI thresholds)

set -e

echo "=== Accessibility Phase 2: Default High-Vis Mode ==="

ADMIN_TOKEN="${ADMIN_TOKEN:-}"
API_BASE="${API_BASE:-https://hoa.example.com/api}"

if [ -z "$ADMIN_TOKEN" ]; then
  echo "ERROR: ADMIN_TOKEN environment variable not set"
  exit 1
fi

# Check adoption rate before proceeding
echo "Checking accessibility adoption rate..."
ADOPTION_RATE=$(curl -s "$API_BASE/metrics/accessibility-adoption" \
  -H "Authorization: Bearer $ADMIN_TOKEN" | jq -r '.adoption_rate')

echo "Current adoption rate: ${ADOPTION_RATE}%"

if (( $(echo "$ADOPTION_RATE < 20" | bc -l) )); then
  echo "ERROR: Adoption rate below 20% threshold"
  echo "Current: ${ADOPTION_RATE}%, Required: >20%"
  echo "Continue monitoring and re-run when threshold met."
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

update_config "accessibility.high-vis-default" "true"

echo ""
echo "Accessibility Phase 2 complete!"
echo "New users default to high-vis mode (existing users retain preferences)"
echo "Monitor: User feedback, support ticket volume"
