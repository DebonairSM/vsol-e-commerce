import { tenantMembershipTable } from "./memberships";
import { tenantTable } from "./tables";

export type Tenant = typeof tenantTable.$inferSelect;
export type NewTenant = typeof tenantTable.$inferInsert;

export type TenantMembership = typeof tenantMembershipTable.$inferSelect;
export type NewTenantMembership = typeof tenantMembershipTable.$inferInsert;

