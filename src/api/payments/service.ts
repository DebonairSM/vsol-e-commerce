import { Polar } from "@polar-sh/sdk";
import { and, eq } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";

import { db } from "~/db";
import { polarCustomerTable, polarSubscriptionTable } from "~/db/schema";

const polarClient = new Polar({
  accessToken: process.env.POLAR_ACCESS_TOKEN,
  server: (process.env.POLAR_ENVIRONMENT as "production" | "sandbox") || "production",
});

/**
 * Get a Polar customer by user ID and tenant ID from the database
 */
export async function getCustomerByUserId(
  userId: string,
  tenantId: string,
) {
  const customer = await db.query.polarCustomerTable.findFirst({
    where: and(
      eq(polarCustomerTable.userId, userId),
      eq(polarCustomerTable.tenantId, tenantId),
    ),
  });

  if (!customer) {
    return null;
  }

  return customer;
}

/**
 * Get customer state from Polar API
 */
export async function getCustomerState(userId: string, tenantId: string) {
  const customer = await getCustomerByUserId(userId, tenantId);
  
  if (!customer) {
    return null;
  }

  try {
    const customerState = await polarClient.customers.get({ id: customer.customerId });
    return customerState;
  } catch (error) {
    console.error("Error fetching customer state:", error);
    return null;
  }
}

/**
 * Get all subscriptions for a user within a tenant
 */
export async function getUserSubscriptions(userId: string, tenantId: string) {
  const subscriptions = await db.query.polarSubscriptionTable.findMany({
    where: and(
      eq(polarSubscriptionTable.userId, userId),
      eq(polarSubscriptionTable.tenantId, tenantId),
    ),
  });

  return subscriptions;
}

/**
 * Create a new customer in Polar and save reference in database
 */
export async function createCustomer(
  userId: string,
  tenantId: string,
  email: string,
  name?: string,
) {
  try {
    const customer = await polarClient.customers.create({
      email,
      name: name || email,
      externalId: userId,
    });

    await db.insert(polarCustomerTable).values({
      id: uuidv4(),
      userId,
      tenantId,
      customerId: customer.id,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return customer;
  } catch (error) {
    console.error("Error creating customer:", error);
    throw error;
  }
}

/**
 * Sync subscription data between Polar and our database
 */
export async function syncSubscription(
  userId: string,
  tenantId: string,
  customerId: string,
  subscriptionId: string,
  productId: string,
  status: string,
) {
  try {
    const existingSubscription = await db.query.polarSubscriptionTable.findFirst({
      where: eq(polarSubscriptionTable.subscriptionId, subscriptionId),
    });

    if (existingSubscription) {
      await db
        .update(polarSubscriptionTable)
        .set({
          status,
          updatedAt: new Date(),
        })
        .where(eq(polarSubscriptionTable.subscriptionId, subscriptionId));
      return existingSubscription;
    }

    const subscription = await db.insert(polarSubscriptionTable).values({
      id: uuidv4(),
      userId,
      tenantId,
      customerId,
      subscriptionId,
      productId,
      status,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return subscription;
  } catch (error) {
    console.error("Error syncing subscription:", error);
    throw error;
  }
}

/**
 * Check if a user has an active subscription within a tenant
 */
export async function hasActiveSubscription(
  userId: string,
  tenantId: string,
): Promise<boolean> {
  const subscriptions = await getUserSubscriptions(userId, tenantId);
  return subscriptions.some((sub) => sub.status === "active");
}

/**
 * Get checkout URL for a specific product
 */
export async function getCheckoutUrl(customerId: string, productSlug: string): Promise<string | null> {
  try {
    const checkout = await polarClient.checkouts.create({
      customerId,
      products: [productSlug],
    });
    return checkout.url;
  } catch (error) {
    console.error("Error generating checkout URL:", error);
    return null;
  }
}
