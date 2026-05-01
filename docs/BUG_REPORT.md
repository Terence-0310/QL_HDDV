# Báo Cáo Lỗi (Bug Report)

Danh sách các lỗi (Bugs) được phát hiện trong các kỳ kiểm thử và đã được xử lý (Resolved).

## BUG-01: Lỗi kẹt trang Dashboard khi CSDL reset (Ghost Session)
- **Mô tả:** Trình duyệt lưu cookie cũ, vượt qua check hạn của Middleware nhưng Backend không tìm thấy User do DB đã bị xoá. Giao diện kẹt chữ "Bạn chưa đăng nhập" mà không có Menu.
- **Mức độ:** Nghiêm trọng (High)
- **Cách khắc phục:** Cập nhật Endpoint `/api/auth/me` tự động xoá cookie nếu ném lỗi 401. Hàm `useCurrentUser` trên client tự động bắt mã 401 và gọi lệnh `window.location.href = "/login"`. Đã fix thành công.

## BUG-02: Playwright E2E thất bại vì "Invalid CSRF Token"
- **Mô tả:** Các lệnh gọi API tạo hợp đồng, submit duyệt trong mã test bị backend chặn bằng lỗi 403 Forbidden do thiếu `x-csrf-token` trên Header (Cơ chế bảo mật mới bổ sung).
- **Mức độ:** Trung bình (Medium)
- **Cách khắc phục:** Viết hàm tự động đọc giá trị Cookie `csrf_token` trong môi trường Playwright `page.evaluate()` và nhét vào header của lệnh `fetch`. Đã fix thành công.

## BUG-03: Reminder Preview không tìm thấy Hợp đồng trong Test
- **Mô tả:** Kịch bản Test tạo hợp đồng cách 3 ngày hết hạn nhưng API báo không có ứng viên nào cần gửi nhắc.
- **Nguyên nhân:** Hợp đồng lưu trong DB sử dụng ngưỡng mặc định `[30, 15, 7]`. Do 3 ngày không nằm trong ngưỡng nhắc mặc định, hệ thống thông minh từ chối nhắc.
- **Cách khắc phục:** Điều chỉnh Input của mã test để truyền vào tham số `reminderThresholdDays: [3]` nhằm khớp với số ngày còn lại của Hợp đồng mẫu. Đã fix thành công.

## BUG-04: Worker Retry lỗi (TypeError undefined)
- **Mô tả:** Khi Worker gửi Email nhắc nhở thất bại quá số lần quy định, tiến trình chuyển Job sang "Dead-letter" và lưu Log. Nhưng lại báo lỗi `TypeError` trên `prisma.user`.
- **Cách khắc phục:** Do trong môi trường Unit Test bị thiếu Mock dữ liệu `user.findMany`. Bổ sung mock cho Prisma Service. Đã fix thành công.
