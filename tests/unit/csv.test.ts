import { buildCsv } from "@/lib/csv";

describe("csv utility", () => {
  it("escapes commas, quotes, and newlines safely", () => {
    const csv = buildCsv(
      ["Code", "Title", "Note"],
      [["CT-001", 'Contract "A"', "line1\nline2"], ["CT-002", "Simple, Title", null]],
    );

    expect(csv).toContain('"Contract ""A"""');
    expect(csv).toContain('"line1\nline2"');
    expect(csv).toContain('"Simple, Title"');
  });

  it("keeps deterministic column order by header and row values", () => {
    const csv = buildCsv(["A", "B"], [[1, 2]]);
    expect(csv).toBe("\uFEFFA,B\n1,2");
  });
});
