/*
  Warnings:

  - You are about to drop the `AuditLog` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ReminderJob` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the column `code` on the `Contract` table. All the data in the column will be lost.
  - You are about to drop the column `endDate` on the `Contract` table. All the data in the column will be lost.
  - You are about to drop the column `ownerId` on the `Contract` table. All the data in the column will be lost.
  - You are about to drop the column `startDate` on the `Contract` table. All the data in the column will be lost.
  - You are about to drop the column `value` on the `Contract` table. All the data in the column will be lost.
  - You are about to drop the column `message` on the `Notification` table. All the data in the column will be lost.
  - You are about to drop the column `name` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `passwordHash` on the `User` table. All the data in the column will be lost.
  - Added the required column `contractCode` to the `Contract` table without a default value. This is not possible if the table is not empty.
  - Added the required column `contractValue` to the `Contract` table without a default value. This is not possible if the table is not empty.
  - Added the required column `createdByUserId` to the `Contract` table without a default value. This is not possible if the table is not empty.
  - Added the required column `effectiveDate` to the `Contract` table without a default value. This is not possible if the table is not empty.
  - Added the required column `expiredDate` to the `Contract` table without a default value. This is not possible if the table is not empty.
  - Added the required column `content` to the `Notification` table without a default value. This is not possible if the table is not empty.
  - Added the required column `fullName` to the `User` table without a default value. This is not possible if the table is not empty.
  - Added the required column `password` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "AuditLog_entityType_entityId_idx";

-- DropIndex
DROP INDEX "AuditLog_entityId_idx";

-- DropIndex
DROP INDEX "AuditLog_entityType_idx";

-- DropIndex
DROP INDEX "AuditLog_userId_idx";

-- DropIndex
DROP INDEX "ReminderJob_contractId_type_createdAt_idx";

-- DropIndex
DROP INDEX "ReminderJob_status_nextAttemptAt_idx";

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "AuditLog";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "ReminderJob";
PRAGMA foreign_keys=on;

-- CreateTable
CREATE TABLE "Partner" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "partnerType" TEXT NOT NULL DEFAULT 'OTHER',
    "taxCode" TEXT,
    "address" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "representative" TEXT,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "ContractType" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "ContractFile" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "contractId" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileType" TEXT,
    "filePath" TEXT NOT NULL,
    "fileSize" INTEGER,
    "description" TEXT,
    "uploadedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ContractFile_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "Contract" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ReminderMilestone" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "contractId" TEXT NOT NULL,
    "recipientEmail" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "maxAttempts" INTEGER NOT NULL DEFAULT 3,
    "reminderDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "nextAttemptAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processingAt" DATETIME,
    "sentAt" DATETIME,
    "errorMessage" TEXT,
    "payload" JSONB,
    "remindBeforeDays" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ReminderMilestone_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "Contract" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ActivityLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT,
    "contractId" TEXT,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "content" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ActivityLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "ActivityLog_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "Contract" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Contract" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "contractCode" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "partnerId" TEXT,
    "contractTypeId" TEXT,
    "partnerName" TEXT NOT NULL,
    "partnerEmail" TEXT,
    "description" TEXT,
    "contractValue" REAL NOT NULL,
    "effectiveDate" DATETIME NOT NULL,
    "expiredDate" DATETIME NOT NULL,
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
    "createdByUserId" TEXT NOT NULL,
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
    CONSTRAINT "Contract_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "Partner" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Contract_contractTypeId_fkey" FOREIGN KEY ("contractTypeId") REFERENCES "ContractType" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Contract_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Contract_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Contract_parentContractId_fkey" FOREIGN KEY ("parentContractId") REFERENCES "Contract" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Contract" ("approvalStatus", "approvedAt", "approvedById", "autoRenew", "createdAt", "description", "fileMimeType", "fileName", "fileSize", "fileUrl", "id", "note", "originalFileName", "parentContractId", "partnerEmail", "partnerName", "rejectedAt", "rejectionReason", "reminderOffsets", "renewalReminderDays", "renewalVersion", "renewedAt", "signedDate", "status", "submittedForApprovalAt", "title", "updatedAt", "uploadedAt") SELECT "approvalStatus", "approvedAt", "approvedById", "autoRenew", "createdAt", "description", "fileMimeType", "fileName", "fileSize", "fileUrl", "id", "note", "originalFileName", "parentContractId", "partnerEmail", "partnerName", "rejectedAt", "rejectionReason", "reminderOffsets", "renewalReminderDays", "renewalVersion", "renewedAt", "signedDate", "status", "submittedForApprovalAt", "title", "updatedAt", "uploadedAt" FROM "Contract";
DROP TABLE "Contract";
ALTER TABLE "new_Contract" RENAME TO "Contract";
CREATE UNIQUE INDEX "Contract_contractCode_key" ON "Contract"("contractCode");
CREATE INDEX "Contract_expiredDate_idx" ON "Contract"("expiredDate");
CREATE INDEX "Contract_effectiveDate_idx" ON "Contract"("effectiveDate");
CREATE INDEX "Contract_createdAt_idx" ON "Contract"("createdAt");
CREATE INDEX "Contract_autoRenew_idx" ON "Contract"("autoRenew");
CREATE INDEX "Contract_status_idx" ON "Contract"("status");
CREATE INDEX "Contract_createdByUserId_idx" ON "Contract"("createdByUserId");
CREATE INDEX "Contract_approvalStatus_idx" ON "Contract"("approvalStatus");
CREATE INDEX "Contract_approvalStatus_submittedForApprovalAt_idx" ON "Contract"("approvalStatus", "submittedForApprovalAt");
CREATE INDEX "Contract_approvedById_idx" ON "Contract"("approvedById");
CREATE INDEX "Contract_parentContractId_idx" ON "Contract"("parentContractId");
CREATE INDEX "Contract_createdByUserId_createdAt_idx" ON "Contract"("createdByUserId", "createdAt");
CREATE INDEX "Contract_createdByUserId_status_idx" ON "Contract"("createdByUserId", "status");
CREATE INDEX "Contract_createdByUserId_approvalStatus_idx" ON "Contract"("createdByUserId", "approvalStatus");
CREATE INDEX "Contract_status_createdAt_idx" ON "Contract"("status", "createdAt");
CREATE INDEX "Contract_approvalStatus_createdAt_idx" ON "Contract"("approvalStatus", "createdAt");
CREATE TABLE "new_Notification" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "readAt" DATETIME,
    "relatedEntityType" TEXT,
    "relatedEntityId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Notification" ("createdAt", "id", "isRead", "readAt", "relatedEntityId", "relatedEntityType", "title", "type", "userId") SELECT "createdAt", "id", "isRead", "readAt", "relatedEntityId", "relatedEntityType", "title", "type", "userId" FROM "Notification";
DROP TABLE "Notification";
ALTER TABLE "new_Notification" RENAME TO "Notification";
CREATE INDEX "Notification_userId_isRead_createdAt_idx" ON "Notification"("userId", "isRead", "createdAt");
CREATE INDEX "Notification_relatedEntityType_relatedEntityId_idx" ON "Notification"("relatedEntityType", "relatedEntityId");
CREATE TABLE "new_User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "username" TEXT,
    "fullName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "password" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'USER',
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_User" ("createdAt", "email", "id", "role", "status", "updatedAt") SELECT "createdAt", "email", "id", "role", "status", "updatedAt" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE INDEX "User_createdAt_idx" ON "User"("createdAt");
CREATE INDEX "User_status_idx" ON "User"("status");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "ReminderMilestone_status_nextAttemptAt_idx" ON "ReminderMilestone"("status", "nextAttemptAt");

-- CreateIndex
CREATE INDEX "ReminderMilestone_contractId_type_createdAt_idx" ON "ReminderMilestone"("contractId", "type", "createdAt");

-- CreateIndex
CREATE INDEX "ActivityLog_userId_idx" ON "ActivityLog"("userId");

-- CreateIndex
CREATE INDEX "ActivityLog_entityType_idx" ON "ActivityLog"("entityType");

-- CreateIndex
CREATE INDEX "ActivityLog_entityId_idx" ON "ActivityLog"("entityId");

-- CreateIndex
CREATE INDEX "ActivityLog_entityType_entityId_idx" ON "ActivityLog"("entityType", "entityId");
