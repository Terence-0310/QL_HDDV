import { ContractStatus, UserRole } from "@prisma/client";
import { addDaysUtc, endOfUtcDay, startOfUtcDay } from "@/lib/date";
import { prisma } from "@/lib/prisma";
import { getCacheValue, setCacheValue } from "@/lib/simple-cache";
import type { AuthUser } from "@/types/auth";
import type { ContractStats } from "@/types/dashboard";

function parseReminderOffsets(offsets: string | null | undefined, fallbackDays: number): number[] {
  const parsed = (offsets ?? "")
    .split(",")
    .map((value) => Number(value.trim()))
    .filter((value) => Number.isInteger(value) && value > 0);
  if (parsed.length > 0) {
    return Array.from(new Set(parsed)).sort((a, b) => b - a);
  }
  return [fallbackDays];
}

function scopedWhere(authUser: AuthUser) {
  if (authUser.role === UserRole.ADMIN) {
    return {};
  }

  return {
    ownerId: authUser.id,
  };
}

export async function getContractStats(authUser: AuthUser): Promise<ContractStats> {
  const cacheKey = `dashboard:stats:${authUser.id}:${authUser.role}`;
  const cached = getCacheValue<ContractStats>(cacheKey);
  if (cached) {
    return cached;
  }

  const now = new Date();
  const todayStart = startOfUtcDay(now);
  const todayEnd = endOfUtcDay(now);
  const globalSoonBoundary = addDaysUtc(todayEnd, 7);
  const baseWhere = scopedWhere(authUser);

  const [totalContracts, activeContracts, draftContracts, terminatedContracts, expiredContracts, reminderDueTodayContracts] =
    await Promise.all([
      prisma.contract.count({ where: baseWhere }),
      prisma.contract.count({ where: { ...baseWhere, status: ContractStatus.ACTIVE } }),
      prisma.contract.count({ where: { ...baseWhere, status: ContractStatus.DRAFT } }),
      prisma.contract.count({ where: { ...baseWhere, status: ContractStatus.TERMINATED } }),
      prisma.contract.count({ where: { ...baseWhere, endDate: { lt: todayStart } } }),
      prisma.contract.count({
        where: {
          ...baseWhere,
          endDate: {
            gte: todayStart,
            lte: globalSoonBoundary,
          },
        },
      }),
    ]);

  const windowCandidates = await prisma.contract.findMany({
    where: {
      ...baseWhere,
      endDate: {
        gte: todayStart,
        lte: addDaysUtc(todayEnd, 365),
      },
    },
    select: {
      endDate: true,
      renewalReminderDays: true,
      reminderOffsets: true,
    },
  });

  const expiringSoonContracts = windowCandidates.filter((contract) => {
    const thresholds = parseReminderOffsets(contract.reminderOffsets, contract.renewalReminderDays ?? 7);
    return thresholds.some((days) => contract.endDate <= addDaysUtc(todayEnd, days));
  }).length;

  const result = {
    totalContracts,
    activeContracts,
    expiringSoonContracts,
    expiredContracts,
    draftContracts,
    terminatedContracts,
    reminderDueTodayContracts,
  };
  setCacheValue(cacheKey, result, 15_000);
  return result;
}
