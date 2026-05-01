import { PrismaClient, ContractStatus } from '@prisma/client';
import { addDays } from 'date-fns';
const prisma = new PrismaClient();

async function fix() {
  const now = new Date();
  const next30Days = addDays(now, 30);
  
  const updated = await prisma.contract.updateMany({
    where: {
      status: ContractStatus.ACTIVE,
      endDate: {
        lte: next30Days,
        gte: now
      }
    },
    data: {
      status: ContractStatus.EXPIRING_SOON
    }
  });
  
  console.log(`Updated ${updated.count} contracts to EXPIRING_SOON`);
}

fix().finally(()=>prisma.$disconnect());
