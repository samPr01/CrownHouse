# Scheduled store health check

GitHub Actions requests `https://crownhouse.in/api/health` every ten minutes,
at minutes 03, 13, 23, 33, 43 and 53 of each hour (UTC).
The existing endpoint verifies the database connection and returns uncached JSON.
It does not create orders or modify inventory. No secrets or repository permissions
are needed by the workflow, and it does not check out or run project code.

View results in the repository's Actions tab under **Store health check**.
Use **Run workflow** for a manual check. To stop the schedule, disable this
workflow in GitHub Actions or remove its `schedule` trigger.

Requests can reduce Render's inactivity spin-downs, but GitHub schedules can
be delayed or dropped. This is not guaranteed always-on hosting. In public
repositories GitHub disables scheduled workflows after 60 days without
repository activity; re-enable the workflow if this happens.

GitHub-hosted standard runners are free for public repositories. If this
repository becomes private, runs use the account's Actions allowance and
may incur charges according to its billing settings. Render's free instance
hour and bandwidth limits still apply.

References:
- https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows#schedule
- https://docs.github.com/en/billing/concepts/product-billing/github-actions
- https://render.com/docs/free
