import { ReminderJobStatus, ReminderType } from "@prisma/client";
import { enqueueReminderJobs } from "@/services/queue/reminder-queue.service";

const transactionMock = vi.fn();
const createMock = vi.fn();

vi.mock("@/lib/prisma", () => ({
  prisma: {
    $transaction: (...args: unknown[]) => transactionMock(...args),
    reminderJob: {
      create: (...args: unknown[]) => createMock(...args),
    },
  },
}));

describe("enqueueReminderJobs", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.REMINDER_MAX_ATTEMPTS = "4";
    transactionMock.mockImplementation(async (ops: Promise<unknown>[]) => Promise.all(ops));
    createMock.mockImplementation(async ({ data }: { data: Record<string, unknown> }) => ({
      id: "job-1",
      ...data,
    }));
  });

  it("creates pending jobs with default queue fields", async () => {
    const jobs = await enqueueReminderJobs([
      {
        contractId: "c1",
        recipientEmail: "partner@example.com",
        type: ReminderType.EXPIRING_SOON,
        payload: { contractCode: "CT-1" },
      },
    ]);

    expect(jobs).toHaveLength(1);
    expect(createMock).toHaveBeenCalledTimes(1);

    const createArg = createMock.mock.calls[0][0];
    expect(createArg.data.status).toBe(ReminderJobStatus.PENDING);
    expect(createArg.data.maxAttempts).toBe(4);
    expect(createArg.data.attempts).toBe(0);
    expect(createArg.data.payload).toEqual({ contractCode: "CT-1" });
  });
});
