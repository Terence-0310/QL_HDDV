"use client";

import { useCallback, useMemo } from "react";
import useSWR from "swr";
import Link from "next/link";
import dynamic from "next/dynamic";
import { apiRequest } from "@/lib/api-client";
import { PageGuard } from "@/components/shared/page-guard";
import { useCurrentUser } from "@/hooks/use-current-user";
import { mapDashboardData } from "@/lib/dashboard/dashboard-mapper";
import { DashboardStatCard } from "@/components/dashboard/DashboardStatCard";
import { DashboardChartCard } from "@/components/dashboard/DashboardChartCard";
import { ExpiringContractsTable } from "@/components/dashboard/ExpiringContractsTable";
import { RecentActivities } from "@/components/dashboard/RecentActivities";
import { PartnerValueDistribution } from "@/components/dashboard/PartnerValueDistribution";
import { QuickActions } from "@/components/dashboard/QuickActions";
import { FileText, CheckCircle, Clock, AlertTriangle, DollarSign, Calendar } from "lucide-react";

// Tối ưu hóa tải biểu đồ (Lazy Load) để giảm bundle size ban đầu
const DashboardCharts = dynamic(() => import("@/components/dashboard/DashboardCharts"), {
  ssr: false,
  loading: () => <div style={{ minHeight: "300px", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius-md)" }}>Đang tải biểu đồ...</div>
});

export function AdminDashboardView() {
  const { user, loading: userLoading } = useCurrentUser();
  const { data: summary, error: fetchError, isLoading: loading, mutate, isValidating: refreshing } = useSWR(
    "/api/admin/reports/summary",
    apiRequest,
    { refreshInterval: 60_000 }
  );

  const error = fetchError ? (fetchError instanceof Error ? fetchError.message : "Failed to fetch summary") : null;
  
  const fetchSummary = useCallback(async (options?: { silent?: boolean }) => {
    await mutate();
  }, [mutate]);

  const dashboardData = useMemo(() => mapDashboardData(summary), [summary]);

  return (
    <PageGuard user={user} loading={userLoading} permission="admin.dashboard.view">
      <div style={{ paddingBottom: "2rem" }}>
        {/* HERO SECTION */}
        <section style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "2rem", flexWrap: "wrap", gap: "1rem" }}>
          <div>
            <h1 style={{ margin: "0 0 0.5rem 0", fontSize: "1.6rem", color: "var(--text)" }}>Xin chào, {user?.name || "System Admin"}! 👋</h1>
            <p style={{ margin: 0, color: "var(--text-muted)", fontSize: "0.95rem" }}>Dưới đây là tổng quan về tình hình hợp đồng trong hệ thống</p>
          </div>
          <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", background: "var(--surface)", border: "1px solid var(--border)", padding: "0.5rem 1rem", borderRadius: "var(--radius-sm)", fontSize: "0.9rem", color: "var(--text-muted)" }}>
              <Calendar size={16} />
              01/05/2024 - 31/05/2024
            </div>
            <Link href="/admin/reports" style={{ background: "#4A90E2", color: "white", padding: "0.5rem 1rem", borderRadius: "var(--radius-sm)", fontSize: "0.9rem", fontWeight: 600, border: "none", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "0.4rem" }}>
              Xuất báo cáo
            </Link>
          </div>
        </section>

        {/* STAT CARDS */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1.2rem", marginBottom: "2rem" }}>
          <DashboardStatCard icon={<FileText size={24} />} label="Tổng hợp đồng" value={dashboardData.stats.totalContracts.value} change={dashboardData.stats.totalContracts.change} hint="So với tháng trước" />
          <DashboardStatCard icon={<CheckCircle size={24} />} label="Hợp đồng đang hiệu lực" value={dashboardData.stats.activeContracts.value} change={dashboardData.stats.activeContracts.change} hint="So với tháng trước" />
          <DashboardStatCard icon={<Clock size={24} />} label="Hợp đồng sắp hết hạn" value={dashboardData.stats.expiringSoon.value} change={dashboardData.stats.expiringSoon.change} hint="Trong 30 ngày tới" trendMode="negative-is-good" />
          <DashboardStatCard icon={<AlertTriangle size={24} />} label="Hợp đồng đã hết hạn" value={dashboardData.stats.expiredContracts.value} change={dashboardData.stats.expiredContracts.change} hint="Cần xử lý ngay" trendMode="negative-is-good" />
          <DashboardStatCard icon={<DollarSign size={24} />} label="Tổng giá trị hợp đồng" value={`${dashboardData.stats.totalValue.value} Tỷ`} change={dashboardData.stats.totalValue.change} hint="Tổng giá trị" />
        </div>

        {/* CHARTS */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "1.2rem", marginBottom: "2rem" }}>
          <DashboardCharts 
            trend={dashboardData.charts.trend} 
            distribution={dashboardData.charts.distribution} 
            valueByMonth={dashboardData.charts.valueByMonth} 
            totalContracts={dashboardData.stats.totalContracts.value as number}
          />
        </div>

        {/* BOTTOM TABLES */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "1.2rem" }}>
          <ExpiringContractsTable data={dashboardData.tables.expiringContracts} />
          <RecentActivities data={dashboardData.tables.recentActivities} />
          <PartnerValueDistribution data={dashboardData.tables.partnerValues} />
        </div>

        {/* QUICK ACTIONS */}
        <QuickActions />
      </div>
    </PageGuard>
  );
}
