-- CreateIndex
CREATE INDEX "Contract_startDate_idx" ON "Contract"("startDate");

-- CreateIndex
CREATE INDEX "Contract_createdAt_idx" ON "Contract"("createdAt");

-- CreateIndex
CREATE INDEX "Contract_autoRenew_idx" ON "Contract"("autoRenew");

-- CreateIndex
CREATE INDEX "Contract_approvalStatus_submittedForApprovalAt_idx" ON "Contract"("approvalStatus", "submittedForApprovalAt");

-- CreateIndex
CREATE INDEX "User_createdAt_idx" ON "User"("createdAt");

-- CreateIndex
CREATE INDEX "User_status_idx" ON "User"("status");
