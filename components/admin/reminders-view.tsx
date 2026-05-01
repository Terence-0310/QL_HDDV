"use client";

import { useState } from "react";
import useSWR from "swr";
import { apiRequest, apiRequestEnvelope } from "@/lib/api-client";
import { DataTable } from "@/components/shared/data-table";
import { EmptyState, ErrorState, LoadingState } from "@/components/shared/ui-states";
import { PageGuard } from "@/components/shared/page-guard";
import { useCurrentUser } from "@/hooks/use-current-user";
import { PaginationControls } from "@/components/shared/pagination-controls";
import { Search, RefreshCw, XCircle, Filter } from "lucide-react";

export function RemindersView() {
  const { user, loading: userLoading } = useCurrentUser();
  const [activeTab, setActiveTab] = useState<"jobs" | "logs">("jobs");
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);

  const qs = new URLSearchParams({ page: String(page), pageSize: "10" });
  if (searchTerm) qs.set("search", searchTerm);
  if (statusFilter) qs.set("status", statusFilter);
  
  const endpoint = activeTab === "jobs" 
    ? `/api/admin/reminders/jobs?${qs.toString()}` 
    : `/api/admin/reminders/logs?${qs.toString()}`;

  const {
    data: response,
    error: fetchError,
    isLoading: loading,
    mutate
  } = useSWR<{ data: any[]; meta?: any }>(endpoint, apiRequestEnvelope);

  const items = response?.data ?? [];
  const totalPages = Number(response?.meta?.totalPages ?? 1);
  const displayError = fetchError ? (fetchError instanceof Error ? fetchError.message : "Failed to fetch data") : null;

  async function updateJobStatus(id: string, newStatus: string) {
    if (isUpdating) return;
    setIsUpdating(true);
    try {
      await apiRequest(`/api/admin/reminders/jobs/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ status: newStatus })
      });
      await mutate();
    } catch (e) {
      alert("Cập nhật thất bại. Vui lòng thử lại.");
    } finally {
      setIsUpdating(false);
    }
  }

  const jobColumns = [
    { key: "scheduledAt", header: "Lịch dự kiến", width: "15%", render: (row: any) => new Date(row.scheduledAt).toLocaleString('vi-VN') },
    { key: "contract", header: "Hợp đồng", width: "25%", render: (row: any) => <div style={{ fontWeight: 500, color: "var(--text)", wordBreak: "break-word" }}>{row.contract.title.replace(/Hợp đồng Hợp đồng/g, "Hợp đồng")} <span style={{color: "var(--primary)", fontSize: "0.85em"}}>({row.contract.code})</span></div> },
    { key: "recipientEmail", header: "Người nhận", width: "15%", render: (row: any) => row.recipientEmail },
    { key: "type", header: "Loại nhắc", width: "15%", render: (row: any) => <span style={{ fontWeight: 600, color: "var(--text-muted)", fontSize: "0.85rem" }}>{row.type}</span> },
    { key: "status", header: "Trạng thái", width: "10%", render: (row: any) => {
        const color = row.status === 'SUCCESS' ? 'var(--success)' : row.status === 'FAILED' ? 'var(--danger)' : row.status === 'CANCELLED' ? 'var(--text-muted)' : 'var(--warning)';
        return <span style={{ color, fontWeight: 600, fontSize: "0.85rem", padding: "0.25rem 0.5rem", borderRadius: "12px", background: `${color}15` }}>{row.status}</span>;
      } 
    },
    { key: "attempts", header: "Thử lại", width: "8%", render: (row: any) => <span style={{ fontSize: "0.9rem" }}>{row.attempts}/{row.maxAttempts}</span> },
    { key: "actions", header: "Thao tác", width: "12%", render: (row: any) => (
        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
          {(row.status === 'FAILED' || row.status === 'CANCELLED') && (
            <button 
              onClick={() => updateJobStatus(row.id, 'PENDING')}
              disabled={isUpdating}
              title="Thử lại (Đưa về chờ xử lý)"
              style={{ background: "var(--primary-soft)", color: "var(--primary)", border: "none", padding: "0.4rem", borderRadius: "6px", cursor: "pointer", display: "flex", alignItems: "center" }}
            >
              <RefreshCw size={14} />
            </button>
          )}
          {row.status === 'PENDING' && (
            <button 
              onClick={() => updateJobStatus(row.id, 'CANCELLED')}
              disabled={isUpdating}
              title="Huỷ lịch nhắc"
              style={{ background: "var(--danger-soft)", color: "var(--danger)", border: "none", padding: "0.4rem", borderRadius: "6px", cursor: "pointer", display: "flex", alignItems: "center" }}
            >
              <XCircle size={14} />
            </button>
          )}
        </div>
      )
    }
  ];

  const logColumns = [
    { key: "createdAt", header: "Thời gian tạo", width: "15%", render: (row: any) => new Date(row.createdAt).toLocaleString('vi-VN') },
    { key: "contract", header: "Hợp đồng", width: "25%", render: (row: any) => <div style={{ fontWeight: 500, color: "var(--text)", wordBreak: "break-word" }}>{row.contract.title.replace(/Hợp đồng Hợp đồng/g, "Hợp đồng")} <span style={{color: "var(--primary)", fontSize: "0.85em"}}>({row.contract.code})</span></div> },
    { key: "sentTo", header: "Gửi đến", width: "20%", render: (row: any) => row.sentTo },
    { key: "reminderType", header: "Loại nhắc", width: "15%", render: (row: any) => <span style={{ fontWeight: 600, color: "var(--text-muted)", fontSize: "0.85rem" }}>{row.reminderType}</span> },
    { key: "status", header: "Trạng thái", width: "10%", render: (row: any) => {
        const color = row.status === 'SENT' ? 'var(--success)' : row.status === 'FAILED' ? 'var(--danger)' : 'var(--warning)';
        return <span style={{ color, fontWeight: 600, fontSize: "0.85rem", padding: "0.25rem 0.5rem", borderRadius: "12px", background: `${color}15` }}>{row.status}</span>;
      } 
    },
    { key: "message", header: "Phản hồi", width: "15%", render: (row: any) => <span style={{ fontSize: "0.85em", color: "var(--text-muted)", display: "inline-block", maxWidth: "200px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }} title={row.message}>{row.message || "-"}</span> },
  ];

  return (
    <PageGuard user={user} loading={userLoading} permission="admin.dashboard.view">
      <div className="page-stack">
        <section className="page-header" style={{ marginBottom: "1.5rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <h1>Quản lý Nhắc hạn</h1>
            <p>Theo dõi lịch gửi thông báo và lịch sử nhắc hạn hợp đồng.</p>
          </div>
          <button 
            onClick={() => mutate()} 
            style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.6rem 1rem", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "8px", cursor: "pointer", fontWeight: 600 }}
          >
            <RefreshCw size={16} /> Làm mới
          </button>
        </section>

        <div style={{ background: "var(--surface)", padding: "1.25rem", borderRadius: "12px", border: "1px solid var(--border)", marginBottom: "1.5rem", display: "flex", flexWrap: "wrap", gap: "1rem", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", gap: "0.5rem", borderBottom: "none", alignItems: "center" }}>
            {[
              { label: "Lịch nhắc sắp tới (Jobs)", value: "jobs" }, 
              { label: "Lịch sử đã gửi (Logs)", value: "logs" }
            ].map(tab => (
              <button 
                key={tab.value}
                onClick={() => { setActiveTab(tab.value as any); setPage(1); setStatusFilter(""); }}
                style={{ 
                  padding: "0.5rem 1rem", 
                  background: activeTab === tab.value ? "var(--primary)" : "transparent", 
                  border: "none", 
                  borderRadius: "8px",
                  color: activeTab === tab.value ? "white" : "var(--text-muted)",
                  fontWeight: 600,
                  cursor: "pointer",
                  fontSize: "0.95rem",
                  transition: "all 0.2s"
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div style={{ display: "flex", gap: "1rem", flex: 1, justifyContent: "flex-end", minWidth: "300px" }}>
            <div style={{ position: "relative", width: "250px" }}>
              <Search size={16} style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
              <input 
                type="text" 
                placeholder="Tìm mã HĐ, email..." 
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
                style={{ width: "100%", padding: "0.5rem 1rem 0.5rem 2.2rem", borderRadius: "8px", border: "1px solid var(--border)", outline: "none", fontSize: "0.9rem" }}
              />
            </div>
            
            <div style={{ position: "relative" }}>
              <select 
                value={statusFilter}
                onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                style={{ appearance: "none", padding: "0.5rem 2rem 0.5rem 1rem", borderRadius: "8px", border: "1px solid var(--border)", outline: "none", fontSize: "0.9rem", background: "white", cursor: "pointer", color: statusFilter ? "var(--primary)" : "var(--text)" }}
              >
                <option value="">Tất cả trạng thái</option>
                {activeTab === "jobs" ? (
                  <>
                    <option value="PENDING">Đang chờ (Pending)</option>
                    <option value="FAILED">Thất bại (Failed)</option>
                    <option value="SUCCESS">Thành công (Success)</option>
                    <option value="CANCELLED">Đã Huỷ (Cancelled)</option>
                  </>
                ) : (
                  <>
                    <option value="PENDING">Đang gửi (Pending)</option>
                    <option value="SENT">Đã gửi (Sent)</option>
                    <option value="FAILED">Thất bại (Failed)</option>
                  </>
                )}
              </select>
              <Filter size={14} style={{ position: "absolute", right: "10px", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)", pointerEvents: "none" }} />
            </div>
          </div>
        </div>

        {loading && <LoadingState />}
        {displayError && <ErrorState message={displayError} />}
        {!loading && !displayError && items.length === 0 && <EmptyState message="Không tìm thấy dữ liệu nào phù hợp." />}
        
        {!loading && !displayError && items.length > 0 && (
          <div style={{ background: "var(--surface)", borderRadius: "12px", border: "1px solid var(--border)", overflow: "hidden" }}>
            <DataTable
              columns={activeTab === "jobs" ? jobColumns : logColumns}
              rows={items}
            />
            <div style={{ padding: "1rem", borderTop: "1px solid var(--border)", background: "var(--bg)" }}>
              <PaginationControls page={page} totalPages={totalPages} onChange={setPage} />
            </div>
          </div>
        )}
      </div>
    </PageGuard>
  );
}
