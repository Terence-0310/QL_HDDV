import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function fix() {
  const notifications = await prisma.notification.findMany({
    where: {
      relatedEntityId: null
    }
  });

  let count = 0;
  for (const n of notifications) {
    // Extract HD-2026-XXXX from title or message
    const match = (n.title + " " + n.message).match(/(HD-\d{4}-\d{4})/);
    if (match) {
      const code = match[1];
      const contract = await prisma.contract.findUnique({ where: { code } });
      if (contract) {
        await prisma.notification.update({
          where: { id: n.id },
          data: {
            relatedEntityType: "CONTRACT",
            relatedEntityId: contract.id
          }
        });
        count++;
      }
    }
  }
  
  console.log(`Updated ${count} notifications with contract links!`);
}

fix().finally(()=>prisma.$disconnect());
