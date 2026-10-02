import { PrismaClient } from "@prisma/client";
import { seedDatabase } from "./seed-data";

const prisma = new PrismaClient();

async function main() {
  const ifEmpty = process.argv.includes("--if-empty");
  // Seeding commits atomically, so a completed seed always leaves KYC cases behind;
  // checking cases (not users) means an interrupted attempt can't wedge --if-empty.
  if ((await prisma.kycCase.count()) > 0) {
    if (ifEmpty) return;
    throw new Error("Database already seeded. Run `npm run db:reset` to start over.");
  }
  await prisma.$transaction((tx) => seedDatabase(tx), { timeout: 60_000 });
  console.log("Seeded demo users, 20 KYC cases and audit history.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
