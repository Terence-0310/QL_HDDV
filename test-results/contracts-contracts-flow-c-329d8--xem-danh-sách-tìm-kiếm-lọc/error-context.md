# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: contracts.spec.ts >> contracts flow (create via API + list/search) >> tạo hợp đồng và xem danh sách + tìm kiếm/lọc
- Location: tests\e2e\contracts.spec.ts:6:7

# Error details

```
Error: Invalid CSRF token
```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - generic [ref=e2]:
    - complementary [ref=e3]:
      - heading "Quản lý hợp đồng" [level=2] [ref=e4]
      - navigation [ref=e5]:
        - link "Tổng quan" [ref=e6] [cursor=pointer]:
          - /url: /admin/dashboard
        - link "Hợp đồng quản trị" [ref=e7] [cursor=pointer]:
          - /url: /admin/contracts
        - link "Hàng đợi duyệt" [ref=e8] [cursor=pointer]:
          - /url: /admin/approvals
        - link "Người dùng" [ref=e9] [cursor=pointer]:
          - /url: /admin/users
        - link "Báo cáo" [ref=e10] [cursor=pointer]:
          - /url: /admin/reports
        - link "Thông báo" [ref=e11] [cursor=pointer]:
          - /url: /notifications
    - generic [ref=e12]:
      - generic [ref=e13]:
        - strong [ref=e14]: Cổng quản trị nội bộ
        - generic [ref=e15]:
          - link "Thông báo (0)" [ref=e16] [cursor=pointer]:
            - /url: /notifications
          - generic [ref=e17]: System Admin (ADMIN)
          - button "Đăng xuất" [ref=e18] [cursor=pointer]
      - main [ref=e19]:
        - generic [ref=e20]:
          - generic [ref=e21]:
            - generic [ref=e22]:
              - heading "Bảng điều khiển quản trị" [level=1] [ref=e23]
              - paragraph [ref=e24]: Theo dõi tổng quan hợp đồng, người dùng và trạng thái phê duyệt theo thời gian thực.
            - generic [ref=e25]:
              - button "Làm mới số liệu" [ref=e26] [cursor=pointer]
              - link "Mở báo cáo chi tiết" [ref=e27] [cursor=pointer]:
                - /url: /admin/reports/contracts
          - generic [ref=e28]:
            - generic [ref=e29]:
              - paragraph [ref=e30]: Mức độ ưu tiên xử lý hôm nay
              - paragraph [ref=e31]: Không có hợp đồng khẩn cấp
            - generic [ref=e32]: Ổn định
          - generic [ref=e33]:
            - generic [ref=e34]:
              - paragraph [ref=e36]: Tổng hợp đồng
              - paragraph [ref=e37]: "0"
              - paragraph [ref=e38]: Toàn bộ trong hệ thống
            - generic [ref=e39]:
              - paragraph [ref=e41]: Hợp đồng đang hiệu lực
              - paragraph [ref=e42]: "0"
              - paragraph [ref=e43]: Đang vận hành bình thường
            - generic [ref=e44]:
              - paragraph [ref=e46]: Sắp hết hạn
              - paragraph [ref=e47]: "0"
              - paragraph [ref=e48]: Cần nhắc gia hạn sớm
            - generic [ref=e49]:
              - paragraph [ref=e51]: Đã hết hạn
              - paragraph [ref=e52]: "0"
              - paragraph [ref=e53]: Cần xử lý ngay
            - generic [ref=e54]:
              - paragraph [ref=e56]: Chờ phê duyệt
              - paragraph [ref=e57]: "0"
              - paragraph [ref=e58]: Đang chờ quyết định
            - generic [ref=e59]:
              - paragraph [ref=e61]: Tổng người dùng
              - paragraph [ref=e62]: "3"
              - paragraph [ref=e63]: Tất cả tài khoản đã tạo
            - generic [ref=e64]:
              - paragraph [ref=e66]: Người dùng hoạt động
              - paragraph [ref=e67]: "3"
              - paragraph [ref=e68]: Có thể đăng nhập hệ thống
  - button "Open Next.js Dev Tools" [ref=e74] [cursor=pointer]:
    - img [ref=e75]
  - alert [ref=e78]
```

# Test source

```ts
  1  | import type { Page } from "@playwright/test";
  2  | import { expect } from "@playwright/test";
  3  | 
  4  | export type CreateContractInput = {
  5  |   code: string;
  6  |   title: string;
  7  |   partnerName: string;
  8  |   partnerEmail?: string;
  9  |   description?: string;
  10 |   value: number;
  11 |   startDate: string;
  12 |   endDate: string;
  13 |   signedDate?: string | null;
  14 |   status?: "DRAFT" | "ACTIVE" | "EXPIRING_SOON" | "EXPIRED" | "TERMINATED";
  15 |   renewalReminderDays?: number;
  16 |   autoRenew?: boolean;
  17 |   fileUrl?: string;
  18 |   note?: string;
  19 | };
  20 | 
  21 | export async function createContractViaApi(page: Page, input: CreateContractInput) {
  22 |   // Uses browser cookies (credentials: include) to keep auth aligned with real flow.
  23 |   const response = await page.evaluate(async (payload) => {
  24 |     const res = await fetch("/api/contracts", {
  25 |       method: "POST",
  26 |       headers: { "Content-Type": "application/json" },
  27 |       credentials: "include",
  28 |       body: JSON.stringify(payload),
  29 |     });
  30 |     return await res.json();
  31 |   }, input);
  32 | 
  33 |   if (!response?.success) {
> 34 |     throw new Error(response?.message ?? "Failed to create contract");
     |           ^ Error: Invalid CSRF token
  35 |   }
  36 | 
  37 |   expect(response.data?.id).toBeTruthy();
  38 |   return response.data as { id: string; code: string };
  39 | }
  40 | 
  41 | export function makeContractDates(options?: { startOffsetDays?: number; endOffsetDays?: number }) {
  42 |   const now = new Date();
  43 |   const start = new Date(now.getTime() + (options?.startOffsetDays ?? -1) * 24 * 60 * 60 * 1000);
  44 |   const end = new Date(now.getTime() + (options?.endOffsetDays ?? 3) * 24 * 60 * 60 * 1000);
  45 | 
  46 |   return {
  47 |     startDate: start.toISOString(),
  48 |     endDate: end.toISOString(),
  49 |   };
  50 | }
  51 | 
  52 | 
```