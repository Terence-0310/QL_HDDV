-- CreateIndex
CREATE INDEX "ReminderLog_contractId_reminderType_createdAt_idx" ON "ReminderLog"("contractId", "reminderType", "createdAt");
