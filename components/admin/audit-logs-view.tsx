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
                  width: "15%",
                  render: (row) => <span style={{ color: "var(--text-muted)", fontSize: "0.9em" }}>{new Date(row.createdAt).toLocaleString('vi-VN')}</span>,
                },
                { 
                  key: "action", 
                  header: "Hành động", 
                  width: "15%",
                  render: (row) => <span style={{ fontWeight: 600, color: "var(--primary)" }}>{row.action}</span> 
                },
                { 
                  key: "entityType", 
                  header: "Đối tượng", 
                  width: "10%",
                  render: (row) => <span style={{ color: "var(--text)" }}>{row.entityType}</span> 
                },
                { 
                  key: "entityId", 
                  header: "ID", 
                  width: "10%",
                  render: (row) => <span style={{ fontFamily: "monospace", fontSize: "0.85em", color: "var(--text-muted)" }}>{row.entityId}</span> 
                },
                { 
                  key: "user", 
                  header: "Người thực hiện", 
                  width: "20%",
                  render: (row) => row.user ? <span style={{ fontWeight: 500 }}>{row.user.name} <span style={{ color: "var(--text-muted)", fontWeight: "normal" }}>({row.user.email})</span></span> : <span style={{ color: "var(--text-muted)", fontStyle: "italic" }}>Hệ thống (Tự động)</span>
                },
                {
                  key: "metadata",
                  header: "Dữ liệu (JSON)",
                  width: "30%",
                  render: (row) => row.metadata ? (
                    <details>
                      <summary style={{ cursor: "pointer", fontSize: "0.85em", color: "var(--primary)", fontWeight: 500 }}>Xem chi tiết</summary>
                      <pre style={{ fontSize: "0.8em", maxWidth: "250px", overflowX: "auto", background: "rgba(0,0,0,0.03)", padding: "0.5rem", borderRadius: "4px", border: "1px solid var(--border)", marginTop: "0.5rem", color: "var(--text-muted)" }}>
                        {row.metadata}
                      </pre>
                    </details>
                  ) : <span style={{ color: "var(--text-muted)" }}>-</span>,
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
