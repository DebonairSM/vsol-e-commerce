# Multitenancy Setup Guide

This application now supports multitenancy similar to Squarespace, where each tenant (organization) can have their own subdomain or custom domain.

## Database Schema

### New Tables

1. **tenant** - stores tenant/organization information
   - `id` - primary key
   - `name` - tenant name
   - `subdomain` - unique subdomain (e.g., "acme" for acme.example.com)
   - `customDomain` - optional custom domain (e.g., "acme.com")
   - `isActive` - whether the tenant is active
   - `createdAt`, `updatedAt` - timestamps

2. **tenant_membership** - links users to tenants with roles
   - `id` - primary key
   - `userId` - reference to user
   - `tenantId` - reference to tenant
   - `role` - enum: "owner", "admin", "member"
   - `createdAt`, `updatedAt` - timestamps
   - **Unique constraint** on (userId, tenantId) to prevent duplicate memberships

### Updated Tables

The following tables now include `tenantId` (NOT NULL, with foreign key and indexes):
- `uploads` - all uploads are scoped to a tenant
- `polar_customer` - payment customers are per-tenant
- `polar_subscription` - subscriptions are per-tenant

### Database Indexes

Performance indexes have been added on:
- `uploads.tenantId` and `uploads(userId, tenantId)`
- `polar_customer.tenantId` and `polar_customer(userId, tenantId)`
- `polar_subscription.tenantId` and `polar_subscription(userId, tenantId)`
- `tenant_membership.userId` and `tenant_membership.tenantId`

## Environment Variables

Update your `.env` file with these values:

```env
# APP - Updated to port 8080
NEXT_PUBLIC_APP_URL="http://localhost:8080"
NEXT_SERVER_APP_URL="http://localhost:8080"

# DATABASE - Update with your actual database URL
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/vsol_ecommerce?sslmode=disable"

# AUTHENTICATION - Use a secure random secret
AUTH_SECRET="1bd5868ede1137ff66e36c3911850eedc3bea3c089389095e931474a49547b7d"

# Temporary placeholder values (replace with real credentials):
AUTH_GOOGLE_ID="temp_google_client_id"
AUTH_GOOGLE_SECRET="temp_google_client_secret"
AUTH_GITHUB_ID="temp_github_client_id"
AUTH_GITHUB_SECRET="temp_github_client_secret"
UPLOADTHING_TOKEN="temp_uploadthing_token"
UPLOADTHING_SECRET_KEY="sk_temp_temp_temp_temp_temp_temp_temp"
POLAR_ACCESS_TOKEN="temp_polar_access_token"
POLAR_WEBHOOK_SECRET="temp_polar_webhook_secret"
POLAR_ENVIRONMENT="sandbox"
```

## Port Configuration

The development server is configured to run on port 8080. You can start it with:

```bash
bun dev
```

## Tenant Resolution

The middleware automatically resolves tenants from:

1. **Subdomain** (development): `subdomain.localhost:8080`
2. **Subdomain** (production): `subdomain.example.com`
3. **Custom Domain**: `customdomain.com` (must be configured in tenant table)

### Usage in Server Components

```typescript
import { getTenantFromRequest } from "~/lib/tenant";

export default async function MyPage() {
  const tenant = await getTenantFromRequest();
  
  if (!tenant) {
    // main app (no tenant)
    return <div>Main App</div>;
  }
  
  // tenant-specific content
  return <div>Tenant: {tenant.name}</div>;
}
```

## Database Migration

After updating your schema, run:

```bash
bun db:push
```

This will create the new tenant tables and add `tenantId` columns to existing tables.

## Creating a Tenant

Use the tenant management utilities:

```typescript
import { createTenant } from "~/lib/tenant-management";

// create a new tenant
const tenant = await createTenant(
  "My Company",
  "mycompany", // subdomain
  userId, // owner user ID
  "mycompany.com" // optional custom domain
);
```

### Tenant Management Functions

```typescript
import {
  createTenant,
  updateTenant,
  addUserToTenant,
  removeUserFromTenant,
  updateUserRoleInTenant,
  getTenantsForUser,
  getMembersForTenant,
  deleteTenant,
} from "~/lib/tenant-management";

// update tenant
await updateTenant(tenantId, {
  name: "New Name",
  customDomain: "newsite.com",
  isActive: true,
});

// add user to tenant
await addUserToTenant(userId, tenantId, "admin");

// get all tenants for a user
const userTenants = await getTenantsForUser(userId);

// get all members of a tenant
const members = await getMembersForTenant(tenantId);
```

## Authorization & Security

All API routes now validate tenant access:

```typescript
import { getCurrentTenantForUser, requireTenantAccess } from "~/lib/tenant-auth";

// get current tenant (validates user has access)
const tenant = await getCurrentTenantForUser(userId);
if (!tenant) {
  return new Response("Access denied", { status: 403 });
}

// require specific role
await requireTenantRole(userId, tenantId, "admin");
```

## Data Migration

For existing data, use migration utilities:

```typescript
import {
  migrateUserToTenant,
  migrateAllUsersToTenants,
  assignOrphanedDataToTenant,
} from "~/lib/tenant-migration";

// migrate a single user
await migrateUserToTenant(userId, "Workspace Name", "workspace");

// migrate all users (creates default tenant for each)
const result = await migrateAllUsersToTenants();
console.log(`Migrated ${result.success} users, ${result.errors.length} errors`);

// assign orphaned data to a tenant
await assignOrphanedDataToTenant(tenantId);
```

## Next Steps

1. Update your `.env` file with the values above
2. Run `bun db:push` to apply schema changes
3. Create your first tenant using the example function above
4. Access your tenant at `http://[subdomain].localhost:8080`

## API Route Changes

All API routes now require tenant context:

- **Upload routes** (`/api/uploadthing/*`, `/api/media/*`): Automatically get tenant from request and validate user access
- **Payment routes** (`/api/payments/*`): Require tenant context and filter by tenant
- **Media routes**: Filter queries by both userId and tenantId

## Troubleshooting

### Tenant Not Found
- Verify the subdomain exists in the database
- Check that `isActive` is `true` for the tenant
- Ensure middleware is running and setting headers correctly

### Access Denied (403)
- User must be a member of the tenant (check `tenant_membership` table)
- Verify tenant resolution is working (check middleware logs)

### Database Errors
- Ensure all `tenantId` columns are populated (NOT NULL constraint)
- Run migration utilities for existing data
- Check foreign key constraints are satisfied

### Custom Domain Not Working
- Verify DNS is configured to point to your application
- Check that custom domain is set in tenant table (lowercase, no protocol)
- Ensure middleware is checking custom domains (production only)

## Notes

- All data (uploads, payments, etc.) is now scoped to tenants
- Users can belong to multiple tenants via the `tenant_membership` table
- The middleware automatically resolves tenants from the request host
- Custom domains require DNS configuration to point to your application
- All queries are filtered by tenantId for security
- Unique constraint on (userId, tenantId) prevents duplicate memberships
- Database indexes optimize tenant-scoped queries

