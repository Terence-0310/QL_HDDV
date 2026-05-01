"use client";

import { useCallback, useMemo } from "react";
import useSWR from "swr";
import Link from "next/link";
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
  totalUsers: number;
  activeUsers: number;
  pendingReminderJobs: number;
  failedReminderJobs: number;
  deadLetterReminderJobs: number;
};

import { FileText, CheckCircle, AlertTriangle, XCircle, Users, UserCheck, Activity, OctagonX, Clock, OctagonAlert } from "lucide-react";

export function AdminDashboardView() {
  const { user, loading: userLoading } = useCurrentUser();
  const { data: summary, error: fetchError, isLoading: loading, mutate, isValidating: refreshing } = useSWR<Summary>(
    "/api/admin/reports/summary",
    apiRequest,
    { refreshInterval: 60_000 }
  );

  const error = fetchError ? (fetchError instanceof Error ? fetchError.message : "Failed to fetch summary") : null;
  
  const fetchSummary = useCallback(async (options?: { silent?: boolean }) => {
    await mutate();
  }, [mutate]);

  const healthTone = useMemo(() => {
    if (!summary) return "default" as const;
    if (summary.expiredContracts > 0 || summary.deadLetterReminderJobs > 0) return "danger" as const;
    if (summary.expiringSoonContracts > 0 || summary.pendingApprovalContracts > 0 || summary.failedReminderJobs > 0) return "warning" as const;
    return "success" as const;
  }, [summary]);

  return (
    <PageGuard user={user} loading={userLoading} permission="admin.dashboard.view">
      <div className="page-stack">
        <section className="page-header dashboard-hero">
          <div>
            <h1>Bảng điều khiển quản trị</h1>
            <p>Theo dõi tổng quan hợp đồng, người dùng và trạng thái phê duyệt theo thời gian thực.</p>
          </div>
          <div className="dashboard-hero-actions">
            <button className="btn-primary" onClick={() => void fetchSummary({ silent: true })} disabled={refreshing}>
              {refreshing ? "Đang làm mới..." : "Làm mới số liệu"}
            </button>
            <Link className="btn" href="/admin/reports/contracts">
              Mở báo cáo chi tiết
            </Link>
          </div>
        </section>

        {loading && !summary && <LoadingState message="Đang tải dữ liệu tổng quan..." />}
        {error && <ErrorState message={error} />}
        {!loading && !error && !summary && <EmptyState message="Chưa có dữ liệu tổng quan." />}
        {summary && (
          <>
            <div className="dashboard-highlight card">
              <div>
                <p className="dashboard-highlight-title">Mức độ ưu tiên xử lý hôm nay</p>
                <p className="dashboard-highlight-value">
                  {summary.deadLetterReminderJobs > 0
                    ? `${summary.deadLetterReminderJobs} lỗi gửi nhắc hạn nghiêm trọng`
                    : summary.expiredContracts > 0
                      ? `${summary.expiredContracts} hợp đồng đã hết hạn`
                      : summary.expiringSoonContracts > 0
                        ? `${summary.expiringSoonContracts} hợp đồng sắp hết hạn`
                        : "Không có vấn đề khẩn cấp"}
                </p>
              </div>
              <span className={`dashboard-priority dashboard-priority-${healthTone}`}>
                {healthTone === "danger" ? "Khẩn cấp" : healthTone === "warning" ? "Cần theo dõi" : "Ổn định"}
              </span>
            </div>

            <div className="dashboard-grid">
              <StatCard icon={<FileText size={22} />} label="Tổng hợp đồng" value={summary.totalContracts} hint="Toàn bộ trong hệ thống" tone="info" />
              <StatCard icon={<CheckCircle size={22} />} label="Hợp đồng đang hiệu lực" value={summary.activeContracts} tone="success" hint="Đang vận hành bình thường" />
              <StatCard icon={<AlertTriangle size={22} />} label="Sắp hết hạn" value={summary.expiringSoonContracts} tone="warning" hint="Cần nhắc gia hạn sớm" />
              <StatCard icon={<XCircle size={22} />} label="Đã hết hạn" value={summary.expiredContracts} tone="danger" hint="Cần xử lý ngay" />
              
              <StatCard icon={<Clock size={22} />} label="Chờ phê duyệt" value={summary.pendingApprovalContracts} tone="warning" hint="Đang chờ quyết định" />
              <StatCard icon={<Users size={22} />} label="Tổng người dùng" value={summary.totalUsers} hint="Tất cả tài khoản đã tạo" tone="info" />
              <StatCard icon={<UserCheck size={22} />} label="Người dùng hoạt động" value={summary.activeUsers} tone="success" hint="Có thể đăng nhập hệ thống" />
              
              <StatCard icon={<Activity size={22} />} label="Nhắc hạn chờ gửi" value={summary.pendingReminderJobs} hint="Sắp được xử lý" tone="info" />
              <StatCard icon={<OctagonAlert size={22} />} label="Nhắc hạn lỗi (Retry)" value={summary.failedReminderJobs} tone={summary.failedReminderJobs > 0 ? "warning" : "success"} hint="Đang thử lại" />
              <StatCard icon={<OctagonX size={22} />} label="Nhắc hạn huỷ (Dead)" value={summary.deadLetterReminderJobs} tone={summary.deadLetterReminderJobs > 0 ? "danger" : "success"} hint="Lỗi gửi email" />
            </div>
          </>
        )}
      </div>
    </PageGuard>
  );
}
