import { and, eq } from "drizzle-orm";

import { db } from "~/db";
import { tenantMembershipTable, tenantTable } from "~/db/schema";
import { getTenantFromRequest } from "./tenant";

export type TenantRole = "owner" | "admin" | "member";

export async function getUserTenantMembership(
  userId: string,
  tenantId: string,
): Promise<typeof tenantMembershipTable.$inferSelect | null> {
  try {
    const [membership] = await db
      .select()
      .from(tenantMembershipTable)
      .where(
        and(
          eq(tenantMembershipTable.userId, userId),
          eq(tenantMembershipTable.tenantId, tenantId),
        ),
      )
      .limit(1);

    return membership ?? null;
  } catch (error) {
    console.error("Error fetching tenant membership:", error);
    return null;
  }
}

export async function getUserRoleInTenant(
  userId: string,
  tenantId: string,
): Promise<TenantRole | null> {
  const membership = await getUserTenantMembership(userId, tenantId);
  return membership?.role ?? null;
}

export async function userBelongsToTenant(
  userId: string,
  tenantId: string,
): Promise<boolean> {
  const membership = await getUserTenantMembership(userId, tenantId);
  return membership !== null;
}

export async function requireTenantAccess(
  userId: string,
  tenantId: string,
): Promise<void> {
  const hasAccess = await userBelongsToTenant(userId, tenantId);
  if (!hasAccess) {
    throw new Error("User does not have access to this tenant");
  }
}

export async function requireTenantRole(
  userId: string,
  tenantId: string,
  requiredRole: TenantRole | TenantRole[],
): Promise<void> {
  const role = await getUserRoleInTenant(userId, tenantId);
  if (!role) {
    throw new Error("User does not belong to this tenant");
  }

  const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
  const roleHierarchy: Record<TenantRole, number> = {
    owner: 3,
    admin: 2,
    member: 1,
  };

  const userRoleLevel = roleHierarchy[role];
  const requiredRoleLevel = Math.max(
    ...roles.map((r) => roleHierarchy[r]),
  );

  if (userRoleLevel < requiredRoleLevel) {
    throw new Error(
      `User role '${role}' does not have sufficient permissions. Required: ${roles.join(" or ")}`,
    );
  }
}

export async function getCurrentTenantForUser(
  userId: string,
): Promise<typeof tenantTable.$inferSelect | null> {
  const tenant = await getTenantFromRequest();
  if (!tenant) {
    return null;
  }

  const hasAccess = await userBelongsToTenant(userId, tenant.id);
  return hasAccess ? tenant : null;
}

