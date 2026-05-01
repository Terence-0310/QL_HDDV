import { PrismaClient } from "@prisma/client";
import { submitForApproval } from "../services/approval.service";

const prisma = new PrismaClient();

async function main() {
  const admin = await prisma.user.findFirst({ where: { role: "SUPER_ADMIN" } });
  if (!admin) throw new Error("No SUPER_ADMIN found");

  const contract = await prisma.contract.findFirst({ where: { approvalStatus: "NOT_SUBMITTED" } });
  if (!contract) throw new Error("No NOT_SUBMITTED contract found");

  try {
    const authUser = { id: admin.id, role: admin.role, email: admin.email };
    await submitForApproval(contract.id, authUser as any);
    console.log("Success");
  } catch (e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
}

main();
