# Store health check

Recurring checks are configured in cron-job.org as **CrownHouse health check**.
The enabled job sends GET https://crownhouse.in/api/health every ten minutes
(cron expression: */10 * * * *). No authentication or custom headers are needed.
Responses are saved in job history. Failure (after one failure), recovery, and
automatic disabling notifications are enabled through all configured notification
channels. Manage notification destinations in the cron-job.org account settings.

The endpoint checks the database connection and returns uncached JSON. It does
not create orders or modify inventory. The initial external test returned HTTP
200 and {"status":"ok"} in 1.15 seconds on October 16, 2026.

The GitHub Actions workflow no longer has a scheduled trigger. It remains
available through Run workflow as a manual fallback and runs when its own file
changes. Check recurring executions in cron-job.org rather than GitHub Actions.

cron-job.org has a 30-second request timeout. A Render cold start can exceed
this and cause a temporary failure. Jobs can be disabled after more than 25
consecutive failures; keep disabling alerts enabled. Neither scheduling nor
Render Free offers guaranteed continuous availability. Render workspace free
instance-hour and bandwidth limits still apply.

References:
- https://cron-job.org/en/faq/
- https://render.com/docs/free
