"use client";

import Link from "next/link";
import { PlusCircle, Clock, Bell, FileBarChart, Users, Settings } from "lucide-react";
import { useCurrentUser } from "@/hooks/use-current-user";
import { hasClientPermission } from "@/lib/permissions-client";

export function QuickActions() {
  const { user } = useCurrentUser();
  
  const actions = [
    { label: "Tạo hợp đồng mới", icon: <PlusCircle size={20} />, href: "/admin/contracts/new", color: "#4A90E2", bg: "#E6F0FA", permission: "contract.create" },
    { label: "Hàng đợi duyệt", icon: <Clock size={20} />, href: "/admin/approvals", color: "var(--success)", bg: "#E8F6EF", permission: "contract.approve" },
    { label: "Nhắc hạn", icon: <Bell size={20} />, href: "/admin/reminders", color: "var(--warning)", bg: "#FDF5E6", permission: "admin.dashboard.view" },
    { label: "Báo cáo", icon: <FileBarChart size={20} />, href: "/admin/reports", color: "#8E44AD", bg: "#F4ECF7", permission: "report.view" },
    { label: "Người dùng", icon: <Users size={20} />, href: "/admin/users", color: "var(--primary)", bg: "var(--primary-soft)", permission: "user.view" },
    { label: "Cài đặt", icon: <Settings size={20} />, href: "/admin/settings", color: "var(--danger)", bg: "#FAECEC", permission: "admin.dashboard.view" },
  ];

  return (
    <div style={{ marginTop: "1.5rem" }}>
      <h3 style={{ margin: "0 0 1rem 0", fontSize: "1.05rem", fontWeight: 600 }}>Thao tác nhanh</h3>
      <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
        {actions.map((act, idx) => {
          const canView = user ? hasClientPermission(user.role, act.permission as any) : false;
          if (!canView && act.permission !== "admin.dashboard.view") return null;

          return (
            <Link
              key={idx}
              href={act.href}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.6rem",
                padding: "0.6rem 1.2rem",
                background: act.bg,
                color: act.color,
                borderRadius: "var(--radius-sm)",
                fontSize: "0.9rem",
                fontWeight: 600,
                border: `1px solid ${act.bg}`,
                transition: "all 0.2s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.05)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "none";
              }}
            >
              {act.icon}
              {act.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
