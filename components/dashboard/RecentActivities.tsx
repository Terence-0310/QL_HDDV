import Link from "next/link";
import { User, CheckCircle, XCircle, Bell, Edit } from "lucide-react";
import type { MappedDashboardData } from "@/lib/dashboard/dashboard-mapper";

type Props = {
  data: MappedDashboardData["tables"]["recentActivities"];
};

export function RecentActivities({ data }: Props) {
  const getIcon = (type: string) => {
    switch (type) {
      case "create": return <User size={16} color="#4A90E2" />;
      case "approve": return <CheckCircle size={16} color="var(--success)" />;
      case "reject": return <XCircle size={16} color="var(--danger)" />;
      case "remind": return <Bell size={16} color="var(--warning)" />;
      case "update": return <Edit size={16} color="#8E44AD" />;
      default: return <User size={16} />;
    }
  };

  const getBg = (type: string) => {
    switch (type) {
      case "create": return "#E6F0FA";
      case "approve": return "#E8F6EF";
      case "reject": return "#FAECEC";
      case "remind": return "#FDF5E6";
      case "update": return "#F4ECF7";
      default: return "#eee";
    }
  };

  return (
    <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius-md)", padding: "1.25rem", boxShadow: "var(--shadow-sm)", height: "100%", display: "flex", flexDirection: "column" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
        <h3 style={{ margin: 0, fontSize: "1rem", fontWeight: 600 }}>Hoạt động gần đây</h3>
        <Link href="/admin/audit-logs" style={{ fontSize: "0.85rem", color: "#4A90E2", fontWeight: 500 }}>Xem tất cả</Link>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: "1.2rem", flex: 1 }}>
        {data.map((act) => (
          <div key={act.id} style={{ display: "flex", gap: "0.85rem", alignItems: "flex-start" }}>
            <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: getBg(act.type), display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              {getIcon(act.type)}
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ margin: 0, fontSize: "0.85rem", color: "var(--text)", lineHeight: 1.4 }}>
                <span style={{ fontWeight: 600 }}>{act.user}</span> {act.action} <span style={{ fontWeight: 600 }}>{act.contract}</span>
              </p>
            </div>
            <span style={{ fontSize: "0.8rem", color: "var(--text-muted)", whiteSpace: "nowrap" }}>{act.time}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
