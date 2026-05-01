import { test, expect } from "@playwright/test";
import { loginAsAdmin } from "./helpers/auth";
import { createContractViaApi, makeContractDates, type CreateContractInput } from "./helpers/contracts";

test.describe("reminder flow (preview + run/enqueue)", () => {
  test("preview candidates includes contract and run enqueues jobs", async ({ page }) => {
    await loginAsAdmin(page);

    const contractCode = `CT-E2E-REM-${Date.now()}`;
    const dates = makeContractDates({ startOffsetDays: -1, endOffsetDays: 3 });

    const contractInput: CreateContractInput = {
      code: contractCode,
      title: "E2E Reminder Contract",
      partnerName: "Partner E2E",
      partnerEmail: `partner-${contractCode}@example.com`,
      value: 1000,
      startDate: dates.startDate,
      endDate: dates.endDate,
      autoRenew: false,
      reminderThresholdDays: [3],
    };

    await createContractViaApi(page, contractInput);

    const previewResp = await page.evaluate(async () => {
      const res = await fetch("/api/reminders/preview?limit=200", {
        credentials: "include",
      });
      return await res.json();
    });

    expect(previewResp?.success).toBe(true);
    const candidates = previewResp?.data?.candidates ?? [];
    const candidate = candidates.find((c: any) => c.contractCode === contractCode);
    expect(candidate).toBeTruthy();

    const runResp = await page.evaluate(async () => {
      function getCookie(name: string) {
        const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]+)`));
        return match ? decodeURIComponent(match[1]) : null;
      }
      const token = getCookie("csrf_token") || '';
      const res = await fetch("/api/reminders/run", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-csrf-token": token },
        credentials: "include",
        body: JSON.stringify({ limit: 50 }),
      });
      return await res.json();
    });

    expect(runResp?.success).toBe(true);
    expect(runResp?.data?.pending).toBeGreaterThanOrEqual(1);
  });
});

