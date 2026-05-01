-- CreateIndex
CREATE INDEX "Contract_ownerId_createdAt_idx" ON "Contract"("ownerId", "createdAt");

-- CreateIndex
CREATE INDEX "Contract_ownerId_status_idx" ON "Contract"("ownerId", "status");

-- CreateIndex
CREATE INDEX "Contract_ownerId_approvalStatus_idx" ON "Contract"("ownerId", "approvalStatus");

-- CreateIndex
CREATE INDEX "Contract_status_createdAt_idx" ON "Contract"("status", "createdAt");

-- CreateIndex
CREATE INDEX "Contract_approvalStatus_createdAt_idx" ON "Contract"("approvalStatus", "createdAt");
