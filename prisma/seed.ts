import { PrismaClient, UserRole, UserStatus, PartnerType, ContractStatus, NotificationType } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  // 1. Users
  const accounts = [
    {
      name: "System Admin",
      username: "admin_user",
      email: "admin@example.com",
      password: "Admin@12345",
      role: UserRole.ADMIN,
      status: UserStatus.ACTIVE,
      phone: "0901234567"
    },
    {
      name: "System Employee",
      username: "employee_user",
      email: "staff@example.com",
      password: "Staff@12345",
      role: UserRole.STAFF,
      status: UserStatus.ACTIVE,
      phone: "0901234568"
    }
  ] as const;

  const users = [];
  for (const account of accounts) {
    const passwordHash = await bcrypt.hash(account.password, 10);
    const user = await prisma.user.upsert({
      where: { email: account.email },
      update: {
        name: account.name,
        username: account.username,
        role: account.role,
        passwordHash,
        status: account.status,
        phone: account.phone,
      },
      create: {
        name: account.name,
        username: account.username,
        email: account.email,
        role: account.role,
        passwordHash,
        status: account.status,
        phone: account.phone,
      },
    });
    users.push(user);
  }

  const staffUser = users.find(u => u.email === "staff@example.com")!;

  // 2. Partners (3 partners)
  const partners = [];
  for (let i = 1; i <= 3; i++) {
    const partner = await prisma.partner.create({
      data: {
        name: `Công ty Đối tác ${i}`,
        partnerType: i === 1 ? PartnerType.CUSTOMER : PartnerType.SUPPLIER,
        taxCode: `031234567${i}`,
        email: `contact${i}@partner.com`,
        phone: `090999999${i}`,
        address: `123 Đường Số ${i}, TP.HCM`,
        representative: `Ông Nguyễn Văn ${i}`
      }
    });
    partners.push(partner);
  }

  // 3. Contract Types (3 types)
  const types = [];
  const typeNames = ["Hợp đồng Cung cấp Dịch vụ", "Hợp đồng Mua bán", "Hợp đồng Hợp tác Kinh doanh"];
  for (const name of typeNames) {
    const type = await prisma.contractType.create({
      data: {
        name: name,
        description: `Mô tả cho ${name}`
      }
    });
    types.push(type);
  }

  // 4. Contracts (5 contracts)
  for (let i = 1; i <= 5; i++) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - i * 10);
    const endDate = new Date(startDate);
    endDate.setFullYear(endDate.getFullYear() + 1);

    const contract = await prisma.contract.create({
      data: {
        code: `HD-2026-${i.toString().padStart(4, '0')}`,
        title: `Hợp đồng số ${i}`,
        partnerId: partners[i % 3].id,
        contractTypeId: types[i % 3].id,
        partnerName: partners[i % 3].name,
        partnerEmail: partners[i % 3].email,
        ownerId: staffUser.id,
        value: 10000000 * i,
        startDate,
        endDate,
        signedDate: startDate,
        status: i === 1 ? ContractStatus.EXPIRED : i === 2 ? ContractStatus.EXPIRING_SOON : ContractStatus.ACTIVE,
        description: "Hợp đồng mẫu sinh tự động",
      }
    });

    // 5. Contract Files
    await prisma.contractFile.create({
      data: {
        contractId: contract.id,
        fileName: `BanGiao_${contract.code}.pdf`,
        filePath: `https://example.com/files/${contract.code}.pdf`,
        fileType: "application/pdf",
        fileSize: 1024500,
        description: "Bản sao lưu có chữ ký"
      }
    });

    // 6. Reminder Milestones (7/15/30 days)
    const offsets = [7, 15, 30];
    for (const offset of offsets) {
      const reminderDate = new Date(endDate);
      reminderDate.setDate(reminderDate.getDate() - offset);

      const milestone = await prisma.reminderJob.create({
        data: {
          contractId: contract.id,
          reminderThresholdDays: offset,
          scheduledAt: reminderDate,
          recipientEmail: staffUser.email,
          type: "EXPIRING_SOON",
          status: "PENDING"
        }
      });

      // 7. Notification Sample (Only for the 30-day if close)
      if (i === 2 && offset === 30) {
        await prisma.notification.create({
          data: {
            userId: staffUser.id,
            relatedEntityType: "REMINDER_JOB",
            relatedEntityId: milestone.id,
            type: NotificationType.REMINDER,
            title: `Sắp đến hạn nhắc: ${contract.code}`,
            message: `Hợp đồng ${contract.title} sắp đến hạn nhắc ${offset} ngày.`,
          }
        });
      }
    }
  }

  console.log("ERD Seed completed successfully.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
