// prisma.config.ts
// Prisma v7 CLI config file — read by the Prisma CLI only, not by Next.js.
// This is the only .ts file in the project. Your app/ folder stays pure .js.
// In v7, the database URL moved here from schema.prisma.
// We pass DIRECT_URL here because prisma migrate needs a direct (non-pooled)
// connection — connection poolers like PgBouncer block DDL commands.

import "dotenv/config";
import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",

  migrations: {
    path: "prisma/migrations",
    // Tells `npx prisma db seed` what command to run
    seed: "node prisma/seed.js",
  },

  datasource: {
    // DIRECT_URL bypasses PgBouncer — required for migrations
    // If you don't have a pooler, just use DATABASE_URL here
    url: env("DIRECT_URL"),
  },
});