import { test, expect } from "@playwright/test";
import { loginAsAdmin } from "./helpers/auth";
import { createContractViaApi, makeContractDates, type CreateContractInput } from "./helpers/contracts";

test.describe("contracts flow (create via API + list/search)", () => {
  test("tạo hợp đồng và xem danh sách + tìm kiếm/lọc", async ({ page }) => {
    await loginAsAdmin(page);

    const contractCode = `CT-E2E-${Date.now()}`;
    const dates = makeContractDates({ startOffsetDays: -1, endOffsetDays: 10 });

    const contractInput: CreateContractInput = {
      code: contractCode,
      title: "E2E Contract",
      partnerName: "Partner E2E",
      partnerEmail: `partner-${contractCode}@example.com`,
      value: 1000,
      startDate: dates.startDate,
      endDate: dates.endDate,
      autoRenew: false,
    };

    await createContractViaApi(page, contractInput);

    // Navigate to the UI page (assert page exists).
    await page.goto("/admin/contracts");
    await expect(page.getByRole("heading", { name: "Quản lý hợp đồng" })).toBeVisible();

    // Validate “list + search/filter” via the same API the UI uses (stable, deterministic).
    const listResp = await page.evaluate(async (code) => {
      const url = `/api/admin/contracts?page=1&pageSize=10&search=${encodeURIComponent(code)}&status=DRAFT`;
      const res = await fetch(url, { credentials: "include" });
      return await res.json();
    }, contractCode);

    expect(listResp?.success).toBe(true);
    const items = listResp?.data ?? [];
    expect(items.some((x: any) => x.code === contractCode)).toBe(true);

    const emptyResp = await page.evaluate(async () => {
      const url = `/api/admin/contracts?page=1&pageSize=10&search=${encodeURIComponent("NON_EXISTING_CODE")}&status=DRAFT`;
      const res = await fetch(url, { credentials: "include" });
      return await res.json();
    });

    expect(emptyResp?.success).toBe(true);
    expect((emptyResp?.data ?? []).length).toBe(0);
  });
});

