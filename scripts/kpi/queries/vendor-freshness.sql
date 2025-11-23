-- Vendor Freshness KPI Query
-- Days since last vendor update

.mode csv
.headers on

SELECT
  strftime('%Y-%m', 'now') AS month,
  ROUND(AVG(CAST((julianday('now') - julianday(updated_at)) AS INTEGER)), 1) AS avg_days_old,
  MAX(CAST((julianday('now') - julianday(updated_at)) AS INTEGER)) AS oldest_vendor_days,
  SUM(CASE WHEN (julianday('now') - julianday(updated_at)) > 90 THEN 1 ELSE 0 END) AS stale_vendor_count,
  COUNT(*) AS total_vendors
FROM Vendors
WHERE moderation_status = 'approved';
