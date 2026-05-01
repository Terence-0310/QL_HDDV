"use client";

import { useCallback, useState } from "react";
import useSWR from "swr";
import Link from "next/link";
import { apiRequest, apiRequestEnvelope } from "@/lib/api-client";
import { EmptyState, ErrorState, LoadingState } from "@/components/shared/ui-states";
import { PageGuard } from "@/components/shared/page-guard";
import { useCurrentUser } from "@/hooks/use-current-user";
import { PaginationControls } from "@/components/shared/pagination-controls";
import { 
  Bell, AlertTriangle, CheckCircle, Clock, 
  Archive, Info, Check, CheckCheck, ArrowRight, X, FileText 
} from "lucide-react";
import { StatusBadge, ApprovalStatusBadge } from "@/components/shared/status-badges";

type NotificationItem = {
  id: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  type: string;
  relatedEntityType?: string | null;
  relatedEntityId?: string | null;
};

function getNotificationIcon(type: string) {
  switch (type) {
    case "REMINDER": return <Bell size={20} color="#2563eb" />;
    case "REMINDER_FAILED": return <AlertTriangle size={20} color="#dc2626" />;
    case "CONTRACT_RENEWED": return <CheckCircle size={20} color="#059669" />;
    case "CONTRACT_EXPIRING": return <Clock size={20} color="#d97706" />;
    case "CONTRACT_EXPIRED": return <Archive size={20} color="#9b2c2c" />;
    case "SYSTEM": return <Info size={20} color="#4b5563" />;
    default: return <Bell size={20} color="#6b7280" />;
  }
}

function getNotificationLink(item: NotificationItem) {
  if (item.relatedEntityType === "CONTRACT" && item.relatedEntityId) return `/admin/contracts/${item.relatedEntityId}`;
  if (item.type.includes("REMINDER")) return "/admin/reminders";
  if (item.type.includes("CONTRACT")) return "/admin/contracts";
  return "#";
}

// Quick View Modal Component
function NotificationModal({ notification, onClose, markRead }: { notification: NotificationItem, onClose: () => void, markRead: (id: string) => void }) {
  const isContract = notification.relatedEntityType === "CONTRACT" && notification.relatedEntityId;
  
  // Conditionally fetch contract info
  const { data: contractData, isLoading: loadingContract } = useSWR<any>(
    isContract ? `/api/contracts/${notification.relatedEntityId}` : null,
    apiRequestEnvelope
  );
  const contract: any = contractData?.data;

  // Mark read when modal opens if it's unread
  if (!notification.isRead) {
    markRead(notification.id);
  }

  const link = getNotificationLink(notification);

  return (
    <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.5)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }} onClick={onClose}>
      <div style={{ background: "var(--surface)", width: "100%", maxWidth: "600px", borderRadius: "12px", overflow: "hidden", display: "flex", flexDirection: "column", boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)", animation: "slideUp 0.2s ease" }} onClick={e => e.stopPropagation()}>
        <div style={{ padding: "1.25rem 1.5rem", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between", background: "var(--bg)" }}>
          <h3 style={{ margin: 0, display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "1.1rem" }}>
            {getNotificationIcon(notification.type)}
            Chi tiết thông báo
          </h3>
          <button onClick={onClose} style={{ background: "transparent", border: "none", cursor: "pointer", color: "var(--text-muted)" }}><X size={20} /></button>
        </div>
        
        <div style={{ padding: "1.5rem", overflowY: "auto", maxHeight: "70vh" }}>
          <h4 style={{ margin: "0 0 0.5rem 0", fontSize: "1.2rem", color: "var(--text)" }}>{notification.title}</h4>
          <span style={{ display: "block", fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "1rem" }}>{new Date(notification.createdAt).toLocaleString('vi-VN')}</span>
          <p style={{ margin: "0 0 1.5rem 0", color: "var(--text)", lineHeight: 1.6, background: "var(--bg)", padding: "1rem", borderRadius: "8px", border: "1px solid var(--border)" }}>
            {notification.message}
          </p>

          {isContract && (
            <div style={{ border: "1px solid var(--border)", borderRadius: "8px", padding: "1.25rem" }}>
              <h5 style={{ margin: "0 0 1rem 0", display: "flex", alignItems: "center", gap: "0.5rem", color: "var(--primary)", fontSize: "1rem" }}>
                <FileText size={18} /> Thông tin Hợp đồng liên quan
              </h5>
              
              {loadingContract ? (
                <div style={{ display: "flex", justifyContent: "center", padding: "1rem" }}><LoadingState /></div>
              ) : contract ? (
                <div style={{ display: "grid", gap: "0.75rem", fontSize: "0.95rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: "var(--text-muted)" }}>Mã hợp đồng:</span>
                    <span style={{ fontWeight: 600 }}>{contract.code}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: "var(--text-muted)" }}>Tên hợp đồng:</span>
                    <span style={{ fontWeight: 500, textAlign: "right" }}>{contract.title}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: "var(--text-muted)" }}>Trạng thái:</span>
                    <StatusBadge status={contract.status} />
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: "var(--text-muted)" }}>Phê duyệt:</span>
                    <ApprovalStatusBadge status={contract.approvalStatus} />
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: "var(--text-muted)" }}>Đối tác:</span>
                    <span>{contract.partner?.name}</span>
                  </div>
                </div>
              ) : (
                <div style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>Không tìm thấy dữ liệu hợp đồng.</div>
              )}
            </div>
          )}
        </div>

        <div style={{ padding: "1.25rem 1.5rem", borderTop: "1px solid var(--border)", background: "var(--bg)", display: "flex", justifyContent: "flex-end", gap: "1rem" }}>
          <button onClick={onClose} style={{ padding: "0.6rem 1.2rem", background: "transparent", border: "1px solid var(--border)", borderRadius: "6px", cursor: "pointer", fontWeight: 600 }}>
            Đóng
          </button>
          {link !== "#" && (
            <Link href={link} style={{ textDecoration: "none" }}>
              <button style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.6rem 1.2rem", background: "var(--primary)", color: "white", border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: 600 }}>
                Quản lý chi tiết <ArrowRight size={16} />
              </button>
            </Link>
          )}
        </div>
      </div>
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes slideUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
      `}} />
    </div>
  );
}

export function NotificationsView() {
  const { user, loading: userLoading } = useCurrentUser();
  const [page, setPage] = useState(1);
  const [isReadFilter, setIsReadFilter] = useState("");
  const [updatingAll, setUpdatingAll] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedNotification, setSelectedNotification] = useState<NotificationItem | null>(null);

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

  async function markReadEvent(e: React.MouseEvent, id: string) {
    e.preventDefault(); 
    e.stopPropagation();
    await markRead(id);
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
      <div className="page-stack" style={{ maxWidth: "1000px", margin: "0 auto" }}>
        <section className="page-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: "1rem" }}>
          <div>
            <h1>Trung tâm thông báo</h1>
            <p>Theo dõi các sự kiện hệ thống, cảnh báo nhắc hạn và hoạt động phê duyệt.</p>
          </div>
        </section>

        <div className="card toolbar" style={{ padding: "1rem", display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "1.5rem" }}>
            <span style={{ 
              background: unreadCount > 0 ? "var(--primary-soft)" : "var(--surface)", 
              color: unreadCount > 0 ? "var(--primary)" : "var(--text-muted)", 
              padding: "0.4rem 1rem", 
              borderRadius: "20px", 
              fontWeight: 600,
              fontSize: "0.9rem",
              border: "1px solid var(--border)"
            }}>
              Chưa đọc: {unreadCount}
            </span>
            <select 
              value={isReadFilter} 
              onChange={(e) => setIsReadFilter(e.target.value)}
              style={{ padding: "0.4rem 1rem", borderRadius: "8px", border: "1px solid var(--border)", background: "var(--bg)", outline: "none", cursor: "pointer" }}
            >
              <option value="">Tất cả thông báo</option>
              <option value="false">Chỉ hiện chưa đọc</option>
              <option value="true">Chỉ hiện đã đọc</option>
            </select>
          </div>
          <button 
            className="btn-primary hover-opacity" 
            style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.6rem 1.2rem", background: "var(--primary)", color: "white", borderRadius: "8px", border: "none", cursor: "pointer", opacity: updatingAll || unreadCount === 0 ? 0.5 : 1 }}
            disabled={updatingAll || unreadCount === 0} 
            onClick={() => void markAllRead()}
          >
            <CheckCheck size={18} />
            {updatingAll ? "Đang xử lý..." : "Đánh dấu tất cả đã đọc"}
          </button>
        </div>

        {loading && <LoadingState />}
        {displayError && <ErrorState message={displayError} />}
        {!loading && !displayError && items.length === 0 && <EmptyState message="Hiện không có thông báo nào." />}
        
        {!loading && !displayError && items.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {items.map((item) => {
              const link = getNotificationLink(item);
              const isClickable = link !== "#";
              
              const CardContent = (
                <div
                  onClick={() => isClickable ? setSelectedNotification(item) : undefined}
                  className="notification-card group"
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: "1.25rem",
                    background: item.isRead ? "var(--surface)" : "#F8FAFC",
                    border: `1px solid ${item.isRead ? "var(--border)" : "#CBD5E1"}`,
                    borderLeft: `4px solid ${item.isRead ? "transparent" : "var(--primary)"}`,
                    borderRadius: "12px",
                    padding: "1.25rem",
                    boxShadow: item.isRead ? "none" : "0 4px 6px -1px rgba(0, 0, 0, 0.05)",
                    transition: "all 0.2s ease",
                    cursor: isClickable ? "pointer" : "default",
                    position: "relative",
                    overflow: "hidden"
                  }}
                >
                  <div style={{ 
                    width: "48px", height: "48px", flexShrink: 0, 
                    background: item.isRead ? "var(--bg)" : "white", 
                    borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
                    boxShadow: item.isRead ? "none" : "0 2px 4px rgba(0,0,0,0.05)"
                  }}>
                    {getNotificationIcon(item.type)}
                  </div>
                  
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.25rem" }}>
                      <h4 style={{ 
                        margin: 0, fontSize: "1rem", color: "var(--text)", 
                        fontWeight: item.isRead ? 500 : 700 
                      }}>
                        {item.title}
                      </h4>
                      <span style={{ fontSize: "0.8rem", color: "var(--text-muted)", whiteSpace: "nowrap", marginLeft: "1rem" }}>
                        {new Date(item.createdAt).toLocaleString('vi-VN')}
                      </span>
                    </div>
                    <p style={{ margin: 0, color: item.isRead ? "var(--text-muted)" : "var(--text)", fontSize: "0.95rem", lineHeight: 1.5 }}>
                      {item.message}
                    </p>
                    
                    <div style={{ display: "flex", alignItems: "center", gap: "1.5rem", marginTop: "1rem" }}>
                      {isClickable && (
                        <span style={{ display: "flex", alignItems: "center", gap: "0.25rem", fontSize: "0.85rem", color: "var(--primary)", fontWeight: 600 }}>
                          Xem chi tiết <ArrowRight size={14} />
                        </span>
                      )}
                      
                      {!item.isRead && (
                        <button 
                          onClick={(e) => void markReadEvent(e, item.id)}
                          style={{ 
                            display: "flex", alignItems: "center", gap: "0.25rem", 
                            background: "transparent", border: "none", color: "var(--success)", 
                            fontSize: "0.85rem", fontWeight: 600, cursor: "pointer", padding: 0
                          }}
                        >
                          <Check size={14} /> Đánh dấu đã đọc
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );

              return <div key={item.id}>{CardContent}</div>;
            })}
            
            <div style={{ marginTop: "1rem" }}>
              <PaginationControls page={page} totalPages={totalPages} onChange={setPage} />
            </div>
          </div>
        )}

        {selectedNotification && (
          <NotificationModal 
            notification={selectedNotification} 
            onClose={() => setSelectedNotification(null)}
            markRead={markRead}
          />
        )}
      </div>
    </PageGuard>
  );
}
