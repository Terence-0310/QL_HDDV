# Hướng Dẫn Kiểm Thử (Testing Guide)

Dự án này sử dụng mô hình kiểm thử kết hợp: Unit Test cho logic ngầm và E2E Test cho nghiệp vụ UI.

## 1. Môi trường & Công cụ
- Cài đặt dependency: `npm install`
- **Unit Test:** Sử dụng `Vitest` kết hợp với tính năng giả lập (Mocking) Prisma Client.
- **E2E Test:** Sử dụng `Playwright` với trình duyệt Chromium ẩn (Headless).
- **CSDL Test:** E2E Test sử dụng file DB riêng biệt `e2e.db` (thông qua URL ghi đè `.env.test`) để không phá hoại dữ liệu đang phát triển (Development). Lệnh mồi (Seed) cho E2E là `prisma/seed.e2e.ts`.

## 2. Các Lệnh Thực Thi (Commands)

### Chạy Unit Test
```bash
npm run test
```
*Lệnh này sẽ chạy toàn bộ các bài test trong thư mục `tests/unit/`. Tốc độ cực nhanh vì không phụ thuộc CSDL thật.*

### Chạy Unit Test và tính Độ phủ (Coverage)
```bash
npm run test:coverage
```
*Vitest sẽ sinh ra bảng báo cáo độ phủ mã nguồn (Statement, Branch, Functions).*

### Chạy E2E Test
```bash
npm run test:e2e
```
*Lệnh này sẽ tự động thiết lập CSDL `e2e.db` sạch, sau đó mở Browser ảo và tương tác với UI y như người dùng thật. Sau khi chạy, nếu có lỗi có thể dùng `npx playwright show-report` để xem video thao tác quay lại.*

## 3. Quy chuẩn CI/CD
Trong Github Actions, mọi Pull Request hoặc thao tác Push vào nhánh `main` đều sẽ tự động kích hoạt tiến trình:
1. Lint: `npm run lint`
2. Typecheck: `npm run typecheck`
3. Testing: `npm run test:coverage` & `npm run test:e2e`
4. Build: `npm run build`

**Quan trọng:** Cần đảm bảo mã nguồn vượt qua toàn bộ các bước (Quality Gate) trước khi coi là hoàn thành chức năng. Nếu E2E thất bại, hệ thống sẽ từ chối tích hợp code.
