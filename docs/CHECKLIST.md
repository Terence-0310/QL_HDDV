# Checklist Đánh Giá Dự Án Hệ Thống Quản Lý Hợp Đồng

Bảng danh sách kiểm tra (QA/QC) các chức năng cốt lõi của dự án dùng để test trước khi nghiệm thu hoặc nộp đồ án. Bạn có thể sử dụng các Markdown viewer hoặc mở trực tiếp trên VSCode để click tick (√) vào ô trống.

## 1. Xác thực & Phân quyền (Auth & Security)
- [ ] Đăng ký tài khoản (mặc định Role `USER`).
- [ ] Đăng nhập bằng Email & Mật khẩu.
- [ ] Chuyển hướng mượt mà sau khi đăng nhập thành công.
- [ ] Đăng xuất và xóa phiên đăng nhập (xóa HttpOnly Cookie).
- [ ] Trạng thái tài khoản: Chặn đăng nhập nếu account bị `INACTIVE` hoặc `BLOCKED`.
- [ ] Phân quyền trang Admin: Chỉ `ADMIN` hoặc user có quyền tương ứng mới vào được trang Dashboard nội bộ.

## 2. Quản lý Hợp đồng (Contract CRUD)
- [ ] Tạo hợp đồng mới (nhập đầy đủ tên, đối tác, giá trị, ngày bắt đầu/kết thúc).
- [ ] Chỉnh sửa thông tin hợp đồng đang có trên hệ thống.
- [ ] Xem chi tiết hợp đồng (Metadata, luồng gia hạn, file đính kèm).
- [ ] Xóa hợp đồng (hoặc đổi trạng thái sang `TERMINATED`).
- [ ] Upload file PDF: Kiểm tra từ chối đúng file rác, chỉ nhận định dạng (`.pdf`), giới hạn dung lượng (vd: 10MB).
- [ ] Tìm kiếm hợp đồng (theo mã, tên, đối tác).
- [ ] Bộ lọc hợp đồng (theo trạng thái, khoảng ngày, người phụ trách).
- [ ] Phân trang (Pagination) danh sách hợp đồng hoạt động mượt mà.

## 3. Luồng Gia hạn & Phê duyệt (Workflow)
- [ ] **Phê duyệt:** Gửi yêu cầu duyệt hợp đồng (Đổi trạng thái sang `PENDING`).
- [ ] **Phê duyệt:** Quản lý duyệt hợp đồng (`APPROVED`) hoặc từ chối (`REJECTED` - có hiển thị ghi chú lý do).
- [ ] **Gia hạn:** Gia hạn hợp đồng cũ thành hợp đồng mới (hợp đồng con tự động kế thừa và link với `parentContractId`).

## 4. Nhắc nhở & Thông báo (Reminder & Notification)
- [ ] Cấu hình khoảng thời gian nhắc nhở linh hoạt (ví dụ: 7, 15, 30 ngày trước ngày hết hạn).
- [ ] Có thể xem trước (Preview) danh sách hợp đồng sắp hết hạn cần nhắc nhở.
- [ ] Đẩy thành công công việc nhắc nhở vào Hàng đợi (Message Queue).
- [ ] Worker xử lý gửi Email tự động qua cấu hình SMTP (Nodemailer) tới email thực tế.
- [ ] Retry (Cơ chế thử lại): Tự động thử gửi lại email nếu quá trình gửi lỗi, và đẩy vào `DEAD_LETTER` nếu vượt quá số lần retry cho phép.
- [ ] Chống lặp (Dedupe): Không gửi 2 email nhắc nhở giống nhau cho cùng một hợp đồng trong cùng một ngày.
- [ ] Trung tâm thông báo (Notification Center): Hiển thị chuông thông báo ngay trên thanh menu khi có thông báo hệ thống mới.
- [ ] Tính năng Đánh dấu "Đã đọc" thông báo (Read).

## 5. Quản trị & Báo cáo (Admin CMS)
- [ ] Bảng điều khiển (Dashboard) hiển thị đúng số liệu thống kê (tổng hợp đồng, trạng thái).
- [ ] Quản lý Users: Cập nhật quyền hạn (`ADMIN`, `STAFF`, `USER`) và khóa tài khoản (`BLOCKED`).
- [ ] Theo dõi lịch sử hệ thống (Audit Logs) cho mọi hành động nhạy cảm (tạo mới, phê duyệt, tải file, export).
- [ ] Xuất Báo cáo Hợp đồng ra file định dạng `.CSV` với encode chuẩn UTF-8 để dễ dàng xem trên Excel.
