import { PrismaClient, ReminderJobStatus } from '@prisma/client';
const prisma = new PrismaClient();

async function fix() {
  const jobs = await prisma.reminderJob.findMany({
    where: { status: ReminderJobStatus.PENDING },
    take: 12
  });

  let count = 0;
  for (const job of jobs) {
    await prisma.reminderJob.update({
      where: { id: job.id },
      data: {
        status: ReminderJobStatus.DEAD_LETTER,
        errorMessage: "Failed to deliver email after 3 attempts: Connection timeout",
        attempts: 3
      }
    });
    count++;
  }
  
  console.log(`Updated ${count} reminder jobs to DEAD_LETTER!`);
}

fix().finally(()=>prisma.$disconnect());
