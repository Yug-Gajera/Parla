-- Run weekly via cron-job.org to keep 30 days of history
DELETE FROM rate_limits
WHERE date < CURRENT_DATE - INTERVAL '30 days';
