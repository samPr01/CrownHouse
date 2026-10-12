ALTER TABLE "commerce"."orders" ADD COLUMN "customer_details" jsonb;
--> statement-breakpoint
UPDATE commerce.orders o SET customer_details = jsonb_build_object('name',c.name,'email',c.email,'phone',c.phone)
FROM commerce.customers c WHERE o.customer_id=c.id AND o.customer_details IS NULL;
--> statement-breakpoint
GRANT UPDATE ON commerce.customers TO crownhouse_app;
--> statement-breakpoint
GRANT INSERT, UPDATE, DELETE ON commerce.addresses TO crownhouse_app;
