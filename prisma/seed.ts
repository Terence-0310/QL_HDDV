import { PrismaClient, UserRole, UserStatus, PartnerType, ContractStatus, ApprovalStatus, NotificationType } from "@prisma/client";
import bcrypt from "bcryptjs";
import { addDays, subDays } from "date-fns";

const prisma = new PrismaClient();

async function main() {
  // Clear existing
  await prisma.auditLog.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.reminderJob.deleteMany();
  await prisma.contract.deleteMany();
  await prisma.partner.deleteMany();
  await prisma.contractType.deleteMany();

  // 1. Users
  const accounts = [
    { name: "System Admin", username: "admin_user", email: "admin@example.com", password: "Admin@12345", role: UserRole.ADMIN, status: UserStatus.ACTIVE },
    { name: "System Employee", username: "employee_user", email: "staff@example.com", password: "Staff@12345", role: UserRole.STAFF, status: UserStatus.ACTIVE },
    { name: "John Doe", username: "johndoe", email: "john@example.com", password: "User@12345", role: UserRole.USER, status: UserStatus.ACTIVE },
  ] as const;

  const users = [];
  for (const account of accounts) {
    const passwordHash = await bcrypt.hash(account.password, 10);
    const user = await prisma.user.upsert({
      where: { email: account.email },
      update: { name: account.name, role: account.role, passwordHash, status: account.status },
      create: { name: account.name, username: account.username, email: account.email, role: account.role, passwordHash, status: account.status },
    });
    users.push(user);
  }

  const admin = users[0];
  const staff = users[1];

  // 2. Partners
  const partnerNames = [
    "Công ty TNHH ABC",
    "Công ty Cổ phần XYZ",
    "Công ty TNHH DEF",
    "Công ty Cổ phần GHI",
    "Công ty Công nghệ MNO"
  ];
  const partners = [];
  for (let i = 0; i < partnerNames.length; i++) {
    const partner = await prisma.partner.create({
      data: {
        name: partnerNames[i],
        partnerType: i % 2 === 0 ? PartnerType.CUSTOMER : PartnerType.SUPPLIER,
        taxCode: `031234567${i}`,
        email: `contact@${partnerNames[i].replace(/ /g, "").toLowerCase()}.com`,
        phone: `090999999${i}`,
        status: "ACTIVE"
      }
    });
    partners.push(partner);
  }

  // 3. Types
  const types = [];
  const typeNames = ["Hợp đồng Cung cấp Dịch vụ", "Hợp đồng Mua bán", "Hợp đồng Hợp tác Kinh doanh", "Hợp đồng Thuê tài sản"];
  for (const name of typeNames) {
    const type = await prisma.contractType.create({ data: { name } });
    types.push(type);
  }

  // 4. Contracts (30 instances)
  const statusMatrix = [
    { status: ContractStatus.DRAFT, approvalStatus: ApprovalStatus.NOT_SUBMITTED },
    { status: ContractStatus.DRAFT, approvalStatus: ApprovalStatus.PENDING },
    { status: ContractStatus.DRAFT, approvalStatus: ApprovalStatus.REJECTED },
    { status: ContractStatus.ACTIVE, approvalStatus: ApprovalStatus.APPROVED },
    { status: ContractStatus.ACTIVE, approvalStatus: ApprovalStatus.APPROVED },
    { status: ContractStatus.EXPIRED, approvalStatus: ApprovalStatus.APPROVED },
    { status: ContractStatus.TERMINATED, approvalStatus: ApprovalStatus.APPROVED },
    { status: ContractStatus.RENEWED, approvalStatus: ApprovalStatus.APPROVED },
  ];
  
  const now = new Date();

  for (let i = 1; i <= 30; i++) {
    const matrix = statusMatrix[i % statusMatrix.length];
    const status = matrix.status;
    let approvalStatus: ApprovalStatus = matrix.approvalStatus;
    
    // Calculate dates based on status
    let startDate = subDays(now, 100 + i);
    let endDate = addDays(startDate, 365); // 1 year
    
    if (status === ContractStatus.ACTIVE) {
      // Let's make some expiring soon
      if (i % 4 === 0) {
        endDate = addDays(now, 5); // Expiring in 5 days
      } else if (i % 5 === 0) {
        endDate = addDays(now, 12); // Expiring in 12 days
      } else {
        endDate = addDays(now, 150); // Far future
      }
    } else if (status === ContractStatus.EXPIRED) {
      endDate = subDays(now, 10);
    }

    const partner = partners[i % partners.length];

    const contract = await prisma.contract.create({
      data: {
        code: `HD-2026-${i.toString().padStart(4, '0')}`,
        title: `Hợp đồng số ${i} - ${partner.name}`,
        partnerId: partner.id,
        contractTypeId: types[i % types.length].id,
        partnerName: partner.name,
        partnerEmail: partner.email,
        ownerId: staff.id,
        value: (10 + (i * 2)) * 10000000, // 100M+
        startDate,
        endDate,
        signedDate: approvalStatus === ApprovalStatus.APPROVED ? startDate : null,
        status: status as any,
        approvalStatus: approvalStatus as any,
        createdAt: startDate,
        submittedForApprovalAt: approvalStatus === ApprovalStatus.PENDING ? subDays(now, 4) : null, // 4 days ago -> urgent!
      }
    });

    // 5. Audit Log
    await prisma.auditLog.create({
      data: {
        userId: staff.id,
        contractId: contract.id,
        action: "CONTRACT_CREATED",
        entityType: "CONTRACT",
        entityId: contract.id,
        createdAt: startDate,
      }
    });

    if (approvalStatus === ApprovalStatus.APPROVED) {
      await prisma.auditLog.create({
        data: {
          userId: admin.id,
          contractId: contract.id,
          action: "CONTRACT_APPROVED",
          entityType: "CONTRACT",
          entityId: contract.id,
          createdAt: addDays(startDate, 2),
        }
      });
    }

    // 6. Reminder Milestones
    if (status === ContractStatus.ACTIVE && contract.endDate > now) {
      const offsets = [7, 15, 30];
      for (const offset of offsets) {
        const reminderDate = subDays(contract.endDate, offset);
        
        // Only create pending reminders for future
        if (reminderDate > now) {
          await prisma.reminderJob.create({
            data: {
              contractId: contract.id,
              reminderThresholdDays: offset,
              scheduledAt: reminderDate,
              recipientEmail: staff.email,
              type: "EXPIRING_SOON",
              status: "PENDING"
            }
          });
        }
      }
    }

    // Fake Failed Reminder to test Priority Section
    if (i === 1) {
      await prisma.reminderJob.create({
        data: {
          contractId: contract.id,
          reminderThresholdDays: 7,
          scheduledAt: subDays(now, 1),
          recipientEmail: staff.email,
          type: "EXPIRING_SOON",
          status: "FAILED",
          errorMessage: "SMTP Connection Timeout"
        }
      });
    }

    // Notification
    if (i % 3 === 0) {
      await prisma.notification.create({
        data: {
          userId: admin.id,
          type: NotificationType.SYSTEM,
          title: `Hệ thống vừa cập nhật hợp đồng ${contract.code}`,
          message: `Hợp đồng của đối tác ${partner.name} đã được thay đổi.`,
          isRead: false,
          createdAt: subDays(now, 1)
        }
      });
    }
  }

  console.log("30 Contracts Seed completed successfully.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
