-- Poll Participation KPI Query
-- Ratio of unique voters to eligible members (segmented by poll type)

.mode csv
.headers on

WITH eligible_members AS (
  SELECT COUNT(*) AS member_count
  FROM Users
  WHERE role = 'member' AND is_active = 1
)
SELECT
  strftime('%Y-%m', 'now') AS month,
  p.is_binding,
  COUNT(DISTINCT v.user_id) AS unique_voters,
  e.member_count AS eligible_members,
  ROUND(
    (COUNT(DISTINCT v.user_id) * 100.0) / e.member_count,
    2
  ) AS participation_rate_pct
FROM Votes v
JOIN Polls p ON v.poll_id = p.id
CROSS JOIN eligible_members e
WHERE v.created_at >= date('now', 'start of month')
  AND v.created_at < date('now', 'start of month', '+1 month')
GROUP BY p.is_binding;
