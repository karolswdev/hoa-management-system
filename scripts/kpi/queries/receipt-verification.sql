-- Vote Receipt Verification KPI Query
-- Number of receipts looked up via API

.mode csv
.headers on

WITH receipt_lookups AS (
  SELECT COUNT(*) AS lookup_count
  FROM AuditEvents
  WHERE action = 'receipt_verification'
    AND created_at >= date('now', 'start of month')
    AND created_at < date('now', 'start of month', '+1 month')
),
total_votes AS (
  SELECT COUNT(*) AS vote_count
  FROM Votes
  WHERE created_at >= date('now', 'start of month')
    AND created_at < date('now', 'start of month', '+1 month')
)
SELECT
  strftime('%Y-%m', 'now') AS month,
  r.lookup_count AS receipt_verifications,
  v.vote_count AS total_votes,
  ROUND((r.lookup_count * 100.0) / NULLIF(v.vote_count, 0), 2) AS verification_rate_pct
FROM receipt_lookups r, total_votes v;
