import { PrismaClient, UserRole, UserStatus } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function resetDb() {
  // Reminder queue/log tables depend on Contract.
  await prisma.reminderJob.deleteMany({});
  await prisma.reminderLog.deleteMany({});

  await prisma.contract.deleteMany({});
  await prisma.notification.deleteMany({});

  await prisma.auditLog.deleteMany({});
  await prisma.user.deleteMany({});
}

async function seedAccounts() {
  const accounts = [
    {
      name: "System Admin",
      email: "admin@example.com",
      password: "Admin@12345",
      role: UserRole.ADMIN,
      status: UserStatus.ACTIVE,
    },
    {
      name: "System Staff",
      email: "staff@example.com",
      password: "Staff@12345",
      role: UserRole.STAFF,
      status: UserStatus.ACTIVE,
    },
    {
      name: "System User",
      email: "user@example.com",
      password: "User@12345",
      role: UserRole.USER,
      status: UserStatus.ACTIVE,
    },
  ] as const;

  for (const account of accounts) {
    const passwordHash = await bcrypt.hash(account.password, 10);
    await prisma.user.upsert({
      where: { email: account.email },
      update: {
        name: account.name,
        role: account.role,
        passwordHash,
        status: account.status,
      },
      create: {
        name: account.name,
        email: account.email,
        role: account.role,
        passwordHash,
        status: account.status,
      },
    });
  }
}

async function main() {
  await resetDb();
  await seedAccounts();
  console.log("[e2e seed] Completed");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

