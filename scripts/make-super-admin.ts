import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function makeSuperAdmin() {
  // Find the first admin or the specific admin account
  const admin = await prisma.user.findFirst({
    where: { role: 'ADMIN' },
    orderBy: { createdAt: 'asc' }
  });

  if (admin) {
    await prisma.user.update({
      where: { id: admin.id },
      data: { role: 'SUPER_ADMIN' }
    });
    console.log(`Updated user ${admin.email} to SUPER_ADMIN`);
  } else {
    console.log("No admin found to update.");
  }
}

makeSuperAdmin().finally(() => prisma.$disconnect());
