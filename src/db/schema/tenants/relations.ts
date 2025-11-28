import { relations } from "drizzle-orm";

import { uploadsTable } from "../uploads/tables";
import { userTable } from "../users/tables";
import { tenantMembershipTable } from "./memberships";
import { tenantTable } from "./tables";

export const tenantRelations = relations(tenantTable, ({ many }) => ({
  memberships: many(tenantMembershipTable),
  uploads: many(uploadsTable),
}));

export const tenantMembershipRelations = relations(
  tenantMembershipTable,
  ({ one }) => ({
    tenant: one(tenantTable, {
      fields: [tenantMembershipTable.tenantId],
      references: [tenantTable.id],
    }),
    user: one(userTable, {
      fields: [tenantMembershipTable.userId],
      references: [userTable.id],
    }),
  }),
);
