import { describe, it, expect, vi, beforeEach } from "vitest";
import { getDashboardSummary, getDashboardCharts, getDashboardExpiringContracts, getDashboardRecentActivities } from "../../services/dashboard.service";
import { prisma } from "../../lib/prisma";
import type { AuthUser } from "../../types/auth";

vi.mock("../../lib/prisma", () => ({
  prisma: {
    contract: {
      count: vi.fn(),
      aggregate: vi.fn(),
      findMany: vi.fn(),
    },
    user: {
      count: vi.fn(),
    },
    reminderJob: {
      count: vi.fn(),
    },
    auditLog: {
      findMany: vi.fn(),
    }
  }
}));

const mockUser: AuthUser = {
  id: "1",
  name: "Admin",
  email: "admin@test.com",
  role: "ADMIN",
  status: "ACTIVE"
};

describe("Dashboard Service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("getDashboardSummary returns correct stats for ADMIN", async () => {
    vi.mocked(prisma.contract.count).mockResolvedValue(10);
    vi.mocked(prisma.user.count).mockResolvedValue(5);
    vi.mocked(prisma.reminderJob.count).mockResolvedValue(2);
    vi.mocked(prisma.contract.aggregate).mockResolvedValue({ _sum: { value: 500000 } } as any);

    const summary = await getDashboardSummary(mockUser);
    
    expect(summary.totalContracts).toBe(10);
    expect(summary.totalUsers).toBe(5);
    expect(summary.pendingReminders).toBe(2);
    expect(summary.totalContractValue).toBe(500000);
  });

  it("getDashboardCharts formats data correctly", async () => {
    vi.mocked(prisma.contract.findMany).mockResolvedValue([
      { status: "ACTIVE", value: 100, createdAt: new Date("2026-05-01"), partnerName: "Partner A" },
      { status: "EXPIRED", value: 50, createdAt: new Date("2026-05-01"), partnerName: "Partner B" },
    ] as any);

    const charts = await getDashboardCharts(mockUser);
    
    expect(charts.statusDistribution.length).toBeGreaterThan(0);
    expect(charts.contractTrend.length).toBe(1);
    expect(charts.partnerValueDistribution.length).toBe(2);
  });

  it("getDashboardExpiringContracts calculates daysLeft", async () => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 5);
    
    vi.mocked(prisma.contract.findMany).mockResolvedValue([
      { id: "1", endDate: futureDate }
    ] as any);

    const expiring = await getDashboardExpiringContracts(mockUser);
    expect(expiring[0].daysLeft).toBeGreaterThanOrEqual(4);
    expect(expiring[0].daysLeft).toBeLessThanOrEqual(6);
  });

  it("getDashboardRecentActivities returns mapped logs", async () => {
    vi.mocked(prisma.auditLog.findMany).mockResolvedValue([
      { id: "log1", action: "TEST", entityType: "SYS", entityId: "1", createdAt: new Date(), user: { name: "Admin" } }
    ] as any);

    const acts = await getDashboardRecentActivities(mockUser);
    expect(acts[0].actorName).toBe("Admin");
  });
});
