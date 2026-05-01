import { PrismaClient, ReminderType, ReminderJobStatus, ReminderSendStatus } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding reminders...");

  // Fetch some contracts
  const contracts = await prisma.contract.findMany({
    take: 10,
    select: { id: true, owner: { select: { email: true } }, partnerEmail: true }
  });

  if (contracts.length === 0) {
    console.log("No contracts found to attach reminders to!");
    return;
  }

  // Generate Reminder Jobs
  for (let i = 0; i < 15; i++) {
    const contract = contracts[i % contracts.length];
    const email = contract.partnerEmail || contract.owner.email || "test@example.com";
    
    const types: ReminderType[] = ["EXPIRING_SOON", "EXPIRED", "RENEWAL_NOTICE"];
    const statuses: ReminderJobStatus[] = ["PENDING", "PROCESSING", "SUCCESS", "FAILED"];
    
    const type = types[Math.floor(Math.random() * types.length)];
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    
    const scheduledAt = new Date();
    scheduledAt.setDate(scheduledAt.getDate() + Math.floor(Math.random() * 30) - 10); // Between 10 days ago and 20 days in future

    await prisma.reminderJob.create({
      data: {
        contractId: contract.id,
        recipientEmail: email,
        type,
        status,
        attempts: status === "FAILED" ? 3 : Math.floor(Math.random() * 3),
        maxAttempts: 3,
        scheduledAt,
        nextAttemptAt: scheduledAt,
        errorMessage: status === "FAILED" ? "Connection timeout to SMTP server" : null,
      }
    });
  }
  
  console.log("Created 15 Reminder Jobs.");

  // Generate Reminder Logs
  for (let i = 0; i < 20; i++) {
    const contract = contracts[i % contracts.length];
    const email = contract.partnerEmail || contract.owner.email || "test@example.com";
    
    const types: ReminderType[] = ["EXPIRING_SOON", "EXPIRED", "RENEWAL_NOTICE"];
    const statuses: ReminderSendStatus[] = ["SENT", "FAILED", "PENDING"];
    
    const type = types[Math.floor(Math.random() * types.length)];
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    
    const sentAt = new Date();
    sentAt.setDate(sentAt.getDate() - Math.floor(Math.random() * 30)); // Up to 30 days ago

    await prisma.reminderLog.create({
      data: {
        contractId: contract.id,
        sentTo: email,
        reminderType: type,
        status,
        sentAt: status === "SENT" ? sentAt : null,
        message: status === "SENT" ? "Email delivered successfully" : status === "FAILED" ? "Bounced: invalid recipient" : null,
        createdAt: sentAt,
      }
    });
  }

  console.log("Created 20 Reminder Logs.");
  console.log("Seeding complete!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
