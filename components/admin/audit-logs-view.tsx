"use client";

import { useState } from "react";
import useSWR from "swr";
import { apiRequestEnvelope } from "@/lib/api-client";
import { DataTable } from "@/components/shared/data-table";
import { EmptyState, ErrorState, LoadingState } from "@/components/shared/ui-states";
import { PageGuard } from "@/components/shared/page-guard";
import { useCurrentUser } from "@/hooks/use-current-user";
import { PaginationControls } from "@/components/shared/pagination-controls";
import { useDebouncedValue } from "@/hooks/use-debounced-value";

type AuditLogItem = {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  metadata: string | null;
  createdAt: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
  } | null;
};

export function AuditLogsView() {
  const { user, loading: userLoading } = useCurrentUser();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search, 400);

  const qs = new URLSearchParams({ page: String(page), pageSize: "20" });
  if (debouncedSearch.trim()) qs.set("search", debouncedSearch.trim());

  const {
    data: response,
    error: fetchError,
    isLoading: loading,
  } = useSWR<{ data: AuditLogItem[]; meta?: any }>(
    `/api/admin/audit-logs?${qs.toString()}`,
    apiRequestEnvelope
  );

  const items = response?.data ?? [];
  const totalPages = Number(response?.meta?.totalPages ?? 1);
  const displayError = fetchError ? (fetchError instanceof Error ? fetchError.message : "Failed to fetch audit logs") : null;

  return (
    <PageGuard user={user} loading={userLoading} permission="admin.dashboard.view">
      <div className="page-stack">
        <section className="page-header">
          <h1>Nhật ký hệ thống</h1>
          <p>Truy vết mọi hoạt động vận hành và thay đổi cấu hình trong hệ thống.</p>
        </section>

        <div className="card toolbar" style={{ padding: "0.8rem" }}>
          <input 
            value={search} 
            onChange={(e) => setSearch(e.target.value)} 
            placeholder="Tìm theo ID, Entity hoặc Email người dùng" 
            style={{ minWidth: "300px" }}
          />
        </div>

        {loading && <LoadingState />}
        {displayError && <ErrorState message={displayError} />}
        {!loading && !displayError && items.length === 0 && <EmptyState message="Không tìm thấy nhật ký hệ thống nào." />}
        
        {!loading && !displayError && items.length > 0 && (
          <>
            <DataTable
              columns={[
                {
                  key: "createdAt",
                  header: "Thời gian",
                  render: (row) => new Date(row.createdAt).toLocaleString(),
                },
                { 
                  key: "action", 
                  header: "Hành động", 
                  render: (row) => <span style={{ fontWeight: 600, color: "var(--color-primary-dark)" }}>{row.action}</span> 
                },
                { 
                  key: "entityType", 
                  header: "Đối tượng", 
                  render: (row) => row.entityType 
                },
                { 
                  key: "entityId", 
                  header: "ID", 
                  render: (row) => <span style={{ fontFamily: "monospace", fontSize: "0.85em" }}>{row.entityId}</span> 
                },
                { 
                  key: "user", 
                  header: "Người thực hiện", 
                  render: (row) => row.user ? `${row.user.name} (${row.user.email})` : "Hệ thống (Tự động)" 
                },
                {
                  key: "metadata",
                  header: "Dữ liệu (JSON)",
                  render: (row) => row.metadata ? (
                    <details>
                      <summary style={{ cursor: "pointer", fontSize: "0.9em", color: "var(--color-text-light)" }}>Xem chi tiết</summary>
                      <pre style={{ fontSize: "0.8em", maxWidth: "250px", overflowX: "auto", background: "var(--color-bg-alt)", padding: "0.5rem", borderRadius: "4px" }}>
                        {row.metadata}
                      </pre>
                    </details>
                  ) : "-",
                }
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
