import { type NextRequest, NextResponse } from "next/server";

import {
  createCustomerPortalSession,
  getCustomerByUserId,
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
    const customer = await getCustomerByUserId(user.id, tenant.id);

    if (!customer) {
      return NextResponse.json(
        { error: "No billing account found" },
        { status: 404 },
      );
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:8080";
    const returnUrl = `${baseUrl}/dashboard/billing`;

    const session = await createCustomerPortalSession(
      customer.customerId,
      returnUrl,
    );

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("Error creating portal session:", error);
    return NextResponse.json(
      { error: "Failed to create portal session" },
      { status: 500 },
    );
  }
}



