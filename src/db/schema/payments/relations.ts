import { relations } from "drizzle-orm";

import { tenantTable } from "../tenants/tables";
import { userTable } from "../users/tables";
import { stripeCustomerTable, stripeSubscriptionTable } from "./tables";

export const stripeCustomerRelations = relations(
  stripeCustomerTable,
  ({ one }) => ({
    tenant: one(tenantTable, {
      fields: [stripeCustomerTable.tenantId],
      references: [tenantTable.id],
    }),
    user: one(userTable, {
      fields: [stripeCustomerTable.userId],
      references: [userTable.id],
    }),
  }),
);

export const stripeSubscriptionRelations = relations(
  stripeSubscriptionTable,
  ({ one }) => ({
    tenant: one(tenantTable, {
      fields: [stripeSubscriptionTable.tenantId],
      references: [tenantTable.id],
    }),
    user: one(userTable, {
      fields: [stripeSubscriptionTable.userId],
      references: [userTable.id],
    }),
  }),
);

export const extendUserRelations = relations(userTable, ({ many }) => ({
  stripeCustomers: many(stripeCustomerTable),
  stripeSubscriptions: many(stripeSubscriptionTable),
}));
