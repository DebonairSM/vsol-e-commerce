import { relations } from "drizzle-orm";

import { tenantTable } from "../tenants/tables";
import { userTable } from "../users/tables";
import { polarCustomerTable, polarSubscriptionTable } from "./tables";

export const polarCustomerRelations = relations(polarCustomerTable, ({ one }) => ({
  tenant: one(tenantTable, {
    fields: [polarCustomerTable.tenantId],
    references: [tenantTable.id],
  }),
  user: one(userTable, {
    fields: [polarCustomerTable.userId],
    references: [userTable.id],
  }),
}));

export const polarSubscriptionRelations = relations(polarSubscriptionTable, ({ one }) => ({
  tenant: one(tenantTable, {
    fields: [polarSubscriptionTable.tenantId],
    references: [tenantTable.id],
  }),
  user: one(userTable, {
    fields: [polarSubscriptionTable.userId],
    references: [userTable.id],
  }),
}));

export const extendUserRelations = relations(userTable, ({ many }) => ({
  polarCustomers: many(polarCustomerTable),
  polarSubscriptions: many(polarSubscriptionTable),
}));
