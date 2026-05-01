import { NextRequest } from "next/server";
import { handleRouteError, successResponse } from "@/lib/api-response";
import { assertCsrf } from "@/lib/csrf";
import { requirePermission } from "@/lib/permissions";
import { assertRateLimit } from "@/lib/rate-limit";
import { rejectContractSchema } from "@/lib/validators/approval.validator";
import { rejectContract } from "@/services/approval.service";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    assertRateLimit(request, "contracts:reject", { limit: 30, windowMs: 60_000 });
    assertCsrf(request);
    const authUser = await requirePermission(request, "contract.reject");
    const { id } = await context.params;
    const body = await request.json();
    const parsed = rejectContractSchema.parse(body);
    const data = await rejectContract(id, parsed.reason, authUser);
    return successResponse("Contract rejected successfully", data);
  } catch (error) {
    return handleRouteError(error);
  }
}
