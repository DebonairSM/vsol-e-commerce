import { boolean, pgTable, text, timestamp } from "drizzle-orm/pg-core";

export const tenantTable = pgTable("tenant", {
  createdAt: timestamp("created_at").defaultNow().notNull(),
  customDomain: text("custom_domain").unique(),
  id: text("id").primaryKey(),
  isActive: boolean("is_active").default(true).notNull(),
  name: text("name").notNull(),
  subdomain: text("subdomain").notNull().unique(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});





