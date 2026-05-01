import { NextRequest } from "next/server";
import { handleRouteError, successResponse } from "@/lib/api-response";
import { requirePermission } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { ContractStatus, ApprovalStatus } from "@prisma/client";
import { invalidateCacheByPrefix } from "@/lib/simple-cache";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const authUser = await requirePermission(request, "admin.dashboard.view");
    if (authUser.role !== "ADMIN" && authUser.role !== "SUPER_ADMIN") {
      throw new Error("Only admins can force-update contracts");
    }
    const { id } = await context.params;
    const body = await request.json();
    
    const updateData: any = {};
    if (body.status && Object.values(ContractStatus).includes(body.status)) {
      updateData.status = body.status;
    }
    if (body.approvalStatus && Object.values(ApprovalStatus).includes(body.approvalStatus)) {
      updateData.approvalStatus = body.approvalStatus;
      if (body.approvalStatus === "APPROVED") updateData.approvedAt = new Date();
      if (body.approvalStatus === "REJECTED") updateData.rejectedAt = new Date();
    }
    if (typeof body.autoRenew === "boolean") {
      updateData.autoRenew = body.autoRenew;
    }

    const updated = await prisma.contract.update({
      where: { id },
      data: updateData
    });

    invalidateCacheByPrefix("contracts:list");
    invalidateCacheByPrefix("admin:contracts:list");

    return successResponse("Contract force-updated successfully", updated);
  } catch (error) {
    return handleRouteError(error);
  }
}
