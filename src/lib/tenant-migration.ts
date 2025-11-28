import { eq } from "drizzle-orm";

import { db } from "~/db";
import {
  polarCustomerTable,
  polarSubscriptionTable,
  uploadsTable,
  userTable,
} from "~/db/schema";
import { createTenant } from "./tenant-management";

/**
 * Creates a default tenant for a user and assigns all their existing data to it.
 * This is useful for migrating existing users to the multitenancy system.
 */
export async function migrateUserToTenant(
  userId: string,
  tenantName?: string,
  subdomain?: string,
): Promise<string> {
  // get user info
  const user = await db.query.userTable.findFirst({
    where: eq(userTable.id, userId),
  });

  if (!user) {
    throw new Error(`User ${userId} not found`);
  }

  // create default tenant
  const defaultSubdomain =
    subdomain || `user-${userId.substring(0, 8)}`.toLowerCase();
  const defaultName = tenantName || `${user.name || user.email}'s Workspace`;

  const tenant = await createTenant(defaultName, defaultSubdomain, userId);

  // migrate uploads
  await db
    .update(uploadsTable)
    .set({ tenantId: tenant.id })
    .where(eq(uploadsTable.userId, userId));

  // migrate payment customers
  await db
    .update(polarCustomerTable)
    .set({ tenantId: tenant.id })
    .where(eq(polarCustomerTable.userId, userId));

  // migrate subscriptions
  await db
    .update(polarSubscriptionTable)
    .set({ tenantId: tenant.id })
    .where(eq(polarSubscriptionTable.userId, userId));

  return tenant.id;
}

/**
 * Migrates all existing users to have their own default tenant.
 * Use with caution - this will create a tenant for every user in the system.
 */
export async function migrateAllUsersToTenants(): Promise<{
  success: number;
  errors: Array<{ userId: string; error: string }>;
}> {
  const users = await db.query.userTable.findMany();
  const errors: Array<{ userId: string; error: string }> = [];
  let success = 0;

  for (const user of users) {
    try {
      // check if user already has a tenant
      const { tenantMembershipTable } = await import("~/db/schema");
      const existingMembership = await db.query.tenantMembershipTable.findFirst(
        {
          where: eq(tenantMembershipTable.userId, user.id),
        },
      );

      if (existingMembership) {
        // user already has a tenant, skip
        continue;
      }

      await migrateUserToTenant(user.id);
      success++;
    } catch (error) {
      errors.push({
        userId: user.id,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  return { success, errors };
}

/**
 * Assigns orphaned data (uploads, payments) to a specific tenant.
 * Useful when data exists without a tenant context.
 */
export async function assignOrphanedDataToTenant(tenantId: string): Promise<{
  uploadsUpdated: number;
  customersUpdated: number;
  subscriptionsUpdated: number;
}> {
  // update uploads without tenant
  const uploadsResult = await db
    .update(uploadsTable)
    .set({ tenantId })
    .where(eq(uploadsTable.tenantId, "" as any)); // this won't work, need to check for null

  // better approach: use raw sql or check for null tenantId
  // for now, we'll use a different approach
  const allUploads = await db.query.uploadsTable.findMany();
  let uploadsUpdated = 0;

  for (const upload of allUploads) {
    if (!upload.tenantId) {
      await db
        .update(uploadsTable)
        .set({ tenantId })
        .where(eq(uploadsTable.id, upload.id));
      uploadsUpdated++;
    }
  }

  const allCustomers = await db.query.polarCustomerTable.findMany();
  let customersUpdated = 0;

  for (const customer of allCustomers) {
    if (!customer.tenantId) {
      await db
        .update(polarCustomerTable)
        .set({ tenantId })
        .where(eq(polarCustomerTable.id, customer.id));
      customersUpdated++;
    }
  }

  const allSubscriptions = await db.query.polarSubscriptionTable.findMany();
  let subscriptionsUpdated = 0;

  for (const subscription of allSubscriptions) {
    if (!subscription.tenantId) {
      await db
        .update(polarSubscriptionTable)
        .set({ tenantId })
        .where(eq(polarSubscriptionTable.id, subscription.id));
      subscriptionsUpdated++;
    }
  }

  return { uploadsUpdated, customersUpdated, subscriptionsUpdated };
}

