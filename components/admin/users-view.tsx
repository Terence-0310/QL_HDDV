"use client";

import { useState } from "react";
import useSWR from "swr";
import type { UserRole, UserStatus } from "@prisma/client";
import { apiRequest, apiRequestEnvelope } from "@/lib/api-client";
import { DataTable } from "@/components/shared/data-table";
import { EmptyState, ErrorState, LoadingState } from "@/components/shared/ui-states";
import { PageGuard } from "@/components/shared/page-guard";
import { RoleBadge, StatusBadge } from "@/components/shared/status-badges";
import { useCurrentUser } from "@/hooks/use-current-user";
import { PaginationControls } from "@/components/shared/pagination-controls";
import { hasClientPermission } from "@/lib/permissions-client";
import { useDebouncedValue } from "@/hooks/use-debounced-value";

type UserItem = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  createdAt: string;
};

function nextRole(role: UserRole): UserRole {
  if (role === "ADMIN") return "STAFF";
  if (role === "STAFF") return "USER";
  return "ADMIN";
}

function nextStatus(status: UserStatus): UserStatus {
  if (status === "ACTIVE") return "INACTIVE";
  if (status === "INACTIVE") return "BLOCKED";
  return "ACTIVE";
}

export function UsersView() {
  const { user, loading: userLoading } = useCurrentUser();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search, 400);
  const [error, setError] = useState<string | null>(null);

  const qs = new URLSearchParams({ page: String(page), pageSize: "10" });
  if (debouncedSearch.trim()) qs.set("search", debouncedSearch.trim());

  const {
    data: response,
    error: fetchError,
    isLoading: loading,
    mutate: fetchData,
  } = useSWR<{ data: UserItem[]; meta?: any }>(
    `/api/admin/users?${qs.toString()}`,
    apiRequestEnvelope
  );

  const items = response?.data ?? [];
  const totalPages = Number(response?.meta?.totalPages ?? 1);
  const displayError = error || (fetchError ? (fetchError instanceof Error ? fetchError.message : "Failed to fetch users") : null);

  async function updateUser(userId: string, input: { role?: UserRole; status?: UserStatus }) {
    await apiRequest(`/api/admin/users/${userId}`, {
      method: "PATCH",
      body: JSON.stringify(input),
    });
    await fetchData();
  }



  return (
    <PageGuard user={user} loading={userLoading} permission="user.view">
      <div className="page-stack">
      <section className="page-header">
        <h1>Quản lý người dùng</h1>
        <p>Tra cứu, theo dõi trạng thái và cập nhật phân quyền tài khoản.</p>
      </section>
      <div className="card toolbar" style={{ padding: "0.8rem" }}>
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Tìm kiếm tên hoặc email" />
        <button className="btn-primary" onClick={() => void fetchData()}>Tìm kiếm</button>
      </div>
      {loading && <LoadingState />}
      {displayError && <ErrorState message={displayError} />}
      {!loading && !displayError && items.length === 0 && <EmptyState message="Không có người dùng phù hợp." />}
      {!loading && !displayError && items.length > 0 && (
        <>
          <DataTable
            columns={[
              { key: "name", header: "Tên", render: (row) => row.name },
              { key: "email", header: "Email", render: (row) => row.email },
              { key: "role", header: "Vai trò", render: (row) => <RoleBadge role={row.role} /> },
              { key: "status", header: "Trạng thái", render: (row) => <StatusBadge status={row.status} /> },
              { key: "createdAt", header: "Ngày tạo", render: (row) => new Date(row.createdAt).toLocaleDateString() },
              {
                key: "actions",
                header: "Thao tác",
                render: (row) =>
                  user && hasClientPermission(user.role, "user.manage") ? (
                    <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                      <button className="btn-primary" onClick={() => void updateUser(row.id, { role: nextRole(row.role) })}>
                        Đổi vai trò
                      </button>
                      <button
                        className="btn-danger"
                        onClick={() =>
                          void updateUser(row.id, {
                            status: nextStatus(row.status),
                          })
                        }
                      >
                        Đổi trạng thái
                      </button>
                    </div>
                  ) : (
                    "-"
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
