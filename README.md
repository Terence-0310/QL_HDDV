# HỆ THỐNG QUẢN LÝ HỢP ĐỒNG ĐIỆN TỬ VÀ NHẮC MỐC GIA HẠN

Dự án phát triển phần mềm nội bộ giúp doanh nghiệp số hoá quy trình lưu trữ, phê duyệt và giám sát thời hạn hợp đồng tự động. 

## 1. Công nghệ & Stack (Tech Stack)
- **Frontend:** Next.js 15 (App Router), React, CSS Modules / CSS Variables (Glassmorphism design).
- **Backend:** Next.js API Routes.
- **Cơ sở dữ liệu:** SQLite (Dev/Local), Prisma ORM.
- **Bảo mật:** JWT (JSON Web Tokens) với HttpOnly Cookie, CSRF Token Header Validation, Role-Based Access Control (RBAC).
- **Kiểm thử tự động (CI/CD):** Vitest (Unit Tests), Playwright (E2E Tests), Github Actions.
- **Tài liệu:** Thư mục `/docs/` (Test Plan, Audit Report, API Ref...).

## 2. Các Chức Năng Cốt Lõi (Core Features)
- **Quản lý Hợp Đồng:** Thêm, xem, sửa, xoá, đính kèm file (PDF), tìm kiếm/lọc.
- **Phê Duyệt Đa Bước:** Gửi phê duyệt, Đồng ý/Từ chối có lý do. Lịch sử duyệt (Approval History).
- **Nhắc Hạn Thông Minh:** Worker chạy ngầm (Cron Job giả lập) liên tục quét CSDL để lấy ra những hợp đồng sắp đến hạn (7/15/30 ngày) và ném Job vào Queue, gửi thư cảnh báo đến đối tác. Có cơ chế Retry & Dead-letter Queue.
- **Báo cáo Thống Kê (Dashboard):** Giao diện phân tích chỉ số, sức khoẻ hợp đồng. Trích xuất (Export) dữ liệu ra CSV có mã hoá Tiếng Việt.
- **Trung Tâm Thông Báo (Notification Center):** Thông báo Notification Real-time khi hợp đồng có biến động.

## 3. Cài Đặt Nhanh (Quick Start)

### Yêu cầu
- Node.js (v18 trở lên)

### Khởi chạy dự án
```bash
# 1. Cài đặt các thư viện
npm install

# 2. Sinh Prisma Client
npx prisma generate

# 3. Chạy Migration (Khởi tạo Database SQLite)
npx prisma migrate dev

# 4. Khởi tạo dữ liệu mẫu (Tài khoản, hợp đồng ảo)
npm run prisma:seed

# 5. Khởi động Web Server
npm run dev
```

Truy cập hệ thống tại: `http://localhost:3000`

### Tài khoản Demo
- **Admin:** `admin@example.com` / `Admin@12345`
- **Staff:** `staff@example.com` / `Staff@12345`
- **User:** `user@example.com` / `User@12345`

## 4. Các Lệnh Hỗ Trợ (Commands)
```bash
# Khởi chạy Code Linter
npm run lint

# Kiểm tra kiểu dữ liệu (TypeScript)
npm run typecheck

# Chạy Unit Test
npm run test

# Chạy E2E Test
npm run test:e2e

# Build ứng dụng Production
npm run build
```

## 5. Tài Liệu Tham Khảo (Documentation)
Toàn bộ tài liệu phân tích và báo cáo lỗi nằm trong thư mục `/docs/`.
- `docs/PROJECT_AUDIT_REPORT.md`: Báo cáo rà soát tiến độ.
- `docs/CHANGELOG_COMPLETION.md`: Nhật ký các Phase.
- `docs/api.md`: Cấu trúc API RESTful.
- `docs/testing.md`, `docs/TEST_PLAN.md`, `docs/TEST_CASES.md`: Bộ kiểm thử tự động.
- `docs/demo-script.md`: Kịch bản trình diễn.
- `docs/BUG_REPORT.md`: Danh sách lỗi.

---
**Nhóm phát triển:** Terence-0310
