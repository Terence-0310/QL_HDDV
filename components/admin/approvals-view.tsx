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
import { Search, Eye, CheckCircle, XCircle, History, X, FileText, AlertTriangle } from "lucide-react";
import Link from "next/link";

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

// Modal for Rejection
function RejectModal({ onConfirm, onClose, isSubmitting }: { onConfirm: (reason: string) => void, onClose: () => void, isSubmitting: boolean }) {
  const [reason, setReason] = useState("");
  return (
    <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.5)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }} onClick={onClose}>
      <div style={{ background: "var(--surface)", width: "100%", maxWidth: "500px", borderRadius: "12px", padding: "1.5rem", boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)", animation: "slideUp 0.2s ease" }} onClick={e => e.stopPropagation()}>
        <h3 style={{ margin: "0 0 1rem 0", display: "flex", alignItems: "center", gap: "0.5rem", color: "var(--danger)" }}>
          <XCircle size={20} /> Từ chối phê duyệt
        </h3>
        <p style={{ fontSize: "0.95rem", color: "var(--text-muted)", marginBottom: "1rem" }}>Vui lòng cung cấp lý do từ chối để người tạo hợp đồng có thể điều chỉnh.</p>
        <textarea 
          value={reason} 
          onChange={e => setReason(e.target.value)} 
          placeholder="Nhập lý do từ chối (bắt buộc)..."
          rows={4}
          style={{ width: "100%", padding: "0.75rem", borderRadius: "8px", border: "1px solid var(--border)", background: "var(--bg)", outline: "none", resize: "vertical", fontFamily: "inherit", marginBottom: "1.5rem" }}
          autoFocus
        />
        <div style={{ display: "flex", justifyContent: "flex-end", gap: "1rem" }}>
          <button onClick={onClose} style={{ padding: "0.5rem 1rem", background: "transparent", border: "1px solid var(--border)", borderRadius: "6px", cursor: "pointer", fontWeight: 500 }}>Huỷ</button>
          <button 
            onClick={() => onConfirm(reason)} 
            disabled={!reason.trim() || isSubmitting}
            style={{ padding: "0.5rem 1rem", background: "var(--danger)", color: "white", border: "none", borderRadius: "6px", cursor: (!reason.trim() || isSubmitting) ? "not-allowed" : "pointer", fontWeight: 600, opacity: (!reason.trim() || isSubmitting) ? 0.6 : 1 }}
          >
            {isSubmitting ? "Đang xử lý..." : "Xác nhận từ chối"}
          </button>
        </div>
      </div>
      <style dangerouslySetInnerHTML={{__html: `@keyframes slideUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }`}} />
    </div>
  );
}

// Modal for Approval
function ApproveModal({ onConfirm, onClose, isSubmitting, count }: { onConfirm: () => void, onClose: () => void, isSubmitting: boolean, count: number }) {
  return (
    <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.5)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }} onClick={onClose}>
      <div style={{ background: "var(--surface)", width: "100%", maxWidth: "450px", borderRadius: "12px", padding: "1.5rem", boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)", animation: "slideUp 0.2s ease" }} onClick={e => e.stopPropagation()}>
        <h3 style={{ margin: "0 0 1rem 0", display: "flex", alignItems: "center", gap: "0.5rem", color: "var(--success)" }}>
          <CheckCircle size={20} /> Xác nhận phê duyệt
        </h3>
        <p style={{ fontSize: "0.95rem", color: "var(--text-muted)", marginBottom: "1.5rem", lineHeight: 1.5 }}>
          Bạn có chắc chắn muốn phê duyệt {count > 1 ? <strong style={{ color: "var(--text)" }}>{count} hợp đồng đã chọn</strong> : <strong style={{ color: "var(--text)" }}>hợp đồng này</strong>} không?<br/><br/>
          Hợp đồng sau khi phê duyệt sẽ chuyển sang trạng thái có hiệu lực.
        </p>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: "1rem" }}>
          <button onClick={onClose} style={{ padding: "0.5rem 1rem", background: "transparent", border: "1px solid var(--border)", borderRadius: "6px", cursor: "pointer", fontWeight: 500 }}>Huỷ</button>
          <button 
            onClick={onConfirm} 
            disabled={isSubmitting}
            style={{ padding: "0.5rem 1rem", background: "var(--success)", color: "white", border: "none", borderRadius: "6px", cursor: isSubmitting ? "not-allowed" : "pointer", fontWeight: 600, opacity: isSubmitting ? 0.6 : 1 }}
          >
            {isSubmitting ? "Đang xử lý..." : "Xác nhận phê duyệt"}
          </button>
        </div>
      </div>
    </div>
  );
}

// Modal for History
function HistoryModal({ contractId, onClose }: { contractId: string, onClose: () => void }) {
  const { data: response, isLoading } = useSWR<any>(
    `/api/contracts/${contractId}/approval-history`,
    apiRequestEnvelope
  );

  const history: any[] = response?.data || [];

  return (
    <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.5)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }} onClick={onClose}>
      <div style={{ background: "var(--surface)", width: "100%", maxWidth: "600px", borderRadius: "12px", overflow: "hidden", display: "flex", flexDirection: "column", boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)", animation: "slideUp 0.2s ease", maxHeight: "80vh" }} onClick={e => e.stopPropagation()}>
        <div style={{ padding: "1.25rem 1.5rem", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between", background: "var(--bg)" }}>
          <h3 style={{ margin: 0, display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "1.1rem" }}>
            <History size={20} color="var(--primary)" /> Lịch sử phê duyệt
          </h3>
          <button onClick={onClose} style={{ background: "transparent", border: "none", cursor: "pointer", color: "var(--text-muted)" }}><X size={20} /></button>
        </div>
        <div style={{ padding: "1.5rem", overflowY: "auto", flex: 1 }}>
          {isLoading ? (
            <div style={{ display: "flex", justifyContent: "center" }}><LoadingState /></div>
          ) : history.length === 0 ? (
            <div style={{ color: "var(--text-muted)", textAlign: "center" }}>Chưa có lịch sử phê duyệt nào.</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              {history.map((item: any, idx: number) => (
                <div key={idx} style={{ padding: "1rem", background: "var(--bg)", borderRadius: "8px", border: "1px solid var(--border)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
                    <span style={{ fontWeight: 600, color: "var(--primary)" }}>Bước {item.step} - {item.action}</span>
                    <span style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>{new Date(item.createdAt).toLocaleString('vi-VN')}</span>
                  </div>
                  <div style={{ fontSize: "0.95rem", marginBottom: "0.25rem" }}>
                    <span style={{ color: "var(--text-muted)" }}>Người thực hiện: </span> 
                    <strong>{item.actor.name}</strong> ({item.actor.role})
                  </div>
                  {item.reason && (
                    <div style={{ fontSize: "0.95rem", padding: "0.5rem", background: "var(--warning-soft)", borderRadius: "6px", color: "var(--text)", marginTop: "0.5rem" }}>
                      <strong>Lý do:</strong> {item.reason}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Modal for Contract Details (Quick View)
function ContractQuickViewModal({ contractId, onClose }: { contractId: string, onClose: () => void }) {
  const { data: response, isLoading } = useSWR<any>(`/api/contracts/${contractId}`, apiRequestEnvelope);
  const contract: any = response?.data;

  return (
    <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.5)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }} onClick={onClose}>
      <div style={{ background: "var(--surface)", width: "100%", maxWidth: "700px", borderRadius: "12px", overflow: "hidden", display: "flex", flexDirection: "column", boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)", animation: "slideUp 0.2s ease", maxHeight: "90vh" }} onClick={e => e.stopPropagation()}>
        <div style={{ padding: "1.25rem 1.5rem", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between", background: "var(--bg)" }}>
          <h3 style={{ margin: 0, display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "1.1rem" }}>
            <FileText size={20} color="var(--primary)" /> Xem nhanh hợp đồng
          </h3>
          <button onClick={onClose} style={{ background: "transparent", border: "none", cursor: "pointer", color: "var(--text-muted)" }}><X size={20} /></button>
        </div>
        <div style={{ padding: "1.5rem", overflowY: "auto", flex: 1 }}>
          {isLoading ? (
            <div style={{ display: "flex", justifyContent: "center", padding: "2rem" }}><LoadingState /></div>
          ) : contract ? (
            <div style={{ display: "grid", gap: "1.25rem" }}>
              <div>
                <h4 style={{ margin: "0 0 0.5rem 0", fontSize: "1.2rem" }}>{contract.title}</h4>
                <div style={{ display: "inline-block", padding: "0.2rem 0.6rem", background: "var(--primary-soft)", color: "var(--primary)", borderRadius: "12px", fontSize: "0.85rem", fontWeight: 600 }}>{contract.code}</div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", background: "var(--bg)", padding: "1.25rem", borderRadius: "8px", border: "1px solid var(--border)" }}>
                <div>
                  <div style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "0.25rem" }}>Trạng thái</div>
                  <StatusBadge status={contract.status} />
                </div>
                <div>
                  <div style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "0.25rem" }}>Phê duyệt</div>
                  <ApprovalStatusBadge status={contract.approvalStatus} />
                </div>
                <div>
                  <div style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "0.25rem" }}>Đối tác</div>
                  <div style={{ fontWeight: 500 }}>{contract.partnerName}</div>
                </div>
                <div>
                  <div style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "0.25rem" }}>Giá trị</div>
                  <div style={{ fontWeight: 600, color: "var(--success)" }}>{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(contract.value)}</div>
                </div>
              </div>
              <div>
                <div style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "0.5rem" }}>Mô tả hợp đồng</div>
                <div style={{ padding: "1rem", background: "var(--bg)", borderRadius: "8px", border: "1px solid var(--border)", fontSize: "0.95rem", lineHeight: 1.5 }}>
                  {contract.description || "Không có mô tả."}
                </div>
              </div>
            </div>
          ) : (
            <div style={{ color: "var(--text-muted)", textAlign: "center" }}>Không tìm thấy dữ liệu.</div>
          )}
        </div>
        <div style={{ padding: "1.25rem 1.5rem", borderTop: "1px solid var(--border)", background: "var(--bg)", display: "flex", justifyContent: "flex-end", gap: "1rem" }}>
          <button onClick={onClose} style={{ padding: "0.6rem 1.2rem", background: "transparent", border: "1px solid var(--border)", borderRadius: "6px", cursor: "pointer", fontWeight: 600 }}>Đóng</button>
          {contract && (
            <Link href={`/admin/contracts/${contract.id}`} style={{ textDecoration: "none" }}>
              <button style={{ padding: "0.6rem 1.2rem", background: "var(--primary)", color: "white", border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: 600 }}>
                Đi đến trang chi tiết
              </button>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}


export function ApprovalsView() {
  const { user, loading: userLoading } = useCurrentUser();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search, 400);
  
  const [rejectContractIds, setRejectContractIds] = useState<string[]>([]);
  const [approveContractIds, setApproveContractIds] = useState<string[]>([]);
  const [historyContractId, setHistoryContractId] = useState<string | null>(null);
  const [quickViewContractId, setQuickViewContractId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

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

  async function handleApprove() {
    if (approveContractIds.length === 0) return;
    setIsSubmitting(true);
    setError(null);
    try {
      await Promise.all(approveContractIds.map(id => apiRequest(`/api/contracts/${id}/approve`, { method: "POST" })));
      setSelectedIds(prev => prev.filter(id => !approveContractIds.includes(id)));
      setApproveContractIds([]);
      await fetchData();
    } catch (e) {
      setError("Một số hợp đồng không thể phê duyệt. Vui lòng tải lại trang và thử lại.");
      await fetchData();
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleReject(reason: string) {
    if (rejectContractIds.length === 0) return;
    setIsSubmitting(true);
    setError(null);
    try {
      await Promise.all(rejectContractIds.map(id => apiRequest(`/api/contracts/${id}/reject`, {
        method: "POST",
        body: JSON.stringify({ reason }),
      })));
      setSelectedIds(prev => prev.filter(id => !rejectContractIds.includes(id)));
      setRejectContractIds([]);
      await fetchData();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Từ chối thất bại");
      await fetchData();
    } finally {
      setIsSubmitting(false);
    }
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(items.map(item => item.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (checked: boolean, id: string) => {
    if (checked) {
      setSelectedIds(prev => [...prev, id]);
    } else {
      setSelectedIds(prev => prev.filter(item => item !== id));
    }
  };

  return (
    <PageGuard user={user} loading={userLoading} permission="contract.approve">
      <div className="page-stack">
        <section className="page-header" style={{ marginBottom: "1.5rem" }}>
          <div>
            <h1>Hàng đợi phê duyệt</h1>
            <p>Kiểm tra các hợp đồng đang chờ duyệt và quyết định phê duyệt hoặc từ chối kèm lý do.</p>
          </div>
        </section>

        <div style={{ background: "var(--surface)", padding: "1.25rem", borderRadius: "12px", border: "1px solid var(--border)", marginBottom: "1.5rem", display: "flex", gap: "1rem", alignItems: "center" }}>
          <div style={{ position: "relative", width: "100%", maxWidth: "400px" }}>
            <Search size={18} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
            <input 
              value={search} 
              onChange={(e) => { setSearch(e.target.value); setPage(1); }} 
              placeholder="Tìm kiếm theo mã, tên hoặc đối tác..." 
              style={{ width: "100%", padding: "0.6rem 1rem 0.6rem 2.5rem", borderRadius: "8px", border: "1px solid var(--border)", outline: "none", fontSize: "0.95rem" }}
            />
          </div>
          <div style={{ flex: 1 }}></div>
          <span style={{ fontSize: "0.9rem", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <AlertTriangle size={16} color="var(--warning)" /> Đang chờ: <strong>{response?.meta?.totalItems || 0}</strong>
          </span>
        </div>

        {loading && <LoadingState />}
        {displayError && <ErrorState message={displayError} />}
        {!loading && !displayError && items.length === 0 && <EmptyState message="Tuyệt vời! Không có hợp đồng nào đang chờ phê duyệt." />}
        
        {!loading && !displayError && items.length > 0 && (
          <div style={{ background: "var(--surface)", borderRadius: "12px", border: "1px solid var(--border)", overflow: "hidden" }}>
            {selectedIds.length > 0 && (
              <div style={{ padding: "0.75rem 1.25rem", background: "var(--primary-soft)", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: "1rem" }}>
                <span style={{ fontSize: "0.9rem", fontWeight: 600, color: "var(--primary)" }}>Đã chọn {selectedIds.length} hợp đồng</span>
                <div style={{ flex: 1 }}></div>
                <button 
                  disabled={isSubmitting}
                  onClick={() => setApproveContractIds(selectedIds)}
                  style={{ padding: "0.4rem 0.8rem", background: "var(--success)", color: "white", border: "none", borderRadius: "6px", cursor: isSubmitting ? "not-allowed" : "pointer", fontSize: "0.85rem", fontWeight: 600, display: "flex", alignItems: "center", gap: "0.4rem" }}
                >
                  <CheckCircle size={16} /> Duyệt hàng loạt
                </button>
                <button 
                  disabled={isSubmitting}
                  onClick={() => setRejectContractIds(selectedIds)}
                  style={{ padding: "0.4rem 0.8rem", background: "var(--danger)", color: "white", border: "none", borderRadius: "6px", cursor: isSubmitting ? "not-allowed" : "pointer", fontSize: "0.85rem", fontWeight: 600, display: "flex", alignItems: "center", gap: "0.4rem" }}
                >
                  <XCircle size={16} /> Từ chối hàng loạt
                </button>
              </div>
            )}
            <DataTable
              columns={[
                {
                  key: "select",
                  header: (
                    <input 
                      type="checkbox" 
                      checked={items.length > 0 && selectedIds.length === items.length}
                      onChange={(e) => handleSelectAll(e.target.checked)}
                      style={{ cursor: "pointer", width: "16px", height: "16px", accentColor: "var(--primary)" }}
                    />
                  ),
                  width: "4%",
                  render: (row) => (
                    <input 
                      type="checkbox" 
                      checked={selectedIds.includes(row.id)}
                      onChange={(e) => handleSelectOne(e.target.checked, row.id)}
                      style={{ cursor: "pointer", width: "16px", height: "16px", accentColor: "var(--primary)" }}
                    />
                  ),
                },
                { key: "code", header: "Mã HĐ", width: "12%", render: (row) => <span style={{ fontWeight: 600, color: "var(--primary)" }}>{row.code}</span> },
                { key: "title", header: "Tên hợp đồng", width: "22%", render: (row) => <div style={{ lineHeight: "1.4", fontWeight: 500, color: "var(--text)", wordBreak: "break-word" }}>{row.title.replace(/Hợp đồng Hợp đồng/g, "Hợp đồng")}</div> },
                { key: "owner", header: "Người tạo", width: "13%", render: (row) => <div style={{ color: "var(--text)", fontWeight: 500 }}>{row.owner.name}</div> },
                { key: "partner", header: "Đối tác", width: "15%", render: (row) => <div style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>{row.partnerName}</div> },
                {
                  key: "submitted",
                  header: "Ngày gửi duyệt",
                  width: "12%",
                  render: (row) => <div style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>{row.submittedForApprovalAt ? new Date(row.submittedForApprovalAt).toLocaleString('vi-VN') : "-"}</div>,
                },
                {
                  key: "actions",
                  header: "Thao tác",
                  width: "22%",
                  render: (row) => (
                    <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", alignItems: "center" }}>
                      <button 
                        disabled={isSubmitting}
                        onClick={() => setApproveContractIds([row.id])}
                        title="Phê duyệt"
                        style={{ padding: "0.4rem 0.75rem", background: "var(--success)", color: "white", border: "none", borderRadius: "6px", cursor: isSubmitting ? "not-allowed" : "pointer", fontSize: "0.85rem", fontWeight: 600, display: "flex", alignItems: "center", gap: "0.25rem" }}
                      >
                        <CheckCircle size={14} /> Duyệt
                      </button>
                      <button 
                        disabled={isSubmitting}
                        onClick={() => setRejectContractIds([row.id])}
                        title="Từ chối"
                        style={{ padding: "0.4rem 0.75rem", background: "var(--danger)", color: "white", border: "none", borderRadius: "6px", cursor: isSubmitting ? "not-allowed" : "pointer", fontSize: "0.85rem", fontWeight: 600, display: "flex", alignItems: "center", gap: "0.25rem" }}
                      >
                        <XCircle size={14} /> Từ chối
                      </button>
                      <div style={{ borderLeft: "1px solid var(--border)", height: "20px", margin: "0 0.25rem" }}></div>
                      <button 
                        onClick={() => setQuickViewContractId(row.id)}
                        title="Xem chi tiết"
                        style={{ padding: "0.4rem", background: "var(--surface)", color: "var(--primary)", border: "1px solid var(--border)", borderRadius: "6px", cursor: "pointer", display: "flex", alignItems: "center" }}
                      >
                        <Eye size={16} />
                      </button>
                      <button 
                        onClick={() => setHistoryContractId(row.id)}
                        title="Lịch sử duyệt"
                        style={{ padding: "0.4rem", background: "var(--surface)", color: "var(--text-muted)", border: "1px solid var(--border)", borderRadius: "6px", cursor: "pointer", display: "flex", alignItems: "center" }}
                      >
                        <History size={16} />
                      </button>
                    </div>
                  ),
                },
              ]}
              rows={items}
            />
            <div style={{ padding: "1rem", borderTop: "1px solid var(--border)", background: "var(--bg)" }}>
              <PaginationControls page={page} totalPages={totalPages} onChange={setPage} />
            </div>
          </div>
        )}

        {approveContractIds.length > 0 && (
          <ApproveModal 
            isSubmitting={isSubmitting}
            count={approveContractIds.length}
            onConfirm={handleApprove} 
            onClose={() => setApproveContractIds([])} 
          />
        )}

        {rejectContractIds.length > 0 && (
          <RejectModal 
            isSubmitting={isSubmitting}
            onConfirm={handleReject} 
            onClose={() => setRejectContractIds([])} 
          />
        )}

        {historyContractId && (
          <HistoryModal 
            contractId={historyContractId} 
            onClose={() => setHistoryContractId(null)} 
          />
        )}

        {quickViewContractId && (
          <ContractQuickViewModal 
            contractId={quickViewContractId} 
            onClose={() => setQuickViewContractId(null)} 
          />
        )}

      </div>
    </PageGuard>
  );
}
