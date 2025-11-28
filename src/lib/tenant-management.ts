import { createId } from "@paralleldrive/cuid2";
import { and, eq, inArray } from "drizzle-orm";

import { db } from "~/db";
import {
  tenantMembershipTable,
  tenantTable,
  type Tenant,
  type TenantMembership,
} from "~/db/schema";
import type { TenantRole } from "./tenant-auth";

export async function createTenant(
  name: string,
  subdomain: string,
  ownerUserId: string,
  customDomain?: string,
): Promise<Tenant> {
  const tenantId = createId();

  // validate subdomain format
  if (!/^[a-z0-9-]+$/.test(subdomain.toLowerCase())) {
    throw new Error(
      "Subdomain must contain only lowercase letters, numbers, and hyphens",
    );
  }

  // create tenant
  const [tenant] = await db
    .insert(tenantTable)
    .values({
      id: tenantId,
      name,
      subdomain: subdomain.toLowerCase(),
      customDomain: customDomain?.toLowerCase() || null,
      isActive: true,
    })
    .returning();

  // add owner membership
  await db.insert(tenantMembershipTable).values({
    id: createId(),
    userId: ownerUserId,
    tenantId,
    role: "owner",
  });

  return tenant;
}

export async function updateTenant(
  tenantId: string,
  updates: {
    name?: string;
    subdomain?: string;
    customDomain?: string | null;
    isActive?: boolean;
  },
): Promise<Tenant | null> {
  const updateData: Partial<Tenant> = {};

  if (updates.name !== undefined) {
    updateData.name = updates.name;
  }

  if (updates.subdomain !== undefined) {
    if (!/^[a-z0-9-]+$/.test(updates.subdomain.toLowerCase())) {
      throw new Error(
        "Subdomain must contain only lowercase letters, numbers, and hyphens",
      );
    }
    updateData.subdomain = updates.subdomain.toLowerCase();
  }

  if (updates.customDomain !== undefined) {
    updateData.customDomain = updates.customDomain?.toLowerCase() || null;
  }

  if (updates.isActive !== undefined) {
    updateData.isActive = updates.isActive;
  }

  updateData.updatedAt = new Date();

  const [updated] = await db
    .update(tenantTable)
    .set(updateData)
    .where(eq(tenantTable.id, tenantId))
    .returning();

  return updated ?? null;
}

export async function addUserToTenant(
  userId: string,
  tenantId: string,
  role: TenantRole = "member",
): Promise<TenantMembership> {
  // check if membership already exists
  const existing = await db.query.tenantMembershipTable.findFirst({
    where: and(
      eq(tenantMembershipTable.userId, userId),
      eq(tenantMembershipTable.tenantId, tenantId),
    ),
  });

  if (existing) {
    throw new Error("User is already a member of this tenant");
  }

  const [membership] = await db
    .insert(tenantMembershipTable)
    .values({
      id: createId(),
      userId,
      tenantId,
      role,
    })
    .returning();

  return membership;
}

export async function removeUserFromTenant(
  userId: string,
  tenantId: string,
): Promise<boolean> {
  const result = await db
    .delete(tenantMembershipTable)
    .where(
      and(
        eq(tenantMembershipTable.userId, userId),
        eq(tenantMembershipTable.tenantId, tenantId),
      ),
    )
    .returning();

  return result.length > 0;
}

export async function updateUserRoleInTenant(
  userId: string,
  tenantId: string,
  newRole: TenantRole,
): Promise<TenantMembership | null> {
  const [updated] = await db
    .update(tenantMembershipTable)
    .set({
      role: newRole,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(tenantMembershipTable.userId, userId),
        eq(tenantMembershipTable.tenantId, tenantId),
      ),
    )
    .returning();

  return updated ?? null;
}

export async function getTenantsForUser(
  userId: string,
): Promise<Array<Tenant & { role: TenantRole }>> {
  const memberships = await db.query.tenantMembershipTable.findMany({
    where: eq(tenantMembershipTable.userId, userId),
    with: {
      tenant: true,
    },
  });

  return memberships.map((m) => ({
    ...m.tenant,
    role: m.role,
  }));
}

export async function getMembersForTenant(
  tenantId: string,
): Promise<Array<TenantMembership & { user: { id: string; name: string; email: string } }>> {
  const memberships = await db.query.tenantMembershipTable.findMany({
    where: eq(tenantMembershipTable.tenantId, tenantId),
  });

  // fetch user details separately
  const userIds = memberships.map((m) => m.userId);
  if (userIds.length === 0) {
    return [];
  }
  const { userTable } = await import("~/db/schema");
  const users = await db
    .select({
      id: userTable.id,
      name: userTable.name,
      email: userTable.email,
    })
    .from(userTable)
    .where(inArray(userTable.id, userIds));

  const userMap = new Map(users.map((u) => [u.id, u]));

  return memberships.map((m) => ({
    ...m,
    user: userMap.get(m.userId) ?? {
      id: m.userId,
      name: "Unknown",
      email: "unknown@example.com",
    },
  })) as Array<TenantMembership & { user: { id: string; name: string; email: string } }>;
}

export async function deleteTenant(tenantId: string): Promise<boolean> {
  // cascade delete will handle memberships and related data
  const result = await db
    .delete(tenantTable)
    .where(eq(tenantTable.id, tenantId))
    .returning();

  return result.length > 0;
}

