import { NextRequest, NextResponse } from "next/server";

import { getUserSubscriptions } from "~/api/payments/service";
import { getCurrentUser } from "~/lib/auth";
import { getCurrentTenantForUser } from "~/lib/tenant-auth";

export async function GET(request: NextRequest) {
  const user = await getCurrentUser();

  if (!user) {
    return new NextResponse(
      JSON.stringify({ error: "Authentication required" }),
      { status: 401 },
    );
  }

  // get tenant and verify user has access
  const tenant = await getCurrentTenantForUser(user.id);
  if (!tenant) {
    return new NextResponse(
      JSON.stringify({ error: "Tenant context required or access denied" }),
      { status: 403 },
    );
  }

  try {
    const subscriptions = await getUserSubscriptions(user.id, tenant.id);
    return NextResponse.json({ subscriptions });
  } catch (error) {
    console.error("Error fetching subscriptions:", error);
    return new NextResponse(
      JSON.stringify({ error: "Failed to fetch subscriptions" }),
      { status: 500 },
    );
  }
}
