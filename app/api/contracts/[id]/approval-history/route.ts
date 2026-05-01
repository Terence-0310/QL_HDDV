import { NextRequest } from "next/server";
import { handleRouteError, successResponse } from "@/lib/api-response";
import { requirePermission } from "@/lib/permissions";
import { getApprovalHistory } from "@/services/approval.service";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const authUser = await requirePermission(request, "contract.view");
    const { id } = await context.params;
    const data = await getApprovalHistory(id, authUser);
    return successResponse("Approval history fetched successfully", data);
  } catch (error) {
    return handleRouteError(error);
  }
}
