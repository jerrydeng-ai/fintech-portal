import { PrismaClient } from "@prisma/client";
import { seedDatabase } from "./seed-data";

const prisma = new PrismaClient();

async function main() {
  const ifEmpty = process.argv.includes("--if-empty");
  if ((await prisma.user.count()) > 0) {
    if (ifEmpty) return;
    throw new Error("Database already seeded. Run `npm run db:reset` to start over.");
  }
  await seedDatabase(prisma);
  console.log("Seeded demo users, 20 KYC cases and audit history.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
