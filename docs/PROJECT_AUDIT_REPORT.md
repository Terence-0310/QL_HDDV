# Báo cáo Audit Dự án Quản lý Hợp đồng Điện tử

**Ngày Audit:** Tháng 5/2026
**Mục tiêu:** Rà soát toàn bộ cấu trúc dự án, chức năng đã hoàn thành, những tồn đọng (bug/rủi ro) và các điểm cần hoàn thiện theo thiết kế hệ thống.

## 1. Cấu trúc thư mục (Directory Structure)
- `app/`: Next.js App Router.
  - `(dashboard)/`: Giao diện hệ thống sau khi đăng nhập (Admin/Staff/User).
  - `api/`: Các endpoint API RESTful.
  - `login/`, `register/`: Các trang xác thực ngoài luồng.
- `components/`: Các React component tái sử dụng (admin, notifications, shared, v.v.).
- `lib/`: Các tiện ích cấu hình (Prisma, Auth, CSRF, Logger, Rate-limit, Date, Zod validators).
- `services/`: Tầng business logic thao tác với DB (auth, admin, audit, contract, mail, notification, queue, reminder, report).
- `prisma/`: Chứa file `schema.prisma` và `seed.ts` để sinh dữ liệu mẫu.
- `tests/`: Bộ kiểm thử tự động.
  - `unit/`: Unit tests (Vitest).
  - `e2e/`: E2E tests (Playwright).
- `docs/`: Tài liệu dự án.

## 2. Chức năng đã có (Completed Features)
1. **Nền tảng (Phase 1):** Auth/session bằng JWT HttpOnly cookie, middleware bảo vệ route, Role-based Access Control (Admin/Staff/User), chuẩn hoá Error/Success API responses.
2. **Quản lý Hợp đồng (Phase 2):** Liệt kê, xem chi tiết, tìm kiếm, tạo mới, tải file PDF, tải xuống hợp đồng.
3. **Phê duyệt (Phase 3):** Luồng trạng thái hoàn chỉnh (DRAFT -> Gửi duyệt -> Approve/Reject -> ACTIVE).
4. **Nhắc mốc gia hạn (Phase 4):** Worker chạy ngầm, gửi thông báo khi hợp đồng sắp hết hạn (30/15/7 ngày).
5. **Dashboard & Report (Phase 5):** Thống kê số lượng theo trạng thái, ưu tiên công việc, xuất báo cáo CSV mã hoá UTF-8 BOM chống lỗi font.
6. **Thông báo (Phase 6):** Notification Center hiển thị badge, đọc thông báo theo thời gian thực.
7. **Quản trị người dùng (Phase 7):** Quản lý tài khoản, thay đổi quyền, khoá/mở tài khoản, ghi nhận Audit Log.
8. **UI/UX (Phase 8):** Bố cục hiện đại với Next.js, Glassmorphism, Responsive UI chuyên nghiệp.
9. **Kiểm thử tự động (Phase 9):** Unit test cho logic ngầm (Workers/Cron/Mail) và E2E test cho toàn bộ luồng nghiệp vụ.
10. **Tài liệu dự án (Phase 10):** Có sẵn kịch bản chạy thử nghiệm và cấu trúc API rõ ràng.
11. **Dữ liệu mẫu (Phase 11):** Seed script sinh sẵn tài khoản Admin, Staff, User và hàng chục hợp đồng giả lập trạng thái phong phú.
12. **Bảo mật:** CSRF Tokens, Rate Limiting.

## 3. Chức năng còn thiếu / Khả năng nâng cấp
- **Tích hợp Object Storage (S3/Cloudinary):** Hiện tại file upload đang lưu ở local file system (`public/uploads`), cần nâng cấp lưu trữ Cloud nếu đưa lên Production.
- **WebSocket/SSE (Server-Sent Events):** Hiện tại thông báo sử dụng Polling/SWR. Cần nâng cấp WebSocket để realtime 100%.
- **Chữ ký số (Digital Signature):** Tích hợp CA Token hoặc eSign cho phép ký hợp đồng trực tiếp thay vì chỉ duyệt nội bộ.
- **Email Service thật:** Hiện tại Email đang được giả lập (Mocked) thông qua Logger.

## 4. Rủi ro / Bugs đã phát hiện & khắc phục
- **Bug đã fix:**
  - Lỗi CSRF Token trên Playwright E2E (`x-csrf-token`).
  - Lỗi `user` undefined trong Reminder Queue Service.
  - Lỗi trình duyệt lưu cookie JWT cũ sau khi Database bị reset (Gây kẹt giao diện dashboard trắng). Đã fix bằng cách bắt mã lỗi 401 trên API `/auth/me` và tự động clear cookie, redirect về `/login`.
- **Rủi ro hiện tại:**
  - Lệnh `next lint` sắp lỗi thời ở Next.js 16, cần lưu ý chuyển sang ESLint CLI ở bản update tương lai.

## 5. API Hiện có
- **Auth:** `POST /api/auth/login`, `POST /api/auth/register`, `POST /api/auth/logout`, `GET /api/auth/me`
- **Contracts:** `GET /api/contracts`, `POST /api/contracts`, `POST /api/contracts/:id/submit-approval`, `POST /api/contracts/:id/approve`, v.v.
- **Admin:** `GET /api/admin/users`, `POST /api/admin/users/:id/role`, `GET /api/admin/reports/summary`, `GET /api/admin/reports/export`
- **Reminders:** `GET /api/reminders/preview`, `POST /api/reminders/run`
- **Notifications:** `GET /api/notifications`, `POST /api/notifications/read-all`

## 6. Checklist Hoàn Thiện (100% DONE)
- [x] Code Quality (Typecheck, Lint)
- [x] Pass 100% Tests (Unit & E2E)
- [x] Prisma Migration sync
- [x] Production Build
- [x] Documentation & Seed Data
