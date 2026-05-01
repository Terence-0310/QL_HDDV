import { NextRequest } from "next/server";
import { handleRouteError, successResponse } from "@/lib/api-response";
import { assertCsrf } from "@/lib/csrf";
import { requirePermission } from "@/lib/permissions";
import { assertRateLimit } from "@/lib/rate-limit";
import { renewContractSchema } from "@/lib/validators/renewal.validator";
import { renewContract } from "@/services/contract-renewal.service";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    assertRateLimit(request, "contracts:renew", { limit: 20, windowMs: 60_000 });
    assertCsrf(request);
    const authUser = await requirePermission(request, "contract.renew");
    const { id } = await context.params;
    const body = await request.json();
    const parsed = renewContractSchema.parse(body);
    const data = await renewContract(id, parsed, authUser);
    return successResponse("Contract renewed successfully", data, undefined, 201);
  } catch (error) {
    return handleRouteError(error);
  }
}
