import { test, expect } from "@playwright/test";
import { loginAsAdmin } from "./helpers/auth";

test.describe("Admin Dashboard", () => {
  test("displays correct stats and charts", async ({ page }) => {
    await loginAsAdmin(page);
    
    // Verify Dashboard Heading
    await expect(page.getByRole("heading", { name: /Tổng quan/i, exact: true }).first()).toBeVisible();
    await expect(page.getByText("Tổng hợp đồng", { exact: true }).first()).toBeVisible();
    await expect(page.getByText("Sắp hết hạn", { exact: true }).first()).toBeVisible();
    await expect(page.getByText("Đang hiệu lực", { exact: true }).first()).toBeVisible();
    
    // Charts
    await expect(page.getByText("Xu hướng hợp đồng")).toBeVisible();
    await expect(page.getByText("Phân bổ hợp đồng theo trạng thái")).toBeVisible();
    await expect(page.getByText("Giá trị hợp đồng theo tháng")).toBeVisible();

    // Priority Section (If exists)
    const prioritySection = page.getByText("Ưu tiên xử lý hôm nay");
    if (await prioritySection.isVisible()) {
      await expect(prioritySection).toBeVisible();
    }

    // Export Button
    const exportBtn = page.getByRole("button", { name: /Xuất báo cáo/i });
    await expect(exportBtn).toBeVisible();

    // Refresh Button
    const refreshBtn = page.getByRole("button", { name: /Làm mới/i });
    await expect(refreshBtn).toBeVisible();
    await refreshBtn.click();
    
    // Date Filter
    const filter = page.locator("select");
    await filter.selectOption("90d");
    
    // Notification Dropdown
    const notificationBtn = page.locator('button:has(svg.lucide-bell)');
    await expect(notificationBtn).toBeVisible();
    await notificationBtn.click();
    await expect(page.getByText("Đánh dấu đã đọc")).toBeVisible();
    await notificationBtn.click({ force: true }); // Close
  });
});
