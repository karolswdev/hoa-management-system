#!/bin/bash
# scripts/rollout/phase1-admin-pilot.sh
# Configures feature flags for Phase 1 (Admin-Only Pilot)

set -e

echo "=== Phase 1: Admin-Only Pilot ==="
echo "Setting feature flags for admin-only access..."

# Set flags via Admin UI API (requires admin token)
ADMIN_TOKEN="${ADMIN_TOKEN:-}"
API_BASE="${API_BASE:-https://hoa.example.com/api}"

if [ -z "$ADMIN_TOKEN" ]; then
  echo "ERROR: ADMIN_TOKEN environment variable not set"
  echo "Usage: ADMIN_TOKEN=<token> ./phase1-admin-pilot.sh"
  exit 1
fi

# Helper function to update config
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

# Vendor Directory flags
update_config "vendors.directory" "false"
update_config "vendors.member-submissions" "false"
update_config "vendors.public-categories" ""

# Accessibility flags (enable for pilot testing)
update_config "accessibility.high-vis-default" "false"

# Democracy flags (keep existing state)
echo "Democracy flags unchanged (already enabled from I3)"

echo ""
echo "Phase 1 configuration complete!"
echo "Verify admin access: https://hoa.example.com/admin/vendors"
echo "Next: Run KPI baseline measurement before pilot starts"
