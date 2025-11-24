#!/bin/bash
# scripts/rollout/democracy-phase2-binding-polls.sh
# Enables binding polls after legal approval

set -e

echo "=== Democracy Phase 2: Binding Polls ==="
echo "WARNING: This enables binding votes. Ensure legal review complete."
read -p "Proceed? (yes/no): " CONFIRM

if [ "$CONFIRM" != "yes" ]; then
  echo "Aborted."
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
  echo "Setting $KEY = $VALUE..."
  curl -s -X PUT "$API_BASE/admin/config/$KEY" \
    -H "Authorization: Bearer $ADMIN_TOKEN" \
    -H "Content-Type: application/json" \
    -d "{\"value\": \"$VALUE\"}" \
    | jq -r '.status // "ERROR"'
}

update_config "polls.binding-enabled" "true"
update_config "polls.public-results" "true"  # Enable transparent results

# Run hash chain integrity check
echo ""
echo "Running hash chain integrity verification..."
curl -s "$API_BASE/polls/integrity-check" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  | jq '.'

echo ""
echo "Democracy Phase 2 complete!"
echo "Binding polls now enabled. Monitor vote receipt verification KPI."
echo "Verify hash chain integrity after first binding poll completes."
