-- Config Drift Count KPI Query
-- Number of Config keys changed per month

.mode csv
.headers on

SELECT
  strftime('%Y-%m', 'now') AS month,
  COUNT(*) AS total_changes,
  COUNT(DISTINCT JSON_EXTRACT(details, '$.key')) AS unique_keys_changed,
  u.email AS operator,
  COUNT(*) AS changes_by_operator
FROM AuditEvents ae
JOIN Users u ON ae.user_id = u.id
WHERE action = 'config_update'
  AND created_at >= date('now', 'start of month')
  AND created_at < date('now', 'start of month', '+1 month')
GROUP BY u.email
ORDER BY changes_by_operator DESC;
