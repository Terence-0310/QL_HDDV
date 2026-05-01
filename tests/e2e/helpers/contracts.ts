import type { Page } from "@playwright/test";
import { expect } from "@playwright/test";

export type CreateContractInput = {
  code: string;
  title: string;
  partnerName: string;
  partnerEmail?: string;
  description?: string;
  value: number;
  startDate: string;
  endDate: string;
  signedDate?: string | null;
  status?: "DRAFT" | "ACTIVE" | "EXPIRING_SOON" | "EXPIRED" | "TERMINATED";
  renewalReminderDays?: number;
  autoRenew?: boolean;
  reminderThresholdDays?: number[];
  fileUrl?: string;
  note?: string;
};

export async function createContractViaApi(page: Page, input: CreateContractInput) {
  // Uses browser cookies (credentials: include) to keep auth aligned with real flow.
  const response = await page.evaluate(async (payload) => {
    function getCookie(name: string) {
      const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]+)`));
      return match ? decodeURIComponent(match[1]) : null;
    }
    const csrfToken = getCookie("csrf_token") || '';
    const res = await fetch("/api/contracts", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-csrf-token": csrfToken,
      },
      credentials: "include",
      body: JSON.stringify(payload),
    });
    return await res.json();
  }, input);

  if (!response?.success) {
    throw new Error(response?.message ?? "Failed to create contract");
  }

  expect(response.data?.id).toBeTruthy();
  return response.data as { id: string; code: string };
}

export function makeContractDates(options?: { startOffsetDays?: number; endOffsetDays?: number }) {
  const now = new Date();
  const start = new Date(now.getTime() + (options?.startOffsetDays ?? -1) * 24 * 60 * 60 * 1000);
  const end = new Date(now.getTime() + (options?.endOffsetDays ?? 3) * 24 * 60 * 60 * 1000);

  return {
    startDate: start.toISOString(),
    endDate: end.toISOString(),
  };
}

