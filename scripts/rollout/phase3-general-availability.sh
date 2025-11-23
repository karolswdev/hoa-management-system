#!/bin/bash
# scripts/rollout/phase3-general-availability.sh
# Configures feature flags for Phase 3 (General Availability)

set -e

echo "=== Phase 3: General Availability ==="
echo "Enabling vendor directory for all users (including guests)..."

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

# Enable full vendor directory access
update_config "vendors.directory" "true"
update_config "vendors.member-submissions" "true"
update_config "vendors.public-categories" "Landscaping,Plumbing,Electrical,HVAC,Roofing,Painting,Snow Removal"

# Accessibility flags (consider making high-vis default based on pilot KPIs)
HIGHVIS_ADOPTION=$(curl -s "$API_BASE/metrics/accessibility-adoption" \
  -H "Authorization: Bearer $ADMIN_TOKEN" | jq -r '.adoption_rate')
if (( $(echo "$HIGHVIS_ADOPTION > 20" | bc -l) )); then
  echo "High-vis adoption >20%, enabling as default for new users"
  update_config "accessibility.high-vis-default" "true"
else
  echo "High-vis adoption ${HIGHVIS_ADOPTION}%, keeping opt-in"
  update_config "accessibility.high-vis-default" "false"
fi

echo ""
echo "Phase 3 configuration complete!"
echo "Verify guest access: https://hoa.example.com/vendors (logged out)"
echo "Monitor KPIs: Vendor page views, support ticket volume"
echo "Next: 30-day post-GA monitoring, then finalize feature documentation"
