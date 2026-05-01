# Hệ thống Quản lý Hợp đồng - Tính năng Dashboard

## 1. Giới thiệu Tổng quan
Trang Dashboard đóng vai trò là "Trung tâm điều hành" (Command Center) của hệ thống. 
Nó cung cấp cho Administrator và Nhân viên cái nhìn toàn cảnh về tình trạng kinh doanh, số lượng hợp đồng, các hợp đồng cần xử lý gấp (sắp hết hạn, chờ duyệt) và đánh giá đối tác.

## 2. Các API Dashboard
Tất cả API được đặt tại `app/api/dashboard/*`
- `GET /api/dashboard/summary`: Lấy các chỉ số tổng quan (Tổng HĐ, HĐ chờ duyệt, HĐ sắp hết hạn, v.v.)
- `GET /api/dashboard/charts`: Lấy dữ liệu đồ thị (Phân bổ trạng thái, Doanh thu theo tháng, v.v.)
- `GET /api/dashboard/expiring-contracts`: Lấy danh sách hợp đồng sắp hết hạn.
- `GET /api/dashboard/recent-activities`: Lấy log hoạt động gần nhất.
- `GET /api/dashboard/export`: Xuất dữ liệu báo cáo ra file Excel (CSV UTF-8 BOM).

### Logic Filter theo thời gian
Tất cả API (trừ expiring-contracts) hỗ trợ truyền param `?from=YYYY-MM-DD&to=YYYY-MM-DD`. Nếu không truyền, mặc định tính trong 30 ngày gần nhất hoặc tùy logic biểu đồ.

## 3. Thành phần UI
- **Bộ lọc thời gian**: Cho phép lọc nhanh 7 ngày, 30 ngày, 90 ngày, năm nay, hoặc tùy chỉnh.
- **Nút Làm mới**: Refresh lại dữ liệu API không cần F5.
- **Nút Xuất báo cáo**: Gọi API export và tải file CSV.
- **Khối Ưu tiên (Priority Block)**: Chỉ hiển thị khi có sự kiện khẩn cấp (HĐ hết hạn, HĐ chờ duyệt lâu, Nhắc hạn lỗi).
- **Thao tác nhanh**: Liên kết tới tạo hợp đồng, hàng đợi duyệt, quản lý users.

## 4. Kiểm thử
- **Unit Test**: `tests/unit/dashboard.service.test.ts` kiểm tra độ chính xác của logic lấy số liệu.
- **E2E Test**: `tests/e2e/dashboard.spec.ts` kiểm tra luồng UI (Refresh, Export, Filter, Notifications).

## 5. Hướng dẫn Demo với giảng viên
1. Mở trang chủ và Đăng nhập bằng tài khoản `admin@example.com` / `Admin@12345`.
2. Truy cập vào **Tổng quan**. Giới thiệu khối "Ưu tiên xử lý hôm nay" (nhấn mạnh đây là tính năng giúp User không bỏ sót việc).
3. Thử đổi bộ lọc ngày sang "90 ngày qua", quan sát biểu đồ tải lại ngay lập tức nhờ SWR và React Suspense.
4. Nhấn vào biểu tượng "Chuông" ở góc phải để demo hệ thống thông báo Dropdown.
5. Cuộn xuống biểu đồ, nhấn mạnh biểu đồ dùng Recharts đã được Lazy-loaded (next/dynamic) giúp tối ưu bundle JS.
6. Cuối cùng, nhấn "Xuất báo cáo" để minh họa chức năng tải file CSV tương thích Excel.
