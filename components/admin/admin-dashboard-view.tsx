"use client";

import { useCallback, useState } from "react";
import useSWR from "swr";
import dynamic from "next/dynamic";
import { apiRequest } from "@/lib/api-client";
import { PageGuard } from "@/components/shared/page-guard";
import { useCurrentUser } from "@/hooks/use-current-user";
import { DashboardStatCard } from "@/components/dashboard/DashboardStatCard";
import { ExpiringContractsTable } from "@/components/dashboard/ExpiringContractsTable";
import { RecentActivities } from "@/components/dashboard/RecentActivities";
import { PartnerValueDistribution } from "@/components/dashboard/PartnerValueDistribution";
import { QuickActions } from "@/components/dashboard/QuickActions";
import { FileText, CheckCircle, Clock, AlertTriangle, DollarSign, Calendar, RefreshCw, Download } from "lucide-react";
import { format, subDays, startOfYear } from "date-fns";

const DashboardCharts = dynamic(() => import("@/components/dashboard/DashboardCharts"), {
  ssr: false,
  loading: () => <div style={{ minHeight: "300px", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius-md)" }}>Đang tải biểu đồ...</div>
});

export function AdminDashboardView() {
  const { user, loading: userLoading } = useCurrentUser();
  
  const [filter, setFilter] = useState<"7d" | "30d" | "90d" | "year" | "custom">("30d");
  const [customRange, setCustomRange] = useState<{from: string, to: string}>({ from: "", to: "" });

  const getQueryString = useCallback(() => {
    let from = "";
    let to = format(new Date(), "yyyy-MM-dd");
    
    if (filter === "7d") from = format(subDays(new Date(), 7), "yyyy-MM-dd");
    else if (filter === "30d") from = format(subDays(new Date(), 30), "yyyy-MM-dd");
    else if (filter === "90d") from = format(subDays(new Date(), 90), "yyyy-MM-dd");
    else if (filter === "year") from = format(startOfYear(new Date()), "yyyy-MM-dd");
    else if (filter === "custom") {
      from = customRange.from;
      to = customRange.to;
    }

    if (!from || !to) return "";
    return `?from=${from}&to=${to}`;
  }, [filter, customRange]);

  const qs = getQueryString();

  const { data: summary, mutate: mutateSummary, isValidating: refreshingSummary } = useSWR<any>(`/api/dashboard/summary${qs}`, apiRequest, { refreshInterval: 60_000 });
  const { data: charts, mutate: mutateCharts, isValidating: refreshingCharts } = useSWR<any>(`/api/dashboard/charts${qs}`, apiRequest, { refreshInterval: 60_000 });
  const { data: expiring, mutate: mutateExpiring, isValidating: refreshingExpiring } = useSWR<any>(`/api/dashboard/expiring-contracts?days=30&limit=5`, apiRequest, { refreshInterval: 60_000 });
  const { data: activities, mutate: mutateActivities, isValidating: refreshingActivities } = useSWR<any>(`/api/dashboard/recent-activities?limit=8`, apiRequest, { refreshInterval: 60_000 });

  const isRefreshing = refreshingSummary || refreshingCharts || refreshingExpiring || refreshingActivities;
  const isLoading = !summary && !charts;

  const handleRefresh = async () => {
    await Promise.all([mutateSummary(), mutateCharts(), mutateExpiring(), mutateActivities()]);
  };

  const handleExport = () => {
    window.open(`/api/dashboard/export${qs}`, "_blank");
  };

  return (
    <PageGuard user={user} loading={userLoading} permission="admin.dashboard.view">
      <div style={{ paddingBottom: "2rem" }}>
        {/* HERO SECTION */}
        <section style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "2rem", flexWrap: "wrap", gap: "1rem" }}>
          <div>
            <h1 style={{ margin: "0 0 0.5rem 0", fontSize: "1.6rem", color: "var(--text)" }}>Xin chào, {user?.name || "System Admin"}! 👋</h1>
            <p style={{ margin: 0, color: "var(--text-muted)", fontSize: "0.95rem" }}>Dưới đây là tổng quan về tình hình hợp đồng trong hệ thống</p>
          </div>
          <div style={{ display: "flex", gap: "1rem", alignItems: "center", flexWrap: "wrap" }}>
            
            {/* Filter Dropdown */}
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", background: "var(--surface)", border: "1px solid var(--border)", padding: "0.4rem 0.8rem", borderRadius: "var(--radius-sm)" }}>
              <Calendar size={16} color="var(--text-muted)" />
              <select value={filter} onChange={(e) => setFilter(e.target.value as any)} style={{ border: "none", outline: "none", background: "transparent", fontSize: "0.9rem", color: "var(--text)", cursor: "pointer" }}>
                <option value="7d">7 ngày qua</option>
                <option value="30d">30 ngày qua</option>
                <option value="90d">90 ngày qua</option>
                <option value="year">Năm nay</option>
                <option value="custom">Tùy chọn</option>
              </select>
            </div>

            {filter === "custom" && (
              <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                <input type="date" value={customRange.from} onChange={e => setCustomRange(p => ({...p, from: e.target.value}))} style={{ padding: "0.4rem", borderRadius: "var(--radius-sm)", border: "1px solid var(--border)", fontSize: "0.85rem" }} />
                <span>-</span>
                <input type="date" value={customRange.to} onChange={e => setCustomRange(p => ({...p, to: e.target.value}))} style={{ padding: "0.4rem", borderRadius: "var(--radius-sm)", border: "1px solid var(--border)", fontSize: "0.85rem" }} />
              </div>
            )}

            <button onClick={handleRefresh} disabled={isRefreshing} style={{ display: "flex", alignItems: "center", gap: "0.4rem", background: "var(--surface)", border: "1px solid var(--border)", padding: "0.5rem 0.8rem", borderRadius: "var(--radius-sm)", cursor: "pointer", color: "var(--text)" }}>
              <RefreshCw size={16} style={{ animation: isRefreshing ? "spin 1s linear infinite" : "none" }} />
              <span style={{ fontSize: "0.9rem", fontWeight: 500 }}>Làm mới</span>
            </button>

            <button onClick={handleExport} style={{ background: "var(--primary)", color: "white", padding: "0.5rem 1rem", borderRadius: "var(--radius-sm)", fontSize: "0.9rem", fontWeight: 600, border: "none", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "0.4rem" }}>
              <Download size={16} /> Xuất báo cáo
            </button>
          </div>
        </section>

        {isLoading ? (
          <div style={{ padding: "3rem", textAlign: "center", color: "var(--text-muted)" }}>Đang tải dữ liệu tổng quan...</div>
        ) : (
          <>
            {/* STAT CARDS */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1.2rem", marginBottom: "2rem" }}>
              <DashboardStatCard icon={<FileText size={24} />} label="Tổng hợp đồng" value={summary?.totalContracts || 0} change={summary?.growthRate || 0} hint="Trong kỳ" />
              <DashboardStatCard icon={<CheckCircle size={24} />} label="Đang hiệu lực" value={summary?.activeContracts || 0} change={2} hint="So với kỳ trước" />
              <DashboardStatCard icon={<Clock size={24} />} label="Sắp hết hạn" value={summary?.expiringSoonContracts || 0} change={0} hint="Cần xử lý" trendMode="negative-is-good" />
              <DashboardStatCard icon={<AlertTriangle size={24} />} label="Chờ duyệt" value={summary?.pendingContracts || 0} change={0} hint="Đang đợi duyệt" trendMode="negative-is-good" />
              <DashboardStatCard icon={<DollarSign size={24} />} label="Tổng giá trị" value={`${((summary?.totalContractValue || 0) / 1000000000).toFixed(2)} Tỷ`} change={5} hint="Tổng giá trị" />
            </div>

            {/* PRIORITY BLOCK */}
            {(summary?.expiredContracts > 0 || summary?.expiringSoonContracts > 0 || summary?.pendingContracts > 0 || summary?.failedReminders > 0) && (
              <div style={{ background: "var(--surface)", border: "1px solid var(--danger)", borderRadius: "var(--radius-md)", padding: "1.5rem", marginBottom: "2rem" }}>
                <h3 style={{ margin: "0 0 1rem 0", color: "var(--danger)", display: "flex", alignItems: "center", gap: "0.5rem" }}><AlertTriangle size={20} /> Ưu tiên xử lý hôm nay</h3>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem" }}>
                  {summary.expiredContracts > 0 && <div style={{ padding: "1rem", background: "#fef2f2", borderRadius: "8px", border: "1px solid #fca5a5", color: "#991b1b" }}><strong>{summary.expiredContracts}</strong> hợp đồng đã hết hạn. <a href="/admin/contracts?status=EXPIRED" style={{ textDecoration: "underline", color: "#b91c1c" }}>Xem ngay</a></div>}
                  {summary.expiringSoonContracts > 0 && <div style={{ padding: "1rem", background: "#fff7ed", borderRadius: "8px", border: "1px solid #fdba74", color: "#9a3412" }}><strong>{summary.expiringSoonContracts}</strong> hợp đồng sắp hết hạn (≤ 7 ngày). <a href="/admin/contracts?status=EXPIRING_SOON" style={{ textDecoration: "underline", color: "#c2410c" }}>Kiểm tra</a></div>}
                  {summary.urgentContracts > 0 && <div style={{ padding: "1rem", background: "#fef2f2", borderRadius: "8px", border: "1px solid #fca5a5", color: "#991b1b" }}><strong>{summary.urgentContracts}</strong> hợp đồng chờ duyệt quá 3 ngày! <a href="/admin/approvals" style={{ textDecoration: "underline", color: "#b91c1c" }}>Duyệt ngay</a></div>}
                  {summary.retryReminders > 0 && <div style={{ padding: "1rem", background: "#fff7ed", borderRadius: "8px", border: "1px solid #fdba74", color: "#9a3412" }}><strong>{summary.retryReminders}</strong> nhắc hạn bị lỗi cần retry. <a href="/admin/reminders" style={{ textDecoration: "underline", color: "#c2410c" }}>Kiểm tra</a></div>}
                </div>
              </div>
            )}

            {/* CHARTS */}
            {charts && (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "1.2rem", marginBottom: "2rem" }}>
                <DashboardCharts 
                  trend={charts.contractTrend} 
                  distribution={charts.statusDistribution} 
                  valueByMonth={charts.monthlyValue} 
                  totalContracts={summary?.totalContracts || 0}
                />
              </div>
            )}

            {/* BOTTOM TABLES */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "1.2rem" }}>
              <ExpiringContractsTable data={expiring || []} />
              <RecentActivities data={activities || []} />
              {charts && <PartnerValueDistribution data={charts.partnerValueDistribution} />}
            </div>
          </>
        )}

        {/* QUICK ACTIONS */}
        <QuickActions />

        <style dangerouslySetInnerHTML={{__html: `
          @keyframes spin { 100% { transform: rotate(360deg); } }
        `}} />
      </div>
    </PageGuard>
  );
}
