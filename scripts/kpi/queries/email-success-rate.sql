-- Email Success Rate KPI Query
-- SendGrid delivery percentage minus bounce percentage

.mode csv
.headers on

SELECT
  strftime('%Y-%m', 'now') AS month,
  COUNT(*) AS total_sent,
  SUM(CASE WHEN status = 'delivered' THEN 1 ELSE 0 END) AS delivered,
  SUM(CASE WHEN status = 'bounced' THEN 1 ELSE 0 END) AS bounced,
  SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) AS failed,
  ROUND(
    (SUM(CASE WHEN status = 'delivered' THEN 1 ELSE 0 END) * 100.0) / COUNT(*),
    2
  ) AS success_rate_pct
FROM EmailAudit
WHERE created_at >= date('now', 'start of month')
  AND created_at < date('now', 'start of month', '+1 month');
