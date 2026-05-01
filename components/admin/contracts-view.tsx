"use client";

import { useCallback, useState } from "react";
import useSWR from "swr";
import type { ApprovalStatus, ContractStatus } from "@prisma/client";
import { apiRequest, apiRequestEnvelope } from "@/lib/api-client";
import { DataTable } from "@/components/shared/data-table";
import { ApprovalStatusBadge, StatusBadge } from "@/components/shared/status-badges";
import { EmptyState, ErrorState, LoadingState } from "@/components/shared/ui-states";
import { PageGuard } from "@/components/shared/page-guard";
import { useCurrentUser } from "@/hooks/use-current-user";
import { PaginationControls } from "@/components/shared/pagination-controls";
import { hasClientPermission } from "@/lib/permissions-client";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { useSearchParams } from "next/navigation";

type ContractItem = {
  id: string;
  code: string;
  title: string;
  partnerName: string;
  owner: { name: string; email: string };
  status: ContractStatus;
  approvalStatus: ApprovalStatus;
  endDate: string;
  autoRenew: boolean;
  reminderOffsets?: string;
  updatedAt: string;
};

export function AdminContractsView() {
  const { user, loading: userLoading } = useCurrentUser();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search, 400);
  const searchParams = useSearchParams();
  const initialStatus = searchParams?.get("status") || "";
  const [status, setStatus] = useState(initialStatus);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [thresholdPreset, setThresholdPreset] = useState<"all" | "only7" | "custom">("all");
  const [form, setForm] = useState({
    code: "",
    title: "",
    partnerName: "",
    partnerEmail: "",
    value: "0",
    startDate: "",
    endDate: "",
    autoRenew: false,
    status: "DRAFT" as ContractStatus,
    reminderThresholdDays: [7, 15, 30] as number[],
  });

  function toggleThreshold(days: number) {
    setForm((prev) => {
      const exists = prev.reminderThresholdDays.includes(days);
      const next = exists ? prev.reminderThresholdDays.filter((item) => item !== days) : [...prev.reminderThresholdDays, days];
      return { ...prev, reminderThresholdDays: next.sort((a, b) => a - b) };
    });
    setThresholdPreset("custom");
  }

  function resetForm() {
    setEditingId(null);
    setThresholdPreset("all");
    setForm({
      code: "",
      title: "",
      partnerName: "",
      partnerEmail: "",
      value: "0",
      startDate: "",
      endDate: "",
      autoRenew: false,
      status: "DRAFT",
      reminderThresholdDays: [7, 15, 30],
    });
  }

  function applyThresholdPreset(preset: "all" | "only7" | "custom") {
    setThresholdPreset(preset);
    if (preset === "all") {
      setForm((prev) => ({ ...prev, reminderThresholdDays: [7, 15, 30] }));
      return;
    }
    if (preset === "only7") {
      setForm((prev) => ({ ...prev, reminderThresholdDays: [7] }));
    }
  }

  const qs = new URLSearchParams({ page: String(page), pageSize: "10" });
  if (debouncedSearch.trim()) qs.set("search", debouncedSearch.trim());
  if (status) qs.set("status", status);

  const [error, setError] = useState<string | null>(null);

  const {
    data: response,
    error: fetchError,
    isLoading: loading,
    mutate: fetchData,
  } = useSWR<{ data: ContractItem[]; meta?: any }>(
    `/api/admin/contracts?${qs.toString()}`,
    apiRequestEnvelope
  );

  const items = response?.data ?? [];
  const totalPages = Number(response?.meta?.totalPages ?? 1);
  const displayError = error || (fetchError ? (fetchError instanceof Error ? fetchError.message : "Failed to fetch") : null);

  async function submitApproval(id: string) {
    try {
      setError(null);
      await apiRequest(`/api/contracts/${id}/submit-approval`, { method: "POST" });
      await fetchData();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to submit contract for approval");
    }
  }

  async function handleUpdate(id: string, field: string, value: any) {
    if (updatingId) return;
    setUpdatingId(id);
    try {
      setError(null);
      await apiRequest(`/api/admin/contracts/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ [field]: value }),
      });
      await fetchData();
    } catch (err: any) {
      console.error("Lỗi cập nhật:", err);
      alert("Không thể cập nhật. Lỗi: " + err.message);
    } finally {
      setUpdatingId(null);
    }
  }

  async function startEdit(id: string) {
    try {
      setError(null);
      const data = await apiRequest<{
        id: string;
        code: string;
        title: string;
        partnerName: string;
        partnerEmail?: string | null;
        value: number;
        startDate: string;
        endDate: string;
        autoRenew: boolean;
        status: ContractStatus;
        reminderOffsets?: string | null;
      }>(`/api/contracts/${id}`);
      setEditingId(id);
      setForm({
        code: data.code,
        title: data.title,
        partnerName: data.partnerName,
        partnerEmail: data.partnerEmail ?? "",
        value: String(data.value),
        startDate: data.startDate.slice(0, 10),
        endDate: data.endDate.slice(0, 10),
        autoRenew: data.autoRenew,
        status: data.status,
        reminderThresholdDays: (data.reminderOffsets ?? "7,15,30")
          .split(",")
          .map((value) => Number(value.trim()))
          .filter((value) => Number.isInteger(value) && value > 0),
      });
      const normalized = (data.reminderOffsets ?? "7,15,30").replace(/\s/g, "");
      if (normalized === "7,15,30" || normalized === "30,15,7" || normalized === "15,30,7") {
        setThresholdPreset("all");
      } else if (normalized === "7") {
        setThresholdPreset("only7");
      } else {
        setThresholdPreset("custom");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load contract detail");
    }
  }

  async function saveContract() {
    if (!form.code.trim() || !form.title.trim() || !form.partnerName.trim() || !form.startDate || !form.endDate) {
      setError("Vui lòng nhập đầy đủ mã, tên, đối tác, ngày bắt đầu, ngày kết thúc");
      return;
    }
    if (form.reminderThresholdDays.length === 0) {
      setError("Vui lòng chọn ít nhất một mốc nhắc");
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const payload = {
        code: form.code.trim(),
        title: form.title.trim(),
        partnerName: form.partnerName.trim(),
        partnerEmail: form.partnerEmail.trim() || undefined,
        value: Number(form.value),
        startDate: new Date(form.startDate).toISOString(),
        endDate: new Date(form.endDate).toISOString(),
        autoRenew: form.autoRenew,
        status: form.status,
        reminderThresholdDays: form.reminderThresholdDays,
      };

      if (editingId) {
        await apiRequest(`/api/contracts/${editingId}`, {
          method: "PATCH",
          body: JSON.stringify(payload),
        });
      } else {
        await apiRequest("/api/contracts", {
          method: "POST",
          body: JSON.stringify(payload),
        });
      }

      resetForm();
      await fetchData();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save contract");
    } finally {
      setSaving(false);
    }
  }



  return (
    <PageGuard user={user} loading={userLoading} permission="admin.dashboard.view">
      <div className="page-stack">
      <section className="page-header">
        <h1>Quản lý hợp đồng</h1>
        <p>Danh sách hợp đồng toàn hệ thống với bộ lọc và thao tác phê duyệt.</p>
      </section>
      <div className="card" style={{ padding: "0.9rem", display: "grid", gap: "0.6rem" }}>
        <h3 style={{ margin: 0 }}>{editingId ? "Sửa hợp đồng" : "Tạo hợp đồng mới"}</h3>
        <div style={{ display: "grid", gap: "0.5rem", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))" }}>
          <input placeholder="Mã hợp đồng" value={form.code} onChange={(e) => setForm((prev) => ({ ...prev, code: e.target.value }))} />
          <input placeholder="Tên hợp đồng" value={form.title} onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))} />
          <input placeholder="Đối tác" value={form.partnerName} onChange={(e) => setForm((prev) => ({ ...prev, partnerName: e.target.value }))} />
          <input
            placeholder="Email đối tác"
            value={form.partnerEmail}
            onChange={(e) => setForm((prev) => ({ ...prev, partnerEmail: e.target.value }))}
          />
          <input type="number" placeholder="Giá trị" value={form.value} onChange={(e) => setForm((prev) => ({ ...prev, value: e.target.value }))} />
          <input type="date" value={form.startDate} onChange={(e) => setForm((prev) => ({ ...prev, startDate: e.target.value }))} />
          <input type="date" value={form.endDate} onChange={(e) => setForm((prev) => ({ ...prev, endDate: e.target.value }))} />
          <select value={form.status} onChange={(e) => setForm((prev) => ({ ...prev, status: e.target.value as ContractStatus }))}>
            <option value="DRAFT">DRAFT</option>
            <option value="ACTIVE">ACTIVE</option>
            <option value="EXPIRING_SOON">EXPIRING_SOON</option>
            <option value="EXPIRED">EXPIRED</option>
            <option value="TERMINATED">TERMINATED</option>
          </select>
        </div>
        <label style={{ display: "flex", gap: "0.4rem", alignItems: "center" }}>
          <input
            type="checkbox"
            checked={form.autoRenew}
            onChange={(e) => setForm((prev) => ({ ...prev, autoRenew: e.target.checked }))}
          />
          Tự động gia hạn
        </label>
        <div style={{ display: "flex", gap: "0.6rem", alignItems: "center", flexWrap: "wrap" }}>
          <span>Mốc nhắc gia hạn:</span>
          <select value={thresholdPreset} onChange={(e) => applyThresholdPreset(e.target.value as "all" | "only7" | "custom")}>
            <option value="all">Preset: 7-15-30</option>
            <option value="only7">Preset: chỉ 7 ngày</option>
            <option value="custom">Preset: tuỳ chỉnh</option>
          </select>
          {[7, 15, 30].map((days) => (
            <label key={days} style={{ display: "flex", gap: "0.25rem", alignItems: "center" }}>
              <input
                type="checkbox"
                checked={form.reminderThresholdDays.includes(days)}
                onChange={() => toggleThreshold(days)}
              />
              {days} ngày
            </label>
          ))}
        </div>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <button className="btn-primary" disabled={saving} onClick={() => void saveContract()}>
            {saving ? "Đang lưu..." : editingId ? "Cập nhật hợp đồng" : "Tạo hợp đồng"}
          </button>
          {editingId ? (
            <button onClick={resetForm} disabled={saving}>
              Hủy sửa
            </button>
          ) : null}
        </div>
      </div>
      <div className="card toolbar" style={{ padding: "0.8rem" }}>
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Tìm mã, tên hoặc đối tác" />
        <select value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">Tất cả trạng thái</option>
          <option value="DRAFT">DRAFT</option>
          <option value="ACTIVE">ACTIVE</option>
          <option value="EXPIRING_SOON">EXPIRING_SOON</option>
          <option value="EXPIRED">EXPIRED</option>
          <option value="TERMINATED">TERMINATED</option>
        </select>
        <button className="btn-primary" onClick={() => void fetchData()}>Áp dụng</button>
      </div>
      {loading && <LoadingState />}
      {displayError && <ErrorState message={displayError} />}
      {!loading && !displayError && items.length === 0 && <EmptyState message="Không có hợp đồng phù hợp." />}
      {!loading && !displayError && items.length > 0 && (
        <>
          <DataTable
            columns={[
              { key: "code", header: "Mã hợp đồng", width: "10%", render: (row) => <span style={{ fontWeight: 600, color: "var(--primary)" }}>{row.code}</span> },
              { key: "title", header: "Tên hợp đồng", width: "18%", render: (row) => <div style={{ lineHeight: "1.4", fontWeight: 500, color: "var(--text)", wordBreak: "break-word" }}>{row.title.replace(/Hợp đồng Hợp đồng/g, "Hợp đồng")}</div> },
              { key: "partner", header: "Đối tác", width: "14%", render: (row) => <span style={{ color: "var(--text-muted)", wordBreak: "break-word" }}>{row.partnerName}</span> },
              { key: "owner", header: "Người phụ trách", width: "10%", render: (row) => <span style={{ color: "var(--text-muted)" }}>{row.owner.name}</span> },
              { key: "status", header: "Trạng thái", width: "12%", render: (row) => (
                <div style={{ position: "relative" }}>
                  <select 
                    value={row.status} 
                    onChange={(e) => handleUpdate(row.id, "status", e.target.value)}
                    disabled={updatingId === row.id}
                    style={{ appearance: "none", background: "transparent", border: "1px dashed var(--border)", borderRadius: "4px", padding: "0.2rem 1.5rem 0.2rem 0.5rem", fontSize: "0.85rem", cursor: "pointer", opacity: updatingId === row.id ? 0.5 : 1, width: "100%" }}
                  >
                    <option value="DRAFT">Nháp</option>
                    <option value="ACTIVE">Hiệu lực</option>
                    <option value="EXPIRING_SOON">Sắp hết hạn</option>
                    <option value="EXPIRED">Đã hết hạn</option>
                    <option value="TERMINATED">Chấm dứt</option>
                    <option value="RENEWED">Đã gia hạn</option>
                  </select>
                  <div style={{ position: "absolute", right: "6px", top: "50%", transform: "translateY(-50%)", pointerEvents: "none", fontSize: "0.6rem" }}>▼</div>
                </div>
              )},
              { key: "approval", header: "Phê duyệt", width: "12%", render: (row) => (
                <div style={{ position: "relative" }}>
                  <select 
                    value={row.approvalStatus} 
                    onChange={(e) => handleUpdate(row.id, "approvalStatus", e.target.value)}
                    disabled={updatingId === row.id}
                    style={{ appearance: "none", background: "transparent", border: "1px dashed var(--border)", borderRadius: "4px", padding: "0.2rem 1.5rem 0.2rem 0.5rem", fontSize: "0.85rem", cursor: "pointer", opacity: updatingId === row.id ? 0.5 : 1, width: "100%" }}
                  >
                    <option value="NOT_SUBMITTED">Chưa gửi</option>
                    <option value="PENDING">Chờ duyệt</option>
                    <option value="APPROVED">Đã duyệt</option>
                    <option value="REJECTED">Từ chối</option>
                  </select>
                  <div style={{ position: "absolute", right: "6px", top: "50%", transform: "translateY(-50%)", pointerEvents: "none", fontSize: "0.6rem" }}>▼</div>
                </div>
              )},
              { key: "endDate", header: "Hết hạn", width: "8%", render: (row) => <span style={{ color: "var(--text-muted)" }}>{new Date(row.endDate).toLocaleDateString('vi-VN')}</span> },
              { key: "autoRenew", header: "Tự gia hạn", width: "6%", render: (row) => (
                <label style={{ display: "flex", alignItems: "center", cursor: updatingId === row.id ? "wait" : "pointer", opacity: updatingId === row.id ? 0.5 : 1 }}>
                  <input 
                    type="checkbox" 
                    checked={row.autoRenew} 
                    onChange={(e) => handleUpdate(row.id, "autoRenew", e.target.checked)}
                    disabled={updatingId === row.id}
                    style={{ accentColor: "var(--success)", width: "16px", height: "16px", cursor: "pointer" }} 
                  />
                </label>
              )},
              {
                key: "reminderOffsets",
                header: "Mốc nhắc",
                width: "6%",
                render: (row) => {
                  const offsets = (row.reminderOffsets ?? "7,15,30")
                    .split(",")
                    .map((value) => value.trim())
                    .filter(Boolean);

                  function getBadgeStyle(rawValue: string) {
                    const days = Number(rawValue);
                    if (days === 7) return { background: "#fef2f2", border: "1px solid #fca5a5", color: "#991b1b" };
                    if (days === 15) return { background: "#fff7ed", border: "1px solid #fdba74", color: "#9a3412" };
                    return { background: "#fffbeb", border: "1px solid #fcd34d", color: "#92400e" };
                  }

                  return (
                    <div style={{ display: "flex", gap: "0.25rem", flexWrap: "wrap", maxWidth: "60px" }}>
                      {offsets.map((value) => (
                        <span
                          key={`${row.id}-${value}`}
                          style={{
                            ...getBadgeStyle(value),
                            borderRadius: "4px",
                            padding: "0.1rem 0.25rem",
                            fontSize: "0.7rem",
                            fontWeight: 600,
                            lineHeight: 1
                          }}
                        >
                          {value}n
                        </span>
                      ))}
                    </div>
                  );
                },
              },
              {
                key: "actions",
                header: "Thao tác",
                width: "8%",
                minWidth: "110px",
                render: (row) => (
                  <div style={{ display: "flex", gap: "0.4rem", alignItems: "center" }}>
                    {user && hasClientPermission(user.role, "contract.submitApproval") && row.approvalStatus !== "PENDING" ? (
                      <button className="btn-primary" style={{ padding: "0.3rem 0.6rem", fontSize: "0.8rem", whiteSpace: "nowrap" }} onClick={() => void submitApproval(row.id)}>Gửi duyệt</button>
                    ) : null}
                    {user && hasClientPermission(user.role, "contract.update") ? (
                      <button style={{ padding: "0.3rem 0.6rem", fontSize: "0.8rem" }} onClick={() => void startEdit(row.id)}>Sửa</button>
                    ) : null}
                    {!user || (!hasClientPermission(user.role, "contract.submitApproval") && !hasClientPermission(user.role, "contract.update"))
                      ? <span style={{ color: "var(--text-muted)" }}>-</span>
                      : null}
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
