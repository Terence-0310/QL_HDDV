"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import useSWR, { preload } from "swr";
import { apiRequest, apiRequestEnvelope } from "@/lib/api-client";
import { hasClientPermission } from "@/lib/permissions-client";
import { useCurrentUser } from "@/hooks/use-current-user";
import { Bell, Search, Menu, LogOut, FileText, UserCheck, Users, Shield, Clock, History, BarChart2, PieChart, Info, Settings, LayoutDashboard } from "lucide-react";

type NavGroup = {
  title: string;
  items: Array<{
    href: string;
    label: string;
    icon: ReactNode;
    permission: Parameters<typeof hasClientPermission>[1];
    prefetchApi?: string;
    prefetchMethod?: "apiRequest" | "apiRequestEnvelope";
  }>;
};

const navGroups: NavGroup[] = [
  {
    title: "",
    items: [
      { href: "/admin/dashboard", label: "Tổng quan", icon: <LayoutDashboard size={18} />, permission: "admin.dashboard.view", prefetchApi: "/api/admin/reports/summary", prefetchMethod: "apiRequest" },
    ]
  },
  {
    title: "HỢP ĐỒNG",
    items: [
      { href: "/admin/contracts", label: "Hợp đồng quản trị", icon: <FileText size={18} />, permission: "admin.dashboard.view", prefetchApi: "/api/admin/contracts?page=1&pageSize=10", prefetchMethod: "apiRequestEnvelope" },
      { href: "/admin/approvals", label: "Hàng đợi duyệt", icon: <UserCheck size={18} />, permission: "contract.approve", prefetchApi: "/api/admin/approvals?page=1&pageSize=10", prefetchMethod: "apiRequestEnvelope" },
    ]
  },
  {
    title: "NGƯỜI DÙNG & PHÂN QUYỀN",
    items: [
      { href: "/admin/users", label: "Người dùng", icon: <Users size={18} />, permission: "user.view", prefetchApi: "/api/admin/users?page=1&pageSize=10", prefetchMethod: "apiRequestEnvelope" },
      { href: "/admin/roles", label: "Vai trò & phân quyền", icon: <Shield size={18} />, permission: "admin.dashboard.view" },
    ]
  },
  {
    title: "NHẮC HẠN",
    items: [
      { href: "/admin/reminders", label: "Nhắc hạn", icon: <Clock size={18} />, permission: "admin.dashboard.view" },
      { href: "/admin/reminders/history", label: "Lịch sử nhắc hạn", icon: <History size={18} />, permission: "admin.dashboard.view" },
    ]
  },
  {
    title: "BÁO CÁO & THỐNG KÊ",
    items: [
      { href: "/admin/reports", label: "Báo cáo", icon: <BarChart2 size={18} />, permission: "report.view", prefetchApi: "/api/admin/reports/summary", prefetchMethod: "apiRequest" },
      { href: "/admin/stats", label: "Thống kê", icon: <PieChart size={18} />, permission: "report.view" },
    ]
  },
  {
    title: "HỆ THỐNG",
    items: [
      { href: "/notifications", label: "Thông báo", icon: <Info size={18} />, permission: "notification.view", prefetchApi: "/api/notifications?page=1&pageSize=10", prefetchMethod: "apiRequestEnvelope" },
      { href: "/admin/settings", label: "Cài đặt hệ thống", icon: <Settings size={18} />, permission: "admin.dashboard.view" },
    ]
  }
];

function NotificationBell() {
  const [open, setOpen] = useState(false);
  
  const { data: countData, mutate: mutateCount } = useSWR<{ unreadCount: number }>(
    "/api/notifications/unread-count",
    apiRequest,
    { refreshInterval: 30_000 }
  );
  
  const { data: recentData, mutate: mutateRecent } = useSWR<any[]>(
    open ? "/api/notifications?page=1&pageSize=5" : null,
    apiRequest
  );

  const count = countData?.unreadCount ?? 0;

  const handleMarkAllRead = async () => {
    try {
      await apiRequest("/api/notifications/read-all", { method: "POST" });
      mutateCount();
      mutateRecent();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div style={{ position: "relative" }}>
      <button 
        onClick={() => setOpen(!open)} 
        style={{ position: "relative", color: "var(--text-muted)", display: "flex", alignItems: "center", justifyContent: "center", width: "40px", height: "40px", borderRadius: "50%", background: "var(--bg)", border: "none", cursor: "pointer" }}
      >
        <Bell size={20} />
        {count > 0 && (
          <span style={{ position: "absolute", top: "5px", right: "6px", width: "8px", height: "8px", background: "var(--danger)", borderRadius: "50%", border: "2px solid var(--surface)" }} />
        )}
      </button>

      {open && (
        <div style={{ position: "absolute", top: "100%", right: 0, marginTop: "0.5rem", width: "320px", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius-md)", boxShadow: "var(--shadow-md)", zIndex: 100, overflow: "hidden" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "1rem", borderBottom: "1px solid var(--border)", background: "var(--bg)" }}>
            <h4 style={{ margin: 0, fontSize: "0.95rem" }}>Thông báo</h4>
            <button onClick={handleMarkAllRead} style={{ border: "none", background: "transparent", color: "var(--primary)", fontSize: "0.8rem", cursor: "pointer", fontWeight: 600 }}>Đánh dấu đã đọc</button>
          </div>
          <div style={{ maxHeight: "300px", overflowY: "auto" }}>
            {!recentData ? (
              <div style={{ padding: "1rem", textAlign: "center", fontSize: "0.85rem", color: "var(--text-muted)" }}>Đang tải...</div>
            ) : recentData.length === 0 ? (
              <div style={{ padding: "1rem", textAlign: "center", fontSize: "0.85rem", color: "var(--text-muted)" }}>Không có thông báo mới</div>
            ) : (
              recentData.map((n: any) => (
                <div key={n.id} style={{ padding: "0.75rem 1rem", borderBottom: "1px solid var(--border)", background: n.isRead ? "transparent" : "#F4ECF7" }}>
                  <div style={{ fontSize: "0.85rem", fontWeight: n.isRead ? 400 : 600, color: "var(--text)", marginBottom: "0.25rem" }}>{n.title}</div>
                  <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{new Date(n.createdAt).toLocaleString("vi-VN")}</div>
                </div>
              ))
            )}
          </div>
          <Link href="/notifications" onClick={() => setOpen(false)} style={{ display: "block", textAlign: "center", padding: "0.75rem", fontSize: "0.85rem", color: "var(--primary)", fontWeight: 600, borderTop: "1px solid var(--border)", textDecoration: "none", background: "var(--bg)" }}>
            Xem tất cả thông báo
          </Link>
        </div>
      )}
      
      {/* Click outside overlay */}
      {open && <div style={{ position: "fixed", inset: 0, zIndex: 90 }} onClick={() => setOpen(false)} />}
    </div>
  );
}

export function DashboardShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useCurrentUser();
  const canViewNotifications = user ? hasClientPermission(user.role, "notification.view") : false;
  const [loggingOut, setLoggingOut] = useState(false);

  async function logout() {
    setLoggingOut(true);
    try {
      await apiRequest<{ loggedOut: boolean }>("/api/auth/logout", { method: "POST" });
      window.location.href = "/login";
    } catch {
      window.location.href = "/login";
    }
  }

  useEffect(() => {
    if (!user) return;
    const permittedRoutes = navGroups.flatMap(g => g.items)
      .filter((item) => hasClientPermission(user.role, item.permission))
      .map((item) => item.href);
    for (const route of permittedRoutes) {
      router.prefetch(route);
    }
  }, [router, user]);

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "var(--bg)" }}>
      {/* SIDEBAR */}
      <aside style={{ width: "260px", background: "var(--primary-strong)", color: "#EFE2D2", display: "flex", flexDirection: "column", position: "fixed", top: 0, bottom: 0, left: 0, zIndex: 50 }}>
        <div style={{ padding: "1.5rem", display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <div style={{ width: "32px", height: "32px", background: "var(--accent)", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, color: "white" }}>
            H
          </div>
          <h2 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 700, letterSpacing: "0.02em", color: "white" }}>Quản lý hợp đồng</h2>
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: "0 1rem" }}>
          {navGroups.map((group, gIdx) => {
            const visibleItems = group.items.filter((item) => (user ? hasClientPermission(user.role, item.permission) : false));
            if (visibleItems.length === 0) return null;

            return (
              <div key={gIdx} style={{ marginBottom: "1.5rem" }}>
                {group.title && <h4 style={{ margin: "0 0 0.75rem 0.5rem", fontSize: "0.75rem", fontWeight: 600, color: "rgba(239,226,210,0.5)", letterSpacing: "0.05em" }}>{group.title}</h4>}
                <nav style={{ display: "grid", gap: "0.2rem" }}>
                  {visibleItems.map((item) => {
                    const isActive = pathname === item.href || (item.href !== "/admin/dashboard" && pathname.startsWith(item.href));
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        prefetch
                        onMouseEnter={() => {
                          if (item.prefetchApi) {
                            const fetcher = item.prefetchMethod === "apiRequestEnvelope" ? apiRequestEnvelope : apiRequest;
                            preload(item.prefetchApi, fetcher);
                          }
                        }}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "0.75rem",
                          padding: "0.75rem 1rem",
                          borderRadius: "10px",
                          background: isActive ? "linear-gradient(135deg, var(--accent), #8B5A3C)" : "transparent",
                          color: isActive ? "#ffffff" : "rgba(239,226,210,0.8)",
                          fontWeight: isActive ? 600 : 500,
                          transition: "all 0.2s ease",
                        }}
                      >
                        <span style={{ opacity: isActive ? 1 : 0.7 }}>{item.icon}</span>
                        {item.label}
                      </Link>
                    );
                  })}
                </nav>
              </div>
            );
          })}
        </div>

        {/* USER PROFILE IN SIDEBAR */}
        {user && (
          <div style={{ padding: "1.25rem 1rem", borderTop: "1px solid rgba(255,255,255,0.1)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.75rem", borderRadius: "12px", background: "rgba(0,0,0,0.2)" }}>
              <div style={{ width: "36px", height: "36px", background: "var(--text-muted)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, color: "white" }}>
                {user.name.substring(0, 2).toUpperCase()}
              </div>
              <div style={{ flex: 1, overflow: "hidden" }}>
                <p style={{ margin: 0, fontSize: "0.9rem", fontWeight: 600, color: "white", whiteSpace: "nowrap", textOverflow: "ellipsis", overflow: "hidden" }}>{user.name}</p>
                <p style={{ margin: 0, fontSize: "0.75rem", color: "rgba(255,255,255,0.6)" }}>{user.role}</p>
              </div>
            </div>
          </div>
        )}
      </aside>

      {/* MAIN CONTENT AREA */}
      <section style={{ flex: 1, marginLeft: "260px", display: "flex", flexDirection: "column" }}>
        {/* HEADER */}
        <header
          style={{
            height: "72px",
            background: "var(--surface)",
            borderBottom: "1px solid var(--border)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0 2rem",
            position: "sticky",
            top: 0,
            zIndex: 40,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            <h2 style={{ margin: 0, fontSize: "1.25rem", fontWeight: 600, color: "var(--text)" }}>Tổng quan</h2>
          </div>

          <div style={{ flex: 1, maxWidth: "480px", margin: "0 2rem" }}>
            <div style={{ position: "relative" }}>
              <Search size={18} style={{ position: "absolute", left: "1rem", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
              <input 
                type="text" 
                placeholder="Tìm kiếm hợp đồng, người dùng..." 
                style={{ width: "100%", padding: "0.6rem 1rem 0.6rem 2.8rem", borderRadius: "20px", background: "var(--bg)", border: "1px solid var(--border)", fontSize: "0.9rem" }}
              />
              <div style={{ position: "absolute", right: "0.5rem", top: "50%", transform: "translateY(-50%)", background: "var(--surface)", padding: "0.2rem 0.4rem", borderRadius: "4px", fontSize: "0.7rem", color: "var(--text-muted)", border: "1px solid var(--border)", fontWeight: 600 }}>
                ⌘K
              </div>
            </div>
          </div>

          <div style={{ display: "flex", gap: "1.25rem", alignItems: "center" }}>
            {canViewNotifications && <NotificationBell />}
            
            {user ? (
              <div style={{ display: "flex", alignItems: "center", gap: "1rem", paddingLeft: "1.25rem", borderLeft: "1px solid var(--border)" }}>
                <div style={{ textAlign: "right" }}>
                  <p style={{ margin: 0, fontSize: "0.9rem", fontWeight: 600, color: "var(--text)" }}>{user.name}</p>
                  <p style={{ margin: 0, fontSize: "0.75rem", color: "var(--text-muted)" }}>{user.role}</p>
                </div>
                <div style={{ width: "36px", height: "36px", background: "var(--primary-soft)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, color: "var(--primary)" }}>
                  {user.name.substring(0, 2).toUpperCase()}
                </div>
                <button onClick={() => void logout()} disabled={loggingOut} style={{ background: "transparent", border: "none", padding: "0.5rem", color: "var(--text-muted)", cursor: "pointer", display: "flex" }} title="Đăng xuất">
                  <LogOut size={20} />
                </button>
              </div>
            ) : (
               <span style={{ color: "var(--text-muted)" }}>Khách</span>
            )}
          </div>
        </header>

        {/* DASHBOARD CONTENT */}
        <main style={{ padding: "2rem", maxWidth: "1600px", width: "100%", margin: "0 auto", flex: 1 }}>
          {children}
        </main>
      </section>
    </div>
  );
}
