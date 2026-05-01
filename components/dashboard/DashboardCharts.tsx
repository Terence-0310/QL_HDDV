"use client";

import React from "react";
import { AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Label } from "recharts";
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
          <AreaChart data={trend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorNew" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#4A90E2" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#4A90E2" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="colorRenew" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10B981" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
            <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "var(--text-muted)" }} dy={10} />
            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "var(--text-muted)" }} />
            <Tooltip contentStyle={{ borderRadius: "12px", border: "1px solid var(--border)", boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)" }} />
            <Legend iconType="circle" wrapperStyle={{ fontSize: "12px", paddingTop: "10px" }} />
            <Area type="monotone" name="Hợp đồng mới" dataKey="new" stroke="#4A90E2" strokeWidth={3} fillOpacity={1} fill="url(#colorNew)" />
            <Area type="monotone" name="Gia hạn" dataKey="renewed" stroke="#10B981" strokeWidth={2} fillOpacity={1} fill="url(#colorRenew)" />
            <Area type="monotone" name="Hết hạn" dataKey="expired" stroke="#EF4444" strokeWidth={2} fill="none" strokeDasharray="4 4" />
          </AreaChart>
        </ResponsiveContainer>
      </DashboardChartCard>

      {/* Distribution Chart */}
      <DashboardChartCard title="Phân bổ hợp đồng theo trạng thái">
        <div style={{ display: "flex", alignItems: "center", height: "100%", width: "100%" }}>
          <div style={{ flex: 1, position: "relative", height: "100%", display: "flex", justifyContent: "center", alignItems: "center" }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie 
                  data={distribution} 
                  cx="50%" cy="50%" 
                  innerRadius={70} 
                  outerRadius={95} 
                  paddingAngle={5} 
                  dataKey="value" 
                  stroke="none"
                  cornerRadius={4}
                >
                  {distribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color || `hsl(${index * 45}, 70%, 50%)`} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: "12px", border: "1px solid var(--border)", boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)" }} formatter={(value: any, name: any, props: any) => [`${value} (${props.payload.percentage.toFixed(1)}%)`, props.payload.label]} />
              </PieChart>
            </ResponsiveContainer>
            {/* Center Label perfectly centered inside flex container */}
            <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", textAlign: "center", pointerEvents: "none" }}>
              <div style={{ fontSize: "0.85rem", color: "var(--text-muted)", fontWeight: 500, marginBottom: "2px" }}>Tổng số</div>
              <div style={{ fontSize: "1.8rem", fontWeight: 800, color: "var(--text)", lineHeight: 1 }}>{totalContracts}</div>
            </div>
          </div>
          
          {/* Custom HTML Legend */}
          <div style={{ paddingLeft: "1rem", minWidth: "120px", display: "flex", flexDirection: "column", gap: "10px" }}>
            {distribution.map((entry, index) => (
              <div key={`legend-${index}`} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ display: "block", width: "12px", height: "12px", borderRadius: "3px", backgroundColor: entry.color || `hsl(${index * 45}, 70%, 50%)` }}></span>
                <div style={{ display: "flex", flexDirection: "column" }}>
                  <span style={{ fontSize: "0.85rem", color: "var(--text)", fontWeight: 600 }}>{entry.label}</span>
                  <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{entry.value} HĐ ({entry.percentage.toFixed(1)}%)</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </DashboardChartCard>

      {/* Value Chart */}
      <DashboardChartCard title="Giá trị hợp đồng theo tháng (Tỷ VNĐ)">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={valueByMonth} margin={{ top: 20, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#4F46E5" stopOpacity={0.9}/>
                <stop offset="100%" stopColor="#818CF8" stopOpacity={0.7}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
            <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "var(--text-muted)" }} dy={10} />
            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "var(--text-muted)" }} />
            <Tooltip 
              contentStyle={{ borderRadius: "12px", border: "1px solid var(--border)", boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)" }} 
              formatter={(value: any) => [`${Number(value).toFixed(2)} Tỷ VNĐ`, "Giá trị"]} 
              cursor={{ fill: "rgba(0,0,0,0.03)" }} 
            />
            <Bar dataKey="value" fill="url(#colorValue)" radius={[6, 6, 0, 0]} maxBarSize={40} />
          </BarChart>
        </ResponsiveContainer>
      </DashboardChartCard>
    </>
  );
}
