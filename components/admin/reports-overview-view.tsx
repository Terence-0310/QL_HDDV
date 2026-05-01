"use client";

import Link from "next/link";
import useSWR from "swr";
import { apiRequest } from "@/lib/api-client";
import { StatCard } from "@/components/shared/stat-card";
import { EmptyState, ErrorState, LoadingState } from "@/components/shared/ui-states";
import { PageGuard } from "@/components/shared/page-guard";
import { useCurrentUser } from "@/hooks/use-current-user";

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
        <section className="page-header">
          <h1>Báo cáo quản trị</h1>
          <p>Tổng hợp nhanh số liệu hệ thống và truy cập báo cáo chi tiết theo bộ lọc.</p>
        </section>
      <p>
        <Link href="/admin/reports/contracts" className="link-inline">Mở báo cáo hợp đồng chi tiết</Link>
      </p>
      {loading && <LoadingState message="Đang tải số liệu báo cáo..." />}
      {error && <ErrorState message={error} />}
      {!loading && !error && !summary && <EmptyState message="Chưa có dữ liệu báo cáo." />}
      {summary && (
        <div style={{ display: "grid", gap: "0.85rem", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
          <StatCard label="Tổng hợp đồng" value={summary.totalContracts} />
          <StatCard label="Đang hiệu lực" value={summary.activeContracts} />
          <StatCard label="Chờ phê duyệt" value={summary.pendingApprovalContracts} />
          <StatCard label="Đã phê duyệt" value={summary.approvedContracts} />
          <StatCard label="Đã từ chối" value={summary.rejectedContracts} />
          <StatCard label="Tổng người dùng" value={summary.totalUsers} />
          <StatCard label="Nhắc hạn chờ gửi" value={summary.pendingReminderJobs} />
          <StatCard label="Nhắc hạn lỗi" value={summary.failedReminderJobs} />
          <StatCard label="Nhắc hạn huỷ (Dead Letter)" value={summary.deadLetterReminderJobs} />
        </div>
      )}
      </div>
    </PageGuard>
  );
}
