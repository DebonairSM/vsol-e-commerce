import { and, eq } from "drizzle-orm";
import { headers } from "next/headers";

import { db } from "~/db";
import { tenantTable } from "~/db/schema";

export async function getTenantByCustomDomain(
  customDomain: string,
): Promise<null | typeof tenantTable.$inferSelect> {
  try {
    // remove protocol and port if present
    const cleanDomain = customDomain
      .replace(/^https?:\/\//, "")
      .split(":")[0]
      .toLowerCase();

    const [tenant] = await db
      .select()
      .from(tenantTable)
      .where(
        and(
          eq(tenantTable.customDomain, cleanDomain),
          eq(tenantTable.isActive, true),
        ),
      )
      .limit(1);

    return tenant ?? null;
  } catch (error) {
    console.error("Error fetching tenant by custom domain:", error);
    return null;
  }
}

export async function getTenantBySubdomain(
  subdomain: string,
): Promise<null | typeof tenantTable.$inferSelect> {
  try {
    const [tenant] = await db
      .select()
      .from(tenantTable)
      .where(
        and(
          eq(tenantTable.subdomain, subdomain.toLowerCase()),
          eq(tenantTable.isActive, true),
        ),
      )
      .limit(1);

    return tenant ?? null;
  } catch (error) {
    console.error("Error fetching tenant by subdomain:", error);
    return null;
  }
}

export async function getTenantFromRequest(): Promise<
  null | typeof tenantTable.$inferSelect
> {
  try {
    const headersList = await headers();
    const host = headersList.get("host") ?? "";
    const lookupType = headersList.get("x-tenant-lookup-type");
    const tenantSubdomain = headersList.get("x-tenant-subdomain");
    const tenantHost = headersList.get("x-tenant-host");

    // use middleware-provided headers if available
    if (lookupType === "custom-domain" && tenantHost) {
      return getTenantByCustomDomain(tenantHost);
    }

    if (lookupType === "subdomain" && tenantSubdomain) {
      return getTenantBySubdomain(tenantSubdomain);
    }

    // fallback: extract from host header
    const hostWithoutPort = host.split(":")[0];
    const hostParts = hostWithoutPort.split(".");
    const isLocalhost =
      hostWithoutPort.includes("localhost") ||
      hostWithoutPort.includes("127.0.0.1");

    if (isLocalhost) {
      // for localhost, check for subdomain in the format: subdomain.localhost:8080
      const subdomain = hostParts[0];
      if (subdomain && subdomain !== "localhost" && subdomain !== "127") {
        return getTenantBySubdomain(subdomain);
      }
      // no subdomain, return null (main app)
      return null;
    }

    // production: try custom domain first (2 parts), then subdomain (3+ parts)
    if (hostParts.length === 2) {
      // likely a custom domain (example.com)
      const tenant = await getTenantByCustomDomain(hostWithoutPort);
      if (tenant) {
        return tenant;
      }
    }

    // try subdomain (e.g., tenant.example.com)
    if (hostParts.length >= 2) {
      const subdomain = hostParts[0];
      return getTenantBySubdomain(subdomain);
    }

    return null;
  } catch (error) {
    console.error("Error in getTenantFromRequest:", error);
    return null;
  }
}
