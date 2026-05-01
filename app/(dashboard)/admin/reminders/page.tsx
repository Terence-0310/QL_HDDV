import { DashboardShell } from "@/components/shared/dashboard-shell";
import { Hammer } from "lucide-react";

export default function PlaceholderPage() {
  return (
    <DashboardShell>
      <div style={{ padding: "4rem 2rem", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "60vh", background: "var(--surface)", border: "1px dashed var(--border)", borderRadius: "var(--radius-lg)" }}>
        <div style={{ width: "80px", height: "80px", borderRadius: "50%", background: "var(--primary-soft)", color: "var(--primary)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "1.5rem" }}>
          <Hammer size={40} />
        </div>
        <h2 style={{ margin: "0 0 1rem 0", fontSize: "1.8rem", color: "var(--text)" }}>Tính năng đang phát triển</h2>
        <p style={{ maxWidth: "500px", color: "var(--text-muted)", lineHeight: 1.6, fontSize: "1.05rem" }}>
          Phân hệ này đang trong quá trình xây dựng và hoàn thiện. Vui lòng quay lại sau khi chúng tôi cập nhật phiên bản mới nhất của hệ thống.
        </p>
        <a href="/admin/dashboard" style={{ marginTop: "2rem", display: "inline-block", background: "var(--primary)", color: "white", padding: "0.75rem 1.5rem", borderRadius: "var(--radius-sm)", border: "none", cursor: "pointer", fontWeight: 600, fontSize: "1rem", textDecoration: "none" }}>
          Về trang chủ
        </a>
      </div>
    </DashboardShell>
  );
}
