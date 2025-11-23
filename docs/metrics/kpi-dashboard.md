# KPI Dashboard Documentation

<!-- anchor: kpi-dashboard -->

**Owner:** Operations Team
**Last Updated:** 2025-11-23
**Related:** [Operational Architecture Section 3.13](../../.codemachine/artifacts/architecture/04_Operational_Architecture.md#3-13-operational-metrics-kpi), [Feature Flags Runbook](../runbooks/feature-flags.md), [Go/No-Go Checklist](../runbooks/go-no-go-checklist.md)

---

## Overview

This document provides instructions for setting up, maintaining, and interpreting Key Performance Indicators (KPIs) for the HOA Management System. The KPI dashboard enables board members and operators to monitor platform health, feature adoption, and community engagement without requiring external analytics tools or data warehouses.

**Dashboard Philosophy:**
- Simple, human-readable metrics derived from SQLite queries and `/metrics` endpoint
- Manual monthly rollups exported to spreadsheets for board review
- Aligns with roadmap goals: transparent governance, accessible UX, responsive communications
- No SaaS dependencies; reproducible analysis from audit tables and logs

**Update Frequency:**
- Real-time metrics: Available via `/metrics` endpoint
- Weekly reviews: Manual query execution for trend analysis
- Monthly reports: Exported to spreadsheet and shared with residents

---

## KPI Definitions

<!-- anchor: kpi-definitions -->

The following KPIs are derived from [Operational Architecture Section 3.13](../../.codemachine/artifacts/architecture/04_Operational_Architecture.md#3-13-operational-metrics-kpi) and provide the authoritative measurement framework for platform success.

### 1. Board Engagement Rate

<!-- anchor: kpi-board-engagement -->

**Definition:** Count of board roster page views by members divided by total active members per month.

**Purpose:** Measures transparency effectiveness and resident interest in board governance.

**Data Sources:**
- Page views: `AuditEvents` table where `action = 'page_view'` and `details LIKE '%/board%'`
- Active members: `Users` table where `role = 'member'` and `is_active = 1`

**Query:**
```sql
-- Board page views (monthly)
SELECT COUNT(DISTINCT user_id) AS unique_viewers
FROM AuditEvents
WHERE action = 'page_view'
  AND details LIKE '%/board%'
  AND created_at >= date('now', 'start of month')
  AND created_at < date('now', 'start of month', '+1 month');

-- Total active members
SELECT COUNT(*) AS total_members
FROM Users
WHERE role = 'member' AND is_active = 1;

-- Engagement rate calculation
-- Engagement Rate (%) = (unique_viewers / total_members) * 100
```

**Target:** >40% monthly engagement
**Interpretation:**
- **>50%:** Excellent transparency, residents actively monitoring governance
- **30-50%:** Healthy engagement, typical for stable periods
- **<30%:** Consider communication campaigns or UI improvements

**Automation Notes:**
- Export via monthly cron: `scripts/export-kpi-board-engagement.sh`
- Append results to `docs/metrics/reports/YYYY-MM-board-engagement.csv`

---

### 2. Accessibility Adoption

<!-- anchor: kpi-accessibility-adoption -->

**Definition:** Percentage of sessions with high-visibility mode enabled, tracked via frontend events and Config toggles.

**Purpose:** Validates accessibility suite adoption and informs future UX enhancements.

**Data Sources:**
- Frontend localStorage events logged to `AuditEvents` on theme toggle
- Config table: `accessibility.high-vis-default` flag state
- User preferences: `UserPreferences` table (if implemented)

**Query:**
```sql
-- Sessions with high-vis enabled (monthly)
SELECT COUNT(DISTINCT user_id) AS high_vis_users
FROM AuditEvents
WHERE action = 'accessibility_toggle'
  AND details LIKE '%high-visibility:true%'
  AND created_at >= date('now', 'start of month')
  AND created_at < date('now', 'start of month', '+1 month');

-- Total sessions (monthly)
SELECT COUNT(DISTINCT user_id) AS total_sessions
FROM AuditEvents
WHERE action = 'session_start'
  AND created_at >= date('now', 'start of month')
  AND created_at < date('now', 'start of month', '+1 month');

-- Adoption rate calculation
-- Adoption Rate (%) = (high_vis_users / total_sessions) * 100
```

**Target:** >15% adoption (indicates accessibility awareness)
**Interpretation:**
- **>20%:** Strong adoption, consider making high-vis default for new users
- **10-20%:** Moderate adoption, continue outreach
- **<10%:** Low awareness, improve documentation or onboarding

**Frontend Instrumentation:**
- Accessibility toggle emits event: `{ action: 'accessibility_toggle', details: 'high-visibility:true' }`
- Logged via `POST /api/audit/events` on theme change

---

### 3. Poll Participation

<!-- anchor: kpi-poll-participation -->

**Definition:** Ratio of unique voters to eligible members, measured separately for informal and binding polls.

**Purpose:** Assesses democracy module engagement and notification effectiveness.

**Data Sources:**
- Votes: `Votes` table joined with `Polls` table
- Eligible members: `Users` table where `role = 'member'` and `is_active = 1`

**Query:**
```sql
-- Unique voters per poll type (monthly)
SELECT
  p.is_binding,
  COUNT(DISTINCT v.user_id) AS unique_voters,
  (SELECT COUNT(*) FROM Users WHERE role = 'member' AND is_active = 1) AS eligible_members,
  ROUND(
    (COUNT(DISTINCT v.user_id) * 100.0) /
    (SELECT COUNT(*) FROM Users WHERE role = 'member' AND is_active = 1),
    2
  ) AS participation_rate
FROM Votes v
JOIN Polls p ON v.poll_id = p.id
WHERE v.created_at >= date('now', 'start of month')
  AND v.created_at < date('now', 'start of month', '+1 month')
GROUP BY p.is_binding;
```

**Target:**
- Informal polls: >30% participation
- Binding polls: >60% participation

**Interpretation:**
- Low participation may indicate notification failures, lack of interest, or poor poll timing
- Compare participation rates before/after enabling `polls.notify-members-enabled` flag

**Segmentation:**
- Track participation by poll category (governance, amenities, community events)
- Monitor time-to-vote (receipt timestamp - poll creation) to assess urgency

---

### 4. Vote Receipt Verification

<!-- anchor: kpi-vote-receipt-verification -->

**Definition:** Number of receipts looked up via API, indicating resident trust and audit activity.

**Purpose:** Measures transparency and trust in democracy module hash chain integrity.

**Data Sources:**
- Receipt lookups: `AuditEvents` table where `action = 'receipt_verification'`
- Total votes cast: `Votes` table

**Query:**
```sql
-- Receipt verifications (monthly)
SELECT COUNT(*) AS receipt_lookups
FROM AuditEvents
WHERE action = 'receipt_verification'
  AND created_at >= date('now', 'start of month')
  AND created_at < date('now', 'start of month', '+1 month');

-- Total votes cast (monthly)
SELECT COUNT(*) AS total_votes
FROM Votes
WHERE created_at >= date('now', 'start of month')
  AND created_at < date('now', 'start of month', '+1 month');

-- Verification rate calculation
-- Verification Rate (%) = (receipt_lookups / total_votes) * 100
```

**Target:** >5% verification rate (indicates audit awareness)
**Interpretation:**
- **>10%:** High trust verification, residents actively auditing
- **3-10%:** Moderate verification, expected baseline
- **<3%:** Low verification, consider educational campaigns

**Enhancement Tracking:**
- Monitor correlation between verification rate and poll controversy
- Track verification spikes after board meetings or contentious votes

---

### 5. Email Success Rate

<!-- anchor: kpi-email-success-rate -->

**Definition:** SendGrid delivery percentage minus bounce percentage; alerts fired if below 98%.

**Purpose:** Ensures reliable communication infrastructure for poll notifications and vendor updates.

**Data Sources:**
- Email audit: `EmailAudit` table with delivery status
- SendGrid dashboard: Manual export of bounce/delivery stats

**Query:**
```sql
-- Email delivery stats (monthly)
SELECT
  COUNT(*) AS total_sent,
  SUM(CASE WHEN status = 'delivered' THEN 1 ELSE 0 END) AS delivered,
  SUM(CASE WHEN status = 'bounced' THEN 1 ELSE 0 END) AS bounced,
  SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) AS failed,
  ROUND(
    (SUM(CASE WHEN status = 'delivered' THEN 1 ELSE 0 END) * 100.0) / COUNT(*),
    2
  ) AS success_rate
FROM EmailAudit
WHERE created_at >= date('now', 'start of month')
  AND created_at < date('now', 'start of month', '+1 month');
```

**Target:** >98% success rate
**Interpretation:**
- **<98%:** Investigate SendGrid API issues, invalid email addresses, or rate limiting
- **>99%:** Healthy email infrastructure, maintain current practices

**Alert Configuration:**
- HealthMonitor script checks daily: If success rate <98% for 24 hours, email ops team
- SendGrid webhook updates `EmailAudit` table with delivery events

**Remediation Steps:**
1. Review bounced emails: `SELECT email FROM EmailAudit WHERE status = 'bounced'`
2. Validate email addresses in `Users` table
3. Check SendGrid dashboard for domain reputation issues
4. Rotate SendGrid API key if rate limits exceeded

---

### 6. Health Check Pass Rate

<!-- anchor: kpi-health-check-pass-rate -->

**Definition:** Fraction of hourly cron pings returning HTTP 200; target is 99% or greater.

**Purpose:** Monitors platform availability and runtime stability.

**Data Sources:**
- HealthMonitor log: `/var/log/hoa/health-monitor.log`
- `/healthz` endpoint response codes

**Query (Log Parsing):**
```bash
# Count successful health checks (monthly)
grep -c "HTTP 200" /var/log/hoa/health-monitor.log | wc -l

# Total health check attempts (monthly)
grep -c "healthz" /var/log/hoa/health-monitor.log | wc -l

# Pass rate calculation
# Pass Rate (%) = (success_count / total_attempts) * 100
```

**Target:** >99% pass rate
**Interpretation:**
- **<99%:** Investigate container restarts, database locks, or SendGrid timeouts
- **100%:** Ideal; maintain current operational practices

**Automation:**
- Cron runs `scripts/healthcheck.sh` every 60 minutes
- Log rotates weekly; retain 4 weeks of data for trend analysis

---

### 7. Vendor Directory Freshness

<!-- anchor: kpi-vendor-freshness -->

**Definition:** Days since last vendor update; if >90 days, admin reminder triggers.

**Purpose:** Ensures vendor directory remains current and valuable to residents.

**Data Sources:**
- Vendor updates: `Vendors` table `updated_at` column

**Query:**
```sql
-- Vendors not updated in 90+ days
SELECT
  id,
  name,
  service_category,
  CAST((julianday('now') - julianday(updated_at)) AS INTEGER) AS days_stale
FROM Vendors
WHERE moderation_status = 'approved'
  AND (julianday('now') - julianday(updated_at)) > 90
ORDER BY days_stale DESC;

-- Average freshness across all vendors
SELECT
  AVG(CAST((julianday('now') - julianday(updated_at)) AS INTEGER)) AS avg_days_old,
  MAX(CAST((julianday('now') - julianday(updated_at)) AS INTEGER)) AS oldest_vendor_days
FROM Vendors
WHERE moderation_status = 'approved';
```

**Target:** <90 days average freshness
**Interpretation:**
- **>120 days:** Stale directory, schedule admin review of outdated vendors
- **60-90 days:** Acceptable, remind admins to verify contact info
- **<60 days:** Excellent freshness, active community contributions

**Automation:**
- Monthly cron emails admins list of stale vendors for review
- Script: `scripts/vendor-freshness-check.sh`

---

### 8. Average Response Time

<!-- anchor: kpi-response-time -->

**Definition:** Express middleware records p95 latencies per endpoint, ensuring Node remains responsive under load.

**Purpose:** Validates performance stays within acceptable limits on 1GB RAM Nanode.

**Data Sources:**
- `/metrics` endpoint: Prometheus histogram `http_request_duration_ms`
- Express middleware logs: `req.responseTime` field

**Query (Prometheus Format):**
```
# Via /metrics endpoint
http_request_duration_ms_bucket{le="100",route="/board"} 450
http_request_duration_ms_bucket{le="250",route="/board"} 480
http_request_duration_ms_bucket{le="500",route="/board"} 490
http_request_duration_ms_count{route="/board"} 500

# p95 calculation (manual from buckets or automated in script)
```

**Target:** p95 <250ms for API routes, <500ms for page loads
**Interpretation:**
- **p95 >500ms:** Investigate database query optimization or caching gaps
- **p95 <250ms:** Excellent performance, current architecture sufficient

**Critical Endpoints to Monitor:**
- `/api/board` - Board roster fetch
- `/api/polls` - Poll list
- `/api/vendors` - Vendor directory
- `/api/config/flags` - Feature flag fetch

**Performance Budget:**
- Board queries cached for 60s
- Vendor queries cached for 60s
- Poll queries cached for 30s (fresher for active votes)

---

### 9. Config Drift Count

<!-- anchor: kpi-config-drift -->

**Definition:** Number of Config keys changed per month; spikes prompt documentation reviews.

**Purpose:** Tracks operational stability and flags potential misconfiguration or excessive experimentation.

**Data Sources:**
- Config changes: `AuditEvents` table where `action = 'config_update'`

**Query:**
```sql
-- Config changes (monthly)
SELECT
  COUNT(*) AS total_changes,
  COUNT(DISTINCT JSON_EXTRACT(details, '$.key')) AS unique_keys_changed,
  u.email AS operator
FROM AuditEvents ae
JOIN Users u ON ae.user_id = u.id
WHERE action = 'config_update'
  AND created_at >= date('now', 'start of month')
  AND created_at < date('now', 'start of month', '+1 month')
GROUP BY u.email
ORDER BY total_changes DESC;
```

**Target:** <10 changes per month (stable operations)
**Interpretation:**
- **>20 changes:** Excessive drift, review with ops team for root cause
- **10-20 changes:** Moderate experimentation, document rationale
- **<10 changes:** Stable configuration, healthy operations

**Review Triggers:**
- Spikes after major releases are expected; subsequent months should stabilize
- Unplanned spikes require incident review

---

### 10. CI Success Ratio

<!-- anchor: kpi-ci-success-ratio -->

**Definition:** Builds passing on first attempt; low ratio indicates flaky tests needing attention.

**Purpose:** Validates development workflow quality and test reliability.

**Data Sources:**
- GitHub Actions workflow history (manual export or API query)
- Local metric tracking: `docs/metrics/ci-success-log.csv`

**Query (GitHub Actions API):**
```bash
# Fetch workflow runs (monthly)
gh api repos/:owner/:repo/actions/runs \
  --jq '.workflow_runs[] | select(.created_at >= "2025-11-01") | {id, status, conclusion}' \
  | jq -s 'group_by(.conclusion) | map({conclusion: .[0].conclusion, count: length})'

# Success ratio calculation
# Success Ratio (%) = (success_count / total_runs) * 100
```

**Target:** >85% success ratio
**Interpretation:**
- **<80%:** Flaky tests or configuration issues, prioritize test stabilization
- **80-90%:** Acceptable, monitor for trends
- **>90%:** Excellent CI health, maintain current practices

**Common Failure Causes:**
- Accessibility tests timing out (increase test timeouts)
- SendGrid sandbox API failures (retry logic)
- SQLite lock contention (serialize test execution)

---

## Dashboard Setup Instructions

<!-- anchor: dashboard-setup -->

### Spreadsheet Template

Create a monthly KPI spreadsheet with the following structure:

**File:** `docs/metrics/reports/YYYY-MM-kpi-report.xlsx`

**Tabs:**
1. **Summary Dashboard** - Visual overview with traffic-light indicators
2. **Board Engagement** - Detailed query results
3. **Accessibility Adoption** - Trend analysis
4. **Poll Participation** - Segmented by poll type
5. **Email & Health** - Infrastructure metrics
6. **Vendor & Config** - Operational stability
7. **CI Metrics** - Build success trends

**Summary Dashboard Columns:**
| KPI | Target | Actual | Status | Trend | Notes |
|-----|--------|--------|--------|-------|-------|
| Board Engagement Rate | >40% | 47% | 🟢 | ↑ | Increased after board update email |
| Accessibility Adoption | >15% | 12% | 🟡 | → | Promote in next newsletter |
| Poll Participation (Informal) | >30% | 35% | 🟢 | ↑ | High turnout on landscaping poll |
| Poll Participation (Binding) | >60% | N/A | ⚪ | - | No binding polls this month |
| Email Success Rate | >98% | 99.2% | 🟢 | → | Stable delivery |
| Health Check Pass Rate | >99% | 100% | 🟢 | → | No downtime |
| Vendor Freshness | <90d | 65d | 🟢 | ↓ | Recent vendor updates |
| Avg Response Time (p95) | <250ms | 180ms | 🟢 | → | Performance stable |
| Config Drift Count | <10 | 6 | 🟢 | ↓ | Normal operations |
| CI Success Ratio | >85% | 92% | 🟢 | ↑ | Test stabilization paid off |

**Legend:**
- 🟢 On Target
- 🟡 At Risk
- 🔴 Critical
- ⚪ No Data
- ↑ Improving
- → Stable
- ↓ Declining

---

### Data Collection Scripts

<!-- anchor: dashboard-scripts -->

Create automated scripts under `scripts/kpi/` to extract monthly data:

**1. Master KPI Export Script**
```bash
#!/bin/bash
# scripts/kpi/export-all-kpis.sh
# Exports all KPI data for current month to CSV files

MONTH=$(date +%Y-%m)
OUTPUT_DIR="docs/metrics/reports/${MONTH}"
mkdir -p "${OUTPUT_DIR}"

echo "Exporting KPIs for ${MONTH}..."

# 1. Board Engagement
sqlite3 backend/database/hoa.db < scripts/kpi/queries/board-engagement.sql \
  > "${OUTPUT_DIR}/board-engagement.csv"

# 2. Accessibility Adoption
sqlite3 backend/database/hoa.db < scripts/kpi/queries/accessibility-adoption.sql \
  > "${OUTPUT_DIR}/accessibility-adoption.csv"

# 3. Poll Participation
sqlite3 backend/database/hoa.db < scripts/kpi/queries/poll-participation.sql \
  > "${OUTPUT_DIR}/poll-participation.csv"

# 4. Vote Receipt Verification
sqlite3 backend/database/hoa.db < scripts/kpi/queries/receipt-verification.sql \
  > "${OUTPUT_DIR}/receipt-verification.csv"

# 5. Email Success Rate
sqlite3 backend/database/hoa.db < scripts/kpi/queries/email-success-rate.sql \
  > "${OUTPUT_DIR}/email-success-rate.csv"

# 6. Health Check Pass Rate
bash scripts/kpi/health-check-pass-rate.sh > "${OUTPUT_DIR}/health-check-pass-rate.csv"

# 7. Vendor Freshness
sqlite3 backend/database/hoa.db < scripts/kpi/queries/vendor-freshness.sql \
  > "${OUTPUT_DIR}/vendor-freshness.csv"

# 8. Response Time (from /metrics)
curl -s https://hoa.example.com/metrics | grep http_request_duration \
  > "${OUTPUT_DIR}/response-time-metrics.txt"

# 9. Config Drift
sqlite3 backend/database/hoa.db < scripts/kpi/queries/config-drift.sql \
  > "${OUTPUT_DIR}/config-drift.csv"

# 10. CI Success Ratio (manual entry or GitHub API)
echo "CI Success Ratio: See GitHub Actions dashboard" \
  > "${OUTPUT_DIR}/ci-success-ratio.txt"

echo "KPI export complete. Results in ${OUTPUT_DIR}/"
```

**2. SQL Query Templates**

Store reusable queries in `scripts/kpi/queries/`:
- `board-engagement.sql`
- `accessibility-adoption.sql`
- `poll-participation.sql`
- `receipt-verification.sql`
- `email-success-rate.sql`
- `vendor-freshness.sql`
- `config-drift.sql`

**3. Cron Scheduling**

Add to `/etc/cron.d/hoa-kpi`:
```cron
# Export KPI data on first day of month at 1 AM
0 1 1 * * hoaapp /opt/hoa/scripts/kpi/export-all-kpis.sh >> /var/log/hoa/kpi-export.log 2>&1
```

---

## Interpretation Guidelines

<!-- anchor: dashboard-interpretation -->

### Monthly Review Process

**Week 1 of New Month:**
1. Run `scripts/kpi/export-all-kpis.sh` to generate reports
2. Import CSVs into KPI spreadsheet template
3. Calculate status indicators (🟢🟡🔴) based on targets
4. Identify trends: Compare to previous 3 months
5. Draft summary notes highlighting changes

**Week 2:**
1. Present KPI dashboard to operations team
2. Discuss anomalies (e.g., spike in config drift, email delivery drop)
3. Assign action items for at-risk (🟡) or critical (🔴) metrics
4. Document context (e.g., "Accessibility adoption down due to newsletter skipped")

**Week 3:**
1. Share summary dashboard with board members
2. Include in monthly resident transparency report
3. Archive report in `docs/metrics/reports/` for historical reference

**Week 4:**
1. Track action items from Week 2 review
2. Update runbooks if operational gaps identified
3. Propose feature enhancements based on KPI insights (e.g., improve poll notification timing)

---

### Contextual Analysis

**Cross-KPI Correlations:**
- **Low poll participation + Low email success rate:** Notification delivery issue
- **High config drift + Increased support tickets:** Operational instability
- **Low vendor freshness + High vendor page views:** Demand exceeds supply, recruit submissions
- **High board engagement + Binding poll creation:** Increased governance transparency

**Seasonal Patterns:**
- **Summer:** Lower engagement due to vacations (adjust targets -10%)
- **Fall:** Peak engagement around annual budget votes (expect spikes)
- **Winter:** Lower vendor directory usage (landscaping/snow removal seasonal)

**Red Flags Requiring Immediate Action:**
- **Email success rate <95%:** Risk of missing critical poll notifications
- **Health check pass rate <95%:** Platform instability, investigate immediately
- **CI success ratio <70%:** Development velocity at risk, halt feature work
- **Config drift >30 changes/month:** Operational chaos, freeze config changes pending review

---

## KPI Evolution & Refinement

<!-- anchor: dashboard-evolution -->

### Quarterly Review

Every 3 months, review KPI definitions and targets with stakeholders:

**Review Questions:**
1. Are current KPIs still relevant to roadmap goals?
2. Do targets reflect realistic community behavior?
3. Are any KPIs too difficult or expensive to collect?
4. What new KPIs would provide additional insights?

**Example Enhancements:**
- Add **Vendor Submission Rate** (new vendors submitted per month)
- Add **Accessibility Feature Usage** (font scaling, screen reader events)
- Split **Poll Participation** by weekday vs. weekend to optimize notification timing
- Add **Admin Moderation Latency** (hours from vendor submission to approval)

### Data Quality Checks

**Monthly Validation:**
- Verify query results against manual spot checks (sample 10 records)
- Confirm `/metrics` endpoint data matches audit table counts
- Test spreadsheet formulas with known edge cases

**Data Integrity:**
- Audit table constraints prevent orphaned records
- Email audit webhook failures logged for manual reconciliation
- Health check log parsing handles missing timestamps gracefully

---

## Troubleshooting

<!-- anchor: dashboard-troubleshooting -->

### Issue: KPI Query Returns Zero Results

**Symptoms:** CSV export contains headers but no data rows.

**Diagnosis:**
1. Verify audit logging is enabled: Check `AuditEvents` table has recent entries
2. Confirm date range logic: Ensure `date('now', 'start of month')` returns expected range
3. Test query in SQLite CLI: Run query manually and inspect results

**Resolution:**
- If audit events missing: Review backend middleware logging configuration
- If date logic incorrect: Adjust query for local timezone offsets
- If data legitimately zero: Document in KPI report notes (e.g., "No binding polls this month")

---

### Issue: Spreadsheet Formulas Break After Import

**Symptoms:** Status indicators show `#REF!` or incorrect colors.

**Diagnosis:**
1. Check CSV encoding: Ensure UTF-8 without BOM
2. Verify column order matches template
3. Test formulas with sample data

**Resolution:**
- Re-export CSVs with explicit encoding: `sqlite3 -csv -header`
- Update spreadsheet template to reference columns by name, not index
- Document import procedure in this runbook

---

### Issue: Prometheus Metrics Unavailable

**Symptoms:** `/metrics` endpoint returns 404 or empty response.

**Diagnosis:**
1. Confirm Express middleware registered: Check `backend/src/app.js`
2. Verify route not blocked by firewall or auth middleware
3. Test locally: `curl http://localhost:8080/metrics`

**Resolution:**
- If middleware missing: Add Prometheus middleware to Express app
- If auth blocking: Whitelist `/metrics` route for internal monitoring
- If format incorrect: Review Prometheus text format specification

---

## Related Documentation

<!-- anchor: dashboard-related-docs -->

- **Architecture:**
  - [Section 3.13: Operational Metrics & KPIs](../../.codemachine/artifacts/architecture/04_Operational_Architecture.md#3-13-operational-metrics-kpi)
  - [Section 3.7: Observability & Health Management](../../.codemachine/artifacts/architecture/04_Operational_Architecture.md#3-7-observability-health)
- **Runbooks:**
  - [Feature Flags Runbook](../runbooks/feature-flags.md)
  - [Go/No-Go Checklist](../runbooks/go-no-go-checklist.md)
  - [Health Monitor Runbook](../runbooks/health-monitor.md)
- **Plan References:**
  - [Task I5.T6](../../.codemachine/artifacts/plan/02_Iteration_I5.md#task-i5-t6)
  - [Iteration 5 Plan](../../.codemachine/artifacts/plan/02_Iteration_I5.md#iteration-5-plan)

---

## Maintenance & Ownership

**Review Schedule:** Quarterly or after major feature releases

**Update Triggers:**
- New audit events added to track additional user behaviors
- Feature flags changed affecting KPI data sources
- Board requests new metrics for governance oversight
- Community feedback suggests alternative measurements

**Change Process:**
1. Propose KPI changes in operations team meeting
2. Update query templates and spreadsheet template
3. Test queries against staging database
4. Update this documentation with new KPIs
5. Archive old KPI definitions in `docs/metrics/deprecated/`

**Owner:** Operations Team
**Review Approvers:** Tech Lead, Product Owner, Board Liaison

---

**End of Document**

For questions or KPI dashboard updates, contact Operations team or file issue with label `ops/metrics`.
