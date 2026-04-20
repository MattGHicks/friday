import { readFileSync } from "node:fs";
const env = readFileSync(new URL("../.env.local", import.meta.url), "utf8");
for (const line of env.split("\n")) {
  const m = line.match(/^([A-Z_]+)=(.*)$/);
  if (m) process.env[m[1]] = m[2].replace(/^"|"$/g, "");
}
const { PrismaClient } = await import("../src/generated/prisma/client/index.js");
const { PrismaPg } = await import("@prisma/adapter-pg");
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });
const users = await prisma.user.findMany({ select: { id: true, email: true } });
console.log("Prisma Users:", JSON.stringify(users, null, 2));
const clients = await prisma.client.findMany({ select: { id: true, email: true, userId: true } });
console.log("Prisma Clients:", JSON.stringify(clients, null, 2));
await prisma.$disconnect();
