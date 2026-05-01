import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
const prisma = new PrismaClient();

async function update() {
  const hash = await bcrypt.hash("Admin@12345", 10);
  await prisma.user.update({
    where: { email: "admin@example.com" },
    data: { passwordHash: hash }
  });
  console.log("Password updated successfully to Admin@12345");
}

update().finally(()=>prisma.$disconnect());
