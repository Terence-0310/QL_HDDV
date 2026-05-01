"use client";

import { useMemo, useState } from "react";
import useSWR from "swr";
import { apiRequestEnvelope } from "@/lib/api-client";
import { DataTable } from "@/components/shared/data-table";
import { ApprovalStatusBadge, StatusBadge } from "@/components/shared/status-badges";
import { EmptyState, ErrorState, LoadingState } from "@/components/shared/ui-states";
import { PageGuard } from "@/components/shared/page-guard";
import { useCurrentUser } from "@/hooks/use-current-user";
import { PaginationControls } from "@/components/shared/pagination-controls";
import { hasClientPermission } from "@/lib/permissions-client";
import { useDebouncedValue } from "@/hooks/use-debounced-value";

type ReportContract = {
  id: string;
  code: string;
  title: string;
  partnerName: string;
  owner: { name: string };
  status: "DRAFT" | "ACTIVE" | "EXPIRING_SOON" | "EXPIRED" | "TERMINATED";
  approvalStatus: "NOT_SUBMITTED" | "PENDING" | "APPROVED" | "REJECTED";
  startDate: string;
  endDate: string;
  value: number;
  autoRenew: boolean;
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
    const qs = new URLSearchParams({
      page: String(page),
      pageSize: "10",
    });
    if (debouncedSearch.trim()) {
      qs.set("search", debouncedSearch.trim());
    }
    if (status) {
      qs.set("status", status);
    }
    if (approvalStatus) {
      qs.set("approvalStatus", approvalStatus);
    }
    return qs.toString();
  }, [approvalStatus, debouncedSearch, page, status]);

  const {
    data: response,
    error: fetchError,
    isLoading: loading,
    mutate: fetchData,
  } = useSWR<{ data: ReportContract[]; meta?: any }>(
    `/api/admin/reports/contracts?${queryString}`,
    apiRequestEnvelope
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
        if (statusResponse.data.status === "FAILED") {
          throw new Error(statusResponse.data.error ?? "Export failed");
        }
        if (statusResponse.data.status === "SUCCESS") {
          downloadUrl = statusResponse.data.downloadUrl;
          break;
        }
      }

      if (!downloadUrl) {
        throw new Error("Export timeout, vui lòng thử lại");
      }

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
        <h1>Báo cáo hợp đồng</h1>
        <p>Phân tích dữ liệu hợp đồng theo bộ lọc và xuất báo cáo CSV.</p>
      </section>
      <div className="card toolbar" style={{ padding: "0.8rem" }}>
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Tìm kiếm" />
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
        <button className="btn-primary" onClick={() => void fetchData()}>Áp dụng</button>
        {user && hasClientPermission(user.role, "report.export") && (
          <button className="btn-primary" disabled={exporting} onClick={() => void exportCsv()}>
            {exporting ? "Đang xuất..." : "Xuất CSV"}
          </button>
        )}
      </div>
      {loading && <LoadingState />}
      {displayError && <ErrorState message={displayError} />}
      {!loading && !displayError && items.length === 0 && <EmptyState message="Không có dữ liệu báo cáo phù hợp." />}
      {!loading && !displayError && items.length > 0 && (
        <>
          <DataTable
            columns={[
              { key: "code", header: "Mã", render: (row) => row.code },
              { key: "title", header: "Tên hợp đồng", render: (row) => row.title },
              { key: "partner", header: "Đối tác", render: (row) => row.partnerName },
              { key: "owner", header: "Người phụ trách", render: (row) => row.owner.name },
              { key: "status", header: "Trạng thái", render: (row) => <StatusBadge status={row.status} /> },
              { key: "approvalStatus", header: "Phê duyệt", render: (row) => <ApprovalStatusBadge status={row.approvalStatus} /> },
              { key: "startDate", header: "Ngày bắt đầu", render: (row) => new Date(row.startDate).toLocaleDateString() },
              { key: "endDate", header: "Ngày kết thúc", render: (row) => new Date(row.endDate).toLocaleDateString() },
              { key: "value", header: "Giá trị", render: (row) => row.value.toLocaleString() },
              { key: "autoRenew", header: "Tự động gia hạn", render: (row) => (row.autoRenew ? "Có" : "Không") },
            ]}
            rows={items}
          />
          <PaginationControls page={page} totalPages={totalPages} onChange={setPage} />
        </>
      )}
      </div>
    </PageGuard>
  );
}
