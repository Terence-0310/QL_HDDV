"use client";

import Link from "next/link";
import useSWR from "swr";
import { apiRequest } from "@/lib/api-client";
import { StatCard } from "@/components/shared/stat-card";
import { EmptyState, ErrorState, LoadingState } from "@/components/shared/ui-states";
import { PageGuard } from "@/components/shared/page-guard";
import { useCurrentUser } from "@/hooks/use-current-user";
import { 
  FileText, CheckCircle, Clock, XCircle, 
  Users, Bell, AlertTriangle, Archive, ArrowRight 
} from "lucide-react";

type Summary = {
  totalContracts: number;
  activeContracts: number;
  expiringSoonContracts: number;
  expiredContracts: number;
  pendingApprovalContracts: number;
  approvedContracts: number;
  rejectedContracts: number;
  autoRenewContracts: number;
  totalUsers: number;
  activeUsers: number;
  pendingReminderJobs: number;
  failedReminderJobs: number;
  deadLetterReminderJobs: number;
};

export function ReportsOverviewView() {
  const { user, loading: userLoading } = useCurrentUser();
  const { data: summary, error: fetchError, isLoading: loading } = useSWR<Summary>(
    "/api/admin/reports/summary",
    apiRequest
  );
  const error = fetchError ? (fetchError instanceof Error ? fetchError.message : "Failed to fetch summary") : null;

  return (
    <PageGuard user={user} loading={userLoading} permission="report.view">
      <div className="page-stack">
        <section className="page-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: "1rem" }}>
          <div>
            <h1>Báo cáo Tổng quan</h1>
            <p>Tổng hợp nhanh số liệu hệ thống và theo dõi các chỉ số quan trọng.</p>
          </div>
          <Link 
            href="/admin/reports/contracts" 
            style={{ display: "flex", alignItems: "center", gap: "0.5rem", background: "var(--primary)", color: "white", padding: "0.6rem 1.2rem", borderRadius: "8px", fontWeight: 600, fontSize: "0.95rem", textDecoration: "none", transition: "all 0.2s ease" }}
            className="hover-opacity"
          >
            Chi tiết Hợp đồng
            <ArrowRight size={18} />
          </Link>
        </section>

      {loading && <LoadingState message="Đang tải số liệu báo cáo..." />}
      {error && <ErrorState message={error} />}
      {!loading && !error && !summary && <EmptyState message="Chưa có dữ liệu báo cáo." />}
      
      {summary && (
        <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
          {/* Contracts Section */}
          <section>
            <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--text)", marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <FileText size={20} color="var(--primary)" />
              Chỉ số Hợp đồng
            </h3>
            <div style={{ display: "grid", gap: "1rem", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))" }}>
              <StatCard href="/admin/reports/contracts" label="Tổng hợp đồng" value={summary.totalContracts} tone="info" icon={<FileText size={24} />} />
              <StatCard href="/admin/reports/contracts?status=ACTIVE" label="Đang hiệu lực" value={summary.activeContracts} tone="success" icon={<CheckCircle size={24} />} />
              <StatCard href="/admin/reports/contracts?approvalStatus=PENDING" label="Chờ phê duyệt" value={summary.pendingApprovalContracts} tone="warning" icon={<Clock size={24} />} />
              <StatCard href="/admin/reports/contracts?approvalStatus=APPROVED" label="Đã phê duyệt" value={summary.approvedContracts} tone="success" icon={<CheckCircle size={24} />} />
              <StatCard href="/admin/reports/contracts?approvalStatus=REJECTED" label="Đã từ chối" value={summary.rejectedContracts} tone="danger" icon={<XCircle size={24} />} />
            </div>
          </section>

          {/* Users & Reminders Section */}
          <section>
            <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--text)", marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.5rem", borderTop: "1px solid var(--border)", paddingTop: "1.5rem" }}>
              <Bell size={20} color="var(--primary)" />
              Hệ thống & Tự động hoá
            </h3>
            <div style={{ display: "grid", gap: "1rem", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))" }}>
              <StatCard href="/admin/users" label="Tổng người dùng" value={summary.totalUsers} tone="info" icon={<Users size={24} />} />
              <StatCard href="/admin/reminders" label="Nhắc hạn chờ gửi" value={summary.pendingReminderJobs} tone="default" icon={<Bell size={24} />} />
              <StatCard href="/admin/reminders" label="Nhắc hạn lỗi" value={summary.failedReminderJobs} tone="warning" icon={<AlertTriangle size={24} />} />
              <StatCard href="/admin/reminders" label="Nhắc hạn huỷ (Dead Letter)" value={summary.deadLetterReminderJobs} tone="danger" icon={<Archive size={24} />} />
            </div>
          </section>
        </div>
      )}
      </div>
    </PageGuard>
  );
}
