import { NextRequest } from "next/server";
import { handleRouteError, successResponse } from "@/lib/api-response";
import { assertCsrf } from "@/lib/csrf";
import { requirePermission } from "@/lib/permissions";
import { assertRateLimit } from "@/lib/rate-limit";
import { approveContract } from "@/services/approval.service";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    assertRateLimit(request, "contracts:approve", { limit: 30, windowMs: 60_000 });
    assertCsrf(request);
    const authUser = await requirePermission(request, "contract.approve");
    const { id } = await context.params;
    const data = await approveContract(id, authUser);
    return successResponse("Contract approved successfully", data);
  } catch (error) {
    return handleRouteError(error);
  }
}
