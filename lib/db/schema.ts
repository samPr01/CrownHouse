import { sql } from "drizzle-orm"
import { pgSchema, text, uuid, integer, timestamp, jsonb, boolean, check, index, uniqueIndex } from "drizzle-orm/pg-core"

export const commerce = pgSchema("commerce")
const created = () => timestamp("created_at", { withTimezone: true }).defaultNow().notNull()
export const categories = commerce.table("categories", {
  id: text("id").primaryKey(), name: text("name").notNull(), department: text("department").notNull(), position: integer("position").notNull(),
})
export const products = commerce.table("products", {
  id: text("id").primaryKey(), slug: text("slug").notNull().unique(), name: text("name").notNull(), description: text("description").notNull(),
  categoryId: text("category_id").notNull().references(() => categories.id), active: boolean("active").default(true).notNull(),
  details: jsonb("details").$type<{title:string;content:string}[]>().default([]).notNull(), createdAt: created(),
}, t => [index("products_category_idx").on(t.categoryId)])
export const variants = commerce.table("product_variants", {
  id: text("id").primaryKey(), productId: text("product_id").notNull().references(() => products.id), sku: text("sku").notNull().unique(),
  name: text("name").notNull(), options: jsonb("options").$type<Record<string,string>>().default({}).notNull(),
  priceMinor: integer("price_minor").notNull(), compareAtMinor: integer("compare_at_minor"), currency: text("currency").default("INR").notNull(),
  active: boolean("active").default(true).notNull(), position: integer("position").notNull(),
}, t => [index("variants_product_idx").on(t.productId), check("variant_price_valid", sql`${t.priceMinor} > 0 and (${t.compareAtMinor} is null or ${t.compareAtMinor} >= ${t.priceMinor})`), check("variant_currency",sql`${t.currency} = 'INR'`)])
export const images = commerce.table("product_images", {
  id: uuid("id").defaultRandom().primaryKey(), productId: text("product_id").notNull().references(() => products.id), url: text("url").notNull(), alt: text("alt").notNull(), position: integer("position").notNull(),
}, t => [uniqueIndex("images_product_position_idx").on(t.productId,t.position)])
export const inventory = commerce.table("inventory", {
  variantId: text("variant_id").primaryKey().references(() => variants.id), quantity: integer("quantity").default(0).notNull(), verified: boolean("verified").default(false).notNull(),
}, t => [check("inventory_nonnegative",sql`${t.quantity} >= 0`)])
export const customers = commerce.table("customers", {
  id: uuid("id").defaultRandom().primaryKey(), authUserId: uuid("auth_user_id").unique(), email: text("email").notNull(), name: text("name").notNull(), phone: text("phone").notNull(), createdAt: created(),
}, t => [index("customers_email_idx").on(t.email)])
export const addresses = commerce.table("addresses", {
  id: uuid("id").defaultRandom().primaryKey(), customerId: uuid("customer_id").notNull().references(() => customers.id),
  address: jsonb("address").notNull(), createdAt: created(),
}, t => [index("addresses_customer_idx").on(t.customerId)])
export const orders = commerce.table("orders", {
  id: uuid("id").defaultRandom().primaryKey(), customerId: uuid("customer_id").notNull().references(() => customers.id),
  customerDetails: jsonb("customer_details").$type<{name:string;email:string;phone:string}>(),
  idempotencyKey: uuid("idempotency_key").notNull().unique(), requestHash: text("request_hash").notNull(),
  status: text("status").default("placed").notNull(), paymentStatus: text("payment_status").default("unpaid").notNull(),
  paymentMethod: text("payment_method").notNull(), subtotalMinor: integer("subtotal_minor").notNull(), shippingMinor: integer("shipping_minor").notNull(), totalMinor: integer("total_minor").notNull(),
  currency: text("currency").default("INR").notNull(), createdAt: created(),
}, t => [index("orders_customer_idx").on(t.customerId), check("order_totals_valid", sql`${t.subtotalMinor} >= 0 and ${t.shippingMinor} >= 0 and ${t.totalMinor} = ${t.subtotalMinor} + ${t.shippingMinor}`), check("order_status_valid",sql`${t.status} in ('placed','processing','shipped','delivered','cancelled')`), check("payment_status_valid",sql`${t.paymentStatus} in ('unpaid','pending','paid','failed','refunded')`)])
export const orderItems = commerce.table("order_items", {
  id: uuid("id").defaultRandom().primaryKey(), orderId: uuid("order_id").notNull().references(() => orders.id),
  variantId: text("variant_id").notNull().references(() => variants.id), name: text("name").notNull(), sku: text("sku").notNull(), options: jsonb("options").notNull(),
  quantity: integer("quantity").notNull(), unitPriceMinor: integer("unit_price_minor").notNull(), currency: text("currency").default("INR").notNull(),
}, t => [index("order_items_order_idx").on(t.orderId),index("order_items_variant_idx").on(t.variantId),check("order_item_valid",sql`${t.quantity} > 0 and ${t.unitPriceMinor} > 0`)])
export const orderAddresses = commerce.table("order_addresses", {
  orderId: uuid("order_id").primaryKey().references(() => orders.id), address: jsonb("address").notNull(),
})
export const inventoryAdjustments = commerce.table("inventory_adjustments", {
  id: uuid("id").defaultRandom().primaryKey(), variantId: text("variant_id").notNull().references(() => variants.id), orderId: uuid("order_id").references(() => orders.id), delta: integer("delta").notNull(), reason: text("reason").notNull(), createdAt: created(),
},t => [index("adjustments_variant_idx").on(t.variantId),index("adjustments_order_idx").on(t.orderId)])
export const paymentAttempts = commerce.table("payment_attempts", {
  id: uuid("id").defaultRandom().primaryKey(), orderId: uuid("order_id").notNull().references(() => orders.id), provider: text("provider").notNull(), providerReference: text("provider_reference"), status: text("status").default("pending").notNull(), amountMinor: integer("amount_minor").notNull(), currency: text("currency").default("INR").notNull(), createdAt: created(),
},t => [index("payment_order_idx").on(t.orderId),uniqueIndex("payment_provider_ref_idx").on(t.provider,t.providerReference),check("payment_amount_valid",sql`${t.amountMinor} > 0`)])
export const paymentEvents = commerce.table("payment_events", {
  id: uuid("id").defaultRandom().primaryKey(), provider: text("provider").notNull(), eventId: text("event_id").notNull(), receivedAt: created(),
},t => [uniqueIndex("payment_event_unique").on(t.provider,t.eventId)])
export const notificationJobs = commerce.table("notification_jobs", {
  id: uuid("id").defaultRandom().primaryKey(), orderId: uuid("order_id").notNull().references(() => orders.id), kind: text("kind").notNull(), providerReference: text("provider_reference"), firstAttemptAt: timestamp("first_attempt_at",{withTimezone:true}), sentAt: timestamp("sent_at",{withTimezone:true}), status: text("status").default("pending").notNull(), attempts: integer("attempts").default(0).notNull(), nextAttemptAt: timestamp("next_attempt_at",{withTimezone:true}).defaultNow().notNull(), lastError: text("last_error"), createdAt: created(),
},t => [uniqueIndex("notification_order_kind_idx").on(t.orderId,t.kind), index("notification_pending_idx").on(t.status,t.nextAttemptAt)])
export const adminAuditLogs = commerce.table("admin_audit_logs", {
  id: uuid("id").defaultRandom().primaryKey(), actorId: uuid("actor_id"), action: text("action").notNull(), entityId: text("entity_id").notNull(), changes: jsonb("changes").notNull(), createdAt: created(),
})
export const shipments = commerce.table("shipments", {
  orderId: uuid("order_id").primaryKey().references(() => orders.id), carrier: text("carrier").notNull(), trackingNumber: text("tracking_number").notNull(), trackingUrl: text("tracking_url").notNull(), updatedAt: created(),
})
export const returnRequests = commerce.table("return_requests", {
  id: uuid("id").defaultRandom().primaryKey(), orderId: uuid("order_id").notNull().unique().references(() => orders.id), reason: text("reason").notNull(), status: text("status").default("requested").notNull(), note: text("note").default("").notNull(), createdAt: created(),
}, t => [check("return_status_valid", sql`${t.status} in ('requested','approved','rejected','received','closed')`)])
export const contactMessages = commerce.table("contact_messages", {
  id: uuid("id").defaultRandom().primaryKey(), name: text("name").notNull(), email: text("email").notNull(), message: text("message").notNull(), status: text("status").default("new").notNull(), createdAt: created(),
}, t => [check("contact_status_valid", sql`${t.status} in ('new','resolved')`)])
export const requestLimits = commerce.table("request_limits", {
  key: text("key").primaryKey(), count: integer("count").notNull(), expiresAt: timestamp("expires_at", {withTimezone:true}).notNull(),
}, t => [index("request_limits_expiry_idx").on(t.expiresAt)])
