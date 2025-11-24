#!/bin/bash
# scripts/kpi/export-all-kpis.sh
# Exports all KPI data for current month to CSV files

set -e

MONTH=$(date +%Y-%m)
OUTPUT_DIR="docs/metrics/reports/${MONTH}"
DB_PATH="${DB_PATH:-backend/database/hoa.db}"

mkdir -p "${OUTPUT_DIR}"

echo "Exporting KPIs for ${MONTH}..."
echo "Database: ${DB_PATH}"
echo "Output: ${OUTPUT_DIR}"
echo ""

# Check if database exists
if [ ! -f "$DB_PATH" ]; then
  echo "WARNING: Database not found at $DB_PATH"
  echo "KPI export will fail. Ensure database path is correct."
  exit 1
fi

# 1. Board Engagement
echo "[1/10] Exporting board engagement..."
sqlite3 "$DB_PATH" < scripts/kpi/queries/board-engagement.sql \
  > "${OUTPUT_DIR}/board-engagement.csv"

# 2. Accessibility Adoption
echo "[2/10] Exporting accessibility adoption..."
sqlite3 "$DB_PATH" < scripts/kpi/queries/accessibility-adoption.sql \
  > "${OUTPUT_DIR}/accessibility-adoption.csv"

# 3. Poll Participation
echo "[3/10] Exporting poll participation..."
sqlite3 "$DB_PATH" < scripts/kpi/queries/poll-participation.sql \
  > "${OUTPUT_DIR}/poll-participation.csv"

# 4. Vote Receipt Verification
echo "[4/10] Exporting receipt verification..."
sqlite3 "$DB_PATH" < scripts/kpi/queries/receipt-verification.sql \
  > "${OUTPUT_DIR}/receipt-verification.csv"

# 5. Email Success Rate
echo "[5/10] Exporting email success rate..."
sqlite3 "$DB_PATH" < scripts/kpi/queries/email-success-rate.sql \
  > "${OUTPUT_DIR}/email-success-rate.csv"

# 6. Health Check Pass Rate
echo "[6/10] Exporting health check pass rate..."
bash scripts/kpi/health-check-pass-rate.sh > "${OUTPUT_DIR}/health-check-pass-rate.csv" || echo "month,pass_rate_pct,total_checks,successful_checks" > "${OUTPUT_DIR}/health-check-pass-rate.csv"

# 7. Vendor Freshness
echo "[7/10] Exporting vendor freshness..."
sqlite3 "$DB_PATH" < scripts/kpi/queries/vendor-freshness.sql \
  > "${OUTPUT_DIR}/vendor-freshness.csv"

# 8. Response Time (from /metrics)
echo "[8/10] Exporting response time metrics..."
API_BASE="${API_BASE:-https://hoa.example.com}"
curl -s "${API_BASE}/metrics" 2>/dev/null | grep http_request_duration \
  > "${OUTPUT_DIR}/response-time-metrics.txt" || echo "# Metrics endpoint unavailable" > "${OUTPUT_DIR}/response-time-metrics.txt"

# 9. Config Drift
echo "[9/10] Exporting config drift..."
sqlite3 "$DB_PATH" < scripts/kpi/queries/config-drift.sql \
  > "${OUTPUT_DIR}/config-drift.csv"

# 10. CI Success Ratio (manual entry or GitHub API)
echo "[10/10] CI Success Ratio (manual)..."
echo "# CI Success Ratio: See GitHub Actions dashboard at https://github.com/<owner>/<repo>/actions" \
  > "${OUTPUT_DIR}/ci-success-ratio.txt"
echo "# Manual entry: Run 'gh api repos/:owner/:repo/actions/runs' for automated data" \
  >> "${OUTPUT_DIR}/ci-success-ratio.txt"

echo ""
echo "======================================"
echo "KPI export complete!"
echo "Results saved to: ${OUTPUT_DIR}/"
echo "======================================"
echo ""
echo "Next steps:"
echo "1. Import CSVs into KPI spreadsheet template"
echo "2. Review metrics against targets"
echo "3. Update monthly report with trends and action items"
echo ""
echo "Files exported:"
ls -lh "${OUTPUT_DIR}/"
