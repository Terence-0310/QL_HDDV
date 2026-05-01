import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const contracts = await prisma.contract.findMany({
    select: { id: true, code: true, title: true, approvalStatus: true },
  });
  console.table(contracts);
  await prisma.$disconnect();
}

main();
