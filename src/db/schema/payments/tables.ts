import { index, pgTable, text, timestamp } from "drizzle-orm/pg-core";

import { tenantTable } from "../tenants/tables";
import { userTable } from "../users/tables";

export const polarCustomerTable = pgTable(
  "polar_customer",
  {
    createdAt: timestamp("created_at").notNull(),
    customerId: text("customer_id").notNull().unique(),
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
    tenantIdIdx: index("polar_customer_tenant_id_idx").on(table.tenantId),
    userIdTenantIdIdx: index("polar_customer_user_tenant_idx").on(
      table.userId,
      table.tenantId,
    ),
  }),
);

export const polarSubscriptionTable = pgTable(
  "polar_subscription",
  {
    createdAt: timestamp("created_at").notNull(),
    customerId: text("customer_id").notNull(),
    id: text("id").primaryKey(),
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
    tenantIdIdx: index("polar_subscription_tenant_id_idx").on(table.tenantId),
    userIdTenantIdIdx: index("polar_subscription_user_tenant_idx").on(
      table.userId,
      table.tenantId,
    ),
  }),
);
