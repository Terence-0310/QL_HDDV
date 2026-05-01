"use client";

import { useState } from "react";
import useSWR from "swr";
import { apiRequest, apiRequestEnvelope } from "@/lib/api-client";
import { DataTable } from "@/components/shared/data-table";
import { ApprovalStatusBadge, StatusBadge } from "@/components/shared/status-badges";
import { EmptyState, ErrorState, LoadingState } from "@/components/shared/ui-states";
import { PageGuard } from "@/components/shared/page-guard";
import { useCurrentUser } from "@/hooks/use-current-user";
import { PaginationControls } from "@/components/shared/pagination-controls";
import { useDebouncedValue } from "@/hooks/use-debounced-value";

type ApprovalItem = {
  id: string;
  code: string;
  title: string;
  partnerName: string;
  submittedForApprovalAt: string | null;
  status: "DRAFT" | "ACTIVE" | "EXPIRING_SOON" | "EXPIRED" | "TERMINATED";
  approvalStatus: "NOT_SUBMITTED" | "PENDING" | "APPROVED" | "REJECTED";
  owner: { name: string; email: string };
};

export function ApprovalsView() {
  const { user, loading: userLoading } = useCurrentUser();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search, 400);
  const [rejectReason, setRejectReason] = useState("");
  const [error, setError] = useState<string | null>(null);

  const qs = new URLSearchParams({ page: String(page), pageSize: "10" });
  if (debouncedSearch.trim()) qs.set("search", debouncedSearch.trim());

  const {
    data: response,
    error: fetchError,
    isLoading: loading,
    mutate: fetchData,
  } = useSWR<{ data: ApprovalItem[]; meta?: any }>(
    `/api/admin/approvals?${qs.toString()}`,
    apiRequestEnvelope
  );

  const items = response?.data ?? [];
  const totalPages = Number(response?.meta?.totalPages ?? 1);
  const displayError = error || (fetchError ? (fetchError instanceof Error ? fetchError.message : "Failed to fetch approvals") : null);

  async function approve(id: string) {
    try {
      await apiRequest(`/api/contracts/${id}/approve`, { method: "POST" });
      await fetchData();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to approve contract");
    }
  }

  async function reject(id: string) {
    const reason = rejectReason.trim() || (window.prompt("Provide rejection reason") ?? "").trim();
    if (!reason) {
      setError("Rejection reason is required");
      return;
    }
    try {
      await apiRequest(`/api/contracts/${id}/reject`, {
        method: "POST",
        body: JSON.stringify({ reason }),
      });
      setRejectReason("");
      await fetchData();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to reject contract");
    }
  }

  async function viewHistory(id: string) {
    try {
      const history = await apiRequestEnvelope<
        Array<{ action: string; step: number; reason: string | null; createdAt: string; actor: { name: string; email: string; role: string } }>
      >(`/api/contracts/${id}/approval-history`);
      const text = history.data
        .map((item) => `[Bước ${item.step}] ${new Date(item.createdAt).toLocaleString()} - ${item.action} - ${item.actor.name} (${item.actor.role})${item.reason ? ` - Lý do: ${item.reason}` : ""}`)
        .join("\n");
      window.alert(text || "Chưa có lịch sử phê duyệt");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to fetch approval history");
    }
  }



  return (
    <PageGuard user={user} loading={userLoading} permission="contract.approve">
      <div className="page-stack">
      <section className="page-header">
        <h1>Hàng đợi phê duyệt</h1>
        <p>Kiểm tra hợp đồng chờ duyệt và thực hiện phê duyệt/từ chối có lý do.</p>
      </section>
      <div className="card toolbar" style={{ padding: "0.8rem" }}>
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Tìm theo mã, tên hoặc đối tác" />
        <input value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} placeholder="Lý do từ chối nhanh (tuỳ chọn)" />
        <button className="btn-primary" onClick={() => void fetchData()}>Tìm kiếm</button>
      </div>
      {loading && <LoadingState />}
      {displayError && <ErrorState message={displayError} />}
      {!loading && !displayError && items.length === 0 && <EmptyState message="Không có hợp đồng chờ phê duyệt." />}
      {!loading && !displayError && items.length > 0 && (
        <>
          <DataTable
            columns={[
              { key: "code", header: "Mã", render: (row) => row.code },
              { key: "title", header: "Tên hợp đồng", render: (row) => row.title },
              { key: "owner", header: "Người gửi", render: (row) => row.owner.name },
              { key: "partner", header: "Đối tác", render: (row) => row.partnerName },
              {
                key: "submitted",
                header: "Ngày gửi",
                render: (row) => (row.submittedForApprovalAt ? new Date(row.submittedForApprovalAt).toLocaleString() : "-"),
              },
              { key: "status", header: "Trạng thái", render: (row) => <StatusBadge status={row.status} /> },
              { key: "approvalStatus", header: "Phê duyệt", render: (row) => <ApprovalStatusBadge status={row.approvalStatus} /> },
              {
                key: "actions",
                header: "Thao tác",
                render: (row) => (
                  <div style={{ display: "flex", gap: "0.5rem" }}>
                    <button className="btn-primary" onClick={() => void approve(row.id)}>Phê duyệt</button>
                    <button className="btn-danger" onClick={() => void reject(row.id)}>Từ chối</button>
                    <button onClick={() => void viewHistory(row.id)}>Lịch sử</button>
                  </div>
                ),
              },
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
