CREATE SCHEMA "commerce";
--> statement-breakpoint
CREATE TABLE "commerce"."addresses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"customer_id" uuid NOT NULL,
	"address" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "commerce"."admin_audit_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"actor_id" uuid,
	"action" text NOT NULL,
	"entity_id" text NOT NULL,
	"changes" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "commerce"."categories" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"department" text NOT NULL,
	"position" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "commerce"."customers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"auth_user_id" uuid,
	"email" text NOT NULL,
	"name" text NOT NULL,
	"phone" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "customers_auth_user_id_unique" UNIQUE("auth_user_id")
);
--> statement-breakpoint
CREATE TABLE "commerce"."product_images" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"product_id" text NOT NULL,
	"url" text NOT NULL,
	"alt" text NOT NULL,
	"position" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "commerce"."inventory" (
	"variant_id" text PRIMARY KEY NOT NULL,
	"quantity" integer DEFAULT 0 NOT NULL,
	"verified" boolean DEFAULT false NOT NULL,
	CONSTRAINT "inventory_nonnegative" CHECK ("commerce"."inventory"."quantity" >= 0)
);
--> statement-breakpoint
CREATE TABLE "commerce"."inventory_adjustments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"variant_id" text NOT NULL,
	"order_id" uuid,
	"delta" integer NOT NULL,
	"reason" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "commerce"."notification_jobs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid NOT NULL,
	"kind" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"attempts" integer DEFAULT 0 NOT NULL,
	"next_attempt_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_error" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "commerce"."order_addresses" (
	"order_id" uuid PRIMARY KEY NOT NULL,
	"address" jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE "commerce"."order_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid NOT NULL,
	"variant_id" text NOT NULL,
	"name" text NOT NULL,
	"sku" text NOT NULL,
	"options" jsonb NOT NULL,
	"quantity" integer NOT NULL,
	"unit_price_minor" integer NOT NULL,
	"currency" text DEFAULT 'INR' NOT NULL,
	CONSTRAINT "order_item_valid" CHECK ("commerce"."order_items"."quantity" > 0 and "commerce"."order_items"."unit_price_minor" > 0)
);
--> statement-breakpoint
CREATE TABLE "commerce"."orders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"customer_id" uuid NOT NULL,
	"idempotency_key" uuid NOT NULL,
	"request_hash" text NOT NULL,
	"status" text DEFAULT 'placed' NOT NULL,
	"payment_status" text DEFAULT 'unpaid' NOT NULL,
	"payment_method" text NOT NULL,
	"subtotal_minor" integer NOT NULL,
	"shipping_minor" integer NOT NULL,
	"total_minor" integer NOT NULL,
	"currency" text DEFAULT 'INR' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "orders_idempotency_key_unique" UNIQUE("idempotency_key"),
	CONSTRAINT "order_totals_valid" CHECK ("commerce"."orders"."subtotal_minor" >= 0 and "commerce"."orders"."shipping_minor" >= 0 and "commerce"."orders"."total_minor" = "commerce"."orders"."subtotal_minor" + "commerce"."orders"."shipping_minor"),
	CONSTRAINT "order_status_valid" CHECK ("commerce"."orders"."status" in ('placed','processing','shipped','delivered','cancelled')),
	CONSTRAINT "payment_status_valid" CHECK ("commerce"."orders"."payment_status" in ('unpaid','pending','paid','failed','refunded'))
);
--> statement-breakpoint
CREATE TABLE "commerce"."payment_attempts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid NOT NULL,
	"provider" text NOT NULL,
	"provider_reference" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"amount_minor" integer NOT NULL,
	"currency" text DEFAULT 'INR' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "payment_amount_valid" CHECK ("commerce"."payment_attempts"."amount_minor" > 0)
);
--> statement-breakpoint
CREATE TABLE "commerce"."payment_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"provider" text NOT NULL,
	"event_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "commerce"."products" (
	"id" text PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"description" text NOT NULL,
	"category_id" text NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"details" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "products_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "commerce"."product_variants" (
	"id" text PRIMARY KEY NOT NULL,
	"product_id" text NOT NULL,
	"sku" text NOT NULL,
	"name" text NOT NULL,
	"options" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"price_minor" integer NOT NULL,
	"compare_at_minor" integer,
	"currency" text DEFAULT 'INR' NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"position" integer NOT NULL,
	CONSTRAINT "product_variants_sku_unique" UNIQUE("sku"),
	CONSTRAINT "variant_price_valid" CHECK ("commerce"."product_variants"."price_minor" > 0 and ("commerce"."product_variants"."compare_at_minor" is null or "commerce"."product_variants"."compare_at_minor" >= "commerce"."product_variants"."price_minor")),
	CONSTRAINT "variant_currency" CHECK ("commerce"."product_variants"."currency" = 'INR')
);
--> statement-breakpoint
ALTER TABLE "commerce"."addresses" ADD CONSTRAINT "addresses_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "commerce"."customers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "commerce"."product_images" ADD CONSTRAINT "product_images_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "commerce"."products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "commerce"."inventory" ADD CONSTRAINT "inventory_variant_id_product_variants_id_fk" FOREIGN KEY ("variant_id") REFERENCES "commerce"."product_variants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "commerce"."inventory_adjustments" ADD CONSTRAINT "inventory_adjustments_variant_id_product_variants_id_fk" FOREIGN KEY ("variant_id") REFERENCES "commerce"."product_variants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "commerce"."inventory_adjustments" ADD CONSTRAINT "inventory_adjustments_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "commerce"."orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "commerce"."notification_jobs" ADD CONSTRAINT "notification_jobs_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "commerce"."orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "commerce"."order_addresses" ADD CONSTRAINT "order_addresses_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "commerce"."orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "commerce"."order_items" ADD CONSTRAINT "order_items_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "commerce"."orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "commerce"."order_items" ADD CONSTRAINT "order_items_variant_id_product_variants_id_fk" FOREIGN KEY ("variant_id") REFERENCES "commerce"."product_variants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "commerce"."orders" ADD CONSTRAINT "orders_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "commerce"."customers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "commerce"."payment_attempts" ADD CONSTRAINT "payment_attempts_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "commerce"."orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "commerce"."products" ADD CONSTRAINT "products_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "commerce"."categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "commerce"."product_variants" ADD CONSTRAINT "product_variants_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "commerce"."products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "addresses_customer_idx" ON "commerce"."addresses" USING btree ("customer_id");--> statement-breakpoint
CREATE INDEX "customers_email_idx" ON "commerce"."customers" USING btree ("email");--> statement-breakpoint
CREATE UNIQUE INDEX "images_product_position_idx" ON "commerce"."product_images" USING btree ("product_id","position");--> statement-breakpoint
CREATE INDEX "adjustments_variant_idx" ON "commerce"."inventory_adjustments" USING btree ("variant_id");--> statement-breakpoint
CREATE INDEX "adjustments_order_idx" ON "commerce"."inventory_adjustments" USING btree ("order_id");--> statement-breakpoint
CREATE UNIQUE INDEX "notification_order_kind_idx" ON "commerce"."notification_jobs" USING btree ("order_id","kind");--> statement-breakpoint
CREATE INDEX "notification_pending_idx" ON "commerce"."notification_jobs" USING btree ("status","next_attempt_at");--> statement-breakpoint
CREATE INDEX "order_items_order_idx" ON "commerce"."order_items" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "order_items_variant_idx" ON "commerce"."order_items" USING btree ("variant_id");--> statement-breakpoint
CREATE INDEX "orders_customer_idx" ON "commerce"."orders" USING btree ("customer_id");--> statement-breakpoint
CREATE INDEX "payment_order_idx" ON "commerce"."payment_attempts" USING btree ("order_id");--> statement-breakpoint
CREATE UNIQUE INDEX "payment_provider_ref_idx" ON "commerce"."payment_attempts" USING btree ("provider","provider_reference");--> statement-breakpoint
CREATE UNIQUE INDEX "payment_event_unique" ON "commerce"."payment_events" USING btree ("provider","event_id");--> statement-breakpoint
CREATE INDEX "products_category_idx" ON "commerce"."products" USING btree ("category_id");--> statement-breakpoint
CREATE INDEX "variants_product_idx" ON "commerce"."product_variants" USING btree ("product_id");
--> statement-breakpoint
DO $$ BEGIN
 IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'crownhouse_app') THEN
 CREATE ROLE crownhouse_app NOLOGIN NOBYPASSRLS;
 END IF;
END $$;
--> statement-breakpoint
GRANT crownhouse_app TO postgres;
--> statement-breakpoint
REVOKE ALL ON SCHEMA commerce FROM PUBLIC, anon, authenticated;
--> statement-breakpoint
GRANT USAGE ON SCHEMA commerce TO crownhouse_app;
--> statement-breakpoint
GRANT SELECT ON ALL TABLES IN SCHEMA commerce TO crownhouse_app;
--> statement-breakpoint
GRANT INSERT ON commerce.customers, commerce.orders, commerce.order_items, commerce.order_addresses, commerce.inventory_adjustments, commerce.notification_jobs TO crownhouse_app;
--> statement-breakpoint
GRANT UPDATE ON commerce.inventory TO crownhouse_app;
--> statement-breakpoint
DO $$ DECLARE t record; BEGIN
 FOR t IN SELECT tablename FROM pg_tables WHERE schemaname = 'commerce' LOOP
 EXECUTE format('ALTER TABLE commerce.%I ENABLE ROW LEVEL SECURITY', t.tablename);
 EXECUTE format('CREATE POLICY server_access ON commerce.%I TO crownhouse_app USING (true) WITH CHECK (true)', t.tablename);
 END LOOP;
END $$;
