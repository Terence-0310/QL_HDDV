export type MappedDashboardData = {
  stats: {
    totalContracts: { value: number; change: number };
    activeContracts: { value: number; change: number };
    expiringSoon: { value: number; change: number };
    expiredContracts: { value: number; change: number };
    totalValue: { value: number; change: number };
  };
  charts: {
    trend: Array<{ month: string; new: number; expired: number; renewed: number }>;
    distribution: Array<{ name: string; value: number; color: string; percentage: number }>;
    valueByMonth: Array<{ month: string; value: number }>;
  };
  tables: {
    expiringContracts: Array<{ id: string; code: string; name: string; partner: string; expireDate: string; remainingDays: number }>;
    recentActivities: Array<{ id: string; user: string; action: string; contract: string; time: string; type: "create" | "approve" | "reject" | "remind" | "update" }>;
    partnerValues: Array<{ partner: string; value: number; percentage: number }>;
  };
};

// Fallback Mock Data Generator based on real Summary totals
export function mapDashboardData(summary: any | null): MappedDashboardData {
  const baseTotal = summary?.totalContracts || 156;
  const baseActive = summary?.activeContracts || 98;
  const baseExpiringSoon = summary?.expiringSoonContracts || 24;
  const baseExpired = summary?.expiredContracts || 7;
  const basePending = summary?.pendingApprovalContracts || 15;
  
  // Calculate mock value (e.g. 1 contract ~ 0.15 Tỷ)
  const totalValue = +(baseTotal * 0.157).toFixed(1);

  return {
    stats: {
      totalContracts: { value: baseTotal, change: 12.5 },
      activeContracts: { value: baseActive, change: 8.3 },
      expiringSoon: { value: baseExpiringSoon, change: 20.0 },
      expiredContracts: { value: baseExpired, change: -12.5 }, // negative meaning bad if increased? Actually +12.5% in red is bad. We'll just pass absolute.
      totalValue: { value: totalValue, change: 15.3 },
    },
    charts: {
      trend: [
        { month: "T12/2023", new: Math.floor(baseTotal * 0.1), expired: 2, renewed: 8 },
        { month: "T1/2024", new: Math.floor(baseTotal * 0.14), expired: 4, renewed: 12 },
        { month: "T2/2024", new: Math.floor(baseTotal * 0.12), expired: 3, renewed: 11 },
        { month: "T3/2024", new: Math.floor(baseTotal * 0.16), expired: 6, renewed: 16 },
        { month: "T4/2024", new: Math.floor(baseTotal * 0.15), expired: 4, renewed: 12 },
        { month: "T5/2024", new: Math.floor(baseTotal * 0.17), expired: 5, renewed: 14 },
      ],
      distribution: [
        { name: "Đang hiệu lực", value: baseActive, color: "#2FA66A", percentage: (baseActive/baseTotal)*100 },
        { name: "Sắp hết hạn", value: baseExpiringSoon, color: "#E69A2E", percentage: (baseExpiringSoon/baseTotal)*100 },
        { name: "Đã hết hạn", value: baseExpired, color: "#E05252", percentage: (baseExpired/baseTotal)*100 },
        { name: "Chờ phê duyệt", value: basePending, color: "#4A90E2", percentage: (basePending/baseTotal)*100 },
        { name: "Đã hủy", value: Math.max(0, baseTotal - baseActive - baseExpiringSoon - baseExpired - basePending), color: "#9E9E9E", percentage: ((baseTotal - baseActive - baseExpiringSoon - baseExpired - basePending)/baseTotal)*100 },
      ],
      valueByMonth: [
        { month: "T12/2023", value: +(totalValue * 0.5).toFixed(1) },
        { month: "T1/2024", value: +(totalValue * 0.76).toFixed(1) },
        { month: "T2/2024", value: +(totalValue * 0.62).toFixed(1) },
        { month: "T3/2024", value: +(totalValue * 0.82).toFixed(1) },
        { month: "T4/2024", value: +(totalValue * 0.93).toFixed(1) },
        { month: "T5/2024", value: totalValue },
      ],
    },
    tables: {
      expiringContracts: [
        { id: "1", code: "HD-2024-00125", name: "Hợp đồng cung cấp thiết bị", partner: "Công ty TNHH ABC", expireDate: "15/06/2024", remainingDays: 15 },
        { id: "2", code: "HD-2024-00126", name: "Hợp đồng dịch vụ bảo trì", partner: "Công ty Cổ phần XYZ", expireDate: "20/06/2024", remainingDays: 20 },
        { id: "3", code: "HD-2024-00127", name: "Hợp đồng thuê văn phòng", partner: "Công ty TNHH DEF", expireDate: "25/06/2024", remainingDays: 25 },
        { id: "4", code: "HD-2024-00128", name: "Hợp đồng cung cấp phần mềm", partner: "Công ty Cổ phần GHI", expireDate: "30/06/2024", remainingDays: 30 },
      ],
      recentActivities: [
        { id: "1", user: "Nguyễn Văn A", action: "đã tạo hợp đồng mới", contract: "HD-2024-00129", time: "2 phút trước", type: "create" },
        { id: "2", user: "Trần Thị B", action: "đã phê duyệt hợp đồng", contract: "HD-2024-00120", time: "15 phút trước", type: "approve" },
        { id: "3", user: "Lê Văn C", action: "đã từ chối hợp đồng", contract: "HD-2024-00118", time: "1 giờ trước", type: "reject" },
        { id: "4", user: "Hệ thống", action: "đã gửi nhắc hạn hợp đồng", contract: "HD-2024-00115", time: "2 giờ trước", type: "remind" },
        { id: "5", user: "Phạm Thị D", action: "đã cập nhật hợp đồng", contract: "HD-2024-00110", time: "3 giờ trước", type: "update" },
      ],
      partnerValues: [
        { partner: "Công ty TNHH ABC", value: +(totalValue * 0.347).toFixed(1), percentage: 34.7 },
        { partner: "Công ty Cổ phần XYZ", value: +(totalValue * 0.253).toFixed(1), percentage: 25.3 },
        { partner: "Công ty TNHH DEF", value: +(totalValue * 0.167).toFixed(1), percentage: 16.7 },
        { partner: "Công ty Cổ phần GHI", value: +(totalValue * 0.155).toFixed(1), percentage: 15.5 },
        { partner: "Khác", value: +(totalValue * 0.078).toFixed(1), percentage: 7.8 },
      ],
    }
  };
}
