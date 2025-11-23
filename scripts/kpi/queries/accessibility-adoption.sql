-- Accessibility Adoption KPI Query
-- Percentage of sessions with high-visibility mode enabled

.mode csv
.headers on

WITH high_vis_users AS (
  SELECT COUNT(DISTINCT user_id) AS high_vis_count
  FROM AuditEvents
  WHERE action = 'accessibility_toggle'
    AND details LIKE '%high-visibility:true%'
    AND created_at >= date('now', 'start of month')
    AND created_at < date('now', 'start of month', '+1 month')
),
total_sessions AS (
  SELECT COUNT(DISTINCT user_id) AS session_count
  FROM AuditEvents
  WHERE action = 'session_start'
    AND created_at >= date('now', 'start of month')
    AND created_at < date('now', 'start of month', '+1 month')
)
SELECT
  strftime('%Y-%m', 'now') AS month,
  h.high_vis_count,
  t.session_count,
  ROUND((h.high_vis_count * 100.0) / t.session_count, 2) AS adoption_rate_pct
FROM high_vis_users h, total_sessions t;
