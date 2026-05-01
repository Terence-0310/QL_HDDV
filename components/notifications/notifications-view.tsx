"use client";

import { useCallback, useState } from "react";
import useSWR from "swr";
import { apiRequest, apiRequestEnvelope } from "@/lib/api-client";
import { EmptyState, ErrorState, LoadingState } from "@/components/shared/ui-states";
import { PageGuard } from "@/components/shared/page-guard";
import { useCurrentUser } from "@/hooks/use-current-user";
import { PaginationControls } from "@/components/shared/pagination-controls";

type NotificationItem = {
  id: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  relatedEntityId?: string | null;
};

export function NotificationsView() {
  const { user, loading: userLoading } = useCurrentUser();
  const [page, setPage] = useState(1);
  const [isReadFilter, setIsReadFilter] = useState("");
  const [updatingAll, setUpdatingAll] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const qs = new URLSearchParams({ page: String(page), pageSize: "10" });
  if (isReadFilter) qs.set("isRead", isReadFilter);

  const {
    data: response,
    error: fetchError,
    isLoading: loading,
    mutate: fetchNotifications,
  } = useSWR<{ data: NotificationItem[]; meta?: any }>(
    `/api/notifications?${qs.toString()}`,
    apiRequestEnvelope
  );

  const {
    data: unreadResponse,
    mutate: fetchUnread,
  } = useSWR<{ unreadCount: number }>("/api/notifications/unread-count", apiRequest);

  const items = response?.data ?? [];
  const totalPages = Number(response?.meta?.totalPages ?? 1);
  const unreadCount = unreadResponse?.unreadCount ?? 0;
  const displayError = error || (fetchError ? (fetchError instanceof Error ? fetchError.message : "Failed to fetch notifications") : null);

  const fetchData = useCallback(async () => {
    await Promise.all([fetchNotifications(), fetchUnread()]);
  }, [fetchNotifications, fetchUnread]);

  async function markRead(id: string) {
    try {
      await apiRequest(`/api/notifications/${id}/read`, { method: "PATCH" });
      await fetchData();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to mark notification as read");
    }
  }

  async function markAllRead() {
    setUpdatingAll(true);
    try {
      await apiRequest<{ updatedCount: number }>("/api/notifications/read-all", { method: "PATCH" });
      await fetchData();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to mark all notifications as read");
    } finally {
      setUpdatingAll(false);
    }
  }



  return (
    <PageGuard user={user} loading={userLoading} permission="notification.view">
      <div className="page-stack">
      <section className="page-header">
        <h1>Trung tâm thông báo</h1>
        <p>Theo dõi các cập nhật hệ thống và đánh dấu đã đọc.</p>
      </section>
      <div className="card toolbar" style={{ padding: "0.8rem", marginBottom: "0.2rem" }}>
        <span style={{ color: "var(--text-muted)" }}>Chưa đọc: {unreadCount}</span>
        <select value={isReadFilter} onChange={(e) => setIsReadFilter(e.target.value)}>
          <option value="">Tất cả</option>
          <option value="false">Chưa đọc</option>
          <option value="true">Đã đọc</option>
        </select>
        <button className="btn-primary" disabled={updatingAll || unreadCount === 0} onClick={() => void markAllRead()}>
          {updatingAll ? "Đang cập nhật..." : "Đánh dấu tất cả đã đọc"}
        </button>
      </div>
      {loading && <LoadingState />}
      {displayError && <ErrorState message={displayError} />}
      {!loading && !displayError && items.length === 0 && <EmptyState message="Không có thông báo nào." />}
      {!loading && !displayError && items.length > 0 && (
        <>
          <div style={{ display: "grid", gap: "0.5rem" }}>
            {items.map((item) => (
              <div
                key={item.id}
                style={{
                  background: "#fff",
                  border: `1px solid ${item.isRead ? "var(--border)" : "#ddc7b9"}`,
                  borderRadius: "0.75rem",
                  padding: "0.75rem",
                  boxShadow: "var(--shadow-sm)",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", gap: "0.5rem" }}>
                  <strong>{item.title}</strong>
                  <span style={{ fontSize: "0.8rem", color: "#6b7280" }}>{new Date(item.createdAt).toLocaleString()}</span>
                </div>
                <p style={{ margin: "0.35rem 0", color: "#374151" }}>{item.message}</p>
                {!item.isRead && <button className="btn-primary" onClick={() => void markRead(item.id)}>Đánh dấu đã đọc</button>}
              </div>
            ))}
          </div>
          <PaginationControls page={page} totalPages={totalPages} onChange={setPage} />
        </>
      )}
      </div>
    </PageGuard>
  );
}
