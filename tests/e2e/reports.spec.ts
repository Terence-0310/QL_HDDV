import { test, expect } from "@playwright/test";
import { loginAsAdmin } from "./helpers/auth";
import { createContractViaApi, makeContractDates, type CreateContractInput } from "./helpers/contracts";

test.describe("report/export flow (CSV)", () => {
  test("admin truy cập report hợp đồng và xuất CSV", async ({ page }) => {
    await loginAsAdmin(page);

    const contractCode = `CT-E2E-REP-${Date.now()}`;
    const dates = makeContractDates({ startOffsetDays: -2, endOffsetDays: 12 });

    const contractInput: CreateContractInput = {
      code: contractCode,
      title: "E2E Report Contract",
      partnerName: "Partner E2E",
      partnerEmail: `partner-${contractCode}@example.com`,
      value: 1234.56,
      startDate: dates.startDate,
      endDate: dates.endDate,
      autoRenew: false,
    };

    await createContractViaApi(page, contractInput);

    await page.goto("/admin/reports/contracts");
    await expect(page.getByRole("heading", { name: "Báo cáo hợp đồng" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Xuất CSV" })).toBeVisible();

    const csvText = await page.evaluate(async (code) => {
      const url = `/api/admin/reports/contracts/export?search=${encodeURIComponent(code)}&status=DRAFT&approvalStatus=NOT_SUBMITTED`;
      const res = await fetch(url, { credentials: "include" });
      return await res.text();
    }, contractCode);

    expect(csvText).toContain("Code");
    expect(csvText).toContain(contractCode);
  });
});

