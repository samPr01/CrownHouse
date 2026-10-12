# CrownHouse database foundation

The storefront uses Supabase PostgreSQL through Drizzle on the Next.js server. Browser clients receive public catalog fields, never database credentials or customer records. npm is the package manager used for this implementation.

## Local configuration

Copy `.env.example` to `.env.local` and configure the transaction-pooler `DATABASE_URL`, session-pooler `MIGRATION_DATABASE_URL`, and `APP_URL`. Existing `.env.local` is configured locally and ignored by Git. Do not share it. Supabase publishable settings are now used for customer authentication; no service-role key is required.

Use separate Supabase projects for development and production. Scripts currently check the CrownStudios project reference to prevent accidental changes to another project; update this guard deliberately when introducing a separate environment.

Commands:

```text
npm run db:check
npm run db:generate
npm run db:migrate
npm run db:seed
npm run db:stock
npm run db:verify
npm test
npm run typecheck
npm run build
```

Apply migrations once per release, before deploying the application. Do not run migrations or imports in request handlers. Seeds preserve verified inventory and archive status but refresh imported product content, prices and images. Review changes before repeating imports. The initial stock script refuses to overwrite configured inventory and runs once: 25 total units per product distributed evenly across variants, recorded as owner-specified stock. Future stock changes should record an inventory adjustment in the same transaction.

## Schema and access

`commerce` contains categories, products, product_variants, product_images, inventory, customers, addresses, orders, order_items, order_addresses, inventory_adjustments, payment_attempts, payment_events, notification_jobs, and admin_audit_logs.

Money is stored in integer paise with INR currency. Foreign keys preserve catalog references. Orders keep price, product name, SKU, options and delivery-address snapshots. Archive products instead of deleting purchased variants.

All commerce tables have RLS enabled. Anonymous and authenticated Data API roles have no schema access. The no-login `crownhouse_app` role has catalog/read access plus checkout writes, profile updates and saved-address management. The server switches to this restricted role within each transaction. Migration credentials retain administrative privileges and must remain server-only; a dedicated login assigned to the runtime role can further limit the connection credential before production.

## Checkout

The local store and example configuration now use `CHECKOUT_MODE=cod`. Missing or invalid settings still disable checkout. `demo` is permitted only with `APP_ENV=development`; it saves test orders without stock reductions, payment or delivery. `cod` validates configured stock and reduces it atomically. Never set APP_ENV to development in production. Set APP_URL to the exact HTTPS domain after deployment.

POST `/api/checkout/quote` validates variant IDs and calculates current prices and delivery (INR 99 below INR 1,000, free from INR 1,000). Confirm this delivery policy before launch. POST `/api/orders` validates contact/address fields, checks the expected total, locks inventory rows, and writes guest customer, order, items, address and stock adjustments in one transaction. Repeated identical idempotency keys return the same order; changed requests with the same key are rejected. Browser prices are never accepted.

Cart storage remains in the browser. Guest customer records are saved per order and intentionally not merged by unverified email. Email/password login, registration, logout, password recovery, account profiles, saved addresses and private order history are implemented. Cross-device carts and guest order claiming are not implemented.

## Notifications and payments

Order details are available in Supabase's table editor under the commerce schema. Resend templates and a database-backed email worker are implemented. Sending is deliberately unconfigured until a domain is available. Jobs are saved as blocked while credentials are missing; checkout accurately reports that email confirmation is unavailable. No live email has been sent or delivery-tested. There is no staff admin screen or public endpoint for reading customer data.

Payment attempt and deduplicated webhook-event tables are ready for a later gateway integration. No card data is collected, no payment is simulated as successful, and no gateway is connected.

## Before accepting real orders

Confirm size mappings from the source import, stock distribution, shipping/tax policy and return policy. Configure authentication and staff access if needed; configure and live-test notification delivery so staff receive orders; add durable rate limiting and bot protection to checkout; establish backups and restore procedures; test concurrent last-item orders, retries and payment webhooks when adding payments. Use synthetic customer data in development. Deploy environment secrets through hosting settings, configure HTTPS/custom-domain DNS, and run a complete order smoke test before accepting public COD orders.

## Enable order emails when the domain is ready

Verify a sending domain in Resend, then set these server-only values in `.env.local` and the hosting environment:

```dotenv
RESEND_API_KEY=re_your_sending_key
ORDER_EMAIL_FROM=CrownHouse <orders@your-verified-domain.com>
ORDER_EMAIL_TO=Ecomcrownsolutions@gmail.com
CRON_SECRET=your_random_secret_at_least_32_characters
```

The Gmail inbox is a recipient/reply address, not the sending identity. Restart the local server after changing configuration. Run a synthetic order and confirm both store and customer inboxes before launch.

New COD orders create merchant and customer notification jobs in the order transaction. After commit, Next.js `after()` processes those two jobs outside the transaction and after the HTTP response. Email failures never roll back a saved order. Emails include the order reference, purchased options, quantities, delivery address and unpaid COD total. The merchant email also includes the customer's phone and email. Test/demo orders are never sent.

The worker leases rows with `FOR UPDATE SKIP LOCKED`, uses a stable Resend idempotency key per job, records provider acceptance references, and retries transient errors with backoff (up to six attempts). `accepted` means Resend accepted the message, not that the recipient received it; bounce/delivery webhooks can be added later. Ambiguous sends older than 23 hours and unattempted jobs older than seven days require manual review to avoid automatic duplicate/stale notifications. Do not change email sender/recipient configuration during an outstanding retry without reviewing the affected jobs.

`npm run emails:retry` processes up to ten due jobs locally. A bearer-protected `/api/internal/order-emails` endpoint supports hosted retries using CRON_SECRET. `vercel.json` schedules one daily recovery pass after deployment; this schedule does not run locally and can recover at most ten jobs per day. For timely retries or larger volume, configure a more frequent scheduler and monitor failed jobs. CRON_SECRET must be set in Vercel as well; the local secret is never committed. Normal order emails are attempted immediately and do not wait for the cron job.

The existing payment attempts/events remain unused until a future verified gateway/webhook integration. COD orders remain unpaid until staff record collection; no online payment UI is enabled.

## Customer authentication and accounts

The original login/register templates were display-only. They have been replaced with Supabase email/password authentication using cookie-based SSR sessions. `/account` requires a current, email-confirmed user returned by Supabase Auth `getUser()`. The session-refresh proxy covers account, checkout and authentication routes. Private responses are not cached. No service-role key or manually stored password is used.

Account features:

- Edit profile name and phone; verified login email is displayed read-only.
- Add, edit and remove up to ten saved Indian delivery addresses.
- View account-linked order history (20 per page), status, COD payment state, items and immutable delivery details.
- Use saved addresses and optionally save a new address during checkout.
- Place orders as a guest or link new orders to the server-verified signed-in user.

Account data stays in the private commerce schema. Anonymous and authenticated Data API roles remain denied access. Server queries constrain profiles and order reads to the verified Auth user ID and constrain address changes to the owning customer. A submitted customer/user ID is never accepted as authentication. User metadata is used only for a display-name suggestion, never authorization. Email matches do not claim historical guest orders. Account/profile changes do not rewrite order contact or address snapshots.

The existing local environment already has NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY. No additional application credential is required for email/password login. Google/social login is not enabled and its placeholder buttons were removed. OAuth would require separate provider setup later.

Supabase dashboard setup to verify before full signup/recovery testing:

1. Authentication → Providers: Email enabled; keep email confirmation enabled (the public project settings were checked: Email enabled, signup enabled, automatic confirmation disabled).
2. Authentication → URL Configuration: development Site URL `http://localhost:3003`; add `http://localhost:3003/**` to allowed redirect URLs for local development. For production set Site URL and APP_URL to the HTTPS domain and allow only the intended callback destinations. The code uses `/auth/callback?next=/account` for signup and `/auth/callback?next=/reset-password` for recovery. Dashboard redirect settings have not been modified by this implementation.
3. Configure custom SMTP once a domain is available. Supabase's default sender only sends to project-team addresses and is rate-limited; ordinary customer confirmation/recovery must not be considered live-ready until SMTP is configured and tested. This is separate from order emails, even if both use Resend.
4. The default PKCE confirmation link works through the code-exchange callback in the browser that initiated signup/reset. For cross-device verification, use email templates pointing to `/auth/confirm?token_hash={{ .TokenHash }}&type=email` for signup and `type=recovery` for recovery. Use the configured application Site URL as the base. Keep links on the trusted application domain.
5. Test registration, confirmation, sign-in, sign-out, recovery, expired/invalid links and a signed-in COD order. Confirm a second account cannot access that order or change its saved address. Do not disable confirmation to bypass email-provider restrictions.

`npm run db:verify-accounts` exercises account uniqueness, ownership checks, no guest-email linking, address changes and order snapshots in a rolled-back PostgreSQL transaction using synthetic commerce records. It does not create Supabase Auth users or validate email delivery/positive interactive login. Auth validation tests cover redirect restrictions and form validation. End-to-end confirmed signup/recovery remains dependent on email/redirect configuration.

## Merchant and fulfilment foundation (October 2026)

Migrations 0003/0004 add shipments, reviewed full-order returns, contact-message persistence and persistent request limits, with RLS and restricted server grants. Runtime operations use a separate `crownhouse_web` login and set the no-login `crownhouse_app` role per transaction. Migration credentials must stay separate from deployment credentials.

Merchant operations are authorized through a confirmed Auth-server-verified email and server-only `ADMIN_EMAILS`; user-editable metadata is never used for privileges. Every server action rechecks authorization. Cancellation and return transitions lock their records and restore stock only on the first eligible transition. COD collection requires a delivered COD order. Returns close only after external refund completion is recorded manually.

See DEPLOYMENT.md for encrypted backups, restore checks, deployment environment variables, the owner account setup and deferred email integrations.
