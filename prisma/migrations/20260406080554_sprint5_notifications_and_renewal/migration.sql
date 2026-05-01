-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "readAt" DATETIME,
    "relatedEntityType" TEXT,
    "relatedEntityId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

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
    "autoRenew" BOOLEAN NOT NULL DEFAULT false,
    "fileUrl" TEXT,
    "fileName" TEXT,
    "originalFileName" TEXT,
    "fileMimeType" TEXT,
    "fileSize" INTEGER,
    "uploadedAt" DATETIME,
    "note" TEXT,
    "ownerId" TEXT NOT NULL,
    "parentContractId" TEXT,
    "renewalVersion" INTEGER NOT NULL DEFAULT 1,
    "renewedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Contract_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Contract_parentContractId_fkey" FOREIGN KEY ("parentContractId") REFERENCES "Contract" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Contract" ("autoRenew", "code", "createdAt", "description", "endDate", "fileMimeType", "fileName", "fileSize", "fileUrl", "id", "note", "originalFileName", "ownerId", "partnerEmail", "partnerName", "renewalReminderDays", "signedDate", "startDate", "status", "title", "updatedAt", "uploadedAt", "value") SELECT "autoRenew", "code", "createdAt", "description", "endDate", "fileMimeType", "fileName", "fileSize", "fileUrl", "id", "note", "originalFileName", "ownerId", "partnerEmail", "partnerName", "renewalReminderDays", "signedDate", "startDate", "status", "title", "updatedAt", "uploadedAt", "value" FROM "Contract";
DROP TABLE "Contract";
ALTER TABLE "new_Contract" RENAME TO "Contract";
CREATE UNIQUE INDEX "Contract_code_key" ON "Contract"("code");
CREATE INDEX "Contract_endDate_idx" ON "Contract"("endDate");
CREATE INDEX "Contract_status_idx" ON "Contract"("status");
CREATE INDEX "Contract_ownerId_idx" ON "Contract"("ownerId");
CREATE INDEX "Contract_parentContractId_idx" ON "Contract"("parentContractId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "Notification_userId_isRead_createdAt_idx" ON "Notification"("userId", "isRead", "createdAt");

-- CreateIndex
CREATE INDEX "Notification_relatedEntityType_relatedEntityId_idx" ON "Notification"("relatedEntityType", "relatedEntityId");
