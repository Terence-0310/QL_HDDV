import Link from "next/link";
import { FileText } from "lucide-react";
import type { MappedDashboardData } from "@/lib/dashboard/dashboard-mapper";

type Props = {
  data: MappedDashboardData["tables"]["expiringContracts"];
};

export function ExpiringContractsTable({ data }: Props) {
  return (
    <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius-md)", padding: "1.25rem", boxShadow: "var(--shadow-sm)", height: "100%", display: "flex", flexDirection: "column" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
        <h3 style={{ margin: 0, fontSize: "1rem", fontWeight: 600 }}>Hợp đồng sắp hết hạn</h3>
        <Link href="/admin/contracts" style={{ fontSize: "0.85rem", color: "#4A90E2", fontWeight: 500 }}>Xem tất cả</Link>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: "1rem", flex: 1 }}>
        {data.map((c) => (
          <div key={c.id} style={{ display: "flex", gap: "1rem", alignItems: "center", paddingBottom: "0.8rem", borderBottom: "1px solid var(--border)" }}>
            <div style={{ background: "#FFF3E0", color: "#E69A2E", padding: "0.5rem", borderRadius: "8px" }}>
              <FileText size={20} />
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ margin: 0, fontSize: "0.85rem", color: "#4A90E2", fontWeight: 500 }}>{c.code}</p>
              <p style={{ margin: "0.1rem 0", fontSize: "0.9rem", fontWeight: 600, color: "var(--text)" }}>{c.name}</p>
              <p style={{ margin: 0, fontSize: "0.8rem", color: "var(--text-muted)" }}>{c.partner}</p>
            </div>
            <div style={{ textAlign: "right" }}>
              <p style={{ margin: 0, fontSize: "0.85rem", color: "var(--text)" }}>{c.expireDate}</p>
              <span style={{ display: "inline-block", marginTop: "0.2rem", padding: "0.2rem 0.6rem", background: "#FFF3E0", color: "#E69A2E", fontSize: "0.75rem", fontWeight: 600, borderRadius: "20px" }}>
                Còn {c.remainingDays} ngày
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
