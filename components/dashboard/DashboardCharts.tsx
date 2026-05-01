"use client";

import React from "react";
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { DashboardChartCard } from "./DashboardChartCard";

interface DashboardChartsProps {
  trend: any[];
  distribution: any[];
  valueByMonth: any[];
  totalContracts: number;
}

export default function DashboardCharts({ trend, distribution, valueByMonth, totalContracts }: DashboardChartsProps) {
  return (
    <>
      {/* Trend Chart */}
      <DashboardChartCard title="Xu hướng hợp đồng">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={trend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
            <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "var(--text-muted)" }} dy={10} />
            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "var(--text-muted)" }} />
            <Tooltip contentStyle={{ borderRadius: "8px", border: "none", boxShadow: "var(--shadow-md)" }} />
            <Legend iconType="circle" wrapperStyle={{ fontSize: "12px", paddingTop: "10px" }} />
            <Line type="monotone" name="Hợp đồng mới" dataKey="new" stroke="#4A90E2" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
            <Line type="monotone" name="Hợp đồng hết hạn" dataKey="expired" stroke="var(--danger)" strokeWidth={2} dot={{ r: 4 }} />
            <Line type="monotone" name="Hợp đồng gia hạn" dataKey="renewed" stroke="var(--success)" strokeWidth={2} dot={{ r: 4 }} />
          </LineChart>
        </ResponsiveContainer>
      </DashboardChartCard>

      {/* Distribution Chart */}
      <DashboardChartCard title="Phân bổ hợp đồng theo trạng thái">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={distribution} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={2} dataKey="value" stroke="none">
              {distribution.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip contentStyle={{ borderRadius: "8px", border: "none", boxShadow: "var(--shadow-md)" }} formatter={(value: any, name: any, props: any) => [`${value} (${props.payload.percentage.toFixed(1)}%)`, name]} />
            <Legend iconType="circle" layout="vertical" verticalAlign="middle" align="right" wrapperStyle={{ fontSize: "12px" }} />
          </PieChart>
        </ResponsiveContainer>
        {/* Center Label */}
        <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", textAlign: "center", pointerEvents: "none", marginLeft: "-45px" }}>
          <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", fontWeight: 500 }}>Tổng số</div>
          <div style={{ fontSize: "1.4rem", fontWeight: 700, color: "var(--text)" }}>{totalContracts}</div>
        </div>
      </DashboardChartCard>

      {/* Value Chart */}
      <DashboardChartCard title="Giá trị hợp đồng theo tháng">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={valueByMonth} margin={{ top: 20, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
            <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "var(--text-muted)" }} dy={10} />
            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "var(--text-muted)" }} />
            <Tooltip contentStyle={{ borderRadius: "8px", border: "none", boxShadow: "var(--shadow-md)" }} formatter={(value: any) => [`${value} Tỷ VNĐ`, "Giá trị"]} cursor={{ fill: "rgba(0,0,0,0.04)" }} />
            <Bar dataKey="value" fill="#4A90E2" radius={[4, 4, 0, 0]} barSize={30}>
               {valueByMonth.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={index === valueByMonth.length - 1 ? "#4A90E2" : "#A5C6EA"} />
                ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </DashboardChartCard>
    </>
  );
}
