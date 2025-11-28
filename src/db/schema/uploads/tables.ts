import { index, pgEnum, pgTable, text, timestamp } from "drizzle-orm/pg-core";

import { tenantTable } from "../tenants/tables";
import { userTable } from "../users/tables";

export const mediaTypeEnum = pgEnum("type", ["image", "video"]);

export const uploadsTable = pgTable(
  "uploads",
  {
    createdAt: timestamp("created_at").defaultNow().notNull(),
    id: text("id").primaryKey(),
    key: text("key").notNull(), // UploadThing file key
    tenantId: text("tenant_id")
      .notNull()
      .references(() => tenantTable.id, { onDelete: "cascade" }),
    type: mediaTypeEnum("type").notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
    url: text("url").notNull(), // UploadThing file URL
    userId: text("user_id")
      .notNull()
      .references(() => userTable.id, { onDelete: "cascade" }),
  },
  (table) => ({
    tenantIdIdx: index("uploads_tenant_id_idx").on(table.tenantId),
    userIdTenantIdIdx: index("uploads_user_tenant_idx").on(
      table.userId,
      table.tenantId,
    ),
  }),
);
