import { type NextRequest, NextResponse } from "next/server";

import {
  createCheckoutSession,
  getOrCreateCustomer,
  getPriceIdForSlug,
} from "~/api/payments/service";
import { getCurrentUser } from "~/lib/auth";
import { getCurrentTenantForUser } from "~/lib/tenant-auth";

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json(
      { error: "Authentication required" },
      { status: 401 },
    );
  }

  const tenant = await getCurrentTenantForUser(user.id);
  if (!tenant) {
    return NextResponse.json(
      { error: "Tenant context required or access denied" },
      { status: 403 },
    );
  }

  try {
    const body = await request.json();
    const { priceId, slug } = body;

    // support both direct priceId and slug lookup
    let finalPriceId = priceId;
    if (!finalPriceId && slug) {
      finalPriceId = getPriceIdForSlug(slug);
    }

    if (!finalPriceId) {
      return NextResponse.json(
        { error: "priceId or valid slug is required" },
        { status: 400 },
      );
    }

    // get or create stripe customer
    const customer = await getOrCreateCustomer(
      user.id,
      tenant.id,
      user.email || "",
      user.name || undefined,
    );

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:8080";
    const successUrl = `${baseUrl}/dashboard/billing?checkout_success=true&session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = `${baseUrl}/dashboard/billing`;

    const session = await createCheckoutSession(
      customer.customerId,
      finalPriceId,
      successUrl,
      cancelUrl,
    );

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("Error creating checkout session:", error);
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 },
    );
  }
}



