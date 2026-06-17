import { ApprovalStatus, ContractStatus, UserStatus, ReminderJobStatus, type Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { startOfUtcDay, endOfUtcDay, addDaysUtc, parseQueryDate } from "@/lib/date";
import type { AuthUser } from "@/types/auth";
import { createAuditLog } from "@/services/audit.service";
import { buildCsv } from "@/lib/csv";

// Helper for filtering by Role
function getRoleWhere(authUser: AuthUser): Prisma.ContractWhereInput {
  if (authUser.role === "ADMIN" || authUser.role === "SUPER_ADMIN") return {};
  return { ownerId: authUser.id };
}

// Phase 1: Summary
export async function getDashboardSummary(authUser: AuthUser, from?: Date, to?: Date) {
  const roleWhere = getRoleWhere(authUser);
  const dateWhere: Prisma.ContractWhereInput = {};
  
  const now = new Date();
  const actualFrom = from ? startOfUtcDay(from) : addDaysUtc(startOfUtcDay(now), -365);
  const actualTo = to ? endOfUtcDay(to) : endOfUtcDay(now);

  dateWhere.createdAt = { gte: actualFrom, lte: actualTo };

  const baseWhere = { ...roleWhere, ...dateWhere };
  
  const todayStart = startOfUtcDay(now);
  const expiringSoonBoundary = addDaysUtc(endOfUtcDay(now), 7); // Default 7 days, or maybe 30?
  
  const durationMs = actualTo.getTime() - actualFrom.getTime();
  const previousFrom = new Date(actualFrom.getTime() - durationMs);
  const previousTo = new Date(actualTo.getTime() - durationMs);
  
  const previousBaseWhere = { ...roleWhere, createdAt: { gte: previousFrom, lte: previousTo } };

  const [
    totalContracts,
    activeContracts,
    pendingContracts,
    expiringSoonContracts,
    expiredContracts,
    totalUsers,
    activeUsers,
    pendingReminders,
    retryReminders,
    deadReminders,
    contractValueAgg,
    urgentContracts,
    previousTotalContracts
  ] = await Promise.all([
    prisma.contract.count({ where: baseWhere }),
    prisma.contract.count({ where: { ...baseWhere, status: ContractStatus.ACTIVE } }),
    prisma.contract.count({ where: { ...baseWhere, approvalStatus: ApprovalStatus.PENDING } }),
    prisma.contract.count({ where: { ...roleWhere, status: ContractStatus.EXPIRING_SOON } }),
    prisma.contract.count({ where: { ...roleWhere, endDate: { lt: todayStart }, status: { in: [ContractStatus.ACTIVE, ContractStatus.EXPIRING_SOON, ContractStatus.EXPIRED] } } }),
    (authUser.role === "ADMIN" || authUser.role === "SUPER_ADMIN") ? prisma.user.count() : Promise.resolve(0),
    (authUser.role === "ADMIN" || authUser.role === "SUPER_ADMIN") ? prisma.user.count({ where: { status: UserStatus.ACTIVE } }) : Promise.resolve(0),
    prisma.reminderJob.count({ where: { status: ReminderJobStatus.PENDING } }),
    prisma.reminderJob.count({ where: { status: ReminderJobStatus.FAILED } }),
    prisma.reminderJob.count({ where: { status: ReminderJobStatus.DEAD_LETTER } }),
    prisma.contract.aggregate({ _sum: { value: true }, where: baseWhere }),
    prisma.contract.count({ where: { ...roleWhere, approvalStatus: ApprovalStatus.PENDING, submittedForApprovalAt: { lt: addDaysUtc(now, -3) } } }),
    prisma.contract.count({ where: previousBaseWhere })
  ]);

  let growthRate = 0;
  if (previousTotalContracts === 0) {
    growthRate = totalContracts > 0 ? 100 : 0;
  } else {
    growthRate = ((totalContracts - previousTotalContracts) / previousTotalContracts) * 100;
  }

  return {
    totalContracts,
    activeContracts,
    pendingContracts,
    expiringSoonContracts,
    expiredContracts,
    totalUsers,
    activeUsers,
    pendingReminders,
    retryReminders,
    deadReminders,
    totalContractValue: contractValueAgg._sum.value || 0,
    growthRate: Number(growthRate.toFixed(1)),
    urgentContracts
  };
}

// Phase 2: Charts
export async function getDashboardCharts(authUser: AuthUser, from?: Date, to?: Date) {
  const roleWhere = getRoleWhere(authUser);
  const dateWhere: Prisma.ContractWhereInput = {};
  
  if (from && to) {
    dateWhere.createdAt = { gte: startOfUtcDay(from), lte: endOfUtcDay(to) };
  } else {
    const now = new Date();
    dateWhere.createdAt = { gte: addDaysUtc(startOfUtcDay(now), -365), lte: endOfUtcDay(now) };
  }

  const baseWhere = { ...roleWhere, ...dateWhere };
  
  const contracts = await prisma.contract.findMany({
    where: baseWhere,
    select: { status: true, value: true, createdAt: true, partnerName: true }
  });

  // Aggregate monthly values
  const monthlyMap = new Map<string, { new: number, expired: number, renewed: number, value: number }>();
  const partnerMap = new Map<string, number>();
  const statusMap = new Map<string, number>();
  let totalValue = 0;

  contracts.forEach(c => {
    const month = `${c.createdAt.getFullYear()}-${String(c.createdAt.getMonth() + 1).padStart(2, "0")}`;
    if (!monthlyMap.has(month)) {
      monthlyMap.set(month, { new: 0, expired: 0, renewed: 0, value: 0 });
    }
    const m = monthlyMap.get(month)!;
    m.new += 1;
    m.value += c.value;
    if (c.status === ContractStatus.EXPIRED) m.expired += 1;
    if (c.status === ContractStatus.RENEWED) m.renewed += 1;
    
    partnerMap.set(c.partnerName, (partnerMap.get(c.partnerName) || 0) + c.value);
    statusMap.set(c.status, (statusMap.get(c.status) || 0) + 1);
    totalValue += c.value;
  });

  const contractTrend = Array.from(monthlyMap.entries()).map(([month, data]) => ({ month, ...data })).sort((a, b) => a.month.localeCompare(b.month));
  const monthlyValue = contractTrend.map(t => ({ month: t.month, value: t.value / 1000000000 })); // Convert to Billions

  const totalStatus = contracts.length || 1;
  const statusLabels: Record<string, string> = {
    [ContractStatus.DRAFT]: "Nháp",
    [ContractStatus.ACTIVE]: "Đang hiệu lực",
    [ContractStatus.EXPIRING_SOON]: "Sắp hết hạn",
    [ContractStatus.EXPIRED]: "Đã hết hạn",
    [ContractStatus.TERMINATED]: "Chấm dứt",
    [ContractStatus.RENEWED]: "Đã gia hạn",
  };
  
  const statusColors: Record<string, string> = {
    [ContractStatus.DRAFT]: "#9CA3AF",
    [ContractStatus.ACTIVE]: "#10B981",
    [ContractStatus.EXPIRING_SOON]: "#F59E0B",
    [ContractStatus.EXPIRED]: "#EF4444",
    [ContractStatus.TERMINATED]: "#4B5563",
    [ContractStatus.RENEWED]: "#3B82F6",
  };

  const statusDistribution = Array.from(statusMap.entries()).map(([status, value]) => ({
    status,
    label: statusLabels[status] || status,
    value,
    percentage: (value / totalStatus) * 100,
    color: statusColors[status] || "#CBD5E1"
  }));

  const partnerValueDistribution = Array.from(partnerMap.entries())
    .map(([partnerName, value]) => ({
      partnerName,
      value,
      percentage: totalValue > 0 ? Number(((value / totalValue) * 100).toFixed(1)) : 0
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 5); // Top 5

  return {
    contractTrend,
    statusDistribution,
    monthlyValue,
    partnerValueDistribution
  };
}

// Phase 3: Expiring Contracts
export async function getDashboardExpiringContracts(authUser: AuthUser, days: number = 30, limit: number = 5) {
  const roleWhere = getRoleWhere(authUser);
  const now = new Date();
  const todayStart = startOfUtcDay(now);
  const expiringBoundary = addDaysUtc(endOfUtcDay(now), days);

  const contracts = await prisma.contract.findMany({
    where: {
      ...roleWhere,
      status: { in: [ContractStatus.ACTIVE, ContractStatus.EXPIRING_SOON] },
      endDate: { gte: todayStart, lte: expiringBoundary }
    },
    select: {
      id: true, code: true, title: true, partnerName: true, endDate: true, status: true, value: true
    },
    orderBy: { endDate: "asc" },
    take: limit
  });

  return contracts.map(c => {
    const msLeft = c.endDate.getTime() - now.getTime();
    const daysLeft = Math.ceil(msLeft / (1000 * 60 * 60 * 24));
    return { ...c, daysLeft };
  });
}

// Phase 4: Recent Activities
export async function getDashboardRecentActivities(authUser: AuthUser, limit: number = 8) {
  const roleWhere = (authUser.role === "ADMIN" || authUser.role === "SUPER_ADMIN") ? {} : { userId: authUser.id };
  
  const activities = await prisma.auditLog.findMany({
    where: roleWhere,
    orderBy: { createdAt: "desc" },
    take: limit,
    include: {
      user: { select: { name: true } }
    }
  });

  return activities.map(a => ({
    id: a.id,
    type: a.action,
    title: `Hành động: ${a.action}`,
    description: `Thao tác trên ${a.entityType} ID: ${a.entityId}`,
    actorName: a.user?.name || "Hệ thống",
    createdAt: a.createdAt,
    metadata: a.metadata
  }));
}
