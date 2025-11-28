import { NextRequest, NextResponse } from "next/server";

import { getCustomerState } from "~/api/payments/service";
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
    const customerState = await getCustomerState(user.id, tenant.id);
    
    if (!customerState) {
      return new NextResponse(
        JSON.stringify({ error: "Customer not found" }),
        { status: 404 },
      );
    }

    return NextResponse.json(customerState);
  } catch (error) {
    console.error("Error fetching customer state:", error);
    return new NextResponse(
      JSON.stringify({ error: "Failed to fetch customer state" }),
      { status: 500 },
    );
  }
}
