import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding more data for reports and logs...");

  // Fetch some basic entities
  const users = await prisma.user.findMany({ take: 5, select: { id: true, name: true, role: true } });
  const contracts = await prisma.contract.findMany({ take: 10, select: { id: true } });

  if (users.length === 0 || contracts.length === 0) {
    console.log("Not enough users or contracts found. Aborting.");
    return;
  }

  // Generate Audit Logs
  const actions = ["LOGIN", "UPDATE_USER_ROLE", "CREATE_CONTRACT", "APPROVE_CONTRACT", "UPDATE_SETTINGS", "EXPORT_REPORT"];
  const entityTypes = ["USER", "CONTRACT", "SYSTEM", "REPORT"];

  for (let i = 0; i < 30; i++) {
    const user = users[Math.floor(Math.random() * users.length)];
    const contract = contracts[Math.floor(Math.random() * contracts.length)];
    const action = actions[Math.floor(Math.random() * actions.length)];
    const entityType = entityTypes[Math.floor(Math.random() * entityTypes.length)];
    
    const createdAt = new Date();
    createdAt.setDate(createdAt.getDate() - Math.floor(Math.random() * 30));

    await prisma.auditLog.create({
      data: {
        userId: user.id,
        contractId: entityType === "CONTRACT" ? contract.id : null,
        action,
        entityType,
        entityId: entityType === "CONTRACT" ? contract.id : user.id,
        metadata: JSON.stringify({ detail: "System generated audit log for testing", ip: "192.168.1.x" }),
        createdAt,
      }
    });
  }
  console.log("Created 30 Audit Logs.");

  // Generate Notifications
  const notifTypes: any[] = ["REMINDER", "CONTRACT_RENEWED", "CONTRACT_EXPIRING", "SYSTEM"];
  for (let i = 0; i < 15; i++) {
    const user = users[Math.floor(Math.random() * users.length)];
    const type = notifTypes[Math.floor(Math.random() * notifTypes.length)];
    
    const createdAt = new Date();
    createdAt.setDate(createdAt.getDate() - Math.floor(Math.random() * 10));

    await prisma.notification.create({
      data: {
        userId: user.id,
        type,
        title: `Thông báo hệ thống: ${type}`,
        message: "Đây là dữ liệu mô phỏng để test giao diện.",
        isRead: Math.random() > 0.5,
        createdAt,
      }
    });
  }
  console.log("Created 15 Notifications.");

  // Generate Approval Histories
  for (let i = 0; i < 10; i++) {
    const user = users[Math.floor(Math.random() * users.length)];
    const contract = contracts[Math.floor(Math.random() * contracts.length)];
    const actions: any[] = ["SUBMIT", "APPROVE", "REJECT"];
    const action = actions[Math.floor(Math.random() * actions.length)];

    await prisma.contractApprovalHistory.create({
      data: {
        contractId: contract.id,
        actorId: user.id,
        action,
        reason: action === "REJECT" ? "Thiếu thông tin chứng minh tài chính" : null,
        step: 1,
        createdAt: new Date(),
      }
    });
  }
  console.log("Created 10 Approval Histories.");

  console.log("Additional seeding complete!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
