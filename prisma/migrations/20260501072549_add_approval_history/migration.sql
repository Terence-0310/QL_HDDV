-- CreateTable
CREATE TABLE "ContractApprovalHistory" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "contractId" TEXT NOT NULL,
    "actorId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "reason" TEXT,
    "step" INTEGER NOT NULL DEFAULT 1,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ContractApprovalHistory_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "Contract" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ContractApprovalHistory_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "ContractApprovalHistory_contractId_createdAt_idx" ON "ContractApprovalHistory"("contractId", "createdAt");

-- CreateIndex
CREATE INDEX "ContractApprovalHistory_actorId_idx" ON "ContractApprovalHistory"("actorId");
