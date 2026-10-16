# CrownHouse

Women’s fashion storefront built with Next.js, React, Supabase PostgreSQL/Auth and Drizzle. Cash on delivery only; online payment integration is deferred.

## Local development

Use Node.js 20.19+ locally (configure a supported LTS runtime on the production host) and npm. The canonical dependency lockfile is `package-lock.json`.

```sh
npm ci
# Configure .env.local using .env.example; never commit secrets.
npm run dev -- --port 3003
```

Open http://localhost:3003. `/admin` requires a confirmed account listed in server-only `ADMIN_EMAILS`. Keep the existing confirmed owner login in this allowlist; the public support email is configured separately. Signed-in browser checks passed for orders/returns, products and product editing forms, customers, messages, and the account/profile/address-book page on 12 October 2026. These browser checks were read-only; order mutations were verified separately through database tests.

## Features

- Database-backed categories, products, images, variants and verified stock.
- Browser-persistent cart/wishlist, authoritative checkout pricing and transaction-safe COD orders.
- Customer profiles, address book and private order history.
- Admin catalog/stock edits, customers, orders, carrier tracking, COD collection and contact inbox.
- Unshipped cancellation with one-time stock restoration; reviewed full-order returns with one-time inspected restocking and manual refund recording.
- Shipping ₹99 below ₹599, free from ₹599; India-only checkout with optional PIN allowlist.
- Private commerce schema, restricted runtime database login, audit trail, persistent request limits and HTTP-only Auth cookies.
- Sitemap, robots, product structured data, policy pages and privacy-conscious error logs.
- Encrypted commerce backup and isolated restore verification.

Order-email activation remains deferred. Public signup and password recovery also require a configured Supabase SMTP sender; local callback URLs are configured but email delivery has not been tested. Payment tables reserve space for a later gateway; they do not implement online payments.

## Checks

```sh
npm test
npm run typecheck
npm run lint
npm run build
npm run db:verify
npm run db:verify-accounts
npm run db:verify-fulfilment
npm run db:verify-concurrency
npm audit --omit=dev
```

Database checks use synthetic fixtures; most roll back, and concurrency verification explicitly removes only its own disposable records. `db:verify` checks the original imported catalog/stock baseline and will need adjustment once real orders or intentional catalog changes occur.

See [DEPLOYMENT.md](DEPLOYMENT.md) for setup and remaining launch gates, and [DATABASE.md](DATABASE.md) for schema/migration details. `SHADCN-LICENSE.md` covers the retained local shadcn stylesheet.
