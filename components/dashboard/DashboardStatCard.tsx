import { ReactNode } from "react";
import { TrendingUp, TrendingDown } from "lucide-react";
import Link from "next/link";

type Props = {
  icon: ReactNode;
  label: string;
  value: number | string;
  change: number;
  hint: string;
  trendMode?: "positive-is-good" | "negative-is-good"; // e.g. more expired contracts is bad
  href?: string;
};

export function DashboardStatCard({ icon, label, value, change, hint, trendMode = "positive-is-good", href }: Props) {
  const isPositive = change > 0;
  let isGood = isPositive;
  if (trendMode === "negative-is-good") isGood = !isPositive;
  if (change === 0) isGood = true; // Neutral

  const trendColor = isGood ? "var(--success)" : "var(--danger)";

  const content = (
    <div
      style={{
        background: "var(--surface)",
        border: "1px solid var(--border)",
        borderRadius: "var(--radius-md)",
        padding: "1.25rem",
        display: "flex",
        alignItems: "center",
        gap: "1rem",
        boxShadow: "var(--shadow-sm)",
        transition: "all 0.2s ease",
        cursor: href ? "pointer" : "default",
      }}
      className={`stat-card ${href ? "stat-card-clickable" : ""}`}
      onMouseEnter={(e) => { if (href) e.currentTarget.style.transform = "translateY(-2px)"; }}
      onMouseLeave={(e) => { if (href) e.currentTarget.style.transform = "translateY(0)"; }}
    >
      <div
        style={{
          width: "56px",
          height: "56px",
          borderRadius: "50%",
          background: "var(--primary-soft)",
          color: "var(--primary)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {icon}
      </div>
      <div style={{ flex: 1 }}>
        <p style={{ margin: 0, color: "var(--text-muted)", fontSize: "0.85rem", fontWeight: 500 }}>{label}</p>
        <div style={{ display: "flex", alignItems: "baseline", gap: "0.5rem", marginTop: "0.25rem" }}>
          <h3 style={{ margin: 0, fontSize: "1.75rem", fontWeight: 700, color: "var(--text)" }}>{value}</h3>
          <span style={{ fontSize: "0.85rem", fontWeight: 600, color: trendColor, display: "flex", alignItems: "center" }}>
            {isPositive ? <TrendingUp size={14} style={{ marginRight: 2 }} /> : <TrendingDown size={14} style={{ marginRight: 2 }} />}
            {Math.abs(change)}%
          </span>
        </div>
        <p style={{ margin: "0.2rem 0 0", fontSize: "0.75rem", color: "var(--text-muted)" }}>{hint}</p>
      </div>
    </div>
  );

  if (href) {
    return (
      <Link href={href} style={{ textDecoration: "none", color: "inherit", display: "block" }}>
        {content}
      </Link>
    );
  }

  return content;
}
