import type { Page } from "@playwright/test";
import { expect } from "@playwright/test";

async function login(page: Page, input: { email: string; password: string }) {
  await page.goto("/login");
  await page.getByLabel("Email").fill(input.email);
  await page.getByLabel("Mật khẩu").fill(input.password);
  await page.getByRole("button", { name: "Đăng nhập" }).click();
}

export async function loginAsAdmin(page: Page) {
  await login(page, { email: "admin@example.com", password: "Admin@12345" });
  await expect(page.getByText("Bảng điều khiển quản trị")).toBeVisible();
}

export async function loginAsUser(page: Page) {
  await login(page, { email: "user@example.com", password: "User@12345" });
  await page.waitForURL("**/admin/dashboard");
}
