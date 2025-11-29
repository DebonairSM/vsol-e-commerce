import Stripe from "stripe";
import { and, eq } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";

import { db } from "~/db";
import { stripeCustomerTable, stripeSubscriptionTable } from "~/db/schema";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2025-04-30.basil",
});

// map product slugs to stripe price ids from env
export const PRICE_MAP: Record<string, string> = {
  pro: process.env.STRIPE_PRICE_ID_PRO || "",
  premium: process.env.STRIPE_PRICE_ID_PREMIUM || "",
};

/**
 * get a stripe customer by user id and tenant id from the database
 */
export async function getCustomerByUserId(userId: string, tenantId: string) {
  const customer = await db.query.stripeCustomerTable.findFirst({
    where: and(
      eq(stripeCustomerTable.userId, userId),
      eq(stripeCustomerTable.tenantId, tenantId),
    ),
  });

  return customer ?? null;
}

/**
 * get or create a stripe customer for a user/tenant
 */
export async function getOrCreateCustomer(
  userId: string,
  tenantId: string,
  email: string,
  name?: string,
) {
  const existing = await getCustomerByUserId(userId, tenantId);
  if (existing) {
    return existing;
  }

  // create stripe customer
  const stripeCustomer = await stripe.customers.create({
    email,
    name: name || email,
    metadata: {
      userId,
      tenantId,
    },
  });

  // save to database
  const now = new Date();
  const [customer] = await db
    .insert(stripeCustomerTable)
    .values({
      id: uuidv4(),
      userId,
      tenantId,
      customerId: stripeCustomer.id,
      email,
      createdAt: now,
      updatedAt: now,
    })
    .returning();

  return customer;
}

/**
 * get customer state from stripe api
 */
export async function getCustomerState(userId: string, tenantId: string) {
  const customer = await getCustomerByUserId(userId, tenantId);

  if (!customer) {
    return null;
  }

  try {
    const stripeCustomer = await stripe.customers.retrieve(customer.customerId);
    return stripeCustomer;
  } catch (error) {
    console.error("Error fetching customer state:", error);
    return null;
  }
}

/**
 * get all subscriptions for a user within a tenant
 */
export async function getUserSubscriptions(userId: string, tenantId: string) {
  const subscriptions = await db.query.stripeSubscriptionTable.findMany({
    where: and(
      eq(stripeSubscriptionTable.userId, userId),
      eq(stripeSubscriptionTable.tenantId, tenantId),
    ),
  });

  return subscriptions;
}

/**
 * sync subscription data from stripe to our database
 */
export async function syncSubscription(
  stripeSubscription: Stripe.Subscription,
  userId: string,
  tenantId: string,
) {
  const subscriptionId = stripeSubscription.id;
  const customerId = stripeSubscription.customer as string;
  const priceId = stripeSubscription.items.data[0]?.price.id || "";
  const productId =
    (stripeSubscription.items.data[0]?.price.product as string) || "";
  const status = stripeSubscription.status;
  const cancelAtPeriodEnd = stripeSubscription.cancel_at_period_end;
  const currentPeriodStart = new Date(
    stripeSubscription.current_period_start * 1000,
  );
  const currentPeriodEnd = new Date(
    stripeSubscription.current_period_end * 1000,
  );
  const cancelAt = stripeSubscription.cancel_at
    ? new Date(stripeSubscription.cancel_at * 1000)
    : null;
  const canceledAt = stripeSubscription.canceled_at
    ? new Date(stripeSubscription.canceled_at * 1000)
    : null;

  const now = new Date();

  const existing = await db.query.stripeSubscriptionTable.findFirst({
    where: eq(stripeSubscriptionTable.subscriptionId, subscriptionId),
  });

  if (existing) {
    await db
      .update(stripeSubscriptionTable)
      .set({
        status,
        priceId,
        productId,
        cancelAtPeriodEnd,
        currentPeriodStart,
        currentPeriodEnd,
        cancelAt,
        canceledAt,
        updatedAt: now,
      })
      .where(eq(stripeSubscriptionTable.subscriptionId, subscriptionId));

    return { ...existing, status, updatedAt: now };
  }

  const [subscription] = await db
    .insert(stripeSubscriptionTable)
    .values({
      id: uuidv4(),
      userId,
      tenantId,
      customerId,
      subscriptionId,
      priceId,
      productId,
      status,
      cancelAtPeriodEnd,
      currentPeriodStart,
      currentPeriodEnd,
      cancelAt,
      canceledAt,
      createdAt: now,
      updatedAt: now,
    })
    .returning();

  return subscription;
}

/**
 * check if a user has an active subscription within a tenant
 */
export async function hasActiveSubscription(
  userId: string,
  tenantId: string,
): Promise<boolean> {
  const subscriptions = await getUserSubscriptions(userId, tenantId);
  return subscriptions.some(
    (sub) => sub.status === "active" || sub.status === "trialing",
  );
}

/**
 * create a stripe checkout session
 */
export async function createCheckoutSession(
  customerId: string,
  priceId: string,
  successUrl: string,
  cancelUrl: string,
): Promise<Stripe.Checkout.Session> {
  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: "subscription",
    payment_method_types: ["card"],
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    success_url: successUrl,
    cancel_url: cancelUrl,
  });

  return session;
}

/**
 * create a stripe customer portal session
 */
export async function createCustomerPortalSession(
  customerId: string,
  returnUrl: string,
): Promise<Stripe.BillingPortal.Session> {
  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl,
  });

  return session;
}

/**
 * get price id for a product slug
 */
export function getPriceIdForSlug(slug: string): string | null {
  return PRICE_MAP[slug] || null;
}

/**
 * look up local customer by stripe customer id
 */
export async function getCustomerByStripeId(stripeCustomerId: string) {
  const customer = await db.query.stripeCustomerTable.findFirst({
    where: eq(stripeCustomerTable.customerId, stripeCustomerId),
  });

  return customer ?? null;
}
