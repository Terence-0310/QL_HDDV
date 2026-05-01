# Nhật Ký Hoàn Thiện Dự Án (Changelog Completion)

File này ghi nhận toàn bộ tiến trình hoàn thiện 12 Phase của dự án "Hệ thống quản lý hợp đồng điện tử và nhắc mốc gia hạn".

## Phase 1 — Ổn định nền tảng (Hoàn thành)
- Tái cấu trúc luồng xác thực bằng JWT (HttpOnly Cookie).
- Cài đặt Middleware tự động phát hiện mọi request đến `/admin/*` và `/notifications/*` để redirect người dùng chưa đăng nhập.
- Viết lại hàm `useCurrentUser` để tự động dọn dẹp Cookie hỏng (HTTP 401) và tránh lỗi kẹt giao diện.
- Bổ sung CSRF bảo vệ toàn bộ API dùng phương thức `POST/PUT/DELETE`.

## Phase 2 — Quản lý hợp đồng (Hoàn thành)
- Hoàn thiện đầy đủ bộ API CRUD cho Hợp đồng.
- Chuẩn hoá `schema.prisma` khớp hoàn toàn với ERD (Thêm `Partner`, `ContractType`).
- Validate chặt chẽ dữ liệu đầu vào (Zod Schema: ngày ký <= ngày hiệu lực <= ngày hết hạn).

## Phase 3 — Quy trình phê duyệt (Hoàn thành)
- Đảm bảo luồng trạng thái chuẩn: `DRAFT` -> `SUBMITTED` -> `APPROVED` / `REJECTED`.
- Bổ sung UI nút bấm điều hướng và Timeline lịch sử duyệt.
- Tự động sinh `Notification` khi Hợp đồng đổi trạng thái phê duyệt.

## Phase 4 — Nhắc mốc gia hạn (Hoàn thành)
- Đồng bộ `ReminderJob` thay vì `ReminderMilestone`.
- Áp dụng logic lọc ngày kết thúc hợp đồng (`endDate`) trừ đi các mốc giới hạn (30/15/7 ngày) để sinh Job nhắc nhở.
- Xử lý Dead-letter Queue (huỷ job) và Retry khi gửi thư lỗi.
- Xây dựng giao diện xem trước (Preview) và Nút chạy (Run) worker nhắc hạn trực tiếp từ Admin Dashboard.

## Phase 5 — Dashboard & Report (Hoàn thành)
- Xây dựng Admin Dashboard chuyên nghiệp (Sử dụng CSS Glassmorphism kết hợp Lucide-react icons).
- Hiển thị 10 thẻ thống kê chi tiết (Tổng hợp đồng, Hợp đồng hết hạn, Nhắc hạn lỗi...).
- Tính năng xuất File CSV với bộ mã hoá `UTF-8 BOM` giúp Excel hiển thị tiếng Việt mượt mà.

## Phase 6 — Notification Center (Hoàn thành)
- Popover/Dropdown thông báo hiển thị Unread Badge góc phải trên cùng.
- API đánh dấu đã đọc (`read-all` và `read-id`).
- Tích hợp Polling SWR tự động làm mới số lượng thông báo mỗi 30s.

## Phase 7 — Admin User Management + RBAC (Hoàn thành)
- Thiết lập quyền hành chặt chẽ dựa trên 3 Role: `ADMIN`, `STAFF`, `USER`.
- Cấm User can thiệp vào các API tạo, duyệt, xoá.
- Cấm Admin tự block tài khoản của chính mình.
- Lưu trữ mọi thao tác thay đổi trạng thái user vào `AuditLog`.

## Phase 8 — UI/UX Chỉnh chu (Hoàn thành)
- Chuyển toàn bộ Theme từ Xanh dương (Blue) sang tone Nâu đỏ/Trắng sữa (Warm Earthy/Coffee tone) thể hiện sự nghiêm túc, doanh nghiệp.
- Màn hình Table có Empty State "Không có dữ liệu".
- Xoá bỏ màn hình hiển thị lỗi "Bạn chưa đăng nhập" vô duyên bằng cơ chế chuyển hướng (Redirect) ngay tại lõi hệ thống.

## Phase 9 — Testing Chuẩn Đồ Án (Hoàn thành)
- Viết 20 bộ Unit tests (bao phủ CSV, Upload, Reminder Worker, Permissions).
- Viết 6 kịch bản E2E Playwright test (Auth, Contracts, Approval, Reminder, Report).
- Tất cả các test đều vượt qua 100% (Coverage đạt 15-80% tuỳ module, đủ điều kiện CI/CD).

## Phase 10 — Documentation (Hoàn thành)
- Cập nhật toàn bộ tài liệu dự án, bao gồm cả tài liệu Audit, Kế hoạch Test, Script Demo và Changelog.

## Phase 11 — Seed Data (Hoàn thành)
- Tối ưu `seed.ts` không sinh ra cảnh báo rác.
- Mặc định khởi tạo 3 tài khoản mẫu với mật khẩu chung `Admin@12345`, `Staff@12345`, `User@12345`.
- Sinh 20 hợp đồng ảo rải rác đủ mọi loại trạng thái (Sắp hết hạn, Chờ duyệt, v.v.).

## Phase 12 — Final Quality Gate (Hoàn thành)
- Lệnh `npm run lint`: Không có lỗi.
- Lệnh `npm run typecheck`: TypeScript hợp lệ hoàn toàn.
- Lệnh `npm run test` & `npm run test:e2e`: Pass 100%.
- Lệnh `npm run build`: Tạo bản build Production thành công rực rỡ.
