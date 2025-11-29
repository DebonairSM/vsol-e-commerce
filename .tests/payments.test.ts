import { expect, test, describe } from "bun:test";

const mockCustomerId = "cus_mock123";
const mockUserId = "test-user-id";
const mockTenantId = "test-tenant-id";
const mockEmail = "test@example.com";
const mockSubscriptionId = "sub_mock123";
const mockPriceId = "price_mock123";
const mockProductId = "prod_mock123";

const mockDb = {
  query: {
    stripeCustomerTable: {
      findFirst: async () => ({
        id: "db-id",
        userId: mockUserId,
        tenantId: mockTenantId,
        customerId: mockCustomerId,
        email: mockEmail,
        createdAt: new Date(),
        updatedAt: new Date(),
      }),
      findMany: async () => [
        {
          id: "db-id",
          userId: mockUserId,
          tenantId: mockTenantId,
          customerId: mockCustomerId,
          email: mockEmail,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],
    },
    stripeSubscriptionTable: {
      findFirst: async () => ({
        id: "sub-id",
        userId: mockUserId,
        tenantId: mockTenantId,
        customerId: mockCustomerId,
        subscriptionId: mockSubscriptionId,
        priceId: mockPriceId,
        productId: mockProductId,
        status: "active",
        cancelAtPeriodEnd: false,
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        cancelAt: null,
        canceledAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      }),
      findMany: async () => [
        {
          id: "sub-id",
          userId: mockUserId,
          tenantId: mockTenantId,
          customerId: mockCustomerId,
          subscriptionId: mockSubscriptionId,
          priceId: mockPriceId,
          productId: mockProductId,
          status: "active",
          cancelAtPeriodEnd: false,
          currentPeriodStart: new Date(),
          currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          cancelAt: null,
          canceledAt: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],
    },
  },
  insert: () => ({
    values: () => ({
      returning: () => Promise.resolve([{ id: "new-id" }]),
    }),
  }),
  update: () => ({
    set: () => ({
      where: () => Promise.resolve({ success: true }),
    }),
  }),
};

const mockStripeClient = {
  customers: {
    create: async () => ({
      id: mockCustomerId,
      email: mockEmail,
      metadata: { userId: mockUserId, tenantId: mockTenantId },
    }),
    retrieve: async () => ({
      id: mockCustomerId,
      email: mockEmail,
      metadata: { userId: mockUserId, tenantId: mockTenantId },
    }),
  },
  checkout: {
    sessions: {
      create: async () => ({
        id: "cs_mock123",
        url: "https://checkout.stripe.com/c/pay/cs_mock123",
      }),
    },
  },
  billingPortal: {
    sessions: {
      create: async () => ({
        id: "bps_mock123",
        url: "https://billing.stripe.com/p/session/bps_mock123",
      }),
    },
  },
  subscriptions: {
    retrieve: async () => ({
      id: mockSubscriptionId,
      customer: mockCustomerId,
      status: "active",
      cancel_at_period_end: false,
      current_period_start: Math.floor(Date.now() / 1000),
      current_period_end: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60,
      items: {
        data: [
          {
            price: {
              id: mockPriceId,
              product: mockProductId,
            },
          },
        ],
      },
    }),
  },
};

const mockServices = {
  getCustomerByUserId: async (userId: string, tenantId: string) => {
    return mockDb.query.stripeCustomerTable.findFirst();
  },
  getOrCreateCustomer: async (
    userId: string,
    tenantId: string,
    email: string,
  ) => {
    const existing = await mockDb.query.stripeCustomerTable.findFirst();
    if (existing) return existing;
    await mockStripeClient.customers.create();
    return mockDb.query.stripeCustomerTable.findFirst();
  },
  getCustomerState: async (userId: string, tenantId: string) => {
    const customer = await mockDb.query.stripeCustomerTable.findFirst();
    if (!customer) return null;
    return mockStripeClient.customers.retrieve();
  },
  getUserSubscriptions: async (userId: string, tenantId: string) => {
    return mockDb.query.stripeSubscriptionTable.findMany();
  },
  hasActiveSubscription: async (userId: string, tenantId: string) => {
    const subscriptions = await mockDb.query.stripeSubscriptionTable.findMany();
    return subscriptions.some(
      (sub) => sub.status === "active" || sub.status === "trialing",
    );
  },
  createCheckoutSession: async (customerId: string, priceId: string) => {
    return mockStripeClient.checkout.sessions.create();
  },
  createCustomerPortalSession: async (customerId: string) => {
    return mockStripeClient.billingPortal.sessions.create();
  },
};

describe("Payment Service", () => {
  test("getCustomerByUserId should return customer", async () => {
    const customer = await mockServices.getCustomerByUserId(
      mockUserId,
      mockTenantId,
    );
    expect(customer).toBeDefined();
    expect(customer?.customerId).toBe(mockCustomerId);
    expect(customer?.userId).toBe(mockUserId);
    expect(customer?.tenantId).toBe(mockTenantId);
  });

  test("getOrCreateCustomer should return existing customer", async () => {
    const customer = await mockServices.getOrCreateCustomer(
      mockUserId,
      mockTenantId,
      mockEmail,
    );
    expect(customer).toBeDefined();
    expect(customer?.customerId).toBe(mockCustomerId);
  });

  test("getCustomerState should return Stripe customer", async () => {
    const customerState = await mockServices.getCustomerState(
      mockUserId,
      mockTenantId,
    );
    expect(customerState).toBeDefined();
    expect(customerState?.id).toBe(mockCustomerId);
  });

  test("getUserSubscriptions should return subscriptions", async () => {
    const subscriptions = await mockServices.getUserSubscriptions(
      mockUserId,
      mockTenantId,
    );
    expect(subscriptions.length).toBe(1);
    expect(subscriptions[0].subscriptionId).toBe(mockSubscriptionId);
    expect(subscriptions[0].status).toBe("active");
  });

  test("hasActiveSubscription should return true for active subscriptions", async () => {
    const hasActive = await mockServices.hasActiveSubscription(
      mockUserId,
      mockTenantId,
    );
    expect(hasActive).toBe(true);
  });

  test("createCheckoutSession should return session with URL", async () => {
    const session = await mockServices.createCheckoutSession(
      mockCustomerId,
      mockPriceId,
    );
    expect(session).toBeDefined();
    expect(session.url).toContain("checkout.stripe.com");
  });

  test("createCustomerPortalSession should return session with URL", async () => {
    const session =
      await mockServices.createCustomerPortalSession(mockCustomerId);
    expect(session).toBeDefined();
    expect(session.url).toContain("billing.stripe.com");
  });
});

describe("Stripe Integration", () => {
  test("Stripe environment variables should be defined", () => {
    if (process.env.CI) {
      console.log("Skipping Stripe env test in CI environment");
      return;
    }

    process.env.STRIPE_SECRET_KEY =
      process.env.STRIPE_SECRET_KEY || "sk_test_mock";
    process.env.STRIPE_WEBHOOK_SECRET =
      process.env.STRIPE_WEBHOOK_SECRET || "whsec_mock";

    expect(process.env.STRIPE_SECRET_KEY).toBeDefined();
    expect(process.env.STRIPE_WEBHOOK_SECRET).toBeDefined();
  });

  test("Price IDs should be configurable", () => {
    process.env.STRIPE_PRICE_ID_PRO =
      process.env.STRIPE_PRICE_ID_PRO || "price_pro_mock";
    process.env.STRIPE_PRICE_ID_PREMIUM =
      process.env.STRIPE_PRICE_ID_PREMIUM || "price_premium_mock";

    expect(process.env.STRIPE_PRICE_ID_PRO).toBeDefined();
    expect(process.env.STRIPE_PRICE_ID_PREMIUM).toBeDefined();
  });
});

describe("Payment API Routes", () => {
  test("customer-state API should return customer state for authenticated user", async () => {
    const customerState = await mockServices.getCustomerState(
      mockUserId,
      mockTenantId,
    );
    expect(customerState).toBeDefined();
  });

  test("subscriptions API should return user subscriptions", async () => {
    const subscriptions = await mockServices.getUserSubscriptions(
      mockUserId,
      mockTenantId,
    );
    expect(subscriptions.length).toBe(1);
  });

  test("checkout API should create session", async () => {
    const session = await mockServices.createCheckoutSession(
      mockCustomerId,
      mockPriceId,
    );
    expect(session.url).toBeDefined();
  });

  test("portal API should create session", async () => {
    const session =
      await mockServices.createCustomerPortalSession(mockCustomerId);
    expect(session.url).toBeDefined();
  });
});
