import { PrismaClient, UserRole, UserStatus, PartnerType, ContractStatus, ApprovalStatus, NotificationType } from "@prisma/client";
import bcrypt from "bcryptjs";
import { addDays, subDays } from "date-fns";

const prisma = new PrismaClient();

async function main() {
  console.log("Starting bulk seed process (1000+ records)...");

  // Clear existing
  console.log("Clearing existing data...");
  await prisma.auditLog.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.reminderLog.deleteMany();
  await prisma.reminderJob.deleteMany();
  await prisma.contractApprovalHistory.deleteMany();
  await prisma.contractFile.deleteMany();
  await prisma.contract.deleteMany();
  await prisma.partner.deleteMany();
  await prisma.contractType.deleteMany();
  await prisma.user.deleteMany();

  // Pre-calculate hash to save immense time during bulk insert
  const passwordHash = await bcrypt.hash("Staff@12345", 10);

  // 1. Users (1000+ users)
  console.log("Seeding Users...");
  const baseAccounts: any[] = [
    { name: "System Admin", username: "admin_user", email: "admin@example.com", passwordHash, role: UserRole.ADMIN, status: UserStatus.ACTIVE },
    { name: "System Employee", username: "employee_user", email: "staff@example.com", passwordHash, role: UserRole.STAFF, status: UserStatus.ACTIVE },
    { name: "John Doe", username: "johndoe", email: "john@example.com", passwordHash, role: UserRole.USER, status: UserStatus.ACTIVE },
  ];

  for (let i = 1; i <= 1000; i++) {
    baseAccounts.push({
      name: `Staff Member ${i}`,
      username: `staff_${i}`,
      email: `staff${i}@example.com`,
      passwordHash,
      role: UserRole.STAFF,
      status: i % 10 === 0 ? UserStatus.INACTIVE : UserStatus.ACTIVE
    });
  }

  // SQLite limit workaround for bulk insert: insert in batches of 100
  for (let i = 0; i < baseAccounts.length; i += 100) {
    await prisma.user.createMany({ data: baseAccounts.slice(i, i + 100) });
  }

  const users = await prisma.user.findMany();
  const admin = users.find(u => u.email === "admin@example.com")!;
  const staffUsers = users.filter(u => u.role === UserRole.STAFF);

  // 2. Partners (1000 partners)
  console.log("Seeding Partners...");
  const partnerPrefixes = ["Công ty TNHH", "Công ty Cổ phần", "Tập đoàn", "Chi nhánh", "Doanh nghiệp tư nhân", "Hợp tác xã", "Tổng công ty"];
  const partnerNames = ["ABC", "XYZ", "Phát Đạt", "Toàn Cầu", "Bình Minh", "Công Nghệ Mới", "Thương Mại Việt", "Kiến Tạo", "Hưng Thịnh", "Á Châu", "Viễn Đông", "Đại Dương", "Thành Đạt", "Thái Bình Dương"];
  
  const partnerData = [];
  for (let i = 1; i <= 1000; i++) {
    const name = `${partnerPrefixes[i % partnerPrefixes.length]} ${partnerNames[i % partnerNames.length]} ${i}`;
    partnerData.push({
      name: name,
      partnerType: i % 3 === 0 ? PartnerType.SUPPLIER : (i % 2 === 0 ? PartnerType.CUSTOMER : PartnerType.OTHER),
      taxCode: `03123${i.toString().padStart(5, '0')}`,
      email: `contact@partner${i}.com`,
      phone: `0909${i.toString().padStart(6, '0')}`,
      status: "ACTIVE" as const
    });
  }

  for (let i = 0; i < partnerData.length; i += 100) {
    await prisma.partner.createMany({ data: partnerData.slice(i, i + 100) });
  }

  const partners = await prisma.partner.findMany();

  // 3. Types
  console.log("Seeding Types...");
  const typeNames = ["Hợp đồng Cung cấp Dịch vụ", "Hợp đồng Mua bán", "Hợp đồng Hợp tác Kinh doanh", "Hợp đồng Thuê tài sản", "Hợp đồng Bảo trì", "Hợp đồng Cấp phép", "Hợp đồng Tư vấn"];
  await prisma.contractType.createMany({
    data: typeNames.map(name => ({ name }))
  });
  const types = await prisma.contractType.findMany();

  // 4. Contracts (1000 instances)
  console.log("Seeding Contracts & Relational Logs...");
  const statusMatrix = [
    { status: ContractStatus.DRAFT, approvalStatus: ApprovalStatus.NOT_SUBMITTED },
    { status: ContractStatus.DRAFT, approvalStatus: ApprovalStatus.PENDING },
    { status: ContractStatus.DRAFT, approvalStatus: ApprovalStatus.REJECTED },
    { status: ContractStatus.ACTIVE, approvalStatus: ApprovalStatus.APPROVED },
    { status: ContractStatus.ACTIVE, approvalStatus: ApprovalStatus.APPROVED },
    { status: ContractStatus.ACTIVE, approvalStatus: ApprovalStatus.APPROVED },
    { status: ContractStatus.ACTIVE, approvalStatus: ApprovalStatus.APPROVED },
    { status: ContractStatus.EXPIRED, approvalStatus: ApprovalStatus.APPROVED },
    { status: ContractStatus.TERMINATED, approvalStatus: ApprovalStatus.APPROVED },
    { status: ContractStatus.RENEWED, approvalStatus: ApprovalStatus.APPROVED },
  ];
  
  const now = new Date();

  // To prevent memory overflow or taking too long, we will loop and insert relationships manually or via transactions.
  // Using batches of 100 for Contracts and related records
  for (let batch = 0; batch < 10; batch++) {
    for (let j = 1; j <= 100; j++) {
      const i = batch * 100 + j; // 1 to 1000

      const matrix = statusMatrix[i % statusMatrix.length];
      const status = matrix.status;
      let approvalStatus: ApprovalStatus = matrix.approvalStatus;
      
      let daysOffset = (i * 7) % 700; 
      let startDate = subDays(now, daysOffset);
      let endDate = addDays(startDate, 365 + (i % 3) * 180);
      
      if (status === ContractStatus.ACTIVE) {
        if (i % 15 === 0) endDate = addDays(now, 5);
        else if (i % 8 === 0) endDate = addDays(now, 12);
        else if (i % 10 === 0) endDate = addDays(now, 28);
        else endDate = addDays(now, 150 + (i % 200));
      } else if (status === ContractStatus.EXPIRED) {
        endDate = subDays(now, 10 + (i % 100));
      }

      const partner = partners[i % partners.length];
      const owner = staffUsers[i % staffUsers.length];

      const valueMultiplier = i % 10 === 0 ? 500000000 : 50000000;
      const value = (10 + (i % 20)) * valueMultiplier;

      const contract = await prisma.contract.create({
        data: {
          code: `HD-2026-${i.toString().padStart(4, '0')}`,
          title: `Hợp đồng ${types[i % types.length].name} - ${partner.name}`,
          partnerId: partner.id,
          contractTypeId: types[i % types.length].id,
          partnerName: partner.name,
          partnerEmail: partner.email,
          ownerId: owner.id,
          value: value, 
          startDate,
          endDate,
          signedDate: approvalStatus === ApprovalStatus.APPROVED ? startDate : null,
          status: status as any,
          approvalStatus: approvalStatus as any,
          createdAt: startDate,
          submittedForApprovalAt: approvalStatus === ApprovalStatus.PENDING ? subDays(now, (i % 10) + 1) : null,
        }
      });

      // 5. Audit Log & Approval History
      await prisma.auditLog.create({
        data: { userId: owner.id, contractId: contract.id, action: "CONTRACT_CREATED", entityType: "CONTRACT", entityId: contract.id, createdAt: startDate }
      });

      if (approvalStatus === ApprovalStatus.PENDING) {
        await prisma.contractApprovalHistory.create({
          data: { contractId: contract.id, actorId: owner.id, action: "SUBMIT", createdAt: subDays(now, (i % 10) + 1) }
        });
      }

      if (approvalStatus === ApprovalStatus.APPROVED) {
        const approvedAt = addDays(startDate, 2);
        await prisma.auditLog.create({
          data: { userId: admin.id, contractId: contract.id, action: "CONTRACT_APPROVED", entityType: "CONTRACT", entityId: contract.id, createdAt: approvedAt }
        });
        await prisma.contractApprovalHistory.create({
          data: { contractId: contract.id, actorId: admin.id, action: "APPROVE", createdAt: approvedAt }
        });
      }

      // 6. Reminder Milestones & Logs
      if (status === ContractStatus.ACTIVE && contract.endDate > now) {
        const offsets = [7, 15, 30, 60];
        for (const offset of offsets) {
          const reminderDate = subDays(contract.endDate, offset);
          
          if (reminderDate > now) {
            await prisma.reminderJob.create({
              data: { contractId: contract.id, reminderThresholdDays: offset, scheduledAt: reminderDate, recipientEmail: owner.email, type: "EXPIRING_SOON", status: "PENDING" }
            });
          } else {
            await prisma.reminderLog.create({
              data: { contractId: contract.id, reminderType: "EXPIRING_SOON", sentTo: owner.email, sentAt: reminderDate, status: "SENT", reminderThresholdDays: offset, message: `Đã gửi thông báo nhắc hạn ${offset} ngày`, createdAt: reminderDate }
            });
            await prisma.reminderJob.create({
              data: { contractId: contract.id, reminderThresholdDays: offset, scheduledAt: reminderDate, recipientEmail: owner.email, type: "EXPIRING_SOON", status: "SUCCESS", processedAt: reminderDate }
            });
          }
        }
      }

      if (i % 15 === 1 && status === ContractStatus.ACTIVE) {
        await prisma.reminderJob.create({
          data: { contractId: contract.id, reminderThresholdDays: 7, scheduledAt: subDays(now, 1), recipientEmail: owner.email, type: "EXPIRING_SOON", status: "FAILED", errorMessage: "SMTP Connection Timeout", attempts: 3 }
        });
        await prisma.reminderLog.create({
          data: { contractId: contract.id, reminderType: "EXPIRING_SOON", sentTo: owner.email, status: "FAILED", reminderThresholdDays: 7, message: "SMTP Connection Timeout", createdAt: subDays(now, 1) }
        });
      }

      // 7. Notifications
      if (i % 2 === 0) {
        await prisma.notification.create({
          data: { userId: admin.id, type: NotificationType.SYSTEM, title: `Hệ thống vừa cập nhật hợp đồng ${contract.code}`, message: `Hợp đồng của đối tác ${partner.name} đã được thay đổi trạng thái thành ${status}.`, isRead: i % 4 === 0, createdAt: subDays(now, i % 30) }
        });
      }
      
      // Seed notifications for the owner
      await prisma.notification.create({
        data: { userId: owner.id, type: NotificationType.REMINDER, title: `Nhắc việc hợp đồng ${contract.code}`, message: `Bạn có hợp đồng cần kiểm tra. Vui lòng xem danh sách.`, isRead: i % 3 === 0, createdAt: subDays(now, i % 10) }
      });
    }
    console.log(`Completed batch ${batch + 1}/10 of 100 contracts...`);
  }

  console.log("1000 Contracts, Users, Partners, Logs Seed completed successfully.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
