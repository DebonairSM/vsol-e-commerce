import { boolean, index, pgTable, text, timestamp } from "drizzle-orm/pg-core";

import { tenantTable } from "../tenants/tables";
import { userTable } from "../users/tables";

export const stripeCustomerTable = pgTable(
  "stripe_customer",
  {
    createdAt: timestamp("created_at").notNull(),
    customerId: text("customer_id").notNull().unique(),
    email: text("email"),
    id: text("id").primaryKey(),
    tenantId: text("tenant_id")
      .notNull()
      .references(() => tenantTable.id, { onDelete: "cascade" }),
    updatedAt: timestamp("updated_at").notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => userTable.id, { onDelete: "cascade" }),
  },
  (table) => ({
    customerIdIdx: index("stripe_customer_customer_id_idx").on(
      table.customerId,
    ),
    tenantIdIdx: index("stripe_customer_tenant_id_idx").on(table.tenantId),
    userIdTenantIdIdx: index("stripe_customer_user_tenant_idx").on(
      table.userId,
      table.tenantId,
    ),
  }),
);

export const stripeSubscriptionTable = pgTable(
  "stripe_subscription",
  {
    cancelAt: timestamp("cancel_at"),
    cancelAtPeriodEnd: boolean("cancel_at_period_end").notNull().default(false),
    canceledAt: timestamp("canceled_at"),
    createdAt: timestamp("created_at").notNull(),
    currentPeriodEnd: timestamp("current_period_end"),
    currentPeriodStart: timestamp("current_period_start"),
    customerId: text("customer_id").notNull(),
    id: text("id").primaryKey(),
    priceId: text("price_id").notNull(),
    productId: text("product_id").notNull(),
    status: text("status").notNull(),
    subscriptionId: text("subscription_id").notNull().unique(),
    tenantId: text("tenant_id")
      .notNull()
      .references(() => tenantTable.id, { onDelete: "cascade" }),
    updatedAt: timestamp("updated_at").notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => userTable.id, { onDelete: "cascade" }),
  },
  (table) => ({
    customerIdIdx: index("stripe_subscription_customer_id_idx").on(
      table.customerId,
    ),
    subscriptionIdIdx: index("stripe_subscription_subscription_id_idx").on(
      table.subscriptionId,
    ),
    tenantIdIdx: index("stripe_subscription_tenant_id_idx").on(table.tenantId),
    userIdTenantIdIdx: index("stripe_subscription_user_tenant_idx").on(
      table.userId,
      table.tenantId,
    ),
  }),
);
