// Load .env.local (Next.js convention) for DATABASE_URL
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    // DIRECT_URL (session pooler, port 5432) supports DDL for migrations
    // Falls back to DATABASE_URL (transaction pooler) if DIRECT_URL not set
    url: process.env["DIRECT_URL"] || process.env["DATABASE_URL"],
  },
});
