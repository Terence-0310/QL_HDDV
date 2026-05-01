# Báo Cáo Hoàn Thành - Dashboard Nâng Cao

## 1. UI (Giao diện người dùng)
- Thiết kế lại trang Tổng quan thành màu **Nâu Kem** (Cream Brown) thanh lịch, đồng nhất với Demo yêu cầu.
- Thêm **Priority Block** tự động hiển thị khi có Hợp đồng sắp hết hạn hoặc quá hạn SLA duyệt.
- Tích hợp biểu đồ thống kê chuyên nghiệp bằng `Recharts` (Xu hướng hợp đồng, Trạng thái, Doanh thu).
- Component **NotificationBell** có menu thả xuống cho phép xem và "Đánh dấu tất cả đã đọc" mà không cần chuyển trang.
- Thêm Loading state, Empty state để cải thiện User Experience.

## 2. API Services
- **`GET /api/dashboard/summary`**: Thống kê số lượng, giá trị hợp đồng (có thể lọc theo thời gian).
- **`GET /api/dashboard/charts`**: Cung cấp dữ liệu phục vụ biểu đồ (phân bổ số lượng/trạng thái/giá trị).
- **`GET /api/dashboard/expiring-contracts`**: Lấy danh sách hợp đồng cảnh báo khẩn cấp.
- **`GET /api/dashboard/recent-activities`**: Truy xuất AuditLog hệ thống để hiển thị luồng hoạt động.
- **`GET /api/dashboard/export`**: Xuất file CSV báo cáo toàn diện (hỗ trợ tiếng Việt UTF-8 BOM, không lỗi font trên Excel).

## 3. Cơ Sở Dữ Liệu
- Mô hình Prisma đã bao gồm các quan hệ đầy đủ giữa `Contract`, `User`, `Notification`, `AuditLog`, `ReminderJob`.
- Không sửa đổi cấu trúc hiện tại một cách phá vỡ, tận dụng AuditLog có sẵn và `requirePermission` theo chuẩn.

## 4. Dữ Liệu Demo (Seed)
- Update `prisma/seed.ts` để sinh ra **30 Hợp đồng mẫu** đa dạng vòng đời: `DRAFT`, `PENDING_APPROVAL`, `APPROVED`, `ACTIVE`, `EXPIRED`, `TERMINATED`, `RENEWED`.
- Phân bổ hợp đồng sắp hết hạn vào các khoảng: **5 ngày, 12 ngày, 30 ngày** (phục vụ test các cảnh báo khẩn cấp trên dashboard).
- Đảm bảo script chay mượt mà, độc lập, không trùng lặp khi chạy lại (`npm run prisma:seed`).

## 5. Xuất Báo Cáo CSV (Export)
- Cung cấp tính năng Xuất báo cáo (CSV) tương thích hoàn toàn trên Microsoft Excel.
- Thông tin xuất bao gồm: Thống kê tổng hợp, Giá trị phân bổ theo Trạng Thái, Phân bổ theo Đối Tác, và Danh sách chi tiết các Hợp đồng sắp hết hạn.

## 6. Kiểm Thử (Testing)
- **Unit Test**: PASS (`tests/unit/dashboard.service.test.ts`).
- **E2E Test**: PASS (`tests/e2e/dashboard.spec.ts`), Playwright tự động chạy quy trình Admin login, filter thời gian, xem dữ liệu, và kiểm thử Overlay của chuông thông báo.
- Pass toàn bộ Quality Checks: `lint`, `typecheck`, `test`, `test:e2e`, và build thành công.

*Toàn bộ mục tiêu đặt ra cho Dashboard đã hoàn tất 100%.*
