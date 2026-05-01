# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: auth.spec.ts >> auth & permission >> user đăng nhập thành công và bị chặn trang admin
- Location: tests\e2e\auth.spec.ts:5:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByText('Trung tâm thông báo')
Expected: visible
Timeout: 10000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 10000ms
  - waiting for getByText('Trung tâm thông báo')
    - waiting for" http://localhost:3000/" navigation to finish...
    - navigated to "http://localhost:3000/admin/dashboard"

```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - generic [ref=e2]:
    - complementary [ref=e3]:
      - heading "Quản lý hợp đồng" [level=2] [ref=e4]
      - navigation [ref=e5]:
        - link "Thông báo" [ref=e6] [cursor=pointer]:
          - /url: /notifications
    - generic [ref=e7]:
      - generic [ref=e8]:
        - strong [ref=e9]: Cổng quản trị nội bộ
        - generic [ref=e10]:
          - link "Thông báo (0)" [ref=e11] [cursor=pointer]:
            - /url: /notifications
          - generic [ref=e12]: System User (USER)
          - button "Đăng xuất" [ref=e13] [cursor=pointer]
      - main [ref=e14]:
        - generic [ref=e15]: Bạn không có quyền truy cập trang này.
  - button "Open Next.js Dev Tools" [ref=e21] [cursor=pointer]:
    - img [ref=e22]
  - alert [ref=e25]
```

# Test source

```ts
  1  | import type { Page } from "@playwright/test";
  2  | import { expect } from "@playwright/test";
  3  | 
  4  | async function login(page: Page, input: { email: string; password: string }) {
  5  |   await page.goto("/login");
  6  |   await page.getByLabel("Email").fill(input.email);
  7  |   await page.getByLabel("Mật khẩu").fill(input.password);
  8  |   await page.getByRole("button", { name: "Đăng nhập" }).click();
  9  | }
  10 | 
  11 | export async function loginAsAdmin(page: Page) {
  12 |   await login(page, { email: "admin@example.com", password: "Admin@12345" });
  13 |   await expect(page.getByText("Bảng điều khiển quản trị")).toBeVisible();
  14 | }
  15 | 
  16 | export async function loginAsUser(page: Page) {
  17 |   await login(page, { email: "user@example.com", password: "User@12345" });
> 18 |   await expect(page.getByText("Trung tâm thông báo")).toBeVisible();
     |                                                       ^ Error: expect(locator).toBeVisible() failed
  19 | }
  20 | 
  21 | 
```