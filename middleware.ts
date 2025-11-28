import { type NextRequest, NextResponse } from "next/server";

export async function middleware(request: NextRequest) {
  const host = request.headers.get("host") ?? "";
  const url = request.nextUrl.clone();

  // skip tenant resolution for api routes, auth routes, and static files
  if (
    url.pathname.startsWith("/api") ||
    url.pathname.startsWith("/_next") ||
    url.pathname.startsWith("/auth") ||
    url.pathname.match(/\.(ico|png|jpg|jpeg|svg|css|js|woff|woff2)$/)
  ) {
    return NextResponse.next();
  }

  // remove port from host for processing
  const hostWithoutPort = host.split(":")[0];
  const hostParts = hostWithoutPort.split(".");
  const isLocalhost =
    hostWithoutPort.includes("localhost") ||
    hostWithoutPort.includes("127.0.0.1");

  const response = NextResponse.next();

  if (isLocalhost) {
    // for localhost:8080 or subdomain.localhost:8080
    const subdomain = hostParts[0];
    if (subdomain && subdomain !== "localhost" && subdomain !== "127") {
      response.headers.set("x-tenant-subdomain", subdomain);
      response.headers.set("x-tenant-lookup-type", "subdomain");
    }
  } else {
    // production: determine if it's a custom domain or subdomain
    // custom domains typically have 2 parts (example.com), subdomains have 3+ (tenant.example.com)
    // but we need to check the database to be sure, so we'll pass the full host
    // and let getTenantFromRequest handle the lookup
    if (hostParts.length === 2) {
      // likely a custom domain (example.com)
      response.headers.set("x-tenant-host", hostWithoutPort);
      response.headers.set("x-tenant-lookup-type", "custom-domain");
    } else if (hostParts.length >= 3) {
      // likely a subdomain (tenant.example.com)
      const subdomain = hostParts[0];
      response.headers.set("x-tenant-subdomain", subdomain);
      response.headers.set("x-tenant-lookup-type", "subdomain");
    }
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};
