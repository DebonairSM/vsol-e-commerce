import { relations } from "drizzle-orm";

import { tenantTable } from "../tenants/tables";
import { userTable } from "../users/tables";
import { uploadsTable } from "./tables";

export const uploadsRelations = relations(uploadsTable, ({ one }) => ({
  tenant: one(tenantTable, {
    fields: [uploadsTable.tenantId],
    references: [tenantTable.id],
  }),
  user: one(userTable, {
    fields: [uploadsTable.userId],
    references: [userTable.id],
  }),
}));
