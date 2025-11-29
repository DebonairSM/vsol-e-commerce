import type { InferSelectModel } from "drizzle-orm";

import type { stripeCustomerTable, stripeSubscriptionTable } from "./tables";

export type StripeCustomer = InferSelectModel<typeof stripeCustomerTable>;
export type StripeSubscription = InferSelectModel<
  typeof stripeSubscriptionTable
>;
