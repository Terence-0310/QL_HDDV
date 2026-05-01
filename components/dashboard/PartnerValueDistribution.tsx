import Link from "next/link";
import type { MappedDashboardData } from "@/lib/dashboard/dashboard-mapper";

type Props = {
  data: Array<{
    partnerName?: string;
    partner?: string;
    value: number;
    percentage: number;
  }>;
};

export function PartnerValueDistribution({ data }: Props) {
  return (
    <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius-md)", padding: "1.25rem", boxShadow: "var(--shadow-sm)", height: "100%", display: "flex", flexDirection: "column" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
        <h3 style={{ margin: 0, fontSize: "1rem", fontWeight: 600 }}>Phân bổ giá trị theo đối tác</h3>
        <Link href="/admin/reports" style={{ fontSize: "0.85rem", color: "#4A90E2", fontWeight: 500 }}>Xem tất cả</Link>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: "1.2rem", flex: 1, marginTop: "0.5rem" }}>
        {data.map((p, idx) => (
          <div key={idx}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "0.4rem" }}>
              <Link href={`/admin/contracts?search=${encodeURIComponent(p.partnerName || p.partner || "")}`} style={{ fontSize: "0.85rem", fontWeight: 500, color: "var(--primary)", textDecoration: "none" }}>
                {p.partnerName || p.partner || "Không rõ đối tác"}
              </Link>
              <div style={{ textAlign: "right" }}>
                <span style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--text)" }}>{(p.value / 1_000_000_000).toFixed(2)} Tỷ VNĐ</span>
                <span style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginLeft: "0.75rem", minWidth: "40px", display: "inline-block" }}>{p.percentage}%</span>
              </div>
            </div>
            <div style={{ width: "100%", height: "6px", background: "var(--primary-soft)", borderRadius: "3px", overflow: "hidden" }}>
              <div style={{ width: `${p.percentage}%`, height: "100%", background: "linear-gradient(90deg, var(--accent), var(--primary))", borderRadius: "3px" }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
