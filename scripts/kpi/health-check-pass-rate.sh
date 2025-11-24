#!/bin/bash
# scripts/kpi/health-check-pass-rate.sh
# Calculates health check pass rate from log files

set -e

LOG_FILE="${LOG_FILE:-/var/log/hoa/health-monitor.log}"
MONTH=$(date +%Y-%m)

# Output CSV header
echo "month,pass_rate_pct,total_checks,successful_checks"

# Check if log file exists
if [ ! -f "$LOG_FILE" ]; then
  echo "$MONTH,0,0,0"
  exit 0
fi

# Count successful health checks (HTTP 200 responses)
SUCCESS_COUNT=$(grep -c "HTTP 200" "$LOG_FILE" 2>/dev/null || echo 0)

# Count total health check attempts
TOTAL_COUNT=$(grep -c "healthz" "$LOG_FILE" 2>/dev/null || echo 0)

# Calculate pass rate
if [ "$TOTAL_COUNT" -gt 0 ]; then
  PASS_RATE=$(echo "scale=2; ($SUCCESS_COUNT * 100) / $TOTAL_COUNT" | bc)
else
  PASS_RATE=0
fi

echo "$MONTH,$PASS_RATE,$TOTAL_COUNT,$SUCCESS_COUNT"
