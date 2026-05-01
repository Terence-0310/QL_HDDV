import { ReminderJobStatus, ReminderType } from "@prisma/client";
import { processPendingReminderJobs } from "@/services/reminder/reminder-worker.service";

const listDueReminderJobsMock = vi.fn();
const claimReminderJobMock = vi.fn();
const sendReminderEmailForJobMock = vi.fn();
const createAuditLogMock = vi.fn();
const updateMock = vi.fn();

vi.mock("@/services/queue/reminder-queue.service", () => ({
  listDueReminderJobs: (...args: unknown[]) => listDueReminderJobsMock(...args),
  claimReminderJob: (...args: unknown[]) => claimReminderJobMock(...args),
}));

vi.mock("@/services/reminder/reminder-dispatch.service", () => ({
  sendReminderEmailForJob: (...args: unknown[]) => sendReminderEmailForJobMock(...args),
}));

vi.mock("@/services/audit.service", () => ({
  createAuditLog: (...args: unknown[]) => createAuditLogMock(...args),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    reminderJob: {
      update: (...args: unknown[]) => updateMock(...args),
    },
  },
}));

describe("processPendingReminderJobs", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.REMINDER_RETRY_BASE_MS = "1000";
    process.env.REMINDER_WORKER_BATCH_SIZE = "10";
  });

  it("marks job SUCCESS when sending email succeeds", async () => {
    listDueReminderJobsMock.mockResolvedValue([
      {
        id: "j1",
        contractId: "c1",
        recipientEmail: "partner@example.com",
        type: ReminderType.EXPIRING_SOON,
        status: ReminderJobStatus.PENDING,
        attempts: 0,
        maxAttempts: 3,
        payload: {
          contractCode: "CT-1",
          title: "Contract One",
          endDate: "2026-05-01T00:00:00.000Z",
        },
      },
    ]);
    claimReminderJobMock.mockResolvedValue(true);
    sendReminderEmailForJobMock.mockResolvedValue({ success: true });
    updateMock.mockResolvedValue({});

    const result = await processPendingReminderJobs();

    expect(result.success).toBe(1);
    expect(updateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: ReminderJobStatus.SUCCESS,
        }),
      }),
    );
  });

  it("schedules retry when send fails but attempts not exhausted", async () => {
    listDueReminderJobsMock.mockResolvedValue([
      {
        id: "j2",
        contractId: "c1",
        recipientEmail: "partner@example.com",
        type: ReminderType.EXPIRING_SOON,
        status: ReminderJobStatus.FAILED,
        attempts: 1,
        maxAttempts: 3,
        payload: {
          contractCode: "CT-2",
          title: "Contract Two",
          endDate: "2026-05-01T00:00:00.000Z",
        },
      },
    ]);
    claimReminderJobMock.mockResolvedValue(true);
    sendReminderEmailForJobMock.mockResolvedValue({ success: false, errorMessage: "smtp down" });
    updateMock.mockResolvedValue({});

    const result = await processPendingReminderJobs();

    expect(result.retried).toBe(1);
    expect(updateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: ReminderJobStatus.FAILED,
          attempts: 2,
        }),
      }),
    );
  });

  it("moves to DEAD_LETTER when max attempts exhausted", async () => {
    listDueReminderJobsMock.mockResolvedValue([
      {
        id: "j3",
        contractId: "c1",
        recipientEmail: "partner@example.com",
        type: ReminderType.EXPIRED,
        status: ReminderJobStatus.FAILED,
        attempts: 2,
        maxAttempts: 3,
        payload: {
          contractCode: "CT-3",
          title: "Contract Three",
          endDate: "2026-05-01T00:00:00.000Z",
        },
      },
    ]);
    claimReminderJobMock.mockResolvedValue(true);
    sendReminderEmailForJobMock.mockResolvedValue({ success: false, errorMessage: "fatal" });
    updateMock.mockResolvedValue({});

    const result = await processPendingReminderJobs();

    expect(result.deadLettered).toBe(1);
    expect(updateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: ReminderJobStatus.DEAD_LETTER,
          attempts: 3,
        }),
      }),
    );
  });
});
