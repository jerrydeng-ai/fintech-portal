import { execSync } from "node:child_process";
import { PrismaClient } from "@prisma/client";
import { seedDatabase } from "../prisma/seed-data";

/** Fresh SQLite test database (prisma/test.db) per test run, migrated and seeded. */
export default async function setup() {
  const env = { ...process.env, DATABASE_URL: "file:./test.db" };
  execSync("npx prisma migrate reset --force --skip-seed --skip-generate", { env, stdio: "ignore" });
  const prisma = new PrismaClient({ datasourceUrl: env.DATABASE_URL });
  await seedDatabase(prisma);
  await prisma.$disconnect();
}
