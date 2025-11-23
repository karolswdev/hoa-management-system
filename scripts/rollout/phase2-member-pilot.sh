#!/bin/bash
# scripts/rollout/phase2-member-pilot.sh
# Configures feature flags for Phase 2 (Member Pilot)

set -e

echo "=== Phase 2: Member Pilot ==="
echo "Enabling vendor directory for authenticated members..."

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

# Enable vendor directory for members
update_config "vendors.directory" "true"
update_config "vendors.member-submissions" "true"
update_config "vendors.public-categories" ""  # Keep empty (members-only)

# Accessibility flags (enable high-vis for broader testing)
update_config "accessibility.high-vis-default" "false"  # Keep opt-in

# Poll notification flags (ensure enabled for pilot engagement)
update_config "polls.notify-members-enabled" "true"

echo ""
echo "Phase 2 configuration complete!"
echo "Verify member access: https://hoa.example.com/vendors"
echo "Monitor KPIs: Vendor submission rate, moderation SLA"
echo "Next: Wait 1-2 weeks, then proceed to Phase 3 via Go/No-Go review"
