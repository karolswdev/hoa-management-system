#!/bin/bash
# scripts/rollout/emergency-disable.sh
# Emergency feature flag disablement for critical incidents

set -e

FEATURE_NAME="${1:-}"

if [ -z "$FEATURE_NAME" ]; then
  echo "ERROR: Feature name required"
  echo "Usage: ADMIN_TOKEN=<token> ./emergency-disable.sh <feature-name>"
  echo ""
  echo "Supported features:"
  echo "  vendors     - Disable vendor directory"
  echo "  democracy   - Disable poll creation and voting"
  echo "  accessibility - Disable accessibility features"
  echo "  all         - Disable all non-critical features"
  exit 1
fi

ADMIN_TOKEN="${ADMIN_TOKEN:-}"
API_BASE="${API_BASE:-https://hoa.example.com/api}"

if [ -z "$ADMIN_TOKEN" ]; then
  echo "ERROR: ADMIN_TOKEN environment variable not set"
  exit 1
fi

update_config() {
  local KEY=$1
  local VALUE=$2
  echo "Disabling $KEY..."
  curl -s -X PUT "$API_BASE/admin/config/$KEY" \
    -H "Authorization: Bearer $ADMIN_TOKEN" \
    -H "Content-Type: application/json" \
    -d "{\"value\": \"$VALUE\"}" \
    | jq -r '.status // "ERROR"'
}

echo "=== EMERGENCY DISABLE: $FEATURE_NAME ==="
echo "WARNING: This will immediately disable the feature for all users."
read -p "Proceed? (yes/no): " CONFIRM

if [ "$CONFIRM" != "yes" ]; then
  echo "Aborted."
  exit 1
fi

case "$FEATURE_NAME" in
  vendors)
    update_config "vendors.directory" "false"
    update_config "vendors.member-submissions" "false"
    echo "Vendor directory disabled."
    ;;
  democracy)
    update_config "polls.enabled" "false"
    update_config "polls.notify-members-enabled" "false"
    echo "Democracy module disabled (existing votes preserved)."
    ;;
  accessibility)
    update_config "accessibility.high-vis-default" "false"
    echo "Accessibility features disabled (users retain preferences)."
    ;;
  all)
    update_config "vendors.directory" "false"
    update_config "vendors.member-submissions" "false"
    update_config "polls.enabled" "false"
    update_config "polls.notify-members-enabled" "false"
    update_config "accessibility.high-vis-default" "false"
    echo "All non-critical features disabled."
    ;;
  *)
    echo "ERROR: Unknown feature '$FEATURE_NAME'"
    exit 1
    ;;
esac

echo ""
echo "Emergency disable complete. Verify at: $API_BASE/config/flags"
echo "Next steps:"
echo "1. Preserve logs: docker compose logs app --tail 1000 > incident-logs.txt"
echo "2. Notify stakeholders"
echo "3. Begin incident review"
