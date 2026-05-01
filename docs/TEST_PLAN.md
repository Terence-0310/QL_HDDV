# Kế Hoạch Kiểm Thử (Test Plan)

## 1. Mục Tiêu
Đảm bảo Hệ thống Quản lý hợp đồng điện tử và nhắc mốc gia hạn hoạt động ổn định, chính xác, không xảy ra lỗi nghiêm trọng (Fatal Errors) trong các nghiệp vụ cốt lõi trước khi trình chiếu Demo và đưa vào sử dụng thực tế.

## 2. Phạm Vi Kiểm Thử
- **Unit Testing (Vitest):**
  - Xử lý mảng và chuỗi cho chức năng tạo tệp CSV.
  - Các hàm tiện ích Validation (Upload tệp, Cấu trúc Schema Hợp đồng).
  - Logic xác định loại nhắc hạn (EXPIRING_SOON, EXPIRED) bên trong Worker.
  - Quyền hạn (Permissions Client).
- **E2E Testing (Playwright):**
  - Luồng Đăng nhập (Phân quyền truy cập dựa trên JWT và UI Redirect).
  - Luồng Quản lý Hợp đồng (Tạo mới, Tìm kiếm, Bảng danh sách).
  - Luồng Phê Duyệt Hợp đồng (Gửi duyệt, Admin Approve/Reject).
  - Luồng Nhắc hạn (Xem trước danh sách đến hạn, Enqueue/Run worker).
  - Luồng Báo cáo (Tải xuống file Report CSV).

## 3. Công Cụ & Môi Trường
- **Frameworks:** Vitest (Unit), Playwright (E2E).
- **Môi trường Test:** Local SQLite Database (Tách biệt hoàn toàn với Dev/Prod DB thông qua script `prisma:seed:e2e`).
- **CI/CD Quality Gate:** GitHub Actions. Chạy toàn bộ các bài test trên mỗi commit push lên nhánh `main`. Độ phủ (Coverage) mong đợi: > 15-20% cho code lõi trong môi trường đồ án.

## 4. Kịch Bản & Người Chịu Trách Nhiệm
- **Nhân sự thực hiện:** Antigravity QA Lead.
- **Tự động hoá:** Pipeline thực thi `npm run test` & `npm run test:e2e` song song.
