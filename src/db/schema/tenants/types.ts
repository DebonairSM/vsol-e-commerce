import { tenantTable } from "./tables";

export type Tenant = typeof tenantTable.$inferSelect;
export type NewTenant = typeof tenantTable.$inferInsert;

