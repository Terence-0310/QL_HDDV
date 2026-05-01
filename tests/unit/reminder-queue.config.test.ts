import { computeBackoffDelay } from "@/services/queue/reminder-queue.config";

describe("reminder queue backoff", () => {
  it("computes exponential backoff using attempt number", () => {
    expect(computeBackoffDelay(1, 1000)).toBe(1000);
    expect(computeBackoffDelay(2, 1000)).toBe(2000);
    expect(computeBackoffDelay(3, 1000)).toBe(4000);
  });

  it("normalizes attempt lower bound to 1", () => {
    expect(computeBackoffDelay(0, 500)).toBe(500);
    expect(computeBackoffDelay(-2, 500)).toBe(500);
  });
});
