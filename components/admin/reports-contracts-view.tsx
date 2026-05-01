"use client";

import { useMemo, useState } from "react";
import useSWR from "swr";
import dynamic from "next/dynamic";
import { apiRequestEnvelope, apiRequest } from "@/lib/api-client";
import { DataTable } from "@/components/shared/data-table";
import { ApprovalStatusBadge, StatusBadge } from "@/components/shared/status-badges";
import { EmptyState, ErrorState, LoadingState } from "@/components/shared/ui-states";
import { PageGuard } from "@/components/shared/page-guard";
import { useCurrentUser } from "@/hooks/use-current-user";
import { PaginationControls } from "@/components/shared/pagination-controls";
import { hasClientPermission } from "@/lib/permissions-client";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { Download } from "lucide-react";

const ReportsContractsCharts = dynamic(
  () => import("@/components/admin/reports-contracts-charts"),
  { ssr: false, loading: () => <div style={{ height: "300px", display: "flex", alignItems: "center", justifyContent: "center" }}>Đang tải biểu đồ...</div> }
);

type ReportContract = {
  id: string;
  code: string;
  title: string;
  partnerName: string;
  owner: { name: string };
  status: "DRAFT" | "ACTIVE" | "EXPIRING_SOON" | "EXPIRED" | "TERMINATED" | "RENEWED";
  approvalStatus: "NOT_SUBMITTED" | "PENDING" | "APPROVED" | "REJECTED";
  startDate: string;
  endDate: string;
  value: number;
  autoRenew: boolean;
};

type Summary = {
  totalContracts: number;
  activeContracts: number;
  expiringSoonContracts: number;
  expiredContracts: number;
  pendingApprovalContracts: number;
  approvedContracts: number;
  rejectedContracts: number;
  autoRenewContracts: number;
};

export function ReportsContractsView() {
  const { user, loading: userLoading } = useCurrentUser();
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search, 400);
  const [status, setStatus] = useState("");
  const [approvalStatus, setApprovalStatus] = useState("");
  const [exporting, setExporting] = useState(false);

  const queryString = useMemo(() => {
    const qs = new URLSearchParams();
    qs.set("page", String(page));
    qs.set("pageSize", "10");
    if (debouncedSearch.trim()) qs.set("search", debouncedSearch.trim());
    if (status) qs.set("status", status);
    if (approvalStatus) qs.set("approvalStatus", approvalStatus);
    return qs.toString();
  }, [approvalStatus, debouncedSearch, page, status]);

  const {
    data: response,
    error: fetchError,
    isLoading: loading,
  } = useSWR<{ data: ReportContract[]; meta?: any }>(
    `/api/admin/reports/contracts?${queryString}`,
    apiRequestEnvelope
  );

  const { data: summary } = useSWR<Summary>(
    "/api/admin/reports/summary",
    apiRequest
  );

  const items = response?.data ?? [];
  const totalPages = Number(response?.meta?.totalPages ?? 1);
  const displayError = error || (fetchError ? (fetchError instanceof Error ? fetchError.message : "Failed to fetch report") : null);

  async function exportCsv() {
    setExporting(true);
    try {
      const createResponse = await apiRequestEnvelope<{ id: string; status: string }>(
        `/api/admin/reports/contracts/export-jobs?${queryString}`,
        { method: "POST" },
      );

      const jobId = createResponse.data.id;
      let downloadUrl: string | null = null;
      for (let index = 0; index < 30; index += 1) {
        await new Promise((resolve) => setTimeout(resolve, 500));
        const statusResponse = await apiRequestEnvelope<{ status: string; downloadUrl: string | null; error?: string }>(
          `/api/admin/reports/contracts/export-jobs/${jobId}`,
        );
        if (statusResponse.data.status === "FAILED") throw new Error(statusResponse.data.error ?? "Export failed");
        if (statusResponse.data.status === "SUCCESS") {
          downloadUrl = statusResponse.data.downloadUrl;
          break;
        }
      }

      if (!downloadUrl) throw new Error("Export timeout, vui lòng thử lại");

      window.location.href = downloadUrl;
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to export contracts report");
    } finally {
      setExporting(false);
    }
  }

  return (
    <PageGuard user={user} loading={userLoading} permission="report.view">
      <div className="page-stack">
        <section className="page-header">
          <h1>Thống kê Hợp đồng</h1>
          <p>Phân tích trực quan trạng thái, tiến độ phê duyệt và xuất báo cáo dữ liệu.</p>
        </section>

        {summary && <ReportsContractsCharts summary={summary} />}

        <div className="card toolbar" style={{ padding: "0.8rem", display: "flex", flexWrap: "wrap", gap: "1rem" }}>
          <div style={{ display: "flex", gap: "0.5rem", flex: 1, minWidth: "300px" }}>
            <input style={{ flex: 1 }} value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Tìm kiếm mã, tên, đối tác..." />
            <select value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="">Tất cả trạng thái</option>
              <option value="DRAFT">DRAFT</option>
              <option value="ACTIVE">ACTIVE</option>
              <option value="EXPIRING_SOON">EXPIRING_SOON</option>
              <option value="EXPIRED">EXPIRED</option>
              <option value="TERMINATED">TERMINATED</option>
            </select>
            <select value={approvalStatus} onChange={(e) => setApprovalStatus(e.target.value)}>
              <option value="">Tất cả phê duyệt</option>
              <option value="NOT_SUBMITTED">NOT_SUBMITTED</option>
              <option value="PENDING">PENDING</option>
              <option value="APPROVED">APPROVED</option>
              <option value="REJECTED">REJECTED</option>
            </select>
          </div>
          {user && hasClientPermission(user.role, "report.export") && (
            <button className="btn-primary hover-opacity" disabled={exporting} onClick={() => void exportCsv()} style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <Download size={16} />
              {exporting ? "Đang xuất..." : "Xuất CSV Dữ liệu"}
            </button>
          )}
        </div>

        {loading && <LoadingState />}
        {displayError && <ErrorState message={displayError} />}
        {!loading && !displayError && items.length === 0 && <EmptyState message="Không có dữ liệu báo cáo phù hợp." />}
        
        {!loading && !displayError && items.length > 0 && (
          <div className="card" style={{ overflow: "hidden" }}>
            <DataTable
              columns={[
                { key: "code", header: "Mã", width: "8%", render: (row) => <span style={{ fontWeight: 600, color: "var(--primary)" }}>{row.code}</span> },
                { key: "title", header: "Tên hợp đồng", width: "18%", render: (row) => <div style={{ lineHeight: "1.4", fontWeight: 500, color: "var(--text)", wordBreak: "break-word" }}>{row.title.replace(/Hợp đồng Hợp đồng/g, "Hợp đồng")}</div> },
                { key: "partner", header: "Đối tác", width: "14%", render: (row) => <span style={{ color: "var(--text-muted)", wordBreak: "break-word" }}>{row.partnerName}</span> },
                { key: "owner", header: "Người phụ trách", width: "10%", render: (row) => <span style={{ color: "var(--text-muted)" }}>{row.owner.name}</span> },
                { key: "status", header: "Trạng thái", width: "10%", render: (row) => <StatusBadge status={row.status} /> },
                { key: "approvalStatus", header: "Phê duyệt", width: "10%", render: (row) => <ApprovalStatusBadge status={row.approvalStatus} /> },
                { key: "startDate", header: "Bắt đầu", width: "8%", render: (row) => <span style={{ color: "var(--text-muted)" }}>{new Date(row.startDate).toLocaleDateString('vi-VN')}</span> },
                { key: "endDate", header: "Kết thúc", width: "8%", render: (row) => <span style={{ color: "var(--text-muted)" }}>{new Date(row.endDate).toLocaleDateString('vi-VN')}</span> },
                { key: "value", header: "Giá trị", width: "8%", render: (row) => <span style={{ fontWeight: 600, color: "var(--text)" }}>{row.value.toLocaleString()}</span> },
                { key: "autoRenew", header: "Gia hạn", width: "6%", render: (row) => (row.autoRenew ? <span style={{ color: "var(--success)", fontWeight: 500 }}>Có</span> : <span style={{ color: "var(--text-muted)" }}>Không</span>) },
              ]}
              rows={items}
            />
            <div style={{ padding: "1rem", borderTop: "1px solid var(--border)" }}>
              <PaginationControls page={page} totalPages={totalPages} onChange={setPage} />
            </div>
          </div>
        )}
      </div>
    </PageGuard>
  );
}
