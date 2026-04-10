import { PrismaClient } from "../src/generated/prisma/client.js";
import { PrismaPg } from "@prisma/adapter-pg";
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const DEFAULT_STAGES = [
  { name: "Lead", position: 0, color: "#6B6258", isDefault: false },
  { name: "Discovery", position: 1, color: "#F0A830", isDefault: true },
  { name: "In Progress", position: 2, color: "#E55A3A", isDefault: false },
  { name: "In Review", position: 3, color: "#F0A830", isDefault: false },
  { name: "Delivered", position: 4, color: "#5A8A6A", isDefault: false },
  { name: "Archived", position: 5, color: "#8A7A6A", isDefault: false },
];

const adapter = new PrismaPg({ connectionString: process.env.DIRECT_URL });
const prisma = new PrismaClient({ adapter });

const users = await prisma.user.findMany({
  where: { pipelineStages: { none: {} } },
  select: { id: true, email: true },
});

console.log(`Seeding ${users.length} users with default pipeline stages...`);

for (const user of users) {
  await prisma.pipelineStage.createMany({
    data: DEFAULT_STAGES.map((s) => ({ userId: user.id, ...s })),
  });
  const defaultStage = await prisma.pipelineStage.findFirst({
    where: { userId: user.id, isDefault: true },
  });
  if (defaultStage) {
    const updated = await prisma.project.updateMany({
      where: { userId: user.id, stageId: null },
      data: { stageId: defaultStage.id },
    });
    console.log(`  ✓ ${user.email} — backfilled ${updated.count} projects`);
  }
}

await prisma.$disconnect();
console.log("Done.");
