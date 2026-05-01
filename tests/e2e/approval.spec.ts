import { test, expect } from "@playwright/test";
import { loginAsAdmin } from "./helpers/auth";
import { createContractViaApi, makeContractDates, type CreateContractInput } from "./helpers/contracts";

async function apiPost(page: any, input: { url: string; body?: unknown }) {
  return await page.evaluate(async ({ url, body }: { url: string; body?: unknown }) => {
    function getCookie(name: string) {
      const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]+)`));
      return match ? decodeURIComponent(match[1]) : null;
    }
    const token = getCookie("csrf_token") || '';
    const res = await fetch(url, {
      method: "POST",
      credentials: "include",
      headers: {
        ...(body ? { "Content-Type": "application/json" } : {}),
        "x-csrf-token": token
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    return await res.json();
  }, input);
}

async function listAdminContracts(page: any, input: { search: string }) {
  return await page.evaluate(async ({ search }: { search: string }) => {
    const res = await fetch(
      // Don't filter by `status` because approving may move it from DRAFT -> ACTIVE.
      `/api/admin/contracts?page=1&pageSize=10&search=${encodeURIComponent(search)}`,
      { credentials: "include" },
    );
    return await res.json();
  }, input);
}

test.describe("approval flow (submit -> approve/reject)", () => {
  test("approve and reject contracts via UI", async ({ page }) => {
    await loginAsAdmin(page);

    const baseDates = makeContractDates({ startOffsetDays: -1, endOffsetDays: 20 });

    const approveCode = `CT-E2E-APP-${Date.now()}`;
    const rejectCode = `CT-E2E-REJ-${Date.now() + 1}`;

    const approveInput: CreateContractInput = {
      code: approveCode,
      title: "E2E Approve Contract",
      partnerName: "Partner E2E",
      partnerEmail: `partner-${approveCode}@example.com`,
      value: 1000,
      startDate: baseDates.startDate,
      endDate: baseDates.endDate,
      autoRenew: false,
    };

    const rejectInput: CreateContractInput = {
      code: rejectCode,
      title: "E2E Reject Contract",
      partnerName: "Partner E2E",
      partnerEmail: `partner-${rejectCode}@example.com`,
      value: 1000,
      startDate: baseDates.startDate,
      endDate: baseDates.endDate,
      autoRenew: false,
    };

    // Create contracts (API because UI creation is not present).
    const approveContract = await createContractViaApi(page, approveInput);
    const rejectContract = await createContractViaApi(page, rejectInput);

    // Submit approval via API (avoids flaky /admin/contracts filter UI).
    await apiPost(page, { url: `/api/contracts/${approveContract.id}/submit-approval` });
    await apiPost(page, { url: `/api/contracts/${rejectContract.id}/submit-approval` });

    // Approve the first contract.
    await page.goto("/admin/approvals");
    await page.getByPlaceholder("Tìm kiếm theo mã, tên hoặc đối tác...").fill(approveCode);

    const approveRow = page.locator("table tbody tr", { hasText: approveCode }).first();
    await expect(approveRow.getByRole("button", { name: "Duyệt", exact: true })).toBeVisible();
    await approveRow.getByRole("button", { name: "Duyệt", exact: true }).click();
    
    const approveResp = page.waitForResponse(
      (resp) =>
        resp.url().includes(`/api/contracts/${approveContract.id}/approve`) && resp.request().method() === "POST" && resp.status() === 200,
    );
    await page.getByRole("button", { name: "Xác nhận phê duyệt" }).click();
    await approveResp;

    // Reject the second contract.
    await page.goto("/admin/approvals");
    await page.getByPlaceholder("Tìm kiếm theo mã, tên hoặc đối tác...").fill(rejectCode);

    const rejectRow = page.locator("table tbody tr", { hasText: rejectCode }).first();
    await rejectRow.getByRole("button", { name: "Từ chối" }).click();

    await page.getByPlaceholder("Nhập lý do từ chối (bắt buộc)...").fill("Từ chối vì lý do E2E");

    const rejectResp = page.waitForResponse(
      (resp) =>
        resp.url().includes(`/api/contracts/${rejectContract.id}/reject`) && resp.request().method() === "POST" && resp.status() === 200,
    );
    await page.getByRole("button", { name: "Xác nhận từ chối" }).click();
    await rejectResp;

    // Verify final statuses via API.
    const approveList = await listAdminContracts(page, { search: approveCode });
    expect(approveList?.success).toBe(true);
    expect(approveList?.data?.[0]?.approvalStatus).toBe("APPROVED");

    const rejectList = await listAdminContracts(page, { search: rejectCode });
    expect(rejectList?.success).toBe(true);
    expect(rejectList?.data?.[0]?.approvalStatus).toBe("REJECTED");
  });
});

