# CrownHouse deployment and operations

Current implementation: local COD store with database-backed catalog, customer accounts, merchant tools and fulfilment. Domain and public deployment are deferred by the owner. Order-email activation is explicitly deferred.

## Configuration already applied

- Admin allowlist: `ecomcrownsolutions@gmail.com`. Access requires a confirmed Supabase account; an email in this setting does not create an account.
- Shipping: ₹99 below ₹599, free from ₹599. India-only checkout. `DELIVERY_PIN_CODES` optionally restricts accepted PIN codes.
- Supabase Site URL: `http://localhost:3003`. Exact local callback URLs are saved for signup and recovery.
- Nineteen private commerce tables with RLS, application grants and versioned migrations.
- `DATABASE_URL` now uses a restricted `crownhouse_web` login. `MIGRATION_DATABASE_URL` remains privileged and local to migration/backup operations.
- Local backup encryption key is in ignored `.env.local`. No secrets belong in source control, screenshots or chat.

## Remaining external setup

1. **Owner login verified:** the owner account `ecomcrownsolutions@gmail.com` exists and is confirmed. Signed-in browser checks passed on 12 October 2026 for orders/returns, products, product editing forms, customers, messages and the account/profile/address-book page. Keep public email confirmation enabled. Repeat owner login verification on the production deployment.
2. **Public signup/recovery emails:** configure Supabase custom SMTP with a verified sender. This is separate from application order emails. Public confirmation and password-reset delivery cannot be tested without it. Do not disable email confirmation to bypass sender setup.
3. **Order emails:** deferred. Leave `RESEND_API_KEY` and `ORDER_EMAIL_FROM` empty. Stored jobs remain blocked; contact messages are available in `/admin/messages`. Adding SMTP to Supabase does not activate application order emails.
4. **Hosting:** select/connect the hosting account and project. A provider subdomain can be used before buying the final domain. No deployment account credentials have been supplied and no public deployment has been made.
5. **Store decisions:** confirm delivery areas/times, return eligibility/window/charges, product measurements, footwear sizing and invoice/tax presentation. Policy pages describe current functionality and explicitly defer unspecified terms; they are not a substitute for owner approval.

## Deploy with Vercel

Use a separate Supabase development/staging project for preview/testing and the intended production project for production. Do not send production customer data to test projects. Set a supported Node LTS runtime (for example Node 22) in project settings.

- Import this project through the hosting dashboard or authorized CLI.
- Framework: Next.js. Install: `npm ci`. Build: `npm run deploy:check && npm run build`.
- Configure `DATABASE_URL` (restricted runtime login), `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `ADMIN_EMAILS`, `APP_URL` (exact HTTPS origin), `APP_ENV=production`, `CHECKOUT_MODE=cod` and `RATE_LIMIT_SECRET` or `CRON_SECRET`.
- Keep `MIGRATION_DATABASE_URL`, `SUPABASE_DB_PASSWORD`, `BACKUP_ENCRYPTION_KEY` and `RESTORE_DATABASE_URL` out of the web deployment unless a separate, secured operational job genuinely needs them.
- Leave order-email keys empty until activation is requested. Existing retry cron needs `CRON_SECRET`; it cannot send without email configuration.
- Apply migrations from a trusted local/CI environment before deploying code. Do not run migrations or seed automatically on every web build. Seeding can overwrite deliberate catalog edits; use it only for initial setup or a reviewed import.
- Verify hosting-plan suitability for the intended use and arrange external uptime checks against `/api/health`. Provider pricing/limits are not assumed by this document.

When the domain is purchased, add it to the hosting project, apply the provider's exact DNS records and verify HTTPS. Update `APP_URL`, Supabase Site URL and the exact allowed signup/recovery callback URLs to the HTTPS origin; redeploy. Avoid wildcard production redirects. Test both apex/www behavior and choose a canonical origin.

## Acceptance test before accepting public orders

- New customer signup, email confirmation, login, logout, resend confirmation and password reset.
- Confirmed administrator login; a normal customer receives no admin data or action access.
- Guest and account COD orders, totals at ₹598.99/₹599, unavailable stock, changed prices and duplicate submissions.
- Account order/address ownership and immutable order contact/address snapshots.
- Processing → shipped (carrier and HTTPS tracking required) → delivered → COD collection.
- Cancellation before dispatch restores stock once. Shipment prevents self-service cancellation.
- Full-order return: requested → approved/rejected → received → closed. Mark received only after inspecting **all** units as sellable. Closed records a refund already made outside the website; no money is transferred. Partial returns, damaged write-offs, exchanges and courier return-to-origin are manual store procedures.
- Contact submission appears in admin inbox; customer sees an honest saved-message acknowledgement.
- Mobile navigation, product options, cart, form labels and empty/error states.
- Sitemap, robots, canonical product URLs, image availability and support links.
- Final owner review of product sizes, shipping/returns terms, image rights and invoice/tax presentation.

## Backups and recovery

`npm run db:backup` creates an AES-256-GCM encrypted consistent commerce snapshot in ignored `backups/`. Copy encrypted backups to separate secured storage; keep `BACKUP_ENCRYPTION_KEY` separately and test recovery regularly. A local file alone is not an off-site backup or a recurring backup schedule.

```sh
npm run db:verify-backup -- backups/commerce-....encrypted.json
```

Verification restores all 19 tables to an isolated schema, checks counts and foreign keys, then rolls back. Source data is untouched. This verifies commerce recovery; Supabase Auth users and image Storage are separate and require provider recovery arrangements.

For an actual recovery rehearsal, migrate a separate empty staging project first, set `RESTORE_DATABASE_URL`, then run:

```sh
npm run db:restore -- backups/commerce-....encrypted.json --confirm-empty-target
```

Source-project restoration and non-empty targets are rejected. Restore commits only after all table counts validate. Do not use a production project as a test restore target. Keep Auth identities consistent when recovering account-linked commerce records.

## Monitoring and security

- `/api/health` returns a minimal 200/503 response without database details.
- Next request failures emit sanitized structured logs. Connect the hosting provider's logs/alerts and an uptime monitor after deployment; no external monitoring account is configured yet.
- Contact/auth/checkout limits persist in PostgreSQL and remove expired counters in bounded batches. Hashing prevents raw emails/IPs being stored in the counter table.
- Authentication cookies are HTTP-only, SameSite=Lax and Secure for HTTPS deployments.
- The runtime login cannot read Auth tables or create commerce tables; verified server-side admin/customer checks remain essential.
- Production dependency audit currently has **zero** known advisories. Five high dependency entries remain in development-only Next lint tooling, tracing to the unpatched `braces <=3.0.3` advisory. Do not blindly downgrade Next.js or force audit fixes. Lint consumes repository-controlled patterns, not customer inputs; revisit when upstream releases a patch.
- Retained shadcn CSS is vendored locally under its MIT license; the CLI dependency was removed.

## Payment gateway later

Keep COD as the sole available method until a gateway is explicitly integrated. Existing payment attempts/events tables are placeholders. Integration still needs server-created payment sessions, verified webhook signatures, unique provider-event deduplication, amount/currency checks, idempotent order/payment transitions, refund handling and sandbox/live testing. Never mark an order paid from a browser redirect.
