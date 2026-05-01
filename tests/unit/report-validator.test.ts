import { reportContractsQuerySchema } from "@/lib/validators/report.validator";

describe("report query validator", () => {
  it("parses defaults and trims optional text fields", () => {
    const parsed = reportContractsQuerySchema.parse({
      search: "  contract  ",
      ownerId: "   ",
    });

    expect(parsed.page).toBe(1);
    expect(parsed.pageSize).toBe(50);
    expect(parsed.sortBy).toBe("createdAt");
    expect(parsed.sortOrder).toBe("desc");
    expect(parsed.search).toBe("contract");
    expect(parsed.ownerId).toBeUndefined();
  });

  it("rejects invalid date range", () => {
    expect(() =>
      reportContractsQuerySchema.parse({
        startDateFrom: "2026-04-10",
        startDateTo: "2026-04-01",
      }),
    ).toThrow("startDateFrom must be earlier than or equal to startDateTo");
  });
});
