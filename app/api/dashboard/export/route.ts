import { NextRequest, NextResponse } from "next/server";
import { handleRouteError } from "@/lib/api-response";
import { requireAuth } from "@/lib/auth";
import { getDashboardSummary, getDashboardCharts, getDashboardExpiringContracts } from "@/services/dashboard.service";
import { parseQueryDate } from "@/lib/date";
import { buildCsv } from "@/lib/csv";
import { format } from "date-fns";

export async function GET(request: NextRequest) {
  try {
    const authUser = await requireAuth(request);
    const searchParams = request.nextUrl.searchParams;
    const fromStr = searchParams.get("from");
    const toStr = searchParams.get("to");
    
    const from = fromStr ? parseQueryDate(fromStr) : undefined;
    const to = toStr ? parseQueryDate(toStr) : undefined;

    const [summary, charts, expiring] = await Promise.all([
      getDashboardSummary(authUser, from, to),
      getDashboardCharts(authUser, from, to),
      getDashboardExpiringContracts(authUser, 30, 100)
    ]);

    const headers = ["Chỉ số", "Giá trị"];
    const rows = [
      ["Tổng hợp đồng", summary.totalContracts],
      ["Hợp đồng đang hiệu lực", summary.activeContracts],
      ["Hợp đồng chờ duyệt", summary.pendingContracts],
      ["Hợp đồng sắp hết hạn", summary.expiringSoonContracts],
      ["Hợp đồng đã hết hạn", summary.expiredContracts],
      ["Tổng giá trị hợp đồng (VND)", summary.totalContractValue],
      [],
      ["--- PHÂN BỔ TRẠNG THÁI ---", ""],
    ];

    charts.statusDistribution.forEach(s => {
      rows.push([s.label, s.value]);
    });

    rows.push([]);
    rows.push(["--- PHÂN BỔ ĐỐI TÁC ---", ""]);
    charts.partnerValueDistribution.forEach(p => {
      rows.push([p.partnerName, p.value]);
    });

    rows.push([]);
    rows.push(["--- HỢP ĐỒNG SẮP HẾT HẠN ---", ""]);
    rows.push(["Mã hợp đồng", "Tên hợp đồng", "Đối tác", "Ngày hết hạn", "Trạng thái", "Giá trị", "Số ngày còn lại"]);

    expiring.forEach(c => {
      rows.push([
        c.code,
        c.title,
        c.partnerName,
        c.endDate.toISOString().split("T")[0],
        c.status,
        c.value,
        c.daysLeft
      ]);
    });

    const csvContent = buildCsv(["Cột 1", "Cột 2", "Cột 3", "Cột 4", "Cột 5", "Cột 6", "Cột 7"], rows);
    // Note: buildCsv already prepends BOM for UTF-8 Excel compatibility

    const dateStr = format(new Date(), "yyyyMMdd");
    const filename = `bao-cao-tong-quan-hop-dong-${dateStr}.csv`;

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
