import { ReminderType } from "@prisma/client";
import {
  buildReminderPayload,
  computeContractLifecycleStatus,
  resolveReminderType,
} from "@/services/reminder.service";

describe("reminder service core logic", () => {
  it("resolves EXPIRED when contract endDate is before today's UTC start", () => {
    const now = new Date("2026-04-06T10:00:00.000Z");
    const result = resolveReminderType(
      {
        endDate: new Date("2026-04-05T23:59:59.000Z"),
        renewalReminderDays: 7,
        reminderOffsets: "7,15,30",
      },
      now,
    );
    expect(result).toBe(ReminderType.EXPIRED);
  });

  it("resolves EXPIRING_SOON inside threshold window", () => {
    const now = new Date("2026-04-06T10:00:00.000Z");
    const result = resolveReminderType(
      {
        endDate: new Date("2026-04-13T10:00:00.000Z"),
        renewalReminderDays: 7,
        reminderOffsets: "7,15,30",
      },
      now,
    );
    expect(result).toBe(ReminderType.EXPIRING_SOON);
  });

  it("returns NORMAL lifecycle when no reminder is needed", () => {
    const now = new Date("2026-04-06T10:00:00.000Z");
    const status = computeContractLifecycleStatus(
      {
        endDate: new Date("2026-06-30T10:00:00.000Z"),
        renewalReminderDays: 7,
        reminderOffsets: "7,15,30",
      },
      now,
    );
    expect(status).toBe("NORMAL");
  });

  it("builds reminder payload from candidate correctly", () => {
    const payload = buildReminderPayload({
      contractId: "c1",
      contractCode: "CT-001",
      title: "Master Service Agreement",
      partnerEmail: "partner@example.com",
      endDate: new Date("2026-04-20T00:00:00.000Z"),
      reminderType: ReminderType.EXPIRING_SOON,
      reminderThresholdDays: 7,
    });

    expect(payload).toEqual({
      contractId: "c1",
      contractCode: "CT-001",
      title: "Master Service Agreement",
      partnerEmail: "partner@example.com",
      endDate: new Date("2026-04-20T00:00:00.000Z"),
      reminderType: ReminderType.EXPIRING_SOON,
      reminderThresholdDays: 7,
    });
  });
});
