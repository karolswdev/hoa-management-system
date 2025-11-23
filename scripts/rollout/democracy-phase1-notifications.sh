#!/bin/bash
# scripts/rollout/democracy-phase1-notifications.sh
# Enables poll notifications for pilot testing

set -e

echo "=== Democracy Phase 1: Notification Testing ==="

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

update_config "polls.enabled" "true"
update_config "polls.notify-members-enabled" "true"
update_config "polls.binding-enabled" "false"  # Keep disabled until legal review
update_config "polls.public-results" "false"   # Admin-only results

echo ""
echo "Democracy Phase 1 complete!"
echo "Create test poll with notify_members=true to validate email delivery"
echo "Monitor: Email success rate, poll participation KPIs"
