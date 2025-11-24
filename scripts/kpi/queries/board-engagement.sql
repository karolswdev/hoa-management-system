-- Board Engagement Rate KPI Query
-- Counts unique board page viewers vs. total active members

.mode csv
.headers on

WITH monthly_viewers AS (
  SELECT COUNT(DISTINCT user_id) AS unique_viewers
  FROM AuditEvents
  WHERE action = 'page_view'
    AND details LIKE '%/board%'
    AND created_at >= date('now', 'start of month')
    AND created_at < date('now', 'start of month', '+1 month')
),
active_members AS (
  SELECT COUNT(*) AS total_members
  FROM Users
  WHERE role = 'member' AND is_active = 1
)
SELECT
  strftime('%Y-%m', 'now') AS month,
  v.unique_viewers,
  m.total_members,
  ROUND((v.unique_viewers * 100.0) / m.total_members, 2) AS engagement_rate_pct
FROM monthly_viewers v, active_members m;
