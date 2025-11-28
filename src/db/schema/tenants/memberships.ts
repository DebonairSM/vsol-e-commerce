import { index, pgEnum, pgTable, text, timestamp, unique } from "drizzle-orm/pg-core";

import { tenantTable } from "./tables";
import { userTable } from "../users/tables";

export const tenantRoleEnum = pgEnum("tenant_role", [
  "owner",
  "admin",
  "member",
]);

export const tenantMembershipTable = pgTable(
  "tenant_membership",
  {
    createdAt: timestamp("created_at").defaultNow().notNull(),
    id: text("id").primaryKey(),
    role: tenantRoleEnum("role").default("member").notNull(),
    tenantId: text("tenant_id")
      .notNull()
      .references(() => tenantTable.id, { onDelete: "cascade" }),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => userTable.id, { onDelete: "cascade" }),
  },
  (table) => ({
    uniqueUserTenant: unique().on(table.userId, table.tenantId),
    userIdIdx: index("tenant_membership_user_id_idx").on(table.userId),
    tenantIdIdx: index("tenant_membership_tenant_id_idx").on(table.tenantId),
  }),
);

