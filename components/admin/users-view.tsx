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



export function UsersView() {
  const { user, loading: userLoading } = useCurrentUser();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search, 400);
  const [roleFilter, setRoleFilter] = useState<"" | "ADMIN" | "STAFF" | "USER">("");
  const [error, setError] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createForm, setCreateForm] = useState({ name: "", email: "", password: "", role: "USER" });

  const qs = new URLSearchParams({ page: String(page), pageSize: "10" });
  if (debouncedSearch.trim()) qs.set("search", debouncedSearch.trim());
  if (roleFilter) qs.set("role", roleFilter);

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
    try {
      await apiRequest(`/api/admin/users/${userId}`, {
        method: "PATCH",
        body: JSON.stringify(input),
      });
      await fetchData();
      setError(null);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed to update user";
      setError(msg);
      window.alert(`Lỗi: ${msg}`);
    }
  }

  async function deleteUser(userId: string) {
    if (!window.confirm("Bạn có chắc chắn muốn xóa tài khoản này không? Hành động này không thể hoàn tác.")) return;
    try {
      await apiRequest(`/api/admin/users/${userId}`, { method: "DELETE" });
      await fetchData();
      setError(null);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed to delete user";
      setError(msg);
      window.alert(`Lỗi: ${msg}`);
    }
  }

  async function handleCreateUser(e: React.FormEvent) {
    e.preventDefault();
    try {
      await apiRequest("/api/admin/users", {
        method: "POST",
        body: JSON.stringify(createForm),
      });
      await fetchData();
      setIsCreateModalOpen(false);
      setCreateForm({ name: "", email: "", password: "", role: "USER" });
      setError(null);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to create user";
      window.alert(`Lỗi: ${msg}`);
    }
  }


  return (
    <PageGuard user={user} loading={userLoading} permission="user.view">
      <div className="page-stack">
      <section className="page-header">
        <h1>Quản lý người dùng</h1>
        <p>Tra cứu, theo dõi trạng thái và cập nhật phân quyền tài khoản.</p>
      </section>

      <div style={{ display: "flex", gap: "1.5rem", marginBottom: "1rem", borderBottom: "1px solid var(--border)" }}>
        {[
          { label: "Tất cả", value: "" }, 
          { label: "Quản trị viên (Admin)", value: "ADMIN" }, 
          { label: "Nhân viên nội bộ", value: "STAFF" }, 
          { label: "Khách hàng (User)", value: "USER" }
        ].map(tab => (
          <button 
            key={tab.value}
            onClick={() => { setRoleFilter(tab.value as any); setPage(1); }}
            style={{ 
              padding: "0.75rem 0.5rem", 
              background: "none", 
              border: "none", 
              borderBottom: roleFilter === tab.value ? "2px solid var(--primary)" : "2px solid transparent",
              color: roleFilter === tab.value ? "var(--primary)" : "var(--text-muted)",
              fontWeight: roleFilter === tab.value ? 600 : 500,
              cursor: "pointer",
              fontSize: "0.95rem",
              transition: "all 0.2s"
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="card toolbar" style={{ padding: "0.8rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Tìm kiếm tên hoặc email" style={{ width: "250px" }} />
          <button className="btn-primary" onClick={() => void fetchData()}>Tìm kiếm</button>
        </div>
        {user && hasClientPermission(user.role, "user.manage") && (
          <button className="btn-primary" onClick={() => setIsCreateModalOpen(true)}>
            + Thêm người dùng
          </button>
        )}
      </div>
      {loading && <LoadingState />}
      {displayError && <ErrorState message={displayError} />}
      {!loading && !displayError && items.length === 0 && <EmptyState message="Không có người dùng phù hợp." />}
      {!loading && !displayError && items.length > 0 && (
        <>
          <DataTable
            columns={[
              { key: "name", header: "Tên", width: "25%", render: (row) => <span style={{ fontWeight: 600, color: "var(--text)" }}>{row.name}</span> },
              { key: "email", header: "Email", width: "25%", render: (row) => <span style={{ color: "var(--text-muted)" }}>{row.email}</span> },
              { 
                key: "role", 
                header: "Vai trò", 
                width: "20%", 
                render: (row) => user && hasClientPermission(user.role, "user.manage") && user.id !== row.id && row.role !== "SUPER_ADMIN" ? (
                  <select 
                    value={row.role} 
                    onChange={(e) => void updateUser(row.id, { role: e.target.value as UserRole })}
                    style={{ padding: "0.3rem 0.5rem", borderRadius: "6px", border: "1px solid var(--border)", fontSize: "0.85rem", background: "var(--surface)", fontWeight: 500, outline: "none", cursor: "pointer", color: "var(--text)" }}
                  >
                    {user.role === "SUPER_ADMIN" && <option value="ADMIN">Quản trị (Admin)</option>}
                    <option value="STAFF">Nhân viên (Staff)</option>
                    <option value="USER">Khách (User)</option>
                  </select>
                ) : (row.role === "SUPER_ADMIN" ? <span style={{ padding: "0.2rem 0.6rem", borderRadius: "12px", background: "var(--primary)", color: "white", fontSize: "0.75rem", fontWeight: 700 }}>SUPER ADMIN</span> : <RoleBadge role={row.role} />)
              },
              { 
                key: "status", 
                header: "Trạng thái", 
                width: "18%", 
                render: (row) => user && hasClientPermission(user.role, "user.manage") ? (
                  <select 
                    value={row.status} 
                    onChange={(e) => void updateUser(row.id, { status: e.target.value as UserStatus })}
                    style={{ padding: "0.3rem 0.5rem", borderRadius: "6px", border: "1px solid var(--border)", fontSize: "0.85rem", background: "var(--surface)", fontWeight: 600, outline: "none", cursor: "pointer", color: row.status === 'ACTIVE' ? 'var(--success)' : row.status === 'BLOCKED' ? 'var(--danger)' : 'var(--text-muted)' }}
                  >
                    <option value="ACTIVE" style={{ color: "var(--success)" }}>Hoạt động</option>
                    <option value="INACTIVE" style={{ color: "var(--text-muted)" }}>Tạm khóa</option>
                    <option value="BLOCKED" style={{ color: "var(--danger)" }}>Bị Cấm</option>
                  </select>
                ) : <StatusBadge status={row.status} /> 
              },
              {
                key: "actions",
                header: "Thao tác",
                width: "10%",
                render: (row) => user && hasClientPermission(user.role, "user.delete") && user.id !== row.id && row.role !== "SUPER_ADMIN" ? (
                  <button 
                    onClick={() => deleteUser(row.id)}
                    style={{ padding: "0.3rem 0.6rem", background: "var(--danger-soft)", color: "var(--danger)", border: "none", borderRadius: "6px", cursor: "pointer", fontSize: "0.85rem", fontWeight: 600 }}
                  >
                    Xóa
                  </button>
                ) : null
              },
              { key: "createdAt", header: "Ngày tạo", width: "12%", render: (row) => <span style={{ color: "var(--text-muted)" }}>{new Date(row.createdAt).toLocaleDateString('vi-VN')}</span> },
            ]}
            rows={items}
          />
          <PaginationControls page={page} totalPages={totalPages} onChange={setPage} />
        </>
      )}
      </div>

      {isCreateModalOpen && (
        <div className="modal-overlay" onClick={() => setIsCreateModalOpen(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: "450px" }}>
            <h2>Thêm người dùng mới</h2>
            <form onSubmit={handleCreateUser} style={{ display: "flex", flexDirection: "column", gap: "1rem", marginTop: "1rem" }}>
              <div>
                <label>Tên người dùng</label>
                <input required value={createForm.name} onChange={e => setCreateForm({...createForm, name: e.target.value})} placeholder="Nguyễn Văn A" style={{ width: "100%" }} />
              </div>
              <div>
                <label>Email</label>
                <input required type="email" value={createForm.email} onChange={e => setCreateForm({...createForm, email: e.target.value})} placeholder="nguyenvana@example.com" style={{ width: "100%" }} />
              </div>
              <div>
                <label>Mật khẩu (ít nhất 6 ký tự)</label>
                <input required type="password" minLength={6} value={createForm.password} onChange={e => setCreateForm({...createForm, password: e.target.value})} placeholder="******" style={{ width: "100%" }} />
              </div>
              <div>
                <label>Phân quyền</label>
                <select value={createForm.role} onChange={e => setCreateForm({...createForm, role: e.target.value})} style={{ width: "100%", padding: "0.5rem" }}>
                  <option value="USER">Khách (User)</option>
                  <option value="STAFF">Nhân viên (Staff)</option>
                  <option value="ADMIN">Quản trị viên (Admin)</option>
                  {user?.role === "SUPER_ADMIN" && <option value="SUPER_ADMIN">Quản trị cấp cao (Super Admin)</option>}
                </select>
              </div>
              <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.5rem", marginTop: "1rem" }}>
                <button type="button" className="btn-secondary" onClick={() => setIsCreateModalOpen(false)}>Hủy</button>
                <button type="submit" className="btn-primary">Tạo tài khoản</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </PageGuard>
  );
}
