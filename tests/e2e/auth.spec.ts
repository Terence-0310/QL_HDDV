import { test, expect } from "@playwright/test";
import { loginAsAdmin, loginAsUser } from "./helpers/auth";

test.describe("auth & permission", () => {
  test("user đăng nhập thành công và bị chặn trang admin", async ({ page }) => {
    await loginAsUser(page);

    await page.goto("/admin/dashboard");
    await expect(page.getByText("Bạn không có quyền truy cập trang này.")).toBeVisible();
  });

  test("admin đăng nhập thành công", async ({ page }) => {
    await loginAsAdmin(page);
  });
});

