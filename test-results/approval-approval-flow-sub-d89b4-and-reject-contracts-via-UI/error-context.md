# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: approval.spec.ts >> approval flow (submit -> approve/reject) >> approve and reject contracts via UI
- Location: tests\e2e\approval.spec.ts:37:7

# Error details

```
Test timeout of 60000ms exceeded.
```

```
Error: locator.fill: Test timeout of 60000ms exceeded.
Call log:
  - waiting for getByLabel('Email')

```

# Page snapshot

```yaml
- generic [ref=e2]: Internal Server Error
```

# Test source

```ts
  1  | import type { Page } from "@playwright/test";
  2  | import { expect } from "@playwright/test";
  3  | 
  4  | async function login(page: Page, input: { email: string; password: string }) {
  5  |   await page.goto("/login");
> 6  |   await page.getByLabel("Email").fill(input.email);
     |                                  ^ Error: locator.fill: Test timeout of 60000ms exceeded.
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
  18 |   await page.waitForURL("**/admin/dashboard");
  19 | }
  20 | 
```