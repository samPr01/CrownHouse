CREATE TABLE "commerce"."contact_messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"message" text NOT NULL,
	"status" text DEFAULT 'new' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "contact_status_valid" CHECK ("commerce"."contact_messages"."status" in ('new','resolved'))
);
--> statement-breakpoint
CREATE TABLE "commerce"."request_limits" (
	"key" text PRIMARY KEY NOT NULL,
	"count" integer NOT NULL,
	"expires_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "commerce"."return_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid NOT NULL,
	"reason" text NOT NULL,
	"status" text DEFAULT 'requested' NOT NULL,
	"note" text DEFAULT '' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "return_requests_order_id_unique" UNIQUE("order_id"),
	CONSTRAINT "return_status_valid" CHECK ("commerce"."return_requests"."status" in ('requested','approved','rejected','received','closed'))
);
--> statement-breakpoint
CREATE TABLE "commerce"."shipments" (
	"order_id" uuid PRIMARY KEY NOT NULL,
	"carrier" text NOT NULL,
	"tracking_number" text NOT NULL,
	"tracking_url" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "commerce"."return_requests" ADD CONSTRAINT "return_requests_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "commerce"."orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "commerce"."shipments" ADD CONSTRAINT "shipments_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "commerce"."orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "request_limits_expiry_idx" ON "commerce"."request_limits" USING btree ("expires_at");
--> statement-breakpoint
ALTER TABLE commerce.contact_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE commerce.request_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE commerce.return_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE commerce.shipments ENABLE ROW LEVEL SECURITY;
CREATE POLICY server_access ON commerce.contact_messages TO crownhouse_app USING (true) WITH CHECK (true);
CREATE POLICY server_access ON commerce.request_limits TO crownhouse_app USING (true) WITH CHECK (true);
CREATE POLICY server_access ON commerce.return_requests TO crownhouse_app USING (true) WITH CHECK (true);
CREATE POLICY server_access ON commerce.shipments TO crownhouse_app USING (true) WITH CHECK (true);
REVOKE ALL ON commerce.contact_messages, commerce.request_limits, commerce.return_requests, commerce.shipments FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON commerce.contact_messages, commerce.return_requests, commerce.shipments TO crownhouse_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON commerce.request_limits TO crownhouse_app;
GRANT INSERT, UPDATE ON commerce.products, commerce.product_variants, commerce.product_images TO crownhouse_app;
GRANT UPDATE ON commerce.orders TO crownhouse_app;
