# Kịch Bản Kiểm Thử (Test Cases)

## TC01 - Đăng Nhập & Phân Quyền
- **Điều kiện đầu vào:** Khởi tạo CSDL có sẵn User (`role: USER`) và Admin (`role: ADMIN`).
- **Thực thi:**
  1. Login tài khoản User.
  2. Truy cập `/admin/dashboard`.
  3. Login tài khoản Admin.
- **Kết quả mong đợi:** User bị block bởi Middleware và đá văng về `/login` hoặc báo lỗi không đủ quyền. Admin truy cập thành công và thấy đầy đủ Sidebar Menu.

## TC02 - Tạo & Quản Lý Hợp Đồng
- **Điều kiện đầu vào:** Tài khoản Admin/Staff đang đăng nhập.
- **Thực thi:**
  1. Gửi request `POST /api/contracts` tạo hợp đồng mới với đầy đủ thông tin hợp lệ (Kèm CSRF Token).
  2. Vào `/admin/contracts`, gõ tên hợp đồng vừa tạo vào ô tìm kiếm.
- **Kết quả mong đợi:** API trả về HTTP 200/201 kèm ID hợp đồng. Hợp đồng xuất hiện đầu tiên trong danh sách khi tìm kiếm.

## TC03 - Phê Duyệt Hợp Đồng (Approval Flow)
- **Điều kiện đầu vào:** Một hợp đồng ở trạng thái `DRAFT`.
- **Thực thi:**
  1. Thực hiện `submit-approval`.
  2. Đăng nhập Admin, vào `/admin/approvals`.
  3. Ấn "Phê duyệt" (Approve) hoặc "Từ chối" (Reject).
- **Kết quả mong đợi:** Hợp đồng chuyển sang `PENDING_APPROVAL` khi được gửi. Chuyển sang `APPROVED` (hoặc `REJECTED`) tương ứng khi thao tác. Trạng thái phản ánh chính xác trên giao diện.

## TC04 - Worker Nhắc Mốc Gia Hạn
- **Điều kiện đầu vào:** Một hợp đồng có `endDate` cách hiện tại đúng 3 ngày, `reminderThresholdDays: [3, 7]`.
- **Thực thi:**
  1. Vào trang Nhắc hạn `/api/reminders/preview`.
  2. Bấm "Run Worker".
- **Kết quả mong đợi:** API Preview hiển thị đúng ID hợp đồng đó vào danh sách "Sắp hết hạn". Worker tạo thành công 1 Job gửi mail vào Queue mà không bị lỗi.

## TC05 - Tải Báo Cáo CSV
- **Điều kiện đầu vào:** Có sẵn vài hợp đồng trong DB.
- **Thực thi:**
  1. Vào `/admin/reports`, chọn bộ lọc.
  2. Bấm "Xuất CSV".
- **Kết quả mong đợi:** Trình duyệt tải xuống file `report-...csv`. Cấu trúc file có chuỗi BOM `\uFEFF` ở đầu giúp hiển thị tiếng Việt trên Excel.
