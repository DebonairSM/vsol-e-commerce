import { config } from "dotenv";
import { defineConfig } from "drizzle-kit";

// load .env first, then .env.local with override (higher priority)
config({ path: ".env" });
config({ override: true, path: ".env.local" });

export default defineConfig({
  dbCredentials: {
    url: process.env.DATABASE_URL ?? "",
  },
  dialect: "postgresql",
  schema: "./src/db/schema/index.ts",
  schemaFilter: ["public"],
});
