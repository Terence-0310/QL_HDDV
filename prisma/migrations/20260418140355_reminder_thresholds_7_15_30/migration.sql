-- DropIndex
DROP INDEX "ReminderLog_contractId_reminderType_createdAt_idx";

-- AlterTable
ALTER TABLE "ReminderJob" ADD COLUMN "reminderThresholdDays" INTEGER;

-- AlterTable
ALTER TABLE "ReminderLog" ADD COLUMN "reminderThresholdDays" INTEGER;

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Contract" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "code" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "partnerName" TEXT NOT NULL,
    "partnerEmail" TEXT,
    "description" TEXT,
    "value" REAL NOT NULL,
    "startDate" DATETIME NOT NULL,
    "endDate" DATETIME NOT NULL,
    "signedDate" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "renewalReminderDays" INTEGER NOT NULL DEFAULT 7,
    "reminderOffsets" TEXT NOT NULL DEFAULT '7,15,30',
    "autoRenew" BOOLEAN NOT NULL DEFAULT false,
    "fileUrl" TEXT,
    "fileName" TEXT,
    "originalFileName" TEXT,
    "fileMimeType" TEXT,
    "fileSize" INTEGER,
    "uploadedAt" DATETIME,
    "note" TEXT,
    "ownerId" TEXT NOT NULL,
    "approvalStatus" TEXT NOT NULL DEFAULT 'NOT_SUBMITTED',
    "submittedForApprovalAt" DATETIME,
    "approvedAt" DATETIME,
    "rejectedAt" DATETIME,
    "approvedById" TEXT,
    "rejectionReason" TEXT,
    "parentContractId" TEXT,
    "renewalVersion" INTEGER NOT NULL DEFAULT 1,
    "renewedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Contract_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Contract_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Contract_parentContractId_fkey" FOREIGN KEY ("parentContractId") REFERENCES "Contract" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Contract" ("approvalStatus", "approvedAt", "approvedById", "autoRenew", "code", "createdAt", "description", "endDate", "fileMimeType", "fileName", "fileSize", "fileUrl", "id", "note", "originalFileName", "ownerId", "parentContractId", "partnerEmail", "partnerName", "rejectedAt", "rejectionReason", "renewalReminderDays", "renewalVersion", "renewedAt", "signedDate", "startDate", "status", "submittedForApprovalAt", "title", "updatedAt", "uploadedAt", "value") SELECT "approvalStatus", "approvedAt", "approvedById", "autoRenew", "code", "createdAt", "description", "endDate", "fileMimeType", "fileName", "fileSize", "fileUrl", "id", "note", "originalFileName", "ownerId", "parentContractId", "partnerEmail", "partnerName", "rejectedAt", "rejectionReason", "renewalReminderDays", "renewalVersion", "renewedAt", "signedDate", "startDate", "status", "submittedForApprovalAt", "title", "updatedAt", "uploadedAt", "value" FROM "Contract";
DROP TABLE "Contract";
ALTER TABLE "new_Contract" RENAME TO "Contract";
CREATE UNIQUE INDEX "Contract_code_key" ON "Contract"("code");
CREATE INDEX "Contract_endDate_idx" ON "Contract"("endDate");
CREATE INDEX "Contract_startDate_idx" ON "Contract"("startDate");
CREATE INDEX "Contract_createdAt_idx" ON "Contract"("createdAt");
CREATE INDEX "Contract_autoRenew_idx" ON "Contract"("autoRenew");
CREATE INDEX "Contract_status_idx" ON "Contract"("status");
CREATE INDEX "Contract_ownerId_idx" ON "Contract"("ownerId");
CREATE INDEX "Contract_approvalStatus_idx" ON "Contract"("approvalStatus");
CREATE INDEX "Contract_approvalStatus_submittedForApprovalAt_idx" ON "Contract"("approvalStatus", "submittedForApprovalAt");
CREATE INDEX "Contract_approvedById_idx" ON "Contract"("approvedById");
CREATE INDEX "Contract_parentContractId_idx" ON "Contract"("parentContractId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "ReminderLog_contractId_reminderType_reminderThresholdDays_createdAt_idx" ON "ReminderLog"("contractId", "reminderType", "reminderThresholdDays", "createdAt");
