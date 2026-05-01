# Kế hoạch Nâng Cấp Giao Diện Dashboard (DASHBOARD_UI_UPGRADE)

## 1. File Hiện Tại Đã Quét
- **Layout:** `app/(dashboard)/layout.tsx` -> Sử dụng `components/shared/dashboard-shell.tsx`.
- **Dashboard View:** `app/(dashboard)/admin/dashboard/page.tsx` -> Sử dụng `components/admin/admin-dashboard-view.tsx`.
- **CSS:** `app/globals.css` (chứa các biến CSS màu sắc).
- **API Data:** `GET /api/admin/reports/summary` đang cung cấp dữ liệu số liệu chung. Có thể cần gọi thêm `/api/contracts` để lấy danh sách hợp đồng sắp hết hạn hoặc map mock data nếu cần biểu đồ chi tiết.

## 2. Components Cần Sửa (Update)
- `components/shared/dashboard-shell.tsx`: Cần cập nhật Sidebar (rộng 260px, nền #2B1712), Header (tách biệt), menu có gradient cho active, thẻ User ở dưới cùng.
- `app/globals.css`: Đổi bảng màu sang tone Kem Nâu (Cream Brown) chuẩn theo yêu cầu.
- `components/admin/admin-dashboard-view.tsx`: Thiết kế lại hoàn toàn cấu trúc, bổ sung thẻ Greeting (Hero).

## 3. Components Cần Tạo Mới (New)
- `components/dashboard/DashboardStatCard.tsx`: Thẻ thống kê (5 thẻ).
- `components/dashboard/DashboardChartCard.tsx`: Vỏ bọc chứa biểu đồ Recharts.
- `components/dashboard/ExpiringContractsTable.tsx`: Bảng danh sách 4-5 dòng hợp đồng.
- `components/dashboard/RecentActivities.tsx`: Cột hoạt động gần đây.
- `components/dashboard/PartnerValueDistribution.tsx`: Phân bổ giá trị đối tác.
- `components/dashboard/QuickActions.tsx`: Các nút thao tác nhanh.

## 4. Dữ liệu (Data Adapter)
- **File:** `lib/dashboard/dashboard-mapper.ts`
- Map dữ liệu từ `Summary` hiện tại sang các khối biểu đồ. Fallback mock data an toàn cho biểu đồ line/bar/pie nếu API chưa cung cấp đủ để tránh crash UI.
