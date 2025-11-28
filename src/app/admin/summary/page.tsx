import { getUsersWithUploads } from "~/lib/queries/uploads";

import AdminPageClient from "./page.client";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const data = await getUsersWithUploads();
  return <AdminPageClient initialData={data} />;
}
