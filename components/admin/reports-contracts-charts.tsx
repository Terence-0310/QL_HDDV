"use client";

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";
import { FileText } from "lucide-react";

export default function ReportsContractsCharts({ summary }: { summary: any }) {
  if (!summary) return null;

  const statusChartData = [
    { name: "Đang hiệu lực", value: summary.activeContracts, color: "#10B981" },
    { name: "Sắp hết hạn", value: summary.expiringSoonContracts, color: "#F59E0B" },
    { name: "Đã hết hạn", value: summary.expiredContracts, color: "#EF4444" },
    { name: "Khác (Nháp/Chấm dứt)", value: Math.max(0, summary.totalContracts - summary.activeContracts - summary.expiringSoonContracts - summary.expiredContracts), color: "#6B7280" },
  ];

  const approvalChartData = [
    { name: "Chờ duyệt", value: summary.pendingApprovalContracts, fill: "#F59E0B" },
    { name: "Đã duyệt", value: summary.approvedContracts, fill: "#10B981" },
    { name: "Từ chối", value: summary.rejectedContracts, fill: "#EF4444" },
  ];

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(350px, 1fr))", gap: "1.5rem", marginBottom: "2rem" }}>
      <div className="card" style={{ padding: "1.5rem" }}>
        <h3 style={{ margin: "0 0 1rem 0", fontSize: "1.1rem", color: "var(--text)", display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <FileText size={18} color="var(--primary)" /> Phân bổ Trạng thái
        </h3>
        <div style={{ height: 250 }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={statusChartData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={90}
                paddingAngle={5}
                dataKey="value"
                label={({ name, percent }) => (percent && percent > 0) ? `${name} ${(percent * 100).toFixed(0)}%` : ""}
              >
                {statusChartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => [`${value} hợp đồng`, "Số lượng"]} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="card" style={{ padding: "1.5rem" }}>
        <h3 style={{ margin: "0 0 1rem 0", fontSize: "1.1rem", color: "var(--text)", display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <FileText size={18} color="var(--primary)" /> Phân bổ Phê duyệt
        </h3>
        <div style={{ height: 250 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={approvalChartData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
              <XAxis dataKey="name" tick={{ fill: "var(--text-muted)" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "var(--text-muted)" }} axisLine={false} tickLine={false} />
              <Tooltip cursor={{ fill: "var(--surface)" }} formatter={(value) => [`${value} hợp đồng`, "Số lượng"]} />
              <Bar dataKey="value" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
