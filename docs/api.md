# Cấu Trúc API (API Reference)

Tất cả API trong hệ thống đều tuân thủ kiến trúc RESTful. 
Response chuẩn của hệ thống luôn có định dạng:
```json
{
  "success": true,
  "message": "Nội dung",
  "data": { ... } // hoặc mảng []
}
```
Lỗi trả về có định dạng:
```json
{
  "success": false,
  "message": "Chi tiết lỗi",
  "code": "ERROR_CODE",
  "details": [...] // Chứa thông tin validation Zod (nếu có)
}
```

## 1. Authentication (`/api/auth`)
- `POST /api/auth/login`: Xác thực credentials, cấp `auth_token` HttpOnly và `csrf_token`.
- `POST /api/auth/register`: Đăng ký tài khoản.
- `POST /api/auth/logout`: Xoá cookies hiện tại.
- `GET /api/auth/me`: Kiểm tra phiên đăng nhập. (Sẽ huỷ cookie nếu 401).

## 2. Quản lý Hợp Đồng (`/api/contracts`)
- `GET /api/contracts`: Lấy danh sách hợp đồng (hỗ trợ phân trang, lọc).
- `POST /api/contracts`: Tạo mới hợp đồng.
- `GET /api/contracts/:id`: Chi tiết hợp đồng.
- `PUT /api/contracts/:id`: Cập nhật thông tin.
- `DELETE /api/contracts/:id`: Xoá hợp đồng (Chỉ admin).
- `POST /api/contracts/:id/submit-approval`: Gửi phê duyệt.
- `POST /api/contracts/:id/approve`: Duyệt hợp đồng (Chỉ Admin).
- `POST /api/contracts/:id/reject`: Từ chối hợp đồng (Kèm lý do).

## 3. Nhắc Mốc Gia Hạn (`/api/reminders`)
- `GET /api/reminders/preview`: Lấy danh sách hợp đồng thoả mãn ngưỡng nhắc hạn (Ví dụ: 30, 15, 7 ngày).
- `POST /api/reminders/run`: Kích hoạt Worker đẩy Job nhắc nhở vào Queue.

## 4. Quản trị & Báo cáo (`/api/admin`)
- `GET /api/admin/users`: Lấy danh sách người dùng.
- `PUT /api/admin/users/:id/role`: Đổi Role người dùng.
- `GET /api/admin/reports/summary`: Thống kê Dashboard tổng quan (Số liệu).
- `GET /api/admin/reports/export`: Tải file CSV thống kê.

## 5. Thông Báo (`/api/notifications`)
- `GET /api/notifications`: Lấy danh sách thông báo.
- `GET /api/notifications/unread-count`: Đếm số lượng chưa đọc.
- `POST /api/notifications/read-all`: Đánh dấu đã đọc toàn bộ.
- `POST /api/notifications/:id/read`: Đánh dấu đọc một thông báo.

*Bảo mật:* Bắt buộc truyền Header `x-csrf-token` khớp với Cookie đối với các thao tác POST/PUT/DELETE.
