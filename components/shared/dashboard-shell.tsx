"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import useSWR, { preload } from "swr";
import { apiRequest, apiRequestEnvelope } from "@/lib/api-client";
import { hasClientPermission } from "@/lib/permissions-client";
import { useCurrentUser } from "@/hooks/use-current-user";

type NavItem = {
  href: string;
  label: string;
  permission: Parameters<typeof hasClientPermission>[1];
  prefetchApi?: string;
  prefetchMethod?: "apiRequest" | "apiRequestEnvelope";
};

const navItems: NavItem[] = [
  { href: "/admin/dashboard", label: "Tổng quan", permission: "admin.dashboard.view", prefetchApi: "/api/admin/reports/summary", prefetchMethod: "apiRequest" },
  { href: "/admin/contracts", label: "Hợp đồng quản trị", permission: "admin.dashboard.view", prefetchApi: "/api/admin/contracts?page=1&pageSize=10", prefetchMethod: "apiRequestEnvelope" },
  { href: "/admin/approvals", label: "Hàng đợi duyệt", permission: "contract.approve", prefetchApi: "/api/admin/approvals?page=1&pageSize=10", prefetchMethod: "apiRequestEnvelope" },
  { href: "/admin/users", label: "Người dùng", permission: "user.view", prefetchApi: "/api/admin/users?page=1&pageSize=10", prefetchMethod: "apiRequestEnvelope" },
  { href: "/admin/reports", label: "Báo cáo", permission: "report.view", prefetchApi: "/api/admin/reports/summary", prefetchMethod: "apiRequest" },
  { href: "/admin/audit-logs", label: "Nhật ký hệ thống", permission: "admin.dashboard.view", prefetchApi: "/api/admin/audit-logs?page=1&pageSize=20", prefetchMethod: "apiRequestEnvelope" },
  { href: "/notifications", label: "Thông báo", permission: "notification.view", prefetchApi: "/api/notifications?page=1&pageSize=10", prefetchMethod: "apiRequestEnvelope" },
];

function NotificationBell() {
  const { data } = useSWR<{ unreadCount: number }>(
    "/api/notifications/unread-count",
    apiRequest,
    { refreshInterval: 30_000 }
  );
  const count = data?.unreadCount ?? 0;

  return (
    <Link
      href="/notifications"
      prefetch
      style={{ fontWeight: 700, color: "var(--primary)", display: "inline-flex", alignItems: "center", gap: "0.35rem" }}
    >
      Thông báo ({count})
    </Link>
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
    const permittedRoutes = navItems
      .filter((item) => hasClientPermission(user.role, item.permission))
      .map((item) => item.href);
    for (const route of permittedRoutes) {
      router.prefetch(route);
    }
  }, [router, user]);

  return (
    <div style={{ display: "grid", gridTemplateColumns: "260px 1fr", minHeight: "100vh" }}>
      <aside style={{ background: "linear-gradient(180deg, #4e342e 0%, #3e2723 100%)", color: "#f8f3f0", padding: "1rem" }}>
        <h2 style={{ marginTop: 0, fontSize: "1rem", letterSpacing: "0.02em" }}>Quản lý hợp đồng</h2>
        <nav style={{ display: "grid", gap: "0.5rem", marginTop: "1rem" }}>
          {navItems
            .filter((item) => (user ? hasClientPermission(user.role, item.permission) : false))
            .map((item) => (
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
                  padding: "0.55rem 0.6rem",
                  borderRadius: "0.6rem",
                  background: pathname === item.href ? "rgba(255, 255, 255, 0.16)" : "transparent",
                  border: pathname === item.href ? "1px solid rgba(255,255,255,0.24)" : "1px solid transparent",
                  transition: "all 0.15s ease",
                }}
              >
                {item.label}
              </Link>
            ))}
        </nav>
      </aside>
      <section>
        <header
          style={{
            height: "64px",
            background: "var(--surface)",
            borderBottom: "1px solid var(--border)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0 1.2rem",
          }}
        >
          <strong style={{ color: "var(--primary)" }}>Cổng quản trị nội bộ</strong>
          <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
            {canViewNotifications && <NotificationBell />}
            <span style={{ color: "var(--text-muted)" }}>{user ? `${user.name} (${user.role})` : "Khách"}</span>
            {user ? (
              <button onClick={() => void logout()} disabled={loggingOut}>
                {loggingOut ? "Đang đăng xuất..." : "Đăng xuất"}
              </button>
            ) : null}
          </div>
        </header>
        <main style={{ padding: "1.2rem", maxWidth: "1400px" }}>{children}</main>
      </section>
    </div>
  );
}
